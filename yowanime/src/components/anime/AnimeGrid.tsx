import { useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { AnimeCard } from './AnimeCard';
import { AnimeCardSkeleton } from '@/components/ui/SkeletonLoader';
import type { Anime } from '@/types/anime';

interface AnimeGridProps {
  animes: Anime[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyMessage?: string;
  columns?: 'auto' | 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * Responsive anime grid with infinite scroll support.
 * Uses IntersectionObserver to trigger onLoadMore.
 */
export function AnimeGrid({
  animes,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  emptyMessage = 'Tidak ada anime ditemukan.',
  className,
}: AnimeGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll — observe sentinel div
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !onLoadMore) return;

    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver, onLoadMore]);

  // Initial loading state
  if (isLoading && animes.length === 0) {
    return <AnimeCardSkeleton count={12} />;
  }

  // Empty state
  if (!isLoading && animes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-body text-sm font-display">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        role="list"
        aria-label="Daftar anime"
      >
        {animes.map((anime) => (
          <div key={anime.id} role="listitem" className="animate-fade-in-up">
            <AnimeCard anime={anime} />
          </div>
        ))}
      </div>

      {/* Load more skeleton rows */}
      {isLoading && animes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          <AnimeCardSkeleton count={5} />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {onLoadMore && <div ref={sentinelRef} className="h-4" aria-hidden="true" />}

      {/* No more indicator */}
      {!hasMore && animes.length > 0 && !isLoading && onLoadMore && (
        <p className="text-center text-xs text-mute font-mono uppercase tracking-wider py-4">
          — Semua anime telah dimuat —
        </p>
      )}
    </div>
  );
}
