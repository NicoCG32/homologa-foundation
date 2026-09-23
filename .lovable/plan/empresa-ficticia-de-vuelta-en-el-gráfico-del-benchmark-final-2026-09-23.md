# Empresa Ficticia de vuelta en el gráfico del benchmark final

Ajuste acotado a `src/components/benchmark-panel.tsx`. No se tocan motor, Gemini, `decision-form.tsx`, base de datos, otras pantallas ni estilos generales.

## Cambios en el gráfico

- `datosGrafico` vuelve a tener 5 entradas, con la remuneración actual primero:
  1. `Empresa Ficticia` → `num(sueldoInterno)` (puede ser null si no hay dato)
  2. `P25`, `P50`, `P75`, `PP` → valores de la banda de mercado
- Color de las barras: `Empresa Ficticia` usa `var(--primary)`; las cuatro de encuesta usan `var(--chart-2)` (igual que el diseño aprobado anteriormente).
- El `Tooltip` sigue mostrando el valor exacto sin redondeo; si la remuneración actual no existe, esa barra simplemente no se dibuja y el recuadro inferior queda vacío.
- Los recuadros inferiores (`benchmark-chart-boxes`) se generan mapeando `datosGrafico`, así que pasan a ser 5 recuadros + la etiqueta fuerte `Encuesta`, igual que en la imagen de referencia.

## Lo que NO cambia

- Tabla: sigue con las 4 filas (P25, P50, P75, Promedio/PP) y sin columna de diferencias.
- Ficha superior (`<dl>`): sigue mostrando la remuneración actual como dato informativo.
- Fuente, año y selector de tamaño: igual que están.
- La remuneración de Empresa Ficticia es sólo visual: no entra en scores, motor ni decisión (ya es así; no se agrega lógica).
- `src/styles.css` no se modifica.

## Verificación

- `bunx tsgo --noEmit` limpio.
- Revisión visual del gráfico en el historial (desktop y móvil) con Playwright.
