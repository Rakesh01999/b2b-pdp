import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, FileText, PackageCheck, SlidersHorizontal, X } from 'lucide-react';

import { ButtonLink, Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { ProductCardTile } from '@/features/product/components/product-card';
import { CategoryGlyph } from '@/features/categories/category-icon';
import { findCategory, featuredCategories } from '@/data/categories';
import { isSortKey, searchCatalogue, searchHref, type SortKey } from '@/lib/search';
import { HREFLANG, LOCALES, isLocale, localeHref, pick, t, tn, type StringKey } from '@/lib/i18n';
import { num } from '@/lib/format';
import { cx } from '@/components/ui/cx';
import type { Lang } from '@/lib/types';

/**
 * Search results.
 *
 * Server-rendered, and every control is a link that changes the query string.
 * That is not conservatism: a result set that only exists after a client fetch
 * cannot be linked, cannot be shared with a colleague, cannot be indexed, and
 * cannot be reached with the back button. Filters as links get all four for
 * free, and the page still works with JavaScript unavailable.
 */
const BASE = 'https://arcb2b.com';

/** MOQ ceiling the "low minimum" filter applies. */
const LOW_MOQ = 100;

const SORT_LABEL: Record<SortKey, StringKey> = {
  relevance: 'search.sortRelevance',
  'price-asc': 'search.sortPriceAsc',
  'price-desc': 'search.sortPriceDesc',
  'moq-asc': 'search.sortMoq',
  popular: 'search.sortPopular',
};

interface RawParams {
  q?: string;
  cat?: string;
  sort?: string;
  stock?: string;
  moq?: string;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<RawParams>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { q } = await searchParams;

  const title = q ? `${t(lang, 'search.resultsFor')} “${q}”` : t(lang, 'search.noQueryTitle');

  return {
    title,
    description: t(lang, 'search.noQueryBody'),
    alternates: {
      canonical: `${BASE}/${lang}/search`,
      languages: Object.fromEntries(
        LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}/search`]),
      ),
    },
    // A result page is not a landing page. Letting query permutations into the
    // index is how a catalogue site competes with itself.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<RawParams>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const raw = await searchParams;
  const q = raw.q?.trim() || undefined;
  const cat = raw.cat || undefined;
  const sort: SortKey = isSortKey(raw.sort) ? raw.sort : 'relevance';
  const inStock = raw.stock === '1';
  const maxMoq = raw.moq ? Number(raw.moq) : undefined;

  const query = { q, cat, sort, inStock, maxMoq };
  const result = searchCatalogue(query);

  const activeCategory = cat ? findCategory(cat) : null;
  const activeCategoryName = activeCategory
    ? pick(activeCategory.sub?.name ?? activeCategory.main.name, lang)
    : null;

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'search.title') },
  ];

  const hasFilters = Boolean(cat || inStock || maxMoq !== undefined);
  const href = (patch: Partial<typeof query>) =>
    localeHref(lang, searchHref({ ...query, ...patch }));

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />

      <PageHeader
        eyebrow={q ? t(lang, 'search.resultsFor') : undefined}
        title={q ?? t(lang, 'search.noQueryTitle')}
        intro={q ? undefined : t(lang, 'search.noQueryBody')}
        meta={
          <span className="tnum">
            {num(result.total)} {tn(lang, result.total, 'search.listingFound', 'search.listingsFound')}
            {activeCategoryName && (
              <>
                {' · '}
                {t(lang, 'search.narrowedTo')} {activeCategoryName}
              </>
            )}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8 2xl:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Below `lg` the filter rail becomes a disclosure. `<details>` is the
            right control here — it needs no JavaScript, it is keyboard- and
            screen-reader-native, and it collapses by default so the results stay
            the first thing on a phone. */}
        <details className="group rounded-xl border border-line bg-surface lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-[14px] font-bold">
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={16} aria-hidden className="text-accent-ink" />
              {t(lang, 'search.filters')}
            </span>
            {hasFilters && (
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-bold text-accent-ink">
                {[cat, inStock ? 'stock' : null, maxMoq !== undefined ? 'moq' : null].filter(Boolean).length}
              </span>
            )}
          </summary>
          <div className="border-t border-line p-4">
            <Filters
              lang={lang}
              result={result}
              cat={cat}
              inStock={inStock}
              maxMoq={maxMoq}
              hasFilters={hasFilters}
              href={href}
            />
          </div>
        </details>

        <aside aria-label={t(lang, 'search.filters')} className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+1rem)]">
            <h2 className="mb-3 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-faint">
              <SlidersHorizontal size={14} aria-hidden />
              {t(lang, 'search.filters')}
            </h2>
            <Filters
              lang={lang}
              result={result}
              cat={cat}
              inStock={inStock}
              maxMoq={maxMoq}
              hasFilters={hasFilters}
              href={href}
            />
          </div>
        </aside>

        <div className="min-w-0">
          {/* Sort as links, so the current sort is in the URL and survives a
              share or a reload. */}
          <div className="zone-nav mb-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-line pb-3">
            <span className="mr-1 text-[12px] font-bold uppercase tracking-[0.07em] text-ink-faint">
              {t(lang, 'search.sort')}
            </span>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => {
              const active = key === sort;
              return (
                <Link
                  key={key}
                  href={href({ sort: key })}
                  aria-current={active ? 'true' : undefined}
                  className={cx(
                    'rounded-full px-3 py-1.5 text-[12.5px] transition-colors',
                    active
                      ? 'bg-accent-soft font-semibold text-accent-ink'
                      : 'text-ink-dim hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  {t(lang, SORT_LABEL[key])}
                </Link>
              );
            })}
          </div>

          {result.cards.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
              {result.cards.map((card) => (
                <li key={card.id}>
                  <ProductCardTile
                    card={card}
                    lang={lang}
                    sizes="(max-width: 640px) 45vw, (max-width: 1280px) 30vw, 220px"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyResults lang={lang} result={result} hasFilters={hasFilters} clearHref={href({ cat: undefined, inStock: false, maxMoq: undefined })} />
          )}
        </div>
      </div>
    </Container>
  );
}

/* ----------------------------------------------------------------- filters */

function Filters({
  lang,
  result,
  cat,
  inStock,
  maxMoq,
  hasFilters,
  href,
}: {
  lang: Lang;
  result: ReturnType<typeof searchCatalogue>;
  cat?: string;
  inStock: boolean;
  maxMoq?: number;
  hasFilters: boolean;
  href: (patch: Partial<{ cat?: string; inStock: boolean; maxMoq?: number }>) => string;
}) {
  return (
    <div className="space-y-5">
      {result.facets.length > 0 && (
        <section>
          <h3 className="mb-2 text-[12px] font-bold text-ink">{t(lang, 'search.category')}</h3>
          <ul className="space-y-0.5">
            {result.facets.map((facet) => {
              const active = facet.slug === cat;
              return (
                <li key={facet.slug}>
                  <Link
                    href={href({ cat: active ? undefined : facet.slug })}
                    className={cx(
                      'flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-[13px] transition-colors',
                      active
                        ? 'bg-accent-soft font-semibold text-accent-ink'
                        : 'text-ink-dim hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    <span className="min-w-0 truncate">{pick(facet.name, lang)}</span>
                    <span className="tnum shrink-0 text-[11.5px] text-ink-faint">{facet.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-[12px] font-bold text-ink">{t(lang, 'search.filters')}</h3>
        <ul className="space-y-1.5">
          <li>
            <Toggle
              href={href({ inStock: !inStock })}
              active={inStock}
              label={t(lang, 'search.inStockOnly')}
            />
          </li>
          <li>
            <Toggle
              href={href({ maxMoq: maxMoq === undefined ? LOW_MOQ : undefined })}
              active={maxMoq !== undefined}
              label={t(lang, 'search.lowMoqOnly')}
            />
          </li>
        </ul>
      </section>

      {hasFilters && (
        <Link
          href={href({ cat: undefined, inStock: false, maxMoq: undefined })}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-ink transition-all hover:gap-2.5"
        >
          <X size={13} aria-hidden />
          {t(lang, 'search.clearFilters')}
        </Link>
      )}
    </div>
  );
}

/**
 * A filter toggle that is a link, not a checkbox.
 *
 * `role="switch"` with `aria-checked` on an anchor tells assistive technology
 * what the control does; a bare link would announce as navigation and hide the
 * on/off state that is the whole point of it.
 */
function Toggle({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="switch"
      aria-checked={active}
      className={cx(
        'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors',
        active ? 'font-semibold text-accent-ink' : 'text-ink-dim hover:text-ink',
      )}
    >
      <span
        aria-hidden
        className={cx(
          'grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors',
          active ? 'border-accent bg-accent text-on-fill' : 'border-line-bright bg-surface',
        )}
      >
        {active && <PackageCheck size={11} strokeWidth={3} />}
      </span>
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------- empty */

function EmptyResults({
  lang,
  result,
  hasFilters,
  clearHref,
}: {
  lang: Lang;
  result: ReturnType<typeof searchCatalogue>;
  hasFilters: boolean;
  clearHref: string;
}) {
  const shelves = result.categorySuggestions.length > 0 ? result.categorySuggestions : null;

  return (
    <div className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center sm:p-12">
      <p className="text-[16px] font-bold tracking-[-0.015em]">{t(lang, 'search.emptyTitle')}</p>
      <p className="zone-evidence mx-auto mt-2.5 max-w-[62ch] text-ink-dim">
        {t(lang, 'search.emptyBody')}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink href={localeHref(lang, '/rfq/new')} variant="primary" size="md" className="gap-1.5">
          <FileText size={15} aria-hidden />
          {t(lang, 'rfq.title')}
        </ButtonLink>
        {hasFilters && (
          <ButtonLink href={clearHref} variant="secondary" size="md" className="gap-1.5">
            <X size={15} aria-hidden />
            {t(lang, 'search.clearFilters')}
          </ButtonLink>
        )}
        <ButtonLink href={localeHref(lang, '/categories')} variant="secondary" size="md">
          {t(lang, 'home.browseCategories')}
        </ButtonLink>
      </div>

      {/* The query matched the taxonomy even though it matched no listing. That
          is the most useful thing this page can say, so it says it. */}
      <div className="mt-8 border-t border-line pt-6">
        <h2 className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-faint">
          {shelves ? t(lang, 'search.suggestedShelves') : t(lang, 'category.all')}
        </h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {(shelves ?? featuredCategories().map((c) => ({ slug: c.slug, name: c.name, count: 0 }))).map(
            (shelf) => (
              <li key={shelf.slug}>
                <Link
                  href={localeHref(lang, `/category/${shelf.slug}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-[12.5px] text-ink-dim transition-colors hover:border-accent hover:text-accent-ink"
                >
                  {findCategory(shelf.slug)?.main && (
                    <CategoryGlyph icon={findCategory(shelf.slug)!.main.icon} size={13} />
                  )}
                  {pick(shelf.name, lang)}
                  {shelf.count > 0 && <span className="tnum text-[11px] text-ink-faint">{num(shelf.count)}</span>}
                  <ArrowRight size={12} aria-hidden />
                </Link>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
