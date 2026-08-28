import { createServerFn } from "@tanstack/react-start";

export type EmpresaTipo = "P" | "M" | "G";

export type Empresa = {
  id: string;
  nombre: string;
  tipo: EmpresaTipo;
};

export const listEmpresas = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb, unwrap } = await import("./supabase-public.server");
  return unwrap(await getDb().from("empresas").select("id, nombre, tipo").order("nombre"));
});

export const createEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input: { nombre: string; tipo: EmpresaTipo }) => {
    const nombre = String(input?.nombre ?? "").trim();
    if (!nombre) throw new Error("El nombre es obligatorio");
    if (!["P", "M", "G"].includes(input?.tipo)) throw new Error("Tipo inválido");
    return { nombre, tipo: input.tipo };
  })
  .handler(async ({ data }) => {
    const { getDb, unwrap } = await import("./supabase-public.server");
    return unwrap(await getDb().from("empresas").insert(data).select("id").single());
  });

export const deleteEmpresa = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }) => {
    const { getDb } = await import("./supabase-public.server");
    const { error } = await getDb().from("empresas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
