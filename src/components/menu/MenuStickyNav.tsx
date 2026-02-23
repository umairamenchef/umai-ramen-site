'use client';

import { useEffect, useState } from 'react';
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
    <nav className="sticky top-20 z-30 bg-umai-bg border-b border-umai-line overflow-x-auto">
      <div className="flex gap-0 max-w-[var(--max-width-content)] mx-auto px-6 lg:px-10">
        {categories.map((cat) => {
          const slug = cat.slug.current;
          return (
            <button
              key={slug}
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
