import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import type { VideoSource } from '@/types/episode';

interface VideoPlayerProps {
  sources?: VideoSource[];
  title?: string;
  episodeNumber?: number;
  animeId?: string | number;
  malId?: string | number;
  /** Anime trailer YouTube embed URL — used as preview option */
  trailerUrl?: string;
  onEnded?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface StreamServer {
  id: string;
  name: string;
  badge: string;
  url: string;
  isDirect?: boolean;
  type: 'embed' | 'direct' | 'trailer';
}

const DUMMY_DOMAINS = ['commondatastorage', 'vjs.zencdn', 'w3schools', 'mozilla.net'];

function isRealDirectStream(url?: string): boolean {
  if (!url) return false;
  return !DUMMY_DOMAINS.some((d) => url.includes(d));
}

function normalizeUrl(url?: string): string {
  if (!url) return '';
  const clean = url.replace(/&amp;/g, '&');
  if (clean.includes('youtube.com/watch?v=')) {
    try {
      const vidId = new URLSearchParams(new URL(clean).search).get('v');
      if (vidId) return `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
    } catch { /* ignore */ }
  }
  if (clean.includes('youtu.be/')) {
    try {
      const vidId = clean.split('youtu.be/')[1]?.split('?')[0];
      if (vidId) return `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
    } catch { /* ignore */ }
  }
  return clean;
}

/**
 * Modern Cinema Video Player with Live Multi-Server Streaming Engine
 * Supports direct streaming, responsive embed players, server switching,
 * auto-next episode, full-screen mode, and theater toggle.
 */
export function VideoPlayer({
  sources = [],
  title,
  episodeNumber = 1,
  animeId,
  malId,
  trailerUrl,
  onEnded,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeServerId, setActiveServerId] = useState<string>('srv-vidlink');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const targetAnimeId = animeId ? String(animeId) : '';
  const targetMalId = malId ? String(malId) : targetAnimeId;

  // Build dynamic server list based on current anime and episode
  const availableServers: StreamServer[] = useMemo(() => {
    const list: StreamServer[] = [];

    // Server 1: VidLink HD (Multi-sub / Sub Indo)
    if (targetAnimeId) {
      list.push({
        id: 'srv-vidlink',
        name: 'Server 1 (HD Ultra)',
        badge: '⚡ Multi-Sub / Fast',
        url: `https://vidlink.pro/anime/${targetAnimeId}/${episodeNumber}`,
        type: 'embed',
      });
    }

    // Server 2: 2Embed VIP (Multi-Language)
    if (targetAnimeId) {
      list.push({
        id: 'srv-2embed',
        name: 'Server 2 (Multi-Sub VIP)',
        badge: '🚀 HD Stream',
        url: `https://www.2embed.cc/embed/anime/${targetAnimeId}/${episodeNumber}`,
        type: 'embed',
      });
    }

    // Server 3: VidSrc Cloud (Global MAL)
    if (targetMalId) {
      list.push({
        id: 'srv-vidsrc',
        name: 'Server 3 (Cloud VIP)',
        badge: '🌐 Global Stream',
        url: `https://vidsrc.me/embed/anime?mal=${targetMalId}&ep=${episodeNumber}`,
        type: 'embed',
      });
    }

    // Server 4: MultiEmbed Cloud
    if (targetAnimeId) {
      list.push({
        id: 'srv-multiembed',
        name: 'Server 4 (Mirror Stream)',
        badge: '🍿 Backup',
        url: `https://multiembed.mov/?anilist_id=${targetAnimeId}&e=${episodeNumber}`,
        type: 'embed',
      });
    }

    // Server 5 / Direct: Real scraped video stream if available (e.g. Sokuja / Otakudesu direct mp4/embed)
    const realSource = sources.find((s) => isRealDirectStream(s.url));
    if (realSource && realSource.url) {
      const isDirect = realSource.url.endsWith('.mp4') || realSource.url.endsWith('.m3u8') || realSource.url.includes('storages.sokuja.uk');
      list.unshift({
        id: 'srv-scraped',
        name: 'Server Lokal (Sub Indo)',
        badge: '🎬 Otakudesu / Sokuja',
        url: normalizeUrl(realSource.url),
        isDirect,
        type: isDirect ? 'direct' : 'embed',
      });
    }

    // Server 6: Official YouTube PV / Trailer
    if (trailerUrl) {
      list.push({
        id: 'srv-trailer',
        name: 'Trailer Resmi (PV)',
        badge: '📺 YouTube Preview',
        url: normalizeUrl(trailerUrl),
        type: 'trailer',
      });
    }

    // Safety fallback
    if (list.length === 0) {
      list.push({
        id: 'srv-vidlink',
        name: 'Server 1 (HD Ultra)',
        badge: '⚡ Primary',
        url: `https://vidlink.pro/anime/${targetAnimeId || '101922'}/${episodeNumber}`,
        type: 'embed',
      });
    }

    return list;
  }, [targetAnimeId, targetMalId, episodeNumber, sources, trailerUrl]);

  // Ensure activeServerId is valid
  useEffect(() => {
    if (!availableServers.some((s) => s.id === activeServerId)) {
      setActiveServerId(availableServers[0]?.id || 'srv-vidlink');
    }
  }, [availableServers, activeServerId]);

  // Reset loading state and errors when server, episode, or anime changes
  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
  }, [activeServerId, episodeNumber, animeId]);

  const currentServer = useMemo(() => {
    return availableServers.find((s) => s.id === activeServerId) || availableServers[0];
  }, [availableServers, activeServerId]);

  const currentUrl = currentServer?.url || '';
  const isDirectVideo = currentServer?.type === 'direct' || currentUrl.endsWith('.mp4') || currentUrl.endsWith('.webm') || currentUrl.includes('.mp4?');
  const isIframe = !isDirectVideo;

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Auto-hide controls after 3s
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  // Auto-play next episode countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      onNext?.();
      setCountdown(null);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown, onNext]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => setIsLoading(false));
    } else {
      v.pause();
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    setDuration(v.duration || 0);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (hasNext) {
      setCountdown(5);
    }
    onEnded?.();
  }, [hasNext, onEnded]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const v = videoRef.current;
    if (!bar || !v) return;
    const rect = bar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* ── Main Player Container ── */}
      <div
        ref={containerRef}
        className={clsx(
          'relative bg-black rounded-[12px] overflow-hidden group select-none shadow-2xl border border-white/10',
          isFullscreen && 'rounded-none border-0'
        )}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        role="region"
        aria-label="Anime Video Player"
      >
        {/* Render Iframe or Direct Video */}
        {isIframe ? (
          <div className="relative w-full aspect-video min-h-[320px] sm:min-h-[420px] lg:min-h-[500px] bg-black">
            <iframe
              key={currentUrl}
              src={currentUrl.includes('youtube.com/embed')
                ? `${currentUrl}${currentUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1`
                : currentUrl
              }
              title={title ?? 'Anime Streaming Player'}
              className="w-full h-full border-0 block"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="no-referrer"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={currentUrl}
            className="w-full aspect-video min-h-[320px] sm:min-h-[420px] lg:min-h-[500px] block cursor-pointer"
            onClick={togglePlay}
            onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setErrorMessage('Server direct sedang lambat. Silakan pilih Server 1 atau Server 2.');
            }}
            preload="auto"
            playsInline
            aria-label={title ?? 'Anime Video'}
          />
        )}

        {/* Loading Spinner */}
        {isLoading && !isIframe && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-white/20 border-t-sunset rounded-full animate-spin" />
              <p className="text-xs font-mono text-white/80">Memuat Video Stream...</p>
            </div>
          </div>
        )}

        {/* Error Toast Message */}
        {errorMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-sunset/90 backdrop-blur-md text-white text-xs font-display px-4 py-2 rounded-full shadow-lg z-30 border border-white/20 flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-2 text-white/70 hover:text-white">✕</button>
          </div>
        )}

        {/* Auto-play Next Episode Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm z-30">
            <p className="text-body text-sm font-display mb-1">Episode Berikutnya Dalam</p>
            <div className="text-sunset display-md font-mono font-bold mb-4">{countdown}</div>
            <div className="flex gap-3">
              <button
                onClick={() => { setCountdown(null); onNext?.(); }}
                className="px-5 py-2.5 rounded-full bg-sunset text-white text-xs font-display font-semibold hover:bg-sunset/90 transition-colors shadow-lg cursor-pointer"
              >
                Putar Sekarang ➔
              </button>
              <button
                onClick={() => setCountdown(null)}
                className="px-5 py-2.5 rounded-full border border-white/20 text-ink text-xs font-display hover:border-white/40 transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Custom Direct Controls (Only active for direct video player) */}
        {!isIframe && (
          <div
            className={clsx(
              'absolute inset-0 flex flex-col justify-end transition-opacity duration-300',
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            {/* Title Top Bar */}
            {title && (
              <div className="absolute top-0 left-0 right-0 px-4 pt-3 pb-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
                <p className="text-white text-sm font-display font-medium truncate max-w-[80%]">
                  <span className="text-sunset font-mono font-bold mr-2 text-xs">EP {episodeNumber}</span>
                  {title}
                </p>
                <span className="text-[10px] font-mono bg-sunset/20 text-sunset px-2 py-0.5 rounded border border-sunset/30">
                  {currentServer.name}
                </span>
              </div>
            )}

            {/* Bottom Controls Bar */}
            <div className="bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-3 pt-8 space-y-2">
              {/* Progress Bar */}
              <div
                ref={progressRef}
                className="relative h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 transition-all"
                onClick={handleProgressClick}
                role="slider"
                aria-label="Video Progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-sunset rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center gap-3">
                {/* Prev */}
                {hasPrev && (
                  <button onClick={onPrev} className="text-white/70 hover:text-white p-1 transition-colors" title="Episode Sebelumnya">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}

                {/* Play/Pause */}
                <button onClick={togglePlay} className="text-white p-1 hover:text-sunset transition-colors">
                  {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                {/* Next */}
                {hasNext && (
                  <button onClick={onNext} className="text-white/70 hover:text-white p-1 transition-colors" title="Episode Selanjutnya">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}

                {/* Volume */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button onClick={toggleMute} className="text-white/70 hover:text-white p-1 transition-colors">
                    {isMuted || volume === 0 ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" /><line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min={0} max={1} step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-sunset cursor-pointer"
                  />
                </div>

                {/* Time */}
                <span className="text-white/70 text-xs font-mono ml-1">
                  {fmt(currentTime)} / {fmt(duration)}
                </span>

                <div className="flex-1" />

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="text-white/70 hover:text-white p-1 transition-colors">
                  {isFullscreen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Multi-Server Switcher Bar ─────────────────────────────── */}
      <div className="bg-canvas-card border border-hairline rounded-[12px] p-3 sm:p-4 shadow-sm space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-display font-bold text-white uppercase tracking-wider">
              Pilihan Server Streaming
            </span>
            <span className="text-[10px] font-mono text-mute bg-canvas-soft px-2 py-0.5 rounded border border-hairline">
              {availableServers.length} Server Aktif
            </span>
          </div>

          <p className="text-[11px] font-display text-body-mid">
            💡 <span className="text-mute">Jika video buffering atau macet, klik server lain di bawah ini.</span>
          </p>
        </div>

        {/* Server Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {availableServers.map((srv) => {
            const isActive = srv.id === activeServerId;
            return (
              <button
                key={srv.id}
                onClick={() => {
                  setActiveServerId(srv.id);
                  setIsLoading(true);
                  setErrorMessage(null);
                }}
                className={clsx(
                  'flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-display font-medium transition-all cursor-pointer border text-left',
                  isActive
                    ? 'bg-sunset text-white border-sunset shadow-md shadow-sunset/20 scale-[1.02]'
                    : 'bg-canvas-soft border-hairline text-body hover:border-white/30 hover:text-white hover:bg-canvas'
                )}
              >
                <span>{srv.name}</span>
                <span className={clsx(
                  'text-[10px] font-mono px-1.5 py-0.2 rounded',
                  isActive ? 'bg-black/30 text-white font-bold' : 'bg-white/5 text-mute'
                )}>
                  {srv.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
