# 05 · Importación de planillas

Módulo puro: `src/lib/cargos-import.ts`. Persistencia: `importarCargos` en `src/lib/cargos.functions.ts`.
Lectura de archivos con `xlsx` (acepta `.xlsx` y `.csv`).

## Fuentes del piloto

| Archivo | Rol | Modo de carga |
|---------|-----|---------------|
| **Cargos Empresa** | Cargos internos a homologar | Empresa (`INTERNO`) |
| **Encuesta Piloto** | Catálogo de cargos de referencia | Catálogo (`REFERENCIA`) |
| **Encuesta Piloto Remuneraciones** | Bandas por tamaño de empresa | Se cruza por `ID Cargo` |

## Lectura

- **Encabezados flexibles:** se reconocen variantes como `ID Cargo`, `Código Cargo`,
  `Código del cargo`, y se aceptan filas de título antes del encabezado.
- **Mapeo de atributos semánticos:** `Objetivo del cargo` → propósito, `Funciones principales` →
  funciones, `Responsabilidades` → responsabilidades. Las claves restantes viajan vacías si no hay dato.
- **Remuneración:** `Rem. Bruta Mensual` se guarda como sueldo **informativo**. Celda vacía = `NULL`.
- **Hoja `Diccionario`:** si el archivo la trae, se ofrece agregar sus códigos al diccionario
  (nunca pisa entradas existentes).
- **Bandas:** `leerBandas` cruza los percentiles por `${tipo}|codigo_cargo` contra el catálogo.

## Empresas automáticas

- Si la planilla trae columnas `Empresa` y `Tamaño` (`P`/`M`/`G` o Pequeña/Mediana/Grande) se usan.
- La búsqueda de empresa ignora mayúsculas y tildes; si existe se reutiliza, si no se crea.
- Sin columna de tamaño, la empresa se crea con tamaño pendiente y aparece con advertencia en Empresas.
- El catálogo usa la empresa `Encuesta Piloto` (tipo `G`), reutilizada si ya existe.

## Diccionario y nombres

`aplicarDiccionario` resuelve los nombres de área, subárea y nivel a partir del **código**.
Que el diccionario diga "Compensaciones y Beneficios" y la encuesta "Compensaciones" **no es un
error**: manda el código y se conserva el nombre original de cada fuente. Sólo se avisa cuando el
código no existe en el diccionario.

## Resumen de validación (antes de guardar)

✓ cargos internos detectados · ✓ cargos de referencia detectados · ✓ registros de remuneraciones ·
✓ IDs con remuneración · ⚠ datos faltantes · ⚠ duplicados · ⚠ inconsistencias.

**Bloquea la carga** sólo una inconsistencia estructural real:

- falta el código o el nombre del cargo;
- código repetido dentro de la misma planilla;
- fila sin empresa asignable.

Las filas con aviso (no bloqueante) se guardan; el resto del archivo nunca se descarta por un aviso.

## Escritura

`importarCargos` procesa en lotes de 2000 filas, hace *upsert* por `empresa_id + tipo + codigo_cargo`
y guarda bandas por `cargo_id + tipo_empresa`. Devuelve creados, actualizados, empresas y bandas.
Los códigos originales del Excel nunca se modifican.
