'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Check, MessageCircle, ShoppingCart } from 'lucide-react';
import { useTrade } from '@/features/product/trade-context';
import { usePrimaryAction } from './use-primary-action';
import { useScrollDirection } from '@/features/chrome/use-scroll-direction';
import { Button, ButtonLink } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import { num, taka, unitLabel } from '@/lib/format';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The persistent trade bar.
 *
 * A bottom bar on a phone, a slim top bar on a laptop, one component and one
 * visibility rule: it appears once the panel's own CTA has left the viewport.
 * The evaluation content on this page is long, and the decision has to stay
 * reachable while a buyer reads specifications or reviews — but a bar that is
 * present while the real panel is also on screen is just clutter competing with
 * itself.
 *
 * Visibility is driven by an IntersectionObserver on a server-rendered anchor
 * rather than by a scroll-position threshold, so it stays correct no matter how
 * tall the hero renders at a given breakpoint or language.
 */
export function StickyTradeBar({ lang, anchorId = 'trade-anchor' }: { lang: Lang; anchorId?: string }) {
  const { product, qty, unitPrice, fromPrice, quoteOnly, legal, addStatus, sheetOpen, rfqOpen } = useTrade();
  const primary = usePrimaryAction(lang);
  const [past, setPast] = useState(false);

  // Same rule the tab bar uses, read from the same hook, so the two bars can
  // never disagree about whether the lower slot is occupied.
  const { direction, nearTop } = useScrollDirection();
  const tabBarHidden = direction === 'down' && !nearTop;

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only when the anchor has gone *above* the viewport. Without the
        // boundingClientRect check the bar would also appear while the anchor is
        // still below the fold, which is the whole page on first paint.
        setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorId]);

  // Suppressed while an overlay owns the screen: a fixed bar behind a bottom
  // sheet is both unreachable and visually noisy.
  const visible = past && !sheetOpen && !rfqOpen;

  const unit = unitLabel(product.pricing.unit, lang);
  const unitPlural = unitLabel(product.pricing.unit, lang, true);
  const displayPrice = qty > 0 ? unitPrice : fromPrice;

  return (
    <div
      aria-hidden={!visible}
      className={cx(
        'glass fixed inset-x-0 z-40 border-line transition-all duration-200 motion-reduce:transition-none',
        // Above the tab bar on mobile; directly under the header on desktop.
        'border-t md:bottom-auto md:top-[var(--header-h)] md:border-b md:border-t-0 md:pb-0',
        // The two mobile bars move as one unit. The tab bar yields on scroll-down
        // (navigation can wait; the purchase decision cannot), and the trade bar
        // drops into the space it vacates rather than leaving a 56px strip of
        // page showing beneath it.
        tabBarHidden ? 'bottom-0 pb-[env(safe-area-inset-bottom,0px)]' : 'bottom-14 pb-0',
        // Hiding has to clear both the bar and the tab bar below it. A plain
        // `translate-y-full` moved it down by its own height only, parking it
        // exactly on top of the tab bar instead of off-screen.
        visible ? 'translate-y-0' : 'translate-y-[calc(100%+3.5rem)] md:-translate-y-[130%]',
      )}
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-center gap-3 px-4 py-2.5 sm:px-6">
        {/* Identity, desktop only: on a phone the product is unambiguous
            because its images are two swipes away, and the width is better
            spent on the CTA. */}
        <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
            <Image src={product.thumb} alt="" fill sizes="40px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-tight">
              {pick(product.title, lang)}
            </p>
            <p className="tnum text-[11.5px] text-ink-dim">
              {product.sku}
              {qty > 0 && (
                <>
                  {' · '}
                  {num(qty)} {unitPlural}
                </>
              )}
            </p>
          </div>
        </div>

        {!quoteOnly && (
          <div className="flex shrink-0 items-baseline gap-1">
            <span className="price text-[19px] font-bold leading-none text-price">
              {taka(displayPrice)}
            </span>
            <span className="text-[11px] text-ink-dim">/{unit}</span>
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ButtonLink
            href={localeHref(lang, `/messages?product=${product.slug}`)}
            variant="secondary"
            size="md"
            aria-label={t(lang, 'cta.chat')}
            className="w-11 px-0"
          >
            <MessageCircle size={17} aria-hidden />
          </ButtonLink>

          <Button
            variant="primary"
            size="md"
            disabled={primary.disabled || addStatus === 'pending'}
            onClick={primary.run}
            className="min-w-[9.5rem]"
          >
            {addStatus === 'added' ? (
              <>
                <Check size={16} strokeWidth={2.6} aria-hidden />
                {t(lang, 'cta.added')}
              </>
            ) : (
              <>
                {!primary.isQuote && <ShoppingCart size={16} aria-hidden />}
                <span className="truncate">{primary.label}</span>
                {!primary.isQuote && qty > 0 && legal && (
                  <span className="tnum hidden sm:inline">· {num(qty)}</span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
