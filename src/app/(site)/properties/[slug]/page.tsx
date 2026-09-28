import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { BedDouble, Bath, Maximize, MapPin, Calendar, Home, Sofa, Check, Building2, PlayCircle, Hash } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { bedsLabel, titleCase, LISTING_TYPE_LABEL, areaLabel, type ReProperty } from "@/lib/real-estate/format";
import { PropertyCard } from "@/components/blocks/real-estate/shared";
import { Gallery, PriceHeader, PaymentPlan, LocationMap, AgentCard, MobileContact, type AgentInfo } from "./property-client";

interface Props { params: Promise<{ slug: string }> }

const COLS = "*, community:re_communities(name, slug), developer:re_developers(name, slug, logo_url, description)";

async function load(slug: string) {
  const tenantId = (await headers()).get("x-tenant-id");
  if (!tenantId) return null;
  const admin = await createAdminClient();
  const { data } = await admin.from("re_properties").select(COLS)
    .eq("tenant_id", tenantId).eq("slug", slug).neq("status", "draft").maybeSingle();
  return data ? { p: data as ReProperty & { community_id: string | null; developer: (ReProperty["developer"] & { description?: string | null }) | null; seo_title: string | null; seo_description: string | null }, tenantId, admin } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await load((await params).slug);
  if (!r) return { title: "Property not found" };
  const { p } = r;
  const title = p.seo_title || p.title;
  const description = p.seo_description || p.summary || undefined;
  const og: NonNullable<Metadata["openGraph"]> = { title };
  if (description) og.description = description;
  if (p.images?.[0]) og.images = [{ url: p.images[0] }];
  return { title, ...(description ? { description } : {}), openGraph: og };
}

