import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Geist, Geist_Mono, Anek_Bangla } from 'next/font/google';
import '../globals.css';

import { AppProviders } from '@/features/app/providers';
import { Header } from '@/features/chrome/header';
import { Footer } from '@/features/chrome/footer';
import { MobileTabBar } from '@/features/chrome/mobile-tab-bar';
import { ThemeScript } from '@/features/chrome/controls';
import { HREFLANG, LOCALES, isLocale, t } from '@/lib/i18n';

/**
 * Root layout, nested under the `[lang]` segment.
 *
 * Putting the root here is what makes the locale a route rather than client
 * state: both languages prerender, `<html lang>` is correct per page, and the
 * product page ships no translation code. `generateStaticParams` below means
 * Next builds `/en/...` and `/bn/...` as static output.
 */

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

/**
 * Bengali only. The font stack reaches this family per codepoint, for the
 * characters Geist lacks — so loading its Latin would only add weight for
 * glyphs that are never used from it.
 */
const anekBangla = Anek_Bangla({
  variable: '--font-anek-bangla',
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09100f' },
  ],
  // Zoom is never disabled: the page has to stay usable at 200%, which is both
  // an accessibility requirement and how a lot of buyers read spec tables.
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  return {
    metadataBase: new URL('https://arcb2b.com'),
    title: {
      default: 'ArcB2B — wholesale sourcing marketplace for Bangladesh',
      template: '%s | ArcB2B',
    },
    description: t(lang, 'brand.tagline'),
    applicationName: 'ArcB2B',
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
      apple: [{ url: '/icons/icon-192.png', sizes: '192x192' }],
    },
    openGraph: {
      siteName: 'ArcB2B',
      locale: HREFLANG[lang],
      type: 'website',
    },
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    // `data-scroll-behavior="smooth"` asks Next to keep overriding smooth
    // scrolling during route transitions. Without it (the Next 16 default) a
    // navigation animates its way to the top instead of arriving there.
    <html
      lang={HREFLANG[lang]}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${anekBangla.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <a href="#product-main" className="sr-only-focusable">
          {t(lang, 'chrome.skipToContent')}
        </a>

        <AppProviders>
          <Header lang={lang} />
          <main>{children}</main>
          <Footer lang={lang} />
          <MobileTabBar lang={lang} />
        </AppProviders>
      </body>
    </html>
  );
}
