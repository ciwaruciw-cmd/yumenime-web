import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HeroBanner } from '@/components/anime/HeroBanner';
import { AnimeSection } from '@/components/anime/AnimeSection';
import { Badge } from '@/components/ui/Badge';
import { getAnimeList } from '@/services/animeService';
import {
  getFeaturedAnime,
  getTrendingAnimes,
  getNewUpdateAnimes,
  getAllGenres,
} from '@/data/mockAnime';
import type { Anime } from '@/types/anime';

/**
 * Home page — hero banner, Trending, Baru Update, Genre Populer.
 * Memuat data anime resmi secara real-time dari AniList GraphQL API.
 */
export default function Home() {
  const initialFeatured = useMemo(() => getFeaturedAnime(), []);
  const initialTrending = useMemo(() => getTrendingAnimes(), []);
  const initialNewUpdate = useMemo(() => getNewUpdateAnimes(), []);
  const genres = useMemo(() => getAllGenres(), []);

  const [featured, setFeatured] = useState<Anime | null>(initialFeatured);
  const [trending, setTrending] = useState<Anime[]>(initialTrending);
  const [newUpdate, setNewUpdate] = useState<Anime[]>(initialNewUpdate);

  useEffect(() => {
    let isMounted = true;

    async function fetchRealTimeAnime() {
      try {
        const [trendingRes, latestRes] = await Promise.all([
          // Trending: anime ongoing yang lagi populer/viral sekarang
          getAnimeList({ status: 'ongoing', pageSize: 12 }),
          // Episode Terbaru: anime yang sedang tayang / baru mulai
          getAnimeList({ sort: 'new', status: 'ongoing', pageSize: 12 }),
        ]);

        if (isMounted) {
          if (trendingRes.data.length > 0) {
            setTrending(trendingRes.data);
            setFeatured(trendingRes.data[0]);
          }
          if (latestRes.data.length > 0) {
            setNewUpdate(latestRes.data);
          }
        }
      } catch (err) {
        console.warn('[Home] Gagal mengambil data live AniList:', err);
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

