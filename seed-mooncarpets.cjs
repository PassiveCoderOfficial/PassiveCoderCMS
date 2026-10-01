/**
 * Moon Carpets L.L.C S.P.C — carpets, curtains, wallpaper, wall panels, SPC
 * flooring, artificial grass and foam sheets. Capital Mall, Abu Dhabi.
 * Basic-plan demo at mooncarpets.passivecoder.com. English only, light ivory
 * theme with the magenta + charcoal of the shop signboard.
 * Client photos (showroom, sample boards, storefront) come from
 * clients/Moon Carpets/site-assets (built by build-assets.cjs there); the rest
 * are Pexels stand-ins. No prices on the site — every enquiry goes to WhatsApp.
 * Safe to re-run; `--skip-assets` skips the storage upload.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "mooncarpets";
const PLAN = "basic";
const TEMPLATE_SLUG = "construction-classic";
const DEMO_HOURS = 24 * 7;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Moon Carpets";
const LEGAL_NAME = "Moon Carpets L.L.C S.P.C";
const PHONE = "+971588393675";
const PHONE_DISPLAY = "+971 58 839 3675";
const WA_NUMBER = "971588393675";
const ADDRESS = "Shop AB154, Ground Floor, Capital Mall, Abu Dhabi, UAE";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Capital+Mall+Abu+Dhabi";
const MAP_EMBED = "https://maps.google.com/maps?q=Capital%20Mall%20Abu%20Dhabi&z=16&output=embed";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hello Moon Carpets, I would like to ask about your products.");

const MAGENTA = "#D6168F";
const MAGENTA_DEEP = "#A80F70";
const CHARCOAL = "#2A2629";
const CHARCOAL_DEEP = "#1C191B";
const IVORY = "#FAF7F2";   // page background
const SAND = "#F1EBE2";    // alternate band
const STONE = "#E4DBCF";

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
const LOGO_ON_LIGHT = asset("logo-dark-text.png");
const LOGO_ON_DARK = asset("logo-light-text.png");
const FAVICON_URL = asset("favicon.png");

// Pexels (free for commercial use), stand-ins until the client sends more of their own photos.
const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const IMG = {
  heroRoom: px(6588591, 2000),
  bedroomCurtains: px(6588582),
  livingRug: px(8186478),
  wallpaper: px(7533932),
  slatPanel: px(6588592),
  woodPanel: px(6588587),
  spcFloor: px(6588594),
  grass: px(13083599),
  // client's own
  curtains: asset("curtains-showroom.jpg"),
  storefront: asset("storefront.jpg"),
  foam: asset("foam-sheet.jpg"),
  carpet: asset("carpet-sample.jpg"),
  marble: asset("wall-panel-marble.jpg"),
};

// ─── Product categories ─────────────────────────────────────────────────────
// [anchor, icon, title, short line, long description, image]
const CATEGORIES = [
  ["curtains", "Blinds", "Curtains",
    "Blackout, sheer and dim-out curtains, stitched to your window size.",
    "Blackout, dim-out and sheer curtains in dozens of colours and textures, from soft linen looks to rich jacquards. We measure your windows, stitch to size and fit the tracks or rods.\n\n✓ Blackout, dim-out and sheer fabrics\n✓ Made to measure for every window\n✓ Tracks, rods and motorised options\n✓ Home visit for measurement and fitting",
    IMG.curtains],
  ["wallpaper", "Paintbrush", "Wallpaper",
    "Floral, geometric, textured and plain designs for any room.",
    "Change the feel of a room in a day. Choose from floral, geometric, textured and plain wallpapers for bedrooms, majlis, offices and feature walls.\n\n✓ Large catalogue of designs and colours\n✓ Feature walls or full rooms\n✓ Professional installation\n✓ Ask for samples in the showroom",
    IMG.wallpaper],
  ["carpets", "Layers", "Carpets",
    "Wall-to-wall carpets and rugs, including Turkish-made designs.",
    "Wall-to-wall carpets for homes, offices, hotels and mosques, plus area rugs in modern and classic patterns. Many of our ranges are made in Turkey.\n\n✓ Wall-to-wall and area rugs\n✓ Modern and classic patterns\n✓ Cut to your room size\n✓ Fitting by our own team",
    IMG.carpet],
  ["wall-panels", "PanelsTopLeft", "Wall Panels",
    "Marble-look, wood-look and fluted panels for feature walls.",
    "Waterproof, easy-clean wall panels in marble-look high-gloss and wood-grain finishes. A quick way to get a premium feature wall behind a TV, a bed or in a reception.\n\n✓ Marble-look and wood-look finishes\n✓ Waterproof and easy to clean\n✓ Formaldehyde-free materials\n✓ Fast, clean installation",
    IMG.marble],
  ["spc-flooring", "Grid3x3", "SPC Flooring",
    "Waterproof, scratch-resistant click flooring in wood and stone looks.",
    "SPC (stone plastic composite) flooring gives you the look of wood or stone with none of the worry. It is waterproof, scratch-resistant and clicks together straight over most existing floors.\n\n✓ 100% waterproof core\n✓ Scratch and stain resistant\n✓ Installs over existing tiles\n✓ Wood and stone designs",
    IMG.spcFloor],
  ["artificial-grass", "Sprout", "Artificial Grass",
    "Soft, green, no-water lawns for gardens, balconies and roofs.",
    "Green all year without water or mowing. Ideal for villa gardens, balconies, rooftops, play areas and shop displays in the Abu Dhabi heat.\n\n✓ Several pile heights and densities\n✓ UV-resistant, stays green\n✓ Safe for children and pets\n✓ Supply only or supply and install",
    IMG.grass],
  ["foam-sheet", "Square", "Foam Sheet",
    "Lightweight wood-grain foam sheets for walls and ceilings.",
    "Lightweight PVC foam sheets in wood-grain and plain finishes, with matching aluminium profiles for clean edges. Easy to cut and fit for walls, cabinets and ceilings.\n\n✓ Waterproof and easy to clean\n✓ Wood-grain and plain colours\n✓ Matching edge profiles\n✓ Large 2900 × 1220 mm sheets",
    IMG.foam],
];
const catUrl = () => "/products"; // public blocks have no section anchors yet

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 88, right: 24, bottom: 88, left: 24 },
  margin: ZERO,
  background: { type: "none" },
};
const bgColor = (color) => ({ type: "color", color });

const PAGES = [
  ["home", "Home", "/"],
  ["products", "Products", "/products"],
  ["about", "About", "/about"],
  ["contact", "Contact", "/contact"],
];

function navItems() {
  return PAGES.map(([, label, url], i) => ({
    id: `n${i}`, label, url,
    children: url === "/products" ? CATEGORIES.map(([a, , t], k) => ({ id: `n${i}-${k}`, label: t, url: catUrl(a), children: [] })) : [],
  }));
}

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor("#ffffff"),
    templateVariant: "solid-with-cta",
    data: {
      logoText: SITE_NAME, logo: LOGO_ON_LIGHT, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: "#ffffff", textColor: CHARCOAL, colorMode: "legacy", activeColor: MAGENTA, ctaVariant: "solid", logoHeight: 48, logoCaption: "",
      showCta: true, ctaLabel: "WhatsApp Us", ctaUrl: WA,
    },
  };
}

// No public renderer for the Contact Details floating-WhatsApp flag yet, so the
// button rides along with the global footer as a small HTML block.
function floatingWhatsApp() {
  return {
    id: uid("wa"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      html: `<a class="mc-wa" href="${WA}" target="_blank" rel="noopener noreferrer" aria-label="Chat with Moon Carpets on WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.737 5.469 2.027 7.773L0 32l8.473-2.004A15.934 15.934 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.257 13.257 0 01-6.749-1.839l-.484-.287-5.027 1.188 1.213-4.895-.316-.502A13.263 13.263 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.266-9.987c-.398-.199-2.353-1.161-2.718-1.294-.365-.133-.631-.199-.897.199-.266.398-1.031 1.294-1.264 1.56-.233.266-.465.299-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.055-1.983-2.357-2.216-2.755-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.199-.897-2.161-1.229-2.958-.324-.778-.653-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.062.498-.365.398-1.395 1.362-1.395 3.322s1.428 3.852 1.627 4.118c.199.266 2.81 4.291 6.81 6.022.952.411 1.695.657 2.274.841.955.304 1.824.261 2.511.158.766-.114 2.353-.962 2.685-1.891.332-.929.332-1.726.232-1.891-.099-.166-.365-.266-.763-.465z"/></svg></a>`,
      // theme-image-fade tints photo cards with the primary colour; magenta is too loud for that.
      css: `.theme-image-fade{background:linear-gradient(to top,rgba(28,25,27,.55) 0%,transparent 60%)!important}.mc-wa{position:fixed;right:20px;bottom:20px;z-index:9990;width:56px;height:56px;border-radius:9999px;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease}.mc-wa:hover{transform:scale(1.06)}@media(max-width:640px){.mc-wa{right:14px;bottom:14px;width:52px;height:52px}}`,
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 1, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_ON_DARK, logoText: SITE_NAME, logoCaption: "Shop AB154 · Capital Mall",
      tagline: "Curtains, wallpaper, carpets, wall panels, SPC flooring, artificial grass and foam sheets. Supply and installation across Abu Dhabi.",
      style: "dark", backgroundColor: CHARCOAL_DEEP, accentColor: MAGENTA, textColor: "#CFC7C9",
      copyrightText: `© {year} ${LEGAL_NAME}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Products", links: CATEGORIES.map(([a, , t]) => ({ id: uid("fl"), label: t, url: catUrl(a) })) },
        { id: uid("fc"), heading: "Pages", links: PAGES.map(([, label, url]) => ({ id: uid("fl"), label, url })) },
        { id: uid("fc"), heading: "Visit Us", links: [
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: "WhatsApp us", url: WA },
          { id: uid("fl"), label: ADDRESS, url: MAPS_URL },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── sections ───────────────────────────────────────────────────────────────
function heroHome() {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: { top: 72, right: 24, bottom: 72, left: 24 },
    background: bgColor(IVORY),
    templateVariant: "split-image-right",
    data: {
      layout: "split", badge: "Capital Mall, Abu Dhabi · Shop AB154",
      title: "Curtains, Carpets & Floors\nThat Finish Your Space",
      subtitle: LEGAL_NAME,
      description: "Seven product ranges under one roof: curtains, wallpaper, carpets, wall panels, SPC flooring, artificial grass and foam sheets. We measure, supply and install.",
      badgeBgColor: MAGENTA, badgeTextColor: "#ffffff",
      primaryButton: { label: "Get a Free Quote on WhatsApp", url: waText("Hello Moon Carpets, I would like a quote."), variant: "primary" },
      secondaryButton: { label: "Browse Products", url: "/products", variant: "outline" },
      imageUrl: IMG.heroRoom, imageAlt: "Living room with floor-length curtains and wood flooring",
      typography: { titleSize: "5xl", titleColor: CHARCOAL, subtitleColor: MAGENTA, descColor: "#5C5457" },
    },
  };
}

function pageHero({ badge, title, description, img }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: CHARCOAL_DEEP, imageOverlayOpacity: 0.62 },
    data: {
      layout: "left", badge, title, subtitle: "", description, compact: true,
      badgeBgColor: MAGENTA, badgeTextColor: "#ffffff",
      primaryButton: { label: "WhatsApp Us", url: WA, variant: "primary" },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}`, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: "5xl", titleColor: "#ffffff", descColor: "#E9E2E4" },
    },
  };
}

function promises(bg = CHARCOAL) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    padding: { top: 28, right: 24, bottom: 28, left: 24 },
    templateVariant: "pill-row",
    data: {
      title: "", subtitle: "", columns: 4, iconSize: "sm",
      items: [
        ["Ruler", "Free measurement"],
        ["Hammer", "Installation by our team"],
        ["Scissors", "Made to your size"],
        ["Truck", "Delivery across Abu Dhabi"],
      ].map(([icon, label]) => ({ id: uid("i"), icon, color: MAGENTA, label, description: "" })),
    },
  };
}

function categoryCards(bg = IVORY) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "image-cards-dark",
    data: {
      title: "Our Products", subtitle: "Seven ranges, one showroom", layout: "grid", columns: 4, cardStyle: "elevated", source: "inline",
      items: CATEGORIES.map(([a, icon, title, short, , img]) => ({
        id: uid("sv"), title, description: short, icon, iconType: "lucide",
        imageUrl: img.replace("w=1600", "w=900"), linkLabel: "See details", link: catUrl(a),
      })),
    },
  };
}

// The alternating-media renderer collapses line breaks, so the ✓ list becomes one "Includes" line.
function inlineBullets(text) {
  const [intro, ...rest] = text.split("\n").filter(Boolean);
  const bullets = rest.map((l) => l.replace(/^✓\s*/, ""));
  return bullets.length ? `${intro} Includes: ${bullets.join(" · ")}.` : intro;
}

