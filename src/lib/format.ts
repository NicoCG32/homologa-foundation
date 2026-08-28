export const TIPOS_EMPRESA: Record<string, string> = {
  P: "Pequeña",
  M: "Mediana",
  G: "Grande",
};

export function formatSueldo(v: number | string | null | undefined) {
  if (v === null || v === undefined || v === "") return "—";
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Number(v));
}

export function formatFecha(v: string) {
  return new Date(v).toLocaleString("es-CL");
}
