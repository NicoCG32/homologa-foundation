import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  CAMPOS_CRITERIO,
  deletePreset,
  listPresets,
  savePreset,
  type Criterio,
} from "@/lib/criterios.functions";
import { Button } from "@/components/ui/button";

export type MapaPesos = Record<string, number>;

/** Reparte el resto entre las demás columnas para que el total siga siendo 100%. */
export function ajustarPesos(pesos: MapaPesos, id: string, valor: number): MapaPesos {
  const nuevo = Math.max(0, Math.min(100, Math.round(valor)));
  const otros = Object.keys(pesos).filter((k) => k !== id);
  if (!otros.length) return { [id]: 100 };
  const restante = 100 - nuevo;
  const sumaOtros = otros.reduce((a, k) => a + (pesos[k] ?? 0), 0);
  const salida: MapaPesos = { [id]: nuevo };
  let acumulado = 0;
  otros.forEach((k, i) => {
    const base = sumaOtros > 0 ? ((pesos[k] ?? 0) / sumaOtros) * restante : restante / otros.length;
    const v = i === otros.length - 1 ? restante - acumulado : Math.round(base);
    acumulado += v;
    salida[k] = Math.max(0, v);
  });
  return salida;
}

export function pesosIniciales(criterios: Criterio[]): MapaPesos {
  const total = criterios.reduce((a, c) => a + Number(c.peso), 0);
  if (total <= 0) {
    const base = criterios.length ? Math.floor(100 / criterios.length) : 0;
    const out: MapaPesos = {};
    criterios.forEach((c, i) => {
      out[c.id] = i === criterios.length - 1 ? 100 - base * (criterios.length - 1) : base;
    });
    return out;
  }
  const out: MapaPesos = {};
  let acumulado = 0;
  criterios.forEach((c, i) => {
    const v =
      i === criterios.length - 1
        ? 100 - acumulado
        : Math.round((Number(c.peso) / total) * 100);
    acumulado += v;
    out[c.id] = Math.max(0, v);
  });
  return out;
}

type Props = {
  criterios: Criterio[];
  pesos: MapaPesos;
  onChange: (p: MapaPesos) => void;
  obligatorios?: Record<string, boolean>;
  onToggleObligatorio?: (id: string, valor: boolean) => void;
};

export function PesosEditor({
  criterios,
  pesos,
  onChange,
  obligatorios,
  onToggleObligatorio,
}: Props) {
  const qc = useQueryClient();
  const listP = useServerFn(listPresets);
  const guardarP = useServerFn(savePreset);
  const borrarP = useServerFn(deletePreset);

  const [nombrePreset, setNombrePreset] = useState("");
  const [presetSel, setPresetSel] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const presets = useQuery({ queryKey: ["presets-pesos"], queryFn: () => listP() });

  const guardarMut = useMutation({
    mutationFn: () =>
      guardarP({
        data: {
          nombre: nombrePreset,
          pesos: Object.fromEntries(
            criterios.map((c) => [c.campo, pesos[c.id] ?? 0]),
          ),
        },
      }),
    onSuccess: () => {
      setNombrePreset("");
      setAviso("Configuración guardada.");
      qc.invalidateQueries({ queryKey: ["presets-pesos"] });
    },
    onError: (e: Error) => setAviso(e.message),
  });

  const borrarMut = useMutation({
    mutationFn: (id: string) => borrarP({ data: { id } }),
    onSuccess: () => {
      setPresetSel("");
      qc.invalidateQueries({ queryKey: ["presets-pesos"] });
    },
    onError: (e: Error) => setAviso(e.message),
  });

  function aplicarPreset(id: string) {
    setPresetSel(id);
    const preset = (presets.data ?? []).find((p) => p.id === id);
    if (!preset) return;
    const guardados = (preset.pesos ?? {}) as Record<string, number>;
    const out: MapaPesos = {};
    for (const c of criterios) out[c.id] = Number(guardados[c.campo] ?? 0);
    onChange(out);
  }

  const total = criterios.reduce((a, c) => a + (pesos[c.id] ?? 0), 0);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        {criterios.map((c) => (
          <div key={c.id} className="grid grid-cols-[minmax(9rem,1fr)_2fr_auto] items-center gap-3">
            <div className="text-sm">
              <strong className="block">{CAMPOS_CRITERIO[c.campo]}</strong>
              {onToggleObligatorio && (
                <label className="flex items-center gap-1 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={obligatorios?.[c.id] ?? c.obligatorio}
                    onChange={(e) => onToggleObligatorio(c.id, e.target.checked)}
                  />
                  <span>Obligatorio</span>
                </label>
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              aria-label={`Ponderación de ${CAMPOS_CRITERIO[c.campo]}`}
              value={pesos[c.id] ?? 0}
              onChange={(e) => onChange(ajustarPesos(pesos, c.id, Number(e.target.value)))}
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                className="w-16 rounded-md border bg-background px-2 py-1 text-right text-sm"
                value={pesos[c.id] ?? 0}
                onChange={(e) => onChange(ajustarPesos(pesos, c.id, Number(e.target.value)))}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">Total repartido: {total}%</p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Configuración guardada</span>
          <select
            className="rounded-md border bg-background px-3 py-2"
            value={presetSel}
            onChange={(e) => aplicarPreset(e.target.value)}
          >
            <option value="">Elegir…</option>
            {(presets.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        {presetSel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => borrarMut.mutate(presetSel)}
          >
            Eliminar
          </Button>
        )}
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Guardar como</span>
          <input
            className="rounded-md border bg-background px-3 py-2"
            placeholder="Nombre de la configuración"
            value={nombrePreset}
            onChange={(e) => setNombrePreset(e.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!nombrePreset.trim() || guardarMut.isPending}
          onClick={() => guardarMut.mutate()}
        >
          Guardar configuración
        </Button>
      </div>
      {aviso && <p className="text-sm text-muted-foreground">{aviso}</p>}
    </div>
  );
}
