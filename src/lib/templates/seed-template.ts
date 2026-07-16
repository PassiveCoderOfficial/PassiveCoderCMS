/**
 * Template seeding v2 — variant-aware, image-rich, per-template block identity.
 *
 * "theme" mode  → writes identity colours + nav + sets active_template_slug. No pages.
 * "full"  mode  → everything above + home page with template-variant blocks using
 *                 real images, template-specific content, and proper layout variants.
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { getTemplateIdentity, getDefaultTemplateIdentity, type TemplateIdentity } from "@/modules/themes/template-registry";
import type { Block } from "@/types/cms";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

// Registry navigation variant name -> the navigation block's actual "style" prop.
// The block only implements "centered", "split", and "default" — this is the
// single place that maps every registry name onto one of those three.
function navStyle(t: TemplateIdentity): "centered" | "split" | "default" {
  const v = t.variants.navigation;
  if (v.includes("centered")) return "centered";
  if (v.includes("corporate") || v.includes("solid-with-cta")) return "split";
  return "default";
}

// Registry faq variant name -> the faq block's actual "layout" prop. The block
// only implements "accordion", "grid", and "simple".
function faqLayout(t: TemplateIdentity): "accordion" | "grid" | "simple" {
  const v = t.variants.faq;
  if (v.includes("two-column") || v.includes("grid")) return "grid";
  if (v.includes("simple")) return "simple";
  return "accordion";
}

const BASE_BLOCK = {
  visible: true as const,
  width: "full" as const,
  padding: { top: 80, right: 0, bottom: 80, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" as const },
};

/** Build the persistent global header (navigation block) from a template. */
function buildGlobalHeader(t: TemplateIdentity): Block[] {
  const style = navStyle(t);
  // "split" (corporate) nav is a light bar with dark text and hairline
  // dividers — every other style is a solid brand-color bar with white text.
  const chrome = style === "split"
    ? { backgroundColor: "#ffffff", textColor: "#111827", activeColor: t.palette.primary, shadow: false, borderBottom: true }
    : { backgroundColor: t.palette.primary, textColor: "#ffffff" };

  return [
    {
      ...BASE_BLOCK,
      id: uid("nav"),
      type: "navigation",
      order: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      templateVariant: t.variants.navigation,
      data: {
        logoText: t.siteName,
        items: t.navItems,
        sticky: true,
        style,
        ...chrome,
        showCta: true,
        ctaLabel: t.heroCTA,
        ctaUrl: "/contact",
      },
    } as Block,
  ];
}

/** Build the persistent global footer from a template. */
function buildGlobalFooter(t: TemplateIdentity): Block[] {
  const year = new Date().getFullYear();
  return [
    {
      ...BASE_BLOCK,
      id: uid("footer"),
      type: "footer",
      order: 0,
      padding: { top: 56, right: 0, bottom: 32, left: 0 },
      data: {
        logoText: t.siteName,
        tagline: t.tagline,
        columns: [
          {
            id: uid("fcol"),
            heading: "Quick Links",
            links: t.navItems.slice(0, 5).map((n) => ({
              id: uid("flink"),
              label: n.label,
              url: n.url,
            })),
          },
          {
            id: uid("fcol"),
            heading: "Contact",
            links: [
              ...(t.phone ? [{ id: uid("flink"), label: t.phone, url: `tel:${t.phone}` }] : []),
              ...(t.email ? [{ id: uid("flink"), label: t.email, url: `mailto:${t.email}` }] : []),
            ],
          },
        ],
        copyrightText: `© ${year} ${t.siteName}. All rights reserved.`,
        copyrightYear: true,
        accentColor: t.palette.secondary,
        style: "dark" as const,
      },
    } as Block,
  ];
}

