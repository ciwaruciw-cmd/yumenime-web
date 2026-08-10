import { useState } from 'react';
import type { AnimeCharacter } from '@/types/anime';
import { useAuthStore } from '@/store/useAuthStore';
import { Badge } from '@/components/ui/Badge';

interface CharacterSectionProps {
  characters: AnimeCharacter[];
  animeTitle: string;
}

function CharacterAvatar({ src, name, role }: { src: string; name: string; role: string }) {
  const [error, setError] = useState(false);

  // Fallback initial avatar generator
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="relative shrink-0 w-20 h-20 rounded-[8px] overflow-hidden border border-hairline bg-canvas-soft shadow-md group-hover:scale-105 transition-transform">
      {!error && src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-canvas-soft to-canvas-mid text-sunset">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-0.5 opacity-80">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[10px] font-bold font-mono text-ink">{initials}</span>
        </div>
      )}
      <span className="absolute bottom-1 right-1">
        <Badge
          variant={role === 'Main' ? 'sunset' : role === 'Antagonist' ? 'dusk' : 'outline'}
          size="sm"
        >
          {role}
        </Badge>
      </span>
    </div>
  );
}

export function CharacterSection({ characters, animeTitle }: CharacterSectionProps) {
  const { user, isAuthenticated, addFavoriteCharacter } = useAuthStore();
  const [toastMsg, setToastMsg] = useState('');

  if (!characters || characters.length === 0) return null;

  const handleAddToProfile = (char: AnimeCharacter) => {
    if (!isAuthenticated || !user) {
      alert('Silakan masuk (login) terlebih dahulu untuk menambah karakter ke profil!');
      return;
    }

    addFavoriteCharacter({
      name: char.name,
      animeName: animeTitle,
      role: char.role === 'Main' ? 'Main Character' : char.role === 'Supporting' ? 'Supporting' : 'Antagonist',
      image: char.image,
      description: char.voiceActor ? `Pengisi suara: ${char.voiceActor.name}` : undefined,
    });

    setToastMsg(`${char.name} berhasil ditambahkan ke karakter favorit profilmu!`);
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-sunset/15 border border-sunset/40 text-ink text-xs font-display p-3 rounded-[8px] animate-fade-in flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="text-mute hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="eyebrow-mono text-sunset block mb-1">PENGISI SUARA & KARAKTER</span>
          <h2 className="display-sm text-ink text-xl font-bold flex items-center gap-2">
            Karakter Anime
            <span className="text-body-mid text-sm font-normal">({characters.length})</span>
          </h2>
        </div>
      </div>

      {/* Characters Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((char) => (
          <div
            key={char.id}
            className="bg-canvas-card border border-hairline hover:border-sunset/40 rounded-[10px] p-4 flex gap-4 transition-all duration-200 group hover:-translate-y-0.5 relative overflow-hidden"
          >
            {/* Character Image Avatar */}
            <CharacterAvatar src={char.image} name={char.name} role={char.role} />

            {/* Character & Voice Actor Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-ink group-hover:text-sunset transition-colors truncate">
                  {char.name}
                </h3>
                {char.japaneseName && (
                  <p className="text-[11px] text-mute font-display truncate">
                    {char.japaneseName}
                  </p>
                )}
              </div>

              {/* Seiyuu / Voice Actor */}
              {char.voiceActor && (
                <div className="mt-2 pt-2 border-t border-hairline flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {char.voiceActor.image ? (
                      <img
                        src={char.voiceActor.image}
                        alt={char.voiceActor.name}
                        className="w-5 h-5 rounded-full object-cover border border-hairline shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-[9px] font-mono text-mute shrink-0">
                        VA
                      </div>
                    )}
                    <span className="text-body text-[11px] font-display truncate" title={`Seiyuu: ${char.voiceActor.name}`}>
                      {char.voiceActor.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Add to Profile Fav Characters Button */}
              <button
                onClick={() => handleAddToProfile(char)}
                className="mt-2 text-[10px] font-mono text-sunset hover:text-white bg-sunset/10 hover:bg-sunset border border-sunset/30 px-2.5 py-1 rounded-[6px] transition-all flex items-center justify-center gap-1 w-full"
                title="Tambah ke Karakter Favorit di Profil"
              >
                + Tambah ke Profil
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
