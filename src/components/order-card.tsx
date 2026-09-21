import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { formatDay, money } from "@/lib/format";
import type { Order, Payment } from "@/lib/types";
import {
  isOverdue,
  itemSummary,
  orderTotal,
  payStatus,
  prazoLabel,
  remainingOf,
} from "@/lib/workshop";
import { StageBadge } from "@/components/stage-badge";
import { cn } from "@/lib/utils";

export function OrderCard({
  order,
  clientName,
  payments,
}: {
  order: Order;
  clientName: string;
  payments: Payment[];
}) {
  const overdue = isOverdue(order);
  const remaining = remainingOf(order, payments);
  const pay = payStatus(order, payments);

  return (
    <Link
      to="/pedidos/$id"
      params={{ id: order.id }}
      className={cn(
        "flex items-stretch gap-0 rounded-lg bg-raised shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-150 active:scale-[0.99]",
        overdue && "shadow-[0_0_0_1px_var(--color-brick),0_8px_20px_rgb(27_29_36/0.04)]",
      )}
    >
      <span
        className={cn(
          "w-1 shrink-0 rounded-l-lg",
          overdue ? "bg-brick" : order.stage === "pronto" ? "bg-sage" : "bg-denim/70",
        )}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-ink tabular-nums">{order.number}</p>
            <StageBadge stage={order.stage} />
          </div>
          <p className="mt-0.5 truncate text-sm text-ink">{clientName}</p>
          <p className="truncate text-[13px] text-muted">{itemSummary(order.items)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
            <span className={cn("tabular-nums", overdue && "font-semibold text-brick")}>
              {prazoLabel(order)} · {formatDay(order.dueDate)}
            </span>
            <span className="tabular-nums">
              {pay === "pago" ? money(orderTotal(order)) : `${money(remaining)} em aberto`}
            </span>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-subtle" />
      </div>
    </Link>
  );
}
