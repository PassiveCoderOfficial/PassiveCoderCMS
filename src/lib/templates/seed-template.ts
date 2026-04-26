/**
 * Template seeding — applies a template to a newly created tenant.
 *
 * "theme" mode: writes theme colours/identity only.
 * "full"  mode: seeds demo service groups, pages, sliders, testimonials, pricing,
 *               identity, and logs the import in tenant_template_imports.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { TEMPLATES } from "./templates-data";
import { getTemplateContent } from "./template-content";

export async function seedTemplate(
  supabase: SupabaseClient,
  tenantId: string,
  templateSlug: string,
  mode: "theme" | "full",
) {
  if (templateSlug === "blank" || !templateSlug) return;

  const template = TEMPLATES.find(t => t.slug === templateSlug);
  if (!template) return;

  const content = getTemplateContent(templateSlug);

  // ── 1. Apply theme colours to site_identity ─────────────────────────────────
  await supabase.from("site_identity").upsert(
    {
      tenant_id: tenantId,
      site_name: content.tagline.split(".")[0] ?? template.name,
      primary_color: template.accentColorHex,
      secondary_color: template.thumbTo,
      logo_type: "text",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );

  // ── 2. Seed nav menu ─────────────────────────────────────────────────────────
  await supabase.from("nav_menus").upsert(
    {
      tenant_id: tenantId,
      name: "Main Navigation",
      location: "header",
      items: content.navLinks.map((l, i) => ({
        id: `nav-${i}`,
        label: l.label,
        url: l.href,
        type: "anchor",
        children: [],
      })),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,location" },
  );

  if (mode === "theme") {
    // Record the import even for theme-only
    await logImport(supabase, tenantId, template.id, templateSlug, mode);
    return;
  }

  // ── 3. Full demo: service group + items ─────────────────────────────────────
  const { data: grp } = await supabase
    .from("service_groups")
    .insert({ tenant_id: tenantId, name: `${template.name} Services`, description: template.description, sort_order: 0 })
    .select("id")
    .single();

  if (grp) {
    const serviceRows = content.services.map((s, i) => ({
      tenant_id: tenantId,
      group_id: grp.id,
      name: s.name,
      description: s.desc,
      price: s.price ?? null,
      icon_type: "emoji" as const,
      icon_value: s.icon,
      sort_order: i,
      active: true,
    }));
    await supabase.from("service_items").insert(serviceRows);
  }

  // ── 4. Testimonials ──────────────────────────────────────────────────────────
  const testimonialRows = content.testimonials.map((t, i) => ({
    tenant_id: tenantId,
    reviewer_name: t.name,
    reviewer_location: t.location,
    review_text: t.text,
    rating: t.rating,
    source: "manual" as const,
    published: true,
    sort_order: i,
  }));
  if (testimonialRows.length > 0) {
    await supabase.from("testimonials").insert(testimonialRows);
  }

  // ── 5. Pricing tiers (if template has them) ──────────────────────────────────
  if (content.pricing && content.pricing.length > 0) {
    const { data: pGrp } = await supabase
      .from("pricing_groups")
      .insert({ tenant_id: tenantId, name: "Main Pricing", subtitle: "Simple, transparent pricing", sort_order: 0 })
      .select("id")
      .single();

    if (pGrp) {
      const pricingRows = content.pricing.map((tier, i) => ({
        tenant_id: tenantId,
        group_id: pGrp.id,
        name: tier.name,
        price: tier.price,
        period: tier.period ?? null,
        features: tier.features,
        cta_label: tier.cta,
        is_highlighted: tier.highlight ?? false,
        sort_order: i,
        active: true,
      }));
      await supabase.from("pricing_items").insert(pricingRows);
    }
  }

  // ── 6. Contact details ───────────────────────────────────────────────────────
  await supabase.from("contact_details").upsert(
    {
      tenant_id: tenantId,
      phone: content.phone,
      email: content.email,
      address: content.address,
      show_floating_whatsapp: true,
      floating_whatsapp_number: content.phone.replace(/[^0-9]/g, ""),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );

  // ── 7. Log the import ────────────────────────────────────────────────────────
  await logImport(supabase, tenantId, template.id, templateSlug, mode);
}

async function logImport(
  supabase: SupabaseClient,
  tenantId: string,
  templateId: string,
  templateSlug: string,
  mode: "theme" | "full",
) {
  await supabase.from("tenant_template_imports").insert({
    tenant_id: tenantId,
    template_slug: templateSlug,
    mode,
    applied_at: new Date().toISOString(),
  });
}
