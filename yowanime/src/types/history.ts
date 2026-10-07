export interface WatchHistoryItem {
  /** Unique identifier for the anime */
  animeId: string;
  /** Title of the anime */
  animeTitle: string;
  /** URL slug or identifier for navigation */
  animeSlug: string;
  /** Anime poster image URL */
  animePoster: string;
  /** Anime media type (e.g. TV, MOVIE, OVA) */
  animeType?: string;
  /** Episode number currently watched */
  episodeNumber: number;
  /** Episode title */
  episodeTitle?: string;
  /** Episode thumbnail image if available */
  episodeThumbnail?: string;
  /** Playback position in seconds */
  currentTime: number;
  /** Total video duration in seconds */
  duration: number;
  /** Percentage watched (0 to 100) */
  progress: number;
  /** Whether the episode has been completed (e.g. watched > 90% or reached end) */
  completed: boolean;
  /** List of episode numbers completed for this anime */
  completedEpisodes?: number[];
  /** Last watched timestamp in milliseconds */
  updatedAt: number;
}
