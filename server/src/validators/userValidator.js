import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().trim().max(200, 'Street is too long').optional().default(''),
  city: z.string().trim().max(100, 'City is too long').optional().default(''),
  state: z.string().trim().max(100, 'State is too long').optional().default(''),
  zipCode: z.string().trim().max(20, 'Zip code is too long').optional().default(''),
  country: z.string().trim().max(100, 'Country is too long').optional().default(''),
});

export const profileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s-]{7,15}$/, 'Please enter a valid phone number')
      .optional()
      .or(z.literal('')),
    avatar: z
      .string()
      .trim()
      .url('Please enter a valid image URL')
      .optional()
      .or(z.literal('')),
    role: z
      .enum(['Buyer', 'Seller', 'Both'])
      .optional(),
    address: addressSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No profile fields provided',
  });

export const passwordChangeSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[a-z]/, 'New password must contain a lowercase letter')
      .regex(/[A-Z]/, 'New password must contain an uppercase letter')
      .regex(/\d/, 'New password must contain a number')
      .regex(/[^A-Za-z0-9]/, 'New password must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });
