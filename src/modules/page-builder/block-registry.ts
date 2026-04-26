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
