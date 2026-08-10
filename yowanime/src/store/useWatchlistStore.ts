import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Anime } from '@/types/anime';

interface WatchlistStore {
  /** Full Anime objects for display (poster, title, etc.) */
  animes: Anime[];
  /** Legacy: list of IDs for quick lookup */
  animeIds: string[];
  add: (anime: Anime) => void;
  remove: (id: string) => void;
  toggle: (anime: Anime) => void;
  isInWatchlist: (id: string) => boolean;
  clear: () => void;
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      animes: [],
      animeIds: [],

      add: (anime) =>
        set((state) => {
          if (state.animeIds.includes(anime.id)) return state;
          return {
            animes: [...state.animes, anime],
            animeIds: [...state.animeIds, anime.id],
          };
        }),

      remove: (id) =>
        set((state) => ({
          animes: state.animes.filter((a) => a.id !== id),
          animeIds: state.animeIds.filter((aid) => aid !== id),
        })),

      toggle: (anime) => {
        const { animeIds, add, remove } = get();
        animeIds.includes(anime.id) ? remove(anime.id) : add(anime);
      },

      isInWatchlist: (id) => get().animeIds.includes(id),

      clear: () => set({ animes: [], animeIds: [] }),
    }),
    {
      name: 'yumenime-watchlist',
    }
  )
);
