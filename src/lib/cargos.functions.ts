import { createServerFn } from "@tanstack/react-start";

export type CargoTipo = "INTERNO" | "REFERENCIA";

export type Cargo = {
  id: string;
  empresa_id: string;
  tipo: CargoTipo;
  nombre: string;
  descripcion: string | null;
  sueldo: number | null;
  empresas?: { nombre: string } | null;
};

export const listCargos = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return unwrap(
    await getDb()
      .from("cargos")
      .select("id, empresa_id, tipo, nombre, descripcion, sueldo, empresas(nombre)")
      .order("nombre"),
  );
});

export const createCargo = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      empresa_id: string;
      tipo: CargoTipo;
      nombre: string;
      descripcion: string;
      sueldo: string | number | null;
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
