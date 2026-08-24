'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { useTrade } from '@/features/product/trade-context';
import { cx } from '@/components/ui/cx';
import { num, taka, unitLabel } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The price ladder — and the plan's central interaction.
 *
 * On every reference platform this is a read-only table sitting above a separate
 * quantity control. Here it *is* the quantity control: each tier is a radio,
 * selecting one rescales the mix to that tier's minimum, and the active ring is
 * derived from the live quantity rather than from what was last clicked. In B2B
 * quantity and price are one decision, so they get one control.
 *
 * The next-tier nudge is framed in Taka saved rather than a percentage, because
 * a reseller's arithmetic is in Taka and "save ৳3,976" moves quantity in a way
 * that "save 4%" does not.
 */
export function PriceLadder({ lang }: { lang: Lang }) {
  const {
    ladder,
    activeTier,
    qty,
    unitPrice,
    fromPrice,
    nudge,
    quoteOnly,
    product,
    selectTier,
    openRfq,
  } = useTrade();

  const unit = unitLabel(product.pricing.unit, lang);
  const unitPlural = unitLabel(product.pricing.unit, lang, true);

  // Floor-tier price vs cheapest tier: the per-unit spread the ladder is worth.
  const moqPrice = ladder[0]?.unitPrice ?? 0;
  const topTierSaving = Math.max(0, moqPrice - fromPrice);

  // Pulse once when the applicable tier changes: money moved, and the buyer has
  // to notice it — once, not on every keystroke.
  const [pulseKey, setPulseKey] = useState(0);
  const lastTier = useRef(activeTier);
  useEffect(() => {
    if (qty > 0 && lastTier.current !== activeTier) {
      setPulseKey((k) => k + 1);
    }
    lastTier.current = activeTier;
  }, [activeTier, qty]);

  if (quoteOnly) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning-soft p-4">
        <p className="text-[14px] font-bold text-warning">{t(lang, 'ladder.priceOnRequest')}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-dim">
          {lang === 'bn'
            ? 'এই পণ্যের মূল্য পরিমাণ ও কনফিগারেশনের উপর নির্ভর করে। কোট চাইলে প্রকৃত হিসাব পাঠানো হবে।'
            : 'Unit cost on this line moves with configuration as well as volume, so no ladder is published. Request a quote and you get real numbers against your actual requirement.'}
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="ladder-heading">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3
          id="ladder-heading"
          className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-dim"
        >
          {t(lang, 'ladder.title')}
        </h3>
        <span className="text-[11.5px] font-semibold text-ink-faint">{t(lang, 'ladder.hint')}</span>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="ladder-heading"
        className="slim-scroll -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 pt-2"
      >
        {ladder.map((tier, index) => {
          const isActive = qty > 0 && index === activeTier;
          const range = tier.maxQty ? `${num(tier.minQty)}–${num(tier.maxQty)}` : `${num(tier.minQty)}+`;

          return (
            <button
              key={tier.minQty}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => selectTier(index)}
              className={cx(
                'relative min-w-[104px] flex-1 shrink-0 snap-start rounded-[10px] border px-3 py-3 text-center transition',
                isActive
                  ? 'border-accent bg-accent-soft shadow-xs ring-2 ring-accent/20'
                  : 'border-line bg-surface hover:border-line-bright',
                isActive && 'tier-pulse',
              )}
              // Remounting on tier change restarts the pulse animation; without
              // a changing key it only ever plays once per page load.
              data-pulse={isActive ? pulseKey : undefined}
            >
              {tier.isBest && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-success px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-on-fill">
                  {t(lang, 'ladder.best')}
                </span>
              )}
              <span className="tnum block text-[11.5px] font-semibold text-ink-dim">
                {range} {unitPlural}
              </span>
              <span
                className={cx(
                  'price mt-1 block text-[20px] font-bold leading-none',
                  isActive ? 'text-price' : 'text-ink',
                )}
              >
                {taka(tier.unitPrice)}
              </span>
              <span className="mt-1 block text-[10px] text-ink-faint">
                {t(lang, 'ladder.per')} {unit}
              </span>
            </button>
          );
        })}
      </div>

      {/* The live readout. `aria-live` because the price changing is the single
          most important thing on this page for a screen-reader user to hear. */}
      <p aria-live="polite" className="mt-2.5 text-[12.5px] leading-relaxed text-ink-dim">
        {qty === 0 ? (
          // Additive rather than a restatement: the headline above already gives
          // the floor price, so this quantifies what moving up the ladder is
          // worth per unit — which is the thing a reseller is deciding.
          <>
            {lang === 'bn' ? 'সর্বোচ্চ টিয়ারে প্রতি পিসে সাশ্রয় ' : 'Order at the top tier and save '}
            <b className="price text-success">
              {taka(topTierSaving)}/{unit}
            </b>{' '}
            <span className="tnum">
              ({Math.round((topTierSaving / Math.max(1, moqPrice)) * 100)}%)
            </span>
          </>
        ) : nudge ? (
          <>
            {t(lang, 'ladder.addMore')}{' '}
            <b className="tnum text-accent-ink">{num(nudge.unitsNeeded)}</b> {t(lang, 'ladder.more')}{' '}
            <b className="price text-ink">
              {taka(nudge.tier.unitPrice)}/{unit}
            </b>
            {nudge.saving > 0 && (
              <>
                {' — '}
                <b className="price text-success">
                  {t(lang, 'ladder.save')} {taka(nudge.saving)}
                </b>
              </>
            )}
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-semibold text-success">
            <TrendingDown size={14} aria-hidden />
            {t(lang, 'ladder.bestPriceUnlocked')} — {taka(unitPrice)}/{unit}
          </span>
        )}
      </p>

      {/* Where the ladder runs out is exactly where negotiation belongs. */}
      <button
        type="button"
        onClick={() => openRfq('volume')}
        className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-ink transition-all hover:gap-2.5"
      >
        {t(lang, 'ladder.volumeAbove')}
        <ArrowRight size={13} aria-hidden />
      </button>
    </section>
  );
}
