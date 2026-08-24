import Link from 'next/link';
import { ArrowRight, CreditCard, FileText, LayoutGrid, ShieldCheck, Truck } from 'lucide-react';
import { HeroSearch } from './hero-search';
import { Container } from '@/components/ui/primitives';
import {
  TOTAL_CATEGORY_COUNT,
  TOTAL_PRODUCT_COUNT,
  TOTAL_SUBCATEGORY_COUNT,
} from '@/data/categories';
import { TRENDING_TERMS } from '@/lib/catalog';
import { num } from '@/lib/format';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Bilingual, Lang } from '@/lib/types';

/**
 * The hero.
 *
 * A B2B marketplace hero has one job that a consumer hero does not: it has to
 * get a buyer who arrived with a specific part number into the catalogue in one
 * action, while also telling a first-time importer what the platform actually
 * does for them. So the left column is search-first with the value proposition
 * above it, and the right column answers the case search cannot serve — "it is
 * not listed" — with the sourcing request that is this platform's real product.
 *
 * No carousel. A rotating banner in a hero is a decision the buyer did not ask
 * to make, it moves the thing they were reading, and on a metered connection it
 * is several images downloaded to show one. The space goes to the search field
 * and to three figures that are true.
 *
 * Server-rendered apart from the search field itself, so the headline and the
 * trust row cost no JavaScript.
 */

const ASSURANCES: Array<{ icon: React.ReactNode; label: Bilingual }> = [
  {
    icon: <ShieldCheck size={15} aria-hidden />,
    label: { en: 'Escrow-protected payment', bn: 'এসক্রো-সুরক্ষিত পেমেন্ট' },
  },
  {
    icon: <Truck size={15} aria-hidden />,
    label: { en: 'Four couriers, quoted by district', bn: 'চার কুরিয়ার, জেলা অনুযায়ী দর' },
  },
  {
    icon: <CreditCard size={15} aria-hidden />,
    label: { en: 'bKash · Nagad · Rocket · bank', bn: 'বিকাশ · নগদ · রকেট · ব্যাংক' },
  },
];

export function Hero({ lang }: { lang: Lang }) {
  const stats: Array<{ value: string; label: string }> = [
    { value: num(TOTAL_CATEGORY_COUNT), label: t(lang, 'home.statCategories') },
    { value: num(TOTAL_SUBCATEGORY_COUNT), label: t(lang, 'home.statSubcategories') },
    { value: `${num(Math.round(TOTAL_PRODUCT_COUNT / 1000))}k+`, label: t(lang, 'home.statProducts') },
  ];

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-line bg-surface"
    >
      {/* One soft wash of the brand hue, tinting the panel rather than shouting
          over it — and a hairline grid that reads as graph paper, which is the
          register this product wants. Both are pure CSS: no image, no request. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_28rem_at_18%_-12%,var(--accent-soft),transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(48rem_24rem_at_20%_0%,#000,transparent_70%)]"
      />

      <Container className="relative py-8 sm:py-11 lg:py-14">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
          {/* Value proposition + search */}
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.07em] text-accent-ink">
              {t(lang, 'home.eyebrow')}
            </p>

            <h1
              id="hero-heading"
              className="mt-4 text-balance text-[28px] font-bold leading-[1.12] tracking-[-0.032em] sm:text-[38px] lg:text-[44px]"
            >
              {t(lang, 'home.headline')}
            </h1>

            <p className="zone-evidence mt-3.5 max-w-[58ch] text-ink-dim">{t(lang, 'home.sub')}</p>

            <div className="mt-6 max-w-[40rem]">
              <HeroSearch lang={lang} />
            </div>

            <div className="mt-3.5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-[12.5px]">
              <span className="font-semibold text-ink-dim">{t(lang, 'home.popular')}:</span>
              {TRENDING_TERMS.map((item) => (
                <Link
                  key={item.term.en}
                  href={localeHref(lang, item.href)}
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-ink-dim transition-colors hover:border-accent hover:text-accent-ink"
                >
                  {pick(item.term, lang)}
                </Link>
              ))}
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-[12.5px] font-medium text-ink-dim">
              {ASSURANCES.map((item) => (
                <li key={item.label.en} className="inline-flex items-center gap-2">
                  <span className="text-accent">{item.icon}</span>
                  {pick(item.label, lang)}
                </li>
              ))}
            </ul>
          </div>

          {/* The answer to "it is not listed" — the sourcing request. */}
          <aside className="min-w-0 rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-on-fill">
              <FileText size={19} aria-hidden />
            </span>

            <h2 className="mt-3.5 text-balance text-[18px] font-bold leading-snug tracking-[-0.02em]">
              {t(lang, 'home.rfqTitle')}
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">{t(lang, 'home.rfqBody')}</p>

            {/* Numbered because this genuinely is a sequence — the buyer does
                these in order, and the order is the reassurance. */}
            <ol className="mt-4 space-y-2.5">
              {[
                t(lang, 'home.rfqStep1'),
                t(lang, 'home.rfqStep2'),
                t(lang, 'home.rfqStep3'),
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-[13px]">
                  <span className="tnum mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-ink">
                    {index + 1}
                  </span>
                  <span className="text-ink-dim">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link
                href={localeHref(lang, '/rfq/new')}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] bg-accent px-4 text-[13.5px] font-semibold text-on-fill transition-colors hover:bg-accent-hi"
              >
                {t(lang, 'chrome.requestQuote')}
                <ArrowRight size={15} aria-hidden />
              </Link>
              <Link
                href={localeHref(lang, '/categories')}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-line-bright px-4 text-[13.5px] font-semibold text-ink transition-colors hover:border-accent hover:text-accent-ink"
              >
                <LayoutGrid size={15} aria-hidden />
                {t(lang, 'home.browseCategories')}
              </Link>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dd className="price text-[19px] font-bold leading-none">{stat.value}</dd>
                  <dt className="mt-1 text-[11.5px] leading-tight text-ink-faint">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </Container>
    </section>
  );
}
