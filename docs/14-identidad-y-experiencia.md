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
- Isotipo vectorial (`logo-espejo.tsx`: dos prismas enfrentados) en navegación y cabecera móvil;
  sus degradados salen de tokens `--logo-*`, por lo que se adapta a claro y oscuro. La portada usa
  la ilustración `EspejoPrismas` y fondos con halos `--amb-*`.
- El logotipo oficial se conserva en la pantalla de bienvenida (`bienvenida.tsx`), una vez por
  sesión, con "Haz clic para comenzar"; también es el favicon.
- Tipografía: Urbanist en títulos, Epilogue en texto, cifras tabulares en montos y percentiles.
- Scores con distintivos en degradado: turquesa (alta), ámbar (media), pizarra (baja). Sin rojo.

## Modo claro y oscuro

Switch accesible (`role="switch"`) en el pie del menú lateral y en la cabecera móvil. El tema se
aplica antes del primer pintado (sin parpadeo), se guarda en `localStorage` (`espejo-tema`) y parte
de `prefers-color-scheme`. `.dark` declara `color-scheme: dark` para que campos, listas y barras
nativas hereden el tema; todo texto usa tokens, nunca negro fijo. Contrastes WCAG AA como mínimo.

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

## Orientación durante la homologación

- Cápsula contextual fija (sticky) desde el paso 1 con el cargo evaluado y "Paso X de 5".
- Bloques extensos (desglose de coincidencias, descartados, vista espejo) plegados por defecto.
- Botones que se bloquean mientras procesan; el análisis IA se ejecuta **una sola vez**: tras
  completarse el botón desaparece y queda "Continuar a la decisión".
- Mensajes de espera por etapas con `aria-live`, y explicación clara cuando falta una banda salarial.

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
