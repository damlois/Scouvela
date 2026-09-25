import { canonicalizeUrl } from '../utils/urls.js';
import type { DetectedSource } from './types.js';

const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const RESERVED_PROFILE_SEGMENTS = new Set([
  'p',
  'reel',
  'reels',
  'explore',
  'accounts',
  'stories',
  'about',
  'legal',
  'directory',
  'tv',
  'share',
  'direct',
]);

export function detectSource(value: string): DetectedSource {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { platform: 'unsupported', contentType: 'unknown', url: value };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { platform: 'unsupported', contentType: 'unknown', url: value };
  }

  const url = canonicalizeUrl(parsed.toString());
  const hostname = parsed.hostname.toLowerCase();
  if (!INSTAGRAM_HOSTS.has(hostname)) {
    return { platform: 'website', contentType: 'webpage', url };
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  const head = segments[0]?.toLowerCase();
  const slug = segments[1];

  if (head === 'p' && slug) {
    return { platform: 'instagram', contentType: 'social-post', url };
  }

  if ((head === 'reel' || head === 'reels') && slug) {
    return { platform: 'instagram', contentType: 'social-reel', url };
  }

  if (
    segments.length === 1 &&
    head &&
    !RESERVED_PROFILE_SEGMENTS.has(head) &&
    /^[a-zA-Z0-9._]{1,30}$/.test(segments[0] ?? '')
  ) {
    return { platform: 'instagram', contentType: 'social-profile', url };
  }

  return { platform: 'unsupported', contentType: 'unknown', url };
}
