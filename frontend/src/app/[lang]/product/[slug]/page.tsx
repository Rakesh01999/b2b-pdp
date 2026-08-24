import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';

import { Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { BackToResults } from '@/components/layout/back-to-results';
import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/seo/structured-data';

import { TradeProvider } from '@/features/product/trade-context';
import { toTradeProduct } from '@/features/product/trade-product';
import { ProductGallery } from '@/features/product/components/gallery';
import { ProductSummary } from '@/features/product/components/summary';
import { TradePanel } from '@/features/product/components/trade/trade-panel';
import { StickyTradeBar } from '@/features/product/components/trade/sticky-trade-bar';
import { SellerBlock } from '@/features/product/components/seller-block';
import { SectionNav, type SectionLink } from '@/features/product/components/section-nav';
import { ProductOverview, ProductSpecifications } from '@/features/product/components/sections';
import { ShippingSection } from '@/features/product/components/shipping-section';
import { ReviewsSection } from '@/features/product/components/reviews-section';
import { BoughtTogetherRail, SimilarRail } from '@/features/product/components/rails';
import { RecentlyViewed } from '@/features/product/components/recently-viewed';

import { getAllProductSlugs, getCards, getProduct } from '@/lib/catalog';
import { lowestUnitPrice } from '@/features/product/lib/pricing';
import { HREFLANG, LOCALES, isLocale, pick, t } from '@/lib/i18n';
import { num, taka, unitLabel } from '@/lib/format';

/**
 * The product page.
 *
 * Everything on this route is a Server Component except the interactive islands
 * imported above — the gallery, the trade panel, the shipping comparison, the
 * review filters and the two rails that need the buyer's live quantity. The
 * specifications, the description, the seller block and all of the structured
 * data are server-rendered and ship no JavaScript at all.
 *
 * The quote drawer is a lazy chunk. It is a large form that most visitors never
 * open, so paying for it on every page load would be the wrong trade.
 */
const RfqDrawer = dynamic(() =>
  import('@/features/product/components/rfq-drawer').then((mod) => mod.RfqDrawer),
);

const BASE = 'https://arcb2b.com';

/**
 * Called once per locale the layout generates, so it only has to name the
 * segment it owns. In production this would be the top N slugs by views rather
 * than the whole catalogue.
 */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const data = await getProduct(slug);
  if (!data) {
    return { title: t(lang, 'state.notFoundTitle'), robots: { index: false, follow: true } };
  }

  const { product } = data;
  const title = pick(product.title, lang);
  const unit = unitLabel(product.pricing.unit, lang);
  const quoteOnly = product.pricing.priceOnRequest || product.pricing.tiers.length === 0;

  // Built from the real ladder floor and MOQ, so the snippet says something
  // true and specific rather than repeating the title.
  const description = quoteOnly
    ? `${pick(product.shortDescription, lang)} ${t(lang, 'ladder.priceOnRequest')} · ${t(lang, 'moq.label')} ${num(product.pricing.moq)}.`
    : lang === 'bn'
      ? `পাইকারি দর ${taka(lowestUnitPrice(product.pricing.tiers))}/${unit} থেকে · সর্বনিম্ন ${num(product.pricing.moq)} · এসক্রো সুরক্ষিত · সারা দেশে ডেলিভারি।`
      : `Wholesale from ${taka(lowestUnitPrice(product.pricing.tiers))}/${unit} · MOQ ${num(product.pricing.moq)} · escrow protected · nationwide courier delivery.`;

  const path = `/product/${product.slug}`;
  const hero = product.media.find((media) => media.kind !== 'video');

  return {
    title: quoteOnly ? `${title} — wholesale price on request` : `${title} — wholesale price & MOQ`,
    description,
    alternates: {
      canonical: `${BASE}/${lang}${path}`,
      languages: Object.fromEntries(
        LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}${path}`]),
      ),
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${BASE}/${lang}${path}`,
      locale: HREFLANG[lang],
      images: hero ? [{ url: hero.src, width: hero.width, height: hero.height, alt: pick(hero.alt, lang) }] : [],
    },
    // A suspended or delisted line stays readable for anyone holding the link,
    // but should not be competing in search.
    robots: product.status === 'active' ? undefined : { index: false, follow: true },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const data = await getProduct(slug);
  if (!data) notFound();

  const { product, similar, boughtTogether } = data;
  const cards = await getCards(12);

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    ...(product.category.parent
      ? [{ name: pick(product.category.parent.name, lang), href: `/category/${product.category.parent.slug}` }]
      : []),
    { name: pick(product.category.name, lang), href: `/category/${product.category.slug}` },
    { name: pick(product.title, lang) },
  ];

  const sections: SectionLink[] = [
    { id: 'overview', labelKey: 'section.overview' },
    { id: 'specifications', labelKey: 'section.specifications', count: product.specifications.length },
    { id: 'shipping', labelKey: 'section.shipping' },
    { id: 'reviews', labelKey: 'section.reviews', count: product.rating?.total },
    { id: 'seller', labelKey: 'section.seller' },
  ];

  return (
    <TradeProvider product={toTradeProduct(product)}>
      <ProductJsonLd product={product} lang={lang} />
      <BreadcrumbJsonLd items={crumbs} lang={lang} />

      <Container className="pb-4">
        <Breadcrumb
          items={crumbs}
          lang={lang}
          trailing={
            // `useSearchParams` inside a statically prerendered route has to
            // sit behind a Suspense boundary. Without one the bailout
            // propagates and the entire hero subtree falls back to client-only
            // rendering — exactly the LCP regression this page exists to avoid.
            <Suspense fallback={null}>
              <BackToResults lang={lang} />
            </Suspense>
          }
        />

        {/* Hero, restated at each breakpoint rather than left to reflow.

            base  one column, natural order.
            md    media | summary on row 1, panel full width on row 2 — at 768px
                  a genuine two-column hero leaves the mix grid under 300px
                  wide, which is unusable.
            lg    media spans both rows in its own column; summary and panel
                  stack beside it.
            2xl   three columns: media | summary | panel. This is what the extra
                  width on a large monitor is for. Stretching a two-column hero
                  to 2400px would give the trade panel a 1400px-wide mix grid and
                  landed-cost rows with a hand-span between label and figure —
                  wider, and worse. A third column instead keeps every control at
                  its comfortable width and puts the gained space to work. */}
        <div
          id="product-main"
          className="grid gap-x-6 gap-y-5 md:grid-cols-2 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)_minmax(0,620px)] 2xl:gap-x-8"
        >
          <div className="md:col-start-1 md:row-start-1 lg:row-span-2 2xl:row-span-1">
            <ProductGallery media={product.media} lang={lang} title={pick(product.title, lang)} />
          </div>

          <div className="md:col-start-2 md:row-start-1">
            <ProductSummary product={product} lang={lang} />
          </div>

          <div className="md:col-span-2 md:row-start-2 lg:col-span-1 lg:col-start-2 2xl:col-start-3 2xl:row-start-1">
            <TradePanel lang={lang} />
          </div>
        </div>

        {/* Sentinel for the sticky trade bar: server-rendered, so the bar's
            visibility rule needs no scroll-position guesswork. */}
        <div id="trade-anchor" aria-hidden className="h-px" />

        <div className="mt-6">
          <SellerBlock product={product} lang={lang} id="seller" />
        </div>

        <div className="mt-8">
          <SectionNav sections={sections} lang={lang} />

          <div className="space-y-10">
            <ProductOverview product={product} lang={lang} />
            <ProductSpecifications product={product} lang={lang} />
            <ShippingSection lang={lang} />
            <ReviewsSection product={product} lang={lang} />
          </div>
        </div>

        {/* Three rails, in descending order of business value. Each one costs
            LCP budget, INP budget and attention, so there is not a fourth. */}
        <SimilarRail lang={lang} cards={similar} />
        <BoughtTogetherRail lang={lang} cards={boughtTogether} />
        <RecentlyViewed lang={lang} cards={cards} currentSlug={product.slug} />
      </Container>

      <StickyTradeBar lang={lang} />
      <RfqDrawer lang={lang} />

      {/* Reserves the height of the mobile trade bar, which sits above the tab
          bar the layout already accounts for. */}
      <div aria-hidden className="h-14 md:hidden" />
    </TradeProvider>
  );
}
