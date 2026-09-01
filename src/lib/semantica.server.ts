/**
 * Capa de análisis semántico (Gemini Flash).
 * Solo interpreta los candidatos ya preseleccionados por el motor determinístico.
 * No modifica reglas, pesos ni scores determinísticos. No recibe información salarial.
 */

export const PROMPT_VERSION = "semantic-1";
export const MODELO_SEMANTICO = process.env["GEMINI_MODEL"] ?? "gemini-2.0-flash";

export const CRITERIOS_SEMANTICOS = [
  "propósito",
  "funciones",
  "responsabilidades",
  "conocimientos",
  "complejidad",
  "autonomía",
  "alcance",
] as const;

export const SYSTEM_INSTRUCTION = `Eres un evaluador semántico de cargos.
Debes comparar exclusivamente el cargo interno y los candidatos entregados en esta solicitud.
Utiliza únicamente la información proporcionada.
No puedes:
- inventar cargos;
- inventar atributos;
- completar información faltante con conocimiento externo;
- utilizar información externa;
- modificar reglas;
- modificar pesos;
- recomendar remuneraciones;
- incorporar candidatos que no hayan sido enviados.
Si falta información, indícalo como diferencia o limitación y reduce la confianza.
Evalúa exclusivamente:
- propósito;
- funciones;
- responsabilidades;
- conocimientos;
- complejidad;
- autonomía;
- alcance.
Tu función es realizar una comparación semántica y entregar el resultado solicitado en el esquema JSON definido por la aplicación.`;

export type CargoSemantico = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_empresa: "P" | "M" | "G" | null;
};

export type ScorePorCandidato = {
  candidato_id: string;
  score_semantico: number;
  similitudes: string[];
  diferencias: string[];
  explicacion_breve: string;
};

export type AnalisisSemantico = {
  candidato_recomendado_id: string;
  score_semantico: number;
  confianza: number;
  similitudes: string[];
  diferencias: string[];
  explicacion_breve: string;
  scores_por_candidato: ScorePorCandidato[];
};

const listaTexto = { type: "array", items: { type: "string" } } as const;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    candidato_recomendado_id: { type: "string" },
    score_semantico: { type: "number" },
    confianza: { type: "number" },
    similitudes: listaTexto,
    diferencias: listaTexto,
    explicacion_breve: { type: "string" },
    scores_por_candidato: {
      type: "array",
      items: {
        type: "object",
        properties: {
          candidato_id: { type: "string" },
          score_semantico: { type: "number" },
          similitudes: listaTexto,
          diferencias: listaTexto,
          explicacion_breve: { type: "string" },
        },
        required: [
          "candidato_id",
          "score_semantico",
          "similitudes",
          "diferencias",
          "explicacion_breve",
        ],
      },
    },
  },
  required: [
    "candidato_recomendado_id",
    "score_semantico",
    "confianza",
    "similitudes",
    "diferencias",
    "explicacion_breve",
    "scores_por_candidato",
  ],
} as const;

export class SemanticoError extends Error {}

function texto(v: unknown) {
  return typeof v === "string" ? v : "";
}

function listaDeTextos(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

/** Valida estrictamente la respuesta del modelo contra los candidatos realmente enviados. */
export function validarAnalisis(raw: unknown, enviados: CargoSemantico[]): AnalisisSemantico {
  if (!raw || typeof raw !== "object") throw new SemanticoError("La respuesta no es un objeto JSON");
  const o = raw as Record<string, unknown>;
  const ids = new Set(enviados.map((c) => c.id));

  const recomendado = texto(o["candidato_recomendado_id"]);
  if (!ids.has(recomendado)) {
    throw new SemanticoError("El candidato recomendado no corresponde a los candidatos enviados");
  }

  const score = Number(o["score_semantico"]);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new SemanticoError("score_semantico fuera del rango 0 a 100");
  }
  const confianza = Number(o["confianza"]);
  if (!Number.isFinite(confianza) || confianza < 0 || confianza > 1) {
    throw new SemanticoError("confianza fuera del rango 0 a 1");
  }

  const lista = o["scores_por_candidato"];
  if (!Array.isArray(lista)) throw new SemanticoError("scores_por_candidato no es una lista");

  const vistos = new Set<string>();
  const scores: ScorePorCandidato[] = lista.map((item) => {
    if (!item || typeof item !== "object") throw new SemanticoError("Candidato evaluado inválido");
    const c = item as Record<string, unknown>;
    const cid = texto(c["candidato_id"]);
    if (!ids.has(cid)) throw new SemanticoError("La respuesta contiene un candidato desconocido");
    if (vistos.has(cid)) throw new SemanticoError("La respuesta repite un candidato");
    vistos.add(cid);
    const s = Number(c["score_semantico"]);
    if (!Number.isFinite(s) || s < 0 || s > 100) {
      throw new SemanticoError("score_semantico de un candidato fuera del rango 0 a 100");
    }
    return {
      candidato_id: cid,
      score_semantico: s,
      similitudes: listaDeTextos(c["similitudes"]),
      diferencias: listaDeTextos(c["diferencias"]),
      explicacion_breve: texto(c["explicacion_breve"]),
    };
  });

  if (vistos.size !== ids.size) {
    throw new SemanticoError("Faltan candidatos en scores_por_candidato");
  }

  return {
    candidato_recomendado_id: recomendado,
    score_semantico: score,
    confianza,
    similitudes: listaDeTextos(o["similitudes"]),
    diferencias: listaDeTextos(o["diferencias"]),
    explicacion_breve: texto(o["explicacion_breve"]),
    scores_por_candidato: scores,
  };
}

/** Construye el payload permitido: sin sueldos, sin candidatos no preseleccionados. */
export function construirPayload(interno: CargoSemantico, candidatos: CargoSemantico[]) {
  const limpiar = (c: CargoSemantico) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    tipo_empresa: c.tipo_empresa,
  });
  return {
    criterios_semanticos: CRITERIOS_SEMANTICOS,
    cargo_interno: { nombre: interno.nombre, descripcion: interno.descripcion, tipo_empresa: interno.tipo_empresa },
    candidatos_preseleccionados: candidatos.map(limpiar),
  };
}

export async function analizarConGemini(interno: CargoSemantico, candidatos: CargoSemantico[]) {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new SemanticoError(
      "Falta configurar el secreto GEMINI_API_KEY en el backend. Los resultados determinísticos no fueron modificados.",
    );
  }
  if (!candidatos.length) {
    throw new SemanticoError("No hay candidatos preseleccionados para analizar");
  }

  const payload = construirPayload(interno, candidatos);
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  let respuesta: { text?: string };
  try {
    respuesta = await ai.models.generateContent({
      model: MODELO_SEMANTICO,
      contents: JSON.stringify(payload),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
        temperature: 0,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    throw new SemanticoError(`Gemini no respondió correctamente: ${msg}`);
  }

  const cruda = respuesta.text ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(cruda);
  } catch {
    throw new SemanticoError("La respuesta de Gemini no es JSON válido");
  }

  return { cruda, validada: validarAnalisis(parsed, candidatos), payload };
}
