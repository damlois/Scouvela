import type { FundingStatus, FundingType, VendorVerificationStatus } from '@scouvela/shared';

export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'Federal Capital Territory',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
] as const;

export const BUSINESS_CATEGORIES = [
  'Agriculture',
  'Manufacturing',
  'Retail and trade',
  'Food and hospitality',
  'Fashion and textiles',
  'Creative and media',
  'Technology',
  'Education',
  'Health',
  'Logistics',
] as const;

export const SERVICE_CATEGORIES = [
  { value: 'tailoring', label: 'Tailoring' },
  { value: 'baking', label: 'Baking' },
  { value: 'shoemaking', label: 'Shoemaking' },
  { value: 'printing', label: 'Printing' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'photography', label: 'Photography' },
  { value: 'catering', label: 'Catering' },
  { value: 'interior-decoration', label: 'Interior decoration' },
] as const;

export const LAGOS_LOCALITIES = ['Yaba', 'Surulere', 'Ikeja', 'Lekki', 'Victoria Island'] as const;

export const MAX_RESULT_OPTIONS = [5, 10, 20, 50] as const;

export const FUNDING_TYPE_LABELS: Record<FundingType, string> = {
  loan: 'Loan',
  grant: 'Grant',
  accelerator: 'Accelerator',
  'support-programme': 'Support programme',
};

export const FUNDING_STATUS_LABELS: Record<FundingStatus, string> = {
  active: 'Active',
  'closing-soon': 'Closing Soon',
  expired: 'Expired',
  unverified: 'Unverified',
};

export const VERIFICATION_LABELS: Record<VendorVerificationStatus, string> = {
  'source-listed': 'Source Listed',
  unverified: 'Unverified',
};

export const SERVICE_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_CATEGORIES.map((category) => [category.value, category.label]),
);
