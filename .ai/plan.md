# Plan de Ejecución (.ai/plan.md)

Este documento detalla el plan paso a paso ajustado para implementar la arquitectura "Tower-Pilot-Example" con integración de Cloudflare Workflows y control centralizado en Pilot.

## Fases del Proyecto

### Fase 1: Backend - Orquestación y Workflows (Tower)
*   **Objetivo:** Crear el módulo de State Machine, integrar D1 y Cloudflare Workflows, y derivar solo eventos de steps.
*   **Tareas:**
    *   [ ] `task-01`: Definir esquema SQL de D1 para los steps y configurar bindings en `wrangler.jsonc` (incluyendo Workflows).
    *   [ ] `task-02`: Crear el módulo de Orquestación (Durable Object `StateMachineInstance`) enfocado en el estado del flujo.
    *   [ ] `task-03`: Integrar Cloudflare Workflows en la lógica de transición del State Machine.
    *   [ ] `task-04`: Actualizar el controlador WebSocket en Hono para enrutar selectivamente eventos de "steps" al State Machine.

### Fase 2: Frontend - Módulo Workflow en SDK (Pilot)
*   **Objetivo:** Construir el nuevo módulo en Pilot que gestione el ciclo de vida completo de los steps.
*   **Tareas:**
    *   [ ] `task-05`: Crear el módulo `src/core/workflow` en Pilot, similar al módulo `video`, para manejar el estado y eventos del flujo.
    *   [ ] `task-06`: Desarrollar el componente React principal en Pilot (`<PilotWorkflow />`) que recibe la librería de componentes, escucha al módulo de workflow, y gestiona el renderizado autónomo de los pasos.

### Fase 3: Implementación Visual (Example)
*   **Objetivo:** Inicializar el flujo desde la app cliente, cediendo el control a Pilot.
*   **Tareas:**
    *   [ ] `task-07`: Crear los componentes mock en Example (ej. `WelcomeStep`, `KYCStep`).
    *   [ ] `task-08`: Inicializar el módulo `<PilotWorkflow />` en Example pasándole el diccionario de componentes mock y verificar que Pilot tome el control.
    *   [ ] `task-09`: Pruebas E2E: validar transición de steps, persistencia del Durable Object, y ejecución del Cloudflare Workflow asociado.

## Criterios de Aceptación Globales
1.  **Delegación Selectiva:** Solo los eventos relacionados con la navegación/steps son procesados por el State Machine en Tower.
2.  **Integración Workflows:** Cloudflare Workflows es invocado correctamente por el State Machine durante las transiciones de pasos complejos.
3.  **Autonomía de Pilot:** Example no gestiona el estado del flujo; solo provee los componentes. Pilot decide qué renderizar basado en los comandos del backend y maneja las transiciones visuales.
