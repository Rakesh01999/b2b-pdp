import Link from 'next/link';
import { Compass, Search } from 'lucide-react';

import { ButtonLink, Container } from '@/components/ui/primitives';
import { featuredCategories } from '@/data/categories';
import { CategoryGlyph } from '@/features/categories/category-icon';

/**
 * The 404 for everything under a locale.
 *
 * Not addressable, so it has no `params` and therefore no locale to read — the
 * copy is bilingual inline and the links are locale-relative, which resolve
 * against whichever locale segment the visitor was already in. Getting the
 * language right here would need a client hook, and paying for JavaScript on the
 * error page is the wrong trade.
 *
 * It ends in routes rather than sympathy: search, the category tree, and the six
 * featured shelves.
 */
export default function LangNotFound() {
  return (
    <Container className="pb-16">
      <div className="mx-auto max-w-[62ch] py-14 text-center sm:py-20">
        <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-ink-faint">
          <Compass size={30} aria-hidden />
        </span>

        <h1 className="text-balance text-[26px] font-bold leading-[1.15] tracking-[-0.03em] sm:text-[32px]">
          This page does not exist
        </h1>
        <p className="mt-2 text-[15px] text-ink-dim" lang="bn">
          এই পেজটি নেই
        </p>
        <p className="zone-evidence mx-auto mt-4 max-w-[56ch] text-ink-dim">
          The link may be out of date, or the listing may have been unpublished. Search for what you
          need, or start from the category tree.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/search" variant="primary" size="lg" className="gap-1.5">
            <Search size={16} aria-hidden />
            Search the catalogue
          </ButtonLink>
          <ButtonLink href="/categories" variant="secondary" size="lg">
            All categories
          </ButtonLink>
        </div>

        <ul className="mt-9 flex flex-wrap justify-center gap-2 border-t border-line pt-7">
          {featuredCategories().map((category) => (
            <li key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-ink-dim transition-colors hover:border-accent hover:text-accent-ink"
              >
                <CategoryGlyph icon={category.icon} size={13} />
                {category.name.en}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
