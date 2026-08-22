// Minimal hand-copied subset of cms/src/modules/page-builder/block-registry.ts,
// for the mobile "Add block" picker. NOT exhaustive (~50 types exist on web) —
// deliberately limited to general-purpose block types that make sense without
// module context. Tenant-module-gated types (ecommerce_products, enm_lead_form,
// enm_booking_widget, accounting_feed, marketplace_*, donor_*, country_grid,
// eligibility_checker, booking, status_tracker) are skipped: this generic
// editor has no way to know whether a tenant even has that module enabled.
//
// `defaultData` values below are copied VERBATIM from each type's real
// create() function in block-registry.ts (the `data: {...}` object only —
// id/order/visible/width/padding/margin/background/animation come from
// baseBlock(), reproduced separately in newBlockFromCatalog() in
// app/(tenant)/sites/[tenantId]/pages/[pageId]/blocks.tsx).
//
// generateId() calls inside array items (slide ids, plan ids, etc.) are
// replaced with static placeholder ids here since this file has no access to
// the web app's lib/utils generateId — a fresh id is only needed to be
// locally unique among sibling array items, which these are.

export interface BlockCatalogEntry {
  type: string;
  label: string;
  icon: string;
  category: "layout" | "content" | "media" | "ecommerce" | "interactive";
  defaultData: Record<string, unknown>;
}

