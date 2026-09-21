import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useWorkshop } from "@/lib/store";
import { isOpen } from "@/lib/workshop";
import { AppDrawer, ClientForm } from "@/components/drawers";
import { EmptyState, PageHead } from "@/components/shell";
import { Button, Input } from "@/components/ui";

export const Route = createFileRoute("/clientes/")({ component: ClientesPage });

function ClientesPage() {
  const clients = useWorkshop((s) => s.clients);
  const orders = useWorkshop((s) => s.orders);
  const addClient = useWorkshop((s) => s.addClient);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return clients
      .filter((c) => {
        if (!query) return true;
        return `${c.name} ${c.city} ${c.phone}`.toLowerCase().includes(query);
      })
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [clients, q]);

  return (
    <main>
      <PageHead
        kicker="Cadastro"
        title="Clientes"
        action={
          <Button size="sm" className="gap-1.5 pl-3 pr-3.5" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Novo
          </Button>
        }
      />

      <div className="px-5">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, cidade ou telefone"
            className="pl-10"
          />
        </div>
      </div>

      <ul className="mt-4 px-5">
        {list.length === 0 ? (
          <EmptyState
            title="Sem clientes"
            hint="Cadastre lojas e clientes particulares para vincular aos pedidos."
            action={
              <Button onClick={() => setOpen(true)}>Novo cliente</Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-raised shadow-[var(--shadow-card)]">
            {list.map((c, i) => {
              const openOrders = orders.filter((o) => o.clientId === c.id && isOpen(o.stage)).length;
              return (
                <Link
                  key={c.id}
                  to="/clientes/$id"
                  params={{ id: c.id }}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-wash text-lg font-semibold text-denim">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-[13px] text-muted">
                      {c.city || "Sem cidade"}
                      {openOrders > 0 ? ` · ${openOrders} em andamento` : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-subtle" />
                </Link>
              );
            })}
          </div>
        )}
      </ul>

      <AppDrawer open={open} onOpenChange={setOpen} title="Novo cliente">
        <ClientForm
          submitLabel="Salvar cliente"
          onSubmit={(v) => {
            addClient(v);
            setOpen(false);
            toast.success("Cliente cadastrado.");
          }}
        />
      </AppDrawer>
    </main>
  );
}
