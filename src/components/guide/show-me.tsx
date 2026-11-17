"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/language-provider";
import { GUIDES, findTarget, type Guide } from "./guides";

const OPEN_EVENT = "pc:show-me";
const log = (guide: string, event: string, step?: number) => {
  void fetch("/api/guides", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ guide, event, step }) }).catch(() => undefined);
};

/** The top bar's "Show me" button. */
export function ShowMeButton() {
  const t = useT();
  return (
    <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))} data-guide="show-me">
      <CircleHelp className="h-4 w-4" /><span className="hidden sm:inline">{t("guide.button")}</span>
    </Button>
  );
}

/**
 * Show Me: dims the dashboard and spotlights the real button, one step at a
 * time, across pages. It only points; clicks stay blocked until it closes.
 * Offered once per person on first login, in a corner so it blocks nothing.
 */
export function ShowMe() {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/guides", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (live && d && !d.promptSeen) setPrompt(true);
    }).catch(() => undefined);
    return () => { live = false; };
  }, []);

  const openMenu = useCallback(() => {
    setGuides(GUIDES.filter((g) => !g.requires || document.querySelector(g.requires)));
    setMenu(true);
  }, []);
  useEffect(() => {
    window.addEventListener(OPEN_EVENT, openMenu);
    return () => window.removeEventListener(OPEN_EVENT, openMenu);
  }, [openMenu]);

  const dismissPrompt = () => { setPrompt(false); log("prompt", "prompt_seen"); };
  const start = (g: Guide) => { if (prompt) dismissPrompt(); setMenu(false); setStep(0); setGuide(g); log(g.id, "started"); };
  const close = (finished: boolean) => {
    if (guide) log(guide.id, finished ? "finished" : "closed", step);
    setGuide(null); setRect(null);
  };

  const current = guide?.steps[step];

  // Open the step's page, then keep the spotlight on the element: pages load and scroll.
  useEffect(() => {
    if (!current) return;
    const path = current.route?.split("?")[0];
    if (current.route && path !== pathname) router.push(current.route);
    let scrolled = false;
    const place = () => {
      const el = findTarget(current.target);
      if (el && !scrolled) { el.scrollIntoView({ block: "center", behavior: "smooth" }); scrolled = true; }
      setRect(el ? el.getBoundingClientRect() : null);
    };
    place();
    const id = setInterval(place, 300);
    return () => clearInterval(id);
  }, [current, pathname, router]);

  useEffect(() => {
    if (!guide) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const PAD = 6;
  const cardTop = rect ? (rect.bottom + 200 < window.innerHeight ? rect.bottom + PAD + 10 : Math.max(12, rect.top - 210)) : undefined;
  const cardLeft = rect ? Math.max(12, Math.min(rect.left, window.innerWidth - 352)) : undefined;

  return (
    <>
      {prompt && !guide && !menu && (
        <div className="fixed bottom-5 left-5 z-[9997] w-[320px] max-w-[calc(100vw-2.5rem)] rounded-xl border bg-card p-4 shadow-2xl" data-guide="show-me-prompt">
          <p className="font-semibold text-sm text-foreground">{t("guide.promptTitle")}</p>
          <p className="text-sm text-muted-foreground mt-1">{t("guide.promptBody")}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => { dismissPrompt(); openMenu(); }}>{t("guide.promptYes")}</Button>
            <Button size="sm" variant="ghost" onClick={dismissPrompt}>{t("guide.promptNo")}</Button>
          </div>
        </div>
      )}

      {menu && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={() => setMenu(false)}>
          <div className="bg-card border rounded-xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-foreground">{t("guide.menuTitle")}</p>
              <button onClick={() => setMenu(false)} aria-label={t("guide.close")} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{t("guide.menuHint")}</p>
            <div className="space-y-2">
              {guides.map((g) => (
                <button key={g.id} onClick={() => start(g)} className="w-full text-left rounded-lg border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">{t(g.title)}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {guide && current && (
        <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label={t(guide.title)}>
          {rect ? (
            <>
              <div className="absolute inset-0" />
              <div className="absolute rounded-lg ring-2 ring-primary transition-all duration-200 pointer-events-none"
                style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)" }} />
            </>
          ) : <div className="absolute inset-0 bg-black/60" />}
          <div className={`absolute w-[340px] max-w-[calc(100vw-1.5rem)] rounded-xl border bg-card p-4 shadow-2xl ${rect ? "" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"}`}
            style={rect ? { top: cardTop, left: cardLeft } : undefined}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm text-foreground">{t(current.title)}</p>
              <button onClick={() => close(false)} aria-label={t("guide.close")} className="text-muted-foreground hover:text-foreground shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{t(current.body)}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{t("guide.stepOf", { n: step + 1, total: guide.steps.length })}</span>
              <div className="flex gap-2">
                {step > 0 && <Button size="sm" variant="ghost" onClick={() => setStep(step - 1)}>{t("guide.back")}</Button>}
                {step < guide.steps.length - 1
                  ? <Button size="sm" onClick={() => setStep(step + 1)}>{t("guide.next")}</Button>
                  : <Button size="sm" onClick={() => close(true)}>{t("guide.done")}</Button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
