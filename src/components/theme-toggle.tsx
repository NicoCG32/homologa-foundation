import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "claro" | "oscuro";

/** Script que aplica el tema antes del primer pintado, evitando parpadeo. */
export const TEMA_SCRIPT = `(function(){try{var t=localStorage.getItem("espejo-tema");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"oscuro":"claro";}document.documentElement.classList.toggle("dark",t==="oscuro");document.documentElement.dataset.tema=t;}catch(e){}})();`;

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("claro");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const guardado = (localStorage.getItem("espejo-tema") as Tema | null) ?? null;
    const inicial: Tema =
      guardado ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro");
    setTema(inicial);
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    document.documentElement.classList.toggle("dark", tema === "oscuro");
    document.documentElement.dataset.tema = tema;
    localStorage.setItem("espejo-tema", tema);
  }, [tema, listo]);

  const oscuro = tema === "oscuro";

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-checked={oscuro}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => setTema(oscuro ? "claro" : "oscuro")}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <Sun />
        <Moon />
        <i />
      </span>
      <span className="theme-toggle-label">{oscuro ? "Modo oscuro" : "Modo claro"}</span>
    </button>
  );
}
