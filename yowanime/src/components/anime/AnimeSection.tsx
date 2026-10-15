import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { AnimeCard } from './AnimeCard';
import type { Anime } from '@/types/anime';

interface AnimeSectionProps {
  /** Optional section eyebrow (hidden on mobile to match Crunchyroll) */
  eyebrow?: string;
  /** Section heading (e.g. Trending Anime) */
  title: string;
  animes: Anime[];
  /** Link to full list page */
  viewAllHref?: string;
  /** Use horizontal scroll instead of grid */
  horizontal?: boolean;
  /** Optional trailing slot */
  trailing?: ReactNode;
  className?: string;
}

/**
 * Crunchyroll-style AnimeSection:
 * Bold white title, clean horizontal carousel with peek-ahead cards,
 * Dub/Sub metadata and 3-dots action sheet.
 */
export function AnimeSection({
  eyebrow,
  title,
  animes,
  viewAllHref,
  horizontal = false,
  trailing,
  className,
}: AnimeSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  };

  if (!animes || animes.length === 0) return null;

  return (
    <section className={clsx('py-4 sm:py-6 md:py-8', className)}>
      {/* Header */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 mb-3 sm:mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            {eyebrow && (
              <span className="hidden md:block eyebrow-mono text-mute mb-1">
                {eyebrow}
              </span>
            )}
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop scroll arrows */}
            {horizontal && (
              <div className="hidden md:flex gap-1">
                <button
                  onClick={scrollLeft}
                  className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-mute hover:text-white hover:border-white/20 transition-colors cursor-pointer"
                  aria-label="Scroll left"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={scrollRight}
                  className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-mute hover:text-white hover:border-white/20 transition-colors cursor-pointer"
                  aria-label="Scroll right"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}

            {viewAllHref && (
              <Link
                to={viewAllHref}
                className="text-xs sm:text-sm font-sans font-medium text-[#9b9ba6] hover:text-[#ff640a] transition-colors flex items-center gap-1"
              >
                <span>View All</span>
                <span aria-hidden="true">›</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {horizontal ? (
        <div className="max-w-[1280px] mx-auto relative px-4 sm:px-6">
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none custom-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 items-stretch"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {animes.map((anime) => (
              <div
                key={anime.id}
                className="shrink-0 w-[136px] sm:w-[155px] md:w-[175px] flex flex-col"
              >
                <AnimeCard anime={anime} compact />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {animes.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </div>
      )}

      {/* Trailing content */}
      {trailing && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 mt-6">{trailing}</div>
      )}
    </section>
  );
}
