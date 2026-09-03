/**
 * Comment service — calls /api/comments endpoints.
 * All functions throw on failure so the store can decide how to handle it.
 */

import { apiFetch } from './api';
import type { Comment, CreateCommentPayload } from '@/types/comment';

// ── Raw shape returned by the server (snake_case) ─────────────
interface RawComment {
  id: number;
  user_id: string;
  anime_id: string;
  episode_id?: string | null;
  parent_id?: number | null;
  content: string;
  created_at: string;
  username: string;
  avatar_url?: string | null;
  is_admin?: boolean;
  replies?: RawComment[];
}

const toComment = (r: RawComment): Comment => ({
  id: r.id,
  userId: r.user_id,
  animeId: r.anime_id,
  episodeId: r.episode_id,
  parentId: r.parent_id ?? null,
  content: r.content,
  createdAt: r.created_at,
  username: r.username,
  avatarUrl: r.avatar_url,
  isAdmin: r.is_admin ?? false,
  replies: (r.replies ?? []).map(toComment),
});

// ── API Functions ─────────────────────────────────────────────

/** Fetch comments for an anime, optionally filtered by episodeId. */
export async function fetchComments(animeId: string, episodeId?: string): Promise<Comment[]> {
  const query = episodeId ? `?episodeId=${encodeURIComponent(episodeId)}` : '';
  const raw = await apiFetch<RawComment[]>(`/api/comments/${animeId}${query}`);
  return raw.map(toComment);
}

/** Post a new comment. Returns the created comment. */
export async function postComment(
  payload: CreateCommentPayload,
  token: string
): Promise<Comment> {
  const raw = await apiFetch<RawComment>('/api/comments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return toComment(raw);
}

/** Delete a comment by id. */
export async function deleteComment(commentId: number, token: string): Promise<void> {
  await apiFetch(`/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
