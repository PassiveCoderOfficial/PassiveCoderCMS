"use client";

import React, { useMemo, useState } from "react";
import { Star, Check, EyeOff, Trash2, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export type ReviewRow = {
  id: string; product_id: string; reviewer_name: string; reviewer_email: string | null; rating: number; body: string | null;
  images: string[]; status: string; verified: boolean; testimonial_id: string | null; created_at: string;
  products: { name: string; slug: string; images: string[] | null } | null;
};

const FILTERS = [["pending", "Waiting"], ["published", "Approved"], ["hidden", "Hidden"], ["all", "All"]] as const;

/**
 * Moderate product reviews and feature the best on the homepage. Featuring
 * copies the review into a Testimonials group (default "Homepage reviews"),
 * which a Testimonials block on any page shows with "from a group".
 */
export function ReviewsManager({ tenantId, initial, groups: initialGroups }: { tenantId: string; initial: ReviewRow[]; groups: { id: string; name: string }[] }) {
  const [rows, setRows] = useState(initial);
  const [groups, setGroups] = useState(initialGroups);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("pending");
  const [groupId, setGroupId] = useState(initialGroups[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const supabase = createClient();
  const shown = useMemo(() => rows.filter((r) => filter === "all" || r.status === filter), [rows, filter]);
  const patch = (id: string, p: Partial<ReviewRow>) => setRows((x) => x.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const setStatus = async (r: ReviewRow, status: string) => {
    setBusy(r.id);
    const { error } = await supabase.from("product_reviews").update({ status, updated_at: new Date().toISOString() }).eq("id", r.id);
    setBusy(null);
    if (error) toast.error(error.message); else { patch(r.id, { status }); toast.success(status === "published" ? "Approved" : "Hidden"); }
  };
  const remove = async (r: ReviewRow) => {
    if (!confirm("Delete this review for good?")) return;
    setBusy(r.id);
    if (r.testimonial_id) await supabase.from("testimonials").delete().eq("id", r.testimonial_id);
    const { error } = await supabase.from("product_reviews").delete().eq("id", r.id);
    setBusy(null);
    if (error) toast.error(error.message); else setRows((x) => x.filter((y) => y.id !== r.id));
  };
  const ensureGroup = async (): Promise<string | null> => {
    if (groupId) return groupId;
    const { data, error } = await supabase.from("testimonial_groups").insert({
      tenant_id: tenantId, name: "Homepage reviews", slug: "homepage-reviews",
      show_custom: true, show_google: false, show_trustpilot: false, show_facebook: false, sort_order: 0,
    }).select("id, name").single();
    if (error || !data) { toast.error(error?.message ?? "Could not create a group"); return null; }
    setGroups((g) => [...g, data]); setGroupId(data.id); return data.id;
  };
  const feature = async (r: ReviewRow) => {
    setBusy(r.id);
    const gid = await ensureGroup();
    if (!gid) { setBusy(null); return; }
    const { data: t, error } = await supabase.from("testimonials").insert({
      tenant_id: tenantId, group_id: gid, source: "review", name: r.reviewer_name, content: r.body ?? "", rating: r.rating,
      image_url: r.images?.[0] ?? r.products?.images?.[0] ?? null, product_name: r.products?.name ?? null,
      product_url: r.products ? `/products/${r.products.slug}` : null, verified: r.verified, source_review_id: r.id, published: true, sort_order: 0,
    }).select("id").single();
    if (error || !t) { setBusy(null); toast.error(error?.message ?? "Could not feature"); return; }
    await supabase.from("product_reviews").update({ testimonial_id: t.id, status: "published" }).eq("id", r.id);
    setBusy(null); patch(r.id, { testimonial_id: t.id, status: "published" }); toast.success("Added to the homepage testimonials");
  };
  const unfeature = async (r: ReviewRow) => {
    setBusy(r.id);
    if (r.testimonial_id) await supabase.from("testimonials").delete().eq("id", r.testimonial_id);
    await supabase.from("product_reviews").update({ testimonial_id: null }).eq("id", r.id);
    setBusy(null); patch(r.id, { testimonial_id: null }); toast.success("Removed from the homepage");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(([k, l]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
            {l} ({rows.filter((r) => k === "all" || r.status === k).length})
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Homepage group</span>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-8 rounded border bg-background px-2">
            <option value="">Create &quot;Homepage reviews&quot;</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>
      {shown.length === 0 && <p className="text-sm text-muted-foreground py-10 text-center">No reviews here.</p>}
      {shown.map((r) => (
        <div key={r.id} className="border rounded-lg p-4 flex gap-4">
          {r.products?.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.products.images[0]} alt="" className="w-14 h-14 rounded object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className="w-3.5 h-3.5" style={{ color: "#D4A72C", fill: n <= r.rating ? "#D4A72C" : "transparent" }} />)}</span>
              <b>{r.reviewer_name}</b>
              {r.verified && <span className="text-[11px] text-green-700">Verified buyer</span>}
              <span className="text-xs text-muted-foreground">{r.reviewer_email} · {new Date(r.created_at).toLocaleDateString()}</span>
              <span className="text-xs rounded bg-muted px-1.5 py-0.5">{r.status}</span>
              {r.testimonial_id && <span className="text-xs rounded bg-primary/10 text-primary px-1.5 py-0.5">On homepage</span>}
            </div>
            <p className="text-xs text-muted-foreground">On: {r.products?.name ?? "deleted product"}</p>
            {r.body && <p className="text-sm whitespace-pre-line">{r.body}</p>}
            {r.images?.length > 0 && (
              <div className="flex gap-2">
                {r.images.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="w-14 h-14 rounded object-cover border" />
                  </a>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1 items-center">
              {busy === r.id && <Loader2 className="w-4 h-4 animate-spin" />}
              {r.status !== "published" && <Button size="sm" variant="outline" className="gap-1" onClick={() => setStatus(r, "published")}><Check className="w-3.5 h-3.5" />Approve</Button>}
              {r.status === "published" && <Button size="sm" variant="outline" className="gap-1" onClick={() => setStatus(r, "hidden")}><EyeOff className="w-3.5 h-3.5" />Hide</Button>}
              {r.testimonial_id
                ? <Button size="sm" variant="outline" className="gap-1" onClick={() => unfeature(r)}><Home className="w-3.5 h-3.5" />Remove from homepage</Button>
                : <Button size="sm" className="gap-1" onClick={() => feature(r)}><Home className="w-3.5 h-3.5" />Show on homepage</Button>}
              <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => remove(r)}><Trash2 className="w-3.5 h-3.5" />Delete</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
