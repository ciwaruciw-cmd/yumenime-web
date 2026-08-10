import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginPayload, RegisterPayload, FavoriteCharacter } from '@/types/user';
import { loginApi, registerApi } from '@/services/authService';
import { isAdminEmail } from '@/config/adminConfig';

export const DEFAULT_FAVORITE_CHARACTERS: FavoriteCharacter[] = [
  {
    id: 'char-1',
    name: 'Gojo Satoru',
    animeName: 'Jujutsu Kaisen',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b126446-TwtlBtf95t62.png',
    description: 'Penyihir Jujutsu paling sakti dengan teknik Limitless dan Six Eyes.',
  },
  {
    id: 'char-2',
    name: 'Eren Yeager',
    animeName: 'Attack on Titan',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40882-dsj7IP943WFF.jpg',
    description: 'Pemegang kekuatan Attack Titan yang terus maju demi kebebasan.',
  },
  {
    id: 'char-3',
    name: 'Monkey D. Luffy',
    animeName: 'One Piece',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40-T4sF1a94Xm36.png',
    description: 'Kapten Topi Jerami bertekad menjadi Raja Bajak Laut!',
  },
];

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
  try {
    const res = await loginApi(payload);
    return res;
  } catch (err) {
    // If backend isn't running, fallback to dev mock
    if (payload.email === 'test@test.com' && payload.password === 'password') {
      return {
        user: {
          id: 'u1',
          username: 'AnimeKun',
          email: payload.email,
          avatar: 'https://picsum.photos/seed/user1/80/80',
          createdAt: new Date().toISOString(),
          favoriteCharacters: DEFAULT_FAVORITE_CHARACTERS,
        },
        token: 'mock-jwt-token',
      };
    }
    throw err;
  }
};

const performRegister = async (payload: RegisterPayload): Promise<{ user: User; token: string }> => {
  try {
    const res = await registerApi(payload);
    return res;
  } catch (err) {
    // Dev fallback
    return {
      user: {
        id: `u-${Date.now()}`,
        username: payload.username,
        email: payload.email,
        createdAt: new Date().toISOString(),
        favoriteCharacters: DEFAULT_FAVORITE_CHARACTERS,
      },
      token: 'mock-jwt-token-new',
    };
  }
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
          const admin = isAdminEmail(user.email);
          set({ user: { ...user, isAdmin: admin, role: admin ? 'admin' : 'user' }, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Login gagal.',
          });
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token } = await performRegister(payload);
          const admin = isAdminEmail(user.email);
          set({ user: { ...user, isAdmin: admin, role: admin ? 'admin' : 'user' }, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : 'Registrasi gagal.',
          });
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
          return {
            user: {
              ...state.user,
              favoriteCharacters: [...currentList, newChar],
            },
          };
        });
      },

      removeFavoriteCharacter: (id) => {
        set((state) => {
          if (!state.user) return state;
          const currentList = state.user.favoriteCharacters || DEFAULT_FAVORITE_CHARACTERS;
          return {
            user: {
              ...state.user,
              favoriteCharacters: currentList.filter((c) => c.id !== id),
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
