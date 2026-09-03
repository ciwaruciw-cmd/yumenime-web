import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { getAllGenres } from '@/data/mockAnime';
import type { AnimeGenre } from '@/types/anime';

interface GenreFilterProps {
  selectedGenres?: string[];
  onGenreChange?: (genre: string | undefined) => void;
  /** If true, syncs state with URL search params */
  useUrlParams?: boolean;
}

const ALL_GENRES = getAllGenres() as AnimeGenre[];

/**
 * Horizontal scrollable genre filter chips.
 * Pill shape per design tokens.
 */
export function GenreFilter({ selectedGenres = [], onGenreChange, useUrlParams = false }: GenreFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeGenre = useUrlParams
    ? (searchParams.get('genre') ?? undefined)
    : selectedGenres[0];

  const handleSelect = (genre: string | undefined) => {
    if (useUrlParams) {
      const params = new URLSearchParams(searchParams);
      if (genre) {
        params.set('genre', genre);
      } else {
        params.delete('genre');
      }
      params.delete('page');
      setSearchParams(params);
    } else {
      onGenreChange?.(genre);
    }
  };

  return (
    <div className="relative">
      {/* Fade edge hints for scroll */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-canvas to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scroll-x"
        role="group"
        aria-label="Filter by genre"
      >
        {/* All (clear) */}
        <button
          onClick={() => handleSelect(undefined)}
          className={clsx(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-150 border',
            !activeGenre
              ? 'bg-ink text-canvas border-ink'
              : 'bg-transparent text-mute border-hairline hover:text-body hover:border-white/20'
          )}
          aria-pressed={!activeGenre}
        >
          All
        </button>

        {ALL_GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => handleSelect(activeGenre === genre ? undefined : genre)}
            className={clsx(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all duration-150 border whitespace-nowrap',
              activeGenre === genre
                ? 'bg-sunset text-white border-sunset'
                : 'bg-transparent text-mute border-hairline hover:text-body hover:border-white/20'
            )}
            aria-pressed={activeGenre === genre}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
}
