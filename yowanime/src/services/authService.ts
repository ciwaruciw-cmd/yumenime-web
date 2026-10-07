import type { LoginPayload, RegisterPayload, AuthResponse, User } from '@/types/user';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Login gagal.');
  }

  return res.json();
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Registrasi gagal.');
  }

  return res.json();
}

export async function updateProfileApi(token: string, data: Partial<User>): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Gagal memperbarui profil.');
  }

  return res.json();
}

export async function syncUserDataApi(
  token: string,
  data: { watchlist?: any[]; history?: any[]; favoriteCharacters?: any[]; avatar?: string | null }
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/user/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Gagal sinkronisasi data akun.');
  }

  return res.json();
}

export async function fetchUserDataApi(token: string): Promise<{
  watchlist: any[];
  history: any[];
  avatar: string | null;
  favoriteCharacters: any[];
}> {
  const res = await fetch(`${API_BASE}/user/sync`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Gagal memuat data akun.');
  }

  return res.json();
}

export async function logoutApi(): Promise<void> {
  await Promise.resolve();
}
