'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Check, Clock, Paperclip, X } from 'lucide-react';
import { useTrade } from '@/features/product/trade-context';
import { usePrefs } from '@/features/app/providers';
import { Overlay } from '@/components/ui/overlay';
import { Button, ButtonLink } from '@/components/ui/primitives';
import { DistrictSelect } from '@/features/chrome/controls';
import { cx } from '@/components/ui/cx';
import { unitPriceForQty } from '@/features/product/lib/pricing';
import { num, taka, unitLabel } from '@/lib/format';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * Request for quotation.
 *
 * A drawer on a laptop, a bottom sheet on a phone, and never a modal: a buyer
 * typing "target ৳425/pc" needs the ladder still visible behind the form. Not an
 * inline section either — buyers who want a quote want it from the panel, not
 * after scrolling past the reviews — and not a full-page navigation, which loses
 * the page state they built up.
 *
 * Everything that can be prefilled is prefilled. An RFQ form that asks a buyer to
 * retype the quantity they just entered is the single most common reason RFQ
 * conversion is poor, and it is entirely self-inflicted.
 *
 * The whole component is a lazy chunk (see the page), so none of it is in the
 * product page's initial JavaScript.
 */

const DRAFT_KEY = 'arcb2b.rfq.draft';

interface Draft {
  slug: string;
  qty: string;
  targetPrice: string;
  neededBy: string;
  details: string;
  logo: boolean;
  packaging: boolean;
  privateLabel: boolean;
}

function emptyDraft(slug: string): Draft {
  return {
    slug,
    qty: '',
    targetPrice: '',
    neededBy: '',
    details: '',
    logo: false,
    packaging: false,
    privateLabel: false,
  };
}

