# Task 03: Integrar Cloudflare Workflows (.ai/tasks/task-03.md)

**Status:** `[DONE]`
**Task ID:** `task-03`
**Title:** Integrar Cloudflare Workflows en las transiciones

## Descripción
Modificar el `StateMachineInstance` para que, cuando la lógica de transición (en D1) lo indique, dispare un Cloudflare Workflow para manejar tareas asíncronas de backend antes de permitir el avance al siguiente paso.

## Contexto Relevante
- Documentación de Cloudflare Workflows.
- Módulo de Orquestación en Tower.

## Criterios de Aceptación
- [x] Se define una clase base o esqueleto para el Cloudflare Workflow (ej. `StepProcessorWorkflow`).
- [x] Cuando `StateMachineInstance` evalúa una transición, revisa si debe disparar el Workflow.
- [x] Si se requiere, invoca la API del binding de Workflows (`env.MY_WORKFLOW.create()`).

## Notas del Agente
- Se creó `StepProcessorWorkflow` en `src/domain/models/step-processor.workflow.ts` y se exportó en `index.ts`.
- Se integró D1 en `StateMachineInstance` en `fetch` (`/init` y `/event`).
- Se añadió la lógica de evaluación de transiciones desde `transition_logic`.
- Si `trigger_workflow_name` está presente, llama a `this.env.STEP_PROCESSOR.create()`.
