// ─── Core CMS Types ────────────────────────────────────────────────────────

export type SiteSettings = {
  id: string;
  site_name: string;
  site_description: string;
  site_url: string;
  logo_url: string | null;
  favicon_url: string | null;
  timezone: string;
  language: string;
  maintenance_mode: boolean;
  meta_title: string | null;
  meta_description: string | null;
  analytics_code: string | null;
  custom_css: string | null;
  custom_js: string | null;
  site_theme: "light" | "dark" | "system" | null;
  created_at: string;
  updated_at: string;
};

// ─── Page Builder Types ────────────────────────────────────────────────────

export type BlockType =
  | "hero"
  | "slider"
  | "navigation"
  | "text"
  | "services"
  | "blog"
  | "gallery"
  | "contact"
  | "cta"
  | "testimonials"
  | "team"
  | "faq"
  | "pricing"
  | "features"
  | "stats"
  | "divider"
  | "spacer"
  | "embed"
  | "ecommerce_products"
  | "ecommerce_cart"
  | "accounting_feed"
  | "custom_html"
  | "timeline"
  | "columns"
  | "newsletter"
  | "countdown"
  | "steps"
  | "icon_grid"
  | "video"
  | "enm_lead_form"
  | "enm_booking_widget"
  | "footer";

export type BlockAlignment = "left" | "center" | "right";
export type BlockWidth = "full" | "wide" | "normal" | "narrow";

export type BlockBase = {
  id: string;
  type: BlockType;
  order: number;
  visible: boolean;
  // Layout
  width: BlockWidth;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  // Styling
  background: BlockBackground;
  className?: string;
  animation?: "none" | "fade" | "slide-up" | "slide-left" | "zoom";
  // Template identity — controls which visual variant renders
  templateVariant?: string;
};

export type BlockBackground = {
  type: "none" | "color" | "gradient" | "image";
  color?: string;
  gradient?: string;
  imageUrl?: string;
  imageOverlay?: string;
  imageOverlayOpacity?: number;
};

// ─── Block Prop Types ─────────────────────────────────────────────────────

export type HeroBlockProps = BlockBase & {
  type: "hero";
  data: {
    layout: "centered" | "left" | "right" | "split";
    badge?: string;
    title: string;
    subtitle?: string;
    description?: string;
    primaryButton?: { label: string; url: string; variant: "primary" | "secondary" | "outline" };
    secondaryButton?: { label: string; url: string; variant: "primary" | "secondary" | "outline" };
    imageUrl?: string;
    imageAlt?: string;
    videoUrl?: string;
    overlayOpacity?: number;
    accentColor?: string;
    typography: { titleSize: string; titleColor: string; subtitleColor: string; descColor: string };
  };
};

export type SliderBlockProps = BlockBase & {
  type: "slider";
  data: {
    slides: Array<{
      id: string;
      title: string;
      subtitle?: string;
      description?: string;
      imageUrl?: string;
      buttonLabel?: string;
      buttonUrl?: string;
      textColor?: string;
      overlay?: boolean;
    }>;
    autoPlay: boolean;
    autoPlayInterval: number;
    showArrows: boolean;
    showDots: boolean;
    height: string;
  };
};

export type NavigationBlockProps = BlockBase & {
  type: "navigation";
  data: {
    logo?: string;
    logoText?: string;
    logoUrl?: string;
    items: NavItem[];
    sticky: boolean;
    transparent: boolean;
    style: "default" | "centered" | "split" | "minimal";
    backgroundColor?: string;
    textColor?: string;
    showCta?: boolean;
    ctaLabel?: string;
    ctaUrl?: string;
  };
};

export type NavItem = {
  id: string;
  label: string;
  url: string;
  target?: "_blank" | "_self";
  children?: NavItem[];
};

export type TextBlockProps = BlockBase & {
  type: "text";
  data: {
    content: string; // rich text HTML
    alignment: BlockAlignment;
    columns: 1 | 2 | 3;
    typography: {
      fontSize?: string;
      fontFamily?: string;
      color?: string;
      lineHeight?: string;
    };
  };
};

