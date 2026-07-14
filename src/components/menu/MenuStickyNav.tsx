'use client';

import { useEffect, useRef, useState } from 'react';
import { localized } from '@/lib/localized';

interface MenuStickyNavCategory {
  slug: { current: string };
  name: { fr: string; en?: string; de?: string };
}

interface MenuStickyNavProps {
  categories: MenuStickyNavCategory[];
  locale: string;
}

export function MenuStickyNav({ categories, locale }: MenuStickyNavProps) {
  const [activeSlug, setActiveSlug] = useState<string>(
    categories[0]?.slug?.current ?? ''
  );
  const navRef = useRef<HTMLElement>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Keep the active tab in view: horizontally center it in the (scrollable) nav
  // as the reader scrolls through the menu sections.
  useEffect(() => {
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
    const sectionMap = new Map<string, number>();

    categories.forEach((cat) => {
      const slug = cat.slug.current;
      const el = document.getElementById(`category-${slug}`);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          sectionMap.set(slug, entry.intersectionRatio);
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
      className="sticky top-20 z-30 bg-umai-bg border-b border-umai-line overflow-x-auto"
    >
      <div className="flex gap-0 max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        {categories.map((cat) => {
          const slug = cat.slug.current;
          return (
            <button
              key={slug}
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
          );
        })}
      </div>
    </nav>
  );
}
