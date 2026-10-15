import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Mobile Bottom Navigation Bar (Crunchyroll Style).
 * Tabs: Home, My Lists, Browse, Simulcasts, Account.
 * Colors: Pure black bg (#000000 / #0c0c0e), vibrant Crunchyroll orange (#ff640a) for active state.
 */
export function BottomNav() {
  const { animeIds } = useWatchlistStore();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#000000]/98 backdrop-blur-md border-t border-[#1a1a1c] h-16 flex items-center justify-around px-1 safe-area-bottom transform-gpu"
      aria-label="Mobile navigation"
    >
      {/* 1. Home */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors cursor-pointer',
            isActive ? 'text-[#ff640a]' : 'text-[#8c8c94] hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isActive ? '2.4' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4.5a1 1 0 01-1-1v-4.5a1 1 0 00-1-1h-3a1 1 0 00-1 1V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z" />
            </svg>
            <span className="text-[10px] font-sans font-semibold tracking-tight">Home</span>
          </>
        )}
      </NavLink>

      {/* 2. My Lists */}
      <NavLink
        to="/watchlist"
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors relative cursor-pointer',
            isActive ? 'text-[#ff640a]' : 'text-[#8c8c94] hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={isActive ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={isActive ? '2.2' : '2'}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
              {animeIds.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#ff640a] text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                  {animeIds.length > 9 ? '9+' : animeIds.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-sans font-semibold tracking-tight">My Lists</span>
          </>
        )}
      </NavLink>

      {/* 3. Browse */}
      <NavLink
        to="/browse"
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors cursor-pointer',
            isActive ? 'text-[#ff640a]' : 'text-[#8c8c94] hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isActive ? '2.5' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span className="text-[10px] font-sans font-semibold tracking-tight">Browse</span>
          </>
        )}
      </NavLink>

      {/* 4. Simulcasts */}
      <NavLink
        to="/schedule"
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors cursor-pointer',
            isActive ? 'text-[#ff640a]' : 'text-[#8c8c94] hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={isActive ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={isActive ? '1.5' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l2.4 5.5L20 10l-4.5 3.5L17 19l-5-3.5L7 19l1.5-5.5L4 10l5.6-2.5L12 2z" />
            </svg>
            <span className="text-[10px] font-sans font-semibold tracking-tight">Simulcasts</span>
          </>
        )}
      </NavLink>

      {/* 5. Account */}
      <NavLink
        to={isAuthenticated ? '/profile' : '/login'}
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-colors cursor-pointer',
            isActive ? 'text-[#ff640a]' : 'text-[#8c8c94] hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center overflow-hidden">
              {isAuthenticated && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className={clsx(
                    'w-full h-full object-cover rounded-full border',
                    isActive ? 'border-[#ff640a]' : 'border-transparent'
                  )}
                />
              ) : (
                /* Crunchyroll signature Fox mascot icon */
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isActive ? '2.3' : '2'}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.5 9.5l3.5-6 4 3 4-3 3.5 6-2 8.5-5.5 3-5.5-3z" />
                  <circle cx="9" cy="11" r="1" fill="currentColor" />
                  <circle cx="15" cy="11" r="1" fill="currentColor" />
                  <path d="M12 15l-1-1h2z" fill="currentColor" />
                </svg>
              )}
            </div>
            <span className="text-[10px] font-sans font-semibold tracking-tight">Account</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}

