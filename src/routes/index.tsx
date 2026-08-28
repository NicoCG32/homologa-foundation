import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HOMOLOGA — Homologación de cargos" },
      {
        name: "description",
        content:
          "Base para homologar cargos internos con cargos de referencia: empresas, cargos, criterios y ejecuciones.",
      },
      { property: "og:title", content: "HOMOLOGA — Homologación de cargos" },
      {
        property: "og:description",
        content: "Gestiona empresas, cargos, criterios y ejecuciones de homologación.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const pasos = [
  "Cargo interno",
  "Motor determinístico",
  "Candidatos preseleccionados",
  "Análisis semántico",
  "Resultado",
  "Decisión profesional",
  "Comparación salarial",
];

function Index() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">HOMOLOGA</h1>
        <p className="mt-2 text-muted-foreground">
          Base mínima para el flujo de homologación de cargos. El motor determinístico y el análisis
          semántico se implementarán en una etapa posterior.
        </p>
      </header>

      <section className="rounded-lg border p-4">
        <h2 className="text-sm font-medium uppercase text-muted-foreground">Flujo</h2>
        <ol className="mt-3 space-y-1 text-sm">
          {pasos.map((paso, i) => (
            <li key={paso}>
              <span className="text-muted-foreground">{i + 1}.</span> {paso}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { to: "/empresas", title: "Empresas", desc: "Registra empresas y su tamaño." },
          { to: "/cargos", title: "Cargos", desc: "Cargos internos y de referencia con sueldo." },
          { to: "/criterios", title: "Criterios", desc: "Criterios y pesos de comparación." },
          {
            to: "/homologacion/nueva",
            title: "Nueva homologación",
            desc: "Crea una ejecución para un cargo interno.",
          },
          { to: "/historial", title: "Historial", desc: "Ejecuciones y sus resultados." },
        ].map((c) => (
          <Link key={c.to} to={c.to} className="rounded-lg border p-4 hover:bg-accent">
            <div className="font-medium">{c.title}</div>
            <div className="text-sm text-muted-foreground">{c.desc}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
