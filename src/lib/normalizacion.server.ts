/**
 * Normalización previa de experiencia y formación con Gemini.
 * Gemini SOLO traduce el texto original a una ficha mínima: no decide
 * equivalencias, no puntúa, no inventa. Lo que no aparece queda en null o [].
 * El texto original nunca se modifica.
 */

export const NORMALIZACION_VERSION = "norm-1";
export const MODELO_NORMALIZACION = process.env["GEMINI_MODEL"] ?? "gemini-3.6-flash";

export type ExperienciaNorm = {
  min_anios: number | null;
  max_anios: number | null;
  areas: string[];
};

export type FormacionNorm = {
  nivel: string | null;
  areas: string[];
  carreras: string[];
};

export type FichaNorm = {
  v: string;
  huella: string;
  experiencia: ExperienciaNorm | null;
  formacion: FormacionNorm | null;
};

/** Huella estable del texto original: si cambia, se vuelve a normalizar. */
export function huellaTexto(experiencia: string | null, formacion: string | null) {
  const base = `${(experiencia ?? "").trim()}␟${(formacion ?? "").trim()}`;
  let h = 5381;
  for (let i = 0; i < base.length; i++) h = ((h << 5) + h + base.charCodeAt(i)) | 0;
  return `${base.length}-${(h >>> 0).toString(16)}`;
}

export function fichaVigente(raw: unknown, huella: string): FichaNorm | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Partial<FichaNorm>;
  if (f.v !== NORMALIZACION_VERSION || f.huella !== huella) return null;
  return {
    v: NORMALIZACION_VERSION,
    huella,
    experiencia: normalizarExperiencia(f.experiencia),
    formacion: normalizarFormacion(f.formacion),
  };
}

function lista(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

function anios(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 60 ? n : null;
}

function normalizarExperiencia(raw: unknown): ExperienciaNorm | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const ficha: ExperienciaNorm = {
    min_anios: anios(o["min_anios"]),
    max_anios: anios(o["max_anios"]),
    areas: lista(o["areas"]),
  };
  if (ficha.min_anios === null && ficha.max_anios === null && !ficha.areas.length) return null;
  return ficha;
}

function normalizarFormacion(raw: unknown): FormacionNorm | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const nivel = typeof o["nivel"] === "string" ? (o["nivel"] as string).trim() : "";
  const ficha: FormacionNorm = {
    nivel: nivel || null,
    areas: lista(o["areas"]),
    carreras: lista(o["carreras"]),
  };
  if (!ficha.nivel && !ficha.areas.length && !ficha.carreras.length) return null;
  return ficha;
}

const SYSTEM_NORMALIZACION = `Eres un normalizador de textos de cargos.
Tu única tarea es convertir el texto entregado en una ficha estructurada.
No decides equivalencias, no comparas cargos, no entregas puntajes ni recomendaciones.
No inventes información: si un dato no aparece en el texto, usa null o una lista vacía.
No traduzcas ni reinterpretes el sentido del texto original.
Usa términos canónicos consistentes y en minúsculas para áreas, carreras y nivel de formación
(por ejemplo: "recursos humanos", "administración", "ingeniería comercial",
y para nivel: "educación media", "técnico nivel medio", "técnico nivel superior",
"profesional", "postítulo", "magíster", "doctorado").
Devuelve exactamente un item por cada entrada recibida, conservando su id.`;

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          experiencia: {
            type: "object",
            properties: {
              min_anios: { type: "number", nullable: true },
              max_anios: { type: "number", nullable: true },
              areas: { type: "array", items: { type: "string" } },
            },
            required: ["min_anios", "max_anios", "areas"],
          },
          formacion: {
            type: "object",
            properties: {
              nivel: { type: "string", nullable: true },
              areas: { type: "array", items: { type: "string" } },
              carreras: { type: "array", items: { type: "string" } },
            },
            required: ["nivel", "areas", "carreras"],
          },
        },
        required: ["id", "experiencia", "formacion"],
      },
    },
  },
  required: ["items"],
} as const;

export type EntradaNorm = {
  id: string;
  experiencia_requerida: string | null;
  requisitos_formacion: string | null;
};

export class NormalizacionError extends Error {}

/**
 * Normaliza en un solo llamado todos los textos pendientes.
 * Devuelve un mapa id → ficha; los ids sin respuesta simplemente no aparecen.
 */
export async function normalizarLote(entradas: EntradaNorm[]): Promise<Map<string, FichaNorm>> {
  const salida = new Map<string, FichaNorm>();
  const utiles = entradas.filter(
    (e) => (e.experiencia_requerida ?? "").trim() || (e.requisitos_formacion ?? "").trim(),
  );
  if (!utiles.length) return salida;

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new NormalizacionError("Falta configurar el secreto GEMINI_API_KEY");

  const payload = utiles.map((e) => ({
    id: e.id,
    experiencia_texto: (e.experiencia_requerida ?? "").trim(),
    formacion_texto: (e.requisitos_formacion ?? "").trim(),
  }));

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  let respuesta: { text?: string | undefined };
  try {
    respuesta = await ai.models.generateContent({
      model: MODELO_NORMALIZACION,
      contents: JSON.stringify({ entradas: payload }),
      config: {
        systemInstruction: SYSTEM_NORMALIZACION,
        responseMimeType: "application/json",
        responseSchema: SCHEMA as unknown as Record<string, unknown>,
        temperature: 0,
      },
    });
  } catch (e) {
    throw new NormalizacionError(
      `La normalización no pudo ejecutarse: ${e instanceof Error ? e.message : "error desconocido"}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(respuesta.text ?? "");
  } catch {
    throw new NormalizacionError("La normalización no devolvió JSON válido");
  }

  const items = (parsed as { items?: unknown })?.items;
  if (!Array.isArray(items)) throw new NormalizacionError("La normalización no devolvió items");

  const porId = new Map(utiles.map((e) => [e.id, e]));
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = typeof o["id"] === "string" ? o["id"] : "";
    const entrada = porId.get(id);
    if (!entrada) continue;
    salida.set(id, {
      v: NORMALIZACION_VERSION,
      huella: huellaTexto(entrada.experiencia_requerida, entrada.requisitos_formacion),
      experiencia: normalizarExperiencia(o["experiencia"]),
      formacion: normalizarFormacion(o["formacion"]),
    });
  }

  return salida;
}
