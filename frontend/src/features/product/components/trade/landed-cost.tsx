'use client';

import { useState } from 'react';
import { ChevronDown, Package, Truck } from 'lucide-react';
import { useTrade } from '@/features/product/trade-context';
import { usePrefs } from '@/features/app/providers';
import { InfoTip } from '@/components/ui/info-tip';
import { cx } from '@/components/ui/cx';
import { PAYMENT_METHODS } from '@/lib/constants';
import { bpsToPct, dayRange, num, taka, unitLabel, weight } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * Landed cost — the figure this page has that its references do not.
 *
 * Baymard's benchmark finds 81% of e-commerce sites omit per-unit price on
 * multi-quantity products and 67% omit total order cost. For a reseller those
 * are not two minor omissions, they are the entire decision: unit price alone
 * cannot answer "what do I pay per piece" once courier and gateway fee land on
 * the same invoice, and per-unit landed is the number a shelf price is set from.
 *
 * It is labelled estimated until checkout, every line is itemised, and the
 * district persists — so the buyer is never asked for it twice.
 */
export function LandedCost({ lang, defaultOpen = false }: { lang: Lang; defaultOpen?: boolean }) {
  const {
    qty,
    landed,
    selectedQuote,
    quotes,
    setCourier,
    courierId,
    freeShipping,
    weightGrams,
    cartons,
    product,
    variantSurcharge,
    surchargeUnits,
    surchargeRate,
  } = useTrade();
  const { paymentMethodId, setPaymentMethod } = usePrefs();
  const [open, setOpen] = useState(defaultOpen);

  const unit = unitLabel(product.pricing.unit, lang);

  // A quote-only line has no published unit price, so there is no landed cost to
  // compute. Showing "enter a quantity" here would promise a figure that cannot
  // arrive until the seller replies.
  if (product.pricing.priceOnRequest || product.pricing.tiers.length === 0) return null;

  if (qty === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-line-bright bg-surface-2/50 p-4 text-center">
        <p className="text-[12.5px] text-ink-dim">{t(lang, 'landed.enterQty')}</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="landed-heading" className="rounded-[10px] border border-line bg-surface-2/60">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-3.5 py-2.5">
        <h3
          id="landed-heading"
          className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-dim"
        >
          {t(lang, 'landed.title')}
        </h3>
        <span className="text-[11px] text-ink-faint">{t(lang, 'landed.estimated')}</span>
      </div>

      <dl className="zone-decision divide-y divide-line/70 px-3.5">
        <Row
          label={
            <>
              {t(lang, 'landed.goods')}
              <span className="tnum ml-1.5 text-ink-faint">
                {num(qty)} × {taka(landed.unitPrice)}
              </span>
            </>
          }
          value={taka(landed.goodsSubtotal)}
        />

        {/* Named, not merely totalled. An unexplained line on an invoice is the
            fastest way to lose a buyer's confidence in every figure above it. */}
        {variantSurcharge > 0 && (
          <Row
            label={
              <>
                {t(lang, 'landed.surcharge')}
                {surchargeRate !== null && (
                  <span className="tnum ml-1.5 text-ink-faint">
                    {num(surchargeUnits)} × +{taka(surchargeRate)}
                  </span>
                )}
              </>
            }
            value={taka(variantSurcharge)}
          />
        )}

        <div className="flex items-start justify-between gap-3 py-2">
          <dt className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-ink-dim">
              <Truck size={13} className="shrink-0" aria-hidden />
              {t(lang, 'landed.courier')}
            </span>
            {/* Courier choice belongs to the buyer, and a slower cheaper option
                is often the right call on a 500-unit order. */}
            {quotes.length > 1 && (
              <select
                value={courierId ?? selectedQuote?.courier ?? ''}
                onChange={(event) => setCourier(event.target.value)}
                aria-label={t(lang, 'shipping.courier')}
                className="mt-1 w-full cursor-pointer rounded-md border border-line bg-surface px-2 py-1 text-[12px] font-semibold text-ink outline-none"
              >
                {quotes.map((quote) => (
                  <option key={quote.courier} value={quote.courier}>
                    {quote.courierName} · {taka(quote.cost)} ·{' '}
                    {dayRange(quote.minDays, quote.maxDays, lang)}
                  </option>
                ))}
              </select>
            )}
          </dt>
          <dd className="price shrink-0 text-right font-semibold">
            {selectedQuote?.cost === 0 ? (
              <span className="text-success">{t(lang, 'shipping.free')}</span>
            ) : (
              taka(selectedQuote?.cost ?? 0)
            )}
          </dd>
        </div>

        <div className="flex items-start justify-between gap-3 py-2">
          <dt className="min-w-0 flex-1">
            <label htmlFor="landed-payment" className="text-ink-dim">
              {t(lang, 'landed.payWith')}
            </label>
            <select
              id="landed-payment"
              value={paymentMethodId}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="mt-1 w-full cursor-pointer rounded-md border border-line bg-surface px-2 py-1 text-[12px] font-semibold text-ink outline-none"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                  {method.feeBps > 0 ? ` · ${bpsToPct(method.feeBps)} ${t(lang, 'landed.paymentFee')}` : ' · 0%'}
                </option>
              ))}
            </select>
          </dt>
          <dd className="price shrink-0 text-right font-semibold">
            {landed.paymentFee === 0 ? (
              <span className="text-success">{taka(0)}</span>
            ) : (
              taka(landed.paymentFee)
            )}
          </dd>
        </div>
      </dl>

      <div className="border-t border-line px-3.5 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-bold">{t(lang, 'landed.total')}</span>
          <span className="price text-[19px] font-bold leading-none">{taka(landed.total)}</span>
        </div>

        {/* Given equal weight to the unit price on purpose: this is the number a
            reseller uses to set shelf price, so burying it would defeat the
            point of computing it. */}
        <div className="mt-2 flex items-baseline justify-between gap-3 rounded-md bg-accent-soft px-2.5 py-2">
          <span className="inline-flex items-center gap-0.5 text-[12.5px] font-bold text-accent-ink">
            {t(lang, 'landed.perUnit')}
            <InfoTip label={t(lang, 'landed.perUnit')}>{t(lang, 'landed.perUnitHelp')}</InfoTip>
          </span>
          <span className="price text-[16px] font-bold text-accent-ink">
            {taka(landed.perUnit, { decimals: true })}
            <span className="ml-0.5 text-[11px] font-medium">/{unit}</span>
          </span>
        </div>

        {/* A live qualification line turns the delivery threshold into a tier
            nudge, and answers the "free nationwide shipping" claim competitors
            lead with. */}
        {freeShipping.threshold !== null && (
          <p
            className={cx(
              'mt-2 text-[12px] font-semibold',
              freeShipping.qualifies ? 'text-success' : 'text-ink-dim',
            )}
          >
            {freeShipping.qualifies ? (
              <>✓ {t(lang, 'landed.freeQualifies')}</>
            ) : (
              <>
                {taka(freeShipping.shortfall)} {t(lang, 'landed.freeShortfall')}
              </>
            )}
          </p>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-ink-dim transition-colors hover:text-ink"
        >
          {t(lang, 'landed.breakdown')}
          <ChevronDown size={13} aria-hidden className={cx('transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <dl className="zone-decision mt-2 space-y-1.5 border-t border-line pt-2.5 text-ink-dim">
            <Compact label={t(lang, 'shipping.window')}>
              {selectedQuote
                ? `${selectedQuote.courierName} · ${dayRange(selectedQuote.minDays, selectedQuote.maxDays, lang)}`
                : '—'}
            </Compact>
            <Compact label={lang === 'bn' ? 'ওজন' : 'Shipment weight'}>{weight(weightGrams)}</Compact>
            <Compact label={t(lang, 'shipping.cartons')}>
              <span className="inline-flex items-center gap-1.5">
                <Package size={12} aria-hidden />
                <span className="tnum">
                  {num(cartons)} × {num(product.logistics.cartonQty)}
                </span>
              </span>
            </Compact>
            <Compact label={lang === 'bn' ? 'কার্টনের মাপ' : 'Carton size'}>
              {product.logistics.cartonDims}
            </Compact>
          </dl>
        )}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="min-w-0 text-ink-dim">{label}</dt>
      <dd className="price shrink-0 font-semibold">{value}</dd>
    </div>
  );
}

function Compact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12px]">
      <dt>{label}</dt>
      <dd className="font-medium text-ink">{children}</dd>
    </div>
  );
}
