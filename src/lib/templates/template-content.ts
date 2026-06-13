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
  about: { heading: string; body: string; highlights: string[] };
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
      { name: "Full Home Renovation", desc: "Complete HDB or condo overhaul — carpentry, tiling, electrical, plumbing and painting. Turnkey delivery.", price: "From $18,000", icon: "🏠" },
      { name: "Commercial Fitout", desc: "Office, retail, F&B and co-working spaces built to spec. We manage permits.", price: "Request Quote", icon: "🏢" },
      { name: "Kitchen Remodel", desc: "Custom carpentry, hob, hood and sink installation. Full tiling and waterproofing.", price: "From $6,500", icon: "🍳" },
      { name: "Bathroom Renovation", desc: "Waterproofing, tiling, sanitary fitting, mirror cabinet and lighting.", price: "From $4,200", icon: "🚿" },
      { name: "Carpentry & Wardrobes", desc: "Full custom carpentry — platform beds, wardrobes, TV consoles. E0 board standard.", price: "From $1,800", icon: "🪵" },
      { name: "Hacking & Demolition", desc: "Wall hacking, floor hacking and structural opening works. HDB-approved.", price: "From $800", icon: "⚒️" },
    ],
    about: {
      heading: "600+ Projects. Zero Compromises.",
      body: "BuildRight has been transforming homes, offices and commercial spaces across Singapore since 2008. Our team handles every trade in-house — meaning tighter timelines, cleaner finishes and one point of accountability.",
      highlights: ["HDB licensed renovator", "All trades in-house", "3-year workmanship warranty", "Fixed-price contracts", "600+ completed projects"],
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
      { name: "Interior House Painting", desc: "Full interior repaint for HDB, condo or landed — walls, ceilings, doors and trim.", price: "From $380 (3-room)", icon: "🏠" },
      { name: "Feature Wall Painting", desc: "Accent walls, geometric patterns, ombre effects and decorative finishes.", price: "From $180/wall", icon: "🎨" },
      { name: "Exterior Painting", desc: "HDB block touch-up, landed exterior and metal gates. Weatherproof paint.", price: "From $800", icon: "🏗️" },
      { name: "Commercial Repainting", desc: "Office, retail, restaurant repainting. Weekend and after-hours slots.", price: "Request Quote", icon: "🏢" },
      { name: "Wallpaper Installation", desc: "Supply and install wallpaper, murals and vinyl wall decals.", price: "From $8/sqft", icon: "🖼️" },
      { name: "Texture & Specialty Finishes", desc: "Sand texture, marble effect, lime wash and decorative wall coatings.", price: "From $12/sqft", icon: "✨" },
    ],
    about: {
      heading: "Singapore's Trusted Painting Specialists Since 2010",
      body: "ColourCraft's team of 30 certified painters and decorators serves homeowners and businesses across Singapore using premium Nippon, Dulux and Jotun paints that are low-VOC and safe for families and pets.",
      highlights: ["BizSafe certified", "Low-VOC eco-friendly paints", "Furniture fully protected", "On-time project guarantee", "Free colour consultation"],
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
      { name: "General Pest Control", desc: "Treatment for cockroaches, ants, flies and common household insects.", price: "From $80/treatment", icon: "🐛" },
      { name: "Termite Treatment", desc: "Soil treatment, baiting systems and structural pre-treatment. 5-year warranty.", price: "From $350", icon: "🪲" },
      { name: "Rodent Control", desc: "Rat and mouse elimination using tamper-resistant bait stations. Monthly monitoring.", price: "From $180", icon: "🐀" },
      { name: "Bed Bug Treatment", desc: "Heat treatment and chemical residual treatment. 3-month warranty.", price: "From $280", icon: "🛏️" },
      { name: "Mosquito Control & Fogging", desc: "ULV thermal fogging, larviciding and misting systems.", price: "From $120", icon: "🦟" },
      { name: "Commercial Contracts", desc: "NEA-compliant annual pest management for F&B, hospitality and healthcare.", price: "From $800/year", icon: "🏢" },
    ],
    about: {
      heading: "NEA-Licensed. Eco-Certified. Trusted by 5,000+ Clients.",
      body: "PestShield has been protecting Singapore homes and commercial premises since 2009 using Integrated Pest Management methods — safe and effective solutions that eliminate pests at the source.",
      highlights: ["NEA licensed", "ISO 9001:2015 certified", "Eco-certified treatments", "Annual contracts available", "24/7 emergency callout"],
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
      { name: "Corporate Uniforms", desc: "Polo shirts, formal shirts, trousers and blazers with your logo. MOQ 20 pcs.", price: "From $8/piece", icon: "👔" },
      { name: "F&B & Hospitality Wear", desc: "Chef coats, aprons, server uniforms. Stain-resistant and easy-care fabrics.", price: "From $6/piece", icon: "🧑‍🍳" },
      { name: "Healthcare & Medical", desc: "Scrubs, lab coats, nursing uniforms. Anti-microbial fabric options available.", price: "From $10/piece", icon: "🏥" },
      { name: "Industrial Workwear", desc: "High-visibility vests, coveralls and PPE-compliant workwear.", price: "From $12/piece", icon: "🦺" },
      { name: "School & Sports Uniforms", desc: "School uniforms, PE kits, team jerseys and sports apparel.", price: "From $5/piece", icon: "🎒" },
      { name: "Embroidery & Printing", desc: "Logo embroidery, screen printing, heat transfer and sublimation.", price: "From $2/piece", icon: "🪡" },
    ],
    about: {
      heading: "18 Years of Uniform Manufacturing Excellence",
      body: "UniformPro is a Bangladesh-based garment manufacturer with our own 40,000 sqft factory and 300 skilled machinists. We deliver high-quality uniforms at factory-direct prices to clients across Southeast Asia, the Middle East and beyond.",
      highlights: ["Own 40,000 sqft factory", "300 skilled machinists", "In-house embroidery & printing", "GOTS-certified fabrics available", "Export to 25+ countries"],
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
      { name: "Glass Partitions", desc: "Frameless, semi-frameless and framed glass partition systems. Any glass type.", price: "From $80/sqft", icon: "🪟" },
      { name: "Aluminium Windows & Doors", desc: "Casement, sliding, awning and bi-fold aluminium windows and doors.", price: "From $120/panel", icon: "🚪" },
      { name: "Roller Shutters", desc: "Manual and motorised aluminium roller shutters for shops, warehouses and garages.", price: "From $800/opening", icon: "🏭" },
      { name: "Frameless Glass Doors", desc: "Tempered and laminated frameless glass doors with floor spring or pivot fitting.", price: "From $600/door", icon: "🔲" },
      { name: "Curtain Wall Systems", desc: "Unitised and stick-built aluminium curtain wall for commercial developments.", price: "Request Quote", icon: "🏙️" },
      { name: "Glass Balustrades", desc: "Tempered glass balustrades for staircases, balconies and pool surrounds.", price: "From $150/lm", icon: "🪜" },
    ],
    about: {
      heading: "12 Years of Precision Glass & Aluminium Fabrication",
      body: "GlassLine is a Singapore-based glass and aluminium specialist with our own fabrication workshop and 25 skilled installers, working across residential, commercial and industrial sectors.",
      highlights: ["BCA registered contractor", "Own fabrication workshop", "SS 212 and BCA compliant", "1-year installation warranty", "Same-week survey & quotation"],
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
    },
    testimonials: [
      { name: "John D.", location: "Local Client", text: "Fantastic service from start to finish. Professional, punctual and the results were outstanding. Highly recommended.", rating: 5, initials: "JD" },
      { name: "Sarah P.", location: "Regular Client", text: "I've used this company three times now and the quality has been consistently excellent. Will absolutely be back.", rating: 5, initials: "SP" },
    ],
    badges: fallback.badges ?? ["Professional", "Licensed", "5★ Rated", "Insured"],
  };
}
