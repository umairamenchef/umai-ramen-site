# Pitfalls Research

**Domain:** Next.js + Sanity CMS multilingual restaurant website (FR/EN/DE)
**Researched:** 2026-02-22
**Confidence:** MEDIUM-HIGH (most findings verified against official docs and multiple sources)

---

## Critical Pitfalls

### Pitfall 1: next-intl Dynamic Rendering Breaks ISR

**What goes wrong:**
Using `useTranslations()` or any next-intl hook in a Server Component forces the entire route into dynamic rendering. This silently disables ISR — pages that should be statically generated and served from CDN become server-rendered on every request. The site appears to work but Lighthouse scores drop and Vercel costs spike.

**Why it happens:**
Developers assume next-intl "just works" with Server Components. The library needs the locale from the request context to resolve translations, which Next.js marks as a dynamic dependency. The error only appears in production or when running `next build --debug`.

**How to avoid:**
- Call `setRequestLocale(locale)` at the very top of every `layout.tsx` and `page.tsx` file in `app/[locale]/`
- Call it before any `useTranslations()` or `getTranslations()` call
- Add `generateStaticParams` to the root `[locale]` layout returning `routing.locales.map(locale => ({ locale }))`
- Validate the locale with `hasLocale(routing.locales, locale)` in the root layout before calling `setRequestLocale`

```typescript
// app/[locale]/layout.tsx — required pattern
import { hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale); // MUST be before any next-intl call
  // ...
}
```

**Warning signs:**
- `next build` output shows routes as `λ` (dynamic) instead of `○` (static) for content pages
- Console warning: `DYNAMIC_SERVER_USAGE` during build
- Lighthouse TTI is high even for simple pages

**Phase to address:** Foundation / Project setup (before any content page is built)

---

### Pitfall 2: Sanity ISR Double-Cache Problem (Stale Content Despite Revalidation)

**What goes wrong:**
Content updated in Sanity Studio does not appear on the live site even after 60+ seconds. Root cause: two independent caches are stacked — the Sanity API CDN (60s TTL) and Next.js ISR cache (60s revalidate). If both are primed with stale data, fresh content can take 2 minutes to appear. Worse, `useCdn: true` in the Sanity client used inside the revalidation route handler means Next.js fetches "fresh" data from Sanity but gets CDN-cached stale content.

**Why it happens:**
The Sanity client configuration (`useCdn: true` vs `useCdn: false`) is set once globally. Developers use `useCdn: true` for performance (free tier CDN requests vs limited regular API requests) without realizing it affects the revalidation path.

**How to avoid:**
- In the webhook route handler (`/api/revalidate`), instantiate a Sanity client with `useCdn: false` to always hit the origin
- In static page fetch functions (ISR), use `useCdn: true` (CDN) for cost efficiency
- Use `revalidateTag('sanity')` with a broad tag rather than path-by-path revalidation to avoid serverless timeout on sequential revalidation
- Protect the webhook route with a secret token (SANITY_REVALIDATE_SECRET env var) verified via HMAC signature

```typescript
// lib/sanity/client.ts — two clients
export const sanityClient = createClient({ useCdn: true, ... }); // for ISR fetches
export const sanityPreviewClient = createClient({ useCdn: false, ... }); // for webhooks/revalidation
```

**Warning signs:**
- Sanity content changes are visible in Studio but not on the live site for >5 minutes
- Vercel function logs show revalidation called but page still serves old data
- DevTools Network tab shows `/_next/image?url=...` with old image URLs

**Phase to address:** CMS integration / ISR setup phase

---

### Pitfall 3: Sanity Schema i18n Strategy Locked In Early

**What goes wrong:**
Choosing the wrong Sanity i18n strategy for menu content forces a partial schema rewrite later. Two patterns exist: **field-level** (one document with `{ fr: "...", en: "...", de: "..." }` per field) and **document-level** (separate `menuItem_fr`, `menuItem_en`, `menuItem_de` documents via `@sanity/document-internationalization` plugin). Switching between them after content is entered requires data migration and Studio downtime.

