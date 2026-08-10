// ── Episode types ─────────────────────────────────────────────

export type VideoQuality = '480p' | '720p' | '1080p';

export interface VideoSource {
  quality: VideoQuality;
  url: string;
  size?: number; // in MB
}

export interface Episode {
  id: string;
  animeId: string;
  number: number;
  title: string;
  slug?: string;           // Otakudesu episode slug for navigation
  thumbnail?: string;
  duration: number;        // in seconds
  synopsis?: string;
  sources: VideoSource[];  // video sources per quality
  aired?: string;          // ISO date string
  isWatched?: boolean;     // client-side state
  /** Multi-quality stream servers from Yamada API Core */
  servers_by_quality?: Record<string, {
    quality: string;
    server_name: string;
    data_content: string;
    is_default: boolean;
    decoded_info: unknown;
  }[]>;
  /** Navigation slugs to prev/next episodes */
  navigation?: {
    prev: string | null;
    next: string | null;
  };
}

export interface EpisodeProgress {
  episodeId: string;
  currentTime: number;    // seconds
  duration: number;       // seconds
  completed: boolean;
}
