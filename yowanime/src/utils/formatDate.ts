/**
 * Format ISO date string into a readable Indonesian date.
 */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format duration in seconds to mm:ss or hh:mm:ss.
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format minutes (per episode) to readable string.
 */
export function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}j ${m}m` : `${h} jam`;
  }
  return `${minutes} menit`;
}

/**
 * Format score to display string with one decimal.
 */
export function formatScore(score: number): string {
  return score.toFixed(1);
}
