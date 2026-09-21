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

const ORDEN_EMPRESA: Record<string, number> = { P: 0, M: 1, G: 2 };

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
    case "experiencia":
      return similitudTexto(interno.experiencia_requerida, candidato.experiencia_requerida);
    case "requisitos":
      return similitudTexto(interno.requisitos_formacion, candidato.requisitos_formacion);
    case "tipo_empresa": {
      if (!interno.empresa_tipo || !candidato.empresa_tipo) return null;
      const d = Math.abs(
        (ORDEN_EMPRESA[interno.empresa_tipo] ?? 0) - (ORDEN_EMPRESA[candidato.empresa_tipo] ?? 0),
      );
      if (d === 0) return 1;
      if (d === 1) return 0.5;
      return 0;
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
  tipo_empresa: "tamaño de empresa",
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
