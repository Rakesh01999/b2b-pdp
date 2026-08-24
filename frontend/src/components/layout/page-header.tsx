import type { ReactNode } from 'react';

/**
 * The heading block every non-catalogue page opens with.
 *
 * One component rather than a copy per route, because the thing that makes a
 * fifteen-page site feel like one product is that the title, the standfirst and
 * the measure are identical everywhere. Duplicating this markup is how the
 * `/help` heading ends up two pixels and one font-weight away from `/sell`.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  meta,
  actions,
  className = 'pb-7',
}: {
  eyebrow?: ReactNode;
  title: string;
  intro?: string;
  /** Small print under the standfirst — a date, a count, a source note. */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={className}>
      {eyebrow && (
        <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-accent-ink">
          {eyebrow}
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-balance text-[26px] font-bold leading-[1.14] tracking-[-0.03em] sm:text-[32px]">
            {title}
          </h1>
          {intro && (
            <p className="zone-evidence mt-2.5 max-w-[68ch] text-[15px] leading-relaxed text-ink-dim">
              {intro}
            </p>
          )}
          {meta && <div className="mt-3 text-[12.5px] text-ink-faint">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
