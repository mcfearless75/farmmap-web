-- Orders placed via Stripe checkout
create table if not exists orders (
  id                uuid        primary key default gen_random_uuid(),
  stripe_session_id text        unique not null,
  amount_total      integer,                        -- pence (e.g. 1250 = £12.50)
  customer_email    text,
  customer_name     text,
  shop_slug         text,
  shop_name         text,
  item_count        integer     default 0,
  status            text        not null default 'paid',
  created_at        timestamptz not null default now()
);

-- Index for webhook idempotency (fast lookup by session id)
create index if not exists orders_stripe_session_id_idx
  on orders (stripe_session_id);

-- Index for shop-level order queries
create index if not exists orders_shop_slug_idx
  on orders (shop_slug);

-- RLS: orders are inserted by the service-role key only
alter table orders enable row level security;

-- No public read/write — service role bypasses RLS automatically
