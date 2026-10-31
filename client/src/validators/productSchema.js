import { z } from 'zod';

export const CURRENCIES = [
  { value: 'SEK', label: 'Swedish Krona (kr)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
];

export const CURRENCY_SYMBOLS = {
  SEK: 'kr',
  USD: '$',
  EUR: '€',
};

import { MAIN_CATEGORIES } from '../constants/categories.js';

export const CATEGORIES = MAIN_CATEGORIES;

export const productSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .default(''),
  price: z
    .preprocess(
      (val) => (val === '' || val === undefined ? undefined : Number(val)),
      z
        .number({
          required_error: 'Price is required',
          invalid_type_error: 'Enter a valid price',
        })
        .int('Price must be a whole number')
        .positive('Price must be greater than 0')
    ),
  currency: z.enum(['SEK', 'USD', 'EUR']).default('SEK'),
  inventory: z
    .preprocess(
      (val) => (val === '' || val === undefined ? undefined : Number(val)),
      z
        .number({
          required_error: 'Inventory is required',
          invalid_type_error: 'Enter a valid inventory',
        })
        .int('Inventory must be a whole number')
        .min(0, 'Inventory cannot be negative')
    ),
  category: z.enum(CATEGORIES, {
    required_error: 'Please select a category',
  }),
  subcategory: z.string().optional().default(''),
});
