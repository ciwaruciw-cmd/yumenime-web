/**
 * genres.ts — Lightweight static genre definitions for Yumenime.
 * Replaces the need to loop through the 9MB mock dataset on page load.
 */

export interface GenreItem {
  name: string;
  slug: string;
}

export const GENRE_ITEMS: GenreItem[] = [
  { name: 'Action', slug: 'action' },
  { name: 'Adventure', slug: 'adventure' },
  { name: 'Comedy', slug: 'comedy' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Horror', slug: 'horror' },
  { name: 'Isekai', slug: 'isekai' },
  { name: 'Mecha', slug: 'mecha' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Romance', slug: 'romance' },
  { name: 'Sci-Fi', slug: 'sci-fi' },
  { name: 'Seinen', slug: 'seinen' },
  { name: 'Shounen', slug: 'shounen' },
  { name: 'Shoujo', slug: 'shoujo' },
  { name: 'Slice of Life', slug: 'slice-of-life' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Supernatural', slug: 'supernatural' },
  { name: 'Thriller', slug: 'thriller' },
  { name: 'Music', slug: 'music' },
  { name: 'Psychological', slug: 'psychological' },
  { name: 'Yuri', slug: 'yuri' },
  { name: 'Ecchi', slug: 'ecchi' },
  { name: 'Hentai', slug: 'hentai' },
];

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
