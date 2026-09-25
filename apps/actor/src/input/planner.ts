import type { OpportunityType, ParsedActorInput, TargetGroup } from '@scouvela/shared';
import { emptyToUndefined } from '../utils/text.js';

const TYPE_HINTS: Array<{ pattern: RegExp; type: OpportunityType }> = [
  { pattern: /\bgrants?\b/, type: 'grant' },
  { pattern: /\bloans?\b|\bcredit\b/, type: 'loan' },
  { pattern: /\btenders?\b|\brfp\b|\brfq\b/, type: 'tender' },
  { pattern: /\bcontracts?\b|\bprocurement\b/, type: 'contract' },
  { pattern: /\baccelerators?\b/, type: 'accelerator' },
  { pattern: /\bincubators?\b/, type: 'incubator' },
  { pattern: /\bcompetitions?\b|\bchallenge\b/, type: 'competition' },
  { pattern: /\btraining\b|\bworkshop\b|\bmentorship\b/, type: 'training' },
  { pattern: /\bexport\b|\btrade\b/, type: 'export' },
];

const GROUP_HINTS: Array<{ pattern: RegExp; group: TargetGroup }> = [
  { pattern: /\bwomen[- ]owned\b|\bwomen\b/, group: 'women-owned' },
  { pattern: /\byouth\b/, group: 'youth-owned' },
  { pattern: /\bdisabilit|\bpwd\b/, group: 'disability-inclusive' },
  { pattern: /\brural\b/, group: 'rural-businesses' },
  { pattern: /\bagri|\bfarm/, group: 'agribusinesses' },
  { pattern: /\bfashion\b|\bcreative\b/, group: 'creative-businesses' },
  { pattern: /\bgreen\b|\bclimate\b/, group: 'green-businesses' },
  { pattern: /\btech\b|\bdigital\b/, group: 'technology-businesses' },
  { pattern: /\bexport/, group: 'exporters' },
];

const SECTOR_HINTS: Array<{ pattern: RegExp; sector: string }> = [
  { pattern: /\bfashion\b/, sector: 'fashion' },
  { pattern: /\bcreative\b/, sector: 'creative-industries' },
  { pattern: /\bagri|\bfarm/, sector: 'agriculture' },
  { pattern: /\bgreen\b|\bclimate\b|\bcleantech\b/, sector: 'green' },
  { pattern: /\btech\b|\bdigital\b/, sector: 'technology' },
];

export function planSearchFromQuery(input: ParsedActorInput): ParsedActorInput {
  const query = emptyToUndefined(input.query)?.toLowerCase();
  if (!query) {
    return input;
  }

  const types = new Set(input.opportunityTypes ?? []);
  const groups = new Set(input.targetGroups ?? []);
  const sectors = new Set(input.sectors ?? []);

  for (const hint of TYPE_HINTS) {
    if (hint.pattern.test(query)) {
      types.add(hint.type);
    }
  }

  for (const hint of GROUP_HINTS) {
    if (hint.pattern.test(query)) {
      groups.add(hint.group);
    }
  }

  for (const hint of SECTOR_HINTS) {
    if (hint.pattern.test(query)) {
      sectors.add(hint.sector);
    }
  }

  return {
    ...input,
    opportunityTypes: types.size > 0 ? [...types] : input.opportunityTypes,
    targetGroups: groups.size > 0 ? [...groups] : input.targetGroups,
    sectors: sectors.size > 0 ? [...sectors] : input.sectors,
  };
}
