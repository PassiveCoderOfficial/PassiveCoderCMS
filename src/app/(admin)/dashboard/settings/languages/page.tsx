"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Languages, Loader2, Plus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkTranslate } from "@/components/admin/bulk-translate";

type State = { main: string; languages: string[]; googleWidget: boolean; translatedPages: number; available: Record<string, string> };

/**
 * Two ways to speak more languages, never both at once:
 *  - Your own translations: real pages per language (/ar/about), written by
 *    AI or by hand, indexed by Google in each language.
 *  - Google Translate widget: instant machine translation in the browser,
 *    every language Google offers, not indexed.
 */
export default function LanguagesPage() {
  const [s, setS] = useState<State | null>(null);
  const [adding, setAdding] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/site-languages").then((r) => r.json()).then(setS).catch(() => null); }, []);

  async function save(next: Partial<State>) {
    if (!s) return;
    const merged = { ...s, ...next };
    setSaving(true);
    const res = await fetch("/api/site-languages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ main: merged.main, languages: merged.languages, googleWidget: merged.googleWidget }) });
    const j = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.error(j.error ?? "Could not save"); return; }
    setS({ ...merged, languages: j.languages, googleWidget: j.googleWidget });
    toast.success("Saved");
  }

  if (!s) return <div className="p-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  const names = s.available;
  const sorted = Object.entries(names).sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Languages className="w-6 h-6" /> Languages</h1>
        <p className="text-sm text-muted-foreground mt-1">Show your site in more than one language.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Main language</CardTitle><CardDescription>The language your pages are written in.</CardDescription></CardHeader>
        <CardContent>
          <Select value={s.main} onValueChange={(v) => save({ main: v, languages: s.languages.filter((l) => l !== v) })}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>{sorted.map(([c, n]) => <SelectItem key={c} value={c}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Your own translations (recommended)</CardTitle>
          <CardDescription>Each page gets a real version in each language, like /ar/about. Google shows the right one to each visitor. Create them from a page&apos;s settings with &ldquo;Translate with AI&rdquo; (10 AI Credits per page) or by hand. Visitors switch with the language button on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {s.languages.length === 0 && <p className="text-sm text-muted-foreground">No extra languages yet.</p>}
            {s.languages.map((l) => (
              <span key={l} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
                {names[l] ?? l}
                <button aria-label={`Remove ${names[l]}`} onClick={() => { if (confirm(`Stop offering ${names[l]}? Pages already translated stay, but the language button won't list it.`)) save({ languages: s.languages.filter((x) => x !== l) }); }}><X className="w-3.5 h-3.5" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value={adding} onValueChange={setAdding}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Add a language…" /></SelectTrigger>
              <SelectContent>{sorted.filter(([c]) => c !== s.main && !s.languages.includes(c)).map(([c, n]) => <SelectItem key={c} value={c}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={!adding || saving} onClick={() => { save({ languages: [...s.languages, adding] }); setAdding(""); }}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Add
            </Button>
          </div>
          
        </CardContent>
      </Card>

      {s.languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Translate your site</CardTitle>
            <CardDescription>Pick the pages and languages, and AI translates them, header and footer included. 10 AI Credits per page per language.</CardDescription>
          </CardHeader>
          <CardContent><BulkTranslate /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Google Translate widget</CardTitle>
          <CardDescription>A small button that machine-translates the page in the visitor&apos;s browser into any language Google supports (over 100). Quick, but Google search doesn&apos;t see these translations. Can&apos;t be used together with your own translations.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <Label>{s.languages.length ? "Off while you have your own languages" : "Show the widget on my site"}</Label>
          <Switch checked={s.googleWidget} disabled={s.languages.length > 0 || saving} onCheckedChange={(v) => save({ googleWidget: v })} />
        </CardContent>
      </Card>
    </div>
  );
}
