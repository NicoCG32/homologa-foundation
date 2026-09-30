import { useState } from "react";
import lightLogo from "@/assets/LightLogo.png.asset.json";
import darkLogo from "@/assets/DarkLogo.png.asset.json";

type LogoPrincipalProps = {
  className?: string;
  alt?: string;
  eager?: boolean;
};

export function LogoPrincipal({ className, alt = "Espejo: Homologa", eager = false }: LogoPrincipalProps) {
  const [cargados, setCargados] = useState(0);
  const listo = cargados >= 2;
  const completarCarga = () => setCargados((actual) => Math.min(actual + 1, 2));

  return (
    <span
      className={`logo-principal${listo ? " logo-principal-listo" : ""}${className ? ` ${className}` : ""}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <span className="logo-principal-skeleton" aria-hidden="true" />
      <img
        src={lightLogo.url}
        alt=""
        aria-hidden="true"
        className="logo-principal-imagen logo-principal-claro"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        onLoad={completarCarga}
      />
      <img
        src={darkLogo.url}
        alt=""
        aria-hidden="true"
        className="logo-principal-imagen logo-principal-oscuro"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        onLoad={completarCarga}
      />
    </span>
  );
}