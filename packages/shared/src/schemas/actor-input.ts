import { z } from 'zod';
import { DEFAULT_MAX_RESULTS, HARD_MAX_RESULTS, SEARCH_MODES } from '../constants.js';
import { fundingTypeSchema } from './funding.js';

export const searchModeSchema = z.enum(SEARCH_MODES);

export const actorInputSchema = z.object({
  mode: searchModeSchema,
  query: z.string().trim().min(1).max(200).optional(),
  businessCategory: z.string().trim().min(1).max(100).optional(),
  serviceCategory: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().min(1).max(100).optional(),
  locality: z.string().trim().min(1).max(100).optional(),
  fundingType: fundingTypeSchema.optional(),
  maxResults: z.number().int().min(1).max(HARD_MAX_RESULTS).default(DEFAULT_MAX_RESULTS),
});

export type ActorInput = z.input<typeof actorInputSchema>;
export type ParsedActorInput = z.output<typeof actorInputSchema>;
