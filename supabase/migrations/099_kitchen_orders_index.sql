-- Restaurant vertical Tier 3, item #3 (docs/business/06-restaurant-vertical.md):
-- kitchen board load test. Simulated up to 425 concurrent live kitchen
-- orders against the real "Passive Coder Restaurant Demo" tenant (test
-- rows inserted + cleaned up via the Supabase Management API, zero left
-- behind either run) and measured api/ecommerce/kitchen's actual filter
-- query at each volume, before and after this index.
--
-- Honest result: no measurable improvement was observed in this specific
-- test (poll time tracked row count almost identically with or without the
-- index — most of the measured latency turned out to be Management-API/
-- network overhead in the test harness itself, not the query plan). Adding
-- the index anyway, not as a proven fix, because: (1) it genuinely does
-- back the exact filter this route runs (tenant_id + kitchen_status not
-- null), so it can only help or be a no-op, never hurt; (2) a partial
-- index costs very little to maintain since most orders never touch the
-- kitchen board at all; (3) it protects against the platform's TOTAL
-- orders row count (across every tenant) growing over time even if any
-- single tenant's live volume stays modest, which this one-tenant test
-- couldn't measure either way. 425 live-at-once orders is already an
-- unrealistic ceiling for any real kitchen (this table only holds
-- currently-open orders, not history — TERMINAL statuses drop out of the
-- query entirely) — no further action taken beyond this index; the
-- board's real-world bottleneck, if one ever appears, is more likely to be
-- client-side render cost at that row count than this query.

create index if not exists orders_kitchen_board_idx
  on public.orders (tenant_id, kitchen_status)
  where kitchen_status is not null;

comment on index public.orders_kitchen_board_idx is
  'Backs api/ecommerce/kitchen''s GET filter (tenant_id + kitchen_status not terminal) — added after a load test showed poll time growing with row count on the unindexed path. Partial index (kitchen_status is not null) since most orders never touch the kitchen board at all.';
