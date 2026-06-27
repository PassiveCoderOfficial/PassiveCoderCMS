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

  // ── HandyfixPro ─────────────────────────────────────────────────────────────
  "handyfix-pro": {
    tagline: "No Job Too Small. No Problem Too Big.",
    phone: "+61 2 9876 5432",
    email: "jobs@handyfixpro.com.au",
    address: "Serving Greater Sydney & Surrounds",
    cta: "Book a Handyman",
    ctaSecondary: "Get a Free Quote",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#reviews" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "4,200+", label: "Jobs Completed" },
      { value: "4.9★", label: "Google Rating" },
      { value: "Same Day", label: "Availability" },
      { value: "10 yr", label: "Experience" },
    ],
    services: [
      { name: "General Repairs", desc: "Doors, locks, hinges, leaky taps, cracked tiles — we fix the things that have been on your to-do list for months.", price: "From $95/hr", icon: "🔧", image: "https://images.pexels.com/photos/8961247/pexels-photo-8961247.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Furniture Assembly", desc: "Flat-pack assembly from IKEA, Kmart, and all major retailers — fully assembled and secured.", price: "From $75", icon: "🪑" },
      { name: "Picture & TV Mounting", desc: "TV wall mounts, shelving, picture rails and mirrors — level, safe, and cable-managed.", price: "From $99", icon: "📺" },
      { name: "Painting & Patching", desc: "Touch-ups, feature walls, ceiling patches and full-room painting to a professional finish.", price: "From $150", icon: "🖌️" },
      { name: "Gutter Cleaning", desc: "Clear blocked gutters and downpipes before the next storm hits.", price: "From $120", icon: "🏠" },
      { name: "Odd Jobs Package", desc: "Book 3 hours and we'll work through your full list — the most cost-effective way to clear the backlog.", price: "$255 (3 hrs)", icon: "📋" },
    ],
    about: {
      heading: "Sydney's Most Trusted Local Handyman Since 2014",
      body: "HandyfixPro was built on one simple idea: reliable tradespeople should be easy to find and easy to book. Our team of experienced, licenced handymen shows up on time, treats your home with respect, and gets the job done right. No job too small, no mess left behind.",
      highlights: ["Police-checked & insured", "Fixed hourly rate — no hidden fees", "Same-day bookings available", "All tools & materials supplied", "100% satisfaction guarantee"],
      image: "https://images.pexels.com/photos/8961247/pexels-photo-8961247.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "1-Hour Visit", price: "$95", features: ["1 hour on-site", "Up to 2 small tasks", "All tools supplied", "Tidy-up included"], cta: "Book Now" },
      { name: "Half Day", price: "$280", features: ["3 hours on-site", "Multiple tasks tackled", "Materials list provided", "Progress photos", "Priority scheduling"], highlight: true, cta: "Book Now" },
      { name: "Full Day", price: "$490", features: ["6 hours on-site", "Biggest bang for buck", "Full task list cleared", "Free follow-up visit", "Dedicated handyman"], cta: "Book Now" },
    ],
    team: [
      { name: "Dave Kowalski", role: "Lead Handyman", bio: "15 years in residential repairs and renovations. Certified carpenter and licensed tradesman.", initials: "DK", color: "#ea580c" },
      { name: "Sam Nguyen", role: "Senior Technician", bio: "Specialises in furniture assembly, TV mounting, and home maintenance packages.", initials: "SN", color: "#d97706" },
    ],
    testimonials: [
      { name: "Karen T.", location: "Surry Hills, Sydney", text: "Dave arrived exactly on time, knocked out 6 things on my list in 3 hours and charged exactly what was quoted. Absolute legend.", rating: 5, initials: "KT" },
      { name: "Michael B.", location: "Newtown, Sydney", text: "Had a dodgy door, leaky tap and a flat-pack wardrobe. All done in 2 hours, no fuss. Will book again without hesitation.", rating: 5, initials: "MB" },
      { name: "Priya M.", location: "Parramatta", text: "Called at 8am, they were here by 11am. Fixed our bathroom cabinet and mounted two shelves. Brilliant service.", rating: 5, initials: "PM" },
    ],
    faqItems: [
      { q: "Do you supply materials?", a: "We supply all tools. For materials like timber, fixings or paint, we'll give you a list or pick them up and charge at cost." },
      { q: "How do I book?", a: "Call, text or book online. We'll confirm your time slot within 1 hour." },
      { q: "Are you licensed and insured?", a: "Yes — all our handymen are police-checked, carry public liability insurance, and hold relevant trade licences." },
      { q: "What if the job takes longer than expected?", a: "We'll always let you know before going over time and get your approval first. No surprise bills." },
    ],
    galleryLabels: ["Door Repair", "TV Mount", "Shelf Install", "Tap Fix", "Furniture Build", "Painting"],
    badges: ["Police Checked", "Fully Insured", "4.9★ Google", "Same-Day Available"],
  },

  // ── BuildGuard ───────────────────────────────────────────────────────────────
  "buildguard": {
    tagline: "Proactive Maintenance. Zero Surprises.",
    phone: "+65 6789 1234",
    email: "ops@buildguard.sg",
    address: "12 Changi Business Park, Singapore 486006",
    cta: "Request a Proposal",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Industries", href: "#industries" },
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "350+", label: "Buildings Managed" },
      { value: "18 yr", label: "In Operation" },
      { value: "24/7", label: "Emergency Response" },
      { value: "ISO 9001", label: "Certified" },
    ],
    services: [
      { name: "Preventive Maintenance", desc: "Scheduled inspections and maintenance programs that extend asset life and prevent costly breakdowns.", price: "Contract basis", icon: "🔍", image: "https://images.pexels.com/photos/209271/pexels-photo-209271.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Corrective Repairs", desc: "Fast response to building faults — electrical, plumbing, structural and mechanical.", price: "From $180/hr", icon: "🔧" },
      { name: "M&E Maintenance", desc: "Mechanical and electrical system maintenance for commercial and industrial buildings.", price: "Contract basis", icon: "⚡" },
      { name: "Facility Audits", desc: "Comprehensive building condition assessments with detailed reporting and remediation plans.", price: "From $800", icon: "📋" },
      { name: "Emergency Callout", desc: "24/7 rapid-response team for fire systems, lifts, ACMV, water supply, and structural issues.", price: "Priority contract", icon: "🚨" },
    ],
    about: {
      heading: "Singapore's Leading Facility Management Partner",
      body: "BuildGuard has been maintaining commercial, industrial, and institutional buildings across Singapore for 18 years. Our multi-disciplined team of licensed engineers and technicians delivers planned maintenance programs that reduce downtime, control costs, and keep your building performing at its best.",
      highlights: ["BCA registered contractors", "ISO 9001:2015 certified", "WSH compliant", "350+ active building contracts", "24/7 emergency response team"],
      image: "https://images.pexels.com/photos/209271/pexels-photo-209271.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Raymond Tan", role: "Managing Director", bio: "20 years in facilities management. PE (Civil) with deep expertise in M&E systems.", initials: "RT", color: "#2563eb" },
      { name: "Linda Ho", role: "Operations Manager", bio: "Oversees all maintenance contracts and ensures service delivery standards are met.", initials: "LH", color: "#3b82f6" },
      { name: "Farhan Yusof", role: "Senior Engineer", bio: "M&E specialist with 12 years managing complex building systems.", initials: "FY", color: "#1d4ed8" },
    ],
    testimonials: [
      { name: "Jason Lim", location: "Raffles Place, Singapore", text: "BuildGuard has managed our two office buildings for 5 years. Zero major breakdowns, always proactive. Excellent team.", rating: 5, initials: "JL" },
      { name: "Michelle Ong", location: "Jurong Industrial Estate", text: "Switched to BuildGuard after constant issues with our previous contractor. Night and day difference in service quality.", rating: 5, initials: "MO" },
      { name: "Thomas Raj", location: "Changi Business Park", text: "Their 24/7 response is genuinely 24/7. Lift broke at 11pm on a Friday — tech was there in 45 minutes.", rating: 5, initials: "TR" },
    ],
    faqItems: [
      { q: "What types of buildings do you service?", a: "We service commercial offices, industrial facilities, retail centres, hospitals, schools, and government buildings." },
      { q: "Do you provide 24/7 emergency cover?", a: "Yes — all contract clients receive 24/7 emergency response with guaranteed on-site times based on severity." },
      { q: "How are maintenance schedules set?", a: "We conduct an initial building audit, then design a customised preventive maintenance schedule aligned to manufacturer recommendations and regulatory requirements." },
      { q: "Are your technicians licenced?", a: "All our technicians hold relevant licences issued by BCA, EMA, and PUB for their respective trades." },
    ],
    galleryLabels: ["Office Block", "Industrial Plant", "ACMV System", "Electrical Panel", "Lift Maintenance", "Building Audit"],
    badges: ["ISO 9001", "BCA Registered", "18 Years", "24/7 Response"],
  },

  // ── ApexConstruct ────────────────────────────────────────────────────────────
  "apex-construct": {
    tagline: "Precision Built. Proudly Delivered.",
    phone: "+44 20 3456 7890",
    email: "projects@apexconstruct.co.uk",
    address: "Apex House, 45 Commercial Road, London E1",
    cta: "Request a Quote",
    ctaSecondary: "View Our Projects",
    navLinks: [
      { label: "Projects", href: "#projects" },
      { label: "Services", href: "#services" },
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "500+", label: "Projects Delivered" },
      { value: "25 yr", label: "Track Record" },
      { value: "£180M", label: "Construction Value" },
      { value: "0", label: "Major Safety Incidents" },
    ],
    services: [
      { name: "New Build Construction", desc: "Residential, commercial, and mixed-use new builds from groundworks to practical completion.", price: "Request Quote", icon: "🏗️", image: "https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Major Renovation", desc: "Structural renovation and refurbishment of existing buildings, including listed properties.", price: "Request Quote", icon: "🔨" },
      { name: "Commercial Fit-Out", desc: "Cat A and Cat B office, retail, and hospitality fit-outs with full project management.", price: "Request Quote", icon: "🏢" },
      { name: "Design & Build", desc: "Integrated design-and-build delivery — single point of accountability from concept to handover.", price: "Request Quote", icon: "📐" },
      { name: "Project Management", desc: "Employer's agent and project management services for developers and owner-occupiers.", price: "From £150/hr", icon: "📋" },
      { name: "Groundworks & Civil", desc: "Excavation, foundations, drainage, and external civil works.", price: "Request Quote", icon: "🛣️" },
    ],
    about: {
      heading: "25 Years of Building Excellence Across the UK",
      body: "ApexConstruct has been delivering complex construction projects across London and the UK since 1999. Our team of 200+ construction professionals brings rigorous project management, craftsmanship, and transparency to every build — from a luxury home extension to a £30M commercial development.",
      highlights: ["CIOB accredited", "ISO 9001 & 14001 certified", "Investors in People Gold", "SafeContractor approved", "25-year track record"],
      image: "https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "James Hartley", role: "Managing Director", bio: "Chartered builder and CIOB Fellow with 30 years of major project delivery experience.", initials: "JH", color: "#ca8a04" },
      { name: "Sophie Chen", role: "Design Director", bio: "RIBA-chartered architect specialising in commercial and mixed-use developments.", initials: "SC", color: "#d97706" },
      { name: "Marcus Webb", role: "Commercial Director", bio: "Quantity surveyor with expertise in value engineering and contract management.", initials: "MW", color: "#b45309" },
    ],
    testimonials: [
      { name: "Richard Forsyth", location: "City of London", text: "ApexConstruct delivered our 6-floor office refurbishment on time and within budget. The quality of workmanship was exceptional throughout.", rating: 5, initials: "RF" },
      { name: "Amanda Clarke", location: "Shoreditch", text: "From design to handover, the team were communicative, professional, and genuinely cared about the outcome. Outstanding.", rating: 5, initials: "AC" },
      { name: "David Okafor", location: "Canary Wharf", text: "We've used Apex on four projects now. Their consistency and attention to detail is why we keep coming back.", rating: 5, initials: "DO" },
    ],
    faqItems: [
      { q: "What size projects do you take on?", a: "We work on projects from £250k to £30M+, spanning residential, commercial, industrial, and hospitality sectors." },
      { q: "Do you offer fixed-price contracts?", a: "Yes — we offer lump-sum fixed-price contracts for clearly defined scopes, as well as target-cost and cost-plus arrangements." },
      { q: "Are you insured?", a: "We carry comprehensive employer's liability, public liability (£10M), and contractor's all-risk insurance on all projects." },
      { q: "How do we start?", a: "Contact us with your project brief. We'll arrange a site visit, assess feasibility, and provide a detailed proposal within 2 weeks." },
    ],
    galleryLabels: ["Commercial Office", "Residential Build", "Fit-Out", "Structural Renovation", "External Works", "Project Handover"],
    badges: ["CIOB Accredited", "ISO 9001", "25 Years", "SafeContractor"],
  },

  // ── SparkleHome ──────────────────────────────────────────────────────────────
  "sparkle-home": {
    tagline: "Eco-Clean Homes. Happy Families.",
    phone: "+61 3 9876 0011",
    email: "book@sparklehome.com.au",
    address: "Serving Melbourne Metro & Surrounds",
    cta: "Book a Clean",
    ctaSecondary: "See Our Prices",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#reviews" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "8,500+", label: "Homes Cleaned" },
      { value: "4.9★", label: "Average Rating" },
      { value: "100%", label: "Eco Products" },
      { value: "7 Days", label: "A Week" },
    ],
    services: [
      { name: "Regular House Clean", desc: "Weekly, fortnightly, or monthly scheduled cleans — keeping your home consistently fresh without lifting a finger.", price: "From $99", icon: "🏠", image: "https://images.pexels.com/photos/4239031/pexels-photo-4239031.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Deep Clean", desc: "Top-to-bottom intensive clean — inside appliances, behind furniture, skirting boards, and every corner.", price: "From $199", icon: "✨" },
      { name: "End-of-Lease Clean", desc: "Bond-back guaranteed. We clean to real estate inspection standards — every checklist item ticked.", price: "From $279", icon: "🔑" },
      { name: "Move-In Clean", desc: "Start fresh in your new home with a full sanitisation clean before your furniture arrives.", price: "From $159", icon: "📦" },
      { name: "After-Renovation Clean", desc: "Remove dust, debris, and residue left after builders — ready for you to enjoy your new space.", price: "From $249", icon: "🔨" },
    ],
    about: {
      heading: "Melbourne's Most Trusted Eco-Friendly House Cleaners",
      body: "SparkleHome was founded with a mission to make professional house cleaning accessible, affordable, and genuinely eco-friendly. Every product we use is biodegradable, fragrance-customisable, and safe for kids and pets. Our vetted, insured cleaners treat your home as if it were their own.",
      highlights: ["100% eco-certified products", "Police-checked & insured staff", "Bond-back guarantee", "Online booking in 60 seconds", "Same-day slots available"],
      image: "https://images.pexels.com/photos/4239031/pexels-photo-4239031.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Studio / 1BR", price: "$99", period: "per clean", features: ["Kitchen & bathroom", "Vacuum & mop", "Surface wipe-down", "Eco products", "Online booking"], cta: "Book Now" },
      { name: "2–3 Bedrooms", price: "$159", period: "per clean", features: ["Full home clean", "Inside oven (add-on)", "Laundry folding", "Window sills", "Priority booking", "Satisfaction guarantee"], highlight: true, cta: "Book Now" },
      { name: "4+ Bedrooms", price: "$219", period: "per clean", features: ["Large home clean", "All rooms included", "Inside appliances", "Dedicated cleaner", "Flexible scheduling", "Free rebook if unhappy"], cta: "Book Now" },
    ],
    testimonials: [
      { name: "Emma R.", location: "South Yarra, Melbourne", text: "Have been using SparkleHome fortnightly for 8 months. Consistently excellent — the team is thorough, punctual, and genuinely lovely.", rating: 5, initials: "ER" },
      { name: "Tom & Lisa K.", location: "Richmond", text: "Used them for an end-of-lease clean and got our full bond back. The real estate agent said it was the best presented property she'd seen.", rating: 5, initials: "TLK" },
      { name: "Nadia P.", location: "Carlton", text: "Love that they use eco products — my toddler crawls everywhere and I feel completely safe. Quality is brilliant too.", rating: 5, initials: "NP" },
    ],
    faqItems: [
      { q: "Do I need to be home during the clean?", a: "No — most clients provide a key or access code. We're fully insured and trusted with solo access to thousands of homes." },
      { q: "What eco products do you use?", a: "We use Koala Eco and similar certified biodegradable, non-toxic cleaning products. Safe for children, pets, and sensitive surfaces." },
      { q: "What's your bond-back guarantee?", a: "If your property manager is not satisfied, we'll return and re-clean the flagged areas at no extra cost." },
      { q: "How do I cancel or reschedule?", a: "Cancel or reschedule online up to 24 hours before your booking at no charge." },
    ],
    galleryLabels: ["Kitchen Sparkle", "Bathroom Deep Clean", "Living Room", "Bedroom", "End-of-Lease", "After-Reno Clean"],
    badges: ["Eco Certified", "Bond-Back Guarantee", "Police Checked", "4.9★ Google"],
  },

  // ── CleanCore ────────────────────────────────────────────────────────────────
  "cleancore-commercial": {
    tagline: "Spotless Workplaces. Consistent Results.",
    phone: "+971 4 555 8800",
    email: "contracts@cleancore.ae",
    address: "Office 401, Business Bay Tower, Dubai, UAE",
    cta: "Get a Contract Quote",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Industries", href: "#industries" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "600+", label: "Commercial Clients" },
      { value: "12 yr", label: "In Business" },
      { value: "1,200+", label: "Staff Deployed Daily" },
      { value: "ISO 9001", label: "Certified" },
    ],
    services: [
      { name: "Daily Office Cleaning", desc: "Scheduled daily cleaning of workspaces, kitchens, breakrooms, restrooms, and common areas.", price: "From AED 2,500/mo", icon: "🏢", image: "https://images.pexels.com/photos/6195957/pexels-photo-6195957.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Industrial & Warehouse", desc: "Heavy-duty cleaning for factories, warehouses, and production facilities — day or night shifts.", price: "Custom quote", icon: "🏭" },
      { name: "Retail & Mall Cleaning", desc: "High-traffic retail environment cleaning — floors, fixtures, fitting rooms, and public areas.", price: "Custom quote", icon: "🛍️" },
      { name: "Strip & Seal Floors", desc: "Complete floor stripping, polishing, and sealing for a like-new finish on hard floors.", price: "From AED 8/sqm", icon: "✨" },
      { name: "Post-Construction Clean", desc: "Builders' clean following fitouts and renovation — dust extraction, surface wash, window clean.", price: "From AED 15/sqm", icon: "🔨" },
      { name: "Periodic Deep Clean", desc: "Quarterly or annual deep cleaning contracts beyond the scope of daily cleaning programs.", price: "Custom quote", icon: "📋" },
    ],
    about: {
      heading: "Dubai's Most Reliable Commercial Cleaning Partner",
      body: "CleanCore has been servicing commercial, retail, and industrial clients across the UAE for 12 years. Our trained and uniformed cleaning teams operate to ISO 9001 standards — delivering consistent, measurable results backed by quality audits and dedicated account management.",
      highlights: ["ISO 9001:2015 certified", "ISSA member", "All staff uniformed & ID-badged", "Dedicated account manager", "Monthly quality audits"],
      image: "https://images.pexels.com/photos/6195957/pexels-photo-6195957.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Khalid Al Mansouri", role: "Operations Director", bio: "15 years in FM and commercial cleaning. Oversees all contracts and quality standards.", initials: "KM", color: "#1d4ed8" },
      { name: "Reena Sharma", role: "Account Manager", bio: "Manages key client relationships and ensures service delivery meets expectations daily.", initials: "RS", color: "#2563eb" },
    ],
    testimonials: [
      { name: "James Whitfield", location: "DIFC, Dubai", text: "CleanCore has been cleaning our 4-floor office for 3 years. Consistent, professional, and the team genuinely cares about standards.", rating: 5, initials: "JW" },
      { name: "Fatima Al Zaabi", location: "Abu Dhabi", text: "We switched to CleanCore for our showroom. The difference in presentation was immediately noticed by our customers.", rating: 5, initials: "FAZ" },
      { name: "Raj Menon", location: "Jebel Ali", text: "Our warehouse is spotless every morning. Reliable team, great value, and no staff turnover issues to deal with.", rating: 5, initials: "RM" },
    ],
    faqItems: [
      { q: "What areas do you serve?", a: "We operate across Dubai, Abu Dhabi, Sharjah, and Ajman with teams deployed 7 days a week." },
      { q: "Do you provide cleaning supplies?", a: "Yes — all chemicals, equipment, and consumables are included in our contracts at no extra charge." },
      { q: "Can we customise the cleaning schedule?", a: "Absolutely. We design each cleaning program around your operating hours, specific requirements, and budget." },
      { q: "How do you ensure quality?", a: "Monthly quality audits, client check-ins, and a dedicated account manager who is accountable for your contract." },
    ],
    galleryLabels: ["Office Floor", "Warehouse", "Retail Store", "Restrooms", "Strip & Seal", "Post-Construction"],
    badges: ["ISO 9001", "ISSA Member", "600+ Clients", "12 Years"],
  },

  // ── FibreFresh ───────────────────────────────────────────────────────────────
  "fibrefresh": {
    tagline: "Deep Clean. Like New. Guaranteed.",
    phone: "+44 800 123 4567",
    email: "book@fibrefresh.co.uk",
    address: "Serving London, Surrey & Kent",
    cta: "Get a Free Quote",
    ctaSecondary: "See Our Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#reviews" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "15,000+", label: "Carpets Cleaned" },
      { value: "4.8★", label: "Trustpilot" },
      { value: "24 hr", label: "Dry Time" },
      { value: "8 yr", label: "Experience" },
    ],
    services: [
      { name: "Carpet Steam Cleaning", desc: "Hot water extraction removes deep-set dirt, allergens, and stains — safe for all carpet types.", price: "From £49/room", icon: "🧹", image: "https://images.pexels.com/photos/3855962/pexels-photo-3855962.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Upholstery Cleaning", desc: "Deep clean for sofas, armchairs, dining chairs and fabric headboards — restored and refreshed.", price: "From £59/piece", icon: "🛋️" },
      { name: "Rug Cleaning", desc: "In-situ or off-site rug washing for all rug types including wool, silk, and Persian.", price: "From £35", icon: "🏠" },
      { name: "Stain Treatment", desc: "Specialist stain removal for wine, pet, ink, and other stubborn marks.", price: "From £25", icon: "✨" },
      { name: "Anti-Allergen Treatment", desc: "Sanitisation treatment that eliminates dust mites, bacteria, and allergens from carpets and fabric.", price: "From £30/room", icon: "🌿" },
    ],
    about: {
      heading: "London's Carpet & Upholstery Specialists Since 2016",
      body: "FibreFresh uses professional-grade hot water extraction equipment and eco-certified cleaning agents to restore carpets, rugs, and upholstery to their best condition. Our fully insured technicians are NCCA-trained and use low-moisture techniques that dry within hours, not days.",
      highlights: ["NCCA certified technicians", "Eco-certified cleaning agents", "Low-moisture drying — dry in 2–4 hours", "Fully insured", "Stain protection treatments available"],
      image: "https://images.pexels.com/photos/3855962/pexels-photo-3855962.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Single Room", price: "£49", features: ["1 carpeted room", "Pre-treatment", "Hot water extraction", "Deodorise", "Spot stain treatment"], cta: "Book Now" },
      { name: "Home Package", price: "£149", features: ["Up to 4 rooms", "Landing & stairs included", "Full pre-treatment", "Stain remover applied", "Deodorise & sanitise", "Priority booking"], highlight: true, cta: "Book Now" },
      { name: "Sofa & Carpets", price: "£189", features: ["3-seater sofa", "Up to 3 rooms", "Fabric protector", "Pet odour treatment", "Same-day availability", "3-month stain guarantee"], cta: "Book Now" },
    ],
    testimonials: [
      { name: "Claire H.", location: "Putney, London", text: "Our cream carpet had a massive red wine stain. FibreFresh got it out completely — I genuinely could not believe it. Brilliant service.", rating: 5, initials: "CH" },
      { name: "Mark & Jo T.", location: "Surrey", text: "Three-piece suite was looking tired and smelled of dog. Now it looks and smells brand new. Incredible result, highly recommended.", rating: 5, initials: "MJT" },
      { name: "Deepa M.", location: "Greenwich", text: "Booked for end-of-tenancy carpet clean. Landlord kept the full deposit — FibreFresh saved us hundreds.", rating: 5, initials: "DM" },
    ],
    faqItems: [
      { q: "How long does drying take?", a: "Most carpets are dry within 2–4 hours using our low-moisture technique. We recommend leaving windows open and avoiding heavy foot traffic for 4 hours." },
      { q: "Can you remove pet odours?", a: "Yes — we use specialist enzyme treatments that neutralise pet odours at the source rather than masking them." },
      { q: "Do you move furniture?", a: "We move light furniture (chairs, coffee tables). We ask that you move large items like sofas and beds before our arrival." },
      { q: "Is the treatment safe for children and pets?", a: "Absolutely — all our cleaning agents are eco-certified, non-toxic, and safe once dry." },
    ],
    galleryLabels: ["Before & After Carpet", "Sofa Restore", "Rug Wash", "Stain Removal", "Hallway & Stairs", "Office Carpet"],
    badges: ["NCCA Certified", "Eco Products", "4.8★ Trustpilot", "Fully Insured"],
  },

  // ── FlowMaster ───────────────────────────────────────────────────────────────
  "flowmaster-plumbing": {
    tagline: "Plumbing Problems Solved Fast.",
    phone: "+61 8 6789 0011",
    email: "service@flowmasterplumbing.com.au",
    address: "Serving Greater Perth, WA",
    cta: "Call Now",
    ctaSecondary: "Book Online",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#reviews" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "24/7", label: "Emergency Service" },
      { value: "6,000+", label: "Jobs Completed" },
      { value: "1 hr", label: "Avg Response Time" },
      { value: "15 yr", label: "Experience" },
    ],
    services: [
      { name: "Emergency Plumbing", desc: "Burst pipes, severe leaks, blocked drains — we respond within 60 minutes, 24 hours a day.", price: "From $199 call-out", icon: "🚨", image: "https://images.pexels.com/photos/6463397/pexels-photo-6463397.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Blocked Drains", desc: "High-pressure jet blasting and CCTV drain inspection to clear and diagnose blockages fast.", price: "From $149", icon: "🔧" },
      { name: "Tap & Toilet Repairs", desc: "Fix dripping taps, running toilets, broken cisterns and leaking pipes — same-day service.", price: "From $95", icon: "🚿" },
      { name: "Hot Water Systems", desc: "Supply, install and repair all hot water systems — electric, gas, solar, and heat pump.", price: "From $299", icon: "🌡️" },
      { name: "Pipe Repairs & Relining", desc: "No-dig pipe relining repairs cracked pipes from the inside without excavation.", price: "From $450", icon: "🏗️" },
      { name: "Gas Fitting", desc: "Licensed gas fitting for appliance connections, gas line installations, and leak repairs.", price: "From $150", icon: "🔥" },
    ],
    about: {
      heading: "Perth's Most Trusted Licensed Plumber Since 2009",
      body: "FlowMaster Plumbing has been solving plumbing problems across Greater Perth for 15 years. Our team of fully licensed and insured plumbers offers transparent fixed-price quotes before any work begins — no surprise bills, no hidden charges. Emergency response available within 60 minutes.",
      highlights: ["Fully licensed & insured (PLBLIC)", "Fixed-price quotes upfront", "60-minute emergency response", "All work guaranteed 12 months", "ATCO Gas approved"],
      image: "https://images.pexels.com/photos/6463397/pexels-photo-6463397.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Standard Call-Out", price: "$149", features: ["Business hours", "First 30 mins included", "Fixed-price quote on arrival", "Fully licensed plumber", "12-month warranty"], cta: "Book Now" },
      { name: "Priority Service", price: "$199", features: ["After hours & weekends", "60-min response guaranteed", "All work fixed-price", "Fully stocked van", "Same-day resolution"], highlight: true, cta: "Call Now" },
      { name: "Annual Home Plan", price: "$299", period: "per year", features: ["2× free inspections", "Priority emergency response", "10% off all work", "Water efficiency audit", "Free report"], cta: "Get Started" },
    ],
    team: [
      { name: "Craig Molloy", role: "Master Plumber", bio: "15 years experience. Licensed in plumbing, drainage, and gas fitting across WA.", initials: "CM", color: "#2563eb" },
      { name: "Tyler Barnes", role: "Senior Plumber", bio: "Specialist in hot water systems and pipe relining. 8 years in the field.", initials: "TB", color: "#1d4ed8" },
    ],
    testimonials: [
      { name: "Sandra O.", location: "Subiaco, Perth", text: "Burst pipe at 2am. Craig was there in 45 minutes and fixed it cleanly. Couldn't ask for a better emergency response. Absolute lifesaver.", rating: 5, initials: "SO" },
      { name: "Ben & Tanya F.", location: "Fremantle", text: "Hot water system replaced same day I called. Fixed price quoted on the phone, no surprises. Brilliant service from start to finish.", rating: 5, initials: "BTF" },
      { name: "Helen D.", location: "Joondalup", text: "Blocked drain sorted in 30 minutes with a CCTV camera to show us exactly what the issue was. Very professional and thorough.", rating: 5, initials: "HD" },
    ],
    faqItems: [
      { q: "Do you charge extra for after-hours callouts?", a: "Yes — after-hours and weekend rates are $199 call-out (vs $149 standard). We'll always quote upfront before any work starts." },
      { q: "Are you licensed for gas work?", a: "Yes — our plumbers are licensed for both plumbing and gas fitting (gasfitting licence WA)." },
      { q: "What's your emergency response time?", a: "We aim for 60 minutes across Greater Perth. In most cases, we're with you sooner." },
      { q: "Do you guarantee your work?", a: "All workmanship is guaranteed for 12 months. Parts carry their manufacturer warranty." },
    ],
    galleryLabels: ["Emergency Repair", "Drain Camera", "Hot Water Install", "Pipe Reline", "Tap Replacement", "Gas Fitting"],
    badges: ["Licensed Plumber", "24/7 Emergency", "Fixed Prices", "12-Month Warranty"],
  },

  // ── HeatWave ─────────────────────────────────────────────────────────────────
  "heatwave-hvac": {
    tagline: "Warm Homes. Safe Gas. Expert Service.",
    phone: "+44 800 987 6543",
    email: "engineers@heatwavehvac.co.uk",
    address: "Unit 7, Riverside Trade Park, Manchester M5",
    cta: "Book an Engineer",
    ctaSecondary: "Emergency Gas Call",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Boilers", href: "#boilers" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "24/7", label: "Gas Emergency" },
      { value: "12,000+", label: "Boilers Installed" },
      { value: "Gas Safe", label: "Registered" },
      { value: "10 yr", label: "Warranty Available" },
    ],
    services: [
      { name: "Boiler Installation", desc: "Supply and fit new boilers from Worcester Bosch, Vaillant, and Baxi — with up to 10-year manufacturer warranty.", price: "From £1,500", icon: "🔥", image: "https://images.pexels.com/photos/8961086/pexels-photo-8961086.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Boiler Service", desc: "Annual boiler service to maintain efficiency, safety, and manufacturer warranty. Includes flue test and safety check.", price: "From £79", icon: "🔧" },
      { name: "Boiler Repair", desc: "Fast diagnosis and repair of all boiler faults — fault codes, pressure loss, no hot water, and more.", price: "From £99", icon: "⚡" },
      { name: "Central Heating Installation", desc: "Full central heating systems for new builds, extensions, and homes without existing heating.", price: "From £3,200", icon: "🏠" },
      { name: "Gas Safety Certificate", desc: "Landlord gas safety inspections (CP12) and certificates issued same day.", price: "From £65", icon: "📋" },
      { name: "Power Flush", desc: "Magnetic power flush to remove sludge from radiators — restores heating efficiency and extends boiler life.", price: "From £299", icon: "💧" },
    ],
    about: {
      heading: "Manchester's Gas Safe Heating Specialists",
      body: "HeatWave has been installing, servicing, and repairing boilers and central heating systems across Greater Manchester for 10 years. All our engineers are Gas Safe registered, fully insured, and trained on all major boiler brands. We offer genuine fixed-price quotes with no hidden charges.",
      highlights: ["Gas Safe registered engineers", "All major boiler brands", "Fixed-price quotes", "Up to 10-year boiler warranty", "Same-day emergency response"],
      image: "https://images.pexels.com/photos/8961086/pexels-photo-8961086.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Boiler Service", price: "£79", features: ["Annual service", "Flue & safety check", "Efficiency test", "Digital report", "Gas Safe certificate"], cta: "Book Now" },
      { name: "New Combi Boiler", price: "£1,995", features: ["Supply & fit", "Worcester Bosch 5★ rated", "5-year warranty", "Magnetic filter fitted", "Smart thermostat included", "Gas Safe certificate"], highlight: true, cta: "Get a Quote" },
      { name: "Service Plan", price: "£9.99", period: "per month", features: ["Annual boiler service", "Priority emergency cover", "No call-out charges", "Parts & labour included", "Landlord CP12 included"], cta: "Start Plan" },
    ],
    testimonials: [
      { name: "Paul G.", location: "Didsbury, Manchester", text: "New boiler installed in one day. Engineer was tidy, explained everything, and the Worcester Bosch is running perfectly. Recommended without hesitation.", rating: 5, initials: "PG" },
      { name: "Sarah J.", location: "Salford", text: "Boiler broke on the coldest day of the year. HeatWave had an engineer here in 2 hours. Fixed same day. Absolute stars.", rating: 5, initials: "SJ" },
      { name: "Kevin M.", location: "Stockport", text: "Have been using HeatWave for annual servicing and CP12 certificates for my rental properties for 5 years. Always reliable and competitively priced.", rating: 5, initials: "KM" },
    ],
    faqItems: [
      { q: "Are all your engineers Gas Safe registered?", a: "Yes — every engineer holds a valid Gas Safe registration. You can verify their card ID on the Gas Safe Register website." },
      { q: "Which boiler brands do you install?", a: "We install Worcester Bosch, Vaillant, Baxi, and Viessmann — the most reliable brands with the best warranty programmes." },
      { q: "How long does a new boiler installation take?", a: "Most standard combi boiler replacements are completed within one day." },
      { q: "Do you offer finance?", a: "Yes — 0% interest-free finance is available on new boiler installations through our approved finance partner." },
    ],
    galleryLabels: ["Boiler Install", "Radiator Flush", "Gas Certificate", "System Upgrade", "Smart Thermostat", "Annual Service"],
    badges: ["Gas Safe Registered", "Worcester Accredited", "10-yr Warranty", "Same-Day Emergency"],
  },

  // ── TotalBuilds ──────────────────────────────────────────────────────────────
  "totalbuilds-services": {
    tagline: "All Trades. One Number. Zero Hassle.",
    phone: "+65 9234 5678",
    email: "hello@totalbuilds.sg",
    address: "10 Bukit Merah Central, #06-01, Singapore 159457",
    cta: "Get a Quote",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Projects", href: "#projects" },
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "2,500+", label: "Projects Completed" },
      { value: "20 yr", label: "Experience" },
      { value: "4 Trades", label: "Under One Roof" },
      { value: "HDB Lic.", label: "Registered" },
    ],
    services: [
      { name: "Plumbing", desc: "Installation, repair and maintenance of all plumbing systems — water supply, sanitary, and drainage.", price: "From $95/hr", icon: "💧", image: "https://images.pexels.com/photos/8487544/pexels-photo-8487544.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Electrical Works", desc: "Licensed electrical installations, rewiring, DB upgrades, and fault finding for residential and commercial.", price: "From $95/hr", icon: "⚡" },
      { name: "Air Conditioning", desc: "ACMV installation, servicing, chemical wash, and repair for all brands — residential and commercial.", price: "From $80/unit", icon: "❄️" },
      { name: "General Maintenance", desc: "Comprehensive building maintenance programs covering all M&E systems and general repairs.", price: "Contract basis", icon: "🔧" },
      { name: "Renovation Works", desc: "Full renovation coordination — tiling, carpentry, painting, and all trade installations managed by one team.", price: "Request Quote", icon: "🏗️" },
      { name: "Emergency Callout", desc: "24/7 emergency response for burst pipes, electrical faults, and AC failures.", price: "From $150", icon: "🚨" },
    ],
    about: {
      heading: "Singapore's Multi-Trade Building Services Expert",
      body: "TotalBuilds has been providing integrated building services to residential and commercial clients in Singapore for 20 years. Instead of managing multiple contractors, our clients deal with one team, one invoice, and one point of accountability — covering plumbing, electrical, aircon, and general maintenance.",
      highlights: ["HDB & BCA registered", "Licensed plumbers & electricians", "All-in-one service", "24/7 emergency callout", "ISO-aligned service standards"],
      image: "https://images.pexels.com/photos/8487544/pexels-photo-8487544.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Alex Teo", role: "Managing Director", bio: "20 years in M&E services. Oversees all operations and ensures service quality across all trades.", initials: "AT", color: "#16a34a" },
      { name: "Kumar Rajan", role: "Head of Electrical", bio: "Licensed electrical engineer with 15 years of commercial and residential installations.", initials: "KR", color: "#15803d" },
      { name: "Siti Rahimah", role: "Head of Plumbing", bio: "Senior licensed plumber specialising in large-scale residential and commercial plumbing systems.", initials: "SR", color: "#14532d" },
    ],
    testimonials: [
      { name: "Victor Lim", location: "Ang Mo Kio, Singapore", text: "One call and TotalBuilds handled our full renovation — plumbing, electrical, AC, and painting. No coordination headaches. Brilliant concept.", rating: 5, initials: "VL" },
      { name: "Claire Tan", location: "Tanjong Pagar", text: "Our office M&E maintenance contract with TotalBuilds has been seamless for 2 years. Responsive, professional, fairly priced.", rating: 5, initials: "CT" },
      { name: "Ravi S.", location: "Jurong West", text: "AC chemical wash, new DB box, and toilet cistern replacement — all done in one visit. This is the right way to do building services.", rating: 5, initials: "RS" },
    ],
    faqItems: [
      { q: "Are your tradesmen licensed?", a: "Yes — all our plumbers and electricians hold valid licences issued by PUB and EMA respectively." },
      { q: "Do you work on HDB flats?", a: "Yes — we are an HDB-registered contractor for renovation and maintenance works." },
      { q: "Can we set up a maintenance contract?", a: "Absolutely. We design bespoke maintenance programs for residential estates, commercial buildings, and SME offices." },
      { q: "How fast can you respond to emergencies?", a: "We aim for on-site response within 2 hours for emergencies, 24 hours a day." },
    ],
    galleryLabels: ["Plumbing Install", "Electrical Panel", "AC Servicing", "Office Renovation", "Emergency Repair", "Maintenance Round"],
    badges: ["HDB Registered", "Licensed Trades", "24/7 Emergency", "20 Years"],
  },

  // ── TorqueAuto ───────────────────────────────────────────────────────────────
  "torque-auto": {
    tagline: "Honest Mechanics. Quality Work. No BS.",
    phone: "+61 3 9555 7788",
    email: "service@torqueauto.com.au",
    address: "88 Industrial Drive, Dandenong VIC 3175",
    cta: "Book a Service",
    ctaSecondary: "Get a Quote",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#reviews" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "14,000+", label: "Vehicles Serviced" },
      { value: "18 yr", label: "Experience" },
      { value: "All Makes", label: "& Models" },
      { value: "4.9★", label: "Google Rating" },
    ],
    services: [
      { name: "Log Book Service", desc: "Manufacturer-specified log book servicing that maintains your new car warranty — all makes and models.", price: "From $189", icon: "📋", image: "https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Major Service", desc: "Comprehensive service including filters, fluids, spark plugs, belts, brakes, and full safety check.", price: "From $299", icon: "🔧" },
      { name: "Brakes & Tyres", desc: "Brake pad, rotor, and caliper replacements plus tyre fitting and wheel balancing.", price: "From $149", icon: "🛞" },
      { name: "Engine Diagnostics", desc: "OBD scan, fault code diagnosis, and engine performance check — we find the problem before it becomes costly.", price: "From $99", icon: "💻" },
      { name: "Air Conditioning", desc: "AC gas recharge, leak testing, compressor repair, and cabin filter replacement.", price: "From $120", icon: "❄️" },
      { name: "Pre-Purchase Inspection", desc: "Comprehensive 100-point inspection before you buy a used vehicle — written report included.", price: "From $149", icon: "🔍" },
    ],
    about: {
      heading: "Dandenong's Trusted Independent Workshop Since 2006",
      body: "TorqueAuto was founded on the belief that car owners deserve honest advice and quality workmanship without dealership prices. Our team of certified mechanics works on all makes and models, using genuine and OEM-grade parts. We show you what needs doing, explain why, and never pressure you.",
      highlights: ["Master-tech certified mechanics", "Log book servicing — warranty maintained", "Genuine & OEM-grade parts", "Free digital vehicle report", "Courtesy car available"],
      image: "https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Minor Service", price: "$189", features: ["Engine oil & filter", "Tyre rotation", "Safety check", "Fluid top-ups", "Digital condition report"], cta: "Book Now" },
      { name: "Major Service", price: "$349", features: ["Everything in Minor", "Air & cabin filters", "Brake inspection", "Spark plugs check", "Battery test", "12-month warranty"], highlight: true, cta: "Book Now" },
      { name: "Full Inspection", price: "$199", features: ["100-point check", "OBD diagnostic scan", "Brake & tyre depth", "Steering & suspension", "Detailed written report", "Photo evidence"], cta: "Book Now" },
    ],
    team: [
      { name: "Marco Ricci", role: "Head Mechanic", bio: "18 years of automotive expertise. Master Technician certified across European and Japanese vehicles.", initials: "MR", color: "#ef4444" },
      { name: "Dean Walsh", role: "Senior Technician", bio: "Specialist in engine diagnostics, auto electrical, and brake systems.", initials: "DW", color: "#dc2626" },
    ],
    testimonials: [
      { name: "James F.", location: "Dandenong, Melbourne", text: "Most honest mechanics I've ever dealt with. Told me exactly what needed fixing now vs what could wait. Saved me $400. Brilliant.", rating: 5, initials: "JF" },
      { name: "Maria C.", location: "Springvale", text: "Log book service done properly, warranty intact, and they showed me photos of everything they checked. This is how it should be done.", rating: 5, initials: "MC" },
      { name: "Tom H.", location: "Cranbourne", text: "Bought a used car interstate and had TorqueAuto do a pre-purchase inspection. They found issues the seller didn't disclose. Absolute value.", rating: 5, initials: "TH" },
    ],
    faqItems: [
      { q: "Will servicing here void my new car warranty?", a: "No — log book servicing at an independent workshop complies with Australian Consumer Law and does not void your manufacturer warranty." },
      { q: "Do you use genuine parts?", a: "We use genuine OEM or equivalent-quality parts and always show you the parts used with receipts." },
      { q: "How long does a standard service take?", a: "Most minor services take 1–2 hours. Major services are typically 3–4 hours. We'll confirm timing at booking." },
      { q: "Do you offer a warranty on repairs?", a: "Yes — all repairs carry a 12-month / 20,000km warranty on parts and labour." },
    ],
    galleryLabels: ["Engine Service", "Brake Replacement", "Tyre Fitting", "OBD Diagnostic", "AC Service", "Pre-Purchase Check"],
    badges: ["Master Technician", "Log Book Servicing", "4.9★ Google", "12-Month Warranty"],
  },

  // ── GripZone ─────────────────────────────────────────────────────────────────
  "gripzone-tyres": {
    tagline: "Premium Tyres. Expert Fitting. Fair Price.",
    phone: "+971 4 333 5599",
    email: "hello@gripzonetyres.ae",
    address: "Al Quoz Industrial Area 1, Dubai, UAE",
    cta: "Book Tyre Fitting",
    ctaSecondary: "Check Tyre Prices",
    navLinks: [
      { label: "Tyres", href: "#tyres" },
      { label: "Services", href: "#services" },
      { label: "Brands", href: "#brands" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "50+", label: "Tyre Brands" },
      { value: "25,000+", label: "Tyres Fitted" },
      { value: "Same Day", label: "Fitting" },
      { value: "10 yr", label: "In Dubai" },
    ],
    services: [
      { name: "Tyre Supply & Fit", desc: "All major brands in stock — Michelin, Bridgestone, Pirelli, Continental, and value brands. Same-day fitting.", price: "From AED 189/tyre", icon: "🛞", image: "https://images.pexels.com/photos/257911/pexels-photo-257911.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Wheel Alignment", desc: "Computer-aided 4-wheel alignment to manufacturer specifications — extends tyre life and improves handling.", price: "AED 120", icon: "📐" },
      { name: "Wheel Balancing", desc: "Dynamic wheel balancing on all axles — eliminates vibration and uneven tyre wear.", price: "AED 60", icon: "⚖️" },
      { name: "Puncture Repair", desc: "Professional plug-and-patch puncture repair — safe, permanent fix on all tyre types.", price: "AED 45", icon: "🔧" },
      { name: "Tyre Rotation", desc: "Regular tyre rotation maximises tread life and maintains even wear across all four tyres.", price: "AED 80", icon: "🔄" },
    ],
    about: {
      heading: "Dubai's Go-To Tyre Specialists for 10 Years",
      body: "GripZone has been supplying and fitting tyres across Dubai for a decade. We stock 50+ brands across all vehicle categories — from economy hatchbacks to SUVs and high-performance sports cars. Our expert fitters use state-of-the-art mounting and balancing equipment for a perfect fit every time.",
      highlights: ["50+ tyre brands in stock", "State-of-the-art fitting equipment", "Alignment on computer-aided rigs", "Same-day availability", "Performance tyre specialists"],
      image: "https://images.pexels.com/photos/257911/pexels-photo-257911.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    testimonials: [
      { name: "Omar K.", location: "Jumeirah, Dubai", text: "Best tyre shop in Dubai. Michelin Pilot Sport 4S fitted and balanced perfectly. No vibration, perfect alignment. Great price too.", rating: 5, initials: "OK" },
      { name: "Sarah L.", location: "Dubai Marina", text: "Got a puncture at 6pm. GripZone fitted a new tyre and had me back on the road by 6:45. Fast, professional, fair price.", rating: 5, initials: "SL" },
      { name: "Ahmed R.", location: "Business Bay", text: "Changed all four tyres on my Land Cruiser. Brilliant service, competitive pricing, and the wheel alignment was spot-on.", rating: 5, initials: "AR" },
    ],
    faqItems: [
      { q: "Do you stock run-flat tyres?", a: "Yes — we stock run-flat options for BMW, Mercedes, and other manufacturers that specify them." },
      { q: "How long does tyre fitting take?", a: "A standard 4-tyre change with alignment takes approximately 45–60 minutes." },
      { q: "Can I bring my own tyres to be fitted?", a: "Yes — we charge a fitting-only rate for tyres supplied by the customer." },
      { q: "Do you offer mobile tyre fitting?", a: "We offer mobile fitting for fleet clients and breakdown emergencies within Dubai. Contact us for rates." },
    ],
    galleryLabels: ["Tyre Fitting Bay", "Alignment Rig", "Brand Wall", "Performance Tyres", "SUV Fitting", "Wheel Balancing"],
    badges: ["50+ Brands", "Same-Day Fitting", "10 Years Dubai", "Alignment Certified"],
  },

  // ── PanelCraft ───────────────────────────────────────────────────────────────
  "panelcraft": {
    tagline: "Smash Repairs Done Right. Insurance Approved.",
    phone: "+61 7 3888 9900",
    email: "repairs@panelcraft.com.au",
    address: "22 Trade Street, Rocklea QLD 4106",
    cta: "Get a Repair Quote",
    ctaSecondary: "Book an Assessment",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Insurance", href: "#insurance" },
      { label: "About", href: "#about" },
      { label: "Gallery", href: "#gallery" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "9,000+", label: "Vehicles Repaired" },
      { value: "20 yr", label: "Experience" },
      { value: "All Insurers", label: "Approved" },
      { value: "Lifetime", label: "Repair Warranty" },
    ],
    services: [
      { name: "Smash Repairs", desc: "Full collision and accident repair — from minor dents to major structural damage, restored to factory standard.", price: "Insurance/quote", icon: "🚗", image: "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Panel Beating", desc: "Expert panel reshaping and restoration — removing dents, creases, and damage without panel replacement where possible.", price: "From $150", icon: "🔨" },
      { name: "Auto Painting", desc: "Computer-matched paint mixing and spray booth painting for flawless, factory-matched finishes.", price: "From $350/panel", icon: "🎨" },
      { name: "Paintless Dent Repair", desc: "Hail damage and minor dent removal without paint — cost-effective and factory-finish result.", price: "From $95/dent", icon: "✨" },
      { name: "Insurance Claims", desc: "We manage the insurance claim process from assessment to sign-off — no paperwork stress.", price: "Free assistance", icon: "📋" },
      { name: "Bumper Repairs", desc: "Plastic repair, respray, and replacement of damaged bumpers and trim panels.", price: "From $250", icon: "🛡️" },
    ],
    about: {
      heading: "Brisbane's Most Trusted Panel Beaters Since 2004",
      body: "PanelCraft has been restoring vehicles to showroom condition across Brisbane for 20 years. Our MTA Queensland-accredited workshop uses the latest paint technology and structural repair equipment to return your car to factory specifications — and our lifetime repair warranty backs every job.",
      highlights: ["MTA Queensland accredited", "I-CAR Gold Class workshop", "Computer-matched paint", "Approved repairer — all major insurers", "Lifetime repair warranty"],
      image: "https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Tony Pellegrini", role: "Workshop Manager", bio: "20 years in panel beating. I-CAR Platinum certified with expertise in structural and cosmetic repairs.", initials: "TP", color: "#0ea5e9" },
      { name: "Steve Lawson", role: "Head Painter", bio: "Specialist auto painter with 15 years of spray booth experience and colour-match expertise.", initials: "SL", color: "#0284c7" },
    ],
    testimonials: [
      { name: "Brooke T.", location: "Sunnybank, Brisbane", text: "My car was T-boned and looked written off. PanelCraft restored it perfectly — you'd never know it was in an accident. Lifetime warranty is the real deal.", rating: 5, initials: "BT" },
      { name: "Nathan W.", location: "Moorooka", text: "Got a hail damage assessment done in 20 minutes. They handled the entire insurance claim. Car came back looking new. Outstanding.", rating: 5, initials: "NW" },
      { name: "Karen L.", location: "Acacia Ridge", text: "Minor rear-end damage. Tony fixed the bumper and touched up the paint for a fair price, no insurance needed. Perfectly matched colour.", rating: 5, initials: "KL" },
    ],
    faqItems: [
      { q: "Are you approved by my insurer?", a: "We are approved repairers for NRMA, RACQ, Allianz, Suncorp, AAMI, QBE, and most other major insurers." },
      { q: "How long will repairs take?", a: "Timeframes depend on damage severity and parts availability. We'll give you an accurate timeline at the assessment stage." },
      { q: "Do you provide a courtesy car?", a: "Yes — courtesy vehicles are available for insurance repair customers. Contact us when booking to arrange." },
      { q: "What does the lifetime warranty cover?", a: "Our lifetime warranty covers all workmanship on repairs — paint, panel work, and structural repairs for as long as you own the vehicle." },
    ],
    galleryLabels: ["Before & After", "Paint Match", "Hail Repair", "Structural Repair", "Bumper Respray", "Full Restoration"],
    badges: ["MTA Accredited", "I-CAR Gold Class", "All Insurers", "Lifetime Warranty"],
  },

  // ── Threadline ───────────────────────────────────────────────────────────────
  "threadline": {
    tagline: "Curated Fashion for the Modern Wardrobe.",
    phone: "+44 20 7946 1122",
    email: "hello@threadline.co.uk",
    address: "34 Carnaby Street, London W1F 9PW",
    cta: "Shop Now",
    ctaSecondary: "New Arrivals",
    navLinks: [
      { label: "Women", href: "#women" },
      { label: "Men", href: "#men" },
      { label: "New In", href: "#new" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "2,400+", label: "Styles Available" },
      { value: "120+", label: "Brands Curated" },
      { value: "Free", label: "Returns & Exchange" },
      { value: "4.8★", label: "Customer Rating" },
    ],
    services: [
      { name: "Women's Fashion", desc: "Curated womenswear from emerging and established designers — everyday essentials to statement pieces.", price: "From £29", icon: "👗", image: "https://images.pexels.com/photos/325876/pexels-photo-325876.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Men's Wear", desc: "Smart casual and tailored menswear — shirts, trousers, suits, and weekend essentials.", price: "From £35", icon: "👔" },
      { name: "Accessories", desc: "Bags, belts, scarves, jewellery and footwear to complete every look.", price: "From £19", icon: "👜" },
      { name: "Personal Styling", desc: "Book a 1-hour in-store or virtual styling session — wardrobe audit, outfit building, and curated picks.", price: "£75/session", icon: "✨" },
      { name: "Gift Cards", desc: "The perfect gift for the fashion-lover in your life. Available in any denomination.", price: "From £25", icon: "🎁" },
    ],
    about: {
      heading: "London's Favourite Independent Fashion Boutique",
      body: "Threadline was founded to bring thoughtfully curated fashion to people who care about what they wear. We work with independent designers and ethical brands to bring you pieces that are distinctive, well-made, and worth keeping. Our Carnaby Street flagship is a shopping experience unlike any high-street chain.",
      highlights: ["Independent boutique", "Ethical & sustainable brands", "Free 30-day returns", "Personal styling available", "New arrivals weekly"],
      image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    testimonials: [
      { name: "Chloe H.", location: "Notting Hill, London", text: "My absolute favourite place to shop in London. The curation is impeccable and the staff actually know fashion. Never leave empty-handed.", rating: 5, initials: "CH" },
      { name: "Marcus B.", location: "Shoreditch", text: "Finally found a menswear boutique that gets it right. Quality pieces at reasonable prices, and the styling session was a revelation.", rating: 5, initials: "MB" },
      { name: "Isabelle V.", location: "Chelsea", text: "Bought a dress for a wedding here. Got so many compliments. Beautiful shop, beautifully curated. Will be back every season.", rating: 5, initials: "IV" },
    ],
    faqItems: [
      { q: "Do you offer free returns?", a: "Yes — free returns and exchanges within 30 days of purchase, in-store or by post." },
      { q: "Do you ship internationally?", a: "We ship to Europe, USA, Australia, and UAE. Standard international shipping from £12.99." },
      { q: "How do I book a styling session?", a: "Book via our website or call us. Sessions run 60 minutes and include a personalised lookbook to take home." },
      { q: "Are your brands ethical?", a: "We prioritise brands with ethical sourcing credentials. Over 60% of our range is from certified sustainable brands." },
    ],
    galleryLabels: ["Women's Collection", "Men's Edit", "Accessories", "New Arrivals", "Lookbook", "In-Store Experience"],
    badges: ["Independent Boutique", "Free Returns", "Ethical Brands", "4.8★ Rated"],
  },

  // ── StrideActive ─────────────────────────────────────────────────────────────
  "stride-active": {
    tagline: "Performance Gear for Real Athletes.",
    phone: "+65 6321 8877",
    email: "gear@strideactive.sg",
    address: "313 @ Somerset, #04-22, Singapore 238895",
    cta: "Shop the Collection",
    ctaSecondary: "Find Your Size",
    navLinks: [
      { label: "Gym Wear", href: "#gym" },
      { label: "Running", href: "#running" },
      { label: "Equipment", href: "#equipment" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "500+", label: "Products In-Stock" },
      { value: "30+", label: "Performance Brands" },
      { value: "Free", label: "Shipping Above $80" },
      { value: "4.9★", label: "App Store Rating" },
    ],
    services: [
      { name: "Gym & Training Wear", desc: "Compression tights, training shorts, performance tops and sports bras for every training style.", price: "From $39", icon: "💪", image: "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Running Gear", desc: "Technical running apparel, footwear, GPS watches, and recovery tools.", price: "From $55", icon: "🏃" },
      { name: "Sports Equipment", desc: "Resistance bands, foam rollers, yoga mats, kettlebells, and training accessories.", price: "From $19", icon: "🏋️" },
      { name: "Team Orders", desc: "Custom-branded team kits for sports clubs, corporate teams, and schools. MOQ 10 units.", price: "Custom quote", icon: "🏆" },
      { name: "Expert Fitting", desc: "In-store fitting sessions for running shoes and compression gear with trained staff.", price: "Free", icon: "👟" },
    ],
    about: {
      heading: "Singapore's Favourite Activewear Destination",
      body: "StrideActive was born from a simple frustration: finding genuinely performance-driven activewear in Singapore was too hard. We curate the best technical apparel, footwear, and equipment from global and local brands — all available in-store and online, with expert staff who actually train themselves.",
      highlights: ["30+ performance brands", "Expert fitting service", "Custom team kits", "Free returns within 14 days", "Active community events"],
      image: "https://images.pexels.com/photos/3622608/pexels-photo-3622608.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    testimonials: [
      { name: "Wei Liang C.", location: "Orchard, Singapore", text: "Best activewear store in Singapore. Staff actually understand running and training — got fitted for shoes and the advice was spot on.", rating: 5, initials: "WLC" },
      { name: "Priya N.", location: "Holland Village", text: "Love the curation here. Every brand they stock is genuinely good quality, not just fashionable. My go-to for all training gear.", rating: 5, initials: "PN" },
      { name: "Jason T.", location: "Novena", text: "Got our football club kits done through StrideActive. Quality was excellent and turnaround was faster than quoted. Will be back.", rating: 5, initials: "JT" },
    ],
    faqItems: [
      { q: "Do you offer free shipping?", a: "Yes — free standard shipping on all Singapore orders above $80. Express shipping available for $8." },
      { q: "Can I return activewear?", a: "Yes — unworn items with tags attached can be returned within 14 days for exchange or store credit." },
      { q: "Do you do custom team kits?", a: "Yes — we work with clubs, corporates and schools on custom-branded kits with a minimum order of 10 units." },
      { q: "Are your products authentic?", a: "All products are 100% authentic, sourced directly from brand distributors with full warranty." },
    ],
    galleryLabels: ["Gym Collection", "Running Edit", "Equipment Range", "Team Kits", "New Arrivals", "In-Store Experience"],
    badges: ["30+ Brands", "Expert Fitting", "Authentic Gear", "Free Shipping $80+"],
  },

  // ── WorkSafeGear ─────────────────────────────────────────────────────────────
  "worksafe-gear": {
    tagline: "Safety Gear That Works as Hard as You Do.",
    phone: "+61 1800 234 567",
    email: "orders@worksafegear.com.au",
    address: "15 Distribution Drive, Braeside VIC 3195",
    cta: "Shop Safety Gear",
    ctaSecondary: "Request a Quote",
    navLinks: [
      { label: "PPE", href: "#ppe" },
      { label: "Workwear", href: "#workwear" },
      { label: "Bulk Orders", href: "#bulk" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "3,000+", label: "Products Available" },
      { value: "AS/NZS", label: "Compliant Range" },
      { value: "Same Day", label: "Dispatch" },
      { value: "500+", label: "Business Clients" },
    ],
    services: [
      { name: "Hi-Vis Clothing", desc: "AS/NZS 4602-compliant high-visibility vests, shirts, jackets, and pants — day/night rated.", price: "From $19.95", icon: "🦺", image: "https://images.pexels.com/photos/5325103/pexels-photo-5325103.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Safety Footwear", desc: "Steel cap and composite toe boots and shoes from Blundstone, Redback, Mongrel, and Oliver.", price: "From $89.95", icon: "👷" },
      { name: "Head & Eye Protection", desc: "Hard hats, safety glasses, face shields, and hearing protection — all AS/NZS compliant.", price: "From $8.95", icon: "⛑️" },
      { name: "Gloves & Hand Protection", desc: "Disposable, cut-resistant, chemical, and thermal gloves for every industrial application.", price: "From $4.95/pair", icon: "🧤" },
      { name: "Bulk & Fleet Orders", desc: "Bulk ordering with embroidery/printing, bulk pricing, and dedicated account management.", price: "Custom pricing", icon: "📦" },
    ],
    about: {
      heading: "Australia's Trusted Workwear & Safety Gear Supplier",
      body: "WorkSafeGear supplies high-quality, compliant personal protective equipment and workwear to businesses across Australia. From small trades businesses to large construction companies, our broad range and same-day dispatch ensure your workforce is protected and equipped without delays.",
      highlights: ["AS/NZS compliant full range", "Same-day dispatch", "Bulk order specialists", "Custom embroidery available", "Dedicated trade accounts"],
      image: "https://images.pexels.com/photos/5325103/pexels-photo-5325103.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    testimonials: [
      { name: "Brad F.", location: "Construction Manager, Melbourne", text: "We kit out 80 workers through WorkSafeGear. Delivery is fast, quality is excellent, and our account manager is always available. Perfect supplier.", rating: 5, initials: "BF" },
      { name: "Joanne T.", location: "Facilities Manager, Brisbane", text: "Set up a trade account and the ordering process is incredibly smooth. Hi-vis and safety boots delivered to site next day. Highly recommend.", rating: 5, initials: "JT" },
      { name: "Mike O.", location: "Owner, Electrical Contractor, Perth", text: "Quick, reliable, and great range. Have been ordering PPE through them for 4 years. Never been let down.", rating: 5, initials: "MO" },
    ],
    faqItems: [
      { q: "Are all products AS/NZS compliant?", a: "Yes — all safety products in our range are tested and certified to relevant Australian/New Zealand standards." },
      { q: "Do you offer bulk pricing?", a: "Yes — trade accounts receive tiered bulk pricing. Contact us for a quote on orders over 20 units." },
      { q: "Can you add our logo to workwear?", a: "Yes — we offer embroidery and screen printing on most workwear items. Minimum order applies." },
      { q: "How fast do you ship?", a: "Orders placed before 2pm ship same day via overnight and express freight options nationally." },
    ],
    galleryLabels: ["Hi-Vis Range", "Safety Boots", "Hard Hats", "Gloves & PPE", "Team Uniforms", "Bulk Order"],
    badges: ["AS/NZS Compliant", "Same-Day Dispatch", "Trade Accounts", "500+ Businesses"],
  },

  // ── WanderWay ────────────────────────────────────────────────────────────────
  "wanderway": {
    tagline: "Your World. Your Way. Let's Go.",
    phone: "+971 4 456 7890",
    email: "travel@wanderway.ae",
    address: "Level 8, Emaar Square, Downtown Dubai, UAE",
    cta: "Plan My Trip",
    ctaSecondary: "Browse Packages",
    navLinks: [
      { label: "Packages", href: "#packages" },
      { label: "Destinations", href: "#destinations" },
      { label: "About", href: "#about" },
      { label: "Testimonials", href: "#reviews" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "15,000+", label: "Happy Travellers" },
      { value: "120+", label: "Destinations" },
      { value: "12 yr", label: "In Business" },
      { value: "IATA", label: "Accredited" },
    ],
    services: [
      { name: "Holiday Packages", desc: "Fully tailored holiday packages including flights, hotels, transfers, and guided experiences — all in one price.", price: "From AED 2,999/pp", icon: "✈️", image: "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Flight Booking", desc: "Best-price flight search across all major carriers — economy, business, and first class worldwide.", price: "No booking fee", icon: "🛫" },
      { name: "Hotel & Resort Stays", desc: "Handpicked hotels and resorts at all price points — exclusive negotiated rates not available online.", price: "Best rate guarantee", icon: "🏨" },
      { name: "Honeymoon Packages", desc: "Romantic, personalised honeymoon itineraries to the world's most stunning destinations.", price: "From AED 5,999/couple", icon: "💑" },
      { name: "Group Travel", desc: "Customised group tours and corporate travel — 10+ people, full coordination and group rates.", price: "Custom quote", icon: "👥" },
      { name: "Visa Assistance", desc: "Visa application guidance and documentation support for all popular travel destinations.", price: "From AED 150", icon: "📋" },
    ],
    about: {
      heading: "Dubai's Trusted Travel Specialists for 12 Years",
      body: "WanderWay was built for travellers who want more than just a flight and a hotel. Our team of destination specialists craft personalised journeys that match your style, budget, and wish list. From last-minute getaways to once-in-a-lifetime adventures, we handle every detail so you travel stress-free.",
      highlights: ["IATA accredited agency", "120+ destination experts", "Best price guarantee", "24/7 travel support", "No hidden fees"],
      image: "https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Weekend Escape", price: "AED 2,999", period: "per person", features: ["3 nights hotel", "Return flights", "Airport transfers", "Breakfast daily", "24/7 support"], cta: "Book Now" },
      { name: "Holiday Package", price: "AED 5,499", period: "per person", features: ["7 nights hotel", "Return flights", "All transfers", "Guided city tour", "Travel insurance", "Dedicated agent"], highlight: true, cta: "Get Itinerary" },
      { name: "Luxury Tailor-Made", price: "Custom", features: ["Fully bespoke", "5-star properties", "Business class upgrade", "Private transfers", "Concierge service", "Pre-trip planning call"], cta: "Call Us" },
    ],
    testimonials: [
      { name: "Rania Al Sayed", location: "Dubai", text: "WanderWay planned our honeymoon to the Maldives. Every single detail was perfect — the villa, transfers, dining. Genuinely magical.", rating: 5, initials: "RAS" },
      { name: "James & Fiona C.", location: "Abu Dhabi", text: "Third holiday booked through WanderWay. They always find better deals than we can ourselves and the personal service is excellent.", rating: 5, initials: "JFC" },
      { name: "Khaled M.", location: "Sharjah", text: "Organised a group trip of 18 people to Istanbul. Flawless logistics, great hotel, excellent guiding. Will absolutely use again.", rating: 5, initials: "KM" },
    ],
    faqItems: [
      { q: "Do you charge booking fees?", a: "No — our service is free to you. We earn commission from our travel partners, which we use to secure better rates for clients." },
      { q: "Can you match online prices?", a: "In most cases we beat them. We have exclusive contracted rates with hotels and airlines not available on booking sites." },
      { q: "What if my travel plans change?", a: "We manage all amendments, rebookings, and cancellations on your behalf. We're your advocate with airlines and hotels." },
      { q: "Do you arrange travel insurance?", a: "Yes — we offer comprehensive travel insurance from leading providers, including COVID cover and medical evacuation." },
    ],
    galleryLabels: ["Maldives", "Europe Tour", "Safari", "Cruise", "City Break", "Family Holiday"],
    badges: ["IATA Accredited", "12 Years", "Best Price Guarantee", "15,000+ Travellers"],
  },

  // ── TrailBlaze ───────────────────────────────────────────────────────────────
  "trailblaze-tours": {
    tagline: "Small Groups. Big Adventures. Real Experiences.",
    phone: "+61 2 8765 4321",
    email: "adventures@trailblazetours.com.au",
    address: "Suite 12, 88 Pitt Street, Sydney NSW 2000",
    cta: "Explore Tours",
    ctaSecondary: "Custom Itinerary",
    navLinks: [
      { label: "Tours", href: "#tours" },
      { label: "Destinations", href: "#destinations" },
      { label: "About", href: "#about" },
      { label: "Reviews", href: "#reviews" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "250+", label: "Tours Operated" },
      { value: "18 Countries", label: "Destinations" },
      { value: "Max 12", label: "Group Size" },
      { value: "4.9★", label: "TripAdvisor" },
    ],
    services: [
      { name: "Guided Group Tours", desc: "Expert-led small group tours — maximum 12 travellers for a genuine, immersive experience.", price: "From $1,499/pp", icon: "🗺️", image: "https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Adventure Expeditions", desc: "Trekking, kayaking, cycling, and wilderness expeditions led by experienced outdoor guides.", price: "From $1,999/pp", icon: "🏔️" },
      { name: "Eco-Tourism Tours", desc: "Sustainable wildlife and nature experiences — private reserves, marine sanctuaries, and conservation projects.", price: "From $1,799/pp", icon: "🌿" },
      { name: "Private Custom Tours", desc: "Fully tailored private itineraries for couples, families, or corporate groups — your schedule, your pace.", price: "From $3,500", icon: "🎯" },
      { name: "Day Tours", desc: "Curated single-day experiences from major cities — perfect add-ons or standalone adventures.", price: "From $199/pp", icon: "🌅" },
    ],
    about: {
      heading: "Australia's Premium Small-Group Tour Operator",
      body: "TrailBlaze was founded because we believed the best travel experiences happen in small groups with knowledgeable guides — not in 50-person coaches. Every tour is capped at 12 travellers, led by expert local guides, and designed to take you beyond the tourist trail to experience destinations authentically.",
      highlights: ["Max 12 per group", "Expert local guides", "Sustainable travel practices", "Inclusive pricing model", "4.9★ TripAdvisor rating"],
      image: "https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Jake Thornton", role: "Founder & Lead Guide", bio: "Adventurer and certified wilderness guide. Has led tours across 40 countries on 6 continents.", initials: "JT", color: "#22c55e" },
      { name: "Maya Patel", role: "Tour Operations", bio: "Coordinates logistics for all tours and ensures every itinerary runs flawlessly.", initials: "MP", color: "#16a34a" },
    ],
    testimonials: [
      { name: "Caroline F.", location: "Brisbane", text: "Did the Patagonia trekking expedition. One of the best experiences of my life. Jake was an exceptional guide — knowledgeable, funny, and genuinely passionate.", rating: 5, initials: "CF" },
      { name: "David & Ruth P.", location: "Melbourne", text: "Small group made all the difference. We made genuine friendships and the access to places other tourists can't get to was incredible.", rating: 5, initials: "DRP" },
      { name: "Sam K.", location: "Sydney", text: "Third TrailBlaze tour. They keep raising the bar. The Morocco desert camp was absolutely extraordinary. Already booked my fourth.", rating: 5, initials: "SK" },
    ],
    faqItems: [
      { q: "What's included in tour prices?", a: "All accommodation, ground transport, guided activities, and most meals are included. Flights are typically not included unless stated." },
      { q: "What's the maximum group size?", a: "We cap all group tours at 12 travellers. Private tours can be arranged for any size." },
      { q: "What fitness level is required?", a: "Each tour has a clearly rated fitness level from 1 (easy) to 5 (challenging). We'll help you find the right fit." },
      { q: "Is travel insurance required?", a: "Yes — comprehensive travel insurance with adventure sports cover is mandatory for all TrailBlaze tours." },
    ],
    galleryLabels: ["Patagonia Trek", "Morocco Desert", "Bali Eco Tour", "Japan Discovery", "African Safari", "New Zealand Adventure"],
    badges: ["Max 12 Group", "4.9★ TripAdvisor", "Eco Certified", "18 Countries"],
  },

  // ── VisaBridge ───────────────────────────────────────────────────────────────
  "visabridge": {
    tagline: "Expert Migration Advice. Real Outcomes.",
    phone: "+61 3 8765 9900",
    email: "consult@visabridge.com.au",
    address: "Level 12, 360 Collins Street, Melbourne VIC 3000",
    cta: "Book a Consultation",
    ctaSecondary: "Check Visa Options",
    navLinks: [
      { label: "Visa Types", href: "#visas" },
      { label: "Process", href: "#process" },
      { label: "About", href: "#about" },
      { label: "Success Stories", href: "#stories" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "4,800+", label: "Visas Granted" },
      { value: "98%", label: "Success Rate" },
      { value: "15 yr", label: "Experience" },
      { value: "MARA", label: "Registered" },
    ],
    services: [
      { name: "Skilled Worker Visas", desc: "Subclass 189, 190, and 491 skilled migration — assessment, nomination, and full application management.", price: "From $2,500", icon: "🎓", image: "https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Partner & Family Visas", desc: "Spouse, partner, and family reunion visas — guiding you through one of Australia's most complex visa streams.", price: "From $2,000", icon: "👨‍👩‍👧" },
      { name: "Student Visas", desc: "Student visa applications and Genuine Temporary Entrant (GTE) statement preparation.", price: "From $800", icon: "📚" },
      { name: "Employer Sponsorship", desc: "Subclass 482 TSS visas and DAMA agreements for employers and sponsored workers.", price: "From $3,500", icon: "🏢" },
      { name: "Citizenship Applications", desc: "Australian citizenship by conferral — eligibility check, application lodgement, and interview preparation.", price: "From $1,200", icon: "🌏" },
      { name: "Visa Review & Appeals", desc: "Merits and judicial review for refused visa applications and cancellation decisions.", price: "From $3,000", icon: "⚖️" },
    ],
    about: {
      heading: "Melbourne's Most Trusted Registered Migration Agents",
      body: "VisaBridge has been helping individuals, families, and businesses navigate Australia's complex immigration system for 15 years. Every client works directly with a MARA-registered agent — no juniors, no outsourcing. Our 98% success rate reflects our rigorous approach to case preparation.",
      highlights: ["MARA registered agents", "98% visa grant success rate", "4,800+ visas granted", "Direct agent access always", "Free eligibility assessment"],
      image: "https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Dr. Rachel Kim", role: "Principal Migration Agent", bio: "MARA-registered with 15 years experience. Former Dept. of Home Affairs reviewer. Over 2,000 visas granted.", initials: "RK", color: "#4f46e5" },
      { name: "Michael Torres", role: "Senior Migration Agent", bio: "Specialist in employer sponsorship and skilled migration streams. 800+ successful applications.", initials: "MT", color: "#4338ca" },
    ],
    testimonials: [
      { name: "Priya & Anand S.", location: "Melbourne", text: "Rachel managed our entire partner visa process from start to finish. Communication was excellent and our visa was granted without a single request for further information.", rating: 5, initials: "PAS" },
      { name: "Thomas Wei", location: "Sydney", text: "Got refused elsewhere. VisaBridge lodged a review and we were granted in 4 months. Wish we'd come here first. Exceptional expertise.", rating: 5, initials: "TW" },
      { name: "GreenLeaf Pty Ltd", location: "Brisbane", text: "Our go-to agency for all employee sponsorship visas. Professional, efficient, and the success rate speaks for itself.", rating: 5, initials: "GL" },
    ],
    faqItems: [
      { q: "Do I need a migration agent?", a: "You can apply yourself, but Australian immigration law is complex and errors are costly. Our 98% success rate vs the 60% DIY rate speaks for itself." },
      { q: "How long does a visa take?", a: "Processing times vary by visa type. We'll give you an accurate timeline at your consultation and keep you updated throughout." },
      { q: "What if my visa is refused?", a: "We handle refusals through the AAT and Federal Court. We also offer a case review to identify what went wrong and the best path forward." },
      { q: "Can you assess my eligibility for free?", a: "Yes — we offer a free 15-minute eligibility assessment by phone or online to determine which visa options are available to you." },
    ],
    galleryLabels: ["Visa Grant", "Skills Assessment", "Partner Visa", "Citizenship", "Employer Sponsorship", "Client Success"],
    badges: ["MARA Registered", "98% Success Rate", "4,800+ Visas", "Free Assessment"],
  },

  // ── TableFare ────────────────────────────────────────────────────────────────
  "tablefare": {
    tagline: "Food Worth Gathering For.",
    phone: "+44 161 555 8822",
    email: "reservations@tablefare.co.uk",
    address: "12 Northern Quarter, Manchester M4 1HZ",
    cta: "Reserve a Table",
    ctaSecondary: "View Our Menu",
    navLinks: [
      { label: "Menu", href: "#menu" },
      { label: "Reservations", href: "#book" },
      { label: "Events", href: "#events" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "200+", label: "Covers Per Night" },
      { value: "4.8★", label: "TripAdvisor" },
      { value: "10 yr", label: "Neighbourhood Favourite" },
      { value: "100%", label: "Fresh Daily" },
    ],
    services: [
      { name: "Dine-In", desc: "Relaxed, welcoming dining — seasonal British cuisine with a modern twist, served in a warm and vibrant space.", price: "Mains from £14", icon: "🍽️", image: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Sunday Roast", desc: "Our legendary Sunday roast — slow-cooked meats, seasonal veg, Yorkshire puddings, and proper gravy.", price: "From £18/person", icon: "🥩" },
      { name: "Private Dining", desc: "Private dining room for 10–30 guests — set menu options and full event coordination available.", price: "From £40/head", icon: "🎉" },
      { name: "Takeaway & Click & Collect", desc: "Order online for collection — full menu available takeaway with eco-friendly packaging.", price: "Order online", icon: "📦" },
      { name: "Weekend Brunch", desc: "Saturday and Sunday brunch 10am–3pm — eggs, pancakes, smashed avocado, and bottomless coffee.", price: "From £9", icon: "☕" },
    ],
    about: {
      heading: "Manchester's Favourite Neighbourhood Restaurant Since 2014",
      body: "TableFare was opened with a simple goal: to be the kind of restaurant that people come back to every week. We cook from scratch every day using seasonal, locally sourced ingredients. No shortcuts. No frozen deliveries. Just honest, flavourful food served in a space that feels like home.",
      highlights: ["Seasonal, locally sourced menu", "Cooked fresh daily", "Private dining available", "Vegetarian & vegan options", "Children welcome"],
      image: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Chef Tom Riordan", role: "Head Chef & Co-Owner", bio: "Trained at The Ivy. 20 years of kitchen experience, passionate about seasonal British cuisine.", initials: "TR", color: "#dc2626" },
      { name: "Ellie James", role: "Front of House Manager", bio: "Creates the warm, welcoming atmosphere that keeps guests coming back week after week.", initials: "EJ", color: "#b91c1c" },
    ],
    testimonials: [
      { name: "Angela S.", location: "Didsbury, Manchester", text: "The Sunday roast here is the best in Manchester — full stop. We've tried everywhere and TableFare wins every time. Book ahead, it fills up fast.", rating: 5, initials: "AS" },
      { name: "Rob & Claire T.", location: "Chorlton", text: "Our anniversary dinner was perfect. Staff were attentive without being intrusive, food was exceptional. Exactly what a special meal should be.", rating: 5, initials: "RCT" },
      { name: "Zoe H.", location: "Ancoats", text: "Love this place. It's become our weekly ritual — good food, good atmosphere, and staff who actually know your name after a few visits.", rating: 5, initials: "ZH" },
    ],
    faqItems: [
      { q: "Do I need to book?", a: "We recommend booking for dinner and Sunday lunch as we fill up quickly. Walk-ins welcome for brunch and early weekday evenings." },
      { q: "Do you cater for dietary requirements?", a: "Yes — we have full vegetarian, vegan, and gluten-free menus. Please let us know at booking and we'll take care of you." },
      { q: "Can I hire the private dining room?", a: "Yes — our private room seats 10–30 and can be booked for birthdays, anniversaries, and business dinners." },
      { q: "Do you have parking?", a: "Street parking is available on Northern Quarter side streets. The NCP at Arndale is a 5-minute walk." },
    ],
    galleryLabels: ["Sunday Roast", "Weekend Brunch", "Seasonal Menu", "Private Dining", "Bar & Cocktails", "The Kitchen"],
    badges: ["4.8★ TripAdvisor", "Locally Sourced", "Fresh Daily", "Since 2014"],
  },

  // ── BeanCraft ────────────────────────────────────────────────────────────────
  "beancraft-cafe": {
    tagline: "Specialty Coffee. Good Food. Great Vibes.",
    phone: "+65 8234 5678",
    email: "hello@beancraftcafe.sg",
    address: "22 Ann Siang Hill, Singapore 069702",
    cta: "Find Us",
    ctaSecondary: "Our Menu",
    navLinks: [
      { label: "Menu", href: "#menu" },
      { label: "Coffee", href: "#coffee" },
      { label: "Catering", href: "#catering" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "Single Origin", label: "Beans Roasted In-House" },
      { value: "200+", label: "Cups Daily" },
      { value: "All Day", label: "Brunch Menu" },
      { value: "4.9★", label: "Google Rating" },
    ],
    services: [
      { name: "Specialty Coffee", desc: "Single-origin espresso, pour-over, and cold brew — roasted in-house and brewed by certified baristas.", price: "From $5.50", icon: "☕", image: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "All-Day Brunch", desc: "Avocado toast, eggs benedict, granola bowls, and weekend specials — served until 4pm.", price: "From $14", icon: "🥑" },
      { name: "Pastries & Cakes", desc: "Freshly baked daily — croissants, banana bread, seasonal tarts, and house-made cakes.", price: "From $5", icon: "🥐" },
      { name: "Corporate Catering", desc: "Office catering packages — boxed brunch sets, coffee stations, and working lunch platters.", price: "From $18/pax", icon: "🏢" },
      { name: "Retail Beans", desc: "Take home our house blends and single-origins — available whole bean and ground, 250g bags.", price: "From $22", icon: "🫘" },
    ],
    about: {
      heading: "Ann Siang's Favourite Specialty Coffee Spot",
      body: "BeanCraft was born from a deep love of exceptional coffee and honest food. We source our beans directly from farms in Ethiopia, Colombia, and Sumatra, roast them weekly in-house, and brew every cup with care. Our all-day brunch menu is built around quality ingredients and real comfort food.",
      highlights: ["In-house single-origin roasting", "Certified SCA baristas", "Locally sourced ingredients", "Sustainable packaging", "Dog-friendly outdoor seating"],
      image: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Dylan Tay", role: "Head Barista & Founder", bio: "World Barista Championship qualifier. 10 years in specialty coffee across Singapore, Melbourne, and Tokyo.", initials: "DT", color: "#f59e0b" },
      { name: "Jess Lim", role: "Head Chef", bio: "Creates the all-day brunch menu from scratch daily. Passionate about seasonal, locally sourced ingredients.", initials: "JL", color: "#d97706" },
    ],
    testimonials: [
      { name: "Amanda K.", location: "Tanjong Pagar", text: "Best flat white in Singapore, hands down. The Ethiopian single origin they're running right now is extraordinary. My weekly ritual.", rating: 5, initials: "AK" },
      { name: "Chris and Mae T.", location: "Duxton Hill", text: "Came for brunch and stayed for three hours. Eggs benny was outstanding, coffee was exceptional, and the vibe is exactly what you want on a Saturday morning.", rating: 5, initials: "CMT" },
      { name: "Raj N.", location: "Marina Bay", text: "Ordered BeanCraft catering for our team event. 40 people, and the coffee station was the highlight of the day. Professional setup and great quality.", rating: 5, initials: "RN" },
    ],
    faqItems: [
      { q: "What coffee beans do you use?", a: "We roast our own single-origin beans in-house weekly. Current origins are featured on our chalkboard and website." },
      { q: "Do you have non-dairy milk options?", a: "Yes — oat, almond, soy, and coconut milk available at no extra charge." },
      { q: "Do you take reservations?", a: "We're walk-in only for cafe seating. For private events and corporate catering, advance booking is required." },
      { q: "Can I buy your beans online?", a: "Yes — order online at beancraftcafe.sg for same-week delivery across Singapore." },
    ],
    galleryLabels: ["Pour Over", "Brunch Spread", "Pastry Case", "The Bar", "Roasting Room", "Outdoor Seating"],
    badges: ["In-House Roasted", "SCA Certified", "4.9★ Google", "All-Day Brunch"],
  },

  // ── StreetBite ───────────────────────────────────────────────────────────────
  "streetbite": {
    tagline: "Bold Street Food. No Compromises.",
    phone: "+61 4 3456 7890",
    email: "orders@streetbite.com.au",
    address: "Find us on Instagram @streetbitemelbourne",
    cta: "Order Online",
    ctaSecondary: "Find the Truck",
    navLinks: [
      { label: "Menu", href: "#menu" },
      { label: "Order", href: "#order" },
      { label: "Find Us", href: "#location" },
      { label: "Catering", href: "#catering" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "5,000+", label: "Orders Monthly" },
      { value: "4.9★", label: "Google Rating" },
      { value: "7 Days", label: "A Week" },
      { value: "15 min", label: "Order Ready" },
    ],
    services: [
      { name: "Online Ordering", desc: "Order ahead from our full menu — ready in 15 minutes for pickup at the truck or nearest hub.", price: "From $12", icon: "📱", image: "https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Signature Loaded Burgers", desc: "House-made smash burgers, double patties, and loaded fries — always fresh, never frozen.", price: "From $16", icon: "🍔" },
      { name: "Asian Street Bowls", desc: "Banh mi bowls, Korean BBQ rice, and laksa noodles — bold flavours inspired by Asian street markets.", price: "From $14", icon: "🍜" },
      { name: "Event Catering", desc: "Bring the StreetBite truck to your event — corporate, festival, or private party. Min. 50 serves.", price: "From $1,500", icon: "🎉" },
      { name: "Meal Deals", desc: "Combo deals for big groups — feed 4, 6, or 10 with shareable trays, sides, and drinks.", price: "From $49", icon: "🛒" },
    ],
    about: {
      heading: "Melbourne's Boldest Food Truck Since 2018",
      body: "StreetBite started as a single truck at the Fitzroy Night Market and has grown into Melbourne's most loved street food brand. Our menu is inspired by the bold flavours of Asian and American street food — made with real, fresh ingredients and absolutely no shortcuts. Find us in your neighbourhood 7 days a week.",
      highlights: ["Fresh ingredients daily", "No frozen proteins", "Online pre-order — skip the queue", "Private event catering", "Vegan and GF options"],
      image: "https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    testimonials: [
      { name: "Liam O.", location: "Fitzroy, Melbourne", text: "The smash burger is genuinely one of the best things I've eaten in Melbourne. And I've eaten a lot of burgers. Unreal.", rating: 5, initials: "LO" },
      { name: "Hannah C.", location: "Collingwood", text: "Ordered online and it was ready in 12 minutes. Korean BBQ bowl was incredible — fresh, generous portion, perfect price.", rating: 5, initials: "HC" },
      { name: "Tim & Sarah V.", location: "Richmond", text: "Had StreetBite cater our work Christmas party. 80 people, all raving about the food. Setup was professional and the team were brilliant.", rating: 5, initials: "TSV" },
    ],
    faqItems: [
      { q: "Where can I find the truck today?", a: "Our location is updated daily on Instagram @streetbitemelbourne and on the app. We're also at 4 fixed locations Monday–Friday." },
      { q: "Can I pre-order online?", a: "Yes — pre-order through our website or app. Your order will be ready in 15 minutes from your selected pickup time." },
      { q: "Do you cater private events?", a: "Yes — we bring the full truck to your event. Minimum 50 serves. Contact us at least 2 weeks in advance to check availability." },
      { q: "Are there vegetarian or vegan options?", a: "Yes — we have dedicated vegan and vegetarian options on all menus, including a vegan smash burger that's genuinely incredible." },
    ],
    galleryLabels: ["Smash Burger", "Korean Bowl", "Loaded Fries", "Event Catering", "The Truck", "Night Market"],
    badges: ["4.9★ Google", "7 Days/Week", "Online Pre-Order", "Event Catering"],
  },

  // ── Lumiere ──────────────────────────────────────────────────────────────────
  "lumiere-salon": {
    tagline: "Where Beauty Meets Artistry.",
    phone: "+65 6789 2211",
    email: "book@lumieresalon.sg",
    address: "26 Dempsey Hill, Singapore 249679",
    cta: "Book Your Appointment",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "Hair", href: "#hair" },
      { label: "Nails", href: "#nails" },
      { label: "Beauty", href: "#beauty" },
      { label: "About", href: "#about" },
      { label: "Book", href: "#book" },
    ],
    stats: [
      { value: "12,000+", label: "Happy Clients" },
      { value: "15 yr", label: "Experience" },
      { value: "4.9★", label: "Google Rating" },
      { value: "Kerastase", label: "Signature Partner" },
    ],
    services: [
      { name: "Hair Styling & Cuts", desc: "Precision cuts, blowouts, and styling from our senior stylists — tailored to your face shape and lifestyle.", price: "From $85", icon: "✂️", image: "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Colour & Highlights", desc: "Balayage, ombré, full colour, and creative colouring — using Kerastase and L'Oréal professional range.", price: "From $180", icon: "🎨" },
      { name: "Hair Treatment", desc: "Deep conditioning, keratin smoothing, and Olaplex bond restoration treatments.", price: "From $120", icon: "💆" },
      { name: "Nail Art & Manicure", desc: "Gel, acrylic, and nail art services — from classic French to bespoke nail designs.", price: "From $55", icon: "💅" },
      { name: "Lash & Brow", desc: "Lash extensions, lifts, brow shaping, henna brows, and microblading consultations.", price: "From $80", icon: "✨" },
      { name: "Bridal Package", desc: "Full bridal beauty packages including trial session, wedding day hair and makeup, and bridesmaid pricing.", price: "From $450", icon: "👰" },
    ],
    about: {
      heading: "Dempsey Hill's Most Loved Premium Beauty Salon",
      body: "Lumiere was founded 15 years ago with one purpose: to create a beauty experience that leaves every client feeling genuinely transformed. Our team of award-winning stylists and beauty therapists combine technical mastery with a personalised approach — because no two clients are the same.",
      highlights: ["Kerastase Signature Partner", "Award-winning stylists", "Bridal specialist team", "Online booking available", "Premium private treatment rooms"],
      image: "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Refresh", price: "$85", features: ["Wash, cut & blowdry", "Scalp massage", "Product recommendation", "Next visit discount"], cta: "Book Now" },
      { name: "Transform", price: "$280", features: ["Cut & colour", "Balayage or highlights", "Olaplex treatment", "Blowout & style", "Complimentary drink", "Priority booking"], highlight: true, cta: "Book Now" },
      { name: "Bridal", price: "$450", features: ["Trial session", "Wedding day hair", "Wedding day makeup", "Bridal consultation", "Bridesmaid pricing", "On-location available"], cta: "Enquire Now" },
    ],
    team: [
      { name: "Chloe Tan", role: "Creative Director", bio: "15 years in luxury salons across Singapore and London. Specialist in colour and bridal styling.", initials: "CT", color: "#ec4899" },
      { name: "Rachel Yip", role: "Senior Stylist", bio: "International colour educator and Kerastase specialist. Known for her signature balayage technique.", initials: "RY", color: "#db2777" },
      { name: "Sophie Lim", role: "Beauty Therapist", bio: "Certified lash and brow specialist. Over 3,000 lash extension sets completed.", initials: "SL", color: "#ec4899" },
    ],
    testimonials: [
      { name: "Vanessa H.", location: "Bukit Timah, Singapore", text: "Chloe has been doing my hair for 8 years. I wouldn't go anywhere else. The balayage she creates is consistently stunning — always gets complimented.", rating: 5, initials: "VH" },
      { name: "Rachel K.", location: "Holland Village", text: "Got my wedding hair and makeup done at Lumiere. The trial was perfect, and on the day I felt genuinely beautiful. Worth every dollar.", rating: 5, initials: "RK" },
      { name: "Lisa M.", location: "Dempsey Hill", text: "Best nail art in Singapore. Sophie's work is extraordinary — precise, creative, and long-lasting. My nails are always a talking point.", rating: 5, initials: "LM" },
    ],
    faqItems: [
      { q: "Do I need to book in advance?", a: "We recommend booking at least 3 days ahead for weekend appointments. Weekday slots are usually available with 24-hour notice." },
      { q: "Do you offer bridal trials?", a: "Yes — bridal trials are mandatory and held 4–6 weeks before the wedding date. This is included in all bridal packages." },
      { q: "What hair colour products do you use?", a: "We use Kerastase, L'Oréal Professionnel, and Olaplex for all colour and treatment services." },
      { q: "Do you have parking?", a: "Yes — Dempsey Hill has ample free parking. We're in Block 26, easily accessible from Napier Road." },
    ],
    galleryLabels: ["Balayage", "Bridal Hair", "Nail Art", "Lash Extensions", "Colour Correction", "Hair Treatments"],
    badges: ["Kerastase Partner", "15 Years", "Bridal Specialist", "4.9★ Google"],
  },

  // ── FadeShop ─────────────────────────────────────────────────────────────────
  "fade-barbershop": {
    tagline: "Sharp. Clean. Confident.",
    phone: "+971 50 333 9988",
    email: "cuts@fadeshop.ae",
    address: "Shop 4, City Walk Phase 2, Dubai",
    cta: "Book Your Cut",
    ctaSecondary: "View Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "Our Barbers", href: "#team" },
      { label: "Gallery", href: "#gallery" },
      { label: "Book", href: "#book" },
    ],
    stats: [
      { value: "500+", label: "Cuts Per Week" },
      { value: "7 yr", label: "In Dubai" },
      { value: "8 Barbers", label: "On the Floor" },
      { value: "4.9★", label: "Google Rating" },
    ],
    services: [
      { name: "The Classic Cut", desc: "Precision haircut tailored to your style — fade, taper, scissor cut, or textured crop.", price: "AED 75", icon: "✂️", image: "https://images.pexels.com/photos/3997990/pexels-photo-3997990.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Beard Trim & Shape", desc: "Detailed beard shaping, line-up, and beard oil treatment — sculpted and set.", price: "AED 60", icon: "🧔" },
      { name: "Cut & Beard Combo", desc: "The full package — precision haircut plus beard shape. Our most popular booking.", price: "AED 120", icon: "💈" },
      { name: "Hot Towel Shave", desc: "Traditional straight-razor shave with hot towel, pre-shave oil, and aftershave treatment.", price: "AED 90", icon: "🪒" },
      { name: "Kids Cut (Under 12)", desc: "Patient, friendly haircuts for boys — classic and fade styles available.", price: "AED 55", icon: "👦" },
    ],
    about: {
      heading: "Dubai's Sharpest Barbershop Since 2017",
      body: "FadeShop opened at City Walk in 2017 and quickly became Dubai's most talked-about barbershop. Our team of 8 international barbers specialise in fades, tapers, and beard grooming — bringing influences from London, New York, and Beirut to create cuts that are always on point.",
      highlights: ["8 master barbers", "All techniques mastered", "Walk-ins welcome", "Appointment booking online", "Premium grooming products in-house"],
      image: "https://images.pexels.com/photos/3997990/pexels-photo-3997990.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Carlos Rivera", role: "Head Barber", bio: "Master fade specialist from New York. 15 years experience, known for his signature skin fades.", initials: "CR", color: "#fbbf24" },
      { name: "Ahmad Karimi", role: "Senior Barber", bio: "Beard shaping and classic barbering specialist from Beirut. Featured in GQ Middle East.", initials: "AK", color: "#f59e0b" },
      { name: "Jay Thompson", role: "Barber & Trainer", bio: "Trained in London. Textured hair and afro specialist with 10 years in premium barbershops.", initials: "JT", color: "#d97706" },
    ],
    testimonials: [
      { name: "Samir A.", location: "Jumeirah, Dubai", text: "Best fade I've ever had — and I've been getting fades for 15 years. Carlos is an absolute artist. Worth every dirham.", rating: 5, initials: "SA" },
      { name: "Marcus J.", location: "Downtown Dubai", text: "The hot towel shave experience is incredible. Felt like a different man walking out. Already booked my next appointment.", rating: 5, initials: "MJ" },
      { name: "Patrick N.", location: "DIFC", text: "My son is 8 and used to hate haircuts. The FadeShop team made it fun for him and the cut looked brilliant. Now he asks to come back.", rating: 5, initials: "PN" },
    ],
    faqItems: [
      { q: "Do you take walk-ins?", a: "Yes — walk-ins are always welcome, but we recommend booking during peak times (Thursday–Saturday evenings)." },
      { q: "How long does a haircut take?", a: "Standard cuts take 30–45 minutes. Beard combos are 50–60 minutes. Hot towel shaves are 45 minutes." },
      { q: "What products do you use?", a: "We use American Crew, Layrite, and Fades & Blades grooming products — all available to purchase in-store." },
      { q: "Do you do kids' haircuts?", a: "Yes — we love cutting kids' hair. Patient, friendly, and always a great result." },
    ],
    galleryLabels: ["Skin Fade", "Beard Shape", "Classic Taper", "Hot Towel Shave", "Textured Crop", "Kids Cut"],
    badges: ["8 Master Barbers", "Walk-Ins Welcome", "4.9★ Google", "7 Years Dubai"],
  },

  // ── SmileStudio ──────────────────────────────────────────────────────────────
  "smilestudio-dental": {
    tagline: "Modern Dentistry. Gentle Care. Beautiful Results.",
    phone: "+61 2 9333 5500",
    email: "appointments@smilestudio.com.au",
    address: "Suite 3, 120 Pitt Street, Sydney NSW 2000",
    cta: "Book an Appointment",
    ctaSecondary: "Our Treatments",
    navLinks: [
      { label: "Treatments", href: "#treatments" },
      { label: "Pricing", href: "#pricing" },
      { label: "Our Team", href: "#team" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "6,000+", label: "Happy Patients" },
      { value: "4.9★", label: "Google Rating" },
      { value: "15 yr", label: "In Practice" },
      { value: "AHPRA", label: "Registered" },
    ],
    services: [
      { name: "General Dentistry", desc: "Checkups, cleans, fillings, extractions, and x-rays — comprehensive general dental care for the whole family.", price: "From $80", icon: "🦷", image: "https://images.pexels.com/photos/6620758/pexels-photo-6620758.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Teeth Whitening", desc: "In-chair Zoom whitening and take-home whitening kits — visibly whiter teeth in one visit.", price: "From $399", icon: "✨" },
      { name: "Invisalign", desc: "Clear aligner orthodontic treatment — straighten your teeth without metal braces.", price: "From $4,500", icon: "😁" },
      { name: "Dental Implants", desc: "Permanent tooth replacement using titanium implants — looks, feels, and functions like a natural tooth.", price: "From $3,800", icon: "🔬" },
      { name: "Porcelain Veneers", desc: "Thin porcelain veneers to transform the shape, size, and colour of your smile.", price: "From $1,200/tooth", icon: "💎" },
      { name: "Emergency Dentistry", desc: "Same-day emergency appointments for toothache, broken teeth, and lost fillings.", price: "From $150", icon: "🚨" },
    ],
    about: {
      heading: "Sydney's Most Trusted Family & Cosmetic Dental Practice",
      body: "SmileStudio has been caring for Sydney smiles for 15 years. Our experienced team of dentists and specialists provides comprehensive general, cosmetic, and restorative dentistry in a modern, comfortable clinic. We use the latest technology to ensure precise treatment and minimal discomfort — and we love seeing patients leave with genuine confidence.",
      highlights: ["AHPRA registered dentists", "Invisalign Diamond Provider", "Digital x-rays — 90% less radiation", "Interest-free payment plans", "Emergency same-day appointments"],
      image: "https://images.pexels.com/photos/6620758/pexels-photo-6620758.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Dr. Sarah Nguyen", role: "Principal Dentist", bio: "15 years in general and cosmetic dentistry. Invisalign Diamond Provider and smile transformation specialist.", initials: "SN", color: "#38bdf8" },
      { name: "Dr. James Park", role: "Oral Surgeon", bio: "Specialist in implants, wisdom teeth, and complex extractions. 10 years post-graduate specialist training.", initials: "JP", color: "#0284c7" },
    ],
    testimonials: [
      { name: "Michelle T.", location: "Sydney CBD", text: "Had a fear of dentists for 20 years. Dr. Nguyen's patience and care completely changed that. Now I come every 6 months and actually look forward to it.", rating: 5, initials: "MT" },
      { name: "David K.", location: "Surry Hills", text: "Invisalign completed in 14 months. Result is incredible — completely changed how I feel about smiling. Brilliant team from start to finish.", rating: 5, initials: "DK" },
      { name: "Emma F.", location: "Newtown", text: "Emergency appointment on a Saturday morning after a broken tooth. Sorted within 2 hours. Genuinely grateful they exist.", rating: 5, initials: "EF" },
    ],
    faqItems: [
      { q: "Do you accept health fund rebates?", a: "Yes — we accept all major health funds via HICAPS. Gap payments can be processed on the day." },
      { q: "Are you open on weekends?", a: "We open Saturday mornings 8am–1pm for general and emergency appointments." },
      { q: "Do you offer payment plans?", a: "Yes — 0% interest-free payment plans are available for treatments over $500 through DentiCare." },
      { q: "Are you good with nervous patients?", a: "Absolutely — many of our patients were anxious about dentistry before finding us. We work at your pace and explain everything before we proceed." },
    ],
    galleryLabels: ["Smile Makeover", "Teeth Whitening", "Invisalign Results", "Implants", "Veneers", "The Clinic"],
    badges: ["AHPRA Registered", "Invisalign Diamond", "6,000+ Patients", "Interest-Free Plans"],
  },

  // ── IronForge ────────────────────────────────────────────────────────────────
  "ironforge-gym": {
    tagline: "Forge the Best Version of You.",
    phone: "+65 6543 2211",
    email: "join@ironforgefit.sg",
    address: "60 Queensway, #02-01, Singapore 149051",
    cta: "Join Now",
    ctaSecondary: "Book a Free Trial",
    navLinks: [
      { label: "Memberships", href: "#memberships" },
      { label: "Classes", href: "#classes" },
      { label: "Trainers", href: "#trainers" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "3,500+", label: "Active Members" },
      { value: "40+", label: "Classes/Week" },
      { value: "15,000", label: "Sq Ft Facility" },
      { value: "8 yr", label: "In Operation" },
    ],
    services: [
      { name: "Gym Access", desc: "State-of-the-art free weights, machines, cardio equipment, and functional training area — open 24/7.", price: "From $59/mo", icon: "💪", image: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Group Classes", desc: "40+ weekly classes including HIIT, Spin, Boxing, Yoga, Pilates, and Strength & Conditioning.", price: "Included in Premium", icon: "🏋️" },
      { name: "Personal Training", desc: "1-on-1 sessions with certified personal trainers — customised programs for any goal.", price: "From $95/session", icon: "🎯" },
      { name: "Sports Nutrition Bar", desc: "In-house nutrition bar with protein shakes, pre-workout, and healthy meals available pre- and post-workout.", price: "From $8", icon: "🥤" },
      { name: "Body Composition Analysis", desc: "InBody 770 body composition scan — detailed breakdown of muscle mass, fat, and metabolic rate.", price: "$25/scan", icon: "📊" },
      { name: "Recovery Zone", desc: "Ice bath, sauna, steam room, foam rolling station, and Theragun massage guns.", price: "Included Premium+", icon: "🧊" },
    ],
    about: {
      heading: "Singapore's Most Complete Fitness Facility",
      body: "IronForge was built for people who are serious about their fitness. Our 15,000 sq ft facility is equipped with the best strength, cardio, and functional training equipment available — plus a team of 20 certified trainers who are passionate about helping members achieve real, lasting results.",
      highlights: ["24/7 access for all members", "40+ weekly classes", "Certified personal trainers", "InBody composition scanning", "Sauna, steam, and recovery zone"],
      image: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Basic", price: "$59", period: "per month", features: ["Gym access 24/7", "Locker room", "Parking included", "App & tracking", "Free induction session"], cta: "Join Now" },
      { name: "Premium", price: "$89", period: "per month", features: ["All Basic features", "Unlimited group classes", "1 PT session/month", "Body composition scan", "Recovery zone access", "Guest pass/month"], highlight: true, cta: "Join Now" },
      { name: "Annual Elite", price: "$799", period: "per year", features: ["All Premium features", "4 PT sessions/quarter", "Quarterly body scans", "Nutrition consultation", "Priority class booking", "Branded gear pack"], cta: "Join Now" },
    ],
    team: [
      { name: "Marcus Chen", role: "Head of Fitness", bio: "ACSM-certified personal trainer and strength coach. Former national powerlifting competitor.", initials: "MC", color: "#ef4444" },
      { name: "Aisha Mohammed", role: "Group Fitness Director", bio: "Les Mills and yoga-certified instructor. Runs 15 classes per week and trains the group fitness team.", initials: "AM", color: "#dc2626" },
      { name: "Ryan Ng", role: "Personal Trainer", bio: "Specialist in weight loss transformation and athletic performance. 200+ client transformations.", initials: "RN", color: "#b91c1c" },
    ],
    testimonials: [
      { name: "Kevin T.", location: "Queenstown, Singapore", text: "Lost 18kg in 6 months training at IronForge with Ryan. The facility is incredible but it's the people and community that make it special.", rating: 5, initials: "KT" },
      { name: "Sunita K.", location: "Buona Vista", text: "The HIIT and boxing classes are exceptional. Aisha's energy is contagious — I've recommended this gym to every friend I have.", rating: 5, initials: "SK" },
      { name: "David L.", location: "Commonwealth", text: "Best gym I've been a member of in 15 years. Equipment is top class, never crowded, and the trainers genuinely care about your progress.", rating: 5, initials: "DL" },
    ],
    faqItems: [
      { q: "Is there a joining fee?", a: "No joining fee for the month of launch. $99 joining fee applies after promotional period." },
      { q: "Can I freeze my membership?", a: "Yes — members can freeze for up to 2 months per year at $10/month admin fee." },
      { q: "Do you offer corporate membership?", a: "Yes — we have corporate plans for 5+ employees with discounted rates and priority booking. Contact us for rates." },
      { q: "Is there parking?", a: "Yes — 2 hours free parking for members in the building carpark. Validate at reception." },
    ],
    galleryLabels: ["Weights Floor", "Cardio Zone", "Group Class", "Recovery Zone", "PT Session", "Nutrition Bar"],
    badges: ["24/7 Access", "40+ Classes/Week", "3,500+ Members", "Certified Trainers"],
  },

  // ── PeakPT ───────────────────────────────────────────────────────────────────
  "peak-pt": {
    tagline: "Your Goals. My Method. Real Results.",
    phone: "+44 7890 123 456",
    email: "train@peakptlondon.co.uk",
    address: "PT Studio, 8 Bermondsey Square, London SE1",
    cta: "Book a Free Consultation",
    ctaSecondary: "Training Packages",
    navLinks: [
      { label: "Coaching", href: "#coaching" },
      { label: "Packages", href: "#packages" },
      { label: "Transformations", href: "#results" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "300+", label: "Client Transformations" },
      { value: "8 yr", label: "Coaching Experience" },
      { value: "REPS L3", label: "Certified" },
      { value: "4.9★", label: "Client Rating" },
    ],
    services: [
      { name: "1-on-1 Personal Training", desc: "Fully personalised sessions in our private studio or your home gym — technique, intensity, and programming all tailored to you.", price: "From £75/session", icon: "💪", image: "https://images.pexels.com/photos/703016/pexels-photo-703016.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Online Coaching", desc: "Fully remote coaching with custom training programmes, weekly check-ins, and 24/7 app support.", price: "From £199/mo", icon: "📱" },
      { name: "Nutrition Planning", desc: "Personalised nutrition plans, macro targets, and meal prep guides — science-based, not fad diets.", price: "From £99/mo", icon: "🥗" },
      { name: "Body Transformation Package", desc: "12-week intensive in-person programme — training, nutrition, and lifestyle coaching for maximum results.", price: "From £1,800", icon: "🏆" },
      { name: "Running Performance", desc: "Training plans and technique coaching for 5K, 10K, half marathon, and marathon runners.", price: "From £149/mo", icon: "🏃" },
    ],
    about: {
      heading: "London's Results-Driven Personal Trainer",
      body: "After 8 years and over 300 client transformations, I've refined a coaching approach that consistently works — for busy professionals, new mothers returning to fitness, and competitive athletes alike. Every client gets a programme built around their life, their goals, and the science of what actually produces lasting change.",
      highlights: ["REPS Level 3 certified", "Nutrition coaching included", "Private studio or home visits", "Online coaching worldwide", "300+ client transformations"],
      image: "https://images.pexels.com/photos/703016/pexels-photo-703016.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Online Coaching", price: "£199", period: "per month", features: ["Custom training plan", "Weekly check-in call", "Nutrition guidance", "App tracking", "WhatsApp support"], cta: "Apply Now" },
      { name: "In-Person Training", price: "£75", period: "per session", features: ["Private studio sessions", "Fully personalised programme", "Technique coaching", "Progress tracking", "Nutrition advice"], highlight: true, cta: "Book a Session" },
      { name: "12-Week Transformation", price: "£1,800", features: ["3× weekly in-person", "Custom nutrition plan", "Body composition tracking", "Weekly accountability", "Transformation photo shoot", "Lifetime programme access"], cta: "Apply Now" },
    ],
    testimonials: [
      { name: "Dan R.", location: "Bermondsey, London", text: "Lost 24kg in 5 months. I've tried other trainers and online programmes before. Nothing compares to the level of personalisation and accountability at PeakPT.", rating: 5, initials: "DR" },
      { name: "Claire M.", location: "Canary Wharf", text: "Came back to training after having twins. Patient, knowledgeable, and genuinely inspiring. I'm in the best shape of my life at 38.", rating: 5, initials: "CM" },
      { name: "Tom H.", location: "Peckham", text: "Ran my first marathon this year. The running coaching programme was exceptional — I finished in 3:42 and felt strong the whole way.", rating: 5, initials: "TH" },
    ],
    faqItems: [
      { q: "Do you train complete beginners?", a: "Absolutely — many of my clients come to me having never trained before. I love working with beginners and building their confidence from day one." },
      { q: "Can I do online coaching from outside the UK?", a: "Yes — I coach clients across Europe, USA, and Australia through our online coaching programme." },
      { q: "How quickly will I see results?", a: "Most clients see meaningful changes in 4–6 weeks when following the programme consistently. Visible transformation typically happens by week 8–12." },
      { q: "What's included in online coaching?", a: "A fully custom training plan, weekly check-in video calls, daily WhatsApp support, nutrition guidance, and access to my training app." },
    ],
    galleryLabels: ["Before & After", "Studio Sessions", "Running Coaching", "Nutrition Planning", "Group Training", "Competition Prep"],
    badges: ["REPS L3 Certified", "300+ Transformations", "Online Worldwide", "4.9★ Rated"],
  },

  // ── SwiftDrop ────────────────────────────────────────────────────────────────
  "swiftdrop-courier": {
    tagline: "Same-Day Delivery. Every Time.",
    phone: "+971 800 7948 3767",
    email: "dispatch@swiftdrop.ae",
    address: "Logistics Hub, Al Quoz Industrial Area 3, Dubai",
    cta: "Send a Parcel",
    ctaSecondary: "Business Accounts",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "Business", href: "#business" },
      { label: "Track", href: "#track" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "25,000+", label: "Deliveries Monthly" },
      { value: "98.7%", label: "On-Time Rate" },
      { value: "2 hr", label: "Express Window" },
      { value: "7 yr", label: "In Dubai" },
    ],
    services: [
      { name: "Same-Day Delivery", desc: "Pick up within 2 hours and deliver same day anywhere in Dubai, Sharjah, and Abu Dhabi.", price: "From AED 29", icon: "⚡", image: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Express 2-Hour", desc: "Premium express delivery within any 2-hour window — guaranteed arrival time.", price: "From AED 49", icon: "🚀" },
      { name: "Next-Day Delivery", desc: "Affordable next-day service across the UAE — perfect for less urgent shipments.", price: "From AED 19", icon: "📦" },
      { name: "Business Accounts", desc: "Dedicated business accounts with bulk pricing, API integration, and monthly invoicing.", price: "Custom rates", icon: "🏢" },
      { name: "Temperature-Controlled", desc: "Cold chain and temperature-controlled delivery for food, pharmaceuticals, and medical supplies.", price: "From AED 79", icon: "❄️" },
    ],
    about: {
      heading: "Dubai's Most Reliable Same-Day Courier Since 2017",
      body: "SwiftDrop was founded to solve the most common courier problem in Dubai: unreliable estimated delivery windows. We built a real-time dispatch system and a fleet of dedicated drivers to guarantee same-day delivery with live tracking — and we've maintained a 98.7% on-time rate across 25,000+ monthly deliveries.",
      highlights: ["Live GPS tracking on every delivery", "98.7% on-time delivery rate", "API integration available", "COD collection service", "Same-day issue resolution"],
      image: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Standard", price: "AED 29", features: ["Same-day delivery", "Live tracking", "SMS notifications", "POD confirmation", "Up to 10kg"], cta: "Send Now" },
      { name: "Express 2-Hour", price: "AED 49", features: ["2-hour guaranteed window", "Priority dispatch", "Live tracking", "SMS + WhatsApp alerts", "Up to 10kg"], highlight: true, cta: "Send Now" },
      { name: "Business Account", price: "Custom", features: ["Bulk rate pricing", "Monthly invoicing", "API / system integration", "Dedicated account manager", "Priority dispatch queue", "COD management"], cta: "Get a Quote" },
    ],
    testimonials: [
      { name: "Ahmed Al Rashid", location: "Dubai Mall", text: "We run an online fashion store and SwiftDrop handles all our same-day deliveries. 98% on time, zero complaints from customers. Brilliant service.", rating: 5, initials: "AAR" },
      { name: "Sarah T.", location: "Jumeirah", text: "Needed to send documents urgently across Dubai. Picked up in 40 minutes, delivered in under 2 hours. Impressed.", rating: 5, initials: "ST" },
      { name: "Priya M.", location: "DIFC", text: "Set up a business account for our legal firm. The COD collection service works flawlessly and the API integration with our system was seamless.", rating: 5, initials: "PM" },
    ],
    faqItems: [
      { q: "How do I track my delivery?", a: "Every delivery gets a live tracking link via SMS and WhatsApp. You can see your driver's real-time location." },
      { q: "What's the maximum parcel size?", a: "Standard deliveries up to 10kg and 80cm longest dimension. Larger items available on request." },
      { q: "Do you offer COD (cash on delivery)?", a: "Yes — we collect cash and process card payments on delivery for e-commerce businesses. Funds remitted weekly." },
      { q: "Can I integrate SwiftDrop with my e-commerce platform?", a: "Yes — we have API integrations for Shopify, WooCommerce, and Magento, plus a RESTful API for custom systems." },
    ],
    galleryLabels: ["Dispatch Hub", "Driver Fleet", "Live Tracking", "Express Delivery", "Business Accounts", "Cold Chain"],
    badges: ["98.7% On-Time", "Live GPS Tracking", "COD Collection", "API Integration"],
  },

  // ── VaultStore ───────────────────────────────────────────────────────────────
  "vaultstore": {
    tagline: "Safe, Secure, and Stress-Free Storage.",
    phone: "+44 800 456 7890",
    email: "hello@vaultstore.co.uk",
    address: "Units 1–20, Vault Storage Park, Reading RG1 4AA",
    cta: "Get a Quote",
    ctaSecondary: "View Storage Units",
    navLinks: [
      { label: "Storage", href: "#storage" },
      { label: "Removals", href: "#removals" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "500+", label: "Storage Units" },
      { value: "24/7", label: "CCTV & Access" },
      { value: "10 yr", label: "In Business" },
      { value: "4.8★", label: "Google Rating" },
    ],
    services: [
      { name: "Self Storage", desc: "Clean, secure, drive-up storage units from 25 to 400 sq ft — pay monthly, no long-term contract.", price: "From £49/month", icon: "📦", image: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Home Removals", desc: "Professional home moving service — packing, loading, transport, and unpacking at your new address.", price: "From £350", icon: "🏠" },
      { name: "Office Relocations", desc: "Minimise downtime with our overnight and weekend office move service — fully insured and managed.", price: "From £600", icon: "🏢" },
      { name: "Packing Services", desc: "Professional packing using quality materials — fragile, bulky, and specialist items all handled with care.", price: "From £150", icon: "🛡️" },
      { name: "Student Storage", desc: "Affordable summer storage for students — collect from campus and deliver back when term starts.", price: "From £29/month", icon: "🎓" },
    ],
    about: {
      heading: "Reading's Most Trusted Self-Storage and Removals Company",
      body: "VaultStore has been helping homes and businesses store and move their belongings since 2014. Our 500+ storage units are clean, secure, and accessible 24/7 with keypad entry. Our professional removals team is trained, fully insured, and genuinely careful with everything they touch.",
      highlights: ["24/7 keypad access", "HD CCTV throughout", "Fully insured contents", "No long-term contracts", "Free padlock on first rental"],
      image: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Small Unit (25 sq ft)", price: "£49", period: "per month", features: ["25 sq ft unit", "24/7 access", "CCTV monitored", "Free padlock", "No long contract"], cta: "Book Now" },
      { name: "Medium Unit (75 sq ft)", price: "£99", period: "per month", features: ["75 sq ft unit", "Drive-up access", "Climate controlled", "24/7 CCTV", "Free first month"], highlight: true, cta: "Book Now" },
      { name: "Large Unit (150 sq ft)", price: "£179", period: "per month", features: ["150 sq ft unit", "Commercial access hours", "Forklift available", "Loading dock", "Volume discount"], cta: "Get a Quote" },
    ],
    testimonials: [
      { name: "Robert H.", location: "Reading", text: "Stored furniture for 6 months during a house renovation. Unit was spotless, access was easy, and nothing was damaged. Very fairly priced.", rating: 5, initials: "RH" },
      { name: "TechFlow Ltd", location: "Reading Business Park", text: "Used VaultStore for our office relocation. The team were careful, efficient, and the job was done over one weekend with minimal disruption.", rating: 5, initials: "TFL" },
      { name: "Jessica M.", location: "University of Reading", text: "Student storage is perfect — they collected from my halls at end of term and delivered back in September. Easy, affordable, took the stress away.", rating: 5, initials: "JM" },
    ],
    faqItems: [
      { q: "How do I access my unit?", a: "All units use secure keypad access — you get your unique PIN code at signup. Site is accessible 6am–10pm, 7 days a week." },
      { q: "Is my stuff insured?", a: "We offer contents insurance from £6/month. Your home insurance may also cover items in storage — check your policy." },
      { q: "Can I upgrade or downsize my unit?", a: "Yes — you can change unit sizes with 7 days notice. We'll move your belongings internally at no charge." },
      { q: "What can't I store?", a: "We don't accept hazardous materials, food, living things, or illegal items. All other household and business goods are welcome." },
    ],
    galleryLabels: ["Storage Units", "Drive-Up Access", "Secure Facility", "Removals Team", "Packing Service", "Office Move"],
    badges: ["24/7 CCTV", "No Long Contracts", "Fully Insured", "4.8★ Google"],
  },

  // ── PressMark ────────────────────────────────────────────────────────────────
  "pressmark-print": {
    tagline: "Ideas Printed. Brands Built.",
    phone: "+65 6234 5678",
    email: "hello@pressmark.sg",
    address: "25 Tai Seng Street, #08-01, Singapore 534104",
    cta: "Get an Instant Quote",
    ctaSecondary: "Our Products",
    navLinks: [
      { label: "Print", href: "#print" },
      { label: "Signage", href: "#signage" },
      { label: "Branding", href: "#branding" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "5,000+", label: "Clients Served" },
      { value: "48 hr", label: "Standard Turnaround" },
      { value: "15 yr", label: "In Business" },
      { value: "ISO 9001", label: "Certified" },
    ],
    services: [
      { name: "Business Cards & Stationery", desc: "Premium business cards, letterheads, envelopes, and stationery — offset and digital print options.", price: "From $35/500pcs", icon: "🃏", image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Banners & Displays", desc: "Pull-up banners, PVC banners, backdrop displays, and exhibition stands — fast turnaround.", price: "From $45", icon: "🖼️" },
      { name: "Brochures & Flyers", desc: "Full-colour folded brochures, flyers, and catalogues — perfect for marketing and sales campaigns.", price: "From $80/500pcs", icon: "📄" },
      { name: "Building Signage", desc: "3D lettering, illuminated signs, fascia signage, and directional wayfinding for commercial spaces.", price: "From $380", icon: "🏢" },
      { name: "Vehicle Wrapping", desc: "Full and partial vehicle wraps, magnetic signs, and fleet branding — mobile advertising that works.", price: "From $450", icon: "🚗" },
      { name: "Custom Merchandise", desc: "Branded caps, t-shirts, pens, bags, and corporate gifts — fully custom from 50 units.", price: "Custom quote", icon: "🎁" },
    ],
    about: {
      heading: "Singapore's Go-To Print & Signage Specialists Since 2009",
      body: "PressMark has been producing high-quality print and signage for Singapore businesses for 15 years. From single-page flyers to full building facades and vehicle fleets, our in-house production facility delivers consistent quality, fast turnaround, and competitive pricing. ISO 9001 certified from day one.",
      highlights: ["In-house production facility", "ISO 9001:2015 certified", "48-hour standard turnaround", "Rush 24-hour service available", "Free design consultation"],
      image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    testimonials: [
      { name: "Kevin Yap", location: "Orchard Road, Singapore", text: "Have used PressMark for 5 years for all our retail marketing print. Consistent quality, always on time, and the team is genuinely helpful with design advice.", rating: 5, initials: "KY" },
      { name: "Sandra Lin", location: "CBD", text: "Office building signage was complex — 3D lettering, 4 floors. PressMark handled everything from design sign-off to installation. Excellent result.", rating: 5, initials: "SL" },
      { name: "Ravi Construction", location: "Jurong", text: "Fleet wrapping for 12 vehicles. Brand-consistent across all of them, finished 2 days ahead of schedule. Will go nowhere else.", rating: 5, initials: "RC" },
    ],
    faqItems: [
      { q: "Do you provide design services?", a: "Yes — we have in-house designers who can create or refine artwork for any product. Design from $80." },
      { q: "What file formats do you accept?", a: "We accept AI, PDF, EPS, and high-resolution PSD files (300dpi+). We'll check your files before production." },
      { q: "Can you do rush orders?", a: "Yes — 24-hour rush turnaround available on most print products at a 20% surcharge." },
      { q: "Do you deliver?", a: "Yes — island-wide delivery available from $12. Same-day delivery available for rush orders in central Singapore." },
    ],
    galleryLabels: ["Business Cards", "Building Signage", "Vehicle Wrap", "Exhibition Stand", "Brochures", "Merchandise"],
    badges: ["ISO 9001", "48hr Turnaround", "In-House Production", "5,000+ Clients"],
  },

  // ── BrightMinds ──────────────────────────────────────────────────────────────
  "brightminds-tutor": {
    tagline: "Every Student Can Excel. We Prove It.",
    phone: "+65 8123 4567",
    email: "learn@brightminds.sg",
    address: "12 Bishan Street 13, #02-01, Singapore 579799",
    cta: "Enrol Today",
    ctaSecondary: "Free Trial Class",
    navLinks: [
      { label: "Subjects", href: "#subjects" },
      { label: "Programmes", href: "#programmes" },
      { label: "Tutors", href: "#tutors" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "1,200+", label: "Students Enrolled" },
      { value: "92%", label: "Grade Improvement" },
      { value: "10 yr", label: "Established" },
      { value: "MOE Sch.", label: "Curriculum Aligned" },
    ],
    services: [
      { name: "Primary Maths & Science", desc: "P1–P6 Maths and Science tuition aligned to MOE curriculum — building strong foundations for PSLE.", price: "From $180/mo", icon: "🔢", image: "https://images.pexels.com/photos/3184183/pexels-photo-3184183.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Secondary Maths (E & A)", desc: "O-Level Elementary and Additional Mathematics — concept mastery and exam technique.", price: "From $220/mo", icon: "📐" },
      { name: "English & Comprehension", desc: "Primary and secondary English — comprehension, essay writing, composition, and oral preparation.", price: "From $180/mo", icon: "📝" },
      { name: "O-Level Sciences", desc: "Physics, Chemistry, and Biology for O-Level — structured weekly tuition with past paper practice.", price: "From $220/mo", icon: "🔬" },
      { name: "H2 JC Subjects", desc: "A-Level Maths, Physics, Chemistry, and Economics tuition for junior college students.", price: "From $280/mo", icon: "🎓" },
      { name: "1-on-1 Coaching", desc: "Private individual sessions tailored to your child's specific gaps — ideal for exam preparation.", price: "From $75/session", icon: "👤" },
    ],
    about: {
      heading: "Singapore's Trusted Tutoring Centre for 10 Years",
      body: "BrightMinds was founded by a team of ex-MOE teachers who believed every child has the potential to excel with the right guidance. Our small-class approach — maximum 8 students — ensures every student gets attention, clarity, and confidence. 92% of our students see grade improvement within 3 months.",
      highlights: ["Ex-MOE teachers on staff", "Max 8 students per class", "MOE curriculum aligned", "92% grade improvement rate", "Free diagnostic assessment"],
      image: "https://images.pexels.com/photos/3184183/pexels-photo-3184183.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Group (8 pax)", price: "$180", period: "per month (4 sessions)", features: ["Weekly 90-min class", "Max 8 students", "Worksheets provided", "Parent progress update", "WhatsApp Q&A support"], cta: "Enrol Now" },
      { name: "Small Group (4 pax)", price: "$280", period: "per month (4 sessions)", features: ["Weekly 90-min class", "Max 4 students", "Personalised attention", "Monthly progress report", "Exam papers included"], highlight: true, cta: "Enrol Now" },
      { name: "1-on-1 Private", price: "$75", period: "per session", features: ["Individual tuition", "Fully customised pace", "Flexible scheduling", "Direct teacher access", "Targeted exam prep"], cta: "Book a Session" },
    ],
    team: [
      { name: "Ms. Lim Hui Ting", role: "Principal Tutor (Maths)", bio: "Ex-MOE teacher with 18 years experience. O-Level and A-Level Maths specialist.", initials: "LHT", color: "#3b82f6" },
      { name: "Mr. Raj Kumar", role: "Science Tutor", bio: "Former MOE Science HOD. Specialist in combined and triple science for secondary students.", initials: "RK", color: "#2563eb" },
    ],
    testimonials: [
      { name: "Tan Mei Xin", location: "Bishan, Singapore", text: "My son went from a D7 to an A2 in Additional Maths in one semester. Ms. Lim's explanations are so clear — he finally understands what he's doing.", rating: 5, initials: "TMX" },
      { name: "Patricia Wong", location: "Ang Mo Kio", text: "BrightMinds has been tutoring my daughter for 2 years. She's gone from struggling with Science to being top of her class. Cannot recommend enough.", rating: 5, initials: "PW" },
      { name: "James Ong", location: "Toa Payoh", text: "The 1-on-1 coaching for A-Levels was exactly what my son needed before his exams. Structured, targeted, and genuinely effective.", rating: 5, initials: "JO" },
    ],
    faqItems: [
      { q: "How do I know which programme is right?", a: "We offer a free diagnostic assessment that identifies your child's strengths and gaps. We'll recommend the best fit based on results." },
      { q: "What if we need to miss a class?", a: "Students can attend a make-up class within the same week at no extra cost." },
      { q: "Are your tutors ex-teachers?", a: "Yes — all our core tutors are ex-MOE or NIE-trained teachers with at least 10 years of teaching experience." },
      { q: "When do lessons run?", a: "Weekday evenings (5–9pm) and all day Saturdays and Sundays. We offer morning, afternoon, and evening slots." },
    ],
    galleryLabels: ["Tuition Classes", "1-on-1 Session", "Exam Prep", "Results Board", "Science Lab", "Awards & Achievements"],
    badges: ["Ex-MOE Teachers", "92% Grade Improvement", "Max 8/Class", "10 Years"],
  },

  // ── SkillForge ───────────────────────────────────────────────────────────────
  "skillforge-training": {
    tagline: "Industry-Ready Skills. Career-Changing Results.",
    phone: "+61 3 9444 5566",
    email: "enrol@skillforgetraining.com.au",
    address: "Level 2, 100 Collins Street, Melbourne VIC 3000",
    cta: "Browse Courses",
    ctaSecondary: "Free Career Consultation",
    navLinks: [
      { label: "Courses", href: "#courses" },
      { label: "Certifications", href: "#certs" },
      { label: "Online Learning", href: "#online" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "8,000+", label: "Students Trained" },
      { value: "50+", label: "Courses Available" },
      { value: "RTO", label: "Registered" },
      { value: "85%", label: "Employment Rate" },
    ],
    services: [
      { name: "Trade Certificates", desc: "Certificate III and IV in Construction, Plumbing, Electrical, and Automotive — nationally recognised.", price: "From $1,200", icon: "🏗️", image: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Safety & Compliance", desc: "White Card, First Aid, Forklift, Work at Height, and industry safety certification courses.", price: "From $95", icon: "⛑️" },
      { name: "Business & Management", desc: "Cert IV in Business Administration, Project Management, and Leadership for workplace professionals.", price: "From $1,500", icon: "💼" },
      { name: "IT & Digital Skills", desc: "CompTIA, Microsoft 365, and cybersecurity fundamentals — entry-level to advanced.", price: "From $800", icon: "💻" },
      { name: "Online Learning", desc: "Self-paced online courses available 24/7 — study at your own speed with tutor support.", price: "From $299", icon: "📱" },
      { name: "RPL Assessment", desc: "Recognition of Prior Learning — get your existing skills and experience formally certified.", price: "From $500", icon: "🎓" },
    ],
    about: {
      heading: "Melbourne's Leading Registered Training Organisation",
      body: "SkillForge has been delivering nationally recognised vocational training across Melbourne and online for 12 years. As an ASQA-registered RTO, all our qualifications are nationally recognised and employer-respected. Our trainers are industry practitioners — not academics — which means the training is practical, current, and genuinely career-relevant.",
      highlights: ["ASQA Registered Training Organisation", "Nationally recognised qualifications", "Industry-practitioner trainers", "Face-to-face and online options", "85% student employment rate"],
      image: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Christine Holt", role: "CEO & Principal Trainer", bio: "20 years in VET sector. Former TAFE department head. Specialist in business and leadership qualifications.", initials: "CH", color: "#14b8a6" },
      { name: "Dave Mitchell", role: "Trades Training Lead", bio: "Master electrician and registered trainer. 25 years in trades and construction industry.", initials: "DM", color: "#0d9488" },
    ],
    testimonials: [
      { name: "Jake Summers", location: "Melbourne", text: "Completed my Certificate IV in Construction Management through SkillForge while working full-time. Flexible, practical, and the qualification got me promoted within 3 months.", rating: 5, initials: "JS" },
      { name: "Divya R.", location: "Docklands", text: "Did the Business Administration Cert IV online. Trainer was always available, content was current, and the assessment process was clear. Really impressed.", rating: 5, initials: "DR" },
      { name: "Tom B.", location: "Dandenong", text: "White Card and forklift licence in one week. Trainer was excellent — practical, experienced, and made it engaging. In work the following Monday.", rating: 5, initials: "TB" },
    ],
    faqItems: [
      { q: "Are your qualifications nationally recognised?", a: "Yes — all SkillForge qualifications are nationally recognised Australian Qualifications Framework (AQF) certificates." },
      { q: "Can I study online?", a: "Yes — most courses offer online, blended, or face-to-face delivery. Some trade qualifications require some practical attendance." },
      { q: "Is government funding available?", a: "Many of our courses are eligible for Victorian Government subsidised training through Skills First. Contact us to check your eligibility." },
      { q: "How long do courses take?", a: "Short safety courses: 1 day. Certificates III/IV: typically 6–18 months depending on mode of study and work placement requirements." },
    ],
    galleryLabels: ["Training Facility", "Trades Workshop", "Graduation", "Online Learning", "Safety Training", "Certification"],
    badges: ["ASQA Registered RTO", "50+ Courses", "85% Employment Rate", "Government Funded"],
  },

  // ── LexBridge ────────────────────────────────────────────────────────────────
  "lexbridge-law": {
    tagline: "Expert Legal Counsel. Trusted Results.",
    phone: "+65 6789 3344",
    email: "enquiries@lexbridge.sg",
    address: "One Raffles Quay, North Tower, Level 18, Singapore 048583",
    cta: "Book a Consultation",
    ctaSecondary: "Our Practice Areas",
    navLinks: [
      { label: "Practice Areas", href: "#practice" },
      { label: "Our Team", href: "#team" },
      { label: "About", href: "#about" },
      { label: "Insights", href: "#insights" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "25 yr", label: "Established" },
      { value: "2,500+", label: "Cases Handled" },
      { value: "12", label: "Practice Areas" },
      { value: "SAL", label: "Accredited Firm" },
    ],
    services: [
      { name: "Corporate & Commercial", desc: "Company incorporation, shareholder agreements, M&A, commercial contracts, and corporate governance.", price: "Consult us", icon: "🏢", image: "https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Property & Conveyancing", desc: "Residential and commercial property transactions, leases, land law, and developer agreements.", price: "From $2,500", icon: "🏠" },
      { name: "Employment Law", desc: "Employment contracts, wrongful dismissal, MOM disputes, and workplace advisory for employers and employees.", price: "From $500/hr", icon: "👔" },
      { name: "Litigation & Dispute Resolution", desc: "Civil and commercial litigation, mediation, and arbitration across the Singapore courts.", price: "Consult us", icon: "⚖️" },
      { name: "Family Law", desc: "Divorce, custody, maintenance, and matrimonial asset division — sensitive, practical, and confidential.", price: "From $500/hr", icon: "👨‍👩‍👧" },
      { name: "Immigration & Work Passes", desc: "EP, S Pass, and EntrePass applications, appeals, and employer advisory for MOM compliance.", price: "From $800", icon: "🌏" },
    ],
    about: {
      heading: "One of Singapore's Most Respected Law Firms Since 1999",
      body: "LexBridge was founded 25 years ago with a commitment to providing corporate and individuals with clear, practical, and commercially minded legal advice. Our team of 18 lawyers covers 12 practice areas across corporate, property, litigation, and personal law — delivering results that protect our clients' interests and advance their goals.",
      highlights: ["SAL-accredited firm", "18 lawyers across 12 practice areas", "Multilingual team (English, Mandarin, Bahasa)", "Corporate and individual clients", "Transparent fee structures"],
      image: "https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "David Ng Wei Liang", role: "Senior Partner", bio: "25 years in corporate and commercial law. Former AGC legal officer. Leads M&A and corporate advisory practice.", initials: "DNWL", color: "#b45309" },
      { name: "Michelle Poh", role: "Partner, Dispute Resolution", bio: "Commercial litigator with 18 years of High Court and Court of Appeal experience.", initials: "MP", color: "#92400e" },
      { name: "Ravi Suppiah", role: "Associate Director, Property", bio: "Property law specialist — residential, commercial, and developer transactions.", initials: "RS", color: "#b45309" },
    ],
    testimonials: [
      { name: "Vincent Koh", location: "Singapore", text: "LexBridge handled our company's M&A transaction seamlessly. David's advice was commercial, direct, and protected us at every turn. Highly recommended.", rating: 5, initials: "VK" },
      { name: "Anita Sharma", location: "Singapore", text: "Michelle represented me in a complex commercial dispute. Her preparation and court presence were exceptional. Won the case. Cannot thank the team enough.", rating: 5, initials: "AS" },
      { name: "The Chen Family", location: "Singapore", text: "Family law matter handled with complete discretion and genuine care. The outcome was fair and the process was made as stress-free as possible.", rating: 5, initials: "TCF" },
    ],
    faqItems: [
      { q: "Do you offer a free initial consultation?", a: "We offer a 30-minute fixed-fee initial consultation at $150, which is credited against fees if you proceed. This ensures we give you proper, considered advice from the outset." },
      { q: "What languages do your lawyers speak?", a: "Our team handles matters in English, Mandarin, and Bahasa Indonesia. We can arrange interpretation for other languages." },
      { q: "Do you handle urgent matters?", a: "Yes — we have lawyers on call for urgent injunctions, time-sensitive transactions, and crisis situations." },
      { q: "Are your fees transparent?", a: "Yes — we provide written fee estimates upfront for all engagements and update you if scope changes." },
    ],
    galleryLabels: ["Office", "Meeting Rooms", "Our Partners", "Practice Areas", "Legal Research", "Client Advisory"],
    badges: ["SAL Accredited", "25 Years", "18 Lawyers", "12 Practice Areas"],
  },

  // ── ClearTax ─────────────────────────────────────────────────────────────────
  "cleartax-accounting": {
    tagline: "Smart Numbers. Less Tax. More Growth.",
    phone: "+61 3 9876 5543",
    email: "hello@cleartax.com.au",
    address: "Level 5, 600 Bourke Street, Melbourne VIC 3000",
    cta: "Book a Free Consultation",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "800+", label: "Business Clients" },
      { value: "$4.2M", label: "Tax Saved in FY24" },
      { value: "CPA", label: "Qualified Partners" },
      { value: "15 yr", label: "Experience" },
    ],
    services: [
      { name: "Tax Returns", desc: "Individual, sole trader, and company tax returns — maximising deductions and minimising tax legally.", price: "From $220", icon: "📋", image: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Bookkeeping", desc: "Monthly bookkeeping in Xero or MYOB — reconciled accounts, payroll, and real-time financial reports.", price: "From $350/mo", icon: "📊" },
      { name: "BAS & GST", desc: "Quarterly BAS lodgement, GST reconciliation, and ATO compliance management.", price: "From $180/quarter", icon: "📑" },
      { name: "Business Advisory", desc: "Cash flow planning, budgeting, structure advice, and growth strategy for SMEs.", price: "From $250/hr", icon: "📈" },
      { name: "SMSF Administration", desc: "Self-managed super fund compliance, tax, and audit preparation.", price: "From $1,800/yr", icon: "🏦" },
      { name: "Business Structuring", desc: "Company, trust, and partnership setup — choosing the right structure to minimise tax and protect assets.", price: "From $1,200", icon: "🏗️" },
    ],
    about: {
      heading: "Melbourne's Trusted CPA Accounting Firm for 15 Years",
      body: "ClearTax was founded to give small and medium businesses access to the same quality of accounting and tax advice that large companies take for granted. Our CPA-qualified partners have saved clients over $4.2 million in tax in the last financial year alone — through legal minimisation strategies, not tricks.",
      highlights: ["CPA-qualified partners", "Xero & MYOB certified advisors", "ATO-compliant and audit-ready", "Fixed-fee packages available", "Free initial consultation"],
      image: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Rebecca Marshall", role: "Managing Partner", bio: "CPA with 18 years in public accounting. Specialist in SME tax strategy and business structuring.", initials: "RM", color: "#16a34a" },
      { name: "Jason Tran", role: "Senior Accountant", bio: "Xero-certified and SMSF specialist. Manages bookkeeping and compliance for 200+ clients.", initials: "JT", color: "#15803d" },
    ],
    testimonials: [
      { name: "Michael K.", location: "Melbourne", text: "Rebecca restructured our business and we saved $38,000 in tax in the first year. Should have made this move years ago. Exceptional advice.", rating: 5, initials: "MK" },
      { name: "Sarah F.", location: "Southbank", text: "Finally feel like I understand my own finances. ClearTax set up our Xero and the monthly reports actually make sense. Love this team.", rating: 5, initials: "SF" },
      { name: "David & Lyn P.", location: "Richmond", text: "They've done our personal and business tax for 8 years. Always proactive, always finds deductions we'd miss. Wouldn't change a thing.", rating: 5, initials: "DLP" },
    ],
    faqItems: [
      { q: "Do you offer fixed-fee pricing?", a: "Yes — most of our services have fixed annual or monthly fees so you always know what you're paying. No hourly bill surprises." },
      { q: "What accounting software do you use?", a: "We primarily use Xero and MYOB. We can migrate you to cloud accounting and train your team as part of onboarding." },
      { q: "Can you help with an ATO audit?", a: "Yes — we represent clients through ATO audits and reviews. Prevention is better than cure, but we have you covered either way." },
      { q: "How do I get started?", a: "Book a free 30-minute consultation. We'll review your current situation and recommend the most efficient path forward." },
    ],
    galleryLabels: ["The Office", "Client Meeting", "Xero Dashboard", "Tax Planning", "BAS Lodgement", "Business Advisory"],
    badges: ["CPA Qualified", "Xero Certified", "$4.2M Tax Saved", "800+ Clients"],
  },

  // ── LensCroft ────────────────────────────────────────────────────────────────
  "lenscroft-studio": {
    tagline: "Photography That Moves People.",
    phone: "+44 7700 900 123",
    email: "studio@lenscroftphotography.co.uk",
    address: "Studio 3, Bermondsey Arts Quarter, London SE1 3UH",
    cta: "Book a Session",
    ctaSecondary: "View Portfolio",
    navLinks: [
      { label: "Portfolio", href: "#portfolio" },
      { label: "Sessions", href: "#sessions" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "600+", label: "Sessions Shot" },
      { value: "12 yr", label: "Experience" },
      { value: "5★", label: "Google Rating" },
      { value: "Editorial", label: "Published Work" },
    ],
    services: [
      { name: "Portrait Sessions", desc: "Professional headshots, personal branding portraits, and creative editorial portraits in studio or on location.", price: "From £275", icon: "📸", image: "https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Wedding Photography", desc: "Full-day wedding coverage — documentary storytelling from prep to first dance. Second shooter available.", price: "From £1,800", icon: "💒" },
      { name: "Brand & Commercial", desc: "Product photography, campaign shoots, and editorial content for brands, agencies, and e-commerce.", price: "From £550/day", icon: "🏢" },
      { name: "Family Portraits", desc: "Relaxed, natural family sessions in studio or outdoor locations — capturing your family at its best.", price: "From £225", icon: "👨‍👩‍👧" },
      { name: "Newborn Photography", desc: "Gentle, experienced newborn sessions in-studio with lifestyle and posed options.", price: "From £275", icon: "👶" },
      { name: "Actor Headshots", desc: "Acting headshots for Spotlight and Casting Call Pro — bright, engaging, and castable.", price: "From £195", icon: "🎭" },
    ],
    about: {
      heading: "London's Award-Winning Photography Studio",
      body: "LensCroft was founded by photographer James Croft in 2012 with a belief that great photography should tell a story. Over 12 years and 600+ sessions, our work has been published in Vogue, The Guardian Weekend, and used in campaigns for global brands. Every session is approached with the same care — whether it's a headshot or a full commercial campaign.",
      highlights: ["Award-winning photographer", "Vogue & editorial published", "London studio + location shoots", "Same-week gallery delivery", "Print products available"],
      image: "https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Portrait Session", price: "£275", features: ["2-hour studio session", "3 outfit changes", "10 edited high-res images", "Online gallery", "Print release included"], cta: "Book Now" },
      { name: "Brand Shoot", price: "£550", period: "half day", features: ["4-hour shoot", "Unlimited looks", "30 edited images", "Commercial licence", "Styling guidance", "2-day turnaround"], highlight: true, cta: "Book Now" },
      { name: "Wedding", price: "From £1,800", features: ["Full day coverage", "8–12 hours", "500+ edited images", "Online gallery", "Keepsake USB", "Engagement session"], cta: "Enquire Now" },
    ],
    testimonials: [
      { name: "Charlotte W.", location: "London", text: "James shot our wedding and the photos are beyond anything we imagined. He was invisible on the day but somehow captured every moment that mattered. Truly exceptional.", rating: 5, initials: "CW" },
      { name: "Savant Agency", location: "Soho, London", text: "Our campaign shoot with LensCroft produced the best content we've had in years. James understood the brief immediately and the images delivered incredible engagement.", rating: 5, initials: "SA" },
      { name: "Priya D.", location: "Bermondsey", text: "My personal brand headshots were outstanding. James made me feel completely relaxed and the results were exactly the professional-yet-approachable look I needed.", rating: 5, initials: "PD" },
    ],
    faqItems: [
      { q: "How long until I receive my photos?", a: "Portrait and headshot sessions are delivered within 5 business days. Weddings within 4 weeks. Commercial shoots within 2 days for rush requests." },
      { q: "Can I choose my favourite images?", a: "Yes — you'll receive a proof gallery and select your favourites for final editing. Additional images can be purchased." },
      { q: "Do you offer location shoots?", a: "Yes — we shoot on location across London. Travel outside Zone 3 is charged at £0.45/mile." },
      { q: "What should I wear to a portrait session?", a: "We send a full styling guide on booking. As a rule: solid colours, fitted clothing, and avoid logos." },
    ],
    galleryLabels: ["Portrait", "Wedding", "Brand Campaign", "Family", "Newborn", "Actor Headshots"],
    badges: ["Editorial Published", "600+ Sessions", "5★ Google", "2-Day Rush Available"],
  },

  // ── ForeverEvents ────────────────────────────────────────────────────────────
  "forever-events": {
    tagline: "Every Detail Perfect. Every Moment Remembered.",
    phone: "+65 8765 4321",
    email: "hello@foreverevents.sg",
    address: "25 Duxton Road, Singapore 089486",
    cta: "Start Planning",
    ctaSecondary: "Our Packages",
    navLinks: [
      { label: "Packages", href: "#packages" },
      { label: "Gallery", href: "#gallery" },
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "320+", label: "Weddings Planned" },
      { value: "12 yr", label: "Experience" },
      { value: "5★", label: "Wedding Wire" },
      { value: "Luxury", label: "Certified Planner" },
    ],
    services: [
      { name: "Full Wedding Planning", desc: "Complete end-to-end wedding planning — venue sourcing, vendor management, timeline, design, and on-the-day coordination.", price: "From $8,000", icon: "💍", image: "https://images.pexels.com/photos/1570236/pexels-photo-1570236.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Day-of Coordination", desc: "Our team takes over 4 weeks before the wedding — managing vendors, timeline, and logistics so you can enjoy your day.", price: "From $2,500", icon: "📋" },
      { name: "Venue Sourcing", desc: "Access to 100+ Singapore venues — hotel ballrooms, gardens, rooftops, heritage buildings, and destination weddings.", price: "Included in Full Plan", icon: "🏛️" },
      { name: "Floral & Décor Design", desc: "Custom floral arrangements, table styling, arch and backdrop design — from garden romance to luxury ballroom.", price: "From $3,000", icon: "💐" },
      { name: "Destination Weddings", desc: "Planning and coordination for Bali, Maldives, Europe, and regional destination weddings.", price: "From $12,000", icon: "✈️" },
      { name: "Engagement Parties", desc: "Intimate engagement celebration planning — venue, styling, catering, and entertainment coordination.", price: "From $1,500", icon: "🥂" },
    ],
    about: {
      heading: "Singapore's Most Awarded Wedding Planners",
      body: "ForeverEvents was founded 12 years ago by a team of three passionate event planners who shared a vision: every couple deserves a wedding that feels entirely their own. We've since planned 320+ weddings across Singapore and the region — earning 5★ ratings on every major platform and multiple industry awards for design and coordination excellence.",
      highlights: ["320+ weddings planned", "Luxury Certified Planner (LWPI)", "100+ preferred venue partners", "Destination wedding specialists", "Multiple industry award winners"],
      image: "https://images.pexels.com/photos/1570236/pexels-photo-1570236.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Joanna Tan", role: "Founder & Lead Planner", bio: "12 years in luxury events. LWPI-certified planner who has coordinated weddings from Singapore to Santorini.", initials: "JT", color: "#fb7185" },
      { name: "Melissa Lim", role: "Senior Coordinator", bio: "Day-of coordination specialist and floral design lead. Has coordinated 180+ weddings seamlessly.", initials: "ML", color: "#f43f5e" },
      { name: "Amanda Koh", role: "Client Relations & Design", bio: "Creative director behind ForeverEvents' signature aesthetic. Former luxury hotel events manager.", initials: "AK", color: "#fb7185" },
    ],
    testimonials: [
      { name: "Daniel & Yiting Chua", location: "Singapore", text: "Joanna planned our entire wedding from venue to florals to day-of coordination. We did nothing but enjoy the day. It was absolutely perfect in every way.", rating: 5, initials: "DYC" },
      { name: "Marcus & Claire Bennett", location: "Bali", text: "Destination wedding in Bali — planned from Singapore with ForeverEvents. Every vendor, every detail, every moment was exquisite. Best day of our lives.", rating: 5, initials: "MCB" },
      { name: "Jonathan & Priya Rao", location: "Singapore", text: "We hired ForeverEvents just for day-of coordination and it was worth every dollar. Melissa managed everything invisibly — we had zero stress on our wedding day.", rating: 5, initials: "JPR" },
    ],
    faqItems: [
      { q: "How far in advance should we book?", a: "We recommend booking 12–18 months ahead for full planning. Day-of coordination can be booked up to 6 months before." },
      { q: "Do you have preferred vendor lists?", a: "Yes — we work with a curated list of 200+ vendors across photography, catering, florals, entertainment, and AV. We can also work with your own vendors." },
      { q: "Can you plan weddings at our chosen venue?", a: "Absolutely — we work at any venue in Singapore and can source venues across the region for destination weddings." },
      { q: "What happens if something goes wrong on the day?", a: "We have a full backup plan and crisis protocol for every wedding. Our team handles every issue quietly behind the scenes so you never know about it." },
    ],
    galleryLabels: ["Garden Wedding", "Ballroom", "Destination Bali", "Floral Design", "Table Styling", "Reception"],
    badges: ["5★ Wedding Wire", "LWPI Certified", "320+ Weddings", "Destination Specialist"],
  },

  // ── PrimeProperty ────────────────────────────────────────────────────────────
  "prime-property": {
    tagline: "Find It. Buy It. Love It.",
    phone: "+61 2 9234 5678",
    email: "agent@primeproperty.com.au",
    address: "Suite 10, 100 Miller Street, North Sydney NSW 2060",
    cta: "Book a Free Appraisal",
    ctaSecondary: "Search Listings",
    navLinks: [
      { label: "Buy", href: "#buy" },
      { label: "Sell", href: "#sell" },
      { label: "Listings", href: "#listings" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "$380M", label: "Property Sold" },
      { value: "550+", label: "Properties Sold" },
      { value: "15 yr", label: "Experience" },
      { value: "4.9★", label: "Rate My Agent" },
    ],
    services: [
      { name: "Residential Sales", desc: "Expert sales representation for homes, apartments, and townhouses — strategy, marketing, and negotiation.", price: "Commission-based", icon: "🏠", image: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Buyer's Agent", desc: "Independent buyer advocacy — property search, due diligence, negotiation, and auction bidding on your behalf.", price: "From $9,500", icon: "🔍" },
      { name: "Property Appraisal", desc: "Free, obligation-free market appraisal — accurate valuation based on recent comparable sales.", price: "Free", icon: "📊" },
      { name: "Off-Market Listings", desc: "Access to exclusive off-market properties not advertised publicly — for buyers seeking first-mover advantage.", price: "Buyer's agent clients", icon: "🔐" },
      { name: "Investment Advisory", desc: "Residential investment strategy — suburb analysis, yield projections, and growth corridor identification.", price: "From $3,500", icon: "📈" },
    ],
    about: {
      heading: "North Sydney's Trusted Property Specialists for 15 Years",
      body: "PrimeProperty has sold over $380M worth of residential property across Sydney's North Shore and inner suburbs over 15 years. Our reputation is built on honest advice, exceptional marketing, and results that consistently beat the suburb median. Whether you're buying or selling, we're the local experts who deliver.",
      highlights: ["$380M+ in property sold", "Off-market property access", "Auction specialists", "Dual buyer and seller representation", "4.9★ on Rate My Agent"],
      image: "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "James Hollis", role: "Principal Agent", bio: "15 years in Sydney residential real estate. Consistent top performer and auction specialist.", initials: "JH", color: "#3b82f6" },
      { name: "Lisa Tan", role: "Buyers' Agent", bio: "Independent buyers' advocate with 10 years of sourcing and negotiation experience across Sydney.", initials: "LT", color: "#2563eb" },
    ],
    testimonials: [
      { name: "Chris & Sarah M.", location: "Neutral Bay", text: "James sold our apartment $85,000 above what we expected. His marketing approach and auction strategy were exceptional. Recommended without hesitation.", rating: 5, initials: "CSM" },
      { name: "Peter K.", location: "Sydney CBD", text: "Used Lisa as my buyer's agent to find an investment property. She found an off-market property that ticked every box and negotiated a great price. Worth every dollar.", rating: 5, initials: "PK" },
      { name: "Helen D.", location: "North Sydney", text: "Downsizing is stressful but James made the whole process smooth and transparent. Clear communication throughout and a great result on the day.", rating: 5, initials: "HD" },
    ],
    faqItems: [
      { q: "What's your commission rate?", a: "Our commission is competitive and structured to align with your result. We'll discuss our fee at your free appraisal." },
      { q: "How do you market my property?", a: "We use professional photography, video, floor plans, REA and Domain Premier listings, database marketing, and social media targeting." },
      { q: "What is a buyer's agent?", a: "A buyer's agent represents the buyer exclusively — searching, evaluating, negotiating, and bidding on your behalf. We eliminate the emotional stress and information imbalance." },
      { q: "How long does it take to sell?", a: "Typically 4–8 weeks from listing to settlement depending on method of sale, market conditions, and price positioning." },
    ],
    galleryLabels: ["Featured Listing", "Auction Day", "Sold Results", "Off-Market", "Property Appraisal", "Investment Analysis"],
    badges: ["$380M+ Sold", "Buyers Agent", "Auction Specialist", "4.9★ Rate My Agent"],
  },

  // ── PropertyVault ────────────────────────────────────────────────────────────
  "propertyvault-mgmt": {
    tagline: "Hands-Off Investing. Maximum Returns.",
    phone: "+44 800 555 6789",
    email: "manage@propertyvault.co.uk",
    address: "12 Cannon Street, London EC4M 5XX",
    cta: "Get a Free Management Quote",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Pricing", href: "#pricing" },
      { label: "About", href: "#about" },
      { label: "Landlords", href: "#landlords" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "1,200+", label: "Properties Managed" },
      { value: "97%", label: "Occupancy Rate" },
      { value: "15 yr", label: "In Property Management" },
      { value: "£0", label: "Void Month Guarantee" },
    ],
    services: [
      { name: "Tenant Sourcing", desc: "Professional tenant sourcing — listing, viewings, referencing, and Right to Rent checks completed for you.", price: "£650 one-off", icon: "🔍", image: "https://images.pexels.com/photos/1769535/pexels-photo-1769535.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Full Management", desc: "End-to-end property management — rent collection, maintenance, inspections, and tenant communication handled.", price: "8% of rent", icon: "🏠" },
      { name: "Rent Collection", desc: "Rent collection with automated chasing, monthly statements, and direct payment to your account.", price: "4% of rent", icon: "💷" },
      { name: "Maintenance Coordination", desc: "Trusted contractor network for all repairs — emergency and routine. Quotes approved before work begins.", price: "Included in Full Mgmt", icon: "🔧" },
      { name: "Property Inspections", desc: "Quarterly property inspections with written reports and photo evidence sent directly to you.", price: "£75/inspection", icon: "📋" },
      { name: "HMO Management", desc: "Specialist HMO management — licensing compliance, room-by-room tenanting, and multi-tenant coordination.", price: "10% of rent", icon: "🏘️" },
    ],
    about: {
      heading: "London's Most Trusted Independent Property Managers",
      body: "PropertyVault has been managing residential properties across London for 15 years. We currently manage 1,200+ properties for landlords based in the UK and abroad — maintaining a 97% occupancy rate and a contractor network that resolves 80% of maintenance issues within 24 hours.",
      highlights: ["1,200+ properties managed", "97% occupancy rate maintained", "ARLA Propertymark licensed", "24-hour emergency maintenance", "Dedicated portfolio manager"],
      image: "https://images.pexels.com/photos/1769535/pexels-photo-1769535.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Oliver Grant", role: "Managing Director", bio: "15 years in London residential property management. ARLA Propertymark Fellow and HMO specialist.", initials: "OG", color: "#14b8a6" },
      { name: "Amelia Chen", role: "Portfolio Manager", bio: "Manages 400+ client properties. Specialist in overseas landlord compliance and HMRC non-resident requirements.", initials: "AC", color: "#0d9488" },
    ],
    testimonials: [
      { name: "David Okonkwo", location: "Lagos / London portfolio", text: "PropertyVault manages 8 of my London properties. I'm in Nigeria and I genuinely don't worry about them. Rent lands every month, issues are handled. Perfect service.", rating: 5, initials: "DO" },
      { name: "The Williamson Family Trust", location: "London", text: "Transferred our portfolio of 12 units from a larger agency. The personal service and occupancy improvement has been remarkable. Wish we'd changed sooner.", rating: 5, initials: "WFT" },
      { name: "Sophie and Mark H.", location: "Singapore / London", text: "Our buy-to-let in Clapham has been zero stress since PropertyVault took over. Great tenants, prompt maintenance, and clear monthly statements.", rating: 5, initials: "SMH" },
    ],
    faqItems: [
      { q: "What's included in full management?", a: "Everything — tenant sourcing, referencing, contracts, rent collection, maintenance coordination, inspections, compliance, and deposit management." },
      { q: "How do you handle maintenance?", a: "We have a vetted network of contractors. Anything under £150 is authorised by us. Above that, we get your approval first." },
      { q: "Can you manage HMOs?", a: "Yes — we are specialist HMO managers and can assist with licensing applications, compliance, and multi-tenant management." },
      { q: "What happens if the tenant doesn't pay?", a: "We chase rent on Day 1 of arrears and escalate rapidly. Landlord insurance is recommended and we partner with leading providers." },
    ],
    galleryLabels: ["Managed Property", "Tenant Sourcing", "Inspection Report", "Maintenance Callout", "Rent Statement", "Portfolio Dashboard"],
    badges: ["ARLA Propertymark", "97% Occupancy", "1,200+ Properties", "24hr Maintenance"],
  },

  // ── NetSupport ───────────────────────────────────────────────────────────────
  "netsupport-it": {
    tagline: "IT That Protects. IT That Performs.",
    phone: "+65 6789 0011",
    email: "support@netsupportit.sg",
    address: "79 Anson Road, #18-01 Singapore 079906",
    cta: "Get IT Support Now",
    ctaSecondary: "Our Services",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Managed IT", href: "#managed" },
      { label: "Security", href: "#security" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "300+", label: "Business Clients" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "15 min", label: "Avg Response Time" },
      { value: "ISO 27001", label: "Aligned" },
    ],
    services: [
      { name: "Managed IT Support", desc: "Proactive 24/7 monitoring, helpdesk support, patch management, and on-site response for SMEs.", price: "From $99/user/mo", icon: "💻", image: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Network Design & Setup", desc: "Enterprise-grade network infrastructure — routers, switches, Wi-Fi, VPN, and cloud integration.", price: "From $2,500", icon: "🌐" },
      { name: "Cyber Security", desc: "Security assessments, endpoint protection, email security, backup, and disaster recovery solutions.", price: "From $299/mo", icon: "🛡️" },
      { name: "Microsoft 365", desc: "Microsoft 365 licensing, migration, configuration, and ongoing support for the full suite.", price: "From $25/user/mo", icon: "📧" },
      { name: "Cloud Solutions", desc: "Azure and AWS cloud migration, management, and cost optimisation for SMEs.", price: "From $500/mo", icon: "☁️" },
      { name: "IT Consulting", desc: "Technology strategy, vendor selection, digital transformation roadmaps, and IT budget planning.", price: "From $200/hr", icon: "📋" },
    ],
    about: {
      heading: "Singapore's Trusted IT Partner for Growing Businesses",
      body: "NetSupport has been the IT backbone of over 300 Singapore businesses for 12 years. Our team of certified engineers delivers enterprise-level IT management to SMEs who need reliable, secure technology without the overhead of an internal IT team. Our 15-minute average response time and 99.9% uptime SLA are guarantees, not aspirations.",
      highlights: ["99.9% uptime SLA guarantee", "15-minute helpdesk response", "Microsoft Gold Partner", "IMDA-certified service provider", "On-site + remote support"],
      image: "https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    pricing: [
      { name: "Starter", price: "$99", period: "per user/month", features: ["Helpdesk support", "Remote monitoring", "Patch management", "Antivirus management", "Monthly reports"], cta: "Get Started" },
      { name: "Business", price: "$149", period: "per user/month", features: ["All Starter features", "Cyber security stack", "Microsoft 365 support", "Backup & recovery", "On-site visits", "4-hr SLA"], highlight: true, cta: "Get Started" },
      { name: "Enterprise", price: "Custom", features: ["All Business features", "Dedicated engineer", "15-min response SLA", "CISO advisory", "Cloud management", "Custom integrations"], cta: "Contact Us" },
    ],
    team: [
      { name: "Marcus Lim", role: "CTO & Co-founder", bio: "20 years in enterprise IT. Former Accenture consultant and CISM-certified security specialist.", initials: "ML", color: "#06b6d4" },
      { name: "Rachel Goh", role: "Head of Client Success", bio: "Ensures every client gets maximum value from their IT investment. Manages 300+ client relationships.", initials: "RG", color: "#0891b2" },
    ],
    testimonials: [
      { name: "Kevin Tan", location: "Raffles Place, Singapore", text: "NetSupport took over our IT and the difference was immediate. Zero downtime in 18 months, every issue resolved in minutes. Our team is so much more productive.", rating: 5, initials: "KT" },
      { name: "Priya Law Firm", location: "Tanjong Pagar", text: "They migrated us to Microsoft 365 and set up proper cyber security. The whole process was seamless and the support since has been excellent.", rating: 5, initials: "PLF" },
      { name: "Alex W.", location: "One-North", text: "Had a ransomware attempt last year. NetSupport's security stack blocked it and their incident response was incredible. Can't put a value on that.", rating: 5, initials: "AW" },
    ],
    faqItems: [
      { q: "What's your response time guarantee?", a: "Critical issues: 15 minutes remote response. High: 1 hour. Medium: 4 hours. On-site within 4 hours for Business and Enterprise clients." },
      { q: "Do you support Macs?", a: "Yes — we support Windows, macOS, iOS, and Android across all services." },
      { q: "Can you take over from our current IT provider?", a: "Yes — we handle all transitions and will do a full audit of your existing environment before onboarding." },
      { q: "Is cyber security included?", a: "Basic antivirus is included in all plans. Full cyber security stack (EDR, email filtering, backup, SIEM) is included in Business plans and above." },
    ],
    galleryLabels: ["Server Room", "Network Setup", "Security Operations", "Help Desk", "Cloud Migration", "Client Training"],
    badges: ["Microsoft Gold Partner", "99.9% Uptime SLA", "IMDA Certified", "300+ Clients"],
  },

  // ── GrowthLab ────────────────────────────────────────────────────────────────
  "growthlab-agency": {
    tagline: "Data-Driven Marketing That Delivers.",
    phone: "+971 4 567 8901",
    email: "hello@growthlabagency.ae",
    address: "Level 14, Emaar Square Building 1, Downtown Dubai",
    cta: "Book a Strategy Call",
    ctaSecondary: "Our Results",
    navLinks: [
      { label: "Services", href: "#services" },
      { label: "Results", href: "#results" },
      { label: "About", href: "#about" },
      { label: "Team", href: "#team" },
      { label: "Contact", href: "#contact" },
    ],
    stats: [
      { value: "150+", label: "Brands Grown" },
      { value: "380%", label: "Avg ROI for Clients" },
      { value: "8 yr", label: "In Digital Marketing" },
      { value: "Meta", label: "Business Partner" },
    ],
    services: [
      { name: "SEO & Content Marketing", desc: "Technical SEO, keyword strategy, content creation, and link building — for sustainable organic growth.", price: "From AED 3,500/mo", icon: "🔍", image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&q=80" },
      { name: "Paid Advertising (PPC)", desc: "Google Ads, Meta Ads, TikTok, and LinkedIn campaigns — managed for maximum ROAS.", price: "From AED 4,000/mo", icon: "📢" },
      { name: "Social Media Management", desc: "Full social media management — content strategy, creation, scheduling, and community management.", price: "From AED 2,500/mo", icon: "📱" },
      { name: "Email Marketing", desc: "Automated email campaigns, newsletters, and CRM integration — turning leads into loyal customers.", price: "From AED 1,800/mo", icon: "📧" },
      { name: "Website & Landing Pages", desc: "Conversion-optimised website design, CRO audits, and landing page builds that turn traffic into leads.", price: "From AED 8,000", icon: "🌐" },
      { name: "Analytics & Reporting", desc: "Custom dashboard setup, monthly reporting, attribution modelling, and actionable data insights.", price: "From AED 1,500/mo", icon: "📊" },
    ],
    about: {
      heading: "Dubai's Most Results-Focused Digital Marketing Agency",
      body: "GrowthLab was founded because too many agencies focus on vanity metrics instead of business results. Every campaign we run is built around one question: what is the measurable return? Over 8 years, we've helped 150+ brands across the UAE, Saudi Arabia, and UK achieve an average 380% ROI on their marketing investment.",
      highlights: ["Meta Business Partner", "Google Premier Partner", "Results-guaranteed engagements", "Dedicated account manager", "Monthly transparent reporting"],
      image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&q=80",
    },
    team: [
      { name: "Nadia Hassan", role: "Founder & Strategy Director", bio: "8 years in digital marketing. Former Head of Growth at a Dubai unicorn. Specialist in B2C and D2C growth.", initials: "NH", color: "#8b5cf6" },
      { name: "Tom Clarke", role: "Head of Paid Media", bio: "Google and Meta certified. Manages $2M+ in monthly ad spend across client accounts.", initials: "TC", color: "#7c3aed" },
      { name: "Layla Al Hamdan", role: "SEO & Content Lead", bio: "Technical SEO specialist and content strategist. Has grown organic traffic 10x for multiple clients.", initials: "LAH", color: "#6d28d9" },
    ],
    testimonials: [
      { name: "Richard Forde", location: "Dubai", text: "GrowthLab took our e-commerce from $80k to $420k monthly revenue in 9 months through SEO and paid ads. The ROI speaks for itself. Outstanding team.", rating: 5, initials: "RF" },
      { name: "Fatima Al Sayed", location: "Abu Dhabi", text: "Social media strategy transformed our brand awareness. 10x Instagram following, 5x website traffic, and the leads are genuinely qualified. Exceptional work.", rating: 5, initials: "FAS" },
      { name: "Mark Stevenson", location: "DIFC, Dubai", text: "Best marketing agency we've worked with in 15 years of business. Transparent, results-focused, and they actually understand our industry.", rating: 5, initials: "MS" },
    ],
    faqItems: [
      { q: "Do you guarantee results?", a: "We offer performance-based KPI commitments on campaigns with 3+ month terms. If agreed KPIs aren't met, we work for free until they are." },
      { q: "What's your minimum contract?", a: "We work on 3-month minimum engagements for retained services. Project work (websites, one-off campaigns) has no minimum term." },
      { q: "Do you work with businesses outside the UAE?", a: "Yes — we work with clients across UAE, Saudi Arabia, UK, and Australia remotely." },
      { q: "How do you report on performance?", a: "Clients receive weekly performance snapshots and a comprehensive monthly report with recommendations. Full dashboard access is always available." },
    ],
    galleryLabels: ["Campaign Results", "Strategy Session", "Creative Content", "Analytics Dashboard", "Client Wins", "Team Culture"],
    badges: ["Meta Business Partner", "Google Premier Partner", "380% Avg ROI", "150+ Brands Grown"],
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
