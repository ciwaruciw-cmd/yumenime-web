import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, DEFAULT_FAVORITE_CHARACTERS } from '@/store/useAuthStore';
import { useWatchlist } from '@/hooks/useWatchlist';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { AnimeGrid } from '@/components/anime/AnimeGrid';
import { AddCharacterModal } from '@/components/profile/AddCharacterModal';
import { formatDate } from '@/utils/formatDate';
import { isAdminEmail } from '@/config/adminConfig';
import type { FavoriteCharacter } from '@/types/user';

export const PRESET_GIF_AVATARS = [
  {
    name: 'Anya Heh',
    url: 'https://i.imgur.com/d4ZXvVf.gif',
  },
  {
    name: 'Bocchi Rock',
    url: 'https://i.imgur.com/YIeHXaN.gif',
  },
  {
    name: 'Nezuko Spin',
    url: 'https://i.imgur.com/7cjTzqM.gif',
  },
  {
    name: 'Totoro Wave',
    url: 'https://i.imgur.com/S7ztzHM.gif',
  },
  {
    name: 'Pikachu Run',
    url: 'https://i.imgur.com/aJERKw1.gif',
  },
  {
    name: 'Kawaii Cat',
    url: 'https://i.imgur.com/aCz5iAT.gif',
  },
];

export const isGifAvatar = (url?: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().includes('.gif') || url.startsWith('data:image/gif');
};

