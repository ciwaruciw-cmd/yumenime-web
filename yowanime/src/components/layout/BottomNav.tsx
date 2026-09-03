import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Mobile Bottom Navigation Bar (App Bar).
 * Follows DESIGN-x.ai.md: pure near-black canvas, hairline border, sunset accents.
 * 5 Tabs: Home, Jadwal, Anime, Watchlist, Profil
 */
export function BottomNav() {
  const { animeIds } = useWatchlistStore();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/98 border-t border-hairline h-15 flex items-center justify-around px-2 safe-area-bottom transform-gpu"
      aria-label="Mobile navigation"
    >
      {/* 1. Beranda */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors relative cursor-pointer',
            isActive ? 'text-ink font-semibold' : 'text-mute hover:text-body'
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={clsx(
                'w-9 h-7 rounded-full flex items-center justify-center transition-all',
                isActive ? 'bg-white/10 text-ink' : ''
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[10px] font-display leading-none">Home</span>
          </>
        )}
      </NavLink>

      {/* 2. Jadwal */}
      <NavLink
        to="/schedule"
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors relative cursor-pointer',
            isActive ? 'text-ink font-semibold' : 'text-mute hover:text-body'
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={clsx(
                'w-9 h-7 rounded-full flex items-center justify-center transition-all',
                isActive ? 'bg-white/10 text-ink' : ''
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[10px] font-display leading-none">Schedule</span>
          </>
        )}
      </NavLink>

      {/* 3. Anime / Explore */}
      <NavLink
        to="/anime"
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors relative cursor-pointer',
            isActive ? 'text-ink font-semibold' : 'text-mute hover:text-body'
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={clsx(
                'w-9 h-7 rounded-full flex items-center justify-center transition-all',
                isActive ? 'bg-white/10 text-ink' : ''
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[10px] font-display leading-none">Anime</span>
          </>
        )}
      </NavLink>

      {/* 4. Watchlist */}
      <NavLink
        to="/watchlist"
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors relative cursor-pointer',
            isActive ? 'text-ink font-semibold' : 'text-mute hover:text-body'
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={clsx(
                'w-9 h-7 rounded-full flex items-center justify-center transition-all relative',
                isActive ? 'bg-white/10 text-ink' : ''
              )}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {animeIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-sunset text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-mono font-bold leading-none">
                  {animeIds.length > 9 ? '9+' : animeIds.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-display leading-none">Watchlist</span>
          </>
        )}
      </NavLink>

      {/* 5. Profile / Account */}
      <NavLink
        to={isAuthenticated ? '/profile' : '/login'}
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors relative cursor-pointer',
            isActive ? 'text-ink font-semibold' : 'text-mute hover:text-body'
          )
        }
      >
        {({ isActive }) => (
          <>
            <div
              className={clsx(
                'w-9 h-7 rounded-full flex items-center justify-center transition-all',
                isActive ? 'bg-white/10 text-ink' : ''
              )}
            >
              {isAuthenticated && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className={`w-5.5 h-5.5 rounded-full object-cover border ${
                    isActive ? 'border-sunset' : 'border-hairline'
                  }`}
                />
              ) : isAuthenticated && user ? (
                <div className="w-5.5 h-5.5 rounded-full bg-sunset/20 border border-sunset/40 text-sunset text-[9px] font-mono font-bold flex items-center justify-center">
                  {user.username[0].toUpperCase()}
                </div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-display leading-none">
              {isAuthenticated ? 'Profile' : 'Sign In'}
            </span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
