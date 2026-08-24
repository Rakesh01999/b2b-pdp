import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BellRing,
  FileText,
  PackageCheck,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';

import { Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { NOTIFICATIONS, type NotificationKind } from '@/data/account';
import { isLocale, localeHref, pick, t } from '@/lib/i18n';
import { dateShort, num } from '@/lib/format';
import { cx } from '@/components/ui/cx';

/**
 * The notification feed.
 *
 * Five kinds, each of which is an event a shop owner would want interrupted for:
 * a quote arrived, stock landed, a ladder changed, escrow moved, a dispute
 * progressed. Nothing marketing-shaped is in this list, and that omission is the
 * design decision — a feed that carries promotions is a feed that gets muted,
 * and then the dispute notice goes unread too.
 *
 * Every row is a link. A notification you cannot act on is a nag.
 */
const ICONS: Record<NotificationKind, React.ReactNode> = {
  quote: <FileText size={16} aria-hidden />,
  order: <PackageCheck size={16} aria-hidden />,
  stock: <PackageCheck size={16} aria-hidden />,
  dispute: <ShieldAlert size={16} aria-hidden />,
  price: <TrendingDown size={16} aria-hidden />,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { title: t(lang, 'notif.title'), robots: { index: false, follow: false } };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const unread = NOTIFICATIONS.filter((entry) => !entry.read).length;

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    { name: t(lang, 'notif.title') },
  ];

  return (
    <Container className="pb-16">
      <Breadcrumb items={crumbs} lang={lang} />

      <PageHeader
        title={t(lang, 'notif.title')}
        meta={
          unread > 0 ? (
            <span className="tnum">
              {num(unread)} {t(lang, 'notif.unread')}
            </span>
          ) : undefined
        }
      />

      {NOTIFICATIONS.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-bright bg-surface p-8 text-center text-ink-dim">
          {t(lang, 'notif.empty')}
        </p>
      ) : (
        <ul className="max-w-[80ch] space-y-2">
          {NOTIFICATIONS.map((entry) => (
            <li key={entry.id}>
              <Link
                href={localeHref(lang, entry.href)}
                className={cx(
                  'group flex gap-3 rounded-xl border p-4 transition-colors',
                  entry.read
                    ? 'border-line bg-surface hover:border-accent/50'
                    : 'border-accent/40 bg-accent-soft/40 hover:border-accent',
                )}
              >
                <span
                  className={cx(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                    entry.read ? 'bg-surface-2 text-ink-faint' : 'bg-accent-soft text-accent-ink',
                  )}
                >
                  {ICONS[entry.kind]}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span
                      className={cx(
                        'text-[14px] leading-snug tracking-[-0.012em] transition-colors group-hover:text-accent-ink',
                        entry.read ? 'font-semibold' : 'font-bold',
                      )}
                    >
                      {pick(entry.title, lang)}
                    </span>
                    <span className="tnum shrink-0 text-[11.5px] text-ink-faint">
                      {dateShort(entry.at, lang)}
                    </span>
                  </span>
                  <span className="zone-evidence mt-1 block text-ink-dim">
                    {pick(entry.body, lang)}
                  </span>
                </span>

                <ArrowRight
                  size={15}
                  aria-hidden
                  className="mt-1 shrink-0 self-start text-ink-faint transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 flex max-w-[70ch] gap-2.5 rounded-xl border border-line bg-surface-2 p-4 text-[13px] leading-relaxed text-ink-dim">
        <BellRing size={16} aria-hidden className="mt-0.5 shrink-0 text-accent-ink" />
        {t(lang, 'notif.settingsNote')}
      </p>
    </Container>
  );
}
