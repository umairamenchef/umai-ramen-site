# Phase 1: Foundation - Research

**Researched:** 2026-02-22
**Domain:** Next.js 16 scaffold + Sanity v5 CMS + next-intl v4 routing + Tailwind CSS 4 design system + motion v12 animations
**Confidence:** HIGH (all critical claims verified against official docs or official GitHub; see sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

All implementation decisions delegated to Claude. No locked choices from user beyond what is in REQUIREMENTS.md and STATE.md.

Stack is locked (from STATE.md Accumulated Context):
- Next.js 16.1.6, React 19.2
- Sanity v5
- next-intl v4.8.3
- motion v12 (import from `motion/react`)
- Tailwind CSS 4 (configured via `@theme {}` in CSS, NOT tailwind.config.js)
- Middleware renamed to proxy.ts in Next.js 16 (not middleware.ts)
- i18n strategy: field-level localeString in Sanity (NOT @sanity/document-internationalization)

### Claude's Discretion

**Header & CTAs**
- Navigation items, order, and grouping
- CTA button labels and styling (Réserver / Commander or variants)
- Logo placement and behavior on scroll (sticky behavior)
- Language switcher placement and format

**Mobile navigation**
- Hamburger menu slide direction and animation
- Mobile menu content (nav links, CTAs, language switcher)
- Bottom sticky bar button labels, icons, and layout

**Decorative identity**
- Seigaiha pattern prominence and placement (footer confirmed, elsewhere TBD)
- Dotted border usage frequency and weight
- JP micro-label style (font size, opacity, placement relative to sections)
- Overall balance: refined and subtle Japanese influence, not overwhelming
- Line-art icon style for the brand

**Footer layout**
- Content distribution across 4 columns (logo/baseline, contact, nav links, social/legal)
- Social links included (Instagram confirmed, Facebook confirmed)
- Legal links placement
- Decorative element integration (seigaiha pattern, line-art)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | Project scaffolded with Next.js 16, React 19.2, TypeScript, Tailwind CSS 4, App Router | Next.js 16 upgrade guide confirms stack; Tailwind 4 PostCSS setup documented |
| FOUND-02 | Sanity v5 CMS initialized with embedded Studio accessible at /studio | next-sanity README: `app/studio/[[...index]]/page.tsx` with Studio component |
| FOUND-03 | Trilingual routing FR/EN/DE via next-intl with /{locale}/... URL structure | next-intl v4 routing docs: defineRouting + [locale] segment + proxy.ts |
| FOUND-04 | ISR with 60s revalidation baseline for all content pages | `export const revalidate = 60` in layout + sanityFetch time-based revalidation |
| FOUND-05 | Sanity field-level i18n (localeString) on all text content fields | Sanity localization docs: localeString object type pattern confirmed |
| FOUND-06 | sanityFetch helper with tag-based revalidation and TypeGen types for all GROQ queries | next-sanity README: sanityFetch + defineQuery + sanity-typegen.json |
| FOUND-07 | Sanity webhook endpoint for on-demand revalidation with HMAC signature validation | next-sanity: parseBody + isValidSignature pattern from `next-sanity/webhook` |
| DSGN-01 | Tailwind CSS 4 theme tokens: ivoire #F5F0E8, vert accent #77967A, fonts | `@theme {}` in globals.css; `@theme inline` for next/font variable linking |
| DSGN-02 | Self-hosted fonts via next/font with zero layout shift | `next/font/google` auto-self-hosts; size-adjust fallback prevents CLS |
| DSGN-03 | Decorative elements: seigaiha SVG, dotted borders, line-art icons, JP micro-labels | Inline SVG or CSS `background-image: url('data:...')` for repeating pattern |
| DSGN-04 | Responsive layout: max-width 1200px, 12/8/4 col grid, abundant whitespace | Tailwind `max-w-[1200px]` + grid utilities; design system preview reference |
| DSGN-05 | Motion wrappers using LazyMotion + m components for tree-shaking | `LazyMotion` + `domAnimation` from `motion/react`; ~4.6kb vs 34kb full bundle |
| LAYT-01 | Sticky header with logo center, navigation left, reserve/order CTAs right | Design system preview HTML documents exact layout |
| LAYT-02 | Mobile hamburger menu with slide-in navigation | Controlled via `useState` + motion `AnimatePresence` + `m.nav` |
| LAYT-03 | Mobile sticky bottom bar with reserve + order CTAs | Fixed position bottom-0 with Tailwind; hidden on md+ breakpoint |
| LAYT-04 | Footer with 4 columns: logo/baseline, contact, navigation links, social/legal | Design system preview: grid-template-columns: 2fr 1fr 1fr 1fr |
| LAYT-05 | Footer includes seigaiha pattern and line-art decoration | SVG as absolute-positioned background element (opacity 0.04) |
</phase_requirements>

---

## Summary

Phase 1 establishes the structural foundation of the UMAI Ramen site: a Next.js 16 App Router project with Tailwind CSS 4 design tokens, Sanity v5 CMS with embedded Studio at `/studio`, trilingual FR/EN/DE routing via next-intl v4 with all routes statically generated (ISR 60s), and shared layout components (Header, Footer, MobileBar) implementing the full UMAI design system.

The most critical decision already locked in STATE.md is **proxy.ts instead of middleware.ts** — this is a Next.js 16 breaking change where the middleware file is renamed and the exported function changes from `middleware` to `proxy`. The second highest-risk area is **ensuring static rendering works end-to-end with next-intl**: the `setRequestLocale()` call must precede all next-intl API calls in both layouts AND pages, and `generateStaticParams` must return all locale variants so Next.js pre-renders them at build time showing `○` not `λ`.

For Sanity, the field-level localeString pattern (a single Sanity document with `{fr: "...", en: "...", de: "..."}` object fields) is confirmed as the correct approach for this project — it avoids the complexity of document-level i18n while keeping all language content in one editorial view. TypeGen is configured via `sanity-typegen.json` and runs as a `prebuild`/`predev` npm script so GROQ result types are always fresh.

**Primary recommendation:** Scaffold with `create-next-app@16` selecting App Router + TypeScript + Tailwind, immediately rename `middleware.ts → proxy.ts`, set up next-intl v4 with all three locale patterns, confirm `next build` shows `○` for all `[locale]` routes before building any UI components.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | React framework, App Router, ISR, image optimization | Stack locked; Turbopack default, proxy.ts, async params |
| react / react-dom | 19.2 | UI runtime | Required by Next.js 16; includes View Transitions, Activity |
| typescript | 5.x | Type safety | Required by Next.js 16 minimum TypeScript 5.1 |
| tailwindcss | 4.x | Utility CSS | Stack locked; CSS-first config with `@theme {}` |
| @tailwindcss/postcss | 4.x | PostCSS plugin for Tailwind 4 | Tailwind 4 PostCSS moved to separate package |
| next-intl | 4.8.3 | Trilingual routing and translations | Stack locked; v4 has ESM-only, TypeScript 5 required |
| next-sanity | 9.x (latest) | Sanity toolkit for Next.js: sanityFetch, TypeGen, webhook | Official Sanity-maintained toolkit |
| sanity | 5.x | Sanity Studio and schema definition | Stack locked; v5 requires React 19.2 |
| motion | 12.x | Animation library (formerly framer-motion) | Stack locked; import from `motion/react` not `framer-motion` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sanity/vision | 5.x | GROQ query testing in Studio | Dev convenience, included in Studio config |
| postcss | latest | CSS processing | Required by Tailwind 4 PostCSS setup |
| @types/react / @types/react-dom | 19.x | TypeScript types | Always with TypeScript + React |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| field-level localeString | @sanity/document-internationalization | Document-level = separate docs per language; more Sanity API requests, more complex GROQ; overkill for restaurant site |
| motion LazyMotion | full `motion` import | Full import = 34kb; LazyMotion+domAnimation = ~4.6kb; performance requirement |
| next/font/google | self-hosted woff2 files | next/font auto-self-hosts at build time, provides size-adjust fallback; better DX |

**Installation:**

```bash
# Create Next.js 16 app (select: App Router, TypeScript, Tailwind, src/ dir, no ESLint via next lint removal)
npx create-next-app@16 umai2k26 --typescript --tailwind --app --src-dir

# Add Sanity
npm install next-sanity sanity @sanity/vision

# Add next-intl
npm install next-intl

# Add motion
npm install motion

# Add Tailwind PostCSS (Tailwind 4 separates the PostCSS plugin)
npm install -D @tailwindcss/postcss postcss
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── [locale]/           # All public content routes (FR/EN/DE)
│   │   ├── layout.tsx      # setRequestLocale + NextIntlClientProvider + LazyMotion wrapper
│   │   ├── page.tsx        # Homepage (Phase 2)
│   │   └── ...             # Other pages (Phase 2)
│   ├── studio/
│   │   └── [[...index]]/
│   │       └── page.tsx    # Embedded Sanity Studio ('use client')
│   ├── api/
│   │   └── revalidate/
│   │       └── route.ts    # Sanity webhook + HMAC validation (FOUND-07, Phase 3)
│   ├── globals.css         # @import "tailwindcss" + @theme {} tokens
│   └── layout.tsx          # Root layout (html lang, fonts applied)
├── i18n/
│   ├── routing.ts          # defineRouting({locales, defaultLocale})
│   ├── request.ts          # getRequestConfig (message loading)
│   └── navigation.ts       # createNavigation wrappers (Link, useRouter, etc.)
├── sanity/
│   ├── schemaTypes/
│   │   ├── index.ts        # Schema type registry
│   │   ├── siteSettings.ts
│   │   ├── menuCategory.ts
│   │   ├── menuItem.ts
│   │   ├── gallery.ts
│   │   ├── page.ts
│   │   └── localeString.ts # Reusable field-level i18n object type
│   ├── lib/
│   │   ├── client.ts       # createClient + sanityFetch helper
│   │   └── queries.ts      # defineQuery GROQ queries
│   ├── structure.ts        # Studio structure (optional)
│   └── sanity.config.ts    # Studio config
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileBar.tsx
│   │   └── MobileMenu.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── SectionHeader.tsx
│       └── SeigahaPattern.tsx
├── messages/               # Translation dictionaries
│   ├── fr.json
│   ├── en.json
│   └── de.json
└── proxy.ts               # next-intl middleware (RENAMED from middleware.ts in Next.js 16)
```

### Pattern 1: proxy.ts for Locale Routing (Next.js 16)

**What:** In Next.js 16, `middleware.ts` is renamed to `proxy.ts` and the exported function changes from `middleware` to `proxy`. next-intl's `createMiddleware` is unchanged — only the file name and export name differ.

**When to use:** Always — this is required for locale-prefix routing to work.

```typescript
// src/proxy.ts — NOT middleware.ts (Next.js 16 breaking change)
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export const proxy = createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
```

**Source:** [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) + [next-intl Routing Docs](https://next-intl.dev/docs/routing/middleware)

### Pattern 2: Static Rendering with next-intl v4

**What:** To get `○` (static) instead of `λ` (dynamic) in `next build`, you must call `setRequestLocale(locale)` BEFORE any next-intl API call in every layout AND page, AND export `generateStaticParams` from the root `[locale]/layout.tsx`.

**When to use:** In every layout and page inside `app/[locale]/`.

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

// This single export in layout.tsx generates ALL locale variants at build time
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params; // async in Next.js 16 (breaking change)
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale); // MUST be before any next-intl call
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Source:** [next-intl Setup Docs](https://next-intl.dev/docs/routing/setup)

### Pattern 3: next-intl v4 Routing Configuration

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en', 'de'],
  defaultLocale: 'fr',        // FR is primary for UMAI
  localePrefix: 'always'      // /fr, /en, /de — always show prefix
});
```

```typescript
// src/i18n/navigation.ts — typed navigation wrappers
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**Source:** [next-intl v4 Routing Configuration](https://next-intl.dev/docs/routing/configuration)

### Pattern 4: Tailwind CSS 4 Theme Tokens

**What:** `@theme {}` in `globals.css` replaces `tailwind.config.js`. UMAI tokens become Tailwind utilities AND CSS custom properties simultaneously.

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-umai-bg: #F5F0E8;
  --color-umai-bg-alt: #EDE8DC;
  --color-umai-text: #1A1A1A;
  --color-umai-text-muted: #6B6B6B;
  --color-umai-accent: #77967A;
  --color-umai-accent-hover: #657D67;
  --color-umai-line: #D4CFC5;
  --color-umai-line-dotted: #C5BFB3;
  --color-umai-black: #0A0A0A;

  /* Fonts — linked to next/font CSS variables via @theme inline */
  --font-display: var(--font-dm-serif-display);
  --font-body: var(--font-outfit);
  --font-jp: var(--font-noto-sans-jp);

  /* Layout */
  --max-width-content: 1200px;
  --spacing-section: 120px;
}
```

**PostCSS config:**

```js
// postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

