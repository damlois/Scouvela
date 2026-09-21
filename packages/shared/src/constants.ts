export const DEFAULT_MAX_RESULTS = 20;
export const HARD_MAX_RESULTS = 50;
export const CLOSING_SOON_DAYS = 14;

export const FUNDING_TYPES = ['loan', 'grant', 'accelerator', 'support-programme'] as const;
export const FUNDING_STATUSES = ['active', 'closing-soon', 'expired', 'unverified'] as const;
export const SEARCH_MODES = ['funding', 'vendors'] as const;
export const VENDOR_VERIFICATION_STATUSES = ['source-listed', 'unverified'] as const;
