# Requirements: v2.1 — Mise en ligne production & bascule umai-ramen.fr

**Defined:** 2026-07-08
**Milestone:** v2.1
**Core Value:** Publish the new Next.js site on the primary domain umai-ramen.fr (today still the old GitHub Pages site) with complete, accurate production content and a controlled, low-risk domain/DNS cutover — target go-live week of 2026-07-11.

## Table Stakes (must be true for v2.1 to ship)

- A real page-by-page audit precedes any cutover — nothing goes live with placeholder or missing content undetected
- The live menu reflects the actual current (summer) menu, prices, and availability before the domain is public
- Legal pages are complete and accurate (éditeur, hébergeur, SIRET, RGPD) — legal requirement for a public commercial site
- The cutover is reversible: a documented rollback (revert DNS/Caddy) exists before the switch
- Inbound SEO is preserved: old indexed URLs 301-redirect to their new equivalents
- A short, announced maintenance window is acceptable; no silent extended downtime

---

## v2.1 Requirements

### Audit & Gap Analysis (go-live readiness)

- [x] **AUDIT-01**: Page-by-page review of every live page on umai.turfu.in (Accueil, Menu, Réservation, Commander, Notre Histoire, Infos, Galerie, 4 legal pages) producing a documented list of missing/placeholder content, broken links, and untranslated FR/EN/DE strings
- [x] **AUDIT-02**: Menu audit — verify the live menu matches the current summer menu (dishes, prices, availability, dietary tags) against the in-restaurant ground truth; list every discrepancy
- [x] **AUDIT-03**: Visual/asset audit — identify placeholder or low-quality images (hero, gallery, OG) and produce the list of real assets required from EK
- [x] **AUDIT-04**: SEO/metadata audit — verify per-page title/description/OG/hreflang, Restaurant + Menu JSON-LD, canonical URLs, and that sitemap.xml + robots.txt are correct for the production domain
- [x] **AUDIT-05**: Redirect/URL audit — enumerate the old GitHub Pages site's indexed URLs and define the old→new 301 redirect map to preserve SEO
- [x] **AUDIT-06**: Performance audit — Lighthouse + Core Web Vitals on a production-like build, with the first-load JS breakdown and any regressions identified
- [x] **AUDIT-07**: Cutover-readiness dossier — exact Caddy config change, DNS records to change (apex A + www), TTL-lowering plan, TLS provisioning approach, and a single prioritized go-live gap list with severities

### Production Content Completion

- [ ] **CONTENT-01**: Real hero photography set in Sanity (Accueil + any per-page heroes), replacing placeholders (assets from EK, provided progressively from 2026-07-09)
- [ ] **CONTENT-02**: Summer menu fully entered in Sanity — dishes, FR/EN/DE names, prices, dietary tags, availability — matching the current in-restaurant menu
- [ ] **CONTENT-03**: Opening hours, address, phone verified/updated in Sanity siteSettings (single NAP source), consistent with seo.ts constants
- [ ] **CONTENT-04**: Legal pages complete and accurate in FR/EN/DE — mentions légales (éditeur, directeur de publication, hébergeur, SIRET), confidentialité, cookies, CGV
- [ ] **CONTENT-05**: "Notre Histoire" copy validated with Loan and the gallery populated with the final selected photos
- [ ] **CONTENT-06**: On-brand OG/social-share images present for the key pages (real, not placeholder)

### Tech-Debt Remediation

- [ ] **DEBT-01**: Footer wired to the NAP constants (seo.ts) — resolves SEO-07; footer NAP matches JSON-LD across all locales
- [ ] **DEBT-02**: `@next/bundle-analyzer` wired into next.config.ts, producing a first-load JS report
- [ ] **DEBT-03**: First-load JS reduced toward budget where feasible (PERF-05); document the irreducible framework floor and any wins achieved
- [ ] **DEBT-04**: Go-live-blocking issues surfaced by the Phase 08 audit are fixed (catch-all, scoped by severity)

### Domain Cutover & Live Verification