**Why it happens:**
Developers pick whichever pattern they find first. Field-level looks simpler for small schemas but has a hard Sanity free-tier ceiling: **2,000 attributes per dataset** (free plan). A field-level object with 3 languages × 5 translated fields = 15 attributes per document. With 30 menu items + site settings + pages, this approaches the ceiling fast. Document-level uses more documents but far fewer attributes per document.

**How to avoid:**
For this project (FR primary, EN+DE secondary, ~30 menu items), use **field-level i18n** for simple text fields inside a localeString object type:

```typescript
// schemas/lib/localeString.ts
export const localeString = defineType({
  name: 'localeString',
  type: 'object',
  fields: [
    defineField({ name: 'fr', type: 'string', title: 'Français' }),
    defineField({ name: 'en', type: 'string', title: 'English' }),
    defineField({ name: 'de', type: 'string', title: 'Deutsch' }),
  ],
})
```

Do NOT use `@sanity/document-internationalization` plugin for menu items — it creates 3x the documents and makes GROQ queries significantly more complex for a simple restaurant menu. Reserve document-level only for full page translations if needed.

**Warning signs:**
- Sanity dataset attribute count approaching 2,000 (check in Sanity management console)
- GROQ queries require multiple `*[_type == "menuItem" && language == $locale]` pattern with references
- Studio editors see "No translation found" errors when the plugin reference document is missing

**Phase to address:** Sanity schema design (before any content is entered)

---

### Pitfall 4: next/image `fill` on Hero Causes CLS Score Failure

**What goes wrong:**
The hero section uses `next/image` with `fill` prop for a fullscreen background. Without a properly constrained parent container, the browser cannot reserve space before the image loads. The page renders, then jumps when the image appears — CLS score of 0.3+ which fails the < 0.1 target.

**Why it happens:**
`fill` mode requires `position: relative` on the parent AND an explicit height set via CSS. Developers see the image render correctly locally (fast connection, image in cache) but CLS only manifests on cold loads (first visitor, slow connection).

**How to avoid:**
- Wrap the hero `<Image>` in a container with explicit `h-[100dvh]` and `relative` positioning
- Add `priority` prop to the hero image (the only LCP candidate on the page) — this generates a `<link rel="preload">` in the `<head>`
- Use `sizes="100vw"` to prevent Next.js from serving a small image to a mobile screen
- Never add `priority` to more than 2 images per page (every priority image is preloaded, defeating the optimization for others)

```tsx
// components/Hero.tsx — correct pattern
<div className="relative h-[100dvh] w-full">
  <Image
    src={sanityImageUrl}
    alt="UMAI Ramen hero"
    fill
    priority  // only on the hero
    sizes="100vw"
    className="object-cover object-center"
  />
  <div className="absolute inset-0 bg-black/40" />
</div>
```

**Warning signs:**
- Lighthouse CLS > 0.1 in CI report
- Chrome DevTools Performance panel shows layout shift from hero image
- WebPageTest filmstrip shows content jumping after initial paint

**Phase to address:** Design system / component build phase (set the pattern before building all pages)

---

### Pitfall 5: Hreflang and Alternate Links Not Generated for All Locale Variants

**What goes wrong:**
The sitemap and page `<head>` lack proper `hreflang` alternate links, or they use incorrect locale codes. Google crawls the FR pages but does not index EN/DE versions. Alternatively, all three language versions are indexed separately but Google treats them as duplicate content rather than translations.

**Why it happens:**
- `metadataBase` is not set in the root layout, causing hreflang URLs to be relative (broken)
- `generateMetadata` uses hardcoded URLs instead of the current locale's URL
- The sitemap returns only the default locale's pages
- BCP 47 locale codes are miscased (`fr-FR` vs `fr`) — Google is strict about format

