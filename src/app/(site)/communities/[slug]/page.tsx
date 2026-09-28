import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { Check, TrendingUp, Wallet } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/real-estate/format";
import { ReListingsBlock } from "@/components/blocks/real-estate/re-listings-block";
import { ReLeadFormBlock } from "@/components/blocks/real-estate/re-lead-form-block";
import type { ReListingsBlockProps, ReLeadFormBlockProps } from "@/types/cms";

interface Props { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return null;
  const admin = await createAdminClient();
  const { data } = await admin.from("re_communities").select("*").eq("tenant_id", tenantId).eq("slug", slug).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load((await params).slug);
  if (!c) return { title: "Area not found" };
  const title = `${c.name}${c.city ? `, ${c.city}` : ""}: area guide & properties`;
  return { title, ...(c.summary ? { description: c.summary } : {}), openGraph: { title, ...(c.summary ? { description: c.summary } : {}), ...(c.image_url ? { images: [{ url: c.image_url }] } : {}) } };
}

const base = {
  order: 0, visible: true, width: "full" as const,
  padding: { top: 72, right: 24, bottom: 72, left: 24 }, margin: { top: 0, right: 0, bottom: 0, left: 0 }, background: { type: "none" as const },
};

export default async function CommunityPage({ params }: Props) {
  const c = await load((await params).slug);
  if (!c) notFound();

  const listings = { ...base, id: "community-listings", type: "re_listings", data: { title: `Properties in ${c.name}`, communitySlug: c.slug, showFilters: true, limit: 9, columns: 3 } } as ReListingsBlockProps;
  const lead = { ...base, id: "community-lead", type: "re_lead_form", data: { title: `Looking in ${c.name}?`, subtitle: "Tell us your budget and we'll send options, including off-market ones.", kind: "consultation", submitLabel: "Get options on WhatsApp", showBudget: true, bullets: ["Shortlist within 24 hours", "Off-market and pre-launch access", "No fees for buyers on off-plan"] } } as ReLeadFormBlockProps;

  return (
    <div>
      <section className="relative isolate min-h-[420px] flex items-end px-4 py-14 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {c.image_url && <img src={c.image_url} alt={c.name} className="absolute inset-0 -z-20 w-full h-full object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="max-w-7xl mx-auto w-full">
          <p className="text-sm uppercase tracking-widest text-white/75">{[c.city, c.country].filter(Boolean).join(" · ")}</p>
          <h1 className="text-4xl sm:text-6xl font-bold mt-2">{c.name}</h1>
          {c.summary && <p className="mt-4 max-w-2xl text-lg text-white/85">{c.summary}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {c.avg_price != null && <span className="px-4 py-2 rounded-full bg-white/15 backdrop-blur flex items-center gap-2"><Wallet className="w-4 h-4" />Avg {formatMoney(Number(c.avg_price), c.currency ?? "SAR", true)}</span>}
            {c.rental_yield != null && <span className="px-4 py-2 rounded-full bg-white/15 backdrop-blur flex items-center gap-2"><TrendingUp className="w-4 h-4" />{c.rental_yield}% gross yield</span>}
          </div>
        </div>
      </section>

      {(c.description || c.highlights?.length) && (
        <section className="px-4 py-14">
          <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            {c.description && <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{c.description}</div>}
            {c.highlights?.length > 0 && (
              <div className="rounded-3xl border bg-card p-6">
                <p className="font-semibold mb-4">Why {c.name}</p>
                <ul className="space-y-3">{(c.highlights as string[]).map((h) => <li key={h} className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0" />{h}</li>)}</ul>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="py-16 sm:py-20"><ReListingsBlock block={listings} /></div>
      <div className="bg-muted/40 py-16 sm:py-20"><ReLeadFormBlock block={lead} /></div>
    </div>
  );
}
