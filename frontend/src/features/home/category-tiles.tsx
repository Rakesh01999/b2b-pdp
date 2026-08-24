import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES, categoryProductCount } from '@/data/categories';
import { CategoryGlyph } from '@/features/categories/category-icon';
import { SectionHeading } from '@/components/ui/primitives';
import { num } from '@/lib/format';
import { localeHref, pick, t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

/**
 * Shop by category.
 *
 * Every main category, not a curated six — a buyer scanning for their trade
 * needs to see whether it is here at all, and a truncated grid answers that
 * question wrongly. Each tile carries its three largest subcategories as real
 * links, so the common case (I know roughly what I want) is one click rather
 * than two.
 *
 * Server-rendered, no JavaScript.
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

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATEGORIES.map((category) => (
          <li key={category.slug}>
            <div className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent/45">
              <Link
                href={localeHref(lang, `/category/${category.slug}`)}
                className="flex items-start gap-3"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-accent-soft text-accent-ink">
                  <CategoryGlyph icon={category.icon} size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-bold leading-snug tracking-[-0.012em] transition-colors group-hover:text-accent-ink">
                    {pick(category.name, lang)}
                  </span>
                  <span className="tnum mt-0.5 block text-[11.5px] text-ink-faint">
                    {num(categoryProductCount(category))} {t(lang, 'category.products')} ·{' '}
                    {category.subcategories.length} {t(lang, 'category.subcategories')}
                  </span>
                </span>
              </Link>

              {/* The three biggest children, as links. A tile that only links to
                  its own parent makes the buyer take two hops to reach the shelf
                  they were already thinking of. */}
              <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
                {[...category.subcategories]
                  .sort((a, b) => b.productCount - a.productCount)
                  .slice(0, 3)
                  .map((subcategory) => (
                    <li key={subcategory.slug}>
                      <Link
                        href={localeHref(lang, `/category/${subcategory.slug}`)}
                        className="inline-block rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[11.5px] text-ink-dim transition-colors hover:border-accent hover:text-accent-ink"
                      >
                        {pick(subcategory.name, lang)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
