import { defineType, defineField } from 'sanity';

export const localeText = defineType({
  name: 'localeText',
  title: 'Localized Text',
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
      type: 'text',
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'text',
      fieldset: 'translations',
    }),
    defineField({
      name: 'de',
      title: 'German',
      type: 'text',
      fieldset: 'translations',
    }),
  ],
});
