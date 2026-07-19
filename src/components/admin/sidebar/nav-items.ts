import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Image,
  Palette,
  Puzzle,
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
  Layout,
  Layers,
  SlidersHorizontal,
  DollarSign as PricingIcon,
  Calendar,
  Plus,
  Upload,
  Briefcase,
  ShoppingCart,
  ToggleLeft,
  Droplet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  saasOnly?: boolean;
  standaloneOnly?: boolean;
  /** When set, this item only shows if tenants.enabled_modules[moduleKey] is
   *  truthy (resolved server-side) — see MODULE_KEYS below. Super admins
   *  always bypass this check. */
  moduleKey?: ModuleKey;
  children?: NavItem[];
};

/** Every togglable platform module, keyed the same in plans.modules and
 *  tenants.enabled_modules. Labels shown in the SA plan editor and the
 *  tenant Modules dashboard page. */
export const MODULE_KEYS = [
  "services", "features", "portfolio", "sliders", "testimonials", "pricing", "bookings",
  "ecommerce", "crm", "invoices", "marketing", "jobs", "pos", "inventory", "accounting",
  "visa_tour", "blood_donation",
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
};

export type NavSection = {
  label: string;
  items: NavItem[];
  /** "tools" renders as the dark business-tools block at the bottom */
  variant?: "tools";
};

export const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Pages", href: "/dashboard/pages", icon: FileText },
      { label: "Posts", href: "/dashboard/posts", icon: BookOpen },
      { label: "Media", href: "/dashboard/media", icon: Image },
    ],
  },
  {
    label: "Site Sections",
    items: [
      { label: "Services", href: "/dashboard/services", icon: Wrench, moduleKey: "services" },
      { label: "Features", href: "/dashboard/features", icon: Sparkles, moduleKey: "features" },
      { label: "Portfolio", href: "/dashboard/portfolio", icon: FolderOpen, moduleKey: "portfolio" },
      { label: "Sliders", href: "/dashboard/sliders", icon: SlidersHorizontal, moduleKey: "sliders" },
      { label: "Testimonials", href: "/dashboard/testimonials", icon: Star, moduleKey: "testimonials" },
      { label: "Pricing", href: "/dashboard/pricing-manager", icon: PricingIcon, moduleKey: "pricing" },
      { label: "Contact", href: "/dashboard/contact", icon: Phone },
      { label: "Bookings", href: "/dashboard/bookings", icon: Calendar, moduleKey: "bookings" },
      { label: "Blood Donors", href: "/dashboard/donors", icon: Droplet, moduleKey: "blood_donation" },
      { label: "Identity & Nav", href: "/dashboard/identity", icon: Layers },
    ],
  },
  {
    label: "Appearance",
    items: [
      { label: "Templates", href: "/dashboard/templates", icon: Palette },
    ],
  },
  {
    label: "Ecommerce",
    items: [
      {
        label: "Products",
        href: "/dashboard/ecommerce/products",
        icon: Package,
        moduleKey: "ecommerce",
        children: [
          { label: "All Products", href: "/dashboard/ecommerce/products", icon: Package },
          { label: "Add Single", href: "/dashboard/ecommerce/products/new", icon: Plus },
          { label: "Add Multiple", href: "/dashboard/ecommerce/products/bulk-upload", icon: Upload },
          { label: "Categories", href: "/dashboard/ecommerce/categories", icon: Tag },
        ],
      },
      { label: "Orders", href: "/dashboard/ecommerce/orders", icon: ShoppingBag, moduleKey: "ecommerce" },
      { label: "Payments", href: "/dashboard/ecommerce/payments", icon: CreditCard, moduleKey: "ecommerce" },
      { label: "Delivery", href: "/dashboard/ecommerce/delivery", icon: Truck, moduleKey: "ecommerce" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Subscription", href: "/dashboard/subscription", icon: CreditCard, saasOnly: true },
      { label: "Support", href: "/dashboard/support", icon: BookMarked },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Modules", href: "/dashboard/modules", icon: ToggleLeft },
      { label: "Users", href: "/dashboard/users", icon: Users },
      { label: "Backups", href: "/dashboard/backups", icon: Archive },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
      { label: "API Keys", href: "/dashboard/settings/api-keys", icon: Puzzle },
      { label: "Layout Manager", href: "/dashboard/settings/layout-manager", icon: Layout },
      { label: "Domain", href: "/dashboard/settings/domain", icon: Globe, saasOnly: true },
      { label: "Visit Site", href: "/", icon: Globe },
      { label: "Docs", href: "/dashboard/docs", icon: BookOpen },
    ],
  },
  {
    label: "Business Tools",
    variant: "tools",
    items: [
      { label: "CRM", href: "/dashboard/crm", icon: Users, moduleKey: "crm" },
      { label: "Invoices", href: "/dashboard/invoices", icon: FileText, moduleKey: "invoices" },
      { label: "Marketing", href: "/dashboard/marketing", icon: Sparkles, moduleKey: "marketing" },
      { label: "Jobs & Staff", href: "/dashboard/jobs", icon: Briefcase, moduleKey: "jobs" },
      { label: "POS", href: "/dashboard/pos", icon: ShoppingCart, moduleKey: "pos" },
      { label: "Inventory", href: "/dashboard/ecommerce/inventory", icon: Package, moduleKey: "inventory" },
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
];

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
