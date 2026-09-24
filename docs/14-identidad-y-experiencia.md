# 14 · Identidad visual y experiencia

Este documento fija los criterios que separan la plataforma de una aplicación genérica. Es de
lectura obligada antes de modificar cualquier pantalla.

## La metáfora: espejo

El producto pone un cargo interno frente a su **reflejo** en el mercado. La consecuencia de diseño es
concreta: cuando se comparan dos cargos, ambos tienen la **misma jerarquía visual**, en columnas
enfrentadas, con los mismos campos en el mismo orden. Ninguno se presenta como subordinado del otro.

## Paleta y tono

- Azul marino como base institucional, azul eléctrico para la acción principal y turquesa como
  acento de confirmación; degradados suaves, fondos claros, superficies translúcidas.
- Todos los colores viven como tokens semánticos en `src/styles.css`. **Nunca** se escriben colores
  fijos en los componentes: rompen el tema y el modo oscuro.
- Logotipo oficial en la navegación y el encabezado, sin redibujarlo ni alterar sus proporciones.

## Vocabulario

Lenguaje de compensaciones, no de software. Se dice *cargo*, *catálogo*, *banda*, *analista*,
*homologación*. No se dice *registro*, *endpoint*, *payload*, *bundle* ni nombres de archivos. Los
mensajes de error explican **qué pasó** y **qué hacer**, no la causa técnica.

## Los seis pilares del núcleo

| Pilar | Cómo se aplica |
|---|---|
| **Identidad** | Comparaciones lado a lado; el espejo como estructura, no como adorno |
| **UX** | Flujo por pasos con contexto permanente del cargo evaluado y retorno libre a pasos anteriores |
| **Robustez percibida** | Validación antes de escribir, confirmaciones explícitas, avisos con enlace a la pestaña que resuelve el problema |
| **Control** | El analista pondera, preselecciona y decide; la IA sugiere y se etiqueta como tal |
| **Accesibilidad** | Contraste alto, jerarquía tipográfica clara, detalle largo plegado tras "Mostrar detalle" |
| **Responsive** | Escritorio, tablet y celular; tablas que se apilan con etiquetas en pantallas angostas |

## Estados que siempre deben ser explícitos

| Estado | Cómo se comunica |
|---|---|
| Calculado | Valor visible con su escala |
| Pendiente | "Pendiente" — nunca un 0 ni un guion ambiguo |
| No disponible | "No disponible" — el dato no existe en la fuente |
| En proceso | Texto de progreso real ("Analizando compatibilidad…") |
| Error | Qué falló, qué sigue siendo válido y qué puede hacer el analista |

## Prevención de errores

- Antes de guardar una carga masiva: resumen de validación y confirmación explícita.
- Antes de un borrado total: escribir `ELIMINAR` de forma exacta.
- Antes de homologar: si falta catálogo, criterios o ponderación, un aviso indica **qué falta** y
  **a qué pestaña ir**, con enlace directo.
- Al eliminar una entrada del diccionario en uso: se informa cuántos cargos la usan.

## Libertad dentro de la metodología

El analista puede ajustar la ponderación sólo para una homologación sin alterar la configuración
global, guardar presets con nombre, excluir un criterio poniéndolo en 0%, marcar criterios
obligatorios, preseleccionar cuantos candidatos quiera y volver atrás en cualquier paso. Lo que no
puede hacer es inventar datos: esa restricción es del producto, no del usuario.
