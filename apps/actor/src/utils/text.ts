export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function emptyToUndefined(value: string | undefined | null): string | undefined {
  if (value == null) {
    return undefined;
  }

  const normalized = normalizeWhitespace(value);
  return normalized.length > 0 ? normalized : undefined;
}

export function uniqueNonEmpty(values: Array<string | undefined>): string[] | undefined {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = emptyToUndefined(value);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(normalized);
  }

  return unique.length > 0 ? unique : undefined;
}

export function containsNormalized(haystack: string | undefined, needle: string | undefined): boolean {
  const source = emptyToUndefined(haystack)?.toLowerCase();
  const query = emptyToUndefined(needle)?.toLowerCase();

  if (!source || !query) {
    return false;
  }

  return source.includes(query);
}
