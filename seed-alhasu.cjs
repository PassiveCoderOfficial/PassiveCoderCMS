/**
 * Al Hasu Online — community hall, event equipment rental, food & grocery
 * delivery and household scrap buying in Al Hisu (Al Hasu), Al Madinah
 * Province, Saudi Arabia. GM: Tariqul Islam.
 * Pro-plan demo at alhasu.passivecoder.com. English only, warm sand theme
 * with date-palm green and terracotta. All photos
 * are Pexels stand-ins (logo is our own palm-oasis mark), no prices on the site — enquiries go to WhatsApp.
 * Safe to re-run.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "alhasu";
const PLAN = "pro";
const TEMPLATE_SLUG = "events-venues"; // empty custom_css, so our palette wins
const DEMO_HOURS = 24 * 7;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Al Hasu Online";
const GM = "Tariqul Islam";
const PHONE = "+966537499055";
const PHONE_DISPLAY = "+966 53 749 9055";
const WA_NUMBER = "966537499055";
const ADDRESS = "Al Hisu (Al Hasu), Al Madinah Province, Saudi Arabia";
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Al+Hisu+Al+Madinah+Saudi+Arabia";
const MAP_EMBED = "https://www.google.com/maps?q=Al%20Hisu%2C%20Al%20Madinah%2C%20Saudi%20Arabia&z=13&output=embed";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hello Al Hasu Online, I would like to ask about your services.");

const PALM = "#1F5E4A";      // date-palm green, primary
const PALM_DEEP = "#143F32";
const CLAY = "#C2703D";      // terracotta accent
const INK = "#22231F";
const SAND = "#FBF7F0";      // page background
const DUNE = "#F3EADB";      // alternate band
const STONE = "#E5D9C6";

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
// Palm-oasis mark + wordmark, built by clients/Al Hasu Online/build-logo.cjs.
const LOGO_ON_LIGHT = asset("logo-dark-text.png");
const LOGO_ON_DARK = asset("logo-light-text.png");
const FAVICON_URL = asset("favicon.png");

// Pexels (free for commercial use), stand-ins until the client sends photos.
const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
const IMG = {
  palms: px(35061351, 2000),
  dates: px(28613482),
  hall: px(17206160),
  hallDecor: px(17206153),
  hallTables: px(17206150),
  chairsStacked: px(33024028),
  chairsFolding: px(6292987),
  chairsRows: px(1082024),
  mandi: px(17650170),
  rider: px(7362948),
  riderDoor: px(7362967),
  groceryDoor: px(7362954),
  groceryCart: px(7362950),
  groceryBag: px(7363163),
  scrap: px(6196281),
  scrapPile: px(128421),
};

// ─── Services ───────────────────────────────────────────────────────────────
// Sorted out of the client's description: one hall, one rental line, two
// delivery lines, one scrap line. Each gets its own page under /services/.
const SERVICES = [
  {
    slug: "community-hall", icon: "Building2", title: "Community Hall Rental", img: IMG.hall,
    short: "A ready venue in Al Hisu for weddings, parties and village occasions.",
    intro: "Our community hall is the village's place to gather. Book it for a wedding night, an engagement, an Eid get-together or a family occasion, and we prepare it the way you need.",
    includes: [
      ["Heart", "Weddings & engagements", "Wedding nights, milka and engagement celebrations."],
      ["PartyPopper", "Parties & celebrations", "Birthdays, graduations, homecomings and success parties."],
      ["Moon", "Eid & Ramadan gatherings", "Eid lunches, Ramadan iftars and suhoor nights."],
      ["Baby", "Aqiqah & family occasions", "Aqiqah dinners, family reunions and welcome gatherings."],
      ["Users", "Community & tribe meetings", "Village meetings, weekly gatherings and guest receptions."],
      ["HandHeart", "Condolence (azza)", "A respectful, calm space for receiving condolences."],
    ],
    tags: ["Weddings", "Engagements (milka)", "Eid gatherings", "Ramadan iftar", "Aqiqah", "Graduations", "Birthdays", "Tribe meetings", "Condolence (azza)"],
    steps: [
      ["Tell us the date", "Message us on WhatsApp with the date, the occasion and your rough guest count."],
      ["Check & confirm", "We confirm availability and what you need: seating, tables, lighting, serving items."],
      ["We set it up", "Our team prepares the hall before your guests arrive."],
      ["Enjoy, we clear up", "Focus on your guests. We handle the clear-down afterwards."],
    ],
    faq: [
      ["How do I check if the hall is free on my date?", "Send the date on WhatsApp. We reply with availability straight away."],
      ["Can you supply tables, chairs and serving items with the hall?", "Yes. Hall bookings can include our tables, chairs, floor seating, lighting and serving items, so you deal with one person for everything."],
      ["Can we arrange food for the event?", "Yes. Ask us about food for your guests through our delivery service and we arrange it with the booking."],
      ["Do you have separate sections for men and women?", "Tell us how you want the guests arranged and we set up the hall to suit your occasion."],
    ],
    gallery: [IMG.hall, IMG.hallDecor, IMG.hallTables],
  },
  {
    slug: "event-equipment-rental", icon: "Armchair", title: "Tables, Chairs & Event Equipment", img: IMG.chairsFolding,
    short: "Tables, chairs and everything a function needs, delivered to your door.",
    intro: "Hosting at home, in your majlis or outdoors? Rent the tables, chairs and function items you need. We deliver, set up and collect when it is over.",
    includes: [
      ["Armchair", "Chairs", "Plastic, folding and banquet chairs for any guest count."],
      ["Table", "Tables", "Round and long tables for dining, buffets and serving."],
      ["Sofa", "Floor seating & carpets", "Carpets and cushions for majlis-style seating."],
      ["Coffee", "Coffee & tea service", "Dallah, thermos flasks, cups and serving trays."],
      ["Lightbulb", "Lighting", "Lights for evening events, courtyards and outdoor seating."],
      ["Fan", "Fans & coolers", "Fans, water coolers and dispensers for hot days."],
    ],
    tags: ["Home functions", "Majlis gatherings", "Outdoor events", "Weddings", "Eid", "Funerals & azza", "School & mosque events", "Short-notice orders"],
    steps: [
      ["Send your list", "Tell us what you need, how many and the date on WhatsApp."],
      ["Get a quote", "We confirm stock and give you the price for the items and delivery."],
      ["Delivered & set up", "We bring everything to your place and set it up."],
      ["We collect", "After the event we come back and collect it all."],
    ],
    faq: [
      ["Do you deliver and collect the items?", "Yes. We deliver to your house, farm or venue in and around Al Hisu and collect after the event."],
      ["What if I need more chairs on the day?", "Call or WhatsApp us. We send extra items whenever stock allows."],
      ["Can I rent items without booking the hall?", "Yes. Equipment rental is a separate service for events at your own home or venue."],
      ["How early should I book?", "For weddings and Eid, book as early as you can. For small gatherings, a day's notice is often enough."],
    ],
    gallery: [IMG.chairsFolding, IMG.chairsStacked, IMG.chairsRows],
  },
  {
    slug: "food-delivery", icon: "UtensilsCrossed", title: "Food Delivery", img: IMG.mandi,
    short: "Hot meals delivered to homes across the village.",
    intro: "Hot meals brought to your door in Al Hisu. Order for the family, for guests who arrived unexpectedly, or in bulk for a gathering.",
    includes: [
      ["Soup", "Everyday meals", "Lunch and dinner for the family, delivered hot."],
      ["Drumstick", "Mandi, kabsa & rice dishes", "Traditional rice and meat dishes for sharing."],
      ["Users", "Orders for guests", "Large orders for majlis guests and family visits."],
      ["CalendarCheck", "Event catering orders", "Food for weddings and occasions, arranged with the hall."],
    ],
    tags: ["Lunch", "Dinner", "Family orders", "Guest orders", "Bulk orders", "Event food"],
    steps: [
      ["Message your order", "Send your order and location on WhatsApp."],
      ["We confirm", "We confirm the order, the total and the delivery time."],
      ["Delivered hot", "Your food arrives at your door."],
    ],
    faq: [
      ["Which areas do you deliver to?", "Al Hisu and the nearby areas. Send your location on WhatsApp and we confirm."],
      ["Can I order for a large group?", "Yes. For gatherings, message us a few hours ahead so we can prepare."],
      ["How do I pay?", "Cash on delivery. Ask us about other payment options when you order."],
    ],
    gallery: [IMG.mandi, IMG.rider, IMG.riderDoor],
  },
  {
    slug: "grocery-delivery", icon: "ShoppingBasket", title: "Grocery Delivery", img: IMG.groceryDoor,
    short: "Daily groceries and household needs brought to your home.",
    intro: "Skip the drive. Send us your shopping list and we bring groceries and household essentials to your house in Al Hisu.",
    includes: [
      ["Apple", "Fresh produce", "Fruit, vegetables, dates and herbs."],
      ["Milk", "Dairy & bakery", "Milk, laban, eggs, bread and cheese."],
      ["Package", "Pantry staples", "Rice, flour, oil, sugar, tea, coffee and spices."],
      ["Droplets", "Water & drinks", "Bottled water and drinks for home and guests."],
      ["SprayCan", "Household items", "Cleaning supplies, tissues and everyday needs."],
      ["Baby", "Baby care", "Nappies, wipes and baby food."],
    ],
    tags: ["Daily shopping", "Weekly shopping", "Water delivery", "Elderly & families", "Bulk for gatherings"],
    steps: [
      ["Send your list", "Type or photograph your shopping list and send it on WhatsApp."],
      ["We shop", "We buy your items and confirm the total with you."],
      ["At your door", "Groceries delivered to your home."],
    ],
    faq: [
      ["Can I send a photo of a handwritten list?", "Yes. Send a photo or a voice note, whatever is easiest."],
      ["What if an item is not available?", "We message you and suggest a replacement before buying it."],
      ["Do you deliver water in bulk?", "Yes. Ask for bottled water by the carton for home or for events."],
    ],
    gallery: [IMG.groceryDoor, IMG.groceryCart, IMG.groceryBag],
  },
  {
    slug: "scrap-buying", icon: "Recycle", title: "Scrap Buying", img: IMG.scrap,
    short: "We buy your old household items and scrap metal for cash.",
    intro: "Clear out the store room, the roof or the yard and get paid for it. We buy old household items and scrap metal, and we collect from your home.",
    includes: [
      ["AirVent", "Old AC units", "Window and split air conditioners, working or not."],
      ["Refrigerator", "Fridges & washing machines", "Old fridges, freezers, washing machines and cookers."],
      ["Wrench", "Scrap metal", "Iron, steel, aluminium, copper and brass."],
      ["Armchair", "Old furniture", "Metal beds, cupboards, chairs and tables."],
      ["Battery", "Batteries & cables", "Car batteries, cables and wiring."],
      ["Package", "Cardboard & mixed junk", "Cardboard and general household junk."],
    ],
    tags: ["Pay on the spot", "Free home collection", "Working or broken", "Single items or full loads"],
    steps: [
      ["Send a photo", "WhatsApp us photos of the items and your location."],
      ["Get an offer", "We tell you what we can pay."],
      ["We collect & pay", "We come, load everything and pay you on the spot."],
    ],
    faq: [
      ["Do you buy items that no longer work?", "Yes. Broken ACs, fridges and washing machines still have scrap value."],
      ["Do I need to bring the items to you?", "No. We collect from your house, yard or farm."],
      ["How is the price decided?", "By the type of item or metal and its weight. Send photos and we give you an offer first."],
    ],
    gallery: [IMG.scrap, IMG.scrapPile],
  },
];
const svcUrl = (s) => `/services/${s.slug}`;

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
    padding: ZERO, margin: ZERO, background: bgColor(SAND),
    templateVariant: "solid-with-cta",
    data: {
      logoText: SITE_NAME, logo: LOGO_ON_LIGHT, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: SAND, textColor: INK, colorMode: "legacy", activeColor: PALM, ctaVariant: "solid", logoHeight: 56, logoCaption: "",
      showCta: true, ctaLabel: "WhatsApp Us", ctaUrl: WA,
    },
  };
}

const POLISH = [
  ".ah-head{max-width:46rem;margin:0 0 40px}",
  `.ah-eyebrow{font-size:.75rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${CLAY};margin-bottom:10px}`,
  `.ah-head h2{font-family:"DM Serif Display",serif;font-size:clamp(2rem,3.4vw,2.9rem);line-height:1.08;color:${INK}}`,
  ".ah-lede{margin-top:12px;color:#5E5A50;font-size:1.05rem;line-height:1.6}",
  "a,button{transition:background-color .2s,color .2s,border-color .2s,box-shadow .2s,transform .2s}",
].join("");

// Floating WhatsApp rides along with the global footer (no public renderer for the flag yet).
function floatingWhatsApp() {
  return {
    id: uid("wa"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      html: `<a class="ah-wa" href="${WA}" target="_blank" rel="noopener noreferrer" aria-label="Chat with Al Hasu Online on WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.737 5.469 2.027 7.773L0 32l8.473-2.004A15.934 15.934 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.257 13.257 0 01-6.749-1.839l-.484-.287-5.027 1.188 1.213-4.895-.316-.502A13.263 13.263 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.266-9.987c-.398-.199-2.353-1.161-2.718-1.294-.365-.133-.631-.199-.897.199-.266.398-1.031 1.294-1.264 1.56-.233.266-.465.299-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.055-1.983-2.357-2.216-2.755-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.199-.897-2.161-1.229-2.958-.324-.778-.653-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.062.498-.365.398-1.395 1.362-1.395 3.322s1.428 3.852 1.627 4.118c.199.266 2.81 4.291 6.81 6.022.952.411 1.695.657 2.274.841.955.304 1.824.261 2.511.158.766-.114 2.353-.962 2.685-1.891.332-.929.332-1.726.232-1.891-.099-.166-.365-.266-.763-.465z"/></svg></a>`,
      css: `.theme-image-fade{background:linear-gradient(to top,rgba(20,30,25,.6) 0%,transparent 60%)!important}.ah-wa{position:fixed;right:20px;bottom:20px;z-index:9990;width:56px;height:56px;border-radius:9999px;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease}.ah-wa:hover{transform:scale(1.06)}@media(max-width:640px){.ah-wa{right:14px;bottom:14px;width:52px;height:52px}}${POLISH}`,
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 1, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_ON_DARK, logoText: SITE_NAME, logoCaption: "Al Hisu · Al Madinah",
      tagline: "Community hall, event equipment rental, food and grocery delivery, and scrap buying for Al Hisu and the villages around it.",
      style: "dark", backgroundColor: PALM_DEEP, accentColor: CLAY, textColor: "#CBD8D1",
      copyrightText: `© {year} ${SITE_NAME}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.map((s) => ({ id: uid("fl"), label: s.title, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Pages", links: TOP_PAGES.map(([, label, url]) => ({ id: uid("fl"), label, url })) },
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: "WhatsApp us", url: WA },
          { id: uid("fl"), label: `General Manager: ${GM}`, url: "/about" },
          { id: uid("fl"), label: "Al Hisu, Al Madinah Province", url: MAPS_URL },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── home sections ──────────────────────────────────────────────────────────
function heroHome() {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: { top: 64, right: 24, bottom: 72, left: 24 },
    background: bgColor(SAND),
    templateVariant: "split-image-right",
    data: {
      layout: "split", badge: "AL HISU · AL MADINAH PROVINCE",
      title: "Everything your village needs, one call away.",
      subtitle: "Hall rental · Event equipment · Food & grocery delivery · Scrap buying",
      description: "Book the community hall for your wedding, rent tables and chairs for a gathering, get food and groceries to your door, or sell your old household items. One trusted local team.",
      badgeBgColor: DUNE, badgeTextColor: CLAY,
      primaryButton: { label: "WhatsApp Us", url: WA, variant: "primary" },
      secondaryButton: { label: "See All Services", url: "/services", variant: "outline" },
      imageUrl: IMG.hall, imageAlt: "Community hall set for a celebration",
      typography: { titleSize: "5xl", titleColor: INK, subtitleColor: PALM, descColor: "#5E5A50" },
    },
  };
}

function quickStrip(bg = PALM) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    padding: { top: 26, right: 24, bottom: 26, left: 24 },
    templateVariant: "minimal-inline",
    data: {
      title: "", subtitle: "", columns: 4, iconSize: "sm",
      items: [
        ["MapPin", "Local to Al Hisu"],
        ["Truck", "Delivery & collection"],
        ["MessageCircle", "Book on WhatsApp"],
        ["Banknote", "Cash on delivery"],
      ].map(([icon, label]) => ({ id: uid("i"), icon, color: "#F3C9A6", label, description: "" })),
    },
  };
}

function serviceTiles(bg = SAND) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "image-tiles",
    data: {
      title: "What We Do", subtitle: "Five services for homes, families and occasions in Al Hisu",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: SERVICES.map((s) => ({
        id: uid("sv"), title: s.title, description: s.short, icon: s.icon, iconType: "lucide",
        imageUrl: s.img.replace("w=1600", "w=900"), linkLabel: "View service", link: svcUrl(s),
      })).concat([{
        id: uid("sv"), title: "Need something else?", description: "Ask us on WhatsApp. If it helps the village, we can usually sort it.",
        icon: "MessageCircle", iconType: "lucide", imageUrl: IMG.dates.replace("w=1600", "w=900"), linkLabel: "Message us", link: WA,
      }]),
    },
  };
}

// Occasions bento: custom so the hall + rental + food story reads as one.
function occasions(bg = DUNE) {
  const tiles = [
    ["Weddings", "Hall, seating and lighting for the big night.", IMG.hallDecor, "/services/community-hall"],
    ["Eid & Ramadan", "Iftars, Eid lunches and family visits.", IMG.dates, "/services/community-hall"],
    ["Home gatherings", "Chairs, tables and coffee service at your door.", IMG.chairsRows, "/services/event-equipment-rental"],
    ["Feeding guests", "Food orders for majlis guests and events.", IMG.mandi, "/services/food-delivery"],
  ];
  return {
    ...BASE, id: uid("occ"), type: "custom_html", background: bgColor(bg),
    data: {
      html: `<div class="ah-occ-wrap">
  <div class="ah-head"><p class="ah-eyebrow">For every occasion</p><h2>From the wedding night to a quiet Eid lunch.</h2><p class="ah-lede">Book the hall, the furniture and the food with one message. We handle the setup and the clear-up.</p></div>
  <div class="ah-occ">${tiles.map(([t, d, img, url], i) => `
    <a href="${url}" class="ah-o ah-o${i}"><img src="${img.replace("w=1600", "w=1000")}" alt="${t}" loading="lazy"/><span><strong>${t}</strong><em>${d}</em></span></a>`).join("")}
  </div>
</div>`,
      css: `.ah-occ-wrap{max-width:80rem;margin:0 auto}
.ah-occ{display:grid;gap:16px;grid-template-columns:1.4fr 1fr 1fr;grid-template-rows:230px 230px}
.ah-o{position:relative;overflow:hidden;border-radius:20px;color:#fff;text-decoration:none;background:${PALM_DEEP}}
.ah-o img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transition:transform .7s cubic-bezier(.2,.7,.2,1)}
.ah-o::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(to top,rgba(15,30,24,.85),rgba(15,30,24,.15) 55%,transparent)}
.ah-o:hover img{transform:scale(1.05)}
.ah-o span{position:absolute;z-index:2;left:22px;right:22px;bottom:20px;display:flex;flex-direction:column;gap:4px}
.ah-o strong{font-family:"DM Serif Display",serif;font-size:1.5rem;font-weight:400}
.ah-o em{font-style:normal;font-size:.9rem;color:rgba(255,255,255,.85)}
.ah-o0{grid-row:span 2}.ah-o0 strong{font-size:2.2rem}
.ah-o3{grid-column:span 2}
@media(max-width:900px){.ah-occ{grid-template-columns:1fr 1fr;grid-template-rows:none;grid-auto-rows:200px}.ah-o0{grid-column:span 2;grid-row:span 1}.ah-o3{grid-column:span 2}}
@media(max-width:520px){.ah-occ{grid-template-columns:1fr;grid-auto-rows:190px}.ah-o0,.ah-o3{grid-column:span 1}.ah-o0 strong{font-size:1.7rem}}`,
    },
  };
}

function whyUs(bg = SAND) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "numbered-columns",
    data: {
      title: "Why the village calls us", subtitle: "Local, reliable, one number", layout: "grid", columns: 4, style: "minimal",
      items: [
        ["One number for everything", "Hall, furniture, food, groceries and scrap. One WhatsApp chat."],
        ["We know Al Hisu", "We live and work here. We know the roads, the farms and the families."],
        ["We deliver and collect", "Items come to your door and we take them away after."],
        ["Fair and upfront", "You get the price before you confirm. No surprises later."],
      ].map(([title, description]) => ({ id: uid("f"), title, description })),
    },
  };
}

function howToBook(bg = DUNE) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    templateVariant: "arrow-flow",
    data: {
      title: "Booking takes one message", subtitle: "How it works", layout: "horizontal", style: "connected",
      items: [
        ["Message us", "Tell us what you need on WhatsApp or call."],
        ["Get a clear price", "We confirm availability and the cost."],
        ["We deliver", "Hall ready, items delivered, food at your door."],
      ].map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

const FAQ_HOME = [
  ["Which areas do you serve?", "Al Hisu (Al Hasu) and the nearby villages in Al Madinah Province. Send your location and we confirm."],
  ["How do I book?", `Message us on WhatsApp or call ${PHONE_DISPLAY}. Most bookings are confirmed in the same chat.`],
  ["Can I book the hall, chairs and food together?", "Yes. Tell us about your occasion and we put the hall, the equipment and the food in one booking."],
  ["Do you really buy broken appliances?", "Yes. Old ACs, fridges and washing machines still have scrap value. Send a photo for an offer."],
];

function faq(items, bg = SAND, variant = "two-column-grid", title = "Common Questions") {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg),
    templateVariant: variant,
    data: {
      title, subtitle: "Still unsure? Message us on WhatsApp.", layout: "accordion", allowMultiple: false,
      items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })),
    },
  };
}

function cta(variant = "warm-banner") {
  return {
    ...BASE, id: uid("cta"), type: "cta",
    background: bgColor(SAND),
    templateVariant: variant,
    data: {
      title: "Planning an occasion or need something delivered?",
      description: "Send us a message on WhatsApp. We reply quickly with availability and a price.",
      layout: "centered",
      primaryButton: { label: "WhatsApp Us", url: WA },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
    },
  };
}

function contactForm(bg = SAND, top = 88, service) {
  return {
    ...BASE, padding: { top, right: 24, bottom: 88, left: 24 }, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: service ? `Ask about ${service}` : "Send Us a Request",
      subtitle: "Tell us what you need and we will get back to you. For the fastest reply, use WhatsApp.",
      layout: "split",
      showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: PHONE_DISPLAY, email: "", address: ADDRESS, recipientEmail: "",
      fields: [
        { id: "f-name", label: "Full name", type: "text", required: true },
        { id: "f-phone", label: "Mobile / WhatsApp", type: "tel", required: true },
        { id: "f-need", label: "Service", type: "select", required: false, options: [...SERVICES.map((s) => s.title), "Other"] },
        { id: "f-date", label: "Date needed", type: "text", required: false },
        { id: "f-msg", label: "Details", type: "textarea", required: false },
      ],
      submitLabel: "Send Request", successMessage: "Thank you. We will contact you shortly. For a faster reply, message us on WhatsApp.",
    },
  };
}

// ─── inner page sections ────────────────────────────────────────────────────
function pageHero({ badge, title, description, img }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: PALM_DEEP, imageOverlayOpacity: 0.55 },
    data: {
      layout: "left", badge, title, subtitle: "", description, compact: true,
      badgeBgColor: CLAY, badgeTextColor: "#ffffff",
      primaryButton: { label: "WhatsApp Us", url: WA, variant: "primary" },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}`, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: "5xl", titleColor: "#ffffff", descColor: "#E4EDE8" },
    },
  };
}

function svcIncludes(s, bg = SAND) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "icon-list-cards",
    data: {
      title: s.slug === "scrap-buying" ? "What we buy" : "What's included", subtitle: s.title, description: s.intro,
      layout: "grid", columns: s.includes.length === 4 ? 2 : 3, style: "cards",
      items: s.includes.map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

function svcTags(s, bg = DUNE) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    padding: { top: 48, right: 24, bottom: 48, left: 24 },
    templateVariant: "pill-row",
    data: {
      title: s.slug === "scrap-buying" ? "The deal" : "Good for", subtitle: "", columns: 4, iconSize: "sm",
      items: s.tags.map((label) => ({ id: uid("i"), icon: "Check", color: PALM, label, description: "" })),
    },
  };
}

function svcSteps(s, bg = SAND) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    templateVariant: s.steps.length > 3 ? "timeline-connected" : "big-numbers",
    data: {
      title: "How it works", subtitle: s.title, layout: "horizontal", style: "connected",
      items: s.steps.map(([title, description], i) => ({ id: uid("s"), step: `0${i + 1}`, title, description })),
    },
  };
}

function svcGallery(s, bg = DUNE) {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    templateVariant: "grid-clean",
    data: {
      title: "", subtitle: "", layout: "grid", columns: s.gallery.length, gap: "md", lightbox: true,
      images: s.gallery.map((url) => ({ id: uid("gi"), url: url.replace("w=1600", "w=1000"), alt: s.title, caption: "" })),
    },
  };
}

function otherServices(current, bg = DUNE) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "bordered-list",
    data: {
      title: "More from Al Hasu Online", subtitle: "", layout: "list", columns: 2, cardStyle: "flat", source: "inline",
      items: SERVICES.filter((s) => s.slug !== current.slug).map((s) => ({
        id: uid("sv"), title: s.title, description: s.short, icon: s.icon, iconType: "lucide", linkLabel: "View", link: svcUrl(s),
      })),
    },
  };
}

function servicesDetail(bg = SAND) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "alternating-media",
    data: {
      title: "Our Services", subtitle: "Pick a service to see the details", layout: "alternating", columns: 2, style: "minimal",
      items: SERVICES.map((s) => ({
        id: s.slug, title: s.title, icon: s.icon, imageUrl: s.img.replace("w=1600", "w=1200"),
        description: `${s.intro} Includes: ${s.includes.map((x) => x[1]).join(" · ")}.`,
        link: svcUrl(s), linkLabel: "View details",
      })),
    },
  };
}

function aboutSplit(bg = SAND) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "split-list",
    data: {
      title: "A local business that grew with the village", subtitle: "About Al Hasu Online",
      description: `Al Hasu Online serves Al Hisu (also written Al Hasu or Al-Hisu), a village and municipality in Al Madinah Province. It covers the things families here need most: a place to celebrate, the furniture to host, food and groceries at the door, and a fair price for old household items. The business is run by General Manager ${GM}.`,
      layout: "split", columns: 2, style: "minimal", imageUrl: IMG.palms,
      items: [
        ["Building2", "The community hall", "The village's venue for weddings, Eid and family occasions."],
        ["Armchair", "Event equipment", "Tables, chairs and function items delivered and collected."],
        ["Truck", "Delivery", "Food and groceries brought to homes across the village."],
        ["Recycle", "Scrap buying", "Old household items and metal bought for cash."],
      ].map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

function manager(bg = DUNE) {
  return {
    ...BASE, id: uid("team"), type: "team", background: bgColor(bg),
    templateVariant: "centered-feature",
    data: {
      title: "Meet the Manager", subtitle: "", columns: 1,
      members: [{
        id: uid("m"), name: GM, role: "General Manager", imageUrl: "",
        bio: "Tariqul looks after every booking, delivery and collection personally. Message him on WhatsApp and you deal with the person who gets it done.",
        socials: [{ platform: "whatsapp", url: WA }],
      }],
    },
  };
}

function contactCards(bg = DUNE) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "colored-tiles",
    data: {
      title: "Reach Us", subtitle: "", columns: 3, iconSize: "md",
      items: [
        ["MessageCircle", "WhatsApp", PHONE_DISPLAY, WA],
        ["Phone", "Call", PHONE_DISPLAY, `tel:${PHONE}`],
        ["UserRound", "General Manager", GM, WA],
      ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: PALM, label, description, url })),
    },
  };
}

// ─── pages ──────────────────────────────────────────────────────────────────
const BUILDERS = {
  home: () => [heroHome(), quickStrip(), serviceTiles(), occasions(), howToBook(SAND), whyUs(DUNE), cta("dark-split"), faq(FAQ_HOME, SAND, "boxed-two-column")],
  services: () => [
    pageHero({ badge: "Our Services", title: "Five services, one local team", description: "Hall rental, event equipment, food delivery, grocery delivery and scrap buying in Al Hisu.", img: IMG.palms }),
    quickStrip(),
    servicesDetail(),
    howToBook(),
    cta("dark-split"),
  ],
  about: () => [
    pageHero({ badge: "About Us", title: "Serving Al Hisu, day to day", description: "Celebrations, deliveries and collections for the families of Al Hisu.", img: IMG.dates }),
    aboutSplit(),
    manager(),
    whyUs(SAND),
    cta(),
  ],
  contact: () => [
    pageHero({ badge: "Contact", title: "Message or call us", description: `WhatsApp or call ${PHONE_DISPLAY}. General Manager: ${GM}.`, img: IMG.palms }),
    contactCards(),
    contactForm(),
  ],
};
for (const s of SERVICES) {
  BUILDERS[`services/${s.slug}`] = () => [
    pageHero({ badge: "Service", title: s.title, description: s.short, img: s.img }),
    svcIncludes(s),
    svcTags(s),
    svcSteps(s),
    svcGallery(s),
    faq(s.faq, SAND, "minimal-lines", "Questions"),
    otherServices(s),
    contactForm(SAND, 88, s.title),
  ];
}

const SEO = {
  home: ["Hall Rental, Event Equipment, Delivery & Scrap Buying in Al Hisu", "Al Hasu Online in Al Hisu, Al Madinah: community hall for weddings and occasions, tables and chairs rental, food and grocery delivery, and household scrap buying."],
  services: ["Our Services", "Community hall rental, event equipment rental, food delivery, grocery delivery and scrap buying in Al Hisu, Al Madinah Province."],
  about: ["About Al Hasu Online", `A local Al Hisu business run by General Manager ${GM}: community hall, event rentals, delivery and scrap buying.`],
  contact: ["Contact Al Hasu Online", `WhatsApp or call ${PHONE_DISPLAY}. Al Hisu, Al Madinah Province, Saudi Arabia.`],
};
for (const s of SERVICES) SEO[`services/${s.slug}`] = [`${s.title} in Al Hisu`, `${s.short} ${s.intro}`.slice(0, 158)];

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
  const dir = path.join(__dirname, "..", "clients", "Al Hasu Online", "site-assets");
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
    site_name: SITE_NAME, tagline: "Hall Rental, Event Equipment, Delivery & Scrap Buying in Al Hisu",
    logo_url: LOGO_ON_LIGHT, logo_dark_url: LOGO_ON_DARK, logo_type: "image", logo_alt: SITE_NAME, logo_width: 170,
    favicon_url: FAVICON_URL,
    primary_color: PALM, secondary_color: CLAY,
    color_overrides: {
      primary: PALM, primaryFg: "#ffffff", secondary: CLAY, accent: CLAY, ring: PALM,
      background: SAND, foreground: INK, card: "#ffffff", muted: DUNE, mutedFg: "#5E5A50",
      border: STONE, borderRadius: "0.75rem",
    },
    design_overrides: { headingFont: "DM Serif Display", bodyFont: "Outfit", headingWeight: "400", roundness: "rounded", shadow: "soft" },
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
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Riyadh", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
