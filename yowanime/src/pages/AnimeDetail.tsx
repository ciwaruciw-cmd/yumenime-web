import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnimeDetail } from '@/hooks/useAnimeDetail';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { EpisodeList } from '@/components/anime/EpisodeList';
import { CharacterSection } from '@/components/anime/CharacterSection';
import { AnimeSection } from '@/components/anime/AnimeSection';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { formatScore, formatDate, formatMinutes } from '@/utils/formatDate';

/**
 * Anime Detail page — poster, metadata, synopsis, episode list, recommendations.
 */
export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const { anime, episodes, isLoading, error } = useAnimeDetail(id ?? '');
  const { toggle, isInWatchlist } = useWatchlistStore();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const inWatchlist = anime ? isInWatchlist(anime.id) : false;

  // Recommendations: not available without full dataset — AnimeSection handles empty gracefully
  const recommended: import('@/types/anime').Anime[] = [];

  if (isLoading) {
    return (
      <div className="page-enter pt-14">
        <div className="relative h-72 md:h-96">
          <Skeleton variant="hero" className="h-full" />
        </div>
        <div className="max-w-[1280px] mx-auto px-6 py-8 grid md:grid-cols-[250px_1fr] gap-8">
          <Skeleton variant="card" className="aspect-[2/3]" />
          <div className="space-y-4">
            <Skeleton variant="text" className="h-8 w-2/3" />
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-20 w-full" count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="page-enter pt-14 flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-body text-sm font-display mb-4">{error ?? 'Anime not found.'}</p>
        <Link to="/anime">
          <Button variant="outline">← Back to List</Button>
        </Link>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    ongoing: 'Ongoing',
    completed: 'Completed',
    upcoming: 'Upcoming',
  };

  return (
    <div className="page-enter pt-14">
      {/* Hero Banner Section — Pure dark backdrop */}
      <div className="relative min-h-[480px] md:min-h-[540px] flex items-center py-10 md:py-16 overflow-hidden bg-[#0a0a0a]">
        {/* Banner image background with heavy darkening */}
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <img
            src={anime.banner ?? anime.poster}
            alt=""
            className="w-full h-full object-cover object-center opacity-60"
            aria-hidden="true"
            referrerPolicy="no-referrer"
          />
          {/* Only darken left side for text readability, right side stays visible */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1280px] mx-auto w-full px-6">
          <div className="grid md:grid-cols-[240px_1fr] lg:grid-cols-[270px_1fr] gap-6 md:gap-10 items-start">
            {/* Poster Card */}
            <div className="flex justify-center md:block shrink-0">
              {!imgError ? (
                <img
                  src={anime.poster}
                  alt={anime.title}
                  className="w-48 sm:w-56 md:w-full rounded-[12px] border border-white/10 shadow-2xl object-cover aspect-[2/3]"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-48 sm:w-56 md:w-full aspect-[2/3] rounded-[12px] border border-white/10 shadow-2xl bg-canvas-soft flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-sunset/20 flex items-center justify-center mb-2 text-sunset font-bold text-lg">
                    🎬
                  </div>
                  <p className="text-xs font-display text-ink font-medium leading-tight line-clamp-3">{anime.title}</p>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="space-y-4 pt-1">
              {/* Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl text-ink font-medium tracking-tight mb-1">
                  {anime.title}
                </h1>
                {anime.titleJapanese && (
                  <p className="text-xs sm:text-sm text-mute font-display">{anime.titleJapanese}</p>
                )}
              </div>

              {/* 18+ Adult Disclaimer Banner */}
              {(anime.genres.includes('Hentai') || anime.rating === '18+' || anime.rating === 'Rx') && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-[8px] p-3 flex items-center gap-3 max-w-xl">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xs shrink-0">
                    18+
                  </div>
                  <div>
                    <p className="text-xs font-display text-red-400 font-semibold">Adult Content Warning (18+)</p>
                    <p className="text-[11px] text-mute font-display">This anime contains explicit themes intended for mature audiences (18+ / Hentai).</p>
                  </div>
                </div>
              )}

              {/* Score & Badges Row */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff7a17" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="text-sm text-ink font-mono font-medium">{formatScore(anime.score)}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {statusLabels[anime.status]}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-mute border border-white/20 uppercase">
                  {anime.type}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-mute border border-white/20 uppercase">
                  {anime.rating}
                </span>
              </div>

              {/* Metadata Grid (3 columns) */}
              <div className="grid grid-cols-3 gap-y-4 gap-x-6 max-w-xl pt-2">
                {[
                  { label: 'STUDIO', value: anime.studio },
                  { label: 'SEASON / YEAR', value: `${anime.season} ${anime.year}` },
                  { label: 'EPISODES', value: anime.episodes > 0 ? `${anime.episodes} ep` : 'Ongoing' },
                  { label: 'DURATION', value: formatMinutes(anime.duration) },
                  { label: 'LAST UPDATED', value: formatDate(anime.updatedAt) },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="eyebrow-mono text-mute text-[10px] tracking-wider mb-1">{item.label}</p>
                    <p className="text-xs sm:text-sm text-ink font-display font-medium">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Genre Pills */}
              <div className="flex gap-2 flex-wrap pt-2">
                {anime.genres.map((g) => (
                  <Link key={g} to={`/anime?genre=${encodeURIComponent(g)}`}>
                    <span className="inline-block bg-[#1a1c24] border border-[#2e3344] text-[#a0c3ec] text-[11px] font-mono uppercase px-3 py-1 rounded-full hover:bg-[#252834] transition-colors">
                      {g}
                    </span>
                  </Link>
                ))}
              </div>

              {/* CTA Buttons Row — Solid white play button & translucent watchlist button */}
              <div className="flex gap-3 pt-3 flex-wrap items-center">
                <Link to={`/anime/${anime.slug}/episode/1`}>
                  <button className="bg-white text-black hover:bg-white/90 font-medium text-xs sm:text-sm rounded-full px-6 py-2.5 inline-flex items-center gap-2 shadow-lg transition-colors cursor-pointer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Watch Episode 1</span>
                  </button>
                </Link>
                <button
                  onClick={() => toggle(anime)}
                  className="bg-canvas-card border border-white/20 text-white hover:bg-white/10 font-medium text-xs sm:text-sm rounded-full px-6 py-2.5 inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {inWatchlist ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span>{inWatchlist ? 'Saved' : 'Watchlist'}</span>
                </button>
              </div>

              {/* Synopsis */}
              <div className="max-w-3xl pt-2">
                <p className="eyebrow-mono text-mute text-[10px] tracking-wider mb-1">SYNOPSIS</p>
                <p
                  className={`text-body text-xs sm:text-sm font-display leading-relaxed ${
                    !synopsisExpanded ? 'line-clamp-3' : ''
                  }`}
                >
                  {anime.synopsis}
                </p>
                {anime.synopsis.length > 200 && (
                  <button
                    onClick={() => setSynopsisExpanded((v) => !v)}
                    className="text-sunset text-xs font-display mt-1 hover:underline cursor-pointer"
                  >
                    {synopsisExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Below Hero Banner */}
      <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-12">
        {/* Episode List */}
        <div>
          <span className="eyebrow-mono text-mute block mb-1">EPISODES</span>
          <h2 className="display-sm text-ink mb-4">
            Episode List
            {episodes.length > 0 && (
              <span className="text-body-mid text-base ml-2 font-normal">({episodes.length})</span>
            )}
          </h2>
          <EpisodeList episodes={episodes} animeSlug={anime.slug} />
        </div>

        {/* Character & Voice Actor List */}
        {anime.characters && anime.characters.length > 0 && (
          <CharacterSection characters={anime.characters} animeTitle={anime.title} />
        )}

        {/* Recommendations */}
        {recommended.length > 0 && (
          <AnimeSection
            eyebrow="RECOMMENDED"
            title="Similar Anime"
            animes={recommended}
            viewAllHref={`/anime?genre=${encodeURIComponent(anime.genres[0])}`}
            className="!px-0"
          />
        )}
      </div>
    </div>
  );
}
