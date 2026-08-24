'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, ShoppingCart, Trash2, Truck } from 'lucide-react';

import { useCart, usePrefs } from '@/features/app/providers';
import { Button, ButtonLink, Skeleton } from '@/components/ui/primitives';
import { computeLandedCost, freeShippingStatus, needsFreight, shippingQuotes } from '@/features/product/lib/landed-cost';
import { cartonCount } from '@/features/product/lib/landed-cost';
import { DISTRICTS, PAYMENT_METHODS, districtById } from '@/lib/constants';
import { localeHref, pick, t } from '@/lib/i18n';
import { num, taka, unitLabel, weight } from '@/lib/format';
import type { Bilingual, Lang, SellUnit } from '@/lib/types';

/**
 * Everything the cart needs about a product that the cart entry does not carry.
 *
 * Resolved on the server and passed down, because weight and carton quantity are
 * what make the courier quote real. Without them this page could only add up
 * goods value and wave at the delivery cost, which is precisely the omission
 * that makes a wholesale cart useless — the courier bill on 40 kg is not a
 * rounding error.
 */
export interface CartProductMeta {
  slug: string;
  title: Bilingual;
  image: string;
  unit: SellUnit;
  weightGrams: number;
  cartonQty: number;
}

export function CartView({ lang, meta }: { lang: Lang; meta: CartProductMeta[] }) {
  const { entries, removeEntry, clearCart, hydrated } = useCart();
  const { districtId, paymentMethodId, setDistrict, setPaymentMethod } = usePrefs();
  const [courierId, setCourierId] = useState<string | null>(null);

  const metaBySlug = useMemo(
    () => new Map(meta.map((entry) => [entry.slug, entry])),
    [meta],
  );

  const lines = useMemo(
    () =>
      entries.map((entry, index) => {
        const info = metaBySlug.get(entry.productSlug);
        const units = entry.lines.reduce((sum, line) => sum + line.qty, 0);
        return {
          index,
          entry,
          info,
          units,
          goods: entry.unitPrice * units,
          weightGrams: units * (info?.weightGrams ?? 0),
        };
      }),
    [entries, metaBySlug],
  );

  const totals = useMemo(() => {
    const units = lines.reduce((sum, line) => sum + line.units, 0);
    const goods = lines.reduce((sum, line) => sum + line.goods, 0);
    const weightGrams = lines.reduce((sum, line) => sum + line.weightGrams, 0);
    return { units, goods, weightGrams };
  }, [lines]);

  const quotes = useMemo(
    () =>
      totals.units > 0
        ? shippingQuotes({ districtId, weightGrams: totals.weightGrams, orderValue: totals.goods })
        : [],
    [districtId, totals],
  );

  // Cheapest by default. A wholesale buyer moving 40 kg usually wants the price,
  // and the ones who want speed will choose it — which is why every option stays
  // visible rather than being decided for them.
  const courier = quotes.find((quote) => quote.courier === courierId) ?? quotes[0];

  const landed = useMemo(
    () =>
      computeLandedCost({
        qty: totals.units,
        unitPrice: totals.units > 0 ? Math.round(totals.goods / totals.units) : 0,
        shippingCost: courier?.cost ?? 0,
        paymentMethodId,
      }),
    [totals, courier, paymentMethodId],
  );

  const freeShipping = freeShippingStatus({
    districtId,
    weightGrams: totals.weightGrams,
    orderValue: totals.goods,
  });

  // Until storage has been read the count is unknown, and rendering "empty"
  // during that window would tell a buyer their cart was lost.
  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center sm:p-14">
        <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-ink-faint">
          <ShoppingCart size={30} aria-hidden />
        </span>
        <p className="text-[16px] font-bold tracking-[-0.015em]">{t(lang, 'cart.emptyTitle')}</p>
        <p className="zone-evidence mx-auto mt-2.5 max-w-[60ch] text-ink-dim">
          {t(lang, 'cart.emptyBody')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href={localeHref(lang, '/categories')} variant="primary" size="md">
            {t(lang, 'home.browseCategories')}
          </ButtonLink>
          <ButtonLink href={localeHref(lang, '/deals')} variant="secondary" size="md">
            {t(lang, 'deals.title')}
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0 space-y-3">
        {lines.map((line) => (
          <article
            key={`${line.entry.productSlug}-${line.entry.addedAt}`}
            className="flex gap-3 rounded-xl border border-line bg-surface p-3 sm:gap-4 sm:p-4"
          >
            <Link
              href={localeHref(lang, `/product/${line.entry.productSlug}`)}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:h-24 sm:w-24"
            >
              {line.info && (
                <Image
                  src={line.info.image}
                  alt={pick(line.info.title, lang)}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-[14px] font-bold leading-snug tracking-[-0.012em]">
                  <Link
                    href={localeHref(lang, `/product/${line.entry.productSlug}`)}
                    className="transition-colors hover:text-accent-ink"
                  >
                    {line.info ? pick(line.info.title, lang) : line.entry.productTitle}
                  </Link>
                </h2>
                <button
                  type="button"
                  onClick={() => removeEntry(line.index)}
                  aria-label={t(lang, 'cart.removeLine')}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-danger"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </div>

              {/* The mix, itemised. A wholesale cart line that shows only a total
                  quantity has thrown away the part the warehouse picks from. */}
              <ul className="zone-reference mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {line.entry.lines.map((mixLine) => (
                  <li key={mixLine.variantId} className="tnum text-[12px] text-ink-dim">
                    <span className="font-semibold text-ink">{mixLine.qty}</span>
                    {' × '}
                    {mixLine.label || mixLine.sku}
                  </li>
                ))}
              </ul>

              <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="tnum text-[12.5px] text-ink-faint">
                  {num(line.units)}{' '}
                  {line.info ? unitLabel(line.info.unit, lang, true) : t(lang, 'misc.units')} ·{' '}
                  {taka(line.entry.unitPrice)}/
                  {line.info ? unitLabel(line.info.unit, lang) : 'pc'}
                  {line.info && line.info.cartonQty > 0 && (
                    <>
                      {' · '}
                      {num(cartonCount(line.units, line.info.cartonQty))} ×{' '}
                      {t(lang, 'shipping.cartons')}
                    </>
                  )}
                </span>
                <span className="price text-[16px] font-bold text-price">{taka(line.goods)}</span>
              </div>
            </div>
          </article>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <ButtonLink href={localeHref(lang, '/categories')} variant="ghost" size="sm">
            {t(lang, 'cart.keepBrowsing')}
          </ButtonLink>
          <Button variant="ghost" size="sm" onClick={clearCart} className="gap-1.5 text-ink-faint">
            <Trash2 size={14} aria-hidden />
            {t(lang, 'cart.clear')}
          </Button>
        </div>
      </div>

      {/* The summary is the decision zone, so it sticks. */}
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
        <div className="zone-decision rounded-xl border border-line bg-surface p-4 sm:p-5">
          <h2 className="text-[15px] font-bold tracking-[-0.015em]">{t(lang, 'cart.summary')}</h2>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink-dim">
                {t(lang, 'chrome.deliverTo')}
              </span>
              <select
                value={districtId}
                onChange={(event) => setDistrict(event.target.value)}
                className="h-10 w-full rounded-lg border border-line-bright bg-surface px-3 text-[13.5px] outline-none focus-visible:border-accent"
              >
                {DISTRICTS.map((district) => (
                  <option key={district.id} value={district.id}>
                    {pick(district.name, lang)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink-dim">
                {t(lang, 'landed.courier')}
              </span>
              <select
                value={courier?.courier ?? ''}
                onChange={(event) => setCourierId(event.target.value)}
                className="h-10 w-full rounded-lg border border-line-bright bg-surface px-3 text-[13.5px] outline-none focus-visible:border-accent"
              >
                {quotes.map((quote) => (
                  <option key={quote.courier} value={quote.courier}>
                    {quote.courierName} — {quote.cost === 0 ? t(lang, 'shipping.free') : taka(quote.cost)} ·{' '}
                    {quote.minDays}–{quote.maxDays}d
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-ink-dim">
                {t(lang, 'landed.payWith')}
              </span>
              <select
                value={paymentMethodId}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className="h-10 w-full rounded-lg border border-line-bright bg-surface px-3 text-[13.5px] outline-none focus-visible:border-accent"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                    {method.feeBps > 0 ? ` — ${(method.feeBps / 100).toFixed(2)}%` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <dl className="tnum mt-5 space-y-2 border-t border-line pt-4 text-[13.5px]">
            <Row
              label={`${t(lang, 'cart.goods')} · ${num(totals.units)} ${t(lang, 'misc.units')}`}
              value={taka(totals.goods)}
            />
            <Row
              label={`${t(lang, 'landed.courier')} · ${weight(totals.weightGrams)}`}
              value={courier?.cost === 0 ? t(lang, 'shipping.free') : taka(landed.shippingCost)}
              tone={courier?.cost === 0 ? 'success' : undefined}
            />
            {landed.paymentFee > 0 && (
              <Row
                label={`${landed.paymentMethodName} · ${(landed.paymentFeeBps / 100).toFixed(2)}%`}
                value={taka(landed.paymentFee)}
              />
            )}
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <dt className="text-[14px] font-bold">{t(lang, 'misc.total')}</dt>
              <dd className="price text-[20px] font-bold text-price">{taka(landed.total)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 text-[12.5px] text-ink-faint">
              <dt>{t(lang, 'landed.perUnit')}</dt>
              <dd className="font-semibold">{taka(landed.perUnit)}</dd>
            </div>
          </dl>

          {!freeShipping.qualifies && freeShipping.threshold !== null && (
            <p className="tnum mt-3 rounded-lg bg-accent-soft px-3 py-2 text-[12px] text-accent-ink">
              {taka(freeShipping.shortfall)} {t(lang, 'landed.freeShortfall')}
            </p>
          )}

          {needsFreight(totals.weightGrams) && (
            <p className="mt-3 flex gap-2 rounded-lg border border-warning/40 bg-surface-2 px-3 py-2 text-[12px] text-ink-dim">
              <Truck size={14} aria-hidden className="mt-0.5 shrink-0 text-warning" />
              {t(lang, 'shipping.freightNote')}
            </p>
          )}

          {/* Disabled, and it says why. A live-looking checkout button that
              throws is worse than an honest dead end — the buyer would not know
              whether their order went through. */}
          <Button variant="primary" size="lg" className="mt-4 w-full" disabled>
            {t(lang, 'cart.checkout')}
          </Button>
          <p className="mt-2 flex gap-2 text-[11.5px] leading-relaxed text-ink-faint">
            <AlertTriangle size={13} aria-hidden className="mt-0.5 shrink-0 text-warning" />
            {t(lang, 'cart.checkoutNote')}
          </p>

          <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-relaxed text-ink-faint">
            {t(lang, 'cart.landedNote')} {pick(districtById(districtId).name, lang)}.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success';
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="min-w-0 text-ink-dim">{label}</dt>
      <dd className={tone === 'success' ? 'font-semibold text-success' : 'font-semibold text-ink'}>
        {value}
      </dd>
    </div>
  );
}
