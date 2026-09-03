import { Link } from 'react-router-dom';
import { getAllGenres } from '@/data/mockAnime';

/**
 * Footer — canvas bg, body text, grid layout.
 * Follows xAI footer spec: canvas bg, body color, body-sm typography.
 */
export function Footer() {
  const genres = getAllGenres().slice(0, 9); // show top genres
  const currentYear = new Date().getFullYear();

  const navigation = [
    { label: 'Home', to: '/' },
    { label: 'Anime List', to: '/anime' },
    { label: 'Genres', to: '/genre' },
    { label: 'Schedule', to: '/schedule' },
    { label: 'Watchlist', to: '/watchlist' },
  ];

  const legal = [
    { label: 'About Us', to: '#' },
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms & Conditions', to: '#' },
    { label: 'DMCA', to: '#' },
    { label: 'Contact', to: '#' },
  ];

  return (
    <footer className="bg-canvas border-t border-hairline mt-16">
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center mb-4 group inline-flex">
              <span className="text-ink font-display text-sm font-medium tracking-tight group-hover:text-sunset transition-colors">
                YUMENIME
              </span>
            </Link>
            <p className="text-body-mid text-xs font-display leading-relaxed max-w-[200px]">
              The premier platform for streaming anime online in HD quality.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="eyebrow-mono text-mute mb-3">Navigation</p>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-body text-sm font-display hover:text-ink transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genre */}
          <div>
            <p className="eyebrow-mono text-mute mb-3">Genres</p>
            <ul className="space-y-2">
              {genres.map((genre) => (
                <li key={genre}>
                  <Link
                    to={`/anime?genre=${encodeURIComponent(genre)}`}
                    className="text-body text-sm font-display hover:text-ink transition-colors"
                  >
                    {genre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="eyebrow-mono text-mute mb-3">Legal</p>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-body text-sm font-display hover:text-ink transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="hairline pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-mute text-xs font-mono">
            © {currentYear} YUMENIME. ALL RIGHTS RESERVED.
          </p>
          <p className="text-mute text-xs font-display">
            Built for anime fans worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
