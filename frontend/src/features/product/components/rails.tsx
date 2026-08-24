'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { useTrade } from '@/features/product/trade-context';
import { useCart } from '@/features/app/providers';
import { ProductRail } from './product-card';
import { Button, SectionHeading } from '@/components/ui/primitives';
import { lowestUnitPrice, unitPriceForQty } from '@/features/product/lib/pricing';
import { num, taka, unitLabel } from '@/lib/format';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang, ProductCard } from '@/lib/types';

/**
 * Similar products, priced at the buyer's current quantity.
 *
 * This is the difference between a rail that gets used and one that gets
 * scrolled past. Every ladder breaks at a different quantity, so a "from" price
 * is useless for comparison — a buyer holding 200 pieces in the panel wants to
 * know what each alternative costs *at 200*. No reference platform does this,
 * and it is the reason this rail sits first.
 */
export function SimilarRail({
  lang,
  cards,
}: {
  lang: Lang;
  cards: ProductCard[];
}) {
  const { qty } = useTrade();
  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="similar-heading" className="pt-10">
      <SectionHeading
        id="similar-heading"
        title={t(lang, 'rail.similar')}
        eyebrow={qty > 0 ? `${t(lang, 'rail.similarNote')} — ${num(qty)}` : undefined}
      />
      <ProductRail cards={cards} lang={lang} compareQty={qty > 0 ? qty : undefined} />
    </section>
  );
}

/**
 * Frequently bought together, with a single action that adds all of them.
 *
 * The highest-AOV rail on a wholesale page: a reseller stocking earbuds also
 * needs cables and retail packaging in the same delivery, and making that three
 * separate journeys is how the order gets split across three suppliers.
 */
export function BoughtTogetherRail({
  lang,
  cards,
}: {
  lang: Lang;
  cards: ProductCard[];
}) {
  const { addEntry } = useCart();
  const [status, setStatus] = useState<'idle' | 'pending' | 'added'>('idle');

  if (cards.length === 0) return null;

  // Each line enters at its own MOQ — the minimum that can legally be ordered,
  // which is also the honest figure to quote for the bundle.
  const bundleTotal = cards.reduce(
    (sum, card) => sum + lowestUnitPrice(card.tiers) * card.moq,
    0,
  );

  async function addAll() {
    setStatus('pending');
    for (const card of cards) {
      await addEntry({
        productSlug: card.slug,
        productTitle: pick(card.title, lang),
        unitPrice: unitPriceForQty(card.tiers, card.moq),
        lines: [{ variantId: `${card.id}-default`, sku: card.slug, label: '—', qty: card.moq }],
      });
    }
    setStatus('added');
  }

  return (
    <section aria-labelledby="bundle-heading" className="pt-10">
      <SectionHeading id="bundle-heading" title={t(lang, 'rail.boughtTogether')} />

      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <ul className="flex flex-wrap items-stretch gap-3">
          {cards.map((card, index) => (
            <li key={card.id} className="flex items-center gap-3">
              {index > 0 && (
                <Plus size={16} className="shrink-0 text-ink-faint" aria-hidden />
              )}
              <Link
                href={localeHref(lang, `/product/${card.slug}`)}
                className="group flex w-[10.5rem] flex-col gap-2"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-surface-2">
                  <Image
                    src={card.image}
                    alt={pick(card.title, lang)}
                    fill
                    sizes="170px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                  />
                </div>
                <span className="clamp-2 text-[12.5px] font-semibold leading-snug transition-colors group-hover:text-accent-ink">
                  {pick(card.title, lang)}
                </span>
                <span className="tnum text-[12px] text-ink-dim">
                  <b className="price text-price">{taka(lowestUnitPrice(card.tiers))}</b>/
                  {unitLabel(card.unit, lang)} · {t(lang, 'moq.label')} {num(card.moq)}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-faint">
              {cards.length} {lang === 'bn' ? 'পণ্য, প্রতিটি সর্বনিম্ন পরিমাণে' : 'lines, each at its MOQ'}
            </p>
            <p className="price mt-0.5 text-[18px] font-bold">{taka(bundleTotal)}</p>
          </div>
          <Button
            variant="outline-accent"
            size="md"
            onClick={addAll}
            disabled={status !== 'idle'}
            className="gap-1.5"
          >
            <ShoppingCart size={15} aria-hidden />
            {status === 'added' ? t(lang, 'cta.added') : t(lang, 'rail.addBundle')}
          </Button>
        </div>
      </div>
    </section>
  );
}
