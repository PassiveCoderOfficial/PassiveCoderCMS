/**
 * Rich per-template preview content.
 * Every template gets real business copy, pricing, services, team, testimonials.
 * Used in the preview page to give visitors a genuine feel for the site.
 */

export interface ServiceItem {
  name: string;
  desc: string;
  price?: string;
  icon: string;
  image?: string;
}

export interface PricingTier {
  name: string;
  price: string;
  period?: string;
  features: string[];
  highlight?: boolean;
  cta: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  initials: string;
  color: string;
}

export interface Testimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
  initials: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface TemplateContent {
  tagline: string;
  phone: string;
  email: string;
  address: string;
  cta: string;
  ctaSecondary: string;
  navLinks: NavLink[];
  stats: Stat[];
  services: ServiceItem[];
  about: { heading: string; body: string; highlights: string[]; image?: string };
  pricing?: PricingTier[];
  team?: TeamMember[];
  testimonials: Testimonial[];
  faqItems?: { q: string; a: string }[];
  galleryLabels?: string[];
  badges: string[];
}

const CONTENT: Record<string, TemplateContent> = {

  // ── CleanPro ────────────────────────────────────────────────────────────────
  "clean-pro": {
    tagline: "Professional Cleaning You Can Trust",
    phone: "+1 (800) 555-2748",
    email: "hello@cleanpro.com",
    address: "45 Sparkle Street, Downtown District",
    cta: "Book a Clean",
    ctaSecondary: "Get a Free Quote",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "Gallery", href: "#gallery" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "3,400+", label: "Homes Cleaned" },
      { value: "98%", label: "Satisfaction Rate" },
      { value: "12 yr", label: "In Business" },
      { value: "5★", label: "Average Rating" },
    ],
    services: [
      { name: "Regular House Clean", desc: "Weekly, bi-weekly or monthly scheduled cleaning for a consistently fresh home.", price: "From $89", icon: "🏠" },
      { name: "Deep Clean", desc: "Top-to-bottom intensive clean including behind appliances, baseboards and inside cabinets.", price: "From $189", icon: "✨" },
      { name: "End-of-Lease Clean", desc: "Bond-back guarantee. We clean to real-estate inspection standards.", price: "From $249", icon: "🔑" },
      { name: "Office Cleaning", desc: "Daily, weekly or after-hours commercial cleaning for offices of all sizes.", price: "From $120", icon: "🏢" },
      { name: "Carpet & Upholstery", desc: "Hot water extraction steam cleaning for carpets, rugs and fabric sofas.", price: "From $79", icon: "🛋️" },
      { name: "Window Cleaning", desc: "Streak-free interior and exterior window cleaning using purified water systems.", price: "From $59", icon: "🪟" },
    ],
    about: {
      heading: "Dubai's Most Trusted Cleaning Company Since 2012",
      body: "CleanPro was founded on one simple belief: a clean space changes everything. Our trained, background-checked team uses eco-friendly products and professional-grade equipment to transform homes and offices across the city. Every job is backed by our 100% satisfaction guarantee — if you're not happy, we come back and re-clean for free.",
      highlights: ["Fully insured & bonded", "Eco-friendly products", "Background-checked staff", "Satisfaction guarantee", "Same-day availability"],
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&fit=crop",
    },
    pricing: [
      {
        name: "Essential",
        price: "$89",
        period: "per visit",
        features: ["Up to 2 bedrooms", "Bathroom & kitchen clean", "Vacuuming & mopping", "Surface wipe-down", "Eco-friendly products"],
        cta: "Book Now",
      },
      {
        name: "Premium",
        price: "$149",
        period: "per visit",
        features: ["Up to 4 bedrooms", "Deep bathroom scrub", "Inside oven & fridge", "Window sills & blinds", "Laundry & linen change", "Priority scheduling"],
        highlight: true,
        cta: "Book Now",
      },
      {
        name: "Commercial",
        price: "Custom",
        period: "monthly contract",
        features: ["Offices of any size", "Daily or weekly visits", "Dedicated cleaning team", "Supply & equipment included", "Account manager assigned"],
        cta: "Get a Quote",
      },
    ],
    team: [
      { name: "Maria Santos", role: "Operations Manager", bio: "10 years in cleaning management. Oversees quality control and team training.", initials: "MS", color: "#0ea5e9" },
      { name: "Jake Tanner", role: "Senior Technician", bio: "Specialist in deep cleaning and carpet restoration.", initials: "JT", color: "#06b6d4" },
      { name: "Priya Nair", role: "Client Relations", bio: "Ensures every booking is smooth and every client is delighted.", initials: "PN", color: "#0ea5e9" },
    ],
    testimonials: [
      { name: "Sarah M.", location: "Dubai Marina", text: "The team arrived on time, were incredibly professional and left my apartment spotless. The kitchen sparkled like it was brand new!", rating: 5, initials: "SM" },
      { name: "James R.", location: "Downtown", text: "I've tried four cleaning companies. CleanPro is the only one I've stuck with. Consistent, reliable, and honestly brilliant.", rating: 5, initials: "JR" },
      { name: "Hana K.", location: "JBR", text: "Used them for an end-of-lease clean and got my full bond back. 10/10 would recommend to anyone moving out.", rating: 5, initials: "HK" },
    ],
    faqItems: [
      { q: "Do I need to be home during the clean?", a: "No — we're happy to work with a key, access code or building management. Most clients are at work during their clean." },
      { q: "What products do you use?", a: "We use professional-grade, eco-certified cleaning products that are safe for children, pets and surfaces." },
      { q: "Are you insured?", a: "Yes. We carry full public liability insurance. Any accidental damage is covered." },
      { q: "How do I book?", a: "Use our online booking form, call or WhatsApp us. We'll confirm your slot within 2 hours." },
    ],
    galleryLabels: ["Kitchen After", "Bathroom Before/After", "Living Room", "Office Space", "Carpet Restore", "End-of-Lease"],
    badges: ["5★ on Google", "Eco Certified", "Fully Insured", "Same-Day Available"],
  },

  // ── Sparkle ─────────────────────────────────────────────────────────────────
  "sparkle": {
    tagline: "A Cleaner Home. A Happier You.",
    phone: "+1 (800) 555-7743",
    email: "book@sparkleclean.com",
    address: "221 Fresh Ave, Midtown",
    cta: "Book Online Now",
    ctaSecondary: "See Pricing",
    navLinks: [
      { label: "How It Works", href: "#how" },
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "Reviews", href: "#reviews" },
    ],
    stats: [
      { value: "60 sec", label: "To Book Online" },
      { value: "2,100+", label: "Happy Clients" },
      { value: "100%", label: "Bond-Back Rate" },
      { value: "4.9★", label: "Google Rating" },
    ],
    services: [
      { name: "Standard Home Clean", desc: "Kitchens, bathrooms, bedrooms and living areas cleaned to a professional standard.", price: "From $79", icon: "🏠" },
      { name: "Spring Clean", desc: "A thorough top-to-bottom refresh for when your home needs more than a regular tidy.", price: "From $169", icon: "🌸" },
      { name: "Move-In Clean", desc: "Have your new home sparkling before you move a single box in.", price: "From $149", icon: "📦" },
      { name: "After-Party Clean", desc: "We handle the mess so you don't have to. Available 7 days a week.", price: "From $99", icon: "🎉" },
    ],
    about: {
      heading: "Book in 60 Seconds. We Handle the Rest.",
      body: "Sparkle was built to make home cleaning genuinely effortless. Select your service, choose your time slot, and we handle everything else. Our trusted cleaners are fully vetted, insured, and trained to deliver a consistently excellent result — every single visit.",
      highlights: ["Online booking in 60 seconds", "Vetted & insured cleaners", "Same-day slots available", "Flexible rescheduling", "WhatsApp support"],
      image: "https://images.unsplash.com/photo-1527515637462-cff94edd471c?w=800&q=80&fit=crop",
    },
    testimonials: [
      { name: "Emma W.", location: "Bondi Beach", text: "Booked at 8am, had a cleaner by noon. The apartment was immaculate. I'm signing up for weekly from now on!", rating: 5, initials: "EW" },
      { name: "Chris L.", location: "Surry Hills", text: "Such an easy experience. App worked perfectly, cleaner was amazing, and the price was fair. Highly recommend.", rating: 5, initials: "CL" },
      { name: "Aisha B.", location: "Redfern", text: "Moved into my new apartment and Sparkle did the move-in clean. Worth every cent — it was pristine.", rating: 5, initials: "AB" },
    ],
    badges: ["Same-Day Booking", "60-Second Online Book", "Vetted Cleaners"],
  },

  // ── CoolAir ─────────────────────────────────────────────────────────────────
  "cool-air": {
    tagline: "Fast AC Repair & Installation",
    phone: "+971 50 555 4400",
    email: "service@coolair.ae",
    address: "Industrial Zone 3, Sharjah, UAE",
    cta: "Book AC Service",
    ctaSecondary: "Emergency Call",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Brands", href: "#brands" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "24/7", label: "Emergency Service" },
      { value: "50+", label: "Brands Serviced" },
      { value: "8,000+", label: "Units Installed" },
      { value: "15 yr", label: "Experience" },
    ],
    services: [
      { name: "AC Installation", desc: "Supply and install split, ducted and cassette AC units for residential and commercial spaces.", price: "From AED 399", icon: "❄️" },
      { name: "AC Service & Clean", desc: "Complete service including coil cleaning, gas top-up, drainage flush and filter replacement.", price: "From AED 99", icon: "🔧" },
      { name: "Emergency Repair", desc: "24/7 rapid-response repairs. Technician on-site within 2 hours in most areas.", price: "From AED 149", icon: "⚡" },
      { name: "Gas Recharge", desc: "R410A and R22 refrigerant top-up with leak test included.", price: "From AED 120", icon: "💨" },
      { name: "Duct Cleaning", desc: "Professional duct sanitisation and cleaning for better air quality and efficiency.", price: "From AED 250", icon: "🌬️" },
      { name: "AMC Contracts", desc: "Annual maintenance contracts with scheduled services and priority emergency response.", price: "From AED 499/yr", icon: "📋" },
    ],
    about: {
      heading: "UAE's Trusted HVAC Specialists Since 2009",
      body: "CoolAir has been keeping homes and businesses comfortable across the UAE for over 15 years. Our team of DEWA-approved technicians is trained on all major brands and models. We carry full stock of genuine spare parts for fast, same-visit repairs — no waiting days for parts to arrive.",
      highlights: ["DEWA-approved technicians", "All major brands", "Genuine spare parts stocked", "2-hour emergency response", "3-year installation warranty"],
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80&fit=crop",
    },
    pricing: [
      {
        name: "Basic Service",
        price: "AED 99",
        features: ["1 AC unit", "Filter clean", "Coil wash", "Performance check", "Report & recommendations"],
        cta: "Book Now",
      },
      {
        name: "Full Service",
        price: "AED 199",
        features: ["1 AC unit", "Deep coil clean", "Gas top-up check", "Drain flush", "Thermostat calibration", "90-day service warranty"],
        highlight: true,
        cta: "Book Now",
      },
      {
        name: "AMC Contract",
        price: "AED 499",
        period: "per year",
        features: ["Up to 3 units", "2× scheduled services", "Priority emergency calls", "20% parts discount", "Dedicated technician"],
        cta: "Get a Quote",
      },
    ],
    testimonials: [
      { name: "Mohammed A.", location: "Dubai Marina", text: "AC broke at midnight during summer. CoolAir had a technician here by 1am and it was fixed before 3. Absolutely outstanding service.", rating: 5, initials: "MA" },
      { name: "Priya S.", location: "JLT", text: "Annual maintenance has been top-notch for 3 years running. Honest, professional and always on time.", rating: 5, initials: "PS" },
      { name: "David H.", location: "Business Bay", text: "Installed 8 units in our new office. Spotless work, no mess, competitive price. Would recommend without hesitation.", rating: 5, initials: "DH" },
    ],
    faqItems: [
      { q: "How quickly can you respond to emergencies?", a: "We aim to have a technician on-site within 2 hours in Dubai, Sharjah and Abu Dhabi — 24 hours a day, 7 days a week." },
      { q: "Do you service all AC brands?", a: "Yes — we service all major brands including Daikin, Mitsubishi, LG, Samsung, Carrier, Trane, Gree and more." },
      { q: "What's included in an AMC?", a: "Our Annual Maintenance Contract includes 2 scheduled full services, priority emergency response, and discounts on parts and additional visits." },
    ],
    badges: ["DEWA Approved", "24/7 Emergency", "All Brands", "3-Year Warranty"],
  },

  // ── BuildBold ────────────────────────────────────────────────────────────────
  "build-bold": {
    tagline: "Building Your Vision From the Ground Up",
    phone: "+65 9123 4567",
    email: "projects@buildbold.sg",
    address: "8 Tuas Crescent, Singapore 638700",
    cta: "Request a Quote",
    ctaSecondary: "View Our Work",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Projects", href: "#projects" },
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "20 yr", label: "In Business" },
      { value: "850+", label: "Projects Completed" },
      { value: "$2.4B", label: "Construction Value" },
      { value: "ISO 9001", label: "Certified" },
    ],
    services: [
      { name: "New Build Construction", desc: "Commercial, industrial and residential new builds from groundwork to handover.", price: "Request Quote", icon: "🏗️" },
      { name: "Structural Renovation", desc: "Major renovation and addition works with full structural engineering support.", price: "Request Quote", icon: "🔨" },
      { name: "Fit-Out & Interiors", desc: "Commercial and retail fit-outs with project management and quality guarantee.", price: "Request Quote", icon: "🏢" },
      { name: "Civil Works", desc: "Roads, drainage, retaining walls and external civil engineering works.", price: "Request Quote", icon: "🛣️" },
      { name: "Project Management", desc: "End-to-end project management for developers and property owners.", price: "Request Quote", icon: "📋" },
      { name: "Design & Build", desc: "Integrated design-and-build service from concept to completion.", price: "Request Quote", icon: "📐" },
    ],
    about: {
      heading: "Two Decades. Hundreds of Projects. One Standard.",
      body: "BuildBold has been delivering exceptional construction projects across Singapore and the region since 2004. Our team of licensed engineers, architects and project managers brings precision, accountability and craftsmanship to every build — from a small shophouse renovation to a multi-storey commercial development.",
      highlights: ["BCA-licensed main contractor", "ISO 9001:2015 certified", "OHSAS 18001 safety certified", "20+ years track record", "700+ skilled tradesmen"],
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&fit=crop",
    },
    team: [
      { name: "Raymond Loh", role: "Managing Director", bio: "Civil engineer with 25 years of project delivery experience across Southeast Asia.", initials: "RL", color: "#ca8a04" },
      { name: "Sarah Chen", role: "Head of Design", bio: "Registered architect specialising in commercial and mixed-use developments.", initials: "SC", color: "#ea580c" },
      { name: "Ahmad Razali", role: "Project Director", bio: "Leads the team on major contracts. 18 years of site management excellence.", initials: "AR", color: "#b45309" },
    ],
    testimonials: [
      { name: "Vincent T.", location: "CBD, Singapore", text: "BuildBold delivered our 12-storey office block on time and under budget. The quality exceeded expectations — highly professional throughout.", rating: 5, initials: "VT" },
      { name: "Michelle W.", location: "Jurong East", text: "Our factory expansion was handled flawlessly. No disruption to our operations. Brilliant project team.", rating: 5, initials: "MW" },
      { name: "Tan Boon Keng", location: "Tampines", text: "Full house reconstruction. The team treated our project as if it were their own home. Amazing result.", rating: 5, initials: "TBK" },
    ],
    badges: ["BCA Licensed", "ISO 9001", "20+ Years", "850+ Projects"],
  },

  // ── Luxe Interior ────────────────────────────────────────────────────────────
  "luxe-interior": {
    tagline: "Interiors That Tell Your Story",
    phone: "+44 20 7946 0123",
    email: "studio@luxeinterior.co.uk",
    address: "14 Chelsea Design Quarter, London SW3",
    cta: "Book a Consultation",
    ctaSecondary: "View Portfolio",
    navLinks: [
      { label: "Studio", href: "#studio" },
      { label: "Portfolio", href: "#portfolio" },
      { label: "Services", href: "#services" },
      { label: "Press", href: "#press" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "18 yr", label: "Studio Founded" },
      { value: "340+", label: "Completed Projects" },
      { value: "12", label: "Design Awards" },
      { value: "UK & Int'l", label: "Portfolio" },
    ],
    services: [
      { name: "Full Interior Design", desc: "Complete interior concept, specification, procurement and project coordination for residential and commercial clients.", price: "From £2,500", icon: "🏛️" },
      { name: "Space Planning", desc: "Optimal layout solutions that maximize flow, functionality and aesthetic impact.", price: "From £750", icon: "📐" },
      { name: "Luxury Furniture Curation", desc: "Sourcing of high-end, unique and bespoke furniture pieces from global makers.", price: "From £500", icon: "🪑" },
      { name: "Colour Consultation", desc: "Mood-board led colour and material palette selection for each room.", price: "From £350", icon: "🎨" },
      { name: "Lighting Design", desc: "Architectural and decorative lighting schemes with specification and installation oversight.", price: "From £600", icon: "💡" },
      { name: "Styling & Staging", desc: "Property staging for sale or photography, including artwork, accessories and soft furnishings.", price: "From £800", icon: "🖼️" },
    ],
    about: {
      heading: "Where Luxury Meets Livability",
      body: "Luxe Interior is an award-winning London design studio with a reputation for creating spaces of exceptional quality and refined beauty. We collaborate closely with each client to understand how they live, work and entertain — translating those insights into bespoke interiors that are both visually stunning and genuinely livable. Our work has been featured in Architectural Digest, House & Garden and The World of Interiors.",
      highlights: ["Featured in Architectural Digest", "BIID registered designers", "Full project management", "Global sourcing network", "12 international design awards"],
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80&fit=crop",
    },
    testimonials: [
      { name: "Lady C. Harrington", location: "Kensington, London", text: "Transforming our townhouse was a dream — every detail exceeded expectations. The studio has an extraordinary eye and made the whole process enjoyable.", rating: 5, initials: "CH" },
      { name: "Marco F.", location: "Mayfair, London", text: "Our penthouse is now genuinely magazine-worthy. The team's attention to detail is second to none. Worth every penny.", rating: 5, initials: "MF" },
      { name: "The Beaumont Hotel", location: "Mayfair", text: "Luxe Interior designed our new restaurant space beautifully. The client response has been overwhelmingly positive.", rating: 5, initials: "BH" },
    ],
    galleryLabels: ["Kensington Living Room", "Belgravia Master Suite", "Chelsea Kitchen", "Mayfair Penthouse", "Country House Library", "Boutique Hotel Bar"],
    badges: ["BIID Registered", "Award Winning", "AD Featured", "18 Years"],
  },

  // ── Savour ───────────────────────────────────────────────────────────────────
  "savour": {
    tagline: "An Unforgettable Dining Experience",
    phone: "+60 3 2110 5588",
    email: "reservations@savourrestaurant.com",
    address: "32 Bukit Bintang, Kuala Lumpur 55100",
    cta: "Reserve a Table",
    ctaSecondary: "View Menu",
    navLinks: [
      { label: "Menu", href: "#menu" },
      { label: "Reservations", href: "#reservations" },
      { label: "Events", href: "#events" },
      { label: "Gallery", href: "#gallery" },
      { label: "About", href: "#about" },
    ],
    stats: [
      { value: "2014", label: "Est. Year" },
      { value: "4.9★", label: "TripAdvisor" },
      { value: "Best of KL", label: "2023 Award" },
      { value: "120", label: "Covers" },
    ],
    services: [
      { name: "À la Carte Dining", desc: "Modern European cuisine with Asian influences. Seasonal menu changes quarterly.", price: "RM 80–200 pp", icon: "🍽️" },
      { name: "Chef's Tasting Menu", desc: "7-course tasting menu with optional wine or cocktail pairing. Groups of 2–10.", price: "RM 280 pp", icon: "👨‍🍳" },
      { name: "Private Dining Room", desc: "Exclusive room for 10–30 guests. Customised menu and dedicated service team.", price: "From RM 3,500", icon: "🥂" },
      { name: "Cocktail Masterclass", desc: "2-hour guided cocktail experience with our head mixologist. Max 12 guests.", price: "RM 180 pp", icon: "🍸" },
      { name: "Corporate Events", desc: "Full event catering for product launches, business dinners and client entertainment.", price: "From RM 8,000", icon: "🤝" },
      { name: "High Tea", desc: "Weekend high tea service featuring house-made pastries, sandwiches and signature teas.", price: "RM 88 pp", icon: "🫖" },
    ],
    about: {
      heading: "Born From a Love of Honest, Exceptional Food",
      body: "Savour was created by Chef Marcus Lim in 2014 with a singular vision: to serve food that genuinely moves people. Every dish on our menu starts with the best local and imported ingredients, treated with respect and prepared with technique. We believe a great meal should be as memorable as any experience in life — and we work hard to make every visit your best one yet.",
      highlights: ["Led by Michelin-trained Chef Marcus Lim", "Seasonal farm-to-table sourcing", "Award-winning wine cellar", "Vegetarian & vegan menus available", "Private dining for up to 30 guests"],
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80&fit=crop",
    },
    testimonials: [
      { name: "Nurul Ain", location: "Bangsar, KL", text: "The tasting menu was an absolute revelation. Every course was beautifully presented and tasted extraordinary. This is fine dining done perfectly.", rating: 5, initials: "NA" },
      { name: "James O.", location: "KLCC", text: "Celebrated our anniversary here. The private room was magical, the food was world-class and the service was impeccable. We'll be back.", rating: 5, initials: "JO" },
      { name: "Raj P.", location: "Mont Kiara", text: "Best restaurant in KL, full stop. The sommelier's wine pairings were exceptional and the staff genuinely care about your experience.", rating: 5, initials: "RP" },
    ],
    galleryLabels: ["Chef's Signature Dish", "Wine Cellar", "Private Dining Room", "Cocktail Bar", "Kitchen Team", "Restaurant Ambiance"],
    badges: ["TripAdvisor Certificate", "Best of KL 2023", "Private Dining", "Wine Certified"],
  },

  // ── GlowSalon ────────────────────────────────────────────────────────────────
  "glow-salon": {
    tagline: "Feel Beautiful. Look Radiant.",
    phone: "+966 11 555 8899",
    email: "appointments@glowsalon.sa",
    address: "Al Olaya District, Riyadh 12211",
    cta: "Book Appointment",
    ctaSecondary: "View Services & Prices",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Stylists", href: "#team" },
      { label: "Gallery", href: "#gallery" },
      { label: "Offers", href: "#offers" },
      { label: "Book", href: "#book" },
    ],
    stats: [
      { value: "8,500+", label: "Happy Clients" },
      { value: "12", label: "Expert Stylists" },
      { value: "4.9★", label: "Google Rating" },
      { value: "10 yr", label: "Established" },
    ],
    services: [
      { name: "Haircut & Blow Dry", desc: "Precision cut and finish by a senior stylist. Includes scalp massage and style consultation.", price: "From SAR 180", icon: "✂️" },
      { name: "Colour & Highlights", desc: "Global colour, balayage, highlights and fashion colours using L'Oréal Professionnel.", price: "From SAR 280", icon: "🎨" },
      { name: "Keratin Treatment", desc: "Smoothing treatment for frizzy, unruly hair. Lasts 3–5 months.", price: "From SAR 450", icon: "💫" },
      { name: "Bridal Package", desc: "Full day bridal prep including hair, makeup, nails and refreshments.", price: "From SAR 1,200", icon: "👰" },
      { name: "Manicure & Pedicure", desc: "Classic, gel or chrome nail services by our nail specialists.", price: "From SAR 120", icon: "💅" },
      { name: "Facial & Skincare", desc: "Dermalogica facials, LED light therapy and skin consultations.", price: "From SAR 250", icon: "🌸" },
    ],
    about: {
      heading: "Riyadh's Premier Beauty Destination Since 2015",
      body: "Glow Salon was founded by master stylist Hessa Al-Rashidi with a clear mission: give every client an extraordinary experience from the moment they walk through the door. Our team of internationally trained stylists, colourists and therapists stays at the cutting edge of beauty trends while delivering personalised, caring service. Our salon is a sanctuary — a place to relax, be pampered and leave feeling genuinely transformed.",
      highlights: ["Internationally trained stylists", "L'Oréal & Dermalogica certified", "Ladies-only salon", "Bridal specialist", "Loyalty rewards program"],
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80&fit=crop",
    },
    team: [
      { name: "Hessa Al-Rashidi", role: "Master Stylist & Founder", bio: "Trained in Paris and London. 15 years creating exceptional hair for clients across the Middle East.", initials: "HA", color: "#9d174d" },
      { name: "Dana Al-Mutairi", role: "Senior Colourist", bio: "Balayage and colour correction specialist. Trained with L'Oréal in Dubai.", initials: "DM", color: "#f43f5e" },
      { name: "Lina Hassan", role: "Bridal Specialist", bio: "Over 400 bridal packages delivered. Makes every bride's day magical.", initials: "LH", color: "#9d174d" },
    ],
    testimonials: [
      { name: "Reem A.", location: "Al Olaya, Riyadh", text: "Hessa transformed my hair completely. The balayage is absolutely stunning — I get compliments everywhere I go now.", rating: 5, initials: "RA" },
      { name: "Sara M.", location: "Sulaimaniyah", text: "Best bridal experience I could have asked for. The whole team was incredible and I looked exactly how I'd always imagined.", rating: 5, initials: "SM" },
      { name: "Fatima K.", location: "Al Nakheel", text: "I've been coming for 3 years and the quality never drops. Amazing team, beautiful salon, and the loyalty points are a great bonus.", rating: 5, initials: "FK" },
    ],
    badges: ["Ladies Only", "Bridal Specialist", "L'Oréal Certified", "10 Years"],
  },

  // ── Iron Gym ─────────────────────────────────────────────────────────────────
  "iron-gym": {
    tagline: "Train Hard. Live Strong.",
    phone: "+65 6555 2200",
    email: "join@irongym.sg",
    address: "18 Biopolis Way, Singapore 138668",
    cta: "Join Today",
    ctaSecondary: "View Memberships",
    navLinks: [
      { label: "Facilities", href: "#facilities" },
      { label: "Classes", href: "#classes" },
      { label: "Memberships", href: "#memberships" },
      { label: "Trainers", href: "#trainers" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "4,200+", label: "Active Members" },
      { value: "12,000 sqft", label: "Training Space" },
      { value: "60+", label: "Weekly Classes" },
      { value: "18", label: "Certified Trainers" },
    ],
    services: [
      { name: "Strength & Conditioning", desc: "Full free-weight floor, squat racks, barbells and plate-loaded machines.", icon: "💪" },
      { name: "Cardio Zone", desc: "50+ treadmills, bikes, rowers and ellipticals with integrated entertainment.", icon: "🏃" },
      { name: "Group Fitness Classes", desc: "HIIT, Spin, Boxing, BodyPump, Pilates and more — 60+ classes weekly.", icon: "🥊" },
      { name: "Personal Training", desc: "1-on-1 coaching with certified trainers. Goal-specific programs.", icon: "🏋️" },
      { name: "CrossFit Box", desc: "Dedicated 2,000 sqft CrossFit area with rigs, sleds and turf track.", icon: "🏅" },
      { name: "Recovery Suite", desc: "Sauna, ice bath, foam rolling area and stretch zone.", icon: "🧘" },
    ],
    about: {
      heading: "Singapore's Most Serious Training Facility",
      body: "Iron Gym was built for people who are serious about their training. We invested in elite equipment, world-class coaches and a no-nonsense environment that lets you focus on one thing: getting better. Whether you're a first-time gym-goer or a competitive athlete, our facility and team have everything you need to reach your potential.",
      highlights: ["24/7 access for members", "Elite Eleiko & Life Fitness equipment", "18 certified personal trainers", "60+ group fitness classes weekly", "No joining fee this month"],
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&fit=crop",
    },
    pricing: [
      {
        name: "Basic",
        price: "SGD 68",
        period: "per month",
        features: ["Gym floor access", "2 group classes/week", "Locker access", "App & class booking", "Cancel anytime"],
        cta: "Get Started",
      },
      {
        name: "All Access",
        price: "SGD 108",
        period: "per month",
        features: ["Everything in Basic", "Unlimited group classes", "Recovery suite access", "1 PT session/month", "Nutrition consultation", "Guest passes (2/month)"],
        highlight: true,
        cta: "Join Now",
      },
      {
        name: "Elite",
        price: "SGD 188",
        period: "per month",
        features: ["Everything in All Access", "4 PT sessions/month", "Monthly body composition scan", "Priority class booking", "Dedicated locker", "Protein shakes included"],
        cta: "Apply",
      },
    ],
    team: [
      { name: "Marcus Tan", role: "Head Coach & Co-Founder", bio: "Former national powerlifting champion. 12 years of elite coaching experience.", initials: "MT", color: "#fbbf24" },
      { name: "Jessica Wong", role: "Group Fitness Director", bio: "Master trainer in Les Mills, CrossFit L3 and ACE certified.", initials: "JW", color: "#fbbf24" },
      { name: "Raj Sundaram", role: "Strength & Conditioning Coach", bio: "NSCA-CSCS certified. Works with professional athletes and serious amateurs.", initials: "RS", color: "#fbbf24" },
    ],
    testimonials: [
      { name: "Kevin L.", location: "Buona Vista", text: "Best gym in Singapore, no competition. The equipment is world-class, the coaches actually care and the community is genuinely motivating.", rating: 5, initials: "KL" },
      { name: "Serena C.", location: "Holland Village", text: "I've been a member for 2 years. The HIIT and spin classes are incredible — I'm fitter than I've ever been in my life.", rating: 5, initials: "SC" },
      { name: "Amir H.", location: "Queenstown", text: "The PT sessions with Marcus changed everything for me. My deadlift is up 40kg in 6 months. Couldn't be happier.", rating: 5, initials: "AH" },
    ],
    badges: ["24/7 Access", "60+ Classes", "No Joining Fee", "Free PT Trial"],
  },

  // ── Lexis Law ────────────────────────────────────────────────────────────────
  "lexis-law": {
    tagline: "Protecting Your Rights. Delivering Results.",
    phone: "+1 (212) 555 8800",
    email: "consult@lexislaw.com",
    address: "1221 Avenue of the Americas, New York, NY 10020",
    cta: "Free Consultation",
    ctaSecondary: "Practice Areas",
    navLinks: [
      { label: "Practice Areas", href: "#practice" },
      { label: "Our Team", href: "#team" },
      { label: "Results", href: "#results" },
      { label: "Blog", href: "#blog" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "30+ yr", label: "Combined Experience" },
      { value: "$500M+", label: "Client Recoveries" },
      { value: "98%", label: "Case Success Rate" },
      { value: "AV Rated", label: "Martindale-Hubbell" },
    ],
    services: [
      { name: "Corporate Law", desc: "Business formation, mergers and acquisitions, shareholder agreements and corporate governance.", icon: "🏢" },
      { name: "Family Law", desc: "Divorce, child custody, property settlements and domestic relations matters.", icon: "👨‍👩‍👧" },
      { name: "Criminal Defense", desc: "Aggressive defense at every stage from arraignment through trial and appeal.", icon: "⚖️" },
      { name: "Real Estate Law", desc: "Commercial and residential transactions, title disputes and landlord-tenant matters.", icon: "🏠" },
      { name: "Employment Law", desc: "Wrongful termination, discrimination, harassment and wage & hour claims.", icon: "💼" },
      { name: "Personal Injury", desc: "Auto accidents, slip and fall, medical malpractice on a contingency fee basis.", icon: "🩺" },
    ],
    about: {
      heading: "A New York Firm Built on Results, Not Promises",
      body: "Lexis Law has represented clients in New York for over three decades. Our attorneys combine deep legal expertise with a genuine commitment to achieving the best possible outcome for every client. We take on the cases others won't, fight when settlement doesn't serve your interests, and communicate with you every step of the way. We don't measure success by billable hours — we measure it by results.",
      highlights: ["AV Preeminent rated by Martindale-Hubbell", "Former federal prosecutors on staff", "No fee unless we win (injury cases)", "Bilingual attorneys (English & Spanish)", "Free initial consultation"],
      image: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800&q=80&fit=crop",
    },
    team: [
      { name: "Michael Lexis", role: "Founding Partner", bio: "Yale Law graduate. 28 years of litigation experience including 3 Supreme Court appearances.", initials: "ML", color: "#1e3a5f" },
      { name: "Elena Vásquez", role: "Partner, Family Law", bio: "20 years in family law. Recognised by New York Magazine's list of top attorneys.", initials: "EV", color: "#1e3a8a" },
      { name: "David Park", role: "Partner, Criminal Defense", bio: "Former Manhattan DA. His courtroom record speaks for itself: 94% trial win rate.", initials: "DP", color: "#1e3a5f" },
    ],
    testimonials: [
      { name: "Robert A.", location: "Manhattan", text: "Michael and his team handled my business dispute with exceptional skill. We won when everyone said we couldn't. They truly earned every dollar.", rating: 5, initials: "RA" },
      { name: "Maria G.", location: "Brooklyn", text: "Elena guided me through my divorce with compassion, clarity and strength. She protected my children's interests every step of the way.", rating: 5, initials: "MG" },
      { name: "James T.", location: "Queens", text: "David Park is the best criminal defense attorney in New York. He got my charges dismissed when I thought all was lost.", rating: 5, initials: "JT" },
    ],
    badges: ["AV Preeminent", "Free Consultation", "30+ Years", "98% Success Rate"],
  },

  // ── Prime Property ───────────────────────────────────────────────────────────
  "prime-property": {
    tagline: "Find Your Dream Property",
    phone: "+971 4 555 7700",
    email: "properties@primeproperty.ae",
    address: "DIFC Gate Village, Dubai, UAE",
    cta: "Browse Listings",
    ctaSecondary: "Talk to an Agent",
    navLinks: [
      { label: "Buy", href: "#buy" },
      { label: "Rent", href: "#rent" },
      { label: "Agents", href: "#agents" },
      { label: "New Launches", href: "#launches" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "2,400+", label: "Active Listings" },
      { value: "AED 4.2B", label: "Sales Volume 2023" },
      { value: "35", label: "Specialist Agents" },
      { value: "4.8★", label: "Client Rating" },
    ],
    services: [
      { name: "Residential Sales", desc: "Villas, apartments and townhouses across Dubai's most sought-after communities.", icon: "🏠" },
      { name: "Commercial Property", desc: "Offices, warehouses, retail units and mixed-use investments.", icon: "🏢" },
      { name: "Property Management", desc: "Full management for landlords — tenant sourcing, maintenance, rent collection.", icon: "🔑" },
      { name: "Off-Plan Investment", desc: "Direct developer partnerships. Exclusive access to new launches before public release.", icon: "📐" },
      { name: "Mortgage Advisory", desc: "Access to 15+ banks. Expert guidance on UAE and international mortgages.", icon: "🏦" },
      { name: "Luxury Collection", desc: "Exclusive mandate on ultra-premium properties. Palm Jumeirah, DIFC and Downtown.", icon: "💎" },
    ],
    about: {
      heading: "Dubai Real Estate Excellence, Delivered",
      body: "Prime Property is one of Dubai's leading real estate agencies, with a team of RERA-registered agents specialising in residential sales, commercial property and investment consultancy. Our in-depth knowledge of the Dubai market — from emerging communities to established premium districts — means we consistently match buyers with the right property at the right price. We work on relationships, not transactions.",
      highlights: ["RERA registered brokerage", "35+ specialist agents", "Multilingual team (10 languages)", "Direct developer partnerships", "24/7 client support"],
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&fit=crop",
    },
    testimonials: [
      { name: "Alexandra N.", location: "Palm Jumeirah", text: "Found our dream villa in three weeks. The team understood exactly what we were looking for from the first meeting. Exceptional service.", rating: 5, initials: "AN" },
      { name: "Khalid R.", location: "Downtown Dubai", text: "Bought two investment apartments through Prime. Their market analysis was spot-on and both have delivered above-expected returns.", rating: 5, initials: "KR" },
      { name: "Sophie L.", location: "JVC", text: "As a first-time buyer in Dubai, I needed guidance every step of the way. The team were patient, honest and genuinely helpful.", rating: 5, initials: "SL" },
    ],
    badges: ["RERA Registered", "2,400+ Listings", "35 Agents", "AED 4.2B Sales"],
  },

  // ── LensCraft ────────────────────────────────────────────────────────────────
  "lens-craft": {
    tagline: "Capturing Moments That Last Forever",
    phone: "+65 9876 5432",
    email: "studio@lenscraft.sg",
    address: "16 Ann Siang Road, Singapore 069791",
    cta: "Book Your Session",
    ctaSecondary: "See Portfolio",
    navLinks: [
      { label: "Portfolio", href: "#portfolio" },
      { label: "Packages", href: "#packages" },
      { label: "Weddings", href: "#weddings" },
      { label: "About", href: "#about" },
      { label: "Book", href: "#book" },
    ],
    stats: [
      { value: "650+", label: "Weddings Shot" },
      { value: "4.9★", label: "Average Rating" },
      { value: "8 yr", label: "In Business" },
      { value: "Intl.", label: "Destinations" },
    ],
    services: [
      { name: "Wedding Photography", desc: "Full-day wedding coverage with edited gallery delivered within 3 weeks.", price: "From SGD 3,200", icon: "💍" },
      { name: "Pre-Wedding Shoot", desc: "Romantic couple session — local studio or international locations.", price: "From SGD 800", icon: "💑" },
      { name: "Corporate & Events", desc: "Product launches, conferences, team photos and corporate events.", price: "From SGD 1,200", icon: "📸" },
      { name: "Portrait Sessions", desc: "Individual or family portraits in-studio or on location.", price: "From SGD 450", icon: "👤" },
      { name: "Commercial Photography", desc: "Brand, product and food photography for print and digital campaigns.", price: "From SGD 1,500", icon: "🛍️" },
      { name: "Videography", desc: "Cinematic wedding films, brand videos and event highlight reels.", price: "From SGD 2,000", icon: "🎬" },
    ],
    about: {
      heading: "Singapore's Most Awarded Wedding Photographer",
      body: "LensCraft is the studio of award-winning photographer Lucas Chen. Over 8 years and more than 650 weddings, Lucas has built a reputation for capturing genuine emotion with beautiful, timeless imagery. His editorial-style approach blends documentary storytelling with artistic portraiture — the result is a wedding album that feels like a film, not a photo album.",
      highlights: ["Best Wedding Photographer SG 2022 & 2023", "Destination wedding specialist", "2 photographers per wedding", "International copyright licence", "3-week delivery guarantee"],
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80&fit=crop",
    },
    pricing: [
      {
        name: "Portrait",
        price: "SGD 450",
        features: ["2-hour session", "1 location", "40 edited images", "Online gallery", "Print licence"],
        cta: "Book Now",
      },
      {
        name: "Wedding Essential",
        price: "SGD 3,200",
        features: ["Full wedding day", "2 photographers", "600+ edited images", "Online gallery + USB", "Free engagement shoot"],
        highlight: true,
        cta: "Book Now",
      },
      {
        name: "Wedding Premium",
        price: "SGD 5,800",
        features: ["Full wedding + reception", "2 photographers + videographer", "Cinematic highlight film", "800+ edited images", "Premium album included", "International coverage"],
        cta: "Book Now",
      },
    ],
    testimonials: [
      { name: "Jasmine & David T.", location: "Marina Bay Sands, Singapore", text: "Lucas captured our wedding so beautifully. Every photo tells a story — we cry every time we look at them. The album is a treasure.", rating: 5, initials: "JD" },
      { name: "Hannah W.", location: "Sentosa", text: "Our pre-wedding shoot was magical. Lucas made us feel completely comfortable and the images are absolutely breathtaking.", rating: 5, initials: "HW" },
      { name: "Fiona & Mark C.", location: "Capella Hotel", text: "We flew Lucas to Bali for our destination wedding. Best decision we made. The film he created is cinema-quality.", rating: 5, initials: "FM" },
    ],
    badges: ["Best Wedding Photographer", "650+ Weddings", "International", "Film & Photo"],
  },

  // ── Pixel Agency ─────────────────────────────────────────────────────────────
  "pixel-agency": {
    tagline: "We Grow Brands Digitally",
    phone: "+44 20 3936 4400",
    email: "hello@pixelagency.co.uk",
    address: "7 Silicon Roundabout, Shoreditch, London E1W",
    cta: "Get a Free Proposal",
    ctaSecondary: "See Our Work",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Case Studies", href: "#cases" },
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "320+", label: "Brands Grown" },
      { value: "£140M+", label: "Revenue Generated" },
      { value: "4.2×", label: "Avg. ROAS" },
      { value: "Google Premier", label: "Partner" },
    ],
    services: [
      { name: "Search Engine Optimisation", desc: "Technical SEO, content strategy and link building that drives lasting organic traffic growth.", price: "From £1,200/mo", icon: "🔍" },
      { name: "Paid Search (PPC)", desc: "Google and Bing Ads managed by certified specialists. Every pound of budget optimised.", price: "From £800/mo", icon: "📈" },
      { name: "Social Media Ads", desc: "Facebook, Instagram, LinkedIn and TikTok advertising with full creative production.", price: "From £1,000/mo", icon: "📱" },
      { name: "Web Design & Dev", desc: "Conversion-optimised websites built on Next.js, WordPress and custom platforms.", price: "From £4,500", icon: "💻" },
      { name: "Content Marketing", desc: "SEO-driven blog content, landing pages, video scripts and email sequences.", price: "From £600/mo", icon: "✍️" },
      { name: "Brand Strategy", desc: "Brand identity, positioning, messaging framework and visual design system.", price: "From £3,500", icon: "🎯" },
    ],
    about: {
      heading: "The Agency Behind 320+ Growth Stories",
      body: "Pixel Agency was founded in 2016 by digital marketing specialists who were frustrated by agencies that over-promised and under-delivered. We built our business on transparency, accountability and a genuine obsession with client results. Every campaign we run is data-driven, every decision is documented, and every month you get a clear picture of your ROI. No fluff. Just growth.",
      highlights: ["Google Premier Partner", "Meta Business Partner", "In-house creative team", "Dedicated account managers", "Monthly transparent reporting"],
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80&fit=crop",
    },
    team: [
      { name: "Alex Morgan", role: "CEO & Head of Strategy", bio: "Former Google UK team. Built digital strategies for FTSE 100 brands before founding Pixel.", initials: "AM", color: "#6366f1" },
      { name: "Priya Kapoor", role: "Head of SEO", bio: "10 years in technical SEO. Specialises in enterprise migrations and content strategies.", initials: "PK", color: "#7c3aed" },
      { name: "Tom Ellis", role: "Creative Director", bio: "Award-winning creative with backgrounds in advertising, film and interactive design.", initials: "TE", color: "#6366f1" },
    ],
    testimonials: [
      { name: "Marcus B.", location: "Leeds (E-commerce)", text: "Pixel took our paid ads from £8k/month in losses to £180k in monthly profit within 9 months. Genuinely life-changing for our business.", rating: 5, initials: "MB" },
      { name: "Sarah J.", location: "London (SaaS)", text: "Our organic traffic grew 340% in 12 months. The SEO team is exceptional — they understand both the technical and content sides perfectly.", rating: 5, initials: "SJ" },
      { name: "The Hartley Group", location: "Manchester", text: "New website plus SEO campaign generated 4× more leads than before at half the CPL. Pixel are our long-term growth partners.", rating: 5, initials: "HG" },
    ],
    badges: ["Google Premier Partner", "Meta Business Partner", "£140M Revenue", "4.2× ROAS"],
  },

  // ── Corporate One ────────────────────────────────────────────────────────────
  "corporate-one": {
    tagline: "Building Business Relationships That Last",
    phone: "+1 (312) 555 3300",
    email: "info@corporateone.com",
    address: "200 S Wacker Drive, Suite 3400, Chicago IL 60606",
    cta: "Get in Touch",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Industries", href: "#industries" },
      { label: "News", href: "#news" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "1994", label: "Founded" },
      { value: "28", label: "Countries" },
      { value: "4,200+", label: "Employees" },
      { value: "Fortune 500", label: "Clients" },
    ],
    services: [
      { name: "Management Consulting", desc: "Strategic advisory, operational excellence and organisational transformation for enterprise clients.", icon: "📊" },
      { name: "Technology Services", desc: "Digital transformation, cloud migration, cybersecurity and enterprise IT solutions.", icon: "💻" },
      { name: "Financial Advisory", desc: "M&A advisory, restructuring, valuation and transaction support services.", icon: "📈" },
      { name: "HR & Talent Solutions", desc: "Executive search, HR transformation and workforce strategy for growing companies.", icon: "👥" },
      { name: "Legal & Compliance", desc: "Corporate legal support, regulatory compliance and risk management programmes.", icon: "⚖️" },
      { name: "Sustainability", desc: "ESG strategy, carbon reporting and sustainable business transformation.", icon: "🌱" },
    ],
    about: {
      heading: "A Global Firm. A Local Partner.",
      body: "Corporate One is a multinational professional services group headquartered in Chicago with offices across North America, Europe, the Middle East and Asia Pacific. For 30 years we've helped businesses navigate complexity, seize opportunity and build lasting competitive advantage. Our people are our product — and we invest in them relentlessly so they can deliver for you.",
      highlights: ["Presence in 28 countries", "4,200+ professionals", "Fortune 500 client roster", "30 years in business", "ISO 27001 certified"],
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&fit=crop",
    },
    team: [
      { name: "Jonathan Pierce", role: "CEO & Chairman", bio: "Harvard MBA. 25 years in professional services. Former McKinsey partner.", initials: "JP", color: "#1e40af" },
      { name: "Christine Walsh", role: "President, Americas", bio: "Led the North American practice to 3× growth over 8 years.", initials: "CW", color: "#1e3a8a" },
      { name: "David Huang", role: "Managing Director, Asia Pac", bio: "Singapore-based. Opened 7 offices across Asia Pacific since 2018.", initials: "DH", color: "#1e40af" },
    ],
    testimonials: [
      { name: "CFO, Global Retailer", location: "Fortune 200, New York", text: "Corporate One's transformation programme delivered $40M in cost savings in year one while improving our customer satisfaction scores. Exceptional work.", rating: 5, initials: "CF" },
      { name: "CEO, Regional Bank", location: "Chicago", text: "Their financial advisory team guided us through our most complex M&A transaction. Thorough, professional and always available.", rating: 5, initials: "CE" },
      { name: "Head of HR, Tech Firm", location: "San Francisco", text: "The talent solutions team placed 6 of our C-suite hires. Every single one has been exceptional. They truly understand our culture.", rating: 5, initials: "HH" },
    ],
    badges: ["Fortune 500 Clients", "28 Countries", "30 Years", "ISO 27001"],
  },

  // ── EventFlow ─────────────────────────────────────────────────────────────────
  "event-flow": {
    tagline: "Creating Unforgettable Events",
    phone: "+971 50 555 9900",
    email: "events@eventflow.ae",
    address: "Business Bay, Dubai, UAE",
    cta: "Plan My Event",
    ctaSecondary: "View Portfolio",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Portfolio", href: "#portfolio" },
      { label: "Weddings", href: "#weddings" },
      { label: "Corporate", href: "#corporate" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "1,200+", label: "Events Delivered" },
      { value: "AED 85M", label: "Events Budget Managed" },
      { value: "50+", label: "Venue Partnerships" },
      { value: "4.9★", label: "Client Rating" },
    ],
    services: [
      { name: "Wedding Planning", desc: "End-to-end luxury wedding planning from engagement to honeymoon. Every detail, perfected.", price: "From AED 25,000", icon: "💒" },
      { name: "Corporate Events", desc: "Product launches, galas, conferences and team-building experiences across the UAE.", price: "From AED 15,000", icon: "🎪" },
      { name: "Private Parties", desc: "Birthday celebrations, anniversaries, gender reveals and milestone events.", price: "From AED 8,000", icon: "🎉" },
      { name: "Venue Sourcing", desc: "Access to 50+ exclusive venues across Dubai, Abu Dhabi and the wider UAE.", price: "Free consultation", icon: "📍" },
      { name: "Entertainment & Décor", desc: "Staging, lighting, florals, live entertainment and audiovisual production.", price: "Custom quote", icon: "🎭" },
      { name: "Virtual & Hybrid Events", desc: "Broadcast-quality virtual and hybrid events with global reach.", price: "From AED 10,000", icon: "📡" },
    ],
    about: {
      heading: "UAE's Premier Event Management Company",
      body: "EventFlow was born from a passion for creating moments that move people. Our team of event designers, planners and production specialists has delivered over 1,200 events across the UAE and beyond — from intimate desert dinners to 3,000-guest gala celebrations. We obsess over every detail so our clients can be fully present and enjoy their event as guests of honour.",
      highlights: ["1,200+ successful events", "50+ exclusive venue partners", "In-house décor & production team", "Multilingual planning team", "24/7 support on event day"],
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&q=80&fit=crop",
    },
    testimonials: [
      { name: "H.H. Princess Amira", location: "Abu Dhabi", text: "EventFlow organised our family celebration with absolute precision and breathtaking beauty. They transformed our vision into something beyond imagination.", rating: 5, initials: "PA" },
      { name: "COO, Emirates Group", location: "Dubai", text: "Our annual gala for 800 guests was executed flawlessly. Every element was world-class — staging, catering, entertainment and logistics.", rating: 5, initials: "CO" },
      { name: "Sarah & James H.", location: "Atlantis, Dubai", text: "They planned our entire wedding in 3 months. We just had to show up and enjoy. Truly the most perfect day of our lives.", rating: 5, initials: "SJ" },
    ],
    badges: ["1,200+ Events", "AED 85M Managed", "Luxury Weddings", "24/7 Support"],
  },

  // ── Zen Spa ──────────────────────────────────────────────────────────────────
  "zen-spa": {
    tagline: "Relax. Restore. Renew.",
    phone: "+65 6234 5678",
    email: "bookings@zenspa.sg",
    address: "12 Orchard Boulevard, Singapore 248648",
    cta: "Book a Treatment",
    ctaSecondary: "View All Treatments",
    navLinks: [
      { label: "Treatments", href: "#treatments" },
      { label: "Packages", href: "#packages" },
      { label: "Gift Vouchers", href: "#vouchers" },
      { label: "Memberships", href: "#memberships" },
      { label: "About", href: "#about" },
    ],
    stats: [
      { value: "12,000+", label: "Treatments Delivered" },
      { value: "4.9★", label: "Google Rating" },
      { value: "8 yr", label: "Orchard Boulevard" },
      { value: "98%", label: "Return Rate" },
    ],
    services: [
      { name: "Signature Zen Massage", desc: "Our 90-minute full-body fusion of Swedish and Thai techniques. The ultimate relaxation.", price: "From SGD 180", icon: "🧘" },
      { name: "Hot Stone Therapy", desc: "Warm basalt stones combined with deep tissue massage to release chronic tension.", price: "From SGD 220", icon: "🪨" },
      { name: "Facial & Skin Renewal", desc: "Elemis and ESPA luxury facials tailored to your skin type. Visibly glowing results.", price: "From SGD 160", icon: "✨" },
      { name: "Body Scrub & Wrap", desc: "Exfoliating scrubs and nourishing body wraps using natural botanicals.", price: "From SGD 140", icon: "🌿" },
      { name: "Couples Retreat", desc: "Side-by-side treatment for two, with champagne and fruit platter included.", price: "From SGD 480", icon: "💑" },
      { name: "Prenatal Massage", desc: "Specially adapted massage for expectant mothers — safe, supportive and deeply relaxing.", price: "From SGD 160", icon: "🤰" },
    ],
    about: {
      heading: "A True Urban Sanctuary in the Heart of Orchard",
      body: "Zen Spa is Singapore's most celebrated wellness destination. Housed in a serene 5,000sqft space on Orchard Boulevard, our spa combines ancient healing traditions with modern luxury to create transformative treatment experiences. Every therapist is trained to the highest international standard, and our treatment rooms are designed to transport you completely away from the pace of city life the moment you step inside.",
      highlights: ["5,000 sqft dedicated spa floor", "Elemis & ESPA certified therapists", "Separate male and female facilities", "Champagne welcome for couples", "Corporate wellness programmes"],
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&fit=crop",
    },
    pricing: [
      {
        name: "Single Visit",
        price: "From SGD 140",
        features: ["One treatment of your choice", "Steam room access", "Welcome tea ceremony", "Locker & robe provided", "Complimentary refreshments"],
        cta: "Book Now",
      },
      {
        name: "Monthly Membership",
        price: "SGD 280",
        period: "per month",
        features: ["2 treatments per month", "Unlimited steam room", "15% off additional treatments", "Priority booking", "Free birthday treatment"],
        highlight: true,
        cta: "Join Now",
      },
    ],
    testimonials: [
      { name: "Clara T.", location: "Orchard", text: "The Couples Retreat was the most indulgent two hours of our lives. Everything was perfect — the ambiance, the therapists, the champagne. Pure bliss.", rating: 5, initials: "CT" },
      { name: "Michelle L.", location: "CBD", text: "I come every month as part of my corporate membership. It genuinely keeps me sane. The hot stone massage is exceptional.", rating: 5, initials: "ML" },
      { name: "Naomi K.", location: "Tanjong Pagar", text: "Best facial in Singapore. My skin looked 5 years younger after the Elemis Pro-Collagen treatment. The therapist was incredibly knowledgeable.", rating: 5, initials: "NK" },
    ],
    badges: ["Elemis Certified", "ESPA Partner", "5,000 sqft", "Orchard Blvd"],
  },

  // ── Wealth Advisor ───────────────────────────────────────────────────────────
  "wealth-advisor": {
    tagline: "Your Financial Future, Secured",
    phone: "+1 (646) 555 4100",
    email: "consult@wealthadvisor.com",
    address: "345 Park Avenue, 22nd Floor, New York NY 10154",
    cta: "Book Free Consultation",
    ctaSecondary: "Our Approach",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Our Team", href: "#team" },
      { label: "Insights", href: "#insights" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "$2.8B", label: "Assets Under Management" },
      { value: "1,200+", label: "Client Families" },
      { value: "28 yr", label: "Average Advisor Experience" },
      { value: "SEC", label: "Registered RIA" },
    ],
    services: [
      { name: "Investment Management", desc: "Personalised portfolio construction and ongoing management aligned to your risk profile and goals.", icon: "📊" },
      { name: "Retirement Planning", desc: "Comprehensive retirement income planning — 401(k), IRA, pension optimisation and distribution strategy.", icon: "🏖️" },
      { name: "Estate Planning", desc: "Coordination with estate attorneys on wills, trusts, beneficiary designations and legacy giving.", icon: "🏛️" },
      { name: "Tax Strategy", desc: "Year-round tax planning, loss harvesting and Roth conversion strategies in coordination with your CPA.", icon: "💰" },
      { name: "Business Owner Services", desc: "Exit planning, business valuation, 401(k) design and executive compensation planning.", icon: "🏢" },
      { name: "Insurance Review", desc: "Comprehensive analysis of life, disability and long-term care coverage needs.", icon: "🛡️" },
    ],
    about: {
      heading: "Independent. Fiduciary. Completely on Your Side.",
      body: "Wealth Advisor is an SEC-registered investment advisory firm serving high-net-worth individuals, families and business owners across the United States. As an independent, fee-only firm, we have no products to sell and no commissions to earn — our only incentive is your financial success. Our advisors hold CFP®, CFA® and other advanced designations, and our planning process is built around understanding your complete financial picture before making a single recommendation.",
      highlights: ["SEC registered, fee-only RIA", "All advisors are CFP® or CFA® certified", "Fiduciary duty 100% of the time", "Minimum $750,000 in investable assets", "Transparent, flat-fee pricing"],
      image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=800&q=80&fit=crop",
    },
    testimonials: [
      { name: "Robert & Helen M.", location: "Greenwich, CT", text: "Switched to Wealth Advisor after 15 years at a wirehouse. The difference in transparency, accountability and performance is night and day.", rating: 5, initials: "RM" },
      { name: "Dr. Jennifer K.", location: "Manhattan", text: "They restructured my entire financial plan before my practice sale. The tax savings alone paid for years of advisory fees.", rating: 5, initials: "JK" },
      { name: "Michael B.", location: "Boston", text: "The retirement planning work gave us total clarity on when we could retire and exactly how much we'd have. Worth every penny.", rating: 5, initials: "MB" },
    ],
    badges: ["SEC Registered", "Fee-Only", "Fiduciary", "$2.8B AUM"],
  },

  // ── BuildRight ────────────────────────────────────────────────────────────────
  "build-right": {
    tagline: "Quality renovation work, on time and on budget",
    phone: "+65 9123 4567",
    email: "quote@buildright.sg",
    address: "18 Boon Lay Way, #04-98 Tradehub 21, Singapore 609966",
    cta: "Get a Free Quote",
    ctaSecondary: "View Our Work",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Projects", href: "#gallery" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#testimonials" },
      { label: "Get Quote", href: "#contact" },
    ],
    stats: [
      { value: "600+", label: "Projects Completed" },
      { value: "15 yr", label: "In Business" },
      { value: "4.9★", label: "HDB Review Score" },
      { value: "3 yr", label: "Workmanship Warranty" },
    ],
    services: [
      { name: "Full Home Renovation", desc: "Complete HDB or condo overhaul — carpentry, tiling, electrical, plumbing and painting. Turnkey delivery.", price: "From $18,000", icon: "🏠", image: "https://images.pexels.com/photos/36035072/pexels-photo-36035072.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Commercial Fitout", desc: "Office, retail, F&B and co-working spaces built to spec. We manage permits.", price: "Request Quote", icon: "🏢", image: "https://images.pexels.com/photos/36035072/pexels-photo-36035072.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Kitchen Remodel", desc: "Custom carpentry, hob, hood and sink installation. Full tiling and waterproofing.", price: "From $6,500", icon: "🍳", image: "https://images.pexels.com/photos/36035072/pexels-photo-36035072.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Bathroom Renovation", desc: "Waterproofing, tiling, sanitary fitting, mirror cabinet and lighting.", price: "From $4,200", icon: "🚿", image: "https://images.pexels.com/photos/36035072/pexels-photo-36035072.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Carpentry & Wardrobes", desc: "Full custom carpentry — platform beds, wardrobes, TV consoles. E0 board standard.", price: "From $1,800", icon: "🪵", image: "https://images.pexels.com/photos/36035072/pexels-photo-36035072.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Hacking & Demolition", desc: "Wall hacking, floor hacking and structural opening works. HDB-approved.", price: "From $800", icon: "⚒️", image: "https://images.pexels.com/photos/36035072/pexels-photo-36035072.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "600+ Projects. Zero Compromises.",
      body: "BuildRight has been transforming homes, offices and commercial spaces across Singapore since 2008. Our team handles every trade in-house — meaning tighter timelines, cleaner finishes and one point of accountability.",
      highlights: ["HDB licensed renovator", "All trades in-house", "3-year workmanship warranty", "Fixed-price contracts", "600+ completed projects"],
      image: "https://images.pexels.com/photos/36035072/pexels-photo-36035072.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Studio / 1-Room", price: "From $12,000", features: ["Up to 45 sqm", "Carpentry & painting", "Tiling & waterproofing", "Electrical & lighting", "3-year warranty"], cta: "Get Quote" },
      { name: "3–4 Room HDB", price: "From $25,000", features: ["90–100 sqm", "Full carpentry suite", "Kitchen & bathrooms", "All trades included", "3D design included", "3-year warranty"], highlight: true, cta: "Get Quote" },
      { name: "5-Room / Condo", price: "From $40,000", features: ["110–130 sqm", "Luxury finishes option", "Smart home wiring", "Full carpentry & tiling", "Project manager assigned", "5-year warranty"], cta: "Get Quote" },
    ],
    team: [
      { name: "Marcus Wong", role: "Founder & Project Director", bio: "15 years in renovation and construction. Personally oversees every project.", initials: "MW", color: "#ea580c" },
      { name: "Ramesh Kumar", role: "Senior Site Manager", bio: "10 years managing renovation sites. Specialist in HDB compliance.", initials: "RK", color: "#c2410c" },
      { name: "Wei Ling Tan", role: "Interior Design Lead", bio: "Trained interior designer. Brings your vision to life with 3D renders.", initials: "WL", color: "#ea580c" },
    ],
    testimonials: [
      { name: "Daryl Tan", location: "Tampines", text: "Full renovation done in 28 days. Carpentry is solid, tiling is perfect. Exceptional team.", rating: 5, initials: "DT" },
      { name: "Priya Nair", location: "Jurong East", text: "Fixed price and they stuck to it. Not a single surprise bill. Kitchen and bathrooms look magazine-worthy.", rating: 5, initials: "PN" },
      { name: "Jason Lim", location: "Tanjong Pagar", text: "Fitted out our cafe in 3 weeks. BCA submissions handled, permits sorted, result looked exactly like the 3D render.", rating: 5, initials: "JL" },
    ],
    faqItems: [
      { q: "How long does a full HDB renovation take?", a: "A 4-room HDB renovation typically takes 4–6 weeks from handover of keys." },
      { q: "Do you handle HDB permit submissions?", a: "Yes. We handle all HDB renovation permit submissions on your behalf." },
      { q: "Do you provide a fixed-price contract?", a: "Always. Our quotations are fully itemised and fixed. No hidden charges." },
      { q: "What warranty do you provide?", a: "3-year workmanship warranty on all renovation works, 5-year on waterproofing." },
    ],
    galleryLabels: ["Living Room Before/After", "Kitchen Renovation", "Bathroom Remodel", "Bedroom Carpentry", "Office Fitout", "Cafe Build"],
    badges: ["HDB Licensed", "Fixed-Price", "3-Year Warranty", "600+ Projects"],
  },

  // ── ColourCraft ───────────────────────────────────────────────────────────────
  "colour-craft": {
    tagline: "Professional painting that lasts",
    phone: "+65 8800 1234",
    email: "hello@colourcraft.sg",
    address: "Serving all areas across Singapore",
    cta: "Get Free Quote",
    ctaSecondary: "See Our Work",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Gallery", href: "#gallery" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "4,200+", label: "Rooms Painted" },
      { value: "98%", label: "On-Time Completion" },
      { value: "4.9★", label: "Google Rating" },
      { value: "14 yr", label: "In Business" },
    ],
    services: [
      { name: "Interior House Painting", desc: "Full interior repaint for HDB, condo or landed — walls, ceilings, doors and trim.", price: "From $380 (3-room)", icon: "🏠", image: "https://images.pexels.com/photos/7218001/pexels-photo-7218001.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Feature Wall Painting", desc: "Accent walls, geometric patterns, ombre effects and decorative finishes.", price: "From $180/wall", icon: "🎨", image: "https://images.pexels.com/photos/5691610/pexels-photo-5691610.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Exterior Painting", desc: "HDB block touch-up, landed exterior and metal gates. Weatherproof paint.", price: "From $800", icon: "🏗️", image: "https://images.pexels.com/photos/6474491/pexels-photo-6474491.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Commercial Repainting", desc: "Office, retail, restaurant repainting. Weekend and after-hours slots.", price: "Request Quote", icon: "🏢", image: "https://images.pexels.com/photos/7218001/pexels-photo-7218001.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Wallpaper Installation", desc: "Supply and install wallpaper, murals and vinyl wall decals.", price: "From $8/sqft", icon: "🖼️", image: "https://images.pexels.com/photos/5691610/pexels-photo-5691610.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Texture & Specialty Finishes", desc: "Sand texture, marble effect, lime wash and decorative wall coatings.", price: "From $12/sqft", icon: "✨", image: "https://images.pexels.com/photos/6474491/pexels-photo-6474491.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "Singapore's Trusted Painting Specialists Since 2010",
      body: "ColourCraft's team of 30 certified painters and decorators serves homeowners and businesses across Singapore using premium Nippon, Dulux and Jotun paints that are low-VOC and safe for families and pets.",
      highlights: ["BizSafe certified", "Low-VOC eco-friendly paints", "Furniture fully protected", "On-time project guarantee", "Free colour consultation"],
      image: "https://images.pexels.com/photos/7218001/pexels-photo-7218001.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "2–3 Room HDB", price: "From $380", features: ["All interior walls & ceilings", "1 primer + 2 finish coats", "Furniture covered & protected", "Nippon / Dulux paint included", "Same-week availability"], cta: "Get Quote" },
      { name: "4–5 Room HDB", price: "From $580", features: ["All rooms including corridors", "Premium low-VOC paint", "Colour consultation included", "Feature wall option", "2-year paint warranty"], highlight: true, cta: "Get Quote" },
      { name: "Condo / Landed", price: "From $900", features: ["Up to 160 sqm", "Multi-brand paint available", "Luxury finish options", "3D colour visualisation", "2-year warranty"], cta: "Get Quote" },
    ],
    team: [
      { name: "Tony Lim", role: "Founder & Head Painter", bio: "14 years of painting mastery.", initials: "TL", color: "#7c3aed" },
      { name: "David Chen", role: "Senior Colour Consultant", bio: "Trained interior designer turned colour specialist.", initials: "DC", color: "#a21caf" },
      { name: "Siti Rahma", role: "Project Coordinator", bio: "Your single point of contact from quote to handover.", initials: "SR", color: "#7c3aed" },
    ],
    testimonials: [
      { name: "Linda Goh", location: "Punggol", text: "Quoted in 24 hours, started next Monday, done in 2 days. My 5-room looks like a showflat.", rating: 5, initials: "LG" },
      { name: "Ravi Sundaram", location: "Raffles Place", text: "Repainted our 3,000 sqft office over a weekend. Arrived Saturday 7am, done Sunday 6pm.", rating: 5, initials: "RS" },
      { name: "Michelle Tan", location: "Interior Designer", text: "I recommend ColourCraft to all my clients. Colour mixing accuracy and finish quality is the best in Singapore.", rating: 5, initials: "MT" },
    ],
    faqItems: [
      { q: "How long does it take to paint a 4-room HDB?", a: "Typically 1–2 days. We send the right number of painters for your unit size." },
      { q: "Do I need to move my furniture?", a: "No. Our team covers all furniture and flooring with protective sheets before starting." },
      { q: "Can I choose my own colours?", a: "Absolutely. We can match any colour from Nippon, Dulux, Jotun or your own chips." },
    ],
    galleryLabels: ["Living Room Transformation", "Bedroom Feature Wall", "Kitchen Repaint", "Open Plan Living", "Office Repaint", "Exterior Facade"],
    badges: ["BizSafe Certified", "Free Consultation", "2-Year Warranty", "4.9★ Google"],
  },

  // ── PestShield ────────────────────────────────────────────────────────────────
  "pest-shield": {
    tagline: "Protecting homes and businesses from pests since 2009",
    phone: "+65 6712 3456",
    email: "book@pestshield.sg",
    address: "12 Mandai Estate, #03-20, Singapore 729908",
    cta: "Book a Treatment",
    ctaSecondary: "Get Free Inspection",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Contracts", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#testimonials" },
      { label: "Book Now", href: "#contact" },
    ],
    stats: [
      { value: "5,000+", label: "Properties Treated" },
      { value: "15 yr", label: "In Business" },
      { value: "100%", label: "NEA Compliant" },
      { value: "4.8★", label: "Google Rating" },
    ],
    services: [
      { name: "General Pest Control", desc: "Treatment for cockroaches, ants, flies and common household insects.", price: "From $80/treatment", icon: "🐛", image: "https://images.pexels.com/photos/4176541/pexels-photo-4176541.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Termite Treatment", desc: "Soil treatment, baiting systems and structural pre-treatment. 5-year warranty.", price: "From $350", icon: "🪲", image: "https://images.pexels.com/photos/32055757/pexels-photo-32055757.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Rodent Control", desc: "Rat and mouse elimination using tamper-resistant bait stations. Monthly monitoring.", price: "From $180", icon: "🐀", image: "https://images.pexels.com/photos/4176541/pexels-photo-4176541.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Bed Bug Treatment", desc: "Heat treatment and chemical residual treatment. 3-month warranty.", price: "From $280", icon: "🛏️", image: "https://images.pexels.com/photos/32055757/pexels-photo-32055757.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Mosquito Control & Fogging", desc: "ULV thermal fogging, larviciding and misting systems.", price: "From $120", icon: "🦟", image: "https://images.pexels.com/photos/4176541/pexels-photo-4176541.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Commercial Contracts", desc: "NEA-compliant annual pest management for F&B, hospitality and healthcare.", price: "From $800/year", icon: "🏢", image: "https://images.pexels.com/photos/32055757/pexels-photo-32055757.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "NEA-Licensed. Eco-Certified. Trusted by 5,000+ Clients.",
      body: "PestShield has been protecting Singapore homes and commercial premises since 2009 using Integrated Pest Management methods — safe and effective solutions that eliminate pests at the source.",
      highlights: ["NEA licensed", "ISO 9001:2015 certified", "Eco-certified treatments", "Annual contracts available", "24/7 emergency callout"],
      image: "https://images.pexels.com/photos/32055757/pexels-photo-32055757.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "One-Time Treatment", price: "From $80", features: ["One pest type targeted", "Licensed technician", "Report & recommendations", "Follow-up advice", "30-day guarantee"], cta: "Book Now" },
      { name: "Quarterly Contract", price: "From $280/year", features: ["4 scheduled visits/year", "All common pests covered", "Between-visit callouts free", "NEA-compliant reporting", "Priority scheduling"], highlight: true, cta: "Get Contract Quote" },
      { name: "Commercial Annual", price: "Custom", features: ["Unlimited treatments", "Monthly monitoring", "Emergency same-day callout", "Full NEA compliance docs", "Dedicated account manager"], cta: "Discuss Contract" },
    ],
    team: [
      { name: "Alvin Koh", role: "Chief Pest Control Technician", bio: "NEA licensed with 15 years in the field.", initials: "AK", color: "#15803d" },
      { name: "Hafiz Rahman", role: "Field Supervisor", bio: "Specialist in commercial accounts and heat treatment.", initials: "HR", color: "#166534" },
      { name: "Grace Yeo", role: "Operations Manager", bio: "Ensures every client receives a follow-up report within 24 hours.", initials: "GY", color: "#15803d" },
    ],
    testimonials: [
      { name: "Kevin Ong", location: "Clementi", text: "PestShield on annual contract for 4 years. Zero pest incidents, zero NEA warnings. Consistently pass inspections.", rating: 5, initials: "KO" },
      { name: "Mrs. Lim", location: "Bishan", text: "Serious cockroach problem three other companies couldn't fix. PestShield did one treatment — haven't seen one since.", rating: 5, initials: "ML" },
      { name: "Jason Park", location: "Marina Bay", text: "Manage 8 commercial units. PestShield handles all on one contract. Professional, thorough reports.", rating: 5, initials: "JP" },
    ],
    faqItems: [
      { q: "Are your treatments safe for children and pets?", a: "Yes. We use EPA and NEA-approved formulations. Re-entry times are typically 1–4 hours." },
      { q: "Do I need to vacate during treatment?", a: "Most general pest treatments: 1–2 hours. Bed bug heat treatment: 4–6 hours." },
      { q: "How quickly can you respond?", a: "Same-day bookings for urgent cases. Standard residential within 24 hours." },
      { q: "Do you provide NEA-compliant service reports?", a: "Yes. Every treatment includes a fully documented service report." },
    ],
    galleryLabels: ["Residential Treatment", "Kitchen Inspection", "Technician at Work", "Commercial Contract", "Termite Bait Station", "Fogging Operation"],
    badges: ["NEA Licensed", "ISO 9001", "Eco-Certified", "24/7 Emergency"],
  },

  // ── UniformPro ────────────────────────────────────────────────────────────────
  "uniform-pro": {
    tagline: "Professional uniforms manufactured to your exact specification",
    phone: "+880 1712 345678",
    email: "orders@uniformpro.com.bd",
    address: "Plot 24, BSCIC Industrial Estate, Tongi, Gazipur, Bangladesh",
    cta: "Request a Quote",
    ctaSecondary: "View Catalogue",
    navLinks: [
      { label: "Products", href: "#services" },
      { label: "Gallery", href: "#gallery" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Order Now", href: "#contact" },
    ],
    stats: [
      { value: "2M+", label: "Garments Produced" },
      { value: "25+", label: "Export Countries" },
      { value: "18 yr", label: "In Business" },
      { value: "300", label: "Skilled Staff" },
    ],
    services: [
      { name: "Corporate Uniforms", desc: "Polo shirts, formal shirts, trousers and blazers with your logo. MOQ 20 pcs.", price: "From $8/piece", icon: "👔", image: "https://images.pexels.com/photos/31031119/pexels-photo-31031119.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "F&B & Hospitality Wear", desc: "Chef coats, aprons, server uniforms. Stain-resistant and easy-care fabrics.", price: "From $6/piece", icon: "🧑‍🍳", image: "https://images.pexels.com/photos/31091548/pexels-photo-31091548.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Healthcare & Medical", desc: "Scrubs, lab coats, nursing uniforms. Anti-microbial fabric options available.", price: "From $10/piece", icon: "🏥", image: "https://images.pexels.com/photos/31031119/pexels-photo-31031119.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Industrial Workwear", desc: "High-visibility vests, coveralls and PPE-compliant workwear.", price: "From $12/piece", icon: "🦺", image: "https://images.pexels.com/photos/31091548/pexels-photo-31091548.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "School & Sports Uniforms", desc: "School uniforms, PE kits, team jerseys and sports apparel.", price: "From $5/piece", icon: "🎒", image: "https://images.pexels.com/photos/31031119/pexels-photo-31031119.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Embroidery & Printing", desc: "Logo embroidery, screen printing, heat transfer and sublimation.", price: "From $2/piece", icon: "🪡", image: "https://images.pexels.com/photos/31091548/pexels-photo-31091548.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "18 Years of Uniform Manufacturing Excellence",
      body: "UniformPro is a Bangladesh-based garment manufacturer with our own 40,000 sqft factory and 300 skilled machinists. We deliver high-quality uniforms at factory-direct prices to clients across Southeast Asia, the Middle East and beyond.",
      highlights: ["Own 40,000 sqft factory", "300 skilled machinists", "In-house embroidery & printing", "GOTS-certified fabrics available", "Export to 25+ countries"],
      image: "https://images.pexels.com/photos/31031119/pexels-photo-31031119.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Sample Order", price: "From $25/piece", features: ["Minimum 1 piece", "Any garment type", "Full customisation", "7–10 day turnaround", "Quality guaranteed"], cta: "Order Sample" },
      { name: "Standard Bulk", price: "From $8/piece", features: ["50–499 pieces", "Logo embroidery included", "4 colour options", "21-day production", "Free shipping on 200+"], highlight: true, cta: "Get Quote" },
      { name: "Large Volume", price: "From $5/piece", features: ["500+ pieces", "Priority production", "Full custom design", "Multiple delivery batches", "Dedicated account manager"], cta: "Request Quote" },
    ],
    team: [
      { name: "Mohammad Karim", role: "Managing Director", bio: "18 years building UniformPro from 5 to 300 staff.", initials: "MK", color: "#1e3a5f" },
      { name: "Rashida Begum", role: "Head of Design & Sampling", bio: "Converts client briefs into tech packs within 48 hours.", initials: "RB", color: "#c9a84c" },
      { name: "Akbar Hossain", role: "Production Manager", bio: "ISO-certified process management across all production lines.", initials: "AH", color: "#1e3a5f" },
    ],
    testimonials: [
      { name: "Raj Menon", location: "Marriott Hotels, SG", text: "2,000 pieces per quarter. Consistent quality, on-time delivery. Our exclusive uniform supplier.", rating: 5, initials: "RM" },
      { name: "Ahmed Al-Rashid", location: "Al Baik Group, KSA", text: "Supplied uniforms for 45 restaurant locations. Quality excellent, logo embroidery flawless.", rating: 5, initials: "AA" },
      { name: "Lim Wei Jie", location: "SIA Catering", text: "Strict quality standards met every order. Fast turnaround, responsive team.", rating: 5, initials: "LW" },
    ],
    faqItems: [
      { q: "What is the minimum order quantity?", a: "MOQ is 10 pieces per style/colour. For embroidery: 20 pieces per logo placement." },
      { q: "How long does production take?", a: "Standard: 21–28 days. Rush (500+): 14 days. Samples: 7–10 days." },
      { q: "Do you provide samples before bulk orders?", a: "Yes. Sample fee credited against bulk order if you proceed." },
      { q: "What countries do you ship to?", a: "Worldwide via DHL, FedEx and sea freight. Strong presence in Singapore, UAE, Saudi Arabia and Australia." },
    ],
    galleryLabels: ["Corporate Polo Range", "Restaurant Team Wear", "Medical Scrubs", "Logo Embroidery Detail", "Industrial Hi-Vis", "Factory Floor"],
    badges: ["Factory Direct", "MOQ 10 Pieces", "25+ Countries", "18 Years"],
  },

  // ── GlassLine ─────────────────────────────────────────────────────────────────
  "glass-line": {
    tagline: "Precision fabrication. Professional installation.",
    phone: "+65 9234 5678",
    email: "quote@glassline.sg",
    address: "25 Defu Lane 10, Singapore 539214",
    cta: "Get a Free Quote",
    ctaSecondary: "View Projects",
    navLinks: [
      { label: "Products", href: "#services" },
      { label: "Projects", href: "#gallery" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#testimonials" },
      { label: "Get Quote", href: "#contact" },
    ],
    stats: [
      { value: "1,200+", label: "Projects Completed" },
      { value: "12 yr", label: "In Business" },
      { value: "25+", label: "Skilled Installers" },
      { value: "4.8★", label: "Client Rating" },
    ],
    services: [
      { name: "Glass Partitions", desc: "Frameless, semi-frameless and framed glass partition systems. Any glass type.", price: "From $80/sqft", icon: "🪟", image: "https://images.pexels.com/photos/5483051/pexels-photo-5483051.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Aluminium Windows & Doors", desc: "Casement, sliding, awning and bi-fold aluminium windows and doors.", price: "From $120/panel", icon: "🚪", image: "https://images.pexels.com/photos/1098982/pexels-photo-1098982.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Roller Shutters", desc: "Manual and motorised aluminium roller shutters for shops, warehouses and garages.", price: "From $800/opening", icon: "🏭", image: "https://images.pexels.com/photos/5483051/pexels-photo-5483051.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Frameless Glass Doors", desc: "Tempered and laminated frameless glass doors with floor spring or pivot fitting.", price: "From $600/door", icon: "🔲", image: "https://images.pexels.com/photos/1098982/pexels-photo-1098982.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Curtain Wall Systems", desc: "Unitised and stick-built aluminium curtain wall for commercial developments.", price: "Request Quote", icon: "🏙️", image: "https://images.pexels.com/photos/5483051/pexels-photo-5483051.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Glass Balustrades", desc: "Tempered glass balustrades for staircases, balconies and pool surrounds.", price: "From $150/lm", icon: "🪜", image: "https://images.pexels.com/photos/1098982/pexels-photo-1098982.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "12 Years of Precision Glass & Aluminium Fabrication",
      body: "GlassLine is a Singapore-based glass and aluminium specialist with our own fabrication workshop and 25 skilled installers, working across residential, commercial and industrial sectors.",
      highlights: ["BCA registered contractor", "Own fabrication workshop", "SS 212 and BCA compliant", "1-year installation warranty", "Same-week survey & quotation"],
      image: "https://images.pexels.com/photos/5483051/pexels-photo-5483051.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Residential", price: "From $80/sqft", features: ["All glass types", "Standard aluminium profiles", "1-year warranty", "Free site survey", "Same-week start"], cta: "Get Quote" },
      { name: "Commercial", price: "From $65/sqft", features: ["Volume pricing", "Project manager assigned", "BCA-compliant docs", "Night/weekend installation", "2-year warranty"], highlight: true, cta: "Get Quote" },
      { name: "Industrial / Developer", price: "Request Quote", features: ["Full curtain wall systems", "Specialist engineering", "Sub-contractor capability", "Multi-phase delivery", "Performance bond"], cta: "Discuss Project" },
    ],
    team: [
      { name: "Andy Koh", role: "Managing Director", bio: "12 years in glass and aluminium. Reviews every technical drawing before production.", initials: "AK", color: "#0f172a" },
      { name: "Dennis Tan", role: "Project Engineer", bio: "Handles BCA submissions, curtain wall engineering and commercial tenders.", initials: "DT", color: "#475569" },
      { name: "Amar Singh", role: "Fabrication Workshop Head", bio: "20 years fabricating glass and aluminium to precision tolerances.", initials: "AS", color: "#0f172a" },
    ],
    testimonials: [
      { name: "Tan Boon Kiat", location: "Ascendas REIT", text: "Office partition works across three floors. Fabrication quality excellent, installation fast and clean.", rating: 5, initials: "TBK" },
      { name: "Siva Kumar", location: "Interior Designer", text: "My go-to glazing contractor for all client projects. Quality consistently good, pricing fair.", rating: 5, initials: "SK" },
      { name: "Raymond Foo", location: "Dempsey Hill", text: "Aluminium shopfront and roller shutter installed in one day. Motorised shutter is silent.", rating: 5, initials: "RF" },
    ],
    faqItems: [
      { q: "How quickly can you provide a quotation?", a: "Site survey within 2–3 days. Written quote within 24 hours of survey." },
      { q: "What glass types do you supply?", a: "Clear, tinted, frosted, tempered, laminated, IGU and smart glass. All SS 212 certified." },
      { q: "Do you handle HDB and condo approval submissions?", a: "Yes. We manage HDB renovation permit submissions and MCST liaison." },
      { q: "What warranty do you provide?", a: "1-year workmanship warranty on all installation. Glass manufacturer warranties passed through." },
    ],
    galleryLabels: ["Glass Facade", "Frameless Glass Door", "Retail Shopfront", "Office Partition", "Roller Shutter", "Aluminium Windows"],
    badges: ["BCA Registered", "Own Workshop", "1-Year Warranty", "1,200+ Projects"],
  },

  // ── Batch 2 ──────────────────────────────────────────────────────────────────

  "cool-breeze": {
    tagline: "Your comfort is our priority",
    phone: "+65 6789 0123",
    email: "service@coolbreeze.sg",
    address: "45 Ubi Avenue 1, #05-12 Ubi Tech Park, Singapore 408935",
    cta: "Book a Service",
    ctaSecondary: "View Packages",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Packages", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#testimonials" },
      { label: "Book Now", href: "#contact" },
    ],
    stats: [
      { value: "8,000+", label: "Units Installed" },
      { value: "17 yr", label: "In Business" },
      { value: "2 hr", label: "Emergency Response" },
      { value: "4.9★", label: "Google Rating" },
    ],
    services: [
      { name: "AC Installation", desc: "Split, multi-split and cassette systems. Daikin, Mitsubishi, Panasonic authorised installer.", price: "From $480/unit", icon: "❄️", image: "https://images.pexels.com/photos/6471911/pexels-photo-6471911.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "AC Servicing", desc: "General servicing, filter cleaning, gas top-up and leak checks. Quarterly contracts available.", price: "From $40/unit", icon: "🔧", image: "https://images.pexels.com/photos/5463587/pexels-photo-5463587.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Chemical Wash", desc: "Deep chemical cleaning to remove mould, bacteria and buildup. Restores cooling efficiency.", price: "From $80/unit", icon: "🧪", image: "https://images.pexels.com/photos/5463576/pexels-photo-5463576.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Ducted Central HVAC", desc: "Design, supply and installation of central ducted systems for offices, retail and hotels.", price: "Request Quote", icon: "🏢", image: "https://images.pexels.com/photos/6471913/pexels-photo-6471913.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Emergency Repair", desc: "24/7 emergency AC repair for all brands. Most faults resolved on first visit.", price: "From $120", icon: "🚨", image: "https://images.pexels.com/photos/5463587/pexels-photo-5463587.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Annual Maintenance Contract", desc: "Quarterly servicing, priority emergency response, free parts and one chemical wash per year.", price: "From $180/unit/yr", icon: "📋", image: "https://images.pexels.com/photos/6471911/pexels-photo-6471911.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "8,000+ Installations. Certified. Trusted.",
      body: "CoolBreeze has been Singapore's trusted AC and HVAC partner since 2007. Our BCA-certified technicians handle everything from residential split units to full central ducted systems for commercial buildings. 200+ corporate maintenance contracts. 2-hour emergency response, day or night.",
      highlights: ["BCA & SPRING certified technicians", "Authorised Daikin, Mitsubishi, Panasonic installer", "2-hour emergency response guarantee", "200+ corporate maintenance contracts", "Energy audit & optimisation service"],
      image: "https://images.pexels.com/photos/5463587/pexels-photo-5463587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Basic Service", price: "From $40/unit", features: ["Filter & coil cleaning", "Drainage check", "Gas pressure check", "Performance test", "Service report"], cta: "Book Now" },
      { name: "Annual Contract", price: "From $180/unit/yr", features: ["4 quarterly services", "Priority emergency callout", "1 chemical wash/year", "Free minor parts", "Maintenance reports"], highlight: true, cta: "Get Contract" },
      { name: "Commercial Package", price: "Custom Quote", features: ["Tailored service schedule", "Dedicated account manager", "Same-day emergency response", "Energy efficiency reporting", "Multi-unit discounts"], cta: "Request Quote" },
    ],
    team: [
      { name: "Eddie Tan", role: "Head of Installations", bio: "BCA-certified engineer, 14 years installing residential and commercial HVAC.", initials: "ET", color: "#0284c7" },
      { name: "Suresh Nair", role: "Senior Service Technician", bio: "Authorised Daikin and Mitsubishi technician. Expert in fault diagnosis.", initials: "SN", color: "#1e3a5f" },
      { name: "Lisa Chen", role: "Service Manager", bio: "Coordinates bookings and emergency callouts. Every client gets a service report within 24 hours.", initials: "LC", color: "#0284c7" },
    ],
    testimonials: [
      { name: "Ravi Chandran", location: "Tanjong Pagar", text: "12 cassette units installed across our restaurant. Zero downtime in 3 years on their maintenance contract.", rating: 5, initials: "RC" },
      { name: "Ahmad Al-Rashid", location: "Marina Bay", text: "CoolBreeze holds our 15-storey HVAC maintenance contract. Their 2-hour emergency response has saved us many times.", rating: 5, initials: "AA" },
      { name: "Mrs. Lee", location: "Bukit Timah", text: "Three units installed — spotless work, neat piping, completely transparent quotes.", rating: 5, initials: "ML" },
    ],
    faqItems: [
      { q: "How often should I service my aircon?", a: "Every 3 months for residential units used daily. Commercial high-use units may need monthly maintenance." },
      { q: "What brands do you service?", a: "All major brands: Daikin, Mitsubishi, Panasonic, LG, Samsung, Midea, Carrier, Fujitsu." },
      { q: "Do you offer 24/7 emergency repair?", a: "Yes. 2-hour response for contract holders, 4-hour target for non-contract emergency calls." },
      { q: "What is a chemical wash?", a: "Deep cleaning with specialised cleaners to remove mould, bacteria and mineral deposits from the evaporator coil. Recommended once yearly." },
    ],
    galleryLabels: ["Split Unit Install", "Cassette System", "Ducted Office", "Chemical Wash", "Commercial HVAC", "Maintenance Visit"],
    badges: ["BCA Certified", "Daikin Authorised", "24/7 Emergency", "8,000+ Units"],
  },

  "sparky-pro": {
    tagline: "Certified trades. Every job guaranteed.",
    phone: "+65 9000 1234",
    email: "jobs@sparkypro.sg",
    address: "Serving all areas across Singapore",
    cta: "Call Now",
    ctaSecondary: "Get a Quote",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#testimonials" },
      { label: "Call Now", href: "#contact" },
    ],
    stats: [
      { value: "10,000+", label: "Jobs Completed" },
      { value: "12 yr", label: "In Business" },
      { value: "60 min", label: "Emergency Response" },
      { value: "4.9★", label: "Google Rating" },
    ],
    services: [
      { name: "Electrical Wiring & Rewiring", desc: "New wiring and full rewiring to SS 638 standards. Certified by our Licensed Electrical Worker.", price: "From $150", icon: "⚡", image: "https://images.pexels.com/photos/9679179/pexels-photo-9679179.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "DB Box Upgrade", desc: "Replace old fuse boards with modern MCB distribution boards with earth leakage protection.", price: "From $380", icon: "🔌", image: "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Lighting Installation", desc: "LED downlights, track lighting, pendant and smart lighting. Residential and commercial.", price: "From $25/point", icon: "💡", image: "https://images.pexels.com/photos/21812143/pexels-photo-21812143.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Plumbing Repair", desc: "Tap, toilet, sink, shower and water heater repairs and new installations.", price: "From $80", icon: "🔩", image: "https://images.pexels.com/photos/9679179/pexels-photo-9679179.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Pipe Replacement", desc: "Replace ageing galvanised pipes with modern PEX or CPVC. Reduce leaks and pressure loss.", price: "From $200", icon: "🪛", image: "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Commercial Works", desc: "Complete electrical and M&E services for offices, retail, F&B and industrial units.", price: "Request Quote", icon: "🏭", image: "https://images.pexels.com/photos/21812143/pexels-photo-21812143.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "Licensed. Insured. 10,000+ Jobs Done.",
      body: "SparkyPro brings together Singapore's most experienced licensed electricians and plumbers. EMA-licensed and PUB-certified tradespeople delivering safe, code-compliant work — from a tripped breaker at midnight to a full commercial rewire. 60-minute emergency response. 12-month workmanship guarantee.",
      highlights: ["EMA Licensed Electrical Worker (LEW)", "PUB licensed plumbing contractor", "60-minute emergency response", "BCA and SS wiring standards compliant", "12-month workmanship guarantee"],
      image: "https://images.pexels.com/photos/9679179/pexels-photo-9679179.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Residential", price: "From $80/job", features: ["All common repairs", "Licensed tradesperson", "Transparent pricing", "Same-day available", "12-month warranty"], cta: "Book Now" },
      { name: "Renovation Works", price: "From $150", features: ["Full new installations", "EMA/PUB certified work", "BCA-compliant drawings", "Test & inspection cert", "1-year guarantee"], highlight: true, cta: "Get Quote" },
      { name: "Commercial Contract", price: "Custom Quote", features: ["Scheduled maintenance", "Priority callout", "Dedicated account manager", "Compliance documentation", "Multi-unit discounts"], cta: "Enquire Now" },
    ],
    team: [
      { name: "Ben Lim", role: "Master Electrician (LEW)", bio: "EMA Licensed Electrical Worker, 16 years in residential, commercial and industrial works.", initials: "BL", color: "#ca8a04" },
      { name: "Hafiz Osman", role: "Lead Plumber", bio: "PUB licensed, specialises in bathroom renovations and drainage system upgrades.", initials: "HO", color: "#1c1917" },
      { name: "Raymond Goh", role: "Operations Manager", bio: "Coordinates emergency callouts and scheduled jobs. Every technician arrives on time.", initials: "RG", color: "#ca8a04" },
    ],
    testimonials: [
      { name: "David Koh", location: "Jurong West", text: "Tripped breaker at 11pm. SparkyPro at my door in 45 minutes. Fixed and certified within an hour.", rating: 5, initials: "DK" },
      { name: "Rashid Al-Farsi", location: "Bugis", text: "Full electrical rewire and LED upgrade for my 3,000 sqft shop. Done over a weekend, zero Monday disruption.", rating: 5, initials: "RA" },
      { name: "Mrs. Tan", location: "Serangoon", text: "Burst pipe on Sunday morning. SparkyPro came within the hour and fixed everything, even patched the wall.", rating: 5, initials: "MT" },
    ],
    faqItems: [
      { q: "Are your electricians EMA licensed?", a: "Yes. All electrical works performed or supervised by EMA-licensed Electrical Workers. We issue a Certificate of Electrical Installation after every new installation." },
      { q: "How quickly can you respond to emergencies?", a: "60-minute response target 24/7. Our technicians are on standby and carry common parts for immediate repair." },
      { q: "Do you handle HDB electrical works?", a: "Yes. Experienced with HDB renovation permit requirements and MCST coordination for condo projects." },
      { q: "What warranty do you provide?", a: "12-month workmanship warranty. Any fault from our workmanship is rectified at no charge." },
    ],
    galleryLabels: ["Wiring Project", "Distribution Board", "LED Lighting", "Plumbing Upgrade", "Pipe Replacement", "Commercial Works"],
    badges: ["EMA Licensed", "PUB Certified", "24/7 Emergency", "10,000+ Jobs"],
  },

  "fresh-wash": {
    tagline: "Clean clothes delivered to your door",
    phone: "+65 8123 4567",
    email: "hello@freshwash.sg",
    address: "Serving all areas across Singapore",
    cta: "Schedule Pickup",
    ctaSecondary: "View Prices",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#testimonials" },
      { label: "Schedule Pickup", href: "#contact" },
    ],
    stats: [
      { value: "30,000+", label: "Happy Customers" },
      { value: "10 yr", label: "In Business" },
      { value: "24 hr", label: "Standard Turnaround" },
      { value: "4.8★", label: "Google Rating" },
    ],
    services: [
      { name: "Wash & Fold", desc: "Machine wash, tumble dry and neatly folded. Eco-friendly detergent. Sorted by colour and fabric.", price: "From $1.80/kg", icon: "👕", image: "https://images.pexels.com/photos/8774650/pexels-photo-8774650.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Dry Cleaning", desc: "Specialist solvent cleaning for suits, dresses, delicates, leather and formal wear.", price: "From $8/item", icon: "🥼", image: "https://images.pexels.com/photos/8774451/pexels-photo-8774451.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Ironing & Pressing", desc: "Professional steam ironing for shirts, pants, dresses and uniforms.", price: "From $1.50/item", icon: "👔", image: "https://images.pexels.com/photos/8774451/pexels-photo-8774451.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Sneaker Cleaning", desc: "Deep clean, deodorising and re-whitening for all sneaker types. Sole restoration included.", price: "From $18/pair", icon: "👟", image: "https://images.pexels.com/photos/8774650/pexels-photo-8774650.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Curtain & Linen Cleaning", desc: "Full curtain cleaning, duvets, pillows and all bed linen accepted.", price: "From $12/panel", icon: "🛏️", image: "https://images.pexels.com/photos/8774451/pexels-photo-8774451.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Express Service", desc: "12-hour turnaround for urgent items. Available 7 days. Priority cleaning and delivery.", price: "+50% on standard rate", icon: "⚡", image: "https://images.pexels.com/photos/8774650/pexels-photo-8774650.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "30,000+ Satisfied Customers. Trusted Since 2014.",
      body: "FreshWash is Singapore's most convenient laundry and dry cleaning service. We collect, clean with professional-grade machines and premium detergents, and deliver fresh and folded to your door within 24–48 hours. Specialist dry cleaning for delicates, suits, curtains and wedding gowns.",
      highlights: ["Free pickup & delivery with every order", "24–48 hour standard turnaround", "Express 12-hour service available", "Eco-friendly, skin-safe detergents", "Specialist dry cleaning for delicates"],
      image: "https://images.pexels.com/photos/8774451/pexels-photo-8774451.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Pay As You Go", price: "From $1.80/kg", features: ["Wash & fold by weight", "Dry cleaning per item", "Free pickup & delivery", "48-hour turnaround", "No minimum order"], cta: "Schedule Pickup" },
      { name: "Monthly Plan", price: "From $49/month", features: ["20kg wash & fold included", "2 free dry cleaning items", "Priority scheduling", "Dedicated account manager", "10% off express service"], highlight: true, cta: "Subscribe Now" },
      { name: "Business Account", price: "Custom Quote", features: ["High-volume processing", "Fixed weekly collections", "Priority turnaround", "Itemised billing", "Account manager & reporting"], cta: "Get Business Quote" },
    ],
    team: [
      { name: "Tracy Lim", role: "Head of Operations", bio: "10 years in commercial laundry. Runs our facility team of 20, ensures quality before every dispatch.", initials: "TL", color: "#0d9488" },
      { name: "Amy Tan", role: "Customer Service Manager", bio: "Handles client enquiries and ensures every pickup and delivery runs to schedule.", initials: "AT", color: "#06b6d4" },
      { name: "Daniel Wong", role: "Delivery Operations", bio: "Manages our fleet of 8 delivery riders. Every order arrives on time in pristine condition.", initials: "DW", color: "#0d9488" },
    ],
    testimonials: [
      { name: "Chloe Ng", location: "CBD", text: "Schedule a pickup every two weeks. Collected Sunday, delivered Monday evening — perfectly folded. Makes my week easier.", rating: 5, initials: "CN" },
      { name: "Mr. Krishnamurthy", location: "Sentosa", text: "FreshWash handles all our hotel table linen and staff uniforms. Consistent quality, reliable schedule.", rating: 5, initials: "MK" },
      { name: "Sofia Chen", location: "Clementi", text: "Wedding gown and three suits dry cleaned — returned in perfect condition. Will only use FreshWash from now on.", rating: 5, initials: "SC" },
    ],
    faqItems: [
      { q: "How does pickup and delivery work?", a: "Schedule via website or WhatsApp. We collect in our bag, clean at our facility, deliver within 24–48 hours. No extra charge." },
      { q: "What items can you dry clean?", a: "Suits, dresses, sarees, leather, formal wear, silk, wool, cashmere, wedding gowns, curtains and household textiles." },
      { q: "Do you offer express same-day service?", a: "Yes. 12-hour express service 7 days/week, +50% on standard rate. Collect before 10am for delivery by 10pm." },
      { q: "What if an item is damaged?", a: "We carry full insurance and compensate based on item value. Our team contacts you immediately if there's any concern." },
    ],
    galleryLabels: ["Laundry Facility", "Dry Cleaning", "Sneaker Cleaning", "Express Delivery", "Curtain Cleaning", "Wash & Fold"],
    badges: ["Free Pickup", "24hr Turnaround", "30,000+ Customers", "Express Available"],
  },

  "curtain-studio": {
    tagline: "Beautifully dressed windows since 2008",
    phone: "+65 8800 9988",
    email: "hello@curtainstudio.sg",
    address: "12 Joo Chiat Road, #01-04, Singapore 427348",
    cta: "Book Free Consultation",
    ctaSecondary: "Browse Collection",
    navLinks: [
      { label: "Products", href: "#services" },
      { label: "Gallery", href: "#gallery" },
      { label: "About", href: "#about" },
      { label: "Pricing", href: "#pricing" },
      { label: "Book Consultation", href: "#contact" },
    ],
    stats: [
      { value: "5,000+", label: "Projects Completed" },
      { value: "16 yr", label: "In Business" },
      { value: "2,000+", label: "Fabric Choices" },
      { value: "4.9★", label: "Client Rating" },
    ],
    services: [
      { name: "Curtains & Drapes", desc: "Eyelet, pinch pleat, wave and tab-top curtains in sheer, semi-sheer and blackout fabrics.", price: "From $80/panel", icon: "🪟", image: "https://images.pexels.com/photos/462197/pexels-photo-462197.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Roman & Roller Blinds", desc: "Clean, contemporary blinds in hundreds of fabrics — daylight, blackout, moisture-resistant options.", price: "From $120/window", icon: "🔲", image: "https://images.pexels.com/photos/16912480/pexels-photo-16912480.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Motorised & Smart Blinds", desc: "App-controlled, voice-activated or scene-triggered blinds. Google Home, Alexa and KNX compatible.", price: "From $280/window", icon: "📱", image: "https://images.pexels.com/photos/462197/pexels-photo-462197.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Commercial & Hospitality", desc: "High-volume supply and installation for hotels, offices and serviced apartments. Contract pricing.", price: "Request Quote", icon: "🏨", image: "https://images.pexels.com/photos/16912480/pexels-photo-16912480.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Carpets & Rugs", desc: "Broadloom carpets, carpet tiles and handmade rugs in custom sizes and colours.", price: "From $5/sqft", icon: "🪵", image: "https://images.pexels.com/photos/462197/pexels-photo-462197.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Upholstery", desc: "Sofa reupholstery, cushion covers, headboards and custom fabric accessories.", price: "From $150/piece", icon: "🛋️", image: "https://images.pexels.com/photos/16912480/pexels-photo-16912480.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "5,000+ Homes & Offices Transformed",
      body: "CurtainStudio has created bespoke window treatments and soft furnishings for Singapore homes, offices and hospitality spaces since 2008. Over 2,000 exclusive fabrics sourced from Europe, Japan and Korea. Custom-made at our local workshop, installed by professional fitters.",
      highlights: ["2,000+ exclusive fabric selections", "Own workshop — all custom made locally", "Free home measuring & colour consultation", "5,000+ residential & commercial projects", "Motorised and smart blind systems available"],
      image: "https://images.pexels.com/photos/462197/pexels-photo-462197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Residential", price: "From $80/panel", features: ["Free home measuring", "2,000+ fabric choices", "Custom made locally", "Professional installation", "1-year warranty"], cta: "Book Consultation" },
      { name: "Smart Home Package", price: "From $280/window", features: ["Motorised roller/roman blinds", "App & voice control", "Scene programming", "Smart home integration", "5-year motor warranty"], highlight: true, cta: "Get Quote" },
      { name: "Commercial", price: "Custom Quote", features: ["Volume pricing", "Project manager", "Phased installation", "Commercial-grade fabrics", "Dedicated account manager"], cta: "Request Quote" },
    ],
    team: [
      { name: "Vanessa Ong", role: "Senior Interior Consultant", bio: "16 years in soft furnishings and interior styling. Over 1,000 homes and hospitality projects.", initials: "VO", color: "#b45309" },
      { name: "Mei Lin", role: "Fabric & Design Specialist", bio: "Trained in textile design in Japan. Curates our fabric collection and advises on colour.", initials: "ML", color: "#44403c" },
      { name: "Shirley Ho", role: "Head of Installation", bio: "Leads our team of 8 professional fitters. Every installation precise, clean and to spec.", initials: "SH", color: "#b45309" },
    ],
    testimonials: [
      { name: "Grace Koh", location: "Holland Village", text: "Dressed 14 windows in my new condo. Consultant advised on every room — the result is magazine-worthy. Motorised blinds are a dream.", rating: 5, initials: "GK" },
      { name: "James Tan", location: "Interior Designer", text: "CurtainStudio is my go-to for every client project. Fabric range, quality and installation consistency unmatched.", rating: 5, initials: "JT" },
      { name: "Ahmad Raza", location: "Sentosa Cove Hotel", text: "80 hotel rooms with motorised blackout blinds. Perfectly programmed, looks premium, installation team immaculate.", rating: 5, initials: "AR" },
    ],
    faqItems: [
      { q: "Is the home measuring service free?", a: "Yes, completely free with no obligation. Consultant visits, takes measurements, advises on fabrics and provides a written quotation." },
      { q: "How long from order to installation?", a: "Standard lead time is 10–14 working days. Express orders (7 working days) available depending on fabric availability." },
      { q: "Do you do motorised blinds?", a: "Yes. Full range of motorised roller, roman and venetian blinds with remote, smartphone app, voice control and KNX integration." },
      { q: "Can you clean existing curtains?", a: "Yes. We offer repair, alteration and relining for curtains purchased elsewhere. Bring to our showroom for assessment." },
    ],
    galleryLabels: ["Living Room Curtains", "Bedroom Drapes", "Office Blinds", "Hotel Curtaining", "Show Flat Styling", "Dining Room"],
    badges: ["Free Consultation", "2,000+ Fabrics", "Custom Made", "Motorised Available"],
  },

  // ── ShieldGuard ─────────────────────────────────────────────────────────────
  "shield-guard": {
    tagline: "Trusted Security. Round the Clock.",
    phone: "+65 6789 1234",
    email: "ops@shieldguard.sg",
    address: "10 Tuas South Street, Singapore 637000",
    cta: "Request a Guard",
    ctaSecondary: "Get a Quote",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Why Us", href: "#about" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "200+", label: "Guards Deployed" },
      { value: "350+", label: "Sites Secured" },
      { value: "24/7", label: "Operations" },
      { value: "12 yr", label: "In Business" },
    ],
    services: [
      { name: "Uniformed Guard Services", desc: "Trained, uniformed security officers for commercial premises, industrial sites and residential developments.", price: "From $18/hr", icon: "🛡️", image: "https://images.pexels.com/photos/30516935/pexels-photo-30516935.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "CCTV & Surveillance", desc: "Installation, monitoring and management of IP-based CCTV systems with remote access and analytics.", price: "From $1,200", icon: "📹", image: "https://images.pexels.com/photos/18530600/pexels-photo-18530600.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Mobile Patrol", desc: "Regular scheduled and random patrols of your premises by vehicle-mounted officers.", price: "From $800/mo", icon: "🚔", image: "https://images.pexels.com/photos/30516933/pexels-photo-30516933.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Event Security", desc: "Crowd management, access control and VIP protection for concerts, conferences and private events.", price: "Custom quote", icon: "🎪", image: "https://images.pexels.com/photos/30516935/pexels-photo-30516935.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Executive Protection", desc: "Close-protection officers for high-net-worth individuals, corporate executives and visiting dignitaries.", price: "Custom quote", icon: "👤", image: "https://images.pexels.com/photos/18530600/pexels-photo-18530600.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Access Control Systems", desc: "Biometric, card-swipe and visitor management solutions integrated with your existing infrastructure.", price: "From $2,500", icon: "🔐", image: "https://images.pexels.com/photos/30516935/pexels-photo-30516935.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "Singapore's Most Trusted Security Partner Since 2012",
      body: "ShieldGuard is an MOM-licensed security agency providing comprehensive guard, surveillance and access control solutions to over 350 sites across Singapore. Our officers are SPF-certified, receive ongoing training in first aid, crowd control and emergency response, and are backed by 24/7 operations support. We treat every client's premises as if it were our own.",
      highlights: ["MOM licensed security agency", "SPF-certified officers", "ISO 9001:2015 certified", "24/7 operations control room", "350+ secured sites"],
      image: "https://images.pexels.com/photos/30516935/pexels-photo-30516935.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Basic", price: "$18/hr", period: "per guard", features: ["Uniformed static guard", "Hourly incident log", "Daily activity report", "Emergency callout included"], cta: "Get Started" },
      { name: "Business", price: "$2,400/mo", period: "per site", features: ["2 guards, 12-hr shifts", "CCTV monitoring", "Mobile patrol weekly", "Incident response SLA", "Monthly management report"], highlight: true, cta: "Most Popular" },
      { name: "Enterprise", price: "Custom", period: "contract basis", features: ["Dedicated site commander", "24/7 guard deployment", "Full CCTV system", "Access control integration", "Executive protection option", "Annual security audit"], cta: "Contact Us" },
    ],
    team: [
      { name: "Alex Goh", role: "CEO & Operations Director", bio: "15 years in security management. Former Singapore Police Force officer. Oversees all client sites and guard deployment.", initials: "AG", color: "#0f172a" },
      { name: "Raj Kumar", role: "Head of Training", bio: "Runs our SPF-accredited training programme. Ex-Gurkha officer. 200+ officers trained annually.", initials: "RK", color: "#7f1d1d" },
      { name: "Mei Lin", role: "Client Relations Manager", bio: "Manages our key accounts and ensures every client has direct access to their account manager 24/7.", initials: "ML", color: "#dc2626" },
    ],
    testimonials: [
      { name: "Facilities Manager, CapitaLand", location: "Raffles City, Singapore", text: "ShieldGuard has secured our mall for 4 years. Professional, proactive and always on time. Zero security incidents under their watch.", rating: 5, initials: "FM" },
      { name: "HR Director, Jurong Shipyard", location: "Tuas, Singapore", text: "Their officers understand industrial environments. Access control at our yard has improved dramatically since we switched to ShieldGuard.", rating: 5, initials: "HD" },
      { name: "Event Director, Gardens by the Bay", location: "Marina Bay, Singapore", text: "We deploy ShieldGuard for all major events. Crowd control is seamless and their incident response is the best I've seen.", rating: 5, initials: "ED" },
    ],
    faqItems: [
      { q: "Are your guards MOM-licensed?", a: "Yes. All ShieldGuard officers hold valid Private Security Officer licences issued by the Ministry of Manpower (MOM). We conduct licence checks bi-annually and maintain 100% compliance." },
      { q: "How quickly can you deploy guards to a new site?", a: "For standard requirements, we can deploy officers within 48–72 hours of contract signing. For urgent situations, contact our operations hotline for emergency deployment options." },
      { q: "Do you provide uniforms and equipment?", a: "Yes. All officers are provided with standard uniforms, torches, communication radios and first aid kits. Specialist equipment (body armour, K9 units) is available for higher-risk sites." },
      { q: "What industries do you serve?", a: "We serve commercial real estate, industrial facilities, hospitality, healthcare, events, construction sites and residential condominiums across Singapore." },
    ],
    badges: ["MOM Licensed", "SPF Certified", "ISO 9001", "24/7 Operations"],
  },

  // ── ShineAuto ────────────────────────────────────────────────────────────────
  "shine-auto": {
    tagline: "Detail-Perfect. Every Single Time.",
    phone: "+65 9123 4567",
    email: "book@shineauto.sg",
    address: "12 Bukit Timah Road, Singapore 229841",
    cta: "Book a Detail",
    ctaSecondary: "View Packages",
    navLinks: [
      { label: "Packages", href: "#pricing" },
      { label: "Services", href: "#services" },
      { label: "Gallery", href: "#gallery" },
      { label: "Membership", href: "#membership" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "8,000+", label: "Cars Detailed" },
      { value: "4.9★", label: "Google Rating" },
      { value: "6 yr", label: "In Business" },
      { value: "15+", label: "Services Offered" },
    ],
    services: [
      { name: "Express Wash", desc: "Exterior hand wash, tyre dressing, glass clean and interior wipe-down. In and out in 45 minutes.", price: "From $35", icon: "🚿", image: "https://images.pexels.com/photos/6003/pexels-photo-6003.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Full Detail", desc: "Interior vacuum, steam clean, leather condition, exterior wash, clay bar decontamination and machine polish.", price: "From $180", icon: "✨", image: "https://images.pexels.com/photos/35149469/pexels-photo-35149469.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Ceramic Coating", desc: "Professional-grade 9H ceramic coating. 3–5 year protection. Hydrophobic, scratch-resistant, showroom shine.", price: "From $800", icon: "🛡️", image: "https://images.pexels.com/photos/6026083/pexels-photo-6026083.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Paint Protection Film", desc: "Virtually invisible TPU film shields bumper, bonnet and mirrors from stone chips, scratches and abrasions.", price: "From $1,500", icon: "🎯", image: "https://images.pexels.com/photos/6872149/pexels-photo-6872149.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Engine Bay Clean", desc: "Degreaser, rinse and dress engine bay components for improved aesthetics and easier maintenance.", price: "From $80", icon: "⚙️", image: "https://images.pexels.com/photos/35149469/pexels-photo-35149469.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Headlight Restoration", desc: "Restore faded, yellowed headlights to factory clarity. Improves safety and kerb appeal.", price: "From $120", icon: "💡", image: "https://images.pexels.com/photos/6872149/pexels-photo-6872149.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "Singapore's Premier Auto Detailing Studio",
      body: "ShineAuto was founded by detailing enthusiasts who were tired of mediocre car washes. We invest in professional-grade equipment, premium products and — most importantly — highly trained technicians who care about the result. Every vehicle that leaves our studio is treated as if it were our own. We're proud of our 4.9-star rating across 800+ Google reviews and our roster of returning members who trust us month after month.",
      highlights: ["4.9★ across 800+ Google reviews", "IDA-certified detailing specialists", "Gyeon & Kamikaze collection products", "Climate-controlled studio bays", "Collection & delivery available"],
      image: "https://images.pexels.com/photos/6026083/pexels-photo-6026083.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Wash & Vacuum", price: "$35", period: "per visit", features: ["Exterior hand wash", "Interior vacuum", "Dashboard wipe", "Tyre dressing", "Air freshener"], cta: "Book Now" },
      { name: "Full Detail", price: "$180", period: "per visit", features: ["Full interior steam clean", "Leather conditioning", "Clay bar treatment", "Machine polish", "Ceramic spray sealant", "Engine bay wipe"], highlight: true, cta: "Book Now" },
      { name: "Ceramic Pro", price: "From $800", period: "one-time", features: ["Paint decontamination", "One-step machine polish", "9H ceramic coating", "3-year manufacturer warranty", "Maintenance kit included", "Certificate of installation"], cta: "Enquire" },
    ],
    team: [
      { name: "Danny Lim", role: "Founder & Lead Detailer", bio: "IDA-certified. 8 years detailing experience. Has worked on Ferraris, Lamborghinis and bespoke Rolls-Royces.", initials: "DL", color: "#1d4ed8" },
      { name: "Jason Ng", role: "Ceramic Coating Specialist", bio: "Gyeon-trained. Manages all PPF and ceramic coating installations with zero-defect standards.", initials: "JN", color: "#0f172a" },
      { name: "Amirah B.", role: "Studio Manager", bio: "Handles bookings, customer care and quality inspection for every vehicle that leaves the studio.", initials: "AB", color: "#1e40af" },
    ],
    testimonials: [
      { name: "Kevin T.", location: "Bukit Timah, Singapore", text: "Brought my BMW M3 in for a full ceramic coating. The finish is absolutely stunning. Danny walked me through every step. Best detailer in Singapore, no contest.", rating: 5, initials: "KT" },
      { name: "Priya M.", location: "Holland Village, Singapore", text: "Booked the Full Detail package for my Kia. The interior looks like it just came from the showroom. Will definitely be back monthly.", rating: 5, initials: "PM" },
      { name: "Boon Heng L.", location: "Tampines, Singapore", text: "Used them for my Tesla Model Y PPF. Professional, clean studio, and the film application is flawless. Zero bubbles, perfect edges.", rating: 5, initials: "BL" },
    ],
    faqItems: [
      { q: "How long does a full detail take?", a: "A standard Full Detail takes 4–5 hours. Ceramic coating installations take 1–2 days including curing time. We'll give you a time estimate when you book." },
      { q: "Do you offer collection and delivery?", a: "Yes. We offer free collection and delivery within 10km of our studio for Full Detail and above packages. For Express Wash, drop-off at the studio only." },
      { q: "How long does ceramic coating last?", a: "Our 9H ceramic coatings carry a 3-year manufacturer warranty with proper maintenance. Annual maintenance washes are recommended to maintain hydrophobic properties." },
      { q: "Do you detail commercial fleets?", a: "Yes. We offer fleet accounts for businesses with 5+ vehicles. Contact us for corporate pricing and scheduled maintenance plans." },
    ],
    badges: ["4.9★ Google", "IDA Certified", "Gyeon Approved", "800+ Reviews"],
  },

  // ── FeastEvents ───────────────────────────────────────────────────────────────
  "feast-events": {
    tagline: "Great Food. Great Events. Every Time.",
    phone: "+65 6234 8888",
    email: "hello@feastevents.sg",
    address: "8 Dempsey Road, Singapore 247696",
    cta: "Get a Quote",
    ctaSecondary: "View Menu",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Menus", href: "#menus" },
      { label: "Gallery", href: "#gallery" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "2,400+", label: "Events Catered" },
      { value: "50+", label: "Menu Options" },
      { value: "10 yr", label: "In Business" },
      { value: "5,000", label: "Max Guest Capacity" },
    ],
    services: [
      { name: "Corporate Buffet", desc: "Professional buffet catering for conferences, seminars, product launches and office events. Live stations available.", price: "From $28/pax", icon: "🍽️", image: "https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Wedding Banquet", desc: "Full-service wedding catering from cocktail reception to multi-course dinner. Customised menus to your theme.", price: "From $88/pax", icon: "💒", image: "https://images.pexels.com/photos/34321369/pexels-photo-34321369.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Private Dining", desc: "Intimate chef's table experiences, birthday dinners and VIP private events with dedicated sommelier service.", price: "From $120/pax", icon: "🥂", image: "https://images.pexels.com/photos/4005229/pexels-photo-4005229.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Food Truck & Street Food", desc: "Our branded food trucks deliver high-quality street food at festivals, markets and outdoor activations.", price: "From $4,500/day", icon: "🚚", image: "https://images.pexels.com/photos/24863059/pexels-photo-24863059.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "High Tea & Brunch", desc: "Curated high tea and brunch spreads for baby showers, engagement parties and corporate hosting.", price: "From $45/pax", icon: "🫖", image: "https://images.pexels.com/photos/18749086/pexels-photo-18749086.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Live Cooking Stations", desc: "Chef-manned carving, wok, pasta and sushi live stations — perfect centrepiece for gala dinners and exhibitions.", price: "From $800/station", icon: "👨‍🍳", image: "https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "Singapore's Full-Service Catering & Events Partner",
      body: "Feast Events has fed tens of thousands of guests across Singapore and the Gulf — from intimate 20-person boardroom lunches to 5,000-guest gala dinners. Our team of 40 full-time culinary professionals, event coordinators and service staff brings the same precision and passion to every event, regardless of scale. We source fresh, seasonal ingredients daily and never compromise on food quality or presentation.",
      highlights: ["Singapore Food Agency licensed", "Halal certified kitchen", "2,400+ events delivered", "Team of 40+ culinary professionals", "Fresh daily sourcing"],
      image: "https://images.pexels.com/photos/34321369/pexels-photo-34321369.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Seminar", price: "$28/pax", period: "minimum 30 pax", features: ["2 mains, 3 sides", "Soup & salad station", "Dessert & beverages", "Setup & teardown", "Disposable tableware"], cta: "Book Now" },
      { name: "Gala", price: "$88/pax", period: "minimum 100 pax", features: ["5-course sit-down dinner", "2 live cooking stations", "Premium tableware & linens", "Dedicated service team", "Personalised menu card", "Event coordination included"], highlight: true, cta: "Get a Quote" },
      { name: "Wedding", price: "Custom", period: "per event", features: ["Full custom menu design", "Tasting session included", "Sommelier & bar service", "Wedding cake cutting", "Pre-event planning sessions", "Day-of coordinator"], cta: "Contact Us" },
    ],
    team: [
      { name: "Chef Marcus Tan", role: "Executive Chef", bio: "Trained in Paris and Tokyo. 18 years in fine dining and large-scale event catering. Menu architect for all Feast Events concepts.", initials: "MT", color: "#9f1239" },
      { name: "Priya Rajendra", role: "Events Director", bio: "Coordinates all event logistics, staffing and client liaison. Has managed events from 20 to 5,000 guests.", initials: "PR", color: "#92400e" },
      { name: "Hafiz Osman", role: "Operations Manager", bio: "Oversees kitchen operations, halal compliance and daily food sourcing. Ensures every dish leaves the kitchen to spec.", initials: "HO", color: "#b45309" },
    ],
    testimonials: [
      { name: "Procurement Head, DBS Bank", location: "Marina Bay Financial Centre", text: "Feast Events has catered every DBS Singapore townhall for the last 3 years. Consistently excellent food, impeccable service, always on time.", rating: 5, initials: "PH" },
      { name: "Bride, Siti Rahimah", location: "Fullerton Hotel, Singapore", text: "Our wedding dinner for 350 guests was absolutely perfect. Every guest complimented the food. Chef Marcus even customised a dessert for my grandmother's dietary needs.", rating: 5, initials: "SR" },
      { name: "CEO, Singtel", location: "MBFC, Singapore", text: "The live cooking stations at our product launch were a hit. Guests were talking about the food weeks later. Feast Events absolutely delivered.", rating: 5, initials: "CE" },
    ],
    faqItems: [
      { q: "Is your kitchen halal certified?", a: "Yes. Our central kitchen holds a valid Halal certification from the Islamic Religious Council of Singapore (MUIS). All menu items are prepared in accordance with halal requirements." },
      { q: "What is your minimum guest count?", a: "For corporate buffets, our minimum is 30 guests. For sit-down dinners, our minimum is 50 guests. Smaller events (under 30 guests) may be catered for at a premium — please enquire." },
      { q: "How far in advance should we book?", a: "We recommend booking at least 4–6 weeks in advance for corporate events and 6–12 months for weddings. We accept last-minute bookings subject to availability." },
      { q: "Do you provide tableware, linens and serving staff?", a: "Yes. All our packages include tableware, serving equipment and trained service staff. Premium linen, centrepieces and décor can be added as optional upgrades." },
    ],
    badges: ["SFA Licensed", "MUIS Halal", "5,000 Pax Capacity", "10 Years"],
  },

  // ── MedPlus Clinic ────────────────────────────────────────────────────────────
  "medplus-clinic": {
    tagline: "Caring for You and Your Family.",
    phone: "+65 6456 7890",
    email: "appointments@medplus.sg",
    address: "23 Clementi Ave 2, #01-05, Singapore 120023",
    cta: "Book Appointment",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Doctors", href: "#team" },
      { label: "Appointments", href: "#booking" },
      { label: "Insurance", href: "#insurance" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "15,000+", label: "Patients Seen" },
      { value: "8 yr", label: "In Practice" },
      { value: "4.8★", label: "Patient Rating" },
      { value: "Mon–Sun", label: "Open Daily" },
    ],
    services: [
      { name: "General Practice", desc: "Walk-in and appointment GP consultations for acute illness, chronic disease management and medical certificates.", price: "From $35", icon: "🩺", image: "https://images.pexels.com/photos/7659869/pexels-photo-7659869.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Health Screening", desc: "Comprehensive health screenings including blood panel, ECG, body composition, vision and hearing checks.", price: "From $98", icon: "🔬", image: "https://images.pexels.com/photos/7580254/pexels-photo-7580254.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Vaccinations", desc: "Adult and child vaccinations including flu, HPV, Hepatitis B, travel vaccines and pre-employment jabs.", price: "From $28", icon: "💉", image: "https://images.pexels.com/photos/8460095/pexels-photo-8460095.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Women's Health", desc: "Pap smear, breast examination, pre-natal care, contraception counselling and menopause management.", price: "From $80", icon: "🌸", image: "https://images.pexels.com/photos/5593720/pexels-photo-5593720.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Chronic Disease Management", desc: "Long-term care plans for diabetes, hypertension, high cholesterol and asthma under CHAS and CDMP schemes.", price: "Subsidised rates", icon: "💊", image: "https://images.pexels.com/photos/6129441/pexels-photo-6129441.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Minor Surgery", desc: "Wound suturing, mole and skin tag removal, abscess drainage and ingrown toenail procedures.", price: "From $150", icon: "🩹", image: "https://images.pexels.com/photos/7659869/pexels-photo-7659869.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "A Community Clinic Built Around You",
      body: "MedPlus Clinic was established in 2016 to provide Clementi and the surrounding community with affordable, high-quality primary care. Our three doctors — trained at NUS and NTU's medical schools — take the time to listen, explain and personalise treatment plans. We accept Medisave, CHAS, Pioneer Generation and MediShield Life, ensuring our patients are never priced out of quality healthcare.",
      highlights: ["MOH registered clinic", "Medisave & CHAS accepted", "Chronic disease management", "Same-day appointments", "Open 7 days a week"],
      image: "https://images.pexels.com/photos/7659869/pexels-photo-7659869.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Consultation", price: "$35", period: "per visit", features: ["GP consultation", "1 basic medication", "Medical certificate", "Follow-up advice", "CHAS subsidised rates available"], cta: "Walk In" },
      { name: "Health Screen", price: "$98", period: "per package", features: ["Full blood panel (25 tests)", "ECG", "Body composition analysis", "Doctor consultation", "Digital results in 24hr", "Annual health report"], highlight: true, cta: "Book Now" },
      { name: "Corporate", price: "Custom", period: "per employee per year", features: ["Pre-employment screening", "Onsite medical visits", "Group health screening", "Dedicated account manager", "Clinic panel for employees", "Annual health day events"], cta: "Enquire" },
    ],
    team: [
      { name: "Dr. Sarah Lim", role: "Principal GP, MBBS (NUS)", bio: "8 years in family medicine. Specialises in chronic disease management, women's health and preventive care.", initials: "SL", color: "#1d4ed8" },
      { name: "Dr. Raj Arumugam", role: "Senior GP, MBBS (NTU)", bio: "Former hospital doctor with expertise in acute care, minor surgery and occupational medicine.", initials: "RA", color: "#0891b2" },
      { name: "Nurse Jenny Tan", role: "Clinic Sister", bio: "10 years nursing experience. Manages vaccinations, wound care and patient flow for the clinic.", initials: "JT", color: "#1e3a8a" },
    ],
    testimonials: [
      { name: "Mrs Tan Ah Lian", location: "Clementi, Singapore", text: "Dr Sarah is so patient and thorough. She never rushes you and always explains what the medication does. Best GP I've had in 20 years.", rating: 5, initials: "TA" },
      { name: "James Lim", location: "West Coast, Singapore", text: "Walked in on a Saturday morning with a bad fever. Seen within 15 minutes, diagnosed, medicated. Back to work by Monday. Efficient and caring.", rating: 5, initials: "JL" },
      { name: "Priya Nair", location: "Buona Vista, Singapore", text: "Do all my annual health screenings here. The digital results come back fast and the doctor calls to explain every finding personally.", rating: 5, initials: "PN" },
    ],
    faqItems: [
      { q: "Do you accept Medisave?", a: "Yes. We accept Medisave for chronic disease management under the Chronic Disease Management Programme (CDMP), as well as for certain vaccinations and health screenings. Please bring your NRIC and Medisave card." },
      { q: "Can I walk in or do I need an appointment?", a: "Both. Walk-ins are welcome during clinic hours. To avoid waiting, you can book an appointment online or via WhatsApp. Same-day appointments are usually available." },
      { q: "What insurance panels are you on?", a: "We are on AIA, Prudential, Great Eastern, AXA, Aviva, NTUC Income and HSBC Health panels. For other insurers, we can provide receipts for reimbursement claims." },
      { q: "Do you offer home visits?", a: "Yes, for elderly or mobility-impaired patients within 3km of the clinic. Home visit fees apply. Please call to arrange." },
    ],
    badges: ["MOH Registered", "Medisave Accepted", "CHAS Green & Blue", "Open 7 Days"],
  },

  // ── DriveAcademy ─────────────────────────────────────────────────────────────
  "drive-academy": {
    tagline: "From Learner to Licensed. Guaranteed.",
    phone: "+65 6543 9900",
    email: "hello@driveacademy.sg",
    address: "3 Ubi Ave 3, #02-11, Singapore 408857",
    cta: "Book a Lesson",
    ctaSecondary: "View Courses",
    navLinks: [
      { label: "Courses", href: "#pricing" },
      { label: "Instructors", href: "#team" },
      { label: "FAQ", href: "#faq" },
      { label: "Book Now", href: "#booking" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "94%", label: "First-Attempt Pass Rate" },
      { value: "12,000+", label: "Students Graduated" },
      { value: "20 yr", label: "In Business" },
      { value: "25+", label: "Certified Instructors" },
    ],
    services: [
      { name: "Class 3A (Auto) Private Lessons", desc: "One-on-one circuit and road lessons in automatic transmission cars. Flexible morning, afternoon and weekend slots.", price: "From $65/lesson", icon: "🚗", image: "https://images.pexels.com/photos/9518018/pexels-photo-9518018.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Class 3 (Manual) Private Lessons", desc: "Manual transmission lessons for drivers seeking full licence flexibility. Ideal for commercial or overseas driving.", price: "From $65/lesson", icon: "⚙️", image: "https://images.pexels.com/photos/9518029/pexels-photo-9518029.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Intensive Course", desc: "Full-package intensive programme: 20 lessons + 2 theory sessions + 1 mock test. Average completion in 8 weeks.", price: "$1,200 package", icon: "⚡", image: "https://images.pexels.com/photos/37112146/pexels-photo-37112146.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Refresher Course", desc: "For lapsed drivers returning after a break. Re-familiarise with current road rules and modern vehicle systems.", price: "From $65/lesson", icon: "🔄", image: "https://images.pexels.com/photos/6817037/pexels-photo-6817037.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Theory Test Prep", desc: "Classroom and online preparation for Basic Theory Test (BTT) and Final Theory Test (FTT). 98% pass rate.", price: "$80 package", icon: "📚", image: "https://images.pexels.com/photos/9518021/pexels-photo-9518021.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Simulator Training", desc: "Advanced driving simulator sessions covering wet weather, night driving and emergency stopping situations.", price: "From $45/session", icon: "🖥️", image: "https://images.pexels.com/photos/9518018/pexels-photo-9518018.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "20 Years of Turning Learners Into Confident Drivers",
      body: "DriveAcademy has been Singapore's most trusted private driving school since 2004. Our 25+ certified instructors combine patient, encouraging teaching styles with rigorous preparation for both the TP circuit and road tests. We maintain a 94% first-attempt pass rate — well above the national average — and back our intensive course with a free re-test lesson if you don't pass first time.",
      highlights: ["TP-registered driving school", "94% first-attempt pass rate", "25+ certified instructors", "Online theory portal included", "Free re-test lesson guarantee"],
      image: "https://images.pexels.com/photos/37112146/pexels-photo-37112146.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Pay Per Lesson", price: "$65/lesson", period: "no commitment", features: ["Class 3A or 3 options", "Flexible slot booking", "WhatsApp scheduling", "Progress tracking app", "Pre-test mock session ($80 add-on)"], cta: "Book a Lesson" },
      { name: "Intensive Course", price: "$1,200", period: "full package", features: ["20 driving lessons", "BTT & FTT prep included", "2 simulator sessions", "Mock test session", "TP test slot booking", "Free re-test lesson if failed"], highlight: true, cta: "Enrol Now" },
      { name: "Advanced Driver", price: "$550", period: "refresher package", features: ["8 refresher lessons", "Road rule update session", "Night driving practice", "Highway & expressway lesson", "Progress assessment report"], cta: "Book Now" },
    ],
    team: [
      { name: "Chief Instr. David Ong", role: "Founder & Chief Instructor", bio: "TP-certified. 20 years teaching. Has personally graduated over 3,000 students. Known for calm, patient teaching style.", initials: "DO", color: "#dc2626" },
      { name: "Instr. Michelle Tan", role: "Senior Driving Instructor", bio: "Specialises in anxiety management for nervous learners. 8-year track record with 96% first-attempt pass rate.", initials: "MT", color: "#7f1d1d" },
      { name: "Instr. Faisal Rahman", role: "Driving Instructor", bio: "Manual transmission specialist. Teaches both Class 3 and Class 3A. Fluent in English, Malay and Tamil.", initials: "FR", color: "#991b1b" },
    ],
    testimonials: [
      { name: "Amanda L.", location: "Bedok, Singapore", text: "Failed twice at CDCs. Switched to DriveAcademy and David's patient coaching made all the difference. Passed first attempt with them. Cannot recommend enough.", rating: 5, initials: "AL" },
      { name: "Hafiz M.", location: "Jurong East, Singapore", text: "Booked the intensive course. 8 weeks from zero to full licence. The theory prep materials online are so good I passed FTT on my first try too.", rating: 5, initials: "HM" },
      { name: "Clara Ng", location: "Tampines, Singapore", text: "Michelle is a saint. I was terrified of driving but she built my confidence lesson by lesson. Got my licence in 3 months. Life changing.", rating: 5, initials: "CN" },
    ],
    faqItems: [
      { q: "How many lessons do I need before taking the test?", a: "This varies by learner. Most students need 15–25 lessons for circuit practice plus road lessons. Our instructors assess your readiness and recommend when to book the TP test. The intensive package includes 20 lessons which is the typical requirement." },
      { q: "Can I book lessons on weekends?", a: "Yes. We offer slots 7 days a week including weekends and public holidays, subject to instructor availability. Weekend slots tend to fill up fast — we recommend booking 1–2 weeks in advance." },
      { q: "What if I fail the TP test?", a: "Students on our Intensive Course package receive one free additional lesson before their re-test booking. We'll review what went wrong and tailor your practice accordingly." },
      { q: "Do you provide the car for the TP test?", a: "Yes. Our instructors accompany you to the TP test in our school car. The school car is what you'll have practised in throughout your lessons." },
    ],
    badges: ["94% Pass Rate", "TP Registered", "12,000+ Graduates", "20 Years"],
  },

  // ── TradeSupply (this must remain AFTER Batch 3 content) ──────────────────────
  "trade-supply": {
    tagline: "Your global supply chain partner",
    phone: "+971 4 234 5678",
    email: "trade@tradesupply.ae",
    address: "Jebel Ali Free Zone, Dubai, UAE",
    cta: "Submit Enquiry",
    ctaSecondary: "View Catalogue",
    navLinks: [
      { label: "Products", href: "#services" },
      { label: "About", href: "#about" },
      { label: "Partners", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
      { label: "Enquire Now", href: "#contact" },
    ],
    stats: [
      { value: "20 yr", label: "In Business" },
      { value: "50+", label: "Countries Served" },
      { value: "1,000+", label: "Product Lines" },
      { value: "$50M+", label: "Annual Trade Volume" },
    ],
    services: [
      { name: "Wholesale Supply", desc: "Bulk supply of consumer goods, building materials, chemicals, food commodities and industrial products.", price: "MOQ Pricing", icon: "📦", image: "https://images.pexels.com/photos/4487383/pexels-photo-4487383.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Import & Export", desc: "Full documentation, customs clearance and compliance for cross-border trade across Asia and the Gulf.", price: "Contact for Rates", icon: "🚢", image: "https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Global Sourcing", desc: "Manufacturer identification, factory audits, sample management and production oversight in BD, India, CN, VN.", price: "From 3% of order", icon: "🌏", image: "https://images.pexels.com/photos/8377802/pexels-photo-8377802.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Freight & Logistics", desc: "FCL and LCL ocean freight, air freight, inland trucking and last-mile delivery across GCC and ASEAN.", price: "Quote on enquiry", icon: "✈️", image: "https://images.pexels.com/photos/24244235/pexels-photo-24244235.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Quality Control", desc: "Pre-shipment inspection, in-line QC and lab testing through certified inspection companies.", price: "From $250/inspection", icon: "✅", image: "https://images.pexels.com/photos/4487383/pexels-photo-4487383.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
      { name: "Brand Distribution", desc: "Exclusive and non-exclusive distribution agreements for brands entering GCC and ASEAN markets.", price: "Partnership basis", icon: "🤝", image: "https://images.pexels.com/photos/10834810/pexels-photo-10834810.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" },
    ],
    about: {
      heading: "20 Years. 50+ Countries. 1,000+ Products.",
      body: "TradeSupply International is a full-service wholesale trading and distribution company headquartered in Dubai's Jebel Ali Free Zone, with offices in Dhaka, Singapore and Kuala Lumpur. We source, import, warehouse and distribute goods across 50+ countries — competitive pricing, ISO 9001 certified, letters of credit accepted.",
      highlights: ["ISO 9001:2015 certified", "50+ countries served", "Offices in UAE, BD, SG, MY", "1,000+ product categories", "Letters of credit & trade finance available"],
      image: "https://images.pexels.com/photos/4487383/pexels-photo-4487383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    },
    pricing: [
      { name: "Spot Order", price: "MOQ Pricing", features: ["No long-term commitment", "Competitive spot pricing", "Standard lead time", "QC inspection option", "LC / TT payment accepted"], cta: "Submit Enquiry" },
      { name: "Supply Contract", price: "Volume Pricing", features: ["Guaranteed pricing 6–12 months", "Priority production allocation", "Dedicated account manager", "Monthly delivery schedule", "Trade credit available"], highlight: true, cta: "Discuss Contract" },
      { name: "Distribution Partnership", price: "Custom Terms", features: ["Exclusive/non-exclusive rights", "Marketing support", "In-market sales team access", "Co-branded materials", "Revenue share or margin model"], cta: "Explore Partnership" },
    ],
    team: [
      { name: "Mohammed Al-Farsi", role: "CEO & Founder", bio: "20 years in international trade. Built TradeSupply into a multi-country trading group across 4 countries.", initials: "MA", color: "#1e3a5f" },
      { name: "James Tan", role: "Trade Director, Asia", bio: "Based in Singapore. Manages sourcing across BD, India, China and Vietnam, oversees ASEAN distribution.", initials: "JT", color: "#ea580c" },
      { name: "Rahul Sharma", role: "Logistics Manager", bio: "10 years in freight forwarding. Manages our logistics network across 50+ countries.", initials: "RS", color: "#1e3a5f" },
    ],
    testimonials: [
      { name: "Khalid Al-Mansouri", location: "Dubai", text: "TradeSupply has been our preferred sourcing partner for 8 years. Competitive pricing, reliable quality, they handle everything.", rating: 5, initials: "KA" },
      { name: "Rashida Begum", location: "Dhaka", text: "Their inspection service caught several quality issues before shipment — saved us significant costs.", rating: 5, initials: "RB" },
      { name: "Ahmad bin Hassan", location: "Kuala Lumpur", text: "Arranged factory visits, handled all docs, shipped 40ft containers to KL on time. 15% lower than previous supplier.", rating: 5, initials: "AB" },
    ],
    faqItems: [
      { q: "What is your minimum order quantity?", a: "Varies by product. Most FMCG goods: 500–1,000 units or one 20ft container. Building materials priced per metric tonne." },
      { q: "What payment terms do you accept?", a: "Letters of Credit (LC at sight and usance), Telegraphic Transfer (TT), and open account terms for established clients." },
      { q: "How do you ensure product quality?", a: "Factory audits before onboarding any supplier. Pre-shipment inspection via SGS, Bureau Veritas or Intertek available for each shipment." },
      { q: "Which countries do you ship to?", a: "GCC (UAE, KSA, Qatar, Kuwait, Oman, Bahrain), South Asia (BD, IN, LK) and Southeast Asia (SG, MY, ID, TH). Other destinations on request." },
    ],
    galleryLabels: ["Warehouse Operations", "Container Loading", "Product Catalogue", "Port Operations", "Quality Inspection", "Global Distribution"],
    badges: ["ISO 9001 Certified", "50+ Countries", "$50M+ Trade Volume", "20 Years Experience"],
  },

};

// Fallback content for templates not explicitly defined
const FALLBACK: Record<string, Partial<TemplateContent>> = {
  "deep-clean": {
    tagline: "Hospital-Grade Cleaning for Your Space",
    phone: "+1 (800) 555-3300",
    email: "info@deepclean.com",
    address: "120 Industrial Blvd, Business District",
    cta: "Get a Free Quote",
    ctaSecondary: "View Services",
    badges: ["EPA Certified", "Hospital Grade", "24/7 Service", "Fully Insured"],
  },
  "flow-right": {
    tagline: "Your Local Plumbing Experts",
    phone: "+1 (800) 555-7744",
    email: "help@flowright.com",
    address: "88 Waterworks Lane",
    cta: "Call Now",
    ctaSecondary: "Book Online",
    badges: ["Licensed & Insured", "24/7 Emergency", "Fixed Quotes", "5★ Rated"],
  },
  "climate-zone": {
    tagline: "Commercial & Residential HVAC Solutions",
    phone: "+1 (888) 555-8800",
    email: "service@climatezone.com",
    address: "55 Commerce Park, Unit 4",
    cta: "Get a Quote",
    ctaSecondary: "Our Services",
    badges: ["500+ Clients", "Licensed", "7 Days/Week", "Commercial & Residential"],
  },
};

export function getTemplateContent(slug: string): TemplateContent {
  if (CONTENT[slug]) return CONTENT[slug];

  // Build a reasonable fallback from slug
  const fallback = FALLBACK[slug] ?? {};
  return {
    tagline: fallback.tagline ?? "Professional Services You Can Trust",
    phone: fallback.phone ?? "+1 (800) 555-0100",
    email: fallback.email ?? `hello@${slug}.com`,
    address: fallback.address ?? "123 Business Street, City",
    cta: fallback.cta ?? "Get in Touch",
    ctaSecondary: fallback.ctaSecondary ?? "Learn More",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "About", href: "#about" },
      { label: "Gallery", href: "#gallery" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "500+", label: "Happy Clients" },
      { value: "10 yr", label: "Experience" },
      { value: "4.9★", label: "Rating" },
      { value: "100%", label: "Satisfaction" },
    ],
    services: [
      { name: "Core Service", desc: "Our flagship service, delivered to the highest professional standard.", price: "Contact us", icon: "⭐" },
      { name: "Premium Service", desc: "An elevated offering for clients who want the very best.", price: "Contact us", icon: "💎" },
      { name: "Consultation", desc: "A free initial consultation to discuss your needs and our solutions.", price: "Free", icon: "💬" },
    ],
    about: {
      heading: "Quality, Reliability and Results",
      body: "We are a professional services company committed to delivering exceptional quality on every project. Our experienced team brings expertise, dedication and a genuine commitment to client satisfaction to everything we do.",
      highlights: ["Fully licensed & insured", "Experienced team", "Free consultation", "Satisfaction guaranteed"],
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&q=80&fit=crop",
    },
    testimonials: [
      { name: "John D.", location: "Local Client", text: "Fantastic service from start to finish. Professional, punctual and the results were outstanding. Highly recommended.", rating: 5, initials: "JD" },
      { name: "Sarah P.", location: "Regular Client", text: "I've used this company three times now and the quality has been consistently excellent. Will absolutely be back.", rating: 5, initials: "SP" },
    ],
    badges: fallback.badges ?? ["Professional", "Licensed", "5★ Rated", "Insured"],
  };
}
