import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore, type Notification, type NotifType } from '@/store/useNotificationStore';

// ── Helpers ───────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function typeBadgeClass(type: NotifType): string {
  switch (type) {
    case 'success':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'warning':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'update':
      return 'bg-white/10 text-white border-white/20';
    default: // info
      return 'bg-sunset/15 text-sunset border-sunset/30';
  }
}

// ── Single Notification Item (No circular avatar/profile icon) ──

export function NotifItem({
  notif,
  onRead,
  onRemove,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={`relative px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer group ${
        !notif.read ? 'bg-white/[0.02]' : ''
      }`}
      onClick={() => onRead(notif.id)}
      role="button"
      tabIndex={0}
      aria-label={notif.title}
    >
      {/* Left unread accent line */}
      {!notif.read && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-sunset rounded-r" />
      )}

      {/* Header: Title + Type tag + Time + Delete button */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border leading-none shrink-0 ${typeBadgeClass(
              notif.type
            )}`}
          >
            {notif.type}
          </span>
          <p
            className={`text-xs font-display truncate ${
              notif.read ? 'text-body-mid' : 'text-ink font-semibold'
            }`}
          >
            {notif.title}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-mute/60 font-mono">
            {relativeTime(notif.createdAt)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(notif.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-mute hover:text-red-400 transition-all p-1 rounded hover:bg-white/10 cursor-pointer"
            aria-label="Delete notification"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Message Content */}
      <p className="text-[12px] text-body-mid font-display leading-relaxed pl-0.5 break-words">
        {notif.message}
      </p>
    </div>
  );
}

// ── Main Bell Component ───────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, fetchNotifications, markRead, markAllRead, removeNotification, clearAll, unreadCount } =
    useNotificationStore();

  const count = unreadCount();

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={handleToggle}
        className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer text-body-mid hover:text-ink"
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Counter Badge — aligned with xAI design sunset badge */}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-sunset text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-mono font-bold leading-none animate-[fadeIn_0.2s_ease-out]">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown panel — strict xAI dark canvas styling */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 bg-canvas-soft border border-hairline rounded-[10px] shadow-2xl z-50 overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-canvas/60">
            <div className="flex items-center gap-2">
              <span className="eyebrow-mono text-mute text-[10px] tracking-wider">NOTIFICATIONS</span>
              {count > 0 && (
                <span className="text-[9px] font-mono bg-sunset/20 text-sunset border border-sunset/30 px-1.5 py-0.5 rounded-full font-bold">
                  {count} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-mute hover:text-ink font-display transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-white/5"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] text-mute hover:text-red-400 font-display transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-red-500/10"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-hairline">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-11 h-11 rounded-full bg-canvas-card border border-hairline flex items-center justify-center mb-3 text-mute">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-xs text-ink font-display font-medium">No notifications</p>
                <p className="text-[11px] text-mute font-display mt-0.5">All new updates and alerts will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  onRead={markRead}
                  onRemove={removeNotification}
                />
              ))
            )}
          </div>

          {/* Footer Link to full Notifications page */}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center text-xs font-display text-sunset hover:text-sunset-soft py-2.5 bg-canvas/80 border-t border-hairline transition-colors font-medium"
          >
            Lihat Semua Notifikasi →
          </Link>
        </div>
      )}
    </div>
  );
}
