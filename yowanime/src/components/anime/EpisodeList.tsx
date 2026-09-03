import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { formatDuration } from '@/utils/formatDate';
import type { Episode } from '@/types/episode';

interface EpisodeListProps {
  episodes: Episode[];
  animeSlug: string;
  currentEpisodeNumber?: number;
  /** Compact list for detail page */
  compact?: boolean;
}

/**
 * Vertical episode list for AnimeDetail and WatchEpisode pages.
 */
export function EpisodeList({ episodes, animeSlug, currentEpisodeNumber, compact = false }: EpisodeListProps) {
  if (episodes.length === 0) {
    return (
      <p className="text-mute text-sm font-display py-4">No episodes available.</p>
    );
  }

  return (
    <div className="space-y-1" role="list" aria-label="Episode list">
      {episodes.map((ep) => {
        const isActive = ep.number === currentEpisodeNumber;

        return (
          <Link
            key={ep.id}
            to={`/anime/${animeSlug}/episode/${ep.number}`}
            role="listitem"
            className={clsx(
              'flex items-center gap-3 rounded-[8px] transition-colors duration-150 group',
              compact ? 'px-3 py-2' : 'px-4 py-3',
              isActive
                ? 'bg-white/8 border border-white/10'
                : 'hover:bg-white/5 border border-transparent'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Episode number */}
            <div
              className={clsx(
                'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono',
                isActive
                  ? 'bg-sunset text-white'
                  : 'bg-canvas-mid text-mute group-hover:text-body'
              )}
            >
              {ep.number}
            </div>

            {/* Thumbnail (non-compact only) */}
            {!compact && ep.thumbnail && (
              <div className="shrink-0 w-20 h-12 rounded overflow-hidden bg-canvas-mid relative">
                <img
                  src={ep.thumbnail}
                  alt={ep.title || `Episode ${ep.number}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Hide broken image gracefully
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className={clsx(
                'font-display leading-tight truncate',
                compact ? 'text-xs' : 'text-sm',
                isActive ? 'text-ink' : 'text-body group-hover:text-ink'
              )}>
                {ep.title || `Episode ${ep.number}`}
              </p>
              <p className="text-[10px] text-mute font-mono mt-0.5">
                {formatDuration(ep.duration)}
                {ep.aired ? ` · ${new Date(ep.aired).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
              </p>
            </div>

            {/* Play icon */}
            <div className={clsx(
              'shrink-0 transition-colors',
              isActive ? 'text-sunset' : 'text-mute group-hover:text-body'
            )}>
              {isActive ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
