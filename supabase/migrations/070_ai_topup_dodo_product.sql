-- Each top-up package needs its own Dodo product (Dodo checkout requires a
-- product_id per SKU — no generic "charge this amount" API). SA creates the
-- product on the Dodo dashboard, pastes the ID here. Package stays
-- unpurchasable (button hidden) until this is set — no product ID means no
-- checkout, never a guess at a product to charge.
ALTER TABLE ai_generation_packages
  ADD COLUMN IF NOT EXISTS dodo_product_id text,
  ADD COLUMN IF NOT EXISTS dodo_product_id_sandbox text;
