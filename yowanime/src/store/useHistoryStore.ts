import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchHistoryItem } from '@/types/history';
import { getActiveAuthEmail, saveAccountVault } from '@/utils/accountVault';

const MAX_HISTORY_ITEMS = 100;

function deduplicateHistory(items: WatchHistoryItem[]): WatchHistoryItem[] {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, WatchHistoryItem>();
  // Sort items by updatedAt descending (newest first)
  const sorted = [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  for (const item of sorted) {
    if (!item || !item.animeId) continue;
    const existing = map.get(item.animeId);
    if (!existing) {
      const completedSet = new Set<number>(item.completedEpisodes || []);
      if (item.completed) {
        completedSet.add(item.episodeNumber);
      }
      map.set(item.animeId, {
        ...item,
        completedEpisodes: Array.from(completedSet),
      });
    } else {
      const completedSet = new Set<number>(existing.completedEpisodes || []);
      if (item.completed) {
        completedSet.add(item.episodeNumber);
      }
      if (item.completedEpisodes) {
        item.completedEpisodes.forEach((ep) => completedSet.add(ep));
      }
      existing.completedEpisodes = Array.from(completedSet);
    }
  }

  return Array.from(map.values()).slice(0, MAX_HISTORY_ITEMS);
}

interface HistoryState {
  history: WatchHistoryItem[];
  saveProgress: (item: Omit<WatchHistoryItem, 'updatedAt'>) => void;
  markCompleted: (animeId: string, episodeNumber: number) => void;
  getEpisodeHistory: (animeId: string, episodeNumber: number) => WatchHistoryItem | undefined;
  getLastWatched: (animeId: string) => WatchHistoryItem | undefined;
  getAnimeHistory: (animeId: string) => WatchHistoryItem[];
  removeHistoryItem: (animeId: string, episodeNumber?: number) => void;
  setHistory: (items: WatchHistoryItem[]) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      saveProgress: (item) => {
        set((state) => {
          const now = Date.now();
          const isCompleted = item.completed || (item.duration > 0 && item.currentTime / item.duration >= 0.9);

          const existingAnime = state.history.find((h) => h.animeId === item.animeId);
          const completedSet = new Set<number>(existingAnime?.completedEpisodes || []);
          if (isCompleted) {
            completedSet.add(item.episodeNumber);
          }

          const newItem: WatchHistoryItem = {
            ...item,
            completed: isCompleted,
            updatedAt: now,
            completedEpisodes: Array.from(completedSet),
          };

          // Per anime hanya simpan 1 entri (episode terakhir yang ditonton).
          // Entri episode sebelumnya akan digantikan oleh episode terbaru.
          const remaining = state.history.filter(
            (h) => h.animeId !== item.animeId
          );

          const nextHistory = [newItem, ...remaining].slice(0, MAX_HISTORY_ITEMS);
          const activeEmail = getActiveAuthEmail();
          if (activeEmail) {
            saveAccountVault(activeEmail, { history: nextHistory });
          }

          return {
            history: nextHistory,
          };
        });
      },

      markCompleted: (animeId, episodeNumber) => {
        set((state) => {
          const updated = state.history.map((h) => {
            if (h.animeId === animeId) {
              const completedSet = new Set<number>(h.completedEpisodes || []);
              completedSet.add(episodeNumber);
              const isCurrentEp = h.episodeNumber === episodeNumber;
              return {
                ...h,
                completed: isCurrentEp ? true : h.completed,
                progress: isCurrentEp ? 100 : h.progress,
                completedEpisodes: Array.from(completedSet),
                updatedAt: Date.now(),
              };
            }
            return h;
          });

          const activeEmail = getActiveAuthEmail();
          if (activeEmail) {
            saveAccountVault(activeEmail, { history: updated });
          }

          return { history: updated };
        });
      },

      getEpisodeHistory: (animeId, episodeNumber) => {
        const animeHistory = get().history.find((h) => h.animeId === animeId);
        if (!animeHistory) return undefined;
        if (animeHistory.episodeNumber === episodeNumber) return animeHistory;
        if (animeHistory.completedEpisodes?.includes(episodeNumber)) {
          return {
            ...animeHistory,
            episodeNumber,
            completed: true,
            progress: 100,
          };
        }
        return undefined;
      },

      getLastWatched: (animeId) => {
        return get().history.find((h) => h.animeId === animeId);
      },

      getAnimeHistory: (animeId) => {
        return get().history.filter((h) => h.animeId === animeId);
      },

      removeHistoryItem: (animeId, episodeNumber) => {
        set((state) => {
          const nextHistory = state.history.filter((h) => {
            if (episodeNumber !== undefined) {
              return !(h.animeId === animeId && h.episodeNumber === episodeNumber);
            }
            return h.animeId !== animeId;
          });

          const activeEmail = getActiveAuthEmail();
          if (activeEmail) {
            saveAccountVault(activeEmail, { history: nextHistory });
          }

          return { history: nextHistory };
        });
      },

      setHistory: (items) => {
        const safeItems = Array.isArray(items) ? deduplicateHistory(items) : [];
        set({ history: safeItems });
      },

      clearHistory: () => {
        set({ history: [] });
      },
    }),
    {
      name: 'yumenime-history',
      version: 2,
      migrate: (persistedState: any) => {
        if (persistedState && Array.isArray(persistedState.history)) {
          return {
            ...persistedState,
            history: deduplicateHistory(persistedState.history),
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.history)) {
          const deduped = deduplicateHistory(state.history);
          if (deduped.length !== state.history.length) {
            state.history = deduped;
          }
        }
      },
    }
  )
);
