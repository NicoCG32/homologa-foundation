import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { getPreseleccion, guardarDecision, guardarPreseleccion } from "@/lib/homologacion.functions";
import { formatSueldo } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ScoreChip, a100 } from "@/components/score-chip";
import { VistaEspejo, type CargoEspejo } from "@/components/vista-espejo";

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
function num(v: number | string | null | undefined) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Diferencia Empresa − Encuesta; nunca estima si falta un dato. */
export function Brecha({
  empresa,
  encuesta,
}: {
  empresa: number | string | null | undefined;
  encuesta: number | string | null | undefined;
}) {
  const e = num(empresa);
  const m = num(encuesta);
  if (e == null) return <span className="brecha brecha-nd">Sin remuneración informada</span>;
  if (m == null || m === 0) return <span className="brecha brecha-nd">{ND}</span>;
  const d = e - m;
  const p = (d / m) * 100;
  const signo = d > 0 ? "+" : d < 0 ? "−" : "";
  const cls = d > 0 ? "brecha-pos" : d < 0 ? "brecha-neg" : "";
  return (
    <span className={`brecha ${cls}`}>
      {signo}
      {formatSueldo(Math.abs(d))} ({signo}
      {Math.abs(p).toFixed(1)}%)
    </span>
  );
}

function Scores({ c, oro }: { c: CandidatoDecision; oro?: boolean }) {
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
        <ScoreChip
          valor={a100(c.score_final)}
          texto={pct(c.score_final)}
          label="Score final"
          oro={oro}
        />
      </span>
    </>
  );
}

/** Candidato con mayor score final dentro de la lista dada (sólo referencia visual). */
function mejorDe(lista: { id: string; score_final?: number | string | null }[]) {
  return lista.reduce<{ id: string; v: number } | null>((mejor, c) => {
    const v = a100(c.score_final);
    if (v == null) return mejor;
    return !mejor || v > mejor.v ? { id: c.id, v } : mejor;
  }, null)?.id;
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
  interno,
  fichas,
  sueldoInterno,
}: {
  ejecucionId: string;
  candidatos: CandidatoDecision[];
  sugerido?: string | null;
  onSaved?: () => void;
  /** Ficha del cargo interno evaluado, para la vista espejo. */
  interno?: CargoEspejo | undefined;
  /** Fichas de los candidatos, indexadas por id de cargo. */
  fichas?: Record<string, CargoEspejo> | undefined;
  /** Remuneración real del cargo interno: sólo referencia visual. */
  sueldoInterno?: number | string | null | undefined;
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
  // Referencia visual: el candidato con mayor score final entre los preseleccionados.
  // Si el mejor global no se preselecciona, la recomendación pasa al mejor de los elegidos.
  const mejorId = mejorDe(preseleccion);


  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [candidatoId, setCandidatoId] = useState("");
  // Ficha mostrada en la vista espejo: el definitivo marcado o, si no hay, el primer preseleccionado.
  const idEspejo = candidatoId || preseleccion[0]?.id || "";
  const fichaSel = idEspejo ? fichas?.[idEspejo] : undefined;

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

  if (etapa === 1) {
    // La recomendación se recalcula sobre lo que el analista marca; si no hay marcas, sobre todos.
    const marcadosArr = candidatos.filter((c) => marcados.has(c.id));
    const mejorEtapa1 = mejorDe(marcadosArr.length ? marcadosArr : candidatos);
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
          {candidatos.map((c) => {
            const mejor = mejorEtapa1 === c.id;
            return (
              <label
                key={c.id}
                className={`score-row cursor-pointer${mejor ? " fila-recomendada" : ""}`}
              >
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
                      {mejor ? " · Opción recomendada" : ""}
                      {c.id === sugerido ? " · Sugerido por la IA" : ""}
                    </small>
                  </span>
                </div>
                <Scores c={c} oro={mejor} />
              </label>
            );
          })}
        </div>
        <Button type="submit" disabled={preMut.isPending || marcados.size === 0}>
          {preMut.isPending ? "Guardando…" : `Guardar preselección (${marcados.size})`}
        </Button>
        {error && <p className="text-destructive">{error}</p>}
      </form>
    );
  }

  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <p className="font-medium">2. Compara los preseleccionados y elige el cargo definitivo</p>

      <div className="remuneracion-real" role="note">
        <span>Remuneración real de la empresa</span>
        <strong>{num(sueldoInterno) == null ? "No informada" : formatSueldo(sueldoInterno)}</strong>
        <small>Referencia para tu decisión: no participa en ningún puntaje.</small>
      </div>

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
              className={`block cursor-pointer rounded-lg border p-3 ${elegido ? "border-primary" : ""}${mejor ? " tarjeta-recomendada" : ""}`}
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
                  {mejor && (
                    <span
                      className="mejor-afinidad"
                      title="Mayor score final entre los candidatos que preseleccionaste"
                    >
                      ★ Opción recomendada
                    </span>
                  )}
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
                      oro={mejor}
                    />
                  </div>
                </div>
              </div>

              {!tamano ? null : (
                <dl className="benchmark-grid mt-2">
                  <div><dt>Tamaño</dt><dd>{TAMANOS.find((t) => t.valor === tamano)?.etiqueta}</dd></div>
                  <div><dt>P25</dt><dd>{monto(banda?.p25)}</dd></div>
                  <div><dt>P50</dt><dd>{monto(banda?.p50)}</dd></div>
                  <div><dt>P75</dt><dd>{monto(banda?.p75)}</dd></div>
                  <div><dt>Promedio</dt><dd>{monto(banda?.promedio)}</dd></div>
                  <div>
                    <dt>Empresa vs P50</dt>
                    <dd><Brecha empresa={sueldoInterno} encuesta={banda?.p50} /></dd>
                  </div>
                  <div><dt>Fuente</dt><dd>{banda?.fuente?.trim() ? banda.fuente : ND}</dd></div>
                  <div><dt>Año</dt><dd>{banda?.anio ?? ND}</dd></div>
                </dl>
              )}
            </label>
          );
        })}
      </div>

      {interno && fichaSel && (
        <section className="espejo-block">
          <h3>Vista espejo: cargo interno frente al candidato</h3>
          <p className="text-muted-foreground">
            {candidatoId
              ? "Contraste del contenido del cargo que elegiste como definitivo."
              : "Se muestra el primer preseleccionado; marca otro para compararlo."}
          </p>
          <VistaEspejo
            interno={interno}
            candidato={fichaSel}
            remuneracionA={num(sueldoInterno) == null ? "No informada" : formatSueldo(sueldoInterno)}
            remuneracionB={(() => {
              if (!tamano) return "Selecciona un tamaño de empresa";
              const b = preseleccion
                .find((p) => p.id === idEspejo)
                ?.bandas.find((x) => x.tipo_empresa === tamano);
              if (num(b?.p50) != null) {
                const rango =
                  num(b?.p25) != null && num(b?.p75) != null
                    ? ` (rango ${formatSueldo(b!.p25)} – ${formatSueldo(b!.p75)})`
                    : "";
                return `P50 ${formatSueldo(b!.p50)}${rango}`;
              }
              return ND;
            })()}
          />
        </section>
      )}


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
