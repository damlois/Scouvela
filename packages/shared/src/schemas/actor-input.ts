import { z } from 'zod';
import {
  ACTOR_DEFAULT_MAX_RESULTS,
  ACTOR_HARD_MAX_RESULTS,
  AI_PROVIDERS,
  BUSINESS_STAGES,
  DEFAULT_OPENAI_MODEL,
  MVP_COUNTRIES,
  SEARCH_COUNTRIES,
  TARGET_GROUPS,
} from '../constants.js';
import { opportunityTypeSchema } from './opportunity.js';

function blankToUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const optionalTrimmed = (max: number) =>
  z.preprocess(blankToUndefined, z.string().min(1).max(max).optional());

const stringList = (maxItems: number, maxLength: number) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems).optional();

export const countrySchema = z.enum(SEARCH_COUNTRIES);
export const aiProviderSchema = z.enum(AI_PROVIDERS);

export const actorAiInputSchema = z.object({
  enabled: z.boolean().default(false),
  provider: aiProviderSchema.default('openai'),
  model: z.string().trim().min(1).max(80).default(DEFAULT_OPENAI_MODEL),
  apiKey: z.preprocess(blankToUndefined, z.string().min(1).max(200).optional()),
  generateReport: z.boolean().default(false),
});

export const actorInputSchema = z
  .object({
    query: optionalTrimmed(300),
    countries: z.array(countrySchema).min(1).max(10).default([...MVP_COUNTRIES.slice(0, 3)]),
    regions: stringList(10, 80),
    opportunityTypes: z.array(opportunityTypeSchema).max(20).optional(),
    sectors: stringList(20, 80),
    targetGroups: z.array(z.enum(TARGET_GROUPS)).max(20).optional(),
    businessStages: z.array(z.enum(BUSINESS_STAGES)).max(10).optional(),
    organisationTypes: stringList(10, 80),
    includeExpired: z.boolean().default(false),
    closingWithinDays: z.number().int().min(1).max(365).optional(),
    publishedWithinDays: z.number().int().min(1).max(3650).optional(),
    requireDeadline: z.boolean().default(false),
    requireApplicationUrl: z.boolean().default(false),
    openaiApiKey: z.preprocess(blankToUndefined, z.string().min(1).max(200).optional()),
    maxResults: z
      .number({ invalid_type_error: 'maxResults must be a whole number.' })
      .int()
      .min(1, 'maxResults must be at least 1.')
      .max(ACTOR_HARD_MAX_RESULTS, `maxResults cannot exceed ${ACTOR_HARD_MAX_RESULTS}.`)
      .default(ACTOR_DEFAULT_MAX_RESULTS),
    ai: actorAiInputSchema.default({ enabled: false }),
  })
  .superRefine((value, ctx) => {
    if (value.ai.enabled && !value.ai.apiKey && !value.openaiApiKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AI enrichment requires the secret openaiApiKey field.',
        path: ['openaiApiKey'],
      });
    }
  });

export type ActorAiInput = z.input<typeof actorAiInputSchema>;
export type ParsedActorAiInput = z.output<typeof actorAiInputSchema>;
export type ActorInput = z.input<typeof actorInputSchema>;
export type ParsedActorInput = z.output<typeof actorInputSchema>;
