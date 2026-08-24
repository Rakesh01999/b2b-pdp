import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cx } from '@/components/ui/cx';
import { localeHref, t } from '@/lib/i18n';
import { truncate } from '@/lib/format';
import type { Lang } from '@/lib/types';

export interface Crumb {
  name: string;
  href?: string;
}

/**
 * Breadcrumb, plus the return path.
 *
 * The "back to results" link is not decoration. B2B buyers comparison-shop
 * across many listings, and losing position in a filtered result set is one of
 * the most expensive small failures on a product page. It reads the origin from
 * the URL rather than from `document.referrer`, so it survives a shared link and
 * works without JavaScript.
 *
 * On mobile the middle of the trail collapses. Truncating the *middle* rather
 * than the tail keeps both the root and the current page visible, which is what
 * the crumb is for.
 */
export function Breadcrumb({
  items,
  lang,
  trailing,
}: {
  items: Crumb[];
  lang: Lang;
  /** The return path, rendered by the caller so this stays a Server Component. */
  trailing?: React.ReactNode;
}) {
  const last = items.length - 1;

  return (
    <div className="zone-nav flex items-center justify-between gap-4 py-3">
      <nav aria-label={t(lang, 'chrome.breadcrumb')} className="min-w-0">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-ink-faint">
          {items.map((item, index) => {
            const isLast = index === last;
            // Everything between the first and last crumb is hidden on small
            // screens; the ellipsis stands in for it.
            const collapsible = index > 0 && !isLast;

            return (
              <li
                key={`${item.name}-${index}`}
                className={cx('flex items-center gap-1.5', collapsible && 'hidden sm:flex')}
              >
                {index > 0 && (
                  <ChevronRight size={12} aria-hidden className="shrink-0 opacity-60" />
                )}
                {item.href && !isLast ? (
                  <Link
                    href={localeHref(lang, item.href)}
                    className="transition-colors hover:text-accent-ink"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={cx('min-w-0 truncate', isLast && 'text-ink-dim')}
                  >
                    {truncate(item.name, 46)}
                  </span>
                )}
              </li>
            );
          })}

          {items.length > 2 && (
            <li aria-hidden className="flex items-center gap-1.5 sm:hidden">
              <ChevronRight size={12} className="shrink-0 opacity-60" />
              <span>…</span>
            </li>
          )}
        </ol>
      </nav>

      {trailing}
    </div>
  );
}
