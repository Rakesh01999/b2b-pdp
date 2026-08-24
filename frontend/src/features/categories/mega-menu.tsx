'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, LayoutGrid, X } from 'lucide-react';
import { CATEGORIES, type MainCategory, categoryProductCount } from '@/data/categories';
import { CategoryGlyph } from './category-icon';
import { cx } from '@/components/ui/cx';
import { num } from '@/lib/format';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The All Categories panel.
 *
 * Two columns, because a flat list of twenty categories each with six children
 * is 140 links and unusable as a single menu: the left rail selects a main
 * category, the right pane shows its subcategories. Hovering *or* focusing the
 * rail changes the pane, so it works with a mouse and with a keyboard, and every
 * entry is a real link rather than a div waiting for a click handler — the
 * category rail must survive JavaScript failing to load.
 *
 * Below `lg` this becomes a full-height sheet with the same two panes stacked,
 * because a hover-driven flyout has no meaning on a touch screen.
 */
export function MegaMenu({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(CATEGORIES[0].slug);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const active: MainCategory =
    CATEGORIES.find((category) => category.slug === activeSlug) ?? CATEGORIES[0];

  // Close on outside click and on Escape. Without the outside-click handler the
  // panel stays open behind whatever the buyer clicked next, which on a
  // full-width flyout means the page appears frozen.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex shrink-0 items-stretch">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          'inline-flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 font-bold transition-colors',
          open ? 'bg-accent-soft text-accent-ink' : 'text-ink hover:text-accent-ink',
        )}
      >
        {open ? <X size={16} aria-hidden /> : <LayoutGrid size={16} aria-hidden />}
        <span className="hidden sm:inline">{t(lang, 'chrome.allCategories')}</span>
      </button>

      {open && (
        <>
          {/* Scrim below lg, where the panel is a sheet rather than a flyout. */}
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="anim-fade fixed inset-0 top-[var(--header-h)] z-40 bg-black/40 lg:hidden"
          />

          <div
            id={panelId}
            className={cx(
              'anim-fade z-50 overflow-hidden border-line bg-surface shadow-lg',
              // Below lg: a full-width sheet anchored under the chrome.
              'fixed inset-x-0 top-[calc(var(--header-h)+44px)] bottom-0 border-t',
              // From lg: a flyout under the trigger, sized to the content column.
              'lg:absolute lg:inset-x-auto lg:bottom-auto lg:left-0 lg:top-[calc(100%+8px)] lg:w-[min(60rem,calc(100vw-3rem))] lg:rounded-xl lg:border',
            )}
          >
            <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:grid-rows-1">
              {/* Left rail — main categories */}
              <ul
                className="slim-scroll max-h-[38vh] overflow-y-auto border-b border-line bg-surface-2/60 p-2 lg:max-h-[28rem] lg:border-b-0 lg:border-r"
                role="list"
              >
                {CATEGORIES.map((category) => {
                  const isActive = category.slug === active.slug;
                  return (
                    <li key={category.slug}>
                      <Link
                        href={localeHref(lang, `/category/${category.slug}`)}
                        onMouseEnter={() => setActiveSlug(category.slug)}
                        onFocus={() => setActiveSlug(category.slug)}
                        onClick={() => setOpen(false)}
                        aria-current={isActive ? 'true' : undefined}
                        className={cx(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-colors',
                          isActive
                            ? 'bg-surface text-accent-ink shadow-xs'
                            : 'text-ink-dim hover:bg-surface hover:text-ink',
                        )}
                      >
                        <CategoryGlyph icon={category.icon} size={16} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{pick(category.name, lang)}</span>
                        <ChevronRight
                          size={14}
                          aria-hidden
                          className={cx('shrink-0', isActive ? 'text-accent' : 'text-ink-faint/60')}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Right pane — the selected category's children */}
              <div className="slim-scroll min-h-0 overflow-y-auto p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <h2 className="text-[15px] font-bold tracking-[-0.015em]">
                    {pick(active.name, lang)}
                  </h2>
                  <span className="tnum text-[12px] text-ink-faint">
                    {num(categoryProductCount(active))} {t(lang, 'category.products')}
                  </span>
                </div>

                <p className="mb-4 max-w-[62ch] text-[12.5px] leading-relaxed text-ink-dim">
                  {pick(active.blurb, lang)}
                </p>

                <ul className="grid gap-x-5 gap-y-0.5 sm:grid-cols-2">
                  {active.subcategories.map((subcategory) => (
                    <li key={subcategory.slug}>
                      <Link
                        href={localeHref(lang, `/category/${subcategory.slug}`)}
                        onClick={() => setOpen(false)}
                        className="group flex items-baseline justify-between gap-3 rounded-md px-1.5 py-1.5 text-[13px] transition-colors hover:bg-surface-2"
                      >
                        <span className="min-w-0 text-ink-dim transition-colors group-hover:text-accent-ink">
                          {pick(subcategory.name, lang)}
                        </span>
                        <span className="tnum shrink-0 text-[11.5px] text-ink-faint">
                          {num(subcategory.productCount)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <Link
                  href={localeHref(lang, `/category/${active.slug}`)}
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-ink transition-all hover:gap-2.5"
                >
                  {t(lang, 'category.browseAll')} {pick(active.name, lang)}
                  <ArrowRight size={13} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
