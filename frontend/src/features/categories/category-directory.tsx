'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, X } from 'lucide-react';
import { CATEGORIES, categoryProductCount } from '@/data/categories';
import { CategoryGlyph } from './category-icon';
import { Button } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import { num } from '@/lib/format';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The full category directory, with a live filter.
 *
 * Twenty categories and 118 subcategories is too much to scan, so the filter is
 * the feature rather than a decoration: it matches on both levels, keeps a main
 * category visible when only its children match, and shows the matching children
 * highlighted so the buyer can see *why* a category survived the filter.
 *
 * Filtering is client-side over data that is already on the page. Round-tripping
 * to a server to narrow a list this size would be slower and would break while
 * offline, and the whole taxonomy is a few kilobytes.
 */
export function CategoryDirectory({ lang }: { lang: Lang }) {
  const [query, setQuery] = useState('');
  const normalised = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalised) {
      return CATEGORIES.map((category) => ({ category, matchedSubs: [] as string[] }));
    }

    const matches = (value: string) => value.toLowerCase().includes(normalised);

    return CATEGORIES.map((category) => {
      const mainHit = matches(category.name.en) || matches(category.name.bn ?? '');
      const matchedSubs = category.subcategories
        .filter((sub) => matches(sub.name.en) || matches(sub.name.bn ?? ''))
        .map((sub) => sub.slug);
      // A parent stays visible when only its children match — otherwise
      // searching "cable" hides the category the buyer needs to click through.
      return mainHit || matchedSubs.length > 0 ? { category, matchedSubs } : null;
    }).filter((entry): entry is { category: (typeof CATEGORIES)[number]; matchedSubs: string[] } =>
      entry !== null,
    );
  }, [normalised]);

  return (
    <div>
      <div className="relative max-w-[30rem]">
        <label htmlFor="category-filter" className="sr-only">
          {t(lang, 'category.filterLabel')}
        </label>
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          id="category-filter"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(lang, 'category.filterPlaceholder')}
          className="h-11 w-full rounded-xl border border-line-bright bg-surface pl-10 pr-10 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-accent"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t(lang, 'category.clearFilter')}
            className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X size={15} aria-hidden />
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line-bright bg-surface p-10 text-center">
          <p className="text-[14px] font-semibold">{t(lang, 'category.noMatches')}</p>
          <Button variant="secondary" size="md" className="mt-3" onClick={() => setQuery('')}>
            {t(lang, 'category.clearFilter')}
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {results.map(({ category, matchedSubs }) => (
            <li key={category.slug}>
              <section
                aria-labelledby={`cat-${category.slug}`}
                className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-ink">
                    <CategoryGlyph icon={category.icon} size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 id={`cat-${category.slug}`} className="text-[15px] font-bold leading-snug tracking-[-0.015em]">
                      <Link
                        href={localeHref(lang, `/category/${category.slug}`)}
                        className="transition-colors hover:text-accent-ink"
                      >
                        {pick(category.name, lang)}
                      </Link>
                    </h2>
                    <p className="tnum mt-0.5 text-[11.5px] text-ink-faint">
                      {num(categoryProductCount(category))} {t(lang, 'category.products')} ·{' '}
                      {category.subcategories.length} {t(lang, 'category.subcategories')}
                    </p>
                  </div>
                </div>

                <ul className="zone-reference mt-3 flex-1 border-t border-line pt-3">
                  {category.subcategories.map((subcategory) => {
                    const highlighted = matchedSubs.includes(subcategory.slug);
                    return (
                      <li key={subcategory.slug}>
                        <Link
                          href={localeHref(lang, `/category/${subcategory.slug}`)}
                          className={cx(
                            'flex items-baseline justify-between gap-3 rounded-md px-1.5 py-1.5 transition-colors hover:bg-surface-2',
                            highlighted && 'bg-accent-soft',
                          )}
                        >
                          <span
                            className={cx(
                              'min-w-0',
                              highlighted ? 'font-semibold text-accent-ink' : 'text-ink-dim',
                            )}
                          >
                            {pick(subcategory.name, lang)}
                          </span>
                          <span className="tnum shrink-0 text-[11.5px] text-ink-faint">
                            {num(subcategory.productCount)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <Link
                  href={localeHref(lang, `/category/${category.slug}`)}
                  className="mt-3 inline-flex items-center gap-1.5 border-t border-line pt-3 text-[12.5px] font-semibold text-accent-ink transition-all hover:gap-2.5"
                >
                  {t(lang, 'category.browseAll')} {pick(category.name, lang)}
                  <ArrowRight size={13} aria-hidden />
                </Link>
              </section>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
