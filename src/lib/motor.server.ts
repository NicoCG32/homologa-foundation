/**
 * Motor determinístico de homologación.
 * Cálculo puro: mismas entradas → mismas salidas. Sin IA, sin datos inventados.
 */

export type CriterioCampo = "nombre" | "descripcion" | "sueldo" | "tipo_empresa";

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
  sueldo: number | null;
  empresa_nombre: string | null;
  empresa_tipo: "P" | "M" | "G" | null;
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

function similitudTexto(a: string, b: string) {
  const pa = normalizar(a);
  const pb = new Set(normalizar(b));
  if (!pa.length || !pb.size) return null;
  const comunes = pa.filter((w) => pb.has(w));
  return comunes.length / pa.length;
}

function similitudSueldo(a: number, b: number) {
  const base = Math.max(Math.abs(a), Math.abs(b));
  if (base === 0) return 1;
  const dif = Math.abs(a - b) / base;
  if (dif >= 0.5) return 0;
  return 1 - dif / 0.5;
}

const ORDEN_EMPRESA: Record<string, number> = { P: 0, M: 1, G: 2 };

/** Devuelve el puntaje 0..1 del criterio, o null si falta el dato en alguno de los cargos. */
function evaluarCriterio(
  campo: CriterioCampo,
  interno: CargoMotor,
  candidato: CargoMotor,
): number | null {
  if (campo === "nombre") return similitudTexto(interno.nombre, candidato.nombre);
  if (campo === "descripcion") {
    if (!interno.descripcion || !candidato.descripcion) return null;
    return similitudTexto(interno.descripcion, candidato.descripcion);
  }
  if (campo === "sueldo") {
    if (interno.sueldo === null || candidato.sueldo === null) return null;
    return similitudSueldo(Number(interno.sueldo), Number(candidato.sueldo));
  }
  // tipo_empresa
  if (!interno.empresa_tipo || !candidato.empresa_tipo) return null;
  const d = Math.abs(
    (ORDEN_EMPRESA[interno.empresa_tipo] ?? 0) - (ORDEN_EMPRESA[candidato.empresa_tipo] ?? 0),
  );
  if (d === 0) return 1;
  if (d === 1) return 0.5;
  return 0;
}

const ETIQUETA_CAMPO: Record<CriterioCampo, string> = {
  nombre: "nombre del cargo",
  descripcion: "descripción",
  sueldo: "sueldo",
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

      if (puntaje === null) {
        diferencias.push({
          criterio: cr.nombre,
          campo: cr.campo,
          peso,
          puntaje: 0,
          detalle: `Dato faltante en ${ETIQUETA_CAMPO[cr.campo]}`,
        });
        if (cr.obligatorio && !motivo) {
          motivo = `Criterio obligatorio «${cr.nombre}»: dato faltante en ${ETIQUETA_CAMPO[cr.campo]}`;
        }
        continue;
      }

      const item: DetalleCriterio = {
        criterio: cr.nombre,
        campo: cr.campo,
        peso,
        puntaje,
        detalle: `${ETIQUETA_CAMPO[cr.campo]}: ${(puntaje * 100).toFixed(0)}%`,
      };

      if (puntaje > 0) {
        coincidencias.push(item);
        acumulado += peso * puntaje;
      } else {
        diferencias.push(item);
        if (cr.obligatorio && !motivo) {
          motivo = `Criterio obligatorio «${cr.nombre}»: sin coincidencia en ${ETIQUETA_CAMPO[cr.campo]}`;
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
