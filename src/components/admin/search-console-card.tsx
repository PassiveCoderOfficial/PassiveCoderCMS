"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
type IndexState = { url: string; verdict: string; coverage: string; lastCrawl: string | null };
type Status = {
  googleConnected: boolean; email: string | null; scopesGranted: boolean; siteUrl: string | null;
  setUp: boolean; verifiedAt: string | null; sitemapAt: string | null; error: string | null;
  index: { at: string; pages: IndexState[] } | null;
  performance?: { range: { startDate: string; endDate: string }; total: Row | null; queries: Row[]; pages: Row[] };
  performanceError?: string;
};

const num = (n: number) => n.toLocaleString();
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString() : "never");

/**
 * One-click Google Search Console. Connecting Google (shared with Analytics)
 * verifies the site, adds it to Search Console and submits the sitemap; this
 * card then shows what people search to find the site and which pages
 * Google has indexed.
 */
export function SearchConsoleCard() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setS(await fetch("/api/seo/search-console").then((r) => r.json()).catch(() => null));
  }, []);
  useEffect(() => {
    load();
    if (new URLSearchParams(window.location.search).get("ga_connected")) toast.success("Google connected");
    const err = new URLSearchParams(window.location.search).get("ga_error");
    if (err) toast.error(`Google connection failed (${err})`);
  }, [load]);

  async function act(action: string, ok: string) {
    setBusy(action);
    try {
      const res = await fetch("/api/seo/search-console", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed");
      toast.success(ok);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); await load(); }
    finally { setBusy(null); }
  }

  const connect = <Button asChild><a href="/api/analytics/google/connect?return=seo">Connect Google</a></Button>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4" /> Google Search Console</CardTitle>
        <CardDescription>
          Connect once: we verify your site with Google, add it to Search Console and submit your sitemap. Then see what people search to find you and which pages Google has indexed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!s ? <p className="text-muted-foreground">Loading…</p>
          : !s.googleConnected ? (
            <div className="space-y-2">{connect}<p className="text-xs text-muted-foreground">Also connects Google Analytics. Use the Google account you want to own the site&apos;s Search Console.</p></div>
          ) : !s.scopesGranted ? (
            <div className="space-y-2">
              <p>Google is connected for Analytics ({s.email}), but not yet for Search Console.</p>
              <Button asChild><a href="/api/analytics/google/connect?return=seo">Connect Google again to add Search Console</a></Button>
            </div>
          ) : !s.setUp ? (
            <div className="space-y-2">
              {s.error && <p className="text-xs flex items-start gap-1.5 text-amber-700 dark:text-amber-400"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{s.error}</p>}
              <p>Ready to set up <strong>{s.siteUrl}</strong> with {s.email}.</p>
              <Button disabled={!!busy} onClick={() => act("setup", "Search Console set up and sitemap submitted")}>
                {busy === "setup" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Set up Search Console
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4 text-green-600" /> {s.siteUrl} is verified in Search Console</p>
                <p className="text-xs text-muted-foreground">Account: {s.email} · Sitemap submitted {day(s.sitemapAt)} (resubmitted daily when pages change)</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act("sitemap", "Sitemap submitted")}>
                    {busy === "sitemap" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Resubmit sitemap
                  </Button>
                  <Button size="sm" variant="outline" asChild><a href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(s.siteUrl ?? "")}`} target="_blank" rel="noopener noreferrer">Open in Google</a></Button>
                </div>
              </div>

              {s.performanceError && <p className="text-xs text-amber-700 dark:text-amber-400">{s.performanceError}</p>}
              {s.performance && (
                s.performance.total ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Google search, {s.performance.range.startDate} to {s.performance.range.endDate}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[["Clicks", num(s.performance.total.clicks)], ["Times shown", num(s.performance.total.impressions)],
                        ["Click rate", `${(s.performance.total.ctr * 100).toFixed(1)}%`], ["Avg. position", s.performance.total.position.toFixed(1)]].map(([l, v]) => (
                        <div key={l} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-semibold">{v}</p></div>
                      ))}
                    </div>
                    <Table title="What people searched" rows={s.performance.queries} />
                    <Table title="Top pages" rows={s.performance.pages} strip={s.siteUrl ?? ""} />
                  </div>
                ) : <p className="text-muted-foreground">No search data yet. New sites usually show data within a few days to two weeks.</p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">Pages in Google</p>
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act("inspect", "Index status checked")}>
                    {busy === "inspect" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} {s.index ? "Check again" : "Check my pages"}
                  </Button>
                </div>
                {s.index ? (
                  <div className="rounded-lg border divide-y">
                    {s.index.pages.map((p) => (
                      <div key={p.url} className="p-2.5 flex items-start gap-2">
                        {p.verdict === "PASS" ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> : <XCircle className={cn("w-4 h-4 mt-0.5 shrink-0", p.verdict === "ERROR" ? "text-muted-foreground" : "text-amber-600")} />}
                        <div className="min-w-0">
                          <p className="text-xs font-mono truncate">{p.url.replace(s.siteUrl ?? "", "/")}</p>
                          <p className="text-xs text-muted-foreground">{p.verdict === "PASS" ? "Indexed" : p.coverage || "Not indexed yet"}{p.lastCrawl ? ` · last visited ${day(p.lastCrawl)}` : ""}</p>
                        </div>
                      </div>
                    ))}
                    <p className="p-2.5 text-xs text-muted-foreground">Checked {day(s.index.at)}. Google can&apos;t be forced to index a page; good content, internal links and the sitemap get it there, usually within days.</p>
                  </div>
                ) : <p className="text-xs text-muted-foreground">See which of your pages Google has indexed and why any are missing.</p>}
              </div>
            </>
          )}
      </CardContent>
    </Card>
  );
}

function Table({ title, rows, strip }: { title: string; rows: Row[]; strip?: string }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-lg border">
      <div className="grid grid-cols-[1fr_64px_80px] gap-2 p-2.5 text-xs font-medium border-b"><span>{title}</span><span className="text-right">Clicks</span><span className="text-right">Shown</span></div>
      {rows.map((r) => (
        <div key={r.keys[0]} className="grid grid-cols-[1fr_64px_80px] gap-2 px-2.5 py-1.5 text-xs">
          <span className="truncate">{strip ? r.keys[0].replace(strip, "/") : r.keys[0]}</span>
          <span className="text-right">{num(r.clicks)}</span><span className="text-right">{num(r.impressions)}</span>
        </div>
      ))}
    </div>
  );
}
