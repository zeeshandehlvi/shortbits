// Feed ingestion pipeline: parse every registered source, de-duplicate,
// score for virality & global impact, then let Gemini pick the top stories.

export type FeedItem = {
  title: string;
  detail: string;
  image_url: string | null;
  category: string;
  country: string | null;
  published_at: string;
  feed_link: string;
  source_name: string;
  region: string;
};

export type RankedItem = FeedItem & { city: string | null };

export const CATEGORIES = [
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

/* ---------------- text formatting & limits ---------------- */

// Google News titles read "Headline - Publisher"; drop the trailing publisher.
export function stripPublisher(title: string) {
  return title
    .replace(/\s+[-–—|]\s+[^-–—|]{2,45}$/, "")
    .replace(/\s+-\s+[A-Za-z0-9\s.]+$/, "")
    .trim() || title;
}

/**
 * Strictly format headline to not more than 13-14 words and not more than 75 characters.
 */
export function formatViralTitle(rawTitle: string): string {
  let title = stripPublisher(rawTitle)
    .replace(/^(BREAKING|WATCH|EXCLUSIVE|UPDATE|REPORT|JUST IN)[:\s-]+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // Enforce word count limit: max 14 words
  const words = title.split(/\s+/);
  if (words.length > 14) {
    title = words.slice(0, 14).join(" ");
  }

  // Enforce character limit: max 75 characters
  if (title.length > 75) {
    const slice = title.slice(0, 75);
    const lastSpace = slice.lastIndexOf(" ");
    if (lastSpace > 45) {
      title = slice.slice(0, lastSpace).trim();
    } else {
      title = slice.trim();
    }
  }

  // Strip trailing dangling punctuation
  return title.replace(/[\s,;:\-–—|]+$/, "");
}

/**
 * Strictly format article text to around 700 characters (max 750-800 characters).
 */
export function formatViralDetail(rawDetail: string): string {
  let text = clean(rawDetail).replace(/\s+/g, " ").trim();
  if (text.length <= 750) {
    return text;
  }

  // Truncate cleanly at sentence boundary if possible within 750 characters
  const slice = text.slice(0, 750);
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );

  if (sentenceEnd > 500) {
    return slice.slice(0, sentenceEnd + 1).trim();
  }

  // Otherwise truncate at word boundary
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > 600) {
    return slice.slice(0, lastSpace).trim() + "…";
  }

  return slice.trim();
}

/* ---------------- parsing helpers ---------------- */

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return match?.[1] ?? "";
}

function clean(value: string) {
  if (!value) return "";
  let text = value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    // Decode HTML entities first so escaped tags like &lt;a ...&gt; become <a>...</a>
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Strip all HTML tags thoroughly
  text = text.replace(/<[^>]+>/g, " ");

  // Clean remaining entities and normalize whitespace
  return text
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function imageFrom(block: string) {
  const media =
    block.match(/<media:content[^>]+url="([^"]+)"/i) ??
    block.match(/<media:thumbnail[^>]+url="([^"]+)"/i) ??
    block.match(/<enclosure[^>]+url="([^"]+)"[^>]*type="image/i) ??
    block.match(/<img[^>]+src=["']([^"']+)["']/i) ??
    block.match(/&lt;img[^&]+src=["']([^"']+)["']/i);
  return media?.[1] ?? null;
}

function normaliseKey(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 10)
    .join(" ");
}

/* ---------------- virality & global impact scoring ---------------- */

const VIRAL_TECH_KEYWORDS = [
  "ai",
  "gpt",
  "chatgpt",
  "openai",
  "claude",
  "gemini",
  "anthropic",
  "deepseek",
  "apple",
  "nvidia",
  "google",
  "meta",
  "microsoft",
  "spacex",
  "starship",
  "nasa",
  "breakthrough",
  "launch",
  "launches",
  "unveils",
  "unveiled",
  "announces",
  "announced",
  "quantum",
  "humanoid",
  "robot",
  "supercomputer",
  "chip",
  "semiconductor",
];

const VIRAL_CRISIS_WAR_KEYWORDS = [
  "war",
  "missile",
  "strike",
  "airstrike",
  "conflict",
  "invasion",
  "military",
  "ceasefire",
  "troops",
  "drone",
  "nuclear",
  "sanctions",
  "nato",
  "pentagon",
  "crisis",
  "disaster",
  "emergency",
  "earthquake",
  "tsunami",
  "volcano",
  "hurricane",
  "typhoon",
  "explosion",
  "death toll",
  "casualties",
  "hostage",
  "evacuation",
];

