import type { MetadataRoute } from 'next';
import { getAllProductSlugs } from '@/lib/catalog';
import { allCategorySlugs } from '@/data/categories';
import { HREFLANG, LOCALES } from '@/lib/i18n';

const BASE = 'https://arcb2b.com';

/**
 * One entry per product, with both locales declared as alternates so the two
 * language versions are understood as the same product rather than as duplicate
 * content competing with each other.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllProductSlugs();
  const now = new Date();

  const languageAlternates = (path: string) =>
    Object.fromEntries(LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}${path}`]));

  const home: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${BASE}/${locale}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1,
    alternates: { languages: languageAlternates('') },
  }));

  const products: MetadataRoute.Sitemap = slugs.flatMap((slug) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/product/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: { languages: languageAlternates(`/product/${slug}`) },
    })),
  );

  // Both taxonomy levels. Omitting these would leave the browse tree — which is
  // how most organic traffic reaches a marketplace — entirely unindexed.
  const categories: MetadataRoute.Sitemap = allCategorySlugs().flatMap((slug) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/category/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: { languages: languageAlternates(`/category/${slug}`) },
    })),
  );

  const directory: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${BASE}/${locale}/categories`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    alternates: { languages: languageAlternates('/categories') },
  }));

  return [...home, ...directory, ...categories, ...products];
}
