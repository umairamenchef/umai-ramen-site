# UMAI Ramen — Refonte Site Web 2026

## What This Is

A complete website redesign for UMAI Ramen, an artisanal ramen noodle bar at 5 rue des Orphelins, Strasbourg (quartier Krutenau). Replacing the aging Gulp/Nunjucks one-pager with a modern Next.js 14+ / Sanity CMS multilingual site. The restaurateur (Loan Nguyen) needs to edit menus, photos, prices, and hours autonomously via Sanity Studio — no code, no Git, no redeployment.

## Core Value

Visitors can reserve a table (Gusty) or order food (Uber Eats / Click & Collect) in one click, while experiencing UMAI's artisanal brand identity through professional photography and a refined, Japanese-inspired design.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Multi-page site: Accueil, Menu, Reservation, Commander, Notre Histoire, Infos, Mentions legales
- [ ] Sanity CMS v3 with embedded Studio at /studio for autonomous content editing
- [ ] Full menu managed via Sanity (categories, items, prices, tags, images, availability toggle)
- [ ] Trilingual FR/EN/DE with next-intl routing /{locale}/...
- [ ] Gusty reservation integration (CTA + link)
- [ ] Uber Eats delivery integration (CTA + external link)
- [ ] Gusty Click & Collect integration (placeholder URL, editable via Sanity)
- [ ] eazee-link menu digital QR (external link)
- [ ] Hero section with fixed fullscreen photo (next/image + rgba overlay, no slider)
- [ ] Sticky header with logo center, nav left, CTA reserve/order right
- [ ] Mobile sticky bar with CTA at bottom of screen
- [ ] Design system: ivoire bg #F5F0E8, vert accent #77967A, DM Serif Display + Outfit + Noto Sans JP
- [ ] Decorative elements: seigaiha pattern, dotted borders, line-art icons, JP micro-labels (1 max per section)
- [ ] Photo gallery with lightbox
- [ ] Notre Histoire scroll storytelling (4 sections)
- [ ] Infos page with hours, map, contact, FAQ
- [ ] Google Maps embed
- [ ] SEO: JSON-LD (Restaurant, Menu, LocalBusiness), meta/OG per page x3 langs, sitemap with hreflang
- [ ] Google Analytics 4 via GTM
- [ ] Cookie consent RGPD
- [ ] ISR with revalidate 60s (Sanity content updates in ~1 min)
- [ ] Lighthouse > 90 on all metrics
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Legal pages (mentions legales, politique de confidentialite, cookies, CGV)
- [ ] Catchphrase editable via Sanity (default: "Nouilles fraiches. Bouillons maison.")
- [ ] Accent color adjustable via Sanity siteSettings.accentColor

### Out of Scope

- Real-time chat — high complexity, not core to restaurant site
- Video content hosting — storage/bandwidth costs, not needed for v1
- Blog/Actus — deferred to P1, ultra-light page if needed
- Newsletter — deferred to P1, Brevo/Mailchimp if marketing need arises
- TikTok link — no verified account exists, add in P1 if confirmed
- OAuth/social login — no user accounts needed
- Mobile native app — web-first
- Hero slider/carousel — bad UX, hurts Core Web Vitals, single fixed image only
- Instagram feed API embed — P1, use simple link for P0
- Payment processing — orders go through Uber Eats/Gusty
- Online ordering system — delegated to Uber Eats and Gusty C&C

## Context

**Current state:** One-page site built with Gulp/Nunjucks, unchanged ~3 years. Uses Obypay (being removed), has dead links (Newsletter, Blog, Privacy, Cookie). Menu is static HTML.