**Source:** [Tailwind CSS 4 Theme Variables](https://tailwindcss.com/docs/theme)

### Pattern 5: next/font Self-Hosted Fonts

**What:** `next/font/google` downloads and self-hosts fonts at build time. No external font CDN requests. CSS variables are linked to `@theme inline` in Tailwind.

```typescript
// src/app/layout.tsx
import { DM_Serif_Display, Outfit, Noto_Sans_JP } from 'next/font/google';

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-dm-serif-display',
  display: 'swap',
  preload: true,
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
  preload: true,
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['300', '400'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false, // defer — decorative use only, 5% max visible content
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${dmSerifDisplay.variable} ${outfit.variable} ${notoSansJP.variable}`}>
      <body className="font-body bg-umai-bg text-umai-text">
        {children}
      </body>
    </html>
  );
}
```

**Source:** [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts)

### Pattern 6: Sanity v5 Field-Level localeString

**What:** A reusable Sanity object type that stores FR/EN/DE string values in one document. Correct approach for UMAI (as locked in STATE.md — NOT `@sanity/document-internationalization`).

```typescript
// src/sanity/schemaTypes/localeString.ts
import { defineType, defineField } from 'sanity';

const SUPPORTED_LANGUAGES = [
  { id: 'fr', title: 'Français', isDefault: true },
  { id: 'en', title: 'English' },
  { id: 'de', title: 'Deutsch' },
] as const;

