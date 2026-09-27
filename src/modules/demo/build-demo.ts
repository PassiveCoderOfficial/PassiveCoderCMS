/**
 * One-minute demo site builder.
 *
 * Staff (or a super admin) enter a prospect's name, WhatsApp and services
 * while chatting with them, and get back a live personalised site to send in
 * the same WhatsApp thread. The prospect pays manually (bank / bKash) and the
 * demo goes live; until then it carries a "demo" banner and pauses after
 * DEMO_DAYS. Nothing is ever deleted.
 *
 * Deliberately NOT the AI build: that takes minutes per page. This applies a
 * category template for the look (theme mode only) and writes one honest home
 * page from what was entered: no invented stats, prices, reviews or years in
 * business, which the full template pages are full of.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "@/types/cms";
import { applyTemplateBySlug } from "@/modules/templates/apply-by-slug";
import { findStockImage } from "@/lib/aicoder/images";
import { ROOT_DOMAIN } from "@/lib/flags";
import { normalizeWhatsapp, waLink } from "./links";

export const DEMO_DAYS = 14;
export { DEMO_SALES_WHATSAPP, normalizeWhatsapp, waLink } from "./links";

export interface DemoInput {
  name: string;
  slug: string;
  templateSlug: string;
  whatsapp: string;
  services: string[];
  logoUrl?: string | null;
  address?: string | null;
  tagline?: string | null;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const BASE = {
  visible: true as const,
  width: "full" as const,
  padding: { top: 80, right: 0, bottom: 80, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" as const },
};


/** Splits a free-text services field (lines or commas) into clean titles. */
export function parseServices(raw: string | string[]): string[] {
  const list = Array.isArray(raw) ? raw : raw.split(/[\n,]+/);
  return list.map((s) => s.trim()).filter(Boolean).slice(0, 9);
}

