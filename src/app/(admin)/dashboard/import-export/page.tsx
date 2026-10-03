"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Download, FileUp, Globe, Loader2, CheckCircle2, AlertTriangle, Package, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactsFromCsv, itemsFromSiteJson, parseWxr, type ImportItem } from "@/lib/import/parse";

type Results = { created: number; skipped: number; failed: number; media: number; errors: string[] };
type Job = { id: string; source: string; source_label: string | null; status: string; cursor: number; total: number; results: Results; created_at: string };
type Progress = { label: string; cursor: number; total: number; results?: Results; done: boolean };

const EXPORTS: { type: string; label: string }[] = [
  { type: "pages", label: "Pages" },
  { type: "posts", label: "Blog posts" },
  { type: "products", label: "Products" },
  { type: "orders", label: "Orders" },
  { type: "contacts", label: "Contacts" },
  { type: "bookings", label: "Bookings" },
];

const SOURCE_LABEL: Record<string, string> = {
  wxr: "WordPress export file", wp_url: "WordPress site", wp_plugin: "Migration plugin",
  csv_contacts: "Contacts CSV", site_json: "Passive Coder site file",
};

const CHUNK_BYTES = 2_500_000; // stays well under the 4.5 MB request limit

async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined ? undefined : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

export default function ImportExportPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [wpUrl, setWpUrl] = useState("");
  const [migKey, setMigKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const wxrRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const loadJobs = useCallback(async () => {
    try { setJobs((await api<{ jobs: Job[] }>("/api/import/jobs")).jobs); } catch { /* list is optional */ }
  }, []);
  useEffect(() => { loadJobs(); }, [loadJobs]);

  /** Create the job, upload parsed items in chunks, then process it step by step. */
  async function run(label: string, start: Record<string, unknown>, items?: ImportItem[]) {
    setBusy(true);
    setProgress({ label, cursor: 0, total: items?.length ?? 0, done: false });
    try {
      const job = await api<{ id: string; total: number }>("/api/import/jobs", start);
      let total = job.total;
      if (items?.length) {
        let chunk: ImportItem[] = [], size = 0;
        const flush = async () => { if (chunk.length) total = (await api<{ total: number }>(`/api/import/jobs/${job.id}/items`, { items: chunk })).total; chunk = []; size = 0; };
        for (const it of items) {
          const n = JSON.stringify(it).length;
          if (size + n > CHUNK_BYTES) await flush();
          chunk.push(it); size += n;
        }
        await flush();
      }
      if (!total) throw new Error("Nothing to import was found in that file.");
      await steps(label, job.id, total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
      setProgress(null);
    } finally {
      setBusy(false);
      loadJobs();
    }
  }

  async function steps(label: string, id: string, total: number) {
      setProgress({ label, cursor: 0, total, done: false });
      for (;;) {
        const r = await api<{ status: string; cursor: number; total: number; results: Results }>(`/api/import/jobs/${id}/step`, {});
        setProgress({ label, cursor: r.cursor, total: r.total, results: r.results, done: r.status === "done" });
        if (r.status === "done") { toast.success(`Import finished: ${r.results.created} added`); break; }
      }
  }

  async function resume(j: Job) {
    setBusy(true);
    try { await steps(SOURCE_LABEL[j.source] ?? "Import", j.id, j.total); }
    catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
      setProgress(null);
    } finally {
      setBusy(false);
      loadJobs();
    }
  }

  async function readFile(input: HTMLInputElement | null): Promise<{ name: string; text: string } | null> {
    const f = input?.files?.[0];
    if (input) input.value = "";
    if (!f) return null;
    if (f.size > 200 * 1024 * 1024) { toast.error("That file is larger than 200 MB."); return null; }
    return { name: f.name, text: await f.text() };
  }

  async function onWxr() {
    const f = await readFile(wxrRef.current); if (!f) return;
    try {
      const { items, site } = parseWxr(f.text);
      if (!items.length) { toast.error("No pages, posts or products found in that file."); return; }
      run(`WordPress file ${f.name}`, { source: "wxr", source_label: site ?? f.name }, items);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't read that file."); }
  }
  async function onCsv() {
    const f = await readFile(csvRef.current); if (!f) return;
    const items = contactsFromCsv(f.text);
    if (!items.length) { toast.error("No contacts with an email or phone number found. Check the file has a header row."); return; }
    run(`Contacts ${f.name}`, { source: "csv_contacts", source_label: f.name }, items);
  }
  async function onJson() {
    const f = await readFile(jsonRef.current); if (!f) return;
    try { run(`Site file ${f.name}`, { source: "site_json", source_label: f.name }, itemsFromSiteJson(JSON.parse(f.text))); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't read that file."); }
  }

  async function createKey() {
    try {
      const r = await api<{ token: string; scope: string }>("/api/mcp-tokens", { name: "WordPress migration", scope: "write" });
      if (r.scope !== "write") { toast.error("Your role can't import content on this site. Ask the site owner."); return; }
      setMigKey(r.token);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Couldn't create a key"); }
  }

  const pct = progress && progress.total ? Math.round((progress.cursor / progress.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ArrowLeftRight className="w-6 h-6" /> Import / Export</h1>
        <p className="text-sm text-muted-foreground mt-1">Move your content in from WordPress or other tools, and download your data any time.</p>
      </div>

      {progress && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium flex items-center gap-2">
                {progress.done ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                {progress.label}
              </span>
              <span className="text-muted-foreground">{progress.cursor} / {progress.total || "?"}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progress.done ? 100 : pct}%` }} /></div>
            {progress.results && (
              <p className="text-xs text-muted-foreground">
                {progress.results.created} added, {progress.results.skipped} skipped (already there), {progress.results.failed} failed, {progress.results.media} images copied
              </p>
            )}
            {progress.done && (
              <p className="text-sm">
                Imported pages and posts are saved as <strong>drafts</strong> so you can review them first.{" "}
                <Link href="/dashboard/pages?status=draft" className="text-primary underline">Review pages</Link>
              </p>
            )}
            {!progress.done && <p className="text-xs text-muted-foreground">Keep this tab open. Large sites can take several minutes; if you close it, use Resume under Recent imports to carry on.</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Import from WordPress</CardTitle>
          <CardDescription>
            Pages, blog posts and WooCommerce products come across with their images, SEO titles and descriptions.
            Old links redirect to the new pages automatically, so search rankings carry over.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-medium">Option 1: Site address</p>
            <p className="text-xs text-muted-foreground">Reads the site&apos;s public content. Works for most WordPress sites; private drafts aren&apos;t included.</p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (wpUrl.trim()) run(`WordPress site ${wpUrl.trim()}`, { source: "wp_url", url: wpUrl.trim() }); }}>
              <Input placeholder="https://your-wordpress-site.com" value={wpUrl} onChange={(e) => setWpUrl(e.target.value)} disabled={busy} />
              <Button type="submit" disabled={busy || !wpUrl.trim()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}</Button>
            </form>
          </div>
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Option 2: Passive Coder Migration plugin <span className="text-xs font-normal text-muted-foreground">(most complete)</span></p>
            <p className="text-xs text-muted-foreground">
              Install the plugin on your WordPress site to bring everything over, including drafts, page-builder layouts (Elementor, Divi, WPBakery) and WooCommerce customers.
              In WordPress: Plugins &gt; Add New &gt; Upload Plugin, then Tools &gt; Passive Coder Migration and paste your key.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild><a href="/downloads/passive-coder-migration.zip" download><Download className="w-4 h-4 mr-2" /> Download plugin</a></Button>
              <Button variant="outline" onClick={createKey} disabled={busy}><KeyRound className="w-4 h-4 mr-2" /> Create migration key</Button>
            </div>
            {migKey && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <p className="text-xs">Copy this key now; it won&apos;t be shown again. You can revoke it any time under <Link href="/dashboard/ai-connect" className="underline">AI Connect</Link>.</p>
                <div className="flex gap-2">
                  <Input readOnly value={migKey} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                  <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(migKey); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Imports from the plugin show up under Recent imports below.</p>
              </div>
            )}
          </div>
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Option 3: WordPress export file</p>
            <p className="text-xs text-muted-foreground">In WordPress go to Tools &gt; Export, choose All content, and upload the .xml file here. Includes drafts.</p>
            <input ref={wxrRef} type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={onWxr} />
            <Button variant="outline" disabled={busy} onClick={() => wxrRef.current?.click()}><FileUp className="w-4 h-4 mr-2" /> Upload .xml file</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileUp className="w-5 h-5" /> Import other data</CardTitle>
          <CardDescription>Contacts already on your site (same email or phone) are skipped, never duplicated.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Contacts (CSV)</p>
            <p className="text-xs text-muted-foreground">From Excel, Google Contacts, Mailchimp or HubSpot. Needs a header row with email or phone.</p>
            <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onCsv} />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => csvRef.current?.click()}>Upload CSV</Button>
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Products (CSV)</p>
            <p className="text-xs text-muted-foreground">Bulk add products with prices, stock and images from a spreadsheet.</p>
            <Button size="sm" variant="outline" asChild><Link href="/dashboard/ecommerce/products/bulk-upload">Open bulk upload</Link></Button>
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-medium">Passive Coder site file</p>
            <p className="text-xs text-muted-foreground">A full-site export (JSON) from another Passive Coder site: pages, posts, products, contacts.</p>
            <input ref={jsonRef} type="file" accept=".json,application/json" className="hidden" onChange={onJson} />
            <Button size="sm" variant="outline" disabled={busy} onClick={() => jsonRef.current?.click()}>Upload JSON</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" /> Export</CardTitle>
          <CardDescription>CSV opens in Excel and Google Sheets. JSON is for developers and other tools. Your data is always yours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXPORTS.map((e) => (
              <div key={e.type} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <span className="text-sm font-medium">{e.label}</span>
                <span className="flex gap-1">
                  <Button size="sm" variant="ghost" asChild><a href={`/api/data-export?type=${e.type}&format=csv`}>CSV</a></Button>
                  <Button size="sm" variant="ghost" asChild><a href={`/api/data-export?type=${e.type}&format=json`}>JSON</a></Button>
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button asChild><a href="/api/data-export?type=site"><Package className="w-4 h-4 mr-2" /> Download full site (JSON)</a></Button>
            <p className="text-xs text-muted-foreground">Everything above plus branding and menus, in one file. For a copy that includes media files, use <Link href="/dashboard/backups" className="underline">Backups</Link>.</p>
          </div>
        </CardContent>
      </Card>

      {jobs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent imports</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {jobs.map((j) => (
              <div key={j.id} className="py-3 flex items-start justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <p className="font-medium truncate">{SOURCE_LABEL[j.source] ?? j.source}{j.source_label ? `: ${j.source_label}` : ""}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(j.created_at).toLocaleString()} · {j.results.created} added, {j.results.skipped} skipped, {j.results.failed} failed, {j.results.media} images
                  </p>
                  {j.results.errors?.length > 0 && (
                    <details className="text-xs text-muted-foreground mt-1">
                      <summary className="cursor-pointer flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {j.results.errors.length} problems</summary>
                      <ul className="mt-1 space-y-0.5 list-disc pl-4">{j.results.errors.map((er, i) => <li key={i}>{er}</li>)}</ul>
                    </details>
                  )}
                </div>
                {j.status === "done" ? (
                  <span className="shrink-0 text-xs rounded-full px-2 py-0.5 bg-muted">Done</span>
                ) : (
                  <Button size="sm" variant="outline" className="shrink-0" disabled={busy || !j.total} onClick={() => resume(j)}>
                    Resume ({j.cursor} / {j.total})
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
