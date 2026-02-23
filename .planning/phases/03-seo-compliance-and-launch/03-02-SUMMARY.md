---
phase: 03-seo-compliance-and-launch
plan: 02
subsystem: compliance
tags: [cookie-consent, consent-mode-v2, gtm, ga4, cnil, rgpd, legal-pages, gdpr]

requires:
  - phase: 03-seo-compliance-and-launch/01
    provides: SEO infrastructure (seo.ts, buildAlternates, meta namespace)
provides:
  - Cookie consent banner with Consent Mode v2 integration
  - GTM/GA4 consent-gated analytics
  - Consent cookie helpers in src/lib/consent.ts
  - Four legal pages (mentions-legales, politique-confidentialite, politique-cookies, cgv)
  - Legal page translations in FR/EN/DE with generateMetadata
affects: [03-03]

tech-stack:
  added: []
  patterns: [Consent Mode v2 two-part injection, consent cookie with 13-month max-age, fixed-position banner for zero CLS]

key-files:
  created:
    - src/lib/consent.ts
    - src/components/consent/CookieBanner.tsx
    - src/app/[locale]/mentions-legales/page.tsx
    - src/app/[locale]/politique-confidentialite/page.tsx
    - src/app/[locale]/politique-cookies/page.tsx
    - src/app/[locale]/cgv/page.tsx
  modified:
    - src/app/[locale]/layout.tsx
    - src/messages/fr.json
    - src/messages/en.json
    - src/messages/de.json

key-decisions:
  - "Consent Mode v2 defaults in synchronous script in <head> BEFORE GTM loads — ensures analytics denied until consent"
  - "GTM script gated on NEXT_PUBLIC_GTM_ID existence — no error in dev without env var"
  - "Legal pages use revalidate=false for permanent static caching"
  - "CookieBanner uses position:fixed bottom-0 for zero CLS impact"
  - "Equal-prominence buttons per CNIL: same size, both visible, outline vs filled differentiation"

patterns-established:
  - "Consent flow: synchronous defaults -> GTM load -> CookieBanner on mount -> consent update on choice"
  - "Legal page pattern: setRequestLocale + getTranslations + sections array rendering"

requirements-completed: [CMPL-01, CMPL-02, CMPL-03, CMPL-04, CMPL-05, CMPL-06]

duration: 7min
completed: 2026-02-23
---

# Plan 03-02: CNIL Compliance and Legal Pages Summary

**Cookie consent banner with Consent Mode v2 + GTM, and four French legal pages (mentions legales, politique confidentialite, politique cookies, CGV) in FR/EN/DE**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-23
- **Completed:** 2026-02-23
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- CNIL-compliant cookie consent banner with equal-prominence Accept/Reject in FR/EN/DE
- Consent Mode v2 defaults all-denied before GTM container loads
- GTM gated on NEXT_PUBLIC_GTM_ID env var — zero impact on dev builds
- Four legal pages with placeholder business details for owner to fill
- All legal pages statically generated with generateMetadata and hreflang
- Footer already links to all 4 legal pages (confirmed from Phase 2)

## Task Commits

1. **Task 1: Cookie consent + GTM** - `7252580` (feat)
2. **Task 2: Legal pages** - `fd68bce` (feat)

## Files Created/Modified
- `src/lib/consent.ts` - Consent cookie helpers, gtag consent update, CTA tracking
- `src/components/consent/CookieBanner.tsx` - Client component with slide-up animation
- `src/app/[locale]/layout.tsx` - Consent defaults script, GTM, CookieBanner
- `src/app/[locale]/mentions-legales/page.tsx` - LCEN legal requirements
- `src/app/[locale]/politique-confidentialite/page.tsx` - RGPD Art. 13 content
- `src/app/[locale]/politique-cookies/page.tsx` - Cookie inventory and consent info
- `src/app/[locale]/cgv/page.tsx` - Terms with platform disclaimers
- `src/messages/fr.json` - consent + legal namespaces
- `src/messages/en.json` - consent + legal namespaces (English)
- `src/messages/de.json` - consent + legal namespaces (German)

## Decisions Made
- Consent Mode v2 in synchronous `<script>` in `<head>` before GTM — per Google docs requirement
- CookieBanner as last element in body for z-index stacking above all content
- Legal pages use revalidate=false for permanent caching — content changes only when code deploys

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
- Owner must replace placeholder values in legal pages: [COMPANY NAME], [SIRET NUMBER], [RCS CITY], [SHARE CAPITAL], [DIRECTOR NAME], [HOSTING PROVIDER], [HOSTING ADDRESS], [CONTACT EMAIL]
- Owner must set NEXT_PUBLIC_GTM_ID environment variable for GTM to load

## Next Phase Readiness
- All compliance requirements met, ready for Plan 03-03 performance audit
- Legal pages included in sitemap.xml from Plan 03-01

---
*Phase: 03-seo-compliance-and-launch*
*Completed: 2026-02-23*
