# 04 · Base de datos

PostgreSQL gestionado por Lovable Cloud. Todas las tablas del esquema `public` tienen RLS activo y
permisos concedidos únicamente al rol de servicio: no son accesibles desde el navegador.

## Enums

| Enum | Valores |
|------|---------|
| `cargo_tipo` | `INTERNO`, `REFERENCIA` |
| `empresa_tipo` | `P`, `M`, `G` (Pequeña, Mediana, Grande) |
| `criterio_campo` | `nombre`, `descripcion`, `area`, `subarea`, `codigo_cargo`, `nivel_jerarquico`, `experiencia`, `requisitos`, `tipo_empresa` |
| `diccionario_tipo` | `AREA`, `SUBAREA`, `NIVEL` |
| `ejecucion_estado` | `PENDIENTE`, `EN_PROCESO`, `COMPLETADA`, `ERROR` |
| `semantico_estado` | `OK`, `ERROR` |

## Tablas

### `empresas`
`id`, `nombre`, `tipo` (`empresa_tipo`), `tamano` (`empresa_tipo`, nullable).
`tamano` nulo = tamaño pendiente de definir; la empresa queda fuera de comparaciones por tamaño.

### `cargos`
`id`, `empresa_id` → `empresas`, `tipo` (`cargo_tipo`), `nombre`, `descripcion`, `sueldo` (numérico,
nullable, **informativo**), `atributos_semanticos` (jsonb con 7 claves) y columnas estructurales
opcionales: `codigo_cargo`, `codigo_area`, `nombre_area`, `codigo_subarea`, `nombre_subarea`,
`codigo_nivel_jerarquico`, `nivel_jerarquico`, `experiencia_requerida`, `requisitos_formacion`.

Índice único parcial **`(empresa_id, tipo, codigo_cargo)` donde `codigo_cargo IS NOT NULL`**:
un `RRHH-001` interno y un `RRHH-001` de referencia de la misma empresa son registros distintos.

### `bandas_salariales`
`id`, `cargo_id` → `cargos`, `tipo_empresa`, `p25`, `p50`, `p75`, `promedio`, `fuente`, `anio`.
Único por `(cargo_id, tipo_empresa)`. Celda vacía en la planilla = `NULL` ("dato no disponible"),
nunca 0. `fuente` y `anio` se declaran al cargar la planilla de remuneraciones; si no se informan
quedan en `NULL` y el benchmark muestra "No disponible".


### `criterios`
`id`, `nombre`, `campo` (`criterio_campo`), `peso`, `activo`, `obligatorio`.

### `presets_pesos`
`id`, `nombre` (único), `pesos` (jsonb `{criterio_id: peso}`), `created_at`, `updated_at`.

### `diccionario_entradas`
`id`, `tipo` (`diccionario_tipo`), `codigo`, `nombre`, único por `(tipo, codigo)`.
Precargado con el diccionario de Recursos Humanos (1 área, 14 subáreas, 6 niveles).

### `ejecuciones`
`id`, `cargo_id` → `cargos`, `fecha`, `estado`, `criterios_usados` (jsonb: ponderación aplicada en
esa homologación, para reproducibilidad).

### `resultados`
`id`, `ejecucion_id` → `ejecuciones`, `candidato_id` → `cargos`, `score_deterministico`,
`score_semantico`, `score_final`.
`score_final` es híbrido y queda `NULL` mientras no exista análisis IA válido.

### `configuracion`
`clave` (PK), `valor` (jsonb), `updated_at`. Clave `pesos_score`: `{"motor": 70, "ia": 30}`,
ponderación del score final híbrido (debe sumar 100).

### `decisiones`
`id`, `ejecucion_id` → `ejecuciones` (**único**), `candidato_id` → `cargos`, `decision`,
`comentario`, `usuario`, `scores_utilizados` (jsonb con los tres scores al decidir),
`tamano_empresa` (tamaño elegido para el benchmark, nullable), `fecha`.
Una decisión por ejecución; no modifica ningún score.

### `decision_preseleccion`
`id`, `ejecucion_id` → `ejecuciones`, `candidato_id` → `cargos`, `scores_utilizados` (jsonb),
`created_at`. Único por `(ejecucion_id, candidato_id)`. Candidatos preseleccionados por el analista
antes de la decisión definitiva; no modifica ningún score.


### `analisis_semanticos`
`id`, `ejecucion_id`, `estado` (`OK`/`ERROR`), `modelo`, `prompt_version`, `candidatos_enviados`,
`respuesta_cruda`, `respuesta_validada`, `error_mensaje`.

## Relaciones

```text
empresas 1──n cargos 1──n bandas_salariales
                │
                ├── (INTERNO)   1──n ejecuciones 1──n resultados ──n─1 cargos (candidato)
                └── (REFERENCIA)                 1──1 analisis_semanticos
```

## Migraciones

Viven en `supabase/migrations/` y se aplican en orden cronológico. Cada `CREATE TABLE` en `public`
incluye sus `GRANT` al rol de servicio y habilita RLS en la misma migración.
