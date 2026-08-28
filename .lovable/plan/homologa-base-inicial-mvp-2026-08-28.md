# HOMOLOGA — Base inicial (MVP)

Estructura mínima para soportar el flujo: cargo interno → motor determinístico → candidatos → Gemini → resultado → decisión → comparación salarial. En esta etapa solo se construyen datos + UI de gestión, sin motor ni Gemini.

## Backend (Lovable Cloud)

Se habilita Lovable Cloud y se crea una migración con estas tablas:

- `empresas`: id, nombre, tipo (enum `P` | `M` | `G`)
- `cargos`: id, empresa_id → empresas, tipo (enum `INTERNO` | `REFERENCIA`), nombre, descripcion, sueldo (numérico, independiente de los scores)
- `criterios`: id, nombre, peso (numérico), activo (booleano)
- `ejecuciones`: id, cargo_id → cargos (cargo interno), fecha, estado (enum `PENDIENTE` | `EN_PROCESO` | `COMPLETADA` | `ERROR`)
- `resultados`: id, ejecucion_id → ejecuciones, candidato_id → cargos, score_deterministico, score_semantico, score_final (todos numéricos y nullable hasta que exista el motor)

Sin columnas extra. Borrado en cascada de cargos al eliminar una empresa y de resultados al eliminar una ejecución.

Acceso: como no hay autenticación en esta etapa, las tablas quedan con RLS activo y políticas abiertas de lectura/escritura, más los GRANT correspondientes. Cuando se agregue autenticación, esas políticas se reemplazan por políticas por usuario/empresa.

No se insertan datos ficticios: todo se carga desde la UI.

## Capa de lógica

Server functions en `src/lib/*.functions.ts` (una por entidad) con validación Zod: listar, crear, actualizar y eliminar. La UI nunca consulta la base directamente ni contiene criterios ni pesos hardcodeados; los criterios y sus pesos se leen siempre desde la tabla `criterios`.

## Interfaz (rutas)

- `/` Inicio: descripción del flujo y accesos a las secciones.
- `/empresas`: tabla + formulario de alta/edición (nombre, tipo P/M/G).
- `/cargos`: tabla con filtro por empresa y tipo; formulario (empresa, tipo, nombre, descripción, sueldo).
- `/criterios`: tabla + formulario (nombre, peso, activo).
- `/homologacion/nueva`: selección de un cargo INTERNO; crea una ejecución en estado `PENDIENTE` y redirige a su detalle. El cálculo queda para la siguiente etapa.
- `/historial`: lista de ejecuciones (cargo, empresa, fecha, estado) con detalle que muestra los resultados asociados y una comparación de sueldo entre el cargo interno y cada candidato.

Estilo simple y funcional con los componentes existentes; navegación común en el layout raíz.

## Verificación final

Con datos cargados manualmente desde la UI se comprueba: empresa → sus cargos, ejecución ligada a un cargo interno, resultados ligados a esa ejecución y a un cargo candidato, y que las cascadas y los filtros funcionen.
