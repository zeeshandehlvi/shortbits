import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  Newspaper,
  Printer,
  Sparkles,
  X,
} from "lucide-react";
import {
  type EPaperStory,
  formatEditionDate,
  formatShortDate,
  downloadEpaperPDF,
  getFrontPagePreview,
  getStoriesForDate,
  downloadStoryClip,
} from "@/lib/epaper";

interface EPaperPageProps {
  stories: EPaperStory[];
  onBack: () => void;
}

export function EPaperPage({ stories, onBack }: EPaperPageProps) {
  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [downloadingDate, setDownloadingDate] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    dataUrl: string;
    dateLabel: string;
    pageCount: number;
    leadTitle: string;
    leadStory: EPaperStory;
  } | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [clippingStoryId, setClippingStoryId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3500);
  };

  // Generate past 7 days list for quick pills
  const pastDays = useMemo(() => {
    const list: Date[] = [];
    for (let i = 2; i <= 8; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d);
    }
    return list;
  }, []);

  // Today thumbnail preview
  const [todayThumbnail, setTodayThumbnail] = useState<string | null>(null);
  const [todayMeta, setTodayMeta] = useState<{ pageCount: number; leadTitle: string; storyCount: number } | null>(null);

  useEffect(() => {
    if (stories.length === 0) return;
    let isCancelled = false;

    getFrontPagePreview(today, stories)
      .then((res) => {
        if (!isCancelled) {
          setTodayThumbnail(res.dataUrl);
          setTodayMeta({
            pageCount: res.pageCount,
            leadTitle: res.leadStory.title,
            storyCount: res.edition.length,
          });
        }
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [today, stories]);

  // Stories belonging to current selected date
  const selectedEditionStories = useMemo(() => {
    return getStoriesForDate(selectedDate, stories);
  }, [selectedDate, stories]);

  const handleDownload = async (targetDate: Date) => {
    const key = targetDate.toISOString().slice(0, 10);
    try {
      setDownloadingDate(key);
      showToast("Generating high-resolution A3 PDF edition…");
      await downloadEpaperPDF(targetDate, stories);
      showToast("E-Paper PDF downloaded successfully!");
    } catch (err) {
      console.error("Failed to download e-paper:", err);
      showToast("Could not generate PDF. Please try again.");
    } finally {
      setDownloadingDate(null);
    }
  };

  const handleOpenPreview = async (targetDate: Date) => {
    try {
      setLoadingPreview(true);
      showToast("Rendering front page preview…");
      const res = await getFrontPagePreview(targetDate, stories);
      setPreviewData({
        dataUrl: res.dataUrl,
        dateLabel: res.dateLabel,
        pageCount: res.pageCount,
        leadTitle: res.leadStory.title,
        leadStory: res.leadStory,
      });
      setIsPreviewModalOpen(true);
    } catch (err) {
      console.error("Preview failed:", err);
      showToast("Could not load edition preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleClipStory = async (story: EPaperStory) => {
    try {
      setClippingStoryId(story.id);
      showToast(`Generating e-Clip for "${story.title.slice(0, 32)}…"`);
      const ok = await downloadStoryClip(story);
      if (ok) {
        showToast("e-Clip saved to your device!");
      } else {
        showToast("Failed to generate e-Clip. Please try again.");
      }
    } catch (err) {
      console.error("e-Clip failed:", err);
      showToast("Could not generate e-Clip.");
    } finally {
      setClippingStoryId(null);
    }
  };

  const selectedDateStr = selectedDate.toISOString().slice(0, 10);
  const maxDateStr = today.toISOString().slice(0, 10);

  return (
    <div className="epaper-page-container min-h-screen bg-[#faf8f3] text-[#10213a] pb-24">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#e3ded3] bg-[#faf8f3]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-[#ddd8cd] bg-white px-3.5 py-1.5 text-xs font-bold text-[#012c6c] hover:bg-[#f0ece1] transition-colors cursor-pointer shadow-2xs"
            aria-label="Back to news"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to News</span>
          </button>

          <div className="text-center">
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-[#012c6c] leading-tight">
              ShortBits<span className="text-[#24febf]">.</span> E-Paper
            </h1>
            <p className="text-[10px] font-semibold text-[#56667a] uppercase tracking-wider">
              Digital Print Editions
            </p>
          </div>

          <div className="flex items-center gap-1">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#012c6c]/10 px-2.5 py-1 text-[11px] font-bold text-[#012c6c]">
              <Printer className="h-3 w-3" /> A3 Print-Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Intro Hero Banner */}
        <div className="rounded-3xl bg-linear-to-br from-[#061838] via-[#0b244d] to-[#040f24] p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <Newspaper size={260} />
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30 mb-3">
              <Sparkles className="h-3 w-3" /> Daily Multi-Page Newspaper
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Read &amp; Download Complete Print Editions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed">
              Curated daily newspapers formatted with classic multi-column typography, high-definition photography, and offline PDF support.
            </p>
          </div>
        </div>

        {/* Featured Editions: Today & Yesterday */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Today's E-Paper Card */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#012c6c]/30 bg-white p-5 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-[#012c6c] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Today&apos;s Issue
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#012c6c]">
                <Calendar className="h-4 w-4" />
                <span>{formatEditionDate(today)}</span>
              </div>

              <h3 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-[#10213a] line-clamp-2">
                {todayMeta?.leadTitle || "Today's Complete Daily Edition"}
              </h3>

              <p className="mt-1 text-xs text-[#56667a]">
                {todayMeta ? `${todayMeta.storyCount} stories · ${todayMeta.pageCount} Pages · High-Res PDF` : "Latest morning edition with all top world, politics, tech & business stories."}
              </p>

              {/* Front Page Thumbnail Preview */}
              {todayThumbnail && (
                <div
                  onClick={() => handleOpenPreview(today)}
                  className="mt-3.5 relative rounded-xl overflow-hidden border border-[#ddd8cd] bg-[#faf8f3] cursor-pointer group shadow-xs"
                >
                  <img
                    src={todayThumbnail}
                    alt="Front page preview"
                    className="w-full h-36 object-cover object-top group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                      <Eye className="h-3 w-3" /> Tap to Preview
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#f0ece1] flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload(today)}
                disabled={downloadingDate === today.toISOString().slice(0, 10)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#012c6c] hover:bg-[#0c2b5e] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {downloadingDate === today.toISOString().slice(0, 10) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating PDF…</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download Today&apos;s E-Paper</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenPreview(today)}
                disabled={loadingPreview}
                className="inline-flex items-center justify-center rounded-xl border border-[#ddd8cd] bg-[#faf8f3] hover:bg-[#f0ece1] p-2.5 text-[#012c6c] transition-colors cursor-pointer"
                title="Preview Front Page"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Yesterday's E-Paper Card */}
          <div className="relative overflow-hidden rounded-3xl border border-[#ddd8cd] bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-[#56667a] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Yesterday
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#56667a]">
                <Calendar className="h-4 w-4" />
                <span>{formatEditionDate(yesterday)}</span>
              </div>

              <h3 className="mt-2 text-lg sm:text-xl font-bold tracking-tight text-[#10213a] line-clamp-2">
                Yesterday&apos;s Evening Archive
              </h3>

              <p className="mt-1 text-xs text-[#56667a]">
                Full digital edition of yesterday&apos;s headlines, analysis, and breaking stories.
              </p>

              <div className="mt-3.5 p-3.5 rounded-xl bg-[#faf8f3] border border-[#eee8dc]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#012c6c]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Archived &amp; Verified Edition</span>
                </div>
                <p className="mt-1 text-[11px] text-[#56667a]">
                  Formatted in complete A3 multi-column newsprint ready for offline reading or print.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f0ece1] flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload(yesterday)}
                disabled={downloadingDate === yesterday.toISOString().slice(0, 10)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#10213a] hover:bg-[#203450] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {downloadingDate === yesterday.toISOString().slice(0, 10) ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating PDF…</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Download Yesterday&apos;s E-Paper</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenPreview(yesterday)}
                disabled={loadingPreview}
                className="inline-flex items-center justify-center rounded-xl border border-[#ddd8cd] bg-[#faf8f3] hover:bg-[#f0ece1] p-2.5 text-[#012c6c] transition-colors cursor-pointer"
                title="Preview Front Page"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Date Archive & Available Dates Section */}
        <div className="rounded-3xl border border-[#ddd8cd] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#eee8dc]">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#012c6c] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#012c6c]" /> Available Dates &amp; Past Archives
              </h3>
              <p className="text-xs text-[#56667a] mt-0.5">
                Select any date to generate and download that day&apos;s digital print edition.
              </p>
            </div>

            {/* Custom Date Picker Input */}
            <div className="flex items-center gap-2">
              <label htmlFor="epaper-date-picker" className="text-xs font-bold text-[#56667a] shrink-0">
                Choose Date:
              </label>
              <input
                id="epaper-date-picker"
                type="date"
                value={selectedDateStr}
                max={maxDateStr}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    if (y && m && d) setSelectedDate(new Date(y, m - 1, d));
                  }
                }}
                className="rounded-xl border border-[#ddd8cd] bg-[#faf8f3] px-3 py-1.5 text-xs font-semibold text-[#10213a] outline-none focus:border-[#012c6c] cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Date Chips (Past 7 Days) */}
          <div className="mt-4">
            <p className="text-[11px] font-bold text-[#56667a] uppercase tracking-wider mb-2">
              Quick Select Past Dates:
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Today Pill */}
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${selectedDateStr === today.toISOString().slice(0, 10)
                    ? "bg-[#012c6c] text-white shadow-xs"
                    : "bg-[#faf8f3] text-[#10213a] border border-[#ddd8cd] hover:bg-[#eee8dc]"
                  }`}
              >
                Today
              </button>

              {/* Yesterday Pill */}
              <button
                type="button"
                onClick={() => setSelectedDate(yesterday)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${selectedDateStr === yesterday.toISOString().slice(0, 10)
                    ? "bg-[#012c6c] text-white shadow-xs"
                    : "bg-[#faf8f3] text-[#10213a] border border-[#ddd8cd] hover:bg-[#eee8dc]"
                  }`}
              >
                Yesterday
              </button>

              {/* Past days pills */}
              {pastDays.map((d) => {
                const dateKey = d.toISOString().slice(0, 10);
                const isSelected = selectedDateStr === dateKey;
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${isSelected
                        ? "bg-[#012c6c] text-white shadow-xs"
                        : "bg-[#faf8f3] text-[#10213a] border border-[#ddd8cd] hover:bg-[#eee8dc]"
                      }`}
                  >
                    {formatShortDate(d)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Action Card */}
          <div className="mt-5 rounded-2xl bg-[#faf8f3] border border-[#ddd8cd] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#012c6c] text-white shadow-xs font-black text-sm">
                {selectedDate.getDate()}
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#10213a]">
                  {formatEditionDate(selectedDate)}
                </h4>
                <p className="text-[11px] text-[#56667a]">
                  Complete multi-page newspaper edition formatted in high-resolution vector PDF.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPreview(selectedDate)}
                disabled={loadingPreview}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#ddd8cd] bg-white px-3.5 py-2 text-xs font-bold text-[#012c6c] hover:bg-[#f0ece1] transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownload(selectedDate)}
                disabled={downloadingDate === selectedDateStr}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#012c6c] hover:bg-[#0c2b5e] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
              >
                {downloadingDate === selectedDateStr ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating…</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Edition</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* e-Clip Stories in this Edition */}
          <div className="mt-6 pt-5 border-t border-[#eee8dc]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3.5">
              <div>
                <h4 className="text-xs font-bold text-[#012c6c] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#012c6c]" />
                  e-Clip Stories in this Edition ({selectedEditionStories.length})
                </h4>
                <p className="text-[11px] text-[#56667a]">
                  Clip any article as an authentic high-resolution newspaper card (PNG) to share or save.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedEditionStories.slice(0, 8).map((story) => (
                <div
                  key={story.id}
                  className="group relative flex items-start gap-3 rounded-2xl border border-[#ddd8cd] bg-[#faf8f3] p-3 hover:bg-white hover:shadow-md transition-all"
                >
                  <img
                    src={story.image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover border border-[#ddd8cd]"
                  />
                  <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#012c6c]">
                        <span>{story.topic}</span>
                        <span>·</span>
                        <span className="text-[#56667a]">{story.source}</span>
                      </div>
                      <h5 className="mt-0.5 line-clamp-2 text-xs font-bold text-[#10213a] leading-snug">
                        {story.title}
                      </h5>
                    </div>
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        disabled={clippingStoryId === story.id}
                        onClick={() => handleClipStory(story)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#012c6c] px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[#0c2b5e] transition-colors cursor-pointer disabled:opacity-50"
                        title="Download e-Clip PNG"
                      >
                        {clippingStoryId === story.id ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Clipping…</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3 w-3" />
                            <span>e-Clip</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Archive Table / Grid of Available Editions */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-[#56667a] uppercase tracking-wider mb-2.5">
              Recent Archived Editions:
            </h4>
            <div className="divide-y divide-[#eee8dc] border-t border-[#eee8dc]">
              {[today, yesterday, ...pastDays].slice(0, 6).map((d) => {
                const key = d.toISOString().slice(0, 10);
                const isDownloading = downloadingDate === key;
                return (
                  <div
                    key={key}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-[#faf8f3] px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[#012c6c]" />
                      <div>
                        <p className="text-xs font-bold text-[#10213a]">
                          {formatEditionDate(d)}
                        </p>
                        <p className="text-[10px] text-[#56667a]">
                          {key === today.toISOString().slice(0, 10)
                            ? "Latest Today Issue"
                            : key === yesterday.toISOString().slice(0, 10)
                              ? "Yesterday Issue"
                              : "Archived Print Edition"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPreview(d)}
                        className="p-1.5 text-[#56667a] hover:text-[#012c6c] transition-colors cursor-pointer"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(d)}
                        disabled={isDownloading}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#ddd8cd] bg-white px-2.5 py-1 text-[11px] font-bold text-[#012c6c] hover:bg-[#012c6c] hover:text-white transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Front Page Preview Modal */}
      {isPreviewModalOpen && previewData && (
        <div
          role="dialog"
          aria-label="Front Page Preview"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          {/* Dimmed Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setIsPreviewModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-white/20 overflow-hidden text-[#10213a]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#eee8dc] bg-[#faf8f3] px-5 py-3.5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#012c6c]">
                  ShortBits E-Paper Preview
                </h3>
                <p className="text-[11px] text-[#56667a]">
                  {previewData.dateLabel} · Front Page Preview
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleClipStory(previewData.leadStory)}
                  disabled={clippingStoryId === previewData.leadStory.id}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#012c6c] bg-white px-3 py-1.5 text-xs font-bold text-[#012c6c] hover:bg-[#f0ece1] transition-colors cursor-pointer disabled:opacity-50"
                  title="e-Clip Lead Article"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>e-Clip Lead</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(previewData.dateLabel);
                    handleDownload(isNaN(d.getTime()) ? selectedDate : d);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#012c6c] hover:bg-[#0c2b5e] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Full PDF ({previewData.pageCount} Pages)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="rounded-full p-1.5 text-[#56667a] hover:bg-[#eee8dc] hover:text-[#10213a] transition-colors cursor-pointer"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Canvas Image Preview */}
            <div className="overflow-y-auto p-4 flex justify-center bg-[#2a303c]">
              <img
                src={previewData.dataUrl}
                alt="Front page preview"
                className="max-w-full h-auto rounded-lg shadow-xl border border-white/10"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#012c6c] text-white px-5 py-2.5 text-xs font-bold shadow-xl border border-white/20 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
