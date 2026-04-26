-- Content sections: services, features, contact, portfolio, sliders,
--                   pricing packages, testimonials, booking
-- All tables carry tenant_id for multi-tenant isolation.

-- ── Service Groups & Items ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS service_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,          -- e.g. "Main Services", "Emergency Services"
  slug        text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_groups_tenant_idx ON service_groups(tenant_id);

CREATE TABLE IF NOT EXISTS service_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES service_groups(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  icon_type    text NOT NULL DEFAULT 'lucide' CHECK (icon_type IN ('lucide','image','emoji')),
  icon         text,          -- lucide icon name or emoji char
  image_url    text,          -- used when icon_type = image
  link         text,
  link_label   text DEFAULT 'Learn More',
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS service_items_group_idx ON service_items(group_id);
CREATE INDEX IF NOT EXISTS service_items_tenant_idx ON service_items(tenant_id);

-- ── Features Blurbs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS feature_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feature_groups_tenant_idx ON feature_groups(tenant_id);

CREATE TABLE IF NOT EXISTS feature_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES feature_groups(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text NOT NULL DEFAULT '',
  icon_type    text NOT NULL DEFAULT 'lucide' CHECK (icon_type IN ('lucide','image','emoji')),
  icon         text,
  image_url    text,
  link         text,
  link_label   text,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feature_items_group_idx ON feature_items(group_id);

-- ── Contact Details ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_details (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  label           text NOT NULL DEFAULT 'Main',  -- e.g. "Head Office", "Branch"
  address         text,
  phone           text,
  whatsapp        text,     -- WhatsApp number (may differ from phone)
  email           text,
  maps_embed_url  text,
  -- Floating button config
  floating_whatsapp  boolean NOT NULL DEFAULT false,
  floating_call      boolean NOT NULL DEFAULT false,
  floating_email     boolean NOT NULL DEFAULT false,
  floating_position  text NOT NULL DEFAULT 'bottom-right'
                     CHECK (floating_position IN ('bottom-right','bottom-left','top-right','top-left')),
  floating_color     text NOT NULL DEFAULT '#25D366',
  sort_order      integer NOT NULL DEFAULT 0,
  is_primary      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_details_tenant_idx ON contact_details(tenant_id);

-- ── Contact Forms ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contact_forms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,   -- "Main Contact Form", "Quote Request"
  fields       jsonb NOT NULL DEFAULT '[]',  -- [{name, type, label, required, options}]
  recipient_email  text,
  success_message  text NOT NULL DEFAULT 'Thank you! We will be in touch soon.',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_forms_tenant_idx ON contact_forms(tenant_id);

CREATE TABLE IF NOT EXISTS contact_form_submissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id      uuid NOT NULL REFERENCES contact_forms(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data         jsonb NOT NULL DEFAULT '{}',
  ip           text,
  read         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS form_submissions_form_idx ON contact_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS form_submissions_tenant_idx ON contact_form_submissions(tenant_id);

-- ── Portfolio Groups & Items ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_groups_tenant_idx ON portfolio_groups(tenant_id);

CREATE TABLE IF NOT EXISTS portfolio_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES portfolio_groups(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text,
  image_url    text NOT NULL,
  link         text,
  tags         text[] DEFAULT '{}',
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS portfolio_items_group_idx ON portfolio_items(group_id);

-- ── Slider Groups & Slides ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS slider_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  auto_play   boolean NOT NULL DEFAULT true,
  interval_ms integer NOT NULL DEFAULT 5000,
  show_arrows boolean NOT NULL DEFAULT true,
  show_dots   boolean NOT NULL DEFAULT true,
  height      text NOT NULL DEFAULT '500px',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS slider_groups_tenant_idx ON slider_groups(tenant_id);

CREATE TABLE IF NOT EXISTS slider_slides (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid NOT NULL REFERENCES slider_groups(id) ON DELETE CASCADE,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title        text,
  subtitle     text,
  description  text,
  image_url    text,
  button_label text,
  button_url   text,
  text_color   text DEFAULT '#ffffff',
  overlay      boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS slider_slides_group_idx ON slider_slides(group_id);

-- ── Pricing Packages ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pricing_tables (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,   -- "Main Pricing", "Service Packages"
  slug        text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pricing_tables_tenant_idx ON pricing_tables(tenant_id);

CREATE TABLE IF NOT EXISTS pricing_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id        uuid NOT NULL REFERENCES pricing_tables(id) ON DELETE CASCADE,
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  price           text NOT NULL,  -- stored as text ("$99", "Free", "Contact us")
  price_suffix    text DEFAULT '/month',
  is_featured     boolean NOT NULL DEFAULT false,
  badge           text,           -- "Most Popular", "Best Value"
  cta_label       text DEFAULT 'Get Started',
  cta_url         text,
  features        text[] DEFAULT '{}',
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pricing_packages_table_idx ON pricing_packages(table_id);

-- ── Testimonials (custom + platform) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS testimonial_groups (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  slug                 text NOT NULL,
  -- Platform integration toggles
  show_custom          boolean NOT NULL DEFAULT true,
  show_google          boolean NOT NULL DEFAULT false,
  show_trustpilot      boolean NOT NULL DEFAULT false,
  show_facebook        boolean NOT NULL DEFAULT false,
  -- Platform config
  google_place_id      text,
  trustpilot_domain    text,
  facebook_page_id     text,
  sort_order           integer NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS testimonial_groups_tenant_idx ON testimonial_groups(tenant_id);

CREATE TABLE IF NOT EXISTS testimonials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES testimonial_groups(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source      text NOT NULL DEFAULT 'custom'
              CHECK (source IN ('custom','google','trustpilot','facebook')),
  name        text NOT NULL,
  role        text,
  company     text,
  avatar      text,
  content     text NOT NULL,
  rating      integer CHECK (rating BETWEEN 1 AND 5),
  external_id text,   -- platform review ID for dedup
  published   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS testimonials_group_idx ON testimonials(group_id);
CREATE INDEX IF NOT EXISTS testimonials_tenant_idx ON testimonials(tenant_id);

-- ── Site Identity (logo + nav) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS site_identity (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url        text,
  logo_dark_url   text,   -- dark mode variant
  logo_width      integer DEFAULT 160,
  logo_alt        text,
  favicon_url     text,
  site_name       text,
  tagline         text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nav_menus (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,   -- "Main Nav", "Footer Nav"
  slug        text NOT NULL,
  items       jsonb NOT NULL DEFAULT '[]',  -- [{label, url, target, children:[]}]
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nav_menus_tenant_idx ON nav_menus(tenant_id);

-- ── Booking System ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_settings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  enabled              boolean NOT NULL DEFAULT false,
  service_name         text NOT NULL DEFAULT 'Appointment',
  slot_duration_mins   integer NOT NULL DEFAULT 60,
  buffer_mins          integer NOT NULL DEFAULT 15,   -- gap between bookings
  advance_days         integer NOT NULL DEFAULT 30,   -- how far ahead customers can book
  min_notice_hours     integer NOT NULL DEFAULT 2,    -- min hours before slot to book
  confirmation_mode    text NOT NULL DEFAULT 'manual' CHECK (confirmation_mode IN ('auto','manual')),
  success_message      text NOT NULL DEFAULT 'Your appointment request has been received!',
  notify_email         text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 6=Sat
  open_time   time NOT NULL,    -- e.g. 09:00
  close_time  time NOT NULL,    -- e.g. 17:00
  is_open     boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS booking_avail_tenant_idx ON booking_availability(tenant_id);

CREATE TABLE IF NOT EXISTS booking_blocked_dates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  reason      text,
  UNIQUE (tenant_id, blocked_date)
);

CREATE TABLE IF NOT EXISTS booking_appointments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date            date NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  customer_name   text NOT NULL,
  customer_email  text NOT NULL,
  customer_phone  text,
  message         text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  admin_note      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS appointments_tenant_date_idx ON booking_appointments(tenant_id, date);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON booking_appointments(status);

-- ── RLS (all tables use tenant isolation) ────────────────────────────────────

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'service_groups','service_items','feature_groups','feature_items',
    'contact_details','contact_forms','contact_form_submissions',
    'portfolio_groups','portfolio_items','slider_groups','slider_slides',
    'pricing_tables','pricing_packages','testimonial_groups','testimonials',
    'site_identity','nav_menus','booking_settings','booking_availability',
    'booking_blocked_dates','booking_appointments'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Members can read
    EXECUTE format(
      'DROP POLICY IF EXISTS "tenant_read" ON %1$I;
       CREATE POLICY "tenant_read" ON %1$I FOR SELECT USING (
         tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
       )', tbl
    );
    -- Members can write
    EXECUTE format(
      'DROP POLICY IF EXISTS "tenant_write" ON %1$I;
       CREATE POLICY "tenant_write" ON %1$I FOR ALL USING (
         tenant_id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid())
       )', tbl
    );
  END LOOP;
END $$;

-- Appointments & form submissions: also allow public insert (customers booking/submitting)
DROP POLICY IF EXISTS "public_book" ON booking_appointments;
CREATE POLICY "public_book" ON booking_appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "public_submit" ON contact_form_submissions;
CREATE POLICY "public_submit" ON contact_form_submissions FOR INSERT WITH CHECK (true);
