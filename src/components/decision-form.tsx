import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { guardarDecision } from "@/lib/homologacion.functions";
import { Button } from "@/components/ui/button";

export type CandidatoDecision = {
  id: string;
  nombre: string;
  empresa?: string | null;
};

/**
 * Selección del analista: confirma un único cargo de referencia.
 * No modifica ningún score; sólo deja constancia de la decisión.
 */
export function DecisionForm({
  ejecucionId,
  candidatos,
  sugerido,
  onSaved,
}: {
  ejecucionId: string;
  candidatos: CandidatoDecision[];
  sugerido?: string | null;
  onSaved?: () => void;
}) {
  const guardar = useServerFn(guardarDecision);
  const qc = useQueryClient();
  const [candidatoId, setCandidatoId] = useState(sugerido ?? "");
  const [usuario, setUsuario] = useState("");
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      guardar({ data: { ejecucion_id: ejecucionId, candidato_id: candidatoId, usuario, comentario } }),
    onMutate: () => setError(null),
    onSuccess: () => {
      setListo(true);
      qc.invalidateQueries({ queryKey: ["ejecucion", ejecucionId] });
      onSaved?.();
    },
    onError: (e: Error) => setError(e.message),
  });

  if (!candidatos.length)
    return (
      <p className="text-sm text-muted-foreground">
        No hay candidatos para confirmar en esta homologación.
      </p>
    );

  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate();
      }}
    >
      <label className="block">
        <span>Cargo de referencia homologado</span>
        <select
          className="mt-1 w-full rounded-md border bg-background p-2"
          value={candidatoId}
          onChange={(e) => setCandidatoId(e.target.value)}
          required
        >
          <option value="">Selecciona…</option>
          {candidatos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
              {c.empresa ? ` — ${c.empresa}` : ""}
              {c.id === sugerido ? " (sugerido por la IA)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span>Analista que confirma</span>
        <input
          className="mt-1 w-full rounded-md border bg-background p-2"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          placeholder="Nombre y apellido"
          required
        />
      </label>

      <label className="block">
        <span>Comentario (opcional)</span>
        <textarea
          className="mt-1 w-full rounded-md border bg-background p-2"
          rows={3}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Fundamento de la decisión"
        />
      </label>

      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? "Guardando…" : "Confirmar homologación"}
      </Button>
      {error && <p className="text-destructive">{error}</p>}
      {listo && !error && (
        <p className="text-muted-foreground">Decisión registrada. Ya puedes ver la comparación salarial.</p>
      )}
    </form>
  );
}
