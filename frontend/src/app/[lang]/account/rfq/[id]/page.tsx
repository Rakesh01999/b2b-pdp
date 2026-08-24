import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarClock, Clock, Info, MapPin, Store } from 'lucide-react';

import { Badge, ButtonLink, Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { allRfqIds, findRfqThread, type RfqQuote } from '@/data/account';
import { districtById } from '@/lib/constants';
import { isLocale, localeHref, pick, t, tn } from '@/lib/i18n';
import { dateShort, num, taka } from '@/lib/format';
import { cx } from '@/components/ui/cx';
import type { Lang } from '@/lib/types';

/**
 * One quotation request, with the replies side by side.
 *
 * This is the screen the whole RFQ flow exists to reach, and the design problem
 * it solves is that three suppliers never answer the same question. One quotes
 * 1,200 units, another only at 1,500; one is three weeks faster and ৳25 dearer.
 * Comparing the headline prices would pick the wrong one, so each column
 * computes a landed per-unit figure at *its own* quantity — the only number the
 * three can honestly be ranked by.
 */
export async function generateStaticParams() {
  return allRfqIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang, id } = await params;
  if (!isLocale(lang)) return {};
  const thread = findRfqThread(id);
  return {
    title: thread ? `${t(lang, 'rfqThread.title')} ${id}` : t(lang, 'rfqThread.notFound'),
    robots: { index: false, follow: false },
  };
}

/** Landed per unit at the quantity this quote is actually valid for. */
function landedPerUnit(quote: RfqQuote): number {
  return Math.round((quote.unitPrice * quote.minQty + quote.courierEstimate) / quote.minQty);
}

