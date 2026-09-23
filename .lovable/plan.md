# Reintentos ante errores transitorios de Gemini

## Qué cambia para el analista
Cuando Gemini esté saturado, la app reintenta sola hasta 3 veces antes de rendirse. Si aun así falla, se muestra: "Gemini se encuentra temporalmente con alta demanda (503). Los resultados determinísticos se conservan intactos." Los puntajes del motor no se tocan.

## Pasos
1. Nuevo helper pequeño `src/lib/gemini-retry.server.ts`:
   - `esTransitorio(error)`: detecta 500, 502, 503, 504, 429, "UNAVAILABLE", "high demand", "overload", "RESOURCE_EXHAUSTED" (en mensaje o en `status`/`code` del error).
   - `conReintentos(fn)`: 1 intento + hasta 3 reintentos, esperas 1s, 2s, 4s + jitter aleatorio 100–300 ms. Error no transitorio: falla inmediatamente. Devuelve el resultado o lanza el último error marcado como agotado.
2. `src/lib/semantica.server.ts` (`analizarConGemini`): envolver sólo la llamada `generateContent` con `conReintentos`. Si se agotan los reintentos por error transitorio, lanzar `SemanticoError` con el mensaje amigable; otros errores mantienen el mensaje actual. Sin cambios en temperatura, esquema, instrucciones ni payload.
3. `src/lib/normalizacion.server.ts` (`normalizarLote`): reemplazar el bucle actual (3 intentos, 1.5s/3s) por el mismo `conReintentos`, conservando el `NormalizacionError` y su texto.

## No se modifica
Motor determinístico, scores, pesos, benchmark, decisión, pantallas, base de datos.

## Verificación
- `bunx tsgo --noEmit` limpio y build OK.
- Prueba local sin llamar a Gemini: script con una función simulada que falla con 503 dos veces y luego responde (debe reintentar y tener éxito), otra que siempre da 503 (4 intentos y mensaje amigable) y otra con 400 (un solo intento).
