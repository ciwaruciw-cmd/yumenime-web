import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useWatchlistStore } from '@/store/useWatchlistStore';
import { useHistoryStore } from '@/store/useHistoryStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { searchAnime } from '@/services/animeService';
import { useDebounce } from '@/hooks/useDebounce';
import { isAdminEmail, syncAdminEmailsFromServer } from '@/config/adminConfig';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import type { Anime } from '@/types/anime';

/**
 * Sticky navbar — canvas bg, pill search, hamburger on mobile.
 * Follows xAI nav-bar spec: canvas bg, body-sm typography, translucent pills.
 */
export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { isAuthenticated, user, logout } = useAuthStore();
  const { animeIds } = useWatchlistStore();
  const { history } = useHistoryStore();
  const { notifications, unreadCount, markRead, markAllRead, removeNotification, clearAll } = useNotificationStore();
  const notifUnreadCount = unreadCount();

  const debouncedSearch = useDebounce(searchQuery, 300);
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true || isAdminEmail(user?.email);

  useEffect(() => {
    syncAdminEmailsFromServer();
  }, []);

  // Detect scroll for navbar transparency with requestAnimationFrame throttle
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Live search
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setSearchResults([]);
      return;
    }
    searchAnime(debouncedSearch).then(setSearchResults).catch(console.error);
  }, [debouncedSearch]);

  // Close dropdowns on outside click — single listener for both
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLinks = [
    { to: '/anime', label: 'Anime' },
    { to: '/genre', label: 'Genres' },
    { to: '/schedule', label: 'Schedule' },
  ];

  const handleSearchSelect = (slug: string) => {
    setSearchQuery('');
    setSearchOpen(false);
    navigate(`/anime/${slug}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-40 transition-colors duration-200',
        scrolled
          ? 'bg-canvas md:bg-canvas/95 md:backdrop-blur-md border-b border-hairline shadow-sm'
          : 'bg-canvas border-b border-hairline/40'
      )}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center gap-3 sm:gap-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center shrink-0 group"
          aria-label="Yumenime home"
        >
          <span className="text-ink font-display text-sm tracking-tight font-medium group-hover:text-sunset transition-colors">
            YUMENIME
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                clsx(
                  'text-sm font-display px-3 py-1.5 rounded-full transition-colors duration-150',
                  isActive
                    ? 'text-ink bg-white/10'
                    : 'text-body-mid hover:text-ink hover:bg-white/5'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search bar */}
        <div ref={searchRef} className="relative hidden sm:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex items-center bg-canvas-soft border border-hairline rounded-full px-3 h-8 gap-2 w-52 lg:w-64 focus-within:border-white/30 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mute shrink-0" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                className="bg-transparent text-ink text-sm font-display placeholder:text-mute outline-none w-full"
                aria-label="Search anime"
                id="navbar-search"
              />
            </div>
          </form>

          {/* Search dropdown */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-canvas-soft border border-hairline rounded-[8px] overflow-hidden shadow-2xl z-50">
              {searchResults.slice(0, 5).map((anime) => (
                <button
                  key={anime.id}
                  onClick={() => handleSearchSelect(anime.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                >
                  <img
                    src={anime.poster}
                    alt={anime.title}
                    className="w-8 h-12 object-cover rounded"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-ink font-display truncate">{anime.title}</p>
                    <p className="text-[10px] text-mute font-mono uppercase tracking-wider">{anime.year} · {anime.type}</p>
                  </div>
                </button>
              ))}
              <Link
                to={`/search?q=${encodeURIComponent(searchQuery)}`}
                onClick={() => setSearchOpen(false)}
                className="block text-center text-xs text-mute py-2 hover:text-body border-t border-hairline transition-colors"
              >
                View all results →
              </Link>
            </div>
          )}
        </div>

        {/* Auth area (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Link to="/history" className="relative" title="Watch History">
                <Button variant="ghost" size="sm" aria-label={`Watch History (${history.length})`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-canvas-mid text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-mono border border-hairline">
                      {history.length > 99 ? '99+' : history.length}
                    </span>
                  )}
                </Button>
              </Link>

              <Link to="/watchlist" className="relative">
                <Button variant="ghost" size="sm" aria-label={`Watchlist (${animeIds.length})`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {animeIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-sunset text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-mono">
                      {animeIds.length}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Profile dropdown menu under avatar */}
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-white/5 border border-hairline transition-colors cursor-pointer"
                  aria-label="Profile menu"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-7 h-7 rounded-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-sunset/20 border border-sunset/40 flex items-center justify-center text-sunset text-[11px] font-mono font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-ink font-display pr-1">{user.username}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mute mr-1">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-canvas-soft border border-hairline rounded-[8px] p-2 shadow-2xl z-50 animate-fade-in-up">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block px-3 py-2 border-b border-hairline mb-1 hover:bg-white/5 rounded-[6px] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-display text-ink font-medium">{user.username}</p>
                        {isAdmin && (
                          <span className="text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded-full">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-mute font-mono truncate">{user.email}</p>
                      <span className="text-[10px] text-sunset font-display hover:underline block mt-0.5">View Profile →</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-body hover:text-ink hover:bg-white/5 rounded-[6px] transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      My Profile
                    </Link>

                    <Link
                      to="/watchlist"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs text-body hover:text-ink hover:bg-white/5 rounded-[6px] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        My Watchlist
                      </span>
                      <span className="bg-canvas-mid text-ink font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                        {animeIds.length}
                      </span>
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs text-body hover:text-ink hover:bg-white/5 rounded-[6px] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Watch History
                      </span>
                      {history.length > 0 && (
                        <span className="bg-canvas-mid text-ink font-mono text-[10px] px-1.5 py-0.5 rounded-full">
                          {history.length}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/notifications"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs text-body hover:text-ink hover:bg-white/5 rounded-[6px] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Notifications
                      </span>
                      {notifUnreadCount > 0 && (
                        <span className="bg-sunset text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {notifUnreadCount}
                        </span>
                      )}
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-[6px] transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                        </svg>
                        Admin Panel
                        <span className="ml-auto text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded-full">ADMIN</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-[6px] transition-colors text-left mt-1 border-t border-hairline cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/history" className="text-mute hover:text-white transition-colors p-1.5 mr-1" title="Watch History">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </Link>
              <ThemeToggle />
              <Link to="/login">
                <Button variant="outline-sm" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls (Theme Toggle + Notification Bell + Hamburger button) */}
        <div className="flex md:hidden items-center gap-1 ml-auto">
          <ThemeToggle />
          <NotificationBell />
          <button
            className="text-body p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-canvas-soft border-t border-hairline animate-fade-in-up max-h-[calc(100vh-56px)] overflow-y-auto">
          <div className="px-6 py-4 space-y-1">
            {/* Mobile search */}
            <form onSubmit={handleSearchSubmit} className="mb-3">
              <div className="flex items-center bg-canvas border border-hairline rounded-full px-3 h-9 gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mute shrink-0">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  placeholder="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-ink text-sm placeholder:text-mute outline-none w-full"
                />
              </div>
            </form>

            {/* Nav links */}
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    'block text-sm font-display px-3 py-2 rounded-[8px] transition-colors',
                    isActive ? 'text-ink bg-white/10' : 'text-body hover:text-ink hover:bg-white/5'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <hr className="border-hairline my-2" />

            {/* Theme switcher */}
            <div className="flex items-center justify-between px-3 py-2 bg-canvas-soft/80 border border-hairline rounded-[8px] my-1">
              <span className="text-xs font-display text-mute">Tampilan Tema</span>
              <ThemeToggle variant="compact" />
            </div>

            {/* Notifications inside Mobile Menu */}
            <Link
              to="/notifications"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm font-display text-body hover:text-ink hover:bg-white/5 rounded-[8px] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mute">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Notifications
              </span>
              {notifUnreadCount > 0 && (
                <span className="bg-sunset text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {notifUnreadCount} new
                </span>
              )}
            </Link>

            {/* Watchlist inside Mobile Menu */}
            <Link
              to="/watchlist"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm font-display text-body hover:text-ink hover:bg-white/5 rounded-[8px] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mute">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                My Watchlist
              </span>
              {animeIds.length > 0 && (
                <span className="bg-sunset text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {animeIds.length}
                </span>
              )}
            </Link>

            {/* Watch History inside Mobile Menu */}
            <Link
              to="/history"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm font-display text-body hover:text-ink hover:bg-white/5 rounded-[8px] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-mute">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Watch History
              </span>
              {history.length > 0 && (
                <span className="bg-canvas-card text-body-mid font-mono text-[10px] px-2 py-0.5 rounded-full font-bold border border-hairline">
                  {history.length}
                </span>
              )}
            </Link>

            <hr className="border-hairline my-2" />

            {/* User section */}
            {isAuthenticated && user ? (
              <div className="space-y-1">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-[8px] hover:bg-white/5 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-8 h-8 rounded-full border border-hairline object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-sunset/20 border border-sunset/40 flex items-center justify-center text-sunset text-[12px] font-mono font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-ink font-medium">{user.username}</p>
                    <p className="text-[10px] text-sunset">View Profile →</p>
                  </div>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-[8px] transition-colors"
                  >
                    <span>Admin Panel</span>
                    <span className="text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded-full">ADMIN</span>
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 text-left text-xs text-red-400 px-3 py-2 hover:bg-red-500/10 rounded-[8px] transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1">
                  <Button variant="outline" size="md" fullWidth>Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1">
                  <Button variant="primary" size="md" fullWidth>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
