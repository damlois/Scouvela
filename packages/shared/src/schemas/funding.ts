import { z } from 'zod';
import { FUNDING_STATUSES, FUNDING_TYPES } from '../constants.js';

export const fundingTypeSchema = z.enum(FUNDING_TYPES);
export const fundingStatusSchema = z.enum(FUNDING_STATUSES);

export const fundingOpportunitySchema = z.object({
  id: z.string().min(1),
  kind: z.literal('funding').default('funding'),
  title: z.string().min(1).max(300),
  provider: z.string().min(1).max(200),
  fundingType: fundingTypeSchema,
  amount: z.string().min(1).max(200).optional(),
  eligibility: z.array(z.string().min(1).max(300)).max(20).optional(),
  deadline: z.string().min(1).max(50).optional(),
  status: fundingStatusSchema,
  location: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1).max(200),
  discoveredAt: z.string().datetime({ offset: true }),
});

export type FundingType = z.infer<typeof fundingTypeSchema>;
export type FundingStatus = z.infer<typeof fundingStatusSchema>;
export type FundingOpportunity = z.infer<typeof fundingOpportunitySchema>;
