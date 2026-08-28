import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { listCargos } from "@/lib/cargos.functions";
import { listCriterios } from "@/lib/criterios.functions";
import { createEjecucion } from "@/lib/homologacion.functions";

export const Route = createFileRoute("/homologacion/nueva")({
  head: () => ({
    meta: [
      { title: "Nueva homologación — HOMOLOGA" },
      { name: "description", content: "Crea una ejecución de homologación para un cargo interno." },
      { property: "og:title", content: "Nueva homologación — HOMOLOGA" },
      { property: "og:description", content: "Inicia una ejecución de homologación de un cargo interno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NuevaHomologacion,
});

function NuevaHomologacion() {
  const navigate = useNavigate();
  const listC = useServerFn(listCargos);
  const listCr = useServerFn(listCriterios);
  const create = useServerFn(createEjecucion);

  const cargos = useQuery({ queryKey: ["cargos"], queryFn: () => listC() });
  const criterios = useQuery({ queryKey: ["criterios"], queryFn: () => listCr() });

  const [cargoId, setCargoId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const internos = (cargos.data ?? []).filter((c) => c.tipo === "INTERNO");
  const activos = (criterios.data ?? []).filter((c) => c.activo);

  const mut = useMutation({
    mutationFn: () => create({ data: { cargo_id: cargoId } }),
    onSuccess: (res) => {
      if (res) navigate({ to: "/historial/$id", params: { id: res.id } });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Nueva homologación</h1>
      <p className="text-sm text-muted-foreground">
        Se crea una ejecución en estado pendiente. El cálculo determinístico y semántico se
        implementará en la siguiente etapa.
      </p>

      <form
        className="space-y-4 rounded-lg border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Cargo interno</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={cargoId}
            onChange={(e) => setCargoId(e.target.value)}
            required
          >
            <option value="">Selecciona…</option>
            {internos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} — {c.empresas?.nombre ?? "sin empresa"}
              </option>
            ))}
          </select>
        </label>

        <div className="text-sm">
          <span className="text-muted-foreground">Criterios activos: </span>
          {criterios.isLoading
            ? "…"
            : activos.length
              ? activos.map((c) => `${c.nombre} (${c.peso})`).join(", ")
              : "ninguno definido"}
        </div>

        <button
          type="submit"
          disabled={mut.isPending || !internos.length}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          Crear ejecución
        </button>
        {!cargos.isLoading && !internos.length && (
          <p className="text-sm text-muted-foreground">
            Necesitas al menos un cargo de tipo interno.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </div>
  );
}