function productDetails(bg = IVORY) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "alternating-media",
    data: {
      title: "Product Categories", subtitle: "Everything for your floors, walls and windows", layout: "alternating", columns: 2, style: "minimal",
      items: CATEGORIES.map(([a, icon, title, , long, img]) => ({ id: a, title, description: inlineBullets(long), imageUrl: img.replace("w=1600", "w=1200"), icon })),
    },
  };
}

function showroom(bg = SAND) {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    templateVariant: "hero-mosaic",
    data: {
      title: "Inside Our Showroom", subtitle: "", layout: "grid", columns: 3, gap: "md", lightbox: true,
      images: [
        [IMG.curtains, "Curtain fabrics on display"],
        [IMG.storefront, "Moon Carpets, Shop AB154, Capital Mall"],
        [IMG.marble, "Marble-look wall panel samples"],
        [IMG.carpet, "Turkish-made carpet sample"],
        [IMG.foam, "Wood-grain foam sheet samples"],
      ].map(([url, alt]) => ({ id: uid("gi"), url, alt, caption: alt })),
    },
  };
}

function howItWorks(bg = IVORY) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    templateVariant: "arrow-flow",
    data: {
      title: "From Idea to Installed", subtitle: "How an order works", layout: "horizontal", style: "connected",
      items: [
        ["Send a Photo or Visit", "WhatsApp us a photo of the room, or come to the showroom at Capital Mall."],
        ["Free Measurement", "We visit, measure accurately and show samples in your space."],
        ["Choose & Confirm", "Pick your design and get a clear, written quote."],
        ["We Install", "Our team fits everything neatly and clears up after."],
      ].map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

const FAQ = [
  ["Do you offer free measurement?", "Yes. Send us your location on WhatsApp and we arrange a visit to measure and show samples."],
  ["Do you install as well as supply?", "Yes. Our own team installs curtains, wallpaper, carpets, wall panels, SPC flooring, artificial grass and foam sheets."],
  ["Which areas do you cover?", "Abu Dhabi city and surrounding areas. Ask us on WhatsApp about other emirates."],
  ["Can SPC flooring go over my existing tiles?", "In most cases, yes. SPC is a click-lock floor that can be laid over level existing tiles. We check the floor during measurement."],
  ["How long do made-to-measure curtains take?", "Usually a few days after you confirm the fabric and size. We give you the exact date with your quote."],
  ["Can I see samples before I order?", "Yes. Visit the showroom at Capital Mall, Shop AB154, or ask us to bring samples to your home."],
];

function faq(items = FAQ, bg = SAND) {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg),
    templateVariant: "split-heading",
    data: {
      title: "Common Questions", subtitle: "Still unsure? Message us on WhatsApp.", layout: "accordion", allowMultiple: false,
      items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })),
    },
  };
}

