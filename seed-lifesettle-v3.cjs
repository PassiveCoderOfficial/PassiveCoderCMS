/**
 * Life Settle v3 — stunning home redesign, logo fix, strip per-page nav/footer
 * Global nav/footer handled by site_identity only.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const TENANT_ID = "636793b3-9104-4e15-9415-eef346a9957a";
const LOGO_URL = "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1782327669055_Life_Settle_Logo.png";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2,6)}`; }

const PRIMARY = "#1a5c38";
const SECONDARY = "#c9a84c";
const DARK = "#0f2418";
const LIGHT_GREEN = "#f0f9f4";

const BASE_PAD = { top: 80, right: 0, bottom: 80, left: 0 };
const ZERO_PAD = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: BASE_PAD,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  background: { type: "none" },
};

const NAV_ITEMS = [
  { id: "n1", label: "Home", url: "/", children: [] },
  { id: "n2", label: "Services", url: "/services", children: [
    { id: "n2a", label: "Visa Processing", url: "/services/visa-processing" },
    { id: "n2b", label: "Work Permit", url: "/services/work-permit" },
    { id: "n2c", label: "Manpower Recruitment", url: "/services/manpower" },
    { id: "n2d", label: "Flight Booking", url: "/services/flight-booking" },
    { id: "n2e", label: "Tour Packages", url: "/services/tour-packages" },
    { id: "n2f", label: "Hotel Booking", url: "/services/hotel-booking" },
  ]},
  { id: "n3", label: "Destinations", url: "/countries", children: [
    { id: "n3a", label: "All Countries", url: "/countries" },
    { id: "n3b", label: "Europe", url: "/countries#europe" },
    { id: "n3c", label: "GCC / Middle East", url: "/countries#gcc" },
    { id: "n3d", label: "Asia", url: "/countries#asia" },
  ]},
  { id: "n4", label: "About", url: "/about", children: [] },
  { id: "n5", label: "Contact", url: "/contact", children: [] },
];

function buildGlobalHeader() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO_PAD, margin: { top: 0, right: 0, bottom: 0, left: 0 },
    background: { type: "color", color: PRIMARY },
    templateVariant: "solid-with-cta",
    data: {
      logoText: "Life Settle",
      logo: LOGO_URL,
      items: NAV_ITEMS,
      sticky: true, transparent: false, style: "default",
      backgroundColor: PRIMARY, textColor: "#ffffff",
      showCta: true, ctaLabel: "Free Consultation", ctaUrl: "/contact",
    },
  };
}

function buildGlobalFooter() {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full",
    padding: ZERO_PAD, margin: { top: 0, right: 0, bottom: 0, left: 0 },
    background: { type: "none" },
    data: {
      logoText: "Life Settle Travel And Tourism",
      tagline: "Our Aim Is Your Journey — Trusted visa, work permit & travel partner since 2020.",
      style: "dark", backgroundColor: DARK, accentColor: SECONDARY, textColor: "#e5e7eb",
      copyrightText: "© {year} Life Settle Travel And Tourism. All rights reserved.",
      copyrightYear: true, showNewsletter: false,
      socials: [
        { platform: "facebook", url: "https://www.facebook.com/ShiblyFacilitiesManagementServiceLtd" },
        { platform: "whatsapp", url: "https://wa.me/8801750599917" },
      ],
      columns: [
        { id: uid("fc"), heading: "Services", links: [
          { id: uid("fl"), label: "Visa Processing", url: "/services/visa-processing" },
          { id: uid("fl"), label: "Work Permit", url: "/services/work-permit" },
          { id: uid("fl"), label: "Manpower Recruitment", url: "/services/manpower" },
          { id: uid("fl"), label: "Flight Booking", url: "/services/flight-booking" },
          { id: uid("fl"), label: "Tour Packages", url: "/services/tour-packages" },
          { id: uid("fl"), label: "Hotel Booking", url: "/services/hotel-booking" },
        ]},
        { id: uid("fc"), heading: "Destinations", links: [
          { id: uid("fl"), label: "All Countries", url: "/countries" },
          { id: uid("fl"), label: "Serbia", url: "/countries/serbia" },
          { id: uid("fl"), label: "Germany", url: "/countries/germany" },
          { id: uid("fl"), label: "Portugal", url: "/countries/portugal" },
          { id: uid("fl"), label: "Saudi Arabia", url: "/countries/saudi-arabia" },
          { id: uid("fl"), label: "Dubai — UAE", url: "/countries/dubai-uae" },
        ]},
        { id: uid("fc"), heading: "Company", links: [
          { id: uid("fl"), label: "About Us", url: "/about" },
          { id: uid("fl"), label: "Contact", url: "/contact" },
          { id: uid("fl"), label: "Facebook Page", url: "https://www.facebook.com/ShiblyFacilitiesManagementServiceLtd" },
        ]},
      ],
      bottomLinks: [
        { id: uid("bl"), label: "Privacy Policy", url: "/privacy" },
        { id: uid("bl"), label: "Terms of Service", url: "/terms" },
      ],
    },
  };
}

// ─── STUNNING HOME PAGE ───────────────────────────────────────────────────────
function buildHome() {
  const blocks = [];
  let o = 0;

  // 1. HERO — split layout, left text + right animated country badges
  blocks.push({
    ...BASE, id: uid("hero"), type: "hero", order: o++,
    padding: ZERO_PAD,
    templateVariant: "fullscreen-overlay",
    background: {
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1800&q=90&fit=crop",
      imageOverlay: "#030f07",
      imageOverlayOpacity: 0.75,
    },
    data: {
      layout: "centered",
      badge: "🌍  Trusted by 5,000+ Families Across Bangladesh",
      title: "Your Dream Abroad\nStarts Here",
      subtitle: "Our Aim Is Your Journey",
      description: "Zero advance · Pay only after visa approval · 45+ countries covered",
      primaryButton: { label: "🚀 Apply Now — It's Free", url: "/contact", variant: "primary" },
      secondaryButton: { label: "Explore 45+ Countries →", url: "/countries", variant: "outline" },
      typography: {
        titleSize: "7xl",
        titleColor: "#ffffff",
        subtitleColor: SECONDARY,
        descColor: "#86efac",
      },
    },
  });

  // 2. TRUST BAR — gold on deep green
  blocks.push({
    ...BASE, id: uid("trust"), type: "stats", order: o++,
    padding: { top: 36, right: 0, bottom: 36, left: 0 },
    background: { type: "color", color: SECONDARY },
    data: {
      title: "", subtitle: "", layout: "row", columns: 4, animate: true, style: "plain",
      items: [
        { id: uid("st"), value: "5,000+", label: "Visas Approved", icon: "CheckCircle" },
        { id: uid("st"), value: "45+", label: "Countries", icon: "Globe" },
        { id: uid("st"), value: "Zero Advance", label: "Pay After Approval", icon: "Shield" },
        { id: uid("st"), value: "5★ Rated", label: "Client Satisfaction", icon: "Star" },
      ],
    },
  });

  // 3. MARQUEE COUNTRIES — services used as horizontal scroll feel with 8 quick flags
  blocks.push({
    ...BASE, id: uid("flags"), type: "services", order: o++,
    padding: { top: 56, right: 0, bottom: 56, left: 0 },
    background: { type: "color", color: "#f8f6f0" },
    templateVariant: "icon-cards-grid",
    data: {
      title: "Popular Destinations",
      subtitle: "Click a country to see visa types, jobs, salaries and processing time.",
      layout: "grid", columns: 4, cardStyle: "elevated", source: "inline",
      items: [
        { id: uid("c"), title: "🇩🇪 Germany", description: "Work Permit · €2,000–€3,500/mo", icon: "🇩🇪", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=500&q=80&fit=crop&crop=center", linkLabel: "Explore →", link: "/countries/germany" },
        { id: uid("c"), title: "🇵🇹 Portugal", description: "D1 Work Visa · 2 months", icon: "🇵🇹", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/portugal" },
        { id: uid("c"), title: "🇷🇸 Serbia", description: "7-day Approval · €750–800/mo", icon: "🇷🇸", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/serbia" },
        { id: uid("c"), title: "🇷🇴 Romania", description: "Work Visa · 7-8 days", icon: "🇷🇴", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/romania" },
        { id: uid("c"), title: "🇸🇦 Saudi Arabia", description: "Free Visa · Iqama 72hrs", icon: "🇸🇦", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/saudi-arabia" },
        { id: uid("c"), title: "🇦🇪 Dubai — UAE", description: "Employment Visa · 2-4 weeks", icon: "🇦🇪", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/dubai-uae" },
        { id: uid("c"), title: "🇲🇾 Malaysia", description: "Tour Package from ৳81,000", icon: "🇲🇾", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/malaysia" },
        { id: uid("c"), title: "🇳🇵 Nepal", description: "Tour Package from ৳37,000", icon: "🇳🇵", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&q=80&fit=crop", linkLabel: "Explore →", link: "/countries/nepal" },
      ],
    },
  });

  // VIEW ALL CTA (attached)
  blocks.push({
    ...BASE, id: uid("allcta"), type: "cta", order: o++,
    padding: { top: 0, right: 0, bottom: 48, left: 0 },
    background: { type: "color", color: "#f8f6f0" },
    data: {
      title: "",
      description: "We process visas & work permits for 45+ countries across Europe, GCC and Asia.",
      primaryButton: { label: "View All 45+ Countries →", url: "/countries" },
      layout: "centered",
    },
  });

  // 4. SERVICES — dark background, gold accents, 6 cards
  blocks.push({
    ...BASE, id: uid("svc"), type: "services", order: o++,
    padding: { top: 80, right: 0, bottom: 80, left: 0 },
    background: { type: "color", color: DARK },
    templateVariant: "icon-cards-grid",
    data: {
      title: "Our Services",
      subtitle: "Everything for your overseas journey — all under one roof, all with zero advance.",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: [
        { id: uid("sv"), title: "🛂 Visa Processing", description: "All 29 Schengen + non-Schengen Europe + GCC + Asia. Embassy appointments managed.", icon: "🛂", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=600&q=80&fit=crop", linkLabel: "Learn More", link: "/services/visa-processing" },
        { id: uid("sv"), title: "📋 Work Permit", description: "Serbia 7-day approval. Portugal D1 2-month. Saudi Arabia free visa. Zero advance.", icon: "📋", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&fit=crop", linkLabel: "Learn More", link: "/services/work-permit" },
        { id: uid("sv"), title: "👷 Manpower Recruitment", description: "Factory, cleaning, construction jobs in Europe & GCC. Verified employers.", icon: "👷", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=600&q=80&fit=crop", linkLabel: "Learn More", link: "/services/manpower" },
        { id: uid("sv"), title: "✈️ Flight Booking", description: "Best-rate tickets on all major airlines. Group bookings for manpower departure.", icon: "✈️", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", linkLabel: "Book Ticket", link: "/services/flight-booking" },
        { id: uid("sv"), title: "🌍 Tour Packages", description: "All-inclusive packages — Malaysia ৳81K, Nepal ৳37K, Sri Lanka ৳53K.", icon: "🌍", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80&fit=crop", linkLabel: "View Packages", link: "/services/tour-packages" },
        { id: uid("sv"), title: "🏨 Hotel Booking", description: "Budget to luxury hotels worldwide. Visa application letters provided.", icon: "🏨", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&fit=crop", linkLabel: "Book Hotel", link: "/services/hotel-booking" },
      ],
    },
  });

  // 5. ZERO ADVANCE FEATURE — alternating, full bleed, compelling copy
  blocks.push({
    ...BASE, id: uid("feat"), type: "features", order: o++,
    padding: { top: 80, right: 0, bottom: 80, left: 0 },
    background: { type: "color", color: LIGHT_GREEN },
    templateVariant: "alternating-images",
    data: {
      title: "Why 5,000+ Families Choose Life Settle",
      subtitle: "",
      layout: "alternating", columns: 2, style: "minimal",
      items: [
        {
          id: uid("f"),
          title: "Zero Advance — The Only Agency That Waits With You",
          description: "Every other agency takes money upfront. We don't.\n\nYou pay our fee only after your visa is approved and physically in your hand. Not before. Not during. After.\n\nThis policy exists because we are confident in our process — and we believe you should not carry the financial risk of visa rejection.\n\n✅ 5,000+ successful visa approvals since 2020\n✅ 45+ countries across Europe, GCC and Asia\n✅ Embassy appointments fully managed by us\n✅ Document preparation with zero rejection risk\n✅ Real-time application tracking\n✅ Air ticket and hotel booking at best rates",
          imageUrl: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=900&q=85&fit=crop",
          icon: "",
        },
        {
          id: uid("f"),
          title: "Work in Europe — Starting from Serbia",
          description: "Serbia is currently our fastest work permit destination:\n\n🇷🇸 Work permit approval: 7 days\n🇷🇸 Visa sticker: 25 days\n🇷🇸 Salary: €750–800/month (furniture & shoe factories)\n🇷🇸 Accommodation: provided by employer\n\nOther fast options:\n🇧🇦 Bosnia — 7 days approval, sticker 25 days\n🇵🇹 Portugal D1 — 2 months total process\n🇩🇪 Germany — €2,000–3,500/month\n🇸🇦 Saudi Arabia — free visa, iqama in 72 hours\n\nAll work permits processed with zero advance.",
          imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&q=85&fit=crop",
          icon: "",
        },
      ],
    },
  });

  // 6. HOW IT WORKS — 4 steps on dark
  blocks.push({
    ...BASE, id: uid("steps"), type: "steps", order: o++,
    padding: { top: 80, right: 0, bottom: 80, left: 0 },
    background: { type: "color", color: PRIMARY },
    data: {
      title: "How It Works",
      subtitle: "Simple 4-step process — zero upfront risk",
      layout: "horizontal",
      items: [
        { id: uid("s"), step: "01", title: "Free Consultation", description: "WhatsApp or visit our Dhaka office. We assess your eligibility and pick the best visa route — no commitment, no cost." },
        { id: uid("s"), step: "02", title: "Document Prep", description: "We provide a complete checklist. You gather documents; we verify, prepare and translate everything needed." },
        { id: uid("s"), step: "03", title: "Embassy & Tracking", description: "We book your embassy appointment, submit the application and track it daily. You get updates at every stage." },
        { id: uid("s"), step: "04", title: "Visa in Hand → You Pay", description: "Visa approved and stamped? Now you pay our service fee. Not before. That's our promise." },
      ],
    },
  });

  // 7. PRICING — 3 tiers
  blocks.push({
    ...BASE, id: uid("pricing"), type: "pricing", order: o++,
    padding: { top: 80, right: 0, bottom: 80, left: 0 },
    background: { type: "color", color: "#f8f6f0" },
    templateVariant: "highlighted-cards",
    data: {
      title: "Our Packages",
      subtitle: "Transparent pricing — you pay zero until your visa is approved.",
      layout: "cards", billingToggle: false,
      plans: [
        {
          id: uid("p"), name: "Tour Package", price: "From ৳81,000", period: "/person",
          description: "All-inclusive holiday packages",
          features: ["Return air ticket", "e-Visa / Visa processing", "Hotel min 3 nights", "Airport transfer (select destinations)", "Malaysia · Nepal · Sri Lanka · Dubai"],
          highlighted: false, ctaLabel: "Book a Tour", ctaUrl: "/services/tour-packages",
        },
        {
          id: uid("p"), name: "Work Permit", price: "Pay After Visa", period: "",
          description: "Most popular — Europe & GCC work",
          features: ["Full document preparation", "Embassy appointment", "Work permit & visa sticker", "Manpower paperwork", "Air ticket included", "Zero advance required"],
          highlighted: true, badge: "Most Popular", ctaLabel: "Apply Now", ctaUrl: "/contact",
        },
        {
          id: uid("p"), name: "Visa Only", price: "Pay After Visa", period: "",
          description: "Tourist, business or visit visa",
          features: ["All Schengen countries", "Non-Schengen Europe", "GCC tourist & business", "Asia tourist visa", "Document checklist & prep", "Zero advance required"],
          highlighted: false, ctaLabel: "Get My Visa", ctaUrl: "/contact",
        },
      ],
    },
  });

  // 8. TESTIMONIALS
  blocks.push({
    ...BASE, id: uid("tes"), type: "testimonials", order: o++,
    padding: { top: 80, right: 0, bottom: 80, left: 0 },
    background: { type: "color", color: DARK },
    templateVariant: "quote-cards",
    data: {
      title: "Real Stories From Real Clients",
      subtitle: "Join 5,000+ Bangladeshis who trusted Life Settle with their overseas journey.",
      layout: "grid",
      items: [
        { id: uid("t"), name: "Rakibul Islam", role: "Factory Worker", company: "Now in Serbia 🇷🇸", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&crop=face", content: "Life Settle got my Serbia work permit in 45 days. They took zero taka from me until I had the visa sticker in my passport. Truly trustworthy.", rating: 5 },
        { id: uid("t"), name: "Fatema Begum", role: "Hotel Cleaner", company: "Now in Saudi Arabia 🇸🇦", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&crop=face", content: "Free visa to Saudi Arabia. Iqama within 72 hours of arriving. Life Settle made my dream come true — no advance, no stress.", rating: 5 },
        { id: uid("t"), name: "Mahmudul Hassan", role: "Civil Engineer", company: "Portugal D1 Visa 🇵🇹", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&fit=crop&crop=face", content: "Portugal D1 visa done in 2 months. Embassy appointment booked within 1 month. Zero advance. The most professional agency I've worked with.", rating: 5 },
        { id: uid("t"), name: "Nasrin Akter", role: "Teacher", company: "Malaysia Holiday 🇲🇾", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&crop=face", content: "Malaysia package — e-visa, return ticket and 3-night hotel for ৳81,000. Hassle-free. I already booked Nepal for next month!", rating: 5 },
        { id: uid("t"), name: "Jahidul Karim", role: "Construction Worker", company: "Bosnia 🇧🇦", content: "Bosnia work permit in 7 days, sticker in 25 days. €700/month salary paid on time. Life Settle arranged everything including my flight.", rating: 5 },
        { id: uid("t"), name: "Shirin Sultana", role: "Business Owner", company: "Romania Visa 🇷🇴", content: "Romania visa processed in 7-8 days. Zero hidden fees. The team was available on WhatsApp 24/7. Will use Life Settle again for Europe.", rating: 5 },
      ],
    },
  });

  // 9. FAQ
  blocks.push({
    ...BASE, id: uid("faq"), type: "faq", order: o++,
    padding: { top: 80, right: 0, bottom: 80, left: 0 },
    background: { type: "color", color: LIGHT_GREEN },
    templateVariant: "accordion-bordered",
    data: {
      title: "Frequently Asked Questions",
      subtitle: "",
      layout: "accordion", allowMultiple: false,
      items: [
        { id: uid("f"), question: "Do you really take zero advance before visa approval?", answer: "Yes — always, without exception. You pay our service fee only after your visa is approved and in your possession. We have maintained this policy since 2020 across 5,000+ clients." },
        { id: uid("f"), question: "Which is the fastest work permit country right now?", answer: "Serbia: work permit approval in 7 days, visa sticker in 25 days, you can fly within ~2 months total. Bosnia is similar. Saudi Arabia free visa with iqama within 72 hours of arrival (fastest GCC)." },
        { id: uid("f"), question: "What countries do you cover?", answer: "45+ countries: all 29 Schengen states (Germany, Portugal, Italy, France, Spain etc.), 16 non-Schengen European countries (Serbia, Romania, Bosnia, North Macedonia, Belarus, Armenia etc.), 6 GCC states (Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman), plus Malaysia, Nepal, Sri Lanka and Thailand." },
        { id: uid("f"), question: "What are the tour package prices?", answer: "Malaysia full package from ৳81,000 (e-visa ৳4,500 + return ticket ৳50,000 + hotel 3 nights ৳5,000+). Nepal from ৳37,000 (approval ৳500 + return ticket ৳37,000 + hotel ৳3,000+). Sri Lanka from ৳53,200 (ETA ৳3,200 + ticket ৳47,000 + hotel ৳3,000+)." },
        { id: uid("f"), question: "What jobs are available in Europe?", answer: "Factory workers (furniture, shoe, food), cleaners (hotel, office, warehouse), construction (mason, plasterer, carpenter, painter, welder), electricians, excavator operators, restaurant and hotel staff." },
        { id: uid("f"), question: "How do I get started?", answer: "WhatsApp: +8801750599917 | Phone: +8801711145428 | Office: House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207. Free consultation, zero obligation." },
      ],
    },
  });

  // 10. FINAL CTA — bold image
  blocks.push({
    ...BASE, id: uid("cta"), type: "cta", order: o++,
    padding: ZERO_PAD,
    background: {
      type: "image",
      imageUrl: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1400&q=90&fit=crop",
      imageOverlay: PRIMARY,
      imageOverlayOpacity: 0.88,
    },
    templateVariant: "gradient-banner",
    data: {
      title: "Ready to Start Your Journey?",
      description: "Zero advance. Zero risk. Just results. Contact us today — free consultation, no obligation.",
      primaryButton: { label: "📩 Get Free Consultation", url: "/contact" },
      secondaryButton: { label: "💬 WhatsApp Now", url: "https://wa.me/8801750599917" },
      layout: "centered",
    },
  });

  // 11. CONTACT
  blocks.push({
    ...BASE, id: uid("contact"), type: "contact", order: o++,
    padding: { top: 80, right: 0, bottom: 80, left: 0 },
    data: {
      title: "Get In Touch",
      subtitle: "Free consultation — we respond within 24 hours",
      layout: "split", showMap: false, showContactInfo: true,
      phone: "+8801711145428",
      email: "info@lifesettle.com",
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

  return blocks;
}

// ─── STRIP nav/footer from all existing pages ────────────────────────────────
async function stripNavFooterFromPages() {
  const { data: pages } = await supabase.from("pages").select("id, slug, blocks").eq("tenant_id", TENANT_ID);
  if (!pages) return;
  let count = 0;
  for (const page of pages) {
    const orig = page.blocks || [];
    const filtered = orig.filter(b => b.type !== "navigation" && b.type !== "footer");
    if (filtered.length < orig.length) {
      // re-order
      filtered.forEach((b, i) => { b.order = i; });
      await supabase.from("pages").update({ blocks: filtered }).eq("id", page.id);
      count++;
    }
  }
  console.log(`✓ Stripped nav/footer from ${count} pages`);
}

async function run() {
  const now = new Date().toISOString();
  console.log("Life Settle v3 seed starting...\n");

  // 1. Update home page with stunning new layout
  const homeBlocks = buildHome();
  const { data: homePage } = await supabase.from("pages").select("id").eq("tenant_id", TENANT_ID).eq("slug", "home").single();
  if (homePage) {
    await supabase.from("pages").update({ blocks: homeBlocks, updated_at: now }).eq("id", homePage.id);
    console.log("✓ Home page rebuilt with new design");
  } else {
    await supabase.from("pages").insert({ tenant_id: TENANT_ID, title: "Home", slug: "home", status: "published", blocks: homeBlocks, created_at: now, updated_at: now });
    console.log("✓ Home page created");
  }

  // 2. Strip nav+footer blocks from ALL pages (global layout handles them)
  await stripNavFooterFromPages();

  // 3. Update global_header (with logo) + global_footer + logo_url in site_identity
  const { error: idErr } = await supabase.from("site_identity").update({
    logo_url: LOGO_URL,
    logo_alt: "Life Settle Travel And Tourism",
    logo_width: 160,
    site_name: "Life Settle Travel And Tourism",
    tagline: "Our Aim Is Your Journey",
    global_header: buildGlobalHeader(),
    global_footer: buildGlobalFooter(),
    updated_at: now,
  }).eq("tenant_id", TENANT_ID);

  if (idErr) console.error("site_identity error:", idErr.message);
  else console.log("✓ site_identity updated — logo set, global nav/footer refreshed");

  console.log("\n✅ Done! Visit: https://lifesettle.passivecoder.com/");
}

run().catch(console.error);
