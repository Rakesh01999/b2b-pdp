'use client';

import { useEffect, useMemo } from 'react';
import { useCart } from '@/features/app/providers';
import { ProductRail } from './product-card';
import { SectionHeading } from '@/components/ui/primitives';
import { t } from '@/lib/i18n';
import type { Lang, ProductCard } from '@/lib/types';

/**
 * Recently viewed.
 *
 * The cheapest of the three rails to run — the history is in `localStorage`, so
 * it costs the server nothing and personalises without a session. It earns its
 * slot because B2B sessions are long and multi-tab: a buyer comparing five
 * listings on price-at-quantity needs a way back to the other four.
 *
 * Rendered last, after the recommendation rails, because it is a utility rather
 * than a suggestion.
 */
export function RecentlyViewed({
  lang,
  cards,
  currentSlug,
}: {
  lang: Lang;
  cards: ProductCard[];
  currentSlug: string;
}) {
  const { recentSlugs, noteVisit, hydrated } = useCart();

  // Recorded after paint so it never blocks rendering, and after `hydrated` so
  // the write lands on top of the restored history rather than replacing it.
  useEffect(() => {
    if (hydrated) noteVisit(currentSlug);
  }, [hydrated, noteVisit, currentSlug]);

  const visible = useMemo(
    () =>
      recentSlugs
        .filter((slug) => slug !== currentSlug)
        .map((slug) => cards.find((card) => card.slug === slug))
        .filter((card): card is ProductCard => Boolean(card))
        .slice(0, 6),
    [recentSlugs, currentSlug, cards],
  );

  // Nothing to show on a first visit, and an empty rail is worse than none.
  if (!hydrated || visible.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="pt-10">
      <SectionHeading id="recently-viewed-heading" title={t(lang, 'rail.recentlyViewed')} />
      <ProductRail cards={visible} lang={lang} />
    </section>
  );
}
