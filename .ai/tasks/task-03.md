# Task 03: Integrar Cloudflare Workflows (.ai/tasks/task-03.md)

**Status:** `[TODO]`
**Task ID:** `task-03`
**Title:** Integrar Cloudflare Workflows en las transiciones

## Descripción
Modificar el `StateMachineInstance` para que, cuando la lógica de transición (en D1) lo indique, dispare un Cloudflare Workflow para manejar tareas asíncronas de backend antes de permitir el avance al siguiente paso.

## Contexto Relevante
- Documentación de Cloudflare Workflows.
- Módulo de Orquestación en Tower.

## Criterios de Aceptación
- [ ] Se define una clase base o esqueleto para el Cloudflare Workflow (ej. `StepProcessorWorkflow`).
- [ ] Cuando `StateMachineInstance` evalúa una transición, revisa si debe disparar el Workflow.
- [ ] Si se requiere, invoca la API del binding de Workflows (`env.MY_WORKFLOW.create()`).

## Notas del Agente
[El agente llenará esto cuando asuma la tarea]
