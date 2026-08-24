'use client';

import { ChevronRight, Grid3x3 } from 'lucide-react';
import { useTrade } from '@/features/product/trade-context';
import { PriceLadder } from './price-ladder';
import { SkuMatrix } from './sku-matrix';
import { LandedCost } from './landed-cost';
import { PurchaseActions } from './purchase-actions';
import { Overlay } from '@/components/ui/overlay';
import { unitPriceForQty } from '@/features/product/lib/pricing';
import { Button } from '@/components/ui/primitives';
import { num, taka, unitLabel } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The trade panel: ladder → mix → landed cost → action, in that order.
 *
 * It is the buyer's question sequence, not a visual arrangement. What is my
 * price at my quantity; what is my mix; what does it actually cost me landed;
 * commit. Everything in here belongs to the "decision" density zone — tight
 * leading, tabular figures, no gradients, radius capped at 10px — so it reads as
 * an instrument rather than as marketing.
 *
 * The mix grid is inline from `lg` up and a bottom sheet below it. A grid four
 * columns wide does not belong inline on a 360px viewport, and pretending
 * otherwise is how these controls end up unusable on the device most
 * Bangladeshi buyers are actually holding.
 */
export function TradePanel({ lang }: { lang: Lang }) {
  const { product, qty, quoteOnly, unitPrice, fromPrice, sheetOpen, setSheetOpen } = useTrade();

  const unit = unitLabel(product.pricing.unit, lang);
  const unitPlural = unitLabel(product.pricing.unit, lang, true);
  // What one unit actually costs at the minimum order — the floor tier, not the
  // cheapest one.
  const moqPrice = unitPriceForQty(product.pricing.tiers, product.pricing.moq);

  return (
    <section
      aria-label={lang === 'bn' ? 'ট্রেড প্যানেল' : 'Trade panel'}
      className="zone-decision rounded-xl border border-line bg-surface shadow-xs"
    >
      {/* A hairline of the accent, not a filled header: this panel is dense with
          figures and a coloured bar across the top would fight every one. */}
      <div aria-hidden className="h-[3px] rounded-t-xl bg-accent" />

      <div className="space-y-5 p-4 sm:p-5">
        {/* The live unit price. Repeated here rather than only in the ladder
            because on a phone the ladder scrolls sideways and the applicable
            price must never be the thing that scrolled away.

            Before a quantity is entered this shows the ladder's cheapest tier,
            explicitly labelled "as low as" and paired with the price actually
            payable at the MOQ. Showing the floor price next to the minimum
            quantity without that pairing implies ৳440 buys 50 pieces, when 50
            pieces cost ৳500 each — the most tempting misstatement available on
            a laddered listing, and the one buyers notice at checkout. */}
        {!quoteOnly && (
          <div>
            {qty === 0 && (
              <span className="block text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                {t(lang, 'ladder.asLowAs')}
              </span>
            )}
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="price text-[30px] font-bold leading-none text-price">
                {taka(qty > 0 ? unitPrice : fromPrice)}
              </span>
              <span className="text-[12.5px] font-medium text-ink-dim">/{unit}</span>
            </div>
            {qty === 0 && (
              <p className="mt-1 text-[12px] text-ink-dim">
                <b className="price text-ink">
                  {taka(moqPrice)}/{unit}
                </b>{' '}
                {t(lang, 'ladder.atMinimum')}{' '}
                <span className="tnum">
                  {num(product.pricing.moq)} {unitPlural}
                </span>
              </p>
            )}
          </div>
        )}

        <PriceLadder lang={lang} />

        {/* Inline grid from lg up. */}
        <div className="hidden lg:block">
          <SkuMatrix lang={lang} />
        </div>

        {/* Summary row + bottom sheet below lg. */}
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-line-bright bg-surface px-3.5 py-3 text-left transition-colors hover:border-accent"
          >
            <span className="inline-flex items-center gap-2 text-[13.5px] font-semibold">
              <Grid3x3 size={16} className="text-accent-ink" aria-hidden />
              {t(lang, 'matrix.openSheet')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="tnum text-[13.5px] font-bold">
                {num(qty)} {unitPlural}
              </span>
              <ChevronRight size={16} className="text-ink-faint" aria-hidden />
            </span>
          </button>
        </div>

        <LandedCost lang={lang} />

        <PurchaseActions lang={lang} />
      </div>

      <Overlay
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        variant="sheet"
        title={t(lang, 'matrix.openSheet')}
        closeLabel={t(lang, 'misc.close')}
        footer={
          <Button variant="primary" size="md" block onClick={() => setSheetOpen(false)}>
            {t(lang, 'matrix.done')} · <span className="tnum">{num(qty)}</span> {unitPlural}
          </Button>
        }
      >
        <div className="p-4">
          <SkuMatrix lang={lang} compact />
        </div>
      </Overlay>
    </section>
  );
}
