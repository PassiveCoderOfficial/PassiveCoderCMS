import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { installableSite, siteManifest } from "@/modules/registry/food-delivery/store";

/**
 * /manifest.webmanifest for every host the proxy hands to the app (the hubs
 * have their own). A food programme restaurant's own site gets its store
 * manifest, so it installs like an app (food delivery phase 7); everything
 * else gets the dashboard app. This file-based manifest wins over any
 * layout's `manifest` metadata, which is why the choice is made here.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await installableSite((await headers()).get("x-tenant-id"));
  if (site) return siteManifest(site);
  return {
    name: "Passive Coder",
    short_name: "PassiveCoder",
    description: "Your website, CRM, bookings, invoices and sales — in one dashboard.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#4f46e5",
    icons: [
      { src: "/pwa-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-180.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
