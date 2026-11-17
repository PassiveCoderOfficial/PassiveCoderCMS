import { headers } from "next/headers";
import { sitemapEntries, type SitemapEntry, type SitemapKind } from "@/lib/seo/sitemap-entries";
import { resolveTenant } from "@/lib/tenant/resolve";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const GROUPS: { kind: SitemapKind; label: string }[] = [
  { kind: "page", label: "Pages" },
  { kind: "post", label: "Articles" },
  { kind: "product", label: "Products" },
  { kind: "property", label: "Properties" },
  { kind: "community", label: "Communities" },
];

/**
 * /sitemap.html: the same list as /sitemap.xml, for people. Page titles,
 * grouped (pages, articles, products...), newest articles first. Plain HTML
 * with no site chrome so it is fast and works in every browser; "noindex,
 * follow" keeps it out of search results while crawlers still follow every
 * link on it.
 */
export async function GET() {
  const host = (await headers()).get("host") ?? "";
  const [entries, tenant] = await Promise.all([sitemapEntries(host).catch(() => [] as SitemapEntry[]), resolveTenant(host).catch(() => null)]);
  const name = tenant?.name ?? "Passive Coder";
  const sections = GROUPS.map(({ kind, label }) => {
    const rows = entries.filter((e) => e.kind === kind)
      .sort((a, b) => (kind === "post" ? b.lastModified.localeCompare(a.lastModified) : a.url.localeCompare(b.url)));
    if (!rows.length) return "";
    return `<section><h2>${label} <span>${rows.length}</span></h2><ul>${rows.map((e) =>
      `<li><a href="${esc(e.url)}">${esc(e.title || e.url)}</a><small>${esc(new URL(e.url).pathname)}${kind === "post" ? ` · ${esc(e.lastModified.slice(0, 10))}` : ""}</small></li>`).join("")}</ul></section>`;
  }).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, follow"><title>Sitemap · ${esc(name)}</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#f8fafc;color:#0f172a}
main{max-width:860px;margin:0 auto;padding:32px 16px}
h1{font-size:26px;margin:0 0 6px}h2{font-size:18px;margin:28px 0 10px}h2 span{font-size:13px;color:#64748b;font-weight:500}
p{color:#475569;font-size:14px;margin:0;line-height:1.5}
ul{list-style:none;margin:0;padding:0;background:#fff;border:1px solid #e2e8f0;border-radius:8px}
li{padding:10px 14px;border-bottom:1px solid #e2e8f0;display:flex;flex-direction:column;gap:2px}li:last-child{border-bottom:0}
a{color:#2563eb;text-decoration:none;font-size:15px}a:hover{text-decoration:underline}
small{color:#64748b;font-size:12px;word-break:break-all}
@media (prefers-color-scheme:dark){body{background:#0f172a;color:#e2e8f0}p,small,h2 span{color:#94a3b8}ul{background:#111827;border-color:#1f2937}li{border-color:#1f2937}a{color:#60a5fa}}
</style></head><body><main>
<h1>${esc(name)}: all pages</h1>
<p>${entries.length} pages. Search engines read the same list at <a href="/sitemap.xml">sitemap.xml</a>.</p>
${sections}
</main></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" } });
}
