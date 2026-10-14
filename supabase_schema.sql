-- ============================================================
-- Alizson Marketplace — Supabase Schema
-- Run this in Supabase SQL Editor (Database → SQL Editor)
--
-- Safe to re-run: tables use "if not exists", policies are
-- dropped and recreated, functions use "create or replace".
-- Running it on an existing database applies the security fixes
-- without touching your data.
--
-- AFTER RUNNING — create your first admin:
--   1. Sign up on the site with the admin's email.
--   2. In the SQL Editor run:
--        update public.profiles set role = 'admin'
--        where email = 'you@example.com';
--   Roles can only be changed from the SQL Editor or by an
--   existing admin — never by the user themselves.
--
-- ADDING A RIDER:
--   1. The rider signs up on the site with their own email.
--   2. In the SQL Editor run (edit the values):
--        update public.profiles set role = 'rider'
--        where email = 'rider@example.com';
--
--        insert into public.riders (id, user_id, name, email, phone, hub, vehicle)
--        select 'rdr-001', id, 'Segun Adebayo', email, '+234 802 111 2233',
--               'Abeokuta Central Hub', 'Yamaha Express Bike'
--        from public.profiles where email = 'rider@example.com';
--   The rider then signs in at yoursite.com/#rider with that
--   email and password. Set riders.account_status to anything
--   other than 'Active' to block a rider from signing in.
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text,
  email        text,
  phone        text,
  role         text not null default 'customer',
  avatar_url   text,
  saved_addresses jsonb default '[]'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'admin', 'rider'));

alter table public.profiles enable row level security;


-- ============================================================
-- 2. ROLE HELPERS
-- ------------------------------------------------------------
-- "security definer" lets these read profiles/riders without
-- going through RLS, which avoids the infinite-recursion error
-- you get when a profiles policy queries profiles directly.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_rider()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'rider'
  );
$$;

-- True when the request comes from a signed-in or anonymous site
-- visitor (PostgREST roles) rather than the SQL Editor or the
-- service-role key used by Edge Functions.
create or replace function public.is_api_user()
returns boolean
language sql stable
as $$
  select current_user in ('anon', 'authenticated');
$$;


-- ============================================================
-- 3. PROFILE POLICIES & ROLE PROTECTION
-- ============================================================

drop policy if exists "Users can view their own profile"   on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles"       on public.profiles;
drop policy if exists "Admins can manage all profiles"     on public.profiles;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- The signup trigger normally creates the row; this only allows the
-- app's follow-up upsert, and only as a plain customer.
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id and role = 'customer');

create policy "Admins can manage all profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Block users from changing their own role (e.g. to 'admin').
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role
     and public.is_api_user()
     and not public.is_admin() then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- New signups are ALWAYS customers. The role in signup metadata is
