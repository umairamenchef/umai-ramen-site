import { defineType, defineField } from 'sanity';

export const menuFormule = defineType({
  name: 'menuFormule',
  title: 'Formule',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Nom de la formule', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'price', title: 'Prix (€)', type: 'number', validation: (r) => r.required().positive() }),
    defineField({ name: 'description', title: 'Description', type: 'localeText' }),
    defineField({
      name: 'includedItems',
      title: 'Contenu de la formule',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Ce qui est inclus (ex: "1 Gyoza + 1 Ramen")',
    }),
    defineField({ name: 'order', title: 'Ordre d\'affichage', type: 'number' }),
  ],
  orderings: [{ title: 'Ordre', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name.fr', price: 'price' },
    prepare({ title, price }: { title?: string; price?: number }) {
      return { title: title ?? 'Sans titre', subtitle: price != null ? `${price} €` : '—' };
    },
  },
});
