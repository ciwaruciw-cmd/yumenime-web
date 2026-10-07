import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnimeDetail } from '@/hooks/useAnimeDetail';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useRecommendations } from '@/hooks/useRecommendations';
import { EpisodeList } from '@/components/anime/EpisodeList';
import { CharacterSection } from '@/components/anime/CharacterSection';
import { ShareButton } from '@/components/common/ShareButton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { formatScore, formatDate, formatMinutes } from '@/utils/formatDate';
import { DownloadModal } from '@/components/anime/DownloadModal';
import type { Episode } from '@/types/episode';

/**
 * Anime Detail page — poster, metadata, synopsis, episode list, characters, recommendations.
 */
export default function AnimeDetail() {
  const { id } = useParams<{ id: string }>();
  const { anime, episodes, isLoading, error } = useAnimeDetail(id ?? '');
  const { toggle, isInWatchlist } = useWatchlistStore();
  const { getLastWatched } = useHistoryStore();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadEpisode, setDownloadEpisode] = useState<Episode | undefined>(undefined);
  const [downloadTab, setDownloadTab] = useState<'single' | 'batch'>('single');

  const inWatchlist = anime ? isInWatchlist(anime.id) : false;
  const lastWatched = anime ? getLastWatched(anime.id) : undefined;

  const { recommendations, isLoading: recsLoading } = useRecommendations(
    anime?.id ?? '',
    anime?.genres ?? [],
    8
  );

  if (isLoading) {
    return (
      <div className="page-enter pt-12 sm:pt-14">
        <div className="relative h-72 md:h-96">
          <Skeleton variant="hero" className="h-full" />
        </div>
        <div className="max-w-[1280px] mx-auto px-6 py-8 grid md:grid-cols-[250px_1fr] gap-8">
          <div className="h-[288px] sm:h-[336px] md:hidden" aria-hidden="true" />
          <Skeleton variant="card" className="hidden md:block aspect-[2/3]" />
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
      <div className="page-enter pt-12 sm:pt-14 flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
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
    <div className="page-enter pt-12 sm:pt-14">
      {/* ── Hero Banner Section ─────────────────────── */}
      <div className="relative min-h-[480px] md:min-h-[540px] flex items-center py-10 md:py-16 overflow-hidden bg-[#0a0a0a]">
        {/* Background */}
        <div className="absolute inset-x-0 top-0 h-[420px] sm:h-[460px] md:inset-0 md:h-full overflow-hidden bg-[#0a0a0a]">
          <img
            src={anime.banner ?? anime.poster}
            alt=""
            className="w-full h-full object-cover object-center opacity-70 md:opacity-50"
            aria-hidden="true"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[#0a0a0a]/25 md:hidden" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0a0a0a]/90 via-[#0a0a0a]/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent md:hidden" />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1280px] mx-auto w-full px-6">
          <div className="grid md:grid-cols-[240px_1fr] lg:grid-cols-[270px_1fr] gap-6 md:gap-10 items-start">
            <div className="h-[288px] sm:h-[336px] md:hidden pointer-events-none" aria-hidden="true" />

            {/* Poster Card (Desktop only) */}
            <div className="hidden md:block shrink-0">
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
                  <div className="w-12 h-12 rounded-full bg-sunset/20 flex items-center justify-center mb-2 text-sunset font-bold text-lg">🎬</div>
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

              {/* 18+ Disclaimer */}
              {(anime.genres.includes('Hentai') || anime.rating === '18+' || anime.rating === 'Rx') && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-[8px] p-3 flex items-center gap-3 max-w-xl">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xs shrink-0">18+</div>
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
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-mute border border-white/20 uppercase">{anime.type}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-mute border border-white/20 uppercase">{anime.rating}</span>
              </div>

              {/* Metadata Grid */}
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

              {/* CTA Buttons + Share */}
              <div className="flex gap-2 pt-3 flex-wrap items-center">
                <Link to={`/anime/${anime.slug || anime.id}/episode/${lastWatched ? lastWatched.episodeNumber : 1}`}>
                  <button className="bg-white text-black hover:bg-white/90 font-medium text-xs sm:text-sm rounded-full px-5 py-2.5 inline-flex items-center gap-2 shadow-lg transition-colors cursor-pointer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>
                      {lastWatched
                        ? lastWatched.completed
                          ? `Rewatch EP ${lastWatched.episodeNumber}`
                          : `Continue EP ${lastWatched.episodeNumber} (${Math.round(lastWatched.progress)}%)`
                        : 'Watch Episode 1'}
                    </span>
                  </button>
                </Link>

                {/* Watchlist toggle button */}
                <button
                  onClick={() => anime && toggle(anime)}
                  className={`font-medium text-xs sm:text-sm rounded-full px-5 py-2.5 inline-flex items-center gap-2 transition-all cursor-pointer border ${
                    inWatchlist
                      ? 'bg-sunset/10 border-sunset/30 text-sunset hover:bg-sunset/20'
                      : 'bg-canvas-card border-white/20 text-white hover:bg-white/10'
                  }`}
                  id="watchlist-btn"
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
                  <span>{inWatchlist ? 'In Watchlist' : 'Add to List'}</span>
                </button>

                {/* Download button */}
                <button
                  onClick={() => {
                    const targetEp = lastWatched ? episodes.find((e) => e.number === lastWatched.episodeNumber) : episodes[0];
                    setDownloadEpisode(targetEp || episodes[0]);
                    setDownloadTab('single');
                    setShowDownloadModal(true);
                  }}
                  className="bg-canvas-card border border-white/20 hover:border-sunset/50 hover:text-sunset text-white font-medium text-xs sm:text-sm rounded-full px-4 sm:px-5 py-2.5 inline-flex items-center gap-2 transition-all cursor-pointer shadow-sm group"
                  title="Unduh Episode Anime"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="group-hover:translate-y-0.5 transition-transform">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download</span>
                </button>

                {/* Share button */}
                <ShareButton title={anime.title} text={`Watch ${anime.title} on YUMENIME`} />
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

      {/* ── Main Content Below Hero ─────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-12">
        {/* Episode List */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <span className="eyebrow-mono text-mute block mb-1">EPISODES</span>
              <h2 className="display-sm text-ink">
                Episode List
                {episodes.length > 0 && (
                  <span className="text-body-mid text-base ml-2 font-normal">({episodes.length})</span>
                )}
              </h2>
            </div>
            {episodes.length > 1 && (
              <button
                onClick={() => {
                  setDownloadTab('batch');
                  setShowDownloadModal(true);
                }}
                className="text-xs font-display text-sunset hover:text-white inline-flex items-center gap-1.5 cursor-pointer font-medium px-3.5 py-1.5 rounded-full bg-sunset/10 border border-sunset/30 hover:bg-sunset/20 transition-all shadow-sm group"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="group-hover:translate-y-0.5 transition-transform">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Batch Download ({episodes.length} EP)</span>
              </button>
            )}
          </div>
          <EpisodeList
            episodes={episodes}
            animeSlug={anime.slug || anime.id}
            animePoster={anime.poster}
            onDownloadEpisode={(ep) => {
              setDownloadEpisode(ep);
              setDownloadTab('single');
              setShowDownloadModal(true);
            }}
          />
        </div>

        {/* Characters */}
        {anime.characters && anime.characters.length > 0 && (
          <CharacterSection characters={anime.characters} animeTitle={anime.title} />
        )}

        {/* ── Recommended / Similar Anime ─────────────────── */}
        {(recommendations.length > 0 || recsLoading) && (
          <div>
            <span className="eyebrow-mono text-mute block mb-1">YOU MIGHT ALSO LIKE</span>
            <h2 className="display-sm text-ink mb-4">Similar Anime</h2>

            {recsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="card" className="aspect-[2/3]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    to={`/anime/${rec.slug || rec.id}`}
                    className="group relative overflow-hidden rounded-[10px] border border-transparent hover:border-white/15 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {/* Poster */}
                    <div className="aspect-[2/3] overflow-hidden bg-canvas-card">
                      <img
                        src={rec.poster}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    {/* Score badge */}
                    <div className="absolute top-1.5 left-1.5 bg-black/85 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/10">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="#ff7a17"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      {rec.score.toFixed(1)}
                    </div>
                    {/* Info */}
                    <div className="pt-2 pb-1 px-0.5">
                      <p className="text-xs font-display font-medium text-ink line-clamp-2 leading-snug group-hover:text-sunset transition-colors">
                        {rec.title}
                      </p>
                      <p className="text-[10px] font-mono text-mute mt-0.5">{rec.year}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>



      {/* Download Modal */}
      {anime && (
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          anime={anime}
          episode={downloadEpisode || episodes[0]}
          allEpisodes={episodes}
          currentSources={downloadEpisode?.sources || episodes[0]?.sources || []}
          defaultTab={downloadTab}
        />
      )}
    </div>
  );
}
