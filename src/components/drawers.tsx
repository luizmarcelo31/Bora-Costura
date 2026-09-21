import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { todayIso } from "@/lib/format";
import { useWorkshop } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";
import { METHOD_LABEL, PAYMENT_METHODS } from "@/lib/workshop";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

export function AppDrawer({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-xl bg-bg outline-none">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />
          <Drawer.Title className="px-5 pt-4 text-2xl font-semibold tracking-tight">{title}</Drawer.Title>
          <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function ClientForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: { name: string; phone: string; city: string; notes: string };
  submitLabel: string;
  onSubmit: (v: { name: string; phone: string; city: string; notes: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          toast.error("Informe o nome do cliente.");
          return;
        }
        onSubmit({
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
          notes: notes.trim(),
        });
      }}
    >
      <Field label="Nome">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome ou loja" required />
      </Field>
      <Field label="WhatsApp">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="11 99999-0000"
          inputMode="tel"
        />
      </Field>
      <Field label="Cidade">
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" />
      </Field>
      <Field label="Observações">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Preferências, retirada, grade…" />
      </Field>
      <Button type="submit" className="mt-2 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}

export function PaymentForm({
  orderId,
  remaining,
  onDone,
}: {
  orderId: string;
  remaining: number;
  onDone: () => void;
}) {
  const addPayment = useWorkshop((s) => s.addPayment);
  const [amount, setAmount] = useState(remaining > 0 ? remaining.toFixed(2) : "");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(String(amount).replace(",", "."));
        if (!Number.isFinite(value) || value <= 0) {
          toast.error("Informe um valor válido.");
          return;
        }
        addPayment({ orderId, amount: value, method, date, note: note.trim() });
        toast.success("Pagamento registrado.");
        onDone();
      }}
    >
      <Field label="Valor (R$)">
        <Input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="tabular-nums"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Forma">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {METHOD_LABEL[m]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Data">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Nota (opcional)">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sinal, restante…" />
      </Field>
      <Button type="submit" className="mt-2 w-full">
        Registrar recebimento
      </Button>
    </form>
  );
}
