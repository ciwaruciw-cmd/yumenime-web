import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { FavoriteCharacter } from '@/types/user';

interface AddCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCharacter: (character: Omit<FavoriteCharacter, 'id'>) => void;
  currentCount?: number;
}

export const PRESET_CHARACTERS: Omit<FavoriteCharacter, 'id'>[] = [
  {
    name: 'Gojo Satoru',
    animeName: 'Jujutsu Kaisen',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b126446-TwtlBtf95t62.png',
    description: 'The strongest Jujutsu sorcerer possessing the Limitless and Six Eyes.',
  },
  {
    name: 'Eren Yeager',
    animeName: 'Attack on Titan',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40882-dsj7IP943WFF.jpg',
    description: 'The Attack Titan inheritor relentlessly advancing toward freedom.',
  },
  {
    name: 'Monkey D. Luffy',
    animeName: 'One Piece',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40-T4sF1a94Xm36.png',
    description: 'Captain of the Straw Hat Pirates determined to become the Pirate King.',
  },
  {
    name: 'Levi Ackerman',
    animeName: 'Attack on Titan',
    role: 'Supporting',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b45627-CR68RyZmddGG.png',
    description: "Humanity's strongest soldier from the Survey Corps.",
  },
  {
    name: 'Tanjiro Kamado',
    animeName: 'Demon Slayer',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b126071-w4tH0aLspY5d.png',
    description: 'Kind-hearted demon slayer mastering Water & Sun Breathing styles.',
  },
  {
    name: 'Anya Forger',
    animeName: 'Spy x Family',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b143761-l5zLlsrDkS9p.png',
    description: 'Telepathic peanut-loving daughter bringing the Forger family together.',
  },
  {
    name: 'Roronoa Zoro',
    animeName: 'One Piece',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b62-p70gsp4s2K0K.png',
    description: "Three-sword style swordsman striving to become world's greatest.",
  },
  {
    name: 'Mikasa Ackerman',
    animeName: 'Attack on Titan',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b40881-F3gr1PkreDvj.png',
    description: 'Elite soldier ready to risk everything to protect Eren.',
  },
  {
    name: 'Megumi Fushiguro',
    animeName: 'Jujutsu Kaisen',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b127457-3pW9vW7H1oWw.png',
    description: 'Ten Shadows technique user with immense potential.',
  },
  {
    name: 'Rem',
    animeName: 'Re:Zero',
    role: 'Supporting',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b88572-cuh8nQf92P1w.png',
    description: 'Devoted blue-haired demon maid full of affection.',
  },
  {
    name: 'Killua Zoldyck',
    animeName: 'Hunter x Hunter',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b27-k7P5W3Y4X45x.png',
    description: 'Prodigious assassin from the Zoldyck family wielding lightning.',
  },
  {
    name: 'Saitama',
    animeName: 'One Punch Man',
    role: 'Main Character',
    image: 'https://s4.anilist.co/file/anilistcdn/character/large/b83797-h7bN1Yx6S61w.png',
    description: 'A hero for fun who can defeat any opponent with a single punch.',
  },
];

