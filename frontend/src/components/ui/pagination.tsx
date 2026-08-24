'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cx } from './cx';

/**
 * Numbered pagination: Prev, a run of page numbers, Next.
 *
 * A controlled component — the caller owns `page` and slices its own array —
 * so the same control works for an in-memory client grid (home page sections,
 * where the count is small enough that round-tripping to the server would be
 * pure overhead) without assuming anything about where the data lives.
 *
 * Past a handful of pages the full run collapses to first, last, and a small
 * window around the current page with an ellipsis on either side. Printing
 * every page number for a hundred-page run is not navigation, it is a wall.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
  labels,
  className,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  labels: { previous: string; next: string };
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const run = pageRun(page, totalPages);

  return (
    <nav aria-label={`${labels.previous} / ${labels.next}`} className={cx('flex items-center justify-center gap-1', className)}>
      <PageButton onClick={() => onChange(page - 1)} disabled={page === 1} aria-label={labels.previous}>
        <ChevronLeft size={15} aria-hidden />
      </PageButton>

      {run.map((entry, index) =>
        entry === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            aria-hidden
            className="grid h-8 w-8 place-items-center text-ink-faint"
          >
            <MoreHorizontal size={15} />
          </span>
        ) : (
          <PageButton
            key={entry}
            onClick={() => onChange(entry)}
            active={entry === page}
            aria-current={entry === page ? 'page' : undefined}
          >
            {entry}
          </PageButton>
        ),
      )}

      <PageButton onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label={labels.next}>
        <ChevronRight size={15} aria-hidden />
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'tnum grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[13px] font-semibold transition-colors',
        active
          ? 'bg-accent text-on-fill'
          : 'text-ink-dim hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function pageRun(current: number, total: number): Array<number | 'ellipsis'> {
  const keep = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: Array<number | 'ellipsis'> = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push('ellipsis');
    result.push(p);
  });
  return result;
}
