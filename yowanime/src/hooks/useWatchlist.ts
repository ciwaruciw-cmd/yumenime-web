import { useWatchlistStore } from '@/store/useWatchlistStore';
import type { Anime } from '@/types/anime';

interface UseWatchlistReturn {
  watchlistAnimes: Anime[];
  animeIds: string[];
  isInWatchlist: (id: string) => boolean;
  toggle: (anime: Anime) => void;
  add: (anime: Anime) => void;
  remove: (id: string) => void;
  count: number;
}

/**
 * Wraps watchlist store.
 * Anime objects are stored directly in the store (no mock lookup needed).
 */
export function useWatchlist(): UseWatchlistReturn {
  const { animes, animeIds, add, remove, toggle, isInWatchlist } = useWatchlistStore();

  return {
    watchlistAnimes: animes,
    animeIds,
    isInWatchlist,
    toggle,
    add,
    remove,
    count: animes.length,
  };
}
