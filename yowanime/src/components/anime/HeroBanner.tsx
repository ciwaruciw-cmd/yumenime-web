import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { formatScore } from '@/utils/formatDate';
import type { Anime } from '@/types/anime';

interface HeroBannerProps {
  anime: Anime;
}

/**
 * Full-width hero banner for the Home page.
 * Background poster with gradient overlay.
 * Title in display-xl (96px, -2.4px tracking), synopsis, CTA buttons.
 * Follows xAI hero-band spec.
 */
export function HeroBanner({ anime }: HeroBannerProps) {
  const { toggle, isInWatchlist } = useWatchlistStore();
  const inWatchlist = isInWatchlist(anime.id);

  return (
    <section
      className="relative w-full min-h-[440px] sm:min-h-[520px] md:min-h-[640px] flex items-end pt-16 md:pt-24 pb-8 md:pb-12 transform-gpu"
      aria-label="Featured anime"
    >
      {/* Background image */}
      <div className="absolute inset-0 bg-black">
        <img
          src={anime.banner ?? anime.poster}
          alt=""
          className="w-full h-full object-cover object-center opacity-50"
          aria-hidden="true"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
        />
        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1280px] mx-auto w-full px-6">
        <div className="max-w-3xl space-y-4 animate-fade-in-up">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="eyebrow-mono text-sunset">FEATURED ANIME</span>
            <Badge variant="sunset">{anime.type}</Badge>
            {anime.status === 'ongoing' && <Badge variant="success">Ongoing</Badge>}
          </div>

          {/* Title — display-xl */}
          <h1 className="display-xl text-ink font-medium max-w-2xl leading-tight">
            {anime.title}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-2 text-sm flex-wrap text-body">
            <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff7a17" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-ink font-mono font-medium">{formatScore(anime.score)}</span>
            </div>
            <span className="text-mute">·</span>
            <span>{anime.year}</span>
            <span className="text-mute">·</span>
            <span>{anime.studio}</span>
            {anime.episodes > 0 && (
              <>
                <span className="text-mute">·</span>
                <span>{anime.episodes} Episodes</span>
              </>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-body text-sm md:text-base font-display leading-relaxed line-clamp-3 max-w-xl">
            {anime.synopsis}
          </p>

          {/* Genre badges */}
          <div className="flex gap-2 flex-wrap">
            {anime.genres.map((g) => (
              <Badge key={g} variant="outline" size="md">{g}</Badge>
            ))}
          </div>

          {/* CTA buttons — pill shape */}
          <div className="flex gap-3 pt-2 flex-wrap">
            <Link to={`/anime/${anime.slug}/episode/1`}>
              <Button variant="primary" size="lg" icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              }>
                Watch Now
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => toggle(anime)}
              icon={
                inWatchlist ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )
              }
            >
              {inWatchlist ? 'Saved' : 'Watchlist'}
            </Button>
            <Link to={`/anime/${anime.slug}`}>
              <Button variant="outline" size="lg" icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </svg>
              }>
                Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
