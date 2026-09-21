export function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function deduplicateByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(item);
  }

  return unique;
}

export function fundingDedupeKey(item: { sourceUrl: string; title: string }): string {
  const sourceUrl = normalizeKeyPart(item.sourceUrl);
  const title = normalizeKeyPart(item.title);

  if (!sourceUrl || !title) {
    return '';
  }

  return `${sourceUrl}::${title}`;
}

export function vendorDedupeKey(item: { sourceUrl: string; name: string }): string {
  const sourceUrl = normalizeKeyPart(item.sourceUrl);
  const name = normalizeKeyPart(item.name);

  if (!sourceUrl || !name) {
    return '';
  }

  return `${sourceUrl}::${name}`;
}
