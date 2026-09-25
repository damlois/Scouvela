import { describe, expect, it } from 'vitest';
import { instagramAdapter } from '../src/social/instagram/instagram-adapter.js';

const liveEnabled = process.env.RUN_LIVE_INSTAGRAM_TESTS === 'true';

describe.skipIf(!liveEnabled)('optional live Instagram smoke test', () => {
  it('requests one public Instagram page without login', async () => {
    const [content] = await instagramAdapter.extract(
      {
        platform: 'instagram',
        contentType: 'social-profile',
        url: 'https://www.instagram.com/instagram/',
      },
      { discoverFromProfiles: false, maxPostsPerProfile: 1 },
    );

    expect(content?.platform).toBe('instagram');
    expect(['complete', 'partial', 'blocked', 'unavailable']).toContain(content?.extractionStatus);
  }, 30_000);
});
