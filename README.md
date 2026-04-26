# CMS Studio

A powerful, open-source CMS built with Next.js 15 and Supabase — designed for profile and portfolio websites but extensible to any use case.

## Features

### Page Builder
- Drag-and-drop block editor with live preview
- 14+ built-in blocks: Hero, Slider, Navigation, Text, Services, Blog, Gallery, CTA, Testimonials, Divider, Spacer, Ecommerce Products, Donation Feed, Custom HTML
- Responsive preview — desktop, tablet, mobile
- Undo/Redo history (50 steps)
- Per-block settings — layout, background (color/gradient/image), padding, margin, animation

### Pages & Posts
- Full CRUD with live page builder
- URL slug management, SEO meta tags, Open Graph
- Status: Draft → Published → Scheduled → Archived
- One-click duplicate

### Themes
- 6 built-in themes: Aurora, Minimal, Ocean, Sunset, Forest, Midnight
- Install & activate with one click
- Per-theme color, font, border radius settings

### Plugins
- 10 built-in plugins (SEO, Analytics, Contact Forms, Newsletter, Portfolio Pro, Booking, Live Chat, etc.)
- Install & activate/deactivate per plugin

### Ecommerce
- Simple, variable, and digital products
- Full inventory management
- 7 payment gateways: Manual, Stripe, PayPal, SSLCommerz, ShurjoPay, bKash, Nagad
- Per-gateway toggle, test mode, and credential management

### Accounting
- Daily bookkeeping with income/expense/donation types
- Public transaction feed (donation pages, transparency reports)
- Frontend blocks for displaying transactions publicly

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in **SQL Editor**: `supabase/migrations/001_initial_schema.sql`
3. Copy your API keys from **Settings → API**

### 3. Configure environment
```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Create your admin user
In Supabase → Authentication → Users → Add user, then:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Run
```bash
npm run dev
# Visit http://localhost:3000/admin/dashboard
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: Tailwind CSS v4 + Radix UI primitives
- **State**: Zustand + Immer
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form + Zod

## Project Structure

```
src/
├── app/(admin)/      # Protected admin routes
├── app/(auth)/       # Login pages
├── app/(site)/       # Public pages
├── components/
│   ├── admin/page-builder/  # Builder canvas, panels
│   ├── blocks/              # Block components
│   └── ui/                  # UI primitives
├── lib/supabase/     # DB client helpers
├── lib/store/        # Zustand stores
├── modules/          # Block registry, themes, plugins
└── types/cms.ts      # All TypeScript types
```

## License

MIT
