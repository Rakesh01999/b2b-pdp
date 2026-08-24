import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES } from '@/lib/i18n';

/**
 * Locale routing.
 *
 * Every page lives under `/[lang]`, so an unprefixed request has to be sent
 * somewhere. The buyer's own `Accept-Language` decides which — a Dhaka shop
 * owner whose phone is set to Bangla should land on the Bangla page without
 * having to find a switch — and the choice is a redirect rather than a rewrite
 * so the URL that ends up in the address bar, and in anyone's bookmarks, is the
 * canonical localised one.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

function preferredLocale(request: NextRequest): string {
  const header = request.headers.get('accept-language');
  if (!header) return DEFAULT_LOCALE;

  // Parse `bn-BD,bn;q=0.9,en;q=0.8` into a q-ordered list of base languages.
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.toLowerCase(), q: q ? Number.parseFloat(q.split('=')[1]) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if ((LOCALES as readonly string[]).includes(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export const config = {
  // Everything except Next internals, the generated media, and the files that
  // must stay at the domain root to be found (manifest, icons, robots).
  matcher: ['/((?!_next|media|icons|manifest.webmanifest|robots.txt|sitemap.xml|favicon.ico).*)'],
};
