# Project Research Summary

**Project:** UMAI Ramen — Premium Multilingual Restaurant Website
**Domain:** Single-location artisanal restaurant website (headless CMS + trilingual + ISR)
**Researched:** 2026-02-22
**Confidence:** HIGH

## Executive Summary

UMAI Ramen is a premium single-location ramen bar in Strasbourg requiring a trilingual (FR/EN/DE) marketing and discovery site with headless CMS ownership. The research confirms that the best approach for this project class is Next.js App Router with Sanity headless CMS, using ISR for content freshness, next-intl for locale routing, and a clean Server Component architecture. All four research streams agree: the critical structural decisions — i18n routing, Sanity schema design, and Server/Client boundaries — must be locked in during project setup, not retrofitted. Every page and component added afterward depends on these foundations being correct.

The ecosystem has moved significantly beyond the project's initial assumptions. Next.js is now at v16.1.6 (not v14), Sanity is v5 (requires React 19.2), the animation library is now `motion` (rebranded from `framer-motion`), and next-intl is at v4.8.3 (ESM-only). Starting on these current versions avoids mid-project migration pain and takes advantage of stable APIs (Turbopack default, Promise-based params, Tailwind CSS 4 CSS-first config). The UMAI free-tier Sanity budget is well within limits for this site's content volume.

The primary risks are architectural, not feature-related. Three decisions must be made correctly in Phase 1 and are expensive to undo: (1) `setRequestLocale()` placement throughout the locale layout tree (or ISR silently breaks), (2) field-level i18n strategy in Sanity schemas (or data migration is required later), and (3) the `"use client"` boundary for Framer Motion (or the entire JS bundle explodes). CNIL/GDPR compliance is non-negotiable for a French site — cookie consent must gate GTM/GA4 before analytics can fire. These risks are all preventable if addressed in the correct phase.

---

## Key Findings

### Recommended Stack

The project's tech stack is more current than the initial plan assumed, but the direction is correct. The recommended stack centers on Next.js 16.1.6 with React 19.2, Sanity v5, next-intl v4.8.3, Tailwind CSS 4 (CSS-first configuration), and `motion` v12 (rebranded from Framer Motion). The `next-sanity` toolkit is mandatory — using `@sanity/client` alone does not handle Next.js 16 cache semantics correctly. Self-hosted fonts via `next/font/google` are required (no runtime CDN requests). The `next lint` command is removed in Next.js 16; use `eslint` directly. Middleware is renamed `proxy.ts` in Next.js 16.

See `.planning/research/STACK.md` for full version table, installation commands, and patterns.

**Core technologies:**
- **Next.js 16.1.6**: Full-stack framework — current stable, Turbopack default, App Router mature; start here to avoid migration
- **React 19.2**: UI runtime — required by both Next.js 16 and Sanity v5; not optional
- **TypeScript 5.3+**: Type safety — required by next-intl v4; use `sanity typegen` to generate GROQ types
- **Sanity v5**: Headless CMS — React 19.2 required; free tier comfortably covers restaurant scale; Studio at `/studio`
- **Tailwind CSS 4.x**: Styling — CSS-first config (`@theme {}` in globals.css); 3.78x faster builds; OKLCH color space
- **next-intl 4.8.3**: i18n routing — App Router-native; GDPR-compliant locale cookies; strictly-typed locales
- **motion v12** (package: `motion`, import from `motion/react`): Animations — rebranded from `framer-motion`; React 19 compatible
- **next-sanity**: ISR integration — `sanityFetch()` helper, tag-based revalidation, webhook verification

**Critical "do not use" items:**
- `framer-motion` (use `motion` package instead)
- `tailwindcss` as PostCSS plugin (use `@tailwindcss/postcss`)
- `tailwind.config.js` (removed; use `@theme {}` in CSS)
- `@sanity/client` without `next-sanity` wrapper
- `next lint` command (removed in Next.js 16)
- `middleware.ts` (renamed to `proxy.ts` in Next.js 16)

### Expected Features

All P1 features are launch-required with no exceptions. There are no optional deferrable items in the P1 set. The site has hard legal requirements (CNIL cookie consent, French legal pages) and hard market requirements (trilingual, local SEO). The dependency chain means Sanity CMS setup is a P1 blocker for everything else.

