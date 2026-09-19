import { useState, useEffect } from "react";

export const FONT_SCALES = [0.88, 1, 1.15, 1.3] as const;
const FONT_SCALE_KEY = "shortbits-font-scale";

export function FontSizeControl({ className = "" }: { className?: string }) {
  const [scaleIndex, setScaleIndex] = useState<number>(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FONT_SCALE_KEY);
      if (saved) {
        const val = parseFloat(saved);
        const idx = FONT_SCALES.findIndex((s) => Math.abs(s - val) < 0.02);
        if (idx !== -1) {
          setScaleIndex(idx);
          document.documentElement.style.setProperty("--font-scale", String(val));
          return;
        }
      }
    } catch {
      // ignore storage errors
    }
    document.documentElement.style.setProperty("--font-scale", "1");
  }, []);

  const changeScale = (delta: number) => {
    const nextIdx = Math.max(0, Math.min(FONT_SCALES.length - 1, scaleIndex + delta));
    setScaleIndex(nextIdx);
    const nextScale = FONT_SCALES[nextIdx]!;
    document.documentElement.style.setProperty("--font-scale", String(nextScale));
    try {
      localStorage.setItem(FONT_SCALE_KEY, String(nextScale));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border border-border bg-card/80 shadow-sm backdrop-blur-md transition-colors ${className}`}
      role="group"
      aria-label="Adjust text size"
      title="Text size: A- reduce / A+ increase"
    >
      <button
        type="button"
        onClick={() => changeScale(-1)}
        disabled={scaleIndex === 0}
        aria-label="Decrease text size (A-)"
        className="flex h-7 items-center justify-center rounded-l-full pl-2.5 pr-1.5 font-bold text-foreground transition hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[11px] leading-none">A</span>
        <span className="text-[9px] leading-none text-muted-foreground ml-0.5">−</span>
      </button>
      <div className="h-3 w-px bg-border/80" aria-hidden="true" />
      <button
        type="button"
        onClick={() => changeScale(1)}
        disabled={scaleIndex === FONT_SCALES.length - 1}
        aria-label="Increase text size (A+)"
        className="flex h-7 items-center justify-center rounded-r-full pl-1.5 pr-2.5 font-bold text-foreground transition hover:bg-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span className="text-[14px] leading-none">A</span>
        <span className="text-[10px] leading-none text-muted-foreground ml-0.5">+</span>
      </button>
    </div>
  );
}
