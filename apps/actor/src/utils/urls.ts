const BLOCKED_PATH_MARKERS = ['/wp-admin', '/account.php', '/search.php', '/admin/', '/signup.php'];

export function toAbsoluteUrl(value: string | undefined, baseUrl: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return undefined;
  }
}

export function canonicalizeUrl(value: string): string {
  const parsed = new URL(value);
  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();
  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  return parsed.toString();
}

export function isAllowedHttpUrl(
  value: string,
  allowedHosts: readonly string[],
  allowedPathPrefixes: readonly string[],
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }

  if (!allowedHosts.includes(parsed.hostname.toLowerCase())) {
    return false;
  }

  const path = parsed.pathname.toLowerCase();
  if (BLOCKED_PATH_MARKERS.some((marker) => path.includes(marker))) {
    return false;
  }

  return allowedPathPrefixes.some(
    (prefix) => path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}`),
  );
}
