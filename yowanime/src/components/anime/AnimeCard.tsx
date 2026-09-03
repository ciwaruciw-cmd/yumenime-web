import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { formatScore } from '@/utils/formatDate';
import type { Anime } from '@/types/anime';

interface AnimeCardProps {
  anime: Anime;
  className?: string;
  /** Show in compact mode (smaller text, no synopsis) */
  compact?: boolean;
}

/**
 * AnimeCard — poster + title + rating + genre badges.
 * Hover: overlay with synopsis snippet + action buttons.
 * Follows card-content spec: canvas-card bg, hairline border, 8px radius.
 */
export function AnimeCard({ anime, className, compact = false }: AnimeCardProps) {
  const [imgError, setImgError] = useState(false);
  const { toggle, isInWatchlist } = useWatchlistStore();
  const inWatchlist = isInWatchlist(anime.id);

  const statusColors: Record<string, 'success' | 'sunset' | 'outline'> = {
    ongoing: 'success',
    completed: 'outline',
    upcoming: 'sunset',
  };

  const statusLabels: Record<string, string> = {
    ongoing: 'Ongoing',
    completed: 'Completed',
    upcoming: 'Upcoming',
  };

  return (
    <div
      className={clsx(
        'group relative flex flex-col bg-canvas-card border border-hairline rounded-[8px] overflow-hidden h-full cv-auto transform-gpu',
        'transition-transform duration-200 hover:border-white/20 hover:-translate-y-0.5',
        className
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-canvas-mid flex-shrink-0">
        <Link to={`/anime/${anime.slug}`} aria-label={`View details for ${anime.title}`} className="block w-full h-full">
          {!imgError ? (
            <img
              src={anime.poster}
              alt={anime.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-canvas-soft via-canvas-mid to-canvas p-3 text-center border border-hairline/50">
              <div className="w-10 h-10 rounded-full bg-sunset/15 border border-sunset/30 flex items-center justify-center mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sunset">
                  <path d="M21 12/2 12M12 2v20" strokeLinecap="round" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </div>
              <span className="text-xs font-display text-ink font-medium leading-tight line-clamp-3">{anime.title}</span>
              <span className="text-[9px] font-mono text-mute mt-1 uppercase">{anime.genres[0] || 'Anime'}</span>
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 card-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* Status badge & 18+ tag */}
        <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
          <Badge variant={statusColors[anime.status] ?? 'outline'}>
            {statusLabels[anime.status]}
          </Badge>
          {(anime.genres.includes('Hentai') || anime.rating === '18+' || anime.rating === 'Rx') && (
            <Badge variant="danger" size="sm">
              18+
            </Badge>
          )}
        </div>

        {/* Score badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/85 border border-white/10 rounded-full px-2 py-0.5 pointer-events-none">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#ff7a17">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-[10px] text-ink font-mono">{formatScore(anime.score)}</span>
        </div>

        {/* Hover actions */}
        <div className="absolute bottom-0 left-0 right-0 p-2 flex gap-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
          <Link to={`/anime/${anime.slug}/episode/1`} className="flex-1">
            <Button variant="primary" size="sm" fullWidth>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch
            </Button>
          </Link>
          <Button
            variant="outline-sm"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              toggle(anime);
            }}
            aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {inWatchlist ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <Link to={`/anime/${anime.slug}`}>
          <h3
            className={clsx(
              'font-display text-ink hover:text-ink-hover transition-colors line-clamp-2 leading-tight',
              compact ? 'text-xs' : 'text-sm'
            )}
          >
            {anime.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
          <span className="text-[10px] font-mono text-mute uppercase tracking-wider">
            {anime.year}
          </span>
          {anime.episodes > 0 && (
            <>
              <span className="text-hairline">·</span>
              <span className="text-[10px] font-mono text-mute">{anime.episodes} EP</span>
            </>
          )}
        </div>

        {/* Genre badges */}
        {!compact && (
          <div className="flex gap-1 flex-wrap mt-1">
            {anime.genres.slice(0, 2).map((g) => (
              <Badge key={g} variant="default">{g}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