function joinNice(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, 2).join(", ")} and more`;
}

export async function buildDemoBlocks(input: DemoInput, category: string): Promise<Block[]> {
  const wa = waLink(input.whatsapp, `Hi ${input.name}, I found your website and would like a quote.`);
  const hint = category && category !== "General Business" ? category : "";

  const [heroImg, ...serviceImgs] = await Promise.all([
    findStockImage(`${input.services[0] ?? ""} ${hint}`.trim() || input.name, "landscape"),
    ...input.services.map((s) => findStockImage(`${s} ${hint}`.trim(), "landscape")),
  ]);

  const subtitle = input.tagline?.trim()
    || `${joinNice(input.services)}${input.address ? ` in ${input.address.split(",").slice(-1)[0].trim()}` : ""}. Fast response, clear quotes, reliable work.`;

  let o = 0;
  const blocks: Block[] = [];

  blocks.push({
    ...BASE, id: uid("nav"), type: "navigation", order: o++,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    data: {
      logoText: input.name,
      items: [],
      sticky: true, transparent: false, style: "default", showCta: true, ctaLabel: "WhatsApp Us", ctaUrl: wa,
    },
  } as unknown as Block);

  blocks.push({
    ...BASE, id: uid("hero"), type: "hero", order: o++,
    templateVariant: "centered-dark",
    background: heroImg
      ? { type: "image", imageUrl: heroImg.url, imageOverlay: "#000000", imageOverlayOpacity: 0.55 }
      : { type: "none" },
    data: {
      layout: "centered",
      title: input.name,
      subtitle,
      description: "",
      imageAlt: heroImg?.alt ?? "",
      primaryButton: { label: "Chat on WhatsApp", url: wa, variant: "primary" },
      typography: { titleSize: "6xl", titleColor: "", subtitleColor: "", descColor: "" },
    },
  } as unknown as Block);

  blocks.push({
    ...BASE, id: uid("services"), type: "services", order: o++,
    templateVariant: "icon-cards-grid",
    data: {
      title: "Our Services",
      subtitle: "Message us on WhatsApp for a free quote",
      layout: "grid", source: "inline", cardStyle: "elevated",
      columns: input.services.length % 3 === 0 || input.services.length > 4 ? 3 : 2,
      items: input.services.map((s, i) => ({
        id: uid("svc"),
        title: s,
        description: `Professional ${s.toLowerCase()} by ${input.name}. Tell us what you need and get a clear quote.`,
        iconType: "emoji", icon: "",
        imageUrl: serviceImgs[i]?.url ?? "",
        link: waLink(input.whatsapp, `Hi, I need ${s}. Can I get a quote?`),
        linkLabel: "Get a quote",
      })),
    },
  } as unknown as Block);

  blocks.push({
    ...BASE, id: uid("steps"), type: "steps", order: o++,
    data: {
      title: "How it works", subtitle: "Simple, from first message to finished job",
      layout: "horizontal", style: "connected",
      items: [
        { id: uid("st"), title: "Message us", description: "Send us a WhatsApp with what you need." },
        { id: uid("st"), title: "Get a quote", description: "We reply quickly with a clear price." },
        { id: uid("st"), title: "Job done", description: "We get it done properly and on time." },
      ],
    },
  } as unknown as Block);

  blocks.push({
    ...BASE, id: uid("cta"), type: "cta", order: o++,
    templateVariant: "gradient-banner",
    data: {
      title: `Need ${input.services[0]?.toLowerCase() ?? "help"}?`,
      description: "Message us now. We usually reply within minutes.",
      layout: "centered",
      primaryButton: { label: "Chat on WhatsApp", url: wa },
    },
  } as unknown as Block);

  blocks.push({
    ...BASE, id: uid("contact"), type: "contact", order: o++,
    data: {
      title: "Get In Touch", subtitle: "Send us a message and we will call you back", layout: "split",
      showMap: false, showContactInfo: true,
      phone: `+${normalizeWhatsapp(input.whatsapp)}`,
      address: input.address ?? "",
      recipientEmail: "",
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "f-msg", label: "What do you need?", type: "textarea", required: true },
      ],
      submitLabel: "Send Message", successMessage: "Thanks! We will be in touch shortly.",
    },
  } as unknown as Block);

  return blocks;
}

export async function createDemoSite(
  admin: SupabaseClient,
  input: DemoInput,
  creator: { userId: string; staffId: string | null },
): Promise<{ id: string; url: string; expiresAt: string }> {
  const expiresAt = new Date(Date.now() + DEMO_DAYS * 86400_000).toISOString();

  const { data: tpl } = await admin
    .from("templates").select("category").eq("slug", input.templateSlug).maybeSingle();

  const { data: site, error } = await admin
    .from("tenants")
    .insert({
      name: input.name,
      slug: input.slug,
      plan: "basic",
      status: "onboarded",
      owner_id: creator.userId,
      onboarding_completed: true,
      referred_by_staff_id: creator.staffId,
      assigned_staff_id: creator.staffId,
      demo_expires_at: expiresAt,
      demo_created_by: creator.userId,
      demo_whatsapp: normalizeWhatsapp(input.whatsapp),
    })
    .select("id")
    .single();
  if (error || !site) throw new Error(error?.message ?? "Could not create demo");

  const tenantId = site.id as string;
  const proto = ROOT_DOMAIN.includes("localhost") ? "http" : "https";
  const url = `${proto}://${input.slug}.${ROOT_DOMAIN}`;

  await admin.from("tenant_members").insert({ tenant_id: tenantId, user_id: creator.userId, role: "owner" });

  // Theme only: colours, fonts, header/footer styling from the category
  // template. Its sample pages are not copied (fake stats/prices/reviews).
  await applyTemplateBySlug(admin, tenantId, input.templateSlug, "theme", { siteName: input.name });

  await Promise.all([
    admin.from("site_identity").upsert(
      {
        tenant_id: tenantId,
        site_name: input.name,
        tagline: input.tagline ?? null,
        // Null = BrandLogo placeholder (icon + name). Also clears any logo the
        // template theme carried, which would be someone else's brand.
        logo_url: input.logoUrl || null,
        logo_type: input.logoUrl ? "image" : "text",
        global_header: null,
        global_footer: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    ),
    admin.from("nav_menus").delete().eq("tenant_id", tenantId),
    admin.from("site_settings").upsert(
      {
        tenant_id: tenantId,
        site_name: input.name,
        site_description: `${joinNice(input.services)} by ${input.name}`,
        site_url: url,
        timezone: "UTC",
        language: "en",
        maintenance_mode: false,
      },
      { onConflict: "tenant_id" },
    ),
    admin.from("contact_details").insert({
      tenant_id: tenantId,
      label: "Main",
      phone: `+${normalizeWhatsapp(input.whatsapp)}`,
      whatsapp: normalizeWhatsapp(input.whatsapp),
      address: input.address || null,
      is_primary: true,
      floating_whatsapp: true,
      sort_order: 0,
    }),
    admin.from("subscriptions").upsert(
      { tenant_id: tenantId, plan_id: "basic", status: "onboarded", billing_cycle: "monthly", payment_method: "manual" },
      { onConflict: "tenant_id" },
    ),
  ]);

  const blocks = await buildDemoBlocks(input, (tpl?.category as string) ?? "");
  const now = new Date().toISOString();
  const { error: pageErr } = await admin.from("pages").insert({
    tenant_id: tenantId, template_id: null, title: "Home", slug: "home", type: "page",
    status: "published", blocks, order_index: 0, created_at: now, updated_at: now,
    seo: { title: input.name, description: `${joinNice(input.services)} by ${input.name}` },
  });
  if (pageErr) throw new Error(`Demo page failed: ${pageErr.message}`);

  return { id: tenantId, url, expiresAt };
}
