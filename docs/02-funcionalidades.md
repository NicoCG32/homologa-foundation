# 02 · Funcionalidades por pestaña

| Ruta | Pestaña | Qué permite |
|------|---------|-------------|
| `/` | Inicio | Punto de entrada "¿Qué cargo quieres homologar?", accesos rápidos y reinicio total de datos |
| `/cargos` | Cargos | Carga masiva desde Excel/CSV, vista previa en tarjetas, listado en columnas, alta y borrado individual |
| `/empresas` | Empresas | Listado, alta manual y definición del tamaño (Pequeña / Mediana / Grande) |
| `/criterios` | Criterios | Ponderación global por columna con sliders, criterios obligatorios, presets y reparto motor/IA del score final |
| `/diccionario` | Diccionario | Áreas, subáreas y niveles jerárquicos editables (código + nombre) |
| `/homologacion/nueva` | Nueva homologación | Flujo por pasos: Cargo → Revisión → Candidatos → Análisis IA → Decisión |
| `/historial` | Historial | Listado de ejecuciones con fecha y estado |
| `/historial/$id` | Detalle | Scores por candidato, criterios usados, análisis IA, decisión, benchmark de mercado y exportación a Excel |

## Inicio

- Mensaje principal y acceso directo a homologar.
- Panel de peligro **Reiniciar datos**: exige escribir `ELIMINAR`; borra resultados, análisis,
  ejecuciones, bandas, cargos y empresas. Conserva diccionario, criterios y presets.

## Cargos

- Dos modos de carga: **Empresa** (cargos internos) y **Catálogo** (cargos de referencia).
- Resumen de validación antes de guardar: cargos detectados, remuneraciones cruzadas, faltantes,
  duplicados e inconsistencias.
- Vista previa en tarjetas con detalle plegable y marca de fila con observación.
- Confirmación explícita ("Revisé la vista previa") antes de escribir en la base.
- Listado tabular por columnas (código, cargo, empresa, tipo, área, sueldo) con detalle bajo demanda
  y borrado por fila. En celular las filas se apilan con etiquetas.

## Empresas

- Aviso ámbar cuando existen empresas sin tamaño definido: quedan fuera de las comparaciones que
  dependen del tamaño (bandas salariales por tamaño).
- El tamaño se ajusta desde la misma fila.

## Criterios

- Un criterio por columna comparable; los sliders se autoajustan para sumar 100%.
- Un criterio en 0% simplemente no se compara.
- Un criterio marcado como obligatorio descarta al candidato que no lo cumple.
- Los presets se guardan con nombre y se reutilizan en cualquier homologación.

## Diccionario

- Tres listas editables (Áreas, Subáreas, Niveles) precargadas.
- No se permiten códigos repetidos dentro de un mismo tipo.
- Al eliminar una entrada en uso se informa cuántos cargos la usan y se pide confirmación; los
  cargos no se modifican.
