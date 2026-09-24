<div align="center">

# Espejo · Homologa

**Homologación de cargos por contenido, no por sueldo.**

Motor determinístico auditable + análisis semántico asistido por IA,
sobre las planillas reales del piloto.

[![Estado](https://img.shields.io/badge/estado-piloto-1558B0)](#)
[![Stack](https://img.shields.io/badge/TanStack_Start-React_19-0B2B55)](#)
[![Backend](https://img.shields.io/badge/Lovable_Cloud-PostgreSQL-25BDA7)](#)
[![IA](https://img.shields.io/badge/Gemini_+_Groq-structured_output-1558B0)](#)

[Documentación](./docs/README.md) ·
[Arquitectura](./docs/01-arquitectura.md) ·
[Flujo](./docs/03-flujo-homologacion.md) ·
[Base de datos](./docs/04-base-de-datos.md) ·
[Motor](./docs/06-motor-deterministico.md)

</div>

---

## Índice

1. [Qué resuelve](#qué-resuelve)
2. [Núcleo del producto](#núcleo-del-producto)
3. [Principios](#principios)
4. [El flujo de punta a punta](#el-flujo-de-punta-a-punta)
5. [Cómo se calcula el resultado](#cómo-se-calcula-el-resultado)
6. [La decisión del analista](#la-decisión-del-analista)
7. [Benchmark de mercado](#benchmark-de-mercado)
8. [Exportación](#exportación)
9. [Resiliencia de la IA](#resiliencia-de-la-ia)
10. [Pestañas de la aplicación](#pestañas-de-la-aplicación)
11. [Stack y mapa del código](#stack-y-mapa-del-código)
12. [Puesta en marcha](#puesta-en-marcha)
13. [Glosario](#glosario)

---

## Qué resuelve

Un profesional de compensaciones necesita saber a qué cargo del mercado equivale un cargo interno.
El trabajo manual habitual —abrir la encuesta, buscar el cargo "parecido", justificarlo en un
correo— es lento, poco trazable y difícil de auditar.

**Espejo: Homologa** toma las planillas tal como existen, reconstruye empresas y cargos sin carga
manual, compara **el contenido del cargo** (propósito, funciones, responsabilidades, conocimientos,
complejidad, autonomía, alcance, experiencia y formación) y entrega candidatos ordenados con la
explicación de cada coincidencia. La remuneración aparece **sólo al final**, como referencia de
mercado, y jamás influye en la comparación.

El nombre no es decorativo: la plataforma pone el cargo interno frente a su **reflejo** en el
mercado. Ese espejo es la metáfora que guía la interfaz, el vocabulario y el orden de las pantallas.

---

## Núcleo del producto

Seis pilares definen qué es obligatorio en cada pantalla y cada decisión de diseño.

| Pilar | Qué significa aquí |
|---|---|
| **Identidad** | Espejo · reflejo · homologación. Cargo interno y cargo de mercado siempre enfrentados, con la misma jerarquía visual. |
| **UX** | Orientación paso a paso, contexto permanente del cargo evaluado y estados explícitos (calculado, pendiente, no disponible, error). |
| **Robustez percibida** | Se valida antes de escribir, se bloquea sólo lo estructuralmente inconsistente y cada error explica qué pasó y qué hacer. |
| **Control** | El analista pondera criterios, preselecciona varios candidatos y decide. La metodología acota; no decide por él. |
| **Accesibilidad** | Vocabulario de compensaciones, no de software. Contraste alto, jerarquía tipográfica clara y detalle bajo demanda. |
| **Responsive** | Escritorio, tablet y celular. En pantallas angostas las tablas se apilan con etiquetas legibles. |

Queda **fuera del núcleo** (opcional, no implementado): autenticación de usuarios, multiempresa,
extracción automática de encuestas, predicción salarial, recomendaciones de aumento, analítica
avanzada y multilenguaje.

---

## Principios

| | |
|---|---|
| **Sin datos ficticios** | Lo que falta se informa; nunca se inventa ni se rellena |
| **El sueldo no homologa** | La remuneración es informativa y jamás llega a la IA |
| **El motor manda** | La IA sólo interpreta candidatos ya preseleccionados por reglas |
| **El código manda** | Áreas y subáreas se identifican por código; se conserva el nombre de cada fuente |
| **Reproducible** | La ponderación aplicada queda guardada en cada ejecución |
| **La IA traduce, no juzga** | En la normalización sólo convierte texto a datos; no decide equivalencias |

---

## El flujo de punta a punta

```text
  Tres planillas Excel
          │
          ▼
  Validación estructural  ──►  resumen antes de guardar (bloquea sólo lo inconsistente)
          │
          ▼
  Empresas y cargos en base   (internos · de referencia · bandas salariales)
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Cargo  →  Revisión  →  Candidatos  →  Análisis IA  →  Decisión  →  Benchmark │
│             (pesos)      (motor)        (semántico)    (analista)   (mercado) │
│   ◄──────────── se puede volver atrás en cualquier paso ────────────►         │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          ▼
  Historial  →  Exportación a Excel
```

Las tres planillas del piloto:

| Archivo | Rol |
|---|---|
| **Cargos Empresa** | Cargos internos a homologar |
| **Encuesta Piloto** | Catálogo de cargos de referencia del mercado |
| **Encuesta Piloto Remuneraciones** | Bandas por tamaño de empresa, cruzadas por `ID Cargo` |

Detalle completo en [docs/05-importacion-excel.md](./docs/05-importacion-excel.md).

---

## Cómo se calcula el resultado

El cálculo ocurre en tres etapas separadas y trazables.

**1 · Normalización previa (IA como traductor).**
Experiencia y formación son texto libre ("5 años en RRHH", "Ingeniero Comercial o afín"). Antes de
comparar, la IA los convierte a una ficha mínima —`{min_anios, max_anios, areas}` y
`{nivel, areas, carreras}`— que se guarda en caché por huella del texto original. El texto original
nunca se altera; si la normalización falla, el motor compara el texto tal cual y lo avisa.
Ver [docs/11-normalizacion.md](./docs/11-normalizacion.md).

**2 · Motor determinístico.**
Cálculo puro, sin IA y sin acceso a la base: mismas entradas, mismas salidas. Aplica los criterios
activos con peso mayor a cero, descarta a quien incumpla un criterio obligatorio y ordena por score.
Ver [docs/06-motor-deterministico.md](./docs/06-motor-deterministico.md).

**3 · Análisis semántico.**
Sólo los candidatos preseleccionados por el motor llegan a la IA, y nunca con sueldo. La salida es
compacta: un puntaje 0–100 por candidato, una confianza y una explicación breve.
Ver [docs/07-analisis-semantico.md](./docs/07-analisis-semantico.md).

El score final es **híbrido** y mantiene sus tres componentes separados:

```text
score_final = score_deterministico × peso_motor  +  (score_semantico / 100) × peso_ia
```

| Componente | Origen | Rango |
|---|---|---|
| `score_deterministico` | Motor de reglas | 0–1 |
| `score_semantico` | IA (Gemini o respaldo) | 0–100 |
| `score_final` | Combinación ponderada | 0–1 |

Ponderación inicial: **70% motor / 30% IA**, configurable en **Criterios** (ambas partes suman 100%)
y almacenada en `configuracion.pesos_score`.

Si el análisis de IA falla o aún no se ejecuta, el score final queda **pendiente** (`NULL`): no se
inventa un score semántico y el score determinístico se conserva intacto.

---

## La decisión del analista

La decisión ocurre en dos etapas, y ninguna modifica ningún score.

1. **Preselección múltiple.** El analista marca **varios** candidatos viendo Score motor, Score IA y
   Score final de cada uno. La sugerencia de la IA es sólo una etiqueta: nunca se marca sola. La
   preselección queda guardada y puede rehacerse mientras no exista decisión definitiva.
2. **Selección final.** Se muestran sólo los preseleccionados, apilados, con sus datos de mercado
   para el tamaño de empresa elegido. El analista confirma **un único** cargo definitivo.

Se registran el candidato definitivo, la decisión, el comentario, la fecha, el nombre del analista,
el tamaño de empresa y los scores vigentes en ese momento.

---

## Benchmark de mercado

El benchmark gráfico aparece **sólo después** de confirmar, y sólo para el cargo definitivo.

- Un tamaño de empresa a la vez (Pequeña / Mediana / Grande), elegido por el analista.
- Tabla y gráfico de barras con **P25, P50, P75 y promedio**, más fuente y año.
- Sólo información de mercado: la remuneración interna no aparece en la ficha, la tabla ni el gráfico.
- Nunca se estima ni se interpola; lo que falta se muestra como "No disponible".

---

## Exportación

Desde el detalle del historial, el botón **Exportar resultados** aparece únicamente cuando existe una
decisión. Genera un `.xlsx` con una fila por candidato seleccionado: scores persistidos, decisión,
análisis de IA y benchmark. No recalcula nada ni vuelve a llamar a la IA.

---

## Resiliencia de la IA

La plataforma asume que el proveedor de IA puede fallar y lo maneja sin romper el trabajo del analista.

- **Reintentos** ante errores transitorios (429, 500, 502, 503, 504, sobrecarga): hasta 3 reintentos
  con esperas aproximadas de 1, 2 y 4 segundos más un margen aleatorio.
- **Respaldo automático** en un segundo proveedor con el mismo prompt y el mismo esquema JSON; el
  modelo efectivamente usado queda registrado en la ejecución.
- **Mensajes claros** en pantalla: "Analizando compatibilidad…", "Consultando motor de respaldo…".
  Nunca se muestran errores técnicos crudos al usuario.

Detalle en [docs/12-resiliencia-ia.md](./docs/12-resiliencia-ia.md).

---

## Pestañas de la aplicación

| Ruta | Pestaña | Para qué sirve |
|---|---|---|
| `/` | Inicio | Entrada al proceso y reinicio total de datos de prueba |
| `/cargos` | Cargos | Carga masiva de planillas, vista previa y catálogo completo |
| `/empresas` | Empresas | Alta y tamaño de empresa (Pequeña / Mediana / Grande) |
| `/criterios` | Criterios | Ponderación por columna, criterios obligatorios, presets y reparto motor/IA |
| `/diccionario` | Diccionario | Áreas, subáreas y niveles jerárquicos |
| `/homologacion/nueva` | Nueva homologación | El flujo por pasos |
| `/historial` | Historial | Ejecuciones con fecha y estado |
| `/historial/$id` | Detalle | Scores, criterios usados, análisis, decisión, benchmark y exportación |

Detalle en [docs/02-funcionalidades.md](./docs/02-funcionalidades.md).

---

## Stack y mapa del código

TanStack Start v1 (React 19, SSR) · TanStack Router y Query · Tailwind CSS v4 ·
Lovable Cloud (PostgreSQL, RLS cerrada, acceso sólo desde el servidor) ·
Gemini vía `@google/genai` con respaldo en Groq · `xlsx` para las planillas.

```text
src/routes/       una página por pestaña + __root.tsx (layout y navegación)
src/components/   pesos-editor · decision-form · benchmark-panel · primitivas de interfaz
src/lib/
  *.functions.ts      RPC del servidor (cargos, empresas, criterios, homologación, configuración…)
  cargos-import.ts    lectura y validación de planillas (puro)
  motor.server.ts     motor determinístico (puro)
  normalizacion.server.ts   experiencia y formación a ficha mínima, con caché
  semantica.server.ts       prompt, esquema y validación del análisis
  groq.server.ts            proveedor de respaldo
  gemini-retry.server.ts    reintentos con espera creciente
supabase/migrations/  historia del esquema
docs/                 documentación completa
```

---

## Puesta en marcha

```sh
npm i
npm run dev      # http://localhost:8080
```

| Script | Para qué |
|---|---|
| `npm run dev` | Desarrollo en el puerto 8080 |
| `npm run build` | Build de producción |
| `npm run lint` | Revisión de estilo de código |
| `npm run format` | Formateo |

Variables de entorno, secretos y publicación: [docs/09-deploy-y-entorno.md](./docs/09-deploy-y-entorno.md).

---

## Glosario

| Término | Significado en la plataforma |
|---|---|
| **Cargo interno** | Cargo de la organización que se quiere homologar |
| **Cargo de referencia** | Cargo del catálogo de mercado (encuesta) |
| **Homologación** | Determinar a qué cargo de referencia equivale un cargo interno, por contenido |
| **Criterio** | Columna comparable (área, nivel, experiencia…) con un peso asignado |
| **Preset** | Conjunto de pesos guardado con nombre para reutilizar |
| **Preselección** | Conjunto de candidatos marcados por el analista antes de decidir |
| **Banda salarial** | P25, P50, P75 y promedio de mercado para un cargo y tamaño de empresa |
| **Ejecución** | Una corrida de homologación, con su ponderación y sus resultados guardados |

---

<div align="center">
Construido con <a href="https://lovable.dev">Lovable</a>.
</div>
