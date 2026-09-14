import { createServerFn } from "@tanstack/react-start";

/**
 * Herramienta de fase de pruebas: vacía los datos operativos.
 * No toca el diccionario ni los criterios configurados.
 */
export const limpiarDatos = createServerFn({ method: "POST" })
  .inputValidator((input: { confirmacion: string }) => {
    if (String(input?.confirmacion ?? "").trim().toUpperCase() !== "ELIMINAR") {
      throw new Error('Debes escribir ELIMINAR para confirmar');
    }
    return { ok: true as const };
  })
  .handler(async () => {
    const { getDb } = await import("./supabase-public.server");
    const db = getDb();
    const tablas = [
      "resultados",
      "analisis_semanticos",
      "ejecuciones",
      "bandas_salariales",
      "cargos",
      "empresas",
    ] as const;
    for (const tabla of tablas) {
      const { error } = await db.from(tabla).delete().not("id", "is", null);
      if (error) throw new Error(`No se pudo limpiar ${tabla}: ${error.message}`);
    }
    return { ok: true };
  });
