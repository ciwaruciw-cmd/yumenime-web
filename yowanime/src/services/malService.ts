/**
 * malService.ts
 * MyAnimeList data via Jikan API v4 (https://api.jikan.moe/v4)
 * Jikan is the official MAL REST API wrapper — free, no auth, CORS-enabled.
 * Images come from MAL CDN: https://cdn.myanimelist.net/images/...
 */

const JIKAN_BASE = 'https://api.jikan.moe/v4';

export interface JikanAnime {
  mal_id: number;
  url: string;
  images: {
    jpg: { image_url: string; small_image_url: string; large_image_url: string };
    webp: { image_url: string; small_image_url: string; large_image_url: string };
  };
  trailer: { youtube_id: string | null; url: string | null; embed_url: string | null };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string;
  episodes: number | null;
  status: string;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  synopsis: string | null;
  season: string | null;
  year: number | null;
  studios: { mal_id: number; name: string }[];
  genres: { mal_id: number; name: string }[];
  duration: string | null;
  rating: string | null;
  source: string | null;
}

export interface JikanCharacter {
  character: {
    mal_id: number;
    url: string;
    images: { jpg: { image_url: string }; webp?: { image_url: string } };
    name: string;
  };
  role: string;
  voice_actors: {
    person: {
      mal_id: number;
      name: string;
      images: { jpg: { image_url: string } };
    };
    language: string;
  }[];
}

export interface JikanApiResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    items: { count: number; total: number; per_page: number };
  };
}

/** Fetch a single anime by MAL ID */
export async function fetchMalAnime(malId: number): Promise<JikanAnime> {
  const res = await fetch(`${JIKAN_BASE}/anime/${malId}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: JikanApiResponse<JikanAnime> = await res.json();
  return json.data;
}

/** Fetch top anime (by score) from MAL, paginated */
export async function fetchTopAnime(page = 1, limit = 25): Promise<JikanAnime[]> {
  const res = await fetch(`${JIKAN_BASE}/top/anime?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: JikanApiResponse<JikanAnime[]> = await res.json();
  return json.data;
}

/** Search anime on MAL */
export async function searchMalAnime(query: string, limit = 20): Promise<JikanAnime[]> {
  const res = await fetch(
    `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=${limit}&sfw=true`
  );
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: JikanApiResponse<JikanAnime[]> = await res.json();
  return json.data;
}

/** Fetch characters for an anime by MAL ID */
export async function fetchMalCharacters(malId: number): Promise<JikanCharacter[]> {
  const res = await fetch(`${JIKAN_BASE}/anime/${malId}/characters`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: JikanApiResponse<JikanCharacter[]> = await res.json();
  return json.data;
}

/** Fetch currently airing / seasonal anime */
export async function fetchSeasonalAnime(year: number, season: string): Promise<JikanAnime[]> {
  const res = await fetch(`${JIKAN_BASE}/seasons/${year}/${season}`);
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: JikanApiResponse<JikanAnime[]> = await res.json();
  return json.data;
}
