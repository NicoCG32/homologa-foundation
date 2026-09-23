# Benchmark final: sólo valores de la encuesta

Ajuste acotado a `src/components/benchmark-panel.tsx`. No se tocan motor, Gemini, `decision-form.tsx`, datos, scores, lógica de homologación, pantallas ni estilos generales.

## Cambios en el panel

1. **Ficha superior (`<dl>`)** — sin cambios: sigue mostrando cargo interno, cargo confirmado, fuente, año y remuneración actual (queda sólo como dato informativo).

2. **Tabla** — en vez de 5 filas con columna de diferencias, quedan 4 filas:
   - P25, P50 (mediana), P75, Promedio/PP.
   - Columnas: Indicador y Valor con el valor exacto (formato es-CL sin redondeo); sin columna "Diferencia con la remuneración actual". Valores ausentes siguen como "No disponible".
   - La fila "Remuneración actual" desaparece de la tabla.

3. **Gráfico de barras** — sólo 4 barras: P25, P50, P75 y Promedio/PP, con valores exactos. Desaparece la barra "Actual" y el coloreado especial de la remuneración (todas las barras usan el color de encuesta). Se conservan los recuadros inferiores "Empresa/Encuesta" y el Tooltip con valores exactos.

## Detalles técnicos

- `filas` pierde la entrada "Remuneración actual" y su campo `corta === "Actual"` deja de usarse; se elimina el uso de `sueldoInterno` en tabla/gráfico (queda sólo en el `<dl>`).
- `datosGrafico` ya no necesita la marca `actual`; las `Cell` pasan todas a `var(--chart-2)`.
- La tabla pierde la tercera columna `<th>/<td>` de diferencias y la lógica `dif`/`actual`.
- `src/styles.css` no se modifica: la regla `tr.is-current` queda sin efecto (inofensiva); la alineación a la derecha de la columna Valor sigue aplicando.

## Sin cambios

- `getEjecucion`, `setTamanoBenchmark`, `guardarDecision`, motor, Gemini, `decision-form.tsx`, rutas, base de datos.
