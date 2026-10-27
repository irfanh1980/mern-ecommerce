import { z } from 'zod';

export const messageSendSchema = z.object({
  content: z.string().trim().min(1, 'Message content is required').max(2000, 'Message cannot exceed 2000 characters'),
});

export const conversationCreateSchema = z.object({
  listingId: z.string().min(1, 'Listing ID is required'),
  recipientId: z.string().min(1, 'Recipient ID is required'),
});
