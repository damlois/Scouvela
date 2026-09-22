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

  const wrapperClass = isMenu
    ? 'grid w-full grid-cols-2 rounded-md border-2 border-primary p-0.5'
    : 'inline-grid grid-cols-2 gap-0.5 rounded-md border border-border bg-background p-1';

  const helperText = "Changes what's shown, not what you can access.";

  return (
    <div className={cn('flex flex-col gap-2', isMenu && 'w-full')}>
      <p className={cn(isMenu ? 'text-sm font-semibold text-text' : 'sr-only')}>I am a</p>
      {isMenu ? <p className="text-xs text-muted">{helperText}</p> : null}
      <div
        role="group"
        aria-label="Choose whether you are a business owner"
        title={helperText}
        className={wrapperClass}
      >
        {options.map((option) => {
          const selected = userType === option.value;
          const buttonClass = isMenu
            ? cn(
                'min-h-11 whitespace-nowrap rounded px-2 text-sm font-semibold transition-colors sm:px-3',
                selected ? 'bg-primary text-white' : 'bg-surface text-primary hover:bg-background',
              )
            : cn(
                'min-h-9 whitespace-nowrap rounded px-3 py-1.5 text-sm font-semibold transition-colors',
                selected ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-primary',
              );
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              aria-label={option.label}
              className={buttonClass}
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
