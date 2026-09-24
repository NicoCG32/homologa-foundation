/**
 * Vista espejo: ficha del cargo interno enfrentada a la del cargo de referencia.
 * Sólo presenta datos ya cargados; no calcula ni altera scores.
 */
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

  return (
    <div className="espejo">
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
          <div className="espejo-cell espejo-cell-a">
            <small>Cargo interno</small>
            {f.a || "—"}
          </div>
          <div className="espejo-cell espejo-cell-b">
            <small>{etiquetaB}</small>
            {f.b || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
