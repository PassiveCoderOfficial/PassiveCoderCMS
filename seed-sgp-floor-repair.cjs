/**
 * SGP Floor Repair — vinyl/laminate/carpet flooring repair, Singapore.
 * Overwrites default "handyfix-pro" placeholder template with real content.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "ceb69d5d-8fae-491d-9831-b706af08e2ef";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// Brand tokens — Navy / Gold (from WhatsApp cover)
const PRIMARY = "#0b2545";
const SECONDARY = "#d4af37";
const DARK = "#081a33";
const LIGHT = "#f7f5ef";

const SITE_NAME = "SGP Floor Repair";
const SLOGAN = "We Repair, You Relax";
const PHONE = "+6580568266";
const PHONE_DISPLAY = "+65 8056 8266";
const EMAIL = "info@sgpfloorrepair.com";
const ADDRESS = "117 Defu Lane 10, Singapore 539229";
const WA = `https://wa.me/${PHONE.replace(/\+/g, "")}`;

// Coded SVG logo — stacked wood-plank icon + two-tone wordmark ("SGP" gold / "Floor Repair" navy)
// Uploaded via one-off script to Supabase storage (see uploads/sgp-floor-repair/logo.svg)
const LOGO_URL = "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/sgp-floor-repair/logo.svg";

// Stock imagery (Unsplash direct-serve URLs — no download needed)
const IMG = {
  heroVinyl: "https://images.unsplash.com/photo-1772306814076-ff65f53ac438?w=1600&q=80",
  heroLaminate: "https://images.unsplash.com/photo-1757742690834-aa581b9f53b2?w=1600&q=80",
  vinylPlank: "https://images.unsplash.com/photo-1575204015311-0fe377370780?w=1200&q=80",
  carpet: "https://images.unsplash.com/photo-1676474987690-2fc0582a07ec?w=1200&q=80",
  cementScreed: "https://images.unsplash.com/photo-1772300164438-f73307d3b645?w=1200&q=80",
  staircase: "https://images.unsplash.com/photo-1768578927229-93ec4150fe9a?w=1200&q=80",
  waterDamage: "https://images.unsplash.com/photo-1618178167824-cc143a5976e1?w=1200&q=80",
  fullRedo: "https://images.unsplash.com/photo-1721739511140-c53a4f6ef2c2?w=1200&q=80",
  workerTool: "https://images.unsplash.com/photo-1675050861806-d5a2b7ce3898?w=1200&q=80",
  livingRoom: "https://images.unsplash.com/photo-1649083048770-82e8ffd80431?w=1200&q=80",
  woodFloorClose: "https://images.unsplash.com/photo-1688274165311-15de2165d686?w=1200&q=80",
  decking: "https://images.unsplash.com/photo-1574120583586-de8847ae992c?w=1200&q=80",
  capping: "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/sgp-floor-repair/capping-floor.jpg",
  siliconRedo: "https://images.pexels.com/photos/6124242/pexels-photo-6124242.jpeg?auto=compress&w=1200&h=800&dpr=1",
  avatar1: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80",
  avatar2: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
  avatar3: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
};

const ZERO_PAD = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 80, right: 0, bottom: 80, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" },
};

// ─── SERVICES (condensed from 11 WhatsApp catalog items to 6 categories) ────
const SERVICES = [
  {
    slug: "vinyl-laminate-repair", icon: "🪵", title: "Vinyl & Laminate Repair",
    short: "Tear, scratch, dent, gap and lift/seam repair for vinyl and laminate flooring — wall panels too.",
    img: IMG.vinylPlank,
  },
  {
    slug: "carpet-install-repair", icon: "🧵", title: "Carpet Install & Repair",
    short: "Carpet installation and repair for homes and offices, done neatly and fast.",
    img: IMG.carpet,
  },
  {
    slug: "cement-screeding", icon: "🧱", title: "Cement Screeding & Self-Leveling",
    short: "Fixing popped tiles and uneven or hollow-sounding floors with proper self-leveling screed.",
    img: IMG.cementScreed,
  },
  {
    slug: "staircase-decking", icon: "🪜", title: "Staircase & Decking",
    short: "Indoor staircase and outdoor step repair, plus WPC and wooden decking installation and fixes.",
    img: IMG.staircase,
  },
  {
    slug: "water-damage-repair", icon: "💧", title: "Water Damage Repair",
    short: "Toilet and balcony area laminate/vinyl water damage — we dry out, replace and seal properly.",
    img: IMG.waterDamage,
  },
  {
    slug: "capping-skirting-replace", icon: "📏", title: "Capping, Profile & Skirting Replace",
    short: "Damaged capping, trim/profile strips and skirting boards replaced — PVC or aluminium, in your choice of colour.",
    img: IMG.capping,
    detail: "Worn, cracked or breakdown capping, profile trim and skirting boards replaced with clean, matching finishes.\n\nAvailable in:\n• PVC capping — budget-friendly, wide colour range\n• Aluminium capping — more durable, premium finish\n\nBoth options come in a range of colours to match your existing or new flooring — just let us know your preference.",
  },
  {
    slug: "full-floor-redo", icon: "✨", title: "Full Floor Redo",
    short: "Complete floor colour change with silicon finishing and removal of your existing flooring.",
    img: IMG.fullRedo,
  },
  {
    slug: "full-house-silicone-redo", icon: "🧴", title: "Full House Silicone Redo",
    short: "Damaged or water-damaged silicone removed, area cleaned properly, and fresh silicone reapplied throughout your home.",
    img: IMG.siliconRedo,
    detail: "Silicone seals break down over time or get damaged by water — leaving gaps, mould or leaks around your flooring and wet areas.\n\nWe take out the existing damaged silicone, clean the area properly, then redo the silicone for a clean, watertight finish across your whole house.",
  },
];

// ─── NAV / HEADER / FOOTER ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "n1", label: "Home", url: "/", children: [] },
  { id: "n2", label: "Services", url: "/services", children: SERVICES.map((s, i) => ({ id: `n2${i}`, label: s.title, url: `/services/${s.slug}` })) },
  { id: "n3", label: "Gallery", url: "/gallery", children: [] },
  { id: "n4", label: "Reviews", url: "/reviews", children: [] },
  { id: "n5", label: "Contact", url: "/contact", children: [] },
];

function globalHeader() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO_PAD, margin: ZERO_PAD, background: { type: "color", color: "#ffffff" },
    templateVariant: "solid-with-cta",
    data: {
      logoText: SITE_NAME, logo: LOGO_URL, items: NAV_ITEMS,
      sticky: true, transparent: false, style: "default",
      backgroundColor: "#ffffff", textColor: PRIMARY, logoHeight: 36, logoCaption: "",
      showCta: true, ctaLabel: "Get a Free Quote", ctaUrl: "/contact",
    },
  };
}

function globalFooter() {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full",
    padding: ZERO_PAD, margin: ZERO_PAD, background: { type: "none" },
    data: {
      logoText: SITE_NAME,
      tagline: SLOGAN,
      logoCaption: "Vinyl Flooring Repair Specialist — Singapore",
      style: "dark", backgroundColor: DARK, accentColor: SECONDARY, textColor: "#cdd7e0",
      copyrightText: `© {year} ${SITE_NAME}. All rights reserved.`,
      copyrightYear: true, showNewsletter: false,
      socials: [
        { platform: "facebook", url: "#" },
        { platform: "whatsapp", url: WA },
        { platform: "instagram", url: "#" },
      ],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.map((s) => ({ id: uid("fl"), label: s.title, url: `/services/${s.slug}` })) },
        { id: uid("fc"), heading: "Company", links: [
          { id: uid("fl"), label: "Gallery", url: "/gallery" },
          { id: uid("fl"), label: "Reviews", url: "/reviews" },
          { id: uid("fl"), label: "Contact", url: "/contact" },
        ]},
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: PHONE_DISPLAY, url: `tel:${PHONE}` },
          { id: uid("fl"), label: "WhatsApp Us", url: WA },
          { id: uid("fl"), label: ADDRESS, url: `https://maps.google.com/?q=${encodeURIComponent(ADDRESS)}` },
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
      primaryButton: primary ?? { label: "📞 Call Us Now", url: `tel:${PHONE}`, variant: "primary" },
      secondaryButton: secondary ?? { label: "💬 WhatsApp Us", url: WA, variant: "outline" },
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

function contactBlock(order, title = "Get a Free Quote", subtitle = "Reach out for a free quote — we respond fast.") {
  return {
    ...BASE, id: uid("contact"), type: "contact", order,
    data: {
      title, subtitle, layout: "split", showMap: true, showContactInfo: true,
      phone: PHONE, email: EMAIL, address: ADDRESS, recipientEmail: EMAIL,
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "f-service", label: "Issue / Service Needed", type: "text", required: false },
        { id: "f-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message",
      successMessage: "Thank you! We'll get back to you shortly.",
    },
  };
}

function servicesGrid(order, items, { title = "Our Services", subtitle = "Flooring repair specialists — vinyl, laminate, carpet and more.", bg } = {}) {
  return {
    ...BASE, id: uid("svc"), type: "services", order,
    background: bg ? { type: "color", color: bg } : { type: "none" },
    templateVariant: "image-cards-dark",
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
      title: "Why Choose SGP Floor Repair", subtitle: "",
      layout: "alternating", columns: 2, style: "minimal",
      items: [{
        id: uid("f"), title: "Expert Floor Repair, Done Right the First Time",
        description: "We specialise in vinyl and laminate flooring repair across Singapore — residential and commercial. No job too small, no floor too damaged.\n\n✅ Expert, experienced technicians\n✅ Fast, reliable service\n✅ Durable, neat, long-lasting workmanship\n✅ Free quote via call or WhatsApp\n✅ Residential & commercial",
        imageUrl: IMG.workerTool, icon: "",
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
        { id: uid("s"), step: "01", title: "Contact Us", description: "Call or WhatsApp us with photos of the damage — we respond quickly." },
        { id: uid("s"), step: "02", title: "Free Quote", description: "We assess the job and give you a clear, no-obligation quote." },
        { id: uid("s"), step: "03", title: "We Repair", description: "Our technicians repair your floor with care and quality workmanship." },
        { id: uid("s"), step: "04", title: "You Relax", description: "Final check and handover — your floor good as new." },
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
        { id: uid("t"), name: "Melissa Tan", role: "Homeowner", company: "Bukit Batok", avatar: IMG.avatar1, content: "Our vinyl flooring had a bad tear near the kitchen. They fixed it so well you can't even tell where the damage was. Fast and affordable.", rating: 5 },
        { id: uid("t"), name: "Rizwan Ahmad", role: "Property Manager", company: "Jurong East", avatar: IMG.avatar2, content: "Used them for water-damaged laminate in a rental unit. Quick response, fair price, and the tenant was happy with the result.", rating: 5 },
        { id: uid("t"), name: "Grace Lim", role: "Homeowner", company: "Tampines", avatar: IMG.avatar3, content: "Staircase steps were creaking and looked worn out. They redid it and it looks brand new. Highly recommend SGP Floor Repair.", rating: 5 },
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
        { id: uid("f"), question: "What flooring types do you repair?", answer: "Vinyl, laminate, carpet, and we also handle cement screeding, staircases, decking and water-damaged floors." },
        { id: uid("f"), question: "Do you handle small repairs or only full jobs?", answer: "Both — from a single scratch or dent to a full floor redo, no job is too small." },
        { id: uid("f"), question: "Can I get a quote before committing?", answer: "Yes — send us photos via WhatsApp or call us, and we'll give you a clear, free quote before any work begins." },
        { id: uid("f"), question: "Do you service both homes and offices?", answer: "Yes, we handle residential and commercial flooring repair across Singapore." },
        { id: uid("f"), question: "How fast can you come for a repair?", answer: "We aim for fast, reliable turnaround — contact us and we'll confirm the soonest available slot." },
      ],
    },
  };
}

function benefitsBlock(order) {
  return {
    ...BASE, id: uid("feat"), type: "features", order,
    background: { type: "color", color: LIGHT },
    templateVariant: "icon-list-cards",
    data: {
      title: "Benefits of Professional Floor Restoration", subtitle: "Our services help you:",
      layout: "list", columns: 2, style: "checklist",
      items: [
        { id: uid("f"), icon: "Sparkles", title: "Restore the natural shine", description: "" },
        { id: uid("f"), icon: "Sparkles", title: "Remove dullness", description: "" },
        { id: uid("f"), icon: "Sparkles", title: "Improve the appearance of your property", description: "" },
        { id: uid("f"), icon: "Sparkles", title: "Repair damaged flooring", description: "" },
        { id: uid("f"), icon: "Sparkles", title: "Extend the life of your floors", description: "" },
        { id: uid("f"), icon: "Sparkles", title: "Avoid expensive floor replacement", description: "" },
        { id: uid("f"), icon: "Sparkles", title: "Increase property value", description: "" },
        { id: uid("f"), icon: "Sparkles", title: "Create a clean and welcoming environment", description: "" },
      ],
    },
  };
}

function whyRepairBlock(order) {
  return {
    ...BASE, id: uid("feat"), type: "features", order,
    background: { type: "color", color: "#ffffff" },
    templateVariant: "alternating-images",
    data: {
      title: "Why Repair Instead of Replace?", subtitle: "",
      layout: "alternating", columns: 2, style: "minimal",
      items: [{
        id: uid("f"), title: "Save Time, Save Money",
        description: "Replacing floors can be expensive, messy, and time-consuming. Professional floor repair offers a cost-effective solution that restores your existing flooring while saving you time and money.\n\nIf your flooring is still structurally sound, repair is often the smarter choice.",
        imageUrl: IMG.workerTool, icon: "",
      }],
    },
  };
}

function whyChooseUsGridBlock(order) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", order,
    background: { type: "color", color: LIGHT },
    templateVariant: "outlined-cards",
    data: {
      title: "Why Choose Us?", subtitle: "", columns: 4, iconSize: "md",
      items: [
        { id: uid("i"), icon: "Wrench", label: "Experienced Floor Specialists", description: "Our team has years of experience repairing different types of flooring." },
        { id: uid("i"), icon: "HardHat", label: "Professional Equipment", description: "We use proper tools and techniques for consistent, high-quality repairs." },
        { id: uid("i"), icon: "BadgeCheck", label: "Honest Pricing", description: "No hidden charges. You'll receive a clear quote before work starts." },
        { id: uid("i"), icon: "ShieldCheck", label: "Quality Workmanship", description: "Every job is completed with care and attention to detail." },
      ],
    },
  };
}

function perfectForBlock(order) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", order,
    background: { type: "color", color: "#ffffff" },
    templateVariant: "pill-row",
    data: {
      title: "Perfect For", subtitle: "", columns: 4, iconSize: "sm",
      items: [
        "HDB Flats", "Condominiums", "Landed Homes", "Apartments",
        "Offices", "Hotels", "Restaurants", "Shopping Malls",
        "Retail Stores", "Schools", "Commercial Buildings",
      ].map((label) => ({ id: uid("i"), icon: "Star", label })),
    },
  };
}

function trustBlock(order) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", order,
    background: { type: "color", color: LIGHT },
    templateVariant: "numbered-features",
    data: {
      title: "Why Customers Trust Us", subtitle: "", columns: 2, iconSize: "sm",
      items: [
        "Experienced and Skilled Team", "Proper Tools & Techniques", "Transparent and Honest Pricing",
        "Fast Response Across Singapore", "Reliable and Friendly Service", "High-Quality Workmanship",
        "Residential & Commercial Expertise", "Commitment to Customer Satisfaction",
      ].map((label) => ({ id: uid("i"), icon: "Star", label })),
    },
  };
}

// ─── PAGE BUILDERS ──────────────────────────────────────────────────────────
function buildHome() {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: "🏠 Singapore's Trusted Floor Repair Specialist",
      title: "We Repair,\nYou Relax",
      subtitle: SITE_NAME,
      description: "Vinyl · Laminate · Carpet · Staircase & Decking — expert flooring repair, done neat and fast.",
      img: IMG.heroVinyl,
    }),
    servicesGrid(o++, SERVICES, { bg: "#ffffff" }),
    whyChooseUsBlock(o++),
    benefitsBlock(o++),
    whyRepairBlock(o++),
    galleryBlock(o++, [
      IMG.vinylPlank, IMG.carpet, IMG.cementScreed, IMG.staircase,
      IMG.waterDamage, IMG.fullRedo, IMG.livingRoom, IMG.woodFloorClose,
    ], "Recent Projects"),
    stepsBlock(o++),
    whyChooseUsGridBlock(o++),
    perfectForBlock(o++),
    trustBlock(o++),
    testimonialsBlock(o++),
    faqBlock(o++),
    ctaBlock(o++, "Got a Damaged Floor?", "Call or WhatsApp us today for a free quote."),
    contactBlock(o++),
  ];
}

function buildServicesOverview() {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: "Our Services", title: "Flooring Repair, Done Right",
      subtitle: SLOGAN, description: "Six core services, one trusted team.",
      img: IMG.heroLaminate,
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
        title: `Professional ${s.title}`, subtitle: "",
        layout: "alternating", columns: 2, style: "minimal",
        items: [{
          id: uid("f"), title: `${s.title} Done Right`,
          description: s.detail
            ? `${s.detail}\n\n✅ Expert, experienced technicians\n✅ Free, transparent quotes\n✅ Residential & commercial\n✅ Fast response`
            : `${s.short}\n\n✅ Expert, experienced technicians\n✅ Free, transparent quotes\n✅ Durable, neat workmanship\n✅ Residential & commercial\n✅ Fast response`,
          imageUrl: s.img, icon: "",
        }],
      },
    },
    stepsBlock(o++),
    ctaBlock(o++, `Need ${s.title}?`, "Call or WhatsApp us for a free quote today."),
    contactBlock(o++, `${s.title} Enquiry`, "Tell us about your floor issue — we'll respond fast."),
  ];
}

function buildGalleryPage() {
  let o = 0;
  const all = [IMG.vinylPlank, IMG.carpet, IMG.cementScreed, IMG.staircase, IMG.waterDamage, IMG.fullRedo, IMG.livingRoom, IMG.woodFloorClose, IMG.decking, IMG.workerTool];
  return [
    heroBlock(o++, {
      badge: "📸 Our Work", title: "Project Gallery",
      subtitle: SLOGAN, description: "A look at the kind of flooring repair work we do across Singapore.",
      img: IMG.livingRoom,
    }),
    galleryBlock(o++, all, "Completed Projects"),
    ctaBlock(o++, "Like What You See?", "Contact us to discuss your floor repair."),
    contactBlock(o++),
  ];
}

function buildReviewsPage() {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: "⭐ Reviews", title: "What Our Clients Say",
      subtitle: SLOGAN, description: "Real feedback from homeowners and businesses we've helped.",
      img: IMG.woodFloorClose,
    }),
    testimonialsBlock(o++),
    ctaBlock(o++, "Ready to Get Your Floor Fixed?", "Call or WhatsApp us today for a free quote."),
    contactBlock(o++),
  ];
}

function buildContactPage() {
  return [
    heroBlock(0, {
      badge: "📞 Get In Touch", title: "Contact Us",
      subtitle: SLOGAN, description: `Call, WhatsApp, or send us a message — we respond fast.\n${ADDRESS}`,
      img: IMG.heroVinyl,
      primary: { label: "Call Now", url: `tel:${PHONE}`, variant: "primary" },
      secondary: { label: "WhatsApp", url: WA, variant: "outline" },
    }),
    contactBlock(1, "Send Us a Message", "Tell us about your floor issue and we'll help you out."),
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
  console.log("SGP Floor Repair seed starting...\n");

  const pages = [];
  pages.push(["home", "Home", buildHome()]);
  pages.push(["services", "Services", buildServicesOverview()]);
  pages.push(["gallery", "Gallery", buildGalleryPage()]);
  pages.push(["reviews", "Reviews", buildReviewsPage()]);
  pages.push(["contact", "Contact", buildContactPage()]);
  for (const s of SERVICES) pages.push([`services/${s.slug}`, s.title, buildServicePage(s)]);

  // remove stale pages from prior "handyfix-pro" placeholder template (e.g. pricing, faq, about)
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
    logo_url: LOGO_URL, logo_alt: SITE_NAME, logo_width: 160,
    site_name: SITE_NAME, tagline: SLOGAN,
    active_template_slug: "sgp-floor-repair-custom",
    primary_color: PRIMARY, secondary_color: SECONDARY,
    global_header: globalHeader(), global_footer: globalFooter(),
    updated_at: now,
  }).eq("tenant_id", TENANT_ID);
  if (idErr) console.error("site_identity:", idErr.message);
  else console.log("✓ site_identity rebranded, global header + footer set");

  console.log("\n✅ Done. Visit https://sgpfloorrepair.passivecoder.com/");
}

run().catch(console.error);
