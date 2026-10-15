import { useState, useEffect, useMemo, useRef, type ReactElement } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { AnimeCard } from '@/components/anime/AnimeCard';
import { getAnimeList } from '@/services/animeService';
import type { Anime, AnimeFilterParams, AnimeGenre } from '@/types/anime';

type BrowseTab = 'all' | 'simulcasts' | 'genres' | 'music';

interface GenreItem {
  name: string;
  label: string;
  image: string;
  icon: (props: { className?: string }) => ReactElement;
}

const GENRE_LIST: GenreItem[] = [
  {
    name: 'Action',
    label: 'ACTION',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F101922-WBsBl0ClmgL1.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c-.3 1.5-1.2 2.8-2.3 3.8C8.5 7 7.5 8.7 7.5 10.7c0 2.8 2.2 5 5 5s5-2.2 5-5c0-1.8-.8-3.4-2.1-4.6-.2 1.3-.9 2.4-2 3.1-.2-.6-.4-1.2-.4-1.8 0-1.7.9-3.2 2-4.2C13.8 2.4 12.8 2 12 2zm-1.5 15.5c-2.5 0-4.5 2-4.5 4.5h12c0-2.5-2-4.5-4.5-4.5-1 0-1.9.3-2.6.9-.1-.6-.2-1.2-.4-1.9z" />
      </svg>
    ),
  },
  {
    name: 'Adventure',
    label: 'ADVENTURE',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F21-wf37VakJSpdH.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Comedy',
    label: 'COMEDY',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F21202-bO8JjQd6V9jV.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
        <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
      </svg>
    ),
  },
  {
    name: 'Drama',
    label: 'DRAMA',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F21827-t2j20rNdfMZe.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="m12 5-1 4 3 2-2 4" />
      </svg>
    ),
  },
  {
    name: 'Fantasy',
    label: 'FANTASY',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F154587-gviZldih8Unl.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
        <line x1="13" y1="19" x2="19" y2="13" />
        <line x1="16" y1="16" x2="20" y2="20" />
        <line x1="19" y1="21" x2="21" y2="19" />
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
        <line x1="5" y1="14" x2="9" y2="18" />
        <line x1="7" y1="17" x2="4" y2="20" />
        <line x1="3" y1="19" x2="5" y2="21" />
      </svg>
    ),
  },
  {
    name: 'Music',
    label: 'MUSIC',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F130003-O0y430l8b81U.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" fill="currentColor" />
        <circle cx="18" cy="16" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Romance',
    label: 'ROMANCE',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F101921-G6g6bS8yA4zZ.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
  {
    name: 'Sci-Fi',
    label: 'SCI-FI',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F9253-mDb4eC95Z1jO.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="10" ry="4" />
        <path d="M7 12c0-2.2 2.2-4 5-4s5 1.8 5 4" />
        <path d="M9 16l-3 4M15 16l3 4M12 16v5" />
      </svg>
    ),
  },
  {
    name: 'Seinen',
    label: 'SEINEN',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F101348-1Hk12r6rUe69.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 9 12 22 22 9 12 2" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="12" y1="2" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    name: 'Shoujo',
    label: 'SHOJO',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F105333-eWfH3eJv0WjW.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        <path d="M12 8v4M10 10h4" />
      </svg>
    ),
  },
  {
    name: 'Shounen',
    label: 'SHONEN',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F97940-bU124K3f15pL.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 11V4.5a1.5 1.5 0 0 1 3 0V10" />
        <path d="M14 8.5a1.5 1.5 0 0 1 3 0V11" />
        <path d="M17 10a1.5 1.5 0 0 1 3 0v4a6 6 0 0 1-6 6H9a5 5 0 0 1-5-5v-3.5a1.5 1.5 0 0 1 3 0V14" />
      </svg>
    ),
  },
  {
    name: 'Slice of Life',
    label: 'SLICE OF LIFE',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F98444-Yt34o5h6hWvG.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <text x="12" y="18" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none" fontWeight="bold">18</text>
      </svg>
    ),
  },
  {
    name: 'Supernatural',
    label: 'SUPERNATURAL',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F101280-M9J6m95q08Wq.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'Mystery',
    label: 'MYSTERY',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F1535-6jR384n4vJ1w.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    name: 'Sports',
    label: 'SPORTS',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F20464-YvG43B8dZ5jL.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
        <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Thriller',
    label: 'THRILLER',
    image: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F101759-Z85g1vNlK2s0.jpg&w=400&output=webp',
    icon: ({ className = 'w-5 h-5' }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

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
    setSelectedGenre(genreName);
    switchTab('all');
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

      {/* 4. Tab 3: Anime Genres Grid (Screenshot 3) */}
      {activeTab === 'genres' && (
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-3">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
            {GENRE_LIST.map((g) => {
              const Icon = g.icon;
              return (
                <div
                  key={g.name}
                  onClick={() => handleSelectGenreCard(g.name)}
                  className="relative aspect-[16/9] sm:aspect-[16/10] rounded-[6px] overflow-hidden group cursor-pointer bg-[#141418] shadow-md transition-all active:scale-[0.98]"
                >
                  {/* Genre Background Artwork */}
                  <img
                    src={g.image}
                    alt={g.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-60"
                    loading="lazy"
                  />

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />

                  {/* Centered Content: Icon + Uppercase Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                    <div className="text-white mb-1.5 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="font-sans font-bold text-xs sm:text-sm tracking-wider text-white">
                      {g.label}
                    </span>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
