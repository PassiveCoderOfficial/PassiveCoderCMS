"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen, ChevronRight, LayoutDashboard, FileText, Palette, Puzzle,
  ShoppingBag, DollarSign, Settings, Code2, Database, Layers, Blocks,
  GitBranch, Shield, Zap, Package, Globe, Users, Image, BarChart3,
  Terminal, AlertCircle, CheckCircle, Info, ExternalLink,
} from "lucide-react";

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

type Section = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };
type Chapter = { title: string; sections: Section[] };

const chapters: Chapter[] = [
  {
    title: "Getting Started",
    sections: [
      { id: "overview",     label: "Overview",            icon: BookOpen },
      { id: "setup",        label: "Installation & Setup", icon: Terminal },
      { id: "architecture", label: "Architecture",         icon: GitBranch },
    ],
  },
  {
    title: "Admin Panel",
    sections: [
      { id: "dashboard",  label: "Dashboard",      icon: LayoutDashboard },
      { id: "pages",      label: "Pages & Posts",  icon: FileText },
      { id: "builder",    label: "Page Builder",   icon: Blocks },
      { id: "media",      label: "Media Library",  icon: Image },
    ],
  },
  {
    title: "Appearance",
    sections: [
      { id: "themes",  label: "Themes",  icon: Palette },
      { id: "plugins", label: "Plugins", icon: Puzzle },
    ],
  },
  {
    title: "Ecommerce",
    sections: [
      { id: "products",  label: "Products",         icon: Package },
      { id: "orders",    label: "Orders",           icon: ShoppingBag },
      { id: "payments",  label: "Payment Gateways", icon: DollarSign },
      { id: "delivery",  label: "Delivery Options", icon: Globe },
    ],
  },
  {
    title: "Accounting",
    sections: [
      { id: "accounting",    label: "Overview",         icon: BarChart3 },
      { id: "transactions",  label: "Transactions",     icon: DollarSign },
    ],
  },
  {
    title: "Developer Guide",
    sections: [
      { id: "blocks-dev",  label: "Creating Blocks",  icon: Code2 },
      { id: "database",    label: "Database Schema",  icon: Database },
      { id: "rls",         label: "Security & RLS",   icon: Shield },
      { id: "api",         label: "API Reference",    icon: Zap },
      { id: "users",       label: "User Roles",       icon: Users },
      { id: "deployment",  label: "Deployment",       icon: Layers },
    ],
  },
  {
    title: "Settings",
    sections: [
      { id: "settings", label: "Site Settings", icon: Settings },
    ],
  },
];

// ─── Content helpers ───────────────────────────────────────────────────────────

