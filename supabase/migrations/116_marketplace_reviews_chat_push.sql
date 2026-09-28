-- Marketplace: verified-purchase product reviews, buyer<->seller chat, and
-- generic browser-push subscriptions.
--
-- All writes go through API routes using the service role, which enforce the
-- business rules (only a buyer whose parcel was delivered may review; only
-- the two parties may post into a conversation). RLS here is read-side only.

-- ─── Rating / sales aggregates on products ────────────────────────────
alter table public.products
  add column if not exists rating_avg   numeric(3,2) not null default 0,
  add column if not exists rating_count int          not null default 0,
  add column if not exists sold_count   int          not null default 0;

-- ─── Reviews ──────────────────────────────────────────────────────────
create table if not exists public.product_reviews (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete cascade,
  vendor_id         uuid references public.vendors(id) on delete set null,
  sub_order_id      uuid references public.sub_orders(id) on delete set null,
  user_id           uuid references auth.users(id) on delete set null,
  reviewer_name     text not null,
  rating            smallint not null check (rating between 1 and 5),
  body              text,
  tags              text[] not null default '{}',
  images            text[] not null default '{}',
  seller_reply      text,
  seller_replied_at timestamptz,
  status            text not null default 'published' check (status in ('published','hidden')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- One review per product per delivered parcel.
  unique (sub_order_id, product_id)
);

create index if not exists product_reviews_product_idx
  on public.product_reviews (product_id, created_at desc) where status = 'published';
create index if not exists product_reviews_vendor_idx
  on public.product_reviews (vendor_id, created_at desc);

alter table public.product_reviews enable row level security;

drop policy if exists product_reviews_public_read on public.product_reviews;
create policy product_reviews_public_read on public.product_reviews
  for select using (status = 'published');

-- Keep product and seller aggregates in step with the reviews table so the
-- storefront never has to aggregate on read.
create or replace function public.refresh_review_aggregates()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p uuid := coalesce(new.product_id, old.product_id);
  v uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  update public.products pr set
    rating_avg   = coalesce(s.avg, 0),
    rating_count = coalesce(s.cnt, 0)
  from (select round(avg(rating)::numeric, 2) as avg, count(*) as cnt
          from public.product_reviews
         where product_id = p and status = 'published') s
  where pr.id = p;

  if v is not null then
    update public.vendors vd set
      rating       = coalesce(s.avg, 0),
      rating_count = coalesce(s.cnt, 0)
    from (select round(avg(rating)::numeric, 2) as avg, count(*) as cnt
            from public.product_reviews
           where vendor_id = v and status = 'published') s
    where vd.id = v;
  end if;
  return null;
end $$;

drop trigger if exists product_reviews_aggregate on public.product_reviews;
create trigger product_reviews_aggregate
  after insert or update of rating, status or delete on public.product_reviews
  for each row execute function public.refresh_review_aggregates();

-- ─── Chat ─────────────────────────────────────────────────────────────
create table if not exists public.chat_conversations (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  vendor_id          uuid not null references public.vendors(id) on delete cascade,
  buyer_id           uuid not null references auth.users(id) on delete cascade,
  product_id         uuid references public.products(id) on delete set null,
  last_message       text,
  last_message_at    timestamptz not null default now(),
  buyer_unread       int not null default 0,
  vendor_unread      int not null default 0,
  -- Email throttle: one "new message" email per side per quiet period, so a
  -- ten-message burst doesn't become ten emails.
  buyer_emailed_at   timestamptz,
  vendor_emailed_at  timestamptz,
  created_at         timestamptz not null default now(),
  unique (tenant_id, vendor_id, buyer_id)
);

create index if not exists chat_conversations_buyer_idx
  on public.chat_conversations (buyer_id, last_message_at desc);
create index if not exists chat_conversations_vendor_idx
  on public.chat_conversations (vendor_id, last_message_at desc);

create table if not exists public.chat_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.chat_conversations(id) on delete cascade,
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  sender_role      text not null check (sender_role in ('buyer','vendor')),
  sender_id        uuid references auth.users(id) on delete set null,
  body             text,
  image_url        text,
  product_id       uuid references public.products(id) on delete set null,
  created_at       timestamptz not null default now(),
  check (coalesce(length(body), 0) > 0 or image_url is not null or product_id is not null)
);

create index if not exists chat_messages_conv_idx
  on public.chat_messages (conversation_id, created_at);

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists chat_conversations_party_read on public.chat_conversations;
create policy chat_conversations_party_read on public.chat_conversations
  for select using (buyer_id = auth.uid() or public.owns_vendor(vendor_id));

drop policy if exists chat_messages_party_read on public.chat_messages;
create policy chat_messages_party_read on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_conversations c
       where c.id = conversation_id
         and (c.buyer_id = auth.uid() or public.owns_vendor(c.vendor_id))
    )
  );

-- Realtime delivery (RLS above decides who receives each row).
do $$
begin
  begin
    alter publication supabase_realtime add table public.chat_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.chat_conversations;
  exception when duplicate_object then null;
  end;
end $$;

-- ─── Generic browser push subscriptions ───────────────────────────────
-- donor_web_push stays for the blood-donor module; this one is keyed by
-- signed-in user so any feature can notify a person on any of their devices.
create table if not exists public.web_push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists web_push_subscriptions_user_idx
  on public.web_push_subscriptions (tenant_id, user_id);

alter table public.web_push_subscriptions enable row level security;
-- No policies: service role only.
