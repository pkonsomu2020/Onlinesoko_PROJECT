import { createFileRoute } from "@tanstack/react-router";

// Use the production domain. Falls back to the request origin during local dev.
const PRODUCTION_URL = "https://unconquered.co.ke";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // In production use the canonical domain; in dev use the request origin
        const base = process.env.APP_URL || new URL(request.url).origin || PRODUCTION_URL;
        const entries = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/browse", changefreq: "hourly", priority: "0.9" },
          { path: "/fairness", changefreq: "weekly", priority: "0.7" },
          { path: "/legal", changefreq: "monthly", priority: "0.4" },
        ];
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...entries.map((e) => `  <url><loc>${base}${e.path}</loc><changefreq>${e.changefreq}</changefreq><priority>${e.priority}</priority></url>`),
          `</urlset>`,
        ].join("\n");
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
