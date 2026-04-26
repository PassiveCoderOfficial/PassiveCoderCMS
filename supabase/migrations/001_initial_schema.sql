-- ============================================================
-- CMS Initial Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ─── Users / Profiles ───────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'subscriber' check (role in ('admin','editor','author','contributor','subscriber','customer')),
  is_active boolean not null default true,
  bio text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can manage profiles" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Site Settings ───────────────────────────────────────────
create table public.site_settings (
  id uuid primary key default uuid_generate_v4(),
  site_name text not null default 'My CMS Site',
  site_description text default '',
  site_url text default '',
  logo_url text,
  favicon_url text,
  timezone text not null default 'UTC',
  language text not null default 'en',
  maintenance_mode boolean not null default false,
  meta_title text,
  meta_description text,
  analytics_code text,
  custom_css text,
  custom_js text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy "Settings readable by all" on public.site_settings for select using (true);
create policy "Only admins can modify settings" on public.site_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
insert into public.site_settings (site_name) values ('My CMS Site');

-- ─── Media Library ───────────────────────────────────────────
create table public.media (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  original_name text not null,
  url text not null,
  thumbnail_url text,
  mime_type text not null,
  size bigint not null default 0,
  width int,
  height int,
  alt text,
  caption text,
  folder text default '/',
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.media enable row level security;
create policy "Media readable by authenticated users" on public.media for select using (auth.uid() is not null);
create policy "Editors can upload media" on public.media for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor','author'))
);
create policy "Admins can manage all media" on public.media for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);
create policy "Users can manage own media" on public.media for all using (uploaded_by = auth.uid());

-- ─── Categories & Tags ───────────────────────────────────────
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  parent_id uuid references public.categories(id) on delete set null,
  type text not null default 'post' check (type in ('post','product')),
  image_url text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Categories public read" on public.categories for select using (true);
create policy "Admins manage categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);

create table public.tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  type text not null default 'post' check (type in ('post','product')),
  created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
create policy "Tags public read" on public.tags for select using (true);
create policy "Admins manage tags" on public.tags for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);

-- ─── Pages / Posts ───────────────────────────────────────────
create table public.pages (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  type text not null default 'page' check (type in ('page','post','landing','portfolio')),
  status text not null default 'draft' check (status in ('draft','published','scheduled','archived')),
  blocks jsonb not null default '[]',
  template_id uuid,
  parent_id uuid references public.pages(id) on delete set null,
  featured_image text,
  excerpt text,
  seo jsonb not null default '{}',
  settings jsonb not null default '{"show_header":true,"show_footer":true}',
  order_index int not null default 0,
  published_at timestamptz,
  scheduled_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pages enable row level security;
create policy "Published pages public" on public.pages for select using (status = 'published' or auth.uid() is not null);
create policy "Editors manage pages" on public.pages for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor','author'))
);

create table public.page_categories (
  page_id uuid references public.pages(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (page_id, category_id)
);

create table public.page_tags (
  page_id uuid references public.pages(id) on delete cascade,
  tag_id uuid references public.tags(id) on delete cascade,
  primary key (page_id, tag_id)
);

-- ─── Themes ──────────────────────────────────────────────────
create table public.themes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  author text,
  version text not null default '1.0.0',
  preview_url text,
  thumbnail text,
  is_active boolean not null default false,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.themes enable row level security;
create policy "Themes public read" on public.themes for select using (true);
create policy "Admins manage themes" on public.themes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── Plugins ─────────────────────────────────────────────────
create table public.plugins (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  version text not null default '1.0.0',
  author text,
  is_active boolean not null default false,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.plugins enable row level security;
create policy "Plugins readable by authenticated" on public.plugins for select using (auth.uid() is not null);
create policy "Admins manage plugins" on public.plugins for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── Ecommerce ────────────────────────────────────────────────
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  type text not null default 'simple' check (type in ('simple','variable','digital')),
  status text not null default 'draft' check (status in ('active','draft','archived')),
  price numeric(12,2) not null default 0,
  compare_price numeric(12,2),
  cost_price numeric(12,2),
  sku text,
  barcode text,
  track_inventory boolean not null default true,
  stock_quantity int not null default 0,
  low_stock_threshold int not null default 5,
  weight numeric(8,3),
  images jsonb not null default '[]',
  category_ids jsonb not null default '[]',
  tag_ids jsonb not null default '[]',
  attributes jsonb not null default '[]',
  seo jsonb not null default '{}',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "Active products public" on public.products for select using (status = 'active' or auth.uid() is not null);
create policy "Admins manage products" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);

create table public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  name text not null,
  sku text,
  price numeric(12,2) not null,
  compare_price numeric(12,2),
  stock_quantity int not null default 0,
  attributes jsonb not null default '{}',
  image text,
  created_at timestamptz not null default now()
);
alter table public.product_variants enable row level security;
create policy "Variants public read" on public.product_variants for select using (true);
create policy "Admins manage variants" on public.product_variants for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text not null unique,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_email text not null,
  customer_name text not null,
  status text not null default 'pending' check (status in ('pending','processing','on_hold','completed','cancelled','refunded','failed')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded','partially_refunded')),
  payment_method text,
  items jsonb not null default '[]',
  billing_address jsonb not null default '{}',
  shipping_address jsonb,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  transaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Customers see own orders" on public.orders for select using (customer_id = auth.uid() or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);
create policy "Admins manage orders" on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);
create policy "Public can create orders" on public.orders for insert with check (true);

