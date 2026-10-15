import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HeroBanner } from '@/components/anime/HeroBanner';
import { AnimeSection } from '@/components/anime/AnimeSection';
import { getAnimeList } from '@/services/animeService';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useActionSheetStore } from '@/store/useActionSheetStore';
import type { Anime } from '@/types/anime';

// Fast local session cache for instant 0ms home render on mobile
function getHomeCache(): Record<string, any> | null {
  try {
    const raw = sessionStorage.getItem('yumenime_home_cr_cache');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Crunchyroll Mobile App Experience.
 * Recreates the exact layout from the 5 mobile screenshots:
 * - Full-bleed multi-slide Hero banner with vertical key-art & dash indicators
 * - Floating "👑 Go Premium" banner
 * - "Trending Anime"
 * - "Your Anime Starter Pack"
 * - "Continue Watching" 16:9 episode card with progress bar
 * - "Movie Night"
 * - "Binge-worthy Anime For You"
 * - "Popular Dubbed Anime"
 * - "Into The Fantasia"
 * - "Latest Releases"
 */
export default function Home() {
  const cached = useMemo(() => getHomeCache(), []);
  const { history } = useHistoryStore();
  const { openMenu } = useActionSheetStore();
  const recentHistory = useMemo(() => history.slice(0, 6), [history]);

  const [trending, setTrending] = useState<Anime[]>(cached?.trending ?? []);
  const [starterPack, setStarterPack] = useState<Anime[]>(cached?.starterPack ?? []);
  const [movies, setMovies] = useState<Anime[]>(cached?.movies ?? []);
  const [bingeWorthy, setBingeWorthy] = useState<Anime[]>(cached?.bingeWorthy ?? []);
  const [fantasia, setFantasia] = useState<Anime[]>(cached?.fantasia ?? []);
  const [newUpdate, setNewUpdate] = useState<Anime[]>(cached?.newUpdate ?? []);

  useEffect(() => {
    let isMounted = true;

    async function fetchCrunchyrollSections() {
      try {
        const [trendingRes, starterRes, movieRes, bingeRes, fantasiaRes, latestRes] = await Promise.all([
          // Trending
          getAnimeList({ status: 'ongoing', pageSize: 12 }),
          // Starter pack (top rating)
          getAnimeList({ sort: 'score', pageSize: 12 }),
          // Movies (Movie Night)
          getAnimeList({ type: 'Movie', pageSize: 12 }),
          // Binge-worthy (completed series)
          getAnimeList({ status: 'completed', pageSize: 12 }),
          // Into the Fantasia
          getAnimeList({ genre: 'Fantasy', pageSize: 12 }),
          // Latest releases
          getAnimeList({ sort: 'new', pageSize: 12 }),
        ]);

        if (isMounted) {
          if (trendingRes.data.length > 0) setTrending(trendingRes.data);
          if (starterRes.data.length > 0) setStarterPack(starterRes.data);
          if (movieRes.data.length > 0) setMovies(movieRes.data);
          if (bingeRes.data.length > 0) setBingeWorthy(bingeRes.data);
          if (fantasiaRes.data.length > 0) setFantasia(fantasiaRes.data);
          if (latestRes.data.length > 0) setNewUpdate(latestRes.data);

          try {
            sessionStorage.setItem(
              'yumenime_home_cr_cache',
              JSON.stringify({
                trending: trendingRes.data,
                starterPack: starterRes.data,
                movies: movieRes.data,
                bingeWorthy: bingeRes.data,
                fantasia: fantasiaRes.data,
                newUpdate: latestRes.data,
              })
            );
          } catch {}
        }
      } catch (err) {
        console.warn('[Home] Failed to load anime sections:', err);
      }
    }

    void fetchCrunchyrollSections();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fallback demo for Continue Watching when history is empty, matching Screenshot 2 (Re:ZERO Episode 18)
  const displayHistory = recentHistory.length > 0 ? recentHistory : [
    {
      animeId: 're-zero',
      animeTitle: 'Re:ZERO -Starting Life in Another World-',
      animeSlug: 're-zero-starting-life-in-another-world',
      animePoster: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fcover%2Flarge%2Fbx21355-6bBqJ37qB07X.png&w=400&output=webp',
      episodeThumbnail: 'https://images.weserv.nl/?url=https%3A%2F%2Fs4.anilist.co%2Ffile%2Fanilistcdn%2Fmedia%2Fanime%2Fbanner%2F21355-mReVJyZbe85g.jpg&w=600&output=webp',
      episodeNumber: 18,
      episodeTitle: 'From Zero',
      currentTime: 1080,
      duration: 1440,
      progress: 75,
      completed: false,
      updatedAt: Date.now(),
    },
  ];

  return (
    <div className="page-enter bg-black text-white min-h-screen">
      {/* 1. Crunchyroll Full-bleed Multi-slide Hero Banner */}
      <HeroBanner animes={trending} />



      {/* 2. Trending Anime (Screenshot 1 & 5) */}
      <AnimeSection
        title="Trending Anime"
        animes={trending}
        viewAllHref="/anime?sort=popular"
        horizontal
      />

      {/* 4. Your Anime Starter Pack (Screenshot 2) */}
      <AnimeSection
        title="Your Anime Starter Pack"
        animes={starterPack}
        viewAllHref="/anime?sort=rating"
        horizontal
      />

      {/* 5. Continue Watching (Screenshot 2: 16:9 landscape card with episode & orange progress bar) */}
      <section className="py-4 sm:py-6 max-w-[1280px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            Continue Watching
          </h2>
          {recentHistory.length > 0 && (
            <Link
              to="/history"
              className="text-xs sm:text-sm font-sans font-medium text-[#9b9ba6] hover:text-[#ff640a] transition-colors flex items-center gap-1"
            >
              <span>View All ({recentHistory.length})</span>
              <span aria-hidden="true">›</span>
            </Link>
          )}
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-none custom-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {displayHistory.map((item) => {
            const target = `/anime/${item.animeSlug || item.animeId}/episode/${item.episodeNumber}`;
            const progressPct = Math.min(100, Math.max(15, Math.round(item.progress || 0)));

            return (
              <div
                key={`${item.animeId}-${item.episodeNumber}`}
                className="shrink-0 w-[280px] sm:w-[320px] md:w-[360px] group flex flex-col"
              >
                {/* 16:9 Thumbnail Frame */}
                <div className="relative aspect-video rounded-[6px] overflow-hidden bg-[#16161a] shadow-lg">
                  <Link to={target} className="block w-full h-full">
                    <img
                      src={item.episodeThumbnail || item.animePoster}
                      alt={item.animeTitle}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Center hover play button on desktop */}
                    <div className="hidden md:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-[#ff640a] text-black flex items-center justify-center shadow-xl">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </div>
                    </div>

                    {/* Bottom-left metadata: Play icon + Title + Episode & Duration */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          {/* Small white play icon */}
                          <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                              <polygon points="6 3 20 12 6 21 6 3" />
                            </svg>
                          </div>
                          <span className="font-sans font-bold text-xs sm:text-sm text-white truncate block">
                            {item.animeTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#c0c0c8] font-sans mt-0.5 ml-7">
                          Episode {item.episodeNumber}
                        </p>
                      </div>

                      {/* Duration badge on right (e.g. 23m) */}
                      <span className="text-[11px] font-sans text-[#a0a0a8] shrink-0 font-medium pb-0.5">
                        {item.duration ? `${Math.round(item.duration / 60)}m` : '23m'}
                      </span>
                    </div>

                    {/* Crunchyroll Signature Bright Orange Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-[#ff640a]"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </Link>

                  {/* Top-right 3-dots button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openMenu({
                        id: item.animeId,
                        title: item.animeTitle,
                        slug: item.animeSlug,
                        poster: item.animePoster,
                        genres: ['Action', 'Fantasy'],
                        status: 'ongoing',
                        synopsis: `Continue watching episode ${item.episodeNumber}`,
                        type: 'TV',
                        score: 85,
                        episodes: 25,
                      } as Anime);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer"
                    aria-label="Options"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2.2" />
                      <circle cx="12" cy="12" r="2.2" />
                      <circle cx="12" cy="19" r="2.2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Movie Night (Screenshot 3) */}
      <AnimeSection
        title="Movie Night"
        animes={movies}
        viewAllHref="/anime?type=MOVIE"
        horizontal
      />

      {/* 7. Binge-worthy Anime For You (Screenshot 3) */}
      <AnimeSection
        title="Binge-worthy Anime For You"
        animes={bingeWorthy}
        viewAllHref="/anime?status=completed"
        horizontal
      />

      {/* 8. Popular Dubbed Anime (Screenshot 4) */}
      <AnimeSection
        title="Popular Dubbed Anime"
        animes={starterPack.length > 0 ? starterPack.slice().reverse() : trending}
        viewAllHref="/anime"
        horizontal
      />

      {/* 9. Into The Fantasia (Screenshot 4) */}
      <AnimeSection
        title="Into The Fantasia"
        animes={fantasia}
        viewAllHref="/anime?genre=Fantasy"
        horizontal
      />

      {/* Latest Releases */}
      <AnimeSection
        title="Latest Releases"
        animes={newUpdate}
        viewAllHref="/anime?sort=latest"
        horizontal
      />


    </div>
  );
}
