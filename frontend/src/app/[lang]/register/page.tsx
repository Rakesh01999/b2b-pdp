import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from 'lucide-react';

import { Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { AuthForm } from '@/features/account/auth-form';
import { isLocale, localeHref, t } from '@/lib/i18n';

/**
 * Register.
 *
 * Two fields and a district, because every extra field on this form costs
 * accounts and none of the rest is needed until an order is placed. A trade
 * licence is asked for when someone wants to *sell*, which is a different form
 * and a different page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return {
    title: t(lang, 'auth.registerTitle'),
    description: t(lang, 'auth.registerSub'),
    robots: { index: false, follow: true },
  };
}

export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'auth.registerTitle') },
  ];

  const perks = [
    t(lang, 'account.savedListings'),
    t(lang, 'account.quotations'),
    t(lang, 'chrome.myOrders'),
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />
      <PageHeader title={t(lang, 'auth.registerTitle')} intro={t(lang, 'auth.registerSub')} />

      <div className="grid gap-8 lg:grid-cols-[26rem_minmax(0,1fr)] lg:gap-12">
        <AuthForm lang={lang} mode="register" />

        <aside className="max-w-[34rem] rounded-xl border border-line bg-surface p-5">
          <h2 className="text-[14px] font-bold tracking-[-0.015em]">
            {t(lang, 'account.signedOutBody')}
          </h2>
          <ul className="mt-3.5 space-y-2 text-[13.5px] text-ink-dim">
            {perks.map((perk) => (
              <li key={perk} className="flex gap-2.5">
                <Check size={15} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                {perk}
              </li>
            ))}
          </ul>

          <p className="mt-5 border-t border-line pt-4 text-[13px] text-ink-dim">
            {t(lang, 'auth.sellerInstead')}{' '}
            <Link
              href={localeHref(lang, '/sell')}
              className="font-semibold text-accent-ink transition-colors hover:text-accent"
            >
              {t(lang, 'chrome.sellOnArcB2B')}
            </Link>
          </p>
          <p className="mt-2 text-[13px] text-ink-dim">
            {t(lang, 'auth.haveAccount')}{' '}
            <Link
              href={localeHref(lang, '/sign-in')}
              className="font-semibold text-accent-ink transition-colors hover:text-accent"
            >
              {t(lang, 'auth.signInTitle')}
            </Link>
          </p>
        </aside>
      </div>
    </Container>
  );
}
