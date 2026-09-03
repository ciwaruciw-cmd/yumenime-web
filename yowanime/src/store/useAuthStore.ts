import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginPayload, RegisterPayload, FavoriteCharacter } from '@/types/user';
import { loginApi, registerApi } from '@/services/authService';

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

// ── Helpers to persist favorite characters per-user in localStorage ──
const FAVS_PREFIX = 'yowanime_favchars_';

function saveFavoritesToStorage(email: string, chars: FavoriteCharacter[]): void {
  try {
    localStorage.setItem(FAVS_PREFIX + email.toLowerCase(), JSON.stringify(chars));
  } catch { /* quota exceeded or unavailable */ }
}

function loadFavoritesFromStorage(email: string): FavoriteCharacter[] | null {
  try {
    const raw = localStorage.getItem(FAVS_PREFIX + email.toLowerCase());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* corrupted */ }
  return null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => void;
  addFavoriteCharacter: (character: Omit<FavoriteCharacter, 'id'>) => void;
  removeFavoriteCharacter: (id: string) => void;
  logout: () => void;
  clearError: () => void;
}

const performLogin = async (payload: LoginPayload): Promise<{ user: User; token: string }> => {
  return loginApi(payload);
};

const performRegister = async (payload: RegisterPayload): Promise<{ user: User; token: string }> => {
  return registerApi(payload);
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await performLogin(payload);
          const isAdmin = user.role === 'admin' || user.isAdmin === true;
          // Restore saved favorites from localStorage for this user
          const savedFavs = loadFavoritesFromStorage(user.email);
          set({
            user: {
              ...user,
              isAdmin,
              role: isAdmin ? 'admin' : 'user',
              favoriteCharacters: savedFavs ?? user.favoriteCharacters ?? DEFAULT_FAVORITE_CHARACTERS,
            },
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
          const { user, token } = await performRegister(payload);
          const isAdmin = user.role === 'admin' || user.isAdmin === true;
          const initialFavs = DEFAULT_FAVORITE_CHARACTERS;
          // Save initial favorites for new user
          saveFavoritesToStorage(user.email, initialFavs);
          set({
            user: {
              ...user,
              isAdmin,
              role: isAdmin ? 'admin' : 'user',
              favoriteCharacters: initialFavs,
            },
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

      updateProfile: (updatedData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedData } : null,
        }));
      },

      addFavoriteCharacter: (characterData) => {
        set((state) => {
          if (!state.user) return state;
          const currentList = state.user.favoriteCharacters || DEFAULT_FAVORITE_CHARACTERS;
          if (currentList.length >= 15) return state;
          const newChar: FavoriteCharacter = {
            id: `char-${Date.now()}`,
            ...characterData,
          };
          const updated = [...currentList, newChar];
          // Persist to localStorage
          saveFavoritesToStorage(state.user.email, updated);
          return {
            user: {
              ...state.user,
              favoriteCharacters: updated,
            },
          };
        });
      },

      removeFavoriteCharacter: (id) => {
        set((state) => {
          if (!state.user) return state;
          const currentList = state.user.favoriteCharacters || DEFAULT_FAVORITE_CHARACTERS;
          const updated = currentList.filter((c) => c.id !== id);
          // Persist to localStorage
          saveFavoritesToStorage(state.user.email, updated);
          return {
            user: {
              ...state.user,
              favoriteCharacters: updated,
            },
          };
        });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'yumenime-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
