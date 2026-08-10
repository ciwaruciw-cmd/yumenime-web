import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAnimeDetail } from '@/hooks/useAnimeDetail';
import { VideoPlayer } from '@/components/anime/VideoPlayer';
import { CharacterSection } from '@/components/anime/CharacterSection';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';

/**
 * Watch Episode page — video player + episode sidebar.
 * Supports next/prev navigation and auto-play.
 */
export default function WatchEpisode() {
  const { id, ep } = useParams<{ id: string; ep: string }>();
  const navigate = useNavigate();
  const { anime, episodes, isLoading, error } = useAnimeDetail(id ?? '');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const epNumber = Number(ep) || 1;

  // Find current episode data
  const currentEpisode = useMemo(
    () => episodes.find((e) => e.number === epNumber) ?? episodes[0],
    [episodes, epNumber]
  );

  const hasNext = epNumber < episodes.length;
  const hasPrev = epNumber > 1;

  const goToEpisode = useCallback(
    (num: number) => {
      if (anime) navigate(`/anime/${anime.slug}/episode/${num}`);
    },
    [anime, navigate]
  );

  const onNext = useCallback(() => {
    if (hasNext) goToEpisode(epNumber + 1);
  }, [hasNext, epNumber, goToEpisode]);

  const onPrev = useCallback(() => {
    if (hasPrev) goToEpisode(epNumber - 1);
  }, [hasPrev, epNumber, goToEpisode]);

  if (isLoading) {
    return (
      <div className="page-enter pt-14">
        <div className="max-w-[1280px] mx-auto px-6 py-6">
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            <Skeleton variant="hero" className="aspect-video rounded-[8px]" />
            <div className="space-y-2">
              <Skeleton variant="text" className="h-6 w-32" />
              <Skeleton variant="episode" count={8} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !anime || !currentEpisode) {
    return (
      <div className="page-enter pt-14 flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <p className="text-body text-sm font-display mb-4">{error ?? 'Episode tidak ditemukan.'}</p>
        <Link to="/anime">
          <Button variant="outline">← Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter pt-14 bg-canvas min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid lg:grid-cols-[300px_1fr] gap-4 md:gap-6">
          {/* Episode sidebar (LEFT SIDE on desktop) */}
          <div className="order-2 lg:order-1">
            <Sidebar
              episodes={episodes}
              currentEpisodeNumber={epNumber}
              animeSlug={anime.slug}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* Main Video area (RIGHT SIDE on desktop) */}
          <div className="order-1 lg:order-2 space-y-4">
            {/* Video player */}
            <VideoPlayer
              sources={currentEpisode.sources}
              title={currentEpisode.title || `Episode ${currentEpisode.number}`}
              episodeNumber={currentEpisode.number}
              trailerUrl={anime?.trailer}
              onNext={onNext}
              onPrev={onPrev}
              hasNext={hasNext}
              hasPrev={hasPrev}
            />

            {/* Episode info bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <Link to={`/anime/${anime.slug}`} className="text-mute text-xs font-display hover:text-body transition-colors">
                  {anime.title}
                </Link>
                <h1 className="text-base md:text-lg font-display text-ink">
                  <span className="text-sunset font-mono text-sm mr-2">EP {epNumber}</span>
                  {currentEpisode.title || `Episode ${epNumber}`}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{anime.type}</Badge>
                {anime.status === 'ongoing' && <Badge variant="success">Ongoing</Badge>}

                {/* Mobile sidebar toggle */}
                <Button
                  variant="outline-sm"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
                    </svg>
                  }
                >
                  Daftar EP
                </Button>
              </div>
            </div>

            {/* Prev / Next buttons */}
            <div className="flex gap-3">
              {hasPrev && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={onPrev}
                  icon={
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                >
                  Episode {epNumber - 1}
                </Button>
              )}
              {hasNext && (
                <Button
                  variant="outline"
                  size="md"
                  onClick={onNext}
                  icon={
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                  iconPosition="right"
                >
                  Episode {epNumber + 1}
                </Button>
              )}
            </div>

            {/* Anime Characters Section */}
            {anime.characters && anime.characters.length > 0 && (
              <div className="pt-6 border-t border-hairline">
                <CharacterSection characters={anime.characters} animeTitle={anime.title} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
