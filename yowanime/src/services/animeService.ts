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

// Lazy loader for mock dataset: only loaded when user is completely offline
let _cachedMockAnimes: Anime[] | null = null;
async function getMockAnimes(): Promise<Anime[]> {
  if (!_cachedMockAnimes) {
    try {
      const mod = await import('@/data/mockAnime');
      _cachedMockAnimes = mod.mockAnimes;
    } catch {
      _cachedMockAnimes = [];
    }
  }
  return _cachedMockAnimes;
}

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
    return await getAnimeListMock(params);
  }
}

/** Fallback ke mock data lokal (case-insensitive genre matching) */
async function getAnimeListMock(params: AnimeFilterParams): Promise<AnimeListResponse> {
  const allMock = await getMockAnimes();
  let filtered = [...allMock];

  // Exclude hentai/adult content unless explicitly filtered by hentai or yuri genre
  const isAdultGenre = ['hentai', 'yuri'].includes(params.genre?.toLowerCase() ?? '');
  if (!isAdultGenre) {
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

  // 1. Live AniList API (with instant memory & session cache)
  try {
    const liveAnime = await fetchAniListById(idOrSlug);
    if (liveAnime) return liveAnime;
  } catch (err) {
    console.warn('[animeService] AniList detail error, falling back:', err);
  }

  // 2. Fallback to scraped anime database
  try {
    const res = await fetch(`/api/scraped/animes?slug=${encodeURIComponent(idOrSlug)}`);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        return list[0];
      }
    }
  } catch {
    // offline fallback
  }

  // 3. Offline fallback to local mock dataset (lazy-loaded, zero cost on initial load)
  try {
    const allMock = await getMockAnimes();
    const localFound = allMock.find(
      (a) => a.id === idOrSlug || a.slug === idOrSlug || a.id.toLowerCase() === idOrSlug.toLowerCase()
    );
    if (localFound) return localFound;
  } catch {}

  return null;
}

/**
 * Cek apakah URL adalah dummy/sample video (bukan stream anime asli)
 */
function isDummyStream(url?: string): boolean {
  if (!url) return true;
  return (
    url.includes('w3.org') ||
    url.includes('zencdn') ||
    url.includes('w3schools') ||
    url.includes('commondatastorage') ||
    url.includes('interactive-examples.mdn') ||
    url.includes('oceans.mp4') ||
    url.includes('sintel') ||
    url.includes('mov_bbb') ||
    url.includes('link.desustream.com') ||
    url.includes('filedon.co') ||
    url.includes('otakufiles.net') ||
    url.includes('krakenfiles.com') ||
    url.includes('googlevideo.com') ||
    url.includes('.mkv')
  );
}

function sanitizeSources(sources: VideoSource[]): VideoSource[] {
  const s1080 = sources.find((s) => s.quality === '1080p')?.url;
  const s720 = sources.find((s) => s.quality === '720p')?.url;
  const s480 = sources.find((s) => s.quality === '480p')?.url;

  const real1080 = !isDummyStream(s1080) ? s1080 : undefined;
  const real720 = !isDummyStream(s720) ? s720 : undefined;
  const real480 = !isDummyStream(s480) ? s480 : undefined;
  const bestReal = real1080 || real720 || real480;

  if (bestReal) {
    return [
      { quality: '1080p', url: real1080 || bestReal },
      { quality: '720p',  url: real720  || bestReal },
      { quality: '480p',  url: real480  || real720 || bestReal },
    ];
  }
  return sources;
}

