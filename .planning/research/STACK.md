# Stack Research

**Domain:** Premium multilingual restaurant website with headless CMS
**Researched:** 2026-02-22
**Confidence:** HIGH — primary stack validated via official documentation and verified release notes

---

## Critical Version Corrections

The project plan references "Next.js 14+", "Sanity v3", and "next-intl" without version pins. Research reveals the ecosystem has moved significantly:

| Project Assumption | Verified Current State | Impact |
|-------------------|----------------------|--------|
| Next.js 14+ | Next.js **16.1.6** stable (Dec 2025) | Major — start with 16, not 15 |
| Sanity v3 | Sanity **v5** (requires React 19.2) | Major — v3 EOL for new projects |
| next-intl (unversioned) | next-intl **v4.8.3** (March 2025) | Moderate — v4 is ESM-only |
| Framer Motion (unnamed) | **motion** v12 (rebranded, new import path) | Minor — import path changed |
| Tailwind CSS 4 | Tailwind CSS **4.x** stable Jan 2025 | Confirmed — CSS-first config |

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | **16.1.6** | Full-stack React framework | Current stable (Dec 2025). Turbopack default in 16, ISR+tag revalidation stable, App Router mature. React 19.2 required. Starting on 16 avoids the Next.js 15→16 async params migration (cookies, headers, params are now Promise-only in 16 — building fresh means you start compliant). |
| React | **19.2.x** | UI runtime | Required by Next.js 16 and Sanity v5. Server Components, use() hook, Activity component all stable. |
| TypeScript | **5.3+** | Type safety | Required by next-intl v4. Next.js 16 ships built-in TS support with `next.config.ts`. |
| Sanity | **v5** (package: `sanity@5.x`) | Headless CMS + embedded Studio | v5 is current stable. Only breaking change from v4 is React 19.2 requirement — schemas, Studio plugins, content are unchanged. Free tier: 10K docs, 100GB assets, 250K API req/month, 1M CDN req/month — sufficient for restaurant site. Studio embedded at `/studio` via App Router. |
| Tailwind CSS | **4.x** (Jan 2025+) | Utility-first CSS | Stable since Jan 22, 2025. CSS-first configuration replaces `tailwind.config.js`. 3.78x faster full builds, 182x faster incremental builds. OKLCH color space supports `#F5F0E8` and `#77967A` as CSS custom properties. |
| next-intl | **4.8.3** | i18n routing + translations | Current stable (last published 6 days ago from research date). App Router-first, Server Components-native, handles FR/EN/DE routing at `/{locale}/...`. v4 adds strictly-typed locales, GDPR-compliant session cookies by default, ESM-only build. |
| Motion for React | **12.x** (package: `motion`) | Animations | Rebranded from `framer-motion`. v12 has no breaking changes, React 19 support confirmed. Import path changed to `motion/react`. SSR-safe with Next.js. |

