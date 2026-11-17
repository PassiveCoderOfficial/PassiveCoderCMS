"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Rule = { id: string; from_path: string; to_path: string | null; to_url: string | null; status_code: number; page_id: string | null; hits: number; note: string | null };
type PageRef = { id: string; title: string; slug: string };

/**
 * Redirects / short links. Full mode (Settings > Redirects): any address to a
 * page or any URL. Page mode (pageId set, in page settings): extra short
 * addresses that open this page. Both write the same table.
 */
export function RedirectsManager({ pageId }: { pageId?: string }) {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [pages, setPages] = useState<PageRef[]>([]);
  const [from, setFrom] = useState("");
  const [target, setTarget] = useState<string>(pageId ?? "");
  const [url, setUrl] = useState("");
  const [code, setCode] = useState<301 | 302>(301);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const j = await fetch(`/api/redirects${pageId ? `?page_id=${pageId}` : ""}`).then((r) => r.json()).catch(() => null);
    setRules(j?.rules ?? []); setPages(j?.pages ?? []);
  }, [pageId]);
  useEffect(() => { load(); }, [load]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const pageName = (r: Rule) => pages.find((p) => p.id === r.page_id)?.title ?? (r.to_path === "home" ? "Homepage" : `/${r.to_path}`);

  async function add() {
    setBusy(true);
    try {
      const external = !pageId && target === "url";
      const res = await fetch("/api/redirects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_path: from, page_id: external ? null : (pageId ?? target), to_url: external ? url : null, status_code: code }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed");
      if (j.warning) toast.warning(j.warning); else toast.success(`/${j.rule.from_path} now redirects`);
      setFrom(""); setUrl("");
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Remove this redirect?")) return;
    await fetch(`/api/redirects?id=${id}`, { method: "DELETE" });
    await load();
  }

  const canAdd = from.trim() && (pageId || (target === "url" ? url.trim() : target));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border bg-muted/40 pl-2 text-xs text-muted-foreground min-w-0 flex-1">
            <span className="shrink-0">{origin.replace(/^https?:\/\//, "")}/</span>
            <Input value={from} onChange={(e) => setFrom(e.target.value.replace(/^\/+/, ""))} placeholder="offer" className="h-8 border-0 bg-transparent text-xs text-foreground shadow-none focus-visible:ring-0" />
          </div>
          {!pageId && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          {!pageId && (
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="h-8 text-xs w-56"><SelectValue placeholder="Go to…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="url" className="text-xs">Another website / URL…</SelectItem>
                {pages.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.title} {p.slug === "home" ? "(/)" : `(/${p.slug})`}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        {!pageId && target === "url" && (
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" className="h-8 text-xs" />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={code === 302} onChange={(e) => setCode(e.target.checked ? 302 : 301)} />
            Temporary (use for campaigns that will change; leave off for permanent moves)
          </label>
          <Button size="sm" disabled={!canAdd || busy} onClick={add}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} {pageId ? "Add address" : "Add redirect"}
          </Button>
        </div>
      </div>

      {rules === null ? <p className="text-xs text-muted-foreground">Loading…</p>
        : rules.length === 0 ? <p className="text-xs text-muted-foreground">{pageId ? "No extra addresses yet. Add a short one like /offer to share in ads or on WhatsApp." : "No redirects yet."}</p>
        : (
          <div className="rounded-lg border divide-y">
            {rules.map((r) => (
              <div key={r.id} className="p-2.5 flex items-center gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-mono truncate">/{r.from_path} {!pageId && <><span className="text-muted-foreground">→</span> {r.to_url ?? pageName(r)}</>}</p>
                  <p className="text-muted-foreground">{r.status_code === 302 ? "Temporary" : "Permanent"} · used {r.hits ?? 0} times</p>
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Copy link"
                  onClick={() => { navigator.clipboard.writeText(`${origin}/${r.from_path}`); toast.success("Link copied"); }}><Copy className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Remove" onClick={() => remove(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
