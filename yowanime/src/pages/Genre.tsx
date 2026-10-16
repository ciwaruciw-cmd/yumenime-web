import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AgeVerificationModal } from '@/components/common/AgeVerificationModal';
import { GENRE_ITEMS } from '@/data/genres';

/**
 * Genre list page — all genres as pill cards.
 * Genre list now uses Otakudesu genre slugs for navigation.
 */
export default function Genre() {
  const navigate = useNavigate();
  const [showAgeModal, setShowAgeModal] = useState(false);

  const handleGenreClick = (e: React.MouseEvent, name: string) => {
    if (name.toLowerCase() === 'hentai') {
      const isVerified = sessionStorage.getItem('age_verified_18') === 'true';
      if (!isVerified) {
        e.preventDefault();
        setShowAgeModal(true);
      }
    }
  };

  const handleConfirmAge = () => {
    sessionStorage.setItem('age_verified_18', 'true');
    setShowAgeModal(false);
    navigate('/anime?genre=Hentai');
  };

  const handleCancelAge = () => {
    setShowAgeModal(false);
  };

  return (
    <div className="page-enter pt-14 sm:pt-20 pb-24 min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <span className="eyebrow-mono text-mute block mb-1">BROWSE</span>
          <h1 className="display-md text-ink">All Genres</h1>
          <p className="text-body text-sm font-display mt-2">
            Explore anime by your favorite genre
          </p>
        </div>

        {/* Genre grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {GENRE_ITEMS.map(({ name, slug }) => (
            <Link
              key={name}
              to={`/anime?genre=${encodeURIComponent(name)}`}
              onClick={(e) => handleGenreClick(e, name)}
              className="group bg-canvas-card rounded-[8px] p-5 hover:bg-canvas-soft transition-all duration-200"
            >
              <h2 className="text-sm font-display text-ink group-hover:text-ink mb-1">
                {name}
              </h2>
              <p className="text-[10px] font-mono text-mute uppercase tracking-wider">
                {slug}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* 18+ Age Verification Warning Alert Modal */}
      <AgeVerificationModal
        isOpen={showAgeModal}
        onConfirm={handleConfirmAge}
        onCancel={handleCancelAge}
      />
    </div>
  );
}
