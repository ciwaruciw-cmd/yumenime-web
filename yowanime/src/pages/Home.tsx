import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HeroBanner } from '@/components/anime/HeroBanner';
import { AnimeSection } from '@/components/anime/AnimeSection';
import { Badge } from '@/components/ui/Badge';
import { getAnimeList } from '@/services/animeService';
import { useHistoryStore } from '@/store/useHistoryStore';
import { getPopularGenres } from '@/data/genres';
import type { Anime } from '@/types/anime';

// Fast local session cache for instant 0ms home render on mobile
function getHomeCache(): { featured: Anime | null; trending: Anime[]; newUpdate: Anime[] } | null {
  try {
    const raw = sessionStorage.getItem('yumenime_home_cache');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Home page — hero banner, Trending, Baru Update, Genre Populer.
 * Memuat data anime resmi secara real-time dari AniList GraphQL API.
 */
export default function Home() {
  const cached = useMemo(() => getHomeCache(), []);
  const genres = useMemo(() => getPopularGenres(), []);

  const { history } = useHistoryStore();
  const recentHistory = useMemo(() => history.slice(0, 8), [history]);

  const [featured, setFeatured] = useState<Anime | null>(cached?.featured ?? null);
  const [trending, setTrending] = useState<Anime[]>(cached?.trending ?? []);
  const [newUpdate, setNewUpdate] = useState<Anime[]>(cached?.newUpdate ?? []);

  useEffect(() => {
    let isMounted = true;

    async function fetchRealTimeAnime() {
      try {
        const [trendingRes, latestRes] = await Promise.all([
          // Trending: ongoing anime that are currently popular/viral
          getAnimeList({ status: 'ongoing', pageSize: 12 }),
          // Latest Episodes: anime currently airing / recently started
          getAnimeList({ sort: 'new', status: 'ongoing', pageSize: 12 }),
        ]);

        if (isMounted) {
          let feat = featured;
          if (trendingRes.data.length > 0) {
            setTrending(trendingRes.data);
            feat = trendingRes.data[0];
            setFeatured(feat);
          }
          if (latestRes.data.length > 0) {
            setNewUpdate(latestRes.data);
          }
          // Store fast cache for subsequent visits
          try {
            sessionStorage.setItem(
              'yumenime_home_cache',
              JSON.stringify({
                featured: feat,
                trending: trendingRes.data,
                newUpdate: latestRes.data,
              })
            );
          } catch {}
        }
      } catch (err) {
        console.warn('[Home] Failed to fetch live AniList data:', err);
      }
    }

    void fetchRealTimeAnime();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-enter">
      {/* Hero Banner */}
      {featured && <HeroBanner anime={featured} />}

      {/* Lanjutkan Menonton (Continue Watching) */}
      {recentHistory.length > 0 && (
        <section className="py-6 sm:py-8 border-b border-hairline/40">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-4">
              <div>
                <span className="eyebrow-mono text-sunset block mb-1">YOUR HISTORY</span>
                <h2 className="display-sm text-ink text-xl sm:text-2xl font-bold font-display">Continue Watching</h2>
              </div>
              <Link
                to="/history"
                className="text-xs sm:text-sm font-display text-body-mid hover:text-ink transition-colors flex items-center gap-1 group"
              >
                <span>View All ({history.length})</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {recentHistory.map((item) => {
                const target = `/anime/${item.animeSlug || item.animeId}/episode/${item.episodeNumber}`;
                const progressPct = Math.min(100, Math.round(item.progress));

                return (
                  <Link
                    key={item.animeId}
                    to={target}
                    className="shrink-0 w-60 sm:w-72 group rounded-[10px] overflow-hidden bg-canvas-card border border-hairline hover:border-white/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden">
                      <img
                        src={item.episodeThumbnail || item.animePoster}
                        alt={item.animeTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Episode Badge */}
                      <span className="absolute top-2 left-2 bg-black/85 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/10">
                        EP {item.episodeNumber}
                      </span>

                      {item.completed && (
                        <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          ✓ Done
                        </span>
                      )}

                      {/* Play overlay button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-sunset text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
                        <div
                          className={item.completed ? 'h-full bg-emerald-500' : 'h-full bg-sunset'}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-sunset transition-colors truncate">
                        {item.animeTitle}
                      </h3>
                      <div className="flex items-center justify-between text-[10px] font-mono text-mute mt-1">
                        <span className="truncate max-w-[140px]">
                          {item.episodeTitle || `Episode ${item.episodeNumber}`}
                        </span>
                <span>{item.completed ? 'Done' : `${progressPct}%`}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Trending section — horizontal scroll */}
      <AnimeSection
        eyebrow="TRENDING"
        title="Trending Now"
        animes={trending}
        viewAllHref="/anime?sort=popular"
        horizontal
      />

      {/* Latest Updates section — horizontal scroll */}
      <AnimeSection
        eyebrow="LATEST UPDATES"
        title="New Episodes"
        animes={newUpdate}
        viewAllHref="/anime?sort=latest"
        horizontal
      />

      {/* Genre Populer section */}
      <section className="py-8 md:py-12">
        <div className="max-w-[1280px] mx-auto px-6">
          <span className="eyebrow-mono text-mute block mb-1">GENRES</span>
          <h2 className="display-sm text-ink mb-6">Explore Genres</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {genres.map((genre) => (
              <Link
                key={genre}
                to={`/anime?genre=${encodeURIComponent(genre)}`}
                className="group bg-canvas-card border border-transparent rounded-[8px] px-4 py-5 text-center hover:bg-canvas-soft transition-all duration-200"
              >
                <Badge variant="outline" size="md" className="mb-2">
                  {genre}
                </Badge>
                <p className="text-mute text-[10px] font-mono uppercase tracking-wider group-hover:text-body transition-colors">
                  Explore →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / info band */}
      <section className="py-12">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              {
                label: 'TOTAL ANIME',
                value: '80+',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunset">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                    <line x1="7" y1="2" x2="7" y2="22" />
                    <line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="2" y1="7" x2="7" y2="7" />
                    <line x1="2" y1="17" x2="7" y2="17" />
                    <line x1="17" y1="17" x2="22" y2="17" />
                    <line x1="17" y1="7" x2="22" y2="7" />
                  </svg>
                ),
              },
              {
                label: 'EPISODES',
                value: '1000+',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunset">
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                    <polyline points="17 2 12 7 7 2" />
                  </svg>
                ),
              },
              {
                label: 'GENRES',
                value: `${genres.length}`,
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunset">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                ),
              },
              {
                label: 'FREE STREAMING',
                value: '100%',
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunset">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-canvas-card border border-hairline rounded-[8px] p-6 text-center flex flex-col items-center justify-center"
              >
                <div className="mb-2 p-2 bg-sunset/10 rounded-full border border-sunset/20">{stat.icon}</div>
                <p className="display-sm text-ink mb-1">{stat.value}</p>
                <p className="eyebrow-mono text-mute">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

