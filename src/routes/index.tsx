import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  Briefcase,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  FileText,
  Flame,
  Facebook,
  Gavel,
  Globe,
  Heart,
  Home,
  Landmark,
  Linkedin,
  MessageCircle,
  Play,
  Search,
  Share2,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useServerFn } from "@tanstack/react-start";

import { ShortsFeed } from "@/components/ShortsFeed";
import { EPaperPage } from "@/components/EPaperPage";
import { downloadEpaperPDF, downloadStoryClip } from "@/lib/epaper";
import { listPublishedArticles, slugify, type Article } from "@/lib/articles.functions";

import summitNews from "../assets/world-summit-news.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShortBits — Best News Website in America, World & All 50 States" },
      {
        name: "description",
        content:
          "Experience breaking news in 60 seconds on ShortBits. Rated the best news website in America, Canada, India, and worldwide with daily digital print editions.",
      },
      {
        name: "keywords",
        content:
          "best news website in america, best news in world, breaking news, viral news, tech launches, artificial intelligence, OpenAI, geopolitics, world war news, crisis updates, california news, texas news, florida news, new york news, north carolina news, 50 states news, daily epaper",
      },
      { property: "og:title", content: "ShortBits — Best News Website in America, World & All 50 States" },
      {
        property: "og:description",
        content: "High-impact breaking world news, viral tech launches, and daily e-paper in 60-second reads.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://theshortbits.com" },
      { property: "og:image", content: "https://theshortbits.com/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ShortBits — Best News Website in America & World" },
      { name: "twitter:description", content: "High-impact breaking news and daily digital e-papers in 60 seconds." },
      { name: "twitter:image", content: "https://theshortbits.com/og-image.jpg" },
    ],
  }),
  component: NewsApp,
});

type View = "home" | "all" | "article" | "saved" | "shorts" | "epaper";

type Story = {
  id: number;
  source: string;
  city?: string;
  topic: "Politics" | "Sports" | "Tech" | "Business" | "Crime";
  age: string;
  title: string;
  image: string;
  category: string;
  likes: string;
  comments: string;
  views: string;
  date: string;
  author: string;
  body: string[];
  publishedAt?: number;
};

const stories: Story[] = [];

const categories = ["All News"];

const topicCategories: Story["topic"][] = ["Politics", "Tech", "Business", "Crime", "Sports"];

const COUNTRY_KEY = "shortbits-country";
const GEO_KEY = "shortbits-geo-permission";
const LOCATION_KEY = "shortbits-geolocation-v2";

export type GeoLocationData = {
  country: string;
  state?: string | undefined;
  city?: string | undefined;
  county?: string | undefined;
};

export function applyGeoSEO(geo: GeoLocationData) {
  if (typeof document === "undefined") return;
  const localEntity = geo.county || geo.city || geo.state || geo.country;
  if (!localEntity) return;

  // 1. Dynamic document title
  const regionalTitle = `ShortBits — Best News Website in ${localEntity}${geo.state && geo.state !== localEntity ? `, ${geo.state}` : ""}${geo.country ? `, ${geo.country}` : ""} & Worldwide`;
  document.title = regionalTitle;

  // 2. Dynamic keywords
  const localKeywords = [
    `best news website in ${localEntity}`,
    `${localEntity} breaking news`,
    `best news in ${localEntity}`,
    geo.county ? `best news website in ${geo.county}` : "",
    geo.county ? `${geo.county} news` : "",
    geo.city ? `best news in ${geo.city}` : "",
    geo.state ? `best news website in ${geo.state}` : "",
    geo.state ? `${geo.state} breaking news` : "",
    geo.country ? `best news in ${geo.country}` : "",
    "best news website in america",
    "best news in world",
    "top breaking news",
  ]
    .filter(Boolean)
    .join(", ");

  let metaKw = document.querySelector('meta[name="keywords"]');
  if (!metaKw) {
    metaKw = document.createElement("meta");
    metaKw.setAttribute("name", "keywords");
    document.head.appendChild(metaKw);
  }
  metaKw.setAttribute("content", `${localKeywords}, ${metaKw.getAttribute("content") || ""}`);

  // 3. Dynamic description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.setAttribute("name", "description");
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute(
    "content",
    `Read breaking news on ShortBits — the best news website in ${localEntity}, ${geo.state || geo.country || "America"}. High-impact 60-second stories, viral tech launches, and daily e-paper.`
  );
}

