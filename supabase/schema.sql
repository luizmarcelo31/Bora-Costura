-- Linha — schema + RLS para colar no SQL Editor do Supabase.
-- Tabelas idênticas às da aplicação. user_id = auth.uid()::text.

create table if not exists public.profiles (
  user_id      text primary key,
  atelier_name text not null default 'Linha',
  owner_name   text not null default '',
  phone        text not null default '',
  city         text not null default '',
  seeded       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.clients (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null,
  name       text not null,
  phone      text not null default '',
  city       text not null default '',
  notes      text not null default '',
  created_at date not null default current_date,
  updated_at timestamptz not null default now()
);
create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_user_name_idx on public.clients (user_id, name);

create table if not exists public.orders (
  id            text primary key default gen_random_uuid()::text,
  user_id       text not null,
  client_id     text not null references public.clients (id) on delete restrict,
  number        text not null,
  stage         text not null,
  due_date      date not null,
  delivery_date date,
  delivered_at  date,
  notes         text not null default '',
  created_at    date not null default current_date,
  updated_at    timestamptz not null default now(),
  constraint orders_stage_check check (
    stage in (
      'orcamento', 'aprovado', 'corte', 'costura',
      'acabamento', 'pronto', 'entregue', 'cancelado'
    )
  ),
  constraint orders_user_number unique (user_id, number)
);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_user_stage_idx on public.orders (user_id, stage);
create index if not exists orders_user_due_idx on public.orders (user_id, due_date);
create index if not exists orders_client_id_idx on public.orders (client_id);

create table if not exists public.order_items (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null,
  order_id    text not null references public.orders (id) on delete cascade,
  description text not null,
  fabric      text not null default '',
  color       text not null default '',
  size        text not null default '',
  quantity    integer not null default 1,
  unit_price  numeric(12, 2) not null default 0,
  sort_order  integer not null default 0,
  constraint order_items_qty_check check (quantity > 0)
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_user_id_idx on public.order_items (user_id);

create table if not exists public.payments (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null,
  order_id   text not null references public.orders (id) on delete cascade,
  amount     numeric(12, 2) not null,
  paid_on    date not null,
  method     text not null,
  note       text not null default '',
  created_at timestamptz not null default now(),
  constraint payments_amount_check check (amount > 0),
  constraint payments_method_check check (
    method in ('pix', 'dinheiro', 'cartao', 'boleto', 'transferencia')
  )
);
create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_user_date_idx on public.payments (user_id, paid_on desc);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

drop policy if exists profiles_own on public.profiles;
create policy profiles_own on public.profiles
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists clients_own on public.clients;
create policy clients_own on public.clients
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists orders_own on public.orders;
create policy orders_own on public.orders
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists order_items_own on public.order_items;
create policy order_items_own on public.order_items
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

drop policy if exists payments_own on public.payments;
create policy payments_own on public.payments
  for all using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
