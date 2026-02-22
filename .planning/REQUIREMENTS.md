# Requirements: UMAI Ramen

**Defined:** 2026-02-22
**Core Value:** Visitors can reserve a table or order food in one click, while experiencing UMAI's artisanal brand identity through professional photography and refined Japanese-inspired design.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: Project scaffolded with Next.js 16, React 19.2, TypeScript, Tailwind CSS 4, App Router
- [x] **FOUND-02**: Sanity v5 CMS initialized with embedded Studio accessible at /studio
- [x] **FOUND-03**: Trilingual routing FR/EN/DE via next-intl with /{locale}/... URL structure
- [x] **FOUND-04**: ISR with 60s revalidation baseline for all content pages
- [x] **FOUND-05**: Sanity field-level i18n (localeString) on all text content fields
- [x] **FOUND-06**: sanityFetch helper with tag-based revalidation and TypeGen types for all GROQ queries
- [x] **FOUND-07**: Sanity webhook endpoint for on-demand revalidation with HMAC signature validation

### Design System

- [x] **DSGN-01**: Tailwind CSS 4 theme tokens: ivoire #F5F0E8, vert accent #77967A (from Sanity), DM Serif Display, Outfit, Noto Sans JP
- [x] **DSGN-02**: Self-hosted fonts via next/font with zero layout shift
- [x] **DSGN-03**: Decorative elements: seigaiha SVG pattern, dotted borders, line-art icons, JP micro-labels (1 max per section rule enforced)
- [x] **DSGN-04**: Responsive layout: max-width 1200px, 12-col desktop / 8-col tablet / 4-col mobile, abundant whitespace
- [x] **DSGN-05**: Motion wrappers using LazyMotion + m components for tree-shaking (no full framer-motion import)

### Layout

- [x] **LAYT-01**: Sticky header with logo center, navigation left, reserve/order CTAs right
- [x] **LAYT-02**: Mobile hamburger menu with slide-in navigation
- [x] **LAYT-03**: Mobile sticky bottom bar with reserve + order CTAs
- [x] **LAYT-04**: Footer with 4 columns: logo/baseline, contact, navigation links, social/legal
- [x] **LAYT-05**: Footer includes seigaiha pattern and line-art decoration

### Accueil (Homepage)

- [ ] **HOME-01**: Fullscreen hero with fixed photo (next/image priority + rgba overlay), no slider, no gradient
- [ ] **HOME-02**: Hero displays editable catchphrase (default: "Nouilles fraiches. Bouillons maison.") + reserve/order CTAs
- [ ] **HOME-03**: Menu preview section with 3 visual category cards linking to /menu
- [ ] **HOME-04**: USP section with 3 proof blocks (nouilles fraiches, bouillons maison, 100% local) in dotted borders
- [ ] **HOME-05**: Notre Histoire teaser with photo + short text + CTA to /notre-histoire
- [ ] **HOME-06**: Photo gallery section with responsive grid
- [ ] **HOME-07**: Social section with Instagram link and hashtag

### Menu

- [ ] **MENU-01**: Full menu displayed from Sanity CMS with categories, items, prices, descriptions, dietary tags
- [ ] **MENU-02**: Sticky sub-navigation by category (scroll to section)
- [ ] **MENU-03**: Menu items show FR name + JP name + price + description + vegetarian/gluten-free badges
- [ ] **MENU-04**: Extras grid section with supplementary items and prices
- [ ] **MENU-05**: Menu formules section (Menu Gyoza, Menu Enfant)
- [ ] **MENU-06**: Availability toggle per item (owner can hide items via Sanity without deleting)
- [ ] **MENU-07**: CTA to eazee-link for full digital menu (external link, new tab)

### Reservation

- [ ] **RESV-01**: Reservation page with prominent CTA to Gusty booking URL
- [ ] **RESV-02**: Practical info section: address, hours, phone, Google Maps embed
- [ ] **RESV-03**: Micro-copy explaining reservation is free and without commission

### Commander (Ordering)

- [ ] **ORDR-01**: Order page with Uber Eats link (delivery) + badge
- [ ] **ORDR-02**: Gusty Click & Collect CTA (placeholder URL, editable via Sanity)
- [ ] **ORDR-03**: eazee-link CTA to consult menu
- [ ] **ORDR-04**: Micro-copy for each ordering option

