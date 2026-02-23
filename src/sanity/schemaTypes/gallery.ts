import { defineType, defineField } from 'sanity';

export const gallery = defineType({
  name: 'gallery',
  title: 'Photo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Légende',
      type: 'localeString',
      description: 'Optionnel — texte affiché sous la photo',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Texte alternatif',
      type: 'localeString',
      description: 'Description de l\'image pour l\'accessibilité (obligatoire)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Ordre d\'affichage',
      type: 'number',
      description: 'Position dans la galerie (1 = première)',
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
    select: { title: 'title.fr', media: 'image', order: 'order' },
    prepare({ title, media, order }) {
      return {
        title: title ?? 'Photo',
        subtitle: order != null ? `Position : ${order}` : '',
        media,
      };
    },
  },
});
