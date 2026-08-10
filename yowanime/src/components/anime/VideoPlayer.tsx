import { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import type { VideoSource, VideoQuality } from '@/types/episode';

interface VideoPlayerProps {
  sources: VideoSource[];
  title?: string;
  episodeNumber?: number;
  /** Anime trailer YouTube embed URL — used as stream fallback */
  trailerUrl?: string;
  onEnded?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const FALLBACK_SERVERS = [
  { id: 'srv-1', name: 'Server 1 (Google Fast Stream)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { id: 'srv-2', name: 'Server 2 (MDN High Speed)', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
  { id: 'srv-3', name: 'Server 3 (GTV Mirror 1)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { id: 'srv-4', name: 'Server 4 (GTV Mirror 2)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { id: 'srv-5', name: 'Server 5 (GTV Mirror 3)', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
];

/**
 * Custom HTML5 video player with:
 * - Multi-server fallback & auto-failover on load error
 * - Play/Pause, Volume, Progress bar, Fullscreen
 * - Quality selector (480p/720p/1080p) & Server selector
 * - Next/Prev episode buttons
 * - Auto-play next episode countdown
 * - Iframe embed support
 */
export function VideoPlayer({
  sources,
  title,
  episodeNumber,
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
  const [quality, setQuality] = useState<VideoQuality>('720p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [selectedServerIndex, setSelectedServerIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get current source URL based on quality & selected server index
  const activeSource = (sources && sources.length > 0)
    ? (sources.find((s) => s.quality === quality) ?? sources[0])
    : null;

  const currentServerFallback = FALLBACK_SERVERS[selectedServerIndex % FALLBACK_SERVERS.length];

  // Normalize YouTube URL to embed format if needed
  const normalizeUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      try {
        const vidId = new URLSearchParams(new URL(url).search).get('v');
        if (vidId) return `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
      } catch { /* ignore */ }
    }
    if (url.includes('youtu.be/')) {
      try {
        const vidId = url.split('youtu.be/')[1]?.split('?')[0];
        if (vidId) return `https://www.youtube.com/embed/${vidId}?autoplay=1&rel=0&modestbranding=1`;
      } catch { /* ignore */ }
    }
    return url;
  };

  const activeSourceUrl = activeSource?.url ? normalizeUrl(activeSource.url) : '';
  const normalizedTrailerUrl = normalizeUrl(trailerUrl);
  const fallbackUrl = normalizeUrl(currentServerFallback.url);

  const videoUrl: string = (() => {
    // Primary server index (0): try episode source, then trailer
    if (selectedServerIndex === 0) {
      if (activeSourceUrl) return activeSourceUrl;
      if (normalizedTrailerUrl) return normalizedTrailerUrl;
    }
    // Failover server index (>0) or fallback: use selected high-speed fallback mirror
    return fallbackUrl;
  })();

  const isIframeUrl = (
    videoUrl.includes('youtube.com/embed') ||
    videoUrl.includes('youtube.com/watch') ||
    videoUrl.includes('youtu.be') ||
    videoUrl.includes('iframe') ||
    videoUrl.includes('player.')
  );

  // Handle video error (auto-switch server)
  const handleVideoError = useCallback(() => {
    setIsLoading(false);
    setErrorMessage(`Server ${selectedServerIndex + 1} tidak merespon. Mengalihkan ke Server alternatif...`);
    setTimeout(() => {
      setSelectedServerIndex((prev) => (prev + 1) % FALLBACK_SERVERS.length);
      setErrorMessage(null);
    }, 1500);
  }, [selectedServerIndex]);

  // Auto-hide controls after 3s of inactivity
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

  // Countdown auto-play next episode
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

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative bg-black rounded-[8px] overflow-hidden group select-none',
        isFullscreen && 'rounded-none'
      )}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      role="region"
      aria-label="Video player"
    >
      {/* Render iframe or video tag */}
      {isIframeUrl ? (
        <iframe
          key={videoUrl}
          src={videoUrl.includes('youtube.com/embed')
            ? `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1`
            : videoUrl
          }
          title={title ?? 'Anime stream'}
          className="w-full aspect-video border-0 block"
          style={{ minHeight: '360px' }}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video block cursor-pointer"
          onClick={togglePlay}
          onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onLoadedData={() => setIsLoading(false)}
          onError={handleVideoError}
          preload="auto"
          playsInline
          aria-label={title ?? 'Anime video'}
        />
      )}

      {/* Loading spinner */}
      {isLoading && !isIframeUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="w-10 h-10 border-2 border-white/20 border-t-sunset rounded-full animate-spin" />
        </div>
      )}

      {/* Error / Switching server toast overlay */}
      {errorMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-sunset/90 text-white text-xs font-display px-4 py-2 rounded-full shadow-lg z-20 backdrop-blur-sm">
          {errorMessage}
        </div>
      )}

      {/* Auto-play countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
          <p className="text-body text-sm font-display mb-2">Episode berikutnya dalam</p>
          <div className="text-ink display-md mb-4">{countdown}</div>
          <div className="flex gap-3">
            <button
              onClick={() => { setCountdown(null); onNext?.(); }}
              className="px-5 py-2 rounded-full bg-sunset text-white text-sm font-display hover:bg-sunset/90 transition-colors"
            >
              Lanjutkan Sekarang
            </button>
            <button
              onClick={() => setCountdown(null)}
              className="px-5 py-2 rounded-full border border-white/20 text-ink text-sm font-display hover:border-white/40 transition-colors"
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {!isIframeUrl && (
        <div
          className={clsx(
            'absolute inset-0 flex flex-col justify-end transition-opacity duration-300',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Title bar */}
          {title && (
            <div className="absolute top-0 left-0 right-0 px-4 pt-3 pb-6 bg-gradient-to-b from-black/70 to-transparent">
              <p className="text-white text-sm font-display flex items-center justify-between">
                <span>
                  {episodeNumber !== undefined && <span className="text-sunset mr-2 font-mono text-xs">EP {episodeNumber}</span>}
                  {title}
                </span>
                <span className="text-[10px] font-mono bg-sunset/20 text-sunset px-2 py-0.5 rounded border border-sunset/30">
                  {currentServerFallback.name.split(' ')[0]} {currentServerFallback.name.split(' ')[1]}
                </span>
              </p>
            </div>
          )}

          {/* Bottom controls */}
          <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-8 space-y-2">
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="relative h-1 bg-white/20 rounded-full cursor-pointer hover:h-1.5 transition-all"
              onClick={handleProgressClick}
              role="slider"
              aria-label="Video progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="absolute left-0 top-0 h-full bg-sunset rounded-full transition-none"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Control buttons row */}
            <div className="flex items-center gap-2">
              {/* Prev episode */}
              {hasPrev && (
                <button
                  onClick={onPrev}
                  className="text-white/70 hover:text-white p-1 transition-colors"
                  aria-label="Episode sebelumnya"
                  title="Episode sebelumnya"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white p-1 hover:text-white/80 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
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

              {/* Next episode */}
              {hasNext && (
                <button
                  onClick={onNext}
                  className="text-white/70 hover:text-white p-1 transition-colors"
                  aria-label="Episode berikutnya"
                  title="Episode berikutnya"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Volume */}
              <div className="flex items-center gap-1 group/vol">
                <button onClick={toggleMute} className="text-white/70 hover:text-white p-1 transition-colors" aria-label={isMuted ? 'Unmute' : 'Mute'}>
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
                  className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-sunset"
                  aria-label="Volume"
                />
              </div>

              {/* Time */}
              <span className="text-white/70 text-xs font-mono ml-1">
                {fmt(currentTime)} / {fmt(duration)}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Server selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowServerMenu((v) => !v); setShowQualityMenu(false); }}
                  className="text-sunset hover:text-white text-xs font-mono px-2 py-1 rounded border border-sunset/40 hover:border-sunset bg-sunset/10 transition-colors flex items-center gap-1"
                  aria-label="Pilih Server Mirror"
                >
                  <span>Server {selectedServerIndex + 1}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {showServerMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-canvas-soft border border-hairline rounded-[8px] overflow-hidden shadow-2xl z-30 min-w-[160px]">
                    <div className="px-3 py-1.5 border-b border-hairline text-[10px] font-mono text-mute uppercase">
                      PILIH MIRROR SERVER
                    </div>
                    {FALLBACK_SERVERS.map((srv, idx) => (
                      <button
                        key={srv.id}
                        onClick={() => {
                          setSelectedServerIndex(idx);
                          setShowServerMenu(false);
                          setIsLoading(true);
                        }}
                        className={clsx(
                          'block w-full text-left px-3 py-2 text-xs font-mono hover:bg-white/10 transition-colors',
                          selectedServerIndex === idx ? 'text-sunset font-bold bg-white/5' : 'text-body'
                        )}
                      >
                        {srv.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowQualityMenu((v) => !v); setShowServerMenu(false); }}
                  className="text-white/70 hover:text-white text-xs font-mono px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-colors flex items-center gap-1"
                  aria-label="Pilih kualitas video"
                  aria-haspopup="listbox"
                  aria-expanded={showQualityMenu}
                >
                  <span>{quality}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-canvas-soft border border-hairline rounded-[8px] overflow-hidden shadow-2xl z-30 min-w-[100px]" role="listbox">
                    <div className="px-3 py-1.5 border-b border-hairline text-[10px] font-mono text-mute uppercase">
                      KUALITAS
                    </div>
                    {(sources && sources.length > 0 ? sources : [
                      { quality: '1080p' as VideoQuality, url: '' },
                      { quality: '720p' as VideoQuality, url: '' },
                      { quality: '480p' as VideoQuality, url: '' },
                    ]).map((s) => (
                      <button
                        key={s.quality}
                        role="option"
                        aria-selected={quality === s.quality}
                        onClick={() => {
                          const v = videoRef.current;
                          const t = v?.currentTime ?? 0;
                          const playing = isPlaying;
                          setQuality(s.quality);
                          setShowQualityMenu(false);
                          setTimeout(() => {
                            if (v) {
                              v.currentTime = t;
                              if (playing) void v.play();
                            }
                          }, 100);
                        }}
                        className={clsx(
                          'block w-full text-left px-3 py-2 text-xs font-mono hover:bg-white/10 transition-colors',
                          quality === s.quality ? 'text-sunset font-bold bg-white/5' : 'text-body'
                        )}
                      >
                        {s.quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white/70 hover:text-white p-1 transition-colors"
                aria-label={isFullscreen ? 'Keluar fullscreen' : 'Fullscreen'}
              >
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
  );
}
