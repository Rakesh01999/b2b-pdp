import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, Info, MessageCircle } from 'lucide-react';

import { ButtonLink, Container } from '@/components/ui/primitives';
import { Breadcrumb, type Crumb } from '@/components/layout/breadcrumb';
import { PageHeader } from '@/components/layout/page-header';
import { BreadcrumbJsonLd } from '@/components/seo/structured-data';
import {
  CONTENT_PAGES,
  contentPageSegments,
  findContentPage,
  type ContentPage,
  type PageBlock,
} from '@/data/pages';
import { HREFLANG, LOCALES, isLocale, localeHref, pick, t } from '@/lib/i18n';
import { dateShort } from '@/lib/format';
import type { Lang } from '@/lib/types';

/**
 * Every informational page, through one route.
 *
 * Seventeen near-identical files was the alternative, and the practical cost of
 * that alternative is what the footer looked like before this route existed:
 * links that went nowhere. Content lives in `src/data/pages.ts`, so adding a
 * page is a data change and the layout stays consistent by construction.
 *
 * This is a catch-all, so it also serves as the terminal 404 for anything under
 * `/[lang]` that no other route claimed — which is why an unknown path calls
 * `notFound()` rather than rendering an apologetic placeholder.
 */
const BASE = 'https://arcb2b.com';

export async function generateStaticParams() {
  return contentPageSegments().map((slug) => ({ slug }));
}

function resolve(slug: string[] | undefined): ContentPage | null {
  if (!slug || slug.length === 0) return null;
  return findContentPage(`/${slug.join('/')}`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string[] }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};

  const page = resolve(slug);
  if (!page) return { title: t(lang, 'state.notFoundTitle'), robots: { index: false, follow: true } };

  return {
    title: pick(page.title, lang),
    description: pick(page.intro, lang),
    alternates: {
      canonical: `${BASE}/${lang}${page.path}`,
      languages: Object.fromEntries(
        LOCALES.map((locale) => [HREFLANG[locale], `${BASE}/${locale}${page.path}`]),
      ),
    },
  };
}