create table public.payment_gateways (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  is_enabled boolean not null default false,
  is_test_mode boolean not null default true,
  settings jsonb not null default '{}',
  icon text,
  supported_currencies jsonb not null default '["USD"]',
  created_at timestamptz not null default now()
);
alter table public.payment_gateways enable row level security;
create policy "Active gateways public" on public.payment_gateways for select using (is_enabled = true or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins manage gateways" on public.payment_gateways for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Seed default payment gateways
insert into public.payment_gateways (name, slug, description, supported_currencies) values
  ('Manual Payment', 'manual', 'Accept payments manually (bank transfer, cash, etc.)', '["USD","EUR","GBP","BDT"]'),
  ('Stripe', 'stripe', 'Accept credit/debit card payments via Stripe', '["USD","EUR","GBP","CAD","AUD"]'),
  ('PayPal', 'paypal', 'Accept payments via PayPal', '["USD","EUR","GBP","CAD","AUD"]'),
  ('SSLCommerz', 'sslcommerz', 'Bangladesh payment gateway (SSL Wireless)', '["BDT","USD"]'),
  ('ShurjoPay', 'shurjopay', 'Bangladesh payment gateway by ShurjoPay', '["BDT"]'),
  ('bKash', 'bkash', 'Mobile banking payment gateway by bKash', '["BDT"]'),
  ('Nagad', 'nagad', 'Mobile banking payment gateway by Nagad', '["BDT"]');

create table public.delivery_options (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(8,2) not null default 0,
  estimated_days text,
  is_enabled boolean not null default true,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.delivery_options enable row level security;
create policy "Active delivery public" on public.delivery_options for select using (is_enabled = true or
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins manage delivery" on public.delivery_options for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ─── Accounting ───────────────────────────────────────────────
create table public.accounts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('cash','bank','credit','investment')),
  currency text not null default 'USD',
  balance numeric(15,2) not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.accounts enable row level security;
create policy "Admins manage accounts" on public.accounts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);

create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('income','expense','transfer','donation','refund')),
  status text not null default 'completed' check (status in ('pending','completed','cancelled','reconciled')),
  amount numeric(15,2) not null,
  currency text not null default 'USD',
  description text not null,
  reference text,
  category text,
  account_id uuid references public.accounts(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  customer_name text,
  customer_email text,
  message text,
  is_public boolean not null default false,
  date date not null default current_date,
  created_at timestamptz not null default now()
);
alter table public.transactions enable row level security;
create policy "Public transactions readable" on public.transactions for select using (is_public = true or
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);
create policy "Admins manage transactions" on public.transactions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);

-- ─── Ecommerce Settings ───────────────────────────────────────
create table public.ecommerce_settings (
  id uuid primary key default uuid_generate_v4(),
  is_enabled boolean not null default false,
  currency text not null default 'USD',
  currency_symbol text not null default '$',
  currency_position text not null default 'before' check (currency_position in ('before','after')),
  tax_rate numeric(5,2) not null default 0,
  tax_inclusive boolean not null default false,
  stock_management boolean not null default true,
  guest_checkout boolean not null default true,
  terms_page_id uuid references public.pages(id),
  privacy_page_id uuid references public.pages(id),
  success_page_id uuid references public.pages(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ecommerce_settings enable row level security;
create policy "Ecommerce settings public read" on public.ecommerce_settings for select using (true);
create policy "Admins manage ecommerce settings" on public.ecommerce_settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
insert into public.ecommerce_settings default values;

-- ─── Navigation Menus ─────────────────────────────────────────
create table public.menus (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  items jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.menus enable row level security;
create policy "Menus public read" on public.menus for select using (true);
create policy "Admins manage menus" on public.menus for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);

-- ─── Forms ───────────────────────────────────────────────────
create table public.forms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  fields jsonb not null default '[]',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table public.form_submissions (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid references public.forms(id) on delete cascade,
  data jsonb not null default '{}',
  ip_address text,
  created_at timestamptz not null default now()
);
alter table public.forms enable row level security;
alter table public.form_submissions enable row level security;
create policy "Forms public read" on public.forms for select using (true);
create policy "Public submit forms" on public.form_submissions for insert with check (true);
create policy "Admins read submissions" on public.form_submissions for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'))
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_pages_slug on public.pages(slug);
create index idx_pages_status on public.pages(status);
create index idx_pages_type on public.pages(type);
create index idx_products_slug on public.products(slug);
create index idx_products_status on public.products(status);
create index idx_transactions_date on public.transactions(date desc);
create index idx_transactions_public on public.transactions(is_public, date desc);
create index idx_orders_customer on public.orders(customer_id);
create index idx_orders_status on public.orders(status);
create index idx_media_folder on public.media(folder);
create index idx_profiles_role on public.profiles(role);

-- ─── Updated_at triggers ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger set_pages_updated_at before update on public.pages for each row execute function public.set_updated_at();
create trigger set_products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
create trigger set_ecom_settings_updated_at before update on public.ecommerce_settings for each row execute function public.set_updated_at();

-- ─── Realtime ─────────────────────────────────────────────────
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.orders;
