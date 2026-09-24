import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { getPreseleccion, guardarDecision, guardarPreseleccion } from "@/lib/homologacion.functions";
import { formatSueldo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ScoreChip, a100 } from "@/components/score-chip";

export type CandidatoDecision = {
  id: string;
  nombre: string;
  empresa?: string | null;
  score_deterministico?: number | string | null;
  score_semantico?: number | string | null;
  score_final?: number | string | null;
};

type Tamano = "P" | "M" | "G";
const TAMANOS: { valor: Tamano; etiqueta: string }[] = [
  { valor: "P", etiqueta: "Pequeña" },
  { valor: "M", etiqueta: "Mediana" },
  { valor: "G", etiqueta: "Grande" },
];
const ND = "No disponible";

function pct(v: number | string | null | undefined) {
  return v == null || v === "" ? "Pendiente" : `${(Number(v) * 100).toFixed(1)}%`;
}
function semantico(v: number | string | null | undefined) {
  return v == null || v === "" ? "Pendiente" : `${Number(v)}%`;
}
function sem100(v: number | string | null | undefined) {
  return v == null || v === "" ? null : Number(v);
}
function monto(v: number | string | null | undefined) {
  return v == null || v === "" ? ND : formatSueldo(v);
}

function Scores({ c }: { c: CandidatoDecision }) {
  return (
    <>
      <span data-label="Score motor">
        <ScoreChip
          valor={a100(c.score_deterministico)}
          texto={pct(c.score_deterministico)}
          label="Score motor"
        />
      </span>
      <span data-label="Score semántico">
        <ScoreChip
          valor={sem100(c.score_semantico)}
          texto={semantico(c.score_semantico)}
          label="Score semántico"
        />
      </span>
      <span data-label="Score final">
        <ScoreChip valor={a100(c.score_final)} texto={pct(c.score_final)} label="Score final" />
      </span>
    </>
  );
}


/**
 * Decisión del analista en dos etapas:
 * 1. Preselección de N candidatos (persistida).
 * 2. Comparación de los preseleccionados y selección de un único definitivo.
 * Ninguna etapa modifica scores; la sugerencia de la IA es sólo referencia visual.
 */
