import {
  ServerCog,
  LayoutDashboard,
  FileText,
  BookOpen,
  Image,
  Palette,
  Navigation,
  PanelTop,
  PanelBottom,
  Puzzle,
  Bot,
  BarChart3,
  Settings,
  Users,
  Tag,
  Package,
  ShoppingBag,
  CreditCard,
  Truck,
  DollarSign,
  BookMarked,
  Globe,
  Archive,
  Wrench,
  Sparkles,
  Phone,
  Star,
  FolderOpen,
  Layers,
  SlidersHorizontal,
  DollarSign as PricingIcon,
  Calendar,
  CalendarClock,
  Plus,
  Upload,
  Briefcase,
  ShoppingCart,
  ToggleLeft,
  Droplet,
  Store,
  BadgeCheck,
  ChefHat,
  Wallet,
  AlertTriangle,
  Building2,
  MapPin,
  Landmark,
  Inbox,
  UserCog,
  FolderKanban,
  type LucideIcon, ArrowLeftRight, SearchCheck, AtSign, Megaphone, Receipt, LifeBuoy, Award, GraduationCap, Link2, Languages, Handshake, MessageSquareQuote, MessagesSquare, ShieldBan, Bike, ArrowUpFromLine, Percent } from "lucide-react";

import { flags } from "@/lib/flags";
import { moduleInstalled } from "@/modules/registry/installed";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  /** Highlight only on this exact path (e.g. /dashboard/settings, whose sub-pages are separate menu items). */
  exact?: boolean;
  saasOnly?: boolean;
  standaloneOnly?: boolean;
  /** When set, this item only shows if tenants.enabled_modules[moduleKey] is
   *  truthy (resolved server-side) — see MODULE_KEYS below. Super admins
   *  always bypass this check. */
  moduleKey?: ModuleKey;
  /** Hidden when ALL of these modules are on (e.g. no "Add product" on a
   *  marketplace, where sellers add products). Applied by navSectionsFor(),
   *  to children too. */
  hideWithModules?: ModuleKey[];
  children?: NavItem[];
};

/** Every togglable platform module, keyed the same in plans.modules and
 *  tenants.enabled_modules. Labels shown in the SA plan editor and the
 *  tenant Modules dashboard page. */
export const MODULE_KEYS = [
  "services", "features", "portfolio", "sliders", "testimonials", "pricing", "bookings",
  "ecommerce", "crm", "invoices", "marketing", "jobs", "pos", "inventory", "accounting",
  "visa_tour", "blood_donation", "marketplace", "content_scheduler", "ai_coder", "ai_agent", "real_estate", "results", "restaurant", "collections", "projects",
] as const;
export type ModuleKey = typeof MODULE_KEYS[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  services: "Services",
  features: "Features",
  portfolio: "Portfolio",
  sliders: "Sliders",
  testimonials: "Testimonials",
  pricing: "Pricing",
  bookings: "Bookings",
  ecommerce: "Ecommerce",
  crm: "CRM",
  invoices: "Invoices",
  marketing: "Marketing",
  jobs: "Jobs & Staff",
  pos: "POS",
  inventory: "Inventory",
  accounting: "Accounting",
  visa_tour: "Visa & Tour",
  blood_donation: "Blood Donation",
  marketplace: "Marketplace",
  content_scheduler: "Content Scheduler",
  ai_coder: "AiCoder",
  ai_agent: "AI Agent",
  real_estate: "Real Estate",
  results: "Results & Certificates",
  restaurant: "Restaurant",
  collections: "Collections",
  projects: "Projects",
};

