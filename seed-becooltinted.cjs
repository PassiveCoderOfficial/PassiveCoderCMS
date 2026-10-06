/**
 * Be Cool Tinted (BIZZIMAN ENTERPRISE) — car tint, home tint (rumah), car
 * stickers, car mats and number plates in Bestari Jaya / Ijok, Kuala Selangor.
 * Pro-plan demo at becooltinted.passivecoder.com. Dark "night glass" theme in
 * the logo's navy + electric blue + cyan. Logo is a vector redraw
 * (clients/Be Cool Tintend/build-logo.cjs). Package prices come from the
 * client's Facebook promo poster (sedan/compact). Photos are Pexels stand-ins.
 * Safe to re-run; --skip-assets skips uploads.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "becooltinted";
const PLAN = "pro";
const TEMPLATE_SLUG = "cleaning-simple"; // empty custom_css, so our palette wins
const DEMO_HOURS = 72; // demos always 72h (matches src/modules/demo/links.ts)

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Be Cool Tinted";
const COMPANY = "BIZZIMAN ENTERPRISE";
const PHONE = "+601161658180";
const PHONE_DISPLAY = "011-6165 8180";
const WA_NUMBER = "601161658180";
const ADDRESS = "No. 19, Jalan IP 1, Pusat Niaga Ijok Permai, Bestari Jaya, 45000 Batang Berjuntai, Selangor";
const AREA = "Bestari Jaya, Kuala Selangor";
const MAP_Q = "BIZZIMAN ENTERPRISE TINTED - IJOK, Batang Berjuntai";
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAP_Q)}&z=15&output=embed`;
const MAP_LINK = "https://maps.app.goo.gl/VUkTbhURvZ3b1hJ18";
const FB = "https://www.facebook.com/profile.php?id=61574256241816";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hi Be Cool Tinted, I would like a quote.");

const NIGHT = "#06111F";     // deepest band
const NAVY = "#0A1F3D";      // logo shield navy
const BLUE = "#1565C0";      // wordmark blue, primary
const CYAN = "#29B6F6";      // swoosh cyan, accent
const ICE = "#EAF6FD";       // alternate light band
const INK = "#0B1628";
const PAPER = "#FFFFFF";
const LINE = "#D5E5F1";
const MUTED = "#4A5B6E";

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
const LOGO = asset("logo.png");            // vector redraw: clients/Be Cool Tintend/build-logo.cjs
const LOGO_LIGHT = asset("logo-light.png");
const FAVICON_URL = asset("favicon.png");

// Pexels (free for commercial use), stand-ins until the client sends photos.
const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const IMG = {
  darkGlass: px(20036216, 2000),   // black sedan, dark tinted windows
  tintInstall: px(31154212),       // installer applying film on car door glass
  tintWork: px(20522462),          // installer squeegee on car window
  tintWork2: px(20522464),
  sedan: px(26691322),             // dark sedan rear 3/4
  blueSedan: px(34965674),
  hatch: px(18150539),
  doorBlue: px(31735831),
  wrapBlue: px(10162528),          // installer applying blue vinyl on door
  wrapHeat: px(10162529),
  wrapHood: px(10126665),
  wrapHeat2: px(10126666),
  wrapCar: px(36045954),           // finished livery car
  matClio: px(8886311),            // custom branded floor mat
  matClose: px(28055130),
  interior: px(12152922),
  plateFront: px(32081240),        // white BMW, front plate
  plateRear: px(28936830),         // white coupe rear plate, parking
  plateClose: px(9331863),
  homeGlass: px(7061678),          // living room, floor-to-ceiling glass
  homeDining: px(7061670),
  homeWindow: px(8082312),
  officeGlass: px(19343095),
  view: px(8344564),               // view out of a big window
  detailing: px(37809565),
};

// From the client's Facebook poster: full car, sedan / compact, promo prices.
const PACKAGES = [
  { name: "Standard", price: 99, was: 245, film: "Nano Carbon", uv: 99, irr: 70, warranty: 1, usa: false, removal: false },
  { name: "Premium", price: 249, was: 545, film: "Nano Ceramic", uv: 99, irr: 85, warranty: 3, usa: false, removal: true },
  { name: "Gold", price: 388, was: 635, film: "Reflective Tinted Film", uv: 98, irr: 90, warranty: 3, usa: false, removal: true },
  { name: "Diamond", price: 399, was: 748, film: "Nano Ceramic HD", uv: 100, irr: 95, warranty: 6, usa: true, removal: true },
  { name: "Platinum", price: 499, was: 899, film: "Sputtering Multilayer Film", uv: 100, irr: 99, warranty: 8, usa: true, removal: true },
  { name: "Ultimate", price: 799, was: 1995, film: "Sputtering UHD Security Film", uv: 100, irr: 99, warranty: 10, usa: true, removal: true },
];

// ─── Services ───────────────────────────────────────────────────────────────
const SERVICES = [
  {
    slug: "car-tint", icon: "Car", title: "Car Tint", img: IMG.tintInstall, kicker: "Kereta tinted",
    short: "Heat-rejecting window film for sedans, compacts, SUVs and MPVs. Six packages from RM99.",
    intro: "Malaysian sun turns a parked car into an oven. Our films cut glare, block UV and reject infrared heat so the cabin stays cool and the aircon works less. Choose from nano carbon up to sputtering UHD security film, fitted cleanly with old tint removed free on most packages.",
    includes: [
      ["Sun", "Up to 99% heat rejection", "IRR from 70% on Standard up to 99% on Platinum and Ultimate."],
      ["ShieldCheck", "Up to 100% UV block", "Protects skin, dashboard and leather from fading and cracking."],
      ["Eraser", "Free old tint removal", "Included on Premium and above. Old film and glue cleaned off properly."],
      ["Layers", "Six film grades", "Nano carbon, nano ceramic, reflective, nano ceramic HD and sputtering films."],
      ["BadgeCheck", "Warranty up to 10 years", "From 1 year on Standard to 10 years on Ultimate."],
      ["Scale", "Road-legal shades", "We help you choose shades within JPJ light transmission limits."],
    ],
    tags: ["Sedan", "Compact / hatchback", "SUV", "MPV", "Front windscreen", "Sunroof", "Re-tint & removal"],
    steps: [
      ["Pick a package", "Compare the six packages or tell us your budget on WhatsApp."],
      ["Book a slot", "Choose a day and drop your car at our Bestari Jaya shop."],
      ["Clean fitting", "Old tint removed, glass cleaned, film cut and fitted indoors."],
      ["Drive away cool", "Aftercare tips and your warranty, ready the same day for most cars."],
    ],
    faq: [
      ["How long does a full car tint take?", "Most sedans and compacts are done within the same day. We confirm the time when you book."],
      ["Can I roll down the windows right after?", "Wait 3 to 5 days so the film can cure fully. We will tell you exactly on handover."],
      ["Do the prices change for SUVs and MPVs?", "The listed prices are for sedans and compacts. Send your car model on WhatsApp for an SUV or MPV price."],
    ],
    gallery: [IMG.tintInstall, IMG.tintWork, IMG.darkGlass],
  },
  {
    slug: "home-tint", icon: "Home", title: "Rumah Tint", img: IMG.homeGlass, kicker: "Home & office window film",
    short: "Window film for houses, shops and offices. Less heat, less glare, more privacy.",
    intro: "Big windows and sliding doors let in light, and a lot of heat. Home window film keeps rooms cooler, protects furniture from fading and adds daytime privacy, without blocking your view. We fit houses, terrace homes, shop lots and offices around Kuala Selangor.",
    includes: [
      ["ThermometerSun", "Heat control", "Cooler rooms and lower aircon use in west-facing spaces."],
      ["EyeOff", "Daytime privacy", "Reflective and dark films stop passers-by seeing in."],
      ["Sofa", "Fade protection", "UV block protects sofas, curtains, floors and artwork."],
      ["Sparkles", "Glare reduction", "Easier on the eyes for TVs, screens and workspaces."],
      ["Store", "Shop & office glass", "Shop fronts, glass partitions and meeting rooms."],
      ["ShieldCheck", "Safety layer", "Film helps hold broken glass together."],
    ],
    tags: ["Terrace houses", "Bungalows", "Condos", "Shop lots", "Offices", "Sliding doors", "Skylights"],
    steps: [
      ["Send photos", "Photos and rough sizes of the windows on WhatsApp."],
      ["Site visit & quote", "We measure, show film samples and give a fixed price."],
      ["Install", "Glass cleaned and film fitted with minimal mess."],
    ],
    faq: [
      ["Will the film make my house dark inside?", "Not if you choose the right film. Lighter heat-rejecting films keep rooms bright while cutting heat."],
      ["Can you see out at night?", "Reflective films give privacy in daytime. At night, with lights on inside, people can see in, so curtains are still useful."],
      ["How is home tint priced?", "By square feet and film type. Send photos and sizes for a quote."],
    ],
    gallery: [IMG.homeGlass, IMG.homeWindow, IMG.homeDining],
  },
  {
    slug: "car-sticker", icon: "Sticker", title: "Car Sticker", img: IMG.wrapBlue, kicker: "Decals & vinyl",
    short: "Custom decals, stripes, lettering and business stickers, cut and fitted in-house.",
    intro: "Make the car yours, or turn it into a moving advert. We design, cut and fit car stickers, from small decals and racing stripes to full business lettering on vans and lorries.",
    includes: [
      ["Brush", "Custom decals", "Logos, names and graphics in the size you want."],
      ["Minus", "Stripes & accents", "Bonnet, roof and side stripes in matte or gloss."],
      ["Briefcase", "Business lettering", "Company name, phone and services on vans and lorries."],
      ["Palette", "Colour change panels", "Roof, bonnet or mirror wraps in vinyl."],
      ["Scissors", "In-house cutting", "Designed and cut to fit your car model."],
      ["Eraser", "Sticker removal", "Old stickers and glue removed safely."],
    ],
    tags: ["Decals", "Stripes", "Roof wrap", "Bonnet wrap", "Business vans", "Lorries", "Motorcycles"],
    steps: [
      ["Share your idea", "Send a sketch, a logo or a photo of what you like."],
      ["Design proof", "We send a mock-up and price before cutting."],
      ["Cut & fit", "Vinyl cut to size and applied cleanly."],
    ],
    faq: [
      ["Can you design the sticker for me?", "Yes. Send your logo or idea and we prepare a design for your approval."],
      ["Will stickers damage the paint?", "Quality vinyl removes cleanly from healthy factory paint."],
      ["Do you do business lettering for fleets?", "Yes. Send the number of vehicles and the design for a fleet price."],
    ],
    gallery: [IMG.wrapBlue, IMG.wrapHeat, IMG.wrapCar],
  },
  {
    slug: "car-mat", icon: "Grid2x2", title: "Car Mat", img: IMG.matClio, kicker: "Custom-fit floor mats",
    short: "Floor mats cut to fit your car model. Easy to clean, keeps the carpet new.",
    intro: "Mud, rain and spilled drinks wreck the original carpet. Our car mats are made to fit your exact model, cover the full floor and are easy to take out and wash.",
    includes: [
      ["Ruler", "Model-specific fit", "Cut to your car's floor shape, front and rear."],
      ["Droplets", "Waterproof options", "Keeps rain and spills off the carpet."],
      ["Brush", "Easy to clean", "Shake, rinse or wipe down in minutes."],
      ["Palette", "Colour & trim choice", "Pick a colour and edging to match your interior."],
      ["Anchor", "Anti-slip base", "Stays in place under the pedals."],
      ["Package", "Boot mats", "Matching boot liner on request."],
    ],
    tags: ["Perodua", "Proton", "Honda", "Toyota", "Nissan", "SUV & MPV", "Boot mat"],
    steps: [
      ["Tell us your car", "Model and year on WhatsApp."],
      ["Choose the style", "Colour, material and trim."],
      ["Fitted", "Collect at the shop or fit while your car is tinted."],
    ],
    faq: [
      ["Do you have mats for my car?", "Send the model and year. Most Malaysian and Japanese models are available."],
      ["Can I fit mats on the same day as tint?", "Yes. Many customers add mats while the car is in for tint."],
      ["How do I clean them?", "Take them out, shake off dirt and rinse. They dry quickly."],
    ],
    gallery: [IMG.matClio, IMG.matClose, IMG.interior],
  },
  {
    slug: "number-plate", icon: "RectangleHorizontal", title: "Number Plate", img: IMG.plateFront, kicker: "Plat nombor",
    short: "Car and motorcycle number plates made to the standard format, fitted on the spot.",
    intro: "Cracked, faded or new car, we make number plates for cars and motorcycles in the standard format, with clean lettering and a solid frame, and fit them while you wait.",
    includes: [
      ["RectangleHorizontal", "Car plates", "Front and rear plates in the standard format."],
      ["Bike", "Motorcycle plates", "Sized for bikes and scooters."],
      ["Type", "Clean lettering", "Sharp, evenly spaced characters that are easy to read."],
      ["Frame", "Frames & fitting", "Fitted firmly so plates do not rattle or fall."],
      ["RefreshCw", "Replacement", "Replace cracked, faded or bent plates."],
      ["Clock", "While you wait", "Usually made and fitted on the spot."],
    ],
    tags: ["New cars", "Replacement plates", "Motorcycles", "Front & rear", "Frames"],
    steps: [
      ["Send the details", "Plate number and vehicle type on WhatsApp."],
      ["We make it", "Plate printed in the standard format."],
      ["Fit on the spot", "Collect or fit at the shop."],
    ],
    faq: [
      ["Do you make plates for motorcycles?", "Yes, for both cars and motorcycles."],
      ["Do I need to bring documents?", "Bring your vehicle registration details so the number is correct."],
      ["How long does it take?", "Usually while you wait. Message us first to confirm."],
    ],
    gallery: [IMG.plateFront, IMG.plateRear, IMG.plateClose],
  },
];
const svcUrl = (s) => `/services/${s.slug}`;
const w = (url, n) => url.replace(/w=\d+/, `w=${n}`);

// ─── shared ─────────────────────────────────────────────────────────────────
// Native blocks only: every section below is a regular block + variant that
// the client can edit in the page builder (no custom_html).
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = { visible: true, width: "full", padding: { top: 88, right: 24, bottom: 88, left: 24 }, margin: ZERO, background: { type: "none" } };
const bgColor = (color) => ({ type: "color", color });
const COLORS = { dark: NIGHT, accent: CYAN };
const block = (type, variant, data, o = {}) => ({ ...BASE, id: uid(type), type, ...(variant ? { templateVariant: variant } : {}), ...o, data });
const TYPO = { titleSize: "6xl", titleColor: "#ffffff", subtitleColor: "#ffffff", descColor: "#ffffff" };

const PAGES = [
  ["home", "Home", "/"],
  ["services", "Services", "/services"],
  ...SERVICES.map((s) => [`services/${s.slug}`, s.title, svcUrl(s), true]),
  ["packages", "Tint Packages", "/packages"],
  ["about", "About", "/about"],
  ["contact", "Contact", "/contact"],
];
const TOP_PAGES = PAGES.filter((p) => !p[3]);

function navItems() {
  return TOP_PAGES.map(([, label, url], i) => ({
    id: `n${i}`, label, url,
    children: url === "/services" ? SERVICES.map((s, k) => ({ id: `n${i}-${k}`, label: s.title, url: svcUrl(s), children: [] })) : [],
  }));
}

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(PAPER),
    data: {
      logoText: SITE_NAME, logo: LOGO, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: BLUE, ctaVariant: "solid", logoHeight: 54, logoCaption: "",
      showCta: true, ctaLabel: "WhatsApp Quote", ctaUrl: WA,
      topBar: {
        show: true, showPhone: true, showWhatsapp: true, whatsappLabel: "WhatsApp",
        whatsappText: "Hi Be Cool Tinted, I would like a quote.",
        background: NIGHT, textColor: "#A9BCD3",
        items: [
          { id: "tb1", text: AREA, icon: "pin", side: "left", hideOnMobile: true },
          { id: "tb2", text: "Free old tint removal on Premium and above", icon: "info", side: "left", hideOnMobile: true },
          { id: "tb3", text: "Facebook", icon: "facebook", url: FB, side: "right", hideOnMobile: true },
        ],
      },
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 1, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_LIGHT, logoText: SITE_NAME, logoCaption: `${COMPANY} · Bestari Jaya, Selangor`,
      tagline: "Be cool. Stay cool. Car tint, home tint, car stickers, car mats and number plates in Kuala Selangor.",
      style: "dark", backgroundColor: NIGHT, accentColor: CYAN, textColor: "#A9BCD3",
      copyrightText: `© {year} ${SITE_NAME} (${COMPANY}). All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }, { platform: "facebook", url: FB }],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.map((s) => ({ id: uid("fl"), label: s.title, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Company", links: TOP_PAGES.map(([, label, url]) => ({ id: uid("fl"), label, url })) },
        { id: uid("fc"), heading: "Visit us", links: [
          { id: uid("fl"), label: `WhatsApp ${PHONE_DISPLAY}`, url: WA },
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: "No. 19, Jalan IP 1, Pusat Niaga Ijok Permai", url: MAP_LINK },
          { id: uid("fl"), label: "Bestari Jaya, Selangor", url: MAP_LINK },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── sections ───────────────────────────────────────────────────────────────
function heroHome() {
  return block("hero", "spec-card", {
    layout: "left", badge: "Car & home tint · Bestari Jaya, Selangor",
    title: "Be cool.", titleAccent: "Stay cool.",
    description: "Heat-rejecting window film for your car and your home. Up to 99% heat rejection, up to 100% UV block and up to 10 years warranty. Full car tint from RM99.",
    primaryButton: { label: "Get a quote on WhatsApp", url: WA, variant: "primary" },
    secondaryButton: { label: "See tint packages", url: "/packages", variant: "outline" },
    imageUrl: w(IMG.darkGlass, 2000), imageAlt: "Black sedan with dark tinted windows", overlayOpacity: 0.45,
    specCard: {
      label: "Featured: Diamond package", title: "Nano Ceramic HD",
      meters: [{ id: "m1", label: "UV block", value: 100 }, { id: "m2", label: "Heat rejection (IRR)", value: 95 }],
      stats: [{ id: "s1", value: "6 yr", label: "warranty" }, { id: "s2", value: "Free", label: "old tint removal" }, { id: "s3", value: "RM399", label: "sedan / compact" }],
    },
    strip: SERVICES.map((s) => ({ id: s.slug, title: s.title, subtitle: s.kicker, url: svcUrl(s) })),
    colors: COLORS, typography: TYPO,
  }, { padding: ZERO });
}

function pageBanner({ kicker, title, description, img }) {
  return block("hero", "page-banner", {
    layout: "left", badge: kicker, title, description, showBreadcrumb: true,
    primaryButton: { label: "Get a quote", url: WA, variant: "primary" },
    secondaryButton: { label: PHONE_DISPLAY, url: `tel:${PHONE}`, variant: "outline" },
    imageUrl: w(img, 1800), overlayOpacity: 0.25, colors: COLORS, typography: TYPO,
  }, { padding: ZERO });
}

function packages(bg = PAPER, { title = "Full car tint packages", subtitle = "Promo prices for sedans and compacts, full car. SUV and MPV prices on WhatsApp." } = {}) {
  return block("pricing", "spec-cards", {
    eyebrow: "Harga promosi", title, subtitle, layout: "cards", billingToggle: false,
    currencyPrefix: "RM", whatsappCta: true,
    whatsappText: "Hi Be Cool Tinted, I am interested in the {plan} package ({price}). My car is: ",
    footnote: "Prices from our current promotion for sedans and compacts. Promotions change, so confirm the latest price on WhatsApp. IRR = infrared (heat) rejection.",
    colors: COLORS,
    plans: PACKAGES.map((p, i) => ({
      id: `pk${i}`, name: p.name, price: String(p.price), oldPrice: p.was.toLocaleString("en"),
      spec: p.film, tag: p.usa ? "USA film" : "",
      meters: [{ id: `pk${i}u`, label: "UV", value: p.uv }, { id: `pk${i}i`, label: "IRR", value: p.irr }],
      features: [`${p.warranty} year${p.warranty > 1 ? "s" : ""} warranty`, ...(p.removal ? ["Free old tint removal"] : []), "Full car, sedan / compact"],
      excludedFeatures: p.removal ? [] : ["Old tint removal"],
      highlighted: i === PACKAGES.length - 1, badge: i === PACKAGES.length - 1 ? "Top tier" : "",
      ctaLabel: `Book ${p.name}`,
    })),
  }, { background: bgColor(bg) });
}

function bento(bg = PAPER, title = "Five services, one shop") {
  return block("services", "bento", {
    eyebrow: "What we do", title,
    subtitle: "Tint is our speciality, and while your car is with us we can fit stickers, mats and new number plates too.",
    layout: "grid", columns: 4, cardStyle: "flat", source: "inline", hideSmallText: true, colors: COLORS,
    items: SERVICES.map((s, i) => ({
      id: s.slug, title: s.title, description: s.short, kicker: s.kicker, icon: s.icon, iconType: "lucide",
      imageUrl: w(s.img, i === 0 ? 1400 : 900), link: svcUrl(s), linkLabel: "Explore",
    })),
  }, { background: bgColor(bg) });
}

function shadePreview() {
  const shades = [["70%", "Windscreen legal limit", 22], ["50%", "Front side windows", 45], ["30%", "Rear windows", 62], ["15%", "Rear, more privacy", 78], ["5%", "Limo, rear only", 90]];
  return block("option_preview", null, {
    eyebrow: "Tint shade guide", title: "How dark should you go?",
    subtitle: "Shade is measured in VLT, the percentage of visible light that passes through. Lower number, darker glass. Tap a shade to preview it.",
    imageUrl: w(IMG.view, 1400), tone: "dark", showLabel: true, labelPrefix: "VLT", defaultIndex: 1,
    options: shades.map(([label, sublabel, strength], i) => ({ id: `sh${i}`, label, sublabel, mode: "tint", color: "#040C18", strength })),
    panel: {
      show: true, title: "JPJ light transmission limits",
      rows: [["Front windscreen", "70%"], ["Front side windows", "50%"], ["Rear side windows", "30%"], ["Rear windscreen", "30%"]].map(([label, value], i) => ({ id: `r${i}`, label, value })),
      text: "Minimum VLT for private cars. We help you pick a film that stays within the limits and still keeps the heat out. Heat rejection comes from the film technology, not only the darkness.",
      buttonLabel: "Ask which shade suits you", whatsapp: true, whatsappText: "Hi Be Cool Tinted, can you help me choose a tint shade? My car is: ",
    },
    colors: COLORS,
  }, { padding: ZERO });
}

function perks(bg = ICE) {
  return block("features", "image-stats", {
    eyebrow: "Why Be Cool Tinted", title: "Real heat rejection, fitted properly.",
    description: "Darker is not always cooler. What keeps the cabin cool is the film technology. We stock everything from budget nano carbon to multilayer sputtering films, and we tell you honestly what each one does.",
    imageUrl: w(IMG.tintWork, 1100), badge: { title: "USA film", text: "on Diamond, Platinum & Ultimate" },
    layout: "grid", columns: 2, style: "minimal", colors: COLORS,
    items: [
      ["Up to 99%", "heat rejection", "IRR on Platinum and Ultimate sputtering films."],
      ["100%", "UV protection", "On Diamond, Platinum and Ultimate."],
      ["10 years", "max warranty", "Ultimate package. 1 to 8 years on the others."],
      ["Free", "old tint removal", "Included on Premium and every package above it."],
    ].map(([title, label, description], i) => ({ id: `pf${i}`, title, label, description })),
  }, { background: bgColor(bg) });
}

function filmTypes(bg = ICE) {
  return block("features", "numbered-grid", {
    eyebrow: "Know your film", title: "Six film technologies, explained simply", tone: "light",
    layout: "grid", columns: 3, style: "minimal", colors: COLORS,
    items: [
      ["Nano Carbon", "Entry level. Good glare and UV control, matte look, will not fade to purple. Standard package."],
      ["Nano Ceramic", "Ceramic particles reject heat without metal, so phone and GPS signal stay clear. Premium package."],
      ["Reflective Film", "Mirror-like outside finish for strong privacy and heat rejection. Gold package."],
      ["Nano Ceramic HD", "Higher clarity ceramic with 95% IRR and 100% UV block. Diamond package."],
      ["Sputtering Multilayer", "Metal layers deposited at micro scale. Up to 99% IRR with a clear view. Platinum package."],
      ["Sputtering UHD Security", "Our top film. Thick security layer that helps hold glass together. Ultimate package."],
    ].map(([title, description], i) => ({ id: `ft${i}`, title, description })),
  }, { padding: ZERO, background: bgColor(bg) });
}

function svcOverview(s) {
  const [first, ...rest] = s.intro.split(". ");
  return block("features", "overview-quote", {
    eyebrow: s.kicker, title: `${first}.`, description: rest.join(". "), tags: s.tags,
    layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
    card: {
      imageUrl: w(s.gallery[1] || s.img, 900), title: "Quick quote",
      text: `Send your ${s.slug.startsWith("home") ? "window photos and rough sizes" : "car model and what you need"}. We reply with a price, usually the same day.`,
      buttonLabel: "Quote on WhatsApp", whatsapp: true, whatsappText: `Hi Be Cool Tinted, I would like a quote for ${s.title}.`,
    },
  }, { background: bgColor(PAPER) });
}

function svcIncludes(s) {
  return block("features", "numbered-grid", {
    eyebrow: "What you get", title: `${s.title}, done properly`, tone: "dark",
    layout: "grid", columns: 3, style: "minimal", colors: COLORS,
    items: s.includes.map(([, title, description], i) => ({ id: `in${i}`, title, description })),
  }, { padding: ZERO });
}

function svcGallery(s) {
  return block("gallery", "hero-mosaic", {
    title: "", layout: "grid", columns: 3, gap: "md", lightbox: true,
    images: s.gallery.slice(0, 3).map((url, i) => ({ id: `g${i}`, url: w(url, 1200), alt: s.title, caption: "" })),
  }, { background: bgColor(PAPER), padding: { top: 88, right: 24, bottom: 0, left: 24 } });
}

function steps(items, title, bg = PAPER) {
  return block("steps", "timeline-connected", {
    title, subtitle: "How it works", layout: "horizontal", style: "connected",
    items: items.map(([t, description], i) => ({ id: `st${i}`, step: `0${i + 1}`, title: t, description })),
  }, { background: bgColor(bg) });
}

function faq(items, bg = PAPER, variant = "numbered-list", title = "Frequently asked questions") {
  return block("faq", variant, {
    title, subtitle: "Still unsure? Message us on WhatsApp.", layout: "accordion", allowMultiple: false,
    items: items.map(([question, answer], i) => ({ id: `fq${i}`, question, answer })),
  }, { background: bgColor(bg) });
}
const FAQ_HOME = [
  ["Where is your shop?", `${ADDRESS}. Near Simpang Tiga Ijok. Tap the map below for directions.`],
  ["How much is a full car tint?", "Full car tint for sedans and compacts starts from RM99 on the Standard package, up to RM799 for Ultimate. SUV and MPV prices on WhatsApp."],
  ["Is the tint JPJ compliant?", "We help you choose shades within the JPJ visible light limits: 70% windscreen, 50% front sides and 30% rear."],
  ["Do you remove old tint?", "Yes. Old tint removal is free on Premium and every package above it."],
  ["Do you tint houses too?", "Yes. We fit window film for houses, shop lots and offices. Send photos of the windows for a quote."],
  ["Can I add stickers, mats or a number plate on the same visit?", "Yes. Many customers do everything in one visit while the car is with us."],
];

function otherServices(cur) {
  return block("services", "photo-cards", {
    title: "More from our shop", layout: "grid", columns: 4, cardStyle: "flat", source: "inline",
    allLink: { label: "All services", url: "/services" }, colors: COLORS,
    items: SERVICES.filter((x) => x.slug !== cur.slug).map((x) => ({
      id: x.slug, title: x.title, description: "", kicker: x.kicker, icon: x.icon, iconType: "lucide", imageUrl: w(x.img, 700), link: svcUrl(x),
    })),
  }, { background: bgColor(PAPER) });
}

function visit(title = "Come cool down at our shop.") {
  return block("cta", "visit-map", {
    eyebrow: "Be cool. Stay cool.", title,
    description: "Drop by in Bestari Jaya or send us your car model on WhatsApp for a quick price.",
    layout: "split", mapQuery: MAP_Q, showMap: true, colors: COLORS,
    primaryButton: { label: "WhatsApp us", url: "" },
    secondaryButton: { label: "Get directions", url: MAP_LINK },
  }, { padding: ZERO });
}

function aboutStory() {
  return block("features", "image-stats", {
    eyebrow: "About us", title: "A local tint shop in Bestari Jaya.",
    description: `Be Cool Tinted is run by ${COMPANY} from our shop at Pusat Niaga Ijok Permai, near Simpang Tiga Ijok. We tint cars and homes for drivers and families around Kuala Selangor, and we do car stickers, car mats and number plates under the same roof.\n\nOur approach is simple: clear package prices, films for every budget, honest advice on which shade and film suits you, and careful fitting.`,
    imageUrl: w(IMG.tintWork2, 1100), badge: { title: "5 services", text: "under one roof" },
    layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
    buttons: [{ id: "b1", label: "Chat with us", url: WA, style: "solid" }, { id: "b2", label: "Follow on Facebook", url: FB, style: "outline" }],
  }, { background: bgColor(PAPER) });
}

function contactCards() {
  return block("icon_grid", "colored-tiles", {
    title: "Reach us", subtitle: "", columns: 4, iconSize: "md",
    items: [
      ["MessageCircle", "WhatsApp", PHONE_DISPLAY, WA],
      ["Phone", "Call", PHONE_DISPLAY, `tel:${PHONE}`],
      ["MapPin", "Visit", "Pusat Niaga Ijok Permai, Bestari Jaya", MAP_LINK],
      ["ThumbsUp", "Facebook", "Be Cool Tinted", FB],
    ].map(([icon, label, description, url], i) => ({ id: `cc${i}`, icon, color: BLUE, label, description, url })),
  }, { background: bgColor(PAPER) });
}

function contactForm() {
  return block("contact", null, {
    title: "Send us your details", subtitle: "Fill this in and we will get back to you. For the fastest reply, use WhatsApp.",
    layout: "split", showMap: false, showContactInfo: true, phone: PHONE_DISPLAY, address: ADDRESS,
    fields: [
      { id: "f-name", label: "Name", type: "text", required: true },
      { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
      { id: "f-svc", label: "Service", type: "select", required: false, options: [...SERVICES.map((s) => s.title), "Other"] },
      { id: "f-car", label: "Car model (or property type)", type: "text", required: false },
      { id: "f-msg", label: "Details", type: "textarea", required: false },
    ],
    submitLabel: "Send", successMessage: "Thank you. We will contact you shortly. For a faster reply, WhatsApp us.",
  }, { background: bgColor(ICE) });
}

// ─── pages ──────────────────────────────────────────────────────────────────
const BUILDERS = {
  home: () => [heroHome(), packages(PAPER), perks(ICE), bento(PAPER), shadePreview(), faq(FAQ_HOME, PAPER, "numbered-list"), visit()],
  services: () => [
    pageBanner({ kicker: "Everything under one roof", title: "Tint, stickers, mats and plates", description: "Car tint, home tint, car stickers, car mats and number plates in Bestari Jaya, Kuala Selangor.", img: IMG.sedan }),
    bento(PAPER, "Pick a service"), perks(ICE), visit(),
  ],
  packages: () => [
    pageBanner({ kicker: "Harga promosi", title: "Full car tint from RM99", description: "Six packages for sedans and compacts, from nano carbon to sputtering UHD security film. Up to 10 years warranty.", img: IMG.darkGlass }),
    packages(PAPER, { title: "Choose your package", subtitle: "Full car, sedan / compact. Free old tint removal from Premium upwards." }),
    filmTypes(ICE), shadePreview(),
    faq(SERVICES[0].faq.concat([FAQ_HOME[2], FAQ_HOME[3]]), PAPER, "minimal-lines", "Tint questions"),
    visit("Ready to book your tint?"),
  ],
  about: () => [
    pageBanner({ kicker: COMPANY, title: "Be cool. Stay cool.", description: "Car and home tint specialist in Bestari Jaya, Selangor.", img: IMG.tintWork }),
    aboutStory(), perks(ICE), visit(),
  ],
  contact: () => [
    pageBanner({ kicker: "Get in touch", title: "Get your quote", description: `WhatsApp or call ${PHONE_DISPLAY}, or visit us at Pusat Niaga Ijok Permai, Bestari Jaya.`, img: IMG.blueSedan }),
    contactCards(), contactForm(), visit("Find our shop"),
  ],
};
for (const s of SERVICES) {
  BUILDERS[`services/${s.slug}`] = () => [
    pageBanner({ kicker: s.kicker, title: s.title, description: s.short, img: s.img }),
    svcOverview(s),
    ...(s.slug === "car-tint" ? [packages(ICE, { title: "Car tint packages" }), shadePreview()] : [svcIncludes(s)]),
    svcGallery(s),
    steps(s.steps, `How ${s.title.toLowerCase()} works`),
    faq(s.faq, ICE, "minimal-lines", "Questions"),
    otherServices(s),
    visit(`Book your ${s.title.toLowerCase()}`),
  ];
}

const SEO = {
  home: ["Car Tint & Home Tint in Bestari Jaya, Kuala Selangor", "Be Cool Tinted: full car tint from RM99, nano ceramic and sputtering films, home window tint, car stickers, car mats and number plates in Bestari Jaya, Selangor."],
  services: ["Tint, Car Stickers, Car Mats & Number Plates", "Car tint, rumah tint, car stickers, car mats and number plates at Be Cool Tinted, Pusat Niaga Ijok Permai, Bestari Jaya."],
  packages: ["Car Tint Packages from RM99", "Six full car tint packages for sedans and compacts: Standard, Premium, Gold, Diamond, Platinum and Ultimate. Up to 99% IRR and 10 years warranty."],
  about: ["About Be Cool Tinted", `Be Cool Tinted (${COMPANY}) is a car and home tint shop in Bestari Jaya, Kuala Selangor.`],
  contact: ["Contact Be Cool Tinted", `WhatsApp or call ${PHONE_DISPLAY}. ${ADDRESS}.`],
};
for (const s of SERVICES) SEO[`services/${s.slug}`] = [`${s.title} in Bestari Jaya, Kuala Selangor`, `${s.short} ${s.intro}`.slice(0, 158)];

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
  console.log("✓ tenant created", id, "demo until", expiresAt);
  return id;
}

async function ensureContact(tenantId) {
  const row = {
    tenant_id: tenantId, label: "Main", phone: "+60 11-6165 8180", whatsapp: WA_NUMBER,
    address: ADDRESS, is_primary: true, floating_whatsapp: true, floating_call: true, sort_order: 0,
  };
  const { data: c } = await sb.from("contact_details").select("id").eq("tenant_id", tenantId).eq("is_primary", true).maybeSingle();
  const { error } = c ? await sb.from("contact_details").update(row).eq("id", c.id) : await sb.from("contact_details").insert(row);
  console.log(error ? `✗ contact: ${error.message}` : "✓ contact_details");
}

async function uploadAssets(tenantId) {
  const dir = path.join(__dirname, "..", "clients", "Be Cool Tintend", "site-assets");
  const { data: existingMedia } = await sb.from("media").select("storage_path").eq("tenant_id", tenantId);
  const known = new Set((existingMedia ?? []).map((m) => m.storage_path));
  let n = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!/\.(jpg|png)$/.test(file) || file.includes("preview")) continue;
    const buffer = fs.readFileSync(path.join(dir, file));
    const storagePath = `${STORAGE_DIR}/${file}`;
    const mime = file.endsWith(".png") ? "image/png" : "image/jpeg";
    const { error } = await sb.storage.from("media").upload(storagePath, buffer, { contentType: mime, upsert: true, cacheControl: "3600" });
    if (error) { console.log(`✗ upload ${file}: ${error.message}`); continue; }
    n++;
    if (!known.has(storagePath)) {
      await sb.from("media").insert({
        tenant_id: tenantId, name: file, original_name: file, mime_type: mime, size: buffer.length,
        url: asset(file), storage_path: storagePath, folder: "/", alt: file.replace(/\.(jpg|png)$/, "").replace(/-/g, " "),
      });
    }
  }
  console.log(`✓ assets uploaded: ${n}`);
}

async function run() {
  const { data: tpl } = await sb.from("templates").select("id, custom_css").eq("slug", TEMPLATE_SLUG).single();
  if (!tpl) throw new Error(`template ${TEMPLATE_SLUG} missing`);
  if (tpl.custom_css) console.log("! template has custom_css, check palette leaks");
  const tenantId = await ensureTenant();
  await ensureContact(tenantId);
  if (!process.argv.includes("--skip-assets")) await uploadAssets(tenantId);
  const now = new Date().toISOString();

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
    site_name: SITE_NAME, tagline: "Car & Home Tint Specialist, Bestari Jaya",
    logo_url: LOGO, logo_dark_url: LOGO_LIGHT, logo_type: "image", logo_alt: SITE_NAME, logo_width: 300,
    favicon_url: FAVICON_URL,
    primary_color: BLUE, secondary_color: NAVY,
    color_overrides: {
      primary: BLUE, primaryFg: "#ffffff", secondary: NAVY, accent: CYAN, ring: BLUE,
      background: PAPER, foreground: INK, card: "#ffffff", muted: ICE, mutedFg: MUTED,
      border: LINE, borderRadius: "0.75rem",
    },
    design_overrides: { headingFont: "Exo 2", bodyFont: "Inter", headingWeight: "800", headingStyle: "italic", roundness: "rounded", shadow: "soft" },
    global_header: [header()], global_footer: [footer()], global_prefooter: [],
    updated_at: now,
  }, { onConflict: "tenant_id" });
  console.log(idErr ? `✗ site_identity: ${idErr.message}` : "✓ site_identity");

  await sb.from("nav_menus").upsert(
    { tenant_id: tenantId, name: "Main Navigation", location: "header", items: navItems(), updated_at: now },
    { onConflict: "tenant_id,location" },
  );
  const { error: ssErr } = await sb.from("site_settings").upsert({
    tenant_id: tenantId, site_name: SITE_NAME, site_description: SEO.home[1],
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Kuala_Lumpur", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
