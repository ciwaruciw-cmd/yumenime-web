import { useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { AnimeCard } from './AnimeCard';
import { Button } from '@/components/ui/Button';
import type { Anime } from '@/types/anime';

interface AnimeSectionProps {
  /** Section eyebrow (mono uppercase label) */
  eyebrow: string;
  /** Section heading (display-sm) */
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
 * Titled anime section: eyebrow-mono label + display-sm heading + anime list.
 * Used for Trending, Baru Update, Genre Populer etc. on the Home page.
 * Follows xAI content-band spec with eyebrow-mono pattern.
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
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className={clsx('py-8 md:py-12', className)}>
      {/* Header */}
      <div className="max-w-[1280px] mx-auto px-6 mb-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow-mono text-mute block mb-1">{eyebrow}</span>
            <h2 className="display-sm text-ink">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Scroll arrows (horizontal mode) */}
            {horizontal && (
              <div className="hidden md:flex gap-1">
                <button
                  onClick={scrollLeft}
                  className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-mute hover:text-ink hover:border-white/20 transition-colors"
                  aria-label="Scroll kiri"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={scrollRight}
                  className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-mute hover:text-ink hover:border-white/20 transition-colors"
                  aria-label="Scroll kanan"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
            {viewAllHref && (
              <Link to={viewAllHref}>
                <Button variant="outline-sm" size="sm">
                  Lihat Semua
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {horizontal ? (
      <div className="max-w-[1280px] mx-auto relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-canvas to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none" />

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-x pb-3 px-6 items-stretch"
            style={{ scrollPaddingInline: '24px' }}
          >
            {animes.map((anime) => (
              <div key={anime.id} className="shrink-0 w-[155px] sm:w-[168px] md:w-[180px] flex flex-col">
                <div className="flex-1 flex flex-col">
                  <AnimeCard anime={anime} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {animes.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </div>
      )}

      {/* Trailing content */}
      {trailing && (
        <div className="max-w-[1280px] mx-auto px-6 mt-6">{trailing}</div>
      )}
    </section>
  );
}
