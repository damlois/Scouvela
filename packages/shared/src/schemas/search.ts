import { z } from 'zod';
import { DEFAULT_MAX_RESULTS, HARD_MAX_RESULTS } from '../constants.js';
import { fundingOpportunitySchema, fundingTypeSchema } from './funding.js';
import { vendorSchema } from './vendor.js';

const optionalQuery = z.string().trim().min(1).max(200).optional();
const optionalPlace = z.string().trim().min(1).max(100).optional();
const maxResultsField = z.coerce.number().int().min(1).max(HARD_MAX_RESULTS).default(DEFAULT_MAX_RESULTS);

export const fundingSearchRequestSchema = z.object({
  mode: z.literal('funding'),
  query: optionalQuery,
  businessCategory: optionalPlace,
  state: optionalPlace,
  locality: optionalPlace,
  fundingType: fundingTypeSchema.optional(),
  maxResults: maxResultsField,
});

export const vendorSearchRequestSchema = z.object({
  mode: z.literal('vendors'),
  query: optionalQuery,
  serviceCategory: optionalPlace,
  state: optionalPlace,
  locality: optionalPlace,
  maxResults: maxResultsField,
});

export const searchRequestSchema = z.discriminatedUnion('mode', [
  fundingSearchRequestSchema,
  vendorSearchRequestSchema,
]);

export const searchMetaSchema = z.object({
  resultCount: z.number().int().min(0),
  usedMockData: z.boolean(),
  source: z.enum(['mock', 'apify']),
});

export const fundingSearchResponseSchema = z.object({
  mode: z.literal('funding'),
  results: z.array(fundingOpportunitySchema),
  meta: searchMetaSchema,
});

export const vendorSearchResponseSchema = z.object({
  mode: z.literal('vendors'),
  results: z.array(vendorSchema),
  meta: searchMetaSchema,
});

export const searchResponseSchema = z.discriminatedUnion('mode', [
  fundingSearchResponseSchema,
  vendorSearchResponseSchema,
]);

export type FundingSearchRequest = z.input<typeof fundingSearchRequestSchema>;
export type VendorSearchRequest = z.input<typeof vendorSearchRequestSchema>;
export type SearchRequest = z.input<typeof searchRequestSchema>;
export type ParsedSearchRequest = z.output<typeof searchRequestSchema>;
export type SearchMeta = z.infer<typeof searchMetaSchema>;
export type FundingSearchResponse = z.infer<typeof fundingSearchResponseSchema>;
export type VendorSearchResponse = z.infer<typeof vendorSearchResponseSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
