import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type Article = {
  id: string;
  title: string;
  detail: string;
  image_url: string | null;
  category: string;
  city: string | null;
  country: string | null;
  published_at: string;
  status: string;
};

const ARTICLE_FIELDS = "id, title, detail, image_url, category, city, country, published_at, status";

function serverPublicClient() {
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    "";
  const url =
    process.env["SUPABASE_URL"] ||
    process.env["VITE_SUPABASE_URL"] ||
    import.meta.env["VITE_SUPABASE_URL"] ||
    "";
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const listPublishedArticles = createServerFn({ method: "GET" }).handler(async (): Promise<Article[]> => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_FIELDS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as Article[];
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin access required");
}

export const isAdminUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return Boolean(data);
  });

export const adminListArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Article[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("articles")
      .select(ARTICLE_FIELDS)
      .order("published_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []) as Article[];
  });

export type ArticleInput = {
  id?: string;
  title: string;
  detail: string;
  image_url: string | null;
  category: string;
  city: string | null;
  country: string | null;
  published_at: string;
  status: string;
};

export const adminSaveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ArticleInput) => input)
  .handler(async ({ data, context }): Promise<Article> => {
    await assertAdmin(context);
    const payload = {
      title: data.title.trim(),
      detail: data.detail,
      image_url: data.image_url || null,
      category: data.category,
      city: data.city || null,
      country: data.country || null,
      published_at: data.published_at,
      status: data.status === "published" ? "published" : "draft",
      created_by: context.userId,
    };
    const query = data.id
      ? context.supabase.from("articles").update(payload).eq("id", data.id).select(ARTICLE_FIELDS).single()
      : context.supabase.from("articles").insert(payload).select(ARTICLE_FIELDS).single();
    const { data: row, error } = await query;
    if (error) throw new Error(error.message);
    return row as Article;
  });

export const adminDeleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.ids || data.ids.length === 0) return { ok: true, count: 0 };
    const { error } = await context.supabase.from("articles").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.ids.length };
  });

export const adminSetStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "draft" | "published" }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("articles")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------------- Feed ingestion ---------------- */

export const adminIngestFeeds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { categories?: string[]; minutes?: number; want?: number; status?: string; apiKey?: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { runIngest } = await import("./ingest.server");
    return runIngest(context.supabase, {
      minutes: data.minutes ?? 60,
      ...(data.categories ? { categories: data.categories } : {}),
      want: data.want ?? 30,
      status: data.status ?? "published",
      createdBy: context.userId,
      apiKey: data.apiKey,
    });
  });

/* ---------------- Safe Image Proxy for E-Clip & E-Paper ---------------- */

export const getSafeImageBase64 = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => input)
  .handler(async ({ data }): Promise<string | null> => {
    try {
      if (!data?.url || typeof data.url !== "string" || !data.url.startsWith("http")) {
        return null;
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(data.url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buffer = await res.arrayBuffer();
      // Cap at 6MB to prevent oversized payloads
      if (buffer.byteLength > 6 * 1024 * 1024) return null;
      const base64 = Buffer.from(buffer).toString("base64");
      return `data:${contentType};base64,${base64}`;
    } catch {
      return null;
    }
  });

/* ---------------- Export & Import All Articles (JSON) ---------------- */

export type FullArticleExport = {
  version: string;
  exported_at: string;
  count: number;
  articles: Array<{
    id: string;
    title: string;
    detail: string;
    image_url: string | null;
    category: string;
    city: string | null;
    country: string | null;
    feed_link: string | null;
    published_at: string;
    status: string;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  }>;
};

export const adminExportAllArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FullArticleExport> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as any[];
    return {
      version: "1.0",
      exported_at: new Date().toISOString(),
      count: rows.length,
      articles: rows,
    };
  });

