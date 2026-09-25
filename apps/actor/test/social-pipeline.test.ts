import { describe, expect, it } from 'vitest';
import { actorInputSchema, smeOpportunitySchema } from '@scouvela/shared';
import { detectOpportunity } from '../src/discovery/opportunity-detector.js';
import { discoverFromInput } from '../src/discovery/run-discovery.js';
import { transformSocialOpportunity } from '../src/discovery/social-opportunity-transformer.js';
import { parseInstagramHtml } from '../src/social/instagram/instagram-parser.js';
import type { PageFetch, SocialContent } from '../src/social/types.js';
import { finaliseOpportunities } from '../src/pipeline.js';
import { transformOpportunity } from '../src/transformers/opportunity-transformer.js';
import { createRunStats } from '../src/utils/stats.js';
import { dedupeOpportunities } from '../src/utils/opportunity-dedupe.js';
import { verifyOpportunity } from '../src/verification/opportunity-verifier.js';
import { readFixture } from './helpers.js';

const extractedAt = '2026-09-25T00:00:00.000Z';
const scrapedAt = '2026-09-25T00:00:00.000Z';

function contentFrom(name: string, contentType: SocialContent['contentType'] = 'social-post'): SocialContent {
  return parseInstagramHtml({
    html: readFixture(name),
    submittedUrl: 'https://www.instagram.com/p/AbCdEf/',
    httpStatus: 200,
    contentType,
    extractedAt,
  });
}

describe('opportunity detection', () => {
  it('ranks an application signal plus an SME signal strongly', () => {
    const candidate = detectOpportunity(contentFrom('instagram-post.html'));
    expect(candidate.isCandidate).toBe(true);
    expect(candidate.confidence).toBeGreaterThanOrEqual(45);
    expect(candidate.matchedSignals).toEqual(
      expect.arrayContaining(['applications are open', 'grant', 'sme']),
    );
  });

  it('accepts a TEF-style opportunity with apply, seed capital and entrepreneurs', () => {
    const candidate = detectOpportunity(contentFrom('instagram-tef-opportunity.html'));
    expect(candidate.isCandidate).toBe(true);
    expect(candidate.matchedSignals).toEqual(
      expect.arrayContaining(['apply', 'seed capital', 'entrepreneurs']),
    );
  });

  it('accepts apply plus seed capital plus entrepreneurs in plain text', () => {
    const candidate = detectOpportunity({
      ...contentFrom('instagram-partial.html'),
      caption: 'Apply now for seed capital available to African entrepreneurs.',
      visibleText: 'Apply now for seed capital available to African entrepreneurs.',
      extractionStatus: 'complete',
    });
    expect(candidate.isCandidate).toBe(true);
  });

  it('rejects entrepreneurs alone and mentorship alone', () => {
    const entrepreneursOnly = detectOpportunity({
      ...contentFrom('instagram-partial.html'),
      caption: 'Congratulations to our entrepreneurs this week.',
      visibleText: 'Congratulations to our entrepreneurs this week.',
      extractionStatus: 'complete',
    });
    expect(entrepreneursOnly.isCandidate).toBe(false);

    const mentorshipOnly = detectOpportunity({
      ...contentFrom('instagram-partial.html'),
      caption: 'Our mentorship circles meet every Friday.',
      visibleText: 'Our mentorship circles meet every Friday.',
      extractionStatus: 'complete',
    });
    expect(mentorshipOnly.isCandidate).toBe(false);
  });

  it('rejects a stakeholder roundtable post', () => {
    const candidate = detectOpportunity(contentFrom('instagram-tef-stakeholder.html'));
    expect(candidate.isCandidate).toBe(false);
  });

  it('rejects an ordinary promotional post', () => {
    const candidate = detectOpportunity(contentFrom('instagram-promo.html'));
    expect(candidate.isCandidate).toBe(false);
    expect(candidate.negativeSignals).toContain('shop now');
  });

  it('rejects a lifestyle post and a hashtag-only post', () => {
    const lifestyle = detectOpportunity({
      ...contentFrom('instagram-partial.html'),
      caption: 'Happy birthday from our team dinner.',
      extractionStatus: 'complete',
    });
    expect(lifestyle.isCandidate).toBe(false);

    const hashtagsOnly = detectOpportunity({
      ...contentFrom('instagram-partial.html'),
      caption: '#SME #grant',
      hashtags: ['#SME', '#grant'],
      extractionStatus: 'complete',
    });
    expect(hashtagsOnly.isCandidate).toBe(false);
  });
});

