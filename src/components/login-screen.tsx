import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { LogoMark } from "@/components/shell";
import { Button, Field, Input } from "@/components/ui";

export function LoginScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim(),
        });
        if (err) throw new Error(err.message ?? "Não foi possível criar a conta.");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message ?? "E-mail ou senha inválidos.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no acesso.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark className="size-10" />
          <div>
            <p className="font-display text-[1.65rem] leading-none text-ink">Linha</p>
            <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.16em] text-muted">
              Confecção
            </p>
          </div>
        </div>
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-ink">Entrar na oficina</h1>
        <p className="mt-2 text-[15px] leading-6 text-muted">
          Pedidos, produção e caixa no mesmo lugar — com a sua conta.
        </p>

        {authEnabled ? (
          <div className="mt-7 flex flex-col gap-2">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                Continuar com {p.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">Acesso desativado neste ambiente.</p>
        )}

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle">ou e-mail</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form className="flex flex-col gap-3" onSubmit={onEmail}>
          {mode === "signup" ? (
            <Field label="Nome do ateliê">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ateliê Linha"
                autoComplete="organization"
              />
            </Field>
          ) : null}
          <Field label="E-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@atelier.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              minLength={8}
              required
            />
          </Field>
          {error ? <p className="text-sm text-brick">{error}</p> : null}
          <Button type="submit" className="mt-1 w-full" disabled={busy}>
            {busy ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-5 text-sm font-medium text-denim"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}
