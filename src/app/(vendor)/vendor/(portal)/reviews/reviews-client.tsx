"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Stars } from "@/components/marketplace-ecom/stars";

interface Row {
  id: string;
  reviewer_name: string;
  rating: number;
  body: string | null;
  tags: string[];
  images: string[];
  seller_reply: string | null;
  created_at: string;
  products: { name: string; slug: string; images: string[] | null } | null;
}

export function ReviewsClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vendor/reviews").then((r) => r.json()).then((j) => setRows(j.reviews ?? []));
  }, []);

  async function reply(id: string) {
    setSaving(id);
    const text = drafts[id] ?? "";
    const r = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: text }),
    });
    setSaving(null);
    if (r.ok) setRows((v) => v?.map((x) => (x.id === id ? { ...x, seller_reply: text || null } : x)) ?? null);
  }

  if (!rows) return <Loader2 className="w-5 h-5 animate-spin" />;
  if (!rows.length)
    return <p className="text-sm text-muted-foreground bg-background border rounded-xl p-6">No reviews yet. Buyers are asked to review automatically when you mark an order delivered.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="bg-background border rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Stars value={r.rating} />
            <span className="font-medium">{r.reviewer_name}</span>
            <span className="text-muted-foreground">on</span>
            {r.products && (
              <Link href={`/products/${r.products.slug}#reviews`} className="text-primary truncate" target="_blank">
                {r.products.name}
              </Link>
            )}
            <span className="ml-auto text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          {r.tags.length > 0 && <p className="text-xs text-muted-foreground">{r.tags.join(" · ")}</p>}
          {r.body && <p className="text-sm whitespace-pre-wrap">{r.body}</p>}
          {r.images.length > 0 && (
            <div className="flex gap-2">
              {r.images.map((s) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s} src={s} alt="" className="w-16 h-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <input
              defaultValue={r.seller_reply ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
              placeholder="Write a public reply…"
              className="flex-1 h-9 rounded-lg border bg-background px-3 text-sm"
            />
            <button
              onClick={() => reply(r.id)}
              disabled={saving === r.id || drafts[r.id] === undefined}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {saving === r.id ? "Saving…" : r.seller_reply ? "Update" : "Reply"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
