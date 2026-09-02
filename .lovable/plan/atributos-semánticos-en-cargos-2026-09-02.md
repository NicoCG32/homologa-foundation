# Atributos semánticos en cargos

Gemini hoy solo recibe nombre, descripción y tamaño de empresa. Se agrega un campo estructurado con los 7 atributos que debe evaluar, y se envían tanto del cargo interno como de los candidatos preseleccionados.

## Base de datos

Nueva columna en `cargos`:

- `atributos_semanticos jsonb not null default '{}'::jsonb`

Contiene exactamente estas 7 propiedades de texto: `proposito`, `funciones`, `responsabilidades`, `conocimientos`, `complejidad`, `autonomia`, `alcance`. Los cargos existentes quedan con objeto vacío; nada se inventa.

No se toca ninguna otra tabla ni la tabla `criterios`, por lo que el motor determinístico sigue igual.

## Interfaz de cargos

En el formulario de cargos se agrega un bloque plegable "Atributos semánticos" con 7 campos de texto multilínea, uno por atributo, todos opcionales. Se guardan junto con el cargo. En el listado se muestra solo una indicación breve de cuántos atributos están completos, sin rediseñar la tabla.

## Backend semántico

- `CargoSemantico` incorpora `atributos_semanticos` con las 7 claves (cadena vacía cuando falta).
- `construirPayload()` incluye los atributos del cargo interno y de cada candidato, normalizando siempre las 7 claves; los vacíos se envían como cadena vacía.
- La lectura en `analizarSemantica` agrega `atributos_semanticos` al select del cargo interno y de los candidatos, sin cambiar de dónde salen los candidatos (siguen siendo únicamente los `resultados` preseleccionados) ni enviar sueldos.
- La instrucción de sistema se ajusta mínimamente para indicar que los atributos vacíos son información faltante: deben reflejarse como limitación y reducir la confianza, nunca completarse.

## Sin cambios

Motor determinístico, `score_deterministico`, `score_final`, filtrado de candidatos, clave de API y estructura general de la integración (schema de salida, validación, persistencia, UI de resultados).

## Verificación

Crear datos temporales con atributos completos y parciales, ejecutar homologación y análisis semántico, confirmar en `analisis_semanticos` que el payload lleva los atributos y solo los preseleccionados, y limpiar los datos de prueba.
