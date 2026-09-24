# 08 · Dependencias

## Producción

| Paquete | Uso |
|---------|-----|
| `react`, `react-dom` 19 | Interfaz |
| `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/router-plugin` | Framework full-stack, ruteo por archivos y server functions |
| `@tanstack/react-query` | Caché y sincronización de datos en la UI |
| `@supabase/supabase-js` | Cliente PostgreSQL usado sólo en el servidor |
| `@google/genai` | SDK oficial de Gemini para la normalización y el análisis semántico |
| Groq (HTTP, sin SDK) | Proveedor de respaldo cuando Gemini no responde |
| `xlsx` | Lectura de planillas `.xlsx` y `.csv` |
| `zod` | Validación de entradas en server functions |
| `tailwindcss`, `@tailwindcss/vite`, `tailwind-merge`, `clsx`, `class-variance-authority`, `tw-animate-css` | Estilos |
| `@radix-ui/*`, `lucide-react`, `sonner`, `cmdk`, `vaul`, `recharts`, `embla-carousel-react` | Primitivas de interfaz, iconos, notificaciones y gráficos |
| `react-hook-form`, `@hookform/resolvers` | Formularios |
| `date-fns` | Formato de fechas |

## Desarrollo

`vite`, `nitro` (build del worker), `typescript`, `eslint` + `typescript-eslint` + `prettier`,
`@lovable.dev/vite-tanstack-config` (configuración base de Vite), `drizzle-kit`/`drizzle-orm` y
`postgres` (utilidades de esquema).

## Restricciones del runtime

El servidor corre en un worker de borde: no hay `child_process`, `sharp`, `canvas`, `puppeteer` ni
acceso a un sistema de archivos real. Cualquier dependencia nueva debe ser compatible con Workers
(JavaScript puro, APIs web o WASM) y quedar completamente empaquetada en el build.
