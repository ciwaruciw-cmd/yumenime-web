import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { GenreFilter } from '@/components/anime/GenreFilter';
import { Button } from '@/components/ui/Button';
import { useAnimeList } from '@/hooks/useAnimeList';
import type { AnimeFilterParams, AnimeStatus } from '@/types/anime';

const STATUS_OPTIONS: { label: string; value: AnimeStatus | '' }[] = [
  { label: 'Semua', value: '' },
  { label: 'Ongoing', value: 'ongoing' },
  { label: 'Selesai', value: 'completed' },
  { label: 'Segera', value: 'upcoming' },
];

const YEAR_OPTIONS = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

const SORT_OPTIONS: { label: string; value: AnimeFilterParams['sort'] }[] = [
  { label: 'Terbaru', value: 'latest' },
  { label: 'Populer', value: 'popular' },
  { label: 'Rating', value: 'score' },
  { label: 'Judul', value: 'title' },
];

/**
 * Anime List page — grid with genre, status, year filter + sort.
 * Supports infinite scroll via useAnimeList hook.
 */
export default function AnimeList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const genre = searchParams.get('genre') ?? undefined;
  const status = (searchParams.get('status') ?? undefined) as AnimeStatus | undefined;
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
  const sort = (searchParams.get('sort') ?? 'latest') as AnimeFilterParams['sort'];

  const filters = useMemo(
    () => ({
      genre: genre as AnimeFilterParams['genre'],
      status,
      year,
      sort,
    }),
    [genre, status, year, sort]
  );

  const { animes, isLoading, hasMore, loadMore } = useAnimeList(filters);

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    setSearchParams(params);
  };

  return (
    <div className="page-enter pt-20">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Page header */}
        <div className="mb-6">
          <span className="eyebrow-mono text-mute block mb-1">BROWSE</span>
          <h1 className="display-md text-ink">Daftar Anime</h1>
        </div>

        {/* Genre filter */}
        <div className="mb-4">
          <GenreFilter useUrlParams />
        </div>

        {/* Status + Year + Sort filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Status pills */}
          <div className="flex gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={status === opt.value || (!status && !opt.value) ? 'primary' : 'outline-sm'}
                size="sm"
                onClick={() => updateParam('status', opt.value || undefined)}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          {/* Year dropdown */}
          <select
            value={year ?? ''}
            onChange={(e) => updateParam('year', e.target.value || undefined)}
            className="bg-canvas-soft text-body text-xs font-mono border border-hairline rounded-full px-3 py-1.5 outline-none focus:border-white/30 cursor-pointer"
            aria-label="Filter tahun"
          >
            <option value="">Semua Tahun</option>
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-mute font-mono">URUTKAN:</span>
            {SORT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={sort === opt.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => updateParam('sort', opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Anime grid with infinite scroll */}
        <AnimeGrid
          animes={animes}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          emptyMessage="Tidak ada anime yang cocok dengan filter."
        />
      </div>
    </div>
  );
}
