// Menu data contract and pure display helpers.
//
// IMPORTANT: this module has NO runtime imports (not even '@/lib/localized') and
// uses only erasable TypeScript (no enum, namespace or parameter properties), so
// that src/lib/menu.test.mjs can import it directly through Node's native type
// stripping. The Sanity sync script (phase 12, plan 02) writes documents in the
// shape described by these types.

export type LocaleField = { fr: string; en?: string; de?: string };

export type PriceUnit = 'pcs' | 'cl' | 'l' | 'scoop';
export type MenuBadge = 'bestseller' | 'vegetarianOption';
export type MenuSection = 'food' | 'drinks';

export type PriceVariant = {
  _key?: string;
  quantity?: number | null;
  unit?: PriceUnit | null;
  label?: LocaleField | null;
  price: number;
};

export type MenuItemData = {
  _id: string;
  name: LocaleField;
  nameJp?: string | null;
  description?: LocaleField | null;
  price?: number | null;
  prices?: PriceVariant[] | null;
  priceOnRequest?: boolean | null;
  badges?: MenuBadge[] | null;
  subgroup?: LocaleField | null;
  isVegetarian?: boolean | null;
  isGlutenFree?: boolean | null;
};

export type MenuCategoryData = {
  _id: string;
  name: LocaleField;
  slug: { current: string };
  nameJp?: string | null;
  section?: MenuSection | null;
  description?: LocaleField | null;
  footnote?: LocaleField | null;
  items: MenuItemData[];
};

export type PriceDisplay =
  | { kind: 'none' }
  | { kind: 'onRequest' }
  | { kind: 'single'; amount: number; variant: PriceVariant | null }
  | { kind: 'variants'; variants: PriceVariant[] };

/** Renders « 3 pcs » / « 2 boules » through the message files (translatable). */
export type UnitText = (unit: 'pcs' | 'scoop', count: number) => string;

export type MenuOffer = {
  '@type': 'Offer';
  price: string;
  priceCurrency: 'EUR';
  name?: string;
};

type PricedItem = Pick<MenuItemData, 'price' | 'prices' | 'priceOnRequest'>;

/** Same semantics as `localized()`: requested locale, then French, then ''. */
export function pickLocale(field: LocaleField | null | undefined, locale: string): string {
  if (!field) return '';
  return (field as Record<string, string | undefined>)[locale] ?? field.fr ?? '';
}

/** « 5,50 € », with a non-breaking space so the euro sign never wraps alone on mobile. */
export function formatEuro(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} €`;
}

/** 25 -> « 25 », 4.5 -> « 4,5 ». */
export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
}

/**
 * Decides how an item's price is shown.
 * priceOnRequest wins; then price variants (2+ -> list, 1 -> single price that
 * keeps its quantity); then the plain price; otherwise nothing. Variants without
 * a numeric price are ignored so a malformed document can never crash the page
 * or print a raw `null` / `NaN`.
 */
export function getPriceDisplay(item: PricedItem): PriceDisplay {
  if (item.priceOnRequest === true) return { kind: 'onRequest' };
  const variants = (Array.isArray(item.prices) ? item.prices : []).filter(
    (variant) => variant != null && typeof variant.price === 'number',
  );
  if (variants.length >= 2) return { kind: 'variants', variants };
  if (variants.length === 1) {
    return { kind: 'single', amount: variants[0].price, variant: variants[0] };
  }
  if (typeof item.price === 'number') {
    return { kind: 'single', amount: item.price, variant: null };
  }
  return { kind: 'none' };
}

/**
 * The quantity part of a variant: « 3 pcs », « 25cl », « 1,5l », « 2 boules »,
 * or its free label (« 3 × 6cl »). Empty string when there is nothing to show.
 */
export function variantQuantityText(
  variant: PriceVariant,
  locale: string,
  unitText: UnitText,
): string {
  const label = pickLocale(variant.label, locale);
  if (label) return label;
  const quantity = variant.quantity;
  if (quantity == null) return '';
  const unit = variant.unit;
  if (unit === 'pcs' || unit === 'scoop') return unitText(unit, quantity);
  if (unit === 'cl' || unit === 'l') return `${formatQuantity(quantity)}${unit}`;
  return formatQuantity(quantity);
}

/**
 * schema.org Offers for an item: one per price variant, one for a plain price,
 * none for « Prix sur demande » or unpriced items. `describe` (variants only)
 * adds the offer name, e.g. « 3 pcs ».
 */
export function buildOffers(
  item: PricedItem,
  describe?: (variant: PriceVariant) => string,
): MenuOffer[] {
  const display = getPriceDisplay(item);

  const toOffer = (price: number, variant: PriceVariant | null): MenuOffer => {
    const offer: MenuOffer = {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'EUR',
    };
    if (variant && describe) {
      const name = describe(variant);
      if (name) offer.name = name;
    }
    return offer;
  };

  if (display.kind === 'variants') {
    return display.variants.map((variant) => toOffer(variant.price, variant));
  }
  if (display.kind === 'single') {
    return [toOffer(display.amount, display.variant)];
  }
  return [];
}

/**
 * Buckets categories into « Plats » (food), « Boissons » (drinks) and the rest
 * (no or unknown section), in that order. Empty buckets are omitted and the input
 * order is kept inside each bucket.
 */
export function groupBySection(
  categories: MenuCategoryData[],
): Array<{ section: MenuSection | null; categories: MenuCategoryData[] }> {
  const food: MenuCategoryData[] = [];
  const drinks: MenuCategoryData[] = [];
  const other: MenuCategoryData[] = [];

  for (const category of categories) {
    if (category.section === 'food') food.push(category);
    else if (category.section === 'drinks') drinks.push(category);
    else other.push(category);
  }

  const groups: Array<{ section: MenuSection | null; categories: MenuCategoryData[] }> = [];
  if (food.length > 0) groups.push({ section: 'food', categories: food });
  if (drinks.length > 0) groups.push({ section: 'drinks', categories: drinks });
  if (other.length > 0) groups.push({ section: null, categories: other });
  return groups;
}

/**
 * Pairs each item with the sub-group heading to print above it: the heading is
 * set only when the item's sub-group text is non-empty and differs from the
 * previous item's, otherwise null.
 */
export function withSubgroupHeadings(
  items: MenuItemData[],
  locale: string,
): Array<{ heading: string | null; item: MenuItemData }> {
  let previous = '';
  return items.map((item) => {
    const current = pickLocale(item.subgroup, locale);
    const heading = current !== '' && current !== previous ? current : null;
    previous = current;
    return { heading, item };
  });
}
