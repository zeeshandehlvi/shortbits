import { createFileRoute } from "@tanstack/react-router";
import { listAllArticlesForSitemap, getArticleDateStr, slugify } from "@/lib/articles.functions";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const articles = await listAllArticlesForSitemap();
          const baseUrl = "https://theshortbits.com";
          const now = new Date().toISOString();

          let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
          xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

          // Homepage
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}/</loc>\n`;
          xml += `    <lastmod>${now}</lastmod>\n`;
          xml += `    <changefreq>hourly</changefreq>\n`;
          xml += `    <priority>1.0</priority>\n`;
          xml += `  </url>\n`;

          // E-Paper
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}/?tab=epaper</loc>\n`;
          xml += `    <lastmod>${now}</lastmod>\n`;
          xml += `    <changefreq>daily</changefreq>\n`;
          xml += `    <priority>0.8</priority>\n`;
          xml += `  </url>\n`;

          // Individual article permalinks with images
          for (const a of articles) {
            const dateStr = getArticleDateStr(a.published_at);
            const slug = slugify(a.title);
            const url = `${baseUrl}/${dateStr}/${slug}`;
            const lastmod = new Date(a.published_at || Date.now()).toISOString();

            xml += `  <url>\n`;
            xml += `    <loc>${url}</loc>\n`;
            xml += `    <lastmod>${lastmod}</lastmod>\n`;
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.9</priority>\n`;

            if (a.image_url) {
              const safeImg = a.image_url.replace(/&/g, "&amp;");
              const safeTitle = a.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
              xml += `    <image:image>\n`;
              xml += `      <image:loc>${safeImg}</image:loc>\n`;
              xml += `      <image:title>${safeTitle}</image:title>\n`;
              xml += `    </image:image>\n`;
            }

            xml += `  </url>\n`;
          }

          xml += `</urlset>`;

          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=1800, s-maxage=3600",
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return new Response(`Error generating sitemap: ${message}`, { status: 500 });
        }
      },
    },
  },
});
