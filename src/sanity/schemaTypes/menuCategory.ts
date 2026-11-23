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
      name: 'nameJp',
      title: 'Libellé japonais (décoratif)',
      type: 'string',
      description: 'Ex : 前菜, ラーメン, ドリンク',
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      options: {
        list: [
          { title: 'Plats', value: 'food' },
          { title: 'Boissons', value: 'drinks' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      description: 'Regroupe la catégorie sous « Plats » ou « Boissons » sur la page menu.',
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
    defineField({
      name: 'footnote',
      title: 'Note de bas de catégorie',
      type: 'localeText',
      description:
        "Texte affiché après les plats (ex : « Inclus : un sirop à l'eau et une boule de glace au choix. »)",
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
