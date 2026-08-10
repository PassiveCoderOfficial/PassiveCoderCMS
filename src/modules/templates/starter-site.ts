/**
 * Minimal starter site for a tenant created without a template ("blank", or a
 * slug that no longer resolves).
 *
 * A brand-new tenant must never be left with zero pages — an empty site
 * renders the welcome placeholder publicly, which looks broken to whoever
 * just signed up. One published home page with nav + hero + contact is the
 * floor.
 *
 * Previously this lived in seed-template.ts and borrowed a registry
 * TemplateIdentity purely for placeholder contact details; it needs nothing
 * from the registry, so it stands alone now.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Block } from "@/types/cms";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const BASE_BLOCK = {
  visible: true as const,
  width: "full" as const,
  padding: { top: 80, right: 0, bottom: 80, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" as const },
};

export function buildStarterBlocks(siteName: string): Block[] {
  let o = 0;
  const blocks: Block[] = [];

  blocks.push({
    ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    data: {
      logoText: siteName,
      items: [
        { id: uid("ni"), label: "Home", url: "/" },
        { id: uid("ni"), label: "Contact", url: "#contact" },
      ],
      sticky: true, showCta: true, ctaLabel: "Get Started", ctaUrl: "#contact",
    },
  } as Block);

  blocks.push({
    ...BASE_BLOCK, id: uid("hero"), type: "hero", order: o++,
    templateVariant: "centered-bold",
    data: {
      layout: "centered",
      title: "Welcome to your new site",
      subtitle: "Your site is set up and ready. Edit this page in the dashboard to make it yours.",
      description: "",
      primaryButton: { label: "Edit in Dashboard", url: "/dashboard", variant: "primary" },
      typography: { titleSize: "6xl", titleColor: "", subtitleColor: "", descColor: "" },
    },
  } as Block);

  blocks.push({
    ...BASE_BLOCK, id: uid("contact"), type: "contact", order: o++,
    data: {
      title: "Get In Touch", subtitle: "We'd love to hear from you", layout: "split",
      showMap: false, showContactInfo: true,
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-email", label: "Email", type: "email", required: true },
        { id: "f-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message", successMessage: "Thanks! We'll be in touch.",
    },
  } as Block);

  return blocks;
}

/** Creates the starter home page for `tenantId`, unless it already has pages. */
export async function seedStarterSite(
  supabase: SupabaseClient,
  tenantId: string,
  siteName: string,
): Promise<void> {
  const { count } = await supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);
  if (count && count > 0) return;

  const now = new Date().toISOString();
  await supabase.from("pages").insert({
    tenant_id: tenantId,
    template_id: null,
    title: "Home",
    slug: "home",
    type: "page",
    status: "published",
    blocks: buildStarterBlocks(siteName),
    order_index: 0,
    created_at: now,
    updated_at: now,
  });
}
