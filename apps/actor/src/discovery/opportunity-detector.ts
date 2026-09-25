import type { SocialContent } from '../social/types.js';

export interface OpportunityCandidate {
  isCandidate: boolean;
  confidence: number;
  matchedSignals: string[];
  negativeSignals: string[];
  content: SocialContent;
}

type SignalGroup = 'application' | 'benefit' | 'audience';

const APPLICATION_SIGNALS = [
  'apply now',
  'apply before',
  'apply here',
  'applications are open',
  'applications open',
  'application is open',
  'call for applications',
  'registration open',
  'submit an application',
  'application deadline',
  'deadline to apply',
  'closing date',
  'last day',
  'days left',
  'hours left',
  'day left',
  'hour left',
  'deadline',
  'apply',
] as const;

const BENEFIT_SIGNALS = [
  'non-refundable funding',
  'non-refundable seed capital',
  'seed capital',
  'equipment support',
  'business training',
  'market access',
  'export support',
  'mentorship',
  'accelerator',
  'incubator',
  'fellowship',
  'competition',
  'procurement',
  'contract opportunity',
  'tender',
  'funding',
  'grant',
  'contract',
] as const;

const AUDIENCE_SIGNALS = [
  'women-owned',
  'youth-owned',
  'small businesses',
  'small business',
  'entrepreneurs',
  'entrepreneur',
  'founders',
  'founder',
  'startups',
  'startup',
  'smes',
  'sme',
] as const;

const NEGATIVE_SIGNALS = [
  'shop now',
  'buy now',
  'discount',
  'sale ends',
  'outfit of the day',
  'happy birthday',
  'on vacation',
  'new product launch',
  'follow us for more',
  'stakeholder roundtable',
  'stakeholder engagement',
  'roundtable with',
] as const;

export function detectOpportunity(content: SocialContent): OpportunityCandidate {
  const assessed = assessOpportunityText(
    [content.caption, content.visibleText].filter(Boolean).join('\n'),
    content.hashtags,
  );

  return { ...assessed, content };
}

export function assessOpportunityText(
  text: string,
  _hashtags: string[] = [],
): Omit<OpportunityCandidate, 'content'> {
  const prose = text.replace(/#[A-Za-z0-9_]+/g, ' ').toLowerCase();
  const applicationHits = signalsIn(prose, APPLICATION_SIGNALS);
  const benefitHits = signalsIn(prose, BENEFIT_SIGNALS);
  const audienceHits = signalsIn(prose, AUDIENCE_SIGNALS);
  const negativeSignals = signalsIn(prose, NEGATIVE_SIGNALS);

  const matchedSignals = unique([...applicationHits, ...benefitHits, ...audienceHits]);
  const groupsPresent: SignalGroup[] = [];
  if (applicationHits.length > 0) {
    groupsPresent.push('application');
  }
  if (benefitHits.length > 0) {
    groupsPresent.push('benefit');
  }
  if (audienceHits.length > 0) {
    groupsPresent.push('audience');
  }

  let confidence = 0;
  confidence += Math.min(applicationHits.length, 2) * 20;
  confidence += Math.min(benefitHits.length, 3) * 15;
  confidence += Math.min(audienceHits.length, 2) * 10;

  if (applicationHits.length > 0 && benefitHits.length > 0) {
    confidence += 25;
  } else if (benefitHits.length > 0 && audienceHits.length > 0) {
    confidence += 15;
  } else if (applicationHits.length > 0 && audienceHits.length > 0) {
    confidence += 15;
  }

  if (groupsPresent.length >= 3) {
    confidence += 10;
  }

  confidence -= Math.min(negativeSignals.length, 2) * 35;
  confidence = Math.max(0, Math.min(100, confidence));

  const hasProseSignal = matchedSignals.length > 0;
  const isCandidate =
    hasProseSignal &&
    confidence >= 45 &&
    negativeSignals.length === 0 &&
    groupsPresent.length >= 2;

  return {
    isCandidate,
    confidence: hasProseSignal ? confidence : 0,
    matchedSignals: hasProseSignal ? matchedSignals : [],
    negativeSignals,
  };
}

function signalsIn(text: string, signals: readonly string[]): string[] {
  return signals.filter((signal) => {
    if (signal.includes(' ')) {
      return text.includes(signal);
    }

    return new RegExp(`\\b${escapeRegExp(signal)}\\b`, 'i').test(text);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
