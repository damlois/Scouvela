import { log } from 'apify';
import { z } from 'zod';
import { opportunityTypeSchema, type ParsedActorInput } from '@scouvela/shared';
import { chargeEvent, PPE_AI_ENRICHED_RESULT } from '../billing/events.js';
import type { OpportunityCandidate } from '../discovery/opportunity-detector.js';
import { assessOpportunityText } from '../discovery/opportunity-detector.js';
import type { RawOpportunity } from '../sources/types.js';
import type { RunStats } from '../utils/stats.js';
import { completeJson, parseJsonContent } from './client.js';

const classificationSchema = z.object({
  isOpportunity: z.boolean(),
  evidenceQuote: z.string().min(8).max(300).optional(),
  suggestedType: opportunityTypeSchema.optional(),
  summary: z.string().min(1).max(500).optional(),
  missingInformation: z.array(z.string().min(1).max(200)).max(8).optional(),
});

export async function classifyRejectedPost(
  candidate: OpportunityCandidate,
  input: ParsedActorInput,
  stats: RunStats,
): Promise<RawOpportunity | null> {
  const apiKey = input.openaiApiKey ?? input.ai.apiKey;
  if (!input.ai.enabled || !apiKey || candidate.isCandidate) {
    return null;
  }

  const sourceText = [candidate.content.caption, candidate.content.visibleText].filter(Boolean).join('\n');
  try {
    const content = await completeJson({
      apiKey,
      model: input.ai.model,
      prompt: [
        'Decide whether this public social post is an SME opportunity.',
        'Use only a quote that appears in the post. Do not invent deadlines, links, amounts, or official status.',
        'Reply with JSON: {"isOpportunity":false,"evidenceQuote":"","suggestedType":"grant","summary":"","missingInformation":[]}',
        sourceText.slice(0, 4000),
      ].join('\n'),
    });
    const parsed = content ? parseJsonContent(content, classificationSchema) : undefined;
    if (!parsed?.isOpportunity || !parsed.evidenceQuote || !sourceText.toLowerCase().includes(parsed.evidenceQuote.toLowerCase())) {
      return null;
    }

    const evidence = assessOpportunityText(parsed.evidenceQuote, []);
    if (!evidence.isCandidate && evidence.matchedSignals.length === 0) {
      return null;
    }

    if (await chargeEvent(PPE_AI_ENRICHED_RESULT)) {
      stats.ppeEventsCharged += 1;
      stats.aiResultsGenerated += 1;
    }

    return {
      title: parsed.summary?.slice(0, 180) || candidate.content.accountName || 'Social opportunity',
      provider: candidate.content.accountName ?? candidate.content.accountHandle,
      opportunityType: parsed.suggestedType,
      description: sourceText.slice(0, 4000),
      countries: [...input.countries],
      sourceUrl: candidate.content.sourceUrl,
      sourceName: candidate.content.accountName ?? candidate.content.accountHandle ?? 'Instagram',
      sourcePlatform: 'instagram',
      contentType: candidate.content.contentType,
      originalContentUrl: candidate.content.sourceUrl,
      curatedSource: false,
      applicationPageConfirmed: false,
      extractionWarnings: [
        'AI cited a phrase that is present in the post. Scraped fields were not replaced.',
        ...(parsed.missingInformation ?? []),
      ],
    };
  } catch (error) {
    log.warning('AI social classification failed for one post', {
      message: error instanceof Error ? error.message.replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted]') : 'Unknown AI error',
    });
    return null;
  }
}
