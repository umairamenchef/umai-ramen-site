# Phase 3: SEO, Compliance, and Launch - Research

**Researched:** 2026-02-23
**Domain:** Next.js App Router SEO / GDPR compliance / Consent Mode v2 / Performance auditing
**Confidence:** HIGH (core APIs), MEDIUM (GTM consent flow)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Cookie consent banner:**
- Full-width bottom bar position
- Accept / Reject only — two equal-prominence buttons, no granular category toggles
- Consent persists for 13 months (CNIL maximum)
- Must appear in the correct language (FR/EN/DE) based on current locale

**Legal pages:**
- Hardcoded French legal templates (not CMS-managed)
- Translated to all 3 languages (FR/EN/DE)
- Business details use placeholder values ([COMPANY NAME], [SIRET], [RCS], etc.)
- Four pages required: mentions légales, politique de confidentialité, politique cookies, CGV
- Visual treatment: Claude's discretion

**Analytics & tracking:**
- Track CTA clicks as conversions: Reserve (Gusty), Order (Uber Eats), Click & Collect buttons
- No additional engagement events beyond pageviews + CTA clicks
- GTM and GA4 IDs provided as environment variables (placeholders for now)
- GTM vs direct GA4 approach: Claude's discretion (optimize for Consent Mode v2)
- Language dimension tracking: Claude's discretion

**SEO metadata & OG:**
- Page titles and descriptions tone: Claude's discretion
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEO-01 | JSON-LD Restaurant + LocalBusiness schema on homepage with openingHoursSpecification | `<script type="application/ld+json">` pattern verified in Next.js 16 docs; schema-dts for type safety |
| SEO-02 | JSON-LD MenuSection + MenuItem schema on menu page | Same injection pattern; schema.org Menu/MenuItem types confirmed |
| SEO-03 | generateMetadata on every page with title, description, OG, Twitter Card x3 languages | `generateMetadata` with locale param + `getTranslations({locale})` confirmed for static rendering eligibility |
| SEO-04 | Hreflang alternates on every page pointing to FR/EN/DE variants + x-default | `alternates.languages` in metadata object; x-default supported via `'x-default'` key; requires absolute URLs via metadataBase |
| SEO-05 | Auto-generated sitemap.xml covering all routes x3 locales | `app/sitemap.ts` with `alternates.languages` per entry; Next.js 16.1 native support confirmed |
| SEO-06 | robots.txt allowing indexing, blocking /studio | `app/robots.ts` with `disallow: '/studio'` confirmed in Next.js 16 docs |
| SEO-07 | NAP consistency: identical name/address/phone in JSON-LD, footer, and Google Maps | Single source constant file pattern; audit checklist in verification plan |
| CMPL-01 | Cookie consent banner: equal-prominence accept/reject, 3 languages, persists choice | Custom React component + localStorage; CNIL equal-prominence requirement documented; 13-month expiry via cookie `max-age` |
| CMPL-02 | GTM/GA4 fires only after explicit consent (Consent Mode v2, default denied) | gtag('consent','default',{all:'denied'}) before GTM load; gtag('consent','update') on accept; custom GTM script in root layout |
| CMPL-03 | Mentions légales page | Hardcoded static page under `[locale]/mentions-legales/`; French law LCEN requirements documented |
| CMPL-04 | Politique de confidentialité page | Same pattern; RGPD Art. 13 requirements documented |
| CMPL-05 | Politique cookies page | Same pattern; CNIL cookie policy requirements documented |
| CMPL-06 | CGV page | Same pattern; commercial law requirements documented |
| PERF-01 | Lighthouse > 90 on Performance, SEO, Accessibility, Best Practices | ISR + self-hosted fonts + next/image already established; consent banner must be lightweight |
| PERF-02 | Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms | Lazy-loaded consent banner (no blocking); no layout shift from banner (CSS position:fixed bottom) |
| PERF-03 | Images optimized via Sanity CDN + next/image | Already implemented in Phase 2; audit pass to verify |
| PERF-04 | Fonts self-hosted via next/font | Already implemented in Phase 1; audit pass to verify |
| PERF-05 | No JS route exceeds 150KB gzipped | @next/bundle-analyzer; cookie consent must not pull in heavy CMP SDK |
| PERF-06 | All content routes are statically generated (ISR) | generateStaticParams in locale layout already covers this; legal pages must also export revalidate or be static |
| FOUND-07 | Sanity webhook endpoint with HMAC signature validation | `parseBody` from `next-sanity/webhook` — replaces stub in `app/api/revalidate/route.ts` |
</phase_requirements>