See `.planning/research/FEATURES.md` for full dependency graph, anti-feature analysis, and prioritization matrix.

**Must have — table stakes (users assume these exist):**
- Full Sanity-managed menu with categories, prices, dietary tags, availability toggle
- Reservation CTA to Gusty (external link only — no embeddable widget)
- Ordering CTAs: Uber Eats + Gusty Click & Collect (external links)
- Contact info + opening hours accessible site-wide
- Google Maps embed (lazy-loaded)
- Mobile-responsive design with sticky bottom CTA bar
- Professional food photography (29-photo Nis&For set via Sanity)
- Local SEO: JSON-LD Restaurant + LocalBusiness + Menu schema, NAP consistency
- Cookie consent CNIL-compliant (equal accept/reject; blocks GA4 until consent)
- French legal pages: mentions légales, politique de confidentialité, cookies
- Social links: Instagram + Facebook in footer

**Should have — differentiators:**
- Trilingual FR/EN/DE with next-intl locale routing and Sanity i18n fields
- Japanese-inspired design system (seigaiha, DM Serif Display, Noto Sans JP micro-labels, ivoire palette)
- "Notre Histoire" 4-section scroll storytelling with Framer Motion
- Photo gallery with accessible lightbox (keyboard navigation, swipe on mobile)
- ISR 60s revalidation + Sanity webhook for on-demand revalidation
- Sanity Studio at `/studio` for owner-operated content management
- GA4 via GTM (consent-gated)
- Performance: Lighthouse > 90 across all Core Web Vitals

**Defer to v1+ (post-launch validation required):**
- Instagram feed API embed (requires app review, token management)
- Blog/Actus section (only if owner commits to editorial cadence)
- Newsletter via Brevo (only when email marketing cadence confirmed)
- TikTok footer link (when account confirmed active)
- Social proof / testimonials strip

**Anti-features — explicitly excluded:**
- Hero slider/carousel (hurts CWV; single fixed hero is the spec)
- Video background hero (mobile autoplay blocked; bandwidth cost)
- PDF menu download (not indexable, becomes stale; use HTML menu)
- User accounts / login (no use case without on-site ordering)
- Real-time chat (requires staffing; FAQ page covers the need)

### Architecture Approach

The correct architecture is a clear three-layer system: (1) a Next.js App Router with two route groups — `(site)/[locale]/` for all public pages and `studio/[[...tool]]/` for Sanity Studio — isolated by separate layouts with no shared providers, (2) a data layer using `sanityFetch()` with ISR 60s baseline plus webhook-triggered `revalidateTag('sanity')` for on-demand invalidation, and (3) a translation split where UI strings live in `messages/{locale}.json` (via next-intl) and CMS content uses field-level i18n in Sanity schemas. All Sanity queries run exclusively in Server Components. Motion wrappers are thin `"use client"` leaf components that receive data as props — they never fetch data.

See `.planning/research/ARCHITECTURE.md` for full system diagram, data flow diagrams, component responsibility table, and build order.

**Major components:**
1. **`proxy.ts` (middleware)** — locale detection, redirect to `/fr` default, excludes `/studio` and `/api` from matcher
2. **`(site)/[locale]/layout.tsx`** — root layout: `<html lang>`, fonts, GTM (consent-gated), `NextIntlClientProvider`, `generateStaticParams`
3. **`sanity/lib/fetch.ts` (`sanityFetch`)** — ISR cache wrapper with `revalidate: 60` and tag `'sanity'`; server-only
4. **`sanity/lib/queries.ts`** — all GROQ queries via `defineQuery()`; typed by `sanity typegen`
5. **`app/api/revalidate/route.ts`** — Sanity webhook handler; validates HMAC signature, calls `revalidateTag('sanity')`
6. **`studio/[[...tool]]/page.tsx`** — `<NextStudio config={sanityConfig} />`; optional catch-all is mandatory
7. **`components/motion/`** — all `"use client"` animation wrappers; `LazyMotion + m` for bundle efficiency
8. **`messages/{fr,en,de}.json`** — UI string dictionaries; separate from CMS content translations
9. **Sanity schemas** — field-level i18n via `localeString` object type (not `@sanity/document-internationalization`)