### CMS Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| next-sanity | **latest** (`next-sanity`) | Sanity toolkit for Next.js | Official Sanity toolkit for App Router. Provides `sanityFetch` for ISR tag-based revalidation, `SanityLive` for live preview, webhook helpers with HMAC-SHA256 verification. Required for correct caching semantics. |
| @sanity/image-url | **latest** | Image URL building | Converts Sanity asset references to optimized CDN URLs with hotspot/crop parameters for `next/image`. |
| groq | **latest** | Query builder | GROQ query string type safety. Use with `@sanity/types` for typed results. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tailwindcss/postcss` | **4.x** | PostCSS plugin for Tailwind 4 | Required — replaces the old `tailwindcss` PostCSS plugin. Add to `postcss.config.mjs`. |
| `next/font` | built-in | Self-hosted font loading | Load DM Serif Display, Outfit, Noto Sans JP without external CDN. Required by performance constraint (no Google Fonts CDN). Use `next/font/google` which downloads at build time and self-hosts. |
| `@vercel/speed-insights` | **latest** | Core Web Vitals tracking | Required — Next.js 15+ removed auto-instrumentation. Add `<SpeedInsights />` component explicitly. |
| `lucide-react` | **latest** | Icon system | Lightweight, tree-shakeable, React 19 compatible. Use ONLY if project design allows — current spec says "no icon packs", so use only for UI controls (close button in lightbox, etc.), not decorative elements. |
| `react-medium-image-zoom` or `yet-another-react-lightbox` | **latest** | Photo gallery lightbox | For the gallery with lightbox requirement. `yet-another-react-lightbox` is more actively maintained (2025), accessible, and works with `next/image`. |
| `@sanity/webhook` | built-in in next-sanity | Webhook signature verification | Use `isValidSignature` from `next-sanity/webhook` to verify Sanity webhook payloads before calling `revalidateTag`. |
| `zod` | **3.x** | Runtime schema validation | Validate environment variables at startup and Sanity webhook payloads. Small surface for this project but prevents runtime surprises. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Linting | Note: `next lint` command is deprecated in Next.js 15.5 and removed in 16. Configure via `eslint.config.mjs` (flat config). Run `eslint` directly, not `next lint`. |
| Prettier | Code formatting | Configure alongside ESLint. Add `prettier-plugin-tailwindcss` for auto-sorting Tailwind classes (works with Tailwind 4). |
| `prettier-plugin-tailwindcss` | Tailwind class sorting | v4 compatible. Keeps class order consistent and readable. |
| Biome | Optional linter/formatter alternative | Next.js 16 create-next-app now offers Biome as an alternative to ESLint. Faster, single tool. Consider if DX is priority. |
| Sanity CLI (`@sanity/cli`) | Studio management | Required for schema deployment and type generation. v4.9.0+ for fine-grained version selection. |
| `sanity typegen` | TypeScript type generation | Run `npx sanity@latest typegen generate` to generate TS types from GROQ queries and schemas. Eliminates `any` types in data fetching. |

---

## Installation

```bash
# Initialize Next.js 16 project with App Router
npx create-next-app@latest umai2k26 --typescript --app --no-src-dir --no-tailwind
cd umai2k26

# Core framework (React 19.2 comes with Next.js 16)
npm install next@latest react@latest react-dom@latest

# Tailwind CSS 4
npm install tailwindcss @tailwindcss/postcss postcss

# Sanity v5 + Next.js integration
npm install sanity@latest next-sanity@latest @sanity/image-url groq

# i18n
npm install next-intl@latest

# Animation (note: package name is "motion", not "framer-motion")
npm install motion

# Utilities
npm install zod

# Vercel observability
npm install @vercel/speed-insights

# Photo lightbox
npm install yet-another-react-lightbox

# Dev dependencies
npm install -D @tailwindcss/postcss prettier prettier-plugin-tailwindcss @types/node @types/react @types/react-dom typescript eslint @eslint/eslintrc
```

**PostCSS configuration** (`postcss.config.mjs`):
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**Tailwind import** (`app/globals.css`):
```css
@import "tailwindcss";

