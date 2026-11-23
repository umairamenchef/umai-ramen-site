import { defineType, defineField } from 'sanity';

export const priceVariant = defineType({
  name: 'priceVariant',
  title: 'Variante de prix',
  type: 'object',
  fields: [
    defineField({
      name: 'quantity',
      title: 'Quantité',
      type: 'number',
      description: 'Ex : 3 (pièces), 25 (cl). Laisser vide si un libellé est utilisé.',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'unit',
      title: 'Unité',
      type: 'string',
      options: {
        list: [
          { title: 'pièces (pcs)', value: 'pcs' },
          { title: 'centilitres (cl)', value: 'cl' },
          { title: 'litres (l)', value: 'l' },
          { title: 'boules (glace)', value: 'scoop' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'label',
      title: 'Libellé (cas particulier)',
      type: 'localeString',
      description:
        'Uniquement pour un format atypique, ex : « 3 × 6cl ». Sinon, utiliser quantité + unité.',
    }),
    defineField({
      name: 'price',
      title: 'Prix (€)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
  ],
  preview: {
    select: { quantity: 'quantity', unit: 'unit', label: 'label.fr', price: 'price' },
    prepare({ quantity, unit, label, price }) {
      const what = label ?? (quantity != null ? `${quantity} ${unit ?? ''}`.trim() : 'Prix');
      return { title: `${what} : ${price != null ? `${price} €` : '—'}` };
    },
  },
});
