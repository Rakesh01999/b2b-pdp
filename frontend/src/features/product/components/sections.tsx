import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import { ButtonLink } from '@/components/ui/primitives';
import { InfoTip } from '@/components/ui/info-tip';
import { localeHref, pick, t, type StringKey } from '@/lib/i18n';
import type { Lang, Product, SpecGroup, SpecRow } from '@/lib/types';

/**
 * The evidence sections. All server-rendered — no interaction, so no JavaScript.
 *
 * The `scroll-margin-top` on the wrapper is what makes the anchored section nav
 * usable: without it every in-page jump lands with the heading hidden behind the
 * sticky chrome.
 */
export function ProductSection({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={className}
      style={{ scrollMarginTop: 'calc(var(--header-h) + 60px)' }}
    >
      <h2
        id={`${id}-heading`}
        className="mb-4 text-[19px] font-bold leading-tight tracking-[-0.02em] sm:text-[21px]"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ---------------------------------------------------------------- overview */

/**
 * Rich description as typed blocks rather than a single HTML string.
 *
 * Imported 1688 descriptions arrive as one tall image strip. Rendering that as-is
 * is the single most damaging shortcut available here: unindexable,
 * untranslatable, unreadable to a screen reader, and a layout-shift liability.
 * Splitting into typed blocks means each image is a real `next/image` with its
 * own caption, and the text is text.
 */
export function ProductOverview({ product, lang }: { product: Product; lang: Lang }) {
  return (
    <ProductSection id="overview" title={t(lang, 'section.overview')}>
      <div className="zone-evidence space-y-5 text-ink-dim">
        {product.description.map((block, index) => {
          switch (block.type) {
            case 'heading':
              return (
                <h3
                  key={index}
                  className="!mt-7 text-[16px] font-bold leading-snug tracking-[-0.015em] text-ink"
                >
                  {pick(block.text, lang)}
                </h3>
              );

            case 'list':
              return (
                <ul key={index} className="measure list-disc space-y-2 pl-5">
                  {block.items?.map((item, i) => (
                    <li key={i} className="marker:text-accent">
                      {pick(item, lang)}
                    </li>
                  ))}
                </ul>
              );

            case 'image':
              return (
                <figure key={index} className="max-w-[520px]">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-2">
                    <Image
                      src={block.src!}
                      alt={pick(block.caption, lang)}
                      fill
                      sizes="(max-width: 640px) 92vw, 520px"
                      // Below the fold by definition — never competes with the
                      // hero image for bandwidth.
                      loading="lazy"
                      className="object-cover"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="mt-2 text-[12.5px] leading-relaxed text-ink-faint">
                      {pick(block.caption, lang)}
                    </figcaption>
                  )}
                </figure>
              );

            default:
              return (
                <p key={index} className="measure">
                  {pick(block.text, lang)}
                </p>
              );
          }
        })}
      </div>
    </ProductSection>
  );
}

/* ---------------------------------------------------- specifications */

const GROUP_ORDER: SpecGroup[] = ['general', 'technical', 'packaging', 'trade', 'compliance'];

const GROUP_LABEL: Record<SpecGroup, StringKey> = {
  general: 'spec.general',
  technical: 'spec.technical',
  packaging: 'spec.packaging',
  trade: 'spec.trade',
  compliance: 'spec.compliance',
};

/**
 * Specifications: grouped, two columns, inline, and expanded by default.
 *
 * Grouping is what makes forty-eight rows scannable — a flat list of that length
 * is a wall. "Trade terms" is the B2B-only group, and it is where three of the
 * buyer's ten questions get answered: lead time, sample, and whether the line can
 * be customised at all.
 *
 * On mobile the whole section collapses into `<details>` elements, which need no
 * JavaScript and stay searchable by the browser's own find-in-page.
 */
export function ProductSpecifications({ product, lang }: { product: Product; lang: Lang }) {
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    rows: product.specifications.filter((spec) => spec.group === group),
  })).filter((entry) => entry.rows.length > 0);

  if (grouped.length === 0) {
    return (
      <ProductSection id="specifications" title={t(lang, 'section.specifications')}>
        {/* An empty spec table is a lead, not a dead end. */}
        <div className="rounded-xl border border-dashed border-line-bright bg-surface p-6 text-center">
          <p className="text-[13.5px] text-ink-dim">{t(lang, 'spec.empty')}</p>
          <ButtonLink
            href={localeHref(lang, `/messages?product=${product.slug}`)}
            variant="secondary"
            size="md"
            className="mt-3 gap-1.5"
          >
            <MessageCircle size={15} aria-hidden />
            {t(lang, 'spec.requestDetails')}
          </ButtonLink>
        </div>
      </ProductSection>
    );
  }

  return (
    <ProductSection id="specifications" title={t(lang, 'section.specifications')}>
      <div className="zone-reference rounded-xl border border-line bg-surface">
        <div className="grid md:grid-cols-2">
          {grouped.map((entry, index) => (
            <div
              key={entry.group}
              className={
                // Hairlines between groups without a border on the outer edges.
                'border-line md:[&:nth-child(even)]:border-l ' +
                (index < grouped.length - 1 ? 'border-b ' : '')
              }
            >
              <SpecGroupBlock
                label={t(lang, GROUP_LABEL[entry.group])}
                rows={entry.rows}
                lang={lang}
              />
            </div>
          ))}
        </div>
      </div>
    </ProductSection>
  );
}

function SpecGroupBlock({
  label,
  rows,
  lang,
}: {
  label: string;
  rows: SpecRow[];
  lang: Lang;
}) {
  return (
    <div className="p-4 sm:p-5">
      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </h3>
      <dl className="divide-y divide-line/70">
        {rows.map((row) => (
          <div key={row.label.en} className="flex items-baseline gap-4 py-2">
            <dt className="w-[9.5rem] shrink-0 text-ink-faint">{pick(row.label, lang)}</dt>
            <dd className="min-w-0 flex-1 font-medium text-ink">
              {pick(row.value, lang)}
              {row.note && (
                <InfoTip label={pick(row.label, lang)}>{pick(row.note, lang)}</InfoTip>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
