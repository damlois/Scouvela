import { describe, expect, it } from 'vitest';
import {
  deduplicateByKey,
  fundingDedupeKey,
  vendorDedupeKey,
} from '../src/utils/deduplicate.js';

describe('deduplicateByKey', () => {
  it('removes duplicate funding records that share a source URL and title', () => {
    const records = [
      { title: 'BOI MSME Loan', sourceUrl: 'https://www.boi.ng/' },
      { title: 'boi msme loan', sourceUrl: 'https://www.boi.ng/' },
      { title: 'TEF Programme', sourceUrl: 'https://www.tonyelumelufoundation.org/' },
    ];

    const unique = deduplicateByKey(records, fundingDedupeKey);
    expect(unique).toHaveLength(2);
    expect(unique[0]?.title).toBe('BOI MSME Loan');
  });

  it('removes duplicate vendor records that share a source URL and name', () => {
    const records = [
      { name: 'Ikeja Stitch Studio', sourceUrl: 'https://www.example.com/vendors/ikeja-stitch-studio' },
      { name: 'Ikeja Stitch Studio', sourceUrl: 'https://www.example.com/vendors/ikeja-stitch-studio' },
      { name: 'Yaba Print House', sourceUrl: 'https://www.example.com/vendors/yaba-print-house' },
    ];

    const unique = deduplicateByKey(records, vendorDedupeKey);
    expect(unique).toHaveLength(2);
  });

  it('skips records with empty keys', () => {
    const unique = deduplicateByKey([{ title: '  ', sourceUrl: '   ' }], fundingDedupeKey);
    expect(unique).toHaveLength(0);
  });
});