function cta() {
  return {
    ...BASE, id: uid("cta"), type: "cta", background: bgColor(CHARCOAL),
    templateVariant: "dark-split",
    data: {
      title: "Planning a new look for your home or office?",
      description: "Send us a photo of the room on WhatsApp. We reply with ideas, samples and a quote.",
      layout: "split",
      primaryButton: { label: "WhatsApp Us", url: WA },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
    },
  };
}

function aboutSplit(bg = IVORY) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "split-list",
    data: {
      title: "A Showroom for Every Surface", subtitle: "About Moon Carpets",
      description: "Moon Carpets L.L.C S.P.C is a home and office furnishing shop at Capital Mall, Abu Dhabi. We supply and install curtains, wallpaper, carpets, wall panels, SPC flooring, artificial grass and foam sheets for villas, apartments, offices, shops and majlis.",
      layout: "split", columns: 2, style: "minimal", imageUrl: IMG.storefront,
      items: [
        ["Store", "One shop, seven ranges", "Choose your curtains, walls and floors together, so everything matches."],
        ["Ruler", "Measured properly", "We measure on site before we cut or order anything."],
        ["Hammer", "Our own installers", "The team that measures is the team that fits."],
        ["MessageCircle", "Quick on WhatsApp", "Send a photo, get ideas and a quote without leaving home."],
      ].map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

function contactCards(bg = SAND) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "colored-tiles",
    data: {
      title: "Reach Us", subtitle: "", columns: 3, iconSize: "md",
      items: [
        ["MessageCircle", "WhatsApp", PHONE_DISPLAY, WA],
        ["Phone", "Call", PHONE_DISPLAY, `tel:${PHONE}`],
        ["MapPin", "Showroom", "Shop AB154, Ground Floor, Capital Mall, Abu Dhabi", MAPS_URL],
      ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: MAGENTA, label, description, url })),
    },
  };
}