export const MODULE_DESCRIPTIONS: Record<ModuleKey, string> = {
  services: "Manage service listings shown in Services blocks on your site",
  features: "Manage feature/selling-point groups for Features blocks",
  portfolio: "Showcase past work with filterable project galleries",
  sliders: "Rotating image/content sliders for your pages",
  testimonials: "Collect and display customer reviews and quotes",
  pricing: "Pricing tables and package comparisons",
  bookings: "Appointment scheduling with a live availability calendar",
  ecommerce: "Full online store — products, orders, payments, delivery",
  crm: "Track leads, contacts, and customer relationships",
  invoices: "Create and send invoices, track payment status",
  marketing: "Email and campaign tools to reach your customers",
  jobs: "Manage staff, job assignments, and scheduling",
  pos: "Point-of-sale checkout for in-person transactions",
  inventory: "Stock levels and warehouse tracking for products",
  accounting: "Bookkeeping, transactions, and financial reporting",
  visa_tour: "Visa eligibility checkers, country info, and application status tracking",
  blood_donation: "Donor directory, requests, and blood-donation site tools",
  marketplace: "Multi-vendor marketplace — vendors, service catalog, and bookings",
  content_scheduler: "Plan and schedule social content across brands and platforms",
  ai_coder: "AI-assisted page content — generate section copy in the page builder",
  ai_agent: "Floating AI assistant for site management, leads, and page content",
  real_estate: "Property listings, off-plan projects, area guides, developers and property leads",
  results: "Student results and certificates with public lookup, QR verification, printable result cards and courses",
  restaurant: "Turns the shop into a menu: food items, menu sections, kitchen screen, table reservations and branches",
  collections: "Your own content types (packages, projects, team, branches...) with custom fields, shown live by blocks",
  projects: "Projects and jobs with tasks, Kanban, calendar, Gantt, time tracking, field staff links and a client portal",
};

export type NavSection = {
  label: string;
  items: NavItem[];
  /** "tools" renders as the dark business-tools block at the bottom.
   *  "brand" renders as the Passive Coder dark-orange block near the top. */
  variant?: "tools" | "brand";
};

