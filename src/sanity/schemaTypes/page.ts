import { defineType, defineField } from 'sanity';

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.fr', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{ type: 'localeText' }],
      description: 'Main page content sections',
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
              title: 'Heading',
              type: 'localeString',
            }),
            defineField({
              name: 'body',
              title: 'Body',
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
      return { title: title ?? 'Untitled', subtitle: `/${slug ?? ''}` };
    },
  },
});
