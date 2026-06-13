import type { Block, BlockType } from "@/types/cms";
import { createBlock } from "./block-registry";
import { generateId } from "@/lib/utils";

/**
 * Section presets — ready-made, pre-written sections aimed at local service
 * business owners. Each preset is a fully designed block with realistic copy
 * so a non-technical user can add it and only swap the words that differ.
 */

export type PresetCategory = "top" | "services" | "trust" | "info" | "action" | "media";

export const presetCategoryLabels: Record<PresetCategory, string> = {
  top: "Top of Page",
  services: "Services & Prices",
  trust: "Build Trust",
  info: "Tell Your Story",
  action: "Get Customers",
  media: "Photos & Video",
};

export type SectionPreset = {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: PresetCategory;
  blockType: BlockType;
  create: () => Block;
};

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

/** Create a block from the registry and override its data + top-level props. */
function preset(
  type: BlockType,
  data: Record<string, unknown>,
  blockOverrides: DeepPartial<Block> = {},
): Block {
  const block = createBlock(type);
  if (!block) throw new Error(`Unknown block type: ${type}`);
  const merged = {
    ...block,
    ...blockOverrides,
    data: { ...(block as { data: Record<string, unknown> }).data, ...data },
  } as Block;
  return merged;
}

const item = <T extends Record<string, unknown>>(props: T) => ({ id: generateId(), ...props });

