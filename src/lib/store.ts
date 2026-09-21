import { create } from "zustand";
import { toast } from "sonner";
import { todayIso } from "@/lib/format";
import {
  insertPayment,
  loadWorkshop,
  patchOrderStage,
  removeClient,
  removeOrder,
  removePayment,
  resetWorkshop,
  saveProfile,
  upsertClient,
  upsertOrder,
} from "@/lib/workshop-api";
import type {
  Client,
  Order,
  Payment,
  ProductionStage,
  Profile,
  WorkshopState,
} from "@/lib/types";
import { EMPTY_PROFILE } from "@/lib/types";
import { nextNumber, nextStage } from "@/lib/workshop";
import { uid } from "@/lib/utils";

type Actions = {
  ready: boolean;
  loading: boolean;
  profile: Profile;
  hydrate: (payload: WorkshopState & { profile: Profile }) => void;
  refresh: () => Promise<void>;
  updateProfile: (patch: Omit<Profile, "seeded">) => Promise<void>;
  addClient: (input: Omit<Client, "id" | "createdAt">) => string;
  updateClient: (id: string, patch: Partial<Omit<Client, "id">>) => void;
  deleteClient: (id: string) => boolean;
  addOrder: (input: Omit<Order, "id" | "number" | "createdAt">) => string;
  updateOrder: (id: string, patch: Partial<Omit<Order, "id" | "number">>) => void;
  deleteOrder: (id: string) => void;
  setStage: (id: string, stage: ProductionStage) => void;
  advance: (id: string) => ProductionStage | null;
  addPayment: (input: Omit<Payment, "id">) => void;
  deletePayment: (id: string) => void;
  resetDemo: () => Promise<void>;
};

type Store = WorkshopState & Actions;

function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "Falha ao salvar";
  if (message === "Unauthorized") {
    toast.error("Sessão expirada. Entre de novo.");
    return;
  }
  toast.error("Não foi possível salvar. Tente outra vez.");
}

export const useWorkshop = create<Store>()((set, get) => ({
  clients: [],
  orders: [],
  payments: [],
  profile: EMPTY_PROFILE,
  ready: false,
  loading: false,
  hydrate: (payload) =>
    set({
      clients: payload.clients,
      orders: payload.orders,
      payments: payload.payments,
      profile: payload.profile,
      ready: true,
      loading: false,
    }),
  refresh: async () => {
    set({ loading: true });
    try {
      const payload = await loadWorkshop();
      get().hydrate(payload);
    } catch (error) {
      set({ loading: false, ready: true });
      fail(error);
    }
  },
  updateProfile: async (patch) => {
    const next = { ...get().profile, ...patch };
    set({ profile: next });
    try {
      const payload = await saveProfile({
        data: {
          atelierName: next.atelierName,
          ownerName: next.ownerName,
          phone: next.phone,
          city: next.city,
        },
      });
      get().hydrate(payload);
    } catch (error) {
      fail(error);
    }
  },
  addClient: (input) => {
    const id = uid("c");
    const client: Client = { ...input, id, createdAt: todayIso() };
    set({ clients: [...get().clients, client] });
    void upsertClient({ data: client }).catch(fail);
    return id;
  },
  updateClient: (id, patch) => {
    const current = get().clients.find((c) => c.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    set({ clients: get().clients.map((c) => (c.id === id ? next : c)) });
    void upsertClient({ data: next }).catch(fail);
  },
  deleteClient: (id) => {
    const hasOrders = get().orders.some((o) => o.clientId === id);
    if (hasOrders) return false;
    set({ clients: get().clients.filter((c) => c.id !== id) });
    void removeClient({ data: id }).catch(fail);
    return true;
  },
  addOrder: (input) => {
    const id = uid("o");
    const order: Order = {
      ...input,
      id,
      number: nextNumber(get().orders),
      createdAt: todayIso(),
    };
    set({ orders: [order, ...get().orders] });
    void upsertOrder({ data: order }).catch(fail);
    return id;
  },
  updateOrder: (id, patch) => {
    const current = get().orders.find((o) => o.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    set({ orders: get().orders.map((o) => (o.id === id ? next : o)) });
    void upsertOrder({ data: next }).catch(fail);
  },
  deleteOrder: (id) => {
    set({
      orders: get().orders.filter((o) => o.id !== id),
      payments: get().payments.filter((p) => p.orderId !== id),
    });
    void removeOrder({ data: id }).catch(fail);
  },
  setStage: (id, stage) => {
    const current = get().orders.find((o) => o.id === id);
    if (!current) return;
    const deliveredAt =
      stage === "entregue" ? (current.deliveredAt ?? todayIso()) : stage === "cancelado" ? current.deliveredAt : null;
    const next = { ...current, stage, deliveredAt };
    set({
      orders: get().orders.map((o) => (o.id === id ? next : o)),
    });
    void patchOrderStage({ data: { id, stage, deliveredAt } }).catch(fail);
  },
  advance: (id) => {
    const order = get().orders.find((o) => o.id === id);
    if (!order) return null;
    const nxt = nextStage(order.stage);
    if (!nxt) return null;
    get().setStage(id, nxt);
    return nxt;
  },
  addPayment: (input) => {
    const payment: Payment = { ...input, id: uid("p") };
    set({ payments: [...get().payments, payment] });
    void insertPayment({ data: payment }).catch(fail);
  },
  deletePayment: (id) => {
    set({ payments: get().payments.filter((p) => p.id !== id) });
    void removePayment({ data: id }).catch(fail);
  },
  resetDemo: async () => {
    try {
      const payload = await resetWorkshop();
      get().hydrate(payload);
    } catch (error) {
      fail(error);
    }
  },
}));
