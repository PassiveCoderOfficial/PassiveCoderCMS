/**
 * Template seeding v2 — variant-aware, image-rich, per-template block identity.
 *
 * "theme" mode  → writes identity colours + nav + sets active_template_slug. No pages.
 * "full"  mode  → everything above + home page with template-variant blocks using
 *                 real images, template-specific content, and proper layout variants.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { getTemplateIdentity, type TemplateIdentity } from "@/modules/themes/template-registry";
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

export async function seedTemplate(
  supabase: SupabaseClient,
  tenantId: string,
  templateSlug: string,
  mode: "theme" | "full",
) {
  if (!templateSlug || templateSlug === "blank") return;

  const template = getTemplateIdentity(templateSlug);
  if (!template) {
    console.warn(`[seedTemplate] Unknown template slug: ${templateSlug}`);
    return;
  }

  // ── 1. Site identity + active template ──────────────────────────────────────
  await supabase.from("site_identity").upsert(
    {
      tenant_id: tenantId,
      site_name: template.siteName,
      primary_color: template.palette.primary,
      secondary_color: template.palette.secondary,
      logo_type: "text",
      active_template_slug: templateSlug,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );

  // ── 2. Nav menu ──────────────────────────────────────────────────────────────
  await supabase.from("nav_menus").upsert(
    {
      tenant_id: tenantId,
      name: "Main Navigation",
      location: "header",
      items: template.navItems.map((l) => ({
        id: l.id,
        label: l.label,
        url: l.url,
        type: "anchor",
        children: [],
      })),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,location" },
  );

  // ── 3. Log the import ────────────────────────────────────────────────────────
  if (mode === "theme") {
    await logImport(supabase, tenantId, templateSlug, mode);
    return;
  }

  // ── FULL MODE ────────────────────────────────────────────────────────────────

  // ── 4. Service groups + items ────────────────────────────────────────────────
  const { data: grp } = await supabase
    .from("service_groups")
    .insert({
      tenant_id: tenantId,
      name: `${template.name} Services`,
      description: template.description,
      sort_order: 0,
    })
    .select("id")
    .single();

  if (grp) {
    const serviceRows = template.services.map((s, i) => ({
      tenant_id: tenantId,
      group_id: grp.id,
      name: s.title,
      description: s.description,
      price: s.price ?? null,
      icon_type: s.iconType,
      icon_value: s.icon,
      image_url: s.imageUrl ?? null,
      sort_order: i,
      active: true,
    }));
    await supabase.from("service_items").insert(serviceRows);
  }

  // ── 5. Testimonials ──────────────────────────────────────────────────────────
  if (template.testimonials.length > 0) {
    const rows = template.testimonials.map((t, i) => ({
      tenant_id: tenantId,
      reviewer_name: t.name,
      reviewer_location: t.role + (t.company ? `, ${t.company}` : ""),
      review_text: t.content,
      rating: t.rating,
      avatar_url: t.avatar ?? null,
      source: "manual" as const,
      published: true,
      sort_order: i,
    }));
    await supabase.from("testimonials").insert(rows);
  }

  // ── 6. Pricing ───────────────────────────────────────────────────────────────
  if (template.pricing && template.pricing.length > 0) {
    const { data: pGrp } = await supabase
      .from("pricing_groups")
      .insert({
        tenant_id: tenantId,
        name: "Main Pricing",
        subtitle: "Simple, transparent pricing",
        sort_order: 0,
      })
      .select("id")
      .single();

    if (pGrp) {
      const rows = template.pricing.map((tier, i) => ({
        tenant_id: tenantId,
        group_id: pGrp.id,
        name: tier.name,
        price: tier.price,
        period: tier.period ?? null,
        description: tier.description ?? null,
        features: tier.features,
        cta_label: tier.ctaLabel,
        is_highlighted: tier.highlighted ?? false,
        badge: tier.badge ?? null,
        sort_order: i,
        active: true,
      }));
      await supabase.from("pricing_items").insert(rows);
    }
  }

  // ── 7. Contact details ───────────────────────────────────────────────────────
  await supabase.from("contact_details").upsert(
    {
      tenant_id: tenantId,
      phone: template.phone,
      email: template.email,
      address: template.address,
      show_floating_whatsapp: true,
      floating_whatsapp_number: template.phone.replace(/[^0-9]/g, ""),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );

  // ── 8. Home page with variant-aware blocks ───────────────────────────────────
  const blocks = buildHomePageBlocks(template);
  await supabase.from("pages").upsert(
    {
      tenant_id: tenantId,
      title: template.siteName,
      slug: "home",
      status: "published",
      blocks,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,slug" },
  );

  // ── 9. Log ───────────────────────────────────────────────────────────────────
  await logImport(supabase, tenantId, templateSlug, mode);
}

function buildHomePageBlocks(t: TemplateIdentity): Block[] {
  const blocks: Block[] = [];
  let order = 0;

  // Navigation
  blocks.push({
    ...BASE_BLOCK,
    id: uid("nav"),
    type: "navigation",
    order: order++,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    templateVariant: t.variants.navigation,
    data: {
      logoText: t.siteName,
      items: t.navItems,
      sticky: true,
      transparent: ["fullscreen-overlay"].includes(t.variants.hero),
      style: t.variants.navigation.includes("centered") ? "centered" : "default",
      showCta: true,
      ctaLabel: t.heroCTA,
      ctaUrl: "#contact",
    },
  } as Block);

  // Hero — always gets the real hero image + template variant
  blocks.push({
    ...BASE_BLOCK,
    id: uid("hero"),
    type: "hero",
    order: order++,
    padding: ["fullscreen-overlay", "dark-gradient-left"].includes(t.variants.hero)
      ? { top: 0, right: 0, bottom: 0, left: 0 }
      : { top: 80, right: 0, bottom: 80, left: 0 },
    templateVariant: t.variants.hero,
    data: {
      layout: "split",
      badge: t.heroBadge,
      title: t.heroHeadline,
      subtitle: t.heroSubline,
      description: t.aboutBody.split(".")[0] + ".",
      primaryButton: { label: t.heroCTA, url: "#contact", variant: "primary" },
      secondaryButton: { label: t.heroSecondaryCTA, url: "#services", variant: "outline" },
      imageUrl: t.images.hero.url,
      imageAlt: t.images.hero.alt,
      overlayOpacity: 0.55,
      typography: { titleSize: "6xl", titleColor: "", subtitleColor: "", descColor: "" },
    },
  } as Block);

  // Stats
  if (t.stats.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("stats"),
      type: "stats",
      order: order++,
      padding: { top: 56, right: 0, bottom: 56, left: 0 },
      background: { type: "color", color: t.palette.primary + "12" },
      templateVariant: t.variants.stats,
      data: {
        title: "",
        subtitle: "",
        layout: "row",
        columns: Math.min(t.stats.length, 4) as 2 | 3 | 4,
        items: t.stats,
        style: "plain",
        animate: true,
      },
    } as Block);
  }

  // Services
  if (t.services.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("services"),
      type: "services",
      order: order++,
      templateVariant: t.variants.services,
      data: {
        title: "Our Services",
        subtitle: t.aboutHeading,
        layout: "grid",
        columns: 3,
        cardStyle: "elevated",
        source: "inline",
        items: t.services.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          icon: s.icon,
          iconType: s.iconType,
          imageUrl: s.imageUrl,
          linkLabel: s.price ?? "Learn More",
          link: s.link ?? "#contact",
        })),
      },
    } as Block);
  }

  // About — features block with real about image in alternating layout
  if (t.images.about) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("features"),
      type: "features",
      order: order++,
      templateVariant: t.variants.features,
      data: {
        title: t.aboutHeading,
        subtitle: "",
        layout: "alternating",
        columns: 2,
        style: "minimal",
        items: [
          {
            id: uid("feat"),
            title: t.aboutHeading,
            description: t.aboutBody,
            imageUrl: t.images.about.url,
            icon: "",
          },
        ],
      },
    } as Block);
  }

  // Testimonials
  if (t.testimonials.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("testimonials"),
      type: "testimonials",
      order: order++,
      templateVariant: t.variants.testimonials,
      data: {
        title: "What Our Clients Say",
        layout: "grid",
        items: t.testimonials.map((t) => ({
          id: t.id,
          name: t.name,
          role: t.role,
          company: t.company,
          avatar: t.avatar,
          content: t.content,
          rating: t.rating,
        })),
      },
    } as Block);
  }

  // Gallery — uses template gallery images
  if (t.images.gallery.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("gallery"),
      type: "gallery",
      order: order++,
      data: {
        title: "Gallery",
        layout: "grid",
        columns: 4,
        gap: "sm",
        lightbox: true,
        images: t.images.gallery.map((img, i) => ({
          id: uid(`gal-${i}`),
          url: img.url,
          alt: img.alt,
        })),
      },
    } as Block);
  }

  // Pricing
  if (t.pricing && t.pricing.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("pricing"),
      type: "pricing",
      order: order++,
      templateVariant: t.variants.pricing,
      data: {
        title: "Pricing",
        subtitle: "Simple, transparent pricing",
        layout: "cards",
        billingToggle: false,
        plans: t.pricing.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          period: p.period,
          description: p.description,
          features: p.features,
          highlighted: p.highlighted ?? false,
          badge: p.badge,
          ctaLabel: p.ctaLabel,
          ctaUrl: p.ctaUrl,
        })),
      },
    } as Block);
  }

  // Team
  if (t.team && t.team.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("team"),
      type: "team",
      order: order++,
      templateVariant: t.variants.team,
      data: {
        title: "Meet the Team",
        subtitle: "",
        layout: "cards",
        columns: 3,
        showBio: true,
        showSocial: false,
        members: t.team.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          bio: m.bio,
          avatar: m.avatar,
          social: m.social ?? [],
        })),
      },
    } as Block);
  }

  // FAQ
  if (t.faq && t.faq.length > 0) {
    blocks.push({
      ...BASE_BLOCK,
      id: uid("faq"),
      type: "faq",
      order: order++,
      templateVariant: t.variants.faq,
      data: {
        title: "Frequently Asked Questions",
        subtitle: "",
        layout: "accordion",
        allowMultiple: false,
        items: t.faq.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
        })),
      },
    } as Block);
  }

  // CTA
  blocks.push({
    ...BASE_BLOCK,
    id: uid("cta"),
    type: "cta",
    order: order++,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    background: t.images.cta
      ? { type: "image", imageUrl: t.images.cta.url, imageOverlay: t.palette.primary, imageOverlayOpacity: 0.7 }
      : { type: "gradient", gradient: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.secondary})` },
    templateVariant: t.variants.cta,
    data: {
      title: `Ready to Get Started?`,
      description: t.tagline,
      primaryButton: { label: t.heroCTA, url: "#contact" },
      secondaryButton: { label: "Learn More", url: "#services" },
      layout: "centered",
    },
  } as Block);

  // Contact
  blocks.push({
    ...BASE_BLOCK,
    id: uid("contact"),
    type: "contact",
    order: order++,
    data: {
      title: "Get In Touch",
      subtitle: t.heroCTA,
      layout: "split",
      showMap: false,
      showContactInfo: true,
      phone: t.phone,
      email: t.email,
      address: t.address,
      fields: [
        { id: "field-name", label: "Full Name", type: "text", required: true },
        { id: "field-email", label: "Email Address", type: "email", required: true },
        { id: "field-phone", label: "Phone Number", type: "tel", required: false },
        { id: "field-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message",
      successMessage: "Thanks! We'll be in touch shortly.",
      recipientEmail: t.email,
    },
  } as Block);

  return blocks;
}

async function logImport(
  supabase: SupabaseClient,
  tenantId: string,
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
