"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Copy, ExternalLink, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Row = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
type IndexState = { url: string; title?: string; kind?: string; verdict: string; coverage: string; lastCrawl: string | null; checkedAt?: string };
type Status = {
  googleConnected: boolean; email: string | null; scopesGranted: boolean; siteUrl: string | null;
  setUp: boolean; verifiedAt: string | null; sitemapAt: string | null; error: string | null;
  index: { at: string; total?: number; pages: IndexState[] } | null;
  performance?: { range: { startDate: string; endDate: string }; total: Row | null; queries: Row[]; pages: Row[] };
  performanceError?: string;
  managed?: boolean; platformReady?: boolean;
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

  async function act(action: string, ok: string, extra: Record<string, string> = {}) {
    setBusy(action);
    try {
      const res = await fetch("/api/seo/search-console", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Failed");
      toast.success(ok);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); await load(); }
    finally { setBusy(null); }
  }


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
          : !s.setUp && (!s.googleConnected || !s.scopesGranted) ? (
            <div className="space-y-3">
              {s.error && <p className="text-xs flex items-start gap-1.5 text-amber-700 dark:text-amber-400"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{s.error}</p>}
              {s.platformReady && (
                <div className="space-y-2">
                  <Button disabled={!!busy} onClick={() => act("setup", "Search Console set up and sitemap submitted", { via: "platform" })}>
                    {busy === "setup" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Let Passive Coder set it up
                  </Button>
                  <p className="text-xs text-muted-foreground">No Google account needed: we verify {s.siteUrl} with Google, submit your sitemap and check your pages every day.</p>
                </div>
              )}
              <div className="space-y-2">
                {s.googleConnected && !s.scopesGranted && <p>Google is connected for Analytics ({s.email}), but not yet for Search Console.</p>}
                <Button variant={s.platformReady ? "outline" : "default"} asChild><a href="/api/analytics/google/connect?return=seo">{s.googleConnected ? "Connect Google again to add Search Console" : "Use my own Google account"}</a></Button>
                <p className="text-xs text-muted-foreground">Your own Google account also connects Google Analytics and gives you Search Console in your Google login.</p>
              </div>
            </div>
          ) : !s.setUp ? (
            <div className="space-y-2">
              {s.error && <p className="text-xs flex items-start gap-1.5 text-amber-700 dark:text-amber-400"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />{s.error}</p>}
              <p>Ready to set up <strong>{s.siteUrl}</strong> with {s.email}.</p>
              <Button disabled={!!busy} onClick={() => act("setup", "Search Console set up and sitemap submitted", { via: "owner" })}>
                {busy === "setup" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Set up Search Console
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-3 space-y-1">
                <p className="flex items-center gap-2 font-medium"><CheckCircle2 className="w-4 h-4 text-green-600" /> {s.siteUrl} is verified in Search Console</p>
                <p className="text-xs text-muted-foreground">Account: {s.managed ? "Passive Coder (managed for you)" : s.email} · Sitemap submitted {day(s.sitemapAt)} (resubmitted daily when pages change)</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => act("sitemap", "Sitemap submitted")}>
                    {busy === "sitemap" ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Resubmit sitemap
                  </Button>
                  {!s.managed && <Button size="sm" variant="outline" asChild><a href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(s.siteUrl ?? "")}`} target="_blank" rel="noopener noreferrer">Open in Google</a></Button>}
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

              <IndexPanel s={s} busy={busy} onCheck={() => act("inspect", "Pages checked")} />
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

/** Google's page for one URL, where the owner clicks "Request indexing". */
const inspectLink = (siteUrl: string, url: string) =>
  `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(siteUrl)}&id=${encodeURIComponent(url)}`;

/** Google's coverage states in plain words. */
function reason(p: IndexState) {
  if (p.verdict === "PASS") return "In Google";
  if (p.verdict === "ERROR") return `Couldn't check: ${p.coverage}`;
  const c = p.coverage.toLowerCase();
  if (c.includes("unknown")) return "Google hasn't found this page yet";
  if (c.includes("discovered")) return "Google knows about it but hasn't visited yet";
  if (c.includes("crawled")) return "Google visited but hasn't listed it yet (often too short, or too similar to another page)";
  if (c.includes("redirect")) return "Redirects to another address";
  if (c.includes("noindex") || c.includes("excluded by")) return "Hidden from search engines on purpose";
  if (c.includes("duplicate") || c.includes("canonical")) return "Google treats it as a copy of another page";
  if (c.includes("404") || c.includes("not found")) return "Google got 'page not found'";
  return p.coverage || "Not in Google yet";
}

type Filter = "missing" | "indexed" | "all";

function IndexPanel({ s, busy, onCheck }: { s: Status; busy: string | null; onCheck: () => void }) {
  const [filter, setFilter] = useState<Filter>("missing");
  const site = s.siteUrl ?? "";
  const pages = s.index?.pages ?? [];
  const indexed = pages.filter((p) => p.verdict === "PASS");
  const missing = pages.filter((p) => p.verdict !== "PASS");
  const total = s.index?.total ?? pages.length;
  const unchecked = Math.max(0, total - pages.length);
  const shown = filter === "missing" ? missing : filter === "indexed" ? indexed : pages;

  async function copy(urls: string[], what: string) {
    try { await navigator.clipboard.writeText(urls.join("\n")); toast.success(`${urls.length} ${what} copied`); }
    catch { toast.error("Couldn't copy"); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">Pages in Google</p>
        <Button size="sm" variant="outline" disabled={!!busy} onClick={onCheck}>
          {busy === "inspect" && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} {s.index ? "Check again" : "Check my pages"}
        </Button>
      </div>
      {!s.index ? (
        <p className="text-xs text-muted-foreground">Checks every page in your sitemap with Google and lists the ones that aren&apos;t in Google yet, with a button to ask Google for each.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {([["missing", "Not in Google", missing.length, "text-amber-600"], ["indexed", "In Google", indexed.length, "text-green-600"], ["all", "Checked", `${pages.length}/${total}`, ""]] as const).map(([k, l, v, c]) => (
              <button key={k} type="button" onClick={() => setFilter(k)} className={cn("rounded-lg border p-3 text-left transition-colors", filter === k ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                <p className="text-xs text-muted-foreground">{l}</p><p className={cn("text-lg font-semibold", c)}>{v}</p>
              </button>
            ))}
          </div>
          {unchecked > 0 && <p className="text-xs text-muted-foreground">{unchecked} pages not checked yet. Google allows about 100 checks per click; click again for the next batch (pages are also checked automatically every day).</p>}
          {filter === "missing" && missing.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-xs">
              <p><strong>Ask Google to add a page:</strong> click <em>Request in Google</em>, wait for Google&apos;s check, then click <strong>REQUEST INDEXING</strong>. Google allows about 10 requests a day, so start with your most important pages.{s.managed ? " These open Passive Coder's Search Console; if you can't open them, send us the copied links and we request them for you." : ""}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => copy(missing.slice(0, 10).map((p) => p.url), "links")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy first 10 links</Button>
                <Button size="sm" variant="outline" onClick={() => copy(missing.map((p) => p.url), "links")}><Copy className="w-3.5 h-3.5 mr-1" /> Copy all {missing.length}</Button>
              </div>
            </div>
          )}
          <div className="rounded-lg border divide-y max-h-[560px] overflow-y-auto">
            {shown.length === 0 && <p className="p-3 text-xs text-muted-foreground">{filter === "missing" ? "Every checked page is in Google." : "Nothing here yet."}</p>}
            {shown.map((p) => (
              <div key={p.url} className="p-2.5 flex items-start gap-2">
                {p.verdict === "PASS" ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> : <XCircle className={cn("w-4 h-4 mt-0.5 shrink-0", p.verdict === "ERROR" ? "text-muted-foreground" : "text-amber-600")} />}
                <div className="min-w-0 flex-1">
                  {p.title && <p className="text-xs font-medium truncate">{p.title}</p>}
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono truncate block text-muted-foreground hover:underline">{p.url.replace(site.replace(/\/$/, ""), "") || "/"}</a>
                  <p className="text-xs text-muted-foreground">{reason(p)}{p.lastCrawl ? ` · Google last visited ${day(p.lastCrawl)}` : ""}</p>
                </div>
                {p.verdict !== "PASS" && site && (
                  <Button size="sm" variant="outline" className="shrink-0 h-7 px-2 text-xs" asChild>
                    <a href={inspectLink(site, p.url)} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 mr-1" /> Request in Google</a>
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Last checked {day(s.index.at)}. Google decides what to list; a sitemap, links from other pages and useful content get pages in, usually within days to a few weeks.</p>
        </>
      )}
    </div>
  );
}
