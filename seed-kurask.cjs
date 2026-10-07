/**
 * Kurask Service Limited — Al Khobar, Saudi Arabia. Construction & MEP.
 * Pro client, imported from their WordPress/Elementor site kuraskksa.com
 * (2026-10-05). Copy is the client's own wording; photos, renders and logo are
 * the client's own files from that site (clients/Kurask KSA/site-assets).
 * Page slugs match the old WordPress URLs so links and rankings carry over.
 * Native blocks only (no custom_html); rebuilt that way 2026-10-08.
 * Old site was compromised (casino spam posts, spam "reviews"): none imported.
 * Not a demo: no demo_expires_at. Safe to re-run (--skip-assets skips uploads).
 * Source of truth copy: clients/Kurask KSA/build/seed-kurask.cjs
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro until handover to the client
const SLUG = "kurask";
const PLAN = "pro";
const TEMPLATE_SLUG = "cleaning-simple"; // empty custom_css, so our palette wins
const ASSET_DIR = path.join(__dirname, "..", "clients", "Kurask KSA", "site-assets");

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Kurask Service Limited";
// Old site showed "+9660503780476" (trunk 0 kept after +966, so its wa.me link was broken).
const PHONE = "+966503780476";
const PHONE_DISPLAY = "+966 50 378 0476";
const WA_NUMBER = "966503780476";
const EMAIL = "kuraskksa@gmail.com";
const ADDRESS = "Al Khobar, Saudi Arabia";
const MAP_EMBED = "https://www.google.com/maps?q=Al%20Khobar%2C%20Saudi%20Arabia&z=12&output=embed";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hello Kurask, I would like a free consultation.");

const TEAL = "#187295";   // logo deep teal, primary
const SKY = "#2EA8DC";    // logo sky blue
const SUN = "#F5D90A";    // logo "K" yellow, accent
const NAVY = "#0B2F45";   // deep band colour
const INK = "#10222E";
const PAPER = "#FFFFFF";
const MIST = "#EEF6FA";
const LINE = "#D3E4EC";
const H = `"Outfit",sans-serif`;

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
const LOGO = asset("kurask-logo.png");
const LOGO_LIGHT = asset("kurask-logo-light.png");
const FAVICON_URL = asset("favicon.png");

const IMG = {
  villa1: asset("kurask-villa-1.jpg"), villa2: asset("kurask-villa-2.jpg"), villa3: asset("kurask-villa-3.jpg"),
  villa4: asset("kurask-villa-4.jpg"), villa5: asset("kurask-villa-5.jpg"), villa6: asset("kurask-villa-6.jpg"),
  villa7: asset("kurask-villa-7.jpg"), gate: asset("kurask-villa-gate.jpg"),
  about: asset("kurask-about.jpg"), contracting: asset("kurask-contracting.jpg"), city: asset("kurask-contracting-city.jpg"),
  electrical: asset("kurask-electrical.jpg"), plumbing: asset("kurask-plumbing.jpg"),
  acFit: asset("kurask-ac-fittings.jpg"), acServ: asset("kurask-ac-servicing.jpg"),
};
// Real site photos from the client (01-22; 23-25 were duplicates and are skipped).
const SITE = Array.from({ length: 22 }, (_, i) => asset(`kurask-site-${String(i + 1).padStart(2, "0")}.jpg`));

const STEPS = [
  ["Tell us about the job", "Call or WhatsApp us with your project, location and a few photos."],
  ["Site visit & quote", "We inspect where needed and send a clear, transparent quote."],
  ["Work delivered", "Our team completes the work on schedule, to safety and quality standards."],
];

// ─── Services (client's own wording) ────────────────────────────────────────
const SERVICES = [
  {
    slug: "contracting-building-construction", icon: "Building2", title: "Contracting (Building Construction)", nav: "Building Construction",
    img: IMG.contracting, photo: SITE[6], tagline: "Building Excellence with Precision and Quality",
    short: "From residential to commercial projects, we deliver high-quality construction services with strong foundations, modern designs, and efficient execution.",
    intro: "At Kurask Service Limited, we are committed to delivering high-quality, durable, and innovative building construction solutions. Whether it's a residential, commercial, or industrial project, our experienced team ensures structural integrity, modern design, and efficient execution to meet the highest industry standards. We handle everything from planning and design to construction and finishing, ensuring a seamless and hassle-free experience for our clients.",
    includes: [
      ["Residential & Commercial Construction", "We specialize in building houses, apartments, offices, shopping centers, and industrial facilities, ensuring each project is designed and built to last."],
      ["Structural Engineering & Foundation Work", "A strong foundation is the key to any successful construction project. Our team ensures structural stability, load-bearing capacity, and long-term durability with advanced engineering techniques."],
      ["Renovation & Remodeling", "We transform existing buildings with modern designs, enhanced functionality, and improved aesthetics while ensuring minimal disruption to operations or daily life."],
      ["Interior & Exterior Finishing", "From painting, tiling, and flooring to facades, roofing, and waterproofing, we provide high-quality finishing services to enhance the beauty and functionality of your property."],
      ["Project Planning & Management", "We offer comprehensive project planning, budgeting, and management services to ensure smooth execution, timely delivery, and cost-effectiveness."],
    ],
    why: [
      ["Experienced Engineers & Skilled Workforce", "Our team consists of highly trained professionals with extensive industry expertise."],
      ["High-Quality Materials & Workmanship", "We use only the best materials to ensure durability, safety, and aesthetic appeal."],
      ["On-Time Project Completion", "With structured planning and efficient execution, we deliver projects within the agreed timeline."],
      ["Cost-Effective & Transparent Pricing", "Competitive pricing without compromising quality or service excellence."],
      ["Compliance with Safety & Industry Standards", "We follow strict safety regulations and industry best practices to ensure secure and compliant construction."],
      ["Custom-Tailored Solutions", "Every project is designed to fit the client's unique needs, preferences, and budget."],
    ],
    close: ["Let's Build Your Vision Together!", "Contact Kurask Service Limited today to discuss your construction needs. We'll help you bring your project to life with expertise and professionalism."],
  },
  {
    slug: "electrical-services", icon: "Zap", title: "Electrical Services", img: IMG.electrical, photo: IMG.villa4,
    tagline: "Reliable & Safe Electrical Solutions for Your Needs",
    short: "Safe, efficient electrical installations, maintenance, and repairs for residential, commercial, and industrial projects.",
    intro: "At Kurask Service Limited, we provide professional electrical services for residential, commercial, and industrial projects. Our certified electricians ensure safe, efficient, and high-quality electrical installations, maintenance, and repairs to meet the highest industry standards. Whether you need new wiring, system upgrades, or troubleshooting, we have the expertise to deliver reliable solutions.",
    includes: [
      ["Electrical Installations", "Complete wiring for new buildings, homes, and offices. Installation of electrical panels, switches, and outlets. Lighting system installation (indoor, outdoor, and decorative)."],
      ["Electrical Repairs & Maintenance", "Diagnosing and fixing faulty wiring and circuits. Repair and replacement of electrical components. Preventive maintenance to ensure system efficiency and safety."],
      ["Power Distribution & Panel Upgrades", "Electrical panel installation and upgrades. Load balancing and power distribution solutions. Circuit breaker installation and repair."],
      ["Industrial & Commercial Electrical Solutions", "High-voltage electrical system setup. Machinery and equipment wiring. Emergency power and backup systems installation."],
      ["Smart Home & Energy-Efficient Solutions", "Automation and smart lighting installation. Energy-efficient solutions to reduce power consumption. Solar panel and renewable energy system integration."],
    ],
    why: [
      ["Certified & Experienced Electricians", "Skilled professionals ensuring high-quality workmanship."],
      ["Safe & Code-Compliant Solutions", "We follow strict electrical safety standards."],
      ["Reliable & Efficient Services", "Quick response times and minimal downtime."],
      ["Affordable Pricing", "Competitive rates without compromising on quality."],
      ["Comprehensive Electrical Support", "From installations to repairs and maintenance, we handle it all."],
    ],
    close: ["Power Up Your Space with Kurask Service Limited!", "For safe and professional electrical services, contact us today."],
  },
  {
    slug: "plumbing-services", icon: "Wrench", title: "Plumbing Services", img: IMG.plumbing, photo: IMG.villa2,
    tagline: "Efficient, Reliable, and Affordable Plumbing Solutions",
    short: "Our plumbing solutions include pipe installations, leak repairs, drainage systems, and maintenance for homes and businesses.",
    intro: "At Kurask Service Limited, we provide professional plumbing services for residential, commercial, and industrial needs. Our experienced plumbers deliver high-quality, long-lasting plumbing solutions to ensure the proper functioning of your water, drainage, and gas systems. Whether it's leak repairs, pipe installations, or system maintenance, we offer expert services that guarantee your peace of mind.",
    includes: [
      ["Pipe Installation & Replacement", "Installation of new piping systems for residential, commercial, and industrial properties. Pipe replacement and upgrades to improve water flow and system efficiency."],
      ["Leak Detection & Repairs", "Identifying hidden leaks through advanced techniques. Fast and effective repairs to prevent water damage and minimize disruption."],
      ["Drainage & Sewer Services", "Clearing clogged drains and pipes. Installing and repairing sewer systems and stormwater drains."],
      ["Water Heater Installation & Repair", "Installation of electric and gas water heaters. Repair and maintenance services to ensure optimal performance and energy efficiency."],
      ["Bathroom & Kitchen Plumbing", "Plumbing installations for sinks, toilets, showers, and bathtubs. Maintenance and repairs for faucets, drainage, and water supply systems."],
      ["Gas Line Services", "Safe and professional installation, repair, and maintenance of gas pipelines. Gas leak detection and emergency repairs."],
    ],
    why: [
      ["Certified & Experienced Plumbers", "Skilled experts with extensive experience in plumbing."],
      ["Fast Response & Emergency Services", "Quick solutions for plumbing issues, available 24/7 for emergencies."],
      ["High-Quality Materials", "We use durable, high-quality materials to ensure long-term reliability."],
      ["Affordable & Transparent Pricing", "Competitive rates and upfront pricing with no hidden costs."],
      ["Comprehensive Plumbing Solutions", "From installation to maintenance and repairs, we handle all your plumbing needs."],
    ],
    close: ["Fix Your Plumbing Issues with Kurask Service Limited!", "For professional plumbing services that you can trust, contact us today."],
  },
  {
    slug: "new-ac-fittings", icon: "AirVent", title: "New AC Fittings", img: IMG.acFit, photo: IMG.villa3,
    tagline: "Professional AC Installation & Fittings for Comfort and Efficiency",
    short: "Stay cool with our professional air conditioning installation services. We fit new AC units efficiently, ensuring optimal cooling performance.",
    intro: "At Kurask Service Limited, we specialize in new AC fittings to ensure your home or business stays cool and comfortable throughout the year. Our skilled technicians provide efficient and precise AC installations tailored to your space's specific needs. From split systems to central air conditioning, we handle all types of installations to keep your cooling systems working at peak efficiency.",
    includes: [
      ["AC Installation & Setup", "Professional installation of new air conditioning systems (split, window, or central AC). Expert placement and fitting for optimal airflow and energy efficiency. Installation of thermostats and remote control systems."],
      ["System Sizing & Design", "Accurate calculations to ensure the right AC system size for your space. Custom airflow designs to maximize cooling efficiency. Ductwork and piping for central air systems."],
      ["AC Unit Replacement", "Removal and replacement of old or inefficient AC units with new, energy-efficient models. Upgrade your current system to more powerful and cost-effective options."],
      ["Ductwork & Piping Installation", "Installation of ductwork and piping systems for central air conditioning setups, ensuring optimal air circulation and cooling efficiency throughout your space."],
      ["AC System Upgrades & Customization", "Upgrading your existing system for improved performance and energy savings. Custom solutions including smart control systems and eco-friendly features."],
    ],
    why: [
      ["Expert Technicians", "Our team has years of experience installing all types of AC systems."],
      ["Precise Sizing & Installation", "We ensure your new system is correctly sized and installed for maximum efficiency."],
      ["Energy-Efficient Solutions", "We recommend and install eco-friendly and cost-effective AC units to save you money in the long run."],
      ["Quick & Reliable Service", "Installation done efficiently with minimal disruption to your daily routine."],
      ["Affordable Pricing", "Competitive rates for quality services and premium AC units."],
    ],
    close: ["Stay Cool with Professional AC Fittings from Kurask Service Limited!", "For a new, efficient, and well-fitted AC system, contact us today."],
  },
  {
    slug: "ac-servicing", icon: "Fan", title: "AC Servicing", img: IMG.acServ, photo: IMG.villa5,
    tagline: "Keep Your AC Running at Peak Performance",
    short: "Regular servicing extends the life of your AC unit. Our experts provide thorough inspections, cleaning, and repairs for peak efficiency.",
    intro: "At Kurask Service Limited, we provide comprehensive AC servicing to ensure your cooling system operates smoothly and efficiently. Regular maintenance helps prevent unexpected breakdowns, enhances energy efficiency, and extends the lifespan of your AC unit. Our skilled technicians perform detailed inspections, cleaning, and repairs to ensure your AC is working at its best.",
    includes: [
      ["AC Cleaning", "Thorough cleaning of filters, coils, and fan blades to ensure proper airflow and cooling performance. Removal of dirt, dust, and debris that can affect air quality and efficiency."],
      ["Refrigerant Check & Refill", "Checking refrigerant levels and recharging if necessary to maintain proper cooling efficiency. Ensuring no refrigerant leaks that could lead to reduced performance."],
      ["System Inspection", "Comprehensive inspection of all AC components, including electrical connections, thermostat settings, and ductwork. Identifying potential issues before they lead to major problems."],
      ["Coil Cleaning & Inspection", "Cleaning of evaporator and condenser coils to prevent blockages and optimize heat exchange. Inspection for any signs of wear or damage."],
      ["Air Filter Replacement", "Replacing air filters to improve airflow and maintain air quality in your home or business. Helps reduce allergens, dust, and other particles in the air."],
      ["Drain Cleaning & Condensation Check", "Ensuring the condensate drain is clear and functioning properly to prevent water damage and mold growth."],
      ["Performance Testing & Calibration", "Testing the overall performance of your AC system and ensuring that it's running at optimal efficiency. Calibrating thermostats for accurate temperature control."],
    ],
    why: [
      ["Experienced Technicians", "Our team of certified professionals is trained to handle all types of AC units."],
      ["Preventive Maintenance", "Regular servicing to extend the lifespan of your system and avoid costly repairs."],
      ["Improved Efficiency", "Clean and well-maintained units work more efficiently, saving energy and lowering utility bills."],
      ["Affordable & Transparent Pricing", "Fair and competitive pricing with no hidden charges."],
      ["Quick & Reliable Service", "We offer prompt scheduling and efficient service, ensuring your AC is up and running in no time."],
    ],
    close: ["Ensure Your Comfort with Expert AC Servicing!", "Contact us today to schedule your AC servicing and keep your system running smoothly year-round."],
  },
];
for (const s of SERVICES) s.nav = s.nav || s.title;
const svcUrl = (s) => `/${s.slug}`;

const PAGES = [
  ["home", "Home", "/"],
  ["our-services", "Our Services", "/our-services"],
  ...SERVICES.map((s) => [s.slug, s.title, svcUrl(s), true]),
  ["about", "About", "/about"],
  ["contact", "Contact", "/contact"],
];
const TOP_PAGES = PAGES.filter((p) => !p[3]);

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = { visible: true, width: "full", padding: { top: 88, right: 24, bottom: 88, left: 24 }, margin: ZERO, background: { type: "none" } };
const bgColor = (color) => ({ type: "color", color });
const block = (type, variant, data, o = {}) => ({ ...BASE, id: uid(type), type, ...(variant ? { templateVariant: variant } : {}), ...o, data });
const COLORS = { dark: NAVY, accent: SKY };
const TYPO = { titleSize: "6xl", titleColor: "#ffffff", subtitleColor: "#ffffff", descColor: "#ffffff" };
const NUM = (i) => String(i + 1).padStart(2, "0");


// ─── header / footer ────────────────────────────────────────────────────────
function navItems() {
  return TOP_PAGES.map(([, label, url], i) => ({
    id: `n${i}`, label, url,
    children: url === "/our-services" ? SERVICES.map((s, k) => ({ id: `n${i}-${k}`, label: s.nav, url: svcUrl(s), children: [] })) : [],
  }));
}


function header() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full", padding: ZERO, margin: ZERO, background: bgColor(PAPER),
    data: {
      logoText: SITE_NAME, logo: LOGO, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: TEAL, ctaVariant: "solid", logoHeight: 56, logoCaption: "",
      showCta: true, ctaLabel: "Free Consultation", ctaUrl: WA,
      topBar: {
        show: true, showPhone: true, showWhatsapp: true, whatsappLabel: "WhatsApp",
        whatsappText: "Hello Kurask, I would like a free consultation.", background: NAVY, textColor: "#C9DEEA",
        items: [
          { id: "tb1", text: ADDRESS, icon: "pin", side: "left" },
          { id: "tb2", text: "24/7 support & maintenance", icon: "clock", side: "left", hideOnMobile: true },
          { id: "tb3", text: EMAIL, icon: "mail", url: `mailto:${EMAIL}`, side: "right", hideOnMobile: true },
        ],
      },
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full", padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_LIGHT, logoText: SITE_NAME, logoCaption: "Al Khobar, Saudi Arabia",
      tagline: "Your Trusted Partner in Construction & MEP Services.",
      style: "dark", backgroundColor: NAVY, accentColor: SUN, textColor: "#C9DEEA",
      copyrightText: `© {year} ${SITE_NAME}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Our Services", links: SERVICES.map((s) => ({ id: uid("fl"), label: s.nav, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Company", links: TOP_PAGES.map(([, label, url]) => ({ id: uid("fl"), label, url })) },
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: `WhatsApp ${PHONE_DISPLAY}`, url: WA },
          { id: uid("fl"), label: EMAIL, url: `mailto:${EMAIL}` },
          { id: uid("fl"), label: ADDRESS, url: "/contact" },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── home sections ──────────────────────────────────────────────────────────
function heroHome() {
  return block("hero", "spec-card", {
    layout: "left", badge: "Welcome to Kurask Service Limited",
    title: "Your Trusted Partner in", titleAccent: "Construction & MEP Solutions",
    description: "We bring expertise, precision, and reliability to every project. Building construction, electrical work, plumbing, and air conditioning services across Saudi Arabia.",
    primaryButton: { label: "Get a Free Consultation", url: WA, variant: "primary" },
    secondaryButton: { label: "Our Services", url: "/our-services", variant: "outline" },
    imageUrl: IMG.villa4, imageAlt: "Villa project by Kurask Service Limited", overlayOpacity: 0.35,
    strip: SERVICES.map((s) => ({ id: s.slug, title: s.nav, subtitle: "", url: svcUrl(s) })),
    colors: COLORS, typography: TYPO,
  }, { padding: ZERO });
}


function servicesGrid(bg = MIST, title = "Our Services") {
  return block("services", "bento", {
    eyebrow: "What we do", title,
    subtitle: "Construction, electrical, plumbing and AC solutions, from one experienced team. Choose a service to see what is included.",
    layout: "grid", columns: 4, cardStyle: "flat", source: "inline", colors: COLORS,
    items: SERVICES.map((s) => ({ id: s.slug, title: s.title, description: s.short, icon: s.icon, iconType: "lucide", imageUrl: s.img, link: svcUrl(s), linkLabel: "Learn more" })),
  }, { background: bgColor(bg) });
}

const WHY_HOME = [
  ["Experienced Professionals", "Our team consists of highly skilled engineers, technicians, and craftsmen with years of industry experience. We are committed to delivering quality workmanship in every project."],
  ["Reliable & Efficient Solutions", "We value your time and investment. Our structured project management ensures on-time completion with precision, using the latest technologies and best practices."],
  ["Customer Satisfaction", "Your satisfaction is our priority. We listen to your requirements, provide tailored solutions, and maintain open communication throughout the project."],
  ["Affordable Pricing", "We offer competitive pricing without compromising quality. Our transparent pricing structure ensures you get the best value for your investment."],
  ["Comprehensive Services", "From construction to electrical, plumbing, and AC solutions, we provide end-to-end services under one roof, ensuring seamless project execution."],
  ["Commitment to Safety & Quality", "We adhere to strict safety regulations and quality standards, ensuring a secure and durable outcome for every project."],
  ["24/7 Support & Maintenance", "Our dedicated support team is available to address any issues promptly, ensuring uninterrupted service for our clients."],
];

function whyDark(items = WHY_HOME, title = "Why Choose Kurask Service Limited?") {
  return block("features", "numbered-grid", {
    eyebrow: "Why choose us", title, tone: "dark", layout: "grid", columns: 4, style: "minimal", colors: COLORS,
    items: items.map(([title, description], i) => ({ id: `wy${i}`, title, description })),
  }, { padding: ZERO });
}

function projectGallery(bg = PAPER) {
  const pics = [IMG.villa2, SITE[20], IMG.gate, SITE[18], SITE[6], IMG.villa7, SITE[14], SITE[2]];
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg), templateVariant: "masonry",
    data: {
      title: "Image Gallery", subtitle: "Villa designs and work in progress on our sites", layout: "masonry", columns: 4, gap: "md", lightbox: true,
      images: pics.map((url) => ({ id: uid("gi"), url, alt: "Kurask Service Limited project", caption: "" })),
    },
  };
}

function processSteps(bg = MIST) {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg), templateVariant: "big-numbers",
    data: {
      title: "How we work", subtitle: "From first call to handover", layout: "horizontal", style: "connected",
      items: STEPS.map(([title, description], i) => ({ id: uid("s"), step: NUM(i), title, description })),
    },
  };
}

function ctaBand(title = "Get a Free Consultation", text = "Contact Kurask Service Limited today for expert construction, electrical, plumbing, and AC solutions. Our team is ready to assist you with high-quality, reliable, and affordable services. Let's bring your project to life.") {
  return block("cta", "gradient-banner", {
    title, description: text, layout: "centered",
    primaryButton: { label: "WhatsApp Us", url: WA }, secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
  }, { background: { type: "gradient", gradient: `linear-gradient(135deg, ${TEAL} 0%, ${NAVY} 100%)` } });
}

// ─── inner page sections ────────────────────────────────────────────────────
function innerHero({ title, description, img }) {
  return block("hero", "page-banner", {
    layout: "left", badge: "Kurask Service Limited", title, description, showBreadcrumb: true,
    primaryButton: { label: "Free Consultation", url: WA, variant: "primary" },
    secondaryButton: { label: PHONE_DISPLAY, url: `tel:${PHONE}`, variant: "outline" },
    imageUrl: img, overlayOpacity: 0.3, colors: COLORS, typography: TYPO,
  }, { padding: ZERO });
}

function svcOverview(s) {
  return block("features", "overview-quote", {
    eyebrow: s.title, title: s.tagline, description: s.intro, tags: [],
    layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
    card: {
      imageUrl: s.photo, title: "Get a free consultation",
      text: "Send your requirements and a few photos on WhatsApp. We reply with next steps and a clear quote.",
      buttonLabel: "Ask on WhatsApp", whatsapp: true, whatsappText: `Hello Kurask, I would like a quote for ${s.title}.`,
    },
  }, { background: bgColor(PAPER) });
}

function svcIncludes(s, bg = MIST) {
  return block("features", "numbered-grid", {
    eyebrow: "What's included", title: `Our ${s.nav} services include`, tone: "light",
    layout: "grid", columns: 3, style: "minimal", colors: COLORS,
    items: s.includes.map(([title, description], i) => ({ id: `in${i}`, title, description })),
  }, { background: bgColor(bg) });
}

function svcWhy(s, bg = PAPER) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg), templateVariant: "split-list",
    data: {
      title: `Why Choose Kurask Service Limited for ${s.nav}?`, subtitle: "Why choose us", description: s.short,
      layout: "split", columns: 2, style: "minimal", imageUrl: s.img,
      items: s.why.map(([title, description]) => ({ id: uid("f"), icon: "CircleCheck", title, description })),
    },
  };
}

function otherServices(cur, bg = MIST) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg), templateVariant: "image-tiles",
    data: {
      title: "Other services", subtitle: "", layout: "grid", columns: 4, cardStyle: "elevated", source: "inline",
      items: SERVICES.filter((x) => x.slug !== cur.slug).map((x) => ({
        id: uid("sv"), title: x.nav, description: x.short, icon: x.icon, iconType: "lucide", imageUrl: x.img, linkLabel: "View service", link: svcUrl(x),
      })),
    },
  };
}

function aboutStory() {
  return block("features", "image-stats", {
    eyebrow: "About us", title: "A trusted name in construction and MEP services in Saudi Arabia.",
    description: "Kurask Service Limited is a trusted name in construction, electrical, plumbing, and air conditioning services in Saudi Arabia. With years of expertise, we deliver high-quality solutions tailored to meet residential, commercial, and industrial needs.\n\nOur team of skilled professionals ensures precision, efficiency, and customer satisfaction in every project.",
    imageUrl: IMG.villa1, badge: { title: "5 services", text: "under one roof" },
    layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
    buttons: [{ id: "b1", label: "Free Consultation", url: WA, style: "solid" }, { id: "b2", label: "Our Services", url: "/our-services", style: "outline" }],
  }, { background: bgColor(PAPER) });
}

function missionVision(bg = MIST) {
  return block("features", "highlight-cards", {
    title: "Mission & Vision", subtitle: "What drives us", layout: "grid", columns: 2, style: "cards",
    items: [
      { id: "mv1", icon: "Target", title: "Our Mission", description: "To provide reliable, high-quality, and cost-effective solutions while maintaining the highest industry standards. We are committed to excellence, safety, and timely project completion to meet and exceed client expectations." },
      { id: "mv2", icon: "Eye", title: "Our Vision", description: "To be a leading service provider in construction and MEP solutions, recognized for innovation, professionalism, and quality workmanship." },
    ],
  }, { background: bgColor(bg) });
}

function aboutWhy(bg = MIST) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg), templateVariant: "icon-list-cards",
    data: {
      title: "Why Choose Us?", subtitle: "Our strengths", description: "", layout: "grid", columns: 3, style: "cards",
      items: [
        ["Users", "Expert Team", "Skilled professionals with years of industry experience."],
        ["BadgeCheck", "Quality Assurance", "Commitment to delivering top-notch services."],
        ["Clock", "Timely Execution", "Projects completed efficiently without delays."],
        ["Handshake", "Customer-Centric Approach", "Tailored solutions to meet specific needs."],
        ["Wallet", "Affordable Services", "Competitive pricing without compromising quality."],
        ["ShieldCheck", "Safety First", "Strict safety regulations and quality standards on every project."],
      ].map(([icon, title, description]) => ({ id: uid("f"), icon, title, description })),
    },
  };
}

function sitePhotos(bg = PAPER) {
  const pics = [SITE[0], SITE[1], SITE[8], SITE[17], SITE[16], SITE[19], SITE[21], SITE[10]];
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg), templateVariant: "grid-clean",
    data: {
      title: "On site with our team", subtitle: "Structural, formwork and reinforcement work in progress", layout: "grid", columns: 4, gap: "md", lightbox: true,
      images: pics.map((url) => ({ id: uid("gi"), url, alt: "Kurask Service Limited construction site", caption: "" })),
    },
  };
}

function contactCards(bg = PAPER) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg), templateVariant: "colored-tiles",
    data: {
      title: "Get in touch", subtitle: "We're here to assist you with all your construction, electrical, plumbing, and AC service needs.", columns: 4, iconSize: "md",
      items: [
        ["Phone", "Phone", PHONE_DISPLAY, `tel:${PHONE}`],
        ["MessageCircle", "WhatsApp", PHONE_DISPLAY, WA],
        ["Mail", "Email", EMAIL, `mailto:${EMAIL}`],
        ["MapPin", "Address", ADDRESS, "https://www.google.com/maps?q=Al%20Khobar%2C%20Saudi%20Arabia"],
      ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: TEAL, label, description, url })),
    },
  };
}

function contactForm(bg = MIST) {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: "Send us a message", subtitle: "Whether you have a project in mind or need professional maintenance, our team is ready to help. For the fastest reply, use WhatsApp.",
      layout: "split", showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: PHONE_DISPLAY, email: EMAIL, address: ADDRESS, recipientEmail: EMAIL,
      fields: [
        { id: "f-name", label: "Full name", type: "text", required: true },
        { id: "f-phone", label: "Mobile / WhatsApp", type: "tel", required: true },
        { id: "f-email", label: "Email", type: "email", required: false },
        { id: "f-svc", label: "Service", type: "select", required: false, options: [...SERVICES.map((s) => s.title), "Other"] },
        { id: "f-msg", label: "Project details", type: "textarea", required: false },
      ],
      submitLabel: "Send Message", successMessage: "Thank you. Our team will contact you shortly. For a faster reply, message us on WhatsApp.",
    },
  };
}

const FAQ = [
  ["Which areas do you serve?", "We are based in Al Khobar and serve clients across Saudi Arabia. Send your location on WhatsApp and we will confirm."],
  ["Do you handle residential, commercial and industrial projects?", "Yes. Our construction, electrical, plumbing and AC services cover residential, commercial, and industrial properties."],
  ["How do I get a quote?", `Call or WhatsApp us at ${PHONE_DISPLAY} with your requirements and a few photos. Consultations are free.`],
  ["Do you offer emergency support?", "Yes. Our support team is available 24/7 for maintenance issues and emergency plumbing repairs."],
];
function faq(bg = PAPER) {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg), templateVariant: "two-column-grid",
    data: { title: "Frequently Asked Questions", subtitle: "Still have a question? Message us on WhatsApp.", layout: "accordion", allowMultiple: false,
      items: FAQ.map(([question, answer]) => ({ id: uid("f"), question, answer })) },
  };
}

function introStock(bg = PAPER) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg), templateVariant: "alternating-media",
    data: {
      title: "Construction and MEP, delivered under one roof", subtitle: "Who we are", layout: "alternating", columns: 2, style: "minimal",
      items: [
        { id: uid("f"), icon: "Building2", imageUrl: IMG.villa1, title: "Built with expertise and precision", description: "At Kurask Service Limited, we bring expertise, precision, and reliability to every project we undertake. Specializing in building construction, electrical work, plumbing, and air conditioning services, we ensure high-quality results that meet industry standards.", link: "/about", linkLabel: "About Kurask" },
        { id: uid("f"), icon: "HardHat", imageUrl: SITE[21], title: "Our own team on every site", description: "Whether you need a new construction project managed with excellence or require expert MEP solutions, we are here to serve you, from foundations and formwork to final fit-out.", link: "/contracting-building-construction", linkLabel: "Building construction" },
      ],
    },
  };
}
function processStepsArrow() { return processStepsArrow(); }
function processStepsArrow(bg = PAPER) {
  return { ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg), templateVariant: "arrow-flow",
    data: { title: "How we work", subtitle: "From first call to handover", layout: "horizontal", style: "connected",
      items: STEPS.map(([title, description], i) => ({ id: uid("s"), step: NUM(i), title, description })) } };
}

// ─── pages ──────────────────────────────────────────────────────────────────
const BUILDERS = {
  home: () => [heroHome(), servicesGrid(PAPER), projectGallery(MIST), introStock(PAPER), whyDark(), processStepsArrow(), faq(MIST), ctaBand()],
  "our-services": () => [
    innerHero({ title: "Construction & MEP Services", description: "Building construction, electrical, plumbing, new AC fittings and AC servicing for residential, commercial and industrial clients.", img: IMG.city }),
    servicesGrid(PAPER, "Choose the service you need"),
    processSteps(MIST),
    ctaBand(),
  ],
  about: () => [
    innerHero({ title: "About Kurask Service Limited", description: "Construction, electrical, plumbing, and air conditioning services in Saudi Arabia, delivered with precision and care.", img: IMG.about }),
    aboutStory(),
    missionVision(MIST),
    aboutWhy(PAPER),
    sitePhotos(MIST),
    ctaBand("Let's bring your project to life", "Call or message us for a free consultation."),
  ],
  contact: () => [
    innerHero({ title: "Contact Us", description: `Call or WhatsApp ${PHONE_DISPLAY}, email ${EMAIL}, or send the form below.`, img: IMG.villa3 }),
    contactCards(PAPER),
    contactForm(MIST),
  ],
};
for (const s of SERVICES) {
  BUILDERS[s.slug] = () => [
    innerHero({ title: s.title, description: s.tagline, img: s.img }),
    svcOverview(s),
    svcIncludes(s),
    svcWhy(s),
    otherServices(s),
    ctaBand(s.close[0], s.close[1]),
  ];
}

const SEO = {
  home: ["Construction & MEP Services in Al Khobar, Saudi Arabia", "Kurask Service Limited: building construction, electrical, plumbing, new AC fittings and AC servicing for residential, commercial and industrial clients in Saudi Arabia."],
  "our-services": ["Construction, Electrical, Plumbing & AC Services", "Building construction, electrical services, plumbing, new AC fittings and AC servicing from Kurask Service Limited, Al Khobar."],
  about: ["About Kurask Service Limited", "A trusted name in construction, electrical, plumbing and air conditioning services in Saudi Arabia."],
  contact: ["Contact Kurask Service Limited", `Call or WhatsApp ${PHONE_DISPLAY} or email ${EMAIL}. Al Khobar, Saudi Arabia.`],
};
for (const s of SERVICES) SEO[s.slug] = [`${s.nav} in Al Khobar, Saudi Arabia`, s.intro.replace("At Kurask Service Limited, ", "").slice(0, 158)];

// ─── write ──────────────────────────────────────────────────────────────────
async function ensureTenant() {
  const { data: existing } = await sb.from("tenants").select("id").eq("slug", SLUG).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await sb.from("tenants").insert({
    name: SITE_NAME, slug: SLUG, plan: PLAN, status: "active", owner_id: OWNER_ID, onboarding_completed: true,
  }).select("id").single();
  if (error) throw new Error(`tenant: ${error.message}`);
  const id = data.id;
  await sb.from("tenant_members").insert({ tenant_id: id, user_id: OWNER_ID, role: "owner" });
  await sb.from("subscriptions").upsert(
    { tenant_id: id, plan_id: PLAN, status: "active", billing_cycle: "yearly", payment_method: "manual", notes: "Existing client, imported from WordPress kuraskksa.com 2026-10-05" },
    { onConflict: "tenant_id" },
  );
  await sb.from("contact_details").insert({
    tenant_id: id, label: "Main", phone: PHONE, whatsapp: WA_NUMBER, email: EMAIL,
    address: ADDRESS, is_primary: true, floating_whatsapp: true, floating_call: true, sort_order: 0,
  });
  console.log("✓ tenant created", id);
  return id;
}

async function uploadAssets(tenantId) {
  const { data: existingMedia } = await sb.from("media").select("storage_path").eq("tenant_id", tenantId);
  const known = new Set((existingMedia ?? []).map((m) => m.storage_path));
  let n = 0;
  for (const file of fs.readdirSync(ASSET_DIR)) {
    if (!/\.(jpg|png)$/.test(file)) continue;
    const buffer = fs.readFileSync(path.join(ASSET_DIR, file));
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
  await sb.from("contact_details").update({ floating_whatsapp: true, floating_call: true, whatsapp: WA_NUMBER, phone: PHONE }).eq("tenant_id", tenantId).eq("is_primary", true);
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
    site_name: SITE_NAME, tagline: "Your Trusted Partner in Construction & MEP Services",
    logo_url: LOGO, logo_dark_url: LOGO_LIGHT, logo_type: "image", logo_alt: SITE_NAME, logo_width: 200,
    favicon_url: FAVICON_URL,
    primary_color: TEAL, secondary_color: NAVY,
    color_overrides: {
      primary: TEAL, primaryFg: "#ffffff", secondary: NAVY, accent: SKY, ring: TEAL,
      background: PAPER, foreground: INK, card: "#ffffff", muted: MIST, mutedFg: "#4A5B66",
      border: LINE, borderRadius: "0.625rem",
    },
    design_overrides: { headingFont: "Outfit", bodyFont: "Inter", headingWeight: "800", roundness: "rounded", shadow: "soft" },
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
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Riyadh", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/  tenant ${tenantId}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
