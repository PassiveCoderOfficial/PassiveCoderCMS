/**
 * Jabedul Shamsul Technical Services (JSTC) — Deira Naif, Dubai. Licence 1484460.
 * PAID Pro client, imported from their WordPress/Elementor site
 * jabedulshamsultechnical.com (2026-10-05). Copy is the client's own wording;
 * photos and logo are the client's own files from that site
 * (clients/Jabedul Shamsul/site-assets). Page slugs match the old WordPress
 * URLs so links and search rankings carry over when the domain moves.
 * Not a demo: no demo_expires_at. Safe to re-run (--skip-assets skips uploads).
 * Source of truth copy: clients/Jabedul Shamsul/build/seed-jstc.cjs
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro until handover to the client
const SLUG = "jstc";
const PLAN = "pro";
const TEMPLATE_SLUG = "cleaning-simple"; // empty custom_css, so our palette wins
const ASSET_DIR = path.join(__dirname, "..", "clients", "Jabedul Shamsul", "site-assets");

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Jabedul Shamsul Technical Services";
const SHORT = "JSTC";
const CR = "1484460"; // Dubai trade licence number (stated on the client's About page)
const PHONE = "+971554862176";
const PHONE_DISPLAY = "+971 55 486 2176";
const WA_NUMBER = "971554862176"; // same as the call line (client request 2026-10-05)
const WA_DISPLAY = "+971 55 486 2176";
const EMAIL = "jabedullslam1891@gmail.com";
const ADDRESS = "NAEMA HAMAD ABDULLA BLDG, Office No. 116, Deira Naif, Dubai, UAE";
const HOURS = "Mon to Sat, 9:00 AM to 7:00 PM";
const MAP_EMBED = "https://www.google.com/maps?q=Naif%2C%20Deira%2C%20Dubai&z=15&output=embed";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hello JSTC, I would like a quote.");

const BLUE = "#2D8DC7";      // logo blue, primary
const NAVY = "#0D3550";      // deep band colour
const SKY = "#9BD15A";       // logo green, used as the light accent
const GREEN = "#7DBF1E";
const INK = "#13212C";
const PAPER = "#FFFFFF";
const MIST = "#EFF6FB";
const LINE = "#D5E5F0";

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
const LOGO = asset("jstc-logo.png");
const LOGO_LIGHT = asset("jstc-logo-light.png");
const FAVICON_URL = asset("favicon.png");

// All photos are the client's own, from their previous site.
const IMG = {
  hero: asset("jstc-hero.jpg"), cleaning: asset("jstc-cleaning.jpg"), plaster: asset("jstc-plaster.jpg"),
  hvac: asset("jstc-hvac.jpg"), ceiling: asset("jstc-ceiling.jpg"), engraving: asset("jstc-engraving.jpg"),
  tiling: asset("jstc-tiling.jpg"), electro: asset("jstc-electromechanical.jpg"), plumbing: asset("jstc-plumbing.jpg"),
  carpentry: asset("jstc-carpentry.jpg"),
};
// Names the shared AMK helpers expect.
IMG.team = IMG.hero; IMG.teamWalk = IMG.cleaning; IMG.teamRoom = IMG.hero; IMG.hotelPair = IMG.cleaning;

const STEPS = [
  ["Message us", "Tell us what you need on WhatsApp or by phone. Photos help."],
  ["Free quote or site visit", "We inspect where needed and send a clear, no-obligation quote."],
  ["Work done properly", "Our team completes the job on schedule and leaves the site clean."],
];

// ─── Services (client's own wording) ────────────────────────────────────────
const SERVICES = [
  {
    slug: "plaster-works", icon: "PaintRoller", title: "Plaster Works", img: IMG.plaster,
    short: "Smooth and durable plaster finishes for walls and ceilings, enhancing both appearance and structural integrity.",
    intro: "Jabedul Shamsul Technical Services offers professional plastering solutions designed to provide smooth, durable, and flawless wall and ceiling finishes. Our plaster works are essential for both new constructions and renovation projects, ensuring surfaces are perfectly prepared for painting, decorating, or other finishing treatments.",
    includes: [
      ["Traditional Cement Plastering", "High-quality cement-based plaster for strong and long-lasting wall protection, ideal for both interior and exterior surfaces."],
      ["Gypsum Plastering", "Smooth, fine finishes with gypsum plaster that dries quickly and provides an excellent base for painting and wallpaper."],
      ["Skim Coating", "Repairs uneven surfaces, covers minor cracks and creates a uniform texture."],
      ["Decorative Plaster Finishes", "Custom ornamental plasterwork and textured finishes that enhance the character of your interiors."],
    ],
    why: [
      ["Skilled Craftsmanship", "Our plasterers have years of experience, delivering precise and even application with attention to detail."],
      ["High-Quality Materials", "Premium-grade plasters and compounds that ensure durability, resistance to cracking, and smooth results."],
      ["Surface Preparation", "We clean, level and apply bonding agents as needed to ensure strong adhesion."],
      ["Customized Solutions", "We tailor plaster thickness, texture, and finish to your requirements."],
    ],
    tags: ["Residential villas", "Apartments", "Office spaces", "Retail stores", "Warehouses", "Industrial buildings"],
    close: ["Commitment to Quality", "We believe quality plasterwork is the foundation of beautiful interiors and protected exteriors. Get a free, no-obligation quote today."],
  },
  {
    slug: "air-conditioning-ventilation-air-filtration-systems-installation-maintenance", icon: "AirVent",
    title: "Air Conditioning, Ventilation & Air Filtration", nav: "AC, Ventilation & Air Filtration", img: IMG.hvac,
    short: "We install and maintain efficient air conditioning and ventilation systems to ensure comfort and clean air in every space.",
    intro: "We provide expert installation and maintenance of air conditioning, ventilation, and air filtration systems for residential, commercial, and industrial spaces. Our goal is to create comfortable, energy-efficient environments with clean and healthy indoor air.",
    includes: [
      ["AC System Installation", "Split units, ducted systems, and central air conditioning tailored to your property's size and cooling requirements."],
      ["Ventilation System Setup", "Proper airflow systems for fresh air circulation, moisture control, and indoor air quality."],
      ["Air Filtration Solutions", "High-performance filters and purification systems that remove dust, allergens, and airborne pollutants."],
      ["Routine Maintenance", "Scheduled maintenance to keep your HVAC systems running efficiently and extend their lifespan."],
      ["Troubleshooting & Repairs", "We diagnose and fix AC and ventilation problems quickly, with minimal disruption."],
    ],
    why: [
      ["Certified Technicians", "Our HVAC team is trained and experienced in all types of AC and ventilation systems."],
      ["Energy Efficiency Focused", "Modern, efficient systems and expert setup that help you save on energy bills."],
      ["Fast & Reliable Service", "We respond quickly, work efficiently, and deliver results that last."],
      ["Custom Solutions", "Systems designed to match your specific needs, layout, and budget."],
    ],
    tags: ["Apartments and villas", "Offices and commercial shops", "Restaurants and cafés", "Warehouses and storage", "Retail and showrooms"],
    close: ["Keep Your Air Fresh and Comfortable", "A properly installed and maintained HVAC system keeps your space cool, safe, and breathable. From new installations to emergency servicing, we handle everything."],
  },
  {
    slug: "false-ceiling-light-partitions-installation", icon: "LayoutPanelTop",
    title: "False Ceiling & Light Partitions", nav: "False Ceiling & Partitions", img: IMG.ceiling,
    short: "Modern false ceilings and lightweight partition solutions that add both style and functionality.",
    intro: "We specialize in the installation of false ceilings and light partitions that improve both the functionality and appearance of your space. Whether you are designing a modern office or upgrading your home interiors, our solutions are tailored to your vision and space requirements.",
    includes: [
      ["False Ceiling Installation", "Gypsum board, metal grid and decorative ceilings that conceal wiring, enhance lighting and improve acoustics and insulation."],
      ["Lightweight Partition Walls", "Divide rooms or create functional spaces without major construction, using gypsum board or lightweight blocks."],
      ["Custom Design Options", "Ceiling patterns and partition layouts to match your style, whether minimalist, modern, or traditional."],
      ["Lighting Integration", "Ceiling lights, spotlights and fixtures positioned to your lighting layout and neatly installed."],
    ],
    why: [
      ["Skilled Execution", "Clean lines, perfect alignment, and professional finishes on every project."],
      ["High-Quality Materials", "Strong, lightweight, fire-resistant materials that meet UAE safety standards."],
      ["Design Flexibility", "From a simple drop ceiling to complex panel patterns, we adapt to your ideas."],
      ["Minimal Disruption", "Efficient work with minimal mess and disruption to your daily activities."],
    ],
    tags: ["Apartments and villas", "Offices and corporate buildings", "Retail stores and showrooms", "Restaurants and cafés", "Commercial fit-outs"],
    close: ["Add Function and Style to Your Space", "False ceilings and partitions don't just divide spaces, they define them. Schedule an inspection or request a free quote."],
  },
  {
    slug: "engraving-ornamentation-works", icon: "Gem", title: "Engraving & Ornamentation Works", img: IMG.engraving,
    short: "Decorative engraving and ornamentation that brings artistic value and unique character to your spaces.",
    intro: "We offer high-quality engraving and ornamentation works that add artistic and decorative value to your interior and exterior spaces. Whether for homes, offices, shops, or feature walls, our custom designs bring out the beauty and character of your environment.",
    includes: [
      ["Wall Engraving", "Detailed, clean engravings on walls using precision tools, suitable for logos, patterns, or artistic designs."],
      ["Panel and Surface Decoration", "Custom ornamentation on panels, ceilings, and furniture to match your design theme or brand identity."],
      ["Traditional and Modern Styles", "Classic decorative motifs and contemporary patterns for a wide range of tastes and interiors."],
      ["Custom Designs", "Arabic calligraphy, floral designs, geometric patterns, or brand marks, tailored to your exact requirements."],
    ],
    why: [
      ["Experienced Craftsmanship", "Skilled in detailed handwork and machine-based engraving, with fine results every time."],
      ["Material Compatibility", "We engrave on gypsum, wood, acrylic, and certain metals or panels."],
      ["Attention to Detail", "Each design is handled with precision and care for sharp, clean, and lasting finishes."],
      ["Enhance Any Space", "Perfect for feature walls, reception areas, ceilings, doors, and decorative installations."],
    ],
    tags: ["Residential interiors", "Office and reception walls", "Hotels and restaurants", "Retail shops and displays", "Majlis and hall decorations"],
    close: ["Add a Unique Touch to Your Space", "Our engraving and ornamentation work is craftsmanship that tells a story. Talk to our team for a free consultation."],
  },
  {
    slug: "floor-wall-tiling-works", icon: "Grid3x3", title: "Floor & Wall Tiling Works", img: IMG.tiling,
    short: "High-quality tile installation for floors and walls using precise techniques and durable materials.",
    intro: "We provide professional floor and wall tiling services for residential, commercial, and industrial spaces. Our experienced team ensures every tile is placed with precision, delivering clean, level, and long-lasting results.",
    includes: [
      ["Floor Tiling", "Ceramic, porcelain, marble, granite, and more, enhancing both appearance and durability in every room."],
      ["Wall Tiling", "Kitchens, bathrooms, feature walls and commercial spaces, with tiles that are stylish, water-resistant, and easy to maintain."],
      ["Repair & Replacement", "Cracked, damaged, or outdated tiles replaced, restoring the beauty and safety of your surfaces."],
      ["Custom Patterns & Layouts", "Straight lay, diagonal, herringbone, and mosaic designs based on your preference."],
    ],
    why: [
      ["Skilled Tilers", "Trained to work with all tile types and surface conditions for professional results every time."],
      ["High-Quality Materials", "Premium adhesives, grout, and levelling tools for lasting adhesion and clean finishes."],
      ["Attention to Detail", "Proper alignment, clean cuts, and minimal waste for a polished, neat outcome."],
      ["Flexible Design Options", "A variety of colours, sizes, and tile styles to match your interior or exterior."],
    ],
    tags: ["Bathrooms and kitchens", "Living rooms and hallways", "Offices and commercial spaces", "Shops, cafés and restaurants", "Outdoor patios and balconies"],
    close: ["Built to Last, Designed to Impress", "Tiling is more than a surface, it is a foundation of your design. Get in touch for a free site visit and quotation."],
  },
  {
    slug: "electromechanical-equipment-installation-maintenance", icon: "Cog",
    title: "Electromechanical Equipment Installation & Maintenance", nav: "Electromechanical Equipment", img: IMG.electro,
    short: "From system installation to ongoing maintenance, we ensure your electromechanical equipment runs safely and efficiently.",
    intro: "We offer complete electromechanical installation and maintenance solutions for residential, commercial, and industrial properties. Your systems are installed correctly, function efficiently, and are regularly maintained to avoid costly breakdowns or safety issues.",
    includes: [
      ["System Installation", "Electrical wiring, control panels, HVAC units, motors, pumps, and ventilation systems, compliant with UAE safety and regulatory standards."],
      ["Preventive Maintenance", "Scheduled checks and servicing that extend equipment life and prevent system failure."],
      ["Emergency Repairs", "Fast response to faults and malfunctions, restoring full function with minimal downtime."],
      ["Testing & Commissioning", "Systems tested after installation to make sure they run efficiently and safely in real-world conditions."],
    ],
    why: [
      ["Qualified Technicians", "The technical knowledge to handle complex electromechanical systems with precision and care."],
      ["Compliance & Safety Focused", "We follow relevant codes, safety regulations, and testing procedures."],
      ["Reliable Support", "Responsive service and expert guidance from installation to ongoing maintenance."],
      ["Custom Solutions", "Each project assessed individually to meet your property's needs and technical specifications."],
    ],
    tags: ["Residential buildings", "Office and commercial spaces", "Retail outlets and warehouses", "Restaurants and cafés", "Industrial units and facilities"],
    close: ["Reliable Systems. Expert Maintenance.", "Whether you are installing new systems or maintaining existing ones, we make sure your equipment works safely and efficiently, every day."],
  },
  {
    slug: "deep-cleaning-services", icon: "Sparkles", title: "Deep Cleaning & Maid Services", nav: "Deep Cleaning & Maid Services", img: IMG.cleaning,
    short: "Professional cleaning for residential and commercial buildings, plus trusted live-in and live-out maids.",
    special: true,
  },
  {
    slug: "plumbing-sanitary-installation", icon: "Wrench", title: "Plumbing & Sanitary Installation", img: IMG.plumbing,
    short: "Complete sanitary installations, repairs, and system upgrades with reliable workmanship.",
    intro: "We offer expert plumbing and sanitary installation services for residential and commercial properties across Dubai. From new system installations to upgrades and repairs, every job is done professionally, safely, and in full compliance with local standards.",
    includes: [
      ["New Plumbing Installations", "Complete systems for kitchens, bathrooms, washrooms and utility areas, including pipelines, water tanks, pumps, and drainage."],
      ["Sanitary Ware Installation", "Sinks, basins, toilets, bathtubs, showers, water heaters and other fixtures fitted with precision and care."],
      ["Repairs & Replacements", "Leaking pipes, clogged drains, faulty faucets and damaged sanitary equipment fixed efficiently."],
      ["Drainage & Waste Systems", "Efficient drainage and wastewater systems for smooth flow and safe disposal, avoiding backflow and blockages."],
      ["Water Supply Management", "Proper water pressure and clean distribution through careful pipe layout, valve control, and water-saving fittings."],
    ],
    why: [
      ["Licensed & Skilled Plumbers", "Qualified, experienced, and trained to handle all types of plumbing systems."],
      ["Quality Materials", "Durable, approved pipes, fittings, and sanitary equipment for long-term reliability."],
      ["Quick Response & Timely Work", "We respond quickly and complete work without unnecessary delays."],
      ["Clean & Safe Work", "A clean work environment and safety procedures that protect your space and water supply."],
    ],
    tags: ["Villas and apartments", "Office buildings", "Restaurants and cafés", "Retail stores and shopping centres", "Warehouses and industrial units"],
    close: ["Built to Flow Right, Built to Last", "From clean water supply to proper drainage and modern sanitary fittings. Book a site inspection or a free quote."],
  },
  {
    slug: "carpentry-wood-flooring-works", icon: "Hammer", title: "Carpentry & Wood Flooring Works", img: IMG.carpentry,
    short: "Expert carpentry and wood flooring that enhance the warmth, design, and utility of your interior spaces.",
    intro: "We provide professional carpentry and wood flooring services tailored to suit both residential and commercial spaces. Our skilled craftsmen deliver precise, high-quality work that enhances the functionality and aesthetics of your interiors.",
    includes: [
      ["Custom Carpentry Work", "Wooden furniture, shelving units, wardrobes, doors, and counters built to match your space and style."],
      ["Wood Flooring Installation", "Laminate, engineered wood, parquet, and hardwood flooring supplied and installed with expert finishing."],
      ["Repairs & Refinishing", "Damaged wood restored, loose boards repaired, and floors refinished to their original beauty."],
      ["Wall Cladding & Paneling", "Decorative wooden cladding or paneling that adds warmth and texture to your interiors."],
      ["Skirting & Trims", "Skirting boards, trims, and mouldings for a clean, finished look."],
    ],
    why: [
      ["Experienced Craftsmen", "Skilled in traditional and modern techniques for high-quality craftsmanship."],
      ["Quality Wood & Materials", "Strong, durable wood and top-grade materials that last and look great."],
      ["Custom Designs", "Every item made to fit your space, with the finish and function you want."],
      ["Smooth & Clean Finishing", "Neat installations and clean joints for a polished, professional look."],
    ],
    tags: ["Villas and apartments", "Offices and meeting rooms", "Retail shops and counters", "Restaurants and lounges", "Reception areas and display walls"],
    close: ["Timeless Beauty in Wood", "From elegant wooden floors to functional carpentry, our work adds warmth, character, and lasting value. Contact us for a consultation or free quote."],
  },
];
for (const s of SERVICES) {
  s.nav = s.nav || s.title;
  s.steps = STEPS;
  s.gallery = [s.img];
}
const svcUrl = (s) => `/${s.slug}`;
for (const s of SERVICES) if (s.includes) s.includes = s.includes.map((x) => [null, ...x]);
const w = (url) => url;

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
const BASE = {
  visible: true, width: "full",
  padding: { top: 88, right: 24, bottom: 88, left: 24 },
  margin: ZERO,
  background: { type: "none" },
};
const bgColor = (color) => ({ type: "color", color });


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
  ".js-head{max-width:46rem;margin:0 auto 40px;text-align:center}",
  `.js-eyebrow{font-size:.75rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${BLUE};margin-bottom:10px}`,
  `.js-head h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.9rem,3.2vw,2.7rem);line-height:1.1;color:${INK}}`,
  ".js-lede{margin-top:12px;color:#4A5B69;font-size:1.05rem;line-height:1.6}",
  "a,button{transition:background-color .2s,color .2s,border-color .2s,box-shadow .2s,transform .2s}",
].join("");

function floatingWhatsApp() {
  return {
    id: uid("wa"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      html: `<a class="js-wa" href="${WA}" target="_blank" rel="noopener noreferrer" aria-label="Chat with JSTC on WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" fill="#fff"><path d="M16 0C7.164 0 0 7.164 0 16c0 2.82.737 5.469 2.027 7.773L0 32l8.473-2.004A15.934 15.934 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.257 13.257 0 01-6.749-1.839l-.484-.287-5.027 1.188 1.213-4.895-.316-.502A13.263 13.263 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.266-9.987c-.398-.199-2.353-1.161-2.718-1.294-.365-.133-.631-.199-.897.199-.266.398-1.031 1.294-1.264 1.56-.233.266-.465.299-.863.1-.398-.199-1.681-.62-3.203-1.977-1.184-1.055-1.983-2.357-2.216-2.755-.233-.398-.025-.613.175-.811.18-.178.398-.465.598-.698.199-.233.266-.398.398-.664.133-.266.067-.498-.033-.697-.1-.199-.897-2.161-1.229-2.958-.324-.778-.653-.672-.897-.684l-.764-.013c-.266 0-.697.1-1.062.498-.365.398-1.395 1.362-1.395 3.322s1.428 3.852 1.627 4.118c.199.266 2.81 4.291 6.81 6.022.952.411 1.695.657 2.274.841.955.304 1.824.261 2.511.158.766-.114 2.353-.962 2.685-1.891.332-.929.332-1.726.232-1.891-.099-.166-.365-.266-.763-.465z"/></svg></a>`,
      css: `.js-wa{position:fixed;right:20px;bottom:20px;z-index:9990;width:56px;height:56px;border-radius:9999px;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease}.js-wa:hover{transform:scale(1.06)}@media(max-width:640px){.js-wa{right:14px;bottom:14px;width:52px;height:52px}}${POLISH}`,
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
      html: `<div class="js-aud-wrap">
  <div class="js-head"><p class="js-eyebrow">Who we clean for</p><h2>One cleaning partner for every kind of space.</h2><p class="js-lede">Whether it is a two-bedroom flat or a hundred-room hotel, you get the same trained team and the same standard.</p></div>
  <div class="js-aud">${cards.map(([t, d, img, url]) => `
    <a href="${url}" class="js-a"><div class="js-a-img"><img src="${w(img, 900)}" alt="${t}" loading="lazy"/></div><div class="js-a-body"><strong>${t}</strong><p>${d}</p><span>Learn more →</span></div></a>`).join("")}
  </div>
</div>`,
      css: `.js-aud-wrap{max-width:76rem;margin:0 auto}
.js-aud{display:grid;gap:22px;grid-template-columns:repeat(3,1fr)}
.js-a{background:#fff;border:1px solid ${LINE};border-radius:18px;overflow:hidden;text-decoration:none;color:${INK};display:flex;flex-direction:column}
.js-a:hover{box-shadow:0 18px 40px -18px rgba(15,61,92,.35);transform:translateY(-3px)}
.js-a-img{aspect-ratio:4/3;overflow:hidden}
.js-a-img img{width:100%;height:100%;object-fit:cover}
.js-a-body{padding:22px 22px 24px;border-top:4px solid ${BLUE}}
.js-a strong{font-family:"Montserrat",sans-serif;font-size:1.3rem;font-weight:800}
.js-a p{margin:8px 0 14px;color:#4A5B69;line-height:1.55}
.js-a span{color:${BLUE};font-weight:700;font-size:.92rem}
@media(max-width:860px){.js-aud{grid-template-columns:1fr}}`,
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
        ["MapPin", "Office", "Office 116, Deira Naif, Dubai", MAP_EMBED.replace("&output=embed", "")],
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
const BTN_CSS = `.js-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:700;font-size:.98rem;text-decoration:none;line-height:1}
.js-btn-p{background:${BLUE};color:#fff;box-shadow:0 14px 30px -12px rgba(24,128,196,.7)}.js-btn-p:hover{background:#1170AF;transform:translateY(-2px)}
.js-btn-g{background:#fff;color:${NAVY};border:1.5px solid ${LINE}}.js-btn-g:hover{border-color:${BLUE};color:${BLUE}}
.js-btn-w{background:#fff;color:${NAVY}}.js-btn-w:hover{transform:translateY(-2px)}
.js-btn-o{border:1.5px solid rgba(255,255,255,.5);color:#fff}.js-btn-o:hover{background:rgba(255,255,255,.1)}
.js-wrap{max-width:78rem;margin:0 auto;padding:0 24px}`;

function topBar() {
  return {
    id: uid("top"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(NAVY),
    data: {
      html: `<div class="js-top"><div class="js-top-in">
  <div class="js-top-l"><span>${ICO.pin} Doha, Qatar</span><span class="js-hide">${ICO.clock} 7 days a week, 7am to 10pm</span><span class="js-hide">CR No. ${CR}</span></div>
  <div class="js-top-r"><a href="mailto:${EMAIL}" class="js-hide">${ICO.mail} ${EMAIL}</a><a href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a><a href="${WA}" class="js-top-wa">${ICO.wa} WhatsApp</a></div>
</div></div>`,
      css: `.js-top{background:${NAVY};color:#CFE2F0;font-size:.82rem}
.js-top-in{max-width:80rem;margin:0 auto;padding:9px 24px;display:flex;justify-content:space-between;gap:16px;align-items:center}
.js-top-l,.js-top-r{display:flex;gap:22px;align-items:center}
.js-top span,.js-top a{display:inline-flex;align-items:center;gap:7px;color:inherit;text-decoration:none;white-space:nowrap}
.js-top a:hover{color:#fff}
.js-top-wa{background:#25D366;color:#fff!important;padding:5px 12px;border-radius:999px;font-weight:700}
@media(max-width:900px){.js-hide{display:none!important}.js-top-in{padding:8px 16px}}`,
    },
  };
}

function heroPremium() {
  return html("hero", `<section class="js-hero"><div class="js-wrap js-hero-g">
  <div class="js-hero-copy">
    <span class="js-pill"><i></i> Trusted cleaning company in Doha</span>
    <h1>Professional cleaning for homes, offices <em>and hotels</em> across Qatar.</h1>
    <p>Trained, uniformed teams with professional equipment, a checklist on every job and a fixed price before we start. Book in one WhatsApp message.</p>
    <div class="js-hero-cta"><a class="js-btn js-btn-p" href="${WA}">${ICO.wa} Get a free quote</a><a class="js-btn js-btn-g" href="/services">Explore services ${ARROW}</a></div>
    <ul class="js-hero-ticks">${["Fixed, upfront prices", "Materials included", "Same-week booking"].map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul>
  </div>
  <div class="js-hero-art">
    <div class="js-hero-main"><img src="${w(IMG.teamRoom, 1100)}" alt="JSTC team at work"/></div>
    <div class="js-hero-sub"><img src="${w(IMG.hotelPair, 600)}" alt="Hotel room made up by housekeeping"/></div>
    <div class="js-float js-float-a"><b>${ICO.shield}</b><div><strong>Fully trained staff</strong><span>Uniformed and supervised</span></div></div>
    <div class="js-float js-float-b"><strong>6</strong><span>specialist<br/>services</span></div>
  </div>
</div></section>`, `${BTN_CSS}
.js-hero{background:radial-gradient(1200px 500px at 85% 0%,#DCEEFB 0%,transparent 60%),linear-gradient(180deg,#F5FAFE,#fff);padding:72px 0 96px;overflow:hidden}
.js-hero-g{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
.js-pill{display:inline-flex;align-items:center;gap:10px;background:#fff;border:1px solid ${LINE};color:${NAVY};font-weight:600;font-size:.85rem;padding:8px 16px;border-radius:999px;box-shadow:0 6px 20px -10px rgba(15,61,92,.25)}
.js-pill i{width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 4px rgba(34,197,94,.18)}
.js-hero h1{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(2.3rem,4.6vw,3.9rem);line-height:1.06;letter-spacing:-.02em;color:${INK};margin:22px 0 20px}
.js-hero h1 em{font-style:normal;background:linear-gradient(90deg,${BLUE},#35A9E6);-webkit-background-clip:text;background-clip:text;color:transparent}
.js-hero p{font-size:1.12rem;line-height:1.7;color:#4A5B69;max-width:34rem}
.js-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin:30px 0 26px}
.js-hero-ticks{display:flex;flex-wrap:wrap;gap:10px 22px;list-style:none;padding:0;margin:0}
.js-hero-ticks li{display:flex;align-items:center;gap:8px;font-weight:600;color:${NAVY};font-size:.95rem}
.js-hero-ticks svg{color:#fff;background:${BLUE};border-radius:50%;padding:3px;width:20px;height:20px}
.js-hero-art{position:relative;min-height:540px}
.js-hero-main{position:absolute;right:0;top:0;width:82%;height:88%;border-radius:32px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(15,61,92,.45)}
.js-hero-sub{position:absolute;left:0;bottom:0;width:44%;aspect-ratio:1;border-radius:24px;overflow:hidden;border:8px solid #fff;box-shadow:0 30px 60px -25px rgba(15,61,92,.45)}
.js-hero-art img{width:100%;height:100%;object-fit:cover;display:block}
.js-float{position:absolute;background:#fff;border-radius:18px;box-shadow:0 24px 50px -20px rgba(15,61,92,.4);display:flex;align-items:center;gap:12px;padding:14px 18px}
.js-float-a{right:-8px;bottom:22%}.js-float-a b{width:44px;height:44px;border-radius:12px;background:#E6F3FC;color:${BLUE};display:grid;place-items:center}
.js-float strong{display:block;color:${INK};font-weight:800;font-size:.98rem}.js-float span{color:#64748B;font-size:.82rem}
.js-float-b{left:8%;top:10%;flex-direction:row;background:${NAVY}}.js-float-b strong{color:${SKY};font-family:"Montserrat",sans-serif;font-size:2.2rem;line-height:1}.js-float-b span{color:#CFE2F0;line-height:1.25}
@media(max-width:960px){.js-hero-g{grid-template-columns:1fr;gap:40px}.js-hero-art{min-height:420px}.js-hero{padding:48px 0 64px}}
@media(max-width:520px){.js-hero-art{min-height:340px}.js-float-a{right:0;bottom:14%;padding:10px 14px}.js-float-b{left:0;top:4%}}`);
}

function servicesPremium(bg = PAPER, title = "Cleaning services built around your space") {
  return html("svcp", `<section class="js-sv"><div class="js-wrap">
  <div class="js-sv-head"><div><p class="js-eyebrow">What we do</p><h2>${title}</h2></div><p class="js-lede">Nine services under one licence, from building cleaning to fit-out, HVAC and maintenance. Pick one to see what is included.</p></div>
  <div class="js-sv-g">${SERVICES.map((s, i) => `
    <a class="js-sc" href="${svcUrl(s)}"><div class="js-sc-img"><img src="${w(s.img, 800)}" alt="${s.title}" loading="lazy"/><span>${SVC_NUM(i)}</span></div>
    <div class="js-sc-b"><h3>${s.title}</h3><p>${s.short}</p><em>View service ${ARROW}</em></div></a>`).join("")}
  </div>
</div></section>`, `.js-sv{padding:96px 0}
.js-sv-head{display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:end;margin-bottom:48px}
.js-sv-head h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.9rem,3.2vw,2.8rem);line-height:1.1;color:${INK};letter-spacing:-.01em}
.js-eyebrow{font-size:.75rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:${BLUE};margin-bottom:12px}
.js-lede{color:#4A5B69;font-size:1.05rem;line-height:1.65}
.js-sv-g{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}
.js-sc{display:flex;flex-direction:column;background:#fff;border:1px solid ${LINE};border-radius:22px;overflow:hidden;text-decoration:none;color:${INK}}
.js-sc:hover{transform:translateY(-6px);box-shadow:0 30px 60px -28px rgba(15,61,92,.45);border-color:transparent}
.js-sc-img{position:relative;aspect-ratio:16/11;overflow:hidden}
.js-sc-img img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.js-sc:hover .js-sc-img img{transform:scale(1.06)}
.js-sc-img span{position:absolute;left:18px;top:18px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);color:${NAVY};font-weight:800;font-family:"Montserrat",sans-serif;font-size:.85rem;padding:6px 12px;border-radius:999px}
.js-sc-b{padding:24px 24px 26px;display:flex;flex-direction:column;gap:10px;flex:1}
.js-sc h3{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.3rem}
.js-sc p{color:#4A5B69;line-height:1.6;flex:1}
.js-sc em{font-style:normal;color:${BLUE};font-weight:700;display:inline-flex;align-items:center;gap:8px}
@media(max-width:960px){.js-sv-g{grid-template-columns:1fr 1fr}.js-sv-head{grid-template-columns:1fr;gap:12px}}
@media(max-width:600px){.js-sv-g{grid-template-columns:1fr}.js-sv{padding:64px 0}}`, bg);
}

function statsBand() {
  const items = [["6", "Specialist services"], ["7", "Days a week"], ["100%", "Trained, uniformed staff"], ["1", "Message to book"]];
  return html("stats", `<section class="js-st"><div class="js-wrap js-st-g">${items.map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join("")}</div></section>`,
    `.js-st{background:linear-gradient(120deg,${NAVY},#145A86);padding:56px 0;position:relative;overflow:hidden}
.js-st::after{content:"";position:absolute;right:-120px;top:-120px;width:380px;height:380px;border-radius:50%;background:rgba(143,211,244,.08)}
.js-st-g{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative;z-index:1}
.js-st-g div{border-left:1px solid rgba(255,255,255,.15);padding-left:24px}
.js-st strong{display:block;font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(2.2rem,4vw,3.2rem);color:#fff;line-height:1}
.js-st span{display:block;margin-top:10px;color:${SKY};font-weight:600;font-size:.95rem}
@media(max-width:760px){.js-st-g{grid-template-columns:1fr 1fr;row-gap:32px}}`, NAVY);
}

function processPremium(steps, title = "From first message to spotless", bg = MIST) {
  return html("proc", `<section class="js-pr"><div class="js-wrap">
  <div class="js-head"><p class="js-eyebrow">How it works</p><h2>${title}</h2></div>
  <ol class="js-pr-g" style="--n:${steps.length}">${steps.map(([t, d], i) => `<li><span>${SVC_NUM(i)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
</div></section>`, `.js-pr{padding:96px 0}
.js-pr-g{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(var(--n),1fr);gap:22px;counter-reset:s;position:relative}
.js-pr-g li{background:#fff;border-radius:22px;padding:30px 26px;border:1px solid ${LINE};position:relative}
.js-pr-g span{display:inline-grid;place-items:center;width:54px;height:54px;border-radius:16px;background:linear-gradient(135deg,${BLUE},#35A9E6);color:#fff;font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.1rem;box-shadow:0 14px 28px -12px rgba(24,128,196,.7)}
.js-pr-g h3{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.2rem;color:${INK};margin:20px 0 8px}
.js-pr-g p{color:#4A5B69;line-height:1.6}
@media(max-width:860px){.js-pr-g{grid-template-columns:1fr 1fr}}@media(max-width:560px){.js-pr-g{grid-template-columns:1fr}.js-pr{padding:64px 0}}`, bg);
}

function ctaPhoto(title = "Ready for a spotless home or workplace?", text = "Send us a message on WhatsApp with what you need. We reply with a fixed price, usually within minutes.") {
  return html("ctap", `<section class="js-cp"><div class="js-wrap"><div class="js-cp-box">
  <img src="${w(IMG.teamWalk, 1600)}" alt="" aria-hidden="true"/>
  <div class="js-cp-c"><h2>${title}</h2><p>${text}</p><div class="js-hero-cta"><a class="js-btn js-btn-w" href="${WA}">${ICO.wa} WhatsApp ${WA_DISPLAY}</a><a class="js-btn js-btn-o" href="tel:${PHONE}">${ICO.phone} Call ${PHONE_DISPLAY}</a></div></div>
</div></div></section>`, `${BTN_CSS}
.js-cp{padding:88px 0}
.js-cp-box{position:relative;border-radius:32px;overflow:hidden;padding:72px 64px;min-height:340px;display:flex;align-items:center}
.js-cp-box img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.js-cp-box::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(15,61,92,.96) 0%,rgba(15,61,92,.85) 45%,rgba(24,128,196,.35) 100%)}
.js-cp-c{position:relative;z-index:2;max-width:36rem}
.js-cp h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.9rem,3.4vw,2.8rem);line-height:1.1;color:#fff}
.js-cp p{color:#D5E6F2;font-size:1.08rem;line-height:1.6;margin-top:14px}
.js-cp .js-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
@media(max-width:700px){.js-cp-box{padding:44px 26px}.js-cp{padding:56px 0}}`);
}

function innerHero({ crumbs, title, description, img }) {
  return html("ihero", `<section class="js-ih"><img src="${w(img, 1800)}" alt="" aria-hidden="true"/><div class="js-wrap js-ih-c">
  <nav class="js-crumb"><a href="/">Home</a>${crumbs.map(([l, u]) => u ? ` <i>/</i> <a href="${u}">${l}</a>` : ` <i>/</i> <span>${l}</span>`).join("")}</nav>
  <h1>${title}</h1><p>${description}</p>
  <div class="js-hero-cta"><a class="js-btn js-btn-p" href="${WA}">${ICO.wa} Get a free quote</a><a class="js-btn js-btn-o" href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a></div>
</div></section>`, `${BTN_CSS}
.js-ih{position:relative;padding:110px 0 100px;overflow:hidden}
.js-ih>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.js-ih::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(15,61,92,.95) 0%,rgba(15,61,92,.8) 50%,rgba(15,61,92,.35) 100%)}
.js-ih-c{position:relative;z-index:2}
.js-crumb{font-size:.88rem;color:#A9CBE3;margin-bottom:18px}.js-crumb a{color:#A9CBE3;text-decoration:none}.js-crumb a:hover{color:#fff}.js-crumb span{color:#fff;font-weight:600}.js-crumb i{font-style:normal;margin:0 6px;opacity:.6}
.js-ih h1{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(2.3rem,4.8vw,3.8rem);line-height:1.06;color:#fff;max-width:44rem;letter-spacing:-.02em}
.js-ih p{color:#D5E6F2;font-size:1.12rem;line-height:1.6;max-width:38rem;margin-top:16px}
.js-ih .js-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
@media(max-width:700px){.js-ih{padding:72px 0 64px}}`, NAVY);
}

function svcOverview(s) {
  return html("ovw", `<section class="js-ov"><div class="js-wrap js-ov-g">
  <div><p class="js-eyebrow">${s.title}</p><h2>${s.intro.split(". ")[0]}.</h2><p class="js-lede">${s.intro.split(". ").slice(1).join(". ")}</p>
    <ul class="js-ov-tags">${s.tags.map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul></div>
  <aside class="js-ov-card"><img src="${w(s.gallery[1] || s.img, 900)}" alt="${s.title}"/><div><strong>Get a fixed quote</strong><p>Send a few photos and your location on WhatsApp for a free quote or site visit.</p><a class="js-btn js-btn-p" href="${waText(`Hello JSTC, I would like a quote for ${s.title}.`)}">${ICO.wa} Quote on WhatsApp</a></div></aside>
</div></section>`, `${BTN_CSS}.js-ov{padding:96px 0}
.js-ov-g{display:grid;grid-template-columns:1.25fr 1fr;gap:56px;align-items:start}
.js-ov h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.7rem,2.8vw,2.4rem);line-height:1.15;color:${INK};margin-bottom:16px}
.js-ov-tags{list-style:none;padding:0;margin:28px 0 0;display:flex;flex-wrap:wrap;gap:10px}
.js-ov-tags li{display:flex;align-items:center;gap:8px;background:${MIST};color:${NAVY};font-weight:600;font-size:.92rem;padding:9px 14px;border-radius:999px}.js-ov-tags svg{color:${BLUE}}
.js-ov-card{background:#fff;border:1px solid ${LINE};border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -35px rgba(15,61,92,.45);position:sticky;top:110px}
.js-ov-card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.js-ov-card div{padding:24px}
.js-ov-card strong{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.25rem;color:${INK}}.js-ov-card p{color:#4A5B69;margin:8px 0 18px;line-height:1.55}
@media(max-width:900px){.js-ov-g{grid-template-columns:1fr}.js-ov-card{position:static}.js-ov{padding:64px 0}}`);
}

function svcIncludesPremium(s, bg = MIST) {
  return html("inc", `<section class="js-in"><div class="js-wrap">
  <div class="js-head"><p class="js-eyebrow">What's included</p><h2>Every ${s.title.toLowerCase()} visit covers</h2></div>
  <div class="js-in-g">${s.includes.map(([, t, d], i) => `<div><span>${SVC_NUM(i)}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `.js-in{padding:96px 0}
.js-in-g{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.js-in-g div{background:#fff;border-radius:20px;padding:28px;border:1px solid ${LINE};transition:box-shadow .2s,transform .2s}
.js-in-g div:hover{transform:translateY(-4px);box-shadow:0 24px 48px -28px rgba(15,61,92,.45)}
.js-in-g span{font-family:"Montserrat",sans-serif;font-weight:800;color:${BLUE};font-size:.95rem;letter-spacing:.05em}
.js-in-g h3{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.15rem;color:${INK};margin:10px 0 8px}
.js-in-g p{color:#4A5B69;line-height:1.6}
@media(max-width:900px){.js-in-g{grid-template-columns:1fr 1fr}}@media(max-width:560px){.js-in-g{grid-template-columns:1fr}.js-in{padding:64px 0}}`, bg);
}

function galleryStrip(s) {
  const g = s.gallery.slice(0, 3);
  return html("gal", `<section class="js-gs"><div class="js-wrap js-gs-g">${g.map((u, i) => `<div class="js-gs-${i}"><img src="${w(u, 1000)}" alt="${s.title}" loading="lazy"/></div>`).join("")}</div></section>`,
    `.js-gs{padding:0 0 96px}
.js-gs-g{display:grid;grid-template-columns:1.5fr 1fr;grid-template-rows:220px 220px;gap:16px}
.js-gs-g div{border-radius:22px;overflow:hidden}.js-gs-g img{width:100%;height:100%;object-fit:cover;display:block}
.js-gs-0{grid-row:span 2}
@media(max-width:700px){.js-gs-g{grid-template-columns:1fr;grid-template-rows:none;grid-auto-rows:220px}.js-gs-0{grid-row:auto}.js-gs{padding-bottom:64px}}`, MIST);
}

function whyPremium(bg = MIST, o = {}) {
  const pts = o.pts || [
    ["Trained & uniformed staff", "Our own team, trained on every service we offer and supervised on site."],
    ["Professional equipment", "Industrial vacuums, scrubbers and the right products for each surface."],
    ["Fixed, upfront pricing", "You get the price before we start. No surprises on the day."],
    ["Flexible scheduling", "Early mornings, evenings and weekends, so your day is never disrupted."],
  ];
  return html("why", `<section class="js-why"><div class="js-wrap js-why-g">
  <div class="js-why-img"><img src="${w(o.img || IMG.teamWalk, 1100)}" alt="JSTC crew"/><div class="js-why-badge"><strong>Licence ${CR}</strong><span>Licensed in Dubai, UAE</span></div></div>
  <div><p class="js-eyebrow">${o.eyebrow || "Why AMK"}</p><h2>${o.title || "Why clients in Qatar choose AMK"}</h2><p class="js-lede">${o.lede || "A registered Doha company with its own crews. Every job follows a written checklist and is checked before we leave."}</p>
    <ul>${pts.map(([t, d]) => `<li><b>${CHECK}</b><div><strong>${t}</strong><p>${d}</p></div></li>`).join("")}</ul></div>
</div></section>`, `.js-why{padding:96px 0}
.js-why-g{display:grid;grid-template-columns:1fr 1.05fr;gap:64px;align-items:center}
.js-why-img{position:relative;border-radius:28px;overflow:visible}
.js-why-img img{width:100%;aspect-ratio:4/4.4;object-fit:cover;border-radius:28px;display:block;box-shadow:0 40px 80px -40px rgba(15,61,92,.5)}
.js-why-badge{position:absolute;right:-18px;bottom:36px;background:${BLUE};color:#fff;border-radius:18px;padding:16px 20px;box-shadow:0 20px 40px -18px rgba(24,128,196,.8)}
.js-why-badge strong{display:block;font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.2rem}.js-why-badge span{font-size:.85rem;color:#D8EEFB}
.js-why h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.9rem,3.2vw,2.7rem);line-height:1.1;color:${INK};margin-bottom:14px}
.js-why ul{list-style:none;padding:0;margin:30px 0 0;display:grid;gap:18px}
.js-why li{display:flex;gap:16px;align-items:flex-start;background:#fff;border:1px solid ${LINE};border-radius:18px;padding:18px 20px}
.js-why li b{flex:none;width:36px;height:36px;border-radius:10px;background:#E6F3FC;color:${BLUE};display:grid;place-items:center}
.js-why li strong{font-family:"Montserrat",sans-serif;font-weight:800;color:${INK};font-size:1.05rem}.js-why li p{color:#4A5B69;margin-top:4px;line-height:1.55}
@media(max-width:900px){.js-why-g{grid-template-columns:1fr;gap:40px}.js-why-badge{right:12px}.js-why{padding:64px 0}}`, bg);
}

function otherPremium(cur, bg = PAPER) {
  const list = SERVICES.filter((x) => x.slug !== cur.slug);
  return html("oth", `<section class="js-ot"><div class="js-wrap">
  <div class="js-ot-h"><h2>Other services</h2><a href="/services">All services ${ARROW}</a></div>
  <div class="js-ot-g">${list.map((x) => `<a href="${svcUrl(x)}"><img src="${w(x.img, 600)}" alt="${x.title}" loading="lazy"/><span>${x.title}</span></a>`).join("")}</div>
</div></section>`, `.js-ot{padding:88px 0 0}
.js-ot-h{display:flex;justify-content:space-between;align-items:end;margin-bottom:24px}
.js-ot-h h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.6rem,2.6vw,2.1rem);color:${INK}}
.js-ot-h a{color:${BLUE};font-weight:700;text-decoration:none;display:inline-flex;gap:8px;align-items:center}
.js-ot-g{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.js-ot-g a{position:relative;aspect-ratio:3/4;border-radius:20px;overflow:hidden;display:block}
.js-ot-g img{width:100%;height:100%;object-fit:cover;transition:transform .7s}
.js-ot-g a:hover img{transform:scale(1.06)}
.js-ot-g a::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(15,61,92,.9),transparent 55%)}
.js-ot-g span{position:absolute;left:16px;right:16px;bottom:16px;z-index:1;color:#fff;font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.02rem;line-height:1.2}
@media(max-width:900px){.js-ot-g{grid-template-columns:repeat(3,1fr)}}@media(max-width:560px){.js-ot-g{grid-template-columns:1fr 1fr}.js-ot{padding-top:56px}}`, bg);
}

// ─── JSTC overrides (later declarations replace the shared AMK helpers) ─────
function navItems() {
  return TOP_PAGES.map(([, label, url], i) => ({
    id: `n${i}`, label, url,
    children: url === "/our-services" ? SERVICES.map((s, k) => ({ id: `n${i}-${k}`, label: s.nav, url: svcUrl(s), children: [] })) : [],
  }));
}

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(PAPER),
    data: {
      logoText: SITE_NAME, logo: LOGO, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: BLUE, ctaVariant: "solid", logoHeight: 58, logoCaption: "",
      showCta: true, ctaLabel: "WhatsApp Us", ctaUrl: WA,
    },
  };
}

function topBar() {
  return {
    id: uid("top"), type: "custom_html", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(NAVY),
    data: {
      html: `<div class="js-top"><div class="js-top-in">
  <div class="js-top-l"><span>${ICO.pin} Deira Naif, Dubai</span><span class="js-hide">${ICO.clock} ${HOURS}</span><span class="js-hide">Licence No. ${CR}</span></div>
  <div class="js-top-r"><a href="mailto:${EMAIL}" class="js-hide">${ICO.mail} ${EMAIL}</a><a href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a><a href="${WA}" class="js-top-wa">${ICO.wa} WhatsApp</a></div>
</div></div>`,
      css: `.js-top{background:${NAVY};color:#CFE2F0;font-size:.82rem}
.js-top-in{max-width:80rem;margin:0 auto;padding:9px 24px;display:flex;justify-content:space-between;gap:16px;align-items:center}
.js-top-l,.js-top-r{display:flex;gap:22px;align-items:center}
.js-top span,.js-top a{display:inline-flex;align-items:center;gap:7px;color:inherit;text-decoration:none;white-space:nowrap}
.js-top a:hover{color:#fff}
.js-top-wa{background:#25D366;color:#fff!important;padding:5px 12px;border-radius:999px;font-weight:700}
@media(max-width:900px){.js-hide{display:none!important}.js-top-in{padding:8px 16px}}@media(max-width:520px){.js-top-l{display:none}.js-top-in{justify-content:flex-end}}`,
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 1, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO, logoText: SITE_NAME, logoCaption: `Licence No. ${CR} · Deira Naif, Dubai`,
      tagline: "Expert technical solutions across Dubai, including plastering, HVAC, tiling, plumbing, and more. Trusted quality, reliable service.",
      style: "light", backgroundColor: MIST, accentColor: BLUE, textColor: "#3C4D5B",
      copyrightText: `© {year} ${SITE_NAME}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.map((s) => ({ id: uid("fl"), label: s.nav, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Company", links: TOP_PAGES.map(([, label, url]) => ({ id: uid("fl"), label, url })) },
        { id: uid("fc"), heading: "Get In Touch", links: [
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: `WhatsApp ${WA_DISPLAY}`, url: WA },
          { id: uid("fl"), label: EMAIL, url: `mailto:${EMAIL}` },
          { id: uid("fl"), label: "Office 116, Naema Hamad Abdulla Bldg, Deira Naif, Dubai", url: "/contact" },
          { id: uid("fl"), label: `${HOURS} · Sunday closed`, url: "/contact" },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

function heroPremium() {
  return html("hero", `<section class="js-hero"><div class="js-wrap js-hero-g">
  <div class="js-hero-copy">
    <span class="js-pill"><i></i> Licensed in Dubai · Licence No. ${CR}</span>
    <h1>Trusted maid &amp; cleaning services, <em>plus every technical job</em> your property needs.</h1>
    <p>From spotless interiors to polished exteriors, we clean homes, offices and commercial buildings across Dubai. And when you need AC, plumbing, tiling, ceilings or carpentry, the same team handles that too.</p>
    <div class="js-hero-cta"><a class="js-btn js-btn-p" href="${WA}">${ICO.wa} Get a free quote</a><a class="js-btn js-btn-g" href="/our-services">Our services ${ARROW}</a></div>
    <ul class="js-hero-ticks">${["Free trial for maid services", "Free replacements", "No hidden charges"].map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul>
  </div>
  <div class="js-hero-art">
    <div class="js-hero-main"><img src="${IMG.hero}" alt="JSTC cleaning team at work in an office"/></div>
    <div class="js-hero-sub"><img src="${IMG.hvac}" alt="AC unit maintenance"/></div>
    <div class="js-float js-float-a"><b>${ICO.shield}</b><div><strong>Verified, trained staff</strong><span>Cleaning and technical teams</span></div></div>
    <div class="js-float js-float-b"><strong>9</strong><span>services under<br/>one licence</span></div>
  </div>
</div></section>`, `${BTN_CSS}
.js-hero{background:radial-gradient(1200px 500px at 85% 0%,#DDF0D0 0%,transparent 55%),linear-gradient(180deg,#F3F9FD,#fff);padding:72px 0 96px;overflow:hidden}
.js-hero-g{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
.js-pill{display:inline-flex;align-items:center;gap:10px;background:#fff;border:1px solid ${LINE};color:${NAVY};font-weight:600;font-size:.85rem;padding:8px 16px;border-radius:999px;box-shadow:0 6px 20px -10px rgba(13,53,80,.25)}
.js-pill i{width:8px;height:8px;border-radius:50%;background:${GREEN};box-shadow:0 0 0 4px rgba(125,191,30,.2)}
.js-hero h1{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(2.2rem,4.3vw,3.6rem);line-height:1.08;letter-spacing:-.02em;color:${INK};margin:22px 0 20px}
.js-hero h1 em{font-style:normal;background:linear-gradient(90deg,${BLUE},${GREEN});-webkit-background-clip:text;background-clip:text;color:transparent}
.js-hero p{font-size:1.1rem;line-height:1.7;color:#4A5B69;max-width:35rem}
.js-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin:30px 0 26px}
.js-hero-ticks{display:flex;flex-wrap:wrap;gap:10px 22px;list-style:none;padding:0;margin:0}
.js-hero-ticks li{display:flex;align-items:center;gap:8px;font-weight:600;color:${NAVY};font-size:.95rem}
.js-hero-ticks svg{color:#fff;background:${GREEN};border-radius:50%;padding:3px;width:20px;height:20px}
.js-hero-art{position:relative;min-height:520px}
.js-hero-main{position:absolute;right:0;top:0;width:84%;height:80%;border-radius:32px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(13,53,80,.45)}
.js-hero-sub{position:absolute;left:0;bottom:0;width:46%;aspect-ratio:4/3;border-radius:24px;overflow:hidden;border:8px solid #fff;box-shadow:0 30px 60px -25px rgba(13,53,80,.45)}
.js-hero-art img{width:100%;height:100%;object-fit:cover;display:block}
.js-float{position:absolute;background:#fff;border-radius:18px;box-shadow:0 24px 50px -20px rgba(13,53,80,.4);display:flex;align-items:center;gap:12px;padding:14px 18px}
.js-float-a{right:-8px;bottom:12%}.js-float-a b{width:44px;height:44px;border-radius:12px;background:#E6F3FC;color:${BLUE};display:grid;place-items:center}
.js-float strong{display:block;color:${INK};font-weight:800;font-size:.98rem}.js-float span{color:#64748B;font-size:.82rem}
.js-float-b{left:4%;top:8%;background:${NAVY}}.js-float-b strong{color:${SKY};font-family:"Montserrat",sans-serif;font-size:2.2rem;line-height:1}.js-float-b span{color:#CFE2F0;line-height:1.25}
@media(max-width:960px){.js-hero-g{grid-template-columns:1fr;gap:40px}.js-hero-art{min-height:420px}.js-hero{padding:48px 0 64px}}
@media(max-width:520px){.js-hero-art{min-height:330px}.js-float-a{right:0;bottom:6%;padding:10px 14px}.js-float-b{left:0;top:2%}}`);
}

// Client-stated figures from their cleaning page.
function statsBand(items = [["500+", "Happy clients"], ["5+", "Years in Dubai"], ["50+", "Trained staff"], ["100%", "Satisfaction rate"]]) {
  return html("stats", `<section class="js-st"><div class="js-wrap js-st-g">${items.map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join("")}</div></section>`,
    `.js-st{background:linear-gradient(120deg,${NAVY},#17587F);padding:56px 0;position:relative;overflow:hidden}
.js-st::after{content:"";position:absolute;right:-120px;top:-120px;width:380px;height:380px;border-radius:50%;background:rgba(155,209,90,.08)}
.js-st-g{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative;z-index:1}
.js-st-g div{border-left:1px solid rgba(255,255,255,.15);padding-left:24px}
.js-st strong{display:block;font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(2.2rem,4vw,3.2rem);color:#fff;line-height:1}
.js-st span{display:block;margin-top:10px;color:${SKY};font-weight:600;font-size:.95rem}
@media(max-width:760px){.js-st-g{grid-template-columns:1fr 1fr;row-gap:32px}}`, NAVY);
}

function svcOverview(s) {
  return html("ovw", `<section class="js-ov"><div class="js-wrap js-ov-g">
  <div><p class="js-eyebrow">${s.title}</p><h2>${s.short}</h2><p class="js-lede">${s.intro}</p>
    <p class="js-ov-k">Ideal for</p><ul class="js-ov-tags">${s.tags.map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul></div>
  <aside class="js-ov-card"><img src="${s.img}" alt="${s.title}"/><div><strong>Get a free quote</strong><p>Send a few photos and your location on WhatsApp for a free quote or site visit.</p><a class="js-btn js-btn-p" href="${waText(`Hello JSTC, I would like a quote for ${s.title}.`)}">${ICO.wa} Quote on WhatsApp</a></div></aside>
</div></section>`, `${BTN_CSS}.js-ov{padding:96px 0}
.js-ov-g{display:grid;grid-template-columns:1.25fr 1fr;gap:56px;align-items:start}
.js-ov h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.6rem,2.6vw,2.2rem);line-height:1.2;color:${INK};margin-bottom:16px}
.js-ov-k{margin-top:28px;font-weight:800;color:${NAVY};font-size:.8rem;letter-spacing:.18em;text-transform:uppercase}
.js-ov-tags{list-style:none;padding:0;margin:12px 0 0;display:flex;flex-wrap:wrap;gap:10px}
.js-ov-tags li{display:flex;align-items:center;gap:8px;background:${MIST};color:${NAVY};font-weight:600;font-size:.92rem;padding:9px 14px;border-radius:999px}.js-ov-tags svg{color:${GREEN}}
.js-ov-card{background:#fff;border:1px solid ${LINE};border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -35px rgba(13,53,80,.45);position:sticky;top:110px}
.js-ov-card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.js-ov-card div{padding:24px}
.js-ov-card strong{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.25rem;color:${INK}}.js-ov-card p{color:#4A5B69;margin:8px 0 18px;line-height:1.55}
@media(max-width:900px){.js-ov-g{grid-template-columns:1fr}.js-ov-card{position:static}.js-ov{padding:64px 0}}`);
}

function svcIncludesPremium(s, bg = MIST, head = "What we offer") {
  return html("inc", `<section class="js-in"><div class="js-wrap">
  <div class="js-head"><p class="js-eyebrow">${head}</p><h2>${s.title}</h2></div>
  <div class="js-in-g">${s.includes.map(([, t, d], i) => `<div><span>${SVC_NUM(i)}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `.js-in{padding:96px 0}
.js-head{max-width:46rem;margin:0 auto 40px;text-align:center}
.js-head h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.8rem,3vw,2.5rem);line-height:1.15;color:${INK}}
.js-in-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.js-in-g div{background:#fff;border-radius:20px;padding:28px;border:1px solid ${LINE};transition:box-shadow .2s,transform .2s}
.js-in-g div:hover{transform:translateY(-4px);box-shadow:0 24px 48px -28px rgba(13,53,80,.45)}
.js-in-g span{font-family:"Montserrat",sans-serif;font-weight:800;color:${BLUE};font-size:.95rem;letter-spacing:.05em}
.js-in-g h3{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.15rem;color:${INK};margin:10px 0 8px}
.js-in-g p{color:#4A5B69;line-height:1.6}
@media(max-width:560px){.js-in{padding:64px 0}}`, bg);
}

function contactCards(bg = MIST) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "colored-tiles",
    data: {
      title: "Contact us", subtitle: `Business hours: ${HOURS}. Sunday closed.`, columns: 4, iconSize: "md",
      items: [
        ["Phone", "Call", PHONE_DISPLAY, `tel:${PHONE}`],
        ["MessageCircle", "WhatsApp", WA_DISPLAY, WA],
        ["Mail", "Email", EMAIL, `mailto:${EMAIL}`],
        ["MapPin", "Office", "Office 116, Naema Hamad Abdulla Bldg, Deira Naif, Dubai", "https://www.google.com/maps?q=Naif%2C%20Deira%2C%20Dubai"],
      ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: BLUE, label, description, url })),
    },
  };
}

// ─── JSTC-only sections ─────────────────────────────────────────────────────
const AREAS = ["Deira", "Al Qusais", "Bur Dubai", "Al Barsha", "Jumeirah", "Dubai Marina"];

function areasBand(bg = PAPER) {
  return html("areas", `<section class="js-ar"><div class="js-wrap js-ar-g">
  <div><p class="js-eyebrow">Service areas</p><h2>Across Dubai, from our office in Deira Naif.</h2><p class="js-lede">We work with homeowners, tenants, real estate companies, contractors, and businesses of all sizes.</p>
  <a class="js-btn js-btn-p" href="${waText("Hello JSTC, do you cover my area?")}">${ICO.wa} Check your area</a></div>
  <ul>${AREAS.map((a) => `<li>${ICO.pin}<span>${a}</span></li>`).join("")}<li class="js-ar-more"><span>and more across Dubai</span></li></ul>
</div></section>`, `${BTN_CSS}.js-ar{padding:88px 0}
.js-ar-g{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:center}
.js-ar h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.8rem,3vw,2.5rem);line-height:1.12;color:${INK};margin-bottom:14px}
.js-ar .js-lede{margin-bottom:26px}
.js-ar ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.js-ar li{display:flex;align-items:center;gap:12px;background:${MIST};border:1px solid ${LINE};border-radius:16px;padding:18px 20px;font-weight:700;color:${NAVY};font-size:1.05rem}
.js-ar li svg{color:${GREEN};width:20px;height:20px}
.js-ar-more{background:${NAVY}!important;color:#fff!important;border-color:${NAVY}!important;justify-content:center}
@media(max-width:860px){.js-ar-g{grid-template-columns:1fr;gap:32px}.js-ar{padding:64px 0}}`, bg);
}

// Client's own reviews from their cleaning page (the home-page reviews on the
// old site were theme placeholders and were not carried over).
const REVIEWS = [
  ["JSTC provided exceptional cleaning for our villa. The team arrived on time, every corner was spotless. Highly recommended!", "Ahmed K.", "Dubai Homeowner"],
  ["Hired a live-in maid through JSTC and could not be happier. Skilled, trustworthy, great with the kids. The free trial made the decision easy.", "Sarah M.", "Working Mother, Dubai"],
  ["Post-construction cleaning done brilliantly. Removed all dust and debris quickly. Transparent pricing with no surprise charges.", "Ravi S.", "Property Developer, Dubai"],
  ["Excellent weekly office cleaning. Reliable team, fresh workspace every time. Management is very responsive and helpful.", "Fatima A.", "Office Manager, Dubai"],
];
function reviews(bg = MIST) {
  return html("rev", `<section class="js-rv"><div class="js-wrap">
  <div class="js-head"><p class="js-eyebrow">Client reviews</p><h2>What our clients say</h2></div>
  <div class="js-rv-g">${REVIEWS.map(([q, n, r]) => `<figure><div class="js-rv-s">★★★★★</div><blockquote>${q}</blockquote><figcaption><b>${n.charAt(0)}</b><div><strong>${n}</strong><span>${r}</span></div></figcaption></figure>`).join("")}</div>
</div></section>`, `.js-rv{padding:96px 0}
.js-head{max-width:46rem;margin:0 auto 40px;text-align:center}
.js-head h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.8rem,3vw,2.5rem);line-height:1.15;color:${INK}}
.js-rv-g{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}
.js-rv figure{margin:0;background:#fff;border:1px solid ${LINE};border-radius:22px;padding:28px;display:flex;flex-direction:column;gap:16px}
.js-rv-s{color:#F5B301;letter-spacing:3px}
.js-rv blockquote{margin:0;color:#33434F;font-size:1.05rem;line-height:1.65;flex:1}
.js-rv figcaption{display:flex;gap:12px;align-items:center}
.js-rv figcaption b{width:42px;height:42px;border-radius:50%;background:${BLUE};color:#fff;display:grid;place-items:center;font-family:"Montserrat",sans-serif}
.js-rv figcaption strong{display:block;color:${INK}}.js-rv figcaption span{color:#64748B;font-size:.88rem}
@media(max-width:760px){.js-rv-g{grid-template-columns:1fr}.js-rv{padding:64px 0}}`, bg);
}

function offerBand() {
  const pts = [["FREE", "Property assessment"], ["VERIFIED", "Trained professionals"], ["GUARANTEED", "Satisfaction promise"], ["QUICK", "Free replacements"], ["FLEXIBLE", "Monthly / yearly plans"]];
  return html("offer", `<section class="js-of"><div class="js-wrap"><div class="js-of-box">
  <div><p class="js-of-k">New client special offer</p><h2>Free trial. Experience us before committing.</h2><p>Try our service before committing. Free replacements guaranteed. No hidden charges, only trusted results.</p>
  <a class="js-btn js-btn-w" href="${waText("Hello JSTC, I would like to book the free trial.")}">${ICO.wa} Book your free trial</a></div>
  <ul>${pts.map(([a, b]) => `<li><strong>${a}</strong><span>${b}</span></li>`).join("")}</ul>
</div></div></section>`, `${BTN_CSS}.js-of{padding:88px 0}
.js-of-box{display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:center;background:linear-gradient(120deg,${BLUE},#1F6FA3);border-radius:32px;padding:56px;color:#fff}
.js-of-k{font-size:.78rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#E5F6CF}
.js-of h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.8rem,3vw,2.5rem);line-height:1.12;margin:12px 0 14px}
.js-of p{color:#E3F0F8;line-height:1.6;margin-bottom:26px}
.js-of ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.js-of li{display:flex;justify-content:space-between;gap:16px;background:rgba(255,255,255,.12);border-radius:14px;padding:14px 18px}
.js-of li strong{font-family:"Montserrat",sans-serif;color:#E5F6CF;letter-spacing:.06em}.js-of li span{color:#fff;font-weight:600}
@media(max-width:860px){.js-of-box{grid-template-columns:1fr;padding:36px 24px}.js-of{padding:56px 0}}`);
}

function textBlock(eyebrow, title, paras, bg = PAPER) {
  return html("txt", `<section class="js-tx"><div class="js-wrap js-tx-in"><p class="js-eyebrow">${eyebrow}</p><h2>${title}</h2>${paras.map((p) => `<p class="js-lede">${p}</p>`).join("")}</div></section>`,
    `.js-tx{padding:88px 0}.js-tx-in{max-width:52rem}
.js-tx h2{font-family:"Montserrat",sans-serif;font-weight:800;font-size:clamp(1.8rem,3vw,2.5rem);line-height:1.15;color:${INK};margin-bottom:18px}
.js-tx .js-lede{margin-top:14px}
@media(max-width:700px){.js-tx{padding:56px 0}}`, bg);
}

function missionVision(bg = MIST) {
  const cards = [
    ["Our Mission", "To provide reliable, efficient, and professional technical services that meet the highest standards of workmanship, delivered on time, within budget, and with full customer satisfaction."],
    ["Our Vision", "To be recognized as one of Dubai's most dependable technical service providers, known for quality, trust, and a commitment to excellence in every project we undertake."],
  ];
  return html("mv", `<section class="js-mv"><div class="js-wrap js-mv-g">${cards.map(([t, d], i) => `<div class="js-mv-${i}"><h3>${t}</h3><p>${d}</p></div>`).join("")}</div></section>`,
    `.js-mv{padding:88px 0}.js-mv-g{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.js-mv-g div{border-radius:24px;padding:40px}
.js-mv-0{background:${NAVY};color:#fff}.js-mv-1{background:#fff;border:1px solid ${LINE}}
.js-mv h3{font-family:"Montserrat",sans-serif;font-weight:800;font-size:1.5rem;margin-bottom:12px}
.js-mv-0 h3{color:${SKY}}.js-mv-1 h3{color:${BLUE}}
.js-mv-0 p{color:#D5E6F2;line-height:1.7}.js-mv-1 p{color:#4A5B69;line-height:1.7}
@media(max-width:760px){.js-mv-g{grid-template-columns:1fr}.js-mv{padding:56px 0}}`, bg);
}

function values(bg = PAPER) {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "numbered-columns",
    data: {
      title: "Our Core Values", subtitle: "What we stand for", layout: "grid", columns: 3, style: "minimal",
      items: [
        ["Integrity", "We believe in honest work, transparent communication, and keeping our promises."],
        ["Quality", "Every service we provide is done with attention to detail and care for long-term value."],
        ["Reliability", "We show up on time, complete work as scheduled, and never cut corners."],
        ["Customer Focus", "Our clients' satisfaction drives every decision and action we take."],
        ["Safety", "We follow strict safety standards to protect our team, clients, and properties."],
      ].map(([title, description]) => ({ id: uid("f"), title, description })),
    },
  };
}

// ─── Deep cleaning & maid page (the client's richest page) ──────────────────
const CLEAN = SERVICES.find((s) => s.special);
CLEAN.includes = [
  [null, "Residential Cleaning", "Regular and deep cleaning for homes, apartments, and villas. Professional, thorough, and tailored to your schedule."],
  [null, "Commercial & Office Cleaning", "Offices, retail outlets, and commercial spaces cleaned to the highest standard."],
  [null, "Live-in & Live-out Maids", "Full-time trained housemaids for daily chores, live-in or live-out to suit your household."],
  [null, "Post-Construction & Move-in/out", "Thorough cleaning before or after shifting, so every corner is spotless and move-in ready."],
];
CLEAN.why = [
  ["Deep Cleaning Expertise", "Professional-grade equipment and eco-friendly products. Every corner covered."],
  ["Verified & Trained Staff", "All staff background-checked and professionally trained. Quality maintained on every job."],
  ["Free Replacements", "Not satisfied? Quick free replacements guaranteed."],
  ["Flexible Contracts", "Monthly, yearly, or two-year plans. Part-time or full-time. We adapt to your schedule."],
  ["Transparent Pricing", "No hidden charges. Honest upfront quote for every service."],
];
const CLEAN_FAQ = [
  ["What cleaning and maid services do you offer in Dubai?", "Residential deep cleaning, commercial and office cleaning, live-in and live-out maid placement, nanny services, post-construction cleaning, move-in/move-out cleaning, and custom packages tailored to your schedule and budget."],
  ["How do I hire a live-in or live-out maid?", "Contact us via WhatsApp or call us. We discuss your requirements, present suitable candidates, and offer a free trial period before you commit. Quick replacements are provided if ever needed."],
  ["Are your cleaners and maids verified and trained?", "Yes. All staff are professionally trained, background-checked, and verified before placement. Our management team oversees all operations to ensure consistent quality on every job."],
  ["What contract options are available?", "Monthly, yearly, or two-year plans. Hourly, daily, part-time, or full-time arrangements are available."],
  ["How do I get a quote or book a service?", `Message us on WhatsApp at ${WA_DISPLAY} for the fastest response. Free assessment and a transparent quote with no hidden charges. Same-day service is available for urgent cleaning needs.`],
];

function reviewsStock(bg = PAPER) {
  return {
    ...BASE, id: uid("tes"), type: "testimonials", background: bgColor(bg), templateVariant: "quote-cards",
    data: { title: "What our clients say", subtitle: "Client reviews", layout: "grid",
      items: REVIEWS.slice(0, 3).map(([content, name, role]) => ({ id: uid("t"), name, role, company: "", content, rating: 5 })) },
  };
}
function areasStock(bg = MIST) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg), templateVariant: "pill-row",
    padding: { top: 64, right: 24, bottom: 64, left: 24 },
    data: { title: "Service areas across Dubai", subtitle: "From our office in Deira Naif we serve homes and businesses citywide.", columns: 4, iconSize: "sm",
      items: [...AREAS, "And more across Dubai"].map((label) => ({ id: uid("i"), icon: "MapPin", color: BLUE, label, description: "" })) },
  };
}
function ctaStock() {
  return {
    ...BASE, id: uid("cta"), type: "cta", background: bgColor(PAPER), templateVariant: "dark-split",
    data: { title: "Leave the work to us, relax with confidence.", description: "Have a question or need a quick quote? Chat with us directly on WhatsApp.", layout: "centered",
      primaryButton: { label: "WhatsApp Us", url: WA }, secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` } },
  };
}
function servicesStock(bg = PAPER) {
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg), templateVariant: "image-tiles",
    data: { title: "More than just cleaning", subtitle: "We specialize in expert cleaning and also offer a full range of technical solutions for your property.",
      layout: "grid", columns: 3, cardStyle: "elevated", source: "inline",
      items: SERVICES.map((s) => ({ id: uid("sv"), title: s.nav, description: s.short, icon: s.icon, iconType: "lucide", imageUrl: s.img, linkLabel: "View service", link: svcUrl(s) })) },
  };
}

// ─── Native blocks (2026-10-08): every section below replaces a custom_html
// helper above with a native block + variant, so the client can edit it. ────
const block = (type, variant, data, o = {}) => ({ ...BASE, id: uid(type), type, ...(variant ? { templateVariant: variant } : {}), ...o, data });
const COLORS = { dark: NAVY, accent: SKY };
const TYPO = { titleSize: "6xl", titleColor: "#ffffff", subtitleColor: "#ffffff", descColor: "#ffffff" };
const bgImage = (imageUrl, overlay = NAVY, opacity = 0.72) => ({ type: "image", imageUrl, imageOverlay: overlay, imageOverlayOpacity: opacity });

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(PAPER),
    data: {
      logoText: SITE_NAME, logo: LOGO, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: BLUE, ctaVariant: "solid", logoHeight: 58, logoCaption: "",
      showCta: true, ctaLabel: "WhatsApp Us", ctaUrl: WA,
      topBar: {
        show: true, showPhone: true, showWhatsapp: true, whatsappLabel: "WhatsApp",
        whatsappText: "Hello JSTC, I would like a quote.", background: NAVY, textColor: "#CFE2F0",
        items: [
          { id: "tb1", text: "Deira Naif, Dubai", icon: "pin", side: "left" },
          { id: "tb2", text: HOURS, icon: "clock", side: "left", hideOnMobile: true },
          { id: "tb3", text: `Licence No. ${CR}`, icon: "info", side: "left", hideOnMobile: true },
          { id: "tb4", text: EMAIL, icon: "mail", url: `mailto:${EMAIL}`, side: "right", hideOnMobile: true },
        ],
      },
    },
  };
}

function heroPremium() {
  return block("hero", "split-image-right", {
    layout: "left", badge: `Licensed in Dubai · Licence No. ${CR}`,
    title: "Trusted maid & cleaning services, plus every technical job your property needs.",
    subtitle: "",
    description: "From spotless interiors to polished exteriors, we clean homes, offices and commercial buildings across Dubai. And when you need AC, plumbing, tiling, ceilings or carpentry, the same team handles that too.",
    primaryButton: { label: "Get a free quote", url: WA, variant: "primary" },
    secondaryButton: { label: "Our services", url: "/our-services", variant: "outline" },
    imageUrl: IMG.hero, imageAlt: "JSTC cleaning team at work in an office",
  }, { background: bgColor(MIST) });
}

function servicesPremium(bg = PAPER, title = "Choose the service you need") {
  return block("services", "bento", {
    eyebrow: "What we do", title,
    subtitle: "Nine services under one licence, from building cleaning to fit-out, HVAC and maintenance. Pick one to see what is included.",
    layout: "grid", columns: 4, cardStyle: "flat", source: "inline", colors: COLORS,
    items: SERVICES.map((s) => ({ id: s.slug, title: s.nav, description: s.short, icon: s.icon, iconType: "lucide", imageUrl: s.img, link: svcUrl(s), linkLabel: "View service" })),
  }, { background: bgColor(bg) });
}

// Client-stated figures from their cleaning page.
function statsBand(items = [["500", "+", "Happy clients"], ["5", "+", "Years in Dubai"], ["50", "+", "Trained staff"], ["100", "%", "Satisfaction rate"]]) {
  return block("stats", "navy-row", {
    title: "", subtitle: "", columns: 4, style: "minimal",
    items: items.map(([value, suffix, label], i) => ({ id: `st${i}`, value, suffix, label })),
    valueColor: "#ffffff", labelColor: SKY,
  }, { background: bgColor(NAVY), padding: { top: 56, right: 24, bottom: 56, left: 24 } });
}

function whyPremium(bg = MIST, o = {}) {
  const pts = o.pts || [];
  return block("features", "split-list", {
    title: o.title || "Why choose us", subtitle: o.eyebrow || "Why choose us", description: o.lede || "",
    layout: "split", columns: 2, style: "minimal",
    items: pts.map(([title, description], i) => ({ id: `wp${i}`, icon: "CircleCheck", title, description })),
  }, { background: bgColor(bg) });
}

function offerBand() {
  return block("cta", "orange-banner", {
    eyebrow: "New client special offer", title: "Free trial. Experience us before committing.",
    description: "Free property assessment, verified and trained professionals, free replacements, flexible monthly or yearly plans. No hidden charges, only trusted results.",
    layout: "centered",
    primaryButton: { label: "Book your free trial", url: waText("Hello JSTC, I would like to book the free trial.") },
    secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
  }, { background: bgColor(BLUE) });
}

function reviews(bg = MIST) {
  return block("testimonials", "quote-cards", {
    title: "What our clients say", subtitle: "Client reviews", layout: "grid",
    items: REVIEWS.map(([content, name, role], i) => ({ id: `rv${i}`, name, role, company: "", content, rating: 5 })),
  }, { background: bgColor(bg) });
}

function areasBand(bg = PAPER) { return areasStock(bg); }

function processPremium(steps, title = "How we work", bg = MIST) {
  return block("steps", "numbered-cards", {
    title, subtitle: "How it works", layout: "horizontal", style: "connected",
    items: steps.map(([title, description], i) => ({ id: `ps${i}`, step: SVC_NUM(i), title, description })),
  }, { background: bgColor(bg) });
}

function ctaPhoto(title = "Need a quote?", text = "Tell us what you need on WhatsApp and we will get back to you quickly.") {
  return block("cta", "boutique-banner", {
    eyebrow: "Free quote", title, description: text, layout: "centered", contentPosition: "center",
    primaryButton: { label: `WhatsApp ${WA_DISPLAY}`, url: WA }, secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
  }, { background: bgImage(IMG.cleaning), style: { minHeight: 45, verticalAlign: "center" } });
}

function innerHero({ title, description, img }) {
  return block("hero", "page-banner", {
    layout: "left", badge: SHORT, title, description, showBreadcrumb: true,
    primaryButton: { label: "Get a free quote", url: WA, variant: "primary" },
    secondaryButton: { label: PHONE_DISPLAY, url: `tel:${PHONE}`, variant: "outline" },
    imageUrl: img, overlayOpacity: 0.3, colors: COLORS, typography: TYPO,
  }, { padding: ZERO });
}

function svcOverview(s) {
  return block("features", "overview-quote", {
    eyebrow: s.title, title: s.short, description: s.intro, tags: s.tags,
    layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
    card: {
      imageUrl: s.img, title: "Get a free quote",
      text: "Send a few photos and your location on WhatsApp for a free quote or site visit.",
      buttonLabel: "Quote on WhatsApp", whatsapp: true, whatsappText: `Hello JSTC, I would like a quote for ${s.title}.`,
    },
  }, { background: bgColor(PAPER) });
}

function svcIncludesPremium(s, bg = MIST, head = "What we offer") {
  return block("features", "numbered-grid", {
    eyebrow: head, title: s.title, tone: "light", layout: "grid", columns: 3, style: "minimal", colors: COLORS,
    items: s.includes.map(([, title, description], i) => ({ id: `in${i}`, title, description })),
  }, { background: bgColor(bg) });
}

function otherPremium(cur, bg = PAPER) {
  return block("services", "image-tiles", {
    title: "Other services", subtitle: "", layout: "grid", columns: 4, cardStyle: "elevated", source: "inline",
    items: SERVICES.filter((x) => x.slug !== cur.slug).map((x) => ({
      id: x.slug, title: x.nav, description: x.short, icon: x.icon, iconType: "lucide", imageUrl: x.img, linkLabel: "View service", link: svcUrl(x),
    })),
  }, { background: bgColor(bg) });
}

function textBlock(eyebrow, title, paras, bg = PAPER) {
  return block("text", null, {
    content: `<p><strong>${eyebrow.toUpperCase()}</strong></p><h2>${title}</h2>${paras.map((p) => `<p>${p}</p>`).join("")}`,
    alignment: "left", columns: 1, typography: { fontSize: "17px" },
  }, { background: bgColor(bg) });
}

function missionVision(bg = MIST) {
  return block("features", "highlight-cards", {
    title: "Mission & Vision", subtitle: "What drives us", layout: "grid", columns: 2, style: "cards",
    items: [
      { id: "mv1", icon: "Target", title: "Our Mission", description: "To provide reliable, efficient, and professional technical services that meet the highest standards of workmanship, delivered on time, within budget, and with full customer satisfaction." },
      { id: "mv2", icon: "Eye", title: "Our Vision", description: "To be recognized as one of Dubai's most dependable technical service providers, known for quality, trust, and a commitment to excellence in every project we undertake." },
    ],
  }, { background: bgColor(bg) });
}

// ─── pages ──────────────────────────────────────────────────────────────────
const whyFrom = (s, bg) => whyPremium(bg, { eyebrow: "Why choose us", title: `Why choose our ${s.nav.toLowerCase()}`, lede: s.intro.split(". ")[0] + ".", img: s.img, pts: s.why });

const BUILDERS = {
  home: () => [
    heroPremium(),
    servicesStock(PAPER),
    statsBand(),
    whyPremium(MIST, {
      eyebrow: "Why choose us", title: "One licensed team for your whole property", img: IMG.cleaning,
      lede: "We specialize in expert cleaning, and we also offer a full range of technical solutions, from AC maintenance to tiling, plumbing and carpentry.",
      pts: [
        ["Experienced and skilled team", "Our technicians bring hands-on expertise and attention to detail to every project."],
        ["Comprehensive services", "Plastering, tiling, HVAC, plumbing and more, all in one place."],
        ["Timely and trusted", "We deliver on time, communicate clearly, and put your satisfaction first."],
      ],
    }),
    offerBand(),
    reviewsStock(PAPER),
    areasStock(MIST),
    faq(CLEAN_FAQ.slice(0, 4), PAPER, "two-column-grid"),
    ctaStock(),
  ],
  "our-services": () => [
    innerHero({ crumbs: [["Our Services"]], title: "Complete technical solutions in Dubai", description: "Cleaning, plastering, HVAC, false ceilings, engraving, tiling, electromechanical, plumbing and carpentry. Reliable. Skilled. Trusted.", img: IMG.tiling }),
    servicesPremium(PAPER, "Choose the service you need"),
    processPremium(STEPS, "How we work", MIST),
    ctaPhoto("Need a quote?", "Tell us what you need on WhatsApp and we will get back to you quickly."),
  ],
  about: () => [
    innerHero({ crumbs: [["About"]], title: "About Jabedul Shamsul Technical Services", description: `A licensed technical services company in Deira Naif, Dubai. Licence No. ${CR}.`, img: IMG.plaster }),
    textBlock("About us", "Licensed, reputable and based in Deira Naif, Dubai.", [
      "Jabedul Shamsul Technical Services is a licensed and reputable technical service company based in Deira Naif, Dubai, UAE. Established to serve both residential and commercial clients, we offer a complete range of professional services including plastering, HVAC installation and maintenance, tiling, plumbing, false ceiling installation, wood flooring, cleaning, and more.",
      `We are legally registered under Licence Number ${CR}, operating as a Sole Establishment under the ownership of Jabedul Islam Mohammed Shamsul Hoque, with a deep commitment to quality, honesty, and client satisfaction.`,
    ]),
    whyPremium(MIST, {
      eyebrow: "What we do", title: "Construction, renovation and maintenance support", img: IMG.carpentry,
      lede: "Whether it is a single-room improvement or a full-building fit-out, our skilled workforce makes sure every detail is handled with precision.",
      pts: [
        ["Compliant with UAE regulations", "Our services follow UAE regulations and safety standards."],
        ["High-quality materials", "Quality materials and equipment for long-lasting results."],
        ["Residential and commercial", "Homeowners, tenants, real estate companies, contractors and businesses of all sizes."],
      ],
    }),
    missionVision(PAPER),
    values(MIST),
    areasBand(PAPER),
    ctaPhoto("Let's talk about your project.", "Call or message us for a free quote or site visit."),
  ],
  contact: () => [
    innerHero({ crumbs: [["Contact"]], title: "Contact us and enjoy your time off", description: `Call ${PHONE_DISPLAY}, WhatsApp ${WA_DISPLAY}, or send the form below.`, img: IMG.cleaning }),
    contactCards(PAPER),
    contactForm(MIST),
  ],
};
for (const s of SERVICES) {
  if (s.special) continue;
  BUILDERS[s.slug] = () => [
    innerHero({ crumbs: [["Our Services", "/our-services"], [s.nav]], title: s.title, description: s.short, img: s.img }),
    svcOverview(s),
    svcIncludesPremium(s),
    whyFrom(s, PAPER),
    processPremium(STEPS, "How it works", MIST),
    otherPremium(s),
    ctaPhoto(s.close[0], s.close[1]),
  ];
}
BUILDERS[CLEAN.slug] = () => [
  innerHero({ crumbs: [["Our Services", "/our-services"], ["Deep Cleaning"]], title: "Your space deserves expert deep cleaning", description: "Expert cleaning and trusted maid services across Dubai. Verified professionals: live-in or live-out maids, nannies, and deep cleaning specialists. Free assessment, same-day service.", img: IMG.cleaning }),
  statsBand(),
  svcIncludesPremium(CLEAN, PAPER, "Cleaning & maid solutions for every need"),
  offerBand(),
  whyPremium(MIST, { eyebrow: "Why choose JSTC", title: "Dubai's environment demands expert cleaning standards", lede: "Dubai's climate creates cleaning challenges that need trained experts. Our team handles dust, mould prevention and reliable maid placement, with transparent pricing.", img: IMG.hero, pts: CLEAN.why }),
  reviews(PAPER),
  faq(CLEAN_FAQ, MIST, "minimal-lines"),
  otherPremium(CLEAN),
  ctaPhoto("Ready for a spotlessly clean home?", "Don't let dust and dirt compromise your home or office. Message us for a free quote."),
];

const SEO = {
  home: ["Cleaning, Maid & Technical Services in Dubai", "Jabedul Shamsul Technical Services: trusted maid and cleaning services with free trial, plus plastering, AC, tiling, plumbing, ceilings and carpentry across Dubai."],
  "our-services": ["Technical Services in Dubai", "Cleaning, plastering, HVAC, false ceilings, engraving, tiling, electromechanical, plumbing and carpentry services in Dubai."],
  about: ["About Jabedul Shamsul Technical Services", `Licensed technical services company in Deira Naif, Dubai (Licence No. ${CR}) serving residential and commercial clients.`],
  contact: ["Contact Jabedul Shamsul Technical Services", `Call ${PHONE_DISPLAY} or WhatsApp ${WA_DISPLAY}. Office 116, Naema Hamad Abdulla Bldg, Deira Naif, Dubai.`],
};
for (const s of SERVICES) SEO[s.slug] = [`${s.nav} in Dubai`, `${s.short} ${s.intro || ""}`.slice(0, 158)];

// ─── write ──────────────────────────────────────────────────────────────────
async function ensureTenant() {
  const { data: existing } = await sb.from("tenants").select("id").eq("slug", SLUG).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await sb.from("tenants").insert({
    name: SITE_NAME, slug: SLUG, plan: PLAN, status: "active",
    owner_id: OWNER_ID, onboarding_completed: true,
  }).select("id").single();
  if (error) throw new Error(`tenant: ${error.message}`);
  const id = data.id;
  await sb.from("tenant_members").insert({ tenant_id: id, user_id: OWNER_ID, role: "owner" });
  await sb.from("subscriptions").upsert(
    { tenant_id: id, plan_id: PLAN, status: "active", billing_cycle: "yearly", payment_method: "manual", notes: "Existing paid client, imported from WordPress 2026-10-05" },
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
    site_name: SITE_NAME, tagline: "Complete Technical Solutions · Reliable. Skilled. Trusted",
    logo_url: LOGO, logo_dark_url: LOGO_LIGHT, logo_type: "image", logo_alt: SITE_NAME, logo_width: 260,
    favicon_url: FAVICON_URL,
    primary_color: BLUE, secondary_color: NAVY,
    color_overrides: {
      primary: BLUE, primaryFg: "#ffffff", secondary: NAVY, accent: SKY, ring: BLUE,
      background: PAPER, foreground: INK, card: "#ffffff", muted: MIST, mutedFg: "#4A5B69",
      border: LINE, borderRadius: "0.75rem",
    },
    design_overrides: { headingFont: "Montserrat", bodyFont: "Inter", headingWeight: "800", roundness: "rounded", shadow: "soft" },
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
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Dubai", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/  tenant ${tenantId}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