async function detectLocation(): Promise<GeoLocationData | null> {
  if (typeof window === "undefined" || !navigator.geolocation) return null;
  try {
    const saved = localStorage.getItem(LOCATION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as GeoLocationData;
      applyGeoSEO(parsed);
      return parsed;
    }
  } catch {}

  if (localStorage.getItem(GEO_KEY) === "denied") return null;

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 }),
    );
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`,
    );
    const data = (await response.json()) as {
      countryName?: string;
      principalSubdivision?: string;
      city?: string;
      locality?: string;
      localityInfo?: {
        administrative?: Array<{ name?: string; description?: string; order?: number }>;
      };
    };

    if (!data.countryName) return null;

    let county: string | undefined = undefined;
    if (data.localityInfo?.administrative) {
      const countyEntry = data.localityInfo.administrative.find(
        (a) =>
          a.name &&
          (a.name.toLowerCase().includes("county") ||
            a.name.toLowerCase().includes("parish") ||
            a.name.toLowerCase().includes("district")),
      );
      if (countyEntry?.name) {
        county = countyEntry.name;
      }
    }

    const geo: GeoLocationData = {
      country: data.countryName,
      ...(data.principalSubdivision ? { state: data.principalSubdivision } : {}),
      ...(data.city || data.locality ? { city: data.city || data.locality } : {}),
      ...(county ? { county } : {}),
    };

    localStorage.setItem(LOCATION_KEY, JSON.stringify(geo));
    localStorage.setItem(COUNTRY_KEY, geo.country);
    localStorage.setItem(GEO_KEY, "granted");

    applyGeoSEO(geo);
    return geo;
  } catch {
    localStorage.setItem(GEO_KEY, "denied");
    return null;
  }
}

function topicIcon(topic: Story["topic"], size = 18) {
  if (topic === "Sports") return <Trophy size={size} />;
  if (topic === "Tech") return <Cpu size={size} />;
  if (topic === "Business") return <Briefcase size={size} />;
  if (topic === "Crime") return <Gavel size={size} />;
  return <Landmark size={size} />;
}

async function downloadStory(story: Story) {
  try {
    await downloadStoryClip(story);
  } catch (err) {
    console.error("Failed to download story e-clip:", err);
  }
}

function storyHoursAgo(story: Story) {
  const match = /(\d+)\s*(minute|hour|day)/i.exec(story.age);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2]!.toLowerCase();
  if (unit === "minute") return value / 60;
  if (unit === "day") return value * 24;
  return value;
}

async function downloadEpaper(targetDate = new Date()) {
  await downloadEpaperPDF(targetDate, stories);
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function NewsApp() {
  const isDesktop = useIsDesktop();
  const [view, setView] = useState<View>("home");
  const [previousView, setPreviousView] = useState<View>("home");
  const [selectedStory, setSelectedStory] = useState<Story | null>(stories[0] ?? null);
  const [activeCategory, setActiveCategory] = useState("All News");
  const [country, setCountry] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isSettling, setIsSettling] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragPosition = useRef({ x: 0, y: 0 });
  const pendingDrag = useRef({ x: 0, y: 0 });
  const dragFrame = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);

  useEffect(() => {
    document.querySelector(".phone-scroll")?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [view]);

  useEffect(() => () => {
    if (dragFrame.current !== null) cancelAnimationFrame(dragFrame.current);
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
  }, []);

  useEffect(() => {
    void detectLocation().then((loc) => {
      if (loc?.country) setCountry(loc.country);
    });
  }, []);

  const loadPublished = useServerFn(listPublishedArticles);
  const [, setPublishedCount] = useState(0);
  useEffect(() => {
    void loadPublished()
      .then((articles) => {
        const added = mergePublishedArticles(articles);
        if (added) {
          setPublishedCount((value) => value + added);
          setSelectedStory((curr) => {
            const hasUrlStory = typeof window !== "undefined" && Boolean(new URLSearchParams(window.location.search).get("story"));
            if (hasUrlStory && curr) return curr;
            return stories[0] ?? curr;
          });
        }
      })
      .catch(() => undefined);
  }, [loadPublished]);

  useEffect(() => {
    if (!selectedStory && stories.length) setSelectedStory(stories[0]!);
  });

  useEffect(() => {
    const storyId = Number(new URLSearchParams(window.location.search).get("story"));
    const linkedStory = stories.find((story) => story.id === storyId);
    if (linkedStory) {
      setSelectedStory(linkedStory);
      setView("article");
    }
  }, []);

  const search = query.trim().toLowerCase();
  const isTopicFilter = (topicCategories as string[]).includes(activeCategory);
  const byCategory =
    country && activeCategory === country
      ? stories.filter(
          (story) =>
            story.source.toLowerCase() === country.toLowerCase() ||
            story.city?.toLowerCase() === country.toLowerCase(),
        )
      : isTopicFilter
        ? stories.filter((story) => story.topic === activeCategory)
        : stories;
  const visibleStories = search
    ? stories.filter((story) =>
        [story.title, story.source, story.city ?? "", story.topic, story.category, story.author, story.body.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
    : byCategory;

  const openStory = (story: Story) => {
    setPreviousView(view === "article" ? previousView : view);
    setSelectedStory(story);
    setView("article");
  };

  const completeSwipe = () => {
    if (isSettling) return;
    if (dragFrame.current !== null) {
      cancelAnimationFrame(dragFrame.current);
      dragFrame.current = null;
    }
    const { x, y } = dragPosition.current;
    setDragX(x);
    setDragY(y);
    dragStart.current = null;

    if (y < -90 && Math.abs(y) > Math.abs(x)) {
      dragPosition.current = { x: 0, y: 0 };
      pendingDrag.current = { x: 0, y: 0 };
      setDragX(0);
      setDragY(0);
      setView("all");
      return;
    }

    const goesNext = x < -55;
    const goesPrevious = x > 55 && cardIndex > 0;
    const isSwipe = goesNext || goesPrevious;
    setIsSettling(true);
    setDragY(0);
    setDragX(goesNext ? -540 : goesPrevious ? 540 : 0);

    const settleDuration = isSwipe ? 380 : 300;
    settleTimer.current = window.setTimeout(() => {
      if (goesNext) {
        setCardIndex((prev) => (prev < visibleStories.length - 1 ? prev + 1 : 0));
      } else if (goesPrevious) {
        setCardIndex((value) => Math.max(0, value - 1));
      }
      dragPosition.current = { x: 0, y: 0 };
      pendingDrag.current = { x: 0, y: 0 };
      setDragX(0);
      setDragY(0);
      setIsSettling(false);
      settleTimer.current = null;
    }, settleDuration);
  };


  if (isDesktop) return <DesktopView />;

  return (
    <main className="news-stage">
      <div className="phone-shell">
        <div className="phone-scroll">
          {view === "home" && (
            <HomeView
              activeCategory={activeCategory}
              setActiveCategory={(category) => {
                setActiveCategory(category);
                setCardIndex(0);
              }}
              visibleStories={visibleStories}
              cardIndex={cardIndex}
              setCardIndex={setCardIndex}
              dragX={dragX}
              dragY={dragY}
              isSettling={isSettling}
              onPointerDown={(x, y) => {
                 if (isSettling) return;
                dragStart.current = { x, y };
                 dragPosition.current = { x: 0, y: 0 };
                 pendingDrag.current = { x: 0, y: 0 };
              }}
              onPointerMove={(x, y) => {
                 if (!dragStart.current || isSettling) return;
                 const rawX = x - dragStart.current.x;
                 const nextX = cardIndex === 0 && rawX > 0 ? rawX * 0.18 : rawX;
                 const nextY = Math.min(0, y - dragStart.current.y);
                 pendingDrag.current = { x: nextX, y: nextY };
                 dragPosition.current = pendingDrag.current;
                 if (dragFrame.current !== null) return;
                 dragFrame.current = requestAnimationFrame(() => {
                   setDragX(pendingDrag.current.x);
                   setDragY(pendingDrag.current.y);
                   dragFrame.current = null;
                 });
              }}
              onPointerUp={completeSwipe}
              country={country}
              query={query}
              setQuery={(value) => {
                setQuery(value);
                setCardIndex(0);
              }}
              openStory={openStory}
              setView={setView}
            />
          )}
          {view === "all" && <AllNewsView openStory={openStory} setView={setView} />}
          {view === "article" && selectedStory && (
            <ArticleView
              story={selectedStory}
              setView={setView}
              onBack={() => setView(previousView)}
            />
          )}
          {view === "saved" && <SavedView openStory={openStory} setView={setView} />}
          {view === "shorts" && <ShortsFeed onBack={() => setView("home")} />}
          {view === "epaper" && <EPaperPage stories={stories} onBack={() => setView("home")} />}
        </div>
        <BottomNav view={view} setView={setView} />
      </div>
    </main>
  );
}

function HomeView({
  activeCategory,
  setActiveCategory,
  visibleStories,
  cardIndex,
  setCardIndex,
  dragX,
  dragY,
  isSettling,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  country,
  query,
  setQuery,
  openStory,
  setView,
}: {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  visibleStories: Story[];
  cardIndex: number;
  setCardIndex: (value: number | ((prev: number) => number)) => void;
  dragX: number;
  dragY: number;
  isSettling: boolean;
  onPointerDown: (x: number, y: number) => void;
  onPointerMove: (x: number, y: number) => void;
  onPointerUp: () => void;
  country: string | null;
  query: string;
  setQuery: (value: string) => void;
  openStory: (story: Story) => void;
  setView: (view: View) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");
      setIsStandalone(standalone);
    }
  }, []);

  return (
    <div className="home-screen min-h-dvh px-5 pb-24 pt-4" style={{ "--screen-px": "20px" } as React.CSSProperties}>
      <header className="mt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h1 className="brand-wordmark min-w-0 text-[28px] font-bold leading-none tracking-tight">
            ShortBits<span className="brand-dot">.</span>
          </h1>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isStandalone && (
              <button
                type="button"
                className="install-pwa-button"
                aria-label="Install ShortBits App"
                onClick={() => window.dispatchEvent(new CustomEvent("open-pwa-install"))}
              >
                <Download size={13} /> <span>Install</span>
              </button>
            )}
            <button
              type="button"
              className="epaper-button"
              aria-label="Open E-Paper Editions"
              onClick={() => setView("epaper")}
            >
              <FileText size={14} /> <span>E-Paper</span>
            </button>
          </div>
        </div>
      </header>

      <nav aria-label="News categories" className="category-nav no-scrollbar flex items-center gap-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0 flex-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`category-pill ${activeCategory === category ? "category-pill-active" : ""}`}
            >
              {category}
            </button>
          ))}
          {country && (
            <button
              type="button"
              onClick={() => setActiveCategory(country)}
              className={`category-pill flex items-center gap-1 ${activeCategory === country ? "category-pill-active" : ""}`}
            >
              <Flame size={13} fill="currentColor" aria-hidden /> {country}
            </button>
          )}
        </div>
        <IconButton
          label={searchOpen ? "Close search" : "Search"}
          onClick={() => {
            setSearchOpen((open) => {
              if (open) setQuery("");
              return !open;
            });
          }}
        >
          <Search size={18} />
        </IconButton>
        {searchOpen && (
          <input
            type="search"
            value={query}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search news…"
            aria-label="Search news"
            className="mt-2 w-full rounded-full border border-border bg-card px-4 py-2 text-[13px] outline-none focus:ring-2 focus:ring-ring"
          />
        )}
      </nav>

      <div className="relative mt-5 flex items-center justify-between" style={{ zIndex: 30 }}>
        <h2 className="flex items-center gap-1 text-[16px] font-bold">Trending now <Flame className="text-destructive" size={17} fill="currentColor" aria-label="fire" /></h2>
        <div className="relative" style={{ zIndex: 50 }}>
          <button
            type="button"
            onClick={() => setTopicOpen((open) => !open)}
            className="flex items-center gap-1 rounded-full border border-border bg-card/70 px-2.5 py-1 text-[12px] font-semibold text-primary shadow-sm backdrop-blur-md"
            aria-haspopup="listbox"
            aria-expanded={topicOpen}
          >
            <Globe size={13} />
            <span>{(topicCategories as string[]).includes(activeCategory) ? activeCategory : "World"}&nbsp;</span>
            <ChevronDown size={13} className={topicOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          {topicOpen && (
            <>
              <button
                type="button"
                aria-label="Close categories"
                tabIndex={-1}
                onClick={() => setTopicOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <ul
                role="listbox"
                aria-label="Choose category"
                className="absolute right-0 z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-border bg-popover/95 p-1 text-[12px] shadow-xl backdrop-blur-md"
              >
                {topicCategories.map((topic) => (
                  <li key={topic}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={activeCategory === topic}
                      onClick={() => {
                        setActiveCategory(topic);
                        setTopicOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-semibold ${activeCategory === topic ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                    >
                      {topicIcon(topic, 14)}
                      {topic}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {visibleStories.length > 0 ? (
      <div className="relative mt-6 h-[540px] select-none touch-pan-y overflow-x-clip">
           {dragY < -25 && (
             <div className="pointer-events-none absolute inset-x-0 -top-1 z-30 flex justify-center">
               <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg">
                 {dragY < -90 ? "Release for all articles" : "Keep pulling up"}
               </span>
             </div>
           )}
           {dragX < -25 && (
             <div className="pointer-events-none absolute right-3 top-1/2 z-30 -translate-y-1/2">
               <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg">
                 Next <ChevronRight size={13} />
               </span>
             </div>
           )}
           {dragX > 25 && (
             <div className="pointer-events-none absolute left-3 top-1/2 z-30 -translate-y-1/2">
               <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg">
                 <ChevronLeft size={13} /> Previous
               </span>
             </div>
           )}
           {(() => {
             const safeIndex = visibleStories.length > 0 ? cardIndex % visibleStories.length : 0;
             const deckStories = visibleStories.length >= 4
               ? [
                   visibleStories[safeIndex]!,
                   visibleStories[(safeIndex + 1) % visibleStories.length]!,
                   visibleStories[(safeIndex + 2) % visibleStories.length]!,
                   visibleStories[(safeIndex + 3) % visibleStories.length]!,
                 ]
               : visibleStories.length === 3
                 ? [
                     visibleStories[safeIndex]!,
                     visibleStories[(safeIndex + 1) % visibleStories.length]!,
                     visibleStories[(safeIndex + 2) % visibleStories.length]!,
                   ]
                 : visibleStories.slice(safeIndex, safeIndex + 2);

             // Forward swipe progress: active when swiping front card left (dragX < 0)
             const swipeProgress = dragX < 0 ? Math.min(Math.max(-dragX, 0) / 220, 1) : 0;
             // Backward swipe progress: active when swiping front card right (dragX > 0 and cardIndex > 0)
             const backProgress = dragX > 0 && cardIndex > 0 ? Math.min(Math.max(dragX, 0) / 220, 1) : 0;
             const pullUpProgress = Math.min(Math.max(-dragY, 0) / 140, 1);
             const pullUpAdvance = pullUpProgress * 12;

             const prevStory = cardIndex > 0 ? visibleStories[cardIndex - 1] : null;

             let prevArticleNode = null;
             if (prevStory) {
               const prevX = backProgress >= 1 ? "0px" : `${Math.round((-105 + backProgress * 105) * 10) / 10}%`;
               const prevTilt = Math.round(-6 * (1 - backProgress) * 100) / 100;
               const prevScale = Math.round((0.96 + backProgress * 0.04) * 1000) / 1000;
               const prevTransform = `translate3d(${prevX}, 0px, 0) rotate(${prevTilt}deg) scale(${prevScale})`;
               const prevOpacity = backProgress > 0.01 ? 1 : 0;

               prevArticleNode = (
                 <article
                   key={prevStory.id}
                   className="story-card gesture-story-card absolute inset-x-0 pointer-events-none"
                   style={{
                     zIndex: 20,
                     top: "68px",
                     transform: prevTransform,
                     opacity: prevOpacity,
                     filter: "blur(0px)",
                     boxShadow: `0 ${8 + backProgress * 8}px ${32 + backProgress * 22}px -12px oklch(0.22 0.035 250 / ${0.28 + backProgress * 0.18})`,
                     transition: isSettling
                       ? "transform 380ms cubic-bezier(.16,1,.3,1), opacity 380ms ease, box-shadow 380ms ease"
                       : "none",
                     "--gesture-glass": 0,
                   } as React.CSSProperties}
                 >
                   <StoryHeader story={prevStory} onDownload={() => void downloadStory(prevStory)} />
                   <button type="button" className="block w-full text-left" tabIndex={-1}>
                     <h3 className="line-clamp-3 px-4 pb-3 pt-1 text-[19px] font-bold leading-[1.08]">{prevStory.title}</h3>
                     <img src={prevStory.image} alt="" className="mt-2 h-[270px] w-full object-cover" width={1200} height={912} draggable={false} />
                   </button>
                   <Engagement story={prevStory} />
                 </article>
               );
             }

             const deckCards = deckStories.map((story, offset) => {
               const isFront = offset === 0;
               const glassProgress = isFront ? Math.min(Math.max(Math.abs(dragX) / 180, Math.abs(dragY) / 140), 1) : 0;

               let cardTop = 68;
               let cardTilt = 0;
               let cardScale = 1;
               let cardBlur = 0;
               let cardOpacity = 1;
               let cardShadow = `0 ${8 + glassProgress * 8}px ${32 + glassProgress * 22}px -12px oklch(0.22 0.035 250 / ${0.28 + glassProgress * 0.18})`;

               if (offset === 0) {
                 if (dragX < 0) {
                   cardTop = 68 + dragY * 0.42;
                   cardTilt = dragX * 0.014;
                   cardScale = 1 - swipeProgress * 0.012;
                   cardBlur = 0;
                   cardOpacity = 1;
                 } else if (backProgress > 0) {
                   // When swiping to previous card, current card steps back into slot 1
                   cardTop = 68 - backProgress * 34;
                   cardTilt = -backProgress * 3;
                   cardScale = 1 - backProgress * 0.04;
                   cardBlur = backProgress * 1.5;
                   cardOpacity = 1;
                   cardShadow = `0 ${8 - backProgress * 2}px ${32 - backProgress * 8}px -12px oklch(0.22 0.035 250 / ${0.28 - backProgress * 0.04})`;
                 } else {
                   cardTop = 68;
                   cardTilt = dragX * 0.014;
                   cardScale = 1;
                   cardBlur = 0;
                   cardOpacity = 1;
                 }
               } else if (offset === 1) {
                 if (dragX < 0) {
                   // Behind card 1: smoothly un-tilts from -3deg to 0deg, scales from 0.96 to 1.0, rises from 34px to 68px
                   cardTop = 34 + swipeProgress * 34 + pullUpAdvance;
                   cardTilt = -3 * (1 - swipeProgress);
                   cardScale = 0.96 + swipeProgress * 0.04;
                   cardBlur = Math.max(0, 1.5 * (1 - swipeProgress));
                   cardOpacity = 1;
                   cardShadow = `0 ${6 + swipeProgress * 2}px ${24 + swipeProgress * 8}px -12px oklch(0.22 0.035 250 / ${0.24 + swipeProgress * 0.04})`;
                 } else if (backProgress > 0) {
                   // When swiping to previous card, slot 1 steps back into slot 2
                   cardTop = 34 - backProgress * 34;
                   cardTilt = -3 + backProgress * 7;
                   cardScale = 0.96 - backProgress * 0.04;
                   cardBlur = 1.5 + backProgress * 1.5;
                   cardOpacity = 1;
                   cardShadow = `0 ${6 - backProgress * 2}px ${24 - backProgress * 8}px -12px oklch(0.22 0.035 250 / ${0.24 - backProgress * 0.04})`;
                 } else {
                   cardTop = 34 + pullUpAdvance;
                   cardTilt = -3;
                   cardScale = 0.96;
                   cardBlur = 1.5;
                   cardOpacity = 1;
                   cardShadow = "0 6px 24px -12px oklch(0.22 0.035 250 / 0.24)";
                 }
               } else if (offset === 2) {
                 if (dragX < 0) {
                   // Behind card 2: smoothly tilts from +4deg to -3deg, scales from 0.92 to 0.96, rises from 0px to 34px
                   cardTop = 0 + swipeProgress * 34 + pullUpAdvance;
                   cardTilt = 4 - swipeProgress * 7;
                   cardScale = 0.92 + swipeProgress * 0.04;
                   cardBlur = Math.max(0, 3 - swipeProgress * 1.5);
                   cardOpacity = 1;
                   cardShadow = `0 ${4 + swipeProgress * 2}px ${16 + swipeProgress * 8}px -12px oklch(0.22 0.035 250 / ${0.20 + swipeProgress * 0.04})`;
                 } else if (backProgress > 0) {
                   // When swiping to previous card, slot 2 steps back into slot 3
                   cardTop = 0 - backProgress * 18;
                   cardTilt = 4 - backProgress * 3;
                   cardScale = 0.92 - backProgress * 0.04;
                   cardBlur = 3 + backProgress * 1;
                   cardOpacity = Math.max(0, 1 - backProgress);
                   cardShadow = "0 4px 16px -12px oklch(0.22 0.035 250 / 0.20)";
                 } else {
                   cardTop = 0 + pullUpAdvance;
                   cardTilt = 4;
                   cardScale = 0.92;
                   cardBlur = 3;
                   cardOpacity = 1;
                   cardShadow = "0 4px 16px -12px oklch(0.22 0.035 250 / 0.20)";
                 }
               } else if (offset === 3) {
                 if (dragX < 0) {
                   // Behind card 3: smoothly fades in, scales to 0.92, rises to 0px, tilts to 4deg
                   cardTop = -18 + swipeProgress * 18 + pullUpAdvance;
                   cardTilt = 1 + swipeProgress * 3;
                   cardScale = 0.88 + swipeProgress * 0.04;
                   cardBlur = Math.max(0, 4 - swipeProgress * 1);
                   cardOpacity = swipeProgress;
                   cardShadow = "0 4px 16px -12px oklch(0.22 0.035 250 / 0.20)";
                 } else {
                   cardTop = -18;
                   cardTilt = 1;
                   cardScale = 0.88;
                   cardBlur = 4;
                   cardOpacity = 0;
                   cardShadow = "0 4px 16px -12px oklch(0.22 0.035 250 / 0.20)";
                 }
               }

               const cardTransform = `translate3d(${isFront && dragX < 0 ? dragX : 0}px, 0px, 0) rotate(${cardTilt}deg) scale(${cardScale})`;

               return (
                 <article
                   key={story.id}
                   onPointerDown={isFront ? (event) => {
                     (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
                     onPointerDown(event.clientX, event.clientY);
                   } : undefined}
                   onPointerMove={isFront ? (event) => onPointerMove(event.clientX, event.clientY) : undefined}
                   onPointerUp={isFront ? onPointerUp : undefined}
                   onPointerCancel={isFront ? onPointerUp : undefined}
                   className={`story-card gesture-story-card absolute inset-x-0 cursor-grab active:cursor-grabbing ${glassProgress > 0 ? "gesture-story-card-active" : ""}`}
                   style={{
                     zIndex: 10 - offset,
                     top: `${cardTop}px`,
                     transform: cardTransform,
                     opacity: cardOpacity,
                     filter: `blur(${cardBlur}px)`,
                     boxShadow: cardShadow,
                     transition: isSettling
                       ? "transform 380ms cubic-bezier(.16,1,.3,1), top 380ms cubic-bezier(.16,1,.3,1), filter 380ms cubic-bezier(.16,1,.3,1), opacity 380ms ease, box-shadow 380ms ease"
                       : "none",
                     "--gesture-glass": glassProgress,
                   } as React.CSSProperties}
                 >
                   <StoryHeader story={story} onDownload={() => void downloadStory(story)} />
                   <button type="button" onClick={() => openStory(story)} className="block w-full text-left">
                     <h3 className="line-clamp-3 px-4 pb-3 pt-1 text-[19px] font-bold leading-[1.08]">{story.title}</h3>
                     <img src={story.image} alt="" className="mt-2 h-[270px] w-full object-cover" width={1200} height={912} draggable={false} />
                   </button>
                   <Engagement story={story} />
                 </article>
               );
             });

             return prevArticleNode ? [prevArticleNode, ...deckCards] : deckCards;
           })()}
        </div>
      ) : (
        <div className="mt-16 text-center text-sm text-muted-foreground">More {activeCategory} stories are arriving soon.</div>
      )}
      {visibleStories.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5">
            {(() => {
              const maxDots = 7;
              const total = visibleStories.length;
              const windowStart = Math.floor(cardIndex / maxDots) * maxDots;
              const dotCount = Math.min(total - windowStart, maxDots);
              return Array.from({ length: dotCount }).map((_, i) => {
                const dotIndex = windowStart + i;
                return (
                  <button
                    type="button"
                    key={dotIndex}
                    onClick={() => setCardIndex(dotIndex)}
                    aria-label={`Go to story ${dotIndex + 1}`}
                    className={`h-2 rounded-full transition-all ${dotIndex === cardIndex ? "w-5 bg-primary" : "w-2 bg-primary/25"}`}
                  />
                );
              });
            })()}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1"><ChevronLeft size={13} /> Swipe left: next</span>
            <span className="flex items-center gap-1">Swipe right: previous <ChevronRight size={13} /></span>
          </div>
          <button
            type="button"
            onClick={() => setView("all")}
            className="rounded-full px-4 py-1.5 text-[12px] font-semibold shadow-md"
            style={{ backgroundColor: "#012c6c", color: "#ffffff" }}
          >
            See All
          </button>
        </div>
      )}

    </div>
  );
}

function AllNewsView({ openStory, setView }: { openStory: (story: Story) => void; setView: (view: View) => void }) {
  return (
    <div className="list-screen min-h-dvh px-4 pb-8 pt-4">
      <header className="mt-5 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
        <IconButton label="Back" onClick={() => setView("home")}><ChevronLeft size={21} /></IconButton>
        <h1 className="truncate text-center text-[17px] font-bold">News</h1>
        <IconButton label="More options"><EllipsisVertical size={20} /></IconButton>
      </header>
      <section className="mt-5 space-y-3" aria-label="All news stories">
        {stories.concat(stories.slice(0, 1)).map((story, index) => (
          <article key={`${story.id}-${index}`} className="story-card overflow-hidden">
             <StoryHeader story={story} onDownload={() => void downloadStory(story)} />
            <button type="button" onClick={() => openStory(story)} className="block w-full text-left">
              <h2 className="px-4 pb-3 text-[18px] font-bold leading-[1.08]">{story.title}</h2>
              <img src={story.image} alt="" className="h-[250px] w-full object-cover" width={1200} height={912} loading={index > 0 ? "lazy" : undefined} />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

function SavedView({ openStory, setView }: { openStory: (story: Story) => void; setView: (view: View) => void }) {
  const state = useSyncExternalStore(subscribeEngagement, getEngagementSnapshot, getEngagementSnapshot);
  const savedStories = stories.filter((story) => state.saved[story.id]);
  return (
    <div className="list-screen min-h-dvh px-4 pb-8 pt-4">
      <header className="mt-5 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
        <IconButton label="Back" onClick={() => setView("home")}><ChevronLeft size={21} /></IconButton>
        <h1 className="truncate text-center text-[17px] font-bold">Saved stories</h1>
        <span aria-hidden className="h-11 w-11" />
      </header>
      <section className="mt-5 space-y-3" aria-label="Saved stories">
        {savedStories.map((story, index) => (
          <article key={story.id} className="story-card overflow-hidden">
            <StoryHeader story={story} onDownload={() => void downloadStory(story)} />
            <button type="button" onClick={() => openStory(story)} className="block w-full text-left">
              <h2 className="px-4 pb-3 text-[18px] font-bold leading-[1.08]">{story.title}</h2>
              <img src={story.image} alt="" className="h-[250px] w-full object-cover" width={1200} height={912} loading={index > 0 ? "lazy" : undefined} />
            </button>
            <Engagement story={story} />
          </article>
        ))}
        {savedStories.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Bookmark size={36} className="text-muted-foreground" aria-hidden />
            <p className="text-[15px] font-bold">No saved stories yet</p>
            <p className="max-w-[240px] text-[13px] text-muted-foreground">
              Tap the bookmark icon on any story and it will show up here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function ArticleView({
  story,
  setView,
  onBack,
}: {
  story: Story;
  setView: (view: View) => void;
  onBack?: () => void;
}) {
  useStoryViewCounter(story.id);
  const { views } = useStoryEngagement(story);
  return (
    <article className="article-screen min-h-dvh bg-card">
      <div className="relative h-[310px] overflow-hidden">
        <img src={story.image} alt="News scene for the featured story" className="h-full w-full object-cover" width={1200} height={912} />
        <div className="article-image-shade absolute inset-0" />
        <div className="absolute inset-x-0 top-0 px-5 pt-4 text-primary-foreground">
          <div className="mt-6 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
            <IconButton label="Back" glass onClick={() => (onBack ? onBack() : setView("all"))}><ChevronLeft size={21} /></IconButton>
            <span className="flex items-center justify-center gap-1 truncate text-center text-[16px] font-bold">Trending now <Flame size={17} fill="currentColor" aria-label="fire" /></span>
            <IconButton label="More options" glass><EllipsisVertical size={20} /></IconButton>
          </div>
        </div>
      </div>
      <div className="relative -mt-6 min-h-[570px] rounded-t-[30px] bg-card px-5 pb-12 pt-5">
        <div className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px] items-center gap-2">
          <StorySource story={story} />
          <BookmarkButton story={story} size={20} />
          <ShareMenu story={story} />
          <IconButton label="Download article as PNG" onClick={() => void downloadStory(story)}><Download size={18} /></IconButton>
        </div>
        <h1 className="mt-5 text-[26px] font-bold leading-[1.05]">{story.title}</h1>
        <p className="mt-3 text-[12px] font-medium text-muted-foreground">{story.date}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] font-bold">
          <span className="truncate">By {story.author}</span>
          <span>{story.city ? `${story.city}, ` : ""}{story.source}</span>
          <span className="ml-auto flex items-center gap-3">
            <LikeButton story={story} size={22} />
            <span className="flex items-center gap-1 font-semibold"><Eye size={16} /> {views}</span>
          </span>
        </div>
        <div className="my-4 h-px bg-border" />
        <div className="space-y-5 text-[15px] font-medium leading-[1.45] text-article-copy">
          {story.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      </div>
    </article>
  );
}

function StoryHeader({ story, onDownload }: { story: Story; onDownload: () => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_38px_38px] items-center gap-1 px-4 py-3">
      <StorySource story={story} />
      <IconButton label="Download article as PNG" compact onClick={onDownload}><Download size={17} /></IconButton>
      <IconButton label="Story options" compact><EllipsisVertical size={18} /></IconButton>
    </div>
  );
}

function StorySource({ story }: { story: Story }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="source-logo shrink-0" aria-label={`${story.topic} news`}>{topicIcon(story.topic)}</div>
      <div className="min-w-0">
        <p className="flex items-center gap-1 truncate text-[15px] font-bold">
          {story.city ? `${story.city}, ` : ""}{story.source} <span className="verified">✓</span>
        </p>
        <p className="text-[11px] font-medium text-muted-foreground">{story.topic} · {story.age}</p>
      </div>
    </div>
  );
}

type EngagementState = {
  liked: Record<number, boolean>;
  saved: Record<number, boolean>;
  views: Record<number, number>;
};

const ENGAGEMENT_KEY = "shortbits-engagement";
let engagementState: EngagementState = { liked: {}, saved: {}, views: {} };
const engagementListeners = new Set<() => void>();
let engagementLoaded = false;

function loadEngagement() {
  if (engagementLoaded || typeof window === "undefined") return;
  engagementLoaded = true;
  try {
    const raw = window.localStorage.getItem(ENGAGEMENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<EngagementState>;
      engagementState = {
        liked: parsed.liked ?? {},
        saved: parsed.saved ?? {},
        views: parsed.views ?? {},
      };
    }
  } catch {
    /* ignore corrupt storage */
  }
}

function commitEngagement(next: EngagementState) {
  engagementState = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  }
  engagementListeners.forEach((listener) => listener());
}

function subscribeEngagement(listener: () => void) {
  loadEngagement();
  engagementListeners.add(listener);
  return () => engagementListeners.delete(listener);
}

function getEngagementSnapshot() {
  loadEngagement();
  return engagementState;
}

function toggleLike(id: number) {
  const liked = { ...engagementState.liked, [id]: !engagementState.liked[id] };
  commitEngagement({ ...engagementState, liked });
}

function toggleSave(id: number) {
  const saved = { ...engagementState.saved, [id]: !engagementState.saved[id] };
  commitEngagement({ ...engagementState, saved });
}

function registerView(id: number) {
  loadEngagement();
  const views = { ...engagementState.views, [id]: (engagementState.views[id] ?? 0) + 1 };
  commitEngagement({ ...engagementState, views });
}

function parseCount(value: string) {
  const numeric = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
  return /k/i.test(value) ? Math.round(numeric * 1000) : Math.round(numeric);
}

function formatCount(value: number) {
  if (value >= 1000) {
    const scaled = value / 1000;
    return `${scaled >= 10 ? Math.round(scaled) : scaled.toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `${value}`;
}

