import { defineType, defineField } from 'sanity';

export const menuExtra = defineType({
  name: 'menuExtra',
  title: 'Menu Extra',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'price', title: 'Price (EUR)', type: 'number', validation: (r) => r.required().positive() }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
    defineField({ name: 'available', title: 'Available', type: 'boolean', initialValue: true }),
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name.fr', price: 'price', available: 'available' },
    prepare({ title, price, available }: { title?: string; price?: number; available?: boolean }) {
      return {
        title: title ?? 'Untitled',
        subtitle: `${price != null ? `${price} EUR` : '—'} ${available === false ? '(unavailable)' : ''}`,
      };
    },
  },
});