export function AddCharacterModal({ isOpen, onClose, onAddCharacter, currentCount = 0 }: AddCharacterModalProps) {
  const [tab, setTab] = useState<'preset' | 'custom'>('preset');

  // Custom Form state
  const [name, setName] = useState('');
  const [animeName, setAnimeName] = useState('');
  const [role, setRole] = useState('Main Character');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isLimitReached = currentCount >= 15;

  const handleSelectPreset = (preset: Omit<FavoriteCharacter, 'id'>) => {
    if (isLimitReached) {
      alert('Maximum limit of 15 favorite characters reached!');
      return;
    }
    onAddCharacter(preset);
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, WEBP)');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitCustom = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !animeName.trim()) {
      alert('Character Name and Anime Title are required!');
      return;
    }
    const finalImage = image.trim()
      ? image
      : `https://picsum.photos/seed/${encodeURIComponent(name)}/200/200`;

    onAddCharacter({
      name: name.trim(),
      animeName: animeName.trim(),
      role: role.trim() || 'Main Character',
      description: description.trim() || undefined,
      image: finalImage,
    });

    // Reset form
    setName('');
    setAnimeName('');
    setRole('Main Character');
    setDescription('');
    setImage('');

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in">
      <div className="bg-canvas-card border border-hairline rounded-[12px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-hairline flex items-center justify-between bg-canvas-soft">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="display-sm text-ink text-lg font-bold">Add Favorite Character</h2>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${isLimitReached ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-sunset/10 text-sunset border-sunset/20'}`}>
                {currentCount}/15
              </span>
            </div>
            <p className="text-xs text-mute font-display">
              Choose from popular characters or add your own custom character (Maximum 15 characters).
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-mute hover:text-ink p-1 rounded-md transition-colors"
            title="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Warning if limit reached */}
        {isLimitReached && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between">
            <p className="text-red-400 text-xs font-display flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Maximum limit of 15 favorite characters reached. Remove some characters to add new ones.
            </p>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex border-b border-hairline bg-canvas-card px-6 pt-3 gap-2">
          <button
            onClick={() => setTab('preset')}
            className={`pb-2.5 px-4 text-xs font-display font-medium border-b-2 transition-colors ${
              tab === 'preset'
                ? 'border-sunset text-ink'
                : 'border-transparent text-mute hover:text-body'
            }`}
          >
            Popular Characters
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`pb-2.5 px-4 text-xs font-display font-medium border-b-2 transition-colors ${
              tab === 'custom'
                ? 'border-sunset text-ink'
                : 'border-transparent text-mute hover:text-body'
            }`}
          >
            Custom Character
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'preset' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_CHARACTERS.map((preset) => (
                <div
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset)}
                  className="bg-canvas-soft hover:bg-white/5 border border-hairline hover:border-sunset/50 rounded-[8px] p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-200 group hover:-translate-y-0.5"
                >
                  <img
                    src={preset.image}
                    alt={preset.name}
                    className="w-16 h-16 rounded-full object-cover border border-hairline mb-2 group-hover:scale-105 transition-transform"
                  />
                  <p className="text-xs font-display font-semibold text-ink line-clamp-1 group-hover:text-sunset transition-colors">
                    {preset.name}
                  </p>
                  <p className="text-[11px] text-mute font-display line-clamp-1">
                    {preset.animeName}
                  </p>
                  <span className="mt-2 text-[10px] bg-sunset/10 text-sunset px-2 py-0.5 rounded-full border border-sunset/20 font-mono">
                    + Add
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmitCustom} className="space-y-4">
              <Input
                label="Character Name *"
                type="text"
                placeholder="e.g., Gojo Satoru"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Anime Title *"
                type="text"
                placeholder="e.g., Jujutsu Kaisen"
                value={animeName}
                onChange={(e) => setAnimeName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-display text-mute uppercase tracking-wider">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-canvas-soft border border-hairline rounded-[6px] px-3 py-2 text-sm text-ink focus:outline-none focus:border-sunset"
                >
                  <option value="Main Character">Main Character</option>
                  <option value="Supporting">Supporting Character</option>
                  <option value="Antagonist">Antagonist / Villain</option>
                  <option value="Mentor">Mentor / Teacher</option>
                  <option value="Mascot">Mascot</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-display text-mute uppercase tracking-wider">Description / Favorite Quote</label>
                <textarea
                  rows={3}
                  placeholder="Write why you love this character or your favorite quote..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-canvas-soft border border-hairline rounded-[6px] p-3 text-sm text-ink focus:outline-none focus:border-sunset resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-display text-mute uppercase tracking-wider">Character Image</label>
                <div className="flex items-center gap-4">
                  <img
                    src={image || `https://picsum.photos/seed/${encodeURIComponent(name || 'preview')}/80/80`}
                    alt="Preview"
                    className="w-14 h-14 rounded-full border border-hairline object-cover shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline-sm"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        icon={
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        }
                      >
                        Choose from Gallery
                      </Button>
                    </div>
                    <Input
                      type="url"
                      placeholder="Or enter image URL..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-hairline">
                <Button type="button" variant="outline" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Save Character
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
