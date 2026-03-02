import { useState, useEffect, useCallback } from "react";

// Extend window to support the non-standard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const DISMISSAL_KEY = "pwa_banner_dismissed_until";

export const usePWAInstall = () => {
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (installed)
    const _navigator = window.navigator as Navigator & { standalone?: boolean };
    const _isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in _navigator && !!_navigator.standalone);
    setIsStandalone(!!_isStandalone);

    // Detect iOS Safari (approximate)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const _isIOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(_isIOS);

    // Handle beforeinstallprompt (Android / Chrome)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  const triggerPrompt = useCallback(
    (force: boolean = false) => {
      // If already installed, don't show
      if (isStandalone) return;

      if (!force) {
        // Check dismissal state only if not forced
        const dismissedUntil = localStorage.getItem(DISMISSAL_KEY);
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
          return;
        }
      }

      // Determine if we *can* show something useful
      // If forced, always show (fallback instructions can be shown in the banner)
      if (force || installPromptEvent || isIOS) {
        setShowBanner(true);
      }
    },
    [installPromptEvent, isIOS, isStandalone],
  );

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(
      DISMISSAL_KEY,
      (Date.now() + DISMISSAL_DURATION).toString(),
    );
  }, []);

  const installPWA = useCallback(async () => {
    if (!installPromptEvent) return;

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;

    if (outcome === "accepted") {
      setInstallPromptEvent(null);
    }

    // Hide banner regardless of outcome, and give a cooldown just in case
    setShowBanner(false);
    localStorage.setItem(
      DISMISSAL_KEY,
      (Date.now() + DISMISSAL_DURATION).toString(),
    );
  }, [installPromptEvent]);

  return {
    showBanner,
    isIOS,
    isStandalone,
    canInstallAndroid: !!installPromptEvent,
    triggerPrompt,
    dismissBanner,
    installPWA,
  };
};
