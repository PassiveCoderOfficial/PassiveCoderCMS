/**
 * Life Settle v2 seed — colorful home redesign, service pages, country pages,
 * all-countries page, popular destinations section, global header/footer.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "636793b3-9104-4e15-9415-eef346a9957a";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2,6)}`; }

const PRIMARY = "#1a5c38";
const SECONDARY = "#c9a84c";
const DARK = "#0f2418";

const BASE = {
  visible: true, width: "full",
  padding: { top: 80, right: 0, bottom: 80, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" },
};
const ZERO_PAD = { top: 0, right: 0, bottom: 0, left: 0 };

// ─── NAV (used on all inner pages, references global nav) ──────────────────
// We build a global_header block stored in site_identity
// Pages no longer need nav block individually if global is set.
// But for backward compat we also keep nav on old pages.

const NAV_ITEMS = [
  { id: "n1", label: "Home", url: "/", children: [] },
  {
    id: "n2", label: "Services", url: "/services", children: [
      { id: "n2a", label: "Visa Processing", url: "/services/visa-processing" },
      { id: "n2b", label: "Work Permit", url: "/services/work-permit" },
      { id: "n2c", label: "Manpower Recruitment", url: "/services/manpower" },
      { id: "n2d", label: "Flight Booking", url: "/services/flight-booking" },
      { id: "n2e", label: "Tour Packages", url: "/services/tour-packages" },
      { id: "n2f", label: "Hotel Booking", url: "/services/hotel-booking" },
    ]
  },
  {
    id: "n3", label: "Destinations", url: "/countries", children: [
      { id: "n3a", label: "All Countries", url: "/countries" },
      { id: "n3b", label: "Europe", url: "/countries#europe" },
      { id: "n3c", label: "GCC / Middle East", url: "/countries#gcc" },
      { id: "n3d", label: "Asia", url: "/countries#asia" },
    ]
  },
  { id: "n4", label: "About Us", url: "/about", children: [] },
  { id: "n5", label: "Contact", url: "/contact", children: [] },
];

function navBlock(order = 0) {
  return {
    ...BASE, id: uid("nav"), type: "navigation", order,
    padding: ZERO_PAD,
    templateVariant: "solid-with-cta",
    data: {
      logoText: "Life Settle Travel And Tourism",
      items: NAV_ITEMS,
      sticky: true, transparent: false, style: "default",
      backgroundColor: PRIMARY, textColor: "#ffffff",
      showCta: true, ctaLabel: "Free Consultation", ctaUrl: "#contact",
    },
  };
}

// ─── FOOTER BLOCK ──────────────────────────────────────────────────────────
function footerBlock(order = 99) {
  return {
    ...BASE, id: uid("footer"), type: "footer", order,
    padding: ZERO_PAD,
    data: {
      logoText: "Life Settle Travel And Tourism",
      tagline: "Our Aim Is Your Journey — Trusted visa, work permit & travel partner since 2020.",
      style: "dark",
      backgroundColor: DARK,
      accentColor: SECONDARY,
      textColor: "#e5e7eb",
      copyrightText: `© {year} Life Settle Travel And Tourism. All rights reserved.`,
      copyrightYear: true,
      showNewsletter: false,
      socials: [
        { platform: "facebook", url: "https://www.facebook.com/ShiblyFacilitiesManagementServiceLtd" },
        { platform: "whatsapp", url: "https://wa.me/8801750599917" },
      ],
      columns: [
        {
          id: uid("fc"), heading: "Services",
          links: [
            { id: uid("fl"), label: "Visa Processing", url: "/services/visa-processing" },
            { id: uid("fl"), label: "Work Permit", url: "/services/work-permit" },
            { id: uid("fl"), label: "Manpower Recruitment", url: "/services/manpower" },
            { id: uid("fl"), label: "Flight Booking", url: "/services/flight-booking" },
            { id: uid("fl"), label: "Tour Packages", url: "/services/tour-packages" },
            { id: uid("fl"), label: "Hotel Booking", url: "/services/hotel-booking" },
          ]
        },
        {
          id: uid("fc"), heading: "Destinations",
          links: [
            { id: uid("fl"), label: "All Countries", url: "/countries" },
            { id: uid("fl"), label: "Serbia", url: "/countries/serbia" },
            { id: uid("fl"), label: "Germany", url: "/countries/germany" },
            { id: uid("fl"), label: "Portugal", url: "/countries/portugal" },
            { id: uid("fl"), label: "Saudi Arabia", url: "/countries/saudi-arabia" },
            { id: uid("fl"), label: "Dubai — UAE", url: "/countries/dubai-uae" },
          ]
        },
        {
          id: uid("fc"), heading: "Company",
          links: [
            { id: uid("fl"), label: "About Us", url: "/about" },
            { id: uid("fl"), label: "Contact", url: "/contact" },
            { id: uid("fl"), label: "Facebook Page", url: "https://www.facebook.com/ShiblyFacilitiesManagementServiceLtd" },
          ]
        },
      ],
      bottomLinks: [
        { id: uid("bl"), label: "Privacy Policy", url: "/privacy" },
        { id: uid("bl"), label: "Terms of Service", url: "/terms" },
      ],
    },
  };
}

// ─── COUNTRIES DATA ────────────────────────────────────────────────────────
const COUNTRIES = [
  // Europe Schengen
  { slug: "germany", name: "Germany", flag: "🇩🇪", region: "europe", category: "Schengen Europe", image: "https://images.unsplash.com/photo-1476900164809-ff19b8ae5968?w=800&q=80&fit=crop", summary: "Work permits & visa for one of Europe's strongest economies.", visaTypes: ["Work Permit", "Job Seeker Visa", "Schengen Tourist Visa"], jobs: ["Factory Worker", "Welder", "Electrician", "Nurse", "Engineer"], salary: "€2,000–€3,500/month", processingTime: "3–4 months", heroImg: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&q=80&fit=crop" },
  { slug: "portugal", name: "Portugal", flag: "🇵🇹", region: "europe", category: "Schengen Europe", image: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=800&q=80&fit=crop", summary: "D1 work visa with fast processing — pay after approval.", visaTypes: ["D1 Work Visa", "Schengen Tourist Visa", "Job Seeker Visa"], jobs: ["Factory Worker", "Construction Worker", "Cleaner", "Restaurant Staff"], salary: "€820–€1,200/month", processingTime: "2 months", heroImg: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80&fit=crop" },
  { slug: "italy", name: "Italy", flag: "🇮🇹", region: "europe", category: "Schengen Europe", image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80&fit=crop", summary: "Seasonal work, tourist and long-stay visa processing.", visaTypes: ["Seasonal Work Visa", "Tourist Visa", "Long-Stay Visa"], jobs: ["Agriculture Worker", "Factory Worker", "Hotel Staff"], salary: "€900–€1,400/month", processingTime: "2–3 months", heroImg: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80&fit=crop" },
  { slug: "romania", name: "Romania", flag: "🇷🇴", region: "europe", category: "Schengen Europe", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop", summary: "Fast 7–8 day visa processing with work permit options.", visaTypes: ["Work Visa", "Tourist Visa", "Transit Visa"], jobs: ["Construction Worker", "Factory Worker", "Welder", "Carpenter"], salary: "€700–€1,100/month", processingTime: "7–8 days", heroImg: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1200&q=80&fit=crop" },
  { slug: "france", name: "France", flag: "🇫🇷", region: "europe", category: "Schengen Europe", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&fit=crop", summary: "Schengen visa for tourism, business and work.", visaTypes: ["Schengen Tourist Visa", "Work Visa", "Business Visa"], jobs: ["Chef", "Hotel Staff", "Agriculture Worker", "Factory Worker"], salary: "€1,200–€2,000/month", processingTime: "2–3 months", heroImg: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80&fit=crop" },
  { slug: "greece", name: "Greece", flag: "🇬🇷", region: "europe", category: "Schengen Europe", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80&fit=crop", summary: "Tourism visa and seasonal work opportunities.", visaTypes: ["Schengen Tourist Visa", "Seasonal Work Visa"], jobs: ["Hotel Staff", "Restaurant Worker", "Agriculture Worker"], salary: "€830–€1,200/month", processingTime: "2–3 months", heroImg: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&q=80&fit=crop" },
  // Europe Non-Schengen
  { slug: "serbia", name: "Serbia", flag: "🇷🇸", region: "europe", category: "Non-Schengen Europe", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80&fit=crop", summary: "Fast work permit — approval in 7 days, sticker in 25 days.", visaTypes: ["Work Permit", "Tourist Visa", "Business Visa"], jobs: ["Factory Worker (Furniture)", "Factory Worker (Shoe)", "Cleaner", "Construction Worker"], salary: "€750–€800/month", processingTime: "7 days approval, 25 days sticker", heroImg: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200&q=80&fit=crop" },
  { slug: "north-macedonia", name: "North Macedonia", flag: "🇲🇰", region: "europe", category: "Non-Schengen Europe", image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=80&fit=crop", summary: "Work permit and visa processing with competitive salaries.", visaTypes: ["Work Permit", "Tourist Visa"], jobs: ["Factory Worker", "Construction Worker", "Farm Worker"], salary: "€600–€900/month", processingTime: "4–6 weeks", heroImg: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80&fit=crop" },
  { slug: "armenia", name: "Armenia", flag: "🇦🇲", region: "europe", category: "Non-Schengen Europe", image: "https://images.unsplash.com/photo-1566288623394-377af472d81b?w=800&q=80&fit=crop", summary: "Tourism and business visa processing for Armenia.", visaTypes: ["Tourist Visa", "Business Visa", "e-Visa"], jobs: ["IT Professional", "Teacher", "Business"], salary: "N/A", processingTime: "3–5 days", heroImg: "https://images.unsplash.com/photo-1610642372651-fe6e4bf53d05?w=1200&q=80&fit=crop" },
  { slug: "belarus", name: "Belarus", flag: "🇧🇾", region: "europe", category: "Non-Schengen Europe", image: "https://images.unsplash.com/photo-1509660933844-6910e12765a0?w=800&q=80&fit=crop", summary: "Visa processing for Belarus with expert guidance.", visaTypes: ["Tourist Visa", "Business Visa", "Work Visa"], jobs: ["Factory Worker", "Engineer", "Driver"], salary: "USD 400–700/month", processingTime: "2–3 weeks", heroImg: "https://images.unsplash.com/photo-1509660933844-6910e12765a0?w=1200&q=80&fit=crop" },
  // GCC
  { slug: "saudi-arabia", name: "Saudi Arabia", flag: "🇸🇦", region: "gcc", category: "GCC Middle East", image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80&fit=crop", summary: "Free visa with 3 months iqama — iqama within 72 hours of arrival.", visaTypes: ["Work Visa", "Visit Visa", "Umrah Visa"], jobs: ["Load/Unload Worker", "Cleaner", "Factory Worker", "Warehouse Worker", "Office Helper"], salary: "SAR 900–1,500/month", processingTime: "72 hours iqama after arrival", heroImg: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=1200&q=80&fit=crop" },
  { slug: "dubai-uae", name: "Dubai — UAE", flag: "🇦🇪", region: "gcc", category: "GCC Middle East", image: "https://images.unsplash.com/photo-1576502200916-3808e07386a5?w=800&q=80&fit=crop", summary: "Employment and visit visa processing for UAE.", visaTypes: ["Employment Visa", "Visit Visa", "Transit Visa"], jobs: ["Driver", "Construction Worker", "Cleaner", "Hotel Staff", "Sales Executive"], salary: "AED 1,200–3,000/month", processingTime: "2–4 weeks", heroImg: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80&fit=crop" },
  { slug: "qatar", name: "Qatar", flag: "🇶🇦", region: "gcc", category: "GCC Middle East", image: "https://images.unsplash.com/photo-1509769399766-5dc14be99e42?w=800&q=80&fit=crop", summary: "Work visa and manpower recruitment for Qatar.", visaTypes: ["Work Visa", "Visit Visa"], jobs: ["Construction Worker", "Factory Worker", "Cleaner", "Driver"], salary: "QAR 1,200–2,500/month", processingTime: "3–6 weeks", heroImg: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80&fit=crop" },
  { slug: "kuwait", name: "Kuwait", flag: "🇰🇼", region: "gcc", category: "GCC Middle East", image: "https://images.unsplash.com/photo-1615208747421-b1d6df4cf22a?w=800&q=80&fit=crop", summary: "Employment visa for Kuwait with full processing support.", visaTypes: ["Work Visa", "Visit Visa"], jobs: ["Domestic Worker", "Driver", "Factory Worker"], salary: "KWD 70–150/month", processingTime: "3–6 weeks", heroImg: "https://images.unsplash.com/photo-1615208747421-b1d6df4cf22a?w=1200&q=80&fit=crop" },
  // Asia
  { slug: "malaysia", name: "Malaysia", flag: "🇲🇾", region: "asia", category: "Asia", image: "https://images.unsplash.com/photo-1601999009162-2459b9c15822?w=800&q=80&fit=crop", summary: "Full tour package from BDT 58,000 — e-visa, tickets, hotel.", visaTypes: ["e-Visa", "Tourist Visa", "Work Permit"], jobs: ["Factory Worker", "Plantation Worker", "Construction Worker"], salary: "MYR 1,200–2,000/month", processingTime: "3–5 days e-visa", heroImg: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200&q=80&fit=crop" },
  { slug: "nepal", name: "Nepal", flag: "🇳🇵", region: "asia", category: "Asia", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80&fit=crop", summary: "Full tour package from BDT 37,000 — approval ৳500, tickets, hotel.", visaTypes: ["Visa on Arrival", "Tourist Visa"], jobs: ["N/A — Tourism destination"], salary: "N/A", processingTime: "Visa on arrival", heroImg: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&fit=crop" },
  { slug: "sri-lanka", name: "Sri Lanka", flag: "🇱🇰", region: "asia", category: "Asia", image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&q=80&fit=crop", summary: "ETA approval ৳3,200 + return ticket ৳47,000 + hotel.", visaTypes: ["ETA (e-Visa)", "Tourist Visa"], jobs: ["N/A — Tourism destination"], salary: "N/A", processingTime: "ETA: 24–48 hours", heroImg: "https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&q=80&fit=crop" },
];

// ─── HOME PAGE (colorful, attractive redesign) ────────────────────────────

function buildHome(now) {
  const blocks = [];
  let o = 0;

  // 1. HERO — fullscreen, airplane photo, bold typography
  blocks.push({
    ...BASE, id: uid("hero"), type: "hero", order: o++,
    padding: ZERO_PAD,
    templateVariant: "fullscreen-overlay",
    background: {
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=85&fit=crop",
      imageOverlay: DARK,
      imageOverlayOpacity: 0.6,
    },
    data: {
      layout: "centered",
      badge: "✈️ Zero Advance · Pay Only After Visa Approval",
      title: "Your Journey Starts Here",
      subtitle: "Our Aim Is Your Journey",
      description: "Visa processing, work permits, manpower recruitment & tour packages for Europe, GCC and Asia — all under one roof.",
      primaryButton: { label: "Get Free Consultation", url: "/contact", variant: "primary" },
      secondaryButton: { label: "Explore Services", url: "/services", variant: "outline" },
      imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=85&fit=crop",
      overlayOpacity: 0.6,
      typography: { titleSize: "6xl", titleColor: "#ffffff", subtitleColor: SECONDARY, descColor: "#d1fae5" },
    },
  });

  // 2. STATS — colored bar
  blocks.push({
    ...BASE, id: uid("stats"), type: "stats", order: o++,
    padding: { top: 48, right: 0, bottom: 48, left: 0 },
    background: { type: "color", color: PRIMARY },
    templateVariant: "colored-row",
    data: {
      title: "", subtitle: "", layout: "row", columns: 4, animate: true, style: "plain",
      items: [
        { id: uid("st"), value: "5,000+", label: "Visas Processed", icon: "Passport" },
        { id: uid("st"), value: "45+", label: "Countries Covered", icon: "Globe" },
        { id: uid("st"), value: "100%", label: "Pay After Visa", icon: "ShieldCheck" },
        { id: uid("st"), value: "5★", label: "Client Rating", icon: "Star" },
      ],
    },
  });

  // 3. SERVICES — colorful grid cards
  blocks.push({
    ...BASE, id: uid("svc"), type: "services", order: o++,
    background: { type: "color", color: "#f8f6f0" },
    templateVariant: "icon-cards-grid",
    data: {
      title: "Our Services",
      subtitle: "Everything you need to settle life abroad — handled by experts.",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: [
        { id: uid("sv"), title: "Visa Processing", description: "Schengen, non-Schengen, GCC & Asia visa with embassy appointment. Pay after approval.", icon: "🛂", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=600&q=80&fit=crop", linkLabel: "Learn More", link: "/services/visa-processing" },
        { id: uid("sv"), title: "Work Permit", description: "Europe & GCC legal work permits. Serbia 7-day approval. Portugal D1 2-month process.", icon: "📋", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&fit=crop", linkLabel: "Learn More", link: "/services/work-permit" },
        { id: uid("sv"), title: "Manpower Recruitment", description: "Factory workers, cleaners, builders for Saudi Arabia, UAE, Qatar, Jordan, Serbia & more.", icon: "👷", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=600&q=80&fit=crop", linkLabel: "Learn More", link: "/services/manpower" },
        { id: uid("sv"), title: "Flight Booking", description: "Best-rate domestic & international tickets. All major airlines. One-way, return & multi-city.", icon: "✈️", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", linkLabel: "Book Ticket", link: "/services/flight-booking" },
        { id: uid("sv"), title: "Tour Packages", description: "All-inclusive packages to Malaysia, Nepal, Sri Lanka, Thailand & Dubai from BDT 81,000.", icon: "🌍", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80&fit=crop", linkLabel: "View Packages", link: "/services/tour-packages" },
        { id: uid("sv"), title: "Hotel Booking", description: "Budget to luxury hotels worldwide at best rates with free cancellation options.", icon: "🏨", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&fit=crop", linkLabel: "Book Hotel", link: "/services/hotel-booking" },
      ],
    },
  });

  // 4. WHY CHOOSE US — features alternating with green accent
  blocks.push({
    ...BASE, id: uid("feat"), type: "features", order: o++,
    templateVariant: "alternating-images",
    data: {
      title: "Why 5,000+ Clients Trust Life Settle",
      subtitle: "Our Aim Is Your Journey",
      layout: "alternating", columns: 2, style: "minimal",
      items: [
        {
          id: uid("f"), title: "Zero Advance — Pay Only After Visa",
          description: "Unlike other agencies, we never take money upfront. You pay only after your visa is approved and in your hand. This is our commitment to every client since day one.\n\n✅ No advance payment required\n✅ 5,000+ successful visa approvals\n✅ Expert document preparation\n✅ Embassy appointment management\n✅ Salary: ৳0 until your visa arrives",
          imageUrl: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&q=80&fit=crop", icon: "",
        },
      ],
    },
  });

  // 5. POPULAR DESTINATIONS — countries grid (colored cards with images)
  blocks.push({
    ...BASE, id: uid("dest"), type: "services", order: o++,
    background: { type: "color", color: "#0f2418" },
    templateVariant: "icon-cards-grid",
    data: {
      title: "Popular Destinations",
      subtitle: "Countries we process visas & work permits for. Click a country to learn more.",
      layout: "grid", columns: 4, cardStyle: "elevated", source: "inline",
      items: [
        { id: uid("c"), title: "🇩🇪 Germany", description: "Work permit · €2,000–€3,500/mo · Factory, Electrician, Nurse", icon: "🇩🇪", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1476900164809-ff19b8ae5968?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/germany" },
        { id: uid("c"), title: "🇵🇹 Portugal", description: "D1 Work Visa · 2 months · Factory, Construction, Cleaner", icon: "🇵🇹", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/portugal" },
        { id: uid("c"), title: "🇷🇸 Serbia", description: "Work Permit · 7-day approval · Furniture & Shoe Factory", icon: "🇷🇸", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/serbia" },
        { id: uid("c"), title: "🇷🇴 Romania", description: "Work Visa · 7-8 days · Construction, Factory, Welder", icon: "🇷🇴", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/romania" },
        { id: uid("c"), title: "🇸🇦 Saudi Arabia", description: "Free Visa · Iqama 72hrs · Load/Unload, Cleaner, Helper", icon: "🇸🇦", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/saudi-arabia" },
        { id: uid("c"), title: "🇦🇪 Dubai — UAE", description: "Employment Visa · 2-4 weeks · Driver, Cleaner, Hotel", icon: "🇦🇪", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1576502200916-3808e07386a5?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/dubai-uae" },
        { id: uid("c"), title: "🇲🇾 Malaysia", description: "e-Visa · 3 days · Tour Package from BDT 81,000", icon: "🇲🇾", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1601999009162-2459b9c15822?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/malaysia" },
        { id: uid("c"), title: "🇳🇵 Nepal", description: "Visa on Arrival · Tour Package from BDT 37,000", icon: "🇳🇵", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/nepal" },
      ],
    },
  });

  // 6. VIEW ALL COUNTRIES CTA button
  blocks.push({
    ...BASE, id: uid("cta2"), type: "cta", order: o++,
    padding: { top: 0, right: 0, bottom: 32, left: 0 },
    background: { type: "color", color: "#0f2418" },
    data: {
      title: "",
      description: "We process visas & work permits for 45+ countries across Europe, GCC and Asia.",
      primaryButton: { label: "View All Countries →", url: "/countries" },
      layout: "centered",
    },
  });

  // 7. HOW IT WORKS — steps
  blocks.push({
    ...BASE, id: uid("steps"), type: "steps", order: o++,
    background: { type: "color", color: "#f0f9f4" },
    data: {
      title: "How It Works",
      subtitle: "Simple 4-step process to your dream destination",
      layout: "horizontal",
      items: [
        { id: uid("s"), step: "01", title: "Free Consultation", description: "Contact us via WhatsApp or visit our office. We assess your eligibility and choose the best visa route for you — completely free." },
        { id: uid("s"), step: "02", title: "Document Preparation", description: "We guide you through every document required. Our team handles preparation and verification so nothing gets rejected." },
        { id: uid("s"), step: "03", title: "Embassy Submission", description: "We submit your application and manage embassy appointments. Real-time tracking at every step." },
        { id: uid("s"), step: "04", title: "Visa Approved — You Pay", description: "Only after your visa is in your hand do we collect our fee. Zero advance, zero risk for you." },
      ],
    },
  });

  // 8. TESTIMONIALS
  blocks.push({
    ...BASE, id: uid("tes"), type: "testimonials", order: o++,
    templateVariant: "quote-cards",
    data: {
      title: "What Our Clients Say",
      layout: "grid",
      items: [
        { id: uid("t"), name: "Rakibul Islam", role: "Factory Worker", company: "Now in Serbia", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop", content: "Life Settle got me a Serbia work permit in 45 days. Smooth process — they took money only after I got the visa.", rating: 5 },
        { id: uid("t"), name: "Fatema Begum", role: "Cleaner", company: "Now in Saudi Arabia", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop", content: "Free visa to Saudi Arabia with full package. Life Settle made my dream come true. Iqama within 72 hours of arrival!", rating: 5 },
        { id: uid("t"), name: "Mahmudul Hassan", role: "Engineer", company: "Portugal D1 Visa", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&fit=crop", content: "Portugal D1 via Life Settle — 1 month appointment, 2 months total. Zero advance. Absolutely amazing service.", rating: 5 },
        { id: uid("t"), name: "Nasrin Akter", role: "Tourist", company: "Malaysia Trip", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop", content: "Malaysia full package — e-visa, return ticket and 3-night hotel. Great value, totally stress-free.", rating: 5 },
        { id: uid("t"), name: "Jahidul Karim", role: "Construction Worker", company: "Now in Bosnia", content: "Bosnia work permit — 750-800 EUR/month. Life Settle handled everything from docs to flight. Truly trustworthy.", rating: 5 },
        { id: uid("t"), name: "Shirin Sultana", role: "Business Owner", content: "Romania visa in 7-8 days. Professional team, zero hidden fees. Will use Life Settle again.", rating: 5 },
      ],
    },
  });

  // 9. PRICING — 3 tiers with gold highlight
  blocks.push({
    ...BASE, id: uid("pricing"), type: "pricing", order: o++,
    background: { type: "color", color: "#f8f6f0" },
    templateVariant: "highlighted-cards",
    data: {
      title: "Our Packages",
      subtitle: "Transparent pricing — pay only after visa approval. Zero advance policy.",
      layout: "cards", billingToggle: false,
      plans: [
        { id: uid("p"), name: "Tour Package", price: "From BDT 81,000", period: "/person", description: "All-inclusive holiday package", features: ["Return air ticket", "Visa or e-Visa processing", "Hotel minimum 3 nights", "Airport transfer", "Destinations: Malaysia, Nepal, Sri Lanka, Dubai"], highlighted: false, ctaLabel: "Book Package", ctaUrl: "/contact" },
        { id: uid("p"), name: "Work Permit", price: "Pay After Visa", period: "", description: "Europe & GCC work permit — most popular", features: ["Full document preparation", "Embassy appointment management", "Visa sticker processing", "Manpower paperwork", "Air ticket booking", "Zero advance required"], highlighted: true, badge: "Most Popular", ctaLabel: "Apply Now", ctaUrl: "/contact" },
        { id: uid("p"), name: "Visa Only", price: "Pay After Visa", period: "", description: "Tourist, business or visit visa", features: ["All Schengen countries", "Non-Schengen Europe", "GCC tourist & business visa", "Asia tourist visa", "Document checklist & prep", "Zero advance required"], highlighted: false, ctaLabel: "Get Visa", ctaUrl: "/contact" },
      ],
    },
  });

  // 10. FAQ
  blocks.push({
    ...BASE, id: uid("faq"), type: "faq", order: o++,
    templateVariant: "accordion-bordered",
    data: {
      title: "Frequently Asked Questions",
      subtitle: "",
      layout: "accordion", allowMultiple: false,
      items: [
        { id: uid("f"), question: "Do you take advance payment before visa approval?", answer: "No — never. You pay only after your visa is approved and in your hand. This is our firm policy with zero exceptions." },
        { id: uid("f"), question: "Which countries do you process visas for?", answer: "We cover 45+ countries: all 29 Schengen countries, 16 non-Schengen European countries (Serbia, Romania, Bosnia, North Macedonia etc.), 6 GCC countries (Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman), and Asian destinations including Malaysia, Nepal, Sri Lanka." },
        { id: uid("f"), question: "How long does work permit processing take?", answer: "Serbia: 7 days approval, 25 days sticker, ~2 months flight. Bosnia: 7 days approval, 25 days sticker. Saudi Arabia: iqama within 72 hours of arrival. Portugal D1: 1 month appointment, 2 months total process." },
        { id: uid("f"), question: "What types of jobs are available?", answer: "Factory workers (furniture, shoe, food), cleaners (load/unload, office, warehouse, star hotel), construction workers, general helpers, electricians, painters, masons, plasterers, excavator operators, and restaurant staff." },
        { id: uid("f"), question: "What is included in a tour package?", answer: "Our full tour packages include e-visa or visa processing, return air ticket, and minimum 3-night hotel stay. Malaysia full package from BDT 81,000. Nepal tour from BDT 37,000. Sri Lanka from BDT 53,000 (ETA ৳3,200 + ticket ৳47,000 + hotel)." },
        { id: uid("f"), question: "How do I get started?", answer: "WhatsApp: +8801750599917 · Call: +8801711145428 · Office: House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207. Free initial consultation — no obligation." },
      ],
    },
  });

  // 11. TEAM
  blocks.push({
    ...BASE, id: uid("team"), type: "team", order: o++,
    background: { type: "color", color: "#f0f9f4" },
    templateVariant: "avatar-cards",
    data: {
      title: "Meet Our Team",
      subtitle: "Dedicated professionals committed to your dream destination",
      layout: "cards", columns: 3, showBio: true, showSocial: false,
      members: [
        { id: uid("tm"), name: "Sharmin Akter", role: "Managing Director & CEO", bio: "Founder of Life Settle. Leads with a mission of making overseas opportunities accessible to every Bangladeshi.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop" },
        { id: uid("tm"), name: "Mohammed Masud Rana", role: "Chairman", bio: "Oversees strategy and international partnerships. Drives expansion into new European and GCC markets.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop" },
        { id: uid("tm"), name: "Md. Fazlul Hoque", role: "Marketing Manager", bio: "Connects clients with overseas opportunities. Expert in visa requirements and recruitment across 45+ countries.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop" },
      ],
    },
  });

  // 12. CONTACT CTA — gold on dark
  blocks.push({
    ...BASE, id: uid("cta"), type: "cta", order: o++,
    padding: ZERO_PAD,
    background: {
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80&fit=crop",
      imageOverlay: PRIMARY,
      imageOverlayOpacity: 0.82,
    },
    templateVariant: "gradient-banner",
    data: {
      title: "Ready to Start Your Journey?",
      description: "Contact us today — zero advance, zero risk. Our Aim Is Your Journey.",
      primaryButton: { label: "Get Free Consultation", url: "/contact" },
      secondaryButton: { label: "WhatsApp Now", url: "https://wa.me/8801750599917" },
      layout: "centered",
    },
  });

  // 13. CONTACT FORM
  blocks.push({
    ...BASE, id: uid("contact"), type: "contact", order: o++,
    data: {
      title: "Get In Touch",
      subtitle: "Free Consultation — we respond within 24 hours",
      layout: "split", showMap: false, showContactInfo: true,
      phone: "+8801711145428", email: "info@lifesettle.com",
      address: "House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207",
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-email", label: "Email Address", type: "email", required: true },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: false },
        { id: "f-country", label: "Destination Country", type: "text", required: false },
        { id: "f-msg", label: "Message", type: "textarea", required: true },
      ],
      submitLabel: "Send Message",
      successMessage: "Thank you! We'll contact you within 24 hours.",
      recipientEmail: "info@lifesettle.com",
    },
  });

  // 14. FOOTER
  blocks.push(footerBlock(o++));

  return blocks;
}

// ─── SERVICE PAGE BUILDER ──────────────────────────────────────────────────

function buildServicePage(svc) {
  const blocks = [];
  let o = 0;

  blocks.push(navBlock(o++));

  blocks.push({
    ...BASE, id: uid("hero"), type: "hero", order: o++,
    padding: ZERO_PAD,
    background: { type: "image", imageUrl: svc.heroImg, imageOverlay: DARK, imageOverlayOpacity: 0.65 },
    templateVariant: "fullscreen-overlay",
    data: {
      layout: "centered",
      badge: svc.badge,
      title: svc.title,
      subtitle: "Life Settle Travel And Tourism",
      description: svc.subtitle,
      primaryButton: { label: "Apply Now — Free", url: "/contact", variant: "primary" },
      secondaryButton: { label: "WhatsApp Us", url: "https://wa.me/8801750599917", variant: "outline" },
      imageUrl: svc.heroImg,
      typography: { titleSize: "5xl", titleColor: "#ffffff", subtitleColor: SECONDARY, descColor: "#d1fae5" },
    },
  });

  blocks.push({
    ...BASE, id: uid("feat"), type: "features", order: o++,
    templateVariant: "alternating-images",
    data: {
      title: svc.title,
      subtitle: "",
      layout: "alternating", columns: 2, style: "minimal",
      items: [{ id: uid("f"), title: svc.featureTitle, description: svc.featureBody, imageUrl: svc.featureImg, icon: "" }],
    },
  });

  if (svc.steps) {
    blocks.push({
      ...BASE, id: uid("steps"), type: "steps", order: o++,
      background: { type: "color", color: "#f0f9f4" },
      data: {
        title: "How It Works",
        subtitle: `The ${svc.title} process — step by step`,
        layout: "horizontal",
        items: svc.steps,
      },
    });
  }

  if (svc.faq) {
    blocks.push({
      ...BASE, id: uid("faq"), type: "faq", order: o++,
      templateVariant: "accordion-bordered",
      data: {
        title: "Common Questions",
        subtitle: "",
        layout: "accordion", allowMultiple: false,
        items: svc.faq,
      },
    });
  }

  blocks.push({
    ...BASE, id: uid("cta"), type: "cta", order: o++,
    padding: ZERO_PAD,
    background: { type: "gradient", gradient: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` },
    data: {
      title: "Ready to Get Started?",
      description: "Zero advance — pay only after visa approval. Contact us for a free consultation.",
      primaryButton: { label: "Contact Us Now", url: "/contact" },
      secondaryButton: { label: "WhatsApp", url: "https://wa.me/8801750599917" },
      layout: "centered",
    },
  });

  blocks.push({
    ...BASE, id: uid("contact"), type: "contact", order: o++,
    data: {
      title: "Apply Now", subtitle: "Free consultation — no obligation",
      layout: "split", showMap: false, showContactInfo: true,
      phone: "+8801711145428", email: "info@lifesettle.com",
      address: "House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207",
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-email", label: "Email", type: "email", required: true },
        { id: "f-phone", label: "WhatsApp Number", type: "tel", required: true },
        { id: "f-msg", label: "Tell us your situation", type: "textarea", required: true },
      ],
      submitLabel: "Apply Now",
      successMessage: "Thank you! We'll WhatsApp you within 24 hours.",
      recipientEmail: "info@lifesettle.com",
    },
  });

  blocks.push(footerBlock(o++));
  return blocks;
}

const SERVICES_DATA = [
  {
    slug: "visa-processing", title: "Visa Processing",
    badge: "🛂 45+ Countries · Schengen, GCC & Asia",
    subtitle: "Complete embassy appointment handling — Schengen, non-Schengen, GCC & Asia. You pay only after visa approval.",
    heroImg: "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=1200&q=80&fit=crop",
    featureTitle: "Expert Visa Processing — Zero Advance",
    featureImg: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&fit=crop",
    featureBody: "Life Settle processes visas for all 29 Schengen countries, 16 non-Schengen European countries, 6 GCC countries and major Asian destinations. Our team handles document preparation, embassy appointment booking, and application tracking.\n\n✅ All 29 Schengen countries (Germany, Portugal, Italy, France, Spain, etc.)\n✅ Non-Schengen: Serbia, Romania, Bosnia, North Macedonia, Belarus, Armenia, UK\n✅ GCC: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman\n✅ Asia: Malaysia, Nepal, Sri Lanka, Thailand\n✅ Zero advance — you pay only after visa is in your hand\n✅ Document checklist provided\n✅ Embassy appointment managed\n✅ Application tracking at every step",
    steps: [
      { id: uid("s"), step: "01", title: "Free Consultation", description: "Tell us your destination country and purpose. We assess eligibility and required documents — completely free." },
      { id: uid("s"), step: "02", title: "Document Collection", description: "We provide a complete checklist. You collect the documents; we verify and prepare the application file." },
      { id: uid("s"), step: "03", title: "Embassy Submission", description: "We book your embassy appointment and submit the application. You receive tracking updates throughout." },
      { id: uid("s"), step: "04", title: "Visa Approved — You Pay", description: "Once your visa arrives, you pay our service fee. Not before. Zero risk, full transparency." },
    ],
    faq: [
      { id: uid("f"), question: "Which countries do you process tourist visas for?", answer: "All 29 Schengen countries, UK, Serbia, Romania, Bosnia, North Macedonia, Saudi Arabia, UAE, Qatar, Kuwait, Malaysia, Nepal, Sri Lanka and more." },
      { id: uid("f"), question: "How long does Schengen visa processing take?", answer: "Typically 2–4 weeks after embassy submission depending on the country. Some countries like Romania can process in 7–8 days." },
      { id: uid("f"), question: "Do I need to visit the embassy myself?", answer: "Yes, most embassies require biometrics in person. We book your appointment and guide you through the visit." },
    ],
  },
  {
    slug: "work-permit", title: "Work Permit Processing",
    badge: "📋 Europe & GCC · Fast-Track Available",
    subtitle: "Legal work permits for Serbia, Portugal, Germany, Romania, Bosnia, Saudi Arabia and more. Pay after approval.",
    heroImg: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80&fit=crop",
    featureTitle: "Legal Work Permits — Europe & GCC",
    featureImg: "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=800&q=80&fit=crop",
    featureBody: "We process work permits for multiple European and GCC destinations with proven fast-track options.\n\n🇷🇸 Serbia: Work permit approval in 7 days · Sticker visa in 25 days · Salary €750–800/month · Furniture & shoe factory jobs\n🇵🇹 Portugal D1: Embassy appointment in 1 month · Full process 2 months · Factory, construction, restaurant\n🇧🇦 Bosnia: Work permit in 7 days · Sticker in 25 days · Salary €600–800/month\n🇩🇪 Germany: Factory, nursing, electrical — 3-4 months\n🇸🇦 Saudi Arabia: Free visa · Iqama within 72hrs of arrival · No advance needed\n\n✅ Full document preparation\n✅ Zero advance — pay after visa\n✅ Air ticket included in full package\n✅ Daily salary payment from day one",
    steps: [
      { id: uid("s"), step: "01", title: "Eligibility Check", description: "We assess your passport, age, and work experience to determine the best country and job match for you." },
      { id: uid("s"), step: "02", title: "Documents & Attestation", description: "We guide you through obtaining police clearance, medical certificate, and all required documents." },
      { id: uid("s"), step: "03", title: "Employer Match & Approval", description: "We connect you with verified employers. Work permit application submitted to the respective labor ministry." },
      { id: uid("s"), step: "04", title: "Visa & Departure", description: "After work permit approval, visa sticker issued. We arrange air ticket. You pay our fee only after visa received." },
    ],
    faq: [
      { id: uid("f"), question: "What is the fastest work permit country?", answer: "Serbia currently offers the fastest processing — work permit approval in 7 days, visa sticker in 25 days, flight within 2 months." },
      { id: uid("f"), question: "Do I need work experience?", answer: "Depends on the destination. For factory and cleaning jobs in Serbia and Bosnia, no prior experience is required. Germany and Portugal prefer some experience." },
      { id: uid("f"), question: "What salary can I expect?", answer: "Serbia: €750–800/month. Bosnia: €600–800/month. Portugal: €820–1,200/month. Germany: €2,000–3,500/month. Saudi Arabia: SAR 900–1,500/month." },
    ],
  },
  {
    slug: "manpower", title: "Manpower Recruitment",
    badge: "👷 Factory · Cleaner · Construction · 45+ Countries",
    subtitle: "Overseas job placement for factory workers, cleaners, builders and general helpers in Europe and GCC.",
    heroImg: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80&fit=crop",
    featureTitle: "Overseas Job Placement — Verified Employers",
    featureImg: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80&fit=crop",
    featureBody: "Life Settle recruits workers for verified overseas employers across Europe and GCC. We match your skills with available positions and handle the complete visa and work permit process.\n\n👷 Job Types We Recruit For:\n• Factory workers (furniture, shoe, food processing, Coca-Cola)\n• Cleaners (load/unload, office cleaner, warehouse, star hotel cleaner)\n• Construction workers (mason, plasterer, carpenter, painter)\n• General helpers and labourers\n• Electricians, welders, plumbers\n• Excavator operators\n• Restaurant and hotel staff\n\n🌍 Current Active Destinations:\nSaudi Arabia, UAE, Qatar, Kuwait, Serbia, Bosnia, Jordan, Romania\n\n✅ Verified employers only\n✅ Accommodation provided by company (most destinations)\n✅ Daily salary paid on time\n✅ Zero advance — pay only after visa approval",
    steps: [
      { id: uid("s"), step: "01", title: "Registration", description: "Submit your details — passport copy, photo, work experience. Free registration, no upfront cost." },
      { id: uid("s"), step: "02", title: "Job Matching", description: "We match you to current available positions based on your skills, preference and destination country." },
      { id: uid("s"), step: "03", title: "Employer Approval", description: "Employer reviews your profile and approves. Work permit process begins immediately after approval." },
      { id: uid("s"), step: "04", title: "Departure", description: "Visa obtained, air ticket arranged, departure orientation provided. Salary begins on your first working day abroad." },
    ],
    faq: [
      { id: uid("f"), question: "Which job types have the highest demand right now?", answer: "Currently highest demand: factory workers for Serbia, Bosnia and Jordan; cleaners for Saudi Arabia; construction workers for Romania and Portugal." },
      { id: uid("f"), question: "Is accommodation provided?", answer: "Yes, most employers provide company accommodation. In some countries (Bosnia, Serbia) accommodation is free. Food is usually self-funded." },
      { id: uid("f"), question: "Do I need to pay anything before getting the job?", answer: "No. We never take any advance payment. You pay our service fee only after your visa is approved and you are ready to depart." },
    ],
  },
  {
    slug: "flight-booking", title: "Flight Booking",
    badge: "✈️ Best Rates · All Airlines · Dhaka & Worldwide",
    subtitle: "Domestic and international air tickets at competitive rates. One-way, return and multi-city bookings.",
    heroImg: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&fit=crop",
    featureTitle: "Best Rate Air Tickets — All Major Airlines",
    featureImg: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&fit=crop",
    featureBody: "Life Settle offers air ticket booking at the best available rates through our extensive airline network. We handle both domestic Bangladesh routes and international flights to Europe, GCC, and Asia.\n\n✅ All major airlines: Biman, Emirates, Qatar Airways, Turkish Airlines, Etihad, Air Arabia\n✅ Dhaka (DAC) to worldwide destinations\n✅ One-way, return and multi-city itineraries\n✅ Group bookings for manpower departure\n✅ Fastest routes selected\n✅ E-ticket delivered instantly\n✅ Rebooking and cancellation support\n\n📌 Sample Routes:\n• Dhaka → Riyadh from BDT 35,000\n• Dhaka → Dubai from BDT 32,000\n• Dhaka → Kuala Lumpur from BDT 28,000\n• Dhaka → Kathmandu from BDT 14,000\n• Dhaka → Belgrade (Serbia) from BDT 45,000",
    steps: [
      { id: uid("s"), step: "01", title: "Tell Us Your Route", description: "Share your departure city, destination, travel date and number of passengers via WhatsApp or phone call." },
      { id: uid("s"), step: "02", title: "Get Best Price Quote", description: "We search all airlines and present you the best available fares with schedule options within minutes." },
      { id: uid("s"), step: "03", title: "Confirm & Pay", description: "Confirm your seat, make payment via bank transfer or cash at our office. E-ticket sent immediately." },
      { id: uid("s"), step: "04", title: "Fly!", description: "Travel with your e-ticket. We're available 24/7 for any last-minute changes or queries." },
    ],
    faq: [
      { id: uid("f"), question: "Can I book group tickets for manpower departure?", answer: "Yes — we specialize in group bookings for workers departing to Saudi Arabia, UAE, Serbia, and other destinations. Discounted rates available for groups of 5+." },
      { id: uid("f"), question: "What is the cheapest route to Saudi Arabia?", answer: "Currently Dhaka to Riyadh starts from BDT 32,000–38,000 depending on the airline and season. Air Arabia and Flynas often have the best rates." },
    ],
  },
  {
    slug: "tour-packages", title: "Tour Packages",
    badge: "🌍 Malaysia · Nepal · Sri Lanka · Dubai · Thailand",
    subtitle: "All-inclusive holiday packages from BDT 81,000 — visa, return tickets, hotel included.",
    heroImg: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80&fit=crop",
    featureTitle: "Hassle-Free Holiday Packages",
    featureImg: "https://images.unsplash.com/photo-1601999009162-2459b9c15822?w=800&q=80&fit=crop",
    featureBody: "Life Settle offers complete holiday packages so you don't need to arrange anything separately. We handle visa, tickets, and hotel — you just arrive and enjoy.\n\n✈️ Current Tour Packages:\n\n🇲🇾 Malaysia Full Package — From BDT 81,000:\n• e-Visa: BDT 4,500\n• Return ticket: from BDT 50,000\n• Hotel minimum 3 nights: from BDT 5,000\n\n🇳🇵 Nepal Full Package — From BDT 37,000:\n• Approval first: BDT 500\n• Return ticket (direct): BDT 37,000\n• Hotel minimum 3 nights: from BDT 3,000\n\n🇱🇰 Sri Lanka Full Package — From BDT 53,200:\n• ETA approval: BDT 3,200\n• Return ticket: BDT 47,000\n• Hotel minimum 3 nights: from BDT 3,000\n\n🇦🇪 Dubai Tour — Contact for pricing\n🇹🇭 Thailand Tour — Contact for pricing\n\n✅ All packages include visa/e-visa processing\n✅ Return air ticket\n✅ Hotel accommodation minimum 3 nights\n✅ Optional airport transfer",
    steps: [
      { id: uid("s"), step: "01", title: "Choose Destination", description: "Select from Malaysia, Nepal, Sri Lanka, Dubai, Thailand or tell us your dream destination." },
      { id: uid("s"), step: "02", title: "Package Customization", description: "We tailor the package to your budget — economy or premium hotel, travel dates, duration." },
      { id: uid("s"), step: "03", title: "Visa & Booking", description: "We process your visa/e-visa, book flights and hotel. Everything confirmed before you pay." },
      { id: uid("s"), step: "04", title: "Travel & Enjoy", description: "Receive your e-tickets, hotel voucher and visa. Fly and enjoy your holiday!" },
    ],
    faq: [
      { id: uid("f"), question: "What is the cheapest package destination from Bangladesh?", answer: "Nepal is the most affordable at BDT 37,000 for a basic package (approval ৳500 + return ticket ৳37,000 + hotel from ৳3,000). Visa on arrival available." },
      { id: uid("f"), question: "Can I customize my tour package?", answer: "Yes — we can add extra hotel nights, upgrade to premium hotel, include city tours, or add other destinations. Contact us for a custom quote." },
      { id: uid("f"), question: "Is Malaysia e-Visa easy to get for Bangladeshis?", answer: "Yes — Malaysia e-Visa for Bangladeshis costs BDT 4,500 and is processed online within 3–5 days. Our team handles the complete application." },
    ],
  },
  {
    slug: "hotel-booking", title: "Hotel Booking",
    badge: "🏨 Budget to Luxury · Worldwide · Best Rates",
    subtitle: "Hotel reservations worldwide at the best available rates. Instant confirmation.",
    heroImg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80&fit=crop",
    featureTitle: "Hotel Reservations — Best Rates Guaranteed",
    featureImg: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop",
    featureBody: "Life Settle books hotels in any destination worldwide. Whether you need budget accommodation for work visa applications, star hotels for visa purposes, or premium resorts for holidays — we find the best available rates.\n\n✅ Budget guesthouses to 5-star luxury hotels\n✅ Dhaka, Saudi Arabia, UAE, Malaysia, Nepal, Sri Lanka\n✅ Hotel booking letter for visa applications\n✅ Group bookings for manpower workers\n✅ Free cancellation options available\n✅ Instant confirmation and e-voucher\n✅ Best available rate guarantee\n\n📌 Common Hotel Booking Purposes:\n• Visa application accommodation proof\n• Holiday accommodation for tour packages\n• Business travel accommodation\n• Transit stay near airport",
    steps: [
      { id: uid("s"), step: "01", title: "Tell Us Requirements", description: "Share your destination city, check-in/out dates, number of guests and budget preference." },
      { id: uid("s"), step: "02", title: "We Search Best Rates", description: "Our team searches multiple platforms and direct hotel contracts to get you the lowest available rate." },
      { id: uid("s"), step: "03", title: "Confirm & Pay", description: "Confirm your choice and pay. We provide instant e-voucher and confirmation for your records." },
      { id: uid("s"), step: "04", title: "Stay Confirmed", description: "Hotel is notified and your reservation is secure. We handle any changes or special requests." },
    ],
    faq: [
      { id: uid("f"), question: "Can you provide a hotel booking letter for visa applications?", answer: "Yes — we provide official hotel booking confirmation letters for all major embassies including Schengen, UK, Saudi, and UAE visa applications." },
      { id: uid("f"), question: "Do you offer free cancellation?", answer: "Many of our hotel options include free cancellation up to 24–48 hours before check-in. We always try to book refundable rates when available." },
    ],
  },
];

// ─── COUNTRY PAGE BUILDER ──────────────────────────────────────────────────

function buildCountryPage(country) {
  const blocks = [];
  let o = 0;

  blocks.push(navBlock(o++));

  blocks.push({
    ...BASE, id: uid("hero"), type: "hero", order: o++,
    padding: ZERO_PAD,
    background: { type: "image", imageUrl: country.heroImg, imageOverlay: DARK, imageOverlayOpacity: 0.6 },
    templateVariant: "fullscreen-overlay",
    data: {
      layout: "centered",
      badge: `${country.flag} ${country.category}`,
      title: `${country.flag} ${country.name}`,
      subtitle: "Visa & Work Permit Processing",
      description: country.summary,
      primaryButton: { label: "Apply Now — Free", url: "/contact", variant: "primary" },
      secondaryButton: { label: "WhatsApp Us", url: "https://wa.me/8801750599917", variant: "outline" },
      imageUrl: country.heroImg,
      typography: { titleSize: "5xl", titleColor: "#ffffff", subtitleColor: SECONDARY, descColor: "#d1fae5" },
    },
  });

  // Quick facts — stats
  blocks.push({
    ...BASE, id: uid("stats"), type: "stats", order: o++,
    padding: { top: 48, right: 0, bottom: 48, left: 0 },
    background: { type: "color", color: PRIMARY },
    data: {
      title: "", subtitle: "", layout: "row", columns: 4, animate: false, style: "plain",
      items: [
        { id: uid("st"), value: country.processingTime, label: "Processing Time" },
        { id: uid("st"), value: country.salary, label: "Typical Salary" },
        { id: uid("st"), value: country.visaTypes.length + "+", label: "Visa Types" },
        { id: uid("st"), value: "Zero Advance", label: "Payment Policy" },
      ],
    },
  });

  // Details
  const jobList = country.jobs.map(j => `• ${j}`).join("\n");
  const visaList = country.visaTypes.map(v => `✅ ${v}`).join("\n");

  blocks.push({
    ...BASE, id: uid("feat"), type: "features", order: o++,
    templateVariant: "alternating-images",
    data: {
      title: `${country.name} — Visa & Work Permit Details`,
      subtitle: "",
      layout: "alternating", columns: 2, style: "minimal",
      items: [{
        id: uid("f"),
        title: `Work & Live in ${country.name}`,
        description: `Life Settle processes all visa and work permit categories for ${country.name}.\n\n${visaList}\n\nAvailable Jobs:\n${jobList}\n\nSalary Range: ${country.salary}\nProcessing Time: ${country.processingTime}\n\n✅ Zero advance payment — you pay only after visa approval\n✅ Complete document preparation included\n✅ Embassy appointment managed\n✅ Air ticket booking available`,
        imageUrl: country.image,
        icon: "",
      }],
    },
  });

  // CTA
  blocks.push({
    ...BASE, id: uid("cta"), type: "cta", order: o++,
    padding: ZERO_PAD,
    background: { type: "gradient", gradient: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` },
    data: {
      title: `Apply for ${country.name} Visa Now`,
      description: "Zero advance — pay only after approval. Free consultation.",
      primaryButton: { label: "Apply Now", url: "/contact" },
      secondaryButton: { label: "WhatsApp", url: "https://wa.me/8801750599917" },
      layout: "centered",
    },
  });

  blocks.push({
    ...BASE, id: uid("contact"), type: "contact", order: o++,
    data: {
      title: `Apply for ${country.name} Visa`, subtitle: "Free consultation",
      layout: "split", showMap: false, showContactInfo: true,
      phone: "+8801711145428", email: "info@lifesettle.com",
      address: "House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207",
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-phone", label: "WhatsApp Number", type: "tel", required: true },
        { id: "f-visa", label: "Visa Type Needed", type: "text", required: false },
        { id: "f-msg", label: "Message", type: "textarea", required: false },
      ],
      submitLabel: "Apply Now",
      successMessage: "Thank you! We'll contact you within 24 hours.",
      recipientEmail: "info@lifesettle.com",
    },
  });

  blocks.push(footerBlock(o++));
  return blocks;
}

// ─── ALL COUNTRIES PAGE ────────────────────────────────────────────────────

function buildAllCountriesPage() {
  const blocks = [];
  let o = 0;

  blocks.push(navBlock(o++));

  blocks.push({
    ...BASE, id: uid("hero"), type: "hero", order: o++,
    padding: ZERO_PAD,
    background: { type: "image", imageUrl: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1600&q=85&fit=crop", imageOverlay: DARK, imageOverlayOpacity: 0.65 },
    templateVariant: "fullscreen-overlay",
    data: {
      layout: "centered",
      badge: "45+ Countries · Europe, GCC & Asia",
      title: "All Countries We Cover",
      subtitle: "Visa processing & work permits worldwide",
      description: "We process visas and work permits for 45+ countries. Click any country to see details, job types, salary ranges and processing times.",
      primaryButton: { label: "Get Free Consultation", url: "/contact", variant: "primary" },
      typography: { titleSize: "5xl", titleColor: "#ffffff", subtitleColor: SECONDARY, descColor: "#d1fae5" },
    },
  });

  // Europe Schengen
  const schengenItems = COUNTRIES.filter(c => c.category === "Schengen Europe").map(c => ({
    id: uid("c"), title: `${c.flag} ${c.name}`, description: c.summary,
    icon: c.flag, iconType: "emoji", imageUrl: c.image, linkLabel: "Details →", link: `/countries/${c.slug}`,
  }));
  blocks.push({
    ...BASE, id: uid("svc"), type: "services", order: o++,
    background: { type: "color", color: "#f0f9f4" },
    data: {
      title: "🇪🇺 Schengen Europe (29 Countries)",
      subtitle: "Tourist, business, work and study visas for all Schengen member states.",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: schengenItems,
    },
  });

  // Non-Schengen Europe
  const nonSchengenItems = COUNTRIES.filter(c => c.category === "Non-Schengen Europe").map(c => ({
    id: uid("c"), title: `${c.flag} ${c.name}`, description: c.summary,
    icon: c.flag, iconType: "emoji", imageUrl: c.image, linkLabel: "Details →", link: `/countries/${c.slug}`,
  }));
  blocks.push({
    ...BASE, id: uid("svc2"), type: "services", order: o++,
    data: {
      title: "🌍 Non-Schengen Europe (16 Countries)",
      subtitle: "Work permits and visas for non-Schengen European countries — often faster processing.",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: nonSchengenItems,
    },
  });

  // GCC
  const gccItems = COUNTRIES.filter(c => c.category === "GCC Middle East").map(c => ({
    id: uid("c"), title: `${c.flag} ${c.name}`, description: c.summary,
    icon: c.flag, iconType: "emoji", imageUrl: c.image, linkLabel: "Details →", link: `/countries/${c.slug}`,
  }));
  blocks.push({
    ...BASE, id: uid("svc3"), type: "services", order: o++,
    background: { type: "color", color: "#f8f6f0" },
    data: {
      title: "🌙 GCC — Middle East (6 Countries)",
      subtitle: "Work visas and manpower recruitment for all 6 GCC member states.",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: gccItems,
    },
  });

  // Asia
  const asiaItems = COUNTRIES.filter(c => c.category === "Asia").map(c => ({
    id: uid("c"), title: `${c.flag} ${c.name}`, description: c.summary,
    icon: c.flag, iconType: "emoji", imageUrl: c.image, linkLabel: "Details →", link: `/countries/${c.slug}`,
  }));
  blocks.push({
    ...BASE, id: uid("svc4"), type: "services", order: o++,
    data: {
      title: "🌏 Asia — Tour & Work",
      subtitle: "Tour packages and work permits for popular Asian destinations.",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: asiaItems,
    },
  });

  blocks.push({
    ...BASE, id: uid("cta"), type: "cta", order: o++,
    padding: ZERO_PAD,
    background: { type: "gradient", gradient: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` },
    data: {
      title: "Don't See Your Country?",
      description: "We cover 45+ countries. Contact us and we'll check if we can process your destination.",
      primaryButton: { label: "Ask Us", url: "/contact" },
      secondaryButton: { label: "WhatsApp", url: "https://wa.me/8801750599917" },
      layout: "centered",
    },
  });

  blocks.push(footerBlock(o++));
  return blocks;
}

// ─── GLOBAL HEADER / FOOTER (stored in site_identity) ─────────────────────

function buildGlobalHeader() {
  return {
    id: uid("nav"),
    type: "navigation",
    order: 0,
    visible: true,
    width: "full",
    padding: ZERO_PAD,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    background: { type: "color", color: PRIMARY },
    templateVariant: "solid-with-cta",
    data: {
      logoText: "Life Settle Travel And Tourism",
      items: NAV_ITEMS,
      sticky: true, transparent: false, style: "default",
      backgroundColor: PRIMARY, textColor: "#ffffff",
      showCta: true, ctaLabel: "Free Consultation", ctaUrl: "/contact",
    },
  };
}

function buildGlobalFooter() {
  return footerBlock(0);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────

async function run() {
  const now = new Date().toISOString();
  console.log("Life Settle v2 seed starting...\n");

  // 1. Delete all existing pages
  await supabase.from("pages").delete().eq("tenant_id", TENANT_ID);
  console.log("✓ Cleared old pages");

  // 2. Build page rows
  const pages = [];

  // Home
  pages.push({ tenant_id: TENANT_ID, title: "Home", slug: "home", status: "published", blocks: buildHome(now), created_at: now, updated_at: now });

  // About (keep from v1 — we'll skip rebuilding)
  pages.push({
    tenant_id: TENANT_ID, title: "About Us", slug: "about", status: "published", created_at: now, updated_at: now,
    blocks: [
      navBlock(0),
      { ...BASE, id: uid("hero"), type: "hero", order: 1, padding: ZERO_PAD, templateVariant: "fullscreen-overlay", background: { type: "image", imageUrl: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1200&q=80&fit=crop", imageOverlay: DARK, imageOverlayOpacity: 0.65 }, data: { layout: "centered", title: "About Life Settle", subtitle: "Our Aim Is Your Journey", description: "Bangladesh's most trusted visa, work permit and travel partner.", primaryButton: { label: "Contact Us", url: "/contact", variant: "primary" }, typography: { titleSize: "5xl", titleColor: "#ffffff", subtitleColor: SECONDARY, descColor: "#d1fae5" } } },
      { ...BASE, id: uid("feat"), type: "features", order: 2, templateVariant: "alternating-images", data: { title: "Who We Are", subtitle: "", layout: "alternating", columns: 2, style: "minimal", items: [{ id: uid("f"), title: "Zero Advance — Pay After Visa", description: "Life Settle Travel And Tourism has helped thousands of Bangladeshi citizens realize their dreams of working and living abroad. From Schengen visas to GCC work permits, our expert team handles every step.\n\n✅ Zero advance — pay only after visa approval\n✅ 45+ countries covered across Europe, GCC and Asia\n✅ 5,000+ successful visa approvals\n✅ Air ticketing and hotel booking at best rates\n✅ Full tour packages from BDT 37,000\n✅ Offices in Dhaka with international representation", imageUrl: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&q=80&fit=crop", icon: "" }] } },
      { ...BASE, id: uid("stats"), type: "stats", order: 3, padding: { top: 56, right: 0, bottom: 56, left: 0 }, background: { type: "color", color: PRIMARY }, data: { title: "", subtitle: "", layout: "row", columns: 4, items: [{ id: uid("st"), value: "5,000+", label: "Visas Processed" }, { id: uid("st"), value: "45+", label: "Countries Covered" }, { id: uid("st"), value: "100%", label: "Pay After Visa" }, { id: uid("st"), value: "5★", label: "Client Rating" }], style: "plain", animate: true } },
      { ...BASE, id: uid("team"), type: "team", order: 4, templateVariant: "avatar-cards", data: { title: "Meet Our Team", subtitle: "", layout: "cards", columns: 3, showBio: true, showSocial: false, members: [{ id: uid("tm"), name: "Sharmin Akter", role: "Managing Director & CEO", bio: "Founder. Leads with a vision of making overseas opportunities accessible to every Bangladeshi.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop" }, { id: uid("tm"), name: "Mohammed Masud Rana", role: "Chairman", bio: "Oversees strategy and international partnerships.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop" }, { id: uid("tm"), name: "Md. Fazlul Hoque", role: "Marketing Manager", bio: "Expert in visa requirements and manpower recruitment across 45+ countries.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop" }] } },
      { ...BASE, id: uid("contact"), type: "contact", order: 5, data: { title: "Get In Touch", subtitle: "Free consultation", layout: "split", showMap: false, showContactInfo: true, phone: "+8801711145428", email: "info@lifesettle.com", address: "House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207", fields: [{ id: "f-name", label: "Full Name", type: "text", required: true }, { id: "f-email", label: "Email", type: "email", required: true }, { id: "f-msg", label: "Message", type: "textarea", required: true }], submitLabel: "Send Message", successMessage: "Thanks! We'll be in touch.", recipientEmail: "info@lifesettle.com" } },
      footerBlock(6),
    ],
  });

  // Services overview
  pages.push({
    tenant_id: TENANT_ID, title: "Services", slug: "services", status: "published", created_at: now, updated_at: now,
    blocks: [
      navBlock(0),
      { ...BASE, id: uid("hero"), type: "hero", order: 1, padding: ZERO_PAD, background: { type: "image", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=85&fit=crop", imageOverlay: DARK, imageOverlayOpacity: 0.6 }, templateVariant: "fullscreen-overlay", data: { layout: "centered", title: "Our Services", subtitle: "Everything for your overseas journey", description: "Visa, work permit, manpower, flights, tours and hotels — all under one roof, all with zero advance.", primaryButton: { label: "Get Free Consultation", url: "/contact", variant: "primary" }, typography: { titleSize: "5xl", titleColor: "#ffffff", subtitleColor: SECONDARY, descColor: "#d1fae5" } } },
      { ...BASE, id: uid("svc"), type: "services", order: 2, templateVariant: "icon-cards-grid", data: { title: "What We Offer", subtitle: "Pay only after visa approval — zero advance policy on all services", layout: "grid", columns: 3, cardStyle: "elevated", source: "inline", items: SERVICES_DATA.map(s => ({ id: uid("sv"), title: s.title, description: s.subtitle, icon: s.badge.split(" ")[0], iconType: "emoji", imageUrl: s.heroImg, linkLabel: "Learn More", link: `/services/${s.slug}` })) } },
      { ...BASE, id: uid("cta"), type: "cta", order: 3, padding: ZERO_PAD, background: { type: "gradient", gradient: `linear-gradient(135deg, ${PRIMARY}, ${SECONDARY})` }, data: { title: "Ready to Get Started?", description: "Zero advance — you pay only after your visa is approved.", primaryButton: { label: "Free Consultation", url: "/contact" }, secondaryButton: { label: "WhatsApp", url: "https://wa.me/8801750599917" }, layout: "centered" } },
      footerBlock(4),
    ],
  });

  // 6 individual service pages
  for (const svc of SERVICES_DATA) {
    pages.push({ tenant_id: TENANT_ID, title: svc.title, slug: `services/${svc.slug}`, status: "published", blocks: buildServicePage(svc), created_at: now, updated_at: now });
  }

  // Contact page
  pages.push({
    tenant_id: TENANT_ID, title: "Contact", slug: "contact", status: "published", created_at: now, updated_at: now,
    blocks: [
      navBlock(0),
      { ...BASE, id: uid("hero"), type: "hero", order: 1, padding: ZERO_PAD, templateVariant: "centered-bold", data: { layout: "centered", title: "Get In Touch", subtitle: "Free consultation — we respond within 24 hours", primaryButton: { label: "Call Us Now", url: "tel:+8801711145428", variant: "primary" }, secondaryButton: { label: "WhatsApp", url: "https://wa.me/8801750599917", variant: "outline" }, typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" } } },
      { ...BASE, id: uid("contact"), type: "contact", order: 2, data: { title: "", subtitle: "", layout: "split", showMap: false, showContactInfo: true, phone: "+8801711145428", email: "info@lifesettle.com", address: "House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207", fields: [{ id: "f-name", label: "Full Name", type: "text", required: true }, { id: "f-email", label: "Email Address", type: "email", required: true }, { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: false }, { id: "f-country", label: "Destination Country", type: "text", required: false }, { id: "f-service", label: "Service Required", type: "text", required: false }, { id: "f-msg", label: "Message", type: "textarea", required: true }], submitLabel: "Send Message", successMessage: "Thank you! We'll contact you within 24 hours.", recipientEmail: "info@lifesettle.com" } },
      footerBlock(3),
    ],
  });

  // All countries page
  pages.push({ tenant_id: TENANT_ID, title: "All Countries", slug: "countries", status: "published", blocks: buildAllCountriesPage(), created_at: now, updated_at: now });

  // Individual country pages
  for (const country of COUNTRIES) {
    pages.push({ tenant_id: TENANT_ID, title: country.name, slug: `countries/${country.slug}`, status: "published", blocks: buildCountryPage(country), created_at: now, updated_at: now });
  }

  // Insert in batches of 5 (large JSONB)
  let inserted = 0;
  const BATCH = 3;
  for (let i = 0; i < pages.length; i += BATCH) {
    const batch = pages.slice(i, i + BATCH);
    const { error } = await supabase.from("pages").insert(batch);
    if (error) {
      console.error(`Batch ${Math.floor(i/BATCH)+1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`✓ Inserted ${inserted}/${pages.length} pages`);
    }
  }

  // 3. Update site_identity with global_header and global_footer
  const { error: idErr } = await supabase.from("site_identity").upsert({
    tenant_id: TENANT_ID,
    site_name: "Life Settle Travel And Tourism",
    tagline: "Our Aim Is Your Journey",
    active_template_slug: "life-settle",
    global_header: buildGlobalHeader(),
    global_footer: buildGlobalFooter(),
    updated_at: now,
  }, { onConflict: "tenant_id" });
  if (idErr) console.error("site_identity:", idErr.message);
  else console.log("✓ Global header + footer saved to site_identity");

  console.log(`\n✅ Done! ${pages.length} pages created.`);
  console.log("Visit: https://lifesettle.passivecoder.com/");
}

run().catch(console.error);
