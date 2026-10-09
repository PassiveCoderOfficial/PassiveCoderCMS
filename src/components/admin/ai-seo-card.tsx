"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Cur = { title: string | null; description: string | null };
type Row = { key: string; label: string; path: string; title: string; description: string; current: Cur; on: boolean };

/**
 * One click writes search titles and descriptions for the whole site, shown
 * for review before saving. Rows the owner already wrote start unticked so
 * their own text is never replaced by accident.
 */
export function AiSeoCard({ onSaved }: { onSaved?: () => void }) {
  const [free, setFree] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"gen" | "save" | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => { fetch("/api/seo/ai").then((r) => r.json()).then((j) => setFree(!!j.freeAvailable)).catch(() => setFree(null)); }, []);

  async function call(body: Record<string, unknown>) {
    const res = await fetch("/api/seo/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error ?? "Failed");
    return j;
  }

  async function generate() {
    setBusy("gen");
    try {
      const p = await call({ action: "propose" });
      const fresh = (c: Cur) => !c.title && !c.description;
      setRows([
        { key: "site", label: "Whole site (homepage default)", path: "/", title: p.site.title, description: p.site.description, current: p.site.current, on: fresh(p.site.current) },
        ...p.pages.map((x: { id: string; name: string; path: string; title: string; description: string; current: Cur }) =>
          ({ key: x.id, label: x.name, path: x.path, title: x.title, description: x.description, current: x.current, on: fresh(x.current) })),
      ]);
      setFree(false);
      toast.success(p.charged ? "Generated (1 AiCoder generation used)" : "Generated (free)");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }

  async function save() {
    if (!rows) return;
    const on = rows.filter((r) => r.on);
    setBusy("save");
    try {
      const site = on.find((r) => r.key === "site");
      const r = await call({
        action: "apply",
        site: site ? { title: site.title, description: site.description } : null,
        pages: on.filter((r) => r.key !== "site").map((r) => ({ id: r.key, title: r.title, description: r.description })),
      });
      toast.success(`Saved ${r.saved} item${r.saved === 1 ? "" : "s"}`);
      setRows(null);
      onSaved?.();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }

  const set = (key: string, patch: Partial<Row>) => setRows((rs) => rs?.map((r) => (r.key === key ? { ...r, ...patch } : r)) ?? null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4" /> Write SEO with AI</CardTitle>
        <CardDescription>
          Writes a search title and description for your site and every page, from your business profile and the text on each page. You review before anything is saved.
          Pages left empty already get automatic ones from their first paragraph.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!rows && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={generate} disabled={!!busy}>
              {busy === "gen" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />} Generate SEO for all pages
            </Button>
            {free !== null && <span className="text-xs text-muted-foreground">{free ? "First run on this site is free." : "Uses 1 AiCoder generation."}</span>}
          </div>
        )}
        {rows && (
          <>
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.key} className="rounded-lg border p-3 space-y-2">
                  <label className="flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-1" checked={r.on} onChange={(e) => set(r.key, { on: e.target.checked })} />
                    <span><span className="font-medium">{r.label}</span> <span className="text-xs text-muted-foreground font-mono">{r.path}</span>
                      {(r.current.title || r.current.description) && <span className="block text-xs text-amber-700 dark:text-amber-400">Already has your own text; tick to replace it.</span>}
                    </span>
                  </label>
                  <div className="pl-6 space-y-1.5">
                    <Input value={r.title} onChange={(e) => set(r.key, { title: e.target.value })} aria-label="Search title" />
                    <p className="text-[11px] text-muted-foreground">{r.title.length}/60 characters</p>
                    <Textarea rows={2} value={r.description} onChange={(e) => set(r.key, { description: e.target.value })} aria-label="Search description" />
                    <p className="text-[11px] text-muted-foreground">{r.description.length}/155 characters</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={!!busy || !rows.some((r) => r.on)}>
                {busy === "save" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Save ticked ({rows.filter((r) => r.on).length})
              </Button>
              <Button variant="outline" onClick={() => setRows(null)} disabled={!!busy}>Discard</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
