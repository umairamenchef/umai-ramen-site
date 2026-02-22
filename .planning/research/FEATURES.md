# Feature Research

**Domain:** Premium single-location artisanal restaurant website (ramen noodle bar, upscale casual)
**Researched:** 2026-02-22
**Confidence:** MEDIUM-HIGH (table stakes verified across multiple sources; differentiators from pattern analysis)

---

## Context: UMAI Ramen Specific Constraints

Before the feature landscape, constraints that shape every decision:

- **Reservation:** Gusty only (external link/CTA, not embedded widget — no iFrame widget confirmed available)
- **Ordering:** Uber Eats (external link) + Gusty Click & Collect (external link, URL pending)
- **Digital menu at table:** eazee-link QR (external link from website)
- **CMS:** Sanity v3 — all content editable by restaurateur without code
- **Trilingual:** FR (primary) / EN / DE — required for Strasbourg's tourist and German-speaking audience
- **Payment:** NOT in scope — all payments via Gusty/Uber Eats
- **Audience:** Local Strasbourg diners + tourists (Krutenau neighborhood, alsatian city)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Full menu display | 77% of diners visit website before deciding to go; no menu = no reservation | MEDIUM | Managed via Sanity; categories, items, prices, dietary tags, availability toggle |
| Contact info visible everywhere | First thing mobile users look for; must be in footer and Infos page | LOW | Phone 09 52 34 34 38, address 5 rue des Orphelins; click-to-call on mobile |
| Opening hours | Critical for planning a visit; stale or missing hours = lost customers | LOW | Editable via Sanity siteSettings; provisional hours pending validation |
| Google Maps embed | 60%+ of traffic is mobile; users want one-tap directions | LOW | Lazy-loaded iframe; must match NAP data exactly for local SEO trust |
| Online reservation CTA | 61% of guests more likely to reserve where online booking exists (Zenchef data) | LOW | CTA links to Gusty booking URL; styled as primary CTA in header + mobile sticky bar |
| Online ordering CTA | Users expect delivery/takeout link; missing it sends them to Google search | LOW | Uber Eats link + Click & Collect Gusty link; two distinct CTAs |
| Professional food photography | Premium position requires quality visuals; stock photos immediately signal "generic" | MEDIUM | 29-photo Nis&For preselection; managed via Sanity with hotspot/crop |
| Mobile-responsive design | 62.45% of global searches from mobile (2025 data); Google mobile-first indexing | MEDIUM | Mobile sticky CTA bar at bottom; nav collapses; touch-friendly |
| Local SEO (Google Business Profile alignment) | Restaurant must appear in "ramen Strasbourg" searches | MEDIUM | JSON-LD Restaurant + LocalBusiness schema; NAP consistency; hreflang for 3 langs |
| Cookie consent (CNIL/RGPD) | French law requires explicit consent before GA4/GTM fires; CNIL issued 331 enforcement actions in 2024 | MEDIUM | Equal-prominence accept/reject buttons; banner in all 3 languages; GA4 blocked until consent |
| Legal pages | French law requires mentions légales, politique de confidentialité, CGV | LOW | Static pages; link in footer; not editable via Sanity (legal precision needed) |
| Social media links | Users expect to find Instagram/Facebook for social proof and atmosphere | LOW | Instagram @umai_ramen_strasbourg + Facebook in footer |

### Differentiators (Competitive Advantage)

