import { defineType, defineField } from 'sanity';

export const menuFormule = defineType({
  name: 'menuFormule',
  title: 'Menu Formule',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'price', title: 'Price (EUR)', type: 'number', validation: (r) => r.required().positive() }),
    defineField({ name: 'description', title: 'Description', type: 'localeText' }),
    defineField({
      name: 'includedItems',
      title: 'Included Items',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List of items included in this formule (e.g., "1 Gyoza + 1 Ramen")',
    }),
    defineField({ name: 'order', title: 'Display Order', type: 'number' }),
  ],
  orderings: [{ title: 'Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name.fr', price: 'price' },
    prepare({ title, price }: { title?: string; price?: number }) {
      return { title: title ?? 'Untitled', subtitle: price != null ? `${price} EUR` : '—' };
    },
  },
});
