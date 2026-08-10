// ── Anime types ──────────────────────────────────────────────

export type AnimeStatus = 'ongoing' | 'completed' | 'upcoming';

export type AnimeGenre =
  | 'Action'
  | 'Adventure'
  | 'Comedy'
  | 'Drama'
  | 'Fantasy'
  | 'Horror'
  | 'Isekai'
  | 'Mecha'
  | 'Mystery'
  | 'Romance'
  | 'Sci-Fi'
  | 'Seinen'
  | 'Shounen'
  | 'Shoujo'
  | 'Slice of Life'
  | 'Sports'
  | 'Supernatural'
  | 'Thriller'
  | 'Music'
  | 'Psychological'
  | 'Yuri'
  | 'Ecchi'
  | 'Hentai';

export type AnimeRating = 'G' | 'PG' | 'PG-13' | 'R' | 'R+' | '18+' | 'Rx';

export type AnimeType = 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special';

export interface AnimeCharacter {
  id: string;
  name: string;
  japaneseName?: string;
  role: 'Main' | 'Supporting' | 'Antagonist' | 'Other';
  image: string;
  voiceActor?: {
    name: string;
    japaneseName?: string;
    image?: string;
    language?: string;
  };
}

export interface Anime {
  id: string;
  slug: string;
  title: string;
  titleEnglish?: string;
  titleJapanese?: string;
  synopsis: string;
  synopsisShort: string;
  poster: string;          // URL to poster image
  banner?: string;         // URL to wide banner image
  trailer?: string;        // YouTube/embed URL
  genres: AnimeGenre[];
  status: AnimeStatus;
  type: AnimeType;
  year: number;
  season: 'Winter' | 'Spring' | 'Summer' | 'Fall';
  studio: string;
  rating: AnimeRating;
  score: number;           // 0–10
  episodes: number;        // total episode count (0 = ongoing unknown)
  duration: number;        // minutes per episode
  characters?: AnimeCharacter[];
  malId?: number;          // MyAnimeList ID for live data fetching
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewUpdate?: boolean;
  createdAt: string;       // ISO date string
  updatedAt: string;
}

export interface AnimeListResponse {
  data: Anime[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AnimeFilterParams {
  genre?: AnimeGenre;
  status?: AnimeStatus;
  year?: number;
  type?: AnimeType;
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: 'latest' | 'popular' | 'score' | 'title' | 'new';
}
