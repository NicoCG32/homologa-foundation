/**
 * Vista espejo: ficha del cargo interno enfrentada a la del cargo de referencia.
 * Sólo presenta datos ya cargados; no calcula ni altera scores.
 * Se muestra compacta y desplegable, y destella al cambiar de candidato.
 */
import { useEffect, useRef, useState } from "react";

export type CargoEspejo = {
  nombre: string;
  codigo_cargo?: string | null;
  empresa_nombre?: string | null;
  nombre_area?: string | null;
  nombre_subarea?: string | null;
  nivel_jerarquico?: string | null;
  requisitos_formacion?: string | null;
  experiencia_requerida?: string | null;
  descripcion?: string | null;
};

const igual = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

const LARGOS = new Set(["Formación", "Experiencia", "Descripción"]);

function Celda({
  lado,
  etiqueta,
  valor,
  largo,
}: {
  lado: "a" | "b";
  etiqueta: string;
  valor: string | null | undefined;
  largo: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const texto = valor?.trim() || "—";
  const extenso = largo && texto.length > 120;
  return (
    <div className={`espejo-cell espejo-cell-${lado}`}>
      <small>{etiqueta}</small>
      <span className={extenso && !abierto ? "espejo-clamp" : undefined}>{texto}</span>
      {extenso && (
        <button type="button" className="espejo-mas" onClick={() => setAbierto((v) => !v)}>
          {abierto ? "Ver menos" : "Ver texto completo"}
        </button>
      )}
    </div>
  );
}

export function VistaEspejo({
  interno,
  candidato,
  etiquetaB = "Candidato de referencia",
  remuneracionA,
  remuneracionB,
}: {
  interno: CargoEspejo;
  candidato: CargoEspejo;
  etiquetaB?: string;
  /** Referencia visual: remuneración real del cargo interno. */
  remuneracionA?: string | undefined;
  /** Referencia visual: valor de mercado del candidato. */
  remuneracionB?: string | undefined;
}) {
  const filas: { etiqueta: string; a?: string | null | undefined; b?: string | null | undefined }[] = [
    {
      etiqueta: "Cargo",
      a: `${interno.codigo_cargo ? `${interno.codigo_cargo} · ` : ""}${interno.nombre}`,
      b: `${candidato.codigo_cargo ? `${candidato.codigo_cargo} · ` : ""}${candidato.nombre}`,
    },
    { etiqueta: "Empresa", a: interno.empresa_nombre, b: candidato.empresa_nombre },
    { etiqueta: "Área", a: interno.nombre_area, b: candidato.nombre_area },
    { etiqueta: "Subárea", a: interno.nombre_subarea, b: candidato.nombre_subarea },
    { etiqueta: "Nivel", a: interno.nivel_jerarquico, b: candidato.nivel_jerarquico },
    { etiqueta: "Formación", a: interno.requisitos_formacion, b: candidato.requisitos_formacion },
    { etiqueta: "Experiencia", a: interno.experiencia_requerida, b: candidato.experiencia_requerida },
    { etiqueta: "Descripción", a: interno.descripcion, b: candidato.descripcion },
  ];
  if (remuneracionA !== undefined || remuneracionB !== undefined) {
    filas.push({ etiqueta: "Remuneración", a: remuneracionA, b: remuneracionB });
  }

  const coincidencias = filas.filter((f) => igual(f.a, f.b)).length;
  const identidad = `${candidato.codigo_cargo ?? ""}·${candidato.nombre}`;

  // Destello al cambiar de candidato, para que el cambio sea evidente.
  const [flash, setFlash] = useState(false);
  const previo = useRef(identidad);
  useEffect(() => {
    if (previo.current === identidad) return;
    previo.current = identidad;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 700);
    return () => clearTimeout(t);
  }, [identidad]);

  return (
    <details className="espejo-desplegable">
      <summary>
        <span className="espejo-sum-titulo">
          Comparar en vista espejo: {interno.codigo_cargo || interno.nombre} frente a{" "}
          <strong key={identidad} className="espejo-sum-b">
            {candidato.codigo_cargo || candidato.nombre}
          </strong>
        </span>
        <em>
          {coincidencias} {coincidencias === 1 ? "coincidencia" : "coincidencias"}
        </em>
      </summary>
      <div className={`espejo${flash ? " espejo-flash" : ""}`} key={identidad}>
        <div className="espejo-heads" aria-hidden="true">
          <span />
          <span className="espejo-head-a">Cargo interno</span>
          <span className="espejo-head-b">{etiquetaB}</span>
        </div>
        {filas.map((f) => (
          <div className="espejo-row" key={f.etiqueta}>
            <span className="espejo-label">
              {f.etiqueta}
              {igual(f.a, f.b) && <em>coincide</em>}
            </span>
            <Celda lado="a" etiqueta="Cargo interno" valor={f.a} largo={LARGOS.has(f.etiqueta)} />
            <Celda lado="b" etiqueta={etiquetaB} valor={f.b} largo={LARGOS.has(f.etiqueta)} />
          </div>
        ))}
      </div>
    </details>
  );
}