**Build order dependency chain:**
```
Sanity schemas + env → sanityFetch + queries + TypeGen types
    → next-intl routing + proxy.ts + message files
    → Root layout + locale layout (providers, fonts)
    → Design tokens (Tailwind) + motion wrappers
    → Shared UI components
    → Page-specific sections (Hero, Menu, Gallery, etc.)
    → Individual pages (assemble sections, metadata)
    → SEO layer (JSON-LD, sitemap, hreflang)
    → Studio route (sanity.config.ts desk structure)
    → Revalidation API + Sanity webhook
    → Cookie consent + GTM
```

### Critical Pitfalls

The top 6 pitfalls from research, ordered by phase impact and recovery cost:

1. **next-intl breaks ISR (all content routes become dynamic)** — Missing `setRequestLocale(locale)` before any `useTranslations()` call silently converts static pages to server-rendered. Prevention: add `setRequestLocale()` at the top of every `layout.tsx` and `page.tsx` under `[locale]/`, and add `generateStaticParams` returning `routing.locales.map(l => ({ locale: l }))`. Verify with `next build` output — routes must show `○` not `λ`.

2. **Sanity i18n strategy locked in early — costly to change** — Choosing the wrong strategy (field-level vs document-level) after content entry requires data migration. For this project: use field-level (`localeString` object type with `fr`, `en`, `de` fields) for all text fields. Do NOT use `@sanity/document-internationalization` for menu items — it triples document count and complicates GROQ queries.

3. **Sanity double-cache stale content (ISR + CDN)** — Using `useCdn: true` in the revalidation webhook route means Next.js fetches "fresh" data from Sanity's CDN (still cached), not origin. Content appears stuck even after webhook fires. Prevention: two separate Sanity clients — `useCdn: true` for ISR fetches (cost-efficient), `useCdn: false` for the webhook revalidation route only.

4. **Hero `next/image fill` causes CLS score failure** — Without explicit `h-[100dvh]` on the parent container plus `priority` prop, the hero image causes CLS > 0.1 (target < 0.1). Set this pattern before building any section components.

5. **Framer Motion forces entire page into client bundle** — Importing `motion` anywhere other than a leaf `"use client"` component pulls the full library (~90KB gzipped) into all routes. Use `LazyMotion + m` components for tree-shaking; reserve Framer Motion for interactive animations only, CSS for simple fades.

6. **GTM fires before CNIL cookie consent** — French law requires explicit consent before any tracking script executes. GA4 collecting data before consent is an enforcement risk (CNIL issued 331 actions in 2024). GTM must be dynamically injected only after consent grant; implement Consent Mode v2 with all storage defaulting to `denied`.

---

## Implications for Roadmap

### Phase 1: Foundation — Project Setup, i18n Routing, and Sanity Schema

**Rationale:** Architecture research explicitly identifies a 12-step dependency chain where steps 1-4 are blockers for everything else. i18n routing must be established before any page is built (retrofitting is expensive). Sanity schemas must be finalized before any content is entered (migration is costly). These two pieces share the same phase because both are structural decisions that cannot be undone without rework.

**Delivers:** A buildable project scaffold. Running `next build` at the end of this phase shows all routes as `○` (static), confirms locale routing works, and confirms Sanity Studio is accessible at `/studio`.

**Addresses (from FEATURES.md):** Trilingual FR/EN/DE foundation, Sanity CMS setup, ISR infrastructure

**Avoids (from PITFALLS.md):** next-intl ISR breakage (Pitfall 1), Sanity i18n strategy locked in wrong (Pitfall 3), next-intl middleware catching `/studio` (Integration Gotcha)

