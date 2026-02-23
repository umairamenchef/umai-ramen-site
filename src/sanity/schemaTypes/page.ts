import { defineType, defineField } from 'sanity';

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.fr', maxLength: 96 },
      validation: (Rule) => Rule.required(),
      description: 'Identifiant URL — cliquez "Generate" après avoir rempli le titre',
    }),
    defineField({
      name: 'content',
      title: 'Contenu',
      type: 'array',
      of: [{ type: 'localeText' }],
      description: 'Sections de contenu de la page',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'heading',
              title: 'Titre de section',
              type: 'localeString',
            }),
            defineField({
              name: 'body',
              title: 'Texte',
              type: 'localeText',
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
            }),
          ],
          preview: {
            select: { title: 'heading.fr' },
            prepare({ title }) {
              return { title: title ?? 'Section' };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title.fr', slug: 'slug.current' },
    prepare({ title, slug }) {
      return { title: title ?? 'Sans titre', subtitle: `/${slug ?? ''}` };
    },
  },
});
