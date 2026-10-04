-- Platform launch offer (2026-10-04): yearly BDT prices cut; the regular
-- price is kept so the pricing section can show it struck through.
-- To end the offer: set price_yearly_bdt back to price_yearly_bdt_regular
-- and clear price_yearly_bdt_regular / promo_label.
alter table public.plans add column if not exists price_yearly_bdt_regular integer;
alter table public.plans add column if not exists promo_label text;
update public.plans set price_yearly_bdt_regular = 32000, price_yearly_bdt = 15000, promo_label = 'Platform launch offer' where id = 'basic';
update public.plans set price_yearly_bdt_regular = 60000, price_yearly_bdt = 30000, promo_label = 'Platform launch offer' where id = 'pro';
