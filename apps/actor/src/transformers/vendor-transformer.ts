import type { ParsedActorInput, Vendor } from '@scouvela/shared';
import type { RawVendorRecord } from '../sources/vendors/finelib-vendor-source.js';
import { toIsoDate } from '../utils/dates.js';
import { deterministicId } from '../utils/ids.js';
import { normalizeLocality, normalizeState } from '../utils/locations.js';
import { emptyToUndefined } from '../utils/text.js';
import { canonicalizeUrl, toAbsoluteUrl } from '../utils/urls.js';

export function transformVendorRecord(
  record: RawVendorRecord,
  discoveredAt: string = toIsoDate(),
): Vendor | null {
  const name = emptyToUndefined(record.name);
  const category = emptyToUndefined(record.category);
  const state = normalizeState(record.state);
  const sourceUrl = record.sourceUrl ? toAbsoluteUrl(record.sourceUrl, record.sourceUrl) : undefined;
  const sourceName = emptyToUndefined(record.sourceName);

  if (!name || !category || !state || !sourceUrl || !sourceName) {
    return null;
  }

  const website = record.website ? toAbsoluteUrl(record.website, sourceUrl) : undefined;
  const rating =
    typeof record.rating === 'number' && record.rating >= 0 && record.rating <= 5
      ? record.rating
      : undefined;

  return {
    id: deterministicId('vendor', [name, category, record.locality, canonicalizeUrl(sourceUrl)]),
    kind: 'vendor',
    name,
    category,
    state,
    locality: normalizeLocality(record.locality),
    address: emptyToUndefined(record.address),
    phone: emptyToUndefined(record.phone),
    website: website ? canonicalizeUrl(website) : undefined,
    rating,
    description: emptyToUndefined(record.description),
    sourceUrl: canonicalizeUrl(sourceUrl),
    sourceName,
    discoveredAt,
    verificationStatus: 'source-listed',
  };
}

export function transformVendorRecords(
  records: RawVendorRecord[],
  _input: ParsedActorInput,
  discoveredAt: string = toIsoDate(),
): Vendor[] {
  return records
    .map((record) => transformVendorRecord(record, discoveredAt))
    .filter((record): record is Vendor => record != null);
}
