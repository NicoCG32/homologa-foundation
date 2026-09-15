# 10 · Mantenimiento y operación

## Reinicio de datos (fase de pruebas)

Desde **Inicio**, el panel "Reiniciar datos" exige escribir `ELIMINAR`.
Implementado en `src/lib/mantenimiento.functions.ts` (`limpiarDatos`).

Borra, en este orden: `resultados`, `analisis_semanticos`, `ejecuciones`, `bandas_salariales`,
`cargos`, `empresas`.
**Conserva:** `diccionario_entradas`, `criterios` y `presets_pesos`.

También existe borrado individual por fila en el listado de cargos y en empresas.

## Cambios de esquema

1. Escribir la migración en `supabase/migrations/` con nombre cronológico.
2. Cada `CREATE TABLE` en `public` debe incluir, en la misma migración: `GRANT` al rol de servicio,
   `ENABLE ROW LEVEL SECURITY` y sus políticas.
3. Regenerar `src/integrations/supabase/types.ts` (archivo generado; no editar a mano).

## Archivos que no se editan a mano

`src/integrations/supabase/client.ts`, `client.server.ts`, `types.ts`, `auth-*.ts`,
`previewAuthStorage.ts`, `src/routeTree.gen.ts`, `supabase/config.toml` y `.env`.

## Diagnóstico frecuente

| Síntoma | Causa habitual |
|---------|----------------|
| `JWT issued at future` al listar datos | Credencial interna del backend desfasada o vencida: renovarla y reiniciar la vista previa |
| El paso IA avisa que falta configuración | Falta el secreto `GEMINI_API_KEY` |
| Una empresa no aparece en comparaciones por tamaño | Tamaño sin definir: ajustarlo en Empresas |
| La carga se bloquea | Inconsistencia estructural: código o nombre faltante, código repetido o fila sin empresa |
| Un código de subárea aparece con aviso | El código no existe en el diccionario: corregir la planilla o agregar la entrada |

## Fuera de alcance (decisiones vigentes)

No implementar sin pedido explícito: valorización salarial completa, dashboards, scraping,
predicción salarial, recomendaciones de aumento ni autenticación de usuarios.
