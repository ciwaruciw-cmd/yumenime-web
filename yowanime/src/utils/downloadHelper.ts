/**
 * downloadHelper.ts
 * Helper utilities for formatting filenames, generating download URLs,
 * and triggering browser downloads for anime episodes.
 */

/**
 * Format standard clean filename for downloading an anime episode:
 * e.g. "[Yowanime] Solo Leveling Season 2 - Episode 03 [720p].mp4"
 */
export function formatEpisodeFilename(
  animeTitle: string,
  episodeNumber: number,
  quality: string = '720p'
): string {
  // Sanitize title for filename
  const cleanTitle = (animeTitle || 'Anime')
    .replace(/[\\/:*?"<>|]/g, '')
    .trim();

  const paddedEp = String(episodeNumber).padStart(2, '0');
  const cleanQuality = quality.toUpperCase();

  return `[Yowanime] ${cleanTitle} - Episode ${paddedEp} [${cleanQuality}].mp4`;
}

/**
 * Estimate file size based on duration and quality bitrate.
 */
export function estimateEpisodeSize(durationSeconds: number = 1440, quality: string = '720p'): string {
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const q = quality.toLowerCase();

  let mbPerMinute = 8; // fallback
  if (q.includes('1080')) {
    mbPerMinute = 14; // ~336 MB for 24 min
  } else if (q.includes('720')) {
    mbPerMinute = 8;  // ~192 MB for 24 min
  } else if (q.includes('480')) {
    mbPerMinute = 4.2; // ~100 MB for 24 min
  } else if (q.includes('360')) {
    mbPerMinute = 2.4; // ~58 MB for 24 min
  }

  const estimatedMb = Math.round(durationMinutes * mbPerMinute);
  return `~${estimatedMb} MB`;
}

/**
 * Extract clean direct stream URL or build backend download URL.
 */
export function buildDownloadUrl(streamUrl: string, filename: string): string {
  if (!streamUrl) return '';

  // If already a proxied URL, extract target or pass through
  let target = streamUrl;
  if (streamUrl.startsWith('/api/stream/video?url=')) {
    try {
      const parsed = new URL(streamUrl, window.location.origin);
      const inner = parsed.searchParams.get('url');
      if (inner) target = inner;
    } catch {
      // keep streamUrl
    }
  }

  // Construct download proxy endpoint with Content-Disposition attachment header
  return `/api/stream/download?url=${encodeURIComponent(target)}&filename=${encodeURIComponent(filename)}`;
}

/**
 * Trigger immediate native browser download.
 */
export function triggerDownloadFile(downloadUrl: string, filename: string): void {
  if (!downloadUrl) return;

  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
  }, 300);
}

/**
 * Copy download URL or batch links to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}
