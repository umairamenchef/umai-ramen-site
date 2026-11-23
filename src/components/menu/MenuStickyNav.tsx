'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { localized } from '@/lib/localized';
import type { LocaleField, MenuSection } from '@/lib/menu';

interface MenuStickyNavCategory {
  slug: { current: string };
  name: LocaleField;
  section?: MenuSection | null;
}

interface MenuStickyNavProps {
  categories: MenuStickyNavCategory[];
  locale: string;
  /** Accessible name of the nav landmark (menu.categoriesNavLabel). */
  label: string;
}

export function MenuStickyNav({ categories, locale, label }: MenuStickyNavProps) {
  const firstSlug = categories[0]?.slug?.current ?? '';
  const [activeSlug, setActiveSlug] = useState<string>(firstSlug);
  const navRef = useRef<HTMLElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  // Tab the nav was last centred on. It starts on the first tab, so the initial render
  // never scrolls the nav: only a change of the active tab (reader scrolling) does.
  const centredSlug = useRef(firstSlug);

  // Keep the active tab in view: horizontally center it in the (scrollable) nav
  // as the reader scrolls through the menu sections.
  useEffect(() => {
    if (centredSlug.current === activeSlug) return;
    centredSlug.current = activeSlug;
    const nav = navRef.current;
    const btn = btnRefs.current[activeSlug];
    if (!nav || !btn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const delta =
      btnRect.left - navRect.left - (nav.clientWidth - btn.clientWidth) / 2;
    // scrollBy only moves the nav's horizontal scroll — never the page vertically.
    nav.scrollBy({ left: delta, behavior: 'smooth' });
  }, [activeSlug]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    // Sections currently crossing the observer band, with their visible ratio.
    const sectionMap = new Map<string, number>();
    const first = categories[0]?.slug.current;

    categories.forEach((cat) => {
      const slug = cat.slug.current;
      const el = document.getElementById(`category-${slug}`);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          // Only sections inside the band count. The initial callbacks report every
          // section (ratio 0 for those outside) in no guaranteed order, so keeping
          // them used to activate an arbitrary later tab on a fresh load at scroll 0.
          if (entry.isIntersecting) sectionMap.set(slug, entry.intersectionRatio);
          else sectionMap.delete(slug);
          if (sectionMap.size === 0) {
            // Nothing in the band. Above the first section (page top) the first tab is
            // active; in a gap between sections or below the last one the tab stays.
            const firstTop = first
              ? document.getElementById(`category-${first}`)?.getBoundingClientRect().top
              : undefined;
            const bandBottom = entry.rootBounds?.bottom ?? window.innerHeight * 0.4;
            if (first && firstTop !== undefined && firstTop >= bandBottom) setActiveSlug(first);
            return;
          }
          // Set active to the section with highest visibility
          const best = [...sectionMap.entries()].reduce((a, b) =>
            a[1] > b[1] ? a : b
          );
          setActiveSlug(best[0]);
        },
        {
          threshold: [0, 0.25, 0.5, 0.75, 1],
          rootMargin: '-20% 0px -60% 0px',
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  function scrollTo(slug: string) {
    document.getElementById(`category-${slug}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return (
    <nav
      ref={navRef}
      aria-label={label}
      className="sticky top-20 z-30 bg-umai-bg border-b border-umai-line overflow-x-auto"
    >
      <div className="flex gap-0 max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        {categories.map((cat, index) => {
          const slug = cat.slug.current;
          // Thin divider where the section changes (Plats | Boissons).
          const sectionStart =
            index > 0 && (cat.section ?? null) !== (categories[index - 1].section ?? null);
          return (
            <Fragment key={slug}>
              {sectionStart && (
                <span aria-hidden="true" className="my-3 w-px shrink-0 bg-umai-line" />
              )}
              <button
                ref={(el) => {
                  btnRefs.current[slug] = el;
                }}
                onClick={() => scrollTo(slug)}
                className={`px-5 py-4 font-body text-xs uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
                  activeSlug === slug
                    ? 'border-umai-accent text-umai-accent'
                    : 'border-transparent text-umai-text-muted hover:text-umai-text'
                }`}
              >
                {localized(cat.name, locale)}
              </button>
            </Fragment>
          );
        })}
      </div>
    </nav>
  );
}
