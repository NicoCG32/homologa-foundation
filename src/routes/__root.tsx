import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Building2, ClipboardList, History, Home, Settings2, Sparkles } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import logoAsset from "../assets/espejo-homologa-logo.jpg.asset.json";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Espejo: Homologa" },
      { name: "description", content: "Encuentra cargos equivalentes con un proceso claro y guiado." },
      { name: "author", content: "Espejo: Homologa" },
      { property: "og:title", content: "Espejo: Homologa" },
      { property: "og:description", content: "Encuentra cargos equivalentes con un proceso claro y guiado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600&family=Urbanist:wght@600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "Inicio", icon: Home, group: "principal" },
  { to: "/homologacion/nueva", label: "Seleccionar cargo", icon: Sparkles, group: "principal" },
  { to: "/historial", label: "Historial", icon: History, group: "principal" },
  { to: "/cargos", label: "Cargos", icon: ClipboardList, group: "gestión" },
  { to: "/empresas", label: "Empresas", icon: Building2, group: "gestión" },
  { to: "/criterios", label: "Criterios", icon: Settings2, group: "gestión" },
] as const;

const JOURNEY = ["Cargo", "Revisión", "Candidatos", "Análisis IA", "Decisión"];

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isProcess = pathname.startsWith("/homologacion") || pathname.startsWith("/historial/");

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-frame">
        <aside className="app-sidebar">
          <Link to="/" className="brand-lockup" aria-label="Espejo: Homologa — Inicio">
            <img src={logoAsset.url} alt="Logo oficial de Espejo: Homologa" />
            <span><strong>Espejo:</strong> Homologa</span>
          </Link>
          <nav className="sidebar-nav" aria-label="Navegación principal">
            <p>Principal</p>
            {NAV.filter((item) => item.group === "principal").map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === "/" }} activeProps={{ className: "active" }}>
                  <Icon aria-hidden="true" /> <span>{item.label}</span>
                </Link>
              );
            })}
            <p>Gestión</p>
            {NAV.filter((item) => item.group === "gestión").map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} activeProps={{ className: "active" }}>
                  <Icon aria-hidden="true" /> <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="sidebar-note">
            <span>Decisión asistida</span>
            <p>La recomendación orienta. La decisión final siempre es tuya.</p>
          </div>
        </aside>
        <div className="app-workspace">
          <header className="workspace-header">
            <Link to="/" className="mobile-brand">Espejo: <strong>Homologa</strong></Link>
            {isProcess ? (
              <ol className="journey" aria-label="Etapas de la homologación">
                {JOURNEY.map((step, index) => <li key={step} className={index === 0 ? "current" : ""}><span>{index + 1}</span>{step}</li>)}
              </ol>
            ) : (
              <p>Inteligencia para encontrar equivalencias entre cargos</p>
            )}
            <div className="user-mark" aria-label="Perfil">PG</div>
          </header>
          <main className="workspace-content">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          </main>
        </div>
      </div>
    </QueryClientProvider>
  );
}
