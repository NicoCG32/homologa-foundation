export type ImportCargo = {
  codigo_cargo: string;
  nombre: string;
  codigo_area: string;
  nombre_area: string;
  codigo_subarea: string;
  nombre_subarea: string;
  codigo_nivel_jerarquico: string;
  nivel_jerarquico: string;
  descripcion: string;
  experiencia_requerida: string;
  requisitos_formacion: string;
};

export type BandaImport = {
  codigo_cargo: string;
  tipo_empresa: "P" | "M" | "G";
  p25: number | null;
  p50: number | null;
  p75: number | null;
  promedio: number | null;
};

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
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function buscarEncabezado(rows: Celda[][]) {
  return rows.findIndex((row) => row?.some((v) => clave(v) === "idcargo"));
}

function valor(row: Celda[], indices: Map<string, number>, ...nombres: string[]) {
  for (const nombre of nombres) {
    const i = indices.get(clave(nombre));
    if (i !== undefined) return row[i];
  }
  return "";
}

export function leerCargos(rows: Celda[][]) {
  const headerIndex = buscarEncabezado(rows);
  if (headerIndex < 0) throw new Error("No se encontró la columna ID Cargo");
  const header = rows[headerIndex];
  if (!header) throw new Error("El archivo no contiene encabezados");
  const indices = new Map(header.map((v, i) => [clave(v), i]));
  const cargos: ImportCargo[] = [];
  const errores: string[] = [];

  rows.slice(headerIndex + 1).forEach((row, index) => {
    const codigo = texto(valor(row, indices, "ID Cargo", "Código Cargo"));
    const nombre = texto(valor(row, indices, "Nombre del Cargo", "Nombre"));
    if (!codigo && !nombre) return;
    if (!codigo || !nombre) {
      errores.push(`Fila ${headerIndex + index + 2}: ID Cargo y Nombre del Cargo son obligatorios`);
      return;
    }
    cargos.push({
      codigo_cargo: codigo,
      nombre,
      codigo_area: texto(valor(row, indices, "Código Área")),
      nombre_area: texto(valor(row, indices, "Nombre Área")),
      codigo_subarea: texto(valor(row, indices, "Código Subárea")),
      nombre_subarea: texto(valor(row, indices, "Nombre Subárea")),
      codigo_nivel_jerarquico: texto(valor(row, indices, "Código Nivel Jerárquico")),
      nivel_jerarquico: texto(valor(row, indices, "Nivel Jerárquico", "Nivel Jerarquico")),
      descripcion: texto(valor(row, indices, "Descripción", "DESCRIPCIÓN")),
      experiencia_requerida: texto(valor(row, indices, "Experiencia Requerida")),
      requisitos_formacion: texto(valor(row, indices, "Requisitos Formación", "Formación")),
    });
  });
  return { cargos, errores };
}

export function leerBandas(rows: Celda[][]) {
  const headerIndex = buscarEncabezado(rows);
  if (headerIndex < 1) throw new Error("No se encontró la estructura de remuneraciones");
  const header = rows[headerIndex];
  const group = rows[headerIndex - 1];
  if (!header || !group) throw new Error("No se encontró la estructura de remuneraciones");
  const idIndex = header.findIndex((v) => clave(v) === "idcargo");
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
  const contenido = "ID Cargo,Nombre del Cargo,Código Área,Nombre Área,Código Subárea,Nombre Subárea,Código Nivel Jerárquico,Nivel Jerárquico,DESCRIPCIÓN,Experiencia Requerida,Requisitos Formación\n";
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla-cargos-empresa.csv";
  a.click();
  URL.revokeObjectURL(url);
}