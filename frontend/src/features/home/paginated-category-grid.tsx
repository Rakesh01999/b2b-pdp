'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, categoryProductCount } from '@/data/categories';
import { CategoryGlyph } from '@/features/categories/category-icon';
import { Pagination } from '@/components/ui/pagination';
import { paginate, pageCount } from '@/lib/paginate';
import { localeHref, pick, t } from '@/lib/i18n';
import { num } from '@/lib/format';
import type { Lang } from '@/lib/types';

const PER_PAGE = 8;

/**
 * The category grid, paginated.
 *
 * Twenty categories today; the taxonomy is designed to grow, and a home page
 * that just dumps every row it has stops being an overview once that count gets
 * into the hundreds. Paginating in the browser — rather than round-tripping to
 * the server per page — is the right trade here specifically because the whole
 * taxonomy is already on the page as plain data (a few kilobytes) and slicing an
 * array client-side costs nothing a fetch wouldn't cost more of.
 *
 * This is a client island for the interactivity only; the category list itself
 * is static build-time data, not something fetched.
 */
export function PaginatedCategoryGrid({ lang }: { lang: Lang }) {
  const [page, setPage] = useState(1);
  const headingId = useId();

  const total = CATEGORIES.length;
  const pages = pageCount(total, PER_PAGE);
  const visible = useMemo(() => paginate(CATEGORIES, page, PER_PAGE), [page]);

  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, total);

  function goTo(next: number) {
    setPage(next);
    document.getElementById(headingId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  return (
    <div>
      <ul
        id={headingId}
        className="grid scroll-mt-[calc(var(--header-h)+1rem)] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {visible.map((category) => (
          <li key={category.slug}>
            <div className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/45">
              <Link
                href={localeHref(lang, `/category/${category.slug}`)}
                className="flex items-start gap-3"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-ink">
                  <CategoryGlyph icon={category.icon} size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold leading-snug tracking-[-0.012em] transition-colors group-hover:text-accent-ink">
                    {pick(category.name, lang)}
                  </span>
                  <span className="tnum mt-0.5 block text-[11.5px] text-ink-faint">
                    {num(categoryProductCount(category))} {t(lang, 'category.products')} ·{' '}
                    {category.subcategories.length} {t(lang, 'category.subcategories')}
                  </span>
                </span>
              </Link>

              {/* The three biggest children, as links. A tile that only links to
                  its own parent makes the buyer take two hops to reach the shelf
                  they were already thinking of. */}
              <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                {[...category.subcategories]
                  .sort((a, b) => b.productCount - a.productCount)
                  .slice(0, 3)
                  .map((subcategory) => (
                    <li key={subcategory.slug}>
                      <Link
                        href={localeHref(lang, `/category/${subcategory.slug}`)}
                        className="inline-block rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11.5px] text-ink-dim transition-colors hover:border-accent hover:text-accent-ink"
                      >
                        {pick(subcategory.name, lang)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col items-center gap-3 border-t border-line pt-4 sm:flex-row sm:justify-between">
        <p className="tnum text-[12px] text-ink-faint">
          {t(lang, 'category.showing')} {num(start)}–{num(end)} {t(lang, 'misc.of')} {num(total)}{' '}
          {t(lang, 'home.statCategories')}
        </p>
        <Pagination
          page={page}
          totalPages={pages}
          onChange={goTo}
          labels={{ previous: t(lang, 'pagination.previous'), next: t(lang, 'pagination.next') }}
        />
      </div>
    </div>
  );
}
