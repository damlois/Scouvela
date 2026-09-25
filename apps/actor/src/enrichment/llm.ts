import { log } from 'apify';
import { z } from 'zod';
import type { FundingOpportunity, Vendor } from '@scouvela/shared';
import { chargeAiEnrichment } from './ppe.js';

export const OPENROUTER_PROXY_URL = 'https://openrouter.apify.actor/api/v1/chat/completions';
export const DEFAULT_ENRICHMENT_MODEL = 'openai/gpt-4o-mini';

const enrichmentResponseSchema = z.object({
  summary: z.string().trim().min(1).max(500),
});

export type EnrichableRecord = FundingOpportunity | Vendor;

export function parseEnrichmentResponse(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = enrichmentResponseSchema.safeParse(JSON.parse(unfenced));
    if (!parsed.success) {
      return undefined;
    }

    return parsed.data.summary;
  } catch {
    return undefined;
  }
}

export function buildEnrichmentPayload(record: EnrichableRecord): {
  model: string;
  temperature: number;
  response_format: { type: 'json_object' };
  messages: Array<{ role: 'system' | 'user'; content: string }>;
} {
  const facts =
    record.kind === 'funding'
      ? {
          kind: record.kind,
          title: record.title,
          provider: record.provider,
          fundingType: record.fundingType ?? null,
          amount: record.amount ?? null,
          eligibility: record.eligibility ?? [],
          deadline: record.deadline ?? null,
          status: record.status,
          location: record.location ?? null,
          description: record.description ?? null,
        }
      : {
          kind: record.kind,
          name: record.name,
          category: record.category,
          state: record.state,
          locality: record.locality ?? null,
          address: record.address ?? null,
          phone: record.phone ?? null,
          website: record.website ?? null,
          description: record.description ?? null,
          verificationStatus: record.verificationStatus,
        };

  return {
    model: DEFAULT_ENRICHMENT_MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'Summarise only the JSON facts you are given. Reply with JSON {"summary":"..."}. Use at most two sentences and 280 characters. Never invent amounts, dates, phone numbers, websites, funding types, or verification. If a field is null or missing, omit it.',
      },
      {
        role: 'user',
        content: JSON.stringify(facts),
      },
    ],
  };
}

function resolveOpenRouterAuth(): { url: string; token: string } | undefined {
  const apifyToken = process.env.APIFY_TOKEN?.trim();
  if (apifyToken) {
    return { url: OPENROUTER_PROXY_URL, token: apifyToken };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    return { url: 'https://openrouter.ai/api/v1/chat/completions', token: openRouterKey };
  }

  return undefined;
}

async function requestSummary(
  record: EnrichableRecord,
  auth: { url: string; token: string },
): Promise<string | undefined> {
  const response = await fetch(auth.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildEnrichmentPayload(record)),
  });

  if (!response.ok) {
    log.warning('AI enrichment request failed', { status: response.status });
    return undefined;
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return parseEnrichmentResponse(body.choices?.[0]?.message?.content ?? '');
}

export async function enrichRecords<T extends EnrichableRecord>(records: T[]): Promise<T[]> {
  if (records.length === 0) {
    return records;
  }

  const auth = resolveOpenRouterAuth();
  if (!auth) {
    log.warning('AI enrichment skipped: no APIFY_TOKEN or OPENROUTER_API_KEY is available.');
    return records;
  }

  const enriched: T[] = [];
  let charged = 0;

  for (const record of records) {
    try {
      const summary = await requestSummary(record, auth);
      if (summary) {
        enriched.push({ ...record, aiSummary: summary });
        charged += 1;
      } else {
        enriched.push(record);
      }
    } catch (error) {
      log.warning('AI enrichment failed for one record', {
        id: record.id,
        message: error instanceof Error ? error.message : 'Unknown enrichment error',
      });
      enriched.push(record);
    }
  }

  if (charged > 0) {
    await chargeAiEnrichment(charged);
  }

  return enriched;
}
