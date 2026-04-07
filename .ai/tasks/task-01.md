# Task 01: Configurar D1 y Cloudflare Workflows (.ai/tasks/task-01.md)

**Status:** `[DONE]`
**Task ID:** `task-01`
**Title:** Definir esquema SQL de D1 y configurar bindings (incluyendo Workflows)

## Descripción
Crear el esquema de base de datos inicial para soportar los flujos (workflows) y pasos (steps). Configurar la integración de D1 y Cloudflare Workflows en el archivo `wrangler.jsonc` de `aero-stream-tower`.

## Contexto Relevante
- Archivo: `apps/aero-stream-tower/wrangler.jsonc`
- La tabla de D1 debe soportar la configuración del step y metadatos sobre qué CF Workflow lanzar.

## Criterios de Aceptación
- [x] Se añade el binding de D1 en `wrangler.jsonc`.
- [x] Se añade el binding de Cloudflare Workflows (clase Workflow) en `wrangler.jsonc`.
- [x] Se crea un archivo `.sql` con la tabla `workflow_steps`.
- [x] La tabla incluye `step_id`, `component_name`, `base_props` (JSON), `transition_logic` (JSON), y opcionalmente `trigger_workflow_name`.

## Notas del Agente
- Se actualizó `wrangler.jsonc` añadiendo los arreglos `d1_databases` y `workflows`.
- Se creó la migración en `apps/aero-stream-tower/migrations/0001_workflow_steps.sql` con la estructura requerida y datos de prueba.
