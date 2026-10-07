import { useThemeStore, type ThemeMode } from '@/store/useThemeStore';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'compact';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  const getIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        );
      case 'amoled':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16v16z" />
          </svg>
        );
      default: // dark
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        );
    }
  };

  const getLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'amoled':
        return 'AMOLED';
      default:
        return 'Dark';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center bg-canvas-soft border border-hairline rounded-full p-0.5 ${className}`}>
        {(['dark', 'light', 'amoled'] as ThemeMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setTheme(m)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-display rounded-full transition-all cursor-pointer ${
              theme === m
                ? 'bg-sunset text-white font-medium shadow-sm'
                : 'text-body-mid hover:text-ink'
            }`}
            title={`Tema ${getLabel(m)}`}
          >
            {getIcon(m)}
            <span className="capitalize text-[11px]">{getLabel(m)}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer text-body-mid hover:text-ink ${className}`}
      title={`Tema: ${getLabel(theme)} (Klik ganti: Dark / Light / AMOLED)`}
      aria-label={`Toggle theme, current is ${getLabel(theme)}`}
    >
      {getIcon(theme)}
    </button>
  );
}
