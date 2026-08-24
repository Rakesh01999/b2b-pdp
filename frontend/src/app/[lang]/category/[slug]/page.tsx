import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, FileText, LayoutGrid } from 'lucide-react';
import { ButtonLink, Container, SectionHeading } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { BreadcrumbJsonLd } from '@/components/seo/structured-data';
import { CategoryGlyph } from '@/features/categories/category-icon';
import { ProductCardTile } from '@/features/product/components/product-card';
import {
  allCategorySlugs,
  categoryProductCount,
  featuredCategories,
  findCategory,
} from '@/data/categories';
import { getCategoryProducts } from '@/lib/catalog';
import { HREFLANG, LOCALES, isLocale, localeHref, pick, t } from '@/lib/i18n';
import { num } from '@/lib/format';

const BASE = 'https://arcb2b.com';

/**
 * One route serves both taxonomy levels.
 *
 * A main category and a subcategory differ only in what sits beside them — the
 * parent shows its children as refinements, the child shows its siblings — so
 * splitting them into two routes would duplicate the page for no gain and give
 * the two levels different URLs shapes for no reason.
 */
export async function generateStaticParams() {
  return allCategorySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const match = findCategory(slug);
  if (!match) return { title: t(lang, 'state.notFoundTitle'), robots: { index: false, follow: true } };

  const name = pick(match.sub?.name ?? match.main.name, lang);
  const count = match.sub ? match.sub.productCount : categoryProductCount(match.main);

  return {
    title: `${name} — wholesale suppliers & prices`,
    description:
      lang === 'bn'
        ? `${name} — ${num(count)} পণ্য, পাইকারি দর, এসক্রো সুরক্ষিত পেমেন্ট ও সারা দেশে ডেলিভারি।`
        : `${name} — ${num(count)} wholesale listings with laddered pricing, escrow-protected payment and nationwide courier delivery.`,
    alternates: {
      canonical: `${BASE}/${lang}/category/${slug}`,
      languages: Object.fromEntries(
        LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}/category/${slug}`]),
      ),
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const match = findCategory(slug);
  if (!match) notFound();

  const { main, sub } = match;
  const isSub = Boolean(sub);
  const name = pick(sub?.name ?? main.name, lang);
  const count = sub ? sub.productCount : categoryProductCount(main);
  const products = await getCategoryProducts(slug);

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'category.directoryTitle'), href: '/categories' },
    ...(isSub ? [{ name: pick(main.name, lang), href: `/category/${main.slug}` }] : []),
    { name },
  ];

  return (
    <Container className="pb-14">
      <BreadcrumbJsonLd items={crumbs} lang={lang} />
      <Breadcrumb items={crumbs} lang={lang} />

      <header className="flex flex-wrap items-start gap-4 pb-6">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
          <CategoryGlyph icon={main.icon} size={23} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-balance text-[24px] font-bold leading-[1.16] tracking-[-0.028em] sm:text-[30px]">
            {name}
          </h1>
          <p className="zone-evidence mt-2 max-w-[64ch] text-ink-dim">{pick(main.blurb, lang)}</p>
          <p className="tnum mt-2.5 text-[12.5px] text-ink-faint">
            {num(count)} {t(lang, 'category.products')}
            {!isSub && (
              <>
                {' · '}
                {main.subcategories.length} {t(lang, 'category.subcategories')}
              </>
            )}
          </p>
        </div>
      </header>

      {/* A parent lists its children as refinements; a child lists its siblings,
          because the buyer who landed on the wrong shelf is one tap from the
          right one either way. */}
      <section aria-labelledby="refine-heading" className="border-y border-line py-4">
        <h2
          id="refine-heading"
          className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint"
        >
          {t(lang, 'category.refine')}
        </h2>
        <ul className="flex flex-wrap gap-2">
          {main.subcategories.map((subcategory) => {
            const active = subcategory.slug === sub?.slug;
            return (
              <li key={subcategory.slug}>
                <Link
                  href={localeHref(lang, `/category/${subcategory.slug}`)}
                  aria-current={active ? 'page' : undefined}
                  className={
                    active
                      ? 'inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-[12.5px] font-semibold text-accent-ink'
                      : 'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink-dim transition-colors hover:border-accent hover:text-accent-ink'
                  }
                >
                  {pick(subcategory.name, lang)}
                  <span className="tnum text-[11px] text-ink-faint">
                    {num(subcategory.productCount)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="listings-heading" className="pt-8">
        <SectionHeading
          id="listings-heading"
          title={t(lang, 'category.inThisCategory')}
          action={
            /* The header count is the taxonomy figure; the grid holds whatever
               sample data exists. Saying so is better than letting a buyer
               conclude 1,842 listings rendered as one. */
            products.length > 0 && products.length < count ? (
              <span className="tnum text-[12px] text-ink-faint">
                {t(lang, 'category.showing')} {num(products.length)} {t(lang, 'misc.of')}{' '}
                {num(count)} — {t(lang, 'category.sampleNote')}
              </span>
            ) : undefined
          }
        />

        {products.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {products.map((card) => (
              <li key={card.id}>
                <ProductCardTile card={card} lang={lang} />
              </li>
            ))}
          </ul>
        ) : (
          /* Honest about the sample data rather than padding the grid with
             unrelated products, which would make the category meaningless. */
          <div className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center sm:p-10">
            <p className="text-[15px] font-semibold">{t(lang, 'category.emptyTitle')}</p>
            <p className="zone-evidence mx-auto mt-2 max-w-[58ch] text-ink-dim">
              {t(lang, 'category.emptyBody')}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <ButtonLink href={localeHref(lang, '/rfq/new')} variant="primary" size="md" className="gap-1.5">
                <FileText size={15} aria-hidden />
                {t(lang, 'chrome.requestQuote')}
              </ButtonLink>
              <ButtonLink href={localeHref(lang, '/categories')} variant="secondary" size="md" className="gap-1.5">
                <LayoutGrid size={15} aria-hidden />
                {t(lang, 'home.browseCategories')}
              </ButtonLink>
            </div>

            <ul className="mt-7 flex flex-wrap justify-center gap-2 border-t border-line pt-5">
              {featuredCategories().map((category) => (
                <li key={category.slug}>
                  <Link
                    href={localeHref(lang, `/category/${category.slug}`)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[12.5px] text-ink-dim transition-colors hover:border-accent hover:text-accent-ink"
                  >
                    <CategoryGlyph icon={category.icon} size={13} />
                    {pick(category.name, lang)}
                    <ArrowRight size={12} aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </Container>
  );
}