// Reorganised 2026-10-07 by task (what am I trying to do?) instead of by
// feature origin: build the website, serve customers, run the shop or
// restaurant, manage the team, change settings. Every item keeps its exact
// href and moduleKey: resolveModuleKeyForPath() below reads these entries to
// block direct links to modules a plan doesn't include. Module-gated items
// stay top-level in their group (children are not plan-filtered).
export const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      // Dashboard + Analytics merged onto one page (2026-09-14); /dashboard
      // itself just redirects here now (page.tsx).
      { label: "Dashboard", href: "/dashboard/analytics", icon: LayoutDashboard },
      // Connecting an AI assistant (ChatGPT, Claude) is the fastest way to
      // run the whole site, so it sits up here, not buried in Settings.
      { label: "AiCoder", href: "/dashboard/aicoder", icon: Sparkles, moduleKey: "ai_agent" },
      { label: "AI Connect", href: "/dashboard/ai-connect", icon: Bot },
      // Website live chat inbox (all plans; AI answers on Pro/Biz when on).
      { label: "Chat", href: "/dashboard/chat", icon: MessagesSquare },
    ],
  },
  {
    label: "Shop",
    items: [
      {
        label: "Products",
        href: "/dashboard/ecommerce/products",
        icon: Package,
        moduleKey: "ecommerce",
        children: [
          { label: "All Products", href: "/dashboard/ecommerce/products", icon: Package },
          // Marketplace: sellers add products from the Seller Centre (pages redirect too).
          { label: "Add Single", href: "/dashboard/ecommerce/products/new", icon: Plus, hideWithModules: ["marketplace", "ecommerce"] },
          { label: "Add Multiple", href: "/dashboard/ecommerce/products/bulk-upload", icon: Upload, hideWithModules: ["marketplace", "ecommerce"] },
          { label: "Categories", href: "/dashboard/ecommerce/categories", icon: Tag },
          { label: "Product Defaults", href: "/dashboard/ecommerce/product-defaults", icon: Package },
        ],
      },
      { label: "Orders", href: "/dashboard/ecommerce/orders", icon: ShoppingBag, moduleKey: "ecommerce" },
      { label: "Price Requests", href: "/dashboard/ecommerce/price-requests", icon: MessageSquareQuote, moduleKey: "ecommerce" },
      { label: "POS", href: "/dashboard/pos", icon: ShoppingCart, moduleKey: "pos" },
      { label: "Reviews", href: "/dashboard/ecommerce/reviews", icon: Star, moduleKey: "ecommerce" },
      { label: "Inventory", href: "/dashboard/ecommerce/inventory", icon: Package, moduleKey: "inventory" },
      // Vouchers and flash sales come with the marketplace module's code.
      ...(moduleInstalled("marketplace") ? [{ label: "Promotions", href: "/dashboard/ecommerce/promotions", icon: Tag, moduleKey: "ecommerce" } satisfies NavItem] : []),
      { label: "Payments", href: "/dashboard/ecommerce/payments", icon: CreditCard, moduleKey: "ecommerce" },
      { label: "Delivery", href: "/dashboard/ecommerce/delivery", icon: Truck, moduleKey: "ecommerce" },
      {
        label: "Sellers",
        href: "/dashboard/ecommerce/sellers",
        icon: Store,
        // Multi-vendor only: a single-store shop has no sellers.
        moduleKey: "marketplace",
        children: [
          { label: "All Sellers", href: "/dashboard/ecommerce/sellers", icon: Store },
          { label: "Listing Review", href: "/dashboard/ecommerce/sellers/review", icon: BadgeCheck },
          { label: "Payouts", href: "/dashboard/ecommerce/sellers/payouts", icon: Wallet },
          { label: "Withdrawals", href: "/dashboard/ecommerce/sellers/withdrawals", icon: ArrowUpFromLine },
          { label: "Commission", href: "/dashboard/ecommerce/sellers/commission", icon: Percent },
        ],
      },
    ],
  },
  {
    // Restaurant vertical (docs/business/06-restaurant-vertical.md). Its own
    // module since 2026-10-14: switching it on also renames Shop to Menu
    // (products are food items, categories are menu sections) in sidebar.tsx.
    // POS moved to Shop so any store can use it.
    label: "Restaurant",
    items: [
      { label: "Kitchen", href: "/dashboard/kitchen", icon: ChefHat, moduleKey: "restaurant" },
      { label: "Reservations", href: "/dashboard/reservations", icon: CalendarClock, moduleKey: "restaurant" },
      { label: "Branches", href: "/dashboard/branches", icon: Store, moduleKey: "restaurant" },
      { label: "Food Delivery", href: "/dashboard/food-delivery", icon: Bike, moduleKey: "restaurant" },
    ],
  },
  {
    label: "Website",
    items: [
      { label: "Pages", href: "/dashboard/pages", icon: FileText },
      { label: "Posts", href: "/dashboard/posts", icon: BookOpen },
      { label: "Media", href: "/dashboard/media", icon: Image },
    ],
  },
  {
    label: "Design",
    items: [
      { label: "Browse Templates", href: "/dashboard/themes", icon: Palette },
      { label: "Colors & Design", href: "/dashboard/templates/colors", icon: SlidersHorizontal },
      { label: "Header Builder", href: "/dashboard/header-builder", icon: PanelTop, exact: true },
      { label: "Footer Builder", href: "/dashboard/header-builder?target=footer", icon: PanelBottom },
      { label: "Navigation", href: "/dashboard/navigation", icon: Navigation },
      { label: "Site Identity", href: "/dashboard/templates/header-footer", icon: Layers },
    ],
  },
  {
    label: "Site Content",
    items: [
      { label: "Services", href: "/dashboard/services", icon: Wrench, moduleKey: "services" },
      { label: "Features", href: "/dashboard/features", icon: Sparkles, moduleKey: "features" },
      { label: "Portfolio", href: "/dashboard/portfolio", icon: FolderOpen, moduleKey: "portfolio" },
      { label: "Sliders", href: "/dashboard/sliders", icon: SlidersHorizontal, moduleKey: "sliders" },
      { label: "Testimonials", href: "/dashboard/testimonials", icon: Star, moduleKey: "testimonials" },
      { label: "Pricing", href: "/dashboard/pricing-manager", icon: PricingIcon, moduleKey: "pricing" },
      // Each collection type also gets its own item here (sidebar.tsx, from the layout).
      { label: "Collections", href: "/dashboard/collections", icon: Layers, moduleKey: "collections", exact: true },
      { label: "Contact", href: "/dashboard/contact", icon: Phone },
    ],
  },
  {
    label: "Customers & Sales",
    items: [
      { label: "Bookings", href: "/dashboard/bookings", icon: Calendar, moduleKey: "bookings" },
      { label: "CRM", href: "/dashboard/crm", icon: Users, moduleKey: "crm" },
      { label: "Spam & Blocked", href: "/dashboard/spam", icon: ShieldBan },
      { label: "Marketing", href: "/dashboard/marketing", icon: Megaphone, moduleKey: "marketing" },
      { label: "Invoices", href: "/dashboard/invoices", icon: Receipt, moduleKey: "invoices" },
      {
        label: "Accounting",
        href: "/dashboard/accounting",
        icon: BarChart3,
        moduleKey: "accounting",
        children: [
          { label: "Overview", href: "/dashboard/accounting", icon: BarChart3 },
          { label: "Transactions", href: "/dashboard/accounting/transactions", icon: DollarSign },
          { label: "Accounts", href: "/dashboard/accounting/accounts", icon: BookMarked },
          { label: "P&L Report", href: "/dashboard/accounting/report", icon: BarChart3 },
        ],
      },
    ],
  },
  {
    label: "Real Estate",
    items: [
      { label: "Properties", href: "/dashboard/real-estate/properties", icon: Building2, moduleKey: "real_estate" },
      { label: "Communities", href: "/dashboard/real-estate/communities", icon: MapPin, moduleKey: "real_estate" },
      { label: "Developers", href: "/dashboard/real-estate/developers", icon: Landmark, moduleKey: "real_estate" },
      { label: "Property Leads", href: "/dashboard/real-estate/leads", icon: Inbox, moduleKey: "real_estate" },
      { label: "Agent Settings", href: "/dashboard/real-estate/settings", icon: UserCog, moduleKey: "real_estate" },
    ],
  },
  {
    label: "Results",
    items: [
      { label: "Results", href: "/dashboard/results", icon: Award, moduleKey: "results" },
      { label: "Courses", href: "/dashboard/results/courses", icon: GraduationCap, moduleKey: "results" },
      { label: "Results Settings", href: "/dashboard/results/settings", icon: UserCog, moduleKey: "results" },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { label: "Vendors", href: "/dashboard/marketplace/vendors", icon: Store, moduleKey: "marketplace" },
      { label: "Service Catalog", href: "/dashboard/marketplace/catalog", icon: Tag, moduleKey: "marketplace" },
      { label: "Bookings", href: "/dashboard/marketplace/bookings", icon: Calendar, moduleKey: "marketplace" },
      { label: "Requests", href: "/dashboard/marketplace/requests", icon: AlertTriangle, moduleKey: "marketplace" },
    ],
  },
  {
    label: "Blood Donation",
    items: [
      { label: "Blood Donors", href: "/dashboard/donors", icon: Droplet, moduleKey: "blood_donation" },
    ],
  },
  {
    label: "Team & Planning",
    items: [
      { label: "Users", href: "/dashboard/users", icon: Users },
      // Release flag: Projects replaces Jobs & Staff (whose page then redirects).
      flags.projects
        ? { label: "Projects", href: "/dashboard/projects", icon: FolderKanban, moduleKey: "projects" }
        : { label: "Jobs & Staff", href: "/dashboard/jobs", icon: Briefcase, moduleKey: "jobs" },
      {
        label: "Content Scheduler",
        href: "/dashboard/scheduler",
        icon: CalendarClock,
        moduleKey: "content_scheduler",
        children: [
          { label: "Calendar & Queue", href: "/dashboard/scheduler", icon: CalendarClock },
          { label: "Brands", href: "/dashboard/scheduler/brands", icon: Layers },
          { label: "Access", href: "/dashboard/scheduler/access", icon: Users },
        ],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "General Settings", href: "/dashboard/settings", icon: Settings, exact: true },
      { label: "Business Profile", href: "/dashboard/business-profile", icon: Briefcase },
      { label: "Domain", href: "/dashboard/settings/domain", icon: Globe, saasOnly: true },
      { label: "Business Email", href: "/dashboard/settings/email", icon: AtSign, saasOnly: true },
      { label: "SEO & AI Search", href: "/dashboard/settings/seo", icon: SearchCheck },
      { label: "Redirects", href: "/dashboard/settings/redirects", icon: Link2 },
      { label: "Languages", href: "/dashboard/settings/languages", icon: Languages },
      { label: "Modules", href: "/dashboard/modules", icon: ToggleLeft },
      { label: "Import / Export", href: "/dashboard/import-export", icon: ArrowLeftRight },
      { label: "Backups", href: "/dashboard/backups", icon: Archive },
      { label: "API Keys", href: "/dashboard/settings/api-keys", icon: Puzzle },
      // Owner only (the page says so to everyone else).
      { label: "Move to self-host", href: "/dashboard/selfhost-move", icon: ServerCog, saasOnly: true },
    ],
  },
  {
    label: "Account & Help",
    variant: "brand",
    items: [
      { label: "Subscription", href: "/dashboard/subscription", icon: CreditCard, saasOnly: true },
      { label: "Support", href: "/dashboard/support", icon: LifeBuoy },
      // Partner account lives outside the site dashboard (partners may have no site).
      { label: "Partner program", href: "/partners/account", icon: Handshake, saasOnly: true },
      { label: "Docs", href: "/dashboard/docs", icon: BookOpen },
    ],
  },
];

