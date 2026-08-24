import { ALL_CARDS, BOUGHT_TOGETHER, PRODUCTS } from '@/data/catalog';
import { featuredCategories } from '@/data/categories';
import type { Product, ProductCard } from './types';

/**
 * Server-only data access. Every read the product page needs goes through here,
 * so replacing the sample catalogue with the real API is a change to this file
 * and nothing else.
 *
 * The shape mirrors the proposed contract: one primary read returns the product,
 * its similar items and its breadcrumb ancestry, so the hero needs exactly one
 * round trip. Reviews, recommendations and courier rates are separate reads and
 * are streamed into their own Suspense boundaries.
 */

export interface ProductDetail {
  product: Product;
  similar: ProductCard[];
  boughtTogether: ProductCard[];
}

/**
 * When this points at the live backend the fetches below become
 * `fetch(..., { next: { revalidate: 120, tags: ['product:' + slug] } })`, and
 * on-demand revalidation is triggered from the admin publish flow.
 */
export const REVALIDATE_SECONDS = 120;

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return null;

  return {
    product,
    similar: getSimilar(product),
    boughtTogether: getBoughtTogether(product.slug),
  };
}

/**
 * Same category first, then the same seller, then anything else — and never the
 * product itself. Six cards, because the widest rail shows six.
 */
function getSimilar(product: Product): ProductCard[] {
  const categorySlug = product.category.parent?.slug ?? product.category.slug;

  const scored = ALL_CARDS.filter((card) => card.slug !== product.slug).map((card) => {
    const detail = PRODUCTS.find((p) => p.slug === card.slug);
    let score = 0;
    if (detail) {
      if ((detail.category.parent?.slug ?? detail.category.slug) === categorySlug) score += 3;
      if (detail.seller.id === product.seller.id) score += 1;
    }
    if (card.leadTimeDays === 0) score += 1; // in-stock alternatives are more useful
    return { card, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.card.ordersPlaced - a.card.ordersPlaced)
    .slice(0, 6)
    .map((s) => s.card);
}

function getBoughtTogether(slug: string): ProductCard[] {
  const slugs = BOUGHT_TOGETHER[slug] ?? [];
  return slugs
    .map((s) => ALL_CARDS.find((c) => c.slug === s))
    .filter((c): c is ProductCard => Boolean(c));
}

/** Powers `generateStaticParams` — in production, the top N slugs by views. */
export async function getAllProductSlugs(): Promise<string[]> {
  return [...PRODUCTS].sort((a, b) => b.stats.views - a.stats.views).map((p) => p.slug);
}

/** Cards for the demo index and for the not-found recovery rail. */
export async function getCards(limit = 12): Promise<ProductCard[]> {
  return ALL_CARDS.slice(0, limit);
}

export async function getCardsByCategory(categorySlug: string, limit = 6): Promise<ProductCard[]> {
  const matching = ALL_CARDS.filter((card) => {
    const detail = PRODUCTS.find((p) => p.slug === card.slug);
    if (!detail) return false;
    return detail.category.slug === categorySlug || detail.category.parent?.slug === categorySlug;
  });
  return (matching.length > 0 ? matching : ALL_CARDS).slice(0, limit);
}

/**
 * Category rail in the header — the featured slice of the real taxonomy.
 *
 * Derived rather than duplicated: a hand-maintained copy of this list is how a
 * menu ends up offering a category the directory does not have.
 */
export const NAV_CATEGORIES = featuredCategories().map((category) => ({
  name: category.name,
  slug: category.slug,
}));

/**
 * Products that belong to a category or subcategory.
 *
 * Matches on the product's own category slug and on its parent, so a request for
 * a main category includes everything filed under its children.
 *
 * The sample catalogue only covers a handful of the taxonomy's branches, so
 * callers must handle an empty result. The category page renders an honest empty
 * state rather than silently padding the grid with unrelated products.
 */
export async function getCategoryProducts(slug: string): Promise<ProductCard[]> {
  return ALL_CARDS.filter((card) => {
    const detail = PRODUCTS.find((p) => p.slug === card.slug);
    if (!detail) return false;
    return detail.category.slug === slug || detail.category.parent?.slug === slug;
  });
}

/** Trending search terms. Operator-managed in production. */
export const TRENDING_TERMS = [
  { term: { en: 'TWS earbuds', bn: 'ইয়ারবাড' }, href: '/search?q=earbuds' },
  { term: { en: 'Block-print kurti', bn: 'ব্লক-প্রিন্ট কুর্তি' }, href: '/search?q=kurti' },
  { term: { en: 'Phone case', bn: 'ফোন কেস' }, href: '/search?q=case' },
  { term: { en: 'LED panel', bn: 'এলইডি প্যানেল' }, href: '/search?q=led' },
  { term: { en: 'Power bank', bn: 'পাওয়ার ব্যাংক' }, href: '/search?q=power+bank' },
];
