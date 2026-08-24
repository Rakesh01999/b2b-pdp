import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PaginatedCategoryGrid } from './paginated-category-grid';
import { SectionHeading } from '@/components/ui/primitives';
import { localeHref, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * Shop by category.
 *
 * Every main category, not a curated six — a buyer scanning for their trade
 * needs to see whether it is here at all, and a truncated grid answers that
 * question wrongly. Paginated eight at a time instead: the taxonomy is meant to
 * grow well past twenty, and a page that just keeps growing with it stops being
 * an overview. Each tile carries its three largest subcategories as real links,
 * so the common case (I know roughly what I want) is one click rather than two.
 *
 * The heading and the "view all" link are server-rendered; only the grid itself
 * — a client island — pays for the pagination interactivity.
 */
export function CategoryTiles({ lang }: { lang: Lang }) {
  return (
    <section aria-labelledby="categories-heading" className="pt-12">
      <SectionHeading
        id="categories-heading"
        eyebrow={t(lang, 'home.shopByCategorySub')}
        title={t(lang, 'home.shopByCategory')}
        action={
          <Link
            href={localeHref(lang, '/categories')}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent-ink transition-all hover:gap-2.5"
          >
            {t(lang, 'category.all')}
            <ArrowRight size={14} aria-hidden />
          </Link>
        }
      />

      <PaginatedCategoryGrid lang={lang} />
    </section>
  );
}
