"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SOCIAL_NETWORKS, type SiteSocialLink, type SocialNetwork } from "@/lib/social-links";
import { SOCIAL_BRAND_COLORS, SOCIAL_LABELS, SocialIcon } from "@/components/blocks/_primitives/social-icons";

const LABELS: Record<string, string> = { ...SOCIAL_LABELS, whatsapp: "WhatsApp (chat or channel)" };
const PLACEHOLDER: Record<string, string> = {
  facebook: "https://www.facebook.com/yourpage", instagram: "https://www.instagram.com/yourname",
  tiktok: "https://www.tiktok.com/@yourname", youtube: "https://www.youtube.com/@yourchannel",
  linkedin: "https://www.linkedin.com/company/yourcompany", twitter: "https://x.com/yourname",
  whatsapp: "https://wa.me/15551234567 or https://whatsapp.com/channel/...", snapchat: "https://www.snapchat.com/add/yourname",
};

/**
 * Social Media: the site's profiles, entered once. The header top bar, the
 * footer and the Social Links block show them when their "Show social icons"
 * option is on, so one edit here updates every place.
 */
export function SocialLinksCard() {
  const [links, setLinks] = useState<SiteSocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    fetch("/api/social-links").then((r) => r.json()).then((d) => {
      setAvailable(d.available !== false);
      if (d.error) setMsg({ ok: false, text: d.error });
      const saved = (d.links ?? []) as SiteSocialLink[];
      // Nothing saved yet: start from the links already in the header/footer.
      const seed = ((d.fromBlocks ?? []) as { platform: string; url: string }[])
        .filter((x) => (SOCIAL_NETWORKS as readonly string[]).includes(x.platform))
        .map((x) => ({ platform: x.platform as SocialNetwork, url: x.url, show: true }));
      setLinks(saved.length ? saved : seed);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const put = (i: number, patch: Partial<SiteSocialLink>) => setLinks((l) => l.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => setLinks((l) => {
    const j = i + d; if (j < 0 || j >= l.length) return l;
    const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const unused = SOCIAL_NETWORKS.filter((p) => !links.some((l) => l.platform === p));

  async function save() {
    setSaving(true); setMsg(null);
    const res = await fetch("/api/social-links", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ links: links.map((l) => ({ ...l, url: l.url.trim() })) }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setSaving(false);
    setMsg(res?.ok ? { ok: true, text: "Saved. Your header, footer and Social Links sections now use these." } : { ok: false, text: d.error ?? "Could not save. Try again." });
  }

  return (
    <section className="rounded-xl border bg-card p-5 max-w-3xl space-y-4" id="social-media">
      <div>
        <h2 className="text-lg font-semibold">Social Media</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add your profiles once. Turn on &quot;Show social icons&quot; in the header top bar, the footer, or add a Social Links section, and they all use this list. The eye hides a network without deleting it.
        </p>
      </div>
      {loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : (
        <>
          <div className="space-y-2">
            {links.map((l, i) => (
              <div key={`${l.platform}-${i}`} className="flex items-center gap-2">
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full border shrink-0" style={{ color: SOCIAL_BRAND_COLORS[l.platform] }}><SocialIcon platform={l.platform} /></span>
                <select value={l.platform} onChange={(e) => put(i, { platform: e.target.value as SocialNetwork })} className="h-9 w-40 shrink-0 rounded-md border bg-background px-2 text-sm">
                  {SOCIAL_NETWORKS.map((p) => <option key={p} value={p}>{LABELS[p]}</option>)}
                </select>
                <Input value={l.url} onChange={(e) => put(i, { url: e.target.value })} placeholder={PLACEHOLDER[l.platform]} className={l.show === false ? "opacity-50" : ""} />
                <Button type="button" variant="ghost" size="icon" title={l.show === false ? "Hidden on the site: click to show" : "Shown on the site: click to hide"} onClick={() => put(i, { show: l.show === false })}>
                  {l.show === false ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button type="button" variant="ghost" size="icon" title="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="w-4 h-4" /></Button>
                <Button type="button" variant="ghost" size="icon" title="Move down" onClick={() => move(i, 1)} disabled={i === links.length - 1}><ArrowDown className="w-4 h-4" /></Button>
                <Button type="button" variant="ghost" size="icon" title="Remove" onClick={() => setLinks((x) => x.filter((_, k) => k !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}
            {!links.length && <p className="text-sm text-muted-foreground">No social profiles yet.</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unused.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setLinks((l) => [...l, { platform: unused[0], url: "", show: true }])}>
                <Plus className="w-4 h-4 mr-1" /> Add network
              </Button>
            )}
            <Button type="button" size="sm" onClick={save} disabled={saving || !available}>{saving ? "Saving…" : "Save social links"}</Button>
            {msg && <span className={msg.ok ? "text-sm text-green-600" : "text-sm text-destructive"}>{msg.text}</span>}
          </div>
        </>
      )}
    </section>
  );
}
