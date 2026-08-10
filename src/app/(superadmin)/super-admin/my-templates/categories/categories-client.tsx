"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Loader2, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemplateCategory } from "@/modules/templates/types";

export default function CategoriesClient({
  categories,
  usage,
}: {
  categories: TemplateCategory[];
  usage: Record<string, number>;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const pending = categories.filter((c) => c.status === "pending");
  const active = categories.filter((c) => c.status === "active");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy("new");
    try {
      const res = await fetch("/api/site-templates/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sortOrder: active.length }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to create category");
      setNewName("");
      toast.success(`Added “${name}”`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setBusy(null);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, successMsg: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/site-templates/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update category");
      toast.success(successMsg);
      setEditingId(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <Link href="/super-admin/my-templates" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> My Templates
        </Link>
        <h1 className="text-2xl font-bold">Template Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Shared across every template — these are the groupings customers browse by in the showcase,
          onboarding and dashboard picker.
        </p>
      </div>

      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
            Pending requests ({pending.length})
          </h2>
          <div className="divide-y rounded-xl border border-amber-500/30 bg-card">
            {pending.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{c.slug}</p>
                </div>
                <button
                  onClick={() => void patch(c.id, { status: "active" }, `Approved “${c.name}”`)}
                  disabled={busy === c.id}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-green-600/40 px-3 py-1.5 text-xs font-medium text-green-500 hover:bg-green-500/10 disabled:opacity-50"
                >
                  {busy === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Approve
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Active ({active.length})
        </h2>

        <form onSubmit={create} className="flex gap-2">
          <input
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            placeholder="New category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy === "new" || !newName.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </button>
        </form>

        <div className="divide-y rounded-xl border bg-card">
          {active.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 p-3">
              <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                {editingId === c.id ? (
                  <input
                    className="w-full rounded-lg border bg-background px-2 py-1 text-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editName.trim()) void patch(c.id, { name: editName.trim() }, "Category renamed");
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <>
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">{c.slug}</p>
                  </>
                )}
              </div>
              <span className={cn("shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px]", (usage[c.id] ?? 0) === 0 && "text-muted-foreground")}>
                {usage[c.id] ?? 0} template{(usage[c.id] ?? 0) === 1 ? "" : "s"}
              </span>
              {editingId === c.id ? (
                <button
                  onClick={() => editName.trim() && void patch(c.id, { name: editName.trim() }, "Category renamed")}
                  disabled={busy === c.id}
                  className="shrink-0 rounded-lg border px-2 py-1.5 text-xs disabled:opacity-50 bg-card"
                >
                  {busy === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </button>
              ) : (
                <button
                  onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                  className="shrink-0 rounded-lg border px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-card"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Renaming a category updates it everywhere it&apos;s used. Categories aren&apos;t deletable while templates
          reference them — reassign those templates first.
        </p>
      </section>
    </div>
  );
}