export const localeString = defineType({
  name: 'localeString',
  title: 'Localized String',
  type: 'object',
  fieldsets: [
    {
      name: 'translations',
      title: 'Translations',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: SUPPORTED_LANGUAGES.map((lang) =>
    defineField({
      name: lang.id,
      title: lang.title,
      type: 'string',
      fieldset: lang.isDefault ? undefined : 'translations',
    })
  ),
});

// Usage in document schemas:
// name: defineField({ name: 'name', type: 'localeString' })
// GROQ access: name.fr, name.en, name.de
```

**Source:** [Sanity Localization Docs](https://www.sanity.io/docs/studio/localization)

### Pattern 7: sanityFetch Helper with Tag-Based Revalidation

**What:** Two modes — time-based ISR (60s default) OR tag-based (cache indefinitely, bust via webhook). Cannot mix both per fetch call.

```typescript
// src/sanity/lib/client.ts
import { createClient, type QueryParams } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2025-01-01',
  useCdn: true,
});

export async function sanityFetch<const Q extends string>({
  query,
  params = {},
  revalidate = 60,  // FOUND-04: 60s baseline ISR
  tags = [],
}: {
  query: Q;
  params?: QueryParams;
  revalidate?: number | false;
  tags?: string[];
}) {
  return client.fetch(query, params, {
    cache: 'force-cache',
    next: {
      // If tags provided, cache indefinitely (bust via revalidateTag in webhook)
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  });
}
```

**Source:** [next-sanity GitHub](https://github.com/sanity-io/next-sanity)

### Pattern 8: Sanity TypeGen Setup

```json
// sanity-typegen.json (project root)
{
  "path": "./src/**/*.{ts,tsx}",
  "schema": "./src/sanity/extract.json",
  "generates": "./src/sanity/types.ts"
}
```

```json
// package.json scripts additions
{
  "predev": "npm run typegen",
  "prebuild": "npm run typegen",
  "typegen": "sanity schema extract --path=src/sanity/extract.json && sanity typegen generate"
}
```

**Source:** [Sanity TypeGen Docs](https://www.sanity.io/docs/apis-and-sdks/sanity-typegen)

### Pattern 9: Embedded Sanity Studio at /studio

```typescript
// src/app/studio/[[...index]]/page.tsx
'use client'

import { NextStudio } from 'next-sanity/studio';
import config from '@/sanity/sanity.config';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

**Important:** No `generateStaticParams` here. Studio is not statically rendered. It's excluded from ISR by design.

**Source:** [next-sanity README](https://github.com/sanity-io/next-sanity)

### Pattern 10: LazyMotion Wrapper for Tree-Shaking (DSGN-05)

**What:** Wrapping with `LazyMotion` + `domAnimation` reduces animation bundle from ~34kb to ~4.6kb. Required for performance target of < 150KB per route.

```typescript
// src/components/layout/MotionProvider.tsx
'use client'

import { LazyMotion, domAnimation } from 'motion/react';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}
```

```typescript
// In [locale]/layout.tsx — wrap content inside MotionProvider
// Use m.div, m.nav, m.section etc. instead of motion.div

// In individual components:
import * as m from 'motion/react-m';

export function AnimatedCard() {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* content */}
    </m.div>
  );
}
```

**Source:** [Motion Reduce Bundle Size](https://motion.dev/docs/react-reduce-bundle-size)

### Pattern 11: Sanity Webhook HMAC Validation (FOUND-07)

**Note:** FOUND-07 appears in both Phase 1 requirements list and Phase 3 traceability table. Based on traceability table in REQUIREMENTS.md mapping FOUND-07 → Phase 3, implement the webhook API route structure in Phase 1 but complete HMAC + revalidateTag wiring in Phase 3.

```typescript
// src/app/api/revalidate/route.ts — stub for Phase 1, wired in Phase 3
import { parseBody } from 'next-sanity/webhook';
import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<{ _type: string }>(
      req,
      process.env.SANITY_REVALIDATE_SECRET
    );
    if (!isValidSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }
    await revalidateTag(body._type);
    return NextResponse.json({ revalidated: true, type: body._type });
  } catch (err) {
    return NextResponse.json({ message: String(err) }, { status: 500 });
  }
}
```

**Source:** [Sanity Webhooks Guide](https://www.sanity.io/guides/sanity-webhooks-and-on-demand-revalidation-in-nextjs)

### Anti-Patterns to Avoid

- **Using `middleware.ts` instead of `proxy.ts`:** Will work in Next.js 15 but broken in Next.js 16. The exported function MUST be named `proxy` not `middleware`.
- **Forgetting `await params`:** In Next.js 16, `params` in layouts/pages is `Promise<{locale: string}>`, not a plain object. Synchronous access is fully removed.
- **Calling next-intl hooks before `setRequestLocale`:** Route will become dynamic (SSR). Must call `setRequestLocale(locale)` first.
- **`generateStaticParams` only on page.tsx:** If only page has it, layout still renders dynamically. Put it on `[locale]/layout.tsx` to cover all routes.
- **Mixing time-based and tag-based revalidation in sanityFetch:** When `tags` array is non-empty, `revalidate` is ignored. Use one or the other per fetch.
- **Importing from `framer-motion` instead of `motion/react`:** The package is `motion`, import is `motion/react`. `framer-motion` still works as an alias but is the old package name.
- **Using `motion.div` with LazyMotion:** When using LazyMotion, must use `m.div` from `motion/react-m`, not `motion.div`. Mixing them will load the full bundle.
- **Tailwind `tailwind.config.js` for v4:** Tailwind 4 uses CSS-first configuration. No JS config file needed. Use `@theme {}` in CSS.
- **`@tailwindcss/postcss` as `tailwindcss` in postcss.config:** Tailwind 4 PostCSS plugin is `@tailwindcss/postcss`, not `tailwindcss`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font self-hosting with zero CLS | Manual woff2 download + @font-face | `next/font/google` | Auto size-adjust fallback, build-time optimization, no runtime requests |
| Locale detection and routing | Custom middleware parsing Accept-Language | `next-intl` createMiddleware in proxy.ts | Edge cases in RTL, fallback, cookie, domain modes; battle-tested |
| TypeScript types for GROQ | Hand-write return types | Sanity TypeGen (`sanity typegen generate`) | Schema-driven, always in sync, catches query errors at compile time |
| Sanity webhook signature validation | Custom HMAC-SHA256 | `parseBody` from `next-sanity/webhook` | Header name changes, timing attacks, edge cases handled |
| ISR cache invalidation | Custom cache layer | `revalidateTag()` + Sanity webhook | Next.js built-in; tag-based is fine-grained and production-proven |

**Key insight:** Every "custom solution" in this domain has security edge cases (HMAC timing attacks), subtle correctness issues (CLS font fallback), or version-coupling problems (Sanity API schema changes) that maintained libraries handle invisibly.

---

## Common Pitfalls

### Pitfall 1: proxy.ts Export Name

**What goes wrong:** File renamed to `proxy.ts` but export still named `middleware`. Next.js 16 silently ignores it or throws a build error.

**Why it happens:** Developers rename the file but miss the function export rename. The codemod handles both but manual migration often misses one.

**How to avoid:** Ensure both file name AND export name change: `export function proxy(request: Request) {}` or the default export via `export const proxy = createMiddleware(routing)`.

**Warning signs:** Locale routing not working, all requests going to default locale, 404 on `/fr`, `/en`, `/de`.

### Pitfall 2: Async params in Next.js 16

**What goes wrong:** `const { locale } = props.params` (synchronous) throws runtime error.

**Why it happens:** Next.js 16 fully removes synchronous access to `params` and `searchParams` (started deprecation in v15). The breaking change is complete in v16.

**How to avoid:** Always `const { locale } = await props.params`. Use `npx next typegen` to get `PageProps` and `LayoutProps` helper types.

**Warning signs:** `Error: params.locale accessed synchronously` or TypeScript errors on params access.

### Pitfall 3: Static Rendering Lost Due to Missing setRequestLocale

**What goes wrong:** `next build` shows `λ` (dynamic) instead of `○` (static) for locale routes. Site falls back to SSR mode.

**Why it happens:** next-intl hooks (`useTranslations`, `getTranslations`) opt into dynamic rendering unless `setRequestLocale` has been called to provide locale context without headers.

**How to avoid:** Call `setRequestLocale(locale)` at the top of EVERY layout and page in `app/[locale]/`, before any next-intl API call.

**Warning signs:** Build output shows `λ` for content routes. Pages take longer to load (SSR vs static).

### Pitfall 4: Noto Sans JP Bundle Size

**What goes wrong:** Noto Sans JP is a massive font (full character set covers ~10,000 kanji). `preload: true` fetches the entire Japanese subset at page load, destroying performance.

**Why it happens:** Japanese font sets are 5-10x larger than Latin fonts. The `japanese` subset alone is 1-2MB.

**How to avoid:** Set `preload: false` for Noto Sans JP. Use a minimal subset. Since JP text is decorative only (5% max), lazy loading is acceptable. Consider specifying only `latin` subset (covers romaji) if kanji are not needed, or use `display: 'swap'` with lazy load.

**Warning signs:** Large font transfer in Network tab. LCP degraded. Lighthouse flags render-blocking resources.

### Pitfall 5: Studio Route Included in Static Generation

**What goes wrong:** Including `/studio` in ISR/static paths causes build failures or runtime errors. Studio requires client-side rendering.

**Why it happens:** `generateStaticParams` at root level might accidentally include studio routes.

**How to avoid:** Studio is at `app/studio/[[...index]]/page.tsx` — separate from `app/[locale]/`. The `[[...index]]` is a catch-all specifically for Studio. Mark the page with `'use client'`. Do NOT add `export const revalidate` to the studio page.

**Warning signs:** Build error: `Studio component cannot be rendered on the server`.

### Pitfall 6: Tailwind 4 PostCSS Plugin Name Change

**What goes wrong:** `postcss.config.js` using `tailwindcss` plugin (v3 name) throws error with Tailwind v4.

**Why it happens:** Tailwind 4 moved PostCSS to a separate package `@tailwindcss/postcss`. Old plugin name `tailwindcss` no longer works as a PostCSS plugin.

**How to avoid:** Install `@tailwindcss/postcss` and use `{ '@tailwindcss/postcss': {} }` in postcss config. Do NOT install or configure `tailwind.config.js`.

**Warning signs:** Build error `[v4] It looks like you're trying to use tailwindcss directly as a PostCSS plugin`.

### Pitfall 7: FOUND-07 Phase Assignment Conflict

**What goes wrong:** FOUND-07 (Sanity webhook with HMAC) is listed in Phase 1 requirements in ROADMAP.md but REQUIREMENTS.md traceability maps it to Phase 3.

**Why it happens:** Traceability table was updated after roadmap creation. Traceability table is authoritative.

**How to avoid:** In Phase 1, create the stub route handler structure at `app/api/revalidate/route.ts` as scaffolding. Full HMAC validation and Sanity webhook configuration done in Phase 3. This satisfies Phase 1 "Foundation" without implementing Phase 3 concerns.

---

## Code Examples

### Sanity Schema: siteSettings (key document type)

```typescript
// src/sanity/schemaTypes/siteSettings.ts
import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  __experimental_actions: ['update', 'publish'], // prevent delete
  fields: [
    defineField({
      name: 'catchphrase',
      title: 'Catchphrase',
      type: 'localeString',
      // Default: "Nouilles fraiches. Bouillons maison."
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent Color',
      type: 'string',
      initialValue: '#77967A',
    }),
    defineField({
      name: 'clickCollectUrl',
      title: 'Gusty Click & Collect URL',
      type: 'url',
      // Placeholder — pending from owner (non-blocking)
    }),
  ],
});
```

### GROQ Query with TypeGen

```typescript
// src/sanity/lib/queries.ts
import { defineQuery } from 'next-sanity';

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0]{
    catchphrase,
    accentColor,
    clickCollectUrl
  }
`);

export const MENU_CATEGORIES_QUERY = defineQuery(`
  *[_type == "menuCategory"] | order(order asc) {
    _id,
    name,    // localeString: {fr, en, de}
    slug,
    "items": *[_type == "menuItem" && references(^._id) && available == true] | order(order asc) {
      _id,
      name,
      nameJp,
      description,
      price,
      isVegetarian,
      isGlutenFree
    }
  }
`);
```

### Header Component Pattern (LAYT-01)

```typescript
// src/components/layout/Header.tsx
// 'use client' — for hamburger state
'use client'

import { useState } from 'react';
import * as m from 'motion/react-m';
import { Link } from '@/i18n/navigation';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-umai-bg border-b border-umai-line backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-10 py-4 flex items-center justify-between">
        {/* Left: Navigation */}
        <nav className="hidden md:flex gap-8">
          {/* nav links */}
        </nav>

        {/* Center: Logo */}
        <Link href="/" className="font-display text-2xl tracking-widest uppercase">
          UMAÏ
        </Link>

        {/* Right: CTAs */}
        <div className="flex gap-3">
          {/* Réserver + Commander buttons */}
        </div>

        {/* Mobile: hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {/* hamburger icon */}
        </button>
      </div>
    </header>
  );
}
```

### MobileBar Component Pattern (LAYT-03)

```typescript
// src/components/layout/MobileBar.tsx
// Fixed bottom bar — only visible on mobile

export function MobileBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-umai-black border-t border-umai-line">
      <div className="grid grid-cols-2 h-16">
        <a
          href="https://gusty.app/booking/..."
          className="flex items-center justify-center text-white text-sm uppercase tracking-widest"
          target="_blank" rel="noopener noreferrer"
        >
          Réserver
        </a>
        <a
          href="https://www.ubereats.com/..."
          className="flex items-center justify-center bg-umai-accent text-white text-sm uppercase tracking-widest"
          target="_blank" rel="noopener noreferrer"
        >
          Commander
        </a>
      </div>
    </div>
  );
}
```

### Seigaiha Pattern (LAYT-05)

The seigaiha (青海波 — blue sea wave) is a Japanese geometric pattern of overlapping circles. Implementation as an inline SVG used as a CSS `background-image` data URI repeated in the footer.

```typescript
// src/components/ui/SeigahaPattern.tsx
// Renders as an absolutely positioned decorative element
// opacity-[0.04] so it's subtle — consistent with design preview

