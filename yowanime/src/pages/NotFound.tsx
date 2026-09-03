import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

/**
 * 404 Not Found page.
 * display-xl "404" with outline pill home button.
 */
export default function NotFound() {
  return (
    <div className="page-enter pt-14 min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* 404 number */}
      <h1 className="display-xl text-ink mb-2" style={{ fontSize: 'clamp(80px, 20vw, 160px)' }}>
        404
      </h1>

      <p className="eyebrow-mono text-mute mb-2">PAGE NOT FOUND</p>
      <p className="text-body text-sm font-display mb-6 max-w-sm">
        The page you're looking for does not exist or has been moved.
        Maybe this anime hasn't aired yet?
      </p>

      <div className="flex gap-3">
        <Link to="/">
          <Button variant="outline" size="lg" icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }>
            Back to Home
          </Button>
        </Link>
        <Link to="/anime">
          <Button variant="outline" size="lg">
            Explore Anime
          </Button>
        </Link>
      </div>
    </div>
  );
}
