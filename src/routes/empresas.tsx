import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  createEmpresa,
  deleteEmpresa,
  listEmpresas,
  type EmpresaTipo,
} from "@/lib/empresas.functions";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Empresas — HOMOLOGA" },
      { name: "description", content: "Registro de empresas y su tamaño (pequeña, mediana, grande)." },
      { property: "og:title", content: "Empresas — HOMOLOGA" },
      { property: "og:description", content: "Registro de empresas para la homologación de cargos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmpresasPage,
});

export const TIPOS: Record<EmpresaTipo, string> = {
  P: "Pequeña",
  M: "Mediana",
  G: "Grande",
};

function EmpresasPage() {
  const qc = useQueryClient();
  const list = useServerFn(listEmpresas);
  const create = useServerFn(createEmpresa);
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

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Empresas</h1>

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
          <span className="mb-1 block text-muted-foreground">Tipo</span>
          <select
            className="rounded-md border bg-background px-3 py-2"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as EmpresaTipo)}
          >
            {Object.entries(TIPOS).map(([k, v]) => (
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
              <th className="border-b py-2">Tipo</th>
              <th className="border-b py-2" />
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id}>
                <td className="border-b py-2">{e.nombre}</td>
                <td className="border-b py-2">{TIPOS[e.tipo as EmpresaTipo]}</td>
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
