# Corregir la identidad de los cargos al cargar Excel

## Problema confirmado

Al guardar una planilla, la aplicación busca si el cargo ya existe usando solo **empresa + código**. Por eso, si la misma empresa tiene un `RRHH-001` interno y un `RRHH-001` de referencia, el segundo pisa al primero en vez de crearse aparte.

También falta una regla en la base que impida esa confusión: hoy nada garantiza que un mismo código no se duplique ni que dos catálogos distintos convivan.

## Qué se corrige

1. **Identidad del cargo = tipo + código + empresa.** Al cargar una planilla, la búsqueda de "¿este cargo ya existe?" incluirá también el tipo (interno o referencia). Así un `RRHH-001` interno y un `RRHH-001` de referencia de la misma empresa son dos registros distintos, cada uno con su identificador propio.

2. **Regla en la base de datos.** Se agrega una restricción que impide repetir la combinación empresa + tipo + código, y permite sin problema el mismo código en tipos distintos.

3. **Bandas salariales.** Se asocian al cargo correcto (el de referencia recién identificado), sin mezclar con un interno del mismo código.

4. **Vista previa.** En cada tarjeta se indicará si la fila es interna o de referencia y si va a crear o actualizar un cargo existente, para que se vea antes de guardar.

5. **Selección de cargo para homologar y listados.** Se muestra el código junto al tipo y la empresa, para que dos cargos con el mismo código sean distinguibles a simple vista. Las búsquedas siguen funcionando por código, nombre y empresa.

Los códigos de los Excel no se tocan: se guardan y se muestran tal como vienen.

## Lo que no se toca

Motor de homologación, análisis con Gemini, datos ya guardados (nada se borra ni se renumera), y el resto de la interfaz.

## Detalle técnico

- Migración: índice único `(empresa_id, tipo, codigo_cargo)` en `cargos`, parcial sobre `codigo_cargo IS NOT NULL`. Antes de crearlo se revisa si hay filas que ya colisionan; si existieran, se informa en vez de forzar el cambio.
- `importarCargos` (`src/lib/cargos.functions.ts`): la consulta de existencia agrega `.eq("tipo", input.tipo)`; el mapa `ids` que enlaza bandas pasa a estar cabeceado por `tipo|codigo_cargo`.
- `leerCargos` (`src/lib/cargos-import.ts`): la detección de código repetido dentro del archivo se mantiene (un archivo es de un solo tipo) y se aclara el mensaje.
- `src/routes/cargos.tsx`: la tarjeta de vista previa muestra una etiqueta de tipo y el estado nuevo/actualiza, calculado contra los cargos ya cargados.
- `src/routes/homologacion.nueva.tsx` y listado de cargos: la etiqueta del cargo incluye código + tipo + empresa.

## Verificación

Se carga una planilla interna y una de referencia con el mismo código `RRHH-001` en la misma empresa y se comprueba que quedan dos cargos separados, cada uno con sus datos, y que al elegir cargo para homologar aparecen diferenciados.
