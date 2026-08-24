import Link from 'next/link';
import { BadgeCheck, Factory, FileCheck2, MapPin, MessageCircle, ShieldAlert, Store } from 'lucide-react';
import { Badge, ButtonLink } from '@/components/ui/primitives';
import { InfoTip } from '@/components/ui/info-tip';
import { cx } from '@/components/ui/cx';
import { METRIC_MIN_SAMPLE } from '@/lib/constants';
import { num, pct } from '@/lib/format';
import { localeHref, pick, t, type StringKey } from '@/lib/i18n';
import type { Lang, Product, SellerMetric, SellerMetricKey } from '@/lib/types';

/**
 * Who you are buying from, and the evidence for trusting them.
 *
 * One component, two data modes. In the contracted P0 model ArcB2B imports and
 * sells, so this renders ArcB2B as the seller plus a provenance line naming the
 * factory the line was sourced from. In marketplace mode the same component
 * renders a real supplier storefront and the provenance line drops away for
 * locally manufactured goods. Designing that seam now is what makes P1 a data
 * change instead of a rewrite.
 *
 * The trust ledger is four measured numbers, not a wall of badges. Nobody has
 * heard of ArcB2B or of "Guangzhou Lianhe", so an unverifiable badge does no
 * work — whereas a response rate with its definition attached, and an explicit
 * "not enough orders yet" where the sample is too small, does.
 */

const METRIC_LABEL: Record<SellerMetricKey, StringKey> = {
  response: 'seller.metric.response',
  onTime: 'seller.metric.onTime',
  reorder: 'seller.metric.reorder',
  disputes: 'seller.metric.disputes',
};

const METRIC_DEFINITION: Record<SellerMetricKey, StringKey> = {
  response: 'seller.metric.response.def',
  onTime: 'seller.metric.onTime.def',
  reorder: 'seller.metric.reorder.def',
  disputes: 'seller.metric.disputes.def',
};

/** Response is counted from messages; the rest from orders. */
function minSample(key: SellerMetricKey): number {
  return key === 'response' ? METRIC_MIN_SAMPLE.messages : METRIC_MIN_SAMPLE.orders;
}

function isPublishable(metric: SellerMetric): boolean {
  return metric.value !== null && metric.sampleSize >= minSample(metric.key);
}

