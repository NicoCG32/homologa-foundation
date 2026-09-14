import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  TIPOS_DICCIONARIO,
  createDiccionario,
  deleteDiccionario,
  listDiccionario,
  updateDiccionario,
  usosDiccionario,
  type DiccionarioTipo,
} from "@/lib/diccionario.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/diccionario")({
  head: () => ({
    meta: [
      { title: "Diccionario — Espejo: Homologa" },
      { name: "description", content: "Áreas, subáreas y niveles jerárquicos usados al cargar cargos." },
      { property: "og:title", content: "Diccionario — Espejo: Homologa" },
      { property: "og:description", content: "Listas de áreas, subáreas y niveles jerárquicos editables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DiccionarioPage,
});

function DiccionarioPage() {
  const qc = useQueryClient();
  const list = useServerFn(listDiccionario);
  const crear = useServerFn(createDiccionario);
  const actualizar = useServerFn(updateDiccionario);
  const usos = useServerFn(usosDiccionario);
  const borrar = useServerFn(deleteDiccionario);

  const entradas = useQuery({ queryKey: ["diccionario"], queryFn: () => list() });
  const [error, setError] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState<Record<string, { codigo: string; nombre: string }>>({});
  const [edicion, setEdicion] = useState<Record<string, { codigo: string; nombre: string }>>({});

  const invalidate = () => qc.invalidateQueries({ queryKey: ["diccionario"] });

  const crearMut = useMutation({
    mutationFn: (v: { tipo: DiccionarioTipo; codigo: string; nombre: string }) => crear({ data: v }),
    onSuccess: (_d, v) => {
      setNuevo((p) => ({ ...p, [v.tipo]: { codigo: "", nombre: "" } }));
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const actualizarMut = useMutation({
    mutationFn: (v: { id: string; codigo: string; nombre: string }) => actualizar({ data: v }),
    onSuccess: (_d, v) => {
      setEdicion((p) => {
        const copia = { ...p };
        delete copia[v.id];
        return copia;
      });
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const borrarMut = useMutation({
    mutationFn: async (v: { id: string; tipo: DiccionarioTipo; codigo: string; nombre: string }) => {
      const { usos: cantidad } = await usos({ data: { tipo: v.tipo, codigo: v.codigo } });
      if (cantidad > 0) {
        const ok = window.confirm(
          `«${v.nombre}» (código ${v.codigo}) está en uso por ${cantidad} cargo(s). Si la eliminas, esos cargos conservan su código pero quedarán sin nombre en el diccionario. ¿Eliminar de todos modos?`,
        );
        if (!ok) return { ok: false };
      }
      return borrar({ data: { id: v.id } });
    },
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Diccionario</h1>
        <p className="text-sm text-muted-foreground">
          Estas listas traducen los códigos de las planillas a nombres. Puedes ajustarlas cuando
          quieras; los cargos ya cargados no se modifican.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {TIPOS_DICCIONARIO.map(({ tipo, etiqueta }) => {
        const filas = (entradas.data ?? []).filter((e) => e.tipo === tipo);
        const alta = nuevo[tipo] ?? { codigo: "", nombre: "" };
        return (
          <section key={tipo} className="rounded-lg border p-4">
            <h2 className="mb-3 text-lg font-semibold">{etiqueta}</h2>
            {entradas.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : !filas.length ? (
              <p className="text-sm text-muted-foreground">Sin entradas todavía.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="border-b py-2 w-24">Código</th>
                    <th className="border-b py-2">Nombre</th>
                    <th className="border-b py-2" />
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => {
                    const edit = edicion[f.id];
                    return (
                      <tr key={f.id}>
                        <td className="border-b py-2">
                          <input
                            className="w-20 rounded-md border bg-background px-2 py-1"
                            value={edit?.codigo ?? f.codigo}
                            onChange={(e) =>
                              setEdicion((p) => ({
                                ...p,
                                [f.id]: { codigo: e.target.value, nombre: p[f.id]?.nombre ?? f.nombre },
                              }))
                            }
                          />
                        </td>
                        <td className="border-b py-2">
                          <input
                            className="w-full rounded-md border bg-background px-2 py-1"
                            value={edit?.nombre ?? f.nombre}
                            onChange={(e) =>
                              setEdicion((p) => ({
                                ...p,
                                [f.id]: { codigo: p[f.id]?.codigo ?? f.codigo, nombre: e.target.value },
                              }))
                            }
                          />
                        </td>
                        <td className="border-b py-2 text-right whitespace-nowrap">
                          {edit && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => actualizarMut.mutate({ id: f.id, ...edit })}
                            >
                              Guardar
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => borrarMut.mutate({ id: f.id, tipo, codigo: f.codigo, nombre: f.nombre })}
                          >
                            Eliminar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                crearMut.mutate({ tipo, codigo: alta.codigo, nombre: alta.nombre });
              }}
            >
              <input
                className="w-24 rounded-md border bg-background px-2 py-1 text-sm"
                placeholder="Código"
                value={alta.codigo}
                onChange={(e) => setNuevo((p) => ({ ...p, [tipo]: { ...alta, codigo: e.target.value } }))}
                required
              />
              <input
                className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                placeholder="Nombre"
                value={alta.nombre}
                onChange={(e) => setNuevo((p) => ({ ...p, [tipo]: { ...alta, nombre: e.target.value } }))}
                required
              />
              <Button type="submit" disabled={crearMut.isPending}>
                Agregar
              </Button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
