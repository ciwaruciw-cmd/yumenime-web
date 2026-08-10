/**
 * Admin Configuration File (src/config/adminConfig.ts)
 * 
 * Mengelola daftar email yang memiliki akses Admin.
 * Mendukung penyimpanan dinamis melalui localStorage dengan fallback email bawaan.
 */

export const DEFAULT_ADMIN_EMAILS: string[] = [
  'omgnaoiyui@gmail.com',
  'yowa@gmail.com',
];

const STORAGE_KEY = 'yowanime_admin_emails';

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
 * Menambahkan email admin baru.
 */
export function addAdminEmail(email: string): { success: boolean; message: string; emails: string[] } {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@') || !clean.includes('.')) {
    return { success: false, message: 'Format email tidak valid!', emails: getAdminEmails() };
  }

  const current = getAdminEmails();
  if (current.some((e) => e.toLowerCase() === clean)) {
    return { success: false, message: 'Email sudah terdaftar sebagai Admin!', emails: current };
  }

  const updated = [...current, clean];
  saveAdminEmails(updated);
  return { success: true, message: `Email ${clean} berhasil ditambahkan sebagai Admin!`, emails: updated };
}

/**
 * Menghapus email admin.
 */
export function removeAdminEmail(email: string): { success: boolean; message: string; emails: string[] } {
  const clean = email.trim().toLowerCase();
  const current = getAdminEmails();
  
  if (current.length <= 1) {
    return { success: false, message: 'Tidak dapat menghapus admin terakhir!', emails: current };
  }

  const updated = current.filter((e) => e.toLowerCase() !== clean);
  if (updated.length === current.length) {
    return { success: false, message: 'Email tidak ditemukan.', emails: current };
  }

  saveAdminEmails(updated);
  return { success: true, message: `Email ${clean} berhasil dihapus dari daftar Admin.`, emails: updated };
}

/**
 * Memeriksa apakah sebuah email terdaftar sebagai Admin.
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return getAdminEmails().some((e) => e.trim().toLowerCase() === cleanEmail);
}

/**
 * Compatibility export (getter/dynamic representation)
 */
export const ADMIN_EMAILS = getAdminEmails();
