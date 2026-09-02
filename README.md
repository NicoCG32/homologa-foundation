# Homologa Foundation

Crea la base inicial de HOMOLOGA (nombre provisional) como un MVP funcional usando Lovable Cloud.

OBJETIVO

Construir únicamente la estructura mínima necesaria para probar este flujo:

Cargo interno

→ Motor determinístico

→ Candidatos preseleccionados

→ Gemini

→ Resultado

→ Decisión profesional

→ Comparación salarial

No implementes todavía el motor determinístico ni la integración con Gemini.

BASE DE DATOS MÍNIMA

Crea solo estas entidades:

1. empresas

- id

- nombre

- tipo: enum P / M / G

  P = Pequeña

  M = Mediana

  G = Grande

2. cargos

- id

- empresa_id

- tipo: INTERNO / REFERENCIA

- nombre

- descripción

- sueldo

El sueldo corresponde a la remuneración actual del cargo y debe almacenarse como valor numérico.

3. criterios

- id

- nombre

- peso

- activo

4. ejecuciones

- id

- cargo_id

- fecha

- estado

5. resultados

- id

- ejecucion_id

- candidato_id

- score_deterministico

- score_semantico

- score_final

RELACIONES

- Una empresa puede tener muchos cargos.

- Un cargo pertenece a una empresa.

- Una ejecución corresponde a un cargo interno.

- Una ejecución puede tener muchos resultados.

- Cada resultado corresponde a un cargo candidato.

REGLAS

- Usa Lovable Cloud.

- Mantén separadas base de datos, lógica de negocio y UI.

- No hardcodees criterios ni pesos en la interfaz.

- No generes datos ficticios.

- No agregues atributos que no sean necesarios para este MVP.

- Mantén la estructura preparada para ampliarla posteriormente.

- El sueldo debe mantenerse separado de los scores de homologación.

INTERFAZ MÍNIMA

Crea solamente:

- Inicio

- Empresas

- Cargos

- Criterios

- Nueva homologación

- Historial

La interfaz debe ser simple y funcional. No priorices diseño visual avanzado.

EN ESTA ETAPA NO CONSTRUIR

- Gemini

- motor determinístico

- importación Excel

- benchmark salarial avanzado

- extracción automática de encuestas

- predicción salarial

- recomendaciones de aumentos

- dashboards

- autenticación

- multiempresa avanzada

Solo construye la base mínima para implementar posteriormente el flujo de homologación.

Al finalizar, verifica que las relaciones entre empresas, cargos, ejecuciones y resultados funcionen correctamente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/520c32c6-6eaa-4ac9-8ce9-6c21e669e185).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
