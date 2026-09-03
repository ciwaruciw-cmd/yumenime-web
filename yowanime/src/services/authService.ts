import type { LoginPayload, RegisterPayload, AuthResponse } from '@/types/user';

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

export async function logoutApi(): Promise<void> {
  await Promise.resolve();
}
