/**
 * Escala semáforo de afinidad para los tres scores (motor, semántico, final).
 * Sólo presentación: no altera cálculos ni decide por el analista.
 * Umbrales: alta >= 80%, media >= 60%, baja < 60%.
 */
export type NivelAfinidad = "alta" | "media" | "baja" | "nd";

export function nivelAfinidad(pct0a100: number | null | undefined): NivelAfinidad {
  if (pct0a100 == null || Number.isNaN(pct0a100)) return "nd";
  if (pct0a100 >= 80) return "alta";
  if (pct0a100 >= 60) return "media";
  return "baja";
}

const ETIQUETA: Record<NivelAfinidad, string> = {
  alta: "Afinidad alta",
  media: "Afinidad media",
  baja: "Afinidad baja",
  nd: "Sin dato",
};

/**
 * @param valor porcentaje 0–100 (null = pendiente / no disponible)
 * @param texto texto ya formateado a mostrar
 */
export function ScoreChip({
  valor,
  texto,
  label,
}: {
  valor: number | null | undefined;
  texto: string;
  label?: string;
}) {
  const nivel = nivelAfinidad(valor);
  return (
    <span
      className={`score-chip score-chip-${nivel}`}
      title={`${label ? `${label}: ` : ""}${ETIQUETA[nivel]}`}
    >
      {texto}
      <em>{nivel === "nd" ? "—" : ETIQUETA[nivel].replace("Afinidad ", "")}</em>
    </span>
  );
}

/** Convierte un score 0–1 o null a porcentaje 0–100. */
export function a100(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n * 100;
}