Features that set UMAI apart. Not universally expected, but strongly valued by target audience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Trilingual FR/EN/DE | Strasbourg's unique position (Alsace region, German border, high tourist traffic) — rare for a ramen bar | HIGH | next-intl with /{locale}/... routing; hreflang in sitemap; Sanity i18n fields for content; UI via translation dictionaries |
| Sanity CMS content ownership | Owner edits menu, hours, photos, catchphrase without developer intervention | HIGH | Sanity Studio at /studio; critical for business autonomy; menu availability toggle is high-value |
| Japanese-inspired design system | Visual identity matches brand narrative (trained in Japan, handcrafted ramen); creates cohesion between digital and physical brand | MEDIUM | Seigaiha pattern, Noto Sans JP micro-labels, DM Serif Display titles, ivoire palette — all defined |
| "Notre Histoire" scroll storytelling | Emotional connection to founder's Japan training story; differentiates from anonymous fast-casual | MEDIUM | 4-section scroll narrative with Framer Motion; supports artisanal positioning |
| Photo gallery with lightbox | Showcases professional photography as primary brand asset; supports "experience-led positioning" trend | MEDIUM | Keyboard navigation, swipe on mobile, ARIA roles; images managed via Sanity |
| Catchphrase editable in real-time | "Nouilles fraiches. Bouillons maison." speaks to artisanal process; owner can update seasonally | LOW | Sanity siteSettings.catchphrase field; renders in hero |
| ISR with 60s revalidation | Menu/price changes visible within 1 minute without redeployment | MEDIUM | Next.js ISR; no client-side Sanity queries = no API key exposure, no loading spinners on menu |
| Structured data for menu items | Enables Google rich results for specific dishes; competitive SEO edge for "ramen Strasbourg" queries | MEDIUM | JSON-LD Menu schema per item; complements LocalBusiness schema |
| Accent color adjustable via Sanity | Seasonal brand refresh without developer; maintains single-accent design discipline | LOW | siteSettings.accentColor CSS custom property; constrained to single accent rule |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create disproportionate problems for this project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Hero slider/carousel | "Show multiple dishes/moods" | Hurts Core Web Vitals (LCP degrades with lazy-loaded slides), most users only see first slide, adds JS weight | Single fixed fullscreen hero image with rgba overlay; swap via Sanity when season changes |
| Instagram feed API embed (v0) | "Keep site fresh with social content" | Instagram Graph API requires app review, access tokens expire, rate limits, adds JS bundle weight, breaks when API changes | Simple Instagram link in footer + social section; defer API embed to v1 after launch validation |
| Real-time chat | "Help customers with questions" | High complexity, requires staffing/monitoring, adds third-party JS, CNIL consent implications | Comprehensive FAQ section on Infos page; phone number click-to-call |
| Full online ordering system | "Own the ordering experience" | Rebuilding what Uber Eats/Gusty already do; payment processing compliance (PCI-DSS), kitchen integration, fraud risk | External links to Uber Eats and Gusty C&C — battle-tested platforms users already trust |
| Video background hero | "Cinematic atmosphere" | Massive bandwidth cost, autoplay blocked on mobile/data-saver, layout shift risk, CLS violations | Professional static photography; Framer Motion scroll animations for motion feel |
| Blog/Actus section (v0) | "Content marketing for SEO" | Requires ongoing content creation commitment; underfed blog hurts more than helps; adds CMS schema complexity | Launch without; add in v1 only if owner confirms editorial cadence |
| Loyalty program | "Reward repeat customers" | Requires user accounts, email infrastructure, RGPD opt-in, points logic — entire product in itself | External loyalty via Gusty or future Brevo newsletter; not a website feature |
| Table-side ordering via website | "Digital ordering at restaurant" | eazee-link already handles in-restaurant digital menu; duplicate effort | Link to eazee-link QR from website "Commander" page for context |
| PDF menu download | "Printable menu" | PDFs are not mobile-friendly, not indexable by search engines, become stale instantly | Sanity-managed HTML menu; always current, always searchable |
| Multiple accent colors / gradient branding | "More visual interest" | Dilutes premium/artisanal positioning; brand spec explicitly forbids; increases design inconsistency | Single green accent #77967A; decorative variety via patterns and typography |
| User accounts / login | "Save favorites, order history" | No ordering on-site; zero use case without ordering; RGPD complexity; adds attack surface | Not needed; ordering fully delegated to third parties |
| Newsletter on v0 | "Build email list from day one" | Requires RGPD double opt-in flow, email infrastructure (Brevo), legal mentions; Loan needs to commit to sending emails | Defer to v1; add Brevo integration only when editorial cadence confirmed |

---

## Feature Dependencies

```
[Sanity CMS Setup]
    └──requires──> [Menu Display]
    └──requires──> [Photo Gallery]
    └──requires──> [Notre Histoire content]
    └──requires──> [Catchphrase / Site Settings]
    └──requires──> [Opening Hours on Infos page]

[next-intl i18n Routing]
    └──requires──> [All page content in FR/EN/DE]
    └──requires──> [Hreflang in sitemap]
    └──requires──> [Cookie consent banner in 3 langs]
    └──requires──> [Legal pages in FR minimum, EN/DE if required]

[Google Analytics 4 via GTM]
    └──requires──> [Cookie consent CNIL-compliant]
                       └──requires──> [Consent fires before GTM loads]

[Local SEO (JSON-LD)]
    └──enhances──> [Menu Display] (Menu schema per item)
    └──enhances──> [Infos page] (LocalBusiness + hours schema)
    └──requires──> [NAP consistency] (same address in schema, footer, Google Business Profile)

[Photo Gallery with Lightbox]
    └──requires──> [Sanity CMS Setup] (photos uploaded and managed)
    └──enhances──> [Notre Histoire] (storytelling visual support)

[Gusty Reservation CTA]
    └──requires──> [Sticky header CTA] (above fold on all pages)
    └──requires──> [Mobile sticky bar] (below fold on mobile)

[ISR revalidation]
    └──requires──> [Sanity webhook or time-based revalidation config]
    └──enhances──> [Menu Display] (price/availability changes propagate in ~60s)

[Trilingual content]
    └──requires──> [Sanity i18n fields] (FR/EN/DE per content block)
    └──requires──> [Translation dictionaries] (UI strings separate from CMS content)
    └──conflicts──> [PDF menu] (PDFs can't be multilingual easily — use HTML menu)
```

