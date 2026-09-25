import { describe, expect, it } from 'vitest';
import { partitionStartUrls } from '../src/social/url-intake.js';

describe('start URL intake', () => {
  it('rejects unsafe URLs and keeps public HTTP(S) URLs', () => {
    const { accepted, rejected } = partitionStartUrls([
      { url: 'https://example.org/opportunity' },
      { url: 'http://localhost/admin' },
      { url: 'http://127.0.0.1/secret' },
      { url: 'http://10.1.2.3/internal' },
      { url: 'http://192.168.0.8/router' },
      { url: 'https://user:pass@example.org/opportunity' },
      { url: 'file:///C:/secrets.txt' },
      { url: 'javascript:alert(1)' },
      { url: 'data:text/html,hello' },
    ]);

    expect(accepted).toHaveLength(1);
    expect(accepted[0]?.normalizedUrl).toBe('https://example.org/opportunity');
    expect(rejected.map((item) => item.reason).join(' ')).toMatch(/localhost/i);
    expect(rejected.map((item) => item.reason).join(' ')).toMatch(/loopback|private/i);
    expect(rejected.map((item) => item.reason).join(' ')).toMatch(/credentials/i);
    expect(rejected.some((item) => item.reason.includes('file:'))).toBe(true);
  });

  it('normalizes and deduplicates equivalent URLs', () => {
    const { accepted } = partitionStartUrls([
      'https://www.Example.com/opportunity/',
      'https://www.example.com/opportunity#section',
      { url: 'https://www.example.com/opportunity' },
    ]);

    expect(accepted).toHaveLength(1);
    expect(accepted[0]?.normalizedUrl).toBe('https://www.example.com/opportunity');
  });
});
