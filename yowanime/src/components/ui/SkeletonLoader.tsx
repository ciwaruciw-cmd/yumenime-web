import { clsx } from 'clsx';

type SkeletonVariant = 'text' | 'card' | 'circle' | 'hero' | 'episode';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  count?: number;  // for repeated skeletons
}

/**
 * Skeleton loader — uses shimmer animation from globals.css.
 * Use during data fetch to show content placeholders.
 */
export function Skeleton({ variant = 'text', className, count = 1 }: SkeletonProps) {
  const base = 'skeleton rounded-[8px]';

  const variants: Record<SkeletonVariant, string> = {
    text:    'h-4 w-full',
    card:    'aspect-[2/3] w-full',
    circle:  'rounded-full w-10 h-10',
    hero:    'h-[560px] w-full rounded-none',
    episode: 'h-16 w-full',
  };

  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <>
        {items.map((_, i) => (
          <div key={i} className="space-y-2">
            <div className={clsx(base, variants.card, className)} />
            <div className={clsx(base, 'h-4 w-3/4')} />
            <div className={clsx(base, 'h-3 w-1/2')} />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((_, i) => (
        <div key={i} className={clsx(base, variants[variant], className)} />
      ))}
    </>
  );
}

// Grid of card skeletons
export function AnimeCardSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <Skeleton variant="card" count={count} />
    </div>
  );
}
