"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiCreditsBar } from "@/components/agent/ai-credits-bar";
import { CREDIT_COSTS } from "@/lib/ai/credit-costs";

type Row = { id: string; title: string; slug: string; status: string; type: string; versions: Record<string, string | null> };
type Data = { main: string; languages: { code: string; name: string }[]; pages: Row[] };
type Job = { pageId: string; lang: string };
type Kind = "pages" | "products";

/**
 * Translate many pages at once: tick pages and languages, then AI translates
 * them one by one (10 AI Credits each) with live progress. Each page
 * takes up to a minute, so it runs from the browser, page by page.
 */
export function BulkTranslate() {
  const [kind, setKind] = useState<Kind>("pages");
  const [d, setD] = useState<Data | null>(null);
  const [pick, setPick] = useState<Set<string>>(new Set());
  const [langs, setLangs] = useState<Set<string>>(new Set());
  const [missingOnly, setMissingOnly] = useState(true);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<Record<string, "ok" | "fail" | "run">>({});

  const load = useCallback(async () => {
    const raw = await fetch(kind === "products" ? "/api/products/translations" : "/api/pages/translations?all=1").then((r) => r.json()).catch(() => null) as (Data & { products?: Row[] }) | null;
    const j = raw ? ({ ...raw, pages: raw.products ?? raw.pages } as Data) : null;
    setD(j);
    setPick(new Set()); setDone({});
    if (j) {
      setLangs((prev) => (prev.size ? prev : new Set(j.languages.map((l) => l.code))));
      setPick((prev) => (prev.size ? prev : new Set(j.pages.filter((p) => p.status === "published" || p.status === "active").map((p) => p.id))));
    }
  }, [kind]);
  useEffect(() => { load(); }, [load]);

  const jobs = useMemo<Job[]>(() => {
    if (!d) return [];
    return d.pages.filter((p) => pick.has(p.id)).flatMap((p) =>
      [...langs].filter((l) => !missingOnly || !p.versions[l]).map((l) => ({ pageId: p.id, lang: l })));
  }, [d, pick, langs, missingOnly]);

  async function run() {
    if (!jobs.length) return;
    if (!confirm(`Translate ${jobs.length} ${kind === "products" ? "product" : "page"} version${jobs.length === 1 ? "" : "s"} with AI? This uses ${jobs.length * CREDIT_COSTS.translate} AI Credits and takes about ${Math.ceil(jobs.length * 0.8)} minute${jobs.length > 1 ? "s" : ""}. Keep this tab open.`)) return;
    setRunning(true);
    let ok = 0;
    for (const j of jobs) {
      const key = `${j.pageId}:${j.lang}`;
      setDone((s) => ({ ...s, [key]: "run" }));
      const res = await fetch(kind === "products" ? "/api/products/translations" : "/api/pages/translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kind === "products" ? { product_id: j.pageId, lang: j.lang } : { page_id: j.pageId, lang: j.lang, mode: "ai" }) }).catch(() => null);
      const body = res ? await res.json().catch(() => ({})) : {};
      if (res?.ok) { ok++; setDone((s) => ({ ...s, [key]: "ok" })); window.dispatchEvent(new Event("pc-ai-used")); }
      else {
        setDone((s) => ({ ...s, [key]: "fail" }));
        if (res?.status === 402) { toast.error(body.error ?? "Out of AI Credits"); break; }
      }
    }
    setRunning(false);
    toast.success(`${ok} of ${jobs.length} translated`);
    load();
  }

  if (!d) return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
  if (!d.languages.length) return <p className="text-sm text-muted-foreground">Add a language above first.</p>;
  const toggle = (set: Set<string>, v: string) => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); return n; };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {([["pages", "Pages and posts"], ["products", "Products"]] as const).map(([k, l]) => (
          <button key={k} type="button" disabled={running} onClick={() => setKind(k)}
            className={`rounded-full border px-3 py-1 text-sm ${kind === k ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>{l}</button>
        ))}
      </div>
      <AiCreditsBar className="max-w-xs" />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-muted-foreground">Into:</span>
        {d.languages.map((l) => (
          <label key={l.code} className="flex items-center gap-1.5"><input type="checkbox" checked={langs.has(l.code)} onChange={() => setLangs(toggle(langs, l.code))} disabled={running} /> {l.name}</label>
        ))}
        <label className="flex items-center gap-1.5 ml-auto"><input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} disabled={running} /> Only pages not translated yet</label>
      </div>
      <div className="rounded-lg border divide-y max-h-[420px] overflow-y-auto">
        <label className="flex items-center gap-2 p-2.5 text-xs font-medium bg-muted/40 sticky top-0">
          <input type="checkbox" checked={pick.size === d.pages.length} onChange={(e) => setPick(e.target.checked ? new Set(d.pages.map((p) => p.id)) : new Set())} disabled={running} />
          All {kind === "products" ? "products" : "pages"} ({d.pages.length})
        </label>
        {d.pages.map((p) => (
          <div key={p.id} className="flex items-center gap-2 p-2.5 text-sm">
            <input type="checkbox" checked={pick.has(p.id)} onChange={() => setPick(toggle(pick, p.id))} disabled={running} aria-label={p.title} />
            <div className="min-w-0 flex-1">
              <p className="truncate">{p.title} <span className="text-xs text-muted-foreground font-mono">{kind === "products" ? `/products/${p.slug}` : p.slug === "home" ? "/" : `/${p.slug}`}</span>{p.type === "post" && <span className="text-xs text-muted-foreground"> · post</span>}{p.status !== "published" && p.status !== "active" && <span className="text-xs text-muted-foreground"> · {p.status}</span>}</p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              {d.languages.map((l) => {
                const st = done[`${p.id}:${l.code}`];
                const has = p.versions[l.code];
                return (
                  <span key={l.code} title={l.name} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border ${has ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "text-muted-foreground"}`}>
                    {st === "run" ? <Loader2 className="w-3 h-3 animate-spin" /> : st === "ok" ? <CheckCircle2 className="w-3 h-3" /> : st === "fail" ? <XCircle className="w-3 h-3 text-destructive" /> : null}
                    {l.code.toUpperCase()}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Green = already translated. Edit any page&apos;s wording afterwards in <Link href="/dashboard/pages" className="underline">Pages</Link>; a single section can be fixed there too.</p>
        <Button onClick={run} disabled={running || !jobs.length}>
          {running ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {running ? "Translating…" : `Translate ${jobs.length} with AI`}
        </Button>
      </div>
    </div>
  );
}
