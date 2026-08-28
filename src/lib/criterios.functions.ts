import { createServerFn } from "@tanstack/react-start";

export type Criterio = {
  id: string;
  nombre: string;
  peso: number;
  activo: boolean;
};

export const listCriterios = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return unwrap(await getDb().from("criterios").select("id, nombre, peso, activo").order("nombre"));
});

export const createCriterio = createServerFn({ method: "POST" })
  .inputValidator((input: { nombre: string; peso: string | number; activo: boolean }) => {
    const nombre = String(input?.nombre ?? "").trim();
    if (!nombre) throw new Error("El nombre es obligatorio");
    const peso = Number(input?.peso);
    if (!Number.isFinite(peso) || peso < 0) throw new Error("Peso inválido");
    return { nombre, peso, activo: Boolean(input?.activo) };
  })
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

export const deleteCriterio = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb().from("criterios").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
