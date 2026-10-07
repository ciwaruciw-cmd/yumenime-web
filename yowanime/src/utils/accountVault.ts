import type { User, FavoriteCharacter } from '@/types/user';
import type { Anime } from '@/types/anime';
import type { WatchHistoryItem } from '@/types/history';

export interface AccountVault {
  email: string;
  userProfile?: Partial<User>;
  favoriteCharacters?: FavoriteCharacter[];
  watchlist?: Anime[];
  history?: WatchHistoryItem[];
  updatedAt: number;
}

const VAULT_PREFIX = 'yowanime_vault_';

export function saveAccountVault(email: string, data: Partial<AccountVault>): void {
  if (!email) return;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const key = VAULT_PREFIX + cleanEmail;
    const existing = loadAccountVault(cleanEmail) || {
      email: cleanEmail,
      updatedAt: Date.now(),
    };
    const merged: AccountVault = {
      ...existing,
      ...data,
      email: cleanEmail,
      updatedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (err) {
    console.warn('Failed to save account vault:', err);
  }
}

export function loadAccountVault(email: string): AccountVault | null {
  if (!email) return null;
  try {
    const cleanEmail = email.toLowerCase().trim();
    const key = VAULT_PREFIX + cleanEmail;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load account vault:', err);
  }
  return null;
}

export function getActiveAuthEmail(): string | null {
  try {
    const raw = localStorage.getItem('yumenime-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.user?.email) {
        return parsed.state.user.email.toLowerCase().trim();
      }
    }
  } catch {}
  return null;
}
