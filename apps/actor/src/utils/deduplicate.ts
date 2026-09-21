import { emptyToUndefined, normalizeWhitespace } from './text.js';
import { canonicalizeUrl } from './urls.js';

export function normalizeKeyPart(value: string | undefined): string {
  return normalizeWhitespace(value ?? '').toLowerCase();
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) {
    return true;
  }

  if (typeof value === 'string') {
    return normalizeWhitespace(value).length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

export function mergeComplementary<T extends Record<string, unknown>>(current: T, incoming: T): T {
  const merged = { ...current };

  for (const key of Object.keys(incoming) as Array<keyof T>) {
    const currentValue = merged[key];
    const incomingValue = incoming[key];

    if (Array.isArray(currentValue) || Array.isArray(incomingValue)) {
      const values: unknown[] = [
        ...(Array.isArray(currentValue) ? currentValue : []),
        ...(Array.isArray(incomingValue) ? incomingValue : []),
      ]
        .map((item) => (typeof item === 'string' ? emptyToUndefined(item) : item))
        .filter((item) => item != null);
      const seen = new Set<string>();
      const unique: unknown[] = [];
      for (const item of values) {
        const identity = typeof item === 'string' ? item.toLowerCase() : JSON.stringify(item);
        if (seen.has(identity)) {
          continue;
        }
        seen.add(identity);
        unique.push(item);
      }
      merged[key] = unique as T[keyof T];
      continue;
    }

    if (isEmptyValue(currentValue) && !isEmptyValue(incomingValue)) {
      merged[key] = incomingValue;
    }
  }

  return merged;
}

export function deduplicateByKey<T extends Record<string, unknown>>(
  items: T[],
  keyFn: (item: T) => string,
): { unique: T[]; duplicatesRemoved: number } {
  const byKey = new Map<string, T>();
  let duplicatesRemoved = 0;

  for (const item of items) {
    const key = keyFn(item);
    if (!key) {
      continue;
    }

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }

    byKey.set(key, mergeComplementary(existing, item));
    duplicatesRemoved += 1;
  }

  return { unique: [...byKey.values()], duplicatesRemoved };
}

export function fundingDedupeKey(item: {
  provider: string;
  title: string;
  sourceUrl: string;
}): string {
  const provider = normalizeKeyPart(item.provider);
  const title = normalizeKeyPart(item.title);
  if (!provider || !title || !item.sourceUrl.trim()) {
    return '';
  }

  try {
    return `${provider}::${title}::${canonicalizeUrl(item.sourceUrl)}`;
  } catch {
    return '';
  }
}

export function vendorDedupeKey(item: {
  name: string;
  category: string;
  locality?: string;
  sourceUrl: string;
}): string {
  const name = normalizeKeyPart(item.name);
  const category = normalizeKeyPart(item.category);
  const locality = normalizeKeyPart(item.locality);

  if (!name || !category) {
    return '';
  }

  if (!locality) {
    try {
      return item.sourceUrl ? `unmerged::${canonicalizeUrl(item.sourceUrl)}` : '';
    } catch {
      return '';
    }
  }

  return `${name}::${category}::${locality}`;
}
