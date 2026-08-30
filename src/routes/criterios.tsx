import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  CAMPOS_CRITERIO,
  createCriterio,
  deleteCriterio,
  listCriterios,
  toggleCriterio,
  toggleObligatorio,
  type CriterioCampo,
} from "@/lib/criterios.functions";

export const Route = createFileRoute("/criterios")({
  head: () => ({
    meta: [
      { title: "Criterios — HOMOLOGA" },
      { name: "description", content: "Criterios de comparación y sus pesos, definidos en la base de datos." },
      { property: "og:title", content: "Criterios — HOMOLOGA" },
      { property: "og:description", content: "Administra los criterios y pesos usados en la homologación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CriteriosPage,
});

function CriteriosPage() {
  const qc = useQueryClient();
  const list = useServerFn(listCriterios);
  const create = useServerFn(createCriterio);
  const toggle = useServerFn(toggleCriterio);
  const toggleObl = useServerFn(toggleObligatorio);
  const remove = useServerFn(deleteCriterio);

  const [nombre, setNombre] = useState("");
  const [peso, setPeso] = useState("1");
  const [campo, setCampo] = useState<CriterioCampo>("nombre");
  const [obligatorio, setObligatorio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["criterios"], queryFn: () => list() });
  const invalidate = () => qc.invalidateQueries();

  const createMut = useMutation({
    mutationFn: () => create({ data: { nombre, peso, activo: true, campo, obligatorio } }),
    onSuccess: () => {
      setNombre("");
      setObligatorio(false);
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; activo: boolean }) => toggle({ data: v }),
    onSuccess: invalidate,
  });

  const oblMut = useMutation({
    mutationFn: (v: { id: string; obligatorio: boolean }) => toggleObl({ data: v }),
    onSuccess: invalidate,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: invalidate,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Criterios</h1>
      <p className="text-sm text-muted-foreground">
        Los criterios y pesos se guardan en la base de datos; el motor los leerá desde aquí.
      </p>

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
          <span className="mb-1 block text-muted-foreground">Peso</span>
          <input
            type="number"
            step="0.001"
            min="0"
            className="w-28 rounded-md border bg-background px-3 py-2"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            required
          />
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
        <p className="text-sm text-muted-foreground">Aún no hay criterios definidos.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="border-b py-2">Nombre</th>
              <th className="border-b py-2">Peso</th>
              <th className="border-b py-2">Activo</th>
              <th className="border-b py-2" />
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id}>
                <td className="border-b py-2">{c.nombre}</td>
                <td className="border-b py-2">{c.peso}</td>
                <td className="border-b py-2">
                  <input
                    type="checkbox"
                    checked={c.activo}
                    onChange={() => toggleMut.mutate({ id: c.id, activo: !c.activo })}
                  />
                </td>
                <td className="border-b py-2 text-right">
                  <button
                    className="text-destructive hover:underline"
                    onClick={() => deleteMut.mutate(c.id)}
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
