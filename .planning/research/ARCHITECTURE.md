# Architecture Research

**Domain:** Multilingual restaurant website (Next.js 14+ App Router + Sanity v3)
**Researched:** 2026-02-22
**Confidence:** HIGH (verified via official Next.js docs, next-intl docs, Sanity docs, multiple implementation guides)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER / CDN EDGE                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  /fr/...    │  │  /en/...    │  │  /de/...    │  │  /studio  │  │
│  │  (locale)   │  │  (locale)   │  │  (locale)   │  │  (CMS)    │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         └────────────────┴────────────────┘               │         │
├─────────────────────────────────────────────────────────────────────┤
│                     NEXT.JS APP ROUTER (Vercel)                      │
│                                                                      │
│  Route Group: (site)                    Route Group: (studio)        │
│  ┌─────────────────────────────────┐    ┌─────────────────────────┐  │
│  │  app/(site)/[locale]/           │    │  app/studio/[[...tool]] │  │
│  │  ├── layout.tsx (root + intl)   │    │  ├── layout.tsx         │  │
│  │  ├── page.tsx (Accueil)         │    │  └── page.tsx           │  │
│  │  ├── menu/page.tsx              │    └─────────────────────────┘  │
│  │  ├── reservation/page.tsx       │                                  │
│  │  ├── commander/page.tsx         │    API Routes                    │
│  │  ├── histoire/page.tsx          │    ┌─────────────────────────┐  │
│  │  ├── infos/page.tsx             │    │  app/api/revalidate/    │  │
│  │  └── [slug]/page.tsx (legal)    │    │  route.ts (webhooks)    │  │
│  └─────────────────────────────────┘    └─────────────────────────┘  │
│                                                                      │
│  Middleware (src/proxy.ts)  ←→  next-intl locale detection           │
├─────────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                                  │
│  ┌──────────────────────┐         ┌──────────────────────────────┐   │
│  │  Sanity Content Lake │         │  Next.js Cache (ISR 60s)     │   │
│  │  GROQ queries        │────────▶│  revalidateTag('sanity')     │   │
│  │  projectId/dataset   │         │  force-cache + next.tags     │   │
│  └──────────────────────┘         └──────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────┐         ┌──────────────────────────────┐   │
│  │  External Services   │         │  next-intl Dictionaries      │   │
│  │  Gusty / Uber Eats   │         │  messages/{fr,en,de}.json    │   │
│  │  eazee-link / GTM    │         └──────────────────────────────┘   │
│  └──────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Middleware (proxy.ts) | Locale detection, redirect to /fr default | next-intl `createMiddleware` |
| Root Layout `(site)/[locale]/layout.tsx` | HTML shell, next-intl provider, fonts, GTM, cookie consent | Server Component |
| Page Components | Fetch Sanity data, render sections, JSON-LD | Async Server Components |
| Section Components | Visual sections (Hero, Menu, Gallery) | Server Components by default |
| Interactive Wrappers | Animations, lightbox, mobile sticky bar | Client Components (`"use client"`) |
| Sanity Client (`sanity/lib/client.ts`) | GROQ query execution, ISR cache config | Singleton, server-only |
| Query Library (`sanity/lib/queries.ts`) | GROQ query strings + TypeScript types | `defineQuery()` from next-sanity |
| sanityFetch helper | Wraps client.fetch with revalidation tags | Server-side utility |
| Studio Route `app/studio/[[...tool]]/` | Embedded Sanity Studio UI | Client Component (Sanity provides) |
| Revalidation API `app/api/revalidate/` | Receives Sanity webhooks, calls revalidateTag | Route Handler (server) |
| i18n routing `src/i18n/routing.ts` | Locale list, default locale, prefix config | next-intl config |
| Dictionaries `messages/{locale}.json` | UI string translations (nav, CTAs, labels) | Static JSON files |
| Sanity schemas `sanity/schemas/` | Content model definitions | Sanity schema objects |

## Recommended Project Structure

