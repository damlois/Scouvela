import { SOURCE_REGISTRY } from '../sources/registry.js';

export type ReviewedProviderMatch = {
  provider: string;
  sourceId: string;
  host: string;
};

export function matchReviewedProvider(pageUrl: string): ReviewedProviderMatch | undefined {
  let hostname: string;
  try {
    hostname = new URL(pageUrl).hostname.toLowerCase();
  } catch {
    return undefined;
  }

  for (const source of SOURCE_REGISTRY) {
    for (const host of source.allowedHosts) {
      if (hostname === host.toLowerCase() || hostname.endsWith(`.${host.toLowerCase()}`)) {
        return {
          provider: source.sourceName,
          sourceId: source.sourceId,
          host,
        };
      }
    }
  }

  return undefined;
}

export function providerFromHostname(pageUrl: string): string | undefined {
  try {
    const hostname = new URL(pageUrl).hostname.toLowerCase().replace(/^www\./, '');
    const label = hostname.split('.')[0];
    if (!label || label.length < 2) {
      return undefined;
    }

    return label
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  } catch {
    return undefined;
  }
}
