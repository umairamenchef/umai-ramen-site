import { defineType, defineField } from 'sanity';

export const menuExtra = defineType({
  name: 'menuExtra',
  title: 'Supplément',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Nom', type: 'localeString', validation: (r) => r.required() }),
    defineField({ name: 'price', title: 'Prix (€)', type: 'number', validation: (r) => r.required().positive() }),
    defineField({ name: 'order', title: 'Ordre d\'affichage', type: 'number', description: 'Position dans la liste (1 = premier)' }),
    defineField({ name: 'available', title: 'Disponible', type: 'boolean', initialValue: true, description: 'Désactivez pour masquer ce supplément' }),
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
