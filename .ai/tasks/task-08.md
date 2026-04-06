# Task 08: Inicializar Flujo en Example (.ai/tasks/task-08.md)

**Status:** `[TODO]`
**Task ID:** `task-08`
**Title:** Inicializar `<PilotWorkflow />` en Example

## Descripción
En la aplicación Example, simplemente configurar el diccionario de componentes y montar el gestor provisto por Pilot, delegando todo el control de navegación.

## Contexto Relevante
- Archivo: `apps/aero-stream-pilot-example/src/app/page.tsx` o similar.

## Criterios de Aceptación
- [ ] Se define el objeto `stepLibrary` agrupando los componentes mock de la task-07.
- [ ] Se renderiza `<PilotWorkflow library={stepLibrary} />` en la vista principal.
- [ ] Example NO tiene estado de React sobre qué paso está activo (Pilot lo maneja internamente).

## Notas del Agente
[El agente llenará esto cuando asuma la tarea]