export type ServiceItem = {
  id: string;
  icon?: string;
  iconType?: "lucide" | "image" | "emoji";
  imageUrl?: string;
  title: string;
  description: string;
  link?: string;
  linkLabel?: string;
};

export type ServicesBlockProps = BlockBase & {
  type: "services";
  data: {
    title?: string;
    subtitle?: string;
    layout: "grid" | "list" | "cards" | "icon-list";
    columns: 2 | 3 | 4;
    items: ServiceItem[];
    cardStyle: "flat" | "elevated" | "bordered" | "gradient";
    source?: "inline" | "group";
    source_group_id?: string;
  };
};

export type BlogBlockProps = BlockBase & {
  type: "blog";
  data: {
    title?: string;
    subtitle?: string;
    displayCount: number;
    layout: "grid" | "list" | "featured" | "masonry";
    columns: 2 | 3 | 4;
    showExcerpt: boolean;
    showDate: boolean;
    showAuthor: boolean;
    showCategory: boolean;
    showReadMore: boolean;
    categoryFilter?: string;
    viewAllUrl?: string;
    viewAllLabel?: string;
  };
};

export type GalleryBlockProps = BlockBase & {
  type: "gallery";
  data: {
    title?: string;
    layout: "grid" | "masonry" | "carousel" | "justified";
    columns: 2 | 3 | 4 | 5 | 6;
    gap: "none" | "sm" | "md" | "lg";
    images: Array<{ id: string; url: string; alt?: string; caption?: string }>;
    lightbox: boolean;
  };
};

export type CTABlockProps = BlockBase & {
  type: "cta";
  data: {
    title: string;
    description?: string;
    primaryButton?: { label: string; url: string };
    secondaryButton?: { label: string; url: string };
    layout: "centered" | "left" | "split";
  };
};

export type TestimonialsBlockProps = BlockBase & {
  type: "testimonials";
  data: {
    title?: string;
    layout: "grid" | "carousel" | "masonry";
    items: Array<{
      id: string;
      name: string;
      role?: string;
      company?: string;
      avatar?: string;
      content: string;
      rating?: number;
    }>;
  };
};

export type EcommerceProductsBlockProps = BlockBase & {
  type: "ecommerce_products";
  data: {
    title?: string;
    displayCount: number;
    layout: "grid" | "list";
    columns: 2 | 3 | 4;
    categoryId?: string;
    sortBy: "latest" | "price_asc" | "price_desc" | "featured";
    showAddToCart: boolean;
  };
};

export type AccountingFeedBlockProps = BlockBase & {
  type: "accounting_feed";
  data: {
    title?: string;
    displayCount: number;
    transactionType?: "all" | "donation" | "sale" | "expense";
    showAmount: boolean;
    showDate: boolean;
    showMessage: boolean;
    layout: "list" | "ticker" | "cards";
  };
};

export type DividerBlockProps = BlockBase & {
  type: "divider";
  data: {
    style: "solid" | "dashed" | "dotted" | "wave" | "zigzag";
    color: string;
    thickness: number;
    width: "full" | "wide" | "normal";
  };
};

export type SpacerBlockProps = BlockBase & {
  type: "spacer";
  data: {
    height: number;
  };
};

export type CustomHtmlBlockProps = BlockBase & {
  type: "custom_html";
  data: {
    html: string;
    css?: string;
  };
};

export type TeamMember = {
  id: string;
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  email?: string;
  social?: { platform: string; url: string }[];
};

export type TeamBlockProps = BlockBase & {
  type: "team";
  data: {
    title?: string;
    subtitle?: string;
    layout: "grid" | "list" | "cards";
    columns: 2 | 3 | 4;
    members: TeamMember[];
    showBio: boolean;
    showSocial: boolean;
  };
};

export type FAQItem = { id: string; question: string; answer: string };

