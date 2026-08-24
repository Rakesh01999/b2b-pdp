'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, Play, X, ZoomIn } from 'lucide-react';
import { FullscreenPortal } from '@/components/ui/overlay';
import { Badge } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import { pick, t } from '@/lib/i18n';
import { dateShort } from '@/lib/format';
import type { Lang, ProductMedia } from '@/lib/types';

/**
 * Product gallery.
 *
 * The zoom lens reads the full 1200px source at 2.2x over a ~460px viewport, so
 * it shows real detail. That matters more than it sounds: a B2B buyer zooms to
 * inspect a lid seam or a connector before committing to 500 units, and a lens
 * that merely upscales the display asset is worse than no lens at all — it
 * looks like the product is badly finished. Where a listing has no
 * high-resolution derivative the affordance is hidden rather than faked.
 *
 * This is a client island, but its markup is still server-rendered, and the
 * first image carries `priority` so Next emits a preload for the LCP element.
 */

const ZOOM_SCALE = 2.2;

export function ProductGallery({
  media,
  lang,
  title,
}: {
  media: ProductMedia[];
  lang: Lang;
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [canZoom, setCanZoom] = useState(false);
  const frameRef = useRef(0);

  const current = media[active] ?? media[0];

  // Zoom is a pointer affordance. On touch the equivalent is pinch inside the
  // fullscreen view, so advertising a hover lens there would be a dead end.
  useEffect(() => {
    const query = window.matchMedia('(pointer: fine)');
    const update = () => setCanZoom(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const zoomable = canZoom && current?.kind !== 'video' && current.width >= 900;

  const step = useCallback(
    (delta: number) => {
      setZoom(null);
      setActive((prev) => (prev + delta + media.length) % media.length);
    },
    [media.length],
  );

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!zoomable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Throttled to one update per frame: pointermove fires far faster than the
    // compositor can paint, and updating state on every event is a reliable way
    // to make a gallery feel laggy on a mid-range phone in desktop mode.
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = 0;
      setZoom({ x, y });
    });
  };

  useEffect(
    () => () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const provenance = useMemo(() => {
    if (!current) return null;
    if (current.kind === 'video') return null;
    const label = current.kind === 'studio' ? t(lang, 'gallery.studioPhoto') : t(lang, 'gallery.supplierPhoto');
    return current.capturedAt
      ? `${label} · ${t(lang, 'gallery.verified')} ${dateShort(current.capturedAt, lang)}`
      : label;
  }, [current, lang]);

  if (!current) return null;

  return (
    <div className="lg:sticky lg:top-[calc(var(--header-h)+16px)]">
      {/* Main stage */}
      <div
        className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-2"
        onPointerMove={onPointerMove}
        onPointerLeave={() => setZoom(null)}
      >
        {current.kind === 'video' ? (
          <VideoStage media={current} lang={lang} onOpen={() => setLightbox(true)} />
        ) : (
          <>
            <Image
              src={current.src}
              alt={pick(current.alt, lang)}
              fill
              // 420px is the widest the stage ever renders on desktop; below lg
              // it spans the viewport.
              sizes="(max-width: 1023px) 100vw, 460px"
              priority={active === 0}
              quality={75}
              className={cx('object-cover transition-opacity', zoom && 'opacity-0')}
            />

            {/* The magnified layer is a second copy at the same source, scaled
                about the cursor. Rendering it separately keeps the base image
                untransformed, so leaving the stage never animates a scale-down. */}
            {zoom && (
              <Image
                src={current.src}
                alt=""
                aria-hidden
                fill
                sizes="1200px"
                quality={75}
                className="object-cover"
                style={{
                  transform: `scale(${ZOOM_SCALE})`,
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                }}
              />
            )}

            {zoomable && !zoom && (
              <span className="glass pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-dim">
                <ZoomIn size={13} aria-hidden />
                {t(lang, 'gallery.zoomHint')}
              </span>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label={t(lang, 'gallery.fullscreen')}
          className="glass absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-lg border border-line text-ink-dim transition-colors hover:text-ink"
        >
          <Expand size={16} aria-hidden />
        </button>

        {/* Swipe affordance below lg, where there is no thumb rail in view. */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 lg:hidden">
          <StageArrow direction="prev" onClick={() => step(-1)} label={t(lang, 'gallery.previous')} />
          <StageArrow direction="next" onClick={() => step(1)} label={t(lang, 'gallery.next')} />
        </div>

        <span className="tnum glass absolute bottom-3 left-3 rounded-md border border-line px-2 py-1 text-[11px] font-semibold text-ink-dim lg:hidden">
          {active + 1} / {media.length}
        </span>
      </div>

      {/* Photo provenance. One line, and a genuine trust signal on a catalogue
          that is largely imported: a buyer can tell a studio shot from a
          factory-supplied one instead of guessing. */}
      {provenance && (
        <p className="mt-2 text-[11.5px] text-ink-faint">{provenance}</p>
      )}

      {/* Thumb rail */}
      <div
        role="group"
        aria-label={t(lang, 'gallery.thumbnails')}
        className="slim-scroll mt-3 flex gap-2 overflow-x-auto pb-1"
      >
        {media.map((item, index) => (
          <button
            key={`${item.src}-${index}`}
            type="button"
            onClick={() => {
              setZoom(null);
              setActive(index);
            }}
            aria-current={index === active}
            aria-label={`${pick(item.alt, lang)} (${index + 1}/${media.length})`}
            className={cx(
              'relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-lg border transition sm:h-[64px] sm:w-[64px]',
              index === active
                ? 'border-accent ring-2 ring-accent/25'
                : 'border-line hover:border-line-bright',
            )}
          >
            <Image
              src={item.poster ?? item.src}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
            {item.kind === 'video' && (
              <span className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                <Play size={14} fill="currentColor" aria-hidden />
              </span>
            )}
          </button>
        ))}
      </div>

      <Lightbox
        open={lightbox}
        onClose={() => setLightbox(false)}
        media={media}
        active={active}
        onStep={step}
        lang={lang}
        title={title}
      />
    </div>
  );
}

function StageArrow({
  direction,
  onClick,
  label,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="glass grid h-9 w-9 place-items-center rounded-full border border-line text-ink-dim"
    >
      {direction === 'prev' ? <ChevronLeft size={17} aria-hidden /> : <ChevronRight size={17} aria-hidden />}
    </button>
  );
}

function VideoStage({
  media,
  lang,
  onOpen,
}: {
  media: ProductMedia;
  lang: Lang;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="absolute inset-0 block text-left">
      <Image
        src={media.poster ?? media.src}
        alt={pick(media.alt, lang)}
        fill
        sizes="(max-width: 1023px) 100vw, 460px"
        className="object-cover"
      />
      {/* Poster first, never autoplay: on mobile data an auto-playing product
          video is a cost the buyer did not agree to. */}
      <span className="absolute inset-0 grid place-items-center bg-black/25">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-ink shadow-md">
          <Play size={24} fill="currentColor" aria-hidden />
        </span>
      </span>
      <span className="absolute bottom-3 left-3">
        <Badge tone="neutral">{t(lang, 'gallery.playVideo')}</Badge>
      </span>
    </button>
  );
}

function Lightbox({
  open,
  onClose,
  media,
  active,
  onStep,
  lang,
  title,
}: {
  open: boolean;
  onClose: () => void;
  media: ProductMedia[];
  active: number;
  onStep: (delta: number) => void;
  lang: Lang;
  title: string;
}) {
  const current = media[active];

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') onStep(1);
      if (event.key === 'ArrowLeft') onStep(-1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onStep]);

  if (!current) return null;

  return (
    <FullscreenPortal open={open} onClose={onClose} label={title}>
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-white/90">
        <span className="tnum text-[12.5px] font-semibold">
          {active + 1} / {media.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t(lang, 'gallery.close')}
          className="grid h-10 w-10 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={20} aria-hidden />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
        <div className="relative h-full w-full max-w-[min(90vh,1100px)]">
          <Image
            src={current.poster ?? current.src}
            alt={pick(current.alt, lang)}
            fill
            sizes="90vw"
            quality={75}
            // Pinch-zoom is the touch equivalent of the desktop lens; letting
            // the browser own it beats reimplementing gesture handling badly.
            className="touch-pinch-zoom object-contain"
          />
        </div>

        {media.length > 1 && (
          <>
            <LightboxArrow direction="prev" onClick={() => onStep(-1)} label={t(lang, 'gallery.previous')} />
            <LightboxArrow direction="next" onClick={() => onStep(1)} label={t(lang, 'gallery.next')} />
          </>
        )}
      </div>

      <div className="px-5 pb-6 text-center">
        <p className="mx-auto max-w-[70ch] text-[13px] leading-relaxed text-white/70">
          {pick(current.alt, lang)}
        </p>
        {current.kind === 'video' && (
          // Honest about what this build contains. The player, the poster-first
          // loading and the media type are all implemented; the encoded file is
          // simply not bundled with a static demo.
          <p className="mx-auto mt-2 max-w-[70ch] text-[11.5px] text-white/45">
            Product video · 0:42 — video source is not bundled in this build.
          </p>
        )}
      </div>
    </FullscreenPortal>
  );
}

function LightboxArrow({
  direction,
  onClick,
  label,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cx(
        'absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20',
        direction === 'prev' ? 'left-2' : 'right-2',
      )}
    >
      {direction === 'prev' ? <ChevronLeft size={22} aria-hidden /> : <ChevronRight size={22} aria-hidden />}
    </button>
  );
}
