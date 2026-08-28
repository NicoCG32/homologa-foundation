import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getEjecucion } from "@/lib/homologacion.functions";
import { formatFecha, formatSueldo } from "@/lib/format";

export const Route = createFileRoute("/historial/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de ejecución — HOMOLOGA" },
      { name: "description", content: "Resultados de una ejecución de homologación y comparación salarial." },
      { property: "og:title", content: "Detalle de ejecución — HOMOLOGA" },
      { property: "og:description", content: "Resultados y comparación salarial de una homologación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EjecucionDetalle,
});

function EjecucionDetalle() {
  const { id } = Route.useParams();
  const get = useServerFn(getEjecucion);
  const { data, isLoading } = useQuery({
    queryKey: ["ejecucion", id],
    queryFn: () => get({ data: { id } }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!data?.ejecucion) return <p className="text-sm text-muted-foreground">Ejecución no encontrada.</p>;

  const { ejecucion } = data;
  const resultados = data.resultados ?? [];
  const cargo = ejecucion.cargos;
  const sueldoInterno = cargo?.sueldo != null ? Number(cargo.sueldo) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/historial" className="text-sm text-muted-foreground hover:underline">
        ← Historial
      </Link>
      <h1 className="text-2xl font-semibold">{cargo?.nombre ?? "Ejecución"}</h1>
      <div className="text-sm text-muted-foreground">
        {cargo?.empresas?.nombre ?? "—"} · {formatFecha(ejecucion.fecha)} · Estado: {ejecucion.estado}
      </div>
      {cargo?.descripcion && <p className="text-sm">{cargo.descripcion}</p>}
      <div className="rounded-lg border p-4 text-sm">
        Sueldo del cargo interno: <strong>{formatSueldo(cargo?.sueldo)}</strong>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Resultados</h2>
        {!resultados.length ? (
          <p className="text-sm text-muted-foreground">
            Sin resultados todavía. El motor de homologación se implementará en la siguiente etapa.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="border-b py-2">Candidato</th>
                <th className="border-b py-2">Determinístico</th>
                <th className="border-b py-2">Semántico</th>
                <th className="border-b py-2">Final</th>
                <th className="border-b py-2">Sueldo</th>
                <th className="border-b py-2">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => {
                const sc = r.cargos?.sueldo != null ? Number(r.cargos.sueldo) : null;
                const diff = sueldoInterno != null && sc != null ? sc - sueldoInterno : null;
                return (
                  <tr key={r.id}>
                    <td className="border-b py-2">
                      {r.cargos?.nombre ?? "—"}
                      <div className="text-xs text-muted-foreground">
                        {r.cargos?.empresas?.nombre ?? ""}
                      </div>
                    </td>
                    <td className="border-b py-2">{r.score_deterministico ?? "—"}</td>
                    <td className="border-b py-2">{r.score_semantico ?? "—"}</td>
                    <td className="border-b py-2">{r.score_final ?? "—"}</td>
                    <td className="border-b py-2">{formatSueldo(r.cargos?.sueldo)}</td>
                    <td className="border-b py-2">
                      {diff === null ? "—" : `${diff > 0 ? "+" : ""}${formatSueldo(diff)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
