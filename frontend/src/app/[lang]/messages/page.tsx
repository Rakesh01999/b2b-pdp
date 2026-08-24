import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Package, Store } from 'lucide-react';

import { Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { MessageComposer } from '@/features/account/message-composer';
import {
  MESSAGE_THREADS,
  findThreadByProduct,
  findThreadBySeller,
  type MessageThread,
} from '@/data/account';
import { PRODUCTS } from '@/data/catalog';
import { isLocale, localeHref, pick, t } from '@/lib/i18n';
import { dateShort } from '@/lib/format';
import { cx } from '@/components/ui/cx';

/**
 * Messages.
 *
 * Reached from three places with three different intents: the tab bar (show me
 * my conversations), a product page (`?product=`) and a seller block
 * (`?seller=`). All three land here, and the last two open the relevant thread
 * rather than a list — because a buyer who tapped "message seller" on a listing
 * has already told us which conversation they wanted.
 *
 * The thread list and the transcript are server-rendered; only the composer is
 * an island.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: t(lang, 'messages.title'), robots: { index: false, follow: false } };
}

export default async function MessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ thread?: string; seller?: string; product?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const { thread: threadParam, seller, product } = await searchParams;

  // Resolution order: an explicit thread, then the seller or listing the buyer
  // arrived from, then the most recent conversation.
  const active: MessageThread | null =
    (threadParam ? MESSAGE_THREADS.find((entry) => entry.id === threadParam) : null) ??
    (seller ? findThreadBySeller(seller) : null) ??
    (product ? findThreadByProduct(product) : null) ??
    MESSAGE_THREADS[0] ??
    null;

  // The listing named in the query has no thread yet — the composer opens as a
  // new conversation about that product rather than silently ignoring it.
  const orphanProduct =
    product && !findThreadByProduct(product)
      ? PRODUCTS.find((entry) => entry.slug === product)
      : undefined;

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'messages.title') },
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />
      <PageHeader title={t(lang, 'messages.title')} />

      {MESSAGE_THREADS.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center text-ink-dim">
          {t(lang, 'messages.empty')}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-6 2xl:grid-cols-[22rem_minmax(0,1fr)]">
          <nav aria-label={t(lang, 'messages.threads')}>
            <h2 className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint">
              {t(lang, 'messages.threads')}
            </h2>
            <ul className="space-y-2">
              {MESSAGE_THREADS.map((entry) => {
                const isActive = entry.id === active?.id;
                const last = entry.messages[entry.messages.length - 1];
                return (
                  <li key={entry.id}>
                    <Link
                      href={localeHref(lang, `/messages?thread=${entry.id}`)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cx(
                        'block rounded-xl border p-3.5 transition-colors',
                        isActive
                          ? 'border-accent bg-accent-soft'
                          : 'border-line bg-surface hover:border-accent/50',
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-[13px] font-bold">
                        <Store size={13} aria-hidden className="shrink-0 text-ink-faint" />
                        {entry.sellerName}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-[12.5px] leading-relaxed text-ink-dim">
                        {pick(entry.subject, lang)}
                      </span>
                      <span className="tnum mt-1.5 block text-[11.5px] text-ink-faint">
                        {dateShort(last.at, lang)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {active && (
            <section
              aria-labelledby="thread-heading"
              className="min-w-0 rounded-xl border border-line bg-surface p-4 sm:p-5"
            >
              <header className="border-b border-line pb-3.5">
                <h2 id="thread-heading" className="text-[15.5px] font-bold tracking-[-0.015em]">
                  {orphanProduct
                    ? `${t(lang, 'messages.newAbout')} ${pick(orphanProduct.title, lang)}`
                    : pick(active.subject, lang)}
                </h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-dim">
                  <Link
                    href={localeHref(lang, active.storeHref)}
                    className="inline-flex items-center gap-1.5 font-semibold text-accent-ink transition-colors hover:text-accent"
                  >
                    <Store size={13} aria-hidden />
                    {active.sellerName}
                  </Link>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={13} aria-hidden />
                    {t(lang, 'messages.responseTypical')} {pick(active.respondsWithin, lang)}
                  </span>
                  {active.productSlug && !orphanProduct && (
                    <Link
                      href={localeHref(lang, `/product/${active.productSlug}`)}
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-accent-ink"
                    >
                      <Package size={13} aria-hidden />
                      {t(lang, 'cart.viewListing')}
                    </Link>
                  )}
                </p>
              </header>

              <ol className="space-y-3 py-4">
                {active.messages.map((message, index) => (
                  <li
                    key={index}
                    className={cx('flex', message.from === 'buyer' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cx(
                        'max-w-[46ch] rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                        message.from === 'buyer'
                          ? 'bg-accent text-on-fill'
                          : 'border border-line bg-surface-2 text-ink-dim',
                      )}
                    >
                      {pick(message.body, lang)}
                      <span
                        className={cx(
                          'tnum mt-1.5 block text-[11px]',
                          message.from === 'buyer' ? 'text-on-fill/70' : 'text-ink-faint',
                        )}
                      >
                        {dateShort(message.at, lang)}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>

              <MessageComposer lang={lang} threadId={active.id} />
            </section>
          )}
        </div>
      )}
    </Container>
  );
}
