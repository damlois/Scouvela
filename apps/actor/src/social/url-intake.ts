import { canonicalizeUrl } from '../utils/urls.js';

export type StartUrlInput = string | { url?: string };

export type AcceptedUrl = {
  submittedUrl: string;
  normalizedUrl: string;
};

export type RejectedUrl = {
  submittedUrl: string;
  reason: string;
};

const BLOCKED_HOSTS = new Set(['localhost', 'localhost.localdomain']);

export function partitionStartUrls(items: StartUrlInput[] | undefined): {
  accepted: AcceptedUrl[];
  rejected: RejectedUrl[];
} {
  const accepted: AcceptedUrl[] = [];
  const rejected: RejectedUrl[] = [];
  const seen = new Set<string>();

  for (const item of items ?? []) {
    const submittedUrl = typeof item === 'string' ? item.trim() : item.url?.trim() ?? '';
    if (!submittedUrl) {
      rejected.push({ submittedUrl: submittedUrl || '[empty]', reason: 'URL is empty.' });
      continue;
    }

    const verdict = inspectPublicUrl(submittedUrl);
    if (!verdict.ok) {
      rejected.push({ submittedUrl, reason: verdict.reason });
      continue;
    }

    if (seen.has(verdict.normalizedUrl)) {
      continue;
    }

    seen.add(verdict.normalizedUrl);
    accepted.push({ submittedUrl, normalizedUrl: verdict.normalizedUrl });
  }

  return { accepted, rejected };
}

export function inspectPublicUrl(
  value: string,
): { ok: true; normalizedUrl: string } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, reason: 'URL could not be parsed.' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: `Scheme ${parsed.protocol} is not allowed.` };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'URLs with embedded credentials are not allowed.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.localhost')) {
    return { ok: false, reason: 'Localhost URLs are not allowed.' };
  }

  if (isPrivateAddress(hostname)) {
    return { ok: false, reason: 'Private-network and loopback addresses are not allowed.' };
  }

  return { ok: true, normalizedUrl: canonicalizeUrl(parsed.toString()) };
}

function isPrivateAddress(hostname: string): boolean {
  if (hostname === '::1' || hostname === '0:0:0:0:0:0:0:1') {
    return true;
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (ipv4) {
    const octets = ipv4.slice(1).map((part) => Number(part));
    if (octets.some((part) => part > 255)) {
      return true;
    }

    const [first, second] = octets;
    if (first === 0 || first === 10 || first === 127) {
      return true;
    }

    if (first === 169 && second === 254) {
      return true;
    }

    if (first === 172 && second !== undefined && second >= 16 && second <= 31) {
      return true;
    }

    if (first === 192 && second === 168) {
      return true;
    }
  }

  const ipv6 = hostname.toLowerCase();
  return ipv6.startsWith('fc') || ipv6.startsWith('fd') || ipv6.startsWith('fe80');
}
