import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { listCargos } from "@/lib/cargos.functions";
import { CAMPOS_CRITERIO, listCriterios } from "@/lib/criterios.functions";
import { analizarSemantica, ejecutarHomologacion } from "@/lib/homologacion.functions";
import { ArrowRight, Bot, CheckCircle2, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/homologacion/nueva")({
  head: () => ({
    meta: [
      { title: "Seleccionar cargo — Espejo: Homologa" },
      { name: "description", content: "Selecciona un cargo interno y encuentra sus equivalentes." },
      { property: "og:title", content: "Seleccionar cargo — Espejo: Homologa" },
      {
        property: "og:description",
        content: "Encuentra cargos equivalentes mediante una revisión clara y asistida.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NuevaHomologacion,
});

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function NuevaHomologacion() {
  const listC = useServerFn(listCargos);
  const listCr = useServerFn(listCriterios);
  const ejecutar = useServerFn(ejecutarHomologacion);
  const analizar = useServerFn(analizarSemantica);

  const cargos = useQuery({ queryKey: ["cargos"], queryFn: () => listC() });
  const criterios = useQuery({ queryKey: ["criterios"], queryFn: () => listCr() });

  const [cargoId, setCargoId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [semError, setSemError] = useState<string | null>(null);
  const [pesos, setPesos] = useState<Record<string, number>>({});

  const internos = (cargos.data ?? []).filter((c) => c.tipo === "INTERNO");
  const activos = (criterios.data ?? []).filter((c) => c.activo);
  useEffect(() => {
    if (!activos.length) return;
    setPesos((prev) => Object.keys(prev).length ? prev : Object.fromEntries(activos.map((c) => [c.id, Number(c.peso)])));
  }, [criterios.data]);

  const mut = useMutation({
    mutationFn: () => ejecutar({ data: { cargo_id: cargoId, pesos: activos.map((c) => ({ id: c.id, peso: Number(pesos[c.id] ?? c.peso) })) } }),
    onMutate: () => {
      setError(null);
      setSemError(null);
      sem.reset();
    },
    onError: (e: Error) => setError(e.message),
  });

  const sem = useMutation({
    mutationFn: (ejecucionId: string) => analizar({ data: { ejecucion_id: ejecucionId } }),
    onMutate: () => setSemError(null),
    onSuccess: (r) => {
      if (!r.ok) setSemError(r.error);
    },
    onError: (e: Error) => setSemError(e.message),
  });

  const res = mut.data;
  const semOk = sem.data && sem.data.ok ? sem.data : null;


  return (
    <div className="process-page">
      <div className="page-heading">
        <p className="eyebrow">Nueva homologación</p>
        <h1>¿Qué cargo quieres homologar?</h1>
        <p>Selecciona un cargo interno. Revisaremos su información antes de buscar equivalencias.</p>
      </div>

      <form
        className="selection-panel"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <label className="block text-sm">
          <span>Cargo interno</span>
          <div className="select-with-icon"><Search aria-hidden="true" /><select
            value={cargoId}
            onChange={(e) => setCargoId(e.target.value)}
            required
          >
            <option value="">Selecciona…</option>
            {internos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo_cargo ? `${c.codigo_cargo} · ` : ""}{c.nombre} — Interno · {c.empresas?.nombre ?? "sin empresa"}
              </option>
            ))}
          </select></div>
        </label>

        <details className="criteria-summary" open><summary>Ajustar pesos de esta homologación</summary><div>
          {criterios.isLoading
            ? "…"
            : activos.length
              ? <div className="weights-table">{activos.map((c) => <label key={c.id}><span><strong>{c.nombre}</strong><small>{CAMPOS_CRITERIO[c.campo]}{c.obligatorio ? " · obligatorio" : ""}</small></span><input aria-label={`Peso de ${c.nombre}`} type="number" min="0" step="0.1" value={pesos[c.id] ?? Number(c.peso)} onChange={(e) => setPesos((p) => ({ ...p, [c.id]: Number(e.target.value) }))} /></label>)}</div>
              : "ninguna definida"}
        </div></details>

        <Button
          type="submit"
          disabled={mut.isPending || !internos.length}
          size="lg"
        >
          {mut.isPending ? "Buscando equivalencias…" : <>Encontrar candidatos <ArrowRight /></>}
        </Button>
        {!cargos.isLoading && !internos.length && (
          <p className="text-sm text-muted-foreground">
            Necesitas al menos un cargo de tipo interno.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      {res && (
        <div className="space-y-6">
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium"><ShieldCheck /> Cargo revisado</h2>
            <p className="text-sm">
              <strong>{res.cargo.nombre}</strong> — {res.cargo.empresa_nombre ?? "sin empresa"}
              {res.cargo.nombre_area ? ` · área ${res.cargo.nombre_area}` : ""}
              {res.cargo.nivel_jerarquico ? ` · nivel ${res.cargo.nivel_jerarquico}` : ""}
            </p>
            {res.cargo.descripcion && (
              <p className="mt-1 text-sm text-muted-foreground">{res.cargo.descripcion}</p>
            )}
            <p className="mt-2 text-sm">
              <Link className="underline" to="/historial/$id" params={{ id: res.ejecucion_id }}>
                Ver ejecución en el historial
              </Link>
            </p>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium"><Users /> Candidatos encontrados</h2>
            <p className="text-sm">
              {res.evaluados} cargos de referencia revisados
              {res.pesoTotal <= 0 && " — no hay criterios activos para comparar"}
            </p>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">Candidatos no compatibles</h2>
            {!res.descartados.length ? (
              <p className="text-sm text-muted-foreground">Ninguno.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {res.descartados.map((d) => (
                  <li key={d.cargo.id} className="border-b py-1">
                    <strong>{d.cargo.nombre}</strong> ({d.cargo.empresa_nombre ?? "sin empresa"}) —{" "}
                    {d.motivo}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium"><CheckCircle2 /> Candidatos preseleccionados</h2>
            {!res.preseleccionados.length ? (
              <p className="text-sm text-muted-foreground">Ninguno.</p>
            ) : (
              <div className="score-table"><div className="score-row score-head"><span>Candidato</span><span>Score motor</span><span>Score Gemini</span><span>Score final</span></div>
                {res.preseleccionados.map((p, i) => (
                  <div key={p.cargo.id} className="score-row">
                    <div>
                      <strong>
                        {i + 1}. {p.cargo.nombre}
                      </strong><small>{p.cargo.empresa_nombre ?? "sin empresa"}</small>
                    </div><span>{pct(p.score)}</span><span>{(() => { const s = semOk?.analisis.scores_por_candidato.find((item) => item.candidato_id === p.cargo.id)?.score_semantico; return s == null ? "Pendiente" : `${s}%`; })()}</span><span>{pct(p.score)}</span>
                    <div className="score-detail">
                    <p className="text-muted-foreground">
                      Coincidencias:{" "}
                      {p.coincidencias.length
                        ? p.coincidencias.map((c) => `${c.criterio} (${c.detalle})`).join(", ")
                        : "ninguna"}
                    </p>
                    <p className="text-muted-foreground">
                      Diferencias:{" "}
                      {p.diferencias.length
                        ? p.diferencias.map((c) => `${c.criterio} (${c.detalle})`).join(", ")
                        : "ninguna"}
                    </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium"><Bot /> Análisis IA</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              La IA revisará únicamente los {res.preseleccionados.length} candidatos preseleccionados y comparará el contenido de cada cargo.
            </p>
            <Button
              type="button"
              disabled={sem.isPending || !res.preseleccionados.length}
              onClick={() => sem.mutate(res.ejecucion_id)}
              variant="outline"
            >
              {sem.isPending ? "Analizando…" : "Continuar con análisis IA"}
            </Button>
            {semError && <p className="mt-2 text-sm text-destructive">{semError}</p>}
            {semOk && (
              <div className="mt-4 space-y-3 text-sm">
                <p>
                  Candidato recomendado:{" "}
                  <strong>
                    {res.preseleccionados.find(
                      (p) => p.cargo.id === semOk.analisis.candidato_recomendado_id,
                    )?.cargo.nombre ?? semOk.analisis.candidato_recomendado_id}
                  </strong>{" "}
                  · score semántico {semOk.analisis.score_semantico} · confianza{" "}
                  {semOk.analisis.confianza}
                </p>
                <p className="text-muted-foreground">{semOk.analisis.explicacion_breve}</p>
                <ul className="space-y-2">
                  {semOk.analisis.scores_por_candidato.map((s) => (
                    <li key={s.candidato_id} className="border-b pb-2">
                      <p>
                        <strong>
                          {res.preseleccionados.find((p) => p.cargo.id === s.candidato_id)?.cargo
                            .nombre ?? s.candidato_id}
                        </strong>{" "}
                        — score semántico {s.score_semantico}
                      </p>
                      <p className="text-muted-foreground">
                        Similitudes: {s.similitudes.length ? s.similitudes.join(", ") : "ninguna"}
                      </p>
                      <p className="text-muted-foreground">
                        Diferencias: {s.diferencias.length ? s.diferencias.join(", ") : "ninguna"}
                      </p>
                      <p className="text-muted-foreground">{s.explicacion_breve}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}

    </div>
  );
}
