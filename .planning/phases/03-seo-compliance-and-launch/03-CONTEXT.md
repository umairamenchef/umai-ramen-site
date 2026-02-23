# Phase 3: SEO, Compliance, and Launch - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the site legally compliant (CNIL/RGPD), correctly indexed in three language variants (FR/EN/DE), analytics consent-gated, and every page scoring Lighthouse > 90. Covers JSON-LD schemas, generateMetadata with hreflang, cookie consent, GTM/GA4, legal pages, ISR webhook validation, and performance audit.

</domain>

<decisions>
## Implementation Decisions

### Cookie consent banner
- Full-width bottom bar position
- Visual style: Claude's discretion (match UMAI brand)
- Accept / Reject only — two equal-prominence buttons, no granular category toggles
- Consent persists for 13 months (CNIL maximum)
- Must appear in the correct language (FR/EN/DE) based on current locale

### Legal pages
- Hardcoded French legal templates (not CMS-managed)
- Translated to all 3 languages (FR/EN/DE)
- Business details use placeholder values ([COMPANY NAME], [SIRET], [RCS], etc.) for owner to replace
- Four pages required: mentions légales, politique de confidentialité, politique cookies, CGV
- Visual treatment: Claude's discretion

### Analytics & tracking
- Track CTA clicks as conversions: Reserve (Gusty), Order (Uber Eats), Click & Collect buttons
- No additional engagement events beyond pageviews + CTA clicks
- GTM and GA4 IDs provided as environment variables (placeholders for now)
- GTM vs direct GA4 approach: Claude's discretion (optimize for Consent Mode v2)
- Language dimension tracking: Claude's discretion

### SEO metadata & OG
- Page titles and descriptions tone: Claude's discretion (balance SEO keywords and brand voice)
- OG image strategy: Claude's discretion
- Meta descriptions/titles source (hardcoded vs CMS): Claude's discretion
- Restaurant location: 5 Rue des Orphelins, 67000 Strasbourg
- Phone: +33 9 52 34 34 38

### Claude's Discretion
- Cookie banner visual style (dark vs light, animation)
- Legal page visual treatment (minimal vs brand-matched)
- GTM vs direct GA4 injection
- Whether to track locale as a custom GA4 dimension
- Meta title/description tone and source (hardcoded vs Sanity)
- OG image strategy (single vs page-specific)

</decisions>

<specifics>
## Specific Ideas

- Restaurant is in Strasbourg: Umaï Ramen, 5 Rue des Orphelins, 67000 Strasbourg, +33 9 52 34 34 38
- Legal pages use placeholder business details — owner fills in SIRET, RCS, etc. after launch
- Cookie consent must follow CNIL guidelines: equal-prominence accept/reject, no dark patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-seo-compliance-and-launch*
*Context gathered: 2026-02-23*
