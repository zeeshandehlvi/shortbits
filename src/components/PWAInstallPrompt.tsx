import { useState, useEffect, useRef } from "react";
import { Download, X, HelpCircle, AlertTriangle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [hasPromptEvent, setHasPromptEvent] = useState(false);
  const [isInsecureOrigin, setIsInsecureOrigin] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone mode (already installed WebAPK/PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.location.search.includes("source=pwa") ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if connection is secure (Chrome requires HTTPS or localhost for WebAPK)
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !isLocal) {
      setIsInsecureOrigin(true);
    }

    const isAndroid = /android/i.test(navigator.userAgent);
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

    // Capture beforeinstallprompt for Android Chrome & Chromium browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setHasPromptEvent(true);
      console.log("[PWA] Captured beforeinstallprompt event successfully.");

      const isSessionDismissed = sessionStorage.getItem("shortbits_pwa_dismissed_session") === "1";
      if (!isSessionDismissed) {
        setIsVisible(true);
      }
    };

    const handleAppInstalled = () => {
      console.log("[PWA] App installed successfully as WebAPK!");
      setIsInstalled(true);
      setIsVisible(false);
      deferredPromptRef.current = null;
      sessionStorage.removeItem("shortbits_pwa_dismissed_session");
    };

    const handleManualOpen = () => {
      setIsVisible(true);
      setShowGuide(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("open-pwa-install", handleManualOpen);

    // Show prompt immediately for Android/mobile users outside standalone mode
    const isSessionDismissed = sessionStorage.getItem("shortbits_pwa_dismissed_session") === "1";
    if (!isSessionDismissed && (isAndroid || isMobile || isLocal)) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("open-pwa-install", handleManualOpen);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log("[PWA] handleInstallClick triggered. deferredPrompt available:", !!deferredPromptRef.current);
    if (deferredPromptRef.current) {
      try {
        await deferredPromptRef.current.prompt();
        const choice = await deferredPromptRef.current.userChoice;
        console.log("[PWA] User response to install prompt:", choice.outcome);
        if (choice.outcome === "accepted") {
          setIsVisible(false);
        }
        deferredPromptRef.current = null;
      } catch (err) {
        console.error("[PWA] Error triggering install prompt:", err);
        setShowGuide(true);
      }
    } else {
      // If browser hasn't fired beforeinstallprompt or requires browser menu install
      setShowGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("shortbits_pwa_dismissed_session", "1");
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Install ShortBits App"
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center p-3 sm:p-4 animate-in slide-in-from-bottom duration-300 pointer-events-auto"
    >
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs -z-10"
        onClick={handleDismiss}
      />

      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#e2ded4] dark:border-[#1e3a5f] bg-white dark:bg-[#0a192f] p-4 text-[#10213a] dark:text-white shadow-2xl shadow-[#012c6c]/15 transition-all">
        {/* Header with App Icon, Title, and Close */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#012c6c] text-white shadow-sm border border-[#012c6c]/20">
              <img
                src="/icon-192.png"
                alt="ShortBits"
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-bold text-sm tracking-tight text-white pointer-events-none">
                SB<span className="text-[#24febf]">.</span>
              </span>
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base tracking-tight text-[#012c6c] dark:text-white leading-tight">
                Install ShortBits<span className="text-[#24febf]">.</span>
              </h3>
              <p className="text-xs text-[#56667a] dark:text-slate-300 truncate mt-0.5">
                Faster, full-screen reading on your home screen
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Insecure Origin Warning if testing over non-localhost HTTP */}
        {isInsecureOrigin && (
          <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 p-2.5 border border-amber-200 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-[11px] leading-tight">
              HTTPS is required to install as a native app.
            </p>
          </div>
        )}

        {/* Minimal step-by-step guidance if deferredPrompt is not available */}
        {showGuide && (
          <div className="mt-3 rounded-xl bg-[#f8f6f0] dark:bg-white/5 p-3 border border-[#e2ded4] dark:border-white/10 text-xs text-[#56667a] dark:text-slate-300 animate-in fade-in duration-200">
            <p className="font-semibold text-[#10213a] dark:text-white flex items-center gap-1.5 mb-1 text-xs">
              <HelpCircle className="h-3.5 w-3.5 text-[#012c6c] dark:text-sky-400 shrink-0" />
              How to install:
            </p>
            <p className="text-[11px] leading-relaxed">
              Tap your browser menu (<strong>⋮</strong> or <strong>Share</strong>) and select <strong>"Add to Home Screen"</strong> or <strong>"Install app"</strong>.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-3.5 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#012c6c] hover:bg-[#023c8e] px-4 py-2.5 font-semibold text-xs text-white shadow-sm shadow-[#012c6c]/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install App</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl px-3 py-2.5 font-medium text-xs text-[#56667a] dark:text-slate-400 hover:bg-[#f0ece1] dark:hover:bg-white/10 hover:text-[#10213a] dark:hover:text-white transition-colors cursor-pointer"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
