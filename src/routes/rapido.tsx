import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, MessageCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatDay, money, todayIso, whatsappHref } from "@/lib/format";
import { useWorkshop } from "@/lib/store";
import {
  clientById,
  isOverdue,
  itemSummary,
  nextStage,
  remainingOf,
  STAGE_LABEL,
  whatsappOrderText,
} from "@/lib/workshop";
import { PageHead } from "@/components/shell";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Order, Payment } from "@/lib/types";

export const Route = createFileRoute("/rapido")({ component: RapidoPage });

function RapidoPage() {
  const orders = useWorkshop((s) => s.orders);
  const clients = useWorkshop((s) => s.clients);
  const payments = useWorkshop((s) => s.payments);
  const advance = useWorkshop((s) => s.advance);
  const setStage = useWorkshop((s) => s.setStage);
  const addPayment = useWorkshop((s) => s.addPayment);

  const overdue = orders.filter(isOverdue);
  const ready = orders.filter((o) => o.stage === "pronto");
  const quotes = orders.filter((o) => o.stage === "orcamento");
  const floor = orders.filter(
    (o) => o.stage !== "orcamento" && o.stage !== "pronto" && o.stage !== "entregue" && o.stage !== "cancelado",
  );
  const toCollect = orders.filter(
    (o) => o.stage !== "cancelado" && remainingOf(o, payments) > 0,
  );

  function goNext(order: Order) {
    const next = advance(order.id);
    if (next) toast.success(`${order.number} → ${STAGE_LABEL[next]}`);
  }

  function deliver(order: Order) {
    setStage(order.id, "entregue");
    toast.success(`${order.number} entregue`);
  }

  function approve(order: Order) {
    setStage(order.id, "aprovado");
    toast.success(`${order.number} aprovado`);
  }

  function collect(order: Order) {
    const remaining = remainingOf(order, payments);
    if (remaining <= 0) return;
    addPayment({
      orderId: order.id,
      amount: remaining,
      date: todayIso(),
      method: "pix",
      note: "Recebimento rápido",
    });
    toast.success(`${order.number} · ${money(remaining)} no Pix`);
  }

  return (
    <main className="pb-8">
      <PageHead kicker="Operação" title="Gatilho rápido" />
      <p className="px-5 text-[15px] leading-6 text-muted">
        Um toque. Sem formulário. Avança etapa, entrega, aprova ou recebe o saldo.
      </p>

      <Section title="Atrasados" empty="Nenhum atraso." count={overdue.length} alert>
        {overdue.map((order) => (
          <TriggerCard
            key={order.id}
            order={order}
            clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
            payments={payments}
            primaryLabel={order.stage === "pronto" ? "Entregar" : `Ir para ${STAGE_LABEL[nextStage(order.stage) ?? order.stage].toLowerCase()}`}
            primaryVariant={order.stage === "pronto" ? "sage" : "primary"}
            onPrimary={() => (order.stage === "pronto" ? deliver(order) : goNext(order))}
            onCollect={() => collect(order)}
            onWhatsapp={() => {
              const client = clientById(clients, order.clientId);
              if (!client?.phone) {
                toast.error("Cliente sem WhatsApp.");
                return;
              }
              window.open(whatsappHref(client.phone, whatsappOrderText(client, order)), "_blank");
            }}
          />
        ))}
      </Section>

      <Section title="Prontos para entregar" empty="Nada pronto." count={ready.length}>
        {ready.map((order) => (
          <TriggerCard
            key={order.id}
            order={order}
            clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
            payments={payments}
            primaryLabel="Entregar"
            primaryVariant="sage"
            onPrimary={() => deliver(order)}
            onCollect={() => collect(order)}
            onWhatsapp={() => {
              const client = clientById(clients, order.clientId);
              if (!client?.phone) {
                toast.error("Cliente sem WhatsApp.");
                return;
              }
              window.open(whatsappHref(client.phone, whatsappOrderText(client, order)), "_blank");
            }}
          />
        ))}
      </Section>

      <Section title="Na máquina" empty="Fila de produção vazia." count={floor.length}>
        {floor.map((order) => (
          <TriggerCard
            key={order.id}
            order={order}
            clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
            payments={payments}
            primaryLabel={`Ir para ${STAGE_LABEL[nextStage(order.stage) ?? order.stage].toLowerCase()}`}
            onPrimary={() => goNext(order)}
            onCollect={() => collect(order)}
            onWhatsapp={() => {
              const client = clientById(clients, order.clientId);
              if (!client?.phone) {
                toast.error("Cliente sem WhatsApp.");
                return;
              }
              window.open(whatsappHref(client.phone, whatsappOrderText(client, order)), "_blank");
            }}
          />
        ))}
      </Section>

      <Section title="Orçamentos" empty="Nenhum orçamento pendente." count={quotes.length}>
        {quotes.map((order) => (
          <TriggerCard
            key={order.id}
            order={order}
            clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
            payments={payments}
            primaryLabel="Aprovar"
            onPrimary={() => approve(order)}
            onCollect={() => collect(order)}
            onWhatsapp={() => {
              const client = clientById(clients, order.clientId);
              if (!client?.phone) {
                toast.error("Cliente sem WhatsApp.");
                return;
              }
              window.open(whatsappHref(client.phone, whatsappOrderText(client, order)), "_blank");
            }}
          />
        ))}
      </Section>

      <Section title="Receber saldo" empty="Nada em aberto." count={toCollect.length}>
        {toCollect.map((order) => (
          <TriggerCard
            key={`pay-${order.id}`}
            order={order}
            clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
            payments={payments}
            primaryLabel={`Receber ${money(remainingOf(order, payments))}`}
            onPrimary={() => collect(order)}
            onCollect={() => collect(order)}
            hideCollect
            onWhatsapp={() => {
              const client = clientById(clients, order.clientId);
              if (!client?.phone) {
                toast.error("Cliente sem WhatsApp.");
                return;
              }
              window.open(whatsappHref(client.phone, whatsappOrderText(client, order)), "_blank");
            }}
          />
        ))}
      </Section>
    </main>
  );
}

