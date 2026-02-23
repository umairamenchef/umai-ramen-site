import type { MetadataRoute } from 'next';
import { BASE_URL, LOCALES } from '@/lib/seo';

const contentPages = [
  '',
  '/menu',
  '/reservation',
  '/commander',
  '/notre-histoire',
  '/infos',
  '/galerie',
];

const legalPages = [
  '/mentions-legales',
  '/politique-confidentialite',
  '/politique-cookies',
  '/cgv',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const contentEntries = contentPages.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: (page === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: page === '' ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${BASE_URL}/${l}${page}`])
        ),
      },
    }))
  );

  const legalEntries = legalPages.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((l) => [l, `${BASE_URL}/${l}${page}`])
        ),
      },
    }))
  );

  return [...contentEntries, ...legalEntries];
}
