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
  | "footer"
  | "country_grid"
  | "eligibility_checker"
  | "status_tracker"
  | "booking"
  | "marketplace_booking"
  | "marketplace_request"
  | "marketplace_vendor_directory"
  | "re_search"
  | "re_listings"
  | "re_communities"
  | "re_developers"
  | "re_calculator"
  | "re_lead_form"
  | "donor_group_cards"
  | "donor_list"
  | "donor_map"
  | "donor_requests"
  | "container"
  | "item_box"
  | "scroll_story"
  | "marquee"
  | "option_preview"
  // Header-only sub-blocks (2026-09-06): a header composes these as
  // independent, separately draggable blocks rather than one big Header
  // block with many settings sections — see project_block_editor_bugs memory
  // for the decision. "header_cta" (not "cta") because the existing "cta"
  // type is a full-width announcement banner already offered in headers;
  // this is a single button, closer to hero's primaryButton shape.
  | "header_logo"
  | "header_nav"
  | "header_cta"
  | "header_booking"
  | "header_cart"
  | "header_account";

export type BlockAlignment = "left" | "center" | "right";
export type BlockWidth = "full" | "wide" | "normal" | "narrow";

export type BlockBase = {
  id: string;
  type: BlockType;
  order: number;
  visible: boolean;
  /** Per-device hiding — CSS-driven (live site has no server-side viewport
   *  info), unlike `visible` which is a true hide on every device. */
  hideOn?: ("desktop" | "tablet" | "mobile")[];
  /** Optional section anchor: rendered as the wrapper's id so links like
   *  /services#plumbing jump here. Letters, digits and dashes only. */
  anchor?: string;
  // Layout
  width: BlockWidth;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  // Styling
  background: BlockBackground;
  className?: string;
  animation?: "none" | "fade" | "slide-up" | "slide-left" | "zoom";
  /** Shared section styling every block type gets from the Style panel. */
  style?: BlockStyle;
  /** Order / visibility of the block's own pieces (badge, title, buttons…),
   *  edited in the Style panel. Keys per type: modules/page-builder/block-elements.ts. */
  elements?: BlockElements;
  // Template identity — controls which visual variant renders
  templateVariant?: string;
};

export type BlockElements = {
  /** Piece keys in display order; pieces missing from it keep their default spot after the listed ones. */
  order?: string[];
  hidden?: string[];
};

export type BlockStyle = {
  /** Text colour for everything in the section (hex). Also re-points the
   *  --foreground token so theme-coloured text inside follows it. */
  textColor?: string;
  borderWidth?: number;
  borderColor?: string;
  /** Corner radius of the section box, px. */
  radius?: number;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  /** Minimum section height in vh (0-100). */
  minHeight?: number;
  /** Where content sits when minHeight makes the section taller than it. */
  verticalAlign?: "top" | "center" | "bottom";
  /** Vertical padding overrides for smaller screens (px). Unset = desktop value. */
  paddingTablet?: { top?: number; bottom?: number };
  paddingMobile?: { top?: number; bottom?: number };
  /** Typography & alignment, applied to whatever the block renders (see
   *  .pc-ty rules in globals.css), so every block type gets them for free. */
  /** Section heading + intro alignment. */
  align?: "left" | "center" | "right";
  /** Text alignment inside each card/item (anything holding an h3/h4). */
  cardAlign?: "left" | "center" | "right";
  /** Google font for headings in this section (FONT_OPTIONS name). */
  headingFont?: string;
  /** px sizes; unset = the block's own size. */
  headingSize?: number;
  cardTitleSize?: number;
  textSize?: number;
  cardTitleCase?: "none" | "uppercase" | "capitalize";
};

export type BlockBackground = {
  type: "none" | "color" | "gradient" | "image";
  color?: string;
  gradient?: string;
  imageUrl?: string;
  imageOverlay?: string;
  imageOverlayTo?: string;
  imageOverlayOpacity?: number;
};

// ─── Block Prop Types ─────────────────────────────────────────────────────

