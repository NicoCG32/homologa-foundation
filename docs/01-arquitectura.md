# 01 · Arquitectura

## Stack

- **Framework:** TanStack Start v1 (React 19, SSR) sobre Vite.
- **Ruteo:** TanStack Router con routing basado en archivos (`src/routes`).
- **Estado de datos:** TanStack Query.
- **Estilos:** Tailwind CSS v4 + tokens propios en `src/styles.css`.
- **Backend:** Lovable Cloud (PostgreSQL gestionado) accedido sólo desde el servidor.
- **IA:** Google Gemini vía `@google/genai`, con proveedor de respaldo Groq por HTTP.
- **Runtime de servidor:** worker de borde (Cloudflare Workers) generado por el build.

## Capas

```text
┌──────────────────────────────────────────────────────────┐
│ UI  ·  src/routes/*.tsx, src/components/*                │  React, sin acceso a la BD
├──────────────────────────────────────────────────────────┤
│ RPC ·  src/lib/*.functions.ts                            │  createServerFn: validación + orquestación
├──────────────────────────────────────────────────────────┤
│ Dominio · motor.server.ts          cálculo puro          │
│           normalizacion.server.ts  texto → ficha mínima  │
│           semantica.server.ts      contrato con la IA    │
│           groq.server.ts           proveedor de respaldo │
│           gemini-retry.server.ts   reintentos            │
│           cargos-import.ts         parsing de planillas  │
├──────────────────────────────────────────────────────────┤
│ Datos · supabase-public.server.ts                        │  único punto de acceso a PostgreSQL
└──────────────────────────────────────────────────────────┘
```

Regla clave: **el navegador nunca habla con la base de datos**. Todas las tablas tienen RLS
activo y los permisos concedidos únicamente al rol de servicio; el acceso ocurre dentro de las
server functions mediante `getDb()`.

## Estructura de carpetas

```text
src/
  routes/
    __root.tsx              layout, navegación lateral y encabezado
    index.tsx               Inicio
    cargos.tsx              catálogo y carga masiva
    empresas.tsx            empresas y tamaño
    criterios.tsx           ponderación, presets y reparto motor/IA
    diccionario.tsx         áreas, subáreas y niveles
    homologacion.nueva.tsx  flujo por pasos
    historial.index.tsx     listado de ejecuciones
    historial.$id.tsx       detalle, decisión, benchmark y exportación
  components/
    pesos-editor.tsx        sliders de ponderación (Criterios y Homologación)
    decision-form.tsx       preselección múltiple y selección final
    benchmark-panel.tsx     tabla y gráfico de mercado
    ui/                     primitivas shadcn
  lib/
    cargos.functions.ts        CRUD e importación de cargos
    empresas.functions.ts      CRUD de empresas y tamaño
    criterios.functions.ts     criterios, pesos y presets
    configuracion.functions.ts reparto motor/IA del score final
    diccionario.functions.ts   áreas, subáreas y niveles
    homologacion.functions.ts  ejecuciones, motor, análisis, preselección y decisión
    mantenimiento.functions.ts reinicio de datos operativos
    cargos-import.ts           lectura y validación de planillas (puro)
    motor.server.ts            motor determinístico (puro)
    normalizacion.server.ts    normalización de experiencia y formación
    semantica.server.ts        prompt, esquema y validación del análisis
    groq.server.ts             proveedor de respaldo
    gemini-retry.server.ts     reintentos ante errores transitorios
    supabase-public.server.ts  cliente de datos del servidor
  integrations/supabase/    cliente y tipos generados (no editar a mano)
supabase/migrations/        historia del esquema
docs/                       esta documentación
```

## Convenciones

- Los archivos `*.functions.ts` pueden importarse desde la UI; los `*.server.ts` **no**.
  Cuando una server function necesita un módulo `*.server.ts`, lo importa dinámicamente dentro del
  handler para que nunca entre al bundle del navegador.
- Toda entrada de una server function pasa por `inputValidator` antes de tocar datos.
- Las variables de entorno se leen **dentro** del handler, nunca en el ámbito del módulo.
- `unwrap()` convierte errores de la base en excepciones con mensaje legible.
- Los nombres de dominio (cargos, empresas, criterios) se mantienen en español en todo el código.
