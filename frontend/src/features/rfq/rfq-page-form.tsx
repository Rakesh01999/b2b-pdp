'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, Loader2, Send } from 'lucide-react';

import { Button, ButtonLink } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import { CATEGORIES, findCategory } from '@/data/categories';
import { DISTRICTS } from '@/lib/constants';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The standalone sourcing request.
 *
 * The product page has a drawer for the case where the buyer is already looking
 * at a listing. This is the other case: nothing in the catalogue matches, and
 * the request has to describe the goods itself. Same fields where they overlap,
 * plus contact details, because a request that arrives with no way to reply is
 * not a request.
 *
 * The draft is written to `localStorage` on every change. A twelve-field form on
 * a phone that loses its contents to a mistimed back gesture is a form that gets
 * abandoned, and abandonment here costs a real order.
 */

const DRAFT_KEY = 'arcb2b.rfq-draft.v1';

interface Draft {
  item: string;
  category: string;
  quantity: string;
  targetPrice: string;
  districtId: string;
  neededBy: string;
  logoPrint: boolean;
  customPackaging: boolean;
  privateLabel: boolean;
  details: string;
  business: string;
  phone: string;
}

const EMPTY: Draft = {
  item: '',
  category: '',
  quantity: '',
  targetPrice: '',
  districtId: DISTRICTS[0].id,
  neededBy: '',
  logoPrint: false,
  customPackaging: false,
  privateLabel: false,
  details: '',
  business: '',
  phone: '',
};

