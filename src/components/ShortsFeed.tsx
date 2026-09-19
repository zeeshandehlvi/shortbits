import {
  ArrowLeft,
  Bookmark,
  Copy,
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { getShorts, type Short } from "@/lib/shorts.functions";

interface HeartParticle {
  id: number;
  x: number;
  y: number;
}

const isIOSDevice = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ||
    Boolean((navigator as unknown as { standalone?: boolean }).standalone)
  );
};

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to execCommand fallback
    }
  }
  try {
    const input = document.createElement("textarea");
    input.value = text;
    input.style.position = "fixed";
    input.style.top = "0";
    input.style.left = "0";
    input.style.width = "2em";
    input.style.height = "2em";
    input.style.padding = "0";
    input.style.border = "none";
    input.style.outline = "none";
    input.style.boxShadow = "none";
    input.style.background = "transparent";
    input.style.opacity = "0";
    input.setAttribute("readonly", "");
    document.body.appendChild(input);
    input.focus();
    input.select();
    input.setSelectionRange(0, text.length);
    const successful = document.execCommand("copy");
    input.remove();
    return successful;
  } catch {
    return false;
  }
}

function TikTokShortPlayer({
  short,
  active,
  shouldLoad,
  isMuted,
  showToast,
  onUserUnmute,
}: {
  short: Short;
  active: boolean;
  shouldLoad: boolean;
  isMuted: boolean;
  showToast: (msg: string) => void;
  onUserUnmute: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasLoaded, setHasLoaded] = useState<boolean>(shouldLoad);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(60);
  const isIOS = isIOSDevice();

  // Keep loaded once rendered
  useEffect(() => {
    if (shouldLoad && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [shouldLoad, hasLoaded]);

  // Approximate like count based on video views
  const baseLikes = short.views ? Math.max(24, Math.round(short.views * 0.082)) : 340;
  const likeCount = baseLikes + (isLiked ? 1 : 0);

  // Send postMessage command to YouTube iframe
  const postCmd = useCallback((func: string, args: unknown[] = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args }),
        "*",
      );
    } catch {
      // ignore
    }
  }, []);

  // When active state changes: auto-play or pause instantly on scroll
  useEffect(() => {
    if (!active) {
      postCmd("pauseVideo");
      setShowShareMenu(false);
    } else {
      postCmd("playVideo");
      // On non-iOS devices, un-muting on scroll is permitted by Chrome/Edge.
      // On iOS Safari / PWA, unmuting on scroll kills autoplay, so it stays muted until tapped.
      if (!isIOS) {
        postCmd(isMuted ? "mute" : "unMute");
        postCmd("setVolume", [100]);
      }
    }
  }, [active, isMuted, postCmd, isIOS]);

  // Handle mute change
  useEffect(() => {
    if (active) {
      postCmd(isMuted ? "mute" : "unMute");
      postCmd("setVolume", [100]);
    }
  }, [isMuted, active, postCmd]);

  // Listen to YouTube player messages for progress and ensure it never stops playing
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info) {
          if (
            typeof data.info.currentTime === "number" &&
            typeof data.info.duration === "number" &&
            data.info.duration > 0
          ) {
            setProgress((data.info.currentTime / data.info.duration) * 100);
            setDuration(data.info.duration);
          }
          if (typeof data.info.playerState === "number") {
            // If active and paused or ended, auto-resume/loop! No pause allowed
            if (active && (data.info.playerState === 2 || data.info.playerState === 0)) {
              postCmd("playVideo");
            }
          }
        }
      } catch {
        // non-JSON message, ignore
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [active, postCmd]);

  // Tell YouTube iframe to listen for API events once it mounts and play immediately
  const handleIframeLoad = () => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening" }),
        "*",
      );
      if (active) {
        postCmd("playVideo");
        if (!isIOS) {
          postCmd(isMuted ? "mute" : "unMute");
          postCmd("setVolume", [100]);
        }
      }
    } catch {
      // ignore
    }
  };

  const triggerHeartBurst = (x: number, y: number) => {
    setIsLiked(true);
    const heartId = Date.now() + Math.random();
    setHearts((prev) => [...prev, { id: heartId, x, y }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 900);
  };

  // Canvas interaction: no pause allowed, only close share menu and ensure unmuted play
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (showShareMenu) {
      setShowShareMenu(false);
      return;
    }
    // Direct user tap: valid user gesture on all platforms (including iOS)
    postCmd("unMute");
    postCmd("setVolume", [100]);
    postCmd("playVideo");
    onUserUnmute();
  };

  // Double tap detector for mobile touch
  const lastTouchRef = useRef<number>(0);
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTouchRef.current < 280) {
      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.changedTouches[0];
      if (touch) {
        triggerHeartBurst(touch.clientX - rect.left, touch.clientY - rect.top);
      }
      lastTouchRef.current = 0;
    } else {
      lastTouchRef.current = now;
      if (showShareMenu) {
        setShowShareMenu(false);
        return;
      }
      postCmd("unMute");
      postCmd("setVolume", [100]);
      postCmd("playVideo");
      onUserUnmute();
    }
  };

  // Scrubber seeking
  const handleSeek = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX =
      "touches" in e && e.touches[0] ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setProgress(fraction * 100);
    const targetSeconds = fraction * duration;
    postCmd("seekTo", [targetSeconds, true]);
    postCmd("playVideo");
  };

  // Share actions
  const shareUrl = `https://youtube.com/shorts/${short.id}`;
  const shareText = `Check out this Short on ShortBits: ${short.title}`;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(false);
    await copyToClipboard(shareUrl);
    showToast("Link copied to clipboard!");
  };

  const handleShareWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(false);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText}\n${shareUrl}`,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(false);
    const url = `sms:?&body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, "_blank");
  };

  const handleShareFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(false);
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleShareTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(false);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      short.title,
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  // On iOS Safari / PWA, mounting an inactive iframe and pausing it locks it in a blocked state.
  // Mounting strictly when active guarantees fresh autoplay=1&mute=1 without user-touch blocks.
  const isMounted = isIOS ? active : (hasLoaded || shouldLoad || active);

  return (
    <section className="tiktok-player">
      {/* Cropped YouTube embed to eliminate branding */}
      <div className="tiktok-video-wrapper">
        {isMounted ? (
          <iframe
            ref={iframeRef}
            className="tiktok-iframe"
            src={`https://www.youtube-nocookie.com/embed/${short.id}?enablejsapi=1&autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${
              short.id
            }&controls=0&showinfo=0&iv_load_policy=3&disablekb=1&fs=0`}
            title={short.title}
            allow="accelerometer; autoplay *; clipboard-write; encrypted-media *; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            {...({ playsInline: true, "webkit-playsinline": "true" } as Record<string, unknown>)}
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="shorts-poster" aria-label={short.title}>
            <img src={short.thumbnail} alt="" className="shorts-thumb" />
          </div>
        )}
      </div>

      {/* Transparent gesture interaction surface (No pause on click) */}
      <div
        className="tiktok-touch-layer"
        onClick={handleCanvasClick}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          triggerHeartBurst(e.clientX - rect.left, e.clientY - rect.top);
        }}
        role="presentation"
      />

      {/* Floating bursting hearts on double tap */}
      {hearts.map((h) => (
        <div
          key={h.id}
          className="tiktok-heart-burst"
          style={{ left: `${h.x}px`, top: `${h.y}px` }}
        >
          <Heart size={72} fill="#ff2d55" color="#ff2d55" />
        </div>
      ))}

      {/* Backdrop overlay for closing share fan-out menu */}
      {showShareMenu && (
        <div
          className="tiktok-fanout-backdrop"
          onClick={() => setShowShareMenu(false)}
          role="presentation"
        />
      )}

      {/* Right-Side Action Rail (TikTok / Reels layout) */}
      <aside className="tiktok-action-rail">
        {/* ShortBits Channel Avatar using the user's logo */}
        <button
          type="button"
          className="tiktok-action-btn tiktok-avatar-btn"
          onClick={(e) => {
            e.stopPropagation();
            showToast("ShortBits News");
          }}
          aria-label="Creator profile"
        >
          <div className="tiktok-avatar-img">
            <img
              src="/shortbits-logo.png"
              alt="ShortBits"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="tiktok-avatar-badge">+</span>
        </button>

        {/* Like Button */}
        <button
          type="button"
          className={`tiktok-action-btn ${isLiked ? "tiktok-action-btn-liked" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked((prev) => !prev);
          }}
          aria-label={isLiked ? "Unlike video" : "Like video"}
        >
          <div className="tiktok-action-icon">
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
          </div>
          <span className="tiktok-action-label">{likeCount.toLocaleString()}</span>
        </button>

        {/* Bookmark / Save Button */}
        <button
          type="button"
          className={`tiktok-action-btn ${isSaved ? "tiktok-action-btn-saved" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsSaved((prev) => {
              const next = !prev;
              showToast(next ? "Added to Saved Shorts" : "Removed from Saved");
              return next;
            });
          }}
          aria-label={isSaved ? "Remove bookmark" : "Bookmark video"}
        >
          <div className="tiktok-action-icon">
            <Bookmark size={23} fill={isSaved ? "currentColor" : "none"} />
          </div>
          <span className="tiktok-action-label">{isSaved ? "Saved" : "Save"}</span>
        </button>

        {/* Share Button with Fan-Out Animation */}
        <div className={`tiktok-share-container ${showShareMenu ? "tiktok-share-active" : ""}`}>
          {showShareMenu && (
            <div className="tiktok-fanout-tray">
              {/* Option 1: Copy Link */}
              <button
                type="button"
                className="tiktok-fanout-item"
                onClick={handleCopyLink}
                aria-label="Copy link"
              >
                <span className="tiktok-fanout-pill">Copy Link</span>
                <div
                  className="tiktok-fanout-btn"
                  style={{ background: "rgba(35, 35, 42, 0.95)" }}
                >
                  <Copy size={18} />
                </div>
              </button>

              {/* Option 2: WhatsApp */}
              <button
                type="button"
                className="tiktok-fanout-item"
                onClick={handleShareWhatsApp}
                aria-label="Share via WhatsApp"
              >
                <span className="tiktok-fanout-pill">WhatsApp</span>
                <div
                  className="tiktok-fanout-btn"
                  style={{ background: "#25D366" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.2.3-.778.978-.954 1.179-.175.2-.351.226-.652.075s-1.27-.468-2.42-1.493c-.894-.798-1.498-1.784-1.674-2.085-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.502.1-.2.05-.376-.025-.526-.075-.15-.678-1.634-.929-2.238-.244-.588-.493-.509-.678-.518l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.23 3.111c.15.2 2.122 3.24 5.141 4.544.718.31 1.278.495 1.715.634.721.23 1.377.197 1.896.12.578-.087 1.78-.727 2.03-1.43.251-.703.251-1.304.176-1.43-.076-.126-.277-.201-.578-.351zM12.04 2C6.54 2 2.08 6.46 2.08 11.96c0 1.94.55 3.75 1.51 5.28L2 22l4.9-1.55c1.47.88 3.18 1.39 5.14 1.39 5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2z" />
                  </svg>
                </div>
              </button>

              {/* Option 3: Message */}
              <button
                type="button"
                className="tiktok-fanout-item"
                onClick={handleShareMessage}
                aria-label="Share via Message"
              >
                <span className="tiktok-fanout-pill">Message</span>
                <div
                  className="tiktok-fanout-btn"
                  style={{ background: "#0084FF" }}
                >
                  <MessageCircle size={19} />
                </div>
              </button>

              {/* Option 4: Facebook */}
              <button
                type="button"
                className="tiktok-fanout-item"
                onClick={handleShareFacebook}
                aria-label="Share on Facebook"
              >
                <span className="tiktok-fanout-pill">Facebook</span>
                <div
                  className="tiktok-fanout-btn"
                  style={{ background: "#1877F2" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
              </button>

              {/* Option 5: X (Twitter) */}
              <button
                type="button"
                className="tiktok-fanout-item"
                onClick={handleShareTwitter}
                aria-label="Share on X"
              >
                <span className="tiktok-fanout-pill">X / Twitter</span>
                <div
                  className="tiktok-fanout-btn"
                  style={{ background: "#000000" }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          <button
            type="button"
            className="tiktok-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowShareMenu((prev) => !prev);
            }}
            aria-label="Share video"
          >
            <div className="tiktok-action-icon">
              <Share2 size={23} />
            </div>
            <span className="tiktok-action-label">Share</span>
          </button>
        </div>
      </aside>

      {/* Interactive Bottom Progress Scrubber */}
      <div
        className="tiktok-progress-wrap"
        onClick={handleSeek}
        onTouchStart={handleSeek}
      >
        <div className="tiktok-progress-line">
          <div
            className="tiktok-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export function ShortsFeed({
  onBack,
  externalClose,
}: {
  onBack: () => void;
  externalClose?: boolean;
}) {
  const fetchShorts = useServerFn(getShorts);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shorts"],
    queryFn: () => fetchShorts({}),
    staleTime: 5 * 60 * 1000,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Muted by default
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRafRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2200);
  };

  // Instant geometric scroll handler for immediate autoplay switching on all devices
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const root = containerRef.current;
      if (!root || !data || data.length === 0) return;
      const h = root.clientHeight;
      if (h <= 0) return;
      const index = Math.round(root.scrollTop / h);
      const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
      const targetShort = data[clampedIndex];
      if (targetShort && targetShort.id !== activeId) {
        setActiveId(targetShort.id);
      }
    });
  }, [data, activeId]);

  // TouchEnd trigger for iOS Safari momentum snapping
  const handleTouchEndScroll = useCallback(() => {
    const root = containerRef.current;
    if (!root || !data || data.length === 0) return;
    setTimeout(() => {
      if (!root) return;
      const h = root.clientHeight;
      if (h <= 0) return;
      const index = Math.round(root.scrollTop / h);
      const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
      const targetShort = data[clampedIndex];
      if (targetShort && targetShort.id !== activeId) {
        setActiveId(targetShort.id);
      }
    }, 80);
  }, [data, activeId]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  // IntersectionObserver as secondary trigger
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let bestId: string | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            bestId = (entry.target as HTMLElement).dataset["shortId"] ?? null;
          }
        }
        if (bestId) {
          setActiveId(bestId);
        }
      },
      { root, threshold: [0.3, 0.5, 0.7] },
    );
    root.querySelectorAll("[data-short-id]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [data]);

  const shorts = data ?? [];
  const activeIndex = shorts.findIndex((s) => (activeId ? s.id === activeId : false));
  const currentActiveIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className="shorts-feed-wrapper">
      {/* Pinned Top Controls: Back button, Header Pill, and Red Pulsing Mute Button */}
      {!externalClose && (
        <button
          type="button"
          className="shorts-back"
          onClick={onBack}
          aria-label="Back to news"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      <div className="tiktok-top-tag">Shorts</div>

      {/* Sound Toggle Button: Red & pulsing when muted, glassmorphic when unmuted */}
      <button
        type="button"
        className={`shorts-sound-btn ${isMuted ? "shorts-sound-btn-muted" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          const next = !isMuted;
          setIsMuted(next);
          showToast(next ? "Audio muted" : "Audio playing");
        }}
        aria-label={isMuted ? "Unmute audio" : "Mute audio"}
      >
        {isMuted ? <VolumeX size={19} /> : <Volume2 size={19} />}
      </button>

      {/* Floating Toast Notification */}
      {toastMessage && <div className="tiktok-toast">{toastMessage}</div>}

      <div
        className="shorts-feed"
        ref={containerRef}
        onScroll={handleScroll}
        onTouchEnd={handleTouchEndScroll}
      >
        {isLoading && <p className="shorts-note">Loading shorts…</p>}
        {isError && (
          <p className="shorts-note">
            Couldn&apos;t load videos right now. Please try again.
          </p>
        )}
        {!isLoading && !isError && shorts.length === 0 && (
          <p className="shorts-note">No shorts published yet.</p>
        )}

        {shorts.map((short, index) => {
          const isActive = activeId ? activeId === short.id : index === 0;
          // Pre-render current, previous, and next slides for non-iOS devices
          const shouldLoad = Math.abs(index - currentActiveIndex) <= 1;

          return (
            <div key={short.id} data-short-id={short.id} className="shorts-slide">
              <TikTokShortPlayer
                short={short}
                active={isActive}
                shouldLoad={shouldLoad}
                isMuted={isMuted}
                showToast={showToast}
                onUserUnmute={() => setIsMuted(false)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
