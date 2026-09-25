import { describe, expect, it } from 'vitest';
import { actorInputSchema } from '@scouvela/shared';
import { planSearchFromQuery } from '../src/input/planner.js';

describe('actor input validation', () => {
  it('defaults countries, maxResults and AI off', () => {
    const parsed = actorInputSchema.parse({});
    expect(parsed.maxResults).toBe(20);
    expect(parsed.countries).toEqual(['Nigeria', 'Ghana', 'Kenya']);
    expect(parsed.ai.enabled).toBe(false);
  });

  it('trims the query', () => {
    const parsed = actorInputSchema.parse({ query: '  SME  ' });
    expect(parsed.query).toBe('SME');
  });

  it('rejects maxResults above 50', () => {
    const parsed = actorInputSchema.safeParse({ maxResults: 51 });
    expect(parsed.success).toBe(false);
  });

  it('requires a secret key only when AI is enabled', () => {
    expect(actorInputSchema.safeParse({ ai: { enabled: true } }).success).toBe(false);
    expect(
      actorInputSchema.safeParse({ ai: { enabled: true }, openaiApiKey: 'sk-test' }).success,
    ).toBe(true);
  });
});

describe('rule-based query planner', () => {
  it('extracts types and target groups from a natural-language query', () => {
    const planned = planSearchFromQuery(
      actorInputSchema.parse({
        query: 'grants and accelerator programmes for women-owned fashion businesses',
        countries: ['Nigeria'],
      }),
    );

    expect(planned.opportunityTypes).toEqual(expect.arrayContaining(['grant', 'accelerator']));
    expect(planned.targetGroups).toEqual(expect.arrayContaining(['women-owned']));
    expect(planned.sectors).toEqual(expect.arrayContaining(['fashion']));
  });
});