function readDraft(): Draft {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** 11 digits starting 01 — the shape every Bangladeshi mobile number takes. */
function validPhone(value: string): boolean {
  return /^01\d{9}$/.test(value.replace(/[\s-]/g, ''));
}

export function RfqPageForm({ lang }: { lang: Lang }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);
  const formId = useId();

  useEffect(() => {
    const stored = readDraft();
    // A request started from a category page arrives as ?cat=, resolved through
    // the taxonomy so an unknown slug is ignored rather than selected.
    const requested = new URLSearchParams(window.location.search).get('cat');
    const match = requested ? findCategory(requested) : null;
    const seeded = match ? { ...stored, category: match.main.slug } : stored;
    // Reading persisted state out of storage is the sanctioned use of an effect:
    // the server has no storage, so seeding from it during render would make the
    // two renders disagree and React would throw the server HTML away.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setDraft(seeded);
    setRestored(stored.item !== '' || stored.quantity !== '');
  }, []);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        // Storage blocked. The form still works; only the draft is at risk.
      }
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const found: string[] = [];
    if (!draft.item.trim()) found.push(t(lang, 'rfqPage.productLabel'));
    if (!draft.quantity || Number(draft.quantity) <= 0) found.push(t(lang, 'rfq.quantity'));
    if (!validPhone(draft.phone)) found.push(t(lang, 'auth.phone'));
    setErrors(found);
    if (found.length > 0) return;

    setStatus('sending');
    // Stands in for `POST /v1/rfq`. The delay is what makes the pending state
    // observable — a submit button that never looks busy is one that gets
    // pressed twice.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-success/40 bg-surface p-6 sm:p-8">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-success/12 text-success">
          <Check size={24} strokeWidth={2.5} aria-hidden />
        </span>
        <h2 className="text-[19px] font-bold tracking-[-0.02em]">{t(lang, 'rfq.sent')}</h2>
        <p className="zone-evidence mt-2 max-w-[62ch] text-ink-dim">{t(lang, 'rfq.sentBody')}</p>

        {/* Honest about what actually happened. The alternative — inventing a
            reference number for a request no service received — is the kind of
            fiction that costs a buyer a week of waiting. */}
        <p className="mt-4 flex max-w-[62ch] gap-2.5 rounded-lg border border-line bg-surface-2 p-3.5 text-[12.5px] leading-relaxed text-ink-dim">
          <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0 text-warning" />
          {t(lang, 'auth.stubNote')}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink
            href={localeHref(lang, '/account/rfq/RFQ-24817')}
            variant="primary"
            size="md"
          >
            {t(lang, 'rfq.trackRequest')}
          </ButtonLink>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setStatus('idle');
              setDraft(EMPTY);
              try {
                window.localStorage.removeItem(DRAFT_KEY);
              } catch {
                /* nothing to clear */
              }
            }}
          >
            {t(lang, 'rfq.title')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {restored && (
        <p className="rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-[12.5px] text-ink-dim">
          {t(lang, 'rfq.draftRestored')}
        </p>
      )}

      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-danger/40 bg-danger/8 px-3.5 py-3 text-[13px] text-danger"
        >
          {t(lang, 'rfqPage.invalid')}
          <span className="sr-only"> {errors.join(', ')}</span>
        </div>
      )}

      <Fieldset legend={t(lang, 'rfqPage.productLabel')}>
        <Field label={t(lang, 'rfqPage.productLabel')} htmlFor={`${formId}-item`} required lang={lang}>
          <input
            id={`${formId}-item`}
            value={draft.item}
            onChange={(event) => update('item', event.target.value)}
            placeholder={t(lang, 'rfqPage.productPlaceholder')}
            className={inputClass}
          />
        </Field>

        <Field label={t(lang, 'search.category')} htmlFor={`${formId}-cat`} lang={lang}>
          <select
            id={`${formId}-cat`}
            value={draft.category}
            onChange={(event) => update('category', event.target.value)}
            className={inputClass}
          >
            <option value="">{t(lang, 'chrome.searchAll')}</option>
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {pick(category.name, lang)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t(lang, 'rfq.quantity')} htmlFor={`${formId}-qty`} required lang={lang}>
            <input
              id={`${formId}-qty`}
              type="number"
              inputMode="numeric"
              min={1}
              value={draft.quantity}
              onChange={(event) => update('quantity', event.target.value)}
              className={cx(inputClass, 'tnum')}
            />
          </Field>
          <Field label={`${t(lang, 'rfq.targetPrice')} (৳)`} htmlFor={`${formId}-target`} lang={lang}>
            <input
              id={`${formId}-target`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={draft.targetPrice}
              onChange={(event) => update('targetPrice', event.target.value)}
              className={cx(inputClass, 'tnum')}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t(lang, 'rfq.deliverTo')} htmlFor={`${formId}-district`} lang={lang}>
            <select
              id={`${formId}-district`}
              value={draft.districtId}
              onChange={(event) => update('districtId', event.target.value)}
              className={inputClass}
            >
              {DISTRICTS.map((district) => (
                <option key={district.id} value={district.id}>
                  {pick(district.name, lang)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t(lang, 'rfq.neededBy')} htmlFor={`${formId}-needed`} lang={lang}>
            <input
              id={`${formId}-needed`}
              type="date"
              value={draft.neededBy}
              onChange={(event) => update('neededBy', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset legend={t(lang, 'rfq.customisation')}>
        <div className="flex flex-wrap gap-x-6 gap-y-2.5">
          <Check1
            label={t(lang, 'rfq.logoPrint')}
            checked={draft.logoPrint}
            onChange={(value) => update('logoPrint', value)}
          />
          <Check1
            label={t(lang, 'rfq.customPackaging')}
            checked={draft.customPackaging}
            onChange={(value) => update('customPackaging', value)}
          />
          <Check1
            label={t(lang, 'rfq.privateLabel')}
            checked={draft.privateLabel}
            onChange={(value) => update('privateLabel', value)}
          />
        </div>

        <Field label={t(lang, 'rfq.details')} htmlFor={`${formId}-details`} lang={lang}>
          <textarea
            id={`${formId}-details`}
            rows={4}
            value={draft.details}
            onChange={(event) => update('details', event.target.value)}
            placeholder={t(lang, 'rfq.detailsPlaceholder')}
            className={cx(inputClass, 'h-auto resize-y py-2.5 leading-relaxed')}
          />
        </Field>
      </Fieldset>

      <Fieldset legend={t(lang, 'rfqPage.contact')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t(lang, 'rfqPage.business')} htmlFor={`${formId}-business`} lang={lang}>
            <input
              id={`${formId}-business`}
              value={draft.business}
              onChange={(event) => update('business', event.target.value)}
              autoComplete="organization"
              className={inputClass}
            />
          </Field>
          <Field
            label={t(lang, 'auth.phone')}
            hint={t(lang, 'auth.phoneHint')}
            htmlFor={`${formId}-phone`}
            required
            lang={lang}
          >
            <input
              id={`${formId}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="01XXXXXXXXX"
              className={cx(inputClass, 'tnum')}
            />
          </Field>
        </div>
        <p className="text-[12px] text-ink-faint">{t(lang, 'rfq.privacy')}</p>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button type="submit" variant="primary" size="lg" className="gap-2" disabled={status === 'sending'}>
          {status === 'sending' ? (
            <Loader2 size={17} aria-hidden className="animate-spin" />
          ) : (
            <Send size={17} aria-hidden />
          )}
          {status === 'sending' ? t(lang, 'rfq.sending') : t(lang, 'rfq.send')}
        </Button>
        <Link
          href={localeHref(lang, '/help/bulk')}
          className="text-[13px] font-semibold text-accent-ink transition-colors hover:text-accent"
        >
          {t(lang, 'rfqPage.aboutBulk')}
        </Link>
      </div>
    </form>
  );
}

/* --------------------------------------------------------------- form parts */

const inputClass =
  'h-11 w-full rounded-lg border border-line-bright bg-surface px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint focus-visible:border-accent';

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <legend className="px-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-faint">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  required,
  lang,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  required?: boolean;
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline gap-2 text-[12.5px] font-semibold">
        {label}
        {required && (
          <span className="text-[11px] font-normal text-ink-faint">({t(lang, 'rfq.required')})</span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11.5px] text-ink-faint">{hint}</p>}
    </div>
  );
}

function Check1({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13.5px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}
