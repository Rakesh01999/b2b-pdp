'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, ButtonLink, Container } from '@/components/ui/primitives';
import { DEFAULT_LOCALE, isLocale, localeHref, t } from '@/lib/i18n';

/**
 * Segment-level error boundary.
 *
 * `reset()` re-renders this segment rather than reloading the document, so the
 * chrome, the cart and any preserved client state survive a transient failure.
 * The copy says what happened and, importantly, that nothing the buyer entered
 * was lost — which is the first thing they will worry about after filling in a
 * mix grid.
 */
export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname() ?? '';
  const segment = pathname.split('/')[1] ?? '';
  const lang = isLocale(segment) ? segment : DEFAULT_LOCALE;

  useEffect(() => {
    // Where a real error reporter would be called. Logging the digest rather
    // than the message keeps server-side detail out of the browser console.
    console.error('Product page error', error.digest ?? error.message);
  }, [error]);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-[52ch] text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-warning-soft text-warning">
          <TriangleAlert size={22} aria-hidden />
        </span>
        <h1 className="mt-4 text-balance text-[22px] font-bold leading-tight tracking-[-0.02em]">
          {t(lang, 'state.errorTitle')}
        </h1>
        <p className="zone-evidence mt-2.5 text-ink-dim">{t(lang, 'state.errorBody')}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="primary" size="md" onClick={reset} className="gap-1.5">
            <RefreshCw size={15} aria-hidden />
            {t(lang, 'state.tryAgain')}
          </Button>
          <ButtonLink href={localeHref(lang, '/search')} variant="secondary" size="md">
            {t(lang, 'state.searchProducts')}
          </ButtonLink>
        </div>

        {error.digest && (
          <p className="tnum mt-6 text-[11.5px] text-ink-faint">Reference: {error.digest}</p>
        )}
      </div>
    </Container>
  );
}
