# Benchmark sin remuneración actual + exportación a Excel del historial

Dos cambios acotados sobre lo ya existente. No se toca el motor, Gemini, los scores, el flujo de decisión ni se crean pantallas nuevas. No se recalcula nada: todo sale de lo ya guardado.

## 1. Benchmark final (`src/components/benchmark-panel.tsx`)

- La ficha superior deja de mostrar "Remuneración actual"; quedan cargo interno, cargo de referencia confirmado, fuente y año.
- El gráfico pierde la barra "Empresa Ficticia": quedan exactamente 4 barras (P25, P50, P75, PP) con el color de encuesta y sus valores exactos.
- Los recuadros inferiores pasan a ser 4 + la etiqueta "Encuesta".
- La tabla no cambia: P25, P50, P75, Promedio/PP, sin columna de diferencias.
- Se mantiene el selector de tamaño de empresa, "No disponible" para datos ausentes y el tooltip con valores exactos.
- `sueldoInterno` deja de usarse en el panel (la prop se conserva para no tocar las pantallas que lo llaman).

## 2. Exportar resultados a Excel (`src/routes/historial.$id.tsx`)

- Botón "Exportar resultados" visible sólo cuando la ejecución tiene decisión registrada, junto a la sección de decisión.
- Al pulsarlo se genera el archivo en el navegador con la librería de Excel ya instalada y se descarga como `homologacion_<cargo>_<fecha>.xlsx` (nombre del cargo limpiado de caracteres no válidos, fecha `AAAA-MM-DD`).
- Hoja única `RESULTADOS`, una fila por candidato exportado:
  - Con preselección guardada: sólo los preseleccionados; el elegido en la decisión va como `Definitivo`, el resto como `Preseleccionado`.
  - Sin preselección (ejecuciones antiguas): sólo el candidato de la decisión, como `Definitivo`.
- Columnas (celda vacía cuando el dato no existe):
  - Cargo interno: código, nombre, empresa, área, subárea, nivel.
  - Candidato: código, nombre, empresa, estado de selección.
  - Scores persistidos: motor, Gemini, final.
  - Decisión: analista, fecha, comentario.
  - Análisis IA persistido: confianza, modelo, explicación breve.
  - Benchmark del cargo definitivo: P25, P50, P75, Promedio, fuente, año, tamaño (se repiten en cada fila; vacío si no hay banda para el tamaño elegido).

## Detalles técnicos

- `getEjecucion` en `src/lib/homologacion.functions.ts`: se amplían sólo los `select` para incluir `codigo_cargo, nombre_area, nombre_subarea, nivel_jerarquico` del cargo interno y `codigo_cargo` de los candidatos (en `resultados`, `decision` y `decision_preseleccion`). Sin nuevas consultas ni tablas.
- La exportación se arma en el cliente: `import * as XLSX from "xlsx"` (carga dinámica dentro del manejador del botón), `XLSX.utils.json_to_sheet` + `XLSX.writeFile`. Sin server function nueva.
- Los scores de cada fila salen de `preseleccion[].scores_utilizados`, con respaldo en `resultados` cuando falten; nunca se recalculan.
- El benchmark exportado usa `bandas` filtradas por `decision.tamano_empresa`.
- Sin migraciones ni cambios de estilos generales.

## Verificación

- `bunx tsgo --noEmit` limpio y build sin errores.
- Revisión visual del benchmark (escritorio y móvil) y descarga de prueba del `.xlsx` en una ejecución con decisión, comprobando encabezados, fila definitiva y celdas vacías.