export function DecisionForm({
  ejecucionId,
  candidatos,
  sugerido,
  onSaved,
}: {
  ejecucionId: string;
  candidatos: CandidatoDecision[];
  sugerido?: string | null;
  onSaved?: () => void;
}) {
  const getPre = useServerFn(getPreseleccion);
  const guardarPre = useServerFn(guardarPreseleccion);
  const guardar = useServerFn(guardarDecision);
  const qc = useQueryClient();

  const pre = useQuery({
    queryKey: ["preseleccion", ejecucionId],
    queryFn: () => getPre({ data: { ejecucion_id: ejecucionId } }),
  });
  const preseleccion = pre.data ?? [];

  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [candidatoId, setCandidatoId] = useState("");
  const [tamano, setTamano] = useState<Tamano | "">("");
  const [usuario, setUsuario] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  // Si ya existe una preselección guardada, se retoma en la etapa de comparación.
  useEffect(() => {
    if (!pre.data) return;
    if (pre.data.length) {
      setMarcados(new Set(pre.data.map((p) => p.id)));
      setEtapa(2);
    }
  }, [pre.data]);

  const preMut = useMutation({
    mutationFn: () =>
      guardarPre({ data: { ejecucion_id: ejecucionId, candidato_ids: Array.from(marcados) } }),
    onMutate: () => setError(null),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["preseleccion", ejecucionId] });
      qc.invalidateQueries({ queryKey: ["ejecucion", ejecucionId] });
      setCandidatoId("");
      setEtapa(2);
    },
    onError: (e: Error) => setError(e.message),
  });

  const mut = useMutation({
    mutationFn: () =>
      guardar({
        data: {
          ejecucion_id: ejecucionId,
          candidato_id: candidatoId,
          usuario,
          comentario,
          tamano_empresa: tamano || null,
        },
      }),
    onMutate: () => setError(null),
    onSuccess: () => {
      setListo(true);
      qc.invalidateQueries({ queryKey: ["ejecucion", ejecucionId] });
      onSaved?.();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!candidatos.length)
    return (
      <p className="text-sm text-muted-foreground">
        No hay candidatos para confirmar en esta homologación.
      </p>
    );

  if (pre.isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  if (listo)
    return (
      <p className="text-sm text-muted-foreground">
        Decisión registrada. Ya puedes ver la comparación salarial.
      </p>
    );

  if (etapa === 1)
    return (
      <form
        className="space-y-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          preMut.mutate();
        }}
      >
        <p className="font-medium">1. Preselecciona los candidatos que quieres comparar</p>
        <div className="score-table">
          <div className="score-row score-head">
            <span>Candidato</span>
            <span>Score motor</span>
            <span>Score semántico</span>
            <span>Score final</span>
          </div>
          {candidatos.map((c) => (
            <label key={c.id} className="score-row cursor-pointer">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={marcados.has(c.id)}
                  onChange={(e) => {
                    const next = new Set(marcados);
                    if (e.target.checked) next.add(c.id);
                    else next.delete(c.id);
                    setMarcados(next);
                  }}
                />
                <span className="grid">
                  <strong>{c.nombre}</strong>
                  <small>
                    {c.empresa ?? "sin empresa"}
                    {c.id === sugerido ? " · Sugerido por la IA" : ""}
                  </small>
                </span>
              </div>
              <Scores c={c} />
            </label>
          ))}
        </div>
        <Button type="submit" disabled={preMut.isPending || marcados.size === 0}>
          {preMut.isPending ? "Guardando…" : `Guardar preselección (${marcados.size})`}
        </Button>
        {error && <p className="text-destructive">{error}</p>}
      </form>
    );

  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <p className="font-medium">2. Compara los preseleccionados y elige el cargo definitivo</p>

      <label className="block">
        <span>Tamaño de empresa para el benchmark</span>
        <select
          className="mt-1 w-full rounded-md border bg-background p-2 sm:max-w-xs"
          value={tamano}
          onChange={(e) => setTamano(e.target.value as Tamano | "")}
        >
          <option value="">Selecciona…</option>
          {TAMANOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-3">
        {preseleccion.map((c) => {
          const banda = tamano ? c.bandas.find((b) => b.tipo_empresa === tamano) : undefined;
          const elegido = candidatoId === c.id;
          const mejor = mejorId === c.id;
          return (
            <label
              key={c.id}
              className={`block cursor-pointer rounded-lg border p-3 ${elegido ? "border-primary" : ""}`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="radio"
                  name="candidato-definitivo"
                  className="mt-1"
                  checked={elegido}
                  onChange={() => setCandidatoId(c.id)}
                  required
                />
                <div className="grid gap-1">
                  <strong>{c.nombre}</strong>
                  <small className="text-muted-foreground">
                    {c.empresa ?? "sin empresa"}
                    {c.id === sugerido ? " · Sugerido por la IA" : ""}
                  </small>
                  {mejor && <span className="mejor-afinidad">Mayor afinidad metodológica</span>}
                  <div className="score-chips">
                    <ScoreChip
                      valor={a100(c.score_deterministico)}
                      texto={`Motor ${pct(c.score_deterministico)}`}
                      label="Score motor"
                    />
                    <ScoreChip
                      valor={sem100(c.score_semantico)}
                      texto={`Semántico ${semantico(c.score_semantico)}`}
                      label="Score semántico"
                    />
                    <ScoreChip
                      valor={a100(c.score_final)}
                      texto={`Final ${pct(c.score_final)}`}
                      label="Score final"
                    />
                  </div>
                </div>
              </div>

              {!tamano ? (
                <p className="mt-2 text-muted-foreground">
                  Selecciona un tamaño de empresa para ver sus datos de mercado.
                </p>
              ) : (
                <dl className="benchmark-grid mt-2">
                  <div><dt>Tamaño</dt><dd>{TAMANOS.find((t) => t.valor === tamano)?.etiqueta}</dd></div>
                  <div><dt>P25</dt><dd>{monto(banda?.p25)}</dd></div>
                  <div><dt>P50</dt><dd>{monto(banda?.p50)}</dd></div>
                  <div><dt>P75</dt><dd>{monto(banda?.p75)}</dd></div>
                  <div><dt>Promedio</dt><dd>{monto(banda?.promedio)}</dd></div>
                  <div><dt>Fuente</dt><dd>{banda?.fuente?.trim() ? banda.fuente : ND}</dd></div>
                  <div><dt>Año</dt><dd>{banda?.anio ?? ND}</dd></div>
                </dl>
              )}
            </label>
          );
        })}
      </div>

      <label className="block">
        <span>Analista que confirma</span>
        <input
          className="mt-1 w-full rounded-md border bg-background p-2"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Nombre y apellido"
          required
        />
      </label>

      <label className="block">
        <span>Comentario (opcional)</span>
        <textarea
          className="mt-1 w-full rounded-md border bg-background p-2"
          rows={3}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Fundamento de la decisión"
        />
      </label>

      <p className="text-xs text-muted-foreground">
        Los datos de mercado son sólo referenciales: no participan en ningún puntaje.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={mut.isPending} onClick={() => setEtapa(1)}>
          Volver a la preselección
        </Button>

        <Button type="submit" disabled={mut.isPending || !candidatoId}>
          {mut.isPending ? "Guardando…" : "Confirmar homologación"}
        </Button>
      </div>
      {error && <p className="text-destructive">{error}</p>}
    </form>
  );
}