-- ignored because anyone can put any value there.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Google sign-ups provide name/full_name and avatar_url in metadata
  insert into public.profiles (id, email, name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 4. PRODUCTS
-- ============================================================
create table if not exists public.products (
  id                  text primary key,
  store               text not null,
  name                text not null,
  slug                text,
  category            text,
  price               numeric(12,2) not null default 0,
  rating              numeric(3,1) default 0,
  reviews_count       int default 0,
  badge               text,
  short_description   text,
  description         text,
  image               text,
  gallery             jsonb default '[]'::jsonb,
  sku                 text,
  in_stock            boolean default true,
  stock_quantity      int default 0,
  sizes               jsonb default '[]'::jsonb,
  flavours            jsonb default '[]'::jsonb,
  available_add_ons   jsonb default '[]'::jsonb,
  ingredients         text,
  prep_time           text,
  dietary             jsonb default '[]'::jsonb,
  brand               text,
  weight              text,
  dimensions          text,
  material            text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "Anyone can view products"   on public.products;
drop policy if exists "Admins can manage products" on public.products;

create policy "Anyone can view products"
  on public.products for select
  using (true);

create policy "Admins can manage products"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_products_store on public.products(store);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_in_stock on public.products(in_stock);


-- ============================================================
-- 5. RIDERS
-- ------------------------------------------------------------
-- user_id links a rider record to the login account that
-- belongs to that rider (profile role = 'rider').
-- ============================================================
create table if not exists public.riders (
  id                      text primary key,
  user_id                 uuid unique references auth.users(id) on delete set null,
  name                    text not null,
  email                   text,
  phone                   text,
  vehicle                 text,
  vehicle_type            text,
  license_no              text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  date_joined             text,
  rating                  numeric(3,1) default 5.0,
  hub                     text,
  account_status          text default 'Active',
  availability_status     text default 'Available',
  avatar                  text,
  initial_location        jsonb,
  current_location        jsonb,
  completed_count         int default 0,
  today_earnings          numeric(12,2) default 0,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- For databases created before user_id existed
alter table public.riders
  add column if not exists user_id uuid unique references auth.users(id) on delete set null;

alter table public.riders enable row level security;

-- The rider id (e.g. 'RDR-001') of the signed-in rider, or null.
create or replace function public.current_rider_id()
returns text
language sql stable security definer
set search_path = public
as $$
  select r.id from public.riders r
  join public.profiles p on p.id = r.user_id
  where r.user_id = auth.uid()
    and p.role = 'rider'
    and r.account_status = 'Active'
  limit 1;
$$;

drop policy if exists "Anyone can view rider profiles"  on public.riders;
drop policy if exists "Admins can manage riders"        on public.riders;
drop policy if exists "Riders can view own record"      on public.riders;
drop policy if exists "Riders can update own record"    on public.riders;

-- Rider records hold phone numbers, licence and emergency contacts,
-- so they are no longer public. Customers see the assigned rider
-- through orders.assigned_rider instead.
create policy "Admins can manage riders"
  on public.riders for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Riders can view own record"
  on public.riders for select
  using (user_id = auth.uid());

create policy "Riders can update own record"
  on public.riders for update
  using (user_id = auth.uid() and public.is_rider())
  with check (user_id = auth.uid());

-- Riders may only update their availability and live location.
create or replace function public.protect_rider_columns()
returns trigger
language plpgsql
as $$
declare
  allowed text[] := array['availability_status', 'current_location', 'updated_at'];
begin
  if public.is_api_user() and not public.is_admin()
     and (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'Riders can only update availability and location';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_rider_columns on public.riders;
create trigger protect_rider_columns
  before update on public.riders
  for each row execute function public.protect_rider_columns();


-- ============================================================
-- 6. ORDERS
-- ============================================================
create table if not exists public.orders (
  id                    text primary key,
  store                 text not null,
  store_name            text,
  customer_id           uuid references public.profiles(id) on delete set null,
  customer_name         text not null,
  customer_email        text,
  customer_phone        text,
  date                  text,
  time                  text,
  iso_date              timestamptz default now(),
  status                text not null default 'Order Confirmed',
  status_step           int default 0,
  payment_method        text,
  payment_status        text default 'Pending',
  payment_reference     text,
  payment_confirmed_at  text,
  subtotal              numeric(12,2) default 0,
  delivery_fee          numeric(12,2) default 0,
  gift_fee              numeric(12,2) default 0,
  total                 numeric(12,2) default 0,
  delivery_address      text,
  lga                   text,
  state                 text,
  latitude              numeric(10,6),
  longitude             numeric(10,6),
  delivery_slot         text,
  special_instructions  text,
  fulfillment_type      text default 'delivery',
  delivery_pin          text,
  assigned_rider        jsonb,
  assignment_state      text default 'Unassigned',
  accepted_by_rider_id  text,
  accepted_by_rider_name text,
  rider_location        jsonb,
  gift_options          jsonb,
  bank_transfer_verified_by text,
  admin_payment_override boolean default false,
  cash_payment_confirmed_by_rider boolean default false,
  failure_reason        text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table public.orders enable row level security;

-- True when the signed-in rider may see/act on this order: it is
-- assigned to them, or it is waiting in the dispatch pool.
create or replace function public.rider_can_access_order(o public.orders)
returns boolean
language sql stable
as $$
  select public.current_rider_id() is not null and (
    o.accepted_by_rider_id = public.current_rider_id()
    or o.assigned_rider->>'id' = public.current_rider_id()
    or (o.accepted_by_rider_id is null and o.assignment_state = 'Pending')
  );
$$;

drop policy if exists "Customers can view own orders"              on public.orders;
drop policy if exists "Customers can create orders"                on public.orders;
drop policy if exists "Admins and riders can manage all orders"    on public.orders;
drop policy if exists "Admins can manage all orders"               on public.orders;
drop policy if exists "Riders can view their orders"               on public.orders;
drop policy if exists "Riders can update their orders"             on public.orders;

create policy "Customers can view own orders"
  on public.orders for select
  using (customer_id is not null and customer_id = auth.uid());

-- Only signed-in customers can order, and only in their own name.
-- New orders must start unpaid and unassigned. Only the payment
-- verification Edge Function (service role) or an admin can mark
-- an order as Paid.
create policy "Customers can create orders"
  on public.orders for insert
  to authenticated
  with check (
    auth.uid() is not null
    and customer_id = auth.uid()
    and payment_status in ('Pending', 'Pending Verification', 'Awaiting Bank Confirmation')
    and status = 'Order Confirmed'
    and coalesce(status_step, 0) = 0
    and assigned_rider is null
    and accepted_by_rider_id is null
    and bank_transfer_verified_by is null
    and coalesce(admin_payment_override, false) = false
    and coalesce(cash_payment_confirmed_by_rider, false) = false
    and total >= 0
  );

create policy "Admins can manage all orders"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Riders can view their orders"
  on public.orders for select
  using (public.rider_can_access_order(orders));

create policy "Riders can update their orders"
  on public.orders for update
  using (public.rider_can_access_order(orders))
  with check (
    public.current_rider_id() is not null
    and (accepted_by_rider_id is null or accepted_by_rider_id = public.current_rider_id())
  );

-- Riders may only change delivery-related fields. They can mark an
-- order Paid only for cash / pay-on-delivery orders.
create or replace function public.protect_order_columns()
returns trigger
language plpgsql
as $$
declare
  allowed text[] := array[
    'status', 'status_step', 'assignment_state',
    'accepted_by_rider_id', 'accepted_by_rider_name', 'assigned_rider',
    'rider_location', 'failure_reason', 'cash_payment_confirmed_by_rider',
    'payment_status', 'payment_confirmed_at', 'updated_at'
  ];
begin
  if not public.is_api_user() or public.is_admin() then
    return new;
  end if;

  if (to_jsonb(new) - allowed) is distinct from (to_jsonb(old) - allowed) then
    raise exception 'Riders can only update delivery fields on an order';
  end if;

  if new.payment_status is distinct from old.payment_status
     and not (new.payment_status = 'Paid'
              and coalesce(old.payment_method, '') ilike '%deliver%') then
    raise exception 'Riders can only confirm payment for pay-on-delivery orders';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_order_columns on public.orders;
create trigger protect_order_columns
  before update on public.orders
  for each row execute function public.protect_order_columns();

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_iso_date on public.orders(iso_date desc);
create index if not exists idx_orders_store on public.orders(store);
create index if not exists idx_orders_accepted_rider on public.orders(accepted_by_rider_id);

-- True while the caller is still placing this order: the order is
-- theirs and was created in the last 30 minutes.
-- Used to let checkout attach items and the first tracking event.
create or replace function public.is_placing_order(p_order_id text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders
    where id = p_order_id
      and auth.uid() is not null
      and customer_id = auth.uid()
      and created_at > now() - interval '30 minutes'
  );
$$;

-- True when the signed-in rider may act on this order.
create or replace function public.rider_can_access_order_id(p_order_id text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    where o.id = p_order_id and public.rider_can_access_order(o)
  );
$$;


-- ============================================================
-- 7. ORDER ITEMS
-- ============================================================
create table if not exists public.order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    text not null references public.orders(id) on delete cascade,
  product_id  text,
  name        text not null,
  size        text,
  flavour     text,
  add_ons     jsonb default '[]'::jsonb,
  custom_message text,
  unit_price  numeric(12,2) not null default 0,
  quantity    int not null default 1,
  image       text,
  created_at  timestamptz default now()
);

alter table public.order_items enable row level security;

drop policy if exists "Order items visible with order access" on public.order_items;
drop policy if exists "Allow inserting order items"           on public.order_items;
drop policy if exists "Customers can add items while ordering" on public.order_items;
drop policy if exists "Admins can manage order items"         on public.order_items;

-- Visible to whoever can see the parent order (orders RLS applies
-- inside the subquery).
create policy "Order items visible with order access"
  on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy "Customers can add items while ordering"
  on public.order_items for insert
  with check (public.is_placing_order(order_id) and quantity > 0 and unit_price >= 0);

create policy "Admins can manage order items"
  on public.order_items for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_order_items_order_id on public.order_items(order_id);


-- ============================================================
-- 8. ORDER TRACKING HISTORY
-- ============================================================
create table if not exists public.order_tracking_history (
  id          uuid primary key default uuid_generate_v4(),
  order_id    text not null references public.orders(id) on delete cascade,
  event       text not null,
  status_step int default 0,
  timestamp   text,
  actor       text,
  created_at  timestamptz default now()
);

alter table public.order_tracking_history enable row level security;

drop policy if exists "Tracking history visible with order access" on public.order_tracking_history;
drop policy if exists "Allow inserting tracking events"            on public.order_tracking_history;
drop policy if exists "Order parties can add tracking events"      on public.order_tracking_history;
drop policy if exists "Admins can manage tracking history"         on public.order_tracking_history;

create policy "Tracking history visible with order access"
  on public.order_tracking_history for select
  using (exists (select 1 from public.orders o where o.id = order_id));

create policy "Order parties can add tracking events"
  on public.order_tracking_history for insert
  with check (
    public.is_placing_order(order_id)
    or public.rider_can_access_order_id(order_id)
  );

create policy "Admins can manage tracking history"
  on public.order_tracking_history for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_tracking_order_id on public.order_tracking_history(order_id);


-- ============================================================
-- 9. ORDER TRACKING BY ORDER ID + PHONE
-- ------------------------------------------------------------
-- Ordering requires an account, but a tracking link may be opened
-- signed out (e.g. by a gift recipient or on another phone).
-- This function returns one order only when the caller knows
-- both the order ID and the phone number used at checkout.
-- Call from the app with:
--   supabase.rpc('track_order', { p_order_id, p_phone })
-- ============================================================
create or replace function public.track_order(p_order_id text, p_phone text)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'order', to_jsonb(o) - 'customer_id' - 'latitude' - 'longitude',
    'items', coalesce((
      select jsonb_agg(to_jsonb(i) order by i.created_at)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb),
    'tracking_history', coalesce((
      select jsonb_agg(to_jsonb(h) order by h.created_at)
      from public.order_tracking_history h where h.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_order_id
    and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 10
    and right(regexp_replace(coalesce(o.customer_phone, ''), '\D', '', 'g'), 10)
      = right(regexp_replace(p_phone, '\D', '', 'g'), 10);
$$;

grant execute on function public.track_order(text, text) to anon, authenticated;


-- ============================================================
-- 10. FEEDBACK
-- ============================================================
create table if not exists public.feedback (
  id              text primary key,
  customer_name   text,
  customer_email  text,
  customer_id     uuid references public.profiles(id) on delete set null,
  order_id        text,
  store           text,
  rating          int check (rating between 1 and 5),
  subject         text,
  message         text,
  date            text,
  time            text,
  status          text default 'New',
  created_at      timestamptz default now()
);

alter table public.feedback enable row level security;

drop policy if exists "Anyone can submit feedback"      on public.feedback;
drop policy if exists "Admins can manage feedback"      on public.feedback;
drop policy if exists "Customers can view own feedback" on public.feedback;

create policy "Anyone can submit feedback"
  on public.feedback for insert
  with check (
    (customer_id is null or customer_id = auth.uid())
    and coalesce(status, 'New') = 'New'
  );

create policy "Admins can manage feedback"
  on public.feedback for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Customers can view own feedback"
  on public.feedback for select
  using (customer_id is not null and customer_id = auth.uid());


-- ============================================================
-- 11. DELIVERY LOCATIONS
-- ============================================================
create table if not exists public.delivery_locations (
  id            uuid primary key default uuid_generate_v4(),
  lga           text not null unique,
  state         text default 'Ogun State',
  delivery_fee  numeric(10,2) not null,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.delivery_locations enable row level security;

drop policy if exists "Anyone can view delivery locations"   on public.delivery_locations;
drop policy if exists "Admins can manage delivery locations" on public.delivery_locations;

create policy "Anyone can view delivery locations"
  on public.delivery_locations for select
  using (true);

create policy "Admins can manage delivery locations"
  on public.delivery_locations for all
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- 12. STORE SETTINGS
-- ============================================================
create table if not exists public.store_settings (
  key    text primary key,
  value  jsonb not null,
  updated_at timestamptz default now()
);

alter table public.store_settings enable row level security;

drop policy if exists "Anyone can read store settings"   on public.store_settings;
drop policy if exists "Admins can manage store settings" on public.store_settings;

create policy "Anyone can read store settings"
  on public.store_settings for select
  using (true);

create policy "Admins can manage store settings"
  on public.store_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- Placeholder — replace with the real account from the admin
-- dashboard (or here) before launch.
insert into public.store_settings (key, value) values (
  'bank_account',
  '{"bankName": "Guaranty Trust Bank (GTBank)", "accountNumber": "0123456789", "accountName": "Alizson Cakes & Baking Supplies", "narrationPrompt": "Your Full Name or Order ID"}'::jsonb
) on conflict (key) do nothing;
