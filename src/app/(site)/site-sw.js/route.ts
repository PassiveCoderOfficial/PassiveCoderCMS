import { headers } from "next/headers";
import { installableSite } from "@/modules/registry/food-delivery/store";

/**
 * Service worker for an installable restaurant site (copy of the experts
 * pattern): network first, an offline note when there is no connection.
 * API calls and other requests are not touched.
 */
const SW = `
const CACHE = "site-v1";
const OFFLINE_HTML = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:system-ui;padding:40px;text-align:center"><h2>No internet</h2><p>Check your connection and try again.</p><p>ইন্টারনেট নেই। কানেকশন দেখে আবার চেষ্টা করুন।</p></body>';
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("site-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || req.mode !== "navigate") return;
  e.respondWith(fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
`;

export async function GET() {
  const site = await installableSite((await headers()).get("x-tenant-id"));
  if (!site) return new Response("Not found", { status: 404 });
  return new Response(SW, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache", "Service-Worker-Allowed": "/" } });
}
