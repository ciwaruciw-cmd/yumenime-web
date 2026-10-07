import { useState, useEffect } from 'react';
import type { Anime } from '@/types/anime';
import type { Episode } from '@/types/episode';
import { getAnimeById, getEpisodes } from '@/services/animeService';

interface UseAnimeDetailReturn {
  anime: Anime | null;
  episodes: Episode[];
  isLoading: boolean;
  error: string | null;
}

const DETAIL_CACHE_TTL = 5 * 60 * 1000; // 5 menit
const DUMMY_DOMAINS = ['commondatastorage', 'vjs.zencdn', 'w3schools', 'mozilla.net', 'oceans.mp4', 'sintel', 'mov_bbb'];

function getDetailCache(key: string): { anime: Anime; episodes: Episode[] } | null {
  try {
    const raw = sessionStorage.getItem(`detail:v10:${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: { anime: Anime; episodes: Episode[] }; ts: number };
    if (Date.now() - ts > DETAIL_CACHE_TTL || !data || !data.anime) {
      sessionStorage.removeItem(`detail:v10:${key}`);
      return null;
    }
    // If episodes exist and have sources, check that they are not purely dummy streams
    if (Array.isArray(data.episodes) && data.episodes.length > 0) {
      const hasAnySources = data.episodes.some((ep) => ep.sources && ep.sources.length > 0);
      const hasRealStream = data.episodes.some((ep) =>
        ep.sources?.some((s) => s.url && !DUMMY_DOMAINS.some((d) => s.url.includes(d)))
      );
      if (hasAnySources && !hasRealStream) {
        sessionStorage.removeItem(`detail:v10:${key}`);
        return null;
      }
    }
    return data;
  } catch {
    return null;
  }
}

function setDetailCache(key: string, data: { anime: Anime; episodes: Episode[] }) {
  try {
    if (!data || !data.anime) return;
    // Don't cache if episodes contain only dummy streams
    if (Array.isArray(data.episodes) && data.episodes.length > 0) {
      const hasAnySources = data.episodes.some((ep) => ep.sources && ep.sources.length > 0);
      const hasRealStream = data.episodes.some((ep) =>
        ep.sources?.some((s) => s.url && !DUMMY_DOMAINS.some((d) => s.url.includes(d)))
      );
      if (hasAnySources && !hasRealStream) return;
    }
    sessionStorage.setItem(`detail:v10:${key}`, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* private mode / full */ }
}

/**
 * Hook for fetching a single anime's detail + episodes.
 * Results are cached in sessionStorage (5 min TTL) for instant back-navigation.
 */
export function useAnimeDetail(idOrSlug: string): UseAnimeDetailReturn {
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;

    // Cek cache dulu — jika hit, tampilkan langsung tanpa loading state
    const cached = getDetailCache(idOrSlug);
    if (cached) {
      setAnime(cached.anime);
      setEpisodes(cached.episodes);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([getAnimeById(idOrSlug), getEpisodes(idOrSlug)])
      .then(([animeData, episodeData]) => {
        if (!animeData) {
          setError('Anime tidak ditemukan.');
        } else {
          setAnime(animeData);
          setEpisodes(episodeData);
          setDetailCache(idOrSlug, { anime: animeData, episodes: episodeData });
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Gagal memuat detail anime.');
      })
      .finally(() => setIsLoading(false));
  }, [idOrSlug]);

  return { anime, episodes, isLoading, error };
}
