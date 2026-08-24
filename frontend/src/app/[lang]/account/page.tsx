import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, FileText, Package, UserRound } from 'lucide-react';

import { ButtonLink, Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { AccountLocalState } from '@/features/account/local-state';
import { RFQ_THREADS } from '@/data/account';
import { getCards } from '@/lib/catalog';
import { isLocale, localeHref, pick, t, tn } from '@/lib/i18n';
import { dateShort, num, taka } from '@/lib/format';

/**
 * Your account.
 *
 * Signed out, and honest about it. What this page has that a sign-in wall would
 * throw away is the buyer's real local state: their cart, their saved listings,
 * their recently viewed. Baymard's finding that 21% of buyers rely on saving to
 * compare is exactly why those survive without a session here.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: t(lang, 'account.title'), robots: { index: false, follow: false } };
}

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const cards = await getCards(20);
  const threads = Object.values(RFQ_THREADS);

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'account.title') },
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />

      <PageHeader
        title={t(lang, 'account.title')}
        actions={
          <>
            <ButtonLink href={localeHref(lang, '/sign-in')} variant="primary" size="md">
              {t(lang, 'auth.signInTitle')}
            </ButtonLink>
            <ButtonLink href={localeHref(lang, '/register')} variant="secondary" size="md">
              {t(lang, 'chrome.joinFree')}
            </ButtonLink>
          </>
        }
      />

      <div className="mb-9 flex gap-3 rounded-xl border border-line bg-surface-2 p-4 sm:p-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-ink-faint">
          <UserRound size={19} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-bold">{t(lang, 'account.signedOut')}</p>
          <p className="zone-evidence mt-1 max-w-[66ch] text-ink-dim">
            {t(lang, 'account.signedOutBody')}
          </p>
        </div>
      </div>

      {/* Navigation to the two account sections that are server-rendered. */}
      <ul className="mb-10 grid gap-3 sm:grid-cols-2">
        <li>
          <NavCard
            href={localeHref(lang, '/account/orders')}
            icon={<Package size={17} aria-hidden />}
            title={t(lang, 'account.ordersTitle')}
            sub={t(lang, 'chrome.myOrders')}
          />
        </li>
        <li>
          <NavCard
            href={localeHref(lang, '/rfq/new')}
            icon={<FileText size={17} aria-hidden />}
            title={t(lang, 'rfq.title')}
            sub={t(lang, 'rfqPage.sub')}
          />
        </li>
      </ul>

      <section aria-labelledby="quotations-heading" className="mb-10">
        <h2 id="quotations-heading" className="mb-3 text-[15px] font-bold tracking-[-0.015em]">
          {t(lang, 'account.quotations')}
        </h2>
        <ul className="space-y-2.5">
          {threads.map((thread) => (
            <li key={thread.id}>
              <Link
                href={localeHref(lang, `/account/rfq/${thread.id}`)}
                className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/50"
              >
                <span className="min-w-0">
                  <span className="tnum block text-[11.5px] font-bold uppercase tracking-[0.06em] text-ink-faint">
                    {thread.id} · {dateShort(thread.createdAt, lang)}
                  </span>
                  <span className="mt-1 block text-[14px] font-bold leading-snug tracking-[-0.012em] transition-colors group-hover:text-accent-ink">
                    {pick(thread.item, lang)}
                  </span>
                  <span className="tnum mt-1 block text-[12.5px] text-ink-dim">
                    {num(thread.quantity)} {t(lang, 'misc.units')} · {t(lang, 'rfq.targetPrice')}{' '}
                    {taka(thread.targetPrice)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tnum rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-bold text-accent-ink">
                    {thread.quotes.length}{' '}
                    {tn(lang, thread.quotes.length, 'rfqThread.quoteReceived', 'rfqThread.quotesReceived')}
                  </span>
                  <ArrowRight
                    size={15}
                    aria-hidden
                    className="text-ink-faint transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AccountLocalState lang={lang} cards={cards} />
    </Container>
  );
}

function NavCard({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full items-start gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-ink">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[14px] font-bold leading-snug tracking-[-0.012em] transition-colors group-hover:text-accent-ink">
          {title}
          <ArrowRight
            size={14}
            aria-hidden
            className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
          />
        </span>
        <span className="mt-1 line-clamp-2 block text-[12.5px] leading-relaxed text-ink-faint">
          {sub}
        </span>
      </span>
    </Link>
  );
}