@theme {
  --color-ivoire: #F5F0E8;
  --color-vert-accent: #77967A;
  --font-display: "DM Serif Display", serif;
  --font-body: "Outfit", sans-serif;
  --font-jp: "Noto Sans JP", sans-serif;
}
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Next.js 15.2 | Only if a critical plugin still requires Next.js 15 (check `next-intl` and `next-sanity` compatibility). No known blocking issues as of Feb 2026. |
| Sanity v5 | Sanity v4 | Only if your Node.js environment is stuck on Node 18. v5 requires Node 20.9+. Since project targets Vercel (Node 20 default), v5 is correct. |
| next-intl v4 | next-intl v3 | Only for legacy projects already on v3. For greenfield, always use v4. |
| `motion` (Motion for React) | `framer-motion` | `framer-motion` still exists as a legacy alias but the canonical package is now `motion`. New projects should use `motion` and import from `motion/react`. |
| Tailwind CSS 4 | Tailwind CSS 3 | Only if targeting older browsers (pre-Chrome 111). Tailwind 4 requires Chrome 111+, Safari 16.4+, Firefox 128+. Not an issue for a 2026 restaurant site. |
| `yet-another-react-lightbox` | `react-medium-image-zoom` | `react-medium-image-zoom` is simpler for single-image zoom but lacks gallery navigation. Use for product detail pages, not photo galleries. |
| Vercel (free/Pro) | Railway, Fly.io | Only if cost becomes an issue. Vercel is the optimal platform for Next.js 16 with built-in ISR, edge functions, and zero-config deployment. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `framer-motion` (as primary import) | Package rebranded to `motion`. `framer-motion` is a compat shim — may not receive all updates. | `motion` package, import from `motion/react` |
| `tailwindcss` as PostCSS plugin directly | In Tailwind 4, the `tailwindcss` package is no longer a PostCSS plugin. Using it directly causes build errors (verified: GitHub issue #15735). | `@tailwindcss/postcss` plugin |
| `tailwind.config.js` | Removed in Tailwind 4. The config file approach is replaced by `@theme` blocks in CSS. If created, it will be silently ignored. | `@theme {}` in `globals.css` |
| `postcss-import` and `autoprefixer` | Tailwind 4 handles both natively. Adding them causes double-processing. | Remove from postcss config |
| `@tailwind base/components/utilities` directives | Removed in Tailwind 4. Replaced by single `@import "tailwindcss"`. | `@import "tailwindcss"` |
| `next lint` command | Deprecated in Next.js 15.5, removed in 16. Will not be available. | `eslint` directly in package.json scripts |
| `serverRuntimeConfig` / `publicRuntimeConfig` | Removed in Next.js 16. | Environment variables (`process.env`, `NEXT_PUBLIC_*`) |
| `middleware.ts` (Next.js 16 only) | Renamed to `proxy.ts` in Next.js 16. `middleware` convention is deprecated. | `proxy.ts` with `export function proxy(request)` |
| Obypay | Already confirmed for removal from current site. No API integration needed. | Gusty (reservation + Click & Collect) |
| Blog/newsletter in v0 | Explicitly out of scope. Adds complexity (MDX, email lists) for zero immediate value. | Defer to post-launch |
| Hero image slider/carousel | Project spec explicitly prohibits it (hurts CWV, single image is the requirement). | Single fixed fullscreen `next/image` with rgba overlay |
| `@sanity/client` directly without `next-sanity` | `@sanity/client` alone doesn't handle Next.js 15/16 cache semantics (fetch options, tags). | `next-sanity` which wraps client correctly for ISR |
| Google Fonts CDN at runtime | Project constraint: self-hosted fonts required for performance (Lighthouse >90). | `next/font/google` — downloads at build time, self-hosts automatically, zero network requests at runtime |
| `react-i18next` / `i18next` | Designed for client-side, doesn't integrate with Next.js App Router routing and Server Components natively. | `next-intl` which is App Router-first |

---

## Stack Patterns by Variant

**For content data fetching (ISR pattern):**
```ts
// Use sanityFetch from next-sanity for automatic cache tagging
import { sanityFetch } from '@/sanity/lib/live'

export default async function MenuPage() {
  const { data: menu } = await sanityFetch({ query: MENU_QUERY })
  // next-sanity handles: fetch cache, revalidate tags, ISR semantics
}
```

**For Sanity webhook revalidation (on-demand ISR):**
```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache'
import { isValidSignature, SIGNATURE_HEADER_NAME } from 'next-sanity/webhook'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get(SIGNATURE_HEADER_NAME) ?? ''
  const secret = process.env.SANITY_REVALIDATION_SECRET!

  if (!isValidSignature(body, signature, secret)) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  revalidateTag('sanity')
  return Response.json({ revalidated: true })
}
```

**For next-intl routing (FR/EN/DE):**
```ts
// middleware.ts → proxy.ts in Next.js 16
// next-intl middleware handles locale detection and redirect
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!_next|studio|api|.*\\..*).*)']
}
```

Note: In Next.js 16, `middleware.ts` is renamed `proxy.ts`. next-intl v4 supports this. Check next-intl 4.x docs for exact export naming.

**For motion animations (correct import path):**
```tsx
import { motion, AnimatePresence } from 'motion/react'
// NOT: import { motion } from 'framer-motion'
```

**For font loading (self-hosted, no CDN):**
```ts
// app/fonts.ts
import { DM_Serif_Display, Outfit, Noto_Sans_JP } from 'next/font/google'

export const dmSerifDisplay = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  preload: true,
})

export const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

export const notoSansJP = Noto_Sans_JP({
  subsets: ['latin', 'japanese'],
  display: 'swap',
  variable: '--font-jp',
  // Limit weight to reduce download size
  weight: ['400', '500'],
})
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `next@16.1.6` | `react@19.2.x`, `react-dom@19.2.x` | React 19.2 is required by Next.js 16 (not optional). |
| `sanity@5.x` | `react@19.2.x` (required), Node.js 20.9+ | v5 requires React 19.2. If hosting on a Node 18 environment, stay on sanity v4. Vercel defaults to Node 20 — no issue. |
| `next-intl@4.x` | `next@15+` or `next@16+`, TypeScript 5+ | v4 is ESM-only (no CJS except `next-intl/plugin`). Works with Next.js App Router. TypeScript 5.0+ required. |
| `motion@12.x` | `react@18+` or `react@19+` | `motion/react` works with React 19. No peer dependency conflicts. |
| `tailwindcss@4.x` | Any bundler with PostCSS support | Requires `@tailwindcss/postcss` plugin. Remove `autoprefixer` and `postcss-import` from config. Browser requirement: Chrome 111+, Safari 16.4+. |
| `next-sanity@latest` | `next@15+` or `next@16+`, `sanity@5.x` | Verify `next-sanity` supports Sanity v5 before installing — check peer deps at install time. |
| `@sanity/cli@4.9.0+` | `sanity@5.x` | Required for fine-grained version selection and `typegen generate`. |

---

## Sanity Free Tier Constraints

The project must stay within Sanity's free plan. Verified limits (Feb 2026):

| Resource | Free Tier Limit | Restaurant Site Estimate | Status |
|----------|-----------------|--------------------------|--------|
| Documents | 10,000 | ~200 (menu items, pages, settings) | Safe |
| Assets (storage) | 100GB | ~5GB (29 photos + optimization) | Safe |
| Bandwidth | 100GB/month | ~10GB/month (CDN-heavy) | Safe |
| API requests | 250K/month | ~50K/month (ISR + editorial) | Safe |
| CDN API requests | 1M/month | ~200K/month | Safe |
| GROQ webhooks | 2 | 1 (revalidation) | Safe |
| User seats | 20 | 2 (dev + owner) | Safe |

ISR with `revalidate: 60` and webhook-triggered on-demand revalidation keeps API request volume minimal (reads come from CDN cache, not direct API).

---

## Sources

- [Next.js 16 Release Blog](https://nextjs.org/blog/next-16) — confirmed stable, Turbopack default (HIGH confidence)
- [Next.js 16.1 Release Blog](https://nextjs.org/blog/next-16-1) — latest stable Dec 18 2025, FS caching stable (HIGH confidence)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — async params now fully required, middleware→proxy rename (HIGH confidence)
- [Next.js 15.5 Blog](https://nextjs.org/blog/next-15-5) — `next lint` deprecation, TypeScript typed routes stable (HIGH confidence)
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — stable Jan 22 2025, CSS-first config, `@tailwindcss/postcss` plugin (HIGH confidence)
- [Tailwind CSS Next.js Installation Guide](https://tailwindcss.com/docs/guides/nextjs) — official PostCSS setup steps (HIGH confidence)
- [Sanity Studio v5 Blog](https://www.sanity.io/blog/sanity-studio-v5) — React 19.2 required, no other breaking changes (HIGH confidence)
- [Sanity v3→v4 migration](https://www.sanity.io/blog/a-major-version-bump-for-a-minor-reason) — only breaking change was Node.js 18→20 (HIGH confidence)
- [Sanity Pricing Page](https://www.sanity.io/pricing) — free tier: 10K docs, 100GB assets, 250K API req, 1M CDN req (HIGH confidence)
- [next-intl v4.0 Release Blog](https://next-intl.dev/blog/next-intl-4-0) — ESM-only, TypeScript 5+, GDPR cookies, strictly-typed locales (HIGH confidence)
- [next-intl npm](https://www.npmjs.com/package/next-intl) — current version 4.8.3 (HIGH confidence)
- [Motion for React upgrade guide](https://motion.dev/docs/react-upgrade-guide) — rebranded from framer-motion, import from `motion/react`, v12 no breaking changes (HIGH confidence)
- [next-sanity GitHub](https://github.com/sanity-io/next-sanity) — ISR patterns, webhook verification, sanityFetch (HIGH confidence)
- [Sanity Next.js ISR with webhooks](https://www.buildwithmatija.com/blog/secure-sanity-webhooks-nextjs-app-router) — on-demand revalidation implementation pattern (MEDIUM confidence)

---

*Stack research for: Premium multilingual restaurant website (UMAI Ramen)*
*Researched: 2026-02-22*
