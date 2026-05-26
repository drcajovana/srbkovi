-- =============================================
-- Sbrkovi Leathercrafts — Supabase SQL Setup
-- Pokreni u Supabase SQL Editoru
-- =============================================

-- Tabela narudžbina
create table if not exists orders (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  address text not null default '',
  status text not null default 'primljeno'
    check (status in ('primljeno', 'u_izradi', 'gotovo', 'poslato')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela novčanika po narudžbini
create table if not exists order_wallets (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  category text not null,
  model text not null,
  quantity integer not null default 1 check (quantity > 0)
);

-- Tabela slika po narudžbini
create table if not exists order_images (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  image_url text not null,
  created_at timestamptz default now()
);

-- Indeksi za brže učitavanje
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_order_wallets_order on order_wallets(order_id);
create index if not exists idx_order_images_order on order_images(order_id);

-- Onemogući Row Level Security (interna timska aplikacija)
-- Ako želiš da dodaš auth u budućnosti, uključi RLS i dodaj policies
alter table orders disable row level security;
alter table order_wallets disable row level security;
alter table order_images disable row level security;

-- =============================================
-- Supabase Storage — bucket za slike
-- =============================================
-- Idi na Storage > New bucket > naziv: "order-images" > Public bucket: DA
-- Ili pokreni:
insert into storage.buckets (id, name, public)
values ('order-images', 'order-images', true)
on conflict do nothing;

-- Storage policy — dozvoli sve operacije (interna app)
create policy "Public access order-images" on storage.objects
  for all using (bucket_id = 'order-images');
