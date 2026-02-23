import { defineType, defineField } from 'sanity';

export const menuCategory = defineType({
  name: 'menuCategory',
  title: 'Catégorie du menu',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name.fr', maxLength: 96 },
      validation: (Rule) => Rule.required(),
      description: 'Identifiant URL — cliquez "Generate" après avoir rempli le nom',
    }),
    defineField({
      name: 'order',
      title: 'Ordre d\'affichage',
      type: 'number',
      description: 'Les catégories sont triées par ce numéro (1 = première)',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeText',
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
    select: { title: 'name.fr', order: 'order' },
    prepare({ title, order }) {
      return { title: title ?? 'Sans titre', subtitle: order != null ? `Position : ${order}` : '' };
    },
  },
});
