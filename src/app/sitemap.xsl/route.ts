/**
 * Stylesheet for /sitemap.xml: browsers that open the sitemap show this
 * table; search engines ignore it. /sitemap.html is the same list with page
 * titles, for browsers without XSLT support.
 */
const XSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/>
<title>Sitemap</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#f8fafc;color:#0f172a}
main{max-width:960px;margin:0 auto;padding:32px 16px}
h1{font-size:24px;margin:0 0 6px}
p{color:#475569;font-size:14px;margin:0 0 20px;line-height:1.5}
a{color:#2563eb;text-decoration:none;word-break:break-all}
a:hover{text-decoration:underline}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:8px;font-size:14px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top}
th{background:#f1f5f9;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#475569}
td.d{white-space:nowrap;color:#475569;width:120px}
@media (prefers-color-scheme:dark){body{background:#0f172a;color:#e2e8f0}p,td.d,th{color:#94a3b8}table{background:#111827;border-color:#1f2937}th{background:#1f2937}th,td{border-color:#1f2937}a{color:#60a5fa}}
</style></head>
<body><main>
<h1>Sitemap</h1>
<p>This file lists every public page of this website for search engines such as Google and Bing.
It has <strong><xsl:value-of select="count(s:urlset/s:url)"/></strong> addresses.
A version with page titles: <a href="/sitemap.html">sitemap.html</a>.</p>
<table><thead><tr><th>Address</th><th>Last updated</th></tr></thead><tbody>
<xsl:for-each select="s:urlset/s:url">
<tr><td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td><td class="d"><xsl:value-of select="substring(s:lastmod,1,10)"/></td></tr>
</xsl:for-each>
</tbody></table>
</main></body></html>
</xsl:template>
</xsl:stylesheet>
`;

export function GET() {
  return new Response(XSL, { headers: { "Content-Type": "text/xsl; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
