import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { listCargos } from "@/lib/cargos.functions";
import { listCriterios } from "@/lib/criterios.functions";
import { PesosEditor, pesosIniciales } from "@/components/pesos-editor";
import { analizarSemantica, ejecutarHomologacion } from "@/lib/homologacion.functions";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Flag,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
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

const PASOS = ["Cargo", "Revisión", "Candidatos", "Análisis IA", "Decisión"];

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
  const [paso, setPaso] = useState(1);

  const internos = (cargos.data ?? []).filter((c) => c.tipo === "INTERNO");
  const referencias = (cargos.data ?? []).filter((c) => c.tipo === "REFERENCIA");
  const activos = criterios.data ?? [];
  const totalPesos = activos.reduce((s, c) => s + Number(pesos[c.id] ?? 0), 0);

  const faltantes: { texto: string; to: "/cargos" | "/criterios"; pestana: string }[] = [];
  if (!cargos.isLoading && !internos.length)
    faltantes.push({ texto: "No hay cargos internos cargados; carga al menos uno.", to: "/cargos", pestana: "Cargos" });
  if (!cargos.isLoading && !referencias.length)
    faltantes.push({ texto: "No hay cargos de referencia para comparar; carga el catálogo de la encuesta.", to: "/cargos", pestana: "Cargos" });
  if (!criterios.isLoading && !activos.length)
    faltantes.push({ texto: "No hay criterios de comparación definidos.", to: "/criterios", pestana: "Criterios" });
  else if (!criterios.isLoading && totalPesos <= 0)
    faltantes.push({ texto: "Toda la ponderación está en 0%: asigna porcentaje a al menos un criterio o carga una configuración guardada.", to: "/criterios", pestana: "Criterios" });

  useEffect(() => {
    if (!activos.length) return;
    setPesos((prev) => (Object.keys(prev).length ? prev : pesosIniciales(activos)));
  }, [criterios.data]);

  const mut = useMutation({
    mutationFn: () => ejecutar({ data: { cargo_id: cargoId, pesos: activos.map((c) => ({ id: c.id, peso: Number(pesos[c.id] ?? 0) })) } }),
    onMutate: () => {
      setError(null);
      setSemError(null);
      sem.reset();
    },
    onSuccess: () => setPaso(2),
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
  const maxPaso = res ? PASOS.length : 1;

  return (
    <div className="process-page">
      <div className="page-heading">
        <p className="eyebrow">Nueva homologación</p>
        <h1>{paso === 1 ? "¿Qué cargo quieres homologar?" : PASOS[paso - 1]}</h1>
        <p>
          {paso === 1
            ? "Selecciona un cargo interno. Revisaremos su información antes de buscar equivalencias."
            : "Avanza paso a paso; puedes volver atrás cuando quieras."}
        </p>
      </div>

      <ol className="wizard-steps">
        {PASOS.map((p, i) => (
          <li key={p} className={i + 1 === paso ? "current" : i + 1 < paso ? "done" : ""}>
            <button
              type="button"
              disabled={i + 1 > maxPaso}
              onClick={() => setPaso(i + 1)}
            >
              <span>{i + 1}</span>
              {p}
            </button>
          </li>
        ))}
      </ol>

      {paso === 1 && (
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

          <details className="criteria-summary"><summary>Ajustar ponderación de esta homologación</summary><div>
            {criterios.isLoading
              ? "…"
              : activos.length
                ? <PesosEditor criterios={activos} pesos={pesos} onChange={setPesos} />
                : "ninguna definida"}
          </div></details>

          {faltantes.length > 0 && (
            <div className="missing-panel">
              <strong>Falta información para poder homologar</strong>
              <ul>
                {faltantes.map((f) => (
                  <li key={f.texto}>
                    {f.texto}{" "}
                    <Link to={f.to}>Ir a {f.pestana} <ArrowRight aria-hidden="true" /></Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button type="submit" disabled={mut.isPending || faltantes.length > 0} size="lg">
            {mut.isPending ? "Buscando equivalencias…" : <>Encontrar candidatos <ArrowRight /></>}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}

      {res && paso === 2 && (
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
          <p className="mt-3 text-sm">
            {res.evaluados} cargos de referencia revisados
            {res.pesoTotal <= 0 && " — no hay criterios activos para comparar"}
          </p>
        </section>
      )}

      {res && paso === 3 && (
        <div className="space-y-6">
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
                    </div><span>{pct(p.score)}</span><span>{(() => { const s = semOk?.analisis.scores_por_candidato.find((item) => item.candidato_id === p.cargo.id)?.score_semantico; return s == null ? "Pendiente" : `${s}%`; })()}</span><span>{(() => { const f = semOk?.finales.find((item) => item.candidato_id === p.cargo.id)?.score_final; return f == null ? "Pendiente" : pct(f); })()}</span>
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
            <h2 className="mb-2 font-medium"><Users /> Candidatos no compatibles</h2>
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
        </div>
      )}

      {res && paso === 4 && (
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
      )}

      {res && paso === 5 && (
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium"><Flag /> Decisión</h2>
          <p className="text-sm">
            Cargo analizado: <strong>{res.cargo.nombre}</strong> · {res.preseleccionados.length}{" "}
            candidatos preseleccionados
            {semOk
              ? ` · sugerencia de la IA: ${
                  res.preseleccionados.find(
                    (p) => p.cargo.id === semOk.analisis.candidato_recomendado_id,
                  )?.cargo.nombre ?? semOk.analisis.candidato_recomendado_id
                }`
              : " · análisis IA pendiente"}
          </p>
          <p className="mt-3 text-sm">
            <Link className="underline" to="/historial/$id" params={{ id: res.ejecucion_id }}>
              Ver ejecución en el historial y registrar la decisión
            </Link>
          </p>
        </section>
      )}

      {res && (
        <div className="wizard-nav">
          <Button
            type="button"
            variant="outline"
            disabled={paso === 1}
            onClick={() => setPaso((p) => Math.max(1, p - 1))}
          >
            <ArrowLeft /> Atrás
          </Button>
          <Button
            type="button"
            disabled={paso === PASOS.length}
            onClick={() => setPaso((p) => Math.min(PASOS.length, p + 1))}
          >
            Siguiente <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}
