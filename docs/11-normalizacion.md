# 11 · Normalización de experiencia y formación

`src/lib/normalizacion.server.ts`. Versión: `norm-1`.

Experiencia y formación llegan como texto libre ("5 años en RRHH", "Ingeniero Comercial o afín",
"Titulado universitario, deseable magíster"). Compararlos como cadenas produce falsos negativos. La
normalización convierte ese texto en una **ficha mínima** antes de que el motor compare.

## Qué hace la IA aquí

**Sólo traduce.** No decide equivalencias, no puntúa, no infiere lo que no está escrito. Lo que no
aparece en el texto queda en `null` o en lista vacía. El texto original **nunca se modifica**.

## Ficha mínima

```json
{
  "experiencia": { "min_anios": 5, "max_anios": null, "areas": ["recursos humanos"] },
  "formacion":   { "nivel": "universitario", "areas": ["administración"],
                   "carreras": ["ingeniería comercial"] }
}
```

| Campo | Regla |
|---|---|
| `min_anios` / `max_anios` | Número entre 0 y 60, o `null` |
| `areas`, `carreras` | Lista de textos limpios; vacía si no hay dato |
| `nivel` | Nivel educacional declarado, o `null` |

## Caché por huella

`huellaTexto(experiencia, formacion)` genera una huella estable del texto original. La ficha se
guarda dentro de `cargos.atributos_semanticos` bajo la clave `_norm`, junto con la versión y la
huella.

```text
¿existe _norm con la misma versión y la misma huella?
   sí  →  se reutiliza, sin llamar a la IA
   no  →  se normaliza en lote y se guarda
```

Así, reprocesar el mismo catálogo no consume cuota: sólo se normaliza lo nuevo o lo que cambió de
texto.

## Cómo la usa el motor

Los criterios `experiencia` y `requisitos` comparan primero la ficha normalizada —solape de rangos
de años, coincidencia de áreas, nivel de formación— y usan el texto original como respaldo cuando la
ficha no está disponible.

## Degradación

Si la normalización falla (cuota, red, respuesta inválida en ambos proveedores), la homologación
**no se detiene**: el motor compara el texto original y la pantalla muestra el aviso
*"No fue posible normalizar experiencia y formación; se comparó el texto original"*. Los scores
siguen siendo reproducibles para las mismas entradas.
