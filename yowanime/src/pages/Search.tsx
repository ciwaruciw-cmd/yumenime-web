import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAnime } from '@/services/animeService';
import type { Anime } from '@/types/anime';

/**
 * Search page — large search input with real-time results.
 */
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  const debouncedQuery = useDebounce(query, 350);

  // Sync URL param
  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery, setSearchParams]);

  // Search on debounced change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    searchAnime(debouncedQuery)
      .then(setResults)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  return (
    <div className="page-enter pt-20 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Search header */}
        <div className="mb-8 max-w-2xl mx-auto text-center">
          <span className="eyebrow-mono text-mute block mb-2">PENCARIAN</span>
          <h1 className="display-md text-ink mb-6">Cari Anime</h1>

          {/* Large search input */}
          <div className="relative">
            <svg
              width="20" height="20"
              viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-5 top-1/2 -translate-y-1/2 text-mute"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Ketik judul anime, studio, atau genre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-canvas-soft border border-hairline rounded-full text-ink text-base md:text-lg font-display placeholder:text-mute pl-14 pr-6 py-4 outline-none focus:border-white/30 transition-colors"
              autoFocus
              id="search-input"
              aria-label="Cari anime"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-mute hover:text-body transition-colors"
                aria-label="Hapus pencarian"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        {hasSearched && !isLoading && (
          <p className="text-mute text-xs font-mono uppercase tracking-wider mb-4">
            {results.length} HASIL UNTUK &quot;{debouncedQuery}&quot;
          </p>
        )}

        {/* Results grid */}
        {hasSearched ? (
          <AnimeGrid
            animes={results}
            isLoading={isLoading}
            emptyMessage={`Tidak ditemukan hasil untuk "${debouncedQuery}"`}
          />
        ) : (
          /* Empty state before search */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-mute">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-body text-sm font-display">Mulai ketik untuk mencari anime favoritmu</p>
            <p className="text-mute text-xs font-display mt-1">Cari berdasarkan judul, studio, atau genre</p>
          </div>
        )}
      </div>
    </div>
  );
}
