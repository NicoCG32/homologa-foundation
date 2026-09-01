import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { listCargos } from "@/lib/cargos.functions";
import { CAMPOS_CRITERIO, listCriterios } from "@/lib/criterios.functions";
import { ejecutarHomologacion } from "@/lib/homologacion.functions";
import { formatSueldo } from "@/lib/format";

export const Route = createFileRoute("/homologacion/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva homologación — HOMOLOGA" },
      { name: "description", content: "Ejecuta el motor determinístico para un cargo interno." },
      { property: "og:title", content: "Nueva homologación — HOMOLOGA" },
      {
        property: "og:description",
        content: "Compara un cargo interno con cargos de referencia según los criterios definidos.",
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

  const cargos = useQuery({ queryKey: ["cargos"], queryFn: () => listC() });
  const criterios = useQuery({ queryKey: ["criterios"], queryFn: () => listCr() });

  const [cargoId, setCargoId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const internos = (cargos.data ?? []).filter((c) => c.tipo === "INTERNO");
  const activos = (criterios.data ?? []).filter((c) => c.activo);

  const mut = useMutation({
    mutationFn: () => ejecutar({ data: { cargo_id: cargoId } }),
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


  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Nueva homologación</h1>
      <p className="text-sm text-muted-foreground">
        El motor determinístico compara el cargo interno con los cargos de referencia aplicando los
        criterios y pesos almacenados. No usa IA ni completa datos faltantes.
      </p>

      <form
        className="space-y-4 rounded-lg border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Cargo interno</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={cargoId}
            onChange={(e) => setCargoId(e.target.value)}
            required
          >
            <option value="">Selecciona…</option>
            {internos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.empresas?.nombre ?? "sin empresa"}
              </option>
            ))}
          </select>
        </label>

        <div className="text-sm">
          <span className="text-muted-foreground">Criterios activos: </span>
          {criterios.isLoading
            ? "…"
            : activos.length
              ? activos
                  .map(
                    (c) =>
                      `${c.nombre} · ${CAMPOS_CRITERIO[c.campo]} · peso ${c.peso}${c.obligatorio ? " · obligatorio" : ""}`,
                  )
                  .join(" | ")
              : "ninguno definido"}
        </div>

        <button
          type="submit"
          disabled={mut.isPending || !internos.length}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {mut.isPending ? "Calculando…" : "Ejecutar motor determinístico"}
        </button>
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
            <h2 className="mb-2 font-medium">1. Cargo analizado</h2>
            <p className="text-sm">
              <strong>{res.cargo.nombre}</strong> — {res.cargo.empresa_nombre ?? "sin empresa"} ·
              sueldo {formatSueldo(res.cargo.sueldo)}
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
            <h2 className="mb-2 font-medium">2. Candidatos encontrados</h2>
            <p className="text-sm">
              {res.evaluados} cargos de referencia evaluados
              {res.pesoTotal <= 0 && " — no hay criterios activos con peso, no se calculó score"}
            </p>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">3. Candidatos descartados</h2>
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
            <h2 className="mb-2 font-medium">4. Candidatos preseleccionados</h2>
            {!res.preseleccionados.length ? (
              <p className="text-sm text-muted-foreground">Ninguno.</p>
            ) : (
              <ol className="space-y-3 text-sm">
                {res.preseleccionados.map((p, i) => (
                  <li key={p.cargo.id} className="border-b pb-3">
                    <p>
                      <strong>
                        {i + 1}. {p.cargo.nombre}
                      </strong>{" "}
                      — {p.cargo.empresa_nombre ?? "sin empresa"} · sueldo{" "}
                      {formatSueldo(p.cargo.sueldo)} · score {pct(p.score)}
                    </p>
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
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="mb-2 font-medium">5. Análisis semántico (Gemini)</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Se envían únicamente los {res.preseleccionados.length} candidatos preseleccionados, sin
              información salarial. No altera el ranking determinístico.
            </p>
            <button
              type="button"
              disabled={sem.isPending || !res.preseleccionados.length}
              onClick={() => sem.mutate(res.ejecucion_id)}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
            >
              {sem.isPending ? "Analizando…" : "Analizar semánticamente con Gemini"}
            </button>
            {semError && <p className="mt-2 text-sm text-destructive">{semError}</p>}
            {sem.data?.ok && (
              <div className="mt-4 space-y-3 text-sm">
                <p>
                  Candidato recomendado:{" "}
                  <strong>
                    {res.preseleccionados.find(
                      (p) => p.cargo.id === sem.data.analisis.candidato_recomendado_id,
                    )?.cargo.nombre ?? sem.data.analisis.candidato_recomendado_id}
                  </strong>{" "}
                  · score semántico {sem.data.analisis.score_semantico} · confianza{" "}
                  {sem.data.analisis.confianza}
                </p>
                <p className="text-muted-foreground">{sem.data.analisis.explicacion_breve}</p>
                <ul className="space-y-2">
                  {sem.data.analisis.scores_por_candidato.map((s) => (
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
