import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";

import {
  ATRIBUTOS_SEMANTICOS,
  atributosVacios,
  createCargo,
  deleteCargo,
  listCargos,
  type AtributosSemanticos,
  type CargoTipo,
} from "@/lib/cargos.functions";
import { listEmpresas } from "@/lib/empresas.functions";
import { formatSueldo } from "@/lib/format";

export const Route = createFileRoute("/cargos")({
  head: () => ({
    meta: [
      { title: "Cargos — HOMOLOGA" },
      { name: "description", content: "Cargos internos y de referencia con su empresa, descripción y sueldo." },
      { property: "og:title", content: "Cargos — HOMOLOGA" },
      { property: "og:description", content: "Administra cargos internos y de referencia por empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CargosPage,
});

function contarAtributos(raw: unknown) {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return ATRIBUTOS_SEMANTICOS.filter((a) => typeof o[a.clave] === "string" && o[a.clave] !== "")
    .length;
}

function CargosPage() {
  const qc = useQueryClient();
  const listC = useServerFn(listCargos);
  const listE = useServerFn(listEmpresas);
  const create = useServerFn(createCargo);
  const remove = useServerFn(deleteCargo);

  const cargos = useQuery({ queryKey: ["cargos"], queryFn: () => listC() });
  const empresas = useQuery({ queryKey: ["empresas"], queryFn: () => listE() });

  const [empresaId, setEmpresaId] = useState("");
  const [tipo, setTipo] = useState<CargoTipo>("INTERNO");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [sueldo, setSueldo] = useState("");
  const [atributos, setAtributos] = useState<AtributosSemanticos>(atributosVacios);
  const [error, setError] = useState<string | null>(null);

  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  const invalidate = () => qc.invalidateQueries();

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: { empresa_id: empresaId, tipo, nombre, descripcion, sueldo, atributos_semanticos: atributos },
      }),
    onSuccess: () => {
      setNombre("");
      setDescripcion("");
      setSueldo("");
      setAtributos(atributosVacios());
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

  const filtrados = useMemo(
    () =>
      (cargos.data ?? []).filter(
        (c) =>
          (!filtroEmpresa || c.empresa_id === filtroEmpresa) && (!filtroTipo || c.tipo === filtroTipo),
      ),
    [cargos.data, filtroEmpresa, filtroTipo],
  );

  const sinEmpresas = !empresas.isLoading && !empresas.data?.length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Cargos</h1>

      {sinEmpresas && (
        <p className="text-sm text-muted-foreground">
          Primero registra una empresa para poder crear cargos.
        </p>
      )}

      <form
        className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Empresa</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            required
          >
            <option value="">Selecciona…</option>
            {(empresas.data ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Tipo</span>
          <select
            className="w-full rounded-md border bg-background px-3 py-2"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as CargoTipo)}
          >
            <option value="INTERNO">Interno</option>
            <option value="REFERENCIA">Referencia</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Nombre</span>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Sueldo</span>
          <input
            type="number"
            min="0"
            step="1"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={sueldo}
            onChange={(e) => setSueldo(e.target.value)}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-muted-foreground">Descripción</span>
          <textarea
            className="w-full rounded-md border bg-background px-3 py-2"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </label>
        <details className="rounded-md border p-3 sm:col-span-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Atributos semánticos (opcionales)
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ATRIBUTOS_SEMANTICOS.map((a) => (
              <label key={a.clave} className="text-sm">
                <span className="mb-1 block text-muted-foreground">{a.etiqueta}</span>
                <textarea
                  className="w-full rounded-md border bg-background px-3 py-2"
                  rows={2}
                  value={atributos[a.clave]}
                  onChange={(e) =>
                    setAtributos((prev) => ({ ...prev, [a.clave]: e.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Se usan solo en el análisis semántico. Lo que dejes vacío se envía vacío y no se completa
            automáticamente.
          </p>
        </details>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={createMut.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            Agregar cargo
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-3 text-sm">
        <select
          className="rounded-md border bg-background px-3 py-2"
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
        >
          <option value="">Todas las empresas</option>
          {(empresas.data ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border bg-background px-3 py-2"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="INTERNO">Interno</option>
          <option value="REFERENCIA">Referencia</option>
        </select>
      </div>

      {cargos.isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !filtrados.length ? (
        <p className="text-sm text-muted-foreground">No hay cargos que coincidan.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="border-b py-2">Cargo</th>
              <th className="border-b py-2">Empresa</th>
              <th className="border-b py-2">Tipo</th>
              <th className="border-b py-2">Sueldo</th>
              <th className="border-b py-2" />
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id}>
                <td className="border-b py-2">
                  {c.nombre}
                  {c.descripcion && (
                    <div className="text-xs text-muted-foreground">{c.descripcion}</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Atributos semánticos: {contarAtributos(c.atributos_semanticos)}/
                    {ATRIBUTOS_SEMANTICOS.length}
                  </div>
                </td>
                <td className="border-b py-2">{c.empresas?.nombre ?? "—"}</td>
                <td className="border-b py-2">{c.tipo === "INTERNO" ? "Interno" : "Referencia"}</td>
                <td className="border-b py-2">{formatSueldo(c.sueldo)}</td>
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
