/**
 * Admin Configuration File (src/config/adminConfig.ts)
 * 
 * Mengelola daftar email yang memiliki akses Admin secara tersinkronisasi
 * antara PC, Laptop, dan HP melalui backend API bersama.
 */

export const DEFAULT_ADMIN_EMAILS: string[] = [
  'omgnaoiyui@gmail.com',
  'yowa@gmail.com',
  'yowayichis@gmail.com',
];

const STORAGE_KEY = 'yowanime_admin_emails';

// Sync from backend server automatically
export async function syncAdminEmailsFromServer(token?: string): Promise<string[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/emails', { headers });
    if (res.ok) {
      const serverEmails = await res.json();
      if (Array.isArray(serverEmails) && serverEmails.length > 0) {
        saveAdminEmails(serverEmails);
        return serverEmails;
      }
    }
  } catch {
    // offline
  }
  return getAdminEmails();
}

/**
 * Mengambil daftar email Admin aktif dari localStorage (atau fallback default).
 */
export function getAdminEmails(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }
  return [...DEFAULT_ADMIN_EMAILS];
}

/**
 * Menyimpan daftar email Admin ke localStorage.
 */
export function saveAdminEmails(emails: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch {
    // Ignore error
  }
}

/**
 * Menambahkan email admin baru (tersimpan ke server & local).
 */
export function addAdminEmail(email: string, token?: string): { success: boolean; message: string; emails: string[] } {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@') || !clean.includes('.')) {
    return { success: false, message: 'Invalid email format!', emails: getAdminEmails() };
  }

  const current = getAdminEmails();
  if (current.some((e) => e.toLowerCase() === clean)) {
    return { success: false, message: 'Email is already registered as Admin!', emails: current };
  }

  const updated = [...current, clean];
  saveAdminEmails(updated);

  // Sync to server in background
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  fetch('/api/admin/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({ email: clean }),
  }).catch(() => {});

  return { success: true, message: `Email ${clean} added as Admin successfully!`, emails: updated };
}

/**
 * Menghapus email admin (tersimpan ke server & local).
 */
export function removeAdminEmail(email: string, token?: string): { success: boolean; message: string; emails: string[] } {
  const clean = email.trim().toLowerCase();
  const current = getAdminEmails();

  if (current.length <= 1) {
    return { success: false, message: 'Cannot remove the last remaining admin!', emails: current };
  }

  const updated = current.filter((e) => e.toLowerCase() !== clean);
  if (updated.length === current.length) {
    return { success: false, message: 'Email not found.', emails: current };
  }

  saveAdminEmails(updated);

  // Sync to server in background
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  fetch(`/api/admin/emails/${encodeURIComponent(clean)}`, {
    method: 'DELETE',
    headers,
  }).catch(() => {});

  return { success: true, message: `Email ${clean} removed from Admin list successfully.`, emails: updated };
}

/**
 * Memeriksa apakah sebuah email terdaftar sebagai Admin (client fallback helper).
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return getAdminEmails().some((e) => e.trim().toLowerCase() === cleanEmail);
}

/**
 * Compatibility export
 */
export const ADMIN_EMAILS = getAdminEmails();