export type HeroBlockProps = BlockBase & {
  type: "hero";
  data: {
    layout: "centered" | "left" | "right" | "split";
    badge?: string;
    badgeBgColor?: string;
    badgeTextColor?: string;
    title: string;
    subtitle?: string;
    description?: string;
    primaryButton?: { label: string; url: string; variant: "primary" | "secondary" | "outline"; bgColor?: string; textColor?: string };
    secondaryButton?: { label: string; url: string; variant: "primary" | "secondary" | "outline"; bgColor?: string; textColor?: string };
    imageUrl?: string;
    imageAlt?: string;
    /** Focal point for cropped hero images, e.g. "top" keeps a portrait's face in frame. */
    imagePosition?: "top" | "center" | "bottom";
    videoUrl?: string;
    overlayOpacity?: number;
    overlayColor?: string;       // base color for the fullscreen-overlay gradient (default black)
    overlayColorTo?: string;     // second gradient stop; omit for a flat color
    /** Shorter banner height for interior/section-header heroes (fullscreen
     *  variant only). Full height when omitted. */
    compact?: boolean;
    accentColor?: string;
    typography: { titleSize: string; titleColor: string; subtitleColor: string; descColor: string };
    /** Spec Card / Page Banner: second headline line drawn in the accent gradient. */
    titleAccent?: string;
    /** Spec Card: glass card beside the headline. */
    specCard?: {
      label?: string;
      title?: string;
      meters?: { id: string; label: string; value: number }[];
      stats?: { id: string; value: string; label: string }[];
    };
    /** Spec Card: link strip along the bottom of the hero. */
    strip?: { id: string; title: string; subtitle?: string; url?: string }[];
    /** Page Banner: breadcrumb built from the page address. */
    showBreadcrumb?: boolean;
    /** Spec Card / Page Banner colour overrides; theme colours when unset. */
    colors?: { dark?: string; accent?: string };
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
      /** Makes the whole slide a link (image-only banners with no copy). */
      linkUrl?: string;
    }>;
    autoPlay: boolean;
    autoPlayInterval: number;
    showArrows: boolean;
    showDots: boolean;
    height: string;
    /** Height on phones (<768px); falls back to `height`. */
    mobileHeight?: string;
    /** Dot colour (e.g. brand gold); default white. */
    dotColor?: string;
    /** Slide button: white (default) or brand colour. */
    buttonStyle?: "white" | "primary";
  };
};

export type NavigationBlockProps = BlockBase & {
  type: "navigation";
  data: {
    logo?: string;
    logoText?: string;
    logoUrl?: string;
    /** Inline items. Used when menuLocation is unset, and as the fallback if
     *  the referenced menu is missing — a nav bar with no links is worse than
     *  a slightly stale one. */
    items: NavItem[];
    /** Render the tenant's menu assigned to this location instead of `items`.
     *  Keeping the menu in nav_menus and referencing it here is what stops the
     *  header and footer holding diverging copies of the same links. */
    menuLocation?: "header" | "footer" | "footer_secondary" | "mobile" | "sidebar" | "legal";
    sticky: boolean;
    /** Which rows stay pinned when sticky: the whole header (default) or,
     *  for the two-row "logo-center" style, only the menu row (the logo row
     *  scrolls away). */
    stickyRows?: "all" | "menu";
    /** Keep the announcement top bar pinned along with the header. */
    stickyTopBar?: boolean;
    transparent: boolean;
    style: "default" | "centered" | "split" | "minimal" | "logo-center";
    backgroundColor?: string;
    backgroundGradientTo?: string; // when set, renders a gradient from backgroundColor to this
    textColor?: string;
    activeColor?: string;
    logoHeight?: number;
    shadow?: boolean;
    borderBottom?: boolean;
    showCta?: boolean;
    /** Header builder "Booking button": links to the site's booking page (/book by default). */
    showBooking?: boolean;
    bookingLabel?: string;
    bookingUrl?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    ctaStyle?: "solid" | "outline";
    // ── Modern nav upgrades (all optional, backward compatible) ──────────
    /** "token" makes the bar read brand tokens (card/primary/foreground)
     *  instead of the legacy hardcoded colors — the recommended default for
     *  new templates. "legacy" keeps the old backgroundColor/textColor look. */
    colorMode?: "token" | "legacy";
    /** Overlays transparent on the hero, then becomes a solid/glass bar once
     *  the user scrolls past a threshold. Great for image heroes. */
    scrollAware?: boolean;
    /** Frosted-glass backdrop blur when solid (modern SaaS look). */
    glass?: boolean;
    /** Pill-style CTA vs default rounded; and optional secondary "ghost" link. */
    ctaVariant?: "solid" | "gradient" | "outline";
    secondaryCtaLabel?: string;
    secondaryCtaUrl?: string;
    /** Rounded floating bar detached from the top edge (premium look). */
    floating?: boolean;
    showCart?: boolean; // hide the cart icon on non-ecommerce sites
    /** Render the coded SVG icon+wordmark BrandLogo instead of plain text
     *  when no uploaded logo image is set. */
    useBrandMark?: boolean;
    /** Small icon image shown before the text logo (when no full logo image is set). */
    logoIconUrl?: string;
    /** Small caption rendered beside the logo (e.g. a business registration
     *  number). Purely cosmetic — omit for the old logo-only look. */
    logoCaption?: string;
    /** Store header extras (used by the logo-center style): product search
     *  box on the left, account / order-tracking icons beside the cart. */
    showSearch?: boolean;
    searchPlaceholder?: string;
    searchButtonLabel?: string;
    showAccount?: boolean;
    trackOrderUrl?: string;
    /** Background of the logo row only (logo-center); the menu row keeps the bar colour. */
    topRowBackground?: string;
    /** Upper-case, wider-spaced menu labels. */
    menuUppercase?: boolean;
    /** logo-center: "pill" (rounded box + button, default) or "plain" (icon + borderless field). */
    searchStyle?: "pill" | "plain";
    /** What the search box looks in. Only "products" -> /shop; otherwise /search. Default products. */
    searchScope?: ("products" | "categories" | "pages" | "posts")[];
    /** Category dropdown inside the search box (shop sites). */
    searchCategoryFilter?: boolean;
    /** logo-center: full-width colour band behind the menu row, with a dark rule above it. */
    menuRowBackground?: string;
    /** Thin info strip above the header (address, hours, promo, phone, WhatsApp). */
    topBar?: {
      show?: boolean;
      items: { id: string; text: string; icon?: string; url?: string; side?: "left" | "right"; hideOnMobile?: boolean }[];
      /** Phone and WhatsApp come from Contact details. */
      showPhone?: boolean;
      showWhatsapp?: boolean;
      whatsappLabel?: string;
      whatsappText?: string;
      background?: string;
      textColor?: string;
      /** "center": one centred announcement line (items only, no phone/WhatsApp). */
      align?: "split" | "center";
      uppercase?: boolean;
    };
  };
};

