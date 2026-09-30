import { useState } from "react";
import lightLogo from "@/assets/LightLogo.png.asset.json";
import darkLogo from "@/assets/DarkLogo.png.asset.json";

type LogoPrincipalProps = {
  className?: string;
  alt?: string;
  eager?: boolean;
};

export function LogoPrincipal({ className, alt = "Espejo: Homologa", eager = false }: LogoPrincipalProps) {
  const [listo, setListo] = useState(false);

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
        onLoad={() => setListo(true)}
      />
      <img
        src={darkLogo.url}
        alt=""
        aria-hidden="true"
        className="logo-principal-imagen logo-principal-oscuro"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        decoding="async"
        onLoad={() => setListo(true)}
      />
    </span>
  );
}