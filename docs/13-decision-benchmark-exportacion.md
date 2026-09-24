# 13 · Decisión, benchmark y exportación

`src/components/decision-form.tsx`, `src/components/benchmark-panel.tsx`,
`src/routes/historial.$id.tsx` y las server functions de `src/lib/homologacion.functions.ts`.

Regla transversal: **ninguna de estas etapas modifica un score**. Todas leen datos ya persistidos.

## Decisión en dos etapas

### 1 · Preselección múltiple

`guardarPreseleccion` guarda N candidatos en `decision_preseleccion`, con copia de sus tres scores
al momento de marcarlos.

- El analista ve Score motor, Score IA y Score final de cada candidato.
- El candidato sugerido por la IA sólo se **etiqueta**; nunca se marca solo.
- La preselección puede rehacerse mientras no exista decisión definitiva.

### 2 · Selección final

`getPreseleccion` devuelve los preseleccionados con sus scores y sus bandas. Se muestran apilados,
con los datos de mercado del tamaño elegido. El analista confirma **uno**, y `guardarDecision`
registra en `decisiones` (una fila por ejecución):

| Campo | Contenido |
|---|---|
| `candidato_id` | Cargo de referencia definitivo |
| `decision` | Texto de la decisión |
| `comentario` | Justificación del analista |
| `usuario` | Nombre del analista |
| `fecha` | Momento de la confirmación |
| `tamano_empresa` | Tamaño elegido para el benchmark |
| `scores_utilizados` | Los tres scores vigentes al decidir |

Si existe preselección, el definitivo debe pertenecer a ella. Las decisiones antiguas guardadas sin
preselección siguen siendo válidas y se muestran igual.

## Benchmark de mercado

`getEjecucion` sólo devuelve las bandas cuando ya existe decisión: antes de decidir, no hay
benchmark. El tamaño (`P` / `M` / `G`) se elige al confirmar o desde el propio panel
(`setTamanoBenchmark`).

El panel muestra **un solo tamaño a la vez**:

- Ficha: cargo interno, cargo de referencia confirmado, tamaño, fuente y año.
- Tabla y gráfico de barras con **P25, P50, P75 y promedio**.
- Sólo información de mercado: la remuneración interna no aparece en la ficha, la tabla ni el gráfico.
- Todo dato ausente se muestra como **"No disponible"**. Nunca se estima ni se interpola.
- La remuneración no participa en ningún score ni en la selección de candidatos.

## Exportación a Excel

Botón **Exportar resultados** en el detalle del historial, visible **sólo** cuando existe decisión.
Genera el archivo en el navegador con `xlsx`, sin recalcular nada ni llamar a la IA.

Una hoja `RESULTADOS`, **una fila por candidato seleccionado** (los preseleccionados; si no hay
preselección, el candidato definitivo). Columnas:

| Grupo | Columnas |
|---|---|
| Cargo interno | código, nombre, empresa, área, subárea, nivel |
| Candidato | código, nombre, empresa, selección (`Definitivo` / `Preseleccionado`) |
| Scores | Score motor, Score IA, Score final (los persistidos) |
| Decisión | analista, fecha, comentario |
| Análisis IA | confianza, modelo, explicación |
| Benchmark | P25, P50, P75, promedio, fuente, año, tamaño |

Nombre del archivo: `homologacion_<cargo-sanitizado>_<AAAA-MM-DD>.xlsx`.
