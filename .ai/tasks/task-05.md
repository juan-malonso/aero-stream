# Task 05: Crear Módulo `workflow` en Pilot (.ai/tasks/task-05.md)

**Status:** `[DONE]`
**Task ID:** `task-05`
**Title:** Crear módulo workflow/steps en Pilot

## Descripción
Añadir un nuevo módulo en la librería `aero-stream-pilot` (similar al de `video`) que contenga la lógica para manejar eventos de flujo enviados desde Tower. Este módulo gestionará internamente qué componente sigue basado en las respuestas del backend.

## Contexto Relevante
- Directorio: `apps/aero-stream-pilot/src/core/workflow/`

## Criterios de Aceptación
- [x] Se crea la clase `WorkflowManager` o similar que procesa mensajes `RENDER_STEP`.
- [x] Mantiene un registro interno del paso actual.
- [x] Se expone un método para registrar la librería de componentes (`stepLibrary`).
- [x] Expone eventos de cambio de estado para que React pueda actualizarse.

## Notas del Agente
- Se creó `AeroStreamWorkflow` en `src/core/workflow/workflow.ts` para manejar el estado del paso, procesar mensajes de render y emitir eventos `change`.
- Se integró `AeroStreamWorkflow` dentro de `AeroStreamPilot`, el cual intercepta mensajes con `type === 'STEP_RENDER'` para actualizar el estado del workflow.
- Se agregaron las exportaciones correspondientes.
