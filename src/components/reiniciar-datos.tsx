import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { limpiarDatos } from "@/lib/mantenimiento.functions";
import { Button } from "@/components/ui/button";

/**
 * Herramienta secundaria de mantenimiento: borra empresas, cargos, bandas e
 * historial. Exige escribir ELIMINAR para evitar acciones accidentales.
 */
export function ReiniciarDatos() {
  const qc = useQueryClient();
  const limpiar = useServerFn(limpiarDatos);
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const limpiarMut = useMutation({
    mutationFn: () => limpiar({ data: { confirmacion } }),
    onSuccess: () => {
      setConfirmacion("");
      setAbierto(false);
      setError(null);
      qc.invalidateQueries();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <section className="danger-panel">
      <div className="danger-head">
        <AlertTriangle aria-hidden="true" />
        <div>
          <strong>Reiniciar todos los datos</strong>
          <small>Borra empresas, cargos, bandas e historial de homologaciones. El diccionario y los criterios se conservan.</small>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setAbierto((v) => !v)}>
          {abierto ? "Cancelar" : "Eliminar datos"}
        </Button>
      </div>
      {abierto && (
        <div className="danger-confirm">
          <p>Para confirmar, escribe <strong>ELIMINAR</strong>.</p>
          <input value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} placeholder="ELIMINAR" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={confirmacion.trim().toUpperCase() !== "ELIMINAR" || limpiarMut.isPending}
            onClick={() => limpiarMut.mutate()}
          >
            {limpiarMut.isPending ? "Eliminando…" : "Eliminar definitivamente"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </section>
  );
}
