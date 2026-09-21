'use client';

import { useAudience } from '@/components/audience/AudienceProvider';
import { cn } from '@/lib/utils';
import type { UserType } from '@/lib/user-type';

const options: Array<{ value: UserType; label: string; shortLabel: string }> = [
  { value: 'business', label: 'Business owner', shortLabel: 'Business' },
  { value: 'individual', label: 'Need a service', shortLabel: 'Visitor' },
];

export function AudienceSwitch({
  variant = 'nav',
}: {
  variant?: 'nav' | 'menu';
}) {
  const { userType, setUserType } = useAudience();

  if (!userType) {
    return null;
  }

  const isMenu = variant === 'menu';

  return (
    <div className={cn('flex flex-col gap-2', isMenu && 'w-full')}>
      <p className={cn(isMenu ? 'text-sm font-semibold text-text' : 'sr-only')}>I am a</p>
      <div
        role="group"
        aria-label="Choose whether you are a business owner"
        className={cn('grid grid-cols-2 rounded-md border-2 border-primary p-0.5', isMenu && 'w-full')}
      >
        {options.map((option) => {
          const selected = userType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              aria-label={option.label}
              className={cn(
                'min-h-11 whitespace-nowrap rounded px-2 text-sm font-semibold sm:px-3',
                selected ? 'bg-primary text-white' : 'bg-surface text-primary hover:bg-background',
              )}
              onClick={() => setUserType(option.value)}
            >
              {isMenu ? option.label : option.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
