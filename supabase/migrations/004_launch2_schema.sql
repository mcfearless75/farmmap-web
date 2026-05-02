-- ─────────────────────────────────────────────────────────────────────────
-- Launch 2 schema — tiers, subscriptions, products, delivery zones,
-- commission ledger, and extended orders
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1. Extend shops table ────────────────────────────────────────────────
alter table shops
  add column if not exists tier                           text not null default 'free'
    check (tier in ('free','bronze','silver','gold')),
  add column if not exists stripe_connect_account_id      text,
  add column if not exists stripe_connect_charges_ok      boolean not null default false,
  add column if not exists stripe_connect_payouts_ok      boolean not null default false,
  add column if not exists stripe_subscription_id         text,
  add column if not exists subscription_status            text,
  add column if not exists subscription_period_end        timestamptz,
  add column if not exists display_priority               integer not null default 0,
  add column if not exists hero_image_url                 text,
  add column if not exists logo_url                       text,
  add column if not exists tagline                        text,
  add column if not exists accent_colour                  text;

-- Keep display_priority in sync with tier automatically
create or replace function sync_display_priority()
returns trigger language plpgsql as $$
begin
  new.display_priority := case new.tier
    when 'gold'   then 30
    when 'silver' then 20
    when 'bronze' then 10
    else 0
  end;
  return new;
end;
$$;

drop trigger if exists trg_sync_display_priority on shops;
create trigger trg_sync_display_priority
  before insert or update of tier on shops
  for each row execute function sync_display_priority();

-- ── 2. Subscriptions ─────────────────────────────────────────────────────
create table if not exists subscriptions (
  id                       uuid        primary key default gen_random_uuid(),
  shop_id                  uuid        not null references shops(id) on delete cascade,
  stripe_subscription_id   text        unique not null,
  stripe_customer_id       text,
  tier                     text        not null check (tier in ('bronze','silver','gold')),
  status                   text        not null,
  billing_cycle            text        not null check (billing_cycle in ('monthly','annual')),
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean     not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists subscriptions_shop_id_idx on subscriptions (shop_id);
create index if not exists subscriptions_stripe_id_idx on subscriptions (stripe_subscription_id);

alter table subscriptions enable row level security;

create policy "owner reads own subscription" on subscriptions
  for select using (
    shop_id in (select id from shops where owner_user_id = auth.uid())
  );

-- ── 3. Products (Postgres-side transactional record) ────────────────────
create table if not exists products (
  id                  uuid        primary key default gen_random_uuid(),
  shop_id             uuid        not null references shops(id) on delete cascade,
  sanity_document_id  text,
  name                text        not null,
  slug                text        not null,
  price_pence         integer     not null,
  vat_rate            numeric(4,2) not null default 0.00,
  category            text        not null,
  short_description   text,
  status              text        not null default 'pending'
    check (status in ('pending','approved','rejected','archived')),
  active              boolean     not null default false,
  stock_quantity      integer,
  stock_status        text        not null default 'in_stock'
    check (stock_status in ('in_stock','low_stock','out_of_stock')),
  low_stock_threshold integer     not null default 5,
  moderation_note     text,
  moderated_by        uuid references auth.users(id),
  moderated_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (shop_id, slug)
);

create index if not exists products_shop_idx   on products (shop_id);
create index if not exists products_status_idx on products (status, active);

alter table products enable row level security;

create policy "public reads approved active products" on products
  for select using (status = 'approved' and active = true);

create policy "owner manages own products" on products
  for all using (
    shop_id in (select id from shops where owner_user_id = auth.uid())
  );

create policy "admin manages all products" on products
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','moderator'))
  );

-- ── 4. Delivery zones ────────────────────────────────────────────────────
create table if not exists delivery_zones (
  id                              uuid        primary key default gen_random_uuid(),
  shop_id                         uuid        not null references shops(id) on delete cascade,
  name                            text        not null,
  postcode_prefixes               text[]      not null default '{}',
  product_categories              text[]      not null default '{}',
  delivery_fee_pence              integer     not null default 0,
  free_delivery_threshold_pence   integer,
  lead_time_days                  integer     not null default 1,
  active                          boolean     not null default true,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

create index if not exists delivery_zones_shop_idx on delivery_zones (shop_id);

alter table delivery_zones enable row level security;

create policy "owner manages own zones" on delivery_zones
  for all using (
    shop_id in (select id from shops where owner_user_id = auth.uid())
  );

create policy "public reads active zones" on delivery_zones
  for select using (active = true);

-- ── 5. Extend orders table ───────────────────────────────────────────────
alter table orders
  add column if not exists shop_id                    uuid references shops(id),
  add column if not exists order_number               text unique,
  add column if not exists order_status               text not null default 'pending'
    check (order_status in (
      'pending','accepted','preparing','dispatched','delivered',
      'cancelled','refunded','partially_refunded','disputed'
    )),
  add column if not exists delivery_address           jsonb,
  add column if not exists delivery_zone_id           uuid references delivery_zones(id),
  add column if not exists delivery_fee_pence         integer not null default 0,
  add column if not exists subtotal_pence             integer,
  add column if not exists vat_pence                  integer not null default 0,
  add column if not exists stripe_connect_account_id  text,
  add column if not exists application_fee_pence      integer not null default 0,
  add column if not exists placed_at                  timestamptz not null default now(),
  add column if not exists accepted_at                timestamptz,
  add column if not exists dispatched_at              timestamptz,
  add column if not exists delivered_at               timestamptz,
  add column if not exists tracking_token             text unique default gen_random_uuid()::text,
  add column if not exists order_items                jsonb,
  add column if not exists shop_note                  text,
  add column if not exists auto_cancel_at             timestamptz;

-- Order number sequence and trigger
create sequence if not exists order_number_seq start 10000;

create or replace function generate_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null then
    new.order_number := 'FM-' || to_char(now(), 'YYYY') || '-'
      || lpad((nextval('order_number_seq'))::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_number on orders;
create trigger trg_order_number
  before insert on orders
  for each row execute function generate_order_number();

-- ── 6. Commission ledger ─────────────────────────────────────────────────
create table if not exists commission_ledger (
  id                          uuid        primary key default gen_random_uuid(),
  order_id                    uuid        not null references orders(id) on delete cascade,
  shop_id                     uuid        not null references shops(id),
  stripe_session_id           text,
  stripe_application_fee_id   text,
  order_subtotal_pence        integer     not null,
  commission_pence            integer     not null,
  refunded_pence              integer     not null default 0,
  refunded_at                 timestamptz,
  tier_at_time                text        not null,
  created_at                  timestamptz not null default now()
);

create index if not exists commission_ledger_shop_idx  on commission_ledger (shop_id);
create index if not exists commission_ledger_order_idx on commission_ledger (order_id);

alter table commission_ledger enable row level security;

create policy "admin reads all commissions" on commission_ledger
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin','moderator'))
  );

create policy "owner reads own commissions" on commission_ledger
  for select using (
    shop_id in (select id from shops where owner_user_id = auth.uid())
  );
