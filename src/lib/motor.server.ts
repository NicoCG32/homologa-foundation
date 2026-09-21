/**
 * Motor determinístico de homologación.
 * Cálculo puro: mismas entradas → mismas salidas. Sin IA, sin datos inventados.
 * El sueldo NO participa: la homologación evalúa contenido y estructura del cargo.
 */

import type { ExperienciaNorm, FormacionNorm } from "./normalizacion.server";

export type CriterioCampo =
  | "nombre"
  | "descripcion"
  | "area"
  | "subarea"
  | "codigo_cargo"
  | "nivel_jerarquico"
  | "experiencia"
  | "requisitos";

export type CriterioMotor = {
  id: string;
  nombre: string;
  peso: number;
  activo: boolean;
  campo: CriterioCampo;
  obligatorio: boolean;
};

export type CargoMotor = {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo_area: string | null;
  nombre_area: string | null;
  codigo_subarea: string | null;
  nombre_subarea: string | null;
  codigo_cargo: string | null;
  nivel_jerarquico: string | null;
  experiencia_requerida: string | null;
  requisitos_formacion: string | null;
  experiencia_norm?: ExperienciaNorm | null;
  formacion_norm?: FormacionNorm | null;
  empresa_nombre: string | null;
};


export type DetalleCriterio = {
  criterio: string;
  campo: CriterioCampo;
  peso: number;
  puntaje: number;
  detalle: string;
};

export type CandidatoEvaluado = {
  cargo: CargoMotor;
  score: number;
  coincidencias: DetalleCriterio[];
  diferencias: DetalleCriterio[];
};

export type CandidatoDescartado = {
  cargo: CargoMotor;
  motivo: string;
};

