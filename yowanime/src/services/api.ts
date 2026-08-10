/**
 * API service layer.
 * In dev, returns mock data. In prod, calls VITE_API_BASE_URL.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text().catch(() => 'Unknown error');
    throw new Error(`API Error ${res.status}: ${message}`);
  }

  return res.json() as Promise<T>;
}
