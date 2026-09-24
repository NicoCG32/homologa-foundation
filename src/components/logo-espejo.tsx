/**
 * Identidad visual de Espejo: Homologa.
 * Isotipo vectorial: dos prismas enfrentados que se reflejan (cargo interno ↔ cargo de referencia).
 * Los degradados se definen por instancia con un id único para poder usar varios logos por página.
 */
import { useId } from "react";

export function LogoEspejo({ className, title }: { className?: string; title?: string }) {
  const uid = useId().replace(/:/g, "");
  const gA = `esp-a-${uid}`;
  const gB = `esp-b-${uid}`;

  return (
    <svg
      className={className ? `logo-espejo ${className}` : "logo-espejo"}
      viewBox="0 0 64 64"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={gA} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--logo-1)" />
          <stop offset="100%" stopColor="var(--logo-2)" />
        </linearGradient>
        <linearGradient id={gB} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--logo-3)" />
          <stop offset="100%" stopColor="var(--logo-2)" />
        </linearGradient>
      </defs>
      {/* Prisma izquierdo: el cargo interno */}
      <path d="M29 6 6 32l23 26V6Z" fill={`url(#${gA})`} />
      {/* Prisma derecho: el cargo de referencia, reflejado y translúcido */}
      <path d="M35 6 58 32 35 58V6Z" fill={`url(#${gB})`} opacity=".85" />
      {/* Eje de reflexión */}
      <path d="M32 3v58" stroke="var(--logo-axis)" strokeWidth="2" strokeLinecap="round" opacity=".9" />
      {/* Destellos de refracción */}
      <path d="M29 6 6 32h13Z" fill="var(--logo-shine)" opacity=".5" />
      <path d="M35 58 58 32H45Z" fill="var(--logo-shine)" opacity=".35" />
    </svg>
  );
}

/** Ilustración de portada: planos de cristal enfrentados con refracción de luz. */
export function EspejoPrismas({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const g1 = `pr1-${uid}`;
  const g2 = `pr2-${uid}`;
  const g3 = `pr3-${uid}`;
  const blur = `prb-${uid}`;

  return (
    <svg className={className} viewBox="0 0 420 340" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={g1} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--logo-1)" stopOpacity=".95" />
          <stop offset="100%" stopColor="var(--logo-2)" stopOpacity=".55" />
        </linearGradient>
        <linearGradient id={g2} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--logo-3)" stopOpacity=".9" />
          <stop offset="100%" stopColor="var(--logo-2)" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id={g3} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--logo-shine)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--logo-shine)" stopOpacity=".75" />
          <stop offset="100%" stopColor="var(--logo-shine)" stopOpacity="0" />
        </linearGradient>
        <filter id={blur} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* Halo atmosférico */}
      <ellipse cx="210" cy="180" rx="140" ry="110" fill="var(--logo-2)" opacity=".18" filter={`url(#${blur})`} />

      {/* Haz de luz que cruza entre ambos planos */}
      <rect x="60" y="160" width="300" height="20" fill={`url(#${g3})`} />

      {/* Plano izquierdo */}
      <g>
        <path d="M185 40 60 105v130l125 65V40Z" fill={`url(#${g1})`} />
        <path d="M185 40 60 105l125 40V40Z" fill="var(--logo-shine)" opacity=".28" />
        <path d="M185 40 60 105v130l125 65V40Z" fill="none" stroke="var(--logo-edge)" strokeWidth="1.5" opacity=".6" />
      </g>

      {/* Plano derecho: el reflejo */}
      <g>
        <path d="M235 40 360 105v130l-125 65V40Z" fill={`url(#${g2})`} opacity=".9" />
        <path d="M235 40 360 105l-125 40V40Z" fill="var(--logo-shine)" opacity=".2" />
        <path d="M235 40 360 105v130l-125 65V40Z" fill="none" stroke="var(--logo-edge)" strokeWidth="1.5" opacity=".45" />
      </g>

      {/* Eje central de simetría */}
      <path d="M210 26v288" stroke="var(--logo-axis)" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <circle cx="210" cy="170" r="7" fill="var(--logo-shine)" opacity=".85" />
    </svg>
  );
}