**How to avoid:**
- Set `metadataBase` in the root layout: `metadataBase: new URL('https://umai-ramen.fr')`
- In `generateMetadata`, build `alternates.languages` dynamically from `routing.locales`:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL('https://umai-ramen.fr'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'fr': '/fr',
        'en': '/en',
        'de': '/de',
        'x-default': '/fr', // default language fallback
      },
    },
  };
}
```

- In `sitemap.ts`, generate entries for ALL locales × ALL routes
- Use `fr`, `en`, `de` (not `fr-FR`, `en-US`) unless targeting country-specific variants

**Warning signs:**
- Google Search Console shows pages discovered but not indexed for EN/DE
- Rich Results Test shows no hreflang tags in page source
- Only FR pages appear in Google site:umai-ramen.fr search

**Phase to address:** SEO implementation phase (not afterthought — build into page template from day one)

---

### Pitfall 6: Framer Motion Forces Entire Page into Client Bundle

**What goes wrong:**
Importing Framer Motion components directly in a Server Component (or in a shared layout file) forces `"use client"` on the entire subtree. The JS bundle balloons from ~80KB to ~400KB+ (full Framer Motion is ~90KB gzipped). Lighthouse Performance score drops below 90 due to TBT (Total Blocking Time) from parsing this bundle.

**Why it happens:**
Developers add `motion.div` to a component, forget to add `"use client"`, and Next.js either throws a build error or silently converts the component. Alternatively, they add `"use client"` at a high level in the tree (e.g., the page layout) to fix the error, waterfall-downloading the full library.

**How to avoid:**
- Use `LazyMotion` + `m` (tree-shakeable) instead of full `motion` imports:

```typescript
// components/AnimatedSection.tsx
"use client";
import { LazyMotion, domAnimation, m } from 'framer-motion';

