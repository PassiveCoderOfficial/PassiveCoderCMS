export type BuiltInPlugin = {
  slug: string;
  name: string;
  description: string;
  author: string;
  version: string;
  icon: string;
};

export const BUILT_IN_PLUGINS: BuiltInPlugin[] = [
  {
    slug: "seo-toolkit",
    name: "SEO Toolkit",
    description: "Advanced SEO meta tags, Open Graph, sitemap generation, and structured data for all pages",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "🔍",
  },
  {
    slug: "analytics",
    name: "Analytics",
    description: "Built-in page analytics, visitor tracking, and heatmaps without third-party services",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "📊",
  },
  {
    slug: "contact-forms",
    name: "Contact Forms",
    description: "Drag-and-drop form builder with email notifications, spam protection, and submission storage",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "📬",
  },
  {
    slug: "social-share",
    name: "Social Share",
    description: "Add social sharing buttons (Facebook, Twitter, LinkedIn, WhatsApp) to any page or post",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "🔗",
  },
  {
    slug: "testimonials-pro",
    name: "Testimonials Pro",
    description: "Advanced testimonials with import from Google Reviews, Yelp, and Trustpilot",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "⭐",
  },
  {
    slug: "newsletter",
    name: "Newsletter",
    description: "Email subscription forms and newsletter management. Integrates with Mailchimp, ConvertKit, and more",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "📧",
  },
  {
    slug: "portfolio",
    name: "Portfolio Pro",
    description: "Advanced portfolio with project filtering, case studies, and before/after sliders",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "🎨",
  },
  {
    slug: "booking",
    name: "Appointment Booking",
    description: "Calendar-based appointment booking with payment integration and email reminders",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "📅",
  },
  {
    slug: "live-chat",
    name: "Live Chat",
    description: "Real-time chat widget powered by Supabase Realtime — no third-party services needed",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "💬",
  },
  {
    slug: "cdn-optimizer",
    name: "CDN & Image Optimizer",
    description: "Automatic image compression, WebP conversion, and CDN integration for faster loading",
    author: "Passive Coder",
    version: "1.0.0",
    icon: "⚡",
  },
];
