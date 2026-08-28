import Link from 'next/link';
import { ArrowRight, BadgeCheck, Factory, PackageCheck, Truck } from 'lucide-react';
import { Badge, MetaDot, MetaRow, Stars } from '@/components/ui/primitives';
import { localeHref, pick, t } from '@/lib/i18n';
import { num, unitLabel } from '@/lib/format';
import { totalStock } from '@/features/product/lib/mix';
import type { Lang, Product } from '@/lib/types';

/**
 * Everything above the trade panel, and all of it server-rendered.
 *
 * The order is load-bearing rather than aesthetic. MOQ comes first because it is
 * the qualifying gate: a buyer who cannot meet a 200-piece minimum should learn
 * that in the first second, not after filling in a mix grid. The rating line
 * comes before the attributes because trust is evaluated before specification.
 * And the eight key attributes exist so a professional buyer can skip the entire
 * lower page — which is the difference between a page that serves a first-time
 * importer and one that also serves someone placing their fortieth order.
 */
export function ProductSummary({ product, lang }: { product: Product; lang: Lang }) {
  const { pricing, logistics, rating, stats } = product;
  const stock = totalStock(product.variants);

  const keyAttributes = product.specifications.filter((spec) => spec.key).slice(0, 8);
  const totalSpecs = product.specifications.length;

  return (
    <div>
      {/* At most four badges. A fifth means one of the five is not important. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="moq" icon={<PackageCheck size={12} aria-hidden />}>
          {t(lang, 'moq.label')} {num(pricing.moq)} {unitLabel(pricing.unit, lang, true)}
        </Badge>

        {/* Local stock and sourced-to-order are decided by whether the seller
            declares a production window, not by dispatch lead time — a line that
            ships from a Dhaka warehouse in three days is in stock, and labelling
            it "sourced to order" pushes buyers toward a quote they don't need.
            That check has to run before the zero-stock check, not after: a pure
            made-to-order listing is *supposed* to hold nothing in a warehouse,
            and reporting "out of stock" on it contradicts the trade panel below,
            which is already using `resolveListingState()`'s correct precedence. */}
        {logistics.sourcingDays ? (
          <Badge tone="info" icon={<Truck size={12} aria-hidden />}>
            {t(lang, 'product.sourcedToOrder')}
          </Badge>
        ) : product.status === 'out_of_stock' || stock === 0 ? (
          <Badge tone="danger">{t(lang, 'product.outOfStock')}</Badge>
        ) : (
          <Badge tone="success" icon={<Truck size={12} aria-hidden />}>
            {t(lang, 'product.localStock')}
          </Badge>
        )}

        {/* "Best seller" is reserved for a signal the listing actually earned
            through orders, not a decoration the merchandiser can switch on. */}
        {stats.ordersPlaced >= 1000 && (
          <Badge tone="earned">{t(lang, 'product.bestSeller')}</Badge>
        )}

        {product.provenance?.verified && (
          <Badge tone="info" icon={<Factory size={12} aria-hidden />}>
            {t(lang, 'product.factoryDirect')}
          </Badge>
        )}
      </div>

      <h1 className="mt-3 text-balance text-[21px] font-bold leading-[1.28] tracking-[-0.02em] sm:text-[24px]">
        {pick(product.title, lang)}
      </h1>

      <MetaRow className="mt-2.5">
        {/* Rating renders only when reviews exist. A default value here would
            put an invented number in front of the buyer and into schema.org. */}
        {rating ? (
          <a href="#reviews" className="inline-flex items-center gap-1.5 transition-colors hover:text-accent-ink">
            <Stars rating={rating.average} size={13} label={`${rating.average} ${t(lang, 'reviews.outOf5')}`} />
            <span className="tnum font-semibold text-ink">{rating.average.toFixed(1)}</span>
            <span className="tnum">
              ({num(rating.total)} {t(lang, 'product.reviews')})
            </span>
          </a>
        ) : (
          <span className="text-ink-faint">{t(lang, 'product.noReviewsYet')}</span>
        )}

        {stats.ordersPlaced > 0 && (
          <>
            <MetaDot />
            <span>
              <b className="tnum font-semibold text-ink">{num(stats.ordersPlaced)}</b>{' '}
              {t(lang, 'product.sold')}
            </span>
          </>
        )}

        <MetaDot />
        <span className="tnum">
          {t(lang, 'product.sku')} {product.sku}
        </span>

        <MetaDot />
        <Link
          href={localeHref(lang, `/category/${product.category.slug}`)}
          className="transition-colors hover:text-accent-ink"
        >
          {pick(product.category.name, lang)}
        </Link>
      </MetaRow>

      {product.seller.escrow && (
        <p className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-success">
          <BadgeCheck size={14} aria-hidden />
          {t(lang, 'assurance.escrow')}
        </p>
      )}

      {keyAttributes.length > 0 && (
        <section className="zone-reference mt-5 rounded-xl border border-line bg-surface-2/60 p-4">
          <h2 className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
            {t(lang, 'product.keyAttributes')}
          </h2>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {keyAttributes.map((spec) => (
              <div key={spec.label.en} className="flex items-baseline gap-3">
                <dt className="w-[8.5rem] shrink-0 text-ink-faint">{pick(spec.label, lang)}</dt>
                <dd className="min-w-0 flex-1 font-medium text-ink">{pick(spec.value, lang)}</dd>
              </div>
            ))}
          </dl>
          {totalSpecs > keyAttributes.length && (
            <a
              href="#specifications"
              className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-ink transition-all hover:gap-2.5"
            >
              {t(lang, 'product.fullSpecs')} ({num(totalSpecs)})
              <ArrowRight size={13} aria-hidden />
            </a>
          )}
        </section>
      )}
    </div>
  );
}
