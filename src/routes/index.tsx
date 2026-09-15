import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, ArrowRight, BriefcaseBusiness, Building2, History, Search } from "lucide-react";
import logoAsset from "@/assets/espejo-homologa-logo.jpg.asset.json";
import { limpiarDatos } from "@/lib/mantenimiento.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio — Espejo: Homologa" },
      {
        name: "description",
        content:
          "Selecciona un cargo y encuentra sus equivalentes con Espejo: Homologa.",
      },
      { property: "og:title", content: "Espejo: Homologa" },
      {
        property: "og:description",
        content: "Selecciona un cargo y encuentra sus equivalentes con un proceso claro y guiado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="home-page">
      <section className="home-intro">
        <div>
          <p className="eyebrow">Bienvenido a Espejo: Homologa</p>
          <h1>¿Qué cargo quieres homologar?</h1>
          <p>Selecciona un cargo para encontrar equivalencias y tomar una decisión con información clara.</p>
          <Link to="/homologacion/nueva" className="primary-action">
            <Search aria-hidden="true" /> Seleccionar cargo <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="home-logo-wrap" aria-hidden="true">
          <img src={logoAsset.url} alt="" />
        </div>
      </section>

      <section className="quick-grid" aria-label="Accesos rápidos">
        <Link to="/cargos"><BriefcaseBusiness /><span><strong>Cargos</strong><small>Revisa y administra los cargos disponibles.</small></span><ArrowRight /></Link>
        <Link to="/historial"><History /><span><strong>Historial</strong><small>Consulta homologaciones y resultados anteriores.</small></span><ArrowRight /></Link>
        <Link to="/empresas"><Building2 /><span><strong>Empresas</strong><small>Mantén actualizada la información de empresas.</small></span><ArrowRight /></Link>
      </section>

      <ReiniciarDatos />
    </div>
  );
}

function ReiniciarDatos() {
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