export function SellerBlock({
  product,
  lang,
  id,
}: {
  product: Product;
  lang: Lang;
  id?: string;
}) {
  const { seller, provenance } = product;
  const suspended = product.status === 'suspended' || !seller.verified;

  return (
    <section
      id={id}
      aria-labelledby="seller-heading"
      className="grid gap-0 overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
    >
      {/* Identity */}
      <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
        <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
          {t(lang, 'seller.soldBy')}
        </p>

        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className={cx(
              'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[18px] font-bold text-on-fill',
              seller.kind === 'platform' ? 'bg-accent' : 'bg-info',
            )}
          >
            {seller.name.charAt(0)}
          </span>

          <div className="min-w-0 flex-1">
            <h2 id="seller-heading" className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={localeHref(lang, seller.storeHref)}
                className="text-[15.5px] font-bold tracking-[-0.01em] transition-colors hover:text-accent-ink"
              >
                {seller.name}
              </Link>
              {seller.verified && (
                <BadgeCheck size={16} className="shrink-0 text-info" aria-label={t(lang, 'seller.verified')} />
              )}
            </h2>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {seller.escrow && (
                <Badge tone="success" icon={<ShieldAlert size={11} aria-hidden />}>
                  {t(lang, 'seller.escrowSeller')}
                </Badge>
              )}
              <Badge tone="neutral">
                <span className="tnum">{seller.yearsActive}</span> {t(lang, 'seller.years')}
              </Badge>
              <Badge tone="neutral">
                <span className="tnum">{num(seller.skuCount)}</span> {t(lang, 'seller.skus')}
              </Badge>
            </div>

            <p className="zone-reference mt-2 inline-flex items-center gap-1.5 text-ink-dim">
              <MapPin size={13} aria-hidden />
              {pick(seller.location, lang)}
            </p>
          </div>
        </div>

        {/* Provenance. On an import-driven catalogue, naming the factory is a
            trust asset — and hiding it while calling the listing "factory
            direct" would be the opposite. */}
        {provenance && (
          <div className="zone-reference mt-4 rounded-[10px] border border-line bg-surface-2/70 p-3">
            <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-faint">
              <Factory size={12} aria-hidden />
              {t(lang, 'seller.sourcedFrom')}
            </p>
            <p className="font-semibold text-ink">{provenance.factoryName}</p>
            <p className="text-ink-dim">
              {pick(provenance.region, lang)} ·{' '}
              <span className="tnum">{provenance.yearsActive}</span> {t(lang, 'seller.years')}
              {provenance.verified && (
                <>
                  {' · '}
                  <span className="font-semibold text-success">
                    {t(lang, 'seller.verifiedFactory')}
                  </span>
                </>
              )}
              {provenance.platform === '1688' && ' · 1688'}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink
            href={localeHref(lang, seller.storeHref)}
            variant="secondary"
            size="md"
            className="flex-1 gap-1.5"
          >
            <Store size={15} aria-hidden />
            {t(lang, 'cta.visitStore')}
          </ButtonLink>
          <ButtonLink
            href={localeHref(lang, `/messages?seller=${seller.id}`)}
            variant="outline-accent"
            size="md"
            className="flex-1 gap-1.5"
          >
            <MessageCircle size={15} aria-hidden />
            {t(lang, 'cta.contactSeller')}
          </ButtonLink>
        </div>
      </div>

      {/* Trust ledger */}
      <div className="p-5">
        {suspended ? (
          <div className="flex h-full flex-col items-start justify-center gap-2 rounded-[10px] border border-warning/30 bg-warning-soft p-4">
            <ShieldAlert size={20} className="text-warning" aria-hidden />
            <p className="text-[13.5px] font-semibold leading-relaxed text-warning">
              {t(lang, 'seller.underReview')}
            </p>
            <p className="text-[12.5px] leading-relaxed text-ink-dim">
              {lang === 'bn'
                ? 'যাচাই সম্পন্ন না হওয়া পর্যন্ত পারফরম্যান্স মেট্রিক প্রকাশ করা হয় না।'
                : 'Performance metrics are not published until verification completes.'}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
              {t(lang, 'seller.metricsTitle')}
            </p>

            <SellerMetricsGrid metrics={seller.metrics} lang={lang} />

            {seller.certifications.length > 0 && (
              <div className="mt-4 border-t border-line pt-3.5">
                <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
                  {t(lang, 'seller.certifications')}
                </p>
                <ul className="flex flex-wrap gap-1.5">
                  {/* A certification chip only renders when there is a verified
                      document behind it. A claim with nothing to open is not a
                      certification, it is a sentence. */}
                  {seller.certifications
                    .filter((cert) => Boolean(cert.documentUrl))
                    .map((cert) => (
                      <li key={cert.code}>
                        <Link
                          href={cert.documentUrl!}
                          className="inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info-soft px-2.5 py-1 text-[11.5px] font-semibold text-info transition-colors hover:border-info/60"
                          title={t(lang, 'seller.viewDocument')}
                        >
                          <FileCheck2 size={12} aria-hidden />
                          {pick(cert.label, lang)}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/**
 * The trust ledger on its own, so the storefront page renders the identical
 * four tiles rather than a second implementation that drifts from this one.
 */
export function SellerMetricsGrid({
  metrics,
  lang,
  className = 'grid grid-cols-2 gap-2.5',
}: {
  metrics: SellerMetric[];
  lang: Lang;
  className?: string;
}) {
  return (
    <dl className={className}>
      {metrics.map((metric) => (
        <MetricTile key={metric.key} metric={metric} lang={lang} />
      ))}
    </dl>
  );
}

function MetricTile({ metric, lang }: { metric: SellerMetric; lang: Lang }) {
  const publishable = isPublishable(metric);
  const label = t(lang, METRIC_LABEL[metric.key]);
  const sampleNoun = metric.key === 'response' ? t(lang, 'seller.messages') : t(lang, 'seller.orders');

  return (
    <div className="rounded-[10px] border border-line bg-surface-2/70 px-3 py-2.5">
      <dt className="flex items-center gap-0.5 text-[11.5px] font-semibold text-ink-dim">
        {label}
        <InfoTip label={label} align="end">
          <span className="block">{t(lang, METRIC_DEFINITION[metric.key])}</span>
          <span className="mt-1.5 block text-ink-faint">
            {t(lang, 'seller.fromOrders')} <span className="tnum">{num(metric.sampleSize)}</span>{' '}
            {sampleNoun}
          </span>
        </InfoTip>
      </dt>
      <dd className="mt-0.5">
        {publishable ? (
          <span className="price text-[19px] font-bold leading-none">{pct(metric.value!)}</span>
        ) : (
          // The honest state. A percentage computed from four orders is noise
          // wearing the costume of evidence, so it is not published at all.
          <span className="block text-[11.5px] font-semibold leading-snug text-ink-faint">
            {t(lang, 'seller.notEnoughData')}
          </span>
        )}
      </dd>
    </div>
  );
}
