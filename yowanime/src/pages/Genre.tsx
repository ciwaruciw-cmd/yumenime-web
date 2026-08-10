import { Link } from 'react-router-dom';

/**
 * Genre list page — all genres as pill cards.
 * Genre list now uses Otakudesu genre slugs for navigation.
 */

const GENRES = [
  { name: 'Action', slug: 'action' },
  { name: 'Adventure', slug: 'adventure' },
  { name: 'Comedy', slug: 'comedy' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Horror', slug: 'horror' },
  { name: 'Isekai', slug: 'isekai' },
  { name: 'Mecha', slug: 'mecha' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Romance', slug: 'romance' },
  { name: 'Sci-Fi', slug: 'sci-fi' },
  { name: 'Seinen', slug: 'seinen' },
  { name: 'Shounen', slug: 'shounen' },
  { name: 'Shoujo', slug: 'shoujo' },
  { name: 'Slice of Life', slug: 'slice-of-life' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Supernatural', slug: 'supernatural' },
  { name: 'Thriller', slug: 'thriller' },
  { name: 'Music', slug: 'music' },
  { name: 'Psychological', slug: 'psychological' },
  { name: 'Yuri', slug: 'yuri' },
  { name: 'Ecchi', slug: 'ecchi' },
  { name: 'Hentai', slug: 'hentai' },
];

const genreAccent = (name: string): string => {
  const map: Record<string, string> = {
    Action: 'border-l-sunset',
    Adventure: 'border-l-breeze',
    Comedy: 'border-l-sunset-soft',
    Drama: 'border-l-twilight',
    Fantasy: 'border-l-dusk',
    Horror: 'border-l-red-500',
    Isekai: 'border-l-breeze',
    Mecha: 'border-l-canvas-mid',
    Mystery: 'border-l-dusk',
    Romance: 'border-l-pink-400',
    'Sci-Fi': 'border-l-breeze',
    Seinen: 'border-l-canvas-mid',
    Shounen: 'border-l-sunset',
    Shoujo: 'border-l-pink-400',
    'Slice of Life': 'border-l-green-400',
    Sports: 'border-l-breeze',
    Supernatural: 'border-l-twilight',
    Thriller: 'border-l-red-400',
    Music: 'border-l-sunset-soft',
    Psychological: 'border-l-dusk',
    Yuri: 'border-l-pink-400',
    Ecchi: 'border-l-rose-500',
    Hentai: 'border-l-red-600',
  };
  return map[name] ?? 'border-l-hairline';
};

export default function Genre() {
  return (
    <div className="page-enter pt-20 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <span className="eyebrow-mono text-mute block mb-1">BROWSE</span>
          <h1 className="display-md text-ink">Semua Genre</h1>
          <p className="text-body text-sm font-display mt-2">
            Jelajahi anime berdasarkan genre favoritmu
          </p>
        </div>

        {/* Genre grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {GENRES.map(({ name, slug }) => (
            <Link
              key={name}
              to={`/anime?genre=${encodeURIComponent(name)}`}
              className="group bg-canvas-card rounded-[8px] p-5 hover:bg-canvas-soft transition-all duration-200"
            >
              <h2 className="text-sm font-display text-ink group-hover:text-ink mb-1">
                {name}
              </h2>
              <p className="text-[10px] font-mono text-mute uppercase tracking-wider">
                {slug}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
