'use client';

import { useEffect, useState } from 'react';
import { cx } from '@/components/ui/cx';
import { t } from '@/lib/i18n';
import type { Lang } from '@/lib/types';
import type { StringKey } from '@/lib/i18n';

/**
 * Anchored section navigation with scroll-spy.
 *
 * Anchors, not tabs. Tabs would hide P0 evaluation content behind a click, break
 * Ctrl-F, break deep links to a single specification, and flatten scroll-depth
 * analytics into uselessness. For a buyer identifying a component, a tab is
 * strictly worse than a scroll.
 *
 * The nav sticks under the header; `scroll-margin-top` on each section — set from
 * the same `--header-h` token the header publishes — is what stops every jump
 * landing with the heading hidden behind the chrome.
 */

export interface SectionLink {
  id: string;
  labelKey: StringKey;
  count?: number;
}

export function SectionNav({ sections, lang }: { sections: SectionLink[]; lang: Lang }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry nearest the top of the reading area rather than the
        // first intersecting one: with several sections on screen at once, "first
        // in document order" makes the highlight lag a screen behind the reader.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        // Top inset clears the sticky chrome; the large bottom inset keeps the
        // observation band to roughly the upper third of the viewport.
        rootMargin: '-140px 0px -55% 0px',
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label={t(lang, 'section.nav')}
      className="glass sticky top-[var(--header-h)] z-30 mb-5 rounded-lg border border-line"
    >
      <ul className="slim-scroll scroll-hint flex items-stretch gap-1 overflow-x-auto px-2">
        {sections.map((section) => {
          const isActive = active === section.id;
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={cx(
                  'inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[13px] font-semibold transition-colors',
                  isActive
                    ? 'border-accent text-accent-ink'
                    : 'border-transparent text-ink-dim hover:text-ink',
                )}
              >
                {t(lang, section.labelKey)}
                {section.count != null && (
                  <span className="tnum text-[11.5px] font-medium text-ink-faint">
                    {section.count}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
