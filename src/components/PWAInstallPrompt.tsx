import { useState, useEffect, useRef } from "react";
import { Download, X, Smartphone, Zap, Sparkles, CheckCircle2, ChevronRight, HelpCircle, AlertTriangle } from "lucide-react";

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
      {/* Dimmed backdrop for focused native modal feel */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs -z-10"
        onClick={handleDismiss}
      />

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-[#061838]/95 p-4 sm:p-5 text-white shadow-2xl backdrop-blur-xl transition-all">
        {/* Top Header with App Icon, Title, and Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#0c2b5e] to-[#040f24] shadow-md">
              <img
                src="/icon-192.png"
                alt="ShortBits"
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-bold text-xl text-white pointer-events-none">
                SB
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg tracking-tight text-white leading-tight">
                  ShortBits News
                </h3>
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="h-2.5 w-2.5" /> WebAPK Native
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5 leading-snug">
                Install as a full-screen Android app — no URL bar, instant offline access.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Benefits Grid */}
        <div className="mt-3.5 grid grid-cols-3 gap-2 rounded-2xl bg-white/5 p-2.5 border border-white/10 text-center">
          <div className="flex flex-col items-center gap-1">
            <Smartphone className="h-4 w-4 text-sky-400" />
            <span className="text-[11px] font-medium text-white/90">No URL Bar</span>
            <span className="text-[9px] text-white/50">Full-screen</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-white/10">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-[11px] font-medium text-white/90">Fast Videos</span>
            <span className="text-[9px] text-white/50">Native feel</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] font-medium text-white/90">App Drawer</span>
            <span className="text-[9px] text-white/50">One-tap open</span>
          </div>
        </div>

        {/* Info & Guide Toggle */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/60 px-1">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {hasPromptEvent ? "1-Tap Chrome Install Ready" : "WebAPK Certified"}
          </span>
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="text-sky-300 hover:text-white underline cursor-pointer"
          >
            {showGuide ? "Hide instructions" : "How to install"}
          </button>
        </div>

        {/* Insecure Origin Warning if testing over non-localhost HTTP */}
        {isInsecureOrigin && (
          <div className="mt-3 rounded-2xl bg-amber-950/80 p-3 border border-amber-500/40 text-xs text-amber-100 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">HTTP Insecure Origin Detected</p>
              <p className="text-amber-200/90 text-[11px] mt-0.5">
                Android Chrome requires <strong>HTTPS</strong> (or <code>localhost</code>) to generate an APK without the URL bar. Open via HTTPS or deployed preview.
              </p>
            </div>
          </div>
        )}

        {/* Step-by-step guidance if deferredPrompt is not yet triggered by browser */}
        {showGuide && (
          <div className="mt-3 rounded-2xl bg-sky-950/80 p-3.5 border border-sky-500/30 text-xs text-sky-100 animate-in fade-in duration-200">
            <p className="font-semibold text-white flex items-center gap-1.5 mb-2">
              <HelpCircle className="h-4 w-4 text-sky-400" /> To install in Android Chrome / Browser:
            </p>
            <ol className="space-y-1.5 pl-4 list-decimal text-white/90 text-[11px] leading-relaxed">
              <li>
                Tap the <strong>three dots menu (⋮)</strong> at the top-right corner of your browser.
              </li>
              <li>
                Tap <strong>"Install app"</strong> (or <strong>"Add to Home screen"</strong>).
              </li>
              <li>
                Tap <strong>"Install"</strong> in the Android popup. Android will mint and install ShortBits as a real native APK!
              </li>
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="relative flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-500 to-red-600 px-4 py-3 font-semibold text-sm text-white shadow-lg shadow-red-600/30 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Install App</span>
            <ChevronRight className="h-4 w-4 opacity-70" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl border border-white/15 bg-white/5 px-3.5 py-3 font-medium text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
