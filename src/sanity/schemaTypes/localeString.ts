import { defineType, defineField } from 'sanity';

export const localeString = defineType({
  name: 'localeString',
  title: 'Localized String',
  type: 'object',
  fieldsets: [
    {
      title: 'Translations',
      name: 'translations',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: 'fr',
      title: 'French',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
      fieldset: 'translations',
    }),
    defineField({
      name: 'de',
      title: 'German',
      type: 'string',
      fieldset: 'translations',
    }),
  ],
});
