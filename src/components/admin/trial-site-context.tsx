"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * True in the dashboard of a site that is still on the free trial
 * (lib/sites/trial-site.ts, decided on the server in the dashboard layout).
 * The builder uses it to draw the site's HTML sanitised, and the domain and
 * custom-code screens show a short notice.
 */
const TrialSiteContext = createContext(false);

export function TrialSiteProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <TrialSiteContext.Provider value={value}>{children}</TrialSiteContext.Provider>;
}

export const useTrialSite = () => useContext(TrialSiteContext);

type Sanitizer = typeof import("@/lib/security/trial-html");
let loaded: Sanitizer | null = null;
let loading: Promise<Sanitizer> | null = null;

/**
 * The trial sanitiser, loaded only when the site is on trial (it carries an
 * HTML parser no paid site's builder needs). `ready` is false while it is
 * loading: callers draw nothing until then, never the raw HTML.
 */
export function useTrialSanitizer(): { trial: boolean; ready: boolean; lib: Sanitizer | null } {
  const trial = useTrialSite();
  const [lib, setLib] = useState<Sanitizer | null>(trial ? loaded : null);
  useEffect(() => {
    if (!trial || lib) return;
    let live = true;
    loading ??= import("@/lib/security/trial-html").then((m) => (loaded = m));
    loading.then((m) => { if (live) setLib(m); }, () => { loading = null; });
    return () => { live = false; };
  }, [trial, lib]);
  return { trial, ready: !trial || !!lib, lib: trial ? lib : null };
}
