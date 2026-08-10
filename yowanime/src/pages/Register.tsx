import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Register page — same chrome as Login with username field.
 */
export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Password tidak cocok.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter.');
      return;
    }

    await register({ username, email, password });
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/');
    }
  };

  const displayError = localError || error;

  return (
    <div className="page-enter pt-20 min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="bg-canvas-soft border border-hairline rounded-[8px] p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="eyebrow-mono text-mute block mb-2">AKUN BARU</span>
            <h1 className="display-sm text-ink">Daftar</h1>
            <p className="text-sm text-body font-display mt-1">
              Buat akun untuk fitur watchlist dan lainnya
            </p>
          </div>

          {/* Error */}
          {displayError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-[8px] px-4 py-2 mb-4">
              <p className="text-red-400 text-xs font-display">{displayError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="animekun"
              value={username}
              onChange={(e) => { setUsername(e.target.value); clearError(); setLocalError(''); }}
              required
              autoComplete="username"
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); setLocalError(''); }}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); setLocalError(''); }}
              required
              autoComplete="new-password"
            />
            <Input
              label="Konfirmasi Password"
              type="password"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(''); }}
              required
              autoComplete="new-password"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              Buat Akun
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-body font-display mt-5">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-sunset hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
