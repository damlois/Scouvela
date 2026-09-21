export const USER_TYPE_STORAGE_KEY = 'scouvela-user-type';

export const USER_TYPES = ['business', 'individual'] as const;

export type UserType = (typeof USER_TYPES)[number];

export function parseUserType(value: string | null): UserType | null {
  if (value === 'business' || value === 'individual') {
    return value;
  }

  return null;
}

export function defaultSearchPath(userType: UserType | null): '/funding' | '/vendors' {
  return userType === 'individual' ? '/vendors' : '/funding';
}
