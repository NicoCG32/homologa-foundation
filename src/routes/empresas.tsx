import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import {
  createEmpresa,
  deleteEmpresa,
  listEmpresas,
  setEmpresaTamano,
  type EmpresaTipo,
} from "@/lib/empresas.functions";
import { TIPOS_EMPRESA } from "@/lib/format";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — Espejo: Homologa" },
      { name: "description", content: "Registro de empresas y su tamaño (pequeña, mediana, grande)." },
      { property: "og:title", content: "Empresas — Espejo: Homologa" },
      { property: "og:description", content: "Registro de empresas para la homologación de cargos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmpresasPage,
});

function EmpresasPage() {
  const qc = useQueryClient();
  const list = useServerFn(listEmpresas);
  const create = useServerFn(createEmpresa);
  const setTamano = useServerFn(setEmpresaTamano);
  const remove = useServerFn(deleteEmpresa);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<EmpresaTipo>("P");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["empresas"], queryFn: () => list() });

  const invalidate = () => qc.invalidateQueries();

  const createMut = useMutation({
    mutationFn: () => create({ data: { nombre, tipo } }),
    onSuccess: () => {
      setNombre("");
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const tamanoMut = useMutation({
    mutationFn: (v: { id: string; tamano: EmpresaTipo | "" }) => setTamano({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  const sinTamano = (data ?? []).filter((e) => !e.tamano).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Empresas</h1>

      {sinTamano > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-amber-400/60 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Hay {sinTamano} empresa(s) sin tamaño definido. Mientras no lo indiques, quedan fuera de
            las comparaciones que dependen del tamaño (bandas por pequeña, mediana o grande).
          </span>
        </p>
      )}

      <form
        className="flex flex-wrap items-end gap-3 rounded-lg border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-muted-foreground">Nombre</span>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Tamaño</span>
          <select
            className="rounded-md border bg-background px-3 py-2"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as EmpresaTipo)}
          >
            {Object.entries(TIPOS_EMPRESA).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={createMut.isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          Agregar
        </button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">Aún no hay empresas registradas.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="border-b py-2">Nombre</th>
              <th className="border-b py-2">Tamaño</th>
              <th className="border-b py-2" />
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id}>
                <td className="border-b py-2">
                  <span className="inline-flex items-center gap-2">
                    {!e.tamano && (
                      <AlertTriangle
                        aria-label="Falta definir el tamaño"
                        className="size-4 text-amber-600"
                      />
                    )}
                    {e.nombre}
                  </span>
                </td>
                <td className="border-b py-2">
                  <select
                    className="rounded-md border bg-background px-2 py-1"
                    value={e.tamano ?? ""}
                    onChange={(ev) =>
                      tamanoMut.mutate({ id: e.id, tamano: ev.target.value as EmpresaTipo | "" })
                    }
                  >
                    <option value="">Definir tamaño…</option>
                    {Object.entries(TIPOS_EMPRESA).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border-b py-2 text-right">
                  <button
                    className="text-destructive hover:underline"
                    onClick={() => deleteMut.mutate(e.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