/**
 * User Profile Page — account details, favorite characters, watchlist overview, edit profile settings.
 * Supports direct image & GIF pick from device gallery via FileReader and custom GIF URLs.
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, addFavoriteCharacter, removeFavoriteCharacter, logout } = useAuthStore();
  const { watchlistAnimes, count } = useWatchlist();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'characters' | 'watchlist' | 'settings'>('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Edit profile form state
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthenticated || !user) {
    return (
      <div className="page-enter pt-20 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mute">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="display-sm text-ink mb-2">User Profile</h1>
        <p className="text-body text-sm font-display mb-6 max-w-xs">
          Please sign in first to access your profile page.
        </p>
        <div className="flex gap-3">
          <Link to="/login">
            <Button variant="primary" size="lg">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="lg">Sign Up</Button>
          </Link>
        </div>
      </div>
    );
  }

  const favoriteCharacters: FavoriteCharacter[] = user.favoriteCharacters || DEFAULT_FAVORITE_CHARACTERS;
  const favCharCount = favoriteCharacters.length;

  // Handle picking avatar (image / animated GIF) from device gallery/files
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.gif')) {
        alert('Please select an image or GIF file (GIF, JPG, PNG, WEBP)');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        alert('File size too large. Maximum 15MB for GIF / image files.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const base64Data = reader.result as string;
          setAvatar(base64Data);
          updateProfile({ avatar: base64Data });
          setSuccessMsg('Profile picture / GIF animation updated from gallery!');
          setTimeout(() => setSuccessMsg(''), 3500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({
      username,
      email,
      avatar: avatar.trim() ? avatar : `https://picsum.photos/seed/${user.id}/120/120`,
    });
    setSuccessMsg('Profile updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAddCharacter = (charData: Omit<FavoriteCharacter, 'id'>) => {
    if (favCharCount >= 15) {
      alert('Maximum limit of 15 favorite characters reached!');
      return;
    }
    addFavoriteCharacter(charData);
    setSuccessMsg(`Character ${charData.name} added to your favorites!`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleRemoveCharacter = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from your favorite characters?`)) {
      removeFavoriteCharacter(id);
      setSuccessMsg(`${name} removed successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="page-enter pt-20 pb-16 min-h-screen">
      {/* Hidden file input for gallery picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Modal Tambah Karakter Favorit */}
      <AddCharacterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCharacter={handleAddCharacter}
        currentCount={favCharCount}
      />

      <div className="max-w-[1280px] mx-auto px-6">
        
        {/* Profile Header Card */}
        <div className="bg-canvas-card border border-hairline rounded-[8px] p-6 md:p-8 mb-8 relative overflow-hidden">
          {/* Accent decoration overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(255,122,23,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar with click-to-upload badge */}
            <div className="relative group shrink-0 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={avatar || user.avatar || `https://picsum.photos/seed/${user.id}/120/120`}
                alt={user.username}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-hairline object-cover shadow-xl group-hover:opacity-80 transition-opacity"
              />
              {isGifAvatar(avatar || user.avatar) && (
                <span className="absolute top-0 left-0 bg-sunset text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow-md z-10">
                  GIF
                </span>
              )}
              {/* Overlay camera badge */}
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-display flex flex-col items-center gap-1 text-center px-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  Change Photo / GIF
                </span>
              </div>
              <span className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-canvas-card" title="Online" />
            </div>

            {/* User Meta */}
            <div className="text-center sm:text-left flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                <h1 className="display-sm text-ink">{user.username}</h1>
                {(user.role === 'admin' || user.isAdmin === true || isAdminEmail(user.email)) && (
                  <Badge variant="danger" size="md">ADMIN</Badge>
                )}
                <Badge variant="sunset" size="md">VIP MEMBER</Badge>
              </div>

              <p className="text-sm font-mono text-mute">{user.email}</p>

              <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-body font-display flex-wrap">
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Joined {formatDate(user.createdAt)}
                </span>
                <span className="text-hairline">·</span>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                  </svg>
                  {count} Saved Anime
                </span>
                <span className="text-hairline">·</span>
                <span className="flex items-center gap-1.5 text-sunset font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {favCharCount}/15 Favorite Characters
                </span>
              </div>
            </div>

            {/* Logout button */}
            <div className="shrink-0 flex flex-col gap-2">
              <Button
                variant="outline-sm"
                size="sm"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                }
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Global Toast Notification */}
        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-[8px] px-4 py-3 mb-6 animate-fade-in flex items-center justify-between">
            <p className="text-green-400 text-xs font-display font-medium">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="text-green-400 text-xs hover:text-white">✕</button>
          </div>
        )}

        {/* Profile Tabs */}
        <div className="flex gap-2 border-b border-hairline mb-8 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'characters', label: `Favorite Characters (${favCharCount}/15)` },
            { id: 'watchlist', label: `Watchlist (${count})` },
            { id: 'settings', label: 'Profile Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-display rounded-t-[6px] border-b-2 transition-colors duration-150 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-sunset text-ink bg-white/5 font-medium'
                  : 'border-transparent text-mute hover:text-body hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Quick stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sunset/10 border border-sunset/30 flex items-center justify-center text-sunset">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="eyebrow-mono text-mute">WATCHLIST</p>
                    <p className="display-sm text-ink">{count} <span className="text-xs text-body font-display">anime</span></p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="eyebrow-mono text-mute">FAV CHARACTERS</p>
                    <p className="display-sm text-ink">{favCharCount} <span className="text-xs text-body font-display">characters</span></p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-twilight/10 border border-twilight/30 flex items-center justify-center text-twilight">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="eyebrow-mono text-mute">ACCOUNT STATUS</p>
                    <p className="text-sm font-display text-ink font-medium">
                      {(user.role === 'admin' || user.isAdmin === true || isAdminEmail(user.email)) ? (
                        <span className="text-red-400 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                          Administrator
                        </span>
                      ) : (
                        'VIP Subscriber'
                      )}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-breeze/10 border border-breeze/30 flex items-center justify-center text-breeze">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="eyebrow-mono text-mute">WATCH TIME</p>
                    <p className="text-sm font-display text-ink font-medium">0 Mins</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Favorite Characters Preview Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="eyebrow-mono text-sunset block mb-1">FAVORITES</span>
                  <h2 className="display-sm text-ink">Favorite Anime Characters</h2>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                    + Add Character
                  </Button>
                  {favCharCount > 0 && (
                    <Button variant="outline-sm" size="sm" onClick={() => setActiveTab('characters')}>
                      View All ({favCharCount})
                    </Button>
                  )}
                </div>
              </div>

              {favCharCount > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {favoriteCharacters.slice(0, 4).map((char, index) => (
                    <div
                      key={char.id}
                      className="bg-canvas-card border border-hairline hover:border-sunset/40 rounded-[10px] p-4 flex gap-3 relative group transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={char.image}
                          alt={char.name}
                          className="w-16 h-16 rounded-full object-cover border border-hairline shadow-md"
                        />
                        <span className="absolute -top-1 -left-1 bg-sunset text-white text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center border border-canvas-card">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-display font-bold text-ink truncate group-hover:text-sunset transition-colors">
                          {char.name}
                        </h3>
                        <p className="text-xs text-mute font-display truncate mb-1">
                          {char.animeName}
                        </p>
                        {char.role && (
                          <span className="inline-block text-[10px] font-mono bg-canvas-soft border border-hairline text-body px-2 py-0.5 rounded-full">
                            {char.role}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveCharacter(char.id, char.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-mute hover:text-red-400 p-1"
                        title="Remove Character"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-10">
                  <p className="text-body text-sm font-display mb-3">No favorite characters saved yet.</p>
                  <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)}>
                    + Add First Character
                  </Button>
                </Card>
              )}
            </div>

            {/* Saved anime preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="eyebrow-mono text-mute block mb-1">COLLECTION</span>
                  <h2 className="display-sm text-ink">Recent Watchlist</h2>
                </div>
                {count > 0 && (
                  <Button variant="outline-sm" size="sm" onClick={() => setActiveTab('watchlist')}>
                    View All ({count})
                  </Button>
                )}
              </div>

              {count > 0 ? (
                <AnimeGrid animes={watchlistAnimes.slice(0, 5)} />
              ) : (
                <Card className="text-center py-12">
                  <p className="text-body text-sm font-display mb-3">No anime in your watchlist yet.</p>
                  <Link to="/anime">
                    <Button variant="outline-sm" size="sm">Explore Anime</Button>
                  </Link>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: Favorite Characters Full List */}
        {activeTab === 'characters' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-canvas-card border border-hairline rounded-[8px] p-5">
              <div>
                <h2 className="display-sm text-ink text-xl font-bold">Your Favorite Anime Characters</h2>
                <p className="text-xs text-mute font-display mt-0.5">
                  Your handpicked list of top anime characters.
                </p>
              </div>
              <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
                + Add New Character
              </Button>
            </div>

            {favCharCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {favoriteCharacters.map((char, index) => (
                  <div
                    key={char.id}
                    className="bg-canvas-card border border-hairline hover:border-sunset/50 rounded-[12px] p-5 flex flex-col justify-between relative group transition-all duration-200 hover:-translate-y-1 shadow-md"
                  >
                    <div>
                      <div className="flex items-start gap-4 mb-3">
                        <div className="relative shrink-0">
                          <img
                            src={char.image}
                            alt={char.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-hairline group-hover:border-sunset/60 transition-colors shadow-lg"
                          />
                          <span className="absolute -top-1 -left-1 bg-sunset text-white text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-canvas-card">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="text-base font-display font-bold text-ink group-hover:text-sunset transition-colors leading-tight">
                            {char.name}
                          </h3>
                          <p className="text-xs text-mute font-display font-medium mt-0.5">
                            {char.animeName}
                          </p>
                          {char.role && (
                            <span className="inline-block mt-2 text-[10px] font-mono bg-sunset/10 border border-sunset/30 text-sunset px-2.5 py-0.5 rounded-full font-medium">
                              {char.role}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveCharacter(char.id, char.name)}
                          className="opacity-60 group-hover:opacity-100 hover:text-red-400 text-mute transition-all p-1"
                          title="Remove Character"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>

                      {char.description && (
                        <div className="mt-3 pt-3 border-t border-hairline bg-canvas-soft/50 rounded-[6px] p-3 text-xs text-body italic font-display relative">
                          "{char.description}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-sunset/10 border border-sunset/30 flex items-center justify-center text-sunset">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <h3 className="display-sm text-ink text-base mb-2">No favorite characters yet</h3>
                <p className="text-body text-sm font-display mb-6 max-w-sm mx-auto">
                  Add your favorite anime characters to display them on your profile!
                </p>
                <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
                  + Add Favorite Character
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Tab Content 3: Watchlist */}
        {activeTab === 'watchlist' && (
          <div className="animate-fade-in-up">
            <AnimeGrid
              animes={watchlistAnimes}
              emptyMessage="No anime saved in your watchlist yet."
            />
          </div>
        )}

        {/* Tab Content 4: Settings */}
        {activeTab === 'settings' && (
          <div className="max-w-xl animate-fade-in-up">
            <Card>
              <h2 className="display-sm text-ink mb-2">Edit Profile</h2>
              <p className="text-xs text-body font-display mb-6">Update your profile picture, username, and account email.</p>

              {/* Avatar Uploader Section */}
              <div className="mb-6 p-4 bg-canvas-soft border border-hairline rounded-[8px] space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={avatar || user.avatar || `https://picsum.photos/seed/${user.id}/80/80`}
                      alt="Preview Avatar"
                      className="w-16 h-16 rounded-full border border-hairline object-cover"
                    />
                    {isGifAvatar(avatar || user.avatar) && (
                      <span className="absolute -top-1 -right-1 bg-sunset text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full shadow">
                        GIF
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <p className="text-xs font-display text-ink font-medium">Profile Picture / GIF Animation</p>
                    <p className="text-[11px] text-mute font-display">
                      Supports animated GIF, JPG, PNG, WEBP from gallery or online URL.
                    </p>
                    <Button
                      type="button"
                      variant="outline-sm"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      }
                    >
                      Choose Photo / GIF from Gallery
                    </Button>
                  </div>
                </div>

                {/* Preset Anime GIF Quick Picker */}
                <div className="pt-3 border-t border-hairline">
                  <p className="text-[11px] font-mono text-mute mb-2 uppercase tracking-wider">
                    Choose Popular Animated GIF Presets:
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {PRESET_GIF_AVATARS.map((gif) => (
                      <button
                        key={gif.name}
                        type="button"
                        onClick={() => {
                          setAvatar(gif.url);
                          updateProfile({ avatar: gif.url });
                          setSuccessMsg(`Preset GIF ${gif.name} selected!`);
                          setTimeout(() => setSuccessMsg(''), 3000);
                        }}
                        className={`group relative rounded-[6px] overflow-hidden border p-1 transition-all ${
                          avatar === gif.url
                            ? 'border-sunset bg-sunset/10 ring-2 ring-sunset/30'
                            : 'border-hairline hover:border-white/30 bg-black/20'
                        }`}
                        title={gif.name}
                      >
                        <img
                          src={gif.url}
                          alt={gif.name}
                          className="w-full aspect-square rounded-[4px] object-cover"
                        />
                        <span className="block text-[9px] font-display text-mute group-hover:text-ink truncate mt-1 text-center">
                          {gif.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom GIF URL Input */}
                <div className="pt-3 border-t border-hairline">
                  <label className="block text-[11px] font-mono text-mute mb-1 uppercase tracking-wider">
                    Or Enter Image / Animated GIF URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://media.tenor.com/... or direct .gif link"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="flex-1 bg-canvas text-body text-xs font-mono border border-hairline rounded-[6px] px-3 py-1.5 outline-none focus:border-sunset transition-colors"
                    />
                    {avatar && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAvatar('')}
                        className="text-xs text-mute hover:text-ink"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className="pt-2 flex gap-3">
                  <Button type="submit" variant="primary" size="md">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setUsername(user.username);
                      setEmail(user.email);
                      setAvatar(user.avatar ?? '');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

      </div>
    </div>
  );
}
