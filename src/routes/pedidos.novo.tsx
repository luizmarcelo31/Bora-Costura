import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { todayIso, money } from "@/lib/format";
import { useWorkshop } from "@/lib/store";
import type { OrderItem, ProductionStage } from "@/lib/types";
import { SIZE_OPTIONS, STAGE_LABEL, STAGES, orderTotal } from "@/lib/workshop";
import { uid } from "@/lib/utils";
import { AppDrawer, ClientForm } from "@/components/drawers";
import { PageHead } from "@/components/shell";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export const Route = createFileRoute("/pedidos/novo")({ component: NovoPedido });

function emptyItem(): OrderItem {
  return {
    id: uid("i"),
    description: "",
    fabric: "",
    color: "",
    size: "M",
    quantity: 1,
    unitPrice: 0,
  };
}

function NovoPedido() {
  const navigate = useNavigate();
  const clients = useWorkshop((s) => s.clients);
  const addOrder = useWorkshop((s) => s.addOrder);
  const addClient = useWorkshop((s) => s.addClient);

  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [stage, setStage] = useState<ProductionStage>("aprovado");
  const [dueDate, setDueDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [clientOpen, setClientOpen] = useState(false);

  const total = useMemo(() => orderTotal({ items }), [items]);

  function patchItem(id: string, patch: Partial<OrderItem>) {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  return (
    <main>
      <PageHead kicker="Novo" title="Pedido" />
      <form
        className="flex flex-col gap-4 px-5 pb-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (!clientId) {
            toast.error("Selecione um cliente.");
            return;
          }
          const clean = items.filter((i) => i.description.trim() && i.quantity > 0);
          if (clean.length === 0) {
            toast.error("Inclua ao menos uma peça.");
            return;
          }
          const id = addOrder({
            clientId,
            items: clean,
            stage,
            dueDate,
            deliveryDate: dueDate,
            deliveredAt: null,
            notes: notes.trim(),
          });
          toast.success("Pedido criado.");
          void navigate({ to: "/pedidos/$id", params: { id } });
        }}
      >
        <Field label="Cliente">
          <div className="flex gap-2">
            <Select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex-1"
            >
              {clients.length === 0 ? <option value="">Nenhum cliente</option> : null}
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Button type="button" variant="secondary" onClick={() => setClientOpen(true)}>
              Novo
            </Button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Etapa">
            <Select value={stage} onChange={(e) => setStage(e.target.value as ProductionStage)}>
              {STAGES.filter((s) => s !== "entregue").map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prazo">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted">Peças</p>
            <button
              type="button"
              className="flex h-9 items-center gap-1 text-[13px] font-medium text-denim"
              onClick={() => setItems((list) => [...list, emptyItem()])}
            >
              <Plus className="size-4" />
              Adicionar peça
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {items.map((item, idx) => (
              <div key={item.id} className="rounded-lg bg-raised p-3 shadow-[var(--shadow-card)]">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[12px] font-medium text-muted">Peça {idx + 1}</p>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      className="flex size-9 items-center justify-center text-brick"
                      onClick={() => setItems((list) => list.filter((i) => i.id !== item.id))}
                      aria-label="Remover peça"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
                <Field label="Modelo">
                  <Input
                    value={item.description}
                    onChange={(e) => patchItem(item.id, { description: e.target.value })}
                    placeholder="Vestido midi, camisa polo…"
                  />
                </Field>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Tecido">
                    <Input
                      value={item.fabric}
                      onChange={(e) => patchItem(item.id, { fabric: e.target.value })}
                      placeholder="Linho, malha…"
                    />
                  </Field>
                  <Field label="Cor">
                    <Input
                      value={item.color}
                      onChange={(e) => patchItem(item.id, { color: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Field label="Tam.">
                    <Input
                      value={item.size}
                      onChange={(e) => patchItem(item.id, { size: e.target.value })}
                      list="sizes"
                    />
                  </Field>
                  <Field label="Qtd">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        patchItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="tabular-nums"
                    />
                  </Field>
                  <Field label="R$ un.">
                    <Input
                      inputMode="decimal"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        patchItem(item.id, {
                          unitPrice: Number(e.target.value.replace(",", ".")) || 0,
                        })
                      }
                      className="tabular-nums"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <datalist id="sizes">
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <Field label="Observações">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Acabamento, prova, retirada…"
          />
        </Field>

        <div className="flex items-center justify-between rounded-lg bg-denim px-4 py-3 text-denim-fg">
          <span className="text-sm">Total</span>
          <span className="text-[1.5rem] font-semibold tracking-tight tabular-nums">{money(total)}</span>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Salvar pedido
        </Button>
      </form>

      <AppDrawer open={clientOpen} onOpenChange={setClientOpen} title="Novo cliente">
        <ClientForm
          submitLabel="Cadastrar e usar"
          onSubmit={(v) => {
            const id = addClient(v);
            setClientId(id);
            setClientOpen(false);
            toast.success("Cliente cadastrado.");
          }}
        />
      </AppDrawer>
    </main>
  );
}