function useStoryEngagement(story: Story | null) {
  const state = useSyncExternalStore(subscribeEngagement, getEngagementSnapshot, getEngagementSnapshot);
  if (!story) return { liked: false, saved: false, likes: "0", views: "0" };
  const liked = Boolean(state.liked[story.id]);
  const saved = Boolean(state.saved[story.id]);
  return {
    liked,
    saved,
    likes: formatCount(parseCount(story.likes) + (liked ? 1 : 0)),
    views: formatCount(parseCount(story.views) + (state.views[story.id] ?? 0)),
  };
}

function useStoryViewCounter(id: number | null) {
  useEffect(() => {
    if (id !== null) registerView(id);
  }, [id]);
}

function LikeButton({ story, size = 20 }: { story: Story; size?: number }) {
  const { liked, likes } = useStoryEngagement(story);
  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Unlike story" : "Like story"}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        toggleLike(story.id);
      }}
      className={`like-button ${liked ? "like-button-active" : ""}`}
    >
      <Heart size={size} fill={liked ? "currentColor" : "none"} />
      <span>{likes}</span>
    </button>
  );
}

function BookmarkButton({ story, size = 18 }: { story: Story; size?: number }) {
  const { saved } = useStoryEngagement(story);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove bookmark" : "Bookmark story"}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        toggleSave(story.id);
      }}
      className={`bookmark-button ${saved ? "bookmark-button-active" : ""}`}
    >
      <Bookmark size={size} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

