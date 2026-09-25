import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { actorInputSchema, type ParsedActorInput } from '@scouvela/shared';
import { inferFundingType, parseBoiDetailHtml, parseBoiIndexHtml } from '../src/sources/boi-nigeria.js';
import { parseTefDetailHtml } from '../src/sources/tef-africa.js';
import { parseGeaDetailHtml } from '../src/sources/gea-ghana.js';
import { parseKcicDetailHtml } from '../src/sources/kcic-kenya.js';
import { calculateOpportunityStatus, normalizeDeadline, parseDeadline } from '../src/utils/dates.js';
import { toAbsoluteUrl } from '../src/utils/urls.js';
import { normalizeWhitespace } from '../src/utils/text.js';
import { deterministicId } from '../src/utils/ids.js';
import { opportunityDedupeKey, transformOpportunity } from '../src/transformers/opportunity-transformer.js';
import { deduplicateByKey } from '../src/utils/deduplicate.js';
import { finaliseOpportunities } from '../src/pipeline.js';
import { createRunStats } from '../src/utils/stats.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf8');
}

const fundingInput: ParsedActorInput = actorInputSchema.parse({
  query: 'SME',
  countries: ['Nigeria'],
  maxResults: 5,
  includeExpired: true,
});

describe('actor input validation', () => {
  it('defaults maxResults to 20 and trims strings', () => {
    const parsed = actorInputSchema.parse({ query: '  SME  ' });
    expect(parsed.maxResults).toBe(20);
    expect(parsed.query).toBe('SME');
  });

  it('rejects maxResults above 50', () => {
    const parsed = actorInputSchema.safeParse({ maxResults: 51 });
    expect(parsed.success).toBe(false);
  });
});

describe('funding index parsing', () => {
  it('collects same-host product detail URLs', () => {
    const parsed = parseBoiIndexHtml(
      readFixture('boi-index.html'),
      'https://www.boi.ng/product-category/smes/',
      fundingInput,
    );
    expect(parsed.detailUrls).toEqual([
      'https://www.boi.ng/product/sme-working-capital-loan/',
      'https://www.boi.ng/product/youth-enterprise-grant/',
    ]);
    expect(parsed.nextIndexUrls).toContain('https://www.boi.ng/product-category/smes/page/2/');
  });

  it('keeps loan cards and drops index cards that clearly state another type', () => {
    const parsed = parseBoiIndexHtml(
      readFixture('boi-index.html'),
      'https://www.boi.ng/product-category/smes/',
      { ...fundingInput, opportunityTypes: ['loan'] },
    );
    expect(parsed.detailUrls).toEqual(['https://www.boi.ng/product/sme-working-capital-loan/']);
  });
});

describe('funding detail parsing', () => {
  it('extracts stated loan fields and does not invent a deadline', () => {
    const record = parseBoiDetailHtml(
      readFixture('boi-detail.html'),
      'https://www.boi.ng/product/sme-working-capital-loan/',
      fundingInput,
    );
    expect(record?.title).toBe('SME Working Capital Loan');
    expect(record?.provider).toBe('Bank of Industry');
    expect(record?.opportunityType).toBe('loan');
    expect(record?.fundingAmountText).toContain('₦5 million');
    expect(record?.deadline).toBeUndefined();
    expect(record?.applicationsOpen).toBe(true);
    expect(record?.sourceUrl).toBe('https://www.boi.ng/product/sme-working-capital-loan/');
  });

  it('classifies a matching fund from stated page language', () => {
    expect(inferFundingType('These are collaborative funding schemes between BOI and other partner institutions')).toBe(
      'business-support',
    );
    expect(inferFundingType('State Matching Fund')).toBe('business-support');
  });

  it('skips a loan page when the input asks for a grant', () => {
    const record = parseBoiDetailHtml(
      readFixture('boi-detail.html'),
      'https://www.boi.ng/product/sme-working-capital-loan/',
      { ...fundingInput, opportunityTypes: ['grant'] },
    );
    expect(record).toBeNull();
  });

  it('does not treat an empty product body as a record', () => {
    const record = parseBoiDetailHtml(
      '<main id="content"><h1 class="entry-title">Waste Management Product Programme</h1><div class="page-content"></div></main>',
      'https://www.boi.ng/product/waste-management-product-programme/',
      fundingInput,
    );
    expect(record).toBeNull();
  });

  it('keeps an explicit past deadline so status can be expired', () => {
    const record = parseBoiDetailHtml(
      readFixture('boi-detail-expired.html'),
      'https://www.boi.ng/product/closed-matching-window/',
      fundingInput,
    );
    expect(record?.deadline).toBe('1 January 2020');
    const transformed = transformOpportunity(record ?? {});
    expect(transformed?.status).toBe('expired');
    expect(transformed?.deadline).toBe('2020-01-01');
  });
});