### Dependency Notes

- **Sanity CMS Setup is Phase 1 blocker:** Menu, gallery, Notre Histoire, and site settings all depend on Sanity schema being defined before content can be entered or displayed.
- **Cookie consent blocks GA4:** GTM must not fire until user accepts; CNIL compliance requires consent-first architecture. Build cookie consent before enabling analytics.
- **i18n routing affects every page:** next-intl must be set up before building any page content; retrofitting multilingual routing is expensive.
- **ISR requires webhook or time-based revalidation:** Sanity changes won't propagate without either a Sanity webhook calling the Next.js revalidation endpoint or time-based ISR (60s). Choose time-based for simplicity in v0.
- **NAP consistency is cross-cutting:** Same address string must appear identically in JSON-LD schema, footer, Google Maps embed, and Google Business Profile. Any discrepancy undermines local SEO.

---

## MVP Definition

### Launch With (v0 — P0)

Minimum to be a functional, trustworthy, bookable restaurant website.

- [ ] **Hero section** — fullscreen professional photo, catchphrase, reserve CTA — first impression is the brand
- [ ] **Sticky header** — logo center, nav left, "Réserver" + "Commander" CTAs right — always-present booking access
- [ ] **Mobile sticky bar** — bottom CTA bar for reserve/order — 62% of traffic is mobile
- [ ] **Full menu display** — Sanity-managed with categories, items, prices, dietary tags, availability toggle — core reason people visit
- [ ] **Reservation CTA (Gusty)** — primary action; links to confirmed Gusty booking URL
- [ ] **Ordering CTAs (Uber Eats + Click & Collect)** — secondary action; confirmed URLs for Uber Eats
- [ ] **Infos page** — hours, address, phone, Google Maps embed, FAQ — critical for visit planning
- [ ] **Notre Histoire page** — 4-section scroll storytelling — artisanal brand narrative
- [ ] **Photo gallery with lightbox** — professional Nis&For photos — brand showcase
- [ ] **Trilingual FR/EN/DE** — required for Strasbourg audience; not a differentiator, a market requirement
- [ ] **Local SEO (JSON-LD + sitemap + hreflang)** — Restaurant, Menu, LocalBusiness schema; sitemap.xml with hreflang
- [ ] **Cookie consent (CNIL-compliant)** — legally required before GA4; equal accept/reject buttons
- [ ] **GA4 via GTM** — post-consent; traffic baseline for future decisions
- [ ] **Legal pages** — mentions légales, politique de confidentialité, cookies — French legal requirement
- [ ] **Sanity CMS** — Studio at /studio; menu, photos, hours, catchphrase, accent color all editable
- [ ] **ISR (60s revalidation)** — menu changes propagate without redeploy
- [ ] **Performance: Lighthouse > 90** — Core Web Vitals gate for local SEO

### Add After Validation (v1.x)

Features with confirmed value signal post-launch.

- [ ] **Instagram feed embed (API)** — add if Instagram engagement confirms audience interest; requires Instagram app review
- [ ] **Blog/Actus section** — add only if owner commits to writing 1-2 articles/month; not worth the empty-blog risk
- [ ] **Newsletter (Brevo)** — add only when owner confirms email marketing cadence; requires RGPD double opt-in
- [ ] **TikTok link in footer** — add when @umai_ramen_strasbourg TikTok account is confirmed active
- [ ] **Social proof section** — curated Google/TripAdvisor reviews in a testimonials strip; currently deferred due to embed complexity

### Future Consideration (v2+)

Features requiring significant investment or external dependencies not yet justified.

