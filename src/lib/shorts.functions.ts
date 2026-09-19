import { createServerFn } from "@tanstack/react-start";

const CHANNEL_ID = "UCOT121l_dL3FVdEfd6kCvfQ";
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export type Short = {
  id: string;
  title: string;
  published: string;
  thumbnail: string;
  views: number | null;
};

function pick(block: string, pattern: RegExp) {
  const match = block.match(pattern);
  return match?.[1] ?? "";
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export const getShorts = createServerFn({ method: "GET" }).handler(async (): Promise<Short[]> => {
  const response = await fetch(FEED_URL, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) {
    throw new Error(`YouTube feed request failed [${response.status}]: ${await response.text()}`);
  }
  const xml = await response.text();
  const entries = xml.split("<entry>").slice(1);

  return entries
    .filter((entry) => entry.includes("/shorts/"))
    .map((entry) => {
      const views = pick(entry, /<media:statistics\s+views="(\d+)"/);
      return {
        id: pick(entry, /<yt:videoId>([^<]+)<\/yt:videoId>/),
        title: decode(pick(entry, /<title>([^<]*)<\/title>/)).replace(/\s*#\w+/g, "").trim(),
        published: pick(entry, /<published>([^<]+)<\/published>/),
        thumbnail: pick(entry, /<media:thumbnail\s+url="([^"]+)"/),
        views: views ? Number(views) : null,
      };
    })
    .filter((short) => short.id.length > 0);
});
