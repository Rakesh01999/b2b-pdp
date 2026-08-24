'use client';

import { useMemo } from 'react';
import { Clock, Heart, ShoppingCart } from 'lucide-react';

import { useCart } from '@/features/app/providers';
import { ProductCardTile } from '@/features/product/components/product-card';
import { ButtonLink, Skeleton } from '@/components/ui/primitives';
import { localeHref, t } from '@/lib/i18n';
import { num, taka } from '@/lib/format';
import type { Lang, ProductCard } from '@/lib/types';

/**
 * The part of "your account" that actually exists without a session.
 *
 * Saved listings, recently viewed and the cart all live in this browser, so they
 * are real data even signed out — and showing them is what stops this page being
 * an apology. The card index is passed in from the server so the client bundle
 * carries ten cards rather than the catalogue.
 */
export function AccountLocalState({ lang, cards }: { lang: Lang; cards: ProductCard[] }) {
  const { entries, unitCount, savedSlugs, recentSlugs, hydrated } = useCart();

  const bySlug = useMemo(() => new Map(cards.map((card) => [card.slug, card])), [cards]);
  const saved = savedSlugs.map((slug) => bySlug.get(slug)).filter((card): card is ProductCard => Boolean(card));
  const recent = recentSlugs
    .map((slug) => bySlug.get(slug))
    .filter((card): card is ProductCard => Boolean(card));

  const cartValue = entries.reduce(
    (sum, entry) => sum + entry.unitPrice * entry.lines.reduce((s, line) => s + line.qty, 0),
    0,
  );

  if (!hydrated) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <ul className="grid gap-3 sm:grid-cols-3">
        <li>
          <Tile
            icon={<ShoppingCart size={17} aria-hidden />}
            label={t(lang, 'account.inCart')}
            value={`${num(unitCount)} ${t(lang, 'misc.units')}`}
            sub={entries.length > 0 ? taka(cartValue) : undefined}
            href={localeHref(lang, '/cart')}
            cta={t(lang, 'cart.title')}
          />
        </li>
        <li>
          <Tile
            icon={<Heart size={17} aria-hidden />}
            label={t(lang, 'account.savedListings')}
            value={num(saved.length)}
          />
        </li>
        <li>
          <Tile
            icon={<Clock size={17} aria-hidden />}
            label={t(lang, 'account.recentlyViewed')}
            value={num(recent.length)}
          />
        </li>
      </ul>

      <Section
        lang={lang}
        heading={t(lang, 'account.savedListings')}
        empty={t(lang, 'account.noSaved')}
        cards={saved}
      />
      <Section
        lang={lang}
        heading={t(lang, 'account.recentlyViewed')}
        empty={t(lang, 'account.noRecent')}
        cards={recent}
      />
    </div>
  );
}

function Tile({
  icon,
  label,
  value,
  sub,
  href,
  cta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-surface p-4">
      <span className="flex items-center gap-2 text-[12px] font-semibold text-ink-dim">
        <span className="text-accent-ink">{icon}</span>
        {label}
      </span>
      <span className="tnum mt-2 text-[22px] font-bold leading-none tracking-[-0.02em]">{value}</span>
      {sub && <span className="price mt-1 text-[13px] font-semibold text-price">{sub}</span>}
      {href && cta && (
        <ButtonLink href={href} variant="ghost" size="sm" className="mt-auto self-start pl-0">
          {cta}
        </ButtonLink>
      )}
    </div>
  );
}

function Section({
  lang,
  heading,
  empty,
  cards,
}: {
  lang: Lang;
  heading: string;
  empty: string;
  cards: ProductCard[];
}) {
  return (
    <section aria-label={heading}>
      <h2 className="mb-3 flex items-baseline gap-2 text-[15px] font-bold tracking-[-0.015em]">
        {heading}
        <span className="text-[11.5px] font-normal text-ink-faint">
          {t(lang, 'account.localData')}
        </span>
      </h2>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-bright bg-surface p-5 text-[13.5px] text-ink-dim">
          {empty}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8">
          {cards.map((card) => (
            <li key={card.id}>
              <ProductCardTile card={card} lang={lang} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
