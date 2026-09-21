import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { formatDay, money } from "@/lib/format";
import { exportProductionPdf } from "@/lib/pdf";
import { useWorkshop } from "@/lib/store";
import type { ProductionStage } from "@/lib/types";
import { STAGES } from "@/lib/types";
import {
  clientById,
  isOverdue,
  itemSummary,
  nextStage,
  remainingOf,
  STAGE_HINT,
  STAGE_LABEL,
} from "@/lib/workshop";
import { PdfActions } from "@/components/pdf-actions";
import { EmptyState, PageHead } from "@/components/shell";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/producao")({ component: ProducaoPage });

const FLOOR = STAGES.filter((s) => s !== "entregue");

function ProducaoPage() {
  const orders = useWorkshop((s) => s.orders);
  const clients = useWorkshop((s) => s.clients);
  const payments = useWorkshop((s) => s.payments);
  const profile = useWorkshop((s) => s.profile);
  const advance = useWorkshop((s) => s.advance);
  const [focus, setFocus] = useState<ProductionStage | "todos">("todos");

  const byStage = FLOOR.map((stage) => ({
    stage,
    orders: orders
      .filter((o) => o.stage === stage)
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  }));

  const visible = focus === "todos" ? byStage : byStage.filter((s) => s.stage === focus);
  const pdfArgs = { profile, orders, clients, payments };

  return (
    <main>
      <PageHead
        kicker="Chão de fábrica"
        title="Produção"
        action={
          <PdfActions
            onShare={() => exportProductionPdf(pdfArgs)}
            onPrint={() => exportProductionPdf({ ...pdfArgs, print: true })}
          />
        }
      />

      <div className="flex gap-1.5 overflow-x-auto px-5 pb-2">
        <Chip active={focus === "todos"} onClick={() => setFocus("todos")} label="Tudo" count={orders.filter((o) => FLOOR.includes(o.stage as (typeof FLOOR)[number])).length} />
        {byStage.map((col) => (
          <Chip
            key={col.stage}
            active={focus === col.stage}
            onClick={() => setFocus(col.stage)}
            label={STAGE_LABEL[col.stage]}
            count={col.orders.length}
          />
        ))}
      </div>

      <div
        className={cn(
          "mt-2 gap-3 px-5",
          focus === "todos" ? "md:grid md:grid-cols-3 lg:grid-cols-6" : "flex flex-col",
        )}
      >
        {visible.map((col) => (
          <section key={col.stage} className="min-w-0">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">{STAGE_LABEL[col.stage]}</h2>
                <p className="text-[11px] text-muted">{STAGE_HINT[col.stage]}</p>
              </div>
              <span className="tabular-nums text-[12px] text-muted">{col.orders.length}</span>
            </div>
            {col.orders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-[12px] text-subtle">
                Fila vazia
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {col.orders.map((order) => {
                  const nxt = nextStage(order.stage);
                  const overdue = isOverdue(order);
                  const client = clientById(clients, order.clientId);
                  return (
                    <article
                      key={order.id}
                      className={cn(
                        "rounded-lg bg-raised p-3 shadow-[var(--shadow-card)]",
                        overdue && "shadow-[0_0_0_1px_var(--color-brick),0_8px_20px_rgb(27_29_36/0.04)]",
                      )}
                    >
                      <Link to="/pedidos/$id" params={{ id: order.id }} className="block">
                        <p className="text-[12px] font-medium tabular-nums text-muted">{order.number}</p>
                        <p className="truncate font-medium tracking-tight">{client?.name ?? "Cliente"}</p>
                        <p className="truncate text-[12px] text-muted">{itemSummary(order.items)}</p>
                        <p className={cn("mt-1 text-[12px] tabular-nums", overdue ? "font-semibold text-brick" : "text-muted")}>
                          {formatDay(order.dueDate)}
                          {remainingOf(order, payments) > 0
                            ? ` · ${money(remainingOf(order, payments))} aberto`
                            : ""}
                        </p>
                      </Link>
                      {nxt ? (
                        <Button
                          size="sm"
                          variant={order.stage === "pronto" ? "sage" : "secondary"}
                          className="mt-2 h-11 w-full"
                          onClick={() => {
                            const next = advance(order.id);
                            if (next) toast.success(`${order.number} → ${STAGE_LABEL[next]}`);
                          }}
                        >
                          {order.stage === "pronto" ? "Entregar" : `Ir para ${STAGE_LABEL[nxt].toLowerCase()}`}
                        </Button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      {orders.every((o) => o.stage === "entregue" || o.stage === "cancelado") ? (
        <EmptyState title="Nada na fila" hint="Quando entrar um pedido aprovado, ele aparece aqui." />
      ) : null}
    </main>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium",
        active ? "bg-denim text-denim-fg" : "bg-wash text-muted",
      )}
    >
      {label}
      <span className="tabular-nums opacity-80">{count}</span>
    </button>
  );
}