**Key deliverables:**
- Next.js 16 project initialized with App Router, TypeScript, Tailwind CSS 4
- `proxy.ts` with next-intl middleware (excludes `/studio`, `/api` from matcher)
- `(site)/[locale]/` route group with root layout, `generateStaticParams`, `setRequestLocale`
- `studio/[[...tool]]/` route group with isolated layout and `<NextStudio />`
- Sanity v5 schemas: `siteSettings`, `menuCategory`, `menuItem`, `page`, `gallery`, `heroBlock` — all with `localeString` field-level i18n
- `sanityFetch()` helper + GROQ queries + `sanity typegen` types
- `messages/fr.json`, `messages/en.json`, `messages/de.json` — UI string structure
- Environment variables: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`, `SANITY_REVALIDATION_SECRET`

**Research flag:** Standard patterns — no additional research needed. Official docs for Next.js 16, next-intl v4, and Sanity v5 are high-confidence sources.

---

### Phase 2: Design System and Core Components

**Rationale:** Before building any page-specific sections, the design token system and reusable component primitives must exist. This phase also establishes the `"use client"` boundary pattern for Framer Motion before it's tempted into the wrong place, and locks in the hero image CLS-safe pattern before other sections copy it. Getting the design system right here prevents visual inconsistency across all subsequent phases.

**Delivers:** A component library that any page can assemble from. Visual identity is consistent from first build.

**Addresses (from FEATURES.md):** Japanese-inspired design system, DM Serif Display + Outfit + Noto Sans JP fonts, ivoire `#F5F0E8` + vert `#77967A` palette, mobile-responsive patterns, sticky header and mobile CTA bar

**Avoids (from PITFALLS.md):** Framer Motion client bundle explosion (Pitfall 6), Hero CLS failure (Pitfall 4), Font FOUT with self-hosted fonts (Performance Trap)

**Key deliverables:**
- Tailwind CSS 4 `@theme {}` block with brand tokens: `--color-ivoire`, `--color-vert-accent`, `--font-display`, `--font-body`, `--font-jp`
- `app/fonts.ts` — `DM_Serif_Display`, `Outfit`, `Noto_Sans_JP` via `next/font/google` (self-hosted; JP subset limited to specific kanji)
- `components/motion/` — `MotionSection`, `MotionDiv` wrappers using `LazyMotion + m` pattern
- `components/layout/` — `Header` (sticky, logo center, nav left, CTAs right), `Footer` (contact, social, legal links), `MobileBar` (sticky bottom reserve/order), `CookieBanner`
- `components/ui/` — `Button`, `SectionLabel`, `MenuItem`, `CategoryHeader` primitives
- Hero component pattern: `<div className="relative h-[100dvh]"><Image fill priority sizes="100vw" /></div>`

**Research flag:** Standard patterns for component architecture. Motion patterns from ARCHITECTURE.md and PITFALLS.md are well-documented. No additional research needed.

---

### Phase 3: Content Pages (Accueil, Menu, Notre Histoire, Galerie, Infos)

**Rationale:** With foundation and design system in place, all five core pages can be assembled from Server Components pulling Sanity data. Pages are built in dependency order: homepage (Accueil) first as it contains the hero and primary CTAs, Menu second as it's the highest-value content, then storytelling and gallery pages, then Infos last (it has the Google Maps embed that needs lazy-loading consideration).

**Delivers:** A functionally complete multilingual restaurant site — visitors can see the menu, learn about the restaurant, view photos, and find contact/hours information in all three languages.

**Addresses (from FEATURES.md):** Hero section, full menu display, Notre Histoire storytelling, photo gallery with lightbox, Infos page with Google Maps, professional food photography, Gusty/Uber Eats CTAs, opening hours, contact info

**Avoids (from PITFALLS.md):** Client-side GROQ queries (Anti-Pattern 1), hardcoded external URLs (Anti-Pattern 5), missing `lang` attribute per locale (UX Pitfall), external links without `target="_blank"` (UX Pitfall), Google Maps iframe loading without consent gating

**Key deliverables:**
- `app/(site)/[locale]/page.tsx` — Accueil: Hero (fullscreen image, catchphrase, reserve CTA), teaser sections
- `app/(site)/[locale]/menu/page.tsx` — Menu: categories, items with dietary tags, prices, availability state; locale-parameterized GROQ
- `app/(site)/[locale]/histoire/page.tsx` — Notre Histoire: 4-section scroll narrative with `MotionSection` wrappers
- `app/(site)/[locale]/galerie/page.tsx` — Photo gallery: `yet-another-react-lightbox`, keyboard navigation, swipe, ARIA
- `app/(site)/[locale]/infos/page.tsx` — Infos: hours, address, click-to-call phone, lazy Google Maps embed, FAQ
- `app/(site)/[locale]/reservation/page.tsx` and `commander/page.tsx` — CTA redirect pages (link to Gusty/Uber Eats)
- `app/(site)/[locale]/[slug]/page.tsx` — Legal pages: mentions légales, politique de confidentialité, cookies

