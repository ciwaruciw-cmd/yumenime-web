import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAnimeDetail } from '@/hooks/useAnimeDetail';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { VideoPlayer } from '@/components/anime/VideoPlayer';
import { CommentSection } from '@/components/anime/CommentSection';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { Badge } from '@/components/ui/Badge';
import { formatScore, formatDuration } from '@/utils/formatDate';
import { resolveEpisodeStream } from '@/services/animeService';
import { DownloadModal } from '@/components/anime/DownloadModal';
import type { Episode, VideoSource } from '@/types/episode';

/**
 * Watch Episode Page — Modern Cinema Layout.
 */
export default function WatchEpisode() {
  const { id, ep } = useParams<{ id: string; ep: string }>();
  const navigate = useNavigate();
  const { anime, episodes, isLoading, error } = useAnimeDetail(id ?? '');
  const { toggle, isInWatchlist } = useWatchlistStore();
  const { history, saveProgress, markCompleted, getEpisodeHistory } = useHistoryStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [theaterMode, setTheaterMode] = useState(false);
  const [epSearch, setEpSearch] = useState('');
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const activeEpRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  const epNumber = Number(ep) || 1;

  const currentEpisode = useMemo(
    () => episodes.find((e) => e.number === epNumber) ?? episodes[0],
    [episodes, epNumber]
  );

  const [resolvedSources, setResolvedSources] = useState<VideoSource[] | null>(null);
  const [isResolvingStream, setIsResolvingStream] = useState(false);

  const isRealSource = (url?: string) =>
    url &&
    !url.includes('w3.org') &&
    !url.includes('zencdn') &&
    !url.includes('w3schools') &&
    !url.includes('commondatastorage') &&
    !url.includes('oceans.mp4') &&
    !url.includes('sintel') &&
    !url.includes('mov_bbb') &&
    !url.includes('link.desustream.com') &&
    !url.includes('filedon.co') &&
    !url.includes('files.im') &&
    !url.includes('mega.nz') &&
    !url.includes('gdriveplayer.me') &&
    !url.includes('meownime.ltd') &&
    !url.includes('otakufiles.net') &&
    !url.includes('krakenfiles.com') &&
    !url.includes('googlevideo.com') &&
    !url.includes('.mkv');

  // Auto-resolve real 1080p & 720p stream when episode has no/dummy sources
  useEffect(() => {
    if (!anime || !currentEpisode) return;
    setResolvedSources(null);

    const hasRealSources = currentEpisode.sources?.some((s) => isRealSource(s.url));

    if (hasRealSources) {
      setResolvedSources(currentEpisode.sources);
      setIsResolvingStream(false);
      return;
    }

    // Sources empty or all dummy — resolve live
    setIsResolvingStream(true);
    let isMounted = true;
    resolveEpisodeStream(anime.title, currentEpisode.number).then((sources) => {
      if (!isMounted) return;
      setIsResolvingStream(false);
      if (sources && sources.length > 0) {
        setResolvedSources(sources);
      } else {
        setResolvedSources([]); // Explicitly set empty so UI shows "no stream" state
      }
    });

    return () => {
      isMounted = false;
    };
  }, [anime, currentEpisode]);

  // Get current episode's watch history for resume playback
  const currentHistory = useMemo(() => {
    if (!anime) return undefined;
    return getEpisodeHistory(anime.id, epNumber);
  }, [anime, epNumber, getEpisodeHistory]);

  const initialTime = useMemo(() => {
    if (!currentHistory || currentHistory.completed) return 0;
    return currentHistory.currentTime;
  }, [currentHistory]);

  // Map of episode progress for UI indicators
  const historyMap = useMemo(() => {
    const map = new Map<number, { completed?: boolean; progress: number }>();
    if (!anime) return map;
    const hist = history.find((h) => h.animeId === anime.id || h.animeSlug === anime.slug);
    if (!hist) return map;

    if (hist.completedEpisodes) {
      for (const ep of hist.completedEpisodes) {
        map.set(ep, { completed: true, progress: 100 });
      }
    }
    map.set(hist.episodeNumber, {
      completed: hist.completed,
      progress: hist.progress,
    });
    return map;
  }, [history, anime]);

  const handleProgressUpdate = useCallback(
    (currentTime: number, duration: number) => {
      if (!anime || !currentEpisode) return;
      saveProgress({
        animeId: anime.id,
        animeTitle: anime.title,
        animeSlug: anime.slug || anime.id,
        animePoster: anime.poster,
        animeType: anime.type,
        episodeNumber: currentEpisode.number,
        episodeTitle: currentEpisode.title,
        episodeThumbnail: currentEpisode.thumbnail || anime.poster,
        currentTime,
        duration,
        progress: duration > 0 ? (currentTime / duration) * 100 : 0,
        completed: duration > 0 && currentTime / duration >= 0.9,
      });
    },
    [anime, currentEpisode, saveProgress]
  );

  const handleVideoEnded = useCallback(() => {
    if (anime && currentEpisode) {
      markCompleted(anime.id, currentEpisode.number);
    }
  }, [anime, currentEpisode, markCompleted]);

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
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'n' || e.key === 'N') onNext();
      if (e.key === 'p' || e.key === 'P') onPrev();
      if (e.key === 't' || e.key === 'T') setTheaterMode((prev) => !prev);
      if (e.key === 'd' || e.key === 'D') setShowDownloadModal((prev) => !prev);
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

  if (isLoading) {
    return (
      <div className="page-enter pt-16 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
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

  if (error || !anime) {
    return (
      <div className="page-enter pt-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-6 pb-28">
        <div className="w-16 h-16 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-4 text-sunset">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-display font-semibold text-ink mb-2">Anime Tidak Ditemukan</h2>
        <p className="text-body text-sm font-display mb-6 max-w-md">{error ?? 'Gagal memuat detail anime.'}</p>
        <Link
          to="/anime"
          className="bg-white text-black font-display font-medium text-sm px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
        >
          Kembali ke Katalog Anime
        </Link>
      </div>
    );
  }

  // If episodes loaded but current ep not found, use first episode or show message
  if (!currentEpisode && episodes.length === 0 && !isLoading) {
    return (
      <div className="page-enter pt-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-6 pb-28">
        <div className="text-4xl mb-4">🎬</div>
        <h2 className="text-lg font-display font-semibold text-ink mb-2">Belum Ada Episode</h2>
        <p className="text-body text-sm font-display mb-6 max-w-md">Episode untuk anime ini belum tersedia atau sedang diproses.</p>
        <Link
          to={`/anime/${anime.slug || anime.id}`}
          className="bg-white text-black font-display font-medium text-sm px-6 py-2.5 rounded-full hover:bg-white/90 transition-colors shadow-lg"
        >
          Kembali ke Detail Anime
        </Link>
      </div>
    );
  }

  // Helper render for Episode Explorer
  const renderEpisodeExplorer = (isSidebar = false) => (
    <div className={clsx(
      'bg-canvas-card border border-hairline rounded-[10px] sm:rounded-[12px] overflow-hidden shadow-md',
      isSidebar && 'sticky top-20'
    )}>
      {/* Explorer Header */}
      <div className="p-2.5 sm:p-4 border-b border-hairline bg-canvas-soft/80 flex items-center justify-between">
        <div>
          <h2 className="text-xs sm:text-sm font-display font-bold text-white flex items-center gap-1.5 sm:gap-2">
            <span>Daftar Episode</span>
            <span className="text-[10px] sm:text-[11px] font-mono font-semibold bg-sunset/20 text-sunset px-1.5 py-0.5 rounded-full border border-sunset/30">
              {episodes.length} Total
            </span>
          </h2>
          <p className="text-[10px] sm:text-[11px] font-mono text-mute mt-0.5">
            Sedang memutar: <span className="text-sunset font-bold">EP {epNumber}</span>
          </p>
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        <div className="flex items-center bg-canvas rounded-[6px] sm:rounded-[8px] p-0.5 sm:p-1 border border-hairline">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid Tampilan Angka"
            className={clsx(
              'p-1 sm:p-1.5 rounded-[4px] sm:rounded-[6px] transition-colors cursor-pointer',
              viewMode === 'grid' ? 'bg-white text-black shadow-sm' : 'text-mute hover:text-white'
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              'p-1 sm:p-1.5 rounded-[4px] sm:rounded-[6px] transition-colors cursor-pointer',
              viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-mute hover:text-white'
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <div className="p-2 sm:p-3 border-b border-hairline/60 bg-canvas/60">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nomor atau judul episode..."
              value={epSearch}
              onChange={(e) => setEpSearch(e.target.value)}
              className="w-full bg-canvas-soft border border-hairline focus:border-sunset rounded-[6px] sm:rounded-[8px] px-2.5 py-1 text-[11px] sm:text-xs text-ink placeholder:text-mute focus:outline-none transition-colors"
            />
            {epSearch && (
              <button
                onClick={() => setEpSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-mute hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode 1: GRID BUTTONS */}
      {viewMode === 'grid' && (
        <div className="p-2.5 sm:p-4 max-h-[240px] sm:max-h-[320px] lg:max-h-[440px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2">
            {filteredEpisodes.map((item) => {
              const isActive = item.number === epNumber;
              const epHist = historyMap.get(item.number);
              const isCompleted = epHist?.completed;
              const hasProgress = epHist && !isCompleted && epHist.progress > 0;

              return (
                <button
                  key={item.id}
                  ref={isActive ? (el) => { activeEpRef.current = el; } : undefined}
                  onClick={() => goToEpisode(item.number)}
                  title={item.title || `Episode ${item.number}`}
                  className={clsx(
                    'h-9 sm:h-11 rounded-[6px] sm:rounded-[8px] text-[11px] sm:text-xs font-display font-bold transition-all cursor-pointer border relative flex items-center justify-center overflow-hidden',
                    isActive
                      ? 'bg-sunset text-white border-sunset shadow-lg shadow-sunset/30 scale-105 z-10'
                      : isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:border-emerald-400'
                      : 'bg-canvas-soft border-hairline text-body hover:border-white/40 hover:text-white hover:bg-canvas'
                  )}
                >
                  <span className="flex items-center gap-0.5">
                    {item.number}
                    {isCompleted && !isActive && (
                      <span className="text-[10px] text-emerald-400 ml-0.5">✓</span>
                    )}
                  </span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                  )}
                  {hasProgress && !isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/15">
                      <div
                        className="h-full bg-sunset"
                        style={{ width: `${Math.min(100, Math.max(5, epHist.progress))}%` }}
                      />
                    </div>
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

      {/* Mode 2: RICH LIST CARDS */}
      {viewMode === 'list' && (
        <div className="p-2 max-h-[280px] sm:max-h-[340px] lg:max-h-[460px] overflow-y-auto custom-scrollbar space-y-1.5">
          {filteredEpisodes.map((item: Episode) => {
            const isActive = item.number === epNumber;
            const epHist = historyMap.get(item.number);
            const isCompleted = epHist?.completed;
            const hasProgress = epHist && !isCompleted && epHist.progress > 0;

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
                  {hasProgress && !isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                      <div
                        className="h-full bg-sunset"
                        style={{ width: `${Math.min(100, Math.max(5, epHist.progress))}%` }}
                      />
                    </div>
                  )}
                  {isCompleted && !isActive && (
                    <span className="absolute top-1 left-1 bg-emerald-500/90 text-white text-[8px] font-bold px-1 rounded">
                    ✓ Done
                    </span>
                  )}
                </div>

                {/* Episode Title & Duration */}
                <div className="min-w-0 flex-1">
                  <p className={clsx(
                    'text-xs font-display font-medium leading-tight truncate',
                    isActive ? 'text-sunset font-semibold' : 'text-ink group-hover:text-white'
                  )}>
                    {item.title || `Episode ${item.number}`}
                  </p>
                  <p className="text-[10px] font-mono text-mute mt-0.5 flex items-center gap-1.5">
                    <span>{formatDuration(item.duration)}</span>
                    {hasProgress && (
                      <span className="text-sunset">· {Math.round(epHist.progress)}%</span>
                    )}
                  </p>
                </div>

                {/* Play indicator */}
                <div className={clsx('shrink-0 text-xs font-bold', isActive ? 'text-sunset' : 'text-mute opacity-0 group-hover:opacity-100')}>
                  ▶
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="page-enter pt-12 sm:pt-14 bg-canvas min-h-screen text-ink pb-20 sm:pb-12">
      {/* ── Main Container (Wide 1680px Canvas) ─────────────────────── */}
      <div className="max-w-[1680px] mx-auto px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-6">

        {/* ── Breadcrumb Navigation ──────────────────────────────── */}
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-display text-mute mb-2.5 sm:mb-4 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to="/anime" className="hover:text-white transition-colors">Anime</Link>
          <span>/</span>
          <Link to={`/anime/${anime.slug || anime.id}`} className="hover:text-white transition-colors truncate max-w-[160px] sm:max-w-[300px]">
            {anime.title}
          </Link>
          <span>/</span>
          <span className="text-sunset font-medium">Episode {epNumber}</span>
        </div>

        {/* ── Theater Mode or Standard Grid ──────────────────────── */}
        <div className={clsx(
          'grid gap-3 sm:gap-6 lg:gap-8 transition-all duration-300',
          theaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
        )}>

          {/* ════ LEFT / MAIN PLAYER COLUMN ════════════════════════ */}
          <div className={clsx(
            'space-y-3 sm:space-y-6',
            theaterMode ? 'col-span-1' : 'lg:col-span-8 xl:col-span-9'
          )}>

            {/* ── Video Player ─────────────────── */}
            <div className="relative group/player rounded-[10px] sm:rounded-[12px] overflow-hidden bg-black border border-white/10 shadow-2xl">
              <div
                className="hidden sm:block absolute -inset-2 opacity-15 pointer-events-none -z-10 bg-gradient-to-t from-sunset/20 to-transparent"
              />

              {/* Stream resolving overlay */}
              {isResolvingStream && !resolvedSources && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 gap-3">
                  <div className="w-10 h-10 border-2 border-sunset/40 border-t-sunset rounded-full animate-spin" />
                  <p className="text-sm font-display text-body">Mencari stream episode...</p>
                </div>
              )}
              {/* No stream found state */}
              {!isResolvingStream && resolvedSources !== null && resolvedSources.length === 0 && (!currentEpisode?.sources || currentEpisode.sources.length === 0) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 gap-3 px-6 text-center">
                  <div className="text-3xl">📡</div>
                  <p className="text-sm font-display font-semibold text-white">Stream Tidak Tersedia</p>
                  <p className="text-xs font-display text-body">Episode ini belum tersedia di database scraper kami. Coba episode lain.</p>
                </div>
              )}
              <VideoPlayer
                sources={resolvedSources && resolvedSources.length > 0 ? resolvedSources : (currentEpisode?.sources || [])}
                title={(currentEpisode?.title) || `Episode ${epNumber}`}
                episodeNumber={currentEpisode?.number ?? epNumber}
                trailerUrl={anime?.trailer}
                initialTime={initialTime}
                onProgressUpdate={handleProgressUpdate}
                onEnded={handleVideoEnded}
                onNext={onNext}
                onPrev={onPrev}
                hasNext={hasNext}
                hasPrev={hasPrev}
                onDownload={() => setShowDownloadModal(true)}
              />
            </div>

            {/* ── Quick Controls & Title Bar ──────────────────────── */}
            <div className="bg-canvas-card border border-hairline rounded-[10px] sm:rounded-[12px] p-3 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                
                {/* Anime and Episode Title Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap text-[11px] sm:text-xs">
                    <span className="font-mono font-bold bg-sunset/15 text-sunset px-2 py-0.5 rounded-full border border-sunset/30 text-[10px] sm:text-xs">
                      EPISODE {epNumber}
                    </span>
                    {anime.score && (
                      <span className="font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-400/20 text-[10px] sm:text-xs">
                        ★ {formatScore(anime.score)}
                      </span>
                    )}
                    <span className="font-mono text-mute">{anime.type}</span>
                    <span className="text-mute/40">·</span>
                    <span className="font-mono text-mute">{anime.year}</span>
                    {anime.studio && (
                      <>
                        <span className="text-mute/40">·</span>
                        <span className="font-mono text-mute truncate max-w-[130px] sm:max-w-none">{anime.studio}</span>
                      </>
                    )}
                  </div>

                  <h1 className="text-base sm:text-xl font-display font-bold text-white leading-snug">
                    {anime.title}
                  </h1>

                  {currentEpisode.title && currentEpisode.title !== `Episode ${epNumber}` && (
                    <p className="text-[11px] sm:text-sm font-display text-body-mid mt-0.5 sm:mt-1 line-clamp-1">
                      {currentEpisode.title}
                    </p>
                  )}
                </div>

                {/* Navigation & Action Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                  {/* Prev Episode */}
                  <button
                    onClick={onPrev}
                    disabled={!hasPrev}
                    title="Previous Episode (Shortcut: P)"
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-display font-medium text-body bg-canvas-soft border border-hairline hover:border-white/40 hover:text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Prev
                  </button>

                  {/* Next Episode */}
                  <button
                    onClick={onNext}
                    disabled={!hasNext}
                    title="Next Episode (Shortcut: N)"
                    className="flex items-center gap-1 text-[11px] sm:text-xs font-display font-medium text-white bg-sunset hover:bg-sunset/90 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md"
                  >
                    Next
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Download Episode Button */}
                  <button
                    onClick={() => setShowDownloadModal(true)}
                    title="Unduh Episode Ini (Shortcut: D)"
                    className="flex items-center gap-1.5 text-[11px] sm:text-xs font-display font-medium text-body bg-canvas-soft border border-hairline hover:border-sunset/60 hover:text-sunset px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer shadow-sm group"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="group-hover:translate-y-0.5 transition-transform">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>Download</span>
                  </button>

                  {/* Theater Mode Toggle (Desktop only) */}
                  <button
                    onClick={() => setTheaterMode((v) => !v)}
                    title={theaterMode ? 'Exit Theater Mode (Shortcut: T)' : 'Wide Theater Mode (Shortcut: T)'}
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
                    title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    className={clsx(
                      'p-1.5 sm:p-2 rounded-full border transition-all cursor-pointer',
                      inWatchlist
                        ? 'bg-sunset/20 border-sunset text-sunset'
                        : 'bg-canvas-soft border-hairline text-mute hover:text-white hover:border-white/30'
                    )}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill={inWatchlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>

                  {/* Anime Detail Page Link */}
                  <Link
                    to={`/anime/${anime.slug || anime.id}`}
                    className="p-1.5 sm:p-2 rounded-full bg-canvas-soft border border-hairline text-mute hover:text-white hover:border-white/30 transition-all"
                    title="Buka Halaman Detail Anime"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Genres + Synopsis Snippet */}
              <div className="pt-2 sm:pt-3 border-t border-hairline/60">
                <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2">
                  {anime.genres.map((genre) => (
                    <Badge key={genre} variant="default" size="sm" className="text-[10px] sm:text-xs px-2 py-0.5">
                      {genre}
                    </Badge>
                  ))}
                </div>

                {anime.synopsis && (
                  <div>
                    <p className={clsx(
                      'text-[11px] sm:text-xs text-body font-display leading-relaxed transition-all',
                      !synopsisExpanded && 'line-clamp-2'
                    )}>
                      {anime.synopsis}
                    </p>
                    {anime.synopsis.length > 150 && (
                      <button
                        onClick={() => setSynopsisExpanded((v) => !v)}
                        className="text-[10px] sm:text-[11px] font-display text-sunset hover:underline mt-0.5 cursor-pointer font-medium"
                      >
                        {synopsisExpanded ? 'Sembunyikan' : 'Baca selengkapnya...'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── MOBILE ONLY: Episode Explorer (Directly below video player) ── */}
            <div className="block lg:hidden">
              {renderEpisodeExplorer(false)}
            </div>

            {/* ── Comments / Discussion Section ── */}
            <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6 shadow-sm">
              <CommentSection
                animeId={anime.id}
                episodeId={currentEpisode.id}
              />
            </div>

            {/* ── Theater Mode: Episode Selector (if theater mode active on desktop) ── */}
            {theaterMode && (
              <div>
                {renderEpisodeExplorer(false)}
              </div>
            )}

          </div>

          {/* ════ RIGHT SIDEBAR (DESKTOP ONLY) ════════════════════════ */}
          {!theaterMode && (
            <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6">
              {/* Sticky Episode Explorer */}
              {renderEpisodeExplorer(true)}
            </div>
          )}

        </div>
      </div>

      {/* Download Modal Dialog */}
      {anime && currentEpisode && (
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          anime={anime}
          episode={currentEpisode}
          allEpisodes={episodes}
          currentSources={resolvedSources && resolvedSources.length > 0 ? resolvedSources : (currentEpisode.sources || [])}
        />
      )}
    </div>
  );
}
