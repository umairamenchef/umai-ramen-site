# Phase 2: Content Pages - Research

**Researched:** 2026-02-23
**Domain:** Next.js 16 App Router content pages + Sanity CMS data fetching + motion v12 scroll animations + next/image hero + lightbox + sticky sub-nav + Google Maps embed
**Confidence:** HIGH (core stack confirmed against official docs; one MEDIUM-confidence item flagged with workaround)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Homepage hero & vibe:**
- Fullscreen hero with a single fixed photo (next/image priority, rgba overlay for text readability) — no slider, no gradient, no video
- Catchphrase ("Nouilles fraiches. Bouillons maison.") centered on hero with DM Serif Display, large, white text with subtle text-shadow
- Two CTA buttons on hero: "Reserver" (primary, vert accent fill) and "Commander" (secondary, outlined white) — side by side on desktop, stacked on mobile
- Below the fold: menu preview cards → USP blocks → Notre Histoire teaser → gallery section → social section — generous whitespace between sections (py-20+)
- Menu preview: 3 visual cards with photo backgrounds, category name overlay, linking to /menu with anchored category sections
- USP section: 3 proof blocks in dotted border cards, centered text, line-art icons above each
- Notre Histoire teaser: horizontal split (photo left, text right on desktop, stacked on mobile) with CTA to /notre-histoire
- Gallery section: 4-6 photo thumbnails in a responsive grid, "Voir toute la galerie" link to /galerie
- Social section: Instagram handle + branded hashtag, minimal — not a feed embed

**Menu presentation:**
- Category-based layout with sticky sub-navigation scrolling to sections
- Each menu item as a clean row/card: FR name (DM Serif Display, bold) + JP name (Noto Sans JP, smaller, muted vert accent) + price right-aligned (Outfit, tabular nums) + description below in Outfit
- Dietary badges as small pill-shaped tags (vegetarian green, gluten-free amber) inline after the item name
- Extras displayed as compact grid cards (2-3 columns) with name + price, no descriptions needed
- Formules (Menu Gyoza, Menu Enfant) in a distinct highlighted section with dotted border, showing included items
- Availability toggle: items with `available: false` in Sanity simply don't render — no "sold out" label, they vanish
- eazee-link CTA at bottom of menu page as a secondary outlined button

**Story & gallery feel:**
- Notre Histoire: 4 scroll sections alternating photo-text layout (photo left/text right, then photo right/text left)
- Framer Motion fade-in-up on viewport entry — subtle, 0.6s duration, staggered 0.1s per element — not dramatic or bouncy
- Each section has a Sanity-editable photo + narrative paragraph, DM Serif Display heading, Outfit body
- Final section ends with a reservation CTA button linking to /reservation
- Gallery page: CSS grid (uniform aspect ratio, not masonry) — cleaner, more controlled, fits the refined brand
- Lightbox: overlay with dark backdrop, image centered, left/right arrows, keyboard nav (arrow keys + Escape), swipe on mobile
- Images via Sanity CDN with WebP auto-conversion and responsive srcSet

