import type { ParsedActorInput, SmeOpportunity } from '@scouvela/shared';

export function searchPlanPrompt(input: ParsedActorInput): string {
  return [
    'Turn this African SME opportunity search into JSON.',
    'Use only the user request. Do not invent countries or types that are not implied.',
    'Reply with JSON: {"query":"...","opportunityTypes":[],"sectors":[],"targetGroups":[],"notes":[]}',
    JSON.stringify({
      query: input.query ?? null,
      countries: input.countries,
      opportunityTypes: input.opportunityTypes ?? [],
      sectors: input.sectors ?? [],
      targetGroups: input.targetGroups ?? [],
    }),
  ].join('\n');
}

export function enrichmentPrompt(record: SmeOpportunity, input: ParsedActorInput): string {
  return [
    'Summarise and match this opportunity using only the supplied facts.',
    'Never invent eligibility, deadlines, amounts, or countries.',
    'If a fact is missing, list it in missingInformation.',
    'Reply with JSON: {"summary":"...","matchScore":0,"matchLevel":"weak","matchReasons":[],"missingInformation":[],"warnings":[]}',
    JSON.stringify({
      request: {
        query: input.query ?? null,
        countries: input.countries,
        opportunityTypes: input.opportunityTypes ?? [],
        sectors: input.sectors ?? [],
        targetGroups: input.targetGroups ?? [],
      },
      opportunity: {
        title: record.title,
        provider: record.provider,
        opportunityType: record.opportunityType,
        description: record.description,
        countries: record.countries,
        sectors: record.sectors ?? [],
        targetGroups: record.targetGroups ?? [],
        eligibility: record.eligibility ?? [],
        deadline: record.deadline ?? null,
        fundingAmount: record.fundingAmount ?? null,
        status: record.status,
        sourceUrl: record.sourceUrl,
      },
    }),
  ].join('\n');
}

export function reportPrompt(records: SmeOpportunity[], input: ParsedActorInput): string {
  return [
    'Write a short opportunity brief from these already-scraped records only.',
    'Do not invent programmes that are not in the list.',
    'Reply with JSON: {"title":"...","overview":"...","highlights":[]}',
    JSON.stringify({
      query: input.query ?? null,
      countries: input.countries,
      results: records.map((record) => ({
        title: record.title,
        provider: record.provider,
        opportunityType: record.opportunityType,
        countries: record.countries,
        status: record.status,
        deadline: record.deadline ?? null,
        sourceUrl: record.sourceUrl,
        ai: record.ai,
      })),
    }),
  ].join('\n');
}
