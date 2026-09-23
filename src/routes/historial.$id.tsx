import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getEjecucion } from "@/lib/homologacion.functions";
import { formatFecha, formatSueldo } from "@/lib/format";
import { DecisionForm } from "@/components/decision-form";
import { BenchmarkPanel } from "@/components/benchmark-panel";


function pct(v: number | null | undefined) {
  return v == null ? "—" : `${(Number(v) * 100).toFixed(1)}%`;
}

export const Route = createFileRoute("/historial/$id")({
  head: () => ({
    meta: [
      { title: "Detalle de homologación — Espejo: Homologa" },
      { name: "description", content: "Resultados de una ejecución de homologación y comparación salarial." },
      { property: "og:title", content: "Detalle de homologación — Espejo: Homologa" },
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
  const analisis = data.analisis;
  const decision = data.decision;
  const preseleccion = data.preseleccion ?? [];
  const scoresDecision = (decision?.scores_utilizados ?? null) as {
    score_deterministico: number | null;
    score_semantico: number | null;
    score_final: number | null;
  } | null;
  void sueldoInterno;

  const validada = (analisis?.respuesta_validada ?? null) as {
    candidato_recomendado_id: string;
    score_semantico: number;
    confianza: number;
    similitudes: string[];
    diferencias: string[];
    explicacion_breve: string;
  } | null;

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

      {analisis && (
        <section className="rounded-lg border p-4 text-sm">
          <h2 className="mb-2 text-lg font-medium">Análisis semántico</h2>
          {analisis.estado !== "OK" || !validada ? (
            <p className="text-destructive">
              El análisis semántico no pudo ejecutarse: {analisis.error_mensaje ?? "error desconocido"}.
              Los resultados determinísticos se mantienen sin cambios.
            </p>
          ) : (
            <div className="space-y-2">
              <p>
                Candidato recomendado:{" "}
                <strong>
                  {resultados.find((r) => r.candidato_id === validada.candidato_recomendado_id)?.cargos
                    ?.nombre ?? validada.candidato_recomendado_id}
                </strong>{" "}
                · score semántico {validada.score_semantico} · confianza {validada.confianza}
              </p>
              <p className="text-muted-foreground">{validada.explicacion_breve}</p>
              <p className="text-muted-foreground">
                Similitudes: {validada.similitudes.length ? validada.similitudes.join(", ") : "ninguna"}
              </p>
              <p className="text-muted-foreground">
                Diferencias: {validada.diferencias.length ? validada.diferencias.join(", ") : "ninguna"}
              </p>
              <p className="text-xs text-muted-foreground">
                Modelo {analisis.modelo} · prompt {analisis.prompt_version}
              </p>
            </div>
          )}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Resultados</h2>
        {!resultados.length ? (
          <p className="text-sm text-muted-foreground">Sin resultados para esta homologación.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="border-b py-2">Candidato</th>
                <th className="border-b py-2">Score motor</th>
                <th className="border-b py-2">Score Gemini</th>
                <th className="border-b py-2">Score final</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.id}>
                  <td className="border-b py-2">
                    {r.cargos?.nombre ?? "—"}
                    <div className="text-xs text-muted-foreground">
                      {r.cargos?.empresas?.nombre ?? ""}
                    </div>
                  </td>
                  <td className="border-b py-2">{pct(r.score_deterministico)}</td>
                  <td className="border-b py-2">
                    {r.score_semantico == null ? "Pendiente" : `${r.score_semantico}%`}
                  </td>
                  <td className="border-b py-2">
                    {r.score_final == null ? "Pendiente" : pct(r.score_final)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-lg border p-4 text-sm">
        <h2 className="mb-2 text-lg font-medium">Decisión del analista</h2>
        {decision ? (
          <div className="space-y-1">
            <p>
              Cargo homologado:{" "}
              <strong>{decision.cargos?.nombre ?? decision.candidato_id}</strong>
              {decision.cargos?.empresas?.nombre ? ` — ${decision.cargos.empresas.nombre}` : ""}
            </p>
            <p className="text-muted-foreground">
              Confirmado por {decision.usuario} · {formatFecha(decision.fecha)}
            </p>
            {decision.comentario && <p>{decision.comentario}</p>}
            <p className="text-xs text-muted-foreground">
              Scores al momento de decidir: motor {pct(scoresDecision?.score_deterministico)} · IA{" "}
              {scoresDecision?.score_semantico == null
                ? "—"
                : `${scoresDecision.score_semantico}%`}{" "}
              · final {pct(scoresDecision?.score_final)}
            </p>
            {preseleccion.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 font-medium">Candidatos preseleccionados</p>
                <ul className="space-y-1">
                  {preseleccion.map((p) => {
                    const s = (p.scores_utilizados ?? {}) as {
                      score_deterministico?: number | null;
                      score_semantico?: number | null;
                      score_final?: number | null;
                    };
                    const definitivo = p.candidato_id === decision.candidato_id;
                    return (
                      <li
                        key={p.candidato_id}
                        className={`border-b py-1 ${definitivo ? "font-semibold text-primary" : ""}`}
                      >
                        {p.cargos?.nombre ?? p.candidato_id}
                        {p.cargos?.empresas?.nombre ? ` — ${p.cargos.empresas.nombre}` : ""}
                        {definitivo ? " · Definitivo" : ""}
                        <div className="text-xs font-normal text-muted-foreground">
                          Motor {pct(s.score_deterministico)} · Gemini{" "}
                          {s.score_semantico == null ? "—" : `${s.score_semantico}%`} · Final{" "}
                          {pct(s.score_final)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <DecisionForm
            ejecucionId={id}
            candidatos={resultados.map((r) => ({
              id: r.candidato_id,
              nombre: r.cargos?.nombre ?? r.candidato_id,
              empresa: r.cargos?.empresas?.nombre ?? null,
              score_deterministico: r.score_deterministico,
              score_semantico: r.score_semantico,
              score_final: r.score_final,
            }))}
            sugerido={validada?.candidato_recomendado_id ?? null}
          />
        )}
      </section>

      {decision && (
        <section className="rounded-lg border p-4 text-sm">
          <h2 className="mb-2 text-lg font-medium">Comparación salarial</h2>
          <BenchmarkPanel
            ejecucionId={id}
            cargoInterno={cargo?.nombre ?? ""}
            cargoReferencia={decision.cargos?.nombre ?? decision.candidato_id}
            sueldoInterno={cargo?.sueldo ?? null}
            bandas={data.bandas ?? []}
            tamanoGuardado={(decision.tamano_empresa as "P" | "M" | "G" | null) ?? null}
          />
        </section>
      )}

    </div>
  );
}
