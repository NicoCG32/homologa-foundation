import { createServerFn } from "@tanstack/react-start";
import type { EntradaNorm, FichaNorm } from "./normalizacion.server";
import type { Json } from "@/integrations/supabase/types";


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
        .select("id, fecha, estado, criterios_usados, cargos(id, nombre, descripcion, sueldo, empresas(nombre))")
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
    const decision = unwrap(
      await getDb()
        .from("decisiones")
        .select(
          "id, candidato_id, decision, comentario, usuario, fecha, scores_utilizados, cargos:candidato_id(id, nombre, empresas(nombre))",
        )
        .eq("ejecucion_id", data.id)
        .maybeSingle(),
    );
    const candidatoIds = (resultados ?? []).map((r) => r.candidato_id);
    const bandas = candidatoIds.length
      ? unwrap(
          await getDb()
            .from("bandas_salariales")
            .select("cargo_id, tipo_empresa, p25, p50, p75, promedio")
            .in("cargo_id", candidatoIds),
        )
      : [];
    return { ejecucion, resultados, analisis, bandas };
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
  .inputValidator((input: { cargo_id: string; pesos: { id: string; peso: number }[] }) => {
    if (!input?.cargo_id) throw new Error("Debes seleccionar un cargo interno");
    const pesos = Array.isArray(input.pesos) ? input.pesos.map((p) => ({ id: String(p.id), peso: Number(p.peso) })) : [];
    if (pesos.some((p) => !Number.isFinite(p.peso) || p.peso < 0) || !pesos.some((p) => p.peso > 0)) throw new Error("Define al menos un peso mayor que cero");
    return { cargo_id: String(input.cargo_id), pesos };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    const { ejecutarMotor } = await import("./motor.server");
    const norm = await import("./normalizacion.server");
    type CargoRow = {
      id: string;
      tipo: string;
      nombre: string;
      descripcion: string | null;
      codigo_area: string | null;
      nombre_area: string | null;
      codigo_subarea: string | null;
      nombre_subarea: string | null;
      codigo_cargo: string | null;
      nivel_jerarquico: string | null;
      experiencia_requerida: string | null;
      requisitos_formacion: string | null;
      atributos_semanticos: unknown;
      empresas: { nombre: string } | null;
    };

    const db = getDb();
    const select =
      "id, tipo, nombre, descripcion, codigo_area, nombre_area, codigo_subarea, nombre_subarea, codigo_cargo, nivel_jerarquico, experiencia_requerida, requisitos_formacion, atributos_semanticos, empresas(nombre)";

    const interno = unwrap(
      await db.from("cargos").select(select).eq("id", data.cargo_id).maybeSingle(),
    ) as CargoRow | null;
    if (!interno) throw new Error("El cargo no existe");
    if (interno.tipo !== "INTERNO") throw new Error("La homologación sólo aplica a cargos internos");

    const referencias = (unwrap(
      await db.from("cargos").select(select).eq("tipo", "REFERENCIA").order("nombre"),
    ) ?? []) as CargoRow[];

    // Normalización previa de experiencia y formación: solo traduce el texto a una
    // ficha estructurada y se guarda junto al cargo para no repetir llamadas.
    const todos = [interno, ...referencias.filter((c) => c.id !== interno.id)];
    const fichas = new Map<string, FichaNorm>();
    const pendientes: EntradaNorm[] = [];

    for (const c of todos) {
      const huella = norm.huellaTexto(c.experiencia_requerida, c.requisitos_formacion);
      const atributos = (c.atributos_semanticos ?? {}) as Record<string, unknown>;
      const vigente = norm.fichaVigente(atributos["_norm"], huella);
      if (vigente) fichas.set(c.id, vigente);
      else if ((c.experiencia_requerida ?? "").trim() || (c.requisitos_formacion ?? "").trim()) {
        pendientes.push({
          id: c.id,
          experiencia_requerida: c.experiencia_requerida,
          requisitos_formacion: c.requisitos_formacion,
        });
      }
    }

    let avisoNormalizacion: string | null = null;
    if (pendientes.length) {
      try {
        const nuevas = await norm.normalizarLote(pendientes);
        for (const [id, ficha] of nuevas) {
          fichas.set(id, ficha);
          const cargo = todos.find((c) => c.id === id);
          const atributos = { ...((cargo?.atributos_semanticos ?? {}) as Record<string, unknown>) };
          atributos["_norm"] = ficha;
          await db
            .from("cargos")
            .update({ atributos_semanticos: atributos as Json })
            .eq("id", id);

        }
      } catch (e) {
        avisoNormalizacion =
          e instanceof Error
            ? `${e.message}. Experiencia y formación se compararon con el texto original.`
            : "No fue posible normalizar experiencia y formación; se comparó el texto original.";
      }
    }

    // El sueldo y el tamaño de empresa no participan del motor determinístico.
    const toMotor = (c: CargoRow) => ({
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      codigo_area: c.codigo_area,
      nombre_area: c.nombre_area,
      codigo_subarea: c.codigo_subarea,
      nombre_subarea: c.nombre_subarea,
      codigo_cargo: c.codigo_cargo,
      nivel_jerarquico: c.nivel_jerarquico,
      experiencia_requerida: c.experiencia_requerida,
      requisitos_formacion: c.requisitos_formacion,
      experiencia_norm: fichas.get(c.id)?.experiencia ?? null,
      formacion_norm: fichas.get(c.id)?.formacion ?? null,
      empresa_nombre: c.empresas?.nombre ?? null,
    });

    const criteriosBase =
      (unwrap(await db.from("criterios").select("id, nombre, peso, activo, campo, obligatorio")) ??
        []).filter((c) => c.campo !== "tipo_empresa");
    const pesos = new Map(data.pesos.map((p) => [p.id, p.peso]));
    const criterios = criteriosBase.map((c) => {
      const peso = pesos.has(c.id) ? Number(pesos.get(c.id)) : Number(c.peso);
      // La ponderación de esta homologación manda: 0% equivale a no comparar la columna.
      return { ...c, peso, activo: pesos.has(c.id) ? peso > 0 : c.activo };
    });


    const ejecucion = unwrap(
      await db
        .from("ejecuciones")
        .insert({ cargo_id: interno.id, estado: "EN_PROCESO", criterios_usados: criterios })
        .select("id")
        .single(),
    );
    if (!ejecucion) throw new Error("No se pudo crear la ejecución");

    try {
      const motor = ejecutarMotor(
        toMotor(interno),
        referencias.filter((c) => c.id !== interno.id).map(toMotor),
        criterios.map((c) => ({ ...c, peso: Number(c.peso) })) as Parameters<
          typeof ejecutarMotor
        >[2],
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

      return {
        ejecucion_id: ejecucion.id,
        cargo: toMotor(interno),
        aviso_normalizacion: avisoNormalizacion,
        ...motor,
      };

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

    type CargoRow = {
      id: string;
      nombre: string;
      descripcion: string | null;
      atributos_semanticos: unknown;
      experiencia_requerida: string | null;
      requisitos_formacion: string | null;
    };

    // Gemini no recibe tamaño de empresa ni información salarial.
    const campos =
      "id, nombre, descripcion, atributos_semanticos, experiencia_requerida, requisitos_formacion";

    const ejecucion = unwrap(
      await db
        .from("ejecuciones")
        .select(`id, cargos(${campos})`)
        .eq("id", data.ejecucion_id)
        .maybeSingle(),
    ) as { id: string; cargos: CargoRow | null } | null;
    if (!ejecucion?.cargos) throw new Error("La ejecución no existe");

    const interno = {
      id: ejecucion.cargos.id,
      nombre: ejecucion.cargos.nombre,
      descripcion: ejecucion.cargos.descripcion,
      atributos_semanticos: semantica.normalizarAtributos(ejecucion.cargos.atributos_semanticos),
      experiencia_requerida: ejecucion.cargos.experiencia_requerida ?? "",
      requisitos_formacion: ejecucion.cargos.requisitos_formacion ?? "",
    };

    // Fuente única de candidatos: los resultados preseleccionados por el motor.
    const resultados = (unwrap(
      await db
        .from("resultados")
        .select(`id, candidato_id, cargos:candidato_id(${campos})`)
        .eq("ejecucion_id", data.ejecucion_id),
    ) ?? []) as { id: string; candidato_id: string; cargos: CargoRow | null }[];

    const candidatos = resultados
      .filter((r) => r.cargos)
      .map((r) => ({
        id: r.cargos!.id,
        nombre: r.cargos!.nombre,
        descripcion: r.cargos!.descripcion,
        atributos_semanticos: semantica.normalizarAtributos(r.cargos!.atributos_semanticos),
        experiencia_requerida: r.cargos!.experiencia_requerida ?? "",
        requisitos_formacion: r.cargos!.requisitos_formacion ?? "",
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