export type FAQBlockProps = BlockBase & {
  type: "faq";
  data: {
    title?: string;
    subtitle?: string;
    layout: "accordion" | "grid" | "simple";
    items: FAQItem[];
    allowMultiple: boolean;
  };
};

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  priceUsdCents?: number;
  period?: string;
  description?: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

export type PricingBlockProps = BlockBase & {
  type: "pricing";
  data: {
    title?: string;
    subtitle?: string;
    layout: "cards" | "comparison";
    billingToggle: boolean;
    showCurrencyToggle?: boolean;
    plans: PricingPlan[];
  };
};

export type FeatureItem = {
  id: string;
  icon?: string;
  title: string;
  description: string;
  imageUrl?: string;
};

export type FeaturesBlockProps = BlockBase & {
  type: "features";
  data: {
    title?: string;
    subtitle?: string;
    layout: "grid" | "alternating" | "icon-list" | "centered";
    columns: 2 | 3 | 4;
    items: FeatureItem[];
    style: "minimal" | "card" | "gradient";
  };
};

export type StatItem = { id: string; value: string; label: string; prefix?: string; suffix?: string; icon?: string };

export type StatsBlockProps = BlockBase & {
  type: "stats";
  data: {
    title?: string;
    subtitle?: string;
    layout: "row" | "grid";
    columns: 2 | 3 | 4;
    items: StatItem[];
    style: "plain" | "cards" | "colored";
    animate: boolean;
  };
};

export type ContactBlockProps = BlockBase & {
  type: "contact";
  data: {
    title?: string;
    subtitle?: string;
    layout: "left" | "centered" | "split";
    showMap: boolean;
    mapEmbedUrl?: string;
    fields: Array<{ id: string; label: string; type: "text" | "email" | "tel" | "textarea" | "select"; required: boolean; options?: string[] }>;
    submitLabel: string;
    successMessage: string;
    recipientEmail?: string;
    showContactInfo: boolean;
    phone?: string;
    email?: string;
    address?: string;
  };
};

export type EmbedBlockProps = BlockBase & {
  type: "embed";
  data: {
    url: string;
    embedType: "youtube" | "vimeo" | "iframe" | "spotify" | "twitter" | "instagram";
    aspectRatio: "16:9" | "4:3" | "1:1" | "9:16";
    autoplay?: boolean;
    caption?: string;
  };
};

export type EcommerceCartBlockProps = BlockBase & {
  type: "ecommerce_cart";
  data: {
    title?: string;
    showOrderSummary: boolean;
    showCouponField: boolean;
    layout: "default" | "minimal";
  };
};

export type TimelineItem = { id: string; date?: string; title: string; description?: string; icon?: string; imageUrl?: string };

export type TimelineBlockProps = BlockBase & {
  type: "timeline";
  data: {
    title?: string;
    subtitle?: string;
    layout: "vertical" | "horizontal" | "alternating";
    items: TimelineItem[];
    style: "simple" | "card" | "colored";
  };
};

export type ColumnsBlockProps = BlockBase & {
  type: "columns";
  data: {
    columns: 2 | 3 | 4;
    gap: "sm" | "md" | "lg";
    content: string[];
    verticalAlign: "top" | "middle" | "bottom";
  };
};

export type NewsletterBlockProps = BlockBase & {
  type: "newsletter";
  data: {
    title?: string;
    description?: string;
    placeholder: string;
    submitLabel: string;
    layout: "inline" | "stacked" | "card";
    successMessage: string;
    provider?: "mailchimp" | "custom";
    webhookUrl?: string;
  };
};

export type CountdownBlockProps = BlockBase & {
  type: "countdown";
  data: {
    title?: string;
    targetDate: string;
    layout: "boxes" | "minimal" | "flip";
    labels: { days: string; hours: string; minutes: string; seconds: string };
    expiredMessage?: string;
    showSeconds: boolean;
  };
};

export type StepItem = { id: string; number?: string; title: string; description?: string; icon?: string; imageUrl?: string };