export function SeigahaPattern({ className }: { className?: string }) {
  // SVG: 3 overlapping semicircles in a row, tiled via repeat
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="20">
      <circle cx="10" cy="20" r="10" fill="none" stroke="white" stroke-width="1"/>
      <circle cx="30" cy="20" r="10" fill="none" stroke="white" stroke-width="1"/>
      <circle cx="20" cy="10" r="10" fill="none" stroke="white" stroke-width="1"/>
    </svg>
  `;
  const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

  return (
    <div
      className={`absolute pointer-events-none opacity-[0.04] ${className}`}
      style={{
        backgroundImage: `url("${encoded}")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}
```

**Alternative:** Import a `seigaiha.svg` asset directly and use as `<Image>` or inline SVG with `fill="none"`.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` / `export function middleware` | `proxy.ts` / `export function proxy` | Next.js 16 | All locale routing code needs rename |
| Synchronous `params.locale` | `const { locale } = await params` | Next.js 16 (full removal) | All layouts/pages must be async and await params |
| `tailwind.config.js` with `theme.extend` | `@theme {}` block in globals.css | Tailwind CSS 4 | No JS config; CSS-first design tokens |
| `tailwindcss` PostCSS plugin | `@tailwindcss/postcss` plugin | Tailwind CSS 4 | Different package name, install separately |
| `framer-motion` package | `motion` package, import from `motion/react` | motion v10+ | Rename; `framer-motion` still works as compat alias but deprecated |
| `motion.div` with LazyMotion | `m.div` from `motion/react-m` | motion v10+ | Required when using LazyMotion for tree-shaking |
| `unstable_cacheLife` / `unstable_cacheTag` | `cacheLife` / `cacheTag` (stable) | Next.js 16 | Remove `unstable_` prefix |
| `experimental.turbopack` in next.config | `turbopack` at top level | Next.js 16 | Turbopack is now stable default |
| `serverRuntimeConfig` / `publicRuntimeConfig` | Environment variables directly | Next.js 16 (removed) | Use `process.env.*` in Server Components |

