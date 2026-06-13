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
  /** Unsplash photo URL for thumbnail hero background */
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
    heroImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&q=80&fit=crop",
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
    heroImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80&fit=crop",
    pages: 5, hasDemo: true, badge: "New",
    heroHeadline: "Pass First Time. Drive for Life.",
    heroSubline: "Singapore's most trusted driving school. 94% first-attempt pass rate. Book your slot now.",
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
] as const;
