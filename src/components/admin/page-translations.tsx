"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2, Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Version = { lang: string; name: string; id: string | null; status: string | null; path: string };
type Data = { isTranslation?: boolean; lang?: string; main: string; languages: string[]; versions?: Version[] };

/** Language versions of one page: create with AI or as a copy, open, refresh. */
export function PageTranslations({ pageId }: { pageId: string }) {
  const [d, setD] = useState<Data | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => { setD(await fetch(`/api/pages/translations?page_id=${pageId}`).then((r) => r.json()).catch(() => null)); }, [pageId]);
  useEffect(() => { load(); }, [load]);

  async function make(v: Version, mode: "ai" | "copy") {
    if (v.id && !confirm(`Replace the current ${v.name} version with a new ${mode === "ai" ? "AI translation" : "copy"}? Edits made to it will be lost.`)) return;
    setBusy(`${v.lang}-${mode}`);
    const res = await fetch("/api/pages/translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page_id: pageId, lang: v.lang, mode }) });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { toast.error(j.error ?? "Failed"); return; }
    toast.success(mode === "ai" ? `${v.name} version ready${j.charged ? " (10 AI Credits used)" : ""}` : `${v.name} copy created as a draft. Edit it to translate.`);
    load();
  }

  if (!d) return <p className="text-xs text-muted-foreground">Loading…</p>;
  if (d.isTranslation) return <p className="text-xs text-muted-foreground">This is a translated version ({d.lang}). Manage translations from the main-language page.</p>;
  if (!d.languages.length) return <p className="text-xs text-muted-foreground">Your site has one language. Add more in <Link href="/dashboard/settings/languages" className="underline">Settings &gt; Languages</Link>.</p>;

  return (
    <div className="rounded-lg border divide-y">
      {d.versions?.map((v) => (
        <div key={v.lang} className="p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{v.name} <span className="text-xs text-muted-foreground font-mono">{v.path}</span></p>
            <span className={`text-[10px] rounded-full px-2 py-0.5 ${v.id ? v.status === "published" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/15 text-amber-700 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
              {v.id ? (v.status === "published" ? "Live" : "Draft") : "Not created"}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button size="sm" className="h-7 text-xs" disabled={!!busy} onClick={() => make(v, "ai")}>
              {busy === `${v.lang}-ai` ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} {v.id ? "Re-translate with AI" : "Translate with AI"}
            </Button>
            {!v.id && (
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!busy} onClick={() => make(v, "copy")}>
                {busy === `${v.lang}-copy` ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Copy className="w-3 h-3 mr-1" />} Copy to translate myself
              </Button>
            )}
            {v.id && <Button size="sm" variant="outline" className="h-7 text-xs" asChild><Link href={`/dashboard/pages/${v.id}`}><Pencil className="w-3 h-3 mr-1" /> Edit</Link></Button>}
            {v.id && v.status === "published" && <Button size="sm" variant="ghost" className="h-7 text-xs" asChild><a href={v.path} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 mr-1" /> View</a></Button>}
          </div>
        </div>
      ))}
    </div>
  );
}
