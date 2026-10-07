import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Anime } from '@/types/anime';
import { getActiveAuthEmail, saveAccountVault } from '@/utils/accountVault';

// ── Watchlist Status Categories (MAL-style) ──────────────────────────────────
export type WatchStatus = 'watching' | 'completed' | 'plan_to_watch' | 'dropped' | 'on_hold';

export interface WatchlistEntry {
  anime: Anime;
  status: WatchStatus;
  userRating: number | null; // 1–10, null = not rated
  addedAt: string;  // ISO date
  updatedAt: string;
}

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  watching: 'Watching',
  completed: 'Completed',
  plan_to_watch: 'Plan to Watch',
  dropped: 'Dropped',
  on_hold: 'On Hold',
};

export const WATCH_STATUS_COLORS: Record<WatchStatus, string> = {
  watching: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  plan_to_watch: 'text-sunset bg-sunset/10 border-sunset/30',
  dropped: 'text-red-400 bg-red-500/10 border-red-500/30',
  on_hold: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
};

interface WatchlistStore {
  /** Entries keyed by anime ID */
  entries: Record<string, WatchlistEntry>;

  /** Legacy flat list of IDs (for backwards compat with old components) */
  animes: Anime[];
  animeIds: string[];

  add: (anime: Anime, status?: WatchStatus) => void;
  remove: (id: string) => void;
  toggle: (anime: Anime) => void;
  updateStatus: (id: string, status: WatchStatus) => void;
  updateRating: (id: string, rating: number | null) => void;
  isInWatchlist: (id: string) => boolean;
  getEntry: (id: string) => WatchlistEntry | undefined;
  getByStatus: (status: WatchStatus) => WatchlistEntry[];
  setWatchlist: (animes: Anime[]) => void;
  clear: () => void;
}

function buildLegacy(entries: Record<string, WatchlistEntry>) {
  const animes = Object.values(entries).map((e) => e.anime);
  const animeIds = Object.keys(entries);
  return { animes, animeIds };
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      entries: {},
      animes: [],
      animeIds: [],

      add: (anime, status = 'plan_to_watch') =>
        set((state) => {
          if (state.entries[anime.id]) return state; // already exists
          const now = new Date().toISOString();
          const entry: WatchlistEntry = {
            anime,
            status,
            userRating: null,
            addedAt: now,
            updatedAt: now,
          };
          const entries = { ...state.entries, [anime.id]: entry };
          const legacy = buildLegacy(entries);
          const activeEmail = getActiveAuthEmail();
          if (activeEmail) {
            saveAccountVault(activeEmail, { watchlist: legacy.animes });
          }
          return { entries, ...legacy };
        }),

      remove: (id) =>
        set((state) => {
          const { [id]: _removed, ...entries } = state.entries;
          const legacy = buildLegacy(entries);
          const activeEmail = getActiveAuthEmail();
          if (activeEmail) {
            saveAccountVault(activeEmail, { watchlist: legacy.animes });
          }
          return { entries, ...legacy };
        }),

      toggle: (anime) => {
        const { entries, add, remove } = get();
        entries[anime.id] ? remove(anime.id) : add(anime);
      },

      updateStatus: (id, status) =>
        set((state) => {
          const entry = state.entries[id];
          if (!entry) return state;
          const entries = {
            ...state.entries,
            [id]: { ...entry, status, updatedAt: new Date().toISOString() },
          };
          const legacy = buildLegacy(entries);
          const activeEmail = getActiveAuthEmail();
          if (activeEmail) {
            saveAccountVault(activeEmail, { watchlist: legacy.animes });
          }
          return { entries, ...legacy };
        }),

      updateRating: (id, rating) =>
        set((state) => {
          const entry = state.entries[id];
          if (!entry) return state;
          const entries = {
            ...state.entries,
            [id]: { ...entry, userRating: rating, updatedAt: new Date().toISOString() },
          };
          const legacy = buildLegacy(entries);
          const activeEmail = getActiveAuthEmail();
          if (activeEmail) {
            saveAccountVault(activeEmail, { watchlist: legacy.animes });
          }
          return { entries, ...legacy };
        }),

      isInWatchlist: (id) => Boolean(get().entries[id]),
      getEntry: (id) => get().entries[id],
      getByStatus: (status) =>
        Object.values(get().entries).filter((e) => e.status === status),

      setWatchlist: (animes) => {
        const safeAnimes = Array.isArray(animes) ? animes : [];
        // Migrate from old flat watchlist: create entries if not exist
        set((state) => {
          const entries = { ...state.entries };
          for (const anime of safeAnimes) {
            if (!entries[anime.id]) {
              const now = new Date().toISOString();
              entries[anime.id] = {
                anime,
                status: 'plan_to_watch',
                userRating: null,
                addedAt: now,
                updatedAt: now,
              };
            }
          }
          return { entries, ...buildLegacy(entries) };
        });
      },

      clear: () => set({ entries: {}, animes: [], animeIds: [] }),
    }),
    {
      name: 'yumenime-watchlist-v2',
    }
  )
);
