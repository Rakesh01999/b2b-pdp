import Image from 'next/image';
import Link from 'next/link';
import { Truck } from 'lucide-react';
import { Badge, MetaDot, MetaRow, Stars } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import { localeHref, pick, t } from '@/lib/i18n';
import { num, taka, unitLabel } from '@/lib/format';
import { lowestUnitPrice, unitPriceForQty } from '@/features/product/lib/pricing';
import type { Lang, ProductCard as Card } from '@/lib/types';

/**
 * Card used by the recommendation rails and the catalogue grid.
 *
 * `compareQty` is the point of this component. On a "similar products" rail the
 * headline "from" price is useless for comparison — a buyer holding 200 pieces
 * in the trade panel wants to know what each alternative costs *at 200*, and
 * every tier ladder breaks at a different quantity. Passing the current
 * quantity makes the rail answer the question the buyer is actually asking.
 */
export function ProductCardTile({
  card,
  lang,
  compareQty,
  className,
  priority = false,
  sizes = '(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 190px',
}: {
  card: Card;
  lang: Lang;
  compareQty?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const quoteOnly = card.tiers.length === 0;
  const comparing = compareQty != null && compareQty > 0 && !quoteOnly;
  const displayPrice = comparing
    ? unitPriceForQty(card.tiers, compareQty)
    : lowestUnitPrice(card.tiers);

  return (
    <Link
      href={localeHref(lang, `/product/${card.slug}`)}
      className={cx(
        'group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition duration-200 hover:border-accent/45 hover:shadow-sm',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        <Image
          src={card.image}
          alt={pick(card.title, lang)}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {!card.madeToOrder && (
          <span className="absolute left-2 top-2">
            <Badge tone="success">{t(lang, 'product.localStock')}</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="clamp-2 text-[13px] font-semibold leading-[1.4] text-ink transition-colors group-hover:text-accent-ink">
          {pick(card.title, lang)}
        </h3>

        <div className="mt-auto space-y-1 pt-1">
          {quoteOnly ? (
            <div className="text-[13px] font-bold text-accent-ink">{t(lang, 'ladder.priceOnRequest')}</div>
          ) : (
            <div className="flex items-baseline gap-1">
              {!comparing && (
                <span className="text-[11px] text-ink-faint">{t(lang, 'rail.fromPrice')}</span>
              )}
              <span className="price text-[17px] font-bold leading-none text-price">
                {taka(displayPrice)}
              </span>
              <span className="text-[11px] text-ink-dim">/{unitLabel(card.unit, lang)}</span>
            </div>
          )}

          {comparing && (
            <div className="tnum text-[11px] font-medium text-success">
              {t(lang, 'ladder.atQty')} {num(compareQty!)} {unitLabel(card.unit, lang, true)}
            </div>
          )}

          <MetaRow className="text-[11.5px]">
            <span className="tnum font-semibold text-ink-dim">
              {t(lang, 'moq.label')} {num(card.moq)}
            </span>
            {card.rating != null ? (
              <>
                <MetaDot />
                <span className="inline-flex items-center gap-1">
                  <Stars rating={card.rating} size={11} />
                  <span className="tnum">{card.rating.toFixed(1)}</span>
                </span>
              </>
            ) : (
              card.ordersPlaced > 0 && (
                <>
                  <MetaDot />
                  <span className="tnum">
                    {num(card.ordersPlaced)} {t(lang, 'product.sold')}
                  </span>
                </>
              )
            )}
          </MetaRow>

          {/* Sourcing and dispatch are different claims. A line that ships from
              Dhaka stock in three days is in stock; only a declared production
              window makes it made-to-order. */}
          {card.leadTimeDays > 0 && (
            <div className={cx('inline-flex items-center gap-1.5 text-[11px]', card.madeToOrder ? 'text-info' : 'text-ink-dim')}>
              <Truck size={11} aria-hidden />
              <span className="tnum">
                {card.leadTimeDays}
                {lang === 'bn' ? ' দিনে' : 'd'}
              </span>
              <span>
                {card.madeToOrder ? t(lang, 'product.sourcedToOrder') : t(lang, 'product.dispatch')}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Horizontal snap rail below `md`, grid above — used by all three rails. */
export function ProductRail({
  cards,
  lang,
  compareQty,
  cols = 6,
}: {
  cards: Card[];
  lang: Lang;
  compareQty?: number;
  cols?: 4 | 5 | 6;
}) {
  const gridCols = {
    4: 'md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6',
    5: 'md:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7',
    6: 'md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8',
  }[cols];

  return (
    <div
      className={cx(
        // Below md this is a snap-scrolling row; from md up it becomes a grid.
        // Two behaviours, one DOM — no duplicated markup to drift apart.
        'slim-scroll -mx-4 grid auto-cols-[minmax(9.5rem,45vw)] grid-flow-col gap-3 overflow-x-auto px-4 pb-2',
        'snap-x snap-mandatory',
        'md:mx-0 md:auto-cols-auto md:grid-flow-row md:overflow-visible md:px-0 md:pb-0',
        gridCols,
      )}
    >
      {cards.map((card) => (
        <ProductCardTile
          key={card.id}
          card={card}
          lang={lang}
          compareQty={compareQty}
          className="snap-start md:snap-align-none"
        />
      ))}
    </div>
  );
}
