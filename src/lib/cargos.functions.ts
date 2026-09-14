import { createServerFn } from "@tanstack/react-start";

export type CargoTipo = "INTERNO" | "REFERENCIA";

/** Atributos que interpreta la capa semántica. No participan del motor determinístico. */
export const ATRIBUTOS_SEMANTICOS = [
  { clave: "proposito", etiqueta: "Propósito" },
  { clave: "funciones", etiqueta: "Funciones" },
  { clave: "responsabilidades", etiqueta: "Responsabilidades" },
  { clave: "conocimientos", etiqueta: "Conocimientos" },
  { clave: "complejidad", etiqueta: "Complejidad" },
  { clave: "autonomia", etiqueta: "Autonomía" },
  { clave: "alcance", etiqueta: "Alcance" },
] as const;

export type ClaveAtributo = (typeof ATRIBUTOS_SEMANTICOS)[number]["clave"];
export type AtributosSemanticos = Record<ClaveAtributo, string>;

export function atributosVacios(): AtributosSemanticos {
  return Object.fromEntries(
    ATRIBUTOS_SEMANTICOS.map((a) => [a.clave, ""]),
  ) as AtributosSemanticos;
}

export function normalizarAtributosInput(raw: unknown): AtributosSemanticos {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = atributosVacios();
  for (const a of ATRIBUTOS_SEMANTICOS) {
    out[a.clave] = typeof o[a.clave] === "string" ? (o[a.clave] as string).trim() : "";
  }
  return out;
}

/** Campos estructurales opcionales. Los cargos de referencia pueden traer solo algunos. */
export const CAMPOS_ESTRUCTURALES = [
  { clave: "codigo_area", etiqueta: "Código de área" },
  { clave: "nombre_area", etiqueta: "Área" },
  { clave: "codigo_subarea", etiqueta: "Código de subárea" },
  { clave: "nombre_subarea", etiqueta: "Subárea" },
  { clave: "codigo_cargo", etiqueta: "Código del cargo" },
  { clave: "nivel_jerarquico", etiqueta: "Nivel jerárquico / estamento" },
  { clave: "experiencia_requerida", etiqueta: "Experiencia requerida" },
  { clave: "requisitos_formacion", etiqueta: "Requisitos / formación" },
] as const;

export type ClaveEstructural = (typeof CAMPOS_ESTRUCTURALES)[number]["clave"];
export type Estructurales = Record<ClaveEstructural, string>;

export function estructuralesVacios(): Estructurales {
  return Object.fromEntries(CAMPOS_ESTRUCTURALES.map((c) => [c.clave, ""])) as Estructurales;
}

function normalizarEstructurales(raw: unknown): Record<ClaveEstructural, string | null> {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = {} as Record<ClaveEstructural, string | null>;
  for (const c of CAMPOS_ESTRUCTURALES) {
    const v = typeof o[c.clave] === "string" ? (o[c.clave] as string).trim() : "";
    out[c.clave] = v || null;
  }
  return out;
}

export type Cargo = {
  id: string;
  empresa_id: string;
  tipo: CargoTipo;
  nombre: string;
  descripcion: string | null;
  sueldo: number | null;
  atributos_semanticos: AtributosSemanticos | null;
  codigo_nivel_jerarquico: string | null;
  empresas?: { nombre: string } | null;
} & Record<ClaveEstructural, string | null>;

const SELECT_CARGO =
  "id, empresa_id, tipo, nombre, descripcion, sueldo, atributos_semanticos, codigo_area, nombre_area, codigo_subarea, nombre_subarea, codigo_cargo, codigo_nivel_jerarquico, nivel_jerarquico, experiencia_requerida, requisitos_formacion, empresas(nombre)";

export const listCargos = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return unwrap(await getDb().from("cargos").select(SELECT_CARGO).order("nombre"));
});

