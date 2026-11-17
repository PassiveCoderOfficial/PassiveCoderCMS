"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, FileText, LayoutTemplate, Layers, Replace, ArrowDownToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/lib/store/builder";
import { createClient } from "@/lib/supabase/client";
import type { Block } from "@/types/cms";
import type { TemplatePalette } from "@/modules/themes/template-types";

type SourceKind = "root" | "pages" | "templates" | "template-scope" | "template-pages" | "confirm";

type PageOption = { id: string; title: string; slug: string };
type TemplateOption = {
  id: string; slug: string; name: string; description: string;
  category: string; screenshotUrl: string | null;
  palette: { primary: string; secondary: string } | null;
  source: "db" | "registry";
};

/**
 * Import flow: Existing Pages | Templates → (template) All Pages | Single Page
 * → page picker → Replace This Page | Add Below.
 *
 * Only "Add Below" and "Replace" touch the current page; importing all pages
 * of a template is a multi-page operation and is intentionally routed to the
 * template-apply flow instead of silently creating pages behind the editor.
 */
export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tenantId, blocks, setBlocks, addBlock } = useBuilderStore();
  const [step, setStep] = useState<SourceKind>("root");
  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState<PageOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [templatePages, setTemplatePages] = useState<PageOption[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateOption | null>(null);
  const [pendingSource, setPendingSource] = useState<{ kind: "page" | "template-page"; id: string; label: string } | null>(null);
  const [withColors, setWithColors] = useState(false);

  const reset = useCallback(() => {
    setStep("root");
    setPendingSource(null);
    setActiveTemplate(null);
    setWithColors(false);
  }, []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function loadPages() {
    if (!tenantId) return toast.error("No site context — can't list this site's pages.");
    setLoading(true);
    try {
      const res = await fetch(`/api/page-builder/import-sources?kind=pages&tenantId=${tenantId}`);
      const data = await res.json() as { pages?: PageOption[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load pages");
      setPages(data.pages ?? []);
      setStep("pages");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/page-builder/import-sources?kind=templates");
      const data = await res.json() as { templates?: TemplateOption[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load templates");
      setTemplates(data.templates ?? []);
      setStep("templates");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplatePages(tpl: TemplateOption) {
    setLoading(true);
    try {
      const res = await fetch(`/api/page-builder/import-sources?kind=template-pages&id=${tpl.id}`);
      const data = await res.json() as { pages?: PageOption[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load template pages");
      setTemplatePages(data.pages ?? []);
      setStep("template-pages");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load template pages");
    } finally {
      setLoading(false);
    }
  }

  async function doImport(placement: "replace" | "below") {
    if (!pendingSource) return;
    setLoading(true);
    try {
      const res = await fetch("/api/page-builder/import-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: pendingSource.kind, sourceId: pendingSource.id, withColors }),
      });
      const data = await res.json() as { blocks?: Block[]; palette?: TemplatePalette | null; error?: string };
      if (!res.ok || !data.blocks) throw new Error(data.error ?? "Import failed");

      // "Bring the template's colours too" — the API already computes this
      // palette when withColors is set, but nothing applied it: it's the same
      // site-wide color_overrides field the Colors & Design page writes, so
      // this follows the same tenant lookup + upsert it uses.
      if (withColors && data.palette && tenantId) {
        const supabase = createClient();
        const { error: colorError } = await supabase.from("site_identity").upsert(
          { tenant_id: tenantId, color_overrides: data.palette, updated_at: new Date().toISOString() },
          { onConflict: "tenant_id" },
        );
        if (colorError) toast.error("Blocks imported, but applying the colours failed — you can set them in Colors & Design.");
      }

      if (placement === "replace") {
        setBlocks(data.blocks);
      } else {
        // Appended one by one so each lands through the store's normal add
        // path (history, dirty flag) rather than bypassing it.
        const lastId = blocks[blocks.length - 1]?.id;
        let after = lastId;
        for (const b of data.blocks) {
          addBlock(b, after);
          after = b.id;
        }
      }

      toast.success(
        `Imported ${data.blocks.length} block${data.blocks.length === 1 ? "" : "s"} from ${pendingSource.label}` +
        (placement === "replace" ? " (replaced this page)" : ""),
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-4 py-3">
          {step !== "root" && (
            <button
              onClick={() => setStep(step === "template-pages" || step === "template-scope" ? "templates" : "root")}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h2 className="flex-1 text-sm font-semibold">
            {step === "root" && "Import content"}
            {step === "pages" && "Import from an existing page"}
            {step === "templates" && "Import from a template"}
            {step === "template-scope" && activeTemplate?.name}
            {step === "template-pages" && `${activeTemplate?.name} — pick a page`}
            {step === "confirm" && "How should this be added?"}
          </h2>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {!loading && step === "root" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => void loadPages()}
                className="flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Existing Pages</span>
                <span className="text-xs text-muted-foreground">Reuse a layout from another page on this site.</span>
              </button>
              <button
                onClick={() => void loadTemplates()}
                className="flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
              >
                <LayoutTemplate className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">Templates</span>
                <span className="text-xs text-muted-foreground">Pull a page in from any published template.</span>
              </button>
            </div>
          )}

          {!loading && step === "pages" && (
            pages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">This site has no other pages yet.</p>
            ) : (
              <div className="divide-y rounded-xl border bg-card">
                {pages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setPendingSource({ kind: "page", id: p.id, label: p.title }); setStep("confirm"); }}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.title}</span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">/{p.slug}</span>
                    </span>
                  </button>
                ))}
              </div>
            )
          )}

          {!loading && step === "templates" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTemplate(t); void loadTemplatePages(t); }}
                  className="overflow-hidden rounded-xl border text-left transition-colors hover:border-primary bg-card"
                >
                  <div className="aspect-[16/9] bg-muted">
                    {t.screenshotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.screenshotUrl} alt={t.name} className="h-full w-full object-cover object-top" loading="lazy" />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: `linear-gradient(135deg, ${t.palette?.primary ?? "#4f46e5"}, ${t.palette?.secondary ?? "#1e293b"})` }}
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{t.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && step === "template-pages" && (
            <div className="divide-y rounded-xl border bg-card">
              {templatePages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPendingSource({ kind: "template-page", id: p.id, label: `${activeTemplate?.name} — ${p.title}` }); setStep("confirm"); }}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50"
                >
                  <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.title}</span>
                    <span className="block truncate font-mono text-[11px] text-muted-foreground">/{p.slug}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loading && step === "confirm" && pendingSource && (
            <div className="space-y-4">
              <p className="text-sm">
                Importing <strong>{pendingSource.label}</strong> into this page.
              </p>

              {pendingSource.kind === "template-page" && (
                <label className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer bg-card">
                  <input
                    type="checkbox"
                    checked={withColors}
                    onChange={(e) => setWithColors(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs">
                    <span className="block font-medium">Bring the template&apos;s colours too</span>
                    <span className="block text-muted-foreground">
                      Off by default — the imported page uses this site&apos;s existing colour scheme so it matches
                      the rest of your pages.
                    </span>
                  </span>
                </label>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => void doImport("replace")}
                  className="flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors hover:border-destructive hover:bg-destructive/5"
                >
                  <Replace className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-semibold">Replace This Page</span>
                  <span className="text-xs text-muted-foreground">
                    Swaps out every block currently on this page. Undo still works.
                  </span>
                </button>
                <button
                  onClick={() => void doImport("below")}
                  className="flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <ArrowDownToLine className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">Add Below</span>
                  <span className="text-xs text-muted-foreground">
                    Appends the imported blocks after your existing content.
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
