import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlistStore, type WatchStatus, WATCH_STATUS_LABELS, WATCH_STATUS_COLORS } from '@/store/useWatchlistStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

const ALL_STATUSES: WatchStatus[] = ['watching', 'plan_to_watch', 'completed', 'on_hold', 'dropped'];

const STATUS_ICONS: Record<WatchStatus, string> = {
  watching: '▶',
  plan_to_watch: '🔖',
  completed: '✓',
  on_hold: '⏸',
  dropped: '✕',
};

/**
 * Watchlist — MAL-style categorized list with user ratings.
 */
export default function Watchlist() {
  const { isAuthenticated } = useAuthStore();
  const { entries, remove } = useWatchlistStore();
  const [activeTab, setActiveTab] = useState<WatchStatus | 'all'>('all');

  const count = Object.keys(entries).length;

  const allEntries = Object.values(entries);

  const filteredEntries = activeTab === 'all'
    ? allEntries
    : allEntries.filter((e) => e.status === activeTab);

  const countByStatus = (s: WatchStatus) => allEntries.filter((e) => e.status === s).length;

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="page-enter pt-14 sm:pt-20 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="display-sm text-ink mb-2">My Anime List</h1>
        <p className="text-body text-sm font-display mb-5 max-w-xs">
          Sign in to track and categorize your anime — just like MyAnimeList.
        </p>
        <div className="flex gap-3">
          <Link to="/login"><Button variant="primary" size="lg">Sign In</Button></Link>
          <Link to="/register"><Button variant="outline" size="lg">Sign Up</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter pt-14 sm:pt-20 min-h-screen pb-24 sm:pb-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <span className="eyebrow-mono text-mute block mb-1">MY LIST</span>
          <div className="flex items-end justify-between">
            <h1 className="display-md text-ink">Anime List</h1>
            <p className="text-body text-sm font-display">{count} total</p>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`shrink-0 text-xs font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-black border-white'
                : 'border-hairline text-mute hover:text-ink hover:border-white/30'
            }`}
          >
            All ({count})
          </button>
          {ALL_STATUSES.map((s) => {
            const c = countByStatus(s);
            if (c === 0 && activeTab !== s) return null;
            return (
              <button
                key={s}
                onClick={() => setActiveTab(s)}
                className={`shrink-0 text-xs font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  activeTab === s
                    ? `font-semibold border ${WATCH_STATUS_COLORS[s]}`
                    : 'border-hairline text-mute hover:text-ink hover:border-white/30'
                }`}
              >
                {STATUS_ICONS[s]} {WATCH_STATUS_LABELS[s]} ({c})
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {count === 0 ? (
              <>
                <p className="text-body text-sm font-display mb-1">Your list is empty</p>
                <p className="text-mute text-xs font-display mb-5">Add anime from the detail page to get started</p>
                <Link to="/anime"><Button variant="outline">Explore Anime</Button></Link>
              </>
            ) : (
              <p className="text-body text-sm font-display">No anime in this category</p>
            )}
          </div>
        ) : (
          /* Anime grid (table on larger screens) */
          <div className="space-y-2">
            {/* Table header — desktop only */}
            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-3 py-2 text-[10px] font-mono text-mute uppercase tracking-wider border-b border-hairline">
              <span>#</span>
              <span>Anime</span>
              <span className="text-center">Status</span>
              <span></span>
            </div>

            {filteredEntries.map((entry, idx) => (
              <div
                key={entry.anime.id}
                className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto] gap-3 sm:gap-4 items-center bg-canvas-card border border-transparent hover:border-white/10 rounded-xl px-3 py-3 transition-all group"
              >
                {/* Index */}
                <span className="text-[11px] font-mono text-mute w-6 text-center shrink-0">{idx + 1}</span>

                {/* Poster + title */}
                <Link to={`/anime/${entry.anime.slug || entry.anime.id}`} className="flex items-center gap-3 min-w-0">
                  <img
                    src={entry.anime.poster}
                    alt={entry.anime.title}
                    className="w-9 h-12 sm:w-10 sm:h-14 rounded-md object-cover shrink-0 border border-white/10"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-display font-medium text-ink group-hover:text-sunset transition-colors line-clamp-1">
                      {entry.anime.title}
                    </p>
                    <p className="text-[11px] font-mono text-mute mt-0.5">
                      {entry.anime.year} · {entry.anime.studio}
                    </p>
                    {/* Mobile: show status inline */}
                    <span className={`sm:hidden inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full border mt-1 ${WATCH_STATUS_COLORS[entry.status]}`}>
                      {STATUS_ICONS[entry.status]} {WATCH_STATUS_LABELS[entry.status]}
                    </span>
                  </div>
                </Link>

                {/* Status badge — desktop */}
                <div className="hidden sm:flex justify-center">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${WATCH_STATUS_COLORS[entry.status]}`}>
                    {STATUS_ICONS[entry.status]} {WATCH_STATUS_LABELS[entry.status]}
                  </span>
                </div>

                {/* Remove button — desktop */}
                <button
                  onClick={() => remove(entry.anime.id)}
                  className="hidden sm:flex text-mute hover:text-red-400 text-xs font-mono px-2 py-1 rounded border border-transparent hover:border-red-500/30 hover:bg-red-500/10 transition-all cursor-pointer"
                  title="Remove from watchlist"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
