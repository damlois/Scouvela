import { MOCK_FUNDING, MOCK_VENDORS } from './mock-data';

export type ApifySource = {
  name: string;
  url: string;
  category: 'Funding' | 'Vendors';
};

/**
 * Real: matches the sources reviewed in apps/actor/SOURCES.md and implemented
 * under apps/actor/src/sources/. Update this list if a source is added or removed there.
 */
export const APIFY_SOURCES: ApifySource[] = [
  { name: 'Bank of Industry', url: 'https://www.boi.ng/', category: 'Funding' },
  { name: 'Finelib.com', url: 'https://www.finelib.com/', category: 'Vendors' },
];

/** Real: counted from the current demo dataset in lib/mock-data.ts. */
export const DEMO_LISTING_COUNT = MOCK_FUNDING.length + MOCK_VENDORS.length;

/**
 * Placeholder. The Actor has not been run live yet (live crawls stay off until the
 * source-approval variables in apps/actor/SOURCES.md are set) so there is no real
 * run timestamp or schedule to report. Edit these once a live run exists.
 */
export const APIFY_RUN_STATS = {
  lastRunLabel: 'Not run live yet',
  refreshFrequency: 'Planned: daily, once live',
};
