import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";


import { listEjecuciones } from "@/lib/homologacion.functions";
import { formatFecha } from "@/lib/format";

export const Route = createFileRoute("/historial/")({
  head: () => ({
    meta: [
      { title: "Historial — Espejo: Homologa" },
      { name: "description", content: "Historial de ejecuciones de homologación por cargo interno." },
      { property: "og:title", content: "Historial — Espejo: Homologa" },
      { property: "og:description", content: "Revisa las ejecuciones de homologación y sus resultados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistorialPage,
});

type ColHist = "cargo" | "empresa" | "fecha" | "estado";
const COLS_HIST: [ColHist, string][] = [
  ["cargo", "Cargo interno"],
  ["empresa", "Empresa"],
  ["fecha", "Fecha"],
  ["estado", "Estado"],
];

function HistorialPage() {
  const list = useServerFn(listEjecuciones);
  const { data, isLoading } = useQuery({ queryKey: ["ejecuciones"], queryFn: () => list() });
  const [orden, setOrden] = useState<{ col: ColHist; asc: boolean }>({ col: "fecha", asc: false });
  const ordenar = (col: ColHist) =>
    setOrden((o) => (o.col === col ? { col, asc: !o.asc } : { col, asc: true }));

  const filas = useMemo(() => {
    const valor = (e: NonNullable<typeof data>[number]) =>
      orden.col === "cargo"
        ? e.cargos?.nombre ?? ""
        : orden.col === "empresa"
          ? e.cargos?.empresas?.nombre ?? ""
          : orden.col === "estado"
            ? e.estado ?? ""
            : e.fecha ?? "";
    const dir = orden.asc ? 1 : -1;
    return [...(data ?? [])].sort((a, b) => String(valor(a)).localeCompare(String(valor(b)), "es") * dir);
  }, [data, orden]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Historial</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground">Aún no hay ejecuciones.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              {COLS_HIST.map(([col, texto]) => (
                <th key={col} className="border-b py-2">
                  <button type="button" className="th-sort" onClick={() => ordenar(col)}>
                    {texto}
                    {orden.col === col ? (orden.asc ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
              <th className="border-b py-2" />
            </tr>
          </thead>
          <tbody>

            {filas.map((e) => (
              <tr key={e.id}>
                <td className="border-b py-2">{e.cargos?.nombre ?? "—"}</td>
                <td className="border-b py-2">{e.cargos?.empresas?.nombre ?? "—"}</td>
                <td className="border-b py-2">{formatFecha(e.fecha)}</td>
                <td className="border-b py-2">{e.estado}</td>
                <td className="border-b py-2 text-right">
                  <Link
                    to="/historial/$id"
                    params={{ id: e.id }}
                    className="text-primary hover:underline"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
