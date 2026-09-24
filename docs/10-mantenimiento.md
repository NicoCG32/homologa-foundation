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

## Diagnóstico de la IA

| Síntoma | Causa habitual |
|---|---|
| "Consultando motor de respaldo…" aparece seguido | Gemini está devolviendo 503/429 por cuota o alta demanda; el respaldo Groq responde con el mismo esquema |
| El análisis falla en ambos proveedores | Faltan `GEMINI_API_KEY` y `GROQ_API_KEY`, o ambos superaron su cuota diaria |
| Aviso "se comparó el texto original" | La normalización de experiencia y formación no pudo ejecutarse; los scores siguen siendo válidos |
| El score final aparece "Pendiente" | Aún no hay análisis semántico válido para esa ejecución |

Ver [12 · Resiliencia de la IA](./12-resiliencia-ia.md).

## Qué conserva el reinicio de datos

También se conserva la caché de normalización que vive dentro de los cargos: al borrar los cargos,
esa caché desaparece con ellos y la siguiente carga vuelve a normalizar.
