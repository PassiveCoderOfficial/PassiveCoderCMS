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
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  saasOnly?: boolean;
  standaloneOnly?: boolean;
  children?: NavItem[];
};

export type NavSection = {
  label: string;
  items: NavItem[];
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
    label: "Customers",
    items: [
      { label: "CRM", href: "/dashboard/crm", icon: Users },
      { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
      { label: "Marketing", href: "/dashboard/marketing", icon: Sparkles },
      { label: "Jobs & Staff", href: "/dashboard/jobs", icon: Briefcase },
    ],
  },
  {
    label: "Site Sections",
    items: [
      { label: "Services", href: "/dashboard/services", icon: Wrench },
      { label: "Features", href: "/dashboard/features", icon: Sparkles },
      { label: "Portfolio", href: "/dashboard/portfolio", icon: FolderOpen },
      { label: "Sliders", href: "/dashboard/sliders", icon: SlidersHorizontal },
      { label: "Testimonials", href: "/dashboard/testimonials", icon: Star },
      { label: "Pricing", href: "/dashboard/pricing-manager", icon: PricingIcon },
      { label: "Contact", href: "/dashboard/contact", icon: Phone },
      { label: "Bookings", href: "/dashboard/bookings", icon: Calendar },
      { label: "Identity & Nav", href: "/dashboard/identity", icon: Layers },
    ],
  },
  {
    label: "Appearance",
    items: [
      { label: "Templates", href: "/dashboard/templates", icon: Palette },
      { label: "Plugins", href: "/dashboard/plugins", icon: Puzzle },
    ],
  },
  {
    label: "Ecommerce",
    items: [
      {
        label: "Products",
        href: "/dashboard/ecommerce/products",
        icon: Package,
        children: [
          { label: "All Products", href: "/dashboard/ecommerce/products", icon: Package },
          { label: "Add Single", href: "/dashboard/ecommerce/products/new", icon: Plus },
          { label: "Add Multiple", href: "/dashboard/ecommerce/products/bulk-upload", icon: Upload },
          { label: "Categories", href: "/dashboard/ecommerce/categories", icon: Tag },
        ],
      },
      { label: "Orders", href: "/dashboard/ecommerce/orders", icon: ShoppingBag },
      { label: "Inventory", href: "/dashboard/ecommerce/inventory", icon: Package },
      { label: "Payments", href: "/dashboard/ecommerce/payments", icon: CreditCard },
      { label: "Delivery", href: "/dashboard/ecommerce/delivery", icon: Truck },
      { label: "POS", href: "/dashboard/pos", icon: ShoppingCart },
    ],
  },
  {
    label: "Accounting",
    items: [
      { label: "Overview", href: "/dashboard/accounting", icon: BarChart3 },
      { label: "Transactions", href: "/dashboard/accounting/transactions", icon: DollarSign },
      { label: "Accounts", href: "/dashboard/accounting/accounts", icon: BookMarked },
      { label: "P&L Report", href: "/dashboard/accounting/report", icon: BarChart3 },
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
];
