'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cx } from './cx';

/**
 * A definition popover, used wherever the page asserts a number a buyer is
 * expected to trust: each seller metric, and the per-unit landed cost.
 *
 * Click-to-toggle rather than hover-only, because hover tooltips are
 * unreachable on touch — and the definition of "on-time dispatch" is exactly
 * the kind of thing a buyer on a phone wants to check before paying.
 */
export function InfoTip({
  children,
  label,
  align = 'start',
  className,
}: {
  children: ReactNode;
  /** Accessible name for the trigger, e.g. "What on-time dispatch means". */
  label: string;
  align?: 'start' | 'end';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className={cx('relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          'grid h-6 w-6 place-items-center rounded-md transition-colors',
          open ? 'bg-accent-soft text-accent-ink' : 'text-ink-faint hover:bg-surface-2 hover:text-ink-dim',
        )}
      >
        <Info size={13} aria-hidden />
      </button>

      {open && (
        <span
          id={id}
          role="note"
          className={cx(
            'anim-fade absolute top-full z-30 mt-1.5 w-[min(17rem,72vw)] rounded-lg border border-line bg-surface p-3 text-[12.5px] font-normal leading-[1.55] text-ink-dim shadow-md',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children}
        </span>
      )}
    </span>
  );
}
