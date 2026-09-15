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
| `score_final` | Consolidado | Hoy equivale al score del motor |

Si Gemini falla, los scores determinísticos **no se alteran**: el análisis queda registrado con
estado `ERROR` y su mensaje, y la homologación sigue siendo utilizable.
