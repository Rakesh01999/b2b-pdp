import Link from 'next/link';
import { LifeBuoy, Zap, FileText } from 'lucide-react';
import { PrimaryBar } from './primary-bar';
import { DistrictSelect, LanguageSwitch, ThemeToggle } from './controls';
import { MegaMenu } from '@/features/categories/mega-menu';
import { NAV_CATEGORIES, TRENDING_TERMS } from '@/lib/catalog';
import { MESSAGE_THREADS, NOTIFICATIONS } from '@/data/account';
import { localeHref, pick, t, type Locale } from '@/lib/i18n';

/**
 * Three rows, one of which pins.
 *
 *   Utility bar    global preferences and secondary links — scrolls away,
 *                  because nothing here is needed mid-task
 *   Primary bar    identity, search, account actions — the pinned row
 *   Category rail  browse entry points and the standing RFQ link — scrolls away
 *
 * Everything except `PrimaryBar` and the small controls is a Server Component,
 * so the category tree and the utility links cost no client JavaScript.
 */
export function Header({ lang }: { lang: Locale }) {
  // Both badges are counted, not decided. A hardcoded `2` on the message icon
  // is a number that is wrong the moment anything changes, and a badge a buyer
  // learns to distrust is worse than no badge at all.
  const awaitingReply = MESSAGE_THREADS.filter(
    (thread) => thread.messages[thread.messages.length - 1].from === 'seller',
  ).length;
  const unreadNotifications = NOTIFICATIONS.filter((entry) => !entry.read).length;

  return (
    <>
      {/* Raised above the pinned row below it: the language and district
          controls open downward, and a lower stacking context would paint them
          behind the header. */}
      <div className="zone-nav relative z-[60] hidden border-b border-line bg-surface text-ink-dim md:block">
        <div className="shell flex h-9 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <DistrictSelect lang={lang} />
            <span aria-hidden className="h-3 w-px bg-line" />
            <span className="font-semibold">৳ BDT</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href={localeHref(lang, '/how-it-works')} className="transition-colors hover:text-accent-ink">
              {t(lang, 'chrome.howItWorks')}
            </Link>
            <Link href={localeHref(lang, '/account')} className="transition-colors hover:text-accent-ink">
              {t(lang, 'chrome.myOrders')}
            </Link>
            <Link
              href={localeHref(lang, '/sell')}
              className="hidden transition-colors hover:text-accent-ink lg:inline"
            >
              {t(lang, 'chrome.sellOnArcB2B')}
            </Link>
            <span aria-hidden className="h-3 w-px bg-line" />
            <LanguageSwitch lang={lang} />
            <ThemeToggle lang={lang} />
          </div>
        </div>
      </div>

      <PrimaryBar
        lang={lang}
        categories={NAV_CATEGORIES}
        trending={TRENDING_TERMS}
        messageCount={awaitingReply}
        notificationCount={unreadNotifications}
      />

      {/* Category rail. Scrolls away and slides under the pinned bar — search
          stays the pinned discovery tool, and the full tree is one click away.

          `relative` so the All Categories flyout can anchor to this row rather
          than to the page; `z-40` keeps the open panel above the content below
          without competing with the pinned bar above it. */}
      <div className="zone-nav relative z-40 border-b border-line bg-surface">
        <div className="shell flex h-11 items-center gap-1">
          <MegaMenu lang={lang} />
          <span aria-hidden className="h-4 w-px shrink-0 bg-line" />

          <nav
            aria-label={t(lang, 'chrome.categories')}
            className="slim-scroll scroll-hint flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
          >
            {NAV_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={localeHref(lang, `/category/${category.slug}`)}
                className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium text-ink-dim transition-colors hover:bg-surface-2 hover:text-accent-ink"
              >
                {pick(category.name, lang)}
              </Link>
            ))}
          </nav>

          {/* RFQ is a standing entry point in the chrome, not only a button on
              the product page: a buyer who cannot find what they need must
              always have "ask us to source it" within reach. */}
          <span className="ml-auto flex shrink-0 items-center gap-3 pl-2">
            <Link
              href={localeHref(lang, '/deals')}
              className="inline-flex items-center gap-1.5 font-semibold text-deal transition-opacity hover:opacity-80"
            >
              <Zap size={14} aria-hidden />
              <span className="hidden sm:inline">{t(lang, 'chrome.flashDeals')}</span>
            </Link>
            <Link
              href={localeHref(lang, '/rfq/new')}
              className="hidden items-center gap-1.5 text-ink-dim transition-colors hover:text-accent-ink lg:inline-flex"
            >
              <FileText size={14} aria-hidden />
              {t(lang, 'chrome.requestQuote')}
            </Link>
            <Link
              href={localeHref(lang, '/help')}
              className="hidden items-center gap-1.5 text-ink-dim transition-colors hover:text-accent-ink xl:inline-flex"
            >
              <LifeBuoy size={14} aria-hidden />
              {t(lang, 'chrome.help')}
            </Link>
          </span>
        </div>
      </div>
    </>
  );
}
