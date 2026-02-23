export function localized(
  field: { fr: string; en?: string; de?: string } | null | undefined,
  locale: string,
  fallback = ''
): string {
  if (!field) return fallback;
  return field[locale as keyof typeof field] ?? field.fr ?? fallback;
}
