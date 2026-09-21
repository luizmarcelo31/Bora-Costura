import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDay, money } from "@/lib/format";
import { exportFinancePdf } from "@/lib/pdf";
import { useWorkshop } from "@/lib/store";
import {
  clientById,
  isOpen,
  METHOD_LABEL,
  orderTotal,
  paidOf,
  payStatus,
  remainingOf,
} from "@/lib/workshop";
import { AppDrawer, PaymentForm } from "@/components/drawers";
import { PdfActions } from "@/components/pdf-actions";
import { EmptyState, PageHead } from "@/components/shell";
import { PayBadge } from "@/components/stage-badge";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/financeiro")({ component: FinanceiroPage });

function FinanceiroPage() {
  const orders = useWorkshop((s) => s.orders);
  const clients = useWorkshop((s) => s.clients);
  const payments = useWorkshop((s) => s.payments);
  const profile = useWorkshop((s) => s.profile);
  const [payFor, setPayFor] = useState<string | null>(null);

  const receivable = useMemo(
    () =>
      orders
        .filter((o) => remainingOf(o, payments) > 0 && o.stage !== "cancelado")
        .slice()
        .sort((a, b) => remainingOf(b, payments) - remainingOf(a, payments)),
    [orders, payments],
  );

  const received = useMemo(
    () =>
      payments
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 12),
    [payments],
  );

  const openTotal = receivable.reduce((s, o) => s + remainingOf(o, payments), 0);
  const monthPaid = payments.reduce((s, p) => s + p.amount, 0);
  const billedOpen = orders.filter((o) => isOpen(o.stage)).reduce((s, o) => s + orderTotal(o), 0);
  const paying = orders.find((o) => o.id === payFor);
  const pdfArgs = { profile, orders, clients, payments };

  return (
    <main className="pb-8">
      <PageHead
        kicker="Recebimentos"
        title="Caixa"
        action={
          <PdfActions
            onShare={() => exportFinancePdf(pdfArgs)}
            onPrint={() => exportFinancePdf({ ...pdfArgs, print: true })}
          />
        }
      />

      <section className="grid grid-cols-2 gap-2.5 px-5">
        <div className="rounded-lg bg-raised px-3.5 py-3 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">A receber</p>
          <p className="mt-1 text-[1.5rem] font-semibold tracking-tight tabular-nums text-brick">{money(openTotal)}</p>
        </div>
        <div className="rounded-lg bg-raised px-3.5 py-3 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Já recebido</p>
          <p className="mt-1 text-[1.5rem] font-semibold tracking-tight tabular-nums text-sage">{money(monthPaid)}</p>
        </div>
      </section>
      <p className="mt-2 px-5 text-[13px] text-muted">
        {money(billedOpen)} em pedidos abertos · {receivable.length} conta{receivable.length === 1 ? "" : "s"} em aberto
      </p>

      <section className="mt-6">
        <h2 className="mb-2 px-5 text-sm font-semibold tracking-tight">Contas em aberto</h2>
        {receivable.length === 0 ? (
          <EmptyState title="Nada em aberto" hint="Quando um pedido tiver saldo, ele aparece aqui para receber." />
        ) : (
          <ul className="mx-5 overflow-hidden rounded-xl bg-raised shadow-[var(--shadow-card)]">
            {receivable.map((order, i) => {
              const remaining = remainingOf(order, payments);
              const client = clientById(clients, order.clientId);
              const pay = payStatus(order, payments);
              return (
                <li key={order.id} className={cn("px-4 py-3", i > 0 && "border-t border-line")}>
                  <div className="flex items-start justify-between gap-3">
                    <Link to="/pedidos/$id" params={{ id: order.id }} className="min-w-0">
                      <p className="font-medium tracking-tight">{client?.name ?? "Cliente"}</p>
                      <p className="text-[12px] text-muted tabular-nums">
                        {order.number} · recebido {money(paidOf(payments, order.id))}
                      </p>
                    </Link>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums text-brick">{money(remaining)}</p>
                      <PayBadge status={pay} />
                    </div>
                  </div>
                  <Button size="sm" className="mt-2 h-11 w-full" onClick={() => setPayFor(order.id)}>
                    Registrar recebimento
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 px-5 text-sm font-semibold tracking-tight">Últimos recebimentos</h2>
        {received.length === 0 ? (
          <p className="px-5 text-sm text-muted">Nenhum pagamento registrado.</p>
        ) : (
          <ul className="mx-5 overflow-hidden rounded-xl bg-raised shadow-[var(--shadow-card)]">
            {received.map((p, i) => {
              const order = orders.find((o) => o.id === p.orderId);
              const client = order ? clientById(clients, order.clientId) : undefined;
              return (
                <li
                  key={p.id}
                  className={cn("flex items-center justify-between gap-3 px-4 py-3", i > 0 && "border-t border-line")}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{client?.name ?? "Pedido"}</p>
                    <p className="text-[12px] text-muted">
                      {METHOD_LABEL[p.method]} · {formatDay(p.date)}
                      {order ? ` · ${order.number}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-sage">{money(p.amount)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AppDrawer open={Boolean(paying)} onOpenChange={(v) => !v && setPayFor(null)} title="Recebimento">
        {paying ? (
          <PaymentForm
            orderId={paying.id}
            remaining={remainingOf(paying, payments)}
            onDone={() => setPayFor(null)}
          />
        ) : null}
      </AppDrawer>
    </main>
  );
}