export async function seedTemplate(
  supabase: SupabaseClient,
  tenantId: string,
  templateSlug: string,
  mode: "theme" | "full",
) {
  // "blank" or an unknown slug → seed a minimal starter site using a neutral
  // default identity, so a tenant is NEVER left fully empty (which would surface
  // the "Your site is ready" welcome screen to public visitors).
  const resolved = templateSlug && templateSlug !== "blank"
    ? getTemplateIdentity(templateSlug)
    : undefined;
  if (!resolved && templateSlug && templateSlug !== "blank") {
    console.warn(`[seedTemplate] Unknown template slug "${templateSlug}" — falling back to minimal starter`);
  }
  const isStarter = !resolved;
  const template = resolved ?? getDefaultTemplateIdentity();

  // ── 1. Site identity + active template ──────────────────────────────────────
  // Seed a global header (navigation) + footer so EVERY page — including dynamic
  // routes like /products/[slug], /cart, /checkout that have no per-page nav —
  // renders a consistent site chrome via (site)/layout.tsx.
  const globalHeader = buildGlobalHeader(template);
  const globalFooter = buildGlobalFooter(template);

  await supabase.from("site_identity").upsert(
    {
      tenant_id: tenantId,
      site_name: template.siteName,
      primary_color: template.palette.primary,
      secondary_color: template.palette.secondary,
      logo_type: "text",
      active_template_slug: templateSlug,
      global_header: globalHeader,
      global_footer: globalFooter,
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
  // Starter (blank/unknown) always seeds pages so the site is never empty —
  // skip the theme-only early return for it.
  if (mode === "theme" && !isStarter) {
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

  // ── 8. Multi-page seeding ────────────────────────────────────────────────────
  // Delete all existing pages for this tenant, then insert a full site.
  await supabase.from("pages").delete().eq("tenant_id", tenantId);

  const now = new Date().toISOString();
  const pageRows = isStarter
    ? buildStarterPages(template, tenantId, now)
    : buildAllPages(template, tenantId, now);
  await supabase.from("pages").insert(pageRows);

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
    padding: ["fullscreen-overlay", "dark-gradient-left", "corporate"].includes(t.variants.hero)
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
      overlayColor: t.palette.primary,
      overlayColorTo: t.palette.secondary,
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
      data: t.variants.features === "dark"
        ? {
            title: t.aboutHeading, subtitle: t.aboutBody,
            layout: "grid", columns: 2, style: "minimal",
            items: t.aboutHighlights.map((h) => ({ id: uid("feat"), title: h, description: "", imageUrl: t.images.about!.url, icon: "" })),
          }
        : {
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
        layout: faqLayout(t),
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

// ─── Multi-page builder ───────────────────────────────────────────────────────
// Returns an array of page rows ready to INSERT into the `pages` table.
// Home = full landing page. Additional pages = focused single-topic pages.

function buildAllPages(t: TemplateIdentity, tenantId: string, now: string) {
  const pages = [];

  // ── Home ─────────────────────────────────────────────────────────────────────
  pages.push({
    tenant_id: tenantId,
    title: "Home",
    slug: "home",
    status: "published",
    blocks: buildHomePageBlocks(t),
    created_at: now,
    updated_at: now,
  });

  // ── About ─────────────────────────────────────────────────────────────────────
  const aboutBlocks: Block[] = [];
  let o = 0;
  aboutBlocks.push({
    ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    templateVariant: t.variants.navigation,
    data: { logoText: t.siteName, items: t.navItems, sticky: true, showCta: true, ctaLabel: t.heroCTA, ctaUrl: "#contact" },
  } as Block);
  if (t.images.about) {
    aboutBlocks.push({
      ...BASE_BLOCK, id: uid("hero"), type: "hero", order: o++,
      templateVariant: "centered-bold",
      data: {
        title: t.aboutHeading, subtitle: t.tagline,
        imageUrl: t.images.about.url, imageAlt: t.images.about.alt,
        primaryButton: { label: t.heroCTA, url: "/contact", variant: "primary" },
        typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" },
      },
    } as Block);
  }
  aboutBlocks.push({
    ...BASE_BLOCK, id: uid("feat"), type: "features", order: o++,
    templateVariant: t.variants.features,
    data: t.variants.features === "dark"
      ? {
          title: t.aboutHeading, subtitle: t.aboutBody,
          layout: "grid", columns: 2, style: "minimal",
          items: t.aboutHighlights.map((h) => ({ id: uid("f"), title: h, description: "", imageUrl: t.images.about?.url ?? "", icon: "" })),
        }
      : {
          title: t.aboutHeading, subtitle: "",
          layout: "alternating", columns: 2, style: "minimal",
          items: [{ id: uid("f"), title: t.aboutHeading, description: t.aboutBody, imageUrl: t.images.about?.url ?? "", icon: "" }],
        },
  } as Block);
  if (t.stats.length > 0) {
    aboutBlocks.push({
      ...BASE_BLOCK, id: uid("stats"), type: "stats", order: o++,
      padding: { top: 56, right: 0, bottom: 56, left: 0 },
      background: { type: "color", color: t.palette.primary + "12" },
      templateVariant: t.variants.stats,
      data: { title: "", subtitle: "", layout: "row", columns: Math.min(t.stats.length, 4) as 2|3|4, items: t.stats, style: "plain", animate: true },
    } as Block);
  }
  if (t.team && t.team.length > 0) {
    aboutBlocks.push({
      ...BASE_BLOCK, id: uid("team"), type: "team", order: o++,
      templateVariant: t.variants.team,
      data: { title: "Meet the Team", subtitle: "", layout: "cards", columns: 3, showBio: true, showSocial: false, members: t.team.map(m => ({ id: m.id, name: m.name, role: m.role, bio: m.bio, avatar: m.avatar, social: m.social ?? [] })) },
    } as Block);
  }
  aboutBlocks.push({
    ...BASE_BLOCK, id: uid("contact"), type: "contact", order: o++,
    data: {
      title: "Get In Touch", subtitle: t.heroCTA, layout: "split", showMap: false, showContactInfo: true,
      phone: t.phone, email: t.email, address: t.address,
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-email", label: "Email", type: "email", required: true },
        { id: "f-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message", successMessage: "Thanks! We'll be in touch.", recipientEmail: t.email,
    },
  } as Block);

  pages.push({ tenant_id: tenantId, title: "About Us", slug: "about", status: "published", blocks: aboutBlocks, created_at: now, updated_at: now });

  // ── Services ──────────────────────────────────────────────────────────────────
  if (t.services.length > 0) {
    o = 0;
    const svcBlocks: Block[] = [];
    svcBlocks.push({ ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++, padding: { top: 0, right: 0, bottom: 0, left: 0 }, templateVariant: t.variants.navigation, data: { logoText: t.siteName, items: t.navItems, sticky: true, style: navStyle(t), showCta: true, ctaLabel: t.heroCTA, ctaUrl: "/contact" } } as Block);
    svcBlocks.push({
      ...BASE_BLOCK, id: uid("hero"), type: "hero", order: o++,
      templateVariant: "centered-bold",
      data: { title: "Our Services", subtitle: t.tagline, primaryButton: { label: t.heroCTA, url: "/contact", variant: "primary" }, typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" } },
    } as Block);
    svcBlocks.push({
      ...BASE_BLOCK, id: uid("svc"), type: "services", order: o++,
      templateVariant: t.variants.services,
      data: {
        title: "What We Offer", subtitle: t.aboutHeading, layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
        items: t.services.map(s => ({ id: s.id, title: s.title, description: s.description, icon: s.icon, iconType: s.iconType, imageUrl: s.imageUrl, linkLabel: s.price ?? "Learn More", link: "/contact" })),
      },
    } as Block);
    svcBlocks.push({
      ...BASE_BLOCK, id: uid("cta"), type: "cta", order: o++,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      background: { type: "gradient", gradient: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.secondary})` },
      templateVariant: t.variants.cta,
      data: { title: "Ready to Get Started?", description: t.tagline, primaryButton: { label: t.heroCTA, url: "/contact" }, secondaryButton: { label: "About Us", url: "/about" }, layout: "centered" },
    } as Block);
    pages.push({ tenant_id: tenantId, title: "Services", slug: "services", status: "published", blocks: svcBlocks, created_at: now, updated_at: now });
  }

  // ── Gallery ───────────────────────────────────────────────────────────────────
  if (t.images.gallery.length > 0) {
    o = 0;
    const galBlocks: Block[] = [];
    galBlocks.push({ ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++, padding: { top: 0, right: 0, bottom: 0, left: 0 }, templateVariant: t.variants.navigation, data: { logoText: t.siteName, items: t.navItems, sticky: true, style: navStyle(t), showCta: true, ctaLabel: t.heroCTA, ctaUrl: "/contact" } } as Block);
    galBlocks.push({ ...BASE_BLOCK, id: uid("hero"), type: "hero", order: o++, templateVariant: "centered-bold", data: { title: "Gallery", subtitle: t.tagline, typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" } } } as Block);
    galBlocks.push({
      ...BASE_BLOCK, id: uid("gal"), type: "gallery", order: o++,
      data: { title: "", layout: "masonry", columns: 3, gap: "sm", lightbox: true, images: t.images.gallery.map((img, i) => ({ id: uid(`g${i}`), url: img.url, alt: img.alt })) },
    } as Block);
    // Add service images as additional gallery rows
    const svcImages = t.images.services.map((img, i) => ({ id: uid(`gs${i}`), url: img.url, alt: img.alt }));
    if (svcImages.length > 0) {
      galBlocks.push({ ...BASE_BLOCK, id: uid("gal2"), type: "gallery", order: o++, data: { title: "Our Work", layout: "grid", columns: 3, gap: "sm", lightbox: true, images: svcImages } } as Block);
    }
    pages.push({ tenant_id: tenantId, title: "Gallery", slug: "gallery", status: "published", blocks: galBlocks, created_at: now, updated_at: now });
  }

  // ── Pricing ───────────────────────────────────────────────────────────────────
  if (t.pricing && t.pricing.length > 0) {
    o = 0;
    const prcBlocks: Block[] = [];
    prcBlocks.push({ ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++, padding: { top: 0, right: 0, bottom: 0, left: 0 }, templateVariant: t.variants.navigation, data: { logoText: t.siteName, items: t.navItems, sticky: true, style: navStyle(t), showCta: true, ctaLabel: t.heroCTA, ctaUrl: "/contact" } } as Block);
    prcBlocks.push({ ...BASE_BLOCK, id: uid("hero"), type: "hero", order: o++, templateVariant: "centered-bold", data: { title: "Pricing", subtitle: "Simple, transparent pricing. No surprises.", typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" } } } as Block);
    prcBlocks.push({
      ...BASE_BLOCK, id: uid("prc"), type: "pricing", order: o++,
      templateVariant: t.variants.pricing,
      data: {
        title: "Choose Your Plan", subtitle: "Simple, transparent pricing",
        layout: "cards", billingToggle: false,
        plans: t.pricing.map(p => ({ id: p.id, name: p.name, price: p.price, period: p.period, description: p.description, features: p.features, highlighted: p.highlighted ?? false, badge: p.badge, ctaLabel: p.ctaLabel, ctaUrl: "/contact" })),
      },
    } as Block);
    if (t.faq && t.faq.length > 0) {
      prcBlocks.push({ ...BASE_BLOCK, id: uid("faq"), type: "faq", order: o++, templateVariant: t.variants.faq, data: { title: "Pricing FAQ", subtitle: "", layout: faqLayout(t), allowMultiple: false, items: t.faq.map(f => ({ id: f.id, question: f.question, answer: f.answer })) } } as Block);
    }
    pages.push({ tenant_id: tenantId, title: "Pricing", slug: "pricing", status: "published", blocks: prcBlocks, created_at: now, updated_at: now });
  }

  // ── Testimonials ──────────────────────────────────────────────────────────────
  if (t.testimonials.length > 0) {
    o = 0;
    const tesBlocks: Block[] = [];
    tesBlocks.push({ ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++, padding: { top: 0, right: 0, bottom: 0, left: 0 }, templateVariant: t.variants.navigation, data: { logoText: t.siteName, items: t.navItems, sticky: true, style: navStyle(t), showCta: true, ctaLabel: t.heroCTA, ctaUrl: "/contact" } } as Block);
    tesBlocks.push({ ...BASE_BLOCK, id: uid("hero"), type: "hero", order: o++, templateVariant: "centered-bold", data: { title: "What Our Clients Say", subtitle: t.tagline, typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" } } } as Block);
    tesBlocks.push({ ...BASE_BLOCK, id: uid("tes"), type: "testimonials", order: o++, templateVariant: t.variants.testimonials, data: { title: "", layout: "grid", items: t.testimonials.map(t => ({ id: t.id, name: t.name, role: t.role, company: t.company, avatar: t.avatar, content: t.content, rating: t.rating })) } } as Block);
    tesBlocks.push({ ...BASE_BLOCK, id: uid("stats"), type: "stats", order: o++, padding: { top: 56, right: 0, bottom: 56, left: 0 }, background: { type: "color", color: t.palette.primary + "12" }, templateVariant: t.variants.stats, data: { title: "", subtitle: "", layout: "row", columns: Math.min(t.stats.length, 4) as 2|3|4, items: t.stats, style: "plain", animate: true } } as Block);
    pages.push({ tenant_id: tenantId, title: "Reviews", slug: "reviews", status: "published", blocks: tesBlocks, created_at: now, updated_at: now });
  }

  // ── FAQ ───────────────────────────────────────────────────────────────────────
  if (t.faq && t.faq.length > 0) {
    o = 0;
    const faqBlocks: Block[] = [];
    faqBlocks.push({ ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++, padding: { top: 0, right: 0, bottom: 0, left: 0 }, templateVariant: t.variants.navigation, data: { logoText: t.siteName, items: t.navItems, sticky: true, style: navStyle(t), showCta: true, ctaLabel: t.heroCTA, ctaUrl: "/contact" } } as Block);
    faqBlocks.push({ ...BASE_BLOCK, id: uid("hero"), type: "hero", order: o++, templateVariant: "centered-bold", data: { title: "Frequently Asked Questions", subtitle: `Everything you need to know about ${t.siteName}`, typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" } } } as Block);
    faqBlocks.push({ ...BASE_BLOCK, id: uid("faq"), type: "faq", order: o++, templateVariant: t.variants.faq, data: { title: "", subtitle: "", layout: faqLayout(t), allowMultiple: false, items: t.faq.map(f => ({ id: f.id, question: f.question, answer: f.answer })) } } as Block);
    faqBlocks.push({ ...BASE_BLOCK, id: uid("cta"), type: "cta", order: o++, padding: { top: 0, right: 0, bottom: 0, left: 0 }, background: { type: "gradient", gradient: `linear-gradient(135deg, ${t.palette.primary}, ${t.palette.secondary})` }, templateVariant: t.variants.cta, data: { title: "Still Have Questions?", description: "Our team is happy to help.", primaryButton: { label: "Contact Us", url: "/contact" }, layout: "centered" } } as Block);
    pages.push({ tenant_id: tenantId, title: "FAQ", slug: "faq", status: "published", blocks: faqBlocks, created_at: now, updated_at: now });
  }

  // ── Contact ───────────────────────────────────────────────────────────────────
  {
    o = 0;
    const conBlocks: Block[] = [];
    conBlocks.push({ ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++, padding: { top: 0, right: 0, bottom: 0, left: 0 }, templateVariant: t.variants.navigation, data: { logoText: t.siteName, items: t.navItems, sticky: true, style: navStyle(t), showCta: true, ctaLabel: t.heroCTA, ctaUrl: "#form" } } as Block);
    conBlocks.push({ ...BASE_BLOCK, id: uid("hero"), type: "hero", order: o++, templateVariant: "centered-bold", data: { title: "Get In Touch", subtitle: t.tagline, primaryButton: { label: "Call Us", url: `tel:${t.phone.replace(/[^0-9+]/g, "")}`, variant: "primary" }, typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" } } } as Block);
    conBlocks.push({
      ...BASE_BLOCK, id: uid("contact"), type: "contact", order: o++,
      data: {
        title: "", subtitle: "", layout: "split", showMap: false, showContactInfo: true,
        phone: t.phone, email: t.email, address: t.address,
        fields: [
          { id: "f-name", label: "Full Name", type: "text", required: true },
          { id: "f-email", label: "Email Address", type: "email", required: true },
          { id: "f-phone", label: "Phone Number", type: "tel", required: false },
          { id: "f-msg", label: "Message", type: "textarea", required: true },
        ],
        submitLabel: "Send Message", successMessage: "Thanks! We'll be in touch shortly.", recipientEmail: t.email,
      },
    } as Block);
    pages.push({ tenant_id: tenantId, title: "Contact", slug: "contact", status: "published", blocks: conBlocks, created_at: now, updated_at: now });
  }

  return pages;
}

// Minimal starter for "blank"/unknown templates: a single published home page
// with nav + hero + contact, using a neutral default identity. Ensures a tenant
// is never fully empty (which would surface the welcome placeholder publicly).
function buildStarterPages(t: TemplateIdentity, tenantId: string, now: string) {
  let o = 0;
  const blocks: Block[] = [];

  blocks.push({
    ...BASE_BLOCK, id: uid("nav"), type: "navigation", order: o++,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    templateVariant: t.variants.navigation,
    data: {
      logoText: t.siteName,
      items: [{ id: uid("ni"), label: "Home", url: "/" }, { id: uid("ni"), label: "Contact", url: "#contact" }],
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
      phone: t.phone, email: t.email, address: t.address,
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-email", label: "Email", type: "email", required: true },
        { id: "f-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message", successMessage: "Thanks! We'll be in touch.", recipientEmail: t.email,
    },
  } as Block);

  return [{
    tenant_id: tenantId,
    title: "Home",
    slug: "home",
    status: "published",
    blocks,
    created_at: now,
    updated_at: now,
  }];
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
