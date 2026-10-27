import { z } from 'zod';

const categoryEnum = z.enum([
  'electronics',
  'clothing',
  'home',
  'books',
  'sports',
  'beauty',
  'toys',
  'food',
  'other',
]);

export const productBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string().trim().max(1000, 'Description cannot exceed 1000 characters').optional().default(''),
  price: z
    .preprocess(
      (val) => (val === '' || val === undefined ? undefined : Number(val)),
      z
        .number({ required_error: 'Price is required', invalid_type_error: 'Enter a valid price' })
        .int('Price must be a whole number')
        .positive('Price must be greater than 0')
    ),
  currency: z.enum(['SEK', 'USD', 'EUR']).default('SEK'),
  inventory: z
    .preprocess(
      (val) => (val === '' || val === undefined ? undefined : Number(val)),
      z.number({
        required_error: 'Inventory is required',
        invalid_type_error: 'Enter a valid inventory',
      }).int('Inventory must be a whole number').min(0, 'Inventory cannot be negative')
    ),
  category: categoryEnum,
  images: z
    .array(
      z.object({
        url: z.string().url('Each image URL must be valid'),
        public_id: z.string().min(1, 'public_id is required for each image'),
      }),
    )
    .min(1, 'At least one product image is required'),
});

export const productUpdateSchema = productBodySchema.partial();
