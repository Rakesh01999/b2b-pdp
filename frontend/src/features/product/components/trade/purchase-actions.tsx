'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CreditCard,
  Heart,
  MessageCircle,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTrade } from '@/features/product/trade-context';
import { usePrimaryAction } from './use-primary-action';
import { useCart } from '@/features/app/providers';
import { Button, ButtonLink } from '@/components/ui/primitives';
import { Overlay } from '@/components/ui/overlay';
import { cx } from '@/components/ui/cx';
import { snapToStep } from '@/features/product/lib/pricing';
import { DISPUTE_WINDOW_DAYS } from '@/lib/constants';
import { dayRange, num, taka, unitLabel } from '@/lib/format';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The purchase actions, and the answer to "which CTA is primary".
 *
 * The label and the destination are derived from the listing's own data — stock,
 * lead time, whether a ladder is published, whether customisation was requested,
 * and how far past the top tier the quantity has gone. A designer picking one CTA
 * for every listing would be wrong for most of them.
 *
 * There is deliberately no "Buy Now". An order here is a multi-SKU matrix under a
 * consolidated MOQ, and checkout needs a district, a courier, a payment method
 * and an escrow acknowledgement. A path that skips the cart either skips those
 * decisions or duplicates checkout forever — so the cart *is* the express lane,
 * because it is where a mix becomes an order.
 */