function extractTokens(str: string): { tokens: string[]; season?: number } {
  let season: number | undefined;
  const clean = (str || '')
    .toLowerCase()
    .replace(/(?:season|s)\s*(\d+)|(\d+)(?:st|nd|rd|th)\s*season/gi, (_, s1, s2) => {
      season = parseInt(s1 || s2);
      return '';
    })
    .replace(/sub\s*indo|subtitle\s*indonesia/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();

  const stop = new Set(['the', 'and', 'for', 'sub', 'dub', 'in', 'of', 'to', 'a', 'an', 'no', 'wa', 'ga', 'de', 'ni', 'wo', 'da', 'datta']);
  const tokens = clean.split(/\s+/).filter((w) => w.length >= 2 && !stop.has(w));
  return { tokens, season };
}

/** Slug-based similarity score between query string and candidate */
function slugScore(query: string, candidate: string): number {
  if (!query || !candidate) return 0;
  if (/^\d+$/.test(query.trim())) return 0; // Pure numeric IDs must not match as titles

  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/sub\s*indo|subtitle\s*indonesia/gi, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const q = normalize(query);
  const c = normalize(candidate);

  // Strip source prefix (otaku-, same-, sokuja-)
  const cStripped = c.replace(/^(otaku|same|sokuja)-/, '');
  // Strip trailing -sub-indo
  const cClean = cStripped.replace(/-sub-indo$/, '');

  if (q === cClean) return 1.0;
  if (q.length >= 6 && (cClean.includes(q) || q.includes(cClean))) return 0.85;

  const { tokens: qt, season: qs } = extractTokens(query);
  const { tokens: ct, season: cs } = extractTokens(candidate);
  if (qt.length === 0) return 0;

  let matches = 0;
  for (const t of qt) {
    if (ct.some((c2) => c2 === t || (t.length >= 4 && c2.length >= 4 && (c2.includes(t) || t.includes(c2))))) {
      matches++;
    }
  }
  const tokenScore = matches / qt.length;
  let seasonBonus = 0;
  if (qs !== undefined && cs !== undefined) {
    seasonBonus = qs === cs ? 0.3 : -0.5;
  }
  return Math.max(0, tokenScore + seasonBonus);
}

/**
 * Resolve real-time 1080p and 720p stream from web scraper sources
 */
export async function resolveEpisodeStream(
  animeTitle: string,
  episodeNumber: number,
  titleRomaji?: string,
  animeId?: string
): Promise<VideoSource[]> {
  if (!animeTitle && !titleRomaji && !animeId) return [];
  try {
    const params = new URLSearchParams({
      title: animeTitle || '',
      romaji: titleRomaji || '',
      ep: String(episodeNumber),
      animeId: animeId || '',
    });
    const res = await fetch(`/api/stream/resolve?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.sources) && data.sources.length > 0) {
        return sanitizeSources(data.sources);
      }
    }
  } catch {
    // offline fallback
  }
  return [];
}

/**
 * Cari grup episode yang cocok dari scraped_episodes.json via API.
 * Urutan prioritas: exact animeId → exact slug → fuzzy title match.
 */
async function findScrapedEpisodes(
  animeId: string,
  animeSlug: string,
  animeTitles: string[]
): Promise<{ episodes: any[]; hasReal: boolean } | null> {
  try {
    // 1. Try direct animeId and slug match first (fastest)
    const candidateIds = [...new Set([animeId, animeSlug].filter(Boolean))];
    for (const id of candidateIds) {
      const r = await fetch(`/api/scraped/episodes?animeId=${encodeURIComponent(id)}`);
      if (r.ok) {
        const eps = await r.json();
        if (Array.isArray(eps) && eps.length > 0) {
          const hasReal = eps.some((e: any) => e.sources?.some((s: any) => !isDummyStream(s.url)));
          if (hasReal) return { episodes: eps, hasReal: true };
        }
      }
    }

    // 2. Fetch all scraped animes and find matching candidates sorted by score
    const animesRes = await fetch('/api/scraped/animes');
    if (!animesRes.ok) return null;
    const scrapedAnimes: any[] = await animesRes.json();

    const candidates: Array<{ id: string; score: number }> = [];

    for (const sa of scrapedAnimes) {
      const candidateTitles = [sa.id, sa.slug, sa.title, sa.titleRomaji, sa.titleEnglish].filter(Boolean);
      let maxScore = 0;
      for (const qTitle of animeTitles) {
        for (const cTitle of candidateTitles) {
          const score = slugScore(qTitle, cTitle);
          if (score > maxScore) {
            maxScore = score;
          }
        }
      }
      if (maxScore >= 0.55) {
        candidates.push({ id: sa.id, score: maxScore });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    for (const cand of candidates.slice(0, 5)) {
      const r = await fetch(`/api/scraped/episodes?animeId=${encodeURIComponent(cand.id)}`);
      if (r.ok) {
        const eps = await r.json();
        if (Array.isArray(eps) && eps.length > 0) {
          const hasReal = eps.some((e: any) => e.sources?.some((s: any) => !isDummyStream(s.url)));
          if (hasReal) return { episodes: eps, hasReal: true };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Daftar episode anime berdasarkan ID / slug.
 * Priority: scraped_episodes.json (real 1080p/720p) → AniList episode list → fallback stub
 */
export async function getEpisodes(animeId: string): Promise<Episode[]> {
  if (!animeId) return [];

  const anime = await getAnimeById(animeId);
  const targetId = anime ? anime.id : animeId;
  const targetSlug = anime ? (anime.slug || animeId) : animeId;

  // Collect all possible title variants for fuzzy matching (exclude pure numeric IDs)
  const animeTitles = [
    anime?.title,
    anime?.titleRomaji,
    anime?.titleEnglish,
    anime?.titleJapanese,
    targetSlug,
  ].filter((t) => t && !/^\d+$/.test(t.trim())) as string[];

  // ── Priority 1: Real scraped episodes from database ──────────────────────
  const scraped = await findScrapedEpisodes(targetId, targetSlug, animeTitles);
  if (scraped && scraped.hasReal) {
    return scraped.episodes
      .sort((a, b) => a.number - b.number)
      .map((ep) => {
        // Find if AniList has a streaming episode with specific screenshot and title
        const streamingEp = anime?.streamingEpisodes?.find((se) => {
          const m = se.title.match(/Episode\s+(\d+)/i);
          return m && parseInt(m[1], 10) === ep.number;
        }) || anime?.streamingEpisodes?.[ep.number - 1];

        const isPosterFallback = !ep.thumbnail || ep.thumbnail === anime?.poster || ep.thumbnail === anime?.banner;
        const finalThumbnail = !isPosterFallback
          ? ep.thumbnail
          : (streamingEp?.thumbnail || ep.thumbnail || anime?.banner || anime?.poster);

        return {
          id: ep.id || `${targetId}-ep-${ep.number}`,
          animeId: targetId,
          number: ep.number,
          title: ep.title || streamingEp?.title || `Episode ${ep.number}`,
          thumbnail: finalThumbnail,
          duration: ep.duration || 1440,
          aired: ep.aired || ep.airedDate || '',
          sources: sanitizeSources(ep.sources || []),
        };
      });
  }

  // ── Priority 2: Fallback — AniList episode list ──────
  // Generate ep stubs with no dummy streams; WatchEpisode will live-resolve streams via resolver
  if (anime) {
    const aniEps = fetchAniListEpisodes(anime);
    if (aniEps.length > 0) {
      return aniEps.map((ep) => ({
        ...ep,
        sources: [], // Empty = will be resolved live in WatchEpisode via resolveEpisodeStream
      }));
    }
    // Only generate stubs if there are released episodes (never blindly fill 12 if ongoing)
    const totalEps = anime.status === 'upcoming'
      ? 0
      : (anime.status === 'ongoing' ? 1 : (anime.episodes > 0 ? anime.episodes : 1));

    if (totalEps <= 0) return [];

    return Array.from({ length: Math.min(totalEps, 2000) }, (_, i) => {
      const epNum = i + 1;
      return {
        id: `${targetId}-ep-${epNum}`,
        animeId: targetId,
        number: epNum,
        title: `Episode ${epNum}`,
        thumbnail: anime.banner || anime.poster || '',
        duration: 1440,
        aired: '',
        sources: [], // Resolved live
      };
    });
  }

  return [];
}

/**
 * Pencarian anime.
 */
export async function searchAnime(query: string): Promise<Anime[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  const results: Anime[] = [];
  const seenIds = new Set<string>();

  // 1. Live AniList search
  try {
    const res = await fetchAniListList({ search: cleanQ, pageSize: 24 });
    for (const a of res.data) {
      if (!seenIds.has(a.id) && !seenIds.has(a.slug)) {
        seenIds.add(a.id);
        seenIds.add(a.slug);
        results.push(a);
      }
    }
  } catch (err) {
    console.warn('[animeService] Search error, falling back to mock:', err);
    try {
      const mockList = await getMockAnimes();
      const q = cleanQ.toLowerCase();
      for (const a of mockList) {
        if (
          (a.title.toLowerCase().includes(q) ||
          (a.titleEnglish?.toLowerCase().includes(q) ?? false) ||
          a.studio.toLowerCase().includes(q)) &&
          !seenIds.has(a.id) && !seenIds.has(a.slug)
        ) {
          seenIds.add(a.id);
          seenIds.add(a.slug);
          results.push(a);
        }
      }
    } catch {}
  }

  // 2. Scraped animes database search
  try {
    const r = await fetch(`/api/scraped/animes?title=${encodeURIComponent(cleanQ)}`);
    if (r.ok) {
      const scrapedList = await r.json();
      if (Array.isArray(scrapedList)) {
        for (const sa of scrapedList) {
          if (!seenIds.has(sa.id) && !seenIds.has(sa.slug)) {
            seenIds.add(sa.id);
            seenIds.add(sa.slug);
            results.push(sa);
          }
        }
      }
    }
  } catch {
    // offline
  }

  return results;
}
