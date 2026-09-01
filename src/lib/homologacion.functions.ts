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
          "id, candidato_id, score_deterministico, score_semantico, score_final, cargos:candidato_id(id, nombre, sueldo, empresas(nombre))",
        )
        .eq("ejecucion_id", data.id)
        .order("score_final", { ascending: false, nullsFirst: false }),
    );
    const analisis = unwrap(
      await getDb()
        .from("analisis_semanticos")
        .select("id, modelo, prompt_version, estado, error_mensaje, respuesta_validada, created_at")
        .eq("ejecucion_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
    return { ejecucion, resultados, analisis };
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

/**
 * Ejecuta el motor determinístico para un cargo interno:
 * crea la ejecución, evalúa los cargos de referencia con los criterios
 * almacenados y guarda los candidatos preseleccionados con su score.
 */
export const ejecutarHomologacion = createServerFn({ method: "POST" })
  .inputValidator((input: { cargo_id: string }) => {
    if (!input?.cargo_id) throw new Error("Debes seleccionar un cargo interno");
    return { cargo_id: String(input.cargo_id) };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    const { ejecutarMotor } = await import("./motor.server");
    type CargoRow = {
      id: string;
      tipo: string;
      nombre: string;
      descripcion: string | null;
      sueldo: number | null;
      empresas: { nombre: string; tipo: "P" | "M" | "G" } | null;
    };
    const toMotor = (c: CargoRow) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      sueldo: c.sueldo === null ? null : Number(c.sueldo),
      empresa_nombre: c.empresas?.nombre ?? null,
      empresa_tipo: c.empresas?.tipo ?? null,
    });

    const db = getDb();
    const select = "id, tipo, nombre, descripcion, sueldo, empresas(nombre, tipo)";

    const interno = unwrap(
      await db.from("cargos").select(select).eq("id", data.cargo_id).maybeSingle(),
    ) as CargoRow | null;
    if (!interno) throw new Error("El cargo no existe");
    if (interno.tipo !== "INTERNO") throw new Error("La homologación sólo aplica a cargos internos");

    const referencias = (unwrap(
      await db.from("cargos").select(select).eq("tipo", "REFERENCIA").order("nombre"),
    ) ?? []) as CargoRow[];

    const criterios =
      unwrap(await db.from("criterios").select("id, nombre, peso, activo, campo, obligatorio")) ??
      [];

    const ejecucion = unwrap(
      await db
        .from("ejecuciones")
        .insert({ cargo_id: interno.id, estado: "EN_PROCESO" })
        .select("id")
        .single(),
    );
    if (!ejecucion) throw new Error("No se pudo crear la ejecución");

    try {
      const motor = ejecutarMotor(
        toMotor(interno),
        referencias.filter((c) => c.id !== interno.id).map(toMotor),
        criterios.map((c) => ({ ...c, peso: Number(c.peso) })),
      );

      await db.from("resultados").delete().eq("ejecucion_id", ejecucion.id);

      if (motor.preseleccionados.length) {
        const { error } = await db.from("resultados").insert(
          motor.preseleccionados.map((p) => ({
            ejecucion_id: ejecucion.id,
            candidato_id: p.cargo.id,
            score_deterministico: p.score,
            score_final: p.score,
          })),
        );
        if (error) throw new Error(error.message);
      }

      await db.from("ejecuciones").update({ estado: "COMPLETADA" }).eq("id", ejecucion.id);

      return { ejecucion_id: ejecucion.id, cargo: toMotor(interno), ...motor };
    } catch (e) {
      await db.from("ejecuciones").update({ estado: "ERROR" }).eq("id", ejecucion.id);
      throw e instanceof Error ? e : new Error("Error al ejecutar el motor");
    }
  });

/**
 * Analiza semánticamente (Gemini Flash) SOLO los candidatos preseleccionados
 * y persistidos por el motor determinístico para esa ejecución.
 * Nunca envía descartados, ni la base completa, ni información salarial.
 * Ante cualquier fallo conserva intactos los resultados determinísticos.
 */
export const analizarSemantica = createServerFn({ method: "POST" })
  .inputValidator((input: { ejecucion_id: string }) => {
    if (!input?.ejecucion_id) throw new Error("Falta la ejecución");
    return { ejecucion_id: String(input.ejecucion_id) };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    const semantica = await import("./semantica.server");
    const db = getDb();

    type EmpresaRow = { tipo: "P" | "M" | "G" } | null;
    type CargoRow = {
      id: string;
      nombre: string;
      descripcion: string | null;
      empresas: EmpresaRow;
    };

    const ejecucion = unwrap(
      await db
        .from("ejecuciones")
        .select("id, cargos(id, nombre, descripcion, empresas(tipo))")
        .eq("id", data.ejecucion_id)
        .maybeSingle(),
    ) as { id: string; cargos: CargoRow | null } | null;
    if (!ejecucion?.cargos) throw new Error("La ejecución no existe");

    const interno = {
      id: ejecucion.cargos.id,
      nombre: ejecucion.cargos.nombre,
      descripcion: ejecucion.cargos.descripcion,
      tipo_empresa: ejecucion.cargos.empresas?.tipo ?? null,
    };

    // Fuente única de candidatos: los resultados preseleccionados por el motor.
    const resultados = (unwrap(
      await db
        .from("resultados")
        .select("id, candidato_id, cargos:candidato_id(id, nombre, descripcion, empresas(tipo))")
        .eq("ejecucion_id", data.ejecucion_id),
    ) ?? []) as { id: string; candidato_id: string; cargos: CargoRow | null }[];

    const candidatos = resultados
      .filter((r) => r.cargos)
      .map((r) => ({
        id: r.cargos!.id,
        nombre: r.cargos!.nombre,
        descripcion: r.cargos!.descripcion,
        tipo_empresa: r.cargos!.empresas?.tipo ?? null,
      }));

    const registrarError = async (mensaje: string) => {
      await db.from("analisis_semanticos").insert({
        ejecucion_id: data.ejecucion_id,
        modelo: semantica.MODELO_SEMANTICO,
        prompt_version: semantica.PROMPT_VERSION,
        estado: "ERROR",
        error_mensaje: mensaje,
        candidatos_enviados: candidatos.map((c) => c.id),
      });
      return { ok: false as const, error: mensaje };
    };

    if (!candidatos.length) {
      return registrarError("No hay candidatos preseleccionados para analizar");
    }

    let resultado: Awaited<ReturnType<typeof semantica.analizarConGemini>>;
    try {
      resultado = await semantica.analizarConGemini(interno, candidatos);
    } catch (e) {
      return registrarError(
        e instanceof Error ? e.message : "El análisis semántico no pudo ejecutarse",
      );
    }

    const validada = resultado.validada;

    await db.from("analisis_semanticos").insert({
      ejecucion_id: data.ejecucion_id,
      modelo: semantica.MODELO_SEMANTICO,
      prompt_version: semantica.PROMPT_VERSION,
      estado: "OK",
      candidatos_enviados: candidatos.map((c) => c.id),
      respuesta_cruda: resultado.cruda,
      respuesta_validada: validada,
    });

    // Solo se escribe score_semantico; score_deterministico y score_final quedan intactos.
    for (const s of validada.scores_por_candidato) {
      const fila = resultados.find((r) => r.candidato_id === s.candidato_id);
      if (!fila) continue;
      await db
        .from("resultados")
        .update({ score_semantico: s.score_semantico })
        .eq("id", fila.id);
    }

    return { ok: true as const, analisis: validada, candidatos };
  });
