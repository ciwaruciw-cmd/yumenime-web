/**
 * Zustand store for comment state management.
 * Uses shared backend API with local cache persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Comment, CreateCommentPayload } from '@/types/comment';
import { fetchComments, postComment, deleteComment } from '@/services/commentService';

interface CommentStore {
  /** Comments keyed by episodeId (when provided) or animeId */
  commentsByAnime: Record<string, Comment[]>;
  isLoading: boolean;
  error: string | null;

  loadComments: (animeId: string, episodeId?: string) => Promise<void>;
  addComment: (
    payload: CreateCommentPayload,
    token: string,
    userId: string,
    username: string,
    avatarUrl?: string,
    isAdmin?: boolean,
  ) => Promise<void>;
  removeComment: (commentId: number, cacheKey: string, token: string) => Promise<void>;
  clearError: () => void;
}

export const useCommentStore = create<CommentStore>()(
  persist(
    (set, get) => ({
      commentsByAnime: {},
      isLoading: false,
      error: null,

      loadComments: async (animeId, episodeId) => {
        const cacheKey = episodeId ?? animeId;
        set({ isLoading: true, error: null });
        try {
          const comments = await fetchComments(animeId, episodeId);
          set((state) => ({
            commentsByAnime: { ...state.commentsByAnime, [cacheKey]: comments },
            isLoading: false,
          }));
        } catch {
          // Backend unavailable — keep existing local cache, stop loading
          set({ isLoading: false });
        }
      },

      addComment: async (payload, token, userId, username, avatarUrl, isAdmin = false) => {
        const cacheKey = payload.episodeId ?? payload.animeId;
        set({ error: null });

        const localId = Date.now();
        const newComment: Comment = {
          id: localId,
          userId,
          animeId: payload.animeId,
          episodeId: payload.episodeId,
          parentId: payload.parentId ?? null,
          content: payload.content,
          createdAt: new Date().toISOString(),
          username,
          avatarUrl: avatarUrl ?? null,
          isAdmin,
          replies: [],
        };

        // Optimistic insert
        set((state) => {
          const list = state.commentsByAnime[cacheKey] ?? [];
          if (payload.parentId) {
            // Attach optimistic reply to parent
            const updated = list.map((c) =>
              c.id === payload.parentId
                ? { ...c, replies: [...(c.replies ?? []), newComment] }
                : c
            );
            return { commentsByAnime: { ...state.commentsByAnime, [cacheKey]: updated } };
          }
          return {
            commentsByAnime: {
              ...state.commentsByAnime,
              [cacheKey]: [newComment, ...list],
            },
          };
        });

        // Sync to backend
        try {
          const created = await postComment({ ...payload, userId, username, avatarUrl, isAdmin }, token);
          set((state) => {
            const list = state.commentsByAnime[cacheKey] ?? [];
            if (payload.parentId) {
              const updated = list.map((c) =>
                c.id === payload.parentId
                  ? {
                      ...c,
                      replies: (c.replies ?? []).map((r) => (r.id === localId ? { ...created, replies: [] } : r)),
                    }
                  : c
              );
              return { commentsByAnime: { ...state.commentsByAnime, [cacheKey]: updated } };
            }
            return {
              commentsByAnime: {
                ...state.commentsByAnime,
                [cacheKey]: list.map((c) => (c.id === localId ? { ...created, replies: [] } : c)),
              },
            };
          });
        } catch (err) {
          console.warn('Could not sync comment to backend:', err);
        }
      },

      removeComment: async (commentId, cacheKey, token) => {
        // Remove immediately from local store
        set((state) => ({
          commentsByAnime: {
            ...state.commentsByAnime,
            [cacheKey]: (state.commentsByAnime[cacheKey] ?? []).filter((c) => c.id !== commentId),
          },
        }));

        try {
          await deleteComment(commentId, token);
        } catch (err) {
          console.warn('Could not delete comment on backend:', err);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'yowanime-comments',
      partialize: (state) => ({ commentsByAnime: state.commentsByAnime }),
    }
  )
);
