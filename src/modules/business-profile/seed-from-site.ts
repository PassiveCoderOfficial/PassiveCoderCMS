import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "@/types/cms";

/**
 * A first-time business-profile visit showed a completely blank form asking
 * the tenant to retype their business name, services, phone, email and
 * address — data that, for any tenant whose site was actually built (staff
 * build, AiCoder, or manual), already sits in their own pages. Reported
 * live: sgpfloorrepair.com has 13 real pages with real services and contact
 * info, yet the wizard opened blank.
 *
 * This derives a best-effort seed straight from what the tenant already
 * published — never invented. Deliberately excludes owner_name,
 * years_operating, customers_served, projects_completed and about: nothing
 * on a site reliably carries those as clean, single values, and per the
 * API's own rule a blank field must stay blank rather than a guess. Only
 * used when no tenant_business_profiles row exists yet — a tenant who has
 * already filled or edited their profile is never overwritten by this.
 */
export interface SeedResult {
  business_name: string | null;
  primary_service: string | null;
  services: string[];
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  office_address: string | null;
}

function firstNonEmpty(...vals: (string | null | undefined)[]): string | null {
  for (const v of vals) {
    if (v && v.trim()) return v.trim();
  }
  return null;
}

/** Strips a leading emoji + following space some templates prefix onto
 *  service titles (e.g. "🪵 Vinyl & Laminate Repair") — not part of the
 *  actual service name. */
function stripLeadingEmoji(s: string): string {
  return s.replace(/^\p{Extended_Pictographic}️?\s*/u, "").trim();
}

/** The real business name most reliably lives in the header's logo text —
 *  either the legacy "navigation" block's logoText, or a "header_logo"
 *  sub-block's text, which can be nested inside a container's columns
 *  (see this session's header sub-block migration). A page's own hero
 *  title is usually a tagline ("We Repair, You Relax"), not the business
 *  name — found live checking a real seed, so this must be tried first. */
function findHeaderLogoText(globalHeader: unknown): string | null {
  if (!Array.isArray(globalHeader)) return null;
  const blocks: Block[] = [];
  for (const b of globalHeader as Block[]) {
    blocks.push(b);
    const columns = (b as { data?: { columns?: { blocks?: Block[] }[] } }).data?.columns;
    if (columns) for (const col of columns) blocks.push(...(col.blocks ?? []));
  }
  for (const b of blocks) {
    if (b.type === "navigation" || b.type === "header_logo") {
      const data = (b as { data?: { logoText?: string; text?: string } }).data;
      const text = data?.logoText ?? data?.text;
      if (text && text.trim() && text.trim() !== "Brand") return text.trim();
    }
  }
  return null;
}

export async function seedBusinessProfileFromSite(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<SeedResult> {
  const [{ data: settings }, { data: pages }, { data: identity }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("site_name, site_description")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    supabase
      .from("pages")
      .select("slug, blocks")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabase
      .from("site_identity")
      .select("global_header, global_footer")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
  ]);

  const allBlocks: Block[] = ((pages ?? []) as { slug: string; blocks: Block[] }[])
    .flatMap((p) => p.blocks ?? []);

  const heroBlock = allBlocks.find((b) => b.type === "hero") as
    | { data?: { title?: string; subtitle?: string } }
    | undefined;
  const contactBlock = allBlocks.find((b) => b.type === "contact") as
    | { data?: { email?: string; phone?: string; whatsapp?: string; address?: string } }
    | undefined;
  const servicesBlock = allBlocks.find((b) => b.type === "services") as
    | { data?: { items?: { title?: string; description?: string }[]; subtitle?: string } }
    | undefined;
  const footerBlock = allBlocks.find((b) => b.type === "footer") as
    | { data?: { logoText?: string } }
    | undefined;

  // "My CMS Site" / "" is the untouched default site_settings row every new
  // tenant starts with — not real data, must not be seeded as if it were.
  const rawSiteName = settings?.site_name?.trim();
  const siteNameIsDefault = !rawSiteName || rawSiteName === "My CMS Site";

  const business_name = firstNonEmpty(
    findHeaderLogoText(identity?.global_header),
    siteNameIsDefault ? null : rawSiteName,
    footerBlock?.data?.logoText,
    heroBlock?.data?.title,
  );

  const services = (servicesBlock?.data?.items ?? [])
    .map((it) => (it.title ? stripLeadingEmoji(it.title) : null))
    .filter((t): t is string => !!t)
    .slice(0, 30);

  const primary_service = firstNonEmpty(servicesBlock?.data?.subtitle, services[0]);

  return {
    business_name,
    primary_service,
    services,
    phone: firstNonEmpty(contactBlock?.data?.phone),
    whatsapp: firstNonEmpty(contactBlock?.data?.whatsapp),
    email: firstNonEmpty(contactBlock?.data?.email),
    office_address: firstNonEmpty(contactBlock?.data?.address),
  };
}
