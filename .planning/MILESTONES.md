# Milestones: UMAI Ramen — Refonte Site Web 2026

## v1.0 — MVP Launch ✅ SHIPPED 2026-02-23

**Phases:** 3 | **Plans:** 11 | **Requirements:** 62/62
**Timeline:** 2026-02-22 → 2026-02-23 (~1 day, 98 min execution)
**Deployed:** VPS srv1417179 (umai.turfu.in) via docker compose + Caddy

### Key Accomplishments

1. Next.js 16 scaffold with trilingual FR/EN/DE routing (next-intl v4), ISR 60s baseline, and proxy.ts middleware — all content routes statically generated
2. Sanity v5 CMS with 5 restaurant schemas (field-level localeString i18n), sanityFetch helper, TypeGen, and embedded Studio at /studio
3. Tailwind 4 design system — ivoire/vert brand tokens, self-hosted DM Serif Display + Outfit + Noto Sans JP, LazyMotion (4.6kb), sticky Header/MobileBar/Footer with seigaiha SVG
4. 7 content pages fully driven by Sanity CMS — Accueil (fullscreen hero, USP, gallery preview), Menu (sticky sub-nav, dietary badges, formules), Réservation, Commander (3 ordering options), Notre Histoire (scroll storytelling), Infos (FAQ), Galerie (lightbox + keyboard/swipe)
5. Full SEO infrastructure — generateMetadata + hreflang alternates on all pages, Restaurant + MenuSection/MenuItem JSON-LD, sitemap.xml, robots.txt, HMAC-validated on-demand Sanity webhook
6. CNIL/RGPD compliance — Consent Mode v2 cookie banner (FR/EN/DE, equal-prominence), GTM/GA4 consent-gated, 4 legal pages in 3 languages

### Known Tech Debt

- SEO-07: Footer not wired to NAP constants (cosmetic, NAP correct via JSON-LD)
- PERF-05: First-load JS ~220KB > 150KB target (Next.js 16 + React 19 irreducible floor)
- bundle-analyzer: `@next/bundle-analyzer` in devDeps but not wired into next.config.ts

### Archives

- Roadmap: [.planning/milestones/v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md)
- Requirements: [.planning/milestones/v1.0-REQUIREMENTS.md](milestones/v1.0-REQUIREMENTS.md)
- Audit: [.planning/v1.0-MILESTONE-AUDIT.md](v1.0-MILESTONE-AUDIT.md)
