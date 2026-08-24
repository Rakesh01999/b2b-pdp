import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Badge, Container, SectionHeading } from '@/components/ui/primitives';
import { Hero } from '@/features/home/hero';
import { CategoryTiles } from '@/features/home/category-tiles';
import { RecentListings } from '@/features/home/recent-listings';
import { getCards } from '@/lib/catalog';
import { PRODUCTS } from '@/data/catalog';
import { HREFLANG, LOCALES, isLocale, localeHref, pick, t } from '@/lib/i18n';
import { resolveListingState } from '@/features/product/lib/pricing';
import { totalStock } from '@/features/product/lib/mix';
import type { Bilingual, ListingState } from '@/lib/types';

const BASE = 'https://arcb2b.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  return {
    title: t(lang, 'home.headline'),
    description: t(lang, 'home.sub'),
    alternates: {
      canonical: `${BASE}/${lang}`,
      languages: Object.fromEntries(LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}`])),
    },
  };
}

/**
 * Home.
 *
 * Hero, then the full category taxonomy, then the catalogue — the order a buyer
 * who does not yet know what is stocked needs, and short enough that a buyer who
 * does can use the search field in the hero and never scroll.
 *
 * The last section is the review index for the product page, which is this
 * project's actual deliverable: every listing state it handles, openable
 * directly, with the state computed by the same resolver the trade panel uses so
 * the index cannot drift out of agreement with the page it links to.
 */

const STATE_LABEL: Record<ListingState, Bilingual> = {
  in_stock: { en: 'In stock · ladder priced', bn: 'স্টকে · ল্যাডার মূল্য' },
  sourced_to_order: { en: 'Sourced to order', bn: 'অর্ডারে সোর্সিং' },
  volume_quote: { en: 'Volume quote', bn: 'ভলিউম কোট' },
  quote_only: { en: 'Price on request', bn: 'মূল্য জানতে যোগাযোগ' },
  customisation: { en: 'Customisation quote', bn: 'কাস্টম কোট' },
  unavailable: { en: 'Out of stock', bn: 'স্টকে নেই' },
  below_moq: { en: 'Below MOQ', bn: 'সর্বনিম্নের কম' },
};

const STATE_TONE: Record<ListingState, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  in_stock: 'success',
  sourced_to_order: 'info',
  volume_quote: 'info',
  quote_only: 'warning',
  customisation: 'info',
  unavailable: 'danger',
  below_moq: 'warning',
};

const NOTES: Record<string, Bilingual> = {
  'tws-earbuds-pro-x': {
    en: 'The reference implementation. Six media items including video and a macro inspection shot, a colour × version mix grid with one sourced-only SKU, a four-tier interactive ladder, live landed cost, and six reviews with seller replies.',
    bn: 'রেফারেন্স ইমপ্লিমেন্টেশন। ভিডিও ও ম্যাক্রো শটসহ ছয়টি মিডিয়া, রঙ × ভার্সন মিক্স গ্রিড, চার-স্তরের ইন্টার‍্যাক্টিভ ল্যাডার, লাইভ সর্বমোট খরচ ও ছয়টি রিভিউ।',
  },
  'kurti-cotton-block-print': {
    en: 'Sold by a marketplace supplier rather than by ArcB2B — the same seller block, a different data source. A true size matrix, mostly inbound stock, and one seller metric deliberately unmeasured.',
    bn: 'ArcB2B নয়, মার্কেটপ্লেস সরবরাহকারীর পণ্য — একই সেলার ব্লক, ভিন্ন ডেটা সোর্স। প্রকৃত সাইজ ম্যাট্রিক্স ও একটি মেট্রিক অপরিমাপিত।',
  },
  'led-panel-light-18w': {
    en: 'No published ladder, so the quote drawer becomes the primary action and every price surface suppresses itself rather than printing a zero.',
    bn: 'প্রকাশিত ল্যাডার নেই, তাই কোট ড্রয়ারই প্রধান কাজ এবং কোনও মূল্য শূন্য দেখায় না।',
  },
  'phone-case-tpu-clear': {
    en: 'Single-axis mix, next-day dispatch, and no reviews at all — the honest empty state instead of a fabricated rating.',
    bn: 'এক-অক্ষের মিক্স, পরদিন ডেলিভারি এবং কোনও রিভিউ নেই — বানানো রেটিংয়ের বদলে সৎ খালি অবস্থা।',
  },
  'bt-speaker-mini-x2': {
    en: 'Out of stock with no inbound shipment, sold by a storefront under review — the listing stays readable while both the CTAs and the trust ledger change.',
    bn: 'স্টকে নেই, কোনও শিপমেন্ট আসছে না, বিক্রেতা পর্যালোচনায় — লিস্টিং পড়া যায়, তবে CTA ও ট্রাস্ট লেজার বদলে যায়।',
  },
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  // The whole sample catalogue, not a fixed twelve — this section paginates
  // client-side over whatever it is handed, so it is fed everything there is.
  const cards = await getCards(100);

  return (
    <>
      <Hero lang={lang} />

      <Container className="pb-16">
        <CategoryTiles lang={lang} />

        <section aria-labelledby="catalogue-heading" className="pt-12">
          <SectionHeading
            id="catalogue-heading"
            eyebrow={lang === 'bn' ? 'নমুনা ক্যাটালগ' : 'Sample catalogue'}
            title={lang === 'bn' ? 'সদ্য তালিকাভুক্ত' : 'Recently listed'}
            action={
              <Link
                href={localeHref(lang, '/search')}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-ink transition-all hover:gap-2.5"
              >
                {t(lang, 'rail.viewAll')}
                <ArrowRight size={14} aria-hidden />
              </Link>
            }
          />
          <RecentListings cards={cards} lang={lang} />
        </section>

        <section aria-labelledby="review-heading" className="pt-14">
          <SectionHeading
            id="review-heading"
            eyebrow={t(lang, 'home.reviewSub')}
            title={t(lang, 'home.reviewTitle')}
          />

          <ul className="space-y-3">
            {PRODUCTS.map((product) => {
              const state = resolveListingState(product, {
                qty: 0,
                availableStock: totalStock(product.variants),
              });
              return (
                <li key={product.slug}>
                  <Link
                    href={localeHref(lang, `/product/${product.slug}`)}
                    className="group flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/45 sm:flex-row sm:items-start sm:gap-5"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={STATE_TONE[state]}>{pick(STATE_LABEL[state], lang)}</Badge>
                        <span className="tnum text-[11.5px] text-ink-faint">{product.sku}</span>
                      </div>
                      <h3 className="text-[15.5px] font-bold leading-snug tracking-[-0.012em] transition-colors group-hover:text-accent-ink">
                        {pick(product.title, lang)}
                      </h3>
                      <p className="max-w-[74ch] text-[13px] leading-relaxed text-ink-dim">
                        {pick(NOTES[product.slug] ?? product.shortDescription, lang)}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-accent-soft px-3 py-2 text-[13px] font-semibold text-accent-ink transition-all group-hover:gap-2.5">
                      {t(lang, 'home.openPage')}
                      <ArrowRight size={14} aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </Container>
    </>
  );
}
