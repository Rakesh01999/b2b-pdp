'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, MessageSquare, Search, ShoppingCart, User } from 'lucide-react';
import { Logo } from './logo';
import { cx } from '@/components/ui/cx';
import { localeHref, pick, t } from '@/lib/i18n';
import { useCart } from '@/features/app/providers';
import type { Bilingual, Lang } from '@/lib/types';

/**
 * The one pinned row: identity, search, account actions.
 *
 * Only this row sticks. A sticky element can only travel inside its own
 * container, and pinning all three chrome rows would cost about 130px of a
 * 640px phone viewport — so the utility bar and the category rail scroll away,
 * and search stays reachable because on a catalogue this size search *is* the
 * primary navigation instrument.
 */

const CONDENSE_ON = 90;
const CONDENSE_OFF = 40;

/**
 * Hysteresis, not a single threshold: with one boundary, a viewport sitting
 * exactly at the trigger flips the header on every scroll event, and the
 * resulting judder is worse than not condensing at all.
 */
function useCondensed() {
  const [condensed, setCondensed] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const read = () => {
      frame.current = 0;
      setCondensed((prev) => {
        const y = window.scrollY;
        if (prev) return y > CONDENSE_OFF;
        return y > CONDENSE_ON;
      });
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return condensed;
}

export function PrimaryBar({
  lang,
  categories,
  trending,
}: {
  lang: Lang;
  categories: Array<{ name: Bilingual; slug: string }>;
  trending: Array<{ term: Bilingual; href: string }>;
}) {
  const router = useRouter();
  const condensed = useCondensed();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('');
  const { unitCount, hydrated } = useCart();

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
    <header
      className={cx(
        'sticky top-0 z-50 border-b border-line transition-shadow duration-200 motion-reduce:transition-none',
        condensed ? 'glass shadow-sm' : 'bg-surface',
      )}
    >
      {/* Explicit grid placement rather than flex wrap.
          Wrapping put the account icons on their own row at tablet widths with a
          band of dead space beside them, and the cause was invisible from the
          markup — a flex line breaking on min-content that nothing declared.
          Two columns below `md` (logo | actions, search spanning beneath), three
          from `md` up (logo | search | actions), each child placed by name. The
          layout is now stated rather than inferred.

          Vertical padding is not transitioned: animating it would reflow the
          whole page below the header for 200ms on every toggle. Only paint-level
          properties move. */}
      <div
        className={cx(
          'shell grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3',
          'md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-5',
          condensed ? 'gap-y-1.5 py-2' : 'gap-y-2 py-2.5 md:py-3',
        )}
      >
        <div className="col-start-1 row-start-1">
          <Logo lang={lang} compact={condensed} />
        </div>

        {/* Below `md` the search takes its own full-width row — the only way it
            stays usable at 360px. */}
        <div className="col-span-2 col-start-1 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
          {/* Alignment here is structural, not hand-tuned. The form sets one
              height and `items-stretch`; the scope select, the divider, the
              input and the submit button all fill it, so there is no per-child
              padding to keep in sync and nothing can drift half a pixel out of
              line. `overflow-hidden` on a rounded container lets the button sit
              flush against the right edge — the previous pill-inside-a-pill left
              a 4px sliver of border showing and an uneven inner radius. */}
          <form
            onSubmit={onSubmit}
            role="search"
            className={cx(
              'flex items-stretch overflow-hidden rounded-xl border-2 border-accent bg-surface transition-[height] duration-200 motion-reduce:transition-none',
              condensed ? 'h-11' : 'h-11 md:h-12',
            )}
          >
            {/* Shown at `sm`, where the field has its own full-width row.
                Hidden at `md`, where it shares the row with the logo and the
                account icons and 152px of scope selector left the input showing
                four characters. Shown again from `lg`, where the row is wide
                enough. Scoping stays one tap away in the category rail. */}
            <div className="relative hidden shrink-0 items-stretch sm:flex md:hidden lg:flex">
              <label htmlFor="search-scope" className="sr-only">
                {t(lang, 'chrome.searchScope')}
              </label>
              <select
                id="search-scope"
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                className="w-full max-w-[9.5rem] cursor-pointer appearance-none truncate bg-transparent pl-4 pr-8 text-[13px] font-semibold text-ink-dim outline-none focus-visible:bg-accent-soft"
              >
                <option value="">{t(lang, 'chrome.searchAll')}</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {pick(category.name, lang)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
            </div>

            {/* Inset by 8px top and bottom so the rule reads as a divider rather
                than as a second border meeting the frame. */}
            <span aria-hidden className="my-2 hidden w-px shrink-0 bg-line sm:block md:hidden lg:block" />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(lang, 'chrome.searchPlaceholder')}
              aria-label={t(lang, 'chrome.searchLabel')}
              className="min-w-0 flex-1 bg-transparent px-4 text-[14.5px] text-ink outline-none placeholder:text-ink-faint"
            />

            <button
              type="submit"
              className="flex shrink-0 items-center justify-center gap-2 bg-accent px-4 text-[14px] font-bold text-on-fill transition-colors hover:bg-accent-hi sm:px-6"
            >
              <Search size={18} strokeWidth={2.5} aria-hidden />
              <span className="hidden sm:inline">{t(lang, 'chrome.search')}</span>
            </button>
          </form>

          {/* Trending folds away once scrolled — it pays for the pinned rows. */}
          {trending.length > 0 && (
            <div
              className={cx(
                'hidden overflow-hidden lg:block',
                condensed ? 'max-h-0 opacity-0' : 'mt-1.5 max-h-6 opacity-100',
              )}
              aria-hidden={condensed}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pl-1 text-[11.5px] text-ink-faint">
                <span className="font-semibold text-ink-dim">{t(lang, 'chrome.trending')}:</span>
                {trending.map((item) => (
                  <Link
                    key={item.term.en}
                    href={localeHref(lang, item.href)}
                    className="transition-colors hover:text-accent-ink"
                  >
                    {pick(item.term, lang)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-self-end gap-0.5 md:col-start-3">
          <HeaderAction
            href={localeHref(lang, '/messages')}
            label={t(lang, 'chrome.messages')}
            icon={<MessageSquare size={19} aria-hidden />}
            badge={2}
            hideOnMobile
          />
          <HeaderAction
            href={localeHref(lang, '/notifications')}
            label={t(lang, 'chrome.notifications')}
            icon={<Bell size={19} aria-hidden />}
            hideOnMobile
          />
          <HeaderAction
            href={localeHref(lang, '/cart')}
            label={t(lang, 'chrome.cart')}
            icon={<ShoppingCart size={19} aria-hidden />}
            // Suppressed until hydration: rendering a stored count during SSR
            // would make the server and client markup disagree.
            badge={hydrated && unitCount > 0 ? unitCount : undefined}
          />
          <HeaderAction
            href={localeHref(lang, '/account')}
            label={t(lang, 'chrome.account')}
            icon={<User size={19} aria-hidden />}
          />
          <Link
            href={localeHref(lang, '/register')}
            className="ml-2 hidden rounded-full bg-accent-soft px-4 py-2 text-[13px] font-semibold text-accent-ink transition-colors hover:bg-accent hover:text-on-fill lg:inline-block"
          >
            {t(lang, 'chrome.joinFree')}
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeaderAction({
  href,
  label,
  icon,
  badge,
  hideOnMobile,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  hideOnMobile?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={cx(
        // 44px minimum touch target, which the icon alone does not reach.
        'relative grid h-11 w-11 place-items-center rounded-lg text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink',
        hideOnMobile && 'hidden sm:grid',
      )}
    >
      {icon}
      {badge != null && badge > 0 && (
        <span className="tnum absolute right-1 top-1.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-deal px-1 text-[10px] font-bold leading-none text-on-fill">
          {badge > 999 ? '999+' : badge}
        </span>
      )}
    </Link>
  );
}
