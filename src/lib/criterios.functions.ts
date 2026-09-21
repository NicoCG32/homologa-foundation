import { createServerFn } from "@tanstack/react-start";

export type CriterioCampo =
  | "nombre"
  | "descripcion"
  | "area"
  | "subarea"
  | "codigo_cargo"
  | "nivel_jerarquico"
  | "experiencia"
  | "requisitos";

export const CAMPOS_CRITERIO: Record<CriterioCampo, string> = {
  nombre: "Nombre del cargo",
  descripcion: "Descripción",
  area: "Área",
  subarea: "Subárea",
  codigo_cargo: "Código del cargo",
  nivel_jerarquico: "Nivel jerárquico",
  experiencia: "Experiencia requerida",
  requisitos: "Requisitos / formación",
};


export type Criterio = {
  id: string;
  nombre: string;
  peso: number;
  activo: boolean;
  campo: CriterioCampo;
  obligatorio: boolean;
};

export const listCriterios = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return unwrap(
    await getDb()
      .from("criterios")
      .select("id, nombre, peso, activo, campo, obligatorio")
      .order("nombre"),
  );
});

/**
 * Garantiza que exista exactamente un criterio por columna comparable.
 * Los pesos se reparten como porcentaje, por eso no se crean criterios sueltos.
 */
export const asegurarCriterios = createServerFn({ method: "POST" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  const db = getDb();
  const existentes =
    unwrap(await db.from("criterios").select("id, campo, peso, activo")) ?? [];
  const campos = Object.keys(CAMPOS_CRITERIO) as CriterioCampo[];
  const faltantes = campos.filter((c) => !existentes.some((e) => e.campo === c));
  if (faltantes.length) {
    const { error } = await db.from("criterios").insert(
      faltantes.map((campo) => ({
        campo,
        nombre: CAMPOS_CRITERIO[campo],
        peso: 0,
        activo: false,
        obligatorio: false,
      })),
    );
    if (error) throw new Error(error.message);
  }
  return { creados: faltantes.length };
});

/** Guarda de una sola vez la ponderación (en %) de todas las columnas. */
export const guardarPesos = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { pesos: { id: string; peso: number; obligatorio?: boolean }[] }) => {
      const pesos = (Array.isArray(input?.pesos) ? input.pesos : []).map((p) => {
        const peso = Number(p?.peso);
        if (!Number.isFinite(peso) || peso < 0) throw new Error("Ponderación inválida");
        return { id: String(p.id), peso, obligatorio: Boolean(p?.obligatorio) };
      });
      if (!pesos.length) throw new Error("No hay ponderaciones que guardar");
      return { pesos };
    },
  )
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const db = getDb();
    for (const p of data.pesos) {
      const { error } = await db
        .from("criterios")
        .update({ peso: p.peso, activo: p.peso > 0, obligatorio: p.obligatorio })
        .eq("id", p.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export type PresetPesos = { id: string; nombre: string; pesos: Record<string, number> };

export const listPresets = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return (
    unwrap(await getDb().from("presets_pesos").select("id, nombre, pesos").order("nombre")) ?? []
  );
});

/** Guarda (o reemplaza) una configuración de pesos con nombre, clavada por columna. */
export const savePreset = createServerFn({ method: "POST" })
  .inputValidator((input: { nombre: string; pesos: Record<string, number> }) => {
    const nombre = String(input?.nombre ?? "").trim();
    if (!nombre) throw new Error("Ponle un nombre a la configuración");
    const pesos: Record<string, number> = {};
    for (const [campo, valor] of Object.entries(input?.pesos ?? {})) {
      if (!Object.prototype.hasOwnProperty.call(CAMPOS_CRITERIO, campo)) continue;
      const n = Number(valor);
      pesos[campo] = Number.isFinite(n) && n > 0 ? n : 0;
    }
    return { nombre, pesos };
  })
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb()
      .from("presets_pesos")
      .upsert({ nombre: data.nombre, pesos: data.pesos }, { onConflict: "nombre" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePreset = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb().from("presets_pesos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createCriterio = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      nombre: string;
      peso: string | number;
      activo: boolean;
      campo: CriterioCampo;
      obligatorio: boolean;
    }) => {
      const nombre = String(input?.nombre ?? "").trim();
      if (!nombre) throw new Error("El nombre es obligatorio");
      const peso = Number(input?.peso);
      if (!Number.isFinite(peso) || peso < 0) throw new Error("Peso inválido");
      const campo = input?.campo;
      if (!Object.prototype.hasOwnProperty.call(CAMPOS_CRITERIO, campo)) {
        throw new Error("Campo comparado inválido");
      }
      return {
        nombre,
        peso,
        activo: Boolean(input?.activo),
        campo,
        obligatorio: Boolean(input?.obligatorio),
      };
    },
  )
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    return unwrap(await getDb().from("criterios").insert(data).select("id").single());
  });

export const toggleCriterio = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; activo: boolean }) => ({
    id: String(input.id),
    activo: Boolean(input.activo),
  }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb()
      .from("criterios")
      .update({ activo: data.activo })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleObligatorio = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; obligatorio: boolean }) => ({
    id: String(input.id),
    obligatorio: Boolean(input.obligatorio),
  }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb()
      .from("criterios")
      .update({ obligatorio: data.obligatorio })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCriterio = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb().from("criterios").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
