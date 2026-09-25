/**
 * Pastilla sobria para los tres scores (motor, semántico, final).
 * Sólo presentación: no altera cálculos ni decide por el analista.
 * El único resalte de color es el dorado de la opción recomendada.
 */
export type NivelAfinidad = "alta" | "media" | "baja" | "nd";

export function nivelAfinidad(pct0a100: number | null | undefined): NivelAfinidad {
  if (pct0a100 == null || Number.isNaN(pct0a100)) return "nd";
  if (pct0a100 >= 80) return "alta";
  if (pct0a100 >= 60) return "media";
  return "baja";
}

/**
 * @param valor porcentaje 0–100 (null = pendiente / no disponible)
 * @param texto texto ya formateado a mostrar
 * @param oro resalta el puntaje del candidato recomendado
 */
export function ScoreChip({
  valor,
  texto,
  label,
  oro,
}: {
  valor: number | null | undefined;
  texto: string;
  label?: string;
  oro?: boolean | undefined;
}) {
  const nd = nivelAfinidad(valor) === "nd";
  return (
    <span
      className={`score-chip${nd ? " score-chip-nd" : ""}${oro ? " score-chip-oro" : ""}`}
      title={label}
    >
      {texto}
    </span>
  );
}

/** Convierte un score 0–1 o null a porcentaje 0–100. */
export function a100(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n * 100;
}