const VIRAL_POLITICS_GLOBAL_KEYWORDS = [
  "president",
  "prime minister",
  "election",
  "parliament",
  "supreme court",
  "summit",
  "treaty",
  "united nations",
  "security council",
  "impeached",
  "resigns",
  "arrested",
  "protest",
  "coup",
  "historic",
  "billions",
  "record",
];

const MUNDANE_DEMOTE_KEYWORDS = [
  "horoscope",
  "crossword",
  "sudoku",
  "obituary",
  "funeral",
  "recipe",
  "traffic",
  "road closure",
  "zoning",
  "lottery",
  "coupon",
  "recap",
  "podcast",
  "newsletter",
  "opinion:",
  "editorial:",
  "column:",
];

export function scoreItemForVirality(item: FeedItem): number {
  let score = 0;
  const text = `${item.title} ${item.detail}`.toLowerCase();

  // High-impact category weights
  const catWeights: Record<string, number> = {
    breaking: 25,
    technology: 22,
    war: 20,
    world: 18,
    trending: 18,
    viral: 16,
    science: 15,
    politics: 14,
    business: 10,
    sports: 6,
    entertainment: 6,
  };
  score += catWeights[item.category] ?? 5;

  // Keyword scoring
  for (const kw of VIRAL_TECH_KEYWORDS) {
    if (text.includes(kw)) score += 6;
  }
  for (const kw of VIRAL_CRISIS_WAR_KEYWORDS) {
    if (text.includes(kw)) score += 6;
  }
  for (const kw of VIRAL_POLITICS_GLOBAL_KEYWORDS) {
    if (text.includes(kw)) score += 4;
  }

  // Demote mundane/local noise
  for (const kw of MUNDANE_DEMOTE_KEYWORDS) {
    if (text.includes(kw)) score -= 15;
  }

  // Recency bonus: within last 3 hours
  const ageHours = (Date.now() - Date.parse(item.published_at)) / (1000 * 60 * 60);
  if (ageHours <= 2) score += 10;
  else if (ageHours <= 6) score += 5;

  return score;
}

async function fetchFeed(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; ShortBits/1.0)" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function inBatches<T, R>(items: T[], size: number, worker: (item: T) => Promise<R>) {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(worker))));
  }
  return out;
}

/* ---------------- collection ---------------- */

export async function collectFeedItems(options: {
  minutes?: number;
  categories?: string[];
  maxSources?: number;
  perFeed?: number;
}): Promise<{ items: FeedItem[]; scanned: number }> {
  const { NEWS_SOURCES } = await import("./news-sources");
  const minutes = options.minutes && options.minutes > 0 ? options.minutes : 60;
  const cutoff = Date.now() - minutes * 60 * 1000;
  const perFeed = options.perFeed ?? 15;

  const pool = options.categories?.length
    ? NEWS_SOURCES.filter((source) => options.categories!.includes(source.category))
    : NEWS_SOURCES;

  // Prioritize sources by virality weight and priority so high-impact feeds are fetched first
  const sortedSources = [...pool]
    .filter(
      (source) =>
        source.enabled !== false &&
        (source.type === "rss" || source.type === "google_news") &&
        Boolean(source.feed_url),
    )
    .sort((a, b) => {
      const aScore = (a.viral_weight ?? 5) * 10 - (a.priority ?? 2);
      const bScore = (b.viral_weight ?? 5) * 10 - (b.priority ?? 2);
      return bScore - aScore;
    });

  const selected = sortedSources.slice(0, options.maxSources ?? 200);

  const seenLinks = new Set<string>();
  const seenTitles = new Set<string>();
  const items: FeedItem[] = [];

  await inBatches(selected, 15, async (source) => {
    const xml = await fetchFeed(source.feed_url!);
    if (!xml) return;
    const blocks = xml.includes("<item")
      ? xml.split(/<item[\s>]/).slice(1)
      : xml.split(/<entry[\s>]/).slice(1);

    for (const block of blocks.slice(0, perFeed)) {
      const rawTitle = clean(tag(block, "title"));
      const title = source.type === "google_news" ? stripPublisher(rawTitle) : rawTitle;
      const link = clean(tag(block, "link")) || block.match(/<link[^>]+href="([^"]+)"/i)?.[1] || "";
      if (!title || title.length < 12 || !link) continue;

      const dateText = tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
      const published = dateText ? new Date(clean(dateText)) : new Date();
      const stamp = Number.isFinite(published.getTime()) ? published.getTime() : Date.now();
      if (stamp < cutoff) continue;

      const titleKey = normaliseKey(title);
      if (seenLinks.has(link) || seenTitles.has(titleKey)) continue;
      seenLinks.add(link);
      seenTitles.add(titleKey);

      items.push({
        title,
        detail: clean(tag(block, "description") || tag(block, "summary") || tag(block, "content")).slice(0, 900),
        image_url: imageFrom(block),
        category: source.category,
        country: source.region === "india" ? "India" : null,
        published_at: new Date(stamp).toISOString(),
        feed_link: link,
        source_name: source.source_name,
        region: source.region,
      });
    }
  });

  return { items, scanned: selected.length };
}

