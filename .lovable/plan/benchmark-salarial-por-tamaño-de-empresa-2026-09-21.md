# Benchmark salarial por tamaño de empresa

Ajusta solo lo que ocurre después de confirmar la homologación. No se tocan el motor, Gemini, los criterios ni la carga de cargos.

## Cómo quedará el flujo

1. El analista confirma el cargo de referencia (igual que hoy).
2. Elige el tamaño de empresa: Pequeña, Mediana o Grande.
3. Se muestra el benchmark **solo** de ese tamaño, nunca los tres a la vez.
4. El tamaño elegido queda guardado con la decisión, así que al volver al historial se ve el mismo.

## Qué muestra el benchmark

Una ficha con: cargo interno · cargo de referencia confirmado · tamaño seleccionado · fuente · año · P25 · P50 · P75 · promedio · remuneración actual del cargo interno (si existe) · diferencias informativas respecto de cada valor de mercado.

Cualquier dato que no exista aparece como "No disponible". No se estima ni se interpola nada, y la remuneración sigue sin participar en ningún puntaje ni en la selección de candidatos.

## Fuente y año

Al subir la planilla de remuneraciones se pedirán dos campos: fuente (texto, por ejemplo "Encuesta Piloto") y año. Quedan guardados junto a cada banda cargada. Las bandas ya cargadas antes de este cambio mostrarán "No disponible" hasta que se vuelvan a subir.

## Detalles técnicos

Migración aditiva:
- `bandas_salariales`: columnas nuevas `fuente TEXT NULL`, `anio INTEGER NULL`.
- `decisiones`: columna nueva `tamano_empresa empresa_tipo NULL`.

`src/lib/homologacion.functions.ts`
- `getEjecucion` devuelve las bandas del candidato confirmado con `fuente` y `anio`, y el `tamano_empresa` de la decisión.
- `guardarDecision` acepta `tamano_empresa` opcional y lo persiste.
- Nueva `setTamanoBenchmark` (POST: `ejecucion_id`, `tamano_empresa`) para cambiar el tamaño después de confirmar, sin tocar scores.

`src/components/decision-form.tsx`
- Se agrega un selector de tamaño (Pequeña/Mediana/Grande) enviado junto con la decisión.

`src/components/benchmark-panel.tsx` (nuevo)
- Recibe cargo interno, cargo confirmado, bandas y tamaño; renderiza la ficha de una sola columna de tamaño con selector para cambiarlo y "No disponible" en cada campo ausente. Responsive para celular.

`src/routes/historial.$id.tsx`
- La sección "Comparación salarial" pasa a usar `BenchmarkPanel` (sigue apareciendo solo tras la decisión).

`src/routes/homologacion.nueva.tsx`
- Paso 5: tras confirmar, se muestra el mismo panel.

`src/lib/cargos-import.ts` y `src/routes/cargos.tsx`
- `leerBandas` propaga fuente y año recibidos desde la pantalla de carga; dos campos nuevos en el panel de remuneraciones (sin cambiar el formato de la planilla).

Documentación: se actualiza `docs/03-flujo-homologacion.md` y `docs/04-base-de-datos.md`.
