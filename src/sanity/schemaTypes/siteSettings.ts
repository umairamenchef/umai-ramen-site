import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Infos du restaurant',
  type: 'document',
  groups: [
    { name: 'general', title: 'Général', default: true },
    { name: 'links', title: 'Liens externes' },
    { name: 'horaires', title: 'Horaires' },
    { name: 'social', title: 'Réseaux sociaux' },
  ],
  fields: [
    defineField({
      name: 'catchphrase',
      title: 'Phrase d\'accroche',
      type: 'localeString',
      description: 'Texte principal affiché sur le hero de la page d\'accueil',
      group: 'general',
    }),
    defineField({
      name: 'accentColor',
      title: 'Couleur d\'accent',
      type: 'string',
      description: 'Couleur accent de la marque (code hex)',
      initialValue: '#77967A',
      group: 'general',
    }),
    defineField({
      name: 'phone',
      title: 'Téléphone',
      type: 'string',
      initialValue: '09 52 34 34 38',
      group: 'general',
    }),
    defineField({
      name: 'address',
      title: 'Adresse',
      type: 'object',
      group: 'general',
      fields: [
        defineField({ name: 'street', title: 'Rue', type: 'string' }),
        defineField({ name: 'city', title: 'Ville', type: 'string' }),
        defineField({ name: 'postalCode', title: 'Code postal', type: 'string' }),
      ],
    }),
    defineField({
      name: 'reservationUrl',
      title: 'Lien réservation (Gusty)',
      type: 'url',
      description: 'URL de la page de réservation en ligne',
      group: 'links',
    }),
    defineField({
      name: 'uberEatsUrl',
      title: 'Lien Uber Eats',
      type: 'url',
      description: 'URL de la page restaurant sur Uber Eats',
      group: 'links',
    }),
    defineField({
      name: 'clickCollectUrl',
      title: 'Lien Click & Collect (Gusty)',
      type: 'url',
      description: 'URL Click & Collect',
      group: 'links',
    }),
    defineField({
      name: 'eazeeLinkUrl',
      title: 'Lien EazeeLink',
      type: 'url',
      description: 'URL de la page EazeeLink',
      group: 'links',
    }),
    defineField({
      name: 'openingHours',
      title: 'Horaires d\'ouverture',
      type: 'array',
      group: 'horaires',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'day', title: 'Jour', type: 'string' }),
            defineField({
              name: 'periods',
              title: 'Créneaux',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({ name: 'open', title: 'Ouverture', type: 'string' }),
                    defineField({ name: 'close', title: 'Fermeture', type: 'string' }),
                  ],
                  preview: {
                    select: { open: 'open', close: 'close' },
                    prepare({ open, close }) {
                      return { title: `${open || '?'} — ${close || '?'}` };
                    },
                  },
                },
              ],
            }),
          ],
          preview: {
            select: { day: 'day' },
            prepare({ day }) {
              return { title: day || 'Jour' };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Réseaux sociaux',
      type: 'object',
      group: 'social',
      fields: [
        defineField({ name: 'instagram', title: 'Instagram', type: 'url' }),
        defineField({ name: 'facebook', title: 'Facebook', type: 'url' }),
      ],
    }),
  ],
});