### Notre Histoire

- [ ] **HIST-01**: Scroll storytelling with 4 sections: Passion du ramen, Fait maison, Local, Experience UMAI
- [ ] **HIST-02**: Each section has photo + narrative text (editable via Sanity)
- [ ] **HIST-03**: Framer Motion scroll animations (fade-in-up on viewport entry)
- [ ] **HIST-04**: CTA at bottom linking to /reservation

### Infos

- [ ] **INFO-01**: Opening hours displayed (structured from Sanity, not free text)
- [ ] **INFO-02**: Address with Google Maps embed (lazy-loaded)
- [ ] **INFO-03**: Phone number with click-to-call link
- [ ] **INFO-04**: FAQ section: allergens, groups, vegetarian options
- [ ] **INFO-05**: Instagram + contact links

### Gallery

- [ ] **GLRY-01**: Responsive photo grid from Sanity gallery (masonry or CSS grid)
- [ ] **GLRY-02**: Lightbox on click with keyboard navigation and mobile swipe
- [ ] **GLRY-03**: Images served via Sanity CDN with WebP auto-conversion and responsive sizes

### Integrations

- [ ] **INTG-01**: Gusty reservation CTA on sticky header, hero, reservation page, and mobile bar
- [ ] **INTG-02**: Uber Eats delivery CTA on sticky header, hero, commander page, and mobile bar
- [ ] **INTG-03**: Gusty Click & Collect CTA on commander page (placeholder URL, Sanity-editable)
- [ ] **INTG-04**: eazee-link digital menu link on menu page and commander page
- [ ] **INTG-05**: Google Maps iframe embed on reservation and infos pages
- [ ] **INTG-06**: Instagram link in social section and footer
- [ ] **INTG-07**: Facebook link in footer

### SEO

- [ ] **SEO-01**: JSON-LD Restaurant + LocalBusiness schema on homepage with openingHoursSpecification
- [ ] **SEO-02**: JSON-LD MenuSection + MenuItem schema on menu page
- [ ] **SEO-03**: generateMetadata on every page with title, description, OG, Twitter Card x3 languages
- [ ] **SEO-04**: Hreflang alternates on every page pointing to FR/EN/DE variants + x-default
- [ ] **SEO-05**: Auto-generated sitemap.xml covering all routes x3 locales
- [ ] **SEO-06**: robots.txt allowing indexing, blocking /studio
- [ ] **SEO-07**: NAP consistency: identical name/address/phone in JSON-LD, footer, and Google Maps

### Compliance

- [ ] **CMPL-01**: Cookie consent banner: equal-prominence accept/reject, 3 languages, persists choice
- [ ] **CMPL-02**: GTM/GA4 fires only after explicit consent (Consent Mode v2, default denied)
- [ ] **CMPL-03**: Mentions legales page (French legal requirement)
- [ ] **CMPL-04**: Politique de confidentialite page
- [ ] **CMPL-05**: Politique cookies page
- [ ] **CMPL-06**: CGV page

### Performance

- [ ] **PERF-01**: Lighthouse > 90 on Performance, SEO, Accessibility, Best Practices for all pages
- [ ] **PERF-02**: Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms
- [ ] **PERF-03**: All images optimized via Sanity CDN (WebP, responsive sizes) + next/image
- [ ] **PERF-04**: Fonts self-hosted via next/font, no external CDN requests
- [ ] **PERF-05**: No JS route exceeds 150KB gzipped
- [ ] **PERF-06**: All content routes are statically generated (ISR), not server-rendered

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Social & Marketing

- **SOCL-01**: Instagram feed API embed (6 latest photos)
- **SOCL-02**: Blog/Actus ultra-light page
- **SOCL-03**: Newsletter signup via Brevo/Mailchimp with double opt-in
- **SOCL-04**: TikTok link in footer (when account confirmed)
- **SOCL-05**: Social proof / testimonials strip

### Enhanced UX

