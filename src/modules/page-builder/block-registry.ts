import type { BlockType, Block, BlockBackground } from "@/types/cms";
import { generateId } from "@/lib/utils";

export type BlockDefinition = {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  category: "layout" | "content" | "media" | "ecommerce" | "interactive";
  create: () => Block;
};

const defaultBackground: BlockBackground = { type: "none" };
const defaultPadding = { top: 64, right: 24, bottom: 64, left: 24 };
const defaultMargin = { top: 0, right: 0, bottom: 0, left: 0 };

const baseBlock = (type: BlockType) => ({
  id: generateId(),
  type,
  order: 0,
  visible: true,
  width: "full" as const,
  padding: defaultPadding,
  margin: defaultMargin,
  background: defaultBackground,
  animation: "none" as const,
});

export const blockRegistry: BlockDefinition[] = [
  {
    type: "hero",
    label: "Hero",
    description: "Full-width hero section with headline, CTA buttons, and image",
    icon: "🦸",
    category: "layout",
    create: () => ({
      ...baseBlock("hero"),
      type: "hero",
      data: {
        layout: "centered",
        title: "Welcome to Our Website",
        subtitle: "Tagline goes here",
        description: "Add a compelling description that explains what you offer and why visitors should care.",
        primaryButton: { label: "Get Started", url: "#", variant: "primary" },
        secondaryButton: { label: "Learn More", url: "#", variant: "outline" },
        typography: { titleSize: "5xl", titleColor: "#111827", subtitleColor: "#6B7280", descColor: "#6B7280" },
      },
    }),
  },
  {
    type: "slider",
    label: "Slider",
    description: "Image carousel/slider with optional text overlays",
    icon: "🎠",
    category: "media",
    create: () => ({
      ...baseBlock("slider"),
      type: "slider",
      data: {
        slides: [
          { id: generateId(), title: "Slide One", subtitle: "Your subtitle here", imageUrl: "", buttonLabel: "Learn More", buttonUrl: "#", overlay: true },
          { id: generateId(), title: "Slide Two", subtitle: "Another subtitle", imageUrl: "", buttonLabel: "Get Started", buttonUrl: "#", overlay: true },
        ],
        autoPlay: true,
        autoPlayInterval: 5000,
        showArrows: true,
        showDots: true,
        height: "600px",
      },
    }),
  },
  {
    type: "navigation",
    label: "Navigation",
    description: "Site header with logo, navigation links, and optional CTA",
    icon: "🧭",
    category: "layout",
    create: () => ({
      ...baseBlock("navigation"),
      padding: { top: 0, right: 24, bottom: 0, left: 24 },
      type: "navigation",
      data: {
        logoText: "Brand",
        items: [
          { id: generateId(), label: "Home", url: "/" },
          { id: generateId(), label: "About", url: "/about" },
          { id: generateId(), label: "Services", url: "/services" },
          { id: generateId(), label: "Contact", url: "/contact" },
        ],
        sticky: true,
        transparent: false,
        style: "default",
        showCta: true,
        ctaLabel: "Get in Touch",
        ctaUrl: "/contact",
      },
    }),
  },
  {
    type: "text",
    label: "Text / Rich Content",
    description: "Rich text editor for articles, paragraphs, and formatted content",
    icon: "📝",
    category: "content",
    create: () => ({
      ...baseBlock("text"),
      type: "text",
      data: {
        content: "<h2>Section Title</h2><p>Add your content here. This block supports <strong>rich text</strong> formatting, including bold, italic, links, and more.</p>",
        alignment: "left",
        columns: 1,
        typography: { color: "#374151" },
      },
    }),
  },
  {
    type: "services",
    label: "Services",
    description: "Showcase services or features with icon/image, title, description, and link",
    icon: "⚙️",
    category: "content",
    create: () => ({
      ...baseBlock("services"),
      type: "services",
      data: {
        title: "Our Services",
        subtitle: "What we offer",
        layout: "grid",
        columns: 3,
        cardStyle: "elevated",
        items: [
          { id: generateId(), icon: "Zap", iconType: "lucide", title: "Service One", description: "Describe this service and how it benefits your customers.", link: "#", linkLabel: "Learn More" },
          { id: generateId(), icon: "Shield", iconType: "lucide", title: "Service Two", description: "Describe this service and how it benefits your customers.", link: "#", linkLabel: "Learn More" },
          { id: generateId(), icon: "Star", iconType: "lucide", title: "Service Three", description: "Describe this service and how it benefits your customers.", link: "#", linkLabel: "Learn More" },
        ],
      },
    }),
  },
  {
    type: "blog",
    label: "Blog Posts",
    description: "Display latest blog posts in a grid or list layout",
    icon: "📰",
    category: "content",
    create: () => ({
      ...baseBlock("blog"),
      type: "blog",
      data: {
        title: "Latest Posts",
        subtitle: "Stay up to date",
        displayCount: 3,
        layout: "grid",
        columns: 3,
        showExcerpt: true,
        showDate: true,
        showAuthor: true,
        showCategory: true,
        showReadMore: true,
        viewAllUrl: "/blog",
        viewAllLabel: "View All Posts",
      },
    }),
  },
  {
    type: "gallery",
    label: "Gallery",
    description: "Image gallery with grid, masonry, or carousel layout",
    icon: "🖼️",
    category: "media",
    create: () => ({
      ...baseBlock("gallery"),
      type: "gallery",
      data: {
        title: "Gallery",
        layout: "grid",
        columns: 3,
        gap: "md",
        images: [],
        lightbox: true,
      },
    }),
  },
  {
    type: "cta",
    label: "Call to Action",
    description: "Bold section to drive conversions with headline and buttons",
    icon: "📣",
    category: "layout",
    create: () => ({
      ...baseBlock("cta"),
      background: { type: "color", color: "#1e40af" },
      type: "cta",
      data: {
        title: "Ready to Get Started?",
        description: "Join thousands of users who trust our platform.",
        primaryButton: { label: "Start Free Trial", url: "#" },
        secondaryButton: { label: "Learn More", url: "#" },
        layout: "centered",
      },
    }),
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Customer testimonials and reviews",
    icon: "💬",
    category: "content",
    create: () => ({
      ...baseBlock("testimonials"),
      type: "testimonials",
      data: {
        title: "What Our Clients Say",
        layout: "grid",
        items: [
          { id: generateId(), name: "Jane Doe", role: "CEO", company: "Acme Inc.", content: "This product completely transformed our workflow. Highly recommended!", rating: 5 },
          { id: generateId(), name: "John Smith", role: "Developer", company: "Tech Co.", content: "Excellent service and great customer support. Would use again.", rating: 5 },
          { id: generateId(), name: "Alice Lee", role: "Designer", company: "Creative Studio", content: "The best tool we have used. It saves us hours every week.", rating: 5 },
        ],
      },
    }),
  },
  {
    type: "divider",
    label: "Divider",
    description: "Visual separator between sections",
    icon: "➖",
    category: "layout",
    create: () => ({
      ...baseBlock("divider"),
      padding: { top: 16, right: 24, bottom: 16, left: 24 },
      type: "divider",
      data: { style: "solid", color: "#e5e7eb", thickness: 1, width: "full" },
    }),
  },
  {
    type: "spacer",
    label: "Spacer",
    description: "Empty space between sections",
    icon: "↕️",
    category: "layout",
    create: () => ({
      ...baseBlock("spacer"),
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      type: "spacer",
      data: { height: 80 },
    }),
  },
  {
    type: "ecommerce_products",
    label: "Products Grid",
    description: "Display products from your store",
    icon: "🛍️",
    category: "ecommerce",
    create: () => ({
      ...baseBlock("ecommerce_products"),
      type: "ecommerce_products",
      data: {
        title: "Featured Products",
        displayCount: 4,
        layout: "grid",
        columns: 4,
        sortBy: "featured",
        showAddToCart: true,
      },
    }),
  },
  {
    type: "accounting_feed",
    label: "Donation / Transaction Feed",
    description: "Live feed of public transactions (donations, etc.)",
    icon: "💰",
    category: "interactive",
    create: () => ({
      ...baseBlock("accounting_feed"),
      type: "accounting_feed",
      data: {
        title: "Recent Donations",
        displayCount: 10,
        transactionType: "donation",
        showAmount: true,
        showDate: true,
        showMessage: true,
        layout: "list",
      },
    }),
  },
  {
    type: "ecommerce_cart",
    label: "Shopping Cart",
    description: "Display the shopping cart with checkout button",
    icon: "🛒",
    category: "ecommerce",
    create: () => ({
      ...baseBlock("ecommerce_cart"),
      type: "ecommerce_cart",
      data: { showOrderSummary: true, showCouponField: true, layout: "default" },
    }),
  },
  {
    type: "custom_html",
    label: "Custom HTML",
    description: "Embed custom HTML, CSS, and JavaScript",
    icon: "💻",
    category: "interactive",
    create: () => ({
      ...baseBlock("custom_html"),
      type: "custom_html",
      data: { html: "<!-- Add your custom HTML here -->" },
    }),
  },
  {
    type: "team",
    label: "Team",
    description: "Showcase team members with photos, roles, and bio",
    icon: "👥",
    category: "content",
    create: () => ({
      ...baseBlock("team"),
      type: "team",
      data: {
        title: "Meet the Team",
        subtitle: "The people behind our work",
        layout: "grid",
        columns: 3,
        showBio: true,
        showSocial: true,
        members: [
          { id: generateId(), name: "Jane Doe", role: "CEO & Founder", bio: "Passionate leader with 10+ years of experience." },
          { id: generateId(), name: "John Smith", role: "Lead Developer", bio: "Full-stack engineer who loves clean code." },
          { id: generateId(), name: "Alice Lee", role: "Designer", bio: "Creative mind shaping beautiful experiences." },
        ],
      },
    }),
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Frequently asked questions with accordion or grid layout",
    icon: "❓",
    category: "content",
    create: () => ({
      ...baseBlock("faq"),
      type: "faq",
      data: {
        title: "Frequently Asked Questions",
        subtitle: "Everything you need to know",
        layout: "accordion",
        allowMultiple: false,
        items: [
          { id: generateId(), question: "What is your return policy?", answer: "We offer a 30-day money-back guarantee on all purchases." },
          { id: generateId(), question: "How long does shipping take?", answer: "Standard shipping takes 3-5 business days." },
          { id: generateId(), question: "Do you offer customer support?", answer: "Yes, we provide 24/7 support via email and live chat." },
        ],
      },
    }),
  },
  {
    type: "pricing",
    label: "Pricing",
    description: "Pricing plans and comparison table",
    icon: "💳",
    category: "content",
    create: () => ({
      ...baseBlock("pricing"),
      type: "pricing",
      data: {
        title: "Simple, Transparent Pricing",
        subtitle: "Choose the plan that works for you",
        layout: "cards",
        billingToggle: false,
        plans: [
          { id: generateId(), name: "Starter", price: "$9", period: "mo", description: "Perfect for individuals", features: ["5 projects", "10 GB storage", "Email support"], ctaLabel: "Get Started", ctaUrl: "#" },
          { id: generateId(), name: "Pro", price: "$29", period: "mo", description: "Best for small teams", features: ["Unlimited projects", "100 GB storage", "Priority support", "Custom domain"], highlighted: true, badge: "Most Popular", ctaLabel: "Start Free Trial", ctaUrl: "#" },
          { id: generateId(), name: "Enterprise", price: "$99", period: "mo", description: "For large organizations", features: ["Everything in Pro", "Dedicated support", "SLA guarantee", "Custom integrations"], ctaLabel: "Contact Sales", ctaUrl: "#" },
        ],
      },
    }),
  },
  {
    type: "features",
    label: "Features",
    description: "Feature grid, icon list, or alternating image+text layout",
    icon: "✨",
    category: "content",
    create: () => ({
      ...baseBlock("features"),
      type: "features",
      data: {
        title: "Why Choose Us",
        subtitle: "Everything you need to succeed",
        layout: "grid",
        columns: 3,
        style: "card",
        items: [
          { id: generateId(), icon: "Zap", title: "Lightning Fast", description: "Optimized for performance at every level." },
          { id: generateId(), icon: "Shield", title: "Secure by Default", description: "Enterprise-grade security built in." },
          { id: generateId(), icon: "Star", title: "5-Star Support", description: "Our team is here 24/7 to help you." },
          { id: generateId(), icon: "Globe", title: "Global CDN", description: "Served fast from servers worldwide." },
          { id: generateId(), icon: "BarChart", title: "Analytics", description: "Detailed insights into your performance." },
          { id: generateId(), icon: "Settings", title: "Fully Customizable", description: "Tweak every aspect to match your brand." },
        ],
      },
    }),
  },
  {
    type: "stats",
    label: "Stats / Counters",
    description: "Highlight key numbers and metrics with animated counters",
    icon: "📊",
    category: "content",
    create: () => ({
      ...baseBlock("stats"),
      type: "stats",
      data: {
        title: "Our Numbers",
        layout: "row",
        columns: 4,
        style: "plain",
        animate: true,
        items: [
          { id: generateId(), value: "10000", label: "Happy Clients", suffix: "+" },
          { id: generateId(), value: "500", label: "Projects Completed", suffix: "+" },
          { id: generateId(), value: "15", label: "Years Experience", suffix: "+" },
          { id: generateId(), value: "99", label: "Satisfaction Rate", suffix: "%" },
        ],
      },
    }),
  },
  {
    type: "contact",
    label: "Contact Form",
    description: "Contact form with optional map, email, and phone info",
    icon: "✉️",
    category: "interactive",
    create: () => ({
      ...baseBlock("contact"),
      type: "contact",
      data: {
        title: "Get in Touch",
        subtitle: "We'd love to hear from you",
        layout: "split",
        showMap: false,
        showContactInfo: true,
        submitLabel: "Send Message",
        successMessage: "Thank you! We'll be in touch soon.",
        fields: [
          { id: generateId(), label: "Name", type: "text", required: true },
          { id: generateId(), label: "Email", type: "email", required: true },
          { id: generateId(), label: "Subject", type: "text", required: false },
          { id: generateId(), label: "Message", type: "textarea", required: true },
        ],
      },
    }),
  },
  {
    type: "embed",
    label: "Embed",
    description: "Embed YouTube, Vimeo, Spotify, or any iframe content",
    icon: "🔗",
    category: "media",
    create: () => ({
      ...baseBlock("embed"),
      type: "embed",
      data: { url: "", embedType: "youtube", aspectRatio: "16:9" },
    }),
  },
  {
    type: "video",
    label: "Video",
    description: "YouTube, Vimeo, or self-hosted MP4 video player",
    icon: "🎬",
    category: "media",
    create: () => ({
      ...baseBlock("video"),
      type: "video",
      data: {
        url: "",
        videoType: "youtube",
        autoplay: false,
        muted: false,
        loop: false,
        controls: true,
        aspectRatio: "16:9",
      },
    }),
  },
  {
    type: "timeline",
    label: "Timeline",
    description: "Vertical, horizontal, or alternating event timeline",
    icon: "📅",
    category: "content",
    create: () => ({
      ...baseBlock("timeline"),
      type: "timeline",
      data: {
        title: "Our Journey",
        layout: "vertical",
        style: "card",
        items: [
          { id: generateId(), date: "2020", title: "Founded", description: "Started our journey with a small team and big dreams." },
          { id: generateId(), date: "2021", title: "First Product", description: "Launched our first product to market." },
          { id: generateId(), date: "2023", title: "1,000 Customers", description: "Reached a major milestone." },
          { id: generateId(), date: "2024", title: "Global Expansion", description: "Expanded to 50+ countries worldwide." },
        ],
      },
    }),
  },
  {
    type: "columns",
    label: "Columns",
    description: "Multi-column layout for side-by-side rich text content",
    icon: "⬛",
    category: "layout",
    create: () => ({
      ...baseBlock("columns"),
      type: "columns",
      data: {
        columns: 2,
        gap: "md",
        verticalAlign: "top",
        content: [
          "<h3>Column One</h3><p>Add your content for this column here.</p>",
          "<h3>Column Two</h3><p>Add your content for this column here.</p>",
        ],
      },
    }),
  },
  {
    type: "newsletter",
    label: "Newsletter",
    description: "Email signup / newsletter subscription form",
    icon: "📬",
    category: "interactive",
    create: () => ({
      ...baseBlock("newsletter"),
      type: "newsletter",
      data: {
        title: "Stay in the Loop",
        description: "Get the latest updates delivered to your inbox.",
        placeholder: "Enter your email address…",
        submitLabel: "Subscribe",
        successMessage: "You're subscribed! Check your inbox.",
        layout: "inline",
      },
    }),
  },
  {
    type: "countdown",
    label: "Countdown",
    description: "Countdown timer to a specific date/time",
    icon: "⏳",
    category: "interactive",
    create: () => ({
      ...baseBlock("countdown"),
      type: "countdown",
      data: {
        title: "Coming Soon",
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        layout: "boxes",
        showSeconds: true,
        labels: { days: "Days", hours: "Hours", minutes: "Minutes", seconds: "Seconds" },
      },
    }),
  },
  {
    type: "steps",
    label: "Steps / Process",
    description: "Step-by-step process or how-it-works section",
    icon: "🚶",
    category: "content",
    create: () => ({
      ...baseBlock("steps"),
      type: "steps",
      data: {
        title: "How It Works",
        subtitle: "Get started in 3 easy steps",
        layout: "horizontal",
        style: "connected",
        items: [
          { id: generateId(), title: "Sign Up", description: "Create your free account in minutes." },
          { id: generateId(), title: "Set Up", description: "Configure your workspace and preferences." },
          { id: generateId(), title: "Launch", description: "Go live and start growing your business." },
        ],
      },
    }),
  },
  {
    type: "icon_grid",
    label: "Icon Grid",
    description: "Grid of icons with labels — great for tech stacks, partners, categories",
    icon: "🔲",
    category: "content",
    create: () => ({
      ...baseBlock("icon_grid"),
      type: "icon_grid",
      data: {
        title: "Technologies We Use",
        columns: 4,
        style: "plain",
        iconSize: "md",
        items: [
          { id: generateId(), icon: "Globe", label: "Web" },
          { id: generateId(), icon: "Smartphone", label: "Mobile" },
          { id: generateId(), icon: "Database", label: "Database" },
          { id: generateId(), icon: "Cloud", label: "Cloud" },
          { id: generateId(), icon: "Shield", label: "Security" },
          { id: generateId(), icon: "Zap", label: "Performance" },
          { id: generateId(), icon: "BarChart", label: "Analytics" },
          { id: generateId(), icon: "Settings", label: "Automation" },
        ],
      },
    }),
  },
];

export const blocksByCategory = blockRegistry.reduce(
  (acc, block) => {
    if (!acc[block.category]) acc[block.category] = [];
    acc[block.category].push(block);
    return acc;
  },
  {} as Record<string, BlockDefinition[]>,
);

export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return blockRegistry.find((b) => b.type === type);
}

export function createBlock(type: BlockType): Block | undefined {
  return getBlockDefinition(type)?.create();
}
