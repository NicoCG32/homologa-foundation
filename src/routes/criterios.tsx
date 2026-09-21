import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import {
  asegurarCriterios,
  guardarPesos,
  listCriterios,
} from "@/lib/criterios.functions";
import { PesosEditor, pesosIniciales, type MapaPesos } from "@/components/pesos-editor";
import { getPesosScore, setPesosScore } from "@/lib/configuracion.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/criterios")({
  head: () => ({
    meta: [
      { title: "Criterios — Espejo: Homologa" },
      { name: "description", content: "Ponderación por columna comparada y configuraciones guardadas." },
      { property: "og:title", content: "Criterios — Espejo: Homologa" },
      { property: "og:description", content: "Ajusta con deslizadores cuánto pesa cada columna en la comparación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CriteriosPage,
});

function CriteriosPage() {
  const qc = useQueryClient();
  const list = useServerFn(listCriterios);
  const asegurar = useServerFn(asegurarCriterios);
  const guardar = useServerFn(guardarPesos);

  const getHibrido = useServerFn(getPesosScore);
  const setHibrido = useServerFn(setPesosScore);

  const [pesos, setPesos] = useState<MapaPesos>({});
  const [pesoMotor, setPesoMotor] = useState(70);
  const [avisoHibrido, setAvisoHibrido] = useState<string | null>(null);
  const [obligatorios, setObligatorios] = useState<Record<string, boolean>>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["criterios"],
    queryFn: async () => {
      await asegurar();
      return list();
    },
  });

  const criterios = data ?? [];

  useEffect(() => {
    if (!criterios.length) return;
    setPesos((prev) => (Object.keys(prev).length ? prev : pesosIniciales(criterios)));
    setObligatorios((prev) =>
      Object.keys(prev).length
        ? prev
        : Object.fromEntries(criterios.map((c) => [c.id, c.obligatorio])),
    );
  }, [data]);

  const guardarMut = useMutation({
    mutationFn: () =>
      guardar({
        data: {
          pesos: criterios.map((c) => ({
            id: c.id,
            peso: pesos[c.id] ?? 0,
            obligatorio: obligatorios[c.id] ?? c.obligatorio,
          })),
        },
      }),
    onSuccess: () => {
      setAviso("Ponderación guardada.");
      qc.invalidateQueries({ queryKey: ["criterios"] });
    },
    onError: (e: Error) => setAviso(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Criterios</h1>
      <p className="text-sm text-muted-foreground">
        Cada columna comparada tiene una ponderación en porcentaje. Al mover un deslizador, el resto
        se reajusta para que el total siga siendo 100%. Una columna en 0% no se compara.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="rounded-lg border p-4">
          <PesosEditor
            criterios={criterios}
            pesos={pesos}
            onChange={setPesos}
            obligatorios={obligatorios}
            onToggleObligatorio={(id, valor) =>
              setObligatorios((p) => ({ ...p, [id]: valor }))
            }
          />
          <div className="mt-4">
            <Button type="button" disabled={guardarMut.isPending} onClick={() => guardarMut.mutate()}>
              {guardarMut.isPending ? "Guardando…" : "Guardar ponderación"}
            </Button>
          </div>
        </div>
      )}

      {aviso && <p className="text-sm text-muted-foreground">{aviso}</p>}
    </div>
  );
}
