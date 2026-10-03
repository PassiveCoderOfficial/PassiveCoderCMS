/**
 * AMK General Cleaning Services — office, hotel, house, kitchen, deep and
 * furniture cleaning in Doha, Qatar. CR No. 27134.
 * Pro-plan demo at amkcleaning.passivecoder.com. English only, crisp white
 * theme in the letterhead's AMK blue + navy. Logo is extracted from the
 * client's letterhead PDF (clients/AMK Cleaning QA/AMK.pdf); header uses the
 * "logo-center" navigation style. All photos are Pexels stand-ins, no prices
 * on the site — enquiries go to WhatsApp.
 * Safe to re-run.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "amkcleaning";
const PLAN = "pro";
const TEMPLATE_SLUG = "cleaning-simple"; // empty custom_css, so our palette wins
const DEMO_HOURS = 24 * 7;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "AMK General Cleaning Services";
const SHORT = "AMK Cleaning";
const CR = "27134";
const PHONE = "+97431463704";
const PHONE_DISPLAY = "+974 3146 3704";
const WA_NUMBER = "97431490273";
const WA_DISPLAY = "+974 3149 0273";
const EMAIL = "amkqacompany@gmail.com";
const ADDRESS = "Doha, Qatar";
const MAP_EMBED = "https://www.google.com/maps?q=Doha%2C%20Qatar&z=11&output=embed";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hello AMK Cleaning, I would like a cleaning quote.");

const BLUE = "#1880C4";      // AMK wordmark blue, primary
const NAVY = "#0F3D5C";      // deep navy from the letterhead bars
const SKY = "#8FD3F4";       // light sky stripe accent
const INK = "#14222E";
const PAPER = "#FFFFFF";
const MIST = "#EEF6FC";      // alternate band
const LINE = "#D6E6F2";

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
const LOGO = asset("amk-logo-v2.png");       // vector export of the letterhead lockup (clients/AMK Cleaning QA/logo.svg)
const FAVICON_URL = asset("favicon.png"); // emblem

// Pexels (free for commercial use), stand-ins until the client sends photos.
const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const IMG = {
  team: px(6195121, 2000),
  teamRoom: px(6195125),
  teamWalk: px(6196677),
  officeVac: px(6196693),
  officeTable: px(6196682),
  wipeTable: px(6195109),
  mopBucket: px(6195118),
  hotelBed: px(29006838),
  hotelPair: px(9462333),
  hotelSheet: px(9462341),
  stove: px(9462314),
  oven: px(9462315),
  ovenRack: px(9462329),
  deepVac: px(6196681),
  deepWipe: px(6196687),
  sofaVac: px(4401536),
  pillowVac: px(4401537),
};

// ─── Services ───────────────────────────────────────────────────────────────
const SERVICES = [
  {
    slug: "office-cleaning", icon: "Building2", title: "Office Cleaning", img: IMG.officeVac,
    short: "Daily, weekly or one-off cleaning that keeps your workplace spotless.",
    intro: "A clean office is a better place to work and a better place to welcome clients. We clean offices, showrooms and commercial spaces across Doha on a schedule that suits your business, including after hours.",
    includes: [
      ["Monitor", "Workstations & desks", "Desks, screens, phones and keyboards wiped and sanitised."],
      ["Sparkles", "Floors & carpets", "Vacuuming, mopping and spot cleaning of carpets and hard floors."],
      ["Bath", "Washrooms", "Toilets, basins, mirrors and fittings cleaned and restocked."],
      ["Coffee", "Pantry & kitchenette", "Counters, sinks, fridges and microwaves cleaned."],
      ["DoorOpen", "Reception & meeting rooms", "Glass, tables and seating kept ready for visitors."],
      ["Trash2", "Waste removal", "Bins emptied and liners replaced every visit."],
    ],
    tags: ["Daily contracts", "Weekly visits", "After-hours cleaning", "Showrooms", "Clinics", "Co-working spaces", "Move-in / move-out"],
    steps: [
      ["Site visit", "We visit your office and note the areas, the traffic and your working hours."],
      ["Clear quote", "You get a fixed price and a cleaning checklist for your space."],
      ["Regular team", "The same trained team cleans on your schedule."],
      ["Quality checks", "Supervisors check the work and you have one contact for any request."],
    ],
    faq: [
      ["Can you clean outside office hours?", "Yes. Early morning, evening and weekend cleaning are available so your team is never disturbed."],
      ["Do you bring your own equipment and materials?", "Yes. Our teams arrive with professional equipment and cleaning materials."],
      ["Do you offer monthly contracts?", "Yes. Daily, weekly and monthly contracts are available with a fixed monthly price."],
    ],
    gallery: [IMG.officeVac, IMG.officeTable, IMG.wipeTable],
  },
  {
    slug: "hotel-cleaning", icon: "Hotel", title: "Hotel Cleaning", img: IMG.hotelBed,
    short: "Housekeeping support for hotels, serviced apartments and guest houses.",
    intro: "Guests judge a hotel by its rooms. We provide trained housekeeping staff and cleaning teams for hotels, hotel apartments and guest houses in Qatar, for daily operations or peak seasons.",
    includes: [
      ["BedDouble", "Guest rooms", "Bed making, linen change, dusting and room turnaround."],
      ["Bath", "Bathrooms", "Full bathroom cleaning and amenity replenishment."],
      ["Sofa", "Lobbies & corridors", "Public areas kept clean and presentable all day."],
      ["UtensilsCrossed", "Restaurants & banquet halls", "Before and after service cleaning."],
      ["Waves", "Pool & gym areas", "Changing rooms, decks and equipment wiped down."],
      ["Users", "Housekeeping manpower", "Supplied staff for daily or seasonal needs."],
    ],
    tags: ["Hotels", "Hotel apartments", "Guest houses", "Serviced residences", "Peak-season staffing", "Event turnarounds"],
    steps: [
      ["Tell us your needs", "Number of rooms, areas and the hours you need covered."],
      ["Staffing plan", "We propose the team size and schedule."],
      ["Trained housekeepers", "Uniformed staff follow your hotel's standards."],
      ["Ongoing supervision", "We monitor quality and adjust staff as occupancy changes."],
    ],
    faq: [
      ["Can you provide staff only for busy periods?", "Yes. We supply housekeeping staff for peak seasons, events and short-term needs."],
      ["Will your staff follow our hotel procedures?", "Yes. Our team follows your room standards and checklists."],
      ["Do you clean banquet halls after events?", "Yes. We clean halls and restaurants before and after events, including late nights."],
    ],
    gallery: [IMG.hotelBed, IMG.hotelPair, IMG.hotelSheet],
  },
  {
    slug: "house-cleaning", icon: "Home", title: "House Cleaning", img: IMG.teamRoom,
    short: "Regular or one-time cleaning for villas and apartments.",
    intro: "Come home to a clean house without spending your weekend on it. We clean villas and apartments across Doha, weekly, monthly or whenever you need us.",
    includes: [
      ["Sofa", "Living & dining areas", "Dusting, vacuuming, mopping and surfaces wiped."],
      ["BedDouble", "Bedrooms", "Beds tidied, wardrobes dusted, floors cleaned."],
      ["Bath", "Bathrooms", "Toilets, showers, tiles and mirrors cleaned and disinfected."],
      ["CookingPot", "Kitchen", "Counters, sink, cabinet fronts and appliances wiped."],
      ["AppWindow", "Windows & glass", "Inside glass, frames and sliding doors."],
      ["Wind", "Balconies", "Balcony floors, railings and furniture cleaned."],
    ],
    tags: ["Villas", "Apartments", "Weekly cleaning", "One-time cleaning", "Move-in / move-out", "Before guests arrive"],
    steps: [
      ["Message us", "Send your area, home size and preferred day on WhatsApp."],
      ["Get a price", "We confirm the price and the time."],
      ["We clean", "Our team arrives with everything needed."],
    ],
    faq: [
      ["Do I need to be home during the cleaning?", "No. Many clients leave a key or access code. Tell us what works for you."],
      ["Can I book a regular weekly clean?", "Yes. Weekly and monthly plans are available with the same team each time."],
      ["Which areas of Doha do you cover?", "We cover Doha and nearby areas. Send your location on WhatsApp and we confirm."],
    ],
    gallery: [IMG.teamRoom, IMG.mopBucket, IMG.wipeTable],
  },
  {
    slug: "kitchen-cleaning", icon: "CookingPot", title: "Kitchen Cleaning", img: IMG.stove,
    short: "Grease, stains and buildup removed from home and commercial kitchens.",
    intro: "Kitchens collect grease fast. We deep clean home kitchens, restaurant kitchens and staff pantries, from the hob and oven to the cabinets and the floor.",
    includes: [
      ["Flame", "Stoves & hobs", "Burners, grates and surfaces degreased."],
      ["Microwave", "Ovens & microwaves", "Inside and out, racks and trays included."],
      ["Wind", "Exhaust hoods", "Hood surfaces and filters degreased."],
      ["Refrigerator", "Fridges & freezers", "Emptied, cleaned and sanitised on request."],
      ["Archive", "Cabinets & shelves", "Inside and outside cabinet cleaning."],
      ["Droplets", "Sinks, tiles & floors", "Grout, splashbacks and floors scrubbed."],
    ],
    tags: ["Home kitchens", "Restaurant kitchens", "Cafes", "Staff pantries", "Grease removal", "Food-safe products"],
    steps: [
      ["Send photos", "Share a few photos of the kitchen on WhatsApp."],
      ["Get a quote", "We price the job based on size and condition."],
      ["Deep clean", "Our team degreases and cleans every surface."],
    ],
    faq: [
      ["Do you clean restaurant kitchens after closing?", "Yes. We schedule commercial kitchen cleaning after service so you never lose trading hours."],
      ["Are your products safe for food areas?", "We use cleaning products suitable for food preparation areas."],
      ["How long does a kitchen deep clean take?", "Most home kitchens take a few hours. We give you a time estimate with the quote."],
    ],
    gallery: [IMG.stove, IMG.oven, IMG.ovenRack],
  },
  {
    slug: "deep-cleaning", icon: "Sparkles", title: "Deep Cleaning", img: IMG.deepVac,
    short: "Top-to-bottom cleaning for move-ins, move-outs and post-construction.",
    intro: "Deep cleaning reaches the places routine cleaning skips: behind appliances, inside cabinets, grout lines, vents and fittings. Ideal before moving in, after moving out, after renovation or once a season.",
    includes: [
      ["Layers", "Every room, every surface", "Walls spot-cleaned, skirting, doors and switches."],
      ["Bath", "Bathroom descaling", "Limescale, grout and fittings deep cleaned."],
      ["CookingPot", "Kitchen degreasing", "Appliances, cabinets inside and out."],
      ["AirVent", "Vents & fans", "AC grilles, exhaust fans and light fittings dusted."],
      ["HardHat", "Post-construction", "Dust, paint spots and debris removed after works."],
      ["Truck", "Move-in / move-out", "Empty properties cleaned ready for handover."],
    ],
    tags: ["Move-in cleaning", "Move-out cleaning", "After renovation", "Seasonal deep clean", "Villas", "Offices"],
    steps: [
      ["Share the details", "Property size, condition and your date on WhatsApp."],
      ["Fixed quote", "We confirm the price before we start."],
      ["Full team", "A larger team with deep-cleaning equipment."],
      ["Final walkthrough", "We check every room with you before we leave."],
    ],
    faq: [
      ["What is the difference between regular and deep cleaning?", "Regular cleaning maintains a clean home. Deep cleaning removes buildup in places that are not cleaned every week."],
      ["Do you clean after construction or renovation?", "Yes. Post-construction cleaning removes fine dust, paint marks and debris."],
      ["Can you clean an empty flat before handover?", "Yes. Move-out cleans are one of our most requested jobs."],
    ],
    gallery: [IMG.deepVac, IMG.deepWipe, IMG.mopBucket],
  },
  {
    slug: "furniture-cleaning", icon: "Sofa", title: "Furniture Cleaning", img: IMG.sofaVac,
    short: "Sofas, chairs, mattresses and carpets cleaned and refreshed.",
    intro: "Sofas, majlis seating, mattresses and carpets hold dust, stains and odours. We clean upholstery and soft furnishings at your home or office, leaving them fresh and hygienic.",
    includes: [
      ["Sofa", "Sofas & majlis seating", "Fabric and leather sofas, cushions and floor seating."],
      ["Armchair", "Chairs", "Dining chairs, office chairs and armchairs."],
      ["BedDouble", "Mattresses", "Dust mites, stains and odours treated."],
      ["Square", "Carpets & rugs", "Wall-to-wall carpets and loose rugs."],
      ["Blinds", "Curtains", "Curtain dusting and on-site refreshing."],
      ["Droplet", "Stain treatment", "Coffee, food and everyday spills treated."],
    ],
    tags: ["Sofas", "Majlis", "Mattresses", "Carpets", "Office chairs", "Leather care"],
    steps: [
      ["Send a photo", "Show us the furniture and any stains."],
      ["Get a price", "Priced per item or per seat."],
      ["Cleaned on site", "We clean at your place with professional machines."],
    ],
    faq: [
      ["Do you clean on site or take the furniture away?", "We clean on site at your home or office."],
      ["How long until the sofa is dry?", "Usually a few hours, depending on the fabric and ventilation."],
      ["Can every stain be removed?", "Most everyday stains lift well. Old or set stains may fade rather than disappear. We tell you honestly before we start."],
    ],
    gallery: [IMG.sofaVac, IMG.pillowVac, IMG.wipeTable],
  },
];
const svcUrl = (s) => `/services/${s.slug}`;
const w = (url, n) => url.replace(/w=\d+/, `w=${n}`);

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
  ["services", "Services", "/services"],
  ...SERVICES.map((s) => [`services/${s.slug}`, s.title, svcUrl(s), true]),
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
      sticky: true, transparent: false, style: "logo-center", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: BLUE, ctaVariant: "solid", logoHeight: 58, logoCaption: "",
      showCta: true, ctaLabel: "WhatsApp Us", ctaUrl: WA,
    },
  };
}

const POLISH = [
  ".amk-head{max-width:46rem;margin:0 auto 40px;text-align:center}",
  `.amk-eyebrow{font-size:.75rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${BLUE};margin-bottom:10px}`,
  `.amk-head h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.9rem,3.2vw,2.7rem);line-height:1.1;color:${INK}}`,
  ".amk-lede{margin-top:12px;color:#4A5B69;font-size:1.05rem;line-height:1.6}",
  "a,button{transition:background-color .2s,color .2s,border-color .2s,box-shadow .2s,transform .2s}",
].join("");

function floatingWhatsApp() {
  return {
    id: uid("wa"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      html: `<a class="amk-wa" href="${WA}" target="_blank" rel="noopener noreferrer" aria-label="Chat with AMK Cleaning on WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.737 5.469 2.027 7.773L0 32l8.473-2.004A15.934 15.934 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.257 13.257 0 01-6.749-1.839l-.484-.287-5.027 1.188 1.213-4.895-.316-.502A13.263 13.263 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.266-9.987c-.398-.199-2.353-1.161-2.718-1.294-.365-.133-.631-.199-.897.199-.266.398-1.031 1.294-1.264 1.56-.233.266-.465.299-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.055-1.983-2.357-2.216-2.755-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.199-.897-2.161-1.229-2.958-.324-.778-.653-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.062.498-.365.398-1.395 1.362-1.395 3.322s1.428 3.852 1.627 4.118c.199.266 2.81 4.291 6.81 6.022.952.411 1.695.657 2.274.841.955.304 1.824.261 2.511.158.766-.114 2.353-.962 2.685-1.891.332-.929.332-1.726.232-1.891-.099-.166-.365-.266-.763-.465z"/></svg></a>`,
      css: `.amk-wa{position:fixed;right:20px;bottom:20px;z-index:9990;width:56px;height:56px;border-radius:9999px;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease}.amk-wa:hover{transform:scale(1.06)}@media(max-width:640px){.amk-wa{right:14px;bottom:14px;width:52px;height:52px}}${POLISH}`,
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 1, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO, logoText: SITE_NAME, logoCaption: `CR No. ${CR} · Doha, Qatar`,
      tagline: "Office, hotel, house, kitchen, deep and furniture cleaning across Doha and Qatar.",
      style: "light", backgroundColor: MIST, accentColor: BLUE, textColor: "#3C4D5B",
      copyrightText: `© {year} ${SITE_NAME}. CR No. ${CR}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.map((s) => ({ id: uid("fl"), label: s.title, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Company", links: TOP_PAGES.map(([, label, url]) => ({ id: uid("fl"), label, url })) },
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: `WhatsApp ${WA_DISPLAY}`, url: WA },
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: EMAIL, url: `mailto:${EMAIL}` },
          { id: uid("fl"), label: "Doha, Qatar", url: "/contact" },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── home sections ──────────────────────────────────────────────────────────
function heroHome() {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: IMG.team, imageOverlay: NAVY, imageOverlayOpacity: 0.6 },
    data: {
      layout: "center", badge: "PROFESSIONAL CLEANING · DOHA, QATAR",
      title: "Spotless spaces, done right the first time.",
      subtitle: "Office · Hotel · House · Kitchen · Deep · Furniture",
      description: "Trained, uniformed teams with professional equipment, for homes, offices and hotels across Qatar. Get a quote on WhatsApp in minutes.",
      badgeBgColor: BLUE, badgeTextColor: "#ffffff",
      primaryButton: { label: "Get a Free Quote", url: WA, variant: "primary" },
      secondaryButton: { label: "Our Services", url: "/services", variant: "outline" },
      imageUrl: IMG.team,
      typography: { titleSize: "6xl", titleColor: "#ffffff", subtitleColor: SKY, descColor: "#E3EEF6" },
    },
  };
}

function stats(bg = NAVY) {
  return {
    ...BASE, id: uid("stats"), type: "stats", background: bgColor(bg),
    padding: { top: 44, right: 24, bottom: 44, left: 24 },
    data: {
      title: "", subtitle: "", columns: 4, style: "minimal",
      items: [
        ["6", "", "Cleaning services"],
        ["7", " days", "A week availability"],
        ["100", "%", "Uniformed, trained staff"],
        ["1", "", "WhatsApp chat to book"],
      ].map(([value, suffix, label]) => ({ id: uid("st"), value, suffix, label })),
      valueColor: SKY, labelColor: "#D5E4EF",
    },
  };
}

function serviceTiles(bg = PAPER) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "image-tiles",
    data: {
      title: "Our Cleaning Services", subtitle: "Six specialist services for homes, businesses and hotels in Qatar",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: SERVICES.map((s) => ({
        id: uid("sv"), title: s.title, description: s.short, icon: s.icon, iconType: "lucide",
        imageUrl: w(s.img, 900), linkLabel: "View service", link: svcUrl(s),
      })),
    },
  };
}

// Split band: who we clean for, custom so the three audiences read as one story.
function audiences(bg = MIST) {
  const cards = [
    ["For homes", "Villas and apartments, weekly or one-time, move-in and move-out.", IMG.wipeTable, "/services/house-cleaning"],
    ["For businesses", "Offices, showrooms, clinics and restaurant kitchens on contract.", IMG.deepWipe, "/services/office-cleaning"],
    ["For hotels", "Housekeeping teams for rooms, lobbies and banquet halls.", IMG.hotelSheet, "/services/hotel-cleaning"],
  ];
  return {
    ...BASE, id: uid("aud"), type: "custom_html", background: bgColor(bg),
    data: {
      html: `<div class="amk-aud-wrap">
  <div class="amk-head"><p class="amk-eyebrow">Who we clean for</p><h2>One cleaning partner for every kind of space.</h2><p class="amk-lede">Whether it is a two-bedroom flat or a hundred-room hotel, you get the same trained team and the same standard.</p></div>
  <div class="amk-aud">${cards.map(([t, d, img, url]) => `
    <a href="${url}" class="amk-a"><div class="amk-a-img"><img src="${w(img, 900)}" alt="${t}" loading="lazy"/></div><div class="amk-a-body"><strong>${t}</strong><p>${d}</p><span>Learn more →</span></div></a>`).join("")}
  </div>
</div>`,
      css: `.amk-aud-wrap{max-width:76rem;margin:0 auto}
.amk-aud{display:grid;gap:22px;grid-template-columns:repeat(3,1fr)}
.amk-a{background:#fff;border:1px solid ${LINE};border-radius:18px;overflow:hidden;text-decoration:none;color:${INK};display:flex;flex-direction:column}
.amk-a:hover{box-shadow:0 18px 40px -18px rgba(15,61,92,.35);transform:translateY(-3px)}
.amk-a-img{aspect-ratio:4/3;overflow:hidden}
.amk-a-img img{width:100%;height:100%;object-fit:cover}
.amk-a-body{padding:22px 22px 24px;border-top:4px solid ${BLUE}}
.amk-a strong{font-family:"Montserrat",sans-serif;font-size:1.3rem;font-weight:800}
.amk-a p{margin:8px 0 14px;color:#4A5B69;line-height:1.55}
.amk-a span{color:${BLUE};font-weight:700;font-size:.92rem}
@media(max-width:860px){.amk-aud{grid-template-columns:1fr}}`,
    },
  };
}

function whyUs(bg = PAPER) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "split-list",
    data: {
      title: "Why clients in Qatar choose AMK", subtitle: "Why AMK",
      description: "We are a registered Qatari cleaning company (CR No. 27134). Every job is done by our own trained team, supervised, and priced before we start.",
      layout: "split", columns: 2, style: "minimal", imageUrl: w(IMG.teamWalk, 1200),
      items: [
        ["ShieldCheck", "Trained & uniformed staff", "Our own team, trained on every service we offer."],
        ["SprayCan", "Professional equipment", "Industrial vacuums, scrubbers and proper cleaning products."],
        ["BadgeCheck", "Fixed, upfront pricing", "You know the price before we start. No surprises."],
        ["Clock", "Flexible scheduling", "Early mornings, evenings and weekends."],
      ].map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

function howItWorks(bg = MIST) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    templateVariant: "big-numbers",
    data: {
      title: "Book a clean in three steps", subtitle: "How it works", layout: "horizontal", style: "connected",
      items: [
        ["Message us", "Tell us the service, your location and your date on WhatsApp."],
        ["Get a fixed price", "We confirm the price and the time slot."],
        ["Relax, we clean", "Our team arrives on time with everything needed."],
      ].map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

const FAQ_HOME = [
  ["Which areas do you cover?", "Doha and the surrounding areas of Qatar. Send your location on WhatsApp and we confirm."],
  ["How do I get a price?", `Message us on WhatsApp at ${WA_DISPLAY} with the service and a few photos. We reply with a fixed price.`],
  ["Do you bring cleaning materials?", "Yes. Our team brings professional equipment and cleaning products."],
  ["Do you offer monthly contracts for offices and hotels?", "Yes. Daily, weekly and monthly contracts are available."],
];

function faq(items, bg = PAPER, variant = "two-column-grid", title = "Frequently Asked Questions") {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg),
    templateVariant: variant,
    data: {
      title, subtitle: "Still have a question? Message us on WhatsApp.", layout: "accordion", allowMultiple: false,
      items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })),
    },
  };
}

function cta(variant = "dark-split") {
  return {
    ...BASE, id: uid("cta"), type: "cta",
    background: bgColor(PAPER),
    templateVariant: variant,
    data: {
      title: "Ready for a cleaner home or workplace?",
      description: "Send us a message on WhatsApp and get a fixed quote, usually within minutes.",
      layout: "centered",
      primaryButton: { label: "WhatsApp Us", url: WA },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
    },
  };
}

function contactForm(bg = PAPER, service) {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: service ? `Get a quote for ${service}` : "Request a Free Quote",
      subtitle: "Tell us what you need and we will get back to you. For the fastest reply, use WhatsApp.",
      layout: "split",
      showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: PHONE_DISPLAY, email: EMAIL, address: ADDRESS, recipientEmail: EMAIL,
      fields: [
        { id: "f-name", label: "Full name", type: "text", required: true },
        { id: "f-phone", label: "Mobile / WhatsApp", type: "tel", required: true },
        { id: "f-svc", label: "Service", type: "select", required: false, options: [...SERVICES.map((s) => s.title), "Other"] },
        { id: "f-area", label: "Area / location", type: "text", required: false },
        { id: "f-msg", label: "Details", type: "textarea", required: false },
      ],
      submitLabel: "Request Quote", successMessage: "Thank you. We will contact you shortly. For a faster reply, message us on WhatsApp.",
    },
  };
}

// ─── inner page sections ────────────────────────────────────────────────────
function pageHero({ badge, title, description, img }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: NAVY, imageOverlayOpacity: 0.62 },
    data: {
      layout: "left", badge, title, subtitle: "", description, compact: true,
      badgeBgColor: BLUE, badgeTextColor: "#ffffff",
      primaryButton: { label: "Get a Quote", url: WA, variant: "primary" },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}`, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: "5xl", titleColor: "#ffffff", descColor: "#E3EEF6" },
    },
  };
}

function svcIncludes(s, bg = PAPER) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "icon-list-cards",
    data: {
      title: "What's included", subtitle: s.title, description: s.intro,
      layout: "grid", columns: 3, style: "cards",
      items: s.includes.map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

function svcTags(s, bg = MIST) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    padding: { top: 48, right: 24, bottom: 48, left: 24 },
    templateVariant: "pill-row",
    data: {
      title: "Ideal for", subtitle: "", columns: 4, iconSize: "sm",
      items: s.tags.map((label) => ({ id: uid("i"), icon: "Check", color: BLUE, label, description: "" })),
    },
  };
}

function svcSteps(s, bg = PAPER) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    templateVariant: s.steps.length > 3 ? "timeline-connected" : "arrow-flow",
    data: {
      title: "How it works", subtitle: s.title, layout: "horizontal", style: "connected",
      items: s.steps.map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

function svcGallery(s, bg = MIST) {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    templateVariant: "grid-clean",
    data: {
      title: "", subtitle: "", layout: "grid", columns: s.gallery.length, gap: "md", lightbox: true,
      images: s.gallery.map((url) => ({ id: uid("gi"), url: w(url, 1000), alt: s.title, caption: "" })),
    },
  };
}

function otherServices(current, bg = MIST) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "bordered-list",
    data: {
      title: "Other services", subtitle: "", layout: "list", columns: 2, cardStyle: "flat", source: "inline",
      items: SERVICES.filter((s) => s.slug !== current.slug).map((s) => ({
        id: uid("sv"), title: s.title, description: s.short, icon: s.icon, iconType: "lucide", linkLabel: "View", link: svcUrl(s),
      })),
    },
  };
}

function servicesDetail(bg = PAPER) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "alternating-media",
    data: {
      title: "What we clean", subtitle: "Pick a service to see the details", layout: "alternating", columns: 2, style: "minimal",
      items: SERVICES.map((s) => ({
        id: s.slug, title: s.title, icon: s.icon, imageUrl: w(s.img, 1200),
        description: `${s.intro} Includes: ${s.includes.map((x) => x[1]).join(" · ")}.`,
        link: svcUrl(s), linkLabel: "View details",
      })),
    },
  };
}

function aboutSplit(bg = PAPER) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "split-list",
    data: {
      title: "A Qatari cleaning company built on doing the job properly", subtitle: "About AMK",
      description: `AMK General Cleaning Services is a registered cleaning company in Doha, Qatar (CR No. ${CR}). We clean offices, hotels, homes, kitchens and furniture with our own trained teams, and we keep pricing simple: a fixed quote before we start.`,
      layout: "split", columns: 2, style: "minimal", imageUrl: w(IMG.teamRoom, 1200),
      items: [
        ["Users", "Our own team", "No casual labour. Trained, uniformed and supervised staff."],
        ["ClipboardCheck", "Checklists on every job", "Every service follows a written checklist."],
        ["Handshake", "Long-term clients", "Contracts for offices and hotels, plans for homes."],
        ["MapPin", "Across Qatar", "Based in Doha, serving the surrounding areas."],
      ].map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

function values(bg = MIST) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "numbered-columns",
    data: {
      title: "How we work", subtitle: "Our standards", layout: "grid", columns: 4, style: "minimal",
      items: [
        ["On time", "We arrive when we say we will."],
        ["Thorough", "We follow the checklist, every room, every time."],
        ["Respectful", "We treat your home and workplace with care."],
        ["Honest", "Clear prices and straight answers."],
      ].map(([title, description]) => ({ id: uid("f"), title, description })),
    },
  };
}

function contactCards(bg = MIST) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "colored-tiles",
    data: {
      title: "Reach Us", subtitle: "", columns: 4, iconSize: "md",
      items: [
        ["MessageCircle", "WhatsApp", WA_DISPLAY, WA],
        ["Phone", "Call", PHONE_DISPLAY, `tel:${PHONE}`],
        ["Mail", "Email", EMAIL, `mailto:${EMAIL}`],
        ["MapPin", "Location", "Doha, Qatar", MAP_EMBED.replace("&output=embed", "")],
      ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: BLUE, label, description, url })),
    },
  };
}

// ─── premium custom sections ────────────────────────────────────────────────
const CHECK = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const ARROW = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const ICO = {
  phone: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  wa: `<svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor"><path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2 7.8L0 32l8.5-2A16 16 0 1 0 16 0zm7.3 19.3c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1.2-3c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.4 3.9 1.6 4.1c.2.3 2.8 4.3 6.8 6 1 .4 1.7.7 2.3.8 1 .3 1.8.3 2.5.2.8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"/></svg>`,
};
const SVC_NUM = (i) => String(i + 1).padStart(2, "0");
const html = (id, markup, css, bg = PAPER, pad = ZERO) => ({
  ...BASE, id: uid(id), type: "custom_html", padding: pad, background: bgColor(bg), data: { html: markup, css },
});
const BTN_CSS = `.amk-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:700;font-size:.98rem;text-decoration:none;line-height:1}
.amk-btn-p{background:${BLUE};color:#fff;box-shadow:0 14px 30px -12px rgba(24,128,196,.7)}.amk-btn-p:hover{background:#1170AF;transform:translateY(-2px)}
.amk-btn-g{background:#fff;color:${NAVY};border:1.5px solid ${LINE}}.amk-btn-g:hover{border-color:${BLUE};color:${BLUE}}
.amk-btn-w{background:#fff;color:${NAVY}}.amk-btn-w:hover{transform:translateY(-2px)}
.amk-btn-o{border:1.5px solid rgba(255,255,255,.5);color:#fff}.amk-btn-o:hover{background:rgba(255,255,255,.1)}
.amk-wrap{max-width:78rem;margin:0 auto;padding:0 24px}`;

function topBar() {
  return {
    id: uid("top"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(NAVY),
    data: {
      html: `<div class="amk-top"><div class="amk-top-in">
  <div class="amk-top-l"><span>${ICO.pin} Doha, Qatar</span><span class="amk-hide">${ICO.clock} 7 days a week, 7am to 10pm</span><span class="amk-hide">CR No. ${CR}</span></div>
  <div class="amk-top-r"><a href="mailto:${EMAIL}" class="amk-hide">${ICO.mail} ${EMAIL}</a><a href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a><a href="${WA}" class="amk-top-wa">${ICO.wa} WhatsApp</a></div>
</div></div>`,
      css: `.amk-top{background:${NAVY};color:#CFE2F0;font-size:.82rem}
.amk-top-in{max-width:80rem;margin:0 auto;padding:9px 24px;display:flex;justify-content:space-between;gap:16px;align-items:center}
.amk-top-l,.amk-top-r{display:flex;gap:22px;align-items:center}
.amk-top span,.amk-top a{display:inline-flex;align-items:center;gap:7px;color:inherit;text-decoration:none;white-space:nowrap}
.amk-top a:hover{color:#fff}
.amk-top-wa{background:#25D366;color:#fff!important;padding:5px 12px;border-radius:999px;font-weight:700}
@media(max-width:900px){.amk-hide{display:none!important}.amk-top-in{padding:8px 16px}}`,
    },
  };
}

function heroPremium() {
  return html("hero", `<section class="amk-hero"><div class="amk-wrap amk-hero-g">
  <div class="amk-hero-copy">
    <span class="amk-pill"><i></i> Trusted cleaning company in Doha</span>
    <h1>Professional cleaning for homes, offices <em>and hotels</em> across Qatar.</h1>
    <p>Trained, uniformed teams with professional equipment, a checklist on every job and a fixed price before we start. Book in one WhatsApp message.</p>
    <div class="amk-hero-cta"><a class="amk-btn amk-btn-p" href="${WA}">${ICO.wa} Get a free quote</a><a class="amk-btn amk-btn-g" href="/services">Explore services ${ARROW}</a></div>
    <ul class="amk-hero-ticks">${["Fixed, upfront prices", "Materials included", "Same-week booking"].map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul>
  </div>
  <div class="amk-hero-art">
    <div class="amk-hero-main"><img src="${w(IMG.teamRoom, 1100)}" alt="AMK cleaning team at work"/></div>
    <div class="amk-hero-sub"><img src="${w(IMG.hotelPair, 600)}" alt="Hotel room made up by housekeeping"/></div>
    <div class="amk-float amk-float-a"><b>${ICO.shield}</b><div><strong>Fully trained staff</strong><span>Uniformed and supervised</span></div></div>
    <div class="amk-float amk-float-b"><strong>6</strong><span>specialist<br/>services</span></div>
  </div>
</div></section>`, `${BTN_CSS}
.amk-hero{background:radial-gradient(1200px 500px at 85% 0%,#DCEEFB 0%,transparent 60%),linear-gradient(180deg,#F5FAFE,#fff);padding:72px 0 96px;overflow:hidden}
.amk-hero-g{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
.amk-pill{display:inline-flex;align-items:center;gap:10px;background:#fff;border:1px solid ${LINE};color:${NAVY};font-weight:600;font-size:.85rem;padding:8px 16px;border-radius:999px;box-shadow:0 6px 20px -10px rgba(15,61,92,.25)}
.amk-pill i{width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.18)}
.amk-hero h1{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(2.3rem,4.6vw,3.9rem);line-height:1.06;letter-spacing:-.02em;color:${INK};margin:22px 0 20px}
.amk-hero h1 em{font-style:normal;background:linear-gradient(90deg,${BLUE},#35A9E6);-webkit-background-clip:text;background-clip:text;color:transparent}
.amk-hero p{font-size:1.12rem;line-height:1.7;color:#4A5B69;max-width:34rem}
.amk-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin:30px 0 26px}
.amk-hero-ticks{display:flex;flex-wrap:wrap;gap:10px 22px;list-style:none;padding:0;margin:0}
.amk-hero-ticks li{display:flex;align-items:center;gap:8px;font-weight:600;color:${NAVY};font-size:.95rem}
.amk-hero-ticks svg{color:#fff;background:${BLUE};border-radius:50%;padding:3px;width:20px;height:20px}
.amk-hero-art{position:relative;min-height:540px}
.amk-hero-main{position:absolute;right:0;top:0;width:82%;height:88%;border-radius:32px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(15,61,92,.45)}
.amk-hero-sub{position:absolute;left:0;bottom:0;width:44%;aspect-ratio:1;border-radius:24px;overflow:hidden;border:8px solid #fff;box-shadow:0 30px 60px -25px rgba(15,61,92,.45)}
.amk-hero-art img{width:100%;height:100%;object-fit:cover;display:block}
.amk-float{position:absolute;background:#fff;border-radius:18px;box-shadow:0 24px 50px -20px rgba(15,61,92,.4);display:flex;align-items:center;gap:12px;padding:14px 18px}
.amk-float-a{right:-8px;bottom:22%}.amk-float-a b{width:44px;height:44px;border-radius:12px;background:#E6F3FC;color:${BLUE};display:grid;place-items:center}
.amk-float strong{display:block;color:${INK};font-weight:800;font-size:.98rem}.amk-float span{color:#64748B;font-size:.82rem}
.amk-float-b{left:8%;top:10%;flex-direction:row;background:${NAVY}}.amk-float-b strong{color:${SKY};font-family:"Montserrat",sans-serif;font-size:2.2rem;line-height:1}.amk-float-b span{color:#CFE2F0;line-height:1.25}
@media(max-width:960px){.amk-hero-g{grid-template-columns:1fr;gap:40px}.amk-hero-art{min-height:420px}.amk-hero{padding:48px 0 64px}}
@media(max-width:520px){.amk-hero-art{min-height:340px}.amk-float-a{right:0;bottom:14%;padding:10px 14px}.amk-float-b{left:0;top:4%}}`);
}

function servicesPremium(bg = PAPER, title = "Cleaning services built around your space") {
  return html("svcp", `<section class="amk-sv"><div class="amk-wrap">
  <div class="amk-sv-head"><div><p class="amk-eyebrow">What we do</p><h2>${title}</h2></div><p class="amk-lede">Six specialist services, each with its own trained crew, checklist and equipment. Pick one to see exactly what is included.</p></div>
  <div class="amk-sv-g">${SERVICES.map((s, i) => `
    <a class="amk-sc" href="${svcUrl(s)}"><div class="amk-sc-img"><img src="${w(s.img, 800)}" alt="${s.title}" loading="lazy"/><span>${SVC_NUM(i)}</span></div>
    <div class="amk-sc-b"><h3>${s.title}</h3><p>${s.short}</p><em>View service ${ARROW}</em></div></a>`).join("")}
  </div>
</div></section>`, `.amk-sv{padding:96px 0}
.amk-sv-head{display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:end;margin-bottom:48px}
.amk-sv-head h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.9rem,3.2vw,2.8rem);line-height:1.1;color:${INK};letter-spacing:-.01em}
.amk-eyebrow{font-size:.75rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${BLUE};margin-bottom:12px}
.amk-lede{color:#4A5B69;font-size:1.05rem;line-height:1.65}
.amk-sv-g{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.amk-sc{display:flex;flex-direction:column;background:#fff;border:1px solid ${LINE};border-radius:22px;overflow:hidden;text-decoration:none;color:${INK}}
.amk-sc:hover{transform:translateY(-6px);box-shadow:0 30px 60px -28px rgba(15,61,92,.45);border-color:transparent}
.amk-sc-img{position:relative;aspect-ratio:16/11;overflow:hidden}
.amk-sc-img img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.amk-sc:hover .amk-sc-img img{transform:scale(1.06)}
.amk-sc-img span{position:absolute;left:18px;top:18px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);color:${NAVY};font-weight:800;font-family:"Montserrat",sans-serif;font-size:.85rem;padding:6px 12px;border-radius:999px}
.amk-sc-b{padding:24px 24px 26px;display:flex;flex-direction:column;gap:10px;flex:1}
.amk-sc h3{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.3rem}
.amk-sc p{color:#4A5B69;line-height:1.6;flex:1}
.amk-sc em{font-style:normal;color:${BLUE};font-weight:700;display:inline-flex;align-items:center;gap:8px}
@media(max-width:960px){.amk-sv-g{grid-template-columns:1fr 1fr}.amk-sv-head{grid-template-columns:1fr;gap:12px}}
@media(max-width:600px){.amk-sv-g{grid-template-columns:1fr}.amk-sv{padding:64px 0}}`, bg);
}

function statsBand() {
  const items = [["6", "Specialist services"], ["7", "Days a week"], ["100%", "Trained, uniformed staff"], ["1", "Message to book"]];
  return html("stats", `<section class="amk-st"><div class="amk-wrap amk-st-g">${items.map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join("")}</div></section>`,
    `.amk-st{background:linear-gradient(120deg,${NAVY},#145A86);padding:56px 0;position:relative;overflow:hidden}
.amk-st::after{content:"";position:absolute;right:-120px;top:-120px;width:380px;height:380px;border-radius:50%;background:rgba(143,211,244,.08)}
.amk-st-g{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative;z-index:1}
.amk-st-g div{border-left:1px solid rgba(255,255,255,.15);padding-left:24px}
.amk-st strong{display:block;font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(2.2rem,4vw,3.2rem);color:#fff;line-height:1}
.amk-st span{display:block;margin-top:10px;color:${SKY};font-weight:600;font-size:.95rem}
@media(max-width:760px){.amk-st-g{grid-template-columns:1fr 1fr;row-gap:32px}}`, NAVY);
}

function processPremium(steps, title = "From first message to spotless", bg = MIST) {
  return html("proc", `<section class="amk-pr"><div class="amk-wrap">
  <div class="amk-head"><p class="amk-eyebrow">How it works</p><h2>${title}</h2></div>
  <ol class="amk-pr-g" style="--n:${steps.length}">${steps.map(([t, d], i) => `<li><span>${SVC_NUM(i)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
</div></section>`, `.amk-pr{padding:96px 0}
.amk-pr-g{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--n),1fr);gap:22px;counter-reset:s;position:relative}
.amk-pr-g li{background:#fff;border-radius:22px;padding:30px 26px;border:1px solid ${LINE};position:relative}
.amk-pr-g span{display:inline-grid;place-items:center;width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,${BLUE},#35A9E6);color:#fff;font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.1rem;box-shadow:0 14px 28px -12px rgba(24,128,196,.7)}
.amk-pr-g h3{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.2rem;color:${INK};margin:20px 0 8px}
.amk-pr-g p{color:#4A5B69;line-height:1.6}
@media(max-width:860px){.amk-pr-g{grid-template-columns:1fr 1fr}}@media(max-width:560px){.amk-pr-g{grid-template-columns:1fr}.amk-pr{padding:64px 0}}`, bg);
}

function ctaPhoto(title = "Ready for a spotless home or workplace?", text = "Send us a message on WhatsApp with what you need. We reply with a fixed price, usually within minutes.") {
  return html("ctap", `<section class="amk-cp"><div class="amk-wrap"><div class="amk-cp-box">
  <img src="${w(IMG.teamWalk, 1600)}" alt="" aria-hidden="true"/>
  <div class="amk-cp-c"><h2>${title}</h2><p>${text}</p><div class="amk-hero-cta"><a class="amk-btn amk-btn-w" href="${WA}">${ICO.wa} WhatsApp ${WA_DISPLAY}</a><a class="amk-btn amk-btn-o" href="tel:${PHONE}">${ICO.phone} Call ${PHONE_DISPLAY}</a></div></div>
</div></div></section>`, `${BTN_CSS}
.amk-cp{padding:88px 0}
.amk-cp-box{position:relative;border-radius:32px;overflow:hidden;padding:72px 64px;min-height:340px;display:flex;align-items:center}
.amk-cp-box img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.amk-cp-box::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(15,61,92,.96) 0%,rgba(15,61,92,.85) 45%,rgba(24,128,196,.35) 100%)}
.amk-cp-c{position:relative;z-index:2;max-width:36rem}
.amk-cp h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.9rem,3.4vw,2.8rem);line-height:1.1;color:#fff}
.amk-cp p{color:#D5E6F2;font-size:1.08rem;line-height:1.6;margin-top:14px}
.amk-cp .amk-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
@media(max-width:700px){.amk-cp-box{padding:44px 26px}.amk-cp{padding:56px 0}}`);
}

function innerHero({ crumbs, title, description, img }) {
  return html("ihero", `<section class="amk-ih"><img src="${w(img, 1800)}" alt="" aria-hidden="true"/><div class="amk-wrap amk-ih-c">
  <nav class="amk-crumb"><a href="/">Home</a>${crumbs.map(([l, u]) => u ? ` <i>/</i> <a href="${u}">${l}</a>` : ` <i>/</i> <span>${l}</span>`).join("")}</nav>
  <h1>${title}</h1><p>${description}</p>
  <div class="amk-hero-cta"><a class="amk-btn amk-btn-p" href="${WA}">${ICO.wa} Get a free quote</a><a class="amk-btn amk-btn-o" href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a></div>
</div></section>`, `${BTN_CSS}
.amk-ih{position:relative;padding:110px 0 100px;overflow:hidden}
.amk-ih>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.amk-ih::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(15,61,92,.95) 0%,rgba(15,61,92,.8) 50%,rgba(15,61,92,.35) 100%)}
.amk-ih-c{position:relative;z-index:2}
.amk-crumb{font-size:.88rem;color:#A9CBE3;margin-bottom:18px}.amk-crumb a{color:#A9CBE3;text-decoration:none}.amk-crumb a:hover{color:#fff}.amk-crumb span{color:#fff;font-weight:600}.amk-crumb i{font-style:normal;margin:0 6px;opacity:.6}
.amk-ih h1{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(2.3rem,4.8vw,3.8rem);line-height:1.06;color:#fff;max-width:44rem;letter-spacing:-.02em}
.amk-ih p{color:#D5E6F2;font-size:1.12rem;line-height:1.6;max-width:38rem;margin-top:16px}
.amk-ih .amk-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
@media(max-width:700px){.amk-ih{padding:72px 0 64px}}`, NAVY);
}

function svcOverview(s) {
  return html("ovw", `<section class="amk-ov"><div class="amk-wrap amk-ov-g">
  <div><p class="amk-eyebrow">${s.title}</p><h2>${s.intro.split(". ")[0]}.</h2><p class="amk-lede">${s.intro.split(". ").slice(1).join(". ")}</p>
    <ul class="amk-ov-tags">${s.tags.map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul></div>
  <aside class="amk-ov-card"><img src="${w(s.gallery[1] || s.img, 900)}" alt="${s.title}"/><div><strong>Get a fixed quote</strong><p>Send a few photos and your location. We reply with a price, usually within minutes.</p><a class="amk-btn amk-btn-p" href="${waText(`Hello AMK Cleaning, I would like a quote for ${s.title}.`)}">${ICO.wa} Quote on WhatsApp</a></div></aside>
</div></section>`, `${BTN_CSS}.amk-ov{padding:96px 0}
.amk-ov-g{display:grid;grid-template-columns:1.25fr 1fr;gap:56px;align-items:start}
.amk-ov h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.7rem,2.8vw,2.4rem);line-height:1.15;color:${INK};margin-bottom:16px}
.amk-ov-tags{list-style:none;padding:0;margin:28px 0 0;display:flex;flex-wrap:wrap;gap:10px}
.amk-ov-tags li{display:flex;align-items:center;gap:8px;background:${MIST};color:${NAVY};font-weight:600;font-size:.92rem;padding:9px 14px;border-radius:999px}.amk-ov-tags svg{color:${BLUE}}
.amk-ov-card{background:#fff;border:1px solid ${LINE};border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -35px rgba(15,61,92,.45);position:sticky;top:110px}
.amk-ov-card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.amk-ov-card div{padding:24px}
.amk-ov-card strong{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.25rem;color:${INK}}.amk-ov-card p{color:#4A5B69;margin:8px 0 18px;line-height:1.55}
@media(max-width:900px){.amk-ov-g{grid-template-columns:1fr}.amk-ov-card{position:static}.amk-ov{padding:64px 0}}`);
}

function svcIncludesPremium(s, bg = MIST) {
  return html("inc", `<section class="amk-in"><div class="amk-wrap">
  <div class="amk-head"><p class="amk-eyebrow">What's included</p><h2>Every ${s.title.toLowerCase()} visit covers</h2></div>
  <div class="amk-in-g">${s.includes.map(([, t, d], i) => `<div><span>${SVC_NUM(i)}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `.amk-in{padding:96px 0}
.amk-in-g{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.amk-in-g div{background:#fff;border-radius:20px;padding:28px;border:1px solid ${LINE};transition:box-shadow .2s,transform .2s}
.amk-in-g div:hover{transform:translateY(-4px);box-shadow:0 24px 48px -28px rgba(15,61,92,.45)}
.amk-in-g span{font-family:"Montserrat",sans-serif;font-weight:800;color:${BLUE};font-size:.95rem;letter-spacing:.05em}
.amk-in-g h3{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.15rem;color:${INK};margin:10px 0 8px}
.amk-in-g p{color:#4A5B69;line-height:1.6}
@media(max-width:900px){.amk-in-g{grid-template-columns:1fr 1fr}}@media(max-width:560px){.amk-in-g{grid-template-columns:1fr}.amk-in{padding:64px 0}}`, bg);
}

function galleryStrip(s) {
  const g = s.gallery.slice(0, 3);
  return html("gal", `<section class="amk-gs"><div class="amk-wrap amk-gs-g">${g.map((u, i) => `<div class="amk-gs-${i}"><img src="${w(u, 1000)}" alt="${s.title}" loading="lazy"/></div>`).join("")}</div></section>`,
    `.amk-gs{padding:0 0 96px}
.amk-gs-g{display:grid;grid-template-columns:1.5fr 1fr;grid-template-rows:220px 220px;gap:16px}
.amk-gs-g div{border-radius:22px;overflow:hidden}.amk-gs-g img{width:100%;height:100%;object-fit:cover;display:block}
.amk-gs-0{grid-row:span 2}
@media(max-width:700px){.amk-gs-g{grid-template-columns:1fr;grid-template-rows:none;grid-auto-rows:220px}.amk-gs-0{grid-row:auto}.amk-gs{padding-bottom:64px}}`, MIST);
}

function whyPremium(bg = MIST, o = {}) {
  const pts = o.pts || [
    ["Trained & uniformed staff", "Our own team, trained on every service we offer and supervised on site."],
    ["Professional equipment", "Industrial vacuums, scrubbers and the right products for each surface."],
    ["Fixed, upfront pricing", "You get the price before we start. No surprises on the day."],
    ["Flexible scheduling", "Early mornings, evenings and weekends, so your day is never disrupted."],
  ];
  return html("why", `<section class="amk-why"><div class="amk-wrap amk-why-g">
  <div class="amk-why-img"><img src="${w(o.img || IMG.teamWalk, 1100)}" alt="AMK cleaning crew"/><div class="amk-why-badge"><strong>CR ${CR}</strong><span>Registered in Qatar</span></div></div>
  <div><p class="amk-eyebrow">${o.eyebrow || "Why AMK"}</p><h2>${o.title || "Why clients in Qatar choose AMK"}</h2><p class="amk-lede">${o.lede || "A registered Doha company with its own crews. Every job follows a written checklist and is checked before we leave."}</p>
    <ul>${pts.map(([t, d]) => `<li><b>${CHECK}</b><div><strong>${t}</strong><p>${d}</p></div></li>`).join("")}</ul></div>
</div></section>`, `.amk-why{padding:96px 0}
.amk-why-g{display:grid;grid-template-columns:1fr 1.05fr;gap:64px;align-items:center}
.amk-why-img{position:relative;border-radius:28px;overflow:visible}
.amk-why-img img{width:100%;aspect-ratio:4/4.4;object-fit:cover;border-radius:28px;display:block;box-shadow:0 40px 80px -40px rgba(15,61,92,.5)}
.amk-why-badge{position:absolute;right:-18px;bottom:36px;background:${BLUE};color:#fff;border-radius:18px;padding:16px 20px;box-shadow:0 20px 40px -18px rgba(24,128,196,.8)}
.amk-why-badge strong{display:block;font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.2rem}.amk-why-badge span{font-size:.85rem;color:#D8EEFB}
.amk-why h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.9rem,3.2vw,2.7rem);line-height:1.1;color:${INK};margin-bottom:14px}
.amk-why ul{list-style:none;padding:0;margin:30px 0 0;display:grid;gap:18px}
.amk-why li{display:flex;gap:16px;align-items:flex-start;background:#fff;border:1px solid ${LINE};border-radius:18px;padding:18px 20px}
.amk-why li b{flex:none;width:36px;height:36px;border-radius:10px;background:#E6F3FC;color:${BLUE};display:grid;place-items:center}
.amk-why li strong{font-family:"Montserrat",sans-serif;font-weight:800;color:${INK};font-size:1.05rem}.amk-why li p{color:#4A5B69;margin-top:4px;line-height:1.55}
@media(max-width:900px){.amk-why-g{grid-template-columns:1fr;gap:40px}.amk-why-badge{right:12px}.amk-why{padding:64px 0}}`, bg);
}

function otherPremium(cur, bg = PAPER) {
  const list = SERVICES.filter((x) => x.slug !== cur.slug);
  return html("oth", `<section class="amk-ot"><div class="amk-wrap">
  <div class="amk-ot-h"><h2>Other services</h2><a href="/services">All services ${ARROW}</a></div>
  <div class="amk-ot-g">${list.map((x) => `<a href="${svcUrl(x)}"><img src="${w(x.img, 600)}" alt="${x.title}" loading="lazy"/><span>${x.title}</span></a>`).join("")}</div>
</div></section>`, `.amk-ot{padding:88px 0 0}
.amk-ot-h{display:flex;justify-content:space-between;align-items:end;margin-bottom:24px}
.amk-ot-h h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.6rem,2.6vw,2.1rem);color:${INK}}
.amk-ot-h a{color:${BLUE};font-weight:700;text-decoration:none;display:inline-flex;gap:8px;align-items:center}
.amk-ot-g{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
.amk-ot-g a{position:relative;aspect-ratio:3/4;border-radius:20px;overflow:hidden;display:block}
.amk-ot-g img{width:100%;height:100%;object-fit:cover;transition:transform .7s}
.amk-ot-g a:hover img{transform:scale(1.06)}
.amk-ot-g a::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(15,61,92,.9),transparent 55%)}
.amk-ot-g span{position:absolute;left:16px;right:16px;bottom:16px;z-index:1;color:#fff;font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.02rem;line-height:1.2}
@media(max-width:900px){.amk-ot-g{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.amk-ot-g{grid-template-columns:1fr 1fr}.amk-ot{padding-top:56px}}`, bg);
}

// ─── pages ──────────────────────────────────────────────────────────────────
const BUILDERS = {
  home: () => [heroPremium(), statsBand(), servicesPremium(), whyPremium(MIST), audiences(PAPER), processPremium([
    ["Message us", "Tell us the service, your area and a preferred date on WhatsApp. Photos help."],
    ["Get a fixed price", "We confirm the price and the time slot before anything is booked."],
    ["We clean, you check", "Our uniformed team arrives on time and walks you through the finished job."],
  ]), faq(FAQ_HOME, PAPER, "minimal-lines"), ctaPhoto()],
  services: () => [
    innerHero({ crumbs: [["Services"]], title: "Cleaning services for every kind of space", description: "Office, hotel, house, kitchen, deep and furniture cleaning across Doha and Qatar.", img: IMG.teamWalk }),
    servicesPremium(PAPER, "Choose the service you need"),
    statsBand(),
    whyPremium(PAPER),
    ctaPhoto(),
  ],
  about: () => [
    innerHero({ crumbs: [["About"]], title: "Cleaning Qatar, one space at a time", description: `A registered cleaning company in Doha, CR No. ${CR}.`, img: IMG.teamRoom }),
    whyPremium(PAPER, {
      eyebrow: "About AMK", img: IMG.teamRoom,
      title: "A Qatari cleaning company built on doing the job properly",
      lede: `AMK General Cleaning Services is a registered cleaning company in Doha (CR No. ${CR}). We clean offices, hotels, homes, kitchens and furniture with our own trained teams, and we keep pricing simple: a fixed quote before we start.`,
      pts: [
        ["Our own team", "No casual labour. Trained, uniformed and supervised staff."],
        ["Checklists on every job", "Every service follows a written checklist, checked before we leave."],
        ["Long-term clients", "Contracts for offices and hotels, regular plans for homes."],
        ["Across Qatar", "Based in Doha, serving the surrounding areas."],
      ],
    }),
    statsBand(),
    values(MIST),
    ctaPhoto(),
  ],
  contact: () => [
    innerHero({ crumbs: [["Contact"]], title: "Get your free quote", description: `WhatsApp ${WA_DISPLAY}, call ${PHONE_DISPLAY} or send the form below.`, img: IMG.team }),
    contactCards(PAPER),
    contactForm(MIST),
  ],
};
for (const s of SERVICES) {
  BUILDERS[`services/${s.slug}`] = () => [
    innerHero({ crumbs: [["Services", "/services"], [s.title]], title: s.title, description: s.short, img: s.img }),
    svcOverview(s),
    svcIncludesPremium(s),
    galleryStrip(s),
    processPremium(s.steps, `How ${s.title.toLowerCase()} works`, PAPER),
    faq(s.faq, MIST, "minimal-lines", "Questions"),
    otherPremium(s),
    ctaPhoto(`Book ${s.title.toLowerCase()} today`),
  ];
}

const SEO = {
  home: ["Professional Cleaning Services in Doha, Qatar", "AMK General Cleaning Services: office, hotel, house, kitchen, deep and furniture cleaning in Doha, Qatar. Trained teams, fixed quotes on WhatsApp."],
  services: ["Cleaning Services in Qatar", "Office, hotel, house, kitchen, deep and furniture cleaning across Doha and Qatar by AMK General Cleaning Services."],
  about: ["About AMK General Cleaning Services", `Registered Qatari cleaning company (CR No. ${CR}) with trained, uniformed teams for homes, offices and hotels.`],
  contact: ["Contact AMK Cleaning", `WhatsApp ${WA_DISPLAY}, call ${PHONE_DISPLAY} or email ${EMAIL}. Doha, Qatar.`],
};
for (const s of SERVICES) SEO[`services/${s.slug}`] = [`${s.title} in Doha, Qatar`, `${s.short} ${s.intro}`.slice(0, 158)];

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
    tenant_id: id, label: "Main", phone: PHONE, whatsapp: WA_NUMBER, email: EMAIL,
    address: ADDRESS, is_primary: true, floating_whatsapp: false, sort_order: 0,
  });
  console.log("✓ tenant created", id, "demo until", expiresAt);
  return id;
}

async function uploadAssets(tenantId) {
  const dir = path.join(__dirname, "..", "clients", "AMK Cleaning QA", "site-assets");
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
    site_name: SITE_NAME, tagline: "Professional Cleaning Services in Doha, Qatar",
    logo_url: LOGO, logo_dark_url: LOGO, logo_type: "image", logo_alt: SITE_NAME, logo_width: 340,
    favicon_url: FAVICON_URL,
    primary_color: BLUE, secondary_color: NAVY,
    color_overrides: {
      primary: BLUE, primaryFg: "#ffffff", secondary: NAVY, accent: SKY, ring: BLUE,
      background: PAPER, foreground: INK, card: "#ffffff", muted: MIST, mutedFg: "#4A5B69",
      border: LINE, borderRadius: "0.75rem",
    },
    design_overrides: { headingFont: "Montserrat", bodyFont: "Inter", headingWeight: "800", roundness: "rounded", shadow: "soft" },
    global_header: [topBar(), header()], global_footer: [floatingWhatsApp(), footer()], global_prefooter: [],
    updated_at: now,
  }, { onConflict: "tenant_id" });
  console.log(idErr ? `✗ site_identity: ${idErr.message}` : "✓ site_identity");

  await sb.from("nav_menus").upsert(
    { tenant_id: tenantId, name: "Main Navigation", location: "header", items: navItems(), updated_at: now },
    { onConflict: "tenant_id,location" },
  );
  const { error: ssErr } = await sb.from("site_settings").upsert({
    tenant_id: tenantId, site_name: SITE_NAME, site_description: SEO.home[1],
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Qatar", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
