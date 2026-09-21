export type EmpresaTipo = "P" | "M" | "G";

export const EMPRESA_CATALOGO = "Encuesta Piloto";
export const EMPRESA_CATALOGO_TIPO: EmpresaTipo = "G";

export type ImportCargo = {
  codigo_cargo: string;
  nombre: string;
  empresa_nombre: string;
  empresa_tipo: EmpresaTipo | null;
  codigo_area: string;
  nombre_area: string;
  codigo_subarea: string;
  nombre_subarea: string;
  codigo_nivel_jerarquico: string;
  nivel_jerarquico: string;
  descripcion: string;
  experiencia_requerida: string;
  requisitos_formacion: string;
  sueldo: number | null;
  proposito: string;
  funciones: string;
  responsabilidades: string;
};

export type BandaImport = {
  codigo_cargo: string;
  tipo_empresa: "P" | "M" | "G";
  p25: number | null;
  p50: number | null;
  p75: number | null;
  promedio: number | null;
  /** Origen declarado al cargar la planilla. Nunca se deduce. */
  fuente?: string | null;
  anio?: number | null;
};


export type EntradaDiccionario = { tipo: "AREA" | "SUBAREA" | "NIVEL"; codigo: string; nombre: string };

type Celda = string | number | boolean | null | undefined;

function clave(v: Celda) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function texto(v: Celda) {
  return String(v ?? "").trim();
}