---

### Phase 4: SEO, Metadata, and Sitemap

**Rationale:** SEO is a cross-cutting concern that touches every page, but it can only be implemented after pages exist. It must be a dedicated phase rather than an afterthought — hreflang errors discovered weeks after launch require waiting 1-4 weeks for Google to recrawl. JSON-LD schema must use the correct `Restaurant` type (not generic `LocalBusiness`) to qualify for rich results. NAP consistency must be audited across footer, JSON-LD, and Google Business Profile as a single operation.

**Delivers:** A site indexed correctly in all three language variants with rich result eligibility for menu items, opening hours panel, and local business knowledge panel.

**Addresses (from FEATURES.md):** Local SEO, JSON-LD Restaurant + Menu + LocalBusiness schema, hreflang, sitemap.xml, NAP consistency

**Avoids (from PITFALLS.md):** Hreflang missing or incorrect (Pitfall 5), wrong JSON-LD type (generic `LocalBusiness` instead of `Restaurant`), missing `metadataBase` causing relative hreflang URLs, sitemap covering only FR pages

**Key deliverables:**
- `generateMetadata()` on every page with `metadataBase: new URL('https://umai-ramen.fr')`, `alternates.languages` for all 3 locales plus `x-default: '/fr'`
- JSON-LD `Restaurant` schema on homepage with `openingHoursSpecification`, `address` (NAP), `telephone`, `menu` link
- JSON-LD `MenuSection` + `MenuItem` schema on menu page per category/item
- `app/sitemap.ts` — generates entries for all 3 locales × all routes
- `app/robots.ts` — allows indexing, blocks `/studio`
- NAP consistency audit: same address string in JSON-LD, footer, Google Maps embed

**Research flag:** Standard patterns — Google Search Central documentation is authoritative. next-intl v4 `generateMetadata` patterns are well-documented.

---

### Phase 5: CMS Revalidation and Analytics

**Rationale:** ISR is already in place (60s baseline from Phase 1), but on-demand revalidation via Sanity webhooks and the consent-gated analytics setup are operational concerns that don't block content but must be correct before launch. Cookie consent must be built before GA4 is enabled — not concurrently — to avoid accidental CNIL violation.

**Delivers:** Content changes in Sanity Studio propagate to the live site within seconds (not 60s). Analytics data collection begins post-launch with CNIL compliance verified.

**Addresses (from FEATURES.md):** ISR on-demand revalidation, GA4 via GTM, CNIL-compliant cookie consent in all 3 languages

**Avoids (from PITFALLS.md):** Sanity double-cache stale content (Pitfall 2), GTM fires before consent (Pitfall 6), unprotected webhook endpoint (Security Mistake), Google Maps iframe before consent (Integration Gotcha)

**Key deliverables:**
- `app/api/revalidate/route.ts` — POST handler: HMAC signature validation via `parseBody()` from `next-sanity/webhook`, calls `revalidateTag('sanity')` with `useCdn: false` client
- Sanity webhook configured: `GROQ-Powered Webhook → POST https://umai-ramen.fr/api/revalidate`, secret set
- `SANITY_REVALIDATION_SECRET` env var in Vercel project settings
- `CookieBanner` component — bottom bar (not modal overlay), equal-prominence accept/reject, 3-language strings, persists in `localStorage`
- GTM script injected dynamically only after consent grant (Consent Mode v2, all storage default `denied`)
- GA4 via GTM — tag fires only after analytics consent granted
- `@vercel/speed-insights` added to root layout

**Research flag:** Cookie consent + Consent Mode v2 integration may benefit from a quick targeted research pass during planning — CNIL requirements are specific and the GTM consent handoff has multiple implementation approaches.

