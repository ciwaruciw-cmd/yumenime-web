import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'amoled';

interface ThemeStore {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  
  // Update meta theme-color for mobile address bar
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    if (theme === 'light') {
      metaThemeColor.setAttribute('content', '#f8fafc');
    } else if (theme === 'amoled') {
      metaThemeColor.setAttribute('content', '#000000');
    } else {
      metaThemeColor.setAttribute('content', '#0a0a0a');
    }
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const current = get().theme;
        const next: ThemeMode = current === 'dark' ? 'light' : current === 'light' ? 'amoled' : 'dark';
        applyThemeToDocument(next);
        set({ theme: next });
      },
    }),
    {
      name: 'yumenime-theme',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
      },
    }
  )
);

// Initialize on script execution
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('yumenime-theme');
    const parsed = saved ? JSON.parse(saved)?.state?.theme : 'dark';
    applyThemeToDocument(parsed || 'dark');
  } catch {
    applyThemeToDocument('dark');
  }
}