export function AnimatedSection({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {children}
      </m.div>
    </LazyMotion>
  );
}
```

- Keep animated components as small leaf nodes with their own `"use client"` boundary
- Use CSS animations via Tailwind for simple fade-ins instead of Framer Motion — reserve Framer Motion for interactive animations only
- Run `@next/bundle-analyzer` before launch to verify bundle size

**Warning signs:**
- `next build` output shows large client bundle sizes (> 200KB for any route)
- Lighthouse TBT > 200ms
- Coverage panel in DevTools shows Framer Motion code downloaded on non-interactive pages

**Phase to address:** Design system / animation implementation phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode translation strings in component JSX instead of `t()` calls | Faster initial development | Cannot add DE/EN without component edits, breaks i18n pipeline | Never — always use `t()` from day one |
| Use `useCdn: true` everywhere (including webhook handler) | Single client config, fewer edge cases | Stale content after Sanity edits, defeats ISR revalidation | Never in the webhook route handler |
| Skip `generateStaticParams` for `[locale]` routes | No build-time config needed | Forces all pages into dynamic rendering, kills ISR | Never |
| Embed Google Maps with `<iframe>` without consent gating | Simple one-liner | GDPR violation — Google Maps sets tracking cookies before consent | Never in EU context |
| Use the generic `LocalBusiness` JSON-LD type instead of `Restaurant` | Less schema research needed | Loses eligibility for restaurant-specific rich results (opening hours panel) | Never |
| Put `"use client"` on layout files to fix Framer Motion errors | Fixes build error quickly | Entire subtree loses RSC benefits, client bundle explodes | Never — fix the actual component boundary |
| Skip `sizes` prop on `next/image` | Image renders | Next.js serves full-size image to mobile (3x bandwidth waste) | Never for above-the-fold images |
| Store Sanity project ID and dataset in client-side code without env vars | Works in development | Exposed credentials in bundle (though Sanity public dataset ID is low-risk) | Acceptable for public dataset ID, never for tokens |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Sanity webhook + Next.js revalidation | Using `useCdn: true` in the revalidation API route | Create a separate `sanityClientNoCDN` with `useCdn: false` used only in API routes |
| Sanity Studio at `/studio` | Including `SanityLive` or `VisualEditing` in the studio route's layout | Use route groups: `app/(site)/layout.tsx` for front-end and `app/studio/` separately with no live components |
| next-intl middleware | Default middleware matcher catches `/studio` route, causing locale redirect loops | Explicitly exclude `/studio` and `/api` from middleware matcher regex |
| Google Tag Manager + cookie consent | Loading GTM unconditionally in root layout (fires before consent) | Dynamically inject GTM script tag only after user grants analytics consent; use Consent Mode v2 defaults |
| Sanity image URLs + next/image | Using Sanity's raw CDN URL without configuring `remotePatterns` | Add `cdn.sanity.io` to `next.config.js` `remotePatterns`; use `@sanity/image-url` builder for `width`/`height` parameters |
| Google Maps embed | Raw `<iframe>` embed fires on page load | Lazy-load Maps behind a click-to-reveal or use a static map image with a link |
| Gusty reservation link | Hardcoding the Gusty URL in code | Store URL in `siteSettings.reservationUrl` in Sanity so Loan can update it without code changes |
| Uber Eats link | Same as above | Store in `siteSettings.deliveryUrl` in Sanity |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Multiple `priority` images on the page | Slow LCP despite priority prop | Use `priority` only on the hero image (the true LCP candidate) | Any page with > 2 priority images |
| Sanity image returned without explicit dimensions to `next/image` | CLS from unsized images, blurry placeholders | Always pass `width` and `height` from Sanity's image metadata (`asset.metadata.dimensions`) | Every page with CMS images |
| Full Framer Motion bundle loaded on all pages | TBT > 200ms, bundle > 300KB | Use `LazyMotion` + `m` components; CSS for simple animations | Pages with any `motion.*` import |
| Tailwind CSS v4 default border/ring color changes | Subtle visual regressions in existing components | Audit all default utility changes before migration; test in isolation | Any component using `border`, `ring`, or `divide` without explicit color |
| Client-side router cache not invalidated | After Sanity webhook revalidation, navigating back shows stale page | Use `router.refresh()` in the Sanity Studio Live Preview or instruct editors to hard-refresh | Every client-side navigation after content update |
| Font FOUT with self-hosted fonts | Layout shift as fonts load | Use `next/font` with `display: 'swap'` and preload; declare fonts in `layout.tsx` not in CSS | First paint on uncached pages |
| Noto Sans JP loaded for all pages | +50KB font download even for FR-only visitors | Subset to only the specific kanji used (< 10 characters); use `unicode-range` in font declaration | Any page loading the full CJK font |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Sanity API write token in client bundle | Full dataset write access leaked | Never use write token in client-side code; only use read tokens or public project ID |
| Unprotected `/api/revalidate` webhook endpoint | Arbitrary cache invalidation by anyone | Verify HMAC signature using `SANITY_REVALIDATE_SECRET` env var on every webhook request |
| GTM loading tracking scripts before GDPR consent | CNIL fine risk (French DPA); GA4 data collection without consent is illegal in France | Implement Consent Mode v2; default all storage to `denied`; only grant after explicit user action |
| Google Maps iframe loading on page render | Maps sets `__utma` cookies before consent, GDPR violation | Gate Maps behind a click-to-load or render a static placeholder image by default |
| Missing `Content-Security-Policy` headers | XSS risk through injected scripts | Configure CSP in `next.config.js` headers; include Sanity CDN, Vercel Analytics, GTM in allowlist |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Language switcher changes locale but loses the current page | Users redirected to homepage after switching language, breaking browsing flow | Implement `useRouter` + `usePathname` from next-intl to preserve the current path on locale switch |
| Menu availability toggle not reflected without page reload | Loan marks an item "unavailable" in Studio, but customers still see it for up to 60s | Acceptable with 60s ISR; document this limitation for the owner; add visible "last updated" timestamp |
| Cookie consent banner blocks entire screen on mobile | Users cannot see content, bounce rate increases | Use a bottom bar consent (not a modal overlay); one-click accept; store preference in localStorage |
| Sticky header + mobile sticky CTA bar overlap content | Content hidden behind two fixed bars on small screens | Account for both bars in page padding calculations; test on 375px viewport |
| Missing `lang` attribute on `<html>` per locale | Screen readers and SEO bots get wrong language hints | Set `<html lang={locale}>` dynamically in the root layout |
| External links (Gusty, Uber Eats) without `target="_blank"` | Users navigate away from the site entirely | Use `target="_blank" rel="noopener noreferrer"` on all external CTAs |

---

## "Looks Done But Isn't" Checklist

- [ ] **ISR revalidation:** Webhook endpoint exists but is it actually called by Sanity? — verify in Sanity webhook logs after a content edit
- [ ] **hreflang:** Tags appear in page source but do they use correct BCP-47 codes and absolute URLs? — check with Google's Rich Results Test
- [ ] **JSON-LD:** Structured data passes validation but does it include correct `openingHours` format? — `Mo-Sa 12:00-22:30` not `12h-22h30`
- [ ] **Cookie consent:** Banner appears but does GTM actually fire only after consent? — verify in Network tab: GA4 request should only appear after consent click
- [ ] **next/font:** Fonts self-hosted but is the FOUT eliminated? — test with network throttling (Slow 4G) in DevTools
- [ ] **Images:** Hero image has `priority` but does it actually preload? — check `<link rel="preload" as="image">` in page source
- [ ] **Mobile sticky bar:** Renders correctly but does it overlap form fields on the Infos page contact section? — test on 375px
- [ ] **Sanity Studio at /studio:** Accessible in production but is CORS configured? — try opening Studio on a different browser (not localhost)
- [ ] **Locale routing:** `/fr`, `/en`, `/de` all work but does `/` redirect to the correct default locale? — verify middleware locale detection with Accept-Language header
- [ ] **sitemap.xml:** Generated but does it include all locales × all routes? — check for 3 entries per page

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong Sanity i18n strategy (field-level → document-level) | HIGH — data migration required | Export dataset, write migration script to reshape documents, reimport; plan 1-2 days |
| Framer Motion in wrong component tree | LOW — refactor client boundary | Extract animated elements into leaf components with `"use client"`, remove from layouts |
| Missing `setRequestLocale` across routes | MEDIUM — touch every layout/page file | Add to all `[locale]/` layouts and pages systematically; `grep -r "useTranslations" --include="*.tsx"` to find all callsites |
| GTM fires before consent (discovered post-launch) | MEDIUM — legal risk | Implement Consent Mode v2 immediately; inform DPO; audit GA4 data for consent compliance |
| hreflang wrong or missing (discovered weeks post-launch) | LOW-MEDIUM — Google takes 1-4 weeks to re-crawl | Fix `generateMetadata`, redeploy, submit sitemap to Search Console; wait for recrawl |
| Hero image CLS regression | LOW — CSS fix | Ensure parent container has explicit height; re-run Lighthouse |
| Sanity free tier attribute limit hit | MEDIUM — schema restructure | Audit schema attributes, remove redundant fields, migrate to arrays for multi-lang fields |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| next-intl breaking ISR (dynamic rendering) | Phase 1: Foundation & i18n routing setup | `next build` shows all content routes as `○` static, not `λ` dynamic |
| Sanity double-cache stale content | Phase 2: CMS integration & ISR | Manual test: edit in Studio, wait 65s, hard refresh — content must update |
| Sanity schema i18n strategy locked in | Phase 2: Sanity schema design | Schema review with FR/EN/DE content entered for 5 menu items before committing |
| Hero image CLS with `fill` | Phase 3: Design system & core components | Lighthouse CLS < 0.05 on homepage with network throttling |
| Framer Motion client bundle explosion | Phase 3: Animation implementation | Bundle analyzer shows no route exceeds 150KB JS |
| Hreflang and alternates missing | Phase 4: SEO implementation | Google Rich Results Test shows hreflang tags; 3 sitemap entries per page |
| GTM fires before consent | Phase 5: Analytics & cookie consent | Network tab test: GA4 beacon appears only after consent click |
| JSON-LD incomplete (wrong type, missing fields) | Phase 4: SEO implementation | Google Rich Results Test validates Restaurant schema with no errors |
| Sanity Studio CORS error in production | Phase 2: CMS setup | Test Studio login from non-localhost browser after first Vercel deploy |
| next-intl middleware catching /studio route | Phase 1: Routing setup | Visit `/studio` — should load Studio, not redirect to `/fr/studio` |

---

## Sources

- [next-intl routing setup — official docs (current)](https://next-intl.dev/docs/routing/setup)
- [next-intl App Router with i18n routing — official getting started](https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing)
- [GitHub issue: setRequestLocale does not work with generateStaticParams](https://github.com/amannn/next-intl/issues/891)
- [Next.js ISR — official docs (updated 2026-02-20)](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
- [Sanity technical limits — official docs](https://www.sanity.io/docs/content-lake/technical-limits)
- [Sanity API CDN — official docs](https://www.sanity.io/docs/content-lake/api-cdn)
- [next-sanity GitHub — official toolkit](https://github.com/sanity-io/next-sanity)
- [Sanity webhook revalidation pitfalls — community](https://www.sanity.io/answers/nextjs-adds-revalidation-but-doesn-t-allow-sub-queries-in-webhooks)
- [revalidateTag issues with Sanity — GitHub issue](https://github.com/sanity-io/next-sanity/issues/639)
- [Framer Motion bundle size reduction — official docs](https://motion.dev/docs/react-reduce-bundle-size)
- [Next.js Framer Motion App Router issue — GitHub](https://github.com/vercel/next.js/issues/49279)
- [Next.js Image optimization — official docs](https://nextjs.org/docs/app/api-reference/components/image)
- [CLS with next/image fill — Medium](https://medium.com/@nicholasrussellconsulting/industry-standard-practices-for-rendering-cls-safe-cms-images-in-next-js-bf99fcc8d7e3)
- [Next.js multilingual SEO checklist — staarter.dev](https://staarter.dev/blog/nextjs-multilingual-seo-checklist-2024)
- [Hreflang canonical tags Next.js 15 — Build with Matija](https://www.buildwithmatija.com/blog/nextjs-advanced-seo-multilingual-canonical-tags)
- [Sanity i18n field-level vs document-level — Medium](https://medium.com/@erindhoxha/sanity-cms-translations-field-level-or-document-level-2f1a8f84f56e)
- [Sanity localization — official docs](https://www.sanity.io/docs/studio/localization)
- [Sanity Studio embedding — official docs](https://www.sanity.io/docs/studio/embedding-sanity-studio)
- [Google Consent Mode mistakes 2025 — Bounteous](https://www.bounteous.com/insights/2025/07/30/top-7-google-consent-mode-mistakes-and-how-fix-them-2025/)
- [GTM GDPR Next.js — juliangeissler.de](https://juliangeissler.de/en/implementing-nextjs-cookie-consent-gdpr-compliant/)
- [Tailwind CSS v4 migration breaking changes](https://tailwindcss.com/docs/upgrade-guide)
- [LocalBusiness schema for restaurants — Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [ISR caching deep dive — Next.js GitHub discussion](https://github.com/vercel/next.js/discussions/54075)
- [Sanity bot traffic API request spike — community answer](https://www.sanity.io/answers/dealing-with-unprompted-requests-causing-high-bandwidth-and-request-count-)

---
*Pitfalls research for: Next.js + Sanity CMS multilingual restaurant website (UMAI Ramen)*
*Researched: 2026-02-22*
