/**
 * Template Identity Registry
 *
 * Each template defines:
 * - Full visual identity (colors, fonts, border radius, spacing)
 * - CSS custom property overrides injected at :root
 * - Per-block variant keys that switch layout/style rendering
 * - Real Unsplash images for hero, services, gallery, team sections
 * - Complete demo content (services, testimonials, stats, pricing, FAQ)
 * - Default block stack for the homepage
 *
 * Switching templates = completely different site appearance AND content structure.
 */

export type TemplateBlockVariants = {
  hero: string;
  services: string;
  testimonials: string;
  features: string;
  stats: string;
  cta: string;
  pricing: string;
  faq: string;
  navigation: string;
  team: string;
};

export type TemplateTypography = {
  headingFont: string;
  bodyFont: string;
  headingWeight: string;
  letterSpacing: string;
};

export type TemplatePalette = {
  primary: string;
  primaryFg: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedFg: string;
  card: string;
  border: string;
  ring: string;
  borderRadius: string;
};

export type TemplateImage = {
  url: string;
  alt: string;
};

export type TemplateImages = {
  hero: TemplateImage;
  heroSecondary?: TemplateImage;
  about?: TemplateImage;
  services: TemplateImage[];
  gallery: TemplateImage[];
  team: TemplateImage[];
  cta?: TemplateImage;
};

export type TemplateServiceDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconType: "emoji" | "lucide";
  imageUrl?: string;
  price?: string;
  link?: string;
};

export type TemplateTestimonialDef = {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  avatar?: string;
};

export type TemplateStatDef = {
  id: string;
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: string;
};

export type TemplatePricingDef = {
  id: string;
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  ctaLabel: string;
  ctaUrl: string;
};

export type TemplateFAQDef = {
  id: string;
  question: string;
  answer: string;
};

export type TemplateTeamMemberDef = {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  social?: { platform: string; url: string }[];
};

export type TemplateNavItem = {
  id: string;
  label: string;
  url: string;
};

export type TemplateIdentity = {
  slug: string;
  name: string;
  description: string;
  category: string;
  author: string;
  version: string;
  previewImage: string;
  tags: string[];

  // Visual identity
  palette: TemplatePalette;
  typography: TemplateTypography;
  customCss?: string;

  // Block variant keys — each block reads this to pick its layout/style
  variants: TemplateBlockVariants;

  // Real images
  images: TemplateImages;

  // Demo content
  heroHeadline: string;
  heroSubline: string;
  heroBadge?: string;
  heroCTA: string;
  heroSecondaryCTA: string;
  siteName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  aboutHeading: string;
  aboutBody: string;
  aboutHighlights: string[];
  navItems: TemplateNavItem[];
  services: TemplateServiceDef[];
  stats: TemplateStatDef[];
  testimonials: TemplateTestimonialDef[];
  pricing?: TemplatePricingDef[];
  faq?: TemplateFAQDef[];
  team?: TemplateTeamMemberDef[];
};

// ─── Utility ─────────────────────────────────────────────────────────────────

let _counter = 0;
function uid(prefix: string) { return `${prefix}-${++_counter}`; }

// ─── TEMPLATE 1: CleanPro ─────────────────────────────────────────────────────

const CLEAN_PRO: TemplateIdentity = {
  slug: "clean-pro",
  name: "CleanPro",
  description: "Professional cleaning services with bright, trustworthy design. Bold stats, card services, testimonial carousel.",
  category: "Cleaning",
  author: "Passive Coder",
  version: "2.0.0",
  previewImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=85&fit=crop",
  tags: ["cleaning", "services", "booking", "residential"],

  palette: {
    primary: "#0ea5e9",
    primaryFg: "#ffffff",
    secondary: "#06b6d4",
    accent: "#38bdf8",
    background: "#f0f9ff",
    foreground: "#0c4a6e",
    muted: "#e0f2fe",
    mutedFg: "#0369a1",
    card: "#ffffff",
    border: "#bae6fd",
    ring: "#0ea5e9",
    borderRadius: "0.75rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-clean-pro .hero-badge { background: #0ea5e9; color: white; border-radius: 9999px; }
    .template-clean-pro .service-card { border-top: 3px solid #0ea5e9; }
    .template-clean-pro .stat-value { color: #0ea5e9; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85&fit=crop",
      alt: "Professional cleaning team",
    },
    heroSecondary: {
      url: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80&fit=crop",
      alt: "Clean modern home interior",
    },
    about: {
      url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&fit=crop",
      alt: "Cleaning service in action",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1527515637462-cff94ebb3cfe?w=600&q=80&fit=crop", alt: "House cleaning" },
      { url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80&fit=crop", alt: "Deep cleaning" },
      { url: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=600&q=80&fit=crop", alt: "Office cleaning" },
      { url: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80&fit=crop", alt: "Window cleaning" },
      { url: "https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80&fit=crop", alt: "Carpet cleaning" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80&fit=crop", alt: "End of lease cleaning" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop", alt: "Before and after kitchen" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80&fit=crop", alt: "Clean bathroom" },
      { url: "https://images.unsplash.com/photo-1600607687644-c7171b47af3b?w=800&q=80&fit=crop", alt: "Spotless living room" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&fit=crop", alt: "Clean bedroom" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80&fit=crop&face", alt: "Sarah Mitchell" },
      { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face", alt: "James Rivera" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Priya Sharma" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80&fit=crop",
      alt: "Book cleaning service",
    },
  },

  heroHeadline: "Professional Cleaning You Can Trust",
  heroSubline: "Residential & commercial cleaning. Fully insured, satisfaction guaranteed.",
  heroBadge: "⭐ #1 Rated Cleaning Service",
  heroCTA: "Book a Clean",
  heroSecondaryCTA: "Get Free Quote",
  siteName: "CleanPro Services",
  tagline: "Professional Cleaning You Can Trust",
  phone: "+1 (800) 555-2748",
  email: "hello@cleanpro.com",
  address: "45 Sparkle Street, Downtown District",
  aboutHeading: "Dubai's Most Trusted Cleaning Company Since 2012",
  aboutBody: "CleanPro has been delivering five-star cleaning experiences for over 12 years. Our team of 45 certified cleaners uses eco-friendly products that are safe for children, pets, and the planet. We're fully insured, background-checked, and committed to your complete satisfaction.",
  aboutHighlights: ["Eco-friendly certified products", "Police-checked & insured staff", "100% satisfaction guarantee", "Same-day availability"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "Gallery", url: "#gallery" },
    { id: "n4", label: "About", url: "#about" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Regular House Clean", description: "Weekly, bi-weekly or monthly scheduled cleaning for a consistently fresh home.", icon: "🏠", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94ebb3cfe?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Deep Clean", description: "Top-to-bottom intensive clean including behind appliances, baseboards and inside cabinets.", icon: "✨", iconType: "emoji", price: "From $189", imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "End-of-Lease Clean", description: "Bond-back guarantee. We clean to real-estate inspection standards.", icon: "🔑", iconType: "emoji", price: "From $249", imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Office Cleaning", description: "Daily, weekly or after-hours commercial cleaning for offices of all sizes.", icon: "🏢", iconType: "emoji", price: "From $120", imageUrl: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Carpet & Upholstery", description: "Hot water extraction steam cleaning for carpets, rugs and fabric sofas.", icon: "🛋️", iconType: "emoji", price: "From $79", imageUrl: "https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Window Cleaning", description: "Streak-free interior and exterior window cleaning using purified water systems.", icon: "🪟", iconType: "emoji", price: "From $59", imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "3,400+", label: "Homes Cleaned" },
    { id: uid("st"), value: "98%", label: "Satisfaction Rate" },
    { id: uid("st"), value: "12 yr", label: "In Business" },
    { id: uid("st"), value: "5★", label: "Average Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Jessica M.", role: "Homeowner", content: "I've tried three other services. CleanPro is in a completely different league. My house has never been this clean.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Daniel K.", role: "Office Manager", content: "Reliable, thorough and professional. Our office looks brand new after every visit. Highly recommend.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Amira S.", role: "Property Manager", content: "End-of-lease cleans are always stressful. CleanPro made it effortless — full bond returned!", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Tom W.", role: "Landlord", content: "Use them between every tenancy. Fast, affordable and always spotless. My go-to team.", rating: 5 },
    { id: uid("t"), name: "Lena P.", role: "Working Mom", content: "Coming home to a sparkling clean house every Friday is the best feeling. Worth every penny.", rating: 5 },
    { id: uid("t"), name: "Marcus T.", role: "Restaurant Owner", content: "Commercial kitchen deep clean done to health inspection standard. Impressed.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Basic", price: "$89", period: "/visit", description: "Perfect for small apartments", features: ["Up to 2 bedrooms", "Kitchen & bathrooms", "Vacuuming & mopping", "Surface dusting"], ctaLabel: "Book Basic", ctaUrl: "#contact" },
    { id: uid("p"), name: "Standard", price: "$149", period: "/visit", description: "Our most popular package", features: ["Up to 4 bedrooms", "All rooms included", "Inside oven & fridge", "Window sills & blinds", "Eco-friendly products"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Standard", ctaUrl: "#contact" },
    { id: uid("p"), name: "Premium", price: "$249", period: "/visit", description: "Complete white-glove service", features: ["Unlimited rooms", "Deep clean included", "Carpet steam cleaning", "Interior windows", "Wall spot cleaning", "Priority scheduling"], ctaLabel: "Book Premium", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do I need to be home during the cleaning?", answer: "No — most clients give us a key or door code. We're fully insured and all staff are police-checked." },
    { id: uid("f"), question: "What cleaning products do you use?", answer: "We use eco-certified, biodegradable products that are safe for children, pets and the environment." },
    { id: uid("f"), question: "How do I book?", answer: "Use the form below, call us, or WhatsApp. We'll confirm your booking within 2 hours and send a reminder the day before." },
    { id: uid("f"), question: "What if I'm not satisfied?", answer: "We'll return within 24 hours and re-clean for free — no questions asked. That's our guarantee." },
    { id: uid("f"), question: "Do you bring your own equipment?", answer: "Yes, we bring everything — vacuums, mops, cleaning solutions and microfibre cloths. You don't need to provide anything." },
  ],
};

// ─── TEMPLATE 2: LuxeSpa ─────────────────────────────────────────────────────

const LUXE_SPA: TemplateIdentity = {
  slug: "luxe-spa",
  name: "LuxeSpa",
  description: "High-end spa & wellness studio. Dark, luxurious aesthetic with full-screen hero, elegant service cards and minimal typography.",
  category: "Health & Beauty",
  author: "Passive Coder",
  version: "2.0.0",
  previewImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=85&fit=crop",
  tags: ["spa", "wellness", "beauty", "massage", "luxury"],

  palette: {
    primary: "#c9a96e",
    primaryFg: "#1a1209",
    secondary: "#8b7355",
    accent: "#e8d5b0",
    background: "#0d0b08",
    foreground: "#f5efe6",
    muted: "#1e1a14",
    mutedFg: "#a89880",
    card: "#161310",
    border: "#2e2820",
    ring: "#c9a96e",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    headingWeight: "400",
    letterSpacing: "0.05em",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
    .template-luxe-spa { font-family: 'Inter', sans-serif; }
    .template-luxe-spa h1,.template-luxe-spa h2,.template-luxe-spa h3 { font-family: 'Playfair Display', serif; font-weight: 400; letter-spacing: 0.05em; }
    .template-luxe-spa .service-card { border: 1px solid #2e2820; transition: border-color 0.3s; }
    .template-luxe-spa .service-card:hover { border-color: #c9a96e; }
    .template-luxe-spa .hero-overlay { background: linear-gradient(to right, rgba(13,11,8,0.9) 40%, rgba(13,11,8,0.2)); }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "image-cards-dark",
    testimonials: "minimal-quote",
    features: "icon-list-dark",
    stats: "plain-dark",
    cta: "dark-split",
    pricing: "minimal-dark",
    faq: "accordion-minimal",
    navigation: "transparent-dark",
    team: "portrait-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1600&q=90&fit=crop",
      alt: "Luxury spa treatment room",
    },
    about: {
      url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&fit=crop",
      alt: "Spa interior",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=85&fit=crop", alt: "Hot stone massage" },
      { url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=85&fit=crop", alt: "Facial treatment" },
      { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=85&fit=crop", alt: "Body massage" },
      { url: "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=600&q=85&fit=crop", alt: "Manicure pedicure" },
      { url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=85&fit=crop", alt: "Hair treatment" },
      { url: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=85&fit=crop", alt: "Aromatherapy" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80&fit=crop", alt: "Treatment room" },
      { url: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80&fit=crop", alt: "Relaxation pool" },
      { url: "https://images.unsplash.com/photo-1522057384400-681b421b0439?w=800&q=80&fit=crop", alt: "Spa ambience" },
      { url: "https://images.unsplash.com/photo-1611072965929-a6b4f0c8cccc?w=800&q=80&fit=crop", alt: "Beauty products" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&fit=crop&face", alt: "Elena Rossi" },
      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face", alt: "Sophie Laurent" },
      { url: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=400&q=80&fit=crop&face", alt: "Maria Santos" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1542435503-956c469947f6?w=1200&q=80&fit=crop",
      alt: "Book spa experience",
    },
  },

  heroHeadline: "Discover True Serenity",
  heroSubline: "Bespoke spa rituals crafted for your body, mind and soul.",
  heroBadge: "✦ Award-Winning Luxury Spa",
  heroCTA: "Book a Treatment",
  heroSecondaryCTA: "View Menu",
  siteName: "LuxeSpa Wellness",
  tagline: "Where luxury meets healing",
  phone: "+1 (212) 555-0198",
  email: "reservations@luxespa.com",
  address: "88 Serenity Boulevard, Manhattan",
  aboutHeading: "A Sanctuary of Refined Wellness",
  aboutBody: "LuxeSpa was founded with a single purpose: to create a sanctuary where the demands of modern life simply cease to exist. Our master therapists hold international certifications and draw on ancient healing traditions from Bali, Japan and the Mediterranean.",
  aboutHighlights: ["Master certified therapists", "Organic & cruelty-free products only", "Private treatment suites", "Couples & group packages available"],

  navItems: [
    { id: "n1", label: "Treatments", url: "#services" },
    { id: "n2", label: "Packages", url: "#pricing" },
    { id: "n3", label: "Gallery", url: "#gallery" },
    { id: "n4", label: "Our Story", url: "#about" },
    { id: "n5", label: "Reservations", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Hot Stone Ritual", description: "Volcanic basalt stones release deep muscle tension while warm essential oils restore balance and calm.", icon: "🪨", iconType: "emoji", price: "90 min · $185", imageUrl: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Luminous Facial", description: "Our signature facial combines diamond microdermabrasion with hyaluronic infusion for visible radiance.", icon: "💎", iconType: "emoji", price: "75 min · $165", imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Deep Tissue Massage", description: "Targets chronic tension patterns with firm, sustained pressure and trigger-point release techniques.", icon: "🌿", iconType: "emoji", price: "60 min · $140", imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Luxury Mani-Pedi", description: "Paraffin soak, sugar scrub and gel finish. Hands and feet treated to a full hour of pampering.", icon: "💅", iconType: "emoji", price: "60 min · $95", imageUrl: "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bali Hair Ritual", description: "Scalp detox, deep conditioning treatment and blow-dry. Infused with coconut and argan oils.", icon: "🌺", iconType: "emoji", price: "90 min · $120", imageUrl: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Aromatherapy Journey", description: "Full-body treatment with custom-blended essential oils to restore your emotional and physical balance.", icon: "🕯️", iconType: "emoji", price: "120 min · $220", imageUrl: "https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=85&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "12+", label: "Years of Excellence" },
    { id: uid("st"), value: "8,000+", label: "Guests Served" },
    { id: uid("st"), value: "24", label: "Treatment Rooms" },
    { id: uid("st"), value: "4.9★", label: "Guest Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Natasha V.", role: "Regular Guest", content: "LuxeSpa is my monthly ritual. The Hot Stone treatment is absolutely transformative. I leave feeling reborn every single time.", rating: 5, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Charlotte R.", role: "Bride", content: "Booked the bridal package for my wedding day. Elena and her team were flawless. I've never felt so beautiful and relaxed simultaneously.", rating: 5 },
    { id: uid("t"), name: "James T.", role: "Corporate Client", content: "Brought my entire team here for our company retreat. Every single person left completely transformed. Exceptional.", rating: 5 },
    { id: uid("t"), name: "Yuki N.", role: "Wellness Enthusiast", content: "As someone who has visited spas across Asia and Europe, LuxeSpa genuinely stands apart. The Bali Ritual is world-class.", rating: 5, avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&q=80&fit=crop&face" },
  ],

  pricing: [
    { id: uid("p"), name: "Escape", price: "$185", description: "Single signature treatment", features: ["1 treatment of your choice", "Herbal tea & refreshments", "Use of relaxation lounge", "Complimentary robe & slippers"], ctaLabel: "Book Escape", ctaUrl: "#contact" },
    { id: uid("p"), name: "Journey", price: "$340", description: "The complete spa day", features: ["2 treatments of your choice", "Gourmet spa lunch", "Full day lounge access", "Hair & nail finish", "Welcome gift"], highlighted: true, badge: "Most Chosen", ctaLabel: "Book Journey", ctaUrl: "#contact" },
    { id: uid("p"), name: "Sanctuary", price: "$580", description: "Ultimate luxury retreat", features: ["3 bespoke treatments", "Private suite all day", "Champagne & canapés", "Full grooming service", "Personalised ritual plan", "Take-home product set"], ctaLabel: "Book Sanctuary", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "When should I arrive for my appointment?", answer: "Please arrive 15 minutes early to complete your wellness profile and begin relaxing in our lounge. Arriving late may shorten your treatment time." },
    { id: uid("f"), question: "What should I wear?", answer: "We provide robes, slippers and towels. For most body treatments, you'll be draped at all times. Simply arrive in comfortable clothing." },
    { id: uid("f"), question: "Do you offer couples treatments?", answer: "Yes — our Couples Suite accommodates two guests simultaneously for any of our signature treatments. We recommend booking 2 weeks in advance." },
    { id: uid("f"), question: "What is your cancellation policy?", answer: "We request 24 hours notice for cancellations. Late cancellations or no-shows are charged 50% of the treatment price." },
  ],

  team: [
    { id: uid("tm"), name: "Elena Rossi", role: "Head Therapist", bio: "12 years of experience, trained in Bali and Thailand. Specialises in ancient healing massage techniques.", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Sophie Laurent", role: "Skin Expert", bio: "Award-winning facialist. Certified in CACI, microdermabrasion and advanced skin rejuvenation.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Maria Santos", role: "Beauty Therapist", bio: "Nail art and beauty specialist with 8 years in luxury hospitality. Speaks three languages.", avatar: "https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 3: LexCore (Law Firm) ──────────────────────────────────────────

const LEX_CORE: TemplateIdentity = {
  slug: "lex-core",
  name: "LexCore",
  description: "Authority law firm template. Navy & gold, serif headings, case results stats, service list layout, formal testimonials.",
  category: "Legal & Finance",
  author: "Passive Coder",
  version: "2.0.0",
  previewImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=85&fit=crop",
  tags: ["law", "legal", "attorney", "corporate", "finance"],

  palette: {
    primary: "#1e3a5f",
    primaryFg: "#ffffff",
    secondary: "#c9a84c",
    accent: "#e8d5a3",
    background: "#f8f7f4",
    foreground: "#1a1a1a",
    muted: "#ede9e0",
    mutedFg: "#5a5a5a",
    card: "#ffffff",
    border: "#d4c89a",
    ring: "#1e3a5f",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "0",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap');
    .template-lex-core h1,.template-lex-core h2,.template-lex-core h3 { font-family: 'Playfair Display', serif; }
    .template-lex-core .service-card { border-left: 4px solid #c9a84c; }
    .template-lex-core .stat-value { color: #1e3a5f; }
    .template-lex-core .nav-bar { border-bottom: 2px solid #c9a84c; }
  `,

  variants: {
    hero: "centered-bold",
    services: "bordered-list",
    testimonials: "formal-cards",
    features: "alternating-images",
    stats: "navy-row",
    cta: "navy-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "formal-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&q=90&fit=crop",
      alt: "Law office",
    },
    about: {
      url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&q=80&fit=crop",
      alt: "Legal consultation",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&fit=crop", alt: "Corporate law" },
      { url: "https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?w=600&q=80&fit=crop", alt: "Family law" },
      { url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&fit=crop", alt: "Real estate law" },
      { url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80&fit=crop", alt: "Tax law" },
      { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80&fit=crop", alt: "Employment law" },
      { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", alt: "Immigration law" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80&fit=crop", alt: "Law library" },
      { url: "https://images.unsplash.com/photo-1541447271487-09612b3f49f7?w=800&q=80&fit=crop", alt: "Conference room" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&fit=crop", alt: "Office" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Robert Hayes" },
      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face", alt: "Sarah Chen" },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face", alt: "Michael Torres" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80&fit=crop",
      alt: "Legal consultation",
    },
  },

  heroHeadline: "Justice. Integrity. Results.",
  heroSubline: "A full-service law firm protecting your rights and your future.",
  heroBadge: "⚖️ Serving Clients Since 1998",
  heroCTA: "Free Consultation",
  heroSecondaryCTA: "Our Practice Areas",
  siteName: "Hayes & Partners Law",
  tagline: "Justice. Integrity. Results.",
  phone: "+1 (212) 555-0147",
  email: "consult@hayeslaw.com",
  address: "One Financial Plaza, 25th Floor, New York, NY 10004",
  aboutHeading: "25 Years of Winning for Our Clients",
  aboutBody: "Hayes & Partners is a full-service law firm headquartered in Manhattan. Our attorneys have argued before the Supreme Court, recovered over $2 billion for clients, and maintained a 94% success rate across all practice areas. We combine the resources of a large firm with the personal attention of a boutique.",
  aboutHighlights: ["$2B+ recovered for clients", "94% case success rate", "Board-certified in 8 practice areas", "Available 24/7 for urgent matters"],

  navItems: [
    { id: "n1", label: "Practice Areas", url: "#services" },
    { id: "n2", label: "Our Team", url: "#team" },
    { id: "n3", label: "Results", url: "#stats" },
    { id: "n4", label: "About", url: "#about" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Corporate & Business Law", description: "Entity formation, contracts, M&A transactions, corporate governance and commercial dispute resolution.", icon: "🏛️", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Family & Divorce Law", description: "Divorce, child custody, support agreements and adoption handled with sensitivity and legal precision.", icon: "👨‍👩‍👧", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Real Estate Law", description: "Property transactions, title disputes, landlord-tenant matters and commercial real estate closings.", icon: "🏠", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Tax & Estate Planning", description: "Minimise liability, protect your estate and ensure your assets are transferred according to your wishes.", icon: "📋", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Employment Law", description: "Wrongful termination, discrimination, wage disputes and workplace investigations for employers and employees.", icon: "⚖️", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Immigration Law", description: "Visas, green cards, citizenship, business immigration and deportation defense.", icon: "🌍", iconType: "emoji", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "$2B+", label: "Recovered for Clients" },
    { id: uid("st"), value: "94%", label: "Success Rate" },
    { id: uid("st"), value: "25 yr", label: "Years in Practice" },
    { id: uid("st"), value: "1,200+", label: "Cases Won" },
  ],

  testimonials: [
    { id: uid("t"), name: "Richard Hollis", role: "CEO, Hollis Corp", content: "Hayes & Partners managed our $40M acquisition flawlessly. Robert and his team were thorough, responsive and always three steps ahead of opposing counsel.", rating: 5 },
    { id: uid("t"), name: "Maria Guzman", role: "Plaintiff", content: "After my wrongful termination, I was devastated. The employment team won my case and secured a settlement that changed my life. Forever grateful.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Dr. James Park", role: "Property Developer", content: "Real estate closings are complex. Their team handled every detail of our 6-property portfolio transfer without a single issue. Exceptional service.", rating: 5 },
    { id: uid("t"), name: "Linda Okafor", role: "Immigration Client", content: "Got my family's green cards approved after 3 previous denials with other attorneys. Sarah Chen is a miracle worker.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Consultation", price: "Free", description: "30-minute initial review", features: ["Case evaluation", "Strategic overview", "Fee structure discussion", "No obligation"], ctaLabel: "Book Free Consult", ctaUrl: "#contact" },
    { id: uid("p"), name: "Flat Fee", price: "From $2,500", description: "Fixed-cost matters", features: ["Document drafting", "Contract review", "Will & trust prep", "Simple transactions", "Clear upfront pricing"], highlighted: true, badge: "Most Transparent", ctaLabel: "Discuss Options", ctaUrl: "#contact" },
    { id: uid("p"), name: "Retainer", price: "Custom", description: "Ongoing representation", features: ["Dedicated attorney", "Priority response", "Unlimited consultations", "Full litigation support", "Quarterly legal audits"], ctaLabel: "Get a Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How much does a consultation cost?", answer: "Your first 30-minute consultation is completely free. We'll assess your case, explain your options and provide a clear fee structure before any commitment." },
    { id: uid("f"), question: "How long does my case take?", answer: "Timeline depends on complexity. Simple contracts take days; litigation can take 6–24 months. We provide realistic timelines at the start and update you at every stage." },
    { id: uid("f"), question: "Do you offer payment plans?", answer: "Yes. We offer flexible payment plans for qualifying cases and work on contingency for personal injury and employment matters." },
    { id: uid("f"), question: "Will my case go to trial?", answer: "Most cases settle before trial. However, we prepare every case as if it will go to trial — this posture consistently produces better settlement outcomes." },
  ],

  team: [
    { id: uid("tm"), name: "Robert Hayes", role: "Founding Partner", bio: "Harvard Law, 25 years trial experience. Argued before the Supreme Court. Specialises in corporate litigation.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Sarah Chen", role: "Immigration Partner", bio: "10 years specialising in complex visa and citizenship cases. 98% approval rate. Fluent in Mandarin and Spanish.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Michael Torres", role: "Employment Law", bio: "Former NLRB attorney. Represents employees and employers. Recovered $180M+ in wrongful termination settlements.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 4: NexaAgency (Tech / Digital Agency) ──────────────────────────

const NEXA_AGENCY: TemplateIdentity = {
  slug: "nexa-agency",
  name: "NexaAgency",
  description: "Bold digital agency. Dark background, electric purple accents, fullscreen hero, grid services, animated stats.",
  category: "Tech & Agency",
  author: "Passive Coder",
  version: "2.0.0",
  previewImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=85&fit=crop",
  tags: ["agency", "tech", "digital", "startup", "web design"],

  palette: {
    primary: "#7c3aed",
    primaryFg: "#ffffff",
    secondary: "#4f46e5",
    accent: "#a78bfa",
    background: "#09090b",
    foreground: "#fafafa",
    muted: "#18181b",
    mutedFg: "#a1a1aa",
    card: "#111113",
    border: "#27272a",
    ring: "#7c3aed",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.04em",
  },
  customCss: `
    .template-nexa-agency h1,.template-nexa-agency h2 { font-weight: 900; letter-spacing: -0.04em; }
    .template-nexa-agency .service-card { background: linear-gradient(135deg, #18181b, #111113); border: 1px solid #27272a; transition: border-color 0.2s, transform 0.2s; }
    .template-nexa-agency .service-card:hover { border-color: #7c3aed; transform: translateY(-2px); }
    .template-nexa-agency .stat-value { background: linear-gradient(to right, #7c3aed, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "gradient-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1600&q=90&fit=crop",
      alt: "Agency team working",
    },
    about: {
      url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80&fit=crop",
      alt: "Agency office",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&q=80&fit=crop", alt: "Web design" },
      { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&fit=crop", alt: "Digital marketing" },
      { url: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=600&q=80&fit=crop", alt: "App development" },
      { url: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&q=80&fit=crop", alt: "SEO" },
      { url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=80&fit=crop", alt: "Analytics" },
      { url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80&fit=crop", alt: "Brand identity" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=800&q=80&fit=crop", alt: "Portfolio 1" },
      { url: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&q=80&fit=crop", alt: "Portfolio 2" },
      { url: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=800&q=80&fit=crop", alt: "Portfolio 3" },
      { url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80&fit=crop", alt: "Portfolio 4" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Alex Kim" },
      { url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&fit=crop&face", alt: "Jordan Lee" },
      { url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&fit=crop&face", alt: "Marcus Chen" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80&fit=crop",
      alt: "Work with us",
    },
  },

  heroHeadline: "We Build Digital Experiences That Scale",
  heroSubline: "Strategy, design and engineering for ambitious brands.",
  heroBadge: "🚀 Trusted by 200+ Startups",
  heroCTA: "Start a Project",
  heroSecondaryCTA: "See Our Work",
  siteName: "Nexa Agency",
  tagline: "We Build Digital Experiences That Scale",
  phone: "+1 (415) 555-0182",
  email: "hello@nexaagency.com",
  address: "101 Innovation Drive, San Francisco, CA 94102",
  aboutHeading: "A Studio Obsessed with Outcomes",
  aboutBody: "Nexa was founded by a team of ex-FAANG engineers and award-winning designers. We don't just build websites — we build growth systems. Every pixel, every line of code and every campaign is engineered for one outcome: measurable results for your business.",
  aboutHighlights: ["Ex-Google, Meta & Apple engineers", "Average 3.4× ROI within 6 months", "Agile, transparent process", "Full IP ownership transferred to you"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Work", url: "#gallery" },
    { id: "n3", label: "Pricing", url: "#pricing" },
    { id: "n4", label: "Team", url: "#team" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Web Design & Development", description: "Pixel-perfect, performance-first websites built with Next.js, React and Webflow. Lighthouse 95+ guaranteed.", icon: "Monitor", iconType: "lucide", imageUrl: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Growth Marketing", description: "Full-funnel strategy across paid, organic, email and social. Average 3.4× ROAS in 90 days.", icon: "TrendingUp", iconType: "lucide", imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Mobile App Development", description: "React Native and Flutter apps built for iOS and Android. From MVP to App Store in 8 weeks.", icon: "Smartphone", iconType: "lucide", imageUrl: "https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "SEO & Content", description: "Technical SEO, content strategy and link building. We've driven 400%+ organic growth for clients.", icon: "Search", iconType: "lucide", imageUrl: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Data & Analytics", description: "Custom dashboards, attribution modelling and data pipelines. Turn your data into competitive advantage.", icon: "BarChart3", iconType: "lucide", imageUrl: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Brand Identity", description: "Logo, design system, brand voice and guidelines. We build brands that are impossible to ignore.", icon: "Palette", iconType: "lucide", imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "200+", label: "Brands Built" },
    { id: uid("st"), value: "3.4×", label: "Average ROI" },
    { id: uid("st"), value: "$180M", label: "Revenue Generated" },
    { id: uid("st"), value: "98%", label: "Client Retention" },
  ],

  testimonials: [
    { id: uid("t"), name: "Tyler Kim", role: "CEO", company: "Launchpad SaaS", content: "Nexa rebuilt our product site in 3 weeks and conversions jumped 180%. That's real money. Worth every dollar.", rating: 5, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Priya Nair", role: "CMO", company: "FinFlow", content: "Their growth team took us from 2k to 50k monthly users in 5 months. Organic traffic up 400%. These people are exceptional.", rating: 5 },
    { id: uid("t"), name: "David Wu", role: "Founder", company: "ShopGrid", content: "The mobile app they built for us has 4.8 stars in the App Store and zero launch bugs. Extraordinary engineering quality.", rating: 5, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Sarah M.", role: "VP Marketing", company: "CloudBase", content: "Best agency we've ever worked with. Transparent, fast and genuinely invested in our outcomes. Long-term partner for us.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Starter", price: "$4,900", period: "/project", description: "Landing page or small site", features: ["Up to 5 pages", "Mobile responsive", "CMS integration", "Basic SEO", "30-day support"], ctaLabel: "Start Starter", ctaUrl: "#contact" },
    { id: uid("p"), name: "Growth", price: "$12,500", period: "/project", description: "Full website + marketing setup", features: ["Up to 20 pages", "Custom design system", "CRM integration", "Analytics dashboard", "3-month growth sprint", "Priority support"], highlighted: true, badge: "Best Value", ctaLabel: "Start Growth", ctaUrl: "#contact" },
    { id: uid("p"), name: "Enterprise", price: "Custom", description: "End-to-end digital transformation", features: ["Unlimited scope", "Dedicated team", "App development", "Full SEO + paid", "Monthly reporting", "SLA guarantee"], ctaLabel: "Talk to Us", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How long does a website project take?", answer: "Landing pages: 2–3 weeks. Full sites: 6–10 weeks. We use a sprint-based process with weekly deliverables and client reviews built in." },
    { id: uid("f"), question: "Do you work with startups or only enterprises?", answer: "Both. We've launched MVP sites for pre-seed startups and rebuilt enterprise platforms for Fortune 500 companies. We tailor our approach to your stage." },
    { id: uid("f"), question: "Who owns the code after the project?", answer: "You do — 100%. We transfer all IP, source code and assets at project completion. No lock-in, no licensing fees." },
    { id: uid("f"), question: "How do you measure success?", answer: "We define success metrics before we start — conversion rate, traffic, leads, ROAS — and report against them monthly. No vanity metrics." },
  ],

  team: [
    { id: uid("tm"), name: "Alex Kim", role: "CEO & Strategy", bio: "Ex-Google PM. Founded Nexa in 2016. Obsessed with outcome-driven digital strategy.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Jordan Lee", role: "Head of Design", bio: "Former Apple UX designer. 10 years building products that millions use daily.", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Marcus Chen", role: "Lead Engineer", bio: "Ex-Meta infrastructure engineer. Builds systems that scale from 0 to 10M users.", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 5: AromaTable (Restaurant) ─────────────────────────────────────

const AROMA_TABLE: TemplateIdentity = {
  slug: "aroma-table",
  name: "AromaTable",
  description: "Warm, upscale restaurant template. Amber & cream palette, fullscreen food hero, menu-style services, warm testimonials.",
  category: "Restaurant & Cafe",
  author: "Passive Coder",
  version: "2.0.0",
  previewImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85&fit=crop",
  tags: ["restaurant", "cafe", "food", "dining", "menu"],

  palette: {
    primary: "#b45309",
    primaryFg: "#ffffff",
    secondary: "#92400e",
    accent: "#fbbf24",
    background: "#fefce8",
    foreground: "#1c1917",
    muted: "#fef3c7",
    mutedFg: "#78350f",
    card: "#fffbeb",
    border: "#fde68a",
    ring: "#b45309",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    headingWeight: "600",
    letterSpacing: "0.01em",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
    .template-aroma-table h1,.template-aroma-table h2,.template-aroma-table h3 { font-family: 'Playfair Display', serif; }
    .template-aroma-table .service-card { border: 1px solid #fde68a; background: #fffbeb; }
    .template-aroma-table .stat-value { color: #b45309; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "menu-cards",
    testimonials: "warm-cards",
    features: "alternating-images",
    stats: "warm-row",
    cta: "warm-banner",
    pricing: "menu-pricing",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "chef-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=90&fit=crop",
      alt: "Fine dining restaurant interior",
    },
    about: {
      url: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80&fit=crop",
      alt: "Chef preparing food",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=85&fit=crop", alt: "Fresh salad" },
      { url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=85&fit=crop", alt: "Grilled salmon" },
      { url: "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=85&fit=crop", alt: "Steak" },
      { url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=85&fit=crop", alt: "Dessert" },
      { url: "https://images.unsplash.com/photo-1474502561271-d09bd8716b4c?w=600&q=85&fit=crop", alt: "Cocktails" },
      { url: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=85&fit=crop", alt: "Pizza" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80&fit=crop", alt: "Restaurant interior" },
      { url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80&fit=crop", alt: "Dining table setup" },
      { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&fit=crop", alt: "Bar area" },
      { url: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80&fit=crop", alt: "Kitchen" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1607631568010-a87245c0daf7?w=400&q=80&fit=crop&face", alt: "Chef Marco" },
      { url: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80&fit=crop&face", alt: "Chef Sofia" },
      { url: "https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=400&q=80&fit=crop&face", alt: "Sommelier" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1200&q=80&fit=crop",
      alt: "Reserve a table",
    },
  },

  heroHeadline: "Where Every Meal Tells a Story",
  heroSubline: "Farm-to-table Mediterranean cuisine in the heart of the city.",
  heroBadge: "🍽️ Michelin Recommended",
  heroCTA: "Reserve a Table",
  heroSecondaryCTA: "View Menu",
  siteName: "Aroma Table",
  tagline: "Farm-to-table Mediterranean cuisine",
  phone: "+1 (718) 555-0214",
  email: "reservations@aromatable.com",
  address: "12 Harvest Lane, Brooklyn, NY 11201",
  aboutHeading: "Cuisine Rooted in Tradition, Elevated by Passion",
  aboutBody: "Aroma Table was born from Chef Marco's childhood memories of his grandmother's kitchen in Palermo. Every dish honours those traditions while embracing the finest seasonal ingredients from local farms within 50 miles. We believe great food is an act of love.",
  aboutHighlights: ["100% locally sourced ingredients", "Seasonal menu updated weekly", "Private dining for up to 40 guests", "Award-winning wine programme"],

  navItems: [
    { id: "n1", label: "Menu", url: "#services" },
    { id: "n2", label: "Reservations", url: "#contact" },
    { id: "n3", label: "Gallery", url: "#gallery" },
    { id: "n4", label: "Our Story", url: "#about" },
    { id: "n5", label: "Events", url: "#pricing" },
  ],

  services: [
    { id: uid("svc"), title: "Garden Starters", description: "Heirloom tomato bruschetta, burrata with truffle honey, charcuterie board with house-made preserves.", icon: "🥗", iconType: "emoji", price: "$12 – $28", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Seafood Mains", description: "Pan-seared halibut, chargrilled octopus, citrus-cured salmon with fennel and capers.", icon: "🐟", iconType: "emoji", price: "$34 – $56", imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Grilled & Roasted", description: "28-day dry-aged ribeye, lamb rack with rosemary jus, free-range chicken with preserved lemon.", icon: "🥩", iconType: "emoji", price: "$38 – $68", imageUrl: "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Artisan Desserts", description: "Sicilian cannoli, burnt basque cheesecake, seasonal sorbets and our signature tiramisu.", icon: "🍮", iconType: "emoji", price: "$14 – $18", imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Signature Cocktails", description: "House-crafted cocktails using fresh herbs, house-made syrups and premium spirits. Zero-proof options available.", icon: "🍹", iconType: "emoji", price: "$14 – $22", imageUrl: "https://images.unsplash.com/photo-1474502561271-d09bd8716b4c?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Wood-Fired Pizzas", description: "Traditional Neapolitan-style pizzas fired at 900°F. 72-hour fermented dough with DOP-certified toppings.", icon: "🍕", iconType: "emoji", price: "$22 – $34", imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&q=85&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "8 yr", label: "Open Since 2017" },
    { id: uid("st"), value: "4.9★", label: "Rating on Yelp" },
    { id: uid("st"), value: "50mi", label: "Max Farm Distance" },
    { id: uid("st"), value: "2×", label: "Michelin Recognised" },
  ],

  testimonials: [
    { id: uid("t"), name: "Claire D.", role: "Food Critic", company: "NY Eats Magazine", content: "The lamb rack was perhaps the finest I've eaten in New York. Marco's restraint and precision elevate every component to something truly memorable.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "James & Laura", role: "Anniversary Dinner", content: "We celebrated our 10th anniversary here. The private dining room, the personalised menu, the sommelier's wine choices — everything was absolutely perfect.", rating: 5 },
    { id: uid("t"), name: "Roberto F.", role: "Regular Guest", content: "I've been coming here every Friday for three years. The seasonal menu keeps it exciting and the staff remember your preferences. It feels like family.", rating: 5 },
    { id: uid("t"), name: "Priya T.", role: "Event Host", content: "Organised a corporate dinner for 30 guests. Flawless execution, gorgeous food and the team made everyone feel incredibly welcome.", rating: 5, avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&q=80&fit=crop&face" },
  ],

  pricing: [
    { id: uid("p"), name: "Lunch", price: "$45", period: "/person", description: "Two-course lunch menu", features: ["Choice of starter", "Choice of main", "Coffee or tea", "Tue–Fri 12pm–3pm"], ctaLabel: "Reserve Lunch", ctaUrl: "#contact" },
    { id: uid("p"), name: "Dinner", price: "$85", period: "/person", description: "Three-course dinner experience", features: ["Amuse-bouche", "Choice of starter, main & dessert", "Bread & butter service", "Mon–Sun 6pm–10pm"], highlighted: true, badge: "Most Popular", ctaLabel: "Reserve Dinner", ctaUrl: "#contact" },
    { id: uid("p"), name: "Chef's Table", price: "$155", period: "/person", description: "Seven-course tasting menu", features: ["7 curated courses", "Wine pairing available", "Kitchen tour included", "Chef's personal introduction", "Fri & Sat only, advance booking"], ctaLabel: "Reserve Chef's Table", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you take walk-ins?", answer: "We keep a small number of walk-in tables available, but we strongly recommend reserving online to guarantee your preferred time and table." },
    { id: uid("f"), question: "Can you accommodate dietary requirements?", answer: "Absolutely. We accommodate vegetarian, vegan, gluten-free, dairy-free and all major allergies. Please note your requirements when booking." },
    { id: uid("f"), question: "Do you have private dining?", answer: "Yes — our private dining room seats up to 40 guests and can be booked for corporate events, celebrations and intimate dinners. Bespoke menus available." },
    { id: uid("f"), question: "What is your cancellation policy?", answer: "Please cancel at least 24 hours before your reservation. No-shows on parties of 6+ are charged a $25 per person deposit." },
  ],

  team: [
    { id: uid("tm"), name: "Chef Marco Ricci", role: "Executive Chef & Founder", bio: "Trained in Palermo and Paris. 20 years in fine dining. Michelin-recognised twice for his farm-to-table philosophy.", avatar: "https://images.unsplash.com/photo-1607631568010-a87245c0daf7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Sofia De Luca", role: "Pastry Chef", bio: "World-class pastry techniques meet Mediterranean soul. Sofia's desserts are the reason many return.", avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Antoine Beaumont", role: "Head Sommelier", bio: "WSET Level 4 certified. Curates our 400-bottle cellar with a passion for small-producer natural wines.", avatar: "https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 6: FitForge (Fitness / Gym) ────────────────────────────────────

const FIT_FORGE: TemplateIdentity = {
  slug: "fit-forge",
  name: "FitForge",
  description: "High-energy gym & personal training studio. Bold orange-black, fullscreen hero, program cards, transformation stats.",
  category: "Fitness & Sports",
  author: "Passive Coder",
  version: "2.0.0",
  previewImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=85&fit=crop",
  tags: ["gym", "fitness", "personal training", "sports", "health"],

  palette: {
    primary: "#ea580c",
    primaryFg: "#ffffff",
    secondary: "#dc2626",
    accent: "#fb923c",
    background: "#0a0a0a",
    foreground: "#f5f5f5",
    muted: "#171717",
    mutedFg: "#a3a3a3",
    card: "#111111",
    border: "#262626",
    ring: "#ea580c",
    borderRadius: "0",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.03em",
  },
  customCss: `
    .template-fit-forge h1,.template-fit-forge h2 { font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase; }
    .template-fit-forge .service-card { border-top: 3px solid #ea580c; background: #111; }
    .template-fit-forge .stat-value { color: #ea580c; font-weight: 900; }
    .template-fit-forge .cta-section { background: linear-gradient(135deg, #ea580c, #dc2626); }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "program-cards-dark",
    testimonials: "transformation-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "membership-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "trainer-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=90&fit=crop",
      alt: "Gym floor and equipment",
    },
    about: {
      url: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80&fit=crop",
      alt: "Training session",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80&fit=crop", alt: "Personal training" },
      { url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80&fit=crop", alt: "Group classes" },
      { url: "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=600&q=80&fit=crop", alt: "Strength training" },
      { url: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80&fit=crop", alt: "Cardio" },
      { url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop", alt: "Yoga" },
      { url: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80&fit=crop", alt: "Nutrition coaching" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?w=800&q=80&fit=crop", alt: "Weights area" },
      { url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80&fit=crop", alt: "Cardio floor" },
      { url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80&fit=crop", alt: "Training session" },
      { url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80&fit=crop", alt: "Boxing area" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80&fit=crop&face", alt: "Coach Jake" },
      { url: "https://images.unsplash.com/photo-1571732154690-f6d1c3e5178a?w=400&q=80&fit=crop&face", alt: "Coach Mia" },
      { url: "https://images.unsplash.com/photo-1567013127542-490d757e6349?w=400&q=80&fit=crop&face", alt: "Coach Chris" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1517963879433-6ad2171073fb?w=1200&q=80&fit=crop",
      alt: "Join the gym",
    },
  },

  heroHeadline: "Forge Your Best Body",
  heroSubline: "Elite coaching. No excuses. Real results.",
  heroBadge: "💪 500+ Transformations",
  heroCTA: "Start Free Trial",
  heroSecondaryCTA: "View Programs",
  siteName: "FitForge Gym",
  tagline: "Elite coaching. No excuses. Real results.",
  phone: "+1 (310) 555-0199",
  email: "join@fitforge.com",
  address: "88 Iron Street, West Hollywood, CA 90046",
  aboutHeading: "Built for Those Who Refuse to Settle",
  aboutBody: "FitForge was founded by strength coach Jake Carter after years of watching people fail with generic workout plans. Every programme at FitForge is personalised, progressive and relentlessly focused on real, measurable transformation. No gimmicks, no fads — just results.",
  aboutHighlights: ["12-week transformation guarantee", "Certified S&C coaches", "Open 24/7, 365 days", "Nutrition coaching included in all plans"],

  navItems: [
    { id: "n1", label: "Programs", url: "#services" },
    { id: "n2", label: "Memberships", url: "#pricing" },
    { id: "n3", label: "Trainers", url: "#team" },
    { id: "n4", label: "Transformations", url: "#gallery" },
    { id: "n5", label: "Join Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "1-on-1 Personal Training", description: "Custom programming, real-time coaching and weekly check-ins. The fastest path to your goals.", icon: "🏋️", iconType: "emoji", price: "From $80/session", imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Group Power Classes", description: "High-intensity small-group training capped at 8 people. The energy of group fitness with PT-level attention.", icon: "🔥", iconType: "emoji", price: "From $25/class", imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Strength & Conditioning", description: "12-week progressive strength programme. Built around compound lifts, accessory work and recovery.", icon: "💪", iconType: "emoji", price: "From $249/month", imageUrl: "https://images.unsplash.com/photo-1600881333168-2ef49b341f30?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Cardio & Fat Loss", description: "HIIT, metabolic conditioning and cardiovascular programming designed to maximise fat burning.", icon: "⚡", iconType: "emoji", price: "Included in membership", imageUrl: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Yoga & Mobility", description: "Recovery yoga and flexibility training. Prevent injury, move better and feel incredible.", icon: "🧘", iconType: "emoji", price: "From $20/class", imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Nutrition Coaching", description: "Macro tracking, meal planning and habit coaching. Because abs are made in the kitchen.", icon: "🥗", iconType: "emoji", price: "From $99/month", imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "500+", label: "Transformations" },
    { id: uid("st"), value: "12 wk", label: "Avg Results Timeline" },
    { id: uid("st"), value: "98%", label: "Member Retention" },
    { id: uid("st"), value: "24/7", label: "Always Open" },
  ],

  testimonials: [
    { id: uid("t"), name: "Mike D.", role: "Member since 2021", content: "Lost 42 lbs in 14 weeks. Jake's 1-on-1 programme is unlike anything I've tried before. Completely changed my life.", rating: 5, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Tanya R.", role: "Group Class Member", content: "The Power Classes are addictive. I dread and crave them simultaneously. Best shape of my adult life at 38.", rating: 5 },
    { id: uid("t"), name: "Chris H.", role: "Personal Training Client", content: "Finally trained for and completed a marathon at 45. Couldn't have done it without Mia's coaching. Extraordinary programme.", rating: 5 },
    { id: uid("t"), name: "Sofia V.", role: "Nutrition Client", content: "The nutrition coaching completely transformed my relationship with food. Down 25 lbs and I don't feel deprived at all.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
  ],

  pricing: [
    { id: uid("p"), name: "Basic", price: "$49", period: "/month", description: "Gym access only", features: ["24/7 gym access", "Cardio & weights floor", "Locker room access", "App & workout tracking"], ctaLabel: "Join Basic", ctaUrl: "#contact" },
    { id: uid("p"), name: "Elite", price: "$89", period: "/month", description: "Training included", features: ["Everything in Basic", "4 group classes/week", "Monthly PT session", "Nutrition guide", "Priority booking"], highlighted: true, badge: "Best Value", ctaLabel: "Join Elite", ctaUrl: "#contact" },
    { id: uid("p"), name: "Pro", price: "$189", period: "/month", description: "Full transformation programme", features: ["Everything in Elite", "Weekly 1-on-1 PT", "Custom meal plan", "Weekly check-ins", "WhatsApp coach access", "Transformation guarantee"], ctaLabel: "Join Pro", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Is there a joining fee?", answer: "No joining fee ever. We believe the barrier to starting your fitness journey should be as low as possible. Cancel anytime, no lock-in." },
    { id: uid("f"), question: "I'm a complete beginner — is FitForge right for me?", answer: "Absolutely. All our programmes start with a full assessment and are designed from your current fitness level. We've transformed complete beginners into athletes." },
    { id: uid("f"), question: "What is the transformation guarantee?", answer: "On our Pro plan, if you don't achieve measurable results in 12 weeks (following the programme), we give you the next 4 weeks free. We're that confident." },
    { id: uid("f"), question: "Can I freeze my membership?", answer: "Yes — you can freeze for up to 3 months per year on all membership tiers. Just give us 7 days notice." },
  ],

  team: [
    { id: uid("tm"), name: "Jake Carter", role: "Head Coach & Founder", bio: "NSCA-certified S&C coach. Former semi-pro athlete. 500+ client transformations in 10 years.", avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Mia Santos", role: "Endurance Coach", bio: "3× marathon finisher. Specialises in running, triathlon and cardio programming for all levels.", avatar: "https://images.unsplash.com/photo-1571732154690-f6d1c3e5178a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Chris Blake", role: "Strength Coach", bio: "Powerlifting champion. Specialises in progressive overload, form correction and injury prevention.", avatar: "https://images.unsplash.com/photo-1567013127542-490d757e6349?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 7: EstateEdge (Real Estate) ────────────────────────────────────

const ESTATE_EDGE: TemplateIdentity = {
  slug: "estate-edge",
  name: "EstateEdge",
  description: "Premium real estate agency. Slate & champagne palette, luxury property listings, agent profiles, neighbourhood stats.",
  category: "Real Estate",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=85&fit=crop",
  tags: ["real estate", "property", "agency", "luxury", "homes"],

  palette: {
    primary: "#1e293b",
    primaryFg: "#ffffff",
    secondary: "#c9a84c",
    accent: "#f1e4c3",
    background: "#f8f6f2",
    foreground: "#0f172a",
    muted: "#ede8df",
    mutedFg: "#64748b",
    card: "#ffffff",
    border: "#e2d9cc",
    ring: "#1e293b",
    borderRadius: "0.125rem",
  },
  typography: {
    headingFont: "Cormorant Garamond",
    bodyFont: "Inter",
    headingWeight: "600",
    letterSpacing: "0.02em",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
    .template-estate-edge h1,.template-estate-edge h2,.template-estate-edge h3 { font-family: 'Cormorant Garamond', serif; letter-spacing: 0.02em; }
    .template-estate-edge .service-card { border: none; border-bottom: 2px solid #c9a84c; border-radius: 0; }
    .template-estate-edge .stat-value { color: #1e293b; font-family: 'Cormorant Garamond', serif; font-size: 3rem; }
    .template-estate-edge .nav-bar { background: #1e293b; }
  `,

  variants: {
    hero: "split-image-right",
    services: "property-cards",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "navy-row",
    cta: "navy-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "formal-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=90&fit=crop",
      alt: "Luxury home exterior",
    },
    heroSecondary: {
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop",
      alt: "Modern interior living room",
    },
    about: {
      url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&fit=crop",
      alt: "Real estate office",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=85&fit=crop", alt: "Luxury villa" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85&fit=crop", alt: "Modern apartment" },
      { url: "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=600&q=85&fit=crop", alt: "Commercial property" },
      { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=85&fit=crop", alt: "Waterfront home" },
      { url: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=85&fit=crop", alt: "Penthouse" },
      { url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=85&fit=crop", alt: "Suburban home" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80&fit=crop", alt: "Kitchen interior" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80&fit=crop", alt: "Living room" },
      { url: "https://images.unsplash.com/photo-1560440021-33f9b867899d?w=800&q=80&fit=crop", alt: "Master bedroom" },
      { url: "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80&fit=crop", alt: "Pool area" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "James Whitfield" },
      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face", alt: "Amanda Pierce" },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face", alt: "David Harrington" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1582407947304-fd86f28f3f87?w=1200&q=80&fit=crop",
      alt: "Find your dream home",
    },
  },

  heroHeadline: "Find Your Perfect Home",
  heroSubline: "Luxury residential & commercial properties in the most sought-after locations.",
  heroBadge: "🏆 #1 Agency in the Region",
  heroCTA: "Browse Properties",
  heroSecondaryCTA: "Free Valuation",
  siteName: "EstateEdge Realty",
  tagline: "Where Luxury Meets Home",
  phone: "+1 (646) 555-0321",
  email: "listings@estateedge.com",
  address: "One Rockefeller Plaza, Suite 1400, New York, NY 10020",
  aboutHeading: "20 Years Matching Families with Exceptional Homes",
  aboutBody: "EstateEdge Realty was founded on a simple belief: every client deserves the finest attention whether they're buying a first apartment or a $50M estate. Our team of 30 licensed agents has closed over 4,200 transactions and maintains a client retention rate no other firm can match.",
  aboutHighlights: ["4,200+ successful transactions", "Average 14 days to offer", "$3.2B in property sold", "Concierge relocation service"],

  navItems: [
    { id: "n1", label: "Properties", url: "#services" },
    { id: "n2", label: "Our Team", url: "#team" },
    { id: "n3", label: "Gallery", url: "#gallery" },
    { id: "n4", label: "About", url: "#about" },
    { id: "n5", label: "Valuation", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Luxury Villas", description: "Gated estates, pool homes and architectural masterpieces from $2M. Private viewings available.", icon: "🏡", iconType: "emoji", price: "From $2,000,000", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "City Apartments", description: "High-floor condominiums with skyline views. Studio to penthouse. Full building amenities.", icon: "🏙️", iconType: "emoji", price: "From $450,000", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial Properties", description: "Prime retail, office and mixed-use investment properties across the metropolitan area.", icon: "🏢", iconType: "emoji", price: "From $1,200,000", imageUrl: "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Waterfront Homes", description: "Ocean-front, lake-side and river-view residences. The premium lifestyle you deserve.", icon: "🌊", iconType: "emoji", price: "From $3,500,000", imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Penthouse Suites", description: "Rooftop living with private terraces, butler service and 360° views of the city.", icon: "✨", iconType: "emoji", price: "From $5,000,000", imageUrl: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Suburban Family Homes", description: "Top school districts, quiet neighbourhoods and generous lots. Perfect for growing families.", icon: "🌳", iconType: "emoji", price: "From $680,000", imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=85&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "4,200+", label: "Homes Sold" },
    { id: uid("st"), value: "$3.2B", label: "Total Sales Volume" },
    { id: uid("st"), value: "14 days", label: "Avg Days to Offer" },
    { id: uid("st"), value: "20 yr", label: "Market Experience" },
  ],

  testimonials: [
    { id: uid("t"), name: "Katherine B.", role: "Buyer", content: "We'd searched for 18 months with other agencies. EstateEdge found our dream home in three weeks. James is extraordinary.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Robert & Claire", role: "Sellers", content: "Listed on Monday. Four offers by Friday. Accepted $180k over asking. The marketing they did for our home was exceptional.", rating: 5 },
    { id: uid("t"), name: "Michael T.", role: "Investor", content: "I've bought six properties through EstateEdge. Their market intelligence and off-market access is simply unmatched.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Sophia L.", role: "First-time Buyer", content: "Amanda held my hand through every step. As a first-time buyer I was terrified. She made it seamless. Couldn't be happier.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Buyer", price: "Free", description: "We represent buyers at no cost", features: ["Dedicated buyer's agent", "Off-market access", "Mortgage broker referral", "Legal & inspection coordination", "Post-sale support"], ctaLabel: "Start Your Search", ctaUrl: "#contact" },
    { id: uid("p"), name: "Seller", price: "2.5%", period: "commission", description: "Full-service listing & sale", features: ["Professional photography & video", "3D virtual tour", "Multi-platform marketing", "Open house management", "Negotiation & closing support"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Free Valuation", ctaUrl: "#contact" },
    { id: uid("p"), name: "Investor", price: "Custom", description: "Portfolio & commercial deals", features: ["Off-market deal sourcing", "Cap rate & ROI analysis", "1031 exchange guidance", "Property management referral", "Portfolio reporting"], ctaLabel: "Talk to an Expert", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How do I get a property valuation?", answer: "Book a free valuation through our contact form or call us. An agent will visit within 48 hours and provide a comprehensive market appraisal." },
    { id: uid("f"), question: "Do you have off-market listings?", answer: "Yes. We maintain a private portfolio of off-market properties exclusively for qualified buyers. Register with us and we'll match you to opportunities before they're listed publicly." },
    { id: uid("f"), question: "What areas do you cover?", answer: "We operate across the full metropolitan area including Manhattan, Brooklyn, The Hamptons, Connecticut and New Jersey. We also have partner agencies in Miami, LA and London." },
    { id: uid("f"), question: "How long does buying take from offer to close?", answer: "Typically 45–60 days from accepted offer to closing in New York. Cash purchases can close in as little as 2 weeks. We coordinate every step including attorneys, inspectors and lenders." },
  ],

  team: [
    { id: uid("tm"), name: "James Whitfield", role: "Managing Director", bio: "20 years in luxury residential sales. $1.2B+ in personal transactions. Known for his discreet, white-glove approach.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Amanda Pierce", role: "Senior Buyer's Agent", bio: "Specialist in first-time buyers and family homes. 98% client satisfaction. Relentlessly patient and thorough.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "David Harrington", role: "Commercial & Investment", bio: "Former investment banker. Structures complex commercial deals and portfolio acquisitions for high-net-worth investors.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 8: LensStudio (Photography) ────────────────────────────────────

const LENS_STUDIO: TemplateIdentity = {
  slug: "lens-studio",
  name: "LensStudio",
  description: "Bold photography portfolio studio. Full-bleed image hero, masonry gallery, minimal dark aesthetic, package pricing.",
  category: "Photography & Creative",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=85&fit=crop",
  tags: ["photography", "portfolio", "creative", "weddings", "commercial"],

  palette: {
    primary: "#18181b",
    primaryFg: "#ffffff",
    secondary: "#3f3f46",
    accent: "#e4e4e7",
    background: "#fafafa",
    foreground: "#09090b",
    muted: "#f4f4f5",
    mutedFg: "#71717a",
    card: "#ffffff",
    border: "#e4e4e7",
    ring: "#18181b",
    borderRadius: "0",
  },
  typography: {
    headingFont: "DM Sans",
    bodyFont: "DM Sans",
    headingWeight: "300",
    letterSpacing: "0.08em",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
    .template-lens-studio { font-family: 'DM Sans', sans-serif; }
    .template-lens-studio h1,.template-lens-studio h2 { font-weight: 300; letter-spacing: 0.08em; text-transform: uppercase; }
    .template-lens-studio .service-card { border: none; border-bottom: 1px solid #e4e4e7; border-radius: 0; padding: 2rem 0; }
    .template-lens-studio .gallery-item { filter: grayscale(20%); transition: filter 0.4s; }
    .template-lens-studio .gallery-item:hover { filter: grayscale(0); }
    .template-lens-studio .nav-bar { background: transparent; border-bottom: 1px solid #e4e4e7; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "minimal-list",
    testimonials: "minimal-quote",
    features: "alternating-images",
    stats: "plain-light",
    cta: "dark-split",
    pricing: "clean-cards",
    faq: "accordion-minimal",
    navigation: "transparent-light",
    team: "portrait-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=90&fit=crop",
      alt: "Wedding photography",
    },
    heroSecondary: {
      url: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=85&fit=crop",
      alt: "Portrait session",
    },
    about: {
      url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80&fit=crop",
      alt: "Photographer at work",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=85&fit=crop", alt: "Wedding day" },
      { url: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&q=85&fit=crop", alt: "Portrait photography" },
      { url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=85&fit=crop", alt: "Commercial shoot" },
      { url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=85&fit=crop", alt: "Event photography" },
      { url: "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=600&q=85&fit=crop", alt: "Real estate photography" },
      { url: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=600&q=85&fit=crop", alt: "Product photography" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=85&fit=crop", alt: "Wedding kiss" },
      { url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=85&fit=crop", alt: "Mountain landscape" },
      { url: "https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?w=800&q=85&fit=crop", alt: "Fashion portrait" },
      { url: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=85&fit=crop", alt: "Event crowd" },
      { url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=85&fit=crop", alt: "Bridal detail" },
      { url: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=85&fit=crop", alt: "Product flatlay" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&fit=crop&face", alt: "Maya Chen" },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face", alt: "Oliver Hayes" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80&fit=crop",
      alt: "Book a session",
    },
  },

  heroHeadline: "Moments That Last Forever",
  heroSubline: "Award-winning photography for weddings, portraits & brands.",
  heroBadge: "📷 Booked 12 months ahead",
  heroCTA: "Book a Session",
  heroSecondaryCTA: "View Portfolio",
  siteName: "Lens Studio",
  tagline: "Light. Story. Emotion.",
  phone: "+1 (323) 555-0287",
  email: "hello@lensstudio.com",
  address: "Studio 4B, Arts District, Los Angeles, CA 90021",
  aboutHeading: "We Don't Just Take Photos — We Tell Your Story",
  aboutBody: "Lens Studio was founded by Maya Chen, a documentary photographer turned commercial artist with 12 years behind the lens. Our philosophy is simple: a photograph should make you feel something. We work with natural light, genuine emotion and obsessive attention to composition to create images that endure.",
  aboutHighlights: ["12 years of storytelling", "Featured in Vogue, Harper's Bazaar", "300+ weddings captured", "2-week turnaround guaranteed"],

  navItems: [
    { id: "n1", label: "Work", url: "#gallery" },
    { id: "n2", label: "Services", url: "#services" },
    { id: "n3", label: "Pricing", url: "#pricing" },
    { id: "n4", label: "About", url: "#about" },
    { id: "n5", label: "Book", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Wedding Photography", description: "Full-day coverage from getting ready to first dance. Two photographers, 600+ edited images, private online gallery.", icon: "💍", iconType: "emoji", price: "From $3,200", imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Portrait Sessions", description: "Personal branding, family portraits and headshots. Natural-light studio or on-location. 2-hour session, 40 retouched images.", icon: "🎭", iconType: "emoji", price: "From $450", imageUrl: "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial & Brand", description: "Product photography, brand campaigns and editorial shoots for agencies and direct brands. Full styling and art direction.", icon: "📸", iconType: "emoji", price: "From $1,800/day", imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Events & Conferences", description: "Corporate events, galas, product launches and conferences. Discreet, professional, quick turnaround for press use.", icon: "🎤", iconType: "emoji", price: "From $800/day", imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Real Estate & Architecture", description: "Interiors, exteriors and aerial drone photography for residential and commercial listings.", icon: "🏛️", iconType: "emoji", price: "From $350/property", imageUrl: "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Product Photography", description: "Clean white-background and lifestyle product images optimised for e-commerce and social media.", icon: "🛍️", iconType: "emoji", price: "From $60/image", imageUrl: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=600&q=85&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "300+", label: "Weddings Captured" },
    { id: uid("st"), value: "4.9★", label: "Client Rating" },
    { id: uid("st"), value: "12 yr", label: "In the Industry" },
    { id: uid("st"), value: "2 wk", label: "Gallery Delivery" },
  ],

  testimonials: [
    { id: uid("t"), name: "Emma & Jake", role: "Wedding Clients", content: "We've never seen our wedding day through someone else's eyes so perfectly. Every single photo made us cry. Maya is a genuine artist.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Stella Brand Co.", role: "Commercial Client", content: "The campaign shoot exceeded every brief we gave. The images were so strong they went viral on Instagram. Booked immediately for next season.", rating: 5 },
    { id: uid("t"), name: "Ravi P.", role: "Portrait Client", content: "I'm not photogenic — or so I thought. Maya made me completely comfortable and the headshots transformed my LinkedIn. Within a week I had three recruiter calls.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Session", price: "$450", description: "Portrait or headshot", features: ["2-hour session", "2 locations", "40 retouched images", "Private online gallery", "Print-ready files"], ctaLabel: "Book Session", ctaUrl: "#contact" },
    { id: uid("p"), name: "Wedding", price: "$3,200", description: "Full-day wedding coverage", features: ["8-hour coverage", "2 photographers", "600+ edited images", "Engagement session included", "Wedding album design", "USB delivered"], highlighted: true, badge: "Most Booked", ctaLabel: "Book Wedding", ctaUrl: "#contact" },
    { id: uid("p"), name: "Commercial", price: "Custom", description: "Brand & product campaigns", features: ["Full creative direction", "Styling & prop sourcing", "Unlimited usage license", "Raw + retouched files", "Priority 5-day delivery"], ctaLabel: "Get a Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How far in advance should I book?", answer: "For weddings, 10–14 months in advance is ideal. We're typically booked 12 months out for peak season (May–October). Portrait sessions can often be booked within 2–4 weeks." },
    { id: uid("f"), question: "How long until I receive my photos?", answer: "Portraits: within 2 weeks. Weddings: 4–6 weeks for the full gallery. Rush delivery (10 days) available for commercial clients at an additional fee." },
    { id: uid("f"), question: "What if the weather is bad?", answer: "We shoot in all conditions — rain and overcast light often creates the most dramatic portraits. For outdoor sessions, we offer one free reschedule for severe weather." },
    { id: uid("f"), question: "Do you travel for destination shoots?", answer: "Absolutely. We've shot weddings in Italy, Japan, Iceland and across the US. Travel packages are available — contact us for a custom quote." },
  ],

  team: [
    { id: uid("tm"), name: "Maya Chen", role: "Lead Photographer & Founder", bio: "Documentary photography background. 300+ weddings. Featured in Vogue Weddings and Harper's Bazaar Brides.", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Oliver Hayes", role: "Second Shooter & Commercial", bio: "Commercial and editorial specialist. 8 years working with fashion brands and creative agencies.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 9: DentalCare Pro (Medical / Dental) ───────────────────────────

const DENTAL_CARE_PRO: TemplateIdentity = {
  slug: "dental-care-pro",
  name: "DentalCare Pro",
  description: "Modern dental practice. Clean white & teal palette, patient-first messaging, treatment cards, appointment booking.",
  category: "Medical & Health",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=85&fit=crop",
  tags: ["dental", "medical", "health", "clinic", "dentist"],

  palette: {
    primary: "#0d9488",
    primaryFg: "#ffffff",
    secondary: "#0f766e",
    accent: "#99f6e4",
    background: "#f0fdfa",
    foreground: "#134e4a",
    muted: "#ccfbf1",
    mutedFg: "#0f766e",
    card: "#ffffff",
    border: "#99f6e4",
    ring: "#0d9488",
    borderRadius: "0.875rem",
  },
  typography: {
    headingFont: "Nunito",
    bodyFont: "Nunito",
    headingWeight: "800",
    letterSpacing: "-0.01em",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
    .template-dental-care-pro { font-family: 'Nunito', sans-serif; }
    .template-dental-care-pro h1,.template-dental-care-pro h2,.template-dental-care-pro h3 { font-family: 'Nunito', sans-serif; font-weight: 800; }
    .template-dental-care-pro .service-card { border: 2px solid #99f6e4; border-radius: 0.875rem; }
    .template-dental-care-pro .stat-value { color: #0d9488; }
    .template-dental-care-pro .hero-badge { background: #0d9488; color: white; border-radius: 9999px; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1600&q=90&fit=crop",
      alt: "Friendly dentist consultation",
    },
    heroSecondary: {
      url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80&fit=crop",
      alt: "Modern dental clinic",
    },
    about: {
      url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80&fit=crop",
      alt: "Dental team",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80&fit=crop", alt: "General dentistry" },
      { url: "https://images.unsplash.com/photo-1629909615957-be38d48fbbe4?w=600&q=80&fit=crop", alt: "Teeth whitening" },
      { url: "https://images.unsplash.com/photo-1588776813677-77adc5070099?w=600&q=80&fit=crop", alt: "Orthodontics" },
      { url: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=600&q=80&fit=crop", alt: "Dental implants" },
      { url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80&fit=crop", alt: "Veneers" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80&fit=crop", alt: "Pediatric dentistry" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=800&q=80&fit=crop", alt: "Dental clinic reception" },
      { url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80&fit=crop", alt: "Treatment room" },
      { url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80&fit=crop", alt: "Modern equipment" },
      { url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80&fit=crop", alt: "Patient smiling" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&fit=crop&face", alt: "Dr. Priya Patel" },
      { url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&fit=crop&face", alt: "Dr. Marcus Webb" },
      { url: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80&fit=crop&face", alt: "Dr. Aisha Nkosi" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80&fit=crop",
      alt: "Book dental appointment",
    },
  },

  heroHeadline: "Your Smile Deserves the Best Care",
  heroSubline: "Gentle, modern dentistry for the whole family. NHS & private patients welcome.",
  heroBadge: "😁 New Patients Always Welcome",
  heroCTA: "Book Appointment",
  heroSecondaryCTA: "Our Treatments",
  siteName: "DentalCare Pro",
  tagline: "Gentle dentistry. Brilliant smiles.",
  phone: "+1 (718) 555-0144",
  email: "appointments@dentalcarepro.com",
  address: "200 Park Avenue South, Suite 800, New York, NY 10003",
  aboutHeading: "15 Years Caring for Smiles Across the City",
  aboutBody: "DentalCare Pro was founded by Dr. Priya Patel with one goal: make every patient feel genuinely cared for, not just treated. Our clinic combines state-of-the-art technology with a genuinely warm approach. From nervous first-timers to full smile transformations, we tailor every visit to you.",
  aboutHighlights: ["Same-day emergency appointments", "Pain-free injections guaranteed", "Interest-free payment plans", "Sedation dentistry available"],

  navItems: [
    { id: "n1", label: "Treatments", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "Meet the Team", url: "#team" },
    { id: "n4", label: "About Us", url: "#about" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "General Check-up & Clean", description: "Comprehensive examination, X-rays and professional hygiene clean. The foundation of a healthy smile.", icon: "🦷", iconType: "emoji", price: "From $95", imageUrl: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Teeth Whitening", description: "Professional in-chair whitening in under 60 minutes. Up to 8 shades lighter — guaranteed.", icon: "✨", iconType: "emoji", price: "From $299", imageUrl: "https://images.unsplash.com/photo-1629909615957-be38d48fbbe4?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Orthodontics & Invisalign", description: "Straight teeth without metal braces. Custom clear aligners with 3D imaging. For teens and adults.", icon: "😁", iconType: "emoji", price: "From $2,800", imageUrl: "https://images.unsplash.com/photo-1588776813677-77adc5070099?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Dental Implants", description: "Permanent tooth replacement that looks, feels and functions like a natural tooth. Lifetime solution.", icon: "🔬", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Porcelain Veneers", description: "Ultra-thin, custom-made veneers for a perfect, natural-looking smile transformation. 2-visit process.", icon: "💎", iconType: "emoji", price: "From $850/tooth", imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Children's Dentistry", description: "Friendly, patient and fun. We build positive dental habits from the very first visit. Ages 2 and up.", icon: "🌈", iconType: "emoji", price: "From $75", imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "6,200+", label: "Happy Patients" },
    { id: uid("st"), value: "15 yr", label: "Serving the Community" },
    { id: uid("st"), value: "4.9★", label: "Average Rating" },
    { id: uid("st"), value: "98%", label: "Would Recommend Us" },
  ],

  testimonials: [
    { id: uid("t"), name: "Thomas R.", role: "Patient", content: "I hadn't been to a dentist in 10 years because of anxiety. Dr. Patel was so patient and kind. I actually look forward to coming now. Life-changing.", rating: 5, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Natalie K.", role: "Invisalign Patient", content: "My teeth were transformed in 8 months and I wore aligners nobody even noticed. The 3D planning before we started was incredible.", rating: 5 },
    { id: uid("t"), name: "Michael & Family", role: "Family Patients", content: "Three kids, all looked after brilliantly. The children actually ask to come to the dentist. That says everything.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
  ],

  pricing: [
    { id: uid("p"), name: "Membership", price: "$29", period: "/month", description: "Best value ongoing care", features: ["2 check-ups per year", "2 hygiene cleans", "X-rays included", "10% off all treatments", "Emergency priority access"], ctaLabel: "Join Membership", ctaUrl: "#contact" },
    { id: uid("p"), name: "Smile Package", price: "$599", description: "Complete cosmetic starter", features: ["Check-up & clean", "Professional whitening", "Smile analysis", "Veneer consultation", "Treatment plan included"], highlighted: true, badge: "Best Value", ctaLabel: "Book Smile Package", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Smile", price: "Custom", description: "Complete smile transformation", features: ["Full mouth assessment", "Custom treatment plan", "Veneers or Invisalign", "Interest-free payment plan", "Lifetime guarantee on work"], ctaLabel: "Book Consultation", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you treat nervous patients?", answer: "Absolutely. We specialise in anxious patients and offer sedation dentistry, pain-free injection techniques and as many breaks as you need. Tell us your concerns when booking — we'll tailor your entire visit." },
    { id: uid("f"), question: "How quickly can I get an emergency appointment?", answer: "Members get same-day emergency slots. Non-members: we keep several emergency slots available daily and will always see a patient in pain the same day where possible. Call us first thing." },
    { id: uid("f"), question: "Do you offer payment plans?", answer: "Yes — 0% interest payment plans are available for treatments over $500. We work with a trusted finance provider. Approval in minutes, no hidden fees." },
    { id: uid("f"), question: "How often should I visit the dentist?", answer: "Most adults benefit from a check-up and hygiene clean every 6 months. Some patients with higher risk factors may benefit from quarterly hygiene visits. We'll advise you based on your individual needs." },
  ],

  team: [
    { id: uid("tm"), name: "Dr. Priya Patel", role: "Principal Dentist & Founder", bio: "BDS King's College London. 15 years experience. Specialist in cosmetic dentistry and nervous patients. Invisalign Diamond Provider.", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Dr. Marcus Webb", role: "Implant & Oral Surgery", bio: "MFDS RCS. 12 years in implantology and complex oral surgery. Completed over 1,000 implant placements.", avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Dr. Aisha Nkosi", role: "Orthodontist", bio: "MSc Orthodontics. Invisalign Platinum provider. Specialises in adult and teen orthodontics.", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 10: BrewHaven (Coffee Shop) ────────────────────────────────────

const BREW_HAVEN: TemplateIdentity = {
  slug: "brew-haven",
  name: "BrewHaven",
  description: "Cosy independent coffee shop. Warm earthy tones, handcrafted aesthetic, menu showcasing, community feel.",
  category: "Food & Beverage",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=85&fit=crop",
  tags: ["coffee", "cafe", "bakery", "brunch", "independent"],

  palette: {
    primary: "#6f4e37",
    primaryFg: "#ffffff",
    secondary: "#a0785a",
    accent: "#d4a574",
    background: "#fdf8f3",
    foreground: "#2c1a0e",
    muted: "#f5ede3",
    mutedFg: "#7c5c3e",
    card: "#fffaf6",
    border: "#e8d5c0",
    ring: "#6f4e37",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Lora",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "0",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&display=swap');
    .template-brew-haven h1,.template-brew-haven h2,.template-brew-haven h3 { font-family: 'Lora', serif; }
    .template-brew-haven .service-card { border: 1px solid #e8d5c0; background: #fffaf6; }
    .template-brew-haven .stat-value { color: #6f4e37; font-family: 'Lora', serif; }
    .template-brew-haven .hero-overlay { background: linear-gradient(to right, rgba(44,26,14,0.85) 40%, rgba(44,26,14,0.1)); }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "menu-cards",
    testimonials: "warm-cards",
    features: "alternating-images",
    stats: "warm-row",
    cta: "warm-banner",
    pricing: "menu-pricing",
    faq: "accordion-bordered",
    navigation: "transparent-dark",
    team: "chef-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=90&fit=crop",
      alt: "Cosy coffee shop interior",
    },
    about: {
      url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80&fit=crop",
      alt: "Barista crafting coffee",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=85&fit=crop", alt: "Latte art" },
      { url: "https://images.unsplash.com/photo-1497636577773-f1231844b336?w=600&q=85&fit=crop", alt: "Cold brew" },
      { url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=85&fit=crop", alt: "Pastries" },
      { url: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=85&fit=crop", alt: "Avocado toast" },
      { url: "https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&q=85&fit=crop", alt: "Specialty tea" },
      { url: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85&fit=crop", alt: "Cake slice" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80&fit=crop", alt: "Coffee shop ambience" },
      { url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80&fit=crop", alt: "Barista at work" },
      { url: "https://images.unsplash.com/photo-1506807803488-8eafc15316c7?w=800&q=80&fit=crop", alt: "Beans and grinder" },
      { url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80&fit=crop", alt: "Reading nook" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1607631568010-a87245c0daf7?w=400&q=80&fit=crop&face", alt: "Leo Barros" },
      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face", alt: "Zara Kim" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&q=80&fit=crop",
      alt: "Visit our cafe",
    },
  },

  heroHeadline: "Coffee That Starts Your Day Right",
  heroSubline: "Specialty beans, slow brews and baked-fresh-daily pastries. Your neighbourhood escape.",
  heroBadge: "☕ Specialty Grade Coffee",
  heroCTA: "Find Us",
  heroSecondaryCTA: "View Menu",
  siteName: "BrewHaven Coffee",
  tagline: "Slow coffee. Good company.",
  phone: "+1 (503) 555-0167",
  email: "hello@brewhaven.com",
  address: "28 Maple Street, Pearl District, Portland, OR 97209",
  aboutHeading: "Built on a Love of Really Good Coffee",
  aboutBody: "BrewHaven started as a passion project — Leo quit his finance job in 2016, spent a year learning from roasters across Colombia, Ethiopia and Japan, and opened our first shop with 12 seats and a single La Marzocco. We now serve 400+ guests a day but the philosophy hasn't changed: slow down, brew it right, make a friend.",
  aboutHighlights: ["Direct-trade beans, single origin", "Roasted fresh weekly on-site", "100% compostable packaging", "Community events every weekend"],

  navItems: [
    { id: "n1", label: "Menu", url: "#services" },
    { id: "n2", label: "Our Story", url: "#about" },
    { id: "n3", label: "Gallery", url: "#gallery" },
    { id: "n4", label: "Events", url: "#pricing" },
    { id: "n5", label: "Find Us", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Espresso Bar", description: "Single origin espresso, flat whites, cortados and long blacks. Our house blend changes monthly.", icon: "☕", iconType: "emoji", price: "$3.50 – $5.50", imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Cold Brew & Iced", description: "24-hour cold brew, nitro on tap and seasonal iced specialties. Perfect for Portland summers.", icon: "🧊", iconType: "emoji", price: "$4.50 – $6.50", imageUrl: "https://images.unsplash.com/photo-1497636577773-f1231844b336?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Baked Fresh Daily", description: "Croissants, banana bread, almond danishes and sourdough from our in-house baker. Gluten-free options available.", icon: "🥐", iconType: "emoji", price: "$3.00 – $6.00", imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "All-Day Brunch", description: "Avocado toast, smoked salmon bagels, egg plates and seasonal grain bowls. Served until 3pm daily.", icon: "🥑", iconType: "emoji", price: "$9 – $16", imageUrl: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Specialty Teas", description: "Hand-blended loose-leaf teas, matcha lattes and herbal infusions. Sourced from Japan and Sri Lanka.", icon: "🍵", iconType: "emoji", price: "$4.00 – $6.00", imageUrl: "https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Cakes & Desserts", description: "Whole cakes by pre-order, or grab a slice of our daily bake. Great for birthdays and celebrations.", icon: "🎂", iconType: "emoji", price: "$5.50 – $8.00/slice", imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=600&q=85&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "400+", label: "Guests Daily" },
    { id: uid("st"), value: "8 yr", label: "Open Since 2016" },
    { id: uid("st"), value: "12", label: "Origin Countries" },
    { id: uid("st"), value: "4.9★", label: "Google Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Sam T.", role: "Daily Regular", content: "I've been coming every morning for 3 years. The coffee is exceptional but it's the team that makes it home. Leo remembers everyone's order.", rating: 5 },
    { id: uid("t"), name: "Mia P.", role: "Freelancer", content: "My unofficial office. Fast wifi, great music, zero pressure to leave. The cold brew keeps me alive on deadline days.", rating: 5, avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Daniel & Anna", role: "Brunch Visitors", content: "Came for coffee, stayed 3 hours. The avocado toast is genuinely the best in Portland and the vibes are completely unmatched.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Bean Club", price: "$45", period: "/month", description: "Monthly bean subscription", features: ["250g freshly roasted beans", "Tasting notes card", "Brewing guide", "10% off all in-store purchases", "Early access to new origins"], ctaLabel: "Join Bean Club", ctaUrl: "#contact" },
    { id: uid("p"), name: "Office Bundle", price: "$120", period: "/month", description: "Coffee for your whole team", features: ["Daily delivery (weekdays)", "Bean & milk selection", "Machine rental available", "Personalised order management"], highlighted: true, badge: "Popular", ctaLabel: "Get Office Bundle", ctaUrl: "#contact" },
    { id: uid("p"), name: "Event Catering", price: "Custom", description: "Pop-up bar for your event", features: ["Mobile espresso bar", "Professional barista", "Cups & consumables included", "Min 2 hours, up to 200 guests"], ctaLabel: "Book Event Bar", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What are your opening hours?", answer: "Mon–Fri: 7am – 6pm. Saturday: 8am – 5pm. Sunday: 8am – 4pm. We open earlier during summer months — follow us on Instagram for updates." },
    { id: uid("f"), question: "Do you have wifi?", answer: "Yes — fast, free wifi on both floors. We ask that you keep sessions to 3 hours during busy periods so everyone gets a seat." },
    { id: uid("f"), question: "Can I buy beans to take home?", answer: "Absolutely. We sell our house blend and rotating single-origin beans by the 250g or 500g. Ask the barista what's fresh — we roast every Thursday." },
    { id: uid("f"), question: "Do you do event catering?", answer: "Yes! We have a mobile espresso bar available for corporate events, weddings and private parties. Minimum 30 guests. Get in touch for a custom quote." },
  ],

  team: [
    { id: uid("tm"), name: "Leo Barros", role: "Founder & Head Roaster", bio: "Former finance, now coffee obsessive. Spent a year training with roasters in Colombia, Ethiopia and Tokyo before opening BrewHaven.", avatar: "https://images.unsplash.com/photo-1607631568010-a87245c0daf7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Zara Kim", role: "Head Barista & Baker", bio: "3× Portland barista champion. Trained pastry chef. Responsible for every croissant that sells out by 9am.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 11: BlissBride (Wedding Planner) ───────────────────────────────

const BLISS_BRIDE: TemplateIdentity = {
  slug: "bliss-bride",
  name: "BlissBride",
  description: "Elegant wedding planning studio. Blush & champagne palette, romantic serif typography, package tiers, full gallery.",
  category: "Events & Wedding",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85&fit=crop",
  tags: ["wedding", "events", "planner", "bridal", "luxury"],

  palette: {
    primary: "#be8b7a",
    primaryFg: "#ffffff",
    secondary: "#9a6b5e",
    accent: "#f4d9d0",
    background: "#fdf9f7",
    foreground: "#2d1810",
    muted: "#faeee9",
    mutedFg: "#8b5e52",
    card: "#ffffff",
    border: "#f0d5cc",
    ring: "#be8b7a",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Cormorant Garamond",
    bodyFont: "Inter",
    headingWeight: "400",
    letterSpacing: "0.06em",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
    .template-bliss-bride h1,.template-bliss-bride h2,.template-bliss-bride h3 { font-family: 'Cormorant Garamond', serif; font-weight: 400; letter-spacing: 0.06em; }
    .template-bliss-bride .service-card { border: 1px solid #f0d5cc; background: #fdf9f7; }
    .template-bliss-bride .stat-value { font-family: 'Cormorant Garamond', serif; font-size: 3.5rem; color: #be8b7a; }
    .template-bliss-bride .hero-overlay { background: linear-gradient(to bottom, rgba(45,24,16,0.4), rgba(45,24,16,0.65)); }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "image-cards-dark",
    testimonials: "minimal-quote",
    features: "alternating-images",
    stats: "warm-row",
    cta: "warm-banner",
    pricing: "clean-cards",
    faq: "accordion-minimal",
    navigation: "transparent-dark",
    team: "portrait-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=90&fit=crop",
      alt: "Romantic wedding ceremony",
    },
    about: {
      url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80&fit=crop",
      alt: "Wedding planning meeting",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=85&fit=crop", alt: "Ceremony styling" },
      { url: "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=600&q=85&fit=crop", alt: "Reception decor" },
      { url: "https://images.unsplash.com/photo-1583939411023-14783179e581?w=600&q=85&fit=crop", alt: "Floral arrangements" },
      { url: "https://images.unsplash.com/photo-1525772764200-be829a350797?w=600&q=85&fit=crop", alt: "Wedding cake" },
      { url: "https://images.unsplash.com/photo-1511795409834-432f9ce0049e?w=600&q=85&fit=crop", alt: "Venue styling" },
      { url: "https://images.unsplash.com/photo-1578985824572-deb00b70bab9?w=600&q=85&fit=crop", alt: "Bridal details" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=85&fit=crop", alt: "Ceremony aisle" },
      { url: "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=800&q=85&fit=crop", alt: "Table setting" },
      { url: "https://images.unsplash.com/photo-1511795409834-432f9ce0049e?w=800&q=85&fit=crop", alt: "Venue night" },
      { url: "https://images.unsplash.com/photo-1583939411023-14783179e581?w=800&q=85&fit=crop", alt: "Bridal bouquet" },
      { url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=85&fit=crop", alt: "First dance" },
      { url: "https://images.unsplash.com/photo-1525772764200-be829a350797?w=800&q=85&fit=crop", alt: "Wedding cake detail" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&fit=crop&face", alt: "Isabelle Laurent" },
      { url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80&fit=crop&face", alt: "Priya Mehta" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=1200&q=80&fit=crop",
      alt: "Plan your dream wedding",
    },
  },

  heroHeadline: "Your Dream Wedding, Perfectly Planned",
  heroSubline: "Luxury wedding design and coordination for couples who deserve the extraordinary.",
  heroBadge: "💍 150+ Weddings Celebrated",
  heroCTA: "Start Planning",
  heroSecondaryCTA: "View Our Work",
  siteName: "BlissBride Studio",
  tagline: "Where love stories become celebrations",
  phone: "+1 (212) 555-0339",
  email: "hello@blissbride.com",
  address: "18 Floral District, SoHo, New York, NY 10013",
  aboutHeading: "Every Love Story Deserves Its Perfect Day",
  aboutBody: "BlissBride was founded by Isabelle Laurent after 10 years as a luxury hotel events director. She brings the same attention to detail, the same obsessive coordination and the same passion for perfection to every wedding she touches. From intimate elopements to 400-guest estate celebrations, we treat every wedding as our most important one.",
  aboutHighlights: ["150+ weddings designed", "Vendor network of 200+", "Full-service from proposal to honeymoon", "Featured in Martha Stewart Weddings"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "Packages", url: "#pricing" },
    { id: "n4", label: "About", url: "#about" },
    { id: "n5", label: "Enquire", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Full Planning & Design", description: "End-to-end coordination from engagement to wedding day. Venue sourcing, vendor management, budget tracking, timeline and day-of direction.", icon: "🌸", iconType: "emoji", price: "From $8,500", imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Reception Styling", description: "Tablescape design, floral direction, lighting and decor. We transform venues into scenes straight out of your moodboard.", icon: "🕯️", iconType: "emoji", price: "From $3,200", imageUrl: "https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Floral Design", description: "From bridal bouquets to 8-foot ceremony arches. All flowers ethically sourced and arranged by our in-house floral team.", icon: "🌿", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1583939411023-14783179e581?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Wedding Cake Design", description: "Custom multi-tier cakes designed to match your wedding aesthetic. Tasting sessions available in studio.", icon: "🎂", iconType: "emoji", price: "From $950", imageUrl: "https://images.unsplash.com/photo-1525772764200-be829a350797?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Venue Sourcing & Styling", description: "Access to 80+ exclusive venues. We negotiate rates, style the space and ensure every detail matches your vision.", icon: "🏰", iconType: "emoji", price: "From $2,400", imageUrl: "https://images.unsplash.com/photo-1511795409834-432f9ce0049e?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Day-of Coordination", description: "Your personal coordinator on the day. Timeline management, vendor liaison and every detail handled — so you can simply be present.", icon: "📋", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1578985824572-deb00b70bab9?w=600&q=85&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "150+", label: "Weddings Celebrated" },
    { id: uid("st"), value: "200+", label: "Vendor Partners" },
    { id: uid("st"), value: "10 yr", label: "Planning Experience" },
    { id: uid("st"), value: "100%", label: "Would Recommend" },
  ],

  testimonials: [
    { id: uid("t"), name: "Emma & Thomas", role: "Married June 2024", content: "We handed Isabelle our scrapbook and said 'make this real'. She exceeded every single thing we'd imagined. Our guests are still talking about it.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Ananya & Jay", role: "Married September 2024", content: "We planned a fusion Indian-Western wedding for 280 guests. Isabelle coordinated 40 vendors flawlessly and was calm when we weren't. Magical.", rating: 5 },
    { id: uid("t"), name: "Sophie & Grace", role: "Married April 2024", content: "From our first consultation I knew BlissBride got us. The floral arch was breathtaking. Every single detail was perfect. Worth every penny.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Coordination", price: "$1,800", description: "Day-of coordination only", features: ["Pre-wedding consultation", "Vendor timeline creation", "Day-of coordinator", "Emergency kit included", "Post-wedding wrap-up"], ctaLabel: "Book Coordination", ctaUrl: "#contact" },
    { id: uid("p"), name: "Signature", price: "$6,500", description: "Partial planning & design", features: ["6 planning sessions", "Venue & vendor referrals", "Budget management", "Design direction", "Day-of coordination", "Rehearsal management"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Signature", ctaUrl: "#contact" },
    { id: uid("p"), name: "Bespoke", price: "From $12,000", description: "Full luxury planning", features: ["Unlimited planning sessions", "Full vendor management", "Bespoke floral design", "Custom styling & decor", "Complete day direction", "Honeymoon coordination"], ctaLabel: "Enquire Bespoke", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How far in advance should we start planning?", answer: "For full planning packages, 12–18 months gives us the best vendor availability and venue choice. Day-of coordination can be booked up to 3 months out for smaller weddings." },
    { id: uid("f"), question: "Do you work with destination weddings?", answer: "Yes — we've planned weddings in France, Italy, Santorini and the Maldives. Destination packages include full local vendor coordination and advance site visits. Contact us for custom pricing." },
    { id: uid("f"), question: "Can we bring our own vendors?", answer: "Absolutely. If you already have a florist or photographer you love, we'll work seamlessly with them. We're collaborative, not exclusive." },
    { id: uid("f"), question: "What's included in your vendor network?", answer: "Our curated network covers venues, photographers, videographers, caterers, florists, hair & makeup artists, bands and DJs across New York and the Hamptons. All personally vetted and reviewed." },
  ],

  team: [
    { id: uid("tm"), name: "Isabelle Laurent", role: "Founder & Lead Planner", bio: "10 years as luxury hotel events director before founding BlissBride. Plans every wedding personally. Trained in Paris, based in New York.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Priya Mehta", role: "Senior Coordinator & Florist", bio: "Certified floral designer and coordination specialist. Creates every floral concept in-studio. Has coordinated 80+ weddings.", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 12: MaizeFashion (Fashion Boutique) ────────────────────────────

const MAIZE_FASHION: TemplateIdentity = {
  slug: "maize-fashion",
  name: "MaizeFashion",
  description: "Avant-garde fashion boutique. High-contrast monochrome with gold, editorial hero, collection grid, luxury brand feel.",
  category: "Fashion & Retail",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85&fit=crop",
  tags: ["fashion", "boutique", "retail", "luxury", "clothing"],

  palette: {
    primary: "#111111",
    primaryFg: "#ffffff",
    secondary: "#c8a96e",
    accent: "#f5e6cc",
    background: "#ffffff",
    foreground: "#111111",
    muted: "#f5f5f5",
    mutedFg: "#666666",
    card: "#ffffff",
    border: "#e5e5e5",
    ring: "#111111",
    borderRadius: "0",
  },
  typography: {
    headingFont: "Bodoni Moda",
    bodyFont: "Inter",
    headingWeight: "400",
    letterSpacing: "0.1em",
  },
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,600;1,400&display=swap');
    .template-maize-fashion h1,.template-maize-fashion h2,.template-maize-fashion h3 { font-family: 'Bodoni Moda', serif; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; }
    .template-maize-fashion .service-card { border: none; border-bottom: 1px solid #111; border-radius: 0; }
    .template-maize-fashion .stat-value { font-family: 'Bodoni Moda', serif; font-size: 3rem; color: #111; }
    .template-maize-fashion .nav-bar { background: #fff; border-bottom: 1px solid #111; }
    .template-maize-fashion .cta-section { background: #111; color: #fff; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "image-cards-dark",
    testimonials: "minimal-quote",
    features: "alternating-images",
    stats: "plain-light",
    cta: "dark-split",
    pricing: "clean-cards",
    faq: "accordion-minimal",
    navigation: "transparent-light",
    team: "portrait-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=90&fit=crop",
      alt: "Fashion editorial shoot",
    },
    heroSecondary: {
      url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=85&fit=crop",
      alt: "Model in boutique",
    },
    about: {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop",
      alt: "Boutique interior",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=85&fit=crop", alt: "Women's collection" },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=85&fit=crop", alt: "Men's collection" },
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=85&fit=crop", alt: "Accessories" },
      { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=85&fit=crop", alt: "Footwear" },
      { url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=85&fit=crop", alt: "Bridal & occasion" },
      { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=85&fit=crop", alt: "Personal styling" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=85&fit=crop", alt: "Editorial look 1" },
      { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=85&fit=crop", alt: "Editorial look 2" },
      { url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=85&fit=crop", alt: "Street style" },
      { url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&q=85&fit=crop", alt: "New collection" },
      { url: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&q=85&fit=crop", alt: "Campaign shot" },
      { url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=85&fit=crop", alt: "Bridal look" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&fit=crop&face", alt: "Camille Noir" },
      { url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80&fit=crop&face", alt: "Yuki Tanaka" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80&fit=crop",
      alt: "Shop the collection",
    },
  },

  heroHeadline: "Wear What You Believe In",
  heroSubline: "Curated fashion for the discerning. New collection drops every season.",
  heroBadge: "✦ New Season Collection Now Live",
  heroCTA: "Shop Now",
  heroSecondaryCTA: "Book Styling Session",
  siteName: "Maize Fashion",
  tagline: "Less, but better.",
  phone: "+1 (212) 555-0419",
  email: "studio@maizefashion.com",
  address: "41 Greene Street, SoHo, New York, NY 10013",
  aboutHeading: "Fashion That Respects Both You and the World",
  aboutBody: "Maize was founded by designer Camille Noir with a clear manifesto: buy less, buy better. Every piece in our boutique is selected for longevity, sustainability and genuine beauty. We carry independent European designers, sustainable labels and our own capsule line — all designed to outlast trends.",
  aboutHighlights: ["50+ independent designers stocked", "Sustainable & ethical production", "Personal styling by appointment", "Alterations in-studio"],

  navItems: [
    { id: "n1", label: "Collections", url: "#services" },
    { id: "n2", label: "Lookbook", url: "#gallery" },
    { id: "n3", label: "Styling", url: "#pricing" },
    { id: "n4", label: "Story", url: "#about" },
    { id: "n5", label: "Visit", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Women's Collections", description: "Seasonal ready-to-wear from emerging European designers and our in-house Maize label. New pieces weekly.", icon: "👗", iconType: "emoji", price: "$85 – $1,200", imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Men's Edit", description: "Minimal, precise menswear. Tailored essentials, luxury basics and statement outerwear from Scandinavian and Japanese labels.", icon: "👔", iconType: "emoji", price: "$95 – $1,400", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Accessories & Jewellery", description: "Handmade leather goods, minimal fine jewellery and considered accessories. One-of-a-kind finds.", icon: "💍", iconType: "emoji", price: "$35 – $650", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Footwear", description: "Artisan-made leather shoes and boots. Comfort, craft and design that only improves with wear.", icon: "👠", iconType: "emoji", price: "$180 – $850", imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bridal & Occasion", description: "Understated luxury for your most important moments. Bridal consultations by private appointment.", icon: "🤍", iconType: "emoji", price: "$350 – $3,800", imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=85&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Personal Styling", description: "One-on-one wardrobe curation with our in-house stylist. 90 minutes in-studio. Includes outfit capsule plan.", icon: "✨", iconType: "emoji", price: "$180/session", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=85&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "50+", label: "Designers Stocked" },
    { id: uid("st"), value: "8 yr", label: "In SoHo" },
    { id: uid("st"), value: "4.8★", label: "Google Rating" },
    { id: uid("st"), value: "100%", label: "Ethically Sourced" },
  ],

  testimonials: [
    { id: uid("t"), name: "Claudia V.", role: "Loyal Client", content: "Maize is the only boutique I trust to curate my wardrobe. Camille has an eye that's completely unmatched. I've never bought something I regret.", rating: 5, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "James K.", role: "Men's Client", content: "Finally a men's edit with real taste. The styling session saved me from 3 years of bad shopping decisions. My wardrobe now works.", rating: 5 },
    { id: uid("t"), name: "Mei L.", role: "Bridal Client", content: "I wore Maize for my wedding and every person asked where the dress was from. Yuki found it from a Paris designer nobody had heard of. Perfect.", rating: 5, avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&q=80&fit=crop&face" },
  ],

  pricing: [
    { id: uid("p"), name: "Style Consultation", price: "$180", description: "90-minute personal styling", features: ["Style profile assessment", "Wardrobe capsule plan", "In-store styling", "Look curation", "Shopping list provided"], ctaLabel: "Book Styling", ctaUrl: "#contact" },
    { id: uid("p"), name: "Wardrobe Edit", price: "$380", description: "Full wardrobe transformation", features: ["At-home wardrobe audit", "Curation & edit session", "3 complete new looks", "Seasonal buying guide", "Priority new-arrival access"], highlighted: true, badge: "Most Chosen", ctaLabel: "Book Edit", ctaUrl: "#contact" },
    { id: uid("p"), name: "Brand Partner", price: "Custom", description: "Ongoing style partnership", features: ["Quarterly seasonal updates", "Personal shopper service", "Event & travel dressing", "Alterations included", "VIP launch invitations"], ctaLabel: "Enquire", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you ship internationally?", answer: "Yes — we ship to 35+ countries. Standard international shipping 7–14 days, express 3–5 days. All orders are packaged in recycled materials with a personalised note." },
    { id: uid("f"), question: "What is your returns policy?", answer: "14-day returns on unworn, tagged items. Exchange or store credit only for sale items. We cover return shipping for defective items." },
    { id: uid("f"), question: "Do you do alterations?", answer: "Yes — in-studio alterations are available for all purchases. Simple alterations are complimentary on items over $300. Bespoke tailoring available on request." },
    { id: uid("f"), question: "How do I book a styling session?", answer: "Use the contact form or email studio@maizefashion.com. Sessions are available Tuesday–Saturday, 10am–6pm. We ask for 48 hours notice for changes." },
  ],

  team: [
    { id: uid("tm"), name: "Camille Noir", role: "Founder & Creative Director", bio: "Former buyer for Net-a-Porter and Liberty London. Founded Maize in 2016 with a 'less, but better' philosophy that drives every selection.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Yuki Tanaka", role: "Head Stylist & Buyer", bio: "Trained in Tokyo and London. Travels to Paris and Milan each season to source pieces before anyone else. The eye behind the edit.", avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 13: BuildRight (SG/AE Renovation & Construction) ───────────────

const BUILD_RIGHT: TemplateIdentity = {
  slug: "build-right",
  name: "BuildRight",
  description: "Bold renovation & construction company. Dark charcoal + safety orange. Full-width hero, project gallery, certifications, quote form.",
  category: "Renovation & Construction",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=85&fit=crop",
  tags: ["renovation", "construction", "fitout", "contractor", "singapore"],

  palette: {
    primary: "#ea580c",
    primaryFg: "#ffffff",
    secondary: "#1c1917",
    accent: "#fb923c",
    background: "#111110",
    foreground: "#f5f5f4",
    muted: "#1c1917",
    mutedFg: "#a8a29e",
    card: "#1c1917",
    border: "#292524",
    ring: "#ea580c",
    borderRadius: "0",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.03em",
  },
  customCss: `
    .template-build-right h1,.template-build-right h2 { font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase; }
    .template-build-right .service-card { border-left: 4px solid #ea580c; background: #1c1917; }
    .template-build-right .stat-value { color: #ea580c; font-weight: 900; font-size: 2.5rem; }
    .template-build-right .nav-bar { background: #111110; border-bottom: 1px solid #292524; }
    .template-build-right .hero-badge { background: #ea580c; color: #fff; font-weight: 700; letter-spacing: 0.05em; font-size: 0.75rem; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=90&fit=crop",
      alt: "Construction site at dusk",
    },
    about: {
      url: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80&fit=crop",
      alt: "Renovation project in progress",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&q=80&fit=crop", alt: "Home renovation" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", alt: "Office fitout" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", alt: "Commercial construction" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop", alt: "Kitchen remodel" },
      { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80&fit=crop", alt: "Bathroom renovation" },
      { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80&fit=crop", alt: "New build handover" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", alt: "Completed living room" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&fit=crop", alt: "Kitchen renovation" },
      { url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80&fit=crop", alt: "Office fitout" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80&fit=crop", alt: "Bathroom remodel" },
      { url: "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800&q=80&fit=crop", alt: "Retail construction" },
      { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80&fit=crop", alt: "Bedroom renovation" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Project Director" },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face", alt: "Site Manager" },
      { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face", alt: "Design Lead" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80&fit=crop",
      alt: "Get a quote",
    },
  },

  heroHeadline: "We Build. We Renovate. We Deliver.",
  heroSubline: "Licensed renovation contractor trusted by 600+ homeowners and businesses across Singapore.",
  heroBadge: "🏗️ BCA Licensed Contractor",
  heroCTA: "Get a Free Quote",
  heroSecondaryCTA: "View Our Work",
  siteName: "BuildRight Renovation",
  tagline: "Quality renovation work, on time and on budget",
  phone: "+65 9123 4567",
  email: "quote@buildright.sg",
  address: "18 Boon Lay Way, #04-98 Tradehub 21, Singapore 609966",
  aboutHeading: "600+ Projects. Zero Compromises.",
  aboutBody: "BuildRight has been transforming homes, offices and commercial spaces across Singapore since 2008. Our team of HDB-licensed carpenters, tilers, electricians and plumbers handles every trade in-house — meaning tighter timelines, cleaner finishes and one point of accountability. We've completed over 600 projects ranging from single-room makeovers to full 5-room HDB renovations and commercial fit-outs.",
  aboutHighlights: ["HDB licensed renovator", "All trades in-house", "3-year workmanship warranty", "Fixed-price contracts — no surprise bills", "600+ completed projects"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Projects", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Get Quote", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Full Home Renovation", description: "Complete HDB or condo overhaul — carpentry, tiling, electrical, plumbing and painting. Turnkey delivery.", icon: "🏠", iconType: "emoji", price: "From $18,000", imageUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial Fitout", description: "Office, retail, F&B and co-working spaces built to spec and BCA compliance. We manage permits.", icon: "🏢", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Kitchen Remodel", description: "Custom carpentry, hob, hood and sink installation. Full tiling and waterproofing. 10-day timeline.", icon: "🍳", iconType: "emoji", price: "From $6,500", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bathroom Renovation", description: "Waterproofing, tiling, sanitary fitting, mirror cabinet and lighting. HDB-approved materials.", icon: "🚿", iconType: "emoji", price: "From $4,200", imageUrl: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Carpentry & Wardrobes", description: "Full custom carpentry — platform beds, wardrobes, TV consoles and display cabinets. E0 board standard.", icon: "🪵", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Hacking & Demolition", description: "Wall hacking, floor hacking and structural opening works. HDB-approved. Safe removal guaranteed.", icon: "⚒️", iconType: "emoji", price: "From $800", imageUrl: "https://images.unsplash.com/photo-1590004987778-bece5c9adab6?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "600+", label: "Projects Completed" },
    { id: uid("st"), value: "15 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "HDB Review Score" },
    { id: uid("st"), value: "3 yr", label: "Workmanship Warranty" },
  ],

  testimonials: [
    { id: uid("t"), name: "Daryl Tan", role: "HDB 5-Room Owner", company: "Tampines", content: "Full renovation done in 28 days. Carpentry is solid, tiling is perfect, and they cleaned up every day before leaving. Exceptional team.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Priya Nair", role: "Condo Owner", company: "Jurong East", content: "They gave us a fixed price and stuck to it. Not a single surprise bill. The kitchen and bathrooms look magazine-worthy. Highly recommend.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Jason Lim", role: "F&B Owner", company: "Tanjong Pagar", content: "Fitted out our cafe in 3 weeks. BCA submissions handled, permits sorted, and the result looked exactly like the 3D render. Brilliant.", rating: 5 },
    { id: uid("t"), name: "Farah Abdullah", role: "Homeowner", company: "Bedok", content: "Bathroom hacking and full reno done with zero mess. They even helped us select tiles within our budget. Wonderful experience.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Studio / 1-Room", price: "From $12,000", description: "Full renovation package", features: ["Up to 45 sqm", "Carpentry & painting", "Tiling & waterproofing", "Electrical & lighting", "3-year warranty"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "3–4 Room HDB", price: "From $25,000", description: "Most popular package", features: ["90–100 sqm", "Full carpentry suite", "Kitchen & bathrooms", "All trades included", "3D design included", "3-year warranty"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "5-Room / Condo", price: "From $40,000", description: "Premium whole-home package", features: ["110–130 sqm", "Luxury finishes option", "Smart home wiring", "Full carpentry & tiling", "Project manager assigned", "5-year warranty"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How long does a full HDB renovation take?", answer: "A 4-room HDB renovation typically takes 4–6 weeks from handover of keys. We'll give you a detailed timeline before work starts." },
    { id: uid("f"), question: "Do you handle HDB permit submissions?", answer: "Yes. We handle all HDB renovation permit submissions on your behalf, including structural, electrical and plumbing works that require approval." },
    { id: uid("f"), question: "Do you provide a fixed-price contract?", answer: "Always. Our quotations are fully itemised and fixed. There are no hidden charges or variations unless you request additional scope in writing." },
    { id: uid("f"), question: "What warranty do you provide?", answer: "We provide a 3-year workmanship warranty on all renovation works and a 5-year warranty on waterproofing. Any defects during the warranty period are rectified at no charge." },
    { id: uid("f"), question: "Can we see your past projects?", answer: "Absolutely. Visit our gallery above or message us and we'll share a full portfolio with before/after photos from similar unit types." },
  ],

  team: [
    { id: uid("tm"), name: "Marcus Wong", role: "Founder & Project Director", bio: "15 years in renovation and construction. Personally oversees every project to ensure quality and timeline are met.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Ramesh Kumar", role: "Senior Site Manager", bio: "10 years managing renovation sites across Singapore. Specialist in HDB compliance and structural works.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Wei Ling Tan", role: "Interior Design Lead", bio: "Trained at NAFA. Brings your vision to life with 3D renders before a single nail is hammered.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 14: ColourCraft (Painting & Decorating) ────────────────────────

const COLOUR_CRAFT: TemplateIdentity = {
  slug: "colour-craft",
  name: "ColourCraft",
  description: "Vibrant painting & decorating company. Bright white + bold accent. Color palette selector feel, before/after gallery, fast quote flow.",
  category: "Interior Design",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=85&fit=crop",
  tags: ["painting", "decorating", "interior", "colour", "residential"],

  palette: {
    primary: "#7c3aed",
    primaryFg: "#ffffff",
    secondary: "#db2777",
    accent: "#a78bfa",
    background: "#ffffff",
    foreground: "#18181b",
    muted: "#f4f4f5",
    mutedFg: "#52525b",
    card: "#ffffff",
    border: "#e4e4e7",
    ring: "#7c3aed",
    borderRadius: "1rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.025em",
  },
  customCss: `
    .template-colour-craft h1,.template-colour-craft h2 { font-weight: 800; letter-spacing: -0.025em; }
    .template-colour-craft .service-card { border-radius: 1rem; box-shadow: 0 4px 24px rgba(124,58,237,0.08); border: 1px solid #e4e4e7; }
    .template-colour-craft .service-card:hover { box-shadow: 0 8px 32px rgba(124,58,237,0.18); border-color: #a78bfa; }
    .template-colour-craft .stat-value { color: #7c3aed; }
    .template-colour-craft .hero-badge { background: linear-gradient(90deg, #7c3aed, #db2777); color: #fff; border-radius: 9999px; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1600&q=90&fit=crop",
      alt: "Professional painter at work",
    },
    about: {
      url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80&fit=crop",
      alt: "Freshly painted living room",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80&fit=crop", alt: "Interior painting" },
      { url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&fit=crop", alt: "Feature wall" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", alt: "Exterior painting" },
      { url: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&q=80&fit=crop", alt: "Commercial painting" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80&fit=crop", alt: "Wallpaper installation" },
      { url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&fit=crop", alt: "Texture coating" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", alt: "Living room transformation" },
      { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80&fit=crop", alt: "Bedroom feature wall" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80&fit=crop", alt: "Kitchen painted" },
      { url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800&q=80&fit=crop", alt: "Open plan living" },
      { url: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80&fit=crop", alt: "Office repaint" },
      { url: "https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?w=800&q=80&fit=crop", alt: "Exterior facade" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80&fit=crop&face", alt: "Lead Painter" },
      { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face", alt: "Colour Consultant" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Project Coordinator" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80&fit=crop",
      alt: "Get a free colour consultation",
    },
  },

  heroHeadline: "Your Home, Transformed by Colour",
  heroSubline: "Professional painting & decorating for homes, offices and commercial spaces. Free colour consultation included.",
  heroBadge: "🎨 Free Colour Consultation",
  heroCTA: "Get Free Quote",
  heroSecondaryCTA: "See Our Work",
  siteName: "ColourCraft Painters",
  tagline: "Professional painting that lasts",
  phone: "+65 8800 1234",
  email: "hello@colourcraft.sg",
  address: "Serving all areas across Singapore",
  aboutHeading: "Singapore's Trusted Painting Specialists Since 2010",
  aboutBody: "ColourCraft was founded on a single belief: a fresh coat of paint is the most powerful transformation in any space. Our team of 30 certified painters and decorators serves homeowners and businesses across Singapore, using only premium Nippon, Dulux and Jotun paints that are low-VOC and safe for families and pets. We arrive on time, protect your furniture, and leave your space spotless.",
  aboutHighlights: ["BizSafe certified company", "Low-VOC & eco-friendly paints", "Furniture fully protected during works", "On-time project guarantee", "Free colour consultation & samples"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "Pricing", url: "#pricing" },
    { id: "n4", label: "About", url: "#about" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Interior House Painting", description: "Full interior repaint for HDB, condo or landed — walls, ceilings, doors and trim. Any paint brand supplied.", icon: "🏠", iconType: "emoji", price: "From $380 (3-room)", imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Feature Wall Painting", description: "Accent walls, geometric patterns, ombre effects and decorative finishes that define a room.", icon: "🎨", iconType: "emoji", price: "From $180/wall", imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Exterior Painting", description: "HDB block touch-up, landed exterior, parapet walls and metal gates. Weatherproof paint guaranteed.", icon: "🏗️", iconType: "emoji", price: "From $800", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial Repainting", description: "Office, retail, restaurant and school repainting. Weekend and after-hours slots available.", icon: "🏢", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Wallpaper Installation", description: "Supply and install wallpaper, wall murals and vinyl wall decals. Removal of old wallpaper included.", icon: "🖼️", iconType: "emoji", price: "From $8/sqft", imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Texture & Specialty Finishes", description: "Sand texture, marble effect, lime wash and other decorative wall coatings that add dimension.", icon: "✨", iconType: "emoji", price: "From $12/sqft", imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "4,200+", label: "Rooms Painted" },
    { id: uid("st"), value: "98%", label: "On-Time Completion" },
    { id: uid("st"), value: "4.9★", label: "Google Rating" },
    { id: uid("st"), value: "14 yr", label: "In Business" },
  ],

  testimonials: [
    { id: uid("t"), name: "Linda Goh", role: "Homeowner", company: "Punggol", content: "Quoted me in 24 hours, started the next Monday, done in 2 days. My 5-room looks like a showflat. The workmanship is immaculate.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Ravi Sundaram", role: "Office Manager", company: "One Raffles Place", content: "Repainted our entire 3,000 sqft office over a weekend. Arrived Saturday 7am, done Sunday 6pm, zero disruption to Monday operations.", rating: 5 },
    { id: uid("t"), name: "Michelle Tan", role: "Interior Designer", company: "Freelance", content: "I recommend ColourCraft to all my clients. Their colour mixing accuracy and finish quality is consistently the best I've seen in Singapore.", rating: 5, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Ahmad Faris", role: "Homeowner", company: "Woodlands", content: "Did a lime wash feature wall for us. Came out even better than the reference photos we showed them. Genuinely talented team.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "2–3 Room HDB", price: "From $380", description: "Interior walls & ceilings", features: ["All interior walls & ceilings", "1 primer + 2 finish coats", "Furniture covered & protected", "Nippon / Dulux paint included", "Same-week availability"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "4–5 Room HDB", price: "From $580", description: "Full interior repaint", features: ["All rooms including corridors", "Premium low-VOC paint", "Colour consultation included", "Feature wall option", "2-year paint warranty"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Condo / Landed", price: "From $900", description: "Large-format home painting", features: ["Up to 160 sqm", "Multi-brand paint available", "Luxury finish options", "3D colour visualisation", "Weekend scheduling available", "2-year warranty"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How long does it take to paint a 4-room HDB?", answer: "Typically 1–2 days. We send the right number of painters for your unit size to keep the timeline tight without rushing the finish." },
    { id: uid("f"), question: "Do I need to move my furniture?", answer: "No. Our team covers all furniture and flooring with protective sheets before starting. You don't need to move anything." },
    { id: uid("f"), question: "Can I choose my own colours?", answer: "Absolutely. We can match any colour from Nippon, Dulux, Jotun or your own colour chips. Our free consultation includes sample patches on your wall." },
    { id: uid("f"), question: "What paint brands do you use?", answer: "We supply Nippon Paint, Dulux and Jotun — all premium brands with low-VOC formulas. We can also use paint supplied by you." },
  ],

  team: [
    { id: uid("tm"), name: "Tony Lim", role: "Founder & Head Painter", bio: "14 years of painting mastery. Tony personally trains every painter on the team to ensure consistent quality across every job.", avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "David Chen", role: "Senior Colour Consultant", bio: "Trained interior designer turned colour specialist. David's palette recommendations transform spaces every time.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Siti Rahma", role: "Project Coordinator", bio: "Ensures every job is scheduled, communicated and completed on time. Your single point of contact from quote to handover.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 15: PestShield (Pest Control) ──────────────────────────────────

const PEST_SHIELD: TemplateIdentity = {
  slug: "pest-shield",
  name: "PestShield",
  description: "Authoritative pest control company. Deep green + white. Treatment types, eco-certification badges, fast booking, residential & commercial.",
  category: "Cleaning",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=85&fit=crop",
  tags: ["pest control", "extermination", "termite", "residential", "commercial"],

  palette: {
    primary: "#15803d",
    primaryFg: "#ffffff",
    secondary: "#166534",
    accent: "#4ade80",
    background: "#f0fdf4",
    foreground: "#14532d",
    muted: "#dcfce7",
    mutedFg: "#166534",
    card: "#ffffff",
    border: "#bbf7d0",
    ring: "#15803d",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-pest-shield h1,.template-pest-shield h2 { font-weight: 800; }
    .template-pest-shield .service-card { border-top: 3px solid #15803d; }
    .template-pest-shield .stat-value { color: #15803d; font-weight: 900; }
    .template-pest-shield .hero-badge { background: #15803d; color: #fff; border-radius: 9999px; font-weight: 700; }
    .template-pest-shield .nav-bar { background: #ffffff; border-bottom: 2px solid #bbf7d0; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600&q=90&fit=crop",
      alt: "Professional pest control technician",
    },
    about: {
      url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80&fit=crop",
      alt: "Pest control treatment in progress",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", alt: "General pest control" },
      { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80&fit=crop", alt: "Termite treatment" },
      { url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80&fit=crop", alt: "Rodent control" },
      { url: "https://images.unsplash.com/photo-1527515637462-cff94ebb3cfe?w=600&q=80&fit=crop", alt: "Bed bug treatment" },
      { url: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=600&q=80&fit=crop", alt: "Mosquito fogging" },
      { url: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80&fit=crop", alt: "Commercial pest contract" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop", alt: "Residential treatment" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&fit=crop", alt: "Kitchen inspection" },
      { url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80&fit=crop", alt: "Technician at work" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&fit=crop", alt: "Commercial contract" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Chief Technician" },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face", alt: "Field Supervisor" },
      { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face", alt: "Operations Manager" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&q=80&fit=crop",
      alt: "Book pest control",
    },
  },

  heroHeadline: "Pest-Free. Guaranteed.",
  heroSubline: "Licensed pest management for homes and businesses. Safe for children, pets and the environment.",
  heroBadge: "✅ NEA Licensed Pest Control",
  heroCTA: "Book a Treatment",
  heroSecondaryCTA: "Get Free Inspection",
  siteName: "PestShield Services",
  tagline: "Protecting homes and businesses from pests since 2009",
  phone: "+65 6712 3456",
  email: "book@pestshield.sg",
  address: "12 Mandai Estate, #03-20, Singapore 729908",
  aboutHeading: "NEA-Licensed. Eco-Certified. Trusted by 5,000+ Clients.",
  aboutBody: "PestShield has been protecting Singapore homes and commercial premises from pests since 2009. Our NEA-licensed technicians use Integrated Pest Management (IPM) methods — combining targeted treatments with habitat modification to eliminate pests at the source. We prioritise solutions that are effective, safe and kind to the environment.",
  aboutHighlights: ["NEA licensed pest management company", "ISO 9001:2015 certified", "Eco-certified treatments (safe for kids & pets)", "Annual maintenance contracts available", "24/7 emergency callout service"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Contracts", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "General Pest Control", description: "Treatment for cockroaches, ants, flies, silverfish and common household insects. Gel bait + residual spray.", icon: "🐛", iconType: "emoji", price: "From $80/treatment", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Termite Treatment", description: "Soil treatment, baiting systems and structural pre-treatment. 5-year termite warranty available.", icon: "🪲", iconType: "emoji", price: "From $350", imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Rodent Control", description: "Rat and mouse elimination using tamper-resistant bait stations and exclusion works. Monthly monitoring available.", icon: "🐀", iconType: "emoji", price: "From $180", imageUrl: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bed Bug Treatment", description: "Heat treatment and chemical residual treatment for complete bed bug elimination. 3-month warranty.", icon: "🛏️", iconType: "emoji", price: "From $280", imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94ebb3cfe?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Mosquito Control & Fogging", description: "ULV thermal fogging, larviciding and misting systems for gardens, estates and commercial compounds.", icon: "🦟", iconType: "emoji", price: "From $120", imageUrl: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial Contracts", description: "NEA-compliant annual pest management contracts for F&B, hospitality, healthcare and manufacturing.", icon: "🏢", iconType: "emoji", price: "From $800/year", imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "5,000+", label: "Properties Treated" },
    { id: uid("st"), value: "15 yr", label: "In Business" },
    { id: uid("st"), value: "100%", label: "NEA Compliant" },
    { id: uid("st"), value: "4.8★", label: "Google Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Kevin Ong", role: "F&B Owner", company: "Clementi", content: "We've had PestShield on an annual contract for 4 years. Zero pest incidents, zero NEA warnings. They're the reason we consistently pass inspections.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Mrs. Lim", role: "Homeowner", company: "Bishan", content: "Had a serious cockroach problem that three other companies couldn't fix. PestShield did one treatment and we haven't seen a single one since. Incredible.", rating: 5 },
    { id: uid("t"), name: "Jason Park", role: "Property Manager", company: "Marina Bay", content: "Manage 8 commercial units. PestShield handles all of them on one contract. Professional, thorough reports and zero issues.", rating: 5 },
    { id: uid("t"), name: "Faridah Binte Said", role: "Homeowner", company: "Yishun", content: "Had termites in the wall. Their heat treatment was completely non-intrusive and the 5-year warranty gives us peace of mind.", rating: 5, avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&q=80&fit=crop&face" },
  ],

  pricing: [
    { id: uid("p"), name: "One-Time Treatment", price: "From $80", description: "Single-visit pest treatment", features: ["One pest type targeted", "Licensed technician", "Report & recommendations", "Follow-up advice", "30-day guarantee"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Quarterly Contract", price: "From $280/year", description: "4 treatments per year", features: ["4 scheduled visits/year", "All common pests covered", "Between-visit callouts free", "NEA-compliant reporting", "Priority scheduling"], highlighted: true, badge: "Best Value", ctaLabel: "Get Contract Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Commercial Annual", price: "Custom", description: "Full-year commercial contract", features: ["Unlimited treatments", "Monthly monitoring visits", "Emergency same-day callout", "Full NEA compliance docs", "Dedicated account manager", "Multi-unit discounts"], ctaLabel: "Discuss Contract", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Are your treatments safe for children and pets?", answer: "Yes. We use EPA and NEA-approved formulations with minimal residual impact. We'll advise on re-entry times (usually 1–4 hours) for each treatment type." },
    { id: uid("f"), question: "Do I need to vacate during treatment?", answer: "For most general pest treatments, you only need to vacate for 1–2 hours. Bed bug heat treatment requires 4–6 hours. We'll advise before starting." },
    { id: uid("f"), question: "How quickly can you respond?", answer: "We offer same-day bookings for urgent cases and 24/7 emergency callouts for commercial contracts. Standard residential bookings can usually be scheduled within 24 hours." },
    { id: uid("f"), question: "Do you provide NEA-compliant service reports?", answer: "Yes. Every treatment includes a fully documented service report including pest activity levels, treatment applied, and recommendations. Essential for NEA inspections." },
  ],

  team: [
    { id: uid("tm"), name: "Alvin Koh", role: "Chief Pest Control Technician", bio: "NEA licensed with 15 years in the field. Expert in termite baiting systems and Integrated Pest Management.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Hafiz Rahman", role: "Field Supervisor", bio: "Specialises in commercial accounts and high-volume residential estates. Fully certified in heat treatment.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Grace Yeo", role: "Operations Manager", bio: "Ensures every booking is perfectly scheduled and every client receives a follow-up report within 24 hours.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 16: UniformPro (Garments / Uniforms / Workwear) ────────────────

const UNIFORM_PRO: TemplateIdentity = {
  slug: "uniform-pro",
  name: "UniformPro",
  description: "Clean, professional garment & uniform supplier. Navy + gold accent. Product showcase, bulk order form, fabric details, corporate clients.",
  category: "Retail & Shop",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=85&fit=crop",
  tags: ["uniforms", "garments", "workwear", "corporate", "embroidery"],

  palette: {
    primary: "#1e3a5f",
    primaryFg: "#ffffff",
    secondary: "#c9a84c",
    accent: "#e8d5a3",
    background: "#f8f7f4",
    foreground: "#1a1a2e",
    muted: "#ede9e0",
    mutedFg: "#5a5a7a",
    card: "#ffffff",
    border: "#ddd8cc",
    ring: "#1e3a5f",
    borderRadius: "0.375rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-uniform-pro h1,.template-uniform-pro h2 { font-weight: 700; letter-spacing: -0.01em; }
    .template-uniform-pro .service-card { border: 1px solid #ddd8cc; border-top: 3px solid #c9a84c; }
    .template-uniform-pro .stat-value { color: #1e3a5f; font-weight: 800; }
    .template-uniform-pro .nav-bar { background: #1e3a5f; }
    .template-uniform-pro .hero-badge { background: #c9a84c; color: #1e3a5f; font-weight: 700; border-radius: 4px; }
  `,

  variants: {
    hero: "corporate",
    services: "numbered",
    testimonials: "full-width",
    features: "dark",
    stats: "dark-band",
    cta: "gradient-banner",
    pricing: "dark",
    faq: "two-column",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=90&fit=crop",
      alt: "Professional uniform collection",
    },
    about: {
      url: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=800&q=80&fit=crop",
      alt: "Garment manufacturing",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80&fit=crop", alt: "Corporate uniforms" },
      { url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=80&fit=crop", alt: "F&B uniforms" },
      { url: "https://images.unsplash.com/photo-1582578598774-a377d4b32223?w=600&q=80&fit=crop", alt: "Healthcare workwear" },
      { url: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=600&q=80&fit=crop", alt: "Construction workwear" },
      { url: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&q=80&fit=crop", alt: "School uniforms" },
      { url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&q=80&fit=crop", alt: "Custom embroidery" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80&fit=crop", alt: "Uniform range" },
      { url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80&fit=crop", alt: "Restaurant team uniforms" },
      { url: "https://images.unsplash.com/photo-1582578598774-a377d4b32223?w=800&q=80&fit=crop", alt: "Medical scrubs" },
      { url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80&fit=crop", alt: "Logo embroidery detail" },
      { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&fit=crop", alt: "Corporate shirt" },
      { url: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=800&q=80&fit=crop", alt: "Factory floor" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Managing Director" },
      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face", alt: "Design Manager" },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face", alt: "Production Head" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80&fit=crop",
      alt: "Request a quote",
    },
  },

  heroHeadline: "Uniforms That Represent Your Brand",
  heroSubline: "Custom workwear and uniforms for corporate, F&B, healthcare, hospitality and industrial sectors. MOQ 10 pieces.",
  heroBadge: "🏭 Factory Direct · MOQ 10 Pieces",
  heroCTA: "Request a Quote",
  heroSecondaryCTA: "View Catalogue",
  siteName: "UniformPro Garments",
  tagline: "Professional uniforms manufactured to your exact specification",
  phone: "+880 1712 345678",
  email: "orders@uniformpro.com.bd",
  address: "Plot 24, BSCIC Industrial Estate, Tongi, Gazipur, Bangladesh",
  aboutHeading: "18 Years of Uniform Manufacturing Excellence",
  aboutBody: "UniformPro is a Bangladesh-based garment manufacturer specialising in custom uniforms, workwear and corporate apparel for clients across Southeast Asia, the Middle East and beyond. With our own 40,000 sqft factory, 300 skilled machinists and in-house embroidery and printing capabilities, we deliver high-quality uniforms at factory-direct prices — with fast turnaround and no compromise on finish.",
  aboutHighlights: ["Own 40,000 sqft factory — no middlemen", "300 skilled machinists", "In-house embroidery & screen printing", "GOTS-certified sustainable fabrics available", "Export to 25+ countries"],

  navItems: [
    { id: "n1", label: "Products", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "Pricing", url: "#pricing" },
    { id: "n4", label: "About", url: "#about" },
    { id: "n5", label: "Order Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Corporate Uniforms", description: "Polo shirts, formal shirts, trousers and blazers with your logo. Available in all fabrics and colours. MOQ 20 pcs.", icon: "👔", iconType: "emoji", price: "From $8/piece", imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "F&B & Hospitality Wear", description: "Chef coats, aprons, server uniforms, housekeeping attire. Stain-resistant and easy-care fabrics standard.", icon: "🧑‍🍳", iconType: "emoji", price: "From $6/piece", imageUrl: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Healthcare & Medical", description: "Scrubs, lab coats, nursing uniforms and dental uniforms. Anti-microbial fabric options available.", icon: "🏥", iconType: "emoji", price: "From $10/piece", imageUrl: "https://images.unsplash.com/photo-1582578598774-a377d4b32223?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Industrial Workwear", description: "High-visibility vests, coveralls, reflective uniforms and PPE-compliant workwear for construction and industrial sites.", icon: "🦺", iconType: "emoji", price: "From $12/piece", imageUrl: "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "School & Sports Uniforms", description: "School uniforms, PE kits, team jerseys and sports apparel. Durable, colourfast and school-board approved.", icon: "🎒", iconType: "emoji", price: "From $5/piece", imageUrl: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Embroidery & Printing", description: "Logo embroidery, screen printing, heat transfer and sublimation printing on any garment. Setup from $50.", icon: "🪡", iconType: "emoji", price: "From $2/piece", imageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "2M+", label: "Garments Produced" },
    { id: uid("st"), value: "25+", label: "Export Countries" },
    { id: uid("st"), value: "18 yr", label: "In Business" },
    { id: uid("st"), value: "300", label: "Skilled Staff" },
  ],

  testimonials: [
    { id: uid("t"), name: "Raj Menon", role: "Procurement Manager", company: "Marriott Hotels, Singapore", content: "We order 2,000 pieces per quarter. Consistent quality, on-time delivery and competitive pricing. UniformPro is our exclusive uniform supplier.", rating: 5 },
    { id: uid("t"), name: "Ahmed Al-Rashid", role: "Operations Director", company: "Al Baik Group, Saudi Arabia", content: "Supplied uniforms for 45 restaurant locations. The quality is excellent and the logo embroidery is flawless. Highly reliable supplier.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Lim Wei Jie", role: "HR Director", company: "Singapore Airlines Catering", content: "Strict quality standards met every order. Fast turnaround, responsive team and the reflective workwear passes all our safety audits.", rating: 5 },
    { id: uid("t"), name: "Nisha Patel", role: "Owner", company: "MedWear Clinic, Malaysia", content: "Custom scrubs with our clinic branding. The antimicrobial fabric is excellent and our staff love wearing them. Repeat customer since 2018.", rating: 5, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80&fit=crop&face" },
  ],

  pricing: [
    { id: uid("p"), name: "Sample Order", price: "From $25/piece", description: "Test before bulk order", features: ["Minimum 1 piece", "Any garment type", "Full customisation", "7–10 day turnaround", "Quality guaranteed"], ctaLabel: "Order Sample", ctaUrl: "#contact" },
    { id: uid("p"), name: "Standard Bulk", price: "From $8/piece", description: "50–499 pieces", features: ["50–499 pieces", "Logo embroidery included", "4 colour options", "21-day production", "Free shipping on 200+"], highlighted: true, badge: "Best Value", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Large Volume", price: "From $5/piece", description: "500+ pieces", features: ["500+ pieces", "Priority production slot", "Full custom design", "Multiple delivery batches", "Dedicated account manager", "14-day rush option"], ctaLabel: "Request Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What is the minimum order quantity?", answer: "Our MOQ is 10 pieces per style/colour for most products. For embroidery or screen printing, we need a minimum of 20 pieces per logo placement." },
    { id: uid("f"), question: "How long does production take?", answer: "Standard orders: 21–28 days from approved sample. Rush orders (500+ pieces): 14 days. Sample orders: 7–10 days." },
    { id: uid("f"), question: "Do you provide samples before bulk orders?", answer: "Yes. We strongly recommend ordering a sample first. The sample fee is credited against your bulk order if you proceed." },
    { id: uid("f"), question: "What countries do you ship to?", answer: "We ship worldwide via DHL, FedEx and sea freight. We have established relationships with freight forwarders for Singapore, Malaysia, UAE, Saudi Arabia and Australia." },
  ],

  team: [
    { id: uid("tm"), name: "Mohammad Karim", role: "Managing Director", bio: "18 years in garment manufacturing. Built UniformPro from 5 machinists to 300 staff and export operations across 25 countries.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Rashida Begum", role: "Head of Design & Sampling", bio: "10 years in fashion and workwear design. Converts client briefs into production-ready tech packs within 48 hours.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Akbar Hossain", role: "Production Manager", bio: "Oversees quality control across all three production lines. ISO-certified process management.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 17: GlassLine (Glass, Aluminium & Shutter Works) ───────────────

const GLASS_LINE: TemplateIdentity = {
  slug: "glass-line",
  name: "GlassLine",
  description: "Sleek glass & aluminium works company. Gunmetal + silver gradient. Full-width product showcase, technical specs, fast quote form.",
  category: "Interior Design",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=85&fit=crop",
  tags: ["glass", "aluminium", "shutters", "glazing", "fabrication"],

  palette: {
    primary: "#0f172a",
    primaryFg: "#ffffff",
    secondary: "#475569",
    accent: "#94a3b8",
    background: "#f1f5f9",
    foreground: "#0f172a",
    muted: "#e2e8f0",
    mutedFg: "#475569",
    card: "#ffffff",
    border: "#cbd5e1",
    ring: "#0f172a",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.015em",
  },
  customCss: `
    .template-glass-line h1,.template-glass-line h2 { font-weight: 700; letter-spacing: -0.015em; }
    .template-glass-line .service-card { border: 1px solid #cbd5e1; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .template-glass-line .service-card:hover { border-color: #475569; box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
    .template-glass-line .stat-value { color: #0f172a; font-weight: 800; }
    .template-glass-line .nav-bar { background: #0f172a; border-bottom: 1px solid #1e293b; }
    .template-glass-line .hero-badge { background: #475569; color: #fff; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
  `,

  variants: {
    hero: "centered-bold",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "navy-row",
    cta: "navy-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=90&fit=crop",
      alt: "Modern glass facade building",
    },
    about: {
      url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&fit=crop",
      alt: "Aluminium window installation",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80&fit=crop", alt: "Glass partition" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", alt: "Aluminium windows" },
      { url: "https://images.unsplash.com/photo-1584585821959-63ecf5013e25?w=600&q=80&fit=crop", alt: "Roller shutters" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80&fit=crop", alt: "Glass door" },
      { url: "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=600&q=80&fit=crop", alt: "Curtain wall" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", alt: "Office glass works" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&fit=crop", alt: "Glass facade" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80&fit=crop", alt: "Frameless glass door" },
      { url: "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800&q=80&fit=crop", alt: "Retail shopfront" },
      { url: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80&fit=crop", alt: "Office partition" },
      { url: "https://images.unsplash.com/photo-1584585821959-63ecf5013e25?w=800&q=80&fit=crop", alt: "Roller shutter installation" },
      { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&fit=crop", alt: "Aluminium sliding windows" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Managing Director" },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face", alt: "Project Engineer" },
      { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face", alt: "Fabrication Head" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80&fit=crop",
      alt: "Get a quotation",
    },
  },

  heroHeadline: "Precision Glass & Aluminium Works",
  heroSubline: "Supply, fabrication and installation of glass partitions, aluminium windows, roller shutters and curtain walls across Singapore.",
  heroBadge: "🔧 BCA Registered Contractor",
  heroCTA: "Get a Free Quote",
  heroSecondaryCTA: "View Projects",
  siteName: "GlassLine Works",
  tagline: "Precision fabrication. Professional installation.",
  phone: "+65 9234 5678",
  email: "quote@glassline.sg",
  address: "25 Defu Lane 10, Singapore 539214",
  aboutHeading: "12 Years of Precision Glass & Aluminium Fabrication",
  aboutBody: "GlassLine is a Singapore-based glass and aluminium specialist with our own fabrication workshop and a team of 25 skilled installers. We work across residential, commercial and industrial sectors — from a single frameless glass door to full curtain wall systems for multi-storey buildings. All our works comply with SS 212 and BCA standards.",
  aboutHighlights: ["BCA registered contractor", "Own fabrication workshop", "SS 212 and BCA compliant works", "1-year installation warranty", "Same-week survey and quotation"],

  navItems: [
    { id: "n1", label: "Products", url: "#services" },
    { id: "n2", label: "Projects", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Get Quote", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Glass Partitions", description: "Frameless, semi-frameless and framed glass partition systems for offices, homes and commercial spaces. Any glass type.", icon: "🪟", iconType: "emoji", price: "From $80/sqft", imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Aluminium Windows & Doors", description: "Casement, sliding, awning and bi-fold aluminium windows and doors. All powder-coat colours available.", icon: "🚪", iconType: "emoji", price: "From $120/panel", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Roller Shutters", description: "Manual and motorised aluminium roller shutters for shops, warehouses, car parks and residential garages.", icon: "🏭", iconType: "emoji", price: "From $800/opening", imageUrl: "https://images.unsplash.com/photo-1584585821959-63ecf5013e25?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Frameless Glass Doors", description: "Tempered and laminated frameless glass doors with floor spring, patch fitting or pivot hinge systems.", icon: "🔲", iconType: "emoji", price: "From $600/door", imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Curtain Wall Systems", description: "Unitised and stick-built aluminium curtain wall systems for high-rise and commercial developments.", icon: "🏙️", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Glass Balustrades", description: "Tempered glass balustrades and handrails for staircases, balconies and pool surrounds. BCA certified.", icon: "🪜", iconType: "emoji", price: "From $150/lm", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "1,200+", label: "Projects Completed" },
    { id: uid("st"), value: "12 yr", label: "In Business" },
    { id: uid("st"), value: "25+", label: "Skilled Installers" },
    { id: uid("st"), value: "4.8★", label: "Client Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Tan Boon Kiat", role: "Project Manager", company: "Ascendas REIT", content: "Contracted GlassLine for office partition works across three floors. Fabrication quality is excellent, installation was fast and clean. Will use again.", rating: 5 },
    { id: uid("t"), name: "Siva Kumar", role: "Interior Designer", company: "SKDesign", content: "My go-to glazing contractor for all client projects. They fabricate precisely to spec, the glass quality is consistently good and pricing is fair.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Mrs. Wong", role: "Homeowner", company: "Bukit Timah", content: "Had frameless glass shower screens and a glass door installed. The finish is immaculate and the team was professional and tidy.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Raymond Foo", role: "F&B Owner", company: "Dempsey Hill", content: "Installed aluminium shopfront and roller shutter for our new restaurant. Done in one day, looks great and the motorised shutter is silent.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Residential", price: "From $80/sqft", description: "Home glass and aluminium works", features: ["All glass types", "Standard aluminium profiles", "1-year installation warranty", "Free site survey", "Same-week start available"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Commercial", price: "From $65/sqft", description: "Offices, retail and F&B", features: ["Volume pricing", "Project manager assigned", "BCA-compliant documentation", "Night/weekend installation", "2-year warranty"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Industrial / Developer", price: "Request Quote", description: "Large-scale projects", features: ["Full curtain wall systems", "Specialist engineering support", "Sub-contractor capability", "Multi-phase delivery", "Performance bond available"], ctaLabel: "Discuss Project", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How quickly can you provide a quotation?", answer: "We conduct a site survey within 2–3 days and provide a detailed written quotation within 24 hours of the survey. Emergency quotations can be turned around same-day." },
    { id: uid("f"), question: "What glass types do you supply?", answer: "We supply clear, tinted, frosted, tempered, laminated, double-glazed (IGU) and smart glass. All glass is sourced from certified manufacturers and meets Singapore SS 212 standards." },
    { id: uid("f"), question: "Do you handle HDB and condo approval submissions?", answer: "Yes. We manage the submission of approval drawings for HDB renovation permits and liaise with MCSTs for condominium projects where required." },
    { id: uid("f"), question: "What warranty do you provide?", answer: "We provide a 1-year workmanship warranty on all installation works. Glass manufacturers' warranties (typically 5–10 years against defects) are passed through to you." },
  ],

  team: [
    { id: uid("tm"), name: "Andy Koh", role: "Managing Director", bio: "12 years in glass and aluminium fabrication. Personally reviews every technical drawing before production starts.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Dennis Tan", role: "Project Engineer", bio: "Structural engineer background. Handles BCA submissions, curtain wall engineering and large commercial tenders.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Amar Singh", role: "Fabrication Workshop Head", bio: "20 years in glass and aluminium fabrication. Leads a team of 12 fabricators ensuring tolerance and quality on every piece.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 18: CoolBreeze (AC / HVAC — Gulf & SG style) ──────────────────

const COOL_BREEZE: TemplateIdentity = {
  slug: "cool-breeze",
  name: "CoolBreeze",
  description: "Premium AC & HVAC contractor. Cool blue & white Gulf-style. Service contracts, installation packages, 24/7 emergency callout.",
  category: "HVAC & Plumbing",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=85&fit=crop",
  tags: ["aircon", "hvac", "ac service", "installation", "gulf", "singapore"],

  palette: {
    primary: "#0284c7",
    primaryFg: "#ffffff",
    secondary: "#1e3a5f",
    accent: "#38bdf8",
    background: "#f0f9ff",
    foreground: "#0c1a2e",
    muted: "#e0f2fe",
    mutedFg: "#0369a1",
    card: "#ffffff",
    border: "#bae6fd",
    ring: "#0284c7",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-cool-breeze { background: #f0f9ff; }
    .template-cool-breeze h1,.template-cool-breeze h2 { color: #0c1a2e; font-weight: 700; }
    .template-cool-breeze .service-card { border: 2px solid #bae6fd; border-radius: 0.5rem; background: #fff; }
    .template-cool-breeze .service-card:hover { border-color: #0284c7; box-shadow: 0 4px 20px rgba(2,132,199,0.15); }
    .template-cool-breeze .stat-value { color: #0284c7; font-weight: 800; }
    .template-cool-breeze .hero-section { background: linear-gradient(135deg, #0c1a2e 0%, #0284c7 100%); }
  `,

  variants: {
    hero: "centered-dark",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1600&q=90&fit=crop",
      alt: "Air conditioning unit installation",
    },
    about: {
      url: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80&fit=crop",
      alt: "HVAC technician at work",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80&fit=crop", alt: "AC installation" },
      { url: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=600&q=80&fit=crop", alt: "AC servicing" },
      { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80&fit=crop", alt: "Ducted system" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", alt: "Chemical wash" },
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop", alt: "Commercial HVAC" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", alt: "Office cooling" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80&fit=crop", alt: "Residential AC system" },
      { url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80&fit=crop", alt: "Ducted installation" },
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop", alt: "Commercial unit" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&fit=crop", alt: "Office HVAC" },
      { url: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80&fit=crop", alt: "Maintenance visit" },
      { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80&fit=crop", alt: "System upgrade" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Lead Technician" },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face", alt: "Installation Engineer" },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face", alt: "Service Manager" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80&fit=crop",
      alt: "Book AC service",
    },
  },

  heroHeadline: "Stay Cool. Stay Comfortable.",
  heroSubline: "Certified AC installation, servicing & maintenance for homes and businesses. 24/7 emergency response.",
  heroBadge: "❄️ BCA & SPRING Certified Technicians",
  heroCTA: "Book a Service",
  heroSecondaryCTA: "View Packages",
  siteName: "CoolBreeze Aircon",
  tagline: "Your comfort is our priority",
  phone: "+65 6789 0123",
  email: "service@coolbreeze.sg",
  address: "45 Ubi Avenue 1, #05-12 Ubi Tech Park, Singapore 408935",
  aboutHeading: "8,000+ Installations. Certified. Trusted.",
  aboutBody: "CoolBreeze has been Singapore's and the Gulf's trusted AC and HVAC partner since 2007. Our team of BCA-certified technicians handles everything from single split-unit installations to full central ducted systems for commercial buildings. We hold service contracts with over 200 corporate clients and respond to emergencies within 2 hours — day or night.",
  aboutHighlights: ["BCA & SPRING Singapore certified technicians", "Authorised installer — Daikin, Mitsubishi, Panasonic", "2-hour emergency response guarantee", "200+ corporate maintenance contracts", "Energy audit & optimisation service"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Packages", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "AC Installation", description: "Supply and install split, multi-split and cassette aircon systems. Daikin, Mitsubishi, Panasonic and LG authorised.", icon: "❄️", iconType: "emoji", price: "From $480/unit", imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "AC Servicing & Maintenance", description: "General servicing, filter cleaning, gas top-up and leak checks. Regular maintenance contracts available.", icon: "🔧", iconType: "emoji", price: "From $40/unit", imageUrl: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Chemical Wash", description: "Deep chemical cleaning to remove mould, bacteria and buildup. Restores cooling efficiency. Fan coil + condenser unit.", icon: "🧪", iconType: "emoji", price: "From $80/unit", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Ducted Central HVAC", description: "Design, supply and installation of central ducted air conditioning for offices, retail, hotels and industrial facilities.", icon: "🏢", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Emergency Repair", description: "24/7 emergency AC repair for all brands. Our technicians carry common parts and can resolve most faults on the first visit.", icon: "🚨", iconType: "emoji", price: "From $120", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Annual Maintenance Contract", description: "Scheduled quarterly servicing, priority emergency response, free parts replacement and one chemical wash per year.", icon: "📋", iconType: "emoji", price: "From $180/unit/yr", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "8,000+", label: "Units Installed" },
    { id: uid("st"), value: "17 yr", label: "In Business" },
    { id: uid("st"), value: "2 hr", label: "Emergency Response" },
    { id: uid("st"), value: "4.9★", label: "Google Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Ravi Chandran", role: "F&B Owner", company: "Tanjong Pagar", content: "Installed 12 cassette units across our restaurant. Done in two days, all running perfectly. CoolBreeze handles our quarterly servicing too — zero downtime in 3 years.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Ahmad Al-Rashid", role: "Property Manager", company: "Marina Bay", content: "Manage HVAC for a 15-storey commercial building. CoolBreeze holds our maintenance contract and their 2-hour emergency response has saved us many times.", rating: 5 },
    { id: uid("t"), name: "Mrs. Lee", role: "Homeowner", company: "Bukit Timah", content: "Three units installed — spotless work, the piping is neat and the quotes were completely transparent. Highly professional team.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Faisal Al-Mansoori", role: "Hotel Operations", company: "Orchard Road", content: "Replaced the entire central HVAC system for our 120-room hotel. On time, within budget, no disruption to guests. Outstanding project management.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Basic Service", price: "From $40/unit", description: "General AC servicing", features: ["Filter & coil cleaning", "Drainage check", "Gas pressure check", "Performance test", "Service report"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Annual Contract", price: "From $180/unit/yr", description: "Full year maintenance — best value", features: ["4 quarterly services", "Priority emergency callout", "1 chemical wash included", "Free minor parts", "Maintenance log & reports"], highlighted: true, badge: "Best Value", ctaLabel: "Get Contract", ctaUrl: "#contact" },
    { id: uid("p"), name: "Commercial Package", price: "Custom Quote", description: "For offices, retail & hospitality", features: ["Tailored service schedule", "Dedicated account manager", "Same-day emergency response", "Energy efficiency reporting", "Multi-unit discounts"], ctaLabel: "Request Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How often should I service my aircon?", answer: "We recommend servicing every 3 months for residential units used daily. Commercial units in high-use environments may require monthly maintenance. Our technician will advise during the first visit." },
    { id: uid("f"), question: "What brands do you service?", answer: "We service all major brands including Daikin, Mitsubishi Electric, Panasonic, LG, Samsung, Midea, Carrier and Fujitsu. We carry a wide range of spare parts for quick repair." },
    { id: uid("f"), question: "Do you offer 24/7 emergency repair?", answer: "Yes. Our emergency line is staffed 24/7. We guarantee a 2-hour response time for contract holders and aim for 4 hours for non-contract emergency calls." },
    { id: uid("f"), question: "What is a chemical wash and when do I need it?", answer: "A chemical wash uses specialised cleaners to deep-clean the evaporator coil, removing mould, bacteria and mineral deposits that general servicing misses. We recommend it once a year or when your unit is cooling poorly or has odours." },
    { id: uid("f"), question: "Do you provide warranty on new installations?", answer: "All new AC installations come with a 1-year workmanship warranty. Manufacturer warranties (typically 5 years for the compressor) are registered on your behalf at no charge." },
  ],

  team: [
    { id: uid("tm"), name: "Eddie Tan", role: "Head of Installations", bio: "BCA-certified engineer with 14 years installing residential and commercial HVAC systems across Singapore.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Suresh Nair", role: "Senior Service Technician", bio: "Authorised Daikin and Mitsubishi technician. Expert in fault diagnosis and gas refrigerant handling.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Lisa Chen", role: "Service Manager", bio: "Coordinates all bookings and emergency callouts. Ensures every client receives a service report within 24 hours.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 19: SparkyPro (Electrical & Plumbing) ──────────────────────────

const SPARKY_PRO: TemplateIdentity = {
  slug: "sparky-pro",
  name: "SparkyPro",
  description: "Bold electrical & plumbing contractor. Safety-yellow & dark. Emergency services, certifications, residential & commercial works.",
  category: "HVAC & Plumbing",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=85&fit=crop",
  tags: ["electrical", "plumbing", "contractor", "wiring", "pipes", "singapore", "ae"],

  palette: {
    primary: "#ca8a04",
    primaryFg: "#000000",
    secondary: "#1c1917",
    accent: "#fbbf24",
    background: "#ffffff",
    foreground: "#1c1917",
    muted: "#fefce8",
    mutedFg: "#713f12",
    card: "#ffffff",
    border: "#fde68a",
    ring: "#ca8a04",
    borderRadius: "0.375rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-sparky-pro h1,.template-sparky-pro h2 { font-weight: 800; color: #1c1917; }
    .template-sparky-pro .hero-section { background: #1c1917; color: #fff; }
    .template-sparky-pro .service-card { border-left: 4px solid #ca8a04; }
    .template-sparky-pro .stat-value { color: #ca8a04; font-weight: 800; }
    .template-sparky-pro .badge { background: #ca8a04; color: #000; font-weight: 700; }
  `,

  variants: {
    hero: "centered-dark",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600&q=90&fit=crop",
      alt: "Electrician at work",
    },
    about: {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop",
      alt: "Electrical panel installation",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", alt: "Electrical wiring" },
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop", alt: "DB box installation" },
      { url: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=600&q=80&fit=crop", alt: "Plumbing repair" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", alt: "Pipe installation" },
      { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&fit=crop", alt: "Lighting installation" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", alt: "Commercial works" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80&fit=crop", alt: "Wiring project" },
      { url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop", alt: "Distribution board" },
      { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80&fit=crop", alt: "LED lighting" },
      { url: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800&q=80&fit=crop", alt: "Plumbing upgrade" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop", alt: "Pipe replacement" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&fit=crop", alt: "Commercial fitout" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Master Electrician" },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face", alt: "Lead Plumber" },
      { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face", alt: "Operations Lead" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80&fit=crop",
      alt: "Call SparkyPro",
    },
  },

  heroHeadline: "Certified. Reliable. On Call 24/7.",
  heroSubline: "Licensed electricians and plumbers for residential and commercial works. Emergency response in under 60 minutes.",
  heroBadge: "⚡ EMA Licensed Electrical Worker",
  heroCTA: "Call Now",
  heroSecondaryCTA: "Get a Quote",
  siteName: "SparkyPro Electrical & Plumbing",
  tagline: "Certified trades. Every job guaranteed.",
  phone: "+65 9000 1234",
  email: "jobs@sparkypro.sg",
  address: "Serving all areas across Singapore",
  aboutHeading: "Licensed. Insured. 10,000+ Jobs Done.",
  aboutBody: "SparkyPro brings together Singapore's most experienced licensed electricians and plumbers under one roof. Whether it's a tripped breaker at midnight, a new bathroom fitout or a complete commercial rewire, our EMA-licensed and PUB-certified tradespeople deliver safe, code-compliant work every time. We guarantee our workmanship for 12 months.",
  aboutHighlights: ["EMA Licensed Electrical Worker (LEW)", "PUB licensed plumbing contractor", "60-minute emergency response", "All works under BCA and SS wiring standards", "12-month workmanship guarantee"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Call Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Electrical Wiring & Rewiring", description: "New wiring, partial rewiring and full house rewiring to SS 638 standards. All work certified by our Licensed Electrical Worker.", icon: "⚡", iconType: "emoji", price: "From $150", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "DB Box Upgrade & Installation", description: "Replace old fuse boards with modern MCB distribution boards. Includes earth leakage protection and surge protection.", icon: "🔌", iconType: "emoji", price: "From $380", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Lighting Installation", description: "LED downlights, track lighting, pendant lights and smart lighting systems. Residential and commercial.", icon: "💡", iconType: "emoji", price: "From $25/point", imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Plumbing Repair & Installation", description: "Tap, toilet, sink, shower and water heater repairs and replacements. New bathroom plumbing supply and drainage.", icon: "🔩", iconType: "emoji", price: "From $80", imageUrl: "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Pipe Replacement & Upgrade", description: "Replace ageing galvanised pipes with modern PEX or CPVC piping. Reduce water pressure loss and prevent leaks.", icon: "🪛", iconType: "emoji", price: "From $200", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial & Industrial Works", description: "Complete electrical and M&E services for offices, retail, F&B and industrial units. BCA submissions handled.", icon: "🏭", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "10,000+", label: "Jobs Completed" },
    { id: uid("st"), value: "12 yr", label: "In Business" },
    { id: uid("st"), value: "60 min", label: "Emergency Response" },
    { id: uid("st"), value: "4.9★", label: "Google Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "David Koh", role: "Property Owner", company: "Jurong West", content: "Tripped breaker at 11pm. SparkyPro had a technician at my door in 45 minutes. Fixed and certified within an hour. Incredible service.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Rashid Al-Farsi", role: "Retail Shop Owner", company: "Bugis", content: "Full electrical rewire and LED upgrade for my 3,000 sqft shop. Done over a weekend with zero disruption to business on Monday. Professional and clean.", rating: 5 },
    { id: uid("t"), name: "Mrs. Tan", role: "Homeowner", company: "Serangoon", content: "Had a burst pipe on a Sunday morning. SparkyPro came within the hour and fixed everything. They even patched the wall. Lifesavers.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "James Ng", role: "Office Manager", company: "One Raffles Place", content: "Manage a 4,000 sqft office. SparkyPro handles all our electrical maintenance. Reliable, well-priced and always on time.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Residential", price: "From $80/job", description: "Home electrical & plumbing repairs", features: ["All common repairs", "Licensed tradesperson", "Transparent pricing", "Same-day available", "12-month warranty"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Renovation Works", price: "From $150", description: "New wiring, points & plumbing", features: ["Full new installations", "EMA/PUB certified work", "BCA-compliant drawings", "Test & inspection cert", "1-year workmanship guarantee"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Commercial Contract", price: "Custom Quote", description: "Ongoing maintenance for businesses", features: ["Scheduled maintenance visits", "Priority emergency callout", "Dedicated account manager", "Compliance documentation", "Multi-unit discounts"], ctaLabel: "Enquire Now", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Are your electricians EMA licensed?", answer: "Yes. All electrical works are performed or supervised by our EMA-licensed Electrical Workers (LEW). We issue a Certificate of Electrical Installation after every new installation or rewiring job." },
    { id: uid("f"), question: "How quickly can you respond to emergencies?", answer: "We target a 60-minute response for emergencies in Singapore. Our technicians are on standby 24/7 and carry common parts for immediate repair." },
    { id: uid("f"), question: "Do you handle HDB and condo electrical works?", answer: "Yes. We are experienced with HDB renovation permit requirements and coordinate approvals with town councils and MCSTs for condo projects." },
    { id: uid("f"), question: "What warranty do you provide?", answer: "We provide a 12-month workmanship warranty on all completed works. Any fault arising from our workmanship within that period is rectified at no charge." },
  ],

  team: [
    { id: uid("tm"), name: "Ben Lim", role: "Master Electrician (LEW)", bio: "EMA Licensed Electrical Worker with 16 years of experience in residential, commercial and industrial electrical works.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Hafiz Osman", role: "Lead Plumber", bio: "PUB licensed plumber specialising in bathroom renovations, water supply and drainage system upgrades.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Raymond Goh", role: "Operations Manager", bio: "Coordinates all emergency callouts and scheduled jobs. Ensures every technician arrives on time with the right parts.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 20: FreshWash (Laundry & Dry Cleaning) ────────────────────────

const FRESH_WASH: TemplateIdentity = {
  slug: "fresh-wash",
  name: "FreshWash",
  description: "Modern laundry & dry cleaning service. Clean white + teal. Online booking, price list, home pickup & delivery, express service.",
  category: "Cleaning",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=1200&q=85&fit=crop",
  tags: ["laundry", "dry cleaning", "pickup", "delivery", "ironing"],

  palette: {
    primary: "#0d9488",
    primaryFg: "#ffffff",
    secondary: "#06b6d4",
    accent: "#2dd4bf",
    background: "#f0fdfa",
    foreground: "#134e4a",
    muted: "#ccfbf1",
    mutedFg: "#0f766e",
    card: "#ffffff",
    border: "#99f6e4",
    ring: "#0d9488",
    borderRadius: "0.75rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.015em",
  },
  customCss: `
    .template-fresh-wash { background: #f0fdfa; }
    .template-fresh-wash h1,.template-fresh-wash h2 { color: #134e4a; font-weight: 700; }
    .template-fresh-wash .service-card { background: #fff; border: 1px solid #99f6e4; border-radius: 0.75rem; }
    .template-fresh-wash .service-card:hover { border-color: #0d9488; box-shadow: 0 4px 20px rgba(13,148,136,0.12); }
    .template-fresh-wash .stat-value { color: #0d9488; }
    .template-fresh-wash .cta-section { background: linear-gradient(135deg, #0d9488, #06b6d4); color: #fff; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=1600&q=90&fit=crop",
      alt: "Laundry service",
    },
    about: {
      url: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80&fit=crop",
      alt: "Professional laundry facility",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&q=80&fit=crop", alt: "Laundry wash & fold" },
      { url: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&q=80&fit=crop", alt: "Dry cleaning" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", alt: "Ironing service" },
      { url: "https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=600&q=80&fit=crop", alt: "Shoe cleaning" },
      { url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80&fit=crop", alt: "Curtain cleaning" },
      { url: "https://images.unsplash.com/photo-1503264116251-35a269479413?w=600&q=80&fit=crop", alt: "Bedding & linen" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80&fit=crop", alt: "Laundry facility" },
      { url: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80&fit=crop", alt: "Dry cleaning racks" },
      { url: "https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=800&q=80&fit=crop", alt: "Sneaker cleaning" },
      { url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80&fit=crop", alt: "Delivery service" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Head of Operations" },
      { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&fit=crop&face", alt: "Customer Service" },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face", alt: "Delivery Manager" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=1200&q=80&fit=crop",
      alt: "Schedule pickup",
    },
  },

  heroHeadline: "Fresh Clothes. Zero Hassle.",
  heroSubline: "Professional laundry, dry cleaning and ironing service with free home pickup and delivery. Ready in 24 hours.",
  heroBadge: "🚚 Free Pickup & Delivery",
  heroCTA: "Schedule Pickup",
  heroSecondaryCTA: "View Prices",
  siteName: "FreshWash Laundry",
  tagline: "Clean clothes delivered to your door",
  phone: "+65 8123 4567",
  email: "hello@freshwash.sg",
  address: "Serving all areas across Singapore",
  aboutHeading: "30,000+ Satisfied Customers. Trusted Since 2014.",
  aboutBody: "FreshWash is Singapore's most convenient laundry and dry cleaning service. We collect your clothes, clean them with professional-grade machines and premium detergents, and deliver them fresh and folded back to your door — all within 24 to 48 hours. Our specialist dry cleaning team handles everything from delicate silks to business suits, curtains and wedding gowns.",
  aboutHighlights: ["Free pickup & delivery with every order", "24–48 hour standard turnaround", "Express 12-hour service available", "Eco-friendly, skin-safe detergents", "Specialist dry cleaning for delicates"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Schedule Pickup", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Wash & Fold", description: "Machine wash, tumble dry and neatly folded. Sorted by colour and fabric type. Eco-friendly detergent included.", icon: "👕", iconType: "emoji", price: "From $1.80/kg", imageUrl: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Dry Cleaning", description: "Specialist solvent cleaning for suits, dresses, delicates, leather and formal wear. Pressed and covered.", icon: "🥼", iconType: "emoji", price: "From $8/item", imageUrl: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Ironing & Pressing", description: "Professional steam ironing for shirts, pants, dresses and uniforms. Crisp results every time.", icon: "👔", iconType: "emoji", price: "From $1.50/item", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Sneaker & Shoe Cleaning", description: "Deep clean, deodorising and re-whitening for all sneaker types. Canvas, leather and mesh. Sole restoration included.", icon: "👟", iconType: "emoji", price: "From $18/pair", imageUrl: "https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Curtain & Linen Cleaning", description: "Full curtain cleaning and rehang service. Duvets, pillows, mattress covers and all bed linen accepted.", icon: "🛏️", iconType: "emoji", price: "From $12/panel", imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Express Service", description: "12-hour turnaround for urgent items. Available 7 days. Priority cleaning and delivery. Perfect for last-minute needs.", icon: "⚡", iconType: "emoji", price: "+50% on standard rate", imageUrl: "https://images.unsplash.com/photo-1503264116251-35a269479413?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "30,000+", label: "Happy Customers" },
    { id: uid("st"), value: "10 yr", label: "In Business" },
    { id: uid("st"), value: "24 hr", label: "Standard Turnaround" },
    { id: uid("st"), value: "4.8★", label: "Google Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Chloe Ng", role: "Working Professional", company: "CBD", content: "I schedule a pickup every two weeks. They collect Sunday morning and deliver Monday evening — perfectly cleaned and folded. Makes my week so much easier.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Mr. Krishnamurthy", role: "Hotel F&B Manager", company: "Sentosa", content: "We use FreshWash for all our table linen and staff uniforms. Consistent quality, reliable schedule, and they handle our volume without issues.", rating: 5 },
    { id: uid("t"), name: "Sofia Chen", role: "Homeowner", company: "Clementi", content: "Sent my wedding gown and three suits for dry cleaning. All returned in perfect condition with individual covers. Will only use FreshWash from now on.", rating: 5, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Ali Hassan", role: "Expat", company: "Buona Vista", content: "As someone who travels frequently for work, having FreshWash handle my suits has been a game-changer. Pickup and delivery around my schedule, always perfect.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Pay As You Go", price: "From $1.80/kg", description: "No commitment, pay per order", features: ["Wash & fold by weight", "Dry cleaning per item", "Free pickup & delivery", "48-hour turnaround", "No minimum order"], ctaLabel: "Schedule Pickup", ctaUrl: "#contact" },
    { id: uid("p"), name: "Monthly Plan", price: "From $49/month", description: "Best for regular laundry needs", features: ["20kg wash & fold included", "2 free dry cleaning items", "Priority scheduling", "Dedicated account manager", "10% off express service"], highlighted: true, badge: "Best Value", ctaLabel: "Subscribe Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Business Account", price: "Custom Quote", description: "For hotels, restaurants & offices", features: ["High-volume processing", "Fixed weekly collections", "Priority turnaround", "Itemised billing", "Account manager & reporting"], ctaLabel: "Get Business Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How does pickup and delivery work?", answer: "Schedule a pickup via our website or WhatsApp. We collect your laundry in our provided bag, clean it at our facility, and deliver it back within 24–48 hours. All at no extra charge." },
    { id: uid("f"), question: "What items can you dry clean?", answer: "We dry clean suits, dresses, sarees, leather jackets, formal wear, delicate fabrics (silk, wool, cashmere), wedding gowns, curtains and most household textiles. If in doubt, contact us." },
    { id: uid("f"), question: "Do you offer express same-day service?", answer: "Yes. Our express 12-hour service is available 7 days a week for an additional 50% on the standard rate. Collect before 10am for delivery by 10pm." },
    { id: uid("f"), question: "What if an item is damaged?", answer: "We take great care with every item. In the unlikely event of damage, we have a full insurance policy and will compensate based on the item's value and condition. Our team will contact you immediately." },
  ],

  team: [
    { id: uid("tm"), name: "Tracy Lim", role: "Head of Operations", bio: "10 years in commercial laundry. Runs our facility team of 20 and ensures every order meets our quality standards before dispatch.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Amy Tan", role: "Customer Service Manager", bio: "Handles all client enquiries and ensures every pickup and delivery runs to schedule. Your go-to person for anything FreshWash.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Daniel Wong", role: "Delivery Operations", bio: "Manages our fleet of 8 delivery riders and ensures every order arrives on time in pristine condition.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 21: CurtainStudio (Curtains, Blinds & Soft Furnishings) ────────

const CURTAIN_STUDIO: TemplateIdentity = {
  slug: "curtain-studio",
  name: "CurtainStudio",
  description: "Elegant curtains, blinds & soft furnishings showroom. Warm neutrals + gold. Product gallery, free measuring, home consultation.",
  category: "Interior Design",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85&fit=crop",
  tags: ["curtains", "blinds", "furnishings", "drapes", "interior", "singapore", "my"],

  palette: {
    primary: "#b45309",
    primaryFg: "#ffffff",
    secondary: "#44403c",
    accent: "#d97706",
    background: "#fafaf9",
    foreground: "#1c1917",
    muted: "#f5f5f4",
    mutedFg: "#57534e",
    card: "#ffffff",
    border: "#e7e5e4",
    ring: "#b45309",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Georgia",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "0em",
  },
  customCss: `
    .template-curtain-studio h1,.template-curtain-studio h2 { font-family: Georgia, serif; font-weight: 700; color: #1c1917; }
    .template-curtain-studio .service-card { border: 1px solid #e7e5e4; border-top: 3px solid #b45309; }
    .template-curtain-studio .service-card:hover { box-shadow: 0 8px 32px rgba(180,83,9,0.10); }
    .template-curtain-studio .stat-value { color: #b45309; }
    .template-curtain-studio .hero-section { background: linear-gradient(135deg, #451a03 0%, #92400e 100%); }
    .template-curtain-studio .cta-section { background: linear-gradient(90deg, #b45309, #d97706); color: #fff; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=90&fit=crop",
      alt: "Beautiful curtains in a living room",
    },
    about: {
      url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop",
      alt: "Showroom interior",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", alt: "Curtains" },
      { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&fit=crop", alt: "Roman blinds" },
      { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80&fit=crop", alt: "Roller blinds" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", alt: "Motorised blinds" },
      { url: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80&fit=crop", alt: "Carpets & rugs" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80&fit=crop", alt: "Upholstery" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop", alt: "Living room curtains" },
      { url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&fit=crop", alt: "Bedroom drapes" },
      { url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80&fit=crop", alt: "Office blinds" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&fit=crop", alt: "Hotel curtaining" },
      { url: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&q=80&fit=crop", alt: "Show flat styling" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80&fit=crop", alt: "Dining room" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face", alt: "Interior Consultant" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Fabric Specialist" },
      { url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&fit=crop&face", alt: "Installation Lead" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&fit=crop",
      alt: "Book free home consultation",
    },
  },

  heroHeadline: "Window Treatments That Transform Spaces",
  heroSubline: "Custom curtains, blinds and soft furnishings for homes, offices and hospitality. Free home measuring and consultation.",
  heroBadge: "🏠 Free Home Consultation",
  heroCTA: "Book Free Consultation",
  heroSecondaryCTA: "Browse Collection",
  siteName: "CurtainStudio",
  tagline: "Beautifully dressed windows since 2008",
  phone: "+65 8800 9988",
  email: "hello@curtainstudio.sg",
  address: "12 Joo Chiat Road, #01-04, Singapore 427348",
  aboutHeading: "5,000+ Homes & Offices Transformed",
  aboutBody: "CurtainStudio has been creating bespoke window treatments and soft furnishings for Singapore homes, offices and hospitality spaces since 2008. Our team of interior consultants and master curtain makers work with an exclusive fabric collection of over 2,000 materials sourced from Europe, Japan and Korea. Every piece is custom-made at our local workshop and installed by our professional fitters.",
  aboutHighlights: ["2,000+ exclusive fabric selections", "Own workshop — all custom made locally", "Free home measuring & colour consultation", "5,000+ residential & commercial projects", "Motorised and smart blind systems available"],

  navItems: [
    { id: "n1", label: "Products", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Pricing", url: "#pricing" },
    { id: "n5", label: "Book Consultation", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Curtains & Drapes", description: "Eyelet, pinch pleat, wave and tab-top curtains in sheer, semi-sheer and blackout fabrics. Custom lengths and widths.", icon: "🪟", iconType: "emoji", price: "From $80/panel", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Roman & Roller Blinds", description: "Clean, contemporary window covering in hundreds of fabrics — daylight, blackout, moisture-resistant and fire-retardant options.", icon: "🔲", iconType: "emoji", price: "From $120/window", imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Motorised & Smart Blinds", description: "App-controlled, voice-activated or scene-triggered motorised blinds. Compatible with Google Home, Alexa and KNX.", icon: "📱", iconType: "emoji", price: "From $280/window", imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial & Hospitality", description: "High-volume supply and installation for hotels, offices, showrooms and serviced apartments. Contract pricing available.", icon: "🏨", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Carpets & Rugs", description: "Broadloom carpets, carpet tiles and handmade rugs for residential and commercial spaces. Custom sizes and colours.", icon: "🪵", iconType: "emoji", price: "From $5/sqft", imageUrl: "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Upholstery & Soft Furnishings", description: "Sofa reupholstery, cushion covers, headboards and custom fabric accessories. Any fabric from our collection.", icon: "🛋️", iconType: "emoji", price: "From $150/piece", imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "5,000+", label: "Projects Completed" },
    { id: uid("st"), value: "16 yr", label: "In Business" },
    { id: uid("st"), value: "2,000+", label: "Fabric Choices" },
    { id: uid("st"), value: "4.9★", label: "Client Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Grace Koh", role: "Homeowner", company: "Holland Village", content: "Dressed 14 windows in my new condo. Their consultant came, advised on fabrics for each room, and the result is magazine-worthy. The motorised blinds are a dream.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "James Tan", role: "Interior Designer", company: "JT Interiors", content: "CurtainStudio is my go-to for every client project. Their fabric range, quality and installation consistency is unmatched. No other supplier comes close.", rating: 5 },
    { id: uid("t"), name: "Mrs. Sharma", role: "Homeowner", company: "Bishan", content: "Beautifully made curtains delivered and installed in 10 days. The measuring service meant everything fitted perfectly. Absolutely no complaints.", rating: 5, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Ahmad Raza", role: "Hotel GM", company: "Sentosa Cove", content: "Fitted 80 hotel rooms with motorised blackout blinds. Perfectly programmed, looks premium and the installation team was immaculate. Highly recommended.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Residential", price: "From $80/panel", description: "Custom curtains & blinds for home", features: ["Free home measuring", "2,000+ fabric choices", "Custom made locally", "Professional installation", "1-year warranty"], ctaLabel: "Book Consultation", ctaUrl: "#contact" },
    { id: uid("p"), name: "Smart Home Package", price: "From $280/window", description: "Motorised & app-controlled blinds", features: ["Motorised roller/roman blinds", "App & voice control", "Scene programming", "Smart home integration", "5-year motor warranty"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Commercial", price: "Custom Quote", description: "For hotels, offices & retail", features: ["Volume pricing", "Project manager", "Phased installation", "Commercial-grade fabrics", "Dedicated account manager"], ctaLabel: "Request Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Is the home measuring service really free?", answer: "Yes, completely free with no obligation. Our consultant visits your home, takes accurate measurements, advises on fabric choices and provides a written quotation — all at no charge." },
    { id: uid("f"), question: "How long does it take from order to installation?", answer: "Standard lead time is 10–14 working days from order confirmation. Express orders (7 working days) are available for an additional charge depending on fabric availability." },
    { id: uid("f"), question: "Do you do motorised blinds?", answer: "Yes. We offer a full range of motorised roller, roman and venetian blinds with remote control, smartphone app, voice control (Alexa/Google) and KNX smart home integration." },
    { id: uid("f"), question: "Can you clean or alter existing curtains?", answer: "Yes. We offer a repair, alteration and relining service for curtains purchased elsewhere. Bring your curtains to our showroom for assessment and a quote." },
  ],

  team: [
    { id: uid("tm"), name: "Vanessa Ong", role: "Senior Interior Consultant", bio: "16 years in soft furnishings and interior styling. Has dressed over 1,000 homes and hospitality projects across Singapore.", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Mei Lin", role: "Fabric & Design Specialist", bio: "Trained in textile design in Japan. Curates our fabric collection and advises on colour combinations and light control.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Shirley Ho", role: "Head of Installation", bio: "Leads our team of 8 professional fitters. Ensures every installation is precise, clean and delivered to spec.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 22: TradeSupply (B2B Trading & Wholesale) ──────────────────────

const TRADE_SUPPLY: TemplateIdentity = {
  slug: "trade-supply",
  name: "TradeSupply",
  description: "B2B trading & wholesale supplier. Corporate navy & orange. Product catalogue, bulk enquiry, brand partnerships, global sourcing.",
  category: "General Business",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=85&fit=crop",
  tags: ["trading", "wholesale", "supply", "b2b", "import", "export", "bd", "ae"],

  palette: {
    primary: "#1e3a5f",
    primaryFg: "#ffffff",
    secondary: "#ea580c",
    accent: "#f97316",
    background: "#f8fafc",
    foreground: "#0f172a",
    muted: "#f1f5f9",
    mutedFg: "#475569",
    card: "#ffffff",
    border: "#e2e8f0",
    ring: "#1e3a5f",
    borderRadius: "0.375rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-trade-supply h1,.template-trade-supply h2 { color: #0f172a; font-weight: 700; }
    .template-trade-supply .hero-section { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); }
    .template-trade-supply .service-card { border: 1px solid #e2e8f0; border-top: 3px solid #ea580c; }
    .template-trade-supply .service-card:hover { box-shadow: 0 4px 24px rgba(30,58,95,0.12); }
    .template-trade-supply .stat-value { color: #ea580c; font-weight: 800; }
    .template-trade-supply .cta-btn { background: #ea580c; color: #fff; }
    .template-trade-supply .cta-btn:hover { background: #c2410c; }
  `,

  variants: {
    hero: "centered-dark",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=90&fit=crop",
      alt: "Warehouse and supply chain",
    },
    about: {
      url: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80&fit=crop",
      alt: "Global trading operations",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&fit=crop", alt: "Wholesale supply" },
      { url: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80&fit=crop", alt: "Import & export" },
      { url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80&fit=crop", alt: "Product sourcing" },
      { url: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=600&q=80&fit=crop", alt: "Logistics & freight" },
      { url: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&q=80&fit=crop", alt: "Quality control" },
      { url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&fit=crop", alt: "Brand distribution" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80&fit=crop", alt: "Warehouse operations" },
      { url: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80&fit=crop", alt: "Container loading" },
      { url: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80&fit=crop", alt: "Product catalogue" },
      { url: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80&fit=crop", alt: "Port operations" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80&fit=crop&face", alt: "CEO" },
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Trade Director" },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face", alt: "Logistics Manager" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80&fit=crop",
      alt: "Submit trade enquiry",
    },
  },

  heroHeadline: "Sourced Globally. Delivered Locally.",
  heroSubline: "Trusted wholesale trading and supply partner for businesses across Asia and the Gulf. Competitive pricing, reliable logistics, 20+ years experience.",
  heroBadge: "🌏 ISO 9001 Certified Trading Company",
  heroCTA: "Submit Enquiry",
  heroSecondaryCTA: "View Catalogue",
  siteName: "TradeSupply International",
  tagline: "Your global supply chain partner",
  phone: "+971 4 234 5678",
  email: "trade@tradesupply.ae",
  address: "Jebel Ali Free Zone, Dubai, UAE",
  aboutHeading: "20 Years. 50+ Countries. 1,000+ Products.",
  aboutBody: "TradeSupply International is a full-service wholesale trading and distribution company headquartered in Dubai's Jebel Ali Free Zone, with offices in Dhaka, Singapore and Kuala Lumpur. We source, import, warehouse and distribute goods across 50+ countries — from consumer products and building materials to garments, chemicals and food commodities. Our network of verified manufacturers ensures competitive pricing without compromising quality.",
  aboutHighlights: ["ISO 9001:2015 certified", "50+ countries served", "Offices in UAE, BD, SG, MY", "1,000+ product categories", "Letters of credit & trade finance available"],

  navItems: [
    { id: "n1", label: "Products", url: "#services" },
    { id: "n2", label: "About", url: "#about" },
    { id: "n3", label: "Partners", url: "#testimonials" },
    { id: "n4", label: "FAQ", url: "#faq" },
    { id: "n5", label: "Enquire Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Wholesale Supply", description: "Bulk supply of consumer goods, building materials, chemicals, food commodities and industrial products. MOQ-based pricing.", icon: "📦", iconType: "emoji", price: "MOQ Pricing", imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Import & Export", description: "Full import/export documentation, customs clearance and compliance for cross-border trade between Asia and the Middle East.", icon: "🚢", iconType: "emoji", price: "Contact for Rates", imageUrl: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Global Sourcing", description: "Manufacturer identification, factory audits, sample management and production oversight in Bangladesh, India, China and Vietnam.", icon: "🌏", iconType: "emoji", price: "From 3% of order value", imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Freight & Logistics", description: "FCL and LCL ocean freight, air freight, inland trucking and last-mile delivery across GCC, South Asia and Southeast Asia.", icon: "✈️", iconType: "emoji", price: "Quote on enquiry", imageUrl: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Quality Control & Inspection", description: "Pre-shipment inspection, in-line QC and lab testing through our network of certified inspection companies.", icon: "✅", iconType: "emoji", price: "From $250/inspection", imageUrl: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Brand Distribution", description: "Exclusive and non-exclusive distribution agreements for brands entering GCC, ASEAN and South Asian markets.", icon: "🤝", iconType: "emoji", price: "Partnership basis", imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "20 yr", label: "In Business" },
    { id: uid("st"), value: "50+", label: "Countries Served" },
    { id: uid("st"), value: "1,000+", label: "Product Lines" },
    { id: uid("st"), value: "$50M+", label: "Annual Trade Volume" },
  ],

  testimonials: [
    { id: uid("t"), name: "Khalid Al-Mansouri", role: "Procurement Director", company: "Dubai", content: "TradeSupply has been our preferred sourcing partner for 8 years. Competitive pricing, reliable quality and they handle everything from factory to our warehouse. Highly recommend.", rating: 5 },
    { id: uid("t"), name: "Rashida Begum", role: "Managing Director", company: "Dhaka", content: "We source all our building materials through TradeSupply. Their inspection service caught several quality issues before shipment — saved us significant costs.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Ahmad bin Hassan", role: "Import Manager", company: "Kuala Lumpur", content: "Their team arranged factory visits, handled all documentation and shipped 40ft containers to KL on time. Prices were 15% lower than our previous supplier.", rating: 5 },
    { id: uid("t"), name: "Chen Wei", role: "Operations Manager", company: "Singapore", content: "Distributing our brand into the Gulf through TradeSupply was seamless. They know the market, have the relationships, and deliver results.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Spot Order", price: "MOQ Pricing", description: "One-time bulk purchase", features: ["No long-term commitment", "Competitive spot pricing", "Standard lead time", "Quality inspection option", "LC / TT payment accepted"], ctaLabel: "Submit Enquiry", ctaUrl: "#contact" },
    { id: uid("p"), name: "Regular Supply Contract", price: "Volume Pricing", description: "Ongoing supply arrangements", features: ["Guaranteed pricing for 6–12 months", "Priority production allocation", "Dedicated account manager", "Monthly delivery schedule", "Trade credit available"], highlighted: true, badge: "Most Popular", ctaLabel: "Discuss Contract", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Distribution Partnership", price: "Custom Terms", description: "Exclusive market distribution", features: ["Exclusive or non-exclusive rights", "Marketing support provided", "In-market sales team access", "Co-branded materials", "Revenue share or margin model"], ctaLabel: "Explore Partnership", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What is your minimum order quantity (MOQ)?", answer: "MOQ varies by product category. For most fast-moving consumer goods, MOQ is 500–1,000 units or one 20ft container. Building materials and commodities are priced per metric tonne. Contact us for specific product MOQs." },
    { id: uid("f"), question: "What payment terms do you accept?", answer: "We accept Letters of Credit (LC at sight and usance), Telegraphic Transfer (TT), and for established clients, we offer open account terms with credit insurance. Trade finance arrangements can also be structured." },
    { id: uid("f"), question: "How do you ensure product quality?", answer: "We conduct factory audits before onboarding any supplier. For each shipment, we offer pre-shipment inspection through third-party agencies (SGS, Bureau Veritas, Intertek). Lab testing is available on request." },
    { id: uid("f"), question: "Which countries do you ship to?", answer: "We primarily serve GCC countries (UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain), South Asia (Bangladesh, India, Sri Lanka) and Southeast Asia (Singapore, Malaysia, Indonesia, Thailand). Other destinations on request." },
    { id: uid("f"), question: "Can you help with customs clearance?", answer: "Yes. Our in-house trade documentation team prepares all export documentation. We work with licensed customs brokers in all major markets for import clearance and can manage door-to-door delivery." },
  ],

  team: [
    { id: uid("tm"), name: "Mohammed Al-Farsi", role: "CEO & Founder", bio: "20 years in international trade. Built TradeSupply from a single-office operation to a multi-country trading group with offices in 4 countries.", avatar: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "James Tan", role: "Trade Director, Asia", bio: "Based in Singapore. Manages sourcing relationships across Bangladesh, India, China and Vietnam and oversees ASEAN distribution.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Rahul Sharma", role: "Logistics & Operations Manager", bio: "10 years in freight forwarding. Manages our logistics network across 50+ countries and coordinates all shipment documentation.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face" },
  ],
};

// ── Batch 3: ShieldGuard ──────────────────────────────────────────────────────

const SHIELD_GUARD: TemplateIdentity = {
  slug: "shield-guard",
  name: "ShieldGuard",
  description: "Professional security services. Dark charcoal + red. Guard services, CCTV, patrol, licensing badges.",
  category: "General Business",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=80&fit=crop",
  tags: ["security", "guarding", "cctv", "patrol", "singapore"],
  palette: {
    primary: "#0f172a",
    primaryFg: "#ffffff",
    secondary: "#7f1d1d",
    accent: "#dc2626",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#f1f5f9",
    mutedFg: "#475569",
    card: "#ffffff",
    border: "#e2e8f0",
    ring: "#dc2626",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  variants: {
    hero: "bold-dark",
    services: "big-cards",
    testimonials: "cards",
    features: "grid",
    stats: "dark-band",
    cta: "banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },
  images: {
    hero: { url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&q=80&fit=crop", alt: "Security guard on patrol" },
    services: [
      { url: "https://images.unsplash.com/photo-1590935217281-8f102120d683?w=600&q=80&fit=crop", alt: "CCTV surveillance" },
      { url: "https://images.unsplash.com/photo-1503596476-1c12a8ba09a9?w=600&q=80&fit=crop", alt: "Security officer" },
      { url: "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=600&q=80&fit=crop", alt: "Access control" },
    ],
    gallery: [],
    team: [],
  },
  heroHeadline: "Protecting People. Securing Premises.",
  heroSubline: "Licensed security solutions for corporate, residential & events. 24/7 operations.",
  heroCTA: "Request a Guard",
  heroSecondaryCTA: "Get a Quote",
  siteName: "ShieldGuard Security",
  tagline: "Trusted Security. Round the Clock.",
  phone: "+65 6789 1234",
  email: "ops@shieldguard.sg",
  address: "10 Tuas South Street, Singapore 637000",
  aboutHeading: "Singapore's Most Trusted Security Partner Since 2012",
  aboutBody: "ShieldGuard is an MOM-licensed security agency providing guard, surveillance and access control to over 350 sites across Singapore. Our SPF-certified officers are backed by a 24/7 operations control room.",
  aboutHighlights: ["MOM licensed agency", "SPF-certified officers", "ISO 9001:2015 certified", "24/7 operations", "350+ secured sites"],
  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Why Us", url: "#about" },
    { id: "n3", label: "Pricing", url: "#pricing" },
    { id: "n4", label: "FAQ", url: "#faq" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],
  stats: [
    { id: uid("st"), value: "200+", label: "Guards Deployed" },
    { id: uid("st"), value: "350+", label: "Sites Secured" },
    { id: uid("st"), value: "24/7", label: "Operations" },
    { id: uid("st"), value: "12 yr", label: "In Business" },
  ],
  services: [
    { id: uid("svc"), title: "Uniformed Guard Services", description: "Trained, uniformed officers for commercial, industrial and residential sites.", icon: "🛡️", iconType: "emoji", price: "From $18/hr" },
    { id: uid("svc"), title: "CCTV & Surveillance", description: "IP-based CCTV installation, monitoring and remote access management.", icon: "📹", iconType: "emoji", price: "From $1,200" },
    { id: uid("svc"), title: "Mobile Patrol", description: "Scheduled and random vehicle patrols of your premises.", icon: "🚔", iconType: "emoji", price: "From $800/mo" },
    { id: uid("svc"), title: "Event Security", description: "Crowd management and access control for events of any size.", icon: "🎪", iconType: "emoji", price: "Custom quote" },
  ],
  testimonials: [
    { id: uid("t"), name: "Facilities Manager", role: "CapitaLand", content: "Professional, proactive and always on time. Zero security incidents under their watch.", rating: 5 },
    { id: uid("t"), name: "HR Director", role: "Jurong Shipyard", content: "Access control at our yard has improved dramatically since we switched to ShieldGuard.", rating: 5 },
  ],
  pricing: [
    { id: uid("p"), name: "Basic", price: "$18/hr", period: "/guard", features: ["Uniformed static guard", "Hourly incident log", "Daily report", "Emergency callout"], ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Business", price: "$2,400/mo", period: "/site", features: ["2 guards 12-hr shifts", "CCTV monitoring", "Mobile patrol weekly", "Incident response SLA", "Monthly report"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Enterprise", price: "Custom", period: "/contract", features: ["Dedicated site commander", "24/7 deployment", "Full CCTV system", "Access control", "Annual security audit"], ctaLabel: "Contact Us", ctaUrl: "#contact" },
  ],
  faq: [
    { id: uid("f"), question: "Are your guards MOM-licensed?", answer: "Yes. All ShieldGuard officers hold valid Private Security Officer licences issued by MOM." },
    { id: uid("f"), question: "How quickly can you deploy guards?", answer: "For standard requirements, we can deploy within 48–72 hours of contract signing." },
  ],
  team: [
    { id: uid("tm"), name: "Alex Goh", role: "CEO & Operations Director", bio: "15 years in security management. Former Singapore Police Force officer.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face" },
  ],
};

// ── Batch 3: ShineAuto ────────────────────────────────────────────────────────

const SHINE_AUTO: TemplateIdentity = {
  slug: "shine-auto",
  name: "ShineAuto",
  description: "Premium car wash & detailing studio. Deep black + electric blue. Package selector, gallery, membership plans.",
  category: "Automotive",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&q=80&fit=crop",
  tags: ["car wash", "detailing", "ceramic coating", "automotive"],
  palette: {
    primary: "#0f172a",
    primaryFg: "#ffffff",
    secondary: "#1d4ed8",
    accent: "#2563eb",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#f8fafc",
    mutedFg: "#64748b",
    card: "#ffffff",
    border: "#e2e8f0",
    ring: "#2563eb",
    borderRadius: "0.75rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.025em",
  },
  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "grid",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },
  images: {
    hero: { url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1200&q=80&fit=crop", alt: "Car being detailed" },
    services: [
      { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80&fit=crop", alt: "Car wash" },
      { url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=80&fit=crop", alt: "Car detailing" },
    ],
    gallery: [],
    team: [],
  },
  heroHeadline: "Your Car Deserves the Best.",
  heroSubline: "Professional car wash, detailing & ceramic coating. Book online in 60 seconds.",
  heroCTA: "Book a Detail",
  heroSecondaryCTA: "View Packages",
  siteName: "ShineAuto Detailing",
  tagline: "Detail-Perfect. Every Single Time.",
  phone: "+65 9123 4567",
  email: "book@shineauto.sg",
  address: "12 Bukit Timah Road, Singapore 229841",
  aboutHeading: "Singapore's Premier Auto Detailing Studio",
  aboutBody: "ShineAuto was founded by detailing enthusiasts who invest in professional-grade equipment, premium products and highly trained technicians. Every vehicle is treated as if it were our own.",
  aboutHighlights: ["4.9★ across 800+ Google reviews", "IDA-certified detailing specialists", "Gyeon & Kamikaze products", "Climate-controlled studio", "Collection & delivery available"],
  navItems: [
    { id: "n1", label: "Packages", url: "#pricing" },
    { id: "n2", label: "Services", url: "#services" },
    { id: "n3", label: "Gallery", url: "#gallery" },
    { id: "n4", label: "Contact", url: "#contact" },
  ],
  stats: [
    { id: uid("st"), value: "8,000+", label: "Cars Detailed" },
    { id: uid("st"), value: "4.9★", label: "Google Rating" },
    { id: uid("st"), value: "6 yr", label: "In Business" },
    { id: uid("st"), value: "15+", label: "Services" },
  ],
  services: [
    { id: uid("svc"), title: "Express Wash", description: "Exterior hand wash, tyre dressing, glass clean and interior wipe-down. 45 minutes.", icon: "🚿", iconType: "emoji", price: "From $35" },
    { id: uid("svc"), title: "Full Detail", description: "Interior vacuum, steam clean, leather condition, clay bar and machine polish.", icon: "✨", iconType: "emoji", price: "From $180" },
    { id: uid("svc"), title: "Ceramic Coating", description: "Professional 9H ceramic coating. 3–5 year protection, hydrophobic and scratch-resistant.", icon: "🛡️", iconType: "emoji", price: "From $800" },
    { id: uid("svc"), title: "Paint Protection Film", description: "Invisible TPU film protects bumper, bonnet and mirrors from stone chips.", icon: "🎯", iconType: "emoji", price: "From $1,500" },
  ],
  testimonials: [
    { id: uid("t"), name: "Kevin T.", role: "BMW M3 Owner", content: "The ceramic coating finish is absolutely stunning. Best detailer in Singapore, no contest.", rating: 5 },
    { id: uid("t"), name: "Priya M.", role: "Kia Owner", content: "The interior looks like it just came from the showroom. Will definitely be back monthly.", rating: 5 },
  ],
  pricing: [
    { id: uid("p"), name: "Wash & Vacuum", price: "$35", period: "/visit", features: ["Exterior hand wash", "Interior vacuum", "Dashboard wipe", "Tyre dressing"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Detail", price: "$180", period: "/visit", features: ["Full interior steam clean", "Leather conditioning", "Clay bar treatment", "Machine polish", "Ceramic spray sealant"], highlighted: true, badge: "Best Value", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Ceramic Pro", price: "From $800", period: "/coating", features: ["Paint decontamination", "One-step machine polish", "9H ceramic coating", "3-year warranty", "Maintenance kit"], ctaLabel: "Enquire", ctaUrl: "#contact" },
  ],
  faq: [
    { id: uid("f"), question: "How long does a full detail take?", answer: "A standard Full Detail takes 4–5 hours. Ceramic coating installations take 1–2 days." },
    { id: uid("f"), question: "Do you offer collection and delivery?", answer: "Yes. Free collection and delivery within 10km for Full Detail and above packages." },
  ],
  team: [
    { id: uid("tm"), name: "Danny Lim", role: "Founder & Lead Detailer", bio: "IDA-certified. 8 years detailing experience. Has worked on Ferraris and Lamborghinis.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face" },
  ],
};

// ── Batch 3: FeastEvents ──────────────────────────────────────────────────────

const FEAST_EVENTS: TemplateIdentity = {
  slug: "feast-events",
  name: "FeastEvents",
  description: "Full-service catering & events. Rich burgundy + gold. Menu showcase, event gallery, package booking.",
  category: "Events",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&q=80&fit=crop",
  tags: ["catering", "events", "weddings", "corporate", "singapore"],
  palette: {
    primary: "#9f1239",
    primaryFg: "#ffffff",
    secondary: "#92400e",
    accent: "#b45309",
    background: "#ffffff",
    foreground: "#1c1917",
    muted: "#fdf2f8",
    mutedFg: "#6b7280",
    card: "#ffffff",
    border: "#fde8d8",
    ring: "#b45309",
    borderRadius: "0.75rem",
  },
  typography: {
    headingFont: "Georgia",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  variants: {
    hero: "full-screen-video",
    services: "alternating-images",
    testimonials: "quote-cards",
    features: "grid",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "transparent-dark",
    team: "avatar-cards",
  },
  images: {
    hero: { url: "https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&q=80&fit=crop", alt: "Catering event spread" },
    services: [
      { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop", alt: "Fine dining" },
      { url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80&fit=crop", alt: "Wedding reception" },
    ],
    gallery: [],
    team: [],
  },
  heroHeadline: "Exceptional Food. Unforgettable Events.",
  heroSubline: "Full-service catering for corporate events, weddings & private dining. Singapore & Gulf.",
  heroCTA: "Get a Quote",
  heroSecondaryCTA: "View Menu",
  siteName: "Feast Events",
  tagline: "Great Food. Great Events. Every Time.",
  phone: "+65 6234 8888",
  email: "hello@feastevents.sg",
  address: "8 Dempsey Road, Singapore 247696",
  aboutHeading: "Singapore's Full-Service Catering & Events Partner",
  aboutBody: "Feast Events has fed tens of thousands of guests across Singapore and the Gulf — from intimate 20-person boardroom lunches to 5,000-guest gala dinners. Our team of 40 culinary professionals brings the same passion to every event.",
  aboutHighlights: ["SFA licensed kitchen", "MUIS Halal certified", "2,400+ events delivered", "40+ culinary professionals", "Fresh daily sourcing"],
  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Menus", url: "#menus" },
    { id: "n3", label: "Gallery", url: "#gallery" },
    { id: "n4", label: "About", url: "#about" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],
  stats: [
    { id: uid("st"), value: "2,400+", label: "Events Catered" },
    { id: uid("st"), value: "50+", label: "Menu Options" },
    { id: uid("st"), value: "10 yr", label: "In Business" },
    { id: uid("st"), value: "5,000", label: "Max Pax" },
  ],
  services: [
    { id: uid("svc"), title: "Corporate Buffet", description: "Professional buffet catering for conferences, seminars and product launches.", icon: "🍽️", iconType: "emoji", price: "From $28/pax" },
    { id: uid("svc"), title: "Wedding Banquet", description: "Full-service wedding catering from cocktail reception to multi-course dinner.", icon: "💒", iconType: "emoji", price: "From $88/pax" },
    { id: uid("svc"), title: "Private Dining", description: "Intimate chef's table experiences and VIP events with sommelier service.", icon: "🥂", iconType: "emoji", price: "From $120/pax" },
    { id: uid("svc"), title: "Live Cooking Stations", description: "Chef-manned carving, wok and sushi live stations for gala dinners.", icon: "👨‍🍳", iconType: "emoji", price: "From $800/station" },
  ],
  testimonials: [
    { id: uid("t"), name: "Procurement Head, DBS Bank", role: "Marina Bay", content: "Consistently excellent food, impeccable service, always on time. Our go-to caterer for 3 years.", rating: 5 },
    { id: uid("t"), name: "Siti Rahimah", role: "Bride, Fullerton Hotel", content: "Our wedding dinner for 350 guests was absolutely perfect. Every guest complimented the food.", rating: 5 },
  ],
  pricing: [
    { id: uid("p"), name: "Seminar", price: "$28/pax", period: "min 30 pax", features: ["2 mains, 3 sides", "Soup & salad station", "Dessert & beverages", "Setup & teardown"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Gala", price: "$88/pax", period: "min 100 pax", features: ["5-course dinner", "2 live cooking stations", "Premium tableware", "Dedicated service team", "Event coordination"], highlighted: true, badge: "Most Popular", ctaLabel: "Get a Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Wedding", price: "Custom", period: "per event", features: ["Custom menu design", "Tasting session", "Sommelier & bar service", "Pre-event planning", "Day-of coordinator"], ctaLabel: "Contact Us", ctaUrl: "#contact" },
  ],
  faq: [
    { id: uid("f"), question: "Is your kitchen halal certified?", answer: "Yes. Our kitchen holds a valid Halal certification from MUIS." },
    { id: uid("f"), question: "What is your minimum guest count?", answer: "For corporate buffets, minimum 30 pax. For sit-down dinners, minimum 50 pax." },
  ],
  team: [
    { id: uid("tm"), name: "Chef Marcus Tan", role: "Executive Chef", bio: "Trained in Paris and Tokyo. 18 years in fine dining and large-scale event catering.", avatar: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80&fit=crop&face" },
  ],
};

// ── Batch 3: MedPlus Clinic ────────────────────────────────────────────────────

const MEDPLUS_CLINIC: TemplateIdentity = {
  slug: "medplus-clinic",
  name: "MedPlus Clinic",
  description: "Modern GP & medical clinic. Clean white + medical blue. Doctor profiles, appointment booking, insurance badges.",
  category: "Health & Beauty",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80&fit=crop",
  tags: ["clinic", "medical", "gp", "healthcare", "singapore"],
  palette: {
    primary: "#1d4ed8",
    primaryFg: "#ffffff",
    secondary: "#0891b2",
    accent: "#2563eb",
    background: "#f8fafc",
    foreground: "#0f172a",
    muted: "#eff6ff",
    mutedFg: "#475569",
    card: "#ffffff",
    border: "#bfdbfe",
    ring: "#2563eb",
    borderRadius: "0.625rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.015em",
  },
  variants: {
    hero: "split-image-left",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },
  images: {
    hero: { url: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80&fit=crop", alt: "Doctor with patient" },
    services: [
      { url: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80&fit=crop", alt: "Medical consultation" },
    ],
    gallery: [],
    team: [],
  },
  heroHeadline: "Your Health. Our Priority.",
  heroSubline: "Comprehensive GP & specialist care. Walk-in & appointment. Medisave & insurance accepted.",
  heroCTA: "Book Appointment",
  heroSecondaryCTA: "Our Services",
  siteName: "MedPlus Clinic",
  tagline: "Caring for You and Your Family.",
  phone: "+65 6456 7890",
  email: "appointments@medplus.sg",
  address: "23 Clementi Ave 2, #01-05, Singapore 120023",
  aboutHeading: "A Community Clinic Built Around You",
  aboutBody: "MedPlus Clinic was established in 2016 to provide Clementi and the surrounding community with affordable, high-quality primary care. Our doctors take the time to listen, explain and personalise treatment plans.",
  aboutHighlights: ["MOH registered clinic", "Medisave & CHAS accepted", "Chronic disease management", "Same-day appointments", "Open 7 days a week"],
  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Doctors", url: "#team" },
    { id: "n3", label: "Insurance", url: "#insurance" },
    { id: "n4", label: "Contact", url: "#contact" },
  ],
  stats: [
    { id: uid("st"), value: "15,000+", label: "Patients Seen" },
    { id: uid("st"), value: "8 yr", label: "In Practice" },
    { id: uid("st"), value: "4.8★", label: "Patient Rating" },
    { id: uid("st"), value: "Mon–Sun", label: "Open Daily" },
  ],
  services: [
    { id: uid("svc"), title: "General Practice", description: "Walk-in and appointment GP consultations for acute illness and chronic disease management.", icon: "🩺", iconType: "emoji", price: "From $35" },
    { id: uid("svc"), title: "Health Screening", description: "Comprehensive screenings including blood panel, ECG and body composition.", icon: "🔬", iconType: "emoji", price: "From $98" },
    { id: uid("svc"), title: "Vaccinations", description: "Adult and child vaccinations including flu, HPV, Hepatitis B and travel vaccines.", icon: "💉", iconType: "emoji", price: "From $28" },
    { id: uid("svc"), title: "Chronic Disease Management", description: "Long-term care for diabetes, hypertension, cholesterol and asthma under CHAS/CDMP.", icon: "💊", iconType: "emoji", price: "Subsidised rates" },
  ],
  testimonials: [
    { id: uid("t"), name: "Mrs Tan Ah Lian", role: "Patient, Clementi", content: "Dr Sarah is so patient and thorough. Best GP I've had in 20 years.", rating: 5 },
    { id: uid("t"), name: "James Lim", role: "Patient, West Coast", content: "Walked in with a bad fever. Seen within 15 minutes. Back to work by Monday.", rating: 5 },
  ],
  pricing: [
    { id: uid("p"), name: "Consultation", price: "$35", period: "/visit", features: ["GP consultation", "1 basic medication", "Medical certificate", "CHAS rates available"], ctaLabel: "Walk In", ctaUrl: "#contact" },
    { id: uid("p"), name: "Health Screen", price: "$98", period: "/package", features: ["Full blood panel (25 tests)", "ECG", "Body composition", "Doctor consult", "Digital results in 24hr"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Corporate", price: "Custom", period: "/employee/yr", features: ["Pre-employment screening", "Onsite visits", "Group screening", "Account manager", "Annual health day"], ctaLabel: "Enquire", ctaUrl: "#contact" },
  ],
  faq: [
    { id: uid("f"), question: "Do you accept Medisave?", answer: "Yes. We accept Medisave for chronic disease management under CDMP, as well as for vaccinations and health screenings." },
    { id: uid("f"), question: "Can I walk in without an appointment?", answer: "Yes. Walk-ins are welcome during clinic hours. Online booking is available for preferred slots." },
  ],
  team: [
    { id: uid("tm"), name: "Dr. Sarah Lim", role: "Principal GP, MBBS (NUS)", bio: "8 years in family medicine. Specialises in chronic disease management and women's health.", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Dr. Raj Arumugam", role: "Senior GP, MBBS (NTU)", bio: "Former hospital doctor with expertise in acute care and minor surgery.", avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80&fit=crop&face" },
  ],
};

// ── Batch 3: DriveAcademy ─────────────────────────────────────────────────────

const DRIVE_ACADEMY: TemplateIdentity = {
  slug: "drive-academy",
  name: "DriveAcademy",
  description: "Driving school & auto academy. Bold red & white. Course packages, instructor profiles, pass rate stats, online booking.",
  category: "Automotive",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80&fit=crop",
  tags: ["driving school", "driving lessons", "license", "singapore"],
  palette: {
    primary: "#dc2626",
    primaryFg: "#ffffff",
    secondary: "#111827",
    accent: "#dc2626",
    background: "#ffffff",
    foreground: "#111827",
    muted: "#fef2f2",
    mutedFg: "#6b7280",
    card: "#ffffff",
    border: "#fecaca",
    ring: "#dc2626",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.03em",
  },
  variants: {
    hero: "split-image-right",
    services: "numbered-list",
    testimonials: "quote-cards",
    features: "grid",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "two-column",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },
  images: {
    hero: { url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80&fit=crop", alt: "Driving on highway" },
    services: [
      { url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&q=80&fit=crop", alt: "Driving lesson" },
    ],
    gallery: [],
    team: [],
  },
  heroHeadline: "Pass First Time. Drive for Life.",
  heroSubline: "Singapore's most trusted driving school. 94% first-attempt pass rate. Book your slot now.",
  heroCTA: "Book a Lesson",
  heroSecondaryCTA: "View Courses",
  siteName: "DriveAcademy",
  tagline: "From Learner to Licensed. Guaranteed.",
  phone: "+65 6543 9900",
  email: "hello@driveacademy.sg",
  address: "3 Ubi Ave 3, #02-11, Singapore 408857",
  aboutHeading: "20 Years of Turning Learners Into Confident Drivers",
  aboutBody: "DriveAcademy has been Singapore's most trusted private driving school since 2004. Our 25+ certified instructors combine patient teaching with rigorous TP preparation and maintain a 94% first-attempt pass rate.",
  aboutHighlights: ["TP-registered driving school", "94% first-attempt pass rate", "25+ certified instructors", "Online theory portal included", "Free re-test lesson guarantee"],
  navItems: [
    { id: "n1", label: "Courses", url: "#pricing" },
    { id: "n2", label: "Instructors", url: "#team" },
    { id: "n3", label: "FAQ", url: "#faq" },
    { id: "n4", label: "Book Now", url: "#contact" },
  ],
  stats: [
    { id: uid("st"), value: "94%", label: "First-Attempt Pass Rate" },
    { id: uid("st"), value: "12,000+", label: "Graduates" },
    { id: uid("st"), value: "20 yr", label: "In Business" },
    { id: uid("st"), value: "25+", label: "Instructors" },
  ],
  services: [
    { id: uid("svc"), title: "Class 3A (Auto) Lessons", description: "One-on-one circuit and road lessons in automatic cars. Flexible slots.", icon: "🚗", iconType: "emoji", price: "From $65/lesson" },
    { id: uid("svc"), title: "Intensive Course", description: "20 lessons + theory prep + mock test. Average completion in 8 weeks.", icon: "⚡", iconType: "emoji", price: "$1,200 package" },
    { id: uid("svc"), title: "Theory Test Prep", description: "Classroom and online BTT and FTT preparation. 98% pass rate.", icon: "📚", iconType: "emoji", price: "$80 package" },
    { id: uid("svc"), title: "Refresher Course", description: "For lapsed drivers returning after a break. Update on current road rules.", icon: "🔄", iconType: "emoji", price: "From $65/lesson" },
  ],
  testimonials: [
    { id: uid("t"), name: "Amanda L.", role: "Bedok, Singapore", content: "Failed twice at CDCs. David's patient coaching made all the difference. Passed first attempt with DriveAcademy.", rating: 5 },
    { id: uid("t"), name: "Hafiz M.", role: "Jurong East, Singapore", content: "8 weeks from zero to full licence. The theory prep materials online are so good I passed FTT first try.", rating: 5 },
  ],
  pricing: [
    { id: uid("p"), name: "Pay Per Lesson", price: "$65/lesson", period: "no commitment", features: ["Class 3A or 3 options", "Flexible slot booking", "WhatsApp scheduling", "Progress tracking app"], ctaLabel: "Book a Lesson", ctaUrl: "#contact" },
    { id: uid("p"), name: "Intensive Course", price: "$1,200", period: "full package", features: ["20 driving lessons", "BTT & FTT prep", "2 simulator sessions", "Mock test session", "Free re-test lesson"], highlighted: true, badge: "Best Value", ctaLabel: "Enrol Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Advanced Driver", price: "$550", period: "refresher package", features: ["8 refresher lessons", "Road rule update", "Night driving practice", "Highway lesson", "Progress report"], ctaLabel: "Book Now", ctaUrl: "#contact" },
  ],
  faq: [
    { id: uid("f"), question: "How many lessons do I need before the TP test?", answer: "Most students need 15–25 lessons. Our instructors assess readiness and recommend when to book." },
    { id: uid("f"), question: "What if I fail the TP test?", answer: "Students on our Intensive Course receive one free additional lesson before their re-test booking." },
  ],
  team: [
    { id: uid("tm"), name: "Chief Instr. David Ong", role: "Founder & Chief Instructor", bio: "TP-certified. 20 years teaching. Has personally graduated over 3,000 students.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Instr. Michelle Tan", role: "Senior Driving Instructor", bio: "Specialises in anxiety management for nervous learners. 96% first-attempt pass rate.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE: Life Settle Travel And Tourism ─────────────────────────────────

const LIFE_SETTLE: TemplateIdentity = {
  slug: "life-settle",
  name: "Life Settle Travel",
  description: "Premium visa & immigration brand template — visa processing, work permits, skilled migration and travel services with royal-blue, white & gold luxury branding.",
  category: "Travel & Tourism",
  author: "Passive Coder",
  version: "2.0.0",
  previewImage: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=85&fit=crop",
  tags: ["visa", "immigration", "travel", "work-permit", "skilled-migration", "tour-packages"],

  palette: {
    primary: "#1e3a8a",
    primaryFg: "#ffffff",
    secondary: "#c9a84c",
    accent: "#d4af37",
    background: "#f5f8ff",
    foreground: "#0b1f4d",
    muted: "#eef3ff",
    mutedFg: "#3b5bbd",
    card: "#ffffff",
    border: "#1e3a8a1f",
    ring: "#1e3a8a",
    borderRadius: "0.75rem",
  },
  typography: {
    headingFont: "var(--font-poppins), Poppins",
    bodyFont: "var(--font-inter), Inter",
    headingWeight: "700",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-life-settle .hero-badge { background: #c9a84c; color: #0b1f4d; border-radius: 9999px; font-weight: 700; }
    .template-life-settle .service-card { border-top: 3px solid #c9a84c; }
    .template-life-settle .stat-value { color: #c9a84c; }
    .template-life-settle .nav-cta { background: #c9a84c !important; color: #0b1f4d !important; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: {
      url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=85&fit=crop",
      alt: "Airplane flying over world destinations",
    },
    heroSecondary: {
      url: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80&fit=crop",
      alt: "Travel destinations collage",
    },
    about: {
      url: "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&q=80&fit=crop",
      alt: "Life Settle Travel team serving clients",
    },
    services: [
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&fit=crop", alt: "Visa processing service" },
      { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", alt: "Flight booking service" },
      { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80&fit=crop", alt: "Tour packages" },
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&fit=crop", alt: "Hotel booking" },
      { url: "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=600&q=80&fit=crop", alt: "Work permit Europe" },
      { url: "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=600&q=80&fit=crop", alt: "Manpower recruitment" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80&fit=crop", alt: "Paris Eiffel Tower" },
      { url: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80&fit=crop", alt: "Germany skyline" },
      { url: "https://images.unsplash.com/photo-1555952517-2e8e729e0b44?w=800&q=80&fit=crop", alt: "Portugal Lisbon" },
      { url: "https://images.unsplash.com/photo-1609943500965-a4e61c1cd91d?w=800&q=80&fit=crop", alt: "Serbia Belgrade" },
      { url: "https://images.unsplash.com/photo-1576502200916-3808e07386a5?w=800&q=80&fit=crop", alt: "Dubai city" },
      { url: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=800&q=80&fit=crop", alt: "Saudi Arabia" },
      { url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80&fit=crop", alt: "Italy Rome" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&fit=crop", alt: "Romania Bucharest" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Sharmin Akter" },
      { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face", alt: "Mohammed Masud Rana" },
      { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face", alt: "Md. Fazlul Hoque" },
    ],
    cta: {
      url: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80&fit=crop",
      alt: "Start your journey with Life Settle",
    },
  },

  heroHeadline: "Your Dream Destination Awaits",
  heroSubline: "Visa processing, work permits, flight bookings & tour packages — all under one roof.",
  heroBadge: "✈️ Trusted Since 2020 · 5,000+ Visas Processed",
  heroCTA: "Get Free Consultation",
  heroSecondaryCTA: "Explore Destinations",
  siteName: "Life Settle Travel And Tourism",
  tagline: "Our Aim Is Your Journey",
  phone: "+8801711145428",
  email: "info@lifesettle.com",
  address: "House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207",
  aboutHeading: "Bangladesh's Most Trusted Travel & Visa Partner",
  aboutBody: "Life Settle Travel And Tourism has helped thousands of Bangladeshi citizens realize their dreams of working and living abroad. From Schengen visas to GCC work permits, our expert team handles every step — document preparation, embassy appointments, manpower processing, and air ticketing. We collect fees only after successful visa — zero advance required.",
  aboutHighlights: [
    "Zero advance payment — pay after visa approval",
    "Europe, GCC & Asia visa processing",
    "Work permit & manpower recruitment",
    "Air ticketing & hotel booking",
  ],

  navItems: [
    { id: "n1", label: "Home", url: "/" },
    { id: "n2", label: "Services", url: "#services" },
    { id: "n3", label: "Destinations", url: "#destinations" },
    { id: "n4", label: "About Us", url: "#about" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    {
      id: uid("svc"), title: "Visa Processing",
      description: "Europe (Schengen & non-Schengen), GCC, and Asia visa processing with embassy appointment handling. Payment after approval.",
      icon: "🛂", iconType: "emoji",
      imageUrl: "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=600&q=80&fit=crop",
      price: "Consult Free", link: "#contact",
    },
    {
      id: uid("svc"), title: "Work Permit Processing",
      description: "Legal work permits for Europe (Serbia, Portugal, Germany, Romania, Bosnia) and GCC countries. Fast-track processing available.",
      icon: "📋", iconType: "emoji",
      imageUrl: "https://images.unsplash.com/photo-1521898284481-a5ec348cb555?w=600&q=80&fit=crop",
      price: "Consult Free", link: "#contact",
    },
    {
      id: uid("svc"), title: "Manpower Recruitment",
      description: "Factory workers, cleaners, construction workers, and general helpers for Saudi Arabia, UAE, Qatar, Kuwait, Jordan, and Europe.",
      icon: "👷", iconType: "emoji",
      imageUrl: "https://images.unsplash.com/photo-1531219432768-9f540ce91ef3?w=600&q=80&fit=crop",
      price: "Consult Free", link: "#contact",
    },
    {
      id: uid("svc"), title: "Flight Booking",
      description: "Domestic and international air tickets at competitive rates. One-way, return and multi-city bookings with all major airlines.",
      icon: "✈️", iconType: "emoji",
      imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop",
      price: "Best Rates", link: "#contact",
    },
    {
      id: uid("svc"), title: "Tour Packages",
      description: "Full holiday packages to Malaysia, Nepal, Sri Lanka, Thailand, Dubai and more — includes visa, return tickets, hotel & transfers.",
      icon: "🌍", iconType: "emoji",
      imageUrl: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80&fit=crop",
      price: "From ৳37,000", link: "#contact",
    },
    {
      id: uid("svc"), title: "Hotel Booking",
      description: "Budget to luxury hotel reservations worldwide. Get the best rates for your travel destination with free cancellation options.",
      icon: "🏨", iconType: "emoji",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&fit=crop",
      price: "Best Rates", link: "#contact",
    },
  ],

  stats: [
    { id: uid("st"), value: "5,000+", label: "Visas Processed" },
    { id: uid("st"), value: "45+", label: "Countries Covered" },
    { id: uid("st"), value: "100%", label: "Pay After Visa" },
    { id: uid("st"), value: "5★", label: "Client Rating" },
  ],

  testimonials: [
    {
      id: uid("t"), name: "Rakibul Islam", role: "Factory Worker", company: "Now in Serbia",
      content: "Life Settle got me a Serbia work permit within 45 days. The whole process was smooth and they only took money after I got the visa. Highly recommend!",
      rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face",
    },
    {
      id: uid("t"), name: "Fatema Begum", role: "Cleaner", company: "Now in Saudi Arabia",
      content: "3 months free visa to Saudi Arabia with full package — visa, manpower, and air ticket. Life Settle made my dream come true. Iqama within 72 hours!",
      rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face",
    },
    {
      id: uid("t"), name: "Mahmudul Hassan", role: "Engineer", company: "Portugal D1 Visa",
      content: "Got Portugal emergency recruitment visa through Life Settle. Only 1 month for appointment, 2 months total. Zero advance taken. Amazing service.",
      rating: 5, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&fit=crop&face",
    },
    {
      id: uid("t"), name: "Nasrin Akter", role: "Tourist", company: "Malaysia Trip",
      content: "Booked Malaysia full package — e-visa, return ticket, and 3-night hotel, all for under ৳60,000. Great value and stress-free planning.",
      rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face",
    },
    {
      id: uid("t"), name: "Jahidul Karim", role: "Construction Worker", company: "Now in Bosnia",
      content: "Bosnia work permit via Life Settle — salary 750–800 EUR per month. They handled everything from documents to flight. Trustworthy agency.",
      rating: 5,
    },
    {
      id: uid("t"), name: "Shirin Sultana", role: "Business Owner",
      content: "Needed urgent Romania visa. Life Settle processed it in 7–8 days. Professional team, clear communication, and no hidden fees.",
      rating: 5,
    },
  ],

  faq: [
    {
      id: uid("f"),
      question: "Do you take advance payment before visa approval?",
      answer: "No. We never take any advance payment before your visa is approved. You pay only after receiving your visa. This is our firm policy and a core part of how we serve our clients.",
    },
    {
      id: uid("f"),
      question: "Which countries do you process visas for?",
      answer: "We process visas for 29 Schengen countries (Germany, Portugal, Italy, France, Spain etc.), 16 non-Schengen European countries (UK, Serbia, Romania, Bosnia, North Macedonia etc.), 6 GCC countries (Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman), and several Asian destinations.",
    },
    {
      id: uid("f"),
      question: "How long does work permit processing take?",
      answer: "Processing times vary by country. Serbia: approval in 7 days, sticker visa in 25 days, flight in ~2 months. Bosnia: work permit approval in 7 days, sticker in 25 days. Saudi Arabia: iqama within 72 hours of arrival. Portugal D1: appointment in 1 month, completed in 2 months.",
    },
    {
      id: uid("f"),
      question: "What job types are available for overseas recruitment?",
      answer: "We recruit for factory workers, cleaners (load/unload, office cleaner, warehouse cleaner), construction workers, general helpers, electricians, painters, masons, plasters, excavator operators, and restaurant staff depending on available positions.",
    },
    {
      id: uid("f"),
      question: "Do you offer tour packages?",
      answer: "Yes! We offer full holiday packages including e-visa or visa processing, return air tickets, and hotel accommodation. Popular destinations include Malaysia, Nepal, Sri Lanka, Dubai, and Thailand. Packages start from ৳37,000.",
    },
    {
      id: uid("f"),
      question: "How do I get started?",
      answer: "Contact us via WhatsApp at +8801750599917 or call +8801711145428. You can also visit our office at House #560, Road #8, Adabor, Mohammadpur, Dhaka-1207. We offer a free initial consultation.",
    },
  ],

  team: [
    {
      id: uid("tm"), name: "Sharmin Akter", role: "Managing Director & CEO",
      bio: "Founder of Life Settle Travel And Tourism. Leads the company with a vision of making overseas opportunities accessible to every Bangladeshi.",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face",
      social: [{ platform: "phone", url: "tel:+8801711145428" }],
    },
    {
      id: uid("tm"), name: "Mohammed Masud Rana", role: "Chairman",
      bio: "Oversees company strategy and international partnerships. Drives expansion into new European and GCC markets.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&face",
      social: [{ platform: "phone", url: "tel:+8801711961149" }],
    },
    {
      id: uid("tm"), name: "Md. Fazlul Hoque", role: "Marketing Manager",
      bio: "Connects clients with the right overseas opportunities. Expert in visa requirements and manpower recruitment across 45+ countries.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&face",
    },
  ],

  pricing: [
    {
      id: uid("p"), name: "Tour Package", price: "From ৳37,000", period: "/person",
      description: "Holiday travel with full arrangements",
      features: ["Return air ticket", "E-visa or visa processing", "Hotel minimum 3 nights", "Airport transfer", "Popular: Malaysia, Nepal, Sri Lanka"],
      ctaLabel: "Book Package", ctaUrl: "#contact",
    },
    {
      id: uid("p"), name: "Work Permit", price: "Pay After Visa", period: "",
      description: "Europe & GCC work permit processing",
      features: ["Full document preparation", "Embassy appointment", "Visa processing", "Manpower paperwork", "Air ticket booking", "Zero advance required"],
      highlighted: true, badge: "Most Popular",
      ctaLabel: "Apply Now", ctaUrl: "#contact",
    },
    {
      id: uid("p"), name: "Visa Only", price: "Pay After Visa", period: "",
      description: "Tourist, business or visit visa",
      features: ["Schengen & non-Schengen", "GCC tourist visas", "Document checklist", "Application support", "Embassy tracking", "Zero advance required"],
      ctaLabel: "Get Visa", ctaUrl: "#contact",
    },
  ],
};

// ─── TEMPLATE 29: ApexConstruct (Premium General Contractor) ─────────────────

const APEX_CONSTRUCT: TemplateIdentity = {
  slug: "apex-construct",
  name: "ApexConstruct",
  description: "Premium general contractor template with an editorial hero layout and project showcase. Perfect for high-end renovation and construction firms.",
  category: "Renovation & Construction",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=85&fit=crop",
  tags: ["contractor", "construction", "renovation", "building"],

  palette: {
    primary: "#ca8a04",
    primaryFg: "#171717",
    secondary: "#a16207",
    accent: "#eab308",
    background: "#171717",
    foreground: "#fafaf9",
    muted: "#262626",
    mutedFg: "#a3a3a3",
    card: "#262626",
    border: "#404040",
    ring: "#ca8a04",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-apex-construct h1,.template-apex-construct h2 { text-transform: uppercase; letter-spacing: 0.02em; }
    .template-apex-construct .service-card { border-top: 3px solid #ca8a04; }
    .template-apex-construct .stat-value { color: #ca8a04; font-weight: 900; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1600&q=90&fit=crop", alt: "Modern construction project" },
    about: { url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&fit=crop", alt: "Architectural blueprint review" },
    services: [
      { url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&fit=crop", alt: "New build construction" },
      { url: "https://images.unsplash.com/photo-1541976590-713941681591?w=600&q=80&fit=crop", alt: "High-end renovation" },
      { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&fit=crop", alt: "Commercial development" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", alt: "Kitchen extension" },
      { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80&fit=crop", alt: "Structural works" },
      { url: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=600&q=80&fit=crop", alt: "Project handover" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80&fit=crop", alt: "Completed custom home" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80&fit=crop", alt: "Luxury bathroom build" },
      { url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80&fit=crop", alt: "Open-plan living extension" },
      { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80&fit=crop", alt: "Commercial fitout" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Principal Contractor" },
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Head of Projects" },
      { url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80&fit=crop&face", alt: "Lead Architect" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200&q=80&fit=crop", alt: "Start your build" },
  },

  heroHeadline: "Building the Future, One Project at a Time",
  heroSubline: "Award-winning general contractors delivering quality builds on time and on budget.",
  heroBadge: "🏆 Award-Winning Contractor",
  heroCTA: "Request a Consultation",
  heroSecondaryCTA: "View Our Projects",
  siteName: "ApexConstruct",
  tagline: "Premium builds, delivered with precision",
  phone: "+1 (555) 402-8890",
  email: "projects@apexconstruct.com",
  address: "220 Foundation Ave, Suite 400, Metro City",
  aboutHeading: "Two Decades of Award-Winning Construction",
  aboutBody: "ApexConstruct has delivered premium residential and commercial builds for over 20 years. Our in-house architects, project managers and master tradespeople work as one team — meaning tighter timelines, cleaner execution and a single point of accountability from groundbreaking to handover.",
  aboutHighlights: ["Licensed & bonded general contractor", "In-house architecture & design team", "10-year structural warranty", "On-time, on-budget delivery record", "200+ premium builds completed"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Projects", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Get Started", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Custom Home Building", description: "Full architectural design-to-build service for bespoke luxury homes, from concept to move-in.", icon: "🏡", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Whole-Home Renovation", description: "Complete gut renovations and structural remodels for existing homes, managed start to finish.", icon: "🛠️", iconType: "emoji", price: "From $85,000", imageUrl: "https://images.unsplash.com/photo-1541976590-713941681591?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial Construction", description: "Ground-up commercial builds and tenant fitouts, delivered on schedule with full permit management.", icon: "🏢", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Home Extensions", description: "Second-storey additions, kitchen extensions and granny flats designed to match your existing home.", icon: "📐", iconType: "emoji", price: "From $45,000", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Structural Works", description: "Load-bearing wall removal, foundation repair and structural steel installation by licensed engineers.", icon: "🏗️", iconType: "emoji", price: "From $12,000", imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Project Management", description: "End-to-end management for owner-supplied projects — scheduling, trades coordination and QA.", icon: "📋", iconType: "emoji", price: "From $6,000", imageUrl: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "200+", label: "Premium Builds" },
    { id: uid("st"), value: "20 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "Client Rating" },
    { id: uid("st"), value: "10 yr", label: "Structural Warranty" },
  ],

  testimonials: [
    { id: uid("t"), name: "Richard Cole", role: "Homeowner", company: "Hillcrest Estate", content: "ApexConstruct built our dream home exactly to spec, on schedule, with zero surprise costs. The craftsmanship is exceptional.", rating: 5, avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Diane Foster", role: "Property Developer", content: "We've used Apex for three commercial builds now. Their project management is the best in the market — clean, punctual, professional.", rating: 5, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Marcus Boyd", role: "Restaurant Owner", content: "Our tenant fitout was completed two weeks ahead of schedule. Communication throughout was excellent.", rating: 5 },
    { id: uid("t"), name: "Elena Vasquez", role: "Homeowner", content: "The second-storey addition blended so seamlessly you'd never know it wasn't original. Worth every dollar.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Renovation", price: "From $45,000", description: "Single-room to whole-home remodels", features: ["Design consultation", "Licensed trades", "Permit management", "3-year warranty"], ctaLabel: "Request Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Custom Build", price: "From $350,000", description: "Full custom home construction", features: ["In-house architecture", "Dedicated project manager", "Premium fixtures included", "10-year structural warranty", "Fixed-price contract"], highlighted: true, badge: "Most Popular", ctaLabel: "Request Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Commercial", price: "Custom", description: "Ground-up & tenant fitout projects", features: ["Full permit & compliance", "Trades coordination", "Fast-track scheduling", "Post-handover support"], ctaLabel: "Discuss Your Project", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How long does a custom home build take?", answer: "A typical custom home takes 9–14 months from groundbreaking to handover, depending on size and complexity. We provide a detailed schedule before signing." },
    { id: uid("f"), question: "Do you handle permits and approvals?", answer: "Yes, we manage all permit submissions, inspections and compliance approvals as part of every contract." },
    { id: uid("f"), question: "Is pricing fixed or does it change during the build?", answer: "We provide fixed-price contracts with clearly itemised scope. Variations only occur if you request additional work in writing." },
    { id: uid("f"), question: "Can I see examples of your past work?", answer: "Absolutely — our gallery above shows recent projects, and we're happy to arrange a site visit to a completed build near you." },
  ],

  team: [
    { id: uid("tm"), name: "Grant Whitfield", role: "Principal Contractor", bio: "20 years in premium residential and commercial construction. Personally reviews every project plan before groundbreaking.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Alicia Moreno", role: "Head of Projects", bio: "Manages scheduling and trades coordination across every active build, keeping projects on time and on budget.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "David Osei", role: "Lead Architect", bio: "Leads the in-house design team, translating client vision into buildable, permit-ready architectural plans.", avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 30: BuildGuard (Facility Maintenance) ──────────────────────────

const BUILD_GUARD: TemplateIdentity = {
  slug: "buildguard",
  name: "BuildGuard",
  description: "Professional building maintenance template with a clean corporate aesthetic. Designed for facility management and preventive maintenance companies.",
  category: "Renovation & Construction",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=85&fit=crop",
  tags: ["building maintenance", "facility management", "commercial", "repairs"],

  palette: {
    primary: "#2563eb",
    primaryFg: "#ffffff",
    secondary: "#0f172a",
    accent: "#60a5fa",
    background: "#f8fafc",
    foreground: "#0f172a",
    muted: "#e2e8f0",
    mutedFg: "#475569",
    card: "#ffffff",
    border: "#cbd5e1",
    ring: "#2563eb",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-buildguard .service-card { border-left: 3px solid #2563eb; }
    .template-buildguard .stat-value { color: #2563eb; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=85&fit=crop", alt: "Commercial building facade" },
    about: { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&fit=crop", alt: "Facility maintenance technician" },
    services: [
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", alt: "HVAC maintenance" },
      { url: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=600&q=80&fit=crop", alt: "Electrical inspection" },
      { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80&fit=crop", alt: "Plumbing repair" },
      { url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80&fit=crop", alt: "Preventive maintenance" },
      { url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&fit=crop", alt: "Facility inspection" },
      { url: "https://images.unsplash.com/photo-1516216628859-9bccecab13ca?w=600&q=80&fit=crop", alt: "Emergency repairs" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80&fit=crop", alt: "Office building maintained" },
      { url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80&fit=crop", alt: "Retail facility upkeep" },
      { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80&fit=crop", alt: "Corporate campus" },
      { url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80&fit=crop", alt: "Building systems check" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Operations Manager" },
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Chief Engineer" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Client Relations Lead" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80&fit=crop", alt: "Schedule maintenance" },
  },

  heroHeadline: "Building Excellence, Maintained Daily",
  heroSubline: "Comprehensive facility management and maintenance solutions for commercial properties.",
  heroBadge: "🔧 Trusted by 150+ Properties",
  heroCTA: "Get a Maintenance Plan",
  heroSecondaryCTA: "Request Callout",
  siteName: "BuildGuard Facility Services",
  tagline: "Proactive maintenance, zero downtime",
  phone: "+1 (555) 618-2200",
  email: "service@buildguard.com",
  address: "88 Industrial Parkway, Unit 12, Metro City",
  aboutHeading: "Keeping 150+ Commercial Properties Running Smoothly",
  aboutBody: "BuildGuard provides preventive maintenance and rapid-response repairs for offices, retail centres and industrial facilities. Our certified technicians cover HVAC, electrical, plumbing and building systems — all coordinated through one service agreement so property managers have a single point of contact.",
  aboutHighlights: ["24/7 emergency callout line", "Certified multi-trade technicians", "Preventive maintenance scheduling", "Single service agreement, all trades", "150+ properties under contract"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Preventive Maintenance Plans", description: "Scheduled inspections and servicing of HVAC, electrical and plumbing systems to prevent costly failures.", icon: "🗓️", iconType: "emoji", price: "From $450/mo", imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "HVAC Servicing", description: "Commercial HVAC inspection, filter replacement and system tuning to keep buildings comfortable and efficient.", icon: "❄️", iconType: "emoji", price: "From $220", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Electrical Maintenance", description: "Panel inspections, lighting repairs and code-compliance electrical work for commercial properties.", icon: "⚡", iconType: "emoji", price: "From $180", imageUrl: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Plumbing Repairs", description: "Commercial plumbing repairs, leak detection and fixture replacement with minimal business disruption.", icon: "🚰", iconType: "emoji", price: "From $160", imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Emergency Callout", description: "24/7 emergency response for building system failures — average 90-minute arrival within service area.", icon: "🚨", iconType: "emoji", price: "From $280", imageUrl: "https://images.unsplash.com/photo-1516216628859-9bccecab13ca?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Facility Inspections", description: "Comprehensive building health audits with a prioritised repair report for property managers.", icon: "📋", iconType: "emoji", price: "From $350", imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "150+", label: "Properties Managed" },
    { id: uid("st"), value: "90 min", label: "Avg. Response Time" },
    { id: uid("st"), value: "18 yr", label: "In Business" },
    { id: uid("st"), value: "99.2%", label: "Uptime Delivered" },
  ],

  testimonials: [
    { id: uid("t"), name: "Karen Holt", role: "Property Manager", company: "Riverside Business Park", content: "BuildGuard's preventive maintenance has cut our emergency repair costs by half. Their reporting is thorough and their techs are always professional.", rating: 5, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Thomas Reyes", role: "Facilities Director", company: "Metro Office Group", content: "One service agreement covers everything across our 6 buildings. Simplified our vendor management enormously.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Angela Brooks", role: "Retail Centre Manager", content: "Fast emergency response when our HVAC failed on a summer weekend. Saved us from a very bad situation.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Essential", price: "$450", period: "/mo", description: "Single-building preventive plan", features: ["Quarterly HVAC service", "Bi-annual electrical check", "Priority scheduling", "Digital maintenance log"], ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Professional", price: "$950", period: "/mo", description: "Multi-system full coverage", features: ["Monthly HVAC service", "Quarterly electrical & plumbing", "24/7 emergency callout included", "Dedicated account manager", "Digital maintenance log"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Enterprise", price: "Custom", description: "Multi-property portfolios", features: ["Custom SLA terms", "On-site technician options", "Portfolio-wide reporting", "Dedicated response team"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What's included in a preventive maintenance plan?", answer: "Plans include scheduled inspections and servicing of HVAC, electrical and plumbing systems, tailored to your building's equipment and usage." },
    { id: uid("f"), question: "How fast is your emergency response?", answer: "Our average arrival time for emergency callouts is 90 minutes within our standard service area, 24 hours a day, 7 days a week." },
    { id: uid("f"), question: "Can you manage multiple properties under one contract?", answer: "Yes, our Enterprise plan is built for portfolio management with consolidated billing and reporting across all your properties." },
    { id: uid("f"), question: "Are your technicians certified?", answer: "Yes, all BuildGuard technicians hold relevant trade certifications and undergo background checks before deployment." },
  ],

  team: [
    { id: uid("tm"), name: "Victor Chan", role: "Operations Manager", bio: "Oversees scheduling and technician deployment across all 150+ managed properties.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Michelle Adeyemi", role: "Chief Engineer", bio: "18 years in commercial building systems. Leads technical standards and quality control.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 31: HandyfixPro (Handyman Services) ────────────────────────────

const HANDYFIX_PRO: TemplateIdentity = {
  slug: "handyfix-pro",
  name: "HandyfixPro",
  description: "Bold, trust-forward template for handyman services. Dark-accented hero with service icons and a prominent call-to-action for fast local bookings.",
  category: "Renovation & Construction",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1200&q=85&fit=crop",
  tags: ["handyman", "repairs", "home services", "maintenance"],

  palette: {
    primary: "#ea580c",
    primaryFg: "#ffffff",
    secondary: "#1c1917",
    accent: "#fb923c",
    background: "#1c1917",
    foreground: "#fafaf9",
    muted: "#292524",
    mutedFg: "#a8a29e",
    card: "#292524",
    border: "#44403c",
    ring: "#ea580c",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-handyfix-pro .hero-badge { background: #ea580c; color: #fff; border-radius: 9999px; font-weight: 700; }
    .template-handyfix-pro .service-card { border-top: 3px solid #ea580c; background: #292524; }
    .template-handyfix-pro .stat-value { color: #ea580c; font-weight: 900; }
  `,

  variants: {
    hero: "split-image-right",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=900&q=85&fit=crop", alt: "Handyman with tool belt" },
    about: { url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&fit=crop", alt: "Home repair in progress" },
    services: [
      { url: "https://images.unsplash.com/photo-1621905252189-72b656b799d5?w=600&q=80&fit=crop", alt: "Furniture assembly" },
      { url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop", alt: "Drywall repair" },
      { url: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=600&q=80&fit=crop", alt: "Fixture installation" },
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", alt: "Small appliance repair" },
      { url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777540?w=600&q=80&fit=crop", alt: "Painting touch-up" },
      { url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80&fit=crop", alt: "Shelving installation" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop", alt: "Completed shelf install" },
      { url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80&fit=crop", alt: "Repaired drywall" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&fit=crop", alt: "Small home fix" },
      { url: "https://images.unsplash.com/photo-1600607687644-c7171b47af3b?w=800&q=80&fit=crop", alt: "Tidy finish job" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Lead Handyman" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1200&q=80&fit=crop", alt: "Book a handyman" },
  },

  heroHeadline: "Your Local Handyman, Done Right",
  heroSubline: "Fast, reliable repairs and maintenance for homes and businesses — no job too small.",
  heroBadge: "🔨 Same-Day Service Available",
  heroCTA: "Book a Handyman",
  heroSecondaryCTA: "Get Free Estimate",
  siteName: "HandyfixPro",
  tagline: "No job too small, done right the first time",
  phone: "+1 (555) 774-3390",
  email: "jobs@handyfixpro.com",
  address: "56 Maple Grove Rd, Metro City",
  aboutHeading: "1,800+ Repairs Done Right, Since 2015",
  aboutBody: "HandyfixPro handles the jobs that pile up — from leaky faucets and squeaky doors to full furniture assembly and shelving installs. Our vetted, background-checked handymen show up on time, bring their own tools, and clean up before they leave. No job is too small to book.",
  aboutHighlights: ["Background-checked technicians", "Same-day & next-day booking", "Upfront flat-rate pricing", "100% satisfaction guarantee", "1,800+ jobs completed"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "Gallery", url: "#gallery" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Furniture Assembly", description: "Flat-pack furniture, shelving units and beds assembled quickly and correctly, first time.", icon: "🪑", iconType: "emoji", price: "From $59", imageUrl: "https://images.unsplash.com/photo-1621905252189-72b656b799d5?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Drywall & Patch Repair", description: "Holes, cracks and water damage patched, sanded and blended seamlessly with existing walls.", icon: "🧱", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Fixture Installation", description: "Light fixtures, ceiling fans, mirrors and TV mounts installed safely and to code.", icon: "💡", iconType: "emoji", price: "From $69", imageUrl: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Small Repairs", description: "Sticking doors, loose hinges, running toilets and dozens of the small jobs on your to-do list.", icon: "🔧", iconType: "emoji", price: "From $49", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Touch-Up Painting", description: "Wall touch-ups, accent walls and small painting jobs completed cleanly with no overspray mess.", icon: "🎨", iconType: "emoji", price: "From $99", imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777540?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Shelving & Storage", description: "Custom shelving, closet systems and garage storage installed to maximise your space.", icon: "📦", iconType: "emoji", price: "From $79", imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "1,800+", label: "Jobs Completed" },
    { id: uid("st"), value: "Same-Day", label: "Service Available" },
    { id: uid("st"), value: "4.8★", label: "Average Rating" },
    { id: uid("st"), value: "9 yr", label: "In Business" },
  ],

  testimonials: [
    { id: uid("t"), name: "Sam Carter", role: "Homeowner", content: "Booked a same-day fix for a running toilet and a loose cabinet door. Both done in under an hour, fair price, super friendly.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Nadia Hussain", role: "Renter", content: "Assembled my entire bedroom furniture set in one visit. Cleaned up all the packaging too. Highly recommend.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Greg Palmer", role: "Small Business Owner", content: "They've become our go-to for office maintenance. Reliable, fast and always fair on pricing.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Quick Fix", price: "$49", period: "/first hour", description: "Single small repair", features: ["One repair job", "Tools included", "Upfront pricing", "Same-week booking"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Task List", price: "$149", period: "/2 hours", description: "Multiple small jobs in one visit", features: ["Up to 4 small tasks", "Tools & materials included", "Priority scheduling", "Satisfaction guarantee"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Half-Day", price: "$389", period: "/4 hours", description: "Bigger project or long task list", features: ["Up to 4 hours on-site", "Dedicated handyman", "Materials sourcing help", "Follow-up visit included"], ctaLabel: "Book Now", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you bring your own tools?", answer: "Yes, our handymen arrive fully equipped for the job you've booked. You don't need to provide anything." },
    { id: uid("f"), question: "Can I book multiple jobs in one visit?", answer: "Absolutely — our Task List package covers up to 4 small jobs in a single 2-hour visit, which is more cost-effective than booking separately." },
    { id: uid("f"), question: "Is same-day service really available?", answer: "In most cases, yes. Book before noon for same-day availability in our core service area, subject to technician schedules." },
    { id: uid("f"), question: "What if I'm not happy with the work?", answer: "We offer a 100% satisfaction guarantee — if something isn't right, we'll return and fix it at no additional charge." },
  ],
};

// ─── TEMPLATE 32: FlowMaster (Emergency Plumbing) ────────────────────────────

const FLOWMASTER_PLUMBING: TemplateIdentity = {
  slug: "flowmaster-plumbing",
  name: "FlowMaster",
  description: "Clean professional plumbing specialist template with an emergency callout focus. Features 24/7 availability messaging and trust badges.",
  category: "HVAC & Plumbing",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1621905251918-96b8b47c5f8e?w=1200&q=85&fit=crop",
  tags: ["plumbing", "emergency plumber", "pipes", "drainage"],

  palette: {
    primary: "#2563eb",
    primaryFg: "#ffffff",
    secondary: "#1e293b",
    accent: "#60a5fa",
    background: "#1e293b",
    foreground: "#f1f5f9",
    muted: "#334155",
    mutedFg: "#94a3b8",
    card: "#334155",
    border: "#475569",
    ring: "#2563eb",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-flowmaster-plumbing .hero-badge { background: #2563eb; color: #fff; border-radius: 9999px; font-weight: 700; }
    .template-flowmaster-plumbing .service-card { border-top: 3px solid #2563eb; background: #334155; }
    .template-flowmaster-plumbing .stat-value { color: #60a5fa; font-weight: 900; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1621905251918-96b8b47c5f8e?w=1600&q=90&fit=crop", alt: "Plumber repairing pipes" },
    about: { url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80&fit=crop", alt: "Plumbing tools and pipes" },
    services: [
      { url: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=600&q=80&fit=crop", alt: "Leak detection" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&fit=crop", alt: "Drain cleaning" },
      { url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80&fit=crop", alt: "Pipe replacement" },
      { url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80&fit=crop", alt: "Water heater service" },
      { url: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=600&q=80&fit=crop", alt: "Bathroom plumbing" },
      { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80&fit=crop", alt: "Emergency plumbing repair" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80&fit=crop", alt: "Repaired bathroom plumbing" },
      { url: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800&q=80&fit=crop", alt: "Fixed leak" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80&fit=crop", alt: "Cleared drain" },
      { url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80&fit=crop", alt: "New water heater install" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Master Plumber" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1621905251918-96b8b47c5f8e?w=1200&q=80&fit=crop", alt: "Call for emergency plumbing" },
  },

  heroHeadline: "Fast Plumbing Fixes, 24 Hours a Day",
  heroSubline: "Licensed plumbers on call around the clock — from leaky taps to full pipe replacements.",
  heroBadge: "🚰 24/7 Emergency Service",
  heroCTA: "Call Now",
  heroSecondaryCTA: "Book Online",
  siteName: "FlowMaster Plumbing",
  tagline: "Licensed plumbers, available around the clock",
  phone: "+1 (555) 209-4471",
  email: "help@flowmasterplumbing.com",
  address: "34 Waterworks Lane, Metro City",
  aboutHeading: "Licensed Plumbers, On Call 24/7 Since 2011",
  aboutBody: "FlowMaster Plumbing handles everything from dripping taps to full pipe replacements and emergency burst-pipe callouts. Every plumber is licensed, insured and drug-tested, and we offer upfront pricing before any work begins — no surprises on the invoice.",
  aboutHighlights: ["Licensed & insured plumbers", "24/7 emergency callout", "Upfront pricing before work starts", "Fully stocked trucks — most jobs same visit", "12+ years serving the community"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Emergency", url: "#contact" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Emergency Callout", description: "Burst pipes, major leaks and no-water emergencies — our on-call plumber responds day or night.", icon: "🚨", iconType: "emoji", price: "From $220", imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Leak Detection & Repair", description: "Non-invasive leak detection technology finds hidden leaks before they cause major damage.", icon: "💧", iconType: "emoji", price: "From $150", imageUrl: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Drain Cleaning", description: "Blocked drains cleared fast with hydro-jetting and camera inspection to confirm the fix.", icon: "🌀", iconType: "emoji", price: "From $120", imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Pipe Replacement", description: "Full or partial repiping for ageing homes, using modern durable materials with minimal wall disruption.", icon: "🔧", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Water Heater Service", description: "Installation, repair and maintenance of tank and tankless water heaters, all major brands.", icon: "🔥", iconType: "emoji", price: "From $320", imageUrl: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bathroom Plumbing", description: "New fixture installs, toilet repairs and full bathroom re-plumbing for renovations.", icon: "🚽", iconType: "emoji", price: "From $180", imageUrl: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "24/7", label: "Emergency Availability" },
    { id: uid("st"), value: "45 min", label: "Avg. Callout Time" },
    { id: uid("st"), value: "12 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "Customer Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Bill Sanderson", role: "Homeowner", content: "Burst pipe at 2am and they had someone out within the hour. Fixed it fast and the price matched the quote exactly.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Carla Jimenez", role: "Homeowner", content: "Found a hidden slab leak that two other plumbers missed. Saved us from major foundation damage. Forever grateful.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Pete Wallace", role: "Property Manager", content: "Our go-to for all rental property plumbing. Always upfront on price, always shows up when they say they will.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Standard Callout", price: "$120", period: "/visit", description: "Business hours service call", features: ["Diagnostic included", "Upfront quote before work", "Fully stocked truck", "90-day workmanship warranty"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Emergency Callout", price: "$220", period: "/visit", description: "24/7 after-hours response", features: ["Available nights & weekends", "45-min average response", "Diagnostic included", "1-year workmanship warranty"], highlighted: true, badge: "Most Requested", ctaLabel: "Call Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Repipe Project", price: "Custom Quote", description: "Full or partial home repiping", features: ["Free on-site assessment", "Modern PEX or copper options", "Minimal wall disruption", "5-year workmanship warranty"], ctaLabel: "Get Assessment", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How fast can you respond to an emergency?", answer: "Our average response time for emergency callouts is 45 minutes within our core service area, available 24 hours a day." },
    { id: uid("f"), question: "Do you charge extra for after-hours calls?", answer: "Yes, after-hours and weekend emergency callouts have a separate rate from standard business-hours visits, quoted upfront before any work begins." },
    { id: uid("f"), question: "Can you detect leaks without breaking walls?", answer: "Yes, we use acoustic and thermal leak-detection technology to pinpoint hidden leaks with minimal to no demolition." },
    { id: uid("f"), question: "Are your plumbers licensed?", answer: "Yes, every FlowMaster plumber is fully licensed, insured and background-checked before joining our team." },
  ],
};

// ─── TEMPLATE 33: HeatWave (Gas & Heating Specialist) ─────────────────────────

const HEATWAVE_HVAC: TemplateIdentity = {
  slug: "heatwave-hvac",
  name: "HeatWave",
  description: "Bold gas and heating specialist template with a dark industrial aesthetic. Perfect for boiler installation, gas fitting, and central heating companies.",
  category: "HVAC & Plumbing",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1621905252507-c17c00d5d0e5?w=1200&q=85&fit=crop",
  tags: ["gas fitting", "heating", "boiler", "HVAC"],

  palette: {
    primary: "#dc2626",
    primaryFg: "#ffffff",
    secondary: "#18181b",
    accent: "#f87171",
    background: "#18181b",
    foreground: "#fafafa",
    muted: "#27272a",
    mutedFg: "#a1a1aa",
    card: "#27272a",
    border: "#3f3f46",
    ring: "#dc2626",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-heatwave-hvac h1,.template-heatwave-hvac h2 { text-transform: uppercase; }
    .template-heatwave-hvac .service-card { border-top: 3px solid #dc2626; background: #27272a; }
    .template-heatwave-hvac .stat-value { color: #dc2626; font-weight: 900; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1621905252507-c17c00d5d0e5?w=1600&q=90&fit=crop", alt: "Gas engineer servicing boiler" },
    about: { url: "https://images.unsplash.com/photo-1621905252189-72b656b799d5?w=800&q=80&fit=crop", alt: "Central heating system" },
    services: [
      { url: "https://images.unsplash.com/photo-1621905252507-c17c00d5d0e5?w=600&q=80&fit=crop", alt: "Boiler installation" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&fit=crop", alt: "Gas safety check" },
      { url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80&fit=crop", alt: "Water heater servicing" },
      { url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop", alt: "Radiator installation" },
      { url: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=600&q=80&fit=crop", alt: "Heating system repair" },
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", alt: "Gas line inspection" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1621905252507-c17c00d5d0e5?w=800&q=80&fit=crop", alt: "New boiler install" },
      { url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80&fit=crop", alt: "Water heater upgrade" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80&fit=crop", alt: "Serviced gas system" },
      { url: "https://images.unsplash.com/photo-1621905252189-72b656b799d5?w=800&q=80&fit=crop", alt: "Central heating upgrade" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Gas Safe Engineer" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1621905252507-c17c00d5d0e5?w=1200&q=80&fit=crop", alt: "Book a gas engineer" },
  },

  heroHeadline: "Warmth You Can Count On, All Year Round",
  heroSubline: "Certified gas fitters and heating engineers — boiler installs, servicing, and emergency callouts.",
  heroBadge: "🔥 Gas Safe Registered",
  heroCTA: "Book a Service",
  heroSecondaryCTA: "Emergency Callout",
  siteName: "HeatWave Heating & Gas",
  tagline: "Certified gas fitters and heating specialists",
  phone: "+1 (555) 833-9012",
  email: "service@heatwaveheating.com",
  address: "12 Furnace Row, Metro City",
  aboutHeading: "Gas Safe Registered Since 2009",
  aboutBody: "HeatWave installs, services and repairs boilers, gas heating systems and hot water systems for homes and businesses. Every engineer is Gas Safe registered and every job is backed by a written warranty. We offer same-week servicing and emergency callouts for no-heat situations.",
  aboutHighlights: ["Gas Safe registered engineers", "Written workmanship warranty", "Same-week servicing available", "Emergency no-heat callouts", "15+ years in gas & heating"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Boiler Installation", description: "New boiler supply and installation with full commissioning and Gas Safe certification.", icon: "🔥", iconType: "emoji", price: "From $2,800", imageUrl: "https://images.unsplash.com/photo-1621905252507-c17c00d5d0e5?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Boiler Servicing", description: "Annual boiler service and safety check to keep your system efficient and your warranty valid.", icon: "🛠️", iconType: "emoji", price: "From $110", imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Gas Safety Checks", description: "Landlord gas safety certificates (CP12) and full appliance safety inspections.", icon: "✅", iconType: "emoji", price: "From $95", imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Central Heating Installation", description: "Full central heating system design and installation for new builds and upgrades.", icon: "🏠", iconType: "emoji", price: "From $4,500", imageUrl: "https://images.unsplash.com/photo-1621905252189-72b656b799d5?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Water Heater Installation", description: "Tank and tankless hot water system installation and replacement, all major brands.", icon: "🚿", iconType: "emoji", price: "From $850", imageUrl: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Emergency No-Heat Callout", description: "Same-day emergency response for boiler breakdowns and complete loss of heating.", icon: "🚨", iconType: "emoji", price: "From $195", imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "15 yr", label: "Gas Safe Registered" },
    { id: uid("st"), value: "3,200+", label: "Boilers Serviced" },
    { id: uid("st"), value: "Same-Week", label: "Servicing Available" },
    { id: uid("st"), value: "4.9★", label: "Customer Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Harold Bennett", role: "Homeowner", content: "New boiler installed in a single day, fully certified, and they explained everything clearly. No pressure, no upselling.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Denise Okafor", role: "Landlord", content: "They handle CP12 certificates for all 6 of my rental properties every year. Always on time, always thorough.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Ray Torres", role: "Homeowner", content: "Boiler broke down in the middle of winter and they had a technician out same day. Absolute lifesavers.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Annual Service", price: "$110", period: "/year", description: "Standard boiler service", features: ["Full safety inspection", "Efficiency tune-up", "Warranty compliance check", "Service record provided"], ctaLabel: "Book Service", ctaUrl: "#contact" },
    { id: uid("p"), name: "Boiler Install", price: "From $2,800", description: "New boiler, fully installed", features: ["Free on-site quote", "Gas Safe certified install", "Old boiler removed", "7-year manufacturer warranty", "1-year labour warranty"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Care Plan", price: "$18", period: "/mo", description: "Ongoing coverage & priority service", features: ["Annual service included", "Priority emergency callout", "Discounted parts & labour", "No-heat response within 24hrs"], ctaLabel: "Join Care Plan", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Are your engineers Gas Safe registered?", answer: "Yes, every HeatWave engineer is Gas Safe registered and their ID card can be checked on-site before any work begins." },
    { id: uid("f"), question: "How often should my boiler be serviced?", answer: "We recommend an annual service to maintain efficiency, safety, and manufacturer warranty compliance." },
    { id: uid("f"), question: "Do you provide landlord gas safety certificates?", answer: "Yes, we issue CP12 landlord gas safety certificates same-day following inspection, valid for 12 months." },
    { id: uid("f"), question: "What happens if my boiler breaks down in winter?", answer: "Call our emergency line — we prioritise no-heat situations and typically dispatch a technician the same day." },
  ],
};

// ─── TEMPLATE 34: TotalBuilds (Multi-Trade Building Services) ────────────────

const TOTALBUILDS_SERVICES: TemplateIdentity = {
  slug: "totalbuilds-services",
  name: "TotalBuilds",
  description: "Full-spectrum building services template covering plumbing, electrical, and HVAC under one roof. Designed for multi-trade service companies.",
  category: "HVAC & Plumbing",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=1200&q=85&fit=crop",
  tags: ["building services", "multi-trade", "HVAC", "plumbing", "electrical"],

  palette: {
    primary: "#16a34a",
    primaryFg: "#ffffff",
    secondary: "#0f172a",
    accent: "#4ade80",
    background: "#f0fdf4",
    foreground: "#0f172a",
    muted: "#dcfce7",
    mutedFg: "#166534",
    card: "#ffffff",
    border: "#bbf7d0",
    ring: "#16a34a",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-totalbuilds-services .service-card { border-left: 3px solid #16a34a; }
    .template-totalbuilds-services .stat-value { color: #16a34a; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=900&q=85&fit=crop", alt: "Multi-trade technician on site" },
    about: { url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80&fit=crop", alt: "Building services team" },
    services: [
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", alt: "HVAC service" },
      { url: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=600&q=80&fit=crop", alt: "Electrical work" },
      { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80&fit=crop", alt: "Plumbing service" },
      { url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80&fit=crop", alt: "Water heater install" },
      { url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80&fit=crop", alt: "Preventive maintenance" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&fit=crop", alt: "Drainage service" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80&fit=crop", alt: "Serviced commercial building" },
      { url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80&fit=crop", alt: "Residential building services" },
      { url: "https://images.unsplash.com/photo-1621905252507-c17c00d5d0e5?w=800&q=80&fit=crop", alt: "HVAC install" },
      { url: "https://images.unsplash.com/photo-1621905252189-72b656b799d5?w=800&q=80&fit=crop", alt: "Heating system upgrade" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Operations Lead" },
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Senior Technician" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=1200&q=80&fit=crop", alt: "Get a quote" },
  },

  heroHeadline: "One Call Covers It All",
  heroSubline: "Complete building services — plumbing, heating, and electrical solutions from a single trusted team.",
  heroBadge: "🔧 All Trades, One Team",
  heroCTA: "Request Service",
  heroSecondaryCTA: "View Services",
  siteName: "TotalBuilds Services",
  tagline: "Plumbing, heating and electrical — one team, one call",
  phone: "+1 (555) 460-7712",
  email: "service@totalbuilds.com",
  address: "77 Multiservice Drive, Metro City",
  aboutHeading: "One Team, Every Trade You Need",
  aboutBody: "TotalBuilds brings plumbing, electrical and HVAC under one roof, so property owners get one point of contact instead of juggling three contractors. Every technician is licensed in their trade, and our coordinated scheduling means multi-trade jobs get done in fewer visits.",
  aboutHighlights: ["Licensed in plumbing, electrical & HVAC", "One point of contact for every trade", "Coordinated multi-trade scheduling", "Upfront, itemised quotes", "10+ years serving the community"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "HVAC Services", description: "Installation, repair and maintenance of heating and cooling systems for homes and businesses.", icon: "❄️", iconType: "emoji", price: "From $180", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Electrical Services", description: "Panel upgrades, rewiring, lighting installation and code-compliance electrical work.", icon: "⚡", iconType: "emoji", price: "From $150", imageUrl: "https://images.unsplash.com/photo-1621905252472-943afaa20e20?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Plumbing Services", description: "Leak repairs, drain cleaning, fixture installation and pipe replacement.", icon: "🚰", iconType: "emoji", price: "From $130", imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Water Heater Services", description: "Installation and repair of tank and tankless water heaters, all major brands.", icon: "🔥", iconType: "emoji", price: "From $290", imageUrl: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Preventive Maintenance", description: "Multi-trade maintenance plans covering HVAC, plumbing and electrical inspections.", icon: "🗓️", iconType: "emoji", price: "From $380/mo", imageUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Drainage & Sewer", description: "Drain clearing, sewer line inspection and repair using camera diagnostic equipment.", icon: "🌀", iconType: "emoji", price: "From $140", imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "3", label: "Trades Under One Roof" },
    { id: uid("st"), value: "10 yr", label: "In Business" },
    { id: uid("st"), value: "1,900+", label: "Jobs Completed" },
    { id: uid("st"), value: "4.8★", label: "Customer Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Louise Grant", role: "Homeowner", content: "Rewired our kitchen and replaced our water heater in the same visit. So much easier than booking two separate companies.", rating: 5, avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Omar Farouk", role: "Property Manager", content: "One maintenance plan covers HVAC, plumbing and electrical across our whole building portfolio. Massive time saver.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Vanessa Cruz", role: "Homeowner", content: "Straightforward pricing and technicians who actually explained what was wrong instead of just fixing and leaving. Great experience.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Single Trade", price: "From $130", description: "One-off repair or service", features: ["Choose plumbing, electrical or HVAC", "Upfront quote", "Same-week booking", "90-day workmanship warranty"], ctaLabel: "Request Service", ctaUrl: "#contact" },
    { id: uid("p"), name: "Multi-Trade Plan", price: "$380", period: "/mo", description: "Coordinated maintenance, all trades", features: ["Quarterly HVAC service", "Bi-annual electrical & plumbing check", "Priority scheduling", "10% off additional repairs"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Portfolio Plan", price: "Custom", description: "Multi-property management", features: ["Custom SLA per property", "Consolidated billing", "Dedicated account manager"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Can one technician handle multiple trades?", answer: "Each job is handled by a technician licensed in that specific trade — plumbing, electrical or HVAC — but our scheduling coordinates them so multi-trade jobs happen in as few visits as possible." },
    { id: uid("f"), question: "Do you offer maintenance plans across all trades?", answer: "Yes, our Multi-Trade Plan bundles HVAC, plumbing and electrical inspections into one coordinated maintenance schedule." },
    { id: uid("f"), question: "Are you licensed in every trade you offer?", answer: "Yes, every TotalBuilds technician is fully licensed and insured in their specific trade before working on any job." },
    { id: uid("f"), question: "Can you manage maintenance for multiple properties?", answer: "Yes, our Portfolio Plan is designed for property managers with multiple buildings, offering consolidated billing and a dedicated account manager." },
  ],

  team: [
    { id: uid("tm"), name: "Frank Delgado", role: "Operations Lead", bio: "Coordinates scheduling across all three trades to minimise site visits and turnaround time.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Wendy Zhao", role: "Senior Technician", bio: "10 years across HVAC and electrical trades. Leads training for new multi-trade hires.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 35: Lumiere (Beauty Salon) ─────────────────────────────────────

const LUMIERE_SALON: TemplateIdentity = {
  slug: "lumiere-salon",
  name: "Lumiere",
  description: "Luxurious beauty salon template with a soft, elegant aesthetic. Features service menus, team profiles, and seamless online booking integration.",
  category: "Health & Beauty",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=85&fit=crop",
  tags: ["beauty salon", "hair", "nails", "beauty", "spa"],

  palette: {
    primary: "#ec4899",
    primaryFg: "#ffffff",
    secondary: "#881337",
    accent: "#f9a8d4",
    background: "#fdf2f8",
    foreground: "#500724",
    muted: "#fce7f3",
    mutedFg: "#9d174d",
    card: "#ffffff",
    border: "#fbcfe8",
    ring: "#ec4899",
    borderRadius: "1rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "600",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-lumiere-salon .hero-badge { background: #ec4899; color: white; border-radius: 9999px; }
    .template-lumiere-salon .service-card { border-radius: 1rem; }
    .template-lumiere-salon .stat-value { color: #ec4899; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=85&fit=crop", alt: "Elegant salon interior" },
    about: { url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80&fit=crop", alt: "Stylist at work" },
    services: [
      { url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&fit=crop", alt: "Hair styling" },
      { url: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80&fit=crop", alt: "Hair coloring" },
      { url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop", alt: "Manicure service" },
      { url: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop", alt: "Facial treatment" },
      { url: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80&fit=crop", alt: "Makeup application" },
      { url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&fit=crop", alt: "Blowout styling" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=800&q=80&fit=crop", alt: "Salon chairs" },
      { url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&fit=crop", alt: "Finished hairstyle" },
      { url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80&fit=crop", alt: "Nail art" },
      { url: "https://images.unsplash.com/photo-1487412912498-0447579c8d4e?w=800&q=80&fit=crop", alt: "Relaxation area" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&q=80&fit=crop&face", alt: "Senior Stylist" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Color Specialist" },
      { url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80&fit=crop&face", alt: "Nail Technician" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80&fit=crop", alt: "Book your appointment" },
  },

  heroHeadline: "Beauty That Speaks for Itself",
  heroSubline: "A premium salon experience for hair, nails, and beauty — where every visit leaves you glowing.",
  heroBadge: "💅 Book Online in Seconds",
  heroCTA: "Book Appointment",
  heroSecondaryCTA: "View Services",
  siteName: "Lumiere Salon",
  tagline: "Beauty that speaks for itself",
  phone: "+1 (555) 902-4471",
  email: "hello@lumieresalon.com",
  address: "212 Blossom Avenue, Uptown District",
  aboutHeading: "Where Every Visit Leaves You Glowing",
  aboutBody: "Lumiere brings together a team of award-winning stylists, colorists and beauty specialists in one elegant space. From precision haircuts to full color transformations, bridal styling to gel manicures, we treat every client to a premium, unhurried experience.",
  aboutHighlights: ["Award-winning senior stylists", "Premium cruelty-free products", "Complimentary consultation with every booking", "Online booking with instant confirmation"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "Team", url: "#team" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Cut & Style", description: "Precision haircut and blowout styling tailored to your face shape and hair type.", icon: "✂️", iconType: "emoji", price: "From $65", imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Color & Highlights", description: "Full color, balayage and highlight services using premium ammonia-free formulas.", icon: "🎨", iconType: "emoji", price: "From $120", imageUrl: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Manicure & Pedicure", description: "Classic and gel manicures, spa pedicures and nail art by our in-house nail team.", icon: "💅", iconType: "emoji", price: "From $45", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Facials & Skincare", description: "Customised facials targeting hydration, brightening and anti-aging concerns.", icon: "✨", iconType: "emoji", price: "From $85", imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bridal & Event Styling", description: "Full hair and makeup packages for weddings and special events, including trials.", icon: "👰", iconType: "emoji", price: "From $250", imageUrl: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Blowout Bar", description: "Express blowouts for special occasions or a mid-week refresh — no appointment needed.", icon: "💨", iconType: "emoji", price: "From $40", imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "5,000+", label: "Clients Styled" },
    { id: uid("st"), value: "4.9★", label: "Average Rating" },
    { id: uid("st"), value: "10 yr", label: "In Business" },
    { id: uid("st"), value: "8", label: "Master Stylists" },
  ],

  testimonials: [
    { id: uid("t"), name: "Sophia Reyes", role: "Regular Client", content: "My colorist understands exactly what I want every single time. Best salon experience I've ever had.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Grace Kim", role: "Bride", content: "Trial and wedding-day styling were flawless. My hair held up all night through dancing. Thank you Lumiere!", rating: 5, avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Priya Malhotra", role: "Regular Client", content: "The nail team is incredibly talented — my gel manicures last three weeks without chipping.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Signature", price: "$65", description: "Cut & style", features: ["Consultation included", "Precision cut", "Blowout finish"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Color Package", price: "$180", description: "Full color transformation", features: ["Full color or balayage", "Toner & gloss", "Cut & style included", "Take-home care kit"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Bridal Package", price: "From $450", description: "Complete wedding-day styling", features: ["Trial session included", "Hair & makeup", "On-location available", "Touch-up kit provided"], ctaLabel: "Book Now", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do I need to book in advance?", answer: "We recommend booking 1-2 weeks ahead for color services and 3+ months for bridal packages, though we do accept walk-ins for blowouts when availability allows." },
    { id: uid("f"), question: "What products do you use?", answer: "We use premium, cruelty-free and largely ammonia-free product lines across all our color and styling services." },
    { id: uid("f"), question: "Can I request a specific stylist?", answer: "Absolutely — you can select your preferred stylist during online booking, or we'll match you based on your service needs." },
    { id: uid("f"), question: "What's your cancellation policy?", answer: "We ask for at least 24 hours notice for cancellations or rescheduling to avoid a cancellation fee." },
  ],

  team: [
    { id: uid("tm"), name: "Isabella Rossi", role: "Senior Stylist & Owner", bio: "15 years in luxury salons across three countries. Specialises in precision cutting and color correction.", avatar: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Maya Chen", role: "Color Specialist", bio: "Certified balayage expert with a passion for natural, dimensional color.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Lucia Fernandez", role: "Nail Technician", bio: "Award-winning nail artist known for intricate hand-painted designs.", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 36: FadeShop (Barbershop) ──────────────────────────────────────

const FADE_BARBERSHOP: TemplateIdentity = {
  slug: "fade-barbershop",
  name: "FadeShop",
  description: "Cool, urban barbershop template with a dark, masculine aesthetic. Designed for modern barbers and grooming studios targeting style-conscious clients.",
  category: "Health & Beauty",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=85&fit=crop",
  tags: ["barbershop", "haircut", "grooming", "barber", "men's hair"],

  palette: {
    primary: "#fbbf24",
    primaryFg: "#1c1917",
    secondary: "#52525b",
    accent: "#fde68a",
    background: "#1c1917",
    foreground: "#fafaf9",
    muted: "#292524",
    mutedFg: "#a8a29e",
    card: "#292524",
    border: "#44403c",
    ring: "#fbbf24",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-fade-barbershop h1,.template-fade-barbershop h2 { text-transform: uppercase; }
    .template-fade-barbershop .service-card { border-top: 3px solid #fbbf24; background: #292524; }
    .template-fade-barbershop .stat-value { color: #fbbf24; font-weight: 900; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&q=90&fit=crop", alt: "Barber giving a fade haircut" },
    about: { url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&fit=crop", alt: "Barbershop interior" },
    services: [
      { url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80&fit=crop", alt: "Fade haircut" },
      { url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80&fit=crop", alt: "Beard trim" },
      { url: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop", alt: "Hot towel shave" },
      { url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80&fit=crop", alt: "Kids haircut" },
      { url: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=600&q=80&fit=crop", alt: "Hair design" },
      { url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80&fit=crop", alt: "Classic cut" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80&fit=crop", alt: "Finished fade" },
      { url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&q=80&fit=crop", alt: "Sharp beard line-up" },
      { url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&q=80&fit=crop", alt: "Shop interior" },
      { url: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=800&q=80&fit=crop", alt: "Custom hair design" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Master Barber" },
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Senior Barber" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80&fit=crop", alt: "Book your cut" },
  },

  heroHeadline: "Sharp Cuts, Clean Lines",
  heroSubline: "The neighbourhood's go-to barbershop — book your cut and walk out a new man.",
  heroBadge: "💈 Walk-Ins Welcome",
  heroCTA: "Book a Cut",
  heroSecondaryCTA: "View Styles",
  siteName: "FadeShop Barbers",
  tagline: "Sharp cuts, clean lines",
  phone: "+1 (555) 337-9081",
  email: "book@fadeshop.com",
  address: "45 Barber Row, Downtown District",
  aboutHeading: "The Neighbourhood's Go-To Barbershop Since 2016",
  aboutBody: "FadeShop combines old-school barbering craft with modern style. Our barbers are trained in precision fades, beard sculpting and hot towel shaves, and we've built a loyal following of clients who trust us with their look week after week.",
  aboutHighlights: ["Licensed master barbers", "Hot towel shave included with every cut", "Walk-ins welcome, appointments preferred", "Kids cuts available"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "Team", url: "#team" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Classic Fade", description: "Precision fade haircut, tailored to your preferred style — skin fade, taper or blowout.", icon: "💇", iconType: "emoji", price: "From $35", imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Beard Trim & Line-Up", description: "Sharp beard shaping and line-up with straight razor detailing.", icon: "🧔", iconType: "emoji", price: "From $20", imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Hot Towel Shave", description: "Traditional hot towel straight razor shave for the smoothest finish.", icon: "🪒", iconType: "emoji", price: "From $30", imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Kids Cut", description: "Patient, friendly haircuts for kids 12 and under.", icon: "🧒", iconType: "emoji", price: "From $22", imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Hair Design", description: "Custom hair art and design work for a truly unique look.", icon: "🎨", iconType: "emoji", price: "From $45", imageUrl: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Full Grooming Package", description: "Cut, beard trim and hot towel shave combined for the complete refresh.", icon: "✨", iconType: "emoji", price: "From $65", imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "8,000+", label: "Cuts Given" },
    { id: uid("st"), value: "9 yr", label: "In Business" },
    { id: uid("st"), value: "4.8★", label: "Average Rating" },
    { id: uid("st"), value: "5", label: "Master Barbers" },
  ],

  testimonials: [
    { id: uid("t"), name: "Marcus Bell", role: "Regular Client", content: "Been coming here for 3 years. Same barber every time, never disappointed. Best fade in the city.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Andre Watson", role: "Regular Client", content: "The hot towel shave is worth it alone. Clean, professional shop with a great vibe.", rating: 5 },
    { id: uid("t"), name: "Julian Ford", role: "First-Time Client", content: "Walked in without an appointment on a Saturday and still got seen within 15 minutes. Great cut too.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Cut Only", price: "$35", description: "Classic fade or taper", features: ["Precision fade", "Neck & edge cleanup", "Style finish"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Cut & Beard", price: "$50", description: "Most popular combo", features: ["Precision fade", "Beard trim & line-up", "Hot towel finish"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Grooming", price: "$65", description: "The complete refresh", features: ["Precision fade", "Beard trim & line-up", "Hot towel shave", "Hair styling product included"], ctaLabel: "Book Now", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you take walk-ins?", answer: "Yes, walk-ins are welcome, though appointments are recommended on weekends to avoid a wait." },
    { id: uid("f"), question: "How long does a typical cut take?", answer: "A standard cut takes about 30 minutes; the full grooming package takes closer to 50 minutes." },
    { id: uid("f"), question: "Can I request a specific barber?", answer: "Yes, you can select your preferred barber when booking online or by calling the shop." },
    { id: uid("f"), question: "Do you cut kids' hair?", answer: "Yes, we offer patient, friendly cuts for kids 12 and under at a discounted rate." },
  ],

  team: [
    { id: uid("tm"), name: "Tony Marchetti", role: "Master Barber & Owner", bio: "20 years behind the chair. Trained in classic and modern fade techniques.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Jerome Banks", role: "Senior Barber", bio: "Specialist in hair design and creative fades. Known for his sharp line-ups.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 37: SmileStudio (Dental Clinic) ────────────────────────────────

const SMILESTUDIO_DENTAL: TemplateIdentity = {
  slug: "smilestudio-dental",
  name: "SmileStudio",
  description: "Clean and reassuring dental clinic template with a modern, clinical-yet-welcoming design. Highlights treatments, team credentials, and patient comfort.",
  category: "Health & Beauty",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=85&fit=crop",
  tags: ["dental", "dentist", "oral health", "clinic", "teeth"],

  palette: {
    primary: "#38bdf8",
    primaryFg: "#ffffff",
    secondary: "#1e3a5f",
    accent: "#7dd3fc",
    background: "#f0f9ff",
    foreground: "#0c4a6e",
    muted: "#e0f2fe",
    mutedFg: "#0369a1",
    card: "#ffffff",
    border: "#bae6fd",
    ring: "#38bdf8",
    borderRadius: "0.75rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-smilestudio-dental .hero-badge { background: #38bdf8; color: white; border-radius: 9999px; }
    .template-smilestudio-dental .service-card { border-top: 3px solid #38bdf8; }
    .template-smilestudio-dental .stat-value { color: #0284c7; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=900&q=85&fit=crop", alt: "Modern dental clinic" },
    about: { url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80&fit=crop", alt: "Dentist with patient" },
    services: [
      { url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&q=80&fit=crop", alt: "Dental checkup" },
      { url: "https://images.unsplash.com/photo-1571772805064-207c8435df79?w=600&q=80&fit=crop", alt: "Teeth whitening" },
      { url: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&q=80&fit=crop", alt: "Dental implants" },
      { url: "https://images.unsplash.com/photo-1606811842243-e0d92aa76b4d?w=600&q=80&fit=crop", alt: "Orthodontics" },
      { url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80&fit=crop", alt: "Pediatric dentistry" },
      { url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80&fit=crop", alt: "Root canal treatment" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80&fit=crop", alt: "Modern treatment room" },
      { url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&q=80&fit=crop", alt: "Clinic reception" },
      { url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80&fit=crop", alt: "Dental equipment" },
      { url: "https://images.unsplash.com/photo-1571772805064-207c8435df79?w=800&q=80&fit=crop", alt: "Happy patient smiling" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&fit=crop&face", alt: "Lead Dentist" },
      { url: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80&fit=crop&face", alt: "Orthodontist" },
      { url: "https://images.unsplash.com/photo-1637059824899-a441006a6875?w=400&q=80&fit=crop&face", alt: "Dental Hygienist" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=80&fit=crop", alt: "Book your appointment" },
  },

  heroHeadline: "Your Healthiest Smile Starts Here",
  heroSubline: "Comprehensive dental care for the whole family — gentle, modern, and always welcoming.",
  heroBadge: "🦷 New Patients Welcome",
  heroCTA: "Book Appointment",
  heroSecondaryCTA: "Our Services",
  siteName: "SmileStudio Dental",
  tagline: "Your healthiest smile starts here",
  phone: "+1 (555) 618-4402",
  email: "hello@smilestudiodental.com",
  address: "300 Wellness Blvd, Suite 100, Metro City",
  aboutHeading: "Gentle, Modern Dental Care for the Whole Family",
  aboutBody: "SmileStudio combines the latest dental technology with a genuinely welcoming, low-anxiety environment. Our dentists and hygienists take time to explain every step, offer sedation options for anxious patients, and treat every visit — from routine cleanings to full smile makeovers — with the same level of care.",
  aboutHighlights: ["Same-week appointments available", "Sedation options for anxious patients", "Digital X-rays — 90% less radiation", "In-house payment plans available"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "About", url: "#about" },
    { id: "n3", label: "Team", url: "#team" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "General Checkups & Cleanings", description: "Comprehensive exams, professional cleanings and preventive care for the whole family.", icon: "🦷", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Teeth Whitening", description: "Professional in-office and take-home whitening treatments for a brighter smile.", icon: "✨", iconType: "emoji", price: "From $299", imageUrl: "https://images.unsplash.com/photo-1571772805064-207c8435df79?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Dental Implants", description: "Permanent tooth replacement with titanium implants and natural-looking crowns.", icon: "🔩", iconType: "emoji", price: "From $2,800", imageUrl: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Orthodontics & Invisalign", description: "Traditional braces and clear aligner treatment for kids, teens and adults.", icon: "😬", iconType: "emoji", price: "From $3,500", imageUrl: "https://images.unsplash.com/photo-1606811842243-e0d92aa76b4d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Pediatric Dentistry", description: "Gentle, kid-friendly dental care in a fun, welcoming environment.", icon: "👶", iconType: "emoji", price: "From $75", imageUrl: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Root Canal Treatment", description: "Comfortable, modern root canal therapy to save damaged or infected teeth.", icon: "🩺", iconType: "emoji", price: "From $950", imageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "12,000+", label: "Patients Treated" },
    { id: uid("st"), value: "4.9★", label: "Patient Rating" },
    { id: uid("st"), value: "20 yr", label: "In Practice" },
    { id: uid("st"), value: "Same-Week", label: "Appointments" },
  ],

  testimonials: [
    { id: uid("t"), name: "Rachel Simmons", role: "Patient", content: "I've always been terrified of the dentist, but this team made me feel completely at ease. Best dental experience I've had.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Tom Bradley", role: "Patient", content: "Got my Invisalign treatment here — results were even better than expected and the team explained every step.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Linda Park", role: "Parent", content: "My kids actually look forward to their dental visits now. The pediatric team is amazing with children.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "New Patient Exam", price: "$89", description: "Comprehensive checkup", features: ["Full exam & X-rays", "Professional cleaning", "Treatment plan review"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Family Care Plan", price: "$39", period: "/mo", description: "Ongoing care for the family", features: ["2 cleanings/year per member", "Discounted treatments", "Priority scheduling", "No insurance required"], highlighted: true, badge: "Most Popular", ctaLabel: "Join Plan", ctaUrl: "#contact" },
    { id: uid("p"), name: "Smile Makeover", price: "Custom Quote", description: "Comprehensive cosmetic treatment", features: ["Free consultation", "Custom treatment plan", "Financing options available"], ctaLabel: "Get Consultation", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you accept dental insurance?", answer: "Yes, we work with most major dental insurance providers and also offer in-house payment plans for uninsured patients." },
    { id: uid("f"), question: "Do you offer sedation for anxious patients?", answer: "Yes, we offer nitrous oxide and oral sedation options for patients who feel anxious about dental visits." },
    { id: uid("f"), question: "How often should I get a checkup?", answer: "We recommend a checkup and cleaning every 6 months for most patients, though some cases may need more frequent visits." },
    { id: uid("f"), question: "Do you see children?", answer: "Yes, our pediatric team specialises in gentle, kid-friendly care starting from a child's first tooth." },
  ],

  team: [
    { id: uid("tm"), name: "Dr. Michael Tran", role: "Lead Dentist & Founder", bio: "20 years in general and cosmetic dentistry. Focuses on making every patient feel comfortable and informed.", avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Dr. Sarah Whitfield", role: "Orthodontist", bio: "Specialist in Invisalign and traditional orthodontics for patients of all ages.", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Emily Zhang", role: "Dental Hygienist", bio: "Gentle, thorough cleanings with a focus on patient education and preventive care.", avatar: "https://images.unsplash.com/photo-1637059824899-a441006a6875?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 38: IronForge (Gym & Fitness Centre) ───────────────────────────

const IRONFORGE_GYM: TemplateIdentity = {
  slug: "ironforge-gym",
  name: "IronForge",
  description: "Powerful gym and fitness centre template with a dark, motivational aesthetic. Features membership tiers, class schedules, and trainer profiles.",
  category: "Fitness & Sports",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=85&fit=crop",
  tags: ["gym", "fitness", "weights", "membership", "classes"],

  palette: {
    primary: "#ef4444",
    primaryFg: "#ffffff",
    secondary: "#111827",
    accent: "#f87171",
    background: "#111827",
    foreground: "#f9fafb",
    muted: "#1f2937",
    mutedFg: "#9ca3af",
    card: "#1f2937",
    border: "#374151",
    ring: "#ef4444",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.03em",
  },
  customCss: `
    .template-ironforge-gym h1,.template-ironforge-gym h2 { text-transform: uppercase; letter-spacing: 0.02em; }
    .template-ironforge-gym .service-card { border-top: 3px solid #ef4444; background: #1f2937; }
    .template-ironforge-gym .stat-value { color: #ef4444; font-weight: 900; font-size: 2.5rem; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=90&fit=crop", alt: "Gym weight room" },
    about: { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&fit=crop", alt: "Group fitness class" },
    services: [
      { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&fit=crop", alt: "Weight training" },
      { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&fit=crop", alt: "Group class" },
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop", alt: "Personal training" },
      { url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80&fit=crop", alt: "Cardio equipment" },
      { url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80&fit=crop", alt: "CrossFit training" },
      { url: "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=600&q=80&fit=crop", alt: "Yoga class" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&fit=crop", alt: "Main gym floor" },
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&fit=crop", alt: "Free weights area" },
      { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&fit=crop", alt: "Group class in session" },
      { url: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80&fit=crop", alt: "CrossFit box" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80&fit=crop&face", alt: "Head Trainer" },
      { url: "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400&q=80&fit=crop&face", alt: "Strength Coach" },
      { url: "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&q=80&fit=crop&face", alt: "Yoga Instructor" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80&fit=crop", alt: "Join IronForge" },
  },

  heroHeadline: "Forge Your Best Self",
  heroSubline: "State-of-the-art gym with expert trainers, diverse classes, and a community that drives results.",
  heroBadge: "💪 First Class Free",
  heroCTA: "Start Free Trial",
  heroSecondaryCTA: "View Classes",
  siteName: "IronForge Fitness",
  tagline: "Forge your best self",
  phone: "+1 (555) 774-6620",
  email: "join@ironforgefitness.com",
  address: "500 Muscle Beach Way, Metro City",
  aboutHeading: "A Community Built on Results, Since 2013",
  aboutBody: "IronForge is more than a gym — it's a community. Our 15,000 sq ft facility features free weights, functional training zones, a dedicated CrossFit box and studio space for over 30 weekly classes. Our certified trainers design programs around your goals, not a one-size-fits-all plan.",
  aboutHighlights: ["15,000 sq ft training facility", "30+ weekly classes included", "Certified personal trainers on staff", "24/7 keycard access", "No long-term contracts required"],

  navItems: [
    { id: "n1", label: "Membership", url: "#pricing" },
    { id: "n2", label: "Classes", url: "#services" },
    { id: "n3", label: "Trainers", url: "#team" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Join Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Open Gym Access", description: "Full access to free weights, machines and cardio equipment during all operating hours.", icon: "🏋️", iconType: "emoji", price: "Included in membership", imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Group Classes", description: "HIIT, spin, strength circuits and more — 30+ classes a week included with membership.", icon: "🔥", iconType: "emoji", price: "Included in membership", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Personal Training", description: "One-on-one coaching with a certified trainer, customised to your specific goals.", icon: "👤", iconType: "emoji", price: "From $65/session", imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "CrossFit Training", description: "High-intensity functional fitness classes in our dedicated CrossFit box.", icon: "🏆", iconType: "emoji", price: "From $150/mo", imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Yoga & Recovery", description: "Yoga, stretching and mobility classes to balance out your strength training.", icon: "🧘", iconType: "emoji", price: "Included in membership", imageUrl: "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Nutrition Coaching", description: "One-on-one nutrition planning to complement your training program.", icon: "🥗", iconType: "emoji", price: "From $80/mo", imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "2,500+", label: "Active Members" },
    { id: uid("st"), value: "30+", label: "Weekly Classes" },
    { id: uid("st"), value: "12 yr", label: "In Business" },
    { id: uid("st"), value: "24/7", label: "Access Available" },
  ],

  testimonials: [
    { id: uid("t"), name: "Derek Holloway", role: "Member, 3 years", content: "Lost 40 pounds and gained a community that actually motivates me to show up. Best decision I've made.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Michelle Torres", role: "Member, 1 year", content: "The trainers here actually know what they're doing. My personal trainer built a program around my old knee injury and it's worked wonders.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "James Whitfield", role: "Member, 6 months", content: "24/7 access means I can train at 5am before work. No excuses, no crowds. Perfect for my schedule.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Basic", price: "$49", period: "/mo", description: "Gym floor access", features: ["Open gym access", "Locker room access", "Free fitness assessment", "No contract"], ctaLabel: "Join Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Unlimited", price: "$89", period: "/mo", description: "Everything included", features: ["Open gym access", "Unlimited group classes", "24/7 keycard access", "Guest passes (2/mo)", "No contract"], highlighted: true, badge: "Most Popular", ctaLabel: "Join Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Elite", price: "$179", period: "/mo", description: "Unlimited + personal training", features: ["Everything in Unlimited", "4 PT sessions/month", "Nutrition coaching included", "Priority class booking"], ctaLabel: "Join Now", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Is there a contract?", answer: "No, all our memberships are month-to-month with no long-term contract required. Cancel any time with 30 days notice." },
    { id: uid("f"), question: "Can I try before joining?", answer: "Yes, your first class is free — just book online or walk in and mention you're trying us out." },
    { id: uid("f"), question: "Do I need experience to join a class?", answer: "Not at all, our classes are designed for all fitness levels and our instructors offer modifications for beginners." },
    { id: uid("f"), question: "Is the gym open 24/7?", answer: "Unlimited and Elite members get 24/7 keycard access. Basic members have access during staffed hours, 5am-11pm daily." },
  ],

  team: [
    { id: uid("tm"), name: "Coach Diesel Martinez", role: "Head Trainer & Owner", bio: "Former competitive powerlifter with 15 years of coaching experience. Leads our strength programming.", avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Coach Alicia Brooks", role: "Strength Coach", bio: "Certified strength and conditioning specialist, focuses on injury-safe programming.", avatar: "https://images.unsplash.com/photo-1571019613576-2b22c76fd955?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Coach Priya Nair", role: "Yoga & Mobility Instructor", bio: "500-hour certified yoga instructor specialising in athlete recovery and mobility.", avatar: "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 39: PeakPT (Personal Trainer) ──────────────────────────────────

const PEAK_PT: TemplateIdentity = {
  slug: "peak-pt",
  name: "PeakPT",
  description: "Personal trainer template with a clean, results-driven design. Showcases transformation stories, training packages, and the trainer's philosophy.",
  category: "Fitness & Sports",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&q=85&fit=crop",
  tags: ["personal trainer", "PT", "fitness coaching", "weight loss", "strength"],

  palette: {
    primary: "#7c3aed",
    primaryFg: "#ffffff",
    secondary: "#2e1065",
    accent: "#a78bfa",
    background: "#faf5ff",
    foreground: "#3b0764",
    muted: "#f3e8ff",
    mutedFg: "#6b21a8",
    card: "#ffffff",
    border: "#e9d5ff",
    ring: "#7c3aed",
    borderRadius: "0.75rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-peak-pt .hero-badge { background: #7c3aed; color: white; border-radius: 9999px; }
    .template-peak-pt .service-card { border-top: 3px solid #7c3aed; }
    .template-peak-pt .stat-value { color: #7c3aed; font-weight: 900; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=900&q=85&fit=crop", alt: "Personal trainer coaching client" },
    about: { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&fit=crop", alt: "Trainer demonstrating exercise" },
    services: [
      { url: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&q=80&fit=crop", alt: "1-on-1 training session" },
      { url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80&fit=crop", alt: "Strength training" },
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop", alt: "Functional training" },
      { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&fit=crop", alt: "Small group training" },
      { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80&fit=crop", alt: "Nutrition coaching" },
      { url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop", alt: "Online coaching" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=800&q=80&fit=crop", alt: "Client transformation session" },
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&fit=crop", alt: "Training session" },
      { url: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80&fit=crop", alt: "Weight training progress" },
      { url: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80&fit=crop", alt: "Meal prep coaching" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80&fit=crop&face", alt: "Founder & Head Coach" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&q=80&fit=crop", alt: "Start your transformation" },
  },

  heroHeadline: "Train Smarter, Achieve More",
  heroSubline: "Personalised fitness coaching that fits your goals, your schedule, and your lifestyle.",
  heroBadge: "🏆 200+ Transformations",
  heroCTA: "Book Free Consultation",
  heroSecondaryCTA: "View Packages",
  siteName: "PeakPT Coaching",
  tagline: "Train smarter, achieve more",
  phone: "+1 (555) 220-8834",
  email: "coach@peakpt.com",
  address: "Online & In-Person, Metro City",
  aboutHeading: "200+ Transformations, One Personalised Approach",
  aboutBody: "PeakPT builds fitness programs around your actual life — not a generic template. Whether you're training for weight loss, strength, or a specific event, every program is built from an initial assessment and adjusted as you progress. Available in-person and fully online.",
  aboutHighlights: ["Certified strength & conditioning coach", "Custom programs, not templates", "In-person & online coaching available", "Nutrition guidance included", "200+ client transformations"],

  navItems: [
    { id: "n1", label: "Programs", url: "#services" },
    { id: "n2", label: "About", url: "#about" },
    { id: "n3", label: "Results", url: "#gallery" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Get Started", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "1-on-1 Personal Training", description: "Fully customised in-person training sessions built around your specific goals.", icon: "💪", iconType: "emoji", price: "From $85/session", imageUrl: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Online Coaching", description: "Remote coaching with custom workout plans, video check-ins and weekly progress reviews.", icon: "💻", iconType: "emoji", price: "From $199/mo", imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Small Group Training", description: "Semi-private sessions with 2-4 clients for a more affordable, community-driven experience.", icon: "👥", iconType: "emoji", price: "From $45/session", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Nutrition Coaching", description: "Personalised meal planning and nutrition guidance to complement your training.", icon: "🥗", iconType: "emoji", price: "From $120/mo", imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Strength Programming", description: "Structured strength training progressions for lifters at any experience level.", icon: "🏋️", iconType: "emoji", price: "From $85/session", imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Event Prep Coaching", description: "Specialised programming to prepare for races, competitions or specific fitness goals.", icon: "🏆", iconType: "emoji", price: "Custom Quote", imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "200+", label: "Transformations" },
    { id: uid("st"), value: "9 yr", label: "Coaching Experience" },
    { id: uid("st"), value: "4.9★", label: "Client Rating" },
    { id: uid("st"), value: "92%", label: "Goal Achievement Rate" },
  ],

  testimonials: [
    { id: uid("t"), name: "Rebecca Cole", role: "Client, 8 months", content: "Lost 35 pounds and gained more confidence than I've had in years. My coach adjusted the program every step of the way based on how I was actually feeling.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Marcus Webb", role: "Client, 1 year", content: "Trained for my first marathon with this program. Went from couch to 26.2 miles with zero injuries. Incredible coaching.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Diana Foster", role: "Online Client", content: "The online coaching kept me accountable even with a crazy travel schedule. Weekly check-ins made all the difference.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Starter", price: "$85", period: "/session", description: "Single training session", features: ["Full assessment", "Custom workout", "Form coaching", "No commitment"], ctaLabel: "Book Session", ctaUrl: "#contact" },
    { id: uid("p"), name: "Transform", price: "$650", period: "/mo", description: "8 sessions + full program", features: ["8 in-person sessions", "Custom program design", "Nutrition guidance", "Weekly check-ins"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Online Coaching", price: "$199", period: "/mo", description: "Fully remote coaching", features: ["Custom workout app access", "Weekly video check-ins", "Nutrition guidance", "Unlimited messaging support"], ctaLabel: "Get Started", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do I need prior gym experience?", answer: "Not at all — programs are built for your current fitness level, whether you're a complete beginner or advanced athlete." },
    { id: uid("f"), question: "Do you offer online coaching?", answer: "Yes, our online coaching package includes a custom program, weekly video check-ins and unlimited messaging support." },
    { id: uid("f"), question: "How is the program customised?", answer: "Every client starts with a full movement and goals assessment. Your program is adjusted every 2-4 weeks based on your progress." },
    { id: uid("f"), question: "Is nutrition coaching included?", answer: "Nutrition guidance is included in the Transform and Online Coaching packages, or can be added separately." },
  ],

  team: [
    { id: uid("tm"), name: "Coach Ryan Pierce", role: "Founder & Head Coach", bio: "Certified strength & conditioning specialist with 9 years of coaching experience. Has guided over 200 clients through complete transformations.", avatar: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 40: StrideActive (Sportswear Retail) ───────────────────────────

const STRIDE_ACTIVE: TemplateIdentity = {
  slug: "stride-active",
  name: "StrideActive",
  description: "Dynamic sportswear and activewear retail template with an energetic, bold design. Built for athletic apparel brands and sports equipment retailers.",
  category: "Retail & Shop",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=85&fit=crop",
  tags: ["sportswear", "activewear", "athletic", "gym wear", "retail"],

  palette: {
    primary: "#84cc16",
    primaryFg: "#052e16",
    secondary: "#14532d",
    accent: "#a3e635",
    background: "#0a0a0a",
    foreground: "#fafafa",
    muted: "#171717",
    mutedFg: "#a3a3a3",
    card: "#171717",
    border: "#262626",
    ring: "#84cc16",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-stride-active h1,.template-stride-active h2 { text-transform: uppercase; }
    .template-stride-active .service-card { border-top: 3px solid #84cc16; background: #171717; }
    .template-stride-active .stat-value { color: #84cc16; font-weight: 900; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1600&q=90&fit=crop", alt: "Athlete in activewear" },
    about: { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80&fit=crop", alt: "Activewear collection" },
    services: [
      { url: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=600&q=80&fit=crop", alt: "Running apparel" },
      { url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&fit=crop", alt: "Training gear" },
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop", alt: "Gym wear" },
      { url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80&fit=crop", alt: "Athletic shoes" },
      { url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop", alt: "Outdoor gear" },
      { url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80&fit=crop", alt: "Accessories" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80&fit=crop", alt: "New collection lookbook" },
      { url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80&fit=crop", alt: "Footwear collection" },
      { url: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80&fit=crop", alt: "Accessories display" },
      { url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&fit=crop", alt: "Training gear in action" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Brand Founder" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80&fit=crop", alt: "Shop the collection" },
  },

  heroHeadline: "Gear Up. Go Further.",
  heroSubline: "Performance activewear designed for every workout — built to move as hard as you do.",
  heroBadge: "🔥 New Season Drop",
  heroCTA: "Shop Now",
  heroSecondaryCTA: "View Collection",
  siteName: "StrideActive",
  tagline: "Gear up. Go further.",
  phone: "+1 (555) 448-2210",
  email: "support@strideactive.com",
  address: "88 Performance Way, Metro City",
  aboutHeading: "Built to Move as Hard as You Do",
  aboutBody: "StrideActive designs performance apparel for athletes who demand more from their gear. From moisture-wicking running kits to heavy-duty training wear, every piece is tested by real athletes before it hits our shelves. Free shipping on orders over $75, hassle-free 30-day returns.",
  aboutHighlights: ["Athlete-tested performance fabrics", "Free shipping over $75", "30-day hassle-free returns", "New drops every month"],

  navItems: [
    { id: "n1", label: "Shop", url: "#services" },
    { id: "n2", label: "Collection", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Running Apparel", description: "Lightweight, moisture-wicking running gear designed for every distance and weather condition.", icon: "🏃", iconType: "emoji", price: "From $45", imageUrl: "https://images.unsplash.com/photo-1483721310020-03333e577078?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Training Gear", description: "Durable strength and HIIT training apparel built to move with you through every rep.", icon: "🏋️", iconType: "emoji", price: "From $38", imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Athletic Footwear", description: "Performance running and training shoes from top brands, fitted by our in-store experts.", icon: "👟", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Outdoor & Trail Gear", description: "Weather-resistant apparel and gear for trail running, hiking and outdoor training.", icon: "⛰️", iconType: "emoji", price: "From $55", imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Accessories", description: "Gym bags, water bottles, resistance bands and the small gear that makes a big difference.", icon: "🎒", iconType: "emoji", price: "From $15", imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Team & Custom Orders", description: "Bulk ordering and custom branding for sports teams and corporate wellness programs.", icon: "👕", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "50,000+", label: "Orders Shipped" },
    { id: uid("st"), value: "4.7★", label: "Customer Rating" },
    { id: uid("st"), value: "Free", label: "Shipping Over $75" },
    { id: uid("st"), value: "30-Day", label: "Easy Returns" },
  ],

  testimonials: [
    { id: uid("t"), name: "Jordan Lee", role: "Verified Buyer", content: "The running kit held up through a full marathon training block without a single seam issue. Genuinely great quality.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Taylor Reed", role: "Verified Buyer", content: "Ordered the wrong size and the return was completely hassle-free. Will definitely shop here again.", rating: 5 },
    { id: uid("t"), name: "Casey Nguyen", role: "Verified Buyer", content: "Best training leggings I've owned — no see-through, no rolling down. Worth every penny.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Essentials Pack", price: "$89", description: "3-piece training starter set", features: ["1 training top", "1 pair shorts/leggings", "1 accessory item", "Free shipping"], ctaLabel: "Shop Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Performance Bundle", price: "$149", description: "Complete outfit + footwear", features: ["Full training outfit", "1 pair athletic shoes", "Gym bag included", "Free shipping & returns"], highlighted: true, badge: "Best Value", ctaLabel: "Shop Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Team Order", price: "Custom Quote", description: "Bulk team or corporate orders", features: ["Custom branding available", "Volume discounts", "Dedicated account rep"], ctaLabel: "Request Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What's your return policy?", answer: "We offer hassle-free 30-day returns on unworn items with tags attached. Return shipping is free for orders over $75." },
    { id: uid("f"), question: "Do you offer team or bulk discounts?", answer: "Yes, we offer volume pricing and custom branding options for sports teams and corporate wellness programs." },
    { id: uid("f"), question: "How do I know what size to order?", answer: "Each product page includes a detailed size chart, and our support team is happy to help via chat if you're unsure." },
    { id: uid("f"), question: "When does new stock drop?", answer: "We release new collections monthly — sign up for our newsletter to get early access before public launch." },
  ],
};

// ─── TEMPLATE 41: SparkleHome (Residential House Cleaning) ───────────────────

const SPARKLE_HOME: TemplateIdentity = {
  slug: "sparkle-home",
  name: "SparkleHome",
  description: "Fresh and friendly house cleaning template with a light, airy design. Emphasises trust, reliability, and eco-friendly cleaning practices.",
  category: "Cleaning",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=85&fit=crop",
  tags: ["house cleaning", "residential", "domestic", "eco-friendly"],

  palette: {
    primary: "#0d9488",
    primaryFg: "#ffffff",
    secondary: "#134e4a",
    accent: "#5eead4",
    background: "#f0fdfa",
    foreground: "#134e4a",
    muted: "#ccfbf1",
    mutedFg: "#0f766e",
    card: "#ffffff",
    border: "#99f6e4",
    ring: "#0d9488",
    borderRadius: "0.75rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-sparkle-home .hero-badge { background: #0d9488; color: white; border-radius: 9999px; }
    .template-sparkle-home .service-card { border-top: 3px solid #0d9488; }
    .template-sparkle-home .stat-value { color: #0d9488; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85&fit=crop", alt: "Bright clean home interior" },
    about: { url: "https://images.unsplash.com/photo-1527515637462-cff94ebb3cfe?w=800&q=80&fit=crop", alt: "House cleaning in progress" },
    services: [
      { url: "https://images.unsplash.com/photo-1527515637462-cff94ebb3cfe?w=600&q=80&fit=crop", alt: "Regular house cleaning" },
      { url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80&fit=crop", alt: "Deep cleaning" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80&fit=crop", alt: "Move-out cleaning" },
      { url: "https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80&fit=crop", alt: "Carpet cleaning" },
      { url: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80&fit=crop", alt: "Window cleaning" },
      { url: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=600&q=80&fit=crop", alt: "Kitchen deep clean" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop", alt: "Sparkling kitchen" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80&fit=crop", alt: "Clean bathroom" },
      { url: "https://images.unsplash.com/photo-1600607687644-c7171b47af3b?w=800&q=80&fit=crop", alt: "Living room" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&fit=crop", alt: "Bedroom" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80&fit=crop&face", alt: "Cleaning Team Lead" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80&fit=crop", alt: "Book a clean" },
  },

  heroHeadline: "A Cleaner Home, A Happier Life",
  heroSubline: "Professional house cleaning services using eco-friendly products — book your clean in minutes.",
  heroBadge: "✨ Eco-Friendly Products",
  heroCTA: "Book a Clean",
  heroSecondaryCTA: "Get Free Quote",
  siteName: "SparkleHome Cleaning",
  tagline: "A cleaner home, a happier life",
  phone: "+1 (555) 224-7790",
  email: "book@sparklehome.com",
  address: "22 Fresh Start Lane, Metro City",
  aboutHeading: "Eco-Friendly Cleaning, Trusted by 2,000+ Families",
  aboutBody: "SparkleHome provides reliable, thorough residential cleaning using biodegradable, family-safe products. Our vetted, insured cleaners follow a consistent 40-point checklist on every visit, so you know exactly what you're getting — every single time.",
  aboutHighlights: ["Eco-certified, biodegradable products", "Insured & background-checked cleaners", "Consistent 40-point checklist", "100% satisfaction guarantee", "2,000+ homes cleaned"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Regular House Clean", description: "Weekly, bi-weekly or monthly cleaning to keep your home consistently fresh.", icon: "🏠", iconType: "emoji", price: "From $79", imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94ebb3cfe?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Deep Clean", description: "Intensive top-to-bottom clean including baseboards, appliances and cabinet interiors.", icon: "✨", iconType: "emoji", price: "From $169", imageUrl: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Move-Out Cleaning", description: "Bond-back guaranteed cleaning to real-estate inspection standards.", icon: "🔑", iconType: "emoji", price: "From $229", imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Carpet Cleaning", description: "Hot water extraction steam cleaning for carpets and area rugs.", icon: "🧼", iconType: "emoji", price: "From $69", imageUrl: "https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Window Cleaning", description: "Streak-free interior window cleaning using purified water systems.", icon: "🪟", iconType: "emoji", price: "From $49", imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Kitchen Deep Clean", description: "Inside oven, fridge and cabinets — the spots regular cleans skip.", icon: "🍳", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "2,000+", label: "Homes Cleaned" },
    { id: uid("st"), value: "97%", label: "Satisfaction Rate" },
    { id: uid("st"), value: "9 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "Average Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Hannah Price", role: "Homeowner", content: "Same cleaner every time, always thorough, always on time. My house has never looked better.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Steven Marsh", role: "Working Parent", content: "The eco-friendly products matter a lot to us with young kids in the house. Highly recommend.", rating: 5 },
    { id: uid("t"), name: "Olivia Chan", role: "Renter", content: "Move-out clean got us our full deposit back. Worth every penny for the peace of mind.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Basic Clean", price: "$79", period: "/visit", description: "Small apartment, up to 2 bed", features: ["Kitchen & bathrooms", "Vacuuming & mopping", "Surface dusting"], ctaLabel: "Book Basic", ctaUrl: "#contact" },
    { id: uid("p"), name: "Standard Clean", price: "$139", period: "/visit", description: "Our most popular package", features: ["Up to 4 bedrooms", "All rooms included", "Eco-friendly products", "Window sills & blinds"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Standard", ctaUrl: "#contact" },
    { id: uid("p"), name: "Deep Clean", price: "$229", period: "/visit", description: "Full white-glove service", features: ["Everything in Standard", "Inside oven & fridge", "Baseboards & cabinets", "Priority scheduling"], ctaLabel: "Book Deep Clean", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do I need to be home during the cleaning?", answer: "No, most clients provide a key or door code. Our cleaners are insured and background-checked." },
    { id: uid("f"), question: "What products do you use?", answer: "We use eco-certified, biodegradable products that are safe for children and pets." },
    { id: uid("f"), question: "What if I'm not satisfied?", answer: "We'll return within 24 hours and re-clean for free — no questions asked." },
  ],
};

// ─── TEMPLATE 42: CleanCore (Commercial Cleaning) ────────────────────────────

const CLEANCORE_COMMERCIAL: TemplateIdentity = {
  slug: "cleancore-commercial",
  name: "CleanCore",
  description: "Corporate and commercial cleaning template with a bold, confident look. Built for office and industrial cleaning service providers.",
  category: "Cleaning",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=85&fit=crop",
  tags: ["commercial cleaning", "office cleaning", "industrial", "janitorial"],

  palette: {
    primary: "#1d4ed8",
    primaryFg: "#ffffff",
    secondary: "#1e1b4b",
    accent: "#60a5fa",
    background: "#1e1b4b",
    foreground: "#eef2ff",
    muted: "#312e81",
    mutedFg: "#a5b4fc",
    card: "#312e81",
    border: "#4338ca",
    ring: "#1d4ed8",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-cleancore-commercial .hero-badge { background: #1d4ed8; color: white; border-radius: 9999px; }
    .template-cleancore-commercial .service-card { border-top: 3px solid #1d4ed8; background: #312e81; }
    .template-cleancore-commercial .stat-value { color: #60a5fa; font-weight: 900; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=90&fit=crop", alt: "Modern office building" },
    about: { url: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=800&q=80&fit=crop", alt: "Commercial cleaning crew" },
    services: [
      { url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&q=80&fit=crop", alt: "Office cleaning" },
      { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80&fit=crop", alt: "Corporate lobby cleaning" },
      { url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80&fit=crop", alt: "Warehouse cleaning" },
      { url: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80&fit=crop", alt: "Window cleaning" },
      { url: "https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80&fit=crop", alt: "Carpet cleaning" },
      { url: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=600&q=80&fit=crop", alt: "Sanitisation service" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80&fit=crop", alt: "Clean corporate office" },
      { url: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80&fit=crop", alt: "Retail space cleaning" },
      { url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80&fit=crop", alt: "Warehouse floor" },
      { url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80&fit=crop", alt: "Building systems check" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Operations Manager" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80&fit=crop", alt: "Get a commercial quote" },
  },

  heroHeadline: "Spotless Spaces, Productive Workplaces",
  heroSubline: "Commercial cleaning solutions trusted by offices, warehouses, and retail spaces across the city.",
  heroBadge: "🏢 Trusted by 300+ Businesses",
  heroCTA: "Request a Quote",
  heroSecondaryCTA: "Our Services",
  siteName: "CleanCore Commercial",
  tagline: "Spotless spaces, productive workplaces",
  phone: "+1 (555) 774-2200",
  email: "sales@cleancorecommercial.com",
  address: "150 Corporate Plaza, Suite 500, Metro City",
  aboutHeading: "Trusted by 300+ Businesses Across the City",
  aboutBody: "CleanCore delivers scheduled and on-demand commercial cleaning for offices, warehouses, and retail spaces. Our trained crews work around your business hours, use hospital-grade disinfectants, and are fully insured and bonded.",
  aboutHighlights: ["Fully insured & bonded crews", "Flexible after-hours scheduling", "Hospital-grade disinfection available", "Dedicated account manager", "300+ businesses served"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Office Cleaning", description: "Daily, weekly or after-hours cleaning for offices of every size.", icon: "🏢", iconType: "emoji", price: "From $180/mo", imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Warehouse & Industrial", description: "Heavy-duty cleaning for warehouses, factories and industrial facilities.", icon: "🏭", iconType: "emoji", price: "From $450/mo", imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Retail & Storefront", description: "Customer-facing cleaning that keeps your storefront presentable during business hours.", icon: "🛍️", iconType: "emoji", price: "From $220/mo", imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Window & Facade Cleaning", description: "Interior and exterior window cleaning for multi-storey commercial buildings.", icon: "🪟", iconType: "emoji", price: "From $300", imageUrl: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Carpet & Floor Care", description: "Commercial-grade carpet extraction and hard floor stripping/waxing services.", icon: "🧼", iconType: "emoji", price: "From $0.15/sqft", imageUrl: "https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Disinfection Services", description: "Hospital-grade sanitisation for high-touch surfaces and shared spaces.", icon: "🧴", iconType: "emoji", price: "From $250", imageUrl: "https://images.unsplash.com/photo-1585421514284-efb74320b7ca?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "300+", label: "Businesses Served" },
    { id: uid("st"), value: "16 yr", label: "In Business" },
    { id: uid("st"), value: "99.8%", label: "Client Retention" },
    { id: uid("st"), value: "24/7", label: "Scheduling Available" },
  ],

  testimonials: [
    { id: uid("t"), name: "Robert Chen", role: "Facilities Director", company: "Meridian Tower", content: "Our office has never looked better, and their after-hours scheduling means zero disruption to our team.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Patricia Nguyen", role: "Warehouse Manager", content: "They handle our industrial site with heavy machinery and hazardous zones professionally and safely.", rating: 5 },
    { id: uid("t"), name: "David Park", role: "Retail Store Owner", content: "Consistent, reliable and our storefront always looks presentable for customers. Great value.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Small Office", price: "$180", period: "/mo", description: "Under 2,000 sqft", features: ["Weekly cleaning", "Kitchen & restroom service", "Trash removal"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Corporate", price: "$450", period: "/mo", description: "2,000-10,000 sqft", features: ["Daily or 3x weekly cleaning", "Full office service", "Dedicated account manager", "After-hours scheduling"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Enterprise", price: "Custom", description: "Multi-site or industrial", features: ["Custom SLA terms", "Multiple site coverage", "24/7 emergency response"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you work after business hours?", answer: "Yes, most of our commercial contracts are scheduled after-hours or early morning to avoid disrupting your business." },
    { id: uid("f"), question: "Are your staff insured and bonded?", answer: "Yes, all CleanCore staff are fully insured, bonded, and background-checked before deployment to any site." },
    { id: uid("f"), question: "Can you handle multiple locations?", answer: "Yes, our Enterprise plan is built for multi-site businesses with consolidated billing and reporting." },
  ],

  team: [
    { id: uid("tm"), name: "Marcus Webb", role: "Operations Director", bio: "16 years managing large-scale commercial cleaning contracts across the region.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 43: FibreFresh (Carpet & Upholstery Cleaning) ──────────────────

const FIBREFRESH: TemplateIdentity = {
  slug: "fibrefresh",
  name: "FibreFresh",
  description: "Specialist carpet and upholstery cleaning template with a warm, approachable design. Showcases detailed service tiers and before/after results.",
  category: "Cleaning",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1558882224-dda166733046?w=1200&q=85&fit=crop",
  tags: ["carpet cleaning", "upholstery", "soft furnishings", "deep clean"],

  palette: {
    primary: "#d97706",
    primaryFg: "#ffffff",
    secondary: "#7f1d1d",
    accent: "#fbbf24",
    background: "#fffbeb",
    foreground: "#7c2d12",
    muted: "#fef3c7",
    mutedFg: "#92400e",
    card: "#ffffff",
    border: "#fde68a",
    ring: "#d97706",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-fibrefresh .hero-badge { background: #d97706; color: white; border-radius: 9999px; }
    .template-fibrefresh .service-card { border-top: 3px solid #d97706; }
    .template-fibrefresh .stat-value { color: #d97706; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1558882224-dda166733046?w=900&q=85&fit=crop", alt: "Carpet cleaning machine in use" },
    about: { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80&fit=crop", alt: "Clean living room carpet" },
    services: [
      { url: "https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80&fit=crop", alt: "Carpet steam cleaning" },
      { url: "https://images.unsplash.com/photo-1600607687644-c7171b47af3b?w=600&q=80&fit=crop", alt: "Sofa upholstery cleaning" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", alt: "Rug cleaning" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop", alt: "Mattress cleaning" },
      { url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80&fit=crop", alt: "Curtain cleaning" },
      { url: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80&fit=crop", alt: "Stain removal" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1558882224-dda166733046?w=800&q=80&fit=crop", alt: "Before and after carpet clean" },
      { url: "https://images.unsplash.com/photo-1600607687644-c7171b47af3b?w=800&q=80&fit=crop", alt: "Restored sofa" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop", alt: "Fresh rug" },
      { url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80&fit=crop", alt: "Clean mattress" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Lead Technician" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1558882224-dda166733046?w=1200&q=80&fit=crop", alt: "Book a deep clean" },
  },

  heroHeadline: "Breathe New Life Into Your Carpets",
  heroSubline: "Deep-cleaning specialists for carpets, rugs, and upholstery — results you can see and feel.",
  heroBadge: "🧽 Free Stain Assessment",
  heroCTA: "Book a Clean",
  heroSecondaryCTA: "See Results",
  siteName: "FibreFresh Cleaning",
  tagline: "Breathe new life into your carpets",
  phone: "+1 (555) 660-3390",
  email: "hello@fibrefresh.com",
  address: "70 Textile Row, Metro City",
  aboutHeading: "Specialist Deep Cleaning for Carpets & Soft Furnishings",
  aboutBody: "FibreFresh specialises exclusively in carpet, rug and upholstery cleaning — using hot water extraction technology that removes deep-set dirt, allergens and stains that vacuuming alone can't touch. Every job includes a free stain assessment before we quote.",
  aboutHighlights: ["Hot water extraction technology", "Pet-safe, child-safe solutions", "Free stain assessment before quoting", "Same-week appointments available"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Results", url: "#gallery" },
    { id: "n3", label: "Pricing", url: "#pricing" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Carpet Steam Cleaning", description: "Hot water extraction cleaning that removes deep dirt and allergens from carpets.", icon: "🧼", iconType: "emoji", price: "From $0.35/sqft", imageUrl: "https://images.unsplash.com/photo-1558882224-dda166733046?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Upholstery Cleaning", description: "Sofa, armchair and fabric furniture cleaning using fabric-safe methods.", icon: "🛋️", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1600607687644-c7171b47af3b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Rug Cleaning", description: "Specialist cleaning for area rugs, including delicate and hand-woven pieces.", icon: "🧵", iconType: "emoji", price: "From $59", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Mattress Cleaning", description: "Deep sanitisation to remove dust mites, allergens and stains from mattresses.", icon: "🛏️", iconType: "emoji", price: "From $79", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Curtain Cleaning", description: "On-site steam cleaning for curtains and drapes without needing to take them down.", icon: "🪟", iconType: "emoji", price: "From $99", imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Stain Removal", description: "Targeted treatment for pet stains, wine spills and stubborn set-in marks.", icon: "💧", iconType: "emoji", price: "From $35", imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "6,000+", label: "Rooms Cleaned" },
    { id: uid("st"), value: "8 yr", label: "In Business" },
    { id: uid("st"), value: "4.8★", label: "Average Rating" },
    { id: uid("st"), value: "Same-Week", label: "Appointments" },
  ],

  testimonials: [
    { id: uid("t"), name: "Karen Diaz", role: "Homeowner", content: "Got a wine stain out of our living room carpet that I thought was permanent. Absolutely amazing work.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Brian Foster", role: "Homeowner", content: "Our carpets look and smell brand new. Pet-safe products were important to us with our dog around.", rating: 5 },
    { id: uid("t"), name: "Michelle Osei", role: "Property Manager", content: "Use them for every tenant turnover. Fast, thorough, and always leaves the carpets looking new.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Single Room", price: "$59", description: "One room carpet clean", features: ["Hot water extraction", "Stain pre-treatment", "Deodorising included"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Whole Home", price: "$0.35", period: "/sqft", description: "Most popular package", features: ["All carpeted rooms", "Furniture moving included", "Stain pre-treatment", "Deodorising & protectant"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Package", price: "Custom Quote", description: "Carpets + upholstery + rugs", features: ["Everything in Whole Home", "Sofa & chair cleaning", "Area rug cleaning", "Priority scheduling"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How long does it take carpets to dry?", answer: "Typically 4-6 hours with good airflow. We use high-powered extraction to minimise drying time." },
    { id: uid("f"), question: "Are your products safe for pets and kids?", answer: "Yes, all our cleaning solutions are pet-safe and child-safe, with no harsh chemical residue." },
    { id: uid("f"), question: "Can you remove old stains?", answer: "In most cases, yes — we offer a free stain assessment to give you an honest expectation before booking." },
  ],
};

// ─── TEMPLATE 44: TableFare (Casual Dining Restaurant) ───────────────────────

const TABLEFARE: TemplateIdentity = {
  slug: "tablefare",
  name: "TableFare",
  description: "Warm and inviting casual dining restaurant template with a rich, food-photography-forward layout. Ideal for family restaurants and neighbourhood eateries.",
  category: "Restaurant & Cafe",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=85&fit=crop",
  tags: ["restaurant", "dining", "casual", "food", "reservations"],

  palette: {
    primary: "#dc2626",
    primaryFg: "#ffffff",
    secondary: "#451a03",
    accent: "#f87171",
    background: "#451a03",
    foreground: "#fef2f2",
    muted: "#7c2d12",
    mutedFg: "#fecaca",
    card: "#7c2d12",
    border: "#9a3412",
    ring: "#dc2626",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-tablefare .hero-badge { background: #dc2626; color: white; border-radius: 9999px; }
    .template-tablefare .service-card { border-top: 3px solid #dc2626; background: #7c2d12; }
    .template-tablefare .stat-value { color: #f87171; font-weight: 900; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=90&fit=crop", alt: "Warm restaurant interior" },
    about: { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&fit=crop", alt: "Chef preparing food" },
    services: [
      { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&fit=crop", alt: "Signature main course" },
      { url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80&fit=crop", alt: "Fresh salad" },
      { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop", alt: "Grilled specialty" },
      { url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop", alt: "Dessert plate" },
      { url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80&fit=crop", alt: "Pasta dish" },
      { url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&fit=crop", alt: "Craft cocktail" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80&fit=crop", alt: "Dining room ambiance" },
      { url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80&fit=crop", alt: "Signature dish" },
      { url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&fit=crop", alt: "Kitchen at work" },
      { url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80&fit=crop", alt: "Bar area" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&q=80&fit=crop&face", alt: "Executive Chef" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&fit=crop", alt: "Reserve your table" },
  },

  heroHeadline: "Good Food, Good Times",
  heroSubline: "A neighbourhood favourite serving fresh, flavourful dishes the whole family will love.",
  heroBadge: "🍽️ Reservations Recommended",
  heroCTA: "Reserve a Table",
  heroSecondaryCTA: "View Menu",
  siteName: "TableFare",
  tagline: "Good food, good times",
  phone: "+1 (555) 337-2288",
  email: "hello@tablefare.com",
  address: "18 Main Street, Downtown District",
  aboutHeading: "A Neighbourhood Favourite Since 2010",
  aboutBody: "TableFare has been serving fresh, made-from-scratch comfort food to our community for over a decade. Every dish is prepared daily using locally sourced ingredients, in a warm dining room built for family dinners, date nights and everything in between.",
  aboutHighlights: ["Locally sourced, made-from-scratch daily", "Family-friendly dining room", "Full bar with craft cocktails", "Private event space available"],

  navItems: [
    { id: "n1", label: "Menu", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Reserve", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Signature Mains", description: "Our most-loved entrées, made fresh daily using locally sourced ingredients.", icon: "🍽️", iconType: "emoji", price: "From $18", imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Fresh Salads & Starters", description: "Seasonal salads and shareable starters to kick off your meal.", icon: "🥗", iconType: "emoji", price: "From $9", imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Grilled Specialties", description: "Perfectly grilled meats and seafood, our chef's signature preparations.", icon: "🔥", iconType: "emoji", price: "From $24", imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "House-Made Pasta", description: "Fresh pasta made daily in-house, served with our signature sauces.", icon: "🍝", iconType: "emoji", price: "From $16", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Desserts", description: "House-made desserts, changing with the season, always crowd-pleasers.", icon: "🍰", iconType: "emoji", price: "From $8", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Craft Cocktails & Bar", description: "Full bar with signature cocktails, local beers and a curated wine list.", icon: "🍹", iconType: "emoji", price: "From $12", imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "15 yr", label: "Serving the Community" },
    { id: uid("st"), value: "4.7★", label: "Average Rating" },
    { id: uid("st"), value: "50+", label: "Menu Items" },
    { id: uid("st"), value: "100%", label: "Locally Sourced Produce" },
  ],

  testimonials: [
    { id: uid("t"), name: "George Palmer", role: "Regular Guest", content: "We come every Friday night. The staff know our order and the food never disappoints. Feels like family.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Sandra Lee", role: "First-Time Visitor", content: "Every dish we ordered was perfectly cooked. The warm atmosphere made for a great date night.", rating: 5 },
    { id: uid("t"), name: "Marcus Alan", role: "Local Business Owner", content: "Hosted our company dinner in their private room. Food, service and space were all excellent.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Casual Dining", price: "$18-30", period: "/person", description: "Standard dinner experience", features: ["Full menu access", "Complimentary bread service", "No reservation required"], ctaLabel: "View Menu", ctaUrl: "#contact" },
    { id: uid("p"), name: "Private Event", price: "From $500", description: "Private dining room hire", features: ["Seats up to 30 guests", "Custom set menu options", "Dedicated event staff"], highlighted: true, badge: "Popular for Groups", ctaLabel: "Inquire Now", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do I need a reservation?", answer: "Reservations are recommended, especially for weekend dinner service, though walk-ins are always welcome." },
    { id: uid("f"), question: "Do you accommodate dietary restrictions?", answer: "Yes, we offer vegetarian, vegan and gluten-free options, and can accommodate most allergies with advance notice." },
    { id: uid("f"), question: "Can you host private events?", answer: "Yes, our private dining room seats up to 30 guests and is available for parties, corporate dinners and celebrations." },
  ],

  team: [
    { id: uid("tm"), name: "Chef Antonio Ricci", role: "Executive Chef", bio: "15 years crafting seasonal, locally sourced menus. Leads the kitchen with a focus on made-from-scratch cooking.", avatar: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 45: BeanCraft (Specialty Coffee & Cafe) ────────────────────────

const BEANCRAFT_CAFE: TemplateIdentity = {
  slug: "beancraft-cafe",
  name: "BeanCraft",
  description: "Stylish coffee shop and cafe template with a minimal, aesthetic-driven design. Perfect for specialty coffee roasters, artisan cafes, and brunch spots.",
  category: "Restaurant & Cafe",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=85&fit=crop",
  tags: ["cafe", "coffee", "brunch", "specialty coffee", "artisan"],

  palette: {
    primary: "#f59e0b",
    primaryFg: "#1c1917",
    secondary: "#78350f",
    accent: "#fbbf24",
    background: "#1c1917",
    foreground: "#fafaf9",
    muted: "#292524",
    mutedFg: "#a8a29e",
    card: "#292524",
    border: "#44403c",
    ring: "#f59e0b",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-beancraft-cafe .hero-badge { background: #f59e0b; color: #1c1917; border-radius: 9999px; }
    .template-beancraft-cafe .service-card { border-top: 3px solid #f59e0b; background: #292524; }
    .template-beancraft-cafe .stat-value { color: #f59e0b; font-weight: 900; }
  `,

  variants: {
    hero: "split-image-right",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=900&q=85&fit=crop", alt: "Specialty coffee pour-over" },
    about: { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&fit=crop", alt: "Cafe interior" },
    services: [
      { url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80&fit=crop", alt: "Pour-over coffee" },
      { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&fit=crop", alt: "Latte art" },
      { url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80&fit=crop", alt: "Fresh pastries" },
      { url: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80&fit=crop", alt: "Brunch plate" },
      { url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80&fit=crop", alt: "Coffee beans" },
      { url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80&fit=crop", alt: "Espresso shot" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80&fit=crop", alt: "Cozy cafe corner" },
      { url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80&fit=crop", alt: "Barista at work" },
      { url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80&fit=crop", alt: "Pastry display" },
      { url: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80&fit=crop", alt: "Brunch spread" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&q=80&fit=crop&face", alt: "Head Roaster" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&q=80&fit=crop", alt: "Visit BeanCraft" },
  },

  heroHeadline: "Crafted with Care, Served with Passion",
  heroSubline: "Specialty coffee and wholesome eats in a space designed for good conversations.",
  heroBadge: "☕ Freshly Roasted Daily",
  heroCTA: "View Menu",
  heroSecondaryCTA: "Find Us",
  siteName: "BeanCraft Coffee",
  tagline: "Crafted with care, served with passion",
  phone: "+1 (555) 448-9021",
  email: "hello@beancraft.com",
  address: "42 Roastery Lane, Arts District",
  aboutHeading: "Small-Batch Roasted, Served with Intention",
  aboutBody: "BeanCraft roasts small batches of single-origin beans in-house, sourced directly from farms we've built relationships with over years. Every cup is brewed to order, and our kitchen turns out fresh pastries and brunch dishes daily using local, seasonal ingredients.",
  aboutHighlights: ["Small-batch, in-house roasted", "Direct-trade relationships with growers", "Fresh pastries baked daily", "Free wifi & laptop-friendly seating"],

  navItems: [
    { id: "n1", label: "Menu", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Visit Us", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Pour-Over Coffee", description: "Single-origin beans, brewed to order using precision pour-over technique.", icon: "☕", iconType: "emoji", price: "From $6", imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Espresso & Lattes", description: "Rich espresso drinks crafted by our trained baristas, dairy and plant-based milk options.", icon: "🥛", iconType: "emoji", price: "From $4.50", imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Fresh Pastries", description: "Baked daily in-house — croissants, muffins and seasonal specials.", icon: "🥐", iconType: "emoji", price: "From $4", imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Brunch Menu", description: "All-day brunch dishes made with local, seasonal ingredients.", icon: "🍳", iconType: "emoji", price: "From $12", imageUrl: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Whole Bean Retail", description: "Take home our small-batch roasted beans, available whole or ground to order.", icon: "🫘", iconType: "emoji", price: "From $16/bag", imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Catering & Events", description: "Coffee cart and pastry catering for offices, weddings and private events.", icon: "🎉", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "8 yr", label: "Roasting Coffee" },
    { id: uid("st"), value: "4.8★", label: "Average Rating" },
    { id: uid("st"), value: "12", label: "Origin Countries Sourced" },
    { id: uid("st"), value: "1,000+", label: "Cups Served Weekly" },
  ],

  testimonials: [
    { id: uid("t"), name: "Emma Watts", role: "Regular Customer", content: "Best pour-over in the city, hands down. The staff genuinely care about the craft and it shows in every cup.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Daniel Cho", role: "Remote Worker", content: "My go-to spot to work from — great coffee, fast wifi, and nobody rushes you out. Perfect vibe.", rating: 5 },
    { id: uid("t"), name: "Sofia Martinez", role: "Brunch Regular", content: "The brunch menu changes seasonally and it's always excellent. Their avocado toast is unmatched.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Coffee Lover", price: "$6", description: "Single-origin pour-over", features: ["Fresh roasted beans", "Brewed to order", "Tasting notes provided"], ctaLabel: "Order Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Brunch for Two", price: "$32", description: "Most popular weekend order", features: ["2 brunch mains", "2 specialty coffees", "Shared pastry"], highlighted: true, badge: "Weekend Favorite", ctaLabel: "Reserve a Table", ctaUrl: "#contact" },
    { id: uid("p"), name: "Office Catering", price: "Custom Quote", description: "Coffee cart for your event", features: ["On-site barista service", "Pastry selection included", "Minimum 20 guests"], ctaLabel: "Request Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Where do you source your beans?", answer: "We work directly with growers across 12 countries, focusing on direct-trade relationships and traceable sourcing." },
    { id: uid("f"), question: "Do you offer plant-based milk options?", answer: "Yes, we offer oat, almond and soy milk at no extra charge." },
    { id: uid("f"), question: "Can I buy beans to brew at home?", answer: "Yes, all our roasts are available whole bean or ground to order, in-store or via our online shop." },
    { id: uid("f"), question: "Do you cater events?", answer: "Yes, our coffee cart and pastry catering is available for offices, weddings and private events with a 20-guest minimum." },
  ],

  team: [
    { id: uid("tm"), name: "Jamie Torres", role: "Head Roaster & Founder", bio: "8 years in specialty coffee, trained with roasters across three continents before opening BeanCraft.", avatar: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 46: StreetBite (Food Truck & Takeaway) ─────────────────────────

const STREETBITE: TemplateIdentity = {
  slug: "streetbite",
  name: "StreetBite",
  description: "Energetic food truck and takeaway template with a street food aesthetic. Bold typography and vibrant colours for fast-casual dining and delivery brands.",
  category: "Restaurant & Cafe",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=1200&q=85&fit=crop",
  tags: ["food truck", "takeaway", "fast casual", "delivery", "street food"],

  palette: {
    primary: "#eab308",
    primaryFg: "#7c2d12",
    secondary: "#7c2d12",
    accent: "#fde047",
    background: "#fffbeb",
    foreground: "#7c2d12",
    muted: "#fef3c7",
    mutedFg: "#92400e",
    card: "#ffffff",
    border: "#fde68a",
    ring: "#eab308",
    borderRadius: "1rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-streetbite h1,.template-streetbite h2 { text-transform: uppercase; }
    .template-streetbite .hero-badge { background: #eab308; color: #7c2d12; border-radius: 9999px; font-weight: 800; }
    .template-streetbite .service-card { border-radius: 1rem; border-top: 4px solid #eab308; }
    .template-streetbite .stat-value { color: #eab308; font-weight: 900; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=900&q=85&fit=crop", alt: "Street food truck" },
    about: { url: "https://images.unsplash.com/photo-1565299585323-38174c4a6471?w=800&q=80&fit=crop", alt: "Food truck cooking" },
    services: [
      { url: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=600&q=80&fit=crop", alt: "Loaded tacos" },
      { url: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80&fit=crop", alt: "Street burger" },
      { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop", alt: "Loaded fries" },
      { url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80&fit=crop", alt: "Grilled skewers" },
      { url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80&fit=crop", alt: "Fresh wraps" },
      { url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80&fit=crop", alt: "Craft soda" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=800&q=80&fit=crop", alt: "Food truck exterior" },
      { url: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800&q=80&fit=crop", alt: "Signature burger" },
      { url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&fit=crop", alt: "Loaded fries close-up" },
      { url: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&q=80&fit=crop", alt: "Fresh ingredients" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400&q=80&fit=crop&face", alt: "Founder & Head Chef" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=1200&q=80&fit=crop", alt: "Order now" },
  },

  heroHeadline: "Bold Flavours, Fast & Fresh",
  heroSubline: "Street-inspired food made with real ingredients — order online or find us at the truck.",
  heroBadge: "🌮 Order Online for Pickup",
  heroCTA: "Order Now",
  heroSecondaryCTA: "Find the Truck",
  siteName: "StreetBite",
  tagline: "Bold flavours, fast & fresh",
  phone: "+1 (555) 990-2277",
  email: "hey@streetbite.com",
  address: "Mobile — check our schedule for today's location",
  aboutHeading: "Street Food Done Right, Since 2018",
  aboutBody: "StreetBite brings bold, globally-inspired street food to a truck near you. Every dish is made to order with fresh, real ingredients — no shortcuts, no reheats. Follow our schedule to find us, or order online for pickup and skip the line.",
  aboutHighlights: ["Made-to-order, never reheated", "Real ingredients, no shortcuts", "Order online, skip the line", "Catering available for events"],

  navItems: [
    { id: "n1", label: "Menu", url: "#services" },
    { id: "n2", label: "Find Us", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Order Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Loaded Tacos", description: "Street-style tacos loaded with your choice of protein, fresh salsa and toppings.", icon: "🌮", iconType: "emoji", price: "From $4.50", imageUrl: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Signature Burgers", description: "Smash burgers with house sauce, made fresh on the flat top to order.", icon: "🍔", iconType: "emoji", price: "From $9", imageUrl: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Loaded Fries", description: "Crispy fries piled high with toppings — the shareable everyone fights over.", icon: "🍟", iconType: "emoji", price: "From $7", imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Grilled Skewers", description: "Marinated and grilled skewers with a rotating selection of global flavours.", icon: "🍢", iconType: "emoji", price: "From $6", imageUrl: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Fresh Wraps", description: "Made-to-order wraps with fresh vegetables and your choice of protein.", icon: "🌯", iconType: "emoji", price: "From $8", imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Catering & Events", description: "Book the truck or a catering package for your next event or office party.", icon: "🎉", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "6 yr", label: "Serving the Streets" },
    { id: uid("st"), value: "4.7★", label: "Average Rating" },
    { id: uid("st"), value: "15,000+", label: "Orders Served" },
    { id: uid("st"), value: "5", label: "City Locations Weekly" },
  ],

  testimonials: [
    { id: uid("t"), name: "Marcus Reed", role: "Regular Customer", content: "The tacos are unreal, and ordering ahead means I never wait in line. Follow their schedule, worth the chase.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Priya Shah", role: "Office Manager", content: "Booked them for our team lunch and everyone raved about it for weeks. Great catering option.", rating: 5 },
    { id: uid("t"), name: "Leo Fischer", role: "Food Blogger", content: "Best street food truck in the city, hands down. Bold flavours, generous portions, fair prices.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Solo Meal", price: "$12", description: "Main + side + drink", features: ["Choice of main dish", "Loaded fries or side", "Craft soda"], ctaLabel: "Order Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Group Order", price: "$45", description: "Feeds 4, most popular", features: ["4 mains of choice", "2 loaded fries to share", "4 drinks"], highlighted: true, badge: "Most Popular", ctaLabel: "Order Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Event Catering", price: "Custom Quote", description: "Full truck booking or drop-off", features: ["Minimum 30 guests", "Custom menu selection", "On-site or delivery available"], ctaLabel: "Request Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Where can I find the truck today?", answer: "Check our schedule page or social media for our daily location — we rotate through 5 spots across the city each week." },
    { id: uid("f"), question: "Can I order ahead?", answer: "Yes, order online for pickup and skip the line entirely — just select your location and pickup time." },
    { id: uid("f"), question: "Do you cater events?", answer: "Yes, we offer full truck bookings and drop-off catering for events with a 30-guest minimum." },
  ],
};

// ─── TEMPLATE 47: LexBridge (Law Firm) ────────────────────────────────────────

const LEXBRIDGE_LAW: TemplateIdentity = {
  slug: "lexbridge-law",
  name: "LexBridge",
  description: "Authoritative law firm template with a sophisticated dark design. Conveys professionalism through structured practice area listings and attorney profiles.",
  category: "Legal & Finance",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=85&fit=crop",
  tags: ["law firm", "legal", "solicitors", "attorneys", "legal services"],

  palette: {
    primary: "#b45309",
    primaryFg: "#ffffff",
    secondary: "#374151",
    accent: "#d97706",
    background: "#111827",
    foreground: "#f9fafb",
    muted: "#1f2937",
    mutedFg: "#9ca3af",
    card: "#1f2937",
    border: "#374151",
    ring: "#b45309",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-lexbridge-law .hero-badge { background: #b45309; color: white; border-radius: 0.25rem; }
    .template-lexbridge-law .service-card { border-top: 3px solid #b45309; background: #1f2937; }
    .template-lexbridge-law .stat-value { color: #d97706; font-weight: 700; }
  `,

  variants: {
    hero: "centered-bold",
    services: "bordered-list",
    testimonials: "formal-cards",
    features: "alternating-images",
    stats: "navy-row",
    cta: "navy-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=90&fit=crop", alt: "Law firm boardroom" },
    about: { url: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800&q=80&fit=crop", alt: "Attorney reviewing documents" },
    services: [
      { url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80&fit=crop", alt: "Corporate law consultation" },
      { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&fit=crop", alt: "Contract review" },
      { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80&fit=crop", alt: "Litigation support" },
      { url: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&q=80&fit=crop", alt: "Estate planning" },
      { url: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&q=80&fit=crop", alt: "Family law consultation" },
      { url: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=600&q=80&fit=crop", alt: "Real estate closing" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&fit=crop", alt: "Firm office" },
      { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&fit=crop", alt: "Conference room" },
      { url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&fit=crop", alt: "Consultation in progress" },
      { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&fit=crop", alt: "Legal library" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Managing Partner" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Senior Associate" },
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Litigation Counsel" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80&fit=crop", alt: "Schedule a consultation" },
  },

  heroHeadline: "Legal Expertise You Can Rely On",
  heroSubline: "Dedicated legal counsel for individuals and businesses — protecting your rights, advancing your interests.",
  heroBadge: "⚖️ 25+ Years Combined Experience",
  heroCTA: "Schedule a Consultation",
  heroSecondaryCTA: "Our Practice Areas",
  siteName: "LexBridge Law",
  tagline: "Legal expertise you can rely on",
  phone: "+1 (555) 902-1188",
  email: "info@lexbridgelaw.com",
  address: "500 Justice Plaza, Suite 900, Metro City",
  aboutHeading: "25+ Years of Combined Legal Experience",
  aboutBody: "LexBridge Law provides sophisticated legal counsel across corporate, litigation, real estate and family law matters. Our attorneys combine deep legal expertise with a genuinely client-first approach — clear communication, transparent fees, and results-driven strategy.",
  aboutHighlights: ["25+ years combined experience", "Free initial consultation", "Transparent fee structures", "Responsive client communication"],

  navItems: [
    { id: "n1", label: "Practice Areas", url: "#services" },
    { id: "n2", label: "Attorneys", url: "#team" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Corporate Law", description: "Business formation, contracts, mergers and ongoing corporate counsel.", icon: "🏢", iconType: "emoji", price: "From $350/hr", imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Litigation", description: "Civil litigation representation from pre-suit negotiation through trial.", icon: "⚖️", iconType: "emoji", price: "From $400/hr", imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Real Estate Law", description: "Residential and commercial property transactions, leases and closings.", icon: "🏠", iconType: "emoji", price: "From $1,200 flat", imageUrl: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Family Law", description: "Divorce, custody and family matters handled with discretion and care.", icon: "👨‍👩‍👧", iconType: "emoji", price: "From $300/hr", imageUrl: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Estate Planning", description: "Wills, trusts and estate planning to protect your assets and family.", icon: "📜", iconType: "emoji", price: "From $1,500 flat", imageUrl: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Contract Review", description: "Thorough contract review and negotiation for businesses and individuals.", icon: "📄", iconType: "emoji", price: "From $500 flat", imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "25 yr", label: "Combined Experience" },
    { id: uid("st"), value: "1,200+", label: "Cases Handled" },
    { id: uid("st"), value: "94%", label: "Favorable Outcomes" },
    { id: uid("st"), value: "4.9★", label: "Client Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Robert Kane", role: "Business Owner", content: "LexBridge guided us through a complex acquisition with clarity and confidence at every step. Exceptional counsel.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Diane Foster", role: "Client", content: "Handled our estate planning with genuine care and made a difficult process feel manageable. Highly recommend.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Michael Brennan", role: "Property Investor", content: "Fast, thorough closings every time. Their real estate team is the best I've worked with.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Consultation", price: "Free", description: "30-minute initial review", features: ["Case evaluation", "Strategic overview", "Fee structure discussion", "No obligation"], ctaLabel: "Book Free Consult", ctaUrl: "#contact" },
    { id: uid("p"), name: "Flat Fee Matters", price: "From $500", description: "Fixed-cost legal work", features: ["Document drafting", "Contract review", "Simple transactions", "Clear upfront pricing"], highlighted: true, badge: "Most Transparent", ctaLabel: "Discuss Options", ctaUrl: "#contact" },
    { id: uid("p"), name: "Retainer", price: "Custom", description: "Ongoing representation", features: ["Dedicated attorney", "Priority response", "Unlimited consultations", "Full litigation support"], ctaLabel: "Get a Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you offer a free consultation?", answer: "Yes, we offer a free 30-minute initial consultation to evaluate your case and discuss fee structures." },
    { id: uid("f"), question: "How are your fees structured?", answer: "We offer both hourly and flat-fee billing depending on the matter — flat fees for predictable work like document drafting and closings, hourly for litigation." },
    { id: uid("f"), question: "What areas of law do you practice?", answer: "We practice corporate law, litigation, real estate, family law and estate planning." },
  ],

  team: [
    { id: uid("tm"), name: "James Whitfield, Esq.", role: "Managing Partner", bio: "25 years in corporate and litigation law. Leads the firm's largest client relationships.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Sarah Chen, Esq.", role: "Senior Associate", bio: "Specialises in real estate and estate planning. Known for clear client communication.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "David Osei, Esq.", role: "Litigation Counsel", bio: "Trial attorney with a strong track record in civil litigation and dispute resolution.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 48: ClearTax (Accounting & Tax Services) ───────────────────────

const CLEARTAX_ACCOUNTING: TemplateIdentity = {
  slug: "cleartax-accounting",
  name: "ClearTax",
  description: "Clean and professional accounting and tax services template. Builds credibility through clear service descriptions, pricing transparency, and client testimonials.",
  category: "Legal & Finance",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=85&fit=crop",
  tags: ["accounting", "tax", "bookkeeping", "BAS", "financial services"],

  palette: {
    primary: "#16a34a",
    primaryFg: "#ffffff",
    secondary: "#052e16",
    accent: "#4ade80",
    background: "#f0fdf4",
    foreground: "#052e16",
    muted: "#dcfce7",
    mutedFg: "#166534",
    card: "#ffffff",
    border: "#bbf7d0",
    ring: "#16a34a",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-cleartax-accounting .hero-badge { background: #16a34a; color: white; border-radius: 9999px; }
    .template-cleartax-accounting .service-card { border-top: 3px solid #16a34a; }
    .template-cleartax-accounting .stat-value { color: #16a34a; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=85&fit=crop", alt: "Accountant reviewing finances" },
    about: { url: "https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=800&q=80&fit=crop", alt: "Financial planning meeting" },
    services: [
      { url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80&fit=crop", alt: "Tax preparation" },
      { url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&q=80&fit=crop", alt: "Bookkeeping services" },
      { url: "https://images.unsplash.com/photo-1554224155-1696413565d3?w=600&q=80&fit=crop", alt: "Payroll processing" },
      { url: "https://images.unsplash.com/photo-1554224153-21c9dfa62e5c?w=600&q=80&fit=crop", alt: "Business advisory" },
      { url: "https://images.unsplash.com/photo-1554224154-a5f0f7e5e5d5?w=600&q=80&fit=crop", alt: "Financial statements" },
      { url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&fit=crop", alt: "Client consultation" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80&fit=crop", alt: "Modern accounting office" },
      { url: "https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=800&q=80&fit=crop", alt: "Client meeting" },
      { url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80&fit=crop", alt: "Tax season prep" },
      { url: "https://images.unsplash.com/photo-1554224153-21c9dfa62e5c?w=800&q=80&fit=crop", alt: "Business advisory session" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Lead CPA" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Tax Advisor" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80&fit=crop", alt: "Book a consultation" },
  },

  heroHeadline: "Smart Accounting, Stress-Free Tax",
  heroSubline: "Trusted accountants and tax advisors helping businesses and individuals keep more of what they earn.",
  heroBadge: "📊 Certified CPAs",
  heroCTA: "Book Consultation",
  heroSecondaryCTA: "View Services",
  siteName: "ClearTax Accounting",
  tagline: "Smart accounting, stress-free tax",
  phone: "+1 (555) 226-3390",
  email: "hello@cleartaxaccounting.com",
  address: "88 Finance Row, Suite 200, Metro City",
  aboutHeading: "Certified CPAs Helping You Keep More of What You Earn",
  aboutBody: "ClearTax provides accounting, bookkeeping and tax services for small businesses and individuals who want clarity, not confusion. Our certified CPAs handle everything from monthly bookkeeping to complex tax strategy, always with transparent, upfront pricing.",
  aboutHighlights: ["Certified public accountants", "Transparent, flat-fee pricing", "Year-round tax planning, not just filing season", "Cloud-based bookkeeping tools included"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Individual Tax Preparation", description: "Accurate, maximised tax returns for individuals and families.", icon: "📋", iconType: "emoji", price: "From $180", imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Business Tax Services", description: "Corporate tax preparation, planning and quarterly estimates for businesses.", icon: "🏢", iconType: "emoji", price: "From $450", imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bookkeeping", description: "Ongoing monthly bookkeeping using cloud-based accounting software.", icon: "📚", iconType: "emoji", price: "From $250/mo", imageUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Payroll Processing", description: "Full-service payroll management, filings and compliance for small businesses.", icon: "💵", iconType: "emoji", price: "From $120/mo", imageUrl: "https://images.unsplash.com/photo-1554224155-1696413565d3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Business Advisory", description: "Strategic financial guidance to help you plan, grow and make confident decisions.", icon: "📈", iconType: "emoji", price: "From $200/hr", imageUrl: "https://images.unsplash.com/photo-1554224153-21c9dfa62e5c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Audit Support", description: "Professional representation and support through tax audits and reviews.", icon: "🔍", iconType: "emoji", price: "From $300/hr", imageUrl: "https://images.unsplash.com/photo-1554224154-a5f0f7e5e5d5?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "800+", label: "Clients Served" },
    { id: uid("st"), value: "$2.4M", label: "Tax Savings Found" },
    { id: uid("st"), value: "14 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "Client Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Nancy Ruiz", role: "Small Business Owner", content: "Switched to ClearTax three years ago and they've saved us thousands in missed deductions our old accountant never caught.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Kevin Park", role: "Freelancer", content: "Finally an accountant who explains things in plain English. Tax season stress is gone.", rating: 5 },
    { id: uid("t"), name: "Lisa Monroe", role: "Restaurant Owner", content: "Their monthly bookkeeping keeps us organized year-round, not just scrambling every April.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Individual Return", price: "$180", description: "Standard individual tax return", features: ["Federal & state filing", "Deduction optimisation", "E-file included"], ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Small Business", price: "$250", period: "/mo", description: "Bookkeeping + tax bundle", features: ["Monthly bookkeeping", "Quarterly tax estimates", "Year-end tax prep included", "Cloud software included"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full-Service", price: "Custom Quote", description: "Bookkeeping + payroll + advisory", features: ["Everything in Small Business", "Payroll processing included", "Quarterly advisory sessions"], ctaLabel: "Get a Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you work with small businesses or just individuals?", answer: "Both — we serve individuals, freelancers, and small to medium businesses across all our service lines." },
    { id: uid("f"), question: "Is pricing really flat-fee?", answer: "Yes, most of our services are quoted as a flat fee upfront, so you know exactly what you're paying before we start." },
    { id: uid("f"), question: "Can you help if I'm being audited?", answer: "Yes, we offer full audit support and representation for both individual and business tax audits." },
  ],

  team: [
    { id: uid("tm"), name: "Rachel Adams, CPA", role: "Founder & Lead CPA", bio: "14 years in public accounting. Specialises in small business tax strategy and planning.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Tom Baxter, EA", role: "Tax Advisor", bio: "Enrolled agent specialising in complex individual and freelancer tax situations.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 49: PrimeProperty (Real Estate Agent) ──────────────────────────

const PRIME_PROPERTY: TemplateIdentity = {
  slug: "prime-property",
  name: "PrimeProperty",
  description: "Sleek property agent template with a clean split-image hero and featured listings grid. Ideal for residential sales agents and boutique real estate offices.",
  category: "Real Estate",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=85&fit=crop",
  tags: ["real estate", "property", "sales", "listings", "agent"],

  palette: {
    primary: "#3b82f6",
    primaryFg: "#ffffff",
    secondary: "#1e1b4b",
    accent: "#60a5fa",
    background: "#f8fafc",
    foreground: "#1e1b4b",
    muted: "#eff6ff",
    mutedFg: "#1e40af",
    card: "#ffffff",
    border: "#dbeafe",
    ring: "#3b82f6",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-prime-property .hero-badge { background: #3b82f6; color: white; border-radius: 9999px; }
    .template-prime-property .service-card { border-top: 3px solid #3b82f6; }
    .template-prime-property .stat-value { color: #3b82f6; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=900&q=85&fit=crop", alt: "Modern home exterior" },
    about: { url: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&q=80&fit=crop", alt: "Real estate agent with clients" },
    services: [
      { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80&fit=crop", alt: "Family home listing" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", alt: "Modern apartment listing" },
      { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&fit=crop", alt: "Investment property" },
      { url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80&fit=crop", alt: "Luxury home listing" },
      { url: "https://images.unsplash.com/photo-1600210492486-715a3c85c2a1?w=600&q=80&fit=crop", alt: "Condo listing" },
      { url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80&fit=crop", alt: "Open house" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&fit=crop", alt: "Featured listing exterior" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop", alt: "Living room interior" },
      { url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80&fit=crop", alt: "Kitchen space" },
      { url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80&fit=crop", alt: "Master bedroom" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Lead Agent" },
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Buyer's Agent" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80&fit=crop", alt: "Find your property" },
  },

  heroHeadline: "Find Your Perfect Property",
  heroSubline: "Local experts connecting buyers, sellers, and investors with the right properties at the right price.",
  heroBadge: "🏡 200+ Homes Sold",
  heroCTA: "View Listings",
  heroSecondaryCTA: "Get a Valuation",
  siteName: "PrimeProperty",
  tagline: "Find your perfect property",
  phone: "+1 (555) 774-1029",
  email: "info@primeproperty.com",
  address: "300 Realty Row, Metro City",
  aboutHeading: "200+ Homes Sold, One Trusted Local Team",
  aboutBody: "PrimeProperty combines deep local market knowledge with a genuinely client-first approach. Whether you're buying your first home, selling for top dollar, or building an investment portfolio, our agents guide you through every step with clear communication and honest advice.",
  aboutHighlights: ["200+ homes sold locally", "Free home valuation", "Dedicated buyer & seller agents", "Average 12 days on market"],

  navItems: [
    { id: "n1", label: "Listings", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "Agents", url: "#team" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Home Buying", description: "Full buyer representation, from search to closing, protecting your interests every step.", icon: "🔑", iconType: "emoji", price: "No cost to buyer", imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Home Selling", description: "Strategic pricing, professional photography and marketing to sell for top dollar, fast.", icon: "💰", iconType: "emoji", price: "Commission-based", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Investment Properties", description: "Identify and acquire investment properties with strong rental yield and appreciation.", icon: "📈", iconType: "emoji", price: "Consultation-based", imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Free Home Valuation", description: "Get a data-backed estimate of your home's current market value, no obligation.", icon: "📊", iconType: "emoji", price: "Free", imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "New Construction", description: "Representation for buyers purchasing new-build homes directly from developers.", icon: "🏗️", iconType: "emoji", price: "No cost to buyer", imageUrl: "https://images.unsplash.com/photo-1600210492486-715a3c85c2a1?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Relocation Services", description: "Full-service support for clients relocating to or from the area.", icon: "📦", iconType: "emoji", price: "No cost to buyer", imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "200+", label: "Homes Sold" },
    { id: uid("st"), value: "12 days", label: "Avg. Days on Market" },
    { id: uid("st"), value: "$85M+", label: "Sales Volume" },
    { id: uid("st"), value: "4.9★", label: "Client Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Jennifer Walsh", role: "Home Buyer", content: "Our agent found us the perfect home before it even hit the open market. Couldn't have asked for better guidance.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Mark Sullivan", role: "Home Seller", content: "Sold our house in 8 days, $15k over asking. Their marketing strategy and staging advice made all the difference.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Angela Torres", role: "Investor", content: "Helped me build a 4-property rental portfolio over two years. Sharp market insight every time.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Buyer Representation", price: "$0", description: "No cost to buyers", features: ["Full property search", "Negotiation support", "Closing coordination"], ctaLabel: "Start Searching", ctaUrl: "#contact" },
    { id: uid("p"), name: "Seller Listing", price: "Commission-based", description: "Full-service selling package", features: ["Free home valuation", "Professional photography", "Marketing & staging advice", "Negotiation & closing support"], highlighted: true, badge: "Most Popular", ctaLabel: "Get a Valuation", ctaUrl: "#contact" },
    { id: uid("p"), name: "Investment Consulting", price: "Custom", description: "Portfolio building guidance", features: ["Market analysis", "Rental yield projections", "Acquisition strategy"], ctaLabel: "Book Consultation", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Does it cost anything to work with a buyer's agent?", answer: "No, buyer representation is typically at no cost to you — the seller pays agent commissions in most transactions." },
    { id: uid("f"), question: "How do you determine my home's listing price?", answer: "We provide a free, data-backed valuation using recent comparable sales, current market conditions and your home's unique features." },
    { id: uid("f"), question: "How long does it typically take to sell?", answer: "Our average time on market is 12 days, though this varies by property type, price point and current market conditions." },
  ],

  team: [
    { id: uid("tm"), name: "Michelle Grant", role: "Lead Agent & Broker", bio: "15 years in local real estate, over $85M in career sales volume.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Carlos Mendez", role: "Buyer's Agent", bio: "Specialises in first-time homebuyers, known for patient, thorough guidance.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 50: PropertyVault (Property Management) ────────────────────────

const PROPERTYVAULT_MGMT: TemplateIdentity = {
  slug: "propertyvault-mgmt",
  name: "PropertyVault",
  description: "Professional property management template built for landlords and portfolio owners. Showcases management services, rental processes, and transparent fee structures.",
  category: "Real Estate",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=85&fit=crop",
  tags: ["property management", "landlord", "rental", "leasing", "real estate"],

  palette: {
    primary: "#14b8a6",
    primaryFg: "#ffffff",
    secondary: "#042f2e",
    accent: "#2dd4bf",
    background: "#042f2e",
    foreground: "#f0fdfa",
    muted: "#134e4a",
    mutedFg: "#5eead4",
    card: "#134e4a",
    border: "#0f766e",
    ring: "#14b8a6",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-propertyvault-mgmt .hero-badge { background: #14b8a6; color: white; border-radius: 9999px; }
    .template-propertyvault-mgmt .service-card { border-top: 3px solid #14b8a6; background: #134e4a; }
    .template-propertyvault-mgmt .stat-value { color: #2dd4bf; font-weight: 700; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=90&fit=crop", alt: "Rental property exterior" },
    about: { url: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&q=80&fit=crop", alt: "Property manager meeting" },
    services: [
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", alt: "Tenant sourcing" },
      { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80&fit=crop", alt: "Property inspection" },
      { url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop", alt: "Maintenance coordination" },
      { url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&fit=crop", alt: "Rent collection" },
      { url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80&fit=crop", alt: "Lease management" },
      { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80&fit=crop", alt: "Property portfolio" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80&fit=crop", alt: "Managed property" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop", alt: "Rental unit interior" },
      { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&fit=crop", alt: "Property inspection" },
      { url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&q=80&fit=crop", alt: "Well-maintained unit" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Portfolio Manager" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80&fit=crop", alt: "Get a management quote" },
  },

  heroHeadline: "Hands-Off Property Management You Can Trust",
  heroSubline: "We manage your investment property from tenant sourcing to maintenance — stress-free ownership.",
  heroBadge: "🔑 Managing 400+ Units",
  heroCTA: "Get a Free Quote",
  heroSecondaryCTA: "Our Process",
  siteName: "PropertyVault Management",
  tagline: "Hands-off property management you can trust",
  phone: "+1 (555) 660-2299",
  email: "info@propertyvault.com",
  address: "200 Landlord Way, Metro City",
  aboutHeading: "Managing 400+ Rental Units Across the Metro Area",
  aboutBody: "PropertyVault handles every aspect of property management so you don't have to — tenant screening and placement, rent collection, maintenance coordination, and full financial reporting. Our transparent fee structure means no hidden costs, ever.",
  aboutHighlights: ["400+ units under management", "24/7 maintenance coordination", "Transparent, flat management fees", "Monthly owner financial reports"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Tenant Sourcing & Screening", description: "Marketing, showings and thorough background checks to find quality tenants fast.", icon: "🔍", iconType: "emoji", price: "First month's rent", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Rent Collection", description: "Automated rent collection with same-week owner disbursement.", icon: "💵", iconType: "emoji", price: "Included in management fee", imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Maintenance Coordination", description: "24/7 maintenance request handling with a vetted network of licensed contractors.", icon: "🛠️", iconType: "emoji", price: "Included in management fee", imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Property Inspections", description: "Regular property condition inspections with photo documentation for owners.", icon: "📋", iconType: "emoji", price: "Included in management fee", imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Lease Management", description: "Lease drafting, renewals and compliance handled to local landlord-tenant law.", icon: "📄", iconType: "emoji", price: "Included in management fee", imageUrl: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Financial Reporting", description: "Monthly income and expense statements delivered through your owner portal.", icon: "📊", iconType: "emoji", price: "Included in management fee", imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "400+", label: "Units Managed" },
    { id: uid("st"), value: "97%", label: "Occupancy Rate" },
    { id: uid("st"), value: "13 yr", label: "In Business" },
    { id: uid("st"), value: "24/7", label: "Maintenance Line" },
  ],

  testimonials: [
    { id: uid("t"), name: "William Foster", role: "Property Owner, 6 units", content: "Went from stressed landlord to totally hands-off owner. Monthly reports are clear and rent always arrives on time.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Cynthia Park", role: "Portfolio Investor", content: "Managing 12 units across the city used to consume my weekends. PropertyVault handles it all seamlessly now.", rating: 5 },
    { id: uid("t"), name: "Robert Nguyen", role: "Property Owner", content: "Their tenant screening process found us excellent long-term renters. Zero vacancy issues since switching.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Single Property", price: "8%", period: "of rent", description: "One rental property", features: ["Tenant sourcing", "Rent collection", "Maintenance coordination", "Monthly reporting"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Portfolio", price: "7%", period: "of rent", description: "2-10 rental properties", features: ["Everything in Single Property", "Priority maintenance response", "Dedicated portfolio manager", "Quarterly market reviews"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Large Portfolio", price: "Custom", description: "10+ rental properties", features: ["Custom fee structure", "Dedicated account team", "Priority everything"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What's included in your management fee?", answer: "Our management fee covers tenant sourcing, rent collection, maintenance coordination, inspections, lease management and financial reporting — no hidden add-on fees." },
    { id: uid("f"), question: "How do you screen tenants?", answer: "We conduct thorough background checks including credit history, employment verification, rental history and criminal background checks." },
    { id: uid("f"), question: "How fast do you respond to maintenance issues?", answer: "Our maintenance line is available 24/7, with emergency issues addressed within hours and routine requests typically within 48 hours." },
  ],

  team: [
    { id: uid("tm"), name: "Gregory Adams", role: "Portfolio Manager", bio: "13 years managing rental portfolios, oversees relationships with our 400+ managed units.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 51: NetSupport (IT Managed Services) ───────────────────────────

const NETSUPPORT_IT: TemplateIdentity = {
  slug: "netsupport-it",
  name: "NetSupport",
  description: "Professional IT support and managed services template with a clean, corporate tech aesthetic. Built for MSPs, IT helpdesks, and technology support businesses.",
  category: "Tech & Agency",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=85&fit=crop",
  tags: ["IT support", "managed services", "helpdesk", "technology", "MSP"],

  palette: {
    primary: "#06b6d4",
    primaryFg: "#ffffff",
    secondary: "#0c1a2e",
    accent: "#22d3ee",
    background: "#0c1a2e",
    foreground: "#f0f9ff",
    muted: "#1e293b",
    mutedFg: "#94a3b8",
    card: "#1e293b",
    border: "#334155",
    ring: "#06b6d4",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-netsupport-it .hero-badge { background: #06b6d4; color: #0c1a2e; border-radius: 9999px; font-weight: 700; }
    .template-netsupport-it .service-card { border-top: 3px solid #06b6d4; background: #1e293b; }
    .template-netsupport-it .stat-value { color: #22d3ee; font-weight: 700; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=90&fit=crop", alt: "IT technician at server rack" },
    about: { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&fit=crop", alt: "Network operations center" },
    services: [
      { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&fit=crop", alt: "Network monitoring" },
      { url: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=600&q=80&fit=crop", alt: "Helpdesk support" },
      { url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80&fit=crop", alt: "Cybersecurity monitoring" },
      { url: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80&fit=crop", alt: "Cloud infrastructure" },
      { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80&fit=crop", alt: "Server maintenance" },
      { url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80&fit=crop", alt: "IT consulting session" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80&fit=crop", alt: "Data center operations" },
      { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&fit=crop", alt: "Network operations" },
      { url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80&fit=crop", alt: "Security monitoring dashboard" },
      { url: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=800&q=80&fit=crop", alt: "Support team at work" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "IT Director" },
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Senior Network Engineer" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80&fit=crop", alt: "Get IT support" },
  },

  heroHeadline: "IT That Just Works",
  heroSubline: "Managed IT support for businesses of all sizes — proactive, responsive, and always on.",
  heroBadge: "💻 24/7 Helpdesk Support",
  heroCTA: "Get a Free Assessment",
  heroSecondaryCTA: "Our Services",
  siteName: "NetSupport IT",
  tagline: "IT that just works",
  phone: "+1 (555) 448-6620",
  email: "support@netsupportit.com",
  address: "400 Tech Park Drive, Metro City",
  aboutHeading: "Proactive IT Support for 150+ Businesses",
  aboutBody: "NetSupport provides fully managed IT services so your team can focus on the work that matters — not troubleshooting. We monitor your network 24/7, patch vulnerabilities before they're exploited, and resolve most helpdesk tickets in under an hour.",
  aboutHighlights: ["24/7 network monitoring", "Sub-1-hour average ticket response", "Proactive cybersecurity patching", "Flat monthly pricing, no surprise bills"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Managed IT Support", description: "Full helpdesk and IT infrastructure management with flat monthly pricing.", icon: "💻", iconType: "emoji", price: "From $95/user/mo", imageUrl: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Cybersecurity Services", description: "Endpoint protection, threat monitoring and security awareness training.", icon: "🔒", iconType: "emoji", price: "From $45/user/mo", imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Cloud Migration", description: "Migrate infrastructure and applications to the cloud with zero downtime planning.", icon: "☁️", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Network Monitoring", description: "24/7 proactive monitoring that catches issues before they cause downtime.", icon: "📡", iconType: "emoji", price: "Included in support plan", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Data Backup & Recovery", description: "Automated backups with tested disaster recovery plans for business continuity.", icon: "💾", iconType: "emoji", price: "From $25/user/mo", imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "IT Consulting", description: "Strategic technology planning to align your IT infrastructure with business goals.", icon: "🎯", iconType: "emoji", price: "From $175/hr", imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "150+", label: "Businesses Supported" },
    { id: uid("st"), value: "<1hr", label: "Avg. Ticket Response" },
    { id: uid("st"), value: "99.9%", label: "Uptime Delivered" },
    { id: uid("st"), value: "11 yr", label: "In Business" },
  ],

  testimonials: [
    { id: uid("t"), name: "Amanda Reyes", role: "Operations Director", company: "Meridian Logistics", content: "Switched from reactive break-fix IT to NetSupport's managed model and our downtime dropped to nearly zero.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Kevin Chow", role: "CFO", company: "Horizon Financial", content: "Their cybersecurity monitoring caught a phishing attempt before any damage was done. Worth every dollar.", rating: 5 },
    { id: uid("t"), name: "Rachel Kim", role: "Office Manager", content: "Helpdesk tickets get resolved fast, and their techs actually explain what happened instead of just fixing and leaving.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Essentials", price: "$65", period: "/user/mo", description: "Core helpdesk support", features: ["Business-hours helpdesk", "Remote support", "Basic security patching"], ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Managed IT", price: "$95", period: "/user/mo", description: "Full managed services", features: ["24/7 helpdesk & monitoring", "Cybersecurity included", "Data backup included", "Quarterly IT strategy review"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Enterprise", price: "Custom", description: "Complex, multi-site environments", features: ["Custom SLA terms", "Dedicated account team", "On-site support options"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What's your average response time?", answer: "Our average ticket response time is under one hour, with critical issues prioritised for immediate attention." },
    { id: uid("f"), question: "Do you support remote and hybrid teams?", answer: "Yes, our support model is fully equipped for remote, hybrid and in-office teams across multiple locations." },
    { id: uid("f"), question: "Can you migrate us from our current IT provider?", answer: "Yes, we handle the full transition process, including documentation review and infrastructure assessment, with minimal disruption." },
  ],

  team: [
    { id: uid("tm"), name: "Daniel Okafor", role: "IT Director", bio: "11 years in managed services, oversees strategy for all NetSupport client accounts.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Laura Bennett", role: "Senior Network Engineer", bio: "Specialises in network security and infrastructure design for growing businesses.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 52: GrowthLab (Digital Marketing Agency) ───────────────────────

const GROWTHLAB_AGENCY: TemplateIdentity = {
  slug: "growthlab-agency",
  name: "GrowthLab",
  description: "Bold digital marketing agency template with an editorial, results-focused design. Showcases service offerings, client results, and the agency's strategic approach.",
  category: "Tech & Agency",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200&q=85&fit=crop",
  tags: ["digital marketing", "agency", "SEO", "social media", "growth"],

  palette: {
    primary: "#8b5cf6",
    primaryFg: "#ffffff",
    secondary: "#2e1065",
    accent: "#c4b5fd",
    background: "#2e1065",
    foreground: "#faf5ff",
    muted: "#4c1d95",
    mutedFg: "#ddd6fe",
    card: "#4c1d95",
    border: "#6d28d9",
    ring: "#8b5cf6",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-growthlab-agency h1,.template-growthlab-agency h2 { letter-spacing: -0.03em; }
    .template-growthlab-agency .service-card { border-top: 3px solid #8b5cf6; background: #4c1d95; }
    .template-growthlab-agency .stat-value { color: #c4b5fd; font-weight: 900; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1600&q=90&fit=crop", alt: "Marketing team analyzing data" },
    about: { url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80&fit=crop", alt: "Agency team collaboration" },
    services: [
      { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&fit=crop", alt: "SEO strategy" },
      { url: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=600&q=80&fit=crop", alt: "Social media marketing" },
      { url: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&q=80&fit=crop", alt: "Analytics dashboard" },
      { url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&fit=crop", alt: "Content strategy" },
      { url: "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=600&q=80&fit=crop", alt: "PPC advertising" },
      { url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80&fit=crop", alt: "Brand strategy session" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&q=80&fit=crop", alt: "Agency workspace" },
      { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80&fit=crop", alt: "SEO analytics review" },
      { url: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800&q=80&fit=crop", alt: "Social campaign planning" },
      { url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80&fit=crop", alt: "Strategy session" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Founder & CEO" },
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Head of SEO" },
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Creative Director" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1200&q=80&fit=crop", alt: "Grow with us" },
  },

  heroHeadline: "Grow Faster. Rank Higher. Convert More.",
  heroSubline: "Data-driven digital marketing strategies that deliver measurable results for ambitious brands.",
  heroBadge: "🚀 300+ Campaigns Launched",
  heroCTA: "Get a Free Audit",
  heroSecondaryCTA: "View Our Work",
  siteName: "GrowthLab Agency",
  tagline: "Grow faster. Rank higher. Convert more.",
  phone: "+1 (555) 990-4471",
  email: "hello@growthlabagency.com",
  address: "77 Innovation Hub, Suite 300, Metro City",
  aboutHeading: "Data-Driven Growth for Ambitious Brands",
  aboutBody: "GrowthLab combines SEO, paid media, content and social strategy into unified growth campaigns that deliver measurable ROI. We don't chase vanity metrics — every strategy is built around the numbers that actually move your business forward: leads, revenue and customer lifetime value.",
  aboutHighlights: ["300+ campaigns launched", "Average 3.2x ROI for clients", "Dedicated strategist per account", "Transparent monthly reporting"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Work", url: "#gallery" },
    { id: "n3", label: "Team", url: "#team" },
    { id: "n4", label: "Results", url: "#testimonials" },
    { id: "n5", label: "Get a Quote", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "SEO Strategy", description: "Technical, on-page and content SEO to drive sustainable organic growth.", icon: "🔍", iconType: "emoji", price: "From $1,800/mo", imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Paid Media & PPC", description: "Google Ads and paid social campaigns optimised for conversion, not just clicks.", icon: "🎯", iconType: "emoji", price: "From $2,200/mo + ad spend", imageUrl: "https://images.unsplash.com/photo-1553484771-047a44eee27b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Social Media Marketing", description: "Content creation and community management that builds real engagement.", icon: "📱", iconType: "emoji", price: "From $1,500/mo", imageUrl: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Content Marketing", description: "Strategic content that ranks, builds authority and drives qualified traffic.", icon: "✍️", iconType: "emoji", price: "From $1,200/mo", imageUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Brand Strategy", description: "Positioning, messaging and visual identity work to sharpen how your brand shows up.", icon: "🎨", iconType: "emoji", price: "From $5,000 project", imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Analytics & Reporting", description: "Custom dashboards and monthly strategy reviews tied to real business outcomes.", icon: "📊", iconType: "emoji", price: "Included in all packages", imageUrl: "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "300+", label: "Campaigns Launched" },
    { id: uid("st"), value: "3.2x", label: "Average Client ROI" },
    { id: uid("st"), value: "9 yr", label: "In Business" },
    { id: uid("st"), value: "94%", label: "Client Retention" },
  ],

  testimonials: [
    { id: uid("t"), name: "Sophia Reyes", role: "Marketing Director", company: "Northwind Retail", content: "GrowthLab tripled our organic traffic in 8 months and our leads have never been higher quality. Real strategists, not just tacticians.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Marcus Webb", role: "Founder", company: "Vantage SaaS", content: "Their paid media team cut our cost-per-lead in half while increasing volume. Genuinely data-driven, not just buzzwords.", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Elena Rossi", role: "CMO", company: "Bright Home Goods", content: "Best agency partnership we've had. They think like an extension of our team, not an outside vendor.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Growth Starter", price: "$2,500", period: "/mo", description: "Single-channel focus", features: ["One core channel (SEO or PPC)", "Monthly strategy call", "Standard reporting dashboard"], ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Funnel", price: "$5,500", period: "/mo", description: "Most popular, multi-channel", features: ["SEO + paid media + social", "Dedicated strategist", "Bi-weekly strategy calls", "Custom analytics dashboard"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Enterprise", price: "Custom", description: "Full-service growth partnership", features: ["All channels included", "Dedicated account team", "Weekly strategy sessions"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How soon will we see results?", answer: "Paid media typically shows results within weeks, while SEO and content strategies build momentum over 3-6 months for sustainable, compounding growth." },
    { id: uid("f"), question: "Do you require long-term contracts?", answer: "We recommend a minimum 6-month engagement for meaningful results, but we don't lock clients into long-term contracts beyond that." },
    { id: uid("f"), question: "How do you report on results?", answer: "Every client gets a custom analytics dashboard plus regular strategy calls tied to actual business metrics — leads, revenue and ROI, not just vanity numbers." },
  ],

  team: [
    { id: uid("tm"), name: "Jordan Ellis", role: "Founder & CEO", bio: "9 years building growth strategies for SaaS and e-commerce brands. Leads agency-wide strategy.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Priya Nair", role: "Head of SEO", bio: "Technical SEO specialist with a track record of tripling organic traffic for enterprise clients.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Marcus Chen", role: "Creative Director", bio: "Leads brand strategy and creative campaigns across all client accounts.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 53: LensCroft (Photography Studio) ─────────────────────────────

const LENSCROFT_STUDIO: TemplateIdentity = {
  slug: "lenscroft-studio",
  name: "LensCroft",
  description: "Stunning photography studio template with a dark, gallery-forward aesthetic. Showcases portfolios, session packages, and the photographer's unique visual style.",
  category: "Photography",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=85&fit=crop",
  tags: ["photography", "studio", "portrait", "wedding", "commercial"],

  palette: {
    primary: "#f59e0b",
    primaryFg: "#0a0a0a",
    secondary: "#404040",
    accent: "#fbbf24",
    background: "#0a0a0a",
    foreground: "#fafafa",
    muted: "#171717",
    mutedFg: "#a3a3a3",
    card: "#171717",
    border: "#262626",
    ring: "#f59e0b",
    borderRadius: "0",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "600",
    letterSpacing: "0.01em",
  },
  customCss: `
    .template-lenscroft-studio .hero-badge { background: #f59e0b; color: #0a0a0a; }
    .template-lenscroft-studio .service-card { background: #171717; }
    .template-lenscroft-studio .stat-value { color: #f59e0b; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "dark-grid-cards",
    testimonials: "minimal-quote",
    features: "dark-alternating",
    stats: "plain-dark",
    cta: "dark-split",
    pricing: "minimal-dark",
    faq: "accordion-minimal",
    navigation: "transparent-dark",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1600&q=90&fit=crop", alt: "Photographer with camera" },
    about: { url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80&fit=crop", alt: "Photography studio setup" },
    services: [
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop", alt: "Wedding photography" },
      { url: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&q=80&fit=crop", alt: "Portrait session" },
      { url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80&fit=crop", alt: "Commercial photography" },
      { url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80&fit=crop", alt: "Family portraits" },
      { url: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=600&q=80&fit=crop", alt: "Event photography" },
      { url: "https://images.unsplash.com/photo-1533228100845-08145b01de14?w=600&q=80&fit=crop", alt: "Product photography" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&fit=crop", alt: "Wedding gallery" },
      { url: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&q=80&fit=crop", alt: "Studio portrait" },
      { url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80&fit=crop", alt: "Commercial shoot" },
      { url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80&fit=crop", alt: "Family session" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80&fit=crop&face", alt: "Lead Photographer" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=80&fit=crop", alt: "Book your session" },
  },

  heroHeadline: "Every Frame Tells a Story",
  heroSubline: "Professional photography for weddings, portraits, and brands — capturing moments that last forever.",
  heroBadge: "📷 500+ Sessions Captured",
  heroCTA: "Book a Session",
  heroSecondaryCTA: "View Portfolio",
  siteName: "LensCroft Studio",
  tagline: "Every frame tells a story",
  phone: "+1 (555) 337-8891",
  email: "hello@lenscroftstudio.com",
  address: "60 Gallery Row, Arts District",
  aboutHeading: "500+ Sessions, One Unmistakable Style",
  aboutBody: "LensCroft blends editorial composition with genuine emotion, whether we're documenting a wedding, capturing a family's story, or shooting product photography for a brand. Every session is shot on premium equipment and delivered with a fast, professional turnaround.",
  aboutHighlights: ["500+ sessions captured", "Fast 2-week delivery turnaround", "Full print & digital rights included", "Second shooter available for events"],

  navItems: [
    { id: "n1", label: "Portfolio", url: "#gallery" },
    { id: "n2", label: "Sessions", url: "#services" },
    { id: "n3", label: "Pricing", url: "#pricing" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Wedding Photography", description: "Full-day wedding coverage capturing every meaningful moment, from prep to reception.", icon: "💍", iconType: "emoji", price: "From $2,800", imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Portrait Sessions", description: "Studio or on-location portrait sessions for individuals, couples and professional headshots.", icon: "📸", iconType: "emoji", price: "From $350", imageUrl: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial Photography", description: "Product, brand and corporate photography for marketing and advertising use.", icon: "🏢", iconType: "emoji", price: "From $650", imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Family Sessions", description: "Relaxed, natural family photography sessions on-location or in-studio.", icon: "👨‍👩‍👧", iconType: "emoji", price: "From $400", imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Event Photography", description: "Corporate events, parties and celebrations documented candidly and professionally.", icon: "🎉", iconType: "emoji", price: "From $500", imageUrl: "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Product Photography", description: "Clean, high-resolution product shots for e-commerce and marketing use.", icon: "📦", iconType: "emoji", price: "From $45/item", imageUrl: "https://images.unsplash.com/photo-1533228100845-08145b01de14?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "500+", label: "Sessions Captured" },
    { id: uid("st"), value: "10 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "Client Rating" },
    { id: uid("st"), value: "2 wk", label: "Avg. Delivery Time" },
  ],

  testimonials: [
    { id: uid("t"), name: "Emily & James", role: "Wedding Clients", content: "Every photo felt like it captured exactly how the day felt. We cried looking through the gallery. Absolute artistry.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "David Chen", role: "Brand Founder", content: "Product photography elevated our entire online store. Sales noticeably improved after we updated our listings.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Sarah Miller", role: "Family Client", content: "Made our toddler feel completely comfortable and the photos are the most natural we've ever had taken.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Portrait Session", price: "$350", description: "1-hour session", features: ["1 hour session time", "1 location", "20 edited images", "Online gallery"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Wedding Package", price: "$2,800", description: "Full day coverage", features: ["8 hours coverage", "Second shooter included", "400+ edited images", "Online gallery & print rights"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Commercial Shoot", price: "From $650", description: "Brand & product photography", features: ["Half or full day options", "Studio or on-location", "Full usage rights included"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How long until we receive our photos?", answer: "Standard turnaround is 2 weeks for portrait sessions and 4-6 weeks for weddings, with a sneak peek gallery delivered within 48 hours." },
    { id: uid("f"), question: "Do you provide the raw, unedited files?", answer: "We deliver a curated set of professionally edited images. Raw files are available as an add-on for wedding packages." },
    { id: uid("f"), question: "Can we choose the location for our session?", answer: "Yes, we shoot both in-studio and on-location — we're happy to recommend spots or work with a location you have in mind." },
  ],

  team: [
    { id: uid("tm"), name: "Alex Rivera", role: "Lead Photographer & Founder", bio: "10 years capturing weddings, portraits and commercial work. Known for a timeless, editorial style.", avatar: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 54: ForeverEvents (Wedding Planning) ───────────────────────────

const FOREVER_EVENTS: TemplateIdentity = {
  slug: "forever-events",
  name: "ForeverEvents",
  description: "Romantic and elegant wedding planning template with a soft, luxurious aesthetic. Highlights planning packages, vendor coordination, and real wedding galleries.",
  category: "Events",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85&fit=crop",
  tags: ["wedding", "events", "planning", "coordination", "celebration"],

  palette: {
    primary: "#fb7185",
    primaryFg: "#ffffff",
    secondary: "#881337",
    accent: "#fda4af",
    background: "#fff1f2",
    foreground: "#4c0519",
    muted: "#ffe4e6",
    mutedFg: "#9f1239",
    card: "#ffffff",
    border: "#fecdd3",
    ring: "#fb7185",
    borderRadius: "1rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "500",
    letterSpacing: "0",
  },
  customCss: `
    .template-forever-events .hero-badge { background: #fb7185; color: white; border-radius: 9999px; }
    .template-forever-events .service-card { border-radius: 1rem; border-top: 3px solid #fb7185; }
    .template-forever-events .stat-value { color: #fb7185; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=85&fit=crop", alt: "Elegant wedding setup" },
    about: { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80&fit=crop", alt: "Wedding planner arranging details" },
    services: [
      { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80&fit=crop", alt: "Full wedding planning" },
      { url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80&fit=crop", alt: "Day-of coordination" },
      { url: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop", alt: "Vendor coordination" },
      { url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80&fit=crop", alt: "Venue styling" },
      { url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80&fit=crop", alt: "Floral design" },
      { url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80&fit=crop", alt: "Reception planning" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80&fit=crop", alt: "Real wedding celebration" },
      { url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80&fit=crop", alt: "Floral arrangement" },
      { url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80&fit=crop", alt: "Reception venue" },
      { url: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80&fit=crop", alt: "Wedding table setting" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Lead Wedding Planner" },
      { url: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&q=80&fit=crop&face", alt: "Day-of Coordinator" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80&fit=crop", alt: "Plan your day" },
  },

  heroHeadline: "Your Perfect Day, Perfectly Planned",
  heroSubline: "Award-winning wedding planners creating unforgettable celebrations — tailored to your love story.",
  heroBadge: "💍 200+ Weddings Planned",
  heroCTA: "Book a Consultation",
  heroSecondaryCTA: "View Real Weddings",
  siteName: "ForeverEvents",
  tagline: "Your perfect day, perfectly planned",
  phone: "+1 (555) 774-3391",
  email: "hello@foreverevents.com",
  address: "25 Celebration Lane, Metro City",
  aboutHeading: "200+ Weddings, Each One Uniquely Yours",
  aboutBody: "ForeverEvents has planned and coordinated over 200 weddings, from intimate elopements to 300-guest celebrations. We handle every detail — vendor sourcing, timeline management, and day-of coordination — so you can actually enjoy your engagement and your wedding day.",
  aboutHighlights: ["200+ weddings planned", "Trusted vendor network", "Full day-of coordination included", "Personalised planning for every budget"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Real Weddings", url: "#gallery" },
    { id: "n3", label: "Team", url: "#team" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Get Started", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Full Wedding Planning", description: "End-to-end planning from engagement to reception, including vendor sourcing and budget management.", icon: "💍", iconType: "emoji", price: "From $4,500", imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Day-of Coordination", description: "Full timeline management and vendor coordination for your wedding day, so you can be present.", icon: "📋", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Vendor Coordination", description: "We manage all vendor communication, contracts and logistics on your behalf.", icon: "🤝", iconType: "emoji", price: "From $1,200", imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Venue Styling", description: "Complete decor and styling design to bring your wedding vision to life.", icon: "🎨", iconType: "emoji", price: "From $2,200", imageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Floral Design", description: "Custom floral arrangements for ceremony, reception and bridal party.", icon: "💐", iconType: "emoji", price: "From $1,500", imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Elopement Packages", description: "Intimate elopement planning for couples wanting a smaller, personal celebration.", icon: "💕", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "200+", label: "Weddings Planned" },
    { id: uid("st"), value: "12 yr", label: "In Business" },
    { id: uid("st"), value: "5★", label: "Average Rating" },
    { id: uid("st"), value: "50+", label: "Trusted Vendor Partners" },
  ],

  testimonials: [
    { id: uid("t"), name: "Emma & Jack", role: "Married June 2025", content: "They handled everything so seamlessly we actually got to enjoy our own wedding. Every detail was perfect, exactly as we dreamed.", rating: 5, avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Priya & Arjun", role: "Married March 2025", content: "Our planner understood our vision from day one and brought it to life better than we imagined. Worth every penny.", rating: 5 },
    { id: uid("t"), name: "Chloe & Sam", role: "Eloped 2024", content: "Planned our intimate elopement in just 6 weeks and it was perfect. So grateful for their attention to detail.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Day-of Coordination", price: "$1,800", description: "You plan, we execute", features: ["Timeline creation", "Vendor coordination on the day", "8 hours on-site coordination"], ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Planning", price: "$4,500", description: "Most popular, complete service", features: ["End-to-end planning", "Vendor sourcing & negotiation", "Budget management", "Day-of coordination included"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Elopement Package", price: "$1,800", description: "Intimate celebration planning", features: ["Venue & vendor sourcing", "Styling & florals coordination", "Day-of coordination"], ctaLabel: "Get Started", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How far in advance should we book?", answer: "We recommend booking 9-12 months before your wedding date for full planning, though we can accommodate shorter timelines when availability allows." },
    { id: uid("f"), question: "Do you work with our chosen vendors?", answer: "Absolutely — we're happy to coordinate with vendors you've already selected, and we can recommend from our trusted network for anything you still need." },
    { id: uid("f"), question: "What's included in day-of coordination?", answer: "Day-of coordination includes full timeline creation, vendor confirmation, and on-site management so you don't have to worry about logistics." },
  ],

  team: [
    { id: uid("tm"), name: "Isabella Grant", role: "Lead Wedding Planner & Founder", bio: "12 years planning weddings, has coordinated over 200 celebrations from intimate elopements to grand affairs.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Maya Torres", role: "Day-of Coordinator", bio: "Manages timeline execution and vendor logistics to keep every wedding day running smoothly.", avatar: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 55: BrightMinds (Tutoring Centre) ──────────────────────────────

const BRIGHTMINDS_TUTOR: TemplateIdentity = {
  slug: "brightminds-tutor",
  name: "BrightMinds",
  description: "Friendly and encouraging tutoring centre template with a bright, student-focused design. Highlights subjects, tutor credentials, and enrolment steps.",
  category: "Education",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=85&fit=crop",
  tags: ["tutoring", "education", "students", "learning", "academic"],

  palette: {
    primary: "#3b82f6",
    primaryFg: "#ffffff",
    secondary: "#1e1b4b",
    accent: "#93c5fd",
    background: "#eff6ff",
    foreground: "#1e1b4b",
    muted: "#dbeafe",
    mutedFg: "#1e40af",
    card: "#ffffff",
    border: "#bfdbfe",
    ring: "#3b82f6",
    borderRadius: "1rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-brightminds-tutor .hero-badge { background: #3b82f6; color: white; border-radius: 9999px; }
    .template-brightminds-tutor .service-card { border-radius: 1rem; border-top: 3px solid #3b82f6; }
    .template-brightminds-tutor .stat-value { color: #3b82f6; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=85&fit=crop", alt: "Tutor helping student" },
    about: { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&fit=crop", alt: "Students studying together" },
    services: [
      { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80&fit=crop", alt: "Math tutoring" },
      { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80&fit=crop", alt: "Science tutoring" },
      { url: "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=600&q=80&fit=crop", alt: "English tutoring" },
      { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&fit=crop", alt: "One-on-one tutoring" },
      { url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80&fit=crop", alt: "Group study session" },
      { url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&q=80&fit=crop", alt: "Exam preparation" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80&fit=crop", alt: "Tutoring session" },
      { url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80&fit=crop", alt: "Study group" },
      { url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80&fit=crop", alt: "Science lab session" },
      { url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80&fit=crop", alt: "Exam prep class" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Head Tutor" },
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Math Specialist" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80&fit=crop", alt: "Enroll today" },
  },

  heroHeadline: "Unlock Every Student's Potential",
  heroSubline: "Expert tutoring across all subjects — tailored lessons that build confidence and results.",
  heroBadge: "📚 500+ Students Tutored",
  heroCTA: "Book a Free Assessment",
  heroSecondaryCTA: "View Subjects",
  siteName: "BrightMinds Tutoring",
  tagline: "Unlock every student's potential",
  phone: "+1 (555) 220-9931",
  email: "hello@brightmindstutor.com",
  address: "150 Learning Lane, Metro City",
  aboutHeading: "Personalised Tutoring That Builds Real Confidence",
  aboutBody: "BrightMinds pairs students with qualified, encouraging tutors who tailor lessons to each student's learning style and pace. Whether it's catching up, staying ahead, or preparing for exams, our structured approach turns frustration into genuine confidence and results.",
  aboutHighlights: ["Qualified, background-checked tutors", "Personalised learning plans", "In-person & online sessions available", "Free initial skills assessment"],

  navItems: [
    { id: "n1", label: "Subjects", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "Tutors", url: "#team" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Enroll Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Math Tutoring", description: "From basic arithmetic to calculus, personalised math support for all grade levels.", icon: "🔢", iconType: "emoji", price: "From $45/hr", imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Science Tutoring", description: "Biology, chemistry and physics tutoring with hands-on explanation of concepts.", icon: "🔬", iconType: "emoji", price: "From $45/hr", imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "English & Writing", description: "Reading comprehension, essay writing and literature analysis support.", icon: "📖", iconType: "emoji", price: "From $45/hr", imageUrl: "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Exam Preparation", description: "Targeted prep for standardized tests and major exams with practice tests included.", icon: "📝", iconType: "emoji", price: "From $55/hr", imageUrl: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Group Study Sessions", description: "Small-group tutoring for students who learn well collaboratively, at a lower cost.", icon: "👥", iconType: "emoji", price: "From $25/hr", imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Online Tutoring", description: "Live one-on-one online sessions with the same tutors, from the comfort of home.", icon: "💻", iconType: "emoji", price: "From $40/hr", imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "500+", label: "Students Tutored" },
    { id: uid("st"), value: "92%", label: "Grade Improvement Rate" },
    { id: uid("st"), value: "11 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "Parent Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Jennifer Adams", role: "Parent", content: "My son went from struggling with math to genuinely enjoying it. His tutor's patience made all the difference.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Marcus Lee", role: "High School Student", content: "Helped me raise my SAT score by 200 points. The practice tests and feedback were exactly what I needed.", rating: 5 },
    { id: uid("t"), name: "Patricia Nguyen", role: "Parent", content: "Both my kids tutor here now. The teachers genuinely care and communicate progress clearly every week.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Single Session", price: "$45", period: "/hr", description: "One-on-one tutoring", features: ["Personalised lesson plan", "Progress tracking", "In-person or online"], ctaLabel: "Book Session", ctaUrl: "#contact" },
    { id: uid("p"), name: "Monthly Package", price: "$650", period: "/mo", description: "4 sessions/week, most popular", features: ["16 tutoring sessions", "Dedicated tutor match", "Monthly progress report", "Free skills reassessment"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Group Sessions", price: "$25", period: "/hr", description: "Small group tutoring", features: ["Groups of 3-5 students", "Same subject focus", "Collaborative learning"], ctaLabel: "Get Started", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How do you match students with tutors?", answer: "We start with a free skills assessment to understand your child's needs and learning style, then match them with the best-suited qualified tutor." },
    { id: uid("f"), question: "Do you offer online tutoring?", answer: "Yes, we offer live one-on-one online sessions with the same qualified tutors, using interactive tools for an effective learning experience." },
    { id: uid("f"), question: "How often should my child attend sessions?", answer: "This depends on your child's goals — weekly sessions work well for ongoing support, while more frequent sessions help with exam prep or catching up." },
  ],

  team: [
    { id: uid("tm"), name: "Dr. Susan Whitfield", role: "Head Tutor & Founder", bio: "Former high school teacher with 11 years in tutoring. Oversees curriculum and tutor training.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Michael Torres", role: "Math Specialist", bio: "Specialises in making math approachable for students who struggle with confidence in the subject.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 56: SkillForge (Vocational Training) ───────────────────────────

const SKILLFORGE_TRAINING: TemplateIdentity = {
  slug: "skillforge-training",
  name: "SkillForge",
  description: "Professional vocational training centre template with a structured, outcomes-focused design. Highlights certifications, course listings, and career pathways.",
  category: "Education",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=85&fit=crop",
  tags: ["vocational training", "certificates", "courses", "skills", "professional development"],

  palette: {
    primary: "#14b8a6",
    primaryFg: "#ffffff",
    secondary: "#064e3b",
    accent: "#5eead4",
    background: "#064e3b",
    foreground: "#f0fdfa",
    muted: "#065f46",
    mutedFg: "#6ee7b7",
    card: "#065f46",
    border: "#047857",
    ring: "#14b8a6",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-skillforge-training .hero-badge { background: #14b8a6; color: white; border-radius: 9999px; }
    .template-skillforge-training .service-card { border-top: 3px solid #14b8a6; background: #065f46; }
    .template-skillforge-training .stat-value { color: #5eead4; font-weight: 700; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=90&fit=crop", alt: "Vocational training class" },
    about: { url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80&fit=crop", alt: "Hands-on skills training" },
    services: [
      { url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80&fit=crop", alt: "Trade skills course" },
      { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80&fit=crop", alt: "Classroom training" },
      { url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&q=80&fit=crop", alt: "Certification exam prep" },
      { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&fit=crop", alt: "Practical workshop" },
      { url: "https://images.unsplash.com/photo-1552664688-cf412ec27db2?w=600&q=80&fit=crop", alt: "Industry certification" },
      { url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&fit=crop", alt: "One-on-one mentoring" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80&fit=crop", alt: "Training facility" },
      { url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80&fit=crop", alt: "Hands-on workshop" },
      { url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80&fit=crop", alt: "Practical training session" },
      { url: "https://images.unsplash.com/photo-1552664688-cf412ec27db2?w=800&q=80&fit=crop", alt: "Graduation certification" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Program Director" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80&fit=crop", alt: "Enroll in a course" },
  },

  heroHeadline: "Build Skills That Open Doors",
  heroSubline: "Accredited vocational courses and professional certifications to launch or advance your career.",
  heroBadge: "🎓 Accredited Programs",
  heroCTA: "Explore Courses",
  heroSecondaryCTA: "View Career Paths",
  siteName: "SkillForge Training",
  tagline: "Build skills that open doors",
  phone: "+1 (555) 990-3321",
  email: "admissions@skillforgetraining.com",
  address: "300 Trade Skills Way, Metro City",
  aboutHeading: "Accredited Training, Real Career Outcomes",
  aboutBody: "SkillForge offers hands-on vocational training and industry-recognised certifications across trades, technology and professional skills. Our instructors bring real-world experience, and our job placement support helps graduates transition directly into careers.",
  aboutHighlights: ["Industry-accredited certifications", "Hands-on, practical training", "Job placement support included", "Flexible evening & weekend classes"],

  navItems: [
    { id: "n1", label: "Courses", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Enroll Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Trade Certifications", description: "Hands-on training and certification in electrical, plumbing and construction trades.", icon: "🔧", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "IT & Tech Certifications", description: "Industry-recognised IT certifications preparing you for in-demand tech careers.", icon: "💻", iconType: "emoji", price: "From $1,200", imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Business & Professional Skills", description: "Project management, leadership and workplace skills courses for career advancement.", icon: "📊", iconType: "emoji", price: "From $850", imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Exam Preparation", description: "Focused certification exam prep with practice tests and pass-rate guarantees.", icon: "📝", iconType: "emoji", price: "From $450", imageUrl: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Practical Workshops", description: "Weekend intensive workshops for hands-on skills development in specific trades.", icon: "🛠️", iconType: "emoji", price: "From $350", imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Career Mentoring", description: "One-on-one career guidance and job placement support for program graduates.", icon: "🎯", iconType: "emoji", price: "Included with programs", imageUrl: "https://images.unsplash.com/photo-1552664688-cf412ec27db2?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "3,000+", label: "Graduates" },
    { id: uid("st"), value: "88%", label: "Job Placement Rate" },
    { id: uid("st"), value: "15 yr", label: "In Business" },
    { id: uid("st"), value: "20+", label: "Certification Programs" },
  ],

  testimonials: [
    { id: uid("t"), name: "Marcus Bell", role: "Electrician Graduate", content: "The hands-on training gave me real confidence walking into my apprenticeship. Instructors actually worked in the trade.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Aisha Johnson", role: "IT Certification Graduate", content: "Passed my certification exam on the first try thanks to their prep program. Now working in my dream field.", rating: 5 },
    { id: uid("t"), name: "Robert Diaz", role: "Career Changer", content: "Switched careers at 40 and SkillForge's job placement support helped me land a role within a month of graduating.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Single Course", price: "From $850", description: "One certification course", features: ["Full course materials", "Instructor-led training", "Certification exam included"], ctaLabel: "Enroll Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Career Pathway", price: "From $1,800", description: "Full trade/tech program, most popular", features: ["Multi-course program", "Hands-on practical training", "Job placement support", "Career mentoring included"], highlighted: true, badge: "Most Popular", ctaLabel: "Enroll Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Corporate Training", price: "Custom Quote", description: "Team training for employers", features: ["Custom curriculum", "On-site or online delivery", "Group certification tracking"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Are your certifications industry-recognised?", answer: "Yes, all our programs lead to industry-accredited certifications recognised by employers in their respective fields." },
    { id: uid("f"), question: "Do you offer job placement support?", answer: "Yes, all career pathway programs include job placement support and career mentoring to help graduates transition into employment." },
    { id: uid("f"), question: "Can I attend classes in the evening or on weekends?", answer: "Yes, we offer flexible evening and weekend class schedules to accommodate working students." },
  ],

  team: [
    { id: uid("tm"), name: "Patricia Moore", role: "Program Director", bio: "15 years in vocational education, oversees curriculum development and industry partnerships.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 57: Threadline (Fashion Boutique) ──────────────────────────────

const THREADLINE: TemplateIdentity = {
  slug: "threadline",
  name: "Threadline",
  description: "Elegant fashion and clothing store template with an editorial, magazine-inspired layout. Perfect for boutique clothing retailers and online fashion brands.",
  category: "Retail & Shop",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85&fit=crop",
  tags: ["fashion", "clothing", "boutique", "apparel", "retail"],

  palette: {
    primary: "#f43f5e",
    primaryFg: "#ffffff",
    secondary: "#4c0519",
    accent: "#fb7185",
    background: "#fff1f2",
    foreground: "#4c0519",
    muted: "#ffe4e6",
    mutedFg: "#9f1239",
    card: "#ffffff",
    border: "#fecdd3",
    ring: "#f43f5e",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "500",
    letterSpacing: "0.02em",
  },
  customCss: `
    .template-threadline h1,.template-threadline h2 { letter-spacing: 0.03em; text-transform: uppercase; }
    .template-threadline .service-card { border-radius: 0; }
    .template-threadline .stat-value { color: #f43f5e; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=85&fit=crop", alt: "Fashion boutique display" },
    about: { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80&fit=crop", alt: "Curated fashion rack" },
    services: [
      { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&fit=crop", alt: "New arrivals" },
      { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80&fit=crop", alt: "Dresses collection" },
      { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80&fit=crop", alt: "Accessories" },
      { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&fit=crop", alt: "Outerwear collection" },
      { url: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&q=80&fit=crop", alt: "Shoes collection" },
      { url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80&fit=crop", alt: "Handbags collection" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80&fit=crop", alt: "Store interior" },
      { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80&fit=crop", alt: "Styled look" },
      { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80&fit=crop", alt: "Accessories display" },
      { url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&fit=crop", alt: "Seasonal collection" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Founder & Buyer" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80&fit=crop", alt: "Shop the collection" },
  },

  heroHeadline: "Wear Your Story",
  heroSubline: "Curated fashion for the modern wardrobe — discover new arrivals and timeless styles.",
  heroBadge: "✨ New Arrivals Weekly",
  heroCTA: "Shop New Arrivals",
  heroSecondaryCTA: "View Lookbook",
  siteName: "Threadline",
  tagline: "Wear your story",
  phone: "+1 (555) 448-7729",
  email: "hello@threadline.com",
  address: "88 Fashion District, Metro City",
  aboutHeading: "Curated Fashion for the Modern Wardrobe",
  aboutBody: "Threadline curates timeless and on-trend pieces from independent designers and quality manufacturers, so every item feels intentional, not disposable. We refresh our collection weekly and offer free shipping and easy returns on every order.",
  aboutHighlights: ["Curated from independent designers", "New arrivals every week", "Free shipping over $100", "Easy 30-day returns"],

  navItems: [
    { id: "n1", label: "Shop", url: "#services" },
    { id: "n2", label: "Lookbook", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "New Arrivals", description: "Fresh styles added weekly, curated for the modern, versatile wardrobe.", icon: "✨", iconType: "emoji", price: "From $45", imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Dresses", description: "From everyday to occasion wear, dresses for every part of your life.", icon: "👗", iconType: "emoji", price: "From $65", imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Accessories", description: "Jewelry, scarves and finishing touches to complete any outfit.", icon: "💍", iconType: "emoji", price: "From $20", imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Outerwear", description: "Jackets and coats that layer effortlessly with your existing wardrobe.", icon: "🧥", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Shoes", description: "Comfortable, stylish footwear for every occasion.", icon: "👠", iconType: "emoji", price: "From $75", imageUrl: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Handbags", description: "Statement and everyday bags from independent and established designers.", icon: "👜", iconType: "emoji", price: "From $95", imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "10,000+", label: "Happy Customers" },
    { id: uid("st"), value: "4.7★", label: "Customer Rating" },
    { id: uid("st"), value: "Weekly", label: "New Arrivals" },
    { id: uid("st"), value: "30-Day", label: "Easy Returns" },
  ],

  testimonials: [
    { id: uid("t"), name: "Isabella Cruz", role: "Verified Buyer", content: "The quality is incredible for the price point. I get compliments every time I wear something from Threadline.", rating: 5, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Olivia Bennett", role: "Verified Buyer", content: "Returns were completely hassle-free when a dress didn't fit. Will definitely order again.", rating: 5 },
    { id: uid("t"), name: "Maya Okafor", role: "Verified Buyer", content: "Love that they curate from independent designers — my pieces always feel unique, never generic.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Essentials Bundle", price: "$99", description: "3-piece wardrobe starter", features: ["1 dress or top", "1 accessory", "Free shipping"], ctaLabel: "Shop Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Complete Look", price: "$189", description: "Full outfit, most popular", features: ["1 outerwear or dress", "1 accessory", "1 pair shoes", "Free shipping & returns"], highlighted: true, badge: "Best Value", ctaLabel: "Shop Now", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What's your return policy?", answer: "We offer easy 30-day returns on unworn items with tags attached, with free return shipping on orders over $100." },
    { id: uid("f"), question: "How often do you add new items?", answer: "We refresh our collection with new arrivals every week — sign up for our newsletter to be first to shop new drops." },
    { id: uid("f"), question: "Do you ship internationally?", answer: "Yes, we ship to most countries — shipping costs and delivery times are calculated at checkout based on your location." },
  ],
};

// ─── TEMPLATE 58: VaultStore (Storage & Removals) ────────────────────────────

const VAULTSTORE: TemplateIdentity = {
  slug: "vaultstore",
  name: "VaultStore",
  description: "Professional storage and removals template with a trustworthy, clean layout. Ideal for self-storage facilities, moving companies, and packing services.",
  category: "General Business",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=1200&q=85&fit=crop",
  tags: ["storage", "removals", "moving", "self-storage", "packing"],

  palette: {
    primary: "#3b82f6",
    primaryFg: "#ffffff",
    secondary: "#1e3a5f",
    accent: "#93c5fd",
    background: "#f8fafc",
    foreground: "#1e3a5f",
    muted: "#eff6ff",
    mutedFg: "#1e40af",
    card: "#ffffff",
    border: "#dbeafe",
    ring: "#3b82f6",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-vaultstore .hero-badge { background: #3b82f6; color: white; border-radius: 9999px; }
    .template-vaultstore .service-card { border-top: 3px solid #3b82f6; }
    .template-vaultstore .stat-value { color: #3b82f6; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=900&q=85&fit=crop", alt: "Self-storage facility" },
    about: { url: "https://images.unsplash.com/photo-1580250891028-7a71a56ef8a2?w=800&q=80&fit=crop", alt: "Moving truck loading" },
    services: [
      { url: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&q=80&fit=crop", alt: "Self-storage units" },
      { url: "https://images.unsplash.com/photo-1580250891028-7a71a56ef8a2?w=600&q=80&fit=crop", alt: "Residential moving" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", alt: "Packing service" },
      { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&fit=crop", alt: "Commercial moving" },
      { url: "https://images.unsplash.com/photo-1600518464658-6a8be0fbb6c9?w=600&q=80&fit=crop", alt: "Climate-controlled storage" },
      { url: "https://images.unsplash.com/photo-1600880292630-ee8a00847a68?w=600&q=80&fit=crop", alt: "Vehicle storage" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=800&q=80&fit=crop", alt: "Storage facility exterior" },
      { url: "https://images.unsplash.com/photo-1580250891028-7a71a56ef8a2?w=800&q=80&fit=crop", alt: "Moving day" },
      { url: "https://images.unsplash.com/photo-1600518464658-6a8be0fbb6c9?w=800&q=80&fit=crop", alt: "Climate-controlled unit" },
      { url: "https://images.unsplash.com/photo-1600880292630-ee8a00847a68?w=800&q=80&fit=crop", alt: "Secure storage" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Operations Manager" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=1200&q=80&fit=crop", alt: "Reserve your unit" },
  },

  heroHeadline: "Store More, Stress Less",
  heroSubline: "Secure storage and professional removals — your belongings are safe in our hands.",
  heroBadge: "🔐 24/7 Secure Access",
  heroCTA: "Reserve a Unit",
  heroSecondaryCTA: "Get a Moving Quote",
  siteName: "VaultStore",
  tagline: "Store more, stress less",
  phone: "+1 (555) 660-4471",
  email: "info@vaultstore.com",
  address: "500 Storage Way, Metro City",
  aboutHeading: "Secure Storage & Stress-Free Moving Since 2010",
  aboutBody: "VaultStore provides secure, climate-controlled self-storage alongside full-service residential and commercial moving. Every unit is monitored 24/7 with individual alarm access, and our moving crews are trained, insured and background-checked.",
  aboutHighlights: ["24/7 monitored, secure facility", "Climate-controlled units available", "Insured, background-checked moving crews", "Free moving quote, no obligation"],

  navItems: [
    { id: "n1", label: "Storage", url: "#services" },
    { id: "n2", label: "Moving", url: "#services" },
    { id: "n3", label: "Pricing", url: "#pricing" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Self-Storage Units", description: "Secure, climate-controlled storage units in various sizes, month-to-month rental.", icon: "🔐", iconType: "emoji", price: "From $59/mo", imageUrl: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Residential Moving", description: "Full-service home moving, from apartments to full houses, local and long-distance.", icon: "🏠", iconType: "emoji", price: "From $450", imageUrl: "https://images.unsplash.com/photo-1580250891028-7a71a56ef8a2?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Commercial Moving", description: "Office and business relocations planned to minimise downtime.", icon: "🏢", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Packing Services", description: "Professional packing and unpacking using quality materials to protect your belongings.", icon: "📦", iconType: "emoji", price: "From $180", imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Climate-Controlled Storage", description: "Temperature and humidity controlled units for sensitive items like electronics and antiques.", icon: "🌡️", iconType: "emoji", price: "From $89/mo", imageUrl: "https://images.unsplash.com/photo-1600518464658-6a8be0fbb6c9?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Vehicle Storage", description: "Secure indoor and outdoor storage for cars, boats and RVs.", icon: "🚗", iconType: "emoji", price: "From $99/mo", imageUrl: "https://images.unsplash.com/photo-1600880292630-ee8a00847a68?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "800+", label: "Storage Units" },
    { id: uid("st"), value: "5,000+", label: "Moves Completed" },
    { id: uid("st"), value: "15 yr", label: "In Business" },
    { id: uid("st"), value: "24/7", label: "Secure Access" },
  ],

  testimonials: [
    { id: uid("t"), name: "Rebecca Lang", role: "Homeowner", content: "Our movers were careful with everything and finished ahead of schedule. Stress-free experience from start to finish.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Frank Delgado", role: "Business Owner", content: "Moved our office over a weekend with zero disruption to operations. Highly professional crew.", rating: 5 },
    { id: uid("t"), name: "Susan Park", role: "Storage Customer", content: "Climate-controlled unit kept my antiques in perfect condition for two years. Facility always felt secure.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Small Unit", price: "$59", period: "/mo", description: "5x5 storage unit", features: ["24/7 secure access", "Month-to-month lease", "Individual unit alarm"], ctaLabel: "Reserve Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Local Move", price: "From $450", description: "Full-service local moving, most popular", features: ["2-3 person crew", "Truck & equipment included", "Basic insurance included"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full-Service Package", price: "Custom Quote", description: "Move + storage + packing", features: ["Packing service included", "Moving + temporary storage", "Full-value insurance available"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How secure is your storage facility?", answer: "Our facility has 24/7 video monitoring, individual unit alarms, and gated keycard access for residents only." },
    { id: uid("f"), question: "Do you offer climate-controlled units?", answer: "Yes, climate-controlled units are available for sensitive items like electronics, artwork and antiques." },
    { id: uid("f"), question: "Are your movers insured?", answer: "Yes, all our moving crews are fully insured and background-checked, and we offer additional full-value insurance for high-value moves." },
  ],

  team: [
    { id: uid("tm"), name: "Gary Thompson", role: "Operations Manager", bio: "15 years in storage and logistics, oversees facility security and moving crew training.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 59: TorqueAuto (Car Servicing) ─────────────────────────────────

const TORQUE_AUTO: TemplateIdentity = {
  slug: "torque-auto",
  name: "TorqueAuto",
  description: "High-energy car servicing template with a dark, performance-inspired design. Ideal for independent mechanics and automotive service centres.",
  category: "Automotive",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&q=85&fit=crop",
  tags: ["car service", "mechanic", "auto repair", "vehicle maintenance"],

  palette: {
    primary: "#ef4444",
    primaryFg: "#ffffff",
    secondary: "#3f3f46",
    accent: "#f87171",
    background: "#09090b",
    foreground: "#fafafa",
    muted: "#18181b",
    mutedFg: "#a1a1aa",
    card: "#18181b",
    border: "#27272a",
    ring: "#ef4444",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-torque-auto h1,.template-torque-auto h2 { text-transform: uppercase; }
    .template-torque-auto .service-card { border-top: 3px solid #ef4444; background: #18181b; }
    .template-torque-auto .stat-value { color: #ef4444; font-weight: 900; }
  `,

  variants: {
    hero: "fullscreen-overlay",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=90&fit=crop", alt: "Mechanic working on car engine" },
    about: { url: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80&fit=crop", alt: "Auto workshop interior" },
    services: [
      { url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&q=80&fit=crop", alt: "Engine diagnostics" },
      { url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&q=80&fit=crop", alt: "Logbook servicing" },
      { url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&q=80&fit=crop", alt: "Brake repair" },
      { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80&fit=crop", alt: "Oil change service" },
      { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80&fit=crop", alt: "Engine repair" },
      { url: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600&q=80&fit=crop", alt: "Vehicle inspection" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80&fit=crop", alt: "Workshop bay" },
      { url: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80&fit=crop", alt: "Technician at work" },
      { url: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80&fit=crop", alt: "Fully equipped garage" },
      { url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&q=80&fit=crop", alt: "Vehicle lift bay" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Master Mechanic" },
      { url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face", alt: "Diagnostic Specialist" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&q=80&fit=crop", alt: "Book a service" },
  },

  heroHeadline: "Expert Car Care You Can Trust",
  heroSubline: "Fully equipped workshop with certified mechanics — from logbook servicing to major repairs.",
  heroBadge: "🔧 ASE Certified Technicians",
  heroCTA: "Book a Service",
  heroSecondaryCTA: "Get a Quote",
  siteName: "TorqueAuto Service Centre",
  tagline: "Expert car care you can trust",
  phone: "+1 (555) 337-6620",
  email: "service@torqueauto.com",
  address: "90 Mechanic Row, Metro City",
  aboutHeading: "Certified Mechanics, Honest Pricing Since 2010",
  aboutBody: "TorqueAuto is a fully equipped independent workshop handling everything from routine logbook servicing to major engine and transmission repairs. Our ASE-certified technicians use manufacturer-grade diagnostic equipment and always call before any additional work — no surprise bills.",
  aboutHighlights: ["ASE certified technicians", "Manufacturer-grade diagnostic equipment", "No work without your approval first", "Loaner cars available for major repairs"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Logbook Servicing", description: "Manufacturer-scheduled servicing that keeps your warranty valid without dealer prices.", icon: "📋", iconType: "emoji", price: "From $180", imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Engine Diagnostics", description: "Computerised diagnostics to accurately pinpoint engine and electrical issues.", icon: "🔍", iconType: "emoji", price: "From $95", imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Brake Repair & Service", description: "Brake pad, rotor and full brake system repair with a safety inspection included.", icon: "🛑", iconType: "emoji", price: "From $220", imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Oil Change", description: "Quick, quality oil and filter changes using manufacturer-recommended products.", icon: "🛢️", iconType: "emoji", price: "From $65", imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Major Repairs", description: "Engine and transmission repair and rebuild for vehicles of all makes and models.", icon: "⚙️", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Pre-Purchase Inspection", description: "Comprehensive inspection before you buy a used vehicle, with a full written report.", icon: "📝", iconType: "emoji", price: "From $120", imageUrl: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "20,000+", label: "Services Completed" },
    { id: uid("st"), value: "16 yr", label: "In Business" },
    { id: uid("st"), value: "4.8★", label: "Customer Rating" },
    { id: uid("st"), value: "Same-Day", label: "Service Available" },
  ],

  testimonials: [
    { id: uid("t"), name: "Chris Donovan", role: "Regular Customer", content: "Half the price of the dealer and my warranty stayed valid. They explain everything before doing any work. Trustworthy shop.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Maria Santos", role: "Customer", content: "Diagnosed and fixed an issue two other shops couldn't figure out. Genuinely skilled technicians here.", rating: 5 },
    { id: uid("t"), name: "Todd Weber", role: "Fleet Manager", content: "We service our entire company fleet here. Reliable, fair pricing and they work around our schedule.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Basic Service", price: "$180", description: "Standard logbook service", features: ["Oil & filter change", "Multi-point inspection", "Fluid top-ups"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Service", price: "$320", description: "Most popular, comprehensive", features: ["Everything in Basic", "Brake inspection", "Diagnostic scan", "Safety certification"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Major Repair", price: "Custom Quote", description: "Engine, transmission or major work", features: ["Free diagnostic with repair", "Detailed written quote", "Loaner car available"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Will servicing here void my manufacturer warranty?", answer: "No, by law you can service your vehicle at any qualified independent workshop without voiding your manufacturer warranty, as long as we use approved parts and follow the service schedule." },
    { id: uid("f"), question: "Do you call before doing extra work?", answer: "Always. We never perform work beyond what you've approved without calling you first with a clear explanation and quote." },
    { id: uid("f"), question: "Do you offer loaner cars?", answer: "Yes, loaner cars are available for major repairs that require your vehicle to stay overnight or longer." },
  ],

  team: [
    { id: uid("tm"), name: "Tony Marchetti", role: "Master Mechanic & Owner", bio: "20 years turning wrenches, ASE certified across all major systems.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Dave Reilly", role: "Diagnostic Specialist", bio: "Specialises in complex electrical and engine diagnostic work.", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 60: GripZone (Tyre Shop) ────────────────────────────────────────

const GRIPZONE_TYRES: TemplateIdentity = {
  slug: "gripzone-tyres",
  name: "GripZone",
  description: "Focused tyre shop template with a bold, sporty visual identity. Highlights tyre brands, fitting services, and wheel alignment.",
  category: "Automotive",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=85&fit=crop",
  tags: ["tyre shop", "wheel alignment", "tyres", "automotive"],

  palette: {
    primary: "#eab308",
    primaryFg: "#171717",
    secondary: "#57534e",
    accent: "#facc15",
    background: "#171717",
    foreground: "#fafaf9",
    muted: "#292524",
    mutedFg: "#a8a29e",
    card: "#292524",
    border: "#44403c",
    ring: "#eab308",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "900",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-gripzone-tyres h1,.template-gripzone-tyres h2 { text-transform: uppercase; }
    .template-gripzone-tyres .service-card { border-top: 3px solid #eab308; background: #292524; }
    .template-gripzone-tyres .stat-value { color: #eab308; font-weight: 900; }
  `,

  variants: {
    hero: "split-image-right",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "bold-dark-row",
    cta: "orange-banner",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=900&q=85&fit=crop", alt: "Tyre fitting service" },
    about: { url: "https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80&fit=crop", alt: "Tyre shop interior" },
    services: [
      { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80&fit=crop", alt: "Tyre fitting" },
      { url: "https://images.unsplash.com/photo-1600661653561-629509216228?w=600&q=80&fit=crop", alt: "Wheel alignment" },
      { url: "https://images.unsplash.com/photo-1518987048-93e29699e79a?w=600&q=80&fit=crop", alt: "Tyre balancing" },
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", alt: "Tyre rotation" },
      { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80&fit=crop", alt: "Puncture repair" },
      { url: "https://images.unsplash.com/photo-1600661653561-629509216228?w=600&q=80&fit=crop", alt: "Wheel and tyre package" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80&fit=crop", alt: "Tyre shop showroom" },
      { url: "https://images.unsplash.com/photo-1600661653561-629509216228?w=800&q=80&fit=crop", alt: "Alignment bay" },
      { url: "https://images.unsplash.com/photo-1518987048-93e29699e79a?w=800&q=80&fit=crop", alt: "Tyre stock" },
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80&fit=crop", alt: "Fitting bay" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Head Fitter" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80&fit=crop", alt: "Book a fitting" },
  },

  heroHeadline: "Stay Safe on the Road",
  heroSubline: "Premium tyre fitting and wheel alignment — all major brands, competitive pricing, same-day service.",
  heroBadge: "🛞 All Major Brands Stocked",
  heroCTA: "Book a Fitting",
  heroSecondaryCTA: "Get a Price",
  siteName: "GripZone Tyres",
  tagline: "Stay safe on the road",
  phone: "+1 (555) 220-3391",
  email: "info@gripzonetyres.com",
  address: "45 Wheel Way, Metro City",
  aboutHeading: "All Major Tyre Brands, Fitted Same Day",
  aboutBody: "GripZone stocks all major tyre brands and offers same-day fitting, wheel alignment and balancing at competitive prices. Our technicians use computerised alignment equipment for precision every time, and we offer a price match guarantee against any local competitor.",
  aboutHighlights: ["All major tyre brands stocked", "Same-day fitting available", "Computerised wheel alignment", "Price match guarantee"],

  navItems: [
    { id: "n1", label: "Tyres", url: "#services" },
    { id: "n2", label: "Pricing", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Tyre Fitting", description: "Professional fitting for all tyre brands and sizes, most jobs done in under an hour.", icon: "🛞", iconType: "emoji", price: "From $25/tyre", imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Wheel Alignment", description: "Computerised 4-wheel alignment to extend tyre life and improve handling.", icon: "📐", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1600661653561-629509216228?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Wheel Balancing", description: "Precision balancing to eliminate vibration and uneven tyre wear.", icon: "⚖️", iconType: "emoji", price: "From $15/wheel", imageUrl: "https://images.unsplash.com/photo-1518987048-93e29699e79a?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Tyre Rotation", description: "Regular rotation to ensure even tread wear and extend tyre lifespan.", icon: "🔄", iconType: "emoji", price: "From $35", imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Puncture Repair", description: "Fast, safe puncture repair for tyres that meet legal repair standards.", icon: "🔧", iconType: "emoji", price: "From $25", imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Wheel & Tyre Packages", description: "Complete new wheel and tyre packages for a fresh look and improved performance.", icon: "💫", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1600661653561-629509216228?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "50,000+", label: "Tyres Fitted" },
    { id: uid("st"), value: "12 yr", label: "In Business" },
    { id: uid("st"), value: "4.7★", label: "Customer Rating" },
    { id: uid("st"), value: "Same-Day", label: "Fitting Available" },
  ],

  testimonials: [
    { id: uid("t"), name: "Jake Sullivan", role: "Customer", content: "In and out in 30 minutes with 4 new tyres fitted and balanced. Best price I found locally too.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Rachel Kim", role: "Customer", content: "Alignment fixed a pulling issue my car had for months. Should have come here first.", rating: 5 },
    { id: uid("t"), name: "Big Rig Logistics", role: "Fleet Customer", content: "They handle tyres for our entire delivery fleet. Fast turnaround keeps our trucks on the road.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Single Tyre", price: "$25", period: "/tyre", description: "Fitting only", features: ["Professional fitting", "Old tyre disposal", "Pressure check"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Set of 4 + Alignment", price: "From $180", description: "Most popular package", features: ["4 tyres fitted & balanced", "Full wheel alignment", "Old tyre disposal"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Fleet Account", price: "Custom", description: "Business & fleet pricing", features: ["Volume discount pricing", "Priority scheduling", "Monthly invoicing"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How long does tyre fitting take?", answer: "Most standard tyre fittings take 30-45 minutes for a full set of 4, including balancing." },
    { id: uid("f"), question: "Do you price match?", answer: "Yes, we offer a price match guarantee against any local competitor's advertised price on the same tyre brand and model." },
    { id: uid("f"), question: "How often should I get a wheel alignment?", answer: "We recommend an alignment check every 10,000 miles or whenever you notice uneven tyre wear or pulling." },
  ],
};

// ─── TEMPLATE 61: PanelCraft (Auto Body & Panel Beating) ─────────────────────

const PANELCRAFT: TemplateIdentity = {
  slug: "panelcraft",
  name: "PanelCraft",
  description: "Sleek auto body and panel beating template with a premium feel. Showcases repair quality through service listings and insurance approval badges.",
  category: "Automotive",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7c93?w=1200&q=85&fit=crop",
  tags: ["panel beating", "smash repairs", "auto body", "car paint"],

  palette: {
    primary: "#0ea5e9",
    primaryFg: "#ffffff",
    secondary: "#475569",
    accent: "#38bdf8",
    background: "#111827",
    foreground: "#f9fafb",
    muted: "#1f2937",
    mutedFg: "#9ca3af",
    card: "#1f2937",
    border: "#374151",
    ring: "#0ea5e9",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-panelcraft .hero-badge { background: #0ea5e9; color: white; border-radius: 9999px; }
    .template-panelcraft .service-card { border-top: 3px solid #0ea5e9; background: #1f2937; }
    .template-panelcraft .stat-value { color: #38bdf8; font-weight: 700; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7c93?w=1600&q=90&fit=crop", alt: "Auto body repair shop" },
    about: { url: "https://images.unsplash.com/photo-1632823471565-1ecdf7c8b1d3?w=800&q=80&fit=crop", alt: "Car paint spray booth" },
    services: [
      { url: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7c93?w=600&q=80&fit=crop", alt: "Panel beating" },
      { url: "https://images.unsplash.com/photo-1632823471565-1ecdf7c8b1d3?w=600&q=80&fit=crop", alt: "Car paint spraying" },
      { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80&fit=crop", alt: "Dent repair" },
      { url: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600&q=80&fit=crop", alt: "Insurance claim repair" },
      { url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&q=80&fit=crop", alt: "Bumper repair" },
      { url: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7c93?w=600&q=80&fit=crop", alt: "Full body restoration" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7c93?w=800&q=80&fit=crop", alt: "Before and after repair" },
      { url: "https://images.unsplash.com/photo-1632823471565-1ecdf7c8b1d3?w=800&q=80&fit=crop", alt: "Paint booth work" },
      { url: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80&fit=crop", alt: "Completed restoration" },
      { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80&fit=crop", alt: "Bodywork detail" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Master Panel Beater" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7c93?w=1200&q=80&fit=crop", alt: "Get a repair quote" },
  },

  heroHeadline: "Restore Your Vehicle to Showroom Condition",
  heroSubline: "Expert panel beating and auto body repairs — insurance approved and quality guaranteed.",
  heroBadge: "🏆 Insurance Approved Repairer",
  heroCTA: "Get a Free Quote",
  heroSecondaryCTA: "View Our Work",
  siteName: "PanelCraft Auto Body",
  tagline: "Restore your vehicle to showroom condition",
  phone: "+1 (555) 660-9021",
  email: "quotes@panelcraft.com",
  address: "120 Bodyshop Ave, Metro City",
  aboutHeading: "Insurance-Approved Repairs, Showroom Quality",
  aboutBody: "PanelCraft specialises in panel beating, smash repairs and paint matching to factory standard. As an approved repairer for major insurance companies, we handle the entire claims process on your behalf, so all you need to do is drop off your car.",
  aboutHighlights: ["Approved repairer for major insurers", "Factory-standard paint matching", "Lifetime warranty on workmanship", "We handle your insurance claim"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Get Quote", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Panel Beating", description: "Structural and cosmetic panel repair returning your vehicle to factory shape.", icon: "🔨", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7c93?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Paint Matching & Spraying", description: "Computer-matched paint spraying for a seamless, invisible repair finish.", icon: "🎨", iconType: "emoji", price: "From $450", imageUrl: "https://images.unsplash.com/photo-1632823471565-1ecdf7c8b1d3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Dent Repair", description: "Paintless dent removal for minor dings, and traditional repair for major damage.", icon: "🔵", iconType: "emoji", price: "From $150", imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Insurance Claim Repairs", description: "Full-service repairs with direct insurance billing — we manage the whole claim.", icon: "📋", iconType: "emoji", price: "Insurance covered", imageUrl: "https://images.unsplash.com/photo-1493238792000-8113da705763?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bumper Repair", description: "Bumper repair and replacement for scrapes, cracks and major damage.", icon: "🚗", iconType: "emoji", price: "From $250", imageUrl: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Full Restoration", description: "Complete body restoration for classic cars and major collision damage.", icon: "🏆", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1632823469850-2f77dd9c7c93?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "5,000+", label: "Vehicles Repaired" },
    { id: uid("st"), value: "18 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "Customer Rating" },
    { id: uid("st"), value: "Lifetime", label: "Workmanship Warranty" },
  ],

  testimonials: [
    { id: uid("t"), name: "Amanda Rivers", role: "Insurance Claim Customer", content: "Handled my entire insurance claim, and the paint match is completely invisible. You'd never know there was damage.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Robert Chen", role: "Customer", content: "Restored my classic car's body to better than original condition. True craftsmen.", rating: 5 },
    { id: uid("t"), name: "Denise Foster", role: "Customer", content: "Fast turnaround on my bumper repair and the price matched their initial quote exactly.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Minor Repair", price: "From $150", description: "Dent or scratch repair", features: ["Free assessment", "Paintless repair when possible", "Same-week turnaround"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Insurance Claim", price: "Insurance Covered", description: "Most popular, full claim handled", features: ["We manage your claim", "Factory-matched paint", "Lifetime workmanship warranty"], highlighted: true, badge: "Most Popular", ctaLabel: "Start Claim", ctaUrl: "#contact" },
    { id: uid("p"), name: "Full Restoration", price: "Custom Quote", description: "Classic car or major damage", features: ["Complete body restoration", "Show-quality finish available", "Detailed project timeline"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you work directly with my insurance company?", answer: "Yes, as an approved repairer for major insurers, we handle the entire claims process directly, so you don't have to deal with the paperwork." },
    { id: uid("f"), question: "Can you match my car's exact paint color?", answer: "Yes, we use computer color-matching technology to achieve an exact, invisible match to your vehicle's original paint." },
    { id: uid("f"), question: "How long do repairs typically take?", answer: "Minor repairs are usually completed within a few days, while insurance claims and major restorations can take 1-3 weeks depending on parts availability." },
  ],

  team: [
    { id: uid("tm"), name: "Frank Costa", role: "Master Panel Beater & Owner", bio: "18 years in auto body repair, certified in factory-standard structural repair techniques.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 62: WanderWay (Travel Agency) ──────────────────────────────────

const WANDERWAY: TemplateIdentity = {
  slug: "wanderway",
  name: "WanderWay",
  description: "Vibrant travel agency template with a destination-forward hero and inspiring visual design. Perfect for full-service travel agencies and holiday planners.",
  category: "General Business",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=85&fit=crop",
  tags: ["travel agency", "holidays", "tours", "flights", "accommodation"],

  palette: {
    primary: "#0ea5e9",
    primaryFg: "#ffffff",
    secondary: "#1e1b4b",
    accent: "#38bdf8",
    background: "#f0f9ff",
    foreground: "#1e1b4b",
    muted: "#e0f2fe",
    mutedFg: "#0369a1",
    card: "#ffffff",
    border: "#bae6fd",
    ring: "#0ea5e9",
    borderRadius: "1rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-wanderway .hero-badge { background: #0ea5e9; color: white; border-radius: 9999px; }
    .template-wanderway .service-card { border-radius: 1rem; }
    .template-wanderway .stat-value { color: #0ea5e9; }
  `,

  variants: {
    hero: "split-image-right",
    services: "icon-cards-grid",
    testimonials: "quote-cards",
    features: "alternating-images",
    stats: "colored-row",
    cta: "gradient-banner",
    pricing: "highlighted-cards",
    faq: "accordion-bordered",
    navigation: "solid-with-cta",
    team: "avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=900&q=85&fit=crop", alt: "Tropical travel destination" },
    about: { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&fit=crop", alt: "Travel planning consultation" },
    services: [
      { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80&fit=crop", alt: "Beach holiday" },
      { url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80&fit=crop", alt: "Flight booking" },
      { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&fit=crop", alt: "Hotel accommodation" },
      { url: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=600&q=80&fit=crop", alt: "Group tour" },
      { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80&fit=crop", alt: "Honeymoon package" },
      { url: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80&fit=crop", alt: "Adventure travel" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80&fit=crop", alt: "Dream beach destination" },
      { url: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=800&q=80&fit=crop", alt: "Group travel experience" },
      { url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80&fit=crop", alt: "Romantic getaway" },
      { url: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80&fit=crop", alt: "Adventure destination" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Senior Travel Consultant" },
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Group Tour Specialist" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80&fit=crop", alt: "Plan your trip" },
  },

  heroHeadline: "Your Journey Starts Here",
  heroSubline: "Tailored travel experiences to destinations worldwide — let us handle every detail.",
  heroBadge: "✈️ 5,000+ Trips Planned",
  heroCTA: "Plan My Trip",
  heroSecondaryCTA: "Browse Destinations",
  siteName: "WanderWay Travel",
  tagline: "Your journey starts here",
  phone: "+1 (555) 774-8821",
  email: "hello@wanderwaytravel.com",
  address: "50 Voyager Blvd, Metro City",
  aboutHeading: "5,000+ Trips Planned, Every Detail Handled",
  aboutBody: "WanderWay takes the stress out of travel planning — flights, hotels, tours and everything in between, tailored to your budget and style. Our experienced consultants have personally visited the destinations they recommend, so you get honest advice, not just a booking engine.",
  aboutHighlights: ["5,000+ trips successfully planned", "Consultants who've visited the destinations", "24/7 support while you travel", "Best price guarantee"],

  navItems: [
    { id: "n1", label: "Destinations", url: "#services" },
    { id: "n2", label: "Packages", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Plan a Trip", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Beach Holidays", description: "Curated beach getaways to the world's best tropical destinations.", icon: "🏖️", iconType: "emoji", price: "From $1,200", imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Flight Booking", description: "Best-fare flight search and booking with flexible date options.", icon: "✈️", iconType: "emoji", price: "No booking fee", imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Hotel & Accommodation", description: "Hand-picked hotels and resorts matched to your travel style and budget.", icon: "🏨", iconType: "emoji", price: "Included in packages", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Group Tours", description: "Small-group guided tours to destinations across every continent.", icon: "🚌", iconType: "emoji", price: "From $2,500", imageUrl: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Honeymoon Packages", description: "Romantic, all-inclusive honeymoon experiences designed for two.", icon: "💕", iconType: "emoji", price: "From $2,800", imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Adventure Travel", description: "Off-the-beaten-path adventure trips for thrill-seekers and explorers.", icon: "🏔️", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "5,000+", label: "Trips Planned" },
    { id: uid("st"), value: "80+", label: "Countries Covered" },
    { id: uid("st"), value: "15 yr", label: "In Business" },
    { id: uid("st"), value: "4.8★", label: "Traveler Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Emma & David", role: "Honeymoon Clients", content: "Every detail of our honeymoon was perfect. Our consultant clearly knew the destination personally, not just from a brochure.", rating: 5, avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "The Patel Family", role: "Group Tour Clients", content: "Our multi-generational family trip was flawlessly organized. Everyone from grandparents to kids had an amazing time.", rating: 5 },
    { id: uid("t"), name: "Marcus Webb", role: "Solo Traveler", content: "Booked an adventure trip I never would have found on my own. WanderWay's recommendations were spot-on.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Flight Only", price: "No Fee", description: "Best-fare flight booking", features: ["Best fare search", "Flexible date options", "No booking fees"], ctaLabel: "Search Flights", ctaUrl: "#contact" },
    { id: uid("p"), name: "Complete Package", price: "From $1,200", description: "Most popular, flights + hotel + extras", features: ["Flights & accommodation", "Airport transfers included", "24/7 travel support", "Best price guarantee"], highlighted: true, badge: "Most Popular", ctaLabel: "Plan My Trip", ctaUrl: "#contact" },
    { id: uid("p"), name: "Custom Itinerary", price: "Consultation-based", description: "Fully bespoke travel planning", features: ["Personal travel consultant", "Fully customized itinerary", "VIP experiences available"], ctaLabel: "Book Consultation", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you offer 24/7 support while traveling?", answer: "Yes, all package clients get access to our 24/7 emergency support line for any issues that arise during your trip." },
    { id: uid("f"), question: "Can you plan a custom itinerary for us?", answer: "Absolutely, our custom itinerary service builds a fully bespoke trip around your interests, budget and timeline." },
    { id: uid("f"), question: "Do you price match other travel agencies?", answer: "Yes, we offer a best price guarantee — if you find a better price on an identical package, we'll match it." },
  ],

  team: [
    { id: uid("tm"), name: "Sophie Marchand", role: "Senior Travel Consultant", bio: "15 years in travel planning, has personally visited over 50 countries she recommends to clients.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
    { id: uid("tm"), name: "Carlos Mendez", role: "Group Tour Specialist", bio: "Specialises in multi-generational and large group travel logistics.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 63: TrailBlaze (Adventure Tour Operator) ───────────────────────

const TRAILBLAZE_TOURS: TemplateIdentity = {
  slug: "trailblaze-tours",
  name: "TrailBlaze",
  description: "Adventure-focused tour operator template with dramatic imagery and itinerary showcases. Designed for guided tours, eco-tourism, and experience travel brands.",
  category: "General Business",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=85&fit=crop",
  tags: ["tour operator", "guided tours", "adventure", "eco-tourism", "experiences"],

  palette: {
    primary: "#22c55e",
    primaryFg: "#ffffff",
    secondary: "#16a34a",
    accent: "#4ade80",
    background: "#042f2e",
    foreground: "#f0fdf4",
    muted: "#134e4a",
    mutedFg: "#86efac",
    card: "#134e4a",
    border: "#166534",
    ring: "#22c55e",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-trailblaze-tours .hero-badge { background: #22c55e; color: white; border-radius: 9999px; }
    .template-trailblaze-tours .service-card { border-top: 3px solid #22c55e; background: #134e4a; }
    .template-trailblaze-tours .stat-value { color: #4ade80; font-weight: 700; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=90&fit=crop", alt: "Mountain trail adventure" },
    about: { url: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=800&q=80&fit=crop", alt: "Tour guide with group" },
    services: [
      { url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80&fit=crop", alt: "Mountain hiking tour" },
      { url: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&q=80&fit=crop", alt: "Guided nature tour" },
      { url: "https://images.unsplash.com/photo-1516939884455-1445c8652f83?w=600&q=80&fit=crop", alt: "Wildlife safari" },
      { url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=600&q=80&fit=crop", alt: "Camping expedition" },
      { url: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=80&fit=crop", alt: "River rafting" },
      { url: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=600&q=80&fit=crop", alt: "Eco-tourism excursion" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80&fit=crop", alt: "Breathtaking trail view" },
      { url: "https://images.unsplash.com/photo-1516939884455-1445c8652f83?w=800&q=80&fit=crop", alt: "Wildlife encounter" },
      { url: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=80&fit=crop", alt: "Group camping" },
      { url: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80&fit=crop", alt: "Adventure activity" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Head Guide" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80&fit=crop", alt: "Book an adventure" },
  },

  heroHeadline: "Explore the World Your Way",
  heroSubline: "Expert-guided tours to breathtaking destinations — small groups, big adventures.",
  heroBadge: "🏔️ Small Group Adventures",
  heroCTA: "Book an Adventure",
  heroSecondaryCTA: "View Itineraries",
  siteName: "TrailBlaze Tours",
  tagline: "Explore the world your way",
  phone: "+1 (555) 448-2299",
  email: "adventures@trailblazetours.com",
  address: "10 Basecamp Road, Metro City",
  aboutHeading: "Small-Group Adventures, Expertly Guided",
  aboutBody: "TrailBlaze runs small-group guided tours to some of the world's most breathtaking destinations, with a genuine commitment to responsible, eco-conscious tourism. Our guides are local experts who share deep knowledge of the terrain, culture and wildlife along every route.",
  aboutHighlights: ["Small groups, max 12 travelers", "Local expert guides", "Eco-conscious tour practices", "All skill levels welcomed"],

  navItems: [
    { id: "n1", label: "Tours", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Mountain Hiking Tours", description: "Multi-day guided hiking expeditions through breathtaking mountain terrain.", icon: "🏔️", iconType: "emoji", price: "From $850", imageUrl: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Wildlife Safaris", description: "Small-group wildlife tracking and viewing with expert naturalist guides.", icon: "🦁", iconType: "emoji", price: "From $1,400", imageUrl: "https://images.unsplash.com/photo-1516939884455-1445c8652f83?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Camping Expeditions", description: "Guided wilderness camping trips with all equipment and meals included.", icon: "⛺", iconType: "emoji", price: "From $650", imageUrl: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "River Rafting", description: "Guided white-water rafting adventures for beginners through experienced paddlers.", icon: "🚣", iconType: "emoji", price: "From $180", imageUrl: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Eco-Tours", description: "Sustainable nature tours focused on conservation and environmental education.", icon: "🌿", iconType: "emoji", price: "From $450", imageUrl: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Custom Group Tours", description: "Bespoke tour itineraries designed for private groups and special occasions.", icon: "🎯", iconType: "emoji", price: "Request Quote", imageUrl: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "3,000+", label: "Adventurers Guided" },
    { id: uid("st"), value: "12", label: "Max Group Size" },
    { id: uid("st"), value: "14 yr", label: "In Business" },
    { id: uid("st"), value: "4.9★", label: "Traveler Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Jake Morrison", role: "Hiking Tour Client", content: "The guides' knowledge of the terrain and local ecology made this trip unforgettable. Small group size meant real personal attention.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Sarah & Tom", role: "Safari Clients", content: "Best wildlife experience of our lives. Our guide spotted animals we never would have seen on our own.", rating: 5 },
    { id: uid("t"), name: "Group of 8 Friends", role: "Custom Tour Clients", content: "They built a completely custom itinerary for our friend group. Every detail was handled perfectly.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Day Adventure", price: "From $180", description: "Single-day guided tour", features: ["Expert local guide", "Equipment included", "Small group, max 12"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Multi-Day Expedition", price: "From $850", description: "Most popular, 3-7 day tours", features: ["All meals & equipment", "Expert guide throughout", "Small group experience", "Accommodation included"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Custom Group Tour", price: "Request Quote", description: "Private, fully bespoke itinerary", features: ["Fully customized route", "Private group only", "Flexible dates & duration"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "What fitness level do I need for your tours?", answer: "We offer tours for all fitness levels, from easy nature walks to challenging multi-day treks — check each tour's difficulty rating before booking." },
    { id: uid("f"), question: "What's included in the tour price?", answer: "Most multi-day tours include expert guiding, equipment, meals and accommodation — check each specific tour listing for exact inclusions." },
    { id: uid("f"), question: "Can you organize a private tour for our group?", answer: "Yes, our custom group tour service builds a fully bespoke itinerary around your group's interests, fitness level and schedule." },
  ],

  team: [
    { id: uid("tm"), name: "Ben Carter", role: "Head Guide & Founder", bio: "14 years leading wilderness expeditions, certified in wilderness first aid and eco-tourism practices.", avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 64: VisaBridge (Immigration Consultancy) ───────────────────────

const VISABRIDGE: TemplateIdentity = {
  slug: "visabridge",
  name: "VisaBridge",
  description: "Professional visa and immigration consultancy template with a clean, authoritative look. Builds trust through credentials, process timelines, and client success stories.",
  category: "General Business",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=85&fit=crop",
  tags: ["visa", "immigration", "consultancy", "migration", "work permit"],

  palette: {
    primary: "#4f46e5",
    primaryFg: "#ffffff",
    secondary: "#0f172a",
    accent: "#818cf8",
    background: "#0f172a",
    foreground: "#f8fafc",
    muted: "#1e293b",
    mutedFg: "#94a3b8",
    card: "#1e293b",
    border: "#334155",
    ring: "#4f46e5",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "700",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-visabridge .hero-badge { background: #4f46e5; color: white; border-radius: 9999px; }
    .template-visabridge .service-card { border-top: 3px solid #4f46e5; background: #1e293b; }
    .template-visabridge .stat-value { color: #818cf8; font-weight: 700; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=90&fit=crop", alt: "Airport travel and passports" },
    about: { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&fit=crop", alt: "Immigration consultation" },
    services: [
      { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", alt: "Work visa consultation" },
      { url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80&fit=crop", alt: "Family visa application" },
      { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80&fit=crop", alt: "Student visa guidance" },
      { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&fit=crop", alt: "Permanent residency application" },
      { url: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&q=80&fit=crop", alt: "Citizenship application" },
      { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", alt: "Document review" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&fit=crop", alt: "Immigration office" },
      { url: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&fit=crop", alt: "Client consultation" },
      { url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80&fit=crop", alt: "Document preparation" },
      { url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80&fit=crop", alt: "Family reunification" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face", alt: "Registered Migration Agent" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&fit=crop", alt: "Start your application" },
  },

  heroHeadline: "Your Path to a New Beginning",
  heroSubline: "Registered migration agents guiding you through every step of your visa application.",
  heroBadge: "🛂 Registered Migration Agents",
  heroCTA: "Book a Consultation",
  heroSecondaryCTA: "Check Eligibility",
  siteName: "VisaBridge Immigration",
  tagline: "Your path to a new beginning",
  phone: "+1 (555) 220-4471",
  email: "info@visabridgeimmigration.com",
  address: "300 Global Gateway, Suite 400, Metro City",
  aboutHeading: "Registered Migration Agents, 2,500+ Cases Handled",
  aboutBody: "VisaBridge provides expert guidance through the visa and immigration process for work, family, study and permanent residency applications. Our registered migration agents stay current on evolving immigration policy so your application has the strongest possible chance of approval.",
  aboutHighlights: ["Registered migration agents", "2,500+ successful cases", "Transparent, upfront fees", "Multilingual consultation available"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Process", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Success Stories", url: "#testimonials" },
    { id: "n5", label: "Get Started", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Work Visa Applications", description: "Skilled worker and employer-sponsored visa applications handled start to finish.", icon: "💼", iconType: "emoji", price: "From $1,800", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Family & Partner Visas", description: "Spouse, partner and family reunification visa applications with compassionate guidance.", icon: "👨‍👩‍👧", iconType: "emoji", price: "From $2,200", imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Student Visas", description: "Study visa applications and guidance for international students at every stage.", icon: "🎓", iconType: "emoji", price: "From $900", imageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Permanent Residency", description: "Full support through the permanent residency application process.", icon: "🏡", iconType: "emoji", price: "From $2,800", imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Citizenship Applications", description: "Guidance through citizenship eligibility assessment and application submission.", icon: "🏛️", iconType: "emoji", price: "From $1,500", imageUrl: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Eligibility Assessment", description: "Free initial assessment to determine your best visa pathway options.", icon: "✅", iconType: "emoji", price: "Free", imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "2,500+", label: "Cases Handled" },
    { id: uid("st"), value: "91%", label: "Approval Rate" },
    { id: uid("st"), value: "17 yr", label: "In Business" },
    { id: uid("st"), value: "5", label: "Languages Spoken" },
  ],

  testimonials: [
    { id: uid("t"), name: "Wei Chen", role: "Work Visa Client", content: "Guided us through a complex employer-sponsored visa process with total clarity at every step. Approved without a single issue.", rating: 5, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Fatima Hassan", role: "Family Visa Client", content: "Finally reunited with my family after two years apart. VisaBridge made a stressful process feel manageable.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&fit=crop&face" },
    { id: uid("t"), name: "Diego Ramirez", role: "PR Applicant", content: "Their attention to detail on our permanent residency application caught issues we would have missed. Highly recommend.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Eligibility Assessment", price: "Free", description: "30-minute initial consultation", features: ["Visa pathway assessment", "Timeline overview", "No obligation"], ctaLabel: "Book Free Assessment", ctaUrl: "#contact" },
    { id: uid("p"), name: "Standard Application", price: "From $1,800", description: "Most popular, full application support", features: ["Full application preparation", "Document review & submission", "Regular status updates"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Started", ctaUrl: "#contact" },
    { id: uid("p"), name: "Complex Case", price: "Custom Quote", description: "PR, citizenship or appeals", features: ["Dedicated senior agent", "Comprehensive case strategy", "Priority processing support"], ctaLabel: "Get a Quote", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Are you a registered migration agent?", answer: "Yes, all VisaBridge consultants are registered migration agents, qualified to provide immigration advice and represent your case." },
    { id: uid("f"), question: "How long does a visa application typically take?", answer: "Processing times vary significantly by visa type and country, ranging from a few weeks to over a year — we provide a realistic timeline during your initial assessment." },
    { id: uid("f"), question: "What happens if my application is refused?", answer: "We offer appeal and review services for refused applications, and will assess your case to determine the best path forward." },
  ],

  team: [
    { id: uid("tm"), name: "Amara Osei", role: "Principal Migration Agent", bio: "17 years in immigration law and migration consulting, has personally handled over 800 successful applications.", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&face" },
  ],
};

// ─── TEMPLATE 65: WorkSafeGear (Workwear & Safety Gear Retail) ───────────────

const WORKSAFE_GEAR: TemplateIdentity = {
  slug: "worksafe-gear",
  name: "WorkSafeGear",
  description: "Practical and authoritative workwear and safety gear retail template. Ideal for PPE suppliers, uniform shops, and industrial workwear retailers.",
  category: "Retail & Shop",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=1200&q=85&fit=crop",
  tags: ["workwear", "safety gear", "PPE", "uniforms", "industrial"],

  palette: {
    primary: "#f97316",
    primaryFg: "#ffffff",
    secondary: "#431407",
    accent: "#fb923c",
    background: "#431407",
    foreground: "#fff7ed",
    muted: "#7c2d12",
    mutedFg: "#fed7aa",
    card: "#7c2d12",
    border: "#9a3412",
    ring: "#f97316",
    borderRadius: "0.25rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.01em",
  },
  customCss: `
    .template-worksafe-gear .hero-badge { background: #f97316; color: white; border-radius: 9999px; }
    .template-worksafe-gear .service-card { border-top: 3px solid #f97316; background: #7c2d12; }
    .template-worksafe-gear .stat-value { color: #fb923c; font-weight: 800; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=1600&q=90&fit=crop", alt: "Industrial safety gear" },
    about: { url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80&fit=crop", alt: "Workwear warehouse" },
    services: [
      { url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&q=80&fit=crop", alt: "Safety helmets and PPE" },
      { url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80&fit=crop", alt: "Work boots and clothing" },
      { url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop", alt: "High-visibility apparel" },
      { url: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=600&q=80&fit=crop", alt: "Uniform embroidery" },
      { url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&q=80&fit=crop", alt: "Fall protection gear" },
      { url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80&fit=crop", alt: "Industrial gloves" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&q=80&fit=crop", alt: "Safety gear display" },
      { url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80&fit=crop", alt: "Workwear warehouse floor" },
      { url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80&fit=crop", alt: "PPE compliance display" },
      { url: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80&fit=crop", alt: "Custom uniform samples" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Sales & Compliance Manager" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=1200&q=80&fit=crop", alt: "Shop safety gear" },
  },

  heroHeadline: "Protect Your Team, Equip Your Workforce",
  heroSubline: "Quality workwear and safety equipment — compliant, durable, and ready when you need it.",
  heroBadge: "🦺 Compliant & Certified PPE",
  heroCTA: "Shop Now",
  heroSecondaryCTA: "Bulk Order Quote",
  siteName: "WorkSafeGear",
  tagline: "Protect your team, equip your workforce",
  phone: "+1 (555) 774-6690",
  email: "sales@worksafegear.com",
  address: "700 Industrial Blvd, Metro City",
  aboutHeading: "Compliant Workwear & Safety Equipment for Every Industry",
  aboutBody: "WorkSafeGear supplies certified PPE, workwear and uniforms to construction, manufacturing, and industrial businesses. Every product meets current safety compliance standards, and we offer bulk ordering with custom branding for teams of any size.",
  aboutHighlights: ["Certified compliant PPE", "Bulk ordering with volume discounts", "Custom uniform branding available", "Same-week dispatch on most items"],

  navItems: [
    { id: "n1", label: "Shop", url: "#services" },
    { id: "n2", label: "Bulk Orders", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Contact", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Safety Helmets & Headgear", description: "Certified hard hats and head protection compliant with current safety standards.", icon: "⛑️", iconType: "emoji", price: "From $25", imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Work Boots & Footwear", description: "Steel-toe and composite safety boots built for durability on the job site.", icon: "🥾", iconType: "emoji", price: "From $89", imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "High-Visibility Apparel", description: "Hi-vis vests, jackets and workwear compliant with visibility safety standards.", icon: "🦺", iconType: "emoji", price: "From $35", imageUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Custom Uniforms", description: "Branded uniforms with embroidery and printing for teams of any size.", icon: "👕", iconType: "emoji", price: "From $28/unit", imageUrl: "https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Fall Protection Gear", description: "Harnesses, lanyards and fall arrest systems for working at height.", icon: "🪢", iconType: "emoji", price: "From $150", imageUrl: "https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Gloves & Hand Protection", description: "Cut-resistant, chemical-resistant and general purpose work gloves.", icon: "🧤", iconType: "emoji", price: "From $8/pair", imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "500+", label: "Businesses Supplied" },
    { id: uid("st"), value: "100%", label: "Compliance Certified" },
    { id: uid("st"), value: "14 yr", label: "In Business" },
    { id: uid("st"), value: "Same-Week", label: "Dispatch on Most Items" },
  ],

  testimonials: [
    { id: uid("t"), name: "Construction Solutions Inc.", role: "Bulk Order Client", content: "Fitted out our entire 80-person crew with custom-branded uniforms and PPE. Great pricing and fast turnaround.", rating: 5 },
    { id: uid("t"), name: "Mike Fielding", role: "Site Supervisor", content: "Boots and gloves have held up through months of daily heavy use. Quality is genuinely better than what we used before.", rating: 5 },
    { id: uid("t"), name: "Metro Manufacturing", role: "Bulk Order Client", content: "Their compliance knowledge saved us from an audit issue. They know PPE regulations inside and out.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Individual Order", price: "Retail Pricing", description: "Single-item purchases", features: ["Standard shipping", "Full product range", "30-day returns"], ctaLabel: "Shop Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Team Bundle", price: "10-20% Off", description: "Most popular, 10+ units", features: ["Volume discount pricing", "Custom branding available", "Dedicated account rep"], highlighted: true, badge: "Most Popular", ctaLabel: "Get Bulk Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Enterprise Supply", price: "Custom Quote", description: "Ongoing supply contract", features: ["Negotiated contract pricing", "Scheduled reordering", "Dedicated account manager"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Is your PPE compliant with safety regulations?", answer: "Yes, all our safety equipment meets current industry compliance standards, and we can provide certification documentation on request." },
    { id: uid("f"), question: "Do you offer bulk pricing for teams?", answer: "Yes, we offer volume discounts starting at 10 units, with custom branding options available for larger orders." },
    { id: uid("f"), question: "How fast is delivery on custom uniforms?", answer: "Custom branded uniforms typically ship within 1-2 weeks depending on order size, while stock items ship the same week." },
  ],
};

// ─── TEMPLATE 66: PressMark (Printing & Signage) ─────────────────────────────

const PRESSMARK_PRINT: TemplateIdentity = {
  slug: "pressmark-print",
  name: "PressMark",
  description: "Creative printing and signage template with a bold, design-conscious identity. Showcases product categories, turnaround times, and custom quote requests.",
  category: "General Business",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=85&fit=crop",
  tags: ["printing", "signage", "branding", "banners", "custom print"],

  palette: {
    primary: "#d946ef",
    primaryFg: "#ffffff",
    secondary: "#2e1065",
    accent: "#e879f9",
    background: "#2e1065",
    foreground: "#faf5ff",
    muted: "#4c1d95",
    mutedFg: "#e9d5ff",
    card: "#4c1d95",
    border: "#6d28d9",
    ring: "#d946ef",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-pressmark-print .hero-badge { background: #d946ef; color: white; border-radius: 9999px; }
    .template-pressmark-print .service-card { border-top: 3px solid #d946ef; background: #4c1d95; }
    .template-pressmark-print .stat-value { color: #e879f9; font-weight: 800; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1600&q=90&fit=crop", alt: "Printing press in action" },
    about: { url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&q=80&fit=crop", alt: "Print shop workspace" },
    services: [
      { url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80&fit=crop", alt: "Business card printing" },
      { url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80&fit=crop", alt: "Banner printing" },
      { url: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=600&q=80&fit=crop", alt: "Signage production" },
      { url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80&fit=crop", alt: "Marketing materials" },
      { url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80&fit=crop", alt: "Vehicle wrap printing" },
      { url: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=600&q=80&fit=crop", alt: "Custom apparel printing" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80&fit=crop", alt: "Print production floor" },
      { url: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80&fit=crop", alt: "Large format banner" },
      { url: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800&q=80&fit=crop", alt: "Storefront signage" },
      { url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&q=80&fit=crop", alt: "Finished print materials" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Print Production Manager" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&q=80&fit=crop", alt: "Get a print quote" },
  },

  heroHeadline: "Print That Makes an Impression",
  heroSubline: "Custom printing and signage solutions — from business cards to building-sized banners.",
  heroBadge: "🖨️ 24-Hour Rush Service Available",
  heroCTA: "Get a Quote",
  heroSecondaryCTA: "View Products",
  siteName: "PressMark Printing",
  tagline: "Print that makes an impression",
  phone: "+1 (555) 990-7721",
  email: "orders@pressmarkprint.com",
  address: "200 Presswork Lane, Metro City",
  aboutHeading: "Bold Print & Signage, Delivered Fast",
  aboutBody: "PressMark handles everything from business cards to building-sized banners with in-house design support and fast turnaround. We produce vibrant, durable print work for businesses that want their branding to make a real impression, backed by rush service when deadlines are tight.",
  aboutHighlights: ["In-house design support available", "24-hour rush service option", "Large-format printing up to 10 feet", "Volume discounts for repeat clients"],

  navItems: [
    { id: "n1", label: "Products", url: "#services" },
    { id: "n2", label: "Gallery", url: "#gallery" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Get a Quote", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Business Cards", description: "Premium business card printing with a wide range of finishes and stock options.", icon: "💳", iconType: "emoji", price: "From $45/500", imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Banners & Signage", description: "Large-format banners and outdoor signage built to withstand the elements.", icon: "🪧", iconType: "emoji", price: "From $65", imageUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Storefront Signage", description: "Custom shop signage and window graphics that make your storefront stand out.", icon: "🏪", iconType: "emoji", price: "From $250", imageUrl: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Marketing Materials", description: "Flyers, brochures and marketing collateral designed and printed in-house.", icon: "📄", iconType: "emoji", price: "From $89/250", imageUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Vehicle Wraps & Decals", description: "Full and partial vehicle branding wraps for maximum street visibility.", icon: "🚗", iconType: "emoji", price: "From $800", imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Custom Apparel Printing", description: "Screen printing and embroidery for branded team apparel and merchandise.", icon: "👕", iconType: "emoji", price: "From $12/item", imageUrl: "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "10,000+", label: "Print Jobs Completed" },
    { id: uid("st"), value: "24 hr", label: "Rush Service Available" },
    { id: uid("st"), value: "13 yr", label: "In Business" },
    { id: uid("st"), value: "4.7★", label: "Customer Rating" },
  ],

  testimonials: [
    { id: uid("t"), name: "Bright Bloom Florist", role: "Repeat Client", content: "Our storefront signage brought in noticeably more walk-in traffic. Design team nailed our brand look perfectly.", rating: 5 },
    { id: uid("t"), name: "Metro Fitness Studio", role: "Bulk Order Client", content: "Rush ordered 200 branded shirts for an event with 48 hours notice and they delivered on time, quality intact.", rating: 5 },
    { id: uid("t"), name: "Sunrise Real Estate", role: "Marketing Client", content: "Consistent quality on every print order over 3 years. Their team is genuinely creative, not just an order-taker.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Standard Order", price: "Product Pricing", description: "Standard turnaround", features: ["3-5 business day turnaround", "Free proof review", "Standard shipping"], ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Rush Service", price: "+50% Fee", description: "Most requested, 24-hour turnaround", features: ["24-hour production", "Priority queue", "Free local pickup available"], highlighted: true, badge: "Most Requested", ctaLabel: "Get Quote", ctaUrl: "#contact" },
    { id: uid("p"), name: "Volume Contract", price: "Custom Quote", description: "Ongoing bulk printing needs", features: ["Negotiated volume pricing", "Dedicated account rep", "Scheduled recurring orders"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "Do you offer design services?", answer: "Yes, our in-house design team can create artwork from scratch or work with your existing brand materials at an additional design fee." },
    { id: uid("f"), question: "How fast is rush service?", answer: "Our 24-hour rush service covers most standard products, with a 50% rush fee on top of standard pricing." },
    { id: uid("f"), question: "What file formats do you accept?", answer: "We accept print-ready PDF, AI and EPS files, and can also work from your design brief if you don't have print-ready artwork." },
  ],
};

// ─── TEMPLATE 67: SwiftDrop (Courier & Delivery) ─────────────────────────────

const SWIFTDROP_COURIER: TemplateIdentity = {
  slug: "swiftdrop-courier",
  name: "SwiftDrop",
  description: "Efficient courier and delivery services template with a clean, logistics-focused design. Highlights same-day delivery, live tracking, and business accounts.",
  category: "General Business",
  author: "Passive Coder",
  version: "1.0.0",
  previewImage: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200&q=85&fit=crop",
  tags: ["courier", "delivery", "logistics", "same-day", "parcels"],

  palette: {
    primary: "#f97316",
    primaryFg: "#ffffff",
    secondary: "#7f1d1d",
    accent: "#fb923c",
    background: "#7f1d1d",
    foreground: "#fef2f2",
    muted: "#991b1b",
    mutedFg: "#fecaca",
    card: "#991b1b",
    border: "#b91c1c",
    ring: "#f97316",
    borderRadius: "0.5rem",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    headingWeight: "800",
    letterSpacing: "-0.02em",
  },
  customCss: `
    .template-swiftdrop-courier .hero-badge { background: #f97316; color: white; border-radius: 9999px; }
    .template-swiftdrop-courier .service-card { border-top: 3px solid #f97316; background: #991b1b; }
    .template-swiftdrop-courier .stat-value { color: #fb923c; font-weight: 800; }
  `,

  variants: {
    hero: "dark-gradient-left",
    services: "dark-grid-cards",
    testimonials: "dark-quote-cards",
    features: "dark-alternating",
    stats: "gradient-numbers",
    cta: "dark-split",
    pricing: "dark-cards",
    faq: "accordion-dark",
    navigation: "dark-minimal",
    team: "dark-avatar-cards",
  },

  images: {
    hero: { url: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1600&q=90&fit=crop", alt: "Delivery driver with parcels" },
    about: { url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80&fit=crop", alt: "Courier dispatch center" },
    services: [
      { url: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80&fit=crop", alt: "Same-day delivery" },
      { url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80&fit=crop", alt: "Parcel dispatch" },
      { url: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&q=80&fit=crop", alt: "Business courier account" },
      { url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80&fit=crop", alt: "Express delivery" },
      { url: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80&fit=crop", alt: "Document courier" },
      { url: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&q=80&fit=crop", alt: "Bulk parcel delivery" },
    ],
    gallery: [
      { url: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80&fit=crop", alt: "Delivery fleet" },
      { url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&q=80&fit=crop", alt: "Dispatch operations" },
      { url: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=80&fit=crop", alt: "Parcel handling" },
      { url: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=800&q=80&fit=crop", alt: "Delivery on route" },
    ],
    team: [
      { url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80&fit=crop&face", alt: "Dispatch Manager" },
    ],
    cta: { url: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1200&q=80&fit=crop", alt: "Book a delivery" },
  },

  heroHeadline: "Delivered on Time, Every Time",
  heroSubline: "Same-day and express courier services for businesses and individuals — reliable, fast, tracked.",
  heroBadge: "📦 Live GPS Tracking",
  heroCTA: "Book a Delivery",
  heroSecondaryCTA: "Get Business Rates",
  siteName: "SwiftDrop Courier",
  tagline: "Delivered on time, every time",
  phone: "+1 (555) 660-8821",
  email: "dispatch@swiftdropcourier.com",
  address: "400 Logistics Way, Metro City",
  aboutHeading: "Same-Day Delivery You Can Actually Track",
  aboutBody: "SwiftDrop provides reliable same-day and express courier services with live GPS tracking on every delivery. We serve individuals needing a one-off pickup and businesses needing a dedicated courier account with priority scheduling and volume pricing.",
  aboutHighlights: ["Live GPS tracking on every delivery", "Same-day service across the metro area", "Business accounts with volume pricing", "98% on-time delivery rate"],

  navItems: [
    { id: "n1", label: "Services", url: "#services" },
    { id: "n2", label: "Business Accounts", url: "#pricing" },
    { id: "n3", label: "About", url: "#about" },
    { id: "n4", label: "Reviews", url: "#testimonials" },
    { id: "n5", label: "Book Now", url: "#contact" },
  ],

  services: [
    { id: uid("svc"), title: "Same-Day Delivery", description: "Fast local delivery within the metro area, most parcels delivered within 3 hours.", icon: "⚡", iconType: "emoji", price: "From $15", imageUrl: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Express Delivery", description: "Priority rush delivery for time-sensitive parcels, typically within 90 minutes.", icon: "🚀", iconType: "emoji", price: "From $28", imageUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Document Courier", description: "Secure, tracked delivery for time-sensitive legal and business documents.", icon: "📄", iconType: "emoji", price: "From $12", imageUrl: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Business Courier Accounts", description: "Dedicated business accounts with monthly invoicing and volume discount pricing.", icon: "💼", iconType: "emoji", price: "Custom pricing", imageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Bulk Parcel Delivery", description: "Multi-parcel delivery runs for e-commerce businesses and mail-order operations.", icon: "📦", iconType: "emoji", price: "From $8/parcel", imageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&q=80&fit=crop", link: "#contact" },
    { id: uid("svc"), title: "Scheduled Recurring Delivery", description: "Set up regular scheduled deliveries for ongoing business shipping needs.", icon: "🔄", iconType: "emoji", price: "Custom pricing", imageUrl: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80&fit=crop", link: "#contact" },
  ],

  stats: [
    { id: uid("st"), value: "98%", label: "On-Time Delivery Rate" },
    { id: uid("st"), value: "50,000+", label: "Deliveries Completed" },
    { id: uid("st"), value: "10 yr", label: "In Business" },
    { id: uid("st"), value: "Live", label: "GPS Tracking" },
  ],

  testimonials: [
    { id: uid("t"), name: "Legal Docs Express", role: "Business Account Client", content: "We ship time-sensitive legal documents daily and SwiftDrop has never missed a deadline. Tracking gives our clients peace of mind too.", rating: 5 },
    { id: uid("t"), name: "Boutique Craft Co.", role: "E-commerce Client", content: "Their bulk delivery service handles all our local order fulfillment. Reliable and much cheaper than the big carriers.", rating: 5 },
    { id: uid("t"), name: "Rachel Kim", role: "Individual Customer", content: "Needed an urgent same-day delivery across town and they had it there in under an hour. Great tracking app too.", rating: 5 },
  ],

  pricing: [
    { id: uid("p"), name: "Single Delivery", price: "From $15", description: "One-off same-day delivery", features: ["Live GPS tracking", "SMS delivery updates", "Signature confirmation"], ctaLabel: "Book Now", ctaUrl: "#contact" },
    { id: uid("p"), name: "Business Account", price: "Custom Pricing", description: "Most popular, volume rates", features: ["Monthly invoicing", "Volume discount pricing", "Dedicated dispatch line", "Priority scheduling"], highlighted: true, badge: "Most Popular", ctaLabel: "Set Up Account", ctaUrl: "#contact" },
    { id: uid("p"), name: "Enterprise Logistics", price: "Custom Quote", description: "High-volume recurring delivery", features: ["Scheduled recurring routes", "Dedicated fleet allocation", "API integration available"], ctaLabel: "Talk to Sales", ctaUrl: "#contact" },
  ],

  faq: [
    { id: uid("f"), question: "How fast is same-day delivery?", answer: "Most same-day deliveries within our metro service area are completed within 3 hours of booking, often faster." },
    { id: uid("f"), question: "Can I track my delivery in real time?", answer: "Yes, every delivery includes live GPS tracking accessible via a link sent to you and the recipient." },
    { id: uid("f"), question: "Do you offer business accounts?", answer: "Yes, business accounts get monthly invoicing, volume discount pricing and a dedicated dispatch line for priority booking." },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const TEMPLATE_REGISTRY: TemplateIdentity[] = [
  TORQUE_AUTO,
  GRIPZONE_TYRES,
  PANELCRAFT,
  WANDERWAY,
  TRAILBLAZE_TOURS,
  VISABRIDGE,
  WORKSAFE_GEAR,
  PRESSMARK_PRINT,
  SWIFTDROP_COURIER,
  CLEAN_PRO,
  LUXE_SPA,
  LEX_CORE,
  NEXA_AGENCY,
  AROMA_TABLE,
  FIT_FORGE,
  ESTATE_EDGE,
  LENS_STUDIO,
  DENTAL_CARE_PRO,
  BREW_HAVEN,
  BLISS_BRIDE,
  MAIZE_FASHION,
  BUILD_RIGHT,
  COLOUR_CRAFT,
  PEST_SHIELD,
  UNIFORM_PRO,
  GLASS_LINE,
  COOL_BREEZE,
  SPARKY_PRO,
  FRESH_WASH,
  CURTAIN_STUDIO,
  TRADE_SUPPLY,
  SHIELD_GUARD,
  SHINE_AUTO,
  FEAST_EVENTS,
  MEDPLUS_CLINIC,
  DRIVE_ACADEMY,
  LIFE_SETTLE,
  APEX_CONSTRUCT,
  BUILD_GUARD,
  HANDYFIX_PRO,
  FLOWMASTER_PLUMBING,
  HEATWAVE_HVAC,
  TOTALBUILDS_SERVICES,
  LUMIERE_SALON,
  FADE_BARBERSHOP,
  SMILESTUDIO_DENTAL,
  IRONFORGE_GYM,
  PEAK_PT,
  STRIDE_ACTIVE,
  SPARKLE_HOME,
  CLEANCORE_COMMERCIAL,
  FIBREFRESH,
  TABLEFARE,
  BEANCRAFT_CAFE,
  STREETBITE,
  LEXBRIDGE_LAW,
  CLEARTAX_ACCOUNTING,
  PRIME_PROPERTY,
  PROPERTYVAULT_MGMT,
  NETSUPPORT_IT,
  GROWTHLAB_AGENCY,
  LENSCROFT_STUDIO,
  FOREVER_EVENTS,
  BRIGHTMINDS_TUTOR,
  SKILLFORGE_TRAINING,
  THREADLINE,
  VAULTSTORE,
];

// Maps every DB template slug → closest registry identity slug.
// Keeps seed-template.ts working for all 55 DB templates.
const SLUG_ALIAS: Record<string, string> = {
  // Cleaning / Laundry
  "sparkle": "clean-pro",
  "deep-clean": "clean-pro",
  // HVAC / AC
  "cool-air": "cool-breeze",
  "flow-right": "cool-breeze",
  "climate-zone": "cool-breeze",
  "ac-service-pro": "cool-breeze",
  // Electrical & Plumbing
  "elec-pro": "sparky-pro",
  "plumb-right": "sparky-pro",
  "wiring-masters": "sparky-pro",
  // Laundry
  "laundry-express": "fresh-wash",
  "dry-clean-pro": "fresh-wash",
  "wash-n-fold": "fresh-wash",
  // Curtains & Furnishings
  "curtain-drape-studio": "curtain-studio",
  "blind-experts": "curtain-studio",
  "drape-masters": "curtain-studio",
  // Trading & Supply
  "trade-link": "trade-supply",
  "supply-chain-co": "trade-supply",
  "global-trade-hub": "trade-supply",
  // Renovation / Construction
  "build-bold": "build-right",
  "renovate-pro": "build-right",
  "fitout-hub": "build-right",
  "hacking-pro": "build-right",
  // Interior Design
  "luxe-interior": "luxe-spa",
  "curtain-drape": "glass-line",
  "floor-craft": "glass-line",
  "shutter-craft": "glass-line",
  "paint-masters": "colour-craft",
  // Glass & Aluminium
  "rhglasssg": "glass-line",
  "sk3shutter": "glass-line",
  "inspireshutter": "glass-line",
  // Pest Control
  "pest-control": "pest-shield",
  "alsarahpestcontrol": "pest-shield",
  "ramzalsafacleaning": "pest-shield",
  // Garments / Uniforms
  "rubelsuniformgarments": "uniform-pro",
  "elegantthreads-bd": "uniform-pro",
  "anikaclassic": "uniform-pro",
  // Restaurant / Cafe
  "savour": "aroma-table",
  "brew-bar": "brew-haven",
  "grill-house": "aroma-table",
  // Health & Beauty
  "glow-salon": "luxe-spa",
  "zen-spa": "luxe-spa",
  "dental-care": "dental-care-pro",
  "nail-studio": "luxe-spa",
  "veterinary-clinic": "medplus-clinic",
  // Fitness
  "iron-gym": "fit-forge",
  "yoga-flow": "fit-forge",
  "sports-coach": "fit-forge",
  // Legal & Finance
  "lexis-law": "lex-core",
  "wealth-advisor": "lex-core",
  "tax-pro": "lex-core",
  // Real Estate
  "prime-property": "estate-edge",
  "rent-ease": "estate-edge",
  // Photography
  "lens-craft": "lens-studio",
  "event-shots": "lens-studio",
  // Education
  "learn-hub": "nexa-agency",
  "code-school": "nexa-agency",
  "language-school": "nexa-agency",
  "childcare-center": "nexa-agency",
  // Retail / Shop
  "shopify-lite": "maize-fashion",
  "gift-box": "maize-fashion",
  "auto-parts": "maize-fashion",
  // Automotive
  "drive-care": "drive-academy",
  "car-wash-pro": "shine-auto",
  // Events / Weddings
  "event-flow": "feast-events",
  "wedding-planner": "feast-events",
  "catering-co": "feast-events",
  // Tech / Agency
  "pixel-agency": "nexa-agency",
  "software-co": "nexa-agency",
  "it-support": "nexa-agency",
  "startup-launch": "nexa-agency",
  // General Business
  "biz-minimal": "clean-pro",
  "corporate-one": "lex-core",
  "consultant-pro": "lex-core",
  "logistics-co": "lex-core",
  "security-guard": "shield-guard",
  // Medical / Healthcare
  "dental-clinic": "medplus-clinic",
  "medical-center": "medplus-clinic",
  // Travel & Tourism
  "lifesettle": "life-settle",
  "life-settle-travel": "life-settle",
  "travel-agency": "life-settle",
  "visa-agency": "life-settle",
  "tour-operator": "life-settle",
  // ── Onboarding picker templates (templates-data.ts) ──────────────────────────
  // Renovation & Construction
  "handyfix-pro": "build-right",
  "buildguard": "build-right",
  "apex-construct": "build-right",
  // Cleaning
  "sparkle-home": "clean-pro",
  "cleancore-commercial": "clean-pro",
  "fibrefresh": "clean-pro",
  // HVAC & Plumbing
  "flowmaster-plumbing": "cool-breeze",
  "heatwave-hvac": "cool-breeze",
  "totalbuilds-services": "cool-breeze",
  // Automotive
  "torque-auto": "shine-auto",
  "gripzone-tyres": "shine-auto",
  "panelcraft": "shine-auto",
  // Retail & Shop
  "threadline": "maize-fashion",
  "stride-active": "maize-fashion",
  "worksafe-gear": "maize-fashion",
  // General Business / Tech & Agency
  "wanderway": "nexa-agency",
  "trailblaze-tours": "nexa-agency",
  "visabridge": "nexa-agency",
  "swiftdrop-courier": "nexa-agency",
  "vaultstore": "nexa-agency",
  "pressmark-print": "nexa-agency",
  "netsupport-it": "nexa-agency",
  "growthlab-agency": "nexa-agency",
  // Restaurant & Cafe
  "tablefare": "aroma-table",
  "streetbite": "aroma-table",
  "beancraft-cafe": "brew-haven",
  // Health & Beauty
  "lumiere-salon": "luxe-spa",
  "fade-barbershop": "luxe-spa",
  "smilestudio-dental": "dental-care-pro",
  // Fitness & Sports
  "ironforge-gym": "fit-forge",
  "peak-pt": "fit-forge",
  // Education
  "brightminds-tutor": "drive-academy",
  "skillforge-training": "drive-academy",
  // Legal & Finance
  "lexbridge-law": "lex-core",
  "cleartax-accounting": "lex-core",
  // Photography
  "lenscroft-studio": "lens-studio",
  // Events
  "forever-events": "feast-events",
  // Real Estate
  "propertyvault-mgmt": "estate-edge",
};

export function getTemplateIdentity(slug: string): TemplateIdentity | undefined {
  const resolved = SLUG_ALIAS[slug] ?? slug;
  return TEMPLATE_REGISTRY.find(t => t.slug === resolved);
}

export function getDefaultTemplateIdentity(): TemplateIdentity {
  return CLEAN_PRO;
}
