/**
 * Template seeding — applies a template to a newly created tenant.
 *
 * "theme" mode: writes theme colours/identity only.
 * "full"  mode: seeds demo service groups, pages, sliders, testimonials, pricing,
 *               identity, logs the import in tenant_template_imports, and creates
 *               a published home page with real blocks from template content.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { TEMPLATES } from "./templates-data";
import { getTemplateContent, type TemplateContent } from "./template-content";
import type { Template } from "./templates-data";

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

  // ── 7. Home page with real blocks ───────────────────────────────────────────
  const blocks = buildHomePageBlocks(content, template);
  await supabase.from("pages").upsert(
    {
      tenant_id: tenantId,
      title: template.name,
      slug: "home",
      status: "published",
      blocks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,slug" },
  );

  // ── 8. Log the import ────────────────────────────────────────────────────────
  await logImport(supabase, tenantId, template.id, templateSlug, mode);
}

function uid(prefix: string, i: number) { return `${prefix}-${i}-${Math.random().toString(36).slice(2, 7)}`; }

const BASE_BLOCK = {
  visible: true,
  width: "full" as const,
  padding: { top: 64, right: 0, bottom: 64, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" as const },
};

function buildHomePageBlocks(content: TemplateContent, template: Template) {
  const blocks = [];
  let order = 0;

  // Navigation
  blocks.push({
    ...BASE_BLOCK,
    id: uid("nav", order),
    type: "navigation",
    order: order++,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    data: {
      logoText: template.name,
      items: content.navLinks.map((l, i) => ({ id: `nav-item-${i}`, label: l.label, url: l.href })),
      sticky: true,
      transparent: false,
      style: "default",
      showCta: true,
      ctaLabel: content.cta,
      ctaUrl: "#contact",
    },
  });

  // Hero
  blocks.push({
    ...BASE_BLOCK,
    id: uid("hero", order),
    type: "hero",
    order: order++,
    padding: { top: 80, right: 0, bottom: 80, left: 0 },
    data: {
      layout: "centered",
      badge: template.category,
      title: template.heroHeadline,
      subtitle: template.heroSubline,
      description: content.about.body.split(".")[0] + ".",
      primaryButton: { label: content.cta, url: "#contact", variant: "primary" },
      secondaryButton: { label: content.ctaSecondary, url: "#services", variant: "outline" },
      typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" },
    },
  });

  // Stats
  if (content.stats.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("stats", order),
      type: "stats",
      order: order++,
      padding: { top: 48, right: 0, bottom: 48, left: 0 },
      background: { type: "color", color: template.accentColorHex + "15" },
      data: {
        title: "",
        layout: "row",
        columns: Math.min(content.stats.length, 4) as 2 | 3 | 4,
        items: content.stats.map((s, i) => ({ id: uid("stat", i), value: s.value, label: s.label })),
        style: "plain",
        animate: true,
      },
    });
  }

  // Services
  if (content.services.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("services", order),
      type: "services",
      order: order++,
      data: {
        title: "Our Services",
        subtitle: content.about.heading,
        layout: "grid",
        columns: 3 as 3,
        cardStyle: "elevated",
        source: "inline",
        items: content.services.map((s, i) => ({
          id: uid("svc", i),
          title: s.name,
          description: s.desc,
          icon: s.icon,
          iconType: "emoji",
          linkLabel: s.price ?? "Learn More",
          link: "#contact",
        })),
      },
    });
  }

  // About / text
  blocks.push({
    ...BASE_BLOCK,
    id: uid("text", order),
    type: "text",
    order: order++,
    data: {
      content: `<h2 style="font-size:1.75rem;font-weight:700;margin-bottom:1rem">${content.about.heading}</h2><p>${content.about.body}</p><ul style="margin-top:1rem;padding-left:1.5rem">${content.about.highlights.map(h => `<li>✅ ${h}</li>`).join("")}</ul>`,
      alignment: "left",
      columns: 1,
      typography: {},
    },
  });

  // Testimonials
  if (content.testimonials.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("testimonials", order),
      type: "testimonials",
      order: order++,
      data: {
        title: "What Our Clients Say",
        layout: "grid",
        items: content.testimonials.map((t, i) => ({
          id: uid("tst", i),
          name: t.name,
          role: t.location,
          content: t.text,
          rating: t.rating,
        })),
      },
    });
  }

  // Pricing
  if (content.pricing && content.pricing.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("pricing", order),
      type: "pricing",
      order: order++,
      data: {
        title: "Pricing",
        subtitle: "Simple, transparent pricing",
        layout: "cards",
        billingToggle: false,
        plans: content.pricing.map((p, i) => ({
          id: uid("plan", i),
          name: p.name,
          price: p.price,
          period: p.period,
          features: p.features,
          highlighted: p.highlight ?? false,
          ctaLabel: p.cta,
          ctaUrl: "#contact",
        })),
      },
    });
  }

  // FAQ
  if (content.faqItems && content.faqItems.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("faq", order),
      type: "faq",
      order: order++,
      data: {
        title: "Frequently Asked Questions",
        layout: "accordion",
        allowMultiple: false,
        items: content.faqItems.map((f, i) => ({ id: uid("faq-item", i), question: f.q, answer: f.a })),
      },
    });
  }

  // Contact
  blocks.push({
    ...BASE_BLOCK,
    id: uid("contact", order),
    type: "contact",
    order: order++,
    data: {
      title: "Get In Touch",
      subtitle: content.cta,
      layout: "split",
      showMap: false,
      showContactInfo: true,
      phone: content.phone,
      email: content.email,
      address: content.address,
      fields: [
        { id: "field-name", label: "Full Name", type: "text", required: true },
        { id: "field-email", label: "Email", type: "email", required: true },
        { id: "field-phone", label: "Phone", type: "tel", required: false },
        { id: "field-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message",
      successMessage: "Thanks! We'll be in touch soon.",
    },
  });

  return blocks;
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
