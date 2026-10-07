import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      setCanInstall(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (deferredPrompt) {
      setCanInstall(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        setCanInstall(false);
        setIsInstalled(true);
        return true;
      }
    } catch (err) {
      console.warn('[PWA] Prompt error:', err);
    }
    return false;
  };

  return { canInstall, isInstalled, triggerInstall };
}

/**
 * PWA Install Banner — shows a modern, non-intrusive bottom banner on mobile/desktop
 */
export function PWAInstallPrompt() {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('yumenime-pwa-dismissed');
    if (isDismissed) setDismissed(true);
  }, []);

  if (!canInstall || isInstalled || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('yumenime-pwa-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-fade-in-up">
      <div className="bg-[#14161a] sm:bg-[#14161a]/95 sm:backdrop-blur-xl border border-white/15 p-3.5 rounded-[14px] shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo.png"
            alt="Yumenime"
            className="w-10 h-10 rounded-[10px] object-cover border border-white/10 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-display font-bold text-white truncate">Install Yumenime App</h4>
            <p className="text-[11px] text-body-mid font-display truncate">
              Akses cepat, hemat kuota &amp; fullscreen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void triggerInstall()}
            className="bg-sunset hover:bg-sunset/90 text-white text-xs font-display font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer shadow-md shadow-sunset/20"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-mute hover:text-white p-1 rounded-full transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