---

### Phase 6: Performance Audit and Pre-Launch Polish

**Rationale:** Lighthouse > 90 is a hard requirement (both a project spec and a prerequisite for effective local SEO). This phase is a dedicated audit pass before launch — not a cleanup afterthought. It also covers production-environment testing (Sanity Studio CORS, locale routing on production domain, webhook end-to-end verification).

**Delivers:** A production-ready site with verified Lighthouse scores, confirmed CNIL compliance in production, and a validated end-to-end content update flow.

**Addresses (from FEATURES.md):** Lighthouse > 90 performance target, Sanity Studio production accessibility

**Avoids (from PITFALLS.md):** Multiple `priority` images per page, missing `sizes` prop on images, full Framer Motion bundle on non-interactive pages, Sanity Studio CORS error in production, router cache not invalidated after revalidation

**Key deliverables:**
- Lighthouse audit on all 5 core pages (cold load, Slow 4G throttling, incognito)
- Bundle analyzer: no route exceeds 150KB JS
- CLS < 0.05 on homepage and menu page
- `next build` output: all content pages show `○` (static)
- Cookie consent verification: GA4 beacon absent before consent, present after
- Sanity Studio CORS configured, accessible from non-localhost browser
- ISR end-to-end test: edit in Studio → wait 65s → hard refresh → content updated
- hreflang validation via Google Rich Results Test
- JSON-LD validation via Google Rich Results Test
- "Looks done but isn't" checklist from PITFALLS.md completed

**Research flag:** Standard verification patterns. No additional research needed.

---

### Phase Ordering Rationale

- **Foundation before everything:** The dependency chain from ARCHITECTURE.md is explicit — Sanity schemas and i18n routing must precede all page work. The ISR + next-intl static rendering interaction is the highest-risk pitfall, and the only way to prevent it is to set up the pattern correctly in Phase 1 before any page exists to break it.
- **Design system before pages:** Components are shared across all pages. Building them after pages leads to inconsistency and rework. The hero CLS pattern and motion boundary pattern must be established as shared standards.
- **Pages before SEO:** SEO metadata is implemented per-page; pages must exist first. SEO is a discrete phase, not an add-on to each page build, because the hreflang + sitemap concerns are cross-cutting.
- **Analytics after consent:** Cookie consent must be verified working before GA4 is enabled. Building both in the same phase risks the consent gating being bypassed during development.
- **Performance audit last:** Only meaningful once all content and integrations are in place. Running it per-phase would give false signals.

---

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 5 (Cookie consent + GTM):** CNIL Consent Mode v2 specifics are evolving. The interaction between `CookieBanner`, GTM Consent Mode v2 defaults, and the exact sequence of script injection has multiple valid approaches. A targeted research pass will clarify the safest implementation pattern.

Phases with well-documented standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Next.js 16, next-intl v4, and Sanity v5 official docs are comprehensive and high-confidence.
- **Phase 2 (Design system):** Tailwind CSS 4, next/font, and motion v12 patterns are well-documented with no surprises.
- **Phase 3 (Content pages):** ISR + Server Component + Sanity data fetching patterns are established and validated.
- **Phase 4 (SEO):** Google Search Central documentation is authoritative; next-intl generateMetadata patterns are documented.
- **Phase 6 (Performance audit):** Verification checklists and tooling are standard.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against official documentation and release notes. Version corrections (Next.js 16, Sanity v5, next-intl v4, motion v12) have HIGH confidence sources. |
| Features | MEDIUM-HIGH | Table stakes verified across multiple industry sources. Differentiators derived from pattern analysis of premium restaurant sites. CNIL requirements verified via legal firm analysis and CNIL enforcement data. |
| Architecture | HIGH | Official Next.js, next-intl, and Sanity docs consulted directly. Build order and component patterns validated against multiple implementation guides. |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls verified against official docs and GitHub issues. Some edge cases (ISR double-cache, attribute limits) validated via community sources with multiple agreeing parties. |

**Overall confidence:** HIGH

### Gaps to Address