export const createCargo = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      empresa_id: string;
      tipo: CargoTipo;
      nombre: string;
      descripcion: string;
      sueldo: string | number | null;
      atributos_semanticos?: Partial<AtributosSemanticos> | null;
      estructurales?: Partial<Estructurales> | null;
    }) => {
      const nombre = String(input?.nombre ?? "").trim();
      if (!nombre) throw new Error("El nombre es obligatorio");
      if (!input?.empresa_id) throw new Error("La empresa es obligatoria");
      if (!["INTERNO", "REFERENCIA"].includes(input?.tipo)) throw new Error("Tipo inválido");
      const sueldoRaw = input?.sueldo;
      const sueldo =
        sueldoRaw === "" || sueldoRaw === null || sueldoRaw === undefined
          ? null
          : Number(sueldoRaw);
      if (sueldo !== null && (!Number.isFinite(sueldo) || sueldo < 0)) {
        throw new Error("Sueldo inválido");
      }
      return {
        empresa_id: String(input.empresa_id),
        tipo: input.tipo,
        nombre,
        descripcion: String(input?.descripcion ?? "").trim() || null,
        sueldo,
        atributos_semanticos: normalizarAtributosInput(input?.atributos_semanticos),
        ...normalizarEstructurales(input?.estructurales),
      };
    },
  )
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    return unwrap(await getDb().from("cargos").insert(data).select("id").single());
  });