function contact(bg = IVORY) {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: "Ask for a Quote", subtitle: "Tell us what you need and we will get back to you. For the fastest reply, use WhatsApp.",
      layout: "split",
      showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: PHONE_DISPLAY, email: "", address: ADDRESS, recipientEmail: "",
      fields: [
        { id: "f-name", label: "Full name", type: "text", required: true },
        { id: "f-phone", label: "Mobile / WhatsApp", type: "tel", required: true },
        { id: "f-need", label: "Product", type: "select", required: false, options: [...CATEGORIES.map((c) => c[2]), "Other"] },
        { id: "f-msg", label: "Room size or details", type: "textarea", required: false },
      ],
      submitLabel: "Send", successMessage: "Thank you. We will contact you shortly. For a faster reply, message us on WhatsApp.",
    },
  };
}

// ─── pages ──────────────────────────────────────────────────────────────────
const BUILDERS = {
  home: () => [heroHome(), promises(), categoryCards(), showroom(), howItWorks(), faq(FAQ.slice(0, 4)), cta(), contact()],
  products: () => [
    pageHero({ badge: "Our Products", title: "Product Categories", description: "Curtains, wallpaper, carpets, wall panels, SPC flooring, artificial grass and foam sheets. Supplied and installed in Abu Dhabi.", img: IMG.bedroomCurtains }),
    promises(),
    productDetails(),
    cta(),
  ],
  about: () => [
    pageHero({ badge: "About Us", title: "Moon Carpets, Capital Mall", description: "A one-stop showroom for floors, walls and windows in Abu Dhabi.", img: IMG.woodPanel }),
    aboutSplit(),
    showroom(),
    howItWorks(IVORY),
    faq(),
  ],
  contact: () => [
    pageHero({ badge: "Contact", title: "Visit or Message Us", description: `${ADDRESS}. WhatsApp ${PHONE_DISPLAY}.`, img: IMG.livingRug }),
    contactCards(),
    contact(),
  ],
};