**CTA hierarchy:**
- "Reserver" is always primary (vert accent #77967A fill, white text) — this is the main conversion action
- "Commander" is always secondary (outlined, vert accent border + text) — important but second priority
- Header sticky CTAs: both visible on desktop, only icons on mobile (mobile sticky bar handles full CTAs)
- Mobile sticky bottom bar: two equal-width buttons, "Reserver" left (filled), "Commander" right (outlined)
- Reservation page: large prominent Gusty CTA button + micro-copy ("Gratuit, sans commission")
- Commander page: 3 options presented as cards — Uber Eats (with badge/logo), Gusty Click & Collect, eazee-link — each with icon, description, and external link button
- All external links open in new tab with rel="noopener noreferrer"

### Claude's Discretion

- All areas above reflect Claude's best judgment — user trusts implementation decisions
- Exact spacing values, animation easing curves, responsive breakpoint fine-tuning
- Loading skeleton designs for Sanity content
- Error/empty states for each page
- Google Maps embed styling and lazy-loading approach on reservation/infos pages
- FAQ section layout on infos page (accordion vs flat list)
- Exact seigaiha pattern placement and density per page

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOME-01 | Fullscreen hero with fixed photo (next/image + rgba overlay), no slider | next/image fill + preload prop (priority deprecated in v16); parent `position: relative`, `object-fit: cover` |
| HOME-02 | Hero displays editable catchphrase + reserve/order CTAs | sanityFetch SITE_SETTINGS_QUERY for catchphrase; Button component already built |
| HOME-03 | Menu preview section with 3 visual category cards linking to /menu | MENU_CATEGORIES_QUERY already defined; Link from i18n/navigation with hash anchors |
| HOME-04 | USP section with 3 proof blocks in dotted borders | Static content; dotted border pattern from design system (border-dashed border-umai-line-dotted) |
| HOME-05 | Notre Histoire teaser with photo + short text + CTA to /notre-histoire | PAGE_QUERY or siteSettings; Link to /notre-histoire |
| HOME-06 | Photo gallery section with responsive grid | GALLERY_QUERY already defined; next/image with Sanity CDN URLs |
| HOME-07 | Social section with Instagram link and hashtag | siteSettings.socialLinks.instagram — already in schema |
| MENU-01 | Full menu from Sanity with categories, items, prices, descriptions, dietary tags | MENU_CATEGORIES_QUERY already defined and filters available=true |
| MENU-02 | Sticky sub-navigation by category (scroll to section) | IntersectionObserver + useState for active category; section IDs matching category slugs |
| MENU-03 | Menu items show FR name + JP name + price + description + dietary badges | All fields in menuItem schema (name.fr, nameJp, price, description, isVegetarian, isGlutenFree) |
| MENU-04 | Extras grid section | Separate Sanity schema needed: menuExtra or use category with isExtra flag |
| MENU-05 | Menu formules section (Menu Gyoza, Menu Enfant) | Separate Sanity schema needed: menuFormule with includedItems |
| MENU-06 | Availability toggle per item | `available` field already in menuItem schema; GROQ filters `available == true` |
| MENU-07 | CTA to eazee-link for full digital menu | siteSettings.eazeeLinkUrl already in schema |
| RESV-01 | Reservation page with prominent CTA to Gusty | siteSettings.reservationUrl; Button component variant="primary" |
| RESV-02 | Practical info: address, hours, phone, Google Maps embed | siteSettings.openingHours, address, phone already in schema; iframe with loading="lazy" |
| RESV-03 | Micro-copy: reservation is free and without commission | Static text in i18n messages |
| ORDR-01 | Order page with Uber Eats link + badge | siteSettings.uberEatsUrl; static SVG icon |
| ORDR-02 | Gusty Click & Collect CTA | siteSettings.clickCollectUrl (pending from owner — Sanity placeholder) |
| ORDR-03 | eazee-link CTA on commander page | siteSettings.eazeeLinkUrl already in schema |
| ORDR-04 | Micro-copy for each ordering option | Static text in i18n messages per ordering option card |
| HIST-01 | 4 scroll sections: Passion du ramen, Fait maison, Local, Experience UMAI | New `histoirePage` Sanity schema with sections array; or use existing page type |
| HIST-02 | Each section has photo + narrative text (Sanity-editable) | page.sections schema already has heading/body/image fields — directly usable |
| HIST-03 | Framer Motion scroll animations (fade-in-up on viewport entry) | m.div + whileInView + viewport={{ once: true }} via LazyMotion; see LazyMotion bug note |
| HIST-04 | CTA at bottom linking to /reservation | Button component variant="primary" href="/reservation" |
| INFO-01 | Opening hours from Sanity (structured, not free text) | siteSettings.openingHours already structured as array of {day, periods} |
| INFO-02 | Address with Google Maps embed (lazy-loaded) | iframe with loading="lazy" native attribute — no library needed |
| INFO-03 | Phone number with click-to-call | `<a href="tel:0952343438">` — static or from siteSettings.phone |
| INFO-04 | FAQ section: allergens, groups, vegetarian options | Static content in i18n messages (accordion or flat list — Claude's discretion) |
| INFO-05 | Instagram + contact links | siteSettings.socialLinks.instagram |
| GLRY-01 | Responsive photo grid from Sanity gallery (CSS grid, uniform aspect ratio) | GALLERY_QUERY already defined; CSS grid with aspect-ratio utility |
| GLRY-02 | Lightbox on click with keyboard nav and mobile swipe | yet-another-react-lightbox v3 — React 19 compatible, keyboard + swipe built-in |
| GLRY-03 | Images via Sanity CDN with WebP auto-conversion and responsive sizes | @sanity/image-url urlFor + next/image + sizes prop |
| INTG-01 | Gusty reservation CTA on sticky header, hero, reservation page, mobile bar | Already in Header/MobileBar; add to hero and /reservation page |
| INTG-02 | Uber Eats delivery CTA on sticky header, hero, commander page, mobile bar | Already in Header/MobileBar; add to hero and /commander page |
| INTG-03 | Gusty Click & Collect CTA on commander page | siteSettings.clickCollectUrl — Sanity-editable placeholder |
| INTG-04 | eazee-link digital menu link on menu page and commander page | siteSettings.eazeeLinkUrl |
| INTG-05 | Google Maps iframe embed on reservation and infos pages | Static iframe URL for 5 rue des Orphelins, 67000 Strasbourg; loading="lazy" |
| INTG-06 | Instagram link in social section and footer | siteSettings.socialLinks.instagram; footer already implemented |
| INTG-07 | Facebook link in footer | siteSettings.socialLinks.facebook; footer already implemented |
</phase_requirements>

---

## Summary

Phase 2 builds all visitor-facing content pages on top of the complete Phase 1 foundation. The infrastructure is solid: Sanity schemas for `menuCategory`, `menuItem`, `gallery`, and `siteSettings` are all in place with their GROQ queries pre-written. The layout shell (Header with CTAs, Footer, MobileBar, MotionProvider) is done. Phase 2 is primarily page authoring with data-fetching, plus three technically distinct features: scroll animations, a lightbox, and a sticky sub-nav.

The most important technical finding for planning: **the `motion` package (v12.34.3, currently installed) has a confirmed open bug with `import * as m from 'motion/react-m'` under certain bundler conditions**. The project already uses `m` from `motion/react-m` (MobileMenu.tsx confirms this pattern works in the current codebase). For whileInView scroll animations, the safe approach is to test against the installed version before assuming any workaround is needed — if animations fail, fall back to `useInView` hook from `motion/react` combined with regular `m.div` elements.

Two Sanity schemas are missing and must be created: `menuExtra` (extras grid items) and `menuFormule` (Menu Gyoza, Menu Enfant). The existing `page` schema is sufficient to drive Notre Histoire via the sections array field (heading/body/image per section). The `siteSettings` schema already has all integration URLs, opening hours, address, and social links needed.

**Primary recommendation:** Start with the menu page (most complex: sticky nav, GROQ data, dietary tags, extras, formules) then homepage (most visible), then the remaining pages in a single task (reservation, commander, notre-histoire, infos, gallery).

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | App Router pages, ISR, next/image | Locked; `preload` prop replaces `priority` in v16 |
| react / react-dom | 19.2 | UI runtime | Locked; required by Next.js 16 |
| motion | 12.34.3 | Scroll animations (whileInView, m components) | Locked; import from `motion/react` / `motion/react-m` |
| next-intl | 4.8.3 | Translations per page (getTranslations for async pages) | Locked; setRequestLocale pattern established |
| next-sanity / sanity | 12.1.0 / 5.11.0 | Sanity data fetching, GROQ, TypeGen | Locked; sanityFetch helper in place |
| tailwindcss | 4.x | All styling via @theme tokens and utilities | Locked; tokens defined in globals.css |

### New in Phase 2

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sanity/image-url | latest (~1.x) | Build Sanity CDN URLs with WebP, resize, hotspot cropping | For all Sanity image fields rendered via next/image |
| yet-another-react-lightbox | ^3.25.0 | Gallery lightbox: keyboard nav, swipe, next/image integration | Gallery page only (GLRY-02) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| yet-another-react-lightbox | Custom portal + useEffect keyboard listener | Library handles keyboard, swipe, focus trap, preloading; custom = 300+ lines of brittle code |
| @sanity/image-url | next-sanity-image library | next-sanity-image is an abstraction on top of @sanity/image-url; adds dependency for marginal DX gain; direct urlFor is simpler and transparent |
| IntersectionObserver (sticky nav) | react-intersection-observer library | Native API is sufficient for MENU-02; no extra dependency needed |

**Installation (new dependencies only):**
```bash
npm install @sanity/image-url yet-another-react-lightbox
```

---

## Architecture Patterns

### Recommended Project Structure Extension

```
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx              # Existing — unchanged
│       ├── page.tsx                # Homepage — REPLACE placeholder with real content
│       ├── menu/
│       │   └── page.tsx            # Menu page (02-02)
│       ├── reservation/
│       │   └── page.tsx            # Reservation page (02-03)
│       ├── commander/
│       │   └── page.tsx            # Commander/Order page (02-03)
│       ├── notre-histoire/
│       │   └── page.tsx            # Notre Histoire page (02-03)
│       ├── infos/
│       │   └── page.tsx            # Infos page (02-03)
│       └── galerie/
│           └── page.tsx            # Gallery page (02-03)
├── components/
│   ├── layout/                     # Existing — unchanged
│   ├── ui/                         # Existing — add new components:
│   │   ├── Button.tsx              # Existing
│   │   ├── SectionHeader.tsx       # Existing
│   │   ├── SeigahaPattern.tsx      # Existing
│   │   └── FadeInUp.tsx            # NEW: motion wrapper for scroll animations
│   ├── home/                       # NEW: Homepage sections
│   │   ├── Hero.tsx
│   │   ├── MenuPreview.tsx
│   │   ├── UspSection.tsx
│   │   ├── HistoireTeaser.tsx
│   │   ├── GalleryPreview.tsx
│   │   └── SocialSection.tsx
│   ├── menu/                       # NEW: Menu page components
│   │   ├── MenuStickyNav.tsx
│   │   ├── MenuCategory.tsx
│   │   ├── MenuItem.tsx
│   │   ├── DietaryBadge.tsx
│   │   ├── ExtrasGrid.tsx
│   │   └── FormulesSection.tsx
│   └── gallery/                    # NEW: Gallery components
│       ├── GalleryGrid.tsx
│       └── GalleryLightbox.tsx
├── sanity/
│   └── schemaTypes/
│       ├── menuExtra.ts            # NEW: Extras menu items
│       └── menuFormule.ts          # NEW: Menu formules (Gyoza, Enfant)
└── messages/
    ├── fr.json                     # EXTEND: new page namespaces
    ├── en.json                     # EXTEND
    └── de.json                     # EXTEND
```

### Pattern 1: Page Route Structure with setRequestLocale + getTranslations

**What:** Every page under `[locale]/` must call `setRequestLocale(locale)` to maintain static rendering. Use `getTranslations` (server-side async) for async page components.

**When to use:** All async Server Component pages in `app/[locale]/`.

```typescript
// src/app/[locale]/menu/page.tsx
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { sanityFetch } from '@/sanity/lib/client';
import { MENU_CATEGORIES_QUERY } from '@/sanity/lib/queries';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MenuPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'menu' });
  const categories = await sanityFetch({
    query: MENU_CATEGORIES_QUERY,
    tags: ['menuCategory', 'menuItem'],
  });

  return (
    <main>
      {/* page content */}
    </main>
  );
}
```

**Source:** [next-intl Server & Client Components](https://next-intl.dev/docs/environments/server-client-components) (MEDIUM confidence — WebSearch verified)

### Pattern 2: Fullscreen Hero with next/image (Next.js 16)

**What:** `priority` prop is deprecated in Next.js 16. Use `preload` for LCP images. Hero uses `fill` + `object-cover` + absolute positioned overlay div for text contrast.

**When to use:** Homepage hero only (HOME-01, HOME-02).

```typescript
// src/components/home/Hero.tsx
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface HeroProps {
  catchphrase: string;
  reservationUrl: string;
  uberEatsUrl: string;
}

export function Hero({ catchphrase, reservationUrl, uberEatsUrl }: HeroProps) {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="https://cdn.sanity.io/images/..." // or local placeholder
          alt=""
          fill
          preload  // Next.js 16: replaces priority prop for LCP images
          loading="eager"
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* rgba overlay for text readability */}
        <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <h1 className="font-display text-5xl md:text-7xl uppercase tracking-[0.1em] text-white mb-8"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
          {catchphrase}
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" href={reservationUrl} external>
            Réserver
          </Button>
          <Button variant="outline-white" href={uberEatsUrl} external>
            Commander
          </Button>
        </div>
      </div>
    </section>
  );
}
```

**Source:** [Next.js Image Component API Reference](https://nextjs.org/docs/app/api-reference/components/image) (HIGH confidence — official docs fetched at research time)

**Critical: Next.js 16 image `qualities` requirement.** In Next.js 16, `qualities` in `next.config.ts` must be explicitly set or the default `[75]` applies. The existing `next.config.ts` does not set `qualities`, so quality=75 is enforced. This is fine for production.

### Pattern 3: Sanity Image URL Builder with next/image

**What:** `@sanity/image-url` converts Sanity image asset references to CDN URLs with WebP auto-conversion, resizing, and hotspot cropping. Use `urlFor(image).width(N).auto('format').url()` as the `src` for next/image.

**When to use:** All Sanity image fields (gallery, menu items, notre-histoire sections, homepage hero from Sanity).

```typescript
// src/sanity/lib/image.ts — NEW helper file
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { client } from './client';

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
```

```typescript
// Usage with next/image in a component:
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';

<Image
  src={urlFor(image).width(1200).auto('format').url()}
  alt={alt}
  width={1200}
  height={800}
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
/>
```

**Key method chain:**
- `.width(N)` — set max width in px
- `.auto('format')` — serve WebP to supporting browsers
- `.fit('crop')` — crop to exact dimensions (respects hotspot)
- `.url()` — returns final URL string

**Source:** [Sanity Presenting Images Docs](https://www.sanity.io/docs/apis-and-sdks/presenting-images) (HIGH confidence — official docs fetched)

### Pattern 4: Motion Scroll Animations with whileInView

**What:** Use `m.div` (from `motion/react-m`) with `whileInView` and `viewport={{ once: true }}` for fade-in-up on section entry. The `LazyMotion` + `domAnimation` wrapper is already in `MotionProvider.tsx`. Confirmed: `whileInView` is part of `domAnimation` features.

**When to use:** Notre Histoire sections (HIST-03), homepage sections where animation adds brand value.

```typescript
// src/components/ui/FadeInUp.tsx — NEW reusable animation wrapper
'use client';

import * as m from 'motion/react-m';

interface FadeInUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInUp({ children, delay = 0, className }: FadeInUpProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}
```

```typescript
// Notre Histoire section stagger usage:
<FadeInUp delay={0}>
  <h2 className="font-display text-4xl">Passion du Ramen</h2>
</FadeInUp>
<FadeInUp delay={0.1}>
  <p className="font-body text-base text-umai-text-muted">{section.body}</p>
</FadeInUp>
```

**Source:** Training data confirmed by [Motion React motion component docs](https://motion.dev/docs/react-motion-component) search result + Phase 1 Research LazyMotion pattern

**IMPORTANT — LazyMotion Bug:** There is a confirmed open bug (GitHub issue #3091, reported December 2025, not yet fixed as of research date) affecting `import * as m from 'motion/react-m'` in some bundler contexts with `motion@^12.4.3`. The project's current `motion@12.34.3` may be affected. MobileMenu.tsx already uses this pattern and works, suggesting the project build is not hitting the bug. If viewport animations fail silently, the workaround is to use `useInView` hook from `motion/react` instead of `whileInView`, with a `useState` to control animate vs initial state. Monitor during implementation; don't pre-emptively work around unless confirmed broken.

### Pattern 5: Sticky Menu Sub-Navigation with IntersectionObserver

**What:** A sticky nav bar above the menu content tracks which category section is in view using the native `IntersectionObserver` API. No library needed.

**When to use:** Menu page only (MENU-02).

```typescript
// src/components/menu/MenuStickyNav.tsx
'use client';

import { useEffect, useState } from 'react';

interface MenuStickyNavProps {
  categories: Array<{ slug: { current: string }; name: { fr: string } }>;
}

export function MenuStickyNav({ categories }: MenuStickyNavProps) {
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
        { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-20% 0px -60% 0px' }
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
              {cat.name.fr}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

**Note on `top-20`:** The sticky header is `h-20` (80px). The menu sub-nav needs `top-20` to stick below it. If the sub-nav is on the page, category sections need `scroll-padding-top` on `<html>` or `<body>` to account for stacked sticky elements.

**Source:** Training data + [IntersectionObserver for active nav — Fishtank](https://www.getfishtank.com/insights/enhance-your-nextjs-application-with-intersection-observer-api) (MEDIUM confidence)

### Pattern 6: Lightbox with yet-another-react-lightbox + next/image

**What:** `yet-another-react-lightbox` v3 supports keyboard nav (arrow keys, Escape), mobile swipe, and React 19. Use the custom `render.slide` prop with the Next.js Image component for optimized loading.

**When to use:** Gallery page (GLRY-02).

```typescript
// src/components/gallery/GalleryLightbox.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Lightbox, {
  isImageFitCover,
  isImageSlide,
  useLightboxProps,
  useLightboxState,
} from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { urlFor } from '@/sanity/lib/image';

// Custom renderer using next/image
function NextJsImage({ slide, offset, rect }: {
  slide: { src: string; width: number; height: number; blurDataURL?: string };
  offset: number;
  rect: { width: number; height: number };
}) {
  const { on: { click }, carousel: { imageFit } } = useLightboxProps();
  const { currentIndex } = useLightboxState();
  const cover = isImageSlide(slide) && isImageFitCover(slide, imageFit);

  if (!isImageSlide(slide) || typeof slide.width !== 'number') return undefined;

  const width = !cover
    ? Math.round(Math.min(rect.width, (rect.height / slide.height) * slide.width))
    : rect.width;
  const height = !cover
    ? Math.round(Math.min(rect.height, (rect.width / slide.width) * slide.height))
    : rect.height;

  return (
    <div style={{ position: 'relative', width, height }}>
      <Image
        fill
        alt={slide.alt ?? ''}
        src={slide.src}
        loading="eager"
        draggable={false}
        style={{ objectFit: cover ? 'cover' : 'contain' }}
        sizes={`${Math.ceil((width / window.innerWidth) * 100)}vw`}
        onClick={offset === 0 ? () => click?.({ index: currentIndex }) : undefined}
      />
    </div>
  );
}

interface GalleryLightboxProps {
  photos: Array<{
    _id: string;
    image: { asset: { _ref: string } };
    alt: { fr: string; en?: string; de?: string };
  }>;
  locale: string;
}

export function GalleryLightbox({ photos, locale }: GalleryLightboxProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = photos.map((photo) => ({
    src: urlFor(photo.image).width(1600).auto('format').url(),
    width: 1600,
    height: 1067, // default 3:2 aspect; Sanity provides actual dimensions via image metadata
    alt: photo.alt[locale as 'fr' | 'en' | 'de'] ?? photo.alt.fr,
  }));

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, i) => (
          <button
            key={photo._id}
            onClick={() => { setIndex(i); setOpen(true); }}
            className="aspect-[4/3] relative overflow-hidden group"
          >
            <Image
              src={urlFor(photo.image).width(600).auto('format').url()}
              alt={photo.alt[locale as 'fr' | 'en' | 'de'] ?? photo.alt.fr}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        render={{ slide: NextJsImage }}
      />
    </>
  );
}
```

**Source:** [yet-another-react-lightbox Next.js example](https://yet-another-react-lightbox.com/examples/nextjs) (HIGH confidence — official docs fetched)

### Pattern 7: Google Maps Embed with Native Lazy Loading

**What:** The HTML `loading="lazy"` attribute on `<iframe>` is supported by all modern browsers and defers loading until the iframe is near the viewport. No library needed.

**When to use:** Reservation page and Infos page (INTG-05, INFO-02, RESV-02).

```typescript
// Lazy-loaded Google Maps iframe — no JS required
<div className="aspect-[16/9] w-full rounded overflow-hidden">
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2643.9...!2d7.7567...!3d48.5736...!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4796c84b...!2s5+Rue+des+Orphelins%2C+67000+Strasbourg!5e0!3m2!1sfr!2sfr"
    width="100%"
    height="100%"
    style={{ border: 0 }}
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    title="UMAI Ramen — 5 rue des Orphelins, Strasbourg"
    allowFullScreen
  />
</div>
```

**Source:** [Lazy Loading Google Maps — Intersection Observer](https://walterebert.com/blog/lazy-loading-google-maps-with-the-intersection-observer-api/) + MDN loading attribute (MEDIUM confidence — matches MDN spec)

### Pattern 8: Notre Histoire via Existing Page Schema

**What:** The existing `page` schema already has `sections[]` with `{heading: localeString, body: localeText, image}` — exactly what Notre Histoire needs. Use the `PAGE_QUERY` with `slug: 'notre-histoire'` to fetch. No new schema required.

**When to use:** Notre Histoire page (HIST-01, HIST-02).

```typescript
// GROQ — extend PAGE_QUERY or create specific NOTRE_HISTOIRE_QUERY
export const NOTRE_HISTOIRE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "notre-histoire"][0]{
    title,
    sections[]{
      heading,
      body,
      image
    }
  }
`);
```

### Pattern 9: Locale-aware Sanity Content Rendering

**What:** All Sanity text fields use the `localeString` / `localeText` pattern — objects with `fr`, `en`, `de` keys. Pages receive `locale` from params and index into the appropriate language key.

**When to use:** Every component that renders Sanity text content.

```typescript
// Helper — add to a utils file or inline
function localized(
  field: { fr: string; en?: string; de?: string } | null | undefined,
  locale: string,
  fallback = ''
): string {
  if (!field) return fallback;
  return field[locale as keyof typeof field] ?? field.fr ?? fallback;
}

// Usage:
<h2 className="font-display">{localized(category.name, locale)}</h2>
<p className="font-body">{localized(item.description, locale)}</p>
```

### Anti-Patterns to Avoid

- **Using `priority` prop on next/image in Next.js 16:** `priority` is deprecated. Use `preload` for hero LCP images and `loading="eager"` where needed. Not an error but generates deprecation warnings.
- **Using `useTranslations` in async Server Components without setRequestLocale:** Will make the route dynamic (SSR). Always call `setRequestLocale(locale)` at top of every page. Use `getTranslations` (async) in async page components.
- **Building a custom lightbox from scratch:** Keyboard trap, focus management, swipe velocity, image preloading — each of these has edge cases. Use `yet-another-react-lightbox`.
- **Direct `<img>` tags for Sanity images:** Bypasses next/image optimization pipeline. Always use next/image with urlFor for Sanity images.
- **Linking to /menu with hash fragments via Next.js Link:** Hash links (`/menu#category-ramen`) work via native browser behavior. Pass `scroll={false}` to Link to prevent scroll-to-top override.
- **Rendering unavailable items with "sold out" state:** MENU-06 is explicit — unavailable items should not render at all. The GROQ query already filters `available == true`. Do not add conditional "sold out" rendering.
- **Importing `AnimatePresence` or `motion` (full) from `motion/react` inside LazyMotion-wrapped components:** When using LazyMotion, all animated components must use `m.*` from `motion/react-m`. Mixing `motion.div` with `m.div` in a LazyMotion tree re-loads the full bundle.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image lightbox with keyboard + swipe | Custom modal + useEffect keyboard listeners | `yet-another-react-lightbox` | Focus trap, swipe velocity, preloading, a11y — each has edge cases; library is 4.7KB |
| Sanity CDN image URL with WebP, resize, crop | String concatenation: `cdn.sanity.io/images/${projectId}/...` | `@sanity/image-url` urlFor builder | Hotspot crop math, auto-format content negotiation, exact CDN URL format |
| Scroll-spy for sticky nav | Polling with setInterval | `IntersectionObserver` native API | No polling, browser-native, zero dependencies for this use case |
| Google Maps lazy load | Custom IntersectionObserver wrapper | Native `loading="lazy"` on iframe | Supported in all modern browsers, zero JS |

**Key insight:** Phase 2 features look deceptively simple (a lightbox, a sticky nav) but each has specific accessibility and performance requirements that a maintained library handles in ~4KB, vs. 300+ lines of brittle custom code.

---

## Common Pitfalls

### Pitfall 1: next/image `priority` vs `preload` in Next.js 16

**What goes wrong:** Using `priority` prop on the hero image generates a deprecation warning in Next.js 16 console output. Functionality works but signals outdated usage.

**Why it happens:** Next.js 16 renamed `priority` to `preload` to clarify semantics.

**How to avoid:** Use `preload` on the hero `<Image>` component. Use `loading="eager"` for above-fold images that contribute to LCP. Do not use both `preload` and `loading` on the same image.

**Warning signs:** Next.js dev console warning: `"The 'priority' prop is deprecated..."`

### Pitfall 2: Sticky Sub-Nav Covering Section Headings on Scroll

**What goes wrong:** Clicking a category in the sticky menu scrolls to the section, but the sticky header (80px) + sticky sub-nav (~48px) cover the top of the section.

**Why it happens:** Browser `scrollIntoView` scrolls the element to the top of the viewport, not accounting for stacked sticky elements.

**How to avoid:** Add `scroll-padding-top` on `<html>` or the `<main>` element equal to header height + sub-nav height. In Tailwind: apply it inline or add to globals.css:
```css
html { scroll-padding-top: 132px; } /* 80px header + ~52px sub-nav */
```
Alternatively use `scrollIntoView({ block: 'start' })` with the CSS padding approach.

**Warning signs:** Section heading disappears behind sticky elements when clicking category nav items.

### Pitfall 3: LazyMotion + motion/react-m Bug (Potential)

**What goes wrong:** Animations using `whileInView` with `m.div` silently fail — elements jump to final state or don't animate at all.

**Why it happens:** Confirmed open bug in `motion@^12.4.3` with `motion/react-m` namespace import under certain bundler conditions (GitHub issue #3091, open as of December 2025).

**How to avoid:** MobileMenu.tsx already uses this pattern and works (confirming the project build is not affected). If new scroll animations fail during implementation, use the fallback:
```typescript
// Fallback if whileInView fails with m components:
import { useInView } from 'motion/react';
import * as m from 'motion/react-m';
const ref = useRef(null);
const isInView = useInView(ref, { once: true });
// animate based on isInView boolean
```

**Warning signs:** Elements appear instantly without animation. No console errors.

### Pitfall 4: Sanity Image Dimensions Unknown for Lightbox

**What goes wrong:** `yet-another-react-lightbox` NextJsImage renderer requires `slide.width` and `slide.height` to calculate aspect ratio. Without them, the renderer falls through to undefined.

**Why it happens:** Sanity image asset refs don't include dimensions by default unless queried explicitly.

**How to avoid:** Extend the GALLERY_QUERY to include image metadata dimensions:
```groq
*[_type == "gallery"] | order(order asc) {
  _id,
  title,
  alt,
  "image": image{
    asset->{
      _id,
      url,
      metadata {
        dimensions { width, height }
      }
    }
  }
}
```
Then use `image.asset.metadata.dimensions.width/height` in the slide object.

**Warning signs:** Lightbox shows no image, or image doesn't size correctly.

### Pitfall 5: i18n Messages Missing for New Pages

**What goes wrong:** `useTranslations('menu')` or `getTranslations({ namespace: 'reservation' })` throws at runtime if the namespace doesn't exist in `fr.json`, `en.json`, `de.json`.

**Why it happens:** Messages files must be updated in all three languages every time a new page namespace is added.

**How to avoid:** When adding a new page, update all three message files simultaneously. The FR file is primary — EN and DE can start with FR placeholders. TypeScript will not catch missing i18n keys at compile time.

**Warning signs:** Runtime error: `Missing messages for namespace "..."` or empty strings for translation keys.

### Pitfall 6: Menu Extras and Formules Missing from Sanity

**What goes wrong:** MENU-04 (Extras grid) and MENU-05 (Formules) have no corresponding Sanity schema types in Phase 1. Without schemas, there's no Studio UI to enter content and no GROQ queries to fetch it.

**Why it happens:** Phase 1 only scaffolded the schemas explicitly requested. Extras and Formules are new in Phase 2.

**How to avoid:** Create `menuExtra.ts` and `menuFormule.ts` schema types at the start of the menu page plan task, register them in `schemaTypes/index.ts`, and add corresponding GROQ queries before building the page components. Run `npm run typegen` after schema changes.

**Warning signs:** TypeGen generates no types for extras/formules. Studio has no way to enter these content types.

### Pitfall 7: `next.config.ts` qualities Config in Next.js 16

**What goes wrong:** Using `quality={100}` on a next/image component fails with a 400 Bad Request from the Image Optimization API because Next.js 16 restricts allowed quality values to the `qualities` array in next.config.

**Why it happens:** Next.js 16 changed the default `qualities` to `[75]` — only 75 is allowed by default. Any other quality value gets rounded to the nearest allowed value.

**How to avoid:** If any component needs a quality other than 75 (e.g., the hero at 85 or 90), add it to `next.config.ts`:
```typescript
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  qualities: [75, 85, 90],
},
```

**Warning signs:** Image optimization API returns 400 for specific quality values in dev or production.

---

## Code Examples

Verified patterns from official sources:

### Hero Image (Next.js 16 — official docs pattern)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/components/image
// Next.js 16: use preload (not priority) for LCP element
<div className="relative h-screen">
  <Image
    src={heroImageUrl}
    alt=""
    fill
    preload          // Next.js 16 LCP optimization
    loading="eager"  // Load immediately
    className="object-cover object-center"
    sizes="100vw"
  />
  <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
</div>
```

### Sanity Image URL Builder (official Sanity pattern)
```typescript
// Source: https://www.sanity.io/docs/apis-and-sdks/presenting-images
import imageUrlBuilder from '@sanity/image-url';
import { client } from './client';

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Usage:
const src = urlFor(image).width(800).auto('format').url();
// → https://cdn.sanity.io/images/.../800?auto=format
```

### Lightbox Slide Pattern with Sanity Image Metadata (verified from official docs)
```typescript
// Source: https://yet-another-react-lightbox.com/examples/nextjs
// Extend GALLERY_QUERY to include dimensions:
export const GALLERY_QUERY = defineQuery(`
  *[_type == "gallery"] | order(order asc) {
    _id,
    title,
    alt,
    "image": image.asset->{
      url,
      metadata { dimensions { width, height } }
    }
  }
`);

// Map to lightbox slides:
const slides = photos.map((p) => ({
  src: `${p.image.url}?auto=format&w=1600`,
  width: p.image.metadata.dimensions.width,
  height: p.image.metadata.dimensions.height,
  alt: p.alt[locale] ?? p.alt.fr,
}));
```

### Menu Item Row Component Pattern
```typescript
// Verified via project schema inspection
interface MenuItemProps {
  name: { fr: string; en?: string; de?: string };
  nameJp?: string;
  price: number;
  description?: { fr: string; en?: string; de?: string };
  isVegetarian: boolean;
  isGlutenFree: boolean;
  locale: string;
}

export function MenuItem({ name, nameJp, price, description, isVegetarian, isGlutenFree, locale }: MenuItemProps) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-umai-line last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-xl uppercase tracking-wide">{name[locale] ?? name.fr}</h3>
          {nameJp && (
            <span className="font-jp text-xs text-umai-accent opacity-70">{nameJp}</span>
          )}
          {isVegetarian && <DietaryBadge type="vegetarian" />}
          {isGlutenFree && <DietaryBadge type="gluten-free" />}
        </div>
        {description && (
          <p className="font-body text-sm text-umai-text-muted mt-1">{description[locale] ?? description.fr}</p>
        )}
      </div>
      <span className="font-body text-base font-medium tabular-nums shrink-0">
        {price.toFixed(2).replace('.', ',')} €
      </span>
    </div>
  );
}
```

---

## New Sanity Schemas Required

Two schemas must be created at the start of Plan 02-02 (Menu page):

### menuExtra Schema (MENU-04)
```typescript
// src/sanity/schemaTypes/menuExtra.ts
export const menuExtra = defineType({
  name: 'menuExtra',
  title: 'Menu Extra',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'price', title: 'Price (€)', type: 'number', validation: (r) => r.required().positive() }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
    defineField({ name: 'available', title: 'Available', type: 'boolean', initialValue: true }),
  ],
});
```

### menuFormule Schema (MENU-05)
```typescript
// src/sanity/schemaTypes/menuFormule.ts
export const menuFormule = defineType({
  name: 'menuFormule',
  title: 'Menu Formule',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'price', title: 'Price (€)', type: 'number', validation: (r) => r.required().positive() }),
    defineField({ name: 'description', title: 'Description', type: 'localeText' }),
    defineField({
      name: 'includedItems',
      title: 'Included Items',
      type: 'array',
      of: [{ type: 'localeString' }],
      description: 'List of what is included in this formule',
    }),
    defineField({ name: 'order', title: 'Order', type: 'number' }),
  ],
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `priority` prop on next/image | `preload` prop | Next.js 16 | Use `preload` + `loading="eager"` for hero; `priority` still works but deprecated |
| `images.domains` in next.config | `images.remotePatterns` | Next.js 14+ | Already using `remotePatterns` correctly in project |
| framer-motion package | motion package, import `motion/react` | motion v10+ | Already established in Phase 1; import from `motion/react` |
| `motion.div` with LazyMotion | `m.div` from `motion/react-m` | motion v10+ | Established in Phase 1 (MobileMenu.tsx confirms) |
| Global `qualities: [25,50,75,100]` default | `qualities: [75]` default | Next.js 16 | Must explicitly allow other quality values in next.config.ts |
| Masonry grid for gallery | CSS grid with `aspect-ratio` | Context decision | Uniform aspect ratio chosen for brand refinement |

