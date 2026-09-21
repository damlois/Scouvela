import { describe, expect, it } from 'vitest';
import { actorInputSchema } from '@scouvela/shared';
import { runFundingCrawler } from '../src/crawlers/funding-crawler.js';
import { runVendorCrawler } from '../src/crawlers/vendor-crawler.js';
import { createRunStats } from '../src/utils/stats.js';

const liveEnabled = process.env.RUN_LIVE_CRAWL_TESTS === 'true';

describe.skipIf(!liveEnabled)('optional live smoke tests', () => {
  it('collects at most 3 public BOI product records when approved', async () => {
    process.env.SCOUVELA_FUNDING_SOURCE_APPROVED = 'true';
    const input = actorInputSchema.parse({ mode: 'funding', query: 'SME', maxResults: 3 });
    const stats = createRunStats('funding', 'Bank of Industry');
    const records = await runFundingCrawler(input, stats);
    expect(records.length).toBeLessThanOrEqual(3);
    expect(stats.pagesVisited).toBeGreaterThan(0);
  }, 60_000);

  it('collects at most 3 public Finelib listings when approved', async () => {
    process.env.SCOUVELA_VENDOR_SOURCE_APPROVED = 'true';
    const input = actorInputSchema.parse({
      mode: 'vendors',
      serviceCategory: 'tailoring',
      state: 'Lagos',
      locality: 'Ikeja',
      maxResults: 3,
    });
    const stats = createRunStats('vendors', 'Finelib.com');
    const records = await runVendorCrawler(input, stats);
    expect(records.length).toBeLessThanOrEqual(3);
  }, 60_000);
});
