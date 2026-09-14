# Carga con empresas automáticas y vista previa en tarjetas

## Objetivo
Que al cargar planillas el sistema reconozca las empresas por sí mismo, cree las que falten y muestre una vista previa visual en tarjetas antes de guardar nada.

## Qué cambia

### 1. Empresas automáticas
- Las planillas de cargos de empresa pueden incluir las columnas **Empresa** y **Tamaño** (P, M o G; también se aceptan "Pequeña", "Mediana", "Grande").
- Por cada fila se busca la empresa por nombre (sin distinguir mayúsculas ni tildes):
  - Si existe, se usa esa.
  - Si no existe, se crea con el tamaño indicado (si falta el tamaño, se marca como observación y la fila usa la empresa elegida en pantalla, si hay una).
- El selector manual de empresa se mantiene: sirve como destino cuando la planilla no trae columna de empresa, y se ignora cuando sí la trae.
- Para el catálogo de la encuesta se crea automáticamente una empresa de referencia llamada "Encuesta Piloto"; si ya existe, se reutiliza. No se pide nada al usuario.

### 2. Vista previa en tarjetas
- Antes de guardar, se muestran tarjetas con el detalle completo de cada cargo detectado:
  - Nombre y código del cargo.
  - Empresa asignada, con una marca visible de **nueva** o **existente**, y su tamaño.
  - Área y subárea (código y nombre), nivel jerárquico.
  - Descripción, experiencia requerida y requisitos de formación.
  - Bandas salariales cruzadas (P25, P50, P75, promedio por tamaño) cuando corresponda.
- Encabezado con el resumen: cargos válidos, empresas nuevas a crear, bandas encontradas y observaciones.
- Las filas con problemas se muestran como tarjeta marcada y no se guardan.
- El botón de guardar solo se habilita después de revisar la vista previa.
- Buscador simple y despliegue por páginas para no listar cientos de tarjetas de golpe.

### 3. Guardado
- Al confirmar, primero se crean las empresas faltantes y luego se cargan los cargos con su empresa correcta.
- Los duplicados se siguen resolviendo por empresa + código de cargo: se actualizan en vez de duplicarse.
- El resultado informa empresas creadas, cargos nuevos, actualizados y bandas guardadas.

## Detalles técnicos
- `src/lib/cargos-import.ts`: leer columnas Empresa y Tamaño, normalizar nombre/tamaño, devolver por fila la empresa detectada y las observaciones; plantilla descargable con las dos columnas nuevas.
- `src/routes/cargos.tsx`: reemplazar la vista previa de texto por una grilla de tarjetas (`.import-cards`) con estado nueva/existente, filtro y paginación; el botón guardar depende de la confirmación.
- `src/lib/cargos.functions.ts`: `importarCargos` acepta empresa por fila (id existente o nombre + tamaño a crear), resuelve/crea empresas dentro del handler antes de insertar cargos, y devuelve también `empresas_creadas`.
- `src/styles.css`: estilos de tarjetas de vista previa, con adaptación a móvil.
- No se tocan el motor determinístico, el análisis semántico ni las reglas de remuneración (siguen siendo solo informativas).

## Verificación
- Revisión de compilación y lectura de errores, sin pruebas manuales ni llamadas a Gemini.
