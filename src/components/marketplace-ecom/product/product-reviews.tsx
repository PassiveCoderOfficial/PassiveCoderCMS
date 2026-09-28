"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Camera, Loader2, MessageSquareQuote, PenLine, Star, Store, X } from "lucide-react";
import { Stars } from "../stars";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  body: string | null;
  tags: string[];
  images: string[];
  seller_reply: string | null;
  seller_replied_at: string | null;
  created_at: string;
}
interface Summary {
  average: number;
  count: number;
  distribution: Record<string, number>;
  tags: { tag: string; count: number }[];
  with_media: number;
}
interface Payload {
  summary: Summary;
  reviews: Review[];
  has_more: boolean;
  signed_in: boolean;
  can_review: string[];
  tags: string[];
}

/**
 * Verified-purchase reviews. Always visible; writing one needs sign-in and a
 * delivered order containing this product. No placeholder reviews — an empty
 * product says so and invites the first buyer.
 */
export function ProductReviews({ productId, openForm = false }: { productId: string; openForm?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);

  const load = useCallback(
    async (f: string, p: number) => {
      setLoading(true);
      const r = await fetch(`/api/reviews?product_id=${productId}&page=${p}${f ? `&filter=${f}` : ""}`);
      const j = (await r.json()) as Payload;
      setData(j);
      setItems((prev) => (p === 1 ? j.reviews : [...prev, ...j.reviews]));
      setLoading(false);
      return j;
    },
    [productId],
  );

  useEffect(() => {
    load("", 1).then((j) => {
      if (openForm && j.can_review.length) setWriting(true);
    });
  }, [load, openForm]);

  function pick(f: string) {
    setFilter(f);
    setPage(1);
    load(f, 1);
  }

  function startWriting() {
    setNotice(null);
    if (!data?.signed_in) {
      location.assign(`/account/login?next=${encodeURIComponent(location.pathname + "?review=1")}&reason=review`);
      return;
    }
    if (!data.can_review.length) {
      setNotice("Reviews are from verified buyers only. Once your order of this item is delivered, you can review it here.");
      return;
    }
    setWriting(true);
  }

  const s = data?.summary;

  return (
    <section id="reviews" className="bg-white sm:rounded-2xl p-4 sm:p-6 scroll-mt-28">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-bold text-[#1A1330]">Ratings & reviews</h2>
        {s && s.count > 0 && <span className="text-sm text-[#667085]">({s.count})</span>}
        <button
          onClick={startWriting}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF5A1F] border border-[#FF5A1F] rounded-full px-4 py-1.5 hover:bg-[#FFF1EB]"
        >
          <PenLine className="w-4 h-4" /> Write a review
        </button>
      </div>

      {notice && (
        <p className="mb-4 text-sm rounded-xl bg-[#FFF6F2] border border-[#FFE4D6] text-[#9A3412] px-4 py-3">{notice}</p>
      )}

      {writing && data && (
        <ReviewForm
          productId={productId}
          subOrderId={data.can_review[0]}
          tags={data.tags}
          onCancel={() => setWriting(false)}
          onDone={() => {
            setWriting(false);
            setNotice("Thanks! Your review is live.");
            pick("");
          }}
        />
      )}

      {!s ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#FF5A1F]" /></div>
      ) : s.count === 0 ? (
        <div className="rounded-xl border border-dashed border-[#D0D5DD] py-8 px-4 text-center">
          <MessageSquareQuote className="w-8 h-8 mx-auto text-[#D0D5DD]" />
          <p className="mt-2 font-semibold text-[#1A1330]">No reviews yet</p>
          <p className="text-sm text-[#667085] mt-1">Bought this? Be the first to share your experience.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-[200px_1fr] gap-6 rounded-xl bg-[#FFF6F2] p-4 sm:p-5">
            <div className="text-center sm:border-r border-[#FFE4D6]">
              <p className="text-5xl font-extrabold text-[#FF5A1F]">{s.average.toFixed(1)}<span className="text-lg text-[#98A2B3]">/5</span></p>
              <div className="mt-1"><Stars value={s.average} size={18} /></div>
              <p className="text-xs text-[#667085] mt-1">{s.count} verified rating{s.count === 1 ? "" : "s"}</p>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => {
                const c = s.distribution[r] ?? 0;
                return (
                  <div key={r} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-[#667085]">{r}</span>
                    <Star className="w-3 h-3 text-[#FFB400] fill-[#FFB400]" />
                    <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
                      <div className="h-full bg-[#FFB400]" style={{ width: `${(c / s.count) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-[#667085]">{c}</span>
                  </div>
                );
              })}
              {s.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {s.tags.slice(0, 4).map((t) => (
                    <span key={t.tag} className="text-xs bg-white border border-[#EAECF0] rounded-full px-3 py-1 text-[#1A1330]">
                      {t.tag} <span className="text-[#98A2B3]">({t.count})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto py-4 [scrollbar-width:none]">
            {[
              ["", "All"],
              ["5", "5 Star"],
              ["4", "4 Star"],
              ["3", "3 Star"],
              ["2", "2 Star"],
              ["1", "1 Star"],
              ["media", `With photos (${s.with_media})`],
            ].map(([k, l]) => (
              <button
                key={k}
                onClick={() => pick(k)}
                className={`shrink-0 text-sm px-4 py-1.5 rounded-full border ${filter === k ? "border-[#FF5A1F] text-[#FF5A1F] bg-[#FFF1EB]" : "border-[#EAECF0] text-[#344054]"}`}
              >
                {l}
              </button>
            ))}
          </div>

          <ul className="divide-y divide-[#F2F4F7]">
            {items.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#FFF1EB] text-[#FF5A1F] font-bold text-sm flex items-center justify-center">
                    {r.reviewer_name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1330]">{r.reviewer_name}</p>
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} size={12} />
                      <span className="text-[11px] text-[#16A34A] flex items-center gap-0.5"><BadgeCheck className="w-3 h-3" /> Verified purchase</span>
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-[#98A2B3]">{new Date(r.created_at).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-10">
                    {r.tags.map((t) => (
                      <span key={t} className="text-[11px] bg-[#F2F4F7] text-[#344054] rounded px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
                {r.body && <p className="mt-2 ml-10 text-sm text-[#344054] whitespace-pre-wrap">{r.body}</p>}
                {r.images.length > 0 && (
                  <div className="flex gap-2 mt-2 ml-10 flex-wrap">
                    {r.images.map((src) => (
                      <button key={src} onClick={() => setZoom(src)} className="w-20 h-20 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="Review photo" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                {r.seller_reply && (
                  <div className="mt-3 ml-10 rounded-lg bg-[#F9FAFB] border-l-2 border-[#FF5A1F] px-3 py-2">
                    <p className="text-xs font-semibold text-[#1A1330] flex items-center gap-1"><Store className="w-3 h-3" /> Seller response</p>
                    <p className="text-sm text-[#344054] mt-0.5 whitespace-pre-wrap">{r.seller_reply}</p>
                  </div>
                )}
              </li>
            ))}
            {items.length === 0 && !loading && <li className="py-6 text-center text-sm text-[#98A2B3]">No reviews match this filter.</li>}
          </ul>
          {data?.has_more && (
            <button
              onClick={() => { const p = page + 1; setPage(p); load(filter, p); }}
              disabled={loading}
              className="w-full mt-2 py-2.5 text-sm font-semibold text-[#FF5A1F] border border-[#EAECF0] rounded-xl hover:bg-[#FFF6F2]"
            >
              {loading ? "Loading…" : "See more reviews"}
            </button>
          )}
        </>
      )}

      {zoom && (
        <button onClick={() => setZoom(null)} className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" aria-label="Close">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-lg" />
        </button>
      )}
    </section>
  );
}

function ReviewForm({
  productId, subOrderId, tags, onCancel, onDone,
}: { productId: string; subOrderId: string; tags: string[]; onCancel: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const labels = ["", "Terrible", "Poor", "Okay", "Good", "Excellent"];

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].slice(0, 6 - images.length);
    e.target.value = "";
    setUploading(true);
    try {
      for (const f of files) {
        const fd = new FormData();
        fd.append("file", f);
        fd.append("kind", "review");
        const r = await fetch("/api/chat/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setImages((v) => [...v, j.url]);
      }
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!rating) return setErr("Tap a star to rate");
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, sub_order_id: subOrderId, rating, body, tags: picked, images }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? "Couldn't post review");
    onDone();
  }

  return (
    <div className="mb-6 rounded-xl border border-[#FFE4D6] bg-[#FFFBF9] p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)} aria-label={`${i} stars`}>
              <Star className={`w-8 h-8 ${(hover || rating) >= i ? "text-[#FFB400] fill-[#FFB400]" : "text-[#D0D5DD]"}`} />
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-[#1A1330]">{labels[hover || rating]}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setPicked((v) => (v.includes(t) ? v.filter((x) => x !== t) : [...v, t]))}
            className={`text-xs px-3 py-1.5 rounded-full border ${picked.includes(t) ? "border-[#FF5A1F] bg-[#FFF1EB] text-[#FF5A1F]" : "border-[#EAECF0] text-[#344054] bg-white"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="What did you like or dislike? How was the quality and delivery?"
        className="w-full rounded-xl border border-[#EAECF0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25"
      />
      <div className="flex flex-wrap gap-2">
        {images.map((src) => (
          <span key={src} className="relative w-16 h-16 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setImages((v) => v.filter((x) => x !== src))} className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5" aria-label="Remove">
              <X className="w-3 h-3 text-white" />
            </button>
          </span>
        ))}
        {images.length < 6 && (
          <button onClick={() => fileRef.current?.click()} className="w-16 h-16 rounded-lg border border-dashed border-[#D0D5DD] flex flex-col items-center justify-center text-[#667085] text-[10px]">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Photo
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={upload} />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-[#667085]">Cancel</button>
        <button onClick={submit} disabled={busy || uploading} className="px-5 py-2 rounded-full bg-[#FF5A1F] text-white text-sm font-bold disabled:opacity-50">
          {busy ? "Posting…" : "Post review"}
        </button>
      </div>
    </div>
  );
}
