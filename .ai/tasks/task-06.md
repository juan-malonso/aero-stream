# Task 06: Componente Gestor de Flujo en Pilot (.ai/tasks/task-06.md)

**Status:** `[DONE]`
**Task ID:** `task-06`
**Title:** Crear componente React principal de gestión de flujo en Pilot

## Descripción
En lugar de que la app Example renderice y controle, Pilot proveerá un componente React de alto nivel (ej. `<PilotWorkflow />`) que se encargará del renderizado automático del flujo hasta su finalización.

## Contexto Relevante
- Archivos en `apps/aero-stream-pilot/src/react/`

## Criterios de Aceptación
- [x] Se crea el componente `<PilotWorkflow library={stepLibrary} />`.
- [x] El componente se suscribe al `WorkflowManager` (Task 05).
- [x] Cuando el backend envía un comando de renderizar, el componente automáticamente monta el componente React correspondiente de la `library`.
- [x] Inyecta de forma transparente la función `commit()` o manejador de acciones a los componentes renderizados.

## Notas del Agente
- Se agregaron las dependencias `react` y `react-dom` a `aero-stream-pilot`.
- Se configuró `tsconfig.json` para soportar JSX (`"jsx": "react-jsx"`).
- Se creó `PilotWorkflow.tsx` y se exportó globalmente en `aero-stream-pilot`.
