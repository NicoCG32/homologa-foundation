import { createServerFn } from "@tanstack/react-start";

/** Ponderación por defecto del score final: 70% motor determinístico, 30% IA. */
export const PESOS_SCORE_DEFECTO = { motor: 70, ia: 30 };

export type PesosScore = { motor: number; ia: number };

export const getPesosScore = createServerFn({ method: "GET" }).handler(async (): Promise<PesosScore> => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  const fila = unwrap(
    await getDb().from("configuracion").select("valor").eq("clave", "pesos_score").maybeSingle(),
  );
  const valor = (fila?.valor ?? null) as { motor?: number; ia?: number } | null;
  const motor = Number(valor?.motor);
  const ia = Number(valor?.ia);
  if (!Number.isFinite(motor) || !Number.isFinite(ia) || Math.round(motor + ia) !== 100) {
    return { ...PESOS_SCORE_DEFECTO };
  }
  return { motor, ia };
});

export const setPesosScore = createServerFn({ method: "POST" })
  .inputValidator((input: { motor: number; ia: number }) => {
    const motor = Math.round(Number(input?.motor));
    const ia = Math.round(Number(input?.ia));
    if (!Number.isFinite(motor) || !Number.isFinite(ia) || motor < 0 || ia < 0)
      throw new Error("Las ponderaciones deben ser números positivos");
    if (motor + ia !== 100) throw new Error("La ponderación del motor y de la IA debe sumar 100%");
    return { motor, ia };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    unwrap(
      await getDb()
        .from("configuracion")
        .upsert({ clave: "pesos_score", valor: data }, { onConflict: "clave" })
        .select("clave")
        .single(),
    );
    return data;
  });
