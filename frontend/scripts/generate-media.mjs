/**
 * Generates the product imagery this build ships with.
 *
 * Why generate rather than ship stock photos: the gallery's zoom lens is only
 * honest if there is a genuinely higher-resolution source behind it, and
 * `next/image` can only be exercised properly against real raster files with
 * real dimensions. Procedural PNGs give us both, with no network dependency and
 * no licensing question — and they read as deliberate studio stand-ins rather
 * than broken images.
 *
 * Pure Node: a small PNG encoder over zlib, plus signed-distance-field shape
 * rasterisation for clean antialiased edges. No image libraries.
 *
 *   node scripts/generate-media.mjs
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA_DIR = join(ROOT, 'public', 'media');
const ICON_DIR = join(ROOT, 'public', 'icons');

/* ============================================================ PNG encoding */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Encodes an RGB canvas (opaque; alpha is composited during drawing). */
function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Filter type 1 (Sub) on every scanline: these images are dominated by
  // smooth horizontal gradients, so differencing against the left neighbour
  // compresses far better than storing raw bytes.
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const outRow = y * (stride + 1);
    raw[outRow] = 1;
    const inRow = y * stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= 3 ? rgb[inRow + x - 3] : 0;
      raw[outRow + 1 + x] = (rgb[inRow + x] - left) & 0xff;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ============================================================ canvas + draw */

function createCanvas(width, height) {
  return { width, height, data: new Uint8ClampedArray(width * height * 3) };
}