**Deprecated/outdated:**
- `next lint` command: Removed in Next.js 16. Use `eslint` CLI directly.
- `images.domains`: Deprecated. Use `images.remotePatterns` for Sanity CDN domain.
- `next/legacy/image`: Deprecated. Use `next/image`.

---

## Open Questions

1. **Noto Sans JP subset strategy**
   - What we know: Full japanese subset is 1-2MB. `preload: false` defers load. Project note in STATE.md: "Noto Sans JP kanji subset must be identified before Phase 1-03 to keep font bundle lean."
   - What's unclear: How many kanji actually appear in the UI (section headers, menu JP names). A targeted subset (e.g., specific kanji from menu items) would be ideal.
   - Recommendation: During Phase 1-03 (design system), audit the JP text that will actually appear (decorative headers, menu item JP names). If <50 characters unique, create a custom WOFF2 subset using a tool like `glyphhanger` or `fonttools`. For Phase 1, use `preload: false` with `display: 'swap'` as acceptable default.

2. **FOUND-07 Phase Assignment**
   - What we know: ROADMAP.md Phase 1 requirements list includes FOUND-07 but REQUIREMENTS.md traceability maps FOUND-07 → Phase 3.
   - What's unclear: Whether Phase 1 should wire the webhook stub or just the full implementation.
   - Recommendation: Create the stub route file in Phase 1 (file exists, returns 501 or basic response) to satisfy "Foundation". Full HMAC + Sanity config in Phase 3-02 as documented in traceability table.

