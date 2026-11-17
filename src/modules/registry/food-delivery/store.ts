/** Open edition: no food delivery module, so no site is an installable restaurant app. */
export type InstallableSite = { name: string; shortName: string; color: string; logo: string | null; lang: "bn" | "en" };

export async function installableSite(_tenantId: string | null): Promise<InstallableSite | null> {
  return null;
}

/** Web app manifest for an installable site (unused while installableSite is always null). */
export function siteManifest(site: InstallableSite) {
  return {
    id: "/",
    name: site.name,
    short_name: site.shortName,
    lang: site.lang,
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone" as const,
    background_color: "#ffffff",
    theme_color: site.color,
    categories: ["shopping"],
    icons: [
      { src: "/site-icon/192", sizes: "192x192", type: "image/png", purpose: "any" as const },
      { src: "/site-icon/512", sizes: "512x512", type: "image/png", purpose: "any" as const },
      { src: "/site-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" as const },
    ],
  };
}
