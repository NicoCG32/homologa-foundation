import { createServerFn } from "@tanstack/react-start";

export type DiccionarioTipo = "AREA" | "SUBAREA" | "NIVEL";

export const TIPOS_DICCIONARIO: { tipo: DiccionarioTipo; etiqueta: string }[] = [
  { tipo: "AREA", etiqueta: "Áreas" },
  { tipo: "SUBAREA", etiqueta: "Subáreas" },
  { tipo: "NIVEL", etiqueta: "Niveles jerárquicos" },
];

export type DiccionarioEntrada = {
  id: string;
  tipo: DiccionarioTipo;
  codigo: string;
  nombre: string;
};

function validarTipo(tipo: unknown): DiccionarioTipo {
  if (tipo !== "AREA" && tipo !== "SUBAREA" && tipo !== "NIVEL") throw new Error("Tipo inválido");
  return tipo;
}

export const listDiccionario = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return (
    unwrap(
      await getDb()
        .from("diccionario_entradas")
        .select("id, tipo, codigo, nombre")
        .order("tipo")
        .order("codigo"),
    ) ?? []
  );
});

export const createDiccionario = createServerFn({ method: "POST" })
  .inputValidator((input: { tipo: DiccionarioTipo; codigo: string; nombre: string }) => {
    const codigo = String(input?.codigo ?? "").trim();
    const nombre = String(input?.nombre ?? "").trim();
    if (!codigo) throw new Error("El código es obligatorio");
    if (!nombre) throw new Error("El nombre es obligatorio");
    return { tipo: validarTipo(input?.tipo), codigo, nombre };
  })
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb().from("diccionario_entradas").insert(data);
    if (error) {
      throw new Error(
        error.code === "23505"
          ? `Ya existe una entrada con el código ${data.codigo} en esa lista`
          : error.message,
      );
    }
    return { ok: true };
  });

export const updateDiccionario = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; codigo: string; nombre: string }) => {
    const codigo = String(input?.codigo ?? "").trim();
    const nombre = String(input?.nombre ?? "").trim();
    if (!codigo) throw new Error("El código es obligatorio");
    if (!nombre) throw new Error("El nombre es obligatorio");
    return { id: String(input.id), codigo, nombre };
  })
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb()
      .from("diccionario_entradas")
      .update({ codigo: data.codigo, nombre: data.nombre })
      .eq("id", data.id);
    if (error) {
      throw new Error(
        error.code === "23505"
          ? `Ya existe una entrada con el código ${data.codigo} en esa lista`
          : error.message,
      );
    }
    return { ok: true };
  });

/** Cuenta cuántos cargos usan un código antes de permitir eliminarlo. */
export const usosDiccionario = createServerFn({ method: "POST" })
  .inputValidator((input: { tipo: DiccionarioTipo; codigo: string }) => ({
    tipo: validarTipo(input?.tipo),
    codigo: String(input?.codigo ?? "").trim(),
  }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const columna =
      data.tipo === "AREA"
        ? "codigo_area"
        : data.tipo === "SUBAREA"
          ? "codigo_subarea"
          : "codigo_nivel_jerarquico";
    const { count, error } = await getDb()
      .from("cargos")
      .select("id", { count: "exact", head: true })
      .eq(columna, data.codigo);
    if (error) throw new Error(error.message);
    return { usos: count ?? 0 };
  });

export const deleteDiccionario = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb().from("diccionario_entradas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Agrega al diccionario las entradas que trae un archivo, sin pisar las existentes. */
export const importarDiccionario = createServerFn({ method: "POST" })
  .inputValidator((input: { entradas: { tipo: DiccionarioTipo; codigo: string; nombre: string }[] }) => {
    const entradas = (Array.isArray(input?.entradas) ? input.entradas : [])
      .map((e) => ({ tipo: validarTipo(e?.tipo), codigo: String(e?.codigo ?? "").trim(), nombre: String(e?.nombre ?? "").trim() }))
      .filter((e) => e.codigo && e.nombre);
    if (!entradas.length) throw new Error("El archivo no trae entradas de diccionario");
    return { entradas };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    const db = getDb();
    const existentes = unwrap(await db.from("diccionario_entradas").select("tipo, codigo, nombre")) ?? [];
    const mapa = new Map(existentes.map((e) => [`${e.tipo}|${e.codigo}`, e.nombre]));
    const nuevas: typeof data.entradas = [];
    const conflictos: string[] = [];
    for (const e of data.entradas) {
      const actual = mapa.get(`${e.tipo}|${e.codigo}`);
      if (actual === undefined) {
        if (!nuevas.some((n) => n.tipo === e.tipo && n.codigo === e.codigo)) nuevas.push(e);
        continue;
      }
      if (actual.trim().toLowerCase() !== e.nombre.trim().toLowerCase()) {
        conflictos.push(`${e.tipo} ${e.codigo}: el diccionario dice «${actual}» y el archivo «${e.nombre}»`);
      }
    }
    if (nuevas.length) {
      const { error } = await db.from("diccionario_entradas").insert(nuevas);
      if (error) throw new Error(error.message);
    }
    return { agregadas: nuevas.length, conflictos };
  });
