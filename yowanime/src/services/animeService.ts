/**
 * animeService.ts
 *
 * Service layer utama untuk data anime.
 * Menggunakan AniList GraphQL API (https://graphql.anilist.co) — 100% gratis, tanpa API Key, tanpa CORS, respon sangat cepat.
 * Menyediakan poster HD resmi, genre akurat, deskripsi, skor, trailer, serta karakter & pengisi suara (VA).
 */

import type { Anime, AnimeFilterParams, AnimeListResponse } from '@/types/anime';
import type { Episode, VideoSource } from '@/types/episode';
import {
  fetchAniListList,
  fetchAniListById,
  fetchAniListEpisodes,
} from '@/services/anilistService';
import {
  mockAnimes,
  mockEpisodes,
  isDonghua,
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

  // Exclude Donghua anywhere unless explicitly searched
  if (!params.search?.trim()) {
    filtered = filtered.filter((a) => !isDonghua(a));
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

const DUMMY_DOMAINS = ['commondatastorage', 'vjs.zencdn', 'w3schools', 'mozilla.net'];

function isRealStream(url?: string): boolean {
  if (!url) return false;
  return !DUMMY_DOMAINS.some((d) => url.includes(d));
}

function extractCoreTokens(str?: string): { mainTokens: string[]; seasonNum?: number } {
  if (!str) return { mainTokens: [] };

  let clean = str.toLowerCase();

  let seasonNum: number | undefined;
  const sMatch = clean.match(/season\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*season|\bs(\d+)\b/i);
  if (sMatch) {
    seasonNum = parseInt(sMatch[1] || sMatch[2] || sMatch[3], 10);
  }

  clean = clean
    .replace(/subtitle\s*indonesia/gi, '')
    .replace(/sub\s*indo/gi, '')
    .replace(/season\s*\d+|s\d+|\d+(?:st|nd|rd|th)\s*season/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  const stopWords = new Set([
    'the', 'and', 'for', 'sub', 'dub', 'in', 'of', 'to', 'a', 'an', 'no', 'wa',
    'ga', 'de', 'ni', 'o', 'wo', 'kara', 'starting', 'life', 'another', 'world',
    'hen', 'arc'
  ]);

  const mainTokens = clean
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w));

  return { mainTokens, seasonNum };
}

function enrichSourcesWithLiveServers(
  sources: VideoSource[] | undefined,
  animeId: string,
  malId: string | number | undefined,
  epNum: number
): VideoSource[] {
  const realSources = (sources || []).filter((s) => isRealStream(s.url));
  const liveServers: VideoSource[] = [
    { quality: '1080p', url: `https://vidlink.pro/anime/${animeId}/${epNum}` },
    { quality: '720p', url: `https://www.2embed.cc/embed/anime/${animeId}/${epNum}` },
    { quality: '480p', url: `https://vidsrc.me/embed/anime?mal=${malId || animeId}&ep=${epNum}` },
  ];

  if (realSources.length > 0) {
    return [
      liveServers[0],
      ...realSources,
      liveServers[1],
      liveServers[2],
    ];
  }
  return liveServers;
}

/**
 * Daftar episode anime berdasarkan ID / slug.
 * Menghubungkan AniList ID / search ke video stream Otakudesu/Samehadaku/Nekopoi asli dan live multi-server HD.
 */
export async function getEpisodes(animeId: string): Promise<Episode[]> {
  if (!animeId) return [];

  const anime = await getAnimeById(animeId);
  const targetId = anime ? anime.id : animeId;
  const targetSlug = anime ? anime.slug : animeId;
  const malId = anime?.malId || anime?.id || animeId;

  // ── Step 1: Direct match in mockEpisodes ──────────────────────────────────
  const exact = mockEpisodes.filter(
    (ep) =>
      ep.animeId === targetId ||
      ep.animeId === targetSlug ||
      ep.animeId === animeId ||
      ep.animeId.toLowerCase() === targetId.toLowerCase() ||
      ep.animeId.toLowerCase() === targetSlug.toLowerCase()
  );

  if (exact.length > 0) {
    const fallbackThumb = anime?.banner || anime?.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';
    return exact
      .sort((a, b) => a.number - b.number)
      .map((ep) => ({
        ...ep,
        thumbnail: (ep.thumbnail && !ep.thumbnail.includes('unsplash.com'))
          ? ep.thumbnail
          : fallbackThumb,
        sources: enrichSourcesWithLiveServers(ep.sources, targetId, malId, ep.number),
      }));
  }

  // ── Step 2: Intelligent multi-title & season matcher ─────────────────────
  const queryTitles = [
    anime?.title,
    anime?.titleRomaji,
    anime?.titleEnglish,
    anime?.titleJapanese,
    targetSlug,
    targetId,
    animeId,
  ].filter(Boolean) as string[];

  // Group all mockEpisodes by animeId
  const epGroups = new Map<string, Episode[]>();
  mockEpisodes.forEach((ep) => {
    const g = epGroups.get(ep.animeId) ?? [];
    g.push(ep);
    epGroups.set(ep.animeId, g);
  });

  let bestCandidateEpisodes: Episode[] = [];
  let bestScore = 0;

  for (const [groupAnimeId, groupEps] of epGroups.entries()) {
    const firstEp = groupEps[0];
    const hasReal = isRealStream(firstEp?.sources?.[0]?.url);
    const hasRealThumb = firstEp?.thumbnail && !firstEp.thumbnail.includes('unsplash.com');
    const isDirectStorage = firstEp?.sources?.[0]?.url?.includes('storages.sokuja.uk');
    const targetGroupAnime = mockAnimes.find((a) => a.id === groupAnimeId || a.slug === groupAnimeId);

    const candidateTitles = [
      groupAnimeId,
      targetGroupAnime?.title,
      targetGroupAnime?.titleRomaji,
      targetGroupAnime?.titleEnglish,
      targetGroupAnime?.titleJapanese,
      targetGroupAnime?.slug,
    ].filter(Boolean) as string[];

    for (const qTitle of queryTitles) {
      const q = extractCoreTokens(qTitle);
      if (q.mainTokens.length === 0) continue;

      for (const cTitle of candidateTitles) {
        const c = extractCoreTokens(cTitle);
        if (c.mainTokens.length === 0) continue;

        let tokenMatches = 0;
        for (const qt of q.mainTokens) {
          if (c.mainTokens.some((ct) => ct === qt || ct.includes(qt) || qt.includes(ct))) {
            tokenMatches++;
          }
        }

        const tokenScore = tokenMatches / q.mainTokens.length;

        // Season bonus / penalty
        let seasonBonus = 0;
        if (q.seasonNum !== undefined && c.seasonNum !== undefined) {
          if (q.seasonNum === c.seasonNum) seasonBonus = 0.35;
          else seasonBonus = -0.6; // Wrong season penalty!
        }

        // Real stream and real thumbnail bonus: prioritize actual scraped streams & real episode thumbnails
        const realBonus = hasReal ? 0.3 : 0;
        const thumbBonus = hasRealThumb ? 0.25 : 0;
        const storageBonus = isDirectStorage ? 0.2 : 0;

        const totalScore = tokenScore + seasonBonus + realBonus + thumbBonus + storageBonus;

        if (tokenMatches >= 1 && totalScore > bestScore && tokenScore >= 0.45) {
          bestScore = totalScore;
          bestCandidateEpisodes = groupEps;
        }
      }
    }
  }

  const fallbackThumb = anime?.banner || anime?.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600';

  if (bestCandidateEpisodes.length > 0) {
    return bestCandidateEpisodes
      .sort((a, b) => a.number - b.number)
      .map((ep) => ({
        ...ep,
        thumbnail: (ep.thumbnail && !ep.thumbnail.includes('unsplash.com'))
          ? ep.thumbnail
          : fallbackThumb,
        sources: enrichSourcesWithLiveServers(ep.sources, targetId, malId, ep.number),
      }));
  }

  // If exact match existed (even fallback), use it
  if (exact.length > 0) {
    return exact
      .sort((a, b) => a.number - b.number)
      .map((ep) => ({
        ...ep,
        thumbnail: (ep.thumbnail && !ep.thumbnail.includes('unsplash.com'))
          ? ep.thumbnail
          : fallbackThumb,
        sources: enrichSourcesWithLiveServers(ep.sources, targetId, malId, ep.number),
      }));
  }

  // ── Step 3: AniList fallback episode generation ───────────────────────────
  if (anime) {
    return fetchAniListEpisodes(anime);
  }

  // ── Step 4: Final fallback with live multi-server streaming ───────────────
  return Array.from({ length: 12 }, (_, i) => {
    const epNum = i + 1;
    return {
      id: `${targetId}-ep-${epNum}`,
      animeId: targetId,
      number: epNum,
      title: `Episode ${epNum}`,
      thumbnail: fallbackThumb,
      duration: 1440,
      aired: '2026-08-01',
      sources: enrichSourcesWithLiveServers(undefined, targetId, malId, epNum),
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
