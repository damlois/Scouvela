import { describe, expect, it } from 'vitest';
import { actorInputSchema } from '@scouvela/shared';
import { crawlSelectedSources } from '../src/crawlers/opportunity-crawler.js';
import { createRunStats } from '../src/utils/stats.js';

const liveEnabled = process.env.RUN_LIVE_CRAWL_TESTS === 'true';

describe.skipIf(!liveEnabled)('optional live smoke tests', () => {
  it('collects public opportunities from approved sources', async () => {
    process.env.SCOUVELA_BOI_SOURCE_APPROVED = 'true';
    process.env.SCOUVELA_TEF_SOURCE_APPROVED = 'true';
    process.env.SCOUVELA_GEA_SOURCE_APPROVED = 'true';
    process.env.SCOUVELA_KCIC_SOURCE_APPROVED = 'true';

    const input = actorInputSchema.parse({
      query: 'SME',
      countries: ['Nigeria', 'Ghana', 'Kenya'],
      maxResults: 5,
      includeExpired: true,
    });
    const stats = createRunStats();
    const records = await crawlSelectedSources(input, stats);
    expect(records.length).toBeGreaterThan(0);
    expect(stats.pagesVisited).toBeGreaterThan(0);
  }, 120_000);
});
