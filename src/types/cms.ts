import type { CollectionBinding } from "@/lib/collections/binding";
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
  | "cards"
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
  | "social_links"
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
  | "pricing_catalog"
  | "steps"
  | "icon_grid"
  | "video"
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
  | "results_search"
  | "table"
  | "results_courses"
  | "results_alumni"
  | "donor_group_cards"
  | "donor_list"
  | "donor_map"
  | "donor_requests"
  | "container"
  | "item_box"
  | "scroll_story"
  | "marquee"
  | "option_preview"
  | "bottom_bar"
  | "code"
  | "media_tabs"
  | "section_nav"
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
  | "header_account"
  | "search";

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
  /** Section heading size on phones (under 640px). Unset = same as headingSize. */
  headingSizeMobile?: number;
  cardTitleSize?: number;
  textSize?: number;
  cardTitleCase?: "none" | "uppercase" | "capitalize";
  /** Cards (grid / wrapping-row children) drift gently up and down. */
  cardMotion?: "float";
  /** On hover: cards lift, or lift and fill with cardHoverColor. */
  cardHover?: "lift" | "lift-color";
  /** Fill colour for cardHover "lift-color" (hex). Unset = brand primary. */
  cardHoverColor?: string;
  /** Focal point for every cropped (object-cover) image in this section,
   *  unless an image sets its own. Rules in globals.css (.pc-if). */
  imageFocus?: import("@/lib/image-focus").ImageFocus;
};

export type BlockBackground = {
  type: "none" | "color" | "gradient" | "image";
  color?: string;
  gradient?: string;
  imageUrl?: string;
  imageOverlay?: string;
  imageOverlayTo?: string;
  imageOverlayOpacity?: number;
  /** Overlay shape: diagonal 135deg wash (default) or dark-left fade. */
  imageOverlayStyle?: "left-fade";
  /** Which part of the background photo stays visible when cropped. Unset = site default, else center. */
  focus?: import("@/lib/image-focus").ImageFocus;
};

// ─── Block Prop Types ─────────────────────────────────────────────────────

