/**
 * animeService.ts
 *
 * Service layer utama untuk data anime.
 * Menggunakan AniList GraphQL API (https://graphql.anilist.co) — 100% gratis, tanpa API Key, tanpa CORS, respon sangat cepat.
 * Menyediakan poster HD resmi, genre akurat, deskripsi, skor, trailer, serta karakter & pengisi suara (VA).
 */

import type { Anime, AnimeFilterParams, AnimeListResponse } from '@/types/anime';
import type { Episode } from '@/types/episode';
import {
  fetchAniListList,
  fetchAniListById,
  fetchAniListEpisodes,
} from '@/services/anilistService';
import {
  mockAnimes,
  mockEpisodes,
  getFeaturedAnime,
  getTrendingAnimes,
  getNewUpdateAnimes,
} from '@/data/mockAnime';

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Ambil daftar anime dengan filter (genre, status, search, sort) dan pagination.
 * Menggunakan AniList GraphQL API dengan fallback ke mock data jika jaringan offline.
 */
export async function getAnimeList(params: AnimeFilterParams = {}): Promise<AnimeListResponse> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;

  try {
    const res = await fetchAniListList(params);
    return {
      data: res.data,
      total: res.total,
      page,
      pageSize,
      hasMore: res.hasMore,
    };
  } catch (err) {
    console.warn('[animeService] AniList API error, falling back to mock:', err);
    return getAnimeListMock(params);
  }
}

/** Fallback ke mock data lokal (case-insensitive genre matching) */
function getAnimeListMock(params: AnimeFilterParams): AnimeListResponse {
  let filtered = [...mockAnimes];

  // Exclude hentai/adult content unless explicitly filtered by hentai genre
  if (params.genre?.toLowerCase() !== 'hentai') {
    filtered = filtered.filter(
      (a) => !a.genres.includes('Hentai') && a.rating !== '18+' && a.rating !== 'Rx'
    );
  }

  if (params.genre) {
    const gLower = params.genre.toLowerCase();
    filtered = filtered.filter((a) =>
      a.genres.some((g) => g.toLowerCase() === gLower)
    );
  }
  if (params.status) filtered = filtered.filter((a) => a.status === params.status);
  if (params.year) filtered = filtered.filter((a) => a.year === params.year);
  if (params.type) filtered = filtered.filter((a) => a.type === params.type);
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.titleEnglish?.toLowerCase().includes(q) ?? false) ||
        a.synopsis.toLowerCase().includes(q)
    );
  }

  if (params.sort === 'score') filtered.sort((a, b) => b.score - a.score);
  else if (params.sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
  else filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;
  const start = (page - 1) * pageSize;

  return {
    data: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
  };
}

/**
 * Detail satu anime berdasarkan ID / slug.
 */
export async function getAnimeById(idOrSlug: string): Promise<Anime | null> {
  if (!idOrSlug) return null;

  // 1. Check local mock dataset first (instant response, zero latency)
  const localFound = mockAnimes.find(
    (a) => a.id === idOrSlug || a.slug === idOrSlug || a.id.toLowerCase() === idOrSlug.toLowerCase()
  );

  if (localFound) {
    // If no trailer yet, enrich with AniList trailer (max 2s timeout so we don't block UI)
    if (!localFound.trailer) {
      try {
        const live = await Promise.race<Anime | null>([
          fetchAniListById(localFound.title),
          new Promise<null>((r) => setTimeout(() => r(null), 2000)),
        ]);
        if (live?.trailer) {
          (localFound as Anime).trailer = live.trailer;
        }
      } catch { /* silently ignore */ }
    }
    return localFound;
  }

  // 2. Fallback to live AniList API
  try {
    const liveAnime = await fetchAniListById(idOrSlug);
    if (liveAnime) return liveAnime;
  } catch (err) {
    console.warn('[animeService] AniList detail error, falling back:', err);
  }

  return null;
}

/**
 * Daftar episode anime berdasarkan ID / slug.
 */
export async function getEpisodes(animeId: string): Promise<Episode[]> {
  if (!animeId) return [];

  const anime = await getAnimeById(animeId);
  const targetId = anime ? anime.id : animeId;
  const targetSlug = anime ? anime.slug : animeId;

  // Match episodes in mockEpisodes by anime.id, anime.slug, or the passed animeId
  const explicitMatching = mockEpisodes.filter(
    (ep) =>
      ep.animeId === targetId ||
      ep.animeId === targetSlug ||
      ep.animeId === animeId ||
      ep.animeId.toLowerCase() === targetId.toLowerCase() ||
      ep.animeId.toLowerCase() === targetSlug.toLowerCase()
  );

  if (explicitMatching.length > 0) {
    return explicitMatching;
  }

  if (anime) {
    return fetchAniListEpisodes(anime);
  }

  // Fallback: generate 12 clean episodes for targetId
  return Array.from({ length: 12 }, (_, i) => {
    const epNum = i + 1;
    return {
      id: `${targetId}-ep-${epNum}`,
      animeId: targetId,
      number: epNum,
      title: `Episode ${epNum}`,
      thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
      duration: 1440,
      aired: '2026-08-01',
      sources: [
        {
          quality: '1080p',
          url: 'https://vjs.zencdn.net/v/oceans.mp4',
        },
        {
          quality: '720p',
          url: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        },
        {
          quality: '480p',
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
        },
      ],
    };
  });
}

/**
 * Pencarian anime.
 */
export async function searchAnime(query: string): Promise<Anime[]> {
  if (!query.trim()) return [];

  try {
    const res = await fetchAniListList({ search: query.trim(), pageSize: 24 });
    return res.data;
  } catch (err) {
    console.warn('[animeService] Search error, falling back to mock:', err);
    const q = query.toLowerCase();
    return mockAnimes.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.titleEnglish?.toLowerCase().includes(q) ?? false) ||
        a.studio.toLowerCase().includes(q)
    );
  }
}

// ── Homepage data helpers ────────────────────────────────────────────────────
export { getFeaturedAnime, getTrendingAnimes, getNewUpdateAnimes };
