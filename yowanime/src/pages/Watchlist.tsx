import { Link } from 'react-router-dom';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useAuthStore } from '@/store/useAuthStore';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { Button } from '@/components/ui/Button';

/**
 * Watchlist / My List page — saved anime grid.
 * Shows empty state if not logged in or no saved anime.
 */
export default function Watchlist() {
  const { isAuthenticated } = useAuthStore();
  const { watchlistAnimes, count } = useWatchlist();

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="page-enter pt-20 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="display-sm text-ink mb-2">Watchlist</h1>
        <p className="text-body text-sm font-display mb-5 max-w-xs">
          Masuk ke akunmu untuk menyimpan anime favorit dan mengaksesnya kapan saja.
        </p>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="primary" size="lg">Masuk</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="lg">Daftar</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter pt-20 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="mb-6">
          <span className="eyebrow-mono text-mute block mb-1">MY LIST</span>
          <h1 className="display-md text-ink">Watchlist</h1>
          <p className="text-body text-sm font-display mt-1">
            {count > 0 ? `${count} anime tersimpan` : 'Belum ada anime tersimpan'}
          </p>
        </div>

        {/* Anime grid or empty state */}
        {count > 0 ? (
          <AnimeGrid animes={watchlistAnimes} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-body text-sm font-display mb-1">Watchlist kamu masih kosong</p>
            <p className="text-mute text-xs font-display mb-5">
              Klik ikon bookmark di anime card untuk menambahkan
            </p>
            <Link to="/anime">
              <Button variant="outline">Jelajahi Anime</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
