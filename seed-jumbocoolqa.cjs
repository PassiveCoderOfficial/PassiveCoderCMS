/**
 * Jumbo Cool Trading & Air Conditioning — Doha, Qatar.
 * Pro-plan ecommerce site at jumbocoolqa.passivecoder.com (existing tenant).
 *
 * Uploads the image set built by clients/Jumbo Cool QA/build-assets.cjs, then
 * (re)writes categories, products, delivery zones, every page, header, footer,
 * prefooter and theme. Safe to re-run. It never deletes pages it does not own:
 * the client's untouched drafts ("shop", the spare "home" copies) are left alone.
 *
 * PLACEHOLDERS the client must confirm: all product prices, delivery charges,
 * and the delivery / returns wording.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { CATEGORIES, PRODUCTS } = require("../clients/Jumbo Cool QA/catalogue.cjs");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "6fde9369-2c0d-4729-adff-f703db0e6d05";
const SLUG = "jumbocoolqa";
// The "Home" row the dashboard shows. The original starter home (f00dc285) was
// already in the trash but still published, so it kept serving "/"; it is now
// unpublished and this row carries the homepage.
const HOME_PAGE_ID = "808699b9-b20a-452c-934c-074669a38948";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Jumbo Cool";
const LEGAL_NAME = "Jumbo Cool Trading & Air Conditioning";
const SLOGAN = "AC Spare Parts, Compressors, Motors & Refrigeration Components in Qatar";
const WHATSAPP = "97470045452";
const MOBILE = "+97470045452";
const MOBILE_DISPLAY = "+974 7004 5452";
const PHONE = "+97440060043";
const PHONE_DISPLAY = "+974 4006 0043";
const EMAIL = "info@jumbocoolqatar.com";
const EMAIL_ALT = "jumbocoolqatar@gmail.com";
const wrapEmail = (e) => e.replace("@", "@\u200b"); // zero-width space: lets the address wrap
const ADDRESS = "Shop 271, Opp. Plus Supermarket, Najma Souq Al Haraj, Doha, Qatar";
const PO_BOX = "PO Box 9285";
const CR_NO = "CR No. 225456";
const MAP_EMBED = "https://www.google.com/maps?q=Souq+Al+Haraj+Najma+Doha+Qatar&output=embed";
const waText = (t) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t)}`;
const WA = waText("Hi Jumbo Cool, I found your website and need help with a part.");

// Signboard palette: black ground, bright yellow, white.
const YELLOW = "#FFE100";
const YELLOW_DEEP = "#F2C200";
const BLACK = "#0b0b0b";
// Dark site, like the signboard: two near-black surfaces alternate down the page.
const SURFACE = "#0b0b0b";
const PAPER = "#141414";

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name, ext = "jpg") => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}.${ext}`;
const LOGO_DARK_BG = asset("logo-horizontal", "png");   // transparent, for the black header / footer
const LOGO_STACKED = asset("logo-stacked", "png");
const LOGO_PLATE = asset("logo-plate", "png");          // on a black plate, works on any background
const FAVICON = asset("favicon", "png");

// ─── Services ───────────────────────────────────────────────────────────────
const SERVICES = [
  {
    slug: "ac-sales", icon: "AirVent", title: "New & Used AC Sales",
    short: "New and second hand air conditioners, checked before they leave the shop.",
    lead: "Need a unit for a room, a shop or staff accommodation? We sell new air conditioners and second hand units that have been checked and tested, so you can choose what suits the job and the budget.",
    included: [
      ["AirVent", "New Split Units", "New split air conditioners in the common capacities."],
      ["Recycle", "Second Hand AC", "Used units checked and tested before sale."],
      ["Ruler", "Right Size Advice", "Tell us the room size and we suggest the capacity."],
      ["Wrench", "Installation Materials", "Copper, insulation, brackets and drain hose in one place."],
      ["Fan", "Window Units", "Window type units and parts on request."],
      ["MessageCircle", "Ask Before You Buy", "Send the details on WhatsApp and we confirm availability."],
    ],
    images: ["svc-ac-sales-1", "svc-ac-sales-2", "svc-ac-sales-3"],
    faq: [
      ["Do you sell second hand air conditioners?", "Yes. We sell both new and second hand units. Used units are checked and tested before sale."],
      ["Which capacity do I need?", "It depends on the room size, sun exposure and how many people use the room. Send us the room size on WhatsApp and we will suggest a capacity."],
      ["Can I get the installation materials from you too?", "Yes. Copper pipe, insulation tube, brackets, drain hose and refrigerant are all in stock at the shop."],
    ],
  },
  {
    slug: "motor-rewinding", icon: "RotateCw", title: "Motor Rewinding",
    short: "All kinds of motor rewinding, from AC fan motors to pump and appliance motors.",
    lead: "A burnt motor does not always need replacing. We rewind all kinds of motors with proper winding wire, fresh insulation and varnish, then test the motor before it goes back to you.",
    included: [
      ["Fan", "AC Fan Motors", "Outdoor and indoor fan motors rewound."],
      ["Zap", "Single Phase Motors", "Pumps, blowers and general purpose motors."],
      ["WashingMachine", "Appliance Motors", "Washing machine and other appliance motors."],
      ["Cable", "Quality Winding Wire", "Enamelled copper wire in the correct gauge."],
      ["ShieldCheck", "Insulation & Varnish", "New sleeving, insulation paper and varnish."],
      ["ClipboardCheck", "Tested Before Return", "Every rewound motor is run and checked."],
    ],
    images: ["svc-rewinding-1", "svc-rewinding-2", "svc-rewinding-3"],
    faq: [
      ["Which motors do you rewind?", "All kinds: AC fan motors, blower motors, pump motors, washing machine motors and general single phase motors."],
      ["Is rewinding cheaper than a new motor?", "Usually yes, especially for larger or hard-to-find motors. Bring the motor in and we will tell you honestly which option makes sense."],
      ["Do you sell rewinding materials?", "Yes. Winding wire, sleeving and varnish are sold over the counter and in the online shop."],
    ],
  },
  {
    slug: "bush-bearing-replacement", icon: "Cog", title: "Bush & Bearing Replacement",
    short: "Noisy or seized motor? We change bushes and bearings and get it running smoothly.",
    lead: "Worn bushes and bearings make a motor noisy, hot and slow, and eventually it seizes. We replace them with the correct size, clean the motor and check it runs freely.",
    included: [
      ["Cog", "Bearing Change", "Ball bearings replaced in the correct size."],
      ["Circle", "Bush Change", "Bronze bushes fitted and aligned."],
      ["Fan", "Fan Motor Service", "AC indoor and outdoor fan motors serviced."],
      ["Droplets", "Cleaning & Lubrication", "Shaft and housing cleaned and lubricated."],
      ["Package", "Parts In Stock", "Common bearing and bush sizes kept at the shop."],
      ["ClipboardCheck", "Run Test", "Motor checked for noise and free running."],
    ],
    images: ["svc-bearing-1", "svc-bearing-2", "svc-bearing-3"],
    faq: [
      ["How do I know the bearing is worn?", "Grinding or humming noise, a hot motor, a fan that spins slowly or a shaft with side play are the usual signs."],
      ["Can I buy just the bearing?", "Yes. Common sizes such as 6202 and 6203 are in stock. Bring the old bearing or tell us the number printed on it."],
      ["Do you change bushes on small fan motors?", "Yes, bush and bearing change on fan motors is a regular job for us."],
    ],
  },
  {
    slug: "pcb-repair", icon: "CircuitBoard", title: "PCB Repair",
    short: "We repair AC and appliance PC boards instead of replacing the whole board.",
    lead: "A faulty control board is often a failed relay, capacitor or track rather than a dead board. We diagnose and repair PC boards for air conditioners and appliances, which usually costs less than a new board.",
    included: [
      ["CircuitBoard", "AC Control Boards", "Indoor and outdoor unit boards repaired."],
      ["Cpu", "Inverter Boards", "Inverter outdoor boards checked and repaired."],
      ["WashingMachine", "Appliance Boards", "Washing machine and refrigerator boards."],
      ["Zap", "Component Replacement", "Relays, capacitors and other failed components."],
      ["Search", "Fault Diagnosis", "We find the fault before quoting."],
      ["Package", "Replacement Boards", "Universal boards available when repair is not possible."],
    ],
    images: ["svc-pcb-1", "svc-pcb-2", "svc-pcb-3"],
    faq: [
      ["Can every board be repaired?", "Not every one. We check the board first and tell you whether repair or replacement is the better option."],
      ["What should I bring?", "Bring the board, and if possible the AC brand and model number. A photo of the error code on the unit also helps."],
      ["Do you have universal AC boards?", "Yes. Universal control board kits are in stock for fixed-speed split units."],
    ],
  },
  {
    slug: "ac-maintenance", icon: "Wrench", title: "AC Maintenance",
    short: "Parts and repair support to keep air conditioners cooling through the Qatar heat.",
    lead: "When an AC stops cooling, the cause is usually a capacitor, a fan motor, low gas or a control fault. We supply the part and handle the repair work in our line: motors, bearings and boards.",
    included: [
      ["Thermometer", "Not Cooling", "Capacitors, contactors and gas for common faults."],
      ["Fan", "Fan Motor Faults", "Rewinding and bush or bearing change."],
      ["CircuitBoard", "Control Faults", "Board diagnosis and repair."],
      ["Gauge", "Gas & Gauges", "Refrigerant and charging tools for technicians."],
      ["Package", "Parts Over The Counter", "Most common parts available the same day."],
      ["MessageCircle", "Quick Advice", "Describe the fault on WhatsApp and we guide you."],
    ],
    images: ["svc-maint-1", "svc-maint-2", "svc-maint-3"],
    faq: [
      ["My AC runs but does not cool. What is the usual cause?", "Most often a weak capacitor, a failed outdoor fan motor or low refrigerant. A technician should check it. We stock all three."],
      ["Do you supply parts to technicians?", "Yes. Technicians and maintenance companies are our main customers. Ask about regular supply on WhatsApp."],
      ["Do you sell refrigerant gas?", "Yes. R410A, R22, R134a and R32 in sealed cylinders."],
    ],
  },
  {
    slug: "spare-parts-supply", icon: "Package", title: "Spare Parts Supply",
    short: "AC, washing machine and refrigerator spare parts, in stock at our Najma shop.",
    lead: "From a single capacitor to a full compressor change, the parts are on our shelves. We supply technicians, maintenance companies and homeowners across Qatar, over the counter and through this online shop.",
    included: [
      ["AirVent", "AC Spare Parts", "Capacitors, contactors, remotes, fan blades and motors."],
      ["Snowflake", "Refrigeration Parts", "Driers, valves, gauges and refrigerant gas."],
      ["WashingMachine", "Washing Machine Parts", "Pumps, valves, belts and gaskets."],
      ["Refrigerator", "Refrigerator Parts", "Thermostats, timers, relays and fan motors."],
      ["Cylinder", "Compressors", "Rotary, scroll and refrigerator compressors."],
      ["Truck", "Pickup or Delivery", "Collect from the shop or have it delivered."],
    ],
    images: ["shop-inside", "svc-parts-2", "shop-copper-racks"],
    faq: [
      ["How do I make sure I order the right part?", "Send us a photo of the old part or its label on WhatsApp. We will confirm the match before you pay."],
      ["Can I collect from the shop?", "Yes. Choose Pickup at checkout and collect from Shop 271, Najma Souq Al Haraj."],
      ["Do you supply in bulk?", "Yes. Use the Request a Quote page for quantity orders and regular supply."],
    ],
  },
];

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 84, right: 24, bottom: 84, left: 24 },
  margin: ZERO,
  background: { type: "none" },
};
const bgColor = (color) => ({ type: "color", color });

const NAV_ITEMS = [
  { id: "n1", label: "Home", url: "/", children: [] },
  { id: "n2", label: "Shop", url: "/shop", children: CATEGORIES.map((c, i) => ({ id: `n2${i}`, label: c.name, url: `/shop?category=${c.slug}` })) },
  { id: "n3", label: "Services", url: "/services", children: SERVICES.map((s, i) => ({ id: `n3${i}`, label: s.title, url: `/services/${s.slug}` })) },
  { id: "n4", label: "Brands", url: "/brands", children: [] },
  { id: "n5", label: "About Us", url: "/about-us", children: [] },
  { id: "n6", label: "Contact", url: "/contact-us", children: [] },
];

function globalHeader() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(BLACK),
    templateVariant: "solid-with-cta",
    data: {
      logoText: SITE_NAME, logo: LOGO_DARK_BG, items: NAV_ITEMS,
      sticky: true, transparent: false, style: "default", showCart: true,
      backgroundColor: BLACK, textColor: "#ffffff", colorMode: "legacy", activeColor: YELLOW, ctaVariant: "solid", logoHeight: 46, logoCaption: "",
      showCta: true, ctaLabel: "Request a Quote", ctaUrl: "/request-a-quote",
    },
  };
}

// Floating WhatsApp button, plus one site-wide style tweak: photo cards fade to
// the brand primary by default, and with a bright yellow primary that washes
// every photo yellow, so the fade is set to neutral black here.
// The platform has the WhatsApp setting in Contact Details
// but no public renderer for it yet, so it ships as a small HTML block that
// rides along with the global footer.
function floatingWhatsApp() {
  return {
    id: uid("wa"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      html: `<a class="jc-wa" href="${WA}" target="_blank" rel="noopener noreferrer" aria-label="Chat with Jumbo Cool on WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.737 5.469 2.027 7.773L0 32l8.473-2.004A15.934 15.934 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.257 13.257 0 01-6.749-1.839l-.484-.287-5.027 1.188 1.213-4.895-.316-.502A13.263 13.263 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.266-9.987c-.398-.199-2.353-1.161-2.718-1.294-.365-.133-.631-.199-.897.199-.266.398-1.031 1.294-1.264 1.56-.233.266-.465.299-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.055-1.983-2.357-2.216-2.755-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.199-.897-2.161-1.229-2.958-.324-.778-.653-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.062.498-.365.398-1.395 1.362-1.395 3.322s1.428 3.852 1.627 4.118c.199.266 2.81 4.291 6.81 6.022.952.411 1.695.657 2.274.841.955.304 1.824.261 2.511.158.766-.114 2.353-.962 2.685-1.891.332-.929.332-1.726.232-1.891-.099-.166-.365-.266-.763-.465z"/></svg></a>`,
      css: `.theme-image-fade{background:linear-gradient(to top,rgba(5,5,5,.78) 0%,rgba(5,5,5,.2) 45%,transparent 75%)!important}.jc-wa{position:fixed;right:20px;bottom:20px;z-index:9990;width:56px;height:56px;border-radius:9999px;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease}.jc-wa:hover{transform:scale(1.06)}@media(max-width:640px){.jc-wa{right:14px;bottom:14px;width:52px;height:52px}}`,
    },
  };
}

function globalFooter() {
  return [
    floatingWhatsApp(),
    {
      id: uid("footer"), type: "footer", order: 1, visible: true, width: "full",
      padding: ZERO, margin: ZERO, background: { type: "none" },
      data: {
        logo: LOGO_STACKED, logoText: SITE_NAME,
        tagline: "Qatar-based supplier of air conditioning, refrigeration, motors, spare parts and repair solutions. Visit us at Najma Souq Al Haraj, Doha.",
        logoCaption: `${CR_NO} · Shop No. 271`,
        style: "dark", backgroundColor: "#050505", accentColor: YELLOW, textColor: "#cfcfcf",
        copyrightText: `© {year} ${LEGAL_NAME}. All rights reserved.`,
        copyrightYear: true, showNewsletter: false,
        socials: [{ platform: "whatsapp", url: WA }],
        columns: [
          { id: uid("fc"), heading: "Shop", links: CATEGORIES.slice(0, 5).map((c) => ({ id: uid("fl"), label: c.name, url: `/shop?category=${c.slug}` })) },
          { id: uid("fc"), heading: "More Categories", links: CATEGORIES.slice(5).map((c) => ({ id: uid("fl"), label: c.name, url: `/shop?category=${c.slug}` })) },
          { id: uid("fc"), heading: "Company", links: [
            { id: uid("fl"), label: "About Us", url: "/about-us" },
            { id: uid("fl"), label: "Services", url: "/services" },
            { id: uid("fl"), label: "Brands", url: "/brands" },
            { id: uid("fl"), label: "Gallery", url: "/gallery" },
            { id: uid("fl"), label: "FAQ", url: "/faq" },
            { id: uid("fl"), label: "Request a Quote", url: "/request-a-quote" },
          ]},
          { id: uid("fc"), heading: "Contact", links: [
            { id: uid("fl"), label: `WhatsApp ${MOBILE_DISPLAY}`, url: WA },
            { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
            { id: uid("fl"), label: wrapEmail(EMAIL), url: `mailto:${EMAIL}` },
            { id: uid("fl"), label: "Shop 271, Najma Souq Al Haraj, Doha", url: "/contact-us" },
          ]},
        ],
        bottomLinks: [
          { id: uid("bl"), label: "Delivery & Returns", url: "/delivery-returns" },
          { id: uid("bl"), label: "Privacy Policy", url: "/privacy-policy" },
          { id: uid("bl"), label: "Terms & Conditions", url: "/terms-and-conditions" },
        ],
      },
    },
  ];
}

function hero({ badge, title, subtitle, description, img, primary, secondary, compact }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: asset(img), imageOverlay: "#050505", imageOverlayOpacity: 0.7 },
    data: {
      layout: "centered", badge, title, subtitle, description, compact: !!compact,
      badgeBgColor: YELLOW, badgeTextColor: BLACK,
      overlayColor: "#050505", overlayOpacity: 0.7,
      primaryButton: primary ?? { label: "Shop Parts", url: "/shop", variant: "primary", bgColor: YELLOW, textColor: BLACK },
      secondaryButton: secondary ?? { label: "WhatsApp Us", url: WA, variant: "outline" },
      imageUrl: asset(img),
      typography: { titleSize: compact ? "5xl" : "6xl", titleColor: "#ffffff", subtitleColor: YELLOW, descColor: "#e7e7e7" },
    },
  };
}

function categoryGrid(items, { title = "Shop by Category", subtitle = "Find the part you need", bg = SURFACE, withAll = true } = {}) {
  const cards = items.map((c) => ({
    id: uid("cat"), title: c.name, description: c.blurb,
    icon: "Package", iconType: "lucide", imageUrl: asset(c.image),
    linkLabel: "Shop now", link: `/shop?category=${c.slug}`,
  }));
  if (withAll) cards.push(
    {
      id: uid("cat"), title: "Capacitors", description: "Run capacitors for compressors and fan motors, in the common µF ratings.",
      icon: "Battery", iconType: "lucide", imageUrl: asset("p-cap-35-5"), linkLabel: "Shop now", link: "/shop?q=capacitor",
    },
    {
      id: uid("cat"), title: "All Products", description: "Browse the full catalogue, or search by part name or code.",
      icon: "LayoutGrid", iconType: "lucide", imageUrl: asset("shop-inside"), linkLabel: "View all", link: "/shop",
    },
  );
  return {
    ...BASE, id: uid("cats"), type: "services", background: bgColor(bg),
    templateVariant: "program-cards-dark",
    data: { title, subtitle, layout: "grid", columns: 4, cardStyle: "elevated", source: "inline", items: cards },
  };
}

function products({ title, subtitle, count = 8, sortBy = "featured", categoryIds, bg = PAPER, cta = true }) {
  return {
    ...BASE, id: uid("prod"), type: "ecommerce_products", padding: ZERO, background: bgColor(bg),
    data: {
      title, subtitle, displayCount: count, layout: "grid", columns: 4, sortBy,
      ...(categoryIds ? { categoryIds } : {}),
      showAddToCart: true, showDescription: true, showBadges: true, showRating: false,
      cardStyle: "default", imageRatio: "square", sectionPadding: "lg", backgroundColor: bg,
      titleAlignment: "center",
      ...(cta ? { ctaLabel: "View All Products", ctaUrl: "/shop" } : {}),
    },
  };
}

function servicesGrid(items, { title = "Our Services", subtitle = "Sales, repair and supply under one roof", bg = SURFACE } = {}) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "program-cards-dark",
    data: {
      title, subtitle, layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: items.map((s) => ({
        id: uid("sv"), title: s.title, description: s.short,
        icon: s.icon, iconType: "lucide", imageUrl: asset(s.images[0]),
        linkLabel: "View service", link: `/services/${s.slug}`,
      })),
    },
  };
}

function trustStrip() {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(PAPER),
    padding: { top: 44, right: 24, bottom: 44, left: 24 },
    templateVariant: "dark-tiles",
    data: {
      title: "", subtitle: "", columns: 4, iconSize: "md", style: "plain",
      items: [
        { id: uid("i"), icon: "Store", color: YELLOW, label: "Walk-in Shop in Najma", description: "Shop 271, Souq Al Haraj, Doha" },
        { id: uid("i"), icon: "Banknote", color: YELLOW, label: "Cash on Delivery", description: "Pay when it arrives, or at pickup" },
        { id: uid("i"), icon: "Truck", color: YELLOW, label: "Pickup or Delivery", description: "Collect free, or delivered in Qatar" },
        { id: uid("i"), icon: "MessageCircle", color: YELLOW, label: "WhatsApp Support", description: "Send a photo, we match the part" },
      ],
    },
  };
}

function whyUs(bg = PAPER) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "dark-tiles",
    data: {
      title: "Why Technicians Buy From Jumbo Cool", subtitle: "Parts, gas and repair work from one counter.", columns: 3, iconSize: "md", style: "card",
      items: [
        { id: uid("i"), icon: "Package", color: YELLOW, label: "Stock On The Shelf", description: "Capacitors, motors, compressors, copper and gas kept at the shop, not ordered in after you pay." },
        { id: uid("i"), icon: "Search", color: YELLOW, label: "We Match The Part", description: "Send a photo of the old part or its label on WhatsApp and we confirm the right replacement." },
        { id: uid("i"), icon: "RotateCw", color: YELLOW, label: "Repair As Well As Supply", description: "Motor rewinding, bush and bearing change and PC board repair done by us." },
        { id: uid("i"), icon: "Layers", color: YELLOW, label: "AC, Fridge & Washing Machine", description: "One shop for air conditioner, refrigerator and washing machine parts." },
        { id: uid("i"), icon: "Banknote", color: YELLOW, label: "Pay On Delivery", description: "Order online and pay in cash on delivery or when you collect." },
        { id: uid("i"), icon: "MapPin", color: YELLOW, label: "Easy To Find", description: "Opposite Plus Supermarket at Najma Souq Al Haraj, Doha." },
      ],
    },
  };
}

function split({ title, body, img, bg = SURFACE }) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "alternating-images",
    data: {
      title: "", subtitle: "", layout: "alternating", columns: 2, style: "minimal",
      items: (Array.isArray(title) ? title : [[title, body, img]]).map(([t, b, i]) => ({ id: uid("f"), title: t, description: b, imageUrl: asset(i), icon: "" })),
    },
  };
}

function steps(bg = SURFACE) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    data: {
      title: "How Ordering Works", subtitle: "Four steps from the part you need to the part in your hand",
      layout: "horizontal", style: "connected",
      items: [
        { id: uid("s"), step: "01", title: "Find The Part", description: "Browse by category or search by name. Not sure? Send us a photo on WhatsApp." },
        { id: uid("s"), step: "02", title: "Add To Cart", description: "Add what you need and check out in a minute. No account required." },
        { id: uid("s"), step: "03", title: "Pickup Or Delivery", description: "Collect from Shop 271 in Najma, or choose delivery to your address." },
        { id: uid("s"), step: "04", title: "Pay In Cash", description: "Pay on delivery or at pickup. We confirm every order on WhatsApp." },
      ],
    },
  };
}

function faq(items, { title = "Frequently Asked Questions", bg = PAPER } = {}) {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg),
    templateVariant: "accordion-bordered",
    data: {
      title, subtitle: "", layout: "accordion", allowMultiple: false,
      items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })),
    },
  };
}

function gallery(names, title, bg = SURFACE, captions = []) {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    data: {
      title, subtitle: "", layout: "grid", columns: names.length % 3 === 0 ? 3 : 4, gap: "md", lightbox: true,
      images: names.map((n, i) => ({ id: uid("gi"), url: asset(n), alt: captions[i] ?? title, caption: captions[i] ?? "" })),
    },
  };
}

function cta(title, description) {
  return {
    ...BASE, id: uid("cta"), type: "cta",
    background: { type: "none" },
    templateVariant: "dark-split",
    data: {
      title, description, layout: "split",
      primaryButton: { label: "WhatsApp Us", url: WA },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
    },
  };
}

const CONTACT_INFO = {
  showContactInfo: true,
  phone: `${MOBILE_DISPLAY} / ${PHONE_DISPLAY}`, email: EMAIL, address: `${ADDRESS}. ${PO_BOX}`,
  whatsapp: WHATSAPP, note: "Send a photo of the part on WhatsApp for the fastest reply.",
};

function contact({ title = "Send Us a Message", subtitle = "Tell us what you need and we will get back to you.", bg = SURFACE, map = false } = {}) {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title, subtitle, layout: "split", showMap: map, mapEmbedUrl: map ? MAP_EMBED : undefined,
      ...CONTACT_INFO, recipientEmail: "",
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "f-email", label: "Email", type: "email", required: false },
        { id: "f-msg", label: "How can we help?", type: "textarea", required: true },
      ],
      submitLabel: "Send Message",
      successMessage: "Thank you. We have your message and will reply shortly. For a faster answer, WhatsApp us.",
    },
  };
}

function quoteForm(bg = SURFACE) {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: "Request a Quote", subtitle: "For quantity orders, regular supply, compressors, used AC units and repair work.",
      layout: "split", showMap: false, ...CONTACT_INFO, recipientEmail: "",
      fields: [
        { id: "q-name", label: "Full Name", type: "text", required: true },
        { id: "q-company", label: "Company (optional)", type: "text", required: false },
        { id: "q-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "q-email", label: "Email", type: "email", required: false },
        { id: "q-type", label: "What do you need?", type: "select", required: true, options: [...CATEGORIES.map((c) => c.name), ...SERVICES.map((s) => s.title), "Other"] },
        { id: "q-details", label: "Part name, model number, quantity and any other details", type: "textarea", required: true },
      ],
      submitLabel: "Request Quote",
      successMessage: "Thank you. We have your request and will send a quote shortly. For a faster answer, WhatsApp us the same details.",
    },
  };
}

function text(html, bg = SURFACE) {
  return {
    ...BASE, id: uid("text"), type: "text", width: "narrow", background: bgColor(bg),
    data: { content: html, alignment: "left", columns: 1, typography: {} },
  };
}

// Brand names as plain text tiles. No third-party logos are reproduced.
const BRANDS = [
  { name: "Floron", line: "Refrigerant gas", url: "/shop?q=floron", cta: "View products" },
  { name: "DynaFlo", line: "Refrigerant gas", url: "/shop?q=dynaflo", cta: "View products" },
  { name: "Total", line: "Tools", url: waText("Hi Jumbo Cool, which Total tools do you have in stock?"), cta: "Ask availability" },
  { name: "Galaxy", line: "Refrigerant gas", url: waText("Hi Jumbo Cool, do you have Galaxy refrigerant in stock?"), cta: "Ask availability" },
];

function brandTiles({ heading = "", bg = SURFACE } = {}) {
  const tiles = BRANDS.map((b) => `<a class="jc-brand" href="${b.url}"${b.url.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}><span class="jc-brand-name">${b.name}</span><span class="jc-brand-line">${b.line}</span><span class="jc-brand-cta">${b.cta} &rarr;</span></a>`).join("");
  return {
    ...BASE, id: uid("brands"), type: "custom_html", background: bgColor(bg),
    data: {
      html: `<div class="jc-brands-wrap">${heading ? `<h2 class="jc-brands-h">${heading}</h2><p class="jc-brands-sub">Names you will find on our shelves</p>` : ""}<div class="jc-brands">${tiles}</div></div>`,
      css: `.jc-brands-wrap{max-width:1152px;margin:0 auto}.jc-brands-h{font-family:var(--heading-font,inherit);font-size:2rem;font-weight:700;text-align:center;margin:0}.jc-brands-sub{text-align:center;color:#a8a8a8;margin:.5rem 0 2.25rem}.jc-brands{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.jc-brand{display:flex;flex-direction:column;gap:6px;background:#1a1a1a;color:#fff;border-radius:14px;padding:28px 24px;text-decoration:none;border:1px solid #2b2b2b;border-top:5px solid ${YELLOW};transition:transform .15s ease}.jc-brand:hover{transform:translateY(-3px)}.jc-brand-name{font-family:var(--heading-font,inherit);font-size:1.9rem;font-weight:700;color:${YELLOW};line-height:1.1}.jc-brand-line{color:#cfcfcf;font-size:.95rem}.jc-brand-cta{margin-top:14px;font-size:.85rem;font-weight:600;color:#fff}@media(max-width:900px){.jc-brands{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:460px){.jc-brand{padding:22px 18px}.jc-brand-name{font-size:1.5rem}}`,
    },
  };
}

const GENERAL_FAQ = [
  ["How do I order?", "Add the parts to your cart and check out. No account is needed. We confirm every order on WhatsApp before it is prepared."],
  ["How do I pay?", "Cash on delivery, or cash when you collect from the shop. There is no online payment to set up."],
  ["Do you deliver?", "Yes. Choose Delivery at checkout and pick your area. You can also choose Pickup and collect from Shop 271, Najma Souq Al Haraj, free of charge."],
  ["How do I know I am ordering the right part?", "Send us a photo of the old part or its label on WhatsApp at " + MOBILE_DISPLAY + ". We will confirm the match before you pay."],
  ["Are the prices on the website final?", "Prices are shown in Qatari Riyal. For quantity orders, compressors and used AC units, use Request a Quote and we will confirm the best price."],
  ["Do you repair as well as sell?", "Yes. We do all kinds of motor rewinding, bush and bearing change, and PC board repair."],
];

// ─── pages ──────────────────────────────────────────────────────────────────
function homePage(catIds) {
  return [
    hero({
      badge: "Najma Souq Al Haraj · Doha",
      title: "AC Spare Parts, Compressors\n& Refrigeration Supplies",
      subtitle: LEGAL_NAME,
      description: "Capacitors, motors, compressors, copper, refrigerant gas and PC boards, in stock in Doha. Order online, pay on delivery or collect from the shop.",
      img: "hero-home",
    }),
    trustStrip(),
    categoryGrid(CATEGORIES, { title: "Shop by Category", subtitle: "Air conditioning, refrigeration and appliance parts" }),
    products({ title: "Popular Parts", subtitle: "What technicians pick up most often", count: 8, sortBy: "featured" }),
    servicesGrid(SERVICES, { title: "Sales, Repair & Supply", subtitle: "More than a parts counter" }),
    split({
      title: "Your AC and Refrigeration Parts Shop in Doha",
      body: `${LEGAL_NAME} is a Qatar-based supplier of air conditioning, refrigeration, motors, spare parts and repair solutions.\n\nOur shop at Najma Souq Al Haraj carries the parts technicians ask for every day, and our workshop handles motor rewinding, bush and bearing change and PC board repair.\n\n✓ AC, washing machine and refrigerator spare parts\n✓ New and second hand AC sales\n✓ All kinds of motor rewinding\n✓ PC board repair`,
      img: "shop-front", bg: PAPER,
    }),
    whyUs(SURFACE),
    brandTiles({ heading: "Brands We Stock", bg: PAPER }),
    steps(SURFACE),
    faq(GENERAL_FAQ.slice(0, 4), { bg: PAPER }),
  ];
}

function aboutPage() {
  return [
    hero({
      badge: "About Us", title: "Parts, Repair and Straight Advice",
      subtitle: LEGAL_NAME,
      description: "A Qatar-based supplier of air conditioning, refrigeration, motors, spare parts and repair solutions.",
      img: "hero-about", compact: true,
    }),
    split({
      title: [
        ["Who We Are", `${LEGAL_NAME} is a trading and air conditioning company based at Najma Souq Al Haraj in Doha.\n\nWe supply spare parts for air conditioners, washing machines and refrigerators, sell new and second hand AC units, and repair the parts that can be saved: motors, bearings and PC boards.\n\n${CR_NO} · Shop No. 271`, "shop-front"],
        ["What You Will Find On Our Shelves", "AC spare parts, refrigeration components, motors and rewinding materials, bearings and bushes, refrigerant gas, copper and installation materials, PCB boards and electronics, washing machine and refrigerator parts, and compressors.\n\nIf a part is not on the website, ask. The shop carries far more than we can list online.", "shop-inside"],
        ["Repair Before Replace", "Our workshop does all kinds of motor rewinding and bush and bearing change, and we repair PC boards.\n\nWhen a repair makes more sense than a new part, we will tell you. When it does not, the replacement is on the shelf.", "svc-pcb-2"],
      ],
      bg: SURFACE,
    }),
    servicesGrid(SERVICES, { title: "What We Do", subtitle: "Core services", bg: PAPER }),
    whyUs(SURFACE),
    {
      ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(PAPER),
      templateVariant: "dark-tiles",
      data: {
        title: "Visit or Call", subtitle: "", columns: 3, iconSize: "md", style: "card",
        items: [
          { id: uid("i"), icon: "MapPin", color: YELLOW, label: "Shop", description: `${ADDRESS}. ${PO_BOX}.`, url: "/contact-us" },
          { id: uid("i"), icon: "MessageCircle", color: YELLOW, label: "WhatsApp", description: `${MOBILE_DISPLAY}. Send a photo of the part you need.`, url: WA },
          { id: uid("i"), icon: "PhoneCall", color: YELLOW, label: "Phone", description: `${PHONE_DISPLAY} · ${wrapEmail(EMAIL)}`, url: `tel:${PHONE}` },
        ],
      },
    },
  ];
}

function brandsPage() {
  return [
    hero({
      badge: "Brands", title: "Brands We Stock",
      subtitle: SITE_NAME,
      description: "Names you will find on our shelves in Najma. Ask us if you are looking for a specific make.",
      img: "hero-brands", compact: true,
    }),
    brandTiles({ bg: SURFACE }),
    text(`<h2>Looking for another brand?</h2><p>The shop carries many more makes of capacitors, compressors, motors and refrigeration parts than we can list here. Send the brand and part number on WhatsApp at <a href="${WA}">${MOBILE_DISPLAY}</a>, or use <a href="/request-a-quote">Request a Quote</a>, and we will check stock for you.</p><p>Brand names are the property of their respective owners and are shown only to identify the products we sell.</p>`, PAPER),
    products({ title: "Refrigerant Gas In Stock", subtitle: "Sealed cylinders", count: 4, sortBy: "latest", categoryIds: undefined, bg: SURFACE }),
  ];
}

function servicesPage() {
  return [
    hero({
      badge: "Our Services", title: "Sales, Repair & Spare Parts Supply",
      subtitle: LEGAL_NAME,
      description: "New and used AC sales, motor rewinding, bush and bearing replacement, PCB repair, AC maintenance and spare parts supply.",
      img: "hero-services", compact: true,
      primary: { label: "Request a Quote", url: "/request-a-quote", variant: "primary", bgColor: YELLOW, textColor: BLACK },
    }),
    servicesGrid(SERVICES, { title: "Choose a Service", subtitle: "What we do" }),
    whyUs(PAPER),
    faq(SERVICES.map((s) => s.faq[0]), { title: "Service Questions", bg: SURFACE }),
  ];
}

function servicePage(s) {
  const idx = SERVICES.indexOf(s);
  const related = [1, 2, 3].map((k) => SERVICES[(idx + k) % SERVICES.length]);
  return [
    hero({
      badge: "Service", title: s.title,
      subtitle: `${SITE_NAME} · Doha, Qatar`,
      description: s.short,
      img: s.images[0], compact: true,
      primary: { label: "Request a Quote", url: "/request-a-quote", variant: "primary", bgColor: YELLOW, textColor: BLACK },
      secondary: { label: "WhatsApp Us", url: waText(`Hi Jumbo Cool, I need ${s.title}. Can you help?`), variant: "outline" },
    }),
    split({
      title: `${s.title} in Doha`,
      body: `${s.lead}\n\n✓ Shop and workshop at Najma Souq Al Haraj\n✓ Parts in stock for the common jobs\n✓ Clear price before work starts\n✓ Fast replies on WhatsApp`,
      img: s.images[1], bg: SURFACE,
    }),
    {
      ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(PAPER),
      templateVariant: "dark-tiles",
      data: {
        title: "What's Included", subtitle: s.title, columns: 3, iconSize: "md", style: "card",
        items: s.included.map(([icon, label, description]) => ({ id: uid("i"), icon, color: YELLOW, label, description })),
      },
    },
    gallery(s.images, s.title, SURFACE),
    faq(s.faq, { title: `${s.title}: Common Questions`, bg: PAPER }),
    servicesGrid(related, { title: "Related Services", subtitle: "You may also need", bg: SURFACE }),
  ];
}

function galleryPage() {
  return [
    hero({
      badge: "Gallery", title: "Inside Jumbo Cool",
      subtitle: "Shop 271 · Najma Souq Al Haraj",
      description: "A look at our shop in Doha and the kind of parts and work we handle.",
      img: "hero-gallery", compact: true,
    }),
    gallery(
      ["shop-front", "shop-inside", "shop-shelves", "shop-copper-racks", "p-floron-r410a", "p-compressors"],
      "Our Shop in Najma", SURFACE,
      ["Shop front, Najma Souq Al Haraj", "Inside the shop", "Tools and parts wall", "Copper coils on the racks", "Refrigerant gas", "Compressors"],
    ),
    gallery(
      ["svc-maint-2", "svc-pcb-1", "svc-rewinding-1", "cat-copper", "svc-bearing-2", "svc-pcb-3", "svc-ac-sales-1", "svc-rewinding-3"],
      "Parts and Repair Work", PAPER,
      ["Refrigeration gauges", "PC board repair", "Motor rewinding", "Copper pipe", "Bearings", "Board diagnosis", "Split AC unit", "Motor repair"],
    ),
  ];
}

function contactPage() {
  return [
    hero({
      badge: "Contact Us", title: "Visit, Call or WhatsApp",
      subtitle: `${MOBILE_DISPLAY} · ${PHONE_DISPLAY}`,
      description: "Shop 271, opposite Plus Supermarket, Najma Souq Al Haraj, Doha.",
      img: "hero-contact", compact: true,
      primary: { label: "WhatsApp Us", url: WA, variant: "primary", bgColor: YELLOW, textColor: BLACK },
      secondary: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}`, variant: "outline" },
    }),
    {
      ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(PAPER),
      templateVariant: "dark-tiles",
      data: {
        title: "Reach Us Your Way", subtitle: "", columns: 4, iconSize: "md", style: "card",
        items: [
          { id: uid("i"), icon: "MessageCircle", color: YELLOW, label: "WhatsApp", description: `${MOBILE_DISPLAY}. Fastest way to reach us.`, url: WA },
          { id: uid("i"), icon: "PhoneCall", color: YELLOW, label: "Phone", description: `${PHONE_DISPLAY} · ${MOBILE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("i"), icon: "Mail", color: YELLOW, label: "Email", description: `${wrapEmail(EMAIL)} · ${wrapEmail(EMAIL_ALT)}`, url: `mailto:${EMAIL}` },
          { id: uid("i"), icon: "MapPin", color: YELLOW, label: "Shop", description: `Shop 271, Opp. Plus Supermarket, Najma Souq Al Haraj, Doha. ${PO_BOX}.` },
        ],
      },
    },
    contact({ map: true }),
  ];
}

function quotePage() {
  return [
    hero({
      badge: "Request a Quote", title: "Tell Us What You Need",
      subtitle: SITE_NAME,
      description: "Quantity orders, regular supply for technicians and companies, compressors, used AC units and repair work.",
      img: "hero-quote", compact: true,
      primary: { label: "WhatsApp Us", url: waText("Hi Jumbo Cool, I would like a quote for:"), variant: "primary", bgColor: YELLOW, textColor: BLACK },
      secondary: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}`, variant: "outline" },
    }),
    quoteForm(SURFACE),
    {
      ...BASE, id: uid("steps"), type: "steps", background: bgColor(PAPER),
      data: {
        title: "What Happens Next", subtitle: "", layout: "horizontal", style: "connected",
        items: [
          { id: uid("s"), step: "01", title: "You Send The Details", description: "Part name, model number and quantity. A photo helps." },
          { id: uid("s"), step: "02", title: "We Check Stock", description: "We confirm availability and the right match." },
          { id: uid("s"), step: "03", title: "You Get A Price", description: "We reply with the price by WhatsApp, phone or email." },
          { id: uid("s"), step: "04", title: "Pickup Or Delivery", description: "Collect from the shop or have it delivered." },
        ],
      },
    },
  ];
}

function faqPage() {
  return [
    hero({
      badge: "FAQ", title: "Questions, Answered",
      subtitle: SITE_NAME,
      description: "Ordering, payment, delivery and repairs.",
      img: "hero-policy", compact: true,
    }),
    faq(GENERAL_FAQ, { title: "Ordering & Delivery", bg: SURFACE }),
    faq(SERVICES.flatMap((s) => s.faq.slice(0, 2)), { title: "Parts & Repairs", bg: PAPER }),
  ];
}

const policyHero = (title, description) => hero({
  badge: "Information", title, subtitle: SITE_NAME, description, img: "hero-policy", compact: true,
  primary: { label: "Shop Parts", url: "/shop", variant: "primary", bgColor: YELLOW, textColor: BLACK },
});

function deliveryPage() {
  return [
    policyHero("Delivery & Returns", "How you receive your order and what to do if something is not right."),
    text(`
<h2>Pickup</h2>
<p>Choose <strong>Pickup</strong> at checkout and collect your order from Shop 271, opposite Plus Supermarket, Najma Souq Al Haraj, Doha. Pickup is free. We will confirm on WhatsApp when the order is ready.</p>
<h2>Delivery</h2>
<p>Choose <strong>Delivery</strong> at checkout and select your area. The delivery charge for your area is shown before you place the order and is added to the total. Orders above the free delivery amount shown at checkout are delivered free.</p>
<p>We confirm every order on WhatsApp or by phone and agree a delivery time with you.</p>
<h2>Payment</h2>
<p>Payment is in cash on delivery, or in cash when you collect from the shop.</p>
<h2>Wrong or faulty item</h2>
<p>Check your order when you receive it. If an item is wrong, damaged or not working, contact us on WhatsApp at <a href="${WA}">${MOBILE_DISPLAY}</a> with your order number and a photo, and we will arrange an exchange or the correct part.</p>
<h2>Returns</h2>
<p>Unused items in their original packing can be exchanged. Please contact us before bringing an item back. Electrical parts that have been installed, refrigerant gas, and copper or insulation cut to length cannot be returned.</p>
<h2>Questions</h2>
<p>Call <a href="tel:${PHONE}">${PHONE_DISPLAY}</a> or email <a href="mailto:${EMAIL}">${EMAIL}</a>.</p>`),
  ];
}

function privacyPage() {
  return [
    policyHero("Privacy Policy", "What information we collect and how we use it."),
    text(`
<p>${LEGAL_NAME} ("we", "us") runs this website. This page explains what we collect when you use it.</p>
<h2>Information you give us</h2>
<p>When you place an order, send a message or request a quote, we collect the details you enter: your name, phone number, email address, delivery address and the contents of your order or message.</p>
<h2>How we use it</h2>
<ul><li>To prepare, confirm and deliver your order.</li><li>To reply to your enquiry or quote request.</li><li>To contact you about your order by phone, WhatsApp or email.</li></ul>
<h2>Sharing</h2>
<p>We do not sell your information. We share it only where needed to complete your order, for example with the person delivering it.</p>
<h2>Cookies and visits</h2>
<p>The website uses essential cookies to keep your cart working and records basic visit statistics, such as which pages are viewed.</p>
<h2>Your choices</h2>
<p>To see, correct or delete the details we hold about you, email <a href="mailto:${EMAIL}">${EMAIL}</a> or call <a href="tel:${PHONE}">${PHONE_DISPLAY}</a>.</p>
<h2>Contact</h2>
<p>${LEGAL_NAME}, ${ADDRESS}. ${PO_BOX}.</p>`),
  ];
}

function termsPage() {
  return [
    policyHero("Terms & Conditions", "The terms that apply when you order from this website."),
    text(`
<h2>About us</h2>
<p>This website is operated by ${LEGAL_NAME}, ${ADDRESS}. ${CR_NO}.</p>
<h2>Orders</h2>
<p>An order placed on the website is a request to buy. It is accepted when we confirm it by WhatsApp, phone or email. We may decline or adjust an order if an item is out of stock or a listing contains an error, and we will tell you before going ahead.</p>
<h2>Prices</h2>
<p>Prices are shown in Qatari Riyal (QAR). Prices and availability can change without notice. The price that applies is the one confirmed with your order.</p>
<h2>Product information and photos</h2>
<p>We take care to describe products accurately. Some photos are illustrative, and specifications can vary between makes. If the exact make or model matters, confirm it with us before ordering.</p>
<h2>Fitting and use</h2>
<p>Air conditioning, refrigeration and electrical parts should be fitted by a qualified technician. Refrigerant gas must be handled by a qualified technician. We are not responsible for damage caused by incorrect installation or use.</p>
<h2>Payment, delivery and returns</h2>
<p>Payment is in cash on delivery or at pickup. See <a href="/delivery-returns">Delivery &amp; Returns</a> for details.</p>
<h2>Contact</h2>
<p>Questions about these terms: <a href="mailto:${EMAIL}">${EMAIL}</a> or <a href="tel:${PHONE}">${PHONE_DISPLAY}</a>.</p>`),
  ];
}

function prefooter() {
  return [
    cta("Not Sure Which Part You Need?", "Send a photo of the old part or its label on WhatsApp. We will match it and tell you the price."),
  ].map((b, i) => ({ ...b, order: 900 + i })); // appended after page blocks, which are sorted by order
}

// ─── write ──────────────────────────────────────────────────────────────────
const ASSET_DIRS = [
  path.join(__dirname, "..", "clients", "Jumbo Cool QA", "site-assets"),
  path.join(__dirname, "..", "clients", "Jumbo Cool QA", "brand"),
];

async function uploadAssets() {
  const { data: existingMedia } = await sb.from("media").select("storage_path").eq("tenant_id", TENANT_ID);
  const known = new Set((existingMedia ?? []).map((m) => m.storage_path));
  let n = 0;
  for (const dir of ASSET_DIRS) {
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
          tenant_id: TENANT_ID, name: file, original_name: file, mime_type: mime, size: buffer.length,
          url: `${SUPABASE_URL}/storage/v1/object/public/media/${storagePath}`, storage_path: storagePath,
          folder: dir.endsWith("brand") ? "/brand" : "/", alt: file.replace(/\.(jpg|png)$/, "").replace(/-/g, " "),
        });
      }
    }
  }
  console.log(`✓ assets uploaded: ${n}`);
}

async function seedCatalogue() {
  const now = new Date().toISOString();
  const { data: existingCats } = await sb.from("categories").select("id, slug").eq("tenant_id", TENANT_ID).eq("type", "product");
  const catIds = {};
  let i = 0;
  for (const c of CATEGORIES) {
    const row = { name: c.name, slug: c.slug, description: c.blurb, type: "product", image_url: asset(c.image), order_index: i++ };
    const found = (existingCats ?? []).find((e) => e.slug === c.slug);
    const { data, error } = found
      ? await sb.from("categories").update(row).eq("id", found.id).select("id").single()
      : await sb.from("categories").insert({ ...row, tenant_id: TENANT_ID }).select("id").single();
    if (error) { console.log(`✗ category ${c.slug}: ${error.message}`); continue; }
    catIds[c.slug] = data.id;
  }
  console.log(`✓ categories: ${Object.keys(catIds).length}`);

  const { data: existingProducts } = await sb.from("products").select("id, slug").eq("tenant_id", TENANT_ID);
  let ok = 0;
  for (const p of PRODUCTS) {
    const image = p.image.startsWith("tile:") ? p.image.slice(5) : p.image;
    const row = {
      name: p.name, slug: p.slug, sku: p.sku, brand: p.brand,
      short_description: p.spec, description: p.description,
      type: "simple", status: "active", price: p.price, compare_price: null,
      track_inventory: true, stock_quantity: p.stock, low_stock_threshold: 3,
      images: [asset(image)], category_ids: [catIds[p.category]], featured: p.featured,
      seo: { title: `${p.name} | ${SITE_NAME} Qatar`, description: `${p.name}. ${p.spec}. Available from ${LEGAL_NAME}, Doha, Qatar.` },
      updated_at: now,
    };
    const found = (existingProducts ?? []).find((e) => e.slug === p.slug);
    const { error } = found
      ? await sb.from("products").update(row).eq("id", found.id)
      : await sb.from("products").insert({ ...row, tenant_id: TENANT_ID });
    if (error) console.log(`✗ product ${p.slug}: ${error.message}`); else ok++;
  }
  console.log(`✓ products: ${ok}/${PRODUCTS.length}`);

  // Delivery zones — PLACEHOLDER charges.
  const zones = [
    { name: "Inside Doha", areas: ["Doha"], rate: 20, free_above: 500, eta_days: "Same or next day", is_default: true, sort_order: 0 },
    { name: "Outside Doha (rest of Qatar)", areas: ["Al Rayyan", "Al Wakrah", "Umm Salal", "Al Khor", "Al Daayen", "Al Shamal", "Al Shahaniya"], rate: 35, free_above: 500, eta_days: "1 to 2 days", is_default: false, sort_order: 1 },
  ];
  const { data: existingZones } = await sb.from("shipping_rates").select("id, name").eq("tenant_id", TENANT_ID);
  for (const z of zones) {
    const found = (existingZones ?? []).find((e) => e.name === z.name);
    const row = { ...z, cod_fee_pct: 0 };
    const { error } = found
      ? await sb.from("shipping_rates").update(row).eq("id", found.id)
      : await sb.from("shipping_rates").insert({ ...row, tenant_id: TENANT_ID });
    if (error) console.log(`✗ zone ${z.name}: ${error.message}`);
  }
  console.log("✓ delivery zones");
  return catIds;
}

async function run() {
  const now = new Date().toISOString();
  if (!process.argv.includes("--skip-assets")) await uploadAssets();
  const catIds = await seedCatalogue();

  const SEO_DESC = "Qatar-based supplier of air conditioning, refrigeration, motors, spare parts and repair solutions. AC spare parts, compressors, refrigerant gas, copper, PCB boards and more at Najma Souq Al Haraj, Doha.";
  const brands = brandsPage();
  // Brands page shows the refrigerant range (where the named brands live)
  brands[brands.length - 1].data.categoryIds = [catIds["refrigerant-gas"]];

  const pages = [
    ["home", "Home", homePage(catIds), `${LEGAL_NAME} | AC Spare Parts, Compressors, Motors & Refrigeration Components in Qatar`, SEO_DESC],
    ["about-us", "About Us", aboutPage(), "About Us", `About ${LEGAL_NAME}: AC, refrigerator and washing machine spare parts, motor rewinding and PCB repair at Najma Souq Al Haraj, Doha.`],
    ["brands", "Brands", brands, "Brands We Stock", "Brands stocked at Jumbo Cool, Doha: refrigerant gas, tools and AC spare parts."],
    ["services", "Services", servicesPage(), "Services", "New and used AC sales, motor rewinding, bush and bearing replacement, PCB repair, AC maintenance and spare parts supply in Doha, Qatar."],
    ...SERVICES.map((s) => [`services/${s.slug}`, s.title, servicePage(s), `${s.title} in Doha, Qatar`, s.short]),
    ["gallery", "Gallery", galleryPage(), "Gallery", "Photos of the Jumbo Cool shop at Najma Souq Al Haraj, Doha, and the parts and repair work we handle."],
    ["contact-us", "Contact Us", contactPage(), "Contact Us", `Contact ${LEGAL_NAME}: WhatsApp ${MOBILE_DISPLAY}, phone ${PHONE_DISPLAY}. ${ADDRESS}.`],
    ["request-a-quote", "Request a Quote", quotePage(), "Request a Quote", "Request a quote for AC spare parts, compressors, refrigerant gas, used AC units and repair work in Qatar."],
    ["faq", "FAQ", faqPage(), "FAQ", "Answers about ordering, cash on delivery, pickup, delivery in Qatar and repairs at Jumbo Cool."],
    ["delivery-returns", "Delivery & Returns", deliveryPage(), "Delivery & Returns", "Pickup, delivery in Qatar, payment and returns at Jumbo Cool."],
    ["privacy-policy", "Privacy Policy", privacyPage(), "Privacy Policy", "How Jumbo Cool Trading & Air Conditioning handles your information."],
    ["terms-and-conditions", "Terms & Conditions", termsPage(), "Terms & Conditions", "Terms that apply when you order from Jumbo Cool Trading & Air Conditioning."],
  ];

  const { data: existing } = await sb.from("pages").select("id, slug, status").eq("tenant_id", TENANT_ID).is("deleted_at", null);
  let i = 0;
  for (const [slug, title, blocks, seoTitle, seoDesc] of pages) {
    blocks.forEach((b, k) => { b.order = k; });
    const row = {
      title, blocks, status: "published", type: "page", order_index: i++, updated_at: now, published_at: now,
      draft_blocks: null,
      seo: { title: seoTitle, description: seoDesc },
    };
    const found = slug === "home"
      ? { id: HOME_PAGE_ID }
      : (existing ?? []).find((p) => p.slug === slug);
    const { error } = found
      ? await sb.from("pages").update(row).eq("id", found.id)
      : await sb.from("pages").insert({ ...row, tenant_id: TENANT_ID, slug, created_at: now });
    console.log(error ? `✗ ${slug}: ${error.message}` : `  ✓ ${slug}`);
  }

  const { error: idErr } = await sb.from("site_identity").upsert({
    tenant_id: TENANT_ID,
    site_name: LEGAL_NAME, tagline: SLOGAN,
    logo_url: LOGO_PLATE, logo_dark_url: LOGO_DARK_BG, logo_type: "image", logo_alt: LEGAL_NAME, logo_width: 220,
    favicon_url: FAVICON,
    primary_color: YELLOW, secondary_color: BLACK,
    color_overrides: {
      primary: YELLOW, primaryFg: BLACK, secondary: "#262626", accent: YELLOW_DEEP, ring: YELLOW,
      background: SURFACE, foreground: "#f4f4f4", card: "#171717", muted: "#1c1c1c", mutedFg: "#a8a8a8",
      border: "#2b2b2b", borderRadius: "0.625rem",
    },
    design_overrides: { headingFont: "Oswald", bodyFont: "Inter", headingWeight: "700", roundness: "soft", shadow: "normal" },
    global_header: globalHeader(), global_footer: globalFooter(), global_prefooter: prefooter(),
    updated_at: now,
  }, { onConflict: "tenant_id" });
  console.log(idErr ? `✗ site_identity: ${idErr.message}` : "✓ site_identity");

  const navRow = { name: "Main Navigation", slug: "main-navigation", location: "header", items: NAV_ITEMS, updated_at: now };
  const { data: nav } = await sb.from("nav_menus").select("id").eq("tenant_id", TENANT_ID).eq("location", "header").maybeSingle();
  const { error: navErr } = nav
    ? await sb.from("nav_menus").update(navRow).eq("id", nav.id)
    : await sb.from("nav_menus").insert({ ...navRow, tenant_id: TENANT_ID });
  if (navErr) console.log("✗ nav_menus:", navErr.message);

  const { error: ssErr } = await sb.from("site_settings").update({
    site_name: LEGAL_NAME,
    site_description: SEO_DESC,
    meta_title: `${LEGAL_NAME} | AC Spare Parts, Compressors, Motors & Refrigeration Components in Qatar`,
    meta_description: SEO_DESC,
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Qatar", language: "en", maintenance_mode: false,
    site_theme: "dark",
    currency: "QAR", currency_symbol: "QAR", currency_position: "before",
    logo_url: LOGO_PLATE, favicon_url: FAVICON, updated_at: now,
  }).eq("tenant_id", TENANT_ID);
  console.log(ssErr ? `✗ site_settings: ${ssErr.message}` : "✓ site_settings (QAR)");

  const contactRow = {
    label: "Shop", phone: PHONE, whatsapp: WHATSAPP, email: EMAIL, address: `${ADDRESS}. ${PO_BOX}`,
    maps_embed_url: MAP_EMBED, is_primary: true, floating_whatsapp: false, sort_order: 0,
  };
  const { data: cd } = await sb.from("contact_details").select("id").eq("tenant_id", TENANT_ID).eq("is_primary", true).maybeSingle();
  const { error: cdErr } = cd
    ? await sb.from("contact_details").update(contactRow).eq("id", cd.id)
    : await sb.from("contact_details").insert({ ...contactRow, tenant_id: TENANT_ID });
  console.log(cdErr ? `✗ contact_details: ${cdErr.message}` : "✓ contact_details");

  // Pro includes ecommerce but leaves it off by default.
  const { data: tenant } = await sb.from("tenants").select("enabled_modules").eq("id", TENANT_ID).single();
  const { error: tErr } = await sb.from("tenants")
    .update({ enabled_modules: { ...(tenant?.enabled_modules ?? {}), ecommerce: true, inventory: true, services: true } })
    .eq("id", TENANT_ID);
  console.log(tErr ? `✗ modules: ${tErr.message}` : "✓ modules (ecommerce on)");

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
