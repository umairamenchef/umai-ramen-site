import { localized } from '@/lib/localized';
import { DietaryBadge } from './DietaryBadge';

interface MenuItemProps {
  name: { fr: string; en?: string; de?: string };
  nameJp?: string;
  price: number;
  description?: { fr: string; en?: string; de?: string } | null;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  locale: string;
}

export function MenuItem({
  name,
  nameJp,
  price,
  description,
  isVegetarian,
  isGlutenFree,
  locale,
}: MenuItemProps) {
  return (
    <div className="flex items-start gap-4 py-5 border-b border-umai-line last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display text-xl uppercase tracking-wide">
            {localized(name, locale)}
          </h3>
          {nameJp && (
            <span className="font-jp text-xs text-umai-accent opacity-70">
              {nameJp}
            </span>
          )}
          {isVegetarian && <DietaryBadge type="vegetarian" />}
          {isGlutenFree && <DietaryBadge type="gluten-free" />}
        </div>
        {description && (
          <p className="font-body text-sm text-umai-text-muted mt-1">
            {localized(description, locale)}
          </p>
        )}
      </div>
      <span className="font-body text-base font-medium tabular-nums shrink-0">
        {price.toFixed(2).replace('.', ',')} &euro;
      </span>
    </div>
  );
}
