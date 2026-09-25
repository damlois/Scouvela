import { z } from 'zod';
import {
  BUSINESS_STAGES,
  OPPORTUNITY_CONFIDENCE,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_TYPES,
  PROVIDER_TYPES,
  TARGET_GROUPS,
} from '../constants.js';

export const opportunityTypeSchema = z.enum(OPPORTUNITY_TYPES);
export const opportunityStatusSchema = z.enum(OPPORTUNITY_STATUSES);
export const opportunityConfidenceSchema = z.enum(OPPORTUNITY_CONFIDENCE);
export const providerTypeSchema = z.enum(PROVIDER_TYPES);
export const targetGroupSchema = z.enum(TARGET_GROUPS);
export const businessStageSchema = z.enum(BUSINESS_STAGES);

export const fundingAmountSchema = z.object({
  currency: z.string().min(1).max(8).optional(),
  minimum: z.number().nonnegative().nullable().optional(),
  maximum: z.number().nonnegative().nullable().optional(),
  displayText: z.string().min(1).max(200),
});

export const opportunityAiSchema = z.object({
  summary: z.string().min(1).max(500),
  matchScore: z.number().int().min(0).max(100).optional(),
  matchLevel: z.enum(['strong', 'moderate', 'weak']).optional(),
  matchReasons: z.array(z.string().min(1).max(200)).max(8).optional(),
  missingInformation: z.array(z.string().min(1).max(200)).max(8).optional(),
  warnings: z.array(z.string().min(1).max(200)).max(8).optional(),
  generatedAt: z.string().datetime({ offset: true }),
  model: z.string().min(1).max(80),
});

export const smeOpportunitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(300),
  provider: z.string().min(1).max(200),
  providerType: providerTypeSchema.optional(),
  opportunityType: opportunityTypeSchema,
  description: z.string().min(1).max(4000),
  countries: z.array(z.string().min(1).max(80)).min(1).max(20),
  regions: z.array(z.string().min(1).max(80)).max(20).optional(),
  sectors: z.array(z.string().min(1).max(80)).max(20).optional(),
  targetGroups: z.array(targetGroupSchema).max(20).optional(),
  businessStages: z.array(businessStageSchema).max(10).optional(),
  benefits: z.array(z.string().min(1).max(200)).max(20).optional(),
  fundingAmount: fundingAmountSchema.optional(),
  eligibility: z.array(z.string().min(1).max(300)).max(20).optional(),
  applicationProcess: z.string().min(1).max(1000).optional(),
  applicationUrl: z.string().url().optional(),
  sourceUrl: z.string().url(),
  sourceName: z.string().min(1).max(200),
  publishedAt: z.string().min(1).max(50).optional(),
  deadline: z.string().min(1).max(50).optional(),
  status: opportunityStatusSchema,
  isRemote: z.boolean().optional(),
  language: z.string().min(1).max(40).optional(),
  scrapedAt: z.string().datetime({ offset: true }),
  confidence: opportunityConfidenceSchema,
  ai: opportunityAiSchema.nullable().default(null),
});

export type OpportunityType = z.infer<typeof opportunityTypeSchema>;
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;
export type OpportunityConfidence = z.infer<typeof opportunityConfidenceSchema>;
export type ProviderType = z.infer<typeof providerTypeSchema>;
export type TargetGroup = z.infer<typeof targetGroupSchema>;
export type BusinessStage = z.infer<typeof businessStageSchema>;
export type FundingAmount = z.infer<typeof fundingAmountSchema>;
export type OpportunityAi = z.infer<typeof opportunityAiSchema>;
export type SmeOpportunity = z.infer<typeof smeOpportunitySchema>;
