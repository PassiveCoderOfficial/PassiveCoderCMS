"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Loader2, ExternalLink, Archive, Globe, FileEdit, Search, ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteTemplate, TemplateCategory, TemplateStatus } from "@/modules/templates/types";

const STATUS_STYLES: Record<TemplateStatus, string> = {
  draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  published: "bg-green-500/15 text-green-400 border-green-500/30",
  archived: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

export default function MyTemplatesClient({
  templates,
  categories,
  isSuperAdmin,
}: {
  templates: SiteTemplate[];
  categories: TemplateCategory[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TemplateStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]));
    return (t: SiteTemplate) => (t.category_id ? map.get(t.category_id) ?? t.category : t.category);
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchSearch =
        !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) ||
        (categoryName(t) ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [templates, search, statusFilter, categoryName]);

  async function setStatus(id: string, status: TemplateStatus) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/site-templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update template");
      toast.success(status === "published" ? "Template published" : `Template set to ${status}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update template");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSuperAdmin
              ? "Every template authored through the template engine."
              : "Templates you've created."}{" "}
            Build them like any other site, then publish to make them selectable.
          </p>
        </div>
        <Link
          href="/super-admin/my-templates/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New Template
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-lg border bg-background pl-8 pr-3 py-2 text-sm"
            placeholder="Search by name, slug or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "draft", "published", "archived"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                statusFilter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {templates.length === 0
              ? "No templates yet — create one from scratch, or use “Save as Template” on any site."
              : `No templates match “${search}”.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {t.screenshot_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.screenshot_url} alt={t.name} className="h-full w-full object-cover object-top" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <ImageOff className="h-6 w-6" />
                    <span className="text-[11px]">No preview yet</span>
                  </div>
                )}
                <span className={cn("absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", STATUS_STYLES[t.status])}>
                  {t.status}
                </span>
                {t.palette && (
                  <div className="absolute bottom-2 left-2 flex gap-1">
                    {[t.palette.primary, t.palette.secondary, t.palette.accent, t.palette.background].map((c, i) => (
                      <span key={i} className="h-4 w-4 rounded-full border border-white/40 shadow-sm" style={{ background: c }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold">{t.name}</h3>
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {categoryName(t)}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">/{t.slug}</p>
                  {t.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                  )}
                  {t.source_tenant_id && (
                    <p className="mt-1 text-[10px] text-muted-foreground">Snapshotted from a live site</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Link
                    href={`/super-admin/my-templates/${t.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <FileEdit className="h-3 w-3" /> Edit
                  </Link>
                  <a
                    href={`/templates/${t.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-card"
                  >
                    <ExternalLink className="h-3 w-3" /> Preview
                  </a>
                </div>

                <div className="flex gap-1.5">
                  {t.status !== "published" ? (
                    <button
                      onClick={() => void setStatus(t.id, "published")}
                      disabled={busyId === t.id}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-green-600/40 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/10 disabled:opacity-50"
                    >
                      {busyId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                      Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => void setStatus(t.id, "draft")}
                      disabled={busyId === t.id}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 bg-card"
                    >
                      {busyId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Unpublish
                    </button>
                  )}
                  {t.status !== "archived" && (
                    <button
                      onClick={() => void setStatus(t.id, "archived")}
                      disabled={busyId === t.id}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-50 bg-card"
                      title="Archive (recoverable — nothing is deleted)"
                    >
                      <Archive className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
