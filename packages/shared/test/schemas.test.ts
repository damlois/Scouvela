import { describe, expect, it } from 'vitest';
import {
  actorInputSchema,
  apiErrorSchema,
  fundingOpportunitySchema,
  searchRequestSchema,
  searchResponseSchema,
  smeOpportunitySchema,
  vendorSchema,
} from '../src/index.js';

const discoveredAt = '2026-09-21T08:00:00.000Z';

describe('fundingOpportunitySchema', () => {
  it('accepts a complete public funding record', () => {
    const result = fundingOpportunitySchema.safeParse({
      id: 'funding-boi-msme',
      kind: 'funding',
      title: 'BOI MSME Loan',
      provider: 'Bank of Industry',
      fundingType: 'loan',
      amount: 'Up to ₦10 million',
      eligibility: ['Registered Nigerian SME'],
      deadline: '2026-12-31',
      status: 'active',
      location: 'Nigeria',
      description: 'Working-capital and asset finance for eligible SMEs.',
      sourceUrl: 'https://www.boi.ng/',
      sourceName: 'Bank of Industry',
      discoveredAt,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a record without a source URL', () => {
    const result = fundingOpportunitySchema.safeParse({
      id: 'missing-source',
      title: 'Unknown programme',
      provider: 'Unknown',
      fundingType: 'grant',
      status: 'unverified',
      sourceName: 'Unknown',
      discoveredAt,
    });

    expect(result.success).toBe(false);
  });

  it('accepts a public listing when the page does not state a funding type', () => {
    const result = fundingOpportunitySchema.safeParse({
      id: 'funding-untyped',
      kind: 'funding',
      title: 'State Matching Fund',
      provider: 'Bank of Industry',
      status: 'unverified',
      sourceUrl: 'https://www.boi.ng/product/state-matching-fund/',
      sourceName: 'Bank of Industry',
      discoveredAt,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fundingType).toBeUndefined();
    }
  });
});

describe('vendorSchema', () => {
  it('accepts a source-listed vendor and never requires a verified label', () => {
    const result = vendorSchema.safeParse({
      id: 'vendor-lagos-tailor',
      kind: 'vendor',
      name: 'Ikeja Stitch Studio',
      category: 'tailor',
      state: 'Lagos',
      locality: 'Ikeja',
      sourceUrl: 'https://www.example.com/vendors/ikeja-stitch-studio',
      sourceName: 'Public business listing',
      discoveredAt,
      verificationStatus: 'source-listed',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invented verification statuses', () => {
    const result = vendorSchema.safeParse({
      id: 'vendor-invalid',
      name: 'Unverified Maker',
      category: 'baker',
      state: 'Oyo',
      sourceUrl: 'https://www.example.com/vendors/unverified-maker',
      sourceName: 'Public business listing',
      discoveredAt,
      verificationStatus: 'verified',
    });

    expect(result.success).toBe(false);
  });
});

describe('smeOpportunitySchema', () => {
  it('accepts a source-linked opportunity and keeps AI off by default', () => {
    const result = smeOpportunitySchema.parse({
      id: 'opp-1',
      title: 'Women Enterprise Growth Programme',
      provider: 'Example Foundation',
      opportunityType: 'accelerator',
      description: 'A growth programme for women-owned SMEs.',
      countries: ['Nigeria', 'Ghana'],
      sourceUrl: 'https://example.org/programme',
      sourceName: 'Example Foundation',
      status: 'active',
      scrapedAt: discoveredAt,
      confidence: 'high',
    });

    expect(result.ai).toBeNull();
  });
});

describe('actorInputSchema', () => {
  it('defaults countries, maxResults and AI off', () => {
    const result = actorInputSchema.parse({});
    expect(result.maxResults).toBe(20);
    expect(result.countries).toEqual(['Nigeria', 'Ghana', 'Kenya']);
    expect(result.ai.enabled).toBe(false);
    expect(result.includeExpired).toBe(false);
  });

  it('rejects maxResults above the Actor hard limit', () => {
    const result = actorInputSchema.safeParse({ maxResults: 500 });
    expect(result.success).toBe(false);
  });

  it('requires a secret API key only when AI is enabled', () => {
    const withoutKey = actorInputSchema.safeParse({ ai: { enabled: true } });
    expect(withoutKey.success).toBe(false);

    const withKey = actorInputSchema.parse({
      ai: { enabled: true },
      openaiApiKey: 'sk-test',
    });
    expect(withKey.ai.provider).toBe('openai');
  });
});

describe('searchRequestSchema', () => {
  it('discriminates funding and vendor requests', () => {
    const funding = searchRequestSchema.parse({ mode: 'funding', fundingType: 'grant' });
    const vendors = searchRequestSchema.parse({ mode: 'vendors', serviceCategory: 'printer' });

    expect(funding.mode).toBe('funding');
    expect(vendors.mode).toBe('vendors');
  });
});

describe('searchResponseSchema', () => {
  it('keeps funding and vendor payloads type-safe', () => {
    const funding = searchResponseSchema.parse({
      mode: 'funding',
      results: [],
      meta: { resultCount: 0, usedMockData: true, source: 'mock' },
    });
    const vendors = searchResponseSchema.parse({
      mode: 'vendors',
      results: [],
      meta: { resultCount: 0, usedMockData: false, source: 'apify' },
    });

    expect(funding.mode).toBe('funding');
    expect(vendors.mode).toBe('vendors');
  });
});

describe('apiErrorSchema', () => {
  it('accepts a safe public error payload', () => {
    const result = apiErrorSchema.safeParse({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Search request is invalid.',
      },
    });

    expect(result.success).toBe(true);
  });
});
