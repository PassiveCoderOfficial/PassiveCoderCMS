export type TemplateCategory =
  | "Cleaning"
  | "HVAC & Plumbing"
  | "Renovation & Construction"
  | "Interior Design"
  | "Restaurant & Cafe"
  | "Health & Beauty"
  | "Fitness & Sports"
  | "Legal & Finance"
  | "Real Estate"
  | "Photography"
  | "Education"
  | "Retail & Shop"
  | "Automotive"
  | "Events"
  | "Tech & Agency"
  | "General Business";

export interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  /** Tailwind gradient class pair for the thumbnail bg */
  gradient: string;
  /** Accent color for this template's theme */
  accentColor: string;
  accentColorHex: string;
  /** Mock sections shown in the preview */
  primaryColor: string;
  secondaryColor: string;
  /** Thumbnail card gradient colors */
  thumbFrom: string;
  thumbTo: string;
  /** Pexels photo URL for thumbnail hero background */
  heroImage: string;
  /** Demo page count */
  pages: number;
  /** Whether it ships with demo content */
  hasDemo: boolean;
  /** Industry badge text */
  badge?: string;
  /** Featured / popular */
  featured?: boolean;
  /** Mock hero headline for preview */
  heroHeadline: string;
  heroSubline: string;
}

export const TEMPLATES: Template[] = [

  // ── Batch 1: Renovation & Construction ───────────────────────────────────────
  {
    id: "tpl-056", slug: "build-right", name: "BuildRight", category: "Renovation & Construction",
    description: "Bold dark-theme renovation contractor. Full-width hero, project gallery, HDB licensing badges, fixed-price quote form.",
    tags: ["renovation", "construction", "fitout", "hdb", "singapore"],
    gradient: "from-orange-600 to-stone-800", accentColor: "orange", accentColorHex: "#ea580c",
    primaryColor: "#ea580c", secondaryColor: "#1c1917",
    thumbFrom: "#111110", thumbTo: "#c2410c",
    heroImage: "https://images.pexels.com/photos/36035072/pexels-photo-36035072.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true, featured: true, badge: "New",
    heroHeadline: "We Build. We Renovate. We Deliver.",
    heroSubline: "Licensed renovation contractor. 600+ projects. Fixed-price contracts.",
  },

  // ── Batch 1: Interior Design ──────────────────────────────────────────────────
  {
    id: "tpl-057", slug: "colour-craft", name: "ColourCraft", category: "Interior Design",
    description: "Vibrant painting & decorating. Violet/pink gradient, before/after gallery, fast quote flow, colour consultation badge.",
    tags: ["painting", "decorating", "interior", "colour", "residential"],
    gradient: "from-violet-600 to-pink-600", accentColor: "violet", accentColorHex: "#7c3aed",
    primaryColor: "#7c3aed", secondaryColor: "#db2777",
    thumbFrom: "#4c1d95", thumbTo: "#9d174d",
    heroImage: "https://images.pexels.com/photos/7218001/pexels-photo-7218001.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Your Home, Transformed by Colour",
    heroSubline: "Professional painting & decorating. Free colour consultation.",
  },
  {
    id: "tpl-060", slug: "glass-line", name: "GlassLine", category: "Interior Design",
    description: "Sleek glass & aluminium specialist. Dark nav + silver tones. Product showcase, project gallery, BCA certification, quote form.",
    tags: ["glass", "aluminium", "shutters", "glazing", "fabrication"],
    gradient: "from-slate-800 to-gray-600", accentColor: "slate", accentColorHex: "#0f172a",
    primaryColor: "#0f172a", secondaryColor: "#475569",
    thumbFrom: "#0f172a", thumbTo: "#334155",
    heroImage: "https://images.pexels.com/photos/5483051/pexels-photo-5483051.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Precision Glass & Aluminium Works",
    heroSubline: "BCA registered. Fabrication & installation across Singapore.",
  },
  {
    id: "tpl-064", slug: "curtain-studio", name: "CurtainStudio", category: "Interior Design",
    description: "Elegant curtains, blinds & soft furnishings showroom. Warm neutrals + gold. Product gallery, free measuring, home consultation.",
    tags: ["curtains", "blinds", "furnishings", "drapes", "interior", "singapore", "my"],
    gradient: "from-amber-700 to-stone-800", accentColor: "amber", accentColorHex: "#b45309",
    primaryColor: "#b45309", secondaryColor: "#44403c",
    thumbFrom: "#451a03", thumbTo: "#b45309",
    heroImage: "https://images.pexels.com/photos/462197/pexels-photo-462197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Window Treatments That Transform Spaces",
    heroSubline: "Custom curtains, blinds & soft furnishings. Free home measuring & consultation.",
  },

  // ── Batch 1: Cleaning ─────────────────────────────────────────────────────────
  {
    id: "tpl-058", slug: "pest-shield", name: "PestShield", category: "Cleaning",
    description: "Deep green pest control brand. NEA licensed badges, treatment types, eco-cert, residential & commercial contracts.",
    tags: ["pest control", "nea licensed", "termite", "singapore", "cleaning"],
    gradient: "from-green-800 to-emerald-900", accentColor: "green", accentColorHex: "#166534",
    primaryColor: "#166534", secondaryColor: "#14532d",
    thumbFrom: "#052e16", thumbTo: "#166534",
    heroImage: "https://images.pexels.com/photos/32055757/pexels-photo-32055757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true, badge: "New",
    heroHeadline: "Pest-Free. Guaranteed.",
    heroSubline: "Licensed pest management. Safe for children, pets and the environment.",
  },
  {
    id: "tpl-063", slug: "fresh-wash", name: "FreshWash", category: "Cleaning",
    description: "Modern laundry & dry cleaning. Clean white + teal. Online booking, price list, home pickup & delivery, express service.",
    tags: ["laundry", "dry cleaning", "pickup", "delivery", "ironing"],
    gradient: "from-teal-500 to-cyan-600", accentColor: "teal", accentColorHex: "#0d9488",
    primaryColor: "#0d9488", secondaryColor: "#06b6d4",
    thumbFrom: "#0f766e", thumbTo: "#0d9488",
    heroImage: "https://images.pexels.com/photos/8774451/pexels-photo-8774451.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true, badge: "New",
    heroHeadline: "Fresh Clothes. Zero Hassle.",
    heroSubline: "Professional laundry & dry cleaning with free pickup and delivery.",
  },

  // ── Batch 1: Retail & Shop ────────────────────────────────────────────────────
  {
    id: "tpl-059", slug: "uniform-pro", name: "UniformPro", category: "Retail & Shop",
    description: "Professional uniform & workwear supplier. Navy + gold. Bulk order form, fabric showcase, corporate client logos.",
    tags: ["uniforms", "workwear", "garments", "corporate", "bulk", "bd"],
    gradient: "from-blue-900 to-amber-700", accentColor: "blue", accentColorHex: "#1e3a5f",
    primaryColor: "#1e3a5f", secondaryColor: "#92400e",
    thumbFrom: "#1e3a5f", thumbTo: "#78350f",
    heroImage: "https://images.pexels.com/photos/31031119/pexels-photo-31031119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Professional Uniforms Manufactured to Your Specification",
    heroSubline: "Custom workwear and uniform solutions for businesses across Asia.",
  },

  // ── Batch 2: HVAC & Plumbing ──────────────────────────────────────────────────
  {
    id: "tpl-061", slug: "cool-breeze", name: "CoolBreeze", category: "HVAC & Plumbing",
    description: "Premium AC & HVAC contractor. Cool blue & white Gulf-style. Service contracts, installation packages, 24/7 emergency callout.",
    tags: ["aircon", "hvac", "ac service", "installation", "gulf", "singapore"],
    gradient: "from-sky-600 to-blue-800", accentColor: "sky", accentColorHex: "#0284c7",
    primaryColor: "#0284c7", secondaryColor: "#1e3a5f",
    thumbFrom: "#0c4a6e", thumbTo: "#0284c7",
    heroImage: "https://images.pexels.com/photos/5463587/pexels-photo-5463587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, featured: true, badge: "New",
    heroHeadline: "Stay Cool. Stay Comfortable.",
    heroSubline: "Certified AC installation, servicing & maintenance. 24/7 emergency response.",
  },
  {
    id: "tpl-062", slug: "sparky-pro", name: "SparkyPro", category: "HVAC & Plumbing",
    description: "Bold electrical & plumbing contractor. Safety-yellow & dark. Emergency services, certifications, residential & commercial works.",
    tags: ["electrical", "plumbing", "contractor", "wiring", "pipes", "singapore", "ae"],
    gradient: "from-yellow-500 to-gray-800", accentColor: "yellow", accentColorHex: "#eab308",
    primaryColor: "#ca8a04", secondaryColor: "#1c1917",
    thumbFrom: "#713f12", thumbTo: "#ca8a04",
    heroImage: "https://images.pexels.com/photos/9679179/pexels-photo-9679179.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Certified. Reliable. On Call 24/7.",
    heroSubline: "Licensed electricians & plumbers for residential and commercial works.",
  },

  // ── Batch 2: General Business ─────────────────────────────────────────────────
  {
    id: "tpl-065", slug: "trade-supply", name: "TradeSupply", category: "General Business",
    description: "B2B trading & wholesale supplier. Corporate navy & orange. Product catalogue, bulk enquiry, brand partnerships, global sourcing.",
    tags: ["trading", "wholesale", "supply", "b2b", "import", "export", "bd", "ae"],
    gradient: "from-orange-600 to-blue-900", accentColor: "orange", accentColorHex: "#ea580c",
    primaryColor: "#ea580c", secondaryColor: "#1e3a5f",
    thumbFrom: "#1e3a5f", thumbTo: "#ea580c",
    heroImage: "https://images.pexels.com/photos/4487383/pexels-photo-4487383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Sourced Globally. Delivered Locally.",
    heroSubline: "Trusted wholesale trading & supply partner for businesses across Asia & the Gulf.",
  },

  // ── Batch 3 ───────────────────────────────────────────────────────────────────
  {
    id: "tpl-066", slug: "shield-guard", name: "ShieldGuard", category: "General Business",
    description: "Professional security services firm. Dark charcoal + red. Guard services, CCTV, patrol routes, licensing badges, contract enquiry.",
    tags: ["security", "guarding", "cctv", "patrol", "sg", "ae", "bd"],
    gradient: "from-gray-900 to-red-900", accentColor: "red", accentColorHex: "#dc2626",
    primaryColor: "#0f172a", secondaryColor: "#7f1d1d",
    thumbFrom: "#0f172a", thumbTo: "#7f1d1d",
    heroImage: "https://images.pexels.com/photos/30516935/pexels-photo-30516935.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, featured: true, badge: "New",
    heroHeadline: "Protecting People. Securing Premises.",
    heroSubline: "Licensed security solutions for corporate, residential & events. 24/7 operations.",
  },
  {
    id: "tpl-067", slug: "shine-auto", name: "ShineAuto", category: "Automotive",
    description: "Premium car wash & detailing studio. Deep black + electric blue. Package selector, before/after gallery, membership plans.",
    tags: ["car wash", "detailing", "automotive", "valeting", "ceramic coating"],
    gradient: "from-slate-900 to-blue-600", accentColor: "blue", accentColorHex: "#2563eb",
    primaryColor: "#0f172a", secondaryColor: "#1d4ed8",
    thumbFrom: "#0f172a", thumbTo: "#1e40af",
    heroImage: "https://images.pexels.com/photos/6026083/pexels-photo-6026083.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true, badge: "New",
    heroHeadline: "Your Car Deserves the Best.",
    heroSubline: "Professional car wash, detailing & ceramic coating. Book online in 60 seconds.",
  },
  {
    id: "tpl-068", slug: "feast-events", name: "FeastEvents", category: "Events",
    description: "Full-service catering & events company. Rich burgundy + gold. Menu showcase, event gallery, package booking, corporate enquiry.",
    tags: ["catering", "events", "corporate", "weddings", "buffet", "sg", "ae"],
    gradient: "from-rose-900 to-amber-700", accentColor: "rose", accentColorHex: "#9f1239",
    primaryColor: "#9f1239", secondaryColor: "#92400e",
    thumbFrom: "#4c0519", thumbTo: "#92400e",
    heroImage: "https://images.pexels.com/photos/34321369/pexels-photo-34321369.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Exceptional Food. Unforgettable Events.",
    heroSubline: "Full-service catering for corporate events, weddings & private dining. Singapore & Gulf.",
  },
  {
    id: "tpl-069", slug: "medplus-clinic", name: "MedPlus Clinic", category: "Health & Beauty",
    description: "Modern GP & medical clinic. Clean white + medical blue. Doctor profiles, services, appointment booking, insurance badges.",
    tags: ["clinic", "medical", "gp", "doctor", "healthcare", "sg", "ae"],
    gradient: "from-blue-600 to-cyan-500", accentColor: "blue", accentColorHex: "#2563eb",
    primaryColor: "#1d4ed8", secondaryColor: "#0891b2",
    thumbFrom: "#1e3a8a", thumbTo: "#0e7490",
    heroImage: "https://images.pexels.com/photos/7659869/pexels-photo-7659869.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Your Health. Our Priority.",
    heroSubline: "Comprehensive GP & specialist care. Walk-in & appointment. Medisave & insurance accepted.",
  },
  {
    id: "tpl-070", slug: "drive-academy", name: "DriveAcademy", category: "Automotive",
    description: "Driving school & auto academy. Bold red & white. Course packages, instructor profiles, pass rate stats, online slot booking.",
    tags: ["driving school", "driving lessons", "auto", "license", "sg", "my"],
    gradient: "from-red-600 to-gray-900", accentColor: "red", accentColorHex: "#dc2626",
    primaryColor: "#dc2626", secondaryColor: "#111827",
    thumbFrom: "#7f1d1d", thumbTo: "#dc2626",
    heroImage: "https://images.pexels.com/photos/37112146/pexels-photo-37112146.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true, badge: "New",
    heroHeadline: "Pass First Time. Drive for Life.",
    heroSubline: "Singapore's most trusted driving school. 94% first-attempt pass rate. Book your slot now.",
  },

  // ── Batch 2: Renovation & Construction ───────────────────────────────────────
  {
    id: "tpl-071", slug: "handyfix-pro", name: "HandyfixPro", category: "Renovation & Construction",
    description: "Bold, trust-forward template for handyman services. Dark-accented hero with service icons and a prominent call-to-action for fast local bookings.",
    tags: ["handyman", "repairs", "home services", "maintenance"],
    gradient: "from-orange-700 to-stone-900", accentColor: "orange", accentColorHex: "#ea580c",
    primaryColor: "#1c1917", secondaryColor: "#ea580c",
    thumbFrom: "#9a3412", thumbTo: "#1c1917",
    heroImage: "https://images.pexels.com/photos/8961247/pexels-photo-8961247.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Your Local Handyman, Done Right",
    heroSubline: "Fast, reliable repairs and maintenance for homes and businesses — no job too small.",
  },
  {
    id: "tpl-072", slug: "buildguard", name: "BuildGuard", category: "Renovation & Construction",
    description: "Professional building maintenance template with a clean corporate aesthetic. Designed for facility management and preventive maintenance companies.",
    tags: ["building maintenance", "facility management", "commercial", "repairs"],
    gradient: "from-slate-700 to-blue-900", accentColor: "blue", accentColorHex: "#2563eb",
    primaryColor: "#0f172a", secondaryColor: "#2563eb",
    thumbFrom: "#1e3a5f", thumbTo: "#0f172a",
    heroImage: "https://images.pexels.com/photos/209271/pexels-photo-209271.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Building Excellence, Maintained Daily",
    heroSubline: "Comprehensive facility management and maintenance solutions for commercial properties.",
  },
  {
    id: "tpl-073", slug: "apex-construct", name: "ApexConstruct", category: "Renovation & Construction",
    description: "Premium general contractor template with an editorial hero layout and project showcase. Perfect for high-end renovation and construction firms.",
    tags: ["contractor", "construction", "renovation", "building"],
    gradient: "from-yellow-700 to-neutral-900", accentColor: "yellow", accentColorHex: "#ca8a04",
    primaryColor: "#171717", secondaryColor: "#ca8a04",
    thumbFrom: "#a16207", thumbTo: "#171717",
    heroImage: "https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true, featured: true, badge: "New",
    heroHeadline: "Building the Future, One Project at a Time",
    heroSubline: "Award-winning general contractors delivering quality builds on time and on budget.",
  },

  // ── Batch 2: Cleaning ─────────────────────────────────────────────────────────
  {
    id: "tpl-074", slug: "sparkle-home", name: "SparkleHome", category: "Cleaning",
    description: "Fresh and friendly house cleaning template with a light, airy design. Emphasises trust, reliability, and eco-friendly cleaning practices.",
    tags: ["house cleaning", "residential", "domestic", "eco-friendly"],
    gradient: "from-cyan-500 to-teal-700", accentColor: "teal", accentColorHex: "#0d9488",
    primaryColor: "#134e4a", secondaryColor: "#0d9488",
    thumbFrom: "#0891b2", thumbTo: "#0f766e",
    heroImage: "https://images.pexels.com/photos/4239031/pexels-photo-4239031.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true, badge: "New",
    heroHeadline: "A Cleaner Home, A Happier Life",
    heroSubline: "Professional house cleaning services using eco-friendly products — book your clean in minutes.",
  },
  {
    id: "tpl-075", slug: "cleancore-commercial", name: "CleanCore", category: "Cleaning",
    description: "Corporate and commercial cleaning template with a bold, confident look. Built for office and industrial cleaning service providers.",
    tags: ["commercial cleaning", "office cleaning", "industrial", "janitorial"],
    gradient: "from-blue-700 to-indigo-900", accentColor: "blue", accentColorHex: "#1d4ed8",
    primaryColor: "#1e1b4b", secondaryColor: "#1d4ed8",
    thumbFrom: "#1d4ed8", thumbTo: "#1e1b4b",
    heroImage: "https://images.pexels.com/photos/6195957/pexels-photo-6195957.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true,
    heroHeadline: "Spotless Spaces, Productive Workplaces",
    heroSubline: "Commercial cleaning solutions trusted by offices, warehouses, and retail spaces across the city.",
  },
  {
    id: "tpl-076", slug: "fibrefresh", name: "FibreFresh", category: "Cleaning",
    description: "Specialist carpet and upholstery cleaning template with a warm, approachable design. Showcases detailed service tiers and before/after results.",
    tags: ["carpet cleaning", "upholstery", "soft furnishings", "deep clean"],
    gradient: "from-amber-600 to-red-900", accentColor: "amber", accentColorHex: "#d97706",
    primaryColor: "#7f1d1d", secondaryColor: "#d97706",
    thumbFrom: "#b45309", thumbTo: "#7f1d1d",
    heroImage: "https://images.pexels.com/photos/3855962/pexels-photo-3855962.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true, badge: "New",
    heroHeadline: "Breathe New Life Into Your Carpets",
    heroSubline: "Deep-cleaning specialists for carpets, rugs, and upholstery — results you can see and feel.",
  },

  // ── Batch 2: HVAC & Plumbing ──────────────────────────────────────────────────
  {
    id: "tpl-077", slug: "flowmaster-plumbing", name: "FlowMaster", category: "HVAC & Plumbing",
    description: "Clean professional plumbing specialist template with an emergency callout focus. Features 24/7 availability messaging and trust badges.",
    tags: ["plumbing", "emergency plumber", "pipes", "drainage"],
    gradient: "from-blue-600 to-slate-800", accentColor: "blue", accentColorHex: "#2563eb",
    primaryColor: "#1e293b", secondaryColor: "#2563eb",
    thumbFrom: "#1d4ed8", thumbTo: "#1e293b",
    heroImage: "https://images.pexels.com/photos/6463397/pexels-photo-6463397.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true,
    heroHeadline: "Fast Plumbing Fixes, 24 Hours a Day",
    heroSubline: "Licensed plumbers on call around the clock — from leaky taps to full pipe replacements.",
  },
  {
    id: "tpl-078", slug: "heatwave-hvac", name: "HeatWave", category: "HVAC & Plumbing",
    description: "Bold gas and heating specialist template with a dark industrial aesthetic. Perfect for boiler installation, gas fitting, and central heating companies.",
    tags: ["gas fitting", "heating", "boiler", "HVAC"],
    gradient: "from-red-700 to-zinc-900", accentColor: "red", accentColorHex: "#dc2626",
    primaryColor: "#18181b", secondaryColor: "#dc2626",
    thumbFrom: "#b91c1c", thumbTo: "#18181b",
    heroImage: "https://images.pexels.com/photos/8961086/pexels-photo-8961086.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Warmth You Can Count On, All Year Round",
    heroSubline: "Certified gas fitters and heating engineers — boiler installs, servicing, and emergency callouts.",
  },
  {
    id: "tpl-079", slug: "totalbuilds-services", name: "TotalBuilds", category: "HVAC & Plumbing",
    description: "Full-spectrum building services template covering plumbing, electrical, and HVAC under one roof. Designed for multi-trade service companies.",
    tags: ["building services", "multi-trade", "HVAC", "plumbing", "electrical"],
    gradient: "from-green-700 to-slate-900", accentColor: "green", accentColorHex: "#16a34a",
    primaryColor: "#0f172a", secondaryColor: "#16a34a",
    thumbFrom: "#15803d", thumbTo: "#0f172a",
    heroImage: "https://images.pexels.com/photos/8487544/pexels-photo-8487544.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true,
    heroHeadline: "One Call Covers It All",
    heroSubline: "Complete building services — plumbing, heating, and electrical solutions from a single trusted team.",
  },

  // ── Batch 2: Automotive ───────────────────────────────────────────────────────
  {
    id: "tpl-080", slug: "torque-auto", name: "TorqueAuto", category: "Automotive",
    description: "High-energy car servicing template with a dark, performance-inspired design. Ideal for independent mechanics and automotive service centres.",
    tags: ["car service", "mechanic", "auto repair", "vehicle maintenance"],
    gradient: "from-zinc-700 to-black", accentColor: "red", accentColorHex: "#ef4444",
    primaryColor: "#09090b", secondaryColor: "#ef4444",
    thumbFrom: "#3f3f46", thumbTo: "#09090b",
    heroImage: "https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Expert Car Care You Can Trust",
    heroSubline: "Fully equipped workshop with certified mechanics — from logbook servicing to major repairs.",
  },
  {
    id: "tpl-081", slug: "gripzone-tyres", name: "GripZone", category: "Automotive",
    description: "Focused tyre shop template with a bold, sporty visual identity. Highlights tyre brands, fitting services, and wheel alignment.",
    tags: ["tyre shop", "wheel alignment", "tyres", "automotive"],
    gradient: "from-stone-700 to-neutral-900", accentColor: "yellow", accentColorHex: "#eab308",
    primaryColor: "#171717", secondaryColor: "#eab308",
    thumbFrom: "#57534e", thumbTo: "#171717",
    heroImage: "https://images.pexels.com/photos/257911/pexels-photo-257911.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true,
    heroHeadline: "Stay Safe on the Road",
    heroSubline: "Premium tyre fitting and wheel alignment — all major brands, competitive pricing, same-day service.",
  },
  {
    id: "tpl-082", slug: "panelcraft", name: "PanelCraft", category: "Automotive",
    description: "Sleek auto body and panel beating template with a premium feel. Showcases repair quality through service listings and insurance approval badges.",
    tags: ["panel beating", "smash repairs", "auto body", "car paint"],
    gradient: "from-slate-600 to-gray-900", accentColor: "sky", accentColorHex: "#0ea5e9",
    primaryColor: "#111827", secondaryColor: "#0ea5e9",
    thumbFrom: "#475569", thumbTo: "#111827",
    heroImage: "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Restore Your Vehicle to Showroom Condition",
    heroSubline: "Expert panel beating and auto body repairs — insurance approved and quality guaranteed.",
  },

  // ── Batch 2: Retail & Shop ────────────────────────────────────────────────────
  {
    id: "tpl-083", slug: "threadline", name: "Threadline", category: "Retail & Shop",
    description: "Elegant fashion and clothing store template with an editorial, magazine-inspired layout. Perfect for boutique clothing retailers and online fashion brands.",
    tags: ["fashion", "clothing", "boutique", "apparel", "retail"],
    gradient: "from-rose-500 to-pink-900", accentColor: "rose", accentColorHex: "#f43f5e",
    primaryColor: "#4c0519", secondaryColor: "#f43f5e",
    thumbFrom: "#e11d48", thumbTo: "#4c0519",
    heroImage: "https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, featured: true,
    heroHeadline: "Wear Your Story",
    heroSubline: "Curated fashion for the modern wardrobe — discover new arrivals and timeless styles.",
  },
  {
    id: "tpl-084", slug: "stride-active", name: "StrideActive", category: "Retail & Shop",
    description: "Dynamic sportswear and activewear retail template with an energetic, bold design. Built for athletic apparel brands and sports equipment retailers.",
    tags: ["sportswear", "activewear", "athletic", "gym wear", "retail"],
    gradient: "from-lime-500 to-emerald-800", accentColor: "lime", accentColorHex: "#84cc16",
    primaryColor: "#14532d", secondaryColor: "#84cc16",
    thumbFrom: "#65a30d", thumbTo: "#14532d",
    heroImage: "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Gear Up. Go Further.",
    heroSubline: "Performance activewear designed for every workout — built to move as hard as you do.",
  },
  {
    id: "tpl-085", slug: "worksafe-gear", name: "WorkSafeGear", category: "Retail & Shop",
    description: "Practical and authoritative workwear and safety gear retail template. Ideal for PPE suppliers, uniform shops, and industrial workwear retailers.",
    tags: ["workwear", "safety gear", "PPE", "uniforms", "industrial"],
    gradient: "from-orange-600 to-amber-900", accentColor: "orange", accentColorHex: "#f97316",
    primaryColor: "#431407", secondaryColor: "#f97316",
    thumbFrom: "#ea580c", thumbTo: "#431407",
    heroImage: "https://images.pexels.com/photos/5325103/pexels-photo-5325103.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true,
    heroHeadline: "Protect Your Team, Equip Your Workforce",
    heroSubline: "Quality workwear and safety equipment — compliant, durable, and ready when you need it.",
  },

  // ── Batch 2: Travel & Tourism (General Business) ──────────────────────────────
  {
    id: "tpl-086", slug: "wanderway", name: "WanderWay", category: "General Business",
    description: "Vibrant travel agency template with a destination-forward hero and inspiring visual design. Perfect for full-service travel agencies and holiday planners.",
    tags: ["travel agency", "holidays", "tours", "flights", "accommodation"],
    gradient: "from-sky-500 to-indigo-800", accentColor: "sky", accentColorHex: "#0ea5e9",
    primaryColor: "#1e1b4b", secondaryColor: "#0ea5e9",
    thumbFrom: "#0284c7", thumbTo: "#1e1b4b",
    heroImage: "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New", featured: true,
    heroHeadline: "Your Journey Starts Here",
    heroSubline: "Tailored travel experiences to destinations worldwide — let us handle every detail.",
  },
  {
    id: "tpl-087", slug: "trailblaze-tours", name: "TrailBlaze", category: "General Business",
    description: "Adventure-focused tour operator template with dramatic imagery and itinerary showcases. Designed for guided tours, eco-tourism, and experience travel brands.",
    tags: ["tour operator", "guided tours", "adventure", "eco-tourism", "experiences"],
    gradient: "from-green-600 to-teal-900", accentColor: "green", accentColorHex: "#22c55e",
    primaryColor: "#042f2e", secondaryColor: "#22c55e",
    thumbFrom: "#16a34a", thumbTo: "#042f2e",
    heroImage: "https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true,
    heroHeadline: "Explore the World Your Way",
    heroSubline: "Expert-guided tours to breathtaking destinations — small groups, big adventures.",
  },
  {
    id: "tpl-088", slug: "visabridge", name: "VisaBridge", category: "General Business",
    description: "Professional visa and immigration consultancy template with a clean, authoritative look. Builds trust through credentials, process timelines, and client success stories.",
    tags: ["visa", "immigration", "consultancy", "migration", "work permit"],
    gradient: "from-indigo-600 to-slate-900", accentColor: "indigo", accentColorHex: "#4f46e5",
    primaryColor: "#0f172a", secondaryColor: "#4f46e5",
    thumbFrom: "#4338ca", thumbTo: "#0f172a",
    heroImage: "https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Your Path to a New Beginning",
    heroSubline: "Registered migration agents guiding you through every step of your visa application.",
  },

  // ── Batch 2: Restaurant & Cafe ────────────────────────────────────────────────
  {
    id: "tpl-089", slug: "tablefare", name: "TableFare", category: "Restaurant & Cafe",
    description: "Warm and inviting casual dining restaurant template with a rich, food-photography-forward layout. Ideal for family restaurants and neighbourhood eateries.",
    tags: ["restaurant", "dining", "casual", "food", "reservations"],
    gradient: "from-red-700 to-amber-900", accentColor: "red", accentColorHex: "#dc2626",
    primaryColor: "#451a03", secondaryColor: "#dc2626",
    thumbFrom: "#b91c1c", thumbTo: "#451a03",
    heroImage: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true,
    heroHeadline: "Good Food, Good Times",
    heroSubline: "A neighbourhood favourite serving fresh, flavourful dishes the whole family will love.",
  },
  {
    id: "tpl-090", slug: "beancraft-cafe", name: "BeanCraft", category: "Restaurant & Cafe",
    description: "Stylish coffee shop and cafe template with a minimal, aesthetic-driven design. Perfect for specialty coffee roasters, artisan cafes, and brunch spots.",
    tags: ["cafe", "coffee", "brunch", "specialty coffee", "artisan"],
    gradient: "from-amber-800 to-stone-900", accentColor: "amber", accentColorHex: "#f59e0b",
    primaryColor: "#1c1917", secondaryColor: "#f59e0b",
    thumbFrom: "#92400e", thumbTo: "#1c1917",
    heroImage: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true, badge: "New", featured: true,
    heroHeadline: "Crafted with Care, Served with Passion",
    heroSubline: "Specialty coffee and wholesome eats in a space designed for good conversations.",
  },
  {
    id: "tpl-091", slug: "streetbite", name: "StreetBite", category: "Restaurant & Cafe",
    description: "Energetic food truck and takeaway template with a street food aesthetic. Bold typography and vibrant colours for fast-casual dining and delivery brands.",
    tags: ["food truck", "takeaway", "fast casual", "delivery", "street food"],
    gradient: "from-yellow-500 to-orange-700", accentColor: "yellow", accentColorHex: "#eab308",
    primaryColor: "#7c2d12", secondaryColor: "#eab308",
    thumbFrom: "#ca8a04", thumbTo: "#7c2d12",
    heroImage: "https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true,
    heroHeadline: "Bold Flavours, Fast & Fresh",
    heroSubline: "Street-inspired food made with real ingredients — order online or find us at the truck.",
  },

  // ── Batch 2: Health & Beauty ──────────────────────────────────────────────────
  {
    id: "tpl-092", slug: "lumiere-salon", name: "Lumiere", category: "Health & Beauty",
    description: "Luxurious beauty salon template with a soft, elegant aesthetic. Features service menus, team profiles, and seamless online booking integration.",
    tags: ["beauty salon", "hair", "nails", "beauty", "spa"],
    gradient: "from-pink-400 to-rose-700", accentColor: "pink", accentColorHex: "#ec4899",
    primaryColor: "#881337", secondaryColor: "#ec4899",
    thumbFrom: "#db2777", thumbTo: "#881337",
    heroImage: "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, featured: true,
    heroHeadline: "Beauty That Speaks for Itself",
    heroSubline: "A premium salon experience for hair, nails, and beauty — where every visit leaves you glowing.",
  },
  {
    id: "tpl-093", slug: "fade-barbershop", name: "FadeShop", category: "Health & Beauty",
    description: "Cool, urban barbershop template with a dark, masculine aesthetic. Designed for modern barbers and grooming studios targeting style-conscious clients.",
    tags: ["barbershop", "haircut", "grooming", "barber", "men's hair"],
    gradient: "from-zinc-700 to-stone-900", accentColor: "yellow", accentColorHex: "#fbbf24",
    primaryColor: "#1c1917", secondaryColor: "#fbbf24",
    thumbFrom: "#52525b", thumbTo: "#1c1917",
    heroImage: "https://images.pexels.com/photos/3997990/pexels-photo-3997990.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true, badge: "New",
    heroHeadline: "Sharp Cuts, Clean Lines",
    heroSubline: "The neighbourhood's go-to barbershop — book your cut and walk out a new man.",
  },
  {
    id: "tpl-094", slug: "smilestudio-dental", name: "SmileStudio", category: "Health & Beauty",
    description: "Clean and reassuring dental clinic template with a modern, clinical-yet-welcoming design. Highlights treatments, team credentials, and patient comfort.",
    tags: ["dental", "dentist", "oral health", "clinic", "teeth"],
    gradient: "from-sky-400 to-blue-700", accentColor: "sky", accentColorHex: "#38bdf8",
    primaryColor: "#1e3a5f", secondaryColor: "#38bdf8",
    thumbFrom: "#0284c7", thumbTo: "#1e3a5f",
    heroImage: "https://images.pexels.com/photos/6620758/pexels-photo-6620758.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true,
    heroHeadline: "Your Healthiest Smile Starts Here",
    heroSubline: "Comprehensive dental care for the whole family — gentle, modern, and always welcoming.",
  },

  // ── Batch 2: Fitness & Sports ─────────────────────────────────────────────────
  {
    id: "tpl-095", slug: "ironforge-gym", name: "IronForge", category: "Fitness & Sports",
    description: "Powerful gym and fitness centre template with a dark, motivational aesthetic. Features membership tiers, class schedules, and trainer profiles.",
    tags: ["gym", "fitness", "weights", "membership", "classes"],
    gradient: "from-red-600 to-gray-900", accentColor: "red", accentColorHex: "#ef4444",
    primaryColor: "#111827", secondaryColor: "#ef4444",
    thumbFrom: "#dc2626", thumbTo: "#111827",
    heroImage: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true, featured: true,
    heroHeadline: "Forge Your Best Self",
    heroSubline: "State-of-the-art gym with expert trainers, diverse classes, and a community that drives results.",
  },
  {
    id: "tpl-096", slug: "peak-pt", name: "PeakPT", category: "Fitness & Sports",
    description: "Personal trainer template with a clean, results-driven design. Showcases transformation stories, training packages, and the trainer's philosophy.",
    tags: ["personal trainer", "PT", "fitness coaching", "weight loss", "strength"],
    gradient: "from-violet-600 to-purple-900", accentColor: "violet", accentColorHex: "#7c3aed",
    primaryColor: "#2e1065", secondaryColor: "#7c3aed",
    thumbFrom: "#6d28d9", thumbTo: "#2e1065",
    heroImage: "https://images.pexels.com/photos/703016/pexels-photo-703016.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Train Smarter, Achieve More",
    heroSubline: "Personalised fitness coaching that fits your goals, your schedule, and your lifestyle.",
  },

  // ── Batch 2: General Business (Courier, Storage, Printing) ───────────────────
  {
    id: "tpl-097", slug: "swiftdrop-courier", name: "SwiftDrop", category: "General Business",
    description: "Efficient courier and delivery services template with a clean, logistics-focused design. Highlights same-day delivery, live tracking, and business accounts.",
    tags: ["courier", "delivery", "logistics", "same-day", "parcels"],
    gradient: "from-orange-500 to-red-700", accentColor: "orange", accentColorHex: "#f97316",
    primaryColor: "#7f1d1d", secondaryColor: "#f97316",
    thumbFrom: "#ea580c", thumbTo: "#7f1d1d",
    heroImage: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true,
    heroHeadline: "Delivered on Time, Every Time",
    heroSubline: "Same-day and express courier services for businesses and individuals — reliable, fast, tracked.",
  },
  {
    id: "tpl-098", slug: "vaultstore", name: "VaultStore", category: "General Business",
    description: "Professional storage and removals template with a trustworthy, clean layout. Ideal for self-storage facilities, moving companies, and packing services.",
    tags: ["storage", "removals", "moving", "self-storage", "packing"],
    gradient: "from-slate-500 to-blue-900", accentColor: "blue", accentColorHex: "#3b82f6",
    primaryColor: "#1e3a5f", secondaryColor: "#3b82f6",
    thumbFrom: "#334155", thumbTo: "#1e3a5f",
    heroImage: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Store More, Stress Less",
    heroSubline: "Secure storage and professional removals — your belongings are safe in our hands.",
  },
  {
    id: "tpl-099", slug: "pressmark-print", name: "PressMark", category: "General Business",
    description: "Creative printing and signage template with a bold, design-conscious identity. Showcases product categories, turnaround times, and custom quote requests.",
    tags: ["printing", "signage", "branding", "banners", "custom print"],
    gradient: "from-fuchsia-600 to-violet-900", accentColor: "fuchsia", accentColorHex: "#d946ef",
    primaryColor: "#2e1065", secondaryColor: "#d946ef",
    thumbFrom: "#a21caf", thumbTo: "#2e1065",
    heroImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 5, hasDemo: true,
    heroHeadline: "Print That Makes an Impression",
    heroSubline: "Custom printing and signage solutions — from business cards to building-sized banners.",
  },

  // ── Batch 2: Education ────────────────────────────────────────────────────────
  {
    id: "tpl-100", slug: "brightminds-tutor", name: "BrightMinds", category: "Education",
    description: "Friendly and encouraging tutoring centre template with a bright, student-focused design. Highlights subjects, tutor credentials, and enrolment steps.",
    tags: ["tutoring", "education", "students", "learning", "academic"],
    gradient: "from-blue-500 to-indigo-700", accentColor: "blue", accentColorHex: "#3b82f6",
    primaryColor: "#1e1b4b", secondaryColor: "#3b82f6",
    thumbFrom: "#2563eb", thumbTo: "#1e1b4b",
    heroImage: "https://images.pexels.com/photos/3184183/pexels-photo-3184183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Unlock Every Student's Potential",
    heroSubline: "Expert tutoring across all subjects — tailored lessons that build confidence and results.",
  },
  {
    id: "tpl-101", slug: "skillforge-training", name: "SkillForge", category: "Education",
    description: "Professional vocational training centre template with a structured, outcomes-focused design. Highlights certifications, course listings, and career pathways.",
    tags: ["vocational training", "certificates", "courses", "skills", "professional development"],
    gradient: "from-teal-600 to-emerald-900", accentColor: "teal", accentColorHex: "#14b8a6",
    primaryColor: "#064e3b", secondaryColor: "#14b8a6",
    thumbFrom: "#0d9488", thumbTo: "#064e3b",
    heroImage: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true,
    heroHeadline: "Build Skills That Open Doors",
    heroSubline: "Accredited vocational courses and professional certifications to launch or advance your career.",
  },

  // ── Batch 2: Legal & Finance ──────────────────────────────────────────────────
  {
    id: "tpl-102", slug: "lexbridge-law", name: "LexBridge", category: "Legal & Finance",
    description: "Authoritative law firm template with a sophisticated dark design. Conveys professionalism through structured practice area listings and attorney profiles.",
    tags: ["law firm", "legal", "solicitors", "attorneys", "legal services"],
    gradient: "from-slate-700 to-gray-900", accentColor: "amber", accentColorHex: "#b45309",
    primaryColor: "#111827", secondaryColor: "#b45309",
    thumbFrom: "#374151", thumbTo: "#111827",
    heroImage: "https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true, featured: true,
    heroHeadline: "Legal Expertise You Can Rely On",
    heroSubline: "Dedicated legal counsel for individuals and businesses — protecting your rights, advancing your interests.",
  },
  {
    id: "tpl-103", slug: "cleartax-accounting", name: "ClearTax", category: "Legal & Finance",
    description: "Clean and professional accounting and tax services template. Builds credibility through clear service descriptions, pricing transparency, and client testimonials.",
    tags: ["accounting", "tax", "bookkeeping", "BAS", "financial services"],
    gradient: "from-green-600 to-emerald-900", accentColor: "green", accentColorHex: "#16a34a",
    primaryColor: "#052e16", secondaryColor: "#16a34a",
    thumbFrom: "#15803d", thumbTo: "#052e16",
    heroImage: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Smart Accounting, Stress-Free Tax",
    heroSubline: "Trusted accountants and tax advisors helping businesses and individuals keep more of what they earn.",
  },

  // ── Batch 2: Photography ──────────────────────────────────────────────────────
  {
    id: "tpl-104", slug: "lenscroft-studio", name: "LensCroft", category: "Photography",
    description: "Stunning photography studio template with a dark, gallery-forward aesthetic. Showcases portfolios, session packages, and the photographer's unique visual style.",
    tags: ["photography", "studio", "portrait", "wedding", "commercial"],
    gradient: "from-neutral-700 to-black", accentColor: "amber", accentColorHex: "#f59e0b",
    primaryColor: "#0a0a0a", secondaryColor: "#f59e0b",
    thumbFrom: "#404040", thumbTo: "#0a0a0a",
    heroImage: "https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "Every Frame Tells a Story",
    heroSubline: "Professional photography for weddings, portraits, and brands — capturing moments that last forever.",
  },

  // ── Batch 2: Events ───────────────────────────────────────────────────────────
  {
    id: "tpl-105", slug: "forever-events", name: "ForeverEvents", category: "Events",
    description: "Romantic and elegant wedding planning template with a soft, luxurious aesthetic. Highlights planning packages, vendor coordination, and real wedding galleries.",
    tags: ["wedding", "events", "planning", "coordination", "celebration"],
    gradient: "from-rose-300 to-pink-700", accentColor: "rose", accentColorHex: "#fb7185",
    primaryColor: "#4c0519", secondaryColor: "#fb7185",
    thumbFrom: "#fb7185", thumbTo: "#4c0519",
    heroImage: "https://images.pexels.com/photos/1570236/pexels-photo-1570236.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true, featured: true,
    heroHeadline: "Your Perfect Day, Perfectly Planned",
    heroSubline: "Award-winning wedding planners creating unforgettable celebrations — tailored to your love story.",
  },

  // ── Batch 2: Real Estate ──────────────────────────────────────────────────────
  {
    id: "tpl-106", slug: "prime-property", name: "PrimeProperty", category: "Real Estate",
    description: "Sleek property agent template with a clean split-image hero and featured listings grid. Ideal for residential sales agents and boutique real estate offices.",
    tags: ["real estate", "property", "sales", "listings", "agent"],
    gradient: "from-blue-600 to-indigo-900", accentColor: "blue", accentColorHex: "#3b82f6",
    primaryColor: "#1e1b4b", secondaryColor: "#3b82f6",
    thumbFrom: "#1d4ed8", thumbTo: "#1e1b4b",
    heroImage: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true, badge: "New",
    heroHeadline: "Find Your Perfect Property",
    heroSubline: "Local experts connecting buyers, sellers, and investors with the right properties at the right price.",
  },
  {
    id: "tpl-107", slug: "propertyvault-mgmt", name: "PropertyVault", category: "Real Estate",
    description: "Professional property management template built for landlords and portfolio owners. Showcases management services, rental processes, and transparent fee structures.",
    tags: ["property management", "landlord", "rental", "leasing", "real estate"],
    gradient: "from-slate-600 to-teal-900", accentColor: "teal", accentColorHex: "#14b8a6",
    primaryColor: "#042f2e", secondaryColor: "#14b8a6",
    thumbFrom: "#0f766e", thumbTo: "#042f2e",
    heroImage: "https://images.pexels.com/photos/1769535/pexels-photo-1769535.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true,
    heroHeadline: "Hands-Off Property Management You Can Trust",
    heroSubline: "We manage your investment property from tenant sourcing to maintenance — stress-free ownership.",
  },

  // ── Batch 2: Tech & Agency ────────────────────────────────────────────────────
  {
    id: "tpl-108", slug: "netsupport-it", name: "NetSupport", category: "Tech & Agency",
    description: "Professional IT support and managed services template with a clean, corporate tech aesthetic. Built for MSPs, IT helpdesks, and technology support businesses.",
    tags: ["IT support", "managed services", "helpdesk", "technology", "MSP"],
    gradient: "from-cyan-600 to-blue-900", accentColor: "cyan", accentColorHex: "#06b6d4",
    primaryColor: "#0c1a2e", secondaryColor: "#06b6d4",
    thumbFrom: "#0891b2", thumbTo: "#0c1a2e",
    heroImage: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 6, hasDemo: true, badge: "New",
    heroHeadline: "IT That Just Works",
    heroSubline: "Managed IT support for businesses of all sizes — proactive, responsive, and always on.",
  },
  {
    id: "tpl-109", slug: "growthlab-agency", name: "GrowthLab", category: "Tech & Agency",
    description: "Bold digital marketing agency template with an editorial, results-focused design. Showcases service offerings, client results, and the agency's strategic approach.",
    tags: ["digital marketing", "agency", "SEO", "social media", "growth"],
    gradient: "from-violet-600 to-fuchsia-900", accentColor: "violet", accentColorHex: "#8b5cf6",
    primaryColor: "#2e1065", secondaryColor: "#8b5cf6",
    thumbFrom: "#6d28d9", thumbTo: "#2e1065",
    heroImage: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pages: 7, hasDemo: true, featured: true,
    heroHeadline: "Grow Faster. Rank Higher. Convert More.",
    heroSubline: "Data-driven digital marketing strategies that deliver measurable results for ambitious brands.",
  },
];

export const TEMPLATE_CATEGORIES = [
  "All",
  "Cleaning",
  "HVAC & Plumbing",
  "Renovation & Construction",
  "Interior Design",
  "Health & Beauty",
  "Automotive",
  "Events",
  "Retail & Shop",
  "General Business",
  "Restaurant & Cafe",
  "Fitness & Sports",
  "Legal & Finance",
  "Real Estate",
  "Photography",
  "Education",
  "Tech & Agency",
] as const;
