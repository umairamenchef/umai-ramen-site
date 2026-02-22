import { defineType, defineField } from 'sanity';

export const menuItem = defineType({
  name: 'menuItem',
  title: 'Menu Item',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'localeString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'nameJp',
      title: 'Japanese Name',
      type: 'string',
      description: 'Optional Japanese display name (e.g. ラーメン)',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name.fr', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeText',
    }),
    defineField({
      name: 'price',
      title: 'Price (€)',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'menuCategory' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'isVegetarian',
      title: 'Vegetarian',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isGlutenFree',
      title: 'Gluten Free',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'available',
      title: 'Available',
      type: 'boolean',
      description: 'Toggle item availability on the menu (MENU-06)',
      initialValue: true,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Controls the display order within a category',
    }),
  ],
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name.fr',
      media: 'image',
      price: 'price',
      available: 'available',
    },
    prepare({ title, media, price, available }) {
      return {
        title: title ?? 'Untitled',
        subtitle: `${price != null ? `€${price}` : '—'} ${available === false ? '(unavailable)' : ''}`,
        media,
      };
    },
  },
});
