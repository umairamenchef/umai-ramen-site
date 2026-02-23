import { defineType, defineField } from 'sanity';

export const localeString = defineType({
  name: 'localeString',
  title: 'Texte traduit',
  type: 'object',
  fieldsets: [
    {
      title: 'Traductions',
      name: 'translations',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: 'fr',
      title: 'Français',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'en',
      title: 'Anglais',
      type: 'string',
      fieldset: 'translations',
    }),
    defineField({
      name: 'de',
      title: 'Allemand',
      type: 'string',
      fieldset: 'translations',
    }),
  ],
});
