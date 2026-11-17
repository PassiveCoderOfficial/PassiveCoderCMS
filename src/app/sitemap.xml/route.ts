import { headers } from "next/headers";
import { sitemapEntries } from "@/lib/seo/sitemap-entries";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * /sitemap.xml for every site (tenant hosts and the root site). Plain
 * sitemaps.org XML for search engines, with a stylesheet (/sitemap.xsl) so a
 * person opening it in a browser sees a readable table instead of raw tags.
 * The list itself comes from lib/seo/sitemap-entries.ts.
 */
export async function GET() {
  const host = (await headers()).get("host") ?? "";
  const entries = await sitemapEntries(host).catch(() => []);
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((e) =>
      `<url><loc>${esc(e.url)}</loc><lastmod>${esc(new Date(e.lastModified).toISOString())}</lastmod><changefreq>${e.changeFrequency}</changefreq><priority>${e.priority}</priority></url>`),
    "</urlset>",
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