function blend(canvas, x, y, r, g, b, a) {
  if (a <= 0 || x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
  const i = (y * canvas.width + x) * 3;
  const d = canvas.data;
  if (a >= 1) {
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
    return;
  }
  d[i] = d[i] + (r - d[i]) * a;
  d[i + 1] = d[i + 1] + (g - d[i + 1]) * a;
  d[i + 2] = d[i + 2] + (b - d[i + 2]) * a;
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (t) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const mix = (a, b, t) => a + (b - a) * t;
const mixRgb = (c1, c2, t) => [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)];

function hex(value) {
  const n = parseInt(value.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The inverse of `hex` — an RGB triple back to a `#rrggbb` string. */
function toHex(rgb) {
  return (
    '#' +
    rgb
      .map((c) => Math.round(clamp01(c / 255) * 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

/** Deterministic value noise — grain, so flat fills do not band. */
function noise2(x, y, seed) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.7581) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Rasterises a signed distance field. `sdf(x, y)` returns the distance in
 * pixels (negative inside), `shade(x, y, d)` returns `[r, g, b, a]`.
 * Coverage from the distance gives a clean one-pixel antialiased edge without
 * supersampling the whole canvas.
 */
function fillSdf(canvas, bounds, sdf, shade) {
  const x0 = Math.max(0, Math.floor(bounds[0]));
  const y0 = Math.max(0, Math.floor(bounds[1]));
  const x1 = Math.min(canvas.width - 1, Math.ceil(bounds[2]));
  const y1 = Math.min(canvas.height - 1, Math.ceil(bounds[3]));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = sdf(x + 0.5, y + 0.5);
      const coverage = clamp01(0.5 - d);
      if (coverage <= 0) continue;
      const [r, g, b, a] = shade(x + 0.5, y + 0.5, d);
      blend(canvas, x, y, r, g, b, a * coverage);
    }
  }
}

const sdRoundRect = (cx, cy, hw, hh, radius) => (x, y) => {
  const qx = Math.abs(x - cx) - (hw - radius);
  const qy = Math.abs(y - cy) - (hh - radius);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(ax, ay) - radius;
};

const sdEllipse = (cx, cy, rx, ry) => (x, y) => {
  // Approximate but stable for the aspect ratios used here.
  const nx = (x - cx) / rx;
  const ny = (y - cy) / ry;
  return (Math.hypot(nx, ny) - 1) * Math.min(rx, ry);
};

/**
 * Soft contact shadow. A single smooth radial falloff rather than stacked
 * ellipses — stacking put a visible ring wherever a layer's edge landed, which
 * reads as a rendering artefact against an otherwise clean sweep.
 */
function drawShadow(canvas, cx, cy, rx, ry, strength, tint) {
  const spread = 1.9;
  const sx = rx * spread;
  const sy = ry * spread;

  const x0 = Math.max(0, Math.floor(cx - sx - 2));
  const y0 = Math.max(0, Math.floor(cy - sy - 2));
  const x1 = Math.min(canvas.width - 1, Math.ceil(cx + sx + 2));
  const y1 = Math.min(canvas.height - 1, Math.ceil(cy + sy + 2));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - cx) / sx;
      const ny = (y + 0.5 - cy) / sy;
      const d = Math.hypot(nx, ny);
      if (d >= 1) continue;
      // Squared smoothstep: dense under the object, feathering to nothing.
      const f = smoothstep(1 - d);
      blend(canvas, x, y, tint[0], tint[1], tint[2], strength * f * f);
    }
  }
}

/* ============================================================== backgrounds */

/** Studio sweep: vertical gradient, soft top-left key light, floor, grain. */
function paintStudio(canvas, palette, seed) {
  const { width: w, height: h } = canvas;
  const top = hex(palette.bgTop);
  const bottom = hex(palette.bgBottom);
  const key = hex(palette.key);
  const horizon = h * 0.72;

  for (let y = 0; y < h; y++) {
    const vt = y / h;
    for (let x = 0; x < w; x++) {
      let c = mixRgb(top, bottom, smoothstep(vt * 1.1));

      // Key light falling from upper left.
      const kd = Math.hypot((x - w * 0.26) / (w * 0.72), (y - h * 0.16) / (h * 0.72));
      c = mixRgb(c, key, clamp01(1 - kd) * 0.5);

      // Floor plane, slightly darker and cooler than the sweep behind it.
      if (y > horizon) {
        const fd = smoothstep((y - horizon) / (h - horizon));
        c = mixRgb(c, mixRgb(c, hex(palette.floor), 0.85), fd * 0.9);
      }

      // Just enough dither to break 8-bit gradient banding. Heavier grain
      // looked no better and roughly tripled the encoded size, because random
      // per-pixel noise is exactly what a deflate stream cannot compress.
      const grain = (noise2(x, y, seed) - 0.5) * 1.6;

      const i = (y * w + x) * 3;
      canvas.data[i] = c[0] + grain;
      canvas.data[i + 1] = c[1] + grain;
      canvas.data[i + 2] = c[2] + grain;
    }
  }
}

/* ================================================================= products */

/**
 * A body with a directional shading ramp and a specular sheen, so a flat
 * silhouette reads as a lit object rather than a sticker.
 */
function shadeBody(cx, cy, hw, hh, base, light, dark, sheen) {
  const baseC = hex(base);
  const lightC = hex(light);
  const darkC = hex(dark);
  return (x, y, d) => {
    const u = (x - cx) / hw;
    const v = (y - cy) / hh;

    const ramp = clamp01(0.5 - (u * 0.42 + v * 0.62));
    let c = mixRgb(baseC, lightC, smoothstep(ramp) * 0.85);
    c = mixRgb(c, darkC, smoothstep(clamp01(u * 0.5 + v * 0.7)) * 0.7);

    // Rim light on the far edge.
    const rim = smoothstep(clamp01((d + 7) / 7)) * clamp01(u * 0.6 + v * 0.5 + 0.35);
    c = mixRgb(c, lightC, rim * 0.5);

    if (sheen) {
      const s = clamp01(1 - Math.hypot(u + 0.42, v + 0.5) * 1.5);
      c = mixRgb(c, [255, 255, 255], smoothstep(s) * sheen);
    }

    return [c[0], c[1], c[2], 1];
  };
}

function drawSeam(canvas, cx, hw, y, colour, alpha) {
  fillSdf(
    canvas,
    [cx - hw, y - 3, cx + hw, y + 3],
    sdRoundRect(cx, y, hw * 0.94, 1.1, 1.1),
    () => [...hex(colour), alpha],
  );
}

/** Earbud charging case, closed. The hero silhouette. */
function drawEarbudCase(canvas, cx, cy, size, palette, opts = {}) {
  const hw = size * 0.5;
  const hh = size * 0.42;
  const radius = size * 0.19;

  drawShadow(canvas, cx, cy + hh * 0.95, hw * 0.86, hh * 0.2, 0.5, palette.shadow);

  fillSdf(
    canvas,
    [cx - hw - 2, cy - hh - 2, cx + hw + 2, cy + hh + 2],
    sdRoundRect(cx, cy, hw, hh, radius),
    shadeBody(cx, cy, hw, hh, palette.body, palette.bodyLight, palette.bodyDark, 0.3),
  );

  drawSeam(canvas, cx, hw, cy - hh * 0.34, palette.bodyDark, 0.55);

  fillSdf(
    canvas,
    [cx - hw * 0.2, cy + hh * 0.42, cx + hw * 0.2, cy + hh * 0.72],
    sdRoundRect(cx, cy + hh * 0.57, hw * 0.13, hh * 0.055, hh * 0.055),
    () => [...hex(palette.bodyDark), 0.85],
  );

  if (opts.led) {
    const lx = cx;
    const ly = cy + hh * 0.14;
    fillSdf(canvas, [lx - 30, ly - 30, lx + 30, ly + 30], sdEllipse(lx, ly, 22, 22), (x, y) => {
      const t = clamp01(1 - Math.hypot(x - lx, y - ly) / 22);
      return [...hex(palette.accent), smoothstep(t) * 0.35];
    });
    fillSdf(canvas, [lx - 12, ly - 12, lx + 12, ly + 12], sdEllipse(lx, ly, 6, 6), () => [
      ...hex(palette.accent),
      1,
    ]);
  }
}

/** A single earbud: body plus stem. */
function drawEarbud(canvas, cx, cy, size, palette, flip = false) {
  const r = size * 0.5;
  const dir = flip ? -1 : 1;

  drawShadow(canvas, cx, cy + r * 1.15, r * 0.8, r * 0.18, 0.4, palette.shadow);

  fillSdf(
    canvas,
    [cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2],
    sdEllipse(cx, cy, r, r * 0.95),
    shadeBody(cx, cy, r, r, palette.body, palette.bodyLight, palette.bodyDark, 0.42),
  );

  const stemW = r * 0.32;
  const stemH = r * 0.95;
  const sx = cx + dir * r * 0.34;
  const sy = cy + r * 0.92;
  fillSdf(
    canvas,
    [sx - stemW - 2, sy - stemH - 2, sx + stemW + 2, sy + stemH + 2],
    sdRoundRect(sx, sy, stemW, stemH, stemW),
    shadeBody(sx, sy, stemW, stemH, palette.body, palette.bodyLight, palette.bodyDark, 0.3),
  );

  fillSdf(
    canvas,
    [cx - r, cy - r, cx + r, cy + r],
    sdEllipse(cx - dir * r * 0.2, cy - r * 0.1, r * 0.3, r * 0.3),
    () => [...hex(palette.bodyDark), 0.75],
  );
}

/** Garment silhouette — apparel listings. */
function drawGarment(canvas, cx, cy, size, palette) {
  const hw = size * 0.34;
  const hh = size * 0.46;

  drawShadow(canvas, cx, cy + hh * 1.02, hw, hh * 0.12, 0.4, palette.shadow);

  const bodySdf = (x, y) => {
    const t = clamp01((y - (cy - hh)) / (hh * 2));
    const halfWidth = mix(hw * 0.62, hw, smoothstep(t));
    const dx = Math.abs(x - cx) - halfWidth + 14;
    const dy = Math.abs(y - cy) - hh + 14;
    return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) - 14;
  };

  for (const dir of [-1, 1]) {
    const sx = cx + dir * hw * 0.82;
    const sy = cy - hh * 0.5;
    fillSdf(
      canvas,
      [sx - hw * 0.4, sy - hh * 0.25, sx + hw * 0.4, sy + hh * 0.5],
      sdRoundRect(sx, sy + hh * 0.12, hw * 0.24, hh * 0.3, hw * 0.16),
      shadeBody(sx, sy, hw * 0.24, hh * 0.3, palette.bodyDark, palette.body, palette.bodyDark, 0.1),
    );
  }

  fillSdf(
    canvas,
    [cx - hw - 4, cy - hh - 4, cx + hw + 4, cy + hh + 4],
    bodySdf,
    shadeBody(cx, cy, hw, hh, palette.body, palette.bodyLight, palette.bodyDark, 0.16),
  );

  fillSdf(
    canvas,
    [cx - hw * 0.4, cy - hh - 6, cx + hw * 0.4, cy - hh * 0.6],
    sdEllipse(cx, cy - hh * 0.98, hw * 0.28, hh * 0.16),
    () => [...hex(palette.bgBottom), 1],
  );

  // Block-print motif — regular, hand-blocked spacing.
  const step = size * 0.085;
  for (let y = cy - hh * 0.72; y < cy + hh * 0.86; y += step) {
    for (let x = cx - hw * 0.86; x < cx + hw * 0.86; x += step) {
      const offset = (Math.round((y - cy) / step) % 2) * step * 0.5;
      const px = x + offset;
      if (bodySdf(px, y) > -10) continue;
      fillSdf(canvas, [px - 9, y - 9, px + 9, y + 9], sdEllipse(px, y, 4.6, 4.6), () => [
        ...hex(palette.accent),
        0.72,
      ]);
    }
  }
}

