'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import { CATEGORIES } from '@/data/categories';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The hero's search field.
 *
 * Structurally identical to the header's — one height on the form,
 * `items-stretch`, and the submit button flush to the rounded edge — because two
 * search fields on one page that align differently is the kind of inconsistency
 * a buyer notices without being able to name.
 *
 * It scopes across the full twenty-category taxonomy rather than the featured
 * six: this is the deliberate, unhurried search, so it gets the whole list.
 */
export function HeroSearch({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set('q', trimmed);
    if (scope) params.set('category', scope);
    const qs = params.toString();
    router.push(localeHref(lang, qs ? `/search?${qs}` : '/search'));
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className="flex h-12 items-stretch overflow-hidden rounded-xl border-2 border-accent bg-surface shadow-sm sm:h-14"
    >
      <div className="relative hidden shrink-0 items-stretch sm:flex">
        <label htmlFor="hero-scope" className="sr-only">
          {t(lang, 'chrome.searchScope')}
        </label>
        <select
          id="hero-scope"
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          className="w-full max-w-[11rem] cursor-pointer appearance-none truncate bg-transparent pl-4 pr-9 text-[13.5px] font-semibold text-ink-dim outline-none focus-visible:bg-accent-soft"
        >
          <option value="">{t(lang, 'category.all')}</option>
          {CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {pick(category.name, lang)}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
      </div>

      <span aria-hidden className="my-2.5 hidden w-px shrink-0 bg-line sm:block" />

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t(lang, 'chrome.searchPlaceholder')}
        aria-label={t(lang, 'chrome.searchLabel')}
        className="min-w-0 flex-1 bg-transparent px-4 text-[15px] text-ink outline-none placeholder:text-ink-faint"
      />

      <button
        type="submit"
        className="flex shrink-0 items-center justify-center gap-2 bg-accent px-5 text-[14.5px] font-bold text-on-fill transition-colors hover:bg-accent-hi sm:px-8"
      >
        <Search size={19} strokeWidth={2.5} aria-hidden />
        <span className="hidden sm:inline">{t(lang, 'chrome.search')}</span>
      </button>
    </form>
  );
}
