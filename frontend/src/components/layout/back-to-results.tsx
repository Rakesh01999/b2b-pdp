'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { localeHref, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The return path to a filtered result set.
 *
 * The origin travels in the URL (`?from=search&q=earbuds`) rather than being read
 * from `document.referrer`, so a shared link behaves predictably and the link is
 * correct even when the referrer is stripped.
 *
 * This is a client component purely so the page above it can stay statically
 * generated: reading `searchParams` on the server would opt the whole product
 * page into dynamic rendering, and that is far too high a price for one link.
 */
export function BackToResults({ lang }: { lang: Lang }) {
  const params = useSearchParams();
  const from = params.get('from');
  if (from !== 'search' && from !== 'category') return null;

  const query = params.get('q');
  const category = params.get('category');

  const href =
    from === 'category' && category
      ? `/category/${category}`
      : `/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;

  return (
    <Link
      href={localeHref(lang, href)}
      className="hidden shrink-0 items-center gap-1 font-semibold text-ink-dim transition-colors hover:text-accent-ink sm:inline-flex"
    >
      <ChevronLeft size={13} aria-hidden />
      {t(lang, 'chrome.backToResults')}
    </Link>
  );
}
