import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  PenSquare,
  Bot,
  BarChart3,
  Plus,
  Search,
  Sparkles,
  ExternalLink,
  Globe,
  RefreshCw,
  RotateCcw,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  ArrowLeft,
  LogOut,
  Image as ImageIcon,
  MapPin,
  SlidersHorizontal,
  AlertTriangle,
  X,
  User,
  ShieldCheck,
  Check,
  Download,
  Upload,
  Loader2,
} from "lucide-react";

import {
  adminDeleteArticle,
  adminDeleteArticles,
  adminExportAllArticles,
  adminImportArticles,
  adminIngestFeeds,
  adminListArticles,
  adminSaveArticle,
  adminSetStatus,
  isAdminUser,
  type Article,
  type ArticleInput,
} from "@/lib/articles.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "ShortBits — Newsroom Studio & Publishing Dashboard" },
      { name: "description", content: "Author, edit, manage and trigger AI ingestion for ShortBits news stories." },
      { property: "og:title", content: "ShortBits — Newsroom Studio" },
      { property: "og:description", content: "Manage drafts, published stories, and AI curation for ShortBits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-[#faf8f3] grid place-items-center p-8 text-sm text-[#10213a]">
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 max-w-md text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <p className="font-bold text-red-900">Newsroom Error</p>
        <p className="mt-1 text-xs text-red-700">{error.message}</p>
      </div>
    </main>
  ),
});

const CATEGORIES = [
  "world",
  "war",
  "politics",
  "india",
  "business",
  "technology",
  "science",
  "sports",
  "entertainment",
  "viral",
  "fashion",
  "beauty",
  "travel",
  "jobs",
  "education",
  "visa",
  "kids",
  "family",
  "nature",
  "trending",
  "breaking",
];

function emptyDraft(): ArticleInput {
  return {
    title: "",
    detail: "",
    image_url: "",
    category: "world",
    city: "",
    country: "",
    published_at: new Date().toISOString(),
    status: "published",
  };
}

function toLocalInput(iso: string) {
  try {
    const date = new Date(iso);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  } catch {
    return new Date().toISOString().slice(0, 16);
  }
}

