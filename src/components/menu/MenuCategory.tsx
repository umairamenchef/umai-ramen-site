import { Fragment } from 'react';
import { localized } from '@/lib/localized';
import { withSubgroupHeadings, type MenuCategoryData } from '@/lib/menu';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MenuItem } from './MenuItem';

interface MenuCategoryProps {
  category: MenuCategoryData;
  locale: string;
}

export function MenuCategory({ category, locale }: MenuCategoryProps) {
  if (!category.items || category.items.length === 0) {
    return null;
  }

  const footnote = category.footnote ? localized(category.footnote, locale) : '';

  return (
    <section
      id={`category-${category.slug.current}`}
      className="pt-12 pb-8"
    >
      <SectionHeader
        title={localized(category.name, locale)}
        jpLabel={category.nameJp ?? undefined}
        subtitle={
          category.description ? localized(category.description, locale) : undefined
        }
        centered={false}
      />
      <div>
        {withSubgroupHeadings(category.items, locale).map(({ heading, item }) => (
          <Fragment key={item._id}>
            {heading && (
              <p className="font-body text-xs uppercase tracking-widest text-umai-accent pt-6 pb-1">
                {heading}
              </p>
            )}
            <MenuItem item={item} locale={locale} />
          </Fragment>
        ))}
      </div>
      {footnote && (
        <p className="font-body text-sm italic text-umai-text-muted mt-4">
          {footnote}
        </p>
      )}
    </section>
  );
}
