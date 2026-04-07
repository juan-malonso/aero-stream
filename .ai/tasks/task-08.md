# Task 08: Inicializar Flujo en Example (.ai/tasks/task-08.md)

**Status:** `[DONE]`
**Task ID:** `task-08`
**Title:** Inicializar `<PilotWorkflow />` en Example

## Descripción
En la aplicación Example, simplemente configurar el diccionario de componentes y montar el gestor provisto por Pilot, delegando todo el control de navegación.

## Contexto Relevante
- Archivo: `apps/aero-stream-pilot-example/src/app/page.tsx` o similar.

## Criterios de Aceptación
- [x] Se define el objeto `stepLibrary` agrupando los componentes mock de la task-07.
- [x] Se renderiza `<PilotWorkflow library={stepLibrary} />` en la vista principal.
- [x] Example NO tiene estado de React sobre qué paso está activo (Pilot lo maneja internamente).

## Notas del Agente
- Se importaron los componentes de `/steps` y `PilotWorkflow` de `aero-stream-pilot` en `PilotConnection.tsx`.
- Se definió el diccionario `stepLibrary`.
- Se incluyó `PilotWorkflow` pasándole `pilotRef.current` como prop cuando la conexión está activa.
