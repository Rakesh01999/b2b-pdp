'use client';

import { Package, Scale, Truck } from 'lucide-react';
import { useTrade } from '@/features/product/trade-context';
import { usePrefs } from '@/features/app/providers';
import { DistrictSelect } from '@/features/chrome/controls';
import { ProductSection } from './sections';
import { Badge } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import {
  cartonCount,
  freeShippingStatus,
  needsFreight,
  shipmentWeight,
  shippingQuotes,
} from '@/features/product/lib/landed-cost';
import { unitPriceForQty } from '@/features/product/lib/pricing';
import { dayRange, num, taka, unitLabel, weight } from '@/lib/format';
import { pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * Courier comparison.
 *
 * The trade panel carries one number — the estimate for the selected courier —
 * because four couriers in the buy box is four decisions too early. This section
 * is where a buyer who cares can compare, and it shows weight and carton count
 * because those drive the price and because anyone arranging their own pickup
 * needs them.
 *
 * When no quantity has been entered yet the table is computed at the MOQ rather
 * than left blank: an empty comparison teaches nothing, and the MOQ is the
 * smallest order that can actually be placed.
 */
export function ShippingSection({ lang }: { lang: Lang }) {
  const { product, qty, courierId, setCourier } = useTrade();
  const { districtId } = usePrefs();

  const illustrative = qty === 0;
  const effectiveQty = illustrative ? product.pricing.moq : qty;

  const weightGrams = shipmentWeight(effectiveQty, product.logistics.weightGrams);
  const orderValue = product.pricing.priceOnRequest
    ? 0
    : unitPriceForQty(product.pricing.tiers, effectiveQty) * effectiveQty;

  const quotes = shippingQuotes({ districtId, weightGrams, orderValue });
  const free = freeShippingStatus({ districtId, weightGrams, orderValue });
  const freight = needsFreight(weightGrams);
  const cartons = cartonCount(effectiveQty, product.logistics.cartonQty);
  const unitPlural = unitLabel(product.pricing.unit, lang, true);

  return (
    <ProductSection id="shipping" title={t(lang, 'shipping.title')}>
      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-faint">
              {t(lang, 'shipping.deliverTo')}
            </span>
            <DistrictSelect lang={lang} variant="field" id="shipping-district" className="min-w-[13rem]" />
          </label>

          <dl className="zone-reference flex flex-wrap items-end gap-x-5 gap-y-2 text-ink-dim">
            <Figure icon={<Package size={13} aria-hidden />} label={unitPlural}>
              {num(effectiveQty)}
            </Figure>
            <Figure icon={<Scale size={13} aria-hidden />} label={lang === 'bn' ? 'ওজন' : 'weight'}>
              {weight(weightGrams)}
            </Figure>
            <Figure icon={<Truck size={13} aria-hidden />} label={t(lang, 'shipping.cartons')}>
              {num(cartons)}
            </Figure>
          </dl>
        </div>

        {illustrative && (
          <p className="mt-3 text-[12px] text-ink-faint">{t(lang, 'shipping.enterQtyFirst')}</p>
        )}

        <div className="slim-scroll mt-4 overflow-x-auto rounded-[10px] border border-line">
          <table className="zone-reference w-full border-collapse text-left">
            <thead>
              <tr className="bg-surface-2">
                <Th>{t(lang, 'shipping.courier')}</Th>
                <Th align="right">{t(lang, 'shipping.cost')}</Th>
                <Th>{t(lang, 'shipping.window')}</Th>
                <Th>{t(lang, 'shipping.notes')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {quotes.map((quote) => {
                const selected = (courierId ?? quotes[0]?.courier) === quote.courier;
                return (
                  <tr
                    key={quote.courier}
                    className={cx('transition-colors', selected ? 'bg-accent-soft' : 'hover:bg-surface-2')}
                  >
                    <td className="px-3 py-2.5">
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="radio"
                          name="courier"
                          value={quote.courier}
                          checked={selected}
                          onChange={() => setCourier(quote.courier)}
                          className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                        />
                        <span className="font-semibold text-ink">{quote.courierName}</span>
                      </label>
                    </td>
                    <td className="price px-3 py-2.5 text-right font-bold">
                      {quote.cost === 0 ? (
                        <span className="text-success">{t(lang, 'shipping.free')}</span>
                      ) : (
                        taka(quote.cost)
                      )}
                    </td>
                    <td className="tnum whitespace-nowrap px-3 py-2.5 text-ink-dim">
                      {dayRange(quote.minDays, quote.maxDays, lang)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {/* At most one flag per row: four competing badges make a
                            comparison table harder to read, not easier. */}
                        {quote.flag === 'cheapest' && (
                          <Badge tone="success">{t(lang, 'shipping.cheapest')}</Badge>
                        )}
                        {quote.flag === 'fastest' && (
                          <Badge tone="info">{t(lang, 'shipping.fastest')}</Badge>
                        )}
                        {quote.note && (
                          <span className="text-[12px] text-ink-dim">{pick(quote.note, lang)}</span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ul className="zone-reference mt-3.5 space-y-1.5 text-ink-dim">
          {free.threshold !== null && (
            <li className={free.qualifies ? 'font-semibold text-success' : undefined}>
              {free.qualifies ? '✓ ' : ''}
              {lang === 'bn'
                ? `${taka(free.threshold)}-এর বেশি অর্ডারে ফ্রি ডেলিভারি`
                : `Free delivery on orders above ${taka(free.threshold)} to this zone`}
              {!free.qualifies && (
                <>
                  {' — '}
                  <span className="price font-semibold text-ink">{taka(free.shortfall)}</span>{' '}
                  {t(lang, 'landed.freeShortfall')}
                </>
              )}
            </li>
          )}
          {freight && <li className="font-semibold text-warning">{t(lang, 'shipping.freightNote')}</li>}
          {product.logistics.leadTimeDays > 0 && <li>{t(lang, 'shipping.sourcedNote')}</li>}
        </ul>
      </div>
    </ProductSection>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={cx(
        'whitespace-nowrap px-3 py-2 text-[11px] font-bold uppercase tracking-[0.05em] text-ink-faint',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}

function Figure({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-ink-faint">{icon}</span>
      <dd className="tnum font-bold text-ink">{children}</dd>
      <dt className="text-[11.5px]">{label}</dt>
    </div>
  );
}