/**
 * Where a menu item's children come from.
 * - "manual": children are exactly the NavItems the author added.
 * - everything else: children are generated at render time from live data, so
 *   adding a service or product category shows up in the nav without anyone
 *   remembering to edit the menu.
 */
export type NavChildSource =
  | "manual"
  | "services"
  | "service_groups"
  | "product_categories"
  | "pages"
  | "blog_categories";

export type NavItem = {
  id: string;
  label: string;
  url: string;
  target?: "_blank" | "_self";
  children?: NavItem[];
  /** Lucide icon name — shown next to the label in mega-menu group headers. */
  icon?: string;
  /** Make a top-level item stand out as a pill (e.g. a house brand). */
  highlight?: "gold" | "brand" | "dark";
  /** Render this item's dropdown as a full-width multi-column mega menu.
   *  When unset the renderer falls back to inferring it (any grandchildren =
   *  mega), which keeps existing menus behaving exactly as before. */
  megaMenu?: boolean;
  /** Column count for the mega-menu grid on desktop. Defaults to 5. */
  megaColumns?: 2 | 3 | 4 | 5;
  /** Mega menu: single links (no sub-items) as a top strip (default) or a highlighted last column. */
  megaLinksAs?: "strip" | "column";
  /** Heading over that highlighted column. */
  megaLinksTitle?: string;
  /** Defaults to "manual" when unset, so existing menus are unaffected. */
  childSource?: NavChildSource;
  /** Cap on generated children, so a tenant with 200 products doesn't render
   *  a 200-item dropdown. Ignored for "manual". */
  childLimit?: number;
};

/**
 * Header-only sub-blocks (2026-09-06). A header composes these as
 * independent, separately draggable/reorderable blocks — see
 * project_block_editor_bugs memory for the "own block set, not shared with
 * page blocks" decision. Each is deliberately minimal: the header container
 * itself (a `container` block) supplies layout/alignment, these only carry
 * their own content.
 */
export type HeaderLogoBlockProps = BlockBase & {
  type: "header_logo";
  data: {
    /** Overrides the tenant's site_identity logo. Falls back to
     *  identityLogo/identityLogoDark (the real uploaded logo) when unset,
     *  same pattern the existing navigation block's data.logo already uses. */
    imageUrl?: string;
    imageDarkUrl?: string;
    /** Shown when there is no uploaded logo at all (neither an override nor
     *  a tenant logo) — same BrandLogo coded-SVG fallback nav already uses. */
    text?: string;
    height?: number;
    linkUrl?: string; // defaults to "/" when unset
  };
};

export type HeaderNavBlockProps = BlockBase & {
  type: "header_nav";
  data: {
    items: NavItem[];
    menuLocation?: "header" | "footer" | "footer_secondary" | "mobile" | "sidebar" | "legal";
    style: "default" | "centered" | "split" | "minimal" | "logo-center";
    textColor?: string;
    activeColor?: string;
  };
};

/** Header builder "Booking button" -> the site's booking page (/book). */
export type HeaderBookingBlockProps = BlockBase & {
  type: "header_booking";
  data: {
    label: string;
    url: string;
    variant: "solid" | "gradient" | "outline";
  };
};

export type HeaderCtaBlockProps = BlockBase & {
  type: "header_cta";
  data: {
    label: string;
    url: string;
    variant: "solid" | "gradient" | "outline";
  };
};

