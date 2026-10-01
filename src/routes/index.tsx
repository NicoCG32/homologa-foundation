import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BriefcaseBusiness, Building2, History, Search, Settings2 } from "lucide-react";
import { Bienvenida } from "@/components/bienvenida";
import { LogoPrincipal } from "@/components/logo-principal";
import { listCargos } from "@/lib/cargos.functions";
import { listHomologados } from "@/lib/homologacion.functions";
import { Skeleton } from "@/components/loading-skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio — Espejo: Homologa" },
      {
        name: "description",
        content:
          "Selecciona un cargo y encuentra sus equivalentes con Espejo: Homologa.",
      },
      { property: "og:title", content: "Espejo: Homologa" },
      {
        property: "og:description",
        content: "Selecciona un cargo y encuentra sus equivalentes con un proceso claro y guiado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const listC = useServerFn(listCargos);
  const listH = useServerFn(listHomologados);
  const cargos = useQuery({ queryKey: ["cargos"], queryFn: () => listC() });
  const homologados = useQuery({ queryKey: ["homologados"], queryFn: () => listH() });

  const internos = (cargos.data ?? []).filter((c) => c.tipo === "INTERNO");
  const hechos = new Set((homologados.data ?? []).map((h) => h.cargo_id));
  const completados = internos.filter((c) => hechos.has(c.id)).length;
  const pendientes = internos.length - completados;
  const avance = internos.length ? Math.round((completados / internos.length) * 100) : 0;

  return (
    <div className="home-page">
      <Bienvenida />
      <section className="home-intro">
        <div>
          <p className="eyebrow">Bienvenido a Espejo: Homologa</p>
          <h1>¿Qué cargo quieres homologar?</h1>
          <p>Selecciona un cargo para encontrar equivalencias y tomar una decisión con información clara.</p>
          <Link to="/homologacion/nueva" className="primary-action">
            <Search aria-hidden="true" /> Seleccionar cargo <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="home-logo-wrap">
          <LogoPrincipal className="home-hero-logo" eager />
        </div>
      </section>

      <section className="avance-panel" aria-label="Avance del catálogo">
        <div className="avance-grid">
          <article className="avance-card">
            <span>Cargos internos</span>
            {cargos.isLoading ? <Skeleton className="skeleton-title" /> : <strong>{internos.length}</strong>}
            <small>En el catálogo de tu empresa</small>
          </article>
          <article className="avance-card">
            <span>Ya homologados</span>
            {cargos.isLoading || homologados.isLoading ? <Skeleton className="skeleton-title" /> : <strong>{completados}</strong>}
            <small>Con decisión registrada</small>
          </article>
          <article className="avance-card">
            <span>Pendientes</span>
            {cargos.isLoading || homologados.isLoading ? <Skeleton className="skeleton-title" /> : <strong>{Math.max(0, pendientes)}</strong>}
            <small>Aún sin equivalencia elegida</small>
          </article>
        </div>
        {cargos.isLoading || homologados.isLoading
          ? <Skeleton className="avance-bar" />
          : <div className="avance-bar" aria-hidden="true"><i style={{ width: `${avance}%` }} /></div>}
        <div className="avance-foot">
          <p>{internos.length ? `${avance}% del catálogo interno ya tiene una equivalencia decidida.` : "Aún no hay cargos internos cargados."}</p>
          {pendientes > 0 && (
            <Link to="/homologacion/nueva" className="primary-action">
              Homologar el siguiente pendiente <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <section className="quick-grid" aria-label="Accesos rápidos">
        <Link to="/criterios" className="quick-featured">
          <Settings2 /><span><strong>Criterios y pesos</strong><small>Ajusta cuánto pesa cada columna y guarda tus combinaciones.</small></span><ArrowRight />
        </Link>
        <Link to="/cargos"><BriefcaseBusiness /><span><strong>Cargos</strong><small>Revisa y administra los cargos disponibles.</small></span><ArrowRight /></Link>
        <Link to="/historial"><History /><span><strong>Historial</strong><small>Consulta homologaciones y resultados anteriores.</small></span><ArrowRight /></Link>
        <Link to="/empresas"><Building2 /><span><strong>Empresas</strong><small>Mantén actualizada la información de empresas.</small></span><ArrowRight /></Link>
      </section>

    </div>
  );
}
