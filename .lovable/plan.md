# Integrar identidad principal por tema

## Cambios
- Incorporar `LightLogo.png` y `DarkLogo.png` como recursos de la aplicación.
- Crear una pieza reutilizable que muestre el logo claro por defecto y el oscuro cuando `<html>` tenga `.dark`.
- Sustituir el JPG de Bienvenida y la ilustración de Home por esta pieza.
- Reservar el mismo espacio antes de terminar la carga y mostrar un skeleton para evitar desplazamientos.
- Conservar sin cambios el isotipo `LogoEspejo` del menú lateral y la cabecera móvil.

## Presentación y adaptación
- Mantener la transparencia y proporción original con `object-fit: contain`, sin filtros ni recortes.
- Ajustar tamaños estables para escritorio, tablet y celular.
- Verificar ambos temas y tamaños de pantalla en la vista real.

## Detalles técnicos
- Los archivos se servirán como recursos CDN mediante sus punteros JSON.
- El cambio de variante se resolverá con CSS ligado a la clase `.dark` del documento, sin duplicar lógica de tema.
