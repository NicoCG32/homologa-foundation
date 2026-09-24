import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { listCargos } from "@/lib/cargos.functions";
import { listCriterios } from "@/lib/criterios.functions";
import { PesosEditor, pesosIniciales } from "@/components/pesos-editor";
import { analizarSemantica, ejecutarHomologacion, listHomologados } from "@/lib/homologacion.functions";
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
import { DecisionForm } from "@/components/decision-form";

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
  const [busqueda, setBusqueda] = useState("");
  const [espejoId, setEspejoId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [semError, setSemError] = useState<string | null>(null);
  const [pesos, setPesos] = useState<Record<string, number>>({});
  const [paso, setPaso] = useState(1);

  const listH = useServerFn(listHomologados);
  const homologados = useQuery({ queryKey: ["homologados"], queryFn: () => listH() });
  const hechos = new Set((homologados.data ?? []).map((h) => h.cargo_id));

  const internos = (cargos.data ?? []).filter((c) => c.tipo === "INTERNO");
  const q = busqueda.trim().toLowerCase();
  const internosFiltrados = !q
    ? internos
    : internos.filter((c) =>
        [c.codigo_cargo, c.nombre, c.empresas?.nombre, c.nombre_area, c.nombre_subarea]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
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
    onError: () =>
      setSemError(
        "El análisis IA no pudo completarse. Los resultados determinísticos se conservan intactos; intenta nuevamente.",
      ),
  });
  const [semLento, setSemLento] = useState(false);
  useEffect(() => {
    if (!sem.isPending) {
      setSemLento(false);
      return;
    }
    const t = setTimeout(() => setSemLento(true), 3000);
    return () => clearTimeout(t);
  }, [sem.isPending]);

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

      {res && paso > 1 && (
        <aside className="cargo-context" aria-label="Cargo en evaluación">
          <div>
            <span>Cargo en evaluación</span>
            <strong>
              {res.cargo.codigo_cargo ? `${res.cargo.codigo_cargo} · ` : ""}
              {res.cargo.nombre}
            </strong>
            <small>
              {res.cargo.empresa_nombre ?? "Sin empresa"}
              {res.cargo.nombre_area ? ` · ${res.cargo.nombre_area}` : ""}
              {res.cargo.nivel_jerarquico ? ` · Nivel ${res.cargo.nivel_jerarquico}` : ""}
            </small>
          </div>
          {res.cargo.descripcion && <p>{res.cargo.descripcion}</p>}
        </aside>
      )}


      {paso === 1 && (
        <form
          className="selection-panel"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <div className="cargo-picker">
            <label className="block text-sm" htmlFor="buscar-cargo">
              <span>Cargo interno</span>
            </label>
            <div className="select-with-icon">
              <Search aria-hidden="true" />
              <input
                id="buscar-cargo"
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Busca por código, nombre, empresa o área…"
              />
            </div>
            {!internosFiltrados.length ? (
              <p className="text-sm text-muted-foreground">No hay cargos internos que coincidan.</p>
            ) : (
              <div className="cargo-picker-list" role="listbox" aria-label="Cargos internos">
                {internosFiltrados.slice(0, 30).map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    className="cargo-option"
                    aria-pressed={cargoId === c.id}
                    onClick={() => setCargoId(c.id)}
                  >
                    <span>
                      <strong>
                        {c.codigo_cargo ? `${c.codigo_cargo} · ` : ""}
                        {c.nombre}
                      </strong>
                      <small>
                        {c.empresas?.nombre ?? "Sin empresa"}
                        {c.nombre_area ? ` · ${c.nombre_area}` : ""}
                      </small>
                    </span>
                    <span className={`estado-chip ${hechos.has(c.id) ? "ok" : "pend"}`}>
                      {hechos.has(c.id) ? "Homologado" : "Pendiente"}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {internosFiltrados.length > 30 && (
              <p className="text-xs text-muted-foreground">
                Se muestran los primeros 30 resultados; afina la búsqueda para ver otros.
              </p>
            )}
          </div>


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

          <Button type="submit" disabled={mut.isPending || !cargoId || faltantes.length > 0} size="lg">
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
              <div className="score-table"><div className="score-row score-head"><span>Candidato</span><span>Score motor</span><span>Score semántico</span><span>Score final</span></div>
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

          {res.preseleccionados.length > 0 && (
            <section className="rounded-lg border p-4">
              <h2 className="mb-2 font-medium"><Columns2 /> Vista espejo: cargo interno frente al candidato</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Elige un candidato para comparar su contenido con el cargo que estás evaluando.
              </p>
              <div className="filter-chips" role="group" aria-label="Candidatos a comparar">
                {res.preseleccionados.map((p, i) => (
                  <button
                    type="button"
                    key={p.cargo.id}
                    aria-pressed={(espejoId || res.preseleccionados[0]!.cargo.id) === p.cargo.id}
                    onClick={() => setEspejoId(p.cargo.id)}
                  >
                    {i + 1}. {p.cargo.codigo_cargo || p.cargo.nombre}
                  </button>
                ))}
              </div>
              {(() => {
                const sel =
                  res.preseleccionados.find((p) => p.cargo.id === espejoId) ??
                  res.preseleccionados[0]!;
                return <VistaEspejo interno={res.cargo} candidato={sel.cargo} />;
              })()}
            </section>
          )}


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
          {sem.isPending && (
            <p className="mt-2 text-sm text-muted-foreground" role="status" aria-live="polite">
              {semLento
                ? "Consultando motor de respaldo para asegurar la respuesta…"
                : "Analizando compatibilidad de candidatos…"}
            </p>
          )}
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
          <div className="mt-4 border-t pt-4">
            <DecisionForm
              ejecucionId={res.ejecucion_id}
              candidatos={res.preseleccionados.map((p) => ({
                id: p.cargo.id,
                nombre: p.cargo.nombre,
                empresa: p.cargo.empresa_nombre,
                score_deterministico: p.score,
                score_semantico:
                  semOk?.analisis.scores_por_candidato.find((s) => s.candidato_id === p.cargo.id)
                    ?.score_semantico ?? null,
                score_final:
                  semOk?.finales.find((f) => f.candidato_id === p.cargo.id)?.score_final ?? null,
              }))}
              sugerido={semOk?.analisis.candidato_recomendado_id ?? null}
            />
          </div>
          <p className="mt-3 text-sm">
            <Link className="underline" to="/historial/$id" params={{ id: res.ejecucion_id }}>
              Ver la homologación en el historial y la comparación salarial
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