```
umai2k26/
├── public/
│   ├── fonts/                  # Self-hosted: DM Serif Display, Outfit, Noto Sans JP
│   ├── images/                 # Static fallback images / OG images
│   └── favicon.ico
├── messages/
│   ├── fr.json                 # Primary UI translations (nav, CTAs, labels, legal)
│   ├── en.json                 # English UI translations
│   └── de.json                 # German UI translations
├── src/
│   ├── app/
│   │   ├── (site)/             # Route group: all public pages share one root layout
│   │   │   └── [locale]/       # Dynamic locale segment (/fr, /en, /de)
│   │   │       ├── layout.tsx  # Root layout: <html lang>, fonts, GTM, NextIntlClientProvider
│   │   │       ├── page.tsx    # Accueil (Home)
│   │   │       ├── menu/
│   │   │       │   └── page.tsx
│   │   │       ├── reservation/
│   │   │       │   └── page.tsx
│   │   │       ├── commander/
│   │   │       │   └── page.tsx
│   │   │       ├── histoire/
│   │   │       │   └── page.tsx
│   │   │       ├── infos/
│   │   │       │   └── page.tsx
│   │   │       └── [slug]/     # Legal pages: mentions-legales, confidentialite, cookies, cgv
│   │   │           └── page.tsx
│   │   ├── studio/             # Route group: Sanity Studio (isolated layout)
│   │   │   └── [[...tool]]/    # Optional catch-all — required for Studio sub-routing
│   │   │       ├── layout.tsx  # Minimal layout: full-viewport, no site header/footer
│   │   │       └── page.tsx    # <NextStudio config={sanityConfig} />
│   │   └── api/
│   │       └── revalidate/
│   │           └── route.ts    # POST: Sanity webhook → revalidateTag('sanity')
│   ├── components/
│   │   ├── layout/             # Header, Footer, MobileBar, CookieBanner
│   │   ├── sections/           # Hero, MenuSection, Gallery, StorySection, InfosSection
│   │   ├── ui/                 # Button, Card, MenuItem, CategoryHeader, SectionLabel
│   │   └── motion/             # MotionDiv, MotionSection wrappers (all "use client")
│   ├── i18n/
│   │   ├── routing.ts          # defineRouting({ locales, defaultLocale: 'fr' })
│   │   ├── navigation.ts       # Typed Link, useRouter, usePathname for locale-aware nav
│   │   └── request.ts          # getRequestConfig — resolves locale, loads messages
│   ├── sanity/
│   │   ├── env.ts              # projectId, dataset, apiVersion from env vars
│   │   ├── lib/
│   │   │   ├── client.ts       # createClient({ useCdn: false }) — ISR-compatible
│   │   │   ├── fetch.ts        # sanityFetch() helper with revalidation tags
│   │   │   └── queries.ts      # All GROQ queries via defineQuery()
│   │   ├── schemas/
│   │   │   ├── documents/      # menu.ts, menuItem.ts, page.ts, siteSettings.ts, gallery.ts
│   │   │   ├── objects/        # heroBlock.ts, openingHours.ts, localizedString.ts
│   │   │   └── index.ts        # Schema registry
│   │   ├── types.ts            # TypeGen output (auto-generated, do not edit)
│   │   └── extract.json        # TypeGen schema extraction cache
│   ├── lib/
│   │   ├── constants.ts        # External URLs (Gusty, Uber Eats, eazee-link, social)
│   │   └── utils.ts            # Shared helpers (cn, formatHours, etc.)
│   └── proxy.ts                # next-intl middleware (replaces middleware.ts in Next.js 16)
├── sanity.config.ts             # Sanity Studio config (basePath: '/studio', schemas, plugins)
├── next.config.ts               # withNextIntl() wrapper, image domains
├── tailwind.config.ts           # Design tokens: ivoire #F5F0E8, vert #77967A
└── tsconfig.json
```

### Structure Rationale

- **`(site)/[locale]/`:** Route group isolates public pages from Studio. All public pages share one root layout that provides the locale context, fonts, and global providers. The `[locale]` segment drives all i18n routing.
- **`studio/[[...tool]]/`:** Optional catch-all routes are required — Sanity Studio renders sub-routes (document editors, desk structure, plugins) that must all resolve to this component. A minimal separate layout prevents font/provider conflicts with the public site.
- **`messages/`:** At project root (not inside `src/`), matches next-intl convention. JSON files only — no runtime translation API cost.
- **`sanity/`:** All Sanity concerns colocated. `lib/` holds runtime code; `schemas/` holds content model. TypeGen output (`types.ts`) auto-generated from schemas + queries.
- **`components/motion/`:** Isolated "use client" boundary for Framer Motion. All animation wrappers live here so Server Components stay server-only.
- **`proxy.ts`:** Next.js 16 renamed `middleware.ts` to `proxy.ts`. This file runs at the edge and handles locale detection + redirect to `/fr` default.

