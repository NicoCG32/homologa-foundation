# Adaptación a los nuevos formatos de carga

## Objetivo
Tomar los dos archivos nuevos como formato oficial del catálogo:

- **Encuesta Piloto**: estructura y descripción del cargo.
- **Encuesta Piloto Remuneraciones**: bandas P25, P50, P75 y promedio por empresa pequeña, mediana y grande.
- Ambos se relacionan por **ID Cargo**.

La carga de cargos propios de una empresa seguirá disponible mediante una plantilla simple compatible con los mismos campos estructurales.

## Qué se construirá

### 1. Carga masiva simple en Cargos
- Agregar un bloque “Cargar datos” con dos opciones:
  - **Cargos de empresa**: archivo CSV/XLSX con los cargos internos y selección de empresa.
  - **Catálogo de encuesta**: los dos archivos nuevos, cargados juntos y relacionados por ID Cargo.
- Aceptar encabezados con espacios, tildes y filas iniciales vacías como en los archivos entregados.
- Mostrar el formato esperado y permitir descargar plantillas.
- Mostrar una vista previa con filas válidas, advertencias y errores antes de guardar.
- No inventar valores faltantes ni cargar filas sin ID/nombre.

### 2. Correspondencia de columnas
- **ID Cargo** → código del cargo.
- **Nombre del Cargo** → nombre.
- **Código/Nombre Área** → área.
- **Código/Nombre Subárea** → subárea.
- **Código Nivel Jerárquico + Nivel Jerárquico** → nivel jerárquico conservando ambos datos.
- **DESCRIPCIÓN** → descripción.
- **P25/P50/P75/PP por tamaño** → bandas salariales separadas, solo informativas y nunca usadas para homologar.

### 3. Datos y seguridad
- Agregar una tabla de bandas salariales vinculada al cargo de catálogo y al tamaño de empresa.
- Mantener la remuneración fuera del score, preselección y análisis con Gemini.
- Evitar duplicados del catálogo mediante empresa de referencia + ID Cargo; una recarga actualizará el registro correspondiente.
- Guardar importaciones en lotes y devolver cantidades cargadas, actualizadas y rechazadas.

### 4. Pesos por homologación
- Mostrar antes de buscar candidatos una tabla editable con cada criterio activo y su peso.
- Validar pesos no negativos y al menos un peso mayor que cero.
- Enviar esa copia de pesos solo a la ejecución actual, sin modificar la configuración general.
- Guardar la configuración usada en la ejecución para que el historial sea reproducible.

### 5. Formación y experiencia en Gemini
- Añadir `experiencia_requerida` y `requisitos_formacion` a la entrada semántica del cargo interno y de cada candidato preseleccionado.
- Los valores vacíos se enviarán vacíos.
- Mantener la restricción: Gemini recibe únicamente candidatos preseleccionados y nunca remuneraciones.

### 6. Resultados claros
- Mostrar por candidato:
  - **Score del motor**.
  - **Score de Gemini** después del análisis.
  - **Score final**, que por ahora será exactamente el score del motor.
- Ordenar inicialmente por score del motor y conservar el mismo resumen en Historial.
- Presentar las bandas salariales solo como información posterior, separada de la homologación.

## Detalles técnicos
- El navegador leerá CSV y XLSX para preparar la vista previa; el servidor volverá a validar cada fila antes de guardar.
- Se ampliará la ejecución para recibir pesos, persistir su copia y entregarlos al cálculo existente sin cambiar sus reglas.
- La importación del catálogo hará un cruce exacto por `ID Cargo` entre ambos archivos.
- Se agregarán migraciones con permisos y políticas consistentes con las tablas actuales.
- Se actualizarán las pantallas Cargos, Nueva homologación e Historial manteniendo el diseño responsive de Espejo: Homologa.

## Verificación
- Se revisará el resultado mediante compilación automática y lectura de errores.
- No se ejecutarán pruebas manuales ni llamadas reales a Gemini, siguiendo la solicitud de ahorro de créditos.
