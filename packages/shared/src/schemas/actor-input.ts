import { z } from 'zod';
import { ACTOR_DEFAULT_MAX_RESULTS, ACTOR_HARD_MAX_RESULTS, SEARCH_MODES } from '../constants.js';
import { fundingTypeSchema } from './funding.js';

export const searchModeSchema = z.enum(SEARCH_MODES, {
  errorMap: () => ({ message: 'mode must be "funding" or "vendors".' }),
});

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .optional();

export const actorInputSchema = z
  .object({
    mode: searchModeSchema,
    query: optionalTrimmed(200),
    businessCategory: optionalTrimmed(100),
    serviceCategory: optionalTrimmed(100),
    state: optionalTrimmed(100),
    locality: optionalTrimmed(100),
    fundingType: fundingTypeSchema.optional(),
    maxResults: z
      .number({ invalid_type_error: 'maxResults must be a whole number.' })
      .int()
      .min(1, 'maxResults must be at least 1.')
      .max(ACTOR_HARD_MAX_RESULTS, `maxResults cannot exceed ${ACTOR_HARD_MAX_RESULTS}.`)
      .default(ACTOR_DEFAULT_MAX_RESULTS),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'vendors' && !value.serviceCategory && !value.query) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vendor search requires serviceCategory or query.',
        path: ['serviceCategory'],
      });
    }
  });

export type ActorInput = z.input<typeof actorInputSchema>;
export type ParsedActorInput = z.output<typeof actorInputSchema>;
