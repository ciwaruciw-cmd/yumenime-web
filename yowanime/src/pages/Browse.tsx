import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { getAnimeList } from '@/services/animeService';
import { GENRE_ITEMS } from '@/data/genres';
import { AgeVerificationModal } from '@/components/common/AgeVerificationModal';
import type { Anime, AnimeFilterParams, AnimeGenre } from '@/types/anime';

type BrowseTab = 'all' | 'simulcasts' | 'genres' | 'music';

const SEASONS = [
  'Fall 2026',
  'Summer 2026',
  'Spring 2026',
  'Winter 2026',
  'Fall 2025',
  'Summer 2025',
  'Spring 2025',
  'Winter 2025',
];

const SORT_OPTIONS: { label: string; value: AnimeFilterParams['sort'] }[] = [
  { label: 'Popular', value: 'popular' },
  { label: 'Recently Added', value: 'new' },
  { label: 'Top Rated', value: 'score' },
  { label: 'Alphabetical', value: 'title' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State
  const initialTab = (searchParams.get('tab') as BrowseTab) || 'all';
  const [activeTab, setActiveTab] = useState<BrowseTab>(initialTab);

  // Age verification modal state
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [pendingGenre, setPendingGenre] = useState<string | null>(null);

  // Filter & Sort State
  const [selectedSort, setSelectedSort] = useState<AnimeFilterParams['sort']>('popular');
  const [selectedSeason, setSelectedSeason] = useState('Fall 2026');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(searchParams.get('genre') || null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // UI state for dropdowns & modals
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);

  // Anime list & pagination
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Sync tab with URL
  const switchTab = (tab: BrowseTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
  };

  // Fetch anime on filter change
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        let params: AnimeFilterParams = {
          page: 1,
          pageSize: 20,
        };

        if (activeTab === 'all') {
          params.sort = selectedSort;
          if (selectedGenre) params.genre = selectedGenre as AnimeGenre;
          if (selectedStatus) params.status = selectedStatus as any;
        } else if (activeTab === 'simulcasts') {
          params.status = 'ongoing';
          params.sort = 'popular';
        } else if (activeTab === 'music') {
          params.genre = 'Music';
          params.sort = 'popular';
        }

        if (activeTab !== 'genres') {
          const res = await getAnimeList(params);
          if (!isCancelled) {
            setAnimes(res.data);
            setHasMore(res.hasMore);
            setPage(1);
          }
        }
      } catch (err) {
        console.warn('[Browse] Error fetching anime:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void loadData();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, selectedSort, selectedGenre, selectedStatus, selectedSeason]);

  // Load more pagination
  const handleLoadMore = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      let params: AnimeFilterParams = {
        page: nextPage,
        pageSize: 20,
      };

      if (activeTab === 'all') {
        params.sort = selectedSort;
        if (selectedGenre) params.genre = selectedGenre as AnimeGenre;
        if (selectedStatus) params.status = selectedStatus as any;
      } else if (activeTab === 'simulcasts') {
        params.status = 'ongoing';
      } else if (activeTab === 'music') {
        params.genre = 'Music';
      }

      const res = await getAnimeList(params);
      setAnimes((prev) => [...prev, ...res.data]);
      setHasMore(res.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.warn('[Browse] Error loading more:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectGenreCard = (genreName: string) => {
    if (genreName.toLowerCase() === 'hentai') {
      const isVerified = sessionStorage.getItem('age_verified_18') === 'true';
      if (!isVerified) {
        setPendingGenre(genreName);
        setShowAgeModal(true);
        return;
      }
    }
    setSelectedGenre(genreName);
    switchTab('all');
  };

  const handleConfirmAge = () => {
    sessionStorage.setItem('age_verified_18', 'true');
    setShowAgeModal(false);
    if (pendingGenre) {
      setSelectedGenre(pendingGenre);
      switchTab('all');
      setPendingGenre(null);
    }
  };

  const handleCancelAge = () => {
    setShowAgeModal(false);
    setPendingGenre(null);
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === selectedSort)?.label || 'Popular';

  return (
    <div className="page-enter bg-black text-white min-h-screen pt-12 pb-24 select-none">
      {/* 1. Header (Browse + Cast + Search) */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-2xl font-black font-sans tracking-tight text-white">
          Browse
        </h1>

        <div className="flex items-center gap-2">
          {/* Cast button */}
          <button
            className="p-1.5 text-white/90 hover:text-[#ff640a] transition-colors cursor-pointer"
            aria-label="Cast"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6M2 20h.01" />
            </svg>
          </button>

          {/* Search button */}
          <Link
            to="/search"
            className="p-1.5 text-white/90 hover:text-[#ff640a] transition-colors cursor-pointer"
            aria-label="Search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </div>
      </div>

      {/* 2. Horizontal Tabs Bar: [All Anime] [Simulcasts] [Anime Genres] [Music] */}
      <div className="border-b border-[#1c1c20] sticky top-12 z-30 bg-black/95 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center gap-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => switchTab('all')}
            className={clsx(
              'pb-3 pt-2 text-sm font-sans font-bold whitespace-nowrap transition-colors relative cursor-pointer',
              activeTab === 'all'
                ? 'text-white'
                : 'text-[#8c8c94] hover:text-white'
            )}
          >
            All Anime
            {activeTab === 'all' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff640a] rounded-full" />
            )}
          </button>

          <button
            onClick={() => switchTab('simulcasts')}
            className={clsx(
              'pb-3 pt-2 text-sm font-sans font-bold whitespace-nowrap transition-colors relative cursor-pointer',
              activeTab === 'simulcasts'
                ? 'text-white'
                : 'text-[#8c8c94] hover:text-white'
            )}
          >
            Simulcasts
            {activeTab === 'simulcasts' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff640a] rounded-full" />
            )}
          </button>

          <button
            onClick={() => switchTab('genres')}
            className={clsx(
              'pb-3 pt-2 text-sm font-sans font-bold whitespace-nowrap transition-colors relative cursor-pointer',
              activeTab === 'genres'
                ? 'text-white'
                : 'text-[#8c8c94] hover:text-white'
            )}
          >
            Anime Genres
            {activeTab === 'genres' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff640a] rounded-full" />
            )}
          </button>

          <button
            onClick={() => switchTab('music')}
            className={clsx(
              'pb-3 pt-2 text-sm font-sans font-bold whitespace-nowrap transition-colors relative cursor-pointer',
              activeTab === 'music'
                ? 'text-white'
                : 'text-[#8c8c94] hover:text-white'
            )}
          >
            Music
            {activeTab === 'music' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff640a] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* 3. Subheader / Filter Bar */}
      {activeTab === 'all' && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between relative">
          {/* Sort selector dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown((v) => !v)}
              className="flex items-center gap-1.5 text-base font-sans font-bold text-white hover:text-[#ff640a] transition-colors cursor-pointer"
            >
              <span>{currentSortLabel}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5">
                <polygon points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Selected Genre Pill Tag (if active) */}
            {selectedGenre && (
              <div className="inline-flex items-center gap-1.5 ml-3 bg-white/10 px-2 py-0.5 rounded-full text-xs text-white">
                <span>{selectedGenre}</span>
                <button
                  onClick={() => setSelectedGenre(null)}
                  className="text-white/60 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Sort Dropdown Menu */}
            {showSortDropdown && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-[#18181c] border border-white/10 rounded-[12px] p-1.5 shadow-2xl z-40 animate-fade-in-up">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedSort(opt.value);
                      setShowSortDropdown(false);
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-xs font-sans rounded-[8px] transition-colors cursor-pointer',
                      selectedSort === opt.value
                        ? 'bg-[#ff640a]/15 text-[#ff640a] font-bold'
                        : 'text-white hover:bg-white/5'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Action Icons: Sort toggle + Filter sliders */}
          <div className="flex items-center gap-3">
            {/* Sort order icon (3 horizontal lines) */}
            <button
              onClick={() => setSortAscending((v) => !v)}
              className={clsx(
                'p-1 transition-colors cursor-pointer',
                sortAscending ? 'text-[#ff640a]' : 'text-white/90 hover:text-white'
              )}
              title="Toggle Sort Order"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="9" y2="18" />
              </svg>
            </button>

            {/* Filter icon (sliders / adjust) */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="p-1 text-white/90 hover:text-[#ff640a] transition-colors cursor-pointer relative"
              title="Filter anime"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              {selectedStatus && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-[#ff640a] rounded-full" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Simulcasts Season Subheader (Screenshot 2) */}
      {activeTab === 'simulcasts' && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between relative">
          <div className="relative">
            <button
              onClick={() => setShowSeasonDropdown((v) => !v)}
              className="flex items-center gap-1.5 text-base font-sans font-bold text-white hover:text-[#ff640a] transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 9 12 15 18 9" />
              </svg>
              <span>{selectedSeason}</span>
            </button>

            {showSeasonDropdown && (
              <div className="absolute left-0 top-full mt-2 w-44 bg-[#18181c] border border-white/10 rounded-[12px] p-1.5 shadow-2xl z-40 animate-fade-in-up">
                {SEASONS.map((season) => (
                  <button
                    key={season}
                    onClick={() => {
                      setSelectedSeason(season);
                      setShowSeasonDropdown(false);
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-xs font-sans rounded-[8px] transition-colors cursor-pointer',
                      selectedSeason === season
                        ? 'bg-[#ff640a]/15 text-[#ff640a] font-bold'
                        : 'text-white hover:bg-white/5'
                    )}
                  >
                    {season}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Tab 3: Anime Genres Grid (Original Clean Style) */}
      {activeTab === 'genres' && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-4 pb-12">
          {/* Header */}
          <div className="mb-5">
            <span className="eyebrow-mono text-mute block mb-1 text-[11px]">BROWSE</span>
            <h2 className="display-sm text-ink text-xl sm:text-2xl font-bold font-display">All Genres</h2>
            <p className="text-mute text-xs sm:text-sm font-display mt-1">
              Explore anime by your favorite genre
            </p>
          </div>

          {/* Genre grid — original clean card style with all 23 genres */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {GENRE_ITEMS.map(({ name, slug }) => (
              <button
                key={name}
                type="button"
                onClick={() => handleSelectGenreCard(name)}
                className="group bg-canvas-card border border-hairline/80 hover:border-sunset/50 hover:bg-canvas-soft rounded-[10px] p-4 sm:p-5 transition-all duration-200 text-left cursor-pointer active:scale-[0.98] shadow-sm flex flex-col justify-between"
              >
                <span className="text-sm sm:text-base font-display font-medium text-ink group-hover:text-sunset transition-colors mb-1">
                  {name}
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-mute uppercase tracking-wider">
                  {slug}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tab 1, 2, 4: Anime Grid (Screenshot 1, 2) */}
      {activeTab !== 'genres' && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-2">
          {animes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3 gap-y-4">
              {animes.map((anime) => (
                <div key={anime.id} className="flex flex-col">
                  <AnimeCard anime={anime} />
                </div>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="text-center py-16 text-[#8c8c94]">
              <p className="text-sm">No anime found for this filter.</p>
            </div>
          ) : null}

          {/* Load More Button / Loading Spinner */}
          {hasMore && (
            <div className="flex justify-center mt-8 pb-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-full border border-white/20 hover:border-[#ff640a] text-white hover:text-[#ff640a] font-sans text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Modal (Sheet) */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowFilterModal(false)}
          />
          <div className="relative z-10 w-full sm:max-w-md bg-[#16161b] border-t sm:border border-white/10 rounded-t-[20px] sm:rounded-[16px] p-5 shadow-2xl animate-slide-up sm:animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-sans font-bold text-base text-white">Filter Anime</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Status Filter */}
            <div className="py-4 space-y-2">
              <p className="text-xs font-sans font-bold text-[#8c8c94] uppercase tracking-wider">Status</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'All', value: null },
                  { label: 'Ongoing', value: 'ongoing' },
                  { label: 'Completed', value: 'completed' },
                ].map((st) => (
                  <button
                    key={st.label}
                    onClick={() => setSelectedStatus(st.value)}
                    className={clsx(
                      'py-2 px-3 rounded-[8px] text-xs font-sans font-medium transition-colors cursor-pointer',
                      selectedStatus === st.value
                        ? 'bg-[#ff640a] text-black font-bold'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    )}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <button
              onClick={() => setShowFilterModal(false)}
              className="w-full mt-2 py-3 bg-[#ff640a] hover:bg-[#ff7a29] text-black font-extrabold text-xs rounded-full transition-colors cursor-pointer"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      {/* 18+ Age Verification Warning Alert Modal */}
      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleConfirmAge}
        onCancel={handleCancelAge}
      />
    </div>
  );
}
