import { useState, useEffect, useCallback } from 'react';
import type { Anime, AnimeFilterParams, AnimeListResponse } from '@/types/anime';
import { getAnimeList } from '@/services/animeService';

interface UseAnimeListReturn {
  animes: Anime[];
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  loadMore: () => void;
  refetch: () => void;
}

/**
 * Hook for paginated anime list with optional filtering.
 * Supports infinite scroll via loadMore().
 */
export function useAnimeList(filters: Omit<AnimeFilterParams, 'page'> = {}): UseAnimeListReturn {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serialize filters for dependency comparison
  const filtersKey = JSON.stringify(filters);

  const fetchPage = useCallback(
    async (pageNum: number, reset: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const params: AnimeFilterParams = { ...filters, page: pageNum, pageSize: 12 };
        const res: AnimeListResponse = await getAnimeList(params);

        setAnimes((prev) => (reset ? res.data : [...prev, ...res.data]));
        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat anime.');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey]
  );

  // Reset and refetch when filters change
  useEffect(() => {
    void fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      void fetchPage(page + 1, false);
    }
  }, [isLoading, hasMore, page, fetchPage]);

  const refetch = useCallback(() => {
    void fetchPage(1, true);
  }, [fetchPage]);

  return { animes, total, page, hasMore, isLoading, error, loadMore, refetch };
}
