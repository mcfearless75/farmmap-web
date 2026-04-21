-- Enable PostGIS for geographic queries
create extension if not exists postgis;

-- ================================================================
-- USERS (extends Supabase auth.users)
-- ================================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  role            text not null default 'user' check (role in ('user', 'farm_owner', 'moderator', 'admin')),
  email_verified  boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ================================================================
-- SHOPS
-- ================================================================
create table public.shops (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  listing_type        text,
  address_line1       text not null default '',
  address_line2       text,
  town                text not null default '',
  county              text not null default '',
  postcode            text not null default '',
  country             text not null default '',
  latitude            double precision,
  longitude           double precision,
  location            geography(Point, 4326),
  description         text,
  phone               text,
  email               text,
  website             text,
  opening_hours       jsonb,
  product_categories  text[] not null default '{}',
  payment_methods     text[] not null default '{}',
  owner_user_id       uuid references public.profiles(id) on delete set null,
  verified            boolean not null default false,
  status              text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'archived')),
  created_by          uuid references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shops_updated_at
  before update on public.shops
  for each row execute function update_updated_at();

-- Auto-set location from lat/lng
create or replace function sync_shop_location()
returns trigger language plpgsql as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location = st_point(new.longitude, new.latitude)::geography;
  end if;
  return new;
end;
$$;

create trigger shops_sync_location
  before insert or update on public.shops
  for each row execute function sync_shop_location();

-- Indexes
create index shops_status_idx on public.shops(status);
create index shops_slug_idx on public.shops(slug);
create index shops_location_idx on public.shops using gist(location);
create index shops_country_idx on public.shops(country);

-- ================================================================
-- SHOP EDITS (moderation queue)
-- ================================================================
create table public.shop_edits (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops(id) on delete cascade,
  submitted_by    uuid references public.profiles(id) on delete set null,
  proposed_data   jsonb not null,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  moderator_id    uuid references public.profiles(id) on delete set null,
  moderator_note  text,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

-- ================================================================
-- CONFIRMATION STATEMENTS
-- ================================================================
create table public.confirmation_statements (
  id             uuid primary key default gen_random_uuid(),
  key            text not null unique,
  label          text not null,
  category       text not null check (category in ('status', 'product', 'facility', 'payment')),
  active         boolean not null default true,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

-- ================================================================
-- CONFIRMATIONS
-- ================================================================
create table public.confirmations (
  id                        uuid primary key default gen_random_uuid(),
  shop_id                   uuid not null references public.shops(id) on delete cascade,
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  confirmation_statement_id uuid not null references public.confirmation_statements(id) on delete cascade,
  created_at                timestamptz not null default now(),

  unique(shop_id, user_id, confirmation_statement_id)
);

create index confirmations_shop_idx on public.confirmations(shop_id, confirmation_statement_id);

-- ================================================================
-- PHOTOS
-- ================================================================
create table public.photos (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  uploaded_by   uuid references public.profiles(id) on delete set null,
  storage_path  text not null,
  caption       text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at    timestamptz not null default now()
);

create index photos_shop_idx on public.photos(shop_id, status);

-- ================================================================
-- OWNERSHIP CLAIMS
-- ================================================================
create table public.ownership_claims (
  id                uuid primary key default gen_random_uuid(),
  shop_id           uuid not null references public.shops(id) on delete cascade,
  claimant_user_id  uuid not null references public.profiles(id) on delete cascade,
  evidence          text not null,
  status            text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at        timestamptz not null default now(),
  reviewed_at       timestamptz
);

-- ================================================================
-- MODERATION LOG
-- ================================================================
create table public.moderation_log (
  id            uuid primary key default gen_random_uuid(),
  moderator_id  uuid references public.profiles(id) on delete set null,
  entity_type   text not null check (entity_type in ('shop', 'photo', 'claim', 'edit')),
  entity_id     uuid not null,
  action        text not null check (action in ('approve', 'reject', 'edit', 'delete')),
  reason        text,
  created_at    timestamptz not null default now()
);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.shop_edits enable row level security;
alter table public.confirmation_statements enable row level security;
alter table public.confirmations enable row level security;
alter table public.photos enable row level security;
alter table public.ownership_claims enable row level security;
alter table public.moderation_log enable row level security;

-- Profiles: users can read/update their own
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- Shops: public read of approved; authenticated users insert; service role full access
create policy "shops_public_read" on public.shops for select using (status = 'approved');
create policy "shops_insert_auth" on public.shops for insert to authenticated with check (true);
create policy "shops_update_owner" on public.shops for update using (
  auth.uid() = created_by or auth.uid() = owner_user_id
);

-- Confirmation statements: public read active ones
create policy "statements_public_read" on public.confirmation_statements for select using (active = true);

-- Confirmations: public read aggregate (select all); insert if authenticated
create policy "confirmations_public_read" on public.confirmations for select using (true);
create policy "confirmations_insert_auth" on public.confirmations for insert to authenticated with check (auth.uid() = user_id);
create policy "confirmations_delete_own" on public.confirmations for delete using (auth.uid() = user_id);

-- Photos: public read of approved
create policy "photos_public_read" on public.photos for select using (status = 'approved');
create policy "photos_insert_auth" on public.photos for insert to authenticated with check (auth.uid() = uploaded_by);

-- Moderation log: admins only (handled via service role in API routes)

-- ================================================================
-- SEED: Confirmation Statements
-- ================================================================
insert into public.confirmation_statements (key, label, category, display_order) values
  ('trading',           'This shop is currently trading',          'status',   1),
  ('hours_accurate',    'The opening hours shown are accurate',    'status',   2),
  ('sells_eggs',        'They sell eggs',                          'product',  10),
  ('sells_dairy',       'They sell dairy products',                'product',  11),
  ('sells_meat',        'They sell meat',                          'product',  12),
  ('sells_veg',         'They sell vegetables',                    'product',  13),
  ('sells_fruit',       'They sell fruit',                         'product',  14),
  ('sells_bakery',      'They sell bread / bakery goods',          'product',  15),
  ('sells_honey',       'They sell honey',                         'product',  16),
  ('sells_flowers',     'They sell flowers / plants',              'product',  17),
  ('sells_raw_milk',    'They sell raw milk',                      'product',  18),
  ('sells_ice_cream',   'They sell ice cream',                     'product',  19),
  ('has_cafe',          'They have a café or tearoom on site',     'facility', 30),
  ('has_parking',       'There is parking available',              'facility', 31),
  ('wheelchair_access', 'The shop is wheelchair accessible',       'facility', 32),
  ('accepts_card',      'They accept card payments',               'payment',  40),
  ('accepts_cash',      'They accept cash payments',               'payment',  41),
  ('accepts_contactless','They accept contactless / tap payments', 'payment',  42);