export type HeaderCartBlockProps = BlockBase & {
  type: "header_cart";
  data: {
    /** Icon-only vs icon+"Cart" label. */
    showLabel?: boolean;
  };
};

export type HeaderAccountBlockProps = BlockBase & {
  type: "header_account";
  data: {
    showLabel?: boolean;
  };
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
  /** Bento / Photo Cards: small label above the title. */
  kicker?: string;
};

export type ServicesBlockProps = BlockBase & {
  type: "services";
  data: {
    title?: string;
    subtitle?: string;
    layout: "grid" | "list" | "cards" | "icon-list";
    columns: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    items: ServiceItem[];
    cardStyle: "flat" | "elevated" | "bordered" | "gradient";
    source?: "inline" | "group";
    source_group_id?: string;
    /** Bento / Photo Cards: small label above the title. */
    eyebrow?: string;
    /** Bento: hide descriptions on the small tiles. */
    hideSmallText?: boolean;
    /** Photo Cards: "View all" link beside the title. */
    allLink?: { label?: string; url?: string };
    colors?: { dark?: string; accent?: string };
    /** Boutique Tiles: photo shape. Default landscape for 2 columns, square otherwise. */
    tileRatio?: "landscape" | "square" | "portrait";
    /** Boutique Tiles: caption under the photo (default) or on the photo with the button at its foot. */
    tileStyle?: "below" | "overlay";
  };
};

// ─── Item Box: universal card-grid block ───────────────────────────────────
// Pulls its cards from any existing content source (Services, Features,
// Portfolio, Testimonials, Blog posts, Pages) or stays fully manual — see
// item-box-block.tsx / item-box-block-server.tsx for the resolvers.

export type ItemBoxSource = "inline" | "services" | "features" | "portfolio" | "testimonials" | "blog" | "pages" | "marketplace_catalog";

export type ItemBoxLink =
  | { type: "manual"; url: string }
  | { type: "page" | "post" | "service" | "feature"; refId: string; url?: string };

export type ItemBoxItem = {
  id: string;
  title: string;
  description?: string;
  image?: { type: "url" | "icon" | "none"; value?: string };
  link?: ItemBoxLink;
};

export type ItemBoxBlockProps = BlockBase & {
  type: "item_box";
  data: {
    title?: string;
    subtitle?: string;
    source: ItemBoxSource;
    source_group_id?: string;
    /** Chosen subset + custom order for non-inline sources. Empty/absent
     *  falls back to "all items from group" / "most recent N" as before. */
    source_item_ids?: string[];
    items: ItemBoxItem[];
    columns: 2 | 3 | 4;
    layout: "grid" | "list";
    cardStyle: "flat" | "elevated" | "bordered" | "gradient";
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
    /** Visit + Map: small label above the title. */
    eyebrow?: string;
    /** Visit + Map: overrides for the site's contact details (empty = use them). */
    address?: string;
    phone?: string;
    hours?: string;
    /** Visit + Map: what to show on the map; defaults to the address. */
    mapQuery?: string;
    showMap?: boolean;
    colors?: { dark?: string; accent?: string };
    /** Boutique Banner: copy centred (default) or pinned to the top of the photo. */
    contentPosition?: "center" | "top";
    /** Boutique Banner: light text for photos (default) or dark text for pale backgrounds. */
    tone?: "light" | "dark";
    /** Boutique Banner: brand-colour button (default) or light grey pill. */
    buttonStyle?: "brand" | "light";
    /** Boutique Banner: justify the description text. */
    justify?: boolean;
    /** Boutique Banner: logo / emblem above the title (e.g. a house brand). */
    logoUrl?: string;
    logoHeight?: number;
  };
};

export type TestimonialsBlockProps = BlockBase & {
  type: "testimonials";
  data: {
    title?: string;
    subtitle?: string;
    layout: "grid" | "carousel" | "masonry";
    /** "group": show the testimonials of a group from the Testimonials
     *  dashboard (manual entries and product reviews featured there). */
    source?: "inline" | "group";
    source_group_id?: string;
    /** Group source: how many to show (newest featured first by sort order). */
    limit?: number;
    items: Array<{
      id: string;
      name: string;
      role?: string;
      company?: string;
      avatar?: string;
      /** Short headline above the quote (Photo Cards). */
      title?: string;
      /** Review Cards: product the review is about (shown under the name) and its link. */
      product?: string;
      productUrl?: string;
      /** Review Cards: show a verified-buyer tick after the name. */
      verified?: boolean;
      content: string;
      rating?: number;
    }>;
    /** Photo Cards: card background (default warm sand) and star colour. */
    cardColor?: string;
    starColor?: string;
  };
};

