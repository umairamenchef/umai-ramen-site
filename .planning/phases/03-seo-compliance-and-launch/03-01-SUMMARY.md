---
phase: 03-seo-compliance-and-launch
plan: 01
subsystem: seo
tags: [next-metadata, json-ld, schema-dts, sitemap, robots, webhook, hmac, hreflang, isr]

requires:
  - phase: 02-content-pages
    provides: All 7 content pages with Sanity data fetching and i18n routing
provides:
  - generateMetadata with hreflang alternates on all 7 content pages
  - Restaurant JSON-LD on homepage with openingHoursSpecification
  - Menu/MenuItem JSON-LD on menu page from Sanity data
  - Multilingual sitemap.xml covering all routes x3 locales
  - robots.txt blocking /studio
  - HMAC-validated Sanity webhook replacing 501 stub
  - NAP constants in src/lib/seo.ts as single source of truth
affects: [03-02, 03-03]

tech-stack:
  added: [schema-dts]
  patterns: [generateMetadata per page, buildAlternates helper, JSON-LD script injection with XSS sanitization]

key-files:
  created:
    - src/lib/seo.ts
    - src/app/sitemap.ts
    - src/app/robots.ts
  modified:
    - src/app/[locale]/page.tsx
    - src/app/[locale]/menu/page.tsx
    - src/app/[locale]/reservation/page.tsx
    - src/app/[locale]/commander/page.tsx
    - src/app/[locale]/notre-histoire/page.tsx
    - src/app/[locale]/infos/page.tsx
    - src/app/[locale]/galerie/page.tsx
    - src/app/api/revalidate/route.ts
    - src/messages/fr.json
    - src/messages/en.json
    - src/messages/de.json

key-decisions:
  - "revalidateTag in Next.js 16 requires second profile argument — used { expire: 0 } for immediate invalidation"
  - "schema-dts DayOfWeek requires full IRI format (https://schema.org/Tuesday) not plain strings"
  - "Combined Task 1 (metadata) and Task 2 (JSON-LD) into single atomic commit — JSON-LD depends on same seo.ts infrastructure"
  - "NAP dual-source pattern: seo.ts constants for SEO/JSON-LD, Sanity siteSettings for editorial content — both must match"

patterns-established:
  - "generateMetadata pattern: getTranslations({locale, namespace}) + buildAlternates(locale, path) on each page"
  - "JSON-LD injection: script type=application/ld+json with dangerouslySetInnerHTML and .replace(/</g, '\\u003c') sanitization"

requirements-completed: [SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEO-07, FOUND-07]

duration: 8min
completed: 2026-02-23
---

# Plan 03-01: SEO Layer and Webhook Summary

**generateMetadata with hreflang on all 7 pages, Restaurant + Menu JSON-LD, multilingual sitemap, robots.txt, and HMAC webhook handler**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-23
- **Completed:** 2026-02-23
- **Tasks:** 2 (combined into 1 atomic commit)
- **Files modified:** 16

## Accomplishments
- Every content page exports generateMetadata with locale-specific title, description, OG, Twitter Card, and hreflang alternates (fr, en, de, x-default)
- Homepage renders Restaurant JSON-LD with openingHoursSpecification and correct NAP data
- Menu page renders Menu/MenuSection/MenuItem JSON-LD from Sanity category/item data
- sitemap.xml covers all 7 content pages + 4 legal pages x3 locales with xhtml:link alternates
- robots.txt allows all crawlers on / and disallows /studio
- Webhook handler validates HMAC via next-sanity/webhook parseBody and calls revalidateTag
- NAP data consistent: seo.ts constants match footer hardcoded values

## Task Commits

1. **Task 1+2: SEO infrastructure + JSON-LD** - `41ed49a` (feat)

## Files Created/Modified
- `src/lib/seo.ts` - NAP constants, BASE_URL, OG_IMAGE, buildAlternates helper, OPENING_HOURS for JSON-LD
- `src/app/sitemap.ts` - Multilingual sitemap with content + legal pages
- `src/app/robots.ts` - robots.txt blocking /studio
- `src/app/api/revalidate/route.ts` - HMAC webhook replacing 501 stub
- `src/app/[locale]/page.tsx` - generateMetadata + Restaurant JSON-LD
- `src/app/[locale]/menu/page.tsx` - generateMetadata + Menu JSON-LD
- `src/app/[locale]/reservation/page.tsx` - generateMetadata
- `src/app/[locale]/commander/page.tsx` - generateMetadata
- `src/app/[locale]/notre-histoire/page.tsx` - generateMetadata
- `src/app/[locale]/infos/page.tsx` - generateMetadata
- `src/app/[locale]/galerie/page.tsx` - generateMetadata
- `src/messages/fr.json` - meta namespace with per-page SEO titles/descriptions
- `src/messages/en.json` - meta namespace (English)
- `src/messages/de.json` - meta namespace (German)

## Decisions Made
- Next.js 16 revalidateTag requires second `profile` argument — used `{ expire: 0 }` for immediate cache invalidation on webhook
- schema-dts DayOfWeek enum requires full Schema.org IRI format (`https://schema.org/Tuesday`) not plain strings
- Combined Tasks 1 and 2 into single commit since JSON-LD depends on same seo.ts infrastructure
- Footer NAP data is hardcoded and matches seo.ts constants — dual-source pattern documented

## Deviations from Plan

### Auto-fixed Issues

**1. revalidateTag signature change in Next.js 16**
- **Found during:** Task 1 (webhook handler)
- **Issue:** Next.js 16 requires second argument to revalidateTag (profile: string | CacheLifeConfig)
- **Fix:** Added `{ expire: 0 }` as second argument for immediate invalidation
- **Verification:** Build passes

**2. schema-dts DayOfWeek type incompatibility**
- **Found during:** Task 2 (Restaurant JSON-LD)
- **Issue:** Plain strings like 'Tuesday' not assignable to DayOfWeek type
- **Fix:** Used full IRI format with type assertion: `'https://schema.org/Tuesday' as DayOfWeek`
- **Verification:** TypeScript compilation passes

---

**Total deviations:** 2 auto-fixed (2 blocking type errors)
**Impact on plan:** Both fixes necessary for build compatibility. No scope creep.

## Issues Encountered
None beyond the type compatibility fixes documented above.

## User Setup Required
None - no external service configuration required for this plan.

## Next Phase Readiness
- All SEO infrastructure in place for Plan 03-02 (compliance layer)
- Legal pages already included in sitemap.xml (routes created in 03-02)
- meta namespace established for extending with legal page metadata

---
*Phase: 03-seo-compliance-and-launch*
*Completed: 2026-02-23*
