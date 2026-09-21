import type { ParsedActorInput, Vendor } from '@scouvela/shared';
import { toIsoDate } from '../utils/dates.js';
import { normalizeLocality, normalizeState } from '../utils/locations.js';

export type RawVendorRecord = {
  id?: string;
  name?: string;
  category?: string;
  state?: string;
  locality?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  description?: string;
  sourceUrl?: string;
  sourceName?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function transformVendorRecords(
  records: RawVendorRecord[],
  input: ParsedActorInput,
  discoveredAt: string = toIsoDate(),
): Vendor[] {
  const transformed: Vendor[] = [];

  for (const record of records) {
    if (!record.name || !record.sourceUrl || !record.sourceName) {
      continue;
    }

    const state = normalizeState(record.state ?? input.state);
    if (!state) {
      continue;
    }

    transformed.push({
      id: record.id ?? `vendor-${slugify(`${state}-${record.name}`)}`,
      name: record.name,
      category: record.category ?? input.serviceCategory ?? input.query ?? 'general',
      state,
      locality: normalizeLocality(record.locality ?? input.locality),
      address: record.address,
      phone: record.phone,
      website: record.website,
      rating: record.rating,
      description: record.description,
      sourceUrl: record.sourceUrl,
      sourceName: record.sourceName,
      discoveredAt,
      // Listings remain source-listed or unverified until a real verification process exists.
      verificationStatus: 'source-listed',
    });
  }

  return transformed;
}
