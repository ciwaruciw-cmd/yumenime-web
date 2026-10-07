import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAnime } from '@/services/animeService';
import type { Anime, AnimeFilterParams, AnimeStatus, AnimeType } from '@/types/anime';

const STATUS_OPTIONS: { label: string; value: AnimeStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Completed', value: 'completed' },
  { label: 'Upcoming', value: 'upcoming' },
];

const TYPE_OPTIONS: { label: string; value: AnimeType | '' }[] = [
  { label: 'All', value: '' },
  { label: 'TV', value: 'TV' },
  { label: 'Movie', value: 'Movie' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
];

const SORT_OPTIONS: { label: string; value: AnimeFilterParams['sort'] }[] = [
  { label: 'Relevance', value: 'popular' },
  { label: 'Newest', value: 'new' },
  { label: 'Rating', value: 'score' },
  { label: 'A–Z', value: 'title' },
];

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

/**
 * Search page — real-time search with advanced filters.
 */
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [status, setStatus] = useState<AnimeStatus | ''>((searchParams.get('status') ?? '') as AnimeStatus | '');
  const [type, setType] = useState<AnimeType | ''>((searchParams.get('type') ?? '') as AnimeType | '');
  const [year, setYear] = useState<string>(searchParams.get('year') ?? '');
  const [sort, setSort] = useState<AnimeFilterParams['sort']>((searchParams.get('sort') as AnimeFilterParams['sort']) ?? 'popular');

  const debouncedQuery = useDebounce(query, 350);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    if (year) params.set('year', year);
    if (sort && sort !== 'popular') params.set('sort', sort);
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, status, type, year, sort, setSearchParams]);

  // Search on debounced change or filter change
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    searchAnime(debouncedQuery)
      .then((data) => {
        let filtered = data;
        if (status) filtered = filtered.filter((a) => a.status === status);
        if (type) filtered = filtered.filter((a) => a.type === type);
        if (year) filtered = filtered.filter((a) => String(a.year) === year);
        if (sort === 'score') filtered = [...filtered].sort((a, b) => b.score - a.score);
        if (sort === 'title') filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        if (sort === 'new') filtered = [...filtered].sort((a, b) => b.year - a.year);
        setResults(filtered);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, status, type, year, sort]);

  const hasFilters = Boolean(status || type || year || (sort && sort !== 'popular'));
  const activeFilterCount = [status, type, year, sort !== 'popular' ? sort : ''].filter(Boolean).length;

  const clearFilters = () => {
    setStatus('');
    setType('');
    setYear('');
    setSort('popular');
  };

  return (
    <div className="page-enter pt-14 sm:pt-20 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
        {/* Search header */}
        <div className="mb-6 max-w-3xl mx-auto text-center">
          <span className="eyebrow-mono text-mute block mb-2">SEARCH</span>
          <h1 className="display-md text-ink mb-5">Search Anime</h1>

          {/* Large search input */}
          <div className="relative">
            <svg
              width="18" height="18"
              viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-mute"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Type anime title, studio, or genre..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-canvas-soft border border-hairline rounded-full text-ink text-sm md:text-base font-display placeholder:text-mute pl-12 pr-28 py-3.5 outline-none focus:border-white/30 transition-colors"
              autoFocus
              id="search-input"
              aria-label="Search anime"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {/* Filter toggle button */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  showFilters || hasFilters
                    ? 'bg-sunset/10 border-sunset/30 text-sunset'
                    : 'bg-canvas-soft border-hairline text-mute hover:text-ink hover:border-white/20'
                }`}
                aria-label="Toggle filters"
                id="filter-toggle-btn"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="bg-sunset text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-mute hover:text-body transition-colors"
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-3 bg-canvas-card border border-hairline rounded-2xl p-4 text-left animate-in slide-in-from-top-2 fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status */}
                <div>
                  <p className="text-[10px] font-mono text-mute uppercase tracking-wider mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatus(opt.value as AnimeStatus | '')}
                        className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          status === opt.value
                            ? 'bg-white text-black border-white'
                            : 'border-hairline text-mute hover:text-ink hover:border-white/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <p className="text-[10px] font-mono text-mute uppercase tracking-wider mb-2">Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setType(opt.value as AnimeType | '')}
                        className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          type === opt.value
                            ? 'bg-white text-black border-white'
                            : 'border-hairline text-mute hover:text-ink hover:border-white/30'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Year */}
                <div>
                  <p className="text-[10px] font-mono text-mute uppercase tracking-wider mb-2">Year</p>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="bg-canvas-soft text-body text-xs font-mono border border-hairline rounded-full px-3 py-1.5 outline-none focus:border-white/30 cursor-pointer w-full"
                  >
                    <option value="">All Years</option>
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sort */}
              <div className="mt-3 pt-3 border-t border-hairline flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-mono text-mute uppercase tracking-wider">Sort by:</span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`text-xs font-mono px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      sort === opt.value
                        ? 'bg-sunset/10 border-sunset/30 text-sunset'
                        : 'border-hairline text-mute hover:text-ink hover:border-white/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-xs font-mono text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        {hasSearched && !isLoading && (
          <p className="text-mute text-xs font-mono uppercase tracking-wider mb-4">
            {results.length} RESULT{results.length !== 1 ? 'S' : ''} FOR &quot;{debouncedQuery}&quot;
            {hasFilters && ` (filtered)`}
          </p>
        )}

        {/* Results grid */}
        {hasSearched ? (
          <AnimeGrid
            animes={results}
            isLoading={isLoading}
            emptyMessage={`No results found for "${debouncedQuery}"${hasFilters ? ' with current filters.' : '.'}`}
          />
        ) : (
          /* Empty state before search */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-mute">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-body text-sm font-display">Start typing to search your favorite anime</p>
            <p className="text-mute text-xs font-display mt-1">Use filters to narrow down results by status, type, and year</p>
          </div>
        )}
      </div>
    </div>
  );
}
