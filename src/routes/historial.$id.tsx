import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getEjecucion } from "@/lib/homologacion.functions";
import { formatFecha, formatSueldo } from "@/lib/format";

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
  const scoresDecision = (decision?.scores_utilizados ?? null) as {
    score_deterministico: number | null;
    score_semantico: number | null;
    score_final: number | null;
  } | null;
  const elegido = decision
    ? resultados.find((r) => r.candidato_id === decision.candidato_id)
    : undefined;
  const sueldoElegido = elegido?.cargos?.sueldo ?? null;
  const diferencia =
    sueldoInterno != null && sueldoElegido != null ? Number(sueldoElegido) - sueldoInterno : null;
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
          </div>
        ) : (
          <DecisionForm
            ejecucionId={id}
            candidatos={resultados.map((r) => ({
              id: r.candidato_id,
              nombre: r.cargos?.nombre ?? r.candidato_id,
              empresa: r.cargos?.empresas?.nombre ?? null,
            }))}
            sugerido={validada?.candidato_recomendado_id ?? null}
          />
        )}
      </section>

      {decision && (
        <section className="rounded-lg border p-4 text-sm">
          <h2 className="mb-2 text-lg font-medium">Comparación salarial</h2>
          <p>
            Sueldo del cargo interno: <strong>{formatSueldo(cargo?.sueldo)}</strong> · sueldo del
            cargo homologado: <strong>{formatSueldo(sueldoElegido)}</strong>
            {diferencia !== null && (
              <> · diferencia {diferencia > 0 ? "+" : ""}{formatSueldo(diferencia)}</>
            )}
          </p>
          {(data.bandas ?? []).length ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {(data.bandas ?? []).map((b) => (
                <li key={b.tipo_empresa}>
                  {b.tipo_empresa}: P25 {formatSueldo(b.p25)} · P50 {formatSueldo(b.p50)} · P75{" "}
                  {formatSueldo(b.p75)} · PP {formatSueldo(b.promedio)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              El cargo homologado no tiene bandas salariales cargadas.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