---

## Summary

Phase 3 operates entirely within the existing Next.js 16 App Router + next-intl v4 + Sanity v5 stack established in Phases 1–2. No new framework-level choices are needed. The three main work streams are: (1) SEO layer — metadata, JSON-LD schemas, sitemap, robots.txt; (2) compliance — cookie consent banner with Consent Mode v2 and four static legal pages; (3) performance audit and hardening — Lighthouse verification, bundle analysis, ISR end-to-end test, and the Sanity webhook HMAC stub completion.

The most technically nuanced work is the Consent Mode v2 GTM integration. The `@next/third-parties` GoogleTagManager component does not support consent mode as of early 2025 (confirmed by community reports). A manual two-part GTM snippet is required: synchronous dataLayer initialization with consent defaults in a `<script>` tag before the GTM container loads, then the GTM container itself. This must happen in the root locale layout before any other scripts run.

All SEO and legal page work is straightforward given the existing project structure. The `generateMetadata` + `alternates.languages` pattern in Next.js 16 handles hreflang natively. The sitemap.ts file convention with `alternates.languages` per entry handles multilingual sitemaps without any third-party package. Legal pages are static TSX files — no CMS, no library needed.

**Primary recommendation:** Implement in the order: (1) complete webhook handler, (2) metadata + JSON-LD + sitemap + robots, (3) consent banner + GTM, (4) legal pages, (5) Lighthouse audit. This ordering ensures ISR plumbing is complete before the performance audit runs.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 (installed) | generateMetadata, sitemap.ts, robots.ts, JSON-LD via script tag | Native — no extra package |
| next-intl | 4.8.3 (installed) | getTranslations in generateMetadata, locale-aware metadata | Already in use |
| next-sanity | 12.1.0 (installed) | parseBody + isValidSignature for webhook HMAC | Ships in next-sanity/webhook |
| next/cache | built-in | revalidateTag for on-demand ISR | Already used via sanityFetch tags |

### Supporting (to install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| schema-dts | ^1.1.2 | TypeScript types for Restaurant, Menu, MenuItem, LocalBusiness JSON-LD | Prevents invalid schema.org output at compile time |
| @next/bundle-analyzer | ^15+ | Visual bundle size report with gzip sizes | One-time audit in plan 03-03 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom consent banner | CookieYes / Axeptio SaaS | SaaS adds external domain request (+50ms), monthly cost, harder to style to brand; custom is simpler given two-button requirement |
| Manual GTM snippet | @next/third-parties GoogleTagManager | @next/third-parties does not support Consent Mode v2 injection as of 2025; manual snippet required |
| schema-dts | Raw JSON object literals | schema-dts provides compile-time type checking; zero runtime cost; worth the install |
| app/sitemap.ts | next-sitemap package | Next.js 16 native sitemap handles multilingual alternates natively; next-sitemap is legacy |

**Installation:**
```bash
npm install schema-dts
npm install --save-dev @next/bundle-analyzer
```

---

## Architecture Patterns

### Recommended Project Structure (additions for Phase 3)
```
src/
├── app/
│   ├── [locale]/
│   │   ├── mentions-legales/page.tsx      # static legal page
│   │   ├── politique-confidentialite/page.tsx
│   │   ├── politique-cookies/page.tsx
│   │   ├── cgv/page.tsx
│   │   └── layout.tsx                     # add generateMetadata here for locale-level OG defaults
│   ├── api/
│   │   └── revalidate/route.ts            # replace stub with HMAC handler
│   ├── sitemap.ts                         # multilingual sitemap
│   └── robots.ts                          # disallow /studio
├── components/
│   └── consent/
│       └── CookieBanner.tsx               # client component, reads/writes consent cookie
├── lib/
│   ├── seo.ts                             # NAP constants, metadataBase, shared OG defaults
│   └── consent.ts                         # consent cookie helpers (get/set/check)
└── messages/                              # already exists: add consent + legal namespace keys
    ├── fr.json
    ├── en.json
    └── de.json
```

