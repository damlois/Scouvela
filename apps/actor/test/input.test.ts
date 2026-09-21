import { describe, expect, it } from 'vitest';
import { actorInputSchema } from '@scouvela/shared';

describe('actor input validation', () => {
  it('requires mode and defaults maxResults to 5', () => {
    const parsed = actorInputSchema.parse({ mode: 'funding' });
    expect(parsed.maxResults).toBe(5);
  });

  it('trims user-provided strings', () => {
    const parsed = actorInputSchema.parse({
      mode: 'vendors',
      serviceCategory: '  tailoring  ',
      state: ' Lagos ',
    });
    expect(parsed.serviceCategory).toBe('tailoring');
    expect(parsed.state).toBe('Lagos');
  });

  it('rejects maxResults above 20', () => {
    const parsed = actorInputSchema.safeParse({ mode: 'funding', maxResults: 21 });
    expect(parsed.success).toBe(false);
  });

  it('requires vendor serviceCategory or query', () => {
    const parsed = actorInputSchema.safeParse({ mode: 'vendors', state: 'Lagos' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain('serviceCategory or query');
    }
  });
});
