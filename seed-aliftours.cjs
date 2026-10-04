/**
 * Alif Tours & Cargo — UAE group based in Sanaiya, Al Ain. Six service lines:
 * Cargo (UAE to Bangladesh), Visa Processing, Ticketing, Umrah & Hajj, Tour
 * Packages and Travel Services. Each line has its own page under /services/
 * with its sub-services as anchored sections, so the header dropdowns can
 * jump straight to them. The group also trades building materials and
 * manufactures gypsum design panels (About page only).
 * Pro-plan demo at aliftours.passivecoder.com. English, navy + signal red.
 * Logo v2 is our own redraw (clients/Alif Tour & Cargo UAE/build-logo-v2.cjs).
 * All photos are Pexels stand-ins; no prices — enquiries go to WhatsApp.
 * Safe to re-run.
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
const DEMO_HOURS = 72; // demos always 72h (matches src/modules/demo/links.ts)

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Alif Tours & Cargo";
const PHONE = "+971503202626";
const PHONE_DISPLAY = "+971 50 320 2626";
const WA_NUMBER = "971503202626";
const ADDRESS = "3 Street 14/2, Sanaiya, Al Ain, United Arab Emirates";
const HOURS = "Open daily, 9 AM to 11 PM";
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
const LOGO_ON_LIGHT = asset("logo-v2.png");
const LOGO_ON_DARK = asset("logo-v2-dark.png");
const FAVICON_URL = asset("favicon-v2.png");

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
  port: px(93106),
  wing: px(12916439, 2000),
  wing2: px(112116),
  tickets: px(7310015),
  passport: px(4922080),
  passport2: px(8193761),
  dubai: px(33687795),
  dubaiWide: px(17865557),
  desert: px(4781951),
  hotel: px(34672504),
  hotel2: px(5883728),
  maldives: px(28843924),
  beach: px(30920614),
  jetty: px(1320686),
  bricks: px(32913784),
  gypsum: px(5493670),
  plaster: px(6474130),
};
const sized = (url, w) => url.replace(/w=\d+/, `w=${w}`);

// ─── Service lines ──────────────────────────────────────────────────────────
// Six lines approved by Wali 2026-10-03. Each `subs` entry becomes an anchored
// section (#<id>) on the line's page and a link in its header dropdown.
// [id, icon, title, description, points[]]
const SERVICES = [
  {
    slug: "cargo", nav: "Cargo", icon: "Package", title: "Cargo to Bangladesh", img: IMG.warehouse,
    short: "Air and sea cargo from the UAE to Bangladesh, door to door, for families and businesses.",
    intro: "Our specialty for over a decade. Send boxes to your family or goods for your business, by air when it is urgent or by sea when the load is big.",
    wa: "I want to send cargo to Bangladesh.",
    subs: [
      ["air-cargo", "Plane", "Air Cargo to Bangladesh", "The fast way to send boxes home. Ideal for personal parcels, gifts, electronics and anything that cannot wait.", ["Personal boxes and parcels", "Electronics, clothes and gifts", "Weekly shipments"]],
      ["sea-cargo", "Ship", "Sea Cargo to Bangladesh", "The economical way to send heavy or bulky goods when time is less important than cost.", ["Furniture and household goods", "Large and heavy loads", "Lower cost per kilo"]],
      ["door-to-door", "Truck", "Door-to-Door Delivery", "We collect from your place in the UAE and deliver to your family's home in Bangladesh.", ["Collection across the UAE", "Delivery to the home address", "Updates along the way"]],
      ["packing", "Boxes", "Packing & Boxing", "Proper cartons, tape and packing for fragile items, done at our office.", ["Cartons supplied", "Fragile items wrapped", "Weighed and labelled"]],
      ["commercial", "Building2", "Commercial & Bulk Shipments", "Regular shipments for shops, traders and businesses sending goods to Bangladesh.", ["Trade and business goods", "Regular schedules", "Rates for volume"]],
    ],
    steps: [
      ["Message us", "Tell us what you are sending, the size or weight, and the district in Bangladesh."],
      ["Get a rate", "We confirm air or sea and give you the rate before you pack."],
      ["Drop off or collection", "Bring the boxes to our Al Ain office or book a collection."],
      ["Delivered home", "We keep you updated until the boxes reach your family."],
    ],
    faq: [
      ["How is the cargo price calculated?", "By weight, size and the type of goods, and whether it goes by air or sea. Send us the details on WhatsApp for a rate."],
      ["How long does air or sea cargo take?", "Air is the faster option and sea takes longer. We give you the current timeline when you book."],
      ["Are there items you cannot send?", "Yes. Liquids, loose batteries, and restricted or dangerous goods cannot go. Ask us first if you are not sure."],
    ],
    gallery: [IMG.warehouse, IMG.port, IMG.packing],
  },
  {
    slug: "visa-processing", nav: "Visa", icon: "FileCheck", title: "Visa Processing", img: IMG.passport,
    short: "UAE visit visas, Umrah visas and tourist visas abroad, with the paperwork handled for you.",
    intro: "Bring your family to visit, travel for Umrah or apply for a tourist visa abroad. We give you a clear document checklist and handle the application.",
    wa: "I want to ask about a visa.",
    subs: [
      ["uae-visit-visa", "Home", "UAE Visit Visa", "Visit and tourist visas for your parents, spouse, children and relatives to come to the UAE.", ["Family visit visas", "Tourist visas", "Short and long stays"]],
      ["umrah-visa", "Moon", "Umrah Visa", "Umrah visas on their own or as part of a full Umrah package.", ["Visa only or with package", "Individuals and groups", "Fast processing"]],
      ["tourist-visa", "Globe", "Tourist Visas Abroad", "Help applying for visas to Schengen countries, Malaysia, Thailand, Turkey and more.", ["Schengen", "Asia and Middle East", "Appointment and file preparation"]],
      ["visa-extension", "RefreshCw", "Visa Extension & Status Change", "Guidance and processing for extending a visit visa or changing visa status.", ["Visit visa extensions", "Status change", "Clear timelines"]],
      ["attestation", "Stamp", "Document Attestation & Typing", "Attestation of certificates and documents, plus typing services for applications.", ["Certificate attestation", "Application typing", "Translation on request"]],
    ],
    steps: [
      ["Tell us the visa", "Who is travelling, their nationality and the visa needed."],
      ["Get the checklist", "We send exactly which documents to prepare."],
      ["We apply", "We submit the application and keep you updated."],
      ["Visa issued", "You receive the visa and travel advice."],
    ],
    faq: [
      ["How long does a UAE visit visa take?", "Processing times vary by visa type. We give you the current timeline when you apply."],
      ["Can you guarantee approval?", "No one can guarantee a visa decision, but we make sure the application is complete and correct."],
      ["Which documents do I need?", "It depends on the visa. Tell us which one and we send the exact checklist."],
    ],
    gallery: [IMG.passport, IMG.passport2, IMG.tickets],
  },
  {
    slug: "ticketing", nav: "Ticketing", icon: "Plane", title: "Air Ticketing", img: IMG.wing,
    short: "Flights to Bangladesh and worldwide, group fares, date changes and reissues.",
    intro: "Going home for Eid, flying family over or travelling for work? Tell us the route and dates and we find a fair fare on a reliable airline.",
    wa: "I want to book an air ticket.",
    subs: [
      ["bangladesh-flights", "PlaneTakeoff", "Flights to Bangladesh", "Dhaka, Chattogram and Sylhet from Abu Dhabi, Dubai and Sharjah. One-way and return.", ["Dhaka · Chattogram · Sylhet", "One-way and return", "Eid and holiday seasons"]],
      ["international-flights", "Globe", "International Flights", "Tickets to any destination for holidays, business or family visits.", ["Worldwide destinations", "Economy and business", "Multi-city trips"]],
      ["group-tickets", "Users", "Group & Labour Tickets", "Fares for families, company workers and groups travelling together.", ["Company and labour groups", "Family bookings", "Group fares"]],
      ["date-change", "CalendarClock", "Date Change & Reissue", "Change your travel date or reissue your ticket, whatever the airline allows.", ["Date changes", "Reissues", "Cancellations and refunds help"]],
    ],
    steps: [
      ["Send route & dates", "WhatsApp us where you are flying, when, and how many travellers."],
      ["Get fare options", "We send the best options we can find."],
      ["Ticket issued", "Confirm and receive your e-ticket."],
    ],
    faq: [
      ["Can you find cheaper tickets to Bangladesh before Eid?", "Book as early as you can. Fares rise close to Eid, and we look for the best options for your dates."],
      ["Can you change my existing ticket?", "Send us the ticket details and we check what the airline allows."],
      ["Can you book for a group of workers?", "Yes. Send us the number of travellers and dates and we quote for the group."],
    ],
    gallery: [IMG.wing, IMG.wing2, IMG.tickets],
  },
  {
    slug: "umrah-hajj", nav: "Umrah & Hajj", icon: "Moon", title: "Umrah & Hajj", img: IMG.kaaba,
    short: "Umrah and Hajj packages from the UAE with visa, travel, hotels and transport arranged.",
    intro: "Perform your pilgrimage with everything taken care of. We arrange the visa, the travel, hotels in Makkah and Madinah and the transport between them, so you can focus on worship.",
    wa: "I want to ask about Umrah and Hajj packages.",
    subs: [
      ["umrah-packages", "Moon", "Umrah Packages", "Economy and premium Umrah packages for individuals, couples, families and groups.", ["Visa, travel and hotels", "Makkah and Madinah stays", "Ground transport included"]],
      ["ramadan-umrah", "Sparkles", "Ramadan Umrah", "Special departures to perform Umrah in the blessed month, including the last ten nights.", ["Early booking recommended", "Last ten nights options", "Family packages"]],
      ["hajj-packages", "Landmark", "Hajj Packages", "Hajj packages with full guidance, accommodation and transport through the season.", ["Guidance throughout", "Accommodation and transport", "Limited seats each year"]],
    ],
    steps: [
      ["Choose your dates", "Tell us when you want to travel and how many people are going."],
      ["Pick a package", "We send the package options with hotels and price."],
      ["Documents & visa", "Share your passport and photos. We process the visa."],
      ["Travel with peace", "Receive your tickets, hotel details and transport plan before you leave."],
    ],
    faq: [
      ["Which documents do I need for Umrah?", "A passport valid for at least six months, a photo and a valid UAE residence visa. We confirm the full list when you book."],
      ["How far are the hotels from the Haram?", "It depends on the package. Each package lists its hotels so you can choose."],
      ["When should I book Hajj?", "As early as possible. Seats are limited each year, so message us well before the season."],
    ],
    gallery: [IMG.kaaba, IMG.kaabaClose, IMG.madinah],
  },
  {
    slug: "tour-packages", nav: "Tours", icon: "Palmtree", title: "Tour Packages", img: IMG.maldives,
    short: "UAE tours, international holidays, Bangladesh trips and honeymoon packages.",
    intro: "Take a proper holiday without planning every detail. Pick a destination and budget, and we put together flights, hotel, transfers and tours.",
    wa: "I want to ask about a tour package.",
    subs: [
      ["uae-tours", "Sun", "UAE Tours", "Dubai city tours, desert safaris and Abu Dhabi trips for you or your visiting family.", ["Dubai city tour", "Desert safari", "Abu Dhabi day trip"]],
      ["international-holidays", "Palmtree", "International Holidays", "Beach and city holidays with flights, hotels and transfers in one package.", ["Maldives · Thailand", "Malaysia · Turkey", "Custom itineraries"]],
      ["bangladesh-tours", "Mountain", "Bangladesh Tours", "Trips to Cox's Bazar, Sylhet's tea gardens and other favourites back home.", ["Cox's Bazar", "Sylhet tea gardens", "Family trips"]],
      ["honeymoon-family", "Heart", "Honeymoon & Family Packages", "Packages planned around couples or children, with the right hotels and pace.", ["Honeymoon specials", "Child-friendly hotels", "Private transfers"]],
    ],
    steps: [
      ["Share your idea", "Destination, dates, number of people and budget."],
      ["Get a plan", "We send a package with flights, hotel and what is included."],
      ["Book & go", "Confirm and receive all your travel documents."],
    ],
    faq: [
      ["Can you plan a custom trip?", "Yes. Tell us what you want and we build the package around it."],
      ["Do packages include visas?", "Where needed, we can include the visa application in the package."],
      ["Can you arrange a desert safari for my visiting family?", "Yes. Tell us the date and number of people."],
    ],
    gallery: [IMG.maldives, IMG.desert, IMG.beach],
  },
  {
    slug: "travel-services", nav: "Travel Services", icon: "Luggage", title: "Travel Services", img: IMG.hotel,
    short: "Hotel reservations, travel insurance and airport transfers to complete your trip.",
    intro: "The details that make a trip go smoothly. Book your hotel, get insured and arrange your airport pick-up with the same team.",
    wa: "I want to ask about hotels, insurance or airport transfers.",
    subs: [
      ["hotel-reservations", "Hotel", "Hotel Reservations", "Hotel bookings worldwide, from budget stays to rooms near the Haram.", ["Worldwide hotels", "Makkah and Madinah", "Confirmations for visa files"]],
      ["travel-insurance", "ShieldCheck", "Travel Insurance", "Cover for medical emergencies, delays and lost baggage, including visa-ready policies.", ["Medical cover", "Baggage and delays", "Visa-ready policies"]],
      ["airport-transfers", "Car", "Airport Transfers", "Pick-up and drop-off between the airport, home and hotel for you and your guests.", ["Abu Dhabi · Dubai · Al Ain", "Jeddah and Madinah", "Cars and vans for groups"]],
    ],
    steps: [
      ["Tell us what you need", "City, dates, travellers and the service."],
      ["Get options", "We send hotels, policies or transfer prices."],
      ["Confirmed", "Receive your booking, policy or driver details."],
    ],
    faq: [
      ["Can I get a hotel booking for my visa application?", "Yes. Ask us for a confirmed booking for your application."],
      ["Do I need travel insurance for a visa?", "Some countries require it. Tell us the destination and we confirm."],
      ["Can you pick up my family arriving from Bangladesh?", "Yes. Send the flight details and we arrange the pick-up."],
    ],
    gallery: [IMG.hotel, IMG.hotel2, IMG.dubai],
  },
];
const svcUrl = (s) => `/services/${s.slug}`;
const CARGO = SERVICES[0];
const UMRAH = SERVICES.find((s) => s.slug === "umrah-hajj");
const byNav = (slug) => SERVICES.find((s) => s.slug === slug);

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 88, right: 24, bottom: 88, left: 24 },
  margin: ZERO,
  background: { type: "none" },
};
const bgColor = (color) => ({ type: "color", color });

// [slug, title, url]
const PAGES = [
  ["home", "Home", "/"],
  ["services", "Services", "/services"],
  ...SERVICES.map((s) => [`services/${s.slug}`, s.title, svcUrl(s)]),
  ["about", "About", "/about"],
  ["contact", "Contact", "/contact"],
];

function navItems() {
  const line = (s, i) => ({
    id: `n${i}`, label: s.nav, url: svcUrl(s),
    children: s.subs.map(([id, , title], k) => ({ id: `n${i}-${k}`, label: title, url: `${svcUrl(s)}#${id}`, children: [] })),
  });
  const travel = byNav("travel-services");
  return [
    { id: "n0", label: "Home", url: "/", children: [] },
    ...["cargo", "visa-processing", "ticketing", "umrah-hajj", "tour-packages"].map((slug, i) => line(byNav(slug), i + 1)),
    { id: "n6", label: "More", url: "/services", children: [
      ...travel.subs.map(([id, , title], k) => ({ id: `n6-${k}`, label: title, url: `${svcUrl(travel)}#${id}`, children: [] })),
      { id: "n6-a", label: "All services", url: "/services", children: [] },
      { id: "n6-b", label: "About us", url: "/about", children: [] },
      { id: "n6-c", label: "Contact", url: "/contact", children: [] },
    ]},
  ];
}

// Utility strip above the main nav: hours, address, phone, WhatsApp.
function topBar() {
  const ico = (d) => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const CLOCK = ico('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>');
  const PIN = ico('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>');
  const PHONE_I = ico('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>');
  return {
    id: uid("topbar"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(NAVY_DEEP),
    data: {
      html: `<div class="al-top"><div class="al-top-in">
  <div class="al-top-l"><span>${CLOCK}${HOURS}</span><a href="${MAPS_URL}" target="_blank" rel="noopener noreferrer" class="al-top-addr">${PIN}Sanaiya, Al Ain, UAE</a></div>
  <div class="al-top-r"><a href="tel:${PHONE}">${PHONE_I}${PHONE_DISPLAY}</a><a href="${WA}" target="_blank" rel="noopener noreferrer" class="al-top-wa">WhatsApp</a></div>
</div></div>`,
      css: `.al-top{background:${NAVY_DEEP};color:#C3CEE3;font-size:.8rem;font-weight:500}
.al-top-in{max-width:80rem;margin:0 auto;padding:8px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px}
.al-top-l,.al-top-r{display:flex;align-items:center;gap:22px}
.al-top span,.al-top a{display:inline-flex;align-items:center;gap:7px;color:inherit;text-decoration:none}
.al-top svg{color:${RED};flex:none}
.al-top a:hover{color:#fff}
.al-top-wa{background:${RED};color:#fff!important;padding:4px 12px;border-radius:999px;font-weight:700}
.al-top-wa:hover{background:#B81F26}
@media(max-width:760px){.al-top-addr{display:none!important}.al-top-in{padding:7px 14px;font-size:.74rem}.al-top-l,.al-top-r{gap:12px}.al-top-r a:first-child{display:none}}`,
    },
  };
}

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 1, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor("#ffffff"),
    templateVariant: "solid-with-cta",
    data: {
      logoText: SITE_NAME, logo: LOGO_ON_LIGHT, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: "#ffffff", textColor: INK, colorMode: "legacy", activeColor: RED, ctaVariant: "solid", logoHeight: 58, logoCaption: "",
      showCta: true, ctaLabel: "Get a Quote", ctaUrl: WA,
    },
  };
}

const POLISH = [
  ".al-head{max-width:46rem;margin:0 0 40px}",
  ".al-head.c{margin:0 auto 44px;text-align:center}",
  `.al-eyebrow{font-size:.75rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${RED};margin-bottom:10px}`,
  `.al-head h2{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:clamp(2rem,3.4vw,2.8rem);line-height:1.1;color:${INK}}`,
  ".al-lede{margin-top:12px;color:#4A5568;font-size:1.05rem;line-height:1.6}",
  "a,button{transition:background-color .2s,color .2s,border-color .2s,box-shadow .2s,transform .2s}",
  "html{scroll-behavior:smooth}[id]{scroll-margin-top:110px}",
].join("");

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
      logo: LOGO_ON_DARK, logoText: SITE_NAME, logoCaption: HOURS,
      tagline: "Cargo to Bangladesh, visa processing, air tickets, Umrah and Hajj, tours and travel services. Over a decade of service from Al Ain.",
      style: "dark", backgroundColor: NAVY_DEEP, accentColor: RED, textColor: "#C3CEE3",
      copyrightText: `© {year} ${SITE_NAME}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.map((s) => ({ id: uid("fl"), label: s.title, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Company", links: [
          { id: uid("fl"), label: "About us", url: "/about" },
          { id: uid("fl"), label: "All services", url: "/services" },
          { id: uid("fl"), label: "Contact", url: "/contact" },
        ]},
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: "WhatsApp us", url: WA },
          { id: uid("fl"), label: "3 Street 14/2, Sanaiya, Al Ain", url: MAPS_URL },
          { id: uid("fl"), label: HOURS, url: "/contact" },
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
      layout: "left", badge: "AL AIN · SERVING THE UAE",
      title: "Your cargo home. Your journey, sorted.",
      subtitle: "Cargo · Visas · Tickets · Umrah & Hajj · Tours",
      description: "Send boxes to your family in Bangladesh, bring your family to visit, fly home for Eid or book your Umrah. One trusted Al Ain office, over ten years in business, open every day until 11 PM.",
      badgeBgColor: RED, badgeTextColor: "#ffffff",
      primaryButton: { label: "Send Cargo", url: WA_CARGO, variant: "primary" },
      secondaryButton: { label: "Explore Services", url: "/services", variant: "outline", bgColor: "#ffffff", textColor: NAVY },
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
        ["6", "Service lines"],
        ["UAE → BD", "Air & sea cargo"],
        ["11 PM", "Open late, every day"],
      ].map(([value, label]) => ({ id: uid("st"), value, label })),
    },
  };
}

// The six service boxes: photo, icon, title, sub-services, link.
function serviceBoxes(bg = MIST, heading = true) {
  const box = (s, i) => `
    <a href="${svcUrl(s)}" class="al-box al-b${i}">
      <div class="al-box-img"><img src="${sized(s.img, 900)}" alt="${s.title}" loading="lazy"/><span class="al-box-n">0${i + 1}</span></div>
      <div class="al-box-body">
        <h3>${s.title}</h3>
        <p>${s.short}</p>
        <ul>${s.subs.map(([, , t]) => `<li>${t}</li>`).join("")}</ul>
        <span class="al-box-go">Explore ${s.nav} <b>→</b></span>
      </div>
    </a>`;
  return {
    ...BASE, id: uid("boxes"), type: "custom_html", background: bgColor(bg),
    data: {
      html: `<div class="al-boxes-wrap">
  ${heading ? `<div class="al-head c"><p class="al-eyebrow">What we do</p><h2>Six services, one trusted office</h2><p class="al-lede">From a box for your mother in Sylhet to an Umrah for the whole family. Pick a service to see everything it covers.</p></div>` : ""}
  <div class="al-boxes">${SERVICES.map(box).join("")}</div>
</div>`,
      css: `.al-boxes-wrap{max-width:80rem;margin:0 auto}
.al-boxes{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.al-box{display:flex;flex-direction:column;background:#fff;border:1px solid ${LINE};border-radius:18px;overflow:hidden;text-decoration:none;color:${INK};box-shadow:0 8px 24px rgba(14,42,92,.06)}
.al-box:hover{transform:translateY(-4px);box-shadow:0 20px 40px rgba(14,42,92,.14);border-color:${NAVY}}
.al-box-img{position:relative;height:190px;overflow:hidden;background:${NAVY}}
.al-box-img img{width:100%;height:100%;object-fit:cover;transition:transform .7s ease}
.al-box:hover .al-box-img img{transform:scale(1.06)}
.al-box-img::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(8,26,61,.55),transparent 55%)}
.al-box-n{position:absolute;left:18px;bottom:12px;z-index:1;font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:1.6rem;color:#fff}
.al-box-body{padding:22px 24px 24px;display:flex;flex-direction:column;gap:10px;flex:1}
.al-box h3{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:1.3rem;color:${NAVY}}
.al-box p{color:#4A5568;font-size:.95rem;line-height:1.55}
.al-box ul{list-style:none;padding:0;margin:4px 0 6px;display:flex;flex-direction:column;gap:6px}
.al-box li{position:relative;padding-left:18px;font-size:.9rem;font-weight:600;color:${INK}}
.al-box li::before{content:"";position:absolute;left:0;top:.5em;width:8px;height:8px;border-radius:2px;background:${RED}}
.al-box-go{margin-top:auto;padding-top:8px;font-weight:800;color:${RED};font-size:.95rem}
.al-box:hover .al-box-go b{margin-left:4px}
@media(max-width:1000px){.al-boxes{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.al-boxes{grid-template-columns:1fr}.al-box-img{height:170px}}`,
    },
  };
}

function umrahBand() {
  return {
    ...BASE, id: uid("cta"), type: "cta",
    background: { type: "image", imageUrl: IMG.madinah, imageOverlay: NAVY_DEEP, imageOverlayOpacity: 0.7 },
    templateVariant: "navy-banner",
    data: {
      title: "Planning Umrah or Hajj this season?",
      description: "Visa, travel, hotels in Makkah and Madinah, and transport between them. Ask for the current packages.",
      layout: "centered",
      primaryButton: { label: "Ask About Packages", url: waText(`Hello Alif Tours & Cargo, ${UMRAH.wa}`) },
      secondaryButton: { label: "Umrah & Hajj details", url: svcUrl(UMRAH) },
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
        ["Clock", "Open 9 AM to 11 PM, every day", "Come after work or on the weekend. We are open late, seven days a week."],
        ["MessageCircle", "Real people on WhatsApp", "Ask a question and get an answer from our team, in English, Bangla or Arabic."],
        ["BadgeCheck", "Clear prices first", "You know the cargo rate or the package price before you commit."],
        ["Layers", "Everything in one place", "Cargo, visas, tickets, Umrah and tours with one trusted office."],
      ].map(([icon, title, description], i) => ({ id: uid("f"), icon, title, description, ...(i === 0 ? { imageUrl: sized(IMG.packing, 1200) } : {}) })),
    },
  };
}

const FAQ_HOME = [
  ["How do I get a cargo rate?", "Message us on WhatsApp with what you are sending, the weight and the district in Bangladesh. We reply with the rate for air or sea."],
  ["What are your opening hours?", "We are open every day from 9 AM to 11 PM."],
  ["Where is your office?", `${ADDRESS}.`],
  ["Can you get a visit visa for my parents?", "Yes. Tell us their nationality and we send the document checklist."],
  ["Do you arrange Umrah and Hajj?", "Yes. Packages include the visa, travel, hotels and transport."],
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
      description: `Message us on WhatsApp or call ${PHONE_DISPLAY}. Open every day, 9 AM to 11 PM.`,
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
      subtitle: `Tell us what you need and we will get back to you. ${HOURS}.`,
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

// ─── service page sections ──────────────────────────────────────────────────
function pageHero({ badge, title, description, img, waUrl = WA, waLabel = "WhatsApp Us" }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: NAVY_DEEP, imageOverlayOpacity: 0.6 },
    data: {
      layout: "left", badge, title, subtitle: "", description, compact: true,
      badgeBgColor: RED, badgeTextColor: "#ffffff",
      primaryButton: { label: waLabel, url: waUrl, variant: "primary" },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}`, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: "5xl", titleColor: "#ffffff", descColor: "#D8E1F0" },
    },
  };
}

// Sub-services as anchored cards: chips on top jump to each one.
function subServices(s, bg = MIST) {
  return {
    ...BASE, id: uid("subs"), type: "custom_html", background: bgColor(bg),
    data: {
      html: `<div class="al-subs-wrap">
  <div class="al-head"><p class="al-eyebrow">${s.title}</p><h2>What we offer</h2><p class="al-lede">${s.intro}</p></div>
  <nav class="al-chips">${s.subs.map(([id, , t]) => `<a href="#${id}">${t}</a>`).join("")}</nav>
  <div class="al-subs">${s.subs.map(([id, ic, t, d, pts], i) => `
    <article id="${id}" class="al-sub">
      <div class="al-sub-top"><span class="al-sub-n">0${i + 1}</span><h3>${t}</h3></div>
      <p>${d}</p>
      <ul>${pts.map((p) => `<li>${p}</li>`).join("")}</ul>
      <a class="al-sub-btn" href="${waText(`Hello Alif Tours & Cargo, I want to ask about ${t}.`)}" target="_blank" rel="noopener noreferrer">Ask about ${t} →</a>
    </article>`).join("")}
  </div>
</div>`,
      css: `.al-subs-wrap{max-width:80rem;margin:0 auto}
.al-chips{display:flex;flex-wrap:wrap;gap:10px;margin:-12px 0 32px}
.al-chips a{padding:8px 16px;border-radius:999px;border:1.5px solid ${LINE};background:#fff;color:${NAVY};font-weight:700;font-size:.88rem;text-decoration:none}
.al-chips a:hover{border-color:${RED};color:${RED}}
.al-subs{display:grid;grid-template-columns:repeat(${s.subs.length === 4 ? 2 : 3},1fr);gap:22px}
.al-sub{position:relative;background:#fff;border:1px solid ${LINE};border-top:4px solid ${NAVY};border-radius:16px;padding:26px 26px 24px;display:flex;flex-direction:column;gap:12px}
.al-sub:target{border-top-color:${RED};box-shadow:0 0 0 3px rgba(215,38,46,.18)}
.al-sub:hover{border-top-color:${RED};box-shadow:0 16px 36px rgba(14,42,92,.1)}
.al-sub-top{display:flex;align-items:baseline;gap:12px}
.al-sub-n{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:1.1rem;color:${RED}}
.al-sub h3{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:1.25rem;color:${NAVY};line-height:1.25}
.al-sub p{color:#4A5568;line-height:1.6;font-size:.96rem}
.al-sub ul{list-style:none;padding:0;margin:0 0 6px;display:flex;flex-direction:column;gap:7px}
.al-sub li{position:relative;padding-left:24px;font-weight:600;font-size:.92rem;color:${INK}}
.al-sub li::before{content:"✓";position:absolute;left:0;top:0;color:${RED};font-weight:800}
.al-sub-btn{margin-top:auto;font-weight:800;font-size:.9rem;color:${RED};text-decoration:none}
.al-sub-btn:hover{color:${NAVY}}
@media(max-width:1000px){.al-subs{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.al-subs{grid-template-columns:1fr}.al-chips{gap:8px}.al-chips a{font-size:.8rem;padding:6px 12px}}`,
    },
  };
}

function svcSteps(s, bg = "#ffffff") {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    templateVariant: s.steps.length > 3 ? "timeline-connected" : "numbered-cards",
    data: {
      title: "How it works", subtitle: s.title, layout: "horizontal", style: "connected",
      items: s.steps.map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

function svcGallery(s, bg = MIST) {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    templateVariant: "hero-mosaic",
    data: {
      title: "", subtitle: "", layout: "grid", columns: 3, gap: "md", lightbox: true,
      images: s.gallery.map((url) => ({ id: uid("gi"), url: sized(url, 1200), alt: s.title, caption: "" })),
    },
  };
}

function otherServices(current, bg = MIST) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "image-tiles",
    data: {
      title: "Our other services", subtitle: "", layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: SERVICES.filter((s) => s.slug !== current.slug).map((s) => ({
        id: uid("sv"), title: s.title, description: s.short, icon: s.icon, iconType: "lucide",
        imageUrl: sized(s.img, 900), linkLabel: "Explore", link: svcUrl(s),
      })),
    },
  };
}

// ─── about sections ─────────────────────────────────────────────────────────
function aboutSplit(bg = "#ffffff") {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "split-list",
    data: {
      title: "A group of businesses, built on service", subtitle: "About Alif Tours & Cargo",
      description: "We are a group operating multiple businesses across the United Arab Emirates. We specialise in cargo from the UAE to Bangladesh, and run a full travel desk for visas, air tickets, Umrah and Hajj, tours and travel services. We have been in business for over a decade and have built a strong customer base through our commitment to quality and customer service.",
      layout: "split", columns: 2, style: "minimal", imageUrl: IMG.dubaiWide,
      items: [
        ["Package", "Cargo to Bangladesh", "Our specialty: air and sea cargo from the UAE to families and businesses in Bangladesh."],
        ["Plane", "Tours & travel", "Visas, air tickets, Umrah and Hajj, tour packages, hotels, insurance and transfers."],
        ["Target", "Our mission", "To provide our customers with quality services and products that exceed their expectations."],
      ].map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

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
        id: uid("sv"), title, description, icon, iconType: "lucide", imageUrl: sized(img, 900),
        linkLabel: "Enquire", link: waText(`Hello Alif group, I want to ask about ${title.toLowerCase()}.`),
      })),
    },
  };
}

function values(bg = "#ffffff") {
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
      title: "Reach Us", subtitle: HOURS, columns: 4, iconSize: "md",
      items: [
        ["MessageCircle", "WhatsApp", PHONE_DISPLAY, WA],
        ["Phone", "Call", PHONE_DISPLAY, `tel:${PHONE}`],
        ["MapPin", "Visit", "3 Street 14/2, Sanaiya, Al Ain", MAPS_URL],
        ["Clock", "Hours", "Every day, 9 AM to 11 PM", WA],
      ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: NAVY, label, description, url })),
    },
  };
}

// ─── pages ──────────────────────────────────────────────────────────────────
const BUILDERS = {
  home: () => [heroHome(), stats(), serviceBoxes(), umrahBand(), cargoSteps("#ffffff"), whyUs(MIST), faq(FAQ_HOME, "#ffffff"), cta()],
  services: () => [
    pageHero({ badge: "Our Services", title: "Six services under one roof", description: "Cargo, visa processing, air ticketing, Umrah and Hajj, tour packages and travel services from Al Ain.", img: IMG.dubai }),
    serviceBoxes(MIST, false),
    whyUs("#ffffff", "icon-list-cards"),
    cta("navy-banner"),
  ],
  about: () => [
    pageHero({ badge: "About Us", title: "Over a decade of service from Al Ain", description: "A UAE group specialising in cargo to Bangladesh and travel services, with building materials and gypsum manufacturing alongside.", img: IMG.dubaiWide }),
    aboutSplit(),
    stats(),
    groupBusinesses(),
    values(),
    cta(),
  ],
  contact: () => [
    pageHero({ badge: "Contact", title: "Message, call or visit", description: `${HOURS}. ${ADDRESS}.`, img: IMG.wing2 }),
    contactCards(),
    contactForm(),
  ],
};
for (const s of SERVICES) {
  const waUrl = waText(`Hello Alif Tours & Cargo, ${s.wa}`);
  BUILDERS[`services/${s.slug}`] = () => [
    pageHero({ badge: "Service", title: s.title, description: s.short, img: s.img, waUrl, waLabel: "Get a Quote" }),
    subServices(s),
    svcSteps(s),
    svcGallery(s),
    faq(s.faq, "#ffffff", "minimal-lines", "Questions"),
    otherServices(s),
    contactForm("#ffffff", s.title),
  ];
}

const SEO = {
  home: ["Cargo to Bangladesh, Visas, Tickets, Umrah & Tours in Al Ain, UAE", "Alif Tours & Cargo in Al Ain: air and sea cargo to Bangladesh, visa processing, air tickets, Umrah and Hajj, tour packages and travel services. Open daily 9 AM to 11 PM."],
  services: ["Our Services", "Cargo to Bangladesh, visa processing, air ticketing, Umrah and Hajj, tour packages and travel services from Al Ain, UAE."],
  about: ["About Alif Tours & Cargo", "A UAE group specialising in cargo to Bangladesh and travel services, also trading building materials and manufacturing gypsum design panels."],
  contact: ["Contact Alif Tours & Cargo", `WhatsApp or call ${PHONE_DISPLAY}. ${ADDRESS}. ${HOURS}.`],
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
    site_name: SITE_NAME, tagline: "Cargo, Visas, Tickets, Umrah & Tours in Al Ain",
    logo_url: LOGO_ON_LIGHT, logo_dark_url: LOGO_ON_DARK, logo_type: "image", logo_alt: SITE_NAME, logo_width: 195,
    favicon_url: FAVICON_URL,
    primary_color: NAVY, secondary_color: RED,
    color_overrides: {
      primary: NAVY, primaryFg: "#ffffff", secondary: RED, accent: RED, ring: NAVY,
      background: MIST, foreground: INK, card: "#ffffff", muted: SKY, mutedFg: "#4A5568",
      border: LINE, borderRadius: "0.75rem",
    },
    design_overrides: { headingFont: "Plus Jakarta Sans", bodyFont: "Inter", headingWeight: "800", roundness: "rounded", shadow: "soft" },
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
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Dubai", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
