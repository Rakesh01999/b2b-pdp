import { ALL_CARDS } from '@/data/catalog';
import { CATEGORIES, findCategory } from '@/data/categories';
import { lowestUnitPrice } from '@/features/product/lib/pricing';
import type { Bilingual, ProductCard } from './types';

/**
 * Catalogue search, filtering and sorting.
 *
 * Pure functions over the card index, called from Server Components. Search runs
 * on the server for a reason beyond taste: the result page has to be linkable
 * and indexable, and both properties disappear the moment results only exist
 * after a client fetch. Every control on `/search` is therefore a link that
 * changes the query string.
 *
 * When this points at the real backend, `searchCatalogue` becomes one call to
 * `GET /v1/search` and the shape it returns here is the shape to return there —
 * results, total, and facet counts computed over the *unfiltered* match set so
 * the counts stay meaningful while a filter is applied.
 */

export type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'moq-asc' | 'popular';

export const SORT_KEYS: SortKey[] = ['relevance', 'price-asc', 'price-desc', 'moq-asc', 'popular'];

export function isSortKey(value: string | undefined): value is SortKey {
  return value !== undefined && (SORT_KEYS as string[]).includes(value);
}

export interface SearchQuery {
  q?: string;
  /** Main-category or subcategory slug. */
  cat?: string;
  sort?: SortKey;
  /** Exclude made-to-order lines. */
  inStock?: boolean;
  /** Hide anything whose minimum order exceeds this. */
  maxMoq?: number;
}

export interface Facet {
  slug: string;
  name: Bilingual;
  count: number;
}

export interface SearchResult {
  cards: ProductCard[];
  total: number;
  /** Main categories present in the text-matched set, with counts. */
  facets: Facet[];
  /** Taxonomy branches whose name matches the query — a route out of zero results. */
  categorySuggestions: Facet[];
  /** True when the query matched nothing at all. */
  empty: boolean;
}

function norm(value: string): string {
  return value.toLowerCase().trim();
}

function tokens(query: string): string[] {
  return norm(query).split(/[\s,]+/).filter(Boolean);
}

/** Main category a card belongs to, resolved through the taxonomy. */
function mainCategoryOf(card: ProductCard): { slug: string; name: Bilingual } | null {
  for (const category of CATEGORIES) {
    if (category.slug === card.categorySlug) return { slug: category.slug, name: category.name };
    if (category.subcategories.some((sub) => sub.slug === card.categorySlug)) {
      return { slug: category.slug, name: category.name };
    }
  }
  return null;
}

/** Everything a query can match against, flattened once per card. */
function haystack(card: ProductCard): string {
  const category = findCategory(card.categorySlug);
  const parts = [
    card.title.en,
    card.title.bn ?? '',
    card.sellerName,
    card.slug.replace(/-/g, ' '),
    category ? category.main.name.en : '',
    category?.sub ? category.sub.name.en : '',
    category?.sub?.name.bn ?? '',
  ];
  return norm(parts.join(' '));
}

/**
 * Relevance score.
 *
 * A whole-phrase hit in the title outranks the same words scattered across the
 * record, because "power bank" should not rank a bank-transfer note above an
 * actual power bank. Popularity only breaks ties — letting it into the score
 * itself is how a search engine starts burying the exact thing that was typed.
 */
function score(card: ProductCard, query: string): number {
  const words = tokens(query);
  if (words.length === 0) return 0;

  const title = norm(`${card.title.en} ${card.title.bn ?? ''}`);
  const all = haystack(card);
  const phrase = norm(query);

  let total = 0;
  if (title.includes(phrase)) total += 12;
  else if (all.includes(phrase)) total += 6;

  for (const word of words) {
    if (title.includes(word)) total += 4;
    else if (all.includes(word)) total += 2;
  }
  return total;
}

function priceFloor(card: ProductCard): number {
  // Quote-only lines have no ladder. Sorting them to the end of a price sort is
  // the honest placement — they are not cheap, they are unpriced.
  return card.tiers.length === 0 ? Number.MAX_SAFE_INTEGER : lowestUnitPrice(card.tiers);
}