function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold mb-2 text-foreground">{children}</h1>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold mt-10 mb-3 text-foreground border-b pb-2">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-6 mb-2 text-foreground">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4 ml-2">{children}</ul>;
}
function Li({ children }: { children: React.ReactNode }) {
  return <li className="leading-relaxed">{children}</li>;
}
function Code({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
}
function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto mb-4 text-foreground leading-relaxed whitespace-pre">
      {children}
    </pre>
  );
}
function Note({ type = "info", children }: { type?: "info" | "warn" | "success"; children: React.ReactNode }) {
  const map = {
    info:    { icon: Info,         cls: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
    warn:    { icon: AlertCircle,  cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" },
    success: { icon: CheckCircle,  cls: "border-green-500/30 bg-green-500/10 text-green-400" },
  };
  const { icon: Icon, cls } = map[type];
  return (
    <div className={cn("flex gap-3 border rounded-lg p-3 mb-4 text-sm", cls)}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b">
            {headers.map((h) => <th key={h} className="text-left py-2 px-3 font-semibold text-foreground">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
              {row.map((cell, j) => <td key={j} className="py-2 px-3 text-muted-foreground">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Section content ───────────────────────────────────────────────────────────

const sections: Record<string, React.ReactNode> = {

  overview: (
    <div>
      <H1>Passive Coder</H1>
      <p className="text-muted-foreground text-sm mb-6">A modern, open-source Content Management System built with Next.js 15 and Supabase.</p>
      <Note type="success">Passive Coder is designed to be reused across client websites. It follows a WordPress-inspired architecture but is built on modern, type-safe technology.</Note>
      <H2>What is Passive Coder?</H2>
      <P>Passive Coder is a full-featured headless CMS with a built-in visual page builder. It provides everything you need to build and manage professional websites — pages, blog posts, ecommerce, accounting, themes, and plugins — all from a single admin panel.</P>
      <H2>Key Features</H2>
      <Table
        headers={["Feature", "Description"]}
        rows={[
          ["Visual Page Builder", "Drag-and-drop blocks with live preview, undo/redo, and responsive breakpoints"],
          ["14 Block Types", "Hero, Slider, Navigation, Text, Services, Blog, Gallery, CTA, Testimonials, Divider, Spacer, Products, Donation Feed, Custom HTML"],
          ["Pages & Posts", "Full CRUD with slug management, SEO fields, and draft/publish workflow"],
          ["Themes System", "6 built-in themes, installable and activatable from the admin panel"],
          ["Plugins System", "10 built-in plugins with toggle activation"],
          ["Ecommerce", "Products, variants, inventory, orders, 7 payment gateways including BD gateways"],
          ["Accounting", "Bookkeeping, transactions, donation feed block for public pages"],
          ["Media Library", "File management with Supabase Storage"],
          ["User Roles", "Admin, Editor, Author, Contributor, Subscriber, Customer"],
          ["Dark / Light Mode", "System-aware theme switching via the topbar"],
        ]}
      />
      <H2>Tech Stack</H2>
      <Table
        headers={["Layer", "Technology"]}
        rows={[
          ["Framework", "Next.js 15 (App Router)"],
          ["Database", "Supabase (PostgreSQL)"],
          ["Auth", "Supabase Auth"],
          ["Storage", "Supabase Storage"],
          ["Realtime", "Supabase Realtime (orders & transactions)"],
          ["Styling", "Tailwind CSS v4"],
          ["UI Components", "Radix UI primitives (custom, no shadcn CLI)"],
          ["Drag & Drop", "@dnd-kit"],
          ["State Management", "Zustand + Immer"],
          ["Server State", "TanStack Query"],
          ["Forms", "React Hook Form + Zod"],
          ["Notifications", "Sonner"],
          ["Icons", "Lucide React"],
        ]}
      />
    </div>
  ),

  setup: (
    <div>
      <H1>Installation & Setup</H1>
      <H2>Prerequisites</H2>
      <UL>
        <Li>Node.js 20+ and npm</Li>
        <Li>A Supabase account and project</Li>
        <Li>Git</Li>
      </UL>
      <H2>1. Clone & Install</H2>
      <Pre>{`git clone <repo-url> cms
cd cms
npm install`}</Pre>
      <H2>2. Environment Variables</H2>
      <P>Create a <Code>.env.local</Code> file in the project root:</P>
      <Pre>{`# Supabase — get from: supabase.com/dashboard → project → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres.your-ref:password@host:6543/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</Pre>
      <Note type="warn">Never commit <Code>.env.local</Code> to version control. The service role key has full database access.</Note>
      <H2>3. Run the Database Migration</H2>
      <P>The migration script can be run via the helper:</P>
      <Pre>{`node scripts/run-migration.mjs`}</Pre>
      <P>Or manually: paste <Code>supabase/migrations/001_initial_schema.sql</Code> into your Supabase SQL Editor and run it.</P>
      <H2>4. Create Your Admin User</H2>
      <P>Sign up through the Supabase dashboard or your app's login page, then run in the SQL Editor:</P>
      <Pre>{`UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';`}</Pre>
      <H2>5. Start Development Server</H2>
      <Pre>{`npm run dev`}</Pre>
      <P>Open <Code>http://localhost:3000/dashboard</Code> and sign in.</P>
      <H2>6. Build for Production</H2>
      <Pre>{`npm run build
npm start`}</Pre>
      <Note type="success">The build outputs 28 routes. All admin routes are server-rendered on demand for security.</Note>
    </div>
  ),

  architecture: (
    <div>
      <H1>Architecture</H1>
      <H2>Route Groups</H2>
      <P>Next.js App Router route groups are used to separate concerns without affecting URLs:</P>
      <Pre>{`src/app/
├── (admin)/          # Admin panel — requires auth
│   └── dashboard/    # All admin routes live here
│       ├── page.tsx              → /dashboard
│       ├── pages/                → /dashboard/pages
│       ├── posts/                → /dashboard/posts
│       ├── media/                → /dashboard/media
│       ├── themes/               → /dashboard/themes
│       ├── plugins/              → /dashboard/plugins
│       ├── ecommerce/            → /dashboard/ecommerce/*
│       ├── accounting/           → /dashboard/accounting/*
│       ├── settings/             → /dashboard/settings/*
│       └── docs/                 → /dashboard/docs
├── (auth)/           # Login/register pages
│   └── login/
└── (site)/           # Public-facing website
    └── [[...slug]]/  # Catch-all for published pages`}</Pre>
      <H2>Two-Renderer Architecture</H2>
      <P>Some blocks (Blog, Ecommerce Products, Accounting Feed) require server-side data fetching. Since the page builder runs in the browser, two separate renderers exist:</P>
      <Table
        headers={["Renderer", "File", "Used In", "Handles Data Blocks"]}
        rows={[
          ["BlockRenderer", "components/admin/page-builder/canvas/block-renderer.tsx", "Admin builder (client)", "Shows placeholder"],
          ["PageRenderer", "components/site/page-renderer.tsx", "Public site (server RSC)", "Fetches real data"],
        ]}
      />
      <Note type="info">This prevents server-only imports (like <Code>next/headers</Code>) from leaking into client component trees.</Note>
      <H2>Key Files</H2>
      <Table
        headers={["File", "Purpose"]}
        rows={[
          ["src/types/cms.ts", "All TypeScript types for the entire CMS"],
          ["src/modules/page-builder/block-registry.ts", "Block definitions with create() factories"],
          ["src/lib/store/builder.ts", "Zustand + Immer page builder state"],
          ["src/components/admin/page-builder/builder-interface.tsx", "Main builder UI"],
          ["src/components/site/page-renderer.tsx", "Public page server renderer"],
          ["src/lib/supabase/server.ts", "Supabase server client (uses cookies)"],
          ["src/lib/supabase/client.ts", "Supabase browser client"],
          ["src/proxy.ts", "Auth middleware (session refresh)"],
          ["supabase/migrations/001_initial_schema.sql", "Full database schema"],
        ]}
      />
      <H2>Data Flow</H2>
      <Pre>{`User edits a block in the builder
  → Zustand store (client state)
  → Save button clicked
  → Supabase client upserts to pages table (blocks column as JSONB)

Public visitor opens a page
  → Next.js catch-all /[[...slug]] route
  → Supabase server client fetches page by slug
  → PageRenderer (Server RSC) renders each block
  → Async blocks (blog/products) fetch their own data`}</Pre>
    </div>
  ),

  dashboard: (
    <div>
      <H1>Dashboard</H1>
      <P>The dashboard at <Code>/dashboard</Code> gives you an at-a-glance view of your site's content and activity.</P>
      <H2>Stats Cards</H2>
      <UL>
        <Li><strong>Total Pages</strong> — count of all pages (type = page)</Li>
        <Li><strong>Blog Posts</strong> — count of all posts (type = post)</Li>
        <Li><strong>Products</strong> — total product count</Li>
        <Li><strong>Orders</strong> — total order count</Li>
        <Li><strong>Users</strong> — registered user count</Li>
      </UL>
      <H2>Recent Orders</H2>
      <P>Shows the 5 most recent orders with status badges and totals.</P>
      <H2>Recent Transactions</H2>
      <P>Shows the 5 most recent accounting transactions, color-coded by type (income = green, expense = red).</P>
      <H2>Quick Actions</H2>
      <P>One-click buttons to create a new page, post, product, or navigate to themes, plugins, media, and settings.</P>
      <H2>Theme Toggle</H2>
      <P>Click the Sun/Moon icon in the topbar (top right) to switch between light and dark mode. Your preference is saved to localStorage.</P>
    </div>
  ),

  pages: (
    <div>
      <H1>Pages & Posts</H1>
      <H2>Pages vs Posts</H2>
      <P>Both pages and posts use the same underlying data structure (the <Code>pages</Code> table) but differ by the <Code>type</Code> field:</P>
      <Table
        headers={["Type", "URL Example", "Purpose"]}
        rows={[
          ["page", "/about", "Standard site pages"],
          ["post", "/blog/my-post", "Blog articles"],
          ["landing", "/promo", "Marketing landing pages"],
          ["portfolio", "/work/project", "Portfolio pieces"],
        ]}
      />
      <H2>Creating a Page</H2>
      <UL>
        <Li>Go to <Code>Dashboard → Pages</Code></Li>
        <Li>Click <strong>New Page</strong></Li>
        <Li>Enter a title — the slug auto-generates (editable)</Li>
        <Li>Choose a page type</Li>
        <Li>Click <strong>Create & Open Builder</strong></Li>
      </UL>
      <H2>Page Status Workflow</H2>
      <Table
        headers={["Status", "Visible on Site", "Description"]}
        rows={[
          ["Draft", "No", "Work in progress"],
          ["Published", "Yes", "Live and accessible at the slug URL"],
          ["Scheduled", "No", "Will publish at a future date"],
          ["Archived", "No", "Hidden but not deleted"],
        ]}
      />
      <H2>SEO Fields</H2>
      <P>Each page has an SEO panel in the builder settings. Fields include: meta title, meta description, OG title, OG description, OG image, canonical URL, and no-index toggle.</P>
      <H2>The Home Page</H2>
      <Note type="info">Create a page with slug <Code>home</Code> and publish it. This will be shown at <Code>yourdomain.com/</Code>.</Note>
    </div>
  ),

  builder: (
    <div>
      <H1>Page Builder</H1>
      <P>The visual page builder opens when you click a page from the Pages list. It provides a live canvas with drag-and-drop block editing.</P>
      <H2>Interface Layout</H2>
      <Pre>{`┌─────────┬──────────────────────────┬──────────────┐
│ Blocks  │       Canvas             │   Settings   │
│ Panel   │  (live preview)          │    Panel     │
│  (left) │                          │   (right)    │
└─────────┴──────────────────────────┴──────────────┘`}</Pre>
      <H2>Toolbar Controls</H2>
      <Table
        headers={["Control", "Action"]}
        rows={[
          ["Edit / Preview tabs", "Switch between editing and read-only preview"],
          ["Desktop / Tablet / Mobile", "Preview at different viewport widths"],
          ["↩ / ↪ (Undo/Redo)", "Up to 50 steps of history"],
          ["Draft / Published dropdown", "Change page status"],
          ["View", "Open the live public page in a new tab"],
          ["Save", "Persist the current blocks to the database"],
        ]}
      />
      <H2>Adding Blocks</H2>
      <UL>
        <Li>Click any block in the left panel to add it to the bottom of the canvas</Li>
        <Li>Drag blocks from the panel directly onto the canvas at a specific position</Li>
        <Li>Use the search box to filter blocks by name</Li>
        <Li>Use category tabs (Layout, Content, Media, Ecommerce) to browse</Li>
      </UL>
      <H2>Available Blocks</H2>
      <Table
        headers={["Block", "Category", "Description"]}
        rows={[
          ["Hero", "Layout", "Full-width hero with title, subtitle, CTA buttons, and optional image. Layouts: centered, split, left, right"],
          ["Navigation", "Layout", "Site navigation bar with logo, menu links, and CTA"],
          ["Slider", "Layout", "Image carousel / slideshow"],
          ["Divider", "Layout", "Horizontal rule with style options"],
          ["Spacer", "Layout", "Blank vertical space"],
          ["Text / Rich Content", "Content", "Rich text editor with typography controls"],
          ["Services", "Content", "Cards grid: icon/image + title + description + link"],
          ["Gallery", "Media", "Responsive image grid or masonry layout"],
          ["Testimonials", "Content", "Customer quote cards"],
          ["Call to Action", "Content", "Prominent CTA section with button"],
          ["Blog Posts", "Content", "Auto-fetches and displays recent blog posts"],
          ["Products Grid", "Ecommerce", "Auto-fetches and displays products from the store"],
          ["Donation/Transaction Feed", "Accounting", "Displays public transactions (e.g. donor wall)"],
          ["Custom HTML", "Advanced", "Inject raw HTML/CSS/JS into the page"],
        ]}
      />
      <H2>Block Settings</H2>
      <P>Click any block on the canvas to select it. The right panel shows two tabs:</P>
      <UL>
        <Li><strong>Content</strong> — Block-specific fields (text, images, links, colors)</Li>
        <Li><strong>Layout</strong> — Padding, margin, background color/gradient/image, visibility toggle</Li>
      </UL>
      <H2>Reordering Blocks</H2>
      <P>Drag the grip handle (⠿) on the left edge of any selected block to reorder it on the canvas.</P>
      <H2>Keyboard Shortcuts</H2>
      <Table
        headers={["Shortcut", "Action"]}
        rows={[
          ["Ctrl+Z", "Undo"],
          ["Ctrl+Y / Ctrl+Shift+Z", "Redo"],
          ["Escape", "Deselect block"],
          ["Delete", "Remove selected block"],
        ]}
      />
    </div>
  ),

  media: (
    <div>
      <H1>Media Library</H1>
      <P>The Media Library at <Code>/dashboard/media</Code> displays all uploaded files stored in Supabase Storage.</P>
      <H2>Using External Images in Blocks</H2>
      <P>You can paste any HTTPS image URL directly into block image fields (Hero, Services, Gallery, etc.). All external hostnames are allowed by the Next.js image configuration.</P>
      <H2>Supported File Types</H2>
      <UL>
        <Li>Images: JPG, PNG, WebP, GIF, SVG</Li>
        <Li>Documents: PDF</Li>
        <Li>Videos: MP4, WebM</Li>
      </UL>
      <H2>Uploading Files</H2>
      <UL>
        <Li>Drag & drop files onto the upload zone, or click to open the file browser</Li>
        <Li>Multiple files can be uploaded simultaneously</Li>
        <Li>Each file is stored in the <Code>media</Code> Supabase Storage bucket at path <Code>uploads/&lt;timestamp&gt;_&lt;filename&gt;</Code></Li>
        <Li>A database row is created in the <Code>media</Code> table with the public URL, MIME type, and file size</Li>
        <Li>Maximum file size: 50 MB per file</Li>
      </UL>
      <H2>Managing Files</H2>
      <UL>
        <Li>Click any file to open the detail panel — shows file info, copy URL button, and alt text editor</Li>
        <Li>Hover over a grid item to reveal quick-action buttons (copy URL, delete)</Li>
        <Li>Use the search bar to filter by filename</Li>
        <Li>Filter tabs: All / Image / Video / Document</Li>
        <Li>Toggle between grid view and list view with the view switcher</Li>
        <Li>Deleting a file removes it from both Supabase Storage and the database</Li>
      </UL>
      <H2>Using Media in Pages</H2>
      <P>Copy a file URL from the media library and paste it into any image field in the page builder. The URL is a permanent public CDN URL served by Supabase Storage.</P>
      <H2>Storage Setup (Developer)</H2>
      <P>The <Code>media</Code> storage bucket is created automatically when you run <Code>node scripts/migrate-media-theme.mjs</Code>. To set it up manually:</P>
      <Pre>{`-- Run in Supabase SQL editor (from 002_media_storage_theme.sql):

-- 1. Create bucket via Supabase dashboard: Storage → New Bucket
--    Name: media, Public: true, File size limit: 52428800 (50MB)

-- 2. Storage RLS policies (auto-applied by migration script):
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Public can read media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can delete media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media');`}</Pre>
      <Note type="info">The <Code>media</Code> bucket is set to <strong>public</strong> so uploaded files are accessible via URL without authentication. This is required for images used on the public website.</Note>
    </div>
  ),

  themes: (
    <div>
      <H1>Themes</H1>
      <P>Themes control the visual appearance of the public-facing website — fonts, colours, border radius, container width, and more. The admin panel has its own independent dark/light toggle (top-right corner). The frontend theme is set separately in <Code>Settings → Appearance</Code>.</P>

      <H2>How the Theme System Works</H2>
      <P>The active theme's <Code>settings</Code> object is loaded from the <Code>themes</Code> table (where <Code>is_active = true</Code>) and injected as CSS custom properties on the public site. Each block renderer reads these variables to style itself. The flow is:</P>
      <Pre>{`1. Admin activates a theme  →  themes.is_active = true in DB
2. Public site layout (SSR)  →  reads active theme settings
3. CSS variables injected     →  --primary, --font-heading, etc.
4. Tailwind + custom CSS      →  components consume the variables
5. Frontend theme mode        →  light / dark / system (site_settings.site_theme)`}</Pre>

      <H2>Built-in Themes</H2>
      <Table
        headers={["Theme", "Style", "Primary Color", "Fonts"]}
        rows={[
          ["Aurora",   "Vibrant / Gradient",   "Purple → Pink",  "Syne + DM Sans"],
          ["Minimal",  "Professional / Clean", "Slate gray",     "Inter + Inter"],
          ["Ocean",    "Tech / Corporate",     "Blue #2563EB",   "Poppins + Inter"],
          ["Sunset",   "Warm / Creative",      "Orange → Red",   "Playfair Display + Lato"],
          ["Forest",   "Natural / Eco",        "Green #16A34A",  "Merriweather + Open Sans"],
          ["Midnight", "Dark / Bold",          "Deep navy",      "Space Grotesk + Roboto"],
        ]}
      />

      <H2>Installing & Activating a Theme (Admin)</H2>
      <UL>
        <Li>Go to <Code>Dashboard → Themes</Code></Li>
        <Li>Click <strong>Install</strong> on any theme in the "Available Themes" list — this writes a row to the <Code>themes</Code> table</Li>
        <Li>Click <strong>Activate</strong> on an installed theme — this sets <Code>is_active = true</Code> and clears all other themes</Li>
        <Li>Only one theme can be active at a time</Li>
        <Li>Uninstalling removes the theme row from the database</Li>
      </UL>

      <H2>Theme Settings Reference</H2>
      <Table
        headers={["Property", "CSS Variable", "Description", "Example"]}
        rows={[
          ["primaryColor",     "--color-primary",     "Main brand colour — buttons, links, highlights",   "#7C3AED"],
          ["secondaryColor",   "--color-secondary",   "Supporting / secondary colour",                    "#EC4899"],
          ["accentColor",      "--color-accent",      "Accent / highlight colour",                        "#F59E0B"],
          ["backgroundColor",  "--color-background",  "Page background",                                  "#FFFFFF"],
          ["textColor",        "--color-text",        "Default body text colour",                         "#111827"],
          ["headingFont",      "--font-heading",      "Google Font name for headings",                    "Syne"],
          ["bodyFont",         "--font-body",         "Google Font name for body text",                   "DM Sans"],
          ["borderRadius",     "--radius",            "Global border radius applied to cards, buttons",   "0.75rem"],
          ["containerWidth",   "--container-width",   "Max-width of the main content container",          "1200px"],
          ["customCss",        "—",                   "Extra CSS injected after theme variables",         ".btn { ... }"],
        ]}
      />

      <H2>Creating a Custom Theme (Developer Guide)</H2>
      <P>Themes are defined as TypeScript objects conforming to the <Code>ThemeSettings</Code> type from <Code>src/types/cms.ts</Code>. To add a new built-in theme:</P>

      <H3>Step 1 — Define the theme object</H3>
      <Pre>{`// src/modules/themes/built-in-themes.ts

import type { ThemeSettings } from "@/types/cms";

export type BuiltInTheme = {
  slug: string;
  name: string;
  description: string;
  author: string;
  version: string;
  thumbnail?: string;
  preview_url?: string;
  settings: ThemeSettings;
};

export const builtInThemes: BuiltInTheme[] = [
  {
    slug: "aurora",
    name: "Aurora",
    description: "Vibrant gradient theme with modern typography.",
    author: "Passive Coder",
    version: "1.0.0",
    settings: {
      primaryColor: "#7C3AED",
      secondaryColor: "#EC4899",
      accentColor: "#F59E0B",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      headingFont: "Syne",
      bodyFont: "DM Sans",
      borderRadius: "0.75rem",
      containerWidth: "1200px",
    },
  },
  // ← Add your theme here
  {
    slug: "coral",
    name: "Coral",
    description: "Warm coral tones with rounded UI.",
    author: "Your Name",
    version: "1.0.0",
    thumbnail: "/themes/coral-preview.png",
    settings: {
      primaryColor: "#FF6B6B",
      secondaryColor: "#FFE66D",
      accentColor: "#4ECDC4",
      backgroundColor: "#FAFAFA",
      textColor: "#2D3436",
      headingFont: "Nunito",
      bodyFont: "Nunito",
      borderRadius: "1rem",
      containerWidth: "1100px",
    },
  },
];`}</Pre>

      <H3>Step 2 — Apply theme variables in the public layout</H3>
      <P>The site layout at <Code>src/app/(site)/layout.tsx</Code> reads the active theme and injects CSS variables. When adding new CSS variables, update both the theme object definition and the injection logic:</P>
      <Pre>{`// src/app/(site)/layout.tsx (simplified)
const { data: theme } = await supabase
  .from("themes")
  .select("settings")
  .eq("is_active", true)
  .single();

const vars = theme ? \`
  :root {
    --color-primary: \${theme.settings.primaryColor};
    --color-secondary: \${theme.settings.secondaryColor};
    --font-heading: "\${theme.settings.headingFont}", sans-serif;
    --font-body: "\${theme.settings.bodyFont}", sans-serif;
    --radius: \${theme.settings.borderRadius};
    --container-width: \${theme.settings.containerWidth};
  }
\` : "";`}</Pre>

      <H3>Step 3 — Load Google Fonts dynamically</H3>
      <Pre>{`// In the site <head>, load fonts based on active theme:
<link
  href={\`https://fonts.googleapis.com/css2?family=\${encodeURIComponent(theme.settings.headingFont)}:wght@400;600;700&family=\${encodeURIComponent(theme.settings.bodyFont)}:wght@400;500&display=swap\`}
  rel="stylesheet"
/>`}</Pre>

      <H3>Step 4 — Add dark mode support to your theme</H3>
      <P>Themes work with the frontend theme mode (light / dark / system). Add dark-mode overrides in your <Code>customCss</Code> field:</P>
      <Pre>{`// In theme.settings.customCss:
".dark {
  --color-background: #0F0F0F;
  --color-text: #F9FAFB;
}"`}</Pre>

      <H3>Step 5 — Register & install via admin</H3>
      <P>Once the entry is in <Code>built-in-themes.ts</Code>, it appears automatically in <Code>Dashboard → Themes → Available Themes</Code>. Click Install → Activate.</P>

      <Note type="info">
        Themes only style the <strong>public site</strong>. The admin panel always uses the Passive Coder design system with its own independent dark/light mode (toggled in the top-right corner of the admin header).
      </Note>

      <H2>Theme Customization Without Code</H2>
      <P>Non-developers can adjust the current theme from <Code>Dashboard → Themes → Customize</Code> (planned feature). For now, use <Code>Settings → Appearance → Custom CSS</Code> to override any visual property:</P>
      <Pre>{`/* Example: override primary color */
:root { --color-primary: #E11D48; }

/* Override heading font */
h1, h2, h3 { font-family: "Georgia", serif; }

/* Dark mode custom override */
.dark body { background: #1a1a2e; }`}</Pre>
    </div>
  ),

  plugins: (
    <div>
      <H1>Plugins</H1>
      <P>Plugins extend Passive Coder with additional features — SEO tools, contact forms, analytics, booking systems, and more. They can be installed and toggled on/off from <Code>Dashboard → Plugins</Code> without touching code.</P>

      <H2>How the Plugin System Works</H2>
      <P>Each plugin is a TypeScript definition object (<Code>PluginDefinition</Code>) that declares what it provides: new block types, admin pages, hooks, and settings fields. The database stores which plugins are installed and their active state. Application code reads <Code>plugins.is_active</Code> to gate feature execution:</P>
      <Pre>{`Plugin lifecycle:
1. Developer defines plugin in built-in-plugins.ts
2. Admin installs plugin  →  writes row to plugins table (is_active: false)
3. Admin toggles on       →  is_active: true in DB
4. App checks at runtime  →  if plugin.is_active, run plugin logic
5. Admin toggles off      →  is_active: false, feature disabled instantly`}</Pre>

      <H2>Built-in Plugins</H2>
      <Table
        headers={["Plugin", "Slug", "Description", "What it adds"]}
        rows={[
          ["SEO Toolkit",         "seo-toolkit",         "Advanced SEO management",                "Sitemap.xml, structured data, meta analyzer"],
          ["Analytics",           "analytics",           "Page view tracking",                     "Analytics dashboard, heatmaps, UTM tracking"],
          ["Contact Forms",       "contact-forms",       "Form builder with email notifications",  "Drag-drop form builder, email/webhook delivery"],
          ["Social Share",        "social-share",        "Social sharing buttons",                 "Share buttons on pages/posts, OG previews"],
          ["Testimonials Pro",    "testimonials-pro",    "Advanced testimonials",                  "Star ratings, filtering, import/export"],
          ["Newsletter",          "newsletter",          "Email subscriptions",                    "Signup forms, Mailchimp/ConvertKit sync"],
          ["Portfolio Pro",       "portfolio-pro",       "Advanced portfolio",                     "Filterable grid, lightbox, case study layout"],
          ["Appointment Booking", "booking",             "Calendar booking system",                "Time slots, calendar view, email reminders"],
          ["Live Chat",           "live-chat",           "Real-time chat",                         "Supabase Realtime powered chat widget"],
          ["CDN & Optimizer",     "cdn-optimizer",       "Image & performance",                    "Auto WebP conversion, lazy load, CDN routing"],
        ]}
      />

      <H2>Installing & Managing Plugins (Admin)</H2>
      <UL>
        <Li>Go to <Code>Dashboard → Plugins</Code></Li>
        <Li>Click <strong>Install</strong> — inserts a row into the <Code>plugins</Code> table with <Code>is_active: false</Code></Li>
        <Li>Toggle the switch to <strong>enable</strong> or <strong>disable</strong> the plugin instantly</Li>
        <Li>Click <strong>Settings</strong> (gear icon) on an active plugin to configure its options</Li>
        <Li>Uninstall removes the plugin row and resets all its settings</Li>
      </UL>
      <Note type="warn">Disabling a plugin immediately stops all its features. For example, disabling "Contact Forms" hides all contact form blocks from the public site until re-enabled.</Note>

      <H2>Creating a Custom Plugin (Developer Guide)</H2>

      <H3>Step 1 — Define the PluginDefinition</H3>
      <P>Create a new entry in <Code>src/modules/plugins/built-in-plugins.ts</Code>:</P>
      <Pre>{`// src/modules/plugins/built-in-plugins.ts
import type { PluginDefinition } from "@/types/cms";

export const builtInPlugins: PluginDefinition[] = [
  {
    id: "my-custom-plugin",
    name: "My Custom Plugin",
    description: "Does something awesome.",
    version: "1.0.0",
    author: "Your Name",

    // Optional: declare new block types this plugin adds
    blocks: ["my_custom_block"],

    // Optional: new admin pages (appear in sidebar under Plugins)
    adminPages: [
      {
        path: "/dashboard/plugins/my-custom-plugin",
        label: "My Plugin Settings",
        icon: "Settings",
      },
    ],

    // Optional: hooks this plugin listens to
    hooks: ["on_page_publish", "on_order_created"],

    // Optional: configurable settings (rendered in the settings modal)
    settings: [
      { key: "api_key",      label: "API Key",       type: "text" },
      { key: "enable_logs",  label: "Enable Logs",   type: "boolean", default: false },
      { key: "mode",         label: "Mode",          type: "select",
        options: ["production", "sandbox"], default: "sandbox" },
    ],
  },
];`}</Pre>

      <H3>Step 2 — Add a custom block type (if needed)</H3>
      <P>If your plugin introduces new page builder blocks, declare the block type in <Code>src/types/cms.ts</Code> and add it to the <Code>BlockType</Code> union, then create the renderer:</P>
      <Pre>{`// 1. Add to BlockType union in src/types/cms.ts
export type BlockType =
  | "hero" | "text" | ... | "my_custom_block";  // ← add here

// 2. Define props type
export type MyCustomBlockProps = BlockBase & {
  type: "my_custom_block";
  data: {
    message: string;
    color?: string;
  };
};

// 3. Add to Block union
export type Block = ... | MyCustomBlockProps;

// 4. Create the renderer
// src/components/blocks/my-custom-block.tsx
"use client";
export function MyCustomBlock({ block }: { block: MyCustomBlockProps }) {
  return (
    <div style={{ color: block.data.color }}>
      {block.data.message}
    </div>
  );
}

// 5. Register in the block renderer switcher
// src/components/blocks/block-renderer.tsx
case "my_custom_block":
  return <MyCustomBlock block={block as MyCustomBlockProps} />;`}</Pre>

      <H3>Step 3 — Gate features behind the plugin toggle</H3>
      <P>Check <Code>is_active</Code> in your server component or API route before running plugin logic:</P>
      <Pre>{`// In any server component / route handler:
const supabase = await createClient();
const { data: plugin } = await supabase
  .from("plugins")
  .select("is_active, settings")
  .eq("slug", "my-custom-plugin")
  .single();

if (!plugin?.is_active) return null; // plugin disabled

const apiKey = plugin.settings?.api_key as string;
// ... run plugin logic`}</Pre>

      <H3>Step 4 — Implement hooks (optional)</H3>
      <P>Passive Coder uses a simple hook bus. Register listeners in a server-side module:</P>
      <Pre>{`// src/modules/plugins/hooks.ts
type Hook = "on_page_publish" | "on_order_created" | "on_media_upload";
type HookHandler = (payload: unknown) => Promise<void>;

const listeners: Map<Hook, HookHandler[]> = new Map();

export function registerHook(hook: Hook, handler: HookHandler) {
  if (!listeners.has(hook)) listeners.set(hook, []);
  listeners.get(hook)!.push(handler);
}

export async function fireHook(hook: Hook, payload: unknown) {
  for (const handler of listeners.get(hook) ?? []) {
    await handler(payload).catch(console.error);
  }
}

// In your plugin's init file:
import { registerHook } from "@/modules/plugins/hooks";
registerHook("on_page_publish", async (payload) => {
  // ping sitemap service, notify Slack, etc.
  console.log("Page published:", payload);
});`}</Pre>

      <H3>Step 5 — Add a settings UI</H3>
      <P>Plugin settings are stored as JSON in <Code>plugins.settings</Code>. The settings modal auto-generates form fields from the <Code>settings</Code> array in your <Code>PluginDefinition</Code>. For a custom UI, create a page at the <Code>adminPages</Code> path you declared:</P>
      <Pre>{`// src/app/(admin)/dashboard/plugins/my-custom-plugin/page.tsx
import { createAdminClient } from "@/lib/supabase/server";

export default async function MyPluginSettings() {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("plugins")
    .select("settings")
    .eq("slug", "my-custom-plugin")
    .single();

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">My Plugin Settings</h1>
      {/* Render your custom settings form */}
    </div>
  );
}`}</Pre>

      <H2>Plugin Settings Schema</H2>
      <Table
        headers={["Field type", "UI element", "DB storage"]}
        rows={[
          ["text",    "Text input",   "string"],
          ["number",  "Number input", "number"],
          ["boolean", "Toggle",       "boolean"],
          ["select",  "Dropdown",     "string (one of options)"],
        ]}
      />

      <H2>Plugin Security Considerations</H2>
      <UL>
        <Li>Plugin settings (API keys, secrets) are stored in the <Code>plugins.settings</Code> JSONB column — this is <strong>not</strong> encrypted at rest by default. Use environment variables for sensitive credentials instead.</Li>
        <Li>Server-side plugin code runs with the permissions of the calling user — use <Code>createAdminClient()</Code> (service role) only when you need to bypass RLS for admin operations.</Li>
        <Li>Never expose plugin API keys to the client. All external API calls from plugins should be made in Server Components, Server Actions, or API routes.</Li>
        <Li>Validate all plugin setting inputs on the server — treat <Code>plugins.settings</Code> values as untrusted user input.</Li>
      </UL>

      <Note type="info">
        The plugin system is a <strong>feature-flag + convention</strong> system. It does not hot-load plugin code at runtime — all plugin code is compiled into the Next.js bundle at build time. Disabling a plugin hides/stops its execution, but does not remove the code. This is intentional for simplicity, type safety, and build-time optimization.
      </Note>
    </div>
  ),

  products: (
    <div>
      <H1>Products</H1>
      <P>Manage your store's product catalogue at <Code>Dashboard → Products</Code>.</P>
      <H2>Product Types</H2>
      <Table
        headers={["Type", "Description"]}
        rows={[
          ["Simple", "Single product with one price and SKU"],
          ["Variable", "Product with variants (size, colour, etc.) each with own price/stock"],
          ["Digital", "Downloadable product — no shipping required"],
        ]}
      />
      <H2>Product Fields</H2>
      <Table
        headers={["Field", "Description"]}
        rows={[
          ["Name & Slug", "Product title and URL-friendly identifier"],
          ["Description", "Full product description"],
          ["Short Description", "Brief summary shown in listings"],
          ["Price", "Selling price"],
          ["Compare Price", "Original price (shows as strikethrough)"],
          ["Cost Price", "Your cost (for margin calculation)"],
          ["SKU / Barcode", "Stock keeping unit and barcode"],
          ["Track Inventory", "Enable stock level management"],
          ["Stock Quantity", "Current stock count"],
          ["Low Stock Threshold", "Alert level for low stock"],
          ["Weight", "For shipping calculation"],
          ["Images", "Multiple product images (JSON array of URLs)"],
          ["Featured", "Highlight in products grid block"],
        ]}
      />
      <H2>Product Variants</H2>
      <P>For Variable products, add variants in the variants section. Each variant has its own SKU, price, compare price, stock quantity, and option values (e.g. <Code>{"{ size: 'L', color: 'Blue' }"}</Code>).</P>
    </div>
  ),

  orders: (
    <div>
      <H1>Orders</H1>
      <P>View and manage customer orders at <Code>Dashboard → Orders</Code>.</P>
      <H2>Order Statuses</H2>
      <Table
        headers={["Status", "Meaning"]}
        rows={[
          ["pending", "Received but not yet processed"],
          ["processing", "Being fulfilled"],
          ["on_hold", "Awaiting action (e.g. payment confirmation)"],
          ["completed", "Fulfilled and delivered"],
          ["cancelled", "Cancelled by customer or admin"],
          ["refunded", "Payment returned"],
          ["failed", "Payment failed"],
        ]}
      />
      <H2>Payment Statuses</H2>
      <Table
        headers={["Status", "Meaning"]}
        rows={[
          ["pending", "Awaiting payment"],
          ["paid", "Payment received"],
          ["failed", "Payment declined"],
          ["refunded", "Full refund issued"],
          ["partially_refunded", "Partial refund issued"],
        ]}
      />
      <P>Orders are also pushed to Supabase Realtime so you can build live order notification features.</P>
    </div>
  ),

  payments: (
    <div>
      <H1>Payment Gateways</H1>
      <P>Configure payment methods at <Code>Dashboard → Payments</Code>. Toggle each gateway on/off and enter credentials.</P>
      <H2>Available Gateways</H2>
      <Table
        headers={["Gateway", "Region", "Currencies", "Required Credentials"]}
        rows={[
          ["Manual Payment", "Global", "USD, EUR, GBP, BDT", "Instructions text only"],
          ["Stripe", "Global", "USD, EUR, GBP, CAD, AUD", "Publishable Key, Secret Key, Webhook Secret"],
          ["PayPal", "Global", "USD, EUR, GBP, CAD, AUD", "Client ID, Client Secret"],
          ["SSLCommerz", "Bangladesh", "BDT, USD", "Store ID, Store Password"],
          ["ShurjoPay", "Bangladesh", "BDT", "Merchant Username, Password, Prefix, Return URL"],
          ["bKash", "Bangladesh", "BDT", "App Key, App Secret, Username, Password"],
          ["Nagad", "Bangladesh", "BDT", "Merchant ID, Merchant Number, Public Key, Private Key"],
        ]}
      />
      <H2>Enabling a Gateway</H2>
      <UL>
        <Li>Go to <Code>Dashboard → Payments</Code></Li>
        <Li>Toggle the gateway on</Li>
        <Li>Enter the required credentials (stored encrypted in Supabase)</Li>
        <Li>Enable Test Mode for development (uses sandbox/test credentials)</Li>
        <Li>Click Save</Li>
      </UL>
      <Note type="warn">Never expose secret API keys in client-side code. All payment processing must happen in server-side API routes (<Code>src/app/api/</Code>).</Note>
      <H2>Ecommerce Settings</H2>
      <P>Configure currency, tax rate, guest checkout, and stock management at <Code>Dashboard → Settings → Ecommerce</Code>.</P>
    </div>
  ),

  delivery: (
    <div>
      <H1>Delivery Options</H1>
      <P>Configure shipping methods at <Code>Dashboard → Delivery</Code>.</P>
      <H2>Delivery Option Fields</H2>
      <Table
        headers={["Field", "Description"]}
        rows={[
          ["Name", "e.g. Standard Delivery, Express, Free Shipping"],
          ["Description", "Details shown to customer at checkout"],
          ["Price", "Flat rate shipping cost"],
          ["Estimated Days", "e.g. '3-5 business days'"],
          ["Enabled", "Toggle to show/hide at checkout"],
          ["Order Index", "Sort order in the checkout list"],
        ]}
      />
    </div>
  ),

  accounting: (
    <div>
      <H1>Accounting Overview</H1>
      <P>The accounting module at <Code>Dashboard → Accounting</Code> provides basic bookkeeping for your business.</P>
      <H2>Dashboard Stats</H2>
      <UL>
        <Li><strong>Monthly Income</strong> — Sum of all income transactions this calendar month</Li>
        <Li><strong>Monthly Expenses</strong> — Sum of all expense transactions this calendar month</Li>
        <Li><strong>Net Profit</strong> — Income minus Expenses</Li>
        <Li><strong>Today's Revenue</strong> — Income recorded today</Li>
      </UL>
      <H2>Accounts</H2>
      <P>Accounts represent real-world financial accounts. Types: <Code>cash</Code>, <Code>bank</Code>, <Code>credit</Code>, <Code>investment</Code>. Each account tracks a running balance and currency.</P>
      <H2>Transaction Types</H2>
      <Table
        headers={["Type", "Description"]}
        rows={[
          ["income", "Money received (sales, fees, etc.)"],
          ["expense", "Money spent (costs, bills, etc.)"],
          ["transfer", "Movement between internal accounts"],
          ["donation", "Charitable donation received"],
          ["refund", "Money returned to a customer"],
        ]}
      />
      <H2>Public Donation Feed</H2>
      <P>Set any transaction's <Code>is_public = true</Code> to display it on the frontend via the <strong>Donation/Transaction Feed</strong> block in the page builder. This is perfect for NGOs and fundraising pages showing real-time donor walls.</P>
    </div>
  ),

  transactions: (
    <div>
      <H1>Transactions</H1>
      <P>Manage all financial records at <Code>Dashboard → Accounting → Transactions</Code>.</P>
      <H2>Transaction Fields</H2>
      <Table
        headers={["Field", "Description"]}
        rows={[
          ["Type", "income / expense / transfer / donation / refund"],
          ["Amount", "Transaction amount"],
          ["Currency", "USD, BDT, EUR, etc."],
          ["Description", "What this transaction is for"],
          ["Category", "Optional grouping label"],
          ["Reference", "Invoice number, receipt ID, etc."],
          ["Account", "Which account this affects"],
          ["Date", "Transaction date (defaults to today)"],
          ["Customer Name / Email", "Optional donor or customer info"],
          ["Message", "Public message (for donation feed)"],
          ["Is Public", "Show this transaction on the public site"],
          ["Status", "pending / completed / cancelled / reconciled"],
        ]}
      />
      <Note type="success">Transactions linked to orders are created automatically when a payment is received through a configured gateway.</Note>
    </div>
  ),

  "blocks-dev": (
    <div>
      <H1>Creating Custom Blocks</H1>
      <P>Passive Coder uses a block registry pattern. Each block type is defined once and can be used anywhere in the builder.</P>
      <H2>Step 1 — Define the Block Type</H2>
      <P>Add your block's data type to <Code>src/types/cms.ts</Code>:</P>
      <Pre>{`// In types/cms.ts
export type MyBlockData = {
  title: string;
  content: string;
  imageUrl?: string;
};

export type MyBlockProps = BlockBase & {
  type: "my_block";
  data: MyBlockData;
};

// Add to the Block union type:
export type Block = HeroBlockProps | ... | MyBlockProps;`}</Pre>
      <H2>Step 2 — Register the Block</H2>
      <P>Add to <Code>src/modules/page-builder/block-registry.ts</Code>:</P>
      <Pre>{`{
  type: "my_block",
  label: "My Block",
  description: "A custom block",
  icon: "🧩",
  category: "content",
  create: (): MyBlockProps => ({
    id: generateId(),
    type: "my_block",
    visible: true,
    order: 0,
    padding: DEFAULT_PADDING,
    margin: DEFAULT_MARGIN,
    background: DEFAULT_BACKGROUND,
    data: {
      title: "My Block Title",
      content: "Add your content here",
    },
  }),
},`}</Pre>
      <H2>Step 3 — Create the Block Component</H2>
      <P>Create <Code>src/components/blocks/my-block/my-block.tsx</Code>:</P>
      <Pre>{`import type { MyBlockProps } from "@/types/cms";

export function MyBlock({ block }: { block: MyBlockProps }) {
  const { title, content, imageUrl } = block.data;
  return (
    <div className="max-w-5xl mx-auto py-8">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-muted-foreground mt-4">{content}</p>
    </div>
  );
}`}</Pre>
      <H2>Step 4 — Add to Renderers</H2>
      <P>Add a case to <strong>both</strong> renderers:</P>
      <Pre>{`// In block-renderer.tsx (client — builder canvas):
import { MyBlock } from "@/components/blocks/my-block/my-block";
case "my_block": return <MyBlock block={block} />;

// In page-renderer.tsx (server — public site):
import { MyBlock } from "@/components/blocks/my-block/my-block";
case "my_block": content = <MyBlock block={block} />; break;`}</Pre>
      <H2>Step 5 — Add a Settings Panel</H2>
      <P>Create a settings component in <Code>src/components/admin/page-builder/settings-panel/</Code> and wire it up in the settings panel switch statement.</P>
      <Note type="success">If your block needs server-side data (e.g. database queries), make it an async RSC and add it only to <Code>page-renderer.tsx</Code>. In <Code>block-renderer.tsx</Code> show a <Code>DataBlockPlaceholder</Code> instead.</Note>
    </div>
  ),

  database: (
    <div>
      <H1>Database Schema</H1>
      <P>All tables live in the <Code>public</Code> schema on Supabase (PostgreSQL). The full schema is in <Code>supabase/migrations/001_initial_schema.sql</Code>.</P>
      <H2>Tables</H2>
      <Table
        headers={["Table", "Purpose"]}
        rows={[
          ["profiles", "User accounts and roles (linked to auth.users)"],
          ["site_settings", "Global site configuration (one row)"],
          ["media", "Uploaded file metadata"],
          ["categories", "Content and product categories"],
          ["tags", "Content and product tags"],
          ["pages", "Pages and posts (type field differentiates)"],
          ["page_categories", "Many-to-many: pages ↔ categories"],
          ["page_tags", "Many-to-many: pages ↔ tags"],
          ["themes", "Installed themes"],
          ["plugins", "Installed plugins"],
          ["products", "Ecommerce products"],
          ["product_variants", "Product variant SKUs and pricing"],
          ["orders", "Customer orders"],
          ["payment_gateways", "Gateway config and credentials"],
          ["delivery_options", "Shipping methods"],
          ["accounts", "Accounting accounts (bank, cash, etc.)"],
          ["transactions", "Financial transactions"],
          ["ecommerce_settings", "Ecommerce config (currency, tax, etc.)"],
          ["menus", "Navigation menu definitions"],
          ["forms", "Form builder definitions"],
          ["form_submissions", "Submitted form data"],
        ]}
      />
      <H2>Key Design Decisions</H2>
      <UL>
        <Li>Blocks are stored as <Code>jsonb</Code> in <Code>pages.blocks</Code> — no separate block table needed</Li>
        <Li>SEO metadata stored as <Code>jsonb</Code> in <Code>pages.seo</Code></Li>
        <Li>Payment gateway credentials stored as <Code>jsonb</Code> in <Code>payment_gateways.settings</Code></Li>
        <Li>Realtime enabled on <Code>orders</Code> and <Code>transactions</Code> tables</Li>
        <Li>All tables have <Code>updated_at</Code> auto-trigger</Li>
        <Li>New auth users automatically get a <Code>profiles</Code> row via the <Code>handle_new_user</Code> trigger</Li>
      </UL>
    </div>
  ),

  rls: (
    <div>
      <H1>Security & Row Level Security</H1>
      <P>Every table has RLS (Row Level Security) enabled. Policies control exactly what each user can read or write.</P>
      <H2>Policy Patterns</H2>
      <Table
        headers={["Pattern", "Example"]}
        rows={[
          ["Public read", "published pages, active themes, site settings"],
          ["Auth read", "media library, plugins list"],
          ["Role-based write", "editors can manage pages, admins manage settings"],
          ["Own-record", "users can update their own profile"],
          ["Service role", "server-side code uses service_role key to bypass RLS"],
        ]}
      />
      <H2>Role Hierarchy</H2>
      <Table
        headers={["Role", "Can Do"]}
        rows={[
          ["admin", "Everything — full system access"],
          ["editor", "Manage pages, posts, media, products, orders, transactions"],
          ["author", "Create and edit own pages and posts"],
          ["contributor", "Submit content for review"],
          ["subscriber", "View protected content"],
          ["customer", "Place orders and view own orders"],
        ]}
      />
      <Note type="warn">The admin layout uses the <strong>service role key</strong> to fetch the user's profile. This bypasses RLS to avoid the recursion issue with self-referencing policies. Never expose the service role key to the browser.</Note>
      <H2>Important RLS Note</H2>
      <P>Admin-role policies on tables that reference the <Code>profiles</Code> table use a subquery pattern to avoid infinite recursion:</P>
      <Pre>{`-- Safe: subquery reads profiles once
CREATE POLICY "Editors manage pages" ON public.pages
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
    IN ('admin','editor','author')
  );

-- Dangerous: self-referencing causes infinite recursion (42P17)
-- DO NOT use this pattern on the profiles table itself`}</Pre>
    </div>
  ),

  api: (
    <div>
      <H1>API Reference</H1>
      <P>Passive Coder uses Supabase's auto-generated REST API for all data operations. You can also create custom Next.js API routes in <Code>src/app/api/</Code>.</P>
      <H2>Supabase Client Usage</H2>
      <Pre>{`// Server components / API routes
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient(); // uses cookies for auth

// Client components
import { createClient } from "@/lib/supabase/client";
const supabase = createClient(); // browser-side

// Server-side admin (bypasses RLS)
import { createAdminClient } from "@/lib/supabase/server";
const supabase = await createAdminClient(); // service_role key`}</Pre>
      <H2>Common Queries</H2>
      <Pre>{`// Fetch a published page by slug
const { data } = await supabase
  .from("pages")
  .select("*")
  .eq("slug", "home")
  .eq("status", "published")
  .single();

// List products
const { data } = await supabase
  .from("products")
  .select("*")
  .eq("status", "active")
  .order("created_at", { ascending: false });

// Insert a transaction
const { data } = await supabase
  .from("transactions")
  .insert({ type: "income", amount: 100, currency: "USD", description: "Sale", date: new Date() })
  .select("id")
  .single();`}</Pre>
      <H2>Realtime Subscriptions</H2>
      <Pre>{`const supabase = createClient();
const channel = supabase
  .channel("orders")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
    console.log("New order:", payload.new);
  })
  .subscribe();

// Cleanup
supabase.removeChannel(channel);`}</Pre>
    </div>
  ),

  users: (
    <div>
      <H1>User Roles</H1>
      <P>User accounts are managed through Supabase Auth. Each auth user has a corresponding row in the <Code>public.profiles</Code> table with a <Code>role</Code> field.</P>
      <H2>Creating a New Admin User</H2>
      <UL>
        <Li>The user signs up via <Code>/login</Code> (or you create them in the Supabase Auth dashboard)</Li>
        <Li>A profile row is auto-created with <Code>role = 'subscriber'</Code></Li>
        <Li>Run in SQL Editor: <Code>UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';</Code></Li>
      </UL>
      <H2>Changing a User's Role</H2>
      <Pre>{`UPDATE public.profiles
SET role = 'editor'
WHERE email = 'editor@example.com';`}</Pre>
      <H2>Role Access Matrix</H2>
      <Table
        headers={["Feature", "Admin", "Editor", "Author"]}
        rows={[
          ["Access admin panel", "✓", "✓", "✓"],
          ["Manage all pages", "✓", "✓", "Own only"],
          ["Manage all posts", "✓", "✓", "Own only"],
          ["Manage media", "✓", "✓", "✓"],
          ["Manage products", "✓", "✓", "✗"],
          ["Manage orders", "✓", "✓", "✗"],
          ["Manage themes", "✓", "✗", "✗"],
          ["Manage plugins", "✓", "✗", "✗"],
          ["Manage settings", "✓", "✗", "✗"],
          ["Manage users", "✓", "✗", "✗"],
          ["Manage gateways", "✓", "✗", "✗"],
          ["Accounting", "✓", "✓", "✗"],
        ]}
      />
    </div>
  ),

  deployment: (
    <div>
      <H1>Deployment</H1>
      <H2>Vercel (Recommended)</H2>
      <UL>
        <Li>Push your code to GitHub</Li>
        <Li>Import the repo in Vercel</Li>
        <Li>Add all environment variables from <Code>.env.local</Code></Li>
        <Li>Deploy — Vercel auto-detects Next.js and handles everything</Li>
      </UL>
      <Note type="info">Set <Code>NEXT_PUBLIC_APP_URL</Code> to your production domain in Vercel's environment variables.</Note>
      <H2>Self-Hosted (Docker / VPS)</H2>
      <Pre>{`npm run build
npm start
# or with PM2:
pm2 start npm --name "cms" -- start`}</Pre>
      <H2>Environment Variables for Production</H2>
      <Table
        headers={["Variable", "Required", "Notes"]}
        rows={[
          ["NEXT_PUBLIC_SUPABASE_URL", "Yes", "Your Supabase project URL"],
          ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Yes", "Public anon key"],
          ["SUPABASE_SERVICE_ROLE_KEY", "Yes", "Server-only — never expose to browser"],
          ["DATABASE_URL", "For scripts only", "Direct Postgres connection string"],
          ["NEXT_PUBLIC_APP_URL", "Yes", "Your production domain"],
        ]}
      />
      <H2>Supabase Production Checklist</H2>
      <UL>
        <Li>Enable email confirmation in Supabase Auth settings</Li>
        <Li>Configure a custom SMTP provider for auth emails</Li>
        <Li>Set up Supabase Storage bucket named <Code>media</Code> with public access</Li>
        <Li>Enable Realtime on <Code>orders</Code> and <Code>transactions</Code> tables</Li>
        <Li>Review and tighten RLS policies for your use case</Li>
        <Li>Set up database backups (Supabase Pro provides daily backups)</Li>
      </UL>
    </div>
  ),

  settings: (
    <div>
      <H1>Site Settings</H1>
      <P>All settings are accessible from <Code>Dashboard → Settings</Code>.</P>
      <H2>General Settings</H2>
      <Table
        headers={["Setting", "Description"]}
        rows={[
          ["Site Name", "Displayed in the browser tab and as default OG title"],
          ["Site Description", "Default meta description"],
          ["Site URL", "Your production domain"],
          ["Maintenance Mode", "Shows a maintenance page to all visitors when enabled"],
        ]}
      />
      <H2>SEO Settings</H2>
      <Table
        headers={["Setting", "Description"]}
        rows={[
          ["Default Meta Title", "Fallback title when a page has no SEO title"],
          ["Default Meta Description", "Fallback description for search engines"],
        ]}
      />
      <H2>Appearance Settings</H2>
      <P>Found at <Code>Dashboard → Settings → Appearance</Code>.</P>
      <Table
        headers={["Setting", "Description"]}
        rows={[
          ["Frontend Theme", "Light / Dark / System — controls public site colour scheme. Separate from the admin panel toggle."],
          ["Custom CSS", "Global CSS injected into every public page"],
          ["Custom JavaScript", "Global JS injected into every public page"],
          ["Analytics Code", "Google Analytics, Plausible, or any tracking script"],
        ]}
      />
      <Note type="info">
        <strong>Admin theme</strong> (top-right toggle in the admin panel) stores preference in <Code>localStorage</Code> under key <Code>cms-theme</Code> — it only affects the admin interface and is per-browser.{" "}
        <strong>Frontend theme</strong> (<Code>Settings → Appearance</Code>) stores the choice in <Code>site_settings.site_theme</Code> in the database — it affects all visitors to the public website.
      </Note>
      <H2>Ecommerce Settings</H2>
      <P>Accessed via <Code>Dashboard → Settings → Ecommerce</Code> or <Code>Dashboard → Ecommerce → Settings</Code>.</P>
      <Table
        headers={["Setting", "Description"]}
        rows={[
          ["Enable Ecommerce", "Master toggle for all ecommerce features"],
          ["Currency Code", "ISO currency code (USD, BDT, EUR, etc.)"],
          ["Currency Symbol", "Symbol shown in prices ($, ৳, €, etc.)"],
          ["Symbol Position", "Before or after the amount"],
          ["Tax Rate", "Percentage applied at checkout"],
          ["Tax Inclusive", "Whether prices already include tax"],
          ["Stock Management", "Track inventory levels"],
          ["Guest Checkout", "Allow orders without an account"],
        ]}
      />
    </div>
  ),
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeId, setActiveId] = useState("overview");

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r overflow-y-auto bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Documentation</span>
          </div>
        </div>
        <nav className="p-2 space-y-4">
          {chapters.map((chapter) => (
            <div key={chapter.title}>
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {chapter.title}
              </p>
              <ul className="space-y-0.5">
                {chapter.sections.map((sec) => (
                  <li key={sec.id}>
                    <button
                      onClick={() => setActiveId(sec.id)}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left",
                        activeId === sec.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <sec.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{sec.label}</span>
                      {activeId === sec.id && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {sections[activeId] ?? (
            <div className="text-muted-foreground text-sm">Select a section from the sidebar.</div>
          )}
          {/* Footer */}
          <div className="mt-16 pt-6 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>Passive Coder Documentation</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
