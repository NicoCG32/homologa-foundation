# 09 · Deploy y entorno

## Scripts

```sh
npm run dev        # servidor de desarrollo (puerto 8080)
npm run build      # build de producción
npm run build:dev  # build en modo desarrollo (usado por la verificación)
npm run preview    # sirve el build
npm run lint       # eslint
npm run format     # prettier
```

Verificación recomendada antes de publicar: `bunx tsgo --noEmit` (typecheck) y build sin errores.

## Variables de entorno

Gestionadas por la plataforma; no se editan a mano.

| Variable | Ámbito | Uso |
|----------|--------|-----|
| `SUPABASE_URL` | servidor | Endpoint de la base |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | Credencial con la que operan las server functions |
| `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID` | servidor | Metadatos del proyecto |
| `VITE_SUPABASE_*` | cliente | Configuración pública del cliente generado |
| `GEMINI_API_KEY` | servidor (secreto) | Análisis semántico |
| `GEMINI_MODEL` | servidor (opcional) | Modelo a usar; por defecto `gemini-3.6-flash` |

Las variables de servidor se leen **dentro** del handler de cada server function, nunca en el
ámbito del módulo.

## Publicación

El proyecto se publica desde Lovable. Una misma base de datos sirve a la vista previa y a la
aplicación publicada, por lo que un reinicio de datos afecta a ambas.

- Vista previa: `https://id-preview--520c32c6-6eaa-4ac9-8ce9-6c21e669e185.lovable.app`
- Publicada: `https://espejo-homologa.lovable.app`

## Desarrollo local

```sh
git clone <repo>
cd <repo>
npm i
npm run dev
```

Sin las variables de entorno del backend, las pantallas que leen datos fallarán: el desarrollo local
requiere las credenciales del proyecto.
