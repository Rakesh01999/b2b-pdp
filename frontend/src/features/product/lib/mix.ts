import type { Variant } from '@/lib/types';

/**
 * The SKU mix — the signature B2B ordering interaction.
 *
 * A wholesale buyer does not choose "one variant". They allocate a total across
 * a grid of variants under a single consolidated MOQ. Everything here is pure
 * so the reducer driving the matrix has no hidden state and the maths is
 * testable in isolation.
 */

/** variantId → quantity. Absent keys mean zero; zeroes are pruned. */
export type Mix = Record<string, number>;

export interface MatrixCell {
  variant: Variant | null;
  row: string;
  col: string;
}

export interface Matrix {
  rowAxis: string;
  /** Null when the product varies on a single axis. */
  colAxis: string | null;
  rows: string[];
  cols: string[];
  /** Row-major. `cells[r][c]`. */
  cells: MatrixCell[][];
}

const SINGLE_AXIS_COL = '__qty__';

/** Preserve first-seen order — variant order is a merchandising decision. */
function uniqueInOrder(values: Array<string | undefined>): string[] {
  const out: string[] = [];
  for (const v of values) {
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/**
 * Builds the grid from the variant list and the declared axis order. A product
 * that varies on one axis still gets a matrix — one column wide — so the UI has
 * a single code path.
 */
export function buildMatrix(variants: Variant[], axes: string[]): Matrix {
  const rowAxis = axes[0] ?? 'Variant';
  const colAxis = axes[1] ?? null;

  const rows = uniqueInOrder(variants.map((v) => v.attributes[rowAxis]));
  const cols = colAxis ? uniqueInOrder(variants.map((v) => v.attributes[colAxis])) : [SINGLE_AXIS_COL];

  const cells = rows.map((row) =>
    cols.map<MatrixCell>((col) => ({
      row,
      col,
      variant:
        variants.find(
          (v) => v.attributes[rowAxis] === row && (colAxis ? v.attributes[colAxis] === col : true),
        ) ?? null,
    })),
  );

  return { rowAxis, colAxis, rows, cols, cells };
}

export function isSingleAxis(matrix: Matrix): boolean {
  return matrix.colAxis === null;
}

export function colLabel(col: string): string {
  return col === SINGLE_AXIS_COL ? '' : col;
}

/* --------------------------------------------------------------- capacities */

/**
 * How many units a buyer may enter in a cell: dispatchable stock plus anything
 * already inbound. Inbound units are orderable — they just move the line into
 * sourced-to-order, which the UI states before the CTA rather than after.
 */
export function capacityOf(variant: Variant | null): number {
  if (!variant) return 0;
  return variant.stock + (variant.incoming?.qty ?? 0);
}

export type CellState = 'available' | 'low' | 'sourced' | 'unavailable';

/** Low-stock threshold. Below this the count renders amber rather than plain. */
const LOW_STOCK = 24;

export function cellState(variant: Variant | null): CellState {
  if (!variant || capacityOf(variant) <= 0) return 'unavailable';
  if (variant.stock <= 0) return 'sourced';
  if (variant.stock < LOW_STOCK) return 'low';
  return 'available';
}

/* ------------------------------------------------------------------ totals */

export function totalQty(mix: Mix): number {
  let sum = 0;
  for (const key in mix) sum += mix[key] || 0;
  return sum;
}

export function rowTotal(mix: Mix, matrix: Matrix, rowIndex: number): number {
  return matrix.cells[rowIndex].reduce(
    (sum, cell) => sum + (cell.variant ? mix[cell.variant.id] || 0 : 0),
    0,
  );
}

export function colTotal(mix: Mix, matrix: Matrix, colIndex: number): number {
  return matrix.cells.reduce((sum, row) => {
    const cell = row[colIndex];
    return sum + (cell?.variant ? mix[cell.variant.id] || 0 : 0);
  }, 0);
}

/** Sets one cell, clamped to capacity, pruning zeroes so `mix` stays clean. */
export function setCell(mix: Mix, variantId: string, value: number, capacity: number): Mix {
  const safe = Number.isFinite(value) ? Math.floor(value) : 0;
  const clamped = Math.max(0, Math.min(safe, capacity));
  const next = { ...mix };
  if (clamped === 0) delete next[variantId];
  else next[variantId] = clamped;
  return next;
}

export function clearMix(): Mix {
  return {};
}

/* --------------------------------------------------------------- distribute */

/**
 * Spreads a target quantity across every cell with capacity: an even base
 * split, then the remainder handed out one unit at a time to whichever cell
 * has the most headroom left. One click replaces six inputs, which is the
 * difference between a matrix a buyer uses and one they abandon.
 */
export function distributeEvenly(target: number, variants: Variant[]): Mix {
  const eligible = variants
    .map((v) => ({ v, capacity: capacityOf(v) }))
    .filter((e) => e.capacity > 0);

  if (eligible.length === 0 || target <= 0) return {};

  const mix: Mix = {};
  const base = Math.floor(target / eligible.length);

  let assigned = 0;
  for (const entry of eligible) {
    const take = Math.min(base, entry.capacity);
    if (take > 0) {
      mix[entry.v.id] = take;
      assigned += take;
    }
  }

  let remainder = target - assigned;
  // Bounded: every pass either places a unit or exits, and headroom only
  // shrinks — so this cannot spin when the target exceeds total capacity.
  while (remainder > 0) {
    const withRoom = eligible
      .map((e) => ({ ...e, room: e.capacity - (mix[e.v.id] || 0) }))
      .filter((e) => e.room > 0)
      .sort((a, b) => b.room - a.room);

    if (withRoom.length === 0) break;

    const target0 = withRoom[0];
    mix[target0.v.id] = (mix[target0.v.id] || 0) + 1;
    remainder -= 1;
  }

  return mix;
}

/**
 * Rescales an existing mix to a new total, preserving the ratio the buyer chose.
 *
 * This is what a price-ladder tier click does. Wiping the mix and spreading the
 * new total evenly would be easier and wrong: a buyer who has deliberately
 * loaded up on Black/M and taken one White is telling us their sell-through, and
 * moving from 100 to 200 units should double that shape, not flatten it.
 */
export function scaleMixTo(mix: Mix, variants: Variant[], target: number): Mix {
  const current = totalQty(mix);
  if (target <= 0) return {};
  if (current === 0) return distributeEvenly(target, variants);

  const byId = new Map(variants.map((v) => [v.id, v]));
  const factor = target / current;

  const next: Mix = {};
  let assigned = 0;

  for (const [id, qty] of Object.entries(mix)) {
    const capacity = capacityOf(byId.get(id) ?? null);
    const scaled = Math.min(Math.floor(qty * factor), capacity);
    if (scaled > 0) {
      next[id] = scaled;
      assigned += scaled;
    }
  }

  // Flooring loses up to one unit per line, so hand the shortfall back to the
  // lines with the most headroom until the target is met or capacity runs out.
  let remainder = target - assigned;
  while (remainder > 0) {
    const candidates = variants
      .map((v) => ({ v, room: capacityOf(v) - (next[v.id] || 0) }))
      .filter((c) => c.room > 0)
      // Prefer lines already in the mix, so rescaling does not silently
      // introduce a variant the buyer never selected.
      .sort((a, b) => {
        const aIn = (mix[a.v.id] || 0) > 0 ? 1 : 0;
        const bIn = (mix[b.v.id] || 0) > 0 ? 1 : 0;
        return bIn - aIn || b.room - a.room;
      });

    if (candidates.length === 0) break;
    const pick = candidates[0];
    next[pick.v.id] = (next[pick.v.id] || 0) + 1;
    remainder -= 1;
  }

  return next;
}

/* -------------------------------------------------------------------- paste */

export interface PasteResult {
  mix: Mix;
  /** Cells the paste will change, for the confirm-before-apply diff. */
  changes: Array<{ label: string; from: number; to: number }>;
  /** Values that could not be placed, so nothing fails silently. */
  warnings: string[];
}

function splitCells(line: string): string[] {
  return line.split(/\t|,|\s{2,}/).map((c) => c.trim());
}

function parseQty(raw: string): number | null {
  if (!raw) return 0;
  const cleaned = raw.replace(/[,\s৳]/g, '');
  if (cleaned === '' || cleaned === '-') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/**
 * Parses a block pasted from a spreadsheet into the matrix.
 *
 * Resellers keep their mix in Excel; making them retype it cell by cell is the
 * single most avoidable friction on this page. Header rows and label columns
 * are detected and used to match by name; otherwise placement is positional.
 * The result is returned as a diff — applying a paste silently would be
 * unforgivable, because it can overwrite a mix the buyer spent minutes on.
 */
export function parsePastedMix(text: string, matrix: Matrix, current: Mix): PasteResult {
  const warnings: string[] = [];
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { mix: current, changes: [], warnings: ['Nothing to paste.'] };
  }

  const grid = lines.map(splitCells);

  /**
   * A header row is one whose *value* cells are non-numeric.
   *
   * The first cell is ignored deliberately: almost every pasted block starts
   * with a row label ("Black"), so counting it made `Black  40  32` look like a
   * header and silently discarded the buyer's first row of quantities.
   */
  const looksLikeHeader = (cells: string[]) => {
    const values = cells.slice(1).filter((c) => c !== '');
    if (values.length === 0) return false;
    const nonNumeric = values.filter((c) => parseQty(c) === null).length;
    return nonNumeric > values.length / 2;
  };

  let colNames: string[] | null = null;
  if (grid.length > 1 && looksLikeHeader(grid[0])) {
    colNames = grid[0].slice(1);
    grid.shift();
  }

  const next: Mix = { ...current };
  const changes: PasteResult['changes'] = [];

  grid.forEach((cells, r) => {
    let rowName: string | null = null;
    let values = cells;

    if (cells.length > 0 && parseQty(cells[0]) === null) {
      rowName = cells[0];
      values = cells.slice(1);
    }

    const rowIndex = rowName
      ? matrix.rows.findIndex((row) => row.toLowerCase() === rowName!.toLowerCase())
      : r;

    if (rowIndex < 0 || rowIndex >= matrix.rows.length) {
      warnings.push(`Row "${rowName ?? r + 1}" does not match a variant — skipped.`);
      return;
    }

    values.forEach((raw, c) => {
      const colName = colNames?.[c];
      const colIndex = colName
        ? matrix.cols.findIndex((col) => col.toLowerCase() === colName.toLowerCase())
        : c;

      if (colIndex < 0 || colIndex >= matrix.cols.length) {
        if (raw !== '') warnings.push(`Column "${colName ?? c + 1}" does not match — skipped.`);
        return;
      }

      const cell = matrix.cells[rowIndex]?.[colIndex];
      if (!cell?.variant) return;

      const qty = parseQty(raw);
      if (qty === null) {
        warnings.push(`"${raw}" is not a quantity — skipped.`);
        return;
      }

      const capacity = capacityOf(cell.variant);
      const clamped = Math.min(qty, capacity);
      if (clamped < qty) {
        warnings.push(
          `${cell.row}${colLabel(cell.col) ? ` / ${colLabel(cell.col)}` : ''}: only ${capacity} available, reduced from ${qty}.`,
        );
      }

      const from = current[cell.variant.id] || 0;
      if (from !== clamped) {
        const label = colLabel(cell.col) ? `${cell.row} / ${colLabel(cell.col)}` : cell.row;
        changes.push({ label, from, to: clamped });
      }

      if (clamped === 0) delete next[cell.variant.id];
      else next[cell.variant.id] = clamped;
    });
  });

  if (changes.length === 0 && warnings.length === 0) {
    warnings.push('Pasted values match the current mix — nothing to change.');
  }

  return { mix: next, changes, warnings };
}

/* ---------------------------------------------------------------- cart lines */

export interface MixLine {
  variantId: string;
  sku: string;
  label: string;
  qty: number;
}

/** The cart payload. Preserves the breakdown so an order can be picked. */
export function mixLines(mix: Mix, variants: Variant[]): MixLine[] {
  return variants
    .filter((v) => (mix[v.id] || 0) > 0)
    .map((v) => ({
      variantId: v.id,
      sku: v.sku,
      label: Object.values(v.attributes).join(' / '),
      qty: mix[v.id],
    }));
}

/** Total dispatchable stock — feeds the in-stock vs sourced-to-order decision. */
export function totalStock(variants: Variant[]): number {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

export function totalCapacity(variants: Variant[]): number {
  return variants.reduce((sum, v) => sum + capacityOf(v), 0);
}

/** Longest inbound wait among the variants actually in the mix. */
export function sourcingDaysForMix(mix: Mix, variants: Variant[]): number {
  let days = 0;
  for (const v of variants) {
    const qty = mix[v.id] || 0;
    if (qty > v.stock && v.incoming) days = Math.max(days, v.incoming.days);
  }
  return days;
}
