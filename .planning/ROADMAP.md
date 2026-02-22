# Roadmap: UMAI Ramen — Refonte Site Web 2026

## Overview

Three phases deliver the complete site: Phase 1 locks in the structural decisions (Next.js 16 scaffold, Sanity v5 schemas, trilingual routing) that are expensive to undo later. Phase 2 assembles all content pages and integrations on top of that foundation. Phase 3 completes the cross-cutting concerns — SEO metadata, CNIL compliance, on-demand revalidation, and a Lighthouse audit — before launch.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Project scaffold, Sanity schemas, i18n routing, design system, and shared layout components
- [ ] **Phase 2: Content Pages** - All public pages (Accueil, Menu, Reservation, Commander, Notre Histoire, Infos, Gallery) with Sanity data and external integrations
- [ ] **Phase 3: SEO, Compliance, and Launch** - Metadata, JSON-LD, cookie consent, GTM/GA4, revalidation webhook, and Lighthouse performance audit

## Phase Details

### Phase 1: Foundation
**Goal**: A buildable, deployable project where every route is statically generated, Sanity Studio is accessible at /studio, trilingual locale routing works end-to-end, and the design system is ready for page assembly
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, DSGN-01, DSGN-02, DSGN-03, DSGN-04, DSGN-05, LAYT-01, LAYT-02, LAYT-03, LAYT-04, LAYT-05
**Success Criteria** (what must be TRUE):
  1. Running `next build` shows all content routes as static (`○`), not server-rendered (`λ`) — confirming ISR and next-intl are correctly wired
  2. Navigating to `/fr`, `/en`, `/de` each renders a locale-correct page with proper fonts and design tokens applied
  3. Visiting `/studio` opens Sanity Studio with the restaurant schemas (siteSettings, menuCategory, menuItem, gallery, page) populated and editable
  4. The sticky header, mobile hamburger menu, mobile sticky bottom bar, and footer render correctly at all breakpoints with UMAI brand tokens
  5. Decorative elements (seigaiha pattern, dotted borders) appear in footer without breaking the 1-per-section rule
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Next.js 16 scaffold with App Router, TypeScript, Tailwind CSS 4, proxy.ts middleware, next-intl v4 trilingual routing, ISR 60s baseline, webhook stub
- [ ] 01-02-PLAN.md — Sanity v5 schemas (siteSettings, menuCategory, menuItem, gallery, page), field-level localeString i18n, sanityFetch helper, GROQ queries, TypeGen, Studio at /studio
- [ ] 01-03-PLAN.md — Design system tokens (@theme), self-hosted fonts (DM Serif Display, Outfit, Noto Sans JP), LazyMotion wrapper, Header, MobileMenu, MobileBar, Footer with seigaiha, UI primitives

### Phase 2: Content Pages
**Goal**: A fully navigable multilingual site where visitors can browse the menu, learn UMAI's story, view photos, find contact info, and reach Gusty/Uber Eats in one click
**Depends on**: Phase 1
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, HOME-07, MENU-01, MENU-02, MENU-03, MENU-04, MENU-05, MENU-06, MENU-07, RESV-01, RESV-02, RESV-03, ORDR-01, ORDR-02, ORDR-03, ORDR-04, HIST-01, HIST-02, HIST-03, HIST-04, INFO-01, INFO-02, INFO-03, INFO-04, INFO-05, GLRY-01, GLRY-02, GLRY-03, INTG-01, INTG-02, INTG-03, INTG-04, INTG-05, INTG-06, INTG-07
**Success Criteria** (what must be TRUE):
  1. A visitor landing on the homepage sees the fullscreen hero with catchphrase and can reach Gusty reservation or Uber Eats ordering in one click from three locations (hero, header, mobile bar)
  2. The menu page displays all categories and items from Sanity with prices, dietary tags, JP names, and an availability toggle — items hidden in Studio disappear from the page without code changes
  3. Clicking "Réserver" on the reservation page opens Gusty in a new tab; clicking "Commander" on the order page offers Uber Eats, Gusty Click & Collect, and eazee-link options
  4. Notre Histoire renders 4 scroll sections with Framer Motion fade-in animations and leads to a reservation CTA at the bottom
  5. The gallery page shows a responsive photo grid where clicking a photo opens a lightbox with keyboard navigation and mobile swipe support
**Plans**: TBD

Plans:
- [ ] 02-01: Homepage (Accueil) — Hero, catchphrase, menu preview cards, USP blocks, Notre Histoire teaser, gallery section, social section
- [ ] 02-02: Menu page — Sanity-driven categories/items, sticky sub-nav, dietary tags, extras grid, formules section, eazee-link CTA
- [ ] 02-03: Reservation, Commander, Notre Histoire, Infos, Gallery pages — all CTAs, Framer Motion storytelling, lightbox, Google Maps embed, FAQ

### Phase 3: SEO, Compliance, and Launch
**Goal**: The site is legally compliant, correctly indexed in three language variants, analytics fire only after consent, and every page scores Lighthouse > 90
**Depends on**: Phase 2
**Requirements**: SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, CMPL-01, CMPL-02, CMPL-03, CMPL-04, CMPL-05, CMPL-06, PERF-01, PERF-02, PERF-03, PERF-04, PERF-05, PERF-06, FOUND-07
**Success Criteria** (what must be TRUE):
  1. Google Rich Results Test validates Restaurant JSON-LD on the homepage and MenuSection/MenuItem schema on the menu page with no errors
  2. The cookie consent banner appears on first visit in the correct language with equal-prominence accept/reject buttons; GA4 network requests are absent before consent and present after
  3. French legal pages (mentions légales, politique de confidentialité, politique cookies, CGV) are accessible from the footer in all three locales
  4. Editing a menu item in Sanity Studio and waiting 65 seconds shows the change on the live site without redeployment (ISR webhook end-to-end)
  5. Lighthouse scores > 90 on Performance, SEO, Accessibility, and Best Practices for the homepage and menu page on Slow 4G throttling
**Plans**: TBD

Plans:
- [ ] 03-01: SEO layer — generateMetadata with hreflang, JSON-LD schemas (Restaurant, Menu), sitemap.xml, robots.txt, NAP consistency audit
- [ ] 03-02: Compliance and revalidation — cookie consent banner (3 languages, Consent Mode v2), GTM/GA4 consent-gated, legal pages, Sanity webhook handler with HMAC validation
- [ ] 03-03: Performance audit — Lighthouse on all pages, bundle analysis (< 150KB/route), CLS verification, ISR end-to-end test, production CORS check

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Content Pages | 0/3 | Not started | - |
| 3. SEO, Compliance, and Launch | 0/3 | Not started | - |
