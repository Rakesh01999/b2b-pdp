'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './cx';
import { useIsClient } from '@/lib/use-is-client';

/**
 * The overlay used by the quote drawer, the mobile mix sheet and the fullscreen
 * gallery.
 *
 * One component covers all three because they share the hard parts: a focus
 * trap, Escape to close, a scroll lock that does not shift the page, focus
 * restored to whatever opened it, and a portal so no ancestor's `transform` or
 * `overflow` can clip it. Those are exactly the details that get skipped when
 * each overlay is hand-rolled.
 *
 * `variant="responsive"` is a bottom sheet below `lg` and a right-hand drawer
 * above it — the transform is chosen in CSS, not by a JS media query, so there
 * is no hydration mismatch and no flash of the wrong geometry.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    // Compensating for the scrollbar keeps the page from jumping sideways as it
    // locks, which otherwise reads as a layout bug the moment a drawer opens.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [active]);
}

export function Overlay({
  open,
  onClose,
  title,
  children,
  footer,
  variant = 'responsive',
  closeLabel = 'Close',
  labelledBy,
  className,
}: {
  open: boolean;
  onClose: () => void;
  /** Rendered as the panel heading and used as the accessible name. */
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'responsive' | 'sheet' | 'fullscreen';
  closeLabel?: string;
  labelledBy?: string;
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const mounted = useIsClient();
  const headingId = labelledBy ?? 'overlay-title';

  useBodyScrollLock(open);

  // Remember what opened this, and hand focus back on close — otherwise a
  // keyboard user is dumped at the top of the document.
  useEffect(() => {
    if (open) {
      restoreTo.current = document.activeElement as HTMLElement | null;
      // Wait a frame so the panel is painted before focus moves into it.
      const id = requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? panelRef.current)?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
    restoreTo.current?.focus?.();
  }, [open]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onKeyDown]);

  if (!mounted || !open) return null;

  const geometry =
    variant === 'fullscreen'
      ? 'inset-0'
      : variant === 'sheet'
        ? 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl'
        : 'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:rounded-l-2xl';

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="presentation">
      <div
        className="anim-fade absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? headingId : undefined}
        aria-label={title ? undefined : closeLabel}
        tabIndex={-1}
        className={cx(
          'overlay-panel absolute flex flex-col bg-surface shadow-lg outline-none',
          geometry,
          className,
        )}
      >
        {title && (
          <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id={headingId} className="text-[16.5px] font-bold tracking-[-0.015em]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="-m-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          </header>
        )}

        <div className="slim-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer && <footer className="border-t border-line bg-surface px-5 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Bare portal for overlays that supply their own chrome (the gallery lightbox
 * paints edge to edge and cannot afford a header).
 */
export function FullscreenPortal({
  open,
  onClose,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);
  const mounted = useIsClient();

  useBodyScrollLock(open);

  useEffect(() => {
    if (open) {
      restoreTo.current = document.activeElement as HTMLElement | null;
      const id = requestAnimationFrame(() => ref.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    restoreTo.current?.focus?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      className="anim-fade fixed inset-0 z-[110] flex flex-col bg-black/92 outline-none"
    >
      {children}
    </div>,
    document.body,
  );
}
