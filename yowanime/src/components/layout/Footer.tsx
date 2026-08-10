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
    { label: 'Beranda', to: '/' },
    { label: 'Daftar Anime', to: '/anime' },
    { label: 'Genre', to: '/genre' },
    { label: 'Jadwal', to: '/schedule' },
    { label: 'Watchlist', to: '/watchlist' },
  ];

  const legal = [
    { label: 'Tentang Kami', to: '#' },
    { label: 'Kebijakan Privasi', to: '#' },
    { label: 'Syarat & Ketentuan', to: '#' },
    { label: 'DMCA', to: '#' },
    { label: 'Kontak', to: '#' },
  ];

  return (
    <footer className="bg-canvas border-t border-hairline mt-16">
      <div className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-sunset flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-ink font-display text-sm font-medium tracking-tight">YUMENIME</span>
            </Link>
            <p className="text-body-mid text-xs font-display leading-relaxed max-w-[200px]">
              Platform streaming anime subtitle Indonesia terlengkap dan terupdate.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="eyebrow-mono text-mute mb-3">Navigasi</p>
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
            <p className="eyebrow-mono text-mute mb-3">Genre</p>
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
            Dibuat untuk pecinta anime Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
