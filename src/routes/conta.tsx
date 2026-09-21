import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useWorkshop } from "@/lib/store";
import { PageHead } from "@/components/shell";
import { Button, Field, Input } from "@/components/ui";

export const Route = createFileRoute("/conta")({ component: ContaPage });

function ContaPage() {
  const user = useCurrentUser();
  const profile = useWorkshop((s) => s.profile);
  const updateProfile = useWorkshop((s) => s.updateProfile);
  const resetDemo = useWorkshop((s) => s.resetDemo);
  const [atelierName, setAtelierName] = useState(profile.atelierName);
  const [ownerName, setOwnerName] = useState(profile.ownerName || user?.displayName || "");
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city);
  const [saving, setSaving] = useState(false);

  return (
    <main className="pb-10">
      <PageHead kicker="Espaço" title="Minha conta" />

      <section className="px-5">
        <div className="rounded-xl bg-raised p-4 shadow-[var(--shadow-card)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Sessão</p>
          <div className="mt-3">
            <UserButton />
          </div>
          {user?.primaryEmail ? (
            <p className="mt-3 text-sm text-muted">{user.primaryEmail}</p>
          ) : null}
        </div>
      </section>

      <form
        className="mt-6 flex flex-col gap-3 px-5"
        onSubmit={(e) => {
          e.preventDefault();
          setSaving(true);
          void updateProfile({
            atelierName,
            ownerName,
            phone,
            city,
          }).then(() => {
            setSaving(false);
            toast.success("Conta atualizada.");
          });
        }}
      >
        <h2 className="text-sm font-semibold tracking-tight">Ateliê</h2>
        <Field label="Nome do ateliê">
          <Input value={atelierName} onChange={(e) => setAtelierName(e.target.value)} />
        </Field>
        <Field label="Responsável">
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="WhatsApp">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </Field>
          <Field label="Cidade">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
        </div>
        <Button type="submit" className="mt-2 w-full" disabled={saving}>
          {saving ? "Salvando…" : "Salvar conta"}
        </Button>
      </form>

      <section className="mt-10 px-5">
        <span className="mb-4 block h-px bg-line" />
        <p className="text-sm leading-6 text-muted">
          Os dados desta conta ficam no banco da aplicação (Postgres). O schema em
          SQL já está pronto para o mesmo modelo no Supabase.
        </p>
        <button
          type="button"
          className="mt-4 text-[13px] font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
          onClick={() => {
            void resetDemo().then(() => toast.success("Exemplos restaurados."));
          }}
        >
          Restaurar dados de exemplo
        </button>
      </section>
    </main>
  );
}
