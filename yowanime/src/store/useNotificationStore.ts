/**
 * Notification store — admin can push notifications to all users.
 * Connected to shared backend API so all users across devices/accounts receive them.
 * Tracks individual user read-states in localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '@/services/api';

export type NotifType = 'info' | 'success' | 'warning' | 'update';

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  readIds: string[];
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  /** Send a new notification to all users via backend */
  pushNotification: (payload: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      readIds: [],
      isLoading: false,

      fetchNotifications: async () => {
        set({ isLoading: true });
        try {
          const remoteNotifs = await apiFetch<Omit<Notification, 'read'>[]>('/api/notifications');
          const readIds = get().readIds;
          const mapped: Notification[] = remoteNotifs.map((n) => ({
            ...n,
            read: readIds.includes(n.id),
          }));
          set({ notifications: mapped, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      pushNotification: async (payload) => {
        try {
          const token = localStorage.getItem('yumenime-auth')
            ? JSON.parse(localStorage.getItem('yumenime-auth') || '{}')?.state?.token
            : null;
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const newNotif = await apiFetch<Notification>('/api/notifications', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });
          set((state) => ({
            notifications: [{ ...newNotif, read: false }, ...state.notifications],
          }));
        } catch (err) {
          console.warn('Failed to push notification to backend:', err);
          // Fallback optimistic
          const fallbackNotif: Notification = {
            id: `notif-${Date.now()}`,
            createdAt: new Date().toISOString(),
            read: false,
            ...payload,
          };
          set((state) => ({
            notifications: [fallbackNotif, ...state.notifications],
          }));
        }
      },

      markRead: (id) => {
        set((state) => {
          const nextReadIds = Array.from(new Set([...state.readIds, id]));
          return {
            readIds: nextReadIds,
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          };
        });
      },

      markAllRead: () => {
        set((state) => {
          const allIds = state.notifications.map((n) => n.id);
          const nextReadIds = Array.from(new Set([...state.readIds, ...allIds]));
          return {
            readIds: nextReadIds,
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
          };
        });
      },

      removeNotification: async (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
        try {
          const token = localStorage.getItem('yumenime-auth')
            ? JSON.parse(localStorage.getItem('yumenime-auth') || '{}')?.state?.token
            : null;
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await apiFetch(`/api/notifications/${id}`, { method: 'DELETE', headers });
        } catch (err) {
          console.warn('Failed to delete notification on server:', err);
        }
      },

      clearAll: async () => {
        set({ notifications: [], readIds: [] });
        try {
          const token = localStorage.getItem('yumenime-auth')
            ? JSON.parse(localStorage.getItem('yumenime-auth') || '{}')?.state?.token
            : null;
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          await apiFetch('/api/notifications', { method: 'DELETE', headers });
        } catch (err) {
          console.warn('Failed to clear notifications on server:', err);
        }
      },

      unreadCount: () => {
        const { notifications, readIds } = get();
        return notifications.filter((n) => !readIds.includes(n.id) && !n.read).length;
      },
    }),
    {
      name: 'yowanime-notifications-read',
      partialize: (state) => ({ readIds: state.readIds }),
    }
  )
);