/** Flat LED panel with an emitted glow. */
function drawPanel(canvas, cx, cy, size, palette) {
  const r = size * 0.4;

  fillSdf(
    canvas,
    [cx - r * 2.2, cy - r * 2.2, cx + r * 2.2, cy + r * 2.2],
    sdEllipse(cx, cy, r * 2.1, r * 2.1),
    (x, y) => {
      const t = clamp01(1 - Math.hypot(x - cx, y - cy) / (r * 2.1));
      return [255, 250, 235, smoothstep(t) * 0.42];
    },
  );

  drawShadow(canvas, cx, cy + r * 1.12, r * 0.9, r * 0.16, 0.34, palette.shadow);

  fillSdf(
    canvas,
    [cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8],
    (x, y) => {
      const d = Math.hypot(x - cx, y - cy);
      return Math.max(d - r * 1.06, r * 0.93 - d);
    },
    shadeBody(cx, cy, r, r, palette.body, palette.bodyLight, palette.bodyDark, 0.3),
  );

  fillSdf(canvas, [cx - r, cy - r, cx + r, cy + r], sdEllipse(cx, cy, r * 0.94, r * 0.94), (x, y) => {
    const t = clamp01(1 - Math.hypot(x - cx, y - cy) / (r * 0.94));
    const c = mixRgb(hex(palette.bodyDark), [255, 253, 244], smoothstep(t * 1.3));
    return [c[0], c[1], c[2], 1];
  });
}

