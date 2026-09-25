import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

function etiquetaGrafico(v: number) {
  if (Math.abs(v) >= 1_000_000) {
    return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 }).format(v / 1_000_000)} M`;
  }
  if (Math.abs(v) >= 1_000) {
    return `${new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(v / 1_000)} mil`;
  }
  return formatSueldo(v);
}

function valorExactoGrafico(v: number) {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
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
  const filas: { etiqueta: string; corta: string; v: number | string | null | undefined }[] = [
    { etiqueta: "P25", corta: "P25", v: banda?.p25 ?? null },
    { etiqueta: "P50 (mediana)", corta: "P50", v: banda?.p50 ?? null },
    { etiqueta: "P75", corta: "P75", v: banda?.p75 ?? null },
    { etiqueta: "Promedio/PP", corta: "PP", v: banda?.promedio ?? null },
  ];

  const datosGrafico = filas.map((fila) => ({
    indicador: fila.corta,
    valor: num(fila.v),
  }));

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
          Elige el tamaño de empresa para ver la referencia de mercado del cargo confirmado.
        </p>
      ) : !banda ? (
        <div className="rounded-md border border-dashed p-3 text-muted-foreground">
          <p>
            Sin banda de mercado para empresa{" "}
            {TAMANOS.find((t) => t.valor === tamano)?.etiqueta.toLowerCase()}.
          </p>
          <p className="mt-1">
            La encuesta no reporta este cargo en ese tamaño y nunca estimamos cifras.
          </p>
        </div>
      ) : (

        <div className="benchmark-comparison">
          <div className="benchmark-chart" aria-label="Gráfico comparativo de remuneración y mercado">
            <h3>Comparación visual</h3>
            <div className="benchmark-chart-plot">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico} margin={{ top: 28, right: 8, left: 2, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="indicador" axisLine={false} tickLine={false} tick={false} height={1} />
                  <YAxis axisLine={false} tickLine={false} width={54} tickFormatter={etiquetaGrafico} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    formatter={(v) => [v == null ? ND : valorExactoGrafico(Number(v)), "Remuneración"]}
                    labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                    itemStyle={{ color: "var(--foreground)" }}
                    contentStyle={{ background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: 6 }}
                  />
                  <Bar dataKey="valor" radius={[5, 5, 0, 0]} maxBarSize={64}>
                    {datosGrafico.map((dato) => (
                      <Cell key={dato.indicador} fill="var(--chart-2)" />
                    ))}
                    <LabelList dataKey="valor" position="top" formatter={(v: number) => valorExactoGrafico(v)} className="benchmark-chart-label" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="benchmark-chart-boxes" aria-hidden="true">
              {datosGrafico.map((dato) => <span key={dato.indicador}>{dato.indicador}</span>)}
              <strong>Encuesta</strong>
            </div>
          </div>

        </div>
      )}

      {tamano && banda && (
        <div className="brecha-tabla-wrap">
          <h3 className="font-medium">Diferencias frente a la remuneración de la empresa</h3>
          <table className="benchmark-table brecha-tabla w-full">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th>Estadígrafo</th>
                <th>Valor encuesta</th>
                <th>Remuneración empresa</th>
                <th>Diferencia ($)</th>
                <th>Brecha (%)</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const e = num(sueldoInterno);
                const m = num(f.v);
                const d = e != null && m != null ? e - m : null;
                const p = d != null && m ? (d / m) * 100 : null;
                const signo = (x: number) => (x > 0 ? "+" : x < 0 ? "−" : "");
                const cls = d == null ? "brecha-nd" : d > 0 ? "brecha-pos" : d < 0 ? "brecha-neg" : "";
                return (
                  <tr key={f.etiqueta}>
                    <td data-label="Estadígrafo">{f.etiqueta}</td>
                    <td data-label="Valor encuesta">{valor(f.v)}</td>
                    <td data-label="Remuneración empresa">
                      {e == null ? "No informada" : formatSueldo(e)}
                    </td>
                    <td data-label="Diferencia ($)">
                      <span className={`brecha ${cls}`}>
                        {d == null ? ND : `${signo(d)}${formatSueldo(Math.abs(d))}`}
                      </span>
                    </td>
                    <td data-label="Brecha (%)">
                      <span className={`brecha ${cls}`}>
                        {p == null ? ND : `${signo(p)}${Math.abs(p).toFixed(1)}%`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground">
            Un valor positivo indica que la empresa paga sobre el mercado.
          </p>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Información referencial: no participa en ningún puntaje.
      </p>
    </div>
  );
}
