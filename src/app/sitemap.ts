import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';
import { htmlLang, localesForPath } from '@/i18n/locales';

const contentPages = [
  '',
  '/menu',
  '/carte-ete',
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

// IT/ZH are menu-only (I18N-05): localesForPath('/menu') is the only list with it/zh,
// so /it/menu and /zh/menu are the only IT/ZH URLs. /menu/qr (Phase 15) is NOT listed.
// 11 pages x fr/en/de + /menu x 5 = 38 URLs.
function languagesFor(page: string): Record<string, string> {
  return Object.fromEntries(
    localesForPath(page).map((l) => [htmlLang(l), `${BASE_URL}/${l}${page}`])
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const contentEntries = contentPages.flatMap((page) =>
    localesForPath(page).map((locale) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: (page === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: page === '' ? 1 : 0.8,
      alternates: { languages: languagesFor(page) },
    }))
  );

  const legalEntries = legalPages.flatMap((page) =>
    localesForPath(page).map((locale) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
      alternates: { languages: languagesFor(page) },
    }))
  );

  return [...contentEntries, ...legalEntries];
}
