import { defineType, defineField } from 'sanity';

export const localeText = defineType({
  name: 'localeText',
  title: 'Texte long traduit',
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
      type: 'text',
    }),
    defineField({
      name: 'en',
      title: 'Anglais',
      type: 'text',
      fieldset: 'translations',
    }),
    defineField({
      name: 'de',
      title: 'Allemand',
      type: 'text',
      fieldset: 'translations',
    }),
    defineField({
      name: 'it',
      title: 'Italien',
      type: 'text',
      fieldset: 'translations',
    }),
    defineField({
      name: 'zh',
      title: 'Chinois (simplifié)',
      type: 'text',
      fieldset: 'translations',
      description: 'Caractères simplifiés (简体)',
    }),
  ],
});
