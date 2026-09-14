# Diccionario, carga automática de las tres planillas y tamaño de empresa pendiente

## Objetivo
Que puedas subir los tres Excel adjuntos y que todo quede cargado solo: cargos, empresas, bandas salariales y el diccionario de Área, Subárea y Nivel jerárquico, sin crear nada a mano.

## 1. Nueva pestaña Diccionario
- Tres listas editables: **Áreas**, **Subáreas** y **Niveles jerárquicos**, cada una con código y nombre.
- Parte precargada con los valores de tu imagen: Recursos Humanos (1); las 14 subáreas (Dirección 1 … Prevención y Seguridad Laboral 14); y los 6 niveles (Ejecutivo 1 … Operario 6).
- Puedes agregar, editar y eliminar filas. No se permite repetir un código dentro de la misma lista.
- Eliminar una entrada usada por cargos ya cargados avisa cuántos cargos la usan y pide confirmación; los cargos no se modifican.

## 2. Las tres planillas se leen tal cual vienen
Hoy la lectura exige la columna "ID Cargo" y por eso **Cargos_Empresa** falla. Se amplía el lector:

- **Cargos_Empresa (hoja BD)**: Empresa, Código del cargo, Código Área, Nombre del cargo, Código Subárea, Nivel jerárquico (código), Dependencia organizacional, Objetivo del cargo, Funciones principales, Responsabilidades, Requisitos de formación, Experiencia requerida, Rem. Bruta Mensual.
  - Objetivo, Funciones y Responsabilidades se guardan como atributos semánticos (propósito, funciones, responsabilidades).
  - La remuneración se guarda como sueldo informativo (no participa en la homologación).
  - Los códigos de área, subárea y nivel se traducen a nombre usando el Diccionario.
- **Encuesta_Piloto (hoja Encuesta)**: se lee como hoy, con código y nombre de área, subárea y nivel.
- **Encuesta_Piloto_Remuneraciones**: bandas P25/P50/P75/PP por tamaño, cruzadas por ID Cargo.
- Se aceptan hojas con filas de título antes del encabezado y también la hoja "Diccionario" si viene dentro del archivo (en ese caso se ofrece actualizar el diccionario con ella).

## 3. Incoherencias: siempre se avisan, nunca se adivinan
Antes de guardar, la vista previa lista los problemas con fila, código y explicación, por ejemplo:
- Código de subárea que no existe en el diccionario.
- Código que existe pero con un nombre distinto al de la planilla.
- Código de cargo repetido dentro del mismo archivo.

Cada aviso indica qué corregir (la planilla o el diccionario). Las filas con incoherencia no se guardan; el resto sí, y el botón de guardar sigue pidiendo la confirmación de revisión.

## 4. Tamaño de empresa pendiente
- Las empresas creadas automáticamente desde una planilla sin columna de tamaño quedan **sin tamaño definido**.
- En **Empresas** aparecen con un símbolo de advertencia y un texto que pide definir si es Pequeña, Mediana o Grande; se ajusta ahí mismo.
- Mientras estén sin tamaño, quedan fuera de cualquier análisis o comparación que dependa del tamaño de empresa (bandas salariales por tamaño), y eso se indica en pantalla.
- Si la planilla sí trae Tamaño, se usa ese valor y no aparece advertencia.

## 5. Datos ya cargados
- Nada se borra. Las empresas y cargos existentes se conservan.
- Los cargos se siguen actualizando por empresa + código de cargo en lugar de duplicarse.
- El diccionario precargado no pisa datos existentes: si un código ya está con otro nombre, se avisa y decides tú.

## Detalles técnicos
- Migración: tabla `diccionario_entradas` (tipo AREA/SUBAREA/NIVEL, código, nombre, único por tipo+código) con sus GRANT y RLS cerrada a service_role, más los INSERT de precarga en la misma migración; columna nueva `empresas.tamano` (`empresa_tipo`, nullable) con backfill desde `tipo`. El código pasa a leer `tamano`; `tipo` se deja de usar sin eliminarse.
- `src/lib/diccionario.functions.ts`: listar, crear, actualizar, eliminar (con conteo de uso).
- `src/routes/diccionario.tsx`: nueva ruta con las tres listas; enlace en la navegación lateral (grupo gestión).
- `src/lib/cargos-import.ts`: detección de encabezado flexible (ID Cargo o Código del cargo), mapeo del formato BD, resolución de códigos contra el diccionario y devolución de incoherencias por fila.
- `src/lib/cargos.functions.ts`: `importarCargos` recibe el tamaño opcional; crea empresas con `tamano` nulo cuando no viene.
- `src/routes/empresas.tsx`: indicador de advertencia y selector de tamaño.
- No se tocan el motor determinístico, el análisis semántico ni las reglas de remuneración.

## Verificación
Compilación y revisión de errores, más una carga de prueba de los tres archivos; sin llamadas a Gemini.