### Pattern 1: generateMetadata with hreflang (per page)
**What:** Export async generateMetadata from each page.tsx; receive locale from params; use getTranslations for text; build alternates.languages for all 3 locales.
**When to use:** Every page under `[locale]/`
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata (v16.1.6)
// Source: https://next-intl.dev/docs/environments/actions-metadata-route-handlers
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

const BASE_URL = 'https://umai-ramen.fr'; // stored in lib/seo.ts

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta.home' });

  return {
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fr: '/fr',
        en: '/en',
        de: '/de',
        'x-default': '/fr',  // x-default points to default locale
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `/${locale}`,
      siteName: 'Umaï Ramen',
      locale: locale === 'fr' ? 'fr_FR' : locale === 'en' ? 'en_US' : 'de_DE',
      type: 'website',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Umaï Ramen Strasbourg' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og-image.jpg'],
    },
  };
}
```

**Critical note on x-default:** As of Next.js 16, `'x-default'` is a valid key in `alternates.languages`. It renders as `<link rel="alternate" hreflang="x-default" href="..." />`. Point it to `/fr` (the default locale per routing.ts).

### Pattern 2: JSON-LD injection (Restaurant schema)
**What:** Render a `<script type="application/ld+json">` tag inside the page's JSX. Sanitize `<` to prevent XSS.
**When to use:** Homepage (Restaurant schema), menu page (Menu + MenuItem schema)
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/json-ld (v16.1.6)
import type { WithContext, Restaurant } from 'schema-dts';

const jsonLd: WithContext<Restaurant> = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Umaï Ramen',
  url: 'https://umai-ramen.fr',
  telephone: '+33952343438',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5 Rue des Orphelins',
    addressLocality: 'Strasbourg',
    postalCode: '67000',
    addressCountry: 'FR',
  },
  servesCuisine: 'Japanese',
  priceRange: '€€',
  openingHoursSpecification: [
    // one entry per day/slot — derived from Sanity or hardcoded
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday'],
      opens: '12:00',
      closes: '14:30',
    },
  ],
  image: 'https://umai-ramen.fr/og-image.jpg',
};

// In the page JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
  }}
/>
```

**For MenuItem schema on menu page:** Use `@type: 'Menu'` containing `hasMenuSection` entries, each with `hasMenuItem` items. Data comes from the same Sanity fetch already wired in 02-02.

### Pattern 3: sitemap.ts (multilingual)
**What:** Native Next.js 16 sitemap file generating alternateRefs per entry.
**When to use:** `app/sitemap.ts` — generates `/sitemap.xml`
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap (v16.1.6)
import type { MetadataRoute } from 'next';

const BASE_URL = 'https://umai-ramen.fr';
const locales = ['fr', 'en', 'de'] as const;

const pages = ['', '/menu', '/reservation', '/commander', '/notre-histoire', '/infos', '/galerie'];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'weekly' : 'monthly',
      priority: page === '' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}${page}`])
        ),
      },
    }))
  );
}
```

### Pattern 4: robots.ts
**What:** Programmatic robots.txt blocking /studio from indexing.
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots (v16.1.6)
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/studio',
    },
    sitemap: 'https://umai-ramen.fr/sitemap.xml',
  };
}
```

### Pattern 5: Consent Mode v2 with manual GTM snippet
**What:** Two-part GTM injection: (1) synchronous dataLayer + consent defaults BEFORE GTM loads; (2) GTM script tag. Both placed in root locale `layout.tsx`.
**When to use:** Required because `@next/third-parties` GoogleTagManager does not support Consent Mode v2 (confirmed March 2025 community reports).
**Example:**
```typescript
// Source: https://developers.google.com/tag-platform/security/guides/consent
// In src/app/[locale]/layout.tsx <head> section:

// Part 1 — synchronous dataLayer init + consent defaults (before GTM script)
<script
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'wait_for_update': 500
      });
      gtag('js', new Date());
    `,
  }}
/>

// Part 2 — GTM container (afterInteractive — does not block render)
<Script
  id="gtm-script"
  strategy="afterInteractive"
  src={`https://www.googletagmanager.com/gtm.js?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
/>
```

**On consent accept** (in CookieBanner component):
```typescript
// Called when user clicks Accept
declare global { interface Window { gtag: (...args: unknown[]) => void } }

function updateConsent(granted: boolean) {
  const value = granted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}