export default async function RfqThreadPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLocale(lang)) notFound();

  const thread = findRfqThread(id);
  if (!thread) notFound();

  const cheapest = Math.min(...thread.quotes.map(landedPerUnit));
  const fastest = Math.min(...thread.quotes.map((quote) => quote.leadTimeDays));

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'account.title'), href: '/account' },
    { name: thread.id },
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />

      <PageHeader
        eyebrow={`${t(lang, 'rfqThread.title')} ${thread.id}`}
        title={pick(thread.item, lang)}
        meta={
          <span className="tnum flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>
              {t(lang, 'rfqThread.requested')} {num(thread.quantity)} {t(lang, 'misc.units')}
            </span>
            <span>
              {t(lang, 'rfq.targetPrice')} {taka(thread.targetPrice)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} aria-hidden />
              {pick(districtById(thread.districtId).name, lang)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={13} aria-hidden />
              {t(lang, 'rfq.neededBy')} {dateShort(thread.neededBy, lang)}
            </span>
          </span>
        }
      />

      <section
        aria-labelledby="request-heading"
        className="mb-9 rounded-xl border border-line bg-surface p-4 sm:p-5"
      >
        <h2
          id="request-heading"
          className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint"
        >
          {t(lang, 'rfq.details')}
        </h2>
        <p className="zone-evidence max-w-[70ch] text-ink-dim">{pick(thread.details, lang)}</p>

        {thread.customisation.length > 0 && (
          <ul className="mt-3.5 flex flex-wrap gap-1.5">
            {thread.customisation.map((item) => (
              <li key={item.en}>
                <Badge tone="info">{pick(item, lang)}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold tracking-[-0.02em]">
          {thread.quotes.length}{' '}
          {tn(lang, thread.quotes.length, 'rfqThread.quoteReceived', 'rfqThread.quotesReceived')}
        </h2>
        <span className="tnum text-[12.5px] text-ink-faint">
          {t(lang, 'rfqThread.awaiting')} · {thread.awaitingCount}
        </span>
      </div>

      {/* Cards, not a table. Each quote carries a different quantity, a different
          lead time and a different validity date; a table would force those into
          shared columns and imply a comparison the rows do not support. */}
      <ul className="grid gap-3 lg:grid-cols-3 2xl:gap-4">
        {thread.quotes.map((quote) => (
          <li key={quote.id}>
            <QuoteCard
              quote={quote}
              lang={lang}
              isCheapest={landedPerUnit(quote) === cheapest}
              isFastest={quote.leadTimeDays === fastest}
              belowTarget={quote.unitPrice < thread.targetPrice}
              requestedQty={thread.quantity}
            />
          </li>
        ))}
      </ul>

      <p className="zone-evidence mt-7 flex max-w-[74ch] gap-2.5 rounded-xl border border-line bg-surface-2 p-4 text-[13.5px] leading-relaxed text-ink-dim">
        <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-accent-ink" />
        {t(lang, 'rfqThread.compareNote')}
      </p>
    </Container>
  );
}

function QuoteCard({
  quote,
  lang,
  isCheapest,
  isFastest,
  belowTarget,
  requestedQty,
}: {
  quote: RfqQuote;
  lang: Lang;
  isCheapest: boolean;
  isFastest: boolean;
  belowTarget: boolean;
  requestedQty: number;
}) {
  const landed = landedPerUnit(quote);
  const shortfall = quote.minQty - requestedQty;

  return (
    <article
      className={cx(
        'flex h-full flex-col rounded-xl border bg-surface p-4 sm:p-5',
        isCheapest ? 'border-accent' : 'border-line',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-[14.5px] font-bold leading-snug tracking-[-0.012em]">
          <Link
            href={localeHref(lang, quote.storeHref)}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-accent-ink"
          >
            <Store size={14} aria-hidden className="shrink-0 text-ink-faint" />
            {quote.sellerName}
          </Link>
        </h3>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isCheapest && <Badge tone="success">{t(lang, 'rfqThread.bestOnPrice')}</Badge>}
          {isFastest && <Badge tone="info">{t(lang, 'rfqThread.bestOnSpeed')}</Badge>}
        </div>
      </div>

      <div className="mt-4">
        <p className="price text-[26px] font-bold leading-none tracking-[-0.02em] text-price">
          {taka(quote.unitPrice)}
        </p>
        <p className="tnum mt-1.5 text-[12.5px] text-ink-dim">
          {t(lang, 'ladder.atQty')} {num(quote.minQty)} {t(lang, 'misc.units')}
          {belowTarget && (
            <span className="ml-1.5 font-semibold text-success">
              {t(lang, 'rfqThread.underTarget')}
            </span>
          )}
        </p>
      </div>

      <dl className="tnum mt-4 space-y-2 border-t border-line pt-3.5 text-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-faint">{t(lang, 'rfqThread.landedPerUnit')}</dt>
          <dd className="font-bold text-ink">{taka(landed)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-faint">{t(lang, 'rfqThread.leadTime')}</dt>
          <dd className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <Clock size={12} aria-hidden className="text-ink-faint" />
            {quote.leadTimeDays}
            {lang === 'bn' ? ' দিন' : ' days'}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-faint">{t(lang, 'rfqThread.validUntil')}</dt>
          <dd className="font-semibold text-ink">{dateShort(quote.validUntil, lang)}</dd>
        </div>
      </dl>

      {/* The catch, stated where the buyer will read it rather than in a
          footnote. A cheaper unit price that needs 300 more units is not
          cheaper unless those 300 can be sold. */}
      {shortfall > 0 && (
        <p className="tnum mt-3 rounded-lg border border-warning/40 bg-surface-2 px-3 py-2 text-[12px] leading-relaxed text-ink-dim">
          {t(lang, 'rfqThread.needsMore')} {num(shortfall)} {t(lang, 'misc.units')}
        </p>
      )}

      {quote.note && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-dim">{pick(quote.note, lang)}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <ButtonLink
          href={localeHref(lang, `/messages?seller=${quote.sellerId}`)}
          variant="secondary"
          size="md"
          className="flex-1"
        >
          {t(lang, 'rfqThread.negotiate')}
        </ButtonLink>
        <ButtonLink
          href={localeHref(lang, quote.storeHref)}
          variant="ghost"
          size="md"
        >
          {t(lang, 'cta.visitStore')}
        </ButtonLink>
      </div>
    </article>
  );
}
