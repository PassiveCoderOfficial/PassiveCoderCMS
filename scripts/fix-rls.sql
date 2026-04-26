-- Fix infinite recursion in profiles RLS policies
-- The old policies referenced profiles table from within profiles policies, causing 42P17

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

-- Recreate safe policies with no self-references
-- Anyone can read profiles (needed for public pages showing author info)
CREATE POLICY "Profiles readable by all" ON public.profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Service role (used by server-side admin code) can do everything
CREATE POLICY "Service role full access" ON public.profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Also fix the same recursion pattern in other tables that reference profiles
-- pages
DROP POLICY IF EXISTS "Editors manage pages" ON public.pages;
CREATE POLICY "Editors manage pages" ON public.pages
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor','author')
  );

-- products
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );

-- orders
DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );

-- themes
DROP POLICY IF EXISTS "Admins manage themes" ON public.themes;
CREATE POLICY "Admins manage themes" ON public.themes
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- plugins
DROP POLICY IF EXISTS "Admins manage plugins" ON public.plugins;
CREATE POLICY "Admins manage plugins" ON public.plugins
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- transactions
DROP POLICY IF EXISTS "Admins manage transactions" ON public.transactions;
CREATE POLICY "Admins manage transactions" ON public.transactions
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );

-- payment_gateways
DROP POLICY IF EXISTS "Admins manage gateways" ON public.payment_gateways;
CREATE POLICY "Admins manage gateways" ON public.payment_gateways
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- site_settings
DROP POLICY IF EXISTS "Only admins can modify settings" ON public.site_settings;
CREATE POLICY "Only admins can modify settings" ON public.site_settings
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- ecommerce_settings
DROP POLICY IF EXISTS "Admins manage ecommerce settings" ON public.ecommerce_settings;
CREATE POLICY "Admins manage ecommerce settings" ON public.ecommerce_settings
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- media
DROP POLICY IF EXISTS "Admins can manage all media" ON public.media;
DROP POLICY IF EXISTS "Editors can upload media" ON public.media;
CREATE POLICY "Editors can manage media" ON public.media
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor','author')
  );

-- categories
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );

-- tags
DROP POLICY IF EXISTS "Admins manage tags" ON public.tags;
CREATE POLICY "Admins manage tags" ON public.tags
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );

-- menus
DROP POLICY IF EXISTS "Admins manage menus" ON public.menus;
CREATE POLICY "Admins manage menus" ON public.menus
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );

-- accounts
DROP POLICY IF EXISTS "Admins manage accounts" ON public.accounts;
CREATE POLICY "Admins manage accounts" ON public.accounts
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );

-- delivery_options
DROP POLICY IF EXISTS "Admins manage delivery" ON public.delivery_options;
CREATE POLICY "Admins manage delivery" ON public.delivery_options
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- form_submissions
DROP POLICY IF EXISTS "Admins read submissions" ON public.form_submissions;
CREATE POLICY "Admins read submissions" ON public.form_submissions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );

-- product_variants
DROP POLICY IF EXISTS "Admins manage variants" ON public.product_variants;
CREATE POLICY "Admins manage variants" ON public.product_variants
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) IN ('admin','editor')
  );
