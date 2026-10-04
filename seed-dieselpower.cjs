/**
 * Diesel Power Engineering Pte. Ltd. — marine engine overhauling, repair and
 * maintenance, Singapore (UEN 202041733K, founded 2020).
 * Pro-plan demo at dieselpower.passivecoder.com. English only. All content is
 * taken from the client's company profile (clients/Diesel Power Engineering/
 * Company Presentation.pdf), and every photo is the client's own project or
 * workshop photo extracted from that deck. The deck had no logo, so the logo is
 * a vector build (clients/Diesel Power Engineering/build-logo.cjs) in the
 * deck's teal / yellow / olive palette.
 * Safe to re-run. --skip-assets skips uploads.
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://mljchiaabgvdzdsfobxs.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI";
const OWNER_ID = "2ec0befe-7aa8-4a89-acc4-b9fe9250bcf4"; // walibdpro — demo creator
const SLUG = "dieselpower";
const PLAN = "pro";
const TEMPLATE_SLUG = "cleaning-simple"; // empty custom_css, so our palette wins
const DEMO_HOURS = 72; // demos always 72h (matches src/modules/demo/links.ts)
const ASSET_DIR = "Diesel Power Engineering";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let _c = 0;
function uid(p) { return `${p}-${(++_c).toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Brand ──────────────────────────────────────────────────────────────────
const SITE_NAME = "Diesel Power Engineering Pte. Ltd.";
const SHORT = "Diesel Power Engineering";
const UEN = "202041733K";
const PHONE = "+6593761286";
const PHONE_DISPLAY = "+65 9376 1286";
const WA_NUMBER = "6593761286";
const EMAIL = "dalim@dieselpower.com.sg";
const ADDRESS = "5 Soon Lee Street, Pioneer Point, #04-42, Singapore 627607";
const MAP_EMBED = "https://www.google.com/maps?q=5%20Soon%20Lee%20Street%2C%20Pioneer%20Point%2C%20Singapore%20627607&z=15&output=embed";
const MAP_LINK = "https://www.google.com/maps?q=5%20Soon%20Lee%20Street%2C%20Pioneer%20Point%2C%20Singapore%20627607";
const waText = (t) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(t)}`;
const WA = waText("Hello Diesel Power Engineering, I would like to discuss a repair job.");

const TEAL = "#1D7A8A";      // primary, from the deck's teal bars
const DEEP = "#0E2F38";      // deep marine
const YEL = "#F5B800";       // deck yellow accent
const GREEN = "#7FA33A";     // deck olive accent
const INK = "#10232A";
const PAPER = "#FFFFFF";
const MIST = "#EFF5F6";      // alternate band
const LINE = "#D5E3E6";
const MUTED = "#4B5F66";
const HF = `"Space Grotesk",sans-serif`;

const STORAGE_DIR = `uploads/${SLUG}`;
const A = (name) => `${SUPABASE_URL}/storage/v1/object/public/media/${STORAGE_DIR}/${name}`;
const LOGO = A("dpe-logo.png");
const LOGO_LIGHT = A("dpe-logo-light.png");
const FAVICON_URL = A("favicon.png");
const I = (n) => A(`${n}.jpg`);

// ─── Services (wording follows the company profile) ─────────────────────────
const SERVICES = [
  {
    slug: "engine-overhauling", icon: "Cog", title: "Engine Overhauling", img: I("overhaul-line"),
    short: "Low, medium and high-speed main and auxiliary engines overhauled, repaired and maintained.",
    intro: "We overhaul, repair and maintain low-speed, medium-speed and high-speed diesel engines on ships, rigs and industrial sites. Main engines and auxiliary / generator engines are handled by engineers trained to OEM standards, on board or in our Pioneer workshop.",
    includes: [
      ["Ship", "Main engine overhauling", "Complete or partial overhauls of propulsion engines."],
      ["Zap", "Auxiliary / generator engines", "Major and top overhauls of AE and genset engines."],
      ["Search", "Inspection & investigation", "Fault finding and condition reports before work starts."],
      ["Layers", "Cylinder heads & liners", "Heads, valves, liners and piston assemblies reconditioned."],
      ["Wrench", "Running gear", "Connecting rods, bearings and crankshaft checks."],
      ["ClipboardCheck", "Test run & handover", "Engine trial and job report on completion."],
    ],
    tags: ["Main engines", "Auxiliary engines", "Generator engines", "Major overhaul", "Top overhaul", "Cummins KTA19", "Weichai X6170"],
    steps: [
      ["Job scope", "Send the vessel, engine maker, model and the fault or running hours."],
      ["Inspection", "Our engineers inspect and confirm the scope and spares needed."],
      ["Overhaul", "On-board or workshop overhaul by our own team."],
      ["Trial & report", "Engine trial run and a written job report."],
    ],
    faq: [
      ["Which engine makers do you work on?", "Cummins, Weichai, Daihatsu, Yanmar, Mitsubishi, MAN Energy Solutions, Caterpillar, MTU, Rolls-Royce and Wärtsilä engines, among others."],
      ["Can you overhaul the engine on board?", "Yes. Our mobile teams carry out overhauls on board at berth or at anchorage, and components can be brought to our workshop where needed."],
      ["Do you also supply the spares?", "Yes. We supply new and reconditioned engine components for the overhaul."],
    ],
    gallery: [I("cummins-ae"), I("head-bench"), I("conrods")],
  },
  {
    slug: "auxiliary-machinery", icon: "Settings", title: "Auxiliary Machinery", img: I("cummins-block"),
    short: "Turbochargers, pumps, compressors, boilers and hydraulic equipment overhauled.",
    intro: "Auxiliary machinery keeps the engine room running. We overhaul turbochargers, pumps, compressors and boilers, and hydraulic equipment including cylinders, power packs, motors and control valves.",
    includes: [
      ["Fan", "Turbochargers", "Dismantling, cleaning, inspection and rebuild."],
      ["Droplets", "Pumps", "Overhaul, repair, alignment and installation."],
      ["Gauge", "Compressors", "Air compressor overhaul and valve work."],
      ["Flame", "Boilers", "Boiler overhaul and repair support."],
      ["Cylinder", "Hydraulic cylinders", "Seal kits, rod and barrel repair."],
      ["SlidersHorizontal", "Power packs & control valves", "Hydraulic power packs, motors and valves overhauled."],
    ],
    tags: ["Turbochargers", "Compressors", "Boilers", "Heat exchangers", "Hydraulic power packs", "Control valves"],
    steps: [
      ["Tell us the unit", "Maker, model and the problem on WhatsApp or email."],
      ["Inspect", "On-board inspection or collection to our workshop."],
      ["Overhaul", "Repair, replace worn parts and reassemble."],
      ["Test", "Function test and return to service."],
    ],
    faq: [
      ["Do you overhaul hydraulic equipment?", "Yes. Hydraulic cylinders, power packs, motors and control valves."],
      ["Can units be repaired in your workshop?", "Yes. Our Pioneer workshop has lifting facilities and space for machinery servicing."],
      ["Do you supply replacement auxiliary machinery?", "Yes. We supply pumps, compressors, boilers, air-con units and heat exchangers."],
    ],
    gallery: [I("cooler"), I("hydraulic"), I("valve-gear")],
  },
  {
    slug: "anchorage-voyage-repairs", icon: "Anchor", title: "Anchorage & Voyage Repairs", img: I("tanker-charge"),
    short: "Machinery overhauls and troubleshooting while your vessel is at anchorage or under way.",
    intro: "Time at anchorage is expensive. Our rapid-response mobile teams board vessels at Singapore anchorages, and can sail with the ship, to overhaul engines and auxiliary machinery and to supervise and troubleshoot machinery faults without taking the vessel off hire.",
    includes: [
      ["Cog", "Engine & machinery overhauls", "Engine and auxiliary machinery overhauled on board."],
      ["Search", "Troubleshooting", "Diagnosis of machinery faults on site."],
      ["UserCheck", "Supervision", "Engineers supervising repairs by ship's crew."],
      ["Clock", "Rapid mobilisation", "Mobile teams ready to board at short notice."],
    ],
    tags: ["Singapore anchorages", "Voyage repairs", "Riding squads", "Tankers", "Gas carriers", "Bunker vessels"],
    steps: [
      ["Call us", "Vessel, location, ETA and the fault."],
      ["Mobilise", "Team and tools arranged for boarding."],
      ["Repair on board", "Overhaul or troubleshooting at anchorage or on voyage."],
      ["Report", "Job report for the superintendent."],
    ],
    faq: [
      ["Can your team sail with the vessel?", "Yes. We carry out voyage repairs as well as anchorage jobs."],
      ["How quickly can you board?", "Our mobile response team is available 24/7. Call us with the vessel's location and ETA."],
      ["Do you work with ship managers?", "Yes. Our clients include ship managers, owners and bunker operators in Singapore."],
    ],
    gallery: [I("engine-room"), I("orange-engine"), I("engine-top")],
  },
  {
    slug: "deck-machinery", icon: "Ship", title: "Deck Machinery", img: I("tanker-sea"),
    short: "Winches, cranes and other mechanical equipment supervised, repaired and maintained.",
    intro: "We repair and maintain deck machinery and other mechanical equipment, with engineers supervising and troubleshooting winches, cranes, mooring equipment and davits.",
    includes: [
      ["Anchor", "Winches & mooring equipment", "Supervision, troubleshooting and repair."],
      ["Construction", "Cranes & davits", "Mechanical and hydraulic fault finding."],
      ["Cylinder", "Deck hydraulics", "Cylinders, hoses, power packs and valves."],
      ["Wrench", "Other mechanical equipment", "Any other mechanical equipment on board."],
    ],
    tags: ["Winches", "Mooring equipment", "Cranes", "Davits", "Hydraulic systems"],
    steps: [
      ["Describe the fault", "Equipment, maker and symptoms."],
      ["Troubleshoot", "Our engineer inspects and finds the cause."],
      ["Repair", "Repair or overhaul, with spares if needed."],
    ],
    faq: [
      ["Do you repair cranes and davits?", "Yes. We supervise and troubleshoot cranes, davits and winches."],
      ["Can you supply deck equipment?", "Yes. We supply winches, mooring equipment, cranes and davits."],
      ["Do you work on hydraulic deck systems?", "Yes. Power packs, cylinders, control valves and hoses."],
    ],
    gallery: [I("tanker-rose"), I("hydraulic"), I("workshop-lift")],
  },
  {
    slug: "pump-repair", icon: "Droplets", title: "Pump Repair & Maintenance", img: I("pump-align"),
    short: "Pump overhauling, repair, alignment and installation.",
    intro: "Pumps are some of the hardest-working machines on board. We overhaul, repair and maintain marine and industrial pumps, align them to their drivers and install new units.",
    includes: [
      ["RotateCw", "Overhauling", "Full strip-down, inspection and rebuild."],
      ["Wrench", "Repair & maintenance", "Seals, bearings, impellers and sleeves."],
      ["Ruler", "Alignment", "Pump-to-motor alignment after repair."],
      ["PackageCheck", "Installation", "New pump installation and commissioning."],
    ],
    tags: ["Centrifugal pumps", "Cargo pumps", "Cooling water pumps", "Fuel & lube oil pumps", "Industrial pumps"],
    steps: [
      ["Send details", "Pump maker, model and the fault."],
      ["Inspect", "On board or in our workshop."],
      ["Overhaul & align", "Rebuild, align and test."],
    ],
    faq: [
      ["Do you machine pump parts?", "Yes. Shafts, sleeves and bushes are machined in-house."],
      ["Can you align the pump after repair?", "Yes. We use conventional methods or advanced alignment equipment."],
      ["Do you supply new pumps?", "Yes. New and reconditioned pumps can be supplied."],
    ],
    gallery: [I("coupling"), I("cooler"), I("workshop-1")],
  },
  {
    slug: "machining", icon: "Hammer", title: "Machining & Fabrication", img: I("crank-2"),
    short: "Shafts, bushes, sleeves, liners and gears fabricated and machined. Grinding and chrome plating.",
    intro: "Our workshop fabricates and machines shafts, bushes, sleeves, liners and gears, machines auxiliary machinery parts, and offers precision machining, grinding and chrome plating.",
    includes: [
      ["Cog", "Shafts, bushes & sleeves", "Fabrication and machining to size."],
      ["Layers", "Liners & gears", "Machined and reconditioned."],
      ["Settings", "Auxiliary machinery parts", "Machining for pumps, compressors and more."],
      ["Gem", "Precision machining & grinding", "Tight tolerances on critical parts."],
      ["Sparkles", "Chrome plating", "Wear surfaces restored."],
      ["Construction", "Piping & structural fabrication", "Fabrication work in our workshop."],
    ],
    tags: ["Shafts", "Bushes", "Sleeves", "Liners", "Gears", "Grinding", "Chrome plating"],
    steps: [
      ["Send a drawing or sample", "Drawing, photo or the worn part."],
      ["Quote", "Material, tolerance and lead time confirmed."],
      ["Machine", "Machined and inspected in our workshop."],
    ],
    faq: [
      ["Can you make a part without a drawing?", "Yes. Send us the worn part and we measure it."],
      ["Do you do chrome plating?", "Yes. Precision machining, grinding and chrome plating."],
      ["Do you do piping fabrication?", "Yes. Our workshop has resources for piping and structural fabrication."],
    ],
    gallery: [I("crank-1"), I("liner"), I("workshop-2")],
  },
  {
    slug: "spares-supply", icon: "Package", title: "Spares & Equipment Supply", img: I("heads-grid"),
    short: "New and reconditioned engine parts, auxiliary machinery, deck and hydraulic equipment.",
    intro: "We supply spares and equipment for engines, auxiliary machinery, deck and hydraulic systems: new and reconditioned engines and components, pumps, compressors, boilers, air-con units, heat exchangers, winches, mooring equipment, cranes, davits and hydraulic power packs, cylinders, valves and hoses.",
    includes: [
      ["Cog", "Engines & components", "New and reconditioned engines and parts."],
      ["Settings", "Auxiliary machinery", "Pumps, compressors, boilers, air-con, heat exchangers."],
      ["Anchor", "Deck equipment", "Winches, mooring equipment, cranes and davits."],
      ["Cylinder", "Hydraulic equipment", "Power packs, cylinders, control valves and hoses."],
    ],
    tags: ["Cylinder heads", "Connecting rods", "Liners", "Pumps", "Compressors", "Heat exchangers", "Hoses"],
    steps: [
      ["Send the list", "Part numbers, maker and model."],
      ["Offer", "Availability, condition (new or reconditioned) and delivery."],
      ["Delivery", "Delivered to the vessel or your workshop."],
    ],
    faq: [
      ["Do you supply reconditioned parts?", "Yes. Various types of new and reconditioned engines and components."],
      ["Can you deliver to the vessel?", "Yes. Tell us the vessel and location."],
      ["Do you supply deck and hydraulic equipment?", "Yes. Winches, cranes, davits, power packs, cylinders, valves and hoses."],
    ],
    gallery: [I("conrods"), I("heads-pair"), I("cyl-head")],
  },
  {
    slug: "alignment", icon: "Ruler", title: "Alignment", img: I("coupling"),
    short: "Inline, positioning and directional alignment by conventional methods or advanced equipment.",
    intro: "Misalignment destroys bearings, seals and couplings. We align shafts, engines, pumps and motors using conventional methods or advanced alignment equipment.",
    includes: [
      ["MoveHorizontal", "Inline alignment", "Shaft and coupling alignment."],
      ["Crosshair", "Positioning alignment", "Machinery positioned on its foundation."],
      ["Compass", "Directional alignment", "Alignment of drive lines."],
      ["Ruler", "Conventional or laser", "Dial gauge methods or advanced equipment."],
    ],
    tags: ["Pumps & motors", "Generators", "Shafting", "Couplings", "After overhaul", "New installations"],
    steps: [
      ["Check", "Measure the current alignment."],
      ["Correct", "Shim and adjust to tolerance."],
      ["Record", "Final readings recorded for you."],
    ],
    faq: [
      ["Which alignment methods do you use?", "Conventional methods and advanced alignment equipment, depending on the job."],
      ["Do you align after a pump or motor overhaul?", "Yes. Alignment is part of our pump and machinery work."],
      ["Do you give the readings?", "Yes. Final readings are recorded for your files."],
    ],
    gallery: [I("pump-align"), I("crank-3"), I("workshop-1")],
  },
  {
    slug: "calibration", icon: "Gauge", title: "Calibration", img: I("crank-3"),
    short: "Measurement and calibration of engine and machinery components.",
    intro: "Accurate measurement decides whether a part goes back in or gets replaced. We measure and calibrate engine and machinery components, including crankshafts, journals and bearings, during overhauls and inspections.",
    includes: [
      ["Gauge", "Component measurement", "Crankshafts, journals, liners and bearings."],
      ["Ruler", "Clearances & tolerances", "Checked against maker's limits."],
      ["ClipboardCheck", "Records", "Measurement sheets for your files."],
    ],
    tags: ["Crankshafts", "Journals", "Bearings", "Liners", "Overhaul inspections"],
    steps: [
      ["Measure", "Components measured on board or in the workshop."],
      ["Compare", "Readings compared with maker's limits."],
      ["Advise", "Reuse, recondition or replace."],
    ],
    faq: [
      ["Can calibration be done during an overhaul?", "Yes. Measurements are taken as part of our overhaul work."],
      ["Do you provide measurement records?", "Yes. Readings are recorded and handed over."],
      ["Can you recondition out-of-limit parts?", "Many parts can be machined, ground or chrome plated in our workshop."],
    ],
    gallery: [I("crank-1"), I("crank-2"), I("valve-gear")],
  },
  {
    slug: "commissioning", icon: "PlayCircle", title: "Commissioning", img: I("commissioning"),
    short: "Ship systems and machinery: installation supervision, startup and commissioning.",
    intro: "We commission ship systems and machinery, supervise installation, and start up and commission engine room and deck machinery and equipment.",
    includes: [
      ["Ship", "Ship systems & machinery", "Commissioning of on-board systems."],
      ["UserCheck", "Installation supervision", "Engineers supervising installation work."],
      ["PlayCircle", "Startup & commissioning", "Engine room and deck machinery started up and tested."],
    ],
    tags: ["Engine room", "Deck machinery", "New installations", "After major overhaul", "Repowering"],
    steps: [
      ["Plan", "Review the installation and the checks needed."],
      ["Supervise", "Installation supervised by our engineers."],
      ["Start up", "Startup, testing and handover."],
    ],
    faq: [
      ["Do you supervise installation by other contractors?", "Yes. We provide supervision of installation."],
      ["Do you commission deck machinery as well?", "Yes. Engine room and deck machinery and equipment."],
      ["Do you follow Class requirements?", "Our work is carried out in compliance with Class Society standards."],
    ],
    gallery: [I("engine-room"), I("ae-engine"), I("engine-top")],
  },
];
const svcUrl = (s) => `/services/${s.slug}`;

const MAKERS = ["Cummins", "Weichai", "Daihatsu", "Yanmar", "Mitsubishi", "MAN Energy Solutions", "Caterpillar", "MTU", "Rolls-Royce", "Wärtsilä"];
const CLIENTS = [
  ["V-Bunkers", ["Marine Selina", "Marine Bella", "Marine Juwel", "Marine Zambezi", "Marine Yangtze", "Marine Charge", "Marine Rose"]],
  ["BW Epic Kosan", ["Alexandra Kosan", "Epic Beans", "Epic Borinquen", "Epic Sentosa", "Isabella Kosan", "Leonora Kosan", "Victoria Kosan"]],
  ["Golden Island Pte Ltd", ["MT Golden Pioneer", "MT Golden Bristol", "MT Golden Aranda"]],
  ["Maxwell Ship Management", ["Hy Jade", "Hy Champion"]],
  ["Kosmos Maritime", ["Kosmos Citrine", "Kosmos Lily"]],
  ["BSM Singapore", ["Rostella", "Asian Lion"]],
  ["Shipping Corporation of India", ["Swarna Kalash", "Swarna Jayanti"]],
];
const VESSEL_COUNT = CLIENTS.reduce((n, [, v]) => n + v.length, 0);
const FEATURED = [
  ["Marine Selina", "Cummins KTA19", "Major overhaul, auxiliary engines No. 1, 2 & 3", I("cummins-ae")],
  ["Marine Bella", "Cummins KTA19", "Inspection, investigation & overhaul, AE No. 1 & 3", I("overhaul-line")],
  ["Marine Juwel", "Cummins KTA19", "Inspection, investigation & overhaul, AE No. 1 & 3", I("orange-engine")],
  ["Marine Rose", "Weichai X6170ZE 02A", "Top overhaul, AE No. 2", I("heads-grid")],
  ["Marine Zambezi", "Weichai X6170ZE 02A", "Top overhaul, AE No. 2", I("valve-gear")],
  ["Marine Charge", "Weichai X6170ZE 02A", "Top overhaul, AE No. 2", I("conrods")],
];

// ─── shared block helpers ───────────────────────────────────────────────────
const ZERO = { top: 0, right: 0, bottom: 0, left: 0 };
const BASE = { visible: true, width: "full", padding: { top: 88, right: 24, bottom: 88, left: 24 }, margin: ZERO, background: { type: "none" } };
const bgColor = (color) => ({ type: "color", color });

const PAGES = [
  ["home", "Home", "/"],
  ["services", "Services", "/services"],
  ...SERVICES.map((s) => [`services/${s.slug}`, s.title, svcUrl(s), true]),
  ["projects", "Projects", "/projects"],
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
    padding: ZERO, margin: ZERO, background: bgColor(PAPER),
    data: {
      logoText: SITE_NAME, logo: LOGO, items: navItems(),
      sticky: true, transparent: false, style: "default", showCart: false,
      backgroundColor: PAPER, textColor: INK, colorMode: "legacy", activeColor: TEAL, ctaVariant: "solid", logoHeight: 50, logoCaption: "",
      showCta: true, ctaLabel: "Request Service", ctaUrl: WA,
    },
  };
}

const CHECK = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const ARROW = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
const ICO = {
  phone: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  wa: `<svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor"><path d="M16 0C7.2 0 0 7.2 0 16c0 2.8.7 5.5 2 7.8L0 32l8.5-2A16 16 0 1 0 16 0zm7.3 19.3c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7l-1.2-3c-.3-.8-.7-.7-.9-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.3s1.4 3.9 1.6 4.1c.2.3 2.8 4.3 6.8 6 1 .4 1.7.7 2.3.8 1 .3 1.8.3 2.5.2.8-.1 2.4-1 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.2-.4-.3-.8-.5z"/></svg>`,
};
const NUM = (i) => String(i + 1).padStart(2, "0");
const html = (id, markup, css, bg = PAPER, pad = ZERO) => ({ ...BASE, id: uid(id), type: "custom_html", templateVariant: `dpe-${id}`, padding: pad, background: bgColor(bg), data: { html: markup, css } });

const BASE_CSS = `.dpe-wrap{max-width:78rem;margin:0 auto;padding:0 24px}
.dpe-eyebrow{display:inline-flex;align-items:center;gap:10px;font-size:.75rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:${TEAL};margin-bottom:12px}
.dpe-eyebrow::before{content:"";width:28px;height:3px;background:${YEL}}
.dpe-h2{font-family:${HF};font-weight:700;font-size:clamp(1.9rem,3.2vw,2.7rem);line-height:1.1;letter-spacing:-.02em;color:${INK}}
.dpe-lede{color:${MUTED};font-size:1.05rem;line-height:1.65;margin-top:12px}
.dpe-btn{display:inline-flex;align-items:center;gap:10px;padding:15px 24px;border-radius:6px;font-weight:700;font-size:.96rem;text-decoration:none;line-height:1}
.dpe-btn-y{background:${YEL};color:${DEEP}}.dpe-btn-y:hover{background:#FFC929;transform:translateY(-2px)}
.dpe-btn-t{background:${TEAL};color:#fff}.dpe-btn-t:hover{background:#176674}
.dpe-btn-o{border:1.5px solid rgba(255,255,255,.45);color:#fff}.dpe-btn-o:hover{background:rgba(255,255,255,.1)}
.dpe-ctas{display:flex;flex-wrap:wrap;gap:12px}`;

function topBar() {
  return {
    id: uid("top"), type: "custom_html", order: 0, visible: true, width: "full", padding: ZERO, margin: ZERO, background: bgColor(DEEP),
    data: {
      html: `<div class="dpe-top"><div class="dpe-top-in">
  <div class="dpe-top-l"><span>${ICO.pin} Pioneer Point, Singapore</span><span class="dpe-hide">${ICO.clock} 24/7 mobile response team</span><span class="dpe-hide">UEN ${UEN}</span></div>
  <div class="dpe-top-r"><a href="mailto:${EMAIL}" class="dpe-hide">${ICO.mail} ${EMAIL}</a><a href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a><a href="${WA}" class="dpe-top-wa">${ICO.wa} WhatsApp</a></div>
</div></div>`,
      css: `.dpe-top{background:${DEEP};color:#BFD6DB;font-size:.82rem;border-bottom:3px solid ${YEL}}
.dpe-top-in{max-width:80rem;margin:0 auto;padding:9px 24px;display:flex;justify-content:space-between;gap:16px;align-items:center}
.dpe-top-l,.dpe-top-r{display:flex;gap:22px;align-items:center}
.dpe-top span,.dpe-top a{display:inline-flex;align-items:center;gap:7px;color:inherit;text-decoration:none;white-space:nowrap}
.dpe-top a:hover{color:#fff}
.dpe-top-wa{background:#25D366;color:#fff!important;padding:5px 12px;border-radius:4px;font-weight:700}
@media(max-width:900px){.dpe-hide{display:none!important}.dpe-top-in{padding:8px 16px}}`,
    },
  };
}

function floatingWhatsApp() {
  return {
    id: uid("wa"), type: "custom_html", order: 0, visible: true, width: "full", padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      html: `<a class="dpe-wa" href="${WA}" target="_blank" rel="noopener noreferrer" aria-label="Chat with Diesel Power Engineering on WhatsApp">${ICO.wa.replace(/width="16" height="16"/, 'width="28" height="28"')}</a>`,
      css: `.dpe-wa{position:fixed;right:20px;bottom:20px;z-index:9990;width:56px;height:56px;border-radius:9999px;background:#25D366;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.28);transition:transform .15s ease}.dpe-wa:hover{transform:scale(1.06)}@media(max-width:640px){.dpe-wa{right:14px;bottom:14px;width:52px;height:52px}}a,button{transition:background-color .2s,color .2s,border-color .2s,box-shadow .2s,transform .2s}`,
    },
  };
}

function footer() {
  return {
    id: uid("footer"), type: "footer", order: 1, visible: true, width: "full", padding: ZERO, margin: ZERO, background: { type: "none" },
    data: {
      logo: LOGO_LIGHT, logoText: SITE_NAME, logoCaption: `UEN ${UEN} · Singapore`,
      tagline: "Marine engine overhauling, repair and maintenance for ships, rigs and industry. Singapore and global maritime routes.",
      style: "dark", backgroundColor: DEEP, accentColor: YEL, textColor: "#BFD6DB",
      copyrightText: `© {year} ${SITE_NAME}. UEN ${UEN}. All rights reserved.`, copyrightYear: true, showNewsletter: false,
      socials: [{ platform: "whatsapp", url: WA }],
      columns: [
        { id: uid("fc"), heading: "Services", links: SERVICES.slice(0, 6).map((s) => ({ id: uid("fl"), label: s.title, url: svcUrl(s) })) },
        { id: uid("fc"), heading: "Company", links: [...TOP_PAGES.map(([, label, url]) => ({ id: uid("fl"), label, url })), ...SERVICES.slice(6).map((s) => ({ id: uid("fl"), label: s.title, url: svcUrl(s) }))] },
        { id: uid("fc"), heading: "Contact", links: [
          { id: uid("fl"), label: `Call ${PHONE_DISPLAY}`, url: `tel:${PHONE}` },
          { id: uid("fl"), label: `WhatsApp ${PHONE_DISPLAY}`, url: WA },
          { id: uid("fl"), label: EMAIL, url: `mailto:${EMAIL}` },
          { id: uid("fl"), label: "5 Soon Lee Street, #04-42, Singapore 627607", url: MAP_LINK },
        ]},
      ],
      bottomLinks: [],
    },
  };
}

// ─── home sections ──────────────────────────────────────────────────────────
function heroDiesel() {
  const creds = [["2020", "Founded in Singapore"], ["ISO 9001", "Quality management"], ["ISO 45001", "Occupational health & safety"], ["bizSAFE Star", "Workplace safety & health"]];
  return html("hero", `<section class="dpe-hero"><img class="dpe-hero-bg" src="${I("engine-room")}" alt="" aria-hidden="true"/><div class="dpe-wrap dpe-hero-g">
  <div class="dpe-hero-c">
    <span class="dpe-eyebrow dpe-ey-l">Marine engine specialists · Singapore</span>
    <h1>Engine overhauls and machinery repairs that keep your vessel <em>on schedule.</em></h1>
    <p>Low, medium and high-speed engines, auxiliary and deck machinery, pumps, machining and spares. On board at anchorage, on voyage, or in our Pioneer workshop.</p>
    <div class="dpe-ctas"><a class="dpe-btn dpe-btn-y" href="${WA}">${ICO.wa} Request service</a><a class="dpe-btn dpe-btn-o" href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a></div>
  </div>
  <aside class="dpe-cred"><div class="dpe-cred-img"><img src="${I("workshop-lift")}" alt="Crankshaft lifted in the Diesel Power Engineering workshop"/></div>
    <ul>${creds.map(([a, b]) => `<li><strong>${a}</strong><span>${b}</span></li>`).join("")}</ul></aside>
</div></section>`, `${BASE_CSS}
.dpe-hero{position:relative;background:${DEEP};padding:96px 0 104px;overflow:hidden}
.dpe-hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.28;filter:grayscale(.3)}
.dpe-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,${DEEP} 25%,rgba(14,47,56,.75) 60%,rgba(29,122,138,.35))}
.dpe-hero-g{position:relative;z-index:1;display:grid;grid-template-columns:1.2fr .8fr;gap:56px;align-items:center}
.dpe-ey-l{color:#8FD0DA}
.dpe-hero h1{font-family:${HF};font-weight:700;font-size:clamp(2.3rem,4.6vw,3.8rem);line-height:1.06;letter-spacing:-.025em;color:#fff;margin:6px 0 20px}
.dpe-hero h1 em{font-style:normal;color:${YEL}}
.dpe-hero p{color:#C9DDE1;font-size:1.12rem;line-height:1.7;max-width:36rem;margin-bottom:30px}
.dpe-cred{background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(0,0,0,.6)}
.dpe-cred-img{aspect-ratio:4/3;overflow:hidden}.dpe-cred-img img{width:100%;height:100%;object-fit:cover;display:block}
.dpe-cred ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr}
.dpe-cred li{padding:16px 18px;border-top:1px solid ${LINE}}.dpe-cred li:nth-child(odd){border-right:1px solid ${LINE}}
.dpe-cred strong{display:block;font-family:${HF};font-weight:700;color:${TEAL};font-size:1.1rem}.dpe-cred span{font-size:.8rem;color:${MUTED}}
@media(max-width:960px){.dpe-hero-g{grid-template-columns:1fr;gap:40px}.dpe-hero{padding:64px 0 72px}}`, DEEP);
}

function makersStrip(bg = PAPER) {
  return html("mk", `<section class="dpe-mk"><div class="dpe-wrap dpe-mk-g"><p>Experienced on engines from</p><ul>${MAKERS.map((m) => `<li>${m}</li>`).join("")}</ul></div></section>`,
    `.dpe-mk{padding:34px 0;border-bottom:1px solid ${LINE}}
.dpe-mk-g{display:flex;gap:28px;align-items:center}
.dpe-mk p{flex:none;font-size:.78rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:${MUTED};max-width:9rem;line-height:1.4}
.dpe-mk ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:10px 26px}
.dpe-mk li{font-family:${HF};font-weight:700;font-size:1.1rem;color:${DEEP};opacity:.8}
@media(max-width:760px){.dpe-mk-g{flex-direction:column;align-items:flex-start;gap:14px}.dpe-mk p{max-width:none}}`, bg);
}

function servicesIndex(bg = MIST, title = "Ten services. One engineering team.") {
  return html("svi", `<section class="dpe-si"><div class="dpe-wrap">
  <div class="dpe-si-h"><div><span class="dpe-eyebrow">What we do</span><h2 class="dpe-h2">${title}</h2></div><p class="dpe-lede">From a full main engine overhaul to a single machined bush, the same engineers handle your job from inspection to handover.</p></div>
  <div class="dpe-si-g">${SERVICES.map((s, i) => `<a href="${svcUrl(s)}" class="dpe-si-c"><div class="dpe-si-img"><img src="${s.img}" alt="${s.title}" loading="lazy"/></div><div class="dpe-si-b"><span>${NUM(i)}</span><h3>${s.title}</h3><p>${s.short}</p></div><i>${ARROW}</i></a>`).join("")}</div>
</div></section>`, `${BASE_CSS}.dpe-si{padding:96px 0}
.dpe-si-h{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:end;margin-bottom:44px}
.dpe-si-g{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.dpe-si-c{display:grid;grid-template-columns:120px 1fr 28px;gap:20px;align-items:center;background:#fff;border:1px solid ${LINE};border-radius:10px;padding:12px 20px 12px 12px;text-decoration:none;color:${INK}}
.dpe-si-c:hover{border-color:${TEAL};box-shadow:0 18px 40px -24px rgba(14,47,56,.5)}
.dpe-si-img{width:120px;height:96px;border-radius:6px;overflow:hidden}.dpe-si-img img{width:100%;height:100%;object-fit:cover}
.dpe-si-b span{font-family:${HF};font-weight:700;color:${GREEN};font-size:.82rem}
.dpe-si-b h3{font-family:${HF};font-weight:700;font-size:1.15rem;margin:2px 0 4px}
.dpe-si-b p{color:${MUTED};font-size:.9rem;line-height:1.5}
.dpe-si-c i{color:${TEAL}}
@media(max-width:960px){.dpe-si-g{grid-template-columns:1fr}.dpe-si-h{grid-template-columns:1fr;gap:8px}}
@media(max-width:520px){.dpe-si-c{grid-template-columns:84px 1fr;padding-right:14px}.dpe-si-img{width:84px;height:84px}.dpe-si-c i{display:none}.dpe-si{padding:64px 0}}`, bg);
}

function capabilitiesBento(bg = PAPER) {
  const caps = [
    ["Skilled engineers trained in OEM standards", "Our own engineers and technicians, trained to the engine makers' procedures."],
    ["Custom diagnostic and repair solutions", "We investigate the root cause before we replace parts."],
    ["Fully equipped in-house workshop", "Lifting facility, machining, and space for machinery servicing and fabrication."],
    ["Rapid response mobile engineering teams", "24/7 teams for anchorage, berth and voyage repairs."],
    ["Compliance with Class Society standards", "Work carried out to Class requirements."],
  ];
  return html("cap", `<section class="dpe-cap"><div class="dpe-wrap">
  <div class="dpe-cap-h"><span class="dpe-eyebrow">Unique capabilities</span><h2 class="dpe-h2">Why ship managers call us first</h2></div>
  <div class="dpe-cap-g">
    <div class="dpe-cap-p dpe-cap-p1"><img src="${I("workshop-1")}" alt="Diesel Power Engineering workshop" loading="lazy"/></div>
    ${caps.map(([t, d], i) => `<div class="dpe-cap-c dpe-cap-c${i}"><b>${NUM(i)}</b><h3>${t}</h3><p>${d}</p></div>`).join("")}
    <div class="dpe-cap-p dpe-cap-p2"><img src="${I("head-bench")}" alt="Cylinder head on the workbench" loading="lazy"/></div>
  </div>
</div></section>`, `${BASE_CSS}.dpe-cap{padding:96px 0}
.dpe-cap-h{margin-bottom:40px}
.dpe-cap-g{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(190px,auto);gap:16px}
.dpe-cap-p{border-radius:10px;overflow:hidden}.dpe-cap-p img{width:100%;height:100%;object-fit:cover;display:block}
.dpe-cap-p1{grid-column:span 2;grid-row:span 2}
.dpe-cap-c{background:${MIST};border-radius:10px;padding:24px;border-top:4px solid ${TEAL}}
.dpe-cap-c0{background:${DEEP};border-top-color:${YEL}}.dpe-cap-c0 h3{color:#fff!important}.dpe-cap-c0 p{color:#BFD6DB!important}
.dpe-cap-c b{font-family:${HF};color:${GREEN};font-size:.85rem}
.dpe-cap-c h3{font-family:${HF};font-weight:700;font-size:1.12rem;color:${INK};margin:8px 0 8px;line-height:1.25}
.dpe-cap-c p{color:${MUTED};font-size:.92rem;line-height:1.55}
.dpe-cap-p2{grid-column:span 3;max-height:260px}
@media(max-width:960px){.dpe-cap-g{grid-template-columns:1fr 1fr}.dpe-cap-p1{grid-column:span 2;grid-row:span 1;height:260px}.dpe-cap-p2{grid-column:span 1}}
@media(max-width:560px){.dpe-cap-g{grid-template-columns:1fr}.dpe-cap-p1{grid-column:auto}.dpe-cap{padding:64px 0}}`, bg);
}

function projectsFeatured(bg = DEEP, title = "Recent engine work for V-Bunkers") {
  return html("prj", `<section class="dpe-pj"><div class="dpe-wrap">
  <div class="dpe-pj-h"><div><span class="dpe-eyebrow dpe-ey-l">Highlight projects</span><h2 class="dpe-h2" style="color:#fff">${title}</h2></div><a class="dpe-btn dpe-btn-y" href="/projects">All projects ${ARROW}</a></div>
  <div class="dpe-pj-g">${FEATURED.map(([v, eng, scope, img]) => `<article><div><img src="${img}" alt="${v} engine work" loading="lazy"/></div><h3>${v}</h3><dl><dt>Engine</dt><dd>${eng}</dd><dt>Scope</dt><dd>${scope}</dd></dl></article>`).join("")}</div>
</div></section>`, `${BASE_CSS}.dpe-pj{padding:96px 0}
.dpe-ey-l{color:#8FD0DA}
.dpe-pj-h{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:40px;flex-wrap:wrap}
.dpe-pj-g{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.dpe-pj article{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;overflow:hidden}
.dpe-pj article>div{aspect-ratio:16/10;overflow:hidden}.dpe-pj img{width:100%;height:100%;object-fit:cover;display:block}
.dpe-pj h3{font-family:${HF};font-weight:700;color:#fff;font-size:1.2rem;padding:18px 20px 6px}
.dpe-pj dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;padding:0 20px 20px;margin:0;font-size:.9rem}
.dpe-pj dt{color:${YEL};font-weight:700;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;padding-top:2px}.dpe-pj dd{color:#C9DDE1;margin:0}
@media(max-width:900px){.dpe-pj-g{grid-template-columns:1fr 1fr}}@media(max-width:560px){.dpe-pj-g{grid-template-columns:1fr}.dpe-pj{padding:64px 0}}`, bg);
}

function statsBand(bg = TEAL) {
  const items = [["2020", "Established in Singapore"], [`${VESSEL_COUNT}`, "Vessels in our reference list"], [`${MAKERS.length}`, "Engine makers worked on"], ["24/7", "Mobile response team"]];
  return html("stats", `<section class="dpe-st"><div class="dpe-wrap dpe-st-g">${items.map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join("")}</div></section>`,
    `.dpe-st{padding:52px 0}.dpe-wrap{max-width:78rem;margin:0 auto;padding:0 24px}
.dpe-st-g{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.dpe-st-g div{border-left:3px solid ${YEL};padding-left:20px}
.dpe-st strong{display:block;font-family:${HF};font-weight:700;font-size:clamp(2.1rem,3.8vw,3rem);color:#fff;line-height:1}
.dpe-st span{display:block;margin-top:8px;color:#D6EEF1;font-weight:600;font-size:.92rem}
@media(max-width:760px){.dpe-st-g{grid-template-columns:1fr 1fr;row-gap:28px}}`, bg);
}

function certifications(bg = PAPER) {
  const certs = [["ISO 9001", "Quality Management System", I("cert-iso9001")], ["ISO 45001", "Occupational Health & Safety Management System", I("cert-iso45001")], ["bizSAFE Star", "Workplace Safety & Health", I("cert-bizsafe")]];
  return html("cert", `<section class="dpe-ce"><div class="dpe-wrap dpe-ce-g">
  <div><span class="dpe-eyebrow">Certifications</span><h2 class="dpe-h2">Certified for quality and safety</h2><p class="dpe-lede">Our quality and safety systems are independently certified, so your superintendents and HSE teams can approve us with confidence.</p>
  <ul>${certs.map(([a, b]) => `<li><b>${CHECK}</b><div><strong>${a}</strong><span>${b}</span></div></li>`).join("")}</ul></div>
  <div class="dpe-ce-docs">${certs.map(([a, , img]) => `<figure><img src="${img}" alt="${a} certificate" loading="lazy"/></figure>`).join("")}</div>
</div></section>`, `${BASE_CSS}.dpe-ce{padding:96px 0}
.dpe-ce-g{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:center}
.dpe-ce ul{list-style:none;padding:0;margin:28px 0 0;display:grid;gap:12px}
.dpe-ce li{display:flex;gap:14px;align-items:center}.dpe-ce li b{flex:none;width:34px;height:34px;border-radius:6px;background:${TEAL};color:#fff;display:grid;place-items:center}
.dpe-ce li strong{display:block;font-family:${HF};color:${INK}}.dpe-ce li span{color:${MUTED};font-size:.92rem}
.dpe-ce-docs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.dpe-ce-docs figure{margin:0;background:#fff;border:1px solid ${LINE};border-radius:8px;padding:8px;box-shadow:0 24px 40px -28px rgba(14,47,56,.5)}
.dpe-ce-docs figure:nth-child(2){transform:translateY(-18px)}
.dpe-ce-docs img{width:100%;aspect-ratio:7/10;object-fit:cover;object-position:top;display:block}
@media(max-width:900px){.dpe-ce-g{grid-template-columns:1fr;gap:36px}.dpe-ce{padding:64px 0}}`, bg);
}

function missionBand(bg = MIST) {
  return html("mis", `<section class="dpe-mi"><div class="dpe-wrap">
  <blockquote>“Satisfied customer leads successful job completion.”</blockquote>
  <div class="dpe-mi-g">
    <div><h3>Our mission</h3><p>We are committed to recruit a highly qualified work force, to provide sufficient training and to serve as many global customers as possible in the ship, rig, process and manufacturing industry.</p></div>
    <div><h3>Our vision</h3><p>To become a leading marine, offshore and industrial repairing company in Singapore and in Asia Pacific through the delivery of unconditional high-quality ship, rig and industrial repairing and services.</p></div>
  </div>
</div></section>`, `.dpe-mi{padding:88px 0}.dpe-wrap{max-width:78rem;margin:0 auto;padding:0 24px}
.dpe-mi blockquote{font-family:${HF};font-weight:700;font-size:clamp(1.6rem,3vw,2.4rem);line-height:1.2;color:${DEEP};max-width:48rem;margin:0 0 40px;padding-left:24px;border-left:6px solid ${YEL}}
.dpe-mi-g{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.dpe-mi-g div{background:#fff;border-radius:10px;padding:28px;border:1px solid ${LINE}}
.dpe-mi h3{font-family:${HF};font-weight:700;color:${TEAL};font-size:1.15rem;margin-bottom:10px}.dpe-mi p{color:${MUTED};line-height:1.65}
@media(max-width:760px){.dpe-mi-g{grid-template-columns:1fr}.dpe-mi{padding:64px 0}}`, bg);
}

function processBand(steps, title = "How a job runs", bg = PAPER) {
  return html("proc", `<section class="dpe-pr"><div class="dpe-wrap">
  <span class="dpe-eyebrow">How it works</span><h2 class="dpe-h2">${title}</h2>
  <ol style="--n:${steps.length}">${steps.map(([t, d], i) => `<li><span>${NUM(i)}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ol>
</div></section>`, `${BASE_CSS}.dpe-pr{padding:96px 0}
.dpe-pr ol{list-style:none;margin:40px 0 0;padding:0;display:grid;grid-template-columns:repeat(var(--n),1fr);gap:0;border-top:2px solid ${LINE}}
.dpe-pr li{padding:28px 24px 0 0;position:relative}
.dpe-pr li::before{content:"";position:absolute;top:-7px;left:0;width:12px;height:12px;border-radius:50%;background:${YEL};box-shadow:0 0 0 4px #fff}
.dpe-pr li>span{font-family:${HF};font-weight:700;color:${TEAL};font-size:2rem}
.dpe-pr h3{font-family:${HF};font-weight:700;font-size:1.15rem;color:${INK};margin:8px 0 6px}
.dpe-pr p{color:${MUTED};line-height:1.6}
@media(max-width:860px){.dpe-pr ol{grid-template-columns:1fr 1fr;row-gap:12px}}@media(max-width:520px){.dpe-pr ol{grid-template-columns:1fr}.dpe-pr{padding:64px 0}}`, bg);
}

function ctaSea(title = "Vessel at anchorage? Machinery down?", text = `Call or WhatsApp our team on ${PHONE_DISPLAY}. Our mobile engineers respond 24/7.`) {
  return html("cta", `<section class="dpe-cs"><img src="${I("tanker-rose")}" alt="" aria-hidden="true"/><div class="dpe-wrap dpe-cs-c">
  <h2>${title}</h2><p>${text}</p>
  <div class="dpe-ctas"><a class="dpe-btn dpe-btn-y" href="${WA}">${ICO.wa} WhatsApp us</a><a class="dpe-btn dpe-btn-o" href="tel:${PHONE}">${ICO.phone} Call ${PHONE_DISPLAY}</a><a class="dpe-btn dpe-btn-o" href="mailto:${EMAIL}">${ICO.mail} Email</a></div>
</div></section>`, `${BASE_CSS}.dpe-cs{position:relative;padding:110px 0;overflow:hidden}
.dpe-cs>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.dpe-cs::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(14,47,56,.95),rgba(14,47,56,.75) 55%,rgba(14,47,56,.3))}
.dpe-cs-c{position:relative;z-index:2}
.dpe-cs h2{font-family:${HF};font-weight:700;font-size:clamp(1.9rem,3.6vw,2.9rem);line-height:1.1;color:#fff;max-width:38rem}
.dpe-cs p{color:#C9DDE1;font-size:1.08rem;line-height:1.6;margin:14px 0 28px;max-width:34rem}
@media(max-width:700px){.dpe-cs{padding:72px 0}}`, DEEP);
}

const FAQ_HOME = [
  ["Do you work at Singapore anchorages?", "Yes. Our mobile teams board vessels at anchorage and also carry out voyage repairs."],
  ["Which engines do you overhaul?", `Low, medium and high-speed diesel engines from makers including ${MAKERS.slice(0, 6).join(", ")} and more.`],
  ["Do you have your own workshop?", "Yes. Our in-house workshop at Pioneer Point is equipped for diesel engine repair, pump servicing, machining and fabrication."],
  ["Can you supply the spare parts too?", "Yes. New and reconditioned engine components, auxiliary machinery, deck and hydraulic equipment."],
];

function faq(items, bg = PAPER, variant = "two-column-grid", title = "Frequently Asked Questions") {
  return {
    ...BASE, id: uid("faq"), type: "faq", background: bgColor(bg), templateVariant: variant,
    data: { title, subtitle: "Need a quick answer? Call or WhatsApp us.", layout: "accordion", allowMultiple: false, items: items.map(([question, answer]) => ({ id: uid("f"), question, answer })) },
  };
}

// ─── inner pages ────────────────────────────────────────────────────────────
function innerHero({ crumbs, title, description, img }) {
  return html("ihero", `<section class="dpe-ih"><img src="${img}" alt="" aria-hidden="true"/><div class="dpe-wrap dpe-ih-c">
  <nav class="dpe-crumb"><a href="/">Home</a>${crumbs.map(([l, u]) => u ? ` <i>/</i> <a href="${u}">${l}</a>` : ` <i>/</i> <span>${l}</span>`).join("")}</nav>
  <h1>${title}</h1><p>${description}</p>
  <div class="dpe-ctas"><a class="dpe-btn dpe-btn-y" href="${WA}">${ICO.wa} Request service</a><a class="dpe-btn dpe-btn-o" href="tel:${PHONE}">${ICO.phone} ${PHONE_DISPLAY}</a></div>
</div></section>`, `${BASE_CSS}.dpe-ih{position:relative;padding:100px 0 92px;overflow:hidden;border-bottom:4px solid ${YEL}}
.dpe-ih>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.dpe-ih::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(14,47,56,.96),rgba(14,47,56,.82) 55%,rgba(14,47,56,.45))}
.dpe-ih-c{position:relative;z-index:2}
.dpe-crumb{font-size:.88rem;color:#9CC4CB;margin-bottom:18px}.dpe-crumb a{color:#9CC4CB;text-decoration:none}.dpe-crumb a:hover{color:#fff}.dpe-crumb span{color:#fff;font-weight:600}.dpe-crumb i{font-style:normal;margin:0 6px;opacity:.6}
.dpe-ih h1{font-family:${HF};font-weight:700;font-size:clamp(2.2rem,4.6vw,3.6rem);line-height:1.06;color:#fff;max-width:46rem;letter-spacing:-.02em}
.dpe-ih p{color:#C9DDE1;font-size:1.1rem;line-height:1.6;max-width:40rem;margin:16px 0 28px}
@media(max-width:700px){.dpe-ih{padding:64px 0 56px}}`, DEEP);
}

function svcOverview(s) {
  const [first, ...rest] = s.intro.split(". ");
  return html("ovw", `<section class="dpe-ov"><div class="dpe-wrap dpe-ov-g">
  <div><span class="dpe-eyebrow">${s.title}</span><h2 class="dpe-h2">${first}.</h2>${rest.length ? `<p class="dpe-lede">${rest.join(". ")}</p>` : ""}
    <ul class="dpe-ov-tags">${s.tags.map((t) => `<li>${CHECK}${t}</li>`).join("")}</ul></div>
  <aside class="dpe-ov-card"><img src="${s.gallery[0]}" alt="${s.title}"/><div><strong>Request this service</strong><p>Send the vessel, maker, model and the fault. We reply with the scope and next steps.</p><a class="dpe-btn dpe-btn-t" href="${waText(`Hello Diesel Power Engineering, I need ${s.title.toLowerCase()}. Vessel / location: `)}">${ICO.wa} WhatsApp us</a></div></aside>
</div></section>`, `${BASE_CSS}.dpe-ov{padding:96px 0}
.dpe-ov-g{display:grid;grid-template-columns:1.3fr 1fr;gap:56px;align-items:start}
.dpe-ov-tags{list-style:none;padding:0;margin:28px 0 0;display:flex;flex-wrap:wrap;gap:10px}
.dpe-ov-tags li{display:flex;align-items:center;gap:8px;background:${MIST};color:${DEEP};font-weight:600;font-size:.9rem;padding:8px 14px;border-radius:4px}.dpe-ov-tags svg{color:${TEAL}}
.dpe-ov-card{background:#fff;border:1px solid ${LINE};border-radius:10px;overflow:hidden;box-shadow:0 30px 60px -35px rgba(14,47,56,.5);position:sticky;top:110px;border-top:4px solid ${YEL}}
.dpe-ov-card img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}.dpe-ov-card div{padding:24px}
.dpe-ov-card strong{font-family:${HF};font-weight:700;font-size:1.2rem;color:${INK}}.dpe-ov-card p{color:${MUTED};margin:8px 0 18px;line-height:1.55}
@media(max-width:900px){.dpe-ov-g{grid-template-columns:1fr}.dpe-ov-card{position:static}.dpe-ov{padding:64px 0}}`);
}

function svcIncludes(s, bg = MIST) {
  const cols = s.includes.length % 3 === 0 ? 3 : 2;
  return html("inc", `<section class="dpe-in"><div class="dpe-wrap">
  <span class="dpe-eyebrow">Scope of work</span><h2 class="dpe-h2">What we cover</h2>
  <div class="dpe-in-g" style="--c:${cols}">${s.includes.map(([, t, d], i) => `<div><span>${NUM(i)}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}</div>
</div></section>`, `${BASE_CSS}.dpe-in{padding:96px 0}
.dpe-in-g{display:grid;grid-template-columns:repeat(var(--c),1fr);gap:16px;margin-top:36px}
.dpe-in-g div{background:#fff;border-radius:10px;padding:26px;border:1px solid ${LINE};border-left:4px solid ${TEAL}}
.dpe-in-g span{font-family:${HF};font-weight:700;color:${GREEN};font-size:.88rem}
.dpe-in-g h3{font-family:${HF};font-weight:700;font-size:1.12rem;color:${INK};margin:6px 0 6px}
.dpe-in-g p{color:${MUTED};line-height:1.6}
@media(max-width:900px){.dpe-in-g{grid-template-columns:1fr 1fr}}@media(max-width:560px){.dpe-in-g{grid-template-columns:1fr}.dpe-in{padding:64px 0}}`, bg);
}

function galleryStrip(imgs, alt, bg = MIST) {
  return html("gal", `<section class="dpe-gs"><div class="dpe-wrap dpe-gs-g">${imgs.slice(0, 3).map((u, i) => `<div class="dpe-gs-${i}"><img src="${u}" alt="${alt}" loading="lazy"/></div>`).join("")}</div></section>`,
    `.dpe-gs{padding:0 0 96px}.dpe-wrap{max-width:78rem;margin:0 auto;padding:0 24px}
.dpe-gs-g{display:grid;grid-template-columns:1.4fr 1fr;grid-template-rows:220px 220px;gap:14px}
.dpe-gs-g div{border-radius:10px;overflow:hidden}.dpe-gs-g img{width:100%;height:100%;object-fit:cover;display:block}
.dpe-gs-0{grid-row:span 2}
@media(max-width:700px){.dpe-gs-g{grid-template-columns:1fr;grid-template-rows:none;grid-auto-rows:220px}.dpe-gs-0{grid-row:auto}.dpe-gs{padding-bottom:64px}}`, bg);
}

function otherServices(cur, bg = PAPER) {
  const list = SERVICES.filter((x) => x.slug !== cur.slug);
  return html("oth", `<section class="dpe-ot"><div class="dpe-wrap">
  <div class="dpe-ot-h"><h2 class="dpe-h2">Other services</h2><a href="/services">All services ${ARROW}</a></div>
  <div class="dpe-ot-g">${list.map((x) => `<a href="${svcUrl(x)}"><span>${x.title}</span>${ARROW}</a>`).join("")}</div>
</div></section>`, `${BASE_CSS}.dpe-ot{padding:88px 0}
.dpe-ot-h{display:flex;justify-content:space-between;align-items:end;margin-bottom:24px}
.dpe-ot-h a{color:${TEAL};font-weight:700;text-decoration:none;display:inline-flex;gap:8px;align-items:center}
.dpe-ot-g{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.dpe-ot-g a{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 20px;border:1px solid ${LINE};border-radius:8px;text-decoration:none;color:${INK};font-family:${HF};font-weight:700}
.dpe-ot-g a:hover{background:${DEEP};color:#fff;border-color:${DEEP}}.dpe-ot-g svg{color:${YEL}}
@media(max-width:900px){.dpe-ot-g{grid-template-columns:1fr 1fr}}@media(max-width:560px){.dpe-ot-g{grid-template-columns:1fr}.dpe-ot{padding:56px 0}}`, bg);
}

function clientsGrid(bg = PAPER) {
  return html("cli", `<section class="dpe-cl"><div class="dpe-wrap">
  <span class="dpe-eyebrow">Reference list</span><h2 class="dpe-h2">Vessels we have worked on</h2><p class="dpe-lede">Owners and managers who have trusted us with their engine rooms.</p>
  <div class="dpe-cl-g">${CLIENTS.map(([c, vs]) => `<div><h3>${c}</h3><ul>${vs.map((v) => `<li>${v}</li>`).join("")}</ul></div>`).join("")}</div>
  <p class="dpe-cl-more">Other clients include BSM / Mariapps / Memphis, Epic Gas, Singatac Bintan Yard, Seagull, Bright Sun and MSC.</p>
</div></section>`, `${BASE_CSS}.dpe-cl{padding:96px 0}
.dpe-cl-g{columns:3 260px;column-gap:16px;margin-top:36px}
.dpe-cl-g div{break-inside:avoid;margin-bottom:16px;background:${MIST};border-radius:10px;padding:22px 24px;border-top:4px solid ${TEAL}}
.dpe-cl h3{font-family:${HF};font-weight:700;color:${INK};font-size:1.1rem;margin-bottom:10px}
.dpe-cl ul{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.dpe-cl li{background:#fff;border:1px solid ${LINE};border-radius:4px;padding:5px 10px;font-size:.88rem;color:${DEEP}}
.dpe-cl-more{color:${MUTED};margin-top:10px}
@media(max-width:560px){.dpe-cl{padding:64px 0}}`, bg);
}

function facilities(bg = PAPER) {
  return html("fac", `<section class="dpe-fa"><div class="dpe-wrap dpe-fa-g">
  <div class="dpe-fa-imgs"><img src="${I("workshop-1")}" alt="Workshop with lifting gantry" loading="lazy"/><img src="${I("workshop-2")}" alt="Workshop machinery servicing area" loading="lazy"/><img src="${I("office-1")}" alt="Meeting room" loading="lazy"/></div>
  <div><span class="dpe-eyebrow">Facilities</span><h2 class="dpe-h2">Workshop and office at Pioneer Point</h2>
    <ul>${[
      ["In-house mechanical workshop", "Equipped for diesel engine repair and maintenance, pump servicing, and machining and fabrication."],
      ["Proper lifting facility", "Gantry lifting for crankshafts, engine blocks and heavy components."],
      ["Space for machinery servicing", "Plus resources for piping and structural fabrication work."],
      ["24/7 mobile response team", "Engineers ready to mobilise to berth, anchorage or voyage."],
      ["Office facilities", "Meeting room for project reviews with owners and superintendents."],
    ].map(([t, d]) => `<li><b>${CHECK}</b><div><strong>${t}</strong><p>${d}</p></div></li>`).join("")}</ul></div>
</div></section>`, `${BASE_CSS}.dpe-fa{padding:96px 0}
.dpe-fa-g{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.dpe-fa-imgs{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:220px 180px;gap:12px}
.dpe-fa-imgs img{width:100%;height:100%;object-fit:cover;border-radius:10px;display:block}.dpe-fa-imgs img:first-child{grid-column:span 2}
.dpe-fa ul{list-style:none;padding:0;margin:24px 0 0;display:grid;gap:14px}
.dpe-fa li{display:flex;gap:14px}.dpe-fa li b{flex:none;width:30px;height:30px;border-radius:6px;background:${MIST};color:${TEAL};display:grid;place-items:center}
.dpe-fa li strong{font-family:${HF};color:${INK}}.dpe-fa li p{color:${MUTED};font-size:.94rem;line-height:1.5;margin-top:2px}
@media(max-width:900px){.dpe-fa-g{grid-template-columns:1fr;gap:36px}.dpe-fa{padding:64px 0}}`, bg);
}

function teamBand(bg = MIST) {
  const team = [["Mr Dalimujjaman", "Service Engineer"], ["Mr Saifuddin Ahmed", "Sales Manager"], ["Md Masudur Rahman", "Operation Manager"], ["Monoara Khatun", "Account Executive"], ["Riyadh", "Technician"], ["Sobuz", "Technician"], ["Shariful Islam", "Technician"]];
  return html("team", `<section class="dpe-tm"><div class="dpe-wrap">
  <span class="dpe-eyebrow">Expert team</span><h2 class="dpe-h2">The people on your job</h2><p class="dpe-lede">Led by our Director, with engineers, technicians and an operations team that answers the phone.</p>
  <div class="dpe-tm-g">${team.map(([n, r]) => `<div><span>${n.replace(/^(Mr|Md)\s/, "").split(" ").map((x) => x[0]).join("").slice(0, 2)}</span><strong>${n}</strong><em>${r}</em></div>`).join("")}</div>
</div></section>`, `${BASE_CSS}.dpe-tm{padding:96px 0}
.dpe-tm-g{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:36px}
.dpe-tm-g div{background:#fff;border:1px solid ${LINE};border-radius:10px;padding:22px;display:flex;flex-direction:column;gap:4px}
.dpe-tm-g span{width:46px;height:46px;border-radius:50%;background:${DEEP};color:${YEL};display:grid;place-items:center;font-family:${HF};font-weight:700;margin-bottom:10px}
.dpe-tm-g strong{font-family:${HF};color:${INK}}.dpe-tm-g em{font-style:normal;color:${TEAL};font-size:.9rem;font-weight:600}
@media(max-width:900px){.dpe-tm-g{grid-template-columns:1fr 1fr}}@media(max-width:480px){.dpe-tm-g{grid-template-columns:1fr}.dpe-tm{padding:64px 0}}`, bg);
}

function contactCards(bg = PAPER) {
  return {
    ...BASE, id: uid("ig"), type: "icon_grid", background: bgColor(bg), templateVariant: "colored-tiles",
    data: {
      title: "Reach Us", subtitle: "Contact person: Mr Dalimujjaman", columns: 4, iconSize: "md",
      items: [
        ["Phone", "Call", PHONE_DISPLAY, `tel:${PHONE}`],
        ["MessageCircle", "WhatsApp", PHONE_DISPLAY, WA],
        ["Mail", "Email", EMAIL, `mailto:${EMAIL}`],
        ["MapPin", "Office & workshop", ADDRESS, MAP_LINK],
      ].map(([icon, label, description, url]) => ({ id: uid("i"), icon, color: TEAL, label, description, url })),
    },
  };
}

function contactForm(bg = MIST) {
  return {
    ...BASE, id: uid("contact"), type: "contact", background: bgColor(bg),
    data: {
      title: "Send a service request", subtitle: "Tell us the vessel, location and the job. For urgent jobs, call or WhatsApp.",
      layout: "split", showMap: true, mapEmbedUrl: MAP_EMBED, showContactInfo: true,
      phone: PHONE_DISPLAY, email: EMAIL, address: ADDRESS, recipientEmail: EMAIL,
      fields: [
        { id: "f-name", label: "Name", type: "text", required: true },
        { id: "f-company", label: "Company", type: "text", required: false },
        { id: "f-phone", label: "Phone / WhatsApp", type: "tel", required: true },
        { id: "f-email", label: "Email", type: "email", required: false },
        { id: "f-svc", label: "Service", type: "select", required: false, options: [...SERVICES.map((s) => s.title), "Other"] },
        { id: "f-vessel", label: "Vessel / location", type: "text", required: false },
        { id: "f-msg", label: "Job details (engine maker, model, fault)", type: "textarea", required: false },
      ],
      submitLabel: "Send Request", successMessage: "Thank you. Our team will contact you shortly. For urgent jobs, call +65 9376 1286.",
    },
  };
}

// ─── pages ──────────────────────────────────────────────────────────────────
const STEPS_HOME = [
  ["Call or message", "Vessel, location, engine maker and model, and the fault."],
  ["Inspection & scope", "Our engineer inspects and confirms the scope, spares and time."],
  ["Repair", "On board, at anchorage, on voyage or in our workshop."],
  ["Test & report", "Trial run, handover and a written job report."],
];
const BUILDERS = {
  home: () => [heroDiesel(), makersStrip(), servicesIndex(MIST), capabilitiesBento(), projectsFeatured(), statsBand(), certifications(), processBand(STEPS_HOME, "From first call to sea trial", MIST), faq(FAQ_HOME, PAPER, "minimal-lines"), ctaSea()],
  services: () => [
    innerHero({ crumbs: [["Services"]], title: "Marine engine and machinery services", description: "Engines, auxiliary and deck machinery, pumps, machining, spares, alignment, calibration and commissioning.", img: I("engine-room") }),
    servicesIndex(PAPER, "Choose a service"),
    statsBand(DEEP),
    processBand(STEPS_HOME, "How a job runs", PAPER),
    ctaSea(),
  ],
  projects: () => [
    innerHero({ crumbs: [["Projects"]], title: "Highlight projects", description: "Auxiliary engine overhauls and machinery repairs for ship owners and managers in Singapore.", img: I("tanker-rose") }),
    projectsFeatured(DEEP, "V-Bunkers fleet: auxiliary engine overhauls"),
    galleryStrip([I("overhaul-red"), I("heads-pair"), I("engine-top")], "Engine overhaul work", PAPER),
    clientsGrid(MIST),
    ctaSea("Planning an overhaul?", "Send us the engine maker, model and running hours and we will propose the scope."),
  ],
  about: () => [
    innerHero({ crumbs: [["About"]], title: "Marine engineering, Singapore-based since 2020", description: `Diesel Power Engineering Pte. Ltd. (UEN ${UEN}) overhauls, repairs and maintains marine engines for Singapore and global maritime routes.`, img: I("workshop-lift") }),
    missionBand(PAPER),
    statsBand(),
    facilities(PAPER),
    teamBand(MIST),
    certifications(PAPER),
    ctaSea(),
  ],
  contact: () => [
    innerHero({ crumbs: [["Contact"]], title: "Talk to an engineer", description: `Call or WhatsApp ${PHONE_DISPLAY}, email ${EMAIL}, or send the form below.`, img: I("tanker-sea") }),
    contactCards(PAPER),
    contactForm(MIST),
  ],
};
for (const s of SERVICES) {
  BUILDERS[`services/${s.slug}`] = () => [
    innerHero({ crumbs: [["Services", "/services"], [s.title]], title: s.title, description: s.short, img: s.img }),
    svcOverview(s),
    svcIncludes(s),
    galleryStrip(s.gallery, s.title),
    processBand(s.steps, `How ${s.title.toLowerCase()} works`, PAPER),
    faq(s.faq, MIST, "minimal-lines", "Questions"),
    otherServices(s),
    ctaSea(`Need ${s.title.toLowerCase()}?`),
  ];
}

const SEO = {
  home: ["Marine Engine Overhaul & Repair in Singapore", "Diesel Power Engineering: marine engine overhauling, auxiliary and deck machinery repair, anchorage and voyage repairs, pumps, machining and spares in Singapore."],
  services: ["Marine Engineering Services Singapore", "Engine overhauling, auxiliary machinery, anchorage and voyage repairs, deck machinery, pumps, machining, spares, alignment, calibration and commissioning."],
  projects: ["Projects & Vessel References", `Auxiliary engine overhauls for V-Bunkers and vessel references from BW Epic Kosan, Golden Island, BSM, Kosmos Maritime and more.`],
  about: ["About Diesel Power Engineering", `Singapore marine engineering company founded in 2020 (UEN ${UEN}). ISO 9001, ISO 45001 and bizSAFE Star certified.`],
  contact: ["Contact Diesel Power Engineering", `Call ${PHONE_DISPLAY} or email ${EMAIL}. 5 Soon Lee Street, Pioneer Point, #04-42, Singapore 627607.`],
};
for (const s of SERVICES) SEO[`services/${s.slug}`] = [`${s.title} in Singapore`, `${s.short} ${s.intro}`.slice(0, 158)];

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
    tenant_id: id, label: "Main", phone: PHONE, whatsapp: WA_NUMBER, email: EMAIL,
    address: ADDRESS, is_primary: true, floating_whatsapp: false, sort_order: 0,
  });
  console.log("✓ tenant created", id, "demo until", expiresAt);
  return id;
}

async function uploadAssets(tenantId) {
  const dir = path.join(__dirname, "..", "clients", ASSET_DIR, "site-assets");
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
        url: A(file), storage_path: storagePath, folder: "/", alt: file.replace(/\.(jpg|png)$/, "").replace(/-/g, " "),
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
    site_name: SITE_NAME, tagline: "Marine Engine Overhauling, Repair & Maintenance",
    logo_url: LOGO, logo_dark_url: LOGO_LIGHT, logo_type: "image", logo_alt: SITE_NAME, logo_width: 260,
    favicon_url: FAVICON_URL,
    primary_color: TEAL, secondary_color: DEEP,
    color_overrides: {
      primary: TEAL, primaryFg: "#ffffff", secondary: DEEP, accent: YEL, ring: TEAL,
      background: PAPER, foreground: INK, card: "#ffffff", muted: MIST, mutedFg: MUTED,
      border: LINE, borderRadius: "0.5rem",
    },
    design_overrides: { headingFont: "Space Grotesk", bodyFont: "Inter", headingWeight: "700", roundness: "subtle", shadow: "soft" },
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
    site_url: `https://${SLUG}.passivecoder.com`, timezone: "Asia/Singapore", language: "en", maintenance_mode: false, site_theme: "light",
  }, { onConflict: "tenant_id" });
  if (ssErr) console.log("✗ site_settings:", ssErr.message);

  console.log(`\n✅ Done: https://${SLUG}.passivecoder.com/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
