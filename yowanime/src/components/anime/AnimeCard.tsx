import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useActionSheetStore } from '@/store/useActionSheetStore';
import { formatScore } from '@/utils/formatDate';
import { resolveImageUrl } from '@/utils/imageUtils';
import type { Anime } from '@/types/anime';

interface AnimeCardProps {
  anime: Anime;
  className?: string;
  /** Show in compact mode (smaller text, no synopsis) */
  compact?: boolean;
}

/**
 * Crunchyroll-style AnimeCard.
 * Mobile: Borderless, 6px poster radius, bold title, "Dub | Sub" subtitle + vertical "⋮" action menu.
 * Desktop: Rich card with hover preview and quick watch buttons.
 */
export function AnimeCard({ anime, className, compact = false }: AnimeCardProps) {
  const [imgSrc, setImgSrc] = useState(() => resolveImageUrl(anime.poster || anime.banner));
  const [imgError, setImgError] = useState(false);
  const { toggle, isInWatchlist } = useWatchlistStore();
  const { openMenu } = useActionSheetStore();
  const inWatchlist = isInWatchlist(anime.id);

  useEffect(() => {
    setImgSrc(resolveImageUrl(anime.poster || anime.banner));
    setImgError(false);
  }, [anime.poster, anime.banner, anime.id]);

  const handleImgError = () => {
    const rawTarget = anime.poster || anime.banner;
    if (rawTarget && !imgSrc.includes('/api/proxy/image')) {
      setImgSrc(`/api/proxy/image?url=${encodeURIComponent(rawTarget)}`);
    } else if (anime.banner && imgSrc !== resolveImageUrl(anime.banner)) {
      setImgSrc(resolveImageUrl(anime.banner));
    } else {
      setImgError(true);
    }
  };

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

  const subtitleText = anime.type === 'Movie' || anime.status === 'completed' ? 'Subtitled' : 'Dub | Sub';

  return (
    <div
      className={clsx(
        'group relative flex flex-col h-full select-none',
        // Mobile: borderless Crunchyroll canvas; Desktop: subtle canvas-card
        'bg-transparent md:bg-canvas-card border-0 md:border md:border-hairline md:rounded-[8px] md:overflow-hidden',
        'md:transition-transform md:duration-200 md:hover:border-white/20 md:hover:-translate-y-0.5',
        className
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-[6px] md:rounded-none bg-[#141417] flex-shrink-0 shadow-md md:shadow-none">
        <Link
          to={`/anime/${anime.slug || anime.id}`}
          aria-label={`View details for ${anime.title}`}
          className="block w-full h-full"
        >
          {!imgError ? (
            <img
              src={imgSrc}
              alt={anime.title}
              className="w-full h-full object-cover md:transition-transform md:duration-300 md:group-hover:scale-105"
              onError={handleImgError}
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
              width="230"
              height="325"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-900 to-black p-3 text-center">
              <div className="w-9 h-9 rounded-full bg-[#ff640a]/20 border border-[#ff640a]/40 flex items-center justify-center mb-2">
                <span className="text-[#ff640a] font-bold text-xs">CR</span>
              </div>
              <span className="text-xs font-sans text-white font-medium leading-tight line-clamp-2">
                {anime.title}
              </span>
            </div>
          )}

          {/* Desktop gradient overlay on hover */}
          <div className="hidden md:block absolute inset-0 card-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* Watchlist ribbon (Crunchyroll signature orange bookmark tag on top right) */}
        {inWatchlist && (
          <div
            className="absolute top-0 right-2 w-3.5 h-5 bg-[#ff640a] [clip-path:polygon(0_0,100%_0,100%_100%,50%_75%,0_100%)] shadow-md z-10 pointer-events-none"
            title="In My Lists"
          />
        )}

        {/* Status & 18+ badges (desktop only or subtle on mobile) */}
        <div className="hidden md:flex absolute top-2 left-2 items-center gap-1 pointer-events-none">
          <Badge variant={statusColors[anime.status] ?? 'outline'}>
            {statusLabels[anime.status]}
          </Badge>
          {(anime.genres.includes('Hentai') || anime.rating === '18+' || anime.rating === 'Rx') && (
            <Badge variant="danger" size="sm">
              18+
            </Badge>
          )}
        </div>

        {/* Score badge (desktop) */}
        <div className="hidden md:flex absolute top-2 right-2 items-center gap-1 bg-black/85 border border-white/10 rounded-full px-2 py-0.5 pointer-events-none">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#ff640a">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-[10px] text-ink font-mono">{formatScore(anime.score)}</span>
        </div>

        {/* Desktop Hover actions */}
        <div className="absolute bottom-0 left-0 right-0 p-2 hidden md:flex gap-1.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
          <Link to={`/anime/${anime.slug || anime.id}/episode/1`} className="flex-1">
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

      {/* Crunchyroll Title & Subtitle Row */}
      <div className="pt-2 pb-1 md:p-3 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/anime/${anime.slug || anime.id}`}>
            <h3
              className={clsx(
                'font-sans font-medium sm:font-semibold text-white hover:text-[#ff640a] transition-colors leading-tight line-clamp-1 md:line-clamp-2',
                compact ? 'text-[13px] md:text-xs' : 'text-sm'
              )}
              title={anime.title}
            >
              {anime.title}
            </h3 >
          </Link>

          {/* Crunchyroll Subtitle Row: [Dub | Sub] on left, [⋮] 3-dots menu on right */}
          <div className="flex items-center justify-between text-[11px] text-[#9b9ba6] mt-1">
            <span className="font-sans font-normal truncate">
              {subtitleText}
            </span>

            {/* Crunchyroll 3-dots menu button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openMenu(anime);
              }}
              className="p-1 -mr-1 text-[#9b9ba6] hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label={`Options for ${anime.title}`}
              title="More options"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2.2" />
                <circle cx="12" cy="12" r="2.2" />
                <circle cx="12" cy="19" r="2.2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Genre badges (desktop only) */}
        {!compact && (
          <div className="hidden md:flex gap-1 flex-wrap mt-2">
            {anime.genres.slice(0, 2).map((g) => (
              <Badge key={g} variant="default">{g}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
