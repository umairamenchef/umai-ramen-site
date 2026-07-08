# UMAI Ramen — Refonte Site Web 2026

## What This Is

A complete website redesign for UMAI Ramen, an artisanal ramen noodle bar at 5 rue des Orphelins, Strasbourg (quartier Krutenau). Replaced an aging Gulp/Nunjucks one-pager with a modern Next.js 16 / Sanity v5 multilingual site in 3 phases over 3 months. The restaurateur (Loan Nguyen) can edit menus, photos, prices, and hours autonomously via Sanity Studio — no code, no Git, no redeployment.

## Core Value

Visitors can reserve a table (Gusty) or order food (Uber Eats / Click & Collect) in one click, while experiencing UMAI's artisanal brand identity through professional photography and a refined, Japanese-inspired design.

## Current State

**v1.0 shipped 2026-02-23.** Deployed to VPS srv1417179 via docker compose (`umai`) behind Caddy reverse proxy. Accessible at umai.turfu.in (staging). Production domain umai-ramen.fr pending DNS cutover.

**v2.0 (IG Content Studio) de facto delivered & deployed** on umai.turfu.in/ig-studio (CLI classify/compose + `/ig-studio` review editor, Azure-free sharp pipeline). Not yet formally archived in GSD.

**v2.1 (open 2026-07-08): production go-live & domain cutover.** Objective: publish the new Next.js site onto the primary domain umai-ramen.fr — which today still serves the OLD site via GitHub Pages (`185.199.10x.153` / `umairamenchef.github.io`) — by adding the domain to Caddy (TLS) and cutting DNS to the VPS (`76.13.61.239`), after a go-live audit + content/debt remediation. Target: week of 2026-07-11.

The VPS (valid until 2027-02-23) is a multi-site host intended for umai-ramen.fr, mokorita.fr, and other SAS/restaurant sites managed by EK.

## Requirements

### Validated

- ✓ Multi-page site (Accueil, Menu, Réservation, Commander, Notre Histoire, Infos, Galerie, 4 legal pages) — v1.0
- ✓ Sanity v5 CMS with embedded Studio at /studio for autonomous content editing — v1.0
- ✓ Full menu managed via Sanity (categories, items, prices, tags, images, availability toggle) — v1.0
- ✓ Trilingual FR/EN/DE with next-intl v4 routing /{locale}/... — v1.0
- ✓ Gusty reservation integration (CTA + link) — v1.0
- ✓ Uber Eats delivery integration (CTA + external link) — v1.0
- ✓ Gusty Click & Collect integration (placeholder URL, editable via Sanity) — v1.0
- ✓ eazee-link menu digital QR (external link) — v1.0
- ✓ Hero section with fixed fullscreen photo (next/image + rgba overlay, no slider) — v1.0
- ✓ Sticky header with logo center, nav left, CTA reserve/order right — v1.0
- ✓ Mobile sticky bar with CTA at bottom of screen — v1.0
- ✓ Design system: ivoire bg #F5F0E8, vert accent #77967A, DM Serif Display + Outfit + Noto Sans JP — v1.0
- ✓ Decorative elements: seigaiha pattern, dotted borders, line-art icons, JP micro-labels (1 max per section) — v1.0
- ✓ Photo gallery with lightbox (keyboard nav + swipe) — v1.0
- ✓ Notre Histoire scroll storytelling (4 sections, FadeInUp animations) — v1.0
- ✓ Infos page with hours, map, contact, FAQ — v1.0
- ✓ Google Maps embed — v1.0
- ✓ SEO: JSON-LD (Restaurant, Menu, LocalBusiness), meta/OG per page x3 langs, sitemap with hreflang — v1.0
- ✓ Google Analytics 4 via GTM (Consent Mode v2, default denied) — v1.0
- ✓ Cookie consent RGPD (CNIL-compliant, equal-prominence accept/reject) — v1.0
- ✓ ISR with revalidate 60s + HMAC on-demand webhook — v1.0
- ✓ Lighthouse > 90 (automated build check; live Slow 4G pending DNS cutover) — v1.0
- ✓ Core Web Vitals baseline verified in build — v1.0
- ✓ Legal pages (mentions légales, politique confidentialité, cookies, CGV) in FR/EN/DE — v1.0
- ✓ Catchphrase editable via Sanity (default: "Nouilles fraiches. Bouillons maison.") — v1.0
- ✓ Accent color adjustable via Sanity siteSettings.accentColor — v1.0