## Architectural Patterns

### Pattern 1: ISR + Tag-Based Revalidation (Primary Caching Strategy)

**What:** All Sanity data is fetched via a `sanityFetch()` helper that attaches Next.js cache tags. A webhook from Sanity triggers `revalidateTag('sanity')` which invalidates all affected ISR pages.

**When to use:** Always. This is the correct pattern for this project — ISR with 60s `revalidate` as baseline, plus on-demand revalidation when Sanity content changes.

**Trade-offs:** Simple to implement. One `revalidateTag('sanity')` call refreshes all pages. The 60s baseline ensures stale content never persists more than 1 minute even if the webhook fails.

**Example:**
```typescript
// src/sanity/lib/fetch.ts
import { client } from './client'
import type { QueryParams } from 'next-sanity'

export async function sanityFetch<T>({
  query,
  params = {},
  tags = ['sanity'],
}: {
  query: string
  params?: QueryParams
  tags?: string[]
}): Promise<T> {
  return client.fetch<T>(query, params, {
    cache: 'force-cache',
    next: {
      revalidate: 60,  // 60s baseline ISR
      tags,
    },
  })
}

// src/app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'

export async function POST(req: Request) {
  const { isValidSignature } = await parseBody(req, process.env.SANITY_WEBHOOK_SECRET!)
  if (!isValidSignature) return new Response('Unauthorized', { status: 401 })
  revalidateTag('sanity')
  return new Response('Revalidated', { status: 200 })
}
```

### Pattern 2: Locale-First Routing with next-intl

**What:** All public pages live under `[locale]`. The middleware detects the user's locale from Accept-Language headers and redirects to the appropriate prefix. `generateStaticParams()` pre-builds all locale variants at deploy time.

**When to use:** Always for public pages. Studio route deliberately excluded from locale routing.

**Trade-offs:** Adds `[locale]` param to every page component. Requires `setRequestLocale(locale)` in layouts and pages for static rendering. UI strings (nav, CTAs, labels) live in JSON dictionaries; content translations live in Sanity schemas.

**Example:**
```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en', 'de'],
  defaultLocale: 'fr',
  // /fr/menu, /en/menu, /de/menu — explicit prefixes for all locales
})

// src/app/(site)/[locale]/layout.tsx
import { setRequestLocale } from 'next-intl/server'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale) // enables static rendering
  const messages = await getMessages()
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### Pattern 3: Content Translation Split — Two Layers

**What:** Two distinct translation systems serve different concerns:
1. **UI strings** (nav items, button labels, page titles, error messages) → `messages/{locale}.json` via next-intl `useTranslations()`
2. **CMS content** (menu items, page copy, hero text, opening hours, site settings) → Sanity `@sanity/document-internationalization` plugin with field-level localization using `internationalizedArray`

**When to use:** This split is the correct approach. Restaurant content (menus, descriptions, hours) is authored in Sanity and translated there. The nav/UI chrome is translated in JSON files.

**Trade-offs:** For a small restaurant site with modest content, field-level translation in Sanity (storing fr/en/de within one document) is simpler than separate documents per language. Field-level works well for menu items, site settings, and hero text. Avoids document multiplication (1 menu item document instead of 3).

**Example — Sanity schema with field-level i18n:**
```typescript
// sanity/schemas/objects/localizedString.ts
// Use @sanity/internationalizedArray for all text fields
import { internationalizedArray } from 'sanity-plugin-internationalized-array'

// In schema definition:
defineField({
  name: 'name',
  type: 'internationalizedArrayString', // stores [{_key: 'fr', value: '...'}, {_key: 'en', value: '...'}]
})

// GROQ query with locale param:
// *[_type == "menuCategory"]{
//   "name": name[_key == $locale][0].value,
//   items[]{ "name": name[_key == $locale][0].value, price, available }
// }
```

### Pattern 4: Server/Client Component Boundary for Animations

**What:** All sections are Server Components (data fetching, static markup). Animation is injected via thin "use client" wrapper components in `components/motion/`. Server Components pass data as props to client wrappers.

**When to use:** Any time Framer Motion is needed. Framer Motion requires DOM access and cannot run in Server Components.

**Trade-offs:** Slight indirection (wrapper layer), but keeps the JS bundle lean — Framer Motion only loads for components that actually animate.

**Example:**
```typescript
// src/components/motion/MotionSection.tsx
"use client"
import { motion } from 'framer-motion'

