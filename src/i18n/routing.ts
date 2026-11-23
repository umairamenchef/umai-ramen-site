import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from './locales';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  // Pages emit their own hreflang tags (buildAlternates: IT/ZH for /menu only);
  // next-intl's Link header would advertise /it/* and /zh/* for every page.
  alternateLinks: false,
});
