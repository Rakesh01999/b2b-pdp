import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, FileCheck2, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';

import { Badge, ButtonLink, Container, SectionHeading } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { BreadcrumbJsonLd } from '@/components/seo/structured-data';
import { SellerMetricsGrid } from '@/features/product/components/seller-block';
import { ProductCardTile } from '@/features/product/components/product-card';
import { allSellerSlugs, getSeller, getSellerCards } from '@/lib/catalog';
import { HREFLANG, LOCALES, isLocale, localeHref, pick, t } from '@/lib/i18n';
import { num } from '@/lib/format';
import { cx } from '@/components/ui/cx';

/**
 * A supplier storefront.
 *
 * The same identity and trust ledger the product page shows, given its own URL
 * so it can be linked, shared and — for a supplier — printed on a card. The
 * metrics grid is the component the product page uses, not a copy of it: two
 * implementations of the same four numbers is how the storefront ends up
 * publishing a figure the listing does not.
 */
const BASE = 'https://arcb2b.com';

export async function generateStaticParams() {
  return allSellerSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const seller = await getSeller(slug);
  if (!seller) {
    return { title: t(lang, 'state.notFoundTitle'), robots: { index: false, follow: true } };
  }

  const description =
    lang === 'bn'
      ? `${seller.name} — ${pick(seller.location, lang)}, ${seller.yearsActive} বছর সক্রিয়, ${num(seller.skuCount)} SKU। এসক্রো সুরক্ষিত পাইকারি সরবরাহ।`
      : `${seller.name} — ${pick(seller.location, lang)}, ${seller.yearsActive} years active, ${num(seller.skuCount)} SKUs listed. Escrow-protected wholesale supply.`;

  return {
    title: seller.name,
    description,
    alternates: {
      canonical: `${BASE}/${lang}/store/${slug}`,
      languages: Object.fromEntries(
        LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}/store/${slug}`]),
      ),
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const seller = await getSeller(slug);
  if (!seller) notFound();

  const cards = await getSellerCards(seller);
  const certifications = seller.certifications.filter((cert) => Boolean(cert.documentUrl));

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: seller.name },
  ];

  return (
    <Container className="pb-16">
      <BreadcrumbJsonLd items={crumbs} lang={lang} />
      <Breadcrumb items={crumbs} lang={lang} />

      <PageHeader
        eyebrow={
          seller.kind === 'platform' ? t(lang, 'store.platformStore') : t(lang, 'store.supplierStore')
        }
        title={seller.name}
        meta={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} aria-hidden />
              {pick(seller.location, lang)}
            </span>
            <span className="tnum">
              {t(lang, 'store.tradingSince')} {new Date().getFullYear() - seller.yearsActive}
            </span>
            <span className="tnum">
              {num(seller.skuCount)} {t(lang, 'store.skus')}
            </span>
          </span>
        }
        actions={
          <>
            <ButtonLink
              href={localeHref(lang, `/messages?seller=${seller.id}`)}
              variant="primary"
              size="md"
              className="gap-1.5"
            >
              <MessageCircle size={15} aria-hidden />
              {t(lang, 'cta.contactSeller')}
            </ButtonLink>
            <ButtonLink href={localeHref(lang, '/rfq/new')} variant="secondary" size="md">
              {t(lang, 'rfq.title')}
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section
          aria-labelledby="store-identity"
          className="rounded-xl border border-line bg-surface p-5"
        >
          <h2
            id="store-identity"
            className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint"
          >
            {t(lang, 'seller.soldBy')}
          </h2>

          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={cx(
                'grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[20px] font-bold text-on-fill',
                seller.kind === 'platform' ? 'bg-accent' : 'bg-info',
              )}
            >
              {seller.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15.5px] font-bold tracking-[-0.01em]">
                {seller.name}
                {seller.verified && (
                  <BadgeCheck
                    size={16}
                    className="shrink-0 text-info"
                    aria-label={t(lang, 'seller.verified')}
                  />
                )}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {seller.escrow && (
                  <Badge tone="success" icon={<ShieldCheck size={11} aria-hidden />}>
                    {t(lang, 'seller.escrowSeller')}
                  </Badge>
                )}
                <Badge tone="neutral">
                  <span className="tnum">{seller.yearsActive}</span> {t(lang, 'seller.years')}
                </Badge>
                <Badge tone="neutral">
                  <span className="tnum">{num(seller.skuCount)}</span> {t(lang, 'seller.skus')}
                </Badge>
              </div>
            </div>
          </div>

          {certifications.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
                {t(lang, 'seller.certifications')}
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {certifications.map((cert) => (
                  <li key={cert.code}>
                    <Link
                      href={cert.documentUrl!}
                      className="inline-flex items-center gap-1.5 rounded-full border border-info/25 bg-info-soft px-2.5 py-1 text-[11.5px] font-semibold text-info transition-colors hover:border-info/60"
                      title={t(lang, 'seller.viewDocument')}
                    >
                      <FileCheck2 size={12} aria-hidden />
                      {pick(cert.label, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-5 border-t border-line pt-4 text-[12.5px] leading-relaxed text-ink-faint">
            {seller.kind === 'platform'
              ? t(lang, 'store.platformStore')
              : t(lang, 'store.supplierStore')}{' '}
            —{' '}
            <Link
              href={localeHref(lang, '/sell/verification')}
              className="font-semibold text-accent-ink transition-colors hover:text-accent"
            >
              {t(lang, 'store.verificationLink')}
            </Link>
          </p>
        </section>

        <section
          aria-labelledby="store-metrics"
          className="rounded-xl border border-line bg-surface p-5"
        >
          <h2
            id="store-metrics"
            className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint"
          >
            {t(lang, 'store.performance')}
          </h2>
          <SellerMetricsGrid
            metrics={seller.metrics}
            lang={lang}
            className="grid grid-cols-2 gap-2.5 xl:grid-cols-4"
          />
          <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
            {t(lang, 'store.metricsFootnote')}
          </p>
        </section>
      </div>

      <section aria-labelledby="store-listings" className="pt-10">
        <SectionHeading
          id="store-listings"
          title={t(lang, 'store.listings')}
          action={
            cards.length > 0 ? (
              <span className="tnum text-[12px] text-ink-faint">
                {num(cards.length)} {t(lang, 'misc.of')} {num(seller.skuCount)}
              </span>
            ) : undefined
          }
        />

        {cards.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8">
            {cards.map((card) => (
              <li key={card.id}>
                <ProductCardTile card={card} lang={lang} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center">
            <p className="zone-evidence mx-auto max-w-[58ch] text-ink-dim">
              {t(lang, 'store.noListings')}
            </p>
            <ButtonLink
              href={localeHref(lang, `/messages?seller=${seller.id}`)}
              variant="primary"
              size="md"
              className="mt-4 gap-1.5"
            >
              <MessageCircle size={15} aria-hidden />
              {t(lang, 'cta.contactSeller')}
            </ButtonLink>
          </div>
        )}
      </section>
    </Container>
  );
}