/** Tall rounded case with camera cutouts — phone accessory listings. */
function drawPhoneCase(canvas, cx, cy, size, palette) {
  const hw = size * 0.26;
  const hh = size * 0.5;

  drawShadow(canvas, cx, cy + hh * 1.02, hw * 1.1, hh * 0.1, 0.42, palette.shadow);

  fillSdf(
    canvas,
    [cx - hw - 4, cy - hh - 4, cx + hw + 4, cy + hh + 4],
    sdRoundRect(cx, cy, hw, hh, size * 0.075),
    shadeBody(cx, cy, hw, hh, palette.body, palette.bodyLight, palette.bodyDark, 0.36),
  );

  const ix = cx - hw * 0.34;
  const iy = cy - hh * 0.66;
  fillSdf(
    canvas,
    [ix - hw * 0.6, iy - hh * 0.24, ix + hw * 0.6, iy + hh * 0.24],
    sdRoundRect(ix, iy, hw * 0.42, hh * 0.15, size * 0.03),
    () => [...hex(palette.bodyDark), 0.55],
  );
  for (let i = 0; i < 2; i++) {
    const lx = ix - hw * 0.16 + i * hw * 0.34;
    fillSdf(
      canvas,
      [lx - hw * 0.2, iy - hw * 0.2, lx + hw * 0.2, iy + hw * 0.2],
      sdEllipse(lx, iy, hw * 0.13, hw * 0.13),
      () => [18, 20, 26, 0.9],
    );
  }
}

/* ------------------------------------------------------------ convex quads */

const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const scale = (a, k) => [a[0] * k, a[1] * k];
const lerp2 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t)];

/**
 * Signed distance to a convex polygon, as the maximum of its edge half-planes.
 * Exact along edges (which is where antialiasing matters) and conservative at
 * corners, which is all the box faces need.
 */
function sdConvex(points) {
  // Winding-agnostic: with the wrong winding every normal points inward, the
  // max goes positive everywhere and the shape silently fails to draw. Deriving
  // the sign from the signed area removes that as a possible caller mistake.
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const q = points[(i + 1) % points.length];
    area += p[0] * q[1] - q[0] * p[1];
  }
  const sign = area < 0 ? -1 : 1;

  const edges = points.map((p, i) => {
    const q = points[(i + 1) % points.length];
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const len = Math.hypot(ex, ey) || 1;
    return { px: p[0], py: p[1], nx: (sign * ey) / len, ny: (-sign * ex) / len };
  });

  return (x, y) => {
    let d = -Infinity;
    for (const e of edges) {
      d = Math.max(d, (x - e.px) * e.nx + (y - e.py) * e.ny);
    }
    return d;
  };
}

function quadBounds(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [Math.min(...xs) - 2, Math.min(...ys) - 2, Math.max(...xs) + 2, Math.max(...ys) + 2];
}

/** Flat-shaded quad face with a gentle gradient along its own basis. */
function fillFace(canvas, points, colour, colourEnd) {
  const c1 = hex(colour);
  const c2 = hex(colourEnd ?? colour);
  const bounds = quadBounds(points);
  const [minX, minY, maxX, maxY] = bounds;
  fillSdf(canvas, bounds, sdConvex(points), (x, y) => {
    const t = clamp01(((x - minX) / (maxX - minX)) * 0.45 + ((y - minY) / (maxY - minY)) * 0.55);
    const c = mixRgb(c1, c2, smoothstep(t));
    return [c[0], c[1], c[2], 1];
  });
}