function Engagement({ story }: { story: Story }) {
  const { views } = useStoryEngagement(story);
  return (
    <div className="flex h-14 items-center gap-4 px-4 text-[12px] font-semibold">
      <LikeButton story={story} size={28} />
      <span className="flex items-center gap-1"><Eye size={15} /> {views}</span>
      <span className="ml-auto flex items-center gap-2.5">
        <BookmarkButton story={story} size={20} />
        <ShareMenu story={story} bare compact />
      </span>
    </div>
  );
}

function ShareMenu({ story, compact = false, bare = false }: { story: Story; compact?: boolean; bare?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const storyUrl = () => {
    const dateStr = story.publishedAt
      ? new Date(story.publishedAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const slug = slugify(story.title);
    const origin = typeof window !== "undefined" ? window.location.origin : "https://theshortbits.com";
    return `${origin}/${dateStr}/${slug}`;
  };

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const menuWidth = 292;
      setPosition({
        top: Math.max(12, rect.top - 66),
        left: Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth)),
      });
    }
    setCopied(false);
    setOpen((value) => !value);
  };

  const copyLink = async () => {
    const url = storyUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("textarea");
      input.value = url;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1400);
  };

  const shareLinks = () => {
    const url = encodeURIComponent(storyUrl());
    const title = encodeURIComponent(story.title);
    return [
      { label: "WhatsApp", href: `https://wa.me/?text=${title}%20${url}`, icon: <MessageCircle size={18} /> },
      { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${url}`, icon: <Facebook size={18} /> },
      { label: "X", href: `https://twitter.com/intent/tweet?text=${title}&url=${url}`, icon: <span className="text-[15px] font-black">X</span> },
      { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, icon: <Linkedin size={18} /> },
    ];
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Close share options" : "Share article"}
        aria-expanded={open}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={openMenu}
        className={`icon-button ${compact ? "icon-button-compact" : ""} ${bare ? "icon-button-bare" : ""} ${open ? "share-trigger-active" : ""}`}
      >
        <Share2 size={compact ? 15 : 18} />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <>
          <button type="button" className="fixed inset-0 z-[90] cursor-default" aria-label="Close share options" onClick={() => setOpen(false)} />
          <div
            className="share-burst"
            style={{ top: position.top, left: position.left }}
            role="menu"
            aria-label={`Share ${story.title}`}
          >
            {shareLinks().map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                role="menuitem"
                aria-label={`Share on ${item.label}`}
                title={item.label}
                className="share-action"
                onClick={() => setOpen(false)}
              >
                {item.icon}
              </a>
            ))}
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                role="menuitem"
                className="share-action"
                aria-label="More sharing options"
                title="More"
                onClick={() => {
                  void navigator.share({ title: story.title, text: story.title, url: storyUrl() }).finally(() => setOpen(false));
                }}
              >
                <Share2 size={18} />
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className={`share-action share-copy ${copied ? "share-copy-success" : ""}`}
              aria-label={copied ? "Link copied" : "Copy article link"}
              title={copied ? "Copied" : "Copy link"}
              onClick={() => void copyLink()}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

