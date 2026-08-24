import Link from 'next/link';
import { CreditCard, RotateCcw, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { Logo } from './logo';
import { LanguageSwitch, ThemeToggle } from './controls';
import { NAV_CATEGORIES } from '@/lib/catalog';
import { DISPUTE_WINDOW_DAYS } from '@/lib/constants';
import { localeHref, pick, t, type Locale } from '@/lib/i18n';
import type { Bilingual } from '@/lib/types';

/**
 * Five link columns, not thirteen.
 *
 * A thirteen-section footer is a sitemap, not navigation — it is what happens
 * when nobody decides. Two deliberate inclusions: the install prompt lives here
 * as a persistent affordance rather than an interstitial, and the trade licence
 * number sits in the legal bar, because for a marketplace that asks for advance
 * payment a visible registration number is a real trust signal.
 */

const SERVICE_STRIP: Array<{ icon: React.ReactNode; title: Bilingual; sub: Bilingual }> = [
  {
    icon: <ShieldCheck size={18} aria-hidden />,
    title: { en: 'Escrow protected', bn: 'এসক্রো সুরক্ষিত' },
    sub: { en: 'Released on delivery confirmation', bn: 'ডেলিভারি নিশ্চিত হলে পেমেন্ট' },
  },
  {
    icon: <Truck size={18} aria-hidden />,
    title: { en: 'Nationwide courier', bn: 'সারা দেশে কুরিয়ার' },
    sub: { en: 'Pathao · Steadfast · RedX · eCourier', bn: 'পাঠাও · স্টেডফাস্ট · রেডএক্স · ইকুরিয়ার' },
  },
  {
    icon: <CreditCard size={18} aria-hidden />,
    title: { en: 'Pay your way', bn: 'সহজ পেমেন্ট' },
    sub: { en: 'bKash · Nagad · Rocket · bank transfer', bn: 'বিকাশ · নগদ · রকেট · ব্যাংক' },
  },
  {
    icon: <RotateCcw size={18} aria-hidden />,
    title: { en: `${DISPUTE_WINDOW_DAYS}-day dispute window`, bn: `${DISPUTE_WINDOW_DAYS} দিনের ডিসপিউট` },
    sub: { en: 'Photo-evidence returns', bn: 'ছবি-প্রমাণে রিটার্ন' },
  },
];

const COLUMNS: Array<{ heading: 'footer.buying' | 'footer.selling' | 'footer.support' | 'footer.company'; links: Array<[Bilingual, string]> }> = [
  {
    heading: 'footer.buying',
    links: [
      [{ en: 'How to buy wholesale', bn: 'পাইকারি কেনার নিয়ম' }, '/how-it-works'],
      [{ en: 'Request a quote', bn: 'কোটেশন চান' }, '/rfq/new'],
      [{ en: 'Bulk & volume ordering', bn: 'বাল্ক অর্ডার' }, '/help/bulk'],
      [{ en: 'Escrow & payment', bn: 'এসক্রো ও পেমেন্ট' }, '/help/payment'],
      [{ en: 'Shipping & couriers', bn: 'শিপিং ও কুরিয়ার' }, '/help/shipping'],
    ],
  },
  {
    heading: 'footer.selling',
    links: [
      [{ en: 'Sell on ArcB2B', bn: 'ArcB2B-এ বিক্রি' }, '/sell'],
      [{ en: 'Supplier verification', bn: 'সরবরাহকারী যাচাই' }, '/sell/verification'],
      [{ en: 'Seller fees', bn: 'সেলার ফি' }, '/sell/fees'],
      [{ en: 'Seller handbook', bn: 'সেলার হ্যান্ডবুক' }, '/sell/handbook'],
    ],
  },
  {
    heading: 'footer.support',
    links: [
      [{ en: 'Help centre', bn: 'হেল্প সেন্টার' }, '/help'],
      [{ en: 'Track an order', bn: 'অর্ডার ট্র্যাক' }, '/account/orders'],
      [{ en: 'Returns & disputes', bn: 'রিটার্ন ও ডিসপিউট' }, '/help/disputes'],
      [{ en: 'Report a listing', bn: 'লিস্টিং রিপোর্ট' }, '/help/report'],
    ],
  },
  {
    heading: 'footer.company',
    links: [
      [{ en: 'About ArcB2B', bn: 'ArcB2B সম্পর্কে' }, '/about'],
      [{ en: 'Careers', bn: 'কর্মসংস্থান' }, '/careers'],
      [{ en: 'Terms of service', bn: 'সেবার শর্তাবলী' }, '/legal/terms'],
      [{ en: 'Privacy policy', bn: 'গোপনীয়তা নীতি' }, '/legal/privacy'],
      [{ en: 'Refund policy', bn: 'রিফান্ড নীতি' }, '/legal/refunds'],
    ],
  },
];

export function Footer({ lang }: { lang: Locale }) {
  return (
    <footer className="mt-10 border-t border-line bg-surface">
      <div className="border-b border-line">
        <div className="shell grid grid-cols-2 gap-5 py-7 lg:grid-cols-4 2xl:grid-cols-4">
          {SERVICE_STRIP.map((item) => (
            <div key={item.title.en} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
                {item.icon}
              </span>
              <div className="min-w-0">
                <b className="block text-[13px] font-bold leading-tight">{pick(item.title, lang)}</b>
                <span className="text-[12px] leading-snug text-ink-dim">{pick(item.sub, lang)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="shell grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2">
          <Logo lang={lang} />
          <p className="mt-3.5 max-w-[34ch] text-[13.5px] leading-relaxed text-ink-dim">
            {t(lang, 'brand.tagline')}
            {lang === 'bn'
              ? ' — টাকায় মূল্য, এসক্রো পেমেন্ট ও সারা দেশে কুরিয়ার ডেলিভারি।'
              : ' — priced in Taka, escrow-protected, delivered by courier nationwide.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {['bKash', 'Nagad', 'Rocket', 'Bank'].map((method) => (
              <span
                key={method}
                className="rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] font-bold text-ink-dim"
              >
                {method}
              </span>
            ))}
          </div>

          <Link
            href={localeHref(lang, '/install')}
            className="mt-5 inline-flex items-center gap-2.5 rounded-[10px] border border-line-bright px-3.5 py-2.5 transition-colors hover:border-accent"
          >
            <Smartphone size={17} className="text-accent-ink" aria-hidden />
            <span>
              <b className="block text-[13px] font-bold leading-tight">{t(lang, 'footer.installApp')}</b>
              <span className="text-[11.5px] text-ink-dim">{t(lang, 'footer.installAppSub')}</span>
            </span>
          </Link>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={t(lang, column.heading)}>
            <h2 className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
              {t(lang, column.heading)}
            </h2>
            <ul className="space-y-0.5">
              {column.links.map(([label, href]) => (
                <li key={label.en}>
                  <Link
                    href={localeHref(lang, href)}
                    className="block py-1 text-[13px] text-ink-dim transition-colors hover:text-accent-ink"
                  >
                    {pick(label, lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <h2 className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
            {t(lang, 'footer.popularCategories')}
          </h2>
          <ul className="flex flex-wrap gap-x-3 gap-y-0.5 lg:block lg:space-y-0.5">
            {NAV_CATEGORIES.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link
                  href={localeHref(lang, `/category/${category.slug}`)}
                  className="block py-1 text-[13px] text-ink-dim transition-colors hover:text-accent-ink"
                >
                  {pick(category.name, lang)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-4 text-[12px] text-ink-faint">
          <span>
            © 2026 ArcB2B · {t(lang, 'footer.rights')} · {t(lang, 'footer.tradeLicence')} TRAD/DNCC/041882/2023
          </span>
          <span className="flex items-center gap-3 md:hidden">
            <LanguageSwitch lang={lang} />
            <ThemeToggle lang={lang} />
          </span>
        </div>
      </div>
    </footer>
  );
}
