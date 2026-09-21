import { z } from 'zod';
import { VENDOR_VERIFICATION_STATUSES } from '../constants.js';

export const vendorVerificationStatusSchema = z.enum(VENDOR_VERIFICATION_STATUSES);

export const vendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  locality: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(300).optional(),
  phone: z.string().min(1).max(40).optional(),
  website: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  description: z.string().max(2000).optional(),
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1).max(200),
  discoveredAt: z.string().datetime({ offset: true }),
  verificationStatus: vendorVerificationStatusSchema,
});

export type VendorVerificationStatus = z.infer<typeof vendorVerificationStatusSchema>;
export type Vendor = z.infer<typeof vendorSchema>;