/* ---------------- Gemini ranking ---------------- */

type GeminiPick = {
  index: number;
  title?: string;
  detail?: string;
  category?: string;
  city?: string | null;
  country?: string | null;
};

export async function rankWithGemini(items: FeedItem[], want: number): Promise<RankedItem[]> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in .env or environment! AI news generation requires a valid Gemini API key.",
    );
  }
  if (items.length === 0) return [];

  // Order candidates by virality score so Gemini evaluates the highest-impact stories first
  const sortedItems = [...items].sort((a, b) => scoreItemForVirality(b) - scoreItemForVirality(a));
  const candidates = sortedItems.slice(0, 180).map((item, index) => ({
    i: index,
    t: item.title,
    d: item.detail.slice(0, 600),
    c: item.category,
    s: item.source_name,
  }));

  const prompt = `You are the Editor-in-Chief of ShortBits, a hyper-curated mobile news app delivering the world's most viral, high-impact stories.
Below are ${candidates.length} candidate stories from the latest global wire feeds, sorted by virality and impact signals.

YOUR MISSION:
Select the top ${want} stories that have the HIGHEST VIRALITY and BIGGEST GLOBAL IMPACT for a worldwide audience, then WRITE and POLISH each story into an engaging, complete news piece suitable for ShortBits posts.

SELECTION CRITERIA (PRIORITIZE HIGH VIRALITY & GLOBAL RELEVANCE):
1. TOP TRENDING & MAXIMUM IMPACT:
   - Major Tech Launches & Breakthroughs: Frontier AI releases (OpenAI, Gemini, Anthropic, DeepSeek), groundbreaking hardware (Apple, Nvidia), space exploration milestones (SpaceX, NASA), revolutionary science.
   - Global Crises & Emergencies: Major natural disasters, urgent humanitarian emergencies, unexpected shocks affecting international communities.
   - War, Military & Geopolitics: Major conflict escalations, airstrikes, historic ceasefire talks, high-stakes international security moves.
   - Historic Global Politics: Decisive elections, presidential actions, major international summits, monumental policy shifts.
   - Global Viral & Trending Culture: Extraordinary human milestones, internet-wide phenomena, massive cultural moments suitable for all global readers.
2. STRICTLY REJECT LOW-IMPACT / MUNDANE CONTENT:
   - Reject local city crime, municipal council zoning meetings, minor corporate PR/press releases, routine stock ticker movements, local traffic/weather, opinion op-eds, listicles, or hyper-niche domestic squabbles.
3. DIVERSITY & NON-DUPLICATION:
   - Cover diverse high-impact topics (tech launches, crisis, war, global politics, viral discoveries).
   - Never pick two items about the same event; choose the single strongest, most compelling story.

STRICT EDITORIAL RULES (MANDATORY LENGTHS & QUALITY):
- "title": Make it around 75 characters long (strictly max 75 characters, max 13-14 words). Punchy, engaging, viral, factual headline optimized for Google Search and news ranking. No clickbait questions, no trailing publisher names.
- "detail": MUST BE A FULLY WRITTEN, POLISHED ARTICLE BODY AROUND 700 CHARACTERS LONG (approximately 100-130 words).
  - DO NOT just copy or summarize raw feed snippets. You MUST synthesize and write a rich, cohesive news piece:
    • Paragraph 1 (The Hook & Core Event): What happened, who is involved, and the breaking facts.
    • Paragraph 2 (Context & Key Data): Background, critical statistics, why it developed, and key stakes.
    • Paragraph 3 (Global Significance): Broader impact on the world, reactions, and what happens next.
  - High journalistic density, polished style, captivating prose suitable for ShortBits posts.
- "category": MUST be one of: ${CATEGORIES.join(", ")}.
- "city" and "country": The primary geographic location the story is about (e.g., city: "San Francisco", country: "United States" or city: "New Delhi", country: "India" or city: "Kyiv", country: "Ukraine"). Always identify the specific city and country if mentioned or relevant to maximize local, state & national Google search engine indexing.

Output valid JSON only matching this schema:
{"picks":[{"index":<candidate i>,"title":"<around 75 chars, max 75 chars, max 14 words>","detail":"<around 700 chars, rich polished 2-3 paragraph news piece>","category":"<category>","city":"<City or null>","country":"<Country or null>"}]}

Candidates:
${JSON.stringify(candidates)}`;

  // Use gemini-3.6-flash as primary, with gemini-3.5-flash and gemini-3.5-flash-lite as backups
  const modelsToTry = [
    process.env["GEMINI_MODEL"] || "gemini-3.6-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let picks: GeminiPick[] = [];
  let lastError: string | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
          }),
        },
      );
      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[ingest] gemini ${model} returned ${response.status}: ${errText.slice(0, 150)}`);
        lastError = `${model} returned HTTP ${response.status}`;
        continue;
      }
      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      const jsonText = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
      const parsed = JSON.parse(jsonText) as { picks?: GeminiPick[] };
      if (parsed.picks && parsed.picks.length > 0) {
        picks = parsed.picks;
        console.log(`[ingest] Successfully curated ${picks.length} articles using ${model}`);
        break;
      }
    } catch (err) {
      console.warn(`[ingest] gemini ${model} attempt failed:`, err);
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  if (picks.length === 0) {
    throw new Error(
      `Gemini AI curation failed across models (${modelsToTry.join(", ")}). Last error: ${lastError || "No stories selected"}. Please retry.`,
    );
  }

  const used = new Set<number>();
  const ranked: RankedItem[] = [];

  for (const pick of picks) {
    const source = sortedItems[pick.index];
    if (!source || used.has(pick.index)) continue;
    used.add(pick.index);

    const formattedTitle = formatViralTitle(pick.title || source.title);
    const formattedDetail = formatViralDetail(pick.detail || source.detail);

    ranked.push({
      ...source,
      title: formattedTitle,
      detail: formattedDetail,
      category: pick.category && CATEGORIES.includes(pick.category) ? pick.category : source.category,
      city: pick.city || null,
      country: pick.country || source.country,
    });
    if (ranked.length >= want) break;
  }

  return ranked;
}

/* ---------------- full run ---------------- */

export async function runIngest(
  supabase: { from: (table: string) => any },
  options: { minutes?: number; categories?: string[]; want?: number; status?: string; createdBy?: string | null },
) {
  const want = options.want ?? 30;
  const base = options.minutes ?? 60;

  // Drop anything already stored.
  const { data: existing } = await supabase
    .from("articles")
    .select("feed_link")
    .not("feed_link", "is", null)
    .order("created_at", { ascending: false })
    .limit(4000);
  const known = new Set((existing ?? []).map((row: { feed_link: string }) => row.feed_link));

  // Widen the time window until there is a healthy candidate pool
  const windows = [base, base * 3, base * 8, base * 24].filter((value, index, all) => all.indexOf(value) === index);
  let fresh: FeedItem[] = [];
  let scanned = 0;
  for (const minutes of windows) {
    const collected = await collectFeedItems({
      minutes,
      perFeed: 25,
      ...(options.categories ? { categories: options.categories } : {}),
    });
    scanned = collected.scanned;
    fresh = collected.items.filter((item) => !known.has(item.feed_link));
    if (fresh.length >= want * 3) break;
  }

  if (fresh.length === 0) return { inserted: 0, scanned, candidates: 0 };

  // Rank with virality scoring and Gemini
  const ranked = await rankWithGemini(fresh, want);
  const rows = ranked.map((item) => ({
    title: formatViralTitle(item.title),
    detail: formatViralDetail(item.detail),
    image_url: item.image_url,
    category: item.category,
    city: item.city,
    country: item.country,
    published_at: item.published_at,
    status: options.status ?? "published",
    feed_link: item.feed_link,
    created_by: options.createdBy ?? null,
  }));

  const { data: inserted, error } = await supabase
    .from("articles")
    .upsert(rows, { onConflict: "feed_link", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(error.message);
  return { inserted: inserted?.length ?? 0, scanned, candidates: fresh.length };
}

