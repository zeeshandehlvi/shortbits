import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Bookmark,
  Heart,
  ArrowLeft,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Volume2,
  VolumeX,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ShortBits — My Account & Preferences" },
      { name: "description", content: "Manage your ShortBits account, reader preferences, saved stories, and newsroom access." },
      { property: "og:title", content: "ShortBits — My Account & Preferences" },
      { property: "og:description", content: "Personalize your ShortBits experience and manage newsroom access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

interface UserProfile {
  id: string;
  email: string;
  created_at?: string;
  role: "admin" | "editor" | "reader";
}

export default function AccountPage() {
  const navigate = useNavigate();
  const [sessionUser, setSessionUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Guest auth form state
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reader stats from localStorage
  const [stats, setStats] = useState({ savedCount: 0, likedCount: 0, viewsCount: 0 });
  const [mutedByDefault, setMutedByDefault] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check PWA standalone mode
    if (typeof window !== "undefined") {
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isPWA);

      // Load engagement stats
      try {
        const raw = localStorage.getItem("shortbits_engagement_v2");
        if (raw) {
          const parsed = JSON.parse(raw);
          const savedCount = parsed.saved ? Object.values(parsed.saved).filter(Boolean).length : 0;
          const likedCount = parsed.liked ? Object.values(parsed.liked).filter(Boolean).length : 0;
          const viewsCount = parsed.views ? Object.values(parsed.views).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : 0;
          setStats({ savedCount, likedCount, viewsCount });
        }
      } catch {
        /* ignore */
      }

      // Load audio pref
      const audioPref = localStorage.getItem("shortbits_audio_muted");
      if (audioPref !== null) {
        setMutedByDefault(audioPref === "true");
      }
    }

    // Check user auth & role
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchRoleAndSetUser(session.user);
      } else {
        setSessionUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        await fetchRoleAndSetUser(data.session.user);
      } else {
        setSessionUser(null);
      }
    } catch {
      setSessionUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRoleAndSetUser(user: any) {
    let role: "admin" | "editor" | "reader" = "reader";
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.role === "admin") role = "admin";
      else if (data?.role === "editor") role = "editor";
    } catch {
      /* fallback to reader */
    }

    setSessionUser({
      id: user.id,
      email: user.email ?? "",
      created_at: user.created_at,
      role,
    });
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      if (authMode === "signup") {
        const redirectUrl =
          typeof window !== "undefined" && window.location.origin.includes("theshortbits.com")
            ? `${window.location.origin}/account`
            : "https://theshortbits.com/account";
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({
            type: "success",
            text: "Account registered! If confirmation is enabled, check your email inbox to verify your account.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({ type: "success", text: "Signed in successfully!" });
          await checkUser();
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "An unexpected error occurred." });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      setSessionUser(null);
      setMessage({ type: "success", text: "Signed out safely." });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Sign out failed." });
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset() {
    if (!sessionUser?.email) return;
    setBusy(true);
    setMessage(null);
    try {
      const redirectUrl =
        typeof window !== "undefined" && window.location.origin.includes("theshortbits.com")
          ? `${window.location.origin}/account`
          : "https://theshortbits.com/account";
      const { error } = await supabase.auth.resetPasswordForEmail(sessionUser.email, {
        redirectTo: redirectUrl,
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: `A secure password reset link has been dispatched to ${sessionUser.email}.`,
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Password reset request failed." });
    } finally {
      setBusy(false);
    }
  }

  function toggleAudioDefault() {
    const next = !mutedByDefault;
    setMutedByDefault(next);
    localStorage.setItem("shortbits_audio_muted", String(next));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8f3] grid place-items-center p-6 text-[#10213a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-3 border-[#012c6c] border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#56667a]">Loading Account…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#10213a] flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#ddd8cd] bg-[#faf8f3]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center gap-2 rounded-full border border-[#ddd8cd] bg-white px-3.5 py-1.5 text-xs font-bold text-[#10213a] shadow-xs hover:bg-[#eee8dc] transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> <span>Back to News</span>
          </button>

          <h1 className="brand-wordmark text-xl font-bold tracking-tight">
            ShortBits<span className="brand-dot">.</span> Account
          </h1>

          {sessionUser ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-all cursor-pointer"
            >
              <LogOut size={13} /> <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="text-xs font-bold text-[#56667a] hover:text-[#10213a] transition-all"
            >
              Feed
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 flex-1">
        {message && (
          <div
            className={`mb-6 flex items-start gap-2.5 rounded-2xl p-4 text-xs font-semibold shadow-xs ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            )}
            <p className="flex-1 leading-relaxed">{message.text}</p>
          </div>
        )}

        {sessionUser ? (
          /* ============================================================
             AUTHENTICATED USER VIEW
             ============================================================ */
          <div className="space-y-6">
            {/* Identity Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#012c6c] to-[#044299] text-xl font-black text-white shadow-md">
                    {sessionUser.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#10213a]">
                        {sessionUser.email}
                      </h2>
                      {sessionUser.role === "admin" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-800">
                          <ShieldCheck size={12} /> Admin
                        </span>
                      )}
                      {sessionUser.role === "editor" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-blue-800">
                          <Sparkles size={12} /> Editor
                        </span>
                      )}
                      {sessionUser.role === "reader" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                          <User size={12} /> Reader
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#56667a]">
                      Account ID: <code className="rounded bg-[#faf8f3] px-1.5 py-0.5 font-mono text-[11px] text-[#2c3b4d]">{sessionUser.id.slice(0, 16)}…</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-3.5 py-2 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] transition-all cursor-pointer"
                  >
                    <KeyRound size={13} /> Reset Password
                  </button>
                </div>
              </div>
            </div>

            {/* Newsroom Admin Quick Access (If Admin or Editor) */}
            {(sessionUser.role === "admin" || sessionUser.role === "editor") && (
              <div className="relative overflow-hidden rounded-3xl border-2 border-[#012c6c]/20 bg-gradient-to-r from-[#012c6c]/5 via-white to-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#012c6c] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      <ShieldCheck size={11} /> Newsroom Privileges Active
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-[#10213a]">
                      ShortBits Newsroom &amp; Publishing Suite
                    </h3>
                    <p className="text-xs text-[#56667a] max-w-xl leading-relaxed">
                      You have editorial rights to draft articles, review feeds, manage breaking stories, and trigger AI ingestions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/admin" })}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#012c6c] px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-[#023b8f] transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Launch Newsroom Dashboard</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Reading Activity & Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#56667a]">Saved Stories</span>
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-amber-50 text-amber-600">
                    <Bookmark size={15} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-extrabold text-[#10213a]">{stats.savedCount}</div>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/" })}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#012c6c] hover:underline cursor-pointer"
                >
                  View bookmarks ➔
                </button>
              </div>

              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#56667a]">Liked Stories</span>
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-rose-50 text-rose-600">
                    <Heart size={15} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-extrabold text-[#10213a]">{stats.likedCount}</div>
                <p className="mt-3 text-xs text-[#56667a]">Articles marked as helpful</p>
              </div>

              <div className="rounded-3xl border border-[#ddd8cd] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#56667a]">Estimated Reads</span>
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <Newspaper size={15} />
                  </div>
                </div>
                <div className="mt-3 text-2xl font-extrabold text-[#10213a]">{stats.viewsCount}</div>
                <p className="mt-3 text-xs text-[#56667a]">Articles browsed on this device</p>
              </div>
            </div>

            {/* Preferences & App Settings */}
            <div className="rounded-3xl border border-[#ddd8cd] bg-white p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#56667a]">
                Reader Preferences &amp; Devices
              </h3>

              {/* Video audio preference */}
              <div className="flex items-center justify-between py-2 border-b border-[#eee8dc]">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#10213a] flex items-center gap-2">
                    {mutedByDefault ? <VolumeX size={16} className="text-[#56667a]" /> : <Volume2 size={16} className="text-emerald-600" />}
                    <span>Default Video Audio</span>
                  </div>
                  <p className="text-xs text-[#56667a]">
                    Automatically mute ShortBits video news clips upon scrolling
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleAudioDefault}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    mutedByDefault ? "bg-[#012c6c]" : "bg-gray-300"
                  }`}
                  aria-label="Toggle audio default"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      mutedByDefault ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* App / PWA Status */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#10213a] flex items-center gap-2">
                    <Smartphone size={16} className="text-[#56667a]" />
                    <span>App Experience</span>
                  </div>
                  <p className="text-xs text-[#56667a]">
                    {isStandalone
                      ? "Running as standalone installed app on your device"
                      : "Running in web browser mode. You can install ShortBits for an app-like experience."}
                  </p>
                </div>
                {!isStandalone && (
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent("open-pwa-install"))}
                    className="rounded-full border border-[#ddd8cd] bg-[#faf8f3] px-3.5 py-1.5 text-xs font-bold text-[#10213a] hover:bg-[#eee8dc] transition-all cursor-pointer whitespace-nowrap"
                  >
                    Install App
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             GUEST / AUTHENTICATION PORTAL VIEW
             ============================================================ */
          <div className="mx-auto max-w-md">
            <div className="overflow-hidden rounded-3xl border border-[#ddd8cd] bg-white p-7 shadow-xl">
              <div className="text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#012c6c] text-white shadow-md mb-3">
                  <User size={24} />
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#10213a]">
                  ShortBits<span className="text-[#012c6c]">.</span> Account
                </h2>
                <p className="mt-1 text-xs text-[#56667a]">
                  Sign in to access editorial tools, sync bookmarks, and personalize your feed.
                </p>
              </div>

              {/* Mode toggle */}
              <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-[#faf8f3] p-1 border border-[#ddd8cd]">
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className={`rounded-full py-2 text-xs font-bold transition-all cursor-pointer ${
                    authMode === "signin"
                      ? "bg-[#012c6c] text-white shadow-xs"
                      : "text-[#56667a] hover:text-[#10213a]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`rounded-full py-2 text-xs font-bold transition-all cursor-pointer ${
                    authMode === "signup"
                      ? "bg-[#012c6c] text-white shadow-xs"
                      : "text-[#56667a] hover:text-[#10213a]"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="mt-5 space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#56667a] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a9c]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="editor@shortbits.com"
                      className="w-full rounded-2xl border border-[#ddd8cd] bg-[#faf8f3] pl-10 pr-4 py-2.5 text-sm text-[#10213a] placeholder-[#8a99aa] outline-none focus:border-[#012c6c] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#56667a] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7b8a9c]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-[#ddd8cd] bg-[#faf8f3] pl-10 pr-10 py-2.5 text-sm text-[#10213a] placeholder-[#8a99aa] outline-none focus:border-[#012c6c] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7b8a9c] hover:text-[#10213a] cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-[#012c6c] py-3 text-xs font-bold text-white shadow-md hover:bg-[#023b8f] disabled:opacity-60 transition-all cursor-pointer mt-2"
                >
                  {busy ? "Please wait…" : authMode === "signin" ? "Sign In to ShortBits" : "Register Account"}
                </button>
              </form>

              {/* Highlights */}
              <div className="mt-6 pt-5 border-t border-[#eee8dc] space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-[#56667a]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Sync bookmarked stories across your devices</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#56667a]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Access Newsroom publishing &amp; AI ingestion portal</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-[#56667a]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>High-resolution daily E-Paper print archives</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ddd8cd] py-4 text-center text-xs text-[#7b8a9c]">
        ShortBits Newsroom · Fast, Curated, High-Impact News
      </footer>
    </div>
  );
}
