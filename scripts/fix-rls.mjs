import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://mljchiaabgvdzdsfobxs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samNoaWFhYmd2ZHpkc2ZvYnhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA4NDY5MywiZXhwIjoyMDkyNjYwNjkzfQ.XRbc2vlAhbQWNRv4qIaU161_S7xBvEoVcnzripB92gI"
);

// Run each statement one at a time via the DB connection URL using node-postgres
import pg from "pg";

const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres.mljchiaabgvdzdsfobxs:ChlWIFa6HIc38HmH@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
});

const statements = [
  `DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles`,
  `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles`,
  `DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles`,
  `CREATE POLICY "Profiles readable by all" ON public.profiles FOR SELECT USING (true)`,
  `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id)`,
  `CREATE POLICY "Service role full access" ON public.profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`,
  `DROP POLICY IF EXISTS "Editors manage pages" ON public.pages`,
  `CREATE POLICY "Editors manage pages" ON public.pages FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor','author'))`,
  `DROP POLICY IF EXISTS "Admins manage products" ON public.products`,
  `CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
  `DROP POLICY IF EXISTS "Admins manage orders" ON public.orders`,
  `CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
  `DROP POLICY IF EXISTS "Admins manage themes" ON public.themes`,
  `CREATE POLICY "Admins manage themes" ON public.themes FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`,
  `DROP POLICY IF EXISTS "Admins manage plugins" ON public.plugins`,
  `CREATE POLICY "Admins manage plugins" ON public.plugins FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`,
  `DROP POLICY IF EXISTS "Admins manage transactions" ON public.transactions`,
  `CREATE POLICY "Admins manage transactions" ON public.transactions FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
  `DROP POLICY IF EXISTS "Admins manage gateways" ON public.payment_gateways`,
  `CREATE POLICY "Admins manage gateways" ON public.payment_gateways FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`,
  `DROP POLICY IF EXISTS "Only admins can modify settings" ON public.site_settings`,
  `CREATE POLICY "Only admins can modify settings" ON public.site_settings FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`,
  `DROP POLICY IF EXISTS "Admins manage ecommerce settings" ON public.ecommerce_settings`,
  `CREATE POLICY "Admins manage ecommerce settings" ON public.ecommerce_settings FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`,
  `DROP POLICY IF EXISTS "Admins can manage all media" ON public.media`,
  `DROP POLICY IF EXISTS "Editors can upload media" ON public.media`,
  `CREATE POLICY "Editors can manage media" ON public.media FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor','author'))`,
  `DROP POLICY IF EXISTS "Admins manage categories" ON public.categories`,
  `CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
  `DROP POLICY IF EXISTS "Admins manage tags" ON public.tags`,
  `CREATE POLICY "Admins manage tags" ON public.tags FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
  `DROP POLICY IF EXISTS "Admins manage menus" ON public.menus`,
  `CREATE POLICY "Admins manage menus" ON public.menus FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
  `DROP POLICY IF EXISTS "Admins manage accounts" ON public.accounts`,
  `CREATE POLICY "Admins manage accounts" ON public.accounts FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
  `DROP POLICY IF EXISTS "Admins manage delivery" ON public.delivery_options`,
  `CREATE POLICY "Admins manage delivery" ON public.delivery_options FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')`,
  `DROP POLICY IF EXISTS "Admins read submissions" ON public.form_submissions`,
  `CREATE POLICY "Admins read submissions" ON public.form_submissions FOR SELECT USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
  `DROP POLICY IF EXISTS "Admins manage variants" ON public.product_variants`,
  `CREATE POLICY "Admins manage variants" ON public.product_variants FOR ALL USING (auth.uid() IS NOT NULL AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin','editor'))`,
];

async function main() {
  await client.connect();
  console.log("Connected. Fixing RLS policies...\n");

  for (const sql of statements) {
    const label = sql.slice(0, 70).replace(/\n/g, " ");
    try {
      await client.query(sql);
      console.log(`✓ ${label}`);
    } catch (e) {
      console.error(`✗ ${label}\n  → ${e.message}`);
    }
  }

  await client.end();
  console.log("\n✅ RLS policies fixed.");
}

main().catch(console.error);
