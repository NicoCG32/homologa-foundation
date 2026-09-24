import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import logo from "@/assets/espejo-logo.jpg.asset.json";

const CLAVE = "espejo-bienvenida";

export function Bienvenida() {
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(CLAVE)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function entrar() {
    setSaliendo(true);
    try {
      sessionStorage.setItem(CLAVE, "1");
    } catch {
      /* sin persistencia */
    }
    window.setTimeout(() => setVisible(false), 420);
  }

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") entrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`bienvenida${saliendo ? " bienvenida-sale" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Entrar a Espejo: Homologa"
      onClick={entrar}
    >
      <div className="bienvenida-card">
        <img src={logo.url} alt="Espejo: Homologa" className="bienvenida-logo" />
        <p className="bienvenida-lema">
          Homologación de cargos y comparación con el mercado, paso a paso.
        </p>
        <span className="bienvenida-cta">
          Haz clic para comenzar <ArrowRight aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}
