# 12 · Resiliencia de la IA

La plataforma asume que el proveedor de IA puede estar saturado o sin cuota, y protege el trabajo del
analista en tres niveles.

## 1 · Reintentos ante errores transitorios

`src/lib/gemini-retry.server.ts`.

Se considera transitorio un error cuyo mensaje, `status` o `code` contenga `429`, `500`, `502`,
`503`, `504`, `UNAVAILABLE`, `high demand`, `overload` o `RESOURCE_EXHAUSTED`.

| Intento | Espera antes de reintentar |
|---|---|
| 1.º reintento | ~1 s |
| 2.º reintento | ~2 s |
| 3.º reintento | ~4 s |

A cada espera se le suma un margen aleatorio de 100–300 ms (jitter) para evitar ráfagas
sincronizadas. Agotados los tres reintentos se lanza `ReintentosAgotadosError`. Un error **no**
transitorio (clave inválida, payload mal formado) se propaga de inmediato, sin reintentar.

Se aplica tanto al análisis semántico como a la normalización. Los payloads, el esquema y los scores
no cambian: el reintento repite exactamente la misma llamada.

## 2 · Proveedor de respaldo

`src/lib/groq.server.ts`. Modelo `openai/gpt-oss-120b`, registrado en la base como
`groq/openai/gpt-oss-120b`.

Cuando Gemini agota sus reintentos, la misma solicitud se envía a Groq con **el mismo prompt y el
mismo esquema JSON**. La respuesta pasa por la misma validación. El modelo efectivamente utilizado
queda guardado en `analisis_semanticos.modelo`, de modo que siempre se sabe quién respondió.

Requiere el secreto `GROQ_API_KEY`. Sin él, el respaldo simplemente no se intenta.

## 3 · Mensajes al usuario

Nunca se muestra un error técnico crudo. Durante el paso de análisis la pantalla informa el estado
real:

| Situación | Lo que ve el analista |
|---|---|
| Llamada en curso | "Analizando compatibilidad…" |
| Se activó el respaldo | "Consultando motor de respaldo…" |
| Ambos proveedores fallaron | Aviso explicando que el análisis no está disponible y que los resultados del motor siguen válidos |
| Falta la clave | Aviso de configuración pendiente, sin detalles técnicos |

En todos los casos el resultado determinístico permanece intacto, el `score_final` queda pendiente
y la homologación se puede continuar o reintentar más tarde.

## Origen habitual de los errores 503

En el nivel gratuito de Gemini el límite diario de solicitudes y la prioridad de atención provocan
`503` y `429` en horas de alta demanda. No es un defecto del prompt ni del esquema: por eso la
respuesta correcta es reintentar, conmutar de proveedor e informar con claridad, no simplificar la
metodología.
