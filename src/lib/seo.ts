import type { DayOfWeek } from 'schema-dts';
import { htmlLang, localesForPath } from '@/i18n/locales';

// Keep in sync with Sanity siteSettings document
// NAP constants are the SEO/fallback source; Sanity siteSettings is the editorial source.

export const NAP = {
  name: 'Umaï Ramen',
  streetAddress: '5 Rue des Orphelins',
  addressLocality: 'Strasbourg',
  postalCode: '67000',
  addressCountry: 'FR',
  telephone: '+33952343438',
  telephoneDisplay: '+33 9 52 34 34 38',
} as const;

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://umai-ramen.fr';

// The locale lists moved to src/i18n/locales.ts (single source of truth).
export { DEFAULT_LOCALE } from '@/i18n/locales';

export const OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Umaï Ramen Strasbourg',
};

// hreflang: IT/ZH only for the menu (I18N-05), x-default stays the French page.
// `path` is the page path without its locale prefix ('', '/menu', '/infos', …).
export function buildAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of localesForPath(path)) {
    languages[htmlLang(l)] = `/${l}${path}`;
  }
  languages['x-default'] = `/fr${path}`;
  return {
    canonical: `/${locale}${path}`,
    languages,
  };
}

// Opening hours for JSON-LD openingHoursSpecification
// Fallback hours — hardcoded reasonable restaurant schedule
export const OPENING_HOURS = [
  {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: [
      'https://schema.org/Tuesday' as DayOfWeek,
      'https://schema.org/Wednesday' as DayOfWeek,
      'https://schema.org/Thursday' as DayOfWeek,
    ],
    opens: '12:00',
    closes: '14:00',
  },
  {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: [
      'https://schema.org/Tuesday' as DayOfWeek,
      'https://schema.org/Wednesday' as DayOfWeek,
      'https://schema.org/Thursday' as DayOfWeek,
    ],
    opens: '19:00',
    closes: '22:00',
  },
  {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: ['https://schema.org/Friday' as DayOfWeek],
    opens: '12:00',
    closes: '14:00',
  },
  {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: ['https://schema.org/Friday' as DayOfWeek],
    opens: '19:00',
    closes: '22:30',
  },
  {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: ['https://schema.org/Saturday' as DayOfWeek],
    opens: '12:00',
    closes: '14:30',
  },
  {
    '@type': 'OpeningHoursSpecification' as const,
    dayOfWeek: ['https://schema.org/Saturday' as DayOfWeek],
    opens: '19:00',
    closes: '22:30',
  },
];
