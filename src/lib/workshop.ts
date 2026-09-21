import type {
  Client,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  ProductionStage,
} from "@/lib/types";
import { STAGES, PAYMENT_METHODS } from "@/lib/types";
import { daysFromToday } from "@/lib/format";

export { STAGES, PAYMENT_METHODS };

export const STAGE_LABEL: Record<ProductionStage, string> = {
  orcamento: "Orçamento",
  aprovado: "Aprovado",
  corte: "Corte",
  costura: "Costura",
  acabamento: "Acabamento",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STAGE_HINT: Record<ProductionStage, string> = {
  orcamento: "Aguardando aprovação",
  aprovado: "Liberado para produzir",
  corte: "No risco e corte",
  costura: "Nas máquinas",
  acabamento: "Passadoria e arremate",
  pronto: "Aguardando entrega",
  entregue: "Com o cliente",
  cancelado: "Pedido cancelado",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Cartão",
  boleto: "Boleto",
  transferencia: "Transferência",
};

export const SIZE_OPTIONS = ["PP", "P", "M", "G", "GG", "XG", "Único"];

export function orderTotal(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function itemCount(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function itemSummary(items: OrderItem[]): string {
  if (items.length === 0) return "Sem peças";
  const first = items[0];
  const qty = items.reduce((s, i) => s + i.quantity, 0);
  if (items.length === 1) {
    return `${first.quantity}× ${first.description}`;
  }
  return `${qty} peças · ${items.length} modelos`;
}

export function paidOf(payments: Payment[], orderId: string): number {
  return payments
    .filter((p) => p.orderId === orderId)
    .reduce((sum, p) => sum + p.amount, 0);
}

export function remainingOf(order: Order, payments: Payment[]): number {
  return Math.max(0, round2(orderTotal(order) - paidOf(payments, order.id)));
}

export type PayStatus = "pago" | "parcial" | "pendente";

export function payStatus(order: Order, payments: Payment[]): PayStatus {
  const paid = paidOf(payments, order.id);
  const total = orderTotal(order);
  if (total <= 0) return "pago";
  if (paid <= 0) return "pendente";
  if (paid + 0.009 >= total) return "pago";
  return "parcial";
}

export const PAY_LABEL: Record<PayStatus, string> = {
  pago: "Pago",
  parcial: "Parcial",
  pendente: "A receber",
};

export function isOpen(stage: ProductionStage): boolean {
  return stage !== "entregue" && stage !== "cancelado";
}

export function isOverdue(order: Order): boolean {
  if (!isOpen(order.stage)) return false;
  const days = daysFromToday(order.dueDate);
  return days !== null && days < 0;
}

export function isDueSoon(order: Order, within = 3): boolean {
  if (!isOpen(order.stage)) return false;
  const days = daysFromToday(order.dueDate);
  return days !== null && days >= 0 && days <= within;
}

export function nextStage(stage: ProductionStage): ProductionStage | null {
  if (stage === "cancelado") return null;
  const i = STAGES.indexOf(stage as (typeof STAGES)[number]);
  if (i < 0 || i >= STAGES.length - 1) return null;
  return STAGES[i + 1];
}

export function prevStage(stage: ProductionStage): ProductionStage | null {
  if (stage === "cancelado") return null;
  const i = STAGES.indexOf(stage as (typeof STAGES)[number]);
  if (i <= 0) return null;
  return STAGES[i - 1];
}

export function nextNumber(orders: Order[]): string {
  const max = orders.reduce((acc, o) => {
    const n = Number.parseInt(o.number.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `PED-${String(max + 1).padStart(3, "0")}`;
}

export function clientById(clients: Client[], id: string): Client | undefined {
  return clients.find((c) => c.id === id);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function prazoLabel(order: Order): string {
  if (!isOpen(order.stage)) {
    return order.deliveredAt ? "Entregue" : STAGE_LABEL[order.stage];
  }
  const days = daysFromToday(order.dueDate);
  if (days === null) return "Sem prazo";
  if (days === 0) return "Entregar hoje";
  if (days === 1) return "Amanhã";
  if (days === -1) return "1 dia atrasado";
  if (days < 0) return `${Math.abs(days)} dias atrasado`;
  return `${days} dias`;
}

export function whatsappOrderText(client: Client, order: Order): string {
  const pieces = itemSummary(order.items);
  const stage = STAGE_LABEL[order.stage];
  return `Olá, ${client.name.split(" ")[0]}! Sobre o pedido ${order.number} (${pieces}): está em ${stage.toLowerCase()}. Qualquer dúvida, estamos à disposição.`;
}
