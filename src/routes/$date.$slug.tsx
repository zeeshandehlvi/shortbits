import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronLeft,
  Flame,
  Share2,
  Bookmark,
  Download,
  Heart,
  Eye,
  Trophy,
  Laptop,
  Building2,
  ShieldAlert,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import { useState } from "react";

import {
  getArticleByDateAndSlug,
  slugify,
  getArticleDateStr,
  type Article,
} from "@/lib/articles.functions";
import { downloadStoryClip, type EPaperStory } from "@/lib/epaper";

export const Route = createFileRoute("/$date/$slug")({
  loader: async ({ params }) => {
    const article = await getArticleByDateAndSlug({
      data: { date: params.date, slug: params.slug },
    });
    if (!article) {
      throw notFound();
    }
    return { article };
  },
  head: ({ loaderData, params }) => {
    const article = loaderData?.article;
    if (!article) {
      return {
        meta: [{ title: "Story Not Found | ShortBits" }],
      };
    }

    const title = `${article.title} | ShortBits News`;
    const description =
      article.detail.slice(0, 160).replace(/[\r\n]+/g, " ").trim() +
      (article.detail.length > 160 ? "…" : "");
    const canonicalUrl = `https://theshortbits.com/${params.date}/${params.slug}`;
    const imageUrl = article.image_url || "https://theshortbits.com/og-image.jpg";

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      description: description,
      image: [imageUrl],
      datePublished: article.published_at,
      dateModified: article.published_at,
      articleSection: article.category,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      author: [
        {
          "@type": "Organization",
          name: "ShortBits Newsroom",
          url: "https://theshortbits.com",
        },
      ],
      publisher: {
        "@type": "Organization",
        name: "ShortBits",
        url: "https://theshortbits.com",
        logo: {
          "@type": "ImageObject",
          url: "https://theshortbits.com/icon-512.png",
          width: 512,
          height: 512,
        },
      },
      ...(article.city || article.country
        ? {
            contentLocation: {
              "@type": "Place",
              name: [article.city, article.country].filter(Boolean).join(", "),
            },
          }
        : {}),
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "keywords",
          content: `${article.category}, ${article.title}, breaking news, ShortBits, ${article.city || ""}, ${article.country || ""}, world news, viral news, best news website in America, top news in world`,
        },
        // OpenGraph
        { property: "og:type", content: "article" },
        { property: "og:site_name", content: "ShortBits" },
        { property: "og:title", content: article.title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: imageUrl },
        { property: "og:image:alt", content: article.title },
        { property: "article:published_time", content: article.published_at },
        { property: "article:section", content: article.category },
        // Twitter
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:site", content: "@ShortBits" },
        { name: "twitter:title", content: article.title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: imageUrl },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  component: ArticlePermalinkPage,
});

function topicIcon(topic: string, size = 18) {
  const t = topic.toLowerCase();
  if (t.includes("sport")) return <Trophy size={size} />;
  if (t.includes("tech")) return <Laptop size={size} />;
  if (t.includes("busin") || t.includes("econ")) return <Building2 size={size} />;
  if (t.includes("crime")) return <ShieldAlert size={size} />;
  return <Sparkles size={size} />;
}