function sortCards(cards: Array<{ card: ProductCard; score: number }>, sort: SortKey) {
  const byPopularity = (a: ProductCard, b: ProductCard) => b.ordersPlaced - a.ordersPlaced;

  switch (sort) {
    case 'price-asc':
      return cards.sort(
        (a, b) => priceFloor(a.card) - priceFloor(b.card) || byPopularity(a.card, b.card),
      );
    case 'price-desc':
      return cards.sort((a, b) => {
        const av = priceFloor(a.card);
        const bv = priceFloor(b.card);
        // Unpriced lines stay last in both directions rather than jumping to the
        // top of a high-to-low sort on a sentinel value.
        if (av === Number.MAX_SAFE_INTEGER || bv === Number.MAX_SAFE_INTEGER) return av - bv;
        return bv - av || byPopularity(a.card, b.card);
      });
    case 'moq-asc':
      return cards.sort((a, b) => a.card.moq - b.card.moq || byPopularity(a.card, b.card));
    case 'popular':
      return cards.sort((a, b) => byPopularity(a.card, b.card));
    default:
      return cards.sort((a, b) => b.score - a.score || byPopularity(a.card, b.card));
  }
}

export function searchCatalogue(query: SearchQuery): SearchResult {
  const { q, cat, sort = 'relevance', inStock, maxMoq } = query;
  const hasText = Boolean(q && q.trim());

  // Text match first. Facet counts are computed from this set — before the
  // category filter is applied — so the counts still show what else the query
  // would have found.
  const textMatched = ALL_CARDS.map((card) => ({
    card,
    score: hasText ? score(card, q!) : 0,
  })).filter((entry) => !hasText || entry.score > 0);

  const facetCounts = new Map<string, Facet>();
  for (const { card } of textMatched) {
    const main = mainCategoryOf(card);
    if (!main) continue;
    const existing = facetCounts.get(main.slug);
    if (existing) existing.count += 1;
    else facetCounts.set(main.slug, { slug: main.slug, name: main.name, count: 1 });
  }

  let filtered = textMatched;

  if (cat) {
    filtered = filtered.filter(({ card }) => {
      if (card.categorySlug === cat) return true;
      return mainCategoryOf(card)?.slug === cat;
    });
  }
  if (inStock) filtered = filtered.filter(({ card }) => !card.madeToOrder);
  if (maxMoq !== undefined) filtered = filtered.filter(({ card }) => card.moq <= maxMoq);

  const sorted = sortCards(filtered, sort);

  return {
    cards: sorted.map((entry) => entry.card),
    total: sorted.length,
    facets: [...facetCounts.values()].sort((a, b) => b.count - a.count),
    categorySuggestions: hasText ? suggestCategories(q!) : [],
    empty: sorted.length === 0,
  };
}

/**
 * Taxonomy branches whose name matches the query.
 *
 * The sample catalogue covers a handful of branches, so a plausible search
 * ("cookware", "helmets") legitimately returns nothing. Offering the matching
 * shelf turns a dead end into a route, and it is the same affordance the real
 * catalogue wants for a long-tail query.
 */
export function suggestCategories(query: string, limit = 8): Facet[] {
  const words = tokens(query);
  if (words.length === 0) return [];

  const hits: Facet[] = [];
  const matches = (value: Bilingual) => {
    const text = norm(`${value.en} ${value.bn ?? ''}`);
    return words.some((word) => word.length > 2 && text.includes(word));
  };

  for (const category of CATEGORIES) {
    if (matches(category.name)) {
      hits.push({ slug: category.slug, name: category.name, count: 0 });
    }
    for (const sub of category.subcategories) {
      if (matches(sub.name)) {
        hits.push({ slug: sub.slug, name: sub.name, count: sub.productCount });
      }
    }
  }
  return hits.slice(0, limit);
}

/** Serialises a query back into a search URL, dropping defaults. */
export function searchHref(query: SearchQuery): string {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.cat) params.set('cat', query.cat);
  if (query.sort && query.sort !== 'relevance') params.set('sort', query.sort);
  if (query.inStock) params.set('stock', '1');
  if (query.maxMoq !== undefined) params.set('moq', String(query.maxMoq));
  const qs = params.toString();
  return qs ? `/search?${qs}` : '/search';
}