/**
 * Shipping carton in isometric projection — the packaging shot every wholesale
 * listing needs, because a buyer ordering 500 pieces is also buying five
 * cartons and needs to picture what turns up.
 *
 * Three faces from one basis: `u` runs right-and-down, `v` left-and-down, and
 * `k` straight down for height. Drawn top, left, right so the near faces
 * overlap correctly without a depth buffer.
 */
function drawCarton(canvas, cx, cy, size, palette) {
  const w = size * 0.34; // half-width along each horizontal axis
  const rise = size * 0.17; // vertical component of a horizontal step
  const height = size * 0.42;

  const u = [w, rise];
  const v = [-w, rise];
  const k = [0, height];

  const apex = [cx, cy - size * 0.3]; // topmost corner
  const left = add(apex, v);
  const right = add(apex, u);
  const front = add(add(apex, u), v);

  drawShadow(canvas, cx, front[1] + height * 0.06, w * 1.15, rise * 0.8, 0.45, palette.shadow);

  // Tinted toward the palette's body colour rather than a single fixed brown,
  // so a cookware listing and a hand-tool listing do not ship the identical
  // carton photo — the one thing every "this product has no bespoke
  // illustration" stand-in must not do. The mix stays anchored to a kraft base
  // so the box still reads as corrugated board, not a flat colour swatch.
  const kraftBase = hex('#cb9c64');
  const tint = mixRgb(kraftBase, hex(palette.body), 0.5);
  const kraft = toHex(tint);
  const kraftLight = toHex(mixRgb(tint, [255, 255, 255], 0.34));
  const kraftMid = toHex(mixRgb(tint, [0, 0, 0], 0.1));
  const kraftDark = toHex(mixRgb(tint, [0, 0, 0], 0.26));
  const kraftDeep = toHex(mixRgb(tint, [0, 0, 0], 0.42));

  // Top face — catches the key light.
  fillFace(canvas, [apex, right, front, left], kraftLight, kraft);
  // Left face — mid tone.
  fillFace(canvas, [left, front, add(front, k), add(left, k)], kraft, kraftMid);
  // Right face — turned away from the light.
  fillFace(canvas, [front, right, add(right, k), add(front, k)], kraftDark, kraftDeep);

  /**
   * Every decal is placed in the basis of the face it sits on, otherwise it
   * slides off the silhouette. The top face is spanned by `u` and `v`; the left
   * face by `u` and `k`; the right face by `-v` and `k`.
   */

  // Packing tape along the top seam: runs parallel to `u`, its width across `v`.
  const seamStart = add(apex, scale(v, 0.5));
  const tapeW = scale(v, 0.075);
  fillFace(
    canvas,
    [
      add(seamStart, tapeW),
      add(add(seamStart, u), tapeW),
      add(add(seamStart, u), scale(tapeW, -1)),
      add(seamStart, scale(tapeW, -1)),
    ],
    '#efe9da',
    '#ded6c2',
  );

  // Shipping label on the left face: spanned by `u` (rightward) and `k` (down).
  const labelOrigin = add(add(left, scale(u, 0.16)), scale(k, 0.2));
  const lw = scale(u, 0.52);
  const lh = scale(k, 0.36);
  fillFace(
    canvas,
    [labelOrigin, add(labelOrigin, lw), add(add(labelOrigin, lw), lh), add(labelOrigin, lh)],
    '#fbfaf6',
    '#efece4',
  );

  // Address lines — ragged lengths, the way a real consignment label reads.
  [0.84, 0.62, 0.74, 0.46].forEach((len, i) => {
    const a = add(add(labelOrigin, scale(lw, 0.1)), scale(lh, 0.18 + i * 0.2));
    const b = add(a, scale(lw, len * 0.78));
    const thick = scale(k, 0.012);
    fillFace(canvas, [a, b, add(b, thick), add(a, thick)], '#6b6357', '#6b6357');
  });

  // Handling stripe on the right face, so the two shaded faces are not twins.
  const faceRight = scale(v, -1); // front → right
  const stripeOrigin = add(add(front, scale(faceRight, 0.18)), scale(k, 0.56));
  const sw = scale(faceRight, 0.6);
  const sh = scale(k, 0.085);
  fillFace(
    canvas,
    [stripeOrigin, add(stripeOrigin, sw), add(add(stripeOrigin, sw), sh), add(stripeOrigin, sh)],
    '#c8543a',
    '#a8402b',
  );
}

/* ============================================================== compositing */

