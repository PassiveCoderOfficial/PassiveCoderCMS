import { headers } from "next/headers";
import { installableSite, siteManifest } from "@/modules/registry/food-delivery/store";

/** Same manifest as /manifest.webmanifest on a programme restaurant's site (kept as a stable alias). */
export async function GET() {
  const site = await installableSite((await headers()).get("x-tenant-id"));
  if (!site) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(siteManifest(site)), { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
