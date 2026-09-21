import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const envSchema = z
  .object({
    USE_MOCK_DATA: z.enum(['true', 'false']).default('true'),
    APIFY_TOKEN: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    APIFY_ACTOR_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    ACTOR_RUN_TIMEOUT_SECONDS: z.coerce.number().int().positive().max(300).default(180),
  })
  .superRefine((value, ctx) => {
    if (value.USE_MOCK_DATA === 'false') {
      if (!value.APIFY_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['APIFY_TOKEN'],
          message: 'APIFY_TOKEN is required when USE_MOCK_DATA=false.',
        });
      }

      if (!value.APIFY_ACTOR_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['APIFY_ACTOR_ID'],
          message: 'APIFY_ACTOR_ID is required when USE_MOCK_DATA=false.',
        });
      }
    }
  });

export type ServerEnv = {
  useMockData: boolean;
  apifyToken?: string;
  apifyActorId?: string;
  actorRunTimeoutSeconds: number;
};

export function getServerEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = envSchema.safeParse({
    USE_MOCK_DATA: source.USE_MOCK_DATA,
    APIFY_TOKEN: source.APIFY_TOKEN,
    APIFY_ACTOR_ID: source.APIFY_ACTOR_ID,
    ACTOR_RUN_TIMEOUT_SECONDS: source.ACTOR_RUN_TIMEOUT_SECONDS,
  });

  if (!parsed.success) {
    throw new Error('Server environment variables are invalid.');
  }

  return {
    useMockData: parsed.data.USE_MOCK_DATA === 'true',
    apifyToken: parsed.data.APIFY_TOKEN,
    apifyActorId: parsed.data.APIFY_ACTOR_ID,
    actorRunTimeoutSeconds: parsed.data.ACTOR_RUN_TIMEOUT_SECONDS,
  };
}