const PALETTES = {
  earbudsBlack: {
    bgTop: '#f4f6f9',
    bgBottom: '#dfe4ec',
    floor: '#cdd4de',
    key: '#ffffff',
    shadow: [26, 32, 44],
    body: '#22262e',
    bodyLight: '#5b6472',
    bodyDark: '#101318',
    accent: '#f0b429',
  },
  earbudsWhite: {
    bgTop: '#f7f5f2',
    bgBottom: '#e6e2dc',
    floor: '#d5d0c8',
    key: '#ffffff',
    shadow: [46, 40, 34],
    body: '#f2f0ec',
    bodyLight: '#ffffff',
    bodyDark: '#bdb8b0',
    accent: '#f0b429',
  },
  kurti: {
    bgTop: '#f6f3ee',
    bgBottom: '#e4ded4',
    floor: '#d3ccbf',
    key: '#fffdf8',
    shadow: [52, 44, 34],
    body: '#1d5c68',
    bodyLight: '#3d8b98',
    bodyDark: '#123f49',
    accent: '#e8d5a8',
  },
  led: {
    bgTop: '#eef1f6',
    bgBottom: '#d8dde6',
    floor: '#c7cdd8',
    key: '#ffffff',
    shadow: [30, 36, 48],
    body: '#e8ebf0',
    bodyLight: '#ffffff',
    bodyDark: '#a9b0bc',
    accent: '#ffd88a',
  },
  phoneCase: {
    bgTop: '#f2f4f8',
    bgBottom: '#dde2ea',
    floor: '#ccd2dc',
    key: '#ffffff',
    shadow: [28, 34, 46],
    body: '#2f6bff',
    bodyLight: '#7fa4ff',
    bodyDark: '#1c3f9e',
    accent: '#ffffff',
  },

  // The four below exist only to tint the carton in `drawCarton` — see the
  // comment on the `card-*.png` job list — so their `body` is what matters;
  // the rest of the fields just keep the background sweep consistent with
  // everything else.
  toolMetal: {
    bgTop: '#f2f4f6',
    bgBottom: '#dde2e6',
    floor: '#ccd3d9',
    key: '#ffffff',
    shadow: [24, 30, 36],
    body: '#5b6b78',
    bodyLight: '#8b9aa6',
    bodyDark: '#33404a',
    accent: '#d8dee3',
  },
  ironRust: {
    bgTop: '#f7f2ee',
    bgBottom: '#ece1d8',
    floor: '#ddccbe',
    key: '#fff8f0',
    shadow: [40, 28, 20],
    body: '#b0522c',
    bodyLight: '#d9865a',
    bodyDark: '#7a3418',
    accent: '#f4c9a8',
  },
  sportsGreen: {
    bgTop: '#f1f6f2',
    bgBottom: '#dde8e0',
    floor: '#c9d9cd',
    key: '#ffffff',
    shadow: [20, 36, 28],
    body: '#2f8f5b',
    bodyLight: '#6cc491',
    bodyDark: '#1c5c39',
    accent: '#cdeedb',
  },
  jewelPlum: {
    bgTop: '#f6f2f5',
    bgBottom: '#e8dde5',
    floor: '#d6c5d1',
    key: '#fff8fc',
    shadow: [38, 22, 34],
    body: '#7a3364',
    bodyLight: '#b06d9c',
    bodyDark: '#4a1c3c',
    accent: '#e9c9dd',
  },
};

/**
 * Six shot types, because a wholesale listing needs more than six angles of
 * the same thing: the hero, a three-quarter, an open/detail view, a colour
 * variant, a macro crop, and the carton.
 */
function composeShot(size, kind, shot, palette, seed) {
  const canvas = createCanvas(size, size);
  paintStudio(canvas, palette, seed);

  const cx = size * 0.5;
  const cy = size * 0.5;

  const draw = {
    earbuds: (s, x, y, extra) => drawEarbudCase(canvas, x, y, s, palette, extra),
    garment: (s, x, y) => drawGarment(canvas, x, y, s, palette),
    panel: (s, x, y) => drawPanel(canvas, x, y, s, palette),
    phoneCase: (s, x, y) => drawPhoneCase(canvas, x, y, s, palette),
  }[kind];

  switch (shot) {
    case 'hero':
      draw(size * 0.62, cx, cy, { led: true });
      break;

    case 'three-quarter':
      draw(size * 0.52, cx - size * 0.06, cy + size * 0.02, {});
      if (kind === 'earbuds') {
        drawEarbud(canvas, cx + size * 0.26, cy + size * 0.04, size * 0.2, palette, false);
      }
      break;

    case 'detail':
      if (kind === 'earbuds') {
        draw(size * 0.56, cx, cy + size * 0.12, {});
        drawEarbud(canvas, cx - size * 0.14, cy - size * 0.16, size * 0.17, palette, true);
        drawEarbud(canvas, cx + size * 0.14, cy - size * 0.16, size * 0.17, palette, false);
      } else {
        draw(size * 0.92, cx, cy, {});
      }
      break;

    case 'variant':
      draw(size * 0.6, cx, cy, { led: false });
      break;

    case 'macro':
      // A tight crop reads as an inspection shot — the thing zoom is for.
      draw(size * 1.35, cx + size * 0.1, cy + size * 0.18, {});
      break;

    case 'carton':
      drawCarton(canvas, cx, cy - size * 0.04, size * 0.78, palette);
      break;
  }

  return canvas;
}