**Deprecated/outdated:**
- `priority` prop on next/image: deprecated in v16, use `preload` — still functional but logs warning
- `images.domains`: deprecated since v14, use `remotePatterns` — already migrated in project

---

## Open Questions

1. **Notre Histoire photo selection**
   - What we know: 29 professional photos are in `/photos/` directory. Final selection is pending from owner (noted in STATE.md).
   - What's unclear: Which photos are for hero, which for gallery, which for Notre Histoire sections.
   - Recommendation: Use the first available photo from `/photos/` as a local placeholder for the hero. For Notre Histoire and gallery, use placeholder images from the Sanity CDN once initial content is entered. The owner can update via Studio once URLs are confirmed.

2. **Menu Extras vs Formule Category Distinction**
   - What we know: MENU-04 says "extras grid" (supplementary items with price, no description). MENU-05 says "formules" (Menu Gyoza, Menu Enfant with included items). These are distinct content types.
   - What's unclear: Whether extras should be a separate schema or a special category in `menuCategory`.
   - Recommendation: Separate schemas (`menuExtra`, `menuFormule`) as defined above — cleaner editorial model, no ambiguity for the owner, precise GROQ queries.

3. **motion/react-m LazyMotion Bug Impact**
   - What we know: Bug exists in `motion@^12.4.3`, open as of December 2025, not fixed. Current project uses `motion@12.34.3`.
   - What's unclear: Whether the UMAI project's specific bundler configuration triggers the bug.
   - Recommendation: MobileMenu.tsx already uses `m` components successfully. Proceed with the established pattern. If whileInView animations fail during development, implement the `useInView` hook fallback (see Pitfall 3 above).