export function MotionSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.section>
  )
}

// src/components/sections/MenuSection.tsx (Server Component — no "use client")
import { MotionSection } from '@/components/motion/MotionSection'
import { sanityFetch } from '@/sanity/lib/fetch'
import { menuQuery } from '@/sanity/lib/queries'

export async function MenuSection({ locale }: { locale: string }) {
  const categories = await sanityFetch({ query: menuQuery, params: { locale } })
  return (
    <MotionSection className="py-16">
      {/* render categories */}
    </MotionSection>
  )
}
```

### Pattern 5: Studio Route Isolation

**What:** Sanity Studio lives at `/studio` under a completely separate route group with its own minimal layout. The `[[...tool]]` optional catch-all is mandatory — Studio renders its own internal routes (document editors, desk, media library) that must all resolve to this one page component.

**When to use:** Always when embedding Sanity Studio in App Router.

**Trade-offs:** None. This is the only correct approach. Failing to use `[[...tool]]` causes Studio sub-routes to 404.

**Example:**
```typescript
// src/app/studio/[[...tool]]/page.tsx
"use client" // Studio is a client component
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}

// src/app/studio/[[...tool]]/layout.tsx
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ height: '100dvh', overscrollBehavior: 'none' }}>
        {children}
      </body>
    </html>
  )
}
```

## Data Flow

### Request Flow — Public Page (ISR)

```
Browser GET /fr/menu
    ↓
Vercel Edge Cache → HIT: serve cached HTML (< 60s old)
    ↓ MISS:
Next.js Server renders app/(site)/[locale]/menu/page.tsx
    ↓
page.tsx calls sanityFetch({ query: menuQuery, params: { locale: 'fr' } })
    ↓
next-sanity client.fetch → Sanity Content Lake GROQ API
    ↓
Response cached in Next.js Data Cache with tag 'sanity', revalidate: 60
    ↓
Server Component renders HTML → sent to browser
    ↓
Client receives HTML + minimal JS (Framer Motion wrappers hydrate)
```

### Content Update Flow — Sanity Webhook

```
Owner edits menu price in Sanity Studio (/studio)
    ↓
Sanity publishes document → fires GROQ-Powered Webhook
    ↓
POST /api/revalidate (with HMAC signature)
    ↓
route.ts validates signature → calls revalidateTag('sanity')
    ↓
Next.js invalidates all cache entries tagged 'sanity'
    ↓
Next visitor triggers ISR re-fetch → fresh content within seconds
```

### i18n Data Flow

```
Browser request (no locale prefix)
    ↓
proxy.ts (Middleware) reads Accept-Language header
    ↓
Redirect to /fr/... (default) or matched locale
    ↓
[locale] segment extracted from URL params
    ↓
setRequestLocale(locale) → enables static rendering
    ↓
Two parallel lookups:
  1. messages/fr.json → UI strings (via next-intl useTranslations)
  2. GROQ query with params: { locale: 'fr' } → CMS content
    ↓