describe('deterministic social extraction', () => {
  it('extracts explicit fields and ignores engagement counts', () => {
    const candidate = detectOpportunity({
      ...contentFrom('instagram-post.html'),
      caption: `${contentFrom('instagram-post.html').caption} 2,431 likes. 88 comments.`,
    });
    const input = actorInputSchema.parse({ countries: ['Nigeria'], sourceTypes: ['instagram'] });
    const raw = transformSocialOpportunity(candidate, input, 'https://www.instagram.com/p/AbCdEf/?utm_source=copy');
    const saved = raw ? transformOpportunity(raw, scrapedAt) : null;

    expect(saved?.provider).toBe('Bank of Industry');
    expect(saved?.opportunityType).toBe('grant');
    expect(saved?.countries).toContain('Nigeria');
    expect(saved?.deadlineText).toMatch(/30 September 2026/);
    expect(saved?.deadline).toBe('2026-09-30');
    expect(saved?.applicationUrl).toContain('https://www.boi.ng/product/sme-grant');
    expect(saved?.originalContentUrl).toContain('instagram.com/p/AbCdEf');
    expect(saved?.fundingAmount).toBeUndefined();
    expect(saved?.sourcePlatform).toBe('instagram');
  });

  it('does not invent a year for an ambiguous deadline', () => {
    const caption =
      'Applications are open for an SME grant. Eligibility: registered businesses. Deadline: 15 March. https://www.boi.ng/apply';
    const candidate = detectOpportunity({
      ...contentFrom('instagram-post.html'),
      caption,
      visibleText: caption,
      externalLinks: ['https://www.boi.ng/apply'],
    });
    const raw = transformSocialOpportunity(
      candidate,
      actorInputSchema.parse({ countries: ['Nigeria'], sourceTypes: ['instagram'] }),
      'https://www.instagram.com/p/AbCdEf/',
    );
    expect(raw?.deadlineText).toMatch(/15 March/);
    expect(raw?.deadline).toBeUndefined();
  });

  it('infers funding for seed capital with training and mentorship', () => {
    const caption =
      'Apply now for non-refundable seed capital with business training and mentorship for African entrepreneurs.';
    const candidate = detectOpportunity({
      ...contentFrom('instagram-partial.html'),
      caption,
      visibleText: caption,
      accountName: 'Tony Elumelu Foundation',
      accountHandle: 'tonyelumelufoundation',
      extractionStatus: 'complete',
    });
    const raw = transformSocialOpportunity(
      candidate,
      actorInputSchema.parse({ countries: ['Nigeria'], sourceTypes: ['instagram'] }),
      'https://www.instagram.com/p/AbCdEf/',
    );
    expect(raw?.opportunityType).toBe('grant');
    expect(raw?.countries).toEqual(['Africa-wide']);
  });
});