### Active (v2.1 — Production go-live & umai-ramen.fr cutover)

> **v2.1 milestone opened 2026-07-08.** Detailed REQ-IDs in REQUIREMENTS.md. Phases 8–11.

- [ ] **AUDIT**: Real page-by-page review of umai.turfu.in — missing content/visuals, summer-menu info, legal, SEO/OG/sitemap/robots, redirects, perf, + domain/DNS/TLS/Caddy mechanics → prioritized gap list (Phase 08)
- [ ] **CONTENT**: Complete Sanity prod content — real hero photos, summer menu + prices, hours, legal pages, Notre Histoire (EK supplies graphic assets progressively from 2026-07-09) (Phase 09)
- [ ] **DEBT**: SEO-07 (footer NAP), PERF-05 (first-load JS budget + wire bundle-analyzer), + audit-surfaced fixes (Phase 10)
- [ ] **CUTOVER**: Caddy adds umai-ramen.fr + www→apex redirect + `/ig-studio` on public domain (password) + TLS; DNS switch GitHub Pages→VPS (short maintenance window); old-URL redirects; live verification (Lighthouse>90, CWV, sitemap, TLS) (Phase 11)

> v2.0 (IG Content Studio, phases 04–07) is built and deployed on umai.turfu.in/ig-studio; to be formally archived via `/gsd:complete-milestone` when convenient.

**Active context:**
- Photo source: Google Drive folder `JPEG_72dpi` (id `19JmEURV-XqcMm97jZwU7AV9uG7y6-t7M`), ~81 files
- AI: `@anthropic-ai/sdk` — `claude-opus-4-8` for vision, `claude-sonnet-4-6` for captions
- Render: puppeteer-core + local Chrome → PNG → sips → Meta formats
- Output: `ig-studio/out/{photo-id}/` — `feed.png`, `square.png`, `story.png`, `caption.txt`
- Pilot gate: validate on ~10 photos before full 81-photo run

### Out of Scope

- Real-time chat — high complexity, not core to restaurant site
- Video content hosting — storage/bandwidth costs, not needed for v1
- Blog/Actus — deferred, ultra-light page if marketing need arises
- Newsletter — deferred, Brevo/Mailchimp if confirmed
- TikTok link — no verified account, add when confirmed
- OAuth/social login — no user accounts needed
- Mobile native app — web-first, responsive covers mobile
- Hero slider/carousel — bad UX, hurts Core Web Vitals, single fixed image only
- Instagram feed API embed — simple link is sufficient for current traffic
- Payment processing — orders go through Uber Eats/Gusty
- Online ordering system — delegated to Uber Eats and Gusty C&C

## Context

**v1.0 shipped state:**
- Stack: Next.js 16.1.6, React 19.2, Sanity v5, next-intl v4.8.3, motion v12, Tailwind CSS 4
- 11 plans executed across 3 phases in ~98 min total execution time
- Deployment: Docker standalone output on VPS srv1417179, multi-site Caddy proxy
- Known tech debt: SEO-07 (footer NAP), PERF-05 (220KB JS floor), bundle-analyzer unwired

