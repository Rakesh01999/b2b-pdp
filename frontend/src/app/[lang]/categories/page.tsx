import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { CategoryDirectory } from '@/features/categories/category-directory';
import {
  TOTAL_CATEGORY_COUNT,
  TOTAL_PRODUCT_COUNT,
  TOTAL_SUBCATEGORY_COUNT,
} from '@/data/categories';
import { HREFLANG, LOCALES, isLocale, t } from '@/lib/i18n';
import { num } from '@/lib/format';

const BASE = 'https://arcb2b.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  return {
    title: t(lang, 'category.directoryTitle'),
    description: t(lang, 'category.directorySub'),
    alternates: {
      canonical: `${BASE}/${lang}/categories`,
      languages: Object.fromEntries(
        LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}/categories`]),
      ),
    },
  };
}

/**
 * The category directory.
 *
 * Statically generated per locale — the taxonomy does not change per request, so
 * there is no reason for a buyer to wait on a server to see it.
 */
export default async function CategoriesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'category.directoryTitle') },
  ];

  return (
    <Container className="pb-14">
      <Breadcrumb items={crumbs} lang={lang} />

      <header className="max-w-[62ch] pb-6">
        <h1 className="text-balance text-[26px] font-bold leading-[1.15] tracking-[-0.03em] sm:text-[32px]">
          {t(lang, 'category.directoryTitle')}
        </h1>
        <p className="zone-evidence mt-2.5 text-ink-dim">{t(lang, 'category.directorySub')}</p>
        <p className="tnum mt-3 text-[12.5px] text-ink-faint">
          {num(TOTAL_CATEGORY_COUNT)} {t(lang, 'home.statCategories')} ·{' '}
          {num(TOTAL_SUBCATEGORY_COUNT)} {t(lang, 'home.statSubcategories')} ·{' '}
          {num(TOTAL_PRODUCT_COUNT)} {t(lang, 'category.products')}
        </p>
      </header>

      <CategoryDirectory lang={lang} />
    </Container>
  );
}