export type HeroBlockProps = BlockBase & {
  type: "hero";
  data: {
    layout: "centered" | "left" | "right" | "split";
    /** Page Banner: lucide icon name (e.g. "Zap") shown on a round accent badge above the title. */
    icon?: string;
    badge?: string;
    badgeBgColor?: string;
    badgeTextColor?: string;
    title: string;
    subtitle?: string;
    description?: string;
    primaryButton?: { label: string; url: string; variant: "primary" | "secondary" | "outline"; bgColor?: string; textColor?: string };
    secondaryButton?: { label: string; url: string; variant: "primary" | "secondary" | "outline"; bgColor?: string; textColor?: string };
    /** Optional third button, styled like the secondary one. */
    tertiaryButton?: { label: string; url: string; variant: "primary" | "secondary" | "outline"; bgColor?: string; textColor?: string };
    imageUrl?: string;
    imageAlt?: string;
    /** Background slideshow (fullscreen / dark-gradient / corporate): 2+ photos
     *  cross-fade in turn. Unset or one photo = the single image. */
    bgSlides?: string[];
    /** Seconds per slide (default 5). */
    slideInterval?: number;
    /** Split Image: "full" shows the whole photo (banners with text) instead
     *  of cropping it to the frame. Cover (crop) when unset. */
    imageFit?: "cover" | "full";
    /** Fullscreen overlay: "diagonal" (default) tint or "left-fade" (dark on
     *  the left fading to clear on the right). */
    overlayStyle?: "diagonal" | "left-fade";
    /** Fullscreen overlay: tint the whole section incl. its padding (one
     *  layer) instead of only the content box. Off when unset. */
    overlayFullBleed?: boolean;
    /** Focal point for cropped hero images, e.g. "top" keeps a portrait's face in frame. */
    imagePosition?: "top" | "center" | "bottom";
    /** Optional photo for phones (under 768px), e.g. a portrait shot; desktop keeps imageUrl. */
    mobileImageUrl?: string;
    mobileImageFocus?: import("@/lib/image-focus").ImageFocus;
    /** Shared focal point (wins over imagePosition). */
    imageFocus?: import("@/lib/image-focus").ImageFocus;
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
    /** Split Image: check-mark points under the text. */
    bullets?: string[];
    /** Product: a command shown under the buttons with a copy button, e.g. "docker compose up -d". */
    command?: string;
    /** Product: address shown in the bar of the screenshot window ("none" = no window bar). */
    frameUrl?: string;
    /** Product: width divided by height of the screenshot, e.g. 1.6. */
    imageRatio?: number;
    /** Spec Card: glass card beside the headline. */
    specCard?: {
      label?: string;
      title?: string;
      meters?: { id: string; label: string; value: number }[];
      stats?: { id: string; value: string; label: string }[];
    };
    /** Spec Card: framed photo beside the text instead of the glass card, with small white cards on its edges. */
    sidePhoto?: {
      /** "full" shows the whole image (banners with text) instead of cropping to the frame. */
      imageFit?: "cover" | "full";
      imageUrl: string;
      imageFocus?: import("@/lib/image-focus").ImageFocus;
      alt?: string;
      badges?: { id: string; title: string; text?: string; stars?: boolean; link?: string; position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" }[];
      /** "sm": small badges inside the photo corners instead of large cards on its edges. */
      badgeSize?: "default" | "sm";
    };
    /** Spec Card: small glass stat boxes under the buttons. */
    statRow?: { id: string; value: string; label: string }[];
    /** Spec Card: small pill chips (icon + text) under the stat boxes, e.g. "Licensed & Insured". */
    chipRow?: { id: string; icon?: string; text: string }[];
    /** Spec Card: short highlighted line above the badge, e.g. "24/7 Emergency Electrician in Singapore". */
    topLine?: string;
    /** Chip text size (default "sm"). */
    chipSize?: "sm" | "md" | "lg";
    /** Rounded border around each chip; on unless set to false. */
    chipBorder?: boolean;
    /** Spec Card: "text" shows the badge as a plain accent eyebrow line instead of a pill. */
    badgeStyle?: "pill" | "text";
    /** Spec Card: accent words on the title's last line, solid accent colour. */
    accentInline?: boolean;
    /** Spec Card: faint grid lines over the background photo. */
    gridTexture?: boolean;
    /** Spec Card: show the trust row (logos) above the buttons instead of below. */
    trustFirst?: boolean;
    /** Spec Card: link strip along the bottom of the hero. */
    strip?: { id: string; title: string; subtitle?: string; url?: string }[];
    /** Trust row under the buttons (every style). Each part toggles on its own. */
    showCountries?: boolean;
    countries?: string[];
    countriesLabel?: string;
    showTrustLogos?: boolean;
    trustLogos?: { url: string; alt?: string }[];
    trustLogosLabel?: string;
    /** "cards" = each logo on a white card inside a soft panel; default = plain logo row. */
    trustLogosStyle?: "plain" | "cards";
    showRating?: boolean;
    rating?: { value: number; count?: string; label?: string; style?: "stars" | "pill" | "google" | "big" };
    /** Page Banner: breadcrumb built from the page address. */
    showBreadcrumb?: boolean;
    /** Page Banner breadcrumb: text of the first crumb. Empty = "Home" in the page's language. */
    homeLabel?: string;
    /** Short enquiry form under the headline (split-image-right / classic layouts). Off when unset. */
    leadForm?: InlineLeadFormData;
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
      imageFocus?: import("@/lib/image-focus").ImageFocus;
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
    /** Split layout only: short enquiry form in the copy panel (below the
     *  headline on phones). Off when unset. */
    leadForm?: InlineLeadFormData;
  };
};

export type NavigationBlockProps = BlockBase & {
  type: "navigation";
  data: import("@/modules/page-builder/ui-text").UiTextData<"navigation"> & {
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
    /** Saved menu (nav_menus.id) to show; wins over menuLocation. Set when
     *  the owner first edits the menu on the builder canvas (menus P3). */
    menuId?: string;
    sticky: boolean;
    /** Which rows stay pinned when sticky: the whole header (default) or,
     *  for the two-row "logo-center" style, only the menu row (the logo row
     *  scrolls away). */
    stickyRows?: "all" | "menu";
    /** Keep the announcement top bar pinned along with the header. */
    stickyTopBar?: boolean;
    /** Hide the header button from 768px to 1023px, for long menus that do not fit beside it. */
    hideCtaOnTablet?: boolean;
    transparent: boolean;
    /** "logo-center-inline": one row, menu left, logo centre, social icons right. */
    style: "default" | "centered" | "split" | "minimal" | "logo-center" | "logo-center-inline";
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
    /** Header button colour (any CSS colour). Unset = brand colours. */
    ctaColor?: string;
    /** Header button text colour. Unset = white (or the button colour for outline). */
    ctaTextColor?: string;
    secondaryCtaLabel?: string;
    secondaryCtaUrl?: string;
    /** Rounded floating bar detached from the top edge (premium look). */
    floating?: boolean;
    showCart?: boolean; // hide the cart icon on non-ecommerce sites
    /** What the cart icon does: open the side cart (default) or go to the /cart page. */
    cartOpens?: "drawer" | "page";
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
    /** Menu text (desktop). px / weight / gap between items; unset = design default. */
    menuFontSize?: number;
    menuFontWeight?: number;
    menuGap?: number;
    ctaFontSize?: number;
    /** logo-center: "pill" (rounded box + button, default) or "plain" (icon + borderless field). */
    searchStyle?: "pill" | "plain";
    /** What the search box looks in. Only "products" -> /shop; otherwise /search. Default products. */
    searchScope?: ("products" | "categories" | "pages" | "posts")[];
    /** Category dropdown inside the search box (shop sites). */
    searchCategoryFilter?: boolean;
    /** Language button: the other language's code, e.g. "ar" (or "en" on a translated header). */
    languageSwitch?: string;
    /** "google" (default): toggles the Google Translate widget. "native": a plain link to this
     *  page's own translated version (hreflang alternates), else to languageSwitchUrl. */
    languageSwitchMode?: "google" | "native";
    /** Native mode fallback when the current page has no version in that language. Default "/<code>". */
    languageSwitchUrl?: string;
    /** Phones: "in-menu" (default) keeps the language button inside the menu drawer;
     *  "beside-menu" shows a compact one next to the menu button, always visible. */
    langSwitcherMobile?: "beside-menu" | "in-menu";
    /** Live suggestions shown while typing (default 5). */
    searchSuggestLimit?: number;
    /** logo-center: full-width colour band behind the menu row, with a dark rule above it. */
    menuRowBackground?: string;
    /** Phone-width header row (below md). Desktop is never affected.
     *  - "default" (or unset): the row as each style always rendered it.
     *  - "centered-logo": menu left, logo truly centred, up to 2 icons right
     *    (search + cart on shops, else call / WhatsApp); account etc. move to the drawer.
     *  - "menu-left": menu + logo on the left, up to 2 icons right
     *    (call + WhatsApp on service sites, search + cart on shops).
     *  - "spaced": logo left, equal 44px icon buttons right, menu last. */
    mobileLayout?: "default" | "centered-logo" | "menu-left" | "spaced";
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
      /** Centred bar: show one item at a time, rotating. */
      rotate?: boolean;
      rotateSeconds?: number;
      /** Centred bar: all items scroll across as a continuous ticker (marquee). */
      scroll?: boolean;
      /** Seconds for one full loop of the ticker. */
      scrollSeconds?: number;
      /** Show the site's social icons (Business Profile > Social Media) on the right of the bar. */
      showSocials?: boolean;
      /** Fallback icons, used only while the site's central list is empty or unavailable. */
      socials?: FooterSocial[];
      /** Short label before the social icons, e.g. "FOLLOW US:" (hidden on phones). */
      socialsLabel?: string;
      /** Icons in each network's brand colour on white chips. */
      /** Hide the whole strip on phones (under 768px), e.g. when a bottom bar carries call and WhatsApp. */
      hideOnMobile?: boolean;
      socialsBrandColors?: boolean;
      /** "app": official app-icon look (rounded square in the network's colour, white glyph). Overrides socialsBrandColors. */
      socialsStyle?: "default" | "app";
      /** Google Translate language menu in the bar, in this order (codes like "en", "zh-CN", "ms"). Needs Settings > auto-translate on. */
      languages?: string[];
      /** Language menu icon: "google" = official Google Translate logo. */
      languagesIcon?: "default" | "google";
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
  | "blog_categories"
  /** Menu Studio (Nov 2026): shop products, newest first or hand-picked (childIds). */
  | "products"
  /** Menu Studio (Nov 2026): blog posts at /blog/<slug>, newest first or hand-picked. */
  | "posts";

/** Mega menu featured card (Menu Studio). Every field optional; the card shows when it has a title or image. */
export type NavMegaFeatured = {
  image?: string;
  title?: string;
  text?: string;
  url?: string;
  ctaLabel?: string;
};

/** Extra settings of a Menu Studio mega menu. Present = the item renders with the studio renderer. */
export type NavMegaConfig = {
  /** The single featured card (Menu Studio phase 1). Still read when `cards` is unset. */
  featured?: NavMegaFeatured;
  /** Mega builder (menus P4): 0 to 2 featured cards. When set (even empty) it replaces `featured`. */
  cards?: NavMegaFeatured[];
  /** Mega builder (menus P4): panel as wide as the content (default, up to 1120px) or the whole window. */
  width?: "container" | "full";
};

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
  /** Language switch: links to the CURRENT page in this language (from the
   *  page's hreflang alternates), falling back to `url` (that language's home). */
  lang?: string;
  /** Render this item's dropdown as a full-width multi-column mega menu.
   *  When unset the renderer falls back to inferring it (any grandchildren =
   *  mega), which keeps existing menus behaving exactly as before. */
  megaMenu?: boolean;
  /** Column count for the mega-menu grid on desktop. Defaults to 5. 6 is mega builder only (menus P4). */
  megaColumns?: 2 | 3 | 4 | 5 | 6;
  /** Mega menu: single links (no sub-items) as a top strip (default) or a highlighted last column. */
  megaLinksAs?: "strip" | "column";
  /** Heading over that highlighted column. */
  megaLinksTitle?: string;
  /** Defaults to "manual" when unset, so existing menus are unaffected. */
  childSource?: NavChildSource;
  /** Cap on generated children, so a tenant with 200 products doesn't render
   *  a 200-item dropdown. Ignored for "manual". */
  childLimit?: number;

  // ── Menu Studio (Header & Footer Studio phase 1, Nov 2026) ──────────────
  // All optional and absent on menus saved before it. An item renders through
  // the studio renderer (nav-menu-studio.tsx) only when one of these is set
  // somewhere in its subtree (see usesStudio in modules/navigation/menu-model),
  // so existing menus keep the exact legacy markup.
  /** Short line under the label (dropdowns and mega menus). */
  description?: string;
  /** Small pill after the label, e.g. "New" or "Sale". */
  badge?: string;
  /** Show `icon` beside the label everywhere (legacy only drew it on mega group headings). */
  showIcon?: boolean;
  /** Where the item shows: everywhere (default), desktop menu only, or phone menu only. */
  device?: "all" | "desktop" | "mobile";
  /** Top-level dropdown / mega menu opens on hover (default) or only on click. */
  openOn?: "hover" | "click";
  /** Mega menu extras (featured card). Implies megaMenu. */
  mega?: NavMegaConfig;
  /** Auto lists: hand-picked record ids for childSource (in this order). Empty/unset = latest. */
  childIds?: string[];
  // Mega builder (menus P4): on a mega menu's second-level items (its columns).
  /** Drawn as a column even with no links yet (an image or heading only, or an auto list that came back empty). */
  megaColumn?: true;
  /** Column width: 2 = twice as wide as the others on desktop. Unset = 1. */
  megaSpan?: 2;
  /** Image at the top of the column (from the site's media library). */
  megaImage?: string;
  /** Set by the Menu Studio editor when the item needs the studio renderer
   *  for something legacy can't draw (third level under a plain dropdown). */
  studio?: true;

  // ── Menu engine (menus P1, Nov 2026) ─────────────────────────────────────
  // All optional. Absent on every menu saved before P1, which therefore
  // renders exactly as before.
  /** What the link points at. With `ref` set, the live URL is looked up at
   *  render time (modules/navigation/menu-refs), so renaming a page, product
   *  or category never breaks the menu; `url` stays as the last known URL
   *  and the fallback when the record is gone. "custom" / unset = `url` as typed. */
  kind?: NavLinkKind;
  /** Record id for `kind` (pages.id, products.id, service_items.id, service_groups.id, categories.id). */
  ref?: string;
  /** Who sees the item: everyone (unset), visitors who are not signed in, or signed-in customers. Hidden in the browser. */
  audience?: NavAudience;
  /** Label per language code (e.g. { bn: "...", ar: "..." }). Pages in that language show it; others fall back to `label`. */
  labels?: Record<string, string>;
};

/** Menu item link kinds (menus P1). */
export type NavLinkKind = "custom" | "page" | "post" | "product" | "service" | "service_group" | "category";
export type NavAudience = "guests" | "members";

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
    /** Show data.text as a wordmark beside an image logo (emblem-only logos). */
    showName?: boolean;
    /** Shown when there is no uploaded logo at all (neither an override nor
     *  a tenant logo) — same BrandLogo coded-SVG fallback nav already uses. */
    text?: string;
    /** Text colour of that fallback wordmark. Unset keeps its dark default. */
    textColor?: string;
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
    /** Not drawn (the menu has no separate active colour); kept for saved blocks. */
    activeColor?: string;
    /** Menu text (desktop), same settings as the Menu Bar block; unset = the design's own. */
    menuUppercase?: boolean;
    menuFontSize?: number;
    menuFontWeight?: number;
    menuGap?: number;

    // ── Menu block (menus P2, Nov 2026) ───────────────────────────────────
    // The page builder's "Menu" block is this block. All optional and absent
    // on every block saved before P2, which therefore renders exactly as
    // before (the legacy links + hamburger markup above).
    /** Saved menu (nav_menus.id) to show. Wins over menuLocation; a deleted menu falls back to `items`. */
    menuId?: string;
    /** Set = the new menu renderer (components/blocks/navigation/menu-renderer)
     *  with this layout; unset = the legacy header links look. */
    layout?: import("@/modules/navigation/menu-style").MenuLayout;
    /** Look of the menu (preset + overrides). Only read when `layout` is set. */
    menuStyle?: import("@/modules/navigation/menu-style").MenuStyle;
    /** Where the menu sits in its row / column. Default start. */
    align?: "start" | "center" | "end";
    /** vertical / inline: how many levels to show (1-3). */
    levels?: number;
    /** bar: what phones get. Default "drawer" (a menu button); "same" keeps the bar. */
    phoneLayout?: "drawer" | "same";
    /** drawer: text beside the menu icon (unset = icon only). */
    buttonLabel?: string;
    /** Accessible name of the menu ("Main menu", "Services"). */
    label?: string;
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
  data: import("@/modules/page-builder/ui-text").UiTextData<"header_cart"> & {
    /** Icon-only vs icon+"Cart" label. */
    showLabel?: boolean;
  };
};

/** Search box with live suggestions; used in the header builder and on pages. */
export type SearchBlockProps = BlockBase & {
  type: "search";
  data: {
    /** What it searches, in display order. Unset = default for the site's modules. */
    types?: ("product" | "category" | "post" | "page")[];
    /** Suggestions shown while typing (default 5). */
    limit?: number;
    placeholder?: string;
    buttonLabel?: string;
    showButton?: boolean;
    style?: "pill" | "boxed" | "plain";
    align?: "left" | "center" | "right";
    maxWidth?: number;
    /** Page use: optional heading and text above the box. */
    title?: string;
    subtitle?: string;
  };
};

export type HeaderAccountBlockProps = BlockBase & {
  type: "header_account";
  data: import("@/modules/page-builder/ui-text").UiTextData<"header_account"> & {
    showLabel?: boolean;
  };
};

export type TextBlockProps = BlockBase & {
  type: "text";
  data: {
    content: string; // rich text HTML
    alignment: BlockAlignment;
    columns: 1 | 2 | 3 | 4;
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
  imageFocus?: import("@/lib/image-focus").ImageFocus;
  icon?: string;
  iconType?: "lucide" | "image" | "emoji";
  imageUrl?: string;
  title: string;
  description: string;
  link?: string;
  linkLabel?: string;
  /** Bento / Photo Cards: small label above the title. */
  kicker?: string;
  /** Detail rows under the description, e.g. Client / Type / Year (projects). */
  meta?: Array<{ label: string; value: string }>;
  /** Filter tab this item belongs to (e.g. Ongoing, Completed). */
  category?: string;
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
    /** Category filter tabs (All + each item category used). */
    showFilter?: boolean;
    /** Filter tabs: text of the first tab. Empty = "All". */
    filterAllLabel?: string;
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
    /** Paragraph under the title (the subtitle shows as the small line above it). */
    intro?: string;
    /** Default grid: fixed photo height in px (default 4:3 photos). */
    imageHeight?: number;
    /** Default grid: "split" puts the eyebrow pill + title on the left and the intro on the right. */
    headingLayout?: "center" | "split";
    /** Split heading: check-mark points shown on the right (below the intro on mobile). */
    headingPoints?: { id: string; text: string }[];
    /** Default grid: colour of the solid "View details" buttons. Unset = brand colour. */
    linkColor?: string;
    /** Default grid: a WhatsApp button on every card next to its link. {title} in the message = card title. */
    whatsappButton?: { number: string; label?: string; message?: string; color?: string };
    /** Card text alignment (default grid / image-cards-dark). Unset = the design's own. */
    itemAlign?: "left" | "center";
    /** Item link drawn as a text link (default) or a solid brand button. */
    linkStyle?: "link" | "solid";
    /** Image Cards Dark: drop the brand-colour fade over the photos. */
    noImageFade?: boolean;
    /** Image Cards Dark: caption panel colour, "dark" = near-black panel with light text. */
    captionTone?: "dark";
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
    /** Text of every card's link. Empty = "Learn More". */
    linkLabel?: string;
    /** Shown when there are no cards (e.g. an empty group). Empty = "No items to show yet." */
    emptyText?: string;
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
    /** Text of each post's link. Empty = "Read More". */
    readMoreLabel?: string;
    /** Shown when no post is published yet. Empty = "No posts published yet." */
    emptyText?: string;
  };
};

export type GalleryBlockProps = BlockBase & {
  type: "gallery";
  data: {
    title?: string;
    eyebrow?: string;
    subtitle?: string;
    /** Button under the images, e.g. "See all processed visas". */
    link?: { label?: string; url?: string };
    layout: "grid" | "masonry" | "carousel" | "justified";
    /** 1 = wide single column: every image full width at its natural shape, never cropped. */
    columns: 1 | 2 | 3 | 4 | 5 | 6;
    gap: "none" | "sm" | "md" | "lg";
    images: Array<{ id: string; url: string; imageFocus?: import("@/lib/image-focus").ImageFocus; alt?: string; caption?: string; /** Filter tab this photo belongs to. */ category?: string; /** Small line under the caption, e.g. "Work visa · 1 Jun 2026". */ note?: string }>;
    /** Photos come from a collection (Dashboard > Collections). */
    collection?: CollectionBinding;
    /** "portfolio": images come live from a Portfolio group (Dashboard >
     *  Portfolio), latest first, with the item's country as its category. */
    source?: "manual" | "portfolio";
    portfolioGroupId?: string;
    /** Show this many first, with a Load more button for the rest. 0 / unset = all. */
    limit?: number;
    loadMoreLabel?: string;
    /** Show category filter tabs (All + each category used). */
    showFilter?: boolean;
    /** Filter tabs: text of the first tab. Empty = "All". */
    filterAllLabel?: string;
    /** Shown when there are no photos (e.g. an empty portfolio group). Empty = "No images added yet". */
    emptyText?: string;
    lightbox: boolean;
  };
};

/** CTA button; bgColor/textColor override the design's colours (e.g. WhatsApp green). */
export type CTAButton = { label: string; url: string; bgColor?: string; textColor?: string };

export type CTABlockProps = BlockBase & {
  type: "cta";
  data: {
    title: string;
    description?: string;
    primaryButton?: CTAButton;
    secondaryButton?: CTAButton;
    /** Optional third button, styled like the secondary one. */
    tertiaryButton?: CTAButton;
    /** Book button next to the main button; fills the second button slot. */
    showBooking?: boolean;
    bookingLabel?: string;
    bookingUrl?: string;
    layout: "centered" | "left" | "split";
    /** Visit + Map: small label above the title. */
    eyebrow?: string;
    /** Visit + Map: overrides for the site's contact details (empty = use them). */
    address?: string;
    phone?: string;
    hours?: string;
    /** Visit + Map: what to show on the map; defaults to the address. Words
     *  (a business name, an address) or a Google Maps link / embed URL (the
     *  Map location control saves a keyless embed URL here). */
    mapQuery?: string;
    /** Visit + Map: set by the Map location control next to mapQuery (which is what renders). */
    mapLocation?: import("@/lib/maps/location").MapLocation;
    /** Visit + Map: WhatsApp message the first button opens with when it has no link. Empty = "Hi, I would like to know more." */
    whatsappText?: string;
    showMap?: boolean;
    colors?: { dark?: string; accent?: string };
    /** Boutique Banner: copy centred (default) or pinned to the top of the photo. */
    contentPosition?: "center" | "top";
    /** Text colour: light or dark. Boutique Banner: light (default) for photos.
     *  Coloured banners (gradient/navy/orange): light unless "dark". Default
     *  design: picked from the background colour when unset. */
    tone?: "light" | "dark";
    /** Boutique Banner: brand-colour button (default) or light grey pill. */
    buttonStyle?: "brand" | "light" | "call-pill";
    /** Boutique Banner: content inside a rounded glass box; pill eyebrow, bold title. */
    glassBox?: boolean;
    /** Boutique Banner call pill: small line above the button text (e.g. TAP TO CALL). */
    buttonKicker?: string;
    /** Boutique Banner: justify the description text. */
    justify?: boolean;
    /** Boutique Banner: logo / emblem above the title (e.g. a house brand). */
    logoUrl?: string;
    logoHeight?: number;
    /** Pro Band: a command shown under the buttons with a copy button. */
    command?: string;
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
    /** Group source: visitors can post a star rating + review into the group (form + score summary above the cards). */
    reviewForm?: {
      enabled?: boolean; autoPublish?: boolean; title?: string; text?: string; buttonLabel?: string; ctaLabel?: string; ctaUrl?: string;
      /** Wording overrides; each empty = the built-in English text. */
      promptText?: string; namePlaceholder?: string; placePlaceholder?: string; textPlaceholder?: string;
      photosText?: string; thanksText?: string; pendingText?: string;
      /** Score card line; {count} = number of reviews. Empty = "{count} customer reviews". */
      countLabel?: string;
    };
    /** Default design: shown when there are no reviews. Empty = "No testimonials added yet." */
    emptyText?: string;
    /** Filled on the server: score over every published review in the group. */
    _stats?: { avg: number; count: number };
    /** Show this many first, with a "Load more" button that reveals the
     *  next batch in place (no reload). 0 / unset: show all. */
    initialCount?: number;
    loadMoreLabel?: string;
    items: Array<{
      id: string;
      name: string;
      role?: string;
      company?: string;
      avatar?: string;
      /** Photos of the work, added by the reviewer (up to 5). */
      photos?: string[];
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
    /** Google rating summary card (every design). Values are typed in by the
     *  editor from their Google profile; nothing is fetched or invented. */
    ratingSummary?: { enabled?: boolean; value?: number; count?: string; url?: string; label?: string; position?: "top" | "bottom";
      /** Line under the stars; {count} = the review count. Empty = "Based on {count} reviews". */
      countLabel?: string };
    /** Summary card above the reviews: stars, a typed headline/line and a button. Nothing is calculated. */
    summaryCard?: { enabled?: boolean; stars?: boolean; title?: string; text?: string; buttonLabel?: string; buttonUrl?: string };
    /** Formal Cards: "center" = eyebrow pill, centred title and subtitle line. */
    headingAlign?: "left" | "center";
    eyebrow?: string;
  };
};

export type EcommerceProductsBlockProps = BlockBase & {
  type: "ecommerce_products";
  data: import("@/modules/page-builder/ui-text").UiTextData<"ecommerce_products"> & {
    title?: string;
    subtitle?: string;
    displayCount: number;
    layout: "grid" | "list" | "featured" | "minimal" | "wide-cards" | "carousel";
    columns: 2 | 3 | 4 | 5;
    /** Wide cards: columns on desktop. Unset = 2. */
    wideCols?: 2 | 3;
    /** @deprecated single-category selection — use categoryIds */
    categoryId?: string;
    /** Show only products in these categories. Empty/undefined = all categories. */
    categoryIds?: string[];
    sortBy: "latest" | "price_asc" | "price_desc" | "featured";
    showAddToCart: boolean;
    /** Size/colour chips on product cards. Unset = shown (original behaviour). */
    showVariantPicker?: boolean;
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
    /** Category tiles: shown name per category id (e.g. on a translated page). Default: the category's own name. */
    categoryNames?: Record<string, string>;
    /** Category tiles (showAs "categories"). Unset = the original portrait
     *  photo tile with a Shop now button. */
    tileShape?: "classic" | "circle" | "rounded" | "square";
    /** Corner radius in px for the "rounded" shape. */
    tileRadius?: number;
    /** Columns per screen size (phone < 768px, tablet < 1024px). */
    colsMobile?: number;
    colsTablet?: number;
    colsDesktop?: number;
    /** Phones: one swipeable row instead of a grid. */
    mobileScroll?: boolean;
    tileGap?: number;
    /** Largest image width in px, so tiles stay small on wide screens. */
    tileMaxWidth?: number;
    imageFit?: "cover" | "contain";
    /** Inner padding around the image (px), useful with "contain". */
    imagePadding?: number;
    tileBg?: string;
    tileBorderColor?: string;
    tileHover?: "zoom" | "lift" | "none";
    labelSize?: number;
    labelWeight?: 400 | 500 | 600 | 700 | 800;
    labelCase?: "none" | "upper" | "capitalize";
    labelColor?: string;
    /** Product count under the name. */
    showCount?: boolean;
  };
};

export type AccountingFeedBlockProps = BlockBase & {
  type: "accounting_feed";
  data: import("@/modules/page-builder/ui-text").UiTextData<"accounting_feed"> & {
    title?: string;
    displayCount: number;
    transactionType?: "all" | "donation" | "sale" | "expense";
    showAmount: boolean;
    showDate: boolean;
    showMessage: boolean;
    layout: "list" | "ticker" | "cards";
  };
};

/** The site's social profiles (Business Profile > Social Media), as icons. */
export type SocialLinksBlockProps = BlockBase & {
  type: "social_links";
  data: {
    title?: string;
    align?: "left" | "center" | "right";
    size?: "sm" | "md" | "lg";
    /** Default true: each icon in its network's colour. */
    brandColors?: boolean;
    showLabels?: boolean;
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
  imageFocus?: import("@/lib/image-focus").ImageFocus;
  name: string;
  role?: string;
  bio?: string;
  avatar?: string;
  email?: string;
  /** Direct number, shown under the role as a tap-to-call link. */
  phone?: string;
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
    /** Photo tiles: whole photo inside a padded frame (no crop/zoom), name below. */
    framedPhotos?: boolean;
    /** Members come from a collection (Dashboard > Collections). */
    collection?: CollectionBinding;
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
    /** Split Heading: photo under the heading in the left column. */
    sideImage?: string;
    sideImageAlt?: string;
  };
};

export type PricingPlan = {
  id: string;
  name: string;
  price: string;
  priceUsdCents?: number;
  /** Fixed Bangladesh (taka) price for the regional plan; shown instead of a
   *  rate conversion when the block uses display currencies. */
  priceBdt?: number;
  /** Display currencies: crossed-out former price in USD cents / taka. */
  oldPriceUsdCents?: number;
  oldPriceBdt?: number;
  /** Price from the catalog (/super-admin/plans): the fields above become the
   *  fallback. `partner`: the partner price, with retail crossed out. */
  catalog?: { plan: string; partner?: boolean };
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
    /** Marketing price tables: a currency picker that shows the USD price in
     *  the visitor's money (lib/currency/display.ts); taka (priceBdt) only on
     *  Bangla / Bangladesh pages or for visitors in Bangladesh. */
    displayCurrencies?: boolean;
    /** With displayCurrencies: this is a Bangla / Bangladesh page, taka first. */
    bdtDefault?: boolean;
    /** Language of the picker's labels. */
    language?: "en" | "bn";
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
  imageFocus?: import("@/lib/image-focus").ImageFocus;
  icon?: string;
  title: string;
  description: string;
  imageUrl?: string;
  /** Image + Stats: small label under the big value (title). */
  label?: string;
  /** Optional button under this item's text. */
  buttonLabel?: string;
  buttonUrl?: string;
  /** Pro Bento: columns this tile spans (of 3). Unset = 2 with a picture, else 1. */
  span?: "1" | "2" | "3";
};

export type FeaturesBlockProps = BlockBase & {
  type: "features";
  data: {
    /** Overview + Quote: lucide icon name shown on a round accent badge beside the heading. */
    icon?: string;
    title?: string;
    subtitle?: string;
    /** Body paragraph — currently only rendered by the "dark" templateVariant. */
    description?: string;
    layout: "grid" | "alternating" | "icon-list" | "centered";
    columns: 2 | 3 | 4;
    items: FeatureItem[];
    style: "minimal" | "card" | "gradient";
    /** alternating-media: show each image whole (no crop) at its natural height — for documents, certificates, tall photos. */
    fullImage?: boolean;
    /** Alternating rows: the first row puts its image on the right (then alternates). */
    imageRightFirst?: boolean;
    /** Showcase variants: small label above the title. */
    eyebrow?: string;
    /** Overview + Quote Card: chips under the text. */
    tags?: string[];
    /** Overview + Quote Card: the sticky side card. */
    card?: { imageUrl?: string; imageFocus?: import("@/lib/image-focus").ImageFocus; title?: string; text?: string; buttonLabel?: string; buttonUrl?: string; whatsapp?: boolean; whatsappText?: string };
    /** Numbered Grid: dark band or light bordered grid. */
    tone?: "dark" | "light";
    /** Image + Stats: photo and the badge floating on it. */
    imageUrl?: string;
    badge?: { title?: string; text?: string };
    /** Image + Stats: focal point of the photo. */
    imageFocus?: import("@/lib/image-focus").ImageFocus;
    /** Image + Stats: badge floats over the photo (default) or sits on its bottom edge. */
    badgePosition?: "overlay" | "bottom-edge";
    buttons?: { id: string; label: string; url: string; style?: "solid" | "outline" | "accent" }[];
    colors?: { dark?: string; accent?: string };
    /** Numbered Grid: each tile's icon instead of 01, 02... */
    showIcons?: boolean;
    /** Text + Tiles: soft grey tiles (default) or white bordered cards with a tinted icon square. */
    tileStyle?: "soft" | "bordered";
    /** Text + Tiles: plain text after the bold tags under the buttons. */
    footnote?: string;
    /** Text + Tiles: words inside the title drawn in highlightColor; titleColor for the rest. */
    titleHighlight?: string;
    highlightColor?: string;
    titleColor?: string;
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
    /** Dark Band background (blank = theme primary). Use when the primary is a bright brand colour. */
    bandColor?: string;
    /** Nov 2026: draw the title/subtitle in every design and the items' prefix/suffix fields.
     *  Set on new blocks and on the first edit in the builder; saved blocks without it render as before. */
    showAllText?: boolean;
  };
};

/** One field of a contact / lead form. */
export type ContactFormField = {
  id: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkboxes" | "file" | "date";
  required: boolean;
  options?: string[];
  /** Pre-filled value (e.g. the service on a service page). */
  defaultValue?: string;
};

/** Inline enquiry form embedded in a hero / slider. Submits through
 *  /api/contact/submit like the Contact block (inbox, email, CRM). */
export type InlineLeadFormData = {
  enabled: boolean;
  title?: string;
  subtitle?: string;
  fields: ContactFormField[];
  submitLabel?: string;
  successMessage?: string;
  recipientEmail?: string;
};

export type ContactBlockProps = BlockBase & {
  type: "contact";
  data: import("@/modules/page-builder/ui-text").UiTextData<"contact"> & {
    title?: string;
    subtitle?: string;
    layout: "left" | "centered" | "split";
    /** "filled": grey filled inputs with placeholders, no card frame. */
    formStyle?: "card" | "filled";
    showMap: boolean;
    /** What the map shows: an embed URL (the Map location control writes a
     *  keyless one), or any Google Maps link / share link / <iframe> code
     *  pasted elsewhere (src/lib/maps/embed.ts mapEmbedSrc). Empty: the map
     *  searches the address. */
    mapEmbedUrl?: string;
    /** Set by the Map location control next to mapEmbedUrl (which is what renders). */
    mapLocation?: import("@/lib/maps/location").MapLocation;
    /** Map height in px. Unset: each layout's own size. */
    mapHeight?: number;
    /** Details + map only, no form. */
    hideForm?: boolean;
    /** checkboxes = pick several of `options`; file = upload (PDF, Word, image; 10 MB), owner-only link. */
    fields: ContactFormField[];
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
    /** After the enquiry is saved, also open WhatsApp with the answers
     *  prefilled (the lead is stored first). number: digits with country
     *  code; empty uses the block's / site's WhatsApp. Off unless enabled. */
    whatsappAfterSubmit?: { enabled?: boolean; number?: string; intro?: string };
    /** Taller form fields (48px) with 16px text, easier on phones. */
    largeInputs?: boolean;
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
    /** "centered": centred heading over a one-row form (no card). Saved on some
     *  pages long before it was offered; the renderer draws it for any value
     *  other than inline/stacked/card. */
    layout: "inline" | "stacked" | "card" | "centered";
    successMessage: string;
    provider?: "mailchimp" | "custom";
    webhookUrl?: string;
    /** "underline": line field with a light pill button inside (shop footers). */
    fieldStyle?: "box" | "underline";
    /** Platform list (root site only): "oss-release" = "tell me when the
     *  open-source code is out" (api/open-source/notify) instead of the site's
     *  CRM list. Set by seed scripts, not offered in the editor. */
    list?: "oss-release";
    /** Language of a platform-list sign-up; defaults to the page's /bn/ path. */
    lang?: "en" | "bn";
    /** Shown when sending fails (defaults to English). */
    errorMessage?: string;
  };
};

/** Passive Coder's own packages and Care plans, read live from the pricing
 *  catalog (plans + care_plans). Meant for the platform's root site. */
export type PricingCatalogBlockProps = BlockBase & {
  type: "pricing_catalog";
  data: {
    /** platform = Platform-only plans (client builds it), monthly or yearly. */
    mode: "packages" | "care" | "both" | "platform";
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    language: "en" | "bn" | "ar";
    defaultCurrency: "USD" | "BDT";
    /** Country pages: fix the price list to this country (ISO code, e.g.
     *  "SG"). Empty = the visitor's country (cookie, then geo, then USD). */
    country?: string;
    /** Kept for old pages; the per-country price list replaced the chip row. */
    showCurrencyToggle: boolean;
    showBdPrompt: boolean;
    bdPromptUrl?: string;
    careLinkUrl?: string;
    tone: "dark" | "light";
    ctaBaseUrl?: string;
    /** Optional wording for the Pro and Biz features line. Empty = the standard line. */
    crmLine?: string;
    /** Optional wording for the Biz-only line. Empty = the standard line. */
    bizLine?: string;
    /** Optional wording; each empty = the built-in text of the block's language. */
    popularLabel?: string;
    oneTimeLabel?: string;
    perMonthLabel?: string;
    monthlyLabel?: string;
    yearlyLabel?: string;
    billedMonthlyText?: string;
    careTitle?: string;
    careText?: string;
    compareLabel?: string;
    bdTitle?: string;
    bdText?: string;
    bdButtonLabel?: string;
    /** The three cards under the packages (pay once / platform / care). */
    infoCards?: { title?: string; text?: string }[];
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
    /** Nov 2026: draw the title above the clock. Set on new blocks and on the first edit; saved blocks without it render as before. */
    showAllText?: boolean;
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
    /** Dark Cards / Split Media: word before each step number. Empty = "Step". */
    stepLabel?: string;
  };
};

export type IconGridItem = { id: string; icon: string; label: string; description?: string; url?: string; color?: string; /** Image shown instead of the icon (logo, badge). */ imageUrl?: string;
  /** Colored Tiles: this tile's background (the icon badge keeps `color`). */
  tileColor?: string;
  /** Outlined Cards: small photo on the card's left edge, full card height. */
  thumbUrl?: string };

/**
 * Cards: the one block for card grids (Services, Why Choose Us, Icon Grid and
 * Item Box layouts). `family` is the original block whose component draws the
 * chosen layout; data is that family's data plus canonical item fields. See
 * lib/blocks/cards.ts.
 */
export type CardsBlockProps = BlockBase & {
  type: "cards";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: { family?: "services" | "features" | "icon_grid" | "item_box"; title?: string; subtitle?: string; items: any[]; [key: string]: any };
};

export type IconGridBlockProps = BlockBase & {
  type: "icon_grid";
  data: {
    title?: string;
    subtitle?: string;
    columns: 2 | 3 | 4 | 5 | 6;
    items: IconGridItem[];
    style: "plain" | "card" | "colored";
    iconSize: "sm" | "md" | "lg";
    /** Bordered Matrix / Minimal Inline: show each item's description (off when unset). */
    showDescriptions?: boolean;
    /** Item images (logos, badges) at this size in px instead of icon size. */
    imageSize?: number;
    /** Grouped list: hide the number of names beside each group title. */
    hideCount?: boolean;
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
    /** Section heading (used by the gallery / playlist variants). */
    title?: string;
    subtitle?: string;
    /** Several videos: the "gallery" and "playlist" variants show these. */
    videos?: Array<{ id: string; url: string; title?: string }>;
    galleryColumns?: 2 | 3 | 4;
  };
};

export type FooterColumnLink = {
  id: string;
  label: string;
  url: string;
  /** Language switch, same as NavItem.lang. */
  lang?: string;
};

export type FooterColumn = {
  id: string;
  heading: string;
  links: FooterColumnLink[];
  /** Plain text under the heading (address, phone, hours), line breaks kept. */
  text?: string;
  /** Menus P2: show this saved menu (nav_menus.id) instead of `links`. Unset =
   *  the typed links, exactly as before. A deleted menu falls back to `links`. */
  menuId?: string;
  /** How deep the menu goes in this column (1 or 2). Default 1. */
  menuLevels?: number;
  /** Filled at render time from `menuId` (never saved). */
  menuItems?: NavItem[];
};

export type FooterSocial = {
  platform: "facebook" | "instagram" | "twitter" | "linkedin" | "youtube" | "tiktok" | "whatsapp" | "snapchat" | "github";
  url: string;
};

export type FooterBlockProps = BlockBase & {
  type: "footer";
  data: import("@/modules/page-builder/ui-text").UiTextData<"footer"> & {
    /** Oversized brand name across the very bottom of the footer. */
    wordmark?: boolean;
    /** Small icon image shown before the text logo when no logo image is set. */
    logoIconUrl?: string;
    logo?: string;
    logoText?: string;
    /** Where the logo links; default "/". A language version's footer sets its home, e.g. "/en". */
    logoUrl?: string;
    tagline?: string;
    columns: FooterColumn[];
    socials?: FooterSocial[];
    copyrightText?: string;
    copyrightYear?: boolean;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    showNewsletter?: boolean;
    /** Phones: link rows and social icons at least 44px tall. */
    largeTapTargets?: boolean;
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
    /** Heading over the social icons (Retail: its own column; Classic: under the tagline). */
    followTitle?: string;
    /** Social icons in each network's brand colour on white chips (off: accent colour). */
    socialBrandColors?: boolean;
    /** Show the site's social links (Business Profile > Social Media) instead of `socials`;
     *  `socials` stays as the fallback while the central list is empty or unavailable. */
    showSocials?: boolean;
    /** Retail: accepted-payments strip (image) beside the copyright. */
    paymentImage?: string;
    /** Experts listing badge (dashboard > Business profile > Experts toggle): links to the profile. */
    expertsBadge?: { src: string; href: string; alt: string };
    /** Retail: short line at the end of the bottom row. */
    bottomNote?: string;
    /** Dark footer: show the site's light logo (Identity > logo for dark
     *  backgrounds) in place of the normal logo. */
    autoLightLogo?: boolean;
    /** White rounded backing behind the logo, for a dark logo on a dark footer. */
    logoPlate?: boolean;
    /** Logo height in px. Unset = the standard size (80px). */
    logoHeight?: number;
    /** "Powered by" credit: hide it or change text/link. Honoured only on
     *  Pro/Biz/Custom (or white-label) sites; others always show the default. */
    credit?: import("@/lib/site/footer-credit-shared").FooterCredit;
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
    eyebrow?: string;
    columns?: 2 | 3 | 4;
    groupByRegion?: boolean;
    /** "chips": one panel per region with countries as small link chips (compact, homepage-friendly). */
    display?: "cards" | "chips";
    /** Extra text per region panel, matched by name. */
    regions?: { name: string; badge?: string; description?: string }[];
    allLink?: { label?: string; url?: string };
    accentColor?: string;
    items: CountryGridItem[];
    /** Text of each card's link. Empty = "View details". */
    linkLabel?: string;
    /** Heading for countries without a region. Empty = "Other". */
    otherRegionLabel?: string;
  };
};

export type EligibilityDestination = {
  id: string;
  label: string;
  value: string;
};

export type EligibilityCheckerBlockProps = BlockBase & {
  type: "eligibility_checker";
  data: import("@/modules/page-builder/ui-text").UiTextData<"eligibility_checker"> & {
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
  data: import("@/modules/page-builder/ui-text").UiTextData<"status_tracker"> & {
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
  | CardsBlockProps
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
  | SocialLinksBlockProps
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
  | PricingCatalogBlockProps
  | StepsBlockProps
  | IconGridBlockProps
  | VideoBlockProps
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
  | ResultsSearchBlockProps
  | TableBlockProps
  | CodeBlockProps
  | MediaTabsBlockProps
  | SectionNavBlockProps
  | ResultsCoursesBlockProps
  | ResultsAlumniBlockProps
  | DonorGroupCardsBlockProps
  | DonorListBlockProps
  | DonorMapBlockProps
  | DonorRequestsBlockProps
  | ContainerBlockProps
  | ItemBoxBlockProps
  | ScrollStoryBlockProps
  | MarqueeBlockProps
  | OptionPreviewBlockProps
  | BottomBarBlockProps
  | HeaderLogoBlockProps
  | HeaderNavBlockProps
  | HeaderCtaBlockProps
  | HeaderBookingBlockProps
  | HeaderCartBlockProps
  | HeaderAccountBlockProps
  | SearchBlockProps;

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
  data: import("@/modules/page-builder/ui-text").UiTextData<"donor_group_cards"> & {
    title?: string;
    subtitle?: string;
    accentColor?: string;      // card accent (blood red default)
    linkTarget?: string;       // where cards send the filter, default "#donor-list"
  };
};

export type DonorRequestsBlockProps = BlockBase & {
  type: "donor_requests";
  data: import("@/modules/page-builder/ui-text").UiTextData<"donor_requests"> & {
    title?: string;
    subtitle?: string;
  };
};

export type DonorMapBlockProps = BlockBase & {
  type: "donor_map";
  data: import("@/modules/page-builder/ui-text").UiTextData<"donor_map"> & {
    title?: string;
    subtitle?: string;
    height: number;
  };
};

export type DonorListBlockProps = BlockBase & {
  type: "donor_list";
  data: import("@/modules/page-builder/ui-text").UiTextData<"donor_list"> & {
    title?: string;
    accentColor?: string;
    showAddButton: boolean;
    addButtonLabel: string;
    showFilters: boolean;
  };
};

export type BookingBlockProps = BlockBase & {
  type: "booking";
  data: import("@/modules/page-builder/ui-text").UiTextData<"booking"> & {
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
  data: import("@/modules/page-builder/ui-text").UiTextData<"marketplace_booking"> & {
    title?: string;
    subtitle?: string;
    accentColor?: string;
    submitLabel: string;
  };
};

export type MarketplaceRequestBlockProps = BlockBase & {
  type: "marketplace_request";
  data: import("@/modules/page-builder/ui-text").UiTextData<"marketplace_request"> & {
    title?: string;
    subtitle?: string;
    accentColor?: string;
    submitLabel: string;
  };
};

export type MarketplaceVendorDirectoryBlockProps = BlockBase & {
  type: "marketplace_vendor_directory";
  data: import("@/modules/page-builder/ui-text").UiTextData<"marketplace_vendor_directory"> & {
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
  data: import("@/modules/page-builder/ui-text").UiTextData<"re_search"> & {
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
  data: import("@/modules/page-builder/ui-text").UiTextData<"re_listings"> & { cardStyle?: "standard" | "editorial" | "showcase"; accentColor?: string; /** Square-bullet label above a rule; switches the heading to the editorial style. */ eyebrow?: string;
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
  data: import("@/modules/page-builder/ui-text").UiTextData<"re_communities"> & { /** Square-bullet label above a rule; switches the heading to the editorial style. */ eyebrow?: string; title?: string; subtitle?: string; featuredOnly?: boolean; limit?: number; country?: string };
};

export type ReDevelopersBlockProps = BlockBase & {
  type: "re_developers";
  data: import("@/modules/page-builder/ui-text").UiTextData<"re_developers"> & { /** Square-bullet label above a rule; switches the heading to the editorial style. */ eyebrow?: string; title?: string; subtitle?: string; style?: "logos" | "cards" };
};

export type ReCalculatorBlockProps = BlockBase & {
  type: "re_calculator";
  data: import("@/modules/page-builder/ui-text").UiTextData<"re_calculator"> & { /** Square-bullet label above a rule; switches the heading to the editorial style. */ eyebrow?: string;
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
  data: import("@/modules/page-builder/ui-text").UiTextData<"re_lead_form"> & {
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

// ─── Code / terminal block ───────────────────────────────────────────────────
export type CodeTab = {
  id: string;
  /** Tab name, e.g. "Docker" or ".env". */
  label: string;
  /** "terminal": lines starting with "$ " are commands (the prompt is drawn,
   *  only commands are copied), other lines are output. "code": a file, copied whole. */
  kind: "terminal" | "code";
  code: string;
};
export type CodeBlockProps = BlockBase & {
  type: "code";
  data: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** "split": heading and steps beside the window. "stacked": heading above it. */
    layout: "split" | "stacked";
    /** Numbered steps listed beside (or above) the window. */
    steps?: { id: string; title: string; description?: string }[];
    tabs: CodeTab[];
    primaryButton?: { label: string; url: string };
    secondaryButton?: { label: string; url: string };
    /** Small line under the window. */
    note?: string;
    copyLabel?: string;
    copiedLabel?: string;
  };
};

// ─── Screenshot tabs block ───────────────────────────────────────────────────
export type MediaTabItem = {
  id: string;
  icon?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Address shown in the window bar, e.g. "yoursite.com/dashboard". */
  frameUrl?: string;
};
export type MediaTabsBlockProps = BlockBase & {
  type: "media_tabs";
  data: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** "side": the list beside the picture. "top": tabs in a row above it. */
    layout: "side" | "top";
    /** Side layout: which side the picture is on. */
    mediaSide?: "right" | "left";
    /** Width divided by height of the pictures (all the same), e.g. 1.6. */
    imageRatio?: number;
    items: MediaTabItem[];
    primaryButton?: { label: string; url: string };
  };
};

// ─── Section links block ─────────────────────────────────────────────────────
export type SectionNavBlockProps = BlockBase & {
  type: "section_nav";
  data: {
    /** Small label before the links, e.g. "On this page". */
    label?: string;
    items: { id: string; label: string; anchor: string }[];
    /** Stays at the top of the screen while the page scrolls. */
    sticky: boolean;
    /** Sticky: distance from the top of the screen, px (the height of a sticky site header). */
    topOffset?: number;
    button?: { label: string; url: string };
  };
};

// ─── Table block ─────────────────────────────────────────────────────────────
export type TableBlockProps = BlockBase & {
  type: "table";
  data: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    columns: string[];
    rows: string[][];
    /** First column styled as the row label (bold, sticky when scrolling). */
    firstColumnHeader?: boolean;
    striped?: boolean;
    /** Phones: scroll sideways, or turn each row into a labelled card. */
    mobileLayout?: "scroll" | "cards";
    /** Header background (blank = theme primary). */
    headerColor?: string;
    /** No header row: the column names are not shown (data rows only). */
    hideHeader?: boolean;
    /** "compare": the comparison design (ticks and crosses for yes / no cells,
     *  a highlighted column, column notes and buttons). Unset = the classic table. */
    design?: "default" | "compare";
    /** Comparison: column to highlight, counted from the first column as 0 (0 or unset = none). */
    highlightColumn?: number;
    /** Comparison: small line under each column heading (same order as the columns). */
    columnNotes?: string[];
    /** Comparison: a button under each column (same order as the columns; the first is never drawn). */
    columnButtons?: { label: string; url: string }[];
    /** Comparison: words screen readers hear for a tick and a cross. */
    yesLabel?: string;
    noLabel?: string;
    note?: string;
    /** Rows come from a collection (Dashboard > Collections). */
    collection?: CollectionBinding;
    /** Search box above the table. */
    searchable?: boolean;
    /** Download buttons (CSV, print / PDF). */
    exportable?: boolean;
    /** Rows per page (0 / blank = all). */
    pageSize?: number;
    /** Wording of the search, download and page controls; each empty = the English default. */
    searchPlaceholder?: string;
    /** "of" in "3 of 12" and "1–10 of 40". */
    ofLabel?: string;
    csvLabel?: string;
    printLabel?: string;
    prevLabel?: string;
    nextLabel?: string;
  };
};

// ─── Results module blocks ───────────────────────────────────────────────────
// Data lives in results / results_courses (migration 140); lookups go through
// /api/results/lookup so result rows are never publicly listable.

export type ResultsSearchBlockProps = BlockBase & {
  type: "results_search";
  data: import("@/modules/page-builder/ui-text").UiTextData<"results_search"> & {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** card = centred search card; banner = full-width band with inline form;
     *  split = text + image beside the search card. */
    layout?: "card" | "banner" | "split";
    placeholder?: string;
    buttonLabel?: string;
    backgroundImage?: string;
    sideImage?: string;
    accentColor?: string;
    showPrint?: boolean;
    /** Short trust lines under the form, e.g. "Results since 2008". */
    notes?: string[];
  };
};

export type ResultsCoursesBlockProps = BlockBase & {
  type: "results_courses";
  data: import("@/modules/page-builder/ui-text").UiTextData<"results_courses"> & {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    /** cards = photo cards; list = compact rows with level + duration. */
    style?: "cards" | "list";
    featuredOnly?: boolean;
    limit?: number;
    columns?: 2 | 3 | 4;
    linkLabel?: string;
    accentColor?: string;
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
    /** Small hint at the bottom of the first screen. Empty = "Scroll". */
    scrollLabel?: string;
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

/** Fixed app-style bar along the bottom of the screen (footer builder). */
export type BottomBarAction = "link" | "home" | "shop" | "categories" | "search" | "cart" | "account" | "whatsapp" | "call" | "email";
export type BottomBarItem = {
  id: string;
  /** Lucide icon name. */
  icon: string;
  label: string;
  action: BottomBarAction;
  /** For "link"; optional override for home / shop / account. */
  url?: string;
  /** Prefilled WhatsApp message. */
  text?: string;
  hidden?: boolean;
};
export type BottomBarBlockProps = BlockBase & {
  type: "bottom_bar";
  data: {
    items: BottomBarItem[];
    /** Where the bar shows: phones only (< 768px), phones + tablets (< 1024px), or every screen. */
    display: "mobile" | "tablet" | "all";
    /** flat = full-width strip; floating = rounded pill above the edge. */
    style: "flat" | "floating";
    showLabels: boolean;
    iconSize?: number;
    labelSize?: number;
    height?: number;
    background?: string;
    color?: string;
    activeColor?: string;
    /** Highlighted pill behind the active item. */
    activePill?: boolean;
    badgeBg?: string;
    badgeColor?: string;
    borderTop?: boolean;
    shadow?: boolean;
    /** Frosted glass background. */
    blur?: boolean;
    /** Desktop (>= 1024px, when display = "all"). */
    desktopStyle?: "flat" | "floating";
    desktopMaxWidth?: number;
    desktopShowLabels?: boolean;
    /** Hide the floating WhatsApp / call buttons where the bar is visible
     *  (otherwise they move up above the bar). */
    hideFloatingButtons?: boolean;
    categoriesTitle?: string;
    /** Last tile of the categories sheet (opens the shop). Empty = "All products". */
    allProductsLabel?: string;
    /** Title of the search sheet. Empty = "Search". */
    searchTitle?: string;
    searchPlaceholder?: string;
    /** Live suggestions while typing in the search sheet (default on). */
    searchLive?: boolean;
    /** What the search covers; empty = default for the site's modules. */
    searchTypes?: ("product" | "category" | "post" | "page")[];
    /** How many live suggestions to show (default 5). */
    searchSuggestLimit?: number;
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

export type ResultsAlumniBlockProps = BlockBase & {
  type: "results_alumni";
  data: import("@/modules/page-builder/ui-text").UiTextData<"results_alumni"> & {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    limit?: number;
    columns?: 3 | 4;
    accentColor?: string;
  };
};
