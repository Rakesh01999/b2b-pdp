'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, MapPin } from 'lucide-react';
import { DISTRICTS, districtById } from '@/lib/constants';
import { LOCALES, LOCALE_LABEL, pick, t, type Locale } from '@/lib/i18n';
import { usePrefs } from '@/features/app/providers';
import { cx } from '@/components/ui/cx';
import type { Lang } from '@/lib/types';

/**
 * The small interactive controls in the chrome.
 *
 * These import the string table directly rather than receiving text as props.
 * The table is a few kilobytes gzipped and cached once by the browser, whereas
 * threading forty strings through props re-sends them inside the RSC payload on
 * every single request — so bundling wins for anything a client island needs
 * repeatedly.
 */

/* ------------------------------------------------------------ theme toggle */

const THEME_KEY = 'arcb2b.theme';

/**
 * Reads the theme straight off the attribute the inline head script stamped, via
 * an external store rather than an effect. The DOM is the source of truth here —
 * mirroring it into React state on mount would mean an extra render and a window
 * where the button's pressed state disagreed with the page it controls.
 */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

export function ThemeToggle({ lang, className }: { lang: Lang; className?: string }) {
  const dark = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.dataset.theme === 'dark',
    () => false,
  );

  const toggle = () => {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try {
      window.localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {
      // Storage blocked — the toggle still works for this session.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t(lang, 'chrome.theme')}
      aria-pressed={dark}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-surface-2 hover:text-ink',
        className,
      )}
    >
      {dark ? <Moon size={15} aria-hidden /> : <Sun size={15} aria-hidden />}
    </button>
  );
}

/**
 * Sets the theme attribute before the first paint so a dark-mode user never sees
 * a flash of the light palette. It has to be inline and synchronous — anything
 * deferred paints first and then corrects itself, which is the flash.
 */
export function ThemeScript() {
  const script = `(function(){try{var s=localStorage.getItem('${THEME_KEY}');var m=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=s||(m?'dark':'light')}catch(e){document.documentElement.dataset.theme='light'}})()`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

/* --------------------------------------------------------- language switch */

/**
 * Language is a route segment, so switching it is a navigation to the same path
 * under the other locale. That is what keeps both versions server-rendered,
 * separately indexable and free of client-side translation code.
 */
export function LanguageSwitch({ lang }: { lang: Locale }) {
  const pathname = usePathname() || `/${lang}`;

  return (
    <span className="inline-flex items-center rounded-md border border-line-bright p-[2px]">
      {LOCALES.map((locale) => {
        const rest = pathname.replace(/^\/(en|bn)(?=\/|$)/, '') || '';
        const href = `/${locale}${rest}`;
        const active = locale === lang;
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale}
            aria-current={active ? 'true' : undefined}
            className={cx(
              'rounded px-2 py-[3px] text-[11.5px] font-semibold transition-colors',
              active ? 'bg-accent text-on-fill' : 'text-ink-dim hover:text-ink',
            )}
          >
            {LOCALE_LABEL[locale]}
          </Link>
        );
      })}
    </span>
  );
}

/* --------------------------------------------------------- district select */

/**
 * The delivery district. It lives in the chrome because it is a global
 * preference that drives the courier estimate and the landed-cost figure on
 * every product page — asking for it once, here, is what makes those numbers
 * possible without interrupting the buyer later.
 *
 * A native `<select>` on purpose: the OS picker is better than anything we would
 * build for fifteen options on a phone, and it is keyboard- and
 * screen-reader-correct for free.
 */
export function DistrictSelect({
  lang,
  variant = 'chip',
  id,
  className,
}: {
  lang: Lang;
  variant?: 'chip' | 'field';
  id?: string;
  className?: string;
}) {
  const { districtId, setDistrict } = usePrefs();
  const current = districtById(districtId);

  const select = (
    <select
      id={id}
      value={districtId}
      onChange={(event) => setDistrict(event.target.value)}
      aria-label={t(lang, 'shipping.deliverTo')}
      className={cx(
        'cursor-pointer appearance-none bg-transparent font-semibold text-ink outline-none',
        variant === 'chip' ? 'py-0 pr-4 text-[12px]' : 'w-full py-2.5 pl-3 pr-8 text-[13.5px]',
      )}
    >
      {DISTRICTS.map((district) => (
        <option key={district.id} value={district.id}>
          {pick(district.name, lang)}
        </option>
      ))}
    </select>
  );

  if (variant === 'field') {
    return (
      <span
        className={cx(
          'relative inline-flex items-center rounded-[10px] border border-line-bright bg-surface',
          className,
        )}
      >
        <MapPin size={14} className="ml-3 shrink-0 text-ink-faint" aria-hidden />
        {select}
        <Chevron />
      </span>
    );
  }

  return (
    <span className={cx('relative inline-flex items-center gap-1', className)}>
      <MapPin size={13} className="shrink-0 text-accent" aria-hidden />
      <span className="text-ink-dim">{t(lang, 'chrome.deliverTo')}:</span>
      {select}
      <Chevron small />
      <span className="sr-only">{pick(current.name, lang)}</span>
    </span>
  );
}

function Chevron({ small }: { small?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={cx(
        'pointer-events-none absolute text-ink-faint',
        small ? 'right-0 h-3 w-3' : 'right-3 h-3 w-3',
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 4.5 6 7.5 9 4.5" />
    </svg>
  );
}
