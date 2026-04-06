# Task 06: Componente Gestor de Flujo en Pilot (.ai/tasks/task-06.md)

**Status:** `[TODO]`
**Task ID:** `task-06`
**Title:** Crear componente React principal de gestión de flujo en Pilot

## Descripción
En lugar de que la app Example renderice y controle, Pilot proveerá un componente React de alto nivel (ej. `<PilotWorkflow />`) que se encargará del renderizado automático del flujo hasta su finalización.

## Contexto Relevante
- Archivos en `apps/aero-stream-pilot/src/react/`

## Criterios de Aceptación
- [ ] Se crea el componente `<PilotWorkflow library={stepLibrary} />`.
- [ ] El componente se suscribe al `WorkflowManager` (Task 05).
- [ ] Cuando el backend envía un comando de renderizar, el componente automáticamente monta el componente React correspondiente de la `library`.
- [ ] Inyecta de forma transparente la función `commit()` o manejador de acciones a los componentes renderizados.

## Notas del Agente
[El agente llenará esto cuando asuma la tarea]
