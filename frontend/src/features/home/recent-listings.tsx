'use client';

import { useId, useMemo, useState } from 'react';
import { ProductCardTile } from '@/features/product/components/product-card';
import { Pagination } from '@/components/ui/pagination';
import { paginate, pageCount } from '@/lib/paginate';
import { t, tn } from '@/lib/i18n';
import { num } from '@/lib/format';
import type { Lang, ProductCard } from '@/lib/types';

const PER_PAGE = 8;

/**
 * The "Recently listed" grid, paginated.
 *
 * A production feed of new listings is unbounded, and a rail that just grows
 * with it either scrolls forever or gets truncated with no way to see the rest.
 * Paginating in the browser is the right call specifically because the page
 * already holds every card this section can show — server pagination would
 * trade a free array slice for a network round trip to fetch the same data.
 *
 * `ProductRail` (used on the product page's recommendation rails) stays a
 * horizontal-scroll strip on purpose — those are secondary, glanceable lists
 * capped at six or so. This section is the primary catalogue entry point on the
 * home page, so it gets the full grid-plus-pagination treatment instead.
 */
export function RecentListings({ lang, cards }: { lang: Lang; cards: ProductCard[] }) {
  const [page, setPage] = useState(1);
  const headingId = useId();

  const total = cards.length;
  const pages = pageCount(total, PER_PAGE);
  const visible = useMemo(() => paginate(cards, page, PER_PAGE), [cards, page]);

  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, total);

  function goTo(next: number) {
    setPage(next);
    document.getElementById(headingId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  if (total === 0) return null;

  return (
    <div>
      <ul
        id={headingId}
        className="grid scroll-mt-[calc(var(--header-h)+1rem)] grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
      >
        {visible.map((card) => (
          <li key={card.id}>
            <ProductCardTile card={card} lang={lang} />
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col items-center gap-3 border-t border-line pt-4 sm:flex-row sm:justify-between">
        <p className="tnum text-[12px] text-ink-faint">
          {t(lang, 'category.showing')} {num(start)}–{num(end)} {t(lang, 'misc.of')} {num(total)}{' '}
          {tn(lang, total, 'search.listingFound', 'search.listingsFound')}
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
