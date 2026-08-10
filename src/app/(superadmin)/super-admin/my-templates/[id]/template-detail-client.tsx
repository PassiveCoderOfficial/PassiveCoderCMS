"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Loader2, ExternalLink, FileEdit, Globe, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteTemplate, TemplateCategory, TemplateStatus } from "@/modules/templates/types";

type TemplatePageRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  order_index: number;
  updated_at: string;
};

export default function TemplateDetailClient({
  template,
  pages,
  categories,
}: {
  template: SiteTemplate;
  pages: TemplatePageRow[];
  categories: TemplateCategory[];
}) {
  const router = useRouter();
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [categoryId, setCategoryId] = useState(template.category_id ?? "");
  const [saving, setSaving] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");

  const dirty =
    name !== template.name ||
    description !== (template.description ?? "") ||
    categoryId !== (template.category_id ?? "");

  async function saveMeta() {
    setSaving(true);
    try {
      const res = await fetch(`/api/site-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, category_id: categoryId || null }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      toast.success("Template details saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: TemplateStatus) {
    setSaving(true);
    try {
      const res = await fetch(`/api/site-templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");
      toast.success(status === "published" ? "Template published" : `Set to ${status}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  async function addPage(e: React.FormEvent) {
    e.preventDefault();
    const title = newPageTitle.trim();
    if (!title) return;
    setCreatingPage(true);
    try {
      const res = await fetch(`/api/site-templates/${template.id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json() as { error?: string; page?: { id: string } };
      if (!res.ok || !data.page) throw new Error(data.error ?? "Failed to add page");
      setNewPageTitle("");
      toast.success(`Added “${title}”`);
      // Straight into the normal page builder — a template page is an
      // ordinary page row, so the existing editor handles it unchanged.
      router.push(`/dashboard/pages/${data.page.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add page");
    } finally {
      setCreatingPage(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/super-admin/my-templates" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> My Templates
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">/templates/{template.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/templates/${template.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:text-foreground bg-card"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Preview
            </a>
            {template.status !== "published" ? (
              <button
                onClick={() => void setStatus("published")}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Globe className="h-3.5 w-3.5" /> Publish
              </button>
            ) : (
              <button
                onClick={() => void setStatus("draft")}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 bg-card"
              >
                Unpublish
              </button>
            )}
          </div>
        </div>
      </div>

      {template.status !== "published" && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
          This template is a <strong>{template.status}</strong> — it won&apos;t appear in the showcase, onboarding
          picker or dashboard template list until published.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pages */}
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Pages ({pages.length})
            </h2>
          </div>

          <form onSubmit={addPage} className="flex gap-2">
            <input
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="New page title (e.g. Services)"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
            />
            <button
              type="submit"
              disabled={creatingPage || !newPageTitle.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {creatingPage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Page
            </button>
          </form>

          {pages.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No pages yet. Add one above — it opens in the same page builder you use for any site.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-xl border bg-card">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">/{p.slug}</p>
                  </div>
                  <Link
                    href={`/dashboard/pages/${p.id}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary bg-card"
                  >
                    <FileEdit className="h-3 w-3" /> Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Details */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h2>
          <div className="space-y-4 rounded-xl border p-4 bg-card">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Name</label>
              <input
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Category</label>
              <select
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Description</label>
              <textarea
                className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button
              onClick={() => void saveMeta()}
              disabled={saving || !dirty}
              className={cn(
                "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold",
                dirty ? "bg-primary text-primary-foreground hover:opacity-90" : "border text-muted-foreground",
                "disabled:opacity-50",
              )}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? "Save Changes" : "Saved"}
            </button>
          </div>

          {template.palette && (
            <div className="rounded-xl border p-4 bg-card">
              <p className="mb-2 text-xs font-medium">Colour scheme</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(template.palette)
                  .filter(([, v]) => typeof v === "string" && v.startsWith("#"))
                  .map(([k, v]) => (
                    <span key={k} title={k} className="h-6 w-6 rounded-full border border-white/20" style={{ background: v as string }} />
                  ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Captured from the source site. Edit via Colors &amp; Design on a site using this template.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
