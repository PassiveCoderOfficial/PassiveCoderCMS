import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/tenant/site-urls";

/**
 * Everything machines should know about a site's business, gathered once
 * and reused by the structured data (JSON-LD), /llms.txt and the AI
 * visibility checklist. AI answer engines (Google AI Overviews, ChatGPT
 * search, Copilot, Claude, Perplexity) quote sites that state these facts
 * plainly and consistently.
 *
 * Sources, best first: the business profile, then site settings/identity,
 * then contact links already on the site's header and footer, then the
 * Services manager. Only facts the owner entered are used; nothing is
 * guessed or invented.
 */
export type SiteFacts = {
  tenantId: string;
  name: string;
  url: string;
  description: string | null;
  about: string | null;
  logo: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  country: string | null;
  areas: string[];
  primaryService: string | null;
  services: { name: string; description?: string | null }[];
  founded: number | null;
  sameAs: string[];
  pages: { title: string; path: string; description?: string | null }[];
  language: string | null;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const names = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : str((x as { name?: unknown })?.name) ?? "")).filter(Boolean) as string[] : [];

/** tel:, mailto:, wa.me and social links already present in the header/footer blocks. */
function linksFrom(blocks: unknown) {
  const s = JSON.stringify(blocks ?? "");
  const tel = s.match(/tel:(\+?[\d\s()-]{6,20})/)?.[1]?.replace(/\s+/g, "") ?? null;
  const mail = s.match(/mailto:([^"\\?\s]+@[^"\\?\s]+)/)?.[1] ?? null;
  const wa = s.match(/wa\.me\/(\d{6,15})/)?.[1] ?? null;
  const social = [...new Set((s.match(/https?:\/\/(?:www\.)?(?:facebook|instagram|linkedin|x|twitter|youtube|tiktok)\.com\/[^"\\\s]+/g) ?? []))].slice(0, 8);
  return { tel, mail, wa, social };
}

export const getSiteFacts = cache(async (tenantId: string): Promise<SiteFacts | null> => {
  const admin = await createAdminClient();
  const [{ data: t }, { data: settings }, { data: identity }, { data: profile }, { data: svc }, { data: pages }] = await Promise.all([
    admin.from("tenants").select("id, name, slug, custom_domain, domain_status, created_at").eq("id", tenantId).maybeSingle(),
    admin.from("site_settings").select("site_name, site_description, meta_description, logo_url, language").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("site_identity").select("site_name, tagline, logo_url, global_header, global_footer").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("tenant_business_profiles").select("*").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("service_items").select("title, description, sort_order").eq("tenant_id", tenantId).order("sort_order").limit(30),
    admin.from("pages").select("title, slug, seo, type").eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null)
      .in("type", ["page", "landing"]).order("order_index").limit(40),
  ]);
  if (!t) return null;
  const site = { slug: t.slug as string, custom_domain: t.domain_status === "active" ? (t.custom_domain as string | null) : null };
  const links = linksFrom([identity?.global_header, identity?.global_footer]);

  const profileServices = Array.isArray(profile?.services)
    ? (profile!.services as unknown[]).map((x) => typeof x === "string"
      ? { name: x }
      : { name: str((x as { name?: unknown }).name) ?? "", description: str((x as { description?: unknown }).description) }).filter((x) => x.name)
    : [];
  const services = profileServices.length
    ? profileServices
    : (svc ?? []).map((s) => ({ name: String(s.title ?? ""), description: str(s.description) })).filter((s) => s.name);

  return {
    tenantId,
    name: str(profile?.business_name) ?? str(identity?.site_name) ?? str(settings?.site_name) ?? (t.name as string),
    url: publicUrl(site, "/").replace(/\/$/, ""),
    description: str(settings?.meta_description) ?? str(settings?.site_description) ?? str(identity?.tagline),
    about: str(profile?.about),
    logo: str(identity?.logo_url) ?? str(settings?.logo_url),
    phone: str(profile?.phone) ?? links.tel,
    whatsapp: str(profile?.whatsapp) ?? links.wa,
    email: str(profile?.email) ?? links.mail,
    address: str(profile?.office_address),
    country: str(profile?.country_code),
    areas: names(profile?.service_areas),
    primaryService: str(profile?.primary_service),
    services: services.slice(0, 30),
    founded: typeof profile?.years_operating === "number" && profile.years_operating > 0
      ? new Date().getFullYear() - profile.years_operating : null,
    sameAs: [...links.social, ...(str(profile?.enm_profile_link) ? [profile!.enm_profile_link as string] : [])],
    pages: (pages ?? []).map((p) => ({
      title: String(p.title ?? ""),
      path: p.slug === "home" ? "/" : `/${p.slug}`,
      description: str((p.seo as { description?: unknown } | null)?.description),
    })).filter((p) => p.title),
    language: str(settings?.language),
  };
});
