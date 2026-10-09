"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Status = {
  configured: boolean; connected: boolean; siteUrl: string | null; setUp: boolean; sitemapAt: string | null; error: string | null;
  stats?: { totals: { clicks: number; impressions: number }; queries: { query: string; clicks: number; impressions: number }[] };
  statsError?: string;
};

/** One-click Bing Webmaster Tools: Bing feeds ChatGPT search and Copilot answers. */
export function BingCard() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => { setS(await fetch("/api/seo/bing").then((r) => r.json()).catch(() => null)); }, []);
  useEffect(() => {
    load();
    const q = new URLSearchParams(window.location.search);
    if (q.get("bing") === "connected") toast.success("Bing connected");
    else if (q.get("bing") === "error") toast.error(q.get("msg") ?? "Bing connection failed");
  }, [load]);

  async function act(action: string, ok: string) {
    setBusy(action);
    try {
      const res = await fetch("/api/seo/bing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed");
      toast.success(ok);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); await load(); }
  }

  const connect = <Button asChild><a href="/api/seo/bing/connect">Connect Bing</a></Button>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4" /> Bing Webmaster Tools</CardTitle>
        <CardDescription>ChatGPT search and Copilot answer from Bing. Connect once: we add and verify your site with Bing and submit your sitemap.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!s ? <p className="text-muted-foreground">Loading…</p>
          : !s.configured ? <p className="text-muted-foreground">Bing connection isn&apos;t available yet.</p>
          : !s.connected ? (
            <div className="space-y-2">{connect}<p className="text-xs text-muted-foreground">Sign in with a Microsoft account, or use Bing&apos;s &ldquo;Sign in with Google&rdquo;.</p></div>
          ) : !s.setUp ? (
            <div className="space-y-2">
              {s.error && <p className="text-xs flex items-start gap-1.5 text-amber-700 dark:text-amber-400"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{s.error}</p>}
              <p>Ready to add <strong>{s.siteUrl}</strong> to Bing.</p>
              <div className="flex gap-2">
                <Button disabled={!!busy} onClick={() => act("setup", "Bing set up and sitemap submitted")}>
                  {busy === "setup" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} {s.error ? "Retry" : "Set up Bing"}
                </Button>
                <Button variant="ghost" disabled={!!busy} onClick={() => act("disconnect", "Bing disconnected")}>Disconnect</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4 text-green-600" /> {s.siteUrl} is verified in Bing</p>
                <p className="text-xs text-muted-foreground">Sitemap submitted {s.sitemapAt ? new Date(s.sitemapAt).toLocaleDateString() : "never"} (resubmitted daily when pages change)</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act("sitemap", "Sitemap submitted to Bing")}>
                    {busy === "sitemap" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Resubmit sitemap
                  </Button>
                  <Button size="sm" variant="outline" asChild><a href="https://www.bing.com/webmasters" target="_blank" rel="noopener noreferrer">Open in Bing</a></Button>
                  <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => act("disconnect", "Bing disconnected")}>Disconnect</Button>
                </div>
              </div>
              {s.statsError && <p className="text-xs text-amber-700 dark:text-amber-400">{s.statsError}</p>}
              {s.stats && (s.stats.totals.impressions > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Bing search, last 28 days: {s.stats.totals.clicks.toLocaleString()} clicks, shown {s.stats.totals.impressions.toLocaleString()} times</p>
                  {s.stats.queries.length > 0 && (
                    <div className="rounded-lg border">
                      <div className="grid grid-cols-[1fr_64px_80px] gap-2 p-2.5 text-xs font-medium border-b"><span>What people searched</span><span className="text-right">Clicks</span><span className="text-right">Shown</span></div>
                      {s.stats.queries.map((q) => (
                        <div key={q.query} className="grid grid-cols-[1fr_64px_80px] gap-2 px-2.5 py-1.5 text-xs"><span className="truncate">{q.query}</span><span className="text-right">{q.clicks}</span><span className="text-right">{q.impressions}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              ) : <p className="text-muted-foreground">No Bing search data yet. It usually appears within a few days to two weeks.</p>)}
            </>
          )}
      </CardContent>
    </Card>
  );
}
