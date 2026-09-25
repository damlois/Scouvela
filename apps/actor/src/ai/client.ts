import { log } from 'apify';
import { z } from 'zod';

const chatResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().optional(),
        }),
      }),
    )
    .min(1),
});

export function parseJsonContent<T>(raw: string, schema: z.ZodType<T>): T | undefined {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = schema.safeParse(JSON.parse(trimmed));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function completeJson(options: {
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<string | undefined> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You rewrite and classify only the supplied facts. Never invent deadlines, amounts, eligibility, or countries. Reply with JSON only.',
        },
        { role: 'user', content: options.prompt },
      ],
    }),
  });

  if (!response.ok) {
    log.warning('OpenAI request failed', { status: response.status, model: options.model });
    return undefined;
  }

  const body = chatResponseSchema.safeParse(await response.json());
  if (!body.success) {
    return undefined;
  }

  return body.data.choices[0]?.message.content;
}
