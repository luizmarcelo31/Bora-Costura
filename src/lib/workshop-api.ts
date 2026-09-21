import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { createSeedState } from "@/lib/seed";
import type {
  Client,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  ProductionStage,
  Profile,
  WorkshopState,
} from "@/lib/types";

export type WorkshopPayload = WorkshopState & { profile: Profile };

function asDay(value: unknown): string {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

type ProfileRow = {
  user_id: string;
  atelier_name: string;
  owner_name: string;
  phone: string;
  city: string;
  seeded: unknown;
};

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  city: string;
  notes: string;
  created_at: unknown;
};

type OrderRow = {
  id: string;
  client_id: string;
  number: string;
  stage: string;
  due_date: unknown;
  delivery_date: unknown;
  delivered_at: unknown;
  notes: string;
  created_at: unknown;
};

type ItemRow = {
  id: string;
  order_id: string;
  description: string;
  fabric: string;
  color: string;
  size: string;
  quantity: unknown;
  unit_price: unknown;
};

type PaymentRow = {
  id: string;
  order_id: string;
  amount: unknown;
  paid_on: unknown;
  method: string;
  note: string;
};

function mapProfile(row: ProfileRow | undefined): Profile {
  return {
    atelierName: row?.atelier_name?.trim() || "Linha",
    ownerName: row?.owner_name ?? "",
    phone: row?.phone ?? "",
    city: row?.city ?? "",
    seeded: asBool(row?.seeded),
  };
}

async function readWorkshop(userId: string): Promise<WorkshopPayload> {
  const sql = await getSql();
  const [profiles, clientRows, orderRows, itemRows, paymentRows] = await Promise.all([
    sql<ProfileRow>`select user_id, atelier_name, owner_name, phone, city, seeded from profiles where user_id = ${userId}`,
    sql<ClientRow>`select id, name, phone, city, notes, created_at from clients where user_id = ${userId} order by name`,
    sql<OrderRow>`select id, client_id, number, stage, due_date, delivery_date, delivered_at, notes, created_at from orders where user_id = ${userId} order by created_at desc`,
    sql<ItemRow>`select id, order_id, description, fabric, color, size, quantity, unit_price from order_items where user_id = ${userId} order by sort_order, id`,
    sql<PaymentRow>`select id, order_id, amount, paid_on, method, note from payments where user_id = ${userId} order by paid_on desc, id`,
  ]);

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemRows) {
    const list = itemsByOrder.get(row.order_id) ?? [];
    list.push({
      id: row.id,
      description: row.description,
      fabric: row.fabric,
      color: row.color,
      size: row.size,
      quantity: asNumber(row.quantity),
      unitPrice: asNumber(row.unit_price),
    });
    itemsByOrder.set(row.order_id, list);
  }

  const clients: Client[] = clientRows.map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    city: row.city,
    notes: row.notes,
    createdAt: asDay(row.created_at),
  }));

  const orders: Order[] = orderRows.map((row) => ({
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    items: itemsByOrder.get(row.id) ?? [],
    stage: row.stage as ProductionStage,
    dueDate: asDay(row.due_date),
    deliveryDate: asDay(row.delivery_date) || asDay(row.due_date),
    deliveredAt: row.delivered_at ? asDay(row.delivered_at) : null,
    notes: row.notes,
    createdAt: asDay(row.created_at),
  }));

  const payments: Payment[] = paymentRows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    amount: asNumber(row.amount),
    date: asDay(row.paid_on),
    method: row.method as PaymentMethod,
    note: row.note,
  }));

  return { profile: mapProfile(profiles[0]), clients, orders, payments };
}

async function ensureProfile(userId: string) {
  const sql = await getSql();
  await sql`
    insert into profiles (user_id, atelier_name)
    values (${userId}, 'Linha')
    on conflict (user_id) do nothing
  `;
}

async function insertSeed(userId: string) {
  const sql = await getSql();
  const seed = createSeedState();
  for (const client of seed.clients) {
    await sql`
      insert into clients (id, user_id, name, phone, city, notes, created_at)
      values (
        ${client.id}, ${userId}, ${client.name}, ${client.phone},
        ${client.city}, ${client.notes}, ${client.createdAt}::date
      )
    `;
  }
  for (const order of seed.orders) {
    await sql`
      insert into orders (
        id, user_id, client_id, number, stage, due_date, delivery_date,
        delivered_at, notes, created_at
      )
      values (
        ${order.id}, ${userId}, ${order.clientId}, ${order.number}, ${order.stage},
        ${order.dueDate}::date, ${order.deliveryDate}::date,
        ${order.deliveredAt}::date, ${order.notes}, ${order.createdAt}::date
      )
    `;
    for (const [index, item] of order.items.entries()) {
      await sql`
        insert into order_items (
          id, user_id, order_id, description, fabric, color, size,
          quantity, unit_price, sort_order
        )
        values (
          ${item.id}, ${userId}, ${order.id}, ${item.description}, ${item.fabric},
          ${item.color}, ${item.size}, ${item.quantity}, ${item.unitPrice}, ${index}
        )
      `;
    }
  }
  for (const payment of seed.payments) {
    await sql`
      insert into payments (id, user_id, order_id, amount, paid_on, method, note)
      values (
        ${payment.id}, ${userId}, ${payment.orderId}, ${payment.amount},
        ${payment.date}::date, ${payment.method}, ${payment.note}
      )
    `;
  }
  await sql`
    update profiles
    set seeded = true, updated_at = now()
    where user_id = ${userId}
  `;
}

