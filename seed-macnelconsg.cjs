/**
 * MACNEL Construction Pte. Ltd — Singapore. Construction, renovation & maintenance.
 * Pro client, imported + redesigned from their WordPress/Divi site macnelconsg.com
 * (2026-10-06). Copy is the client's own wording; all photos are the client's own
 * files from that site (clients/Macnel Con SG/site-assets). Logo is a vector redraw
 * of their raster logo (clients/Macnel Con SG/build/build-logo.cjs).
 * Page slugs match the old WordPress URLs so links and rankings carry over.
 * Old WP is compromised (1xbet/aviator casino spam pages): none kept.
 * Tenant already existed (created by staff via the importer); this seed replaces its
 * pages and design but keeps the owner. Safe to re-run (--skip-assets skips uploads).
 * Source of truth copy: clients/Macnel Con SG/build/seed-macnelconsg.cjs
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const SLUG = "macnelconsg";
const PLAN = "pro";
const TEMPLATE_SLUG = "cleaning-simple"; // empty custom_css, so our palette wins
const ASSET_DIR = path.join(__dirname, "..", "clients", "Macnel Con SG", "site-assets");

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "MACNEL Construction Pte. Ltd";
const SHORT = "MACNEL Construction";
const PHONE = "+6589361834";
const PHONE_DISPLAY = "+65 8936 1834";
const PHONE2 = "+6591207650";
const PHONE2_DISPLAY = "+65 9120 7650";
const WA_NUMBER = "6589361834";
const EMAIL = "macnelconstruction@gmail.com";
const ADDRESS = "101 Kitchener Road, #02-13 Jalan Besar Plaza, Singapore 208511";
const HOURS = "Monday – Saturday, 9:00 AM – 6:00 PM";
const MAP_Q = "https://www.google.com/maps?q=Jalan%20Besar%20Plaza%2C%20101%20Kitchener%20Road%2C%20Singapore%20208511";
const MAP_EMBED = "https://www.google.com/maps?q=Jalan%20Besar%20Plaza%2C%20101%20Kitchener%20Road%2C%20Singapore%20208511&z=16&output=embed";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hello MACNEL, I would like a free quotation.");

const NAVY = "#16263F";   // logo wordmark, deep bands
const BLUE = "#2C6BA6";   // logo tower blue, primary
const GREEN = "#4E9A3C";  // logo "CONSTRUCTION" green, accent
const LIME = "#8CCB6B";   // light green for dark backgrounds
const INK = "#121C2B";
const PAPER = "#FFFFFF";
const MIST = "#F2F6F9";
const LINE = "#DCE5EC";
const BODY = "#4B5A6B";
const H = `"Montserrat",sans-serif`;

const STORAGE_DIR = `uploads/${SLUG}`;
const asset = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
const LOGO = asset("macnel-logo.png");
const LOGO_LIGHT = asset("macnel-logo-light.png");
const FAVICON_URL = asset("favicon.png");
const P = (n) => asset(`mc-${String(n).padStart(3, "0")}.jpg`); // client site photos
const T = (name) => asset(`mc-${name}.jpg`);                      // client service banners

// ─── Services (client's own wording) ────────────────────────────────────────
const CORE = [
  {
    slug: "house-painting-plastering", icon: "PaintRoller", title: "House Painting & Plastering", nav: "Painting & Plastering",
    img: P(20), photo: P(36), tagline: "Fresh paint and flawless plastering that transform any space.",
    short: "Transform your home or office with a flawless finish. Our team of expert painters and plastering specialists deliver smooth surfaces, vibrant colors, and durable coatings that last for years.",
    intro: [
      "At MACNEL Construction Pte. Ltd, we believe that a fresh coat of paint combined with smooth and professional plastering can completely transform the look, feel, and atmosphere of any space. Walls are not just boundaries — they define the character of your home or office. A well-painted wall with flawless plastering adds elegance, strength, and long-lasting beauty.",
      "Our expert painters bring creativity and precision to every project, offering vibrant colors, premium finishes, and durable coatings that withstand time and weather. Meanwhile, our plastering specialists ensure every surface is perfectly prepared, repairing cracks, leveling imperfections, and creating a seamless base for painting or wallpapering.",
    ],
    offer: [
      ["Professional Painting Services", T("professional-painting-services"), ["Interior & exterior painting for homes and offices", "Wide range of color options with premium paints", "Smooth, streak-free finishes for a polished look", "Long-lasting durability with weather-resistant coatings"]],
      ["Expert Plastering Solutions", T("expert-plastering-solutions"), ["Wall and ceiling plastering for a flawless base", "Crack repair and surface leveling", "High-quality materials for strength and longevity", "Perfect preparation for painting or wallpapering"]],
    ],
    why: [["Skilled Team", "Experienced painters and plasterers with attention to detail"], ["Quality Materials", "We use trusted brands for lasting results"], ["Clean & Efficient", "Minimal disruption, neat work, and timely completion"], ["Customized Solutions", "Colors and finishes tailored to your style"]],
    benefits: ["A fresh, modern look for your property", "Improved durability and protection for walls", "Increased property value with professional finishes", "Stress-free service from start to finish"],
    gallery: [P(36), P(70), P(71), P(19), P(72), P(20)],
  },
  {
    slug: "tiling-works", icon: "Grid3x3", title: "Tiling Works", nav: "Tiling Works",
    img: P(63), photo: P(30), tagline: "Precise floor and wall tiling that stands the test of time.",
    short: "Enhance your interiors with elegant floor tiles and stylish wall designs. Our tiling experts provide accurate installation, durable finishes, and creative patterns. From kitchens to bathrooms, we make every surface stand out.",
    intro: [
      "At MACNEL Construction Pte. Ltd, we specialize in delivering high-quality tiling solutions that enhance the beauty, durability, and functionality of your property. Tiles are more than just coverings — they define the character of your floors, walls, kitchens, and bathrooms.",
      "Our team of experts ensures every tile is laid with accuracy, creating smooth, even surfaces that stand the test of time. Whether you prefer classic ceramic, modern porcelain, or stylish mosaic designs, we provide customized solutions that match your taste and lifestyle.",
    ],
    offer: [
      ["Floor Tiling", T("floor-tiling"), ["Durable and stylish flooring for homes and offices", "Wide range of designs, colors, and finishes", "Slip-resistant options for safety and comfort", "Long-lasting installation with professional craftsmanship"]],
      ["Wall Tiling", T("wall-tiling"), ["Decorative wall tiles for kitchens, bathrooms, and living spaces", "Easy-to-clean surfaces that add elegance and practicality", "Creative patterns and layouts to suit your design vision"]],
      ["Bathroom & Kitchen Tiling", T("bathroom-kitchen-tiling"), ["Waterproof and stain-resistant tiles for wet areas", "Hygienic solutions that combine beauty with functionality", "Modern designs that elevate the look of your interiors"]],
      ["Custom Designs & Patterns", P(68), ["Mosaic, geometric, and decorative tiling options", "Tailored layouts to create unique visual appeal", "Expert consultation to bring your ideas to life"]],
    ],
    why: [["Skilled Team", "Experienced tiling specialists with attention to detail"], ["Premium Materials", "High-quality tiles sourced from trusted suppliers"], ["Precision Installation", "Perfect alignment and finishing for lasting results"], ["Creative Solutions", "Designs customized to your style and needs"]],
    benefits: ["Elegant and modern interiors that increase property value", "Durable surfaces that are easy to maintain", "Customized designs that reflect your personality", "Stress-free service from consultation to completion"],
    gallery: [P(92), P(91), P(65), P(47), P(83), P(45), P(50), P(46)],
  },
  {
    slug: "false-ceiling", icon: "LampCeiling", title: "False Ceiling", nav: "False Ceiling",
    img: P(21), photo: P(22), tagline: "Ceilings that improve lighting, conceal services and look modern.",
    short: "Upgrade your interiors with modern false ceiling solutions that combine style and practicality. We design and install ceilings that improve lighting, add insulation, and create a sophisticated look for any room.",
    intro: [
      "At MACNEL Construction Pte. Ltd, we provide innovative false ceiling solutions that combine style, functionality, and durability. A false ceiling is more than just an aesthetic upgrade — it improves lighting, conceals wiring and ductwork, enhances acoustics, and adds a modern touch to any interior.",
      "Our team specializes in designing and installing ceilings that suit both residential and commercial spaces. Whether you want a sleek minimalist look, decorative patterns, or customized designs, we deliver flawless finishes that transform your interiors.",
    ],
    offer: [
      ["Residential False Ceilings", T("residential-false-ceilings"), ["Elegant designs for living rooms, bedrooms, and dining areas", "Concealed lighting options for a cozy atmosphere", "Durable materials that last for years"]],
      ["Commercial False Ceilings", T("commercial-false-ceilings"), ["Professional layouts for offices, showrooms, and retail spaces", "Acoustic solutions to reduce noise and improve productivity", "Energy-efficient designs that optimize lighting and cooling"]],
      ["Custom Designs", P(23), ["Gypsum, POP, and modular ceiling options", "Creative patterns and textures tailored to your style", "Integration with lighting, fans, and air-conditioning systems"]],
    ],
    why: [["Expert Team", "Skilled professionals with years of experience in ceiling design and installation"], ["Premium Materials", "High-quality, durable products for long-lasting performance"], ["Creative Solutions", "Designs customized to match your interiors"], ["Efficient Service", "Timely completion with minimal disruption"]],
    benefits: ["Modern and stylish interiors that impress visitors", "Improved lighting and energy efficiency", "Concealed wiring and ductwork for a clean look", "Enhanced acoustics and comfort in every room"],
    gallery: [P(22), P(23), P(105), P(94), P(99), P(21)],
  },
  {
    slug: "electrical-works-rewiring", icon: "Zap", title: "Electrical Works / Rewiring", nav: "Electrical & Rewiring",
    img: T("complete-electrical-installations"), photo: P(101), tagline: "Safe, efficient and long-lasting electrical systems.",
    short: "Ensure safety and efficiency with our professional electrical services. From rewiring to new installations, we provide reliable solutions that meet modern standards.",
    intro: [
      "At MACNEL Construction Pte. Ltd, we understand that electrical systems are the backbone of every property. From powering appliances to ensuring safety, proper wiring and electrical installations are essential. Our team provides comprehensive electrical services, including rewiring, installations, repairs, and upgrades, tailored to both residential and commercial needs.",
      "We focus on delivering solutions that are safe, efficient, and long-lasting. Whether you are renovating your home, upgrading your office, or fixing electrical issues, we ensure every project is completed with precision and compliance with safety standards.",
    ],
    offer: [
      ["Complete Electrical Installations", T("complete-electrical-installations"), ["Wiring and cabling for new constructions and renovations", "Installation of switches, sockets, and lighting systems", "Integration with modern appliances and smart devices"]],
      ["Rewiring Services", T("rewiring-services"), ["Replacement of old or faulty wiring to prevent hazards", "Upgrading electrical systems for improved efficiency", "Ensuring compliance with current safety codes and standards"]],
      ["Repairs & Maintenance", T("repairs-maintenance"), ["Quick response to electrical faults and breakdowns", "Troubleshooting and fixing circuit issues", "Regular maintenance to prevent future problems"]],
      ["Upgrades & Enhancements", T("upgrades-enhancements"), ["Energy-efficient lighting and electrical solutions", "Smart home electrical integration", "Load balancing and system optimization for heavy usage"]],
    ],
    why: [["Skilled Electricians", "Professionals with years of experience"], ["Safety First", "Strict adherence to safety codes and regulations"], ["Reliable Service", "Prompt response and efficient solutions"], ["Customized Plans", "Tailored electrical setups to meet your property's needs"]],
    benefits: ["Safer living and working environments", "Improved energy efficiency and reduced costs", "Modern electrical systems that support advanced technology", "Peace of mind with professional, reliable service"],
    gallery: [P(101), P(85), P(86), P(105), P(94), P(99)],
  },
  {
    slug: "carpentry-services", icon: "Hammer", title: "Carpentry Services", nav: "Carpentry",
    img: P(27), photo: P(16), tagline: "Custom furniture and woodwork, built to fit your space.",
    short: "Bring your ideas to life with custom furniture and woodwork. Our carpentry team crafts cabinets, shelves, doors, and bespoke designs with precision and care.",
    intro: [
      "At MACNEL Construction Pte. Ltd, we provide high-quality carpentry solutions that combine functionality, durability, and aesthetic appeal. From custom furniture to structural woodwork, our skilled carpenters deliver precision and creativity in every project. Carpentry is not just about building — it's about creating spaces that reflect your lifestyle and enhance the beauty of your property.",
      "We specialize in both residential and commercial carpentry, offering tailored designs and flawless installations. Whether you need modern fittings, traditional woodwork, or customized solutions, our team ensures every detail is handled with care and professionalism.",
    ],
    offer: [
      ["Custom Furniture & Fixtures", T("custom-furniture-fixtures"), ["Bespoke designs for wardrobes, cabinets, and shelves", "Stylish and functional furniture tailored to your space", "Durable finishes that stand the test of time"]],
      ["Doors & Windows", T("doors-windows"), ["Wooden door and window installations with secure fittings", "Decorative designs that enhance aesthetics", "Long-lasting solutions for safety and comfort"]],
      ["Flooring & Paneling", T("flooring-paneling"), ["Wooden flooring with smooth finishes", "Wall paneling for a warm and elegant look", "High-quality materials for durability and style"]],
      ["Office & Commercial Carpentry", T("office-commercial-carpentry"), ["Workstations, counters, and storage solutions", "Professional layouts that improve productivity", "Customized designs for retail and corporate spaces"]],
      ["Repair & Maintenance", T("repair-maintenance"), ["Quick fixes for damaged furniture and fittings", "Restoration of old wooden structures", "Regular maintenance to extend lifespan"]],
    ],
    why: [["Skilled Craftsmen", "Experienced carpenters with attention to detail"], ["Premium Materials", "High-quality wood and fittings for lasting results"], ["Creative Designs", "Customized solutions to match your style"], ["Reliable Service", "Timely completion with minimal disruption"]],
    benefits: ["Elegant and functional wooden solutions for your property", "Increased property value with professional craftsmanship", "Customized designs that reflect your personality", "Stress-free service from consultation to completion"],
    gallery: [P(16), P(17), P(18), P(26), P(28), P(32), P(34), P(104)],
  },
];

const TOILET = {
  slug: "toilet-renovation-in-singapore", title: "Toilet Renovation in Singapore", nav: "Toilet Renovation", icon: "Bath",
  img: P(13), short: "Hacking, waterproofing, tiling and plumbing, properly managed by one team, for condominiums and landed homes across Singapore.",
};

// "Our Other Services" — no detail pages on the old site either; anchored on /services.
const OTHER = [
  ["partition-works", "Partition Works", "partition-works", "Create functional and flexible spaces with our partition solutions. Ideal for homes and offices, we design partitions that maximize space, improve privacy, and enhance the overall layout.", "Our partition solutions are designed to create functional, flexible, and stylish spaces for both homes and offices. Whether you need to divide a large hall into smaller rooms, add privacy to your workspace, or create customized layouts, we provide durable and modern partition systems. With precise installation and high-quality materials, our partitions maximize space efficiency, improve privacy, and enhance the overall design of your property."],
  ["house-renovation", "House Renovation", "house-renovation", "Transform your property into a modern, comfortable, and stylish living space. Our renovation services cover everything from flooring and walls to electrical and plumbing.", "Give your property a complete makeover with our comprehensive renovation services. From flooring upgrades and wall finishes to electrical rewiring and plumbing improvements, we handle every aspect of the renovation process. Our team works closely with you to design modern, comfortable, and stylish living spaces that reflect your personality and lifestyle. We ensure quality craftsmanship, timely delivery, and a transformation that adds long-term value to your home or office."],
  ["plumbing-works", "Plumbing Works", "plumbing-works", "Reliable plumbing solutions for water supply, drainage, and maintenance. Leak repairs, pipe installations, and system upgrades.", "Our plumbing services cover everything from water supply systems and drainage lines to leak repairs and pipe installations. We provide reliable solutions that keep your daily life running smoothly. Whether it's fixing a minor issue or installing a complete plumbing system, our experienced team ensures efficiency, durability, and compliance with safety standards. With regular maintenance and quick response, we help prevent costly problems and keep your property in top condition."],
  ["solar-panel-installation", "Solar Panel Installation", "solar-panel-installation", "Reduce electricity costs and embrace sustainability with eco-friendly solar energy systems. Professional installation and maintenance.", "Reduce electricity bills and embrace sustainability with our eco-friendly solar panel solutions. We design and install solar energy systems tailored to your property's needs, ensuring maximum efficiency and long-term performance. Our team provides safe installation, professional maintenance, and guidance on how to optimize energy usage. By choosing solar, you not only save money but also contribute to a greener future."],
  ["vinyl-flooring", "Vinyl Flooring", "vinyl-flooring", "Stylish, durable, and cost-effective flooring for every room. Easy to maintain, resistant to wear, and available in a variety of designs.", "Vinyl flooring is a stylish, durable, and cost-effective option for modern interiors. Our solutions are resistant to scratches, easy to maintain, and available in a wide variety of designs and finishes. Perfect for both residential and commercial spaces, vinyl flooring combines practicality with elegance, giving every room a fresh and contemporary look."],
  ["timber-wpc-decking", "Timber & WPC Decking", "timber-wpc-decking", "Natural timber or modern WPC decking for gardens, patios, and balconies, combining beauty with durability.", "Enhance your outdoor living areas with our premium timber and WPC decking solutions. Whether for gardens, patios, or balconies, we provide decking that combines natural beauty with long-lasting durability. Our designs are weather-resistant, low-maintenance, and tailored to suit your lifestyle, creating inviting outdoor spaces for relaxation and entertainment."],
  ["handyman-services", "Handyman Services", "handyman-services", "Quick fixes and small maintenance tasks handled with care. From minor repairs to installations, your home or office runs smoothly.", "Our handyman services are perfect for quick fixes and small maintenance tasks. From furniture assembly and minor repairs to installations and adjustments, we handle every job with care and professionalism. We ensure that your home or office remains functional, safe, and well-maintained without the hassle of managing multiple contractors."],
  ["door-window-installation", "Door & Window Installation", "door-window-installation", "Secure and stylish installations for doors and windows, improving safety, energy efficiency, and aesthetics.", "Secure and stylish doors and windows are essential for every property. We provide professional installation services that improve safety, energy efficiency, and aesthetics. With a wide range of designs and durable materials, our solutions enhance both the look and performance of your home or office."],
  ["air-conditioning", "Air-Conditioning Service / Installation", "air-conditioning-service-installation", "Professional AC servicing and installation for efficient performance, energy savings, and long-term reliability.", "Stay cool and comfortable with our expert air-conditioning services. We handle new installations, regular servicing, and system upgrades to ensure efficient performance and energy savings. Our team focuses on delivering long-term reliability, so you can enjoy a comfortable indoor environment throughout the year."],
  ["marble-polishing", "Marble Polishing", "marble-polishing", "Restore the natural shine of marble. We remove stains, scratches, and dullness, leaving your floors looking brand new.", "Restore the natural shine and elegance of your marble surfaces with our professional polishing services. We remove stains, scratches, and dullness, bringing back the luxurious look of your floors and countertops. Our techniques ensure a smooth, glossy finish that enhances the beauty and value of your property."],
  ["gardening-maintenance", "Gardening Maintenance", "marble-polishing-b", "Trimming, watering, fertilizing, and landscaping to keep your garden green, healthy, and well-maintained.", "Keep your garden green, healthy, and vibrant with our regular maintenance services. We provide trimming, watering, fertilizing, and landscaping to create beautiful outdoor environments. Whether it's a small backyard or a large commercial garden, our team ensures your greenery thrives all year round."],
  ["metal-works", "Metal Works", "metal-works", "Custom metal fabrication for structural and decorative needs: gates, railings, frames and more.", "Our custom metal fabrication services cover structural and decorative needs, including gates, railings, frames, and artistic designs. We combine strength, precision, and creativity to deliver solutions that are both functional and visually appealing. With durable materials and expert craftsmanship, our metal works add security and style to your property."],
].map(([id, title, img, short, long]) => ({ id, title, img: T(img), short, long }));
// The site's "Marble-Polishing-2.png" banner is actually the gardening photo (misnamed upstream).

const ALL_SERVICE_NAMES = [...CORE.map((s) => s.title), "Toilet Renovation", ...OTHER.map((o) => o.title)];

const svcUrl = (s) => `/${s.slug}`;
const PAGES = [
  ["home", "Home"],
  ["services", "Services"],
  ...CORE.map((s) => [s.slug, s.title, true]),
  [TOILET.slug, TOILET.title],
  ["project-gallery", "Project Gallery"],
  ["about-us", "About Us"],
  ["contact-us", "Contact Us"],
];

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = { visible: true, width: "full", padding: { top: 88, right: 24, bottom: 88, left: 24 }, margin: ZERO, background: { type: "none" } };
const bgColor = (color) => ({ type: "color", color });
const html = (id, markup, css, bg = PAPER) => ({ ...BASE, id: uid(id), type: "custom_html", padding: ZERO, background: bgColor(bg), data: { html: markup, css } });
const NUM = (i) => String(i + 1).padStart(2, "0");

const CHECK = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const ARROW = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const STAR = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>`;
const ICO = {
  phone: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  wa: `<svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor"><path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2 7.8L0 32l8.5-2A16 16 0 1 0 16 0zm7.3 19.3c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1.2-3c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.4 3.9 1.6 4.1c.2.3 2.8 4.3 6.8 6 1 .4 1.7.7 2.3.8 1 .3 1.8.3 2.5.2.8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"/></svg>`,
};
const BTN_CSS = `.mc-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:700;font-size:.97rem;text-decoration:none;line-height:1}
.mc-btn-g{background:${GREEN};color:#fff}.mc-btn-g:hover{background:#3F8530;transform:translateY(-2px)}
.mc-btn-b{background:${BLUE};color:#fff}.mc-btn-b:hover{background:#235A8E;transform:translateY(-2px)}
.mc-btn-o{border:1.5px solid rgba(255,255,255,.5);color:#fff}.mc-btn-o:hover{background:rgba(255,255,255,.1)}
.mc-btn-d{border:1.5px solid ${NAVY};color:${NAVY}}.mc-btn-d:hover{background:${NAVY};color:#fff}
.mc-wrap{max-width:78rem;margin:0 auto;padding:0 24px}
.mc-eyebrow{font-size:.76rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:${GREEN};margin-bottom:14px;display:flex;align-items:center;gap:10px}
.mc-eyebrow::before{content:"";width:26px;height:3px;background:linear-gradient(90deg,${BLUE},${GREEN});border-radius:2px}
.mc-h2{font-family:${H};font-weight:800;font-size:clamp(1.85rem,3.1vw,2.6rem);line-height:1.12;color:${INK};letter-spacing:-.015em}
.mc-lede{color:${BODY};font-size:1.04rem;line-height:1.75}
a,button{transition:background-color .2s,color .2s,border-color .2s,box-shadow .2s,transform .2s}`;

// ─── header / footer ────────────────────────────────────────────────────────
function navItems() {
  return [
    { id: "n0", label: "Home", url: "/", children: [] },
    { id: "n1", label: "Services", url: "/services", children: [
      ...CORE.map((s, k) => ({ id: `n1-${k}`, label: s.nav, url: svcUrl(s), children: [] })),
      { id: "n1-t", label: TOILET.nav, url: svcUrl(TOILET), children: [] },
      { id: "n1-all", label: "All 18 services", url: "/services#other-services", children: [] },
    ] },
    { id: "n2", label: "Toilet Renovation", url: svcUrl(TOILET), children: [] },
    { id: "n3", label: "Project Gallery", url: "/project-gallery", children: [] },
    { id: "n4", label: "About Us", url: "/about-us", children: [] },
    { id: "n5", label: "Contact", url: "/contact-us", children: [] },
  ];
}

function topBar() {
  return {
    id: uid("top"), type: "custom_html", order: 0, visible: true, width: "full", padding: ZERO, margin: ZERO, background: bgColor(NAVY),
    data: {
      html: `<div class="mc-top"><div class="mc-top-in">
  <div class="mc-top-l"><a href="${MAP_Q}" target="_blank" rel="noopener">${ICO.pin} Jalan Besar Plaza, Singapore</a><span class="mc-hide">${ICO.clock} Mon – Sat, 9 AM – 6 PM</span></div>
  <div class="mc-top-r"><a href="mailto:${EMAIL}" class="mc-hide">${ICO.mail} ${EMAIL}</a><a href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a><a href="${WA}" class="mc-top-wa">${ICO.wa} WhatsApp</a></div>
</div></div>`,
      css: `.mc-top{background:${NAVY};color:#BFCBDA;font-size:.82rem}
.mc-top-in{max-width:80rem;margin:0 auto;padding:9px 24px;display:flex;justify-content:space-between;gap:16px;align-items:center}
.mc-top-l,.mc-top-r{display:flex;gap:22px;align-items:center}
.mc-top span,.mc-top a{display:inline-flex;align-items:center;gap:7px;color:inherit;text-decoration:none;white-space:nowrap}
.mc-top a:hover{color:#fff}
.mc-top-wa{background:#25D366;color:#fff!important;padding:5px 12px;border-radius:999px;font-weight:700}
@media(max-width:900px){.mc-hide{display:none!important}.mc-top-in{padding:8px 16px}}@media(max-width:520px){.mc-top-l{display:none}.mc-top-in{justify-content:flex-end}}`,
    },
  };
}

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 1, visible: true, width: "full", padding: ZERO, margin: ZERO, background: bgColor(PAPER),
    data: {
      logoText: SITE_NAME, logo: LOGO, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: GREEN, ctaVariant: "solid", logoHeight: 50, logoCaption: "",
      showCta: true, ctaLabel: "Free Quotation", ctaUrl: WA,
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full", padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_LIGHT, logoText: SITE_NAME, logoCaption: "Singapore",
      tagline: "Professional construction and renovation services tailored to your needs.",
      style: "dark", backgroundColor: NAVY, accentColor: LIME, textColor: "#BFCBDA",
      copyrightText: `© {year} ${SITE_NAME}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Core Services", links: [...CORE, TOILET].map((s) => ({ id: uid("fl"), label: s.nav, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Company", links: [["About Us", "/about-us"], ["All Services", "/services"], ["Project Gallery", "/project-gallery"], ["Contact Us", "/contact-us"]].map(([label, url]) => ({ id: uid("fl"), label, url })) },
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: `WhatsApp ${PHONE_DISPLAY}`, url: WA },
          { id: uid("fl"), label: `Call ${PHONE2_DISPLAY}`, url: `tel:${PHONE2}` },
          { id: uid("fl"), label: EMAIL, url: `mailto:${EMAIL}` },
          { id: uid("fl"), label: "101 Kitchener Road, #02-13 Jalan Besar Plaza, Singapore 208511", url: MAP_Q },
          { id: uid("fl"), label: "Mon – Sat, 9:00 AM – 6:00 PM", url: "/contact-us" },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── home sections ──────────────────────────────────────────────────────────
function heroHome() {
  return html("hero", `<section class="mc-hero"><div class="mc-wrap mc-hero-g">
  <div class="mc-hero-c">
    <p class="mc-hero-k">MACNEL Construction Pte. Ltd · Singapore</p>
    <h1>Construction &amp; renovation, <em>handled by one team.</em></h1>
    <p class="mc-hero-p">Professional construction and renovation services tailored to your needs. From minor repairs to full-scale renovations, for homes and businesses across Singapore.</p>
    <div class="mc-hero-cta"><a class="mc-btn mc-btn-g" href="${WA}">${ICO.wa} WhatsApp for a Free Quote</a><a class="mc-btn mc-btn-o" href="/services">Explore Services ${ARROW}</a></div>
    <ul class="mc-hero-f"><li><b>18</b><span>services under one roof</span></li><li><b>Mon–Sat</b><span>9:00 AM – 6:00 PM</span></li><li><b>Free</b><span>site visit &amp; quotation</span></li></ul>
  </div>
  <div class="mc-hero-art">
    <img class="a1" src="${P(21)}" alt="Living room with cove-lit false ceiling"/>
    <img class="a2" src="${P(28)}" alt="Custom kitchen cabinetry"/>
    <img class="a3" src="${P(65)}" alt="Freshly tiled living room floor"/>
    <div class="mc-hero-badge"><span>${CHECK}</span><div><b>Hacking to handover</b><small>Waterproofing, tiling, plumbing, electrical</small></div></div>
  </div>
</div></section>`, `${BTN_CSS}
.mc-hero{position:relative;overflow:hidden;background:radial-gradient(1200px 600px at 85% 0%,rgba(44,107,166,.45),transparent 60%),radial-gradient(900px 500px at 0% 100%,rgba(78,154,60,.28),transparent 60%),${NAVY};color:#fff}
.mc-hero::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:56px 56px;mask-image:linear-gradient(90deg,#000 0%,transparent 70%)}
.mc-hero-g{position:relative;display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
.mc-hero{padding:88px 0 96px}
.mc-hero-k{display:inline-flex;font-weight:700;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:${LIME};background:rgba(140,203,107,.1);border:1px solid rgba(140,203,107,.3);padding:8px 14px;border-radius:999px}
.mc-hero h1{font-family:${H};font-weight:800;font-size:clamp(2.3rem,4.8vw,4rem);line-height:1.06;letter-spacing:-.025em;margin:22px 0 20px}
.mc-hero h1 em{font-style:normal;background:linear-gradient(90deg,#6FB0EA,${LIME});-webkit-background-clip:text;background-clip:text;color:transparent}
.mc-hero-p{font-size:1.1rem;line-height:1.7;color:#C9D4E2;max-width:34rem}
.mc-hero-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.mc-hero-f{list-style:none;padding:0;margin:40px 0 0;display:flex;flex-wrap:wrap;gap:0;border-top:1px solid rgba(255,255,255,.14);padding-top:24px}
.mc-hero-f li{flex:1;min-width:130px;padding-right:18px}
.mc-hero-f li+li{border-left:1px solid rgba(255,255,255,.14);padding-left:18px}
.mc-hero-f b{display:block;font-family:${H};font-weight:800;font-size:1.5rem;color:#fff}
.mc-hero-f span{font-size:.86rem;color:#A9B7C9}
.mc-hero-art{position:relative;height:540px}
.mc-hero-art img{position:absolute;object-fit:cover;border-radius:22px;box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}
.mc-hero-art .a1{right:0;top:0;width:68%;height:62%}
.mc-hero-art .a2{left:0;top:16%;width:42%;height:52%;border:6px solid ${NAVY}}
.mc-hero-art .a3{right:8%;bottom:0;width:56%;height:40%;border:6px solid ${NAVY}}
.mc-hero-badge{position:absolute;left:2%;bottom:6%;display:flex;gap:12px;align-items:center;background:#fff;color:${INK};padding:14px 18px;border-radius:16px;box-shadow:0 20px 50px -20px rgba(0,0,0,.5);max-width:290px}
.mc-hero-badge span{flex:none;width:40px;height:40px;border-radius:12px;background:${GREEN};color:#fff;display:grid;place-items:center}
.mc-hero-badge b{font-family:${H};font-weight:800;display:block;font-size:.98rem}.mc-hero-badge small{color:${BODY};font-size:.8rem}
@media(max-width:960px){.mc-hero{padding:56px 0 64px}.mc-hero-g{grid-template-columns:1fr;gap:40px}.mc-hero-art{height:420px}}
@media(max-width:520px){.mc-hero-art{height:340px}.mc-hero-badge{display:none}.mc-hero-f li{min-width:100%;border:0!important;padding:6px 0!important}}`, NAVY);
}

function coreBento(bg = PAPER, title = "Our Core Services") {
  const cards = [...CORE, TOILET];
  return html("core", `<section class="mc-co"><div class="mc-wrap">
  <div class="mc-co-h"><div><p class="mc-eyebrow">What we do best</p><h2 class="mc-h2">${title}</h2></div><p class="mc-lede">Every project deserves the highest level of care and craftsmanship. Choose a service to see exactly what is included.</p></div>
  <div class="mc-co-g">${cards.map((s, i) => `<a class="mc-cc mc-cc-${i}" href="${svcUrl(s)}"><img src="${s.img}" alt="${s.title}" loading="lazy"/>
    <div class="mc-cc-b"><span>${NUM(i)}</span><h3>${s.title}</h3><p>${s.short}</p><em>More details ${ARROW}</em></div></a>`).join("")}</div>
</div></section>`, `.mc-co{padding:104px 0}
.mc-co-h{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:end;margin-bottom:44px}
.mc-co-g{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:300px;gap:18px}
.mc-cc{position:relative;border-radius:22px;overflow:hidden;color:#fff;text-decoration:none;display:block}
.mc-cc-0{grid-column:span 2;grid-row:span 2}.mc-cc-5{grid-column:span 4;height:260px}
.mc-cc img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.mc-cc:hover img{transform:scale(1.06)}
.mc-cc::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(22,38,63,.96) 0%,rgba(22,38,63,.55) 50%,rgba(22,38,63,0) 100%)}
.mc-cc-b{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:24px}
.mc-cc-b span{font-family:${H};font-weight:800;color:${LIME};font-size:.85rem;letter-spacing:.1em}
.mc-cc-b h3{font-family:${H};font-weight:800;font-size:1.2rem;line-height:1.2;margin:6px 0 0}
.mc-cc-b p{color:#C9D4E2;font-size:.93rem;line-height:1.55;margin-top:8px;display:none}
.mc-cc-0 .mc-cc-b h3{font-size:1.9rem}.mc-cc-0 .mc-cc-b p,.mc-cc-5 .mc-cc-b p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.mc-cc-b em{font-style:normal;font-weight:700;color:${LIME};display:inline-flex;gap:8px;align-items:center;margin-top:12px;font-size:.9rem}
.mc-cc-5 .mc-cc-b{max-width:40rem}
@media(max-width:1000px){.mc-co-g{grid-template-columns:1fr 1fr}.mc-cc-0{grid-row:auto}.mc-cc-5{grid-column:span 2;height:auto}.mc-co-h{grid-template-columns:1fr;gap:12px}}
@media(max-width:600px){.mc-co-g{grid-template-columns:1fr;grid-auto-rows:280px}.mc-cc-0,.mc-cc-5{grid-column:auto}.mc-co{padding:64px 0}.mc-cc-b p{display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}`, bg);
}

const TOILET_STEPS = [
  ["Hacking & Removal", "We carefully hack and remove existing floor and wall tiles, finishes, sanitary fittings, and other affected materials as required. All debris is properly cleared and disposed of, while reasonable care is taken to minimise dust, noise, and disruption."],
  ["Waterproofing", "We properly prepare the required floor and wall areas and apply a suitable waterproofing system before commencing tiling works. Where required, a water ponding test will be carried out before tile installation."],
  ["Wall & Floor Tiling", "We install new wall and floor tiles with proper setting-out, alignment, levelling, cutting, and finishing. For floor tiles, the correct gradient is formed towards the floor traps to allow proper drainage."],
  ["Grouting & Finishing", "Suitable grout is applied neatly to the tile joints to provide a clean and durable finish. Necessary touch-up and cleaning works are carried out after completion."],
  ["Plumbing Works", "Installation, replacement, or modification of water supply pipes, drainage pipes, taps, shower fittings, floor traps, flushing systems, and other sanitary connections. All connections are checked and tested for proper operation and water leakage."],
  ["Sanitary Fittings & Final Installation", "We can install or reinstall toilet bowls, wash basins, vanity cabinets, mirrors, shower fittings, toilet accessories, lighting, and other fixtures as required. Before handover, we carry out a final inspection and clean the work area."],
];

function toiletSpotlight() {
  return html("toil", `<section class="mc-ts"><div class="mc-wrap mc-ts-g">
  <div class="mc-ts-art"><img src="${P(78)}" alt="Retiled shower area with new floor trap"/><img src="${P(66)}" alt="Waterproofing applied before tiling"/><img src="${P(12)}" alt="Finished vanity and basin"/></div>
  <div>
    <p class="mc-eyebrow">Featured · Toilet Renovation</p>
    <h2 class="mc-h2">Hacking, waterproofing, tiling &amp; plumbing — properly managed by one team.</h2>
    <p class="mc-lede">An old, leaking, or worn-out toilet can affect the comfort and condition of your entire home. We renovate toilets and bathrooms for condominiums, landed homes, and other private residential properties across Singapore, so you do not need to coordinate with multiple contractors.</p>
    <ol>${TOILET_STEPS.map(([t], i) => `<li><span>${i + 1}</span>${t}</li>`).join("")}</ol>
    <div class="mc-ts-cta"><a class="mc-btn mc-btn-b" href="${svcUrl(TOILET)}">See the full process ${ARROW}</a><a class="mc-btn mc-btn-d" href="${waText("Hello MACNEL, I would like a quotation for toilet renovation.")}">${ICO.wa} Get a quote</a></div>
  </div>
</div></section>`, `${BTN_CSS}.mc-ts{padding:104px 0}
.mc-ts-g{display:grid;grid-template-columns:1fr 1.05fr;gap:64px;align-items:center}
.mc-ts-art{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:260px 260px;gap:14px}
.mc-ts-art img{width:100%;height:100%;object-fit:cover;border-radius:18px;display:block}
.mc-ts-art img:first-child{grid-row:span 2}
.mc-ts .mc-h2{margin-bottom:16px}
.mc-ts ol{list-style:none;padding:0;margin:26px 0 30px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mc-ts li{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid ${LINE};border-radius:14px;padding:12px 14px;font-weight:600;color:${INK};font-size:.95rem}
.mc-ts li span{flex:none;width:30px;height:30px;border-radius:50%;background:${NAVY};color:${LIME};display:grid;place-items:center;font-family:${H};font-weight:800;font-size:.85rem}
.mc-ts-cta{display:flex;flex-wrap:wrap;gap:12px}
@media(max-width:960px){.mc-ts-g{grid-template-columns:1fr;gap:40px}.mc-ts{padding:64px 0}}
@media(max-width:560px){.mc-ts ol{grid-template-columns:1fr}.mc-ts-art{grid-template-rows:180px 180px}}`, MIST);
}

function otherGrid(bg = PAPER, linkToAnchors = true) {
  return html("oth", `<section class="mc-ot" id="other-services"><div class="mc-wrap">
  <div class="mc-ot-h"><p class="mc-eyebrow">One call, every trade</p><h2 class="mc-h2">Our Other Services</h2><p class="mc-lede">From partitions and plumbing to solar, decking and metal works, the same team that renovates your home can handle the rest.</p></div>
  <div class="mc-ot-g">${OTHER.map((o) => `<a class="mc-oc" href="${linkToAnchors ? `/services#${o.id}` : waText(`Hello MACNEL, I would like a quotation for ${o.title}.`)}"><img src="${o.img}" alt="${o.title}" loading="lazy"/><div><h3>${o.title}</h3><p>${o.short}</p></div></a>`).join("")}</div>
</div></section>`, `.mc-ot{padding:104px 0}
.mc-ot-h{max-width:46rem;margin:0 auto 44px;text-align:center}.mc-ot-h .mc-eyebrow{justify-content:center}.mc-ot-h .mc-h2{margin-bottom:12px}
.mc-ot-g{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.mc-oc{display:flex;flex-direction:column;background:#fff;border:1px solid ${LINE};border-radius:18px;overflow:hidden;text-decoration:none}
.mc-oc:hover{border-color:${GREEN};box-shadow:0 24px 44px -28px rgba(22,38,63,.45);transform:translateY(-3px)}
.mc-oc img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
.mc-oc div{padding:18px}
.mc-oc h3{font-family:${H};font-weight:700;font-size:1.02rem;color:${INK};margin-bottom:6px}
.mc-oc p{color:${BODY};font-size:.9rem;line-height:1.55}
@media(max-width:1000px){.mc-ot-g{grid-template-columns:repeat(3,1fr)}}
@media(max-width:760px){.mc-ot-g{grid-template-columns:1fr 1fr}.mc-ot{padding:64px 0}}
@media(max-width:480px){.mc-ot-g{grid-template-columns:1fr}}`, bg);
}

const VALUES = [
  ["Trust", "We build long-term relationships with our clients by delivering honest, transparent, and dependable service every time."],
  ["Quality", "From materials to workmanship, we maintain the highest standards to ensure durable and flawless results."],
  ["Reliability", "On-time delivery and consistent performance — you can count on us to get the job done right."],
  ["Professionalism", "Our skilled team combines expertise with respect and dedication, ensuring a smooth and stress-free experience."],
];
const VAL_ICONS = [
  `<path d="M11 17l-1.5 1.5a2.1 2.1 0 0 1-3-3L11 11m2 2 1.5-1.5a2.1 2.1 0 0 0-3-3L7 13"/><path d="m2 12 4-4 4 1 4-4 6 6-4 4"/>`,
  `<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>`,
  `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  `<path d="M2 20v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><circle cx="9" cy="6" r="4"/><path d="M19 8v6m3-3h-6"/>`,
];

function whyValues(bg = NAVY) {
  return html("why", `<section class="mc-wy"><img src="${P(93)}" alt="" aria-hidden="true"/><div class="mc-wrap mc-wy-g">
  <div class="mc-wy-l"><p class="mc-eyebrow">Why choose us</p><h2 class="mc-h2">Your trusted partner in building, renovating and transforming spaces.</h2>
    <p class="mc-lede">We are more than just a construction company. Our mission is simple: to deliver reliable, affordable, and high-quality solutions that exceed client expectations.</p>
    <ul>${["Comprehensive range of services under one roof", "Strong focus on customer satisfaction and tailored solutions", "Commitment to safety, efficiency, and sustainability", "Residential and commercial projects"].map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul>
  </div>
  <div class="mc-wy-g2">${VALUES.map(([t, d], i) => `<div><span><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${VAL_ICONS[i]}</svg></span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `${BTN_CSS}.mc-wy{position:relative;padding:104px 0;overflow:hidden}
.mc-wy>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.1}
.mc-wy-g{position:relative;display:grid;grid-template-columns:1fr 1.15fr;gap:56px;align-items:center}
.mc-wy .mc-h2{color:#fff;margin-bottom:16px}.mc-wy .mc-eyebrow{color:${LIME}}.mc-wy .mc-lede{color:#C0CCDA}
.mc-wy ul{list-style:none;padding:0;margin:26px 0 0;display:grid;gap:12px}
.mc-wy li{display:flex;gap:10px;align-items:center;color:#E3E9F1;font-weight:600}
.mc-wy li svg{flex:none;color:${NAVY};background:${LIME};border-radius:50%;padding:3px;width:22px;height:22px}
.mc-wy-g2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.mc-wy-g2 div{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:26px}
.mc-wy-g2 div:nth-child(2),.mc-wy-g2 div:nth-child(4){transform:translateY(28px)}
.mc-wy-g2 div:hover{border-color:${LIME};background:rgba(255,255,255,.09)}
.mc-wy-g2 span{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,${BLUE},${GREEN});color:#fff}
.mc-wy-g2 h3{font-family:${H};font-weight:800;font-size:1.2rem;color:#fff;margin:16px 0 8px}
.mc-wy-g2 p{color:#B7C4D4;line-height:1.6;font-size:.94rem}
@media(max-width:960px){.mc-wy-g{grid-template-columns:1fr;gap:40px}.mc-wy{padding:64px 0}.mc-wy-g2 div{transform:none!important}}
@media(max-width:560px){.mc-wy-g2{grid-template-columns:1fr}}`, bg);
}

function projectWall(bg = PAPER) {
  const pics = [P(63), P(13), P(29), P(83), P(30), P(22), P(15), P(90), P(17), P(53)];
  return html("wall", `<section class="mc-pw"><div class="mc-wrap">
  <div class="mc-pw-h"><div><p class="mc-eyebrow">From our sites</p><h2 class="mc-h2">Recent work across Singapore</h2></div><a class="mc-btn mc-btn-d" href="/project-gallery">View project gallery ${ARROW}</a></div>
  <div class="mc-pw-g">${pics.map((u, i) => `<a href="/project-gallery" class="p${i}"><img src="${u}" alt="MACNEL Construction project photo" loading="lazy"/></a>`).join("")}</div>
</div></section>`, `${BTN_CSS}.mc-pw{padding:104px 0}
.mc-pw-h{display:flex;justify-content:space-between;align-items:end;gap:24px;flex-wrap:wrap;margin-bottom:36px}
.mc-pw-g{display:grid;grid-template-columns:repeat(5,1fr);grid-auto-rows:190px;gap:12px}
.mc-pw-g a{display:block;border-radius:16px;overflow:hidden}
.mc-pw-g img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .7s}
.mc-pw-g a:hover img{transform:scale(1.07)}
.mc-pw-g .p0{grid-column:span 2;grid-row:span 2}.mc-pw-g .p3{grid-row:span 2}.mc-pw-g .p6{grid-row:span 2}
@media(max-width:900px){.mc-pw-g{grid-template-columns:repeat(3,1fr);grid-auto-rows:160px}.mc-pw-g .p9{display:none}.mc-pw{padding:64px 0}}
@media(max-width:560px){.mc-pw-g{grid-template-columns:1fr 1fr}.mc-pw-g .p0{grid-column:span 2}}`, bg);
}

// Real Google reviews shown on the old site. Dropped: one negative review, two that name a
// different company ("Joydom"), and one with no usable text.
const REVIEWS = [
  ["Charlotte Yung", "Ibrahim restored my door just days before CNY. He was meticulous in sanding the wood and filling in the scratches. Now my door looks brand new. Very pleased with the work!"],
  ["Ng Jia Jun", "Thank you Safiq and his team for helping to fix my bathroom wall tiles. Nicely done within 1 and half days."],
  ["Richard Chong", "Komal & Rafiq are effective and efficient workers. Did a neat and clean job fixing the door. Will find them again. Major thanks to them!"],
  ["Melva Yue", "Miah Alam done painting works on the door frame and doors. Job well done, and complete with great care. Thanks."],
  ["Zainuddin Dean", "Good workmanship and fast jobs. Haque MD Injamul and Hridoy."],
];
function reviews(bg = MIST) {
  return html("rev", `<section class="mc-rv"><div class="mc-wrap">
  <div class="mc-rv-h"><p class="mc-eyebrow">Client reviews</p><h2 class="mc-h2">What our clients say</h2></div>
  <div class="mc-rv-g">${REVIEWS.map(([n, t], i) => `<figure class="r${i}"><div class="st">${STAR.repeat(5)}</div><blockquote>“${t}”</blockquote><figcaption><span>${n.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>${n}<small>Google review</small></figcaption></figure>`).join("")}</div>
</div></section>`, `.mc-rv{padding:104px 0}
.mc-rv-h{text-align:center;margin-bottom:44px}.mc-rv-h .mc-eyebrow{justify-content:center}
.mc-rv-g{display:grid;grid-template-columns:repeat(6,1fr);gap:18px}
.mc-rv figure{grid-column:span 2;margin:0;background:#fff;border:1px solid ${LINE};border-radius:20px;padding:28px;display:flex;flex-direction:column}
.mc-rv .r3{grid-column:2/span 2}.mc-rv .r4{grid-column:4/span 2}
.mc-rv .st{color:#F5B301;display:flex;gap:2px}
.mc-rv blockquote{margin:14px 0 20px;color:${INK};line-height:1.65;font-size:1rem;flex:1}
.mc-rv figcaption{display:flex;align-items:center;gap:12px;font-family:${H};font-weight:700;color:${INK};flex-wrap:wrap}
.mc-rv figcaption span{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,${BLUE},${GREEN});color:#fff;display:grid;place-items:center;font-size:.85rem}
.mc-rv figcaption small{font-family:Inter,sans-serif;font-weight:500;color:${BODY};font-size:.8rem;width:100%;padding-left:52px;margin-top:-10px}
@media(max-width:960px){.mc-rv-g{grid-template-columns:1fr 1fr}.mc-rv figure,.mc-rv .r3,.mc-rv .r4{grid-column:auto}.mc-rv{padding:64px 0}}
@media(max-width:600px){.mc-rv-g{grid-template-columns:1fr}}`, bg);
}

function bookingForm(bg = PAPER, title = "Book Your Service Today", preset) {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title, subtitle: "Fill out the form below and our team will get back to you shortly. For the fastest reply, message us on WhatsApp.",
      layout: "split", showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: `${PHONE_DISPLAY} / ${PHONE2_DISPLAY}`, email: EMAIL, address: ADDRESS, recipientEmail: EMAIL,
      fields: [
        { id: "f-name", label: "Name", type: "text", required: true },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "f-email", label: "Email Address", type: "email", required: false },
        { id: "f-addr", label: "Street Address", type: "text", required: false },
        { id: "f-svc", label: "Select Your Service", type: "select", required: false, options: [...ALL_SERVICE_NAMES, "Other"], ...(preset ? { defaultValue: preset } : {}) },
        { id: "f-msg", label: "Your Message", type: "textarea", required: false },
      ],
      submitLabel: "Book Now", successMessage: "Thank you. Our team will get back to you shortly. For a faster reply, message us on WhatsApp.",
    },
  };
}

function ctaPhoto(title = "Ready to start your project? Let's build together.", text = "Send us a WhatsApp message with a few photos of the space. We can arrange a site visit, discuss your requirements, and provide a quotation.", img = P(29)) {
  return html("cta", `<section class="mc-ct"><img src="${img}" alt="" aria-hidden="true"/><div class="mc-wrap mc-ct-in">
  <h2>${title}</h2><p>${text}</p>
  <div class="mc-ct-a"><a class="mc-btn mc-btn-g" href="${WA}">${ICO.wa} WhatsApp ${PHONE_DISPLAY}</a><a class="mc-btn mc-btn-o" href="tel:${PHONE2}">${ICO.phone} Call ${PHONE2_DISPLAY}</a></div>
</div></section>`, `${BTN_CSS}.mc-ct{position:relative;padding:110px 0;overflow:hidden;text-align:center}
.mc-ct>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mc-ct::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(120deg,rgba(22,38,63,.94),rgba(44,107,166,.82) 60%,rgba(78,154,60,.78))}
.mc-ct-in{position:relative;z-index:2;max-width:52rem}
.mc-ct h2{font-family:${H};font-weight:800;font-size:clamp(1.9rem,3.6vw,2.9rem);line-height:1.12;color:#fff}
.mc-ct p{color:#DCE5EF;line-height:1.7;margin:16px auto 0;max-width:40rem;font-size:1.06rem}
.mc-ct-a{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:30px}
@media(max-width:600px){.mc-ct{padding:72px 0}}`, NAVY);
}

// ─── inner page sections ────────────────────────────────────────────────────
function innerHero({ crumbs, title, description, img, kicker }) {
  return html("ihero", `<section class="mc-ih"><img src="${img}" alt="" aria-hidden="true"/><div class="mc-wrap mc-ih-c">
  <nav class="mc-crumb"><a href="/">Home</a>${crumbs.map(([l, u]) => u ? ` <i>/</i> <a href="${u}">${l}</a>` : ` <i>/</i> <span>${l}</span>`).join("")}</nav>
  ${kicker ? `<p class="mc-ih-k">${kicker}</p>` : ""}<h1>${title}</h1><p class="mc-ih-p">${description}</p>
  <div class="mc-ih-cta"><a class="mc-btn mc-btn-g" href="${WA}">${ICO.wa} Free Quotation</a><a class="mc-btn mc-btn-o" href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a></div>
</div></section>`, `${BTN_CSS}
.mc-ih{position:relative;padding:110px 0 96px;overflow:hidden}
.mc-ih>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mc-ih::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(22,38,63,.96) 0%,rgba(22,38,63,.82) 50%,rgba(22,38,63,.35) 100%)}
.mc-ih::after{content:"";position:absolute;left:0;right:0;bottom:0;height:5px;z-index:2;background:linear-gradient(90deg,${BLUE},${GREEN})}
.mc-ih-c{position:relative;z-index:2}
.mc-crumb{font-size:.88rem;color:#A9B7C9;margin-bottom:18px}.mc-crumb a{color:#A9B7C9;text-decoration:none}.mc-crumb a:hover{color:#fff}.mc-crumb span{color:${LIME};font-weight:600}.mc-crumb i{font-style:normal;margin:0 6px;opacity:.6}
.mc-ih-k{color:${LIME};font-weight:700;font-size:.82rem;letter-spacing:.16em;text-transform:uppercase;margin-bottom:12px}
.mc-ih h1{font-family:${H};font-weight:800;font-size:clamp(2.1rem,4.4vw,3.5rem);line-height:1.08;color:#fff;max-width:46rem;letter-spacing:-.02em}
.mc-ih-p{color:#D3DCE7;font-size:1.1rem;line-height:1.6;max-width:38rem;margin-top:16px}
.mc-ih-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
@media(max-width:700px){.mc-ih{padding:72px 0 64px}}`, NAVY);
}

function svcOverview(s) {
  return html("ovw", `<section class="mc-ov"><div class="mc-wrap mc-ov-g">
  <div><p class="mc-eyebrow">${s.title}</p><h2 class="mc-h2">${s.tagline}</h2>${s.intro.map((p) => `<p class="mc-lede">${p}</p>`).join("")}
    <div class="mc-ov-ben"><h3>Client Benefits</h3><ul>${s.benefits.map((b) => `<li>${CHECK}${b}</li>`).join("")}</ul></div></div>
  <aside class="mc-ov-card"><img src="${s.photo}" alt="${s.title} by MACNEL Construction"/><div><strong>Get a free quotation</strong><p>Send your requirements and a few photos on WhatsApp. We can arrange a site visit and give you a clear quote.</p><a class="mc-btn mc-btn-g" href="${waText(`Hello MACNEL, I would like a quotation for ${s.title}.`)}">${ICO.wa} Ask on WhatsApp</a><a class="mc-ov-tel" href="tel:${PHONE2}">${ICO.phone} or call ${PHONE2_DISPLAY}</a></div></aside>
</div></section>`, `${BTN_CSS}.mc-ov{padding:96px 0}
.mc-ov-g{display:grid;grid-template-columns:1.3fr 1fr;gap:56px;align-items:start}
.mc-ov .mc-h2{margin-bottom:18px}.mc-ov .mc-lede+.mc-lede{margin-top:14px}
.mc-ov-ben{margin-top:30px;background:${MIST};border-radius:18px;padding:24px 26px;border-left:4px solid ${GREEN}}
.mc-ov-ben h3{font-family:${H};font-weight:800;color:${INK};font-size:1.1rem;margin-bottom:12px}
.mc-ov-ben ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}
.mc-ov-ben li{display:flex;gap:10px;color:${INK};font-weight:500;line-height:1.45}
.mc-ov-ben li svg{flex:none;color:${GREEN};margin-top:2px}
.mc-ov-card{background:#fff;border:1px solid ${LINE};border-radius:22px;overflow:hidden;box-shadow:0 30px 60px -35px rgba(22,38,63,.45);position:sticky;top:110px}
.mc-ov-card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}.mc-ov-card div{padding:24px;border-top:4px solid ${GREEN}}
.mc-ov-card strong{font-family:${H};font-weight:800;font-size:1.25rem;color:${INK}}.mc-ov-card p{color:${BODY};margin:8px 0 18px;line-height:1.55}
.mc-ov-tel{display:flex;align-items:center;gap:8px;margin-top:14px;color:${BLUE};font-weight:600;text-decoration:none}
@media(max-width:900px){.mc-ov-g{grid-template-columns:1fr}.mc-ov-card{position:static}.mc-ov{padding:64px 0}}
@media(max-width:560px){.mc-ov-ben ul{grid-template-columns:1fr}}`);
}

function svcOffer(s, bg = MIST) {
  return html("offer", `<section class="mc-of"><div class="mc-wrap">
  <div class="mc-of-h"><p class="mc-eyebrow">What we offer</p><h2 class="mc-h2">${s.nav} services</h2></div>
  <div class="mc-of-g n${s.offer.length}">${s.offer.map(([t, img, items], i) => `<article><img src="${img}" alt="${t}" loading="lazy"/><div><span>${NUM(i)}</span><h3>${t}</h3><ul>${items.map((x) => `<li>${CHECK}${x}</li>`).join("")}</ul></div></article>`).join("")}</div>
</div></section>`, `.mc-of{padding:96px 0}.mc-of-h{margin-bottom:36px}
.mc-of-g{display:grid;grid-template-columns:repeat(2,1fr);gap:20px}
.mc-of-g.n3{grid-template-columns:repeat(3,1fr)}
.mc-of-g.n5 article:last-child{grid-column:span 2;flex-direction:row}.mc-of-g.n5 article:last-child img{width:48%;aspect-ratio:auto}
.mc-of article{display:flex;flex-direction:column;background:#fff;border:1px solid ${LINE};border-radius:20px;overflow:hidden}
.mc-of article:hover{border-color:${BLUE};box-shadow:0 24px 44px -30px rgba(22,38,63,.5)}
.mc-of img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}
.mc-of article>div{padding:24px;flex:1}
.mc-of span{font-family:${H};font-weight:800;color:${GREEN};font-size:.85rem;letter-spacing:.1em}
.mc-of h3{font-family:${H};font-weight:800;font-size:1.2rem;color:${INK};margin:4px 0 14px}
.mc-of ul{list-style:none;padding:0;margin:0;display:grid;gap:9px}
.mc-of li{display:flex;gap:10px;color:${BODY};line-height:1.5}.mc-of li svg{flex:none;color:${GREEN};margin-top:2px}
@media(max-width:900px){.mc-of-g,.mc-of-g.n3{grid-template-columns:1fr}.mc-of-g.n5 article:last-child{grid-column:auto;flex-direction:column}.mc-of-g.n5 article:last-child img{width:100%;aspect-ratio:16/9}.mc-of{padding:64px 0}}`, bg);
}

function svcWhy(s, bg = PAPER) {
  return html("swhy", `<section class="mc-sw"><div class="mc-wrap mc-sw-g">
  <div><p class="mc-eyebrow">Why choose us</p><h2 class="mc-h2">Why choose MACNEL for ${s.nav.toLowerCase()}?</h2></div>
  <div class="mc-sw-l">${s.why.map(([t, d], i) => `<div><span>${NUM(i)}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `.mc-sw{padding:96px 0}
.mc-sw-g{display:grid;grid-template-columns:.8fr 1.2fr;gap:56px;align-items:start}
.mc-sw-l{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid ${LINE}}
.mc-sw-l div{padding:26px 22px 26px 0;border-bottom:1px solid ${LINE}}
.mc-sw-l div:nth-child(odd){border-right:1px solid ${LINE}}.mc-sw-l div:nth-child(even){padding-left:22px}
.mc-sw-l span{font-family:${H};font-weight:800;color:${BLUE};font-size:.9rem}
.mc-sw-l h3{font-family:${H};font-weight:800;color:${INK};font-size:1.15rem;margin:6px 0}
.mc-sw-l p{color:${BODY};line-height:1.55}
@media(max-width:860px){.mc-sw-g{grid-template-columns:1fr;gap:28px}.mc-sw{padding:64px 0}}
@media(max-width:520px){.mc-sw-l{grid-template-columns:1fr}.mc-sw-l div{border-right:0!important;padding-left:0!important}}`, bg);
}

function photoGallery(pics, title, subtitle, bg = PAPER, variant = "masonry") {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg), templateVariant: variant,
    data: {
      title, subtitle, layout: variant === "masonry" ? "masonry" : "grid", columns: 4, gap: "md", lightbox: true,
      images: pics.map((url) => ({ id: uid("gi"), url, alt: "MACNEL Construction project", caption: "" })),
    },
  };
}

function relatedCore(cur, bg = MIST) {
  const list = [...CORE, TOILET].filter((x) => x.slug !== cur.slug);
  return html("rel", `<section class="mc-rl"><div class="mc-wrap">
  <div class="mc-rl-h"><h2 class="mc-h2">Other core services</h2><a href="/services">All 18 services ${ARROW}</a></div>
  <div class="mc-rl-g">${list.map((x) => `<a href="${svcUrl(x)}"><img src="${x.img}" alt="${x.title}" loading="lazy"/><span>${x.title}</span></a>`).join("")}</div>
</div></section>`, `.mc-rl{padding:88px 0}
.mc-rl-h{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:28px;flex-wrap:wrap}
.mc-rl-h a{color:${BLUE};font-weight:700;text-decoration:none;display:inline-flex;gap:8px;align-items:center}
.mc-rl-g{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.mc-rl-g a{position:relative;display:block;border-radius:16px;overflow:hidden;aspect-ratio:3/4;color:#fff;text-decoration:none}
.mc-rl-g img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s}
.mc-rl-g a:hover img{transform:scale(1.06)}
.mc-rl-g a::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(22,38,63,.92),rgba(22,38,63,0) 60%)}
.mc-rl-g span{position:absolute;left:16px;right:16px;bottom:16px;z-index:1;font-family:${H};font-weight:800;line-height:1.25}
@media(max-width:900px){.mc-rl-g{grid-template-columns:repeat(3,1fr)}.mc-rl{padding:64px 0}}
@media(max-width:560px){.mc-rl-g{grid-template-columns:1fr 1fr}}`, bg);
}

// ─── toilet renovation page ─────────────────────────────────────────────────
function toiletIntro() {
  return html("tin", `<section class="mc-ti"><div class="mc-wrap mc-ti-g">
  <div><p class="mc-eyebrow">One team, start to finish</p><h2 class="mc-h2">No need to coordinate multiple contractors.</h2>
    <p class="mc-lede">An old, leaking, or worn-out toilet can affect the comfort and condition of your entire home. At MACNEL Construction Pte. Ltd., we provide professional toilet and bathroom renovation services for <strong>condominiums, landed homes, and other private residential properties across Singapore</strong>.</p>
    <p class="mc-lede">Our team manages the entire renovation process, from hacking and waterproofing to tiling, plumbing, electrical works, and final installation.</p></div>
  <div class="mc-ti-art"><img src="${P(58)}" alt="Toilet stripped and prepared for waterproofing"/><img src="${P(80)}" alt="Finished toilet with new tiles and fittings"/><em>Before</em><em>After</em></div>
</div></section>`, `.mc-ti{padding:96px 0}
.mc-ti-g{display:grid;grid-template-columns:1.1fr 1fr;gap:56px;align-items:center}
.mc-ti .mc-h2{margin-bottom:16px}.mc-ti .mc-lede+.mc-lede{margin-top:14px}.mc-ti strong{color:${INK}}
.mc-ti-art{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.mc-ti-art img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:18px;display:block}
.mc-ti-art em{position:absolute;top:14px;font-style:normal;font-weight:700;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;background:rgba(22,38,63,.85);color:#fff;padding:6px 12px;border-radius:999px}
.mc-ti-art em:nth-of-type(1){left:14px}.mc-ti-art em:nth-of-type(2){left:calc(50% + 20px);background:${GREEN}}
@media(max-width:900px){.mc-ti-g{grid-template-columns:1fr;gap:36px}.mc-ti{padding:64px 0}}`);
}

function toiletProcess() {
  return html("tpr", `<section class="mc-tp"><div class="mc-wrap">
  <div class="mc-tp-h"><p class="mc-eyebrow">Our toilet renovation process</p><h2 class="mc-h2">Six stages, done properly</h2>
  <p class="mc-lede">Waterproofing is one of the most important stages of any toilet renovation. Poor waterproofing can result in water leakage, damp walls, mould, and damage to surrounding areas or the unit below.</p></div>
  <ol class="mc-tp-l">${TOILET_STEPS.map(([t, d], i) => `<li><span>${NUM(i)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
</div></section>`, `.mc-tp{padding:96px 0}
.mc-tp-h{max-width:48rem;margin-bottom:40px}.mc-tp-h .mc-h2{color:#fff;margin-bottom:14px}.mc-tp .mc-eyebrow{color:${LIME}}.mc-tp .mc-lede{color:#BFCBDA}
.mc-tp-l{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;counter-reset:s}
.mc-tp-l li{position:relative;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:28px 26px}
.mc-tp-l li:hover{border-color:${LIME}}
.mc-tp-l span{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,${BLUE},${GREEN});color:#fff;font-family:${H};font-weight:800;font-size:1.05rem}
.mc-tp-l h3{font-family:${H};font-weight:800;color:#fff;font-size:1.18rem;margin:18px 0 8px}
.mc-tp-l p{color:#B7C4D4;line-height:1.65;font-size:.95rem}
@media(max-width:960px){.mc-tp-l{grid-template-columns:1fr 1fr}.mc-tp{padding:64px 0}}
@media(max-width:600px){.mc-tp-l{grid-template-columns:1fr}}`, NAVY);
}

const TOILET_CAN = ["Full toilet and bathroom renovation", "Hacking and replacement of wall and floor tiles", "Waterproofing works", "Floor and wall tiling", "Tile repair and regrouting", "Toilet bowl installation", "Wash basin and vanity installation", "Plumbing and flushing system works", "Floor trap and drainage works", "Shower fitting installation", "Electrical works for lighting and exhaust fans", "Sanitary fittings and toilet accessories installation", "Partial toilet renovation and repair works"];
function toiletScope() {
  return html("tsc", `<section class="mc-tc"><div class="mc-wrap mc-tc-g">
  <div><p class="mc-eyebrow">What we can do for your toilet</p><h2 class="mc-h2">Full renovation or just the part that needs fixing.</h2>
    <ul>${TOILET_CAN.map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul></div>
  <div class="mc-tc-p">
    <div><h3>Condominiums</h3><p>We carry out renovation works in accordance with the condominium management's applicable renovation requirements, approved working hours, and site regulations. Where required, we can assist with the necessary information for the management renovation application.</p></div>
    <div><h3>Landed Homes</h3><p>We provide toilet and bathroom renovation services for bungalows, semi-detached houses, terrace houses, and other landed properties, from a single bathroom renovation to multiple bathrooms within the same property.</p></div>
    <img src="${P(9)}" alt="Renovated bathroom with freestanding tub"/>
  </div>
</div></section>`, `.mc-tc{padding:96px 0}
.mc-tc-g{display:grid;grid-template-columns:1.1fr 1fr;gap:56px;align-items:start}
.mc-tc .mc-h2{margin-bottom:24px}
.mc-tc ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:10px 18px}
.mc-tc li{display:flex;gap:10px;color:${INK};font-weight:500;line-height:1.45}.mc-tc li svg{flex:none;color:${GREEN};margin-top:2px}
.mc-tc-p{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mc-tc-p div{background:#fff;border:1px solid ${LINE};border-radius:18px;padding:22px}
.mc-tc-p div:first-child{border-top:4px solid ${BLUE}}.mc-tc-p div:nth-child(2){border-top:4px solid ${GREEN}}
.mc-tc-p h3{font-family:${H};font-weight:800;color:${INK};font-size:1.1rem;margin-bottom:8px}
.mc-tc-p p{color:${BODY};font-size:.92rem;line-height:1.6}
.mc-tc-p img{grid-column:span 2;width:100%;height:260px;object-fit:cover;border-radius:18px;display:block}
@media(max-width:900px){.mc-tc-g{grid-template-columns:1fr}.mc-tc{padding:64px 0}}
@media(max-width:560px){.mc-tc ul,.mc-tc-p{grid-template-columns:1fr}.mc-tc-p img{grid-column:auto}}`, MIST);
}

function toiletWhy() {
  const items = [
    ["Clear Quotation", "We provide a clear scope of work and quotation before commencement so you understand what is included."],
    ["One Team", "Hacking, waterproofing, tiling, plumbing, electrical works, and installation can be coordinated under one company."],
    ["Quality Workmanship", "We focus on proper waterproofing, drainage gradients, tile alignment, neat finishing, and reliable installation."],
    ["Clean & Tidy Work", "We take reasonable precautions to protect surrounding areas and clear renovation debris upon completion."],
    ["Easy to Contact", "Contact us by WhatsApp or phone from Monday to Saturday, 9:00 AM to 6:00 PM."],
  ];
  return html("twy", `<section class="mc-tw"><div class="mc-wrap">
  <div class="mc-tw-h"><p class="mc-eyebrow">Why choose MACNEL Construction?</p><h2 class="mc-h2">Renovation without the runaround</h2></div>
  <div class="mc-tw-g">${items.map(([t, d], i) => `<div><span>${NUM(i)}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `.mc-tw{padding:96px 0}.mc-tw-h{text-align:center;margin-bottom:40px}.mc-tw-h .mc-eyebrow{justify-content:center}
.mc-tw-g{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
.mc-tw-g div{border:1px solid ${LINE};border-radius:18px;padding:24px;background:#fff}
.mc-tw-g div:hover{border-color:${GREEN};transform:translateY(-3px)}
.mc-tw-g span{font-family:${H};font-weight:800;color:${GREEN}}
.mc-tw-g h3{font-family:${H};font-weight:800;color:${INK};font-size:1.08rem;margin:8px 0}
.mc-tw-g p{color:${BODY};font-size:.92rem;line-height:1.6}
@media(max-width:1000px){.mc-tw-g{grid-template-columns:1fr 1fr}.mc-tw{padding:64px 0}}
@media(max-width:560px){.mc-tw-g{grid-template-columns:1fr}}`);
}

const TOILET_FAQ = [
  ["How long does a toilet renovation take?", "The duration depends on the toilet size, site conditions, selected materials, and scope of work. A complete hacking and retiling project will generally require approximately one to three weeks. A more accurate schedule will be provided after the site inspection and confirmation of the work scope."],
  ["Do I need approval to renovate my condominium toilet?", "Most condominiums require owners to submit a renovation application to the Management Corporation or managing agent before renovation begins. There may also be requirements regarding working hours, deposits, contractor registration, and renovation procedures. We can assist you with the necessary renovation information for submission."],
  ["Why is waterproofing important?", "Proper waterproofing helps prevent water from penetrating through the toilet floor and walls. This reduces the risk of leakage, dampness, mould, and damage to surrounding areas or the ceiling of the unit below."],
  ["Can I renovate only part of my toilet?", "Yes. A complete renovation is not always necessary. Depending on the existing condition, we can carry out selected works such as tile replacement, tile repair, regrouting, waterproofing repairs, plumbing works, or replacement of sanitary fittings."],
  ["How can I get a quotation?", "Send us a WhatsApp message or submit your details through our enquiry form. We can arrange a site visit to assess the existing condition, discuss your requirements, and provide a quotation."],
];
function faq(items, bg = MIST, title = "Frequently Asked Questions") {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg), templateVariant: "two-column-grid",
    data: { title, subtitle: "Still have a question? Message us on WhatsApp.", layout: "accordion", allowMultiple: false,
      items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })) },
  };
}

// ─── services / about / gallery / contact ───────────────────────────────────
function otherDetail(bg = PAPER) {
  return html("odet", `<section class="mc-od" id="other-services"><div class="mc-wrap">
  <div class="mc-od-h"><p class="mc-eyebrow">Our other services</p><h2 class="mc-h2">Twelve more trades, one dependable team</h2></div>
  <div class="mc-od-l">${OTHER.map((o, i) => `<article id="${o.id}"><img src="${o.img}" alt="${o.title}" loading="lazy"/><div><span>${String(i + 7).padStart(2, "0")}</span><h3>${o.title}</h3><p>${o.long}</p><a href="${waText(`Hello MACNEL, I would like a quotation for ${o.title}.`)}">${ICO.wa} Ask for a quote</a></div></article>`).join("")}</div>
</div></section>`, `.mc-od{padding:96px 0}.mc-od-h{margin-bottom:40px}
.mc-od-l{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.mc-od article{display:grid;grid-template-columns:200px 1fr;gap:0;background:#fff;border:1px solid ${LINE};border-radius:20px;overflow:hidden;scroll-margin-top:120px}
.mc-od article:target{border-color:${GREEN};box-shadow:0 0 0 3px rgba(78,154,60,.25)}
.mc-od img{width:100%;height:100%;object-fit:cover;display:block;min-height:220px}
.mc-od article>div{padding:22px 24px}
.mc-od span{font-family:${H};font-weight:800;color:${GREEN};font-size:.82rem;letter-spacing:.1em}
.mc-od h3{font-family:${H};font-weight:800;color:${INK};font-size:1.12rem;margin:4px 0 8px}
.mc-od p{color:${BODY};font-size:.92rem;line-height:1.62}
.mc-od a{display:inline-flex;gap:8px;align-items:center;margin-top:12px;color:${GREEN};font-weight:700;text-decoration:none;font-size:.9rem}
@media(max-width:960px){.mc-od-l{grid-template-columns:1fr}.mc-od{padding:64px 0}}
@media(max-width:560px){.mc-od article{grid-template-columns:1fr}.mc-od img{min-height:0;aspect-ratio:16/9}}`, bg);
}

function aboutStory() {
  return html("story", `<section class="mc-ab"><div class="mc-wrap mc-ab-g">
  <div class="mc-ab-art"><img src="${P(63)}" alt="Completed living room renovation"/><img src="${P(36)}" alt="MACNEL painter at work"/></div>
  <div><p class="mc-eyebrow">Who we are</p><h2 class="mc-h2">More than just a construction company.</h2>
  <p class="mc-lede">At MACNEL Construction Pte. Ltd, we are your trusted partner in building, renovating, and transforming spaces. Based in Singapore, we specialize in delivering high-quality construction and renovation services for both residential and commercial projects.</p>
  <p class="mc-lede">With a team of skilled professionals and years of industry experience, we combine craftsmanship, innovation, and dedication to create results that exceed expectations.</p>
  <div class="mc-ab-mv">
    <div><h3>Our Mission</h3><p>To provide reliable, affordable, and high-quality construction solutions that improve living and working environments, while maintaining trust and long-term relationships with our clients.</p></div>
    <div><h3>Our Vision</h3><p>To be recognized as one of Singapore's most dependable construction and renovation companies, known for professionalism, quality, and customer satisfaction.</p></div>
  </div></div>
</div></section>`, `.mc-ab{padding:104px 0}
.mc-ab-g{display:grid;grid-template-columns:1fr 1.1fr;gap:64px;align-items:center}
.mc-ab-art{position:relative;min-height:540px}
.mc-ab-art img{position:absolute;object-fit:cover;border-radius:22px;display:block}
.mc-ab-art img:first-child{left:0;top:0;width:78%;height:76%;box-shadow:0 40px 80px -40px rgba(22,38,63,.55)}
.mc-ab-art img:last-child{right:0;bottom:0;width:46%;height:56%;border:8px solid #fff;box-shadow:0 30px 60px -30px rgba(22,38,63,.55)}
.mc-ab .mc-h2{margin-bottom:18px}.mc-ab .mc-lede+.mc-lede{margin-top:12px}
.mc-ab-mv{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:28px}
.mc-ab-mv div{border-radius:18px;padding:22px}
.mc-ab-mv div:first-child{background:${NAVY}}.mc-ab-mv div:first-child h3{color:${LIME}}.mc-ab-mv div:first-child p{color:#C0CCDA}
.mc-ab-mv div:last-child{background:${MIST};border:1px solid ${LINE}}.mc-ab-mv div:last-child h3{color:${BLUE}}.mc-ab-mv div:last-child p{color:${BODY}}
.mc-ab-mv h3{font-family:${H};font-weight:800;font-size:1.15rem;margin-bottom:8px}.mc-ab-mv p{line-height:1.6;font-size:.94rem}
@media(max-width:960px){.mc-ab-g{grid-template-columns:1fr;gap:40px}.mc-ab-art{min-height:400px}.mc-ab{padding:64px 0}}
@media(max-width:560px){.mc-ab-mv{grid-template-columns:1fr}.mc-ab-art{min-height:320px}}`);
}

function contactCards(bg = PAPER) {
  const items = [
    ["WhatsApp", PHONE_DISPLAY, WA, ICO.wa],
    ["Call", `${PHONE_DISPLAY}<br/>${PHONE2_DISPLAY}`, `tel:${PHONE}`, ICO.phone],
    ["Email", EMAIL, `mailto:${EMAIL}`, ICO.mail],
    ["Office", "101 Kitchener Road, #02-13<br/>Jalan Besar Plaza, Singapore 208511", MAP_Q, ICO.pin],
    ["Office Hours", "Monday – Saturday<br/>9:00 AM – 6:00 PM", "", ICO.clock],
  ];
  return html("cc", `<section class="mc-cn"><div class="mc-wrap">
  <div class="mc-cn-h"><p class="mc-eyebrow">Contact MACNEL Construction</p><h2 class="mc-h2">Speak with our team</h2><p class="mc-lede">For renovation, construction, repair and maintenance enquiries in Singapore.</p></div>
  <div class="mc-cn-g">${items.map(([t, v, u, ic]) => `<${u ? `a href="${u}"${u.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}` : "div"} class="mc-cn-c"><span>${ic}</span><h3>${t}</h3><p>${v}</p></${u ? "a" : "div"}>`).join("")}</div>
</div></section>`, `.mc-cn{padding:96px 0 72px}.mc-cn-h{margin-bottom:36px;max-width:40rem}.mc-cn-h .mc-h2{margin-bottom:10px}
.mc-cn-g{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.mc-cn-c{display:block;background:#fff;border:1px solid ${LINE};border-radius:18px;padding:22px;text-decoration:none}
a.mc-cn-c:hover{border-color:${GREEN};transform:translateY(-3px);box-shadow:0 20px 40px -28px rgba(22,38,63,.5)}
.mc-cn-c span{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,${BLUE},${GREEN});color:#fff}
.mc-cn-c span svg{width:20px;height:20px}
.mc-cn-c h3{font-family:${H};font-weight:800;color:${INK};font-size:1.02rem;margin:14px 0 6px}
.mc-cn-c p{color:${BODY};font-size:.9rem;line-height:1.55;word-break:break-word}
@media(max-width:1000px){.mc-cn-g{grid-template-columns:1fr 1fr}.mc-cn{padding:64px 0 48px}}
@media(max-width:520px){.mc-cn-g{grid-template-columns:1fr}}`, bg);
}

const GALLERY_ALL = [13, 21, 28, 63, 30, 22, 15, 83, 27, 9, 65, 17, 5, 29, 23, 90, 12, 26, 16, 69, 78, 25, 105, 36, 14, 18, 91, 68, 3, 8, 6, 7, 2, 4, 80, 24, 47, 84, 104, 1, 103, 101, 85, 34, 32, 50, 92, 66, 58, 53, 56, 41, 44, 39, 11, 64, 10, 74, 95, 93, 94, 99, 102].map(P);

// ─── Native blocks (2026-10-08): every section below replaces a custom_html
// helper above with a native block + variant, so the client can edit it. ────
const block = (type, variant, data, o = {}) => ({ ...BASE, id: uid(type), type, ...(variant ? { templateVariant: variant } : {}), ...o, data });
const COLORS = { dark: NAVY, accent: LIME };
const TYPO = { titleSize: "6xl", titleColor: "#ffffff", subtitleColor: "#ffffff", descColor: "#ffffff" };
const bgImage = (imageUrl, overlay = NAVY, opacity = 0.78) => ({ type: "image", imageUrl, imageOverlay: overlay, imageOverlayOpacity: opacity });

function header() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full", padding: ZERO, margin: ZERO, background: bgColor(PAPER),
    data: {
      logoText: SITE_NAME, logo: LOGO, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: GREEN, ctaVariant: "solid", logoHeight: 50, logoCaption: "",
      showCta: true, ctaLabel: "Free Quotation", ctaUrl: WA,
      topBar: {
        show: true, showPhone: true, showWhatsapp: true, whatsappLabel: "WhatsApp",
        whatsappText: "Hello MACNEL, I would like a free quotation.", background: NAVY, textColor: "#BFCBDA",
        items: [
          { id: "tb1", text: "Jalan Besar Plaza, Singapore", icon: "pin", url: MAP_Q, side: "left" },
          { id: "tb2", text: "Mon – Sat, 9 AM – 6 PM", icon: "clock", side: "left", hideOnMobile: true },
          { id: "tb3", text: EMAIL, icon: "mail", url: `mailto:${EMAIL}`, side: "right", hideOnMobile: true },
        ],
      },
    },
  };
}

function heroHome() {
  return block("hero", "spec-card", {
    layout: "left", badge: "MACNEL Construction Pte. Ltd · Singapore",
    title: "Construction & renovation,", titleAccent: "handled by one team.",
    description: "Professional construction and renovation services tailored to your needs. From minor repairs to full-scale renovations, for homes and businesses across Singapore.",
    primaryButton: { label: "WhatsApp for a Free Quote", url: WA, variant: "primary" },
    secondaryButton: { label: "Explore Services", url: "/services", variant: "outline" },
    imageUrl: P(21), imageAlt: "Living room with cove-lit false ceiling", overlayOpacity: 0.4,
    specCard: {
      label: "Hacking to handover", title: "Waterproofing, tiling, plumbing, electrical",
      meters: [],
      stats: [{ id: "s1", value: "18", label: "services under one roof" }, { id: "s2", value: "Mon–Sat", label: "9:00 AM – 6:00 PM" }, { id: "s3", value: "Free", label: "site visit & quotation" }],
    },
    colors: COLORS, typography: TYPO,
  }, { padding: ZERO });
}

function coreBento(bg = PAPER, title = "Our Core Services") {
  return block("services", "bento", {
    eyebrow: "What we do best", title,
    subtitle: "Every project deserves the highest level of care and craftsmanship. Choose a service to see exactly what is included.",
    layout: "grid", columns: 4, cardStyle: "flat", source: "inline", colors: COLORS,
    items: [...CORE, TOILET].map((s) => ({ id: s.slug, title: s.title, description: s.short, icon: s.icon, iconType: "lucide", imageUrl: s.img, link: svcUrl(s), linkLabel: "More details" })),
  }, { background: bgColor(bg) });
}

function toiletSpotlight() {
  return block("features", "overview-quote", {
    eyebrow: "Featured · Toilet Renovation", title: "Hacking, waterproofing, tiling & plumbing — properly managed by one team.",
    description: "An old, leaking, or worn-out toilet can affect the comfort and condition of your entire home. We renovate toilets and bathrooms for condominiums, landed homes, and other private residential properties across Singapore, so you do not need to coordinate with multiple contractors.",
    tags: TOILET_STEPS.map(([t]) => t),
    layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
    card: {
      imageUrl: P(78), title: "See the full process",
      text: "Six stages from hacking to final installation, with waterproofing done properly before any tiling.",
      buttonLabel: "Get a quote on WhatsApp", whatsapp: true, whatsappText: "Hello MACNEL, I would like a quotation for toilet renovation.",
    },
  }, { background: bgColor(MIST) });
}

function otherGrid(bg = PAPER) {
  return block("services", "image-tiles", {
    eyebrow: "One call, every trade", title: "Our Other Services",
    subtitle: "From partitions and plumbing to solar, decking and metal works, the same team that renovates your home can handle the rest.",
    layout: "grid", columns: 4, cardStyle: "elevated", source: "inline",
    items: OTHER.map((o) => ({ id: o.id, title: o.title, description: o.short, icon: "Wrench", iconType: "lucide", imageUrl: o.img, link: "/services#other-services", linkLabel: "Details" })),
  }, { background: bgColor(bg) });
}

function whyValues() {
  return block("features", "numbered-grid", {
    eyebrow: "Why choose us", title: "Your trusted partner in building, renovating and transforming spaces.",
    description: "We are more than just a construction company. Our mission is simple: to deliver reliable, affordable, and high-quality solutions that exceed client expectations.",
    tone: "dark", layout: "grid", columns: 4, style: "minimal", colors: COLORS,
    items: VALUES.map(([title, description], i) => ({ id: `vl${i}`, title, description })),
  }, { padding: ZERO });
}

function projectWall(bg = PAPER) {
  return photoGallery([P(63), P(13), P(29), P(83), P(30), P(22), P(15), P(90), P(17)], "Recent work across Singapore", "From our sites", bg, "hero-mosaic");
}

function reviews(bg = MIST) {
  return block("testimonials", "quote-cards", {
    title: "What our clients say", subtitle: "Client reviews", layout: "grid",
    items: REVIEWS.map(([name, content], i) => ({ id: `rv${i}`, name, role: "Google review", company: "", content, rating: 5 })),
  }, { background: bgColor(bg) });
}

function ctaPhoto(title = "Ready to start your project? Let's build together.", text = "Send us a WhatsApp message with a few photos of the space. We can arrange a site visit, discuss your requirements, and provide a quotation.", img = P(29)) {
  return block("cta", "boutique-banner", {
    eyebrow: "Free quotation", title, description: text, layout: "centered", contentPosition: "center",
    primaryButton: { label: `WhatsApp ${PHONE_DISPLAY}`, url: WA }, secondaryButton: { label: `Call ${PHONE2_DISPLAY}`, url: `tel:${PHONE2}` },
  }, { background: bgImage(img), style: { minHeight: 45, verticalAlign: "center" } });
}

function innerHero({ title, description, img, kicker }) {
  return block("hero", "page-banner", {
    layout: "left", badge: kicker || SHORT, title, description, showBreadcrumb: true,
    primaryButton: { label: "Free Quotation", url: WA, variant: "primary" },
    secondaryButton: { label: PHONE_DISPLAY, url: `tel:${PHONE}`, variant: "outline" },
    imageUrl: img, overlayOpacity: 0.3, colors: COLORS, typography: TYPO,
  }, { padding: ZERO });
}

function svcOverview(s) {
  return block("features", "overview-quote", {
    eyebrow: s.title, title: s.tagline, description: s.intro.join("\n\n"), tags: s.benefits,
    layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
    card: {
      imageUrl: s.photo, title: "Get a free quotation",
      text: `Send your requirements and a few photos on WhatsApp. We can arrange a site visit and give you a clear quote. Or call ${PHONE2_DISPLAY}.`,
      buttonLabel: "Ask on WhatsApp", whatsapp: true, whatsappText: `Hello MACNEL, I would like a quotation for ${s.title}.`,
    },
  }, { background: bgColor(PAPER) });
}

function svcOffer(s, bg = MIST) {
  return block("services", "image-tiles", {
    eyebrow: "What we offer", title: `${s.nav} services`, subtitle: "",
    layout: "grid", columns: s.offer.length === 3 ? 3 : 2, cardStyle: "elevated", source: "inline",
    items: s.offer.map(([title, img, pts], i) => ({ id: `of${i}`, title, description: pts.join(" · "), icon: s.icon, iconType: "lucide", imageUrl: img, link: waText(`Hello MACNEL, I would like a quotation for ${title}.`), linkLabel: "Ask for a quote" })),
  }, { background: bgColor(bg) });
}

function svcWhy(s, bg = PAPER) {
  return block("features", "numbered-columns", {
    title: `Why choose MACNEL for ${s.nav.toLowerCase()}?`, subtitle: "Why choose us", layout: "grid", columns: 4, style: "minimal",
    items: s.why.map(([title, description], i) => ({ id: `sw${i}`, title, description })),
  }, { background: bgColor(bg) });
}

function relatedCore(cur, bg = MIST) {
  return block("services", "photo-cards", {
    title: "Other core services", subtitle: "", layout: "grid", columns: 4, cardStyle: "flat", source: "inline",
    viewAllLabel: "All 18 services", viewAllUrl: "/services",
    items: [...CORE, TOILET].filter((x) => x.slug !== cur.slug).map((x) => ({ id: x.slug, title: x.title, description: "", icon: x.icon, iconType: "lucide", imageUrl: x.img, link: svcUrl(x), linkLabel: "View" })),
  }, { background: bgColor(bg) });
}

function toiletIntro() {
  return block("features", "image-stats", {
    eyebrow: "One team, start to finish", title: "No need to coordinate multiple contractors.",
    description: "An old, leaking, or worn-out toilet can affect the comfort and condition of your entire home. At MACNEL Construction Pte. Ltd., we provide professional toilet and bathroom renovation services for condominiums, landed homes, and other private residential properties across Singapore.\n\nOur team manages the entire renovation process, from hacking and waterproofing to tiling, plumbing, electrical works, and final installation.",
    imageUrl: P(80), badge: { title: "6 stages", text: "hacking to handover" },
    layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
    buttons: [{ id: "b1", label: "Get a free quotation", url: waText("Hello MACNEL, I would like a quotation for toilet renovation."), style: "solid" }],
  }, { background: bgColor(PAPER) });
}

function toiletProcess() {
  return block("features", "numbered-grid", {
    eyebrow: "Our toilet renovation process", title: "Six stages, done properly",
    description: "Waterproofing is one of the most important stages of any toilet renovation. Poor waterproofing can result in water leakage, damp walls, mould, and damage to surrounding areas or the unit below.",
    tone: "dark", layout: "grid", columns: 3, style: "minimal", colors: COLORS,
    items: TOILET_STEPS.map(([title, description], i) => ({ id: `ts${i}`, title, description })),
  }, { padding: ZERO });
}

function toiletScope() {
  return [
    block("icon_grid", "outlined-cards", {
      title: "Full renovation or just the part that needs fixing.", subtitle: "What we can do for your toilet", columns: 3, iconSize: "sm",
      items: TOILET_CAN.map((label, i) => ({ id: `tc${i}`, icon: "Check", color: GREEN, label, description: "" })),
    }, { background: bgColor(MIST) }),
    block("features", "highlight-cards", {
      title: "Condominiums and landed homes", subtitle: "Where we work", layout: "grid", columns: 2, style: "cards",
      items: [
        { id: "cd1", icon: "Building2", title: "Condominiums", description: "We carry out renovation works in accordance with the condominium management's applicable renovation requirements, approved working hours, and site regulations. Where required, we can assist with the necessary information for the management renovation application." },
        { id: "cd2", icon: "House", title: "Landed Homes", description: "We provide toilet and bathroom renovation services for bungalows, semi-detached houses, terrace houses, and other landed properties, from a single bathroom renovation to multiple bathrooms within the same property." },
      ],
    }, { background: bgColor(PAPER) }),
  ];
}

function toiletWhy() {
  return block("features", "numbered-grid", {
    eyebrow: "Why choose MACNEL Construction?", title: "Renovation without the runaround", tone: "light",
    layout: "grid", columns: 3, style: "minimal", colors: COLORS,
    items: [
      ["Clear Quotation", "We provide a clear scope of work and quotation before commencement so you understand what is included."],
      ["One Team", "Hacking, waterproofing, tiling, plumbing, electrical works, and installation can be coordinated under one company."],
      ["Quality Workmanship", "We focus on proper waterproofing, drainage gradients, tile alignment, neat finishing, and reliable installation."],
      ["Clean & Tidy Work", "We take reasonable precautions to protect surrounding areas and clear renovation debris upon completion."],
      ["Easy to Contact", "Contact us by WhatsApp or phone from Monday to Saturday, 9:00 AM to 6:00 PM."],
    ].map(([title, description], i) => ({ id: `tw${i}`, title, description })),
  }, { background: bgColor(MIST) });
}

function otherDetail(bg = PAPER) {
  return block("features", "alternating-media", {
    title: "Twelve more trades, one dependable team", subtitle: "Our other services", layout: "alternating", columns: 2, style: "minimal",
    items: OTHER.map((o) => ({ id: o.id, title: o.title, description: o.long, imageUrl: o.img, link: waText(`Hello MACNEL, I would like a quotation for ${o.title}.`), linkLabel: "Ask for a quote" })),
  }, { background: bgColor(bg), anchor: "other-services" });
}

function aboutStory() {
  return [
    block("features", "image-stats", {
      eyebrow: "Who we are", title: "More than just a construction company.",
      description: "At MACNEL Construction Pte. Ltd, we are your trusted partner in building, renovating, and transforming spaces. Based in Singapore, we specialize in delivering high-quality construction and renovation services for both residential and commercial projects.\n\nWith a team of skilled professionals and years of industry experience, we combine craftsmanship, innovation, and dedication to create results that exceed expectations.",
      imageUrl: P(63), badge: { title: "18 services", text: "under one roof" },
      layout: "grid", columns: 2, style: "minimal", items: [], colors: COLORS,
      buttons: [{ id: "b1", label: "Free Quotation", url: WA, style: "solid" }, { id: "b2", label: "Our Services", url: "/services", style: "outline" }],
    }, { background: bgColor(PAPER) }),
    block("features", "highlight-cards", {
      title: "Mission & Vision", subtitle: "What drives us", layout: "grid", columns: 2, style: "cards",
      items: [
        { id: "mv1", icon: "Target", title: "Our Mission", description: "To provide reliable, affordable, and high-quality construction solutions that improve living and working environments, while maintaining trust and long-term relationships with our clients." },
        { id: "mv2", icon: "Eye", title: "Our Vision", description: "To be recognized as one of Singapore's most dependable construction and renovation companies, known for professionalism, quality, and customer satisfaction." },
      ],
    }, { background: bgColor(MIST) }),
  ];
}

function contactCards(bg = PAPER) {
  return block("icon_grid", "colored-tiles", {
    title: "Speak with our team", subtitle: "For renovation, construction, repair and maintenance enquiries in Singapore.", columns: 4, iconSize: "md",
    items: [
      ["MessageCircle", "WhatsApp", PHONE_DISPLAY, WA],
      ["Phone", "Call", `${PHONE_DISPLAY} / ${PHONE2_DISPLAY}`, `tel:${PHONE}`],
      ["Mail", "Email", EMAIL, `mailto:${EMAIL}`],
      ["MapPin", "Office", `${ADDRESS}. Mon – Sat, 9:00 AM – 6:00 PM`, MAP_Q],
    ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: BLUE, label, description, url })),
  }, { background: bgColor(bg) });
}

// ─── pages ──────────────────────────────────────────────────────────────────
const BUILDERS = {
  home: () => [heroHome(), coreBento(PAPER), toiletSpotlight(), otherGrid(PAPER), whyValues(), photoGallery([P(63), P(13), P(29), P(83), P(30), P(22), P(15), P(90), P(17), P(53), P(27), P(5)], "Recent work across Singapore", "Photos from our own sites. Click any photo to view it full size.", PAPER), reviews(MIST), bookingForm(PAPER), ctaPhoto()],
  services: () => [
    innerHero({ crumbs: [["Services"]], title: "Our All Services", description: "Eighteen construction, renovation and maintenance services for homes and businesses across Singapore, handled by one team.", img: P(83), kicker: "18 services · one team" }),
    coreBento(PAPER, "Core services"),
    otherDetail(MIST),
    ctaPhoto(),
  ],
  [TOILET.slug]: () => [
    innerHero({ crumbs: [["Services", "/services"], ["Toilet Renovation"]], title: "Toilet Renovation in Singapore", description: "Hacking, waterproofing, tiling & plumbing — properly managed by one team. For condominiums and landed homes.", img: P(13), kicker: "WhatsApp us for a free quotation" }),
    toiletIntro(),
    toiletProcess(),
    ...toiletScope(),
    toiletWhy(),
    photoGallery([P(5), P(12), P(14), P(78), P(83), P(80), P(31), P(15), P(66), P(81), P(6), P(7)], "Toilet & bathroom work", "Recent bathroom projects, from hacking and waterproofing to finished fittings", MIST),
    faq(TOILET_FAQ, PAPER),
    bookingForm(MIST, "Get a Free Quotation", "Toilet Renovation"),
  ],
  "project-gallery": () => [
    innerHero({ crumbs: [["Project Gallery"]], title: "Project Gallery", description: "Kitchens, bathrooms, ceilings, tiling, carpentry and more: work completed by the MACNEL team across Singapore.", img: P(28) }),
    photoGallery(GALLERY_ALL, "Our work", "Click any photo to view it full size", PAPER),
    ctaPhoto("Like what you see?", "Tell us about your space and we will arrange a site visit and a clear quotation.", P(63)),
  ],
  "about-us": () => [
    innerHero({ crumbs: [["About Us"]], title: "About MACNEL Construction", description: "Your trusted partner in building, renovating, and transforming spaces in Singapore.", img: P(21) }),
    ...aboutStory(),
    whyValues(),
    projectWall(PAPER),
    reviews(MIST),
    ctaPhoto(),
  ],
  "contact-us": () => [
    innerHero({ crumbs: [["Contact Us"]], title: "Contact Us", description: `WhatsApp or call ${PHONE_DISPLAY}, email ${EMAIL}, or visit us at Jalan Besar Plaza.`, img: P(65) }),
    contactCards(PAPER),
    bookingForm(MIST, "Send us a message"),
  ],
};
for (const s of CORE) {
  BUILDERS[s.slug] = () => [
    innerHero({ crumbs: [["Services", "/services"], [s.nav]], title: s.title, description: s.tagline, img: s.img }),
    svcOverview(s),
    svcOffer(s),
    svcWhy(s),
    photoGallery(s.gallery, "Image Gallery", `${s.title} by the MACNEL team`, MIST, "grid-clean"),
    relatedCore(s, PAPER),
    bookingForm(MIST, "Book Your Service Today", s.title),
  ];
}

const SEO = {
  home: ["MACNEL Construction Pte. Ltd | Renovation & Construction Singapore", "Professional construction and renovation services in Singapore: painting, tiling, false ceiling, electrical, carpentry, toilet renovation and more, handled by one team."],
  services: ["Construction & Renovation Services in Singapore", "18 services from MACNEL Construction: painting & plastering, tiling, false ceiling, electrical rewiring, carpentry, toilet renovation, plumbing, flooring, decking and more."],
  [TOILET.slug]: ["Toilet Renovation in Singapore | Hacking, Waterproofing, Tiling", "Toilet and bathroom renovation for condos and landed homes in Singapore. Hacking, waterproofing, tiling, plumbing and fittings, managed by one team. Free quotation."],
  "project-gallery": ["Project Gallery | MACNEL Construction Singapore", "Photos of kitchens, bathrooms, ceilings, tiling and carpentry completed by MACNEL Construction across Singapore."],
  "about-us": ["About MACNEL Construction Pte. Ltd", "A Singapore construction and renovation company for residential and commercial projects, built on trust, quality, reliability and professionalism."],
  "contact-us": ["Contact MACNEL Construction", `WhatsApp ${PHONE_DISPLAY}, email ${EMAIL}. 101 Kitchener Road, #02-13 Jalan Besar Plaza, Singapore 208511. Mon–Sat 9 AM–6 PM.`],
};
for (const s of CORE) SEO[s.slug] = [`${s.title} in Singapore | MACNEL Construction`, s.short.slice(0, 158)];

// ─── write ──────────────────────────────────────────────────────────────────
async function ensureTenant() {
  const { data: existing } = await sb.from("tenants").select("id, owner_id").eq("slug", SLUG).maybeSingle();
  if (!existing) throw new Error(`tenant ${SLUG} missing (expected the importer-created tenant)`);
  const id = existing.id;
  await sb.from("tenants").update({ name: SITE_NAME, plan: PLAN, status: "active", demo_expires_at: null }).eq("id", id);
  const { data: sub } = await sb.from("subscriptions").select("tenant_id").eq("tenant_id", id).maybeSingle();
  if (!sub) await sb.from("subscriptions").insert({ tenant_id: id, plan_id: PLAN, status: "active", billing_cycle: "yearly", payment_method: "manual", notes: "Existing client, imported + redesigned from WordPress macnelconsg.com 2026-10-06" });
  const { data: cd } = await sb.from("contact_details").select("id").eq("tenant_id", id).eq("is_primary", true).maybeSingle();
  if (!cd) await sb.from("contact_details").insert({ tenant_id: id, label: "Main", phone: PHONE, whatsapp: WA_NUMBER, email: EMAIL, address: ADDRESS, is_primary: true, floating_whatsapp: true, floating_call: true, sort_order: 0 });
  return id;
}

async function uploadAssets(tenantId) {
  const { data: existingMedia } = await sb.from("media").select("storage_path").eq("tenant_id", tenantId);
  const known = new Set((existingMedia ?? []).map((m) => m.storage_path));
  const files = fs.readdirSync(ASSET_DIR).filter((f) => /\.(jpg|png)$/.test(f));
  let n = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (files.length) {
      const file = files.shift();
      const buffer = fs.readFileSync(path.join(ASSET_DIR, file));
      const storagePath = `${STORAGE_DIR}/${file}`;
      const mime = file.endsWith(".png") ? "image/png" : "image/jpeg";
      const { error } = await sb.storage.from("media").upload(storagePath, buffer, { contentType: mime, upsert: true, cacheControl: "3600" });
      if (error) { console.log(`✗ upload ${file}: ${error.message}`); continue; }
      n++;
      if (!known.has(storagePath)) {
        await sb.from("media").insert({
          tenant_id: tenantId, name: file, original_name: file, mime_type: mime, size: buffer.length,
          url: asset(file), storage_path: storagePath, folder: "/", alt: "MACNEL Construction " + file.replace(/^mc-|\.(jpg|png)$/g, "").replace(/-/g, " "),
        });
      }
    }
  }));
  console.log(`✓ assets uploaded: ${n}`);
}

async function run() {
  const { data: tpl } = await sb.from("templates").select("id, custom_css").eq("slug", TEMPLATE_SLUG).single();
  if (!tpl) throw new Error(`template ${TEMPLATE_SLUG} missing`);
  if (tpl.custom_css) console.log("! template has custom_css, check palette leaks");
  const tenantId = await ensureTenant();
  if (!process.argv.includes("--skip-assets")) await uploadAssets(tenantId);
  await sb.from("contact_details").update({ floating_whatsapp: true, floating_call: true, whatsapp: WA_NUMBER, phone: PHONE, email: EMAIL, address: ADDRESS }).eq("tenant_id", tenantId).eq("is_primary", true);
  const now = new Date().toISOString();

  // Drop everything the importer brought in that is not ours (incl. the 1xbet/aviator spam pages).
  const keep = new Set(PAGES.map(([key]) => key));
  const { data: existing } = await sb.from("pages").select("id, slug").eq("tenant_id", tenantId);
  for (const p of existing ?? []) if (!keep.has(p.slug)) { await sb.from("pages").delete().eq("id", p.id); console.log(`  - removed ${p.slug}`); }

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
    site_name: SITE_NAME, tagline: "Professional construction and renovation services tailored to your needs.",
    logo_url: LOGO, logo_dark_url: LOGO_LIGHT, logo_type: "image", logo_alt: SITE_NAME, logo_width: 200,
    favicon_url: FAVICON_URL,
    primary_color: BLUE, secondary_color: NAVY,
    color_overrides: {
      primary: BLUE, primaryFg: "#ffffff", secondary: NAVY, accent: GREEN, ring: BLUE,
      background: PAPER, foreground: INK, card: "#ffffff", muted: MIST, mutedFg: BODY,
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
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Singapore", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/  tenant ${tenantId}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
