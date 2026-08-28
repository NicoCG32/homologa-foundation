import { createServerFn } from "@tanstack/react-start";

export const listEjecuciones = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return unwrap(
    await getDb()
      .from("ejecuciones")
      .select("id, fecha, estado, cargos(id, nombre, sueldo, empresas(nombre))")
      .order("fecha", { ascending: false }),
  );
});

export const getEjecucion = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    const ejecucion = unwrap(
      await getDb()
        .from("ejecuciones")
        .select("id, fecha, estado, cargos(id, nombre, descripcion, sueldo, empresas(nombre))")
        .eq("id", data.id)
        .maybeSingle(),
    );
    const resultados = unwrap(
      await getDb()
        .from("resultados")
        .select(
          "id, score_deterministico, score_semantico, score_final, cargos:candidato_id(id, nombre, sueldo, empresas(nombre))",
        )
        .eq("ejecucion_id", data.id)
        .order("score_final", { ascending: false, nullsFirst: false }),
    );
    return { ejecucion, resultados };
  });

export const createEjecucion = createServerFn({ method: "POST" })
  .inputValidator((input: { cargo_id: string }) => {
    if (!input?.cargo_id) throw new Error("Debes seleccionar un cargo interno");
    return { cargo_id: String(input.cargo_id) };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    const cargo = unwrap(
      await getDb().from("cargos").select("id, tipo").eq("id", data.cargo_id).maybeSingle(),
    );
    if (!cargo) throw new Error("El cargo no existe");
    if (cargo.tipo !== "INTERNO") throw new Error("La ejecución sólo aplica a cargos internos");
    return unwrap(
      await getDb()
        .from("ejecuciones")
        .insert({ cargo_id: data.cargo_id, estado: "PENDIENTE" })
        .select("id")
        .single(),
    );
  });