describe('verification scoring', () => {
  it('marks a fetched application page as verified', () => {
    const result = verifyOpportunity({
      applicationUrl: 'https://www.boi.ng/product/sme-grant',
      deadline: '2026-09-30',
      provider: 'Bank of Industry',
      eligibilityCount: 1,
      benefitsCount: 1,
      curatedWebsite: true,
      applicationPageConfirmed: true,
    });
    expect(result.status).toBe('verified-application-page');
    expect(result.score).toBeGreaterThan(50);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('marks a reviewed provider domain with an application URL as verified', () => {
    const result = verifyOpportunity({
      provider: 'Tony Elumelu Foundation',
      applicationUrl: 'https://www.tefconnect.com/',
      deadline: '2026-03-01',
      eligibilityCount: 0,
      benefitsCount: 1,
      curatedWebsite: false,
      reviewedProviderDomain: true,
      applicationPageConfirmed: false,
    });
    expect(result.status).toBe('verified-application-page');
    expect(result.reasons.join(' ')).toMatch(/official provider domain|application/i);
  });

  it('marks a matching public account without an application page as an official source', () => {
    const result = verifyOpportunity({
      provider: 'Bank of Industry',
      accountName: 'Bank of Industry',
      applicationProcess: 'Apply on the provider website',
      eligibilityCount: 0,
      benefitsCount: 0,
      curatedWebsite: false,
      applicationPageConfirmed: false,
    });
    expect(result.status).toBe('official-source');
  });

  it('marks a possible repost as unverified and a post without an application method as incomplete', () => {
    const repost = verifyOpportunity({
      provider: 'Someone else',
      accountName: 'Reposter',
      applicationUrl: 'https://example.org/apply',
      text: 'Repost: applications are open for SMEs',
      eligibilityCount: 0,
      benefitsCount: 0,
      curatedWebsite: false,
      applicationPageConfirmed: false,
    });
    expect(repost.status).toBe('unverified');
    expect(repost.warnings.join(' ')).toMatch(/repost/i);

    const incomplete = verifyOpportunity({
      provider: 'Example Org',
      accountName: 'Example Org',
      eligibilityCount: 0,
      benefitsCount: 0,
      curatedWebsite: false,
      applicationPageConfirmed: false,
    });
    expect(incomplete.status).toBe('incomplete');
  });
});

describe('cross-source deduplication', () => {
  it('keeps one record and preserves both source URLs', () => {
    const website = transformOpportunity(
      {
        title: 'SME working-capital grant',
        provider: 'Bank of Industry',
        opportunityType: 'grant',
        description: 'Applications are open for registered Nigerian SMEs.',
        countries: ['Nigeria'],
        sourceUrl: 'https://www.boi.ng/product/sme-grant/',
        sourceName: 'Bank of Industry',
        applicationUrl: 'https://www.boi.ng/product/sme-grant/',
        deadline: '2026-09-30',
        sourcePlatform: 'website',
        applicationPageConfirmed: true,
      },
      scrapedAt,
    );
    const social = transformOpportunity(
      {
        title: 'SME working-capital grant',
        provider: 'Bank of Industry',
        opportunityType: 'grant',
        description: 'Applications are open for registered Nigerian SMEs. Eligibility: registered SMEs.',
        countries: ['Nigeria'],
        sourceUrl: 'https://www.instagram.com/p/AbCdEf/',
        sourceName: 'Bank of Industry',
        deadline: '2026-09-30',
        sourcePlatform: 'instagram',
        contentType: 'social-post',
        originalContentUrl: 'https://www.instagram.com/p/AbCdEf/',
        accountName: 'Bank of Industry',
        curatedSource: false,
      },
      scrapedAt,
    );

    expect(website && social).toBeTruthy();
    const { unique, duplicatesRemoved } = dedupeOpportunities([social!, website!]);
    expect(duplicatesRemoved).toBe(1);
    expect(unique).toHaveLength(1);
    expect(unique[0]?.applicationUrl).toContain('boi.ng');
    expect(unique[0]?.verification.status).toBe('verified-application-page');
    expect(unique[0]?.discoveredFrom?.join(' ')).toContain('instagram.com');
    expect(unique[0]?.discoveredFrom?.join(' ')).toContain('boi.ng');
  });
});

describe('submitted URL failures stay isolated', () => {
  it('continues after one blocked Instagram page', async () => {
    const fetchPage: PageFetch = async (url) => {
      if (url.includes('Blocked')) {
        return { ok: true, status: 200, html: readFixture('instagram-blocked.html'), finalUrl: url };
      }

      return { ok: true, status: 200, html: readFixture('instagram-post.html'), finalUrl: url };
    };
    const stats = createRunStats();
    const input = actorInputSchema.parse({
      sourceTypes: ['instagram'],
      countries: ['Nigeria'],
      ai: { enabled: false },
      startUrls: [
        { url: 'https://www.instagram.com/p/Blocked1/' },
        { url: 'https://www.instagram.com/p/AbCdEf/' },
      ],
    });

    const records = await discoverFromInput(input, stats, fetchPage);
    expect(stats.socialPagesBlocked).toBe(1);
    expect(records.length).toBe(1);
    expect(stats.socialPagesUnavailable).toBe(0);
    expect(stats.instagramUrlsAttempted).toBe(2);
    expect(stats.candidatesDetected).toBe(1);
    expect(stats.recordsExtracted).toBe(1);
  });

  it('keeps AI disabled and does not save a promotional post', async () => {
    const fetchPage: PageFetch = async (url) => ({
      ok: true,
      status: 200,
      html: readFixture('instagram-promo.html'),
      finalUrl: url,
    });
    const stats = createRunStats();
    const records = await discoverFromInput(
      actorInputSchema.parse({
        sourceTypes: ['instagram'],
        countries: ['Nigeria'],
        ai: { enabled: false },
        startUrls: [{ url: 'https://www.instagram.com/p/Promo123/' }],
      }),
      stats,
      fetchPage,
    );

    expect(records).toHaveLength(0);
    expect(stats.nonOpportunityContentSkipped).toBe(1);
    expect(stats.aiResultsGenerated).toBe(0);
    expect(stats.ppeEventsCharged).toBe(0);
  });

  it('filters an expired Instagram opportunity while counting the candidate', async () => {
    const fetchPage: PageFetch = async (url) => ({
      ok: true,
      status: 200,
      html: readFixture('instagram-tef-opportunity.html'),
      finalUrl: url,
    });
    const inputBase = {
      sourceTypes: ['instagram'] as const,
      countries: ['Nigeria'],
      ai: { enabled: false },
      startUrls: [{ url: 'https://www.instagram.com/p/DVTz2EjjGOO/' }],
    };

    const keptStats = createRunStats();
    const keptRaw = await discoverFromInput(
      actorInputSchema.parse({ ...inputBase, includeExpired: true }),
      keptStats,
      fetchPage,
    );
    const kept = finaliseOpportunities(
      keptRaw,
      actorInputSchema.parse({ ...inputBase, includeExpired: true }),
      scrapedAt,
      keptStats,
    );
    expect(keptStats.candidatesDetected).toBe(1);
    expect(kept).toHaveLength(1);
    expect(kept[0]?.applicationUrl).toContain('tefconnect.com');
    expect(keptRaw[0]?.accountHandle).toBe('tonyelumelufoundation');
    expect(keptRaw[0]?.accountHandle).not.toBe('blog');

    const filteredStats = createRunStats();
    const filteredRaw = await discoverFromInput(
      actorInputSchema.parse({ ...inputBase, includeExpired: false }),
      filteredStats,
      fetchPage,
    );
    const filtered = finaliseOpportunities(
      filteredRaw,
      actorInputSchema.parse({ ...inputBase, includeExpired: false }),
      scrapedAt,
      filteredStats,
    );
    expect(filteredStats.candidatesDetected).toBe(1);
    expect(filteredStats.recordsNormalized).toBe(1);
    expect(filteredStats.recordsFilteredExpired).toBe(1);
    expect(filtered).toHaveLength(0);
  });
});

describe('social schema validation', () => {
  it('accepts the new input fields and rejects unsafe limits', () => {
    const parsed = actorInputSchema.parse({});
    expect(parsed.sourceTypes).toEqual(['curated-websites']);
    expect(parsed.discoverFromProfiles).toBe(false);
    expect(parsed.maxPostsPerProfile).toBe(5);

    expect(actorInputSchema.safeParse({ maxPostsPerProfile: 0 }).success).toBe(false);
    expect(actorInputSchema.safeParse({ maxPostsPerProfile: 11 }).success).toBe(false);
    expect(
      actorInputSchema.safeParse({
        startUrls: Array.from({ length: 21 }, (_, index) => ({ url: `https://example.org/${index}` })),
      }).success,
    ).toBe(false);
  });

  it('accepts a social opportunity and defaults website records', () => {
    const website = smeOpportunitySchema.parse({
      id: 'opp-1',
      title: 'Women Enterprise Growth Programme',
      provider: 'Example Foundation',
      opportunityType: 'accelerator',
      description: 'A growth programme for women-owned SMEs.',
      countries: ['Nigeria'],
      sourceUrl: 'https://example.org/programme',
      sourceName: 'Example Foundation',
      status: 'active',
      scrapedAt,
      confidence: 'high',
    });
    expect(website.sourcePlatform).toBe('website');
    expect(website.verification.status).toBe('unverified');
    expect(website.ai).toBeNull();

    const saved = transformOpportunity(
      {
        title: 'SME grant',
        provider: 'Bank of Industry',
        description: 'Applications are open for Nigerian SMEs.',
        countries: ['Nigeria'],
        sourceUrl: 'https://www.boi.ng/product/sme-grant/',
        sourceName: 'Bank of Industry',
        sourcePlatform: 'website',
      },
      scrapedAt,
    );
    expect(smeOpportunitySchema.safeParse(saved).success).toBe(true);
    expect(saved?.sourcePlatform).toBe('website');
  });

  it('still finalises curated website records when AI is off', () => {
    const stats = createRunStats();
    const saved = finaliseOpportunities(
      [
        {
          title: 'SME Working Capital Loan',
          provider: 'Bank of Industry',
          opportunityType: 'loan',
          description: 'Working-capital finance for registered Nigerian SMEs.',
          countries: ['Nigeria'],
          sourceUrl: 'https://www.boi.ng/product/sme-working-capital-loan/',
          sourceName: 'Bank of Industry',
          applicationsOpen: true,
        },
      ],
      actorInputSchema.parse({ countries: ['Nigeria'], ai: { enabled: false } }),
      scrapedAt,
      stats,
    );

    expect(saved).toHaveLength(1);
    expect(saved[0]?.sourcePlatform).toBe('website');
    expect(saved[0]?.ai).toBeNull();
    expect(saved[0]?.verification.reasons.length).toBeGreaterThan(0);
  });
});
