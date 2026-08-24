import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

import { Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { RfqPageForm } from '@/features/rfq/rfq-page-form';
import { HREFLANG, LOCALES, isLocale, t } from '@/lib/i18n';

/**
 * Post a sourcing request.
 *
 * The one page on the site that exists because the catalogue will always be
 * incomplete. Bangladeshi wholesale runs on enquiry; this is that habit given a
 * structure, so the reply arrives as a comparable quote rather than as a
 * WhatsApp message with a number in it.
 */
const BASE = 'https://arcb2b.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  return {
    title: t(lang, 'rfq.title'),
    description: t(lang, 'rfqPage.sub'),
    alternates: {
      canonical: `${BASE}/${lang}/rfq/new`,
      languages: Object.fromEntries(
        LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}/rfq/new`]),
      ),
    },
  };
}

export default async function NewRfqPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'rfq.title') },
  ];

  const steps = [
    t(lang, 'rfqPage.step1'),
    t(lang, 'rfqPage.step2'),
    t(lang, 'rfqPage.step3'),
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />
      <PageHeader title={t(lang, 'rfq.title')} intro={t(lang, 'rfqPage.sub')} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          {/* The form reads its draft — and the optional ?cat= prefill — out of
              the browser on mount, so it is a client island. Reading the query
              on the server instead would have made this whole route render on
              demand, which is a poor trade for an optional preselected shelf.
              Wrapped in Suspense so the sidebar and heading stay static HTML. */}
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface-2" />}>
            <RfqPageForm lang={lang} />
          </Suspense>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:self-start">
          <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
            <h2 className="text-[14px] font-bold tracking-[-0.015em]">
              {t(lang, 'rfqPage.whatHappens')}
            </h2>
            <ol className="zone-evidence mt-3.5 space-y-3.5 text-[13px] leading-relaxed text-ink-dim">
              {steps.map((step, index) => (
                <li key={index} className="flex gap-2.5">
                  <span className="tnum grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent-ink">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <p className="mt-4 flex gap-2 border-t border-line pt-3.5 text-[12px] leading-relaxed text-ink-faint">
              <ShieldCheck size={14} aria-hidden className="mt-0.5 shrink-0 text-accent-ink" />
              {t(lang, 'rfq.privacy')}
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
