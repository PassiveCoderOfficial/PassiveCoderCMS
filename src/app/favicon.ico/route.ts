import { NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { resolveSiteMetadata } from "@/lib/site/site-metadata";
import { ROOT_TENANT_SLUG } from "@/lib/flags";

/**
 * /favicon.ico per host. Google and browsers fetch this exact path whatever
 * the page's <link rel="icon"> says, so a static public/favicon.ico showed
 * Passive Coder's icon next to every client site in search results. Client
 * hosts get their own favicon (uploaded, or the auto letter badge); the
 * platform's own hosts keep the Passive Coder icon.
 */
const CACHE = "public, max-age=86400, s-maxage=86400";

export async function GET(req: Request) {
  const host = req.headers.get("host") ?? "";
  const tenant = await resolveTenant(host).catch(() => null);
  if (tenant && tenant.slug !== ROOT_TENANT_SLUG) {
    const { faviconUrl } = await resolveSiteMetadata(tenant.id);
    const data = faviconUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (data) return new NextResponse(Buffer.from(data[2], "base64"), { headers: { "Content-Type": data[1], "Cache-Control": CACHE } });
    if (/^https?:\/\//.test(faviconUrl)) {
      const r = await fetch(faviconUrl).catch(() => null);
      if (r?.ok) return new NextResponse(await r.arrayBuffer(), { headers: { "Content-Type": r.headers.get("content-type") ?? "image/png", "Cache-Control": CACHE } });
      return NextResponse.redirect(faviconUrl, 302);
    }
  }
  // Static file in public/ (not bundled into this function), so point at it.
  return NextResponse.redirect(new URL("/branding/passivecoder-favicon.ico", req.url), 302);
}