export const deleteCargo = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb().from("cargos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

type FilaImport = {
  codigo_cargo: string; nombre: string; codigo_area: string; nombre_area: string;
  codigo_subarea: string; nombre_subarea: string; codigo_nivel_jerarquico: string;
  nivel_jerarquico: string; descripcion: string; experiencia_requerida: string;
  requisitos_formacion: string; empresa_nombre?: string; empresa_tipo?: EmpresaTipo | null;
  sueldo?: number | null; proposito?: string; funciones?: string; responsabilidades?: string;
};
type BandaImport = { codigo_cargo: string; tipo_empresa: EmpresaTipo; p25: number | null; p50: number | null; p75: number | null; promedio: number | null };
type EmpresaTipo = "P" | "M" | "G";

function claveEmpresa(v: string) {
  return v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

export const importarCargos = createServerFn({ method: "POST" })
  .inputValidator((input: { empresa_id?: string | null; empresa_defecto?: { nombre: string; tipo: EmpresaTipo } | null; tipo: CargoTipo; cargos: FilaImport[]; bandas?: BandaImport[] }) => {
    if (!Array.isArray(input.cargos) || !input.cargos.length || input.cargos.length > 2000) throw new Error("El archivo no contiene cargos válidos");
    const empresaDefecto = input.empresa_defecto?.nombre?.trim()
      ? { nombre: input.empresa_defecto.nombre.trim(), tipo: (["P", "M", "G"] as const).includes(input.empresa_defecto.tipo) ? input.empresa_defecto.tipo : ("G" as EmpresaTipo) }
      : null;
    const empresaId = input.empresa_id ? String(input.empresa_id) : null;
    const cargos = input.cargos.map((fila, i) => {
      const codigo_cargo = String(fila.codigo_cargo ?? "").trim();
      const nombre = String(fila.nombre ?? "").trim();
      if (!codigo_cargo || !nombre) throw new Error(`Fila ${i + 1}: ID y nombre son obligatorios`);
      const empresa_nombre = String(fila.empresa_nombre ?? "").trim();
      const empresa_tipo = (["P", "M", "G"] as const).includes(fila.empresa_tipo as EmpresaTipo) ? (fila.empresa_tipo as EmpresaTipo) : null;
      if (!empresa_nombre && !empresaId && !empresaDefecto) throw new Error(`Fila ${i + 1}: falta la empresa`);
      const limpio = (v: unknown) => String(v ?? "").trim() || null;
      const sueldoRaw = fila.sueldo;
      const sueldo = typeof sueldoRaw === "number" && Number.isFinite(sueldoRaw) && sueldoRaw >= 0 ? sueldoRaw : null;
      const atributos = { ...atributosVacios(), proposito: String(fila.proposito ?? "").trim(), funciones: String(fila.funciones ?? "").trim(), responsabilidades: String(fila.responsabilidades ?? "").trim() };
      return { empresa_nombre, empresa_tipo, datos: { tipo: input.tipo, codigo_cargo, nombre, sueldo, codigo_area: limpio(fila.codigo_area), nombre_area: limpio(fila.nombre_area), codigo_subarea: limpio(fila.codigo_subarea), nombre_subarea: limpio(fila.nombre_subarea), codigo_nivel_jerarquico: limpio(fila.codigo_nivel_jerarquico), nivel_jerarquico: limpio(fila.nivel_jerarquico), descripcion: limpio(fila.descripcion), experiencia_requerida: limpio(fila.experiencia_requerida), requisitos_formacion: limpio(fila.requisitos_formacion), atributos_semanticos: atributos } };
    });
    return { empresa_id: empresaId, empresa_defecto: empresaDefecto, cargos, bandas: Array.isArray(input.bandas) ? input.bandas : [] };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    const db = getDb();
    let creados = 0;
    let actualizados = 0;
    let empresasCreadas = 0;

    const existentes = unwrap(await db.from("empresas").select("id, nombre, tipo")) ?? [];
    const porNombre = new Map<string, string>();
    for (const e of existentes) porNombre.set(claveEmpresa(e.nombre), e.id);

    async function resolverEmpresa(nombre: string, tipo: EmpresaTipo | null) {
      const k = claveEmpresa(nombre);
      const encontrada = porNombre.get(k);
      if (encontrada) return encontrada;
      const creada = unwrap(await db.from("empresas").insert({ nombre: nombre.trim(), tipo: tipo ?? "G", tamano: tipo }).select("id").single());
      if (!creada) throw new Error(`No se pudo crear la empresa ${nombre}`);
      porNombre.set(k, creada.id);
      empresasCreadas += 1;
      return creada.id;
    }

    const ids = new Map<string, string>();
    for (const fila of data.cargos) {
      const empresa_id = fila.empresa_nombre
        ? await resolverEmpresa(fila.empresa_nombre, fila.empresa_tipo)
        : data.empresa_id ?? (await resolverEmpresa(data.empresa_defecto!.nombre, data.empresa_defecto!.tipo));
      const valores = { ...fila.datos, empresa_id };
      // La identidad de un cargo es tipo + código + empresa: el mismo código puede
      // existir como interno y como referencia sin ser el mismo registro.
      const existente = unwrap(
        await db
          .from("cargos")
          .select("id")
          .eq("empresa_id", empresa_id)
          .eq("tipo", valores.tipo)
          .eq("codigo_cargo", valores.codigo_cargo)
          .maybeSingle(),
      );
      const claveCargo = `${valores.tipo}|${valores.codigo_cargo}`;
      if (existente) {
        const { error } = await db.from("cargos").update(valores).eq("id", existente.id);
        if (error) throw new Error(error.message);
        ids.set(claveCargo, existente.id);
        actualizados += 1;
      } else {
        const creado = unwrap(await db.from("cargos").insert(valores).select("id").single());
        if (!creado) throw new Error(`No se pudo crear el cargo ${valores.nombre}`);
        ids.set(claveCargo, creado.id);
        creados += 1;
      }
    }
    for (const banda of data.bandas) {
      const cargo_id = ids.get(String(banda.codigo_cargo));
      if (!cargo_id) continue;
      const valores = { cargo_id, tipo_empresa: banda.tipo_empresa, p25: banda.p25, p50: banda.p50, p75: banda.p75, promedio: banda.promedio };
      const { error } = await db.from("bandas_salariales").upsert(valores, { onConflict: "cargo_id,tipo_empresa" });
      if (error) throw new Error(error.message);
    }
    return { creados, actualizados, empresas: empresasCreadas, bandas: data.bandas.length };
  });
