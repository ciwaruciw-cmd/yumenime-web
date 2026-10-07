import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore, type Notification, type NotifType } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';

// ── Helpers ───────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return 'Just now';
  }
}

interface NotifStyle {
  label: string;
  badgeCls: string;
  icon: React.ReactNode;
}

function getNotifStyle(type: NotifType): NotifStyle {
  switch (type) {
    case 'success':
      return {
        label: 'Success',
        badgeCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ),
      };
    case 'warning':
      return {
        label: 'Warning',
        badgeCls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" />
          </svg>
        ),
      };
    case 'update':
      return {
        label: 'Update',
        badgeCls: 'bg-sunset/15 text-sunset border-sunset/30',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
          </svg>
        ),
      };
    default:
      return {
        label: 'Info',
        badgeCls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      };
  }
}

// ── Card ───────────────────────────────────────────────────────

function NotifCard({
  notif,
  onRead,
  onRemove,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onRemove: (id: string) => Promise<void>;
}) {
  const style = getNotifStyle(notif.type);
  return (
    <div
      className={`group relative bg-canvas-card rounded-[14px] border transition-all duration-200 cursor-pointer ${
        !notif.read
          ? 'border-l-4 border-l-sunset border-hairline/80 shadow-md shadow-sunset/5 bg-white/[0.025]'
          : 'border-hairline hover:border-white/20 opacity-80 hover:opacity-100'
      }`}
      onClick={() => { if (!notif.read) onRead(notif.id); }}
    >
      <div className="flex items-start gap-4 p-5">
        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border mt-0.5 ${style.badgeCls}`}>
          {style.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border leading-none ${style.badgeCls}`}>
              {style.label}
            </span>
            <h3 className={`text-sm sm:text-base font-display font-semibold leading-snug ${!notif.read ? 'text-white' : 'text-ink'}`}>
              {notif.title}
            </h3>
            {!notif.read && <span className="w-2 h-2 bg-sunset rounded-full animate-pulse shrink-0" />}
          </div>

          <p className="text-xs sm:text-sm text-body-mid font-display leading-relaxed mt-1.5 whitespace-pre-wrap">
            {notif.message}
          </p>

          <div className="flex items-center gap-3 mt-3 text-[11px] font-mono text-mute">
            <span>{formatTimeAgo(notif.createdAt)}</span>
            {!notif.read && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
                className="text-sunset font-display font-medium hover:underline text-xs cursor-pointer"
              >
                Mark read
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); void onRemove(notif.id); }}
          className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 rounded-full text-mute hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

type FilterType = 'all' | 'unread' | 'info' | 'update' | 'success' | 'warning';

/**
 * Notifications — dedicated page like Watchlist & History.
 */
export default function Notifications() {
  const { isAuthenticated } = useAuthStore();
  const {
    notifications,
    fetchNotifications,
    markRead,
    markAllRead,
    removeNotification,
    clearAll,
    unreadCount: getUnreadCount,
  } = useNotificationStore();

  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unread = getUnreadCount();

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const allFilters: { id: FilterType; label: string; count: number }[] = (
    [
              { id: 'all' as FilterType, label: 'All', count: notifications.length },
              { id: 'unread' as FilterType, label: 'Unread', count: unread },
              { id: 'info' as FilterType, label: 'Info', count: notifications.filter((n) => n.type === 'info').length },
              { id: 'update' as FilterType, label: 'Update', count: notifications.filter((n) => n.type === 'update').length },
              { id: 'success' as FilterType, label: 'Success', count: notifications.filter((n) => n.type === 'success').length },
              { id: 'warning' as FilterType, label: 'Warning', count: notifications.filter((n) => n.type === 'warning').length },
    ] as { id: FilterType; label: string; count: number }[]
  ).filter((f) => f.id === 'all' || f.id === 'unread' || f.count > 0);

  if (!isAuthenticated) {
    return (
      <div className="page-enter pt-14 sm:pt-20 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-5 text-mute">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="display-sm text-ink mb-2 text-xl font-bold">Notifications</h1>
        <p className="text-body text-sm font-display mb-6 max-w-xs">
          Please sign in first to view your notifications.
        </p>
        <div className="flex gap-3">
          <Link to="/login"><Button variant="primary" size="lg">Sign In</Button></Link>
          <Link to="/register"><Button variant="outline" size="lg">Sign Up</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter pt-14 sm:pt-20 min-h-screen pb-24 sm:pb-16">
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8 border-b border-hairline pb-6">
          <div>
            <span className="eyebrow-mono text-sunset font-semibold tracking-wider block mb-1">
              MY ACCOUNT
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              Notifications
              {unread > 0 && (
                <span className="text-sm font-mono font-bold bg-sunset text-white px-2.5 py-1 rounded-full">
                  {unread} new
                </span>
              )}
            </h1>
            <p className="text-body text-sm font-display mt-1">
              System alerts, anime episode updates, and account announcements.
            </p>
          </div>

          {notifications.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              {unread > 0 && (
                <Button variant="outline-sm" size="sm" onClick={markAllRead} className="flex items-center gap-1.5 text-xs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Mark All Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Filter Pills */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            {allFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-display rounded-full border whitespace-nowrap transition-all cursor-pointer ${
                  filter === f.id
                    ? 'bg-sunset text-white border-sunset shadow-sm font-semibold'
                    : 'bg-canvas-card border-hairline text-body hover:text-white hover:border-white/30'
                }`}
              >
                {f.label}
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.id ? 'bg-white/20' : 'bg-canvas-soft'}`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Notification Cards */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-canvas-card border border-hairline rounded-[16px]">
            <div className="w-20 h-20 rounded-full bg-sunset/10 border border-sunset/30 flex items-center justify-center text-sunset mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-display font-bold text-ink mb-2">
              {filter === 'unread' ? 'All caught up! 👍' : 'No Notifications Yet'}
            </h2>
            <p className="text-body text-sm font-display max-w-sm mb-6">
              {filter === 'unread'
                ? 'Great! You have read all notifications.'
                : 'New alerts will appear here automatically.'}
            </p>
            {filter !== 'all' && (
              <Button variant="outline-sm" size="sm" onClick={() => setFilter('all')}>
              View All Notifications
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notif) => (
              <NotifCard
                key={notif.id}
                notif={notif}
                onRead={markRead}
                onRemove={removeNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
