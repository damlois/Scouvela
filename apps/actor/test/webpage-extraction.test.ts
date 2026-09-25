import { describe, expect, it } from 'vitest';
import { actorInputSchema } from '@scouvela/shared';
import { selectApplicationUrl } from '../src/discovery/application-links.js';
import { extractDeadlineDetails, extractSupportedCountries } from '../src/discovery/content-facts.js';
import { assessOpportunityText } from '../src/discovery/opportunity-detector.js';
import { inferOpportunityType } from '../src/discovery/opportunity-type.js';
import { readWebpage, webpageToRaw } from '../src/discovery/webpage-extractor.js';
import { transformOpportunity } from '../src/transformers/opportunity-transformer.js';
import { readFixture } from './helpers.js';

describe('webpage extraction accuracy', () => {
  it('extracts TEF provider, Africa-wide coverage, deadline and TEFConnect', () => {
    const page = readWebpage(
      readFixture('tef-press-release.html'),
      'https://www.tonyelumelufoundation.org/press-releases/apply-tef-entrepreneurship-programme-2026',
    );
    const raw = webpageToRaw(
      { ok: true, ...page },
      actorInputSchema.parse({ countries: ['Nigeria'], sourceTypes: ['custom-webpages'] }),
    );
    const saved = raw ? transformOpportunity(raw, '2026-09-25T00:00:00.000Z') : null;

    expect(raw?.provider).toBe('Tony Elumelu Foundation');
    expect(raw?.countries).toEqual(['Africa-wide']);
    expect(raw?.deadline).toBe('2026-03-01');
    expect(raw?.deadlineText).toMatch(/1 January to 1 March 2026/i);
    expect(raw?.applicationUrl).toContain('tefconnect.com');
    expect(raw?.applicationUrl).not.toMatch(/#$/);
    expect(raw?.opportunityType).toBe('grant');
    expect(saved?.verification.status).toBe('official-source');
    expect(saved?.verification.reasons.join(' ')).toMatch(/not separately fetched/i);
    expect(saved?.countries).toEqual(['Africa-wide']);
  });

  it('does not let a Lagos dateline force Nigeria-only coverage', () => {
    const countries = extractSupportedCountries(
      'Lagos, Nigeria – 1 January 2026 – Applications are open to founders from all 54 African countries.',
    );
    expect(countries).toEqual(['Africa-wide']);
  });

  it('does not overwrite Africa-wide coverage with the user input country', () => {
    const page = readWebpage(
      readFixture('tef-press-release.html'),
      'https://www.tonyelumelufoundation.org/press-releases/apply-tef-entrepreneurship-programme-2026',
    );
    const raw = webpageToRaw(
      { ok: true, ...page },
      actorInputSchema.parse({ countries: ['Nigeria'], sourceTypes: ['custom-webpages'] }),
    );
    expect(raw?.countries).toEqual(['Africa-wide']);
    expect(raw?.countries).not.toContain('Nigeria');
  });

  it('prefers TEFConnect over a same-page apply slug', () => {
    const selected = selectApplicationUrl({
      pageUrl: 'https://www.tonyelumelufoundation.org/press-releases/apply-tef-entrepreneurship-programme-2026',
      text: 'Applications are open from 1 January to 1 March 2026 on www.TEFConnect.com.',
      links: [
        {
          url: 'https://www.tonyelumelufoundation.org/press-releases/apply-tef-entrepreneurship-programme-2026',
          anchorText: 'Tony Elumelu Foundation Opens 2026 Entrepreneurship Programme',
        },
        {
          url: 'https://www.tonyelumelufoundation.org/press-releases/apply-tef-entrepreneurship-programme-2026#',
          anchorText: 'Read more',
        },
        { url: 'https://www.tefconnect.com/', anchorText: 'Apply on TEFConnect' },
      ],
    });
    expect(selected).toContain('tefconnect.com');
  });

  it('parses the TEF application window end date', () => {
    const details = extractDeadlineDetails(
      'Applications for the 2026 TEF Entrepreneurship Programme are open from 1 January to 1 March 2026 on www.TEFConnect.com.',
    );
    expect(details.deadline).toBe('2026-03-01');
    expect(details.deadlineText).toMatch(/1 January to 1 March 2026/);
  });

  it('classifies seed capital with training and mentorship as grant/funding', () => {
    expect(
      inferOpportunityType('non-refundable seed capital with business training and mentorship'),
    ).toBe('grant');
  });

  it('still rejects ordinary marketing text without application intent', () => {
    const assessed = assessOpportunityText('Join our mentorship community of entrepreneurs.', []);
    expect(assessed.isCandidate).toBe(false);
  });
});
