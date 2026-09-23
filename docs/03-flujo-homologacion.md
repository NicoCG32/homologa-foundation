# 03 · Flujo de homologación

## Recorrido del profesional

```text
Cargo  →  Revisión  →  Candidatos  →  Análisis IA  →  Decisión
  ↑__________ botón "Atrás" disponible en cada paso __________|
```

1. **Cargo** — se elige el cargo interno a homologar (se muestra código · nombre · tipo · empresa).
2. **Revisión** — se verifican los datos del cargo y, opcionalmente, se ajusta la ponderación
   de esta homologación con los sliders (sin alterar la configuración global).
3. **Candidatos** — el motor determinístico calcula y ordena los candidatos de referencia.
4. **Análisis IA** — se envían sólo los preseleccionados a Gemini y se obtiene el score semántico.
5. **Decisión** — el profesional elige el cargo homologado; queda registrado en el historial.

### Requisitos previos

Si falta algo para homologar, la pantalla muestra un aviso con enlace directo a la pestaña
correspondiente:

| Falta | Ir a |
|-------|------|
| No hay cargos internos | `/cargos` |
| No hay catálogo de referencia | `/cargos` |
| No hay criterios configurados | `/criterios` |
| Toda la ponderación está en 0% | `/criterios` |

## Flujo técnico

```text
UI (homologacion.nueva.tsx)
  └─ ejecutarHomologacion({ cargo_id, pesos })       src/lib/homologacion.functions.ts
       ├─ lee cargo interno + cargos REFERENCIA + criterios
       ├─ aplica los pesos de esta ejecución (peso 0 ⇒ criterio no participa)
       ├─ ejecutarMotor()                            src/lib/motor.server.ts
       ├─ INSERT ejecuciones (criterios_usados = pesos aplicados)
       └─ INSERT resultados  (score_deterministico, score_final)

  └─ analizarSemantica({ ejecucion_id })
       ├─ relee SÓLO los resultados persistidos (preseleccionados)
       ├─ construirPayload() sin sueldo              src/lib/semantica.server.ts
       ├─ analizarConGemini() con Structured Output
       ├─ validarAnalisis() contra los IDs enviados
       ├─ INSERT analisis_semanticos (OK | ERROR + respuesta cruda)
       └─ UPDATE resultados.score_semantico
```

## Scores

| Score | Origen | Estado actual |
|-------|--------|---------------|
| `score_deterministico` | Motor, 0–1 | Calculado siempre |
| `score_semantico` | Gemini, 0–100 | Sólo si el análisis IA se ejecuta con éxito |
| `score_final` | Híbrido, 0–1 | `det × peso_motor + (sem/100) × peso_ia` |

La ponderación por defecto es **70% motor / 30% IA**, editable en **Criterios** (ambas partes suman
100%) y almacenada en `configuracion.pesos_score`.

Si Gemini falla, los scores determinísticos **no se alteran**: el análisis queda registrado con
estado `ERROR` y su mensaje, el `score_final` queda en `NULL` (se muestra "Pendiente") y la
homologación sigue siendo utilizable.

## Decisión del analista y benchmark

Tras el análisis IA la decisión (`DecisionForm`) tiene dos etapas:

1. **Preselección múltiple** — `guardarPreseleccion` guarda N candidatos en `decision_preseleccion`
   (con copia de sus scores). Se puede rehacer mientras no exista decisión definitiva. El candidato
   sugerido por Gemini sólo se etiqueta.
2. **Selección final** — `getPreseleccion` devuelve los preseleccionados con sus scores y bandas; se
   muestran apilados para el tamaño elegido (sólo informativo). El analista elige uno y
   `guardarDecision` lo registra en `decisiones` (una fila por ejecución): candidato, decisión,
   comentario, analista, fecha, tamaño y scores vigentes. Si hay preselección, el definitivo debe
   pertenecer a ella; las decisiones antiguas sin preselección siguen siendo válidas.

Ninguna etapa modifica scores. `getEjecucion` sólo devuelve las bandas del benchmark final cuando
existe decisión, y devuelve `preseleccion` para mostrarla en el historial.

### Benchmark por tamaño de empresa

El analista elige el tamaño (`P`/`M`/`G`) al confirmar, o desde el propio panel; queda guardado en
`decisiones.tamano_empresa` (`setTamanoBenchmark`). El panel muestra **un solo tamaño a la vez**:
cargo interno, cargo de referencia confirmado, tamaño seleccionado, fuente, año, P25, P50, P75,
promedio, remuneración actual del cargo interno y las diferencias informativas frente a cada valor
de mercado. Todo dato ausente se muestra como "No disponible"; nunca se estima ni se interpola, y
la remuneración no participa en ningún score ni en la selección de candidatos.

