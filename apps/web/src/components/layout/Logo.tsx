import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type LogoProps = {
  href?: string | null;
  className?: string;
  priority?: boolean;
  size?: 'nav' | 'hero';
};

const sizeClasses = {
  nav: 'h-8 w-auto max-w-[11.5rem] sm:h-9 sm:max-w-[13.5rem]',
  hero: 'h-14 w-auto max-w-[min(22rem,92vw)] sm:h-16 sm:max-w-[28rem]',
};

const sizePixels = {
  nav: { width: 168, height: 40 },
  hero: { width: 336, height: 80 },
};

export function Logo({ href = '/', className, priority = false, size = 'nav' }: LogoProps) {
  const mark = (
    <Image
      src="/images/scouvela-wordmark.png"
      alt="Scouvela"
      width={sizePixels[size].width}
      height={sizePixels[size].height}
      className={cn(sizeClasses[size], className)}
      priority={priority}
    />
  );

  if (!href) {
    return mark;
  }

  return (
    <Link href={href} className="rounded-md">
      {mark}
    </Link>
  );
}
