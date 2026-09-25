import type { ParsedActorInput, TargetGroup } from '@scouvela/shared';
import type { OpportunityCandidate } from './opportunity-detector.js';
import type { RawOpportunity } from '../sources/types.js';
import { mergeSocialText } from '../social/instagram/instagram-caption.js';
import { emptyToUndefined, uniqueNonEmpty } from '../utils/text.js';
import { isPossibleRepost } from '../verification/opportunity-verifier.js';
import { selectApplicationUrl } from './application-links.js';
import { extractDeadlineDetails, extractSupportedCountries } from './content-facts.js';
import { inferOpportunityType } from './opportunity-type.js';

const TARGET_RULES: Array<{ group: TargetGroup; pattern: RegExp }> = [
  { group: 'women-owned', pattern: /\bwomen(?:-owned)?\b/i },
  { group: 'youth-owned', pattern: /\byouth(?:-owned)?\b/i },
  { group: 'startups', pattern: /\bstartups?\b/i },
  { group: 'green-businesses', pattern: /\bgreen\b/i },
  { group: 'exporters', pattern: /\bexporters?\b/i },
];

const REGION_NAMES = ['Lagos', 'Accra', 'Nairobi', 'Kigali', 'Johannesburg', 'Cape Town'];

export function transformSocialOpportunity(
  candidate: OpportunityCandidate,
  _input: ParsedActorInput,
  submittedUrl: string,
): RawOpportunity | null {
  if (!candidate.isCandidate) {
    return null;
  }

  const content = candidate.content;
  const text = mergeSocialText(content.caption, content.visibleText);
  const description = emptyToUndefined(text);
  const provider = emptyToUndefined(content.accountName) ?? emptyToUndefined(content.accountHandle);
  if (!description || !provider) {
    return null;
  }

  const deadlineDetails = extractDeadlineDetails(description, { publishedAt: content.publishedAt });
  const countries = extractSupportedCountries(description);
  const applicationUrl = selectApplicationUrl({
    pageUrl: content.sourceUrl,
    text: description,
    links: content.externalLinks.map((url) => ({ url })),
  });
  const countryWarning =
    countries.length === 0
      ? 'No explicit programme countries were found in the post. Search-country filters were not copied into the record.'
      : undefined;

  return {
    title: titleFrom(description, provider),
    provider,
    opportunityType: inferOpportunityType(description),
    description: description.slice(0, 4000),
    countries: countries.length > 0 ? countries : undefined,
    regions: uniqueNonEmpty(
      REGION_NAMES.filter((region) => description.toLowerCase().includes(region.toLowerCase())),
    ),
    sectors: uniqueNonEmpty(sectorsIn(description)),
    targetGroups: TARGET_RULES.filter((rule) => rule.pattern.test(description)).map((rule) => rule.group),
    benefits: uniqueNonEmpty(labeledList(description, /benefits?[:\s]+([^.\n]+)/i)),
    eligibility: uniqueNonEmpty(labeledList(description, /eligibility[:\s]+([^.\n]+)/i)),
    applicationUrl,
    sourceUrl: content.sourceUrl,
    sourceName: provider,
    publishedAt: content.publishedAt,
    deadline: deadlineDetails.deadline,
    deadlineText: deadlineDetails.deadlineText,
    sourcePlatform: 'instagram',
    contentType: content.contentType,
    originalContentUrl: submittedUrl,
    discoveredFrom: uniqueNonEmpty([submittedUrl, content.sourceUrl]),
    curatedSource: false,
    reviewedProviderDomain: false,
    applicationPageConfirmed: false,
    accountName: content.accountName,
    accountHandle: content.accountHandle,
    possibleRepost: isPossibleRepost(description),
    extractionWarnings: [
      ...content.extractionWarnings,
      ...(deadlineDetails.warning ? [deadlineDetails.warning] : []),
      ...(countryWarning ? [countryWarning] : []),
    ],
  };
}

function titleFrom(description: string, provider: string): string {
  const sentence = description.split(/(?<=[.!?])\s/)[0] ?? description;
  const trimmed = sentence.replace(/\s+/g, ' ').trim();
  if (trimmed.length >= 12 && trimmed.length <= 180) {
    return trimmed;
  }

  return `${provider} opportunity`.slice(0, 180);
}

function sectorsIn(text: string): string[] {
  const rules = [
    ['fashion', /\bfashion\b/i],
    ['agriculture', /\bagriculture\b|\bagribusiness\b/i],
    ['green', /\bgreen\b|\bclimate\b/i],
    ['technology', /\btechnology\b|\btech\b/i],
  ] as const;
  return rules.filter(([, pattern]) => pattern.test(text)).map(([sector]) => sector);
}

function labeledList(text: string, pattern: RegExp): string[] {
  const match = text.match(pattern);
  return match?.[1] ? [match[1].trim()] : [];
}
