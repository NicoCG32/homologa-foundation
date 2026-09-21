<div align="center">

# Espejo · Homologa

**Homologación de cargos por contenido, no por sueldo.**

Motor determinístico auditable + análisis semántico asistido por IA,
sobre las planillas reales del piloto.

[![Estado](https://img.shields.io/badge/estado-piloto-1558B0)](#)
[![Stack](https://img.shields.io/badge/TanStack_Start-React_19-0B2B55)](#)
[![Backend](https://img.shields.io/badge/Lovable_Cloud-PostgreSQL-25BDA7)](#)
[![IA](https://img.shields.io/badge/Gemini-structured_output-1558B0)](#)

[Documentación](./docs/README.md) ·
[Arquitectura](./docs/01-arquitectura.md) ·
[Flujo](./docs/03-flujo-homologacion.md) ·
[Base de datos](./docs/04-base-de-datos.md)

</div>

---

## Qué resuelve

Un profesional de compensaciones necesita saber a qué cargo del mercado equivale un cargo interno.
Espejo: Homologa toma las planillas tal como existen, reconstruye empresas y cargos sin carga
manual, compara por contenido del cargo y entrega candidatos ordenados con la explicación de cada
coincidencia y cada diferencia.

## El flujo

```text
Excel  →  Validación  →  Cargos en base
                              │
                              ▼
            Cargo  →  Revisión  →  Candidatos  →  Análisis IA  →  Score híbrido  →  Decisión  →  Benchmark
                         (pesos)     (motor)       (Gemini)      (70/30)        (analista)
```

## Principios

| | |
|---|---|
| **Sin datos ficticios** | Lo que falta se informa; nunca se inventa ni se rellena |
| **El sueldo no homologa** | La remuneración es informativa y jamás llega a la IA |
| **El motor manda** | La IA sólo interpreta candidatos ya preseleccionados por reglas |
| **El código manda** | Áreas y subáreas se identifican por código; se conserva el nombre de cada fuente |
| **Reproducible** | La ponderación aplicada queda guardada en cada ejecución |

## El resultado final

El score final es **híbrido** y mantiene sus tres componentes separados y trazables:

```text
score_final = score_deterministico × peso_motor  +  (score_semantico / 100) × peso_ia
```

| Componente | Origen | Rango |
|---|---|---|
| `score_deterministico` | Motor de reglas | 0–1 |
| `score_semantico` | Gemini | 0–100 |
| `score_final` | Combinación ponderada | 0–1 |

Ponderación inicial: **70% motor / 30% IA**. Es configurable en la pestaña **Criterios** y las dos
partes deben sumar 100%; el valor vive en `configuracion.pesos_score` y puede cambiarse en cualquier
momento sin tocar el código.

Si el análisis IA falla o aún no se ejecuta, el score final queda **pendiente** (`NULL`): no se
inventa un score semántico ni un score final, y el score determinístico se conserva intacto.

## La decisión del analista

Después del análisis IA, el analista confirma **un único** cargo de referencia. Se guardan el
candidato elegido, la decisión, el comentario, la fecha, el nombre del analista y los scores vigentes
en ese momento. La decisión **no modifica ningún score**.

La comparación salarial (benchmark) sólo aparece **después** de esa confirmación.

## Pestañas

`Inicio` · `Cargos` · `Empresas` · `Criterios` · `Diccionario` · `Nueva homologación` · `Historial`

Detalle en [docs/02-funcionalidades.md](./docs/02-funcionalidades.md).

## Stack

TanStack Start v1 (React 19, SSR) · TanStack Router y Query · Tailwind CSS v4 ·
Lovable Cloud (PostgreSQL, RLS cerrada, acceso sólo desde el servidor) · Gemini vía `@google/genai` ·
`xlsx` para las planillas.

## Puesta en marcha

```sh
npm i
npm run dev      # http://localhost:8080
```

Variables de entorno y publicación: [docs/09-deploy-y-entorno.md](./docs/09-deploy-y-entorno.md).

## Mapa del código

```text
src/routes/      una página por pestaña + layout y navegación
src/lib/         *.functions.ts (RPC) · motor.server.ts · semantica.server.ts · cargos-import.ts
src/components/  editor de ponderaciones + primitivas de interfaz
supabase/        migraciones del esquema
docs/            documentación completa
```

---

<div align="center">
Construido con <a href="https://lovable.dev">Lovable</a>.
</div>