export function RfqDrawer({ lang }: { lang: Lang }) {
  const { product, qty, rfqOpen, closeRfq, rfqReason } = useTrade();
  const { districtId } = usePrefs();

  const [draft, setDraft] = useState<Draft>(() => emptyDraft(product.slug));
  const [files, setFiles] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [restored, setRestored] = useState(false);

  const unit = unitLabel(product.pricing.unit, lang);
  const unitPlural = unitLabel(product.pricing.unit, lang, true);

  /**
   * Suggested quantity by reason: a volume enquiry starts above the top tier
   * because that is why it was opened, and everything else starts from whatever
   * the buyer has already built in the grid.
   */
  const suggestedQty = useMemo(() => {
    const topTier = product.pricing.tiers.at(-1);
    if (rfqReason === 'volume' && topTier) return Math.max(qty, topTier.minQty * 2);
    return qty > 0 ? qty : product.pricing.moq;
  }, [rfqReason, qty, product.pricing.tiers, product.pricing.moq]);

  // Restore a draft for this product, otherwise prefill from page state. Losing
  // typed input is unacceptable, so the draft always wins.
  useEffect(() => {
    if (!rfqOpen) return;
    // Reads the saved draft out of storage each time the drawer opens. Deriving
    // this during render is not possible — storage does not exist on the server
    // — and losing typed input is the one failure this form must never have.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setStatus('idle');

    let saved: Draft | null = null;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      const parsed = raw ? (JSON.parse(raw) as Draft) : null;
      if (parsed?.slug === product.slug) saved = parsed;
    } catch {
      // Storage unavailable — fall through to a prefilled blank form.
    }

    if (saved) {
      setDraft(saved);
      setRestored(true);
    } else {
      setDraft({
        ...emptyDraft(product.slug),
        qty: String(suggestedQty),
        logo: rfqReason === 'custom',
      });
      setRestored(false);
    }
  }, [rfqOpen, product.slug, suggestedQty, rfqReason]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        // Draft persistence is a convenience, never a blocker.
      }
      return next;
    });
  };

  const numericQty = Number(draft.qty.replace(/[^\d]/g, '')) || 0;
  const anchorPrice = product.pricing.priceOnRequest
    ? null
    : unitPriceForQty(product.pricing.tiers, Math.max(numericQty, product.pricing.moq));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('sending');

    // Stands in for `POST /v1/rfq`.
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (numericQty <= 0) {
      setStatus('error');
      return;
    }

    setStatus('sent');
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }

  if (status === 'sent') {
    return (
      <Overlay
        open={rfqOpen}
        onClose={closeRfq}
        title={t(lang, 'rfq.sent')}
        closeLabel={t(lang, 'rfq.close')}
        footer={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="md" onClick={closeRfq} className="flex-1">
              {t(lang, 'cta.continueBrowsing')}
            </Button>
            <ButtonLink
              href={localeHref(lang, '/account/rfq/RFQ-24817')}
              variant="primary"
              size="md"
              className="flex-1"
            >
              {t(lang, 'rfq.trackRequest')}
            </ButtonLink>
          </div>
        }
      >
        <div className="space-y-4 p-5">
          <p className="inline-flex items-center gap-2 text-[15px] font-bold text-success">
            <Check size={18} strokeWidth={2.6} aria-hidden />
            {t(lang, 'rfq.sent')}
          </p>
          <p className="zone-evidence text-ink-dim">{t(lang, 'rfq.sentBody')}</p>
          <dl className="zone-decision space-y-1.5 rounded-[10px] border border-line bg-surface-2 p-3.5">
            <Line label={t(lang, 'rfq.quantity')}>
              <span className="tnum">
                {num(numericQty)} {unitPlural}
              </span>
            </Line>
            {draft.targetPrice && (
              <Line label={t(lang, 'rfq.targetPrice')}>
                <span className="price">৳{draft.targetPrice}/{unit}</span>
              </Line>
            )}
            <Line label={lang === 'bn' ? 'রেফারেন্স' : 'Reference'}>
              <span className="tnum">RFQ-24817</span>
            </Line>
          </dl>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay
      open={rfqOpen}
      onClose={closeRfq}
      title={t(lang, 'rfq.title')}
      closeLabel={t(lang, 'rfq.close')}
      footer={
        <div className="space-y-2">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-dim">
            <Clock size={13} aria-hidden />
            {t(lang, 'rfq.responseTime')}: 4 {lang === 'bn' ? 'ঘণ্টা' : 'hours'}
          </p>
          <Button
            type="submit"
            form="rfq-form"
            variant="primary"
            size="lg"
            block
            disabled={status === 'sending'}
          >
            {status === 'sending' ? t(lang, 'rfq.sending') : t(lang, 'rfq.send')}
          </Button>
          <p className="text-[11.5px] leading-relaxed text-ink-faint">{t(lang, 'rfq.privacy')}</p>
        </div>
      }
    >
      <form id="rfq-form" onSubmit={onSubmit} className="space-y-4 p-5">
        {/* Locked context. The buyer can see exactly what they are quoting on,
            and cannot accidentally send a quote for the wrong line. */}
        <div className="flex items-center gap-3 rounded-[10px] border border-line bg-surface-2 p-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
            <Image src={product.thumb} alt="" fill sizes="48px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="clamp-2 text-[13px] font-semibold leading-snug">
              {pick(product.title, lang)}
            </p>
            {anchorPrice !== null && (
              <p className="tnum mt-0.5 text-[11.5px] text-ink-dim">
                {t(lang, 'rfq.ladderAnchor')} {num(Math.max(numericQty, product.pricing.moq))}:{' '}
                <b className="price text-ink">
                  {taka(anchorPrice)}/{unit}
                </b>
              </p>
            )}
          </div>
        </div>

        {restored && (
          <p className="rounded-md border border-info/25 bg-info-soft px-3 py-2 text-[12px] font-semibold text-info">
            {t(lang, 'rfq.draftRestored')}
          </p>
        )}

        {status === 'error' && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-[12px] font-semibold text-danger">
            {t(lang, 'rfq.failed')}
          </p>
        )}

        <Field label={t(lang, 'rfq.quantity')} required htmlFor="rfq-qty" suffix={unitPlural}>
          <input
            id="rfq-qty"
            inputMode="numeric"
            required
            value={draft.qty}
            onChange={(event) => update('qty', event.target.value.replace(/[^\d]/g, ''))}
            className={inputClass}
          />
        </Field>

        <Field label={t(lang, 'rfq.targetPrice')} htmlFor="rfq-target" suffix={`৳ / ${unit}`}>
          <input
            id="rfq-target"
            inputMode="decimal"
            value={draft.targetPrice}
            onChange={(event) => update('targetPrice', event.target.value.replace(/[^\d.]/g, ''))}
            placeholder={anchorPrice !== null ? String(Math.round((anchorPrice / 100) * 0.95)) : ''}
            className={inputClass}
          />
        </Field>

        <div>
          <span className={labelClass}>
            {t(lang, 'rfq.deliverTo')} <Req lang={lang} />
          </span>
          <DistrictSelect lang={lang} variant="field" id="rfq-district" className="mt-1.5 w-full" />
          <input type="hidden" name="district" value={districtId} />
        </div>

        <Field label={t(lang, 'rfq.neededBy')} htmlFor="rfq-date">
          <input
            id="rfq-date"
            type="date"
            value={draft.neededBy}
            onChange={(event) => update('neededBy', event.target.value)}
            className={inputClass}
          />
        </Field>

        {product.customisation && (
          <fieldset>
            <legend className={labelClass}>{t(lang, 'rfq.customisation')}</legend>
            <div className="mt-1.5 space-y-1.5">
              {product.customisation.logoPrintMoq != null && (
                <Check_ label={t(lang, 'rfq.logoPrint')} hint={`${t(lang, 'moq.label')} ${num(product.customisation.logoPrintMoq)}`} checked={draft.logo} onChange={(v) => update('logo', v)} />
              )}
              {product.customisation.customPackagingMoq != null && (
                <Check_ label={t(lang, 'rfq.customPackaging')} hint={`${t(lang, 'moq.label')} ${num(product.customisation.customPackagingMoq)}`} checked={draft.packaging} onChange={(v) => update('packaging', v)} />
              )}
              {product.customisation.privateLabelMoq != null && (
                <Check_ label={t(lang, 'rfq.privateLabel')} hint={`${t(lang, 'moq.label')} ${num(product.customisation.privateLabelMoq)}`} checked={draft.privateLabel} onChange={(v) => update('privateLabel', v)} />
              )}
            </div>
          </fieldset>
        )}

        <Field label={t(lang, 'rfq.details')} htmlFor="rfq-details">
          <textarea
            id="rfq-details"
            rows={4}
            value={draft.details}
            onChange={(event) => update('details', event.target.value)}
            placeholder={t(lang, 'rfq.detailsPlaceholder')}
            className={cx(inputClass, 'resize-y leading-relaxed')}
          />
        </Field>

        <div>
          <span className={labelClass}>{t(lang, 'rfq.attachments')}</span>
          <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-dashed border-line-bright px-3 py-3 text-[13px] font-semibold text-ink-dim transition-colors hover:border-accent hover:text-accent-ink">
            <Paperclip size={15} aria-hidden />
            {t(lang, 'rfq.addFiles')}
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.ai,.eps,.svg,.xlsx,.csv"
              className="sr-only"
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []).slice(0, 5).map((f) => f.name))
              }
            />
          </label>
          <p className="mt-1.5 text-[11.5px] text-ink-faint">{t(lang, 'rfq.attachmentHint')}</p>

          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-2 rounded-md bg-surface-2 px-2.5 py-1.5 text-[12px]"
                >
                  <span className="min-w-0 truncate">{name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((f) => f !== name))}
                    aria-label={`${t(lang, 'misc.close')} ${name}`}
                    className="shrink-0 text-ink-faint transition-colors hover:text-danger"
                  >
                    <X size={13} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>
    </Overlay>
  );
}

const inputClass =
  'mt-1.5 w-full rounded-[10px] border border-line-bright bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-accent';

const labelClass = 'text-[12px] font-bold uppercase tracking-[0.05em] text-ink-dim';

function Req({ lang }: { lang: Lang }) {
  return (
    <span className="font-medium normal-case text-danger">*{t(lang, 'rfq.required')}</span>
  );
}

function Field({
  label,
  htmlFor,
  required,
  suffix,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label} {required && <Req lang="en" />}
        {suffix && <span className="ml-1 font-medium normal-case text-ink-faint">({suffix})</span>}
      </label>
      {children}
    </div>
  );
}

function Check_({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-[13px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 accent-[var(--accent)]"
      />
      <span className="font-medium">{label}</span>
      <span className="tnum ml-auto text-[11.5px] text-ink-faint">{hint}</span>
    </label>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-dim">{label}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  );
}