3. **Accent color from Sanity siteSettings**
   - What we know: REQUIREMENTS.md notes "accent color adjustable via Sanity siteSettings.accentColor". Tailwind `@theme` tokens are compile-time, not runtime.
   - What's unclear: How to bridge a runtime Sanity value (`#77967A`) with compile-time Tailwind tokens.
   - Recommendation: Define `--color-umai-accent: #77967A` as the static default in `@theme`. For runtime override, use a CSS custom property set at the layout level via an inline `style` attribute: `style={{ '--color-umai-accent': accentColor }}`. Tailwind utilities that reference `var(--color-umai-accent)` will pick up the runtime override. This pattern works in Tailwind 4 because theme variables are CSS custom properties at runtime.

---

## Sources

### Primary (HIGH confidence)

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — proxy.ts rename, async params, Turbopack defaults, React 19.2, all breaking changes
- [next-intl Routing Setup Docs](https://next-intl.dev/docs/routing/setup) — defineRouting, generateStaticParams, setRequestLocale, proxy.ts pattern
- [next-intl v4.0 Release Notes](https://next-intl.dev/blog/next-intl-4-0) — breaking changes from v3, ESM-only, TypeScript 5 requirement
- [Tailwind CSS 4 Theme Variables](https://tailwindcss.com/docs/theme) — @theme directive, token namespaces, CSS-first config
- [Tailwind CSS 4 Release](https://tailwindcss.com/blog/tailwindcss-v4) — @tailwindcss/postcss, zero-config, auto content detection
- [next-sanity GitHub README](https://github.com/sanity-io/next-sanity) — sanityFetch, embedded Studio, TypeGen setup
- [Sanity TypeGen Docs](https://www.sanity.io/docs/apis-and-sdks/sanity-typegen) — TypeGen configuration, schema extract, generate command
- [Sanity Localization Docs](https://www.sanity.io/docs/studio/localization) — field-level i18n, localeString pattern, document-level comparison
- [Motion Reduce Bundle Size](https://motion.dev/docs/react-reduce-bundle-size) — LazyMotion, domAnimation, m components, 4.6kb vs 34kb

### Secondary (MEDIUM confidence)

- [Next.js Font Optimization](https://nextjs.org/docs/app/getting-started/fonts) — next/font/google, size-adjust, self-hosting, variable names
- [Sanity Webhooks Guide](https://www.sanity.io/guides/sanity-webhooks-and-on-demand-revalidation-in-nextjs) — parseBody, isValidSignature, revalidateTag pattern
- [next-intl Routing Configuration](https://next-intl.dev/docs/routing/configuration) — localePrefix, defaultLocale, createNavigation
- [Next.js ISR Guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration) — export const revalidate, generateStaticParams, static vs dynamic

### Tertiary (LOW confidence — verify during implementation)

- [Motion LazyMotion Docs](https://motion.dev/docs/react-lazy-motion) — m component import path `motion/react-m` (confirmed from search results but WebFetch of doc page failed; verify at implementation)
- Seigaiha SVG pattern — No authoritative source; implementation is straightforward SVG with overlapping circles; test visually against design preview HTML

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against official docs; versions from STATE.md are authoritative
- Architecture: HIGH — patterns from official Next.js 16 and next-intl v4 docs, verified with live docs fetch
- Pitfalls: HIGH — most derived from official breaking change documentation; Noto Sans JP pitfall from known GitHub issue
- Seigaiha pattern: MEDIUM — SVG implementation is standard; specific UMAI visual design matches design preview HTML

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable stack, but Next.js point releases may affect minor behavior)
