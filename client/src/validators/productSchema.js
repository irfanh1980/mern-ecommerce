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

import { MAIN_CATEGORIES, SUBCATEGORIES, PRODUCT_TYPES } from '../constants/categories.js';

export const CATEGORIES = MAIN_CATEGORIES;
export { SUBCATEGORIES, PRODUCT_TYPES };

export const CONDITIONS = [
  { value: 'brand_new', label: 'Brand new' },
  { value: 'like_new', label: 'Like new' },
  { value: 'used_good', label: 'Used - Good' },
  { value: 'used_wear', label: 'Used - Wear' },
  { value: 'needs_repair', label: 'Needs repair' },
];

export const LISTING_TYPES = [
  { value: 'selling', label: 'For sale' },
  { value: 'wanted', label: 'Looking to buy' },
  { value: 'rent', label: 'For rent' },
  { value: 'given', label: 'Free / Giveaway' },
];

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
          error: (iss) => (iss.input === undefined ? 'Price is required' : 'Enter a valid price'),
        })
        .int('Price must be a whole number')
        .min(0, 'Price cannot be negative')
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
  category: z
    .string({ required_error: 'Please select a category' })
    .min(1, 'Please select a category')
    .refine((v) => CATEGORIES.includes(v), 'Please select a valid category'),
  subcategory: z.string().optional().default(''),
  productType: z.string().optional().default(''),
  condition: z
    .string({ required_error: 'Please select a condition' })
    .min(1, 'Please select a condition')
    .refine((v) => CONDITIONS.map((c) => c.value).includes(v), 'Please select a valid condition'),
  canBeSent: z.boolean().optional().default(false),
  freeShipping: z.boolean().optional().default(false),
  listingType: z.enum(LISTING_TYPES.map(t => t.value)).default('selling'),
  attributes: z.record(z.string(), z.string()).optional().default({}),
}).superRefine((data, ctx) => {
  if (data.listingType === 'given') {
    if (data.price !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['price'],
        message: 'Free / Giveaway items must have a price of 0',
      });
    }
  } else if (data.price <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price'],
      message: 'Price must be greater than 0',
    });
  }
});