function numero(v: Celda) {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const CLAVES_ID = ["idcargo", "codigocargo", "codigodelcargo"];

function buscarEncabezado(rows: Celda[][]) {
  return rows.findIndex((row) => row?.some((v) => CLAVES_ID.includes(clave(v))));
}

function valor(row: Celda[], indices: Map<string, number>, ...nombres: string[]) {
  for (const nombre of nombres) {
    const i = indices.get(clave(nombre));
    if (i !== undefined) return row[i];
  }
  return "";
}

function valorPrefijo(row: Celda[], indices: Map<string, number>, prefijo: string) {
  for (const [k, i] of indices) if (k.startsWith(prefijo)) return row[i];
  return "";
}

function esCodigo(v: string) {
  return /^\d+$/.test(v);
}

export function normalizarNombreEmpresa(v: string) {
  return clave(v);
}

export function leerTipoEmpresa(v: Celda): EmpresaTipo | null {
  const k = clave(v);
  if (!k) return null;
  if (k === "p" || k.startsWith("pequen")) return "P";
  if (k === "m" || k.startsWith("median")) return "M";
  if (k === "g" || k.startsWith("grande")) return "G";
  return null;
}

export function leerCargos(rows: Celda[][]) {
  const headerIndex = buscarEncabezado(rows);
  if (headerIndex < 0) throw new Error("No se encontró la columna ID Cargo o Código del cargo");
  const header = rows[headerIndex];
  if (!header) throw new Error("El archivo no contiene encabezados");
  const indices = new Map(header.map((v, i) => [clave(v), i]));
  const cargos: ImportCargo[] = [];
  const errores: string[] = [];
  const vistos = new Map<string, number>();

  rows.slice(headerIndex + 1).forEach((row, index) => {
    const fila = headerIndex + index + 2;
    const codigo = texto(valor(row, indices, "ID Cargo", "Código Cargo", "Código del cargo"));
    const nombre = texto(valor(row, indices, "Nombre del Cargo", "Nombre"));
    if (!codigo && !nombre) return;
    if (!codigo || !nombre) {
      errores.push(`Fila ${fila}: el código y el nombre del cargo son obligatorios`);
      return;
    }
    if (vistos.has(codigo)) {
      errores.push(`Fila ${fila}: el código ${codigo} ya aparece en la fila ${vistos.get(codigo)}`);
      return;
    }
    vistos.set(codigo, fila);

    const empresaNombre = texto(valor(row, indices, "Empresa", "Nombre Empresa", "Razón Social"));
    const empresaTipo = leerTipoEmpresa(valor(row, indices, "Tamaño", "Tamaño Empresa", "Tipo Empresa"));

    // Área y subárea: algunas planillas traen solo el código, otras código y nombre.
    const areaCodigo = texto(valor(row, indices, "Código Área"));
    const areaNombreBruto = texto(valor(row, indices, "Nombre Área", "Área"));
    const subCodigo = texto(valor(row, indices, "Código Subárea"));
    const subNombreBruto = texto(valor(row, indices, "Nombre Subárea", "Subárea"));

    // Nivel: "Código Nivel Jerárquico" + "Nivel Jerárquico" (nombre), o una sola columna con el código.
    let nivelCodigo = texto(valor(row, indices, "Código Nivel Jerárquico"));
    let nivelNombre = texto(valor(row, indices, "Nivel Jerárquico", "Nivel Jerarquico"));
    if (!nivelCodigo && esCodigo(nivelNombre)) {
      nivelCodigo = nivelNombre;
      nivelNombre = "";
    }

    const objetivo = texto(valor(row, indices, "Objetivo del cargo", "Objetivo"));
    const descripcion = texto(valor(row, indices, "DESCRIPCIÓN", "Descripción")) || objetivo;

    cargos.push({
      codigo_cargo: codigo,
      nombre,
      empresa_nombre: empresaNombre,
      empresa_tipo: empresaTipo,
      codigo_area: areaCodigo,
      nombre_area: esCodigo(areaNombreBruto) ? "" : areaNombreBruto,
      codigo_subarea: subCodigo,
      nombre_subarea: esCodigo(subNombreBruto) ? "" : subNombreBruto,
      codigo_nivel_jerarquico: nivelCodigo,
      nivel_jerarquico: nivelNombre,
      descripcion,
      experiencia_requerida: texto(valor(row, indices, "Experiencia Requerida", "Experiencia requerida")),
      requisitos_formacion: texto(
        valor(row, indices, "Requisitos Formación", "Requisitos de formación", "Formación"),
      ),
      sueldo: numero(valorPrefijo(row, indices, "rembruta")),
      proposito: objetivo,
      funciones: texto(valor(row, indices, "Funciones principales", "Funciones")),
      responsabilidades: texto(valor(row, indices, "Responsabilidades")),
    });
  });
  return { cargos, errores };
}

/** Lee la hoja "Diccionario" cuando viene dentro del archivo cargado. */
export function leerDiccionario(rows: Celda[][]) {
  const entradas: EntradaDiccionario[] = [];
  const headerIndex = rows.findIndex((row) => row?.some((v) => clave(v) === "area" || clave(v) === "niveljerarquico"));
  if (headerIndex < 0) return entradas;
  const header = rows[headerIndex] ?? [];
  const bloques: { tipo: EntradaDiccionario["tipo"]; nombreCol: number; codigoCol: number }[] = [];
  header.forEach((v, i) => {
    const k = clave(v);
    const tipo = k === "area" ? "AREA" : k === "subarea" ? "SUBAREA" : k === "niveljerarquico" ? "NIVEL" : null;
    if (!tipo) return;
    const codigoCol = header.findIndex((h, j) => j > i && clave(h) === "codigo");
    if (codigoCol > 0) bloques.push({ tipo, nombreCol: i, codigoCol });
  });
  for (const row of rows.slice(headerIndex + 1)) {
    for (const b of bloques) {
      const nombre = texto(row?.[b.nombreCol]);
      const codigo = texto(row?.[b.codigoCol]);
      if (nombre && codigo) entradas.push({ tipo: b.tipo, codigo, nombre });
    }
  }
  return entradas;
}

export type AvisoDiccionario = { cargo: string; mensaje: string };

/**
 * Completa los nombres de área, subárea y nivel con el diccionario y avisa de
 * cualquier incoherencia (código inexistente o nombre distinto).
 */
export function aplicarDiccionario(cargos: ImportCargo[], diccionario: EntradaDiccionario[]) {
  const mapa = new Map(diccionario.map((d) => [`${d.tipo}|${d.codigo}`, d.nombre]));
  const avisos: AvisoDiccionario[] = [];
  const resueltos = cargos.map((c) => {
    const copia = { ...c };
    const campos = [
      { tipo: "AREA" as const, etiqueta: "área", codigo: c.codigo_area, nombre: c.nombre_area, set: (v: string) => (copia.nombre_area = v) },
      { tipo: "SUBAREA" as const, etiqueta: "subárea", codigo: c.codigo_subarea, nombre: c.nombre_subarea, set: (v: string) => (copia.nombre_subarea = v) },
      { tipo: "NIVEL" as const, etiqueta: "nivel jerárquico", codigo: c.codigo_nivel_jerarquico, nombre: c.nivel_jerarquico, set: (v: string) => (copia.nivel_jerarquico = v) },
    ];
    for (const campo of campos) {
      if (!campo.codigo) {
        if (!campo.nombre)
          avisos.push({ cargo: c.codigo_cargo, mensaje: `no indica ${campo.etiqueta}; corrige la planilla` });
        continue;
      }
      const delDiccionario = mapa.get(`${campo.tipo}|${campo.codigo}`);
      if (!delDiccionario) {
        avisos.push({
          cargo: c.codigo_cargo,
          mensaje: `el código de ${campo.etiqueta} «${campo.codigo}» no existe en el diccionario; agrégalo en Diccionario o corrige la planilla`,
        });
        continue;
      }
      // El código manda: si el nombre del archivo difiere del diccionario no es
      // un problema, se conserva el nombre original de cada planilla.
      if (!campo.nombre) campo.set(delDiccionario);
    }
    return copia;
  });
  return { cargos: resueltos, avisos };
}

export function leerBandas(rows: Celda[][]) {
  const headerIndex = buscarEncabezado(rows);
  if (headerIndex < 1) throw new Error("No se encontró la estructura de remuneraciones");
  const header = rows[headerIndex];
  const group = rows[headerIndex - 1];
  if (!header || !group) throw new Error("No se encontró la estructura de remuneraciones");
  const idIndex = header.findIndex((v) => CLAVES_ID.includes(clave(v)));
  const columnas: { i: number; tipo: "P" | "M" | "G"; campo: "p25" | "p50" | "p75" | "promedio" }[] = [];
  let tipo: "P" | "M" | "G" | null = null;
  for (let i = 0; i < header.length; i += 1) {
    const grupo = clave(group[i]);
    if (grupo === "pequena") tipo = "P";
    if (grupo === "mediana") tipo = "M";
    if (grupo === "grande") tipo = "G";
    const h = clave(header[i]);
    const campo = h === "pp" ? "promedio" : h === "p25" || h === "p50" || h === "p75" ? h : null;
    if (tipo && campo) columnas.push({ i, tipo, campo });
  }
  const bandas: BandaImport[] = [];
  rows.slice(headerIndex + 1).forEach((row) => {
    const codigo = texto(row[idIndex]);
    if (!codigo) return;
    for (const t of ["P", "M", "G"] as const) {
      const cols = columnas.filter((c) => c.tipo === t);
      const datos = Object.fromEntries(cols.map((c) => [c.campo, numero(row[c.i])])) as Record<string, number | null>;
      if (Object.values(datos).every((v) => v === null)) continue;
      bandas.push({ codigo_cargo: codigo, tipo_empresa: t, p25: datos["p25"] ?? null, p50: datos["p50"] ?? null, p75: datos["p75"] ?? null, promedio: datos["promedio"] ?? null });
    }
  });
  return bandas;
}

export function descargarPlantilla() {
  const contenido =
    "Empresa,Tamaño,Código del cargo,Nombre del cargo,Código Área,Código Subárea,Código Nivel Jerárquico,Objetivo del cargo,Funciones principales,Responsabilidades,Requisitos de formación,Experiencia requerida,Rem.Bruta Mensual (M$/mes)\n";
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla-cargos-empresa.csv";
  a.click();
  URL.revokeObjectURL(url);
}
