'use client';

import { useId, useState } from 'react';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/primitives';
import { cx } from '@/components/ui/cx';
import { DISTRICTS } from '@/lib/constants';
import { pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * Sign in and register, from one component.
 *
 * The two differ by two fields, so two implementations would be two places for
 * the phone validation to drift. Validation is real and runs client-side exactly
 * as it would in production — an 11-digit number starting 01, and a business name
 * that is not blank — because a form that accepts anything teaches the buyer
 * nothing until the server rejects it.
 *
 * There is no password. A Bangladeshi wholesale buyer has a phone; an OTP is
 * fewer things to lose than a password, and it is the flow bKash and Nagad have
 * already taught them.
 */
export function AuthForm({ lang, mode }: { lang: Lang; mode: 'sign-in' | 'register' }) {
  const [phone, setPhone] = useState('');
  const [business, setBusiness] = useState('');
  const [districtId, setDistrictId] = useState(DISTRICTS[0].id);
  const [errors, setErrors] = useState<{ phone?: string; business?: string }>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'blocked'>('idle');
  const formId = useId();

  const isRegister = mode === 'register';

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const next: typeof errors = {};
    if (!/^01\d{9}$/.test(phone.replace(/[\s-]/g, ''))) {
      next.phone = t(lang, 'auth.invalidPhone');
    }
    if (isRegister && business.trim().length < 2) {
      next.business = t(lang, 'auth.invalidBusiness');
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('sending');
    await new Promise((resolve) => setTimeout(resolve, 550));
    // No identity service and no SMS gateway, so there is no code to send. The
    // form says exactly that rather than showing an OTP box that can never be
    // satisfied.
    setStatus('blocked');
  }

  return (
    <form onSubmit={onSubmit} className="max-w-[26rem] space-y-4">
      {isRegister && (
        <Field
          label={t(lang, 'auth.business')}
          htmlFor={`${formId}-business`}
          error={errors.business}
        >
          <input
            id={`${formId}-business`}
            value={business}
            onChange={(event) => setBusiness(event.target.value)}
            autoComplete="organization"
            aria-invalid={errors.business ? true : undefined}
            className={inputClass(Boolean(errors.business))}
          />
        </Field>
      )}

      <Field
        label={t(lang, 'auth.phone')}
        hint={t(lang, 'auth.phoneHint')}
        htmlFor={`${formId}-phone`}
        error={errors.phone}
      >
        <input
          id={`${formId}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="01XXXXXXXXX"
          aria-invalid={errors.phone ? true : undefined}
          className={cx(inputClass(Boolean(errors.phone)), 'tnum')}
        />
      </Field>

      {isRegister && (
        <Field label={t(lang, 'auth.district')} htmlFor={`${formId}-district`}>
          <select
            id={`${formId}-district`}
            value={districtId}
            onChange={(event) => setDistrictId(event.target.value)}
            className={inputClass(false)}
          >
            {DISTRICTS.map((district) => (
              <option key={district.id} value={district.id}>
                {pick(district.name, lang)}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full gap-2"
        disabled={status === 'sending'}
      >
        {status === 'sending' && <Loader2 size={16} aria-hidden className="animate-spin" />}
        {isRegister ? t(lang, 'auth.createAccount') : t(lang, 'auth.continue')}
      </Button>

      {status === 'blocked' && (
        <p
          role="status"
          className="flex gap-2.5 rounded-lg border border-warning/40 bg-surface-2 p-3.5 text-[12.5px] leading-relaxed text-ink-dim"
        >
          <AlertTriangle size={15} aria-hidden className="mt-0.5 shrink-0 text-warning" />
          {t(lang, 'auth.stubNote')}
        </p>
      )}

      <p className="flex gap-2 text-[11.5px] leading-relaxed text-ink-faint">
        <ShieldCheck size={13} aria-hidden className="mt-0.5 shrink-0 text-accent-ink" />
        {t(lang, 'auth.noPasswordNote')}
      </p>
    </form>
  );
}

function inputClass(invalid: boolean): string {
  return cx(
    'h-11 w-full rounded-lg border bg-surface px-3 text-[14px] text-ink outline-none transition-colors placeholder:text-ink-faint',
    invalid ? 'border-danger focus-visible:border-danger' : 'border-line-bright focus-visible:border-accent',
  );
}

function Field({
  label,
  hint,
  htmlFor,
  error,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11.5px] font-semibold text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-[11.5px] text-ink-faint">{hint}</p>
      )}
    </div>
  );
}
