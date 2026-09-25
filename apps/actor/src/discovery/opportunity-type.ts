import type { OpportunityType } from '@scouvela/shared';

const TYPE_RULES: Array<{ type: OpportunityType; pattern: RegExp }> = [
  { type: 'tender', pattern: /\b(?:call for )?tenders?\b/i },
  { type: 'procurement', pattern: /\bprocurement\b/i },
  { type: 'grant', pattern: /\bgrants?\b|\bnon-refundable\b/i },
  { type: 'loan', pattern: /\bloans?\b/i },
  { type: 'funding', pattern: /\bseed capital\b|\bfunding\b/i },
  { type: 'accelerator', pattern: /\baccelerators?\b/i },
  { type: 'incubator', pattern: /\bincubators?\b/i },
  { type: 'competition', pattern: /\bcompetition\b/i },
  { type: 'training', pattern: /\b(?:business\s+)?training programmes?\b|\b(?:business\s+)?training programs?\b|\bbusiness training\b/i },
  { type: 'mentorship', pattern: /\bmentorship\b/i },
  { type: 'equipment-support', pattern: /\bequipment support\b/i },
  { type: 'market-access', pattern: /\bmarket access\b/i },
  { type: 'export', pattern: /\bexport support\b/i },
  { type: 'business-support', pattern: /\bfellowship\b|\bapplications? (?:are )?open\b|\bcall for applications\b/i },
];

export function inferOpportunityType(text: string): OpportunityType {
  const lowered = text.toLowerCase();
  const hasFunding =
    /\bseed capital\b/.test(lowered) ||
    /\bnon-refundable\b/.test(lowered) ||
    /\bfunding\b/.test(lowered) ||
    /\bgrants?\b/.test(lowered);

  if (hasFunding && (/\btraining\b/.test(lowered) || /\bmentorship\b/.test(lowered))) {
    if (/\bgrants?\b/.test(lowered) || /\bnon-refundable\b/.test(lowered)) {
      return 'grant';
    }

    return 'funding';
  }

  return TYPE_RULES.find((rule) => rule.pattern.test(text))?.type ?? 'other';
}
