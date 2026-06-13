import type { Block } from "@/types/cms";
import { getSectionPreset } from "./section-presets";
import { createBlock } from "./block-registry";

/**
 * Page templates — complete, ready-made pages a business owner can start
 * from with one click, then just swap the words and photos.
 */

export type PageTemplate = {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  /** Section labels shown in the picker so users know what they get. */
  sections: string[];
  create: () => Block[];
};

function fromPresets(ids: string[]): Block[] {
  const blocks: Block[] = [];
  for (const id of ids) {
    const p = getSectionPreset(id);
    if (p) blocks.push(p.create());
  }
  blocks.forEach((b, i) => (b.order = i));
  return blocks;
}

/** Apply shallow data overrides to a block in a template. */
function withData(block: Block, data: Record<string, unknown>): Block {
  return { ...block, data: { ...(block as { data: Record<string, unknown> }).data, ...data } } as Block;
}

export const pageTemplates: PageTemplate[] = [
  {
    id: "local-service",
    name: "Local Service Business",
    tagline: "Plumbers, electricians, cleaners, landscapers, handymen",
    icon: "🔧",
    sections: ["Welcome", "Services", "Why Choose Us", "Numbers", "Reviews", "How It Works", "Questions", "Free Quote", "Contact"],
    create: () =>
      fromPresets([
        "hero-local-service",
        "services-three",
        "why-choose-us",
        "stats-trust",
        "reviews-three",
        "steps-how-it-works",
        "faq-local",
        "cta-free-quote",
        "contact-form",
      ]),
  },
  {
    id: "restaurant-cafe",
    name: "Restaurant / Café",
    tagline: "Restaurants, cafés, bakeries, food trucks",
    icon: "🍽️",
    sections: ["Big Photo Welcome", "Menu Highlights", "Photos", "Reviews", "Reservation Banner", "Contact & Hours"],
    create: () => {
      const blocks = fromPresets([
        "hero-photo-background",
        "services-three",
        "gallery-work",
        "reviews-three",
        "cta-free-quote",
        "contact-form",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            title: "Good Food, Good Company",
            subtitle: "Fresh, local ingredients — cooked with care",
            badge: "Open 7 days",
            primaryButton: { label: "Reserve a Table", url: "#contact", variant: "primary" },
            secondaryButton: { label: "See the Menu", url: "#services", variant: "outline" },
          });
        if (b.type === "services")
          return withData(b, {
            title: "From Our Kitchen",
            subtitle: "A taste of what we do best",
            items: (b.data as { items: Array<Record<string, unknown>> }).items.map((it, i) => ({
              ...it,
              icon: ["Coffee", "UtensilsCrossed", "Cake"][i] ?? "Star",
              title: ["Breakfast & Brunch", "Lunch & Dinner", "Desserts & Coffee"][i] ?? "Specialty",
              description: [
                "Hearty mornings, from fresh pastries to full plates.",
                "Seasonal menus that change with what's fresh.",
                "House-made desserts and properly good coffee.",
              ][i] ?? "Ask us about today's specials.",
              linkLabel: "View Menu",
              link: "#contact",
            })),
          });
        if (b.type === "gallery") return withData(b, { title: "A Look Inside" });
        if (b.type === "testimonials") return withData(b, { title: "What Our Guests Say" });
        if (b.type === "cta")
          return withData(b, {
            title: "Book Your Table Tonight",
            description: "Walk-ins welcome, but weekends fill up fast — reserve ahead.",
            primaryButton: { label: "Reserve Now", url: "#contact" },
            secondaryButton: { label: "Call Us", url: "tel:+1234567890" },
          });
        if (b.type === "contact")
          return withData(b, {
            title: "Find Us",
            subtitle: "Questions, reservations, private events — send us a note",
          });
        return b;
      });
    },
  },
  {
    id: "salon-spa",
    name: "Salon / Spa / Wellness",
    tagline: "Hair salons, barbers, spas, massage, beauty",
    icon: "💆",
    sections: ["Big Photo Welcome", "Treatments", "Price List", "Reviews", "Booking Banner", "Contact"],
    create: () => {
      const blocks = fromPresets([
        "hero-photo-background",
        "services-three",
        "pricing-simple",
        "reviews-three",
        "cta-free-quote",
        "contact-form",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            title: "Look Good. Feel Better.",
            subtitle: "Your time to relax, restore, and shine",
            badge: "Now accepting new clients",
            primaryButton: { label: "Book an Appointment", url: "#contact", variant: "primary" },
            secondaryButton: { label: "View Treatments", url: "#services", variant: "outline" },
          });
        if (b.type === "services")
          return withData(b, {
            title: "Our Treatments",
            subtitle: "Tailored to you, every visit",
            items: (b.data as { items: Array<Record<string, unknown>> }).items.map((it, i) => ({
              ...it,
              icon: ["Scissors", "Flower2", "Heart"][i] ?? "Star",
              title: ["Hair & Styling", "Spa & Massage", "Skin & Beauty"][i] ?? "Treatment",
              description: [
                "Cuts, color, and styling by people who listen first.",
                "Unwind with treatments designed around you.",
                "Glow-boosting facials and beauty essentials.",
              ][i] ?? "Ask about our seasonal packages.",
              linkLabel: "Book Now",
              link: "#contact",
            })),
          });
        if (b.type === "pricing")
          return withData(b, {
            title: "Treatment Prices",
            subtitle: "Clear prices, no surprises at the till",
          });
        if (b.type === "cta")
          return withData(b, {
            title: "Treat Yourself — You've Earned It",
            description: "Book online in under a minute, or call and we'll find a time that suits you.",
            primaryButton: { label: "Book My Appointment", url: "#contact" },
            secondaryButton: { label: "Call the Salon", url: "tel:+1234567890" },
          });
        return b;
      });
    },
  },
  {
    id: "product-landing",
    name: "Sell a Product / Course",
    tagline: "One-page seller for a product, course, or offer",
    icon: "🚀",
    sections: ["Bold Welcome", "Numbers", "What You Get", "How It Works", "Reviews", "Prices", "Questions", "Action Banner", "Email Signup"],
    create: () => {
      const blocks = fromPresets([
        "hero-bold-announcement",
        "stats-trust",
        "why-choose-us",
        "steps-how-it-works",
        "reviews-three",
        "pricing-simple",
        "faq-local",
        "cta-free-quote",
        "newsletter-signup",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            badge: "Limited-time launch offer",
            title: "The Easier Way to Get Results",
            subtitle: "Everything you need, in one simple package",
            primaryButton: { label: "Get It Now", url: "#pricing", variant: "primary" },
          });
        if (b.type === "features")
          return withData(b, { title: "What You Get", subtitle: "Everything included, nothing held back" });
        if (b.type === "cta")
          return withData(b, {
            title: "Start Today, Risk-Free",
            description: "30-day money-back guarantee. If it's not for you, you pay nothing.",
            primaryButton: { label: "Get Started", url: "#pricing" },
            secondaryButton: { label: "Ask a Question", url: "#contact" },
          });
        return b;
      });
    },
  },
  {
    id: "about-contact",
    name: "Simple About + Contact",
    tagline: "A clean one-pager: who you are and how to reach you",
    icon: "📄",
    sections: ["Welcome", "About Us", "Meet the Team", "Contact"],
    create: () =>
      fromPresets(["hero-local-service", "about-us-text", "team-grid", "contact-form"]),
  },
  {
    id: "blank",
    name: "Start Blank",
    tagline: "Build from scratch, section by section",
    icon: "✨",
    sections: [],
    create: () => {
      const hero = createBlock("hero");
      return hero ? [hero] : [];
    },
  },
  {
    id: "real-estate",
    name: "Real Estate Agency",
    tagline: "Property listings, agents, and buyer journey",
    icon: "🏡",
    sections: ["Hero", "Property Types", "Why Choose Us", "Agent Stats", "Client Reviews", "FAQ", "Free Valuation CTA", "Contact"],
    create: () => {
      const blocks = fromPresets([
        "hero-local-service",
        "services-three",
        "why-choose-us",
        "stats-trust",
        "reviews-three",
        "faq-local",
        "cta-free-quote",
        "contact-form",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            badge: "Trusted Since 2004",
            title: "Find Your Dream Home",
            subtitle: "Premium residential and commercial properties in the most sought-after locations.",
            primaryButton: { label: "Browse Properties", url: "#services", variant: "primary" },
            secondaryButton: { label: "Free Valuation", url: "#contact", variant: "outline" },
          });
        if (b.type === "services")
          return withData(b, {
            title: "Property Categories",
            subtitle: "From starter homes to luxury estates",
            items: (b.data as { items: Array<Record<string, unknown>> }).items.map((it, i) => ({
              ...it,
              icon: ["Home", "Building2", "Waves"][i] ?? "MapPin",
              title: ["Residential Homes", "Commercial Property", "Luxury & Waterfront"][i] ?? "Property",
              description: [
                "Houses, apartments and townhomes across all price ranges.",
                "Offices, retail spaces and investment properties.",
                "Premium estates, penthouses and waterfront living.",
              ][i] ?? "Contact us for available listings.",
              linkLabel: "View Listings",
              link: "#contact",
            })),
          });
        if (b.type === "stats")
          return withData(b, {
            items: [
              { id: "s1", value: "4,200+", label: "Homes Sold" },
              { id: "s2", value: "$3.2B", label: "Total Sales" },
              { id: "s3", value: "14 days", label: "Avg to Offer" },
              { id: "s4", value: "20 yr", label: "Experience" },
            ],
          });
        if (b.type === "cta")
          return withData(b, {
            title: "What's Your Property Worth?",
            description: "Get a free, no-obligation market appraisal from our senior agents within 48 hours.",
            primaryButton: { label: "Book Free Valuation", url: "#contact" },
            secondaryButton: { label: "Browse Listings", url: "#services" },
          });
        return b;
      });
    },
  },
  {
    id: "photography-studio",
    name: "Photography Studio",
    tagline: "Photographer portfolio with gallery, packages, booking",
    icon: "📷",
    sections: ["Full-Screen Hero", "Services", "Portfolio Gallery", "Packages", "Client Reviews", "Questions", "Book a Session"],
    create: () => {
      const blocks = fromPresets([
        "hero-photo-background",
        "services-three",
        "gallery-work",
        "pricing-simple",
        "reviews-three",
        "faq-local",
        "contact-form",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            badge: "Booking open for 2025",
            title: "Moments That Last Forever",
            subtitle: "Award-winning photography for weddings, portraits and brands.",
            primaryButton: { label: "Book a Session", url: "#contact", variant: "primary" },
            secondaryButton: { label: "View Portfolio", url: "#gallery", variant: "outline" },
          });
        if (b.type === "services")
          return withData(b, {
            title: "Photography Services",
            subtitle: "Every story told with care and intention",
            items: (b.data as { items: Array<Record<string, unknown>> }).items.map((it, i) => ({
              ...it,
              icon: ["Heart", "User", "Camera"][i] ?? "Star",
              title: ["Wedding Photography", "Portrait Sessions", "Commercial & Brand"][i] ?? "Session",
              description: [
                "Full-day coverage, 600+ edited images, two photographers.",
                "Personal branding, family portraits and headshots.",
                "Product shoots, campaigns and editorial imagery for brands.",
              ][i] ?? "Contact us for custom packages.",
              linkLabel: "Learn More",
              link: "#pricing",
            })),
          });
        if (b.type === "gallery") return withData(b, { title: "Portfolio" });
        if (b.type === "pricing")
          return withData(b, {
            title: "Session Packages",
            subtitle: "Clear pricing, no hidden fees",
          });
        if (b.type === "cta")
          return withData(b, {
            title: "Ready to Tell Your Story?",
            description: "Sessions book up fast. Secure your date today.",
            primaryButton: { label: "Book Now", url: "#contact" },
          });
        return b;
      });
    },
  },
  {
    id: "medical-dental",
    name: "Medical / Dental Clinic",
    tagline: "Healthcare practice with treatments, team, appointments",
    icon: "🦷",
    sections: ["Hero", "Treatments", "Trust Signals", "Stats", "Patient Reviews", "Meet the Team", "FAQ", "Book Appointment"],
    create: () => {
      const blocks = fromPresets([
        "hero-local-service",
        "services-three",
        "why-choose-us",
        "stats-trust",
        "reviews-three",
        "team-grid",
        "faq-local",
        "contact-form",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            badge: "New Patients Always Welcome",
            title: "Your Smile Deserves the Best Care",
            subtitle: "Gentle, modern dentistry for the whole family.",
            primaryButton: { label: "Book Appointment", url: "#contact", variant: "primary" },
            secondaryButton: { label: "Our Treatments", url: "#services", variant: "outline" },
          });
        if (b.type === "services")
          return withData(b, {
            title: "Our Treatments",
            subtitle: "From routine care to complete smile transformations",
            items: (b.data as { items: Array<Record<string, unknown>> }).items.map((it, i) => ({
              ...it,
              icon: ["Smile", "Sparkles", "Shield"][i] ?? "Heart",
              title: ["General Dentistry", "Cosmetic Treatments", "Orthodontics"][i] ?? "Treatment",
              description: [
                "Check-ups, cleans, fillings and emergency care.",
                "Whitening, veneers and full smile makeovers.",
                "Invisalign and braces for all ages.",
              ][i] ?? "Ask us about your options.",
              linkLabel: "Find Out More",
              link: "#contact",
            })),
          });
        if (b.type === "stats")
          return withData(b, {
            items: [
              { id: "s1", value: "6,200+", label: "Happy Patients" },
              { id: "s2", value: "15 yr", label: "Established" },
              { id: "s3", value: "4.9★", label: "Average Rating" },
              { id: "s4", value: "98%", label: "Recommend Us" },
            ],
          });
        if (b.type === "cta")
          return withData(b, {
            title: "Book Your Appointment Today",
            description: "Same-day emergency appointments available. New patients always welcome.",
            primaryButton: { label: "Book Online", url: "#contact" },
            secondaryButton: { label: "Call Us", url: "tel:+1234567890" },
          });
        return b;
      });
    },
  },
  {
    id: "coffee-shop",
    name: "Coffee Shop / Café",
    tagline: "Independent café with menu, story, events",
    icon: "☕",
    sections: ["Big Photo Welcome", "Menu", "Gallery", "Our Story", "Reviews", "Events", "Contact & Hours"],
    create: () => {
      const blocks = fromPresets([
        "hero-photo-background",
        "services-three",
        "gallery-work",
        "about-us-text",
        "reviews-three",
        "cta-free-quote",
        "contact-form",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            badge: "Specialty Grade Coffee",
            title: "Coffee That Starts Your Day Right",
            subtitle: "Slow brews, fresh pastries and a seat that's always yours.",
            primaryButton: { label: "View Menu", url: "#services", variant: "primary" },
            secondaryButton: { label: "Find Us", url: "#contact", variant: "outline" },
          });
        if (b.type === "services")
          return withData(b, {
            title: "What We Serve",
            subtitle: "Made fresh, every single day",
            items: (b.data as { items: Array<Record<string, unknown>> }).items.map((it, i) => ({
              ...it,
              icon: ["Coffee", "Cookie", "Salad"][i] ?? "Star",
              title: ["Espresso & Filter", "Baked Fresh Daily", "All-Day Brunch"][i] ?? "Special",
              description: [
                "Single origin espresso, cold brew and filter from rotating micro-roasters.",
                "Croissants, banana bread and pastries baked on-site every morning.",
                "Avocado toast, egg plates and seasonal grain bowls until 3pm.",
              ][i] ?? "Ask about today's specials.",
              linkLabel: "See Menu",
              link: "#contact",
            })),
          });
        if (b.type === "gallery") return withData(b, { title: "Inside BrewHaven" });
        if (b.type === "cta")
          return withData(b, {
            title: "Host Your Event With Us",
            description: "Private hire, pop-up bars and corporate catering available.",
            primaryButton: { label: "Get in Touch", url: "#contact" },
          });
        return b;
      });
    },
  },
  {
    id: "wedding-planner",
    name: "Wedding Planner",
    tagline: "Luxury event planning with packages, gallery, testimonials",
    icon: "💍",
    sections: ["Big Photo Welcome", "Services", "Portfolio Gallery", "Packages", "Client Stories", "FAQ", "Start Planning"],
    create: () => {
      const blocks = fromPresets([
        "hero-photo-background",
        "services-three",
        "gallery-work",
        "pricing-simple",
        "reviews-three",
        "faq-local",
        "contact-form",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            badge: "150+ Weddings Celebrated",
            title: "Your Dream Wedding, Perfectly Planned",
            subtitle: "Luxury wedding design and coordination for couples who deserve the extraordinary.",
            primaryButton: { label: "Start Planning", url: "#contact", variant: "primary" },
            secondaryButton: { label: "View Our Work", url: "#gallery", variant: "outline" },
          });
        if (b.type === "services")
          return withData(b, {
            title: "Our Services",
            subtitle: "From vision to flawless execution",
            items: (b.data as { items: Array<Record<string, unknown>> }).items.map((it, i) => ({
              ...it,
              icon: ["Calendar", "Flower2", "Star"][i] ?? "Heart",
              title: ["Full Planning & Design", "Floral & Styling", "Day-of Coordination"][i] ?? "Service",
              description: [
                "End-to-end coordination from engagement to wedding day.",
                "Floral design, venue styling and complete decor direction.",
                "A dedicated coordinator on your day so you're fully present.",
              ][i] ?? "Tell us about your vision.",
              linkLabel: "Find Out More",
              link: "#pricing",
            })),
          });
        if (b.type === "gallery") return withData(b, { title: "Recent Celebrations" });
        if (b.type === "pricing")
          return withData(b, {
            title: "Planning Packages",
            subtitle: "Thoughtfully priced to suit every love story",
          });
        if (b.type === "cta")
          return withData(b, {
            title: "Let's Start Designing Your Day",
            description: "Begin with a free discovery call to share your vision.",
            primaryButton: { label: "Book Discovery Call", url: "#contact" },
          });
        return b;
      });
    },
  },
  {
    id: "fashion-boutique",
    name: "Fashion Boutique",
    tagline: "Luxury retail store with collections, lookbook, styling",
    icon: "👗",
    sections: ["Editorial Hero", "Collections", "Lookbook Gallery", "Styling Services", "Client Reviews", "Visit Us"],
    create: () => {
      const blocks = fromPresets([
        "hero-photo-background",
        "services-three",
        "gallery-work",
        "reviews-three",
        "cta-free-quote",
        "contact-form",
      ]);
      return blocks.map((b) => {
        if (b.type === "hero")
          return withData(b, {
            badge: "New Season Collection Now Live",
            title: "Wear What You Believe In",
            subtitle: "Curated fashion for the discerning. New collections every season.",
            primaryButton: { label: "Shop Now", url: "#services", variant: "primary" },
            secondaryButton: { label: "Book Styling", url: "#contact", variant: "outline" },
          });
        if (b.type === "services")
          return withData(b, {
            title: "Collections",
            subtitle: "Less, but better",
            items: (b.data as { items: Array<Record<string, unknown>> }).items.map((it, i) => ({
              ...it,
              icon: ["ShoppingBag", "Shirt", "Sparkles"][i] ?? "Star",
              title: ["Women's Collection", "Men's Edit", "Personal Styling"][i] ?? "Collection",
              description: [
                "Seasonal ready-to-wear from independent European designers.",
                "Minimal, precise menswear from Scandinavian and Japanese labels.",
                "90-minute one-on-one wardrobe curation with our in-house stylist.",
              ][i] ?? "Visit us in-store or book an appointment.",
              linkLabel: "Explore",
              link: "#contact",
            })),
          });
        if (b.type === "gallery") return withData(b, { title: "Lookbook" });
        if (b.type === "testimonials") return withData(b, { title: "What Our Clients Say" });
        if (b.type === "cta")
          return withData(b, {
            title: "Book a Private Styling Session",
            description: "One-on-one wardrobe curation. By appointment, Tuesday–Saturday.",
            primaryButton: { label: "Book Styling", url: "#contact" },
            secondaryButton: { label: "Visit the Store", url: "#contact" },
          });
        return b;
      });
    },
  },
];

export function getPageTemplate(id: string): PageTemplate | undefined {
  return pageTemplates.find((t) => t.id === id);
}
