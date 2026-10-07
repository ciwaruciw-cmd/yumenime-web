import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginPayload, RegisterPayload, FavoriteCharacter } from '@/types/user';
import type { Anime } from '@/types/anime';
import type { WatchHistoryItem } from '@/types/history';
import {
  loginApi,
  registerApi,
  updateProfileApi,
  syncUserDataApi,
  fetchUserDataApi,
} from '@/services/authService';
import { useWatchlistStore } from './useWatchlistStore';
import { useHistoryStore } from './useHistoryStore';

export const DEFAULT_FAVORITE_CHARACTERS: FavoriteCharacter[] = [
  {
    id: 'char-1',
    name: 'Gojo Satoru',
    animeName: 'Jujutsu Kaisen',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b126446-TwtlBtf95t62.png',
    description: 'The strongest Jujutsu Sorcerer wielding the Limitless and Six Eyes techniques.',
  },
  {
    id: 'char-2',
    name: 'Eren Yeager',
    animeName: 'Attack on Titan',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40882-dsj7IP943WFF.jpg',
    description: 'Wielder of the Attack Titan moving forward for freedom.',
  },
  {
    id: 'char-3',
    name: 'Monkey D. Luffy',
    animeName: 'One Piece',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40-T4sF1a94Xm36.png',
    description: 'Straw Hat Captain determined to become the King of the Pirates!',
  },
];