- **UX-01**: Hero A/B test (bol vs salle photo) if analytics volume sufficient
- **UX-02**: Menu search/filter functionality
- **UX-03**: Dark mode support

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hero slider/carousel | Hurts Core Web Vitals, most users only see first slide |
| Video background | Mobile autoplay blocked, bandwidth cost, no added value |
| PDF menu download | Not indexable, becomes stale, HTML menu is better |
| User accounts / login | No use case — orders via external platforms |
| Real-time chat | Requires staffing, FAQ covers the need |
| On-site ordering system | Orders delegated to Uber Eats and Gusty |
| Mobile native app | Web-first, responsive design covers mobile |
| Icon packs (FontAwesome) | Custom line-art SVGs match brand identity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| FOUND-05 | Phase 1 | Complete |
| FOUND-06 | Phase 1 | Complete |
| FOUND-07 | Phase 3 | Complete |
| DSGN-01 | Phase 1 | Complete |
| DSGN-02 | Phase 1 | Complete |
| DSGN-03 | Phase 1 | Complete |
| DSGN-04 | Phase 1 | Complete |
| DSGN-05 | Phase 1 | Complete |
| LAYT-01 | Phase 1 | Complete |
| LAYT-02 | Phase 1 | Complete |
| LAYT-03 | Phase 1 | Complete |
| LAYT-04 | Phase 1 | Complete |
| LAYT-05 | Phase 1 | Complete |
| HOME-01 | Phase 2 | Pending |
| HOME-02 | Phase 2 | Pending |
| HOME-03 | Phase 2 | Pending |
| HOME-04 | Phase 2 | Pending |
| HOME-05 | Phase 2 | Pending |
| HOME-06 | Phase 2 | Pending |
| HOME-07 | Phase 2 | Pending |
| MENU-01 | Phase 2 | Pending |
| MENU-02 | Phase 2 | Pending |
| MENU-03 | Phase 2 | Pending |
| MENU-04 | Phase 2 | Pending |
| MENU-05 | Phase 2 | Pending |
| MENU-06 | Phase 2 | Pending |
| MENU-07 | Phase 2 | Pending |
| RESV-01 | Phase 2 | Pending |
| RESV-02 | Phase 2 | Pending |
| RESV-03 | Phase 2 | Pending |
| ORDR-01 | Phase 2 | Pending |
| ORDR-02 | Phase 2 | Pending |
| ORDR-03 | Phase 2 | Pending |
| ORDR-04 | Phase 2 | Pending |
| HIST-01 | Phase 2 | Pending |
| HIST-02 | Phase 2 | Pending |
| HIST-03 | Phase 2 | Pending |
| HIST-04 | Phase 2 | Pending |
| INFO-01 | Phase 2 | Pending |
| INFO-02 | Phase 2 | Pending |
| INFO-03 | Phase 2 | Pending |
| INFO-04 | Phase 2 | Pending |
| INFO-05 | Phase 2 | Pending |
| GLRY-01 | Phase 2 | Pending |
| GLRY-02 | Phase 2 | Pending |
| GLRY-03 | Phase 2 | Pending |
| INTG-01 | Phase 2 | Pending |
| INTG-02 | Phase 2 | Pending |
| INTG-03 | Phase 2 | Pending |
| INTG-04 | Phase 2 | Pending |
| INTG-05 | Phase 2 | Pending |
| INTG-06 | Phase 2 | Pending |
| INTG-07 | Phase 2 | Pending |
| SEO-01 | Phase 3 | Pending |
| SEO-02 | Phase 3 | Pending |
| SEO-03 | Phase 3 | Pending |
| SEO-04 | Phase 3 | Pending |
| SEO-05 | Phase 3 | Pending |
| SEO-06 | Phase 3 | Pending |
| SEO-07 | Phase 3 | Pending |
| CMPL-01 | Phase 3 | Pending |
| CMPL-02 | Phase 3 | Pending |
| CMPL-03 | Phase 3 | Pending |
| CMPL-04 | Phase 3 | Pending |
| CMPL-05 | Phase 3 | Pending |
| CMPL-06 | Phase 3 | Pending |
| PERF-01 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |
| PERF-04 | Phase 3 | Pending |
| PERF-05 | Phase 3 | Pending |
| PERF-06 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 — traceability mapped after roadmap creation*