type AdminTab = "articles" | "studio" | "ingest" | "analytics";

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(isAdminUser);
  const fetchArticles = useServerFn(adminListArticles);
  const save = useServerFn(adminSaveArticle);
  const remove = useServerFn(adminDeleteArticle);
  const removeMultiple = useServerFn(adminDeleteArticles);
  const setStatus = useServerFn(adminSetStatus);
  const ingest = useServerFn(adminIngestFeeds);
  const exportArticles = useServerFn(adminExportAllArticles);
  const importArticles = useServerFn(adminImportArticles);

  const [activeTab, setActiveTab] = useState<AdminTab>("articles");
  const [editing, setEditing] = useState<ArticleInput | null>(null);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<string[] | null>(null);

  // Export & Import states
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    count: number;
    sampleTitles: string[];
    rawData: any[];
  } | null>(null);
  const [importMode, setImportMode] = useState<"upsert" | "insert">("upsert");
  const [isImporting, setIsImporting] = useState(false);

  // Ingestion settings
  const [pullCategory, setPullCategory] = useState("all");
  const [pullHours, setPullHours] = useState(1);
  const [pullCount, setPullCount] = useState(30);
  const [pullStatus, setPullStatus] = useState<"published" | "draft">("published");
  const [customApiKey, setCustomApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("shortbits_gemini_key") || "";
    }
    return "";
  });

  // Ingestion progress tracker
  const [ingestProgress, setIngestProgress] = useState(0);
  const [ingestStage, setIngestStage] = useState("");

  const [note, setNote] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });
  const articlesQuery = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => fetchArticles(),
    enabled: adminQuery.data === true,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-articles"] });

  const saveMutation = useMutation({
    mutationFn: (input: ArticleInput) => save({ data: input }),
    onSuccess: (savedArticle) => {
      setNote({
        type: "success",
        text: `Article "${savedArticle.title.slice(0, 40)}…" saved successfully (${savedArticle.status}).`,
      });
      setEditing(null);
      setActiveTab("articles");
      void refresh();
    },
    onError: (error: Error) => setNote({ type: "error", text: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      setNote({ type: "info", text: "Article deleted." });
      setDeleteTarget(null);
      void refresh();
    },
    onError: (error: Error) => setNote({ type: "error", text: error.message }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => removeMultiple({ data: { ids } }),
    onSuccess: (_, ids) => {
      setNote({ type: "info", text: `${ids.length} article(s) permanently deleted.` });
      setSelectedIds(new Set());
      setBulkDeleteTarget(null);
      void refresh();
    },
    onError: (error: Error) => setNote({ type: "error", text: error.message }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "draft" | "published" }) =>
      setStatus({ data: { id, status } }),
    onSuccess: () => {
      void refresh();
    },
    onError: (error: Error) => setNote({ type: "error", text: error.message }),
  });

  const ingestMutation = useMutation({
    mutationFn: () =>
      ingest({
        data: {
          minutes: pullHours * 60,
          want: pullCount,
          ...(pullCategory === "all" ? {} : { categories: [pullCategory] }),
          status: pullStatus,
          apiKey: customApiKey.trim() || undefined,
        },
      }),
    onSuccess: (result: any) => {
      setNote({
        type: "success",
        text: `AI Curation finished: Scanned ${result.scanned} sources, found ${result.candidates} candidate stories, inserted ${result.inserted} article(s).`,
      });
      void refresh();
    },
    onError: (error: Error) => setNote({ type: "error", text: error.message }),
  });

  useEffect(() => {
    let timer: any;
    if (ingestMutation.isPending) {
      setIngestProgress(8);
      setIngestStage("Connecting to verified wire feeds across registry...");
      const startTime = Date.now();

      timer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed < 3) {
          setIngestProgress(Math.min(25, Math.round(8 + elapsed * 5)));
          setIngestStage("Scanning registry feeds & deduplicating stories...");
        } else if (elapsed < 8) {
          setIngestProgress(Math.min(50, Math.round(25 + (elapsed - 3) * 5)));
          setIngestStage("Scoring candidate stories for virality, tech launches & crises...");
        } else if (elapsed < 16) {
          setIngestProgress(Math.min(85, Math.round(50 + (elapsed - 8) * 4.3)));
          setIngestStage("Gemini 3.6 Flash synthesizing & polishing ~75-char titles & ~700-char stories...");
        } else {
          setIngestProgress(Math.min(97, Math.round(85 + (elapsed - 16) * 0.8)));
          setIngestStage("Finalizing and saving curated articles...");
        }
      }, 300);
    } else if (ingestMutation.isSuccess) {
      setIngestProgress(100);
      setIngestStage("AI curation complete! Stories published.");
    } else if (ingestMutation.isError) {
      setIngestProgress(0);
      setIngestStage("AI curation failed.");
    }
    return () => clearInterval(timer);
  }, [ingestMutation.isPending, ingestMutation.isSuccess, ingestMutation.isError]);

  // Filtered stories
  const allArticles = articlesQuery.data ?? [];
  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      // Status
      if (filter !== "all" && article.status !== filter) return false;
      // Category
      if (categoryFilter !== "all" && article.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const full = [article.title, article.detail, article.city, article.country, article.category].join(" ").toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });
  }, [allArticles, filter, categoryFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = allArticles.length;
    const published = allArticles.filter((a) => a.status === "published").length;
    const drafts = allArticles.filter((a) => a.status === "draft").length;
    const categoriesCount = new Set(allArticles.map((a) => a.category)).size;
    return { total, published, drafts, categoriesCount };
  }, [allArticles]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredArticles.length && filteredArticles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredArticles.map((a) => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const data = await exportArticles();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `shortbits-articles-${dateStr}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setNote({
        type: "success",
        text: `Exported ${data.count} articles to JSON successfully.`,
      });
    } catch (err: any) {
      console.error("Export failed:", err);
      setNote({
        type: "error",
        text: `Failed to export articles: ${err.message || String(err)}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        let items: any[] = [];
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && Array.isArray(parsed.articles)) {
          items = parsed.articles;
        } else if (parsed && typeof parsed === "object" && parsed.title && parsed.detail) {
          items = [parsed];
        } else {
          throw new Error("Unrecognized JSON format. Expected an array of articles or an object with an 'articles' list.");
        }

        const validItems = items.filter((item) => item && typeof item === "object" && item.title && item.detail);
        if (validItems.length === 0) {
          throw new Error("No valid articles found in this JSON file. Each article requires at least 'title' and 'detail'.");
        }

        setImportPreview({
          count: validItems.length,
          sampleTitles: validItems.slice(0, 4).map((i) => i.title),
          rawData: validItems,
        });
      } catch (err: any) {
        setImportPreview(null);
        setNote({
          type: "error",
          text: `Invalid JSON file: ${err.message || String(err)}`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !importPreview.rawData.length) return;
    try {
      setIsImporting(true);
      const res = await importArticles({
        data: {
          articles: importPreview.rawData,
          mode: importMode,
        },
      });
      setNote({
        type: "success",
        text: `Successfully imported ${res.count} articles (${importMode === "upsert" ? "upserted" : "inserted"}).`,
      });
      setIsImportModalOpen(false);
      setImportFile(null);
      setImportPreview(null);
      void refresh();
    } catch (err: any) {
      console.error("Import failed:", err);
      setNote({
        type: "error",
        text: `Import failed: ${err.message || String(err)}`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  if (adminQuery.isLoading) {
    return (
      <main className="min-h-screen bg-[#faf8f3] grid place-items-center p-6 text-[#10213a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-3 border-[#012c6c] border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#56667a]">Verifying Newsroom Credentials…</p>
        </div>
      </main>
    );
  }

  if (adminQuery.data === false) {
    return (
      <main className="min-h-screen bg-[#faf8f3] grid place-items-center px-6 text-center text-[#10213a]">
        <div className="max-w-md rounded-3xl border border-[#ddd8cd] bg-white p-8 shadow-xl">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mb-4">
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-xl font-black tracking-tight text-[#10213a]">Access Restricted</h2>
          <p className="mt-2 text-xs text-[#56667a] leading-relaxed">
            Your authenticated account does not currently have <strong>admin</strong> or <strong>editor</strong> newsroom credentials.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              className="w-full sm:w-auto rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-5 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] transition-all cursor-pointer"
              onClick={() => navigate({ to: "/" })}
            >
              Return to Site
            </button>
            <button
              className="w-full sm:w-auto rounded-full bg-[#012c6c] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#023b8f] transition-all cursor-pointer"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/account", replace: true });
              }}
            >
              Sign In Different Account
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#10213a] flex flex-col justify-between">
      {/* Newsroom Command Header */}
      <header className="sticky top-0 z-40 border-b border-[#ddd8cd] bg-[#faf8f3]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="brand-wordmark text-xl font-bold tracking-tight">
              ShortBits<span className="brand-dot">.</span> Newsroom
            </h1>
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Studio
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd8cd] bg-white px-3 py-1.5 text-xs font-bold text-[#10213a] shadow-xs hover:bg-[#eee8dc] transition-all cursor-pointer"
            >
              <Globe size={13} /> <span className="hidden sm:inline">Live Site</span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ to: "/account" })}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd8cd] bg-white px-3 py-1.5 text-xs font-bold text-[#10213a] shadow-xs hover:bg-[#eee8dc] transition-all cursor-pointer"
            >
              <User size={13} /> <span className="hidden sm:inline">My Account</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await supabase.auth.signOut();
                navigate({ to: "/account", replace: true });
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-all cursor-pointer"
            >
              <LogOut size={13} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Studio Workspace Tabs */}
        <div className="border-t border-[#eee8dc] bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("articles")}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "articles"
                  ? "border-[#012c6c] text-[#012c6c]"
                  : "border-transparent text-[#56667a] hover:text-[#10213a]"
              }`}
            >
              <FileText size={15} />
              <span>Articles Manager ({allArticles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!editing) setEditing(emptyDraft());
                setActiveTab("studio");
              }}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "studio"
                  ? "border-[#012c6c] text-[#012c6c]"
                  : "border-transparent text-[#56667a] hover:text-[#10213a]"
              }`}
            >
              <PenSquare size={15} />
              <span>Story Studio &amp; Live Card</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ingest")}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "ingest"
                  ? "border-[#012c6c] text-[#012c6c]"
                  : "border-transparent text-[#56667a] hover:text-[#10213a]"
              }`}
            >
              <Bot size={15} />
              <span>AI Ingestion Suite</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`inline-flex items-center gap-2 border-b-2 py-3 px-3 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "analytics"
                  ? "border-[#012c6c] text-[#012c6c]"
                  : "border-transparent text-[#56667a] hover:text-[#10213a]"
              }`}
            >
              <BarChart3 size={15} />
              <span>Newsroom Analytics</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 flex-1">
        {/* Status Toast / Note */}
        {note && (
          <div
            className={`mb-6 flex items-start justify-between gap-3 rounded-2xl p-4 text-xs font-semibold shadow-xs ${
              note.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : note.type === "error"
                ? "bg-red-50 text-red-900 border border-red-200"
                : "bg-blue-50 text-blue-900 border border-blue-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {note.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : note.type === "error" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              ) : (
                <Clock className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
              )}
              <p className="leading-relaxed">{note.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setNote(null)}
              className="text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ============================================================
           TAB 1: ARTICLES MANAGER
           ============================================================ */}
        {activeTab === "articles" && (
          <div className="space-y-6">
            {/* KPI Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-4 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#56667a]">Total Stories</span>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-[#10213a]">{metrics.total}</div>
                <span className="text-[11px] text-[#56667a]">In database</span>
              </div>

              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-4 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Published Live</span>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700">{metrics.published}</div>
                <span className="text-[11px] text-[#56667a]">Visible to readers</span>
              </div>

              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-4 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Drafts in Queue</span>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-700">{metrics.drafts}</div>
                <span className="text-[11px] text-[#56667a]">Awaiting review</span>
              </div>

              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-4 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#012c6c]">Categories Active</span>
                <div className="mt-2 text-2xl sm:text-3xl font-black text-[#012c6c]">{metrics.categoriesCount}</div>
                <span className="text-[11px] text-[#56667a]">Topics covered</span>
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="rounded-3xl border border-[#ddd8cd] bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7b8a9c]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, cities, detail…"
                    className="w-full rounded-full border border-[#ddd8cd] bg-[#faf8f3] pl-9 pr-3 py-1.5 text-xs text-[#10213a] placeholder-[#8a99aa] outline-none focus:border-[#012c6c] focus:bg-white transition-all"
                  />
                </div>

                {/* Category select */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-3 py-1.5 text-xs font-bold text-[#10213a] outline-none"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>

                {/* Status Pills */}
                <div className="flex items-center gap-1 rounded-full bg-[#faf8f3] p-1 border border-[#ddd8cd]">
                  {(["all", "published", "draft"] as const).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFilter(val)}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        filter === val
                          ? "bg-[#012c6c] text-white shadow-xs"
                          : "text-[#56667a] hover:text-[#10213a]"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-3.5 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                  title="Export all articles to JSON"
                >
                  {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportFile(null);
                    setImportPreview(null);
                    setIsImportModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-3.5 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] transition-all cursor-pointer whitespace-nowrap"
                  title="Import articles from JSON file"
                >
                  <Upload size={13} />
                  <span>Import JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(emptyDraft());
                    setActiveTab("studio");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#012c6c] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#023b8f] transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus size={14} /> <span>New Article</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("ingest")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#012c6c] bg-white px-3.5 py-2 text-xs font-bold text-[#012c6c] hover:bg-[#012c6c]/5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Sparkles size={13} /> <span>AI Ingest</span>
                </button>
              </div>
            </div>

            {/* Selection & Bulk Actions Bar */}
            {!articlesQuery.isLoading && filteredArticles.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ddd8cd] bg-white px-4 py-2.5 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#10213a] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={
                        filteredArticles.length > 0 &&
                        selectedIds.size === filteredArticles.length
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-[#ddd8cd] text-[#012c6c] focus:ring-[#012c6c] cursor-pointer"
                    />
                    <span>Select All ({filteredArticles.length})</span>
                  </label>

                  {selectedIds.size > 0 && (
                    <span className="rounded-full bg-[#012c6c]/10 px-2.5 py-0.5 text-xs font-extrabold text-[#012c6c]">
                      {selectedIds.size} selected
                    </span>
                  )}
                </div>

                {selectedIds.size > 0 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIds(new Set())}
                      className="rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-3 py-1.5 text-xs font-semibold text-[#56667a] hover:bg-[#eee8dc] cursor-pointer"
                    >
                      Deselect
                    </button>
                    <button
                      type="button"
                      disabled={bulkDeleteMutation.isPending}
                      onClick={() => setBulkDeleteTarget(Array.from(selectedIds))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Selected ({selectedIds.size})</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#7b8a9c]">
                    Select multiple articles to perform bulk deletion
                  </span>
                )}
              </div>
            )}

            {/* Articles List */}
            <div className="space-y-3">
              {articlesQuery.isLoading ? (
                <div className="py-12 text-center text-xs font-bold uppercase tracking-widest text-[#56667a]">
                  Loading articles from newsroom…
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="rounded-3xl border border-[#ddd8cd] bg-white p-12 text-center shadow-sm">
                  <p className="text-sm font-bold text-[#10213a]">No articles match current filters.</p>
                  <p className="mt-1 text-xs text-[#56667a]">
                    Try clearing your search query or trigger an AI ingestion pull.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilter("all");
                      setCategoryFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-4 rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-4 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className={`group relative overflow-hidden rounded-3xl border p-4 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      selectedIds.has(article.id)
                        ? "border-[#012c6c] bg-[#012c6c]/[0.03] ring-2 ring-[#012c6c]/30"
                        : "border-[#ddd8cd] bg-white hover:border-[#012c6c]/40"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Select Checkbox */}
                      <div className="flex items-center self-center shrink-0 pr-1">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(article.id)}
                          onChange={() => toggleSelectOne(article.id)}
                          className="h-4 w-4 rounded border-[#ddd8cd] text-[#012c6c] focus:ring-[#012c6c] cursor-pointer"
                          aria-label={`Select article ${article.title}`}
                        />
                      </div>

                      {/* Cover Thumbnail */}
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#faf8f3] border border-[#eee8dc] relative">
                        {article.image_url ? (
                          <img
                            src={article.image_url}
                            alt=""
                            className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[#8a99aa]">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-[#012c6c]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#012c6c]">
                            {article.category}
                          </span>
                          {article.status === "published" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Published
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Draft
                            </span>
                          )}
                          {(article.city || article.country) && (
                            <span className="text-[11px] text-[#7b8a9c] flex items-center gap-0.5">
                              <MapPin size={11} />
                              {[article.city, article.country].filter(Boolean).join(", ")}
                            </span>
                          )}
                          <span className="text-[11px] text-[#7b8a9c]">
                            {new Date(article.published_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-[#10213a] truncate">
                          {article.title}
                        </h3>

                        <p className="text-xs text-[#56667a] line-clamp-1 leading-relaxed">
                          {article.detail}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing({
                            id: article.id,
                            title: article.title,
                            detail: article.detail ?? "",
                            image_url: article.image_url ?? "",
                            category: article.category,
                            city: article.city ?? "",
                            country: article.country ?? "",
                            published_at: article.published_at,
                            status: article.status,
                          });
                          setActiveTab("studio");
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-3 py-1.5 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] transition-all cursor-pointer"
                        title="Edit Article"
                      >
                        <Edit3 size={13} /> <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          statusMutation.mutate({
                            id: article.id,
                            status: article.status === "published" ? "draft" : "published",
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          article.status === "published"
                            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        }`}
                        title={article.status === "published" ? "Move to drafts" : "Publish article live"}
                      >
                        {article.status === "published" ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(article)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer"
                        title="Delete Article"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================
           TAB 2: STORY STUDIO & LIVE CARD PREVIEW
           ============================================================ */}
        {activeTab === "studio" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#10213a]">
                  {editing?.id ? "Edit Article" : "Create New Story"}
                </h2>
                <p className="text-xs text-[#56667a]">
                  Compose articles and verify layout presentation with the live ShortBits news card preview.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setActiveTab("articles");
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd8cd] bg-white px-3.5 py-1.5 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] transition-all cursor-pointer"
              >
                <ArrowLeft size={13} /> <span>Back to List</span>
              </button>
            </div>

            <StoryEditor
              initialData={editing || emptyDraft()}
              busy={saveMutation.isPending}
              onCancel={() => {
                setEditing(null);
                setActiveTab("articles");
              }}
              onSave={(data) => saveMutation.mutate(data)}
            />
          </div>
        )}

        {/* ============================================================
           TAB 3: AI INGESTION SUITE
           ============================================================ */}
        {activeTab === "ingest" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#012c6c]/20 bg-gradient-to-br from-[#012c6c]/10 via-white to-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#012c6c] text-white shadow-md">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-[#10213a]">
                    Automated RSS &amp; AI Curation Pipeline
                  </h2>
                  <p className="text-xs text-[#56667a]">
                    Pulls viral &amp; top-trending global stories (tech launches, crises, war, major geopolitics) with strict 75-char headlines and ~700-char polished summaries.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Target */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#56667a]">
                    Target Topic Category
                  </label>
                  <select
                    value={pullCategory}
                    onChange={(e) => setPullCategory(e.target.value)}
                    className="w-full rounded-2xl border border-[#ddd8cd] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#10213a] outline-none focus:border-[#012c6c]"
                  >
                    <option value="all">All Topics (Comprehensive Sweep)</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Time Lookback */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#56667a]">
                    Time Lookback Window
                  </label>
                  <select
                    value={pullHours}
                    onChange={(e) => setPullHours(Number(e.target.value))}
                    className="w-full rounded-2xl border border-[#ddd8cd] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#10213a] outline-none focus:border-[#012c6c]"
                  >
                    <option value={1}>Past 1 Hour (Freshest Breaking News)</option>
                    <option value={6}>Past 6 Hours (Deep Sweep)</option>
                    <option value={24}>Past 24 Hours (Daily Digest)</option>
                  </select>
                </div>

                {/* Maximum Count */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#56667a]">
                    Article Target Batch Size
                  </label>
                  <select
                    value={pullCount}
                    onChange={(e) => setPullCount(Number(e.target.value))}
                    className="w-full rounded-2xl border border-[#ddd8cd] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#10213a] outline-none focus:border-[#012c6c]"
                  >
                    <option value={10}>10 High-Ranked Articles</option>
                    <option value={20}>20 High-Ranked Articles</option>
                    <option value={30}>30 High-Ranked Articles (Recommended)</option>
                    <option value={50}>50 Comprehensive Articles</option>
                  </select>
                </div>

                {/* Ingestion Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#56667a]">
                    Import Publication Status
                  </label>
                  <select
                    value={pullStatus}
                    onChange={(e) => setPullStatus(e.target.value as "published" | "draft")}
                    className="w-full rounded-2xl border border-[#ddd8cd] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#10213a] outline-none focus:border-[#012c6c]"
                  >
                    <option value="published">Publish Immediately to Live Feed</option>
                    <option value="draft">Save to Drafts (Review Before Live)</option>
                  </select>
                </div>

                {/* Optional Custom Gemini API Key Override */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#56667a]">
                      Gemini API Key (Optional Override)
                    </label>
                    <span className="text-[10px] text-[#718096]">Saved locally in browser</span>
                  </div>
                  <input
                    type="password"
                    placeholder="AQ.Ab8... (Leave blank to use Cloudflare Worker environment)"
                    value={customApiKey}
                    onChange={(e) => {
                      setCustomApiKey(e.target.value);
                      if (typeof window !== "undefined") {
                        if (e.target.value) localStorage.setItem("shortbits_gemini_key", e.target.value);
                        else localStorage.removeItem("shortbits_gemini_key");
                      }
                    }}
                    className="w-full rounded-2xl border border-[#ddd8cd] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#10213a] outline-none focus:border-[#012c6c]"
                  />
                </div>
              </div>

              {/* Progress Bar & Status (Shown when running) */}
              {ingestMutation.isPending && (
                <div className="mt-6 rounded-2xl border border-[#012c6c]/20 bg-[#012c6c]/5 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#012c6c]">
                      <RefreshCw size={13} className="animate-spin" />
                      <span>{ingestStage}</span>
                    </div>
                    <span className="font-extrabold text-[#012c6c]">{ingestProgress}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#eee8dc] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#012c6c] via-[#0256d0] to-[#2563eb] rounded-full transition-all duration-300"
                      style={{ width: `${ingestProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#56667a]">
                    Curating exclusively through Gemini 3.6 Flash (backups: Gemini 3.5 &amp; 3.5 Lite). No unpolished raw RSS articles will be saved.
                  </p>
                </div>
              )}

              {/* Error Box & Retry Button */}
              {ingestMutation.isError && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-red-900">Ingestion Error</p>
                      <p className="text-xs text-red-700 leading-relaxed">
                        {ingestMutation.error?.message || "Gemini AI curation failed. Please retry."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => ingestMutation.mutate()}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Retry Ingestion</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Trigger & Retry Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#56667a]">
                  {ingestMutation.isSuccess && (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> AI curation completed successfully
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {ingestMutation.isError && (
                    <button
                      type="button"
                      disabled={ingestMutation.isPending}
                      onClick={() => ingestMutation.mutate()}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-300 bg-red-50 px-5 py-3 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      <span>Retry</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={ingestMutation.isPending}
                    onClick={() => ingestMutation.mutate()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#012c6c] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#023b8f] disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {ingestMutation.isPending ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Curating Stories ({ingestProgress}%)…</span>
                      </>
                    ) : ingestMutation.isError ? (
                      <>
                        <RotateCcw size={14} />
                        <span>Retry AI Ingestion</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Execute AI Feed Ingestion Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Ingestion Pipeline Specs */}
            <div className="rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#56667a]">
                Active Feed Sources &amp; Coverage
              </h3>
              <p className="text-xs text-[#56667a] leading-relaxed">
                ShortBits scans verified global wires across Reuters, AP News, BBC, TechCrunch, The Verge, and crisis trackers. Each article is parsed, deduplicated, scored for virality and global impact, and limited to a punchy &le;75 character headline (max 14 words) and a rich ~700 character article body.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-[#2c3b4d]">
                <div className="rounded-xl bg-[#faf8f3] p-2.5 border border-[#eee8dc]">✓ World &amp; Geopolitics</div>
                <div className="rounded-xl bg-[#faf8f3] p-2.5 border border-[#eee8dc]">✓ Tech Launches &amp; AI</div>
                <div className="rounded-xl bg-[#faf8f3] p-2.5 border border-[#eee8dc]">✓ Crises &amp; Conflicts</div>
                <div className="rounded-xl bg-[#faf8f3] p-2.5 border border-[#eee8dc]">✓ Viral &amp; Trending</div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
           TAB 4: NEWSROOM ANALYTICS
           ============================================================ */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#56667a]">
                  Publication Distribution
                </h3>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-700">Published Stories</span>
                      <span>{metrics.published}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#faf8f3] overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${metrics.total ? (metrics.published / metrics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-amber-700">Drafts in Review</span>
                      <span>{metrics.drafts}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#faf8f3] overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${metrics.total ? (metrics.drafts / metrics.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#56667a]">
                  System Engine Health
                </h3>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#eee8dc]">
                    <span className="text-[#56667a]">Database Backend</span>
                    <span className="font-bold text-emerald-700">Supabase Connected</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#eee8dc]">
                    <span className="text-[#56667a]">AI Ingestion Job</span>
                    <span className="font-bold text-emerald-700">Hourly Cron Ready</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[#56667a]">Storage Service</span>
                    <span className="font-bold text-emerald-700">Active</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#56667a]">
                  Top Topic Categories
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Array.from(new Set(allArticles.map((a) => a.category))).slice(0, 10).map((cat) => {
                    const count = allArticles.filter((a) => a.category === cat).length;
                    return (
                      <span
                        key={cat}
                        className="rounded-full bg-[#faf8f3] border border-[#ddd8cd] px-3 py-1 text-xs font-bold text-[#10213a]"
                      >
                        {cat} <span className="text-[#7b8a9c] font-normal">({count})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-2xl space-y-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#10213a]">Delete Article?</h3>
              <p className="mt-1 text-xs text-[#56667a] leading-relaxed">
                Are you sure you want to permanently delete <strong>&ldquo;{deleteTarget.title}&rdquo;</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-4 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-2xl space-y-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <Trash2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#10213a]">
                Delete {bulkDeleteTarget.length} Article{bulkDeleteTarget.length > 1 ? "s" : ""}?
              </h3>
              <p className="mt-1 text-xs text-[#56667a] leading-relaxed">
                Are you sure you want to permanently delete these <strong>{bulkDeleteTarget.length} selected article{bulkDeleteTarget.length > 1 ? "s" : ""}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteTarget(null)}
                className="rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-4 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkDeleteMutation.isPending}
                onClick={() => bulkDeleteMutation.mutate(bulkDeleteTarget)}
                className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {bulkDeleteMutation.isPending ? "Deleting…" : `Confirm Delete (${bulkDeleteTarget.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Articles Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#eee8dc]">
              <div className="flex items-center gap-2.5">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#012c6c]/10 text-[#012c6c]">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#10213a]">Import Articles</h3>
                  <p className="text-[11px] text-[#56667a]">Upload a JSON file containing articles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="rounded-full p-1.5 text-[#7b8a9c] hover:bg-[#faf8f3] hover:text-[#10213a] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* File upload input */}
            <div>
              <label
                htmlFor="import-json-file"
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ddd8cd] bg-[#faf8f3] p-6 hover:border-[#012c6c] hover:bg-[#f3efea] transition-all cursor-pointer text-center"
              >
                <Upload size={24} className="text-[#012c6c] mb-2" />
                <span className="text-xs font-bold text-[#10213a]">
                  {importFile ? importFile.name : "Click to browse or choose a JSON file"}
                </span>
                <span className="mt-1 text-[11px] text-[#7b8a9c]">
                  Supports ShortBits export format or array of articles
                </span>
                <input
                  id="import-json-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview of detected articles */}
            {importPreview && (
              <div className="rounded-2xl border border-[#ddd8cd] bg-[#faf8f3] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#012c6c]">
                    ✓ Found {importPreview.count} valid article{importPreview.count > 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] text-[#7b8a9c]">Ready to import</span>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-[#56667a]">Sample articles:</p>
                  <ul className="text-xs text-[#10213a] space-y-0.5 list-disc list-inside">
                    {importPreview.sampleTitles.map((t, i) => (
                      <li key={i} className="truncate font-medium">
                        {t}
                      </li>
                    ))}
                  </ul>
                  {importPreview.count > 4 && (
                    <p className="text-[10px] text-[#7b8a9c] italic pl-4">
                      …and {importPreview.count - 4} more
                    </p>
                  )}
                </div>

                {/* Import Mode selection */}
                <div className="pt-2 border-t border-[#eee8dc]">
                  <p className="text-[11px] font-bold text-[#56667a] mb-1.5">Import Strategy:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`flex items-center gap-2 rounded-xl p-2.5 border text-xs cursor-pointer ${
                        importMode === "upsert"
                          ? "border-[#012c6c] bg-white font-bold text-[#012c6c] shadow-2xs"
                          : "border-[#ddd8cd] bg-white text-[#56667a]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        value="upsert"
                        checked={importMode === "upsert"}
                        onChange={() => setImportMode("upsert")}
                        className="text-[#012c6c]"
                      />
                      <span>Upsert (Update &amp; Insert)</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 rounded-xl p-2.5 border text-xs cursor-pointer ${
                        importMode === "insert"
                          ? "border-[#012c6c] bg-white font-bold text-[#012c6c] shadow-2xs"
                          : "border-[#ddd8cd] bg-white text-[#56667a]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        value="insert"
                        checked={importMode === "insert"}
                        onChange={() => setImportMode("insert")}
                        className="text-[#012c6c]"
                      />
                      <span>Insert New Only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-4 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!importPreview || isImporting}
                onClick={handleConfirmImport}
                className="rounded-full bg-[#012c6c] px-4 py-2 text-xs font-bold text-white hover:bg-[#023b8f] disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Importing ({importPreview?.count ?? 0})…</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} />
                    <span>Confirm Import {importPreview ? `(${importPreview.count})` : ""}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#ddd8cd] py-4 text-center text-xs text-[#7b8a9c]">
        ShortBits Newsroom Studio · Publishing Hub &amp; Live Feed Control
      </footer>
    </div>
  );
}

/* ============================================================
   SPLIT STORY EDITOR WITH LIVE NEWS CARD PREVIEW
   ============================================================ */

function StoryEditor({
  initialData,
  onSave,
  onCancel,
  busy,
}: {
  initialData: ArticleInput;
  onSave: (data: ArticleInput) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<ArticleInput>(initialData);

  // Word count & read time estimate
  const wordsCount = form.detail.trim() ? form.detail.trim().split(/\s+/).length : 0;
  const readSeconds = Math.max(15, Math.round(wordsCount / 3.5));

  const field =
    "w-full rounded-2xl border border-[#ddd8cd] bg-[#faf8f3] px-3.5 py-2.5 text-xs sm:text-sm text-[#10213a] placeholder-[#8a99aa] outline-none focus:border-[#012c6c] focus:bg-white transition-all";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Form: 7 cols */}
      <div className="lg:col-span-7 rounded-3xl border border-[#ddd8cd] bg-white p-5 sm:p-7 shadow-sm space-y-4">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#56667a]">Headline Title</label>
            <span
              className={`text-[10px] ${
                form.title.length > 75 || form.title.trim().split(/\s+/).filter(Boolean).length > 14
                  ? "text-red-500 font-bold"
                  : "text-[#7b8a9c]"
              }`}
            >
              {form.title.length}/75 chars ({form.title.trim().split(/\s+/).filter(Boolean).length}/14 words)
            </span>
          </div>
          <input
            className={field}
            placeholder="Concise, punchy news headline…"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#56667a] mb-1">
            Cover Image URL (16:9 / Landscape recommended)
          </label>
          <div className="relative">
            <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a9c]" />
            <input
              className={`${field} pl-10`}
              placeholder="https://images.unsplash.com/…"
              value={form.image_url ?? ""}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </div>
        </div>

        {/* Topic Category & Timestamp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#56667a] mb-1">
              Topic Category
            </label>
            <select
              className={field}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#56667a] mb-1">
              Publication Time
            </label>
            <input
              className={field}
              type="datetime-local"
              value={toLocalInput(form.published_at)}
              onChange={(e) =>
                setForm({
                  ...form,
                  published_at: new Date(e.target.value).toISOString(),
                })
              }
            />
          </div>
        </div>

        {/* Location metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#56667a] mb-1">City</label>
            <input
              className={field}
              placeholder="e.g. New York, London, New Delhi"
              value={form.city ?? ""}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#56667a]">Country</label>
            <input
              className={field}
              placeholder="e.g. United States, India, UK"
              value={form.country ?? ""}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
            />
          </div>
        </div>

        {/* Article Detail */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#56667a]">
              Article Body &amp; Key Takeaways
            </label>
            <div className="flex items-center gap-2 text-[10px]">
              <span className={form.detail.length > 750 ? "text-red-500 font-bold" : "text-[#7b8a9c]"}>
                {form.detail.length}/700 chars
              </span>
              <span className="text-[#7b8a9c]">·</span>
              <span className="text-[#7b8a9c]">{wordsCount} words</span>
              <span className="text-[#7b8a9c]">·</span>
              <span className="text-[#7b8a9c]">~{readSeconds}s read</span>
            </div>
          </div>
          <textarea
            className={`${field} min-h-[180px] leading-relaxed`}
            placeholder="Provide concise, accurate coverage in 2-3 structured paragraphs…"
            value={form.detail}
            onChange={(e) => setForm({ ...form, detail: e.target.value })}
            required
          />
        </div>

        {/* Actions Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-4 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy || !form.title.trim()}
              onClick={() => onSave({ ...form, status: "draft" })}
              className="rounded-full border border-[#012c6c] bg-white px-4 py-2 text-xs font-bold text-[#012c6c] hover:bg-[#012c6c]/5 disabled:opacity-50 cursor-pointer"
            >
              Save as Draft
            </button>

            <button
              type="button"
              disabled={busy || !form.title.trim()}
              onClick={() => onSave({ ...form, status: "published" })}
              className="rounded-full bg-[#012c6c] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#023b8f] disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Saving…" : "Publish to Feed"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: 5 cols Live Card Preview */}
      <div className="lg:col-span-5 space-y-3 sticky top-24">
        <div className="flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#56667a]">
            <Sparkles size={13} className="text-[#012c6c]" />
            <span>Live ShortBits Card Preview</span>
          </div>
          <span className="rounded-full bg-[#faf8f3] px-2 py-0.5 text-[10px] font-bold text-[#7b8a9c] border border-[#ddd8cd]">
            Reader View
          </span>
        </div>

        {/* Card Mockup */}
        <div className="rounded-3xl border border-[#ddd8cd] bg-white p-5 shadow-xl space-y-3">
          {/* Header row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="grid h-6 w-6 place-items-center rounded-full bg-[#012c6c] text-white text-[10px] font-bold">
                SB
              </div>
              <div>
                <span className="font-bold text-[#10213a]">
                  {[form.city, form.country].filter(Boolean).join(", ") || "Global Desk"}
                </span>
                <span className="text-[#24febf] ml-1">✓</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#7b8a9c]">
              <span className="font-semibold text-[#012c6c] capitalize">{form.category}</span>
              <span>·</span>
              <span>Just now</span>
            </div>
          </div>

          {/* Headline */}
          <h4 className="text-base sm:text-lg font-extrabold tracking-tight text-[#10213a] leading-snug">
            {form.title.trim() || "Your headline title will render here in bold modern typography"}
          </h4>

          {/* Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#faf8f3] border border-[#eee8dc]">
            {form.image_url ? (
              <img
                src={form.image_url}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-[#8a99aa] p-4 text-center text-xs">
                <div>
                  <ImageIcon size={28} className="mx-auto mb-1 text-[#8a99aa]" />
                  <span>Add an image URL to preview hero image</span>
                </div>
              </div>
            )}
          </div>

          {/* Paragraph Detail */}
          <div className="text-xs text-[#2c3b4d] leading-relaxed space-y-2 max-h-48 overflow-y-auto pr-1">
            {form.detail.trim() ? (
              form.detail
                .split(/\n\n+/)
                .map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p className="text-[#8a99aa] italic">
                Article body text formatted for rapid mobile and desktop scanning. Clean, distraction-free reading experience.
              </p>
            )}
          </div>

          {/* Footer Bar */}
          <div className="pt-2 border-t border-[#eee8dc] flex items-center justify-between text-xs text-[#7b8a9c]">
            <span>60 Words Format</span>
            <span className="text-[10px] font-bold text-[#012c6c] uppercase tracking-wider">
              {form.status === "published" ? "Live on Feed" : "Saved as Draft"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
