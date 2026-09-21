import { type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, Home, Scissors, UserRound, Users, Wallet, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkshop } from "@/lib/store";

const NAV_DESKTOP = [
  { to: "/", label: "Início", icon: Home },
  { to: "/rapido", label: "Rápido", icon: Zap },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/producao", label: "Produção", icon: Scissors },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/financeiro", label: "Caixa", icon: Wallet },
] as const;

const NAV_MOBILE = [
  { to: "/", label: "Início", icon: Home },
  { to: "/rapido", label: "Rápido", icon: Zap },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/financeiro", label: "Caixa", icon: Wallet },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#2A4A62" />
      <path
        d="M8 20.5c3.2-6 5.4-9.2 8-9.2 2.4 0 3.2 2.6 4.2 2.6 1.4 0 2.6-2.4 4.8-6.4"
        fill="none"
        stroke="#F3EFE8"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="22.5" cy="9.2" r="1.35" fill="#F3EFE8" />
    </svg>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const atelier = useWorkshop((s) => s.profile.atelierName);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 border-r border-line bg-surface md:flex md:flex-col">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <LogoMark className="size-8" />
          <div>
            <p className="font-display text-[1.65rem] leading-none text-ink">Linha</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              {atelier || "Confecção"}
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {NAV_DESKTOP.map((item) => {
            const active = isActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                  active ? "bg-denim text-denim-fg" : "text-muted hover:bg-wash hover:text-ink",
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/conta"
          className={cn(
            "mx-3 mb-4 flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium",
            isActive(pathname, "/conta") ? "bg-wash text-ink" : "text-muted hover:bg-wash hover:text-ink",
          )}
        >
          <UserRound className="size-4" strokeWidth={1.75} />
          Minha conta
        </Link>
      </aside>

      <div className="md:pl-56">
        <div className="mx-auto min-h-dvh w-full max-w-3xl pb-[5.5rem] md:max-w-5xl md:pb-10">
          {children}
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {NAV_MOBILE.map((item) => {
            const active = isActive(pathname, item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                    active ? "text-denim" : "text-subtle",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.1 : 1.7} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHead({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pb-4 pt-6 md:pt-8">
      <div className="min-w-0">
        {kicker ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{kicker}</p>
        ) : null}
        <h1 className="mt-1 text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-ink">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-5 rounded-xl bg-raised px-5 py-10 text-center shadow-[var(--shadow-card)]">
      <p className="text-xl font-semibold tracking-tight">{title}</p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">{hint}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
