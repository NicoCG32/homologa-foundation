# Rectificación metodológica: homologación por contenido del cargo

Se evoluciona lo existente. No se reconstruye el proyecto, no se eliminan pantallas ni el histórico, y se mantiene el flujo: cargo interno → motor determinístico → candidatos → Gemini → decisión del analista → valorización salarial (etapa posterior).

## 1. El sueldo sale de la homologación

- El sueldo deja de ser un criterio comparable: se elimina de las opciones de criterio y de los cálculos del motor.
- Los criterios ya guardados que comparaban sueldo se conservan como registros, pero quedan desactivados y reasignados a un campo válido, para no romper el histórico.
- El sueldo sigue guardándose en cada cargo y mostrándose en las pantallas de cargos e historial, solo como dato informativo.
- Gemini sigue sin recibir ninguna información salarial (hoy ya no la recibe; se mantiene y se verifica).

## 2. Datos estructurales del cargo

Se agregan al cargo, todos opcionales, para no invalidar los cargos ya cargados:

- código de área y nombre de área
- código de subárea y nombre de subárea
- código del cargo
- nivel jerárquico / estamento
- experiencia requerida
- requisitos / formación

Se conservan tal cual: empresa, tipo (interno/referencia), nombre, descripción, sueldo y los 7 atributos semánticos (propósito, funciones, responsabilidades, conocimientos, complejidad, autonomía, alcance). No se agregan nuevas dimensiones metodológicas.

Los cargos de referencia no se fuerzan al mismo formato que los internos: todos los campos estructurales son opcionales y la relación entre ambos mundos ocurre por códigos y categorías cuando existen.

## 3. Motor determinístico

Sigue siendo puro, determinístico y solo para preseleccionar. Los criterios y pesos siguen viviendo en la base de datos, nunca en la interfaz.

Campos comparables disponibles para configurar criterios:

- nombre del cargo (texto)
- descripción (texto)
- área, subárea (coincidencia por código si ambos lo tienen; si no, comparación textual del nombre)
- código del cargo (coincidencia exacta)
- nivel jerárquico / estamento (igual, contiguo o distinto)
- experiencia requerida (texto)
- requisitos / formación (texto)
- tamaño de empresa (se mantiene como está)

Reglas actuales que se conservan sin cambios: dato faltante nunca cuenta como coincidencia, descarte solo por criterio obligatorio incumplido, score ponderado 0–1, orden estable por score y nombre.

## 4. Interfaz

- **Cargos**: el formulario y la tabla incorporan los campos estructurales, agrupados de forma simple; los atributos semánticos siguen en su bloque plegable.
- **Criterios**: la lista de campos comparables se actualiza (sin sueldo).
- **Nueva homologación** e **Historial**: sin cambios de estructura; el detalle de coincidencias/diferencias reflejará automáticamente los nuevos campos.

No se agregan dashboards, autenticación, scraping ni otras funcionalidades.

## 5. Preparación de la valorización (sin implementarla)

Solo se deja el terreno listo: el sueldo queda aislado del score, la ejecución y sus resultados conservan la referencia al cargo interno y a cada candidato, y el tamaño de empresa (P/M/G) ya está en cada empresa. Con eso, en una etapa siguiente se podrá agregar una pantalla donde el analista elija tamaño de empresa y estadígrafos (P25, P50, P75) y compare contra la remuneración real del cargo interno. Nada de eso se construye ahora.

## Detalle técnico

- Migración: nuevas columnas opcionales en `cargos` (`codigo_area`, `nombre_area`, `codigo_subarea`, `nombre_subarea`, `codigo_cargo`, `nivel_jerarquico`, `experiencia_requerida`, `requisitos_formacion`). Nuevo enum `criterio_campo` sin `sueldo` y con los campos estructurales; los criterios existentes con `campo = 'sueldo'` pasan a `activo = false` y `campo = 'nombre'`. `resultados`, `ejecuciones` y `analisis_semanticos` no se tocan.
- `src/lib/motor.server.ts`: se elimina `similitudSueldo` y el caso `sueldo`; se agregan evaluadores para código/área/subárea/nivel/experiencia/requisitos reutilizando la normalización textual existente.
- `src/lib/cargos.functions.ts` y `src/lib/criterios.functions.ts`: nuevos campos y nuevo conjunto de campos comparables.
- `src/lib/homologacion.functions.ts`: los `select` dejan de traer `sueldo` hacia el motor y suman los campos estructurales; el bloque de Gemini queda intacto (sigue leyendo solo `resultados` persistidos).
- `src/routes/cargos.tsx` y `src/routes/criterios.tsx`: formularios y tablas.

## Verificación final

Ejecutar una homologación con criterios estructurales y comprobar: preselección sin usar sueldo, cargos con sus datos estructurales guardados, Gemini recibiendo solo candidatos preseleccionados y sin datos salariales, y ejecuciones históricas abriéndose sin error. Los datos de prueba se eliminan al terminar.
