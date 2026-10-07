import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore, type NotifType } from '@/store/useNotificationStore';
import { fetchAniListList } from '@/services/anilistService';
import { isAdminEmail, addAdminEmail, removeAdminEmail, syncAdminEmailsFromServer } from '@/config/adminConfig';
import { apiFetch } from '@/services/api';
import type { Anime, AnimeGenre } from '@/types/anime';

const STAT_GENRES: AnimeGenre[] = ['Action', 'Romance', 'Fantasy', 'Comedy', 'Horror'];

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: string }) {
  return (
    <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-5 flex items-start gap-3 sm:gap-4 hover:border-white/20 transition-all duration-200 min-w-0">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[8px] flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl sm:text-2xl font-display text-ink font-semibold truncate">{value}</p>
        <p className="text-[10px] sm:text-xs text-mute font-mono uppercase tracking-wider mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

function AnimeRow({ anime, rank }: { anime: Anime; rank: number }) {
  return (
    <Link
      to={`/anime/${anime.slug || anime.id}`}
      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-white/5 rounded-[8px] transition-colors group min-w-0"
    >
      <span className="text-xs font-mono text-mute w-5 text-center shrink-0 group-hover:text-sunset font-bold">
        {rank}
      </span>
      <img
        src={anime.poster}
        alt={anime.title}
        className="w-8 h-11 sm:w-9 sm:h-12 object-cover rounded-[4px] shrink-0 border border-hairline"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-display text-ink group-hover:text-sunset transition-colors truncate font-medium">
          {anime.title}
        </p>
        <p className="text-[10px] text-mute font-mono uppercase tracking-wider truncate">
          {anime.genres?.slice(0, 2).join(' · ')} · {anime.year}
        </p>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-1 justify-end">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#ff7a17" stroke="#ff7a17">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="text-xs font-mono text-ink font-semibold">{anime.score ? anime.score.toFixed(1) : '8.5'}</span>
        </div>
        <p className="text-[10px] text-mute font-mono">{anime.type}</p>
      </div>
    </Link>
  );
}

type TabKey = 'dashboard' | 'anime' | 'genre' | 'scraper' | 'notif' | 'config';

export function Admin() {
  const { user, token, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [popularAnime, setPopularAnime] = useState<Anime[]>([]);
  const [totalAnimeCount, setTotalAnimeCount] = useState<number>(0);
  const [genreData, setGenreData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Admin emails management state
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification compose state
  const { pushNotification, fetchNotifications, notifications, clearAll } = useNotificationStore();
  const [notifType, setNotifType] = useState<NotifType>('info');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSent, setNotifSent] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);

  // Auto-Scraper management state
  const [scraperStatus, setScraperStatus] = useState<{
    isRunning?: boolean;
    lastRun?: string | null;
    lastSuccess?: string | null;
    lastError?: string | null;
    totalRuns?: number;
    totalSuccess?: number;
    nextScheduled?: string | null;
    lastDuration?: string;
  } | null>(null);
  const [scrapingInProgress, setScrapingInProgress] = useState(false);
  const [scraperMsg, setScraperMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchScraperStatus = async () => {
    try {
      const res = await apiFetch<any>('/api/admin/scraper/status', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(user?.email ? { 'x-admin-email': user.email } : {}),
        },
      });
      setScraperStatus(res);
    } catch (err: any) {
      console.warn('Failed to fetch scraper status:', err);
    }
  };

  const handleTriggerScrape = async (source: 'all' | 'nekopoi' | 'quick' = 'all') => {
    setScrapingInProgress(true);
    setScraperMsg(null);
    const labels: Record<string, string> = {
      all: 'Full (Incremental)',
      quick: 'Cepat (Otakudesu only)',
      nekopoi: 'Nekopoi',
    };
    try {
      await apiFetch<any>('/api/admin/scraper/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(user?.email ? { 'x-admin-email': user.email } : {}),
        },
        body: JSON.stringify({ source, adminEmail: user?.email }),
      });
      setScraperMsg({ type: 'success', text: `Scrape [${labels[source] || source}] berhasil dimulai di background! Status akan diupdate otomatis.` });
      setTimeout(fetchScraperStatus, 1500);
    } catch (err: any) {
      setScraperMsg({ type: 'error', text: `Gagal memicu scrape: ${err.message || 'Error'}` });
    } finally {
      setTimeout(() => setScrapingInProgress(false), 3000);
    }
  };

  const handleResetScraperStatus = async () => {
    try {
      await apiFetch<any>('/api/admin/scraper/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(user?.email ? { 'x-admin-email': user.email } : {}),
        },
        body: JSON.stringify({ adminEmail: user?.email }),
      });
      setScraperMsg({ type: 'success', text: 'Status scraper berhasil di-reset ke IDLE / STANDBY.' });
      fetchScraperStatus();
    } catch (err: any) {
      setScraperMsg({ type: 'error', text: `Gagal me-reset status: ${err.message || 'Error'}` });
    }
  };

  const isServerAdmin = isAuthenticated && (user?.role === 'admin' || user?.isAdmin === true || isAdminEmail(user?.email));

  useEffect(() => {
    if (isServerAdmin) {
      fetchNotifications();
      syncAdminEmailsFromServer(token || undefined).then(setAdminEmails);
      fetchScraperStatus();
    }
  }, [fetchNotifications, isServerAdmin, token]);

  // Auto-poll status saat sedang di tab scraper
  useEffect(() => {
    if (!isServerAdmin || tab !== 'scraper') return;
    fetchScraperStatus();
    const interval = setInterval(fetchScraperStatus, 3000);
    return () => clearInterval(interval);
  }, [isServerAdmin, tab]);

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setSendingNotif(true);
    await pushNotification({ type: notifType, title: notifTitle.trim(), message: notifMessage.trim() });
    setNotifTitle('');
    setNotifMessage('');
    setSendingNotif(false);
    setNotifSent(true);
    setTimeout(() => setNotifSent(false), 3000);
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    const res = addAdminEmail(newAdminEmail, token || undefined);
    if (res.success) {
      setAdminEmails(res.emails);
      setNewAdminEmail('');
      setAdminMsg({ type: 'success', text: res.message });
    } else {
      setAdminMsg({ type: 'error', text: res.message });
    }
  };

  const handleRemoveAdmin = (email: string) => {
    if (confirm(`Are you sure you want to remove ${email} from the Admin list?`)) {
      const res = removeAdminEmail(email, token || undefined);
      if (res.success) {
        setAdminEmails(res.emails);
        setAdminMsg({ type: 'success', text: res.message });
      } else {
        setAdminMsg({ type: 'error', text: res.message });
      }
    }
  };

  useEffect(() => {
    if (!isServerAdmin) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: popular, total } = await fetchAniListList({ sort: 'popular', page: 1, pageSize: 10 });
        setPopularAnime(popular);
        setTotalAnimeCount(total);

        const counts: Record<string, number> = {};
        await Promise.all(
          STAT_GENRES.map(async (g) => {
            const { total: genreTotal } = await fetchAniListList({ genre: g, page: 1, pageSize: 1 });
            counts[g] = genreTotal;
          })
        );
        setGenreData(counts);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isServerAdmin]);

  // Redirect non-admins
  if (!isServerAdmin) {
    return <Navigate to="/" replace />;
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    {
      key: 'anime',
      label: 'Top Anime',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: 'genre',
      label: 'Genre Stats',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: 'scraper',
      label: 'Auto Scraper',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
        </svg>
      ),
    },
    {
      key: 'notif',
      label: 'Notifications',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: 'config',
      label: 'Admin Emails',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  const maxGenreCount = Math.max(...Object.values(genreData), 1);

  return (
    <div className="page-enter pt-12 sm:pt-14 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-12">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="eyebrow-mono text-mute block mb-1">ADMIN PANEL</span>
            <h1 className="text-xl sm:text-2xl font-display font-semibold text-ink">Admin Dashboard</h1>
            <p className="text-body text-xs sm:text-sm font-display mt-0.5">
              Welcome, <span className="text-sunset font-medium">{user!.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-canvas-card border border-hairline rounded-[8px] px-3 py-1.5 self-start">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-mute font-mono font-medium">STATUS: ADMIN ACTIVE</span>
          </div>
        </div>

        {/* Tabs Bar (Mobile friendly horizontal scroll) */}
        <div className="flex gap-1.5 mb-6 bg-canvas-card border border-hairline rounded-[10px] p-1.5 overflow-x-auto max-w-full no-scrollbar whitespace-nowrap">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-[7px] text-xs sm:text-sm font-display transition-all shrink-0 cursor-pointer ${
                tab === key
                  ? 'bg-white/10 text-ink font-medium shadow-sm'
                  : 'text-mute hover:text-body hover:bg-white/5'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {tab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Total Anime"
                value={loading ? '...' : totalAnimeCount.toLocaleString('en-US')}
                accent="bg-sunset/20"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
              <StatCard
                label="Genres Indexed"
                value={STAT_GENRES.length}
                accent="bg-sky-500/20"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
              <StatCard
                label="Active Admins"
                value={adminEmails.length}
                accent="bg-purple-500/20"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
              <StatCard
                label="Backend API"
                value="AniList Live"
                accent="bg-green-500/20"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
            </div>

            {/* Quick overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top anime preview */}
              <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-display text-ink font-semibold">Most Popular Anime</h2>
                  <button onClick={() => setTab('anime')} className="text-xs text-sunset hover:underline font-mono">
                    View All →
                  </button>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-12 bg-canvas-soft rounded-[8px] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-hairline">
                    {popularAnime.slice(0, 5).map((anime, i) => (
                      <AnimeRow key={anime.id} anime={anime} rank={i + 1} />
                    ))}
                  </div>
                )}
              </div>

              {/* Genre distribution */}
              <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-display text-ink font-semibold">Genre Distribution</h2>
                  <button onClick={() => setTab('genre')} className="text-xs text-sunset hover:underline font-mono">
                    Genre Details →
                  </button>
                </div>
                <div className="space-y-4">
                  {STAT_GENRES.map((g) => {
                    const count = genreData[g] ?? 0;
                    const pct = Math.round((count / maxGenreCount) * 100);
                    return (
                      <div key={g}>
                        <div className="flex justify-between text-xs font-display mb-1.5">
                          <span className="text-ink font-medium">{g}</span>
                          <span className="text-mute font-mono">{loading ? '...' : `${count.toLocaleString('en-US')} anime`}</span>
                        </div>
                        <div className="h-2 bg-canvas-soft rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sunset rounded-full transition-all duration-500"
                            style={{ width: loading ? '0%' : `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TOP ANIME TAB ── */}
        {tab === 'anime' && (
          <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6 animate-fade-in-up min-w-0">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-display text-ink font-semibold">Top 10 Most Popular Anime</h2>
                <p className="text-xs text-mute font-display mt-0.5">Live sync directly from AniList GraphQL API</p>
              </div>
              <span className="text-xs text-mute font-mono">10 items</span>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-14 bg-canvas-soft rounded-[8px] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {popularAnime.map((anime, i) => (
                  <AnimeRow key={anime.id} anime={anime} rank={i + 1} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── GENRE TAB ── */}
        {tab === 'genre' && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STAT_GENRES.map((g) => {
                const count = genreData[g] ?? 0;
                const pct = Math.round((count / maxGenreCount) * 100);
                return (
                  <Link
                    key={g}
                    to={`/anime?genre=${encodeURIComponent(g)}`}
                    className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-5 hover:border-sunset/50 transition-colors block group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-display text-ink font-medium group-hover:text-sunset transition-colors">{g}</h3>
                      <span className="text-[10px] font-mono text-mute bg-canvas-soft px-2 py-0.5 rounded-full">
                        {loading ? '...' : count} anime
                      </span>
                    </div>
                    <div className="h-1.5 bg-canvas-soft rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sunset rounded-full transition-all duration-700"
                        style={{ width: loading ? '0%' : `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-mute font-mono mt-2">{pct}% of maximum genre share</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── AUTO SCRAPER TAB ── */}
        {tab === 'scraper' && (
          <div className="animate-fade-in-up space-y-6">
            {/* Scraper Status Overview */}
            <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-display text-ink font-semibold">Auto-Scraper Daemon</h2>
                    {scraperStatus?.isRunning ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        RUNNING
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        IDLE / STANDBY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mute font-display">
                    Scraping otomatis dari Otakudesu, Samehadaku, &amp; Sokuja setiap 6 jam via Node.js daemon.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchScraperStatus}
                    className="text-xs font-display text-mute hover:text-ink border border-hairline px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>
                    Refresh
                  </button>

                  <button
                    onClick={handleResetScraperStatus}
                    title="Reset paksa status scraper jika macet atau tertinggal dalam mode Running"
                    className="text-xs font-display text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 bg-red-500/10 px-3 py-1.5 rounded-full hover:bg-red-500/20 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Reset Status
                  </button>
                </div>
              </div>

              {/* Toast Message */}
              {scraperMsg && (
                <div
                  className={`p-3 rounded-[8px] text-xs font-display mb-4 flex items-center justify-between ${
                    scraperMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  <span>{scraperMsg.text}</span>
                  <button onClick={() => setScraperMsg(null)} className="cursor-pointer font-bold">✕</button>
                </div>
              )}

              {/* Status Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-canvas-soft border border-hairline rounded-[8px] p-3.5">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-1">Status Daemon</span>
                  <p className="text-sm font-display font-semibold text-ink">
                    {scraperStatus?.isRunning ? (
                      <span className="text-amber-400">Sedang Scrape...</span>
                    ) : (
                      <span className="text-emerald-400">Aktif (Siap)</span>
                    )}
                  </p>
                </div>

                <div className="bg-canvas-soft border border-hairline rounded-[8px] p-3.5">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-1">Terakhir Sukses</span>
                  <p className="text-sm font-display font-semibold text-ink truncate">
                    {scraperStatus?.lastSuccess ? new Date(scraperStatus.lastSuccess).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Belum pernah'}
                  </p>
                </div>

                <div className="bg-canvas-soft border border-hairline rounded-[8px] p-3.5">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-1">Durasi Terakhir</span>
                  <p className="text-sm font-display font-semibold text-ink truncate">
                    {scraperStatus?.lastDuration || (scraperStatus?.isRunning ? 'Berjalan...' : '-')}
                  </p>
                </div>

                <div className="bg-canvas-soft border border-hairline rounded-[8px] p-3.5">
                  <span className="text-[10px] font-mono text-mute uppercase tracking-wider block mb-1">Total Sukses / Run</span>
                  <p className="text-sm font-display font-semibold text-ink">
                    {scraperStatus?.totalSuccess ?? 0} / {scraperStatus?.totalRuns ?? 0}
                  </p>
                </div>
              </div>

              {/* Manual Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleTriggerScrape('all')}
                  disabled={scrapingInProgress || scraperStatus?.isRunning}
                  className="bg-sunset hover:bg-sunset/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-display font-medium px-4 py-2.5 rounded-[8px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-sunset/10"
                >
                  {scrapingInProgress ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memulai Scrape...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Scrape Semua Sumber
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerScrape('quick')}
                  disabled={scrapingInProgress || scraperStatus?.isRunning}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-400 text-xs font-display font-medium px-4 py-2.5 rounded-[8px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  title="Hanya scrape Otakudesu, lebih cepat (~2 menit)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Scrape Cepat (Otakudesu)
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerScrape('nekopoi')}
                  disabled={scrapingInProgress || scraperStatus?.isRunning}
                  className="bg-canvas-soft hover:bg-white/10 border border-hairline disabled:opacity-40 disabled:cursor-not-allowed text-ink text-xs font-display font-medium px-4 py-2.5 rounded-[8px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                  </svg>
                  Scrape Nekopoi
                </button>

                {scraperStatus?.isRunning && (
                  <button
                    type="button"
                    onClick={handleResetScraperStatus}
                    className="bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-display font-medium px-4 py-2.5 rounded-[8px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    Hentikan / Reset Status
                  </button>
                )}
              </div>

              {scraperStatus?.lastError ? (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-[8px] text-xs font-mono text-red-400">
                  <span className="font-bold">Error Terakhir: </span>{scraperStatus.lastError}
                </div>
              ) : scraperStatus && !scraperStatus.isRunning && (
                <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-[8px] text-xs font-mono text-emerald-400/70">
                  <span className="font-bold">✓ </span>Tidak ada error. Scraper berjalan normal.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONFIG TAB (ADMIN EMAIL) ── */}
        {tab === 'config' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="text-sm font-display text-ink font-semibold mb-1">Admin Email Management</h2>
                <p className="text-xs text-mute font-display">
                  Add or remove emails with full access permissions to the Admin Panel (synced across devices).
                </p>
              </div>

              {/* Toast / Alert Notification */}
              {adminMsg && (
                <div
                  className={`p-3 rounded-[8px] text-xs font-display flex items-center justify-between transition-all ${
                    adminMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}
                >
                  <span>{adminMsg.text}</span>
                  <button
                    onClick={() => setAdminMsg(null)}
                    className="text-mute hover:text-ink transition-colors ml-2 cursor-pointer font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Form Tambah Admin */}
              <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  placeholder="Enter new admin email (e.g. user@gmail.com)..."
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 bg-canvas-soft border border-hairline rounded-[8px] px-3.5 py-2.5 text-xs font-mono text-ink placeholder:text-mute outline-none focus:border-sunset transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="bg-white text-black font-display font-medium text-xs px-4 py-2.5 rounded-[8px] hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Admin
                </button>
              </form>

              {/* Daftar Email Admin */}
              <div className="space-y-2 pt-2">
                {adminEmails.map((email) => (
                  <div
                    key={email}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-canvas-soft border border-hairline rounded-[8px] p-3.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-mono text-ink truncate">{email}</span>
                      {email.toLowerCase() === user?.email?.toLowerCase() && (
                        <span className="text-[9px] font-mono text-sunset border border-sunset/40 bg-sunset/10 rounded-full px-2 py-0.5 shrink-0">
                          YOUR ACCOUNT
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveAdmin(email)}
                      disabled={adminEmails.length <= 1}
                      className="text-xs font-mono text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/20 hover:border-red-500/50 bg-red-500/10 rounded-[6px] px-3 py-1.5 transition-all cursor-pointer self-end sm:self-auto"
                      title={adminEmails.length <= 1 ? 'Must have at least 1 Admin' : 'Remove Admin'}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFIKASI TAB ── */}
        {tab === 'notif' && (
          <div className="animate-fade-in-up space-y-6">
            {/* Compose Form */}
            <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6">
              <h2 className="text-sm font-display text-ink font-semibold mb-1">Broadcast Global Announcement</h2>
              <p className="text-xs text-mute font-display mb-5">Notifications will appear instantly in the notification bell for all active users.</p>

              <form onSubmit={handleSendNotif} className="space-y-4">
                {/* Type selector */}
                <div>
                  <label className="eyebrow-mono text-mute text-[10px] tracking-wider block mb-2">ANNOUNCEMENT TYPE</label>
                  <div className="flex gap-2 flex-wrap">
                    {(([
                      { v: 'info', label: 'Info', color: 'text-sunset border-sunset/40 bg-sunset/10' },
                      { v: 'update', label: 'Update', color: 'text-white border-white/40 bg-white/10' },
                      { v: 'success', label: 'Success', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
                      { v: 'warning', label: 'Warning', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
                    ]) as { v: NotifType; label: string; color: string }[]).map(({ v, label, color }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setNotifType(v)}
                        className={`text-xs font-display px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          notifType === v ? color : 'text-mute border-hairline hover:bg-white/5'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="notif-title" className="eyebrow-mono text-mute text-[10px] tracking-wider block mb-2">TITLE</label>
                  <input
                    id="notif-title"
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Example: New episode released!"
                    maxLength={80}
                    className="w-full bg-canvas-soft border border-hairline focus:border-white/30 rounded-[8px] px-3.5 py-2.5 text-xs sm:text-sm text-ink font-display placeholder:text-mute outline-none transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="notif-message" className="eyebrow-mono text-mute text-[10px] tracking-wider block mb-2">MESSAGE</label>
                  <textarea
                    id="notif-message"
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Write announcement message..."
                    maxLength={300}
                    rows={3}
                    className="w-full bg-canvas-soft border border-hairline focus:border-white/30 rounded-[8px] px-3.5 py-2.5 text-xs sm:text-sm text-ink font-display placeholder:text-mute outline-none transition-colors resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-mute font-mono text-right mt-1">{notifMessage.length}/300</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={!notifTitle.trim() || !notifMessage.trim() || sendingNotif}
                    className="inline-flex items-center gap-2 bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed font-display font-medium text-xs px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-lg"
                  >
                    {sendingNotif ? (
                      <>
                        <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Send Notification
                      </>
                    )}
                  </button>
                  {notifSent && (
                    <span className="text-xs text-emerald-400 font-display flex items-center gap-1.5 animate-[fadeIn_0.2s_ease-out]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Notification sent!
                    </span>
                  )}
                </div>
              </form>
            </div>

            {/* Notif History */}
            <div className="bg-canvas-card border border-hairline rounded-[12px] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-display text-ink font-semibold">Notification History ({notifications.length})</h2>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-red-400 hover:text-red-300 font-display border border-red-500/30 hover:bg-red-500/10 px-3 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-xs text-mute font-display text-center py-8">No announcements sent yet.</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 bg-canvas-soft border border-hairline rounded-[8px] p-3 sm:p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                            n.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            n.type === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            n.type === 'update'  ? 'bg-white/10 text-white border-white/20' :
                            'bg-sunset/10 text-sunset border-sunset/30'
                          }`}>{n.type}</span>
                          <span className="text-xs text-ink font-display font-medium">{n.title}</span>
                        </div>
                        <p className="text-xs text-mute font-display leading-relaxed break-words">{n.message}</p>
                        <p className="text-[10px] text-mute/60 font-mono mt-1">{new Date(n.createdAt).toLocaleString('en-US')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Admin;