- **Gusty Click & Collect URL:** The exact URL for Gusty C&C is pending. Store a placeholder in `siteSettings.clickAndCollectUrl` in Sanity — the owner can update via Studio without code changes. Do not block launch on this.
- **Provisional opening hours:** Hours listed in FEATURES.md are pending validation by the owner. Design the Sanity `siteSettings` schema to make hours easy to update — use a structured object, not a free-text field, to ensure correct JSON-LD `openingHoursSpecification` format.
- **Noto Sans JP kanji subset:** The exact kanji used in the design (seigaiha labels, section decorators) must be identified before Phase 2 to enable font subsetting. Loading the full CJK font adds ~50KB for FR/EN visitors.
- **Sanity Studio CORS production config:** CORS must be explicitly configured in the Sanity project settings to allow the production domain. This is easy to miss and only manifests in production. Add to the Phase 6 checklist.
- **Gusty reservation widget availability:** Research confirms no embeddable iframe widget is available from Gusty. Only external link CTA is possible. If this changes, the reservation UX could be improved. Recheck at Phase 3.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16.1 Release Blog](https://nextjs.org/blog/next-16-1) — stable version, Turbopack, async params requirement
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — proxy.ts rename, serverRuntimeConfig removal
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, `@tailwindcss/postcss`, `@import "tailwindcss"`
- [Sanity Studio v5 Blog](https://www.sanity.io/blog/sanity-studio-v5) — React 19.2 requirement confirmed
- [Sanity Pricing Page](https://www.sanity.io/pricing) — free tier limits verified
- [next-intl v4.0 Release Blog](https://next-intl.dev/blog/next-intl-4-0) — ESM-only, TypeScript 5+, GDPR cookies
- [next-intl App Router setup](https://next-intl.dev/docs/getting-started/app-router) — `setRequestLocale`, `generateStaticParams` pattern
- [Motion for React upgrade guide](https://motion.dev/docs/react-upgrade-guide) — rebranding from framer-motion, v12 patterns
- [next-sanity GitHub](https://github.com/sanity-io/next-sanity) — `sanityFetch`, webhook verification, ISR patterns
- [Local Business Structured Data — Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/local-business) — JSON-LD Restaurant type
- [Next.js App Router ISR guide](https://nextjs.org/docs/app/guides/incremental-static-regeneration) — `revalidateTag`, cache tags
- [Next.js Project Structure (2026-02-20)](https://nextjs.org/docs/app/getting-started/project-structure) — file conventions
- [Embedding Sanity Studio](https://www.sanity.io/docs/studio/embedding-sanity-studio) — `[[...tool]]` catch-all requirement
- [Sanity technical limits](https://www.sanity.io/docs/content-lake/technical-limits) — 2,000 attribute free-tier ceiling

### Secondary (MEDIUM confidence)
- [CNIL enforcement actions 2024 — Bird & Bird](https://www.twobirds.com/en/insights/2025/france/cnil-continues-to-crumble-cookies-recent-enforcement-actions-impact-on-organisations-with-a-french-p) — 331 enforcement actions, equal-prominence consent buttons
- [Sanity i18n field-level vs document-level — Medium](https://medium.com/@erindhoxha/sanity-cms-translations-field-level-or-document-level-2f1a8f84f56e) — field-level recommendation for small sites
- [Building multilingual Next.js + Sanity site](https://schemaui.com/blog/building-a-multilingual-website-with-next-js-and-sanity) — implementation patterns
- [Framer Motion bundle size reduction](https://motion.dev/docs/react-reduce-bundle-size) — `LazyMotion + m` pattern
- [CLS with next/image fill — Medium](https://medium.com/@nicholasrussellconsulting/industry-standard-practices-for-rendering-cls-safe-cms-images-in-next-js-bf99fcc8d7e3) — `h-[100dvh]` parent pattern
- [Hreflang canonical tags Next.js 15](https://www.buildwithmatija.com/blog/nextjs-advanced-seo-multilingual-canonical-tags) — `alternates.languages` implementation
- [Zenchef 61% online reservation stat](https://www.zenchef.com) — cited across multiple industry sources
- GitHub issue: `setRequestLocale` + `generateStaticParams` interaction — verified bug and fix

---

*Research completed: 2026-02-22*
*Ready for roadmap: yes*
