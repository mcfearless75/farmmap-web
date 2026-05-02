import { defineType, defineField } from 'sanity'

export const productSchema = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Product name',
      type: 'string',
      validation: r => r.required(),
    }),
    defineField({
      name: 'shopSlug',
      title: 'Farm shop slug',
      type: 'string',
      description: 'Must match the shop slug on Farmmap exactly (e.g. "poachers-pantry")',
      validation: r => r.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'price',
      title: 'Price (£)',
      type: 'number',
      validation: r => r.required().positive(),
    }),
    defineField({
      name: 'unit',
      title: 'Unit / quantity',
      type: 'string',
      description: 'e.g. per kg, per dozen, each, 500g pack',
      validation: r => r.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          'Meat & Poultry', 'Dairy', 'Eggs', 'Vegetables',
          'Fruit', 'Bakery', 'Honey & Preserves',
          'Flowers', 'Drinks', 'Other',
        ],
      },
      validation: r => r.required(),
    }),
    defineField({
      name: 'images',
      title: 'Photos',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'available',
      title: 'Available to order?',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title:    'name',
      subtitle: 'shopSlug',
      media:    'images.0',
    },
  },
})
