import { createServerFn } from "@tanstack/react-start";

export type EmpresaTipo = "P" | "M" | "G";

export type Empresa = {
  id: string;
  nombre: string;
  tipo: EmpresaTipo;
  tamano: EmpresaTipo | null;
};

export const listEmpresas = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return unwrap(await getDb().from("empresas").select("id, nombre, tipo, tamano").order("nombre"));
});

export const createEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input: { nombre: string; tipo: EmpresaTipo | "" }) => {
    const nombre = String(input?.nombre ?? "").trim();
    if (!nombre) throw new Error("El nombre es obligatorio");
    const tamano = (["P", "M", "G"] as const).includes(input?.tipo as EmpresaTipo)
      ? (input.tipo as EmpresaTipo)
      : null;
    return { nombre, tipo: tamano ?? ("G" as EmpresaTipo), tamano };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    return unwrap(await getDb().from("empresas").insert(data).select("id").single());
  });

/** Define o corrige el tamaño de una empresa (requerido para comparar bandas por tamaño). */
export const setEmpresaTamano = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; tamano: EmpresaTipo | "" | null }) => {
    const tamano = (["P", "M", "G"] as const).includes(input?.tamano as EmpresaTipo)
      ? (input.tamano as EmpresaTipo)
      : null;
    return { id: String(input.id), tamano };
  })
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const valores: { tamano: EmpresaTipo | null; tipo?: EmpresaTipo } = { tamano: data.tamano };
    if (data.tamano) valores.tipo = data.tamano;
    const { error } = await getDb().from("empresas").update(valores).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb().from("empresas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
