import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Plus, Zap } from "lucide-react";
import { greeting, money, todayLabel } from "@/lib/format";
import { useWorkshop } from "@/lib/store";
import { STAGES } from "@/lib/types";
import {
  clientById,
  isOpen,
  isOverdue,
  remainingOf,
  STAGE_LABEL,
} from "@/lib/workshop";
import { OrderCard } from "@/components/order-card";
import { LogoMark } from "@/components/shell";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const clients = useWorkshop((s) => s.clients);
  const orders = useWorkshop((s) => s.orders);
  const payments = useWorkshop((s) => s.payments);
  const profile = useWorkshop((s) => s.profile);
  const resetDemo = useWorkshop((s) => s.resetDemo);

  const open = orders.filter((o) => isOpen(o.stage));
  const overdue = open.filter(isOverdue);
  const dueSoon = open
    .filter((o) => !isOverdue(o))
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const toReceive = open.reduce((sum, o) => sum + remainingOf(o, payments), 0);
  const inProduction = open.filter((o) => o.stage !== "orcamento" && o.stage !== "pronto").length;
  const ready = open.filter((o) => o.stage === "pronto");
  const quotes = open.filter((o) => o.stage === "orcamento").length;
  const triggers = overdue.length + ready.length + quotes;

  const stageCounts = STAGES.map((stage) => ({
    stage,
    count: orders.filter((o) => o.stage === stage).length,
  }));
  const maxCount = Math.max(1, ...stageCounts.map((s) => s.count));

  return (
    <main>
      <header className="flex items-center justify-between px-5 pt-6 md:pt-8">
        <div className="flex items-center gap-2.5 md:hidden">
          <Link to="/conta" className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <p className="font-display text-[1.65rem] leading-none">Linha</p>
          </Link>
        </div>
        <p className="hidden text-[11px] font-medium uppercase tracking-[0.16em] text-muted md:block">
          Painel
        </p>
        <Link to="/pedidos/novo">
          <Button size="sm" className="gap-1.5 pl-3 pr-3.5">
            <Plus className="size-4" />
            Novo pedido
          </Button>
        </Link>
      </header>

      <section className="px-5 pt-6">
        <p className="text-[13px] font-medium text-muted">{todayLabel()}</p>
        <h1 className="mt-1 text-[2.15rem] font-semibold leading-[1.1] tracking-tight text-ink">
          {greeting()}
          {profile.ownerName ? `, ${profile.ownerName.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-2 max-w-md text-[15px] leading-6 text-muted">
          {overdue.length > 0
            ? `${overdue.length} pedido${overdue.length > 1 ? "s" : ""} atrasado${overdue.length > 1 ? "s" : ""} · ${money(toReceive)} a receber`
            : `${open.length} em andamento · ${money(toReceive)} a receber`}
        </p>
      </section>

      <section className="mt-5 px-5">
        <Link
          to="/rapido"
          className="flex items-center gap-3 rounded-xl bg-denim px-4 py-3.5 text-denim-fg shadow-[var(--shadow-card)]"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-white/10">
            <Zap className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold tracking-tight">Gatilho rápido</span>
            <span className="block text-[13px] text-denim-fg/75">
              {triggers > 0
                ? `${triggers} ação${triggers > 1 ? "ões" : ""} com um toque`
                : "Fila limpa — abrir a operação"}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 opacity-80" />
        </Link>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-2.5 px-5 md:grid-cols-4">
        <Kpi label="A receber" value={money(toReceive)} />
        <Kpi label="Em produção" value={String(inProduction)} />
        <Kpi label="Atrasados" value={String(overdue.length)} alert={overdue.length > 0} />
        <Kpi label="Prontos" value={String(ready.length)} />
      </section>

      {overdue.length > 0 ? (
        <section className="mt-7">
          <SectionTitle
            title="Atrasados"
            to="/rapido"
            extra={<AlertTriangle className="size-4 text-brick" />}
          />
          <div className="flex flex-col gap-2 px-5">
            {overdue.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
                payments={payments}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-7">
        <SectionTitle title="Prazos da semana" to="/pedidos" />
        {dueSoon.length === 0 ? (
          <p className="px-5 text-sm text-muted">Nenhum prazo próximo. Bom sinal.</p>
        ) : (
          <div className="flex flex-col gap-2 px-5">
            {dueSoon.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
                payments={payments}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-7 px-5">
        <SectionTitle title="Linha de produção" to="/producao" flush />
        <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-card)]">
          <div className="flex h-10 items-end gap-1.5">
            {stageCounts
              .filter((s) => s.stage !== "entregue")
              .map((s) => (
                <div key={s.stage} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      "w-full rounded-sm",
                      s.stage === "pronto" ? "bg-sage" : "bg-denim",
                    )}
                    style={{ height: `${Math.max(6, (s.count / maxCount) * 40)}px` }}
                  />
                </div>
              ))}
          </div>
          <div className="mt-2 flex gap-1.5">
            {stageCounts
              .filter((s) => s.stage !== "entregue")
              .map((s) => (
                <p key={s.stage} className="min-w-0 flex-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted">
                  {STAGE_LABEL[s.stage].slice(0, 4)}
                  <span className="mt-0.5 block tabular-nums text-[13px] font-semibold text-ink">{s.count}</span>
                </p>
              ))}
          </div>
        </div>
      </section>

      {ready.length > 0 ? (
        <section className="mt-7">
          <SectionTitle title="Prontos para entregar" to="/rapido" />
          <div className="flex flex-col gap-2 px-5">
            {ready.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
                payments={payments}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 px-5 pb-4">
        <span className="stitch mb-4 block" />
        <button
          type="button"
          onClick={() => resetDemo()}
          className="text-[12px] font-medium text-subtle underline-offset-2 hover:text-muted hover:underline"
        >
          Restaurar dados de exemplo
        </button>
      </section>
    </main>
  );
}

function Kpi({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-lg bg-raised px-3.5 py-3 shadow-[var(--shadow-card)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={cn("mt-1 truncate text-[1.35rem] font-semibold tracking-tight tabular-nums md:text-[1.5rem]", alert ? "text-brick" : "text-ink")}>
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  to,
  extra,
  flush,
}: {
  title: string;
  to: string;
  extra?: ReactNode;
  flush?: boolean;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", flush ? "" : "px-5")}>
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-sm font-semibold tracking-tight text-ink">{title}</h2>
        {extra}
      </div>
      <Link to={to} className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-denim">
        Ver
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
