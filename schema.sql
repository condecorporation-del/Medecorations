-- ME Cabo · catálogo y solicitudes. Ejecutar en Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  customer_email text not null,
  customer_first_name text not null default '',
  customer_last_name text not null default '',
  event_date date,
  location text,
  notes text,
  status text not null default 'requested' check (status in ('requested','confirmed','cancelled','paid')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  stripe_session_id text,
  stripe_line_item_id text,
  order_group_id uuid,
  variant text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_email_idx on public.orders (customer_email);
-- Migration for installations created before multi-item bags.
alter table public.orders add column if not exists customer_first_name text not null default '';
alter table public.orders add column if not exists customer_last_name text not null default '';
alter table public.orders add column if not exists stripe_line_item_id text;
alter table public.orders add column if not exists order_group_id uuid;
alter table public.orders add column if not exists variant text not null default '';
alter table public.orders drop constraint if exists orders_stripe_session_id_key;
drop index if exists public.orders_stripe_session_product_idx;
create unique index if not exists orders_stripe_session_line_idx on public.orders (stripe_session_id, stripe_line_item_id);
alter table public.orders enable row level security;
-- Sin políticas públicas: las escrituras/lecturas se hacen exclusivamente por API
-- usando SUPABASE_SERVICE_ROLE_KEY del servidor. Nunca exponer esa clave al navegador.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();
