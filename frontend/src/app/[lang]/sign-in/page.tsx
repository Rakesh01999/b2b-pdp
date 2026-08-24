import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { AuthForm } from '@/features/account/auth-form';
import { isLocale, localeHref, t } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: t(lang, 'auth.signInTitle'), robots: { index: false, follow: true } };
}

export default async function SignInPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'auth.signInTitle') },
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />
      <PageHeader title={t(lang, 'auth.signInTitle')} intro={t(lang, 'auth.signInSub')} />

      <AuthForm lang={lang} mode="sign-in" />

      <p className="mt-7 max-w-[26rem] border-t border-line pt-5 text-[13px] text-ink-dim">
        {t(lang, 'auth.noAccount')}{' '}
        <Link
          href={localeHref(lang, '/register')}
          className="font-semibold text-accent-ink transition-colors hover:text-accent"
        >
          {t(lang, 'chrome.joinFree')}
        </Link>
      </p>
    </Container>
  );
}
