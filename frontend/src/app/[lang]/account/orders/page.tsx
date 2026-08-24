import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Info, PackageSearch } from 'lucide-react';

import { ButtonLink, Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { isLocale, localeHref, t } from '@/lib/i18n';

/**
 * Order history.
 *
 * Genuinely empty, and it says why rather than showing invented orders. A
 * fabricated order history is the one fixture that could cause real harm here:
 * a buyer who believes they have an order in flight does not chase the one they
 * actually need to.
 *
 * The quotation thread is the honest place to see what a real record looks like,
 * so that is where this page points.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: t(lang, 'account.ordersTitle'), robots: { index: false, follow: false } };
}

export default async function OrdersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'account.title'), href: '/account' },
    { name: t(lang, 'account.ordersTitle') },
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />
      <PageHeader title={t(lang, 'account.ordersTitle')} />

      <div className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center sm:p-14">
        <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-ink-faint">
          <PackageSearch size={30} aria-hidden />
        </span>
        <p className="text-[16px] font-bold tracking-[-0.015em]">{t(lang, 'account.signedOut')}</p>
        <p className="zone-evidence mx-auto mt-2.5 max-w-[62ch] text-ink-dim">
          {t(lang, 'account.ordersEmpty')}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink
            href={localeHref(lang, '/account/rfq/RFQ-24817')}
            variant="primary"
            size="md"
          >
            {t(lang, 'account.viewRequest')}
          </ButtonLink>
          <ButtonLink href={localeHref(lang, '/sign-in')} variant="secondary" size="md">
            {t(lang, 'auth.signInTitle')}
          </ButtonLink>
        </div>
      </div>

      <p className="zone-evidence mt-6 flex max-w-[70ch] gap-2.5 rounded-xl border border-line bg-surface-2 p-4 text-[13.5px] leading-relaxed text-ink-dim">
        <Info size={16} aria-hidden className="mt-0.5 shrink-0 text-accent-ink" />
        {t(lang, 'help.trackHint')}
      </p>
    </Container>
  );
}
