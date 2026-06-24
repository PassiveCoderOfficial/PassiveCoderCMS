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
      { label: "Products", href: "/dashboard/ecommerce/products", icon: Package },
      { label: "Orders", href: "/dashboard/ecommerce/orders", icon: ShoppingBag },
      { label: "Categories", href: "/dashboard/ecommerce/categories", icon: Tag },
      { label: "Payments", href: "/dashboard/ecommerce/payments", icon: CreditCard },
      { label: "Delivery", href: "/dashboard/ecommerce/delivery", icon: Truck },
    ],
  },
  {
    label: "Accounting",
    items: [
      { label: "Overview", href: "/dashboard/accounting", icon: BarChart3 },
      { label: "Transactions", href: "/dashboard/accounting/transactions", icon: DollarSign },
      { label: "Accounts", href: "/dashboard/accounting/accounts", icon: BookMarked },
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
      { label: "Layout Manager", href: "/dashboard/settings/layout-manager", icon: Layout },
      { label: "Domain", href: "/dashboard/settings/domain", icon: Globe, saasOnly: true },
      { label: "Visit Site", href: "/", icon: Globe },
      { label: "Docs", href: "/dashboard/docs", icon: BookOpen },
    ],
  },
];
