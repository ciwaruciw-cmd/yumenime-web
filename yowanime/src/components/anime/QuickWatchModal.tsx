import { useState, useEffect, useMemo } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { EpisodeList } from './EpisodeList';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getEpisodes } from '@/services/animeService';
import type { Anime } from '@/types/anime';
import type { Episode } from '@/types/episode';

interface QuickWatchModalProps {
  anime: Anime | null;
  isOpen: boolean;
  onClose: () => void;
  initialEpisodeNumber?: number;
}

/**
 * Quick Watch Modal / Right Drawer — opens instantly when user clicks "Tonton".
 * Lets the user watch the video immediately without leaving the page.
 */
export function QuickWatchModal({
  anime,
  isOpen,
  onClose,
  initialEpisodeNumber = 1,
}: QuickWatchModalProps) {
  const [currentEpNum, setCurrentEpNum] = useState(initialEpisodeNumber);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  useEffect(() => {
    if (!anime) {
      setEpisodes([]);
      return;
    }
    getEpisodes(anime.id).then((eps) => {
      setEpisodes(eps);
    });
  }, [anime]);

  const currentEpisode = useMemo(
    () => episodes.find((e) => e.number === currentEpNum) ?? episodes[0],
    [episodes, currentEpNum]
  );

  if (!isOpen || !anime || !currentEpisode) return null;

  const hasNext = currentEpNum < episodes.length;
  const hasPrev = currentEpNum > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Video Modal Container */}
      <div className="relative w-full max-w-5xl bg-canvas-soft border border-hairline rounded-[8px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[92vh] animate-fade-in-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-canvas shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <span className="eyebrow-mono text-sunset shrink-0">STREAMING</span>
            <span className="text-hairline">·</span>
            <p className="text-sm text-ink font-display truncate font-medium">{anime.title}</p>
            <Badge variant="sunset" size="sm">EP {currentEpNum}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close video player"
            className="shrink-0 p-1.5 h-auto rounded-full"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </Button>
        </div>

        {/* Video Player + Playlist grid */}
        <div className="overflow-y-auto flex-1 p-4 grid lg:grid-cols-[280px_1fr] gap-4">
          {/* Episode List Playlist (LEFT SIDE on desktop) */}
          <div className="order-2 lg:order-1 bg-canvas border border-hairline rounded-[8px] p-3 flex flex-col h-[280px] lg:h-auto overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline shrink-0">
              <span className="eyebrow-mono text-mute">EPISODE LIST</span>
              <span className="text-xs text-mute font-mono">{episodes.length} EP</span>
            </div>
            <div className="overflow-y-auto flex-1 space-y-1">
              {episodes.map((ep) => {
                const isActive = ep.number === currentEpNum;
                return (
                  <button
                    key={ep.id}
                    onClick={() => setCurrentEpNum(ep.number)}
                    className={`w-full text-left flex items-center gap-3 p-2 rounded-[6px] transition-colors ${
                      isActive ? 'bg-white/10 border-l-2 border-sunset text-ink' : 'hover:bg-white/5 text-body'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono shrink-0 ${
                      isActive ? 'bg-sunset text-white' : 'bg-canvas-mid text-mute'
                    }`}>
                      {ep.number}
                    </span>
                    <span className="text-xs font-display truncate flex-1">{ep.title || `Episode ${ep.number}`}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Video Area (RIGHT SIDE on desktop) */}
          <div className="order-1 lg:order-2 space-y-3">
            <VideoPlayer
              sources={currentEpisode.sources}
              title={currentEpisode.title || `Episode ${currentEpNum}`}
              episodeNumber={currentEpNum}
              onNext={() => hasNext && setCurrentEpNum((n) => n + 1)}
              onPrev={() => hasPrev && setCurrentEpNum((n) => n - 1)}
              hasNext={hasNext}
              hasPrev={hasPrev}
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <div>
                <h3 className="text-sm font-display text-ink font-medium">
                  {currentEpisode.title || `Episode ${currentEpNum}`}
                </h3>
                <p className="text-xs text-mute font-mono">{anime.studio} · {anime.year}</p>
              </div>

              {/* Prev / Next buttons */}
              <div className="flex gap-2">
                {hasPrev && (
                  <Button
                    variant="outline-sm"
                    size="sm"
                    onClick={() => setCurrentEpNum((n) => n - 1)}
                  >
                    ← EP {currentEpNum - 1}
                  </Button>
                )}
                {hasNext && (
                  <Button
                    variant="outline-sm"
                    size="sm"
                    onClick={() => setCurrentEpNum((n) => n + 1)}
                  >
                    EP {currentEpNum + 1} →
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