export function PurchaseActions({ lang }: { lang: Lang }) {
  const {
    product,
    qty,
    landed,
    legal,
    belowMoq,
    listingState,
    quoteOnly,
    sourcingDays,
    selectedQuote,
    addStatus,
    setAddStatus,
    openRfq,
    snapToLegal,
  } = useTrade();

  const { toggleSaved, isSaved, hydrated } = useCart();
  const primary = usePrimaryAction(lang);
  const [shared, setShared] = useState(false);

  const unitPlural = unitLabel(product.pricing.unit, lang, true);
  const saved = hydrated && isSaved(product.slug);
  const cartRoutes = !primary.isQuote;

  // The confirmation sheet IS the 'added' status rather than a copy of it, so an
  // add started from the sticky bar surfaces the same sheet and there is no
  // second source of truth to fall out of sync. Dismissing returns the status to
  // idle. The mix is never cleared on failure — losing a filled grid is the
  // worst thing that can happen on this page.

  async function onShare() {
    // Sharing a *configured* quote is the B2B behaviour that matters: a buyer
    // sends a colleague the price at their quantity, not the headline price.
    const url = new URL(window.location.href);
    if (qty > 0) url.searchParams.set('qty', String(qty));
    const payload = { title: pick(product.title, lang), url: url.toString() };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      await navigator.clipboard.writeText(payload.url);
      setShared(true);
      toast.success(t(lang, 'cta.linkCopied'));
      setTimeout(() => setShared(false), 2200);
    } catch {
      // Share cancelled or clipboard denied — nothing to recover, and an error
      // toast for a cancelled share is noise.
    }
  }

  function handleSave() {
    toggleSaved(product.slug);
    if (!saved) {
      toast.success(t(lang, 'cta.saved'));
    }
  }

  return (
    <div className="space-y-3">
      {/* Validation sits beside the control it blocks, and always carries the
          remedy. A bare "invalid" state makes the buyer work out the fix. */}
      {qty > 0 && (belowMoq || !legal) && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] border border-warning/30 bg-warning-soft px-3 py-2.5"
        >
          <span className="flex min-w-0 flex-1 items-start gap-2 text-[12.5px] font-semibold text-warning">
            <AlertTriangle size={15} className="mt-px shrink-0" aria-hidden />
            <span>
              {belowMoq ? (
                <>
                  {t(lang, 'moq.minimumIs')}{' '}
                  <span className="tnum">
                    {num(product.pricing.moq)} {unitPlural}
                  </span>
                  {' — '}
                  {t(lang, 'moq.addMore')}{' '}
                  <span className="tnum">{num(product.pricing.moq - qty)}</span>
                </>
              ) : (
                <>
                  {t(lang, 'moq.stepRule')}{' '}
                  <span className="tnum">{num(product.pricing.moqStep)}</span>
                </>
              )}
            </span>
          </span>
          <Button variant="secondary" size="sm" onClick={snapToLegal} className="shrink-0">
            {belowMoq ? t(lang, 'moq.setTo') : t(lang, 'moq.roundUp')}{' '}
            <span className="tnum">
              {num(snapToStep(Math.max(qty, 1), product.pricing.moq, product.pricing.moqStep))}
            </span>
          </Button>
        </div>
      )}

      {/* Sourced-to-order is stated before the CTA, never after. Lead time
          measured from payment confirmation rather than order placement is the
          single largest source of B2B delivery disputes. */}
      {listingState === 'sourced_to_order' && sourcingDays > 0 && (
        <p className="rounded-[10px] border border-info/25 bg-info-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-info">
          <b>{t(lang, 'product.sourcedToOrder')}</b> — {t(lang, 'assurance.shipsIn')}{' '}
          <span className="tnum">
            {product.logistics.sourcingDays
              ? dayRange(product.logistics.sourcingDays[0], product.logistics.sourcingDays[1], lang)
              : dayRange(sourcingDays, sourcingDays + 4, lang)}
          </span>{' '}
          {t(lang, 'assurance.afterPayment')}
        </p>
      )}

      {addStatus === 'error' && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2.5 text-[12.5px] font-semibold text-danger"
        >
          {t(lang, 'cta.addFailed')}
          <Button variant="secondary" size="sm" onClick={primary.run}>
            {t(lang, 'cta.retry')}
          </Button>
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        block
        disabled={primary.disabled || addStatus === 'pending'}
        onClick={primary.run}
        aria-describedby={primary.disabled ? 'moq-help' : undefined}
      >
        {addStatus === 'pending' ? (
          <>
            <span
              aria-hidden
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            {t(lang, 'cta.adding')}
          </>
        ) : addStatus === 'added' ? (
          <>
            <Check size={17} strokeWidth={2.6} aria-hidden />
            {t(lang, 'cta.added')}
          </>
        ) : (
          <>
            {cartRoutes && <ShoppingCart size={17} aria-hidden />}
            {primary.label}
            {cartRoutes && qty > 0 && legal && (
              <span className="tnum font-semibold opacity-90">
                · {num(qty)} {unitPlural}
              </span>
            )}
          </>
        )}
      </Button>

      {/* A disabled control always states its reason. With no quantity entered
          there is no validation message above to explain the greyed-out button,
          so it says so here — visibly, not only to a screen reader. */}
      {primary.disabled && (
        <p id="moq-help" className="text-center text-[12px] text-ink-dim">
          {qty === 0 ? (
            <>
              {lang === 'bn' ? 'উপরের গ্রিডে পরিমাণ দিন — সর্বনিম্ন ' : 'Enter a quantity above — minimum '}
              <span className="tnum font-semibold text-ink">
                {num(product.pricing.moq)} {unitPlural}
              </span>
            </>
          ) : (
            <>
              {t(lang, 'moq.minimumIs')}{' '}
              <span className="tnum font-semibold text-ink">
                {num(product.pricing.moq)} {unitPlural}
              </span>
            </>
          )}
        </p>
      )}

      {/* Secondary actions. Never a second solid button — competing primaries is
          the most common B2B product-page mistake and converts worse than
          either alone. */}
      <div className="flex flex-wrap gap-2">
        {!primary.isQuote && (
          <Button variant="secondary" size="md" onClick={() => openRfq('general')} className="flex-1">
            {t(lang, 'cta.requestQuote')}
          </Button>
        )}
        {product.pricing.samplePrice != null && (
          <Button variant="secondary" size="md" className="flex-1 whitespace-nowrap">
            {t(lang, 'cta.orderSample')}
            <span className="price font-bold">{taka(product.pricing.samplePrice)}</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <ButtonLink
          href={localeHref(lang, `/messages?product=${product.slug}`)}
          variant="ghost"
          size="sm"
          className="flex-1 gap-1.5"
        >
          <MessageCircle size={15} aria-hidden />
          {t(lang, 'cta.chat')}
        </ButtonLink>

        {/* Saving works before sign-in and merges on sign-in. Baymard finds 89%
            of sites force registration first, and 21% of users rely on saving
            to compare — which is exactly what a B2B buyer is doing here. */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          aria-pressed={saved}
          className={cx('flex-1 gap-1.5', saved && 'text-accent-ink')}
        >
          <Heart size={15} aria-hidden fill={saved ? 'currentColor' : 'none'} />
          {saved ? t(lang, 'cta.saved') : t(lang, 'cta.save')}
        </Button>

        <Button variant="ghost" size="sm" onClick={onShare} className="flex-1 gap-1.5">
          {shared ? <Check size={15} aria-hidden /> : <Share2 size={15} aria-hidden />}
          {shared ? t(lang, 'cta.linkCopied') : t(lang, 'cta.share')}
        </Button>
      </div>

      <ul className="zone-decision space-y-2 border-t border-line pt-3 text-ink-dim">
        <Assurance icon={<ShieldCheck size={14} aria-hidden />}>{t(lang, 'assurance.escrow')}</Assurance>
        <Assurance icon={<RotateCcw size={14} aria-hidden />}>
          {DISPUTE_WINDOW_DAYS}-{t(lang, 'assurance.dispute')}
        </Assurance>
        <Assurance icon={<CreditCard size={14} aria-hidden />}>{t(lang, 'assurance.payment')}</Assurance>
        <Assurance icon={<Truck size={14} aria-hidden />}>
          {product.logistics.leadTimeDays === 0
            ? t(lang, 'assurance.shipsNow')
            : `${t(lang, 'assurance.shipsIn')} ${
                product.logistics.sourcingDays
                  ? dayRange(product.logistics.sourcingDays[0], product.logistics.sourcingDays[1], lang)
                  : dayRange(product.logistics.leadTimeDays, product.logistics.leadTimeDays + 4, lang)
              }`}
        </Assurance>
      </ul>

      <AddedConfirmation
        open={addStatus === 'added'}
        onClose={() => setAddStatus('idle')}
        lang={lang}
        qty={qty}
        unitPlural={unitPlural}
        total={quoteOnly ? 0 : landed.total}
        courier={selectedQuote?.courierName}
      />
    </div>
  );
}

function Assurance({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-px shrink-0 text-success">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

/**
 * Confirmation as a dismissible sheet rather than a navigation. A wholesale
 * buyer adds several mixes in one session, and jumping them to the cart after
 * the first one interrupts the job they came to do.
 */
function AddedConfirmation({
  open,
  onClose,
  lang,
  qty,
  unitPlural,
  total,
  courier,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  qty: number;
  unitPlural: string;
  total: number;
  courier?: string;
}) {
  return (
    <Overlay
      open={open}
      onClose={onClose}
      variant="sheet"
      title={t(lang, 'cta.added')}
      closeLabel={t(lang, 'misc.close')}
      footer={
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md" onClick={onClose} className="flex-1">
            {t(lang, 'cta.continueBrowsing')}
          </Button>
          <ButtonLink href={localeHref(lang, '/cart')} variant="primary" size="md" className="flex-1">
            {t(lang, 'cta.goToCart')}
          </ButtonLink>
        </div>
      }
    >
      <div className="space-y-3 p-5">
        <p className="inline-flex items-center gap-2 text-[14px] font-semibold text-success">
          <Check size={17} strokeWidth={2.6} aria-hidden />
          <span className="tnum">
            {num(qty)} {unitPlural}
          </span>
        </p>
        {total > 0 && (
          <dl className="zone-decision space-y-1.5 rounded-[10px] border border-line bg-surface-2 p-3">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-dim">{t(lang, 'landed.total')}</dt>
              <dd className="price font-bold">{taka(total)}</dd>
            </div>
            {courier && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-dim">{t(lang, 'landed.courier')}</dt>
                <dd className="font-semibold">{courier}</dd>
              </div>
            )}
          </dl>
        )}
        <p className="text-[12.5px] leading-relaxed text-ink-dim">
          {lang === 'bn'
            ? 'চেকআউটে কুরিয়ার ও পেমেন্ট চূড়ান্ত করতে পারবেন। এসক্রোতে টাকা থাকবে, ডেলিভারি নিশ্চিত হলে বিক্রেতা পাবেন।'
            : 'Courier and payment are confirmed at checkout. Funds sit in escrow until you confirm delivery.'}
        </p>
      </div>
    </Overlay>
  );
}
