-- Linha workshop schema (Postgres / Neon / PGLite).
-- Same tables as supabase/schema.sql — application-scoped by user_id.

create table if not exists profiles (
  user_id      text primary key,
  atelier_name text not null default 'Linha',
  owner_name   text not null default '',
  phone        text not null default '',
  city         text not null default '',
  seeded       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists clients (
  id         text primary key,
  user_id    text not null,
  name       text not null,
  phone      text not null default '',
  city       text not null default '',
  notes      text not null default '',
  created_at date not null default current_date,
  updated_at timestamptz not null default now()
);
create index if not exists clients_user_id_idx on clients (user_id);
create index if not exists clients_user_name_idx on clients (user_id, name);

create table if not exists orders (
  id            text primary key,
  user_id       text not null,
  client_id     text not null,
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
  constraint orders_user_number unique (user_id, number),
  constraint orders_client_fk foreign key (client_id) references clients (id) on delete restrict
);
create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_user_stage_idx on orders (user_id, stage);
create index if not exists orders_user_due_idx on orders (user_id, due_date);
create index if not exists orders_client_id_idx on orders (client_id);

create table if not exists order_items (
  id          text primary key,
  user_id     text not null,
  order_id    text not null,
  description text not null,
  fabric      text not null default '',
  color       text not null default '',
  size        text not null default '',
  quantity    integer not null default 1,
  unit_price  numeric(12, 2) not null default 0,
  sort_order  integer not null default 0,
  constraint order_items_qty_check check (quantity > 0),
  constraint order_items_order_fk foreign key (order_id) references orders (id) on delete cascade
);
create index if not exists order_items_order_id_idx on order_items (order_id);
create index if not exists order_items_user_id_idx on order_items (user_id);

create table if not exists payments (
  id         text primary key,
  user_id    text not null,
  order_id   text not null,
  amount     numeric(12, 2) not null,
  paid_on    date not null,
  method     text not null,
  note       text not null default '',
  created_at timestamptz not null default now(),
  constraint payments_amount_check check (amount > 0),
  constraint payments_method_check check (
    method in ('pix', 'dinheiro', 'cartao', 'boleto', 'transferencia')
  ),
  constraint payments_order_fk foreign key (order_id) references orders (id) on delete cascade
);
create index if not exists payments_user_id_idx on payments (user_id);
create index if not exists payments_order_id_idx on payments (order_id);
create index if not exists payments_user_date_idx on payments (user_id, paid_on desc);
