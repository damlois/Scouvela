import { Actor, log } from 'apify';
import { z } from 'zod';
import {
  opportunityTypeSchema,
  targetGroupSchema,
  type OpportunityAi,
  type ParsedActorInput,
  type SmeOpportunity,
} from '@scouvela/shared';
import {
  chargeEvent,
  PPE_AI_ENRICHED_RESULT,
  PPE_AI_OPPORTUNITY_REPORT,
  PPE_AI_SEARCH_PLAN,
} from '../billing/events.js';
import type { RunStats } from '../utils/stats.js';
import { completeJson, parseJsonContent } from './client.js';
import { enrichmentPrompt, reportPrompt, searchPlanPrompt } from './prompts.js';

const searchPlanSchema = z.object({
  query: z.string().optional(),
  opportunityTypes: z.array(opportunityTypeSchema).optional(),
  sectors: z.array(z.string().min(1).max(80)).optional(),
  targetGroups: z.array(targetGroupSchema).optional(),
  notes: z.array(z.string()).optional(),
});

const enrichmentSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  matchScore: z.number().int().min(0).max(100).optional(),
  matchLevel: z.enum(['strong', 'moderate', 'weak']).optional(),
  matchReasons: z.array(z.string().min(1).max(200)).max(8).optional(),
  missingInformation: z.array(z.string().min(1).max(200)).max(8).optional(),
  warnings: z.array(z.string().min(1).max(200)).max(8).optional(),
});

const reportSchema = z.object({
  title: z.string().min(1).max(200),
  overview: z.string().min(1).max(2000),
  highlights: z.array(z.string().min(1).max(300)).max(12).optional(),
});

function uniqueStrings(values: Array<string | undefined>): string[] | undefined {
  const unique = [...new Set(values.map((item) => item?.trim()).filter(Boolean))] as string[];
  return unique.length > 0 ? unique : undefined;
}

export async function applyAiSearchPlan(
  input: ParsedActorInput,
  stats: RunStats,
): Promise<ParsedActorInput> {
  const apiKey = input.openaiApiKey ?? input.ai.apiKey;
  if (!input.ai.enabled || !apiKey) {
    return input;
  }

  const content = await completeJson({
    apiKey,
    model: input.ai.model,
    prompt: searchPlanPrompt(input),
  });
  const plan = content ? parseJsonContent(content, searchPlanSchema) : undefined;
  if (!plan) {
    log.warning('AI search plan was rejected or unavailable. Continuing with structured input.');
    return input;
  }

  if (await chargeEvent(PPE_AI_SEARCH_PLAN)) {
    stats.aiPlansGenerated += 1;
    stats.ppeEventsCharged += 1;
  }

  return {
    ...input,
    query: plan.query?.trim() || input.query,
    opportunityTypes: uniqueStrings([
      ...(input.opportunityTypes ?? []),
      ...(plan.opportunityTypes ?? []),
    ]) as ParsedActorInput['opportunityTypes'],
    sectors: uniqueStrings([...(input.sectors ?? []), ...(plan.sectors ?? [])]),
    targetGroups: uniqueStrings([
      ...(input.targetGroups ?? []),
      ...(plan.targetGroups ?? []),
    ]) as ParsedActorInput['targetGroups'],
  };
}

export async function enrichOpportunities(
  records: SmeOpportunity[],
  input: ParsedActorInput,
  stats: RunStats,
): Promise<SmeOpportunity[]> {
  const apiKey = input.openaiApiKey ?? input.ai.apiKey;
  if (!input.ai.enabled || !apiKey) {
    return records;
  }

  const enriched: SmeOpportunity[] = [];

  for (const record of records) {
    try {
      const content = await completeJson({
        apiKey,
        model: input.ai.model,
        prompt: enrichmentPrompt(record, input),
      });
      const parsed = content ? parseJsonContent(content, enrichmentSchema) : undefined;
      if (!parsed) {
        enriched.push(record);
        continue;
      }

      const ai: OpportunityAi = {
        ...parsed,
        generatedAt: new Date().toISOString(),
        model: input.ai.model,
      };
      enriched.push({ ...record, ai });

      if (await chargeEvent(PPE_AI_ENRICHED_RESULT)) {
        stats.aiResultsGenerated += 1;
        stats.ppeEventsCharged += 1;
      }
    } catch (error) {
      log.warning('AI enrichment failed for one record', {
        id: record.id,
        message: error instanceof Error ? error.message : 'Unknown enrichment error',
      });
      enriched.push(record);
    }
  }

  return enriched;
}

export async function writeOpportunityReport(
  records: SmeOpportunity[],
  input: ParsedActorInput,
  stats: RunStats,
): Promise<void> {
  const apiKey = input.openaiApiKey ?? input.ai.apiKey;
  if (!input.ai.enabled || !input.ai.generateReport || !apiKey || records.length === 0) {
    return;
  }

  const content = await completeJson({
    apiKey,
    model: input.ai.model,
    prompt: reportPrompt(records, input),
  });
  const report = content ? parseJsonContent(content, reportSchema) : undefined;
  if (!report) {
    log.warning('AI opportunity report was rejected or unavailable.');
    return;
  }

  await Actor.setValue('OPPORTUNITY_REPORT', {
    ...report,
    generatedAt: new Date().toISOString(),
    model: input.ai.model,
    resultCount: records.length,
  });

  if (await chargeEvent(PPE_AI_OPPORTUNITY_REPORT)) {
    stats.aiReportsGenerated += 1;
    stats.ppeEventsCharged += 1;
  }
}
