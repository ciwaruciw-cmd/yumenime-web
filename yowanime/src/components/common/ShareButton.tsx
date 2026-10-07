/**
 * ShareButton — copy link or use Web Share API.
 */
import { useState } from 'react';

interface Props {
  title: string;
  text?: string;
  className?: string;
  iconOnly?: boolean;
}

export function ShareButton({ title, text, className = '', iconOnly = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: text ?? title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User cancelled or not supported
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 text-xs font-display text-mute hover:text-ink transition-colors cursor-pointer rounded-lg px-3 py-2 hover:bg-white/5 border border-transparent hover:border-white/10 ${className}`}
      aria-label="Share"
      id="share-btn"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" strokeLinecap="round" />
          </svg>
          {!iconOnly && <span>Link Copied!</span>}
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          {!iconOnly && <span>Share</span>}
        </>
      )}
    </button>
  );
}