describe('programme page parsing', () => {
  it('reads the TEF public programme page', () => {
    const record = parseTefDetailHtml(
      readFixture('tef-programme.html'),
      'https://www.tonyelumelufoundation.org/tef-entrepreneurship-programme',
      actorInputSchema.parse({ countries: ['Nigeria'], includeExpired: true }),
    );
    expect(record?.provider).toBe('Tony Elumelu Foundation');
    expect(record?.opportunityType).toBe('accelerator');
    expect(record?.countries).toContain('Africa-wide');
    expect(record?.applicationUrl).toContain('tefconnect.com');
  });

  it('reads a GEA programme page', () => {
    const record = parseGeaDetailHtml(
      readFixture('gea-d4j.html'),
      'https://gea.gov.gh/d4j/',
      actorInputSchema.parse({ countries: ['Ghana'] }),
    );
    expect(record?.provider).toBe('Ghana Enterprises Agency');
    expect(record?.countries).toEqual(['Ghana']);
    expect(record?.targetGroups).toContain('disability-inclusive');
  });

  it('reads a KCIC competition page and keeps the stated deadline', () => {
    const record = parseKcicDetailHtml(
      readFixture('kcic-cleantech.html'),
      'https://www.kenyacic.org/programmes/cleantech',
      actorInputSchema.parse({ countries: ['Kenya'], includeExpired: true }),
    );
    expect(record?.opportunityType).toBe('competition');
    expect(record?.deadline).toMatch(/August 2026/i);
  });
});

describe('normalisation helpers', () => {
  it('converts relative URLs to absolute URLs', () => {
    expect(toAbsoluteUrl('/product/sme-loan/', 'https://www.boi.ng')).toBe(
      'https://www.boi.ng/product/sme-loan/',
    );
  });

  it('collapses repeated whitespace', () => {
    expect(normalizeWhitespace('  SME   working\ncapital  ')).toBe('SME working capital');
  });

  it('normalises parseable deadlines to YYYY-MM-DD and leaves ambiguous dates absent', () => {
    expect(normalizeDeadline('30 September 2026')).toBe('2026-09-30');
    expect(normalizeDeadline('2026-12-31')).toBe('2026-12-31');
    expect(normalizeDeadline('Q4 2026')).toBeUndefined();
    expect(parseDeadline('soon')).toBeUndefined();
  });

  it('creates deterministic IDs from stable properties', () => {
    const first = deterministicId('opportunity', ['Bank of Industry', 'SME Loan', 'https://www.boi.ng/product/a']);
    const second = deterministicId('opportunity', ['Bank of Industry', 'SME Loan', 'https://www.boi.ng/product/a']);
    expect(first).toBe(second);
    expect(first.startsWith('opportunity-')).toBe(true);
  });
});

