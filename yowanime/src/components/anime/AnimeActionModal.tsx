import { useState } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useActionSheetStore } from '@/store/useActionSheetStore';
import { useWatchlistStore } from '@/store/useWatchlistStore';

export function AnimeActionModal() {
  const { isOpen, selectedAnime, closeMenu } = useActionSheetStore();
  const { toggle, isInWatchlist } = useWatchlistStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !selectedAnime) return null;

  const inWatchlist = isInWatchlist(selectedAnime.id);

  const handleShare = async () => {
    const url = `${window.location.origin}/anime/${selectedAnime.slug || selectedAnime.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedAnime.title,
          text: `Nonton anime ${selectedAnime.title} di Yumenime!`,
          url,
        });
        closeMenu();
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        closeMenu();
      }, 1200);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closeMenu}
      />

      {/* Bottom Sheet */}
      <div className="relative z-10 w-full max-w-lg mx-auto bg-[#141418] border-t border-white/10 rounded-t-[20px] p-4 sm:p-5 shadow-2xl animate-slide-up safe-area-bottom">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Anime Summary Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <img
            src={selectedAnime.poster}
            alt={selectedAnime.title}
            className="w-12 h-16 rounded-[4px] object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <h4 className="font-sans font-bold text-sm text-white line-clamp-1">
              {selectedAnime.title}
            </h4>
            <p className="text-xs text-[#9b9ba6] mt-0.5 font-sans">
              Dub | Sub • {selectedAnime.genres.slice(0, 2).join(', ') || 'Anime'}
            </p>
            <p className="text-[11px] text-[#ff640a] font-mono mt-0.5">
              ★ {selectedAnime.score ? (selectedAnime.score / 10).toFixed(1) : '8.5'}
            </p>
          </div>
          <button
            onClick={closeMenu}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Action Menu List */}
        <div className="py-2 space-y-1">
          {/* Watchlist toggle */}
          <button
            onClick={() => {
              toggle(selectedAnime);
            }}
            className={clsx(
              'w-full flex items-center gap-3.5 px-3 py-3 rounded-[10px] text-sm font-medium transition-colors cursor-pointer text-left',
              inWatchlist
                ? 'text-[#ff640a] bg-[#ff640a]/10 hover:bg-[#ff640a]/15'
                : 'text-white hover:bg-white/5'
            )}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={inWatchlist ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
            <span>{inWatchlist ? 'Remove from My Lists' : 'Add to My Lists'}</span>
          </button>

          {/* Start Watching */}
          <Link
            to={`/anime/${selectedAnime.slug || selectedAnime.id}/episode/1`}
            onClick={closeMenu}
            className="w-full flex items-center gap-3.5 px-3 py-3 rounded-[10px] text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#ff640a]">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>Start Watching Episode 1</span>
          </Link>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3.5 px-3 py-3 rounded-[10px] text-sm font-medium text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>{copied ? '✓ Link Copied to Clipboard!' : 'Share'}</span>
          </button>

          {/* View Details */}
          <Link
            to={`/anime/${selectedAnime.slug || selectedAnime.id}`}
            onClick={closeMenu}
            className="w-full flex items-center gap-3.5 px-3 py-3 rounded-[10px] text-sm font-medium text-white hover:bg-white/5 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>View Series Details</span>
          </Link>
        </div>

        {/* Close Button */}
        <button
          onClick={closeMenu}
          className="w-full mt-2 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-full text-center text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
