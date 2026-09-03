import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAnimeDetail } from '@/hooks/useAnimeDetail';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useAnimeList } from '@/hooks/useAnimeList';
import { VideoPlayer } from '@/components/anime/VideoPlayer';
import { CommentSection } from '@/components/anime/CommentSection';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { formatScore, formatDuration } from '@/utils/formatDate';

/**
 * Watch Episode Page — Modern Cinema Layout.
 * Wide responsive player with ambient glow, sticky episode explorer sidebar,
 * theater mode toggle, and rich episode list/grid modes.
 */
export default function WatchEpisode() {
  const { id, ep } = useParams<{ id: string; ep: string }>();
  const navigate = useNavigate();
  const { anime, episodes, isLoading, error } = useAnimeDetail(id ?? '');
  const { toggle, isInWatchlist } = useWatchlistStore();
  const { animes: trendingList } = useAnimeList({ sort: 'popular' });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [theaterMode, setTheaterMode] = useState(false);
  const [epSearch, setEpSearch] = useState('');
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const activeEpRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  const epNumber = Number(ep) || 1;

  const currentEpisode = useMemo(
    () => episodes.find((e) => e.number === epNumber) ?? episodes[0],
    [episodes, epNumber]
  );

  const inWatchlist = anime ? isInWatchlist(anime.id) : false;
  const hasNext = epNumber < episodes.length;
  const hasPrev = epNumber > 1;

  const goToEpisode = useCallback(
    (num: number) => {
      if (anime) navigate(`/anime/${anime.slug || anime.id}/episode/${num}`);
    },
    [anime, navigate]
  );

  const onNext = useCallback(() => {
    if (hasNext) goToEpisode(epNumber + 1);
  }, [hasNext, epNumber, goToEpisode]);

  const onPrev = useCallback(() => {
    if (hasPrev) goToEpisode(epNumber - 1);
  }, [hasPrev, epNumber, goToEpisode]);

  // Keyboard shortcut navigation (N = Next, P = Prev, T = Theater)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in comment input or search
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'n' || e.key === 'N') onNext();
      if (e.key === 'p' || e.key === 'P') onPrev();
      if (e.key === 't' || e.key === 'T') setTheaterMode((prev) => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev]);

  // Auto-scroll active episode in list/grid into view
  useEffect(() => {
    if (activeEpRef.current) {
      activeEpRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [epNumber, viewMode]);

  // Filter episodes by number or title search
  const filteredEpisodes = useMemo(() => {
    if (!epSearch.trim()) return episodes;
    const q = epSearch.toLowerCase().trim();
    return episodes.filter(
      (e) =>
        String(e.number).includes(q) ||
        (e.title && e.title.toLowerCase().includes(q))
    );
  }, [episodes, epSearch]);

  // Filter out current anime from recommendations
  const recommendations = useMemo(() => {
    if (!anime) return [];
    return trendingList.filter((a) => a.id !== anime.id && a.slug !== anime.slug).slice(0, 6);
  }, [trendingList, anime]);

  if (isLoading) {
    return (
      <div className="page-enter pt-16 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <Skeleton variant="hero" className="w-full aspect-video rounded-[12px]" />
            <Skeleton variant="text" className="h-6 w-3/4" />
            <Skeleton variant="text" className="h-4 w-1/3" />
          </div>
          <div className="lg:col-span-4 xl:col-span-3 space-y-4">
            <Skeleton variant="card" className="h-80 rounded-[12px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !anime || !currentEpisode) {
    return (
      <div className="page-enter pt-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-4 text-sunset">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-display font-semibold text-ink mb-2">Episode Tidak Ditemukan</h2>
        <p className="text-body text-sm font-display mb-6 max-w-md">{error ?? 'Gagal memuat episode anime.'}</p>
        <Link
          to="/anime"
          className="bg-white text-black font-display font-medium text-sm px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
        >
          ← Kembali ke Katalog Anime
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter pt-16 bg-canvas min-h-screen text-ink">
      {/* ── Main Container (Wide 1680px Canvas) ─────────────────────── */}
      <div className="max-w-[1680px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* ── Breadcrumb Navigation ──────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs font-display text-mute mb-4 overflow-x-auto whitespace-nowrap pb-1">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to="/anime" className="hover:text-white transition-colors">Anime</Link>
          <span>/</span>
          <Link to={`/anime/${anime.slug || anime.id}`} className="hover:text-white transition-colors truncate max-w-[200px] sm:max-w-[300px]">
            {anime.title}
          </Link>
          <span>/</span>
          <span className="text-sunset font-medium">Episode {epNumber}</span>
        </div>

        {/* ── Theater Mode or Standard Grid ──────────────────────── */}
        <div className={clsx(
          'grid gap-6 lg:gap-8 transition-all duration-300',
          theaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
        )}>

          {/* ════ LEFT / MAIN PLAYER COLUMN ════════════════════════ */}
          <div className={clsx(
            'space-y-6',
            theaterMode ? 'col-span-1' : 'lg:col-span-8 xl:col-span-9'
          )}>

            {/* ── Video Player ─────────────────── */}
            <div className="relative group/player rounded-[12px] overflow-hidden bg-black border border-white/10 shadow-2xl">
              {/* Subtle ambient backdrop glow (lightweight, zero GPU lag) */}
              <div
                className="hidden sm:block absolute -inset-2 opacity-15 pointer-events-none -z-10 bg-gradient-to-t from-sunset/20 to-transparent"
              />

              <VideoPlayer
                sources={currentEpisode.sources}
                title={currentEpisode.title || `Episode ${currentEpisode.number}`}
                episodeNumber={currentEpisode.number}
                animeId={anime.id}
                malId={anime.malId}
                trailerUrl={anime.trailer}
                onNext={onNext}
                onPrev={onPrev}
                hasNext={hasNext}
                hasPrev={hasPrev}
              />
            </div>

            {/* ── Quick Controls & Title Bar ──────────────────────── */}
            <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Anime and Episode Title Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono font-bold bg-sunset/15 text-sunset px-2.5 py-0.5 rounded-full border border-sunset/30">
                      EPISODE {epNumber}
                    </span>
                    {anime.score && (
                      <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-400/20">
                        ★ {formatScore(anime.score)}
                      </span>
                    )}
                    <span className="text-xs font-mono text-mute">{anime.type}</span>
                    <span className="text-xs font-mono text-mute">·</span>
                    <span className="text-xs font-mono text-mute">{anime.year}</span>
                    <span className="text-xs font-mono text-mute">·</span>
                    <span className="text-xs font-mono text-mute">{anime.studio}</span>
                  </div>

                  <h1 className="text-lg sm:text-xl font-display font-bold text-white leading-tight">
                    {anime.title}
                  </h1>

                  {currentEpisode.title && currentEpisode.title !== `Episode ${epNumber}` && (
                    <p className="text-xs sm:text-sm font-display text-body-mid mt-1 line-clamp-1">
                      {currentEpisode.title}
                    </p>
                  )}
                </div>

                {/* Navigation & Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Prev Episode */}
                  <button
                    onClick={onPrev}
                    disabled={!hasPrev}
                    title="Episode Sebelumnya (Shortcut: P)"
                    className="flex items-center gap-1.5 text-xs font-display font-medium text-body bg-canvas-soft border border-hairline hover:border-white/40 hover:text-white px-3.5 py-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Prev
                  </button>

                  {/* Next Episode */}
                  <button
                    onClick={onNext}
                    disabled={!hasNext}
                    title="Episode Selanjutnya (Shortcut: N)"
                    className="flex items-center gap-1.5 text-xs font-display font-medium text-white bg-sunset hover:bg-sunset/90 px-4 py-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
                  >
                    Next
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Theater Mode Toggle (Desktop only) */}
                  <button
                    onClick={() => setTheaterMode((v) => !v)}
                    title={theaterMode ? 'Kembali ke Mode Normal (Shortcut: T)' : 'Mode Bioskop Lebar (Shortcut: T)'}
                    className={clsx(
                      'hidden lg:flex items-center gap-1.5 text-xs font-display px-3 py-2 rounded-full border transition-all cursor-pointer',
                      theaterMode
                        ? 'bg-white/10 border-white text-white font-medium'
                        : 'bg-canvas-soft border-hairline text-mute hover:text-white hover:border-white/30'
                    )}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                    <span>{theaterMode ? 'Exit Theater' : 'Theater'}</span>
                  </button>

                  {/* Watchlist Toggle */}
                  <button
                    onClick={() => toggle(anime)}
                    title={inWatchlist ? 'Hapus dari Watchlist' : 'Tambah ke Watchlist'}
                    className={clsx(
                      'p-2 rounded-full border transition-all cursor-pointer',
                      inWatchlist
                        ? 'bg-sunset/20 border-sunset text-sunset'
                        : 'bg-canvas-soft border-hairline text-mute hover:text-white hover:border-white/30'
                    )}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={inWatchlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>

                  {/* Anime Detail Page Link */}
                  <Link
                    to={`/anime/${anime.slug || anime.id}`}
                    className="p-2 rounded-full bg-canvas-soft border border-hairline text-mute hover:text-white hover:border-white/30 transition-all"
                    title="Buka Halaman Detail Anime"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Genres + Synopsis Snippet */}
              <div className="pt-3 border-t border-hairline/60">
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {anime.genres.map((genre) => (
                    <Badge key={genre} variant="default" size="sm">
                      {genre}
                    </Badge>
                  ))}
                </div>

                {anime.synopsis && (
                  <div>
                    <p className={clsx(
                      'text-xs text-body font-display leading-relaxed transition-all',
                      !synopsisExpanded && 'line-clamp-2'
                    )}>
                      {anime.synopsis}
                    </p>
                    {anime.synopsis.length > 150 && (
                      <button
                        onClick={() => setSynopsisExpanded((v) => !v)}
                        className="text-[11px] font-display text-sunset hover:underline mt-1 cursor-pointer font-medium"
                      >
                        {synopsisExpanded ? 'Sembunyikan ↑' : 'Baca selengkapnya...'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Theater Mode: Episode Selector Below Video (if theater mode active) ── */}
            {theaterMode && (
              <div className="bg-canvas-card border border-hairline rounded-[12px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-display font-semibold text-white">Daftar Episode</h2>
                    <span className="text-xs font-mono bg-canvas-soft px-2 py-0.5 rounded-full text-mute border border-hairline">
                      {episodes.length} EP
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={clsx('p-1.5 rounded text-xs font-mono', viewMode === 'grid' ? 'bg-white text-black font-bold' : 'text-mute hover:text-white')}
                    >
                      GRID
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={clsx('p-1.5 rounded text-xs font-mono', viewMode === 'list' ? 'bg-white text-black font-bold' : 'text-mute hover:text-white')}
                    >
                      LIST
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
                  {episodes.map((item) => {
                    const isActive = item.number === epNumber;
                    return (
                      <button
                        key={item.id}
                        onClick={() => goToEpisode(item.number)}
                        className={clsx(
                          'w-11 h-11 rounded-[10px] text-xs font-display font-semibold transition-all cursor-pointer border flex items-center justify-center',
                          isActive
                            ? 'bg-sunset text-white border-sunset shadow-lg shadow-sunset/30 scale-105'
                            : 'bg-canvas-soft border-hairline text-body hover:border-white/40 hover:text-white hover:bg-canvas-card'
                        )}
                      >
                        {item.number}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Comments / Discussion Section ────────────────────── */}
            <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6 shadow-sm">
              <CommentSection
                animeId={anime.id}
                episodeId={currentEpisode.id}
              />
            </div>

          </div>

          {/* ════ RIGHT SIDEBAR (EPISODE EXPLORER & RECOMMENDATIONS) ═══ */}
          {!theaterMode && (
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">

              {/* ── Sticky Episode Explorer Card ─────────────────────── */}
              <div className="sticky top-20 bg-canvas-card border border-hairline rounded-[12px] overflow-hidden shadow-lg">
                
                {/* Explorer Header */}
                <div className="p-4 border-b border-hairline bg-canvas-soft/80 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-display font-bold text-white flex items-center gap-2">
                      <span>Daftar Episode</span>
                      <span className="text-[11px] font-mono font-normal bg-sunset/20 text-sunset px-2 py-0.5 rounded-full border border-sunset/30">
                        {episodes.length} Total
                      </span>
                    </h2>
                    <p className="text-[11px] font-mono text-mute mt-0.5">
                      Sedang memutar: <span className="text-white font-medium">EP {epNumber}</span>
                    </p>
                  </div>

                  {/* View Mode Toggle (Grid vs List) */}
                  <div className="flex items-center bg-canvas rounded-[8px] p-1 border border-hairline">
                    <button
                      onClick={() => setViewMode('grid')}
                      title="Grid Tampilan Angka"
                      className={clsx(
                        'p-1.5 rounded-[6px] transition-colors cursor-pointer',
                        viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-mute hover:text-white'
                      )}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      title="List Tampilan Detail"
                      className={clsx(
                        'p-1.5 rounded-[6px] transition-colors cursor-pointer',
                        viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-mute hover:text-white'
                      )}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Quick Search Episode Filter (shows if > 8 episodes) */}
                {episodes.length > 8 && (
                  <div className="p-3 border-b border-hairline/60 bg-canvas/60">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari nomor atau judul episode..."
                        value={epSearch}
                        onChange={(e) => setEpSearch(e.target.value)}
                        className="w-full bg-canvas-soft border border-hairline focus:border-sunset rounded-[8px] px-3 py-1.5 text-xs text-ink placeholder:text-mute focus:outline-none transition-colors"
                      />
                      {epSearch && (
                        <button
                          onClick={() => setEpSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-mute hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Mode 1: GRID BUTTONS ───────────────────────────── */}
                {viewMode === 'grid' && (
                  <div className="p-4 max-h-[460px] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                      {filteredEpisodes.map((item) => {
                        const isActive = item.number === epNumber;
                        return (
                          <button
                            key={item.id}
                            ref={isActive ? (el) => { activeEpRef.current = el; } : undefined}
                            onClick={() => goToEpisode(item.number)}
                            title={item.title || `Episode ${item.number}`}
                            className={clsx(
                              'h-11 rounded-[10px] text-xs font-display font-bold transition-all cursor-pointer border relative flex items-center justify-center',
                              isActive
                                ? 'bg-sunset text-white border-sunset shadow-lg shadow-sunset/30 scale-105 z-10'
                                : 'bg-canvas-soft border-hairline text-body hover:border-white/40 hover:text-white hover:bg-canvas-card'
                            )}
                          >
                            {item.number}
                            {isActive && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {filteredEpisodes.length === 0 && (
                      <p className="text-center py-6 text-xs text-mute font-display">
                        Tidak ada episode yang cocok.
                      </p>
                    )}
                  </div>
                )}

                {/* ── Mode 2: RICH LIST CARDS ────────────────────────── */}
                {viewMode === 'list' && (
                  <div className="p-2 max-h-[480px] overflow-y-auto custom-scrollbar space-y-1.5">
                    {filteredEpisodes.map((item) => {
                      const isActive = item.number === epNumber;
                      return (
                        <button
                          key={item.id}
                          ref={isActive ? (el) => { activeEpRef.current = el; } : undefined}
                          onClick={() => goToEpisode(item.number)}
                          className={clsx(
                            'w-full text-left flex items-center gap-3 p-2 rounded-[10px] border transition-all cursor-pointer group',
                            isActive
                              ? 'bg-sunset/15 border-sunset/60 text-white shadow-sm'
                              : 'bg-canvas-soft/40 border-hairline/60 text-body hover:bg-canvas-soft hover:border-white/20 hover:text-white'
                          )}
                        >
                          {/* Thumbnail / Number badge */}
                          <div className="relative shrink-0 w-16 h-10 rounded-[6px] overflow-hidden bg-black border border-white/10">
                            <img
                              src={item.thumbnail || anime.poster}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <span className={clsx(
                              'absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1 rounded',
                              isActive ? 'bg-sunset text-white' : 'bg-black/80 text-white'
                            )}>
                              EP {item.number}
                            </span>
                          </div>

                          {/* Episode Title & Duration */}
                          <div className="min-w-0 flex-1">
                            <p className={clsx(
                              'text-xs font-display font-medium leading-tight truncate',
                              isActive ? 'text-sunset font-semibold' : 'text-ink group-hover:text-white'
                            )}>
                              {item.title || `Episode ${item.number}`}
                            </p>
                            <p className="text-[10px] font-mono text-mute mt-1">
                              {formatDuration(item.duration)}
                            </p>
                          </div>

                          {/* Play indicator */}
                          <div className={clsx('shrink-0 text-xs', isActive ? 'text-sunset' : 'text-mute opacity-0 group-hover:opacity-100')}>
                            ▶
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Recommendations Sidebar ─────────────────────────── */}
              {recommendations.length > 0 && (
                <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 shadow-sm">
                  <h3 className="text-xs font-display font-bold text-white uppercase tracking-wider mb-3">
                    Rekomendasi Anime Seru
                  </h3>

                  <div className="space-y-2.5">
                    {recommendations.map((rec) => (
                      <Link
                        key={rec.id}
                        to={`/anime/${rec.slug || rec.id}`}
                        className="flex items-center gap-3 p-1.5 rounded-[8px] hover:bg-canvas-soft border border-transparent hover:border-hairline transition-all group"
                      >
                        <img
                          src={rec.poster}
                          alt={rec.title}
                          className="w-12 h-16 object-cover rounded-[6px] border border-white/10 shrink-0 group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-display font-semibold text-ink group-hover:text-sunset transition-colors truncate">
                            {rec.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-mute">
                            <span>★ {formatScore(rec.score)}</span>
                            <span>·</span>
                            <span>{rec.type}</span>
                            <span>·</span>
                            <span>{rec.year}</span>
                          </div>
                          <p className="text-[10px] text-body-mid font-display line-clamp-1 mt-0.5">
                            {rec.genres.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