**Brand identity:** Established print identity with ivoire backgrounds, single green accent (#77967A), Japanese decorative elements (seigaiha waves, kanji, line-art). DM Serif Display for H1/H2 only, Outfit for body, Noto Sans JP for decorative text (5% max).

**Photography:** 29 preselection photos from Nis&For available. Final selection pending from Loan Nguyen — to be uploaded to Sanity and managed via hotspot/crop.

**Key stakeholders:** Loan Nguyen (owner/founder), trained in Japan, opened 2021.

**Confirmed integrations:**
- Gusty reservation: `https://gusty.app/booking/1667924751880x258346136410259460?source=SITE`
- Uber Eats: `https://www.ubereats.com/fr/store/umai-ramen/8yLiOMdPVTudC_Pgbe209g`
- eazee-link: `https://menu.eazee-link.com/?id=GIK39GHKQZ&o=q`
- Instagram: @umai_ramen_strasbourg
- Facebook: `https://www.facebook.com/UmaiRamenStrasbourg/`
- Phone: 09 52 34 34 38
- Address: 5 rue des Orphelins, 67000 Strasbourg

## Constraints

- **Tech stack**: Next.js 16 App Router, TypeScript, Tailwind CSS 4, motion v12, Sanity v5, next-intl v4 — decided and non-negotiable
- **Hosting**: VPS srv1417179 (docker compose, Caddy), multi-site host (valid 2027-02-23); production domain umai-ramen.fr
- **CMS free tier**: Sanity free tier (10K docs, 5GB assets, 500K API req/month)
- **Design rules**: Single accent color, 1 decorative element max per section, DM Serif Display on H1/H2 only, no gradients, no heavy shadows, no icon packs
- **Performance**: Lighthouse > 90, ISR revalidate 60s, next/font self-hosted (no Google Fonts CDN)
- **Content**: FR is primary, EN/DE translations for all user-facing content (UI via dictionaries, content via Sanity i18n fields)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sanity v5 over Keystatic/custom admin | Visual studio for non-dev, native i18n/crop/hotspot, free tier sufficient | ✓ Good — owner can edit content without dev |
| ISR over SSR/CSR | Best perf for restaurant site (content changes infrequently), no client-side Sanity queries | ✓ Good — all routes static, ISR 60s working |
| Single hero image, no slider | Sliders hurt CWV, most users only see first slide, simpler implementation | ✓ Good — hero performs well |
| Obypay removed, Gusty for reservation + C&C | Consolidating on one reservation platform | ✓ Good — cleaner UX, single URL from Sanity |
| "Nouilles fraiches. Bouillons maison." as default catchphrase | Factual, differentiating, SEO-friendly, editable via Sanity | ✓ Good — Sanity-editable, confirmed with owner |
| Placeholders for photos | Build with placeholders, swap via Sanity Studio when final selection done | ⚠️ Revisit — final photo selection still pending |
| No blog/newsletter in v1 | Reduce scope, add in v1.1 if marketing need confirmed | ✓ Good — scope was correct |
| field-level localeString i18n (NOT @sanity/document-internationalization) | Simpler, sufficient for 3 locales, avoids document duplication | ✓ Good — worked cleanly across all content types |
| `motion` package (NOT `framer-motion`) | Next.js 16 compatible, tree-shakable with LazyMotion | ✓ Good — 34kb → 4.6kb motion bundle |
| Docker standalone output on VPS (NOT Vercel) | Multi-site hosting, cost control, control over infra | ✓ Good — umai.turfu.in live, multi-site Caddy ready |
| NAP dual-source pattern | `seo.ts` constants for JSON-LD/SEO, Sanity siteSettings for editorial | ⚠️ Revisit — footer not wired to NAP constants (SEO-07 debt) |

## Current Milestone: v2.1 — Mise en ligne production & bascule umai-ramen.fr

**Goal:** Publish the new Next.js site on the primary domain umai-ramen.fr (today still the old GitHub Pages site) with complete production content and a controlled cutover, target go-live week of 2026-07-11.

**Target features:**
- Go-live audit: real page-by-page review of umai.turfu.in surfacing missing content/visuals (incl. summer-menu info), legal, SEO/OG/sitemap/robots, redirects, perf, and the domain/DNS/TLS/Caddy cutover mechanics
- Production content completion in Sanity (real hero photos, summer menu + prices, hours, legal, Notre Histoire), assets supplied by EK progressively from 2026-07-09
- Tech-debt remediation: SEO-07 (footer NAP), PERF-05 (first-load JS budget + bundle-analyzer), plus audit-surfaced fixes
- Domain cutover: Caddy serves umai-ramen.fr + www→apex redirect + `/ig-studio` (password) on the public domain with TLS; DNS switched from GitHub Pages to the VPS with a short maintenance window; old-URL redirects; live verification (Lighthouse>90, CWV, sitemap, TLS)

**Key context:** GitHub origin `umairamenchef/umai-ramen-site` kept (branch `v2-2026`); VPS Docker + Caddy + HMAC deployer; short maintenance window acceptable; domain research skipped (ops milestone).

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-08 after v2.1 milestone opening*
