/**
 * Capa de análisis semántico (Gemini Flash).
 * Solo interpreta los candidatos ya preseleccionados por el motor determinístico.
 * No modifica reglas, pesos ni scores determinísticos. No recibe información salarial.
 */

export const PROMPT_VERSION = "semantic-1";
export const MODELO_SEMANTICO = process.env["GEMINI_MODEL"] ?? "gemini-3.6-flash";

export const CRITERIOS_SEMANTICOS = [
  "propósito",
  "funciones",
  "responsabilidades",
  "conocimientos",
  "complejidad",
  "autonomía",
  "alcance",
  "experiencia requerida",
  "requisitos y formación",
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
Cada cargo incluye atributos_semanticos con las claves proposito, funciones, responsabilidades, conocimientos, complejidad, autonomia y alcance.
Un atributo con cadena vacía significa información no disponible: trátalo como limitación, nunca lo completes ni lo supongas.
Si falta información, redúcela en la confianza y menciónalo brevemente en la explicación.
Evalúa exclusivamente:
- propósito;
- funciones;
- responsabilidades;
- conocimientos;
- complejidad;
- autonomía;
- alcance.
- experiencia requerida;
- requisitos y formación.
Los scores semánticos se expresan de 0 a 100 y la confianza como un decimal entre 0 y 1.
Debes incluir en scores_por_candidato exactamente todos los candidatos enviados, usando sus id tal cual.
Sé breve: para cada candidato entrega solo el score y una explicación de 1 o 2 frases.
No entregues listas de similitudes, diferencias ni riesgos.
Tu función es realizar una comparación semántica y entregar el resultado solicitado en el esquema JSON definido por la aplicación.`;

export const CLAVES_ATRIBUTOS = [
  "proposito",
  "funciones",
  "responsabilidades",
  "conocimientos",
  "complejidad",
  "autonomia",
  "alcance",
] as const;

export type ClaveAtributo = (typeof CLAVES_ATRIBUTOS)[number];
export type AtributosSemanticos = Record<ClaveAtributo, string>;

/** Normaliza siempre las 7 claves; lo faltante viaja como cadena vacía, nunca inventado. */
export function normalizarAtributos(raw: unknown): AtributosSemanticos {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = {} as AtributosSemanticos;
  for (const k of CLAVES_ATRIBUTOS) {
    out[k] = typeof o[k] === "string" ? (o[k] as string).trim() : "";
  }
  return out;
}

export type CargoSemantico = {
  id: string;
  nombre: string;
  descripcion: string | null;
  atributos_semanticos: AtributosSemanticos;
  experiencia_requerida: string;
  requisitos_formacion: string;
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

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    candidato_recomendado_id: {
      type: "string",
      description: "id exacto de uno de los candidatos enviados",
    },
    score_semantico: {
      type: "number",
      description: "número entero entre 0 y 100 del candidato recomendado",
    },
    confianza: { type: "number", description: "número decimal entre 0 y 1 (por ejemplo 0.75)" },
    explicacion_breve: { type: "string", description: "1 o 2 frases, máximo 40 palabras" },
    scores_por_candidato: {
      type: "array",
      items: {
        type: "object",
        properties: {
          candidato_id: { type: "string", description: "id exacto del candidato enviado" },
          score_semantico: { type: "number", description: "número entero entre 0 y 100" },
          explicacion_breve: { type: "string", description: "1 o 2 frases, máximo 40 palabras" },
        },
        required: ["candidato_id", "score_semantico", "explicacion_breve"],
      },
    },
  },
  required: [
    "candidato_recomendado_id",
    "score_semantico",
    "confianza",
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

/** Construye el payload permitido: sin sueldos, sin tamaño de empresa, sin candidatos no preseleccionados. */
export function construirPayload(interno: CargoSemantico, candidatos: CargoSemantico[]) {
  const limpiar = (c: CargoSemantico) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    atributos_semanticos: normalizarAtributos(c.atributos_semanticos),
    experiencia_requerida: c.experiencia_requerida || "",
    requisitos_formacion: c.requisitos_formacion || "",
  });
  return {
    criterios_semanticos: CRITERIOS_SEMANTICOS,
    cargo_interno: {
      nombre: interno.nombre,
      descripcion: interno.descripcion,
      atributos_semanticos: normalizarAtributos(interno.atributos_semanticos),
      experiencia_requerida: interno.experiencia_requerida || "",
      requisitos_formacion: interno.requisitos_formacion || "",
    },
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

  const { conReintentos, ReintentosAgotadosError } = await import("./gemini-retry.server");
  const contents = [
    "Los scores semánticos deben ser números enteros en escala 0 a 100 (por ejemplo 82), nunca decimales entre 0 y 1. La confianza sí es un decimal entre 0 y 1.",
    JSON.stringify(payload),
  ].join("\n\n");
  let cruda: string;
  let modelo = MODELO_SEMANTICO;
  try {
    const respuesta = await conReintentos(() =>
      ai.models.generateContent({
        model: MODELO_SEMANTICO,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
          temperature: 0,
        },
      }),
    );
    cruda = respuesta.text ?? "";
  } catch (e) {
    if (!(e instanceof ReintentosAgotadosError)) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      throw new SemanticoError(`Gemini no respondió correctamente: ${msg}`);
    }
    // Respaldo: Groq con las mismas instrucciones, contenido y esquema.
    const groq = await import("./groq.server");
    try {
      cruda = await groq.generarJsonConGroq({
        systemInstruction: SYSTEM_INSTRUCTION,
        contents,
        schema: RESPONSE_SCHEMA,
      });
      modelo = groq.ID_MODELO_GROQ;
    } catch (eg) {
      console.error("Respaldo Groq falló:", eg);
      throw new SemanticoError(
        "El análisis IA no está disponible en este momento. Los resultados determinísticos se conservan intactos; intenta nuevamente en unos minutos.",
      );
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cruda);
  } catch {
    throw new SemanticoError("La respuesta del análisis IA no es JSON válido");
  }

  return { cruda, validada: validarAnalisis(parsed, candidatos), payload, modelo };
}
