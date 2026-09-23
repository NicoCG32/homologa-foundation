# Decisión en dos etapas: preselección múltiple y selección final única

Se amplía la etapa Decisión actual. No se crean pantallas nuevas y no cambian los estilos generales. El motor, Gemini, los scores, la carga y el historial anterior quedan como están.

## Cómo lo verá el analista

**Etapa 1: Preselección (N candidatos)**
- En lugar de un menú desplegable, aparece una lista de los candidatos con casillas para marcar varios.
- Cada fila muestra Score motor, Score Gemini y Score final. Si falta un valor, dice "Pendiente".
- El candidato sugerido por la IA lleva la etiqueta "Sugerido por la IA". No viene marcado de antemano.
- Con el botón "Guardar preselección" la selección queda guardada para esa homologación. Hay que marcar al menos un candidato.

**Etapa 2: Comparación y selección final**
- Solo se muestran los candidatos preseleccionados, uno bajo otro.
- Arriba está el selector de tamaño de empresa (el mismo de hoy). Cada candidato muestra sus datos de mercado para ese tamaño: P25, P50, P75, promedio, fuente y año. Cuando falta un dato aparece "No disponible". No se estima nada y no se muestran los tres tamaños a la vez.
- El analista elige un solo candidato como homologado definitivo. Siguen visibles los campos de analista, comentario y tamaño de empresa.
- "Confirmar homologación" registra la decisión definitiva. El botón "Volver a la preselección" permite cambiar la lista mientras no exista una decisión definitiva.

**Después de confirmar**
- El benchmark con gráfico y tabla aparece igual que hoy, solo para el candidato definitivo y solo después de guardar la decisión.
- En el historial, la sección "Decisión del analista" muestra el cargo homologado, el analista, la fecha, el comentario y los scores al decidir. Debajo aparece la lista de preseleccionados con sus tres scores, y el definitivo va destacado.
- Las decisiones antiguas, que no tienen preselección, se siguen viendo exactamente como hoy.

## Reglas que se mantienen
- Hay una sola decisión definitiva por homologación.
- Ni la preselección ni la decisión cambian scores. Solo guardan una copia de los scores del momento.
- La remuneración y el benchmark de la comparación no participan en el motor ni en ningún puntaje.
- Hoy no existe una exportación. No se crea una nueva, pero el candidato definitivo queda registrado para usarlo cuando se agregue.

## Detalles técnicos

**Base de datos** (migración aditiva, sin tocar las tablas actuales):
- Nueva tabla `decision_preseleccion`: `id`, `ejecucion_id` → `ejecuciones` ON DELETE CASCADE, `candidato_id` → `cargos` ON DELETE CASCADE, `scores_utilizados jsonb`, `created_at`, con UNIQUE `(ejecucion_id, candidato_id)` e índice por `ejecucion_id`.
- Incluye GRANT solo a service_role y RLS activado, igual que el resto de las tablas.
- `decisiones` no cambia: `candidato_id` sigue siendo el candidato definitivo y se mantiene una fila por ejecución.
- "Eliminar datos" la limpia en cascada al borrar las ejecuciones.

**Server functions** (`src/lib/homologacion.functions.ts`):
- `guardarPreseleccion` (POST: `ejecucion_id`, `candidato_ids[]`). Valida que haya al menos uno y que todos estén en `resultados` de esa ejecución. Se rechaza si ya existe una decisión. Reemplaza el conjunto y guarda la copia de los scores de cada candidato.
- `getPreseleccion` (GET: `ejecucion_id`). Devuelve los preseleccionados con cargo, empresa, scores y bandas (`p25, p50, p75, promedio, fuente, anio, tipo_empresa`).
- `guardarDecision`: si existe preselección, exige que el candidato definitivo esté en ella. Si no existe, acepta el caso antiguo. El resto no cambia: upsert por `ejecucion_id`, `tamano_empresa`, `scores_utilizados` y sin tocar scores.
- `getEjecucion`: agrega `preseleccion` (lista con cargo y scores) para el historial. Las bandas del benchmark final siguen cargándose solo si hay decisión.

**UI:**
- `src/components/decision-form.tsx`:
  - `CandidatoDecision` agrega `score_deterministico`, `score_semantico` y `score_final`.
  - El formulario pasa a tener dos etapas: casillas con los scores, y después la comparación apilada con un radio para el definitivo.
  - La etapa 2 lee `getPreseleccion` con la query `["preseleccion", ejecucionId]`. Al guardar invalida `["ejecucion", id]`.
  - Usa las clases que ya existen (`score-table`, `score-row`, `benchmark-table`) y utilidades de Tailwind.
- `src/routes/homologacion.nueva.tsx` (paso 5): pasa los tres scores de cada candidato desde el motor y el análisis IA. El `BenchmarkPanel` final solo aparece con una decisión guardada.
- `src/routes/historial.$id.tsx`: pasa los scores al formulario y muestra la lista de preseleccionados en modo lectura, con el definitivo destacado, cuando existe.

**Documentación:** se actualizan `docs/03-flujo-homologacion.md`, `docs/04-base-de-datos.md` y la sección de decisión del README.

**Verificación:** typecheck limpio, build OK y revisión de que el historial antiguo abre sin errores. No se harán llamadas a Gemini.
