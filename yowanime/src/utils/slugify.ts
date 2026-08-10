/**
 * Convert a string into a URL-safe slug.
 * e.g. "Attack on Titan: Final Season" → "attack-on-titan-final-season"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove special chars except hyphen
    .replace(/[\s_]+/g, '-')    // spaces/underscores → hyphen
    .replace(/-+/g, '-')        // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');   // trim leading/trailing hyphens
}

/**
 * Reverse: convert slug back to title case (best-effort).
 */
export function unslugify(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
