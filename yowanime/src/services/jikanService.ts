/**
 * jikanService.ts
 *
 * HTTP client untuk Jikan API v4 (https://jikan.moe)
 * Wrapper tidak resmi dari MyAnimeList — gratis, tanpa API key, tanpa setup.
 *
 * Rate limit: ~3 req/detik | 60 req/menit
 * Base URL: https://api.jikan.moe/v4
 *
 * Dokumentasi lengkap: https://docs.api.jikan.moe/
 */

const BASE = 'https://api.jikan.moe/v4';

// ── Tipe raw response Jikan ──────────────────────────────────────────────────

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
}

export interface JikanImage {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface JikanGenre {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanStudio {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface JikanAnime {
  mal_id: number;
  url: string;
  images: { jpg: JikanImage; webp?: JikanImage };
  trailer: { youtube_id: string | null; url: string | null; embed_url: string | null };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null;       // "TV", "Movie", "OVA", ...
  source: string | null;
  episodes: number | null;
  status: string | null;     // "Currently Airing", "Finished Airing", "Not yet aired"
  airing: boolean;
  aired: { from: string | null; to: string | null };
  duration: string | null;
  rating: string | null;
  score: number | null;
  rank: number | null;
  popularity: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;     // "winter" | "spring" | "summer" | "fall"
  year: number | null;
  studios: JikanStudio[];
  genres: JikanGenre[];
  themes: JikanGenre[];
  demographics: JikanGenre[];
}

export interface JikanEpisode {
  mal_id: number;
  url: string;
  title: string;
  title_japanese: string | null;
  aired: string | null;
  score: number | null;
  filler: boolean;
  recap: boolean;
}

export interface JikanCharacterEdge {
  character: {
    mal_id: number;
    images: { jpg: JikanImage };
    name: string;
    url: string;
  };
  role: 'Main' | 'Supporting';
  voice_actors: {
    person: { name: string; images: { jpg: JikanImage }; url: string };
    language: string;
  }[];
}

export interface JikanListResponse<T> {
  pagination: JikanPagination;
  data: T[];
}

export interface JikanSingleResponse<T> {
  data: T;
}

// ── Fetcher ─────────────────────────────────────────────────────────────────

async function jikanFetch<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url);

  if (!res.ok) {
    // Jika kena rate limit, tunggu sebentar lalu retry sekali
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200));
      const retry = await fetch(url);
      if (!retry.ok) throw new Error(`Jikan API ${retry.status}: ${path}`);
      return (await retry.json()) as T;
    }
    throw new Error(`Jikan API ${res.status}: ${path}`);
  }

  return (await res.json()) as T;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Top anime (Highest rated — berguna untuk halaman utama) */
export async function getJikanTopAnime(page = 1): Promise<JikanListResponse<JikanAnime>> {
  return jikanFetch(`/top/anime?page=${page}&limit=24`);
}

/** Anime yang sedang tayang saat ini */
export async function getJikanCurrentSeason(page = 1): Promise<JikanListResponse<JikanAnime>> {
  return jikanFetch(`/seasons/now?page=${page}&limit=24`);
}

/** Anime yang sudah selesai (filter = bypopularity) */
export async function getJikanCompletedAnime(page = 1): Promise<JikanListResponse<JikanAnime>> {
  return jikanFetch(`/top/anime?page=${page}&limit=24&type=tv&filter=bypopularity`);
}

/** Detail satu anime berdasarkan MAL ID */
export async function getJikanAnime(malId: number): Promise<JikanSingleResponse<JikanAnime>> {
  return jikanFetch(`/anime/${malId}/full`);
}

/** Daftar episode anime */
export async function getJikanEpisodes(malId: number, page = 1): Promise<JikanListResponse<JikanEpisode>> {
  return jikanFetch(`/anime/${malId}/episodes?page=${page}`);
}

/** Karakter anime */
export async function getJikanCharacters(malId: number): Promise<{ data: JikanCharacterEdge[] }> {
  return jikanFetch(`/anime/${malId}/characters`);
}

/** Pencarian anime */
export async function searchJikan(query: string, page = 1): Promise<JikanListResponse<JikanAnime>> {
  return jikanFetch(`/anime?q=${encodeURIComponent(query)}&page=${page}&limit=24&sfw=true`);
}

/** Anime per genre (menggunakan MAL genre ID) */
export async function getJikanByGenre(genreId: number, page = 1): Promise<JikanListResponse<JikanAnime>> {
  return jikanFetch(`/anime?genres=${genreId}&page=${page}&limit=24&order_by=score&sort=desc`);
}

/** Daftar semua genre dari Jikan */
export async function getJikanGenres(): Promise<{ data: JikanGenre[] }> {
  return jikanFetch('/genres/anime');
}

/** Anime berdasarkan status airing */
export async function getJikanByStatus(status: 'airing' | 'complete' | 'upcoming', page = 1): Promise<JikanListResponse<JikanAnime>> {
  return jikanFetch(`/anime?status=${status}&page=${page}&limit=24&order_by=score&sort=desc`);
}