- [ ] **CUTOVER-01**: Caddy serves umai-ramen.fr (apex) + www.umai-ramen.fr with automatic TLS, reverse-proxying to web:3000
- [ ] **CUTOVER-02**: A 301 redirect enforces a single canonical host (www→apex or chosen canonical)
- [ ] **CUTOVER-03**: `/ig-studio` is reachable on the public domain behind the existing password gate (proxy.ts covers the new host)
- [ ] **CUTOVER-04**: Old-URL→new-URL 301 redirects from the AUDIT-05 map are deployed; no broken inbound links
- [ ] **CUTOVER-05**: DNS is cut from GitHub Pages to the VPS (apex A → 76.13.61.239, www) with a lowered TTL and a short, announced maintenance window
- [ ] **CUTOVER-06**: Post-cutover live verification on umai-ramen.fr — valid TLS, Lighthouse>90, Core Web Vitals pass, sitemap/robots resolve, JSON-LD valid, reserve/order flows work, no mixed content
- [ ] **CUTOVER-07**: Rollback plan documented (revert DNS/Caddy) and Search Console updated (submit new sitemap, request reindex)

---

## Out of Scope (v2.1)

| Feature | Reason |
|---------|--------|
| Multi-site hosting of mokorita.fr / other SAS sites | Separate future milestone; this one ships umai-ramen.fr only |
| New site features / pages beyond current v1.0 structure | Go-live milestone — publish what exists, don't add scope |
| Email/newsletter, blog/actus | Deferred (already out of scope at project level) |
| Automated visual regression / e2e test suite | Manual live verification is sufficient at this scale |
| CDN / edge caching layer | VPS + Caddy + ISR is sufficient for current traffic |
| Migrating the IG Studio off the same app | It ships as-is on the public domain behind auth |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 08 — Audit go-live & gap analysis | Complete |
| AUDIT-02 | Phase 08 — Audit go-live & gap analysis | Complete |
| AUDIT-03 | Phase 08 — Audit go-live & gap analysis | Complete |
| AUDIT-04 | Phase 08 — Audit go-live & gap analysis | Complete |
| AUDIT-05 | Phase 08 — Audit go-live & gap analysis | Complete |
| AUDIT-06 | Phase 08 — Audit go-live & gap analysis | Complete |
| AUDIT-07 | Phase 08 — Audit go-live & gap analysis | Complete |
| CONTENT-01 | Phase 09 — Contenu & visuels production (Sanity) | Pending |
| CONTENT-02 | Phase 09 — Contenu & visuels production (Sanity) | Pending |
| CONTENT-03 | Phase 09 — Contenu & visuels production (Sanity) | Pending |
| CONTENT-04 | Phase 09 — Contenu & visuels production (Sanity) | Pending |
| CONTENT-05 | Phase 09 — Contenu & visuels production (Sanity) | Pending |
| CONTENT-06 | Phase 09 — Contenu & visuels production (Sanity) | Pending |
| DEBT-01 | Phase 10 — Résorption dette & polish | Pending |
| DEBT-02 | Phase 10 — Résorption dette & polish | Pending |
| DEBT-03 | Phase 10 — Résorption dette & polish | Pending |
| DEBT-04 | Phase 10 — Résorption dette & polish | Pending |
| CUTOVER-01 | Phase 11 — Cutover domaine & vérifications live | Pending |
| CUTOVER-02 | Phase 11 — Cutover domaine & vérifications live | Pending |
| CUTOVER-03 | Phase 11 — Cutover domaine & vérifications live | Pending |
| CUTOVER-04 | Phase 11 — Cutover domaine & vérifications live | Pending |
| CUTOVER-05 | Phase 11 — Cutover domaine & vérifications live | Pending |
| CUTOVER-06 | Phase 11 — Cutover domaine & vérifications live | Pending |
| CUTOVER-07 | Phase 11 — Cutover domaine & vérifications live | Pending |

**Coverage:** 24/24 v2.1 requirements mapped (AUDIT 7, CONTENT 6, DEBT 4, CUTOVER 7) — 100%

---
*Requirements defined: 2026-07-08 (v2.1 milestone opening)*
*Traceability updated: 2026-07-08 (roadmap created)*
