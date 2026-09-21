import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDayLong, money, whatsappHref } from "@/lib/format";
import { exportOrderPdf } from "@/lib/pdf";
import { useWorkshop } from "@/lib/store";
import {
  clientById,
  isOpen,
  isOverdue,
  itemCount,
  METHOD_LABEL,
  nextStage,
  orderTotal,
  paidOf,
  payStatus,
  prazoLabel,
  remainingOf,
  STAGE_HINT,
  STAGE_LABEL,
  STAGES,
  whatsappOrderText,
} from "@/lib/workshop";
import { AppDrawer, PaymentForm } from "@/components/drawers";
import { PdfActions } from "@/components/pdf-actions";
import { PayBadge, StageBadge } from "@/components/stage-badge";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedidos/$id")({ component: PedidoDetail });

function PedidoDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const order = useWorkshop((s) => s.orders.find((o) => o.id === id));
  const clients = useWorkshop((s) => s.clients);
  const payments = useWorkshop((s) => s.payments);
  const profile = useWorkshop((s) => s.profile);
  const setStage = useWorkshop((s) => s.setStage);
  const advance = useWorkshop((s) => s.advance);
  const deleteOrder = useWorkshop((s) => s.deleteOrder);
  const deletePayment = useWorkshop((s) => s.deletePayment);
  const [payOpen, setPayOpen] = useState(false);

  if (!order) {
    return (
      <main className="px-5 py-16 text-center">
        <p className="text-2xl font-semibold tracking-tight">Pedido não encontrado</p>
        <Link to="/pedidos" className="mt-4 inline-block text-sm text-denim">
          Voltar aos pedidos
        </Link>
      </main>
    );
  }

  const client = clientById(clients, order.clientId);
  const total = orderTotal(order);
  const paid = paidOf(payments, order.id);
  const remaining = remainingOf(order, payments);
  const pay = payStatus(order, payments);
  const nxt = nextStage(order.stage);
  const overdue = isOverdue(order);
  const orderPayments = payments.filter((p) => p.orderId === order.id);
  const pdfArgs = { profile, order, client, payments };

  return (
    <main className="pb-8">
      <header className="flex items-center gap-2 px-3 pt-4">
        <Link
          to="/pedidos"
          className="flex size-11 items-center justify-center rounded-md text-ink hover:bg-wash"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Pedido</p>
          <h1 className="text-2xl font-semibold leading-none tracking-tight tabular-nums">{order.number}</h1>
        </div>
        <PdfActions
          onShare={() => exportOrderPdf(pdfArgs)}
          onPrint={() => exportOrderPdf({ ...pdfArgs, print: true })}
        />
      </header>

      <section className="mt-5 px-5">
        <div className="flex items-start justify-between gap-3 rounded-xl bg-raised p-4 shadow-[var(--shadow-card)]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Cliente</p>
            <Link
              to="/clientes/$id"
              params={{ id: order.clientId }}
              className="mt-1 block font-medium tracking-tight text-ink"
            >
              {client?.name ?? "Cliente removido"}
            </Link>
            {client?.city ? <p className="text-sm text-muted">{client.city}</p> : null}
            <p className={cn("mt-3 text-sm", overdue ? "font-semibold text-brick" : "text-muted")}>
              Prazo {formatDayLong(order.dueDate)} · {prazoLabel(order)}
            </p>
            <p className="mt-1 text-sm text-muted">{STAGE_HINT[order.stage]}</p>
          </div>
          <StageBadge stage={order.stage} />
        </div>
      </section>

      <section className="mt-4 px-5">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Total" value={money(total)} />
          <Stat label="Recebido" value={money(paid)} />
          <Stat label="Aberto" value={money(remaining)} tone={remaining > 0 ? "brick" : "sage"} />
        </div>
        <div className="mt-2">
          <PayBadge status={pay} />
        </div>
      </section>

      <section className="mt-5 px-5">
        <h2 className="mb-2 text-sm font-semibold tracking-tight">Peças · {itemCount(order)}</h2>
        <ul className="overflow-hidden rounded-lg bg-raised shadow-[var(--shadow-card)]">
          {order.items.map((item, i) => (
            <li
              key={item.id}
              className={cn("flex items-start justify-between gap-3 px-4 py-3", i > 0 && "border-t border-line")}
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {item.quantity}× {item.description}
                </p>
                <p className="text-[13px] text-muted">
                  {[item.fabric, item.color, item.size].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="shrink-0 text-sm tabular-nums">{money(item.quantity * item.unitPrice)}</p>
            </li>
          ))}
        </ul>
      </section>

      {order.notes ? (
        <section className="mt-5 px-5">
          <h2 className="mb-2 text-sm font-semibold tracking-tight">Observações</h2>
          <p className="rounded-lg bg-raised px-4 py-3 text-sm leading-6 text-ink shadow-[var(--shadow-card)]">
            {order.notes}
          </p>
        </section>
      ) : null}

      <section className="mt-5 px-5">
        <h2 className="mb-2 text-sm font-semibold tracking-tight">Produção</h2>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STAGES.map((s) => {
            const active = order.stage === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStage(order.id, s);
                  toast.message(`Etapa: ${STAGE_LABEL[s]}`);
                }}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3 text-[12px] font-medium",
                  active ? "bg-denim text-denim-fg" : "bg-wash text-muted",
                )}
              >
                {STAGE_LABEL[s]}
              </button>
            );
          })}
        </div>
        {nxt ? (
          <Button
            className="mt-3 h-12 w-full"
            variant={order.stage === "pronto" ? "sage" : "primary"}
            onClick={() => {
              const next = advance(order.id);
              if (next) toast.success(`Avançou para ${STAGE_LABEL[next].toLowerCase()}`);
            }}
          >
            {order.stage === "pronto" ? "Marcar como entregue" : `Avançar para ${STAGE_LABEL[nxt].toLowerCase()}`}
          </Button>
        ) : null}
      </section>

      <section className="mt-5 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight">Recebimentos</h2>
          {remaining > 0 ? (
            <button
              type="button"
              className="h-9 text-[13px] font-medium text-denim"
              onClick={() => setPayOpen(true)}
            >
              Registrar
            </button>
          ) : null}
        </div>
        {orderPayments.length === 0 ? (
          <p className="text-sm text-muted">Nenhum pagamento ainda.</p>
        ) : (
          <ul className="overflow-hidden rounded-lg bg-raised shadow-[var(--shadow-card)]">
            {orderPayments.map((p, i) => (
              <li
                key={p.id}
                className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-line")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium tabular-nums">{money(p.amount)}</p>
                  <p className="text-[12px] text-muted">
                    {METHOD_LABEL[p.method]} · {formatDayLong(p.date)}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="flex size-11 items-center justify-center text-subtle hover:text-brick"
                  onClick={() => deletePayment(p.id)}
                  aria-label="Excluir pagamento"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 flex flex-col gap-2 px-5">
        {client?.phone ? (
          <a
            href={whatsappHref(client.phone, whatsappOrderText(client, order))}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-sage text-sm font-medium text-denim-fg"
          >
            <MessageCircle className="size-4" />
            WhatsApp do cliente
          </a>
        ) : null}
        {isOpen(order.stage) && remaining > 0 ? (
          <Button variant="secondary" className="h-12" onClick={() => setPayOpen(true)}>
            Registrar pagamento
          </Button>
        ) : null}
        {order.stage !== "cancelado" && isOpen(order.stage) ? (
          <Button
            variant="ghost"
            onClick={() => {
              setStage(order.id, "cancelado");
              toast.message("Pedido cancelado.");
            }}
          >
            Cancelar pedido
          </Button>
        ) : null}
        <Button
          variant="ghost"
          className="text-brick"
          onClick={() => {
            if (!confirm("Excluir este pedido e os pagamentos vinculados?")) return;
            deleteOrder(order.id);
            toast.success("Pedido excluído.");
            void navigate({ to: "/pedidos" });
          }}
        >
          Excluir pedido
        </Button>
      </section>

      <AppDrawer open={payOpen} onOpenChange={setPayOpen} title="Recebimento">
        <PaymentForm orderId={order.id} remaining={remaining} onDone={() => setPayOpen(false)} />
      </AppDrawer>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "brick" | "sage";
}) {
  return (
    <div className="rounded-lg bg-raised px-3 py-2.5 shadow-[var(--shadow-card)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums",
          tone === "brick" ? "text-brick" : tone === "sage" ? "text-sage" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}
