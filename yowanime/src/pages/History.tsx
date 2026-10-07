import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useHistoryStore } from '@/store/useHistoryStore';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/utils/formatDate';
import type { WatchHistoryItem } from '@/types/history';

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPlayerTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function History() {
  const { history, removeHistoryItem, clearHistory } = useHistoryStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Filter & search logic
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Filter tab check
      if (activeFilter === 'in-progress' && item.completed) return false;
      if (activeFilter === 'completed' && !item.completed) return false;

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.animeTitle.toLowerCase().includes(q);
        const matchEpTitle = item.episodeTitle?.toLowerCase().includes(q);
        const matchEpNum = String(item.episodeNumber).includes(q);
        return matchTitle || matchEpTitle || matchEpNum;
      }

      return true;
    });
  }, [history, activeFilter, searchQuery]);

  const counts = useMemo(() => {
    const inProgress = history.filter((h) => !h.completed).length;
    const completed = history.filter((h) => h.completed).length;
    return {
      all: history.length,
      inProgress,
      completed,
    };
  }, [history]);

  return (
    <div className="page-enter pt-14 sm:pt-20 min-h-screen pb-24 sm:pb-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 border-b border-hairline pb-6">
          <div>
            <span className="eyebrow-mono text-sunset font-semibold tracking-wider block mb-1">
              MY ACTIVITY
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Watch History
            </h1>
            <p className="text-body-mid text-xs sm:text-sm font-display mt-1">
              {history.length > 0
                ? `${history.length} anime saved on this device`
                : 'No watch history recorded yet'}
            </p>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmClearOpen(true)}
                className="text-red-400 hover:text-red-300 hover:border-red-500/40 text-xs cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                <span>Clear All</span>
              </Button>
            </div>
          )}
        </div>

        {/* Filter and Search Toolbar */}
        {history.length > 0 && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-canvas-soft p-1 rounded-full border border-hairline w-fit">
              <button
                onClick={() => setActiveFilter('all')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-xs font-display font-medium transition-colors cursor-pointer',
                  activeFilter === 'all'
                    ? 'bg-sunset text-white shadow-sm'
                    : 'text-body-mid hover:text-white'
                )}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setActiveFilter('in-progress')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-xs font-display font-medium transition-colors cursor-pointer',
                  activeFilter === 'in-progress'
                    ? 'bg-sunset text-white shadow-sm'
                    : 'text-body-mid hover:text-white'
                )}
              >
                In Progress ({counts.inProgress})
              </button>
              <button
                onClick={() => setActiveFilter('completed')}
                className={clsx(
                  'px-3.5 py-1.5 rounded-full text-xs font-display font-medium transition-colors cursor-pointer',
                  activeFilter === 'completed'
                    ? 'bg-sunset text-white shadow-sm'
                    : 'text-body-mid hover:text-white'
                )}
              >
                Completed ({counts.completed})
              </button>
            </div>

            {/* Search within history */}
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-mute"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-canvas-card border border-hairline focus:border-sunset text-ink text-xs rounded-full pl-9 pr-8 py-2 placeholder:text-mute focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* History Grid */}
        {filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredHistory.map((item: WatchHistoryItem) => {
              const watchTarget = `/anime/${item.animeSlug || item.animeId}/episode/${item.episodeNumber}`;
              const progressPct = Math.min(100, Math.round(item.progress));

              return (
                <div
                  key={item.animeId}
                  className="group bg-canvas-card border border-hairline hover:border-white/20 rounded-[12px] overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                >
                  {/* Thumbnail / Poster Header */}
                  <Link to={watchTarget} className="relative aspect-video bg-black block overflow-hidden">
                    <img
                      src={item.episodeThumbnail || item.animePoster}
                      alt={item.animeTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                    {/* Episode Tag */}
                    <div className="absolute top-2.5 left-2.5 bg-black/85 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-white/15">
                      EP {item.episodeNumber}
                    </div>

                    {/* Status Badge */}
                    {item.completed ? (
                      <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-display font-semibold px-2 py-0.5 rounded shadow flex items-center gap-1">
                        <span>✓</span>
                        <span>Done</span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 bg-sunset/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow">
                        {progressPct}%
                      </div>
                    )}

                    {/* Play Hover Overlay Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-11 h-11 rounded-full bg-sunset text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    </div>

                    {/* Progress Bar along bottom of thumbnail */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                      <div
                        className={clsx(
                          'h-full transition-all',
                          item.completed ? 'bg-emerald-500' : 'bg-sunset'
                        )}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-mute mb-1">
                        <span>{formatRelativeTime(item.updatedAt)}</span>
                        {item.animeType && (
                          <span className="uppercase text-[10px] bg-canvas-soft px-1.5 py-0.5 rounded border border-hairline">
                            {item.animeType}
                          </span>
                        )}
                      </div>

                      <Link to={`/anime/${item.animeSlug || item.animeId}`}>
                        <h3 className="font-display font-bold text-sm text-white hover:text-sunset transition-colors line-clamp-1 leading-snug">
                          {item.animeTitle}
                        </h3>
                      </Link>

                      <p className="text-xs text-body-mid font-display line-clamp-1 mt-0.5">
                        {item.episodeTitle || `Episode ${item.episodeNumber}`}
                      </p>

                      {/* Time Details */}
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-mute">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>
                          {formatPlayerTime(item.currentTime)} / {formatPlayerTime(item.duration || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between gap-2">
                      <Link
                        to={watchTarget}
                        className="flex-1 bg-white hover:bg-white/90 text-black text-xs font-display font-medium py-1.5 px-3 rounded-full text-center transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>{item.completed ? 'Rewatch' : 'Continue'}</span>
                      </Link>

                      <button
                        onClick={() => removeHistoryItem(item.animeId)}
                        title="Remove from history"
                        className="p-1.5 rounded-full text-mute hover:text-red-400 hover:bg-red-500/10 border border-hairline hover:border-red-500/30 transition-colors cursor-pointer"
                        aria-label="Remove history"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-canvas-card border border-hairline rounded-[16px] p-8 sm:p-14 text-center max-w-lg mx-auto my-12 flex flex-col items-center">
            <div className="w-18 h-18 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-sunset mb-4 shadow-inner">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h2 className="text-lg font-display font-bold text-white mb-2">
              {history.length === 0 ? 'No Watch History Yet' : 'No Matching Episodes'}
            </h2>

            <p className="text-xs sm:text-sm text-body-mid font-display max-w-xs mb-6">
              {history.length === 0
                ? 'Episodes you watch will be automatically saved here so you can continue anytime.'
                : 'Try changing the search term or switching the filter above.'}
            </p>

            {history.length === 0 ? (
              <Link to="/anime">
                <Button variant="primary" size="md">
                  Start Exploring Anime
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>
        )}

        {/* Clear All Confirmation Modal */}
        {isConfirmClearOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-canvas-card border border-hairline rounded-[14px] p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in-up">
              <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              <div>
                <h3 className="text-base font-display font-bold text-white">
                  Clear All History?
                </h3>
                <p className="text-xs text-body-mid font-display mt-1 leading-relaxed">
                  All saved episode records and watch progress will be permanently removed from this device.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfirmClearOpen(false)}
                >
                  Cancel
                </Button>
                <button
                  onClick={() => {
                    clearHistory();
                    setIsConfirmClearOpen(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-display font-medium px-4 py-2 rounded-full shadow transition-colors cursor-pointer"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