describe('opportunity status', () => {
  const now = new Date('2026-09-21T08:00:00.000Z');

  it('marks a deadline more than 14 days away as active', () => {
    expect(calculateOpportunityStatus('2026-12-31', now)).toBe('active');
  });

  it('marks today and the next 14 days as closing-soon', () => {
    expect(calculateOpportunityStatus('2026-09-21', now)).toBe('closing-soon');
    expect(calculateOpportunityStatus('2026-10-05', now)).toBe('closing-soon');
  });

  it('marks a past deadline as expired', () => {
    expect(calculateOpportunityStatus('2026-09-01', now)).toBe('expired');
  });

  it('marks missing dates as unverified unless the page says applications are open', () => {
    expect(calculateOpportunityStatus(undefined, now)).toBe('unverified');
    expect(calculateOpportunityStatus(undefined, now, { applicationsOpen: true })).toBe('active');
    expect(calculateOpportunityStatus(undefined, now, { ongoing: true })).toBe('ongoing');
  });
});

describe('deduplication and merging', () => {
  it('deduplicates opportunities by provider, title and source URL', () => {
    const records = [
      {
        provider: 'Bank of Industry',
        title: 'SME Working Capital Loan',
        sourceUrl: 'https://www.boi.ng/product/sme-working-capital-loan/',
        amount: undefined as string | undefined,
      },
      {
        provider: 'bank of industry',
        title: 'sme working capital loan',
        sourceUrl: 'https://www.boi.ng/product/sme-working-capital-loan/',
        amount: 'Up to ₦5 million',
      },
    ];

    const { unique, duplicatesRemoved } = deduplicateByKey(records, opportunityDedupeKey);
    expect(unique).toHaveLength(1);
    expect(duplicatesRemoved).toBe(1);
    expect(unique[0]?.amount).toBe('Up to ₦5 million');
  });
});

describe('pipeline validation', () => {
  it('limits valid opportunities to maxResults', () => {
    const stats = createRunStats();
    const records = Array.from({ length: 8 }, (_, index) => ({
      title: `Loan ${index}`,
      provider: 'Bank of Industry',
      opportunityType: 'loan' as const,
      description: 'Working-capital finance for registered Nigerian SMEs.',
      countries: ['Nigeria'],
      sourceUrl: `https://www.boi.ng/product/loan-${index}/`,
      sourceName: 'Bank of Industry',
      applicationsOpen: true,
    }));
    const saved = finaliseOpportunities(records, { ...fundingInput, maxResults: 5 }, '2026-09-21T08:00:00.000Z', stats);
    expect(saved).toHaveLength(5);
    expect(saved.every((item) => item.sourceUrl.startsWith('https://www.boi.ng/'))).toBe(true);
    expect(saved.every((item) => item.ai === null)).toBe(true);
  });

  it('skips invalid records and continues', () => {
    const stats = createRunStats();
    const saved = finaliseOpportunities(
      [
        {
          title: 'Valid Programme',
          provider: 'Ghana Enterprises Agency',
          opportunityType: 'training',
          description: 'Digital skills training for Ghanaian SMEs.',
          countries: ['Ghana'],
          sourceUrl: 'https://gea.gov.gh/d4j/',
          sourceName: 'Ghana Enterprises Agency',
        },
        { title: 'Missing URL', provider: 'Unknown', description: 'No source.' },
      ],
      actorInputSchema.parse({ countries: ['Ghana'], maxResults: 5 }),
      '2026-09-21T08:00:00.000Z',
      stats,
    );
    expect(saved).toHaveLength(1);
    expect(saved[0]?.opportunityType).toBe('training');
  });

  it('saves a public listing without inventing a funding amount', () => {
    const transformed = transformOpportunity({
      title: 'Unspecified Window',
      provider: 'Bank of Industry',
      description: 'A public SME product page without a stated amount.',
      countries: ['Nigeria'],
      sourceUrl: 'https://www.boi.ng/product/unspecified-window/',
      sourceName: 'Bank of Industry',
    });
    expect(transformed?.title).toBe('Unspecified Window');
    expect(transformed?.fundingAmount).toBeUndefined();
    expect(transformed?.opportunityType).toBe('other');
    expect(opportunityDedupeKey(transformed!)).toContain('unspecified window');
  });
});
