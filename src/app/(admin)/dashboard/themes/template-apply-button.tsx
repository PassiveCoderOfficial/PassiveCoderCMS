"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, Sparkles, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Props {
  templateSlug: string;
  templateName: string;
  isActive: boolean;
  tenantId: string;
  /** Named explicitly in the confirm dialog below — the tenant id here can
   *  come from a stale cross-tab cookie (see getCurrentTenantId()'s staff
   *  fallback), so this is the one chance for whoever clicks Apply to catch
   *  that they're not on the site they think they are before it mutates. */
  siteName: string | null;
}

export function TemplateApplyButton({ templateSlug, templateName, isActive, tenantId, siteName }: Props) {
  const [applying, setApplying] = useState(false);
  const [mode, setMode] = useState<"theme" | "full">("theme");
  // Archiving is opt-in and never destructive — archived pages stay
  // recoverable, so a template apply can't silently lose a site's content.
  const [archiveExistingPages, setArchiveExistingPages] = useState(false);
  const router = useRouter();

  async function apply() {
    if (!tenantId) {
      toast.error("No site found. Make sure you are in a site context.");
      return;
    }
    const target = siteName ? `on "${siteName}"` : "on this site";
    const confirmMsg = mode === "full"
      ? `Apply "${templateName}" ${target} in Full Demo mode? This will overwrite the home page with template content, services, testimonials, pricing, gallery and contact details.${archiveExistingPages ? "\n\nExisting pages will be archived (recoverable, not deleted)." : ""}\n\nDouble-check that's the right site — this is not undoable from here.`
      : `Apply "${templateName}" ${target} in Theme mode? This changes colors, fonts and layout variants only. Existing content is preserved.\n\nDouble-check that's the right site.`;
    if (!confirm(confirmMsg)) return;

    setApplying(true);
    try {
      const res = await fetch("/api/templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, templateSlug, mode, archiveExistingPages: mode === "full" && archiveExistingPages }),
      });
      // Parsed defensively: a crashed or timed-out request can come back with
      // no body at all, and calling res.json() on that throws "Unexpected end
      // of JSON input" — which then gets shown to the user instead of the real
      // failure.
      const raw = await res.text();
      let data: { error?: string; pagesCreated?: number; pagesArchived?: number } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(
          res.ok
            ? "The server sent back something unreadable. Your site may not have changed — reload and check."
            : `Apply failed (${res.status}). ${raw.slice(0, 200) || "The server didn't say why."}`,
        );
      }
      if (!res.ok) throw new Error(data.error ?? `Apply failed (${res.status})`);
      const detail = data.pagesCreated
        ? ` ${data.pagesCreated} page${data.pagesCreated === 1 ? "" : "s"} added${data.pagesArchived ? `, ${data.pagesArchived} archived` : ""}.`
        : "";
      toast.success(`"${templateName}" applied!${detail}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setApplying(false);
    }
  }

  if (isActive) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-green-600">
        <CheckCircle className="h-3.5 w-3.5" /> Currently Active
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setMode("theme")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded border transition-all",
            mode === "theme"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          <Layout className="w-2.5 h-2.5" /> Theme only
        </button>
        <button
          onClick={() => setMode("full")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded border transition-all",
            mode === "full"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          <Sparkles className="w-2.5 h-2.5" /> Full demo
        </button>
      </div>
      <p className="text-[9px] text-muted-foreground leading-tight">
        {mode === "theme"
          ? "Colors, fonts & layout variants only. Content unchanged."
          : "Full rebuild: real images, services, testimonials, pricing, home page."}
      </p>
      {mode === "full" && (
        <label className="flex items-start gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={archiveExistingPages}
            onChange={(e) => setArchiveExistingPages(e.target.checked)}
            className="mt-0.5 h-3 w-3 shrink-0 cursor-pointer"
          />
          <span className="text-[9px] leading-tight text-muted-foreground">
            Archive my existing pages — they stay recoverable, nothing is deleted.
          </span>
        </label>
      )}
      {/* Apply button */}
      <button
        onClick={apply}
        disabled={applying}
        className="w-full py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
      >
        {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        {applying ? "Applying…" : `Apply ${templateName}`}
      </button>
    </div>
  );
}
