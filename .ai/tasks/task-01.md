# Task 01: Configurar D1 y Cloudflare Workflows (.ai/tasks/task-01.md)

**Status:** `[TODO]`
**Task ID:** `task-01`
**Title:** Definir esquema SQL de D1 y configurar bindings (incluyendo Workflows)

## Descripción
Crear el esquema de base de datos inicial para soportar los flujos (workflows) y pasos (steps). Configurar la integración de D1 y Cloudflare Workflows en el archivo `wrangler.jsonc` de `aero-stream-tower`.

## Contexto Relevante
- Archivo: `apps/aero-stream-tower/wrangler.jsonc`
- La tabla de D1 debe soportar la configuración del step y metadatos sobre qué CF Workflow lanzar.

## Criterios de Aceptación
- [ ] Se añade el binding de D1 en `wrangler.jsonc`.
- [ ] Se añade el binding de Cloudflare Workflows (clase Workflow) en `wrangler.jsonc`.
- [ ] Se crea un archivo `.sql` con la tabla `workflow_steps`.
- [ ] La tabla incluye `step_id`, `component_name`, `base_props` (JSON), `transition_logic` (JSON), y opcionalmente `trigger_workflow_name`.

## Notas del Agente
[El agente llenará esto cuando asuma la tarea]
