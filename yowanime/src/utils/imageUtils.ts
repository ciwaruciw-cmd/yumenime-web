/**
 * imageUtils.ts
 * Image URL normalization and proxy routing.
 * Bypasses Indonesian ISP DNS blocking for domains like nekopoi.care.
 */

export function resolveImageUrl(url?: string): string {
  if (!url) return '';
  // If already proxied, return as-is
  if (url.startsWith('/api/proxy/image')) return url;

  // Nekopoi images are blocked by Indonesian ISPs -> route through local proxy
  if (url.includes('nekopoi.care')) {
    return `/api/proxy/image?url=${encodeURIComponent(url)}`;
  }

  return url;
}
