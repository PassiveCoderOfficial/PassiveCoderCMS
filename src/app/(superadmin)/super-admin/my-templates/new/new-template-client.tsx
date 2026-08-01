"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { slugifyTemplateName } from "@/modules/templates/permissions";
import type { TemplateCategory } from "@/modules/templates/types";

export default function NewTemplateClient({
  categories,
  sourceTenant,
  isSuperAdmin,
}: {
  categories: TemplateCategory[];
  sourceTenant: { id: string; name: string; slug: string } | null;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(sourceTenant ? `${sourceTenant.name} Template` : "");
  // Slug follows the name until the user edits it directly, then stops
  // fighting them — the usual auto-slug behaviour people expect.
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [requestedCategory, setRequestedCategory] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugifyTemplateName(name);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Give the template a name");
    if (!categoryId && !requestedCategory.trim()) return toast.error("Pick a category, or request a new one");

    setSaving(true);
    try {
      const res = await fetch("/api/site-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: effectiveSlug,
          description: description.trim(),
          categoryId: categoryId || null,
          requestedCategoryName: categoryId ? undefined : requestedCategory.trim(),
          logoUrl: logoUrl.trim() || null,
          faviconUrl: faviconUrl.trim() || null,
          sourceTenantId: sourceTenant?.id ?? null,
        }),
      });
      const data = await res.json() as { error?: string; template?: { id: string }; pagesCopied?: number };
      if (!res.ok || !data.template) throw new Error(data.error ?? "Failed to create template");

      toast.success(
        sourceTenant
          ? `Template created from ${sourceTenant.name} (${data.pagesCopied ?? 0} pages copied)`
          : "Template created",
      );
      router.push(`/super-admin/my-templates/${data.template.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link href="/super-admin/my-templates" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> My Templates
      </Link>

      <h1 className="text-2xl font-bold">New Template</h1>
      {sourceTenant ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm">
            Snapshotting <strong>{sourceTenant.name}</strong> — its pages, colours, fonts, nav and footer are copied
            into this template. The live site is not modified, and later edits here never flow back to it.
          </p>
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">
          Starts empty. You&apos;ll build its pages in the normal page editor, then publish when it&apos;s ready.
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-5">
        <Field label="Template name" required>
          <input
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Coastal Dental Clinic"
            autoFocus
          />
        </Field>

        <Field label="URL slug" required hint={`Preview will live at /templates/${effectiveSlug || "…"}`}>
          <input
            className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm"
            value={effectiveSlug}
            onChange={(e) => { setSlugTouched(true); setSlug(slugifyTemplateName(e.target.value)); }}
            placeholder="coastal-dental-clinic"
          />
        </Field>

        <Field label="Category" required>
          <select
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">— Select a category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {!categoryId && (
            <input
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={requestedCategory}
              onChange={(e) => setRequestedCategory(e.target.value)}
              placeholder={isSuperAdmin ? "…or type a new category to create it" : "…or request a new category (needs approval)"}
            />
          )}
        </Field>

        <Field label="Description" hint="Shown on the template card in the picker.">
          <textarea
            className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Who is this template for, and what makes it distinct?"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo URL" hint="Optional — can be set later.">
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Favicon URL" hint="Optional — can be set later.">
            <input
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Creating…" : sourceTenant ? "Create & Snapshot Site" : "Create Template"}
          </button>
          <Link href="/super-admin/my-templates" className="rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
