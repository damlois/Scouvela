import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { parseJsonContent } from '../src/ai/client.js';

describe('AI JSON parsing', () => {
  const schema = z.object({ summary: z.string().min(1) });

  it('reads a JSON object', () => {
    expect(parseJsonContent('{"summary":"A BOI working-capital loan."}', schema)).toEqual({
      summary: 'A BOI working-capital loan.',
    });
  });

  it('reads fenced JSON', () => {
    expect(parseJsonContent('```json\n{"summary":"Lagos fashion accelerator."}\n```', schema)).toEqual({
      summary: 'Lagos fashion accelerator.',
    });
  });

  it('rejects invalid or empty payloads', () => {
    expect(parseJsonContent('Just a paragraph', schema)).toBeUndefined();
    expect(parseJsonContent('{"summary":""}', schema)).toBeUndefined();
    expect(parseJsonContent('', schema)).toBeUndefined();
  });
});