export default async function PropertyPage({ params }: Props) {
  const r = await load((await params).slug);
  if (!r) notFound();
  const { p, tenantId, admin } = r;

  const [{ data: settings }, { data: identity }, { data: similar }] = await Promise.all([
    admin.from("re_settings").select("agent_name, agent_title, agent_photo, whatsapp, phone, licence_text, brochure_gate").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("site_identity").select("site_name").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("re_properties").select(COLS).eq("tenant_id", tenantId).neq("status", "draft").neq("id", p.id)
      .eq("listing_type", p.listing_type).order("featured", { ascending: false }).limit(3),
  ]);

  const agent: AgentInfo = {
    agent_name: settings?.agent_name ?? null, agent_title: settings?.agent_title ?? null, agent_photo: settings?.agent_photo ?? null,
    whatsapp: settings?.whatsapp ?? null, phone: settings?.phone ?? null, licence_text: settings?.licence_text ?? null,
    brochure_gate: settings?.brochure_gate ?? true,
  };
  const place = [p.community?.name, p.city, p.country].filter(Boolean).join(", ");

  const facts = [
    { icon: Home, label: "Type", value: titleCase(p.property_type) },
    p.beds != null && { icon: BedDouble, label: "Bedrooms", value: bedsLabel(p.beds, p.beds_max) },
    p.baths != null && { icon: Bath, label: "Bathrooms", value: String(p.baths) },
    p.area != null && { icon: Maximize, label: "Area", value: areaLabel(p.area, p.area_unit) },
    p.furnishing && { icon: Sofa, label: "Furnishing", value: titleCase(p.furnishing) },
    p.handover && { icon: Calendar, label: "Handover", value: p.handover },
    p.reference && { icon: Hash, label: "Reference", value: p.reference },
  ].filter(Boolean) as { icon: typeof Home; label: string; value: string }[];

  const yt = p.video_url?.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: p.summary ?? undefined,
    image: p.images?.slice(0, 5),
    url: `/properties/${p.slug}`,
    ...(p.price != null && !p.price_on_request ? { offers: { "@type": "Offer", price: Number(p.price), priceCurrency: p.currency, availability: p.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut" } } : {}),
    ...(p.lat != null && p.lng != null ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } } : {}),
    address: { "@type": "PostalAddress", addressLocality: p.city ?? undefined, addressCountry: p.country ?? undefined },
  };

  return (
    <div className="px-4 py-8 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="max-w-7xl mx-auto">
        <nav className="text-sm text-muted-foreground mb-4 flex flex-wrap gap-1.5">
          <a href="/" className="hover:text-foreground">Home</a><span>/</span>
          <a href={`/properties?type=${p.listing_type}`} className="hover:text-foreground">{LISTING_TYPE_LABEL[p.listing_type]}</a>
          {p.community && <><span>/</span><a href={`/communities/${p.community.slug}`} className="hover:text-foreground">{p.community.name}</a></>}
        </nav>

        <Gallery images={p.images ?? []} title={p.title} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-10">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">{LISTING_TYPE_LABEL[p.listing_type]}</span>
                {p.status !== "available" && <span className="px-3 py-1 rounded-full text-xs font-semibold bg-foreground text-background">{titleCase(p.status)}</span>}
                {p.developer && <span className="px-3 py-1 rounded-full text-xs font-medium border">by {p.developer.name}</span>}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{p.title}</h1>
              {place && <p className="mt-2 text-muted-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4" />{place}</p>}
              <div className="mt-6"><PriceHeader p={p} /></div>
              <div className="mt-5"><MobileContact p={p} agent={agent} /></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
                  <f.icon className="w-5 h-5 text-primary shrink-0" />
                  <div><p className="text-xs text-muted-foreground">{f.label}</p><p className="font-semibold">{f.value}</p></div>
                </div>
              ))}
            </div>

            {p.highlights?.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Highlights</h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {p.highlights.map((h) => <li key={h} className="flex gap-3"><Check className="w-5 h-5 text-primary shrink-0" /><span>{h}</span></li>)}
                </ul>
              </section>
            )}

            {p.description && (
              <section>
                <h2 className="text-xl font-bold mb-4">About this property</h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{p.description}</div>
              </section>
            )}

            {p.payment_plan?.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Payment plan</h2>
                <PaymentPlan plan={p.payment_plan} />
              </section>
            )}

            {p.amenities?.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {p.amenities.map((a) => <span key={a} className="px-3.5 py-2 rounded-full border bg-card text-sm">{a}</span>)}
                </div>
              </section>
            )}

            {yt && (
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PlayCircle className="w-5 h-5" />Video tour</h2>
                <div className="aspect-video rounded-2xl overflow-hidden border">
                  <iframe src={`https://www.youtube.com/embed/${yt}`} title="Video tour" className="w-full h-full" allowFullScreen loading="lazy" />
                </div>
              </section>
            )}
            {p.tour_url && (
              <a href={p.tour_url} target="_blank" rel="noreferrer" className="inline-flex h-11 px-5 rounded-full border items-center font-medium hover:bg-muted">Open 360° virtual tour</a>
            )}

            {p.floor_plans?.length > 0 && (
              <section>
                <h2 className="text-xl font-bold mb-4">Floor plans</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.floor_plans.map((f) => <a key={f} href={f} target="_blank" rel="noreferrer"><img src={f} alt="Floor plan" className="rounded-2xl border bg-white w-full" /></a>)}
                </div>
              </section>
            )}

            {p.lat != null && p.lng != null && (
              <section>
                <h2 className="text-xl font-bold mb-4">Location</h2>
                <LocationMap lat={p.lat} lng={p.lng} title={p.title} />
              </section>
            )}

            {p.developer?.description && (
              <section className="rounded-2xl border bg-card p-6 flex gap-4">
                <Building2 className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <p className="font-semibold">About {p.developer.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{p.developer.description}</p>
                  <a href={`/properties?developer=${p.developer.slug}`} className="text-sm text-primary font-medium mt-2 inline-block">More projects by {p.developer.name} →</a>
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <AgentCard p={p} agent={agent} siteName={identity?.site_name ?? ""} />
          </aside>
        </div>

        {similar && similar.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Similar properties</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(similar as ReProperty[]).map((s) => <PropertyCard key={s.id} p={s} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