export default async function ContentRoute({
  params,
}: {
  params: Promise<{ lang: string; slug: string[] }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const page = resolve(slug);
  if (!page) notFound();

  // A nested path gets its parent in the trail when the parent is itself a page,
  // so `/help/payment` sits under Help rather than floating under Home.
  const parentPath = page.path.split('/').slice(0, -1).join('/');
  const parent = parentPath ? findContentPage(parentPath) : null;

  const crumbs: Crumb[] = [
    { name: t(lang, 'chrome.home'), href: '/' },
    ...(parent ? [{ name: pick(parent.title, lang), href: parent.path }] : []),
    { name: pick(page.title, lang) },
  ];

  const related = (page.related ?? [])
    .map((path) => CONTENT_PAGES.find((candidate) => candidate.path === path))
    .filter((candidate): candidate is ContentPage => Boolean(candidate));

  // Paths the registry does not hold but that related lists point at — the RFQ
  // form is a real route, not a content page.
  const externalRelated = (page.related ?? []).filter(
    (path) => !CONTENT_PAGES.some((candidate) => candidate.path === path),
  );

  return (
    <Container className="pb-16">
      <BreadcrumbJsonLd items={crumbs} lang={lang} />
      <Breadcrumb items={crumbs} lang={lang} />

      <PageHeader
        title={pick(page.title, lang)}
        intro={pick(page.intro, lang)}
        meta={
          page.updated ? (
            <>
              {t(lang, 'content.updated')} {dateShort(page.updated, lang)}
            </>
          ) : undefined
        }
      />

      {/* One column, capped at a readable measure. A two-column policy page is
          a design that has forgotten it will be read rather than admired. */}
      <div className="zone-evidence max-w-[72ch] space-y-5 text-[15px] leading-relaxed text-ink-dim">
        {page.blocks.map((block, index) => (
          <Block key={index} block={block} lang={lang} />
        ))}
      </div>

      {(related.length > 0 || externalRelated.length > 0) && (
        <nav aria-labelledby="related-heading" className="mt-11 border-t border-line pt-6">
          <h2
            id="related-heading"
            className="mb-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-faint"
          >
            {t(lang, 'content.related')}
          </h2>
          <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <li key={item.path}>
                <Link
                  href={localeHref(lang, item.path)}
                  className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/50"
                >
                  <span className="flex items-center gap-1.5 text-[14px] font-bold leading-snug tracking-[-0.012em] transition-colors group-hover:text-accent-ink">
                    {pick(item.title, lang)}
                    <ArrowRight
                      size={14}
                      aria-hidden
                      className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-faint">
                    {pick(item.intro, lang)}
                  </span>
                </Link>
              </li>
            ))}
            {externalRelated.map((path) => (
              <li key={path}>
                <Link
                  href={localeHref(lang, path)}
                  className="group flex h-full items-center gap-1.5 rounded-xl border border-line bg-surface p-4 text-[14px] font-bold leading-snug tracking-[-0.012em] transition-colors hover:border-accent/50 hover:text-accent-ink"
                >
                  {path === '/rfq/new' ? t(lang, 'rfq.title') : path}
                  <ArrowRight size={14} aria-hidden className="shrink-0 text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <aside className="mt-8 rounded-xl border border-line bg-surface-2 p-5 sm:p-6">
        <h2 className="text-[15px] font-bold tracking-[-0.015em]">{t(lang, 'content.stillStuck')}</h2>
        <p className="zone-evidence mt-2 max-w-[64ch] text-ink-dim">
          {t(lang, 'content.stillStuckBody')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink href={localeHref(lang, '/messages')} variant="primary" size="md" className="gap-1.5">
            <MessageCircle size={15} aria-hidden />
            {t(lang, 'chrome.messages')}
          </ButtonLink>
          <ButtonLink href={localeHref(lang, '/rfq/new')} variant="secondary" size="md">
            {t(lang, 'rfq.title')}
          </ButtonLink>
        </div>
      </aside>
    </Container>
  );
}

function Block({ block, lang }: { block: PageBlock; lang: Lang }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 className="!mt-9 text-[18px] font-bold leading-snug tracking-[-0.02em] text-ink">
          {pick(block.text, lang)}
        </h2>
      );

    case 'list':
      return (
        <ul className="space-y-2">
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-2.5">
              <Check size={16} aria-hidden className="mt-[3px] shrink-0 text-accent" />
              <span>{pick(item, lang)}</span>
            </li>
          ))}
        </ul>
      );

    case 'steps':
      return (
        // Numbered because the order is load-bearing — these are sequences, and a
        // bulleted sequence makes the reader work out the order for themselves.
        <ol className="space-y-3.5">
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-3">
              <span className="tnum grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-bold text-accent-ink">
                {index + 1}
              </span>
              <span className="pt-0.5">{pick(item, lang)}</span>
            </li>
          ))}
        </ol>
      );

    case 'note':
      return (
        <p className="flex gap-2.5 rounded-xl border border-line bg-surface-2 p-4 text-[14px]">
          <Info size={16} aria-hidden className="mt-[3px] shrink-0 text-accent-ink" />
          <span>{pick(block.text, lang)}</span>
        </p>
      );

    case 'facts':
      return (
        // A two-column definition list, not a table: these are label/value pairs
        // with no third dimension, and a table would add chrome for nothing.
        <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {block.rows.map(([key, value], index) => (
            <div key={index} className="grid gap-1 p-4 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-5">
              <dt className="text-[13.5px] font-semibold text-ink">{pick(key, lang)}</dt>
              <dd className="text-[14px] text-ink-dim">{pick(value, lang)}</dd>
            </div>
          ))}
        </dl>
      );

    default:
      return <p>{pick(block.text, lang)}</p>;
  }
}
