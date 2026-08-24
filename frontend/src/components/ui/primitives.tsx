import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { cx } from './cx';

/**
 * Presentational primitives. Deliberately free of hooks so they render in
 * Server Components — the interactive parts of the page import these from
 * inside their own client islands rather than the other way round, which is
 * what keeps the price and the specifications out of the JS bundle.
 */

/* ----------------------------------------------------------------- surfaces */

export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx('mx-auto w-full max-w-[1320px] px-4 sm:px-6', className)}>{children}</div>;
}

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'aside' | 'article';
}) {
  return (
    <Tag className={cx('rounded-xl border border-line bg-surface', className)}>{children}</Tag>
  );
}

/* ------------------------------------------------------------------ buttons */

export type ButtonVariant = 'primary' | 'secondary' | 'outline-accent' | 'ghost' | 'destructive';
export type ButtonSize = 'lg' | 'md' | 'sm';

const VARIANT: Record<ButtonVariant, string> = {
  // Orange is a FILL here, never text — white on accent clears AA at this
  // weight and size, orange text on white does not.
  primary:
    'bg-accent text-on-fill shadow-xs hover:bg-accent-hi active:translate-y-px disabled:bg-accent/40 disabled:text-on-fill/70',
  secondary:
    'border border-line-bright bg-surface text-ink hover:border-accent hover:text-accent-ink disabled:opacity-40',
  'outline-accent':
    'border border-accent bg-transparent text-accent-ink hover:bg-accent-soft disabled:opacity-40',
  ghost: 'bg-transparent text-ink-dim hover:bg-surface-2 hover:text-ink disabled:opacity-40',
  destructive: 'bg-danger text-on-fill hover:opacity-90 disabled:opacity-40',
};

const SIZE: Record<ButtonSize, string> = {
  lg: 'h-12 px-5 text-[14.5px]',
  md: 'h-11 px-4 text-[13.5px]',
  sm: 'h-10 px-3 text-[13px]',
};

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-colors ' +
  'disabled:cursor-not-allowed motion-reduce:transition-none';

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cx(BUTTON_BASE, VARIANT[variant], SIZE[size], className);
}

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  className,
  ...rest
}: ButtonOwnProps & ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      {...rest}
      className={buttonClass(variant, size, cx(block && 'w-full', className))}
    />
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  block,
  className,
  href,
  children,
  ...rest
}: ButtonOwnProps & { href: string } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>) {
  return (
    <Link href={href} {...rest} className={buttonClass(variant, size, cx(block && 'w-full', className))}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------- badges */

export type BadgeTone =
  | 'moq'
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'earned'
  | 'deal';

const TONE: Record<BadgeTone, string> = {
  moq: 'bg-accent-soft text-accent-ink border-accent/30',
  success: 'bg-success-soft text-success border-success/25',
  info: 'bg-info-soft text-info border-info/25',
  warning: 'bg-warning-soft text-warning border-warning/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  neutral: 'bg-surface-2 text-ink-dim border-line-bright',
  // Reserved for signals the listing actually earned through orders.
  earned: 'bg-ink text-surface border-transparent',
  deal: 'bg-deal text-on-fill border-transparent',
};

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
  title,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11.5px] font-semibold leading-[1.35] whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Small uppercase section label. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.07em] text-ink-faint',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  id,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1.5">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 id={id} className="text-balance text-[19px] font-bold leading-[1.2] tracking-[-0.02em] sm:text-[21px]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------- stars */

/**
 * Star rating. The glyphs are decorative — the accessible value is the text
 * label, because "four and a half stars" read out as fifteen SVG paths is
 * worse than useless.
 */
export function Stars({
  rating,
  size = 14,
  label,
}: {
  rating: number;
  size?: number;
  label?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-[1px] text-rating" role="img" aria-label={label ?? `${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.6}
          aria-hidden
          className={i < rounded ? 'fill-current' : 'opacity-25'}
        />
      ))}
    </span>
  );
}

/* ----------------------------------------------------------------- skeleton */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('skeleton', className)} />;
}

/* ---------------------------------------------------------------- meta list */

/** Dot-separated metadata run used under the product title and on cards. */
export function MetaRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-ink-dim',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MetaDot() {
  return (
    <span aria-hidden className="text-ink-faint/60">
      ·
    </span>
  );
}
