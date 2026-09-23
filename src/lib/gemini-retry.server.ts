/** Reintentos ante errores transitorios de Gemini (503, 429, 5xx). */

export class ReintentosAgotadosError extends Error {
  constructor(public causa: unknown) {
    super(causa instanceof Error ? causa.message : "error transitorio");
  }
}

export function esTransitorio(e: unknown): boolean {
  const o = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
  const texto = [e instanceof Error ? e.message : String(e), o["status"], o["code"]]
    .filter((x) => x !== undefined && x !== null)
    .join(" ");
  return /\b(500|502|503|504|429)\b|UNAVAILABLE|high demand|overload|RESOURCE_EXHAUSTED/i.test(texto);
}

const ESPERAS = [1000, 2000, 4000];

export async function conReintentos<T>(
  fn: () => Promise<T>,
  dormir: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
): Promise<T> {
  for (let intento = 0; ; intento++) {
    try {
      return await fn();
    } catch (e) {
      if (!esTransitorio(e)) throw e;
      if (intento >= ESPERAS.length) throw new ReintentosAgotadosError(e);
      await dormir(ESPERAS[intento]! + 100 + Math.floor(Math.random() * 201));
    }
  }
}
