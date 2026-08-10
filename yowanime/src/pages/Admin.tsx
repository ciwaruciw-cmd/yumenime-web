import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchAniListList } from '@/services/anilistService';
import { isAdminEmail, getAdminEmails, addAdminEmail, removeAdminEmail } from '@/config/adminConfig';
import type { Anime, AnimeGenre } from '@/types/anime';

const STAT_GENRES: AnimeGenre[] = ['Action', 'Romance', 'Fantasy', 'Comedy', 'Horror'];

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: string }) {
  return (
    <div className={`bg-canvas-card border border-hairline rounded-[12px] p-5 flex items-start gap-4 hover:border-white/20 transition-all duration-200`}>
      <div className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display text-ink font-semibold">{value}</p>
        <p className="text-xs text-mute font-mono uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function AnimeRow({ anime, rank }: { anime: Anime; rank: number }) {
  return (
    <Link
      to={`/anime/${anime.slug}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-[8px] transition-colors group"
    >
      <span className="text-sm font-mono text-mute w-5 shrink-0">{rank}</span>
      <img src={anime.poster} alt={anime.title} className="w-8 h-12 object-cover rounded-[4px] shrink-0" referrerPolicy="no-referrer" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-display text-ink truncate group-hover:text-sunset transition-colors">{anime.title}</p>
        <p className="text-[10px] text-mute font-mono uppercase">{anime.year} · {anime.type}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span className="text-[10px] text-mute font-mono">{anime.rating ?? '—'}</span>
      </div>
    </Link>
  );
}

type TabKey = 'dashboard' | 'anime' | 'genre' | 'config';

export default function Admin() {
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [popularAnime, setPopularAnime] = useState<Anime[]>([]);
  const [totalAnimeCount, setTotalAnimeCount] = useState<number>(0);
  const [genreData, setGenreData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Admin emails management state
  const [adminEmails, setAdminEmails] = useState<string[]>(() => getAdminEmails());
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminMsg, setAdminMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    const res = addAdminEmail(newAdminEmail);
    if (res.success) {
      setAdminEmails(res.emails);
      setNewAdminEmail('');
      setAdminMsg({ type: 'success', text: res.message });
    } else {
      setAdminMsg({ type: 'error', text: res.message });
    }
  };

  const handleRemoveAdmin = (email: string) => {
    if (confirm(`Yakin ingin menghapus ${email} dari daftar Admin?`)) {
      const res = removeAdminEmail(email);
      if (res.success) {
        setAdminEmails(res.emails);
        setAdminMsg({ type: 'success', text: res.message });
      } else {
        setAdminMsg({ type: 'error', text: res.message });
      }
    }
  };

  // Redirect non-admins
  if (!isAuthenticated || !isAdminEmail(user?.email)) {
    return <Navigate to="/" replace />;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
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
  }, []);

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
      key: 'config',
      label: 'Konfigurasi',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  const maxGenreCount = Math.max(...Object.values(genreData), 1);

  return (
    <div className="page-enter pt-20 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 pb-16">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="eyebrow-mono text-mute block mb-1">PANEL ADMIN</span>
            <h1 className="display-md text-ink">Admin Dashboard</h1>
            <p className="text-body text-sm font-display mt-1">
              Selamat datang, <span className="text-sunset">{user!.username}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-canvas-card border border-hairline rounded-[8px] px-3 py-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-mute font-mono">ADMIN</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-canvas-card border border-hairline rounded-[10px] p-1 w-fit">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[7px] text-sm font-display transition-all duration-150 ${
                tab === key
                  ? 'bg-white/10 text-ink'
                  : 'text-mute hover:text-body hover:bg-white/5'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* ── DASHBOARD TAB ── */}
        {tab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Anime (database)"
                value={loading ? '...' : totalAnimeCount.toLocaleString('id-ID')}
                accent="bg-sunset/20"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
              <StatCard
                label="Genre Diindex"
                value={STAT_GENRES.length}
                accent="bg-breeze/20"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
              <StatCard
                label="Admin Terdaftar"
                value="2"
                accent="bg-dusk/20"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
              <StatCard
                label="API Source"
                value="AniList"
                accent="bg-green-500/20"
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />
            </div>

            {/* Quick overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-canvas-card border border-hairline rounded-[12px] p-5">
                <h2 className="text-sm font-display text-ink font-medium mb-4">Top 5 Anime Populer</h2>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-10 bg-canvas-mid rounded-[6px] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {popularAnime.slice(0, 5).map((a, i) => (
                      <AnimeRow key={a.id} anime={a} rank={i + 1} />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-canvas-card border border-hairline rounded-[12px] p-5">
                <h2 className="text-sm font-display text-ink font-medium mb-4">Distribusi Genre</h2>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-8 bg-canvas-mid rounded-[6px] animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {STAT_GENRES.map((g) => {
                      const pct = Math.round(((genreData[g] ?? 0) / maxGenreCount) * 100);
                      return (
                        <div key={g}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-display text-body">{g}</span>
                            <span className="font-mono text-mute">{genreData[g] ?? 0} anime</span>
                          </div>
                          <div className="h-1.5 bg-canvas-mid rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-sunset to-dusk rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TOP ANIME TAB ── */}
        {tab === 'anime' && (
          <div className="animate-fade-in-up">
            <div className="bg-canvas-card border border-hairline rounded-[12px] overflow-hidden">
              <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
                <h2 className="text-sm font-display text-ink font-medium">Top 10 Anime Terpopuler</h2>
                <span className="text-[10px] text-mute font-mono">via AniList API</span>
              </div>
              {loading ? (
                <div className="p-4 space-y-3">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-12 bg-canvas-mid rounded-[6px] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="p-2">
                  {popularAnime.map((a, i) => (
                    <AnimeRow key={a.id} anime={a} rank={i + 1} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── GENRE STATS TAB ── */}
        {tab === 'genre' && (
          <div className="animate-fade-in-up">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STAT_GENRES.map((g) => {
                const count = genreData[g] ?? 0;
                const pct = Math.round((count / maxGenreCount) * 100);
                return (
                  <Link
                    key={g}
                    to={`/anime?genre=${encodeURIComponent(g)}`}
                    className="bg-canvas-card border border-hairline rounded-[12px] p-5 hover:border-white/20 hover:bg-canvas-soft transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm font-display text-ink font-medium group-hover:text-sunset transition-colors">{g}</h3>
                      <span className="text-[10px] font-mono text-mute bg-canvas-mid px-2 py-0.5 rounded-full">
                        {loading ? '...' : count} anime
                      </span>
                    </div>
                    <div className="h-1.5 bg-canvas-mid rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sunset to-dusk rounded-full transition-all duration-700"
                        style={{ width: loading ? '0%' : `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-mute font-mono mt-2">{pct}% dari genre terbanyak</p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CONFIG TAB ── */}
        {tab === 'config' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="bg-canvas-card border border-hairline rounded-[12px] p-6 space-y-4">
              <div>
                <h2 className="text-sm font-display text-ink font-medium mb-1">Manajemen Email Admin</h2>
                <p className="text-xs text-mute">
                  Tambah atau hapus email yang memiliki hak akses penuh ke Halaman Admin secara langsung di bawah ini.
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
              <form onSubmit={handleAddAdmin} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Masukkan email admin baru..."
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1 bg-canvas-soft border border-hairline rounded-[8px] px-3.5 py-2 text-xs font-mono text-ink placeholder:text-mute outline-none focus:border-sunset transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="bg-sunset text-white font-medium text-xs px-4 py-2 rounded-[8px] hover:bg-sunset/90 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Tambah Admin
                </button>
              </form>

              {/* Daftar Email Admin */}
              <div className="space-y-2 pt-2">
                {adminEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between gap-3 bg-canvas-soft border border-hairline rounded-[8px] px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-mono text-ink truncate">{email}</span>
                      {email.toLowerCase() === user?.email?.toLowerCase() && (
                        <span className="text-[10px] font-mono text-sunset border border-sunset/40 bg-sunset/10 rounded-full px-2 py-0.5 shrink-0">
                          AKUN KAMU
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveAdmin(email)}
                      disabled={adminEmails.length <= 1}
                      className="text-xs font-mono text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/20 hover:border-red-500/50 bg-red-500/10 rounded-[6px] px-2.5 py-1 transition-all cursor-pointer shrink-0"
                      title={adminEmails.length <= 1 ? 'Minimal harus ada 1 Admin' : 'Hapus Admin'}
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-canvas-card border border-hairline rounded-[12px] p-6">
              <h2 className="text-sm font-display text-ink font-medium mb-1">Konfigurasi API</h2>
              <p className="text-xs text-mute mb-4">
                Sumber data anime yang sedang digunakan oleh aplikasi.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-canvas-soft border border-hairline rounded-[8px] px-4 py-3">
                  <div>
                    <p className="text-xs font-display text-ink">AniList GraphQL API</p>
                    <p className="text-[11px] font-mono text-mute">https://graphql.anilist.co</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    AKTIF
                  </span>
                </div>
                <div className="flex items-center justify-between bg-canvas-soft border border-hairline rounded-[8px] px-4 py-3">
                  <div>
                    <p className="text-xs font-display text-ink">Tag Support</p>
                    <p className="text-[11px] font-mono text-mute">Yuri, Isekai, Seinen, Shounen, Shoujo, Josei</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-mono text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    AKTIF
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-canvas-card border border-red-500/20 rounded-[12px] p-6">
              <h2 className="text-sm font-display text-red-400 font-medium mb-1">Zona Berbahaya</h2>
              <p className="text-xs text-mute mb-4">
                Tindakan berikut tidak dapat dibatalkan. Lakukan dengan hati-hati.
              </p>
              <button
                disabled
                className="text-xs font-display text-red-400 border border-red-500/40 rounded-[8px] px-4 py-2 opacity-50 cursor-not-allowed hover:opacity-60 transition-opacity"
              >
                Reset Semua Data (Segera Hadir)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
