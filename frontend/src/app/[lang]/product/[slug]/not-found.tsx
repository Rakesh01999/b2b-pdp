'use client';

import { usePathname } from 'next/navigation';
import { PackageX, Search } from 'lucide-react';
import { ButtonLink, Container, SectionHeading } from '@/components/ui/primitives';
import { ProductRail } from '@/features/product/components/product-card';
import { ALL_CARDS } from '@/data/catalog';
import { DEFAULT_LOCALE, isLocale, localeHref, t } from '@/lib/i18n';

/**
 * Dead listing.
 *
 * A dead end here is a lost buyer, so this is a recovery page rather than an
 * apology: search, the category the listing belonged to, and six live
 * alternatives. A delisted SKU is one of the most common ways someone arrives on
 * a marketplace from an old link or a shared message, and sending them to a bare
 * "404" wastes a visitor who was ready to buy.
 *
 * A client component because `not-found.tsx` receives no `params` — the locale is
 * recovered from the path so the copy is still in the buyer's language.
 */
export default function ProductNotFound() {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/')[1] ?? '';
  const lang = isLocale(segment) ? segment : DEFAULT_LOCALE;

  const alternatives = ALL_CARDS.slice(0, 6);

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-[54ch] text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-3 text-ink-faint">
          <PackageX size={22} aria-hidden />
        </span>
        <h1 className="mt-4 text-balance text-[24px] font-bold leading-tight tracking-[-0.025em]">
          {t(lang, 'state.notFoundTitle')}
        </h1>
        <p className="zone-evidence mt-2.5 text-ink-dim">{t(lang, 'state.notFoundBody')}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink href={localeHref(lang, '/search')} variant="primary" size="md" className="gap-1.5">
            <Search size={15} aria-hidden />
            {t(lang, 'state.searchProducts')}
          </ButtonLink>
          <ButtonLink href={localeHref(lang, '/categories')} variant="secondary" size="md">
            {t(lang, 'chrome.allCategories')}
          </ButtonLink>
          <ButtonLink href={localeHref(lang, '/rfq/new')} variant="secondary" size="md">
            {t(lang, 'chrome.requestQuote')}
          </ButtonLink>
        </div>
      </div>

      <section aria-labelledby="alternatives-heading" className="pt-12">
        <SectionHeading id="alternatives-heading" title={t(lang, 'rail.similar')} />
        <ProductRail cards={alternatives} lang={lang} />
      </section>
    </Container>
  );
}
