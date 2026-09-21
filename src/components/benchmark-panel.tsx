import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { setTamanoBenchmark } from "@/lib/homologacion.functions";
import { formatSueldo } from "@/lib/format";

export type BandaBenchmark = {
  tipo_empresa: "P" | "M" | "G" | string;
  p25: number | string | null;
  p50: number | string | null;
  p75: number | string | null;
  promedio: number | string | null;
  fuente?: string | null;
  anio?: number | null;
};

export const TAMANOS: { valor: "P" | "M" | "G"; etiqueta: string }[] = [
  { valor: "P", etiqueta: "Pequeña" },
  { valor: "M", etiqueta: "Mediana" },
  { valor: "G", etiqueta: "Grande" },
];

const ND = "No disponible";

function valor(v: number | string | null | undefined) {
  return v == null || v === "" ? ND : formatSueldo(v);
}

function num(v: number | string | null | undefined) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Benchmark salarial posterior a la decisión del analista.
 * Muestra un único tamaño de empresa; nunca estima ni interpola valores.
 */
export function BenchmarkPanel({
  ejecucionId,
  cargoInterno,
  cargoReferencia,
  sueldoInterno,
  bandas,
  tamanoGuardado,
}: {
  ejecucionId: string;
  cargoInterno: string;
  cargoReferencia: string;
  sueldoInterno: number | string | null | undefined;
  bandas: BandaBenchmark[];
  tamanoGuardado?: "P" | "M" | "G" | null;
}) {
  const guardar = useServerFn(setTamanoBenchmark);
  const qc = useQueryClient();
  const [tamano, setTamano] = useState<"P" | "M" | "G" | "">(tamanoGuardado ?? "");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: (t: "P" | "M" | "G") => guardar({ data: { ejecucion_id: ejecucionId, tamano_empresa: t } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ejecucion", ejecucionId] }),
    onError: (e: Error) => setError(e.message),
  });

  const banda = tamano ? bandas.find((b) => b.tipo_empresa === tamano) : undefined;
  const actual = num(sueldoInterno);

  const filas: { etiqueta: string; v: number | string | null | undefined }[] = [
    { etiqueta: "P25", v: banda?.p25 ?? null },
    { etiqueta: "P50 (mediana)", v: banda?.p50 ?? null },
    { etiqueta: "P75", v: banda?.p75 ?? null },
    { etiqueta: "Promedio", v: banda?.promedio ?? null },
  ];

  return (
    <div className="space-y-3 text-sm">
      <dl className="benchmark-grid">
        <div><dt>Cargo interno</dt><dd>{cargoInterno || ND}</dd></div>
        <div><dt>Cargo de referencia confirmado</dt><dd>{cargoReferencia || ND}</dd></div>
        <div>
          <dt>Fuente</dt>
          <dd>{banda?.fuente?.trim() ? banda.fuente : ND}</dd>
        </div>
        <div><dt>Año</dt><dd>{banda?.anio ?? ND}</dd></div>
        <div><dt>Remuneración actual</dt><dd>{valor(sueldoInterno)}</dd></div>
      </dl>

      <label className="block">
        <span className="text-muted-foreground">Tamaño de empresa para el benchmark</span>
        <select
          className="mt-1 w-full rounded-md border bg-background p-2 sm:max-w-xs"
          value={tamano}
          onChange={(e) => {
            const t = e.target.value as "P" | "M" | "G" | "";
            setTamano(t);
            setError(null);
            if (t) mut.mutate(t);
          }}
        >
          <option value="">Selecciona…</option>
          {TAMANOS.map((t) => (
            <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
          ))}
        </select>
      </label>
      {error && <p className="text-destructive">{error}</p>}

      {!tamano ? (
        <p className="text-muted-foreground">
          Selecciona un tamaño de empresa para ver el benchmark correspondiente.
        </p>
      ) : !banda ? (
        <p className="text-muted-foreground">
          No hay datos de mercado para el tamaño {TAMANOS.find((t) => t.valor === tamano)?.etiqueta}:{" "}
          {ND}.
        </p>
      ) : (
        <table className="benchmark-table w-full">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="border-b py-2">Mercado ({TAMANOS.find((t) => t.valor === tamano)?.etiqueta})</th>
              <th className="border-b py-2">Valor</th>
              <th className="border-b py-2">Diferencia con la remuneración actual</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const v = num(f.v);
              const dif = actual != null && v != null ? actual - v : null;
              return (
                <tr key={f.etiqueta}>
                  <td className="border-b py-2" data-label="Mercado">{f.etiqueta}</td>
                  <td className="border-b py-2" data-label="Valor">{valor(f.v)}</td>
                  <td className="border-b py-2" data-label="Diferencia">
                    {dif == null ? ND : `${dif > 0 ? "+" : ""}${formatSueldo(dif)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="text-xs text-muted-foreground">
        Información referencial. La remuneración no participa en ningún puntaje ni en la selección
        de candidatos.
      </p>
    </div>
  );
}
