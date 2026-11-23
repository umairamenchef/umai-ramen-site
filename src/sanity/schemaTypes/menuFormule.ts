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
    defineField({
      name: 'available',
      title: 'Disponible',
      type: 'boolean',
      initialValue: true,
      description: 'Désactivez pour masquer cette formule sans la supprimer',
    }),
  ],
  orderings: [{ title: 'Ordre', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name.fr', price: 'price', available: 'available' },
    prepare({ title, price, available }: { title?: string; price?: number; available?: boolean }) {
      return {
        title: title ?? 'Sans titre',
        subtitle: `${price != null ? `${price} €` : '—'} ${available === false ? '⛔ Masqué' : ''}`,
      };
    },
  },
});
