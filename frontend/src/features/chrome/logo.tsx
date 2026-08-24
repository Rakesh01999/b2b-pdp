import Link from 'next/link';
import { cx } from '@/components/ui/cx';
import { localeHref } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * The mark is an arc closing on a node — a sourcing route rather than an
 * abstract badge. It stays legible at 24px, which is the size it renders at
 * once the header condenses on scroll.
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="ArcB2B"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path
        d="M8 23c0-6.6 4.2-11 10-11"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="22.5" cy="12" r="3.1" fill="white" />
      <path d="M8 23h7" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function Logo({
  lang,
  compact = false,
  className,
}: {
  lang: Lang;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={localeHref(lang, '/')}
      className={cx('flex shrink-0 items-center gap-2.5', className)}
      aria-label="ArcB2B — home"
    >
      <LogoMark size={compact ? 26 : 30} />
      <span
        className={cx(
          'font-bold leading-none tracking-[-0.03em] transition-all',
          compact ? 'hidden text-[17px] sm:inline' : 'text-[19px]',
        )}
      >
        Arc<span className="text-accent-ink">B2B</span>
      </span>
    </Link>
  );
}