function Section({
  title,
  empty,
  count,
  alert,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-2 flex items-baseline justify-between px-5">
        <h2 className={cn("text-sm font-semibold tracking-tight", alert && "text-brick")}>{title}</h2>
        <span className="text-[12px] tabular-nums text-muted">{count}</span>
      </div>
      {count === 0 ? (
        <p className="px-5 text-sm text-muted">{empty}</p>
      ) : (
        <div className="flex flex-col gap-2 px-5">{children}</div>
      )}
    </section>
  );
}

function TriggerCard({
  order,
  clientName,
  payments,
  primaryLabel,
  primaryVariant = "primary",
  onPrimary,
  onCollect,
  onWhatsapp,
  hideCollect,
}: {
  order: Order;
  clientName: string;
  payments: Payment[];
  primaryLabel: string;
  primaryVariant?: "primary" | "sage";
  onPrimary: () => void;
  onCollect: () => void;
  onWhatsapp: () => void;
  hideCollect?: boolean;
}) {
  const remain = remainingOf(order, payments);
  return (
    <article className="rounded-xl bg-raised p-3.5 shadow-[var(--shadow-card)]">
      <Link to="/pedidos/$id" params={{ id: order.id }} className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium tabular-nums tracking-wide text-muted">
            {order.number} · {STAGE_LABEL[order.stage]}
          </p>
          <p className="truncate text-[15px] font-semibold tracking-tight">{clientName}</p>
          <p className="truncate text-[13px] text-muted">{itemSummary(order.items)}</p>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-subtle" />
      </Link>
      <p className="mt-1 text-[12px] tabular-nums text-muted">
        {formatDay(order.dueDate)}
        {remain > 0 ? ` · ${money(remain)} aberto` : ""}
      </p>
      <Button
        className="mt-3 h-12 w-full text-[15px]"
        variant={primaryVariant}
        onClick={onPrimary}
      >
        <Check className="size-4" />
        {primaryLabel}
      </Button>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {!hideCollect ? (
          <button
            type="button"
            onClick={onCollect}
            disabled={remain <= 0}
            className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-wash text-[13px] font-medium text-ink disabled:opacity-40"
          >
            <Wallet className="size-4" />
            Pix saldo
          </button>
        ) : (
          <div />
        )}
        <button
          type="button"
          onClick={onWhatsapp}
          className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-wash text-[13px] font-medium text-ink"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </button>
      </div>
    </article>
  );
}
