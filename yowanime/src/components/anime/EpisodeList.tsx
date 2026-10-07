import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { formatDuration } from '@/utils/formatDate';
import { useHistoryStore } from '@/store/useHistoryStore';
import type { Episode } from '@/types/episode';

interface EpisodeListProps {
  episodes: Episode[];
  animeSlug: string;
  currentEpisodeNumber?: number;
  /** Compact list for detail page */
  compact?: boolean;
  /** Fallback poster image when episode has no specific thumbnail */
  animePoster?: string;
  /** Optional callback when user clicks download button on an episode */
  onDownloadEpisode?: (episode: Episode) => void;
}

/**
 * Vertical episode list for AnimeDetail and WatchEpisode pages.
 */
export function EpisodeList({
  episodes,
  animeSlug,
  currentEpisodeNumber,
  compact = false,
  animePoster,
  onDownloadEpisode,
}: EpisodeListProps) {
  const { history } = useHistoryStore();

  if (episodes.length === 0) {
    return (
      <p className="text-mute text-sm font-display py-4">No episodes available.</p>
    );
  }

  return (
    <div className="space-y-1" role="list" aria-label="Episode list">
      {episodes.map((ep) => {
        const isActive = ep.number === currentEpisodeNumber;
        const hist = history.find(
          (h) => h.animeSlug === animeSlug || h.animeId === animeSlug
        );
        const isCompleted = Boolean(
          hist?.completedEpisodes?.includes(ep.number) ||
          (hist?.episodeNumber === ep.number && hist?.completed)
        );
        const hasProgress = hist?.episodeNumber === ep.number && !isCompleted && hist.progress > 0;

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
                'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono relative',
                isActive
                  ? 'bg-sunset text-white'
                  : isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-canvas-mid text-mute group-hover:text-body'
              )}
            >
              {isCompleted && !isActive ? '✓' : ep.number}
            </div>

            {/* Thumbnail (non-compact only) */}
            {!compact && (
              <div className="shrink-0 w-20 h-12 rounded overflow-hidden bg-canvas-mid relative border border-white/5">
                <img
                  src={ep.thumbnail || animePoster || ''}
                  alt={ep.title || `Episode ${ep.number}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                  onError={(e) => {
                    // Hide broken image gracefully
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
                <span className="absolute bottom-1 right-1 text-[8px] font-mono font-bold px-1 rounded bg-black/75 text-white/90 pointer-events-none">
                  EP {ep.number}
                </span>
                {hasProgress && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                    <div
                      className="h-full bg-sunset"
                      style={{ width: `${Math.min(100, Math.round(hist.progress))}%` }}
                    />
                  </div>
                )}
                {isCompleted && (
                  <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1 rounded">
                    ✓
                  </span>
                )}
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
              <p className="text-[10px] text-mute font-mono mt-0.5 flex items-center gap-1.5">
                <span>{formatDuration(ep.duration)}</span>
                {ep.aired ? ` · ${new Date(ep.aired).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                {hasProgress && (
                  <span className="text-sunset font-medium">· {Math.round(hist.progress)}%</span>
                )}
                {isCompleted && (
                  <span className="text-emerald-400 font-medium">· Done</span>
                )}
              </p>
            </div>

            {/* Quick Download button */}
            {onDownloadEpisode && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDownloadEpisode(ep);
                }}
                title={`Unduh Episode ${ep.number}`}
                className="shrink-0 p-1.5 rounded-full text-mute hover:text-sunset hover:bg-sunset/15 transition-all opacity-40 group-hover:opacity-100 cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}

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
