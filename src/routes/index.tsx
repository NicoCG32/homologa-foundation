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
    </div>
  );
}