export type ResultadoMotor = {
  evaluados: number;
  preseleccionados: CandidatoEvaluado[];
  descartados: CandidatoDescartado[];
  pesoTotal: number;
};

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function clave(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function similitudTexto(a: string | null, b: string | null) {
  if (!a || !b) return null;
  const pa = normalizar(a);
  const pb = new Set(normalizar(b));
  if (!pa.length || !pb.size) return null;
  const comunes = pa.filter((w) => pb.has(w));
  return comunes.length / pa.length;
}

function igualdadCodigo(a: string | null, b: string | null) {
  if (!a?.trim() || !b?.trim()) return null;
  return clave(a) === clave(b) ? 1 : 0;
}

/** Códigos si ambos los tienen; si no, comparación textual del nombre. */
function comparaCategoria(
  codA: string | null,
  codB: string | null,
  nomA: string | null,
  nomB: string | null,
) {
  const porCodigo = igualdadCodigo(codA, codB);
  if (porCodigo !== null) return porCodigo;
  return similitudTexto(nomA, nomB);
}

/** Jaccard sobre listas de términos canónicos ya normalizados por Gemini. */
function similitudListas(a: string[], b: string[]): number | null {
  const sa = new Set(a.map(clave).filter(Boolean));
  const sb = new Set(b.map(clave).filter(Boolean));
  if (!sa.size || !sb.size) return null;
  let comunes = 0;
  for (const x of sa) if (sb.has(x)) comunes++;
  const union = new Set([...sa, ...sb]).size;
  return union ? comunes / union : null;
}

function promedio(valores: (number | null)[]) {
  const usables = valores.filter((v): v is number => v !== null);
  if (!usables.length) return null;
  return usables.reduce((s, v) => s + v, 0) / usables.length;
}

/** Traslape de rangos de años: total, parcial o sin traslape. */
function comparaRangoAnios(a: ExperienciaNorm, b: ExperienciaNorm): number | null {
  const ra = rango(a);
  const rb = rango(b);
  if (!ra || !rb) return null;
  const inicio = Math.max(ra[0], rb[0]);
  const fin = Math.min(ra[1], rb[1]);
  if (inicio > fin) return 0;
  const largo = Math.min(ra[1] - ra[0], rb[1] - rb[0]);
  if (largo <= 0) return 1;
  return Math.min(1, (fin - inicio) / largo);
}

function rango(e: ExperienciaNorm): [number, number] | null {
  const min = e.min_anios;
  const max = e.max_anios;
  if (min === null && max === null) return null;
  const lo = min ?? 0;
  const hi = max ?? Math.max(lo + 5, lo);
  return [lo, Math.max(lo, hi)];
}

const ORDEN_NIVEL = [
  "educacionmedia",
  "tecniconivelmedio",
  "tecniconivelsuperior",
  "profesional",
  "postitulo",
  "magister",
  "doctorado",
];

function comparaNivelFormacion(a: string | null, b: string | null): number | null {
  if (!a?.trim() || !b?.trim()) return null;
  const ka = clave(a);
  const kb = clave(b);
  if (ka === kb) return 1;
  const ia = ORDEN_NIVEL.indexOf(ka);
  const ib = ORDEN_NIVEL.indexOf(kb);
  if (ia < 0 || ib < 0) return similitudTexto(a, b) ?? 0;
  const d = Math.abs(ia - ib);
  if (d === 1) return 0.6;
  if (d === 2) return 0.3;
  return 0;
}

/** Devuelve el puntaje 0..1 del criterio, o null si falta el dato en alguno de los cargos. */
function evaluarCriterio(
  campo: CriterioCampo,
  interno: CargoMotor,
  candidato: CargoMotor,
): number | null {
  switch (campo) {
    case "nombre":
      return similitudTexto(interno.nombre, candidato.nombre);
    case "descripcion":
      return similitudTexto(interno.descripcion, candidato.descripcion);
    case "area":
      return comparaCategoria(
        interno.codigo_area,
        candidato.codigo_area,
        interno.nombre_area,
        candidato.nombre_area,
      );
    case "subarea":
      return comparaCategoria(
        interno.codigo_subarea,
        candidato.codigo_subarea,
        interno.nombre_subarea,
        candidato.nombre_subarea,
      );
    case "codigo_cargo":
      return igualdadCodigo(interno.codigo_cargo, candidato.codigo_cargo);
    case "nivel_jerarquico": {
      const exacto = igualdadCodigo(interno.nivel_jerarquico, candidato.nivel_jerarquico);
      if (exacto === 1) return 1;
      if (exacto === null) return null;
      return similitudTexto(interno.nivel_jerarquico, candidato.nivel_jerarquico) ?? 0;
    }
    case "experiencia": {
      // Ficha normalizada cuando existe; si no, el texto original como hasta ahora.
      const a = interno.experiencia_norm;
      const b = candidato.experiencia_norm;
      if (a && b) {
        const valor = promedio([comparaRangoAnios(a, b), similitudListas(a.areas, b.areas)]);
        if (valor !== null) return valor;
      }
      return similitudTexto(interno.experiencia_requerida, candidato.experiencia_requerida);
    }
    case "requisitos": {
      const a = interno.formacion_norm;
      const b = candidato.formacion_norm;
      if (a && b) {
        const valor = promedio([
          comparaNivelFormacion(a.nivel, b.nivel),
          similitudListas(a.areas, b.areas),
          similitudListas(a.carreras, b.carreras),
        ]);
        if (valor !== null) return valor;
      }
      return similitudTexto(interno.requisitos_formacion, candidato.requisitos_formacion);
    }
    default:
      return null;
  }
}

const ETIQUETA_CAMPO: Record<CriterioCampo, string> = {
  nombre: "nombre del cargo",
  descripcion: "descripción",
  area: "área",
  subarea: "subárea",
  codigo_cargo: "código del cargo",
  nivel_jerarquico: "nivel jerárquico",
  experiencia: "experiencia requerida",
  requisitos: "requisitos / formación",
};


export function ejecutarMotor(
  interno: CargoMotor,
  candidatos: CargoMotor[],
  criterios: CriterioMotor[],
): ResultadoMotor {
  const activos = criterios
    .filter((c) => c.activo && Number(c.peso) > 0)
    .slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const pesoTotal = activos.reduce((s, c) => s + Number(c.peso), 0);

  const preseleccionados: CandidatoEvaluado[] = [];
  const descartados: CandidatoDescartado[] = [];

  const orden = candidatos.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  for (const cand of orden) {
    const coincidencias: DetalleCriterio[] = [];
    const diferencias: DetalleCriterio[] = [];
    let acumulado = 0;
    let motivo: string | null = null;

    for (const cr of activos) {
      const puntaje = evaluarCriterio(cr.campo, interno, cand);
      const peso = Number(cr.peso);
      const etiqueta = ETIQUETA_CAMPO[cr.campo] ?? cr.campo;

      if (puntaje === null) {
        diferencias.push({
          criterio: cr.nombre,
          campo: cr.campo,
          peso,
          puntaje: 0,
          detalle: `Dato faltante en ${etiqueta}`,
        });
        if (cr.obligatorio && !motivo) {
          motivo = `Criterio obligatorio «${cr.nombre}»: dato faltante en ${etiqueta}`;
        }
        continue;
      }

      const item: DetalleCriterio = {
        criterio: cr.nombre,
        campo: cr.campo,
        peso,
        puntaje,
        detalle: `${etiqueta}: ${(puntaje * 100).toFixed(0)}%`,
      };

      if (puntaje > 0) {
        coincidencias.push(item);
        acumulado += peso * puntaje;
      } else {
        diferencias.push(item);
        if (cr.obligatorio && !motivo) {
          motivo = `Criterio obligatorio «${cr.nombre}»: sin coincidencia en ${etiqueta}`;
        }
      }
    }

    if (motivo) {
      descartados.push({ cargo: cand, motivo });
      continue;
    }

    const score = pesoTotal > 0 ? acumulado / pesoTotal : 0;
    preseleccionados.push({
      cargo: cand,
      score: Math.round(score * 10000) / 10000,
      coincidencias,
      diferencias,
    });
  }

  preseleccionados.sort(
    (a, b) => b.score - a.score || a.cargo.nombre.localeCompare(b.cargo.nombre, "es"),
  );

  return { evaluados: candidatos.length, preseleccionados, descartados, pesoTotal };
}