export const loadWorkshop = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId);
    let data = await readWorkshop(context.userId);
    if (!data.profile.seeded && data.clients.length === 0 && data.orders.length === 0) {
      await insertSeed(context.userId);
      data = await readWorkshop(context.userId);
    }
    return data;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { atelierName: string; ownerName: string; phone: string; city: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into profiles (user_id, atelier_name, owner_name, phone, city, updated_at)
      values (
        ${context.userId}, ${data.atelierName.trim() || "Linha"},
        ${data.ownerName.trim()}, ${data.phone.trim()}, ${data.city.trim()}, now()
      )
      on conflict (user_id) do update set
        atelier_name = excluded.atelier_name,
        owner_name = excluded.owner_name,
        phone = excluded.phone,
        city = excluded.city,
        updated_at = now()
    `;
    return readWorkshop(context.userId);
  });

export const upsertClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Client) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into clients (id, user_id, name, phone, city, notes, created_at, updated_at)
      values (
        ${data.id}, ${context.userId}, ${data.name}, ${data.phone},
        ${data.city}, ${data.notes}, ${data.createdAt}::date, now()
      )
      on conflict (id) do update set
        name = excluded.name,
        phone = excluded.phone,
        city = excluded.city,
        notes = excluded.notes,
        updated_at = now()
      where clients.user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const removeClient = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const linked = await sql<{ n: number }>`
      select count(*)::int as n from orders
      where user_id = ${context.userId} and client_id = ${id}
    `;
    if ((linked[0]?.n ?? 0) > 0) return { ok: false as const, reason: "has_orders" as const };
    await sql`delete from clients where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const upsertOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Order) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into orders (
        id, user_id, client_id, number, stage, due_date, delivery_date,
        delivered_at, notes, created_at, updated_at
      )
      values (
        ${data.id}, ${context.userId}, ${data.clientId}, ${data.number}, ${data.stage},
        ${data.dueDate}::date, ${data.deliveryDate}::date, ${data.deliveredAt}::date,
        ${data.notes}, ${data.createdAt}::date, now()
      )
      on conflict (id) do update set
        client_id = excluded.client_id,
        stage = excluded.stage,
        due_date = excluded.due_date,
        delivery_date = excluded.delivery_date,
        delivered_at = excluded.delivered_at,
        notes = excluded.notes,
        updated_at = now()
      where orders.user_id = ${context.userId}
    `;
    await sql`delete from order_items where order_id = ${data.id} and user_id = ${context.userId}`;
    for (const [index, item] of data.items.entries()) {
      await sql`
        insert into order_items (
          id, user_id, order_id, description, fabric, color, size,
          quantity, unit_price, sort_order
        )
        values (
          ${item.id}, ${context.userId}, ${data.id}, ${item.description}, ${item.fabric},
          ${item.color}, ${item.size}, ${item.quantity}, ${item.unitPrice}, ${index}
        )
      `;
    }
    return { ok: true as const };
  });

export const patchOrderStage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; stage: ProductionStage; deliveredAt: string | null }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update orders
      set stage = ${data.stage},
          delivered_at = ${data.deliveredAt}::date,
          updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
    `;
    return { ok: true as const };
  });

export const removeOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from orders where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const insertPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Payment) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into payments (id, user_id, order_id, amount, paid_on, method, note)
      values (
        ${data.id}, ${context.userId}, ${data.orderId}, ${data.amount},
        ${data.date}::date, ${data.method}, ${data.note}
      )
    `;
    return { ok: true as const };
  });

export const removePayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`delete from payments where id = ${id} and user_id = ${context.userId}`;
    return { ok: true as const };
  });

export const resetWorkshop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`delete from payments where user_id = ${context.userId}`;
    await sql`delete from order_items where user_id = ${context.userId}`;
    await sql`delete from orders where user_id = ${context.userId}`;
    await sql`delete from clients where user_id = ${context.userId}`;
    await insertSeed(context.userId);
    return readWorkshop(context.userId);
  });
