# Capa de análisis semántico con Gemini

Se agrega una segunda etapa opcional después del motor determinístico. El motor sigue siendo la autoridad: Gemini solo interpreta los candidatos ya preseleccionados y nunca altera el ranking ni los scores determinísticos.

## Flujo

```text
cargo interno -> motor determinístico -> preseleccionados
   -> función de servidor segura -> Gemini Flash (JSON Schema)
   -> validación -> persistencia -> interfaz
```

## Decisiones acordadas

- Se usará tu propia clave `GEMINI_API_KEY` (te pediré el secreto) con el SDK oficial de Google.
- `score_final` se mantiene igual al determinístico. El `score_semantico` se guarda y se muestra por separado, sin combinarse.
- Solo se envían a Gemini los candidatos preseleccionados; nunca descartados, nunca la base completa, nunca información salarial.

## Cambios en la base de datos

Nueva tabla `analisis_semanticos` (una fila por ejecución):
- ejecución asociada, modelo utilizado, versión de prompt (`semantic-1`), fecha
- estado (`OK`, `ERROR`), mensaje de error cuando falla
- candidatos enviados, respuesta cruda y respuesta validada

En `resultados` se completa el `score_semantico` existente por candidato cuando el análisis es válido. No se toca `score_deterministico` ni `score_final`.

## Backend

Nota técnica: este proyecto es TanStack Start, donde la lógica interna se implementa como función de servidor (`createServerFn`), equivalente segura a una Edge Function. La clave vive solo en el entorno del servidor: nunca en el navegador, ni en variables `VITE_`, ni en la base, ni en logs.

Nuevo módulo `src/lib/semantica.server.ts`:
- Construye el payload: cargo interno (nombre, descripción, tamaño de empresa) y candidatos preseleccionados (id, nombre, descripción, tamaño de empresa). Sin sueldos.
- Instrucción de sistema exactamente con las restricciones indicadas (no inventar cargos ni atributos, no usar información externa, no recomendar remuneraciones, evaluar propósito, funciones, responsabilidades, conocimientos, complejidad, autonomía y alcance).
- Llama al modelo Gemini Flash con `responseSchema` (Structured Output) y el id de modelo configurable por constante/variable de entorno en backend.
- Validación estricta antes de guardar: estructura completa, `candidato_recomendado_id` dentro de los enviados, todos los evaluados pertenecen a los enviados, sin ids desconocidos, sin candidatos faltantes, scores 0–100, confianza 0–1.

Nueva función de servidor `analizarSemantica({ ejecucion_id })` en `src/lib/homologacion.functions.ts`:
- Relee de la base los resultados persistidos de esa ejecución (que por diseño son solo los preseleccionados) y arma explícitamente la lista de candidatos.
- Si falta `GEMINI_API_KEY`, corta solo esta etapa con un mensaje claro; los resultados determinísticos quedan intactos.
- Ante error, timeout o validación fallida: registra el análisis con estado de error, no escribe `score_semantico`, no altera nada determinístico y devuelve el mensaje al usuario.

## Interfaz

- En **Nueva homologación**: botón "Analizar semánticamente con Gemini", habilitado solo cuando hay preseleccionados. Muestra candidato recomendado, confianza, explicación breve y, por candidato, score semántico con similitudes y diferencias. Si falla, aviso claro sin borrar lo determinístico.
- En **Historial → detalle**: la columna "Semántico" ya existente muestra el score guardado, más un bloque con recomendación, confianza y explicación cuando hay análisis.

Sin dashboards, gráficos ni rediseños.

## Verificación final

- Comprobar con datos de prueba temporales que el payload enviado contiene únicamente los ids preseleccionados (registro de candidatos enviados) y ningún descartado.
- Comprobar el caso de fallo (clave inválida) y confirmar que los resultados determinísticos y su orden permanecen sin cambios.
- Limpiar los datos de prueba al terminar.
