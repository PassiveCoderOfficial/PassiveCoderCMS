/**
 * Tofazzal Construction Home Maintenance and Renovation Pte. Ltd. — Singapore.
 * Pro-plan demo site at tofazzalcon.passivecoder.com.
 * Creates the tenant (demo, 72h window) if missing, then (re)writes every page,
 * header, footer, prefooter and theme. Safe to re-run.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "tofazzalcon";
const PLAN = "pro";
const TEMPLATE_SLUG = "construction-classic";
const DEMO_HOURS = 72;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Tofazzal Construction";
const LEGAL_NAME = "Tofazzal Construction Home Maintenance and Renovation Pte. Ltd.";
const SLOGAN = "Home Maintenance & Renovation, Done Right";
const PHONE = "+6583362922";
const PHONE_DISPLAY = "+65 8336 2922";
const EMAIL = "info@tofazzalcon.com";
const AREA = "Serving all of Singapore";
const waText = (t) => `https://wa.me/6583362922?text=${encodeURIComponent(t)}`;
const WA = waText("Hi Tofazzal Construction, I found your website and would like a free quote.");

const GOLD = "#E5A812";
const GOLD_LIGHT = "#F5C542";
const CHARCOAL = "#262626";
const CHARCOAL_DEEP = "#1a1a1a";
const CREAM = "#f7f4ee";

const STORAGE = `${SUPABASE_URL}/storage/v1/object/public/media/uploads/tofazzalcon`;
const LOGO_URL = `${STORAGE}/logo.png`;
const FAVICON_URL = `${STORAGE}/favicon.png`;

// Pexels (free for commercial use, no attribution required)
const px = (id, w = 1600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const IMG = {
  heroHome: px(5493664, 2000),
  about: px(4981798),
  aboutTeam: px(5691552),
  interior1: px(1643383),
  interior2: px(7060814),
  interior3: px(6588593),
  interior4: px(6588594),
  bath1: px(11701114),
  bath2: px(19846350),
};

// ─── Services ───────────────────────────────────────────────────────────────
// images[0] = hero + card, others feed the intro, gallery and detail sections.
const SERVICES = [
  {
    slug: "electrical-services", icon: "Zap", title: "Electrical Services",
    short: "Installation and repair for all electrical works, from power points to full rewiring.",
    lead: "Safe, tidy electrical work for HDB flats, condos, landed homes and offices. We trace faults properly, fix them at the source and leave your wiring neat and labelled.",
    included: [
      ["Plug", "Power Points & Switches", "New sockets, switch replacement and relocation."],
      ["Lightbulb", "Lighting Installation", "Ceiling lights, downlights, LED strips and fans."],
      ["Zap", "Fault Finding & Repair", "Tripping breakers, dead points and short circuits."],
      ["LayoutPanelTop", "DB Box & Rewiring", "Distribution board upgrades and partial or full rewiring."],
      ["Wind", "Fan & Appliance Points", "Dedicated points for heaters, ovens and aircon."],
      ["ShieldCheck", "Safety Checks", "Inspection of old wiring before renovation or resale."],
    ],
    images: [px(442160), px(257736), px(17842832), px(4981793)],
    faq: [
      ["Can you fix a breaker that keeps tripping?", "Yes. We isolate the faulty circuit or appliance, repair the cause and test before we leave, instead of just resetting it."],
      ["Do you install lights I bought myself?", "Yes, we install customer-supplied lights, fans and fittings as long as they are suitable for the ceiling and circuit."],
      ["Can you add new power points without hacking walls?", "Often yes, using surface trunking that is painted to match. We will show you both options before starting."],
    ],
  },
  {
    slug: "plumbing-services", icon: "Droplets", title: "Plumbing Services",
    short: "Pipe repair, installation and water leak solutions for kitchens and bathrooms.",
    lead: "From a dripping tap to a hidden leak behind the wall, we find the problem fast and fix it with quality fittings, so you are not calling a plumber again next month.",
    included: [
      ["Droplets", "Leak Detection & Repair", "Concealed pipe leaks, ceiling seepage and burst pipes."],
      ["ShowerHead", "Taps, Mixers & Showers", "Supply and install of taps, mixers and shower sets."],
      ["Wrench", "Pipe Replacement", "Old or corroded pipes replaced with new piping."],
      ["Waves", "Choke Clearing", "Sinks, floor traps and toilet bowls unblocked."],
      ["Home", "Sanitary Installation", "Basins, WC, bidet sprays and water heaters."],
      ["ClipboardCheck", "Pressure Testing", "Every job tested for leaks before handover."],
    ],
    images: [px(6419128), px(5710332), px(6436770), px(19846350)],
    faq: [
      ["My ceiling has a water stain. Is it plumbing?", "It can be plumbing or a waterproofing failure from the unit above. We inspect and tell you which, and fix whichever it is."],
      ["Do you supply the taps and fittings?", "We can supply good quality fittings or install the ones you have already bought."],
      ["Can you replace a water heater?", "Yes, storage and instant heaters, including the pipework and electrical point if needed."],
    ],
  },
  {
    slug: "tiling-flooring", icon: "Grid3x3", title: "Tiling & Flooring",
    short: "Tile installation and flooring solutions for floors, walls, kitchens and bathrooms.",
    lead: "Level floors, straight grout lines and clean edges. We handle full retiling, overlaying, hollow or popped tile repair, and new flooring for every room.",
    included: [
      ["Grid3x3", "Floor & Wall Tiling", "Homogeneous, porcelain, ceramic and mosaic tiles."],
      ["Layers", "Tile Overlay", "New tiles laid over old ones to save hacking time and cost."],
      ["Hammer", "Popped & Hollow Tiles", "Cracked, loose or hollow-sounding tiles replaced."],
      ["Ruler", "Screeding & Levelling", "Proper cement screed for a flat, even base."],
      ["Brush", "Regrouting", "Stained or cracked grout removed and redone."],
      ["Home", "Vinyl & Laminate", "Vinyl plank and laminate installation over tiles."],
    ],
    images: [px(29181494), px(6588584), px(11701114), px(5629141)],
    faq: [
      ["Can you replace just a few popped tiles?", "Yes. We remove the damaged tiles, redo the bed and match the replacement as closely as possible."],
      ["Is overlaying tiles a good idea?", "For sound floors it is fast and cost-effective. We check for hollow areas first and tell you honestly if hacking is needed."],
      ["How long does a bathroom retile take?", "Most bathrooms take a few working days including waterproofing and curing. We give you the schedule before starting."],
    ],
  },
  {
    slug: "painting-services", icon: "PaintRoller", title: "Painting Services",
    short: "Interior and exterior painting with clean lines and proper preparation.",
    lead: "A great paint job is 70% preparation. We protect your furniture and floors, patch and sand the walls, then apply quality paint for an even, long-lasting finish.",
    included: [
      ["PaintRoller", "Interior Painting", "Walls, ceilings, doors and trims for any home."],
      ["Building2", "Exterior Painting", "Weather-resistant coatings for facades and gates."],
      ["Brush", "Surface Preparation", "Crack filling, sanding and priming before paint."],
      ["Droplets", "Anti-Mould Treatment", "Mould removal and anti-fungal paint for damp areas."],
      ["Sparkles", "Feature Walls", "Accent colours and special finishes."],
      ["ShieldCheck", "Furniture Protection", "Floors and furniture covered, site cleaned after."],
    ],
    images: [px(7217998), px(18369835), px(7218027), px(994164)],
    faq: [
      ["Do I need to move my furniture out?", "No. We move items to the centre of the room and cover everything before painting."],
      ["Which paint brands do you use?", "We use trusted brands such as Nippon and Dulux, or any brand and colour you prefer."],
      ["Can you paint an occupied home?", "Yes, most of our painting jobs are done while families live in the home. We work room by room."],
    ],
  },
  {
    slug: "carpentry-works", icon: "Hammer", title: "Carpentry Works",
    short: "Cabinets, wardrobes, doors and furniture works, built to fit your space.",
    lead: "Custom carpentry measured and built for your space. Kitchen cabinets, wardrobes, shelving and doors made with durable materials and neat, flush finishing.",
    included: [
      ["Home", "Kitchen Cabinets", "Top and bottom cabinets with quality hinges and tops."],
      ["DoorOpen", "Wardrobes", "Swing or sliding wardrobes with internal fittings."],
      ["DoorOpen", "Doors & Frames", "Door replacement, repair, hinges and locksets."],
      ["Layers", "Shelving & TV Consoles", "Built-in shelves, feature walls and consoles."],
      ["Wrench", "Furniture Repair", "Loose hinges, drawers and damaged panels fixed."],
      ["Ruler", "Site Measurement", "Accurate measuring and design before fabrication."],
    ],
    images: [px(5973910), px(5973905), px(5973919), px(5973901)],
    faq: [
      ["Do you make custom-sized cabinets?", "Yes. Every piece is measured on site and made to fit your space exactly."],
      ["Can you repair existing cabinets instead of replacing?", "Yes. Hinges, drawers, doors and damaged panels can often be repaired at a fraction of the cost."],
      ["How long does custom carpentry take?", "Timing depends on the piece. We confirm fabrication and installation dates when you approve the design."],
    ],
  },
  {
    slug: "ceiling-works", icon: "LayoutPanelTop", title: "Ceiling Works",
    short: "False ceilings, gypsum boards and partition works for homes and offices.",
    lead: "Gypsum false ceilings with concealed lighting, L-box designs and partition walls that are straight, strong and seamless once painted.",
    included: [
      ["LayoutPanelTop", "False Ceilings", "Flat and designer gypsum ceilings."],
      ["Lightbulb", "Cove & Concealed Lighting", "L-box and cove designs with LED strips."],
      ["BrickWall", "Partition Walls", "Drywall partitions to create new rooms."],
      ["Wrench", "Ceiling Repair", "Sagging, cracked or water-damaged boards replaced."],
      ["Scan", "Access Panels", "Neat openings for aircon and service access."],
      ["Volume2", "Acoustic Boards", "Sound-reducing ceilings and walls."],
    ],
    images: [px(6474129), px(5493663), px(5493677), px(5493675)],
    faq: [
      ["Can you repair a water-damaged false ceiling?", "Yes. We fix the source of the leak first, then replace the damaged boards and repaint to match."],
      ["Can a partition wall be removed later?", "Yes, drywall partitions are non-structural and can be removed without major hacking."],
      ["Do you do the lighting as well?", "Yes, our electrical team handles the downlights and LED strips in the same job."],
    ],
  },
  {
    slug: "waterproofing", icon: "ShieldCheck", title: "Waterproofing",
    short: "Roof, bathroom and wall waterproofing that stops leaks for good.",
    lead: "Leaks damage ceilings, walls and your neighbours' homes. We apply proper waterproofing membranes and sealants to roofs, bathrooms, balconies and external walls.",
    included: [
      ["Home", "Bathroom Waterproofing", "Membrane under tiles, floor traps and wall joints."],
      ["Umbrella", "Roof Waterproofing", "Flat roof and RC roof coatings and membranes."],
      ["BrickWall", "Wall Seepage", "External wall and window frame sealing."],
      ["Sun", "Balcony & Planter Box", "Leaking balconies and planter boxes treated."],
      ["Droplets", "Ponding Test", "24-hour water test to prove the job is watertight."],
      ["SprayCan", "Sealant & Silicone", "Old sealant removed and redone properly."],
    ],
    images: [px(16113325), px(6957087), px(6436787), px(7788266)],
    faq: [
      ["My downstairs neighbour has a leak. What should I do?", "Let us inspect. We identify whether it is waterproofing or piping and propose the right fix, not just a patch."],
      ["Do I have to hack all my bathroom tiles?", "Not always. Depending on the cause, we may treat joints and floor traps. Full redo is only recommended when needed."],
      ["How do I know the waterproofing works?", "We carry out a ponding test before tiles go back on, so you can see it holds water."],
    ],
  },
  {
    slug: "general-handyman", icon: "Wrench", title: "General Handyman",
    short: "All kinds of home repair and maintenance, big or small.",
    lead: "One call for the small jobs that pile up. Curtain rails, shelves, door locks, drilling, minor repairs and installations, done in one visit by a skilled handyman.",
    included: [
      ["Drill", "Drilling & Mounting", "TV brackets, shelves, mirrors, curtain rails."],
      ["DoorOpen", "Doors & Locks", "Lock replacement, digital locks, door alignment."],
      ["Hammer", "Furniture Assembly", "Flat-pack furniture assembled and secured."],
      ["Wrench", "Minor Repairs", "Loose fittings, cabinet hinges, towel racks."],
      ["Sparkles", "Silicone & Touch-ups", "Resealing basins, touch-up painting."],
      ["Calendar", "Maintenance Visits", "Scheduled visits for landlords and offices."],
    ],
    images: [px(4981810), px(4981799), px(5691544), px(4981803)],
    faq: [
      ["Is there a minimum job size?", "No job is too small. Group several small tasks into one visit to get the most value."],
      ["Do you serve landlords and property agents?", "Yes, we handle handover repairs and regular maintenance for rental units."],
      ["Can you come on weekends?", "Yes, weekend slots are available. WhatsApp us to check availability."],
    ],
  },
  {
    slug: "brick-wall-insulation", icon: "BrickWall", title: "Brick Wall & Insulation",
    short: "Brick wall construction and wall insulation for cooler, quieter rooms.",
    lead: "New brick walls built plumb and solid, and insulation added to walls that let in heat and noise. Ideal for extensions, new rooms and west-facing walls.",
    included: [
      ["BrickWall", "Brick Wall Building", "New walls for extensions, rooms and boundaries."],
      ["Thermometer", "Thermal Insulation", "Keeps rooms cooler and reduces aircon load."],
      ["Volume2", "Sound Insulation", "Quieter bedrooms and home offices."],
      ["Hammer", "Wall Hacking & Rebuild", "Hacking and rebuilding damaged walls."],
      ["Ruler", "Plumb & Level Work", "Straight walls ready for plaster and paint."],
      ["ShieldCheck", "Moisture Barrier", "Protection against damp and seepage."],
    ],
    images: [px(32913784), px(32913789), px(14706626), px(32913792)],
    faq: [
      ["Does wall insulation really make a room cooler?", "Yes. Insulating a sun-facing wall reduces heat coming in, so the room stays cooler and aircon works less."],
      ["Can you build a new brick wall inside my home?", "Yes, subject to building rules. We advise on whether a brick wall or a lighter drywall partition is more suitable."],
      ["Will the new wall be ready for painting?", "We build, plaster and skim coat the wall so it is ready for a smooth paint finish."],
    ],
  },
  {
    slug: "plastering", icon: "Layers", title: "Plastering",
    short: "Cement and gypsum plastering for strong, flat walls and ceilings.",
    lead: "Proper plastering gives every wall a strong, flat surface. We plaster new brickwork, repair cracked or hollow plaster, and prepare walls for tiling or painting.",
    included: [
      ["Layers", "Wall Plastering", "Cement render on new and existing walls."],
      ["LayoutPanelTop", "Ceiling Plastering", "Smooth, level ceilings ready for paint."],
      ["Hammer", "Hollow Plaster Repair", "Loose and hollow plaster hacked and redone."],
      ["Wrench", "Crack Repair", "Structural-looking cracks opened, filled and sealed."],
      ["Ruler", "Corner & Edge Beads", "Sharp, straight corners and edges."],
      ["ShieldCheck", "Tile-Ready Surfaces", "Plastered base prepared for tiling."],
    ],
    images: [px(6474133), px(5493658), px(6474127), px(6474192)],
    faq: [
      ["Why is my wall plaster sounding hollow?", "Plaster can lose its bond over time or from moisture. We hack out the loose area and replaster it properly."],
      ["Is plastering the same as skim coat?", "No. Plastering builds up and levels the wall; skim coat is a thin final layer for a smooth finish. We do both."],
      ["How long before I can paint new plaster?", "Cement plaster needs time to cure. We advise the right waiting time, usually a few days to a couple of weeks."],
    ],
  },
  {
    slug: "skim-coat", icon: "Paintbrush", title: "Skim Coat",
    short: "Ultra-smooth skim coat finish that hides flaws and makes paint look premium.",
    lead: "A skim coat turns rough, patchy or uneven walls into a smooth, flawless surface. The result: paint that looks premium and walls that feel brand new.",
    included: [
      ["Paintbrush", "Full Wall Skim Coat", "Smooth finish across entire walls and ceilings."],
      ["Sparkles", "Patch & Blend", "Repairs blended so they disappear under paint."],
      ["Brush", "Sanding & Finishing", "Machine sanding for a glass-smooth result."],
      ["Layers", "Over Old Paint", "Skim over old, rough or textured surfaces."],
      ["Home", "Rental Refresh", "Quick turnaround for handover and resale."],
      ["ShieldCheck", "Dust Control", "Covered floors and clean-up after sanding."],
    ],
    images: [px(6474123), px(6474122), px(5493652), px(5493664)],
    faq: [
      ["Do I need skim coat before painting?", "If your walls are rough, patchy or show old repairs, a skim coat gives a far better paint finish."],
      ["Can you skim coat over existing paint?", "Yes, after checking the paint is sound and preparing the surface correctly."],
      ["Is skim coating messy?", "Sanding creates dust, so we cover floors and furniture and clean up before we leave."],
    ],
  },
];

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = {
  visible: true, width: "full",
  padding: { top: 88, right: 24, bottom: 88, left: 24 },
  margin: ZERO,
  background: { type: "none" },
};
const bgColor = (color) => ({ type: "color", color });

const NAV_ITEMS = [
  { id: "n1", label: "Home", url: "/", children: [] },
  { id: "n2", label: "Services", url: "/services", children: SERVICES.map((s, i) => ({ id: `n2${i}`, label: s.title, url: `/services/${s.slug}` })) },
  { id: "n3", label: "About Us", url: "/about", children: [] },
  { id: "n4", label: "Projects", url: "/projects", children: [] },
  { id: "n5", label: "FAQ", url: "/faq", children: [] },
  { id: "n6", label: "Contact", url: "/contact", children: [] },
];

function globalHeader() {
  return {
    id: uid("nav"), type: "navigation", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: bgColor(CHARCOAL),
    templateVariant: "solid-with-cta",
    data: {
      logoText: SITE_NAME, logo: LOGO_URL, items: NAV_ITEMS,
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: CHARCOAL, textColor: "#ffffff", colorMode: "legacy", activeColor: GOLD, ctaVariant: "solid", logoHeight: 56, logoCaption: "",
      showCta: true, ctaLabel: "WhatsApp Us", ctaUrl: WA,
    },
  };
}

function globalFooter() {
  return {
    id: uid("footer"), type: "footer", order: 0, visible: true, width: "full",
    padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_URL, logoText: SITE_NAME,
      tagline: "Home maintenance and renovation specialists. Electrical, plumbing, tiling, painting, carpentry, ceilings, waterproofing, plastering and more, under one trusted team.",
      logoCaption: "",
      style: "dark", backgroundColor: CHARCOAL_DEEP, accentColor: GOLD, textColor: "#d4d4d4",
      copyrightText: `© {year} ${LEGAL_NAME} All rights reserved.`,
      copyrightYear: true, showNewsletter: false,
      socials: [
        { platform: "whatsapp", url: WA },
        { platform: "facebook", url: "#" },
        { platform: "instagram", url: "#" },
      ],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.slice(0, 6).map((s) => ({ id: uid("fl"), label: s.title, url: `/services/${s.slug}` })) },
        { id: uid("fc"), heading: "More Services", links: SERVICES.slice(6).map((s) => ({ id: uid("fl"), label: s.title, url: `/services/${s.slug}` })) },
        { id: uid("fc"), heading: "Company", links: [
          { id: uid("fl"), label: "About Us", url: "/about" },
          { id: uid("fl"), label: "Projects", url: "/projects" },
          { id: uid("fl"), label: "FAQ", url: "/faq" },
          { id: uid("fl"), label: "Contact", url: "/contact" },
        ]},
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: "WhatsApp Us", url: WA },
          { id: uid("fl"), label: EMAIL, url: `mailto:${EMAIL}` },
          { id: uid("fl"), label: AREA, url: "/contact" },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

function hero({ badge, title, subtitle, description, img, primary, secondary, compact }) {
  return {
    ...BASE, id: uid("hero"), type: "hero", padding: ZERO,
    templateVariant: "fullscreen-overlay",
    background: { type: "image", imageUrl: img, imageOverlay: "#111111", imageOverlayOpacity: 0.62 },
    data: {
      layout: "centered", badge, title, subtitle, description, compact: !!compact,
      badgeBgColor: GOLD, badgeTextColor: CHARCOAL_DEEP,
      primaryButton: primary ?? { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}`, variant: "primary" },
      secondaryButton: secondary ?? { label: "WhatsApp for a Free Quote", url: WA, variant: "outline" },
      imageUrl: img,
      typography: { titleSize: compact ? "5xl" : "6xl", titleColor: "#ffffff", subtitleColor: GOLD_LIGHT, descColor: "#e5e5e5" },
    },
  };
}

function servicesGrid(items, { title = "Our Services", subtitle = "What We Do", bg = "#ffffff", withAsk = true } = {}) {
  const cards = items.map((s) => ({
    id: uid("sv"), title: s.title, description: s.short,
    icon: s.icon, iconType: "lucide", imageUrl: s.images[0].replace("w=1600", "w=900"),
    linkLabel: "View Service", link: `/services/${s.slug}`,
  }));
  if (withAsk) cards.push({
    id: uid("sv"), title: "Something Else?",
    description: "Not sure which service you need, or need several trades at once? Tell us about the job and we will sort it out.",
    icon: "MessageCircle", iconType: "lucide", imageUrl: IMG.interior1.replace("w=1600", "w=900"),
    linkLabel: "Get a Free Quote", link: "/contact",
  });
  return {
    ...BASE, id: uid("svc"), type: "services", background: bgColor(bg),
    templateVariant: "program-cards-dark",
    data: { title, subtitle, layout: "grid", columns: 3, cardStyle: "elevated", source: "inline", items: cards },
  };
}

function stats() {
  return {
    ...BASE, id: uid("stats"), type: "stats", padding: ZERO,
    templateVariant: "dark-band",
    data: {
      columns: 4, animate: true,
      items: [
        { id: uid("st"), value: "11", label: "Trade Services", icon: "HardHat" },
        { id: uid("st"), value: "300+", label: "Homes Serviced", icon: "Home" },
        { id: uid("st"), value: "5.0★", label: "Customer Rating", icon: "Star" },
        { id: uid("st"), value: "100%", label: "Free Quotes", icon: "BadgeCheck" },
      ],
    },
  };
}

function whyUs(bg = CREAM) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg),
    templateVariant: "outlined-cards",
    data: {
      title: "Why Homeowners Choose Tofazzal", subtitle: "One team, every trade, no runaround.", columns: 3, iconSize: "md",
      items: [
        { id: uid("i"), icon: "HardHat", color: GOLD, label: "Skilled, Experienced Crew", description: "Specialists for each trade, not one person guessing at everything." },
        { id: uid("i"), icon: "BadgeCheck", color: GOLD, label: "Clear, Upfront Quotes", description: "Itemised price before we start. No surprise charges at the end." },
        { id: uid("i"), icon: "Clock", color: GOLD, label: "Fast Response", description: "WhatsApp us photos and get a reply quickly, often the same day." },
        { id: uid("i"), icon: "Layers", color: GOLD, label: "All Trades Under One Roof", description: "Electrical, plumbing, tiling, carpentry and more, coordinated by one team." },
        { id: uid("i"), icon: "ShieldCheck", color: GOLD, label: "Workmanship We Stand Behind", description: "If something is not right, we come back and fix it." },
        { id: uid("i"), icon: "Sparkles", color: GOLD, label: "Clean, Respectful Sites", description: "We protect your home and clean up before we leave." },
      ],
    },
  };
}

function aboutSplit(bg = "#ffffff") {
  return {
    ...BASE, id: uid("feat"), type: "features", background: bgColor(bg),
    templateVariant: "alternating-images",
    data: {
      title: "", subtitle: "", layout: "alternating", columns: 2, style: "minimal",
      items: [{
        id: uid("f"), title: "Your Home, Handled by One Trusted Team",
        description: `${LEGAL_NAME} is a Singapore home maintenance and renovation company. We take care of everything from a single leaking pipe to a full room makeover.\n\nInstead of juggling an electrician, a plumber, a tiler and a painter, you deal with one team that plans the work, sequences the trades and delivers a finished result.\n\n✓ HDB, condo, landed and commercial\n✓ Free site assessment and quote\n✓ Quality materials and neat finishing\n✓ Honest advice: repair when you can, replace when you must`,
        imageUrl: IMG.about, icon: "",
      }],
    },
  };
}

function steps(bg = "#ffffff") {
  return {
    ...BASE, id: uid("steps"), type: "steps", background: bgColor(bg),
    data: {
      title: "How It Works", subtitle: "From first message to finished job in four simple steps",
      layout: "horizontal", style: "connected",
      items: [
        { id: uid("s"), step: "01", title: "Send Us Photos", description: "WhatsApp or call us with photos and a short description of the job." },
        { id: uid("s"), step: "02", title: "Free Quote", description: "We assess the work, visit if needed, and send a clear itemised quote." },
        { id: uid("s"), step: "03", title: "We Do the Work", description: "Our skilled crew completes the job on schedule with quality materials." },
        { id: uid("s"), step: "04", title: "Inspect & Handover", description: "We walk you through the finished work and clean up before we leave." },
      ],
    },
  };
}

const TESTIMONIALS = [
  { name: "Daniel Tan", role: "Homeowner", company: "Punggol", content: "They fixed our leaking bathroom and redid the tiles in the same job. One team, one quote, finished on time. Very neat work.", rating: 5 },
  { name: "Priya Nair", role: "Homeowner", company: "Tampines", content: "The skim coat and painting completely transformed our old walls. Smooth like a new flat. Friendly crew and they cleaned up properly.", rating: 5 },
  { name: "Marcus Lim", role: "Landlord", company: "Jurong West", content: "I use Tofazzal for all my rental unit repairs. Fast WhatsApp replies, fair prices, and the work is always done right.", rating: 5 },
  { name: "Siti Rahman", role: "Homeowner", company: "Woodlands", content: "New false ceiling with cove lighting in our living room. Looks amazing, and the electrical work was very tidy.", rating: 5 },
  { name: "Kelvin Ong", role: "Office Manager", company: "Ubi", content: "They built a partition wall and rewired the power points for our office over a weekend. No disruption to our team.", rating: 5 },
  { name: "Aisha Begum", role: "Homeowner", company: "Sengkang", content: "Our kitchen cabinets were custom built and fit perfectly. Honest advice and no hidden costs.", rating: 5 },
];

function testimonials(bg = "#ffffff", count = 3) {
  return {
    ...BASE, id: uid("tes"), type: "testimonials", background: bgColor(bg),
    templateVariant: "quote-cards",
    data: {
      title: "What Our Customers Say", subtitle: "Homeowners, landlords and businesses across Singapore", layout: "grid",
      items: TESTIMONIALS.slice(0, count).map((t) => ({ id: uid("t"), ...t, avatar: "" })),
    },
  };
}

function faq(items, { title = "Frequently Asked Questions", bg = CREAM } = {}) {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg),
    templateVariant: "accordion-bordered",
    data: {
      title, subtitle: "", layout: "accordion", allowMultiple: false,
      items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })),
    },
  };
}

function gallery(urls, title, bg = "#ffffff", subtitle = "") {
  return {
    ...BASE, id: uid("gal"), type: "gallery", background: bgColor(bg),
    data: {
      title, subtitle, layout: "grid", columns: urls.length === 4 ? 4 : 3, gap: "md", lightbox: true,
      images: urls.map((url) => ({ id: uid("gi"), url: url.replace("w=1600", "w=1200"), alt: title, caption: "" })),
    },
  };
}

function cta(title, description) {
  return {
    ...BASE, id: uid("cta"), type: "cta",
    background: { type: "gradient", gradient: `linear-gradient(135deg, ${CHARCOAL} 0%, ${CHARCOAL_DEEP} 100%)` },
    templateVariant: "gradient-banner",
    data: {
      title, description, layout: "centered",
      primaryButton: { label: "WhatsApp Us Now", url: WA },
      secondaryButton: { label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
    },
  };
}

function contact(title = "Get Your Free Quote", subtitle = "Send us a message or WhatsApp photos of the job. We reply fast.", bg = "#ffffff") {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title, subtitle, layout: "split", showMap: false, showContactInfo: true,
      phone: PHONE_DISPLAY, email: EMAIL, address: AREA, recipientEmail: "",
      fields: [
        { id: "f-name", label: "Full Name", type: "text", required: true },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "f-service", label: "Service Needed", type: "select", required: false, options: [...SERVICES.map((s) => s.title), "Other / Multiple"] },
        { id: "f-msg", label: "Tell us about the job", type: "textarea", required: true },
      ],
      submitLabel: "Request Free Quote",
      successMessage: "Thank you! We will get back to you shortly. For faster replies, WhatsApp us.",
    },
  };
}

// ─── pages ──────────────────────────────────────────────────────────────────
function homePage() {
  return [
    hero({
      badge: "Singapore Home Maintenance & Renovation",
      title: "Every Home Repair.\nOne Trusted Team.",
      subtitle: SITE_NAME,
      description: "Electrical, plumbing, tiling, painting, carpentry, ceilings, waterproofing, brick walls, plastering and skim coat. Quality workmanship, clear quotes, fast response.",
      img: IMG.heroHome,
    }),
    stats(),
    servicesGrid(SERVICES, { title: "Everything Your Home Needs", subtitle: "Our Services" }),
    aboutSplit(CREAM),
    whyUs("#ffffff"),
    gallery([IMG.interior1, IMG.bath1, IMG.interior2, SERVICES[5].images[0], SERVICES[4].images[0], IMG.bath2], "Recent Work", CREAM, "A look at the finishes we deliver"),
    steps("#ffffff"),
    testimonials(CREAM, 3),
    faq([
      ["What areas do you cover?", "We serve homes and businesses across all of Singapore: HDB flats, condominiums, landed properties, shophouses and offices."],
      ["Is the quote really free?", "Yes. Send photos on WhatsApp for a quick estimate, or we can visit for a detailed quote at no charge."],
      ["Can you handle a job that needs several trades?", "Yes, that is our strength. We coordinate electrical, plumbing, tiling, carpentry and painting as one project with one quote."],
      ["How fast can you start?", "Small repairs can often be scheduled within days. For larger jobs we confirm a start date when you approve the quote."],
    ], { bg: "#ffffff" }),
  ];
}

function servicesPage() {
  return [
    hero({
      badge: "Our Services", title: "Complete Home Maintenance\n& Renovation Services",
      subtitle: SLOGAN,
      description: "Eleven specialist trades, one accountable team. Pick a service to see what is included.",
      img: SERVICES[9].images[0], compact: true,
    }),
    servicesGrid(SERVICES, { title: "Choose a Service", subtitle: "What We Do" }),
    whyUs(CREAM),
    steps("#ffffff"),
  ];
}

function servicePage(s) {
  const others = SERVICES.filter((o) => o.slug !== s.slug).slice(0, 3);
  // rotate so each page suggests different related services
  const idx = SERVICES.indexOf(s);
  const related = [1, 2, 3].map((k) => SERVICES[(idx + k) % SERVICES.length]);
  void others;
  return [
    hero({
      badge: s.title, title: s.title,
      subtitle: `${SITE_NAME} · Singapore`,
      description: s.short,
      img: s.images[0], compact: true,
      secondary: { label: "WhatsApp for a Free Quote", url: waText(`Hi Tofazzal Construction, I need ${s.title}. Can I get a free quote?`), variant: "outline" },
    }),
    {
      ...BASE, id: uid("feat"), type: "features", background: bgColor("#ffffff"),
      templateVariant: "alternating-images",
      data: {
        title: "", subtitle: "", layout: "alternating", columns: 2, style: "minimal",
        items: [{
          id: uid("f"), title: `Professional ${s.title} in Singapore`,
          description: `${s.lead}\n\n✓ Skilled, experienced tradesmen\n✓ Free, itemised quote before work starts\n✓ Quality materials and neat finishing\n✓ HDB, condo, landed and commercial\n✓ Fast response on WhatsApp`,
          imageUrl: s.images[1], icon: "",
        }],
      },
    },
    {
      ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(CREAM),
      templateVariant: "outlined-cards",
      data: {
        title: `Our ${s.title}`, subtitle: "What's included", columns: 3, iconSize: "md",
        items: s.included.map(([icon, label, description]) => ({ id: uid("i"), icon, color: GOLD, label, description })),
      },
    },
    gallery([s.images[0], s.images[1], s.images[2], s.images[3]], `${s.title} Work`, "#ffffff", "Examples of the kind of work we deliver"),
    steps(CREAM),
    faq(s.faq, { title: `${s.title}: Common Questions`, bg: "#ffffff" }),
    servicesGrid(related, { title: "Related Services", subtitle: "You may also need", bg: CREAM, withAsk: false }),
  ];
}

function aboutPage() {
  return [
    hero({
      badge: "About Us", title: "Built on Skill.\nTrusted for Service.",
      subtitle: LEGAL_NAME,
      description: "A Singapore home maintenance and renovation company delivering quality workmanship across every trade.",
      img: IMG.aboutTeam, compact: true,
    }),
    aboutSplit("#ffffff"),
    stats(),
    {
      ...BASE, id: uid("feat"), type: "features", background: bgColor(CREAM),
      templateVariant: "alternating-images",
      data: {
        title: "Our Promise", subtitle: "", layout: "alternating", columns: 2, style: "minimal",
        items: [
          {
            id: uid("f"), title: "Do It Right the First Time",
            description: "We fix the cause, not just the symptom. A leak gets traced to its source, a crack gets opened and properly filled, and a wall gets prepared before it is painted.\n\nThat is how our work lasts, and why customers call us back for their next job.",
            imageUrl: SERVICES[9].images[1], icon: "",
          },
          {
            id: uid("f"), title: "Transparent From Quote to Handover",
            description: "You get an itemised quote before work starts, regular updates while we work, and a walkthrough when we finish.\n\nNo hidden charges, no disappearing contractors.",
            imageUrl: IMG.interior3, icon: "",
          },
        ],
      },
    },
    whyUs("#ffffff"),
    testimonials(CREAM, 6),
  ];
}

function projectsPage() {
  const all = [
    IMG.interior1, IMG.bath1, IMG.interior2, IMG.bath2, IMG.interior3, IMG.interior4,
    ...SERVICES.flatMap((s) => [s.images[0], s.images[2]]),
  ];
  return [
    hero({
      badge: "Our Work", title: "Projects & Finishes",
      subtitle: SLOGAN,
      description: "Renovation, repair and finishing work for homes and businesses across Singapore.",
      img: IMG.interior4, compact: true,
    }),
    gallery(all, "Project Gallery", "#ffffff", "Tap any photo to view it larger"),
    testimonials(CREAM, 3),
  ];
}

function faqPage() {
  const general = [
    ["What areas in Singapore do you cover?", "All of Singapore. We work in HDB flats, condominiums, landed homes, shophouses and offices."],
    ["How do I get a quote?", "WhatsApp us photos and a short description for a quick estimate, or request a site visit for a detailed quote. Both are free."],
    ["Do you handle projects needing several trades?", "Yes. We coordinate electrical, plumbing, tiling, carpentry, ceiling and painting work as one project with one point of contact."],
    ["Do you supply materials?", "Yes, we supply quality materials, or we can work with materials you have already bought."],
    ["Do you work on weekends?", "Yes, weekend slots are available on request."],
    ["What if I am not happy with the work?", "Tell us. We come back and put it right."],
  ];
  const svc = SERVICES.map((s) => s.faq[0]);
  return [
    hero({
      badge: "FAQ", title: "Questions? We Have Answers.",
      subtitle: SITE_NAME,
      description: "Common questions about our services, quotes and how we work.",
      img: IMG.interior2, compact: true,
    }),
    faq(general, { title: "General Questions", bg: "#ffffff" }),
    faq(svc, { title: "Service Questions", bg: CREAM }),
  ];
}

function contactPage() {
  return [
    hero({
      badge: "Contact Us", title: "Let's Talk About Your Home",
      subtitle: `${PHONE_DISPLAY} · ${AREA}`,
      description: "Call, WhatsApp or send us a message. Free quotes, fast replies.",
      img: IMG.interior3, compact: true,
    }),
    {
      ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(CREAM),
      templateVariant: "outlined-cards",
      data: {
        title: "Reach Us Your Way", subtitle: "", columns: 3, iconSize: "md",
        items: [
          { id: uid("i"), icon: "MessageCircle", color: GOLD, label: "WhatsApp", description: `${PHONE_DISPLAY}\nFastest way to reach us. Send photos for a quick quote.`, url: WA },
          { id: uid("i"), icon: "PhoneCall", color: GOLD, label: "Call Us", description: `${PHONE_DISPLAY}\nSpeak to us directly about your job.`, url: `tel:${PHONE}` },
          { id: uid("i"), icon: "MapPin", color: GOLD, label: "Service Area", description: `${AREA}\nHDB, condo, landed and commercial.` },
        ],
      },
    },
    contact("Send Us a Message", "Tell us what you need. We will reply with a free quote."),
  ];
}

function prefooter() {
  return [
    cta("Ready to Fix, Upgrade or Renovate?", "WhatsApp us photos of the job for a free quote. We reply fast."),
    contact(),
  ].map((b, i) => ({ ...b, order: 900 + i })); // appended after page blocks, which are sorted by order
}

// ─── write ──────────────────────────────────────────────────────────────────
async function ensureTenant() {
  const { data: existing } = await sb.from("tenants").select("id").eq("slug", SLUG).maybeSingle();
  if (existing) return existing.id;
  const expiresAt = new Date(Date.now() + DEMO_HOURS * 3600_000).toISOString();
  const { data, error } = await sb.from("tenants").insert({
    name: SITE_NAME, slug: SLUG, plan: PLAN, status: "onboarded",
    owner_id: OWNER_ID, onboarding_completed: true,
    demo_expires_at: expiresAt, demo_created_by: OWNER_ID, demo_whatsapp: "6583362922",
  }).select("id").single();
  if (error) throw new Error(`tenant: ${error.message}`);
  const id = data.id;
  await sb.from("tenant_members").insert({ tenant_id: id, user_id: OWNER_ID, role: "owner" });
  await sb.from("subscriptions").upsert(
    { tenant_id: id, plan_id: PLAN, status: "onboarded", billing_cycle: "monthly", payment_method: "manual" },
    { onConflict: "tenant_id" },
  );
  await sb.from("contact_details").insert({
    tenant_id: id, label: "Main", phone: PHONE, whatsapp: "6583362922", email: EMAIL,
    address: null, is_primary: true, floating_whatsapp: true, sort_order: 0,
  });
  console.log("✓ tenant created", id, "demo until", expiresAt);
  return id;
}

async function run() {
  const tenantId = await ensureTenant();
  const now = new Date().toISOString();

  const { data: tpl } = await sb.from("templates").select("id").eq("slug", TEMPLATE_SLUG).single();

  const pages = [
    ["home", "Home", homePage(), "Home Maintenance & Renovation Singapore"],
    ["services", "Services", servicesPage(), `Services`],
    ["about", "About Us", aboutPage(), `About Us`],
    ["projects", "Projects", projectsPage(), `Projects`],
    ["faq", "FAQ", faqPage(), `FAQ`],
    ["contact", "Contact", contactPage(), `Contact Us`],
    ...SERVICES.map((s) => [`services/${s.slug}`, s.title, servicePage(s), `${s.title} Singapore`, s.short]),
  ];

  const keep = new Set(pages.map((p) => p[0]));
  const { data: existing } = await sb.from("pages").select("id, slug").eq("tenant_id", tenantId);
  for (const p of existing ?? []) if (!keep.has(p.slug)) await sb.from("pages").delete().eq("id", p.id);

  let i = 0;
  for (const [slug, title, blocks, seoTitle, seoDesc] of pages) {
    blocks.forEach((b, k) => { b.order = k; });
    const row = {
      title, blocks, status: "published", type: "page", order_index: i++, updated_at: now,
      draft_blocks: null,
      seo: { title: seoTitle, description: seoDesc ?? "Home maintenance and renovation in Singapore: electrical, plumbing, tiling, painting, carpentry, ceilings, waterproofing, brick walls, plastering and skim coat. Free quotes." },
    };
    const found = (existing ?? []).find((p) => p.slug === slug);
    const { error } = found
      ? await sb.from("pages").update(row).eq("id", found.id)
      : await sb.from("pages").insert({ ...row, tenant_id: tenantId, slug, created_at: now });
    console.log(error ? `✗ ${slug}: ${error.message}` : `  ✓ ${slug}`);
  }

  const { error: idErr } = await sb.from("site_identity").upsert({
    tenant_id: tenantId,
    template_id: tpl.id, active_template_slug: TEMPLATE_SLUG,
    site_name: SITE_NAME, tagline: SLOGAN,
    logo_url: LOGO_URL, logo_dark_url: LOGO_URL, logo_type: "image", logo_alt: SITE_NAME, logo_width: 200,
    favicon_url: FAVICON_URL,
    primary_color: GOLD, secondary_color: CHARCOAL,
    color_overrides: {
      primary: GOLD, primaryFg: CHARCOAL_DEEP, secondary: CHARCOAL, accent: GOLD_LIGHT, ring: GOLD,
      background: "#ffffff", foreground: "#1c1c1c", card: "#ffffff", muted: CREAM, mutedFg: "#5a5a5a",
      border: "#e8e2d6", borderRadius: "0.5rem",
    },
    design_overrides: { headingFont: "Montserrat", bodyFont: "Inter", headingWeight: "800", roundness: "soft", shadow: "normal" },
    global_header: globalHeader(), global_footer: globalFooter(), global_prefooter: prefooter(),
    updated_at: now,
  }, { onConflict: "tenant_id" });
  console.log(idErr ? `✗ site_identity: ${idErr.message}` : "✓ site_identity");

  await sb.from("nav_menus").upsert(
    { tenant_id: tenantId, name: "Main Navigation", location: "header", items: NAV_ITEMS, updated_at: now },
    { onConflict: "tenant_id,location" },
  );
  const { error: ssErr } = await sb.from("site_settings").upsert({
    tenant_id: tenantId, site_name: SITE_NAME,
    site_description: "Home maintenance and renovation in Singapore. Electrical, plumbing, tiling, painting, carpentry, ceilings, waterproofing, brick walls, plastering and skim coat.",
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Singapore", language: "en", maintenance_mode: false,
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
