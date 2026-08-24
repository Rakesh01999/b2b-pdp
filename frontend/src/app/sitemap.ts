import type { MetadataRoute } from 'next';
import { allSellerSlugs, getAllProductSlugs } from '@/lib/catalog';
import { allCategorySlugs } from '@/data/categories';
import { CONTENT_PAGES } from '@/data/pages';
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

  // Supplier storefronts. A storefront is a landing page a supplier will hand
  // out, so it has to be indexable in its own right.
  const stores: MetadataRoute.Sitemap = allSellerSlugs().flatMap((slug) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}/store/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
      alternates: { languages: languageAlternates(`/store/${slug}`) },
    })),
  );

  const deals: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${BASE}/${locale}/deals`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.6,
    alternates: { languages: languageAlternates('/deals') },
  }));

  const rfq: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${BASE}/${locale}/rfq/new`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
    alternates: { languages: languageAlternates('/rfq/new') },
  }));

  // The informational pages. `/search`, `/cart`, `/account*`, `/messages`,
  // `/notifications` and the auth pages are deliberately absent: they are
  // per-buyer state or query permutations, and both are `noindex` at the page
  // level. Listing them here would contradict that.
  const content: MetadataRoute.Sitemap = CONTENT_PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${BASE}/${locale}${page.path}`,
      lastModified: page.updated ? new Date(page.updated) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
      alternates: { languages: languageAlternates(page.path) },
    })),
  );

  return [
    ...home,
    ...directory,
    ...categories,
    ...products,
    ...stores,
    ...deals,
    ...rfq,
    ...content,
  ];
}
