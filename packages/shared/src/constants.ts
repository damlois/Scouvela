export const DEFAULT_MAX_RESULTS = 20;
export const HARD_MAX_RESULTS = 50;
export const ACTOR_DEFAULT_MAX_RESULTS = 20;
export const ACTOR_HARD_MAX_RESULTS = 50;
export const CLOSING_SOON_DAYS = 14;

export const FUNDING_TYPES = ['loan', 'grant', 'accelerator', 'support-programme'] as const;
export const FUNDING_STATUSES = ['active', 'closing-soon', 'expired', 'unverified'] as const;
export const SEARCH_MODES = ['funding', 'vendors'] as const;
export const VENDOR_VERIFICATION_STATUSES = ['source-listed', 'unverified'] as const;

export const OPPORTUNITY_TYPES = [
  'grant',
  'loan',
  'funding',
  'contract',
  'tender',
  'procurement',
  'accelerator',
  'incubator',
  'competition',
  'training',
  'mentorship',
  'market-access',
  'export',
  'equipment-support',
  'technology-credit',
  'business-support',
  'other',
] as const;

export const OPPORTUNITY_STATUSES = [
  'active',
  'closing-soon',
  'expired',
  'ongoing',
  'unverified',
] as const;

export const OPPORTUNITY_CONFIDENCE = ['high', 'medium', 'low'] as const;

export const PROVIDER_TYPES = [
  'government',
  'bank',
  'dfi',
  'foundation',
  'ngo',
  'corporate',
  'accelerator',
  'university',
  'procurement-portal',
  'other',
] as const;

export const TARGET_GROUPS = [
  'all-smes',
  'women-owned',
  'youth-owned',
  'disability-inclusive',
  'rural-businesses',
  'startups',
  'informal-businesses',
  'exporters',
  'social-enterprises',
  'agribusinesses',
  'creative-businesses',
  'technology-businesses',
  'green-businesses',
] as const;

export const BUSINESS_STAGES = ['idea', 'early-stage', 'growth', 'export-ready'] as const;

export const MVP_COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Rwanda'] as const;

export const SEARCH_COUNTRIES = ['Africa-wide', ...MVP_COUNTRIES] as const;

export const AI_PROVIDERS = ['openai'] as const;

export const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
