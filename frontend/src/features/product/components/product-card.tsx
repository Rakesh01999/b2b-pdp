import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Truck } from 'lucide-react';
import { Badge, Stars } from '@/components/ui/primitives';
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
 *
 * Every card is the same height, on purpose. Each content row below the image —
 * title, price, the MOQ/rating line, the dispatch line — reserves its own space
 * whether or not that particular listing has something to put there, instead of
 * collapsing when a field is absent. A grid where card height tracks how much
 * data happened to be filled in reads as unfinished; a buyer scanning forty
 * listings should be comparing prices, not re-parsing a ragged layout.
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
        // No `h-full` here on purpose: every content row below the image
        // already reserves a fixed height (see the block comment above), so
        // every card is the same height from its own content alone. That
        // matters because this component also gets nested inside the deals
        // page's own card chrome (a badge strip above it, a stats footer
        // below) — stretching to fill a parent that already has siblings
        // claiming space would overflow it instead of sizing correctly.
        'group flex flex-col overflow-hidden rounded-xl border border-line bg-surface transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:border-accent/55 hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-square shrink-0 overflow-hidden bg-surface-2">
        <Image
          src={card.image}
          alt={pick(card.title, lang)}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />

        {/* A wash on hover, not a permanent tint — it exists so the badge stays
            legible over a bright product photo once the image has zoomed in. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Exactly one supply badge, always — dispatch-from-stock or
            sourced-to-order, never neither. A card with no badge at all reads
            as a loading state, not as "this one just doesn't apply". */}
        <span className="absolute left-2 top-2">
          {card.madeToOrder ? (
            <Badge tone="info">{t(lang, 'product.sourcedToOrder')}</Badge>
          ) : (
            <Badge tone="success">{t(lang, 'product.localStock')}</Badge>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {/* `min-h` reserves two full lines even when the title only needs one,
            so a short title and a long one produce the same card height. */}
        <h3 className="clamp-2 min-h-[36px] text-[13px] font-semibold leading-[1.4] text-ink transition-colors group-hover:text-accent-ink">
          {pick(card.title, lang)}
        </h3>

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex min-h-[24px] items-baseline gap-1">
            {quoteOnly ? (
              <span className="text-[13.5px] font-bold text-accent-ink">
                {t(lang, 'ladder.priceOnRequest')}
              </span>
            ) : (
              <>
                {!comparing && (
                  <span className="text-[11px] text-ink-faint">{t(lang, 'rail.fromPrice')}</span>
                )}
                <span className="price text-[18px] font-extrabold leading-none tracking-[-0.01em] text-price">
                  {taka(displayPrice)}
                </span>
                <span className="text-[11px] text-ink-dim">/{unitLabel(card.unit, lang)}</span>
              </>
            )}
          </div>

          {comparing && (
            <div className="tnum -mt-1 text-[11px] font-medium text-success">
              {t(lang, 'ladder.atQty')} {num(compareQty!)} {unitLabel(card.unit, lang, true)}
            </div>
          )}

          {/* MOQ on the left, the one social-proof signal the listing has on
              the right — rating beats order count, order count beats "new".
              The divider gives every card the same visual seam here, whether
              the right side is a star rating, an order count, or a fallback. */}
          <div className="flex items-center justify-between gap-2 border-t border-line pt-2">
            <span className="tnum text-[11px] font-semibold text-ink-dim">
              {t(lang, 'moq.label')} {num(card.moq)}
            </span>
            {card.rating != null ? (
              <span className="inline-flex items-center gap-1">
                <Stars rating={card.rating} size={11} />
                <span className="tnum text-[11px] font-semibold text-ink-dim">
                  {card.rating.toFixed(1)}
                </span>
              </span>
            ) : card.ordersPlaced > 0 ? (
              <span className="tnum text-[11px] text-ink-faint">
                {num(card.ordersPlaced)} {t(lang, 'product.sold')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-ink">
                <Sparkles size={11} aria-hidden />
                {t(lang, 'product.new')}
              </span>
            )}
          </div>

          {/* Sourcing and dispatch are different claims — a line that ships
              from Dhaka stock in three days is in stock; only a declared
              production window makes it made-to-order. Always rendered now,
              including the same-day case, which used to render nothing at all
              and quietly made same-day listings the shortest cards on the
              page. */}
          <div
            className={cx(
              'inline-flex items-center gap-1.5 text-[11px]',
              card.madeToOrder ? 'text-info' : 'text-ink-dim',
            )}
          >
            <Truck size={11} aria-hidden />
            {card.leadTimeDays === 0 ? (
              <span>{t(lang, 'product.shipsToday')}</span>
            ) : (
              <>
                <span className="tnum">
                  {card.leadTimeDays}
                  {lang === 'bn' ? ' দিনে' : 'd'}
                </span>
                <span>
                  {card.madeToOrder ? t(lang, 'product.sourcedToOrder') : t(lang, 'product.dispatch')}
                </span>
              </>
            )}
          </div>
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
