import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Shell } from "@/components/shell";
import { WorkshopBoot } from "@/components/workshop-boot";
import appCss from "../styles.css?url";

const APP_NAME = "Linha";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

export const Route = createRootRoute({
  beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      {
        name: "description",
        content: "Gestão para confecções: gatilho rápido, pedidos, produção, caixa e relatórios em PDF.",
      },
      { name: "theme-color", content: "#f3efe8" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700&family=IBM+Plex+Serif:ital,wght@0,500;0,600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: Root,
});

function Root() {
  return (
    <html lang="pt-BR" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-bg text-ink">
        <PreviewHostBridge />
        <AuthProvider>
          <RootFrame />
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            className: "font-sans",
            style: {
              background: "#faf7f2",
              color: "#1b1d24",
              border: "1px solid #ddd4c6",
            },
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootFrame() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sessionUser } = Route.useRouteContext();
  if (pathname === "/login") return <Outlet />;
  return (
    <WorkshopBoot ssrUserId={sessionUser?.id ?? null}>
      <Shell>
        <Outlet />
      </Shell>
    </WorkshopBoot>
  );
}