export type StepsBlockProps = BlockBase & {
  type: "steps";
  data: {
    title?: string;
    subtitle?: string;
    layout: "horizontal" | "vertical" | "numbered";
    items: StepItem[];
    style: "plain" | "connected" | "card";
  };
};

export type IconGridItem = { id: string; icon: string; label: string; description?: string; url?: string; color?: string };

export type IconGridBlockProps = BlockBase & {
  type: "icon_grid";
  data: {
    title?: string;
    subtitle?: string;
    columns: 3 | 4 | 5 | 6;
    items: IconGridItem[];
    style: "plain" | "card" | "colored";
    iconSize: "sm" | "md" | "lg";
  };
};

export type VideoBlockProps = BlockBase & {
  type: "video";
  data: {
    url: string;
    videoType: "youtube" | "vimeo" | "mp4";
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
    controls: boolean;
    aspectRatio: "16:9" | "4:3" | "1:1";
    poster?: string;
    caption?: string;
    maxWidth?: string;
  };
};

export type EnmLeadFormBlockProps = BlockBase & {
  type: "enm_lead_form";
  data: {
    apiKey: string;
    formTitle: string;
    buttonLabel: string;
    thankYouMessage: string;
    showPhone: boolean;
    showMessage: boolean;
  };
};

export type EnmBookingWidgetBlockProps = BlockBase & {
  type: "enm_booking_widget";
  data: {
    expertSlug: string;
    label?: string;
    height: number;
    maxWidth: number;
    borderRadius: number;
  };
};

export type FooterColumnLink = {
  id: string;
  label: string;
  url: string;
};

export type FooterColumn = {
  id: string;
  heading: string;
  links: FooterColumnLink[];
};

export type FooterSocial = {
  platform: "facebook" | "instagram" | "twitter" | "linkedin" | "youtube" | "tiktok" | "whatsapp";
  url: string;
};

export type FooterBlockProps = BlockBase & {
  type: "footer";
  data: {
    logo?: string;
    logoText?: string;
    tagline?: string;
    columns: FooterColumn[];
    socials?: FooterSocial[];
    copyrightText?: string;
    copyrightYear?: boolean;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    showNewsletter?: boolean;
    newsletterLabel?: string;
    newsletterPlaceholder?: string;
    bottomLinks?: FooterColumnLink[];
    style?: "dark" | "light" | "colored";
  };
};

export type Block =
  | HeroBlockProps
  | SliderBlockProps
  | NavigationBlockProps
  | TextBlockProps
  | ServicesBlockProps
  | BlogBlockProps
  | GalleryBlockProps
  | CTABlockProps
  | TestimonialsBlockProps
  | EcommerceProductsBlockProps
  | AccountingFeedBlockProps
  | DividerBlockProps
  | SpacerBlockProps
  | CustomHtmlBlockProps
  | TeamBlockProps
  | FAQBlockProps
  | PricingBlockProps
  | FeaturesBlockProps
  | StatsBlockProps
  | ContactBlockProps
  | EmbedBlockProps
  | EcommerceCartBlockProps
  | TimelineBlockProps
  | ColumnsBlockProps
  | NewsletterBlockProps
  | CountdownBlockProps
  | StepsBlockProps
  | IconGridBlockProps
  | VideoBlockProps
  | EnmLeadFormBlockProps
  | EnmBookingWidgetBlockProps
  | FooterBlockProps;

// ─── Page Types ───────────────────────────────────────────────────────────

export type PageStatus = "draft" | "published" | "scheduled" | "archived";
export type PageType = "page" | "post" | "landing" | "portfolio";

