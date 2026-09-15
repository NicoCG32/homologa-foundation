# 06 · Motor determinístico

`src/lib/motor.server.ts` — cálculo puro, sin IA y sin acceso a la base: mismas entradas, mismas
salidas. **El sueldo no participa.**

## Criterios comparables

| Campo | Comparación |
|-------|-------------|
| `nombre` | Similitud de palabras significativas |
| `descripcion` | Similitud de palabras significativas |
| `area` | Igualdad de código; si falta, similitud del nombre |
| `subarea` | Igualdad de código; si falta, similitud del nombre |
| `codigo_cargo` | Igualdad exacta normalizada |
| `nivel_jerarquico` | Igualdad de código; si no, similitud textual |
| `experiencia` | Similitud de la experiencia requerida |
| `requisitos` | Similitud de requisitos / formación |
| `tipo_empresa` | Mismo tamaño = 1 · adyacente = 0,5 · extremos = 0 |

Normalización: minúsculas, sin tildes, sin signos, descartando palabras de ≤ 2 letras.

## Cálculo

1. Se consideran los criterios activos con peso > 0, ordenados por nombre (orden estable).
2. Para cada candidato se evalúa cada criterio y se obtiene un puntaje 0–1, o `null` si falta el
   dato en alguno de los dos cargos.
3. `score = Σ(peso × puntaje) / Σ(pesos)`, redondeado a 4 decimales.
4. Orden final: score descendente y, a igualdad, nombre alfabético.

## Datos faltantes y descartes

- Un dato faltante **no se inventa**: se registra como diferencia ("Dato faltante en …") y aporta 0.
- Si un criterio **obligatorio** falta o no coincide, el candidato se descarta con el motivo exacto.
- La salida incluye `evaluados`, `preseleccionados` (con coincidencias y diferencias por criterio),
  `descartados` (con motivo) y `pesoTotal`.

## Ponderación

- La ponderación global vive en `criterios` y se edita en `/criterios`.
- Cada homologación puede sobrescribirla; los pesos efectivamente aplicados se guardan en
  `ejecuciones.criterios_usados`, de modo que cualquier ejecución del historial es reproducible.
- Peso 0 ⇒ la columna no se compara.
