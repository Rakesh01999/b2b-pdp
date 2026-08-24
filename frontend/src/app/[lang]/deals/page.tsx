import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Info, TrendingDown } from 'lucide-react';

import { ButtonLink, Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { ProductCardTile } from '@/features/product/components/product-card';
import { getDeals } from '@/lib/catalog';
import { HREFLANG, LOCALES, isLocale, localeHref, t } from '@/lib/i18n';
import { num, taka, unitLabel } from '@/lib/format';

/**
 * Volume deals.
 *
 * Derived, not curated: every entry is ranked by the real spread between its
 * minimum-order price and its floor price, which is a claim the listing itself
 * can be checked against. There are no countdown timers and no "was" prices,
 * because a staple that restocks weekly is not a flash sale and a clock on one
 * is just a lie with a timer attached.
 */
const BASE = 'https://arcb2b.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  return {
    title: t(lang, 'deals.title'),
    description: t(lang, 'deals.sub'),
    alternates: {
      canonical: `${BASE}/${lang}/deals`,
      languages: Object.fromEntries(
        LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}/deals`]),
      ),
    },
  };
}

export default async function DealsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const deals = await getDeals(12);

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'deals.title') },
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />

      <PageHeader
        title={t(lang, 'deals.title')}
        intro={t(lang, 'deals.sub')}
        actions={
          <ButtonLink href={localeHref(lang, '/categories')} variant="secondary" size="md">
            {t(lang, 'home.browseCategories')}
          </ButtonLink>
        }
      />

      {deals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center text-ink-dim">
          {t(lang, 'deals.empty')}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {deals.map((deal) => {
            const entry = deal.card.tiers[0];
            const best = deal.card.tiers[deal.card.tiers.length - 1];
            const unit = unitLabel(deal.card.unit, lang);

            return (
              <li key={deal.card.id}>
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
                  {/* The claim sits above the card, stated as what it is: the
                      ladder spread, with both ends of it visible underneath so
                      the buyer can check the arithmetic. */}
                  <div className="flex items-center gap-2 border-b border-line bg-accent-soft px-3 py-2">
                    <TrendingDown size={15} aria-hidden className="shrink-0 text-accent-ink" />
                    <span className="tnum text-[13px] font-bold text-accent-ink">
                      {deal.spreadPercent}% {t(lang, 'deals.spreadOff')}
                    </span>
                  </div>

                  <ProductCardTile
                    card={deal.card}
                    lang={lang}
                    className="rounded-none border-0"
                    sizes="(max-width: 640px) 92vw, (max-width: 1280px) 30vw, 220px"
                  />

                  <dl className="tnum grid grid-cols-2 gap-x-3 gap-y-1 border-t border-line px-3 py-2.5 text-[11.5px]">
                    <div>
                      <dt className="text-ink-faint">{t(lang, 'deals.entryPrice')}</dt>
                      <dd className="font-semibold text-ink-dim">
                        {taka(entry.unitPrice)}/{unit}
                        <span className="ml-1 font-normal text-ink-faint">
                          @ {num(entry.minQty)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">{t(lang, 'deals.bestPrice')}</dt>
                      <dd className="font-bold text-price">
                        {taka(best.unitPrice)}/{unit}
                        <span className="ml-1 font-normal text-ink-faint">
                          @ {num(deal.bestAtQty)}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="zone-evidence mt-8 flex max-w-[70ch] gap-2.5 rounded-xl border border-line bg-surface-2 p-4 text-[13.5px] leading-relaxed text-ink-dim">
        <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-accent-ink" />
        {t(lang, 'deals.method')}
      </p>
    </Container>
  );
}
