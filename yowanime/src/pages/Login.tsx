import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Login page — auth-form-card style.
 * canvas-soft bg, hairline border, pill submit.
 */
export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
    // If login succeeds, store will update isAuthenticated
    if (useAuthStore.getState().isAuthenticated) {
      navigate('/');
    }
  };

  return (
    <div className="page-enter pt-20 min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-canvas-soft border border-hairline rounded-[8px] p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="eyebrow-mono text-mute block mb-2">ACCOUNT</span>
            <h1 className="display-sm text-ink">Sign In</h1>
            <p className="text-sm text-body font-display mt-1">
              Sign in to access your watchlist and history
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-[8px] px-4 py-2 mb-4">
              <p className="text-red-400 text-xs font-display">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-canvas border border-hairline rounded-[8px]">
            <p className="text-[10px] font-mono text-mute uppercase tracking-wider mb-1">DEMO LOGIN</p>
            <p className="text-xs text-body font-display">
              Email: <code className="text-sunset font-mono">test@test.com</code><br />
              Password: <code className="text-sunset font-mono">password</code>
            </p>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-body font-display mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-sunset hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
