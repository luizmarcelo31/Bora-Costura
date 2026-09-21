import { useEffect, type ReactNode } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useWorkshop } from "@/lib/store";
import { LoginScreen } from "@/components/login-screen";
import { LogoMark } from "@/components/shell";

export function WorkshopBoot({
  children,
  ssrUserId,
}: {
  children: ReactNode;
  ssrUserId: string | null;
}) {
  const { user } = useCurrentUserState();
  const ready = useWorkshop((s) => s.ready);
  const refresh = useWorkshop((s) => s.refresh);
  const userId = user?.id ?? ssrUserId;

  useEffect(() => {
    if (!userId) return;
    void refresh();
  }, [userId, refresh]);

  if (!userId) return <LoginScreen />;
  if (!ready) return <BootSkeleton />;
  return <>{children}</>;
}

function BootSkeleton() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5">
      <div className="text-center">
        <LogoMark className="mx-auto size-10" />
        <p className="mt-4 font-display text-[1.65rem] leading-none text-ink">Linha</p>
        <p className="mt-3 text-sm text-muted">Carregando a oficina…</p>
      </div>
    </div>
  );
}
