import type { DayOfWeek } from 'schema-dts';

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

export const LOCALES = ['fr', 'en', 'de'] as const;
export const DEFAULT_LOCALE = 'fr';

export const OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'Umaï Ramen Strasbourg',
};

export function buildAlternates(locale: string, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      fr: `/fr${path}`,
      en: `/en${path}`,
      de: `/de${path}`,
      'x-default': `/fr${path}`,
    },
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
