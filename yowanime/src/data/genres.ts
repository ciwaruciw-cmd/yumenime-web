/**
 * genres.ts — Lightweight static genre definitions for Yumenime.
 * Replaces the need to loop through the 9MB mock dataset on page load.
 */

export const ALL_GENRES: string[] = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Isekai',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Seinen',
  'Shoujo',
  'Shounen',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

export const POPULAR_GENRES: string[] = [
  'Action',
  'Adventure',
  'Comedy',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Isekai',
  'Slice of Life',
  'Supernatural',
  'Drama',
  'Mystery',
  'Sports',
];

export function getAllGenres(): string[] {
  return ALL_GENRES;
}

export function getPopularGenres(): string[] {
  return POPULAR_GENRES;
}