4. **Google Maps Embed URL**
   - What we know: Address is 5 rue des Orphelins, 67000 Strasbourg. The Footer.tsx hardcodes a Google Maps search URL.
   - What's unclear: Whether a proper embed URL (from Google Maps "Embed a map" feature) is available or if it must be generated.
   - Recommendation: Use Google Maps "Embed a map" to get an embed URL for the iframe. The share/embed URL format is: `https://www.google.com/maps/embed/v1/place?key=API_KEY&q=5+rue+des+Orphelins+67000+Strasbourg`. Alternatively, use the static embed URL (no API key required) from the Google Maps UI. Store in `siteSettings` is an option but the address is unlikely to change — inline the embed URL in the component.

---

## Sources

### Primary (HIGH confidence)
- [Next.js Image Component API Reference v16](https://nextjs.org/docs/app/api-reference/components/image) — `preload` vs `priority`, `fill`, `sizes`, `qualities` config, background image pattern — fetched live 2026-02-23
- [Sanity Presenting Images Docs](https://www.sanity.io/docs/apis-and-sdks/presenting-images) — `@sanity/image-url` setup, urlFor, auto format, responsive srcSet — fetched live 2026-02-23
- [yet-another-react-lightbox Next.js Example](https://yet-another-react-lightbox.com/examples/nextjs) — NextJsImage render pattern, React 19 compatibility confirmed — fetched live 2026-02-23
- Project codebase inspection — All existing schemas, queries, components, and patterns confirmed by reading source files

### Secondary (MEDIUM confidence)
- [next-intl Server & Client Components](https://next-intl.dev/docs/environments/server-client-components) — `getTranslations` async pattern, `setRequestLocale` requirement — confirmed via WebSearch of official docs
- [Motion React motion component docs](https://motion.dev/docs/react-motion-component) — `whileInView`, `viewport` prop — confirmed via WebSearch; direct fetch returned CSS not docs
- [IntersectionObserver sticky nav — Fishtank](https://www.getfishtank.com/insights/enhance-your-nextjs-application-with-intersection-observer-api) — IntersectionObserver pattern for active section tracking
- [Lazy Loading Google Maps](https://walterebert.com/blog/lazy-loading-google-maps-with-the-intersection-observer-api/) — native `loading="lazy"` on iframe confirmed

### Tertiary (LOW confidence — verify at implementation)
- [GitHub issue #3091 — LazyMotion bug motion@12.4.3+](https://github.com/motiondivision/motion/issues/3091) — confirmed open as of December 2025; impact on this project unconfirmed (MobileMenu.tsx works without issues, suggesting limited impact)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages already installed, versions verified in package.json
- Architecture: HIGH — patterns derived from official docs, project code inspection, and Phase 1 established patterns
- New schema designs (menuExtra, menuFormule): HIGH — follows exact same patterns as existing menuCategory and menuItem schemas
- LazyMotion whileInView: MEDIUM — bug report exists but MobileMenu.tsx evidence suggests current project build is unaffected
- Google Maps embed URL: MEDIUM — pattern is standard but exact embed URL must be generated from Google Maps UI

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable stack; motion bug status may change; check GitHub issue before implementing scroll animations)
