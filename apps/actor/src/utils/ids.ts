import { createHash } from 'node:crypto';
import { normalizeWhitespace } from './text.js';

export function deterministicId(prefix: string, parts: Array<string | undefined>): string {
  const material = parts
    .map((part) => normalizeWhitespace(part ?? '').toLowerCase())
    .join('|');
  const hash = createHash('sha256').update(material).digest('hex').slice(0, 20);
  return `${prefix}-${hash}`;
}
