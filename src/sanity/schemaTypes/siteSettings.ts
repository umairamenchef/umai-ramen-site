import { defineType, defineField } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'catchphrase',
      title: 'Catchphrase',
      type: 'localeString',
      description: 'Main restaurant tagline displayed in the hero section',
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent Color',
      type: 'string',
      description: 'Brand accent color (hex value)',
      initialValue: '#77967A',
    }),
    defineField({
      name: 'clickCollectUrl',
      title: 'Click & Collect URL',
      type: 'url',
      description: 'Gusty Click & Collect URL (pending from owner)',
    }),
    defineField({
      name: 'reservationUrl',
      title: 'Reservation URL',
      type: 'url',
      description: 'Online reservation booking link',
    }),
    defineField({
      name: 'uberEatsUrl',
      title: 'Uber Eats URL',
      type: 'url',
      description: 'Uber Eats restaurant page URL',
    }),
    defineField({
      name: 'eazeeLinkUrl',
      title: 'EazeeLink URL',
      type: 'url',
      description: 'EazeeLink page URL',
    }),
    defineField({
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      initialValue: '09 52 34 34 38',
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        defineField({ name: 'street', title: 'Street', type: 'string' }),
        defineField({ name: 'city', title: 'City', type: 'string' }),
        defineField({ name: 'postalCode', title: 'Postal Code', type: 'string' }),
      ],
    }),
    defineField({
      name: 'openingHours',
      title: 'Opening Hours',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'day', title: 'Day', type: 'string' }),
            defineField({
              name: 'periods',
              title: 'Periods',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({ name: 'open', title: 'Open', type: 'string' }),
                    defineField({ name: 'close', title: 'Close', type: 'string' }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
        defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
      ],
    }),
  ],
});
