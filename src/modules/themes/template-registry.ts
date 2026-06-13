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

// ─── Registry ─────────────────────────────────────────────────────────────────

export const TEMPLATE_REGISTRY: TemplateIdentity[] = [
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
];

export function getTemplateIdentity(slug: string): TemplateIdentity | undefined {
  return TEMPLATE_REGISTRY.find(t => t.slug === slug);
}

export function getDefaultTemplateIdentity(): TemplateIdentity {
  return CLEAN_PRO;
}
