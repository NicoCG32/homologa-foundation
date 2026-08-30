# Motor determinístico de HOMOLOGA

Se implementa el cálculo determinístico sobre la estructura existente: cargo interno → cargos de referencia → criterios configurados → descartes → score → orden. Sin IA, sin datos inventados, sin datos faltantes tratados como coincidencia.

## Cambios en la base de datos

Tabla `criterios` se amplía con dos campos configurables:

- `campo`: qué atributo compara el criterio. Valores: `nombre`, `descripcion`, `sueldo`, `tipo_empresa`.
- `obligatorio`: si el candidato queda descartado cuando ese criterio no se cumple.

Los criterios ya cargados se mantienen; solo se configuran estos dos campos (`campo` por defecto `nombre`, `obligatorio` por defecto falso). No se borra ni se altera ningún criterio existente, y el motor nunca los modifica.

No se agregan columnas a `resultados`: se guardan únicamente los candidatos preseleccionados con su `score_deterministico`. Las coincidencias, diferencias y motivos de descarte se muestran en pantalla al ejecutar.

## Lógica del motor

Nueva capa de lógica en `src/lib/motor.server.ts` (cálculo puro) usada por una server function en `src/lib/homologacion.functions.ts`. La UI no contiene criterios, pesos ni fórmulas.

Para cada cargo de referencia (todos los cargos de tipo REFERENCIA distintos del interno), se evalúa cada criterio activo:

- `nombre` / `descripcion`: comparación textual normalizada (minúsculas, sin acentos ni puntuación) por palabras significativas; el puntaje del criterio es la proporción de palabras del cargo interno presentes en el candidato.
- `sueldo`: cercanía relativa entre ambos sueldos; a mayor diferencia porcentual, menor puntaje, y llega a cero cuando la diferencia supera el 50%.
- `tipo_empresa`: 1 si ambas empresas son del mismo tamaño (P/M/G), y valor parcial 0.5 si son tamaños contiguos.

Reglas de datos faltantes: si el cargo interno o el candidato no tiene el dato del criterio, ese criterio no aporta puntaje (nunca cuenta como coincidencia) y se registra como diferencia. Si además el criterio es obligatorio, el candidato queda descartado con el motivo correspondiente.

Descartes: solo por criterios obligatorios no cumplidos (dato ausente o puntaje del criterio igual a cero). El motivo indica el criterio y la causa.

Score final: suma ponderada de los puntajes por criterio dividida por la suma de los pesos activos, expresada de 0 a 1. Sin pesos activos o sin criterios activos, no se preselecciona a nadie y se informa en pantalla. El cálculo es puro y determinístico: mismo cargo, mismos datos y mismos criterios producen siempre el mismo resultado y el mismo orden (empates se resuelven por nombre del candidato).

Al ejecutar: se crea la ejecución, se borran resultados previos de esa ejecución, se insertan los preseleccionados con su score y la ejecución queda en estado `COMPLETADA`. Si algo falla, queda en `ERROR`.

## Interfaz

En **Criterios** se agregan los dos campos nuevos al formulario y a la tabla (campo comparado y obligatorio), para poder configurarlos.

En **Nueva homologación**, al ejecutar se muestra en la misma página:

1. Cargo analizado (nombre, empresa, sueldo, descripción).
2. Candidatos encontrados (total evaluado).
3. Candidatos descartados con su motivo.
4. Candidatos preseleccionados ordenados por score, con score, coincidencias y diferencias por criterio.

Se mantiene el enlace al detalle de la ejecución en el historial, que ya muestra los resultados guardados y la comparación salarial. No se agregan otras funcionalidades.

## Verificación

Se cargan una empresa con un cargo interno y varios de referencia más criterios (uno obligatorio), se ejecuta la homologación y se comprueba: descartes con motivo, orden por score, persistencia de los preseleccionados en el historial y que dos ejecuciones seguidas den resultados idénticos.