export const sectionPresets: SectionPreset[] = [
  // ─── Top of Page ────────────────────────────────────────────────────────────
  {
    id: "hero-local-service",
    label: "Welcome — Local Service",
    description: "Photo on the right, your promise on the left, with a quote button",
    icon: "🏠",
    category: "top",
    blockType: "hero",
    create: () =>
      preset(
        "hero",
        {
          badge: "Family-owned & operated",
          title: "Your Trusted Local Experts",
          subtitle: "Fast, friendly service — done right the first time",
          description:
            "We've served this community for years. Licensed, insured, and always on time. Tell us what you need and we'll take care of the rest.",
          primaryButton: { label: "Get a Free Quote", url: "#contact", variant: "primary" },
          secondaryButton: { label: "Call Us Now", url: "tel:+1234567890", variant: "outline" },
        },
        { templateVariant: "split-image-right" },
      ),
  },
  {
    id: "hero-photo-background",
    label: "Welcome — Big Photo",
    description: "Full-screen photo with your name over it — great for restaurants & salons",
    icon: "🖼️",
    category: "top",
    blockType: "hero",
    create: () =>
      preset(
        "hero",
        {
          badge: "Welcome",
          title: "A Place You'll Love",
          subtitle: "Quality and care in everything we do",
          primaryButton: { label: "Book Now", url: "#contact", variant: "primary" },
          secondaryButton: { label: "See More", url: "#services", variant: "outline" },
        },
        { templateVariant: "fullscreen-overlay", padding: { top: 0, right: 0, bottom: 0, left: 0 } },
      ),
  },
  {
    id: "hero-bold-announcement",
    label: "Welcome — Big & Bold",
    description: "Large centered headline — make one strong statement",
    icon: "📢",
    category: "top",
    blockType: "hero",
    create: () =>
      preset(
        "hero",
        {
          badge: "Now taking new customers",
          title: "The Best Service in Town",
          subtitle: "And we can prove it — ask our customers",
          primaryButton: { label: "Get Started", url: "#contact", variant: "primary" },
          secondaryButton: undefined,
        },
        { templateVariant: "centered-bold" },
      ),
  },

  // ─── Services & Prices ──────────────────────────────────────────────────────
  {
    id: "services-three",
    label: "Our Services — 3 Cards",
    description: "Show the three services customers ask for most",
    icon: "🛠️",
    category: "services",
    blockType: "services",
    create: () =>
      preset("services", {
        title: "What We Do",
        subtitle: "Honest work at honest prices",
        columns: 3,
        items: [
          item({ icon: "Wrench", iconType: "lucide", title: "Repairs", description: "Quick fixes done properly, with parts and labor guaranteed.", link: "#contact", linkLabel: "Get a Quote" }),
          item({ icon: "Sparkles", iconType: "lucide", title: "Installations", description: "New installations handled start to finish — no mess left behind.", link: "#contact", linkLabel: "Get a Quote" }),
          item({ icon: "CalendarCheck", iconType: "lucide", title: "Maintenance", description: "Regular check-ups that prevent expensive surprises later.", link: "#contact", linkLabel: "Get a Quote" }),
        ],
      }),
  },
  {
    id: "services-six",
    label: "Our Services — Full List",
    description: "A bigger grid for businesses that offer many services",
    icon: "📋",
    category: "services",
    blockType: "services",
    create: () =>
      preset("services", {
        title: "Everything We Offer",
        subtitle: "One call covers it all",
        columns: 3,
        items: [
          item({ icon: "Wrench", iconType: "lucide", title: "Repairs", description: "Fast, reliable fixes.", link: "#contact", linkLabel: "Learn More" }),
          item({ icon: "Hammer", iconType: "lucide", title: "Installations", description: "Done right, first time.", link: "#contact", linkLabel: "Learn More" }),
          item({ icon: "CalendarCheck", iconType: "lucide", title: "Maintenance", description: "Stay ahead of problems.", link: "#contact", linkLabel: "Learn More" }),
          item({ icon: "AlarmClock", iconType: "lucide", title: "Emergency Call-Outs", description: "We pick up, day or night.", link: "#contact", linkLabel: "Learn More" }),
          item({ icon: "ClipboardList", iconType: "lucide", title: "Inspections", description: "Honest reports, no upselling.", link: "#contact", linkLabel: "Learn More" }),
          item({ icon: "ShieldCheck", iconType: "lucide", title: "Warranty Work", description: "We stand behind our work.", link: "#contact", linkLabel: "Learn More" }),
        ],
      }),
  },
  {
    id: "pricing-simple",
    label: "Price List",
    description: "Three clear prices so customers know what to expect",
    icon: "💵",
    category: "services",
    blockType: "pricing",
    create: () =>
      preset("pricing", {
        title: "Simple, Honest Pricing",
        subtitle: "No hidden fees — the price we quote is the price you pay",
        plans: [
          item({ name: "Basic Visit", price: "$99", period: "", description: "For small jobs", features: ["Up to 1 hour on site", "Free assessment", "Parts billed at cost"], ctaLabel: "Book Now", ctaUrl: "#contact" }),
          item({ name: "Standard Job", price: "$249", period: "", description: "Our most common call-out", features: ["Up to half a day", "All standard parts included", "Workmanship guarantee", "Same-week scheduling"], highlighted: true, badge: "Most Popular", ctaLabel: "Book Now", ctaUrl: "#contact" }),
          item({ name: "Big Project", price: "Custom", period: "", description: "Renovations & large installs", features: ["Free on-site quote", "Fixed price before we start", "Dedicated project contact"], ctaLabel: "Request a Quote", ctaUrl: "#contact" }),
        ],
      }),
  },

  // ─── Build Trust ────────────────────────────────────────────────────────────
  {
    id: "reviews-three",
    label: "Customer Reviews",
    description: "Three 5-star reviews — your best salespeople",
    icon: "⭐",
    category: "trust",
    blockType: "testimonials",
    create: () =>
      preset("testimonials", {
        title: "What Our Customers Say",
        items: [
          item({ name: "Maria G.", role: "Homeowner", company: "", content: "Showed up on time, explained everything clearly, and the price matched the quote exactly. Rare these days!", rating: 5 }),
          item({ name: "David R.", role: "Local Business Owner", company: "", content: "They've handled all our maintenance for two years. Reliable, tidy, and easy to reach when something comes up.", rating: 5 }),
          item({ name: "Susan K.", role: "Homeowner", company: "", content: "Called in the morning, fixed by the afternoon. Friendly crew who clearly know their trade. Highly recommend.", rating: 5 }),
        ],
      }),
  },
  {
    id: "stats-trust",
    label: "Numbers That Impress",
    description: "Years in business, happy customers, jobs done",
    icon: "🔢",
    category: "trust",
    blockType: "stats",
    create: () =>
      preset("stats", {
        title: "Why Neighbors Choose Us",
        items: [
          item({ value: "15", label: "Years in Business", suffix: "+" }),
          item({ value: "2500", label: "Happy Customers", suffix: "+" }),
          item({ value: "4.9", label: "Average Rating", suffix: "★" }),
          item({ value: "100", label: "Satisfaction Guaranteed", suffix: "%" }),
        ],
      }),
  },
  {
    id: "why-choose-us",
    label: "Why Choose Us",
    description: "Six reasons customers should pick you over the competition",
    icon: "🏆",
    category: "trust",
    blockType: "features",
    create: () =>
      preset("features", {
        title: "Why Choose Us",
        subtitle: "The little things that make a big difference",
        items: [
          item({ icon: "BadgeCheck", title: "Licensed & Insured", description: "Fully certified, so you're covered no matter what." }),
          item({ icon: "Clock", title: "Always On Time", description: "We respect your schedule — if we're late, the visit's discounted." }),
          item({ icon: "HandCoins", title: "Up-Front Pricing", description: "You approve the price before any work begins." }),
          item({ icon: "MapPin", title: "Local Team", description: "We live here too. Your neighbors are our customers." }),
          item({ icon: "ShieldCheck", title: "Work Guaranteed", description: "If something's not right, we come back and fix it free." }),
          item({ icon: "PhoneCall", title: "Easy to Reach", description: "A real person answers — no phone menus, no runaround." }),
        ],
      }),
  },

  // ─── Tell Your Story ────────────────────────────────────────────────────────
  {
    id: "steps-how-it-works",
    label: "How It Works",
    description: "Three simple steps from first call to job done",
    icon: "👣",
    category: "info",
    blockType: "steps",
    create: () =>
      preset("steps", {
        title: "How It Works",
        subtitle: "Getting help is easy",
        items: [
          item({ title: "Get in Touch", description: "Call, message, or fill in the form — tell us what you need." }),
          item({ title: "Get Your Quote", description: "We give you a clear, fixed price. No obligation, no pressure." }),
          item({ title: "Job Done", description: "We arrive on time, do the work, and clean up after ourselves." }),
        ],
      }),
  },
  {
    id: "faq-local",
    label: "Common Questions",
    description: "Answer the questions every customer asks",
    icon: "❓",
    category: "info",
    blockType: "faq",
    create: () =>
      preset("faq", {
        title: "Common Questions",
        subtitle: "Everything you might want to know before booking",
        items: [
          item({ question: "What areas do you serve?", answer: "We cover the whole local area. Not sure if that includes you? Just ask — if we can't help, we'll point you to someone who can." }),
          item({ question: "How much will it cost?", answer: "Every job gets a clear quote before we start. The price we agree is the price you pay — no surprises on the invoice." }),
          item({ question: "Do you handle emergencies?", answer: "Yes. Call us any time and we'll get someone out to you as fast as possible." }),
          item({ question: "Are you licensed and insured?", answer: "Fully. We're happy to show certificates and insurance documents on request." }),
        ],
      }),
  },
  {
    id: "about-us-text",
    label: "About Us",
    description: "A short, friendly introduction to your business",
    icon: "👋",
    category: "info",
    blockType: "text",
    create: () =>
      preset("text", {
        content:
          "<h2>About Us</h2><p>We're a local, family-run business that believes good service starts with showing up on time and treating every home like our own. What began as one van and a toolbox has grown through word of mouth — because we do the job properly, charge fairly, and stand behind our work.</p><p>When you call us, you talk to a real person who knows your area. That's how we like it, and our customers tell us they do too.</p>",
        alignment: "center",
      }),
  },
  {
    id: "team-grid",
    label: "Meet the Team",
    description: "Put friendly faces to your business name",
    icon: "👥",
    category: "info",
    blockType: "team",
    create: () =>
      preset("team", {
        title: "Meet the Team",
        subtitle: "The people who'll be looking after you",
        members: [
          item({ name: "Alex Morgan", role: "Owner & Lead Technician", bio: "Started the company 15 years ago. Still answers the phone himself." }),
          item({ name: "Jamie Lee", role: "Service Manager", bio: "Keeps every job on schedule and every customer in the loop." }),
          item({ name: "Sam Carter", role: "Technician", bio: "The one customers always ask for by name." }),
        ],
      }),
  },

  // ─── Get Customers ──────────────────────────────────────────────────────────
  {
    id: "cta-free-quote",
    label: "Free Quote Banner",
    description: "A bold colored strip asking visitors to get in touch",
    icon: "📣",
    category: "action",
    blockType: "cta",
    create: () =>
      preset(
        "cta",
        {
          title: "Ready to Get It Sorted?",
          description: "Get a free, no-obligation quote today. We'll get back to you within one business day.",
          primaryButton: { label: "Get My Free Quote", url: "#contact" },
          secondaryButton: { label: "Call Us", url: "tel:+1234567890" },
        },
        { templateVariant: "gradient-banner", background: { type: "none" } },
      ),
  },
  {
    id: "contact-form",
    label: "Contact Us + Form",
    description: "A message form with your phone and email beside it",
    icon: "✉️",
    category: "action",
    blockType: "contact",
    create: () =>
      preset("contact", {
        title: "Get in Touch",
        subtitle: "Tell us what you need — we reply within one business day",
        submitLabel: "Send My Message",
        successMessage: "Thanks! We've got your message and will be in touch shortly.",
      }),
  },
  {
    id: "newsletter-signup",
    label: "Email Signup",
    description: "Collect emails for offers and seasonal reminders",
    icon: "📬",
    category: "action",
    blockType: "newsletter",
    create: () =>
      preset("newsletter", {
        title: "Get Seasonal Tips & Offers",
        description: "One useful email a month. No spam, unsubscribe any time.",
        submitLabel: "Sign Me Up",
      }),
  },
  {
    id: "countdown-offer",
    label: "Limited-Time Offer",
    description: "A countdown clock that creates urgency for a special deal",
    icon: "⏳",
    category: "action",
    blockType: "countdown",
    create: () =>
      preset("countdown", {
        title: "Spring Special — 20% Off Ends Soon",
      }),
  },

  // ─── Photos & Video ─────────────────────────────────────────────────────────
  {
    id: "gallery-work",
    label: "Photos of Our Work",
    description: "Before-and-after shots sell better than any words",
    icon: "📸",
    category: "media",
    blockType: "gallery",
    create: () =>
      preset("gallery", {
        title: "Recent Work",
      }),
  },
  {
    id: "video-intro",
    label: "Video",
    description: "A short video introduction or customer story",
    icon: "🎬",
    category: "media",
    blockType: "video",
    create: () => preset("video", {}),
  },
  {
    id: "slideshow",
    label: "Image Slideshow",
    description: "Rotating photos at the top or middle of your page",
    icon: "🎠",
    category: "media",
    blockType: "slider",
    create: () => preset("slider", {}),
  },
];

export const presetsByCategory = (Object.keys(presetCategoryLabels) as PresetCategory[]).map(
  (cat) => ({
    category: cat,
    label: presetCategoryLabels[cat],
    presets: sectionPresets.filter((p) => p.category === cat),
  }),
);

export function getSectionPreset(id: string): SectionPreset | undefined {
  return sectionPresets.find((p) => p.id === id);
}