/* ==================================================================== icons */

/** Maskable PWA icon: the ArcB2B mark on the brand orange. */
function composeIcon(size) {
  const canvas = createCanvas(size, size);
  const bg = hex('#0f766e');
  const bgDark = hex('#0b5c56');

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = mixRgb(bg, bgDark, smoothstep((x / size) * 0.5 + (y / size) * 0.7));
      const i = (y * size + x) * 3;
      canvas.data[i] = c[0];
      canvas.data[i + 1] = c[1];
      canvas.data[i + 2] = c[2];
    }
  }

  const s = size / 100;
  const white = [255, 255, 255, 1];
  const legs = [
    { x1: 50, y1: 28, x2: 33, y2: 72 },
    { x1: 50, y1: 28, x2: 67, y2: 72 },
  ];
  for (const leg of legs) {
    const ax = leg.x1 * s;
    const ay = leg.y1 * s;
    const bx = leg.x2 * s;
    const by = leg.y2 * s;
    const half = 5.5 * s;
    fillSdf(
      canvas,
      [Math.min(ax, bx) - half - 2, ay - half - 2, Math.max(ax, bx) + half + 2, by + half + 2],
      (x, y) => {
        const vx = bx - ax;
        const vy = by - ay;
        const t = clamp01(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy));
        return Math.hypot(x - (ax + vx * t), y - (ay + vy * t)) - half;
      },
      () => white,
    );
  }
  fillSdf(
    canvas,
    [36 * s, 52 * s, 64 * s, 66 * s],
    sdRoundRect(50 * s, 59 * s, 11 * s, 4.6 * s, 4.6 * s),
    () => white,
  );

  return canvas;
}

/* ===================================================================== main */

const GALLERY = 1200; // genuine 2.4x source for the zoom lens
const CARD = 800;
const REVIEW = 640;

