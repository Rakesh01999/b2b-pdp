import type { Paisa, SellUnit, Bilingual, Lang } from './types';

/**
 * Formatters. All money arrives as an integer in paisa.
 *
 * Numerals stay Western (`৳500`, not `৳৫০০`) in both languages: Bangladeshi
 * commerce overwhelmingly writes prices in Western digits, and a reseller
 * scanning a tier ladder or a landed-cost column reads them faster. Only the
 * currency mark and the surrounding words localise. This is a deliberate
 * decision, flagged for confirmation in the design plan.
 */

const TAKA = '৳'; // ৳ — falls to Anek Bangla in the font stack

/**
 * `৳500` when the amount is whole, `৳487.20` when it is not. Per-unit landed
 * cost genuinely lands on fractions of a taka and rounding it away would
 * misstate the one number a reseller sets shelf price from.
 */
export function taka(paisa: Paisa, opts?: { decimals?: boolean }): string {
  const negative = paisa < 0;
  const abs = Math.abs(Math.round(paisa));
  const whole = Math.floor(abs / 100);
  const remainder = abs % 100;
  const forceDecimals = opts?.decimals === true;
  const hideDecimals = opts?.decimals === false;

  const body =
    (remainder === 0 && !forceDecimals) || hideDecimals
      ? whole.toLocaleString('en-US')
      : `${whole.toLocaleString('en-US')}.${String(remainder).padStart(2, '0')}`;

  return `${negative ? '-' : ''}${TAKA}${body}`;
}

/** Whole-taka only — for figures where paisa is noise (courier bands, totals). */
export function takaRound(paisa: Paisa): string {
  return taka(Math.round(paisa / 100) * 100, { decimals: false });
}

export function num(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

const UNIT_LABELS: Record<SellUnit, Bilingual> = {
  pc: { en: 'pc', bn: 'পিস' },
  dozen: { en: 'dozen', bn: 'ডজন' },
  carton: { en: 'carton', bn: 'কার্টন' },
  kg: { en: 'kg', bn: 'কেজি' },
  metre: { en: 'm', bn: 'মিটার' },
};

const UNIT_LABELS_PLURAL: Record<SellUnit, Bilingual> = {
  pc: { en: 'pcs', bn: 'পিস' },
  dozen: { en: 'dozens', bn: 'ডজন' },
  carton: { en: 'cartons', bn: 'কার্টন' },
  kg: { en: 'kg', bn: 'কেজি' },
  metre: { en: 'm', bn: 'মিটার' },
};

export function unitLabel(unit: SellUnit, lang: Lang, plural = false): string {
  const table = plural ? UNIT_LABELS_PLURAL : UNIT_LABELS;
  const entry = table[unit];
  return (lang === 'bn' ? entry.bn : entry.en) ?? entry.en;
}

/** `12 kg` / `840 g` — the figure a courier rate card is banded on. */
export function weight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg % 1 === 0 ? kg : kg.toFixed(1)} kg`;
  }
  return `${Math.round(grams)} g`;
}

export function pct(value: number): string {
  return `${Math.round(value)}%`;
}

/** Basis points to a readable percentage: 150 → `1.5%`. */
export function bpsToPct(bps: number): string {
  const value = bps / 100;
  return `${value % 1 === 0 ? value : value.toFixed(1)}%`;
}

export function dateShort(iso: string, lang: Lang = 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(lang === 'bn' ? 'en-GB' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** `2–3 days` / `next day`. Ranges are honest; single figures are promises. */
export function dayRange(min: number, max: number, lang: Lang = 'en'): string {
  if (lang === 'bn') {
    if (min === max) return `${min} দিন`;
    return `${min}–${max} দিন`;
  }
  if (min === max) return min === 1 ? '1 day' : `${min} days`;
  return `${min}–${max} days`;
}

/** Truncate on a word boundary, for breadcrumbs and card titles. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