const SEO = {
  home: ["Curtains, Carpets, Wallpaper & SPC Flooring in Abu Dhabi", "Moon Carpets at Capital Mall, Abu Dhabi: curtains, wallpaper, carpets, wall panels, SPC flooring, artificial grass and foam sheets. Free measurement and installation."],
  products: ["Products: Curtains, Wallpaper, Carpets, Wall Panels & More", "Browse Moon Carpets' seven product ranges: curtains, wallpaper, carpets, wall panels, SPC flooring, artificial grass and foam sheets."],
  about: ["About Moon Carpets", "Moon Carpets L.L.C S.P.C, a furnishing showroom at Capital Mall, Abu Dhabi. Supply and installation for homes and offices."],
  contact: ["Contact Moon Carpets", "Visit Shop AB154, Ground Floor, Capital Mall, Abu Dhabi, or WhatsApp +971 58 839 3675."],
};

// ─── write ──────────────────────────────────────────────────────────────────
async function ensureTenant() {
  const { data: existing } = await sb.from("tenants").select("id").eq("slug", SLUG).maybeSingle();
  if (existing) return existing.id;
  const expiresAt = new Date(Date.now() + DEMO_HOURS * 3600_000).toISOString();
  const { data, error } = await sb.from("tenants").insert({
    name: SITE_NAME, slug: SLUG, plan: PLAN, status: "onboarded",
    owner_id: OWNER_ID, onboarding_completed: true,
    demo_expires_at: expiresAt, demo_created_by: OWNER_ID, demo_whatsapp: WA_NUMBER,
  }).select("id").single();
  if (error) throw new Error(`tenant: ${error.message}`);
  const id = data.id;
  await sb.from("tenant_members").insert({ tenant_id: id, user_id: OWNER_ID, role: "owner" });
  await sb.from("subscriptions").upsert(
    { tenant_id: id, plan_id: PLAN, status: "onboarded", billing_cycle: "monthly", payment_method: "manual" },
    { onConflict: "tenant_id" },
  );
  await sb.from("contact_details").insert({
    tenant_id: id, label: "Showroom", phone: PHONE, whatsapp: WA_NUMBER, email: null,
    address: ADDRESS, is_primary: true, floating_whatsapp: false, sort_order: 0,
  });
  console.log("✓ tenant created", id, "demo until", expiresAt);
  return id;
}

