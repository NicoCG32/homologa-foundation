# 01 · Arquitectura

## Stack

- **Framework:** TanStack Start v1 (React 19, SSR) sobre Vite.
- **Ruteo:** TanStack Router con routing basado en archivos (`src/routes`).
- **Estado de datos:** TanStack Query.
- **Estilos:** Tailwind CSS v4 + tokens propios en `src/styles.css`.
- **Backend:** Lovable Cloud (PostgreSQL gestionado) accedido sólo desde el servidor.
- **IA:** Google Gemini vía `@google/genai`.
- **Runtime de servidor:** worker de borde (Cloudflare Workers) generado por el build.

## Capas

```text
┌───────────────────────────────────────────────┐
│ UI  ·  src/routes/*.tsx, src/components/*     │  React, sin acceso a la BD
├───────────────────────────────────────────────┤
│ RPC ·  src/lib/*.functions.ts                 │  createServerFn: validación + orquestación
├───────────────────────────────────────────────┤
│ Dominio · motor.server.ts, semantica.server.ts│  cálculo puro / contrato con Gemini
│           cargos-import.ts                    │  parsing de planillas (aislado, testeable)
├───────────────────────────────────────────────┤
│ Datos · supabase-public.server.ts             │  único punto de acceso a PostgreSQL
└───────────────────────────────────────────────┘
```

Regla clave: **el navegador nunca habla con la base de datos**. Todas las tablas tienen RLS
activo y los permisos concedidos únicamente al rol de servicio; el acceso ocurre dentro de las
server functions mediante `getDb()`.

## Estructura de carpetas

```text
src/
  routes/                 páginas (una por pestaña) + __root.tsx (layout y navegación)
  components/
    pesos-editor.tsx      sliders de ponderación reutilizados en Criterios y Homologación
    ui/                   primitivas shadcn
  lib/
    cargos.functions.ts       CRUD e importación de cargos
    empresas.functions.ts     CRUD de empresas y tamaño
    criterios.functions.ts    criterios, pesos y presets
    diccionario.functions.ts  áreas, subáreas y niveles
    homologacion.functions.ts ejecuciones, motor y disparo del análisis IA
    mantenimiento.functions.ts reinicio de datos operativos
    cargos-import.ts          lectura y validación de planillas (puro)
    motor.server.ts           motor determinístico (puro)
    semantica.server.ts       prompt, esquema y validación de Gemini
    supabase-public.server.ts cliente de datos del servidor
  integrations/supabase/  cliente y tipos generados (no editar a mano)
supabase/migrations/      historia del esquema
```

## Convenciones

- Los archivos `*.functions.ts` pueden importarse desde la UI; los `*.server.ts` **no**.
- Toda entrada de una server function pasa por `inputValidator` antes de tocar datos.
- `unwrap()` convierte errores de la base en excepciones con mensaje legible.
- Los nombres de dominio (cargos, empresas, criterios) se mantienen en español en todo el código.
