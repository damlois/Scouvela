import { describe, expect, it } from 'vitest';
import {
  deduplicateByKey,
  fundingDedupeKey,
  vendorDedupeKey,
} from '../src/utils/deduplicate.js';

describe('deduplicateByKey', () => {
  it('removes duplicate funding records that share provider, title and source URL', () => {
    const records = [
      { provider: 'Bank of Industry', title: 'BOI MSME Loan', sourceUrl: 'https://www.boi.ng/product/msme' },
      { title: 'boi msme loan', provider: 'Bank of Industry', sourceUrl: 'https://www.boi.ng/product/msme/' },
      { provider: 'Other', title: 'TEF Programme', sourceUrl: 'https://www.boi.ng/product/other' },
    ];

    const { unique } = deduplicateByKey(records, fundingDedupeKey);
    expect(unique).toHaveLength(2);
    expect(unique[0]?.title).toBe('BOI MSME Loan');
  });

  it('removes duplicate vendor records that share name, category and locality', () => {
    const records = [
      { name: 'Ikeja Stitch Studio', category: 'tailoring', locality: 'Ikeja', sourceUrl: 'https://www.example.com/vendors/ikeja-stitch-studio' },
      { name: 'Ikeja Stitch Studio', category: 'tailoring', locality: 'Ikeja', sourceUrl: 'https://www.example.com/vendors/ikeja-stitch-studio-2' },
      { name: 'Yaba Print House', category: 'printing', locality: 'Yaba', sourceUrl: 'https://www.example.com/vendors/yaba-print-house' },
    ];

    const { unique } = deduplicateByKey(records, vendorDedupeKey);
    expect(unique).toHaveLength(2);
  });

  it('skips records with empty keys', () => {
    const { unique } = deduplicateByKey([{ title: '  ', provider: '', sourceUrl: '   ' }], fundingDedupeKey);
    expect(unique).toHaveLength(0);
  });
});