async function uploadAssets(tenantId) {
  const dir = path.join(__dirname, "..", "clients", "Moon Carpets", "site-assets");
  const { data: existingMedia } = await sb.from("media").select("storage_path").eq("tenant_id", tenantId);
  const known = new Set((existingMedia ?? []).map((m) => m.storage_path));
  let n = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.(jpg|png)$/.test(file)) continue;
    const buffer = fs.readFileSync(path.join(dir, file));
    const storagePath = `${STORAGE_DIR}/${file}`;
    const mime = file.endsWith(".png") ? "image/png" : "image/jpeg";
    const { error } = await sb.storage.from("media").upload(storagePath, buffer, { contentType: mime, upsert: true, cacheControl: "3600" });
    if (error) { console.log(`✗ upload ${file}: ${error.message}`); continue; }
    n++;
    if (!known.has(storagePath)) {
      await sb.from("media").insert({
        tenant_id: tenantId, name: file, original_name: file, mime_type: mime, size: buffer.length,
        url: `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`, storage_path: storagePath,
        folder: "/", alt: file.replace(/\.(jpg|png)$/, "").replace(/-/g, " "),
      });
    }
  }
  console.log(`✓ assets uploaded: ${n}`);
}

async function run() {
  const tenantId = await ensureTenant();
  if (!process.argv.includes("--skip-assets")) await uploadAssets(tenantId);
  const now = new Date().toISOString();
  const { data: tpl } = await sb.from("templates").select("id").eq("slug", TEMPLATE_SLUG).single();

  const keep = new Set(PAGES.map(([key]) => key));
  const { data: existing } = await sb.from("pages").select("id, slug").eq("tenant_id", tenantId);
  for (const p of existing ?? []) if (!keep.has(p.slug)) await sb.from("pages").delete().eq("id", p.id);

  let i = 0;
  for (const [slug, title] of PAGES) {
    const blocks = BUILDERS[slug]();
    blocks.forEach((b, k) => { b.order = k; });
    const [seoTitle, seoDesc] = SEO[slug];
    const row = { title, blocks, status: "published", type: "page", order_index: i++, updated_at: now, draft_blocks: null, seo: { title: seoTitle, description: seoDesc } };
    const found = (existing ?? []).find((p) => p.slug === slug);
    const { error } = found
      ? await sb.from("pages").update(row).eq("id", found.id)
      : await sb.from("pages").insert({ ...row, tenant_id: tenantId, slug, created_at: now });
    console.log(error ? `✗ ${slug}: ${error.message}` : `  ✓ ${slug}`);
  }

  const { error: idErr } = await sb.from("site_identity").upsert({
    tenant_id: tenantId,
    template_id: tpl.id, active_template_slug: TEMPLATE_SLUG,
    site_name: SITE_NAME, tagline: "Curtains, Carpets, Wallpaper & Flooring in Abu Dhabi",
    logo_url: LOGO_ON_LIGHT, logo_dark_url: LOGO_ON_DARK, logo_type: "image", logo_alt: LEGAL_NAME, logo_width: 180,
    favicon_url: FAVICON_URL,
    primary_color: MAGENTA, secondary_color: CHARCOAL,
    color_overrides: {
      primary: MAGENTA, primaryFg: "#ffffff", secondary: CHARCOAL, accent: MAGENTA_DEEP, ring: MAGENTA,
      background: IVORY, foreground: CHARCOAL, card: "#ffffff", muted: SAND, mutedFg: "#6E6568",
      border: STONE, borderRadius: "0.5rem",
    },
    design_overrides: { headingFont: "Montserrat", bodyFont: "Inter", headingWeight: "700", roundness: "soft", shadow: "soft" },
    global_header: header(), global_footer: [floatingWhatsApp(), footer()], global_prefooter: [],
    updated_at: now,
  }, { onConflict: "tenant_id" });
  console.log(idErr ? `✗ site_identity: ${idErr.message}` : "✓ site_identity");

  await sb.from("nav_menus").upsert(
    { tenant_id: tenantId, name: "Main Navigation", location: "header", items: navItems(), updated_at: now },
    { onConflict: "tenant_id,location" },
  );
  const { error: ssErr } = await sb.from("site_settings").upsert({
    tenant_id: tenantId, site_name: SITE_NAME, site_description: SEO.home[1],
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Dubai", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
