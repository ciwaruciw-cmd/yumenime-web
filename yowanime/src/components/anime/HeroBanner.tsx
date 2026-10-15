import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import type { Anime } from '@/types/anime';

interface HeroBannerProps {
  anime?: Anime;
  animes?: Anime[];
}

/**
 * Crunchyroll-style Full-bleed Hero Banner.
 * Features:
 * - Immersive vertical key-art with deep bottom black gradient
 * - Bold anime title & metadata (14+ • Dub | Sub • Genres)
 * - Two-line concise synopsis
 * - High-contrast orange pill CTA: "Start Watching E1"
 * - Round bookmark watchlist button
 * - Crunchyroll signature horizontal dash indicators (interactive & auto-sliding)
 */
export function HeroBanner({ anime: singleAnime, animes = [] }: HeroBannerProps) {
  const slides = animes.length > 0 ? animes.slice(0, 6) : (singleAnime ? [singleAnime] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toggle, isInWatchlist } = useWatchlistStore();
  const touchStartX = useRef<number | null>(null);

  const activeAnime = slides[currentIndex] || singleAnime;
  const inWatchlist = activeAnime ? isInWatchlist(activeAnime.id) : false;

  // Auto-advance slides every 6s
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!activeAnime) return null;

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || slides.length <= 1) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        // Swiped left -> next
        setCurrentIndex((prev) => (prev + 1) % slides.length);
      } else {
        // Swiped right -> prev
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    touchStartX.current = null;
  };

  const ageRating = activeAnime.rating === '18+' || activeAnime.rating === 'Rx'
    ? '18+'
    : activeAnime.rating === 'R+' || activeAnime.genres.includes('Seinen')
      ? '16+'
      : '14+';

  const genresStr = activeAnime.genres.slice(0, 5).join(', ');

  return (
    <section
      className="relative w-full min-h-[520px] sm:min-h-[580px] md:min-h-[640px] flex items-end overflow-hidden bg-black select-none"
      aria-label="Featured anime"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background artwork — portrait/poster prioritized on mobile, banner on desktop */}
      <div className="absolute inset-0 bg-black">
        <img
          key={activeAnime.id}
          src={activeAnime.posterHD || activeAnime.poster || activeAnime.banner}
          alt={activeAnime.title}
          className="w-full h-full object-cover object-top sm:object-center md:hidden transition-opacity duration-700 opacity-80"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        <img
          key={`${activeAnime.id}-desk`}
          src={activeAnime.banner || activeAnime.posterHD || activeAnime.poster}
          alt={activeAnime.title}
          className="hidden md:block w-full h-full object-cover object-center transition-opacity duration-700 opacity-60"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />

        {/* Multi-layer gradients matching Crunchyroll mobile */}
        {/* Top shadow for status bar and header icons */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/40 to-transparent" />
        {/* Bottom deep fade into pure black (#000000) */}
        <div className="absolute inset-x-0 bottom-0 h-72 sm:h-80 bg-gradient-to-t from-black via-black/85 to-transparent" />
        {/* Left & right desktop subtle vignette */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/60" />
      </div>

      {/* Main Foreground Content */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 sm:px-6 pb-6 sm:pb-8 pt-20">
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          
          {/* Stylized Anime Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg font-sans">
            {activeAnime.title}
          </h1>

          {/* Crunchyroll Meta Line: [14+] • Dub | Sub • Genres */}
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-[#e0e0e5] font-sans">
            <span className="bg-white/15 text-white border border-white/20 text-[11px] font-bold px-1.5 py-0.5 rounded">
              {ageRating}
            </span>
            <span className="text-[#a0a0a8] font-bold">•</span>
            <span className="font-semibold text-white">Dub | Sub</span>
            {genresStr && (
              <>
                <span className="text-[#a0a0a8] font-bold">•</span>
                <span className="text-[#c8c8cf] truncate max-w-[280px] sm:max-w-none">
                  {genresStr}
                </span>
              </>
            )}
          </div>

          {/* Synopsis (2 lines max with clean ellipsis) */}
          <p className="text-xs sm:text-sm text-[#c8c8cf] font-sans leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-xl">
            {activeAnime.synopsis}
          </p>

          {/* Crunchyroll Action Row: [▶ Start Watching E1] + [Bookmark] */}
          <div className="flex items-center gap-3 pt-1 sm:pt-2">
            <Link
              to={`/anime/${activeAnime.slug || activeAnime.id}/episode/1`}
              className="flex-1 sm:flex-none sm:min-w-[240px] bg-[#ff640a] hover:bg-[#ff7a29] text-black font-extrabold text-sm sm:text-base py-3 px-6 rounded-full flex items-center justify-center gap-2.5 shadow-xl shadow-[#ff640a]/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-black">
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
              <span>Start Watching E1</span>
            </Link>

            {/* Crunchyroll Round Bookmark Button */}
            <button
              onClick={() => toggle(activeAnime)}
              className={clsx(
                'w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer shrink-0',
                inWatchlist
                  ? 'border-[#ff640a] bg-[#ff640a]/15 text-[#ff640a]'
                  : 'border-white/30 hover:border-white text-white hover:bg-white/10'
              )}
              title={inWatchlist ? 'Remove from My Lists' : 'Add to My Lists'}
              aria-label={inWatchlist ? 'Remove from My Lists' : 'Add to My Lists'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={inWatchlist ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </button>
          </div>

          {/* Crunchyroll Carousel Horizontal Dash Indicators */}
          {slides.length > 1 && (
            <div className="flex items-center gap-1.5 pt-3">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={clsx(
                    'h-1 rounded-full transition-all duration-300 cursor-pointer',
                    idx === currentIndex
                      ? 'w-8 bg-[#ff640a]'
                      : 'w-7 bg-white/25 hover:bg-white/50'
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
