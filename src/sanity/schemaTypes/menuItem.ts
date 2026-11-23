import { defineType, defineField } from 'sanity';

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Plat',
  type: 'document',
  groups: [
    { name: 'general', title: 'Général', default: true },
    { name: 'options', title: 'Options' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Nom du plat',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
      group: 'general',
    }),
    defineField({
      name: 'nameJp',
      title: 'Nom japonais',
      type: 'string',
      description: 'Optionnel — nom en japonais (ex: ラーメン)',
      group: 'general',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name.fr', maxLength: 96 },
      validation: (Rule) => Rule.required(),
      group: 'general',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeText',
      group: 'general',
    }),
    defineField({
      name: 'subgroup',
      title: 'Sous-groupe',
      type: 'localeString',
      description:
        'Petit intertitre dans la catégorie (ex : Pressions / Bouteilles). Laisser vide sinon.',
      group: 'general',
    }),
    defineField({
      name: 'price',
      title: 'Prix (€)',
      type: 'number',
      description:
        'Prix unique. Avec des variantes, indiquer le prix le plus bas (utilisé pour le référencement).',
      validation: (Rule) =>
        Rule.positive().custom((value, context) => {
          const doc = context.document as
            | { prices?: unknown[]; priceOnRequest?: boolean }
            | undefined;
          const hasVariants = Array.isArray(doc?.prices) && doc.prices.length > 0;
          if (value == null && !hasVariants && doc?.priceOnRequest !== true) {
            return 'Indiquez un prix, des variantes de prix ou cochez « Prix sur demande ».';
          }
          return true;
        }),
      group: 'general',
    }),
    defineField({
      name: 'prices',
      title: 'Variantes de prix',
      type: 'array',
      of: [{ type: 'priceVariant' }],
      description:
        'Ex : 3 pcs / 6 pcs / 9 pcs, 25cl / 50cl, verre / bouteille. Le site affiche toutes les variantes.',
      group: 'general',
    }),
    defineField({
      name: 'priceOnRequest',
      title: 'Prix sur demande',
      type: 'boolean',
      initialValue: false,
      description: "Affiche « Prix sur demande » au lieu d'un prix.",
      group: 'general',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'general',
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'reference',
      to: [{ type: 'menuCategory' }],
      validation: (Rule) => Rule.required(),
      group: 'general',
    }),
    defineField({
      name: 'isVegetarian',
      title: 'Végétarien',
      type: 'boolean',
      initialValue: false,
      group: 'options',
    }),
    defineField({
      name: 'isGlutenFree',
      title: 'Sans gluten',
      type: 'boolean',
      initialValue: false,
      group: 'options',
    }),
    defineField({
      name: 'badges',
      title: 'Mentions',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Notre best-seller', value: 'bestseller' },
          { title: 'Version végétarienne disponible', value: 'vegetarianOption' },
        ],
        layout: 'grid',
      },
      group: 'options',
    }),
    defineField({
      name: 'available',
      title: 'Disponible',
      type: 'boolean',
      description: 'Désactivez pour masquer ce plat du menu sans le supprimer',
      initialValue: true,
      group: 'options',
    }),
    defineField({
      name: 'order',
      title: 'Ordre d\'affichage',
      type: 'number',
      description: 'Position dans sa catégorie (1 = premier)',
      group: 'options',
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
    select: {
      title: 'name.fr',
      media: 'image',
      price: 'price',
      priceOnRequest: 'priceOnRequest',
      variants: 'prices',
      available: 'available',
    },
    prepare({ title, media, price, priceOnRequest, variants, available }) {
      const priceText = priceOnRequest
        ? 'Prix sur demande'
        : Array.isArray(variants) && variants.length > 0
          ? variants
              .map((v: { price?: number }) => v?.price)
              .filter((p: number | undefined) => p != null)
              .join(' / ') + ' €'
          : price != null
            ? `${price} €`
            : '—';
      return {
        title: title ?? 'Sans titre',
        subtitle: `${priceText} ${available === false ? '⛔ Masqué' : ''}`,
        media,
      };
    },
  },
});
