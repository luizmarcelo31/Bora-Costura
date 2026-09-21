import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { whatsappHref } from "@/lib/format";
import { useWorkshop } from "@/lib/store";
import { isOpen } from "@/lib/workshop";
import { AppDrawer, ClientForm } from "@/components/drawers";
import { OrderCard } from "@/components/order-card";
import { Button } from "@/components/ui";

export const Route = createFileRoute("/clientes/$id")({ component: ClienteDetail });

function ClienteDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const client = useWorkshop((s) => s.clients.find((c) => c.id === id));
  const orders = useWorkshop((s) => s.orders.filter((o) => o.clientId === id));
  const payments = useWorkshop((s) => s.payments);
  const updateClient = useWorkshop((s) => s.updateClient);
  const deleteClient = useWorkshop((s) => s.deleteClient);
  const [edit, setEdit] = useState(false);

  if (!client) {
    return (
      <main className="px-5 py-16 text-center">
        <p className="text-2xl font-semibold tracking-tight">Cliente não encontrado</p>
        <Link to="/clientes" className="mt-4 inline-block text-sm text-denim">
          Voltar
        </Link>
      </main>
    );
  }

  const open = orders.filter((o) => isOpen(o.stage));
  const done = orders.filter((o) => !isOpen(o.stage));

  return (
    <main className="pb-8">
      <header className="flex items-center gap-2 px-3 pt-4">
        <Link
          to="/clientes"
          className="flex size-11 items-center justify-center rounded-md hover:bg-wash"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Cliente</p>
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight">{client.name}</h1>
        </div>
      </header>

      <section className="mt-4 px-5">
        <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-card)]">
          {client.city ? <p className="text-sm text-muted">{client.city}</p> : null}
          {client.phone ? (
            <p className="mt-1 text-sm tabular-nums text-ink">{formatPhone(client.phone)}</p>
          ) : (
            <p className="mt-1 text-sm text-muted">Sem telefone</p>
          )}
          {client.notes ? <p className="mt-3 text-sm text-ink">{client.notes}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {client.phone ? (
              <a
                href={whatsappHref(client.phone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-sage px-4 text-sm font-medium text-denim-fg"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            ) : null}
            <Button variant="secondary" onClick={() => setEdit(true)}>
              Editar
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between px-5">
          <h2 className="text-sm font-semibold">Pedidos abertos</h2>
          <Link to="/pedidos/novo" className="flex h-9 items-center gap-1 text-[13px] font-medium text-denim">
            <Plus className="size-4" />
            Novo
          </Link>
        </div>
        {open.length === 0 ? (
          <p className="px-5 text-sm text-muted">Nenhum pedido em andamento.</p>
        ) : (
          <div className="flex flex-col gap-2 px-5">
            {open.map((order) => (
              <OrderCard key={order.id} order={order} clientName={client.name} payments={payments} />
            ))}
          </div>
        )}
      </section>

      {done.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 px-5 text-sm font-semibold">Histórico</h2>
          <div className="flex flex-col gap-2 px-5">
            {done.map((order) => (
              <OrderCard key={order.id} order={order} clientName={client.name} payments={payments} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 px-5">
        <Button
          variant="ghost"
          className="w-full text-brick"
          onClick={() => {
            const ok = deleteClient(client.id);
            if (!ok) {
              toast.error("Há pedidos vinculados. Exclua ou reatribua antes.");
              return;
            }
            toast.success("Cliente excluído.");
            void navigate({ to: "/clientes" });
          }}
        >
          Excluir cliente
        </Button>
      </section>

      <AppDrawer open={edit} onOpenChange={setEdit} title="Editar cliente">
        <ClientForm
          initial={client}
          submitLabel="Salvar alterações"
          onSubmit={(v) => {
            updateClient(client.id, v);
            setEdit(false);
            toast.success("Cliente atualizado.");
          }}
        />
      </AppDrawer>
    </main>
  );
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}