const JOBS = [
  // Hero product — TWS earbuds
  { file: 'earbuds-01.png', size: GALLERY, kind: 'earbuds', shot: 'hero', palette: 'earbudsBlack', seed: 11 },
  { file: 'earbuds-02.png', size: GALLERY, kind: 'earbuds', shot: 'three-quarter', palette: 'earbudsBlack', seed: 12 },
  { file: 'earbuds-03.png', size: GALLERY, kind: 'earbuds', shot: 'detail', palette: 'earbudsBlack', seed: 13 },
  { file: 'earbuds-04.png', size: GALLERY, kind: 'earbuds', shot: 'variant', palette: 'earbudsWhite', seed: 14 },
  { file: 'earbuds-05.png', size: GALLERY, kind: 'earbuds', shot: 'macro', palette: 'earbudsBlack', seed: 15 },
  { file: 'earbuds-06.png', size: GALLERY, kind: 'earbuds', shot: 'carton', palette: 'earbudsBlack', seed: 16 },
  { file: 'earbuds-poster.png', size: GALLERY, kind: 'earbuds', shot: 'three-quarter', palette: 'earbudsWhite', seed: 17 },

  // Apparel
  { file: 'kurti-01.png', size: GALLERY, kind: 'garment', shot: 'hero', palette: 'kurti', seed: 21 },
  { file: 'kurti-02.png', size: GALLERY, kind: 'garment', shot: 'detail', palette: 'kurti', seed: 22 },
  { file: 'kurti-03.png', size: GALLERY, kind: 'garment', shot: 'carton', palette: 'kurti', seed: 23 },

  // LED panel
  { file: 'led-01.png', size: GALLERY, kind: 'panel', shot: 'hero', palette: 'led', seed: 31 },
  { file: 'led-02.png', size: GALLERY, kind: 'panel', shot: 'macro', palette: 'led', seed: 32 },

  // Phone case
  { file: 'case-01.png', size: GALLERY, kind: 'phoneCase', shot: 'hero', palette: 'phoneCase', seed: 41 },
  { file: 'case-02.png', size: GALLERY, kind: 'phoneCase', shot: 'three-quarter', palette: 'phoneCase', seed: 42 },

  // Rail cards — smaller, they never display large
  { file: 'card-cable.png', size: CARD, kind: 'phoneCase', shot: 'variant', palette: 'earbudsBlack', seed: 51 },
  { file: 'card-packaging.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'earbudsWhite', seed: 52 },
  { file: 'card-speaker.png', size: CARD, kind: 'panel', shot: 'hero', palette: 'earbudsBlack', seed: 53 },
  { file: 'card-powerbank.png', size: CARD, kind: 'phoneCase', shot: 'hero', palette: 'earbudsBlack', seed: 54 },
  { file: 'card-smartwatch.png', size: CARD, kind: 'panel', shot: 'variant', palette: 'phoneCase', seed: 55 },
  { file: 'card-tripod.png', size: CARD, kind: 'phoneCase', shot: 'macro', palette: 'led', seed: 56 },

  // New wholesale categories — home & kitchen, beauty, stationery, footwear,
  // toys, hardware, auto, sports, jewellery, textiles, apparel.
  //
  // The `carton` shot is kind-agnostic (it always draws a generic shipping
  // carton, ignoring `kind` entirely) — which makes it the one truly neutral
  // stand-in this generator has. `garment`, `phoneCase` and `panel` all carry
  // recognisable, specific silhouettes (a shirt, a phone with camera cutouts, a
  // glowing disc), so reusing one of those for an unrelated department — a
  // camera-dotted "phone" standing in for a skincare bottle, say — reads as a
  // mismatched asset, not a tasteful abstraction. Only the two genuine textile
  // items below (fabric, a kids' t-shirt) use the garment silhouette, because
  // that shape actually is the category. Everything else gets a carton, which
  // is also the honest choice for a site whose whole pricing model is
  // carton-quantity anyway.
  { file: 'card-cookware.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'toolMetal', seed: 71 },
  { file: 'card-skincare.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'earbudsWhite', seed: 72 },
  { file: 'card-notebook.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'kurti', seed: 73 },
  { file: 'card-backpack.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'phoneCase', seed: 74 },
  { file: 'card-blocks.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'led', seed: 75 },
  { file: 'card-toolkit.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'earbudsBlack', seed: 76 },
  { file: 'card-fasteners.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'ironRust', seed: 77 },
  { file: 'card-caraccessory.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'earbudsBlack', seed: 78 },
  { file: 'card-dumbbell.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'sportsGreen', seed: 79 },
  { file: 'card-watch.png', size: CARD, kind: 'earbuds', shot: 'carton', palette: 'jewelPlum', seed: 80 },
  { file: 'card-fabric.png', size: CARD, kind: 'garment', shot: 'hero', palette: 'kurti', seed: 81 },
  { file: 'card-kidstshirt.png', size: CARD, kind: 'garment', shot: 'hero', palette: 'earbudsWhite', seed: 82 },

  // Buyer-submitted review photos
  { file: 'review-01.png', size: REVIEW, kind: 'earbuds', shot: 'three-quarter', palette: 'earbudsBlack', seed: 61 },
  { file: 'review-02.png', size: REVIEW, kind: 'earbuds', shot: 'carton', palette: 'earbudsBlack', seed: 62 },
  { file: 'review-03.png', size: REVIEW, kind: 'earbuds', shot: 'detail', palette: 'earbudsWhite', seed: 63 },
  { file: 'review-04.png', size: REVIEW, kind: 'earbuds', shot: 'macro', palette: 'earbudsWhite', seed: 64 },
];

const ICONS = [192, 512];

function run() {
  mkdirSync(MEDIA_DIR, { recursive: true });
  mkdirSync(ICON_DIR, { recursive: true });

  let bytes = 0;
  for (const job of JOBS) {
    const canvas = composeShot(job.size, job.kind, job.shot, PALETTES[job.palette], job.seed);
    const png = encodePng(canvas.width, canvas.height, canvas.data);
    writeFileSync(join(MEDIA_DIR, job.file), png);
    bytes += png.length;
    process.stdout.write(
      `  media/${job.file}  ${job.size}x${job.size}  ${(png.length / 1024).toFixed(0)} KB\n`,
    );
  }

  for (const size of ICONS) {
    const canvas = composeIcon(size);
    const png = encodePng(canvas.width, canvas.height, canvas.data);
    writeFileSync(join(ICON_DIR, `icon-${size}.png`), png);
    bytes += png.length;
    process.stdout.write(`  icons/icon-${size}.png  ${size}x${size}  ${(png.length / 1024).toFixed(0)} KB\n`);
  }

  process.stdout.write(
    `\n${JOBS.length + ICONS.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB total\n`,
  );
}

run();
