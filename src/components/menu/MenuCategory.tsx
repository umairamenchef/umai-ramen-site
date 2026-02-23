import { localized } from '@/lib/localized';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MenuItem } from './MenuItem';

interface MenuCategoryItem {
  _id: string;
  name: { fr: string; en?: string; de?: string };
  nameJp?: string;
  description?: { fr: string; en?: string; de?: string } | null;
  price: number;
  isVegetarian: boolean;
  isGlutenFree: boolean;
}

interface MenuCategoryProps {
  category: {
    _id: string;
    name: { fr: string; en?: string; de?: string };
    slug: { current: string };
    description?: { fr: string; en?: string; de?: string } | null;
    items: MenuCategoryItem[];
  };
  locale: string;
}

export function MenuCategory({ category, locale }: MenuCategoryProps) {
  if (!category.items || category.items.length === 0) {
    return null;
  }

  return (
    <section
      id={`category-${category.slug.current}`}
      className="pt-12 pb-8"
    >
      <SectionHeader
        title={localized(category.name, locale)}
        subtitle={
          category.description ? localized(category.description, locale) : undefined
        }
        centered={false}
      />
      <div>
        {category.items.map((item) => (
          <MenuItem
            key={item._id}
            name={item.name}
            nameJp={item.nameJp}
            price={item.price}
            description={item.description}
            isVegetarian={item.isVegetarian}
            isGlutenFree={item.isGlutenFree}
            locale={locale}
          />
        ))}
      </div>
    </section>
  );
}