export const blockCatalog: BlockCatalogEntry[] = [
  {
    type: "hero",
    label: "Welcome Banner",
    icon: "🦸",
    category: "layout",
    defaultData: {
      layout: "centered",
      title: "Welcome to Our Website",
      subtitle: "Tagline goes here",
      description: "Add a compelling description that explains what you offer and why visitors should care.",
      primaryButton: { label: "Get Started", url: "#", variant: "primary" },
      secondaryButton: { label: "Learn More", url: "#", variant: "outline" },
      typography: { titleSize: "5xl", titleColor: "", subtitleColor: "", descColor: "" },
    },
  },
  {
    type: "text",
    label: "Text",
    icon: "📝",
    category: "content",
    defaultData: {
      content: "<h2>Section Title</h2><p>Add your content here. This block supports <strong>rich text</strong> formatting, including bold, italic, links, and more.</p>",
      alignment: "left",
      columns: 1,
      typography: { color: "#374151" },
    },
  },
  {
    type: "gallery",
    label: "Photo Gallery",
    icon: "🖼️",
    category: "media",
    defaultData: {
      title: "Gallery",
      layout: "grid",
      columns: 3,
      gap: "md",
      images: [],
      lightbox: true,
    },
  },
  {
    type: "cta",
    label: "Action Banner",
    icon: "📣",
    category: "layout",
    defaultData: {
      title: "Ready to Get Started?",
      description: "Join thousands of users who trust our platform.",
      primaryButton: { label: "Start Free Trial", url: "#" },
      secondaryButton: { label: "Learn More", url: "#" },
      layout: "centered",
    },
  },
  {
    type: "testimonials",
    label: "Customer Reviews",
    icon: "💬",
    category: "content",
    defaultData: {
      title: "What Our Clients Say",
      layout: "grid",
      items: [
        { id: "item-1", name: "Jane Doe", role: "CEO", company: "Acme Inc.", content: "This product completely transformed our workflow. Highly recommended!", rating: 5 },
        { id: "item-2", name: "John Smith", role: "Developer", company: "Tech Co.", content: "Excellent service and great customer support. Would use again.", rating: 5 },
        { id: "item-3", name: "Alice Lee", role: "Designer", company: "Creative Studio", content: "The best tool we have used. It saves us hours every week.", rating: 5 },
      ],
    },
  },
  {
    type: "divider",
    label: "Divider Line",
    icon: "➖",
    category: "layout",
    defaultData: { style: "solid", color: "#e5e7eb", thickness: 1, width: "full" },
  },
  {
    type: "spacer",
    label: "Empty Space",
    icon: "↕️",
    category: "layout",
    defaultData: { height: 80 },
  },
  {
    type: "custom_html",
    label: "Custom Code (Advanced)",
    icon: "💻",
    category: "interactive",
    defaultData: { html: "<!-- Add your custom HTML here -->" },
  },
  {
    type: "team",
    label: "Meet the Team",
    icon: "👥",
    category: "content",
    defaultData: {
      title: "Meet the Team",
      subtitle: "The people behind our work",
      layout: "grid",
      columns: 3,
      showBio: true,
      showSocial: true,
      members: [
        { id: "item-1", name: "Jane Doe", role: "CEO & Founder", bio: "Passionate leader with 10+ years of experience." },
        { id: "item-2", name: "John Smith", role: "Lead Developer", bio: "Full-stack engineer who loves clean code." },
        { id: "item-3", name: "Alice Lee", role: "Designer", bio: "Creative mind shaping beautiful experiences." },
      ],
    },
  },
  {
    type: "faq",
    label: "Questions & Answers",
    icon: "❓",
    category: "content",
    defaultData: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know",
      layout: "accordion",
      allowMultiple: false,
      items: [
        { id: "item-1", question: "What is your return policy?", answer: "We offer a 30-day money-back guarantee on all purchases." },
        { id: "item-2", question: "How long does shipping take?", answer: "Standard shipping takes 3-5 business days." },
        { id: "item-3", question: "Do you offer customer support?", answer: "Yes, we provide 24/7 support via email and live chat." },
      ],
    },
  },
  {
    type: "pricing",
    label: "Price List",
    icon: "💳",
    category: "content",
    defaultData: {
      title: "Simple, Transparent Pricing",
      subtitle: "Choose the plan that works for you",
      layout: "cards",
      billingToggle: false,
      plans: [
        { id: "item-1", name: "Starter", price: "$9", period: "mo", description: "Perfect for individuals", features: ["5 projects", "10 GB storage", "Email support"], ctaLabel: "Get Started", ctaUrl: "#" },
        { id: "item-2", name: "Pro", price: "$29", period: "mo", description: "Best for small teams", features: ["Unlimited projects", "100 GB storage", "Priority support", "Custom domain"], highlighted: true, badge: "Most Popular", ctaLabel: "Start Free Trial", ctaUrl: "#" },
        { id: "item-3", name: "Enterprise", price: "$99", period: "mo", description: "For large organizations", features: ["Everything in Pro", "Dedicated support", "SLA guarantee", "Custom integrations"], ctaLabel: "Contact Sales", ctaUrl: "#" },
      ],
    },
  },
  {
    type: "features",
    label: "Why Choose Us",
    icon: "✨",
    category: "content",
    defaultData: {
      title: "Why Choose Us",
      subtitle: "Everything you need to succeed",
      layout: "grid",
      columns: 3,
      style: "card",
      items: [
        { id: "item-1", icon: "Zap", title: "Lightning Fast", description: "Optimized for performance at every level." },
        { id: "item-2", icon: "Shield", title: "Secure by Default", description: "Enterprise-grade security built in." },
        { id: "item-3", icon: "Star", title: "5-Star Support", description: "Our team is here 24/7 to help you." },
        { id: "item-4", icon: "Globe", title: "Global CDN", description: "Served fast from servers worldwide." },
        { id: "item-5", icon: "BarChart", title: "Analytics", description: "Detailed insights into your performance." },
        { id: "item-6", icon: "Settings", title: "Fully Customizable", description: "Tweak every aspect to match your brand." },
      ],
    },
  },
  {
    type: "stats",
    label: "Big Numbers",
    icon: "📊",
    category: "content",
    defaultData: {
      title: "Our Numbers",
      layout: "row",
      columns: 4,
      style: "plain",
      animate: true,
      items: [
        { id: "item-1", value: "10000", label: "Happy Clients", suffix: "+" },
        { id: "item-2", value: "500", label: "Projects Completed", suffix: "+" },
        { id: "item-3", value: "15", label: "Years Experience", suffix: "+" },
        { id: "item-4", value: "99", label: "Satisfaction Rate", suffix: "%" },
      ],
    },
  },
  {
    type: "contact",
    label: "Contact Form",
    icon: "✉️",
    category: "interactive",
    defaultData: {
      title: "Get in Touch",
      subtitle: "We'd love to hear from you",
      layout: "split",
      showMap: false,
      showContactInfo: true,
      submitLabel: "Send Message",
      successMessage: "Thank you! We'll be in touch soon.",
      fields: [
        { id: "item-1", label: "Name", type: "text", required: true },
        { id: "item-2", label: "Email", type: "email", required: true },
        { id: "item-3", label: "Subject", type: "text", required: false },
        { id: "item-4", label: "Message", type: "textarea", required: true },
      ],
    },
  },
  {
    type: "embed",
    label: "Embed Anything",
    icon: "🔗",
    category: "media",
    defaultData: { url: "", embedType: "youtube", aspectRatio: "16:9" },
  },
  {
    type: "video",
    label: "Video",
    icon: "🎬",
    category: "media",
    defaultData: {
      url: "",
      videoType: "youtube",
      autoplay: false,
      muted: false,
      loop: false,
      controls: true,
      aspectRatio: "16:9",
    },
  },
  {
    type: "columns",
    label: "Side-by-Side Text",
    icon: "⬛",
    category: "layout",
    defaultData: {
      columns: 2,
      gap: "md",
      verticalAlign: "top",
      content: [
        "<h3>Column One</h3><p>Add your content for this column here.</p>",
        "<h3>Column Two</h3><p>Add your content for this column here.</p>",
      ],
    },
  },
  {
    type: "navigation",
    label: "Menu Bar",
    icon: "🧭",
    category: "layout",
    defaultData: {
      logoText: "Brand",
      items: [
        { id: "item-1", label: "Home", url: "/" },
        { id: "item-2", label: "About", url: "/about" },
        { id: "item-3", label: "Services", url: "/services" },
        { id: "item-4", label: "Contact", url: "/contact" },
      ],
      sticky: true,
      transparent: false,
      style: "default",
      showCta: true,
      ctaLabel: "Get in Touch",
      ctaUrl: "/contact",
    },
  },
  {
    type: "footer",
    label: "Footer",
    icon: "🦶",
    category: "layout",
    defaultData: {
      logoText: "Brand",
      tagline: "Your tagline here",
      style: "dark",
      columns: [
        {
          id: "item-1",
          heading: "Company",
          links: [
            { id: "link-1", label: "About Us", url: "/about" },
            { id: "link-2", label: "Services", url: "/services" },
            { id: "link-3", label: "Contact", url: "/contact" },
          ],
        },
        {
          id: "item-2",
          heading: "Services",
          links: [
            { id: "link-4", label: "Visa Processing", url: "/services/visa" },
            { id: "link-5", label: "Work Permits", url: "/services/work-permit" },
            { id: "link-6", label: "Tour Packages", url: "/services/tours" },
          ],
        },
      ],
      socials: [],
      copyrightYear: true,
      bottomLinks: [
        { id: "link-7", label: "Privacy Policy", url: "/privacy" },
        { id: "link-8", label: "Terms", url: "/terms" },
      ],
    },
  },
];

export function getBlockCatalogEntry(type: string): BlockCatalogEntry | undefined {
  return blockCatalog.find((b) => b.type === type);
}

export const blockCatalogByCategory = blockCatalog.reduce(
  (acc, block) => {
    if (!acc[block.category]) acc[block.category] = [];
    acc[block.category].push(block);
    return acc;
  },
  {} as Record<string, BlockCatalogEntry[]>
);
