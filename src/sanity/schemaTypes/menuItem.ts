import { defineType, defineField } from 'sanity';

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Plat',
  type: 'document',
  groups: [
    { name: 'general', title: 'Général', default: true },
    { name: 'options', title: 'Options' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Nom du plat',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
      group: 'general',
    }),
    defineField({
      name: 'nameJp',
      title: 'Nom japonais',
      type: 'string',
      description: 'Optionnel — nom en japonais (ex: ラーメン)',
      group: 'general',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name.fr', maxLength: 96 },
      validation: (Rule) => Rule.required(),
      group: 'general',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeText',
      group: 'general',
    }),
    defineField({
      name: 'price',
      title: 'Prix (€)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
      group: 'general',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'general',
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'reference',
      to: [{ type: 'menuCategory' }],
      validation: (Rule) => Rule.required(),
      group: 'general',
    }),
    defineField({
      name: 'isVegetarian',
      title: 'Végétarien',
      type: 'boolean',
      initialValue: false,
      group: 'options',
    }),
    defineField({
      name: 'isGlutenFree',
      title: 'Sans gluten',
      type: 'boolean',
      initialValue: false,
      group: 'options',
    }),
    defineField({
      name: 'available',
      title: 'Disponible',
      type: 'boolean',
      description: 'Désactivez pour masquer ce plat du menu sans le supprimer',
      initialValue: true,
      group: 'options',
    }),
    defineField({
      name: 'order',
      title: 'Ordre d\'affichage',
      type: 'number',
      description: 'Position dans sa catégorie (1 = premier)',
      group: 'options',
    }),
  ],
  orderings: [
    {
      title: 'Ordre',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name.fr',
      media: 'image',
      price: 'price',
      available: 'available',
    },
    prepare({ title, media, price, available }) {
      return {
        title: title ?? 'Sans titre',
        subtitle: `${price != null ? `${price} €` : '—'} ${available === false ? '⛔ Masqué' : ''}`,
        media,
      };
    },
  },
});
