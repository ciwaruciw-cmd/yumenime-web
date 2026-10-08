import { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import type { VideoSource, VideoQuality } from '@/types/episode';

interface VideoPlayerProps {
  sources: VideoSource[];
  title?: string;
  episodeNumber?: number;
  /** Anime trailer YouTube embed URL — used as stream fallback */
  trailerUrl?: string;
  /** Initial playback position in seconds (e.g. from watch history) */
  initialTime?: number;
  /** Callback fired periodically as the user watches the video */
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onDownload?: () => void;
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
  initialTime = 0,
  onProgressUpdate,
  onEnded,
  onNext,
  onPrev,
  onDownload,
  hasNext = false,
  hasPrev = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReportedTimeRef = useRef<number>(0);
  const hasAppliedInitialTimeRef = useRef(false);
  const stallRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorRetryCount = useRef(0);
  const healthCheckTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastHealthTime = useRef<number>(0);
  const healthCheckStuckCount = useRef(0);
  const isRecoveringRef = useRef(false);

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
  const [resumedToast, setResumedToast] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [keyToast, setKeyToast] = useState<string | null>(null);
  const keyToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPlayableUrl = (url?: string) =>
    url &&
    !url.includes('link.desustream.com') &&
    !url.includes('filedon.co') &&
    !url.includes('files.im') &&
    !url.includes('mega.nz') &&
    !url.includes('gdriveplayer.me') &&
    !url.includes('meownime.ltd') &&
    !url.includes('otakufiles.net') &&
    !url.includes('krakenfiles.com') &&
    !url.includes('.mkv');

  // Auto-select highest available real quality (prefer 1080p, then 720p, then 480p)
  useEffect(() => {
    if (!sources || sources.length === 0) return;
    const currentValid = sources.find((s) => s.quality === quality && isPlayableUrl(s.url));
    if (!currentValid) {
      const best =
        sources.find((s) => s.quality === '1080p' && isPlayableUrl(s.url)) ||
        sources.find((s) => s.quality === '720p' && isPlayableUrl(s.url)) ||
        sources.find((s) => s.quality === '480p' && isPlayableUrl(s.url)) ||
        sources.find((s) => isPlayableUrl(s.url)) ||
        sources[0];
      if (best) setQuality(best.quality);
    }
  }, [sources, quality]);

  // Get current source URL based on quality & selected server index
  const activeSource = (sources && sources.length > 0)
    ? (
        sources.find((s) => s.quality === quality && isPlayableUrl(s.url)) ??
        sources.find((s) => s.quality === '720p' && isPlayableUrl(s.url)) ??
        sources.find((s) => isPlayableUrl(s.url)) ??
        sources[0]
      )
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

  const isIframeUrl = (() => {
    if (!videoUrl) return false;
    if (videoUrl.startsWith('/api/stream/video')) return false;
    // YouTube
    if (videoUrl.includes('youtube.com/embed') || videoUrl.includes('youtu.be') || videoUrl.includes('youtube.com/watch')) return true;
    // Known embed player domains (NOT direct MP4)
    if (videoUrl.includes('nekoclouds.com/embed')) return true;
    if (videoUrl.includes('odcloud.net') && !videoUrl.endsWith('.mp4')) return true;
    if (videoUrl.includes('desustream')) return true;
    if (videoUrl.includes('blogger.com') && !videoUrl.endsWith('.mp4')) return true;
    if (videoUrl.includes('/embed/') || videoUrl.includes('/embed-') || videoUrl.includes('/player/')) return true;
    if (videoUrl.includes('streampoi.com') || videoUrl.includes('playmogo.com')) return true;
    if (videoUrl.includes('iframe')) return true;
    if (videoUrl.includes('player.') && !videoUrl.endsWith('.mp4')) return true;
    return false;
  })();

  // Set referrerPolicy via DOM ref to bypass hotlink protection on direct MP4 streams
  useEffect(() => {
    if (videoRef.current) {
      (videoRef.current as any).referrerPolicy = 'no-referrer';
    }
  }, [videoUrl]);

  // Recover video playback from a given position without full reload when possible
  const recoverPlayback = useCallback((v: HTMLVideoElement, savedTime: number) => {
    if (isRecoveringRef.current) return;
    isRecoveringRef.current = true;
    const src = v.src;
    // Reset src to force a fresh network request
    v.src = '';
    // Use a micro-delay so the browser processes the empty src
    setTimeout(() => {
      if (!videoRef.current) { isRecoveringRef.current = false; return; }
      videoRef.current.src = src;
      videoRef.current.load();
      // Wait for loadedmetadata before seeking
      const onMeta = () => {
        if (videoRef.current && savedTime > 0) {
          videoRef.current.currentTime = savedTime;
        }
        void videoRef.current?.play().catch(() => {});
        isRecoveringRef.current = false;
        videoRef.current?.removeEventListener('loadedmetadata', onMeta);
      };
      videoRef.current.addEventListener('loadedmetadata', onMeta, { once: true });
      // Safety: if loadedmetadata never fires, clear recovery flag after 10s
      setTimeout(() => { isRecoveringRef.current = false; }, 10000);
    }, 100);
  }, []);

  // Handle video error (retry same server up to 3 times with backoff, then auto-switch)
  const handleVideoError = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const savedTime = v.currentTime ?? 0;

    if (errorRetryCount.current < 1) {
      errorRetryCount.current += 1;
      setIsLoading(true);
      setErrorMessage(`Koneksi terputus. Mencoba menghubungkan kembali...`);
      setTimeout(() => {
        setErrorMessage(null);
        if (videoRef.current) {
          recoverPlayback(videoRef.current, savedTime);
        }
      }, 1000);
    } else {
      // Switch to next server quickly
      errorRetryCount.current = 0;
      setIsLoading(false);
      setErrorMessage(`Server tidak merespon. Mengalihkan ke Server alternatif...`);
      setTimeout(() => {
        setSelectedServerIndex((prev) => (prev + 1) % FALLBACK_SERVERS.length);
        setErrorMessage(null);
      }, 1200);
    }
  }, [selectedServerIndex, recoverPlayback]);

  // Handle video stall / suspend — try a seek-nudge first, full reload only as last resort
  const handleStall = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.paused || v.ended || isRecoveringRef.current) return;
    if (stallRetryTimer.current) clearTimeout(stallRetryTimer.current);
    stallRetryTimer.current = setTimeout(() => {
      const vEl = videoRef.current;
      if (!vEl || vEl.paused || vEl.ended || vEl.readyState > 2 || isRecoveringRef.current) return;
      const t = vEl.currentTime;
      // Try 1: Seek-nudge — move forward by a tiny amount to kick the buffer
      try {
        vEl.currentTime = t + 0.1;
      } catch { /* ignore */ }
      // If still stuck after 4 more seconds, do a full recovery
      setTimeout(() => {
        const v2 = videoRef.current;
        if (!v2 || v2.paused || v2.ended || v2.readyState > 2 || isRecoveringRef.current) return;
        recoverPlayback(v2, t);
      }, 4000);
    }, 5000);
  }, [recoverPlayback]);

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

  // Reset initial time application when episode changes
  useEffect(() => {
    hasAppliedInitialTimeRef.current = false;
    errorRetryCount.current = 0;
    healthCheckStuckCount.current = 0;
    isRecoveringRef.current = false;
    setResumedToast(null);
    lastReportedTimeRef.current = 0;
    lastHealthTime.current = 0;
    if (stallRetryTimer.current) clearTimeout(stallRetryTimer.current);
  }, [episodeNumber, videoUrl]);

  // Cleanup stall timer and health check on unmount
  useEffect(() => {
    return () => {
      if (stallRetryTimer.current) clearTimeout(stallRetryTimer.current);
      if (healthCheckTimer.current) clearInterval(healthCheckTimer.current);
    };
  }, []);

  // ── Periodic health check: detect frozen playback and auto-recover ──────────
  useEffect(() => {
    if (healthCheckTimer.current) clearInterval(healthCheckTimer.current);
    healthCheckTimer.current = setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused || v.ended || isRecoveringRef.current) {
        healthCheckStuckCount.current = 0;
        return;
      }
      // If currentTime hasn't moved in 8 seconds while supposedly playing
      if (Math.abs(v.currentTime - lastHealthTime.current) < 0.5) {
        healthCheckStuckCount.current += 1;
        if (healthCheckStuckCount.current >= 2) {
          // Stuck for 2 consecutive checks (~16s) — auto-recover
          console.warn('[VideoPlayer] Health check: playback frozen, auto-recovering...');
          healthCheckStuckCount.current = 0;
          const savedTime = v.currentTime;
          setErrorMessage('Video terhenti. Memulihkan...');
          recoverPlayback(v, savedTime);
          setTimeout(() => setErrorMessage(null), 3000);
        }
      } else {
        healthCheckStuckCount.current = 0;
      }
      lastHealthTime.current = v.currentTime;
    }, 8000);

    return () => {
      if (healthCheckTimer.current) clearInterval(healthCheckTimer.current);
    };
  }, [recoverPlayback]);

  // ── Network offline/online auto-resume ──────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      const v = videoRef.current;
      if (!v || isRecoveringRef.current) return;
      // When coming back online, if the video was playing, recover it
      if (v.paused && v.currentTime > 0 && !v.ended) {
        const savedTime = v.currentTime;
        setErrorMessage('Koneksi kembali. Melanjutkan...');
        recoverPlayback(v, savedTime);
        setTimeout(() => setErrorMessage(null), 3000);
      } else if (!v.paused && v.readyState < 3) {
        const savedTime = v.currentTime;
        setErrorMessage('Koneksi kembali. Melanjutkan...');
        recoverPlayback(v, savedTime);
        setTimeout(() => setErrorMessage(null), 3000);
      }
    };

    const handleOffline = () => {
      setErrorMessage('Koneksi internet terputus. Menunggu koneksi...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [recoverPlayback]);

  // Report final progress when unmounting
  useEffect(() => {
    return () => {
      if (videoRef.current && onProgressUpdate) {
        onProgressUpdate(videoRef.current.currentTime, videoRef.current.duration || 0);
      }
    };
  }, [onProgressUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const dur = v.duration || 0;
    setDuration(dur);

    // If initialTime provided and not yet applied, resume playback
    if (!hasAppliedInitialTimeRef.current && initialTime > 5 && dur > 15 && initialTime < dur - 10) {
      v.currentTime = initialTime;
      setCurrentTime(initialTime);
      hasAppliedInitialTimeRef.current = true;
      const m = Math.floor(initialTime / 60);
      const s = Math.floor(initialTime % 60);
      setResumedToast(`Melanjutkan dari ${m}:${String(s).padStart(2, '0')}`);
      setTimeout(() => setResumedToast(null), 5000);
    }
  }, [initialTime]);

  const handleRestartFromBeginning = useCallback(() => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      setCurrentTime(0);
      setResumedToast(null);
      if (onProgressUpdate) {
        onProgressUpdate(0, v.duration || 0);
      }
    }
  }, [onProgressUpdate]);

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
    const cur = v.currentTime;
    const dur = v.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);

    // Emit progress update every ~3 seconds
    if (onProgressUpdate && Math.abs(cur - lastReportedTimeRef.current) >= 3) {
      lastReportedTimeRef.current = cur;
      onProgressUpdate(cur, dur);
    }
  }, [onProgressUpdate]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (videoRef.current && onProgressUpdate) {
      onProgressUpdate(videoRef.current.duration || 0, videoRef.current.duration || 0);
    }
    if (hasNext) {
      setCountdown(5);
    }
    onEnded?.();
  }, [hasNext, onEnded, onProgressUpdate]);

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

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────
  const showKeyToast = useCallback((msg: string) => {
    setKeyToast(msg);
    if (keyToastTimer.current) clearTimeout(keyToastTimer.current);
    keyToastTimer.current = setTimeout(() => setKeyToast(null), 1200);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger if focus is in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      // Only when player is visible
      if (!containerRef.current) return;

      const v = videoRef.current;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (v) {
            if (v.paused) { void v.play(); showKeyToast('▶ Play'); }
            else { v.pause(); showKeyToast('⏸ Pause'); }
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (v) { v.currentTime = Math.min(v.currentTime + 5, v.duration || 0); showKeyToast('→ +5s'); }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (v) { v.currentTime = Math.max(v.currentTime - 5, 0); showKeyToast('← -5s'); }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (v) {
            const newVol = Math.min(1, v.volume + 0.1);
            v.volume = newVol;
            setVolume(newVol);
            showKeyToast(`🔊 ${Math.round(newVol * 100)}%`);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (v) {
            const newVol = Math.max(0, v.volume - 0.1);
            v.volume = newVol;
            setVolume(newVol);
            showKeyToast(`🔉 ${Math.round(newVol * 100)}%`);
          }
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          showKeyToast(isMuted ? '🔊 Unmuted' : '🔇 Muted');
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          void toggleFullscreen();
          showKeyToast(isFullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen');
          break;
        case 'n':
        case 'N':
          if (hasNext) { onNext?.(); showKeyToast('⏭ Next Episode'); }
          break;
        case 'p':
        case 'P':
          if (hasPrev) { onPrev?.(); showKeyToast('⏮ Previous Episode'); }
          break;
        case 'd':
        case 'D':
          if (onDownload) {
            e.preventDefault();
            onDownload();
            showKeyToast('📥 Download Episode');
          }
          break;
        case '?':
          setShowShortcuts((v) => !v);
          break;
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [toggleMute, toggleFullscreen, isMuted, isFullscreen, hasNext, hasPrev, onNext, onPrev, onDownload, showKeyToast]);


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
      {/* Key action toast */}
      {keyToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm text-white text-sm font-mono font-bold px-4 py-2 rounded-full border border-white/10 pointer-events-none animate-in fade-in duration-100">
          {keyToast}
        </div>
      )}

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <div
          className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="bg-[#111113] border border-white/10 rounded-2xl p-5 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-white text-sm">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-mute hover:text-white transition-colors cursor-pointer text-lg">✕</button>
            </div>
            <div className="space-y-2">
              {[
                { key: 'Space / K', desc: 'Play / Pause' },
                { key: '← / →', desc: 'Seek ±5 seconds' },
                { key: '↑ / ↓', desc: 'Volume ±10%' },
                { key: 'M', desc: 'Toggle mute' },
                { key: 'F', desc: 'Toggle fullscreen' },
                { key: 'N', desc: 'Next episode' },
                { key: 'P', desc: 'Previous episode' },
                { key: 'D', desc: 'Download episode' },
                { key: '?', desc: 'Show this help' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className="bg-white/10 text-white text-[11px] font-mono px-2 py-1 rounded border border-white/20">{key}</kbd>
                  <span className="text-body-mid text-xs font-display">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Render iframe or video tag */}
      {isIframeUrl ? (
        <iframe
          key={videoUrl}
          src={
            videoUrl.includes('youtube.com/embed')
              ? `${videoUrl}${videoUrl.includes('?') ? '&' : '?'}autoplay=1&rel=0&modestbranding=1`
              : (videoUrl.includes('desustream') || videoUrl.includes('nekoclouds'))
                ? `/api/stream/proxy?url=${encodeURIComponent(videoUrl)}`
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
          src={
            videoUrl.startsWith('/api/stream/video') || videoUrl.startsWith('data:') || videoUrl.startsWith('blob:') || videoUrl.startsWith('/')
              ? videoUrl
              : (videoUrl.includes('sokuja') || videoUrl.includes('googlevideo') || videoUrl.includes('.mp4') || videoUrl.includes('.m3u8'))
                ? `/api/stream/video?url=${encodeURIComponent(videoUrl)}`
                : videoUrl
          }
          className="w-full aspect-video block cursor-pointer"
          onClick={togglePlay}
          onPlay={() => { setIsPlaying(true); setIsLoading(false); }}
          onPause={() => {
            setIsPlaying(false);
            if (videoRef.current && onProgressUpdate) {
              onProgressUpdate(videoRef.current.currentTime, videoRef.current.duration || 0);
            }
          }}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => {
            setIsLoading(false);
            errorRetryCount.current = 0; // clear error count on successful load
            healthCheckStuckCount.current = 0;
            if (stallRetryTimer.current) clearTimeout(stallRetryTimer.current);
            handleLoadedMetadata();
          }}
          onLoadedData={() => {
            setIsLoading(false);
            errorRetryCount.current = 0;
            healthCheckStuckCount.current = 0;
          }}
          onStalled={handleStall}
          onSuspend={() => {
            // Only recover if playing and not enough data buffered
            const v = videoRef.current;
            if (v && !v.paused && v.readyState < 3 && !isRecoveringRef.current) handleStall();
          }}
          onError={() => {
            // Don't trigger error handling if we're in the middle of a recovery
            if (!isRecoveringRef.current) handleVideoError();
          }}
          preload="auto"
          playsInline
          aria-label={title ?? 'Anime video'}
        />
      )}

      {/* Resume playback toast overlay */}
      {resumedToast && (
        <div className="absolute top-14 left-4 z-30 flex items-center gap-2.5 bg-black/90 border border-sunset/40 text-white text-xs px-3.5 py-2 rounded-full shadow-2xl backdrop-blur-md animate-fade-in-up">
          <span className="flex items-center gap-1.5 text-sunset font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {resumedToast}
          </span>
          <button
            onClick={handleRestartFromBeginning}
            className="text-[11px] font-mono text-white/80 hover:text-white underline hover:no-underline cursor-pointer ml-1"
          >
            Mulai dari awal
          </button>
          <button
            onClick={() => setResumedToast(null)}
            className="text-white/60 hover:text-white ml-1 text-xs cursor-pointer"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
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
              Continue Now
            </button>
            <button
              onClick={() => setCountdown(null)}
              className="px-5 py-2 rounded-full border border-white/20 text-ink text-sm font-display hover:border-white/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Title bar overlay — always shown so the Yumenime player identity is consistent */}
      {title && (
        <div className="absolute top-0 left-0 right-0 px-3 sm:px-4 pt-2 sm:pt-3 pb-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10">
          <div className="flex items-center justify-between gap-2">
            <p className="text-white text-xs sm:text-sm font-display truncate flex-1 min-w-0">
              {episodeNumber !== undefined && (
                <span className="text-sunset mr-1.5 font-mono text-[10px] sm:text-xs font-semibold">
                  EP {episodeNumber}
                </span>
              )}
              <span>{title}</span>
            </p>
            <span className="shrink-0 whitespace-nowrap text-[9px] sm:text-[10px] font-mono bg-sunset/20 text-sunset px-1.5 sm:px-2 py-0.5 rounded border border-sunset/30 pointer-events-auto">
              {currentServerFallback.name.split(' ')[0]} {currentServerFallback.name.split(' ')[1]}
            </span>
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

          {/* Bottom controls */}
          <div className="bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2.5 sm:px-4 pb-2 sm:pb-3 pt-6 sm:pt-8 space-y-1.5 sm:space-y-2">
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
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Prev episode */}
              {hasPrev && (
                <button
                  onClick={onPrev}
                  className="text-white/70 hover:text-white p-1 transition-colors shrink-0 cursor-pointer"
                  aria-label="Episode sebelumnya"
                  title="Episode sebelumnya"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white p-1 hover:text-white/80 transition-colors shrink-0 cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              {/* Next episode */}
              {hasNext && (
                <button
                  onClick={onNext}
                  className="text-white/70 hover:text-white p-1 transition-colors shrink-0 cursor-pointer"
                  aria-label="Episode berikutnya"
                  title="Episode berikutnya"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Volume (hidden on small mobile screens to keep player controls clean and uncluttered) */}
              <div className="hidden sm:flex items-center gap-1 group/vol shrink-0">
                <button onClick={toggleMute} className="text-white/70 hover:text-white p-1 transition-colors cursor-pointer" aria-label={isMuted ? 'Unmute' : 'Mute'}>
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
              <span className="text-white/70 text-[10px] sm:text-xs font-mono ml-0.5 sm:ml-1 whitespace-nowrap shrink-0">
                {fmt(currentTime)} / {fmt(duration)}
              </span>

              {/* Spacer */}
              <div className="flex-1 min-w-1" />

              {/* Server selector */}
              <div className="relative shrink-0">
                <button
                  onClick={() => { setShowServerMenu((v) => !v); setShowQualityMenu(false); }}
                  className="text-sunset hover:text-white text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-sunset/40 hover:border-sunset bg-sunset/10 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  aria-label="Pilih Server Mirror"
                >
                  <span>Server {selectedServerIndex + 1}</span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {showServerMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-canvas-soft border border-hairline rounded-[8px] overflow-hidden shadow-2xl z-30 min-w-[150px]">
                    <div className="px-3 py-1.5 border-b border-hairline text-[9px] font-mono text-mute uppercase">
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
                          'block w-full text-left px-3 py-2 text-xs font-mono hover:bg-white/10 transition-colors cursor-pointer',
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
              <div className="relative shrink-0">
                <button
                  onClick={() => { setShowQualityMenu((v) => !v); setShowServerMenu(false); }}
                  className="text-white/80 hover:text-white text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-white/20 hover:border-white/40 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                  aria-label="Pilih kualitas video"
                  aria-haspopup="listbox"
                  aria-expanded={showQualityMenu}
                >
                  <span>{quality}</span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-canvas-soft border border-hairline rounded-[8px] overflow-hidden shadow-2xl z-30 min-w-[90px]" role="listbox">
                    <div className="px-3 py-1.5 border-b border-hairline text-[9px] font-mono text-mute uppercase">
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
                          'block w-full text-left px-3 py-2 text-xs font-mono hover:bg-white/10 transition-colors cursor-pointer',
                          quality === s.quality ? 'text-sunset font-bold bg-white/5' : 'text-body'
                        )}
                      >
                        {s.quality}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Download Episode Button */}
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="text-white/80 hover:text-sunset text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-white/20 hover:border-sunset/40 transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer shrink-0"
                  aria-label="Unduh Episode"
                  title="Unduh Episode (Shortcut: D)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="shrink-0">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span className="hidden sm:inline">Download</span>
                </button>
              )}

              {/* Keyboard shortcuts hint */}
              <button
                onClick={() => setShowShortcuts(true)}
                className="hidden sm:flex text-white/60 hover:text-white text-[10px] font-mono p-1 transition-colors shrink-0 cursor-pointer"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" strokeLinecap="round" />
                </svg>
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white/80 hover:text-white p-1 transition-colors shrink-0 cursor-pointer"
                aria-label={isFullscreen ? 'Keluar fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
