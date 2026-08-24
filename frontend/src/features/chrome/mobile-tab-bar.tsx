'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/features/app/providers';
import { useScrollDirection } from './use-scroll-direction';
import { cx } from '@/components/ui/cx';
import { localeHref, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * Mobile primary navigation.
 *
 * On a product page it auto-hides while scrolling down and returns on scrolling
 * up. That is a deliberate concession: the product page also carries a fixed
 * trade bar, and two 56px bars at rest eat a sixth of a phone viewport. The tab
 * bar is a wayfinding tool and can yield; the purchase decision cannot. Away
 * from product pages there is no trade bar, so it never hides.
 */
export function MobileTabBar({ lang }: { lang: Lang }) {
  const pathname = usePathname() ?? '/';
  const { unitCount, hydrated } = useCart();
  const { direction, nearTop } = useScrollDirection();

  const onProductPage = /\/product\//.test(pathname);
  const hidden = onProductPage && direction === 'down' && !nearTop;

  const tabs = [
    { href: '/', icon: Home, label: t(lang, 'chrome.home'), exact: true },
    { href: '/categories', icon: LayoutGrid, label: t(lang, 'chrome.categories') },
    { href: '/search', icon: Search, label: t(lang, 'chrome.search') },
    {
      href: '/cart',
      icon: ShoppingCart,
      label: t(lang, 'chrome.cart'),
      badge: hydrated && unitCount > 0 ? unitCount : undefined,
    },
    { href: '/account', icon: User, label: t(lang, 'chrome.account') },
  ];

  return (
    <nav
      aria-label={t(lang, 'chrome.categories')}
      className={cx(
        'glass fixed inset-x-0 bottom-0 z-40 border-t border-line pb-[env(safe-area-inset-bottom,0px)] transition-transform duration-200 md:hidden motion-reduce:transition-none',
        hidden ? 'translate-y-full' : 'translate-y-0',
      )}
    >
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => {
          const href = localeHref(lang, tab.href);
          const active = tab.exact
            ? pathname === href || pathname === `${href}/`
            : pathname.startsWith(href);
          const Icon = tab.icon;

          return (
            <li key={tab.href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  // 56px tall: the icon plus label barely clears the 44px
                  // minimum on its own.
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors',
                  active ? 'text-accent-ink' : 'text-ink-dim',
                )}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
                  {tab.badge != null && (
                    <span className="tnum absolute -right-2.5 -top-1.5 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-deal px-1 text-[9px] font-bold leading-none text-on-fill">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
