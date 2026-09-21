# Experiencia y formación normalizadas antes de comparar

Se trabaja sobre lo existente. No se rehace la carga, ni el historial, ni la integración con Gemini, ni el motor completo. Solo cambia cómo se comparan experiencia y formación, y se saca el tamaño de empresa del cálculo.

## 1. Normalización previa con Gemini

Antes de comparar, el texto original de experiencia y de formación se convierte en una ficha mínima:

- Experiencia: años mínimos, años máximos, áreas.
- Formación: nivel, áreas, carreras.

Reglas que se respetan: Gemini solo traduce el texto a esa ficha, no decide equivalencias ni entrega puntaje; nada se inventa; lo que no aparece queda vacío o sin valor; el texto original se conserva intacto y se sigue mostrando; se usan términos consistentes para que después se puedan comparar.

La ficha se guarda junto al cargo para no volver a pedirla. Solo se vuelve a pedir si el texto original cambia. En una homologación se pide de una sola vez para todos los cargos que aún no la tengan, y si la normalización falla se sigue adelante comparando el texto tal como hoy, avisando en pantalla.

No se crea ninguna tabla nueva: la ficha se guarda dentro del campo de atributos que ya existe en cada cargo.

## 2. Motor

Solo cambian dos comparaciones:

- Experiencia: se compara el rango de años (traslape total, parcial o sin traslape) y las áreas de experiencia. Si no hay ficha, se compara el texto como hoy.
- Formación: se compara el nivel (igual, contiguo o distinto), las áreas y las carreras. Si no hay ficha, se compara el texto como hoy.

Todo lo demás del motor queda igual: pesos, criterios obligatorios, descarte, dato faltante que nunca cuenta como coincidencia, orden estable. El motor sigue siendo el único que calcula el score.

## 3. Tamaño de empresa fuera del motor

- Deja de existir como criterio comparable: no aparece en la pantalla de criterios ni en la ponderación.
- No se usa para elegir candidatos, descartar ni puntuar.
- El criterio ya guardado se conserva como registro pero queda en 0% e inactivo, para no romper el historial.
- El tamaño de empresa se mantiene tal cual en las empresas y en las bandas salariales, reservado para el benchmark salarial posterior.

## 4. Gemini de homologación

El análisis semántico deja de recibir el tamaño de empresa y sigue sin recibir información salarial. Se mantienen separadas las tres etapas: normalizar, puntuar con el motor, interpretar semánticamente.

## 5. Interfaz

Sin pantallas nuevas. Cambios mínimos: la lista de criterios ya no muestra tamaño de empresa, y en el paso de revisión se ve, bajo "mostrar detalle", la ficha normalizada de experiencia y formación junto al texto original.

## Detalle técnico

- `src/lib/normalizacion.server.ts` (nuevo): llamada a Gemini con esquema JSON estricto para experiencia y formación en lote, validación de la respuesta, y huella del texto original para invalidar la caché.
- Persistencia sin migración: `cargos.atributos_semanticos` gana las claves `_exp_norm` y `_form_norm` (cada una con su huella del texto). `normalizarAtributos` en `semantica.server.ts` ya devuelve solo las 7 claves, así que Gemini de homologación no ve estas fichas.
- `src/lib/motor.server.ts`: se quita el caso `tipo_empresa` y su tipo; los casos `experiencia` y `requisitos` usan la ficha normalizada cuando existe, con respaldo textual. `CargoMotor` suma `experiencia_norm` y `formacion_norm`.
- `src/lib/criterios.functions.ts`: `tipo_empresa` sale de `CriterioCampo`/`CAMPOS_CRITERIO`; `asegurarCriterios` lo desactiva si existe.
- `src/lib/homologacion.functions.ts`: antes del motor, normaliza los cargos que falten y persiste el resultado; el `select` y `toMotor` dejan de pasar `empresa_tipo`; el análisis semántico deja de enviar `tipo_empresa`.
- `src/lib/semantica.server.ts`: se quita `tipo_empresa` del payload y del tipo.
- `src/routes/criterios.tsx`, `src/routes/homologacion.nueva.tsx`: ajustes menores de listado y detalle.
- Migración mínima: dejar los criterios `campo = 'tipo_empresa'` en `peso = 0, activo = false`.

## Verificación

Se normalizan con Gemini algunos textos reales de experiencia y formación de los cargos ya cargados y se revisa que las fichas correspondan al texto sin inventar nada; luego se corre una homologación completa comprobando que el score no considere tamaño de empresa y que el historial anterior se abra sin error.
