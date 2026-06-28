/**
 * Life Settle v4 — Royal Blue/White/Gold rebrand, premium Visa & Immigration brand.
 * 16 services, country_grid countries page, ~20 priority country pages, /management,
 * legal stubs, /track, eligibility checker, leadership highlights.
 * Global header/footer rebranded (single block objects in site_identity).
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "636793b3-9104-4e15-9415-eef346a9957a";
const LOGO_URL = "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1782327669055_Life_Settle_Logo.png";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// Brand tokens — Royal Blue / White / Gold
const PRIMARY = "#1e3a8a";
const SECONDARY = "#c9a84c";
const GOLD = "#d4af37";
const DARK = "#0b1f4d";
const LIGHT = "#f5f8ff";
const FG = "#0b1f4d";

const SLOGAN = "Your Trusted Global Visa & Immigration Partner";
const WA = "https://wa.me/8801711145428";
const PHONE = "+8801711145428";
const EMAIL = "info@lifesettle.com";
const ADDRESS = "House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207";

const ZERO_PAD = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 80, right: 0, bottom: 80, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" },
};

const mgmtUrls = JSON.parse(fs.readFileSync(path.join(__dirname, "mgmt-photo-urls.json"), "utf8"));

// ─── NAV (global) ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "n1", label: "Home", url: "/", children: [] },
  { id: "n2", label: "Services", url: "/services", children: [
    { id: "n2a", label: "Work Visa & Permit", url: "/services/work-visa" },
    { id: "n2b", label: "Visit & Tourist Visa", url: "/services/tourist-visa" },
    { id: "n2c", label: "Business Visa", url: "/services/business-visa" },
    { id: "n2d", label: "Student Visa", url: "/services/student-visa" },
    { id: "n2e", label: "Family Visa", url: "/services/family-visa" },
    { id: "n2f", label: "Immigration Consultation", url: "/services/immigration-consultation" },
    { id: "n2g", label: "Air Ticket & Hotel", url: "/services/air-ticket" },
    { id: "n2h", label: "All Services", url: "/services" },
  ]},
  { id: "n3", label: "Destinations", url: "/countries", children: [
    { id: "n3a", label: "All Countries", url: "/countries" },
    { id: "n3b", label: "Schengen Europe", url: "/countries#schengen-europe" },
    { id: "n3c", label: "GCC / Middle East", url: "/countries#gcc" },
    { id: "n3d", label: "Skilled Migration", url: "/countries#skilled-migration" },
    { id: "n3e", label: "Asia", url: "/countries#asia" },
  ]},
  { id: "n4", label: "Eligibility", url: "/eligibility", children: [] },
  { id: "n5", label: "Track Status", url: "/track", children: [] },
  { id: "n6", label: "Management", url: "/management", children: [] },
  { id: "n7", label: "About", url: "/about", children: [] },
  { id: "n8", label: "Contact", url: "/contact", children: [] },
];

function globalHeader() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO_PAD, margin: ZERO_PAD, background: { type: "color", color: "#ffffff" },
    templateVariant: "solid-with-cta",
    data: {
      logoText: "Life Settle", logo: LOGO_URL, items: NAV_ITEMS,
      sticky: true, transparent: false, style: "default",
      backgroundColor: "#ffffff", textColor: DARK,
      showCta: true, ctaLabel: "Free Consultation", ctaUrl: "/contact",
    },
  };
}

function globalFooter() {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full",
    padding: ZERO_PAD, margin: ZERO_PAD, background: { type: "none" },
    data: {
      logoText: "Life Settle Travel & Tourism",
      tagline: SLOGAN + " — premium visa, work permit, skilled migration & travel services.",
      style: "dark", backgroundColor: DARK, accentColor: GOLD, textColor: "#cdd7ee",
      copyrightText: "© {year} Life Settle Travel & Tourism. All rights reserved.",
      copyrightYear: true, showNewsletter: false,
      socials: [
        { platform: "facebook", url: "https://www.facebook.com/ShiblyFacilitiesManagementServiceLtd" },
        { platform: "whatsapp", url: WA },
      ],
      columns: [
        { id: uid("fc"), heading: "Services", links: [
          { id: uid("fl"), label: "Work Visa & Permit", url: "/services/work-visa" },
          { id: uid("fl"), label: "Tourist Visa", url: "/services/tourist-visa" },
          { id: uid("fl"), label: "Business Visa", url: "/services/business-visa" },
          { id: uid("fl"), label: "Student Visa", url: "/services/student-visa" },
          { id: uid("fl"), label: "All Services", url: "/services" },
        ]},
        { id: uid("fc"), heading: "Destinations", links: [
          { id: uid("fl"), label: "All Countries", url: "/countries" },
          { id: uid("fl"), label: "Germany", url: "/countries/germany" },
          { id: uid("fl"), label: "Saudi Arabia", url: "/countries/saudi-arabia" },
          { id: uid("fl"), label: "Canada", url: "/countries/canada" },
          { id: uid("fl"), label: "Australia", url: "/countries/australia" },
        ]},
        { id: uid("fc"), heading: "Company", links: [
          { id: uid("fl"), label: "About Us", url: "/about" },
          { id: uid("fl"), label: "Management", url: "/management" },
          { id: uid("fl"), label: "Check Eligibility", url: "/eligibility" },
          { id: uid("fl"), label: "Track Application", url: "/track" },
          { id: uid("fl"), label: "Contact", url: "/contact" },
        ]},
        { id: uid("fc"), heading: "Legal", links: [
          { id: uid("fl"), label: "Privacy Policy", url: "/privacy" },
          { id: uid("fl"), label: "Terms & Conditions", url: "/terms" },
          { id: uid("fl"), label: "Refund Policy", url: "/refund" },
          { id: uid("fl"), label: "Disclaimer", url: "/disclaimer" },
        ]},
      ],
      bottomLinks: [
        { id: uid("bl"), label: "Privacy", url: "/privacy" },
        { id: uid("bl"), label: "Terms", url: "/terms" },
      ],
    },
  };
}

// ─── reusable block helpers ─────────────────────────────────────────────────
function contactBlock(order, title = "Get In Touch", subtitle = "Free consultation — we respond within 24 hours") {
  return {
    ...BASE, id: uid("contact"), type: "contact", order,
    data: {
      title, subtitle, layout: "split", showMap: false, showContactInfo: true,
      phone: PHONE, email: EMAIL, address: ADDRESS, recipientEmail: EMAIL,
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-email", label: "Email Address", type: "email", required: false },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "f-dest", label: "Destination Country", type: "text", required: false },
        { id: "f-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message",
      successMessage: "Thank you! Our team will contact you within 24 hours.",
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
      primaryButton: { label: "Free Consultation", url: "/contact" },
      secondaryButton: { label: "WhatsApp Now", url: WA },
      layout: "centered",
    },
  };
}

function heroBlock(order, { badge, title, subtitle, description, img, primary, secondary }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", order, padding: ZERO_PAD,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: DARK, imageOverlayOpacity: 0.7 },
    data: {
      layout: "centered", badge, title, subtitle, description,
      primaryButton: primary ?? { label: "Apply Now — Free", url: "/contact", variant: "primary" },
      secondaryButton: secondary ?? { label: "WhatsApp Us", url: WA, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: "6xl", titleColor: "#ffffff", subtitleColor: GOLD, descColor: "#dbe4ff" },
    },
  };
}

function eligibilitySection(order) {
  return {
    ...BASE, id: uid("elig"), type: "eligibility_checker", order,
    background: { type: "color", color: LIGHT },
    data: {
      title: "Check Your Visa Eligibility — Free",
      subtitle: "Answer 5 quick questions and get instant guidance from our experts.",
      accentColor: PRIMARY, submitLabel: "Check My Eligibility", recipientEmail: EMAIL,
      destinations: [
        { id: uid("d"), label: "Europe (Work Permit)", value: "Europe Work Permit" },
        { id: uid("d"), label: "GCC / Middle East (Work)", value: "GCC Work" },
        { id: uid("d"), label: "Skilled Migration (Australia / Canada / NZ)", value: "Skilled Migration" },
        { id: uid("d"), label: "Student Visa", value: "Student Visa" },
        { id: uid("d"), label: "Visit / Tourist Visa", value: "Tourist Visa" },
      ],
    },
  };
}

// ─── 16 SERVICES ────────────────────────────────────────────────────────────
const SERVICES = [
  { slug: "work-visa", icon: "💼", title: "Work Visa & Work Permit", img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80&fit=crop", short: "Legal work permits & visas for Europe, GCC and beyond — pay after approval." },
  { slug: "tourist-visa", icon: "🧳", title: "Visit & Tourist Visa", img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80&fit=crop", short: "Schengen, UK, USA, GCC and Asia tourist & visit visas with full documentation." },
  { slug: "business-visa", icon: "🤝", title: "Business Visa", img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80&fit=crop", short: "Business & investor visas for global trade, conferences and partnerships." },
  { slug: "student-visa", icon: "🎓", title: "Student Visa", img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80&fit=crop", short: "Study abroad — admission guidance, SOP, financial docs and visa filing." },
  { slug: "family-visa", icon: "👨‍👩‍👧", title: "Family Visa", img: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80&fit=crop", short: "Family reunion, dependent and spouse visas handled end to end." },
  { slug: "residence-permit", icon: "🏠", title: "Residence Permit", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80&fit=crop", short: "Temporary & permanent residence permit processing for Europe and GCC." },
  { slug: "immigration-consultation", icon: "🧭", title: "Immigration Consultation", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80&fit=crop", short: "Expert one-on-one immigration strategy for the best route to your goal." },
  { slug: "skilled-migration", icon: "🌏", title: "Skilled Migration (AU/CA/NZ)", img: "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=1200&q=80&fit=crop", short: "Points-based skilled migration to Australia, Canada and New Zealand." },
  { slug: "air-ticket", icon: "✈️", title: "Air Ticket Booking", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&fit=crop", short: "Best-rate domestic & international tickets on all major airlines." },
  { slug: "hotel-reservation", icon: "🏨", title: "Hotel Reservation", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&fit=crop", short: "Budget to luxury hotels worldwide with visa booking letters." },
  { slug: "travel-insurance", icon: "🛡️", title: "Travel Insurance", img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80&fit=crop", short: "Schengen-compliant travel & health insurance for any destination." },
  { slug: "airport-assist", icon: "🛬", title: "Airport Meet & Assist", img: "https://images.unsplash.com/photo-1542296332-2e4473faf563?w=1200&q=80&fit=crop", short: "VIP airport meet, fast-track and assistance on arrival & departure." },
  { slug: "document-legalization", icon: "📜", title: "Document Legalization", img: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1200&q=80&fit=crop", short: "Attestation, apostille and embassy legalization of your documents." },
  { slug: "document-translation", icon: "🌐", title: "Document Translation", img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80&fit=crop", short: "Certified translation in English, Arabic and major European languages." },
  { slug: "visa-status-check", icon: "🔎", title: "Visa Status Check", img: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&q=80&fit=crop", short: "Real-time tracking of your visa application at every stage." },
  { slug: "online-consultation", icon: "💬", title: "Online Consultation", img: "https://images.unsplash.com/photo-1587560699334-cc4ff634909a?w=1200&q=80&fit=crop", short: "Book a video or WhatsApp consultation from anywhere in the world." },
];

function servicesGrid(order, items, { title = "Our Services", subtitle = "Complete visa & immigration solutions under one roof.", bg, dark } = {}) {
  return {
    ...BASE, id: uid("svc"), type: "services", order,
    background: bg ? { type: "color", color: bg } : { type: "none" },
    templateVariant: dark ? "image-cards-dark" : "icon-cards-grid",
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

function buildServicePage(s) {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: `${s.icon} Premium Service`, title: s.title,
      subtitle: SLOGAN, description: s.short, img: s.img,
    }),
    {
      ...BASE, id: uid("feat"), type: "features", order: o++,
      templateVariant: "alternating-images",
      data: {
        title: s.title, subtitle: "", layout: "alternating", columns: 2, style: "minimal",
        items: [{
          id: uid("f"), title: `Expert ${s.title} — Zero Hassle`,
          description: `${s.short}\n\n✅ Handled by experienced immigration consultants\n✅ Complete document preparation & checklist\n✅ Embassy / authority liaison managed for you\n✅ Transparent process with real-time updates\n✅ Support from application to arrival\n✅ Multi-language assistance (English / Bangla / Arabic)`,
          imageUrl: s.img, icon: "",
        }],
      },
    },
    {
      ...BASE, id: uid("steps"), type: "steps", order: o++,
      background: { type: "color", color: LIGHT },
      data: {
        title: "How It Works", subtitle: `Your ${s.title} journey in 4 simple steps`,
        layout: "horizontal",
        items: [
          { id: uid("s"), step: "01", title: "Free Consultation", description: "Tell us your goal. We assess eligibility and recommend the best route — free." },
          { id: uid("s"), step: "02", title: "Document Preparation", description: "We provide a full checklist and prepare your application to embassy standard." },
          { id: uid("s"), step: "03", title: "Submission & Tracking", description: "We submit and manage appointments, keeping you updated at every stage." },
          { id: uid("s"), step: "04", title: "Approval & Departure", description: "Visa approved — we arrange tickets, insurance and assist your departure." },
        ],
      },
    },
    eligibilitySection(o++),
    ctaBlock(o++, `Ready for your ${s.title}?`, "Free consultation, expert guidance, zero hassle. Contact us today."),
    contactBlock(o++, "Apply Now", "Free consultation — no obligation"),
  ];
}

// ─── COUNTRIES ──────────────────────────────────────────────────────────────
// region groups + priority flag (full page) vs grid-only
const C = (name, slug, flag, region, visaTypes, processing, summary, priority = false, img = null) =>
  ({ name, slug, flag, region, visaTypes, processing, summary, priority, img });

const IMG = {
  germany: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80&fit=crop",
  portugal: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=800&q=80&fit=crop",
  italy: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80&fit=crop",
  france: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&fit=crop",
  spain: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80&fit=crop",
  hungary: "https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=800&q=80&fit=crop",
  poland: "https://images.unsplash.com/photo-1607427293702-036933bbf746?w=800&q=80&fit=crop",
  croatia: "https://images.unsplash.com/photo-1555990538-1e0c0e7e0b2b?w=800&q=80&fit=crop",
  romania: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop",
  serbia: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80&fit=crop",
  slovakia: "https://images.unsplash.com/photo-1559564484-e48b3e040ff4?w=800&q=80&fit=crop",
  uk: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80&fit=crop",
  saudi: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80&fit=crop",
  uae: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80&fit=crop",
  qatar: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80&fit=crop",
  kuwait: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80&fit=crop",
  oman: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80&fit=crop",
  bahrain: "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=800&q=80&fit=crop",
  malaysia: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80&fit=crop",
  australia: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80&fit=crop",
  canada: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80&fit=crop",
  nz: "https://images.unsplash.com/photo-1507097634215-e2325c1e9e25?w=800&q=80&fit=crop",
  generic: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80&fit=crop",
};

const SCHENGEN = ["Austria","Belgium","Croatia","Czech Republic","Denmark","Estonia","Finland","France","Germany","Greece","Hungary","Iceland","Italy","Latvia","Liechtenstein","Lithuania","Luxembourg","Malta","Netherlands","Norway","Poland","Portugal","Slovakia","Slovenia","Spain","Sweden","Switzerland","Bulgaria","Romania"];
const OTHER_EU = ["Albania","Andorra","Belarus","Bosnia and Herzegovina","Cyprus","Ireland","Kosovo","Moldova","Monaco","Montenegro","North Macedonia","San Marino","Serbia","United Kingdom","Ukraine"];
const GCC = ["Saudi Arabia","United Arab Emirates","Qatar","Kuwait","Bahrain","Oman"];
const OTHER_ME = ["Jordan","Lebanon","Iraq","Turkey","Egypt"];
const ASIA = ["India","Nepal","Pakistan","Sri Lanka","Maldives","Malaysia","Singapore","Thailand","Indonesia","Philippines","Vietnam","China","Japan","South Korea","Uzbekistan","Kazakhstan","Azerbaijan"];
const AFRICA = ["Morocco","Mauritius","South Africa","Kenya","Tanzania"];
const SKILLED = ["Australia","Canada","New Zealand"];

const FLAGS = { "Germany":"🇩🇪","Portugal":"🇵🇹","Italy":"🇮🇹","France":"🇫🇷","Spain":"🇪🇸","Hungary":"🇭🇺","Poland":"🇵🇱","Croatia":"🇭🇷","Romania":"🇷🇴","Serbia":"🇷🇸","Slovakia":"🇸🇰","United Kingdom":"🇬🇧","Saudi Arabia":"🇸🇦","United Arab Emirates":"🇦🇪","Qatar":"🇶🇦","Kuwait":"🇰🇼","Bahrain":"🇧🇭","Oman":"🇴🇲","Malaysia":"🇲🇾","Australia":"🇦🇺","Canada":"🇨🇦","New Zealand":"🇳🇿","Nepal":"🇳🇵","Sri Lanka":"🇱🇰","India":"🇮🇳","Thailand":"🇹🇭","Singapore":"🇸🇬","Turkey":"🇹🇷","Ireland":"🇮🇪","Netherlands":"🇳🇱","Greece":"🇬🇷","Austria":"🇦🇹","Belgium":"🇧🇪","Sweden":"🇸🇪","Switzerland":"🇨🇭","Norway":"🇳🇴","Denmark":"🇩🇰","Finland":"🇫🇮","Czech Republic":"🇨🇿","Bulgaria":"🇧🇬" };

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }
function flag(name) { return FLAGS[name] || "🏳️"; }

// priority full-page countries with rich data
const PRIORITY = {
  "Germany": { visa: ["Work Permit","Job Seeker Visa","EU Blue Card","Student Visa"], proc: "8–12 weeks", img: IMG.germany, sum: "Europe's largest economy — strong demand for skilled & semi-skilled workers." },
  "Portugal": { visa: ["D1 Work Visa","Job Seeker","Residence"], proc: "8–10 weeks", img: IMG.portugal, sum: "Fast-growing work-permit route with a clear path to residence." },
  "Hungary": { visa: ["Work Permit","Residence"], proc: "6–10 weeks", img: IMG.hungary, sum: "Reliable Central-European work permits across multiple sectors." },
  "Slovakia": { visa: ["Work Permit","Residence"], proc: "6–10 weeks", img: IMG.slovakia, sum: "100% legal work-permit process with solid employer demand." },
  "Italy": { visa: ["Seasonal Work","Long-Stay","Tourist"], proc: "8–12 weeks", img: IMG.italy, sum: "Flusso work visas and long-stay options across Italy." },
  "Romania": { visa: ["Work Visa","Tourist"], proc: "2–4 weeks", img: IMG.romania, sum: "Fast work-visa processing with EU access." },
  "Serbia": { visa: ["Work Permit","Tourist"], proc: "3–5 weeks", img: IMG.serbia, sum: "Quick work-permit approvals — popular gateway to Europe." },
  "Croatia": { visa: ["Work Permit","Residence"], proc: "6–8 weeks", img: IMG.croatia, sum: "Newest Schengen member with growing labour demand." },
  "Poland": { visa: ["Work Permit","Tourist"], proc: "6–10 weeks", img: IMG.poland, sum: "High-volume work-permit destination across industry & logistics." },
  "United Kingdom": { visa: ["Skilled Worker","Student","Visit"], proc: "3–8 weeks", img: IMG.uk, sum: "Skilled Worker, Health & Care and Student routes to the UK." },
  "Saudi Arabia": { visa: ["Work Visa","Visit","Umrah"], proc: "2–4 weeks", img: IMG.saudi, sum: "Highest-demand Gulf destination — fast iqama after arrival." },
  "United Arab Emirates": { visa: ["Employment","Visit","Transit"], proc: "2–4 weeks", img: IMG.uae, sum: "Dubai & Abu Dhabi employment and visit visas." },
  "Qatar": { visa: ["Work Visa","Visit"], proc: "3–6 weeks", img: IMG.qatar, sum: "Work and family visas with strong construction & service demand." },
  "Kuwait": { visa: ["Work Visa","Visit"], proc: "3–6 weeks", img: IMG.kuwait, sum: "Employment visas across services and domestic sectors." },
  "Oman": { visa: ["Work Visa","Tourist"], proc: "3–5 weeks", img: IMG.oman, sum: "Work and tourist visas for the Sultanate of Oman." },
  "Bahrain": { visa: ["Work Visa","Visit"], proc: "3–5 weeks", img: IMG.bahrain, sum: "Flexible work and visit visa options in Bahrain." },
  "Malaysia": { visa: ["e-Visa","Work Permit","Tourist"], proc: "3–5 days e-visa", img: IMG.malaysia, sum: "e-Visa, work and tour packages to Malaysia." },
  "Australia": { visa: ["Skilled Migration","Student","Visit"], proc: "3–9 months", img: IMG.australia, sum: "Points-based skilled migration — Live • Work • Belong." },
  "Canada": { visa: ["Express Entry","Study Permit","Visit"], proc: "3–9 months", img: IMG.canada, sum: "Express Entry & PNP skilled immigration to Canada." },
  "New Zealand": { visa: ["Skilled Migrant","Student","Visit"], proc: "3–9 months", img: IMG.nz, sum: "Skilled Migrant Category for a brighter future in NZ." },
};

function regionOf(name) {
  if (SKILLED.includes(name)) return "Skilled Migration";
  if (SCHENGEN.includes(name)) return "Schengen Europe";
  if (OTHER_EU.includes(name)) return "Other Europe";
  if (GCC.includes(name)) return "GCC";
  if (OTHER_ME.includes(name)) return "Other Middle East";
  if (ASIA.includes(name)) return "Asia";
  if (AFRICA.includes(name)) return "Africa";
  return "Other";
}

function allCountryNames() {
  // dedupe; skilled overrides region
  const set = [];
  for (const n of [...SKILLED, ...SCHENGEN, ...OTHER_EU, ...GCC, ...OTHER_ME, ...ASIA, ...AFRICA]) {
    if (!set.includes(n)) set.push(n);
  }
  return set;
}

function countryGridItems() {
  return allCountryNames().map((name) => {
    const p = PRIORITY[name];
    return {
      id: uid("cg"), country: name, flagEmoji: flag(name), region: regionOf(name),
      image: p?.img || IMG.generic,
      visaTypes: p?.visa || ["Tourist Visa", "Visit Visa"],
      processingTime: p?.proc || "Varies",
      summary: p?.sum || `Visa & immigration support for ${name}.`,
      href: `/countries/${slugify(name)}`,
    };
  });
}

function buildCountriesPage() {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: "🌍 50+ Destinations Worldwide",
      title: "Countries We Cover", subtitle: SLOGAN,
      description: "Schengen Europe, GCC, Asia, Africa and skilled migration to Australia, Canada & New Zealand. Click any country for visa details.",
      img: IMG.generic,
      primary: { label: "Check Eligibility", url: "/eligibility", variant: "primary" },
    }),
    {
      ...BASE, id: uid("cg"), type: "country_grid", order: o++,
      background: { type: "color", color: LIGHT },
      data: {
        title: "All Destinations", subtitle: "Grouped by region — visa types & processing time at a glance.",
        columns: 4, groupByRegion: true, accentColor: PRIMARY,
        items: countryGridItems(),
      },
    },
    eligibilitySection(o++),
    ctaBlock(o++, "Don't See Your Country?", "We cover 50+ destinations. Contact us and we'll confirm your options."),
    contactBlock(o++),
  ];
}

function buildCountryPage(name) {
  const p = PRIORITY[name] || { visa: ["Tourist Visa","Visit Visa"], proc: "Varies", img: IMG.generic, sum: `Visa & immigration services for ${name}.` };
  const region = regionOf(name);
  let o = 0;
  const visaList = (p.visa || []).map((v) => `✅ ${v}`).join("\n");
  return [
    heroBlock(o++, {
      badge: `${flag(name)} ${region}`, title: `${name} Visa & Immigration`,
      subtitle: SLOGAN, description: p.sum, img: p.img,
    }),
    {
      ...BASE, id: uid("stats"), type: "stats", order: o++,
      padding: { top: 48, right: 0, bottom: 48, left: 0 },
      background: { type: "color", color: PRIMARY },
      data: {
        title: "", subtitle: "", layout: "row", columns: 3, animate: false, style: "plain",
        items: [
          { id: uid("st"), value: p.proc, label: "Processing Time" },
          { id: uid("st"), value: (p.visa?.length || 1) + "+", label: "Visa Types" },
          { id: uid("st"), value: "Full", label: "End-to-End Support" },
        ],
      },
    },
    {
      ...BASE, id: uid("feat"), type: "features", order: o++,
      templateVariant: "alternating-images",
      data: {
        title: `${name} — Visa Options & Process`, subtitle: "",
        layout: "alternating", columns: 2, style: "minimal",
        items: [{
          id: uid("f"), title: `Work, Study or Settle in ${name}`,
          description: `${p.sum}\n\nVisa categories we handle:\n${visaList}\n\nProcessing time: ${p.proc}\n\n✅ Complete document preparation\n✅ Embassy / authority appointment management\n✅ Air ticket, insurance & accommodation support\n✅ Multi-language assistance (EN / BN / AR)`,
          imageUrl: p.img, icon: "",
        }],
      },
    },
    {
      ...BASE, id: uid("steps"), type: "steps", order: o++,
      background: { type: "color", color: LIGHT },
      data: {
        title: "Application Process", subtitle: `Your route to ${name}`, layout: "horizontal",
        items: [
          { id: uid("s"), step: "01", title: "Eligibility Check", description: "Free assessment of your profile for the best visa category." },
          { id: uid("s"), step: "02", title: "Documents", description: "Full checklist, preparation, translation and legalization." },
          { id: uid("s"), step: "03", title: "Submission", description: "Application filed and appointments managed by our team." },
          { id: uid("s"), step: "04", title: "Approval", description: "Visa granted — we arrange tickets and departure support." },
        ],
      },
    },
    eligibilitySection(o++),
    ctaBlock(o++, `Apply for your ${name} visa today`, "Free consultation with our immigration experts. Zero hassle."),
    contactBlock(o++, `${name} Visa Enquiry`, "Free consultation — no obligation"),
  ];
}

// ─── MANAGEMENT ─────────────────────────────────────────────────────────────
const MGMT = [
  { name: "Mohammed Masud Rana", role: "Owner / Founder & Chairman", phone: "+8801711961149", key: "mohammed-masud-rana-chairman" },
  { name: "Sharmin Akter", role: "Managing Director (MD)", phone: "+8801711145428", key: "sharmin-akter-md" },
  { name: "Chief Executive Officer", role: "Chief Executive Officer (CEO)", phone: "+8801323908462", key: "ceo" },
  { name: "Shahedul Anowar Ashraful", role: "General Manager (GM)", phone: "+8801806224496", key: "shahedul-anowar-ashraful-gm" },
  { name: "Ibrahim Khan", role: "Operations Manager", phone: "+8801883302213", key: "ibrahim-khan-operations-manager" },
  { name: "Ashraful Alam", role: "HR Manager", phone: "+374 777 910527", key: "ashraful-alam-hr-manager" },
  { name: "Suva Akter", role: "Accountant", phone: "+961 78 776 000", key: "suva-akter-accountant" },
  { name: "Md Asaduzzaman", role: "Finance Manager", phone: "+8801729635551", key: "md-asaduzzaman-finance-manager" },
  { name: "Fujlulol Huq", role: "IT Manager", phone: "+880 1860 753392", key: "fujlulol-huq-it-manager" },
];

function teamMembers(list) {
  return list.map((m) => ({
    id: uid("tm"), name: m.name, role: m.role,
    bio: m.phone ? `📞 ${m.phone}` : "",
    avatar: mgmtUrls[m.key] || "",
  }));
}

function buildManagementPage() {
  let o = 0;
  return [
    heroBlock(o++, {
      badge: "👥 Our Leadership", title: "Management Team",
      subtitle: SLOGAN, description: "Meet the dedicated professionals behind Life Settle Travel & Tourism.",
      img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80&fit=crop",
      primary: { label: "Contact Us", url: "/contact", variant: "primary" },
    }),
    {
      ...BASE, id: uid("team"), type: "team", order: o++,
      templateVariant: "avatar-cards",
      data: {
        title: "Leadership & Management", subtitle: "Ranked by organizational hierarchy",
        layout: "cards", columns: 3, showBio: true, showSocial: false,
        members: teamMembers(MGMT),
      },
    },
    ctaBlock(o++, "Work With a Team You Can Trust", "Our experts are ready to guide your visa & immigration journey."),
    contactBlock(o++),
  ];
}

// ─── HOME ───────────────────────────────────────────────────────────────────
function buildHome() {
  let o = 0;
  const topServices = SERVICES.slice(0, 9);
  const priorityCountries = ["Germany","Portugal","Saudi Arabia","United Arab Emirates","Canada","Australia","Malaysia","United Kingdom"];
  return [
    heroBlock(o++, {
      badge: "🌍 Trusted by 5,000+ Families · Zero Advance",
      title: "Your Global Journey\nStarts Here",
      subtitle: SLOGAN,
      description: "Visa processing · Work permits · Skilled migration · Tour & travel — for 50+ countries.",
      img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1800&q=90&fit=crop",
      primary: { label: "🚀 Free Consultation", url: "/contact", variant: "primary" },
      secondary: { label: "Check Eligibility →", url: "/eligibility", variant: "outline" },
    }),
    {
      ...BASE, id: uid("stats"), type: "stats", order: o++,
      padding: { top: 36, right: 0, bottom: 36, left: 0 },
      background: { type: "color", color: SECONDARY },
      data: {
        title: "", subtitle: "", layout: "row", columns: 4, animate: true, style: "plain",
        items: [
          { id: uid("st"), value: "5,000+", label: "Visas Approved" },
          { id: uid("st"), value: "50+", label: "Countries" },
          { id: uid("st"), value: "16", label: "Services" },
          { id: uid("st"), value: "5★", label: "Client Rating" },
        ],
      },
    },
    servicesGrid(o++, topServices, { bg: "#ffffff", title: "Our Services", subtitle: "Complete visa & immigration solutions under one roof." }),
    {
      ...BASE, id: uid("svccta"), type: "cta", order: o++,
      padding: { top: 0, right: 0, bottom: 56, left: 0 },
      background: { type: "color", color: "#ffffff" },
      data: { title: "", description: "16 services across visa, immigration and travel.", primaryButton: { label: "View All Services →", url: "/services" }, layout: "centered" },
    },
    {
      ...BASE, id: uid("cg"), type: "country_grid", order: o++,
      background: { type: "color", color: DARK },
      data: {
        title: "Popular Destinations",
        subtitle: "Work, study, migrate or travel — explore our top destinations.",
        columns: 4, groupByRegion: false, accentColor: GOLD,
        items: priorityCountries.map((name) => ({
          id: uid("cg"), country: name, flagEmoji: flag(name), region: regionOf(name),
          image: PRIORITY[name]?.img || IMG.generic, visaTypes: PRIORITY[name]?.visa?.slice(0,2) || ["Visa"],
          processingTime: PRIORITY[name]?.proc || "", summary: PRIORITY[name]?.sum || "",
          href: `/countries/${slugify(name)}`,
        })),
      },
    },
    {
      ...BASE, id: uid("allc"), type: "cta", order: o++,
      padding: { top: 0, right: 0, bottom: 56, left: 0 },
      background: { type: "color", color: DARK },
      data: { title: "", description: "We process visas for 50+ countries worldwide.", primaryButton: { label: "View All Countries →", url: "/countries" }, layout: "centered" },
    },
    eligibilitySection(o++),
    {
      ...BASE, id: uid("feat"), type: "features", order: o++,
      background: { type: "color", color: "#ffffff" },
      templateVariant: "alternating-images",
      data: {
        title: "Why Choose Life Settle", subtitle: "",
        layout: "alternating", columns: 2, style: "minimal",
        items: [{
          id: uid("f"), title: "A Trusted International Visa & Immigration Brand",
          description: "We don't just book tickets — we build futures. From Schengen work permits to skilled migration in Canada and Australia, our experts manage every step.\n\n✅ Zero advance — pay after visa approval\n✅ 50+ countries · 16 specialized services\n✅ Document prep, translation & legalization\n✅ Multi-language support (English / Bangla / Arabic)\n✅ Real-time application tracking\n✅ Complete support — from application to arrival",
          imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&q=85&fit=crop", icon: "",
        }],
      },
    },
    {
      ...BASE, id: uid("steps"), type: "steps", order: o++,
      background: { type: "color", color: LIGHT },
      data: {
        title: "How It Works", subtitle: "Four simple steps to your destination", layout: "horizontal",
        items: [
          { id: uid("s"), step: "01", title: "Free Consultation", description: "Tell us your goal — we assess eligibility and recommend the best route." },
          { id: uid("s"), step: "02", title: "Documents", description: "Complete checklist, preparation, translation and legalization." },
          { id: uid("s"), step: "03", title: "Submission", description: "We file your application and manage embassy appointments." },
          { id: uid("s"), step: "04", title: "Approval", description: "Visa granted — tickets, insurance and departure support arranged." },
        ],
      },
    },
    {
      ...BASE, id: uid("team"), type: "team", order: o++,
      background: { type: "color", color: "#ffffff" },
      templateVariant: "avatar-cards",
      data: {
        title: "Meet Our Leadership", subtitle: "Experienced professionals you can trust",
        layout: "cards", columns: 4, showBio: true, showSocial: false,
        members: teamMembers(MGMT.slice(0, 4)),
      },
    },
    {
      ...BASE, id: uid("tes"), type: "testimonials", order: o++,
      background: { type: "color", color: LIGHT },
      templateVariant: "quote-cards",
      data: {
        title: "Success Stories", subtitle: "Real journeys from our clients", layout: "grid",
        items: [
          { id: uid("t"), name: "Rakibul Islam", role: "Factory Worker", company: "Now in Serbia 🇷🇸", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&crop=face", content: "Life Settle got my Europe work permit smoothly. Zero advance — paid only after the visa was in my hand. Truly trustworthy.", rating: 5 },
          { id: uid("t"), name: "Fatema Begum", role: "Care Worker", company: "Now in Saudi Arabia 🇸🇦", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&crop=face", content: "Free visa to Saudi Arabia and iqama within days of arrival. The team handled everything professionally.", rating: 5 },
          { id: uid("t"), name: "Mahmudul Hassan", role: "Civil Engineer", company: "Canada Express Entry 🇨🇦", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&fit=crop&crop=face", content: "Guided me through Express Entry step by step. Now settled in Canada with my family. Highly recommended.", rating: 5 },
        ],
      },
    },
    {
      ...BASE, id: uid("faq"), type: "faq", order: o++,
      background: { type: "color", color: "#ffffff" },
      templateVariant: "accordion-bordered",
      data: {
        title: "Frequently Asked Questions", subtitle: "", layout: "accordion", allowMultiple: false,
        items: [
          { id: uid("f"), question: "Do you take advance payment?", answer: "For most work-permit routes you pay only after visa approval. Service-specific fees are always explained upfront with full transparency." },
          { id: uid("f"), question: "Which countries do you cover?", answer: "50+ destinations: all 29 Schengen countries, other European nations, all 6 GCC states, major Asian & African countries, plus skilled migration to Australia, Canada and New Zealand." },
          { id: uid("f"), question: "Can you help with skilled migration to Canada or Australia?", answer: "Yes. We handle Express Entry, Provincial Nominee Programs, and Australian/NZ points-based skilled migration — eligibility assessment, documentation and filing." },
          { id: uid("f"), question: "Do you provide document translation and legalization?", answer: "Yes — certified translation (English, Arabic, European languages), attestation, apostille and embassy legalization." },
          { id: uid("f"), question: "How do I start?", answer: `WhatsApp ${PHONE}, call us, use our free Eligibility Checker, or visit our Dhaka office. Free consultation, no obligation.` },
        ],
      },
    },
    ctaBlock(o++, "Ready to Start Your Journey?", "Free consultation · Expert guidance · 50+ countries. Contact us today."),
    contactBlock(o++),
  ];
}

// ─── SIMPLE / LEGAL PAGES ───────────────────────────────────────────────────
function legalPage(title, body) {
  let o = 0;
  return [
    heroBlock(o++, { badge: "Legal", title, subtitle: SLOGAN, description: "", img: IMG.generic,
      primary: { label: "Contact Us", url: "/contact", variant: "primary" }, secondary: { label: "Home", url: "/", variant: "outline" } }),
    { ...BASE, id: uid("txt"), type: "text", order: o++, data: { content: body, alignment: "left", columns: 1 } },
    contactBlock(o++),
  ];
}

function buildEligibilityPage() {
  let o = 0;
  return [
    heroBlock(o++, { badge: "✅ Free Tool", title: "Visa Eligibility Checker", subtitle: SLOGAN,
      description: "Find out in 2 minutes which visa route fits you best — completely free.", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80&fit=crop",
      primary: { label: "Start Below ↓", url: "#elig", variant: "primary" }, secondary: { label: "WhatsApp", url: WA, variant: "outline" } }),
    eligibilitySection(o++),
    ctaBlock(o++, "Need Personal Guidance?", "Talk to our immigration experts directly."),
    contactBlock(o++),
  ];
}

function buildTrackPage() {
  let o = 0;
  return [
    heroBlock(o++, { badge: "🔎 Application Status", title: "Track Your Application", subtitle: SLOGAN,
      description: "Enter your reference number to see live status of your visa application.", img: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=1200&q=80&fit=crop",
      primary: { label: "Track Below ↓", url: "#track", variant: "primary" }, secondary: { label: "WhatsApp", url: WA, variant: "outline" } }),
    { ...BASE, id: uid("track"), type: "status_tracker", order: o++, background: { type: "color", color: LIGHT },
      data: { title: "Check Application Status", subtitle: "Enter your passport or reference number below.", placeholder: "Passport / reference number", helpText: "Your reference number is provided when you submit an application with us.", submitLabel: "Track Status", accentColor: PRIMARY } },
    ctaBlock(o++, "Questions About Your Application?", "Our team is one message away on WhatsApp."),
    contactBlock(o++),
  ];
}

function buildAbout() {
  let o = 0;
  return [
    heroBlock(o++, { badge: "About Life Settle", title: "A Trusted Visa & Immigration Brand", subtitle: SLOGAN,
      description: "From dreams to destinations — we make it possible.", img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80&fit=crop",
      primary: { label: "Contact Us", url: "/contact", variant: "primary" }, secondary: { label: "Our Services", url: "/services", variant: "outline" } }),
    { ...BASE, id: uid("feat"), type: "features", order: o++, templateVariant: "alternating-images",
      data: { title: "Who We Are", subtitle: "", layout: "alternating", columns: 2, style: "minimal",
        items: [{ id: uid("f"), title: "Your Trusted Global Partner", description: "Life Settle Travel & Tourism is building an international-standard Visa & Immigration brand. We help individuals and families work, study, settle and travel across 50+ countries.\n\n✅ Zero advance on work-permit routes\n✅ 16 specialized services\n✅ Skilled migration to AU / CA / NZ\n✅ Document translation & legalization\n✅ Multi-language support (EN / BN / AR)\n✅ Complete support from application to arrival", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=85&fit=crop", icon: "" }] } },
    { ...BASE, id: uid("stats"), type: "stats", order: o++, padding: { top: 48, right: 0, bottom: 48, left: 0 }, background: { type: "color", color: PRIMARY },
      data: { title: "", subtitle: "", layout: "row", columns: 4, style: "plain", animate: true,
        items: [ { id: uid("st"), value: "5,000+", label: "Visas Approved" }, { id: uid("st"), value: "50+", label: "Countries" }, { id: uid("st"), value: "16", label: "Services" }, { id: uid("st"), value: "5★", label: "Rating" } ] } },
    { ...BASE, id: uid("team"), type: "team", order: o++, templateVariant: "avatar-cards",
      data: { title: "Our Leadership", subtitle: "Meet the management team", layout: "cards", columns: 4, showBio: true, showSocial: false, members: teamMembers(MGMT.slice(0, 4)) } },
    ctaBlock(o++, "Start Your Journey With Us", "Free consultation with experienced immigration consultants."),
    contactBlock(o++),
  ];
}

function buildServicesOverview() {
  let o = 0;
  return [
    heroBlock(o++, { badge: "16 Services", title: "Our Services", subtitle: SLOGAN,
      description: "Complete visa, immigration and travel solutions under one roof.", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80&fit=crop",
      primary: { label: "Free Consultation", url: "/contact", variant: "primary" }, secondary: { label: "Check Eligibility", url: "/eligibility", variant: "outline" } }),
    servicesGrid(o++, SERVICES.slice(0, 9), { bg: "#ffffff", title: "Visa & Immigration", subtitle: "Our core visa and immigration services." }),
    servicesGrid(o++, SERVICES.slice(9), { bg: LIGHT, title: "Travel & Support Services", subtitle: "Everything else for a smooth journey." }),
    eligibilitySection(o++),
    ctaBlock(o++, "Not Sure Which Service You Need?", "Talk to our experts — we'll guide you to the right solution."),
    contactBlock(o++),
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
  console.log("Life Settle v4 seed starting...\n");

  const pages = [];
  pages.push(["home", "Home", buildHome()]);
  pages.push(["about", "About Us", buildAbout()]);
  pages.push(["services", "Services", buildServicesOverview()]);
  pages.push(["management", "Management", buildManagementPage()]);
  pages.push(["eligibility", "Visa Eligibility Checker", buildEligibilityPage()]);
  pages.push(["track", "Track Application", buildTrackPage()]);
  pages.push(["countries", "All Countries", buildCountriesPage()]);
  pages.push(["contact", "Contact", [
    heroBlock(0, { badge: "📞 Get In Touch", title: "Contact Us", subtitle: SLOGAN, description: "Free consultation — we respond within 24 hours.", img: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1200&q=80&fit=crop", primary: { label: "Call Now", url: `tel:${PHONE}`, variant: "primary" }, secondary: { label: "WhatsApp", url: WA, variant: "outline" } }),
    contactBlock(1, "Send Us a Message", "We're here to help with any visa or travel question"),
  ]]);

  // 16 service pages
  for (const s of SERVICES) pages.push([`services/${s.slug}`, s.title, buildServicePage(s)]);

  // all country pages
  for (const name of allCountryNames()) pages.push([`countries/${slugify(name)}`, `${name} Visa`, buildCountryPage(name)]);

  // legal stubs
  pages.push(["privacy", "Privacy Policy", legalPage("Privacy Policy", "<p>Life Settle Travel &amp; Tourism respects your privacy. We collect only the information necessary to process your visa, immigration and travel requests, and never sell your data. For any privacy questions, contact us at " + EMAIL + ".</p>")]);
  pages.push(["terms", "Terms & Conditions", legalPage("Terms & Conditions", "<p>By using our services you agree to our standard terms. Service fees, processing times and government decisions are subject to the respective embassy and immigration authorities. Contact us for full details.</p>")]);
  pages.push(["refund", "Refund Policy", legalPage("Refund Policy", "<p>Refund eligibility depends on the stage of your application and third-party (embassy, airline, insurer) charges already incurred. Government and embassy fees are non-refundable. Contact us to discuss your specific case.</p>")]);
  pages.push(["disclaimer", "Disclaimer", legalPage("Disclaimer", "<p>Life Settle Travel &amp; Tourism provides consultancy and processing assistance. Final visa and immigration decisions rest solely with the relevant government authorities. We do not guarantee approval.</p>")]);

  let ok = 0, fail = 0;
  for (const [slug, title, blocks] of pages) {
    const err = await upsertPage(slug, title, blocks, now);
    if (err) { console.error("✗", slug, err.message); fail++; }
    else { ok++; if (ok % 10 === 0) console.log(`  …${ok}/${pages.length}`); }
  }
  console.log(`\n✓ Pages upserted: ${ok} ok, ${fail} failed (total ${pages.length})`);

  // global header/footer + identity rebrand
  const { error: idErr } = await sb.from("site_identity").update({
    logo_url: LOGO_URL, logo_alt: "Life Settle Travel & Tourism", logo_width: 160,
    site_name: "Life Settle Travel & Tourism", tagline: SLOGAN,
    active_template_slug: "life-settle",
    primary_color: PRIMARY, secondary_color: SECONDARY,
    global_header: globalHeader(), global_footer: globalFooter(),
    updated_at: now,
  }).eq("tenant_id", TENANT_ID);
  if (idErr) console.error("site_identity:", idErr.message);
  else console.log("✓ site_identity rebranded (blue/white/gold), global header + footer set");

  console.log("\n✅ Done. Visit https://lifesettle.passivecoder.com/");
}

run().catch(console.error);
