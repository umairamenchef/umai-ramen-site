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

- [x] **CONTENT-01**: Real hero photography set in Sanity (Accueil + any per-page heroes), replacing placeholders (assets from EK, provided progressively from 2026-07-09)
- [x] **CONTENT-02**: Summer menu fully entered in Sanity — dishes, FR/EN/DE names, prices, dietary tags, availability — matching the current in-restaurant menu
- [x] **CONTENT-03**: Opening hours, address, phone verified/updated in Sanity siteSettings (single NAP source), consistent with seo.ts constants
- [x] **CONTENT-04**: Legal pages complete and accurate in FR/EN/DE — mentions légales (éditeur, directeur de publication, hébergeur, SIRET), confidentialité, cookies, CGV
- [x] **CONTENT-05**: "Notre Histoire" copy validated with Loan and the gallery populated with the final selected photos
- [x] **CONTENT-06**: On-brand OG/social-share images present for the key pages (real, not placeholder)

### Tech-Debt Remediation

- [x] **DEBT-01**: Footer wired to the NAP constants (seo.ts) — resolves SEO-07; footer NAP matches JSON-LD across all locales _(commit 8166a38, live)_
- [x] **DEBT-02**: `@next/bundle-analyzer` wired into next.config.ts, producing a first-load JS report
- [x] **DEBT-03**: First-load JS measured on live `/fr` = ~228 KB compressed (14 chunks); ≈ Next 16/React 19 framework floor. Wins: Studio + ig-studio route-isolated, motion via LazyMotion. Documented; no risky pre-go-live cuts _(2026-07-14)_
- [x] **DEBT-04**: All Phase 08 audit go-live blockers cleared (legal FR/EN/DE, EN/DE i18n leaks, og-image, gallery empty-state, canonical/cutover strategy) _(2026-07-14)_

### Domain Cutover & Live Verification

- [x] **CUTOVER-01**: Caddy serves umai-ramen.fr (apex) + www.umai-ramen.fr with automatic TLS, reverse-proxying to web:3000 _(2026-07-16, valid LE cert)_
- [x] **CUTOVER-02**: www.umai-ramen.fr → apex 301; canonical host = apex umai-ramen.fr _(verified)_
- [x] **CUTOVER-03**: `/ig-studio` reachable on umai-ramen.fr behind the password gate (307 → /ig-studio/login) _(verified)_
- [x] **CUTOVER-04**: old site was a one-pager; `/` → `/fr` 307 works on the new host; no per-path map needed _(verified)_
- [x] **CUTOVER-05**: DNS cut at Gandi LiveDNS — apex A + www A → 76.13.61.239 (TTL 300); MX/SPF/SRV/webmail untouched. Public resolvers (Google/Cloudflare) already return the VPS _(2026-07-16, EK executed)_
- [x] **CUTOVER-06**: Post-cutover live verify — valid TLS, all FR/EN/DE pages 200, sitemap/robots/canonical = umai-ramen.fr, JSON-LD present, order/reserve CTAs present, /ig-studio gated _(Lighthouse/CWV not re-run; no perf regression expected)_
- [~] **CUTOVER-07**: Rollback documented (revert Gandi A → 185.199.10x.153; host backups `*.bak-cutover`; TTL 300 = fast). **PENDING (EK): Search Console** — add umai-ramen.fr property + submit sitemap. Also deferred: 301 umai.turfu.in → umai-ramen.fr (kept as fallback mirror during settle).

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
| CONTENT-01 | Phase 09 — Contenu & visuels production (Sanity) | Complete |
| CONTENT-02 | Phase 09 — Contenu & visuels production (Sanity) | Complete |
| CONTENT-03 | Phase 09 — Contenu & visuels production (Sanity) | Complete |
| CONTENT-04 | Phase 09 — Contenu & visuels production (Sanity) | Complete |
| CONTENT-05 | Phase 09 — Contenu & visuels production (Sanity) | Complete |
| CONTENT-06 | Phase 09 — Contenu & visuels production (Sanity) | Complete |
| DEBT-01 | Phase 10 — Résorption dette & polish | Pending |
| DEBT-02 | Phase 10 — Résorption dette & polish | Complete |
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
