# Documentación — Espejo: Homologa

Documentación técnica y funcional del piloto. Cada archivo cubre una capa del sistema y puede
leerse por separado. Si es tu primer contacto con el proyecto, el orden recomendado es
**01 → 02 → 03** y después el resto según necesidad.

## Índice

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Arquitectura](./01-arquitectura.md) | Stack, capas, límites cliente/servidor, estructura de carpetas |
| 02 | [Funcionalidades](./02-funcionalidades.md) | Qué hace cada pestaña de la aplicación |
| 03 | [Flujo de homologación](./03-flujo-homologacion.md) | Paso a paso del recorrido profesional y del cálculo |
| 04 | [Base de datos](./04-base-de-datos.md) | Tablas, enums, relaciones, índices y seguridad |
| 05 | [Importación de Excel](./05-importacion-excel.md) | Formatos aceptados, validación, empresas automáticas |
| 06 | [Motor determinístico](./06-motor-deterministico.md) | Criterios, pesos, descartes y cálculo del score |
| 07 | [Análisis semántico](./07-analisis-semantico.md) | Contrato con la IA, restricciones y persistencia |
| 08 | [Dependencias](./08-dependencias.md) | Librerías usadas y para qué |
| 09 | [Deploy y entorno](./09-deploy-y-entorno.md) | Variables, secretos, publicación y desarrollo local |
| 10 | [Mantenimiento y operación](./10-mantenimiento.md) | Reinicio de datos, migraciones, diagnóstico |
| 11 | [Normalización de experiencia y formación](./11-normalizacion.md) | Ficha mínima, caché por huella, degradación |
| 12 | [Resiliencia de la IA](./12-resiliencia-ia.md) | Reintentos, proveedor de respaldo, mensajes al usuario |
| 13 | [Decisión, benchmark y exportación](./13-decision-benchmark-exportacion.md) | Dos etapas, mercado y salida a Excel |
| 14 | [Identidad visual y experiencia](./14-identidad-y-experiencia.md) | Metáfora del espejo, tono, estados y responsive |

## Principios que rigen el proyecto

1. **Sin datos ficticios.** Nada se inventa ni se completa automáticamente.
2. **El sueldo no homologa.** La remuneración es informativa; nunca entra al score ni a la IA.
3. **El motor manda.** La IA sólo interpreta candidatos ya preseleccionados por reglas.
4. **El código manda sobre el nombre.** Áreas, subáreas y niveles se identifican por código; se
   conserva el nombre original de cada fuente.
5. **La IA traduce, no juzga.** En la normalización convierte texto a datos; no decide equivalencias.
6. **Reproducibilidad.** La ponderación aplicada se guarda en cada ejecución.
7. **Separación estricta** entre base de datos, lógica de negocio y presentación.

## El núcleo obligatorio del producto

Identidad (espejo / reflejo) · UX guiada paso a paso · robustez percibida · control del analista ·
accesibilidad · responsive completo. Todo lo demás —autenticación, multiempresa, predicción
salarial, analítica avanzada, multilenguaje— es opcional y no está implementado.
