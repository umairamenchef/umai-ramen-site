import { useTranslations } from 'next-intl';
import { localized } from '@/lib/localized';
import {
  formatEuro,
  getPriceDisplay,
  variantQuantityText,
  type MenuItemData,
} from '@/lib/menu';
import { DietaryBadge } from './DietaryBadge';

interface MenuItemProps {
  item: MenuItemData;
  locale: string;
}

export function MenuItem({ item, locale }: MenuItemProps) {
  const t = useTranslations('menu');
  const unitText = (unit: 'pcs' | 'scoop', count: number) =>
    t(`unit.${unit}`, { count });
  const display = getPriceDisplay(item);

  // A lone priced variant (e.g. « 33cl 5,90 € ») keeps its quantity next to the price.
  const singleQuantity =
    display.kind === 'single' && display.variant
      ? variantQuantityText(display.variant, locale, unitText)
      : '';

  return (
    <div className="flex items-start gap-4 py-5 border-b border-umai-line last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-xl uppercase tracking-wide">
            {localized(item.name, locale)}
          </h3>
          {item.nameJp && (
            <span className="font-jp text-xs text-umai-accent opacity-70">
              {item.nameJp}
            </span>
          )}
          {item.isVegetarian && <DietaryBadge type="vegetarian" />}
          {item.isGlutenFree && <DietaryBadge type="gluten-free" />}
          {item.badges?.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-body font-medium uppercase tracking-wider rounded-full bg-umai-accent text-umai-white"
            >
              {t(`badge.${badge}`)}
            </span>
          ))}
        </div>
        {item.description && (
          <p className="font-body text-sm text-umai-text-muted mt-1">
            {localized(item.description, locale)}
          </p>
        )}
        {display.kind === 'variants' && (
          <ul className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-body text-sm tabular-nums">
            {display.variants.map((variant, index) => (
              <li key={variant._key ?? index} className="whitespace-nowrap">
                {index > 0 && (
                  <span aria-hidden="true" className="mr-3 text-umai-line-dotted">
                    ·
                  </span>
                )}
                <span className="text-umai-text-muted">
                  {variantQuantityText(variant, locale, unitText)}
                </span>{' '}
                <span className="font-medium text-umai-text">
                  {formatEuro(variant.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {display.kind === 'single' && (
        <span className="font-body text-base font-medium tabular-nums shrink-0 whitespace-nowrap">
          {singleQuantity && (
            <>
              <span className="text-sm font-normal text-umai-text-muted">
                {singleQuantity}
              </span>{' '}
            </>
          )}
          {formatEuro(display.amount)}
        </span>
      )}
      {display.kind === 'onRequest' && (
        <span className="font-body text-sm italic text-umai-text-muted shrink-0 whitespace-nowrap">
          {t('priceOnRequest')}
        </span>
      )}
    </div>
  );
}
