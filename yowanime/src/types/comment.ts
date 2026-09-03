// ── Comment types ──────────────────────────────────────────────

export interface Comment {
  id: number;
  userId: string;
  animeId: string;
  episodeId?: string | null;
  parentId?: number | null;
  content: string;
  createdAt: string;
  username: string;
  avatarUrl?: string | null;
  /** True if the commenter has admin role */
  isAdmin?: boolean;
  /** Nested replies (populated client-side) */
  replies?: Comment[];
}

export interface CreateCommentPayload {
  animeId: string;
  episodeId?: string;
  content: string;
  parentId?: number | null;
  userId?: string;
  username?: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}
