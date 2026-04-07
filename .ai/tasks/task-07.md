# Task 07: Componentes Mock en Example (.ai/tasks/task-07.md)

**Status:** `[DONE]`
**Task ID:** `task-07`
**Title:** Definir componentes visuales mock en Example

## Descripción
Crear componentes React simples en la aplicación `aero-stream-pilot-example` que representen los pasos del flujo, usando la API inyectada para reportar acciones, sin preocuparse de qué paso sigue.

## Contexto Relevante
- Directorio: `apps/aero-stream-pilot-example/src/components/steps/`

## Criterios de Aceptación
- [x] Se crean al menos dos componentes (ej. `WelcomeStep`, `KYCStep`).
- [x] Ambos componentes aceptan una propiedad (inyectada por Pilot) para enviar su resultado, ej. `props.onSubmit(data)`.

## Notas del Agente
- Se crearon los componentes `WelcomeStep`, `KYCStep` y `DoneStep`.
- Se exportaron en `src/components/steps/index.ts`.
- Reciben `commit` desde las props (inyectadas por `PilotWorkflow`) y llaman a `commit('NEXT')` y `commit('SUBMIT', { name })` respectivamente.
