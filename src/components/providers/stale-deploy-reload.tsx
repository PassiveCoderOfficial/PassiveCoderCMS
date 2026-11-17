"use client";

import { useEffect } from "react";

const KEY = "pc-stale-reload-at";
const STALE = /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

/**
 * A tab opened before a deploy still runs the old build. Clicking a link then
 * asks for script files that the new deploy replaced, the navigation dies and
 * Next shows its bare "This page couldn't load" (a manual reload always fixed
 * it). Catch exactly that failure and do the reload for the visitor, once per
 * 30s so a real outage never turns into a reload loop.
 */
export function StaleDeployReload() {
  useEffect(() => {
    const recover = (message: string) => {
      if (!STALE.test(message)) return;
      let last = 0;
      try { last = Number(sessionStorage.getItem(KEY) ?? 0); } catch {}
      if (Date.now() - last < 30_000) return;
      try { sessionStorage.setItem(KEY, String(Date.now())); } catch {}
      window.location.reload();
    };
    const onError = (e: ErrorEvent) => recover(`${e.error?.name ?? ""} ${e.message ?? ""}`);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { name?: string; message?: string } | undefined;
      recover(`${r?.name ?? ""} ${r?.message ?? String(e.reason ?? "")}`);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
