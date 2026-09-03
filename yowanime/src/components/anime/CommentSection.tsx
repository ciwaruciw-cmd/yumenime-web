import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCommentStore } from '@/store/useCommentStore';
import { useAuthStore } from '@/store/useAuthStore';
import type { Comment } from '@/types/comment';

// ── Helpers ────────────────────────────────────────────────────

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function stringToColor(str: string): string {
  const palette = [
    '#ff7a17', '#ffc285', '#a0c3ec', '#dadbdf', '#f4a261',
    '#e2e8f0', '#56cfb2', '#ff9a3c', '#38bdf8', '#c4b5fd',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ── Skeleton ───────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-3/4 rounded bg-white/10" />
      </div>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────

function Avatar({ username, avatarUrl, size = 8 }: { username: string; avatarUrl?: string | null; size?: number }) {
  const sizeClass = size === 7 ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-xs';
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={`${sizeClass} rounded-full object-cover border border-hairline shrink-0`}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-mono font-bold bg-canvas-soft border border-hairline text-ink shrink-0`}>
      {username[0]?.toUpperCase()}
    </div>
  );
}

// ── Inline Reply Form ──────────────────────────────────────────

interface ReplyFormProps {
  parentId: number;
  parentUsername: string;
  animeId: string;
  episodeId?: string;
  onClose: () => void;
}

function ReplyForm({ parentId, parentUsername, animeId, episodeId, onClose }: ReplyFormProps) {
  const { user, token } = useAuthStore();
  const { addComment } = useCommentStore();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = ref.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !token) return;
    setSubmitting(true);
    await addComment(
      { animeId, episodeId, content: text.trim(), parentId },
      token, user.id, user.username, user.avatar, user.isAdmin === true,
    );
    setText('');
    setSubmitting(false);
    onClose();
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5 mt-3 ml-10">
      <Avatar username={user.username} avatarUrl={user.avatar} size={7} />
      <div className="flex-1">
        <div className="text-[11px] text-mute font-display mb-1.5">
          Replying to <span className="text-sunset">@{parentUsername}</span>
        </div>
        <textarea
          ref={ref}
          value={text}
          onChange={handleChange}
          placeholder="Write a reply…"
          rows={1}
          maxLength={500}
          disabled={submitting}
          className="w-full bg-canvas-soft border border-hairline hover:border-white/20 focus:border-white/30 rounded-[8px] px-3 py-2.5 text-sm text-ink font-display placeholder:text-mute resize-none outline-none transition-colors leading-relaxed"
          style={{ minHeight: '40px' }}
        />
        <div className="flex items-center justify-end gap-2 mt-1.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-mute font-display hover:text-ink transition-colors cursor-pointer px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="inline-flex items-center gap-1.5 bg-white text-black font-display font-medium text-xs px-4 py-1.5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {submitting ? (
              <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
            Reply
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Single Comment Row ─────────────────────────────────────────

interface CommentItemProps {
  comment: Comment;
  cacheKey: string;
  token?: string | null;
  currentUserId?: string;
  currentUserIsAdmin?: boolean;
  animeId: string;
  episodeId?: string;
  isReply?: boolean;
}

function CommentItem({
  comment, cacheKey, token, currentUserId, currentUserIsAdmin,
  animeId, episodeId, isReply = false,
}: CommentItemProps) {
  const { removeComment } = useCommentStore();
  const { isAuthenticated } = useAuthStore();
  const [replyOpen, setReplyOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = currentUserId === comment.userId;
  const canDelete = isOwner || currentUserIsAdmin === true;
  const accentColor = stringToColor(comment.username);

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    await removeComment(comment.id, cacheKey, token);
    setDeleting(false);
  };

  return (
    <li className={`flex gap-3 group cv-auto-sm ${isReply ? 'ml-10 mt-3' : ''}`}>
      {/* Vertical thread line for replies */}
      {isReply && (
        <div className="absolute -left-5 top-0 bottom-0 w-px bg-white/10" />
      )}

      <Avatar username={comment.username} avatarUrl={comment.avatarUrl} size={isReply ? 7 : 8} />

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-display font-semibold" style={{ color: accentColor }}>
            {comment.username}
          </span>
          {comment.isAdmin && (
            <span className="text-[9px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded-full leading-none">
              ADMIN
            </span>
          )}
          <span className="text-[11px] text-mute font-mono">{relativeTime(comment.createdAt)}</span>

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete"
              className="ml-auto opacity-0 group-hover:opacity-100 text-mute hover:text-red-400 transition-all text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
            >
              {deleting ? (
                <span className="w-3 h-3 border border-mute border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" strokeLinecap="round" />
                  <path d="M10 11v6M14 11v6" strokeLinecap="round" /><path d="M9 6V4h6v2" strokeLinecap="round" />
                </svg>
              )}
              Delete
            </button>
          )}
        </div>

        {/* Comment text */}
        <p className="text-sm text-body font-display leading-relaxed break-words">{comment.content}</p>

        {/* Actions */}
        {!isReply && (
          <button
            onClick={() => isAuthenticated ? setReplyOpen((v) => !v) : undefined}
            className={`mt-2 text-[11px] font-display flex items-center gap-1.5 transition-colors ${
              isAuthenticated
                ? 'text-mute hover:text-sunset cursor-pointer'
                : 'text-mute/40 cursor-default'
            }`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {comment.replies && comment.replies.length > 0 ? `${comment.replies.length} ${comment.replies.length === 1 ? 'Reply' : 'Replies'}` : 'Reply'}
          </button>
        )}

        {/* Replies list */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <ul className="mt-3 space-y-0 relative border-l border-white/10 pl-0">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                cacheKey={cacheKey}
                token={token}
                currentUserId={currentUserId}
                currentUserIsAdmin={currentUserIsAdmin}
                animeId={animeId}
                episodeId={episodeId}
                isReply
              />
            ))}
          </ul>
        )}

        {/* Inline reply form */}
        {replyOpen && (
          <ReplyForm
            parentId={comment.id}
            parentUsername={comment.username}
            animeId={animeId}
            episodeId={episodeId}
            onClose={() => setReplyOpen(false)}
          />
        )}
      </div>
    </li>
  );
}

// ── Main Component ─────────────────────────────────────────────

interface CommentSectionProps {
  animeId: string;
  episodeId?: string;
}

export function CommentSection({ animeId, episodeId }: CommentSectionProps) {
  const { user, token, isAuthenticated } = useAuthStore();
  const { commentsByAnime, isLoading, error, loadComments, addComment, clearError } = useCommentStore();

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const cacheKey = episodeId ?? animeId;
  const allComments = commentsByAnime[cacheKey] ?? [];
  // Only top-level comments (parentId null/undefined)
  const topLevel = allComments.filter((c) => !c.parentId);

  useEffect(() => {
    loadComments(animeId, episodeId);
  }, [animeId, episodeId, loadComments]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !token) return;
    setSubmitting(true);
    await addComment(
      { animeId, episodeId, content: text.trim() },
      token, user.id, user.username, user.avatar, user.isAdmin === true,
    );
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSubmitting(false);
  };

  const totalCount = topLevel.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0);

  return (
    <section id="comment-section" aria-label="Comments">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sunset">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="eyebrow-mono text-mute text-[10px] tracking-wider">COMMENTS</span>
        </div>
        <h2 className="display-sm text-ink">
          Discussion
          {totalCount > 0 && (
            <span className="text-body-mid text-base ml-2 font-normal">({totalCount})</span>
          )}
        </h2>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-[8px] px-4 py-3 mb-4 text-sm text-red-400 font-display">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
          </svg>
          {error}
          <button onClick={clearError} className="ml-auto text-mute hover:text-ink transition-colors cursor-pointer" aria-label="Close">✕</button>
        </div>
      )}

      {/* Comment Form */}
      {isAuthenticated && user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-8 items-start" aria-label="Comment form">
          <div className="shrink-0 mt-0.5">
            <Avatar username={user.username} avatarUrl={user.avatar} size={8} />
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              id="comment-input"
              value={text}
              onChange={handleTextChange}
              placeholder={`Write a comment, ${user.username}…`}
              rows={1}
              maxLength={500}
              disabled={submitting}
              className="w-full bg-canvas-soft border border-hairline hover:border-white/20 focus:border-white/30 rounded-[8px] px-4 py-3 text-sm text-ink font-display placeholder:text-mute resize-none outline-none transition-colors leading-relaxed"
              style={{ minHeight: '48px' }}
            />
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[11px] text-mute font-mono">{text.length}/500</span>
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="inline-flex items-center gap-2 bg-white text-black hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed font-display font-medium text-xs px-5 py-2 rounded-full transition-all cursor-pointer shadow-lg"
              >
                {submitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Posting…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Post
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-4 bg-canvas-card border border-hairline rounded-[10px] px-5 py-4 mb-8">
          <div className="w-9 h-9 rounded-full bg-sunset/15 text-sunset border border-sunset/30 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-ink font-display font-medium">Want to join the discussion?</p>
            <p className="text-xs text-mute font-display">Sign in to your account to post a comment.</p>
          </div>
          <Link to="/login" className="shrink-0 bg-white text-black hover:bg-white/90 font-display font-medium text-xs px-4 py-2 rounded-full transition-colors">
            Sign In
          </Link>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => <CommentSkeleton key={i} />)}
        </div>
      ) : topLevel.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-12 h-12 rounded-full bg-canvas-card border border-hairline flex items-center justify-center mb-3 text-mute">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-ink font-display font-medium mb-1">No comments yet</p>
          <p className="text-xs text-mute font-display">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <ul className="space-y-6" role="list">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              cacheKey={cacheKey}
              token={token}
              currentUserId={user?.id}
              currentUserIsAdmin={user?.role === 'admin' || user?.isAdmin === true}
              animeId={animeId}
              episodeId={episodeId}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
