import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import type { Episode } from '@/types/episode';
import { formatDuration } from '@/utils/formatDate';

interface SidebarProps {
  episodes: Episode[];
  currentEpisodeNumber: number;
  animeSlug: string;
  isOpen: boolean;
  onClose?: () => void;
}

/**
 * Episode sidebar for the WatchEpisode page.
 * Collapsible on mobile via isOpen prop.
 */
export function Sidebar({ episodes, currentEpisodeNumber, animeSlug, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          'bg-canvas-soft border border-hairline rounded-[8px] overflow-hidden',
          // Mobile: slide in from right
          'fixed right-0 top-14 bottom-0 w-72 z-40 transition-transform duration-300 lg:static lg:w-full lg:translate-x-0',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Episode list"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <span className="eyebrow-mono text-mute">EPISODE LIST</span>
          <span className="text-xs text-mute font-mono">{episodes.length} EP</span>
        </div>

        {/* Episode list */}
        <div className="overflow-y-auto h-full pb-16">
          {episodes.map((ep) => {
            const isActive = ep.number === currentEpisodeNumber;
            return (
              <Link
                key={ep.id}
                to={`/anime/${animeSlug}/episode/${ep.number}`}
                onClick={onClose}
                className={clsx(
                  'flex items-start gap-3 px-4 py-3 border-b border-hairline/50 transition-colors group',
                  isActive
                    ? 'bg-white/8 border-l-2 border-l-sunset'
                    : 'hover:bg-white/5'
                )}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-20 h-12 rounded overflow-hidden bg-canvas-mid">
                  {ep.thumbnail ? (
                    <img
                      src={ep.thumbnail}
                      alt={`Episode ${ep.number}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={clsx(
                    'text-xs font-display leading-tight truncate',
                    isActive ? 'text-ink' : 'text-body group-hover:text-ink'
                  )}>
                    {ep.title || `Episode ${ep.number}`}
                  </p>
                  <p className="text-[10px] text-mute font-mono mt-0.5">
                    EP {ep.number} · {formatDuration(ep.duration)}
                  </p>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="shrink-0 mt-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-sunset">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