import {
  type AccountVault,
  saveAccountVault,
  loadAccountVault,
} from '@/utils/accountVault';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  addFavoriteCharacter: (character: Omit<FavoriteCharacter, 'id'>) => Promise<void>;
  removeFavoriteCharacter: (id: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await loginApi(payload);
          const isAdmin = user.role === 'admin' || user.isAdmin === true;
          const cleanEmail = user.email.toLowerCase().trim();

          // 1. Check local account vault
          const vault = loadAccountVault(cleanEmail);

          // 2. Fetch server user sync data if available
          let serverData: {
            watchlist?: Anime[];
            history?: WatchHistoryItem[];
            avatar?: string | null;
            favoriteCharacters?: FavoriteCharacter[];
          } | null = null;

          try {
            serverData = await fetchUserDataApi(token);
          } catch {
            // Offline or server sync unavailable, will rely on local vault
          }

          // 3. Resolve profile data
          const resolvedAvatar =
            vault?.userProfile?.avatar ?? serverData?.avatar ?? user.avatar;
          const resolvedFavs =
            vault?.favoriteCharacters ??
            serverData?.favoriteCharacters ??
            user.favoriteCharacters ??
            DEFAULT_FAVORITE_CHARACTERS;

          // 4. Resolve watchlist and history
          // Check if guest currently has items to avoid losing what was just added
          const currentGuestWatchlist = useWatchlistStore.getState().animes;
          const currentGuestHistory = useHistoryStore.getState().history;

          const savedWatchlist: Anime[] =
            (serverData?.watchlist && serverData.watchlist.length > 0
              ? serverData.watchlist
              : vault?.watchlist) || [];

          const savedHistory: WatchHistoryItem[] =
            (serverData?.history && serverData.history.length > 0
              ? serverData.history
              : vault?.history) || [];

          // If account is new/empty but guest had items, merge them
          const finalWatchlist =
            savedWatchlist.length > 0
              ? savedWatchlist
              : currentGuestWatchlist;
          const finalHistory =
            savedHistory.length > 0
              ? savedHistory
              : currentGuestHistory;

          // 5. Hydrate stores with account's data
          useWatchlistStore.getState().setWatchlist(finalWatchlist);
          useHistoryStore.getState().setHistory(finalHistory);

          const fullUser: User = {
            ...user,
            isAdmin,
            role: isAdmin ? 'admin' : 'user',
            avatar: resolvedAvatar,
            favoriteCharacters: resolvedFavs,
          };

          // 6. Save current state back to vault
          saveAccountVault(cleanEmail, {
            userProfile: {
              avatar: resolvedAvatar,
              username: fullUser.username,
            },
            favoriteCharacters: resolvedFavs,
            watchlist: finalWatchlist,
            history: finalHistory,
          });

          set({
            user: fullUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Login failed.',
          });
          throw err;
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await registerApi(payload);
          const isAdmin = user.role === 'admin' || user.isAdmin === true;
          const cleanEmail = user.email.toLowerCase().trim();
          const initialFavs = DEFAULT_FAVORITE_CHARACTERS;

          // Inherit any active guest watchlist/history
          const guestWatchlist = useWatchlistStore.getState().animes;
          const guestHistory = useHistoryStore.getState().history;

          saveAccountVault(cleanEmail, {
            userProfile: { username: user.username, avatar: user.avatar },
            favoriteCharacters: initialFavs,
            watchlist: guestWatchlist,
            history: guestHistory,
          });

          const fullUser: User = {
            ...user,
            isAdmin,
            role: isAdmin ? 'admin' : 'user',
            favoriteCharacters: initialFavs,
          };

          set({
            user: fullUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Registration failed.',
          });
          throw err;
        }
      },

      updateProfile: async (updatedData) => {
        const { user, token } = get();
        if (!user) return;

        const nextUser = { ...user, ...updatedData };
        set({ user: nextUser });

        // Save to account vault
        saveAccountVault(user.email, {
          userProfile: {
            username: nextUser.username,
            avatar: nextUser.avatar,
          },
          favoriteCharacters: nextUser.favoriteCharacters,
        });

        // Sync to server API in background
        if (token) {
          try {
            await updateProfileApi(token, updatedData);
          } catch (err) {
            console.warn('Failed to sync profile update to server:', err);
          }
        }
      },

      addFavoriteCharacter: async (characterData) => {
        const { user, token } = get();
        if (!user) return;

        const currentList = user.favoriteCharacters || DEFAULT_FAVORITE_CHARACTERS;
        if (currentList.length >= 15) return;

        const newChar: FavoriteCharacter = {
          id: `char-${Date.now()}`,
          ...characterData,
        };
        const updated = [...currentList, newChar];
        const nextUser = { ...user, favoriteCharacters: updated };
        set({ user: nextUser });

        saveAccountVault(user.email, {
          favoriteCharacters: updated,
        });

        if (token) {
          try {
            await updateProfileApi(token, { favoriteCharacters: updated });
          } catch (err) {
            console.warn('Failed to sync favorite character to server:', err);
          }
        }
      },

      removeFavoriteCharacter: async (id) => {
        const { user, token } = get();
        if (!user) return;

        const currentList = user.favoriteCharacters || DEFAULT_FAVORITE_CHARACTERS;
        const updated = currentList.filter((c) => c.id !== id);
        const nextUser = { ...user, favoriteCharacters: updated };
        set({ user: nextUser });

        saveAccountVault(user.email, {
          favoriteCharacters: updated,
        });

        if (token) {
          try {
            await updateProfileApi(token, { favoriteCharacters: updated });
          } catch (err) {
            console.warn('Failed to sync favorite character to server:', err);
          }
        }
      },

      logout: () => {
        const { user, token } = get();

        // 1. Securely snapshot current account data before clearing
        if (user && user.email) {
          const email = user.email;
          const currentWatchlist = useWatchlistStore.getState().animes;
          const currentHistory = useHistoryStore.getState().history;
          const currentFavs = user.favoriteCharacters || [];
          const currentAvatar = user.avatar || null;

          // Save to persistent per-account vault
          saveAccountVault(email, {
            userProfile: {
              avatar: currentAvatar || undefined,
              username: user.username,
            },
            favoriteCharacters: currentFavs,
            watchlist: currentWatchlist,
            history: currentHistory,
          });

          // Sync to backend server
          if (token) {
            syncUserDataApi(token, {
              watchlist: currentWatchlist,
              history: currentHistory,
              favoriteCharacters: currentFavs,
              avatar: currentAvatar,
            }).catch(() => {});
          }
        }

        // 2. Clear active in-memory and persistent guest session
        useWatchlistStore.getState().clear();
        useHistoryStore.getState().clearHistory();

        // 3. Clear auth session
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'yumenime-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
