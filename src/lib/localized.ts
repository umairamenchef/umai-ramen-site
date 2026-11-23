import { pickLocale, type LocaleField } from './menu';

/** Content fallback: requested locale, then French (the server-readable name), then `fallback`. */
export function localized(
  field: LocaleField | null | undefined,
  locale: string,
  fallback = '',
): string {
  const value = pickLocale(field, locale);
  return value !== '' ? value : fallback;
}