**Brand identity:** Established print identity with ivoire backgrounds, single green accent (#77967A confirmed from print source), Japanese decorative elements (seigaiha waves, kanji, line-art). Two fonts: DM Serif Display for titles (H1/H2 only), Outfit for body. Noto Sans JP for decorative Japanese text (5% max of visible content).

**Photography:** 29 preselection photos from Nis&For available. Mix of studio-clair flat-lay shots (ramen bowls, gyozas, karaage) and lifestyle shots (table scenes, interior with UMAÏ mural, kitchen process). Final selection to be done — photos will be uploaded to Sanity and managed via hotspot/crop. Placeholders used initially, swapped via Studio.

**Design system preview:** HTML mockup exists (`umai-design-system-preview.html`) showing header, hero, palette, typography, section headers, menu items, USP blocks, info boxes, buttons, gallery grid, and footer. This is the visual reference for development.

**Existing assets:**
- Logo SVG (`umai_logo_menu.svg`) — the UMAÏ wordmark
- Title SVG (`title.svg`) — decorative logo with ramen bowl illustration
- Design system preview HTML — complete component reference
- Cahier des charges — full specification document

**Key stakeholders:** Loan Nguyen (owner/founder), trained in Japan, opened 2021. Sources: DNA, Zut Magazine articles.

**Confirmed integrations:**
- Gusty reservation: `https://gusty.app/booking/1667924751880x258346136410259460?source=SITE`
- Uber Eats: `https://www.ubereats.com/fr/store/umai-ramen/8yLiOMdPVTudC_Pgbe209g`
- eazee-link: `https://menu.eazee-link.com/?id=GIK39GHKQZ&o=q`
- Instagram: @umai_ramen_strasbourg
- Facebook: `https://www.facebook.com/UmaiRamenStrasbourg/`
- Phone: 09 52 34 34 38 (4 sources concordantes)
- Address: 5 rue des Orphelins, 67000 Strasbourg

**Pending items (non-blocking for development):**
- Gusty Click & Collect URL (placeholder, editable via Sanity)
- Hours validation (provisionally: Lun-Sam 12h-22h30 continu, Dim 12h-14h30 & 19h-22h30)
- Final photo selection from preselection set
- "Notre Histoire" text (draft AI then internal validation)
- EN/DE translations for Sanity content
- NAP consistency across platforms

## Constraints

- **Tech stack**: Next.js 14+ App Router, TypeScript, Tailwind CSS 4, Framer Motion, Sanity v3, next-intl — decided and non-negotiable
- **Hosting**: Vercel (free or Pro tier) + Sanity Studio embedded
- **Domain**: umai-ramen.fr (existing, DNS will point to Vercel)
- **CMS free tier**: Sanity free tier (10K docs, 5GB assets, 500K API req/month) — must stay within limits
- **Design rules**: Single accent color only, 1 decorative element max per section, DM Serif Display on H1/H2 only, no gradients, no heavy shadows, no icon packs
- **Performance**: Lighthouse > 90, ISR revalidate 60s, next/font self-hosted (no Google Fonts CDN)
- **Photos**: Nis&For preselection available, watermarked — final selection via Sanity after build
- **Content**: FR is primary, EN/DE translations for all user-facing content (UI via dictionaries, content via Sanity i18n fields)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Sanity v3 over Keystatic/custom admin | Visual studio for non-dev, native i18n/crop/hotspot, free tier sufficient | — Pending |
| ISR over SSR/CSR | Best perf for restaurant site (content changes infrequently), no client-side Sanity queries | — Pending |
| Single hero image, no slider | Sliders hurt CWV, most users only see first slide, simpler implementation | — Pending |
| Obypay removed, Gusty for reservation + C&C | Consolidating on one reservation platform | — Pending |
| Option 2 catchphrase as default | "Nouilles fraiches. Bouillons maison." — factual, differentiating, SEO-friendly. Editable via Sanity. | — Pending |
| Placeholders for photos | Build with placeholders, swap via Sanity Studio when final selection done | — Pending |
| No blog/newsletter in P0 | Reduce scope, add in P1 if marketing need confirmed | — Pending |

---
*Last updated: 2026-02-22 after initialization*
