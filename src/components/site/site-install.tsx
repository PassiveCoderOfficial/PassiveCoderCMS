"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const LABEL = { bn: "অ্যাপ ইনস্টল করুন", en: "Install app" };
const HIDE_KEY = "pc_install_hidden";

/**
 * Installable restaurant site (food delivery phase 7): registers the site's
 * own service worker and shows a small "Install app" chip when the browser
 * offers installation. Hidden for 14 days after the visitor closes it.
 */
export function SiteInstall({ lang, color }: { lang: "bn" | "en"; color: string }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/site-sw.js", { scope: "/" }).catch(() => {});
    const hiddenUntil = Number(localStorage.getItem(HIDE_KEY) ?? 0);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (Date.now() > hiddenUntil) setEvt(e as InstallEvent);
    };
    const onInstalled = () => setEvt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (!evt) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-1 rounded-full shadow-lg text-white text-sm font-semibold" style={{ background: color }} data-site-install>
      <button type="button" className="flex items-center gap-1.5 pl-4 pr-2 py-2.5" onClick={async () => { await evt.prompt(); await evt.userChoice.catch(() => null); setEvt(null); }}>
        <Download className="h-4 w-4" /> {LABEL[lang]}
      </button>
      <button type="button" aria-label="Close" className="pr-3 pl-1 py-2.5 opacity-80 hover:opacity-100"
        onClick={() => { localStorage.setItem(HIDE_KEY, String(Date.now() + 14 * 864e5)); setEvt(null); }}>
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
