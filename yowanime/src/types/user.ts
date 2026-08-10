// ── User types ────────────────────────────────────────────────

export interface FavoriteCharacter {
  id: string;
  name: string;
  animeName: string;
  role?: string;
  image: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
  favoriteCharacters?: FavoriteCharacter[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