export type EcommerceProductsBlockProps = BlockBase & {
  type: "ecommerce_products";
  data: {
    title?: string;
    subtitle?: string;
    displayCount: number;
    layout: "grid" | "list" | "featured" | "minimal" | "wide-cards" | "carousel";
    columns: 2 | 3 | 4 | 5;
    /** @deprecated single-category selection — use categoryIds */
    categoryId?: string;
    /** Show only products in these categories. Empty/undefined = all categories. */
    categoryIds?: string[];
    sortBy: "latest" | "price_asc" | "price_desc" | "featured";
    showAddToCart: boolean;
    showDescription: boolean;
    showBadges: boolean;
    showRating: boolean;
    cardStyle: "default" | "flat" | "minimal" | "shadow" | "bordered" | "boutique" | "retail";
    imageRatio: "square" | "portrait" | "landscape" | "auto";
    sectionPadding: "none" | "sm" | "md" | "lg" | "xl";
    backgroundColor?: string;
    titleAlignment: "left" | "center" | "right";
    ctaLabel?: string;
    ctaUrl?: string;
    /** "compact": small upper-case title with an underlined link under it (shop look). */
    headingStyle?: "default" | "compact";
    /** Underlined link under a compact title (e.g. SHOP NOW). */
    headerLink?: { label?: string; url?: string };
    /** "categories": show the chosen categories as photo tiles (name under the photo, Shop now button). */
    showAs?: "products" | "categories";
    categoryButtonLabel?: string;
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
  /** Spec Cards: crossed-out former price, e.g. "245". */
  oldPrice?: string;
  /** Spec Cards: small chip beside the name, e.g. "USA film". */
  tag?: string;
  /** Spec Cards: one-line spec under the price, e.g. the film type. */
  spec?: string;
  /** Spec Cards: labelled percentage bars (UV 99%, Speed 80%...). */
  meters?: { id: string; label: string; value: number }[];
  /** Spec Cards: items shown greyed out as not included. */
  excludedFeatures?: string[];
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
    /** Small label above the title (Spec Cards). */
    eyebrow?: string;
    /** Printed small before every price, e.g. "RM", "$", "QAR" (Spec Cards). */
    currencyPrefix?: string;
    /** Note under the grid (Spec Cards). */
    footnote?: string;
    /** Plan buttons open WhatsApp with a prefilled message (site WhatsApp number). */
    whatsappCta?: boolean;
    /** Prefilled WhatsApp text; {plan} and {price} are replaced. */
    whatsappText?: string;
    /** Optional colour overrides; theme colours when unset. */
    colors?: { dark?: string; accent?: string };
  };
};

export type FeatureItem = {
  id: string;
  icon?: string;
  title: string;
  description: string;
  imageUrl?: string;
  /** Image + Stats: small label under the big value (title). */
  label?: string;
};

