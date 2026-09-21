import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useWorkshop } from "@/lib/store";
import { clientById, isOpen, isOverdue, itemSummary } from "@/lib/workshop";
import { OrderCard } from "@/components/order-card";
import { EmptyState, PageHead } from "@/components/shell";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pedidos/")({ component: PedidosPage });

const FILTERS = [
  { id: "abertos", label: "Abertos" },
  { id: "atraso", label: "Atraso" },
  { id: "pronto", label: "Prontos" },
  { id: "todos", label: "Todos" },
] as const;

function PedidosPage() {
  const orders = useWorkshop((s) => s.orders);
  const clients = useWorkshop((s) => s.clients);
  const payments = useWorkshop((s) => s.payments);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("abertos");

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (filter === "abertos") return isOpen(o.stage);
        if (filter === "atraso") return isOverdue(o);
        if (filter === "pronto") return o.stage === "pronto";
        return true;
      })
      .filter((o) => {
        if (!query) return true;
        const client = clientById(clients, o.clientId);
        const hay = `${o.number} ${client?.name ?? ""} ${itemSummary(o.items)}`.toLowerCase();
        return hay.includes(query);
      })
      .slice()
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [orders, clients, q, filter]);

  return (
    <main>
      <PageHead
        kicker="Carteira"
        title="Pedidos"
        action={
          <Link to="/pedidos/novo">
            <Button size="sm" className="gap-1.5 pl-3 pr-3.5">
              <Plus className="size-4" />
              Novo
            </Button>
          </Link>
        }
      />

      <div className="px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente, peça ou número"
            className="pl-10"
          />
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-150",
                filter === f.id ? "bg-denim text-denim-fg" : "bg-wash text-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 px-5">
        {list.length === 0 ? (
          <EmptyState
            title="Nada por aqui"
            hint={q ? "Tente outro termo de busca." : "Crie o primeiro pedido da oficina."}
            action={
              <Link to="/pedidos/novo">
                <Button>Novo pedido</Button>
              </Link>
            }
          />
        ) : (
          list.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              clientName={clientById(clients, order.clientId)?.name ?? "Cliente"}
              payments={payments}
            />
          ))
        )}
      </div>
    </main>
  );
}
