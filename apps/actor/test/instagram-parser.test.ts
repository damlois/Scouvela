import { describe, expect, it } from 'vitest';
import { instagramAdapter } from '../src/social/instagram/instagram-adapter.js';
import { parseInstagramHtml, readProfilePostUrls } from '../src/social/instagram/instagram-parser.js';
import type { PageFetch } from '../src/social/types.js';
import { readFixture } from './helpers.js';

const extractedAt = '2026-09-25T00:00:00.000Z';

describe('Instagram HTML parsing', () => {
  it('reads a public post from metadata', () => {
    const content = parseInstagramHtml({
      html: readFixture('instagram-post.html'),
      submittedUrl: 'https://www.instagram.com/p/AbCdEf/?utm_source=copy',
      httpStatus: 200,
      contentType: 'social-post',
      extractedAt,
    });

    expect(content.extractionStatus).toBe('complete');
    expect(content.accountName).toBe('Bank of Industry');
    expect(content.accountHandle).toBe('bankofindustry');
    expect(content.caption).toContain('SME working-capital grant');
    expect(content.publishedAt).toBe('2026-09-01T00:00:00.000Z');
    expect(content.hashtags).toContain('#SMEGrant');
    expect(content.externalLinks).toContain('https://www.boi.ng/product/sme-grant');
    expect(content.thumbnailUrl).toBe('https://example.com/thumb.jpg');
    expect(content.sourceUrl).toBe('https://www.instagram.com/p/AbCdEf');
  });

  it('reads a public reel', () => {
    const content = parseInstagramHtml({
      html: readFixture('instagram-reel.html'),
      submittedUrl: 'https://www.instagram.com/reel/ReEl123/',
      httpStatus: 200,
      contentType: 'social-reel',
      extractedAt,
    });

    expect(content.contentType).toBe('social-reel');
    expect(content.caption).toContain('training programme');
    expect(content.externalLinks[0]).toContain('gea.gov.gh');
  });

  it('marks a page with missing caption data as partial', () => {
    const content = parseInstagramHtml({
      html: readFixture('instagram-partial.html'),
      submittedUrl: 'https://www.instagram.com/p/Partial1/',
      httpStatus: 200,
      contentType: 'social-post',
      extractedAt,
    });

    expect(content.extractionStatus).toBe('partial');
    expect(content.caption).toBeUndefined();
    expect(content.sourceUrl).toBe('https://www.instagram.com/p/Partial1/');
  });

  it('returns a blocked result without inventing a caption', () => {
    const content = parseInstagramHtml({
      html: readFixture('instagram-blocked.html'),
      submittedUrl: 'https://www.instagram.com/p/Blocked1/',
      httpStatus: 200,
      contentType: 'social-post',
      extractedAt,
    });

    expect(content.extractionStatus).toBe('blocked');
    expect(content.caption).toBeUndefined();
    expect(content.extractionWarnings.join(' ')).toMatch(/login|CAPTCHA/i);
  });

  it('returns an unavailable result for a missing page', () => {
    const content = parseInstagramHtml({
      html: readFixture('instagram-unavailable.html'),
      submittedUrl: 'https://www.instagram.com/p/Missing1/',
      httpStatus: 404,
      contentType: 'social-post',
      extractedAt,
    });

    expect(content.extractionStatus).toBe('unavailable');
    expect(content.sourceUrl).toContain('/p/Missing1');
  });

  it('lists a limited set of public profile post links', () => {
    const links = readProfilePostUrls(
      readFixture('instagram-profile.html'),
      'https://www.instagram.com/example_organisation/',
    );
    expect(links).toEqual([
      'https://www.instagram.com/p/PostOne',
      'https://www.instagram.com/reel/ReelOne',
    ]);
  });

  it('keeps caption domains and ignores footer blog handles', () => {
    const content = parseInstagramHtml({
      html: readFixture('instagram-tef-opportunity.html'),
      submittedUrl: 'https://www.instagram.com/p/DVTz2EjjGOO/',
      httpStatus: 200,
      contentType: 'social-post',
      extractedAt,
    });

    expect(content.accountHandle).toBe('tonyelumelufoundation');
    expect(content.accountHandle).not.toBe('blog');
    expect(content.externalLinks.some((link) => link.includes('tefconnect.com'))).toBe(true);
    expect(content.externalLinks.join(' ')).not.toMatch(/about\.meta\.com|about\.instagram\.com/);
  });

  it('normalizes uppercase www domains with trailing punctuation', () => {
    const content = parseInstagramHtml({
      html: `<html><head>
        <meta property="og:title" content="Example Org on Instagram" />
        <meta property="og:description" content="Apply via www.ExampleOrg.COM/apply! #SME" />
        <meta property="og:url" content="https://www.instagram.com/p/LinkTest/" />
      </head><body>
        <footer><a href="https://about.instagram.com/blog">Blog</a></footer>
      </body></html>`,
      submittedUrl: 'https://www.instagram.com/p/LinkTest/',
      httpStatus: 200,
      contentType: 'social-post',
      extractedAt,
    });

    expect(content.externalLinks).toContain('https://www.exampleorg.com/apply');
    expect(content.accountHandle).toBeUndefined();
  });
});

describe('Instagram adapter', () => {
  it('fetches recent public profile posts only when that option is enabled', async () => {
    const calls: string[] = [];
    const fetchPage: PageFetch = async (url) => {
      calls.push(url);
      if (url.includes('/example_organisation')) {
        return { ok: true, status: 200, html: readFixture('instagram-profile.html'), finalUrl: url };
      }

      return { ok: true, status: 200, html: readFixture('instagram-post.html'), finalUrl: url };
    };

    const limited = await instagramAdapter.extract(
      {
        platform: 'instagram',
        contentType: 'social-profile',
        url: 'https://www.instagram.com/example_organisation',
      },
      { discoverFromProfiles: true, maxPostsPerProfile: 1, fetchPage, extractedAt },
    );
    expect(limited).toHaveLength(2);
    expect(calls).toHaveLength(2);

    calls.length = 0;
    const profileOnly = await instagramAdapter.extract(
      {
        platform: 'instagram',
        contentType: 'social-profile',
        url: 'https://www.instagram.com/example_organisation',
      },
      { discoverFromProfiles: false, maxPostsPerProfile: 5, fetchPage, extractedAt },
    );
    expect(profileOnly).toHaveLength(1);
    expect(calls).toHaveLength(1);
  });
});