export type FeaturesBlockProps = BlockBase & {
  type: "features";
  data: {
    title?: string;
    subtitle?: string;
    /** Body paragraph — currently only rendered by the "dark" templateVariant. */
    description?: string;
    layout: "grid" | "alternating" | "icon-list" | "centered";
    columns: 2 | 3 | 4;
    items: FeatureItem[];
    style: "minimal" | "card" | "gradient";
    /** Showcase variants: small label above the title. */
    eyebrow?: string;
    /** Overview + Quote Card: chips under the text. */
    tags?: string[];
    /** Overview + Quote Card: the sticky side card. */
    card?: { imageUrl?: string; title?: string; text?: string; buttonLabel?: string; buttonUrl?: string; whatsapp?: boolean; whatsappText?: string };
    /** Numbered Grid: dark band or light bordered grid. */
    tone?: "dark" | "light";
    /** Image + Stats: photo and the badge floating on it. */
    imageUrl?: string;
    badge?: { title?: string; text?: string };
    buttons?: { id: string; label: string; url: string; style?: "solid" | "outline" }[];
    colors?: { dark?: string; accent?: string };
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
    /** "filled": grey filled inputs with placeholders, no card frame. */
    formStyle?: "card" | "filled";
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
    /** WhatsApp number; shown as a chat button. */
    whatsapp?: string;
    /** Free text, e.g. "Sat–Thu, 10am–8pm". */
    hours?: string;
    /** Short reassurance under the details, e.g. "We reply within an hour". */
    note?: string;
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
    /** "underline": line field with a light pill button inside (shop footers). */
    fieldStyle?: "box" | "underline";
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
  platform: "facebook" | "instagram" | "twitter" | "linkedin" | "youtube" | "tiktok" | "whatsapp" | "snapchat";
  url: string;
};

export type FooterBlockProps = BlockBase & {
  type: "footer";
  data: {
    /** Oversized brand name across the very bottom of the footer. */
    wordmark?: boolean;
    /** Small icon image shown before the text logo when no logo image is set. */
    logoIconUrl?: string;
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
    /** Footer "Booking" strip: a short invitation plus a button to the booking page. */
    showBooking?: boolean;
    bookingTitle?: string;
    bookingText?: string;
    bookingLabel?: string;
    bookingUrl?: string;
    newsletterLabel?: string;
    newsletterPlaceholder?: string;
    bottomLinks?: FooterColumnLink[];
    style?: "dark" | "light" | "colored" | "retail";
    /** Small line rendered beneath the logo/tagline (e.g. a business
     *  registration number). Purely cosmetic — omit for the old look. */
    logoCaption?: string;
    /** Retail: heading over the social icons column. */
    followTitle?: string;
    /** Retail: accepted-payments strip (image) beside the copyright. */
    paymentImage?: string;
    /** Retail: short line at the end of the bottom row. */
    bottomNote?: string;
  };
};

export type CountryGridItem = {
  id: string;
  country: string;
  flagEmoji?: string;
  image?: string;
  region?: string;
  visaTypes?: string[];
  processingTime?: string;
  summary?: string;
  href?: string;
};

export type CountryGridBlockProps = BlockBase & {
  type: "country_grid";
  data: {
    title?: string;
    subtitle?: string;
    columns?: 2 | 3 | 4;
    groupByRegion?: boolean;
    accentColor?: string;
    items: CountryGridItem[];
  };
};

export type EligibilityDestination = {
  id: string;
  label: string;
  value: string;
};

export type EligibilityCheckerBlockProps = BlockBase & {
  type: "eligibility_checker";
  data: {
    title?: string;
    subtitle?: string;
    destinations?: EligibilityDestination[];
    submitLabel?: string;
    successMessage?: string;
    recipientEmail?: string;
    accentColor?: string;
  };
};

export type StatusTrackerBlockProps = BlockBase & {
  type: "status_tracker";
  data: {
    title?: string;
    subtitle?: string;
    placeholder?: string;
    helpText?: string;
    submitLabel?: string;
    accentColor?: string;
    /** "order" = storefront order tracking (order number + billing email). */
    mode?: "visa" | "order";
    emailPlaceholder?: string;
    /** Help link shown when nothing is found (order mode). */
    contactUrl?: string;
    /** Card frame around the form; off for a flat page section. */
    plain?: boolean;
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
  | FooterBlockProps
  | CountryGridBlockProps
  | EligibilityCheckerBlockProps
  | StatusTrackerBlockProps
  | BookingBlockProps
  | MarketplaceBookingBlockProps
  | MarketplaceRequestBlockProps
  | MarketplaceVendorDirectoryBlockProps
  | ReSearchBlockProps
  | ReListingsBlockProps
  | ReCommunitiesBlockProps
  | ReDevelopersBlockProps
  | ReCalculatorBlockProps
  | ReLeadFormBlockProps
  | DonorGroupCardsBlockProps
  | DonorListBlockProps
  | DonorMapBlockProps
  | DonorRequestsBlockProps
  | ContainerBlockProps
  | ItemBoxBlockProps
  | ScrollStoryBlockProps
  | MarqueeBlockProps
  | OptionPreviewBlockProps
  | HeaderLogoBlockProps
  | HeaderNavBlockProps
  | HeaderCtaBlockProps
  | HeaderBookingBlockProps
  | HeaderCartBlockProps
  | HeaderAccountBlockProps;

export type ContainerColumn = {
  id: string;
  /** Column width as a flex-basis percentage. Columns in a row should sum to ~100. */
  widthPct: number;
  blocks: Block[];
};

export type ContainerBlockProps = BlockBase & {
  type: "container";
  data: {
    columns: ContainerColumn[];
    direction: "row" | "column";
    gap: "none" | "sm" | "md" | "lg";
    /** Row cross-axis alignment (align-items). */
    align: "start" | "center" | "end" | "stretch";
    /** Row main-axis alignment (justify-content). */
    justify: "start" | "center" | "end" | "between";
    wrapOnMobile: boolean;
    // ── Header behavior (2026-09-06) ──────────────────────────────────
    // A container used as a site header (holding header_logo/header_nav/
    // header_cta/etc sub-blocks) needs the same sticky/transparent-overlay
    // behavior the legacy navigation block always had — added here so
    // migrating a tenant's nav block to the new sub-block model doesn't
    // lose that visual design. Optional and default-off, so an ordinary
    // page-content container (not a header) is completely unaffected.
    /** Stays pinned to the top of the viewport while scrolling. */
    sticky?: boolean;
    /** Renders transparent over whatever's behind it (a hero image) until
     *  the visitor scrolls, then becomes solid — same overlayHero pattern
     *  navigation's scrollAware/transparent fields already implement. */
    scrollAware?: boolean;
    /** Static transparent-at-top without the scroll-solidify behavior —
     *  same distinction navigation's own transparent field made. */
    transparent?: boolean;
    /** Frosted-glass backdrop blur once solid. */
    glass?: boolean;
  };
};

export type DonorGroupCardsBlockProps = BlockBase & {
  type: "donor_group_cards";
  data: {
    title?: string;
    subtitle?: string;
    accentColor?: string;      // card accent (blood red default)
    linkTarget?: string;       // where cards send the filter, default "#donor-list"
  };
};

export type DonorRequestsBlockProps = BlockBase & {
  type: "donor_requests";
  data: {
    title?: string;
    subtitle?: string;
  };
};

export type DonorMapBlockProps = BlockBase & {
  type: "donor_map";
  data: {
    title?: string;
    subtitle?: string;
    height: number;
  };
};

export type DonorListBlockProps = BlockBase & {
  type: "donor_list";
  data: {
    title?: string;
    accentColor?: string;
    showAddButton: boolean;
    addButtonLabel: string;
    showFilters: boolean;
  };
};

export type BookingBlockProps = BlockBase & {
  type: "booking";
  data: {
    title?: string;
    subtitle?: string;
    accentColor?: string;
    daysToShow: number;          // how many upcoming days appear in the picker
    showPhone: boolean;
    showMessage: boolean;
    submitLabel: string;
  };
};

export type MarketplaceBookingBlockProps = BlockBase & {
  type: "marketplace_booking";
  data: {
    title?: string;
    subtitle?: string;
    accentColor?: string;
    submitLabel: string;
  };
};

export type MarketplaceRequestBlockProps = BlockBase & {
  type: "marketplace_request";
  data: {
    title?: string;
    subtitle?: string;
    accentColor?: string;
    submitLabel: string;
  };
};

export type MarketplaceVendorDirectoryBlockProps = BlockBase & {
  type: "marketplace_vendor_directory";
  data: {
    title?: string;
    subtitle?: string;
    accentColor?: string;
    /** Hide the vendor card grid, showing only the coverage map — used for
     *  a compact home-page "where we operate" section (default true = show cards). */
    showCards?: boolean;
    mapHeight?: number;
  };
};

// ─── Page Types ───────────────────────────────────────────────────────────

export type PageStatus = "draft" | "published" | "scheduled" | "archived";
export type PageType = "page" | "post" | "landing" | "portfolio";

export type Page = {
  id: string;
  /** Owning tenant. Null for root (non-tenant) pages. */
  tenant_id?: string | null;
  title: string;
  slug: string;
  type: PageType;
  status: PageStatus;
  /** What the public site renders. On a published page, editor autosaves
   *  go to draft_blocks instead, until Publish (see migration 105). */
  blocks: Block[];
  /** Unpublished edits to a live page; null when there are none. */
  draft_blocks?: Block[] | null;
  /** Bumped on every change to blocks/draft_blocks by any writer — the
   *  editor's conflict check (two tabs/people editing the same page). */
  draft_rev?: number;
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
  /** Set on a translated copy of a page (e.g. "ar"). The page then renders
   *  with its own navigation/footer blocks in place of the global chrome,
   *  right-to-left when the language needs it. */
  lang?: string;
  /** hreflang alternates: language code -> path, e.g. { en: "/", ar: "/ar" }. */
  alternates?: Record<string, string>;
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
  email?: string;
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

/** Which bottom sheet the mobile builder shell has open. Ephemeral UI state
 *  (never persisted) — lives in the store so the canvas's block toolbar can
 *  ask the shell to open the settings sheet without prop-drilling. */
export type MobileSheet = null | "add" | "layers" | "settings";

export type BuilderState = {
  pageId?: string;
  /** Tenant that owns the page being edited. Not necessarily the viewer's own
   *  tenant — a super admin can edit another tenant's page. */
  tenantId?: string;
  blocks: Block[];
  selectedBlockId?: string;
  hoveredBlockId?: string;
  isDragging: boolean;
  mode: BuilderMode;
  breakpoint: Breakpoint;
  history: Block[][];
  historyIndex: number;
  isDirty: boolean;
  mobileSheet: MobileSheet;
};

// ─── Real estate module blocks ───────────────────────────────────────────────
// Data lives in re_properties / re_communities / re_developers (migration 112);
// these blocks only carry presentation + preset filters.

export type ReListingType = "sale" | "rent" | "offplan";

export type ReSearchBlockProps = BlockBase & {
  type: "re_search";
  data: {
    title?: string;
    subtitle?: string;
    /** Listing page the search submits to, with filters as query params. */
    resultsPath?: string;
    tabs?: ReListingType[];
    backgroundImage?: string;
    /** Max-price dropdown options (listing currency). Empty = built-in steps. */
    salePriceSteps?: number[];
    rentPriceSteps?: number[];
    /** Split layout: agent portrait beside the search card on a matched backdrop. */
    portraitImage?: string;
    portraitAlt?: string;
    portraitSide?: "left" | "right";
    portraitCaption?: string;
    portraitSubcaption?: string;
    eyebrow?: string;
    backdropColor?: string;
    glowColor?: string;
  };
};

export type ReListingsBlockProps = BlockBase & {
  type: "re_listings";
  data: { cardStyle?: "standard" | "editorial" | "showcase"; accentColor?: string; /** Square-bullet label above a rule; switches the heading to the editorial style. */ eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** Preset filter. Empty = all listing types (buyer can switch). */
    listingType?: ReListingType | "";
    communitySlug?: string;
    developerSlug?: string;
    featuredOnly?: boolean;
    showFilters?: boolean;
    /** Read filters from / write them to the page URL. */
    syncUrl?: boolean;
    limit?: number;
    columns?: 2 | 3 | 4;
    viewAllUrl?: string;
  };
};

export type ReCommunitiesBlockProps = BlockBase & {
  type: "re_communities";
  data: { /** Square-bullet label above a rule; switches the heading to the editorial style. */ eyebrow?: string; title?: string; subtitle?: string; featuredOnly?: boolean; limit?: number; country?: string };
};

export type ReDevelopersBlockProps = BlockBase & {
  type: "re_developers";
  data: { /** Square-bullet label above a rule; switches the heading to the editorial style. */ eyebrow?: string; title?: string; subtitle?: string; style?: "logos" | "cards" };
};

export type ReCalculatorBlockProps = BlockBase & {
  type: "re_calculator";
  data: { /** Square-bullet label above a rule; switches the heading to the editorial style. */ eyebrow?: string;
    title?: string;
    subtitle?: string;
    mode?: "mortgage" | "roi" | "both";
    currency?: string;
    defaultPrice?: number;
    defaultRate?: number;
    defaultDownPct?: number;
    defaultYears?: number;
  };
};

export type ReLeadFormBlockProps = BlockBase & {
  type: "re_lead_form";
  data: {
    title?: string;
    subtitle?: string;
    kind?: "consultation" | "valuation" | "viewing" | "enquiry";
    submitLabel?: string;
    successMessage?: string;
    showBudget?: boolean;
    image?: string;
    bullets?: string[];
  };
};

export type ScrollStoryBlockProps = BlockBase & {
  type: "scroll_story";
  data: {
    /** Section height in vh; more = slower scrub. */
    heightVh?: number;
    /** "autoplay": one-screen film that plays on its own; default scrubs with scroll. */
    mode?: "scroll" | "autoplay";
    slideMs?: number;
    backgrounds?: { imageUrl: string }[];
    /** Transparent cut-out (PNG/WebP) standing in front of the backgrounds. */
    portraitImage?: string;
    portraitAlt?: string;
    portraitSide?: "left" | "center" | "right";
    /** rotateWords: cycled into the title's "{words}" slot (or appended). */
    scenes?: { eyebrow?: string; title: string; text?: string; side?: "left" | "right"; rotateWords?: string[]; vAlign?: "top" | "middle" }[];
    overlayOpacity?: number;
    accentColor?: string;
    /** Colour the bottom edge fades into (the next section background). */
    blendColor?: string;
    showLines?: boolean;
    primaryCta?: { label: string; url: string };
    secondaryCta?: { label: string; url: string };
  };
};

/** Tap an option, the photo shows it: tint shades, paint colours, finishes, before/after. */
export type OptionPreviewBlockProps = BlockBase & {
  type: "option_preview";
  data: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** Photo every "tint" option darkens/colours. */
    imageUrl?: string;
    options: {
      id: string;
      label: string;
      sublabel?: string;
      /** tint: colour overlay on the main photo. image: show this option's own photo. */
      mode?: "tint" | "image";
      color?: string;
      /** 0-100 overlay strength for tint options. */
      strength?: number;
      imageUrl?: string;
    }[];
    defaultIndex?: number;
    showLabel?: boolean;
    /** Text before the option label on the photo, e.g. "VLT". */
    labelPrefix?: string;
    tone?: "dark" | "light";
    panel?: {
      show?: boolean;
      title?: string;
      rows?: { id: string; label: string; value: string }[];
      text?: string;
      buttonLabel?: string;
      buttonUrl?: string;
      whatsapp?: boolean;
      whatsappText?: string;
    };
    colors?: { dark?: string; accent?: string };
  };
};

export type MarqueeBlockProps = BlockBase & {
  type: "marquee";
  data: {
    items: string[];
    separator?: string;
    size?: "sm" | "md" | "lg";
    speed?: number;
    direction?: "left" | "right";
    outlineAlternate?: boolean;
    scrollBoost?: boolean;
    color?: string;
    accentColor?: string;
  };
};
