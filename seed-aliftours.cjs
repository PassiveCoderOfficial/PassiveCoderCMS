/**
 * Alif Tours & Cargo — UAE group based in Sanaiya, Al Ain. Air cargo from the
 * UAE to Bangladesh, plus a travel desk: Umrah packages, air tickets, visit
 * visas, holiday packages, hotel reservations, travel insurance and airport
 * transfers. The group also trades building materials and manufactures gypsum
 * design panels (About page only).
 * Pro-plan demo at aliftours.passivecoder.com. English, navy + signal red from
 * the client's "Alif Air Cargo" logo. All photos are Pexels stand-ins; no
 * prices on the site — enquiries go to WhatsApp. Safe to re-run.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "aliftours";
const PLAN = "pro";
const TEMPLATE_SLUG = "travel-adventure"; // empty custom_css, so our palette wins
const DEMO_HOURS = 24 * 7;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Alif Tours & Cargo";
const PHONE = "+971503202626";
const PHONE_DISPLAY = "+971 50 320 2626";
const WA_NUMBER = "971503202626";
const ADDRESS = "3 Street 14/2, Sanaiya, Al Ain, United Arab Emirates";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Sanaiya+Al+Ain+United+Arab+Emirates";
const MAP_EMBED = "https://www.google.com/maps?q=Sanaiya%2C%20Al%20Ain%2C%20United%20Arab%20Emirates&z=14&output=embed";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hello Alif Tours & Cargo, I would like to ask about your services.");
const WA_CARGO = waText("Hello Alif Tours & Cargo, I want to send cargo to Bangladesh.");

const NAVY = "#0E2A5C";      // logo navy, primary
const NAVY_DEEP = "#081A3D";
const RED = "#D7262E";       // logo red, accent
const INK = "#121A2B";
const MIST = "#F5F7FB";      // page background
const SKY = "#E8EEF7";       // alternate band
const LINE = "#D5DDEA";

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
// Built from the client's logo by clients/Alif Tour & Cargo UAE/build-logo.cjs.
const LOGO_ON_LIGHT = asset("logo-dark-text.png");
const LOGO_ON_DARK = asset("logo-light-text.png");
const FAVICON_URL = asset("favicon.png");

// Pexels (free for commercial use), stand-ins until the client sends photos.
const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const IMG = {
  kaaba: px(35315919, 2000),
  kaabaClose: px(2895295),
  madinah: px(35017416),
  madinahDome: px(19179470),
  boxes: px(5025503),
  warehouse: px(4487361),
  packing: px(31043129),
  wing: px(12916439, 2000),
  wing2: px(112116),
  tickets: px(7310015),
  passport: px(4922080),
  dubai: px(33687795),
  dubaiWide: px(17865557),
  hotel: px(34672504),
  hotel2: px(5883728),
  maldives: px(28843924),
  beach: px(30920614),
  jetty: px(1320686),
  bricks: px(32913784),
  gypsum: px(5493670),
  plaster: px(6474130),
};

// ─── Services ───────────────────────────────────────────────────────────────
// From the client's description and shop banner. Cargo is the flagship; the
// rest are the travel desk. Each gets its own page under /services/.
const SERVICES = [
  {
    slug: "cargo-to-bangladesh", icon: "Package", title: "Cargo to Bangladesh", img: IMG.warehouse, desk: "cargo",
    short: "Send boxes home from the UAE to Bangladesh, packed, tracked and handled with care.",
    intro: "Our main service for over a decade. Bring your boxes to our Al Ain office or ask us about collection, and we send them to your family in Bangladesh.",
    includes: [
      ["Shirt", "Clothes & textiles", "Clothes, sarees, blankets and fabric for the family."],
      ["Smartphone", "Electronics", "Phones, TVs, laptops and small appliances, packed safely."],
      ["Gift", "Gifts & cosmetics", "Perfumes, cosmetics, chocolates and Eid gifts."],
      ["Package", "Household goods", "Kitchenware, utensils and everyday household items."],
      ["Wrench", "Tools & spare parts", "Hand tools, parts and work equipment."],
      ["Boxes", "Personal & bulk boxes", "From a single carton to a full load for a business."],
    ],
    tags: ["Air cargo", "Personal boxes", "Business shipments", "Packing help", "Tracking updates", "Delivery to the family"],
    steps: [
      ["Message us", "Tell us what you are sending, roughly how many boxes and the destination district."],
      ["Pack & weigh", "Bring the boxes to our Al Ain office, or ask about collection. We check, pack and weigh them."],
      ["We ship", "Your cargo goes out on the next shipment with a receipt for your records."],
      ["Delivered home", "We keep you updated until the boxes reach your family in Bangladesh."],
    ],
    faq: [
      ["How is the cargo price calculated?", "By weight and the type of goods. Send us the details on WhatsApp and we give you the rate before you pack."],
      ["Which areas in Bangladesh do you deliver to?", "Tell us the district and we confirm delivery and the time it takes."],
      ["Are there items you cannot send?", "Yes. Liquids, batteries on their own, and restricted or dangerous goods cannot go. Ask us first if you are not sure."],
      ["Can you help me pack?", "Yes. We have cartons and tape at the office and pack fragile items properly."],
    ],
    gallery: [IMG.warehouse, IMG.packing, IMG.boxes],
  },
  {
    slug: "umrah-packages", icon: "Moon", title: "Umrah Packages", img: IMG.kaaba, desk: "travel",
    short: "Complete Umrah packages from the UAE with visa, flights, hotels and transport arranged.",
    intro: "Perform Umrah with everything taken care of. We arrange the visa, the travel, hotels in Makkah and Madinah, and transport between them, so you can focus on your worship.",
    includes: [
      ["FileCheck", "Umrah visa", "Visa processing handled by our team."],
      ["Plane", "Flights or bus", "Travel by air or road from the UAE, depending on the package."],
      ["Hotel", "Hotels in Makkah & Madinah", "Stays at a range of distances from the Haram."],
      ["Bus", "Ground transport", "Transfers between airports, hotels and both holy cities."],
      ["Users", "Family & group packages", "Packages for individuals, couples, families and groups."],
      ["Calendar", "Ramadan & seasonal", "Special departures for Ramadan and school holidays."],
    ],
    tags: ["Economy packages", "Premium packages", "Ramadan Umrah", "Family groups", "First-time pilgrims", "Visa only on request"],
    steps: [
      ["Choose your dates", "Tell us when you want to travel and how many people are going."],
      ["Pick a package", "We send the package options with hotels and price."],
      ["Documents & visa", "Share your passport and photos. We process the visa."],
      ["Travel with peace", "Receive your tickets, hotel details and transport plan before you leave."],
    ],
    faq: [
      ["Which documents do I need for Umrah?", "A passport valid for at least six months, a photo and a valid UAE residence visa. We confirm the full list when you book."],
      ["Can you arrange Umrah for my family coming from Bangladesh?", "Ask us. We can advise on the options for relatives travelling from Bangladesh."],
      ["How far are the hotels from the Haram?", "It depends on the package. Each package lists its hotels so you can choose."],
    ],
    gallery: [IMG.kaaba, IMG.kaabaClose, IMG.madinah],
  },
  {
    slug: "air-tickets", icon: "Plane", title: "Air Tickets", img: IMG.wing, desk: "travel",
    short: "Flights to Bangladesh and worldwide at good fares, booked by people who answer the phone.",
    intro: "Going home for Eid, flying family over, or travelling for work? Tell us the route and dates and we find you a fair fare on a reliable airline.",
    includes: [
      ["Plane", "UAE to Bangladesh", "Dhaka, Chattogram and Sylhet, one-way and return."],
      ["Globe", "Worldwide flights", "Tickets to any destination your trip needs."],
      ["Repeat", "Changes & reissues", "Help changing dates or reissuing your ticket."],
      ["Users", "Group bookings", "Fares for families, workers and groups travelling together."],
    ],
    tags: ["Dhaka", "Chattogram", "Sylhet", "Saudi Arabia", "One-way", "Return", "Group fares"],
    steps: [
      ["Send route & dates", "WhatsApp us where you are flying and when."],
      ["Get fare options", "We send the best options we can find."],
      ["Ticket issued", "Confirm and receive your e-ticket."],
    ],
    faq: [
      ["Can you find cheap tickets to Bangladesh before Eid?", "Book as early as you can. Fares rise close to Eid, and we watch for the best options for your dates."],
      ["Can you change my existing ticket?", "Send us the ticket details and we check what the airline allows."],
      ["How do I pay?", "Ask us when you book and we explain the payment options."],
    ],
    gallery: [IMG.wing, IMG.wing2, IMG.tickets],
  },
  {
    slug: "visa-services", icon: "FileCheck", title: "Visit Visa & Visa Services", img: IMG.passport, desk: "travel",
    short: "UAE visit visas for your family and help with visa applications for other countries.",
    intro: "Bring your family to visit the UAE, or get help with the paperwork for travel abroad. We guide you on the documents and handle the application.",
    includes: [
      ["Home", "UAE visit visa", "Visit visas for parents, spouses, children and relatives."],
      ["Globe", "Tourist visas abroad", "Help applying for visas to other countries."],
      ["RefreshCw", "Visa extension & change", "Guidance on extending or changing visa status."],
      ["FileText", "Document guidance", "A clear checklist of what you need before you apply."],
    ],
    tags: ["Family visit", "Tourist visa", "Umrah visa", "Extensions", "Document checklist"],
    steps: [
      ["Tell us who is travelling", "Share the traveller's nationality and the visa you need."],
      ["Send documents", "We send a checklist. You send passport copies and photos."],
      ["We apply", "We submit the application and keep you updated."],
    ],
    faq: [
      ["How long does a UAE visit visa take?", "Processing times vary. We give you the current timeline when you apply."],
      ["Can you guarantee approval?", "No one can guarantee a visa decision, but we make sure the application is complete and correct."],
    ],
    gallery: [IMG.passport, IMG.tickets, IMG.dubaiWide],
  },
  {
    slug: "holiday-packages", icon: "Palmtree", title: "Holiday Packages", img: IMG.maldives, desk: "travel",
    short: "Ready-made and custom holidays with flights, hotels and tours arranged in one package.",
    intro: "Take a proper holiday without planning every detail. Pick a destination and budget, and we put together flights, hotel, transfers and tours.",
    includes: [
      ["Palmtree", "Beach holidays", "Maldives, Thailand and other island escapes."],
      ["Mountain", "Bangladesh tours", "Cox's Bazar, Sylhet tea gardens and more."],
      ["Building2", "City breaks", "Short trips to the region's favourite cities."],
      ["Heart", "Honeymoons & families", "Packages planned around couples or children."],
    ],
    tags: ["Maldives", "Thailand", "Malaysia", "Turkey", "Cox's Bazar", "Custom trips"],
    steps: [
      ["Share your idea", "Destination, dates, number of people and budget."],
      ["Get a plan", "We send a package with flights, hotel and what is included."],
      ["Book & go", "Confirm and receive all your travel documents."],
    ],
    faq: [
      ["Can you plan a custom trip?", "Yes. Tell us what you want and we build the package around it."],
      ["Do packages include visas?", "Where needed, we can include the visa application in the package."],
    ],
    gallery: [IMG.maldives, IMG.beach, IMG.jetty],
  },
  {
    slug: "hotel-reservations", icon: "Hotel", title: "Hotel Reservations", img: IMG.hotel, desk: "travel",
    short: "Hotel bookings worldwide, from budget stays to Haram-view rooms.",
    intro: "Need a room for a trip, an Umrah or a visiting family member? We book hotels to match your budget and location.",
    includes: [
      ["Hotel", "Worldwide hotels", "Rooms in any city you are travelling to."],
      ["Moon", "Makkah & Madinah", "Hotels near the Haram for Umrah trips."],
      ["Building2", "UAE stays", "Rooms for visiting family and short stays in the UAE."],
      ["FileText", "Booking confirmation", "Confirmations ready for visa applications."],
    ],
    tags: ["Budget", "Mid-range", "Luxury", "Near Haram", "Visa confirmations"],
    steps: [
      ["Send city & dates", "Tell us where, when and how many guests."],
      ["Pick a hotel", "Choose from the options we send."],
      ["Confirmed", "Receive your booking confirmation."],
    ],
    faq: [
      ["Can I get a hotel booking for my visa application?", "Yes. Ask us for a confirmed booking for your application."],
    ],
    gallery: [IMG.hotel, IMG.hotel2, IMG.dubai],
  },
  {
    slug: "travel-insurance", icon: "ShieldCheck", title: "Travel Insurance", img: IMG.tickets, desk: "travel",
    short: "Travel insurance for trips abroad and for visa applications that require it.",
    intro: "Travel with cover for medical emergencies, delays and lost baggage. We arrange travel insurance for your trip or for a visa that needs it.",
    includes: [
      ["HeartPulse", "Medical cover", "Cover for medical emergencies while abroad."],
      ["Luggage", "Baggage & delays", "Cover for lost baggage and travel delays."],
      ["FileCheck", "Visa-ready policies", "Policies that meet visa application requirements."],
      ["Users", "Family & group cover", "One policy for everyone on the trip."],
    ],
    tags: ["Single trip", "Family cover", "Visa requirement", "Umrah trips"],
    steps: [
      ["Share trip details", "Destination, dates and travellers."],
      ["Choose cover", "We send the policy options."],
      ["Policy issued", "Receive your policy document."],
    ],
    faq: [
      ["Do I need travel insurance for a visa?", "Some countries require it. Tell us the destination and we confirm."],
    ],
    gallery: [IMG.tickets, IMG.passport, IMG.wing2],
  },
  {
    slug: "airport-transfers", icon: "Car", title: "Airport Transfers", img: IMG.dubai, desk: "travel",
    short: "Pick-up and drop-off between the airport, home and hotel.",
    intro: "Start and end your trip without the stress. We arrange transfers to and from the airport for you, your family and your guests.",
    includes: [
      ["PlaneLanding", "Airport pick-up", "Someone waiting when your guests land."],
      ["PlaneTakeoff", "Airport drop-off", "On-time drop-off for your flight."],
      ["Bus", "Umrah transport", "Transfers between Jeddah, Makkah and Madinah."],
      ["Users", "Family & group vehicles", "Cars and vans for larger groups and luggage."],
    ],
    tags: ["Abu Dhabi", "Dubai", "Al Ain", "Jeddah", "Madinah", "Groups"],
    steps: [
      ["Send flight details", "Flight number, date and passenger count."],
      ["Confirmed", "We confirm the vehicle and the price."],
      ["On your way", "Driver meets you on time."],
    ],
    faq: [
      ["Can you pick up my family arriving from Bangladesh?", "Yes. Send the flight details and we arrange the pick-up."],
    ],
    gallery: [IMG.dubai, IMG.dubaiWide, IMG.madinahDome],
  },
];
const svcUrl = (s) => `/services/${s.slug}`;
const CARGO = SERVICES[0];
const TRAVEL = SERVICES.filter((s) => s.desk === "travel");

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 88, right: 24, bottom: 88, left: 24 },
  margin: ZERO,
  background: { type: "none" },
};
const bgColor = (color) => ({ type: "color", color });

// [slug, title, url, isServiceDetail]
const PAGES = [
  ["home", "Home", "/"],
  ["services", "Services", "/services"],
  ...SERVICES.map((s) => [`services/${s.slug}`, s.title, svcUrl(s), true]),
  ["about", "About", "/about"],
  ["contact", "Contact", "/contact"],
];

function navItems() {
  return [
    { id: "n0", label: "Home", url: "/", children: [] },
    { id: "n1", label: "Cargo", url: svcUrl(CARGO), children: [] },
    { id: "n2", label: "Travel", url: "/services", children: TRAVEL.map((s, k) => ({ id: `n2-${k}`, label: s.title, url: svcUrl(s), children: [] })) },
    { id: "n3", label: "About", url: "/about", children: [] },
    { id: "n4", label: "Contact", url: "/contact", children: [] },
  ];
}

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor("#ffffff"),
    templateVariant: "solid-with-cta",
    data: {
      logoText: SITE_NAME, logo: LOGO_ON_LIGHT, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: "#ffffff", textColor: INK, colorMode: "legacy", activeColor: RED, ctaVariant: "solid", logoHeight: 52, logoCaption: "",
      showCta: true, ctaLabel: "WhatsApp Us", ctaUrl: WA,
    },
  };
}

const POLISH = [
  ".al-head{max-width:46rem;margin:0 0 40px}",
  `.al-eyebrow{font-size:.75rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${RED};margin-bottom:10px}`,
  `.al-head h2{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:clamp(2rem,3.4vw,2.8rem);line-height:1.1;color:${INK}}`,
  ".al-lede{margin-top:12px;color:#4A5568;font-size:1.05rem;line-height:1.6}",
  "a,button{transition:background-color .2s,color .2s,border-color .2s,box-shadow .2s,transform .2s}",
].join("");

// Floating WhatsApp rides along with the global footer.
function floatingWhatsApp() {
  return {
    id: uid("wa"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      html: `<a class="al-wa" href="${WA}" target="_blank" rel="noopener noreferrer" aria-label="Chat with Alif Tours & Cargo on WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.737 5.469 2.027 7.773L0 32l8.473-2.004A15.934 15.934 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.257 13.257 0 01-6.749-1.839l-.484-.287-5.027 1.188 1.213-4.895-.316-.502A13.263 13.263 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.266-9.987c-.398-.199-2.353-1.161-2.718-1.294-.365-.133-.631-.199-.897.199-.266.398-1.031 1.294-1.264 1.56-.233.266-.465.299-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.055-1.983-2.357-2.216-2.755-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.199-.897-2.161-1.229-2.958-.324-.778-.653-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.062.498-.365.398-1.395 1.362-1.395 3.322s1.428 3.852 1.627 4.118c.199.266 2.81 4.291 6.81 6.022.952.411 1.695.657 2.274.841.955.304 1.824.261 2.511.158.766-.114 2.353-.962 2.685-1.891.332-.929.332-1.726.232-1.891-.099-.166-.365-.266-.763-.465z"/></svg></a>`,
      css: `.al-wa{position:fixed;right:20px;bottom:20px;z-index:9990;width:56px;height:56px;border-radius:9999px;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease}.al-wa:hover{transform:scale(1.06)}@media(max-width:640px){.al-wa{right:14px;bottom:14px;width:52px;height:52px}}${POLISH}`,
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 1, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_ON_DARK, logoText: SITE_NAME, logoCaption: "Sanaiya · Al Ain · UAE",
      tagline: "Cargo from the UAE to Bangladesh, Umrah packages, air tickets, visas and holidays. Over a decade of service from Al Ain.",
      style: "dark", backgroundColor: NAVY_DEEP, accentColor: RED, textColor: "#C3CEE3",
      copyrightText: `© {year} ${SITE_NAME}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Cargo", links: [
          { id: uid("fl"), label: "Cargo to Bangladesh", url: svcUrl(CARGO) },
          { id: uid("fl"), label: "Get a cargo rate", url: WA_CARGO },
        ]},
        { id: uid("fc"), heading: "Travel", links: TRAVEL.map((s) => ({ id: uid("fl"), label: s.title, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: "WhatsApp us", url: WA },
          { id: uid("fl"), label: "3 Street 14/2, Sanaiya, Al Ain", url: MAPS_URL },
          { id: uid("fl"), label: "About the group", url: "/about" },
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
    templateVariant: "dark-gradient-left",
    background: { type: "image", imageUrl: IMG.wing },
    data: {
      layout: "left", badge: "AL AIN · UAE TO BANGLADESH",
      title: "Your cargo home. Your journey, sorted.",
      subtitle: "Cargo to Bangladesh · Umrah · Air tickets · Visas · Holidays",
      description: "Send boxes to your family in Bangladesh, book Umrah, fly home for Eid or bring your family to visit. One trusted Al Ain office, over ten years in business.",
      badgeBgColor: RED, badgeTextColor: "#ffffff",
      primaryButton: { label: "Send Cargo", url: WA_CARGO, variant: "primary" },
      secondaryButton: { label: "Plan a Trip", url: "/services", variant: "outline", bgColor: "#ffffff", textColor: NAVY },
      imageUrl: IMG.wing, imageAlt: "Aircraft wing above the clouds",
      typography: { titleSize: "5xl", titleColor: NAVY, subtitleColor: RED, descColor: "#3B4658" },
    },
  };
}

function stats() {
  return {
    ...BASE, id: uid("stats"), type: "stats",
    padding: { top: 44, right: 24, bottom: 44, left: 24 },
    templateVariant: "navy-row",
    data: {
      title: "", subtitle: "", columns: 4,
      items: [
        ["10+", "Years in business"],
        ["UAE → BD", "Cargo route"],
        ["8", "Cargo & travel services"],
        ["1", "WhatsApp for everything"],
      ].map(([value, label]) => ({ id: uid("st"), value, label })),
    },
  };
}

// Two desks: cargo and travel, side by side. Custom so the split reads at a glance.
function twoDesks(bg = MIST) {
  const card = (eyebrow, title, text, points, img, url, label) => `
    <a href="${url}" class="al-desk">
      <div class="al-desk-img"><img src="${img.replace(/w=\d+/, "w=1100")}" alt="${title}" loading="lazy"/></div>
      <div class="al-desk-body">
        <p class="al-eyebrow">${eyebrow}</p>
        <h3>${title}</h3>
        <p>${text}</p>
        <ul>${points.map((p) => `<li>${p}</li>`).join("")}</ul>
        <span class="al-desk-btn">${label} →</span>
      </div>
    </a>`;
  return {
    ...BASE, id: uid("desks"), type: "custom_html", background: bgColor(bg),
    data: {
      html: `<div class="al-desks-wrap">
  <div class="al-head"><p class="al-eyebrow">Two desks, one office</p><h2>Cargo for your family. Travel for your plans.</h2><p class="al-lede">Most of our customers use both. Send a box home this month, book the Eid ticket next month, same people, same number.</p></div>
  <div class="al-desks">${card("Cargo desk", "Cargo to Bangladesh", CARGO.intro, ["Clothes, electronics, gifts & household goods", "Packing help at the office", "Updates until it reaches home"], IMG.packing, svcUrl(CARGO), "Cargo details")}
  ${card("Travel desk", "Umrah, tickets & visas", "Umrah packages, flights to Bangladesh and worldwide, UAE visit visas, holidays, hotels, insurance and airport transfers.", ["Umrah packages with visa & hotels", "Air tickets to Dhaka, Chattogram, Sylhet", "Visit visas for your family"], IMG.kaabaClose, "/services", "All travel services")}</div>
</div>`,
      css: `.al-desks-wrap{max-width:80rem;margin:0 auto}
.al-desks{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.al-desk{display:flex;flex-direction:column;background:#fff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;text-decoration:none;color:${INK};box-shadow:0 10px 30px rgba(14,42,92,.06)}
.al-desk:hover{box-shadow:0 18px 40px rgba(14,42,92,.14);transform:translateY(-3px)}
.al-desk-img{height:250px;overflow:hidden}.al-desk-img img{width:100%;height:100%;object-fit:cover;transition:transform .7s ease}.al-desk:hover .al-desk-img img{transform:scale(1.05)}
.al-desk-body{padding:28px 28px 30px;display:flex;flex-direction:column;gap:10px;flex:1}
.al-desk-body .al-eyebrow{margin:0}
.al-desk h3{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:1.65rem;color:${NAVY}}
.al-desk p{color:#4A5568;line-height:1.6}
.al-desk ul{list-style:none;padding:0;margin:4px 0 8px;display:flex;flex-direction:column;gap:8px}
.al-desk li{position:relative;padding-left:26px;font-weight:600;color:${INK}}
.al-desk li::before{content:"";position:absolute;left:0;top:.35em;width:14px;height:14px;border-radius:4px;background:${RED}}
.al-desk-btn{margin-top:auto;font-weight:800;color:${RED}}
@media(max-width:860px){.al-desks{grid-template-columns:1fr}.al-desk-img{height:200px}}`,
    },
  };
}

function travelServices(bg = "#ffffff") {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "numbered",
    data: {
      title: "The travel desk", subtitle: "Seven ways we get you where you need to be",
      layout: "grid", columns: 3, cardStyle: "flat", source: "inline",
      items: TRAVEL.map((s) => ({
        id: uid("sv"), title: s.title, description: s.short, icon: s.icon, iconType: "lucide", linkLabel: "Details", link: svcUrl(s),
      })),
    },
  };
}

function umrahBand() {
  return {
    ...BASE, id: uid("cta"), type: "cta",
    background: { type: "image", imageUrl: IMG.madinah, imageOverlay: NAVY_DEEP, imageOverlayOpacity: 0.7 },
    templateVariant: "navy-banner",
    data: {
      title: "Planning Umrah this season?",
      description: "Visa, travel, hotels in Makkah and Madinah, and transport between them. Ask for the current packages.",
      layout: "centered",
      primaryButton: { label: "Ask About Umrah", url: waText("Hello Alif Tours & Cargo, I want to ask about Umrah packages.") },
      secondaryButton: { label: "Package details", url: "/services/umrah-packages" },
    },
  };
}

function cargoSteps(bg = MIST) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    templateVariant: "vertical-line",
    data: {
      title: "Sending cargo home", subtitle: "How it works", layout: "vertical", style: "connected",
      items: CARGO.steps.map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

function whyUs(bg = "#ffffff", variant = "bento-grid") {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: variant,
    data: {
      title: "Why families in the UAE choose Alif", subtitle: "Over a decade of trust", layout: "grid", columns: 3, style: "cards",
      items: [
        ["Award", "10+ years in business", "We have built our customer base on quality and service, one box and one booking at a time."],
        ["MessageCircle", "Real people on WhatsApp", "Ask a question and get an answer from our team, in English, Bangla or Arabic."],
        ["BadgeCheck", "Clear prices first", "You know the cargo rate or the package price before you commit."],
        ["Layers", "Cargo and travel together", "Send boxes, book tickets and arrange visas with one trusted office."],
        ["MapPin", "Easy to find in Al Ain", "Our office is in Sanaiya, Al Ain. Walk in or message first."],
      ].map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

const FAQ_HOME = [
  ["How do I get a cargo rate?", "Message us on WhatsApp with what you are sending and the destination district. We reply with the rate."],
  ["Where is your office?", `${ADDRESS}. Message us before you come and we tell you the best time.`],
  ["Can you arrange Umrah from the UAE?", "Yes. We arrange packages with visa, travel, hotels and transport."],
  ["Can you get a visit visa for my parents?", "Yes. Tell us their nationality and we send the document checklist."],
  ["Do you book tickets to Bangladesh?", "Yes. Dhaka, Chattogram and Sylhet, plus worldwide flights."],
];

function faq(items, bg = MIST, variant = "split-heading", title = "Common Questions") {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg),
    templateVariant: variant,
    data: {
      title, subtitle: "Still unsure? Message us on WhatsApp.", layout: "accordion", allowMultiple: false,
      items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })),
    },
  };
}

function cta(variant = "orange-banner") {
  return {
    ...BASE, id: uid("cta"), type: "cta",
    background: bgColor(MIST),
    templateVariant: variant,
    data: {
      title: "Sending a box home or planning a trip?",
      description: `Message us on WhatsApp or call ${PHONE_DISPLAY}. We reply quickly with a rate or the options.`,
      layout: "centered",
      primaryButton: { label: "WhatsApp Us", url: WA },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
    },
  };
}

function contactForm(bg = MIST, service) {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: service ? `Ask about ${service}` : "Send Us an Enquiry",
      subtitle: "Tell us what you need and we will get back to you. For the fastest reply, use WhatsApp.",
      layout: "split",
      showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: PHONE_DISPLAY, email: "", address: ADDRESS, recipientEmail: "",
      fields: [
        { id: "f-name", label: "Full name", type: "text", required: true },
        { id: "f-phone", label: "Mobile / WhatsApp", type: "tel", required: true },
        { id: "f-need", label: "Service", type: "select", required: false, options: [...SERVICES.map((s) => s.title), "Building materials / Gypsum", "Other"] },
        { id: "f-date", label: "Travel or shipping date", type: "text", required: false },
        { id: "f-msg", label: "Details", type: "textarea", required: false },
      ],
      submitLabel: "Send Enquiry", successMessage: "Thank you. We will contact you shortly. For a faster reply, message us on WhatsApp.",
    },
  };
}

// ─── inner page sections ────────────────────────────────────────────────────
function pageHero({ badge, title, description, img, cargo }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: NAVY_DEEP, imageOverlayOpacity: 0.6 },
    data: {
      layout: "left", badge, title, subtitle: "", description, compact: true,
      badgeBgColor: RED, badgeTextColor: "#ffffff",
      primaryButton: { label: cargo ? "Get a Cargo Rate" : "WhatsApp Us", url: cargo ? WA_CARGO : WA, variant: "primary" },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}`, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: "5xl", titleColor: "#ffffff", descColor: "#D8E1F0" },
    },
  };
}

function svcIncludes(s, bg = MIST) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "highlight-cards",
    data: {
      title: s.desk === "cargo" ? "What you can send" : "What's included", subtitle: s.title, description: s.intro,
      layout: "grid", columns: s.includes.length === 4 ? 2 : 3, style: "cards",
      items: s.includes.map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

function svcTags(s, bg = "#ffffff") {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    padding: { top: 48, right: 24, bottom: 48, left: 24 },
    templateVariant: "pill-row",
    data: {
      title: s.desk === "cargo" ? "Good to know" : "Popular choices", subtitle: "", columns: 4, iconSize: "sm",
      items: s.tags.map((label) => ({ id: uid("i"), icon: "Check", color: RED, label, description: "" })),
    },
  };
}

function svcSteps(s, bg = MIST) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    templateVariant: s.steps.length > 3 ? "timeline-connected" : "numbered-cards",
    data: {
      title: "How it works", subtitle: s.title, layout: "horizontal", style: "connected",
      items: s.steps.map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

function svcGallery(s, bg = "#ffffff") {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    templateVariant: "hero-mosaic",
    data: {
      title: "", subtitle: "", layout: "grid", columns: 3, gap: "md", lightbox: true,
      images: s.gallery.map((url) => ({ id: uid("gi"), url: url.replace(/w=\d+/, "w=1200"), alt: s.title, caption: "" })),
    },
  };
}

function otherServices(current, bg = MIST) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "bordered-list",
    data: {
      title: "More from Alif Tours & Cargo", subtitle: "", layout: "list", columns: 2, cardStyle: "flat", source: "inline",
      items: SERVICES.filter((s) => s.slug !== current.slug).map((s) => ({
        id: uid("sv"), title: s.title, description: s.short, icon: s.icon, iconType: "lucide", linkLabel: "View", link: svcUrl(s),
      })),
    },
  };
}

function servicesDetail(bg = "#ffffff") {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "alternating-media",
    data: {
      title: "Cargo & travel services", subtitle: "Pick a service to see the details", layout: "alternating", columns: 2, style: "minimal",
      items: SERVICES.map((s) => ({
        id: s.slug, title: s.title, icon: s.icon, imageUrl: s.img.replace(/w=\d+/, "w=1200"),
        description: `${s.intro} Includes: ${s.includes.map((x) => x[1]).join(" · ")}.`,
        link: svcUrl(s), linkLabel: "View details",
      })),
    },
  };
}

function aboutSplit(bg = "#ffffff") {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "split-list",
    data: {
      title: "A group of businesses, built on service", subtitle: "About Alif Tours & Cargo",
      description: "We are a group operating multiple businesses across the United Arab Emirates. We specialise in cargo from the UAE to Bangladesh, and run a full travel desk for Umrah packages, air tickets and travel services. We have been in business for over a decade and have built a strong customer base through our commitment to quality and customer service.",
      layout: "split", columns: 2, style: "minimal", imageUrl: IMG.dubaiWide,
      items: [
        ["Package", "Cargo to Bangladesh", "Our specialty: boxes and shipments from the UAE to families in Bangladesh."],
        ["Plane", "Tours & travel", "Umrah packages, air tickets, visas, holidays, hotels and transfers."],
        ["Target", "Our mission", "To provide our customers with quality services and products that exceed their expectations."],
      ].map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

// The group's other businesses, About page only.
function groupBusinesses(bg = MIST) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "image-cards-dark",
    data: {
      title: "Also part of our group", subtitle: "Building materials and gypsum products",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: [
        ["Building Materials", "Supply of building materials for contractors, shops and home projects.", "BrickWall", IMG.bricks],
        ["Gypsum Design Panels", "We manufacture gypsum design panels for ceilings and walls.", "LayoutPanelTop", IMG.gypsum],
        ["Gypsum Products", "A range of gypsum products made in our own production.", "PaintRoller", IMG.plaster],
      ].map(([title, description, icon, img]) => ({
        id: uid("sv"), title, description, icon, iconType: "lucide", imageUrl: img.replace(/w=\d+/, "w=900"),
        linkLabel: "Enquire", link: waText(`Hello Alif group, I want to ask about ${title.toLowerCase()}.`),
      })),
    },
  };
}

function aboutTimeline(bg = "#ffffff") {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "numbered-features",
    data: {
      title: "What we stand for", subtitle: "", columns: 3, iconSize: "md",
      items: [
        ["Quality", "Every box packed properly and every booking checked."],
        ["Customer service", "Fast replies and honest answers, before and after you pay."],
        ["Long-term trust", "Most of our customers come back, and bring their friends."],
      ].map(([label, description]) => ({ id: uid("i"), icon: "Check", color: RED, label, description })),
    },
  };
}

function contactCards(bg = "#ffffff") {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "colored-tiles",
    data: {
      title: "Reach Us", subtitle: "", columns: 3, iconSize: "md",
      items: [
        ["MessageCircle", "WhatsApp", PHONE_DISPLAY, WA],
        ["Phone", "Call", PHONE_DISPLAY, `tel:${PHONE}`],
        ["MapPin", "Visit", "3 Street 14/2, Sanaiya, Al Ain", MAPS_URL],
      ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: NAVY, label, description, url })),
    },
  };
}

// ─── pages ──────────────────────────────────────────────────────────────────
const BUILDERS = {
  home: () => [heroHome(), stats(), twoDesks(), travelServices(), umrahBand(), cargoSteps(), whyUs(), faq(FAQ_HOME), cta()],
  services: () => [
    pageHero({ badge: "Our Services", title: "Cargo and travel, under one roof", description: "Cargo to Bangladesh, Umrah packages, air tickets, visas, holidays, hotels, insurance and airport transfers.", img: IMG.dubai }),
    servicesDetail(),
    whyUs(MIST, "icon-list-cards"),
    cta("navy-banner"),
  ],
  about: () => [
    pageHero({ badge: "About Us", title: "Over a decade of service from Al Ain", description: "A UAE group specialising in cargo to Bangladesh and travel services, with building materials and gypsum manufacturing alongside.", img: IMG.dubaiWide }),
    aboutSplit(),
    stats(),
    groupBusinesses(),
    aboutTimeline(),
    cta(),
  ],
  contact: () => [
    pageHero({ badge: "Contact", title: "Message, call or visit", description: `WhatsApp or call ${PHONE_DISPLAY}. ${ADDRESS}.`, img: IMG.wing2 }),
    contactCards(),
    contactForm(),
  ],
};
for (const s of SERVICES) {
  BUILDERS[`services/${s.slug}`] = () => [
    pageHero({ badge: s.desk === "cargo" ? "Cargo" : "Travel", title: s.title, description: s.short, img: s.img, cargo: s.desk === "cargo" }),
    svcIncludes(s),
    svcTags(s),
    svcSteps(s),
    svcGallery(s),
    faq(s.faq, MIST, "minimal-lines", "Questions"),
    otherServices(s, "#ffffff"),
    contactForm(MIST, s.title),
  ];
}

const SEO = {
  home: ["Cargo to Bangladesh, Umrah & Travel Services in Al Ain, UAE", "Alif Tours & Cargo in Al Ain: cargo from the UAE to Bangladesh, Umrah packages, air tickets, visit visas, holidays and hotel bookings. Over 10 years in business."],
  services: ["Cargo & Travel Services", "Cargo to Bangladesh, Umrah packages, air tickets, visa services, holiday packages, hotel reservations, travel insurance and airport transfers from Al Ain, UAE."],
  about: ["About Alif Tours & Cargo", "A UAE group specialising in cargo to Bangladesh and travel services, also trading building materials and manufacturing gypsum design panels."],
  contact: ["Contact Alif Tours & Cargo", `WhatsApp or call ${PHONE_DISPLAY}. ${ADDRESS}.`],
};
for (const s of SERVICES) SEO[`services/${s.slug}`] = [`${s.title} from Al Ain, UAE`, `${s.short} ${s.intro}`.slice(0, 158)];

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
    tenant_id: id, label: "Main", phone: PHONE, whatsapp: WA_NUMBER, email: null,
    address: ADDRESS, is_primary: true, floating_whatsapp: false, sort_order: 0,
  });
  console.log("✓ tenant created", id, "demo until", expiresAt);
  return id;
}

async function uploadAssets(tenantId) {
  const dir = path.join(__dirname, "..", "clients", "Alif Tour & Cargo UAE", "site-assets");
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
    site_name: SITE_NAME, tagline: "Cargo to Bangladesh, Umrah & Travel Services in Al Ain",
    logo_url: LOGO_ON_LIGHT, logo_dark_url: LOGO_ON_DARK, logo_type: "image", logo_alt: SITE_NAME, logo_width: 150,
    favicon_url: FAVICON_URL,
    primary_color: NAVY, secondary_color: RED,
    color_overrides: {
      primary: NAVY, primaryFg: "#ffffff", secondary: RED, accent: RED, ring: NAVY,
      background: MIST, foreground: INK, card: "#ffffff", muted: SKY, mutedFg: "#4A5568",
      border: LINE, borderRadius: "0.75rem",
    },
    design_overrides: { headingFont: "Plus Jakarta Sans", bodyFont: "Inter", headingWeight: "800", roundness: "rounded", shadow: "soft" },
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