- [ ] **Loyalty program** — only if owner partners with a platform (Gusty, Brevo, etc.); full standalone build not warranted
- [ ] **Event calendar** — if UMAI starts hosting tasting events, sake nights, etc.; demand signal needed first
- [ ] **360° virtual tour** — high production cost; worth considering for tourism positioning if budget allows
- [ ] **AI chatbot for FAQ** — emerging trend but high maintenance; FAQ page covers the need in v0

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Menu display (Sanity) | HIGH | MEDIUM | P1 |
| Reservation CTA (Gusty) | HIGH | LOW | P1 |
| Ordering CTA (Uber Eats + C&C) | HIGH | LOW | P1 |
| Mobile-responsive design | HIGH | MEDIUM | P1 |
| Contact info + hours | HIGH | LOW | P1 |
| Infos page + Google Maps | HIGH | LOW | P1 |
| Cookie consent (CNIL) | HIGH | MEDIUM | P1 |
| Trilingual FR/EN/DE | HIGH | HIGH | P1 |
| Local SEO + JSON-LD | HIGH | MEDIUM | P1 |
| Professional photo gallery + lightbox | HIGH | MEDIUM | P1 |
| Notre Histoire scroll storytelling | MEDIUM | MEDIUM | P1 |
| Sanity Studio at /studio | HIGH | HIGH | P1 |
| ISR 60s revalidation | MEDIUM | LOW | P1 |
| Hero section | HIGH | LOW | P1 |
| Sticky header + mobile bar | HIGH | LOW | P1 |
| Legal pages | MEDIUM | LOW | P1 |
| GA4 via GTM | MEDIUM | LOW | P1 |
| Instagram feed API embed | MEDIUM | HIGH | P3 |
| Blog/Actus | LOW | MEDIUM | P3 |
| Newsletter (Brevo) | LOW | MEDIUM | P3 |
| Loyalty program | LOW | HIGH | P3 |
| Event calendar | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

Premium single-location restaurant websites in France / Alsace region — pattern analysis from researched examples.

| Feature | Generic Restaurant Site | Premium/Artisanal Site | UMAI Approach |
|---------|------------------------|------------------------|---------------|
| Menu | Static HTML or PDF | Sanity/CMS-managed, visual, filterable | Sanity with category/tag/availability |
| Reservation | Phone number only | Embedded widget or clear CTA | Gusty link CTA (no widget embed available) |
| Photography | Stock or low-quality | Professional, brand-coherent, full-width | Nis&For 29-photo preselection via Sanity |
| Languages | French only | French + English | FR/EN/DE (Strasbourg specificity) |
| Brand story | "About us" paragraph | Scroll storytelling with visual narrative | Notre Histoire 4-section Framer Motion |
| SEO | Basic meta tags | JSON-LD schema, sitemap, hreflang | Restaurant + Menu + LocalBusiness schema |
| Mobile | Responsive | Mobile-first with sticky ordering CTA | Sticky bottom bar with reserve/order |
| Design | Template feel | Brand-specific system, custom typography | DM Serif + Outfit + seigaiha, ivoire palette |
| Performance | 60-70 Lighthouse | 90+ Lighthouse | Target >90 with ISR + next/image |
| CMS | Static or WordPress | Headless CMS with non-dev Studio | Sanity v3, restaurateur-operated |

---

## Sources

- [11 Restaurant Website Features You Need in 2026 — Homebase](https://www.joinhomebase.com/blog/restaurant-website) — MEDIUM confidence (industry blog, multiple verified facts)
- [10 Essential Features Every Restaurant Website Must Have in 2025 — Porto Theme](https://www.portotheme.com/10-essential-features-every-restaurant-website-must-have-in-2025/) — MEDIUM confidence
- [Restaurant Schema Implementation — Inoriseo](https://inoriseo.com/seo/restaurant-schema/) — MEDIUM confidence (SEO specialist blog)
- [Local Business Structured Data — Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/local-business) — HIGH confidence (official Google documentation)
- [CNIL Cookie Consent Requirements — Usercentrics](https://usercentrics.com/knowledge-hub/cnil-cookies/) — HIGH confidence (multiple CNIL enforcement sources agree)
- [CNIL enforcement actions 2024 — Bird & Bird](https://www.twobirds.com/en/insights/2025/france/cnil-continues-to-crumble-cookies-recent-enforcement-actions-impact-on-organisations-with-a-french-p) — HIGH confidence (legal firm analysis)
- [Multilingual Website Guide 2025 — Senorit](https://senorit.de/en/blog/multilingual-website-guide-2025) — MEDIUM confidence
- [Hreflang tag SEO guide — Geotargetly](https://geotargetly.com/blog/hreflang-tag-seo-guide) — MEDIUM confidence
- [Restaurant Online Ordering Best Practices 2025 — Rezku](https://rezku.com/blog/blog/restaurant-online-ordering-best-practices/) — MEDIUM confidence
- [10 Mistakes New Restaurant Websites Make — Orderable](https://orderable.com/blog/new-restaurant-websites-mistakes/) — MEDIUM confidence (practical patterns validated across sources)
- Zenchef 61% online reservation stat — MEDIUM confidence (cited by multiple industry sources, original source Zenchef)
- DoorDash 41% direct ordering preference stat — MEDIUM confidence (DoorDash 2025 Delivery Trends Report)

---

*Feature research for: UMAI Ramen artisanal restaurant website (Strasbourg)*
*Researched: 2026-02-22*
