# Skeleton loading en toda la plataforma

## Objetivo
Reemplazar los textos y espacios vacíos durante cargas de datos o IA por skeletons con shimmer suave, conservando el tamaño final de cada bloque y sin cambiar lógica ni flujo.

## Implementación
- Crear componentes reutilizables para skeletons de líneas, tarjetas, tablas, métricas y paneles.
- Usar los mismos grids, alturas y anchos de las vistas finales para evitar saltos al terminar la carga.
- Aplicarlos en Inicio, selección y candidatos de homologación, análisis IA, decisión, benchmark, Cargos, Empresas, Criterios, Diccionario, Historial y detalle de historial.
- Durante el análisis IA, mantener el mensaje de avance accesible y reservar debajo el espacio de la tabla de resultados con skeletons.
- Durante acciones largas ya existentes, mostrar una zona skeleton dentro del contenido afectado; mantener el texto del botón bloqueado como confirmación de la acción.
- Definir colores exclusivamente con variables del tema y un shimmer discreto compartido para modos claro y oscuro.
- Desactivar por completo la animación con `prefers-reduced-motion`, conservando la forma estática del skeleton.
- Mantener estados vacíos y errores actuales sin cambios.

## Verificación
- Revisar escritorio y celular en modo claro y oscuro.
- Confirmar que las cargas preservan dimensiones, no muestran spinners y no alteran cálculos, datos ni navegación.
- Comprobar que la aplicación queda sin errores.