function BottomNav({ view, setView }: { view: View; setView: (view: View) => void }) {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <button type="button" aria-label="Home" className={`bottom-action ${view === "home" ? "bottom-action-active" : ""}`} onClick={() => setView("home")}><Home size={19} /></button>
      <button type="button" aria-label="Video news" className={`bottom-action ${view === "shorts" ? "bottom-action-active" : ""}`} onClick={() => setView("shorts")}><Play size={19} /></button>
      <button type="button" aria-label="Saved stories" className={`bottom-action ${view === "saved" ? "bottom-action-active" : ""}`} onClick={() => setView("saved")}><Bookmark size={19} fill={view === "saved" ? "currentColor" : "none"} /></button>
      <button type="button" aria-label="Profile" className="bottom-action" onClick={() => navigate({ to: "/account" })}><UserRound size={19} /></button>
    </nav>
  );
}

function IconButton({ children, label, onClick, glass = false, compact = false, bare = false }: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  glass?: boolean;
  compact?: boolean;
  bare?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`icon-button ${glass ? "icon-button-glass" : ""} ${compact ? "icon-button-compact" : ""} ${bare ? "icon-button-bare" : ""}`}
    >
      {children}
    </button>
  );
}

function DesktopView() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Story | null>(stories[0] ?? null);
  useStoryViewCounter(selected?.id ?? null);
  const { views: selectedViews } = useStoryEngagement(selected);
  const [activeTopic, setActiveTopic] = useState<string>("All News");
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [rangeHours, setRangeHours] = useState(6);
  const [showShorts, setShowShorts] = useState(false);
  const [showEpaper, setShowEpaper] = useState(false);
  const [sidebarPage, setSidebarPage] = useState(0);
  const engagement = useSyncExternalStore(subscribeEngagement, getEngagementSnapshot, getEngagementSnapshot);

  useEffect(() => {
    setSidebarPage(0);
  }, [rangeHours, activeTopic, query, savedOnly]);

  useEffect(() => {
    const storyId = Number(new URLSearchParams(window.location.search).get("story"));
    const linkedStory = stories.find((story) => story.id === storyId);
    if (linkedStory) setSelected(linkedStory);
  }, []);

  const search = query.trim().toLowerCase();
  const savedStories = stories.filter((story) => engagement.saved[story.id]);
  const list = savedOnly
    ? savedStories
    : search
    ? stories.filter((story) =>
        [story.title, story.source, story.city ?? "", story.topic, story.author, story.body.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
    : activeTopic === "All News"
      ? stories
      : stories.filter((story) => story.topic === activeTopic);

  const rangeCutoff = Date.now() - rangeHours * 3600000;
  const rangedList = savedOnly ? list : list.filter((story) => (story.publishedAt ?? Date.now()) >= rangeCutoff);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(rangedList.length / pageSize));
  const safePage = Math.min(sidebarPage, pageCount - 1);
  const visibleList = rangedList.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const navList = list.length ? list : stories;
  const selectedIndex = selected ? navList.findIndex((story) => story.id === selected.id) : -1;
  const prevStory = selectedIndex > 0 ? navList[selectedIndex - 1] : null;
  const nextStory = selectedIndex >= 0 && selectedIndex < navList.length - 1 ? navList[selectedIndex + 1] : null;
  const goPrev = () => prevStory && setSelected(prevStory);
  const goNext = () => nextStory && setSelected(nextStory);

  useEffect(() => {
    if (!selected && stories.length) setSelected(stories[0]!);
  });

  if (showEpaper) {
    return (
      <div className="min-h-screen bg-[#faf8f3]">
        <EPaperPage stories={stories} onBack={() => setShowEpaper(false)} />
      </div>
    );
  }

  if (!selected) {
    return (
      <main className="desktop-stage grid min-h-dvh place-items-center text-sm text-muted-foreground">
        No stories yet — new articles appear here automatically.
      </main>
    );
  }

  return (
    <main className="desktop-stage min-h-dvh">
      <header className="desktop-header">
        <div className="desktop-wrap flex items-center gap-6 py-4">
          <h1 className="brand-wordmark text-[26px] font-bold leading-none tracking-tight">
            ShortBits<span className="brand-dot">.</span>
          </h1>
          <nav aria-label="Categories" className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
            {["All News", ...topicCategories].map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveTopic(topic)}
                className={`category-pill ${activeTopic === topic ? "category-pill-active" : ""}`}
              >
                {topic}
              </button>
            ))}
          </nav>
          <label className="desktop-search">
            <Search size={16} className="text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search news…"
              aria-label="Search news"
            />
          </label>
          <button
            type="button"
            className="install-pwa-button"
            aria-label="Install ShortBits App"
            onClick={() => window.dispatchEvent(new CustomEvent("open-pwa-install"))}
          >
            <Download size={13} /> <span>Install App</span>
          </button>
          <button
            type="button"
            className="epaper-button"
            aria-label="Open E-Paper Editions"
            onClick={() => setShowEpaper(true)}
          >
            <FileText size={14} /> <span>E-Paper</span>
          </button>
          <button
            type="button"
            className="epaper-button"
            aria-label="My Account & Preferences"
            onClick={() => navigate({ to: "/account" })}
          >
            <UserRound size={14} /> <span>Account</span>
          </button>
        </div>
      </header>

      <div className="desktop-wrap grid grid-cols-[minmax(0,1fr)_360px] gap-10 py-10">
        <article key={selected.id} className="desktop-article relative">
          <button
            type="button"
            onClick={goPrev}
            disabled={!prevStory}
            aria-label="Previous article"
            className="absolute -left-6 top-[524px] z-10 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/70 shadow-lg backdrop-blur-md transition hover:bg-background/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!nextStory}
            aria-label="Next article"
            className="absolute -right-6 top-[524px] z-10 grid h-14 w-14 -translate-y-1/2 place-items-center rounded-full border border-border bg-background/70 shadow-lg backdrop-blur-md transition hover:bg-background/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={24} />
          </button>
          <img src={selected.image} alt="" className="h-[420px] w-full rounded-3xl object-cover" />
          <div className="mt-6 flex items-center justify-between gap-4">
            <StorySource story={selected} />
            <div className="flex items-center gap-2">
              <ShareMenu story={selected} />
              <IconButton label="Download article as PNG" onClick={() => void downloadStory(selected)}>
                <Download size={18} />
              </IconButton>
            </div>
          </div>
          <h2 className="mt-5 text-[40px] font-bold leading-[1.05]">{selected.title}</h2>
          <p className="mt-3 text-[13px] font-medium text-muted-foreground">
            By {selected.author} · {selected.date}
          </p>
          <div className="my-6 h-px bg-border" />
          <div className="max-w-[70ch] space-y-5 text-[17px] font-medium leading-[1.6] text-article-copy">
            {selected.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-6 text-[13px] font-semibold text-muted-foreground">
            <LikeButton story={selected} size={22} />
            <span className="flex items-center gap-1.5"><Eye size={16} /> {selectedViews}</span>
            <BookmarkButton story={selected} size={20} />
            <span className="ml-auto text-[12px] font-semibold">
              {selectedIndex >= 0 ? `${selectedIndex + 1} / ${navList.length}` : ""}
            </span>
          </div>
        </article>

        <aside aria-label="More stories">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-1.5 text-[15px] font-bold">
              {savedOnly ? (
                <>Saved stories <Bookmark size={16} fill="currentColor" aria-hidden /></>
              ) : (
                <>Trending now <Flame className="text-destructive" size={16} fill="currentColor" aria-hidden /></>
              )}
            </h3>
            {!savedOnly && (
              <div className="flex items-center gap-1 rounded-full border border-border bg-background/60 p-1">
                {[
                  { hours: 1, label: "Past hour" },
                  { hours: 6, label: "6h" },
                  { hours: 24, label: "24h" },
                ].map((option) => (
                  <button
                    key={option.hours}
                    type="button"
                    onClick={() => setRangeHours(option.hours)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                      rangeHours === option.hours
                        ? "bg-[#012c6c] text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ul className="mt-4 space-y-2">
            {visibleList.map((story) => (
              <li key={story.id}>
                <button
                  type="button"
                  onClick={() => setSelected(story)}
                  className={`desktop-item ${selected.id === story.id ? "desktop-item-active" : ""}`}
                >
                  <img src={story.image} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {story.topic} · {story.city ? `${story.city}, ` : ""}{story.source}
                    </span>
                    <span className="mt-1 block text-[14px] font-bold leading-[1.2]">{story.title}</span>
                  </span>
                </button>
              </li>
            ))}
            {visibleList.length === 0 && (
              <li className="py-8 text-center text-sm text-muted-foreground">
                {savedOnly ? "No saved stories yet — tap the bookmark icon on any story." : "No stories match that search."}
              </li>
            )}
          </ul>
          {!savedOnly && (
            <div className="mt-4 flex items-center justify-center gap-3 text-[12px] font-semibold text-muted-foreground">
              <button
                type="button"
                aria-label="Previous 10 stories"
                onClick={() => setSidebarPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="grid h-7 w-7 place-items-center rounded-full border border-border bg-background/60 transition hover:bg-background/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span>
                {safePage * pageSize + 1}–{safePage * pageSize + visibleList.length} / {rangedList.length} in past {rangeHours === 1 ? "hour" : `${rangeHours} hours`}
              </span>
              <button
                type="button"
                aria-label="Next 10 stories"
                onClick={() => setSidebarPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                className="grid h-7 w-7 place-items-center rounded-full border border-border bg-background/60 transition hover:bg-background/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </aside>
      </div>
      <nav
        aria-label="Primary navigation"
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-background/55 p-2 shadow-2xl backdrop-blur-2xl saturate-150"
      >
        <button type="button" aria-label="Home" className={`bottom-action ${savedOnly ? "" : "bottom-action-active"}`} onClick={() => { setSavedOnly(false); if (stories[0]) setSelected(stories[0]); }}><Home size={20} /></button>
        <button type="button" aria-label="Video news" className={`bottom-action ${showShorts ? "bottom-action-active" : ""}`} onClick={() => setShowShorts(true)}><Play size={20} /></button>
        <button type="button" aria-label="Saved stories" className={`bottom-action ${savedOnly ? "bottom-action-active" : ""}`} onClick={() => setSavedOnly((value) => !value)}><Bookmark size={20} fill={savedOnly ? "currentColor" : "none"} /></button>
        <button type="button" aria-label="Profile" className="bottom-action" onClick={() => navigate({ to: "/account" })}><UserRound size={20} /></button>
      </nav>
      {showShorts && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 backdrop-blur-sm">
          <div className="relative">
            <button type="button" className="shorts-back" onClick={() => setShowShorts(false)} aria-label="Close" style={{ position: "absolute", top: "12px", right: "-19px", zIndex: 40 }}>
              <X size={22} />
            </button>
            <div className="h-[86vh] w-[min(420px,94vw)] overflow-hidden rounded-3xl shadow-2xl">
              <ShortsFeed onBack={() => setShowShorts(false)} externalClose />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- Published articles from the newsroom dashboard ---------- */

const PUBLISHED_ID_BASE = 10000;
const mergedArticleIds = new Set<string>();

function topicForCategory(category: string): Story["topic"] {
  const key = category.toLowerCase();
  if (["politics", "war", "world", "india", "visa", "breaking"].includes(key)) return "Politics";
  if (["sports"].includes(key)) return "Sports";
  if (["technology", "science", "nature"].includes(key)) return "Tech";
  if (["business", "jobs", "education"].includes(key)) return "Business";
  if (["crime"].includes(key)) return "Crime";
  return "Politics";
}

function relativeAge(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 1_000_000_000) + PUBLISHED_ID_BASE;
}

function mergePublishedArticles(articles: Article[]) {
  let added = 0;
  articles.forEach((article) => {
    if (mergedArticleIds.has(article.id)) return;
    mergedArticleIds.add(article.id);
    const published = new Date(article.published_at);
    const publishedAt = isNaN(published.getTime()) ? Date.now() : published.getTime();
    const paragraphs = article.detail
      .split(/\n{1,}/)
      .map((part) => part.trim())
      .filter(Boolean);
    (stories as Story[]).push({
      id: hashString(article.id),
      source: article.country ?? "World",
      ...(article.city ? { city: article.city } : {}),
      topic: topicForCategory(article.category),
      age: relativeAge(article.published_at),
      title: article.title,
      image: article.image_url || summitNews,
      category: article.category.charAt(0).toUpperCase() + article.category.slice(1),
      likes: "0",
      comments: "0",
      views: "0",
      date: published.toLocaleString(),
      publishedAt,
      author: "ShortBits Desk",
      body: paragraphs.length ? paragraphs : [article.title],
    });
    added += 1;
  });

  if (added > 0) {
    (stories as Story[]).sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  }

  return added;
}
