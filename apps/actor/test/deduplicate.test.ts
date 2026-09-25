import { describe, expect, it } from 'vitest';
import { opportunityDedupeKey } from '../src/transformers/opportunity-transformer.js';
import { deduplicateByKey } from '../src/utils/deduplicate.js';

describe('deduplicateByKey', () => {
  it('removes duplicate opportunities that share provider, title and source URL', () => {
    const records = [
      { provider: 'Bank of Industry', title: 'BOI MSME Loan', sourceUrl: 'https://www.boi.ng/product/msme/' },
      { title: 'boi msme loan', provider: 'Bank of Industry', sourceUrl: 'https://www.boi.ng/product/msme/' },
      { provider: 'Other', title: 'TEF Programme', sourceUrl: 'https://www.boi.ng/product/other' },
    ];

    const { unique } = deduplicateByKey(records, opportunityDedupeKey);
    expect(unique).toHaveLength(2);
    expect(unique[0]?.title).toBe('BOI MSME Loan');
  });

  it('skips records with empty keys', () => {
    const { unique } = deduplicateByKey([{ title: '  ', provider: '', sourceUrl: '   ' }], () => '');
    expect(unique).toHaveLength(0);
  });
});