Page renders with both UI strings and content in correct language
```

### Key Data Flows Summary

1. **Menu data:** `Sanity Studio → Content Lake → GROQ query with locale param → Server Component → HTML`
2. **Site settings:** `Sanity siteSettings singleton → fetched in root layout → passed to Header/Footer`
3. **UI translations:** `messages/{locale}.json → next-intl → useTranslations hook in Client Components`
4. **Images:** `Sanity asset pipeline → next/image with sanity image URL builder → Vercel image optimization`
5. **Cache invalidation:** `Sanity webhook → /api/revalidate → revalidateTag → ISR re-fetch`

## Sanity Content Schema Structure

### Documents (top-level Sanity types)

| Document Type | Singleton? | Localized? | Purpose |
|---------------|-----------|------------|---------|
| `siteSettings` | Yes | Yes (field-level) | Hours, URLs, catchphrase, accentColor, contact |
| `menuCategory` | No | Yes (field-level) | Category name, description, display order |
| `menuItem` | No | Yes (field-level) | Name, description, price, tags, image, available toggle |
| `page` | No | No (slug-based) | Legal pages (mentions-legales, etc.) |
| `heroBlock` | No | Yes (field-level) | Per-page hero: image, title overlay |
| `gallery` | Yes | No | Gallery images array |

### Why Field-Level Localization (not Document-Level)

For a 3-language restaurant site with modest content, field-level localization via `@sanity/internationalizedArray` is the right choice:

- Menu items don't change structure between languages — only text fields differ
- Avoids tripling the document count (1 menu item instead of 3)
- Simpler GROQ queries with locale param: `name[_key == $locale][0].value`
- Sufficient for strings and short text — Portable Text fields (long copy) can still use field-level arrays
- `@sanity/document-internationalization` adds complexity only justified for independent publishing workflows

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users/month | Current ISR architecture is exactly right. No changes needed. Vercel free tier sufficient. |
| 1k-100k users/month | Enable Vercel CDN edge caching (already happens with ISR). Consider Sanity CDN (`useCdn: true`) for non-ISR reads. |
| 100k+ users/month | Static export (`output: 'export'`) for fully static HTML — eliminates server cost. Or Vercel Pro with custom cache durations. |

### Scaling Priorities

1. **First bottleneck:** Sanity API rate limits (500K req/month on free tier). The ISR + cache pattern already avoids this — one fetch per 60s per cache key, not per visitor.
2. **Second bottleneck:** Vercel bandwidth. Images are the main cost. next/image optimization + Sanity CDN for assets handles this.

## Anti-Patterns

### Anti-Pattern 1: Client-Side GROQ Queries

**What people do:** Import the Sanity client into components and call `client.fetch()` from browser JS, sometimes wrapping in `useEffect()`.

**Why it's wrong:** Exposes Sanity credentials to the client bundle. Bypasses ISR caching — every page visit hits Sanity API. Kills performance (no HTML pre-render for content). Destroys Lighthouse scores.

**Do this instead:** All Sanity queries run in Server Components or in the `sanityFetch()` helper. `client.ts` should be server-only (add `import 'server-only'` to enforce). Content is fetched at build/ISR time, not per request.

### Anti-Pattern 2: Missing `[[...tool]]` on Studio Route

**What people do:** Create `app/studio/page.tsx` without the catch-all segment.

**Why it's wrong:** Sanity Studio renders its own sub-routes internally (desk structure, document editors, media library tools). Without `[[...tool]]`, navigating within Studio causes 404 errors.

**Do this instead:** Always use `app/studio/[[...tool]]/page.tsx` — the optional catch-all catches all Studio sub-routes.

### Anti-Pattern 3: Including `SanityLive` in Studio Layout

**What people do:** Put `SanityLive` or `VisualEditing` in a parent layout that wraps both the site and `/studio`.

**Why it's wrong:** Causes unexpected Studio reloads as the live content listener fires on every Studio save.

**Do this instead:** `SanityLive` and `VisualEditing` belong only in the `(site)` route group layout — never in a layout that wraps the studio route.

### Anti-Pattern 4: Framer Motion in Server Components

**What people do:** Import `motion` from `framer-motion` directly in a Server Component.

**Why it's wrong:** Framer Motion requires DOM access and React state. Server Components have neither. This causes a build error or runtime crash.

**Do this instead:** Create thin `"use client"` wrapper components in `components/motion/`. Server Components pass data as props to these wrappers. Animation wrappers only — no data fetching in client wrappers.

### Anti-Pattern 5: Hardcoded External URLs

**What people do:** Hardcode Gusty reservation URL, Uber Eats link, or eazee-link in component files.

**Why it's wrong:** Owner (Loan Nguyen) needs to update these via Sanity Studio when they change. A hardcoded URL requires a developer + redeployment.

**Do this instead:** Store all external integration URLs in `siteSettings` document in Sanity. Fetch them once in the root layout and pass to Header. Update through Studio, revalidated within 60s.

### Anti-Pattern 6: Single Locale as Default Without Redirect

**What people do:** Serve the site at `/` without locale prefix and try to handle i18n at the component level.

**Why it's wrong:** Breaks `hreflang` SEO signals. next-intl's middleware handles locale detection automatically and must run before any page renders. Skipping it causes subtle bugs with static rendering (`setRequestLocale` has no locale to set).

**Do this instead:** All pages at `/{locale}/path`. Middleware redirects `/` to `/fr/` (or user's preferred locale). `generateStaticParams()` pre-builds `/fr`, `/en`, `/de` variants.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Gusty (reservation) | External link only — URL stored in Sanity siteSettings | No SDK, just a link |
| Uber Eats | External link only — URL in siteSettings | No SDK |
| Gusty Click & Collect | External link — URL in siteSettings (placeholder initially) | Editable by owner via Studio |
| eazee-link (QR menu) | External link in siteSettings | No SDK |
| Google Maps | iframe embed — address stored in siteSettings | No API key needed for static embed |
| GTM / GA4 | Script tag in root layout, `next/script` with `afterInteractive` | Cookie consent gates GTM init |
| Cookie consent | Client Component, persists in localStorage | Must gate GTM script loading |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server Components ↔ Client Components | Props only (no shared state, no context from server side) | Data fetched server-side, passed as props |
| Sanity lib ↔ App pages | `sanityFetch()` function call + TypeScript types from TypeGen | Import only from server-side code |
| next-intl ↔ Components | `useTranslations()` hook (client) / `getTranslations()` (server) | Never mix — use appropriate variant |
| Site layout ↔ Studio layout | Route group isolation — no shared providers | Each group has its own root layout |
| API routes ↔ Sanity | Webhook validation via `parseBody()` from next-sanity | Secret stored in env var, never in client |

## Build Order Implications

Dependencies between components determine phase ordering:

```
1. Sanity schemas + env setup
        ↓