function ArticlePermalinkPage() {
  const { article } = Route.useLoaderData();
  const { date, slug } = Route.useParams();

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(128);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastNote, setToastNote] = useState<string | null>(null);

  const formattedDate = new Date(article.published_at).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleShare = async () => {
    const url = `https://theshortbits.com/${date}/${slug}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: `${article.title} - ShortBits`,
          url,
        });
        return;
      } catch {
        // user cancelled, fallback to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setToastNote("Link copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        setToastNote(null);
      }, 2500);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setToastNote("Generating e-Clip…");
      const epStory: EPaperStory = {
        id: 1,
        title: article.title,
        body: article.detail.split("\n\n").filter(Boolean),
        image: article.image_url || "",
        topic: article.category,
        ...(article.city ? { city: article.city } : {}),
        source: "ShortBits",
        age: formattedDate,
        author: "ShortBits Desk",
        category: article.category,
      };
      const ok = await downloadStoryClip(epStory);
      if (ok) {
        setToastNote("e-Clip saved to device!");
      } else {
        setToastNote("Could not save e-Clip.");
      }
    } catch {
      setToastNote("e-Clip error.");
    } finally {
      setIsDownloading(false);
      setTimeout(() => setToastNote(null), 3000);
    }
  };

  const paragraphs = article.detail.split("\n\n").filter(Boolean);
  const sourceName = article.country ? `ShortBits ${article.country}` : "ShortBits";

  return (
    <main className="news-stage min-h-dvh">
      <div className="phone-shell">
        <div className="phone-scroll">
          <article className="article-screen min-h-dvh bg-card">
            {/* Hero Image Section */}
            <div className="relative h-[310px] overflow-hidden">
              <img
                src={article.image_url || "https://theshortbits.com/og-image.jpg"}
                alt={article.title}
                className="h-full w-full object-cover"
                width={1200}
                height={912}
              />
              <div className="article-image-shade absolute inset-0" />
              <div className="absolute inset-x-0 top-0 px-5 pt-4 text-primary-foreground">
                <div className="mt-6 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2">
                  <Link
                    to="/"
                    aria-label="Back to all news"
                    className="icon-button icon-button-glass flex items-center justify-center"
                  >
                    <ChevronLeft size={21} />
                  </Link>
                  <span className="flex items-center justify-center gap-1 truncate text-center text-[16px] font-bold">
                    Trending now <Flame size={17} fill="currentColor" aria-label="fire" />
                  </span>
                  <button
                    type="button"
                    aria-label="Share story"
                    onClick={handleShare}
                    className="icon-button icon-button-glass flex items-center justify-center"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Card Content */}
            <div className="relative -mt-6 min-h-[570px] rounded-t-[30px] bg-card px-5 pb-12 pt-5">
              {/* Header Row: Source info + actions */}
              <div className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px] items-center gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="source-logo shrink-0" aria-label={`${article.category} news`}>
                    {topicIcon(article.category)}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-[15px] font-bold">
                      {article.city ? `${article.city}, ` : ""}{sourceName} <span className="verified">✓</span>
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {article.category} · {formattedDate}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={saved ? "Remove bookmark" : "Bookmark story"}
                  onClick={() => setSaved(!saved)}
                  className="icon-button"
                >
                  <Bookmark size={20} fill={saved ? "currentColor" : "none"} />
                </button>

                <button
                  type="button"
                  aria-label="Share article"
                  onClick={handleShare}
                  className="icon-button"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                </button>

                <button
                  type="button"
                  aria-label="Download article as PNG"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="icon-button"
                >
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                </button>
              </div>

              {/* Title */}
              <h1 className="mt-5 text-[26px] font-bold leading-[1.05]">{article.title}</h1>
              <p className="mt-3 text-[12px] font-medium text-muted-foreground">{formattedDate}</p>

              {/* Author & Engagement Row */}
              <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] font-bold">
                <span className="truncate">By ShortBits Desk</span>
                <span>{article.city ? `${article.city}, ` : ""}{sourceName}</span>
                <span className="ml-auto flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={liked ? "Unlike story" : "Like story"}
                    onClick={() => {
                      setLiked(!liked);
                      setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
                    }}
                    className={`like-button ${liked ? "like-button-active" : ""}`}
                  >
                    <Heart size={20} fill={liked ? "currentColor" : "none"} />
                  </button>
                  <span className="flex items-center gap-1 font-semibold">
                    <Eye size={16} /> 12.8k
                  </span>
                </span>
              </div>

              <div className="my-4 h-px bg-border" />

              {/* Paragraphs */}
              <div className="space-y-5 text-[15px] font-medium leading-[1.45] text-article-copy">
                {paragraphs.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Bottom Explore Banner */}
              <div className="pt-6 mt-6 border-t border-border flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground font-semibold">
                  ShortBits · 60-Second Read
                </span>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={14} />
                  <span>Explore Live Feed</span>
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastNote && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-xl animate-in fade-in duration-200">
          {toastNote}
        </div>
      )}
    </main>
  );
}
