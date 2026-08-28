import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { listEjecuciones } from "@/lib/homologacion.functions";
import { formatFecha } from "@/lib/format";

export const Route = createFileRoute("/historial/")({
  head: () => ({
    meta: [
      { title: "Historial — HOMOLOGA" },
      { name: "description", content: "Historial de ejecuciones de homologación por cargo interno." },
      { property: "og:title", content: "Historial — HOMOLOGA" },
      { property: "og:description", content: "Revisa las ejecuciones de homologación y sus resultados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistorialPage,
});

function HistorialPage() {
  const list = useServerFn(listEjecuciones);
  const { data, isLoading } = useQuery({ queryKey: ["ejecuciones"], queryFn: () => list() });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Historial</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">Aún no hay ejecuciones.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="border-b py-2">Cargo interno</th>
              <th className="border-b py-2">Empresa</th>
              <th className="border-b py-2">Fecha</th>
              <th className="border-b py-2">Estado</th>
              <th className="border-b py-2" />
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id}>
                <td className="border-b py-2">{e.cargos?.nombre ?? "—"}</td>
                <td className="border-b py-2">{e.cargos?.empresas?.nombre ?? "—"}</td>
                <td className="border-b py-2">{formatFecha(e.fecha)}</td>
                <td className="border-b py-2">{e.estado}</td>
                <td className="border-b py-2 text-right">
                  <Link
                    to="/historial/$id"
                    params={{ id: e.id }}
                    className="text-primary hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
