/**
 * Suteki Engineering Pte Ltd — full rebrand & content build.
 * Renovation, Reinstatement, Electrical, Plumbing, Handyman. Real project photos.
 * Overwrites existing template-seeded pages for this tenant.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "46384b67-7497-4ec2-aedf-27fe4a9f836f";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

const media = JSON.parse(fs.readFileSync(path.join(__dirname, "suteki-media-urls.json"), "utf8"));
const LOGO_URL = media["suteki-logo.png"];

// Brand tokens — Steel Navy / Cyan glow (from logo)
const PRIMARY = "#0e3a5f";
const SECONDARY = "#22d3ee";
const DARK = "#0a1a2b";
const LIGHT = "#f4f8fb";

const SLOGAN = "Renovation, Electrical & Plumbing — All Under One Roof";
const PHONE = "+6590355235";
const PHONE_DISPLAY = "+65 9035 5235";
const EMAIL = "info@sutekiengsg.com";
const WA = `https://wa.me/${PHONE.replace(/\+/g, "")}`;
const FB = "https://www.facebook.com/share/194UQd8eLK/?mibextid=wwXIfr";
const UEN = "UEN No. 202104846K";

const ZERO_PAD = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 80, right: 0, bottom: 80, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" },
};

// ─── SERVICES ───────────────────────────────────────────────────────────────
const SERVICES = [
  {
    slug: "renovation", icon: "🏗️", title: "Renovation",
    short: "Full home & commercial renovation — kitchens, bathrooms, flooring, carpentry and fit-outs.",
    img: media["renovation-08-living-room-complete.jpg"],
    gallery: [
      media["renovation-01-kitchen-pot-filler.jpg"], media["renovation-02-bathroom-vessel-sink.jpg"],
      media["renovation-03-pendant-light.jpg"], media["renovation-06-kitchen-sink-faucet.jpg"],
      media["renovation-07-ceiling-fan-light.jpg"], media["renovation-09-bathroom-mirror-sink.jpg"],
      media["renovation-10-shower-fitting.jpg"],
      media["renovation-11-bathroom-yellow-vanity.jpg"], media["renovation-12-bathroom-marble-sink.jpg"],
      media["renovation-13-feature-wall-led.jpg"], media["renovation-14-bathtub-marble.jpg"],
      media["renovation-15-bathroom-green-tile.jpg"], media["renovation-16-bathroom-vessel-sink.jpg"],
      media["renovation-17-bathroom-wood-vanity.jpg"], media["renovation-18-kitchen-living-room.jpg"],
      media["renovation-19-bathroom-mirror-cabinet.jpg"], media["renovation-20-bathroom-wood-cabinet.jpg"],
    ],
  },
  {
    slug: "reinstatement", icon: "🔨", title: "Reinstatement",
    short: "Office & unit reinstatement to original condition — hacking, tiling and full handover-ready finishing.",
    img: media["reinstatement-05-commercial-shower-room.jpg"],
    gallery: [
      media["reinstatement-01-floor-tile-removal.jpg"], media["reinstatement-02-floor-hacking.jpg"],
      media["reinstatement-04-commercial-toilet.jpg"], media["reinstatement-05-commercial-shower-room.jpg"],
      media["reinstatement-06-office-inprogress.jpg"],
    ],
  },
  {
    slug: "electrical", icon: "⚡", title: "Electrical",
    short: "Licensed electrical works — DB box rewiring, power points, lighting circuits and fault-finding.",
    img: media["electrical-03-db-box-completed.jpg"],
    gallery: [
      media["electrical-01-db-wiring.jpg"], media["electrical-02-db-box-rewiring.jpg"], media["electrical-03-db-box-completed.jpg"],
      media["electrical-04-track-lighting-fan.jpg"], media["electrical-05-db-box-wiring.jpg"],
      media["electrical-06-ceiling-fan-light-install.jpg"],
    ],
  },
  {
    slug: "plumbing", icon: "🔧", title: "Plumbing",
    short: "Water heater installs, pipe rough-ins, sink traps, shower sets and floor drains — leak-free guaranteed.",
    img: media["plumbing-06-water-heater-install.jpg"],
    gallery: [
      media["plumbing-01-water-heater.jpg"], media["plumbing-02-sink-pipe-rough-in.jpg"],
      media["plumbing-03-floor-drain-install.jpg"], media["plumbing-04-bathroom-sink-rough-in.jpg"],
      media["plumbing-05-sink-trap-install.jpg"], media["plumbing-06-water-heater-install.jpg"],
      media["plumbing-07-shower-set-install.jpg"], media["plumbing-08-shower-heater-install.jpg"],
    ],
  },
  {
    slug: "handyman", icon: "🛠️", title: "Handyman",
    short: "General home maintenance and repairs — no job too small.",
    img: media["renovation-13-feature-wall-led.jpg"],
    gallery: [],
  },
];

// ─── NAV / HEADER / FOOTER ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "n1", label: "Home", url: "/", children: [] },
  { id: "n2", label: "Services", url: "/services", children: SERVICES.map((s, i) => ({ id: `n2${i}`, label: s.title, url: `/services/${s.slug}` })) },
  { id: "n3", label: "About", url: "/about", children: [] },
  { id: "n4", label: "Gallery", url: "/gallery", children: [] },
  { id: "n5", label: "Contact", url: "/contact", children: [] },
];

function globalHeader() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO_PAD, margin: ZERO_PAD, background: { type: "color", color: "#ffffff" },
    templateVariant: "solid-with-cta",
    data: {
      logoText: "Suteki Engineering", logo: LOGO_URL, items: NAV_ITEMS,
      sticky: true, transparent: false, style: "default",
      backgroundColor: "#ffffff", textColor: DARK, logoHeight: 56, logoCaption: UEN,
      showCta: true, ctaLabel: "Get a Quote", ctaUrl: "/contact",
    },
  };
}

function globalFooter() {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full",
    padding: ZERO_PAD, margin: ZERO_PAD, background: { type: "none" },
    data: {
      logoText: "Suteki Engineering Pte Ltd",
      tagline: SLOGAN,
      logoCaption: UEN,
      style: "dark", backgroundColor: DARK, accentColor: SECONDARY, textColor: "#cdd7e0",
      copyrightText: "© {year} Suteki Engineering Pte Ltd. All rights reserved.",
      copyrightYear: true, showNewsletter: false,
      socials: [
        { platform: "facebook", url: FB },
        { platform: "whatsapp", url: WA },
      ],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.map((s) => ({ id: uid("fl"), label: s.title, url: `/services/${s.slug}` })) },
        { id: uid("fc"), heading: "Company", links: [
          { id: uid("fl"), label: "About Us", url: "/about" },
          { id: uid("fl"), label: "Gallery", url: "/gallery" },
          { id: uid("fl"), label: "Contact", url: "/contact" },
        ]},
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: PHONE_DISPLAY, url: `tel:${PHONE}` },
          { id: uid("fl"), label: EMAIL, url: `mailto:${EMAIL}` },
          { id: uid("fl"), label: "WhatsApp Us", url: WA },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── reusable block helpers ─────────────────────────────────────────────────
function heroBlock(order, { badge, title, subtitle, description, img, primary, secondary }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", order, padding: ZERO_PAD,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: DARK, imageOverlayOpacity: 0.65 },
    data: {
      layout: "centered", badge, title, subtitle, description,
      primaryButton: primary ?? { label: "Call Us", url: `tel:${PHONE}`, variant: "primary" },
      secondaryButton: secondary ?? { label: "WhatsApp Us", url: WA, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: "6xl", titleColor: "#ffffff", subtitleColor: SECONDARY, descColor: "#dbe9f0" },
    },
  };
}

function ctaBlock(order, title, desc) {
  return {
    ...BASE, id: uid("cta"), type: "cta", order, padding: ZERO_PAD,
    background: { type: "gradient", gradient: `linear-gradient(135deg, ${PRIMARY}, ${DARK})` },
    templateVariant: "gradient-banner",
    data: {
      title, description: desc,
      primaryButton: { label: "Call Us", url: `tel:${PHONE}` },
      secondaryButton: { label: "WhatsApp Now", url: WA },
      layout: "centered",
    },
  };
}

function contactBlock(order, title = "Get In Touch", subtitle = "Reach out for a free quote — we respond fast.") {
  return {
    ...BASE, id: uid("contact"), type: "contact", order,
    data: {
      title, subtitle, layout: "split", showMap: false, showContactInfo: true,
      phone: PHONE, email: EMAIL, address: "", recipientEmail: EMAIL,
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "f-service", label: "Service Needed", type: "text", required: false },
        { id: "f-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message",
      successMessage: "Thank you! We'll get back to you shortly.",
    },
  };
}

function servicesGrid(order, items, { title = "Our Services", subtitle = "Renovation, reinstatement, electrical, plumbing and handyman services.", bg } = {}) {
  return {
    ...BASE, id: uid("svc"), type: "services", order,
    background: bg ? { type: "color", color: bg } : { type: "none" },
    templateVariant: "icon-cards-grid",
    data: {
      title, subtitle, layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: items.map((s) => ({
        id: uid("sv"), title: `${s.icon} ${s.title}`, description: s.short,
        icon: s.icon, iconType: "emoji", imageUrl: s.img,
        linkLabel: "Learn More", link: `/services/${s.slug}`,
      })),
    },
  };
}

function galleryBlock(order, urls, title = "Our Work") {
  return {
    ...BASE, id: uid("gal"), type: "gallery", order,
    background: { type: "color", color: LIGHT },
    data: {
      title, layout: "masonry", columns: 3, gap: "md", lightbox: true,
      images: urls.map((url) => ({ id: uid("gi"), url, alt: title, caption: "" })),
    },
  };
}

function whyChooseUsBlock(order) {
  return {
    ...BASE, id: uid("feat"), type: "features", order,
    background: { type: "color", color: "#ffffff" },
    templateVariant: "alternating-images",
    data: {
      title: "Why Choose Suteki Engineering", subtitle: "",
      layout: "alternating", columns: 2, style: "minimal",
      items: [{
        id: uid("f"), title: "Trusted by Homeowners & Businesses Across Singapore",
        description: "Suteki Engineering Pte Ltd delivers renovation, reinstatement, electrical, plumbing and handyman services with one team, one point of contact, and consistent quality from start to finish.\n\n✅ Responsive, on-time service\n✅ Experienced tradesmen across all trades\n✅ Clean, professional workmanship\n✅ Transparent quotes — no hidden costs\n✅ Residential & commercial projects",
        imageUrl: media["renovation-14-bathtub-marble.jpg"], icon: "",
      }],
    },
  };
}

function stepsBlock(order) {
  return {
    ...BASE, id: uid("steps"), type: "steps", order,
    background: { type: "color", color: LIGHT },
    data: {
      title: "How It Works", subtitle: "Simple, straightforward process from enquiry to completion",
      layout: "horizontal", style: "connected",
      items: [
        { id: uid("s"), step: "01", title: "Contact Us", description: "Call or WhatsApp us with your requirements — we respond quickly." },
        { id: uid("s"), step: "02", title: "Free Quote", description: "We assess the job and provide a clear, transparent quote." },
        { id: uid("s"), step: "03", title: "We Get to Work", description: "Our tradesmen complete the job with quality workmanship and care." },
        { id: uid("s"), step: "04", title: "Job Done Right", description: "Final walkthrough and handover — satisfaction guaranteed." },
      ],
    },
  };
}

function testimonialsBlock(order) {
  return {
    ...BASE, id: uid("tes"), type: "testimonials", order,
    background: { type: "color", color: "#ffffff" },
    templateVariant: "quote-cards",
    data: {
      title: "What Our Clients Say", subtitle: "", layout: "grid",
      items: [
        { id: uid("t"), name: "Jason Lim", role: "Homeowner", company: "Tampines", avatar: "", content: "Suteki handled our full kitchen and bathroom renovation. Clean work, on schedule, and very responsive throughout. Highly recommended.", rating: 5 },
        { id: uid("t"), name: "Priya Nair", role: "Office Manager", company: "Jurong", avatar: "", content: "Needed our office reinstated before lease end. Suteki got it done properly and on time — no issues with the landlord's handover inspection.", rating: 5 },
        { id: uid("t"), name: "Wei Ming Tan", role: "Homeowner", company: "Bedok", avatar: "", content: "Called them for an electrical fault and they also helped fix a leaking pipe the same visit. One call really does cover it all.", rating: 5 },
      ],
    },
  };
}

function faqBlock(order) {
  return {
    ...BASE, id: uid("faq"), type: "faq", order,
    background: { type: "color", color: LIGHT },
    templateVariant: "accordion-bordered",
    data: {
      title: "Frequently Asked Questions", subtitle: "", layout: "accordion", allowMultiple: false,
      items: [
        { id: uid("f"), question: "What areas do you service?", answer: "We serve residential and commercial properties across Singapore." },
        { id: uid("f"), question: "Do you handle both renovation and reinstatement?", answer: "Yes — we handle full renovation projects as well as office/unit reinstatement back to original condition for lease handovers." },
        { id: uid("f"), question: "Are your electricians and plumbers licensed?", answer: "Yes, all electrical and plumbing works are carried out by experienced, qualified tradesmen." },
        { id: uid("f"), question: "Can I get a quote before committing?", answer: "Yes — contact us via call or WhatsApp and we'll provide a clear, transparent quote before any work begins." },
        { id: uid("f"), question: "Do you do small handyman jobs too?", answer: "Yes — no job is too small. Aircon servicing, general repairs, garden clean-up and more." },
      ],
    },
  };
}

// ─── PAGE BUILDERS ──────────────────────────────────────────────────────────
function buildHome() {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: "🏠 Singapore's Trusted Multi-Trade Team",
      title: "Renovation, Electrical &\nPlumbing — All Under One Roof",
      subtitle: "Suteki Engineering Pte Ltd",
      description: "Renovation · Reinstatement · Electrical · Plumbing · Handyman — one team, one call, quality work.",
      img: media["renovation-08-living-room-complete.jpg"],
      primary: { label: "📞 Call Us Now", url: `tel:${PHONE}`, variant: "primary" },
      secondary: { label: "💬 WhatsApp Us", url: WA, variant: "outline" },
    }),
    servicesGrid(o++, SERVICES, { bg: "#ffffff" }),
    whyChooseUsBlock(o++),
    galleryBlock(o++, [
      media["renovation-08-living-room-complete.jpg"], media["reinstatement-05-commercial-shower-room.jpg"],
      media["electrical-03-db-box-completed.jpg"], media["plumbing-06-water-heater-install.jpg"],
      media["renovation-14-bathtub-marble.jpg"], media["renovation-18-kitchen-living-room.jpg"],
      media["renovation-11-bathroom-yellow-vanity.jpg"], media["electrical-04-track-lighting-fan.jpg"],
    ], "Recent Projects"),
    stepsBlock(o++),
    testimonialsBlock(o++),
    faqBlock(o++),
    ctaBlock(o++, "Need a Job Done Right?", "Call or WhatsApp us today for a free quote."),
    contactBlock(o++),
  ];
}

function buildAbout() {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: "About Suteki Engineering", title: "Your Trusted Multi-Trade Partner",
      subtitle: SLOGAN, description: "One team for renovation, reinstatement, electrical, plumbing and handyman services.",
      img: media["renovation-18-kitchen-living-room.jpg"],
      primary: { label: "Contact Us", url: "/contact", variant: "primary" },
      secondary: { label: "Our Services", url: "/services", variant: "outline" },
    }),
    whyChooseUsBlock(o++),
    {
      ...BASE, id: uid("feat"), type: "features", order: o++,
      background: { type: "color", color: LIGHT },
      templateVariant: "icon-list-cards",
      data: {
        title: "Every Trade, One Trusted Team", subtitle: "",
        layout: "grid", columns: 2, style: "minimal",
        items: [
          { id: uid("f"), icon: "Hammer", title: "Renovation & Reinstatement", description: "From full home renovations to office reinstatement before lease handover — finished to a standard that passes inspection.", imageUrl: media["renovation-19-bathroom-mirror-cabinet.jpg"] },
          { id: uid("f"), icon: "Zap", title: "Electrical & Plumbing", description: "Licensed electricians and plumbers handling everything from DB box rewiring to water heater installs, done safely and to code.", imageUrl: media["electrical-05-db-box-wiring.jpg"] },
        ],
      },
    },
    stepsBlock(o++),
    ctaBlock(o++, "Let's Get Started", "Reach out today for a free, no-obligation quote."),
    contactBlock(o++),
  ];
}

function buildServicesOverview() {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: "Our Services", title: "Renovation, Electrical, Plumbing & More",
      subtitle: SLOGAN, description: "Five core services, one trusted team.",
      img: media["electrical-03-db-box-completed.jpg"],
      primary: { label: "Get a Quote", url: "/contact", variant: "primary" },
      secondary: { label: "WhatsApp Us", url: WA, variant: "outline" },
    }),
    servicesGrid(o++, SERVICES, { bg: "#ffffff", title: "What We Do" }),
    ctaBlock(o++, "Not Sure What You Need?", "Call or WhatsApp us — we'll help you figure it out."),
    contactBlock(o++),
  ];
}

function buildServicePage(s) {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: `${s.icon} ${s.title}`, title: s.title,
      subtitle: SLOGAN, description: s.short, img: s.img,
    }),
    {
      ...BASE, id: uid("feat"), type: "features", order: o++,
      templateVariant: "alternating-images",
      data: {
        title: `Professional ${s.title} Services`, subtitle: "",
        layout: "alternating", columns: 2, style: "minimal",
        items: [{
          id: uid("f"), title: `${s.title} Done Right`,
          description: `${s.short}\n\n✅ Experienced tradesmen\n✅ Transparent, upfront quotes\n✅ Clean, professional workmanship\n✅ Residential & commercial projects\n✅ Responsive scheduling`,
          imageUrl: s.img, icon: "",
        }],
      },
    },
    ...(s.gallery.length ? [galleryBlock(o++, s.gallery, `${s.title} — Our Work`)] : []),
    stepsBlock(o++),
    ctaBlock(o++, `Need ${s.title} Done?`, "Call or WhatsApp us for a free quote today."),
    contactBlock(o++, `${s.title} Enquiry`, "Tell us about your project — we'll respond fast."),
  ];
}

function buildGalleryPage() {
  let o = 0;
  const all = SERVICES.flatMap((s) => s.gallery);
  return [
    heroBlock(o++, {
      badge: "📸 Our Work", title: "Project Gallery",
      subtitle: SLOGAN, description: "Real photos from our renovation, reinstatement, electrical, plumbing and handyman projects.",
      img: media["renovation-08-living-room-complete.jpg"],
    }),
    galleryBlock(o++, all, "Completed Projects", "Browse our recent work across all services."),
    ctaBlock(o++, "Like What You See?", "Contact us to discuss your project."),
    contactBlock(o++),
  ];
}

function buildContactPage() {
  return [
    heroBlock(0, {
      badge: "📞 Get In Touch", title: "Contact Us",
      subtitle: SLOGAN, description: "Call, WhatsApp, or send us a message — we respond fast.",
      img: media["renovation-13-feature-wall-led.jpg"],
      primary: { label: "Call Now", url: `tel:${PHONE}`, variant: "primary" },
      secondary: { label: "WhatsApp", url: WA, variant: "outline" },
    }),
    contactBlock(1, "Send Us a Message", "We're here to help with any renovation, electrical, plumbing or handyman need."),
  ];
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
async function upsertPage(slug, title, blocks, now) {
  const { data: existing } = await sb.from("pages").select("id").eq("tenant_id", TENANT_ID).eq("slug", slug).maybeSingle();
  blocks.forEach((b, i) => { b.order = i; });
  if (existing) {
    const { error } = await sb.from("pages").update({ title, blocks, status: "published", updated_at: now }).eq("id", existing.id);
    return error;
  }
  const { error } = await sb.from("pages").insert({ tenant_id: TENANT_ID, slug, title, status: "published", blocks, created_at: now, updated_at: now });
  return error;
}

async function run() {
  const now = new Date().toISOString();
  console.log("Suteki Engineering seed starting...\n");

  const pages = [];
  pages.push(["home", "Home", buildHome()]);
  pages.push(["about", "About Us", buildAbout()]);
  pages.push(["services", "Services", buildServicesOverview()]);
  pages.push(["gallery", "Gallery", buildGalleryPage()]);
  pages.push(["contact", "Contact", buildContactPage()]);
  for (const s of SERVICES) pages.push([`services/${s.slug}`, s.title, buildServicePage(s)]);

  // remove stale pages from prior template seed that are no longer used
  const KEEP_SLUGS = new Set(pages.map(([slug]) => slug));
  const { data: existingPages } = await sb.from("pages").select("id, slug").eq("tenant_id", TENANT_ID);
  for (const p of existingPages ?? []) {
    if (!KEEP_SLUGS.has(p.slug)) {
      await sb.from("pages").delete().eq("id", p.id);
      console.log("✗ removed stale page:", p.slug);
    }
  }

  let ok = 0, fail = 0;
  for (const [slug, title, blocks] of pages) {
    const err = await upsertPage(slug, title, blocks, now);
    if (err) { console.error("✗", slug, err.message); fail++; }
    else { ok++; console.log(`  ✓ ${slug}`); }
  }
  console.log(`\n✓ Pages upserted: ${ok} ok, ${fail} failed (total ${pages.length})`);

  const { error: idErr } = await sb.from("site_identity").update({
    logo_url: LOGO_URL, logo_alt: "Suteki Engineering Pte Ltd", logo_width: 160,
    site_name: "Suteki Engineering Pte Ltd", tagline: SLOGAN,
    active_template_slug: "suteki-custom",
    primary_color: PRIMARY, secondary_color: SECONDARY,
    global_header: globalHeader(), global_footer: globalFooter(),
    updated_at: now,
  }).eq("tenant_id", TENANT_ID);
  if (idErr) console.error("site_identity:", idErr.message);
  else console.log("✓ site_identity rebranded, global header + footer set");

  console.log("\n✅ Done. Visit https://sutekiengsg.passivecoder.com/");
}

run().catch(console.error);