export type ImportArticleItem = {
  id?: string;
  title: string;
  detail: string;
  image_url?: string | null;
  category?: string;
  city?: string | null;
  country?: string | null;
  feed_link?: string | null;
  published_at?: string;
  status?: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const adminImportArticles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      articles: ImportArticleItem[];
      mode?: "upsert" | "insert";
    }) => input
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { articles, mode = "upsert" } = data;
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      throw new Error("No articles provided for import.");
    }

    const validRows: any[] = [];
    for (const item of articles) {
      if (!item || typeof item !== "object") continue;
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const detail = typeof item.detail === "string" ? item.detail.trim() : "";
      if (!title || !detail) continue;

      const row: Record<string, any> = {
        title,
        detail,
        category: (typeof item.category === "string" && item.category.trim()) || "General",
        city: (typeof item.city === "string" && item.city.trim()) || null,
        country: (typeof item.country === "string" && item.country.trim()) || null,
        image_url: (typeof item.image_url === "string" && item.image_url.trim()) || null,
        feed_link: (typeof item.feed_link === "string" && item.feed_link.trim()) || null,
        published_at:
          item.published_at && !isNaN(new Date(item.published_at).getTime())
            ? new Date(item.published_at).toISOString()
            : new Date().toISOString(),
        status: item.status === "draft" ? "draft" : "published",
        created_by: context.userId,
      };

      if (mode === "upsert" && item.id && typeof item.id === "string") {
        row["id"] = item.id;
      }
      validRows.push(row);
    }

    if (validRows.length === 0) {
      throw new Error(
        "No valid articles found in import data. Each article must contain at least 'title' and 'detail'."
      );
    }

    const BATCH_SIZE = 50;
    let totalProcessed = 0;
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      const query =
        mode === "upsert"
          ? context.supabase.from("articles").upsert(batch, { onConflict: "id" })
          : context.supabase.from("articles").insert(batch);

      const { error } = await query;
      if (error) {
        throw new Error(
          `Failed during batch import (${i + 1}-${i + batch.length}): ${error.message}`
        );
      }
      totalProcessed += batch.length;
    }

    return {
      ok: true,
      count: totalProcessed,
      skipped: articles.length - validRows.length,
    };
  });

/* ---------------- SEO & Permalinks ---------------- */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90)
    .replace(/^-+|-+$/g, "");
}

export function getArticleDateStr(publishedAt: string): string {
  try {
    return new Date(publishedAt).toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export const getArticleByDateAndSlug = createServerFn({ method: "GET" })
  .inputValidator((input: { date: string; slug: string }) => input)
  .handler(async ({ data }): Promise<Article | null> => {
    const { date, slug } = data;
    if (!date || !slug) return null;

    const supabase = serverPublicClient();

    // Query published articles for that day (start of day to end of day)
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data: articles, error } = await supabase
      .from("articles")
      .select(ARTICLE_FIELDS)
      .eq("status", "published")
      .gte("published_at", startOfDay)
      .lte("published_at", endOfDay);

    if (!error && articles && articles.length > 0) {
      // Find exact slug match
      const matched = articles.find((a) => slugify(a.title) === slug);
      if (matched) return matched as Article;

      // Partial slug match
      const partial = articles.find(
        (a) => slugify(a.title).startsWith(slug) || slug.startsWith(slugify(a.title))
      );
      if (partial) return partial as Article;
    }

    // Fallback: search recent published articles by matching slug
    const { data: allArticles } = await supabase
      .from("articles")
      .select(ARTICLE_FIELDS)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(300);

    if (allArticles) {
      const match = allArticles.find((a) => {
        const aDate = getArticleDateStr(a.published_at);
        const aSlug = slugify(a.title);
        return (aDate === date && aSlug === slug) || aSlug === slug;
      });
      if (match) return match as Article;
    }

    return null;
  });

export const listAllArticlesForSitemap = createServerFn({ method: "GET" })
  .handler(async (): Promise<Array<{ id: string; title: string; published_at: string; image_url: string | null }>> => {
    const supabase = serverPublicClient();
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, published_at, image_url")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []) as any[];
  });