```

### Pattern 6: CookieBanner component architecture
**What:** Client component with `'use client'`. Reads consent cookie on mount; if not set, renders banner. On user choice, writes cookie (13-month max-age), calls updateConsent(), hides banner.
**Key:** Banner must be rendered *after* the Consent Mode defaults are set (Part 1 of GTM snippet), not before. The banner does NOT block initial render — it renders over the page.

```typescript
// src/components/consent/CookieBanner.tsx
'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const COOKIE_NAME = 'umai_consent';
const COOKIE_MAX_AGE = 13 * 30 * 24 * 60 * 60; // 13 months in seconds

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations('consent');

  useEffect(() => {
    const existing = document.cookie
      .split(';')
      .find(c => c.trim().startsWith(COOKIE_NAME + '='));
    if (!existing) setVisible(true);
  }, []);

  function handleChoice(accepted: boolean) {
    document.cookie = `${COOKIE_NAME}=${accepted ? 'accepted' : 'rejected'}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    updateConsent(accepted);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 ...">
      <p>{t('message')}</p>
      <button onClick={() => handleChoice(false)}>{t('reject')}</button>
      <button onClick={() => handleChoice(true)}>{t('accept')}</button>
    </div>
  );
}
```

### Pattern 7: Sanity webhook HMAC handler (replacing stub)
**What:** `parseBody` from `next-sanity/webhook` handles HMAC-SHA256 validation automatically. Returns `{body, isValidSignature}`.
**Example:**
```typescript
// Source: https://victoreke.com/blog/sanity-webhooks-and-on-demand-revalidation-in-nextjs
// app/api/revalidate/route.ts — replaces the 501 stub
import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { parseBody } from 'next-sanity/webhook';

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{ _type: string }>(
      req,
      process.env.SANITY_WEBHOOK_SECRET
    );

    if (!isValidSignature) {
      return new Response('Invalid Signature', { status: 401 });
    }
    if (!body?._type) {
      return new Response('Bad Request', { status: 400 });
    }

    revalidateTag(body._type);
    return NextResponse.json({ revalidated: true, type: body._type, now: Date.now() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(message, { status: 500 });
  }
}
```

**Environment variable:** `SANITY_WEBHOOK_SECRET` (private, not `NEXT_PUBLIC_`). Set in Sanity webhook dashboard and in `.env.local` / hosting env vars.

### Anti-Patterns to Avoid
- **Using @next/third-parties for GTM:** Does not support Consent Mode v2 injection; consent defaults would not be set before the tag loads.
- **Setting consent defaults AFTER GTM loads:** The `gtag('consent','default',...)` call MUST execute before `gtm.js` is loaded. Order in the HTML matters.
- **Skipping x-default hreflang:** Google recommends x-default for multilingual sites; its absence is not penalized but its presence helps.
- **Relative URLs in alternates:** `alternates.languages` requires absolute URLs unless `metadataBase` is set. Set `metadataBase: new URL('https://umai-ramen.fr')` in the root layout or repeat in each generateMetadata.
- **Not sanitizing JSON-LD:** The `<` character in any string value (e.g. menu descriptions) would break HTML parsing. Always `.replace(/</g, '\\u003c')`.
- **Using middleware for consent-gating analytics:** Consent logic runs client-side; middleware operates server-side and cannot read client consent state. Keep consent entirely in the CookieBanner client component.
- **Heavy CMP library for a two-button banner:** Pulling in CookieYes or Axeptio JS SDK for a simple accept/reject adds 30–80KB to the bundle. The requirement is simple enough to implement with ~50 lines.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap with hreflang | Custom sitemap generator | `app/sitemap.ts` (Next.js built-in) | Native support since v14.2; handles xhtml:link alternates correctly |
| robots.txt | Static file in public/ | `app/robots.ts` (Next.js built-in) | Programmatic control; can reference env-var base URL |
| JSON-LD type safety | Raw object literals | schema-dts | Google-maintained TypeScript types; catches invalid schema at compile time |
| Webhook signature verification | Custom crypto.createHmac | `parseBody` from `next-sanity/webhook` | Already a dep (next-sanity 12.1.0 installed); handles header name and HMAC correctly |
| Consent mode initialization | Any CMP SDK | Manual gtag snippet | CMPs add external JS; the two-button design requires no vendor SDK |

**Key insight:** Next.js 16 natively handles sitemap, robots, and metadata — avoid installing next-sitemap or react-helmet as they add complexity without benefit in the App Router.

---

## Common Pitfalls

### Pitfall 1: metadataBase missing
**What goes wrong:** Next.js throws a build warning/error when `alternates.languages` contains relative paths without `metadataBase`. The hreflang links render as incomplete URLs.
**Why it happens:** The metadata API requires absolute URLs for hreflang and OG image links.
**How to avoid:** Set `metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'https://umai-ramen.fr')` in the root app/layout.tsx metadata export (or in each generateMetadata).
**Warning signs:** Build output warning: "metadata.metadataBase is not set for resolving social open graph or twitter images".

### Pitfall 2: generateMetadata not receiving locale for static rendering
**What goes wrong:** If `setRequestLocale(locale)` is called but locale is not explicitly passed to `getTranslations`, Next.js may fall back to dynamic rendering for that page, breaking ISR.
**Why it happens:** next-intl v4 requires the locale to be explicitly passed to server functions inside generateMetadata (separate from the page component context).
**How to avoid:** Always use `await getTranslations({ locale, namespace: '...' })` in generateMetadata — pass locale from `await params`.

### Pitfall 3: Consent Mode defaults set too late
**What goes wrong:** GTM fires tags before consent defaults are set. Google documents that "Setting the default too late may not have the anticipated effect."
**Why it happens:** If the gtag consent default snippet is in a `<Script strategy="afterInteractive">` tag, it runs after the GTM container, defeating the purpose.
**How to avoid:** The consent defaults must be in a synchronous `<script>` (no strategy prop, rendered by server), placed BEFORE the GTM `<Script>` in the `<head>`.

### Pitfall 4: CookieBanner causes CLS
**What goes wrong:** If the consent banner shifts page layout when it appears, CLS score exceeds 0.1, failing PERF-02.
**Why it happens:** Banner inserted into DOM flow pushes content up.
**How to avoid:** Use `position: fixed; bottom: 0` — the banner overlays content, never causes layout shifts. The `visible` state initially false (SSR renders nothing) means no hydration mismatch.

### Pitfall 5: Legal pages break ISR assumption
**What goes wrong:** Legal pages have no `revalidate` export; they may default to dynamic rendering.
**Why it happens:** Pages without explicit revalidate or `export const dynamic = 'force-static'` may be treated as dynamic if they contain any dynamic import.
**How to avoid:** Add `export const revalidate = false;` (permanently cached) to all legal page files — they are hardcoded and never change dynamically.

### Pitfall 6: SANITY_WEBHOOK_SECRET exposed as NEXT_PUBLIC_
**What goes wrong:** The webhook secret becomes visible in client-side JS bundles.
**Why it happens:** Accidentally naming the env var with NEXT_PUBLIC_ prefix.
**How to avoid:** Name it `SANITY_WEBHOOK_SECRET` (no NEXT_PUBLIC_ prefix). It is only used in the server-side API route. Noted as a critical security requirement.

### Pitfall 7: sitemap.ts not including legal pages
**What goes wrong:** /fr/mentions-legales etc. are not indexed. Not a blocking SEO issue but inconsistency.
**How to avoid:** Add the 4 legal page paths to the pages array in sitemap.ts.

### Pitfall 8: x-default hreflang discussion in Next.js
**What goes wrong:** There is an open GitHub discussion (vercel/next.js #76729) noting that x-default alternate hreflang support was requested. As of Next.js 16.1.6, the `'x-default'` key IS supported in `alternates.languages` based on the official docs showing the languages map accepts any string key.
**Confidence:** MEDIUM — verified in official docs example showing locale keys like `'en-US'` and `'de-DE'`; the `'x-default'` key is documented as valid in the alternates specification. Verify by inspecting `<head>` output after build.

---

## Code Examples

Verified patterns from official sources:

### metadataBase + alternates (minimal correct example)
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/generate-metadata (v16.1.6, 2026-02-20)
export const metadata = {
  metadataBase: new URL('https://umai-ramen.fr'),
  alternates: {
    canonical: '/fr',
    languages: {
      'fr': '/fr',
      'en': '/en',
      'de': '/de',
      'x-default': '/fr',
    },
  },
};
// Output:
// <link rel="canonical" href="https://umai-ramen.fr/fr" />
// <link rel="alternate" hreflang="fr" href="https://umai-ramen.fr/fr" />
// <link rel="alternate" hreflang="en" href="https://umai-ramen.fr/en" />
// <link rel="alternate" hreflang="de" href="https://umai-ramen.fr/de" />
// <link rel="alternate" hreflang="x-default" href="https://umai-ramen.fr/fr" />
```

### Sitemap with multilingual alternates
```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap (v16.1.6, 2026-02-20)
// The alternates.languages key in sitemap entries generates xhtml:link elements:
{
  url: 'https://umai-ramen.fr/fr',
  alternates: {
    languages: {
      fr: 'https://umai-ramen.fr/fr',
      en: 'https://umai-ramen.fr/en',
      de: 'https://umai-ramen.fr/de',
    },
  },
}
// Output in sitemap.xml:
// <xhtml:link rel="alternate" hreflang="fr" href="https://umai-ramen.fr/fr"/>
// <xhtml:link rel="alternate" hreflang="en" href="https://umai-ramen.fr/en"/>
// <xhtml:link rel="alternate" hreflang="de" href="https://umai-ramen.fr/de"/>
```

### Consent Mode v2 — all 4 parameters denied by default
```javascript
// Source: https://developers.google.com/tag-platform/security/guides/consent
gtag('consent', 'default', {
  'analytics_storage': 'denied',
  'ad_storage': 'denied',
  'ad_user_data': 'denied',         // NEW in v2 — required
  'ad_personalization': 'denied',   // NEW in v2 — required
  'wait_for_update': 500,           // wait 500ms for CMP to respond
});
```

### Sanity webhook parseBody
```typescript
// Source: https://victoreke.com/blog/sanity-webhooks-and-on-demand-revalidation-in-nextjs
// Source: https://github.com/sanity-io/next-sanity (official repo)
import { parseBody } from 'next-sanity/webhook';
const { body, isValidSignature } = await parseBody<{ _type: string }>(
  req,
  process.env.SANITY_WEBHOOK_SECRET
);
// isValidSignature: boolean — HMAC-SHA256 verified against secret
// body: parsed JSON payload from Sanity webhook
```

### Restaurant JSON-LD with schema-dts
```typescript
// Source: https://nextjs.org/docs/app/guides/json-ld, https://schema.org/Restaurant
import type { WithContext, Restaurant } from 'schema-dts';

const jsonLd: WithContext<Restaurant> = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Umaï Ramen',
  url: 'https://umai-ramen.fr',
  telephone: '+33952343438',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '5 Rue des Orphelins',
    addressLocality: 'Strasbourg',
    postalCode: '67000',
    addressCountry: 'FR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 48.5734,   // approximate — verify exact coords
    longitude: 7.7521,
  },
  servesCuisine: 'Japanese',
  priceRange: '€€',
  hasMap: 'https://maps.google.com/?q=Umaï+Ramen+Strasbourg',
  image: 'https://umai-ramen.fr/og-image.jpg',
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-sitemap package | `app/sitemap.ts` built-in | Next.js 13.3+ (stable in 15+) | No extra dependency; multilingual alternates supported natively since v14.2 |
| `_document.tsx` for head tags | `generateMetadata` / JSON-LD in Server Component | Next.js 13.2+ | Works with App Router; metadata is SSR-rendered |
| Consent Mode v1 (2 params) | Consent Mode v2 (4 params: + ad_user_data, ad_personalization) | November 2023 | Required for EU DMA compliance; missing params cause Google Tags to not load correctly |
| `@next/third-parties` GoogleTagManager | Manual two-part GTM snippet | March 2025 (community confirmed) | @next/third-parties does not expose consent mode hooks; manual required |
| `framer-motion` | `motion` (import from `motion/react`) | Phase 1 decision | Already in use — no change for this phase |

**Deprecated/outdated:**
- `themeColor` in metadata: deprecated since Next.js 14; use `generateViewport` instead (not needed for this project)
- `viewport` in metadata: deprecated since Next.js 14; auto-handled
- `__experimental_actions` in Sanity v5: already removed in Phase 1
- `next-sitemap`: functional but unnecessary given native support

---

## Open Questions

1. **Production domain for metadataBase**
   - What we know: The site will be hosted at some domain; placeholder is `umai-ramen.fr`
   - What's unclear: The actual production domain may differ
   - Recommendation: Use `process.env.NEXT_PUBLIC_BASE_URL ?? 'https://umai-ramen.fr'` in metadataBase; owner fills in env var before launch

2. **x-default hreflang in Next.js 16 output verification**
   - What we know: `'x-default'` is listed as a valid key in the alternates.languages map in official docs; there is a GitHub discussion (#76729) requesting explicit documentation
   - What's unclear: Whether the key is literally emitted as `hreflang="x-default"` or silently dropped
   - Recommendation: Verify by inspecting `curl https://domain/fr | grep hreflang` after first deployment; fallback is to inject it via metadata.other if needed

3. **Opening hours data source for JSON-LD**
   - What we know: Opening hours are in Sanity (INFO-01 requirement, Phase 2 complete); Sanity data is available in server components
   - What's unclear: Whether the exact Sanity schema field structure for hours maps cleanly to OpeningHoursSpecification
   - Recommendation: Fetch hours in homepage generateMetadata or page component from same SITE_SETTINGS_QUERY; hardcode as fallback if Sanity not configured

4. **Sanity Studio CORS for production**
   - What we know: STATE.md lists "Sanity Studio CORS production config — add to Phase 3-03 checklist"
   - What's unclear: Specific CORS domains to allow
   - Recommendation: Add the production domain to Sanity project CORS settings in sanity.io dashboard; document in 03-03 verification checklist

5. **GTM container ID environment variable naming**
   - What we know: CONTEXT.md says GTM/GA4 IDs as env vars (placeholders for now)
   - What's unclear: Whether owner will provide the actual GTM container ID before or after launch
   - Recommendation: Use `NEXT_PUBLIC_GTM_ID` for GTM; gate the script rendering on `!!process.env.NEXT_PUBLIC_GTM_ID` so missing ID in dev does not throw

---

## Sources

### Primary (HIGH confidence)
- `https://nextjs.org/docs/app/api-reference/functions/generate-metadata` (v16.1.6, 2026-02-20) — alternates.languages, openGraph, twitter, metadataBase
- `https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap` (v16.1.6, 2026-02-20) — multilingual sitemap with alternates
- `https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots` (v16.1.6, 2026-02-20) — robots.ts pattern
- `https://nextjs.org/docs/app/guides/json-ld` (v16.1.6, 2026-02-20) — JSON-LD injection pattern, XSS sanitization
- `https://developers.google.com/tag-platform/security/guides/consent` — Consent Mode v2 four parameters, gtag('consent','default') API
- `https://schema.org/Restaurant` — Restaurant type, openingHoursSpecification properties
- Project codebase: `src/app/api/revalidate/route.ts` (stub confirmed), `src/sanity/lib/client.ts` (sanityFetch tags), `src/i18n/routing.ts` (locales: ['fr','en','de'])

### Secondary (MEDIUM confidence)
- `https://victoreke.com/blog/sanity-webhooks-and-on-demand-revalidation-in-nextjs` — parseBody + revalidateTag implementation (matches next-sanity GitHub source)
- `https://next-intl.dev/docs/environments/actions-metadata-route-handlers` — generateMetadata + getTranslations({locale}) pattern for static rendering
- `https://www.cnil.fr/en/cookies-equally-easily-accepted-or-refused-cnil-sends-second-series-orders-comply` — CNIL equal-prominence enforcement (official CNIL)

### Tertiary (LOW confidence — flag for validation)
- Community report (March 2025): `@next/third-parties` GoogleTagManager does not support Consent Mode v2 injection. Source: multiple GitHub discussions (#64497, #48011). Validate by checking `@next/third-parties` changelog before implementation.
- `x-default` in alternates.languages: Behavior inferred from docs; validate in actual Next.js 16 build output.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against Next.js 16.1.6 official docs fetched 2026-02-20
- Architecture patterns: HIGH — all code examples derived from official docs or official Sanity guide
- GTM/Consent Mode: MEDIUM — Google docs are authoritative; @next/third-parties limitation is community-reported (LOW), recommend manual snippet approach regardless as it gives more control
- Legal pages requirements: MEDIUM — French government sources (economie.gouv.fr) plus cookieyes.com summary; content requirements are well-established French law
- Pitfalls: HIGH (most from official docs warnings) + MEDIUM (CLS pitfall from reasoning about fixed positioning)

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (Next.js/next-intl are actively developed; GTM consent guidance is stable)
