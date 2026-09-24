# 07 · Análisis semántico

`src/lib/semantica.server.ts`. Proveedor principal: Google Gemini (`GEMINI_MODEL`, por defecto
`gemini-3.6-flash`) mediante el SDK oficial `@google/genai`. Proveedor de respaldo: Groq
(`src/lib/groq.server.ts`). Versión de prompt: `semantic-1`.

## Límites no negociables

- La IA recibe **sólo** los candidatos preseleccionados y persistidos por el motor.
- **Nunca** recibe sueldos ni bandas salariales.
- No puede agregar candidatos, inventar atributos, completar datos faltantes, modificar reglas ni
  pesos, ni recomendar remuneraciones.
- No altera ningún score determinístico.

## Qué se envía

```json
{
  "criterios_semanticos": ["propósito", "funciones", "responsabilidades", "conocimientos",
                           "complejidad", "autonomía", "alcance",
                           "experiencia requerida", "requisitos y formación"],
  "cargo_interno": { "nombre": "...", "descripcion": "...",
                     "atributos_semanticos": { "proposito": "", "funciones": "", "…": "" },
                     "experiencia_requerida": "", "requisitos_formacion": "" },
  "candidatos_preseleccionados": [ { "id": "…", "…": "…" } ]
}
```

Los siete atributos semánticos se normalizan siempre: lo que falta viaja como cadena vacía, y la
instrucción de sistema obliga a tratarlo como limitación (baja la confianza), nunca a completarlo.
El tamaño de empresa y la remuneración quedan fuera del envío.

## Qué se recibe (salida compacta)

Structured Output con esquema JSON estricto y temperatura 0:

| Campo | Contenido |
|---|---|
| `candidato_recomendado_id` | Uno de los candidatos enviados |
| `score_semantico` | 0–100 |
| `confianza` | 0–1 |
| `explicacion_breve` | Máximo dos oraciones |
| `scores_por_candidato` | `{candidato_id, score_semantico, explicacion_breve}` para **todos** los enviados |

El esquema **no** pide listas de similitudes, diferencias ni riesgos: se eliminaron por ser
redundantes con el detalle del motor y por encarecer cada llamada. `validarRespuesta` admite esos
arrays vacíos por defecto, de modo que los análisis guardados antes del cambio siguen mostrándose.

## Validación en el backend

`validarAnalisis` rechaza la respuesta si:

- el candidato recomendado no está entre los enviados;
- aparece un candidato desconocido o repetido;
- falta algún candidato en `scores_por_candidato`;
- algún score cae fuera de 0–100 o la confianza fuera de 0–1;
- la respuesta no es JSON válido.

Una respuesta inválida no se guarda como resultado: se registra el intento con estado `ERROR`.

## Persistencia y degradación

Cada intento queda en `analisis_semanticos` con estado `OK` o `ERROR`, el modelo utilizado
(`gemini-…` o `groq/openai/gpt-oss-120b`), la versión de prompt, los candidatos enviados y la
respuesta cruda. Si el análisis falla —sin clave, error de red, respuesta inválida, cuota agotada en
ambos proveedores— se muestra el motivo en pantalla, el `score_final` queda pendiente y la
homologación determinística sigue intacta y utilizable.

Requiere el secreto **`GEMINI_API_KEY`**; el respaldo requiere **`GROQ_API_KEY`**. Sin ellos, el paso
de análisis informa la falta y no rompe el flujo. Ver [12 · Resiliencia de la IA](./12-resiliencia-ia.md).
