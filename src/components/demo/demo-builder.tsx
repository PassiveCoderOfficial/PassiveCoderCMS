"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Copy, ExternalLink, Check, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { createSiteSlug } from "@/lib/utils";
import { hoursLeft } from "@/modules/demo/links";

interface TemplateOpt { slug: string; name: string; category: string }
interface Demo { id: string; name: string; slug: string; demo_expires_at: string; demo_whatsapp: string | null; created_at: string }

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
const PROTO = ROOT.includes("localhost") ? "http" : "https";
const siteUrl = (slug: string) => `${PROTO}://${slug}.${ROOT}`;

function prospectMessage(name: string, url: string) {
  return `আসসালামু আলাইকুম! ${name} এর জন্য আমরা একটা demo website বানিয়েছি, দেখে নিন:\n${url}\n\nপছন্দ হলে আমাদের জানান, payment (bank transfer বা bKash) হলেই আপনার নিজের domain এ live করে দেব। Demo টা শুধু ৭২ ঘণ্টা দেখা যাবে, তার মধ্যে জানালে ভালো হয়।`;
}


export function DemoBuilder({ templates }: { templates: TemplateOpt[] }) {
  const [name, setName] = useState("");
  const [manualSlug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugOk, setSlugOk] = useState<boolean | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
  const [services, setServices] = useState("");
  const [address, setAddress] = useState("");
  const [templateSlug, setTemplateSlug] = useState(templates.find(t => t.slug === "shield-guard")?.slug ?? templates[0]?.slug ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [demos, setDemos] = useState<Demo[]>([]);

  const load = useCallback(async () => {
    const r = await fetch("/api/demos");
    if (r.ok) setDemos((await r.json()).demos ?? []);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const slug = slugTouched ? manualSlug : createSiteSlug(name);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (slug.length < 3) { setSlugOk(null); return; }
      const r = await fetch(`/api/onboarding/check-subdomain?slug=${encodeURIComponent(slug)}`);
      const j = await r.json().catch(() => ({}));
      setSlugOk(!!j.available);
    }, 400);
    return () => clearTimeout(t);
  }, [slug]);

  async function uploadLogo(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/demos/logo", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    setUploading(false);
    if (!r.ok) return toast.error(j.error ?? "Upload failed");
    setLogoUrl(j.url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/demos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, whatsapp, services, address, templateSlug, logoUrl }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast.error(j.error ?? "Failed to build demo");
    setResult({ url: j.url, name });
    setName(""); setSlug(""); setSlugTouched(false); setWhatsapp(""); setServices(""); setAddress(""); setLogoUrl(null);
    load();
  }

  async function act(id: string, action: "extend" | "golive") {
    if (action === "golive" && !confirm("Payment received? This removes the demo banner and expiry.")) return;
    const r = await fetch("/api/demos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    if (!r.ok) return toast.error("Failed");
    toast.success(action === "extend" ? "Extended 72 hours" : "Site is live");
    load();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
  }

  const input = "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40";
  const label = "block text-sm font-medium mb-1.5";
  const byCat = templates.reduce<Record<string, TemplateOpt[]>>((a, t) => { (a[t.category || "Other"] ??= []).push(t); return a; }, {});

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Demo Site Builder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build a personalised demo in a minute and send it in the WhatsApp chat. Demos show a &quot;make it live&quot; banner, pause after 72 hours, never get deleted, and leads on them notify nobody.
        </p>
      </div>

      {result && (
        <div className="rounded-xl border border-green-500/40 bg-green-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400"><Check className="w-4 h-4" /> Demo ready: {result.name}</div>
          <div className="flex flex-wrap gap-2">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-muted"><ExternalLink className="w-3.5 h-3.5" /> Open {result.url.replace(/^https?:\/\//, "")}</a>
            <button onClick={() => copy(result.url)} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border hover:bg-muted"><Copy className="w-3.5 h-3.5" /> Copy link</button>
            <button onClick={() => copy(prospectMessage(result.name, result.url))} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-[#25D366] text-white font-semibold"><Copy className="w-3.5 h-3.5" /> Copy WhatsApp message</button>
          </div>
          <pre className="text-xs whitespace-pre-wrap bg-muted/50 rounded-lg p-3 font-sans">{prospectMessage(result.name, result.url)}</pre>
        </div>
      )}

      <form onSubmit={submit} className="rounded-xl border bg-card p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Company name *</label>
          <input className={input} value={name} onChange={e => setName(e.target.value)} required placeholder="Rahman Electrical Services" />
        </div>
        <div>
          <label className={label}>Subdomain *</label>
          <div className="flex items-center gap-1">
            <input className={input} value={slug} required onChange={e => { setSlugTouched(true); setSlug(createSiteSlug(e.target.value)); }} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">.{ROOT}</span>
          </div>
          {slugOk === false && <p className="text-xs text-red-500 mt-1">Taken, try another</p>}
          {slugOk === true && <p className="text-xs text-green-600 mt-1">Available</p>}
        </div>
        <div>
          <label className={label}>WhatsApp number * <span className="text-muted-foreground font-normal">(with country code)</span></label>
          <input className={input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required placeholder="+65 8123 4567" inputMode="tel" />
        </div>
        <div>
          <label className={label}>Business type (look &amp; photos)</label>
          <select className={input} value={templateSlug} onChange={e => setTemplateSlug(e.target.value)}>
            {Object.entries(byCat).map(([cat, list]) => (
              <optgroup key={cat} label={cat}>
                {list.map(t => <option key={t.slug} value={t.slug}>{cat} ({t.name})</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Services * <span className="text-muted-foreground font-normal">(one per line or comma separated, max 9)</span></label>
          <textarea className={input} rows={4} value={services} onChange={e => setServices(e.target.value)} required placeholder={"Aircon servicing\nAircon installation\nChemical wash"} />
        </div>
        <div>
          <label className={label}>Address <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input className={input} value={address} onChange={e => setAddress(e.target.value)} placeholder="Jurong West, Singapore" />
        </div>
        <div>
          <label className={label}>Logo <span className="text-muted-foreground font-normal">(optional, icon used if empty)</span></label>
          {logoUrl ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Logo" className="h-10 max-w-40 object-contain rounded border bg-white p-1" />
              <button type="button" onClick={() => setLogoUrl(null)} className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /> Remove</button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm cursor-pointer hover:bg-muted">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload logo
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
            </label>
          )}
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <button type="submit" disabled={busy || uploading || slugOk === false} className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg disabled:opacity-50">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} {busy ? "Building..." : "Build demo"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Demos ({demos.length})</h2>
        {demos.length === 0 && <p className="text-sm text-muted-foreground">No demos yet.</p>}
        <div className="rounded-xl border divide-y">
          {demos.map(d => {
            const left = hoursLeft(d.demo_expires_at);
            const url = siteUrl(d.slug);
            return (
              <div key={d.id} className="p-3 sm:p-4 flex flex-wrap items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline">{url.replace(/^https?:\/\//, "")}</a>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${left > 0 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"}`}>
                    {left > 0 ? `${left}h left` : "Paused"}
                  </span>
                  <button onClick={() => copy(prospectMessage(d.name, url))} className="text-xs px-2.5 py-1.5 rounded-lg border hover:bg-muted">Copy message</button>
                  <button onClick={() => act(d.id, "extend")} className="text-xs px-2.5 py-1.5 rounded-lg border hover:bg-muted">Extend 72 hours</button>
                  <button onClick={() => act(d.id, "golive")} className="text-xs px-2.5 py-1.5 rounded-lg bg-green-600 text-white font-semibold">Paid, go live</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
