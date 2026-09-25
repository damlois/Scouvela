import { describe, expect, it } from 'vitest';
import { detectSource } from '../src/social/platform-detector.js';

describe('platform detection', () => {
  it('detects an Instagram post URL', () => {
    expect(detectSource('https://www.instagram.com/p/AbCdEf/')).toMatchObject({
      platform: 'instagram',
      contentType: 'social-post',
    });
    expect(detectSource('https://instagram.com/p/AbCdEf')).toMatchObject({
      platform: 'instagram',
      contentType: 'social-post',
    });
  });

  it('detects Instagram reel URLs', () => {
    expect(detectSource('https://www.instagram.com/reel/ReEl123/')).toMatchObject({
      platform: 'instagram',
      contentType: 'social-reel',
    });
    expect(detectSource('https://instagram.com/reels/ReEl123/')).toMatchObject({
      platform: 'instagram',
      contentType: 'social-reel',
    });
  });

  it('detects a public Instagram profile URL', () => {
    expect(detectSource('https://www.instagram.com/example_organisation/')).toMatchObject({
      platform: 'instagram',
      contentType: 'social-profile',
    });
  });

  it('detects an ordinary public website', () => {
    const detected = detectSource('https://example.org/opportunity');
    expect(detected).toMatchObject({ platform: 'website', contentType: 'webpage' });
  });

  it('does not treat the word instagram in another host as Instagram', () => {
    expect(detectSource('https://example.org/blog/instagram-tips')).toMatchObject({
      platform: 'website',
      contentType: 'webpage',
    });
  });

  it('leaves unsupported schemes and reserved Instagram paths unsupported', () => {
    expect(detectSource('javascript:alert(1)').platform).toBe('unsupported');
    expect(detectSource('https://www.instagram.com/explore/').platform).toBe('unsupported');
  });
});