/** navSections with hideWithModules applied for a site's resolved modules
 *  (children included, since the menu filter only sees top-level items).
 *  Without modules (no site chosen) nothing is dropped. */
export function navSectionsFor(enabledModules?: Partial<Record<ModuleKey, boolean>>): NavSection[] {
  if (!enabledModules) return navSections;
  const keep = (i: NavItem) => !i.hideWithModules?.length || !i.hideWithModules.every((m) => enabledModules[m]);
  const prune = (i: NavItem): NavItem => (i.children ? { ...i, children: i.children.filter(keep).map(prune) } : i);
  return navSections.map((s) => ({ ...s, items: s.items.filter(keep).map(prune) }));
}

/** Route-level module gating: given a dashboard pathname, find the moduleKey
 *  that guards it (if any) by walking every nav item (and its children,
 *  since e.g. /dashboard/accounting/transactions isn't itself tagged but its
 *  parent "Accounting" entry is). Longest href match wins so a more specific
 *  child route's own moduleKey (if it ever gets one) takes priority over an
 *  ancestor's. Single source of truth — (admin)/layout.tsx uses this to
 *  enforce direct-link access, so it can never drift from what the sidebar
 *  hides. */
export function resolveModuleKeyForPath(pathname: string): ModuleKey | undefined {
  let best: { href: string; moduleKey: ModuleKey } | undefined;
  const visit = (item: NavItem) => {
    if (item.moduleKey && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
      if (!best || item.href.length > best.href.length) best = { href: item.href, moduleKey: item.moduleKey };
    }
    item.children?.forEach(visit);
  };
  navSections.forEach((s) => s.items.forEach(visit));
  return best?.moduleKey;
}