export type Page = {
  id: string;
  title: string;
  slug: string;
  type: PageType;
  status: PageStatus;
  blocks: Block[];
  template_id?: string;
  parent_id?: string;
  featured_image?: string;
  excerpt?: string;
  seo: PageSEO;
  settings: PageSettings;
  published_at?: string;
  scheduled_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type PageSEO = {
  title?: string;
  description?: string;
  keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  no_index?: boolean;
  canonical?: string;
};

export type PageSettings = {
  show_header: boolean;
  show_footer: boolean;
  custom_css?: string;
  custom_js?: string;
  password_protected?: boolean;
  password?: string;
};

// ─── Media Types ──────────────────────────────────────────────────────────

export type MediaFile = {
  id: string;
  name: string;
  original_name: string;
  url: string;
  thumbnail_url?: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  folder?: string;
  uploaded_by: string;
  created_at: string;
};

// ─── Theme / Template Types ───────────────────────────────────────────────

export type Theme = {
  id: string;
  name: string;
  slug: string;
  description: string;
  author: string;
  version: string;
  preview_url?: string;
  thumbnail?: string;
  is_active: boolean;
  settings: ThemeSettings;
  created_at: string;
};

export type ThemeSettings = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
  containerWidth: string;
  customCss?: string;
};

// ─── Plugin Types ─────────────────────────────────────────────────────────

export type Plugin = {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  author: string;
  is_active: boolean;
  settings?: Record<string, unknown>;
  created_at: string;
};

export type PluginDefinition = {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  blocks?: BlockType[];
  adminPages?: Array<{ path: string; label: string; icon?: string }>;
  hooks?: string[];
  settings?: Array<{
    key: string;
    label: string;
    type: "text" | "number" | "boolean" | "select";
    options?: string[];
    default?: unknown;
  }>;
};

// ─── Ecommerce Types ──────────────────────────────────────────────────────

export type ProductStatus = "active" | "draft" | "archived";
export type ProductType = "simple" | "variable" | "digital";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  type: ProductType;
  status: ProductStatus;
  price: number;
  compare_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  weight?: number;
  images: string[];
  category_ids: string[];
  tag_ids: string[];
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  seo: PageSEO;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  price: number;
  compare_price?: number;
  stock_quantity: number;
  attributes: Record<string, string>;
  image?: string;
};

export type ProductAttribute = {
  id: string;
  name: string;
  values: string[];
};

export type CartItem = {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug: string;
};

export type Cart = {
  items: CartItem[];
  coupon?: string;
  discount?: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

export type OrderStatus =
  | "pending"
  | "processing"
  | "on_hold"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

export type Order = {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_email: string;
  customer_name: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  items: CartItem[];
  billing_address: Address;
  shipping_address?: Address;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  total: number;
  notes?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
};

export type Address = {
  first_name: string;
  last_name: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  phone?: string;
};

export type PaymentGateway = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_enabled: boolean;
  is_test_mode: boolean;
  settings: Record<string, string>;
  icon?: string;
  supported_currencies: string[];
};

// ─── Accounting Types ─────────────────────────────────────────────────────

export type TransactionType = "income" | "expense" | "transfer" | "donation" | "refund";
export type TransactionStatus = "pending" | "completed" | "cancelled" | "reconciled";

export type Transaction = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  category?: string;
  account_id?: string;
  order_id?: string;
  customer_name?: string;
  customer_email?: string;
  message?: string; // for donation messages
  is_public: boolean; // show on frontend feed
  date: string;
  created_at: string;
};

export type Account = {
  id: string;
  name: string;
  type: "cash" | "bank" | "credit" | "investment";
  currency: string;
  balance: number;
  is_default: boolean;
};

// ─── User / Auth Types ────────────────────────────────────────────────────

export type UserRole = "admin" | "editor" | "author" | "contributor" | "subscriber" | "customer";

export type CMSUser = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

// ─── Builder Store Types ──────────────────────────────────────────────────

export type BuilderMode = "edit" | "preview" | "responsive";
export type Breakpoint = "desktop" | "tablet" | "mobile";

export type BuilderState = {
  pageId?: string;
  blocks: Block[];
  selectedBlockId?: string;
  hoveredBlockId?: string;
  isDragging: boolean;
  mode: BuilderMode;
  breakpoint: Breakpoint;
  history: Block[][];
  historyIndex: number;
  isDirty: boolean;
};