2. sanityFetch helper + GROQ queries + TypeGen types
        ↓
3. next-intl routing + middleware + message files
        ↓
4. Root layout (site) + locale layout (providers, fonts)
        ↓
5. Design tokens (Tailwind) + motion wrappers (Framer Motion)
        ↓
6. Shared UI components (Button, SectionLabel, etc.)
        ↓
7. Page-specific sections (Hero, MenuSection, Gallery, etc.)
        ↓
8. Individual pages (assemble sections, fetch data, generateMetadata)
        ↓
9. SEO layer (JSON-LD per page, sitemap.ts, generateMetadata with hreflang)
        ↓
10. Studio route (embedded Studio, configure sanity.config.ts desk structure)
        ↓
11. Revalidation API route + Sanity webhook configuration
        ↓
12. Cookie consent + GTM integration
```

**Critical path:** Steps 1-4 must be complete before any page can be built. Sanity types (Step 2) are auto-generated from schemas, so schemas must be finalized first. The locale layout (Step 4) must exist before any page component, since pages are children of the layout.

## Sources

- [Next.js Project Structure (official docs, updated 2026-02-20)](https://nextjs.org/docs/app/getting-started/project-structure) — HIGH confidence
- [next-intl App Router setup](https://next-intl.dev/docs/getting-started/app-router) — HIGH confidence
- [next-intl Routing setup](https://next-intl.dev/docs/routing/setup) — HIGH confidence
- [Sanity Toolkit for Next.js (sanity.io blog)](https://www.sanity.io/blog/sanity-nextjs-enhancements) — HIGH confidence
- [Embedding Sanity Studio (official Sanity docs)](https://www.sanity.io/docs/studio/embedding-sanity-studio) — HIGH confidence
- [next-sanity GitHub repository](https://github.com/sanity-io/next-sanity) — HIGH confidence
- [JSON-LD in Next.js (official docs, updated 2026-02-20)](https://nextjs.org/docs/app/guides/json-ld) — HIGH confidence
- [Building multilingual Next.js + Sanity site (Schema UI)](https://schemaui.com/blog/building-a-multilingual-website-with-next-js-and-sanity) — MEDIUM confidence
- [Sanity document-internationalization vs internationalizedArray (community)](https://www.sanity.io/answers/best-practices-for-managing-multi-language-content-in-sanity-based-projects-discussed) — MEDIUM confidence
- [Next.js App Router ISR guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration) — HIGH confidence
- [Framer Motion + Next.js Server Components pattern](https://www.hemantasundaray.com/blog/use-framer-motion-with-nextjs-server-components) — MEDIUM confidence

---
*Architecture research for: Multilingual restaurant website (UMAI Ramen) — Next.js App Router + Sanity v3 + next-intl*
*Researched: 2026-02-22*
