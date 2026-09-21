export const STAGES = [
  "orcamento",
  "aprovado",
  "corte",
  "costura",
  "acabamento",
  "pronto",
  "entregue",
] as const;

export type ProductionStage = (typeof STAGES)[number] | "cancelado";

export const PAYMENT_METHODS = [
  "pix",
  "dinheiro",
  "cartao",
  "boleto",
  "transferencia",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type Profile = {
  atelierName: string;
  ownerName: string;
  phone: string;
  city: string;
  seeded: boolean;
};

export const EMPTY_PROFILE: Profile = {
  atelierName: "Linha",
  ownerName: "",
  phone: "",
  city: "",
  seeded: false,
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  city: string;
  notes: string;
  createdAt: string;
};

export type OrderItem = {
  id: string;
  description: string;
  fabric: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  number: string;
  clientId: string;
  items: OrderItem[];
  stage: ProductionStage;
  dueDate: string;
  deliveryDate: string;
  deliveredAt: string | null;
  notes: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  orderId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  note: string;
};

export type WorkshopState = {
  clients: Client[];
  orders: Order[];
  payments: Payment[];
};
