import { z } from 'zod';
import { getCategoryAttributeKeys } from '../constants/categoryAttributes.js';

const categoryEnum = z.string().min(1);

export const productBodyObject = z.object({
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
        .min(0, 'Price cannot be negative')
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
  subcategory: z.string().trim().optional().default(''),
  productType: z.string().trim().optional().default(''),
  condition: z
    .enum(['brand_new', 'like_new', 'used_good', 'used_wear', 'needs_repair'])
    .default('used_good'),
  canBeSent: z.boolean().default(false),
  freeShipping: z.boolean().default(false),
  listingType: z.enum(['selling', 'wanted', 'rent', 'given']).default('selling'),
  attributes: z.record(z.string(), z.string()).optional().default({}),
  images: z
    .array(
      z.object({
        url: z.string().url('Each image URL must be valid'),
        public_id: z.string().min(1, 'public_id is required for each image'),
      }),
    )
    .min(1, 'At least one product image is required'),
});

const refinePrice = (data, ctx) => {
  if (data.price === undefined) return;
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
};

const refineAttributes = (data, ctx) => {
  if (!data.attributes || !data.category) return;
  const allowed = new Set(getCategoryAttributeKeys(data.category));
  Object.keys(data.attributes).forEach((key) => {
    if (!allowed.has(key)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['attributes', key],
        message: `Attribute "${key}" is not valid for this category`,
      });
    }
  });
};

export const productBodySchema = productBodyObject.superRefine((data, ctx) => {
  refinePrice(data, ctx);
  refineAttributes(data, ctx);
});

export const productUpdateSchema = productBodyObject.partial().superRefine((data, ctx) => {
  refinePrice(data, ctx);
  refineAttributes(data, ctx);
});
