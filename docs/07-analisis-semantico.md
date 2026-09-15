# 07 · Análisis semántico (Gemini)

`src/lib/semantica.server.ts`. Modelo: `GEMINI_MODEL` (por defecto `gemini-3.6-flash`) mediante el
SDK oficial `@google/genai`. Versión de prompt: `semantic-1`.

## Límites no negociables

- Gemini recibe **sólo** los candidatos preseleccionados y persistidos por el motor.
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
  "cargo_interno": { "nombre": "...", "descripcion": "...", "tipo_empresa": "G",
                     "atributos_semanticos": { "proposito": "", "funciones": "", "…": "" },
                     "experiencia_requerida": "", "requisitos_formacion": "" },
  "candidatos_preseleccionados": [ { "id": "…", "…": "…" } ]
}
```

Los siete atributos semánticos se normalizan siempre: lo que falta viaja como cadena vacía, y la
instrucción de sistema obliga a tratarlo como limitación (baja la confianza), nunca a completarlo.

## Qué se recibe

Structured Output con esquema JSON estricto: `candidato_recomendado_id`, `score_semantico` (0–100),
`confianza` (0–1), `similitudes`, `diferencias`, `explicacion_breve` y `scores_por_candidato` con
**todos** los candidatos enviados. Temperatura 0.

## Validación en el backend

`validarAnalisis` rechaza la respuesta si:

- el candidato recomendado no está entre los enviados;
- aparece un candidato desconocido o repetido;
- falta algún candidato en `scores_por_candidato`;
- algún score cae fuera de 0–100 o la confianza fuera de 0–1;
- la respuesta no es JSON válido.

## Persistencia y degradación

Cada intento queda en `analisis_semanticos` con estado `OK` o `ERROR`, el modelo, la versión de
prompt, los candidatos enviados y la respuesta cruda. Si el análisis falla (sin clave, error de red,
respuesta inválida) se muestra el motivo en pantalla y la homologación determinística sigue intacta.

Requiere el secreto **`GEMINI_API_KEY`** en el backend; sin él, el paso IA informa la falta y no
rompe el flujo.
